// All GLSL for the simulator lives here as ES-module string exports.
// Two ideas run through it:
//   1. Real structural-colour physics — multilayer thin-film reflectance via the
//      transfer-matrix method, integrated across the visible spectrum through
//      analytic CIE colour-matching functions. This is why the hues are the
//      genuine iridescent hues and not a hand-picked gradient.
//   2. A retro post chain — bloom, then ordered dithering + posterise + CRT —
//      the "dos-age" finish that also happens to be the truthful way to draw a
//      colour that is brighter and purer than a display can hold.

export const VERT = `#version 300 es
precision highp float;
// Full-screen triangle. No attributes; positions come from gl_VertexID.
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

// ---------------------------------------------------------------------------
// LUT pass — bake the transfer-matrix physics into a small
// (incidence-angle × thickness-multiplier) texture, ONCE per frame. This is the
// heavy loop (30 wavelengths × a 2×N complex matrix). Running it over a tiny
// grid and letting the full-screen scene sample it is the whole perf story.
// The x→angle and y→multiplier mapping MUST match SCENE_FRAG's structuralColor.
// ---------------------------------------------------------------------------
export const LUT_FRAG = `#version 300 es
precision highp float;
precision highp int;

in vec2 vUv;
out vec4 frag;

uniform float uThickA;
uniform float uThickB;
uniform float uIndexA;
uniform float uIndexB;
uniform float uIndexSub;
uniform int   uLayers;
uniform float uIllum[30];  // illuminant spectrum, on the same grid structuralColor samples
uniform float uDispersion; // 0 = non-dispersive; scales a Cauchy n(λ) term (blue bends more)
uniform float uAbsorb;     // extinction k on every medium (0 = lossless dielectric)

const float PI = 3.14159265359;
const float LUT_THETA_MAX = 1.5708;
const float LUT_MULT_LO   = 0.72;
const float LUT_MULT_HI   = 1.28;
// Cauchy dispersion. uDispersion=1 gives Δn≈0.084 across 400–700nm, pinned at
// 550nm so the index sliders still read as "n at green".
const float DISP_K    = 2.0e4;
const float INV_L0_SQ = 1.0 / (550.0 * 550.0);
float nOf(float baseN, float lambda){
  return baseN + uDispersion * DISP_K * (1.0/(lambda*lambda) - INV_L0_SQ);
}

float gg(float x, float mu, float s1, float s2){
  float s = (x < mu) ? s1 : s2;
  float t = (x - mu) / s;
  return exp(-0.5 * t * t);
}
vec3 cie(float l){
  float x = 1.056*gg(l,599.8,37.9,31.0) + 0.362*gg(l,442.0,16.0,26.7) - 0.065*gg(l,501.1,20.4,26.2);
  float y = 0.821*gg(l,568.8,46.9,40.5) + 0.286*gg(l,530.9,16.3,31.1);
  float z = 1.217*gg(l,437.0,11.8,36.0) + 0.681*gg(l,459.0,26.0,13.8);
  return vec3(x,y,z);
}
// complex arithmetic on vec2 (x=real, y=imag) — the price of absorption
vec2 cmul(vec2 a, vec2 b){ return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x); }
vec2 cdiv(vec2 a, vec2 b){ float d = max(dot(b,b), 1e-12); return vec2(a.x*b.x + a.y*b.y, a.y*b.x - a.x*b.y)/d; }
vec2 crecip(vec2 a){ float d = max(dot(a,a), 1e-12); return vec2(a.x, -a.y)/d; }
vec2 cimul(vec2 z){ return vec2(-z.y, z.x); }   // i·z
vec2 csqrt(vec2 z){
  float r = length(z);
  float re = sqrt(max(0.5*(r + z.x), 0.0));
  float im = sqrt(max(0.5*(r - z.x), 0.0));
  return vec2(re, z.y < 0.0 ? -im : im);
}
vec2 ccos(vec2 z){ return vec2( cos(z.x)*cosh(z.y), -sin(z.x)*sinh(z.y)); }
vec2 csin(vec2 z){ return vec2( sin(z.x)*cosh(z.y),  cos(z.x)*sinh(z.y)); }

