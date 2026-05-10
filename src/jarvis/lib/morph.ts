/**
 * Shape-fingerprinting and morphing utilities for the Ship-of-Theseus
 * draw effect.
 *
 * When the user asks for a high-quality drawing, we render a fast Gemini
 * sketch first and then progressively replace each rough stroke with the
 * matching polished Quiver stroke as it streams in. `morph.ts` provides:
 *
 *  - `fingerprintShape` / `fingerprintPathPoints` — a tiny invariant for
 *    a stroke (centroid + path length + bbox).
 *  - `findBestMatch` — pick the rough shape that best aligns with a new
 *    polished path.
 *  - `morphShape` — animate the lerp from old points → new points,
 *    re-anchoring the shape's origin each frame.
 */

import { b64Vecs, Editor, TLDrawShape, TLShapeId, type VecModel } from 'tldraw'

export interface ShapeFingerprint {
	centroidX: number
	centroidY: number
	pathLengthPx: number
	bboxW: number
	bboxH: number
}

/** Compute a fingerprint for an existing draw shape on the canvas. */
export function fingerprintShape(editor: Editor, shapeId: TLShapeId): ShapeFingerprint | null {
	const shape = editor.getShape(shapeId) as TLDrawShape | undefined
	if (!shape || shape.type !== 'draw') return null

	const localPoints: VecModel[] = []
	for (const segment of shape.props.segments) {
		localPoints.push(...b64Vecs.decodePoints(segment.path))
	}
	if (localPoints.length === 0) return null

	const pagePoints = localPoints.map((p) => ({ x: p.x + shape.x, y: p.y + shape.y }))
	return fingerprintPathPoints(pagePoints)
}

/** Compute a fingerprint from a raw list of (page-coord) points. */
export function fingerprintPathPoints(points: { x: number; y: number }[]): ShapeFingerprint {
	if (points.length === 0) {
		return { centroidX: 0, centroidY: 0, pathLengthPx: 0, bboxW: 0, bboxH: 0 }
	}
	let minX = Infinity,
		minY = Infinity,
		maxX = -Infinity,
		maxY = -Infinity
	let sumX = 0,
		sumY = 0
	for (const p of points) {
		if (p.x < minX) minX = p.x
		if (p.y < minY) minY = p.y
		if (p.x > maxX) maxX = p.x
		if (p.y > maxY) maxY = p.y
		sumX += p.x
		sumY += p.y
	}
	let length = 0
	for (let i = 1; i < points.length; i++) {
		const dx = points[i].x - points[i - 1].x
		const dy = points[i].y - points[i - 1].y
		length += Math.sqrt(dx * dx + dy * dy)
	}
	return {
		centroidX: sumX / points.length,
		centroidY: sumY / points.length,
		pathLengthPx: length,
		bboxW: maxX - minX,
		bboxH: maxY - minY,
	}
}

/** Score = 0.7 * normalized centroid distance + 0.3 * length similarity (lower is better). */
const CENTROID_NORM = 1000

export function findBestMatch(
	target: ShapeFingerprint,
	candidates: { id: TLShapeId; fp: ShapeFingerprint }[]
): TLShapeId | null {
	if (candidates.length === 0) return null
	let bestId: TLShapeId | null = null
	let bestScore = Infinity
	for (const c of candidates) {
		const dx = c.fp.centroidX - target.centroidX
		const dy = c.fp.centroidY - target.centroidY
		const dist = Math.sqrt(dx * dx + dy * dy)
		const distScore = Math.min(1, dist / CENTROID_NORM)
		const lenMax = Math.max(c.fp.pathLengthPx, target.pathLengthPx, 1)
		const lenDiff = Math.abs(c.fp.pathLengthPx - target.pathLengthPx)
		const lenScore = lenDiff / lenMax
		const score = 0.7 * distScore + 0.3 * lenScore
		if (score < bestScore) {
			bestScore = score
			bestId = c.id
		}
	}
	return bestId
}

/**
 * Resample a polyline so the output has exactly `n` points, evenly spaced
 * along the polyline's arc length. Linear interpolation between segments.
 */
