import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Editor, TLComponents, Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { AgentStatus, IntelligentCanvasAgent } from './agent/IntelligentCanvasAgent'
import { JarvisCursor } from './cursor/JarvisCursor'
import './jarvis.css'
import { HelpOverlay } from './ui/HelpOverlay'
import type { LiveStatus } from './voice/GeminiLiveSession'
import { LiveVoiceController } from './voice/LiveVoiceController'

interface JarvisContextValue {
	agentRef: React.MutableRefObject<IntelligentCanvasAgent | null>
	agentAvailable: boolean
	setLiveStatus: (s: LiveStatus, m?: string) => void
	setRecording: (r: boolean) => void
}

const JarvisContext = createContext<JarvisContextValue | null>(null)

function InFrontOfTheCanvasContent() {
	const ctx = useContext(JarvisContext)
	if (!ctx) return null
	return (
		<>
			<LiveVoiceController
				agentRef={ctx.agentRef}
				disabled={!ctx.agentAvailable}
				onStatus={ctx.setLiveStatus}
				onRecordingChange={ctx.setRecording}
			/>
			<HelpOverlay />
		</>
	)
}

const components: TLComponents = {
	InFrontOfTheCanvas: InFrontOfTheCanvasContent,
}

export default function Jarvis() {
	const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle')
	const [liveStatus, setLiveStatusState] = useState<LiveStatus>('idle')
	const [recording, setRecording] = useState(false)
	const [agentAvailable, setAgentAvailable] = useState(false)
	const [agentReady, setAgentReady] = useState(false)
	const agentRef = useRef<IntelligentCanvasAgent | null>(null)
	const cursorRef = useRef<JarvisCursor | null>(null)

	useEffect(() => {
		fetch('/api/gemini/status')
			.then((r) => r.json())
			.then((d: { available: boolean }) => setAgentAvailable(d.available))
			.catch(() => setAgentAvailable(false))
	}, [])

	const handleMount = useCallback((editor: Editor) => {
		const cursor = new JarvisCursor(editor)
		cursor.start()
		cursorRef.current = cursor

		const agent = new IntelligentCanvasAgent(editor, cursor, {
			onStatusChange: (status) => setAgentStatus(status),
		})
		agentRef.current = agent
		setAgentReady(true)
		return () => {
			cursor.stop()
			agentRef.current = null
			cursorRef.current = null
			setAgentReady(false)
		}
	}, [])

	const setLiveStatus = useCallback((s: LiveStatus, _m?: string) => {
		setLiveStatusState(s)
	}, [])

	// Map combined React state → cursor status. Priority: speaking > recording
	// > thinking > idle. JarvisCursor handles the actual rendering (dot
	// animation, "Speaking…" caption, etc.).
	useEffect(() => {
		if (!agentReady) return
		const cursor = cursorRef.current
		if (!cursor) return

		if (liveStatus === 'speaking') cursor.setStatus('speaking')
		else if (recording) cursor.setStatus('recording')
		else if (agentStatus === 'thinking' || liveStatus === 'connecting') cursor.setStatus('thinking')
		else cursor.setStatus('idle')
	}, [agentReady, agentStatus, liveStatus, recording])

	const ctxValue = useMemo<JarvisContextValue>(
		() => ({
			agentRef,
			agentAvailable,
			setLiveStatus,
			setRecording,
		}),
		[agentAvailable, setLiveStatus]
	)

	return (
		<JarvisContext.Provider value={ctxValue}>
			<div style={{ position: 'fixed', inset: 0 }}>
				<Tldraw
					persistenceKey="jarvis-site"
					licenseKey="tldraw-2031-05-04/WyJwYkFiRF9nYiIsWyIqLmFuaWtyaXNuLmNvbSJdLDksIjIwMzEtMDUtMDQiXQ.CS3+s2htHT+HSMOeL5DkZegH5Io/oDQFj6SwCtz9ElSuEfJTyzsK7O3rQg3bkWs2xE0whupSvrw5nqI+hP0puw"
					components={components}
					onMount={handleMount}
				/>
			</div>
		</JarvisContext.Provider>
	)
}