// Reflectance of the multilayer at one wavelength and incidence angle, via the
// characteristic-matrix method — fully COMPLEX so each medium can absorb
// (index ñ = n − ik) and disperse (n varies with λ). s and p averaged. With
// uAbsorb=0 and uDispersion=0 this reduces exactly to the lossless real form.
float stackR(float theta0, float lambda, float dA, float dB){
  float sin0 = sin(theta0);
  float sin2 = sin0 * sin0;
  int N = 2 * uLayers;
  float R = 0.0;
  for (int pol = 0; pol < 2; pol++){
    vec2 m00 = vec2(1.0,0.0), m01 = vec2(0.0,0.0);
    vec2 m10 = vec2(0.0,0.0), m11 = vec2(1.0,0.0);
    for (int i = 0; i < 32; i++){
      if (i >= N) break;
      bool even = (i - (i/2)*2) == 0;
      // Layers stay lossless dielectrics: a per-layer k would compound over all
      // 24 interfaces and black the stack out well before the slider's midpoint.
      // The absorber that makes structural colour *deep* lives in the substrate
      // (the melanin backing), applied at the termination below.
      vec2  nc = vec2(nOf(even ? uIndexA : uIndexB, lambda), 0.0);
      float d  = even ? dA : dB;
      vec2 ct = csqrt(vec2(1.0,0.0) - sin2 * crecip(cmul(nc,nc)));   // cosθ (complex)
      vec2 eta = (pol == 0) ? cmul(nc, ct) : cdiv(nc, ct);
      vec2 delta = (2.0 * PI * d / lambda) * cmul(nc, ct);
      vec2 cd = ccos(delta), sd = csin(delta);
      vec2 l01 = cimul(cdiv(sd, eta));   // i·sinδ/η
      vec2 l10 = cimul(cmul(eta, sd));   // i·η·sinδ
      vec2 n00 = cmul(m00,cd)  + cmul(m01,l10);
      vec2 n01 = cmul(m00,l01) + cmul(m01,cd);
      vec2 n10 = cmul(m10,cd)  + cmul(m11,l10);
      vec2 n11 = cmul(m10,l01) + cmul(m11,cd);
      m00=n00; m01=n01; m10=n10; m11=n11;
    }
    float ct0 = sqrt(max(1.0 - sin2, 0.0));               // air, real
    // absorbing substrate = the melanin backing. k scaled so the slider's full
    // 0..1 sweeps milky → deep jewel without ever blacking the reflection out.
    vec2  ncs = vec2(nOf(uIndexSub, lambda), -uAbsorb * 2.5);
    vec2  cts = csqrt(vec2(1.0,0.0) - sin2 * crecip(cmul(ncs,ncs)));
    vec2 eta0 = (pol == 0) ? vec2(ct0, 0.0) : vec2(1.0/max(ct0,1e-4), 0.0);
    vec2 etas = (pol == 0) ? cmul(ncs, cts) : cdiv(ncs, cts);
    vec2 B = m00 + cmul(m01, etas);
    vec2 C = m10 + cmul(m11, etas);
    vec2 num = cmul(eta0, B) - C;
    vec2 den = cmul(eta0, B) + C;
    R += dot(num,num) / max(dot(den,den), 1e-8);
  }
  return R * 0.5;
}

vec3 structuralColor(float theta0, float dA, float dB){
  vec3 xyz = vec3(0.0);
  float wsum = 0.0;
  const int S = 30;
  for (int i = 0; i < S; i++){
    float t = (float(i) + 0.5) / float(S);
    float lambda = mix(400.0, 700.0, t);
    vec3 cmf = cie(lambda);
    float Rw = stackR(theta0, lambda, dA, dB);
    // reflectance under the grade's illuminant. Normalising by the illuminant's
    // own luminance keeps brightness steady while the colour cast stays —
    // deliberately no chromatic adaptation, the cast IS the grade.
    float il = uIllum[i];
    xyz += cmf * Rw * il;
    wsum += cmf.y * il;
  }
  xyz /= max(wsum, 1e-4);
  vec3 rgb = vec3(
     3.2406*xyz.x - 1.5372*xyz.y - 0.4986*xyz.z,
    -0.9689*xyz.x + 1.8758*xyz.y + 0.0415*xyz.z,
     0.0557*xyz.x - 0.2040*xyz.y + 1.0570*xyz.z);
  // NO per-channel clamp here. Spectral structural colours routinely fall
  // outside sRGB (negative channels) — clamping each to 0 would shift their
  // hue. We keep the signed value and gamut-map it, hue-preserving, at the very
  // end of the composite. The LUT target is RGBA16F, so negatives store fine.
  return rgb;
}

