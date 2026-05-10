/**
 * HelpOverlay — two surfaces sharing the same explainer copy:
 *  - A welcome modal (Radix Dialog) that opens on initial page load so
 *    first-time visitors see how to use Jarvis. Press "OK" to dismiss.
 *  - A subtle persistent "?" button above the bottom toolbar. Hover or
 *    focus shows the same content as a tooltip (Radix Tooltip), so people
 *    can recall the instructions without taking over the screen again.
 */

import * as Dialog from '@radix-ui/react-dialog'
import * as Tooltip from '@radix-ui/react-tooltip'

function HelpBody({ withOk = false }: { withOk?: boolean }) {
	return (
		<>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 6,
					marginBottom: 6,
				}}
			>
				<span style={dotStyle} />
				<strong style={{ fontWeight: 600 }}>Jarvis</strong>
			</div>
			<p style={{ margin: '0 0 6px' }}>
				Hold <kbd style={kbdStyle}>M</kbd> to talk. You'll get a quick spoken primer,
				then a deeper answer with notes and images placed on the canvas.
			</p>
			<p style={{ margin: 0, opacity: 0.7 }}>
				Try: <em>"what is a quasar?"</em> <br />or <em>"draw a dolphin!"</em>
			</p>
			{withOk && (
				<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
					<Dialog.Close asChild>
						<button type="button" style={okButtonStyle}>
							OK
						</button>
					</Dialog.Close>
				</div>
			)}
		</>
	)
}

export function HelpOverlay() {
	return (
		<>
			{/* One-shot welcome modal on page load. */}
			<Dialog.Root defaultOpen>
				<Dialog.Portal>
					<Dialog.Overlay style={overlayStyle} />
					<Dialog.Content style={dialogContentStyle}>
						<Dialog.Title style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
							How to use Jarvis
						</Dialog.Title>
						<Dialog.Description asChild>
							<div>
								<HelpBody withOk />
							</div>
						</Dialog.Description>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>

			{/* Persistent subtle "?" with tooltip — same copy, no modal takeover. */}
			<div
				style={{
					position: 'absolute',
					bottom: 72,
					left: '50%',
					transform: 'translateX(-50%)',
					zIndex: 1000,
					pointerEvents: 'auto',
				}}
			>
				<Tooltip.Provider delayDuration={150}>
					<Tooltip.Root>
						<Tooltip.Trigger asChild>
							<button type="button" aria-label="How to use Jarvis" style={triggerStyle}>
								?
							</button>
						</Tooltip.Trigger>
						<Tooltip.Portal>
							<Tooltip.Content sideOffset={8} side="top" style={tooltipContentStyle}>
								<HelpBody />
								<Tooltip.Arrow style={{ fill: 'var(--color-panel, white)' }} />
							</Tooltip.Content>
						</Tooltip.Portal>
					</Tooltip.Root>
				</Tooltip.Provider>
			</div>
		</>
	)
}

const triggerStyle: React.CSSProperties = {
	width: 24,
	height: 24,
	borderRadius: '50%',
	border: '1px solid var(--color-divider, rgba(0, 0, 0, 0.15))',
	background: 'transparent',
	color: 'var(--color-text, #555)',
	cursor: 'default',
	fontSize: 13,
	fontWeight: 500,
	fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
	lineHeight: 1,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: 0,
	opacity: 0.4,
}

const overlayStyle: React.CSSProperties = {
	position: 'fixed',
	inset: 0,
	background: 'rgba(0, 0, 0, 0.35)',
	zIndex: 1000,
}

const dialogContentStyle: React.CSSProperties = {
	position: 'fixed',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 'min(360px, calc(100vw - 32px))',
	padding: '18px 20px',
	background: 'var(--color-panel, white)',
	color: 'var(--color-text, #111)',
	border: '1px solid var(--color-divider, rgba(0, 0, 0, 0.12))',
	borderRadius: 10,
	boxShadow: '0 20px 60px rgba(0, 0, 0, 0.18)',
	fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
	fontSize: 13.5,
	lineHeight: 1.5,
	zIndex: 1001,
}

const tooltipContentStyle: React.CSSProperties = {
	width: 280,
	padding: '10px 12px',
	background: 'var(--color-panel, white)',
	color: 'var(--color-text, #111)',
	border: '1px solid var(--color-divider, rgba(0, 0, 0, 0.12))',
	borderRadius: 8,
	boxShadow: '0 6px 24px rgba(0, 0, 0, 0.1)',
	fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
	fontSize: 12.5,
	lineHeight: 1.45,
	zIndex: 1001,
}

const dotStyle: React.CSSProperties = {
	width: 7,
	height: 7,
	borderRadius: '50%',
	background: '#6366f1',
	flexShrink: 0,
}

const kbdStyle: React.CSSProperties = {
	display: 'inline-block',
	padding: '0 5px',
	background: 'rgba(0, 0, 0, 0.06)',
	border: '1px solid rgba(0, 0, 0, 0.1)',
	borderRadius: 3,
	fontFamily: 'ui-monospace, SFMono-Regular, monospace',
	fontSize: 11,
	fontWeight: 600,
}

const okButtonStyle: React.CSSProperties = {
	padding: '6px 16px',
	background: '#6366f1',
	color: 'white',
	border: 'none',
	borderRadius: 6,
	cursor: 'pointer',
	fontSize: 13,
	fontWeight: 500,
	fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}
