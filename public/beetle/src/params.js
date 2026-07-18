// The single source of truth for every knob. The panel builds itself from this
// schema and writes back into `.value`; main.js reads `.value` each frame and
// maps it onto uniforms. Adding a control is a one-line edit here.

export const SCHEMA = [
  {
    name: 'Comfort',
    open: true,
    controls: [
      // Photosensitivity guard. `calm` doesn't overwrite any slider — main.js
      // reads it each frame and softens the flashing-risk uniforms (animated
      // dither → static, crawl/drift/warp capped, scanlines off, bloom spikes
      // clamped), so toggling it back to `full` restores your exact settings.
      // Defaults to `calm` automatically when the OS asks for reduced motion.
      { key: 'calm', label: 'motion', type: 'select', value: 0,
        options: [['full', 0], ['calm', 1]] },
    ],
  },
  {
    name: 'Field',
    open: true,
    controls: [
      { key: 'wingSize', label: 'zoom', type: 'slider', value: 0.5, min: 0.5, max: 2.5, step: 0.01 },
      { key: 'scaleDensity', label: 'grain', type: 'slider', value: 0.77, min: 0.0, max: 1.0, step: 0.01 },
      { key: 'flow', label: 'crawl speed', type: 'slider', value: 0.0, min: 0.0, max: 2.0, step: 0.01 },
      { key: 'disorder', label: 'chaos', type: 'slider', value: 0.0, min: 0.0, max: 1.0, step: 0.01 },
    ],
  },
  {
    name: 'Smoke',
    open: true,
    controls: [
      { key: 'smokeWarp', label: 'drag', type: 'slider', value: 1.11, min: 0.0, max: 1.5, step: 0.01 },
      { key: 'smokeCarry', label: 'smoke', type: 'slider', value: 0.9, min: 0.0, max: 1.0, step: 0.01 },
      { key: 'smokePush', label: 'force', type: 'slider', value: 1.9, min: 0.0, max: 5.0, step: 0.01 },
      { key: 'smokeSwirl', label: 'swirl', type: 'slider', value: 0.62, min: 0.0, max: 1.0, step: 0.01 },
      { key: 'smokeBuoy', label: 'buoyancy', type: 'slider', value: 0.87, min: 0.0, max: 2.0, step: 0.01 },
      { key: 'smokeAmbient', label: 'ambient', type: 'slider', value: 0.58, min: 0.0, max: 1.0, step: 0.01 },
      { key: 'smokeLinger', label: 'linger', type: 'slider', value: 0.97, min: 0.9, max: 0.999, step: 0.001 },
      { key: 'smokeRadius', label: 'brush', type: 'slider', value: 0.04, min: 0.02, max: 0.3, step: 0.005 },
    ],
  },
  {
    name: 'Nanostructure',
    open: false,
    controls: [
      { key: 'thickA', label: 'layer A  nm', type: 'slider', value: 238, min: 40, max: 260, step: 1 },
      { key: 'thickB', label: 'layer B  nm', type: 'slider', value: 116, min: 40, max: 300, step: 1 },
      { key: 'indexA', label: 'index A', type: 'slider', value: 1.51, min: 1.0, max: 2.6, step: 0.01 },
      { key: 'indexB', label: 'index B', type: 'slider', value: 1.15, min: 1.0, max: 2.6, step: 0.01 },
      { key: 'indexSub', label: 'substrate n', type: 'slider', value: 2.6, min: 1.0, max: 2.6, step: 0.01 },
      { key: 'layers', label: 'bilayers', type: 'slider', value: 12, min: 1, max: 12, step: 1 },
      { key: 'dispersion', label: 'dispersion', type: 'slider', value: 0.0, min: 0.0, max: 1.0, step: 0.01 },
      { key: 'absorption', label: 'absorption', type: 'slider', value: 0.45, min: 0.0, max: 1.0, step: 0.01 },
    ],
  },
  {
    name: 'Pigment',
    open: true,
    controls: [
      { key: 'pigAmt', label: 'amount', type: 'slider', value: 0.12, min: 0.0, max: 3.0, step: 0.01 },
      { key: 'pigScale', label: 'scale', type: 'slider', value: 0.86, min: 0.3, max: 3.0, step: 0.01 },
      { key: 'pigContrast', label: 'contrast', type: 'slider', value: 0.56, min: 0.0, max: 1.0, step: 0.01 },
    ],
  },
  {
    name: 'Light',
    open: true,
    controls: [
      { key: 'lightAz', label: 'azimuth', type: 'slider', value: 0.81, min: -3.14, max: 3.14, step: 0.01 },
      { key: 'lightEl', label: 'elevation', type: 'slider', value: 0.86, min: 0.0, max: 1.5, step: 0.01 },
      { key: 'lightInt', label: 'intensity', type: 'slider', value: 1.4, min: 0.2, max: 6.0, step: 0.01 },
      { key: 'drift', label: 'auto drift', type: 'slider', value: 1.0, min: 0.0, max: 1.0, step: 0.01 },
    ],
  },
  {
    name: 'Grade',
    open: true,
    controls: [
      { key: 'gradeMode', label: 'mode', type: 'select', value: 0,
        options: [['off', 0], ['wash', 1], ['light', 2], ['both', 3]] },
      { key: 'gradeAmt', label: 'amount', type: 'slider', value: 0.75, min: 0.0, max: 1.0, step: 0.01 },
      { key: 'gradeHue', label: 'hue', type: 'slider', value: 210, min: 0, max: 360, step: 1 },
      { key: 'gradeChroma', label: 'chroma', type: 'slider', value: 0.75, min: 0.0, max: 1.0, step: 0.01 },
      { key: 'gradeCycle', label: 'cycle (s)', type: 'slider', value: 0, min: 0, max: 180, step: 1 },
    ],
  },
  {
    name: 'Colour',
    open: false,
    controls: [
      { key: 'baseGlow', label: 'field glow', type: 'slider', value: 0.61, min: 0.0, max: 2.0, step: 0.01 },
      { key: 'exposure', label: 'exposure', type: 'slider', value: 2.75, min: 0.2, max: 5.0, step: 0.01 },
      { key: 'saturation', label: 'saturation', type: 'slider', value: 2.5, min: 0.0, max: 2.5, step: 0.01 },
      { key: 'gamut', label: 'gamut push', type: 'slider', value: 1.9, min: 1.0, max: 3.0, step: 0.01 },
    ],
  },
  {
    name: 'Bloom',
    open: false,
    controls: [
      { key: 'bloomStrength', label: 'strength', type: 'slider', value: 3.0, min: 0.0, max: 3.0, step: 0.01 },
      { key: 'bloomThreshold', label: 'threshold', type: 'slider', value: 2.0, min: 0.0, max: 2.0, step: 0.01 },
    ],
  },
  {
    name: 'Retro',
    open: false,
    controls: [
      { key: 'dither', label: 'dither', type: 'select', value: 2,
        options: [['off', 0], ['bayer', 1], ['ign', 2], ['noise', 3]] },
      { key: 'levels', label: 'colour levels', type: 'slider', value: 4, min: 2, max: 255, step: 1 },
      { key: 'pixel', label: 'pixel size', type: 'slider', value: 3, min: 1, max: 8, step: 1 },
      { key: 'crt', label: 'scanlines', type: 'slider', value: 0.29, min: 0.0, max: 0.6, step: 0.01 },
      { key: 'vignette', label: 'vignette', type: 'slider', value: 0.65, min: 0.0, max: 1.0, step: 0.01 },
    ],
  },
];

