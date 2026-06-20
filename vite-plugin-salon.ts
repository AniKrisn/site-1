import { spawn } from 'child_process'
import { randomUUID } from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'
import type { Plugin } from 'vite'

/**
 * Salon dev backend.
 *
 * Salon's understanding layer is grounded by spawning a headless Claude Code
 * instance (`claude -p`) per request. That subprocess uses the machine's
 * existing Claude login (subscription quota — no ANTHROPIC_API_KEY), and has
 * the WebSearch / WebFetch tools for live, citable retrieval.
 *
 * Like the Gemini proxy, this only runs under `vite dev`; the static GitHub
 * Pages build has no backend.
 */

// Default model. Override with SALON_MODEL in .env.local (e.g. "opus").
const DEFAULT_MODEL = 'sonnet'

interface RunResult<T> {
	ok: boolean
	structured: T | null
	text: string
	sessionId: string | null
	error: string | null
}

interface RunOptions {
	prompt: string
	systemPrompt: string
	schema?: object
	allowedTools?: string[]
	/** base64 data URL of an image to make available to the model via Read. */
	imageDataUrl?: string
	/** remote image URL; downloaded server-side (avoids CORS) and Read by the model. */
	imageUrl?: string
	/** labelled images (for multi-work prompts like connections). */
	images?: ImageInput[]
	/** resume a prior thread for conversational context. */
	resumeSessionId?: string
	/**
	 * Stable key (e.g. a workId) → a persistent working directory. Claude Code
	 * scopes session transcripts to the cwd, so resuming a thread requires
	 * running in the same dir the thread was created in. When omitted, a throwaway
	 * temp dir is used and cleaned up.
	 */
	workdirKey?: string
	model?: string
	timeoutMs?: number
}

interface ImageInput {
	label: string
	/** filesystem-safe basename (no extension) for the written file. */
	basename: string
	dataUrl?: string
	url?: string
}

function sanitizeKey(key: string): string {
	return key.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80)
}

function extFromContentType(ct: string): string {
	return ct.includes('png')
		? 'png'
		: ct.includes('webp')
			? 'webp'
			: ct.includes('gif')
				? 'gif'
				: 'jpg'
}

/** Write an image into `dir`. Returns a path (preferred) or a bare URL fallback. */
async function materializeImage(
	dir: string,
	img: ImageInput
): Promise<{ label: string; path?: string; url?: string }> {
	if (img.dataUrl) {
		const decoded = decodeDataUrl(img.dataUrl)
		if (decoded) {
			const p = path.join(dir, `${img.basename}.${decoded.ext}`)
			fs.writeFileSync(p, decoded.buffer)
			return { label: img.label, path: p }
		}
	}
	if (img.url) {
		try {
			const resp = await fetch(img.url)
			const ct = resp.headers.get('content-type') ?? ''
			if (resp.ok && ct.startsWith('image/')) {
				const p = path.join(dir, `${img.basename}.${extFromContentType(ct)}`)
				fs.writeFileSync(p, Buffer.from(await resp.arrayBuffer()))
				return { label: img.label, path: p }
			}
		} catch {
			// fall through to URL text
		}
		return { label: img.label, url: img.url }
	}
	return { label: img.label }
}

function decodeDataUrl(dataUrl: string): { ext: string; buffer: Buffer } | null {
	const m = /^data:(image\/[a-z0-9.+-]+);base64,(.*)$/i.exec(dataUrl)
	if (!m) return null
	const mime = m[1].toLowerCase()
	const ext = mime.includes('png')
		? 'png'
		: mime.includes('webp')
			? 'webp'
			: mime.includes('gif')
				? 'gif'
				: 'jpg'
	return { ext, buffer: Buffer.from(m[2], 'base64') }
}

