/**
 * High-quality "morph" draw orchestration.
 *
 * When the user asks for high-quality drawing:
 *   1. Fire Gemini 3.1 Flash and Quiver SSE concurrently.
 *   2. As soon as Gemini returns, render its rough sketch with the normal
 *      pen-following animation.
 *   3. As Quiver paths stream in, find the closest Gemini stroke and morph
 *      it into the polished Quiver stroke (Ship of Theseus). New paths
 *      with no match get rendered fresh; rough strokes that never get
 *      claimed are deleted at the end.
 *   4. Cache the assembled Quiver SVG under quality='high'.
 */

import { Editor, TLShapeId } from 'tldraw'
import type { JarvisCursor } from '../cursor/JarvisCursor'
import { drawCache } from './draw-cache'
import { drawSvg } from './draw-svg'
import { generateSvgViaGemini } from './draw-via-gemini'
import { fingerprintPathPoints, fingerprintShape, findBestMatch, morphShape } from './morph'
import { streamQuiverPaths, type StreamedItem } from './streaming-svg-parser'
import { parseSvgToStrokes, type Stroke } from './svg-to-freehand'

interface ToolExecCtx {
	cursor?: JarvisCursor
}

interface ToolResult {
	success: boolean
	message: string
}

interface MorphOpts {
	quiverInstructions: string
	quiverModel: string
}

export async function runMorphOrchestration(
	editor: Editor,
	subject: string,
	pos: { x: number; y: number },
	width: number,
	ctx: ToolExecCtx,
	opts: MorphOpts
): Promise<ToolResult> {
	// Fire both calls in parallel.
	const geminiPromise = generateSvgViaGemini(subject).catch((err) => {
		console.warn('[Morph] Gemini failed:', err)
		return null
	})

	let quiverIterable: AsyncIterable<StreamedItem> | null = null
	try {
		quiverIterable = streamQuiverPaths(subject, opts.quiverInstructions, opts.quiverModel)
	} catch (err) {
		console.warn('[Morph] Quiver stream open failed:', err)
	}

	// Wait for Gemini, then render its result.
	const geminiSvg = await geminiPromise
	let renderedAspect = 1
	const unclaimedShapes: { id: TLShapeId }[] = []
	if (geminiSvg) {
		try {
			renderedAspect = readSvgAspect(geminiSvg)
			const ids = await drawSvg(editor, geminiSvg, {
				originX: pos.x,
				originY: pos.y,
				width,
				animate: true,
				onPenMove: ctx.cursor ? (px, py) => ctx.cursor!.moveTo(px, py) : undefined,
			})
			for (const id of ids) unclaimedShapes.push({ id })
			console.log(`[Morph] Gemini rendered ${ids.length} shapes — beginning Quiver morph stream`)
		} catch (err) {
			console.warn('[Morph] Gemini render failed:', err)
		}
	}

	// If Quiver never opened, we're done — Gemini stays as the final result.
	if (!quiverIterable) {
		return {
			success: !!geminiSvg,
			message: geminiSvg
				? `Drew "${subject}" (Gemini-only — Quiver unavailable)`
				: `Failed to draw "${subject}" — both Gemini and Quiver failed.`,
		}
	}

	// Stream Quiver paths and morph/append.
	const streamedElements: string[] = []
	// Quiver paths that didn't match any Gemini shape — we render them all
	// in a single batch at the end with a fixed total budget so the user
	// gets a clean "drawing the rest" beat after the morph completes.
	const unmatchedElements: string[] = []
	let streamedStyle = ''
	let height = width / (renderedAspect || 1)

	// Quiver's viewBox: we'll capture this from the first <path>'s parent SVG
	// snapshot; for simplicity, we pull viewBox info on-the-fly from the
	// element-level points by fingerprinting in viewBox coords and converting
	// to page coords using the same scale we used for Gemini.
	// To get the viewBox we need to parse incrementally — simplest is to
	// reconstruct an SVG wrapper using a default viewBox and compute scale.
	// We default to viewBox 0 0 150 150 (Quiver's typical) and adjust on
	// element parse using the natural page-extent we want.
	// In practice we just parse each element with parseSvgToStrokes against
	// a synthetic <svg viewBox="0 0 150 150">; then map (sx, sy) onto our
	// rendering region.

	const VIEWBOX_W = 150
	const VIEWBOX_H = 150
	height = width / (VIEWBOX_W / VIEWBOX_H)
	const sx = width / VIEWBOX_W
	const sy = height / VIEWBOX_H

	try {
		for await (const item of quiverIterable) {
			if (item.type === 'style') {
				streamedStyle = item.content
				continue
			}

			streamedElements.push(item.content)

			// Parse this single element to a stroke (in viewBox coords).
			const strokes = parseSingleElementToStrokes(
				item.content,
				streamedStyle,
				VIEWBOX_W,
				VIEWBOX_H
			)
			if (strokes.length === 0) continue

			for (const stroke of strokes) {
				if (stroke.points.length < 2) continue
				// Convert to page coords using the same scale we used for Gemini.
				const pagePoints = stroke.points.map((p) => ({
					x: p.x * sx + pos.x,
					y: p.y * sy + pos.y,
				}))

				const fp = fingerprintPathPoints(pagePoints)

				// Find the best unclaimed Gemini shape to morph.
				const candidates = unclaimedShapes
					.map((u) => ({ id: u.id, fp: fingerprintShape(editor, u.id) }))
					.filter((c): c is { id: TLShapeId; fp: NonNullable<typeof c.fp> } => c.fp !== null)

				const matchId = candidates.length > 0 ? findBestMatch(fp, candidates) : null
				if (matchId) {
					// Claim it and fire the morph (don't await — many can run concurrently).
					const idx = unclaimedShapes.findIndex((u) => u.id === matchId)
					if (idx >= 0) unclaimedShapes.splice(idx, 1)
					void morphShape(editor, matchId, pagePoints, {
						durationMs: 1200,
						onPenMove: ctx.cursor ? (px, py) => ctx.cursor!.moveTo(px, py) : undefined,
					})
				} else {
					// No match — defer to a batched render at the end so the
					// total drawing time is predictable.
					unmatchedElements.push(item.content)
				}
			}
		}
	} catch (err) {
		console.warn('[Morph] stream consumption errored:', err)
	}

	// Give the in-flight morph animations a beat to finish before the
	// final "draw the rest" pass + cleanup.
	await new Promise((r) => setTimeout(r, 750))

	// Render unmatched Quiver paths in one batch with a 5s total budget.
	// drawSvg distributes the budget across strokes, so 1 stroke ~= 5s and
	// 25 strokes ~= 200ms each — total drawing time stays consistent.
	if (unmatchedElements.length > 0) {
		console.log(
			`[Morph] drawing ${unmatchedElements.length} unmatched Quiver paths (5s budget)`
		)
		const batchSvg = `<svg viewBox="0 0 ${VIEWBOX_W} ${VIEWBOX_H}">${
			streamedStyle ? `<style>${streamedStyle}</style>` : ''
		}${unmatchedElements.join('')}</svg>`
		try {
			await drawSvg(editor, batchSvg, {
				originX: pos.x,
				originY: pos.y,
				width,
				animate: true,
				totalDurationMs: 5000,
				onPenMove: ctx.cursor ? (px, py) => ctx.cursor!.moveTo(px, py) : undefined,
			})
		} catch (err) {
			console.warn('[Morph] batch fresh-render failed:', err)
		}
	}

	// Delete any remaining unclaimed Gemini shapes.
	if (unclaimedShapes.length > 0) {
		console.log(`[Morph] cleaning up ${unclaimedShapes.length} unclaimed Gemini shapes`)
		await new Promise((r) => setTimeout(r, 400))
		try {
			editor.deleteShapes(unclaimedShapes.map((u) => u.id))
		} catch (err) {
			console.warn('[Morph] cleanup delete failed:', err)
		}
	}

	// Cache the assembled Quiver SVG.
	if (streamedElements.length > 0) {
		const fullSvg = assembleSvg(streamedStyle, streamedElements, VIEWBOX_W, VIEWBOX_H)
		drawCache.set(subject, fullSvg, 'high')
		console.log(`[Morph] cached Quiver SVG for "${subject}" (${fullSvg.length} chars)`)
	}

	return {
		success: true,
		message: `Drew "${subject}" with morph (${streamedElements.length} Quiver paths).`,
	}
}

