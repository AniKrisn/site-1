import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { rng } from "./sketch";

/* An Apollonian gasket drawn in tldraw's draw style. It inks itself in
   largest circle first, then zooms forever inside the first boundary toward
   a point the circles never cover: it fills and fills and never fills up.

   Each circle is tldraw's ellipse (four quarter-arc cubics, each end nudged
   up to strokeWidth/3 by the seeded rng, two passes), seeded by its exact
   integer coordinates in the gasket so it keeps its hand across frames.

   On desktop it hangs in the drawn scene's sky, under the flock; below
   1024px the scene is hidden, so it sits under the text instead. */

/* A circle as curvature k and curvature-weighted centre (bx, by) = k·centre;
   all integers in the (-1, 2, 2, 3, 3) gasket. */
type Circle = { k: number; bx: number; by: number };
type Gap = [Circle, Circle, Circle, Circle];

const C = (k: number, x: number, y: number): Circle => ({
  k,
  bx: k * x,
  by: k * y,
});
const O = C(-1, 0, 0);
const A = C(2, -0.5, 0);
const B = C(2, 0.5, 0);
const U = C(3, 0, 2 / 3);
const D = C(3, 0, -2 / 3);
const GAPS: Gap[] = [
  [O, A, U, B],
  [O, B, U, A],
  [A, B, U, O],
  [O, A, D, B],
  [O, B, D, A],
  [A, B, D, O],
];

/* The circle filling gap (a, b, c) on the far side from d. */
const reflect = (a: Circle, b: Circle, c: Circle, d: Circle): Circle => ({
  k: 2 * (a.k + b.k + c.k) - d.k,
  bx: 2 * (a.bx + b.bx + c.bx) - d.bx,
  by: 2 * (a.by + b.by + c.by) - d.by,
});

/* Circle through the three tangency points; it encloses the gap and
   everything that will fill it. */
function dual(a: Circle, b: Circle, c: Circle): [number, number, number] {
  const t = (p: Circle, q: Circle) => [
    (p.bx + q.bx) / (p.k + q.k),
    (p.by + q.by) / (p.k + q.k),
  ];
  const [x1, y1] = t(a, b);
  const [x2, y2] = t(b, c);
  const [x3, y3] = t(c, a);
  const d = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
  const s1 = x1 * x1 + y1 * y1;
  const s2 = x2 * x2 + y2 * y2;
  const s3 = x3 * x3 + y3 * y3;
  const ux = (s1 * (y2 - y3) + s2 * (y3 - y1) + s3 * (y1 - y2)) / d;
  const uy = (s1 * (x3 - x2) + s2 * (x1 - x3) + s3 * (x2 - x1)) / d;
  return [ux, uy, Math.hypot(x1 - ux, y1 - uy)];
}

/* A random point of the residual set: follow nested gaps down, favouring
   wide gaps so the walk doesn't slide into a cusp. */
function walk(): [number, number] | null {
  let g = GAPS[(Math.random() * 6) | 0];
  for (let i = 0; i < 160; i++) {
    const [a, b, c, d] = g;
    const n = reflect(a, b, c, d);
    if (!Number.isFinite(n.bx / n.k)) break;
    if (1 / n.k < 1e-13) return [n.bx / n.k, n.by / n.k];
    const kids: Gap[] = [
      [a, b, n, c],
      [a, c, n, b],
      [b, c, n, a],
    ];
    const w = kids.map((q) => reflect(...q).k ** -2);
    let u = Math.random() * (w[0] + w[1] + w[2]);
    let j = 0;
    while (j < 2 && u > w[j]) u -= w[j++];
    g = kids[j];
  }
  return null;
}

function pickTarget(): [number, number] {
  for (let tries = 0; tries < 50; tries++) {
    const t = walk();
    // Otherwise the lens spends the zoom looking past the edge.
    if (t && Math.hypot(t[0], t[1]) < 0.85) return t;
  }
  return [-1, 0];
}

const seedOf = (n: Circle) => `${n.k}:${n.bx}:${n.by}`;

const TAU = Math.PI * 2;
const SW = 1.6;
const PASSES = 2;
const HANDLE = (4 / 3) * Math.tan(Math.PI / 8);
/* Small circles draw as if at a smaller tldraw scale, otherwise their
   strokes fill the gaps solid. */
