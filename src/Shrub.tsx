import { drawPasses, PASSES, tracePass } from "./pencil";
import { SkyPiece, type SkyStart } from "./SkyPiece";

/* A shrub that grows and is pruned forever, after the Overgrowth example in
   tldraw/tldraw. One primitive (a core) and one rule (tips advance, wander,
   fork) grow a strict tree; the growth budget is conserved, split across the
   tips, so every fork slows the rest. A gardener snips the most crowded vine
   every so often and everything past the cut withers, which concentrates
   growth back into the healthy limbs. Clicking cuts the vine nearest the
   pointer.

   Positions are in units of the canvas width, so a resize rescales it. */

type Node = {
  x: number;
  y: number;
  parent: Node | null;
  depth: number;
  born: number;
  sub: number;
  dying: number;
};
type Tip = { node: Node; heading: number; bank: number };
type Snip = { x: number; y: number; at: number };

const ROOT = { x: 0.5, y: 0.92 };
const SEG = 0.013;
const PULSE = 0.11;
const FLOW = 6;
const MAX_STEPS = 2;
const MAX_TIPS = 150;
const TRUNK = 12;
const WITHER = 0.9;
const CROWD = 0.007;
const CELL = 0.05;
const UP = -Math.PI / 2;

/* The canopy the shrub may fill, plus a narrow trunk corridor down to the
   core. */
const inBounds = (x: number, y: number) =>
  Math.hypot(x - 0.5, y - 0.44) < 0.44 ||
  (y > 0.7 && y < 0.95 && Math.abs(x - 0.5) < 0.05);

const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.8;

