/* The gen.tldraw board's ground, held at one scale: patches of the flow
   painting laid dab by dab on the GPU and re-laid on twos, so the brushwork
   boils while the currents drift. Patches sit where the painting one level up
   is light; regions turn, scale and mirror the source their own way. */

const STEP = 1000 / 6, SP = 5, F = 4;
// dabs come and go in a 4x4 ordered-dither sequence
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const PHASE = BAYER.map((r, i) => [r, i % 4, i >> 2]).sort((a, b) => a[0] - b[0]).map(([, x, y]) => [x, y]);
const PH = 16;

const COMMON = `
const vec2 TILE = vec2(1000.0, 1462.0);
float hash(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
	float a = hash(vec3(i, 7.0)), b = hash(vec3(i + vec2(1.0, 0.0), 7.0)), c = hash(vec3(i + vec2(0.0, 1.0), 7.0)), d = hash(vec3(i + 1.0, 7.0));
	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
// regions: a jittered Voronoi in tile units; nearest id, second id, and the gap between them
vec3 region(vec2 q, float salt) {
	q += 0.9 * (vec2(fbm(q * 0.7 + salt), fbm(q * 0.7 - salt + 4.3)) - 0.5);
	vec2 g = floor(q / 1.7); float d1 = 1e9, d2 = 1e9, i1 = 0.0, i2 = 0.0;
	for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
		vec2 c = g + vec2(i, j), s = (c + vec2(hash(vec3(c, salt)), hash(vec3(c, salt + 5.0)))) * 1.7;
		float d = length(q - s), id = c.x * 131.0 + c.y * 7.0 + salt;
		if (d < d1) { d2 = d1; i2 = i1; d1 = d; i1 = id; } else if (d < d2) { d2 = d; i2 = id; }
	}
	return vec3(i1, i2, d2 - d1);
}
// near a border, pick a side per block, so the two regions' stripes interleave
float pick(vec2 pl, float salt, vec2 blk) { vec3 r = region(pl / TILE, salt); return hash(vec3(blk, salt + 13.0)) < 0.5 * (1.0 - smoothstep(0.0, 0.09, r.z)) ? r.y : r.x; }
vec2 mapQ(vec2 pl, float t, float id) {
	vec2 q = pl / TILE;
	q += 0.55 * (vec2(fbm(q * 0.45 + 3.7 + t * 0.01), fbm(q * 0.45 - 5.1 - t * 0.01)) - 0.5);
	q += 0.2 * (vec2(fbm(q * 1.7 + 9.2), fbm(q * 1.7 - 2.6)) - 0.5);
	float th = hash(vec3(id, 1.0, 2.0)) * 6.2832, sc = 0.7 + hash(vec3(id, 3.0, 4.0)) * 0.9, amp = 0.4 + hash(vec3(id, 5.0, 6.0)) * 1.4;
	q = rot(th) * q * sc + vec2(hash(vec3(id, 7.0, 8.0)), hash(vec3(id, 9.0, 10.0))) * 8.0;
	q.x += amp * (0.055 * sin(q.y * 7.0 + t * 0.5) + 0.03 * sin((q.x + q.y) * 11.0 - t * 0.7));
	q.y += amp * 0.045 * sin(q.x * 6.0 - t * 0.4);
	q += vec2(9.0 * sin(pl.y / 170.0 + t) + 5.0 * sin((pl.x + pl.y) / 260.0 - t * 1.3), 8.0 * cos(pl.x / 190.0 - t * 0.8) + 5.0 * sin((pl.x - pl.y) / 230.0 + t)) / 1000.0;
	return q;
}
// mirror tiling, sampling inside the painting's border, otherwise its frame edge shows as straight lines
vec2 mirrorUV(vec2 q) { return 0.025 + 0.95 * (1.0 - abs(mod(q, 2.0) - 1.0)); }
// some regions are dyed indigo, with the warm threads left in
vec3 dye(vec3 c, float id) {
	if (hash(vec3(id, 11.0, 12.0)) > 0.12) return c;
	float l = dot(c, vec3(0.3, 0.59, 0.11));
	vec3 ind = l < 0.5 ? mix(vec3(0.055, 0.08, 0.17), vec3(0.34, 0.46, 0.67), l * 2.0) : mix(vec3(0.34, 0.46, 0.67), vec3(0.93, 0.9, 0.82), l * 2.0 - 1.0);
	float warm = max(0.0, c.r - c.b - 0.25) * (max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b)));
	return warm > 0.08 ? mix(ind, c * vec3(0.9, 0.7, 0.5), 0.7) : ind;
}
uniform sampler2D uSrc, uDir;
uniform float uD;
uniform float uCoast;
float coastline(float l) { return smoothstep(uCoast, uCoast + 0.06, l); }
// the painting one level up: where it is light, this level has ground; its colour tints this level
vec4 macro(vec2 pl, float t, float K) {
	vec2 pm = pl / ${F}.0; float saltM = (K + 1.0) * 17.0 + 1.0;
	pm += TILE * 0.12 * (vec2(fbm(pm / TILE * 5.0 + 1.3), fbm(pm / TILE * 5.0 - 7.9)) - 0.5);
	vec3 rg = region(pm / TILE, saltM);
	vec3 c1 = dye(textureLod(uSrc, mirrorUV(mapQ(pm, t, rg.x)), 2.5).rgb, rg.x);
	vec3 c2 = dye(textureLod(uSrc, mirrorUV(mapQ(pm, t, rg.y)), 2.5).rgb, rg.y);
	vec3 cm = mix(c2, c1, 0.5 + 0.5 * smoothstep(0.0, 0.35, rg.z));
	float l = dot(cm, vec3(0.3, 0.59, 0.11)) + 0.12 * (fbm(pm / 1800.0) - 0.5) + 0.07 * (fbm(pl / 45.0) - 0.5);
	return vec4(cm, l);
}
`;

