/**
 * Generate a minimalist Picasso-bull-style line illustration via Gemini 3.1
 * Flash. Used as the fast default path for the `draw` tool — Quiver is
 * reserved for the high-quality opt-in path.
 *
 * The bull SVG from `draw-presets` is included verbatim in the system
 * prompt as a style reference so Gemini matches the look-and-feel.
 */

import { drawPresets } from './draw-presets'

const SYSTEM_PROMPT = `You are an SVG illustrator. Generate a minimalist Picasso-bull-style continuous line drawing of the subject the user provides.

REQUIREMENTS:
- Output ONLY raw SVG markup — start with <svg and end with </svg>. No prose, no markdown fences, no commentary.
- Include a viewBox attribute (e.g. viewBox="0 0 150 150").
- Every <path> must use stroke="#171513" stroke-width="0.7" fill="none" — black hand-pencil lines on transparent background. No fills.
- Use 5–25 path elements. Keep line counts modest.
- Lines should feel searching, exploratory, slightly imperfect — Picasso bull energy. Loose contours, not geometrically perfect.
- Continuous-line aesthetic where possible: contours sketched with a few sweeping strokes rather than many short ticks.
- No <style>, no <defs>, no classes — put attributes directly on each <path>. Keep the SVG self-contained and tiny.

STYLE REFERENCE — match the aesthetic of this bull (line economy, sketch quality, stroke character):
${drawPresets.bull}`

export async function generateSvgViaGemini(subject: string): Promise<string> {
	const start = performance.now()

	const response = await fetch('/api/gemini/3.1-flash', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
			contents: [{ role: 'user', parts: [{ text: subject }] }],
		}),
	})

	if (!response.ok) {
		const errText = await response.text().catch(() => '')
		throw new Error(`Gemini 3.1 Flash returned ${response.status}: ${errText.slice(0, 200)}`)
	}

	const data = (await response.json()) as {
		candidates?: { content?: { parts?: { text?: string }[] } }[]
	}

	const text = data.candidates?.[0]?.content?.parts?.[0]?.text
	if (!text) {
		throw new Error('Gemini 3.1 Flash returned no text content.')
	}

	const svg = extractSvg(text)
	if (!svg) {
		throw new Error('Gemini 3.1 Flash response had no <svg> markup.')
	}

	const elapsed = Math.round(performance.now() - start)
	console.log(`[Gemini SVG] generated for "${subject}" in ${elapsed}ms (${svg.length} chars)`)

	return svg
}

/** Pull the SVG out of a model response — handles bare SVG, fenced markdown, and stray prose. */
function extractSvg(raw: string): string | null {
	let text = raw.trim()

	// Strip ```svg / ```xml / ``` fences if present.
	const fence = text.match(/^```(?:svg|xml|html)?\s*([\s\S]*?)```\s*$/i)
	if (fence) text = fence[1].trim()

	const match = text.match(/<svg[\s\S]*<\/svg>/i)
	return match ? match[0] : null
}
