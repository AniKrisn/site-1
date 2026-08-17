import { STAR_POSES } from "./starPoses";

/* Six placements of the one hand-drawn star, strewn across the top of the
   card. Each flips through the four traced poses on its own clock -- the
   same frame-flip trick as the bird wingbeat. They belong to the night:
   dark mode brings them out a beat after the switch, each on a slightly
   different delay, and light mode sends them back the same way. */

const STARS = [
  { left: 30, top: 8, size: 19, twinkle: 1350, peek: 0 },
  { left: 43.5, top: 15, size: 14, twinkle: 1600, peek: 210 },
  { left: 56, top: 6, size: 23, twinkle: 1150, peek: 90 },
  { left: 69, top: 12.5, size: 16, twinkle: 1500, peek: 300 },
  { left: 80.5, top: 7, size: 20, twinkle: 1250, peek: 150 },
  { left: 90, top: 16, size: 14, twinkle: 1700, peek: 60 },
];

export function Stars() {
  return (
    <div className="stars" aria-hidden="true">
      {STARS.map((s, i) => (
        <span
          key={i}
          className="star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            ["--twinkle" as string]: `${s.twinkle}ms`,
            ["--twinkle-delay" as string]: `${-i * 430}ms`,
            ["--peek" as string]: `${s.peek}ms`,
          }}
        >
          {STAR_POSES.map((p, j) => (
            <svg
              key={j}
              className={`pose pose-${j}`}
              viewBox={`0 0 ${p.w} ${p.h}`}
            >
              <g
                transform={`translate(0,${p.h}) scale(0.1,-0.1)`}
                fill="currentColor"
                stroke="none"
              >
                <path d={p.d} />
              </g>
            </svg>
          ))}
        </span>
      ))}
    </div>
  );
}
