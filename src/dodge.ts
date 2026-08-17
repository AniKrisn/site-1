/* Words make way for the scene. Birds and the tree crown publish circular
   obstacles in viewport coordinates; post/nav text is split into word spans,
   measured once, and any word near an obstacle slides aside with a smoothed
   transform, easing back when the obstacle leaves. No relayout ever happens
   after the initial measure -- displacement is transform-only. */

export type Obstacle = { x: number; y: number; r: number; hard?: boolean };

const sources = new Map<string, Obstacle[]>();

export function setObstacles(key: string, obs: Obstacle[]) {
  sources.set(key, obs);
}

type Word = {
  el: HTMLElement;
  docX: number;
  docY: number;
  halfW: number;
  curX: number;
  curY: number;
  softX: number;
  softY: number;
  hardL: number;
  hardR: number;
};

let words: Word[] = [];
let lines: Word[][] = [];
let scroller: HTMLElement | null = null;
let raf = 0;
let measured: HTMLElement | null = null;

const INFLUENCE = 44;
const MAX_PUSH = 15;

function wrapWords(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if (!n.textContent || !n.textContent.trim()) continue;
    if ((n.parentElement as HTMLElement | null)?.closest(".dodge-word")) continue;
    texts.push(n as Text);
  }
  for (const t of texts) {
    const frag = document.createDocumentFragment();
    for (const tok of (t.textContent ?? "").split(/(\s+)/)) {
      if (!tok) continue;
      if (/\s/.test(tok)) {
        frag.appendChild(document.createTextNode(tok));
      } else {
        const span = document.createElement("span");
        span.className = "dodge-word";
        span.textContent = tok;
        frag.appendChild(span);
      }
    }
    t.parentNode?.replaceChild(frag, t);
  }
}

function measure() {
  if (!measured || !scroller) return;
  const st = scroller.scrollTop;
  words = Array.from(measured.querySelectorAll<HTMLElement>(".dodge-word")).map(
    (el) => {
      const r = el.getBoundingClientRect();
      return {
        el,
        docX: r.left + r.width / 2,
        docY: r.top + r.height / 2 + st,
        halfW: r.width / 2,
        curX: 0,
        curY: 0,
        softX: 0,
        softY: 0,
        hardL: 0,
        hardR: 0,
      };
    }
  );
  // Group into lines so hard pushes can propagate outward along a line.
  const sorted = [...words].sort((a, b) => a.docY - b.docY || a.docX - b.docX);
  lines = [];
  let cur: Word[] | null = null;
  let curY = -1e9;
  for (const w of sorted) {
    if (Math.abs(w.docY - curY) > 4) {
      cur = [];
      lines.push(cur);
      curY = w.docY;
    }
    cur!.push(w);
  }
}

function tick() {
  raf = requestAnimationFrame(tick);
  if (!scroller) return;
  const st = scroller.scrollTop;
  for (const w of words) {
    const wx = w.docX;
    const wy = w.docY - st;
    w.softX = 0;
    w.softY = 0;
    w.hardL = 0;
    w.hardR = 0;
    for (const obs of sources.values()) {
      for (const o of obs) {
        const dx = wx - o.x;
        const dy = wy - o.y;
        if (o.hard) {
          // Static obstacle: the word must fully clear its ink sideways.
          const reach = o.r + 12;
          if (Math.abs(dy) < reach) {
            const hw = Math.sqrt(reach * reach - dy * dy) + w.halfW;
            if (Math.abs(dx) < hw) {
              const need = Math.min(130, hw - Math.abs(dx));
              if (dx >= 0) w.hardR = Math.max(w.hardR, need);
              else w.hardL = Math.max(w.hardL, need);
            }
          }
        } else {
          const d = Math.hypot(dx, dy);
          const reach = o.r + INFLUENCE;
          if (d < reach && d > 0.001) {
            const s = Math.pow(1 - d / reach, 1.5) * MAX_PUSH;
            w.softX += (dx / d) * s;
            w.softY += (dy / d) * s * 0.45;
          }
        }
      }
    }
  }
  // Carry hard pushes outward along each line so displaced words shove their
  // neighbours along instead of landing on them.
  for (const line of lines) {
    let carry = 0;
    for (const w of line) {
      carry = Math.max(carry, w.hardR);
      w.hardR = carry;
    }
    carry = 0;
    for (let i = line.length - 1; i >= 0; i--) {
      carry = Math.max(carry, line[i].hardL);
      line[i].hardL = carry;
    }
  }
  for (const w of words) {
    const tx = w.softX + w.hardR - w.hardL;
    const ty = w.softY;
    w.curX += (tx - w.curX) * 0.14;
    w.curY += (ty - w.curY) * 0.14;
    const active = Math.abs(w.curX) > 0.05 || Math.abs(w.curY) > 0.05;
    if (active) {
      w.el.style.transform = `translate(${w.curX.toFixed(2)}px, ${w.curY.toFixed(2)}px)`;
    } else if (w.el.style.transform) {
      w.el.style.transform = "";
      w.curX = 0;
      w.curY = 0;
    }
  }
}

export function attachDodgeText(root: HTMLElement, scrollEl: HTMLElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.innerWidth < 1024) return;
  detachDodgeText();
  wrapWords(root);
  measured = root;
  scroller = scrollEl;
  measure();
  window.addEventListener("resize", measure);
  raf = requestAnimationFrame(tick);
}

export function detachDodgeText() {
  cancelAnimationFrame(raf);
  raf = 0;
  window.removeEventListener("resize", measure);
  words = [];
  measured = null;
  scroller = null;
}
