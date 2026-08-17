import { useEffect, useMemo, useRef } from "react";

/* Four wingbeat poses drawn on the DC-1, traced and bottom-centre aligned so
   the body holds still while the wings cycle. The flap is a six-phase
   ping-pong (down, flat, up, full-up, up, flat) done with opacity windows in
   CSS -- frame-flipping, no tweening, so the line stays hand-drawn.

   Flight is a small boids flock that lives in the sky top-right of the tree.
   The flock centre chases a slowed-down Lorenz attractor projected into that
   patch of sky, so the group drifts out and folds back in without ever
   settling; separation and alignment keep the birds from stacking. */

const POSE_DOWN =
  'M367 1399 l-69 -72 -73 -1 c-69 -1 -105 -14 -105 -38 0 -5 -13 -23 -30 -40 -16 -16 -30 -36 -30 -43 0 -16 34 -38 44 -28 3 3 24 6 47 5 27 -1 49 5 66 17 13 11 30 18 38 15 7 -3 23 0 35 6 16 8 25 9 35 0 16 -14 64 1 205 62 70 31 108 41 150 42 l55 1 5 -35 c4 -31 10 -37 50 -50 25 -9 59 -23 76 -33 18 -9 51 -19 75 -23 114 -18 233 -113 341 -274 74 -109 121 -240 153 -424 20 -115 29 -144 47 -159 12 -10 27 -28 32 -39 9 -17 25 -30 54 -45 2 0 -10 -19 -26 -42 -16 -22 -35 -55 -42 -72 -13 -29 -12 -33 9 -50 13 -11 27 -19 31 -19 18 0 62 45 82 83 11 23 47 71 79 106 63 68 68 81 44 105 -23 22 -9 60 28 78 18 9 55 41 82 73 83 95 374 386 466 466 204 177 431 291 605 305 l69 5 -55 -50 c-30 -28 -74 -63 -97 -77 -31 -18 -43 -33 -43 -49 0 -57 58 -56 138 4 54 40 100 62 170 80 32 9 42 17 42 32 0 12 -8 23 -20 26 -23 6 -25 14 -9 30 22 22 6 57 -31 70 -88 30 -253 9 -400 -50 -221 -90 -381 -211 -690 -521 -90 -90 -163 -156 -173 -156 -14 0 -17 5 -12 17 20 52 86 293 104 381 34 164 26 232 -31 260 -36 17 -86 -3 -121 -50 -56 -72 -149 -311 -209 -533 l-14 -50 -62 104 c-34 58 -62 109 -62 114 0 12 -78 146 -109 185 -34 44 -202 177 -260 206 -25 13 -71 29 -101 36 -44 10 -64 22 -100 59 -63 64 -141 88 -220 68 -51 -13 -57 -13 -79 4 -13 11 -30 19 -38 19 -8 0 -21 7 -29 15 -27 26 -47 17 -117 -56z m1478 -301 c-14 -124 -114 -486 -132 -480 -4 2 -19 6 -32 9 -21 5 -23 9 -17 47 16 98 161 486 182 486 3 0 3 -28 -1 -62z';

const POSE_FLAT =
  'M1368 1169 c-55 -28 -92 -101 -125 -240 l-27 -117 -80 -7 c-102 -8 -222 -48 -368 -121 -310 -155 -671 -398 -699 -471 -18 -47 25 -86 65 -59 12 8 76 33 142 56 246 87 342 131 459 210 95 64 244 138 304 151 27 6 70 24 96 40 26 17 49 28 51 26 3 -2 0 -44 -6 -93 -13 -118 -13 -324 1 -380 8 -29 23 -54 47 -75 30 -27 41 -30 75 -26 26 4 51 16 74 39 56 54 67 82 69 189 2 76 10 119 38 213 20 64 39 135 42 156 4 22 7 40 8 40 0 0 27 4 59 10 44 7 64 6 85 -5 15 -7 72 -18 126 -24 55 -6 199 -31 320 -56 122 -24 249 -47 283 -51 56 -6 61 -8 53 -25 -7 -13 -6 -22 6 -34 9 -9 19 -14 23 -12 3 2 20 9 38 16 37 15 47 35 32 63 -14 26 -19 100 -8 114 25 31 -29 70 -142 100 -50 13 -129 19 -364 25 -228 5 -322 12 -390 26 l-90 18 0 115 c0 133 -14 172 -70 196 -46 19 -83 17 -127 -7z m102 -81 c0 -2 5 -30 10 -63 13 -82 3 -162 -21 -168 -10 -3 -23 -16 -28 -30 -10 -26 -37 -42 -46 -27 -4 6 -17 10 -31 10 -13 0 -24 2 -24 4 0 17 32 151 45 192 21 60 41 84 72 84 12 0 23 -1 23 -2z m775 -358 c14 -7 8 -8 -20 -3 -22 3 -42 7 -44 9 -9 8 45 2 64 -6z m-801 -62 c-10 -34 -28 -41 -35 -15 -8 28 -2 37 22 37 17 0 19 -4 13 -22z m-735 -153 c-13 -13 -232 -115 -237 -110 -3 2 46 29 109 60 102 49 142 64 128 50z';

