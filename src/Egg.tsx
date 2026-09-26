import { flockRoom, POSE_DOWN, POSE_FLAT, POSE_FULL, POSE_UP } from "./Birds";
import { SkyPiece, type SkyStart, type TreeAnchor } from "./SkyPiece";

/* For Descriptions' last line, teaching doesn't exist but learning does:
   three eggs tucked into a clump of the landscape's grass, which already
   reads as a nest. A few seconds in, they hatch from the inside, once. Each
   rocks, and a crack spreads a little with every rock; a chip pops out and
   a beak pokes through; then the top hops off and a bird drawn exactly as
   the flock's climbs out and is handed to the real flock. The broken shells
   stay. Nothing outside ever touches them.

   The canvas sits behind the landscape drawing, so the grass stays in front
   of the eggs. Positions are in units of the canvas width. */

type Pt = [number, number];
type Egg = { x: number; y: number; rx: number; ry: number; tilt: number; at: number; seed: number };

/* The flock's wingbeat: down, flat, up, full, up, flat. */
const POSES = [POSE_DOWN, POSE_FLAT, POSE_UP, POSE_FULL, POSE_UP, POSE_FLAT];
const POSE_X = new Map<string, number>([
  [POSE_DOWN, 9.5],
  [POSE_FLAT, 38.5],
  [POSE_UP, 70.5],
  [POSE_FULL, 121],
]);
const PATHS = new Map(POSES.map((d) => [d, new Path2D(d)]));

/* The grass clump's centre in the canvas. */
const CX = 0.5;
const CY = 0.6;

/* Moments in each egg's hatching, in seconds from when its top comes off. */
const FIRST = 4.2;
const STAGGER = 0.7;
const ROCKS = [-2.2, -1.5, -0.9];
const PIP = -0.55;
const HOP = 0.18;
const RISE = 0.35;
const FLAP = 0.8;
const FLY = 1.1;
const HANDOFF = 0.35;

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const ease = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};

/* Three eggs sat down in the clump, the middle one a touch further back. */
const EGGS: Egg[] = [
  { x: CX - 0.075, y: CY - 0.035, rx: 0.046, ry: 0.06, tilt: -0.2, at: FIRST, seed: 1 },
  { x: CX + 0.01, y: CY - 0.05, rx: 0.049, ry: 0.064, tilt: 0.06, at: FIRST + STAGGER, seed: 2 },
  { x: CX + 0.09, y: CY - 0.032, rx: 0.044, ry: 0.058, tilt: 0.22, at: FIRST + STAGGER * 2, seed: 3 },
];

/* An egg's outline in its own frame, narrower at the top (angle 0). */
const eggPoint = (e: Egg, th: number): Pt => [
  e.rx * Math.sin(th) * (1 - 0.12 * Math.cos(th)),
  -e.ry * Math.cos(th),
];

/* The crack, in the egg's own frame: it starts at one spot and runs both
   ways round the shell in a few uneven steps, with two small branches. The
   last point of each run meets the edge, so the top can come off along it. */
function crackOf(e: Egg) {
  const y0 = -0.28 * e.ry;
  const start: Pt = [0.25 * e.rx, y0];
  const run = (dir: number, steps: number[]): Pt[] => {
    const pts: Pt[] = [start];
    let x = start[0];
    steps.forEach((dy, i) => {
      const end = dir > 0 ? e.rx : -e.rx;
      x = start[0] + ((end - start[0]) * (i + 1)) / steps.length;
      pts.push([x, y0 + dy * e.ry]);
    });
    return pts;
  };
  const right = run(1, [-0.05, 0.03, 0]);
  const left = run(-1, [0.06, -0.03, 0.05, -0.02, 0.02, 0]);
  const branches: [Pt, Pt][] = [
    [left[2], [left[2][0] - 0.12 * e.rx, left[2][1] - 0.16 * e.ry]],
    [right[1], [right[1][0] + 0.05 * e.rx, right[1][1] + 0.17 * e.ry]],
  ];
  return { start, left, right, branches };
}

