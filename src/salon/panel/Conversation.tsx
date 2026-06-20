import { useEffect, useRef, useState } from 'react'
import { sendChat } from '../ai/client'
import { getThread, putThread, type ChatMessage } from '../store/db'

export function Conversation({
	threadId,
	initialSessionId,
	context,
}: {
	threadId: string
	/** session id from the work's note, so the first reply stays grounded. */
	initialSessionId: string | null
	/** fallback identity string if there's no session to resume. */
	context: string
}) {
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [sessionId, setSessionId] = useState<string | null>(initialSessionId)
	const [draft, setDraft] = useState('')
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const endRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		let alive = true
		getThread(threadId).then((t) => {
			if (!alive || !t) return
			setMessages(t.messages)
			if (t.sessionId) setSessionId(t.sessionId)
		})
		return () => {
			alive = false
		}
	}, [threadId])

	useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
	}, [messages, busy])

	async function send() {
		const text = draft.trim()
		if (!text || busy) return
		setDraft('')
		setError(null)
		const userMsg: ChatMessage = { role: 'user', content: text, at: Date.now() }
		const next = [...messages, userMsg]
		setMessages(next)
		setBusy(true)
		try {
			const { reply, sessionId: newSession } = await sendChat({
				workId: threadId,
				message: text,
				sessionId,
				context,
			})
			const salonMsg: ChatMessage = { role: 'salon', content: reply, at: Date.now() }
			const all = [...next, salonMsg]
			setMessages(all)
			const sid = newSession ?? sessionId
			setSessionId(sid)
			await putThread({ threadId, messages: all, sessionId: sid })
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e))
			setMessages(next) // keep the user's message; let them retry
		} finally {
			setBusy(false)
		}
	}

	function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			send()
		}
	}

	return (
		<div className="salon-chat">
			<div className="salon-chat__rule">
				<span>Argue with it</span>
			</div>

			{messages.map((m, i) => (
				<div key={i} className={`salon-msg salon-msg--${m.role}`}>
					{m.content}
				</div>
			))}
			{busy && <div className="salon-msg salon-msg--salon salon-thinking">thinking</div>}
			{error && <p className="salon-error">{error}</p>}
			<div ref={endRef} />

			<div className="salon-chat__compose">
				<textarea
					className="salon-chat__input"
					placeholder="Push back, ask, disagree…"
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={onKey}
					rows={2}
					disabled={busy}
				/>
				<button className="salon-btn" onClick={send} disabled={busy || !draft.trim()}>
					Send
				</button>
			</div>
		</div>
	)
}