export function resamplePoints(
	points: { x: number; y: number }[],
	n: number
): { x: number; y: number }[] {
	if (n < 2) n = 2
	if (points.length === 0) return []
	if (points.length === 1) {
		return new Array(n).fill(0).map(() => ({ ...points[0] }))
	}

	// Cumulative arc lengths.
	const cum: number[] = [0]
	for (let i = 1; i < points.length; i++) {
		const dx = points[i].x - points[i - 1].x
		const dy = points[i].y - points[i - 1].y
		cum.push(cum[i - 1] + Math.sqrt(dx * dx + dy * dy))
	}
	const total = cum[cum.length - 1]
	if (total === 0) {
		return new Array(n).fill(0).map(() => ({ ...points[0] }))
	}

	const out: { x: number; y: number }[] = []
	let segIdx = 0
	for (let i = 0; i < n; i++) {
		const target = (i / (n - 1)) * total
		while (segIdx < cum.length - 2 && cum[segIdx + 1] < target) segIdx++
		const segLen = cum[segIdx + 1] - cum[segIdx]
		const t = segLen === 0 ? 0 : (target - cum[segIdx]) / segLen
		const a = points[segIdx]
		const b = points[segIdx + 1]
		out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
	}
	return out
}

const FRAME_MS = 16
const DEFAULT_DURATION = 600
const MIN_RESAMPLE = 24
const MAX_RESAMPLE = 96

/**
 * Animate a draw shape morphing from its current segments to the given
 * (page-coordinate) target points. Called fire-and-forget by the morph
 * orchestrator as Quiver paths stream in.
 */
export async function morphShape(
	editor: Editor,
	shapeId: TLShapeId,
	newPagePoints: { x: number; y: number }[],
	opts: { durationMs?: number; onPenMove?: (x: number, y: number) => void } = {}
): Promise<void> {
	const duration = opts.durationMs ?? DEFAULT_DURATION
	const shape = editor.getShape(shapeId) as TLDrawShape | undefined
	if (!shape || shape.type !== 'draw') return
	if (newPagePoints.length < 2) return

	// Build the old polyline in page coords.
	const oldLocal: VecModel[] = []
	for (const segment of shape.props.segments) {
		oldLocal.push(...b64Vecs.decodePoints(segment.path))
	}
	if (oldLocal.length < 2) return

	const oldPage = oldLocal.map((p) => ({ x: p.x + shape.x, y: p.y + shape.y }))

	const N = Math.max(MIN_RESAMPLE, Math.min(MAX_RESAMPLE, Math.max(oldPage.length, newPagePoints.length)))
	const oldRes = resamplePoints(oldPage, N)
	const newRes = resamplePoints(newPagePoints, N)

	const start = performance.now()
	return new Promise<void>((resolve) => {
		const tick = () => {
			const elapsed = performance.now() - start
			const tRaw = Math.min(1, elapsed / duration)
			const t = tRaw * tRaw * (3 - 2 * tRaw) // smoothstep

			const lerped: { x: number; y: number }[] = new Array(N)
			let minX = Infinity,
				minY = Infinity
			for (let i = 0; i < N; i++) {
				const x = oldRes[i].x + (newRes[i].x - oldRes[i].x) * t
				const y = oldRes[i].y + (newRes[i].y - oldRes[i].y) * t
				lerped[i] = { x, y }
				if (x < minX) minX = x
				if (y < minY) minY = y
			}

			const segPoints: VecModel[] = lerped.map((p) => ({
				x: p.x - minX,
				y: p.y - minY,
				z: 0.55 + Math.random() * 0.35,
			}))

			editor.updateShape({
				id: shapeId,
				type: 'draw',
				x: minX,
				y: minY,
				props: {
					segments: [{ type: 'free', path: b64Vecs.encodePoints(segPoints) }],
					isComplete: tRaw >= 1,
				},
			})

			if (opts.onPenMove && N > 0) {
				const mid = lerped[Math.floor(N / 2)]
				opts.onPenMove(mid.x, mid.y)
			}

			if (tRaw < 1) {
				setTimeout(tick, FRAME_MS)
			} else {
				resolve()
			}
		}
		// Use rAF for the first frame, setTimeout afterwards to keep cadence smooth.
		requestAnimationFrame(tick)
	})
}