async function runClaude<T = unknown>(opts: RunOptions): Promise<RunResult<T>> {
	const model = opts.model || process.env.SALON_MODEL || DEFAULT_MODEL
	const timeoutMs = opts.timeoutMs ?? 300_000

	// Working dir. Stable per thread (so sessions resume) or throwaway. The
	// work's image lives here so the model can Read it (cwd is allowed by default).
	const ephemeral = !opts.workdirKey
	const dir = opts.workdirKey
		? path.join(os.tmpdir(), 'salon-sessions', sanitizeKey(opts.workdirKey))
		: fs.mkdtempSync(path.join(os.tmpdir(), 'salon-'))
	if (opts.workdirKey) fs.mkdirSync(dir, { recursive: true })
	let prompt = opts.prompt

	try {
		// Collect every image to make available (single legacy fields + list).
		const inputs: ImageInput[] = [...(opts.images ?? [])]
		if (opts.imageDataUrl || opts.imageUrl) {
			inputs.unshift({
				label: 'The work',
				basename: 'work',
				dataUrl: opts.imageDataUrl,
				url: opts.imageUrl,
			})
		}
		if (inputs.length) {
			const materialized = await Promise.all(inputs.map((i) => materializeImage(dir, i)))
			const lines = materialized.map((m) =>
				m.path
					? `- ${m.label}: ${m.path}`
					: m.url
						? `- ${m.label}: (image URL) ${m.url}`
						: `- ${m.label}: (no image available)`
			)
			const anyPath = materialized.some((m) => m.path)
			prompt = `Image file(s)${anyPath ? ' — Read each one first' : ''}:\n${lines.join('\n')}\n\n${prompt}`
		}

		const args = [
			'-p',
			prompt,
			'--output-format',
			'json',
			'--model',
			model,
			'--append-system-prompt',
			opts.systemPrompt,
		]
		if (opts.schema) args.push('--json-schema', JSON.stringify(opts.schema))
		const tools = opts.allowedTools ?? ['WebSearch', 'WebFetch', 'Read']
		args.push('--allowedTools', tools.join(','))
		if (opts.resumeSessionId) args.push('--resume', opts.resumeSessionId)

		// Use the machine's Claude login — never the API key.
		const env = { ...process.env }
		delete env.ANTHROPIC_API_KEY
		delete env.ANTHROPIC_AUTH_TOKEN

		const result = await new Promise<RunResult<T>>((resolve) => {
			// stdin ignored: the prompt comes via -p, and leaving stdin open makes
			// claude wait for piped input.
			const child = spawn('claude', args, { cwd: dir, env, stdio: ['ignore', 'pipe', 'pipe'] })
			let stdout = ''
			let stderr = ''
			let settled = false

			const timer = setTimeout(() => {
				if (settled) return
				settled = true
				child.kill('SIGKILL')
				resolve({
					ok: false,
					structured: null,
					text: '',
					sessionId: null,
					error: 'The researcher took too long and was stopped.',
				})
			}, timeoutMs)

			child.stdout.on('data', (d) => (stdout += d))
			child.stderr.on('data', (d) => (stderr += d))

			child.on('error', (err) => {
				if (settled) return
				settled = true
				clearTimeout(timer)
				resolve({
					ok: false,
					structured: null,
					text: '',
					sessionId: null,
					error:
						err.message.includes('ENOENT')
							? 'The `claude` CLI was not found on PATH.'
							: err.message,
				})
			})

			child.on('close', () => {
				if (settled) return
				settled = true
				clearTimeout(timer)
				try {
					const env = JSON.parse(stdout) as {
						is_error?: boolean
						result?: string
						structured_output?: T
						session_id?: string
					}
					if (env.is_error) {
						resolve({
							ok: false,
							structured: null,
							text: env.result ?? '',
							sessionId: env.session_id ?? null,
							error: env.result || 'The researcher returned an error.',
						})
						return
					}
					resolve({
						ok: true,
						structured: env.structured_output ?? null,
						text: env.result ?? '',
						sessionId: env.session_id ?? null,
						error: null,
					})
				} catch {
					resolve({
						ok: false,
						structured: null,
						text: '',
						sessionId: null,
						error: stderr.slice(0, 400) || 'Could not parse the researcher response.',
					})
				}
			})
		})
		return result
	} finally {
		if (ephemeral) fs.rm(dir, { recursive: true, force: true }, () => {})
	}
}

// --- HTTP plumbing -------------------------------------------------------

function readBody(req: import('http').IncomingMessage): Promise<string> {
	return new Promise((resolve) => {
		const chunks: Buffer[] = []
		req.on('data', (c: Buffer) => chunks.push(c))
		req.on('end', () => resolve(Buffer.concat(chunks).toString()))
	})
}

