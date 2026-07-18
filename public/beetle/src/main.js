import { initGL, program, makeTarget, resizeTarget, fullscreen, bindTex } from './gl.js';
import { VERT, LUT_FRAG, ADVECT_FRAG, DENSITY_FRAG, BUOY_FRAG, CURL_FRAG, VORT_FRAG, DIV_FRAG, PRESSURE_FRAG, GRADSUB_FRAG, DISPLACE_FRAG, SCENE_FRAG, ADVECTSCENE_FRAG, BRIGHT_FRAG, BLUR_FRAG, COMPOSITE_FRAG, UPSCALE_FRAG } from './shaders.js';
import { SCHEMA, PRESETS, flatten } from './params.js';
import { gradeState } from './grade.js';
import { buildPanel, rollSpecimen } from './panel.js';

const canvas = document.getElementById('view');
const gl = initGL(canvas);
const P = flatten(SCHEMA);
const get = (k) => P[k].value;

// Accessibility: if the OS asks for reduced motion, start in Calm mode. This
// only sets the default — the Comfort toggle can still switch to `full`.
if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  P.calm.value = 1;
}

// programs
const lut = program(gl, VERT, LUT_FRAG);
const advect = program(gl, VERT, ADVECT_FRAG);
const density = program(gl, VERT, DENSITY_FRAG);
const buoy = program(gl, VERT, BUOY_FRAG);
const curlP = program(gl, VERT, CURL_FRAG);
const vort = program(gl, VERT, VORT_FRAG);
const divg = program(gl, VERT, DIV_FRAG);
const pressure = program(gl, VERT, PRESSURE_FRAG);
const gradsub = program(gl, VERT, GRADSUB_FRAG);
const displace = program(gl, VERT, DISPLACE_FRAG);
const scene = program(gl, VERT, SCENE_FRAG);
const advscene = program(gl, VERT, ADVECTSCENE_FRAG);
const bright = program(gl, VERT, BRIGHT_FRAG);
const blur = program(gl, VERT, BLUR_FRAG);
const composite = program(gl, VERT, COMPOSITE_FRAG);
const upscale = program(gl, VERT, UPSCALE_FRAG);
const quad = fullscreen(gl);

// targets — everything renders at the LOW (chunky) resolution; only the final
// upscale runs at full device res. `low` holds the finished frame and uses
// NEAREST so the blow-up is crisp blocks, not a blur.
let hdr = makeTarget(gl, 2, 2);
// feedback pair — the carried (advected) appearance, ping-ponged frame to frame
let feedA = makeTarget(gl, 2, 2);
let feedB = makeTarget(gl, 2, 2);
let bloomA = makeTarget(gl, 2, 2);
let bloomB = makeTarget(gl, 2, 2);
let low = makeTarget(gl, 2, 2, gl.NEAREST);
// structural-colour lookup: angle (x) × thickness multiplier (y). Small and
// smooth, so a coarse grid with linear filtering is indistinguishable from the
// per-pixel physics — at a tiny fraction of the cost.
const lutTex = makeTarget(gl, 128, 64);
// smoke: a small stable-fluids sim (velocity + pressure) and the displacement
// field it stirs. All at a fixed coarse resolution — independent of the pixel
// knob, so the sim never gets wiped or expensive when chunkiness changes, and
// ~25 passes/frame stay trivial. LINEAR filtering hides the coarseness.
let velA = makeTarget(gl, 2, 2);
let velB = makeTarget(gl, 2, 2);
let denA = makeTarget(gl, 2, 2);
let denB = makeTarget(gl, 2, 2);
let curlT = makeTarget(gl, 2, 2);
let divT = makeTarget(gl, 2, 2);
let prsA = makeTarget(gl, 2, 2);
let prsB = makeTarget(gl, 2, 2);
let dispA = makeTarget(gl, 2, 2);
let dispB = makeTarget(gl, 2, 2);