const POSE_UP =
  'M1830 2232 c-54 -34 -149 -135 -195 -206 -177 -278 -216 -346 -302 -536 -91 -201 -136 -319 -219 -574 -89 -275 -105 -318 -110 -313 -2 2 5 48 16 101 49 232 61 386 35 441 -39 81 -149 70 -209 -22 -34 -51 -73 -177 -94 -296 -22 -131 -41 -144 -66 -47 -21 79 -43 105 -81 96 -14 -4 -25 -4 -25 -1 0 3 -13 49 -29 104 -16 55 -27 110 -24 123 12 64 -217 767 -269 824 -14 15 -17 29 -12 48 8 32 -10 56 -40 56 -34 0 -146 -129 -146 -168 0 -12 17 -41 39 -66 54 -62 150 -257 205 -413 25 -73 66 -183 91 -244 82 -201 199 -720 210 -932 2 -38 10 -76 17 -84 37 -45 148 -66 198 -39 22 13 28 12 53 -6 30 -22 54 -18 63 9 4 10 21 59 40 108 18 50 49 146 68 215 22 82 60 181 110 289 42 91 100 230 127 310 96 275 180 476 296 710 106 212 125 242 199 327 45 51 99 109 119 129 35 33 37 36 23 57 -22 32 -37 32 -88 0z m-1620 -402 c31 -81 34 -99 9 -60 -13 19 -33 48 -46 63 -13 16 -20 33 -17 38 13 21 37 2 54 -41z m767 -839 c-3 -58 -13 -150 -23 -204 -16 -89 -20 -100 -43 -109 -14 -5 -37 -19 -50 -31 l-24 -22 7 65 c16 147 61 332 96 388 34 55 43 32 37 -87z';

const POSE_FULL =
  'M628 2237 c-13 -12 -36 -53 -51 -90 -15 -37 -39 -87 -54 -110 -15 -23 -43 -79 -64 -125 -20 -46 -46 -92 -57 -102 -24 -22 -41 -100 -82 -366 -11 -73 -74 -401 -140 -729 -66 -328 -118 -601 -115 -606 16 -25 43 -28 68 -9 31 25 37 25 37 1 0 -26 24 -43 57 -39 21 2 33 12 45 38 18 37 70 299 72 365 1 36 -1 40 -23 39 l-24 -1 6 111 c8 129 33 303 79 536 l33 165 5 -97 c4 -84 8 -100 29 -122 48 -51 112 -23 163 71 33 60 110 265 134 356 41 154 44 50 9 -311 -18 -174 -25 -302 -23 -397 3 -137 4 -140 26 -143 27 -4 27 -6 8 -172 -8 -69 -17 -173 -20 -232 -5 -117 2 -136 47 -124 26 6 57 70 57 118 0 14 14 120 31 234 35 231 34 188 27 974 -3 380 -5 422 -24 495 -12 47 -19 98 -17 125 4 43 2 47 -36 78 -30 24 -50 32 -80 32 -34 0 -41 3 -41 20 0 18 -26 40 -48 40 -5 0 -20 -10 -34 -23z m80 -471 c16 -17 -79 -326 -140 -458 -39 -84 -43 -89 -48 -62 -8 41 7 253 24 347 14 70 20 84 63 132 37 42 53 53 72 50 13 -2 26 -7 29 -9z';

const COUNT = 5;

/* Anchor of the flock's sky patch, as fractions of the card. The tree sits
   at ~0.38 of the width, so this is up and to its right. */
const AX = 0.52;
const AY = 0.34;