function sendJson(res: import('http').ServerResponse, status: number, body: unknown) {
	res.statusCode = status
	res.setHeader('Content-Type', 'application/json')
	res.end(JSON.stringify(body))
}

// --- Prompts (the heart) -------------------------------------------------

const SALON_VOICE = `You are Salon — a knowledgeable, opinionated companion for one person's private collection of art, objects, and design that they love. You are a researcher and interlocutor, never an organizer. You never rearrange or auto-tag their canvas; the arrangement is their thinking and it is theirs.

Your register: a sharp, well-read gallery friend who has a point of view and is willing to be wrong. You make arguments and invite disagreement. Avoid two failure modes equally: hedging mush ("some might say...") and purple art-criticism cliché ("a sublime meditation on the human condition"). Be specific and concrete.

GROUNDING IS NON-NEGOTIABLE. Every factual claim must trace to a source you actually retrieved via WebSearch or WebFetch. Prefer primary and authoritative sources: museum pages (the Met, Art Institute of Chicago, Getty, Tate, MoMA), the maker's own writings/letters/interviews, reputable scholarship; Wikipedia/Wikidata only as scaffolding. If you did not retrieve a source for a claim, do not make the claim. NEVER fabricate an attribution, a quote, a date, or a URL. Only include URLs you genuinely visited.

When sources are thin or conflict, say so plainly — "I couldn't find much on this" is a trust-building answer, not a failure.

The collector is drawn to CROSS-MEDIUM qualities — things that survive the jump between a painting and an amplifier: glow, atmosphere, density, restraint, the way an object seems to hum. When you interpret or connect, reach for those, not for "both are landscapes."`

const NOTE_SCHEMA = {
	type: 'object',
	additionalProperties: false,
	properties: {
		identity: {
			type: 'object',
			additionalProperties: false,
			properties: {
				title: { type: 'string', description: 'Title of the work, or "" if unknown.' },
				maker: { type: 'string', description: 'Artist/maker/designer/manufacturer, or "".' },
				year: { type: 'string', description: 'Year or period, or "".' },
				medium: { type: 'string', description: 'Medium/material/type, or "".' },
				movement: { type: 'string', description: 'Movement/school/style, or "".' },
				confidence: { type: 'string', enum: ['high', 'medium', 'low', 'unknown'] },
				caveat: {
					type: 'string',
					description: 'Honest note on uncertainty, or "" if confident.',
				},
			},
			required: ['title', 'maker', 'year', 'medium', 'movement', 'confidence', 'caveat'],
		},
		voices: {
			type: 'array',
			description: 'The polyphonic note. 2-6 short passages, each in one voice.',
			items: {
				type: 'object',
				additionalProperties: false,
				properties: {
					kind: {
						type: 'string',
						enum: ['documented', 'maker', 'scholarship', 'salon'],
						description:
							'documented = established fact; maker = a short attributed quote from the maker; scholarship = what historians/critics argue, including disagreement; salon = your own interpretation/cross-medium argument, labelled as argument.',
					},
					text: { type: 'string' },
					sourceIds: {
						type: 'array',
						items: { type: 'string' },
						description: 'ids from the sources array backing this passage. salon voice may be empty.',
					},
				},
				required: ['kind', 'text', 'sourceIds'],
			},
		},
		sources: {
			type: 'array',
			items: {
				type: 'object',
				additionalProperties: false,
				properties: {
					id: { type: 'string', description: 'short id like "s1"' },
					title: { type: 'string' },
					url: { type: 'string' },
					publisher: { type: 'string' },
				},
				required: ['id', 'title', 'url', 'publisher'],
			},
		},
		thinness: {
			type: 'string',
			description: 'If sources were thin or conflicting, say so here. Otherwise "".',
		},
	},
	required: ['identity', 'voices', 'sources', 'thinness'],
}

function notePrompt(caption: string, taste?: string): string {
	const tasteLine = taste
		? `\n\nWhat you've learned about this collector's eye so far (let it quietly inform your reading; do not pander):\n${taste}`
		: ''
	const capLine = caption
		? `The collector labelled it: "${caption}". Treat this as a hint, not gospel.`
		: 'The collector added no caption.'
	return `A work the collector loves has been added to their wall. ${capLine}

1. IDENTIFY it from the image (title, maker, year, medium, movement). For non-canonical things — a chair, a guitar pedal, an interior — you may only get a type or a designer, or nothing. That's fine; set confidence honestly and never invent an attribution.
2. RESEARCH it via web search, preferring primary/authoritative sources.
3. Write a POLYPHONIC note: distinct short passages in the documented / maker / scholarship / salon voices. Surface disagreement between scholars where it exists. End the salon voice with something that invites pushback.

Keep each passage tight — this is a reading space, not an encyclopedia. Return the schema.${tasteLine}`
}

