/**
 * Stream SVG paths out of a Quiver SSE response as they arrive.
 *
 * Quiver's `/api/quiver/generate?stream=true` emits a series of SSE events
 * whose `data` payloads contain partial SVG fragments (or full snapshots).
 * We accumulate the running SVG body and emit complete top-level elements
 * (the <style> block, then each <path>/<circle>/etc.) as soon as they're
 * fully formed.
 *
 * This lets the morph orchestrator process Quiver paths one-at-a-time
 * during the ~30s generation window instead of waiting for the entire
 * SVG to arrive.
 */

export type StreamedItem =
	| { type: 'style'; content: string }
	| { type: 'element'; content: string }

const TOP_LEVEL_TAGS = ['path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon']

/**
 * Open Quiver's SSE endpoint and yield SVG style/element fragments as
 * they become complete.
 */
export async function* streamQuiverPaths(
	prompt: string,
	instructions: string,
	model = 'arrow-1.1'
): AsyncIterable<StreamedItem> {
	const response = await fetch('/api/quiver/generate', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
		body: JSON.stringify({ prompt, instructions, model, stream: true }),
	})

	if (!response.ok || !response.body) {
		const errText = await response.text().catch(() => '')
		throw new Error(`Quiver returned ${response.status}: ${errText.slice(0, 200)}`)
	}

	const reader = response.body.getReader()
	const decoder = new TextDecoder()
	let sseBuf = ''
	// Running snapshot of the SVG body Quiver has produced so far. Some
	// providers emit cumulative snapshots, others emit deltas — we treat
	// each event's `svg` field as authoritative (cumulative) and fall back
	// to appending `delta` strings if no svg snapshot is ever provided.
	let svgSnapshot = ''
	let emittedStyle = false
	const emittedElementSpans = new Set<string>()

	try {
		while (true) {
			const { value, done } = await reader.read()
			if (done) break
			sseBuf += decoder.decode(value, { stream: true })

			let idx: number
			while ((idx = sseBuf.indexOf('\n\n')) !== -1) {
				const raw = sseBuf.slice(0, idx)
				sseBuf = sseBuf.slice(idx + 2)
				const evt = parseSseEvent(raw)
				if (!evt) continue

				if (evt.svg) {
					svgSnapshot = evt.svg
				} else if (evt.delta) {
					svgSnapshot += evt.delta
				} else {
					continue
				}

				// Emit the <style> block exactly once.
				if (!emittedStyle) {
					const styleMatch = svgSnapshot.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
					if (styleMatch) {
						emittedStyle = true
						const content = styleMatch[1]
						console.log(`[Stream] style block (${content.length} chars)`)
						yield { type: 'style', content }
					}
				}

				// Emit each newly-completed top-level element.
				for (const span of findCompleteTopLevelElements(svgSnapshot)) {
					if (emittedElementSpans.has(span.key)) continue
					emittedElementSpans.add(span.key)
					const tagName = span.content.match(/^<([a-zA-Z]+)/)?.[1] ?? '?'
					console.log(`[Stream] element <${tagName}> (${span.content.length} chars)`)
					yield { type: 'element', content: span.content }
				}
			}
		}
	} catch (err) {
		console.warn('[Stream] parse error, ending stream', err)
	}
}

/** Parse one SSE event block (event:/data: lines) into the bits we care about. */
function parseSseEvent(raw: string): { type?: string; svg?: string; delta?: string } | null {
	let event: string | undefined
	let data = ''
	for (const line of raw.split('\n')) {
		if (line.startsWith('event:')) event = line.slice(6).trim()
		else if (line.startsWith('data:')) data += line.slice(5).trim()
	}
	if (!data) return null
	try {
		const json = JSON.parse(data) as {
			type?: string
			svg?: string
			delta?: string
			data?: { delta?: string; svg?: string }[]
		}
		// Quiver's known shape uses top-level `svg`/`type`. Some upstream
		// formats nest fragments under `data: [{ delta }]` — handle both.
		const nested = json.data?.[0]
		return {
			type: json.type ?? event,
			svg: json.svg ?? nested?.svg,
			delta: json.delta ?? nested?.delta,
		}
	} catch {
		return null
	}
}

/**
 * Walk the running SVG snapshot and return spans for each complete
 * top-level element (a path/circle/etc. that lives directly under the
 * root <svg> or a top-level <g>). Skips anything inside <defs> or <style>.
 */
function findCompleteTopLevelElements(
	snapshot: string
): { key: string; content: string }[] {
	const spans: { key: string; content: string }[] = []
	// Locate the root <svg> body.
	const svgOpen = snapshot.search(/<svg\b[^>]*>/i)
	if (svgOpen < 0) return spans
	const bodyStart = snapshot.indexOf('>', svgOpen) + 1
	const body = snapshot.slice(bodyStart)

	// Strip out <defs>...</defs> and <style>...</style> by replacing with
	// equally-long whitespace so character offsets stay stable.
	const stripped = body
		.replace(/<defs[\s\S]*?<\/defs>/gi, (m) => ' '.repeat(m.length))
		.replace(/<style[\s\S]*?<\/style>/gi, (m) => ' '.repeat(m.length))

	for (const tag of TOP_LEVEL_TAGS) {
		// Self-closing form: <tag ... />
		const selfClosingRe = new RegExp(`<${tag}\\b[^>]*/>`, 'gi')
		let m: RegExpExecArray | null
		while ((m = selfClosingRe.exec(stripped)) !== null) {
			const content = m[0]
			spans.push({ key: `${m.index}:${content.length}:${tag}`, content })
		}
		// Open/close form: <tag ...>...</tag> (rare for paths but possible).
		const pairedRe = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi')
		while ((m = pairedRe.exec(stripped)) !== null) {
			// Skip if it's actually a self-closer (already captured above).
			if (m[0].endsWith('/>')) continue
			const content = m[0]
			spans.push({ key: `${m.index}:${content.length}:${tag}`, content })
		}
	}

	spans.sort((a, b) => {
		const aIdx = parseInt(a.key.split(':')[0], 10)
		const bIdx = parseInt(b.key.split(':')[0], 10)
		return aIdx - bIdx
	})
	return spans
}
