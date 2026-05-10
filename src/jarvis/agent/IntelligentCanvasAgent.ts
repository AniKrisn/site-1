import { Box, Editor, TLShapeId } from 'tldraw'
import {
	captureCanvasScreenshot,
	describeShapesForPrompt,
	findHighlightFocusedShapes,
	findNearbyShapes,
	getImageBase64,
	type ShapeContext,
} from '../lib/canvas-helpers'
import {
	ELEVENLABS_DEFAULT_VOICE_ID,
	ERROR_CLEAR_DELAY_MS,
	MAX_AGENT_ITERATIONS,
	NEARBY_MARGIN,
	USE_BROWSER_TTS,
} from '../lib/constants'
import type { JarvisCursor } from '../cursor/JarvisCursor'
import { drawSvg } from '../lib/draw-svg'
import { pickRandomPreset } from '../lib/draw-presets'
import { callGemini, type GeminiContent, type GeminiPart } from './api'
import { buildSystemPrompt } from './systemPrompt'
import {
	AGENT_TOOLS,
	executeToolCall,
	placeImageFromSearch,
	placeNoteShape,
	placeTextShape,
	type CanvasItem,
	type OrchestratorResponse,
} from './tools'

export type AgentStatus = 'idle' | 'thinking' | 'error'

export interface AgentCallbacks {
	onStatusChange: (status: AgentStatus, message?: string) => void
}

/** Result emitted when the agent finishes a voice command. */
export interface VoiceCommandResult {
	/** What the agent intended to say. Empty if the response had no speech. */
	speech: string
	/** Canvas items the agent placed, in order. */
	canvasItems: CanvasItem[]
	/** Shape IDs of placed canvas items (parallel to canvasItems). */
	placedShapeIds: TLShapeId[]
	/**
	 * Schedules a camera tour synchronized to the agent's speech. Call
	 * this at the moment an upstream voice channel actually starts speaking
	 * (e.g. when Live's depth narration audio begins) so the camera moves
	 * in sync with the words. No-op if there are no placed shapes.
	 */
	runCameraTour: () => void
}

/** Options for delegating a voice command to the heavy agent. */
export interface VoiceCommandOptions {
	/**
	 * When true, skip the agent's own TTS step (ElevenLabs / browser speech).
	 * Used when an upstream voice channel (e.g. Gemini Live) is narrating.
	 */
	silent?: boolean
	/**
	 * When true, the agent will NOT auto-schedule the camera tour after
	 * placing shapes. Caller is expected to invoke `result.runCameraTour()`
	 * at the right moment (e.g. when narration audio starts).
	 */
	deferCameraTour?: boolean
	/** Called once the agent has placed shapes. */
	onResult?: (result: VoiceCommandResult) => void
}

export class IntelligentCanvasAgent {
	private editor: Editor
	private cursor: JarvisCursor
	private callbacks: AgentCallbacks
	private processing = false
	private conversationHistory: GeminiContent[] = []
	private pendingCommand: {
		text: string
		nearbyShapes: ShapeContext[]
		options: VoiceCommandOptions
	} | null = null

	constructor(editor: Editor, cursor: JarvisCursor, callbacks: AgentCallbacks) {
		this.editor = editor
		this.cursor = cursor
		this.callbacks = callbacks
	}

	/**
	 * Run only the draw tool with the given subject — no agent loop, no
	 * narration, no canvas items. Used when LiveVoiceController detects a
	 * pure "draw X" request and wants to skip the heavyweight pipeline.
	 */
	async drawDirectly(subject: string): Promise<void> {
		this.callbacks.onStatusChange('thinking', 'Drawing...')
		try {
			await executeToolCall(
				this.editor,
				'draw',
				{ subject },
				{ cursor: this.cursor }
			)
		} catch (err) {
			console.error('[Agent] drawDirectly failed:', err)
		} finally {
			this.callbacks.onStatusChange('idle')
		}
	}

	/**
	 * Drift Jarvis's cursor to wherever the user's pointer is on the page.
	 * Used for "come over here"-style commands — no voice response, no
	 * heavy agent, just an immediate move.
	 */
	comeHere(): void {
		const point = this.editor.inputs.currentPagePoint
		if (!point) return
		// Land slightly offset from the user's pointer so both cursors are
		// visible at once.
		this.cursor.driftTo(point.x + 24, point.y + 24, 900)
	}

