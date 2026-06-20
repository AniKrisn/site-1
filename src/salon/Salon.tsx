import { useCallback, useEffect, useState } from 'react'
import { Editor } from 'tldraw'
import { ThemeToggle } from '../ThemeToggle'
import { checkBackend } from './ai/client'
import { SalonCanvas } from './canvas/SalonCanvas'
import { UnderstandingPanel } from './panel/UnderstandingPanel'
import './salon.css'
import type { ArtworkShape } from './shapes/ArtworkShapeUtil'

export default function Salon() {
	const [editor, setEditor] = useState<Editor | null>(null)
	const [selected, setSelected] = useState<ArtworkShape[]>([])
	const [workCount, setWorkCount] = useState(0)
	const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null)

	useEffect(() => {
		checkBackend().then(setBackendAvailable)
	}, [])

	const recountWorks = useCallback((editor: Editor) => {
		const works = editor.getCurrentPageShapes().filter((s) => s.type === 'artwork')
		setWorkCount(works.length)
	}, [])

	const handleMount = useCallback(
		(editor: Editor) => {
			setEditor(editor)
			recountWorks(editor)
			// Keep the work count fresh as the wall changes.
			const stop = editor.store.listen(() => recountWorks(editor), {
				source: 'all',
				scope: 'document',
			})
			return stop
		},
		[recountWorks]
	)

	const handleSelectionChange = useCallback((shapes: ArtworkShape[]) => {
		setSelected(shapes)
	}, [])

	return (
		<div className="salon-root">
			<section className="salon-canvas-pane">
				<SalonCanvas onMount={handleMount} onSelectionChange={handleSelectionChange} />
			</section>
			<UnderstandingPanel
				editor={editor}
				selected={selected}
				workCount={workCount}
				backendAvailable={backendAvailable}
			/>
			<ThemeToggle />
		</div>
	)
}