const CONNECT_SCHEMA = {
	type: 'object',
	additionalProperties: false,
	properties: {
		stance: {
			type: 'string',
			enum: ['connected', 'declined'],
			description: 'declined = you cannot defend a real connection. Be willing to say this.',
		},
		headline: { type: 'string', description: 'The crux in one sentence.' },
		argument: {
			type: 'string',
			description:
				'Your developed read (1-2 short paragraphs). If connected, reach for cross-medium qualities that survive the jump between the two — glow, density, restraint, the way each hums — not shared subject or period. If declined, say honestly why a forced link would be slop. End by inviting pushback.',
		},
		grounds: {
			type: 'array',
			description: 'Grounded factual support, where it exists. May be empty for a pure read.',
			items: {
				type: 'object',
				additionalProperties: false,
				properties: {
					text: { type: 'string' },
					sourceIds: { type: 'array', items: { type: 'string' } },
				},
				required: ['text', 'sourceIds'],
			},
		},
		sources: {
			type: 'array',
			items: {
				type: 'object',
				additionalProperties: false,
				properties: {
					id: { type: 'string' },
					title: { type: 'string' },
					url: { type: 'string' },
					publisher: { type: 'string' },
				},
				required: ['id', 'title', 'url', 'publisher'],
			},
		},
	},
	required: ['stance', 'headline', 'argument', 'grounds', 'sources'],
}

function connectPrompt(a: string, b: string, taste?: string): string {
	const tasteLine = taste
		? `\n\nWhat you've learned about this collector's eye (let it inform the read; don't pander):\n${taste}`
		: ''
	return `The collector has placed two works side by side and wants to know how they connect.

WORK A: ${a || '(see image)'}
WORK B: ${b || '(see image)'}

Look at both images. Research either if it sharpens the argument. Then argue whether — and how — they connect, reaching for the cross-medium qualities the collector cares about. Do NOT force a link: if the honest answer is "these don't connect in any way I can defend," say so. Return the schema.${tasteLine}`
}

const PROFILE_SCHEMA = {
	type: 'object',
	additionalProperties: false,
	properties: {
		qualities: {
			type: 'array',
			items: { type: 'string' },
			description: 'Recurring cross-medium qualities this collector gravitates to (short phrases).',
		},
		makers: { type: 'array', items: { type: 'string' }, description: 'Makers/designers they return to.' },
		movements: { type: 'array', items: { type: 'string' }, description: 'Movements/periods/idioms they return to.' },
		observations: {
			type: 'string',
			description:
				'A few honest sentences about their eye — what you notice about how they see. Specific, not flattering.',
		},
	},
	required: ['qualities', 'makers', 'movements', 'observations'],
}

function profilePrompt(current: string, collection: string, verdicts: string): string {
	return `You quietly maintain a portrait of one collector's eye. Update it from the evidence below. Keep it small and specific — drop what no longer fits, keep what recurs. Reach for cross-medium qualities (glow, density, restraint, the way an object hums), not just genres. Be honest, not flattering; you may note a tension or blind spot.

CURRENT PORTRAIT:
${current || '(none yet)'}

WHAT'S ON THEIR WALL:
${collection || '(empty)'}

CONNECTIONS THEY'VE JUDGED:
${verdicts || '(none yet)'}

Return the updated portrait in the schema.`
}

const SUGGEST_SCHEMA = {
	type: 'object',
	additionalProperties: false,
	properties: {
		title: { type: 'string' },
		maker: { type: 'string' },
		why: {
			type: 'string',
			description:
				"Why this, explained in terms of their ACTUAL collection — name works of theirs it speaks to and the quality it shares. This is the point; make it specific.",
		},
		where: { type: 'string', description: 'Where to see it or a good image/source.' },
		sources: {
			type: 'array',
			items: {
				type: 'object',
				additionalProperties: false,
				properties: {
					id: { type: 'string' },
					title: { type: 'string' },
					url: { type: 'string' },
					publisher: { type: 'string' },
				},
				required: ['id', 'title', 'url', 'publisher'],
			},
		},
	},
	required: ['title', 'maker', 'why', 'where', 'sources'],
}

