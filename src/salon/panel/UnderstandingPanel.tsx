import { useCallback, useEffect, useState } from 'react'
import { Editor } from 'tldraw'
import { connectWorks, generateNote, srcToImageFields } from '../ai/client'
import { type SalonNote, type Verdict, tasteToString } from '../ai/types'
import type { ArtworkShape } from '../shapes/ArtworkShapeUtil'
import {
	getConnection,
	getNote,
	getProfile,
	pairId,
	putConnection,
	putNote,
	type StoredConnection,
} from '../store/db'
import { Conversation } from './Conversation'
import { ConnectionView } from './ConnectionView'
import { HomeView } from './HomeView'
import { NoteView } from './NoteView'

export interface UnderstandingPanelProps {
	editor: Editor | null
	selected: ArtworkShape[]
	workCount: number
	backendAvailable: boolean | null
}

export function UnderstandingPanel({
	editor,
	selected,
	workCount,
	backendAvailable,
}: UnderstandingPanelProps) {
	return (
		<aside className="salon-panel">
			<header className="salon-panel__head">
				<h1 className="salon-panel__wordmark">Salon</h1>
				<p className="salon-panel__tagline">a private map of what you love</p>
			</header>

			<div className="salon-panel__body">
				{selected.length === 0 && (
					<HomeView
						editor={editor}
						workCount={workCount}
						backendAvailable={backendAvailable}
					/>
				)}
				{selected.length === 1 && (
					<WorkPanel
						key={selected[0].id}
						editor={editor}
						work={selected[0]}
						backendAvailable={backendAvailable}
					/>
				)}
				{selected.length === 2 && (
					<PairPanel
						key={pairId(selected[0].id, selected[1].id)}
						works={selected}
						backendAvailable={backendAvailable}
					/>
				)}
				{selected.length > 2 && (
					<p className="salon-prose salon-muted">
						{selected.length} works selected. Select a single work for a note, or two to
						argue a connection.
					</p>
				)}
			</div>
		</aside>
	)
}

type NoteStatus = 'idle' | 'loading' | 'ready' | 'error'

function WorkPanel({
	editor,
	work,
	backendAvailable,
}: {
	editor: Editor | null
	work: ArtworkShape
	backendAvailable: boolean | null
}) {
	const [status, setStatus] = useState<NoteStatus>('idle')
	const [note, setNote] = useState<SalonNote | null>(null)
	const [sessionId, setSessionId] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	// Load any previously-researched note for this work.
	useEffect(() => {
		let alive = true
		getNote(work.id).then((stored) => {
			if (!alive) return
			if (stored) {
				setNote(stored.note)
				setSessionId(stored.sessionId)
				setStatus('ready')
			}
		})
		return () => {
			alive = false
		}
	}, [work.id])

	const research = useCallback(async () => {
		setStatus('loading')
		setError(null)
		try {
			const taste = tasteToString((await getProfile()) ?? null)
			const { note: result, sessionId } = await generateNote({
				workId: work.id,
				caption: work.props.caption,
				...srcToImageFields(work.props.src),
				taste,
			})
			setNote(result)
			setSessionId(sessionId)
			setStatus('ready')
			await putNote({
				workId: work.id,
				note: result,
				sessionId,
				generatedAt: Date.now(),
			})
			// Write resolved identity back onto the canvas label.
			if (editor) {
				const id = result.identity
				editor.updateShape<ArtworkShape>({
					id: work.id,
					type: 'artwork',
					props: {
						title: id.title,
						maker: id.maker,
						year: id.year,
						medium: id.medium,
						identified: true,
					},
				})
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e))
			setStatus('error')
		}
	}, [editor, work.id, work.props.caption, work.props.src])

	const heading = work.props.title || work.props.caption || 'Untitled'

	if (status === 'ready' && note) {
		const ctx = [
			note.identity.title,
			note.identity.maker,
			note.identity.year,
			note.identity.medium,
		]
			.filter(Boolean)
			.join(', ')
		return (
			<div>
				<NoteView note={note} />
				<Conversation threadId={work.id} initialSessionId={sessionId} context={ctx} />
				<button className="salon-btn salon-btn--ghost" onClick={research}>
					Re-research
				</button>
			</div>
		)
	}

	if (status === 'loading') {
		return (
			<div className="salon-prose">
				<h2 className="salon-work-title">{heading}</h2>
				<p className="salon-muted salon-thinking">
					Reading the work, searching for primary sources, listening for where the
					historians disagree…
				</p>
			</div>
		)
	}

	return (
		<div className="salon-prose">
			<h2 className="salon-work-title">{heading}</h2>
			{work.props.identified && (work.props.maker || work.props.year) && (
				<p className="salon-work-meta">
					{[work.props.maker, work.props.year, work.props.medium].filter(Boolean).join(' · ')}
				</p>
			)}
			{status === 'error' && <p className="salon-error">{error}</p>}
			{backendAvailable === false ? (
				<p className="salon-muted">
					The researcher is offline. Salon's understanding layer needs the local dev
					backend (<code>yarn dev</code>) with Claude available — it isn't reachable on the
					static build.
				</p>
			) : (
				<>
					<p className="salon-muted">
						Have Salon identify this, find primary sources, and write a grounded,
						polyphonic note — then argue with it.
					</p>
					<button
						className="salon-btn"
						onClick={research}
						disabled={backendAvailable === null}
					>
						Research this work
					</button>
				</>
			)}
		</div>
	)
}

