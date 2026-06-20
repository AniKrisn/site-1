import type { SalonConnection, SalonNote, Suggestion, TasteProfile } from './types'

/** Whether the Claude backend (dev only) is reachable. */
export async function checkBackend(): Promise<boolean> {
	try {
		const r = await fetch('/api/salon/status')
		if (!r.ok) return false
		const d = (await r.json()) as { available: boolean }
		return d.available
	} catch {
		return false
	}
}

export interface NoteRequest {
	workId: string
	caption: string
	imageDataUrl?: string
	imageUrl?: string
	taste?: string
}

/** Split a work's `src` into the right field for the note request. */
export function srcToImageFields(src: string): Pick<NoteRequest, 'imageDataUrl' | 'imageUrl'> {
	if (!src) return {}
	return src.startsWith('data:') ? { imageDataUrl: src } : { imageUrl: src }
}

export interface NoteResponse {
	note: SalonNote
	sessionId: string | null
}

export async function generateNote(req: NoteRequest): Promise<NoteResponse> {
	const r = await fetch('/api/salon/note', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(req),
	})
	if (!r.ok) {
		const d = (await r.json().catch(() => ({}))) as { error?: string }
		throw new Error(d.error || `Note request failed (${r.status})`)
	}
	return (await r.json()) as NoteResponse
}

export interface ConnectWorkInput {
	caption?: string
	identity?: string
	imageDataUrl?: string
	imageUrl?: string
}

export interface ConnectResponse {
	connection: SalonConnection
	sessionId: string | null
}

export async function connectWorks(req: {
	pairId: string
	a: ConnectWorkInput
	b: ConnectWorkInput
	taste?: string
}): Promise<ConnectResponse> {
	const r = await fetch('/api/salon/connect', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(req),
	})
	if (!r.ok) {
		const d = (await r.json().catch(() => ({}))) as { error?: string }
		throw new Error(d.error || `Connection request failed (${r.status})`)
	}
	return (await r.json()) as ConnectResponse
}

export async function updateProfile(req: {
	current: string
	collection: string
	verdicts: string
}): Promise<TasteProfile> {
	const r = await fetch('/api/salon/profile', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(req),
	})
	if (!r.ok) {
		const d = (await r.json().catch(() => ({}))) as { error?: string }
		throw new Error(d.error || `Profile update failed (${r.status})`)
	}
	return ((await r.json()) as { profile: TasteProfile }).profile
}

export async function getSuggestion(req: {
	collection: string
	taste: string
}): Promise<Suggestion> {
	const r = await fetch('/api/salon/suggest', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(req),
	})
	if (!r.ok) {
		const d = (await r.json().catch(() => ({}))) as { error?: string }
		throw new Error(d.error || `Suggestion failed (${r.status})`)
	}
	return ((await r.json()) as { suggestion: Suggestion }).suggestion
}

export interface ChatResponse {
	reply: string
	sessionId: string | null
}

export async function sendChat(req: {
	workId: string
	message: string
	sessionId: string | null
	context?: string
}): Promise<ChatResponse> {
	const r = await fetch('/api/salon/chat', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(req),
	})
	if (!r.ok) {
		const d = (await r.json().catch(() => ({}))) as { error?: string }
		throw new Error(d.error || `Chat request failed (${r.status})`)
	}
	return (await r.json()) as ChatResponse
}
