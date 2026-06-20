import { Editor } from 'tldraw'
import type { ArtworkShape } from '../shapes/ArtworkShapeUtil'
import { getAllConnections } from '../store/db'

export function artworkShapes(editor: Editor | null): ArtworkShape[] {
	if (!editor) return []
	return editor
		.getCurrentPageShapes()
		.filter((s): s is ArtworkShape => s.type === 'artwork')
}

export function describeWork(w: ArtworkShape): string {
	const { title, maker, year, medium, caption } = w.props
	const id = [title, maker, year, medium].filter(Boolean).join(', ')
	if (id && caption && !title) return `${id} (the collector calls it "${caption}")`
	return id || caption || 'an unidentified work'
}

/** A plain-text list of what's on the wall, for the researcher's context. */
export function buildCollectionString(editor: Editor | null): string {
	return artworkShapes(editor)
		.map((w, i) => `${i + 1}. ${describeWork(w)}`)
		.join('\n')
}

/** A plain-text summary of the connections the collector has judged. */
export async function buildVerdictsString(): Promise<string> {
	const conns = await getAllConnections()
	return conns
		.filter((c) => c.verdict)
		.map((c) => `- ${c.verdict}: "${c.connection.headline}"`)
		.join('\n')
}
