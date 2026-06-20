import { useCallback } from 'react'
import { Editor, TLComponents, TLUiOverrides, Tldraw, react } from 'tldraw'
import 'tldraw/tldraw.css'
import { ArtworkShapeUtil, type ArtworkShape } from '../shapes/ArtworkShapeUtil'
import { addArtworkFromFile, addArtworkFromUrl } from './addArtwork'

const shapeUtils = [ArtworkShapeUtil]

// Quiet gallery chrome: hide the noisier default UI, keep navigation.
const components: TLComponents = {
	Background: null,
}

const overrides: TLUiOverrides = {}

function viewportCenter(editor: Editor) {
	return editor.getViewportPageBounds().center
}

export interface SalonCanvasProps {
	/** May return a cleanup function, run when the editor unmounts. */
	onMount: (editor: Editor) => void | (() => void)
	/** Called with the currently-selected artwork shapes (0, 1, or 2+). */
	onSelectionChange: (shapes: ArtworkShape[]) => void
}

export function SalonCanvas({ onMount, onSelectionChange }: SalonCanvasProps) {
	const handleMount = useCallback(
		(editor: Editor) => {
			// --- Adding works: route dropped/pasted content into artwork shapes ---
			editor.registerExternalContentHandler('files', async ({ point, files }) => {
				const at = point ?? viewportCenter(editor)
				let offset = 0
				for (const file of files) {
					if (!file.type.startsWith('image/')) continue
					await addArtworkFromFile(editor, file, { x: at.x + offset, y: at.y + offset })
					offset += 24
				}
			})

			editor.registerExternalContentHandler('url', async ({ point, url }) => {
				const at = point ?? viewportCenter(editor)
				await addArtworkFromUrl(editor, url, at)
			})

			// --- Selection -> right panel ---
			const stop = react('salon-selection', () => {
				const selected = editor
					.getSelectedShapes()
					.filter((s): s is ArtworkShape => s.type === 'artwork')
				onSelectionChange(selected)
			})

			const cleanupMount = onMount(editor)

			return () => {
				stop()
				cleanupMount?.()
			}
		},
		[onMount, onSelectionChange]
	)

	return (
		<Tldraw
			persistenceKey="salon-canvas-v1"
			shapeUtils={shapeUtils}
			components={components}
			overrides={overrides}
			onMount={handleMount}
		/>
	)
}