	/**
	 * Render a hardcoded preset SVG instantly. Used when the user says
	 * "draw something" with no specific subject — no Quiver call, no
	 * latency, just an immediate hand-drawn animation.
	 */
	async drawSomething(): Promise<void> {
		this.callbacks.onStatusChange('thinking', 'Drawing...')
		try {
			const preset = pickRandomPreset()
			const pos = this.getNextCanvasPosition()
			console.log(`[Agent] drawSomething → preset "${preset.name}"`)
			await drawSvg(this.editor, preset.svg, {
				originX: pos.x,
				originY: pos.y,
				width: 400,
				animate: true,
				onPenMove: (x, y) => this.cursor.moveTo(x, y),
			})
		} catch (err) {
			console.error('[Agent] drawSomething failed:', err)
		} finally {
			this.callbacks.onStatusChange('idle')
		}
	}

	handleVoiceCommand(text: string, options: VoiceCommandOptions = {}) {
		const { x, y } = this.editor.getViewportScreenCenter()
		const center = this.editor.screenToPage({ x, y })
		const searchArea = new Box(
			center.x - NEARBY_MARGIN,
			center.y - NEARBY_MARGIN,
			NEARBY_MARGIN * 2,
			NEARBY_MARGIN * 2
		)
		const nearbyShapes = findNearbyShapes(this.editor, searchArea)

		return this.enqueue(`[Voice input] ${text}`, nearbyShapes, options)
	}

	private enqueue(
		text: string,
		nearbyShapes: ShapeContext[],
		options: VoiceCommandOptions
	): Promise<void> {
		if (this.processing) {
			this.pendingCommand = { text, nearbyShapes, options }
			return Promise.resolve()
		}
		return this.runAgentPipeline(text, nearbyShapes, options)
	}

	private drainQueue() {
		if (this.pendingCommand) {
			const { text, nearbyShapes, options } = this.pendingCommand
			this.pendingCommand = null
			void this.runAgentPipeline(text, nearbyShapes, options)
		}
	}