void main(){
  float theta = vUv.x * LUT_THETA_MAX;
  float mult  = mix(LUT_MULT_LO, LUT_MULT_HI, vUv.y);
  frag = vec4(structuralColor(theta, uThickA * mult, uThickB * mult), 1.0);
}`;

// ---------------------------------------------------------------------------
// Smoke — a real (tiny) stable-fluids step, run at a fixed small resolution:
//
//   advect → density → buoyancy → vorticity confinement → divergence →
//   pressure (Jacobi) → project
//
// The pressure projection is what makes a drag read as *fluid*: a straight push
// becomes a vortex pair, strokes roll into mushroom curls, and the motion keeps
// evolving after you let go. Vorticity confinement feeds the small swirls the
// coarse grid would otherwise smear away.
//
// VELOCITY: self-advects, dissipates slowly (projection keeps it stable), takes
// a gaussian impulse from the pointer.
//
// DENSITY: hot smoke the pointer deposits (plus faint ambient emitters). It
// rides the velocity, slowly fades, and pushes the velocity upward — so a
// released stroke keeps rising and rolling instead of just coasting to a stop.
//
// DISPLACEMENT (last pass): a lasting offset field the velocity transports and
// slowly heals. The scene warps by this — so the trail is stirred, curled, and
// lingers, instead of snapping back.
// ---------------------------------------------------------------------------
export const ADVECT_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;

uniform sampler2D uVel;
uniform float uAspect;      // res.x/res.y, to keep the brush round
uniform vec2  uMouse;       // pointer, uv space (y up)
uniform vec2  uMouseVel;    // pointer velocity, uv/frame
uniform float uRadius;      // brush radius
uniform float uForce;       // impulse strength
uniform float uDown;        // 1 while the pointer is active

void main(){
  vec2 v = texture(uVel, vUv).xy;
  // semi-Lagrangian self-advection
  vec2 src = vUv - v;
  v = texture(uVel, src).xy * 0.99;   // slow dissipation — swirls live for seconds
  // pointer impulse — a soft round brush pushing in the drag direction
  vec2 d = (vUv - uMouse) * vec2(uAspect, 1.0);
  float g = exp(-dot(d, d) / (uRadius * uRadius));
  v += uMouseVel * g * uForce * uDown;
  frag = vec4(v, 0.0, 1.0);
}`;

// density (heat) — advected by the velocity, deposited by the pointer, slowly
// dissipating. A couple of faint wandering emitters near the bottom of the
// frame keep a whisper of smoke alive even before the first touch.
export const DENSITY_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;

uniform sampler2D uDen;
uniform sampler2D uVel;
uniform float uAspect;      // res.x/res.y, to keep the brush round
uniform vec2  uMouse;       // pointer, uv space (y up)
uniform vec2  uMouseVel;    // pointer velocity, uv/frame
uniform float uRadius;      // brush radius
uniform float uDown;        // 1 while the pointer is active
uniform float uTime;
uniform float uAmbient;     // ambient emitter strength (0 = off)

void main(){
  vec2 v = texture(uVel, vUv).xy;
  // semi-Lagrangian transport along the flow, then a slow fade — the smoke
  // outlives the stroke by seconds but never accumulates forever
  float den = texture(uDen, vUv - v).x * 0.985;
  // pointer deposit — the same soft brush as the impulse, scaled by drag speed
  // so a slow hover barely smoulders while a flick leaves a hot plume
  vec2 d = (vUv - uMouse) * vec2(uAspect, 1.0);
  float g = exp(-dot(d, d) / (uRadius * uRadius));
  den += g * uDown * min(length(uMouseVel) * 40.0, 1.0) * 0.35;
  // ambient emitters — two faint sources wandering low in the frame. Barely
  // visible on their own; buoyancy lifts them into slow idle plumes.
  for (int i = 0; i < 2; i++){
    float fi = float(i);
    vec2 c = vec2(0.5 + 0.32 * sin(uTime * (0.11 + fi * 0.07) + fi * 2.6),
                  0.16 + 0.10 * sin(uTime * 0.09 + fi * 4.1));
    vec2 e = (vUv - c) * vec2(uAspect, 1.0);
    den += exp(-dot(e, e) / 0.004) * uAmbient * 0.008;
  }
  // cap so a long scrub can't wind the heat up to absurd buoyancy
  frag = vec4(min(den, 2.0), 0.0, 0.0, 1.0);
}`;

// buoyancy + ambient life — hot smoke rises, and a whisper of a slowly-turning
// force field keeps the scene drifting before the first touch. Both forces are
// tiny per frame; the projection right after turns the resulting divergence
// into plumes and vortex pairs instead of a uniform slide.
export const BUOY_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;

uniform sampler2D uVel;
uniform sampler2D uDen;
uniform float uBuoy;        // buoyancy strength (0 = off)
uniform float uAmbient;     // ambient force strength (0 = off)
uniform float uTime;

void main(){
  vec2 v = texture(uVel, vUv).xy;
  float den = texture(uDen, vUv).x;
  // straight upward force per unit density. The constant is calibrated to the
  // velocity's uv/frame units — big enough to loft a plume, small enough that
  // the semi-Lagrangian step stays nowhere near a texel per frame.
  v.y += den * uBuoy * 0.0007;
  // ambient: a few low-frequency sines drifting out of phase. Deliberately not
  // noise — smooth, slow, and low-amplitude enough to read as air, not wind.
  float a = uTime * 0.05;
  vec2 q = vUv * 6.2831;
  v += uAmbient * 0.00003 * vec2(
    sin(q.y * 1.7 + a * 3.0) + sin(q.x * 0.9 - a * 2.0),
    sin(q.x * 1.3 - a * 2.3) + sin(q.y * 0.8 + a * 1.7));
  frag = vec4(v, 0.0, 1.0);
}`;