// interaction — the pointer stirs the smoke. Track position (uv, y up) and the
// per-frame velocity so a drag injects a directional impulse.
const mouse = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, vx: 0, vy: 0, down: 0 };
let onTap = null;                 // set in the minimal build → a click rolls
let pressed = false, downX = 0, downY = 0, tapMoved = false;
function pointerAt(e) {
  const r = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) / r.width;
  mouse.y = 1 - (e.clientY - r.top) / r.height;
}
canvas.addEventListener('pointermove', (e) => {
  pointerAt(e);
  mouse.vx += mouse.x - mouse.px;
  mouse.vy += mouse.y - mouse.py;
  mouse.px = mouse.x; mouse.py = mouse.y;
  mouse.down = 1;               // any movement stirs; press just makes it stronger
  if (pressed && Math.hypot(e.clientX - downX, e.clientY - downY) > 6) tapMoved = true;
});
canvas.addEventListener('pointerdown', (e) => {
  pointerAt(e); mouse.px = mouse.x; mouse.py = mouse.y; mouse.down = 1;
  pressed = true; tapMoved = false; downX = e.clientX; downY = e.clientY;
});
canvas.addEventListener('pointerup', () => {
  if (pressed && !tapMoved && onTap) onTap();   // a click (not a drag) rolls
  pressed = false;
});
canvas.addEventListener('pointerleave', () => { mouse.down = 0; pressed = false; });

// The shipping experience is the specimen and one control: roll. No panel — the
// colour fills the window; the title-bar die (or ANY key) rolls a new specimen.
// ?full brings up the whole tuning panel instead.
const panelRoot = document.getElementById('panel');
const FULL = new URLSearchParams(location.search).has('full');
const roll = () => rollSpecimen(SCHEMA, () => {});

let perfPane;
if (FULL) {
  ({ perfPane } = buildPanel(panelRoot, SCHEMA, PRESETS, {
    onChange: () => {},
    onPreset: (preset) => { for (const k in preset) if (P[k]) P[k].value = preset[k]; },
  }));
} else {
  document.body.classList.add('minimal');
  perfPane = document.createElement('div');   // detached — perf rows draw here, unseen
  document.getElementById('roll')?.addEventListener('click', roll);
  onTap = roll;                                // a click on the canvas rolls too

  // intro card: dismiss on OK / click / any key
  const intro = document.getElementById('intro');
  const dismissIntro = () => { if (intro) intro.style.display = 'none'; };
  intro?.addEventListener('click', dismissIntro);

  // any key rolls (skip browser/OS shortcut combos so reload etc. still work)
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    e.preventDefault();
    dismissIntro();
    roll();
  });
}

// perf HUD lives in the Perf tab and mirrors into the bottom strip
const perf = setupPerf(perfPane);

let dpr = Math.min(window.devicePixelRatio || 1, 2);
// Full canvas size (device px) and the low render size (canvas / pixel). Every
// target except the final upscale lives at the low size, so the "pixel size"
// knob controls both chunkiness and how much work we do per frame.
function resize() {
  const r = canvas.getBoundingClientRect();
  const w = Math.max(2, Math.floor(r.width * dpr));
  const h = Math.max(2, Math.floor(r.height * dpr));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }

  const px = Math.max(1, get('pixel'));
  const lw = Math.max(2, Math.floor(w / px));
  const lh = Math.max(2, Math.floor(h / px));
  resizeTarget(gl, hdr, lw, lh);
  resizeTarget(gl, feedA, lw, lh);
  resizeTarget(gl, feedB, lw, lh);
  resizeTarget(gl, low, lw, lh);
  resizeTarget(gl, bloomA, lw >> 1, lh >> 1);
  resizeTarget(gl, bloomB, lw >> 1, lh >> 1);
  const ss = 288 / Math.max(w, h);
  const sw = Math.max(2, Math.round(w * ss));
  const sh = Math.max(2, Math.round(h * ss));
  for (const t of [velA, velB, denA, denB, curlT, divT, prsA, prsB, dispA, dispB]) resizeTarget(gl, t, sw, sh);
  return { w, h, lw, lh };
}
window.addEventListener('resize', resize);

const start = performance.now();
let last = start;
let lutDirty = null;   // last physics-param signature the LUT was baked for

