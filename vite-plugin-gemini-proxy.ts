import type { IncomingMessage } from 'http'
import path from 'path'
import type { Duplex } from 'stream'
import { loadEnv, type Plugin } from 'vite'
import { WebSocketServer, WebSocket as WsClient } from 'ws'

const GEMINI_LIVE_WS_URL =
	'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent'

const GEMINI_URL =
	'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent'

const QUIVER_URL = 'https://api.quiver.ai/v1/svgs/generations'

/**
 * Vite dev plugin that proxies Gemini Live (WebSocket), Gemini generateContent
 * (HTTP POST), and QuiverAI text-to-SVG (HTTP POST) — adding API keys server-side
 * so the browser never sees them.
 *
 * Reads GEMINI_API_KEY (or GOOGLE_API_KEY) and QUIVERAI_API_KEY from .env.local.
 */
export function geminiProxy(): Plugin {
	let apiKey = ''
	let quiverKey = ''

	return {
		name: 'jarvis-gemini-proxy',
		configResolved(config) {
			// Empty prefix loads ALL env vars from .env.local (not just VITE_*).
			const envDir = path.resolve(config.root)
			const env = loadEnv(config.mode, envDir, '')
			apiKey = env.GEMINI_API_KEY ?? env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY ?? ''
			quiverKey = env.QUIVERAI_API_KEY ?? process.env.QUIVERAI_API_KEY ?? ''
		},
		configureServer(server) {
			server.middlewares.use('/api/gemini/status', (_req, res) => {
				res.setHeader('Content-Type', 'application/json')
				res.end(JSON.stringify({ available: !!apiKey }))
			})

			server.middlewares.use('/api/gemini/live/status', (_req, res) => {
				res.setHeader('Content-Type', 'application/json')
				res.end(JSON.stringify({ available: !!apiKey }))
			})

			// WebSocket proxy: client <-> dev server <-> Gemini Live API.
			// API key is added server-side so it's never exposed to the browser.
			const wss = new WebSocketServer({ noServer: true })

			server.httpServer?.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
				const url = req.url ?? ''
				if (!url.startsWith('/api/gemini/live')) return
				if (!apiKey) {
					socket.destroy()
					return
				}
				wss.handleUpgrade(req, socket, head, (clientWs) => {
					const upstreamUrl = `${GEMINI_LIVE_WS_URL}?key=${apiKey}`
					console.log(`[Gemini Live] ▶ client connected, opening upstream`)
					const upstream = new WsClient(upstreamUrl)

					const clientQueue: (string | Buffer)[] = []
					let upstreamOpen = false

					upstream.on('open', () => {
						upstreamOpen = true
						console.log(`[Gemini Live] ◀ upstream open`)
						for (const msg of clientQueue) upstream.send(msg)
						clientQueue.length = 0
					})

					upstream.on('message', (data, isBinary) => {
						if (clientWs.readyState === clientWs.OPEN) {
							clientWs.send(data, { binary: isBinary })
						}
					})

					upstream.on('close', (code, reason) => {
						const reasonText = reason.toString()
						console.log(`[Gemini Live] upstream closed code=${code} reason=${reasonText}`)
						if (clientWs.readyState === clientWs.OPEN) {
							const safeCode = code === 1000 || (code >= 3000 && code <= 4999) ? code : 1011
							const safeReason = reasonText.slice(0, 120)
							try {
								clientWs.close(safeCode, safeReason)
							} catch {
								clientWs.close()
							}
						}
					})

					upstream.on('error', (err) => {
						console.error(`[Gemini Live] upstream error:`, err)
						if (clientWs.readyState === clientWs.OPEN) clientWs.close(1011, 'upstream error')
					})

					clientWs.on('message', (data, isBinary) => {
						const msg = isBinary ? (data as Buffer) : data.toString()
						if (upstreamOpen) {
							upstream.send(msg)
						} else {
							clientQueue.push(msg)
						}
					})

					clientWs.on('close', () => {
						console.log(`[Gemini Live] client closed`)
						if (
							upstream.readyState === upstream.OPEN ||
							upstream.readyState === upstream.CONNECTING
						) {
							upstream.close()
						}
					})

					clientWs.on('error', (err) => {
						console.error(`[Gemini Live] client error:`, err)
						upstream.close()
					})
				})
			})

			server.middlewares.use('/api/gemini', (req, res) => {
				if (req.method !== 'POST') {
					res.statusCode = 405
					res.end('Method not allowed')
					return
				}

				if (!apiKey) {
					res.statusCode = 403
					res.setHeader('Content-Type', 'application/json')
					res.end(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }))
					return
				}

				const chunks: Buffer[] = []
				req.on('data', (chunk: Buffer) => chunks.push(chunk))
				req.on('end', async () => {
					try {
						const body = Buffer.concat(chunks).toString()
						const upstream = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body,
						})
						const data = await upstream.text()
						res.statusCode = upstream.status
						res.setHeader('Content-Type', 'application/json')
						res.end(data)
					} catch (err) {
						res.statusCode = 502
						res.setHeader('Content-Type', 'application/json')
						res.end(JSON.stringify({ error: String(err) }))
					}
				})
			})

			server.middlewares.use('/api/quiver/status', (_req, res) => {
				res.setHeader('Content-Type', 'application/json')
				res.end(JSON.stringify({ available: !!quiverKey }))
			})

			server.middlewares.use('/api/quiver/generate', (req, res) => {
				if (req.method !== 'POST') {
					res.statusCode = 405
					res.end('Method not allowed')
					return
				}
				if (!quiverKey) {
					res.statusCode = 403
					res.setHeader('Content-Type', 'application/json')
					res.end(JSON.stringify({ error: 'QUIVERAI_API_KEY not configured' }))
					return
				}

				const chunks: Buffer[] = []
				req.on('data', (chunk: Buffer) => chunks.push(chunk))
				req.on('end', async () => {
					try {
						const body = JSON.parse(Buffer.concat(chunks).toString() || '{}') as {
							prompt?: string
							instructions?: string
							model?: string
							stream?: boolean
							max_output_tokens?: number
						}
						if (!body.prompt) {
							res.statusCode = 400
							res.setHeader('Content-Type', 'application/json')
							res.end(JSON.stringify({ error: 'Missing `prompt` in request body.' }))
							return
						}
						const stream = body.stream === true
						console.log(
							`\n[Quiver] ▶ "${body.prompt.slice(0, 80)}"${stream ? ' (stream)' : ''}`
						)
						const start = Date.now()
						const upstreamBody: Record<string, unknown> = {
							model: body.model ?? 'arrow-1.1',
							prompt: body.prompt,
							instructions: body.instructions,
							n: 1,
						}
						if (typeof body.max_output_tokens === 'number') {
							upstreamBody.max_output_tokens = body.max_output_tokens
						}
						if (stream) upstreamBody.stream = true

						const upstream = await fetch(QUIVER_URL, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								Authorization: `Bearer ${quiverKey}`,
								...(stream ? { Accept: 'text/event-stream' } : {}),
							},
							body: JSON.stringify(upstreamBody),
						})

						if (!stream) {
							const text = await upstream.text()
							const elapsed = Date.now() - start
							if (upstream.ok) {
								console.log(`[Quiver] ◀ ${elapsed}ms | OK`)
							} else {
								console.error(
									`[Quiver] ◀ ${elapsed}ms | ${upstream.status}: ${text.slice(0, 200)}`
								)
							}
							res.statusCode = upstream.status
							res.setHeader('Content-Type', 'application/json')
							res.end(text)
							return
						}

						// Streaming pass-through: pipe upstream SSE to the browser as it arrives.
						if (!upstream.ok || !upstream.body) {
							const text = await upstream.text().catch(() => '')
							console.error(
								`[Quiver] ◀ ${Date.now() - start}ms | ${upstream.status}: ${text.slice(0, 200)}`
							)
							res.statusCode = upstream.status
							res.setHeader('Content-Type', 'application/json')
							res.end(text)
							return
						}

						res.statusCode = 200
						res.setHeader('Content-Type', 'text/event-stream')
						res.setHeader('Cache-Control', 'no-cache, no-transform')
						res.setHeader('Connection', 'keep-alive')
						res.flushHeaders?.()

						const reader = upstream.body.getReader()
						let firstChunkAt: number | null = null
						let draftAt: number | null = null
						let contentAt: number | null = null
						try {
							while (true) {
								const { value, done } = await reader.read()
								if (done) break
								if (firstChunkAt === null) firstChunkAt = Date.now() - start
								res.write(Buffer.from(value))
								// Cheap log sniff — exact parse happens client-side.
								const s = Buffer.from(value).toString('utf8')
								if (draftAt === null && /\bevent: ?draft\b|"type":\s*"draft"/.test(s)) {
									draftAt = Date.now() - start
								}
								if (contentAt === null && /\bevent: ?content\b|"type":\s*"content"/.test(s)) {
									contentAt = Date.now() - start
								}
							}
						} catch (err) {
							console.error('[Quiver] stream read error:', err)
						}
						const elapsed = Date.now() - start
						const parts: string[] = []
						if (firstChunkAt !== null) parts.push(`ttfb ${firstChunkAt}ms`)
						if (draftAt !== null) parts.push(`draft ${draftAt}ms`)
						if (contentAt !== null) parts.push(`content ${contentAt}ms`)
						console.log(
							`[Quiver] ◀ ${elapsed}ms | stream done${parts.length ? ` (${parts.join(', ')})` : ''}`
						)
						res.end()
					} catch (err) {
						console.error(`[Quiver] ◀ proxy error:`, err)
						if (!res.headersSent) {
							res.statusCode = 502
							res.setHeader('Content-Type', 'application/json')
							res.end(JSON.stringify({ error: String(err) }))
						} else {
							res.end()
						}
					}
				})
			})
		},
	}
}