export function Birds() {
  const ref = useRef<HTMLDivElement>(null);

  const specs = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        size: 27 + Math.random() * 20,
        flap: 760 + Math.random() * 380,
        delay: -Math.random() * 700,
      })),
    []
  );

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = Array.from(root.children) as HTMLElement[];

    const birds = els.map(() => ({
      x: AX * root.clientWidth + (Math.random() - 0.5) * 280,
      y: AY * root.clientHeight + (Math.random() - 0.5) * 200,
      vx: (Math.random() - 0.5) * 60,
      vy: (Math.random() - 0.5) * 60,
      // Each bird trails its own slowly-drifting offset from the flock
      // target, so no two follow the same path.
      ox: (Math.random() - 0.5) * 160,
      oy: (Math.random() - 0.5) * 120,
      // Slot on the flock's fan: when the pulse relaxes, each bird drifts
      // out along its own slowly-turning bearing.
      th: Math.random() * Math.PI * 2,
      thRate: (Math.random() - 0.5) * 0.4,
    }));

    const place = () =>
      birds.forEach((b, i) => {
        els[i].style.transform =
          `translate(-50%, -50%) translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px)`;
      });
    place();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Flock clock, for the gather/spread pulse.
    let t = 0;

    // Lorenz state, started on the attractor.
    let lx = 1.2;
    let ly = 1.5;
    let lz = 24;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;

      // The flock breathes: g drifts between 0 (scattered, weak pull, big
      // personal wander) and 1 (gathered, tight). Two incommensurate sines
      // keep the rhythm from reading as a metronome.
      const g =
        0.5 + 0.5 * Math.sin((t * 2 * Math.PI) / 26 + 0.9 * Math.sin((t * 2 * Math.PI) / 71));
      const w = root.clientWidth;
      const h = root.clientHeight;

      // Two substeps keep the integration stable at display rate.
      const ldt = (dt * 0.35) / 2;
      for (let s = 0; s < 2; s++) {
        const dx = 10 * (ly - lx);
        const dy = lx * (28 - lz) - ly;
        const dz = lx * ly - (8 / 3) * lz;
        lx += dx * ldt;
        ly += dy * ldt;
        lz += dz * ldt;
      }
      const tx = AX * w + lx * 4.5;
      const ty = AY * h - (lz - 25) * 3.0;

      for (let i = 0; i < birds.length; i++) {
        const b = birds[i];
        // Wander the personal offset (mean-reverting random walk, ~±100px).
        b.ox += (-b.ox * 0.12 + (Math.random() - 0.5) * 150) * dt;
        b.oy += (-b.oy * 0.12 + (Math.random() - 0.5) * 120) * dt;

        // Fan out on the relaxed half of the pulse, regroup on the tight half.
        b.th += b.thRate * dt;
        const R = 26 + (1 - g) * 150;
        const hx = tx + Math.cos(b.th) * R * 1.25 + b.ox;
        const hy = ty + Math.sin(b.th) * R * 0.65 + b.oy;

        const pull = 0.18 + g * 0.45;
        let ax = (hx - b.x) * pull;
        let ay = (hy - b.y) * pull;

        let nvx = 0;
        let nvy = 0;
        let n = 0;
        for (let j = 0; j < birds.length; j++) {
          if (j === i) continue;
          const o = birds[j];
          const sx = b.x - o.x;
          const sy = b.y - o.y;
          const d = Math.hypot(sx, sy) || 1;
          if (d < 34) {
            const push = ((34 - d) / d) * 16;
            ax += sx * push;
            ay += sy * push;
          }
          if (d < 80) {
            nvx += o.vx;
            nvy += o.vy;
            n++;
          }
        }
        if (n) {
          ax += (nvx / n - b.vx) * 0.6;
          ay += (nvy / n - b.vy) * 0.6;
        }
        ax += (Math.random() - 0.5) * 90;
        ay += (Math.random() - 0.5) * 90;

        b.vx += ax * dt;
        b.vy += ay * dt;
        const sp = Math.hypot(b.vx, b.vy) || 1;
        const cl = Math.min(62, Math.max(10, sp));
        b.vx = (b.vx / sp) * cl;
        b.vy = (b.vy / sp) * cl;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }
      place();
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="birds" aria-hidden="true" ref={ref}>
      {specs.map((s, i) => (
        <span
          key={i}
          className="bird"
          style={{
            width: `${s.size.toFixed(1)}px`,
            ["--flap" as string]: `${s.flap.toFixed(0)}ms`,
            ["--flap-delay" as string]: `${s.delay.toFixed(0)}ms`,
          }}
        >
        <svg key="down" className="pose pose-down" viewBox="0 0 340 240">
          <g transform="translate(9.5,240) scale(0.1,-0.1)" fill="currentColor" stroke="currentColor" strokeWidth={170} strokeLinejoin="round" strokeLinecap="round">
            <path d={POSE_DOWN} />
          </g>
        </svg>
        <svg key="flat" className="pose pose-flat" viewBox="0 0 340 240">
          <g transform="translate(38.5,240) scale(0.1,-0.1)" fill="currentColor" stroke="currentColor" strokeWidth={170} strokeLinejoin="round" strokeLinecap="round">
            <path d={POSE_FLAT} />
          </g>
        </svg>
        <svg key="up" className="pose pose-up" viewBox="0 0 340 240">
          <g transform="translate(70.5,240) scale(0.1,-0.1)" fill="currentColor" stroke="currentColor" strokeWidth={170} strokeLinejoin="round" strokeLinecap="round">
            <path d={POSE_UP} />
          </g>
        </svg>
        <svg key="full" className="pose pose-full" viewBox="0 0 340 240">
          <g transform="translate(121.0,240) scale(0.1,-0.1)" fill="currentColor" stroke="currentColor" strokeWidth={170} strokeLinejoin="round" strokeLinecap="round">
            <path d={POSE_FULL} />
          </g>
        </svg>
        </span>
      ))}
    </div>
  );
}