function frame(now) {
  const cpu0 = performance.now();
  const { w, h, lw, lh } = resize();
  const t = (now - start) / 1000;

  // the grade: a swatch (possibly orbiting) that washes the composite and/or
  // becomes the illuminant the LUT physics is lit by
  const grade = gradeState(get, t);

  // Calm mode softens every flashing-risk knob without disturbing the sliders:
  // animated (IGN) dither → static Bayer, crawl/drift/stir-warp capped, CRT
  // scanlines off, bloom luminance spikes clamped. `full` passes them through.
  const calm = get('calm');
  const eFlow   = calm ? Math.min(get('flow'), 0.12)          : get('flow');
  const eDrift  = calm ? 0.0                                  : get('drift');
  const eWarp   = calm ? Math.min(get('smokeWarp'), 0.6)      : get('smokeWarp');
  const eCarry  = calm ? Math.min(get('smokeCarry'), 0.5)     : get('smokeCarry');
  const eDither = calm && get('dither') === 2 ? 1             : get('dither');
  const eCRT    = calm ? 0.0                                  : get('crt');
  const eBloom  = calm ? Math.min(get('bloomStrength'), 1.0)  : get('bloomStrength');

  // --- bake the structural-colour LUT, but only when the physics — or the
  // light it's lit by — actually changes. Most frames skip it; an orbiting
  // grade in light mode rebakes it at ~24Hz (it's tiny, this is cheap). ---
  const lutKey = [get('thickA'), get('thickB'), get('indexA'), get('indexB'),
                  get('indexSub'), get('layers'), get('dispersion'), get('absorption'),
                  grade.key].join(',');
  if (lutKey !== lutDirty) {
    lutDirty = lutKey;
    gl.useProgram(lut);
    gl.uniform1f(lut._u('uThickA'), get('thickA'));
    gl.uniform1f(lut._u('uThickB'), get('thickB'));
    gl.uniform1f(lut._u('uIndexA'), get('indexA'));
    gl.uniform1f(lut._u('uIndexB'), get('indexB'));
    gl.uniform1f(lut._u('uIndexSub'), get('indexSub'));
    gl.uniform1i(lut._u('uLayers'), get('layers'));
    gl.uniform1f(lut._u('uDispersion'), get('dispersion'));
    gl.uniform1f(lut._u('uAbsorb'), get('absorption'));
    gl.uniform1fv(lut._u('uIllum[0]'), grade.illum);
    quad.draw(lutTex);
  }

  // --- smoke: advect → density → buoyancy → vorticity → project (Jacobi),
  // then the displacement ---
  const tx = 1 / velA.w, ty = 1 / velA.h;

  gl.useProgram(advect);
  bindTex(gl, advect, 'uVel', velA.tex, 0);
  gl.uniform1f(advect._u('uAspect'), w / h);
  gl.uniform2f(advect._u('uMouse'), mouse.x, mouse.y);
  gl.uniform2f(advect._u('uMouseVel'), mouse.vx, mouse.vy);
  gl.uniform1f(advect._u('uRadius'), get('smokeRadius'));
  gl.uniform1f(advect._u('uForce'), get('smokePush'));
  gl.uniform1f(advect._u('uDown'), mouse.down);
  quad.draw(velB);
  { const tmp = velA; velA = velB; velB = tmp; }

  gl.useProgram(density);
  bindTex(gl, density, 'uDen', denA.tex, 0);
  bindTex(gl, density, 'uVel', velA.tex, 1);
  gl.uniform1f(density._u('uAspect'), w / h);
  gl.uniform2f(density._u('uMouse'), mouse.x, mouse.y);
  gl.uniform2f(density._u('uMouseVel'), mouse.vx, mouse.vy);
  gl.uniform1f(density._u('uRadius'), get('smokeRadius'));
  gl.uniform1f(density._u('uDown'), mouse.down);
  gl.uniform1f(density._u('uTime'), t);
  gl.uniform1f(density._u('uAmbient'), get('smokeAmbient'));
  quad.draw(denB);
  { const tmp = denA; denA = denB; denB = tmp; }

  gl.useProgram(buoy);
  bindTex(gl, buoy, 'uVel', velA.tex, 0);
  bindTex(gl, buoy, 'uDen', denA.tex, 1);
  gl.uniform1f(buoy._u('uBuoy'), get('smokeBuoy'));
  gl.uniform1f(buoy._u('uAmbient'), get('smokeAmbient'));
  gl.uniform1f(buoy._u('uTime'), t);
  quad.draw(velB);
  { const tmp = velA; velA = velB; velB = tmp; }

  gl.useProgram(curlP);
  bindTex(gl, curlP, 'uVel', velA.tex, 0);
  gl.uniform2f(curlP._u('uTexel'), tx, ty);
  quad.draw(curlT);

  gl.useProgram(vort);
  bindTex(gl, vort, 'uVel', velA.tex, 0);
  bindTex(gl, vort, 'uCurl', curlT.tex, 1);
  gl.uniform2f(vort._u('uTexel'), tx, ty);
  gl.uniform1f(vort._u('uSwirl'), get('smokeSwirl'));
  quad.draw(velB);
  { const tmp = velA; velA = velB; velB = tmp; }

  gl.useProgram(divg);
  bindTex(gl, divg, 'uVel', velA.tex, 0);
  gl.uniform2f(divg._u('uTexel'), tx, ty);
  quad.draw(divT);

  gl.useProgram(pressure);
  gl.uniform2f(pressure._u('uTexel'), tx, ty);
  for (let i = 0; i < 20; i++) {
    bindTex(gl, pressure, 'uPrs', prsA.tex, 0);
    bindTex(gl, pressure, 'uDiv', divT.tex, 1);
    quad.draw(prsB);
    const tmp = prsA; prsA = prsB; prsB = tmp;
  }

  gl.useProgram(gradsub);
  bindTex(gl, gradsub, 'uVel', velA.tex, 0);
  bindTex(gl, gradsub, 'uPrs', prsA.tex, 1);
  gl.uniform2f(gradsub._u('uTexel'), tx, ty);
  quad.draw(velB);
  { const tmp = velA; velA = velB; velB = tmp; }

  gl.useProgram(displace);
  bindTex(gl, displace, 'uDisp', dispA.tex, 0);
  bindTex(gl, displace, 'uVel', velA.tex, 1);
  gl.uniform1f(displace._u('uLinger'), get('smokeLinger'));
  quad.draw(dispB);
  { const tmp = dispA; dispA = dispB; dispB = tmp; }

  // bleed off the pointer impulse so a still cursor stops pushing
  mouse.vx *= 0.82; mouse.vy *= 0.82;
  mouse.down *= 0.9;

  // --- scene -> hdr ---
  gl.useProgram(scene);
  bindTex(gl, scene, 'uLUT', lutTex.tex, 0);
  bindTex(gl, scene, 'uDisp', dispA.tex, 1);
  gl.uniform1f(scene._u('uWarp'), eWarp);
  gl.uniform2f(scene._u('uRes'), lw, lh);
  gl.uniform1f(scene._u('uTime'), t);
  gl.uniform1f(scene._u('uWingSize'), get('wingSize'));
  gl.uniform1f(scene._u('uScaleDensity'), get('scaleDensity'));
  gl.uniform1f(scene._u('uFlow'), eFlow);
  gl.uniform1f(scene._u('uDisorder'), get('disorder'));
  gl.uniform1f(scene._u('uLightAz'), get('lightAz'));
  gl.uniform1f(scene._u('uLightEl'), get('lightEl'));
  gl.uniform1f(scene._u('uLightInt'), get('lightInt'));
  gl.uniform1f(scene._u('uDrift'), eDrift);
  gl.uniform1f(scene._u('uExposure'), get('exposure'));
  gl.uniform1f(scene._u('uSaturation'), get('saturation'));
  gl.uniform1f(scene._u('uGamut'), get('gamut'));
  gl.uniform1f(scene._u('uBaseGlow'), get('baseGlow'));
  gl.uniform1f(scene._u('uPigAmt'), get('pigAmt'));
  gl.uniform1f(scene._u('uPigScale'), get('pigScale'));
  gl.uniform1f(scene._u('uPigContrast'), get('pigContrast'));
  gl.uniform3fv(scene._u('uIllumRGB'), grade.illumRGB);
  quad.draw(hdr);

  // --- smoke advection: carry the appearance along the flow (dye in water) ---
  // feedA <- mix(fresh hdr, advected feedB, carry gated by smoke density)
  gl.useProgram(advscene);
  bindTex(gl, advscene, 'uFresh', hdr.tex, 0);
  bindTex(gl, advscene, 'uPrev', feedB.tex, 1);
  bindTex(gl, advscene, 'uVel', velA.tex, 2);
  bindTex(gl, advscene, 'uDen', denA.tex, 3);
  gl.uniform1f(advscene._u('uCarry'), eCarry);
  quad.draw(feedA);
  { const tmp = feedA; feedA = feedB; feedB = tmp; }
  // feedB now holds this frame's carried scene; bloom + composite read it
  const litScene = feedB;

  // --- bright pass -> bloomA (half res) ---
  gl.useProgram(bright);
  bindTex(gl, bright, 'uTex', litScene.tex, 0);
  gl.uniform1f(bright._u('uThreshold'), get('bloomThreshold'));
  quad.draw(bloomA);

  // --- separable blur, a few ping-pong passes ---
  const bw = bloomA.w, bh = bloomA.h;
  for (let i = 0; i < 3; i++) {
    gl.useProgram(blur);
    bindTex(gl, blur, 'uTex', bloomA.tex, 0);
    gl.uniform2f(blur._u('uDir'), 1 / bw, 0);
    quad.draw(bloomB);
    bindTex(gl, blur, 'uTex', bloomB.tex, 0);
    gl.uniform2f(blur._u('uDir'), 0, 1 / bh);
    quad.draw(bloomA);
  }

  // --- composite -> low (chunky res) ---
  gl.useProgram(composite);
  bindTex(gl, composite, 'uScene', litScene.tex, 0);
  bindTex(gl, composite, 'uBloom', bloomA.tex, 1);
  gl.uniform2f(composite._u('uRes'), lw, lh);
  gl.uniform1f(composite._u('uTime'), t);
  gl.uniform1f(composite._u('uBloomStrength'), eBloom);
  gl.uniform1i(composite._u('uDither'), eDither);
  gl.uniform1f(composite._u('uLevels'), get('levels'));
  gl.uniform1f(composite._u('uCRT'), eCRT);
  gl.uniform1f(composite._u('uVignette'), get('vignette'));
  gl.uniform3fv(composite._u('uGradeTint'), grade.tint);
  gl.uniform1f(composite._u('uGradeWash'), grade.washAmt);
  quad.draw(low);

  // --- upscale low -> screen with nearest sampling (crisp chunky pixels) ---
  gl.useProgram(upscale);
  bindTex(gl, upscale, 'uTex', low.tex, 0);
  quad.draw(null);

  const cpu = performance.now() - cpu0;
  perf.tick(now, cpu);
  // `?still` renders a single frame so headless capture of the full UI works
  if (!STILL) requestAnimationFrame(frame);
}
const STILL = new URLSearchParams(location.search).has('still');

