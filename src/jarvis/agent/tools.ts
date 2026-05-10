import {
	AssetRecordType,
	Editor,
	TLShapeId,
	TLShapePartial,
	createShapeId,
	getHashForString,
	toRichText,
} from 'tldraw'
import type { JarvisCursor } from '../cursor/JarvisCursor'
import { drawCache, type DrawQuality } from '../lib/draw-cache'
import { drawSvg } from '../lib/draw-svg'
import { generateSvgViaGemini } from '../lib/draw-via-gemini'
import type { FunctionDeclaration } from './api'

/** Optional context handed to tool executors. */
export interface ToolExecCtx {
	cursor?: JarvisCursor
}

/** Canvas item in an orchestrator response — a visual aid for the narration. */
export interface CanvasItem {
	type: 'text' | 'image_search'
	content: string
	label: string
}

/** The parsed output of the 'respond' tool call. */
export interface OrchestratorResponse {
	speech: string
	canvas?: CanvasItem[]
}

export const AGENT_TOOLS: FunctionDeclaration[] = [
	{
		name: 'wikipedia_search',
		description:
			'Look up a topic on Wikipedia. Returns the page summary and thumbnail image URL if available.',
		parameters: {
			type: 'object',
			properties: {
				topic: { type: 'string', description: 'The Wikipedia article title or topic to search.' },
			},
			required: ['topic'],
		},
	},
	{
		name: 'analyze_canvas_area',
		description:
			'Describe shapes in a rectangular area of the canvas. Returns a JSON description of shapes found.',
		parameters: {
			type: 'object',
			properties: {
				x: { type: 'number', description: 'Left edge of the area.' },
				y: { type: 'number', description: 'Top edge of the area.' },
				w: { type: 'number', description: 'Width of the area.' },
				h: { type: 'number', description: 'Height of the area.' },
			},
			required: ['x', 'y', 'w', 'h'],
		},
	},
	{
		name: 'move_shape',
		description:
			'Move an existing shape to a new position on the canvas. The anchor parameter controls which point of the shape is placed at (x, y).',
		parameters: {
			type: 'object',
			properties: {
				shapeId: { type: 'string', description: 'The shape ID to move (e.g. "shape:abc123").' },
				x: { type: 'number', description: 'Target X position.' },
				y: { type: 'number', description: 'Target Y position.' },
				anchor: {
					type: 'string',
					enum: [
						'top-left',
						'top-center',
						'top-right',
						'center-left',
						'center',
						'center-right',
						'bottom-left',
						'bottom-center',
						'bottom-right',
					],
					description: 'Which point of the shape to place at (x, y). Default "top-left".',
				},
			},
			required: ['shapeId', 'x', 'y'],
		},
	},
	{
		name: 'remove_shape',
		description: 'Delete a shape from the canvas.',
		parameters: {
			type: 'object',
			properties: {
				shapeId: { type: 'string', description: 'The shape ID to delete.' },
			},
			required: ['shapeId'],
		},
	},
	{
		name: 'draw',
		description:
			"Draw a minimalist black-and-white line illustration of a subject on the canvas. By default uses Gemini 3.1 Flash for a fast Picasso-bull-style sketch (~2-4s); pass quality='high' to use the slower, higher-fidelity QuiverAI path (~30s, will animate-morph the rough Gemini result into the polished one). The system handles all styling — you provide a brief subject description.",
		parameters: {
			type: 'object',
			properties: {
				subject: {
					type: 'string',
					description:
						"What to draw, in 1–8 words. Just the subject — no style instructions (those are added automatically). Examples: 'a fish', 'a bull', 'a sleeping cat', 'a tree in winter', 'an old man's face'.",
				},
				width: {
					type: 'number',
					description: 'Render width in page pixels. Height auto-scales. Default 400.',
				},
				quality: {
					type: 'string',
					enum: ['fast', 'high'],
					description:
						"Optional. 'fast' (default) uses Gemini 3.1 Flash for a quick sketch. 'high' uses Quiver and runs a streaming morph from rough → polished. Use 'high' only when the user explicitly asks for high quality / fancy / nicely.",
				},
			},
			required: ['subject'],
		},
	},
	{
		name: 'place_shape',
		description:
			'Position a shape relative to another shape. Use this instead of move_shape when you want to place a shape next to, above, or below a reference shape.',
		parameters: {
			type: 'object',
			properties: {
				shapeId: {
					type: 'string',
					description: 'The shape ID to position (e.g. "shape:abc123").',
				},
				referenceShapeId: {
					type: 'string',
					description: 'The shape ID to position relative to.',
				},
				side: {
					type: 'string',
					enum: ['top', 'bottom', 'left', 'right'],
					description: 'Which side of the reference shape to place on.',
				},
				align: {
					type: 'string',
					enum: ['start', 'center', 'end'],
					description:
						'How to align along the perpendicular axis. "start" = left/top edge, "center" = centered, "end" = right/bottom edge. Default "center".',
				},
				sideOffset: {
					type: 'number',
					description: 'Gap in pixels between the shapes along the side axis. Default 20.',
				},
				alignOffset: {
					type: 'number',
					description: 'Additional offset in pixels along the alignment axis. Default 0.',
				},
			},
			required: ['shapeId', 'referenceShapeId', 'side'],
		},
	},
	{
		name: 'stack_shapes',
		description:
			'Stack multiple shapes horizontally or vertically with even spacing. Arranges shapes in a line.',
		parameters: {
			type: 'object',
			properties: {
				shapeIds: {
					type: 'array',
					items: { type: 'string' },
					description: 'Array of shape IDs to stack.',
				},
				direction: {
					type: 'string',
					enum: ['horizontal', 'vertical'],
					description:
						'Direction to stack: "horizontal" (left to right) or "vertical" (top to bottom).',
				},
				gap: {
					type: 'number',
					description: 'Gap in pixels between shapes. Default 20.',
				},
			},
			required: ['shapeIds', 'direction'],
		},
	},
	{
		name: 'align_shapes',
		description:
			'Align multiple shapes along an axis. For example, align left edges, center horizontally, or align tops.',
		parameters: {
			type: 'object',
			properties: {
				shapeIds: {
					type: 'array',
					items: { type: 'string' },
					description: 'Array of shape IDs to align.',
				},
				alignment: {
					type: 'string',
					enum: ['left', 'center-horizontal', 'right', 'top', 'center-vertical', 'bottom'],
					description: 'The alignment operation to apply.',
				},
			},
			required: ['shapeIds', 'alignment'],
		},
	},
	{
		name: 'distribute_shapes',
		description:
			'Distribute multiple shapes evenly along an axis so the gaps between them are equal. Requires at least 3 shapes.',
		parameters: {
			type: 'object',
			properties: {
				shapeIds: {
					type: 'array',
					items: { type: 'string' },
					description: 'Array of shape IDs to distribute (at least 3).',
				},
				direction: {
					type: 'string',
					enum: ['horizontal', 'vertical'],
					description: 'Direction to distribute: "horizontal" or "vertical".',
				},
			},
			required: ['shapeIds', 'direction'],
		},
	},
	{
		name: 'respond',
		description:
			'Respond to the user and finish your turn. Always call this as your final action. Include speech only for voice input — omit it for text-based requests like drawing or canvas organization.',
		parameters: {
			type: 'object',
			properties: {
				speech: {
					type: 'string',
					description:
						'Optional spoken narration. Include this when the user spoke via microphone (voice input). Omit for text-based requests where speech is unnecessary.',
				},
				canvas: {
					type: 'array',
					description:
						'Optional visual items to place on the canvas alongside the narration. Each item appears when its label is mentioned in the speech.',
					items: {
						type: 'object',
						properties: {
							type: {
								type: 'string',
								enum: ['text', 'image_search'],
								description:
									'Type of canvas item: "text" for a text shape, "image_search" for a Wikipedia image lookup.',
							},
							content: {
								type: 'string',
								description:
									'For "text": the text to display on the canvas. For "image_search": the Wikipedia search query.',
							},
							label: {
								type: 'string',
								description:
									'A word or short phrase that appears in the speech text. The canvas item will appear when this word is spoken. Must match text in the speech field.',
							},
						},
						required: ['type', 'content', 'label'],
					},
				},
			},
			required: [],
		},
	},
]