function suggestPrompt(collection: string, taste: string): string {
	return `Suggest ONE thing for this collector to look at next — a specific real work, object, or maker, across any medium. Not a feed, not a list: one considered pointer, the kind a sharp friend makes.

It must be grounded: use web search to find a real, specific thing and cite where to see it. Do NOT suggest something already on their wall. Reach across media if it fits their eye. The "why" must connect to their actual collection by name — that's what makes this worth sending.

THEIR WALL:
${collection || '(empty — suggest a strong starting point and say why)'}

THEIR EYE:
${taste || '(unknown so far)'}

Return the schema.`
}

const CHAT_GUIDANCE = `\n\nYou are now in conversation with the collector about a work (or pair) you just researched. Stay in your register: opinionated, specific, willing to be wrong. When they disagree, engage the disagreement honestly — concede what's fair, hold your ground where you can defend it, and never just capitulate or repeat yourself. If a claim of yours was shaky, say so. You may search again if a new question warrants it; keep grounding real. Keep replies conversational and tight — a few sentences, not an essay.`

function chatPrompt(message: string, fallbackContext?: string): string {
	const ctx = fallbackContext ? `For context, the work is: ${fallbackContext}\n\n` : ''
	return `${ctx}The collector says:\n\n"${message}"`
}

// --- Plugin --------------------------------------------------------------