// curl (vorticity) of the velocity field — one scalar per texel
export const CURL_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uVel;
uniform vec2 uTexel;
void main(){
  float L = texture(uVel, vUv - vec2(uTexel.x, 0.0)).y;
  float R = texture(uVel, vUv + vec2(uTexel.x, 0.0)).y;
  float B = texture(uVel, vUv - vec2(0.0, uTexel.y)).x;
  float T = texture(uVel, vUv + vec2(0.0, uTexel.y)).x;
  frag = vec4(0.5 * ((R - L) - (T - B)), 0.0, 0.0, 1.0);
}`;

// vorticity confinement — push velocity around vorticity peaks so the coarse
// grid's numerical smearing doesn't kill the small curls
export const VORT_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uVel;
uniform sampler2D uCurl;
uniform vec2  uTexel;
uniform float uSwirl;
void main(){
  float L = texture(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture(uCurl, vUv - vec2(0.0, uTexel.y)).x;
  float T = texture(uCurl, vUv + vec2(0.0, uTexel.y)).x;
  float C = texture(uCurl, vUv).x;
  // N = normalized grad|curl|, force = N x omega (rotated toward the vortex)
  vec2 grad = 0.5 * vec2(abs(R) - abs(L), abs(T) - abs(B));
  vec2 dir = vec2(grad.y, -grad.x) / (length(grad) + 1e-4);
  vec2 v = texture(uVel, vUv).xy;
  v += dir * C * uSwirl * 0.5;
  frag = vec4(v, 0.0, 1.0);
}`;