export interface ToolResult {
	success: boolean
	message: string
	imageUrl?: string
	imageWidth?: number
	imageHeight?: number
	/** Set to true when the 'respond' tool is called, signaling the loop should end. */
	isResponse?: boolean
	/** The parsed orchestrator response, if this is a 'respond' tool call. */
	orchestratorResponse?: OrchestratorResponse
}

export async function executeToolCall(
	editor: Editor,
	toolName: string,
	toolInput: Record<string, unknown>,
	ctx: ToolExecCtx = {}
): Promise<ToolResult> {
	switch (toolName) {
		case 'wikipedia_search':
			return executeWikipediaSearch(toolInput)
		case 'analyze_canvas_area':
			return executeAnalyzeCanvasArea(editor, toolInput)
		case 'move_shape':
			return executeMoveShape(editor, toolInput)
		case 'remove_shape':
			return executeRemoveShape(editor, toolInput)
		case 'draw':
			return executeDraw(editor, toolInput, ctx)
		case 'place_shape':
			return executePlaceShape(editor, toolInput)
		case 'stack_shapes':
			return executeStackShapes(editor, toolInput)
		case 'align_shapes':
			return executeAlignShapes(editor, toolInput)
		case 'distribute_shapes':
			return executeDistributeShapes(editor, toolInput)
		case 'respond':
			return executeRespond(toolInput)
		default:
			return { success: false, message: `Unknown tool: ${toolName}` }
	}
}