/** Best-effort viewBox aspect read. */
function readSvgAspect(svg: string): number {
	const viewBox = svg.match(/viewBox\s*=\s*["']([^"']+)["']/)
	if (viewBox) {
		const parts = viewBox[1].split(/[\s,]+/).map(Number)
		if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) {
			return parts[2] / parts[3]
		}
	}
	return 1
}

interface StrokeWithBox extends Stroke {
	minX?: number
	minY?: number
	spanX?: number
	spanY?: number
}

/**
 * Parse a single SVG element string (path/circle/etc.) into strokes. We
 * wrap it in a synthetic <svg> with the same viewBox the Quiver SVG uses
 * so coordinates come out in viewBox space.
 */
function parseSingleElementToStrokes(
	elementXml: string,
	styleBlock: string,
	viewBoxW: number,
	viewBoxH: number
): StrokeWithBox[] {
	const wrapped = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxW} ${viewBoxH}">${
		styleBlock ? `<style>${styleBlock}</style>` : ''
	}${elementXml}</svg>`
	try {
		return parseSvgToStrokes(wrapped, viewBoxW, viewBoxH) as StrokeWithBox[]
	} catch (err) {
		console.warn('[Morph] single-element parse failed:', err)
		return []
	}
}

/** Re-assemble streamed style + element fragments into a complete SVG string. */
function assembleSvg(
	style: string,
	elements: string[],
	viewBoxW: number,
	viewBoxH: number
): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxW} ${viewBoxH}">${
		style ? `<style>${style}</style>` : ''
	}${elements.join('')}</svg>`
}
