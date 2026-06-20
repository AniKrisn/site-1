// Shared shapes for the understanding layer. Mirrors the JSON schemas the
// server enforces in vite-plugin-salon.ts — keep them in step.

export type VoiceKind = 'documented' | 'maker' | 'scholarship' | 'salon'

export interface NoteVoice {
	kind: VoiceKind
	text: string
	sourceIds: string[]
}

export interface NoteSource {
	id: string
	title: string
	url: string
	publisher: string
}

export interface ResolvedIdentity {
	title: string
	maker: string
	year: string
	medium: string
	movement: string
	confidence: 'high' | 'medium' | 'low' | 'unknown'
	caveat: string
}

export interface SalonNote {
	identity: ResolvedIdentity
	voices: NoteVoice[]
	sources: NoteSource[]
	thinness: string
}

export interface ConnectionGround {
	text: string
	sourceIds: string[]
}

export interface SalonConnection {
	stance: 'connected' | 'declined'
	headline: string
	argument: string
	grounds: ConnectionGround[]
	sources: NoteSource[]
}

export type Verdict = 'kept' | 'rejected' | 'unsure'

export interface TasteProfile {
	qualities: string[]
	makers: string[]
	movements: string[]
	observations: string
}

export const EMPTY_PROFILE: TasteProfile = {
	qualities: [],
	makers: [],
	movements: [],
	observations: '',
}

export interface Suggestion {
	title: string
	maker: string
	why: string
	where: string
	sources: NoteSource[]
}

/** Condense a profile into the short `taste` string passed to the researcher. */
export function tasteToString(p: TasteProfile | null): string {
	if (!p) return ''
	const parts: string[] = []
	if (p.qualities.length) parts.push(`Qualities they're drawn to: ${p.qualities.join(', ')}.`)
	if (p.makers.length) parts.push(`Makers they return to: ${p.makers.join(', ')}.`)
	if (p.movements.length) parts.push(`Movements: ${p.movements.join(', ')}.`)
	if (p.observations) parts.push(p.observations)
	return parts.join(' ')
}

export const VOICE_LABEL: Record<VoiceKind, string> = {
	documented: 'Documented',
	maker: 'In the maker’s words',
	scholarship: 'Scholarship',
	salon: 'Salon’s read',
}