function executeRespond(input: Record<string, unknown>): ToolResult {
	const speech = (input.speech as string) ?? ''
	const canvas = input.canvas as CanvasItem[] | undefined

	const orchestratorResponse: OrchestratorResponse = { speech, canvas }
	return {
		success: true,
		message: `Responding with speech (${speech.length} chars) and ${canvas?.length ?? 0} canvas items.`,
		isResponse: true,
		orchestratorResponse,
	}
}

/** Place a text shape on the canvas. Used by the orchestrator pipeline. */
export function placeTextShape(editor: Editor, text: string, x: number, y: number): TLShapeId {
	const id = createShapeId()
	editor.createShape({
		id,
		type: 'text',
		x,
		y,
		props: {
			richText: toRichText(text),
			autoSize: false,
			w: 500,
			font: 'mono',
		},
	})
	return id
}

/** Place a sticky note shape on the canvas. Used for highlight-mode responses. */
export function placeNoteShape(editor: Editor, text: string, x: number, y: number): TLShapeId {
	const id = createShapeId()
	editor.createShape({
		id,
		type: 'note',
		x,
		y,
		props: {
			richText: toRichText(text),
			color: 'yellow',
			size: 'm',
		},
	})
	return id
}

/** Target display width for images on the canvas. */
const IMAGE_DISPLAY_WIDTH = 400

