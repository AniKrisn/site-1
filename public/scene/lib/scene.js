// What a scene and its host agree on: a clock the host can take over, named values it can change, and pictures on request.
// A scene calls params() for its knobs, sections() for the parts of its loop and loop() to start; everything else here answers the host.

const host = parent !== window ? parent : null;
const say = (type, body) => host?.postMessage({ diorama: type, version: window.__version, ...body }, '*');
const errors = window.__errors ?? [];
const saved = window.__values ?? {};
const asked = new URLSearchParams(location.search);

const manifest = {}, values = {};

// A knob is written as [value, min, max, step?], a '#colour', true/false, or { value, min, max, step, group }
function knob(def) {
  if (Array.isArray(def)) return { type: 'number', value: def[0], min: def[1], max: def[2], step: def[3] };
  if (typeof def === 'number') return { type: 'number', value: def, min: Math.min(0, def * 2), max: Math.max(1, def * 2) };
  if (typeof def === 'boolean') return { type: 'toggle', value: def };
  if (typeof def === 'string') return { type: 'colour', value: def };
  return { type: typeof def.value === 'string' ? 'colour' : typeof def.value === 'boolean' ? 'toggle' : 'number', ...def };
}
const fits = (k, v) => k.type === 'number' ? typeof v === 'number' && isFinite(v) : k.type === 'toggle' ? typeof v === 'boolean' : typeof v === 'string';

// Returns one live object: read P.name every frame and the host's changes show up
export function params(defs) {
  for (const [name, def] of Object.entries(defs)) {
    const k = manifest[name] = knob(def);
    values[name] = fits(k, saved[name]) ? saved[name] : k.value;
  }
  return values;
}

// The loop as named sections end to end, each a length in seconds: live like params, but shown as blocks on the timeline.
// Hand the result to loop() and the loop is as long as the sections add up to.
export function sections(defs) {
  const names = Object.keys(defs);
  params(Object.fromEntries(names.map(name => [name, { value: defs[name], min: 0.1, max: 120, kind: 'section' }])));
  const start = name => { let at = 0; for (const n of names) { if (n === name) break; at += values[n]; } return at; };
  return {
    get length() { return names.reduce((sum, n) => sum + values[n], 0); },
    start,
    end: name => start(name) + values[name],
    // The time the scene was written in: each section plays at the speed it was written, holds on its last moment if it
    // has been made longer, and is cut off early if shorter. Nothing is ever sped up or slowed down.
    written(now) {
      const { name, t } = this.at(now);
      let from = 0;
      for (const n of names) { if (n === name) break; from += defs[n]; }
      return from + Math.min(t, defs[name] - 1e-4);
    },
    // How far round the real loop, from 0 to 1, for whatever should carry on through a hold
    round(now) { const whole = this.length; return (((now % whole) + whole) % whole) / whole; },
    // Which section a time falls in: its name, the seconds into it, and how far through it from 0 to 1
    at(now) {
      const whole = this.length;
      let t = ((now % whole) + whole) % whole;
      for (const name of names) { if (t < values[name]) return { name, t, u: t / values[name] }; t -= values[name]; }
      return { name: names.at(-1), t: values[names.at(-1)], u: 1 };
    },
  };
}

// What the scene is made of, for a host that wants to show it: its things and land, and which knobs belong to which
let made = null;
export function describe(parts) { made = parts; }

let draw = null, span = () => null, last = null, told = 0, started = false;
let now = Number(asked.get('t')) || 0, playing = !asked.has('paused');
const stage = () => document.querySelector('canvas');
const at = () => { const whole = span(); return whole ? ((now % whole) + whole) % whole : now; };
const render = dt => { try { draw(now, dt); } catch (e) { console.error(e?.stack ?? e); } };

function tick(ms) {
  const dt = last === null ? 0 : Math.min(Math.max(ms / 1000 - last, 0), 0.05);
  last = ms / 1000;
  if (playing) now += dt;
  if (playing || !started) render(dt);
  if (!started) {
    started = true;
    const s = stage();
    say('ready', { loop: span(), size: [s.width, s.height], params: manifest, values: { ...values }, made, errors: errors.slice(-6), t: at(), playing });
  } else if (playing && ms - told > 80) { told = ms; say('tick', { t: at(), playing, loop: span() }); }
  requestAnimationFrame(tick);
}

// frame(now, dt): now is seconds on the scene's clock, unwrapped; seconds is the loop's length, its sections, or null for a scene that does not loop
export function loop(seconds, frame) {
  span = seconds && typeof seconds === 'object' ? () => seconds.length : () => seconds || null;
  draw = frame;
  requestAnimationFrame(tick);
}