export const DIV_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uVel;
uniform vec2 uTexel;
void main(){
  float L = texture(uVel, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uVel, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture(uVel, vUv - vec2(0.0, uTexel.y)).y;
  float T = texture(uVel, vUv + vec2(0.0, uTexel.y)).y;
  frag = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;

// one Jacobi relaxation step for the pressure Poisson equation. Warm-started
// from last frame's pressure, so ~20 iterations/frame converge plenty.
export const PRESSURE_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uPrs;
uniform sampler2D uDiv;
uniform vec2 uTexel;
void main(){
  float L = texture(uPrs, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uPrs, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture(uPrs, vUv - vec2(0.0, uTexel.y)).x;
  float T = texture(uPrs, vUv + vec2(0.0, uTexel.y)).x;
  float div = texture(uDiv, vUv).x;
  frag = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
}`;

// subtract the pressure gradient — the projection that makes the flow swirl
export const GRADSUB_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uVel;
uniform sampler2D uPrs;
uniform vec2 uTexel;
void main(){
  float L = texture(uPrs, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uPrs, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture(uPrs, vUv - vec2(0.0, uTexel.y)).x;
  float T = texture(uPrs, vUv + vec2(0.0, uTexel.y)).x;
  vec2 v = texture(uVel, vUv).xy - 0.5 * vec2(R - L, T - B);
  frag = vec4(v, 0.0, 1.0);
}`;

export const DISPLACE_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;

uniform sampler2D uDisp;   // the lasting displacement field
uniform sampler2D uVel;    // transported by this velocity
uniform float uLinger;     // 0..1 heal rate (higher = smoke lingers longer)

void main(){
  vec2 v = texture(uVel, vUv).xy;
  // carry the existing displacement along the flow, deposit more, then heal.
  // Deposit is small because the projected velocity now lives ~100 frames —
  // the trail integrates it, so a big factor would blow the warp out.
  vec2 D = texture(uDisp, vUv - v).xy;
  D += v * 0.035;
  D *= uLinger;
  // soft cap so a long stir can't wind the warp up to absurd offsets
  float m = length(D);
  D *= min(m, 0.35) / max(m, 1e-5);
  frag = vec4(D, 0.0, 1.0);
}`;

// ---------------------------------------------------------------------------
// Scene pass — the wing itself, rendered to an HDR (RGBA16F) target.
// ---------------------------------------------------------------------------
export const SCENE_FRAG = `#version 300 es
precision highp float;
precision highp int;

in vec2 vUv;
out vec4 frag;

uniform vec2  uRes;
uniform float uTime;

// smoke — a lasting displacement field (RG) the cursor stirs into the crawl
uniform sampler2D uDisp;
uniform float uWarp;        // how far the smoke drags the field (uv units)

// field
uniform float uWingSize;    // zoom
uniform float uScaleDensity; // grain frequency
uniform float uFlow;        // crawl speed

// structural colour is baked once per frame into a small (angle × thickness)
// lookup texture — the transfer-matrix physics is far too heavy to run per pixel
uniform sampler2D uLUT;
uniform float uDisorder;   // 0..1

// light
uniform float uLightAz;
uniform float uLightEl;
uniform float uLightInt;
uniform float uDrift;

// colour
uniform float uExposure;
uniform float uSaturation;
uniform float uGamut;
uniform float uBaseGlow;   // brightness of the iridescent field under the spots

// pigment — reds & purples bleeding through the field
uniform float uPigAmt;
uniform float uPigScale;
uniform float uPigContrast;
uniform vec3  uIllumRGB;   // grade lamp colour — pigment isn't spectral, so it
                           // takes the illuminant as a plain tint to stay in
                           // agreement with the LUT-lit structural colour

const float PI = 3.14159265359;

// --- hashing / noise ---------------------------------------------------------
float hash21(vec2 p){
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}
vec2 hash22(vec2 p){
  return vec2(hash21(p), hash21(p + 71.3));
}
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0 - 2.0*f);
  float a = hash21(i);
  float b = hash21(i + vec2(1,0));
  float c = hash21(i + vec2(0,1));
  float d = hash21(i + vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}

// The (angle × thickness-multiplier) mapping of the LUT. These MUST match the
// mapping the LUT pass writes with (see LUT_FRAG).
const float LUT_THETA_MAX = 1.5708;   // acos(cosI) spans 0..pi/2
const float LUT_MULT_LO   = 0.72;
const float LUT_MULT_HI   = 1.28;
vec3 structuralColor(float theta0, float mult){
  float lx = clamp(theta0 / LUT_THETA_MAX, 0.0, 1.0);
  float ly = clamp((mult - LUT_MULT_LO) / (LUT_MULT_HI - LUT_MULT_LO), 0.0, 1.0);
  return texture(uLUT, vec2(lx, ly)).rgb;
}

// --- flow field: the crawling scale texture ---------------------------------
float fbm(vec2 p){
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++){ s += a * vnoise(p); p = p * 2.02 + 7.1; a *= 0.5; }
  return s;
}

// The flow direction drifts slowly across space, domain-warped by a second
// low-frequency field so it bends, curls and branches instead of combing the
// whole frame in near-parallel lines (that uniformity is what read as
// repetitive). Computed ONCE per pixel and threaded through the rest.
vec2 flowDir(vec2 p){
  vec2 warp = vec2(fbm(p * 0.35 + 11.0), fbm(p * 0.35 + 27.0)) - 0.5;
  float ang = fbm(p * 0.6 + 3.0 + warp * 1.6) * 6.2831;
  return vec2(cos(ang), sin(ang));
}

// A height field of streaks compressed across the flow and scrolled along it:
// the "ant-crawl" shimmer. The sampling position is domain-warped so streaks
// meander and knot rather than run as tidy parallel combs, and the cross-flow
// compression is gentler (2.1 not 3.0) so the pattern is looser and less busy.
float flowH(vec2 p, vec2 dir, float t){
  float grain = mix(2.0, 9.0, uScaleDensity);
  vec2 wp = p + 0.30 * vec2(fbm(p * 0.8 + 5.0), fbm(p * 0.8 + 9.0));
  vec2 e2 = vec2(-dir.y, dir.x);
  vec2 w = vec2(dot(wp, e2) * 2.1, dot(wp, dir) - t);
  return fbm(w * grain);
}

// Bright specks riding the same flow — the sparkle that reads as motion. Kept
// sparse and soft so it's a glint in the surface, not a speckled layer on top.
float sparkle(vec2 p, vec2 dir, float t){
  float grain = mix(2.0, 9.0, uScaleDensity);
  vec2 wp = p + 0.30 * vec2(fbm(p * 0.8 + 5.0), fbm(p * 0.8 + 9.0));
  vec2 e2 = vec2(-dir.y, dir.x);
  vec2 w = vec2(dot(wp, e2) * 2.1, dot(wp, dir) - t) * grain * 2.7;
  return pow(smoothstep(0.62, 0.95, fbm(w)), 2.2);
}

vec3 flowNormal(vec2 p, vec2 dir, float t){
  float e = 0.004;
  float h  = flowH(p, dir, t);
  float hx = flowH(p + vec2(e,0.0), dir, t);
  float hy = flowH(p + vec2(0.0,e), dir, t);
  return normalize(vec3(-(hx-h)/e * 0.03, -(hy-h)/e * 0.03, 1.0));
}

// --- pigment: reds & purples that bleed through the shimmer ------------------
// Bimodal palette: a warm family (orange->scarlet) and a cool family
// (magenta->violet), with a sharp crossover so the field stays red & purple
// rather than drifting through muddy pink.
vec3 redPurple(float x){
  vec3 warm = mix(vec3(1.00, 0.24, 0.05), vec3(0.90, 0.03, 0.10), fract(x * 3.0));
  vec3 cool = mix(vec3(0.70, 0.03, 0.52), vec3(0.36, 0.05, 0.92), fract(x * 5.0));
  return mix(warm, cool, smoothstep(0.44, 0.60, x));
}

// A slow, organic field of colour that drifts with the flow. Two noise fields:
// one picks the hue, one carves where the pigment pools — so reds and purples
// bleed into one another in soft continents instead of hard circles.
// out amt is how strongly the pigment shows here (0..1).
vec3 pigmentField(vec2 p, float t, out float amt){
  vec2 q = p * uPigScale + vec2(t * 0.05, -t * 0.035) + 20.0;
  float hue  = fbm(q);                         // which colour
  float pool = fbm(q * 1.6 + 31.0);            // where it gathers
  float lo = mix(0.30, 0.50, uPigContrast);
  float hi = mix(0.80, 0.56, uPigContrast);
  amt = smoothstep(lo, hi, pool);
  return redPurple(hue);
}

// saturation / gamut push around luma
vec3 pushChroma(vec3 c, float sat, float gamut){
  float l = dot(c, vec3(0.2126,0.7152,0.0722));
  vec3 s = mix(vec3(l), c, sat);
  // gamut>1 lets the purest channel run past 1.0 so bloom can carry it
  return mix(s, s * gamut, smoothstep(0.4, 1.0, length(s)/1.732));
}

void main(){
  // smoke: offset the sampling coordinate (in uv, so it's independent of zoom)
  // by the lasting displacement field — the crawl smears and curls where you
  // dragged and only slowly heals, reading as stirred smoke rather than a tilt
  vec2 duv = texture(uDisp, vUv).xy * uWarp;
  vec2 p = ((vUv + duv) - 0.5) * vec2(uRes.x/uRes.y, 1.0) * 2.0 / uWingSize;
  float t = uTime * (0.3 + uFlow);

  // moving light — drifts on its own
  float az = uLightAz + uDrift * 0.6 * sin(uTime * 0.25);
  float el = uLightEl;
  vec3 L = normalize(vec3(cos(el)*cos(az), cos(el)*sin(az), sin(el)));
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 H = normalize(L + V);

  // shading normal from the crawling flow field — this is where the motion lives.
  // The flow direction is computed once here and threaded through the rest.
  vec2 fdir = flowDir(p);
  vec3 N = flowNormal(p, fdir, t);
  float cosI = clamp(dot(N, H), 0.0, 1.0);
  float theta0 = acos(cosI);

  // slow spatial drift of layer thickness -> broad hue regions in the shimmer
  float reg = fbm(p * 0.5 + 11.0);
  float mult = 1.0 + (reg - 0.5) * 0.28 + uDisorder * 0.12 * (vnoise(p * 40.0) - 0.5);
  vec3 structural = structuralColor(theta0, mult);

  // Softer, higher-floored glint: a broad exponent and a lifted floor mean the
  // flow shows as gentle hue-shimmer woven through the colour rather than sharp
  // bright/dark lines carved on top — and it can't fall to pure black. Sparkle
  // is dialled back for the same reason (a glint, not a speckled overlay).
  float w = pow(cosI, mix(14.0, 3.0, uDisorder)) + 0.20;
  float spk = sparkle(p, fdir, t);
  vec3 base = structural * (w + spk * 1.0) * uLightInt * uBaseGlow;

  base = pushChroma(base, uSaturation, uGamut);

  // pigment: reds & purples bleeding through the shimmer. It glows with the same
  // angular envelope (w) and picks up the sparkle, so the crawl still reads
  // *through* the colour — it's pigment in the surface, not a flat wash on top.
  float pAmt;
  vec3 pig = pushChroma(pigmentField(p, t, pAmt) * uIllumRGB, uSaturation, uGamut);
  pAmt *= uPigAmt;
  float shimmer = 0.35 + 0.9 * w + spk * 1.2;
  vec3 col = base * (1.0 - 0.45 * pAmt) + pig * pAmt * shimmer * uLightInt;

  col *= uExposure;
  frag = vec4(col, 1.0);
}`;

// ---------------------------------------------------------------------------
// Smoke advection — carry the *rendered appearance* along the fluid velocity so
// the iridescent material itself swirls, filaments and rolls (dye in water),
// instead of a warp smearing it or a glow sitting on top. Semi-Lagrangian: each
// pixel pulls colour from upstream (uv - v). Where the stirred smoke density is
// high we keep the carried colour; as the smoke dissipates we relax back to the
// freshly-generated crawl. The buoyancy/vorticity already baked into the
// velocity make the carried stuff rise and curl — that's the smoke motion.
// ---------------------------------------------------------------------------
export const ADVECTSCENE_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uFresh;   // this frame's freshly-rendered scene
uniform sampler2D uPrev;    // last frame's carried scene (feedback)
uniform sampler2D uVel;     // fluid velocity, uv/frame
uniform sampler2D uDen;     // stirred smoke density — where the material carries
uniform float uCarry;       // how strongly/long stirred stuff flows (0 = off)
void main(){
  vec2 v = texture(uVel, vUv).xy;
  vec3 fresh   = texture(uFresh, vUv).rgb;
  vec3 carried = texture(uPrev, vUv - v).rgb;     // pull colour from upstream
  float den = texture(uDen, vUv).x;
  // carry the actual colour where there's smoke; ease back to the fresh crawl
  // as it thins, so a stir leaves flowing filaments that slowly heal.
  float amt = clamp(uCarry * smoothstep(0.02, 0.35, den), 0.0, 0.97);
  frag = vec4(mix(fresh, carried, amt), 1.0);
}`;

// ---------------------------------------------------------------------------
// Bright-pass — keep what glows, feed the blur.
// ---------------------------------------------------------------------------
export const BRIGHT_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uTex;
uniform float uThreshold;
void main(){
  vec3 c = texture(uTex, vUv).rgb;
  float l = dot(c, vec3(0.2126,0.7152,0.0722));
  float k = max(l - uThreshold, 0.0) / max(l, 1e-4);
  frag = vec4(c * k, 1.0);
}`;

// ---------------------------------------------------------------------------
// Separable Gaussian blur.
// ---------------------------------------------------------------------------
export const BLUR_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uTex;
uniform vec2 uDir;      // texel-sized step along one axis
void main(){
  float w[5];
  w[0]=0.227027; w[1]=0.1945946; w[2]=0.1216216; w[3]=0.054054; w[4]=0.016216;
  vec3 acc = texture(uTex, vUv).rgb * w[0];
  for (int i=1;i<5;i++){
    acc += texture(uTex, vUv + uDir*float(i)).rgb * w[i];
    acc += texture(uTex, vUv - uDir*float(i)).rgb * w[i];
  }
  frag = vec4(acc, 1.0);
}`;

// ---------------------------------------------------------------------------
// Composite — combine scene + bloom, tonemap, then the retro finish:
// pixelation, ordered dithering (Bayer / interleaved-gradient / value noise),
// posterisation and CRT scanlines. This is the "art of dithering" pass.
// ---------------------------------------------------------------------------
export const COMPOSITE_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;

uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform vec2  uRes;
uniform float uTime;

uniform float uBloomStrength;
uniform int   uDither;       // 0 off, 1 bayer, 2 ign, 3 noise
uniform float uLevels;       // colour levels per channel
uniform float uCRT;          // scanline intensity
uniform float uVignette;

uniform vec3  uGradeTint;    // the grade swatch
uniform float uGradeWash;    // wash strength (0 = off)

const mat4 BAYER = mat4(
   0.0,  8.0,  2.0, 10.0,
  12.0,  4.0, 14.0,  6.0,
   3.0, 11.0,  1.0,  9.0,
  15.0,  7.0, 13.0,  5.0) / 16.0;

float bayer(vec2 fragc){
  int x = int(mod(fragc.x, 4.0));
  int y = int(mod(fragc.y, 4.0));
  return BAYER[x][y] - 0.5;
}
float ign(vec2 fragc){ // interleaved gradient noise, animated
  vec3 m = vec3(0.06711056, 0.00583715, 52.9829189);
  return fract(m.z * fract(dot(fragc + uTime*11.0, m.xy))) - 0.5;
}
float hash(vec2 p){
  p = fract(p*vec2(123.34,345.45)); p += dot(p,p+34.345); return fract(p.x*p.y);
}

// Hue-preserving tonemap. Ordinary ACES desaturates highlights toward white —
// death for a simulator about impossible saturation. Instead we tonemap only
// the peak channel and rescale, so a blinding blue stays blue, just compressed.
float aces1(float x){
  return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0);
}
vec3 tonemap(vec3 x){
  float m = max(max(x.r, x.g), x.b);
  if (m < 1e-5) return x;
  // a whisper of desaturation only at the very top so glints can still bloom white
  float k = aces1(m) / m;
  vec3 c = x * k;
  float over = smoothstep(1.5, 4.0, m);
  return mix(c, vec3(aces1(m)), over * 0.35);
}

