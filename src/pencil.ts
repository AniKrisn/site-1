import { rng } from "./sketch";

/* Canvas helpers for the drawn sky pieces (Sponge, Shrub): a graphite
   stroke style, and tldraw's draw-style circle. */

/* The ink colour with a seeded grain knocked out of it, so the line reads as
   graphite on paper rather than a flat stroke. */
export function makeLead(
  ctx: CanvasRenderingContext2D,
  ink: string,
): CanvasPattern | string {
  const g = document.createElement("canvas");
  g.width = g.height = 64;
  const gc = g.getContext("2d");
  if (!gc) return ink;
  gc.fillStyle = ink;
  gc.fillRect(0, 0, 64, 64);
  const img = gc.getImageData(0, 0, 64, 64);
  const random = rng("lead");
  for (let i = 3; i < img.data.length; i += 4) {
    const n = Math.abs(random());
    img.data[i] = n < 0.18 ? 0 : Math.round(255 * (0.45 + 0.55 * n));
  }
  gc.putImageData(img, 0, 0);
  return ctx.createPattern(g, "repeat") ?? ink;
}

export const PASSES = 2;
const HANDLE = (4 / 3) * Math.tan(Math.PI / 8);

/* Per-pass anchor offsets for tldraw's ellipse, as PathBuilder.toDrawD:
   clamp(strokeWidth / 3, 0, segmentLength / 4), and the closing command
   reuses the move's offset. */
export function drawPasses(r: number, seed: string, sw: number) {
  const limit = Math.min(sw / 3, (Math.PI * r) / 2 / 4);
  const passes: [number, number][][] = [];
  for (let p = 0; p < PASSES; p++) {
    const random = rng(seed + p);
    const offs: [number, number][] = [];
    for (let i = 0; i < 4; i++) {
      const dx = random();
      const dy = random();
      const len = Math.hypot(dx, dy) || 1;
      const mag = Math.sqrt(Math.abs(random())) * limit;
      offs.push([(dx / len) * mag, (dy / len) * mag]);
    }
    offs.push(offs[0]);
    passes.push(offs);
  }
  return passes;
}

/* One pass of tldraw's ellipse: four quarter-arc cubics from the left edge,
   sweeping positive, each end and its controls nudged by that pass's
   offsets. */
export function tracePass(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  offs: [number, number][],
) {
  const pt = (th: number) => [x + r * Math.cos(th), y + r * Math.sin(th)];
  const dv = (th: number) => [-r * Math.sin(th), r * Math.cos(th)];
  const [px, py] = pt(Math.PI);
  ctx.moveTo(px + offs[0][0], py + offs[0][1]);
  for (let i = 0; i < 4; i++) {
    const t1 = Math.PI + (i * Math.PI) / 2;
    const t2 = t1 + Math.PI / 2;
    const [ox, oy] = offs[i + 1];
    const a = pt(t1);
    const b = pt(t2);
    const d1 = dv(t1);
    const d2 = dv(t2);
    ctx.bezierCurveTo(
      a[0] + HANDLE * d1[0] + ox,
      a[1] + HANDLE * d1[1] + oy,
      b[0] - HANDLE * d2[0] + ox,
      b[1] - HANDLE * d2[1] + oy,
      b[0] + ox,
      b[1] + oy,
    );
  }
}