// A part of the picture as [left, top, right, bottom], each from 0 to 1, in whole pixels of the stage: [x, y, width, height]
function part(box) {
  const s = stage(), [l, t, r, b] = (box ?? [0, 0, 1, 1]).map(v => Math.min(Math.max(Number(v) || 0, 0), 1));
  const x = Math.min(Math.floor(l * s.width), s.width - 1), y = Math.min(Math.floor(t * s.height), s.height - 1);
  return [x, y, Math.max(1, Math.min(Math.ceil(r * s.width), s.width) - x), Math.max(1, Math.min(Math.ceil(b * s.height), s.height) - y)];
}
// A part shown close up is blown up further, to about this many pixels across, so a small thing fills the picture
const close = (box, scale, across) => box ? Math.max(scale, Math.min(16, Math.floor(across / part(box)[2]))) : scale;
// The stage as it is right now, or a part of it, blown up without blurring
function picture(scale, box) {
  const [x, y, w, h] = part(box), out = document.createElement('canvas');
  out.width = w * scale; out.height = h * scale;
  const g = out.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(stage(), x, y, w, h, 0, 0, out.width, out.height);
  return out;
}
// Visit other moments, then put the clock back where it was
function away(fn) {
  const keep = now;
  try { return fn(t => { now = t; render(0); }); } finally { now = keep; render(0); }
}

const ops = {
  seek({ t }) { now = t; render(0); say('tick', { t: at(), playing }); },
  play({ on }) { playing = !!on; last = null; say('tick', { t: at(), playing }); },
  set({ name, value }) {
    if (!manifest[name] || !fits(manifest[name], value)) return false;
    values[name] = value;
    if (!playing) render(0);
    say('tick', { t: at(), playing, loop: span() });   // a section's length changes the loop's
    return true;
  },
  shot({ t, scale = 4, box }) { return away(go => { go(t ?? now); return picture(close(box, scale, 880), box).toDataURL('image/png'); }); },
  // Evenly spaced frames in a grid, each stamped with its time
  film({ from = 0, to = span() ?? 4, frames = 8, scale = 2, box }) {
    return away(go => {
      scale = close(box, scale, 440);
      const [, , pw, ph] = part(box), w = pw * scale, h = ph * scale, across = Math.min(frames, 4), down = Math.ceil(frames / across);
      const sheet = document.createElement('canvas');
      sheet.width = across * w; sheet.height = down * (h + 14);
      const g = sheet.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, sheet.width, sheet.height);
      g.font = '11px ui-monospace, monospace'; g.fillStyle = '#000'; g.textBaseline = 'top';
      for (let i = 0; i < frames; i++) {
        const t = frames > 1 ? from + (to - from) * i / (frames - 1) : from, x = (i % across) * w, y = Math.floor(i / across) * (h + 14);
        go(t);
        g.drawImage(picture(scale, box), x, y + 14);
        g.fillText(t.toFixed(2) + 's', x + 3, y + 1);
      }
      return sheet.toDataURL('image/png');
    });
  },
  // The whole loop as frames side by side, each the moment at the middle of its share
  strip({ frames = 12 }) {
    const length = span();
    if (!length) return null;
    return away(go => {
      const s = stage(), sheet = document.createElement('canvas');
      sheet.width = s.width * frames; sheet.height = s.height;
      const g = sheet.getContext('2d');
      for (let i = 0; i < frames; i++) { go((i + 0.5) / frames * length); g.drawImage(s, i * s.width, 0); }
      return sheet.toDataURL('image/png');
    });
  },
  // How much of the picture differs between the first frame and the very end of the loop
  closes() {
    const length = span();
    if (!length) return null;
    return away(go => {
      const read = t => { go(t); const p = picture(1); return p.getContext('2d').getImageData(0, 0, p.width, p.height).data; };
      const a = read(0), b = read(length - 1e-5);
      let off = 0;
      for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) off++;
      return { differing: off / (a.length / 4) };
    });
  },
};

addEventListener('message', e => {
  const m = e.data;
  if (e.source !== host || m?.diorama !== 'call') return;
  let result, error;
  try { if (!draw) throw new Error('the scene never started'); result = ops[m.op](m.args ?? {}); } catch (err) { error = String(err?.message ?? err); }
  say('reply', { id: m.id, result, error, errors: errors.slice(-6) });
});
// The picture changes shape with its frame: draw it again if nothing else will, and tell the host its new size
let sized = '';
addEventListener('resize', () => {
  if (!draw) return;
  if (!playing) render(0);
  requestAnimationFrame(() => {
    const s = stage(), now = `${s.width}x${s.height}`;
    if (now === sized) return;
    sized = now;
    say('tick', { t: at(), playing, loop: span(), size: [s.width, s.height] });
  });
});
// Paused, the picture still has to answer to being dragged about: redraw once after the scene's own handlers have run
let owed = false;
const redraw = () => {
  if (!draw || playing || owed) return;
  owed = true;
  requestAnimationFrame(() => { owed = false; render(0); });
};
for (const type of ['pointerdown', 'pointermove', 'pointerup', 'wheel']) addEventListener(type, redraw, { passive: true });
// Keys pressed while the scene has the pointer still belong to the host
addEventListener('keydown', e => { if (e.key === 'Escape' || e.key === ' ') { e.preventDefault(); say('key', { key: e.key }); } });
addEventListener('dblclick', () => say('dblclick'));