// per dab, once per drawing: its direction, ground and colour
const FS_CELL = `#version 300 es
precision highp float;
uniform vec2 uCell0; uniform float uSp; uniform int uBRows; uniform vec2 uOff[16];
layout(location = 0) out vec4 o0; layout(location = 1) out vec4 o1;
__COMMON__
void main() {
	ivec2 tx = ivec2(gl_FragCoord.xy); int ph = tx.y / uBRows, bj = tx.y - ph * uBRows;
	vec2 cell = uCell0 + vec2(tx.x, bj) * 4.0 + uOff[ph];
	vec2 p = (cell + vec2(hash(vec3(cell, uD + 11.0)), hash(vec3(cell, uD + 23.0)))) * uSp;
	float t = uD * 0.07, salt = 1.0;
	float id = pick(p, salt, floor(p / 12.0));
	vec2 q = mapQ(p, t, id), uv = mirrorUV(q);
	// explicit detail level: neighbouring texels aren't neighbours here, otherwise every dab reads the same tan
	vec2 dir = textureLod(uDir, uv, 0.0).xy * 2.0 - 1.0;
	// the source's stroke direction, carried back through this region's map
	float e = 2.0;
	mat2 J = mat2((mapQ(p + vec2(e, 0.0), t, id) - q) / e, (mapQ(p + vec2(0.0, e), t, id) - q) / e);
	vec2 tg = inverse(J) * dir;
	vec4 m = macro(p, t, 0.0);
	vec3 col = mix(dye(textureLod(uSrc, uv, 0.0).rgb, id), m.rgb, 0.15);
	o0 = vec4(atan(tg.y, tg.x), coastline(m.w), 0.0, 1.0);
	o1 = vec4(col, 1.0);
}`;

