import {
	BaseBoxShapeUtil,
	HTMLContainer,
	RecordProps,
	Rectangle2d,
	T,
	TLIndicatorPath,
	TLResizeInfo,
	TLShape,
	resizeBox,
} from 'tldraw'

/**
 * Props for the artwork shape — a single work hung on the wall.
 *
 * The image (data URL or remote URL) lives in `src` so tldraw's own
 * persistence carries it across reloads with the layout. AI-resolved identity
 * (title/maker/year/medium) is stored here too, so the canvas survives without
 * the IndexedDB note store; the heavier notes/connections live separately.
 */
export interface ArtworkProps {
	w: number
	h: number
	src: string
	/** Whatever the user typed when adding it; never overwritten by AI. */
	caption: string
	/** AI-resolved identity (slice B). Empty until identified. */
	title: string
	maker: string
	year: string
	medium: string
	identified: boolean
}

// Register the custom shape into tldraw's type registry so `TLShape<'artwork'>`
// resolves and the editor's generic APIs accept it.
declare module 'tldraw' {
	interface TLGlobalShapePropsMap {
		artwork: ArtworkProps
	}
}

export type ArtworkShape = TLShape<'artwork'>

export class ArtworkShapeUtil extends BaseBoxShapeUtil<ArtworkShape> {
	static override type = 'artwork' as const

	static override props: RecordProps<ArtworkShape> = {
		w: T.number,
		h: T.number,
		src: T.string,
		caption: T.string,
		title: T.string,
		maker: T.string,
		year: T.string,
		medium: T.string,
		identified: T.boolean,
	}

	override getDefaultProps(): ArtworkProps {
		return {
			w: 280,
			h: 280,
			src: '',
			caption: '',
			title: '',
			maker: '',
			year: '',
			medium: '',
			identified: false,
		}
	}

	// A work is a fixed object: keep its aspect ratio when resized.
	override isAspectRatioLocked() {
		return true
	}

	override canEdit() {
		return false
	}

	override getGeometry(shape: ArtworkShape) {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		})
	}

	override onResize(shape: ArtworkShape, info: TLResizeInfo<ArtworkShape>) {
		return resizeBox(shape, info)
	}

	override component(shape: ArtworkShape) {
		const { src, caption, title, maker, year } = shape.props

		// The label prefers resolved identity, falls back to the user's caption.
		const heading = title || caption || ''
		const sub = [maker, year].filter(Boolean).join(', ')

		return (
			<HTMLContainer className="salon-artwork">
				<div className="salon-artwork__frame">
					{src ? (
						<img
							className="salon-artwork__img"
							src={src}
							draggable={false}
							alt={heading || 'artwork'}
						/>
					) : (
						<div className="salon-artwork__placeholder">no image</div>
					)}
				</div>
				{(heading || sub) && (
					<div className="salon-artwork__label">
						{heading && <span className="salon-artwork__title">{heading}</span>}
						{sub && <span className="salon-artwork__meta">{sub}</span>}
					</div>
				)}
			</HTMLContainer>
		)
	}

	override getIndicatorPath(shape: ArtworkShape): TLIndicatorPath {
		const path = new Path2D()
		path.rect(0, 0, shape.props.w, shape.props.h)
		return { path }
	}
}
