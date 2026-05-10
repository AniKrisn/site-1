/**
 * Draw an SVG string onto a tldraw canvas as freehand `draw` shapes,
 * with a progressive hand-drawn reveal animation.
 *
 * Pipeline:
 *   SVG markup → parseSvgToStrokes() → list of Stroke (point arrays + color/fill)
 *               → for each stroke: createShape (partial), then progressively
 *                 update segments to reveal it.
 */

import {
	b64Vecs,
	createShapeId,
	Editor,
	TLDrawShapeSegment,
	TLShapeId,
	Vec,
	VecModel,
} from 'tldraw'
import { parseSvgToStrokes, type Stroke } from './svg-to-freehand'

/** Per-stroke animation duration when no cursor is following. */
const ANIMATION_DURATION_MS_DEFAULT = 250
/** Total target time for the whole drawing when a cursor is following. We
 * divide this across all strokes so a 5-stroke fish takes the same time as
 * a 30-stroke bull. */
const TOTAL_ANIMATION_MS_WITH_CURSOR = 7000
const MIN_STROKE_MS_WITH_CURSOR = 120
const ANIMATION_FRAME_MS = 16
const POINT_DENSIFY_MAX_GAP = 10

interface CreatedShape {
	id: TLShapeId
	/** Page-coordinate origin of the shape (its `x`, `y` props). */
	originX: number
	originY: number
	pendingAnimation: { segmentPoints: VecModel[]; isClosed: boolean } | null
}

export interface DrawSvgOptions {
	/** Page-coordinate origin for the top-left of the SVG viewBox. */
	originX: number
	originY: number
	/** Width to render the SVG at (height auto-scales by viewBox aspect). */
	width: number
	/** Hand-drawn progressive reveal. Defaults to true. */
	animate?: boolean
	/**
	 * Called on every animation frame with the current pen position in
	 * page coordinates. Use this to move a follower (e.g. Jarvis's cursor)
	 * along the pen as the drawing reveals itself.
	 */
	onPenMove?: (pageX: number, pageY: number) => void
	/**
	 * Total animation duration budget when a cursor is following. Distributed
	 * across strokes. Defaults to TOTAL_ANIMATION_MS_WITH_CURSOR (~7s) for
	 * full SVGs. Callers rendering a single path on its own (e.g. the morph
	 * orchestrator's "fresh stroke" fallback) should pass a much smaller
	 * value like 500ms — otherwise a single stroke will stretch over the
	 * whole 7s budget.
	 */
	totalDurationMs?: number
}

/**
 * Render an SVG string as freehand draw shapes on the canvas. Returns the
 * resulting shape IDs so callers can run a camera tour or relayout.
 */
export async function drawSvg(
	editor: Editor,
	svg: string,
	options: DrawSvgOptions
): Promise<TLShapeId[]> {
	const {
		originX,
		originY,
		width,
		animate = true,
		onPenMove,
		totalDurationMs = TOTAL_ANIMATION_MS_WITH_CURSOR,
	} = options

	const aspect = readSvgAspect(svg)
	const height = width / aspect
	const strokes = parseSvgToStrokes(svg, width, height)
	if (strokes.length === 0) return []

	const created: CreatedShape[] = []
	for (const stroke of strokes) {
		const c = createDrawShape(editor, stroke, { originX, originY, animate })
		if (c) created.push(c)
	}

	if (animate) {
		const pending = created.filter(
			(
				c
			): c is CreatedShape & {
				pendingAnimation: NonNullable<CreatedShape['pendingAnimation']>
			} => c.pendingAnimation !== null
		)
		if (onPenMove) {
			// Sequential — so the follower can track one continuous pen line.
			// Budget the total time across strokes so a 5-stroke fish and a
			// 30-stroke bull both finish in ~totalDurationMs.
			const perStrokeMs = Math.max(
				MIN_STROKE_MS_WITH_CURSOR,
				Math.floor(totalDurationMs / Math.max(1, pending.length))
			)
			for (const c of pending) {
				await animateDrawShape(editor, c.id, c.pendingAnimation, c, perStrokeMs, onPenMove)
			}
		} else {
			await Promise.all(
				pending.map((c) =>
					animateDrawShape(
						editor,
						c.id,
						c.pendingAnimation,
						c,
						ANIMATION_DURATION_MS_DEFAULT
					)
				)
			)
		}
	}

	return created.map((c) => c.id)
}

