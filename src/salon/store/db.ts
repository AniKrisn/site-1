// Local-first persistence for the understanding layer. The canvas layout and
// images persist via tldraw; the heavier AI artifacts live here in IndexedDB.
//
// Raw IndexedDB (no dependency). All stores are created up front so later
// slices don't need a version bump.

import type { SalonConnection, SalonNote, TasteProfile, Verdict } from '../ai/types'

const DB_NAME = 'salon'
const DB_VERSION = 1

export const STORES = {
	notes: 'notes',
	connections: 'connections',
	messages: 'messages',
	profile: 'profile',
} as const

export interface StoredNote {
	workId: string
	note: SalonNote
	sessionId: string | null
	generatedAt: number
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
	if (dbPromise) return dbPromise
	dbPromise = new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION)
		req.onupgradeneeded = () => {
			const db = req.result
			if (!db.objectStoreNames.contains(STORES.notes)) {
				db.createObjectStore(STORES.notes, { keyPath: 'workId' })
			}
			if (!db.objectStoreNames.contains(STORES.connections)) {
				// keyed by a stable pair id, e.g. sorted "a|b"
				db.createObjectStore(STORES.connections, { keyPath: 'pairId' })
			}
			if (!db.objectStoreNames.contains(STORES.messages)) {
				// keyed by threadId; value holds the message list
				db.createObjectStore(STORES.messages, { keyPath: 'threadId' })
			}
			if (!db.objectStoreNames.contains(STORES.profile)) {
				db.createObjectStore(STORES.profile, { keyPath: 'id' })
			}
		}
		req.onsuccess = () => resolve(req.result)
		req.onerror = () => reject(req.error)
	})
	return dbPromise
}

async function tx<T>(
	store: string,
	mode: IDBTransactionMode,
	fn: (s: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
	const db = await openDb()
	return new Promise<T>((resolve, reject) => {
		const t = db.transaction(store, mode)
		const req = fn(t.objectStore(store))
		req.onsuccess = () => resolve(req.result)
		req.onerror = () => reject(req.error)
	})
}

// --- Notes ---------------------------------------------------------------

export async function getNote(workId: string): Promise<StoredNote | undefined> {
	return tx<StoredNote | undefined>(STORES.notes, 'readonly', (s) => s.get(workId))
}

export async function putNote(value: StoredNote): Promise<void> {
	await tx(STORES.notes, 'readwrite', (s) => s.put(value))
}

export async function deleteNote(workId: string): Promise<void> {
	await tx(STORES.notes, 'readwrite', (s) => s.delete(workId))
}

// --- Connections ---------------------------------------------------------

/** A stable, order-independent id for a pair of works. */
export function pairId(a: string, b: string): string {
	return [a, b].sort().join('|')
}

export interface StoredConnection {
	pairId: string
	workIds: [string, string]
	connection: SalonConnection
	verdict: Verdict | null
	sessionId: string | null
	generatedAt: number
}

export async function getConnection(id: string): Promise<StoredConnection | undefined> {
	return tx<StoredConnection | undefined>(STORES.connections, 'readonly', (s) => s.get(id))
}

export async function putConnection(value: StoredConnection): Promise<void> {
	await tx(STORES.connections, 'readwrite', (s) => s.put(value))
}

export async function getAllConnections(): Promise<StoredConnection[]> {
	return tx<StoredConnection[]>(STORES.connections, 'readonly', (s) => s.getAll())
}

// --- Conversation threads ------------------------------------------------

export interface ChatMessage {
	role: 'user' | 'salon'
	content: string
	at: number
}

export interface StoredThread {
	threadId: string
	messages: ChatMessage[]
	/** latest Claude session id, resumed to keep the thread grounded. */
	sessionId: string | null
}

export async function getThread(threadId: string): Promise<StoredThread | undefined> {
	return tx<StoredThread | undefined>(STORES.messages, 'readonly', (s) => s.get(threadId))
}

export async function putThread(value: StoredThread): Promise<void> {
	await tx(STORES.messages, 'readwrite', (s) => s.put(value))
}

// --- Taste profile -------------------------------------------------------

const PROFILE_ID = 'me'

interface StoredProfile {
	id: string
	profile: TasteProfile
	updatedAt: number
}

export async function getProfile(): Promise<TasteProfile | undefined> {
	const rec = await tx<StoredProfile | undefined>(STORES.profile, 'readonly', (s) =>
		s.get(PROFILE_ID)
	)
	return rec?.profile
}

export async function putProfile(profile: TasteProfile): Promise<void> {
	const rec: StoredProfile = { id: PROFILE_ID, profile, updatedAt: Date.now() }
	await tx(STORES.profile, 'readwrite', (s) => s.put(rec))
}
