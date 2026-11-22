const module = { exports: {} };
(function (module, exports) {
// A jade chrysalis hanging from a bent twig over a tuft of grass. It sways, and once a loop something inside it kicks.
module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => {
  const params = { grass: [0.3, 0.05, 0.8, 0.01], sway: [1, 0, 3, 0.1], kick: [1, 0, 3, 0.1] };
  const LOOP = 6, TAU = Math.PI * 2;
  return {
    id: 'chrysalis',
    name: 'Chrysalis',
    seed: 4,
    loop: LOOP,
    params,
    // With no app to hand over the knobs, each starts where it is written
    build(seed, P = Object.fromEntries(Object.entries(params).map(([name, k]) => [name, Array.isArray(k) ? k[0] : k?.value ?? k]))) {
      // 0 paper; 1-4 bark; 5-9 jade; 10-12 gold; 13-17 grass; 18-21 ladybird red; 22-24 ladybird black
      const palette = [
        0xffffff,
        0x3b2416, 0x5e3b23, 0x8a5a36, 0xb07d4f,
        0x0f4a3c, 0x1c7359, 0x3fa57a, 0x8ad6a3, 0xd4f5d0,
        0xb8791a, 0xf2c14a, 0xfff0a8,
        0x174a25, 0x2a7a30, 0x49a63a, 0x7fcf4d, 0xb9ea6e,
        0x7a1410, 0xc0241c, 0xe8402a, 0xff7a55,
        0x140c10, 0x2a1e24, 0x4a3a40
      ];
      const B = makeBuilder(seed, palette);
      const S = K.sculpt(makeSculpt(B)), rig = K.rig(B, S);
      const bark = { r: [1, 2, 3, 4] }, jade = { r: [5, 6, 7, 8, 9] }, gold = { r: [10, 11, 12], em: true };

      // The grass leans far enough to see, twice a loop
      S.ground({ r: [13, 14, 15, 16, 17], blade: { h: P.grass, w: 0.045 }, fl: { k: 11, ph: 1, sp: TAU * 2 / LOOP, rg: 0.07 } }, { rad: 3.0, res: 0.08 });
      S.tube([[-1.5, 0, 0], [-1.7, 1.4, 0], [-1.3, 2.7, 0], [-0.4, 3.5, 0], [0.5, 3.45, 0], [1.1, 3.1, 0]], 0.2, 0.05, bark, { res: 0.07 });
      S.ball([1.35, 3.05, 0], [0.34, 0.05, 0.16], { r: [14, 15, 16, 17] }, { res: 0.06 });

      // The chrysalis is one part, hung from where its stalk meets the twig
      const hang = [0.5, 3.3, 0], long = 1.7, pupa = { tag: 'pupa' };
      S.tube([hang, [hang[0], hang[1] - 0.25, 0]], 0.04, 0.05, jade, { res: 0.05, ...pupa });
      const girth = t => 0.04 + 0.5 * Math.pow(Math.sin(Math.PI * Math.pow(1 - t, 0.62)), 0.75);
      S.lathe([hang[0], hang[1] - 0.2 - long, 0], long, girth, jade, { res: 0.06, ...pupa });
      const y = hang[1] - 0.2 - long * 0.3, r = girth(0.7) * 0.98;
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * TAU;
        S.ball([hang[0] + Math.cos(a) * r, y, Math.sin(a) * r], 0.055, gold, { res: 0.04, ...pupa });
      }

      // The ladybird is one part, made facing right with its feet on the twig at the left end of its walk
      const walkA = -0.35, walkB = 0.4, twigTop = x => 3.5 - 0.056 * (x + 0.4) + 0.093 - 0.027 * (x + 0.4);
      const feet = [walkA, twigTop(walkA), 0], bug = { tag: 'bug' }, red = { r: [18, 19, 20, 21] }, black = { r: [22, 23, 24] };
      S.ball([feet[0], feet[1] + 0.04, 0], [0.12, 0.09, 0.1], red, { res: 0.04, ...bug });
      S.ball([feet[0] + 0.11, feet[1] + 0.03, 0], 0.05, black, { res: 0.04, ...bug });
      for (const [sx, sy, sz] of [[-0.04, 0.09, 0.07], [0.04, 0.1, 0.06], [-0.01, 0.125, 0], [-0.04, 0.09, -0.07], [0.04, 0.1, -0.06]])
        S.ball([feet[0] + sx, feet[1] + sy, sz], 0.028, black, { res: 0.04, ...bug });
      S.bake();

      const W = B.finish({ cam: { target: [0, 1.75, 0], dist: 9.5, pitch: 0.24, yaw: 0.35 }, detail: 14, dither: 0.35, radius: 5 });
      const st = K.stage(W);
      rig.bind(st);
      st.add({
        update(dt, t) {
          const u = ((t % LOOP) + LOOP) % LOOP, k = u - 3.4;
          const kick = k > 0 && k < 1.4 ? Math.sin(k * 26) * Math.exp(-k * 3.2) * 0.22 * P.kick : 0;
          const side = 0.05 * P.sway * Math.sin(u / LOOP * TAU), fore = 0.03 * P.sway * Math.sin(u / LOOP * TAU * 2 + 1);
          rig.set('pupa', K.M.mul(K.M.rot([0, 0, 1], side + kick), K.M.rot([1, 0, 0], fore + kick * 0.5)), hang, hang);
          // The ladybird walks out along the twig, turns round, walks back and turns again
          const ease = v => v * v * (3 - 2 * v);
          const go = u < 2.4 ? ease(u / 2.4) : u < 3 ? 1 : u < 5.4 ? 1 - ease((u - 3) / 2.4) : 0;
          const yaw = u < 2.4 ? 0 : u < 3 ? Math.PI * ease((u - 2.4) / 0.6) : u < 5.4 ? Math.PI : Math.PI * (1 + ease((u - 5.4) / 0.6));
          const bx = walkA + (walkB - walkA) * go, waddle = 0.15 * Math.sin(go * TAU * 6);
          rig.set('bug', K.M.mul(K.M.rot([0, 0, 1], -0.083), K.M.mul(K.M.rot([0, 1, 0], yaw), K.M.rot([1, 0, 0], waddle))), feet, [bx, twigTop(bx), 0]);
          rig.apply();
        }
      });
      return W;
    }
  };
};

})(module, module.exports);
export default module.exports;