/**
 * LiveVoiceController — push-to-talk that uses browser WebSpeech for STT,
 * Gemini Live for spoken output, and the heavy canvas agent for canvas work.
 *
 * Hold "M" to talk. On release we get the final transcript and:
 *   1. Send it to Live → primer plays (~3-4s)
 *   2. Dispatch to the heavy canvas agent (in parallel)
 *   3. When the heavy agent returns, narrate(speech) — buffered until Live's
 *      primer finishes so we don't interrupt mid-sentence.
 */

import { useCallback, useEffect, useRef } from 'react'
import type { IntelligentCanvasAgent } from '../agent/IntelligentCanvasAgent'
import { drawCache } from '../lib/draw-cache'
import { GeminiLiveSession, type LiveStatus } from './GeminiLiveSession'

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
	// Last successfully-drawn subject. Used to handle "do that again"-style
	// follow-ups without re-running the heavy agent.
	const lastDrawSubjectRef = useRef<string | null>(null)

	// Create the Live session once and warm up the WebSocket so the first
	// utterance doesn't pay the ~6s setup-handshake cost.
	useEffect(() => {
		const session = new GeminiLiveSession({
			onStatusChange: (status, message) => {
				onStatus?.(status, message)
			},
			onModelTranscript: (text) => {
				console.log(`[Live] model said: ${text}`)
			},
		})
		sessionRef.current = session
		// Best-effort eager connect — ignore failures, retry lazily on first use.
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
			const agent = agentRef.current
			if (!session || !agent) return

			console.log(`[Voice] transcript: "${text}"`)

			// In case the eager connect hasn't completed yet.
			await session.connect().catch(() => {})

			// "Come over here" — silent action, no Live, no heavy. Just move
			// Jarvis's cursor to the user's pointer.
			if (isComeHereCommand(text)) {
				console.log(`[Voice] come-here intent — moving cursor`)
				agent.comeHere()
				return
			}

			// "What have you drawn?" — answer from the cache, no Quiver, no agent.
			if (isMemoryQuery(text)) {
				const subjects = drawCache.listSubjects()
				const memoryReply =
					subjects.length === 0
						? "I haven't drawn anything yet — ask me to draw something first."
						: subjects.length === 1
							? `So far, just ${subjects[0]}.`
							: `So far I've drawn ${formatList(subjects)}.`
				console.log(`[Voice] memory query → ${subjects.length} cached`)
				// Frame as a user request asking Live to read out the answer.
				session.sendUserText(
					`The user asked what you've drawn so far. Reply briefly with: "${memoryReply}"`
				)
				return
			}

			// "Draw something / anything / whatever / surprise me" — no
			// subject given. Render a hardcoded preset instantly.
			if (isDrawSomething(text)) {
				console.log(`[Voice] draw-something path → preset`)
				session.sendUserText(text)
				void agent.drawSomething()
				return
			}

			// Drawing intent — skip the heavy agent entirely. Either pull the
			// new subject out of the phrase, or treat "again"-style follow-ups
			// as a re-draw of the last subject.
			let drawSubject = parseDrawSubject(text)
			if (!drawSubject && isRedrawAgain(text) && lastDrawSubjectRef.current) {
				drawSubject = lastDrawSubjectRef.current
				console.log(`[Voice] redraw-again → reusing "${drawSubject}"`)
			}
			if (drawSubject) {
				console.log(`[Voice] draw-only path → "${drawSubject}"`)
				lastDrawSubjectRef.current = drawSubject
				session.sendUserText(text)
				void agent.drawDirectly(drawSubject)
				return
			}

			// 1. Live primer (text in → audio out)
			session.sendUserText(text)

			// 2. Heavy agent in parallel. We defer the camera tour so it fires
			// the moment Live actually starts speaking the depth answer — that
			// way the camera moves match the words, not the silent transition.
			const t0 = performance.now()
			void agent.handleVoiceCommand(text, {
				silent: true,
				deferCameraTour: true,
				onResult: (result) => {
					const elapsed = Math.round(performance.now() - t0)
					console.log(
						`[Heavy] finished in ${elapsed}ms, speech len=${result.speech.length}, items=${result.canvasItems.length}`
					)
					if (result.speech) {
						sessionRef.current?.narrate(result.speech, () => {
							// Narration audio just started — kick off camera tour.
							result.runCameraTour()
						})
					}
				},
			})
		},
		[agentRef]
	)

	const startRecognition = useCallback(() => {
		if (disabled) return
		if (!window.webkitSpeechRecognition) {
			console.warn('[Voice] webkitSpeechRecognition not supported in this browser')
			return
		}
		// If something's already listening, ignore — keypress repeat or jitter.
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
		// onend will null out the ref and fire onRecordingChange(false).
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
			// Critical: prime/resume the output AudioContext on the user
			// gesture. If we wait until audio chunks arrive (~6s+ later for
			// the first session due to setup handshake), the autoplay policy
			// keeps the context suspended and you hear nothing.
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
 * Look for a draw-intent verb anywhere in the transcript and pull the noun
 * phrase that follows it. Returns null if no draw verb appears, or if no
 * usable subject can be extracted. We use this to bypass the heavyweight
 * agent entirely for drawing requests — the agent's research pipeline isn't
 * needed to render a Quiver SVG, and running it adds Wikipedia text/images
 * that aren't wanted.
 */
function parseDrawSubject(text: string): string | null {
	// Match "<verb> [me] [a|an|the] <subject>" anywhere in the sentence.
	// Subject ends at the next clause boundary (please/now/again/then/and),
	// punctuation, or end of string.
	const re =
		/(?:draw|sketch|illustrate|paint|doodle|render)\s+(?:me\s+)?(?:a\s+|an\s+|the\s+|some\s+)?([a-zA-Z][a-zA-Z\s'-]{0,60}?)(?=\s+(?:please|now|again|too|also|then|and)\b|[?.!,]|$)/i
	const match = text.match(re)
	if (!match) return null
	const subject = match[1].trim()
	if (!subject || subject.length < 2) return null
	return subject
}

/**
 * Detect "come over here" / "come to me" / "fly over" / "follow me" /
 * "where are you" style commands that should move Jarvis's cursor to the
 * user's pointer without any voice response. Broad matcher — the user
 * might phrase this many ways.
 */
function isComeHereCommand(text: string): boolean {
	const t = text.toLowerCase().trim()
	// "come/fly/drift/move/get/head over here / to me / closer"
	if (
		/\b(come|fly|drift|float|move|get|head)\s+(on\s+)?(over\s+)?(here|to\s+me|to\s+my\s+(cursor|pointer|mouse|side)|closer)\b/.test(
			t
		)
	)
		return true
	// "over here, jarvis" / "jarvis, over here"
	if (/\bover\s+here\b/.test(t)) return true
	// "follow me" / "follow my cursor"
	if (/\bfollow\s+(me|my\s+(cursor|pointer|mouse))\b/.test(t)) return true
	// "where are you" / "where'd you go"
	if (/\bwhere\s+(are\s+you|did\s+you\s+go|'?d\s+you\s+go)\b/.test(t)) return true
	// "get back here" / "get over here"
	if (/\bget\s+(back|over)\s+here\b/.test(t)) return true
	return false
}

/**
 * Detect "draw something / anything / whatever / surprise me" phrasings —
 * the user wants Jarvis to draw but isn't specifying what. We render a
 * hardcoded preset SVG instead of asking Quiver for "something".
 */
function isDrawSomething(text: string): boolean {
	const t = text.toLowerCase().trim()
	return (
		/\b(draw|sketch|illustrate|paint|doodle)\s+(?:me\s+)?(?:something|anything|whatever)\b/.test(
			t
		) ||
		/\bsurprise\s+me\b/.test(t) ||
		/\b(draw|sketch)\s+(?:me\s+)?(?:a\s+)?random\b/.test(t)
	)
}

/**
 * Detect "do it again"-style follow-up phrasings that imply re-drawing the
 * previous subject without naming it explicitly.
 */
function isRedrawAgain(text: string): boolean {
	const t = text.toLowerCase()
	return /\b(again|same\s+(thing|one|svg|drawing|sketch|fish)|once more|redo|do that)\b/.test(t)
}

/**
 * Detect "what have you drawn / what can you draw / what's in your sketchbook"
 * style memory-query phrasings. Used to short-circuit straight to a cache
 * read instead of going through Quiver or the heavy agent.
 */
function isMemoryQuery(text: string): boolean {
	const t = text.toLowerCase().trim()
	if (!/\b(draw|drawn|drawings|sketch|sketches|sketchbook)\b/.test(t)) return false
	return (
		/\bwhat\s+(have|'?ve|do|can)\s+you\b/.test(t) ||
		/\bwhat\s+(are|'?re)\s+the\s+(things|drawings|sketches)\b/.test(t) ||
		/\b(check|see|show|list|tell\s+me)\s+(your|the)\s+(memory|sketchbook|drawings|cache)\b/.test(
			t
		) ||
		/\bdo\s+you\s+(remember|know\s+how\s+to\s+draw)\b/.test(t) ||
		/\bwhat\s+can\s+you\s+already\s+draw\b/.test(t)
	)
}

/** Join an array as "a, b, and c" / "a and b" / "a". */
function formatList(items: string[]): string {
	if (items.length === 0) return ''
	if (items.length === 1) return items[0]
	if (items.length === 2) return `${items[0]} and ${items[1]}`
	return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1]
}