const startShrub: SkyStart = (ctx, box, view) => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pulseEvery = reduce ? PULSE * 4 : PULSE;
  let now = 0;
  let nodes: Node[] = [];
  let tips: Tip[] = [];
  let snips: Snip[] = [];
  let grid = new Map<string, Node[]>();
  let split = false;

  const key = (x: number, y: number) =>
    `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`;
  const reindex = () => {
    grid = new Map();
    for (const n of nodes) {
      if (n.dying) continue;
      const k = key(n.x, n.y);
      const cell = grid.get(k);
      if (cell) cell.push(n);
      else grid.set(k, [n]);
    }
  };
  const near = (x: number, y: number, fn: (n: Node) => void) => {
    const cx = Math.floor(x / CELL);
    const cy = Math.floor(y / CELL);
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++)
        for (const n of grid.get(`${cx + i},${cy + j}`) ?? []) fn(n);
  };

  const plant = () => {
    const root: Node = {
      ...ROOT,
      parent: null,
      depth: 0,
      born: now,
      sub: 1,
      dying: 0,
    };
    nodes = [root];
    tips = [{ node: root, heading: UP, bank: 0 }];
    snips = [];
    split = false;
    reindex();
  };

  /* Nodes are appended after their parent, so a reverse sweep sums each
     subtree before its parent reads it. */
  const measure = () => {
    for (const n of nodes) n.sub = 1;
    for (let i = nodes.length - 1; i > 0; i--) {
      const n = nodes[i];
      if (n.parent && !n.dying) n.parent.sub += n.sub;
    }
  };

  const isAncestor = (a: Node, n: Node) => {
    for (let p: Node | null = n, k = 0; p && k < 6; p = p.parent, k++)
      if (p === a) return true;
    return false;
  };

  /* One tip step: persist the heading with jitter, lean up, and turn away
     from nearby vines; die on collision or leaving the canopy. */
  const step = (tip: Tip): boolean => {
    const from = tip.node;
    let rx = 0;
    let ry = 0;
    near(from.x, from.y, (n) => {
      if (isAncestor(n, from)) return;
      const dx = from.x - n.x;
      const dy = from.y - n.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > 0 && d2 < 0.0036) {
        rx += dx / d2;
        ry += dy / d2;
      }
    });
    let h = tip.heading + gauss() * 0.3;
    h += Math.sin(UP - h) * (from.depth < TRUNK ? 0.5 : 0.05);
    if (rx || ry) {
      const away = Math.atan2(ry, rx);
      h += Math.sin(away - h) * 0.35;
    }
    const x = from.x + Math.cos(h) * SEG;
    const y = from.y + Math.sin(h) * SEG;
    if (!inBounds(x, y)) return false;
    let hit = false;
    near(x, y, (n) => {
      if (!hit && n !== from && Math.hypot(n.x - x, n.y - y) < CROWD)
        hit = true;
    });
    if (hit) return false;
    const node: Node = {
      x,
      y,
      parent: from,
      depth: from.depth + 1,
      born: now,
      sub: 1,
      dying: 0,
    };
    nodes.push(node);
    const k = key(x, y);
    const cell = grid.get(k);
    if (cell) cell.push(node);
    else grid.set(k, [node]);
    tip.node = node;
    tip.heading = h;
    return true;
  };

  /* Conserved flow: FLOW segments a pulse, shared by every tip, so a fork
     costs the whole shrub speed and a cut hands it back. */
  const pulse = () => {
    const share = FLOW / Math.max(1, tips.length);
    const next: Tip[] = [];
    for (const tip of tips) {
      tip.bank += share;
      let alive = true;
      let steps = 0;
      while (tip.bank >= 1 && steps < MAX_STEPS) {
        tip.bank -= 1;
        steps++;
        if (!step(tip)) {
          alive = false;
          break;
        }
      }
      if (tip.bank > MAX_STEPS) tip.bank = MAX_STEPS;
      if (!alive) continue;
      next.push(tip);
      // The trunk splits into three limbs, like the reference tree.
      if (!split && tip.node.depth >= TRUNK) {
        split = true;
        next.push({ node: tip.node, heading: tip.heading - 0.7, bank: 0 });
        next.push({ node: tip.node, heading: tip.heading + 0.7, bank: 0 });
        continue;
      }
      // Forks come faster out at the tips, so limbs end in dense tufts.
      const d = tip.node.depth;
      const forkP = d < TRUNK ? 0 : Math.min(0.4, 0.08 + (d - TRUNK) * 0.012);
      if (steps && next.length < MAX_TIPS && Math.random() < forkP) {
        const turn =
          (0.35 + Math.random() * 0.4) * (Math.random() < 0.5 ? -1 : 1);
        next.push({ node: tip.node, heading: tip.heading + turn, bank: 0 });
        tip.heading -= turn * 0.4;
      }
    }
    tips = next;
    // Buds: dormant nodes break into new growth when the tips run thin.
    const living = nodes.filter((n) => !n.dying && n.depth >= 1);
    while (tips.length < 4 && living.length) {
      const n = living[(Math.random() * living.length) | 0];
      tips.push({
        node: n,
        heading: UP + (Math.random() - 0.5) * 2.2,
        bank: 0,
      });
    }
    measure();
  };

  const cut = (n: Node) => {
    if (!n.parent || n.dying) return;
    const doomed = new Set<Node>([n]);
    for (const m of nodes) if (m.parent && doomed.has(m.parent)) doomed.add(m);
    for (const m of doomed) m.dying = now;
    tips = tips.filter((t) => !doomed.has(t.node));
    snips.push({
      x: (n.x + n.parent.x) / 2,
      y: (n.y + n.parent.y) / 2,
      at: now,
    });
    reindex();
    measure();
  };

  /* The gardener cuts where it's most crowded, favouring whole side limbs
     over twigs, and cuts harder the bigger the shrub gets. */
  const prune = () => {
    const living = nodes.filter((n) => !n.dying);
    if (living.length < 650) return;
    let best: Node | null = null;
    let bestScore = 0;
    for (let i = 0; i < 40; i++) {
      const n = living[(Math.random() * living.length) | 0];
      if (n.depth < TRUNK + 2 || n.sub < 6 || n.sub > living.length * 0.4)
        continue;
      let crowd = 0;
      near(n.x, n.y, () => crowd++);
      const score = crowd * Math.sqrt(n.sub);
      if (score > bestScore) {
        bestScore = score;
        best = n;
      }
    }
    if (best) cut(best);
  };

  let raf = 0;
  let last = performance.now();
  let pulseAcc = 0;
  let pruneAcc = 0;
  plant();

  const frame = (t: number) => {
    raf = requestAnimationFrame(frame);
    // Catch up after slow or hidden frames, otherwise growth stalls with the frame rate.
    const dt = Math.min(1, (t - last) / 1000);
    last = t;
    now += dt;
    pulseAcc += dt;
    pruneAcc += dt;
    while (pulseAcc >= pulseEvery) {
      pulseAcc -= pulseEvery;
      pulse();
    }
    const living = nodes.length;
    if (pruneAcc >= Math.max(0.35, 2.4 - living / 500)) {
      pruneAcc = 0;
      prune();
    }
    if (nodes.some((n) => n.dying && now - n.dying > WITHER)) {
      nodes = nodes.filter((n) => !n.dying || now - n.dying <= WITHER);
      reindex();
    }
    snips = snips.filter((s) => now - s.at < WITHER);

    const { W, dpr, lead } = view();
    if (!W) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, W);
    ctx.strokeStyle = lead;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const scale = W / 340;

    for (const n of nodes) {
      const p = n.parent;
      if (!p) continue;
      // A new segment grows in over one pulse; a cut limb fades out.
      const g = Math.min(1, (now - n.born) / pulseEvery);
      ctx.globalAlpha = n.dying ? Math.max(0, 1 - (now - n.dying) / WITHER) : 1;
      ctx.lineWidth = Math.min(4.5, 0.6 + 0.28 * Math.sqrt(n.sub)) * scale;
      ctx.beginPath();
      ctx.moveTo(p.x * W, p.y * W);
      ctx.lineTo((p.x + (n.x - p.x) * g) * W, (p.y + (n.y - p.y) * g) * W);
      ctx.stroke();
    }

    ctx.lineWidth = 1.4 * scale;
    for (const s of snips) {
      ctx.globalAlpha = Math.max(0, 1 - (now - s.at) / WITHER);
      const a = 0.014 * W;
      ctx.beginPath();
      ctx.moveTo(s.x * W - a, s.y * W - a);
      ctx.lineTo(s.x * W + a, s.y * W + a);
      ctx.moveTo(s.x * W + a, s.y * W - a);
      ctx.lineTo(s.x * W - a, s.y * W + a);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    const r = 0.024 * W;
    const passes = drawPasses(r, "core", 1.6);
    ctx.lineWidth = 1.6 * scale;
    for (let i = 0; i < PASSES; i++) {
      ctx.beginPath();
      tracePass(ctx, ROOT.x * W, ROOT.y * W + r, r, passes[i]);
      ctx.stroke();
    }
  };
  raf = requestAnimationFrame(frame);

  const onClick = (e: MouseEvent) => {
    const rect = box.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.width;
    let best: Node | null = null;
    let bestD = 0.05;
    for (const n of nodes) {
      if (n.dying || n.depth < 2) continue;
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    if (best) cut(best);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    prune();
  };
  box.addEventListener("click", onClick);
  box.addEventListener("keydown", onKey);

  return () => {
    cancelAnimationFrame(raf);
    box.removeEventListener("click", onClick);
    box.removeEventListener("keydown", onKey);
  };
};

export function Shrub() {
  return (
    <SkyPiece
      label="A shrub drawn in pencil, growing from one core and pruned forever. Click a branch to cut it."
      start={startShrub}
    />
  );
}
