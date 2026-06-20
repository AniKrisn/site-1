import type { NoteSource, SalonConnection } from '../ai/types'

function Cites({ ids, sources }: { ids: string[]; sources: NoteSource[] }) {
	if (!ids.length) return null
	return (
		<span className="salon-voice__cites">
			{ids.map((id) => {
				const idx = sources.findIndex((s) => s.id === id)
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
	)
}

export function ConnectionView({ connection }: { connection: SalonConnection }) {
	const { stance, headline, argument, grounds, sources } = connection
	return (
		<div className="salon-note">
			<span className={`salon-stance salon-stance--${stance}`}>
				{stance === 'connected' ? 'A connection' : 'No defensible connection'}
			</span>
			<h2 className="salon-work-title salon-connection__headline">{headline}</h2>

			<div className="salon-voice salon-voice--salon salon-connection__arg">
				<p className="salon-voice__text">{argument}</p>
			</div>

			{grounds.length > 0 && (
				<div className="salon-connection__grounds">
					<span className="salon-voice__label">Grounded in</span>
					<ul>
						{grounds.map((g, i) => (
							<li key={i}>
								{g.text}
								<Cites ids={g.sourceIds} sources={sources} />
							</li>
						))}
					</ul>
				</div>
			)}

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
