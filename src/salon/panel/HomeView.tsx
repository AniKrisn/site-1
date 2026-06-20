import { useCallback, useEffect, useState } from 'react'
import { Editor } from 'tldraw'
import { getSuggestion, updateProfile } from '../ai/client'
import { EMPTY_PROFILE, tasteToString, type Suggestion, type TasteProfile } from '../ai/types'
import { getProfile, putProfile } from '../store/db'
import { buildCollectionString, buildVerdictsString } from './collection'

export function HomeView({
	editor,
	workCount,
	backendAvailable,
}: {
	editor: Editor | null
	workCount: number
	backendAvailable: boolean | null
}) {
	const [profile, setProfile] = useState<TasteProfile | null>(null)
	const [obs, setObs] = useState('')
	const [refreshing, setRefreshing] = useState(false)

	const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
	const [suggesting, setSuggesting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		getProfile().then((p) => {
			if (p) {
				setProfile(p)
				setObs(p.observations)
			}
		})
	}, [])

	const refine = useCallback(async () => {
		setRefreshing(true)
		setError(null)
		try {
			const updated = await updateProfile({
				current: tasteToString(profile),
				collection: buildCollectionString(editor),
				verdicts: await buildVerdictsString(),
			})
			setProfile(updated)
			setObs(updated.observations)
			await putProfile(updated)
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e))
		} finally {
			setRefreshing(false)
		}
	}, [editor, profile])

	const saveObs = useCallback(async () => {
		const base = profile ?? EMPTY_PROFILE
		if (obs === base.observations) return
		const next = { ...base, observations: obs }
		setProfile(next)
		await putProfile(next)
	}, [obs, profile])

	const suggest = useCallback(async () => {
		setSuggesting(true)
		setError(null)
		setSuggestion(null)
		try {
			const s = await getSuggestion({
				collection: buildCollectionString(editor),
				taste: tasteToString(profile),
			})
			setSuggestion(s)
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e))
		} finally {
			setSuggesting(false)
		}
	}, [editor, profile])

	const offline = backendAvailable === false

	return (
		<div className="salon-prose">
			{workCount === 0 ? (
				<>
					<p>The wall is empty.</p>
					<p className="salon-muted">
						Drop or paste an image — a painting, a chair, an amplifier — anywhere on the
						left, or paste an image URL. Arrange them however you like; the arrangement is
						yours and it means something.
					</p>
				</>
			) : (
				<p className="salon-muted">
					{workCount} {workCount === 1 ? 'work' : 'works'} on the wall. Select one for a note,
					two to argue a connection.
				</p>
			)}

			{error && <p className="salon-error">{error}</p>}

			{/* What to look at next */}
			<div className="salon-home__block">
				<div className="salon-chat__rule">
					<span>What to look at next</span>
				</div>
				{suggestion ? (
					<div className="salon-suggestion">
						<h3 className="salon-work-title salon-suggestion__title">
							{suggestion.title}
							{suggestion.maker && (
								<span className="salon-work-meta"> — {suggestion.maker}</span>
							)}
						</h3>
						<p className="salon-voice__text salon-suggestion__why">{suggestion.why}</p>
						{suggestion.where && (
							<p className="salon-muted salon-suggestion__where">{suggestion.where}</p>
						)}
						{suggestion.sources.length > 0 && (
							<ol className="salon-sources__list">
								{suggestion.sources.map((s) => (
									<li key={s.id}>
										<a href={s.url} target="_blank" rel="noreferrer">
											{s.title || s.url}
										</a>
									</li>
								))}
							</ol>
						)}
						<button className="salon-btn salon-btn--ghost" onClick={suggest} disabled={suggesting}>
							Suggest another
						</button>
					</div>
				) : suggesting ? (
					<p className="salon-muted salon-thinking">Looking across your collection</p>
				) : offline ? (
					<p className="salon-muted">Offline — needs the local dev backend.</p>
				) : (
					<button className="salon-btn" onClick={suggest} disabled={backendAvailable === null}>
						Suggest one thing
					</button>
				)}
			</div>

			{/* Your eye */}
			<div className="salon-home__block">
				<div className="salon-chat__rule">
					<span>Your eye</span>
				</div>
				{profile && (profile.qualities.length || profile.makers.length || profile.movements.length) ? (
					<div className="salon-taste">
						<ChipRow label="Qualities" items={profile.qualities} />
						<ChipRow label="Makers" items={profile.makers} />
						<ChipRow label="Movements" items={profile.movements} />
					</div>
				) : (
					<p className="salon-muted" style={{ fontSize: 13 }}>
						As you add and react to works, Salon builds a portrait of your eye here. It's
						always yours to edit.
					</p>
				)}

				<textarea
					className="salon-chat__input salon-taste__obs"
					value={obs}
					placeholder="Salon's read on your eye — edit freely; it won't overwrite your words."
					onChange={(e) => setObs(e.target.value)}
					onBlur={saveObs}
					rows={3}
				/>

				{!offline && (
					<button className="salon-btn salon-btn--ghost" onClick={refine} disabled={refreshing}>
						{refreshing ? 'Refining…' : 'Refine from my collection'}
					</button>
				)}
			</div>
		</div>
	)
}

function ChipRow({ label, items }: { label: string; items: string[] }) {
	if (!items.length) return null
	return (
		<div className="salon-chips">
			<span className="salon-voice__label">{label}</span>
			<div className="salon-chips__row">
				{items.map((it) => (
					<span key={it} className="salon-chip">
						{it}
					</span>
				))}
			</div>
		</div>
	)
}