/** Place an image on the canvas from a URL. Used by the orchestrator pipeline. */
export async function placeImageFromSearch(
	editor: Editor,
	query: string,
	x: number,
	y: number
): Promise<{ shapeId: TLShapeId; imageUrl: string } | null> {
	const result = await executeWikipediaSearch({ topic: query })
	if (!result.imageUrl) return null

	const url = result.imageUrl
	const srcW = result.imageWidth ?? IMAGE_DISPLAY_WIDTH
	const srcH = result.imageHeight ?? IMAGE_DISPLAY_WIDTH
	const aspect = srcW / srcH
	const w = IMAGE_DISPLAY_WIDTH
	const h = Math.round(IMAGE_DISPLAY_WIDTH / aspect)

	const hash = getHashForString(url)
	const assetId = AssetRecordType.createId(hash)

	if (!editor.getAsset(assetId)) {
		editor.createAssets([
			AssetRecordType.create({
				id: assetId,
				type: 'image',
				typeName: 'asset',
				props: {
					name: 'image',
					src: url,
					w: srcW,
					h: srcH,
					mimeType: 'image/png',
					isAnimated: false,
					fileSize: undefined,
				},
				meta: {},
			}),
		])
	}

	const shapeId = createShapeId()
	editor.createShape({
		id: shapeId,
		type: 'image',
		x,
		y,
		props: { assetId, w, h },
	})

	return { shapeId, imageUrl: url }
}

async function executeWikipediaSearch(input: Record<string, unknown>): Promise<ToolResult> {
	const topic = input.topic as string

	try {
		// 1. Search Wikipedia to find the real article title for this topic.
		const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
			topic
		)}&limit=1&namespace=0&format=json&origin=*`
		const searchResp = await fetch(searchUrl)
		if (!searchResp.ok) {
			return { success: false, message: `Wikipedia search failed for "${topic}"` }
		}
		const searchData = (await searchResp.json()) as [string, string[], string[], string[]]
		const matchedTitle = searchData[1]?.[0]
		if (!matchedTitle) {
			return { success: false, message: `No Wikipedia article found for "${topic}"` }
		}

		// 2. Fetch the summary for that real title.
		const encoded = encodeURIComponent(matchedTitle)
		const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`)
		if (!response.ok) {
			return { success: false, message: `Wikipedia summary failed for "${matchedTitle}"` }
		}

		const data = (await response.json()) as {
			title: string
			extract: string
			thumbnail?: { source: string; width: number; height: number }
			originalimage?: { source: string; width: number; height: number }
		}

		let message = `**${data.title}**: ${data.extract}`
		let imageUrl: string | undefined
		let imageWidth: number | undefined
		let imageHeight: number | undefined

		// Prefer originalimage for better quality, fall back to thumbnail
		const image = data.originalimage ?? data.thumbnail
		if (image?.source) {
			imageUrl = image.source
			imageWidth = image.width
			imageHeight = image.height
			message += `\n\n[Image available: ${imageUrl} (${imageWidth}x${imageHeight})]`
		}

		return { success: true, message, imageUrl, imageWidth, imageHeight }
	} catch (err) {
		return {
			success: false,
			message: `Failed to search Wikipedia for "${topic}": ${err instanceof Error ? err.message : String(err)}`,
		}
	}
}

function executeAnalyzeCanvasArea(editor: Editor, input: Record<string, unknown>): ToolResult {
	const x = input.x as number
	const y = input.y as number
	const w = input.w as number
	const h = input.h as number

	const shapes = editor.getCurrentPageShapes()
	const results: Record<string, unknown>[] = []

	for (const shape of shapes) {
		if (shape.type === 'arrow' || shape.type === 'highlight') continue
		const bounds = editor.getShapePageBounds(shape.id)
		if (!bounds) continue

		if (
			bounds.x + bounds.w < x ||
			bounds.x > x + w ||
			bounds.y + bounds.h < y ||
			bounds.y > y + h
		) {
			continue
		}

		const text = editor.getShapeUtil(shape).getText(shape)?.trim()
		results.push({
			id: shape.id,
			type: shape.type,
			x: Math.round(bounds.x),
			y: Math.round(bounds.y),
			w: Math.round(bounds.w),
			h: Math.round(bounds.h),
			...(text ? { text: text.slice(0, 200) } : {}),
			...(shape.type === 'image' ? { hasImage: true } : {}),
		})
	}

	return {
		success: true,
		message:
			results.length > 0
				? JSON.stringify(results, null, 2)
				: 'No shapes found in the specified area.',
	}
}

