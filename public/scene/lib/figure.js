// A jointed figure for scenes with a person in them. It is a skeleton whose bones keep their lengths: you say where the
// hips are, how the body is turned and where the hands and feet go, and it works out the knees and elbows.
// It comes with cycles for standing, walking, running and swimming, each a pure function of how far round the cycle it is.
// The scene draws it in its own shader, as rods between the joints: `glsl` below is that drawing.
//
// Everything is in the figure's own space: it stands 1 tall on y = 0, facing +x, and the near side (+z) is the one toward the usual camera.
// A limb is aimed in the body's own directions, [forward, up, out] from its socket, so a pose still holds when the body turns or lies down.

const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = a => Math.hypot(a[0], a[1], a[2]);
const unit = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// a and b turned toward each other in their own plane by an angle
const turned = (a, b, angle) => [add(a.map(v => v * Math.cos(angle)), b, Math.sin(angle)), add(b.map(v => v * Math.cos(angle)), a, -Math.sin(angle))];
const TAU = Math.PI * 2, wrap = u => ((u % 1) + 1) % 1, ease = t => t * t * (3 - 2 * t);

// A limb of two bones from a socket to as near the target as it can reach; pole is the way the middle joint bends
function limb(socket, target, upper, lower, pole) {
  let to = sub(target, socket), far = len(to);
  const most = upper + lower - 1e-3, least = Math.abs(upper - lower) + 1e-3;
  if (far < 1e-6) { to = [0, -1, 0]; far = 1; }
  const reach = Math.min(Math.max(far, least), most), along = unit(to), tip = add(socket, along, reach);
  const x = (upper * upper - lower * lower + reach * reach) / (2 * reach), y = Math.sqrt(Math.max(0, upper * upper - x * x));
  let bend = add(pole, along, -dot(pole, along));
  if (len(bend) < 1e-5) bend = cross(along, [0, 0, 1]);
  return [add(add(socket, along, x), unit(bend), y), tip];
}

// The joints, in the order the shader takes them
export const JOINTS = ['hip', 'chest', 'neck', 'head', 'shoulderL', 'elbowL', 'handL', 'shoulderR', 'elbowR', 'handR', 'hipL', 'kneeL', 'ankleL', 'hipR', 'kneeR', 'ankleR', 'toeL', 'toeR'];

