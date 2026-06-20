import { Editor, TLShapeId, createShapeId } from 'tldraw'
import type { ArtworkShape } from '../shapes/ArtworkShapeUtil'

/** Longest edge a freshly-dropped work is scaled to, in canvas units. */
const MAX_EDGE = 320

function readFileAsDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => resolve(reader.result as string)
		reader.onerror = () => reject(reader.error)
		reader.readAsDataURL(file)
	})
}

function loadImageSize(src: string): Promise<{ w: number; h: number }> {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
		img.onerror = () => reject(new Error('image failed to load'))
		img.src = src
	})
}

function fitToMaxEdge(w: number, h: number): { w: number; h: number } {
	if (!w || !h) return { w: MAX_EDGE, h: MAX_EDGE }
	const scale = MAX_EDGE / Math.max(w, h)
	return { w: Math.round(w * scale), h: Math.round(h * scale) }
}

function createAt(
	editor: Editor,
	src: string,
	dims: { w: number; h: number },
	point: { x: number; y: number },
	caption: string
): TLShapeId {
	const id = createShapeId()
	const { w, h } = fitToMaxEdge(dims.w, dims.h)
	editor.createShape<ArtworkShape>({
		id,
		type: 'artwork',
		// center the work on the drop point
		x: point.x - w / 2,
		y: point.y - h / 2,
		props: {
			w,
			h,
			src,
			caption,
			title: '',
			maker: '',
			year: '',
			medium: '',
			identified: false,
		},
	})
	return id
}

/** Add a work from a dropped/pasted image file. */
export async function addArtworkFromFile(
	editor: Editor,
	file: File,
	point: { x: number; y: number }
): Promise<TLShapeId | null> {
	try {
		const src = await readFileAsDataUrl(file)
		const dims = await loadImageSize(src).catch(() => ({ w: MAX_EDGE, h: MAX_EDGE }))
		const caption = file.name.replace(/\.[a-z0-9]+$/i, '')
		return createAt(editor, src, dims, point, caption)
	} catch {
		return null
	}
}

/** Add a work from a pasted/dropped image URL. */
export async function addArtworkFromUrl(
	editor: Editor,
	url: string,
	point: { x: number; y: number }
): Promise<TLShapeId | null> {
	try {
		// Try to measure it; if the host blocks cross-origin loads we still keep
		// the URL and fall back to a square — the image tag itself isn't subject
		// to the same restriction for plain display.
		const dims = await loadImageSize(url).catch(() => ({ w: MAX_EDGE, h: MAX_EDGE }))
		return createAt(editor, url, dims, point, '')
	} catch {
		return null
	}
}
