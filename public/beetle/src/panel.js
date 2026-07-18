// A hand-built control panel in the Leva idiom: collapsible folders, rows of
// label / drag-track / numeric field, toggles and selects. Vanilla so the whole
// thing opens from a static server with no build step. Emits change events by
// mutating the schema's `.value` and calling onChange.

// A curated set of coherent specimens. Uniform-random-per-knob rolls land in
// muddy, incoherent spots — so instead we keep a handful of known-good basins in
// the physics, each chosen to show a *different* facet of the instrument and to
// exercise the dispersion / absorbing-substrate knobs. A roll picks one and
// jitters it a little, so every roll reads as an intentional specimen, not noise.
// Only physics + pigment + light + colour are set; the look-defining knobs
// (pixel, dither, CRT, bloom, smoke, zoom, Comfort) are left exactly as you have
// them, so a roll restyles the beetle without changing the toy.
// Curated specimens. Every roll keeps the house look — high vivid (full stack),
// mid depth (an absorbing backing), high glow (gamut pushed) — and varies the
// HUE and character instead: thickness/indices set the colour family,
// dispersion and pigment set the mood. So a roll is always lovely, never a
// black-out or a washed pastel; it just becomes a different beetle.
const SPECIMENS = [
  // blue morpho
  { thickA:112, thickB:74,  indexA:1.56, indexB:1.0, indexSub:1.9, layers:12, dispersion:0.30, absorption:0.45, gamut:1.90, pigAmt:0.12, pigScale:0.9, pigContrast:0.42, lightEl:0.90 },
  // gold scarab
  { thickA:72,  thickB:110, indexA:2.20, indexB:1.15,indexSub:2.4, layers:12, dispersion:0.30, absorption:0.45, gamut:1.90, pigAmt:0.18, pigScale:0.9, pigContrast:0.45, lightEl:1.00 },
  // violet
  { thickA:78,  thickB:118, indexA:1.70, indexB:1.0, indexSub:1.6, layers:11, dispersion:0.30, absorption:0.42, gamut:1.95, pigAmt:0.30, pigScale:0.8, pigContrast:0.42, lightEl:0.85 },
  // red-purple ember
  { thickA:66,  thickB:95,  indexA:2.00, indexB:1.4, indexSub:1.7, layers:11, dispersion:0.20, absorption:0.45, gamut:1.90, pigAmt:0.35, pigScale:1.4, pigContrast:0.45, lightEl:0.70 },
  // green-teal
  { thickA:130, thickB:100, indexA:1.80, indexB:1.1, indexSub:2.0, layers:12, dispersion:0.32, absorption:0.45, gamut:1.85, pigAmt:0.12, pigScale:1.0, pigContrast:0.42, lightEl:0.80 },
  // cyan-violet, gentle dispersion (kept low so it stays saturated, not pastel)
  { thickA:150, thickB:130, indexA:1.60, indexB:1.1, indexSub:1.8, layers:11, dispersion:0.35, absorption:0.42, gamut:1.90, pigAmt:0.12, pigScale:1.0, pigContrast:0.42, lightEl:0.65 },
];

// Roll a specimen: pick a curated archetype (never the same twice running),
// then jitter each knob within a small fraction of its range so a roll stays in
// the good basin but is never identical. Light azimuth is always fully fresh —
// the safe knob that sweeps hue on its own. Sets the control objects directly,
// so it works whether or not any panel is on screen.
let lastRoll = -1;
export function rollSpecimen(schema, onChange) {
  let idx = Math.floor(Math.random() * SPECIMENS.length);
  if (idx === lastRoll) idx = (idx + 1) % SPECIMENS.length;
  lastRoll = idx;
  const spec = SPECIMENS[idx];
  for (const folder of schema) for (const c of folder.controls) {
    let target;
    if (c.key in spec) target = spec[c.key];
    else if (c.key === 'lightAz') target = c.min + Math.random() * (c.max - c.min);
    else continue;
    const span = c.max - c.min;
    const jitter = c.key === 'lightAz' ? 0 : (Math.random() - 0.5) * 0.12 * span;
    let v = target + jitter;
    v = Math.round(v / c.step) * c.step;
    v = Math.min(c.max, Math.max(c.min, v));
    c.value = c.step < 1 ? +v.toFixed(4) : v;
    if (onChange) onChange(c.key, c.value);
  }
}

