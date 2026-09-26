import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { makeLead } from "./pencil";

/* A square canvas drawn into the scene: on desktop it hangs in the sky,
   under the flock (which steers around .sky-piece); below 1024px the scene
   is hidden, so it sits under the post text instead. Owns sizing, theme and
   the pencil lead; the piece supplies the drawing loop. */

export type SkyView = { W: number; dpr: number; lead: CanvasPattern | string };
export type SkyStart = (
  ctx: CanvasRenderingContext2D,
  box: HTMLDivElement,
  view: () => SkyView,
) => () => void;

const WIDE = "(min-width: 1024px)";

export function SkyPiece({ label, start }: { label: string; start: SkyStart }) {
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

    const view: SkyView = { W: 0, dpr: 1, lead: "#333" };
    const resize = () => {
      view.dpr = Math.min(window.devicePixelRatio || 1, 2);
      view.W = box.clientWidth;
      cv.width = cv.height = Math.round(view.W * view.dpr);
      view.lead = makeLead(ctx, getComputedStyle(cv).color);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    const themeWatch = new MutationObserver(resize);
    themeWatch.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    resize();

    const stop = start(ctx, box, () => view);
    return () => {
      stop();
      ro.disconnect();
      themeWatch.disconnect();
    };
  }, [wide, scene, start]);

  const box = (
    <div
      ref={boxRef}
      className={wide ? "sky-piece" : "sky-piece-inline"}
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