const startEgg: SkyStart = (ctx, box, view) => {
  const t0 = performance.now();
  // Hatch only if the flock can take them; otherwise they stay eggs.
  const hatching = flockRoom() >= EGGS.length;
  const handed = new Set<Egg>();

  let raf = 0;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const { W, dpr, ink, paper } = view();
    if (!W) return;
    const t = (now - t0) / 1000;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, W);
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const e of EGGS) {
      const u = hatching ? t - e.at : -Infinity;
      const cx = e.x * W;
      const cy = e.y * W;

      // A rock each time something inside pushes.
      let rock = 0;
      for (const r of ROCKS) {
        const q = (u - r) / 0.42;
        if (q > 0 && q < 1) rock += 0.2 * Math.sin(q * Math.PI * 3 + e.seed) * Math.sin(q * Math.PI);
      }
      if (u > PIP && u < 0) rock += 0.04 * Math.sin(u * 40);

      // Egg frame to canvas: its lean, plus rocking about its base.
      const toCanvas = ([x, y]: Pt): Pt => {
        const a = e.tilt + rock;
        const yy = y - e.ry;
        return [
          cx + (x * Math.cos(a) - yy * Math.sin(a)) * W,
          cy + (x * Math.sin(a) + yy * Math.cos(a)) * W + e.ry * W,
        ];
      };
      const path = (P: Pt[], xf: (p: Pt) => Pt, close = true) => {
        ctx.beginPath();
        P.forEach((p, j) => {
          const [x, y] = xf(p);
          if (j) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        });
        if (close) ctx.closePath();
      };
      const stroke = (P: Pt[], xf: (p: Pt) => Pt, lw: number, close = false) => {
        ctx.lineWidth = lw;
        path(P, xf, close);
        ctx.stroke();
      };
      const shell = (P: Pt[], xf: (p: Pt) => Pt) => {
        ctx.save();
        ctx.fillStyle = paper;
        path(P, xf);
        ctx.fill();
        ctx.restore();
        stroke(P, xf, 2.4, true);
      };

      const { start, left, right, branches } = crackOf(e);
      const eggArc = (from: number, to: number) =>
        Array.from({ length: 33 }, (_, j) => eggPoint(e, from + ((to - from) * j) / 32));
      const whole = eggArc(0, Math.PI * 2);
      // Where the runs meet the shell's edge.
      const thL = Math.PI * 2 - Math.acos(-left[left.length - 1][1] / e.ry);
      const thR = Math.acos(-right[right.length - 1][1] / e.ry);
      const seam = [...left.slice().reverse(), ...right.slice(1)];
      const base = [...eggArc(thR, thL), ...left.slice().reverse().slice(1, -1), start, ...right.slice(1, -1)];
      const cap = [...eggArc(thL - Math.PI * 2, thR), ...right.slice().reverse().slice(1, -1), start, ...left.slice(1, -1)];

      // The chick, until the flock takes it.
      if (u > RISE && !handed.has(e)) {
        const size = 0.13 * W;
        const ly = cy - ease((u - RISE) / (FLAP - RISE)) * e.ry * W * 1.6 + e.ry * W * 0.3;
        const pose = u > FLAP ? POSES[Math.floor((u - FLAP) / 0.16) % POSES.length] : POSE_FLAT;
        const fT = u - FLY;
        const fx = fT > 0 ? fT * fT * 0.35 * W + fT * 0.08 * W : 0;
        const fy = fT > 0 ? -fT * 0.5 * W : 0;
        ctx.save();
        ctx.translate(cx + fx - size / 2, ly + fy - (size * 240) / 340);
        ctx.scale(size / 340, size / 340);
        ctx.translate(POSE_X.get(pose)!, 240);
        ctx.scale(0.1, -0.1);
        ctx.lineWidth = 170;
        ctx.fill(PATHS.get(pose)!);
        ctx.stroke(PATHS.get(pose)!);
        ctx.restore();

        if (fT > HANDOFF) {
          const rect = box.getBoundingClientRect();
          const detail = {
            x: rect.left + cx + fx,
            y: rect.top + ly + fy - (size * 120) / 340,
            size,
            accepted: false,
          };
          window.dispatchEvent(new CustomEvent("flock:join", { detail }));
          // With no flock to join, it just flies on out of the frame.
          if (detail.accepted || fT > 2) handed.add(e);
        }
      }

      if (u < 0) {
        shell(whole, toCanvas);

        // The crack spreads a step with each rock, out from where it began.
        const grow = ROCKS.reduce((g, r) => g + ease((u - r - 0.12) / 0.18) / ROCKS.length, 0);
        if (grow > 0) {
          const part = (run: Pt[]) => {
            const n = (run.length - 1) * grow;
            const whole = Math.floor(n);
            const pts = run.slice(0, whole + 1);
            if (whole < run.length - 1) {
              const f = n - whole;
              const a = run[whole];
              const b = run[whole + 1];
              pts.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
            }
            return pts;
          };
          stroke(part(left), toCanvas, 1.6);
          stroke(part(right), toCanvas, 1.6);
          branches.forEach(([a, b], i) => {
            const g = clamp01(grow * 3 - 1.2 - i * 0.6);
            if (g > 0) stroke([a, [a[0] + (b[0] - a[0]) * g, a[1] + (b[1] - a[1]) * g]], toCanvas, 1.3);
          });
        }

        // A chip pops out, and a beak pokes through the hole and wiggles.
        if (u > PIP) {
          const hole: Pt = [start[0], start[1] - 0.12 * e.ry];
          const hr = 0.19 * e.rx;
          const [hx, hy] = toCanvas(hole);
          ctx.beginPath();
          ctx.ellipse(hx, hy, hr * W, hr * 0.85 * W, 0, 0, Math.PI * 2);
          ctx.fill();
          const poke = ease((u - PIP) / 0.2) * (0.8 + 0.2 * Math.sin(u * 30));
          const bx = hx - poke * 0.028 * W;
          ctx.beginPath();
          ctx.moveTo(hx + 0.004 * W, hy - 0.007 * W);
          ctx.lineTo(bx, hy + 0.001 * W);
          ctx.lineTo(hx + 0.004 * W, hy + 0.008 * W);
          ctx.closePath();
          ctx.fill();
          const c = u - PIP;
          if (c < 0.8) {
            const cxp = hx + c * 0.05 * W;
            const cyp = hy - c * 0.09 * W + c * c * 0.25 * W;
            ctx.beginPath();
            ctx.moveTo(cxp, cyp - 0.008 * W);
            ctx.lineTo(cxp + 0.009 * W, cyp + 0.005 * W);
            ctx.lineTo(cxp - 0.007 * W, cyp + 0.006 * W);
            ctx.closePath();
            ctx.save();
            ctx.fillStyle = paper;
            ctx.fill();
            ctx.restore();
            ctx.lineWidth = 1.3;
            ctx.stroke();
          }
        }
      } else {
        shell(base, toCanvas);
        stroke(seam, toCanvas, 1.6);
        // The top hops up, tips over to the outside, and drops away.
        const dir = e.x < CX ? -1 : 1;
        const hop = Math.sin(clamp01(u / HOP) * Math.PI) * 0.035 * W;
        const f = Math.max(0, u - HOP * 0.5);
        const a = dir * (ease(f / 0.45) * 1.6 + f * 1.2);
        const drop = f * f * 1.8 * W;
        if (drop < W) {
          const pivot = toCanvas(dir > 0 ? right[right.length - 1] : left[left.length - 1]);
          const capXf = (p: Pt): Pt => {
            const [x, y] = toCanvas(p);
            const dx = x - pivot[0];
            const dy = y - pivot[1];
            return [
              pivot[0] + dx * Math.cos(a) - dy * Math.sin(a) + dir * f * 0.07 * W,
              pivot[1] + dx * Math.sin(a) + dy * Math.cos(a) + drop - hop,
            ];
          };
          shell(cap, capXf);
        }
      }
    }
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
};

/* The clump of grass just right of the tree, in the landscape's viewBox. */
const IN_GRASS: TreeAnchor = { art: [780, 905], at: [CX, CY] };

export function Egg() {
  return (
    <SkyPiece
      anchor={IN_GRASS}
      label="Three eggs in a clump of grass by the tree; they hatch from the inside and the birds join the flock."
      start={startEgg}
    />
  );
}
