import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { attachDodgeText, detachDodgeText, setObstacles } from "./dodge";
import { drawRectD } from "./sketch";
import { Landscape } from "./Landscape";
import { Birds } from "./Birds";
import { Stars } from "./Stars";
import { Flow } from "./Flow";
import { useWide } from "./wide";

const STROKE_WIDTH = 4;
/* More words than this in the tree's way and it bows out instead of parting them. */
const CROWDED = 12;
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
  const wide = useWide();

  /* After each navigation, split the page's text into word spans that slide
     aside when a bird or the tree crown overlaps them. */
  useEffect(() => {
    const card = cardRef.current;
    // phones have no scene to make way for
    if (!card || !wide) return;
    let id = 0;
    const target = () =>
      card.querySelector<HTMLElement>("article, .sections");
    /* Where a few words meet the tree they part round it: its crown is
       handed to the word-dodging as a pile of circles, each as wide as the
       ink at that height, read off the drawing itself. A long post that
       runs right down into the tree is another matter: rather than push
       whole paragraphs about, the tree bows out. */
    const updateTree = () => {
      const frame = frameRef.current;
      const crown = card.querySelector<SVGPathElement>(".landscape-art .crown path");
      const t = target();
      if (!frame || !crown) return;
      const m = crown.getScreenCTM();
      const length = crown.getTotalLength();
      if (!m || !length) return;
      const BAND = 12;
      const bands = new Map<number, [number, number]>();
      for (let i = 0; i <= 600; i++) {
        const p = crown.getPointAtLength((length * i) / 600);
        const x = m.a * p.x + m.c * p.y + m.e;
        const y = m.b * p.x + m.d * p.y + m.f;
        const k = Math.round(y / BAND);
        const at = bands.get(k);
        bands.set(k, at ? [Math.min(at[0], x), Math.max(at[1], x)] : [x, x]);
      }
      const circles = [...bands].map(([k, [left, right]]) => ({
        x: (left + right) / 2,
        y: k * BAND,
        r: Math.max(4, (right - left) / 2),
      }));
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
        }
      }
      const bowsOut = hits >= CROWDED;
      frame.classList.toggle("tree-hidden", bowsOut);
      setObstacles("tree", bowsOut ? [] : circles.map((c) => ({ ...c, hard: true })));
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
      setObstacles("tree", []);
      detachDodgeText();
    };
  }, [location.pathname, wide]);

  return (
    <div className="frame" ref={frameRef}>
      <div className="stage" aria-hidden="true">
        {wide && (
          <iframe
            className="beetle-bg"
            src="/beetle/index.html?embed"
            title="Beetle"
            tabIndex={-1}
          />
        )}
      </div>
      <SketchBorder seed="stage" className="sketch-stage" clipId="stage-clip" />
      <div className="frame-card" ref={cardRef}>
        {wide && (
          <div className="scene" aria-hidden="true">
            <Flow />
            <Landscape />
            <Birds />
            <Stars />
          </div>
        )}
        <Outlet />
      </div>
      <SketchBorder seed="card" className="sketch-card" clipId="card-clip" />
    </div>
  );
}
