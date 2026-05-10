/**
 * Persistent cache of previously-generated drawings, keyed by subject + quality.
 * Backed by localStorage so it survives page reloads. Used to skip the
 * (slow + paid) Quiver round-trip when the user asks for something we've
 * already drawn.
 *
 * Subjects are normalized — lowercased, trimmed, leading articles removed —
 * so "Fish", "a fish", and "the fish " all resolve to the same key. The
 * quality level ('fast' | 'high') is appended so the same subject at
 * different qualities don't collide.
 */

const STORAGE_KEY = 'jarvis-draw-cache-v2'

export type DrawQuality = 'fast' | 'high'

interface CacheEntry {
	svg: string
	prompt: string // the original (non-normalized) subject
	quality: DrawQuality
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

function compositeKey(subject: string, quality: DrawQuality): string {
	return `${normalize(subject)}:${quality}`
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
	get(subject: string, quality: DrawQuality = 'fast'): CacheEntry | null {
		const key = compositeKey(subject, quality)
		const all = readAll()
		return all[key] ?? null
	},

	/** Save a drawing. Overwrites any prior entry for the same normalized subject + quality. */
	set(subject: string, svg: string, quality: DrawQuality = 'fast'): void {
		const key = compositeKey(subject, quality)
		const all = readAll()
		all[key] = { svg, prompt: subject.trim(), quality, createdAt: Date.now() }
		writeAll(all)
	},

	/** Remove a single entry. Pass an unnormalized subject. */
	remove(subject: string, quality: DrawQuality = 'fast'): void {
		const key = compositeKey(subject, quality)
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
		const seen = new Set<string>()
		const subjects: string[] = []
		for (const entry of Object.values(all).sort((a, b) => b.createdAt - a.createdAt)) {
			if (seen.has(entry.prompt)) continue
			seen.add(entry.prompt)
			subjects.push(entry.prompt)
		}
		return subjects
	},

	/** Number of cached drawings. */
	size(): number {
		return Object.keys(readAll()).length
	},
}