	private async runAgentPipeline(
		text: string,
		nearbyShapes: ShapeContext[],
		options: VoiceCommandOptions = {}
	) {
		this.processing = true
		this.callbacks.onStatusChange('thinking', 'Agent thinking...')

		try {
			// Capture canvas screenshot (highlights still visible in the image)
			const screenshotData = await captureCanvasScreenshot(this.editor)

			// Detect highlight-focused shapes and clean up highlight strokes
			const { highlightIds, focusedShapes } = findHighlightFocusedShapes(this.editor)
			if (highlightIds.length > 0) {
				this.editor.deleteShapes(highlightIds)
			}

			// Build user content parts
			const userParts: GeminiPart[] = []

			let userContent = text
			if (nearbyShapes.length > 0) {
				userContent += `\n\n[Nearby shapes:\n${describeShapesForPrompt(nearbyShapes)}]`
			}
			if (focusedShapes.length > 0) {
				userContent += `\n\n[Highlighted/focused shapes (user drew highlight strokes over these):\n${describeShapesForPrompt(focusedShapes)}]`
			}
			userParts.push({ text: userContent })

			// Add canvas screenshot
			if (screenshotData) {
				userParts.push({
					inlineData: { mimeType: screenshotData.mimeType, data: screenshotData.data },
				})
			}

			// If there are nearby images, extract base64 and add as inlineData
			const imageShapes = nearbyShapes.filter((s) => s.hasImage && s.assetId)
			for (const imgShape of imageShapes) {
				const imageData = await getImageBase64(this.editor, imgShape.assetId!)
				if (imageData) {
					userParts.push({
						inlineData: { mimeType: imageData.mimeType, data: imageData.data },
					})
				}
			}

			const systemPrompt = buildSystemPrompt(this.editor)

			// Build working contents: persistent history + current user turn
			const workingContents: GeminiContent[] = [
				...this.conversationHistory,
				{ role: 'user', parts: userParts },
			]

			// Agentic loop — runs until 'respond' tool is called or max iterations
			let orchestratorResponse: OrchestratorResponse | null = null

			for (let i = 0; i < MAX_AGENT_ITERATIONS; i++) {
				const response = await callGemini(systemPrompt, workingContents, AGENT_TOOLS)

				const candidate = response.candidates?.[0]
				if (!candidate) break

				const parts = candidate.content.parts
				const functionCalls = parts.filter(
					(p): p is GeminiPart & { functionCall: NonNullable<GeminiPart['functionCall']> } =>
						!!p.functionCall
				)

				if (functionCalls.length === 0) break

				// Add model response to working contents
				workingContents.push({ role: 'model', parts })

				// Execute function calls and build responses
				const responseParts: GeminiPart[] = []
				let gotResponse = false

				for (const part of functionCalls) {
					const result = await executeToolCall(
						this.editor,
						part.functionCall.name,
						part.functionCall.args,
						{ cursor: this.cursor }
					)

					if (result.isResponse && result.orchestratorResponse) {
						orchestratorResponse = result.orchestratorResponse
						gotResponse = true
					}

					responseParts.push({
						functionResponse: {
							name: part.functionCall.name,
							response: result as unknown as Record<string, unknown>,
						},
					})
				}

				workingContents.push({ role: 'user', parts: responseParts })

				// If we got a respond call, stop the loop
				if (gotResponse) break
			}

			// Condense this turn into clean user/model text for conversation memory
			this.conversationHistory.push({ role: 'user', parts: [{ text: userContent }] })
			if (orchestratorResponse) {
				this.conversationHistory.push({
					role: 'model',
					parts: [{ text: orchestratorResponse.speech }],
				})
			}

			// Compute the combined bounds of highlighted shapes (if any) for nearby placement
			let highlightBounds: Box | null = null
			if (focusedShapes.length > 0) {
				const boxes: Box[] = []
				for (const s of focusedShapes) {
					const b = this.editor.getShapePageBounds(s.id)
					if (b) boxes.push(b)
				}
				if (boxes.length > 0) {
					highlightBounds = Box.Common(boxes)
				}
			}

			// Execute the orchestrator response: voice + canvas
			if (orchestratorResponse) {
				await this.executeResponse(
					orchestratorResponse,
					highlightBounds,
					options.silent === true,
					options.deferCameraTour === true
				)
				// Capture the values needed for the deferred camera tour now
				// (placedShapeIds may be reset by a later turn).
				const speech = orchestratorResponse.speech ?? ''
				const items = orchestratorResponse.canvas ?? []
				const idsForTour = this.placedShapeIds.slice()
				options.onResult?.({
					speech,
					canvasItems: items,
					placedShapeIds: idsForTour,
					runCameraTour: () => {
						if (idsForTour.length > 0 && speech) {
							this.scheduleFallbackCameraTour(speech, items, idsForTour)
						}
					},
				})
			}

			this.callbacks.onStatusChange('idle')
		} catch (err) {
			// Don't leave the camera locked onto Jarvis if placement blew up.
			this.cursor.stopFollow()
			const message = err instanceof Error ? err.message : 'Unknown error'
			this.callbacks.onStatusChange('error', message)
			setTimeout(() => {
				this.callbacks.onStatusChange('idle')
			}, ERROR_CLEAR_DELAY_MS)
		} finally {
			this.processing = false
			this.drainQueue()
		}
	}

	/** IDs of shapes placed during the current response, used for relayout. */
	private placedShapeIds: TLShapeId[] = []

