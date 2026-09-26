import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { makeLead } from "./pencil";

/* A square canvas drawn into the scene: on desktop it hangs in the sky,
   under the flock (which steers around .sky-piece); below 1024px the scene
   is hidden, so it sits under the post text instead. Owns sizing, theme and
   the pencil lead; the piece supplies the drawing loop. */

export type SkyView = {
  W: number;
  dpr: number;
  ink: string;
  paper: string;
  lead: CanvasPattern | string;
};
export type SkyStart = (
  ctx: CanvasRenderingContext2D,
  box: HTMLDivElement,
  view: () => SkyView,
) => () => void;

const WIDE = "(min-width: 1024px)";

/* Pin a point of the canvas (fractions of its width) to a point of the
   landscape drawing (its viewBox units), instead of hanging in the sky. */
export type TreeAnchor = { art: [number, number]; at: [number, number] };

export function SkyPiece({
  label,
  start,
  anchor,
}: {
  label: string;
  start: SkyStart;
  anchor?: TreeAnchor;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wide, setWide] = useState(() => window.matchMedia(WIDE).matches);
  const [scene, setScene] = useState<Element | null>(null);

  useEffect(() => {
    setScene(document.querySelector(".scene"));
    const mq = window.matchMedia(WIDE);
    const onChange = () => setWide(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const box = boxRef.current;
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (!box || !cv || !ctx) return;

    const view: SkyView = { W: 0, dpr: 1, ink: "#333", paper: "#fcfcfd", lead: "#333" };
    const resize = () => {
      view.dpr = Math.min(window.devicePixelRatio || 1, 2);
      view.W = box.clientWidth;
      cv.width = cv.height = Math.round(view.W * view.dpr);
      view.ink = getComputedStyle(cv).color;
      view.paper =
        getComputedStyle(document.documentElement).getPropertyValue("--color-card").trim() ||
        view.paper;
      view.lead = makeLead(ctx, view.ink);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    const themeWatch = new MutationObserver(resize);
    themeWatch.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    resize();

    // Follow the drawing: the landscape moves with the card's size.
    const pin = () => {
      const art = document.querySelector(".landscape-art");
      if (!anchor || !wide || !scene || !art) return;
      const a = art.getBoundingClientRect();
      const s = scene.getBoundingClientRect();
      const x = a.left - s.left + (anchor.art[0] / 1080) * a.width;
      const y = a.top - s.top + ((anchor.art[1] - 300) / 745) * a.height;
      box.style.left = `${x - anchor.at[0] * view.W}px`;
      box.style.top = `${y - anchor.at[1] * view.W}px`;
    };
    pin();
    window.addEventListener("resize", pin);

    const stop = start(ctx, box, () => view);
    return () => {
      stop();
      window.removeEventListener("resize", pin);
      ro.disconnect();
      themeWatch.disconnect();
    };
  }, [wide, scene, start, anchor]);

  const box = (
    <div
      ref={boxRef}
      className={wide ? (anchor ? "tree-piece" : "sky-piece") : "sky-piece-inline"}
      role="button"
      tabIndex={0}
      aria-label={label}
    >
      <canvas ref={canvasRef} />
    </div>
  );
  if (!wide) return box;
  return scene ? createPortal(box, scene) : null;
}