const workName = (w: ArtworkShape) => w.props.title || w.props.caption || 'Untitled'

function workIdentity(w: ArtworkShape): string {
	const { title, maker, year, medium, caption } = w.props
	const id = [title, maker, year, medium].filter(Boolean).join(', ')
	return id || caption || ''
}

function PairPanel({
	works,
	backendAvailable,
}: {
	works: ArtworkShape[]
	backendAvailable: boolean | null
}) {
	const id = pairId(works[0].id, works[1].id)
	const [status, setStatus] = useState<NoteStatus>('idle')
	const [stored, setStored] = useState<StoredConnection | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let alive = true
		getConnection(id).then((c) => {
			if (!alive || !c) return
			setStored(c)
			setStatus('ready')
		})
		return () => {
			alive = false
		}
	}, [id])

	const argue = useCallback(async () => {
		setStatus('loading')
		setError(null)
		try {
			const taste = tasteToString((await getProfile()) ?? null)
			const { connection, sessionId } = await connectWorks({
				pairId: id,
				a: {
					caption: works[0].props.caption,
					identity: workIdentity(works[0]),
					...srcToImageFields(works[0].props.src),
				},
				b: {
					caption: works[1].props.caption,
					identity: workIdentity(works[1]),
					...srcToImageFields(works[1].props.src),
				},
				taste,
			})
			const record: StoredConnection = {
				pairId: id,
				workIds: [works[0].id, works[1].id],
				connection,
				verdict: null,
				sessionId,
				generatedAt: Date.now(),
			}
			setStored(record)
			setStatus('ready')
			await putConnection(record)
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e))
			setStatus('error')
		}
	}, [id, works])

	const setVerdict = useCallback(
		async (v: Verdict) => {
			if (!stored) return
			const next = { ...stored, verdict: stored.verdict === v ? null : v }
			setStored(next)
			await putConnection(next)
		},
		[stored]
	)

	const title = (
		<h2 className="salon-work-title">
			{workName(works[0])} <span className="salon-muted">×</span> {workName(works[1])}
		</h2>
	)

	if (status === 'ready' && stored) {
		return (
			<div>
				{title}
				<ConnectionView connection={stored.connection} />
				<Verdicts current={stored.verdict} onSet={setVerdict} />
				<button className="salon-btn salon-btn--ghost" onClick={argue}>
					Argue again
				</button>
			</div>
		)
	}

	if (status === 'loading') {
		return (
			<div className="salon-prose">
				{title}
				<p className="salon-muted salon-thinking">
					Looking for what survives the jump between them
				</p>
			</div>
		)
	}

	return (
		<div className="salon-prose">
			{title}
			{status === 'error' && <p className="salon-error">{error}</p>}
			{backendAvailable === false ? (
				<p className="salon-muted">The researcher is offline (needs the local dev backend).</p>
			) : (
				<>
					<p className="salon-muted">
						Have Salon argue how these connect — reaching for what survives the jump between
						them — or honestly decline if it can't.
					</p>
					<button className="salon-btn" onClick={argue} disabled={backendAvailable === null}>
						Argue a connection
					</button>
				</>
			)}
		</div>
	)
}

function Verdicts({
	current,
	onSet,
}: {
	current: Verdict | null
	onSet: (v: Verdict) => void
}) {
	const opts: { v: Verdict; label: string }[] = [
		{ v: 'kept', label: 'Keep' },
		{ v: 'unsure', label: 'Unsure' },
		{ v: 'rejected', label: 'Reject' },
	]
	return (
		<div className="salon-verdicts">
			<span className="salon-voice__label">Your verdict</span>
			<div className="salon-verdicts__row">
				{opts.map((o) => (
					<button
						key={o.v}
						className={`salon-verdict ${current === o.v ? 'salon-verdict--on' : ''}`}
						onClick={() => onSet(o.v)}
					>
						{o.label}
					</button>
				))}
			</div>
		</div>
	)
}