	/** Execute the orchestrator response: place canvas items immediately, play audio, animate camera. */
	private async executeResponse(
		response: OrchestratorResponse,
		highlightBounds: Box | null = null,
		silent = false,
		deferCameraTour = false
	) {
		this.callbacks.onStatusChange('thinking', 'Preparing canvas...')

		const canvasItems = response.canvas ?? []
		const useNotes = highlightBounds !== null
		this.placedShapeIds = []

		// Follow Jarvis's cursor while it places items. The camera tour
		// (scheduleCameraTour / scheduleFallbackCameraTour) takes over by
		// calling cursor.stopFollow() before its first zoomToBounds.
		this.cursor.startFollow()

		if (useNotes && highlightBounds) {
			// Place as sticky notes near the highlighted area
			await this.placeCanvasItemsNearHighlight(canvasItems, highlightBounds)
		} else {
			const startPos = this.getNextCanvasPosition()
			const ITEM_GAP = 350
			// 1. Place all canvas items, one-at-a-time with a small delay
			await this.placeAllCanvasItems(canvasItems, startPos, ITEM_GAP)

			// 2. Relayout so they stack tightly
			if (this.placedShapeIds.length > 0) {
				this.relayoutPlacedShapes(startPos.x)
				await new Promise((r) => setTimeout(r, 50))
			}
		}

		// Drift the cursor to the bottom-right of the last placed shape,
		// since relayout may have shifted things from where we put the
		// cursor during placement.
		if (this.placedShapeIds.length > 0) {
			const lastId = this.placedShapeIds[this.placedShapeIds.length - 1]
			this.cursor.driftToShape(lastId, 700)
		}

		// 3. Speech + camera tour
		// In silent mode, an upstream voice channel will narrate. We still
		// need a camera tour for visuals — schedule it on estimated timing.
		// If `deferCameraTour` is set, the caller will invoke it later
		// (synchronized to when their voice channel actually starts speaking).
		if (response.speech && silent && !deferCameraTour) {
			if (this.placedShapeIds.length > 0) {
				this.scheduleFallbackCameraTour(response.speech, canvasItems)
			}
		}
		if (response.speech && !silent) {
			if (USE_BROWSER_TTS) {
				// Use the browser's built-in speechSynthesis API
				this.callbacks.onStatusChange('thinking', 'Speaking...')
				if (this.placedShapeIds.length > 0) {
					this.scheduleFallbackCameraTour(response.speech, canvasItems)
				}
				await this.browserSpeak(response.speech)
			} else {
				const fillers = ['Preparing...', 'Processing...', 'Composing...', 'Generating...']
				const shuffled = fillers.sort(() => Math.random() - 0.5)
				let fillerIndex = 0
				this.callbacks.onStatusChange('thinking', shuffled[fillerIndex])
				const fillerInterval = setInterval(() => {
					fillerIndex = (fillerIndex + 1) % shuffled.length
					this.callbacks.onStatusChange('thinking', shuffled[fillerIndex])
				}, 1500)

				try {
					const audioBlob = await this.fetchTTSAudio(response.speech)
					clearInterval(fillerInterval)
					const audioUrl = URL.createObjectURL(audioBlob)
					const audio = new Audio(audioUrl)

					const audioPromise = new Promise<void>((resolve) => {
						audio.onended = () => {
							URL.revokeObjectURL(audioUrl)
							resolve()
						}
						audio.onerror = () => {
							URL.revokeObjectURL(audioUrl)
							resolve()
						}
					})

					this.callbacks.onStatusChange('thinking', 'Speaking...')
					audio.play()

					// Run camera tour alongside playback
					if (this.placedShapeIds.length > 0) {
						this.scheduleCameraTour(response.speech, canvasItems, audio)
					}

					await audioPromise
				} catch {
					clearInterval(fillerInterval)
					// ElevenLabs unavailable — fall back to browser TTS with camera tour
					if (this.placedShapeIds.length > 0) {
						this.scheduleFallbackCameraTour(response.speech, canvasItems)
					}
					this.fallbackSpeak(response.speech)
				}
			}
		}

		// Zoom to show placed items (locally for highlights, full canvas otherwise).
		// In deferred-camera-tour mode, the final zoom-to-fit happens at the END
		// of the tour instead — see scheduleFallbackCameraTour.
		if (this.placedShapeIds.length > 0 && !deferCameraTour) {
			// Belt-and-suspenders: if no tour fired (e.g. empty speech), follow
			// would override our zoomToFit/zoomToBounds. Stop it before zooming.
			this.cursor.stopFollow()
			if (useNotes && highlightBounds) {
				// Zoom to the highlight area + new notes
				const allBounds: Box[] = [highlightBounds]
				for (const id of this.placedShapeIds) {
					const b = this.editor.getShapePageBounds(id)
					if (b) allBounds.push(b)
				}
				const combined = Box.Common(allBounds).expandBy(80)
				this.editor.zoomToBounds(combined, { animation: { duration: 400 } })
			} else {
				this.editor.zoomToFit({ animation: { duration: 400 } })
			}
		}
	}