function executeMoveShape(editor: Editor, input: Record<string, unknown>): ToolResult {
	const shapeId = input.shapeId as TLShapeId
	const x = input.x as number
	const y = input.y as number
	const anchor = (input.anchor as string) ?? 'top-left'

	const shape = editor.getShape(shapeId)
	if (!shape) {
		return { success: false, message: `Shape ${shapeId} not found` }
	}

	const bounds = editor.getShapePageBounds(shapeId)
	if (!bounds) {
		return { success: false, message: `Could not get bounds for ${shapeId}` }
	}

	// Calculate the anchor point offset from bounds origin
	let anchorOffsetX = 0
	let anchorOffsetY = 0

	if (anchor.includes('center') && !anchor.includes('left') && !anchor.includes('right')) {
		anchorOffsetX = bounds.w / 2
	} else if (anchor.includes('right')) {
		anchorOffsetX = bounds.w
	}

	if (anchor.includes('center') && !anchor.includes('top') && !anchor.includes('bottom')) {
		anchorOffsetY = bounds.h / 2
	} else if (anchor.includes('bottom')) {
		anchorOffsetY = bounds.h
	}

	// Difference between shape origin and bounds origin (matters for rotated shapes)
	const shapeOriginDeltaX = shape.x - bounds.x
	const shapeOriginDeltaY = shape.y - bounds.y

	const newX = x - anchorOffsetX + shapeOriginDeltaX
	const newY = y - anchorOffsetY + shapeOriginDeltaY

	editor.updateShape({ id: shapeId, type: shape.type, x: newX, y: newY } as TLShapePartial)
	return { success: true, message: `Moved shape ${shapeId} (anchor: ${anchor}) to (${x}, ${y})` }
}

function executeRemoveShape(editor: Editor, input: Record<string, unknown>): ToolResult {
	const shapeId = input.shapeId as TLShapeId

	const shape = editor.getShape(shapeId)
	if (!shape) {
		return { success: false, message: `Shape ${shapeId} not found` }
	}

	editor.deleteShapes([shapeId])
	return { success: true, message: `Removed shape ${shapeId}` }
}

/** Style instructions baked into every Quiver call. Kept short — long
 * instruction strings appear to slow Arrow generation noticeably. */
const QUIVER_STYLE_INSTRUCTIONS =
	'Rough hand-sketched line drawing, Picasso-bull style. Searching, exploratory pencil lines — slightly imperfect with character. Loose contours, not geometrically perfect. Outline only, no fills, no shading, under 15 strokes.'

/** Quiver model. arrow-1.1 is the current flagship at $0.20/gen. arrow-1.1-max
 * is the premium/slower variant; arrow-1 is older. */
const QUIVER_MODEL = 'arrow-1.1'

// (The previous in-file Quiver streaming helpers were superseded by
// `lib/streaming-svg-parser.ts` and `lib/morph-orchestration.ts`, which
// support the high-quality morph path.)

async function executeDraw(
	editor: Editor,
	input: Record<string, unknown>,
	ctx: ToolExecCtx = {}
): Promise<ToolResult> {
	const subject = (input.subject as string)?.trim()
	if (!subject) {
		return { success: false, message: 'draw requires a subject string.' }
	}

	const quality: DrawQuality = input.quality === 'high' ? 'high' : 'fast'

	// Drop the illustration below all existing content.
	const pos = getNextDrawPosition(editor)
	const width = (input.width as number) ?? 400

	// Cache hit? Skip generation entirely — instant render.
	const cached = drawCache.get(subject, quality)
	if (cached) {
		console.log(`[Draw] cache hit for "${subject}" (${quality}) → instant render`)
		return renderSvgToCanvas(editor, cached.svg, subject, pos, width, ctx)
	}

	// High-quality path is the streaming morph orchestration in Phase 2.
	if (quality === 'high') {
		return executeHighQualityDraw(editor, subject, pos, width, ctx)
	}

	// Fast default: Gemini 3.1 Flash → render normally.
	let svg: string
	try {
		svg = await generateSvgViaGemini(subject)
	} catch (err) {
		return {
			success: false,
			message: `Failed to fetch SVG from Gemini: ${err instanceof Error ? err.message : String(err)}`,
		}
	}
	drawCache.set(subject, svg, 'fast')
	return renderSvgToCanvas(editor, svg, subject, pos, width, ctx)
}