// heads: how many of its own heads tall the figure is. Seven and a half is an adult; five or six reads better at forty pixels.
export function figure({ heads = 6 } = {}) {
  const head = 0.5 / heads;                                  // the head's radius
  const B = { head, ankle: 0.035, shin: 0.235, thigh: 0.245, neck: 0.05, upper: 0.15, fore: 0.14, foot: 0.085, shoulders: 0.1, hips: 0.052 };
  B.leg = B.thigh + B.shin;
  B.arm = B.upper + B.fore;
  B.stand = B.ankle + B.leg;                                 // how high the hips are, standing straight
  B.spine = 1 - 2 * head - B.neck - B.stand;

  // A pose is plain data. Anything left out stays as it is when standing.
  //   hip [x, y, z]   where the hips are       face   turned about upright, 0 facing +x     pitch  tipped forward, a quarter turn lies it face down
  //   roll            rolled about its length  lean   the spine bent forward at the hips    twist  shoulders turned against the hips
  //   nod             the head tipped forward
  //   handL, handR    where each hand is, [forward, up, out] from its shoulder     footL, footR   the same for each ankle, from its hip
  //   toeL, toeR      how far each foot points down
  const rest = () => ({
    hip: [0, B.stand, 0], face: 0, pitch: 0, roll: 0, lean: 0, twist: 0, nod: 0,
    handL: [0.02, -B.arm * 0.97, 0.03], handR: [0.02, -B.arm * 0.97, 0.03],
    footL: [0, -B.leg * 0.995, 0], footR: [0, -B.leg * 0.995, 0], toeL: 0, toeR: 0,
  });

  // Where every joint is for a pose: 18 points, x y z each, ready to hand to the shader as uJ
  function joints(pose, out = new Float32Array(JOINTS.length * 3)) {
    const p = { ...rest(), ...pose };
    // The body's own directions: forward out of the chest, up toward the head, out to the near side
    let F = [Math.cos(p.pitch), -Math.sin(p.pitch), 0], U = [Math.sin(p.pitch), Math.cos(p.pitch), 0], S = [0, 0, 1];
    [F, S] = turned(F, S, p.roll);
    const about = v => [v[0] * Math.cos(p.face) + v[2] * Math.sin(p.face), v[1], -v[0] * Math.sin(p.face) + v[2] * Math.cos(p.face)];
    F = about(F); U = about(U); S = about(S);
    // The chest has directions of its own, since the spine bends and the shoulders turn
    let [cu, cf] = turned(U, F, p.lean), cs = S;
    [cf, cs] = turned(cf, cs, p.twist);
    const hip = p.hip, chest = add(hip, cu, B.spine), neck = add(chest, cu, B.neck);
    const [hu] = turned(cu, cf, p.nod), at = { hip, chest, neck, head: add(neck, hu, head * 0.92) };
    for (const [side, sign] of [['L', 1], ['R', -1]]) {
      const shoulder = add(add(chest, cs, sign * B.shoulders), cu, -0.02), reach = p['hand' + side];
      const hand = add(add(add(shoulder, cf, reach[0]), cu, reach[1]), cs, sign * reach[2]);
      // Elbows bend back and a little out; knees bend forward
      const [elbow, wrist] = limb(shoulder, hand, B.upper, B.fore, add(cf.map(v => -v), cs, sign * 0.35));
      const socket = add(hip, S, sign * B.hips), step = p['foot' + side];
      const [knee, ankle] = limb(socket, add(add(add(socket, F, step[0]), U, step[1]), S, sign * step[2]), B.thigh, B.shin, add(F, S, sign * 0.1));
      const point = p['toe' + side];
      Object.assign(at, { ['shoulder' + side]: shoulder, ['elbow' + side]: elbow, ['hand' + side]: wrist, ['hip' + side]: socket, ['knee' + side]: knee, ['ankle' + side]: ankle,
        ['toe' + side]: add(add(ankle, F, Math.cos(point) * B.foot), U, -Math.sin(point) * B.foot - B.ankle * 0.4) });
    }
    JOINTS.forEach((name, i) => out.set(at[name], i * 3));
    return out;
  }

  // One pose part of the way to another
  const between = (a, b, k) => {
    const A = { ...rest(), ...a }, Z = { ...rest(), ...b }, out = {};
    for (const name in A) out[name] = Array.isArray(A[name]) ? A[name].map((v, i) => v + (Z[name][i] - v) * k) : A[name] + (Z[name] - A[name]) * k;
    return out;
  };

  // Standing, breathing: u goes 0 to 1 once a breath
  const stand = (u = 0) => ({ ...rest(), hip: [0, B.stand - 0.004 * (1 - Math.cos(u * TAU)), 0], lean: 0.02 * Math.sin(u * TAU) });

  // A stride. u goes 0 to 1 over two steps. `travel` on the result is how far the body goes in one cycle: move the hips by
  // that much each cycle and the planted foot stays where it is on the ground; leave them still and it walks on the spot.
  //   length  how far apart the feet land       lift   how high a foot comes off the ground       planted  the share of the cycle a foot is down
  //   dip     how far the hips sink             hop    how far they rise clear, for a run          peak     when in the cycle they are highest
  //   swing   how far the arms swing, as an angle      bent   how bent the elbows are held, 0 to 1      kick     how far the heel flicks up behind
  //   straight  how nearly straight the standing leg gets as the body passes over it, 0 to 1
  function stride(u, { length, lift, planted, lean, dip, hop, peak, swing, bent, kick, straight }) {
    const drop = Math.sqrt(Math.max(0.01, (B.leg - 0.008) ** 2 - (length / 2) ** 2));   // the hips ride lower the longer the stride, otherwise a leg is pulled straight
    const pose = { ...rest(), lean, travel: length / planted }, wave = Math.cos((u - peak) * 2 * TAU);
    // Over a planted foot the hips vault as far as that leg allows, like a pair of compasses
    let vault = B.leg;
    for (const start of [0, 0.5]) { const at = wrap(u + start); if (at < planted) vault = Math.min(vault, Math.sqrt((B.leg - 0.008) ** 2 - (length * (0.5 - at / planted)) ** 2)); }
    pose.hip = [0, B.ankle + drop + (vault - drop) * straight - dip * 0.5 * (1 - wave) + hop * Math.max(0, wave) ** 2, 0];
    for (const [side, start] of [['L', 0], ['R', 0.5]]) {
      const at = wrap(u + start), floor = -(pose.hip[1] - B.ankle);   // the ground, measured from the hips
      if (at < planted) pose['foot' + side] = [length * (0.5 - at / planted), floor, 0];   // on the ground, carried back at the speed the body goes forward
      else {
        const air = (at - planted) / (1 - planted);
        pose['foot' + side] = [length * (ease(air) - 0.5), Math.min(-0.12, floor + lift * Math.sin(air * Math.PI) + kick * Math.sin(Math.min(1, air * 1.7) * Math.PI)), 0];
        pose['toe' + side] = 0.7 * Math.sin(air * Math.PI) * (1 - air);
      }
      // Each arm is furthest forward as its own leg is furthest back, swinging from the shoulder like a pendulum
      const angle = swing * Math.cos((at - planted) * TAU), hang = B.arm * (1 - 0.5 * bent);
      pose['hand' + side] = [hang * Math.sin(angle) + bent * 0.1, -hang * Math.cos(angle), 0.03];
    }
    // The shoulders turn with the arms
    pose.twist = -0.12 * Math.cos((u - planted) * TAU);
    return pose;
  }
  const walk = (u, { length = 0.32, lift = 0.06 } = {}) => stride(wrap(u), { length, lift, planted: 0.6, lean: 0.05, dip: 0, hop: 0, peak: 0.25, swing: 0.5, bent: 0.1, kick: 0, straight: 0.7 });
  // Running: both feet off the ground between steps, the body pitched into it, elbows held bent
  const run = (u, { length = 0.5, lift = 0.09 } = {}) => stride(wrap(u), { length, lift, planted: 0.38, lean: 0.24, dip: 0.03, hop: 0.05, peak: 0.44, swing: 0.9, bent: 0.9, kick: 0.14, straight: 0 });

  // Front crawl, lying face down along +x. u goes 0 to 1 over one stroke of each arm; the legs kick six times to it.
  function crawl(u, { depth = 0 } = {}) {
    u = wrap(u);
    const pose = { ...rest(), pitch: Math.PI / 2, hip: [0, depth, 0], roll: -0.45 * Math.sin(u * TAU), nod: -0.5, lean: -0.06 };   // rolled toward whichever arm is pulling
    for (const [side, start] of [['L', 0], ['R', 0.5]]) {
      const at = wrap(u + start), round = at * TAU;
      // Half the stroke it pulls, long and deep under the body; the other half it comes back over the water, elbow high
      const pulling = at < 0.5, deep = pulling ? 0.88 : 0.42;
      pose['hand' + side] = [Math.sin(round) * B.arm * deep, Math.cos(round) * B.arm * 0.96, 0.04];
      pose['foot' + side] = [0.07 * Math.sin((u * 3 + start) * TAU), -B.leg * 0.985, 0.01];
      pose['toe' + side] = 1.35;
    }
    return pose;
  }

  return { bones: B, rest, joints, between, stand, walk, run, crawl };
}

