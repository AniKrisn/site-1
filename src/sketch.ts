/* Port of tldraw's draw-style ("inky") path rendering, specialised to a
   closed rectangle. Faithful to PathBuilder.toDrawD in
   tldraw/packages/tldraw/src/lib/shapes/shared/PathBuilder.tsx:
   corner jitter from a seeded xorshift rng, quadratic-rounded corners
   clamped by edge length, and multiple passes for the double-stroked line. */

type Vec = { x: number; y: number };

/* tldraw's seeded rng (packages/utils/src/lib/number.ts) — returns values
   in [-1, 1]. */
export function rng(seed = "") {
  let x = 0;
  let y = 0;
  let z = 0;
  let w = 0;

  function next() {
    const t = x ^ (x << 11);
    x = y;
    y = z;
    z = w;
    w ^= ((w >>> 19) ^ t ^ (t >>> 8)) >>> 0;
    return (w / 0x100000000) * 2;
  }

  for (let k = 0; k < seed.length + 64; k++) {
    x ^= seed.charCodeAt(k) | 0;
    next();
  }

  return next;
}

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(n, max));

const uni = (v: Vec): Vec => {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
};

const r = (n: number) => Math.round(n * 100) / 100;

interface DrawRectOpts {
  strokeWidth: number;
  seed: string;
  offset?: number;
  roundness?: number;
  passes?: number;
}

export function drawRectD(w: number, h: number, opts: DrawRectOpts): string {
  const {
    strokeWidth,
    seed,
    offset: defaultOffset = strokeWidth / 3,
    roundness: defaultRoundness = strokeWidth * 2,
    passes = 2,
  } = opts;

  const P: Vec[] = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];

  // Commands: 0 = move to P0, 1..3 = line to P1..P3, 4 = closing line to P0.
  // Segment i (1..4) runs P[i-1] → P[i % 4]; tangents point backward, as in
  // tldraw. Move commands carry no segment info.
  const info = [null as null | { length: number; tangent: Vec }];
  for (let i = 1; i <= 4; i++) {
    const a = P[i - 1];
    const b = P[i % 4];
    info[i] = {
      length: Math.hypot(b.x - a.x, b.y - a.y),
      tangent: uni({ x: a.x - b.x, y: a.y - b.y }),
    };
  }

  const cmds = [];
  for (let i = 0; i <= 4; i++) {
    const isClose = i === 4;
    const nextIdx = isClose ? 1 : i + 1 <= 4 ? i + 1 : undefined;
    const cur = info[i];
    const next = nextIdx !== undefined ? info[nextIdx] : undefined;
    const tangentToPrev = cur?.tangent;
    const tangentToNext = next?.tangent;

    // Every corner of a rectangle is a right angle, which maps to full
    // roundness in tldraw's angle modulation.
    const roundnessForAngle = tangentToPrev && tangentToNext ? defaultRoundness : 0;

    const shortest = Math.min(cur?.length ?? Infinity, next?.length ?? Infinity);
    const offsetLimit = shortest - roundnessForAngle * 2;

    cmds.push({
      corner: P[i % 4],
      isMove: i === 0,
      isClose,
      offsetAmount: clamp(defaultOffset, 0, offsetLimit / 4),
      roundnessBefore: Math.min(roundnessForAngle, (cur?.length ?? Infinity) / 4),
      roundnessAfter: Math.min(roundnessForAngle, (next?.length ?? Infinity) / 4),
      tangentToPrev,
      tangentToNext,
    });
  }
  // moveDidClose: the closing corner is the move's corner, so the move
  // inherits the close command's outgoing roundness for a seamless joint.
  cmds[0].roundnessAfter = cmds[4].roundnessAfter;

  const parts: string[] = [];
  for (let pass = 0; pass < passes; pass++) {
    const random = rng(seed + pass);
    let moveOffset: Vec = { x: 0, y: 0 };

    for (const c of cmds) {
      let off: Vec;
      if (c.isClose) {
        off = moveOffset;
      } else {
        const dir = uni({ x: random(), y: random() });
        const mag = Math.sqrt(Math.abs(random())) * c.offsetAmount;
        off = { x: dir.x * mag, y: dir.y * mag };
      }
      if (c.isMove) moveOffset = off;

      const p = { x: c.corner.x + off.x, y: c.corner.y + off.y };
      const hasEnd = c.tangentToNext && c.roundnessAfter > 0;
      const hasStart = c.tangentToPrev && c.roundnessBefore > 0;
      const end = hasEnd
        ? {
            x: p.x - c.tangentToNext!.x * c.roundnessAfter,
            y: p.y - c.tangentToNext!.y * c.roundnessAfter,
          }
        : p;
      const start = hasStart
        ? {
            x: p.x + c.tangentToPrev!.x * c.roundnessBefore,
            y: p.y + c.tangentToPrev!.y * c.roundnessBefore,
          }
        : p;

      if (c.isMove) {
        parts.push(`M${r(end.x)},${r(end.y)}`);
      } else if (!hasStart || !hasEnd) {
        parts.push(`L${r(end.x)},${r(end.y)}`);
      } else {
        parts.push(
          `L${r(start.x)},${r(start.y)} Q${r(p.x)},${r(p.y)} ${r(end.x)},${r(end.y)}`
        );
      }
    }
  }

  return parts.join(" ");
}
