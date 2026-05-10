/**
 * Persistent cache of previously-generated drawings, keyed by subject.
 * Backed by localStorage so it survives page reloads. Used to skip the
 * (slow + paid) Quiver round-trip when the user asks for something we've
 * already drawn.
 *
 * Subjects are normalized — lowercased, trimmed, leading articles removed —
 * so "Fish", "a fish", and "the fish " all resolve to the same key.
 */

const STORAGE_KEY = 'jarvis-draw-cache-v1'

interface CacheEntry {
	svg: string
	prompt: string // the original (non-normalized) subject
	createdAt: number
}

type CacheMap = Record<string, CacheEntry>

/** Normalize a subject for cache keys. */
function normalize(subject: string): string {
	return subject
		.toLowerCase()
		.trim()
		.replace(/^(a|an|the|some)\s+/i, '')
		.replace(/[?.!,;:]+$/, '')
		.replace(/\s+/g, ' ')
}

function readAll(): CacheMap {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return {}
		return JSON.parse(raw) as CacheMap
	} catch {
		return {}
	}
}

function writeAll(map: CacheMap): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
	} catch {
		// Quota exceeded or no localStorage — silently degrade.
	}
}

export const drawCache = {
	/** Look up a previously-saved drawing. Returns null on miss. */
	get(subject: string): CacheEntry | null {
		const key = normalize(subject)
		const all = readAll()
		return all[key] ?? null
	},

	/** Save a drawing. Overwrites any prior entry for the same normalized subject. */
	set(subject: string, svg: string): void {
		const key = normalize(subject)
		const all = readAll()
		all[key] = { svg, prompt: subject.trim(), createdAt: Date.now() }
		writeAll(all)
	},

	/** Remove a single entry. Pass an unnormalized subject. */
	remove(subject: string): void {
		const key = normalize(subject)
		const all = readAll()
		delete all[key]
		writeAll(all)
	},

	/** Wipe the entire cache. */
	clear(): void {
		writeAll({})
	},

	/** Return the original prompts of every cached drawing, newest first. */
	listSubjects(): string[] {
		const all = readAll()
		return Object.values(all)
			.sort((a, b) => b.createdAt - a.createdAt)
			.map((e) => e.prompt)
	},

	/** Number of cached drawings. */
	size(): number {
		return Object.keys(readAll()).length
	},
}
