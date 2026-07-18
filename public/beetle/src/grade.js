// Grade — one colour defines a whole look. A grade is just a hue+chroma
// swatch; everything else derives from it, two ways (composable):
//   wash  — a post grade in the composite: hues pulled toward the swatch, the
//           frame gelled and darkened by it. Bloom passes through at reduced
//           strength so glints keep their own colour under the grade.
//   light — the swatch becomes the *illuminant*: a smooth spectrum with that
//           chromaticity feeds the LUT bake, so the interference physics
//           itself answers to the grade colour — peaks ignite and die as the
//           light sweeps, which no post tint can fake.
// `cycle (s)` orbits the hue automatically; 0 pins it to the hue slider.

const gauss = (x, mu, s) => Math.exp(-0.5 * ((x - mu) / s) ** 2);

// hue (deg) + chroma (0..1) -> rgb swatch, desaturated toward white
export function swatch(hueDeg, chroma) {
  const h = (((hueDeg % 360) + 360) % 360) / 60;
  const x = 1 - Math.abs((h % 2) - 1);
  const rgb =
    h < 1 ? [1, x, 0] : h < 2 ? [x, 1, 0] : h < 3 ? [0, 1, x] :
    h < 4 ? [0, x, 1] : h < 5 ? [x, 0, 1] : [1, 0, x];
  return rgb.map((v) => 1 - chroma * (1 - v));
}

// The swatch as a light source: a broad three-gaussian spectrum weighted by
// the swatch's RGB over a small white floor, blended from flat white by amt.
// 30 samples over 400..700nm — the exact grid the LUT integrates with.
function illuminant(tint, amt) {
  const spd = new Float32Array(30);
  for (let i = 0; i < 30; i++) {
    const l = 400 + ((i + 0.5) / 30) * 300;
    const colored = 0.06 +
      tint[0] * gauss(l, 610, 45) +
      tint[1] * gauss(l, 550, 40) +
      tint[2] * gauss(l, 465, 35);
    spd[i] = 1 + amt * (colored - 1);
  }
  return spd;
}

// Everything the render passes need this frame, derived from panel values.
// `key` is the LUT-rebake signature: hue quantised to 0.25° so an orbiting
// grade rebakes the (tiny) LUT ~24×/s instead of every frame, and a pinned
// grade never rebakes at all.
export function gradeState(get, t) {
  const mode = get('gradeMode');
  const amt = mode ? get('gradeAmt') : 0;
  const cyc = get('gradeCycle');
  let hue = get('gradeHue');
  if (mode && cyc > 0) hue = (hue + (t / cyc) * 360) % 360;
  const tint = swatch(hue, get('gradeChroma'));
  const washAmt = mode === 1 || mode === 3 ? amt : 0;
  const lightAmt = mode === 2 || mode === 3 ? amt : 0;
  // pigment isn't spectral; it sits under the same lamp as a plain rgb tint
  const illumRGB = tint.map((v) => 1 + lightAmt * (v - 1));
  const key = lightAmt > 0
    ? `${Math.round(hue * 4)},${Math.round(lightAmt * 100)},${Math.round(get('gradeChroma') * 100)}`
    : 'flat';
  return { washAmt, lightAmt, tint, illum: illuminant(tint, lightAmt), illumRGB, key };
}