const VS_DAB = `#version 300 es
precision highp float;
uniform vec2 uMin, uSize, uCell0; uniform float uSp, uPass, uPxPerUnit, uD; uniform int uBCols, uBRows; uniform vec2 uOff[16];
uniform sampler2D uCellA, uCellB;
out vec2 vLocal; out vec4 vCol; flat out float vLen, vRad, vPx;
float hash(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
void main() {
	int per = uBCols * uBRows, id = gl_InstanceID, ph = id / per, r = id - ph * per, bi = r % uBCols, bj = r / uBCols;
	vec2 cell = uCell0 + vec2(bi, bj) * 4.0 + uOff[ph];
	ivec2 tx = ivec2(bi, ph * uBRows + bj);
	vec4 a = texelFetch(uCellA, tx, 0);
	// coasts: the paint thins out close to the ground and no further, so no lone marks wander the paper
	float coast = smoothstep(0.25, 0.75, a.y);
	float keep = coast * (uPass > 0.5 ? 0.45 : 1.0);
	if (hash(vec3(cell, uD * 3.0 + uPass)) > keep) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
	vec3 base = texelFetch(uCellB, tx, 0).rgb;
	vec2 p = (cell + vec2(hash(vec3(cell, uD + 11.0)), hash(vec3(cell, uD + 23.0)))) * uSp;
	if (uPass > 0.5) p += (vec2(hash(vec3(cell, uD + 71.0)), hash(vec3(cell, uD + 83.0))) - 0.5) * uSp;
	float an = a.x + (hash(vec3(cell, uD + 31.0)) - 0.5) * 0.3;
	vec2 tg = vec2(cos(an), sin(an)), nm = vec2(-tg.y, tg.x);
	float r1 = hash(vec3(cell, uD + 41.0 + uPass * 5.0)), r2 = hash(vec3(cell, uD + 53.0 + uPass * 5.0)), r3 = hash(vec3(cell, uD + 67.0 + uPass * 5.0));
	// at the fraying edge strokes get finer and fainter, like paint running dry
	float dry = mix(0.6, 1.0, coast);
	float L = (uPass > 0.5 ? 3.0 + r1 * 3.0 : 5.0 + r1 * 6.0) * dry;
	float wdt = (uPass > 0.5 ? 1.2 + r2 * 1.1 : 2.4 + r2 * 1.8) * dry;
	vCol = vec4(min(base * (1.0 + (r3 - 0.5) * (uPass > 0.5 ? 0.3 : 0.16)), vec3(1.0)), (uPass > 0.5 ? 0.65 + r1 * 0.35 : 0.92) * mix(0.6, 1.0, coast));
	vec2 corner = vec2(gl_VertexID & 1, gl_VertexID >> 1) * 2.0 - 1.0;
	float rad = wdt * 0.5, px = 1.0 / uPxPerUnit;
	vLocal = corner * vec2(L * 0.5 + rad + px, rad + px);
	vLen = L * 0.5; vRad = rad; vPx = uPxPerUnit;
	vec2 ndc = (p + tg * vLocal.x + nm * vLocal.y - uMin) / uSize * 2.0 - 1.0;
	gl_Position = vec4(ndc.x, -ndc.y, 0.0, 1.0);
}`;

// each dab is a capsule, antialiased by distance
const FS_DAB = `#version 300 es
precision highp float;
in vec2 vLocal; in vec4 vCol; flat in float vLen, vRad, vPx;
out vec4 o;
void main() {
	float d = length(vec2(max(abs(vLocal.x) - vLen, 0.0), vLocal.y)) - vRad;
	float a = clamp(0.5 - d * vPx, 0.0, 1.0) * vCol.a;
	if (a <= 0.0) discard;
	o = vec4(vCol.rgb * a, a);
}`;

const VS_FULL = `#version 300 es
out vec2 vN;
void main() { vec2 v = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); vN = v; gl_Position = vec4(v * 2.0 - 1.0, 0.0, 1.0); }`;

// underpainting at quarter resolution, so no paper shows between dabs
const FS_UNDER = `#version 300 es
precision highp float;
in vec2 vN; out vec4 o;
uniform vec2 uMin, uSize;
__COMMON__
void main() {
	vec2 p = uMin + vec2(vN.x, 1.0 - vN.y) * uSize;
	float t = uD * 0.07, id = region(p / TILE, 1.0).x;
	vec4 m = macro(p, t, 0.0);
	vec3 c = mix(dye(textureLod(uSrc, mirrorUV(mapQ(p, t, id)), 2.0).rgb, id), m.rgb, 0.15);
	float a = coastline(m.w);
	if (a <= 0.003) discard;
	o = vec4(c * a, a);
}`;

const FS_COPY = `#version 300 es
precision highp float;
in vec2 vN; out vec4 o; uniform sampler2D uTex;
void main() { o = texture(uTex, vN); }`;

type GL = WebGL2RenderingContext;
type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };

function program(gl: GL, vs: string, fs: string): Prog {
  const mk = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src.replace("__COMMON__", COMMON));
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link");
  const u: Prog["u"] = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const name = gl.getActiveUniform(p, i)!.name;
    u[name] = gl.getUniformLocation(p, name);
  }
  return { p, u };
}