// One swatch defines the whole wash: hues pulled toward a re-toned version of
// themselves, then the gel, then dark swatches darken the frame. Runs in HDR,
// before tonemap, so the retro chain quantises the graded colour.
vec3 gradeWash(vec3 c, float amt){
  float l = dot(c, vec3(0.2126,0.7152,0.0722));
  c = mix(c, l * uGradeTint * 2.0, amt * 0.45);
  c *= mix(vec3(1.0), uGradeTint, amt * 0.65);
  float tl = dot(uGradeTint, vec3(0.2126,0.7152,0.0722));
  return c * mix(1.0, 0.5 + 0.5 * tl, amt);
}

// Gamut map — fit a colour into [0,1] by pulling it toward its OWN luminance
// (constant hue & luma) just enough that every channel is in range, instead of
// clipping each channel independently. Per-channel clamp shifts hue toward the
// gamut corners — fatal for the over-pure structural colours this is all about;
// this desaturates the minimum amount needed and keeps the hue true.
float chFit(float c, float l){
  float s = 1.0;
  if (c < 0.0) s = min(s, l / (l - c));
  if (c > 1.0) s = min(s, (1.0 - l) / (c - l));
  return s;
}
vec3 gamutMap(vec3 c){
  float l = clamp(dot(c, vec3(0.2126,0.7152,0.0722)), 0.0, 1.0);
  float s = min(chFit(c.r, l), min(chFit(c.g, l), chFit(c.b, l)));
  return mix(vec3(l), c, clamp(s, 0.0, 1.0));
}

