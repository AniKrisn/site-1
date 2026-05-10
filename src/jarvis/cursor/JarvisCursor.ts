/**
 * JarvisCursor — owns everything about Jarvis's "ghost user" cursor on
 * the tldraw canvas. One class, one place to look for cursor state.
 *
 * Responsibilities:
 *  - Inject a TLInstancePresence record so tldraw renders the cursor
 *  - Keep that presence alive (tldraw hides idle presences after ~3s)
 *  - Animate drifts between points with smoothstep + perpendicular wobble
 *  - "Dance" around an anchor point in a slow Lissajous orbit when idle
 *  - Drive the chat-bubble caption based on a high-level status
 *
 * Anything that wants to read or write Jarvis's cursor state goes through
 * this class. The agent calls drift methods; Jarvis.tsx calls setStatus.
 */

import { Editor, TLShapeId } from 'tldraw'
import { InstancePresenceRecordType } from '@tldraw/tlschema'
import { AGENT_COLOR, AGENT_USER_ID, AGENT_USER_NAME } from '../lib/constants'

export type CursorStatus = 'idle' | 'thinking' | 'speaking' | 'recording'

const KEEPALIVE_INTERVAL_MS = 2000
const SHAPE_CURSOR_OFFSET = 16
const DOT_ANIMATION_INTERVAL_MS = 450
const DEFAULT_DRIFT_DURATION_MS = 1200
const DANCE_RADIUS = 14
const DANCE_PHASE_INC = 0.012

export class JarvisCursor {
	private editor: Editor
	private presenceId = InstancePresenceRecordType.createId(AGENT_USER_ID)
	private keepalive: ReturnType<typeof setInterval> | null = null

	// Drift / dance animation state.
	private anim: {
		fromX: number
		fromY: number
		toX: number
		toY: number
		startTime: number
		durationMs: number
	} | null = null
	private anchor: { x: number; y: number; phase: number } | null = null
	private raf: number | null = null

	// Status caption state.
	private currentStatus: CursorStatus = 'idle'
	private statusInterval: ReturnType<typeof setInterval> | null = null

	constructor(editor: Editor) {
		this.editor = editor
	}

	/** Inject the ghost-user presence into the editor's store. */
	start(): void {
		this.ensurePresence()
		this.keepalive = setInterval(() => {
			const existing = this.editor.store.get(this.presenceId)
			if (existing) {
				this.editor.store.put([{ ...existing, lastActivityTimestamp: Date.now() }])
			}
		}, KEEPALIVE_INTERVAL_MS)
	}

	/** Tear down all cursor state. */
	stop(): void {
		if (this.keepalive) {
			clearInterval(this.keepalive)
			this.keepalive = null
		}
		this.stopStatusInterval()
		this.stopAnimationLoop()
		// If we were following the cursor, stop before removing the
		// presence — otherwise tldraw can hold a stale lock.
		if (this.editor.getInstanceState().followingUserId === AGENT_USER_ID) {
			this.editor.stopFollowingUser()
		}
		const existing = this.editor.store.get(this.presenceId)
		if (existing) this.editor.store.remove([this.presenceId])
	}

	// ── Position ──────────────────────────────────────────────────────

	/** Set cursor position immediately (no animation). */
	moveTo(x: number, y: number): void {
		this.cancelAnimation()
		this.writePosition(x, y)
	}

	/** Animate cursor to (x, y), then settle into a slow orbital dance. */
	driftTo(x: number, y: number, durationMs = DEFAULT_DRIFT_DURATION_MS): void {
		const existing = this.editor.store.get(this.presenceId)
		const fromX = existing?.cursor?.x ?? x
		const fromY = existing?.cursor?.y ?? y
		this.anchor = null
		this.anim = {
			fromX,
			fromY,
			toX: x,
			toY: y,
			startTime: performance.now(),
			durationMs,
		}
		this.startAnimationLoop()
	}

	/** Drift to a shape's bottom-right corner. */
	driftToShape(shapeId: TLShapeId, durationMs?: number): void {
		const bounds = this.editor.getShapePageBounds(shapeId)
		if (!bounds) return
		this.driftTo(bounds.maxX + SHAPE_CURSOR_OFFSET, bounds.maxY + SHAPE_CURSOR_OFFSET, durationMs)
	}

	// ── Status / chat bubble ──────────────────────────────────────────

	/**
	 * Set the visible status. Drives the chat-bubble caption with priority
	 * speaking > recording > thinking > idle handled by the caller; this
	 * method just renders whatever it's told.
	 *
	 *   'speaking'  → "Speaking..."
	 *   'recording' → "Listening..."
	 *   'thinking'  → animated "." → ".." → "..." cycling
	 *   'idle'      → ""
	 */
	setStatus(status: CursorStatus): void {
		if (status === this.currentStatus) return
		this.currentStatus = status
		this.stopStatusInterval()

		if (status === 'speaking') {
			this.writeChatMessage('Speaking...')
			return
		}
		if (status === 'recording') {
			this.writeChatMessage('Listening...')
			return
		}
		if (status === 'idle') {
			this.writeChatMessage('')
			return
		}
		// Thinking — animate dots.
		let step = 0
		const tick = () => {
			step = (step % 3) + 1
			this.writeChatMessage('.'.repeat(step))
		}
		tick()
		this.statusInterval = setInterval(tick, DOT_ANIMATION_INTERVAL_MS)
	}

	// ── Internals ─────────────────────────────────────────────────────