	/** Fetch TTS audio from the streaming ElevenLabs endpoint as a blob. */
	private async fetchTTSAudio(text: string): Promise<Blob> {
		const response = await fetch('/api/elevenlabs/tts', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text, voiceId: ELEVENLABS_DEFAULT_VOICE_ID }),
		})

		if (!response.ok) {
			throw new Error(`ElevenLabs TTS error ${response.status}`)
		}

		return response.blob()
	}

	/** Schedule camera animations to zoom to each canvas item at estimated times during audio playback. */
	private scheduleCameraTour(speech: string, canvasItems: CanvasItem[], audio: HTMLAudioElement) {
		// Slideshow takes over the camera now — stop following the cursor.
		this.cursor.stopFollow()
		// Estimate when each item's label appears in the speech as a fraction
		const schedule = this.buildCameraSchedule(speech, canvasItems)

		// Wait for audio to have a known duration, then schedule
		const onCanPlay = () => {
			audio.removeEventListener('canplaythrough', onCanPlay)
			const duration = audio.duration

			for (const { shapeId, fraction } of schedule) {
				const delayMs = fraction * duration * 1000
				setTimeout(() => {
					const bounds = this.editor.getShapePageBounds(shapeId)
					if (!bounds) return
					// Zoom to the shape with some padding
					const padded = bounds.clone().expandBy(100)
					this.editor.zoomToBounds(padded, { animation: { duration: 600 } })
				}, delayMs)
			}
		}

		if (audio.readyState >= 4) {
			onCanPlay()
		} else {
			audio.addEventListener('canplaythrough', onCanPlay)
		}
	}

	/** Schedule camera tour using estimated duration for browser TTS fallback. */
	private scheduleFallbackCameraTour(
		speech: string,
		canvasItems: CanvasItem[],
		shapeIds?: TLShapeId[]
	) {
		// Slideshow takes over the camera now — stop following the cursor.
		this.cursor.stopFollow()
		const schedule = this.buildCameraSchedule(speech, canvasItems, shapeIds)
		// Estimate speech duration: ~2.5 words per second
		const wordCount = speech.split(/\s+/).length
		const estimatedDuration = wordCount / 2.5
		const totalDurationMs = estimatedDuration * 1000

		for (const { shapeId, fraction } of schedule) {
			const delayMs = fraction * totalDurationMs
			setTimeout(() => {
				const bounds = this.editor.getShapePageBounds(shapeId)
				if (!bounds) return
				const padded = bounds.clone().expandBy(100)
				this.editor.zoomToBounds(padded, { animation: { duration: 600 } })
				// Drift Jarvis's cursor to this shape too — it lands a touch
				// off-center (bottom-right) and dances around it until the
				// next item's turn.
				this.cursor.driftToShape(shapeId, 900)
			}, delayMs)
		}

		// Final beat: once the narration is done, zoom out to fit everything
		// that was placed, and park Jarvis's cursor at the bottom-right of
		// the combined area so it lands somewhere sensible.
		const ids = (shapeIds ?? this.placedShapeIds).slice()
		if (ids.length > 0) {
			const FINAL_BEAT_DELAY_MS = 100
			setTimeout(() => {
				const allBounds: Box[] = []
				for (const id of ids) {
					const b = this.editor.getShapePageBounds(id)
					if (b) allBounds.push(b)
				}
				if (allBounds.length === 0) return
				const combined = Box.Common(allBounds)
				const padded = combined.clone().expandBy(80)
				this.editor.zoomToBounds(padded, { animation: { duration: 800 } })
				this.cursor.driftTo(combined.maxX + 24, combined.maxY + 24, 1000)
			}, totalDurationMs + FINAL_BEAT_DELAY_MS)
		}
	}

	/** Build a schedule mapping each canvas item to a fractional position in the speech. */
	private buildCameraSchedule(
		speech: string,
		canvasItems: CanvasItem[],
		shapeIds?: TLShapeId[]
	): { shapeId: TLShapeId; fraction: number }[] {
		const ids = shapeIds ?? this.placedShapeIds
		const speechLower = speech.toLowerCase()
		const schedule: { shapeId: TLShapeId; fraction: number }[] = []

		for (let i = 0; i < canvasItems.length; i++) {
			const shapeId = ids[i]
			if (!shapeId) continue

			const labelLower = canvasItems[i].label.toLowerCase()
			const labelIndex = speechLower.indexOf(labelLower)
			// Fraction of how far through the speech this label appears
			const fraction = labelIndex >= 0 ? labelIndex / speech.length : i / canvasItems.length

			schedule.push({ shapeId, fraction })
		}

		schedule.sort((a, b) => a.fraction - b.fraction)
		return schedule
	}

	/** Delay between placements so the cursor visibly drifts to each item. */
	private static readonly PLACEMENT_DELAY_MS = 600

	/** Place all canvas items, one at a time with a delay between. */
	private async placeAllCanvasItems(
		items: CanvasItem[],
		startPos: { x: number; y: number },
		gap: number
	) {
		for (let i = 0; i < items.length; i++) {
			if (i > 0) {
				await new Promise((r) => setTimeout(r, IntelligentCanvasAgent.PLACEMENT_DELAY_MS))
			}
			await this.placeCanvasItem(items[i], startPos.x, startPos.y + i * gap, false)
		}
	}

	/** Place canvas items as sticky notes arranged near the highlighted shapes. */
	private async placeCanvasItemsNearHighlight(items: CanvasItem[], highlightBounds: Box) {
		// Place notes starting just below the highlight area, slightly overlapping
		const NOTE_SIZE = 200
		const NOTE_GAP = 16
		const startX = highlightBounds.x
		const startY = highlightBounds.maxY - 40 // overlap slightly onto the highlighted content

		// Arrange notes in a row; wrap to next row if they'd exceed the highlight width + margin
		const maxRowWidth = Math.max(highlightBounds.w + 200, NOTE_SIZE * 3 + NOTE_GAP * 2)
		let curX = startX
		let curY = startY

		for (let i = 0; i < items.length; i++) {
			if (i > 0) {
				await new Promise((r) => setTimeout(r, IntelligentCanvasAgent.PLACEMENT_DELAY_MS))
			}
			if (curX - startX + NOTE_SIZE > maxRowWidth) {
				curX = startX
				curY += NOTE_SIZE + NOTE_GAP
			}
			await this.placeCanvasItem(items[i], curX, curY, true)
			curX += NOTE_SIZE + NOTE_GAP
		}
	}

	/** Place a single canvas item on the canvas and track its ID. */
	private async placeCanvasItem(item: CanvasItem, x: number, y: number, asNote: boolean) {
		if (item.type === 'text') {
			const id = asNote
				? placeNoteShape(this.editor, item.content, x, y)
				: placeTextShape(this.editor, item.content, x, y)
			this.placedShapeIds.push(id)
			// Wait a tick so tldraw computes shape bounds before we read them.
			await new Promise((r) => requestAnimationFrame(() => r(undefined)))
			this.cursor.driftToShape(id, 800)
		} else if (item.type === 'image_search') {
			const result = await placeImageFromSearch(this.editor, item.content, x, y)
			if (result) {
				this.placedShapeIds.push(result.shapeId)
				await new Promise((r) => requestAnimationFrame(() => r(undefined)))
				this.cursor.driftToShape(result.shapeId, 800)
			}
		}
	}

	/** Relayout placed shapes so they stack vertically with a small gap, no overlap. */
	private relayoutPlacedShapes(_startX: number) {
		if (this.placedShapeIds.length < 2) return
		this.editor.alignShapes(this.placedShapeIds, 'left')
		this.editor.stackShapes(this.placedShapeIds, 'vertical', 30)
	}

	/** Get the next available position on the canvas for placing items. */
	private getNextCanvasPosition(): { x: number; y: number } {
		const shapes = this.editor.getCurrentPageShapes()
		let maxBottom = 0
		let leftMost = Infinity
		let hasShapes = false

		for (const shape of shapes) {
			if (shape.type === 'arrow') continue
			const bounds = this.editor.getShapePageBounds(shape.id)
			if (!bounds) continue
			hasShapes = true
			const bottom = bounds.y + bounds.h
			if (bottom > maxBottom) maxBottom = bottom
			if (bounds.x < leftMost) leftMost = bounds.x
		}

		if (!hasShapes) {
			const { x, y } = this.editor.getViewportScreenCenter()
			const center = this.editor.screenToPage({ x, y })
			return { x: Math.round(center.x), y: Math.round(center.y) }
		}

		return {
			x: leftMost === Infinity ? 0 : Math.round(leftMost),
			y: Math.round(maxBottom + 60),
		}
	}

	/** Use browser speech synthesis and return a promise that resolves when done. */
	private browserSpeak(text: string): Promise<void> {
		return new Promise<void>((resolve) => {
			if (typeof window === 'undefined' || !window.speechSynthesis) {
				resolve()
				return
			}
			const utterance = new SpeechSynthesisUtterance(text)
			utterance.rate = 1.0
			utterance.pitch = 1.0
			utterance.onend = () => resolve()
			utterance.onerror = () => resolve()
			window.speechSynthesis.speak(utterance)
		})
	}

	/** Fall back to browser speech synthesis when ElevenLabs is unavailable (fire-and-forget). */
	private fallbackSpeak(text: string) {
		this.browserSpeak(text)
	}
}
