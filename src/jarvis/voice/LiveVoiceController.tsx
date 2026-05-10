/**
 * LiveVoiceController — push-to-talk that uses browser WebSpeech for STT
 * and Gemini Live for spoken output + intent routing.
 *
 * Flow per turn:
 *   1. Hold M → WebSpeech listens
 *   2. Release M → final transcript
 *   3. Send transcript to Live as a user turn
 *   4. Live decides which tool to call (draw, come_here, draw_random,
 *      redraw_last, list_drawings, answer_with_canvas) — or just talks
 *      back if no tool fits
 *   5. We dispatch the tool to the agent and return any result Live
 *      should see
 *   6. Live continues speaking accordingly
 *
 * No client-side regex matching for intent — Live owns that decision.
 */

import { useCallback, useEffect, useRef } from 'react'
import type { IntelligentCanvasAgent } from '../agent/IntelligentCanvasAgent'
import { drawCache, type DrawQuality } from '../lib/draw-cache'
import { GeminiLiveSession, type LiveStatus, type LiveToolCall } from './GeminiLiveSession'

interface SpeechRecognitionEvent {
	results: { [index: number]: { [index: number]: { transcript: string } } }
}
interface SpeechRecognitionInstance {
	continuous: boolean
	interimResults: boolean
	lang: string
	start(): void
	stop(): void
	onresult: ((e: SpeechRecognitionEvent) => void) | null
	onerror: (() => void) | null
	onend: (() => void) | null
}
declare global {
	interface Window {
		webkitSpeechRecognition: new () => SpeechRecognitionInstance
	}
}

interface LiveVoiceControllerProps {
	agentRef: React.MutableRefObject<IntelligentCanvasAgent | null>
	disabled?: boolean
	onStatus?: (status: LiveStatus, message?: string) => void
	onRecordingChange?: (recording: boolean) => void
}

export function LiveVoiceController({
	agentRef,
	disabled,
	onStatus,
	onRecordingChange,
}: LiveVoiceControllerProps) {
	const sessionRef = useRef<GeminiLiveSession | null>(null)
	const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
	// Memory of the last successful draw — Live's redraw_last tool reads this.
	const lastDrawRef = useRef<{ subject: string; quality: DrawQuality } | null>(null)

	// Create the Live session once and warm up the WebSocket so the first
	// utterance doesn't pay the ~6s setup-handshake cost.
	useEffect(() => {
		const session = new GeminiLiveSession({
			onStatusChange: (status, message) => onStatus?.(status, message),
			onModelTranscript: (text) => console.log(`[Live] model said: ${text}`),
			onToolCall: async (call) => handleToolCall(call, agentRef, lastDrawRef, sessionRef),
		})
		sessionRef.current = session
		session.connect().catch((err) => console.warn('[Live] eager connect failed', err))

		return () => {
			void session.close()
			sessionRef.current = null
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const handleTranscript = useCallback(
		async (text: string) => {
			const session = sessionRef.current
			if (!session) return

			console.log(`[Voice] transcript: "${text}"`)
			await session.connect().catch(() => {})
			session.sendUserText(text)
		},
		[]
	)

	const startRecognition = useCallback(() => {
		if (disabled) return
		if (!window.webkitSpeechRecognition) {
			console.warn('[Voice] webkitSpeechRecognition not supported in this browser')
			return
		}
		if (recognitionRef.current) return

		const recognition = new window.webkitSpeechRecognition()
		recognition.continuous = false
		recognition.interimResults = false
		recognition.lang = 'en-US'

		recognition.onresult = (e) => {
			const transcript = e.results[0][0].transcript
			if (transcript.trim()) handleTranscript(transcript.trim())
		}
		recognition.onerror = () => {
			recognitionRef.current = null
			onRecordingChange?.(false)
		}
		recognition.onend = () => {
			recognitionRef.current = null
			onRecordingChange?.(false)
		}

		recognitionRef.current = recognition
		recognition.start()
		onRecordingChange?.(true)
	}, [disabled, handleTranscript, onRecordingChange])

	const stopRecognition = useCallback(() => {
		recognitionRef.current?.stop()
	}, [])

	useEffect(() => {
		const inEditableTarget = (el: EventTarget | null) => {
			const target = el as HTMLElement | null
			if (!target) return false
			return (
				target.tagName === 'INPUT' ||
				target.tagName === 'TEXTAREA' ||
				target.tagName === 'SELECT' ||
				target.isContentEditable
			)
		}
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.repeat) return
			if (e.key !== 'm' && e.key !== 'M') return
			if (inEditableTarget(e.target)) return
			e.preventDefault()
			sessionRef.current?.primeAudio()
			startRecognition()
		}
		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.key !== 'm' && e.key !== 'M') return
			stopRecognition()
		}
		window.addEventListener('keydown', handleKeyDown)
		window.addEventListener('keyup', handleKeyUp)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
			window.removeEventListener('keyup', handleKeyUp)
		}
	}, [startRecognition, stopRecognition])

	return null
}