void main(){
  // The whole pipeline now renders at the low (chunky) resolution and this pass
  // writes one output texel per chunky pixel — no grid-snapping needed. uRes is
  // the low-res size, so fragc counts chunky pixels directly: dither is one
  // pattern cell per pixel and scanlines are one dark line per row, natively.
  vec2 fragc = floor(vUv * uRes);

  // bloom takes the wash at reduced strength — glints keep most of their own
  // colour under the grade (the "self-lit things stay lit" rule)
  vec3 scene = gradeWash(texture(uScene, vUv).rgb, uGradeWash);
  vec3 bloom = gradeWash(texture(uBloom, vUv).rgb, uGradeWash * 0.35);
  vec3 c = scene + bloom * uBloomStrength;

  c = tonemap(c);

  // dither before quantising so gradients survive a tiny palette
  float d = 0.0;
  if      (uDither == 1) d = bayer(fragc);
  else if (uDither == 2) d = ign(fragc);
  else if (uDither == 3) d = hash(fragc) - 0.5;

  if (uLevels < 255.0){
    float steps = max(uLevels - 1.0, 1.0);
    c += d / steps;
    c = floor(c * steps + 0.5) / steps;
  }

  // CRT scanlines — one line per chunky row
  float scan = 1.0 - uCRT * (0.5 + 0.5 * sin(fragc.y * 3.14159));
  c *= scan;

  // vignette
  vec2 vv = (vUv - 0.5);
  c *= 1.0 - uVignette * dot(vv, vv) * 2.2;

  c = gamutMap(c);           // hue-preserving fit into [0,1] (replaces the clip)
  c = clamp(c, 0.0, 1.0);    // numerical safety before the sRGB curve
  c = pow(c, vec3(1.0/2.2)); // to sRGB-ish
  frag = vec4(c, 1.0);
}`;

// ---------------------------------------------------------------------------
// Upscale — the low-res, already-graded/dithered frame blown up to the screen
// with nearest sampling, for crisp chunky pixels (the "A Short Hike" look).
// ---------------------------------------------------------------------------
export const UPSCALE_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uTex;
void main(){ frag = vec4(texture(uTex, vUv).rgb, 1.0); }`;