export function salonPlugin(): Plugin {
	return {
		name: 'salon-claude-backend',
		configureServer(server) {
			server.middlewares.use('/api/salon/status', (_req, res) => {
				// Probe the CLI once.
				const child = spawn('claude', ['--version'])
				let ok = false
				child.on('error', () => sendJson(res, 200, { available: false }))
				child.on('close', (code) => {
					ok = code === 0
					sendJson(res, 200, { available: ok })
				})
			})

			server.middlewares.use('/api/salon/note', async (req, res) => {
				if (req.method !== 'POST') return sendJson(res, 405, { error: 'POST only' })
				try {
					const body = JSON.parse((await readBody(req)) || '{}') as {
						workId?: string
						caption?: string
						imageDataUrl?: string
						imageUrl?: string
						taste?: string
					}
					console.log(`\n[Salon] ▶ note "${(body.caption || 'untitled').slice(0, 60)}"`)
					const start = Date.now()
					const out = await runClaude({
						systemPrompt: SALON_VOICE,
						prompt: notePrompt(body.caption ?? '', body.taste),
						schema: NOTE_SCHEMA,
						imageDataUrl: body.imageDataUrl,
						imageUrl: body.imageUrl,
						workdirKey: body.workId,
					})
					console.log(
						`[Salon] ◀ note ${Date.now() - start}ms | ${out.ok ? 'OK' : 'ERR ' + out.error}`
					)
					if (!out.ok || !out.structured) {
						return sendJson(res, 502, { error: out.error || 'No note produced.' })
					}
					return sendJson(res, 200, { note: out.structured, sessionId: out.sessionId })
				} catch (err) {
					return sendJson(res, 500, { error: String(err) })
				}
			})

			server.middlewares.use('/api/salon/connect', async (req, res) => {
				if (req.method !== 'POST') return sendJson(res, 405, { error: 'POST only' })
				try {
					const body = JSON.parse((await readBody(req)) || '{}') as {
						pairId?: string
						a?: { caption?: string; identity?: string; imageDataUrl?: string; imageUrl?: string }
						b?: { caption?: string; identity?: string; imageDataUrl?: string; imageUrl?: string }
						taste?: string
					}
					const a = body.a ?? {}
					const b = body.b ?? {}
					console.log(
						`\n[Salon] ▶ connect "${(a.identity || a.caption || '?').slice(0, 30)}" × "${(b.identity || b.caption || '?').slice(0, 30)}"`
					)
					const start = Date.now()
					const out = await runClaude({
						systemPrompt: SALON_VOICE,
						prompt: connectPrompt(
							a.identity || a.caption || '',
							b.identity || b.caption || '',
							body.taste
						),
						schema: CONNECT_SCHEMA,
						images: [
							{ label: 'WORK A', basename: 'workA', dataUrl: a.imageDataUrl, url: a.imageUrl },
							{ label: 'WORK B', basename: 'workB', dataUrl: b.imageDataUrl, url: b.imageUrl },
						],
						workdirKey: body.pairId,
					})
					console.log(
						`[Salon] ◀ connect ${Date.now() - start}ms | ${out.ok ? 'OK' : 'ERR ' + out.error}`
					)
					if (!out.ok || !out.structured) {
						return sendJson(res, 502, { error: out.error || 'No connection produced.' })
					}
					return sendJson(res, 200, { connection: out.structured, sessionId: out.sessionId })
				} catch (err) {
					return sendJson(res, 500, { error: String(err) })
				}
			})

			server.middlewares.use('/api/salon/profile', async (req, res) => {
				if (req.method !== 'POST') return sendJson(res, 405, { error: 'POST only' })
				try {
					const body = JSON.parse((await readBody(req)) || '{}') as {
						current?: string
						collection?: string
						verdicts?: string
					}
					console.log(`[Salon] ▶ profile update`)
					const start = Date.now()
					const out = await runClaude({
						systemPrompt: SALON_VOICE,
						prompt: profilePrompt(body.current ?? '', body.collection ?? '', body.verdicts ?? ''),
						schema: PROFILE_SCHEMA,
						allowedTools: [], // pure reasoning over provided text
						timeoutMs: 120_000,
					})
					console.log(`[Salon] ◀ profile ${Date.now() - start}ms | ${out.ok ? 'OK' : 'ERR'}`)
					if (!out.ok || !out.structured) {
						return sendJson(res, 502, { error: out.error || 'No profile produced.' })
					}
					return sendJson(res, 200, { profile: out.structured })
				} catch (err) {
					return sendJson(res, 500, { error: String(err) })
				}
			})

			server.middlewares.use('/api/salon/suggest', async (req, res) => {
				if (req.method !== 'POST') return sendJson(res, 405, { error: 'POST only' })
				try {
					const body = JSON.parse((await readBody(req)) || '{}') as {
						collection?: string
						taste?: string
					}
					console.log(`[Salon] ▶ suggest`)
					const start = Date.now()
					const out = await runClaude({
						systemPrompt: SALON_VOICE,
						prompt: suggestPrompt(body.collection ?? '', body.taste ?? ''),
						schema: SUGGEST_SCHEMA,
						timeoutMs: 240_000,
					})
					console.log(`[Salon] ◀ suggest ${Date.now() - start}ms | ${out.ok ? 'OK' : 'ERR'}`)
					if (!out.ok || !out.structured) {
						return sendJson(res, 502, { error: out.error || 'No suggestion produced.' })
					}
					return sendJson(res, 200, { suggestion: out.structured })
				} catch (err) {
					return sendJson(res, 500, { error: String(err) })
				}
			})

			server.middlewares.use('/api/salon/chat', async (req, res) => {
				if (req.method !== 'POST') return sendJson(res, 405, { error: 'POST only' })
				try {
					const body = JSON.parse((await readBody(req)) || '{}') as {
						workId?: string
						message?: string
						sessionId?: string | null
						context?: string
					}
					if (!body.message) return sendJson(res, 400, { error: 'message required' })
					console.log(`[Salon] ▶ chat "${body.message.slice(0, 60)}"`)
					const start = Date.now()
					const out = await runClaude({
						systemPrompt: SALON_VOICE + CHAT_GUIDANCE,
						prompt: chatPrompt(body.message, body.sessionId ? undefined : body.context),
						resumeSessionId: body.sessionId ?? undefined,
						workdirKey: body.workId,
						timeoutMs: 180_000,
					})
					console.log(
						`[Salon] ◀ chat ${Date.now() - start}ms | ${out.ok ? 'OK' : 'ERR ' + out.error}`
					)
					if (!out.ok) return sendJson(res, 502, { error: out.error || 'No reply.' })
					return sendJson(res, 200, { reply: out.text, sessionId: out.sessionId })
				} catch (err) {
					return sendJson(res, 500, { error: String(err) })
				}
			})
		},
	}
}