function setupPerf(pane) {
  pane.innerHTML = '';
  const rows = {};
  const add = (label, color) => {
    const r = document.createElement('div');
    r.className = 'perf-row';
    const l = document.createElement('span'); l.className = 'perf-label'; l.textContent = label;
    const v = document.createElement('span'); v.className = 'perf-val';
    const cv = document.createElement('canvas'); cv.width = 120; cv.height = 22; cv.className = 'perf-graph';
    r.append(l, v, cv);
    pane.appendChild(r);
    rows[label] = { v, ctx: cv.getContext('2d'), color, hist: new Array(120).fill(0) };
    return rows[label];
  };
  add('FPS', '#39d0c8');
  add('frame ms', '#e0b055');
  add('cpu ms', '#c060d0');

  // bottom strip mirrors
  const fpsCell = document.getElementById('fps-cell');
  const strip = document.getElementById('perf-strip-graph').getContext('2d');
  const stripHist = new Array(240).fill(0);

  let frames = 0, acc = 0, lastT = performance.now(), fps = 0;
  function draw(row, val, max) {
    row.hist.push(val); row.hist.shift();
    row.v.textContent = val.toFixed(val < 10 ? 2 : 0);
    const ctx = row.ctx, W = 120, H = 22;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = row.color; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i < row.hist.length; i++) {
      const y = H - Math.min(1, row.hist[i] / max) * H;
      i ? ctx.lineTo(i, y) : ctx.moveTo(i, y);
    }
    ctx.stroke();
  }
  return {
    tick(now, cpu) {
      frames++; acc += now - lastT; lastT = now;
      const frameMs = now - lastT + (now - lastT === 0 ? 16 : 0);
      if (acc >= 250) { fps = (frames * 1000) / acc; frames = 0; acc = 0; }
      draw(rows['FPS'], fps || 0, 120);
      draw(rows['frame ms'], now - (draw._last || now), 40);
      draw._last = now;
      draw(rows['cpu ms'], cpu, 16);

      if (fpsCell) fpsCell.textContent = (fps || 0).toFixed(0) + ' FPS';
      stripHist.push(Math.min(1, cpu / 16)); stripHist.shift();
      strip.clearRect(0, 0, 240, 30);
      strip.strokeStyle = '#39d0c8'; strip.beginPath();
      for (let i = 0; i < stripHist.length; i++) {
        const y = 30 - stripHist[i] * 28;
        i ? strip.lineTo(i, y) : strip.moveTo(i, y);
      }
      strip.stroke();
    },
  };
}

resize();
requestAnimationFrame(frame);
