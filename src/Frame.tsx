import { useEffect, useRef, useState, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { drawRectD } from "./sketch";

const STROKE_WIDTH = 4;
const ROUNDNESS = 24;

/* A tldraw draw-style rectangle border: measures its own box and renders the
   double-pass inky path. When given a clipId it also emits a clipPath of the
   first pass, so the element underneath can be clipped to the same wobbly
   outline instead of leaking past it. Positioned by the .sketch-* classes. */
function SketchBorder({
  seed,
  className,
  clipId,
}: {
  seed: string;
  className: string;
  clipId?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const opts = { strokeWidth: STROKE_WIDTH, seed, roundness: ROUNDNESS };

  return (
    <div ref={ref} className={`sketch ${className}`} aria-hidden="true">
      {size && (
        <svg>
          {clipId && (
            <clipPath id={clipId}>
              <path d={`${drawRectD(size.w, size.h, { ...opts, passes: 1 })}Z`} />
            </clipPath>
          )}
          <path d={drawRectD(size.w, size.h, opts)} />
        </svg>
      )}
    </div>
  );
}

/* The card-with-offset-shadow motif at text scale: a snug card around a
   page's text block, with a solid accent shadow behind it (the beetle stays
   unique to the outer frame). */
export function TextCard({ children }: { children: ReactNode }) {
  return (
    <div className="text-card">
      <div className="text-card-shadow" aria-hidden="true" />
      <div className="text-card-inner">{children}</div>
      <SketchBorder seed="text" className="sketch-text" clipId="text-clip" />
    </div>
  );
}

/* Site-wide chrome: the live Beetle canvas is a back-card drop shadow behind
   the content card; both get hand-drawn tldraw-style borders and are clipped
   to them. */
export function Frame() {
  // Home is the beetle showcase: the specimen fills the window and the big
  // white card dissolves, leaving just the floating text card.
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  return (
    <div className={isHome ? "frame frame-home" : "frame"}>
      <div className="stage" aria-hidden="true">
        <iframe
          className="beetle-bg"
          src="/beetle/index.html?embed"
          title="Beetle"
          tabIndex={-1}
        />
      </div>
      <SketchBorder seed="stage" className="sketch-stage" clipId="stage-clip" />
      <div className="frame-card">
        <Outlet />
      </div>
      <SketchBorder seed="card" className="sketch-card" clipId="card-clip" />
    </div>
  );
}