/**
 * Dispatch a tool call from Live to the right agent method. Returns a
 * value Live will see in the function-response. For fire-and-forget
 * actions we just acknowledge; for query-style tools (list_drawings) we
 * return the data.
 */
async function handleToolCall(
	call: LiveToolCall,
	agentRef: React.MutableRefObject<IntelligentCanvasAgent | null>,
	lastDrawRef: React.MutableRefObject<{ subject: string; quality: DrawQuality } | null>,
	sessionRef: React.MutableRefObject<GeminiLiveSession | null>
): Promise<Record<string, unknown>> {
	const agent = agentRef.current
	if (!agent) return { ok: false, error: 'agent not ready' }

	console.log(`[Voice] tool: ${call.name}(${JSON.stringify(call.args)})`)

	switch (call.name) {
		case 'draw': {
			const subject = String(call.args.subject ?? '').trim()
			const rawQuality = String(call.args.quality ?? 'fast').toLowerCase()
			const quality: DrawQuality = rawQuality === 'high' ? 'high' : 'fast'
			if (!subject) return { ok: false, error: 'no subject given' }
			lastDrawRef.current = { subject, quality }
			void agent.drawDirectly(subject, quality)
			return { ok: true, status: 'started', subject, quality }
		}

		case 'come_here': {
			agent.comeHere()
			return { ok: true }
		}

		case 'draw_random': {
			void agent.drawSomething()
			return { ok: true, status: 'started' }
		}

		case 'redraw_last': {
			const last = lastDrawRef.current
			if (!last) return { ok: false, error: 'nothing drawn yet' }
			void agent.drawDirectly(last.subject, last.quality)
			return { ok: true, status: 'started', subject: last.subject, quality: last.quality }
		}

		case 'list_drawings': {
			const subjects = drawCache.listSubjects()
			return {
				ok: true,
				count: subjects.length,
				subjects,
				summary:
					subjects.length === 0
						? "nothing drawn yet"
						: subjects.length === 1
							? `one drawing: ${subjects[0]}`
							: `${subjects.length} drawings: ${subjects.join(', ')}`,
			}
		}

		case 'answer_with_canvas': {
			const intent = String(call.args.intent ?? '').trim()
			if (!intent) return { ok: false, error: 'no intent' }
			const t0 = performance.now()
			void agent.handleVoiceCommand(intent, {
				silent: true,
				deferCameraTour: true,
				onResult: (result) => {
					const elapsed = Math.round(performance.now() - t0)
					console.log(
						`[Heavy] finished in ${elapsed}ms, speech len=${result.speech.length}, items=${result.canvasItems.length}`
					)
					if (result.speech) {
						sessionRef.current?.narrate(result.speech, () => result.runCameraTour())
					}
				},
			})
			return { ok: true, status: 'delegated', intent }
		}

		default:
			return { ok: false, error: `unknown tool: ${call.name}` }
	}
}