const strokeFor = (r: number) => SW * Math.max(0.35, Math.min(1, r / 14));

/* Per-pass anchor offsets, as PathBuilder.toDrawD: clamp(offset, 0,
   segmentLength / 4), and the closing command reuses the move's offset. */
function drawPasses(r: number, seed: string, sw: number) {
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

const FILL_RATE = 1.1;
const MAX_DECADES = 8;
const FADE_S = 2.5;
const THR = 1.1;
const DRAW = 0.3;

const WIDE = "(min-width: 1024px)";

export function Sponge() {
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

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const ZOOM_RATE = Math.LN10 / (reduce ? 90 : 20);
    let W = 0;
    let dpr = 1;
    let inkColor = "#333";
    let lead: CanvasPattern | string = inkColor;

    /* Pencil: the ink colour with a seeded grain knocked out of it, so the
       line reads as graphite on paper rather than a flat stroke. */
    const makeLead = () => {
      const g = document.createElement("canvas");
      g.width = g.height = 64;
      const gc = g.getContext("2d");
      if (!gc) return inkColor;
      gc.fillStyle = inkColor;
      gc.fillRect(0, 0, 64, 64);
      const img = gc.getImageData(0, 0, 64, 64);
      const random = rng("lead");
      for (let i = 3; i < img.data.length; i += 4) {
        const n = Math.abs(random());
        img.data[i] = n < 0.18 ? 0 : Math.round(255 * (0.45 + 0.55 * n));
      }
      gc.putImageData(img, 0, 0);
      return ctx!.createPattern(g, "repeat") ?? inkColor;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = box.clientWidth;
      cv.width = cv.height = Math.round(W * dpr);
      const cs = getComputedStyle(cv);
      inkColor = cs.color;
      lead = makeLead();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    const themeWatch = new MutationObserver(resize);
    themeWatch.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    resize();

    function tracePass(
      x: number,
      y: number,
      r: number,
      offs: [number, number][],
    ) {
      // Anchors at π, 3π/2, 2π, 5π/2, 3π: tldraw starts the ellipse at its
      // left edge and sweeps positive.
      const pt = (th: number) => [x + r * Math.cos(th), y + r * Math.sin(th)];
      const dv = (th: number) => [-r * Math.sin(th), r * Math.cos(th)];
      const [px, py] = pt(Math.PI);
      ctx!.moveTo(px + offs[0][0], py + offs[0][1]);
      for (let i = 0; i < 4; i++) {
        const t1 = Math.PI + (i * Math.PI) / 2;
        const t2 = t1 + Math.PI / 2;
        const [ox, oy] = offs[i + 1];
        const a = pt(t1);
        const b = pt(t2);
        const d1 = dv(t1);
        const d2 = dv(t2);
        ctx!.bezierCurveTo(
          a[0] + HANDLE * d1[0] + ox,
          a[1] + HANDLE * d1[1] + oy,
          b[0] - HANDLE * d2[0] + ox,
          b[1] - HANDLE * d2[1] + oy,
          b[0] + ox,
          b[1] + oy,
        );
      }
    }

    /* One circle; prog draws the line on, pass by pass. */
    function ink(x: number, y: number, r: number, seed: string, prog: number) {
      if (prog <= 0) return;
      if (prog > 1) prog = 1;
      const c = ctx!;
      if (r < 1.4) {
        c.fillStyle = lead;
        c.beginPath();
        c.arc(x, y, (0.3 + r * 0.25) * Math.min(1, prog * 2), 0, TAU);
        c.fill();
        return;
      }
      const sw = strokeFor(r);
      const passes = drawPasses(r, seed, sw);
      // Giant circles draw only the visible arc, otherwise canvas loses
      // precision and chords cut across the view.
      const huge = r > 3 * W;
      const th = huge ? Math.atan2(W / 2 - y, W / 2 - x) : 0;
      const span = huge ? (1.6 * W) / r : 0;
      const arc = (ox: number, oy: number) => {
        for (let i = 0; i <= 60; i++) {
          const q = th - span + (2 * span * i) / 60;
          c.lineTo(x + ox + r * Math.cos(q), y + oy + r * Math.sin(q));
        }
      };

      const L = TAU * r;
      c.lineWidth = sw;
      for (let p = 0; p < PASSES; p++) {
        // The second pass retraces just behind the first.
        const pp = Math.min(1, Math.max(0, prog * 1.3 - p * 0.3));
        if (pp <= 0) continue;
        c.beginPath();
        if (huge) arc(passes[p][0][0], passes[p][0][1]);
        else tracePass(x, y, r, passes[p]);
        c.setLineDash(pp < 1 ? [L * pp, L * 2] : []);
        c.stroke();
      }
      c.setLineDash([]);
    }

    let T = pickTarget();
    let t0 = performance.now();
    const lensStart = t0;
    let S = 1;
    let Px = 0;
    let Py = 0;
    let thr = THR;
    const begin = () => {
      T = pickTarget();
      t0 = performance.now();
    };

    const onScreen = (x: number, y: number, r: number) =>
      x + r > 0 && x - r < W && y + r > 0 && y - r < W;

    function drawCircle(n: Circle) {
      const r = S / n.k;
      if (r < thr) return;
      const x = Px + (n.bx / n.k - T[0]) * S;
      const y = Py + (n.by / n.k - T[1]) * S;
      if (!onScreen(x, y, r)) return;
      ink(x, y, r, seedOf(n), (r - thr) / (thr * DRAW));
    }

    /* The largest circle in a gap bounds everything inside it, so stop once
       it's sub-pixel; otherwise cusps recurse forever. */
    function fillGaps() {
      const stack = GAPS.slice();
      while (stack.length) {
        const [a, b, c, d] = stack.pop()!;
        const n = reflect(a, b, c, d);
        if (S / n.k < thr) continue;
        const [ux, uy, ur] = dual(a, b, c);
        if (!onScreen(Px + (ux - T[0]) * S, Py + (uy - T[1]) * S, ur * S))
          continue;
        drawCircle(n);
        stack.push([a, b, n, c], [a, c, n, b], [b, c, n, a]);
      }
    }

    const ease = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!W) return;
      const t = (now - t0) / 1000;
      const S0 = W * 0.46;
      // Zoom once the visible circles are in, otherwise it idles drawing sub-pixel dust.
      const fillEnd = Math.log((S0 * 1.2) / 6) / FILL_RATE;
      const tz = reduce ? 0 : Math.max(0, t - fillEnd);
      const zoomEnd = (MAX_DECADES * Math.LN10) / ZOOM_RATE;
      // Past ~10^8 doubles can't place the target precisely enough.
      if (tz > zoomEnd + FADE_S) {
        begin();
        return;
      }

      S = S0 * Math.exp(tz * ZOOM_RATE);
      const m = ease(tz / 25);
      Px = W / 2 + T[0] * S0 * (1 - m);
      Py = W / 2 + T[1] * S0 * (1 - m);
      thr = Math.max(THR, S0 * 1.2 * Math.exp(-t * FILL_RATE));

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, W);
      ctx.globalAlpha =
        tz > zoomEnd ? Math.max(0, 1 - (tz - zoomEnd) / FADE_S) : 1;
      ctx.strokeStyle = lead;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      // The first boundary stays put as a lens; the zoom happens inside it.
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, W / 2, S0 - 1, 0, TAU);
      ctx.clip();
      if (tz > 0) ink(Px - T[0] * S, Py - T[1] * S, S, "outer", 1);
      for (const c of [A, B, U, D]) drawCircle(c);
      fillGaps();
      ctx.restore();
      ctx.globalAlpha = 1;
      ink(W / 2, W / 2, S0, "lens", (now - lensStart) / 600);
    };
    raf = requestAnimationFrame(frame);

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      begin();
    };
    box.addEventListener("click", begin);
    box.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeWatch.disconnect();
      box.removeEventListener("click", begin);
      box.removeEventListener("keydown", onKey);
    };
  }, [wide, scene]);

  const box = (
    <div
      ref={boxRef}
      className={wide ? "sponge sponge-sky" : "sponge"}
      role="button"
      tabIndex={0}
      aria-label="Apollonian gasket, drawn in ink and zooming forever. Click to follow a new path."
    >
      <canvas ref={canvasRef} />
    </div>
  );
  if (!wide) return box;
  return scene ? createPortal(box, scene) : null;
}