// Presets teach by example: each is a legible physical story.
export const PRESETS = {
  'Bleed': {
    wingSize: 0.5, scaleDensity: 0.77, flow: 0.0, disorder: 0.0,
    thickA: 238, thickB: 116, indexA: 1.51, indexB: 1.15, indexSub: 2.6, layers: 12,
    baseGlow: 0.61, exposure: 2.75, saturation: 2.5, gamut: 1.47,
    pigAmt: 0.12, pigScale: 0.86, pigContrast: 0.56, smokeWarp: 1.5,
    smokePush: 2.67, smokeSwirl: 0.35, smokeBuoy: 0.6, smokeAmbient: 0.25,
    smokeLinger: 0.999, smokeRadius: 0.02,
    lightAz: 0.81, lightEl: 0.86, lightInt: 1.4, drift: 1.0,
    bloomStrength: 3.0, bloomThreshold: 2.0, dither: 2, levels: 4,
    pixel: 3, crt: 0.29, vignette: 0.65,
  },
  'Ember': {
    wingSize: 1.1, scaleDensity: 0.65, flow: 0.7, disorder: 0.5,
    thickA: 66, thickB: 95, indexA: 2.0, indexB: 1.4, indexSub: 1.7, layers: 10,
    baseGlow: 0.45, exposure: 1.3, saturation: 1.5, gamut: 1.7,
    pigAmt: 1.7, pigScale: 1.4, pigContrast: 0.65,
    lightInt: 1.7, bloomStrength: 1.4, bloomThreshold: 0.5, dither: 2, levels: 255,
  },
  'Amethyst': {
    wingSize: 0.9, scaleDensity: 0.45, flow: 0.35, disorder: 0.28,
    thickA: 78, thickB: 118, indexA: 1.7, indexB: 1.0, indexSub: 1.56, layers: 11,
    baseGlow: 0.7, exposure: 1.25, saturation: 1.6, gamut: 1.8,
    pigAmt: 1.5, pigScale: 0.8, pigContrast: 0.4,
    lightInt: 1.6, bloomStrength: 1.2, bloomThreshold: 0.55, dither: 1, levels: 255,
  },
  'Swarm': {
    wingSize: 1.3, scaleDensity: 0.8, flow: 1.2, disorder: 0.7,
    thickA: 75, thickB: 115, indexA: 1.56, indexB: 1.0, indexSub: 1.56, layers: 8,
    baseGlow: 0.5, exposure: 1.2, saturation: 1.45, gamut: 1.6,
    pigAmt: 1.2, pigScale: 1.8, pigContrast: 0.6,
    lightInt: 1.7, bloomStrength: 1.2, bloomThreshold: 0.5, dither: 2, levels: 255,
  },
  'DOS bleed': {
    wingSize: 1.0, scaleDensity: 0.5, flow: 0.5, disorder: 0.4,
    thickA: 78, thickB: 118, indexA: 1.7, indexB: 1.0, indexSub: 1.56, layers: 11,
    baseGlow: 0.6, exposure: 1.4, saturation: 1.6, gamut: 1.7,
    pigAmt: 1.5, pigScale: 1.1, pigContrast: 0.55,
    lightInt: 1.6, bloomStrength: 1.1, dither: 1, levels: 6, pixel: 3, crt: 0.35, vignette: 0.5,
  },
};

// Flatten the schema into { key: control } for quick reads/writes.
export function flatten(schema) {
  const map = {};
  for (const folder of schema) for (const c of folder.controls) map[c.key] = c;
  return map;
}
