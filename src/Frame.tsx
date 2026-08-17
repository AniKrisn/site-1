import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { attachDodgeText, detachDodgeText } from "./dodge";
import { drawRectD } from "./sketch";
import { Landscape } from "./Landscape";
import { Birds } from "./Birds";
import { Stars } from "./Stars";

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

/* Site-wide chrome: the live Beetle canvas is a back-card drop shadow behind
   the content card; both get hand-drawn tldraw-style borders and are clipped
   to them. */
export function Frame() {
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  /* After each navigation, split the page's text into word spans that slide
     aside when a bird or the tree crown overlaps them. */
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    let id = 0;
    const target = () =>
      card.querySelector<HTMLElement>("article, .sections");
    /* Long posts reach down into the tree; rather than fight the text, the
       tree bows out. */
    const updateTree = () => {
      const frame = frameRef.current;
      const art = card.querySelector(".landscape-art");
      const t = target();
      if (!frame || !art) return;
      const a = art.getBoundingClientRect();
      const sx = a.width / 1080;
      const sy = a.height / 745;
      // The crown as three circles (viewBox coords), same shape the drawing
      // has; a grazing word or two doesn't count, a real collision does.
      const circles = [
        { x: a.left + 420 * sx, y: a.top + (375 - 300) * sy, r: 60 * sx },
        { x: a.left + 390 * sx, y: a.top + (500 - 300) * sy, r: 100 * sx },
        { x: a.left + 385 * sx, y: a.top + (650 - 300) * sy, r: 95 * sx },
      ];
      let hits = 0;
      if (t) {
        for (const wEl of t.querySelectorAll(".dodge-word")) {
          const r = wEl.getBoundingClientRect();
          for (const c of circles) {
            const nx = Math.max(r.left, Math.min(c.x, r.right));
            const ny = Math.max(r.top, Math.min(c.y, r.bottom));
            if (Math.hypot(nx - c.x, ny - c.y) < c.r) {
              hits++;
              break;
            }
          }
          if (hits >= 4) break;
        }
      }
      frame.classList.toggle("tree-hidden", hits >= 4);
    };
    id = requestAnimationFrame(() => {
      const t = target();
      if (t) attachDodgeText(t, card);
      updateTree();
    });
    window.addEventListener("resize", updateTree);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", updateTree);
      frameRef.current?.classList.remove("tree-hidden");
      detachDodgeText();
    };
  }, [location.pathname]);

  return (
    <div className="frame" ref={frameRef}>
      <div className="stage" aria-hidden="true">
        <iframe
          className="beetle-bg"
          src="/beetle/index.html?embed"
          title="Beetle"
          tabIndex={-1}
        />
      </div>
      <SketchBorder seed="stage" className="sketch-stage" clipId="stage-clip" />
      <div className="frame-card" ref={cardRef}>
        <div className="scene" aria-hidden="true">
          <Landscape />
          <Birds />
          <Stars />
        </div>
        <Outlet />
      </div>
      <SketchBorder seed="card" className="sketch-card" clipId="card-clip" />
    </div>
  );
}
