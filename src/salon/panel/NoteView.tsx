import { VOICE_LABEL, type NoteSource, type SalonNote } from '../ai/types'

function sourceIndex(sources: NoteSource[], id: string): number {
	return sources.findIndex((s) => s.id === id)
}

export function NoteView({ note }: { note: SalonNote }) {
	const { identity, voices, sources, thinness } = note
	const hasIdentity = identity.title || identity.maker || identity.medium

	return (
		<div className="salon-note">
			<header className="salon-note__id">
				<h2 className="salon-work-title">{identity.title || 'Unidentified'}</h2>
				{(identity.maker || identity.year || identity.medium) && (
					<p className="salon-work-meta">
						{[identity.maker, identity.year, identity.medium].filter(Boolean).join(' · ')}
					</p>
				)}
				{(identity.movement || identity.confidence) && (
					<p className="salon-note__confidence">
						{identity.movement && <span>{identity.movement}</span>}
						{identity.movement && ' · '}
						<span className={`salon-conf salon-conf--${identity.confidence}`}>
							{identity.confidence} confidence
						</span>
					</p>
				)}
				{identity.caveat && hasIdentity && (
					<p className="salon-note__caveat">{identity.caveat}</p>
				)}
			</header>

			<div className="salon-note__voices">
				{voices.map((v, i) => (
					<section key={i} className={`salon-voice salon-voice--${v.kind}`}>
						<span className="salon-voice__label">{VOICE_LABEL[v.kind]}</span>
						<p className="salon-voice__text">
							{v.text}
							{v.sourceIds.length > 0 && (
								<span className="salon-voice__cites">
									{v.sourceIds.map((id) => {
										const idx = sourceIndex(sources, id)
										if (idx < 0) return null
										const src = sources[idx]
										return (
											<a
												key={id}
												className="salon-cite"
												href={src.url}
												target="_blank"
												rel="noreferrer"
												title={`${src.title}${src.publisher ? ` — ${src.publisher}` : ''}`}
											>
												{idx + 1}
											</a>
										)
									})}
								</span>
							)}
						</p>
					</section>
				))}
			</div>

			{thinness && <p className="salon-note__thinness">{thinness}</p>}

			{sources.length > 0 && (
				<details className="salon-sources" open>
					<summary>Sources</summary>
					<ol className="salon-sources__list">
						{sources.map((s) => (
							<li key={s.id}>
								<a href={s.url} target="_blank" rel="noreferrer">
									{s.title || s.url}
								</a>
								{s.publisher && <span className="salon-muted"> — {s.publisher}</span>}
							</li>
						))}
					</ol>
				</details>
			)}
		</div>
	)
}