/** Render an already-fetched SVG onto the canvas with the standard pen-following animation. */
async function renderSvgToCanvas(
	editor: Editor,
	svg: string,
	subject: string,
	pos: { x: number; y: number },
	width: number,
	ctx: ToolExecCtx
): Promise<ToolResult> {
	try {
		const ids = await drawSvg(editor, svg, {
			originX: pos.x,
			originY: pos.y,
			width,
			animate: true,
			onPenMove: ctx.cursor ? (px, py) => ctx.cursor!.moveTo(px, py) : undefined,
		})
		if (ids.length === 0) {
			return { success: false, message: 'SVG returned but parsed to no strokes.' }
		}
		return {
			success: true,
			message: `Drew "${subject}" at (${Math.round(pos.x)}, ${Math.round(pos.y)}) with ${ids.length} strokes.`,
		}
	} catch (err) {
		return {
			success: false,
			message: `Failed to render SVG: ${err instanceof Error ? err.message : String(err)}`,
		}
	}
}

/**
 * High-quality draw path: fire Gemini and Quiver in parallel. Render the fast
 * Gemini result with the normal pen-following animation, then morph each
 * Quiver path onto the closest Gemini shape as it streams in (Ship of Theseus).
 *
 * Falls back gracefully if either side fails.
 */
async function executeHighQualityDraw(
	editor: Editor,
	subject: string,
	pos: { x: number; y: number },
	width: number,
	ctx: ToolExecCtx
): Promise<ToolResult> {
	const { runMorphOrchestration } = await import('../lib/morph-orchestration')
	return runMorphOrchestration(editor, subject, pos, width, ctx, {
		quiverInstructions: QUIVER_STYLE_INSTRUCTIONS,
		quiverModel: QUIVER_MODEL,
	})
}

/** Best-effort spot to drop a new illustration: below all existing shapes. */
function getNextDrawPosition(editor: Editor): { x: number; y: number } {
	const shapes = editor.getCurrentPageShapes()
	let maxBottom = 0
	let leftMost = Infinity
	let hasShapes = false
	for (const s of shapes) {
		if (s.type === 'arrow') continue
		const b = editor.getShapePageBounds(s.id)
		if (!b) continue
		hasShapes = true
		if (b.y + b.h > maxBottom) maxBottom = b.y + b.h
		if (b.x < leftMost) leftMost = b.x
	}
	if (!hasShapes) {
		const c = editor.screenToPage(editor.getViewportScreenCenter())
		return { x: Math.round(c.x - 200), y: Math.round(c.y - 200) }
	}
	return { x: leftMost === Infinity ? 0 : Math.round(leftMost), y: Math.round(maxBottom + 60) }
}