function texture(gl: GL, w: number, h: number, data: Uint8Array, mip: boolean) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mip ? gl.LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (mip) gl.generateMipmap(gl.TEXTURE_2D);
  return t;
}

// a render target, resized on demand
function target(gl: GL, internal: number, format: number, type: number, filter: number, count = 1) {
  const fbo = gl.createFramebuffer();
  const texs = Array.from({ length: count }, () => gl.createTexture());
  let w = 0, h = 0;
  return {
    texs,
    fbo,
    size(W: number, H: number) {
      if (W === w && H === h) return;
      w = W;
      h = H;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      texs.forEach((t, i) => {
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, internal, W, H, 0, format, type, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0);
      });
      gl.drawBuffers(texs.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
    },
  };
}

function boxBlur(src: Float32Array, W: number, H: number, r: number) {
  const tmp = new Float32Array(W * H), out = new Float32Array(W * H), n = 2 * r + 1;
  for (let y = 0; y < H; y++) {
    let s = 0;
    for (let x = -r; x <= r; x++) s += src[y * W + Math.min(W - 1, Math.max(0, x))];
    for (let x = 0; x < W; x++) {
      tmp[y * W + x] = s / n;
      s += src[y * W + Math.min(W - 1, x + r + 1)] - src[y * W + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < W; x++) {
    let s = 0;
    for (let y = -r; y <= r; y++) s += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
    for (let y = 0; y < H; y++) {
      out[y * W + x] = s / n;
      s += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x];
    }
  }
  return out;
}

// colours, and the stroke direction from a smoothed structure tensor, packed as textures
async function analyse(url: string) {
  const bitmap = await createImageBitmap(await (await fetch(url)).blob());
  const W = bitmap.width, H = bitmap.height;
  const c = new OffscreenCanvas(W, H), x = c.getContext("2d")!;
  x.drawImage(bitmap, 0, 0);
  const px = x.getImageData(0, 0, W, H).data, L = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) L[i] = 0.3 * px[i * 4] + 0.59 * px[i * 4 + 1] + 0.11 * px[i * 4 + 2];
  const jxx = new Float32Array(W * H), jxy = new Float32Array(W * H), jyy = new Float32Array(W * H);
  for (let y = 1; y < H - 1; y++)
    for (let x2 = 1; x2 < W - 1; x2++) {
      const i = y * W + x2;
      const gx = L[i + 1 - W] + 2 * L[i + 1] + L[i + 1 + W] - L[i - 1 - W] - 2 * L[i - 1] - L[i - 1 + W];
      const gy = L[i + W - 1] + 2 * L[i + W] + L[i + W + 1] - L[i - W - 1] - 2 * L[i - W] - L[i - W + 1];
      jxx[i] = gx * gx;
      jxy[i] = gx * gy;
      jyy[i] = gy * gy;
    }
  const blur = (a: Float32Array) => boxBlur(boxBlur(a, W, H, 5), W, H, 5);
  const a = blur(jxx), b = blur(jxy), d = blur(jyy);
  const dir = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const th = 0.5 * Math.atan2(2 * b[i], a[i] - d[i]) + Math.PI / 2;
    dir[i * 4] = (Math.cos(th) * 0.5 + 0.5) * 255;
    dir[i * 4 + 1] = (Math.sin(th) * 0.5 + 0.5) * 255;
    dir[i * 4 + 3] = 255;
  }
  return { W, H, px: new Uint8Array(px.buffer), dir };
}

/* Paints the field into cv, the card's box at 1:1, with the field's origin
   at (ox, oy). coast is how light the painting one level up must be for
   ground: gen's board uses 0.55, higher leaves thinner islands. Returns a
   stop function, or null without WebGL2. */