	private ensurePresence(): void {
		if (this.editor.store.get(this.presenceId)) return
		const { x, y } = this.editor.getViewportScreenCenter()
		const center = this.editor.screenToPage({ x, y })
		const { camera, screenBounds } = this.computeFollowFrame(center.x, center.y)
		this.editor.store.put([
			InstancePresenceRecordType.create({
				id: this.presenceId,
				userId: AGENT_USER_ID,
				userName: AGENT_USER_NAME,
				color: AGENT_COLOR,
				cursor: { x: center.x, y: center.y, type: 'default', rotation: 0 },
				camera,
				screenBounds,
				currentPageId: this.editor.getCurrentPageId(),
				lastActivityTimestamp: Date.now(),
				chatMessage: '',
				selectedShapeIds: [],
				meta: {},
			}),
		])
	}

	private writePosition(x: number, y: number): void {
		this.ensurePresence()
		const existing = this.editor.store.get(this.presenceId)
		if (!existing) return
		const { camera, screenBounds } = this.computeFollowFrame(x, y)
		this.editor.store.put([
			{
				...existing,
				cursor: {
					x,
					y,
					type: existing.cursor?.type ?? 'default',
					rotation: existing.cursor?.rotation ?? 0,
				},
				camera,
				screenBounds,
				lastActivityTimestamp: Date.now(),
				currentPageId: this.editor.getCurrentPageId(),
			},
		])
	}

	/**
	 * Compute the camera + screenBounds Jarvis "would have" if Jarvis's
	 * viewport were centered on (x, y) at the real user's current zoom and
	 * screen size. tldraw's follow logic reads these fields off the leader
	 * presence to animate our camera toward Jarvis.
	 */
	private computeFollowFrame(x: number, y: number) {
		const sb = this.editor.getViewportScreenBounds()
		const z = this.editor.getZoomLevel()
		// Following math (mirrors tldraw): leader viewport is
		// Box(-cam.x, -cam.y, sb.w/z, sb.h/z). Centering on (x, y) means
		//   cam.x = sb.w/(2z) - x,  cam.y = sb.h/(2z) - y.
		const camera = {
			x: sb.w / (2 * z) - x,
			y: sb.h / (2 * z) - y,
			z,
		}
		const screenBounds = { x: sb.x, y: sb.y, w: sb.w, h: sb.h }
		return { camera, screenBounds }
	}

	/** Start animating the real user's camera to follow Jarvis's cursor. */
	startFollow(): void {
		this.ensurePresence()
		// Refresh the follow frame against the current viewport so the
		// camera doesn't jerk toward a stale value before the next drift.
		const existing = this.editor.store.get(this.presenceId)
		if (existing?.cursor) {
			this.writePosition(existing.cursor.x, existing.cursor.y)
		}
		this.editor.startFollowingUser(AGENT_USER_ID)
	}

	/** Stop following Jarvis's cursor — the camera stays where it is. */
	stopFollow(): void {
		this.editor.stopFollowingUser()
	}

	private writeChatMessage(text: string): void {
		this.ensurePresence()
		const existing = this.editor.store.get(this.presenceId)
		if (!existing) return
		if (existing.chatMessage === text) return
		this.editor.store.put([
			{
				...existing,
				chatMessage: text,
				lastActivityTimestamp: Date.now(),
			},
		])
	}

	private startAnimationLoop(): void {
		if (this.raf !== null) return
		const loop = (now: number) => {
			this.raf = null
			if (this.anim) {
				const a = this.anim
				const t = Math.min(1, (now - a.startTime) / a.durationMs)
				const eased = t * t * (3 - 2 * t)
				const dx = a.toX - a.fromX
				const dy = a.toY - a.fromY
				const len = Math.hypot(dx, dy) || 1
				const px = -dy / len
				const py = dx / len
				const wobbleAmp = 14 * Math.sin(t * Math.PI) // peaks mid-flight
				const wobble = Math.sin(t * Math.PI * 2.4) * wobbleAmp
				const x = a.fromX + dx * eased + px * wobble
				const y = a.fromY + dy * eased + py * wobble
				this.writePosition(x, y)
				if (t >= 1) {
					this.anchor = { x: a.toX, y: a.toY, phase: 0 }
					this.anim = null
				}
			} else if (this.anchor) {
				this.anchor.phase += DANCE_PHASE_INC
				if (this.anchor.phase >= Math.PI * 2) {
					// One full rotation completed — settle exactly on the
					// anchor and stop dancing.
					this.writePosition(this.anchor.x, this.anchor.y)
					this.anchor = null
				} else {
					const x = this.anchor.x + Math.cos(this.anchor.phase) * DANCE_RADIUS
					const y = this.anchor.y + Math.sin(this.anchor.phase * 0.7) * DANCE_RADIUS * 0.7
					this.writePosition(x, y)
				}
			} else {
				return // nothing to animate; stop ticking
			}
			this.raf = requestAnimationFrame(loop)
		}
		this.raf = requestAnimationFrame(loop)
	}

	private stopAnimationLoop(): void {
		if (this.raf !== null) {
			cancelAnimationFrame(this.raf)
			this.raf = null
		}
	}

	private cancelAnimation(): void {
		this.anim = null
		this.anchor = null
		this.stopAnimationLoop()
	}

	private stopStatusInterval(): void {
		if (this.statusInterval !== null) {
			clearInterval(this.statusInterval)
			this.statusInterval = null
		}
	}
}