// The full tuning panel (?full and the 3D viewer). The shipping 2D experience
// has no panel at all — just the title-bar roll button — so main.js only calls
// this when full is requested.
export function buildPanel(root, schema, presets, { onChange, onPreset }) {
  root.innerHTML = '';

  const tabs = el('div', 'tabs');
  tab(tabs, 'Controls', true);
  const disk = el('div', 'disk', 'roll');
  disk.title = 'randomise — roll a new specimen';
  tabs.appendChild(disk);
  root.appendChild(tabs);

  const controlsPane = el('div', 'pane');
  root.append(controlsPane);
  const perfPane = el('div', 'pane hidden');

  const refreshers = [];
  const addRow = (parent, c, labelText) => {
    const row = el('div', 'row');
    row.appendChild(el('div', 'label', labelText));
    const refresh = makeControl(row, c, () => onChange(c.key, c.value));
    if (refresh) refreshers.push(refresh);
    parent.appendChild(row);
  };

  for (const folder of schema) {
    const head = el('div', 'folder');
    const tri = el('span', 'tri', folder.open ? '▾' : '▸');
    head.append(tri, document.createTextNode(' ' + folder.name));
    controlsPane.appendChild(head);

    const body = el('div', 'folder-body');
    if (!folder.open) body.classList.add('collapsed');
    controlsPane.appendChild(body);

    head.onclick = () => {
      const collapsed = body.classList.toggle('collapsed');
      tri.textContent = collapsed ? '▸' : '▾';
    };

    for (const c of folder.controls) addRow(body, c, c.label);
  }

  disk.onclick = () => { rollSpecimen(schema, onChange); refreshers.forEach((r) => r()); };

  return { perfPane, refresh: () => refreshers.forEach((r) => r()) };
}

function makeControl(row, c, emit) {
  if (c.type === 'slider') return slider(row, c, emit);
  if (c.type === 'toggle') return toggle(row, c, emit);
  if (c.type === 'select') return select(row, c, emit);
  return null;
}

function slider(row, c, emit) {
  const track = el('div', 'track');
  const fill = el('div', 'fill');
  const knob = el('div', 'knob');
  track.append(fill, knob);
  const field = el('input', 'field');
  field.type = 'text';
  row.append(track, field);

  const frac = () => (c.value - c.min) / (c.max - c.min);
  const paint = () => {
    const f = Math.min(1, Math.max(0, frac()));
    fill.style.width = f * 100 + '%';
    knob.style.left = f * 100 + '%';
    field.value = c.step < 1 ? c.value.toFixed(2) : String(Math.round(c.value));
  };
  paint();

  const setFromX = (clientX) => {
    const r = track.getBoundingClientRect();
    let f = (clientX - r.left) / r.width;
    f = Math.min(1, Math.max(0, f));
    let v = c.min + f * (c.max - c.min);
    v = Math.round(v / c.step) * c.step;
    v = Math.min(c.max, Math.max(c.min, v));
    if (v !== c.value) { c.value = c.step < 1 ? +v.toFixed(4) : v; paint(); emit(); }
  };

  let dragging = false;
  const down = (e) => { dragging = true; track.setPointerCapture?.(e.pointerId); setFromX(e.clientX); };
  const move = (e) => { if (dragging) setFromX(e.clientX); };
  const up = () => { dragging = false; };
  track.addEventListener('pointerdown', down);
  track.addEventListener('pointermove', move);
  track.addEventListener('pointerup', up);
  track.addEventListener('pointercancel', up);

  field.addEventListener('change', () => {
    let v = parseFloat(field.value);
    if (!isNaN(v)) { v = Math.min(c.max, Math.max(c.min, v)); c.value = v; paint(); emit(); }
    else paint();
  });

  return paint;
}

function toggle(row, c, emit) {
  const box = el('div', 'toggle');
  const paint = () => box.classList.toggle('on', !!c.value);
  paint();
  box.onclick = () => { c.value = !c.value; paint(); emit(); };
  row.appendChild(box);
  return paint;
}

function select(row, c, emit) {
  const sel = el('div', 'select');
  const paint = () => {
    const opt = c.options.find((o) => o[1] === c.value) || c.options[0];
    sel.textContent = opt[0] + '  ▾';
  };
  paint();
  sel.onclick = () => {
    const i = c.options.findIndex((o) => o[1] === c.value);
    c.value = c.options[(i + 1) % c.options.length][1];
    paint(); emit();
  };
  row.appendChild(sel);
  return paint;
}

// --- tiny dom helpers ---
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function tab(parent, name, active) {
  const t = el('div', 'tab' + (active ? ' active' : ''), name);
  parent.appendChild(t);
  return t;
}