/** Best-effort aspect read from the SVG's viewBox or width/height attrs. */
function readSvgAspect(svg: string): number {
	const viewBox = svg.match(/viewBox\s*=\s*["']([^"']+)["']/)
	if (viewBox) {
		const parts = viewBox[1].split(/[\s,]+/).map(Number)
		if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) {
			return parts[2] / parts[3]
		}
	}
	const w = svg.match(/\swidth\s*=\s*["']?([\d.]+)["']?/)
	const h = svg.match(/\sheight\s*=\s*["']?([\d.]+)["']?/)
	if (w && h && Number(w[1]) > 0 && Number(h[1]) > 0) {
		return Number(w[1]) / Number(h[1])
	}
	return 1
}

function createDrawShape(
	editor: Editor,
	stroke: Stroke,
	{ originX, originY, animate }: { originX: number; originY: number; animate: boolean }
): CreatedShape | null {
	if (stroke.points.length < 2) return null

	const pagePoints = stroke.points.map((p) => ({ x: p.x + originX, y: p.y + originY }))
	const inputPoints = [...pagePoints]
	if (stroke.closed) inputPoints.push(inputPoints[0])

	const minX = Math.min(...inputPoints.map((p) => p.x))
	const minY = Math.min(...inputPoints.map((p) => p.y))

	// Densify so the rendered stroke is smooth even when SVG samples are sparse.
	const interpolated: VecModel[] = []
	for (let j = 0; j < inputPoints.length - 1; j++) {
		const pt = inputPoints[j]
		interpolated.push(pt)
		const next = inputPoints[j + 1]
		const dist = Vec.Dist(pt, next)
		const n = Math.floor(dist / POINT_DENSIFY_MAX_GAP)
		for (let k = 0; k < n; k++) {
			interpolated.push(Vec.Lrp(pt, next, (k + 1) / (n + 1)))
		}
	}
	interpolated.push(inputPoints[inputPoints.length - 1])
	if (interpolated.length < 2) return null

	// Add a smoothed random walk to each point to give the line a "searching",
	// hand-sketched feel — Picasso-bull energy rather than perfect vector. The
	// walk drifts gently (low frequency) and pulls back toward the true path,
	// so the contour is recognisable but never quite straight.
	const ROUGHNESS = 2.4 // peak deviation in pixels
	const ROUGHNESS_DRIFT = 0.7 // per-step random kick magnitude
	const ROUGHNESS_PULL = 0.85 // pull-back factor toward the true path
	let jitterX = 0
	let jitterY = 0
	const segmentPoints = interpolated.map((p) => {
		jitterX = jitterX * ROUGHNESS_PULL + (Math.random() - 0.5) * ROUGHNESS_DRIFT
		jitterY = jitterY * ROUGHNESS_PULL + (Math.random() - 0.5) * ROUGHNESS_DRIFT
		const dx = Math.max(-ROUGHNESS, Math.min(ROUGHNESS, jitterX))
		const dy = Math.max(-ROUGHNESS, Math.min(ROUGHNESS, jitterY))
		// Small pressure variance so the stroke breathes rather than reading flat.
		const z = 0.55 + Math.random() * 0.35
		return { x: p.x - minX + dx, y: p.y - minY + dy, z }
	})

	const id = createShapeId()
	const baseProps = {
		color: stroke.color,
		fill: stroke.fill,
		dash: 'draw' as const,
		size: 's' as const,
		isPen: true,
	}

	if (!animate) {
		editor.createShape({
			id,
			type: 'draw',
			x: minX,
			y: minY,
			props: {
				...baseProps,
				segments: [{ type: 'free', path: b64Vecs.encodePoints(segmentPoints) }],
				isComplete: true,
				isClosed: stroke.closed,
			},
		})
		return { id, originX: minX, originY: minY, pendingAnimation: null }
	}

	editor.createShape({
		id,
		type: 'draw',
		x: minX,
		y: minY,
		props: {
			...baseProps,
			segments: [{ type: 'free', path: b64Vecs.encodePoints(segmentPoints.slice(0, 2)) }],
			isComplete: false,
			isClosed: false,
		},
	})

	return {
		id,
		originX: minX,
		originY: minY,
		pendingAnimation: { segmentPoints, isClosed: stroke.closed },
	}
}

async function animateDrawShape(
	editor: Editor,
	id: TLShapeId,
	animation: { segmentPoints: VecModel[]; isClosed: boolean },
	created: CreatedShape,
	durationMs: number,
	onPenMove?: (pageX: number, pageY: number) => void
): Promise<void> {
	const { segmentPoints, isClosed } = animation
	const totalFrames = Math.ceil(durationMs / ANIMATION_FRAME_MS)
	const pointsPerFrame = Math.max(1, Math.ceil(segmentPoints.length / totalFrames))

	for (let f = 2; f < segmentPoints.length; f += pointsPerFrame) {
		const end = Math.min(f + pointsPerFrame, segmentPoints.length)
		editor.updateShape({
			id,
			type: 'draw',
			props: {
				segments: [
					{
						type: 'free',
						path: b64Vecs.encodePoints(segmentPoints.slice(0, end)),
					} as TLDrawShapeSegment,
				],
			},
		})
		if (onPenMove) {
			const tip = segmentPoints[end - 1]
			onPenMove(tip.x + created.originX, tip.y + created.originY)
		}
		await new Promise((r) => setTimeout(r, ANIMATION_FRAME_MS))
	}

	editor.updateShape({
		id,
		type: 'draw',
		props: {
			segments: [{ type: 'free', path: b64Vecs.encodePoints(segmentPoints) } as TLDrawShapeSegment],
			isComplete: true,
			isClosed,
		},
	})
}