// The figure for a shader. Hand joints() to uJ. figure(p) is how far a point is from it, in the figure's own space (it stands 1 tall):
// for a figure of another size at another place, ask figure((p - place) / size) * size.
// figurePart(p) says what a point on it is: 0 skin, 1 hair, 2 top, 3 trousers, 4 shoes.
export const glsl = /* glsl */`
uniform vec3 uJ[18];
uniform float uHead;   // the head's radius
float figRod(vec3 p, vec3 a, vec3 b, float ra, float rb) { vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - mix(ra, rb, h); }
float figJoin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
float figHead(vec3 p) { return length(p - uJ[3]) - uHead; }
float figArm(vec3 p, int s) { return figJoin(figRod(p, uJ[s], uJ[s + 1], 0.036, 0.03), figJoin(figRod(p, uJ[s + 1], uJ[s + 2], 0.03, 0.024), length(p - uJ[s + 2]) - 0.03, 0.012), 0.012); }
float figLeg(vec3 p, int s) { return figJoin(figRod(p, uJ[s], uJ[s + 1], 0.056, 0.042), figRod(p, uJ[s + 1], uJ[s + 2], 0.042, 0.03), 0.014); }
float figFoot(vec3 p, int ankle, int toe) { return figRod(p, uJ[ankle], uJ[toe], 0.034, 0.028); }
float figTrunk(vec3 p) { return figJoin(figRod(p, uJ[0] + (uJ[1] - uJ[0]) * 0.08, uJ[1] - (uJ[1] - uJ[0]) * 0.1, 0.082, 0.094), figRod(p, uJ[1], uJ[2], 0.034, 0.032), 0.03); }
float figure(vec3 p) {
  float d = figJoin(figTrunk(p), figHead(p), 0.012);
  d = figJoin(d, min(figArm(p, 4), figArm(p, 7)), 0.02);
  d = figJoin(d, min(figLeg(p, 10), figLeg(p, 13)), 0.03);
  return min(d, min(figFoot(p, 12, 16), figFoot(p, 15, 17)));
}
int figurePart(vec3 p) {
  float head = figHead(p), trunk = figTrunk(p), legs = min(figLeg(p, 10), figLeg(p, 13)), feet = min(figFoot(p, 12, 16), figFoot(p, 15, 17));
  float sleeves = min(figRod(p, uJ[4], uJ[5], 0.036, 0.03), figRod(p, uJ[7], uJ[8], 0.036, 0.03));
  float arms = min(figArm(p, 4), figArm(p, 7)), nearest = min(min(head, trunk), min(min(legs, feet), arms));
  if (nearest == feet) return 4;
  if (nearest == legs) return 3;
  // Hair over the top and down the back of the head; the face is what is left
  if (nearest == head) { vec3 up = normalize(uJ[3] - uJ[2]), front = normalize(cross(up, uJ[4] - uJ[7])), d = (p - uJ[3]) / uHead; return dot(d, up) > 0.3 || dot(d, front) < -0.3 ? 1 : 0; }
  if (nearest == arms) return sleeves - arms < 0.004 ? 2 : 0;
  return 2;
}
`;