function executePlaceShape(editor: Editor, input: Record<string, unknown>): ToolResult {
	const shapeId = input.shapeId as TLShapeId
	const referenceShapeId = input.referenceShapeId as TLShapeId
	const side = input.side as 'top' | 'bottom' | 'left' | 'right'
	const align = (input.align as 'start' | 'center' | 'end') ?? 'center'
	const sideOffset = (input.sideOffset as number) ?? 20
	const alignOffset = (input.alignOffset as number) ?? 0

	const shape = editor.getShape(shapeId)
	const referenceShape = editor.getShape(referenceShapeId)
	if (!shape) return { success: false, message: `Shape ${shapeId} not found` }
	if (!referenceShape)
		return { success: false, message: `Reference shape ${referenceShapeId} not found` }

	const bbA = editor.getShapePageBounds(shapeId)
	const bbR = editor.getShapePageBounds(referenceShapeId)
	if (!bbA || !bbR) return { success: false, message: 'Could not get shape bounds' }

	let x: number
	let y: number

	if (side === 'top') {
		y = bbR.minY - bbA.h - sideOffset
		if (align === 'start') x = bbR.minX + alignOffset
		else if (align === 'center') x = bbR.midX - bbA.w / 2 + alignOffset
		else x = bbR.maxX - bbA.w - alignOffset
	} else if (side === 'bottom') {
		y = bbR.maxY + sideOffset
		if (align === 'start') x = bbR.minX + alignOffset
		else if (align === 'center') x = bbR.midX - bbA.w / 2 + alignOffset
		else x = bbR.maxX - bbA.w - alignOffset
	} else if (side === 'left') {
		x = bbR.minX - bbA.w - sideOffset
		if (align === 'start') y = bbR.minY + alignOffset
		else if (align === 'center') y = bbR.midY - bbA.h / 2 + alignOffset
		else y = bbR.maxY - bbA.h - alignOffset
	} else {
		x = bbR.maxX + sideOffset
		if (align === 'start') y = bbR.minY + alignOffset
		else if (align === 'center') y = bbR.midY - bbA.h / 2 + alignOffset
		else y = bbR.maxY - bbA.h - alignOffset
	}

	editor.updateShape({ id: shapeId, type: shape.type, x, y } as TLShapePartial)
	return {
		success: true,
		message: `Placed ${shapeId} on the ${side} of ${referenceShapeId} (align: ${align}, gap: ${sideOffset}px)`,
	}
}

function executeStackShapes(editor: Editor, input: Record<string, unknown>): ToolResult {
	const shapeIds = input.shapeIds as TLShapeId[]
	const direction = input.direction as 'horizontal' | 'vertical'
	const gap = (input.gap as number) ?? 20

	if (!shapeIds || shapeIds.length < 2) {
		return { success: false, message: 'At least 2 shape IDs are required to stack.' }
	}

	const missing = shapeIds.filter((id) => !editor.getShape(id))
	if (missing.length > 0) {
		return { success: false, message: `Shapes not found: ${missing.join(', ')}` }
	}

	editor.stackShapes(shapeIds, direction, Math.max(gap, 0))
	return {
		success: true,
		message: `Stacked ${shapeIds.length} shapes ${direction}ly with ${gap}px gap.`,
	}
}

function executeAlignShapes(editor: Editor, input: Record<string, unknown>): ToolResult {
	const shapeIds = input.shapeIds as TLShapeId[]
	const alignment = input.alignment as
		| 'left'
		| 'center-horizontal'
		| 'right'
		| 'top'
		| 'center-vertical'
		| 'bottom'

	if (!shapeIds || shapeIds.length < 2) {
		return { success: false, message: 'At least 2 shape IDs are required to align.' }
	}

	const missing = shapeIds.filter((id) => !editor.getShape(id))
	if (missing.length > 0) {
		return { success: false, message: `Shapes not found: ${missing.join(', ')}` }
	}

	editor.alignShapes(shapeIds, alignment)
	return { success: true, message: `Aligned ${shapeIds.length} shapes: ${alignment}.` }
}

function executeDistributeShapes(editor: Editor, input: Record<string, unknown>): ToolResult {
	const shapeIds = input.shapeIds as TLShapeId[]
	const direction = input.direction as 'horizontal' | 'vertical'

	if (!shapeIds || shapeIds.length < 3) {
		return { success: false, message: 'At least 3 shape IDs are required to distribute.' }
	}

	const missing = shapeIds.filter((id) => !editor.getShape(id))
	if (missing.length > 0) {
		return { success: false, message: `Shapes not found: ${missing.join(', ')}` }
	}

	editor.distributeShapes(shapeIds, direction)
	return { success: true, message: `Distributed ${shapeIds.length} shapes ${direction}ly.` }
}