export function startField(cv: HTMLCanvasElement, src: string, ox: number, oy: number, coast: number, still: boolean) {
  const gl = cv.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;
  let raf = 0, dead = false, last = "";
  analyse(src).then((s) => {
    if (dead) return;
    const texSrc = texture(gl, s.W, s.H, s.px, true), texDir = texture(gl, s.W, s.H, s.dir, false);
    const P = { dab: program(gl, VS_DAB, FS_DAB), under: program(gl, VS_FULL, FS_UNDER), cell: program(gl, VS_FULL, FS_CELL), copy: program(gl, VS_FULL, FS_COPY) };
    gl.getExtension("EXT_color_buffer_float");
    const cells = target(gl, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.NEAREST, 2);
    const low = target(gl, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR);
    const OFFS = new Float32Array(PHASE.flat());
    const use = (pr: Prog, d: number, vb: { x: number; y: number; w: number; h: number }) => {
      gl.useProgram(pr.p);
      const set = (n: string, ...v: number[]) => {
        const u = pr.u[n];
        if (!u) return;
        if (v.length === 1) gl.uniform1f(u, v[0]);
        else gl.uniform2f(u, v[0], v[1]);
      };
      set("uMin", vb.x, vb.y);
      set("uSize", vb.w, vb.h);
      set("uD", d % 100000);
      set("uCoast", coast);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texSrc);
      if (pr.u.uSrc) gl.uniform1i(pr.u.uSrc, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texDir);
      if (pr.u.uDir) gl.uniform1i(pr.u.uDir, 1);
      return set;
    };
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const frame = () => {
      if (!still) raf = requestAnimationFrame(frame);
      const dpr = window.devicePixelRatio || 1;
      const W = Math.round(cv.clientWidth * dpr), H = Math.round(cv.clientHeight * dpr);
      const d = still ? 0 : Math.floor(Date.now() / STEP);
      const key = `${W}x${H}:${d}`;
      if (key === last || !W || !H) return;
      last = key;
      if (cv.width !== W || cv.height !== H) {
        cv.width = W;
        cv.height = H;
      }
      const vb = { x: ox, y: oy, w: cv.clientWidth, h: cv.clientHeight };
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const sp = SP, pad = 16;
      const c0x = Math.floor((vb.x - pad) / sp / 4) * 4, c0y = Math.floor((vb.y - pad) / sp / 4) * 4;
      const bcols = Math.ceil(((vb.x + vb.w + pad) / sp - c0x) / 4) + 1;
      const brows = Math.ceil(((vb.y + vb.h + pad) / sp - c0y) / 4) + 1;
      // underpainting at quarter resolution, composited up
      const lw = Math.max(1, W >> 2), lh = Math.max(1, H >> 2);
      low.size(lw, lh);
      gl.bindFramebuffer(gl.FRAMEBUFFER, low.fbo);
      gl.viewport(0, 0, lw, lh);
      gl.disable(gl.BLEND);
      gl.clear(gl.COLOR_BUFFER_BIT);
      use(P.under, d, vb);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.enable(gl.BLEND);
      gl.useProgram(P.copy.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, low.texs[0]);
      gl.uniform1i(P.copy.u.uTex, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      // per-dab pre-pass
      cells.size(bcols, brows * PH);
      gl.bindFramebuffer(gl.FRAMEBUFFER, cells.fbo);
      gl.viewport(0, 0, bcols, brows * PH);
      gl.disable(gl.BLEND);
      const sc = use(P.cell, d, vb);
      sc("uCell0", c0x, c0y);
      sc("uSp", sp);
      gl.uniform1i(P.cell.u.uBRows, brows);
      gl.uniform2fv(P.cell.u["uOff[0]"], OFFS);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.enable(gl.BLEND);
      // dabs
      const sd = use(P.dab, d, vb);
      sd("uCell0", c0x, c0y);
      sd("uSp", sp);
      sd("uPxPerUnit", W / vb.w);
      gl.uniform1i(P.dab.u.uBCols, bcols);
      gl.uniform1i(P.dab.u.uBRows, brows);
      gl.uniform2fv(P.dab.u["uOff[0]"], OFFS);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, cells.texs[0]);
      gl.uniform1i(P.dab.u.uCellA, 2);
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, cells.texs[1]);
      gl.uniform1i(P.dab.u.uCellB, 3);
      for (const pass of [0, 1]) {
        sd("uPass", pass);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, bcols * brows * PH);
      }
      cv.classList.add("on");
    };
    frame();
    if (still) addEventListener("resize", frame);
    stopResize = () => removeEventListener("resize", frame);
  });
  let stopResize = () => {};
  return () => {
    dead = true;
    cancelAnimationFrame(raf);
    stopResize();
  };
}
