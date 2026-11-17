// VEXORA · Ep 01 · PEN VS. ERASER — 9:16, timed to the ElevenLabs narration (words.js).
// renderAt(t) is pure (no state between frames), so frames can render in any order.
const W = 1080, H = 1920, DUR = 64.0;
const cv = document.getElementById('c'), g = cv.getContext('2d');
const C = { ink: '#0E1624', orange: '#E8692A', cyan: '#38E1FF', gold: '#F2B33D', goldHi: '#FFE7A8', violet: '#4B2E9E', violetHi: '#7A5BD6', skin: '#FBE3CC', porcelain: '#EEF0F6', brass: '#C9A24A', silver: '#E9EEF2' };
const FY = 1450;                              // roof line
const KX = 330, HX = 790;                     // home marks
const D = Math.PI / 180;

// ---------------- maths ----------------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const E = {
  lin: k => k, io: k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2,
  out: k => 1 - Math.pow(1 - k, 3), in: k => k * k * k, hold: k => 0, snap: k => k < .5 ? 0 : 1,
  back: k => { const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
};
function mix(a, b, k) {
  if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, k);
  if (Array.isArray(a)) return a.map((v, i) => mix(v, b[i], k));
  if (a && typeof a === 'object') { const o = {}; for (const key in a) o[key] = key in b ? mix(a[key], b[key], k) : a[key]; for (const key in b) if (!(key in a)) o[key] = b[key]; return o; }
  return k < .5 ? a : b;
}
function track(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    if (t < t1) { const [t0, v0] = keys[i - 1]; return mix(v0, v1, (E[e || 'io'])((t - t0) / (t1 - t0))); }
  }
  return keys[keys.length - 1][1];
}
function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
const win = (t, a, b) => t >= a && t < b;
const ramp = (t, a, b) => clamp((t - a) / (b - a));

// ---------------- story clock (seconds = narration times) ----------------
const DELETES = [0.9, 10.3, 16.35, 20.75, 28.35, 39.8, 42.3, 49.35];          // Kip's glove fires
const WHIPS = [2.2, 6.25, 9.85, 12.65, 15.05, 21.05, 31.55, 35.25, 37.8, 50.1, 57.85, 61.3];
const SHOTS = [ // [start, env]
  [0, 'roof'], [31.55, 'wall'], [37.8, 'roof'], [50.1, 'fall'], [63.45, 'black'],
];
const env = t => { let e = 'roof'; for (const [a, n] of SHOTS) if (t >= a) e = n; return e; };
function gloveDigit(t) { // 3-2-1 after each delete, then READY
  let last = -99; for (const d of DELETES) if (t >= d) last = d;
  const k = t - last; return k < 3 ? 3 - Math.floor(k) : 0;
}
const ROOF_GONE = 49.35;
const roofGone = t => t < ROOF_GONE ? 0 : clamp((t - ROOF_GONE) / .5);

// ---------------- skeleton ----------------
const P = {
  stand: { torso: 3, head: 0, ra1: -6, ra2: -2, la1: 8, la2: 4, rl1: 10, rl2: 4, ll1: -9, ll2: -3 },
  ready: { torso: 10, head: -4, ra1: 40, ra2: 140, la1: 60, la2: 120, rl1: 22, rl2: -8, ll1: -20, ll2: -30 },
  point: { torso: 8, head: -2, ra1: 20, ra2: 70, la1: 88, la2: 90, rl1: 22, rl2: -6, ll1: -20, ll2: -28 },
  draw1: { torso: 2, head: -6, ra1: 120, ra2: 150, la1: -10, la2: -4, rl1: 12, rl2: 4, ll1: -12, ll2: -4 },
  draw2: { torso: 6, head: 4, ra1: 70, ra2: 40, la1: -10, la2: -4, rl1: 12, rl2: 4, ll1: -12, ll2: -4 },
  oneFinger: { torso: 0, head: -8, ra1: 30, ra2: 175, la1: -8, la2: -4, rl1: 10, rl2: 4, ll1: -10, ll2: -3 },
  throw: { torso: 22, head: 6, ra1: 110, ra2: 100, la1: -40, la2: -20, rl1: 30, rl2: 0, ll1: -30, ll2: -40 },
  boxed: { torso: -2, head: 8, ra1: 150, ra2: 170, la1: -150, la2: -170, rl1: 14, rl2: 4, ll1: -14, ll2: -4 },
  crouch: { torso: 42, head: -20, ra1: -10, ra2: 30, la1: 40, la2: 10, rl1: 80, rl2: -20, ll1: -10, ll2: -70 },
  slap: { torso: 60, head: -40, ra1: -20, ra2: 20, la1: 25, la2: 5, rl1: 85, rl2: -15, ll1: -5, ll2: -75 },
  run: { torso: 18, head: -8, ra1: 50, ra2: 120, la1: -40, la2: 40, rl1: 30, rl2: -20, ll1: -30, ll2: -60 },
  spread: { torso: 0, head: 0, ra1: 115, ra2: 135, la1: -115, la2: -135, rl1: 28, rl2: 12, ll1: -28, ll2: -12 },
  hang: { torso: 0, head: 22, ra1: 165, ra2: 172, la1: -165, la2: -172, rl1: 8, rl2: 4, ll1: -8, ll2: -2 },
  reach: { torso: 10, head: 30, ra1: 48, ra2: 22, la1: -165, la2: -172, rl1: 8, rl2: 4, ll1: -8, ll2: -2 },
  reachUp: { torso: 0, head: -30, ra1: 20, ra2: 10, la1: 170, la2: 175, rl1: 28, rl2: 12, ll1: -28, ll2: -12 },
};
const SK = { torso: 170, head: 72, hr: 60, ua: 95, fa: 90, th: 112, sh: 108 };
const pol = (o, len, a) => [o[0] + len * Math.sin(a * D), o[1] + len * Math.cos(a * D)];
function skel(p) {
  const hip = [0, 0];
  const neck = [SK.torso * Math.sin(p.torso * D), -SK.torso * Math.cos(p.torso * D)];
  const hd = (p.torso + p.head) * D;
  const headC = [neck[0] + SK.head * Math.sin(hd), neck[1] - SK.head * Math.cos(hd)];
  const sh = [neck[0] * .86, neck[1] * .86];
  const re = pol(sh, SK.ua, p.ra1), rh = pol(re, SK.fa, p.ra2);
  const le = pol(sh, SK.ua, p.la1), lh = pol(le, SK.fa, p.la2);
  const rk = pol(hip, SK.th, p.rl1), rf = pol(rk, SK.sh, p.rl2);
  const lk = pol(hip, SK.th, p.ll1), lf = pol(lk, SK.sh, p.ll2);
  return { hip, neck, headC, sh, re, rh, le, lh, rk, rf, lk, lf };
}
function toWorld(pt, b) {
  const c = Math.cos(b.rot * D), s = Math.sin(b.rot * D), sc = b.sc || 1, x = pt[0] * (b.dir || 1);
  return [b.x + (x * c - pt[1] * s) * sc, b.y + (x * s + pt[1] * c) * sc];
}

// ---------------- actor tracks (global time) ----------------
const KHY = FY - 220, HHY = FY - 220 * 1.12;
const KIP = [
  [0, { x: KX, y: KHY, rot: 0, pose: P.ready }],
  [0.7, { x: KX, y: KHY, rot: 0, pose: P.point }, 'out'],
  [1.6, { x: KX, y: KHY, rot: 0, pose: P.point }],
  [2.4, { x: KX, y: KHY, rot: 0, pose: P.ready }],
  [10.0, { x: KX, y: KHY, rot: 0, pose: P.ready }],
  [10.25, { x: KX, y: KHY, rot: 0, pose: P.point }, 'out'],
  [11.4, { x: KX, y: KHY, rot: 0, pose: P.point }],
  [12.2, { x: KX, y: KHY, rot: 0, pose: P.ready }],
  [15.3, { x: KX, y: KHY, rot: 0, pose: P.ready }],
  [16.2, { x: 380, y: KHY, rot: 0, pose: P.point }, 'out'],
  [17.4, { x: 400, y: KHY, rot: 0, pose: P.ready }],
  [17.5, { x: 210, y: KHY, rot: 0, pose: P.ready }, 'snap'],     // REWIND jump
  [19.2, { x: 210, y: KHY, rot: 0, pose: P.ready }],
  [19.9, { x: 210, y: KHY, rot: 0, pose: P.boxed }, 'out'],
  [20.6, { x: 210, y: KHY, rot: 0, pose: P.boxed }],
  [20.75, { x: 210, y: KHY, rot: 0, pose: P.point }, 'out'],
  [22.3, { x: 210, y: KHY, rot: 0, pose: P.ready }],
  [23.9, { x: 210, y: KHY, rot: 0, pose: P.ready }],
  [24.05, { x: 330, y: KHY, rot: 0, pose: P.ready }, 'snap'],    // grid hops
  [24.5, { x: 330, y: KHY, rot: 0, pose: P.ready }],
  [24.65, { x: 330, y: KHY - 120, rot: 0, pose: P.boxed }, 'snap'],
  [25.0, { x: 330, y: KHY - 120, rot: 0, pose: P.boxed }],
  [25.15, { x: 450, y: KHY, rot: 0, pose: P.ready }, 'snap'],
  [26.5, { x: 450, y: KHY, rot: 0, pose: P.stand }],
  [27.4, { x: 450, y: KHY, rot: 0, pose: { ...P.stand, head: -30 } }],
  [28.2, { x: 450, y: KHY, rot: 0, pose: { ...P.point, la1: 150, la2: 150, head: -30 } }, 'out'],
  [29.6, { x: 450, y: KHY, rot: 0, pose: { ...P.point, la1: 150, la2: 150, head: -30 } }],
  [30.3, { x: 450, y: KHY, rot: 0, pose: P.crouch }, 'io'],
  [30.55, { x: 450, y: KHY + 30, rot: 0, pose: P.slap }, 'in'],
  [31.2, { x: 450, y: KHY + 30, rot: 0, pose: P.slap }],
  [31.55, { x: 300, y: KHY, rot: 0, pose: P.ready }, 'hold'],    // WALL scene (rotated camera)
  [32.4, { x: 300, y: KHY, rot: 0, pose: P.run }],
  [33.6, { x: 560, y: KHY, rot: 0, pose: P.run }, 'io'],
  [34.0, { x: 560, y: KHY + 40, rot: 0, pose: P.crouch }, 'out'],
  [34.6, { x: 580, y: KHY, rot: 0, pose: P.point }, 'out'],
  [37.8, { x: 420, y: KHY, rot: 0, pose: P.ready }, 'hold'],     // back on the roof
  [38.9, { x: 420, y: KHY, rot: 0, pose: P.boxed }, 'out'],
  [39.6, { x: 420, y: KHY, rot: 0, pose: P.boxed }],
  [39.8, { x: 420, y: KHY, rot: 0, pose: P.point }, 'out'],
  [41.0, { x: 420, y: KHY, rot: 0, pose: P.ready }],
  [42.6, { x: 420, y: KHY + 20, rot: 0, pose: { ...P.boxed, torso: -8 } }],
  [43.0, { x: 420, y: KHY + 10, rot: 0, pose: P.point }, 'out'],
  [45.0, { x: 420, y: KHY + 10, rot: 0, pose: P.point }],
  [46.6, { x: 420, y: KHY + 20, rot: 0, pose: { ...P.stand, head: 30 } }],
  [48.6, { x: 420, y: KHY + 10, rot: 0, pose: P.crouch }, 'io'],
  [49.35, { x: 420, y: KHY + 30, rot: 0, pose: P.slap }, 'in'],
  [49.95, { x: 420, y: KHY + 30, rot: 0, pose: P.slap }],
  [50.1, { x: 430, y: 1150, rot: -20, pose: P.spread }, 'hold'],  // FALL scene
  [53.6, { x: 460, y: 1180, rot: 30, pose: P.spread }],
  [57.8, { x: 470, y: 1250, rot: 10, pose: { ...P.spread, head: -30 } }],
  [57.85, { x: 540, y: 1450, rot: 0, pose: P.reachUp }, 'hold'],
  [61.3, { x: 540, y: 1420, rot: 0, pose: P.reachUp }],
];
const HEX = [
  [0, { x: HX, y: HHY, rot: 0, pose: P.stand }],
  [4.1, { x: HX, y: HHY, rot: 0, pose: P.stand }],
  [4.35, { x: HX, y: HHY, rot: 0, pose: P.draw1 }, 'out'],
  [4.65, { x: HX, y: HHY, rot: 0, pose: P.draw2 }, 'io'],
  [4.95, { x: HX, y: HHY, rot: 0, pose: P.draw1 }, 'io'],
  [5.6, { x: HX, y: HHY, rot: 0, pose: P.stand }],
  [7.9, { x: HX, y: HHY, rot: 0, pose: P.stand }],
  [8.2, { x: HX, y: HHY, rot: 0, pose: P.draw1 }, 'out'],
  [8.75, { x: HX, y: HHY, rot: 0, pose: P.draw2 }, 'io'],
  [9.5, { x: HX, y: HHY, rot: 0, pose: P.stand }],
  [13.3, { x: HX, y: HHY, rot: 0, pose: P.stand }],
  [13.7, { x: HX, y: HHY, rot: 0, pose: P.oneFinger }, 'back'],
  [14.9, { x: HX, y: HHY, rot: 0, pose: P.oneFinger }],
  [15.1, { x: HX, y: HHY, rot: 0, pose: P.draw1 }, 'out'],
  [15.45, { x: HX, y: HHY, rot: 0, pose: P.draw2 }],
  [15.7, { x: HX, y: HHY, rot: 0, pose: P.throw }, 'out'],
  [16.6, { x: HX, y: HHY, rot: 0, pose: P.stand }],
  [19.0, { x: HX, y: HHY, rot: 0, pose: P.draw1 }, 'out'],
  [19.6, { x: HX, y: HHY, rot: 0, pose: P.draw2 }],
  [20.2, { x: HX, y: HHY, rot: 0, pose: P.draw1 }],
  [21.6, { x: HX, y: HHY, rot: 0, pose: P.draw1 }],
  [22.0, { x: HX, y: HHY, rot: 0, pose: P.throw }, 'out'],
  [23.0, { x: HX, y: HHY, rot: 0, pose: P.stand }],
  [31.55, { x: 980, y: HHY, rot: 0, pose: P.ready }, 'hold'],  // wall
  [33.6, { x: 820, y: HHY, rot: 0, pose: P.ready }],
  [34.0, { x: 820, y: HHY, rot: 0, pose: P.draw2 }, 'out'],
  [35.6, { x: 820, y: HHY, rot: 0, pose: P.stand }],
  [36.5, { x: 820, y: HHY, rot: 0, pose: P.draw1 }, 'out'],
  [37.2, { x: 820, y: HHY, rot: 0, pose: P.draw2 }],
  [37.8, { x: HX + 40, y: HHY, rot: 0, pose: P.stand }, 'hold'],  // roof
  [38.3, { x: HX + 40, y: HHY, rot: 0, pose: P.draw1 }, 'out'],
  [38.9, { x: HX + 40, y: HHY, rot: 0, pose: P.draw2 }],
  [40.2, { x: HX + 40, y: HHY, rot: 0, pose: P.stand }],
  [42.2, { x: HX + 40, y: HHY, rot: 0, pose: P.draw1 }, 'out'],
  [42.7, { x: HX + 40, y: HHY, rot: 0, pose: P.draw2 }],
  [43.4, { x: HX + 40, y: HHY, rot: 0, pose: P.stand }],
  [50.1, { x: 690, y: 820, rot: 25, pose: P.spread }, 'hold'],     // fall
  [52.75, { x: 640, y: 900, rot: -10, pose: { ...P.spread, ra1: 90, ra2: 90 } }],
  [54.2, { x: 640, y: 880, rot: 0, pose: P.draw1 }],
  [55.0, { x: 640, y: 860, rot: 0, pose: P.hang }],
  [55.35, { x: 640, y: 300, rot: 0, pose: P.hang }, 'out'],         // chute yanks him up
  [57.8, { x: 640, y: 280, rot: 0, pose: P.hang }],
  [57.85, { x: 540, y: 600, rot: 0, pose: P.hang }, 'hold'],
  [59.5, { x: 540, y: 600, rot: 0, pose: P.hang }],
  [60.5, { x: 540, y: 600, rot: 0, pose: P.reach }, 'out'],
  [61.3, { x: 540, y: 600, rot: 0, pose: P.reach }],
];
function overlays(p, t, who) {
  let o = { ...p };
  if (who === 'kip' && win(t, 32.4, 33.6)) { const a = Math.sin(t * 16) * 30; o.rl1 += a; o.ll1 -= a; o.ra1 += a * .6; o.la1 -= a * .6; }
  if ((who === 'kip' || who === 'hex') && env(t) === 'fall' && t < 54.2) { const s = Math.sin(t * 6 + (who === 'hex' ? 2 : 0)) * 16; o.ra1 += s; o.la1 -= s; o.rl1 += s * .6; o.ll1 -= s * .6; }
  if (who === 'hex' && (win(t, 4.3, 5.0) || win(t, 8.1, 8.8) || win(t, 19.0, 21.6) || win(t, 38.3, 38.9) || win(t, 42.2, 42.7) || win(t, 36.5, 37.2) || win(t, 54.2, 55.0))) { o.ra1 += Math.sin(t * 30) * 22; o.ra2 += Math.cos(t * 30) * 28; }
  o.torso += Math.sin(t * 2.6 + (who === 'hex' ? 1 : 0)) * 1.2;
  return o;
}
function actor(who, t) {
  const b = track(who === 'kip' ? KIP : HEX, t);
  const dir = who === 'hex' ? -1 : 1, sc = who === 'hex' ? 1.12 : 1;
  let rot = b.rot + (env(t) === 'fall' && t < 57.85 ? Math.sin(t * 1.3 + (who === 'hex' ? 1 : 0)) * 8 : 0);
  return { x: b.x, y: b.y, rot, sc, dir, pose: overlays(b.pose, t, who) };
}
function joints(b) { const k = skel(b.pose), w = {}; for (const key in k) w[key] = toWorld(k[key], b); return w; }

// ---------------- faces ----------------
const KFACE = [
  [0, { look: [.35, 0], eyes: 'ring', brow: [14, -14], lift: 8, mouth: 'o' }],
  [1.0, { look: [.35, 0], eyes: 'dot', brow: [-10, 10], lift: 0, mouth: 'line' }, 'out'],
  [10.3, { look: [.35, .1], eyes: 'dot', brow: [-6, 6], lift: 0, mouth: 'smirk' }],
  [16.3, { look: [.4, 0], eyes: 'dot', brow: [-12, 12], lift: -2, mouth: 'line' }],
  [17.5, { look: [.4, 0], eyes: 'ring', brow: [14, -14], lift: 8, mouth: 'o' }],
  [18.4, { look: [.4, 0], eyes: 'dot', brow: [0, -18], lift: 4, mouth: 'smirk' }],
  [19.9, { look: [0, -.2], eyes: 'ring', brow: [16, -16], lift: 10, mouth: 'o' }],
  [21.0, { look: [.4, 0], eyes: 'dot', brow: [-12, 12], lift: -2, mouth: 'line' }],
  [22.4, { look: [0, -.3], eyes: 'ring', brow: [16, -16], lift: 10, mouth: 'o' }],
  [26.4, { look: [0, 0], eyes: 'half', brow: [0, 0], lift: 0, mouth: 'line' }],
  [27.3, { look: [.2, -.45], eyes: 'dot', brow: [0, -18], lift: 4, mouth: 'smirk' }],
  [30.2, { look: [.3, .4], eyes: 'dot', brow: [-14, 14], lift: -2, mouth: 'line' }],
  [33.5, { look: [.4, 0], eyes: 'dot', brow: [-14, 14], lift: -2, mouth: 'line' }],
  [36.6, { look: [.3, -.2], eyes: 'half', brow: [0, 0], lift: 0, mouth: 'line' }],
  [38.9, { look: [0, 0], eyes: 'ring', brow: [16, -16], lift: 10, mouth: 'o' }],
  [39.7, { look: [.4, 0], eyes: 'dot', brow: [-14, 14], lift: -2, mouth: 'line' }],
  [40.6, { look: [0, -.1], eyes: 'ring', brow: [16, -16], lift: 10, mouth: 'o' }],
  [42.6, { look: [0, 0], eyes: 'pin', brow: [20, -20], lift: 14, mouth: 'o' }],
  [45.4, { look: [.1, .5], eyes: 'dot', brow: [-6, 6], lift: 0, mouth: 'line' }],
  [47.6, { look: [0, 0], eyes: 'dot', brow: [0, -18], lift: 4, mouth: 'smirk' }],
  [49.4, { look: [.1, .4], eyes: 'half', brow: [-14, 14], lift: -2, mouth: 'line' }],
  [50.1, { look: [0, -.2], eyes: 'ring', brow: [18, -18], lift: 12, mouth: 'o' }],
  [55.3, { look: [.2, -.5], eyes: 'pin', brow: [22, -22], lift: 14, mouth: 'o' }],
  [57.85, { look: [0, -.5], eyes: 'ring', brow: [14, -14], lift: 8, mouth: 'line' }],
];
const HFACE = [
  [0, { look: [.3, 0], eyes: 'narrow', mouth: 'smirk' }],
  [7.0, { look: [0, 0], eyes: 'narrow', mouth: 'smirk' }],
  [8.3, { look: [.4, .1], eyes: 'narrow', mouth: 'flat' }],
  [13.6, { look: [0, 0], eyes: 'narrow', mouth: 'smirk' }],
  [16.4, { look: [.35, 0], eyes: 'open', mouth: 'flat' }],
  [18.5, { look: [.35, 0], eyes: 'narrow', mouth: 'flat' }],
  [28.4, { look: [-.1, -.4], eyes: 'open', mouth: 'flat' }],
  [33.0, { look: [.35, 0], eyes: 'narrow', mouth: 'flat' }],
  [36.0, { look: [0, 0], eyes: 'closed', mouth: 'flat' }],
  [37.0, { look: [0, 0], eyes: 'narrow', mouth: 'smirk' }],
  [49.4, { look: [.2, .5], eyes: 'open', mouth: 'o' }],
  [50.1, { look: [0, .2], eyes: 'open', mouth: 'o' }],
  [52.8, { look: [.1, 0], eyes: 'narrow', mouth: 'flat' }],
  [57.85, { look: [0, .6], eyes: 'narrow', mouth: 'flat' }],
  [59.6, { look: [0, .6], eyes: 'open', mouth: 'flat' }],
];

// ---------------- drawing utils ----------------
function line(a, b) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
function limb(a, b, c) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.stroke(); }
function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function lingrad(x0, y0, x1, y1, st) { const q = g.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; }
function contactShadow(x, w, a = .5) {
  const s = g.createRadialGradient(x, FY + 6, 4, x, FY + 6, w);
  s.addColorStop(0, `rgba(0,4,12,${a})`); s.addColorStop(1, 'rgba(0,4,12,0)');
  g.save(); g.translate(x, FY + 6); g.scale(1, .16); g.translate(-x, -(FY + 6)); g.fillStyle = s; g.beginPath(); g.arc(x, FY + 6, w, 0, 7); g.fill(); g.restore();
}

// ---------------- characters ----------------
function drawKip(t, dk = 0) {
  const b = actor('kip', t), w = joints(b), f = track(KFACE, t);
  if (env(t) !== 'fall' && roofGone(t) < 1) contactShadow(b.x + 8, 120, .55);
  g.lineCap = 'round'; g.lineJoin = 'round';
  // scarf tails
  const b2 = actor('kip', t - .07), n2 = toWorld(skel(b2.pose).neck, b2);
  const vx = (w.neck[0] - n2[0]) / .07, vy = (w.neck[1] - n2[1]) / .07;
  const up = env(t) === 'fall' ? -1 : 1;
  for (let i = 0; i < 2; i++) {
    const L = 95 - i * 18, fl = Math.sin(t * 11 + i * 1.7) * 16;
    const dx = clamp(-vx * .09, -80, 80) - 26 - i * 10 - 30, dy = clamp(-vy * .09, -90, 90) + 50 * up;
    const m = Math.hypot(dx, dy) || 1, ux = dx / m, uy = dy / m;
    const end = [w.neck[0] + ux * L, w.neck[1] + 10 + uy * L], mid = [w.neck[0] + ux * L * .5 - uy * fl, w.neck[1] + 10 + uy * L * .5 + ux * fl];
    g.strokeStyle = i ? '#B9501F' : C.orange; g.lineWidth = 22 - i * 4;
    g.beginPath(); g.moveTo(w.neck[0], w.neck[1] + 10); g.quadraticCurveTo(mid[0], mid[1], end[0], end[1]); g.stroke();
  }
  g.strokeStyle = C.ink; g.lineWidth = 20; g.globalAlpha = .92;
  limb(w.hip, w.lk, w.lf); limb(w.sh, w.le, w.lh); g.globalAlpha = 1;
  g.lineWidth = 22; line(w.hip, w.neck);
  g.strokeStyle = C.orange; g.lineWidth = 26; line([w.neck[0] - 4, w.neck[1] + 12], [w.neck[0] + 6, w.neck[1] + 4]);
  g.strokeStyle = C.ink; g.lineWidth = 20; limb(w.hip, w.rk, w.rf); limb(w.sh, w.re, w.rh);
  drawGlove(w.lh, t);
  kipHead(w.headC, (b.rot + b.pose.torso + b.pose.head) * D, f, t);
  return w;
}
function drawGlove(at, t, big = 1) {
  const d = gloveDigit(t), ready = d === 0;
  g.save(); g.translate(at[0], at[1]); g.scale(big, big);
  g.fillStyle = '#1A2533'; g.strokeStyle = C.ink; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 19, 0, 7); g.fill(); g.stroke();
  const pulse = ready ? .6 + .4 * Math.sin(t * 8) : .35;
  g.shadowColor = C.cyan; g.shadowBlur = ready ? 30 : 10; g.fillStyle = C.cyan; g.globalAlpha = .4 + .6 * pulse;
  g.beginPath(); g.arc(0, 0, 10, 0, 7); g.fill(); g.globalAlpha = 1; g.shadowBlur = 0;
  // wrist counter
  g.fillStyle = '#071019'; rr(-17, -48, 34, 26, 6); g.fill(); g.lineWidth = 4; g.stroke();
  g.fillStyle = ready ? C.cyan : '#FF5A4A'; g.font = '900 20px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(ready ? '●' : String(d), 0, -35);
  g.restore();
}
function kipHead(c, ang, f, t, eyesOnly = false) {
  const r = SK.hr;
  g.save(); g.translate(c[0], c[1]); g.rotate(ang);
  const sk = g.createRadialGradient(-22, -18, 6, 0, 0, r * 1.05);
  sk.addColorStop(0, '#FFF1E2'); sk.addColorStop(.6, C.skin); sk.addColorStop(1, '#C9A893');
  g.fillStyle = sk; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
  // cyan rim from the city / glove
  g.strokeStyle = 'rgba(56,225,255,.35)'; g.lineWidth = 8; g.beginPath(); g.arc(0, 0, r - 6, -.6, .9); g.stroke();
  g.fillStyle = '#20232B'; g.beginPath(); g.arc(0, 0, r, Math.PI * 1.02, Math.PI * 1.98);
  for (let i = 0; i <= 6; i++) { const a = Math.PI * 1.98 - i * (Math.PI * .96 / 6); const q = i % 2 ? r - 18 : r - 6; g.lineTo(Math.cos(a) * q * (i % 2 ? .9 : 1), Math.sin(a) * q * .55 - 6); }
  g.closePath(); g.fill();
  g.strokeStyle = '#20232B'; g.lineWidth = 12; g.beginPath(); g.moveTo(-6, -r + 4); g.quadraticCurveTo(-4, -r - 26, 18, -r - 22); g.stroke();
  g.strokeStyle = C.silver; g.lineWidth = 9; g.beginPath(); g.moveTo(10, -r + 8); g.quadraticCurveTo(26, -r + 30, 18, -r + 48); g.stroke();
  g.strokeStyle = '#5A4630'; g.lineWidth = 7; g.beginPath(); g.arc(0, 0, r - 3, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
  for (const gx of [-12, 26]) { g.fillStyle = '#7FD8E6'; g.strokeStyle = C.brass; g.lineWidth = 6; g.beginPath(); g.arc(gx, -r + 18, 13, 0, 7); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(gx - 4, -r + 13, 4, 0, 7); g.fill(); }
  g.strokeStyle = C.ink; g.lineWidth = 12; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke();
  const [lx, ly] = f.look, ex = lx * r * .55, ey = ly * r * .45 + 8, eyes = [[-20 + ex, ey], [20 + ex, ey]];
  g.fillStyle = C.ink; g.strokeStyle = C.ink; g.lineWidth = 6;
  const blink = (t % 3.1) < .08 && f.eyes === 'dot';
  eyes.forEach(([x, y]) => {
    if (blink) { g.beginPath(); g.arc(x, y - 2, 8, .15, Math.PI - .15); g.stroke(); return; }
    if (f.eyes === 'dot') { g.beginPath(); g.ellipse(x, y, 7, 9, 0, 0, 7); g.fill(); }
    if (f.eyes === 'ring') { g.beginPath(); g.arc(x, y, 11, 0, 7); g.stroke(); g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill(); }
    if (f.eyes === 'pin') { g.beginPath(); g.arc(x, y, 13, 0, 7); g.stroke(); g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); }
    if (f.eyes === 'half') { g.lineWidth = 7; line([x - 9, y], [x + 9, y]); g.lineWidth = 6; }
  });
  g.lineWidth = 7;
  eyes.forEach(([x, y], i) => { const a = (i ? f.brow[1] : f.brow[0]) * D, by = y - 22 - f.lift - (i && f.mouth === 'smirk' ? 6 : 0); g.save(); g.translate(x, by); g.rotate(a); line([-10, 0], [10, 0]); g.restore(); });
  const mx = ex * .8 + 2, my = 34 + ly * 8; g.lineWidth = 6;
  if (f.mouth === 'smirk') { g.beginPath(); g.moveTo(mx - 12, my + 2); g.quadraticCurveTo(mx + 2, my + 8, mx + 16, my - 4); g.stroke(); }
  if (f.mouth === 'line') line([mx - 9, my + 2], [mx + 9, my + 2]);
  if (f.mouth === 'o') { g.beginPath(); g.ellipse(mx, my + 2, 7, 9, 0, 0, 7); g.stroke(); }
  g.restore();
}
function drawHex(t) {
  const b = actor('hex', t), w = joints(b), f = track(HFACE, t);
  if (env(t) !== 'fall' && roofGone(t) < 1) contactShadow(b.x - 8, 130, .55);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const sl = (a, c, wd) => { g.strokeStyle = C.ink; g.lineWidth = wd + 10; limb(a, c[0], c[1]); g.strokeStyle = C.violet; g.lineWidth = wd; limb(a, c[0], c[1]); };
  // back limbs
  g.strokeStyle = '#141A26'; g.lineWidth = 20; limb(w.hip, w.lk, w.lf);
  sl(w.sh, [w.le, w.lh], 16);
  // coat (faceted trapezoid that swings with velocity)
  const b2 = actor('hex', t - .07), h2 = toWorld([0, 0], b2), sway = clamp(-(w.hip[0] - h2[0]) / .07 * .05, -40, 40) + Math.sin(t * 3) * 6;
  const up = [w.neck[0], w.neck[1] + 6], dn = toWorld([0, 75], b);
  const nx = dn[0] - up[0], ny = dn[1] - up[1], m = Math.hypot(nx, ny), px = -ny / m, py = nx / m;
  g.beginPath();
  g.moveTo(up[0] + px * 26, up[1] + py * 26); g.lineTo(dn[0] + px * 62 + sway, dn[1] + py * 62);
  g.lineTo(dn[0] + sway * .5, dn[1] + 14); g.lineTo(dn[0] - px * 62 + sway, dn[1] - py * 62); g.lineTo(up[0] - px * 26, up[1] - py * 26); g.closePath();
  g.fillStyle = lingrad(up[0] - px * 40, up[1], up[0] + px * 40, up[1], [[0, C.violetHi], [.5, C.violet], [1, '#2A1A5E']]);
  g.fill(); g.strokeStyle = C.ink; g.lineWidth = 9; g.stroke();
  g.strokeStyle = C.gold; g.lineWidth = 3; g.beginPath(); g.moveTo(up[0], up[1]); g.lineTo(dn[0] + sway * .5, dn[1] + 10); g.stroke();
  // collar
  g.fillStyle = '#2A1A5E'; g.beginPath(); g.moveTo(w.neck[0] - 26, w.neck[1] + 14); g.lineTo(w.neck[0] - 18, w.neck[1] - 22); g.lineTo(w.neck[0] + 18, w.neck[1] - 22); g.lineTo(w.neck[0] + 26, w.neck[1] + 14); g.closePath(); g.fill(); g.strokeStyle = C.ink; g.lineWidth = 6; g.stroke();
  // front limbs
  g.strokeStyle = '#141A26'; g.lineWidth = 20; limb(w.hip, w.rk, w.rf);
  sl(w.sh, [w.re, w.rh], 16);
  // pen in right hand
  if (!(env(t) === 'fall' && t < 52.75)) drawPen(w.rh, (b.rot + b.pose.ra2) * D * b.dir, t);
  hexHead(w.headC, (b.rot + (b.pose.torso + b.pose.head) * b.dir) * D, f, t, b.dir);
  // one finger
  if (win(t, 13.6, 15.0)) { g.strokeStyle = C.porcelain; g.lineWidth = 10; line(w.rh, [w.rh[0], w.rh[1] - 34]); g.strokeStyle = C.ink; g.lineWidth = 3; }
  return w;
}
function drawPen(at, ang, t) {
  g.save(); g.translate(at[0], at[1]); g.rotate(ang + Math.PI);
  g.shadowColor = C.gold; g.shadowBlur = 20;
  g.fillStyle = lingrad(-5, 0, 5, 0, [[0, '#8C6514'], [.5, C.goldHi], [1, '#A87A1C']]);
  g.beginPath(); g.moveTo(-5, -20); g.lineTo(5, -20); g.lineTo(3, 52); g.lineTo(0, 66); g.lineTo(-3, 52); g.closePath(); g.fill();
  g.fillStyle = '#FFF6D8'; g.beginPath(); g.arc(0, 64, 4, 0, 7); g.fill();
  g.restore();
}
function hexHead(c, ang, f, t, dir) {
  const r = SK.hr * .95;
  g.save(); g.translate(c[0], c[1]); g.rotate(ang); g.scale(dir, 1);
  // angular head: rounded hexagon, taller than wide
  const hexPts = [[0, -r * 1.08], [r * .86, -r * .5], [r * .78, r * .55], [0, r * 1.1], [-r * .78, r * .55], [-r * .86, -r * .5]];
  g.beginPath(); hexPts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
  g.fillStyle = (() => { const q = g.createRadialGradient(-18, -20, 4, 0, 0, r * 1.2); q.addColorStop(0, '#FFFFFF'); q.addColorStop(.6, C.porcelain); q.addColorStop(1, '#AEB4C8'); return q; })();
  g.fill(); g.strokeStyle = C.ink; g.lineWidth = 11; g.stroke();
  // sleek bob with straight bangs
  g.fillStyle = '#0B0D14';
  g.beginPath(); g.moveTo(-r * .98, r * .5); g.lineTo(-r * .95, -r * .55); g.lineTo(0, -r * 1.22); g.lineTo(r * .95, -r * .55); g.lineTo(r * .98, r * .5); g.lineTo(r * .7, r * .5); g.lineTo(r * .72, -r * .22); g.lineTo(-r * .72, -r * .22); g.lineTo(-r * .7, r * .5); g.closePath(); g.fill();
  g.strokeStyle = C.gold; g.lineWidth = 6; g.shadowColor = C.gold; g.shadowBlur = 10; line([r * .55, -r * .95], [r * .82, r * .45]); g.shadowBlur = 0;
  // eyes
  const [lx, ly] = f.look, ex = lx * r * .5, ey = ly * r * .35 + 10;
  g.strokeStyle = C.ink; g.fillStyle = C.ink;
  for (const sx of [-20, 20]) {
    const x = sx + ex, y = ey;
    if (f.eyes === 'narrow') { g.lineWidth = 6; line([x - 11, y - 2], [x + 11, y - 2]); g.beginPath(); g.arc(x + 2, y + 2, 4, 0, 7); g.fill(); }
    if (f.eyes === 'open') { g.beginPath(); g.ellipse(x, y, 6, 8, 0, 0, 7); g.fill(); g.lineWidth = 5; line([x - 11, y - 12], [x + 11, y - 12]); }
    if (f.eyes === 'closed') { g.lineWidth = 6; line([x - 11, y], [x + 11, y]); }
    g.lineWidth = 4; line([x - 12, y - 20], [x + 12, y - 22]);
  }
  const mx = ex * .7, my = 36 + ly * 6; g.lineWidth = 5;
  if (f.mouth === 'smirk') { g.beginPath(); g.moveTo(mx - 10, my); g.quadraticCurveTo(mx + 4, my + 4, mx + 14, my - 6); g.stroke(); }
  if (f.mouth === 'flat') line([mx - 8, my], [mx + 8, my]);
  if (f.mouth === 'o') { g.beginPath(); g.ellipse(mx, my, 6, 8, 0, 0, 7); g.stroke(); }
  g.restore();
}
// Lumo & Fold
function drawLumo(x, y, s, t, digit = null) {
  g.save(); g.translate(x, y + Math.sin(t * 2.4) * 8); g.scale(s, s);
  g.strokeStyle = 'rgba(56,225,255,.85)'; g.lineWidth = 5; g.shadowColor = C.cyan; g.shadowBlur = 20; g.beginPath(); g.ellipse(0, 52, 30, 7, 0, 0, 7); g.stroke(); g.shadowBlur = 0;
  const sh = g.createRadialGradient(-12, -14, 4, 0, 0, 40); sh.addColorStop(0, '#FFFFFF'); sh.addColorStop(.7, '#DCE3E8'); sh.addColorStop(1, '#7E8C98');
  g.fillStyle = sh; g.beginPath(); g.arc(0, 0, 38, 0, 7); g.fill(); g.strokeStyle = C.ink; g.lineWidth = 6; g.stroke();
  g.shadowColor = C.cyan; g.shadowBlur = 30; g.fillStyle = C.cyan; g.beginPath(); g.arc(10, -4, 15, 0, 7); g.fill(); g.shadowBlur = 0;
  g.fillStyle = '#04202A'; g.beginPath(); g.arc(13, -4, 5, 0, 7); g.fill();
  g.restore();
}
function drawFold(x, y, s, t) {
  const flap = Math.sin(t * 9) * .5;
  g.save(); g.translate(x, y + Math.sin(t * 3) * 10); g.scale(s, s); g.shadowColor = C.gold; g.shadowBlur = 18;
  const tri = (pts, c) => { g.fillStyle = c; g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.closePath(); g.fill(); g.strokeStyle = '#7A5410'; g.lineWidth = 2; g.stroke(); };
  tri([[-40, 4], [0, -2], [-6, 14]], '#C8902A');
  tri([[0, -2], [40, -18], [10, 12]], '#E2AE45');
  tri([[-10, 4], [-22, -30 - flap * 40], [8, 2]], '#F6CD6E');
  tri([[-4, 6], [16, -26 + flap * 40], [10, 8]], '#FFE19A');
  g.restore();
}

// ---------------- gold drawing & cyan deletion ----------------
function pathLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
function partial(pts, k) {
  const L = pathLen(pts) * k; let acc = 0; const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) { const s = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (acc + s >= L) { const q = (L - acc) / (s || 1); out.push([lerp(pts[i - 1][0], pts[i][0], q), lerp(pts[i - 1][1], pts[i][1], q)]); return out; } acc += s; out.push(pts[i]); }
  return out;
}
function samples(pts, step = 22) { const L = pathLen(pts), n = Math.max(2, Math.floor(L / step)), out = []; for (let i = 0; i <= n; i++) { const p = partial(pts, i / n); out.push(p[p.length - 1]); } return out; }
function goldStroke(pts, k = 1, wd = 10, solid = 0) {
  if (k <= 0) return; const p = partial(pts, clamp(k));
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  g.shadowColor = C.gold; g.shadowBlur = 28; g.strokeStyle = solid ? '#D79A2B' : C.gold; g.lineWidth = wd + (solid ? 6 : 0);
  g.beginPath(); p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
  g.shadowBlur = 0; g.strokeStyle = C.goldHi; g.lineWidth = Math.max(2, wd * .35);
  g.beginPath(); p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
  if (k < 1) { const e = p[p.length - 1]; g.fillStyle = '#FFFFFF'; g.shadowColor = C.gold; g.shadowBlur = 30; g.beginPath(); g.arc(e[0], e[1], wd * .9, 0, 7); g.fill(); }
  g.restore();
}
function cyanDissolve(pts, k, seed = 1, spread = 160) { // gold path breaking into cyan pixels
  if (k <= 0 || k >= 1) return; const sp = samples(pts, 16);
  g.save();
  sp.forEach(([x, y], i) => {
    const a = rnd(i * 3.1 + seed) * 6.28, v = spread * (.3 + rnd(i + seed * 7)), s = 6 + rnd(i * 1.7 + seed) * 10;
    g.globalAlpha = clamp(1 - k * (1 + rnd(i))); g.fillStyle = k < .15 ? C.goldHi : (i % 3 ? C.cyan : '#E6FCFF');
    g.fillRect(x + Math.cos(a) * v * k, y + Math.sin(a) * v * k - 60 * k, s, s);
  });
  g.restore();
}
// a gold object: drawn on [t0,t1], solid while alive, deleted at td (or never)
function goldObj(t, pts, t0, t1, td = 1e9, wd = 10, seed = 1) {
  if (t < t0) return;
  if (t < td) goldStroke(pts, ramp(t, t0, t1), wd, t > t1 + .1 ? 1 : 0);
  else cyanDissolve(pts, (t - td) / .7, seed);
}
const poly = (cx, cy, r, n, a0 = 0) => [...Array(n + 1)].map((_, i) => [cx + Math.cos(a0 + i / n * 6.283) * r, cy + Math.sin(a0 + i / n * 6.283) * r]);
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];

// ---------------- scene props by time ----------------
function blade(t) { // S1
  if (t > 1.7) return;
  const k = E.out(ramp(t, 0, .88)), x = lerp(980, 470, k), y = lerp(870, 985, k);
  const pts = [[x - 120, y - 6], [x, y - 16], [x + 30, y], [x, y + 16], [x - 120, y + 6], [x - 120, y - 6]];
  if (t < .9) { goldStroke(pts, 1, 8, 1); g.save(); g.globalAlpha = .4; g.fillStyle = C.gold; g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.fill(); g.restore();
    for (let i = 1; i < 6; i++) { g.strokeStyle = `rgba(255,220,140,${.25 - i * .04})`; g.lineWidth = 4; line([x + 20 + i * 70, y - 8 - i * 20], [x + 140 + i * 70, y - 30 - i * 20]); } }
  else cyanDissolve(pts, (t - .9) / .8, 3, 260);
}
function hexSigil(t) { // S2: three quick strokes → hexagon
  if (!win(t, 4.28, 6.3)) return;
  const pts = poly(HX - 10, 860, 120, 6, Math.PI / 6);
  g.save(); g.globalAlpha = 1 - ramp(t, 5.6, 6.25); goldStroke(pts, ramp(t, 4.3, 5.0), 9); g.restore();
}
function ball(t) { // S3/S4: drawn circle becomes a real gold sphere, then Kip deletes it
  if (!win(t, 8.0, 11.2)) return;
  const cx = 600, r = 56;
  const drop = t < 9.0 ? 0 : (t < 9.35 ? E.in(ramp(t, 9.0, 9.35)) : 1 - Math.abs(Math.sin((t - 9.35) * 7)) * Math.exp(-(t - 9.35) * 5) * .25);
  const cy = lerp(1020, FY - r, drop);
  if (t < 8.8) { goldStroke(poly(cx, cy, r, 40, -Math.PI / 2), ramp(t, 8.0, 8.75), 9); return; }
  if (t < 10.3) {
    g.save(); g.shadowColor = C.gold; g.shadowBlur = 40;
    const q = g.createRadialGradient(cx - 20, cy - 22, 6, cx, cy, r); q.addColorStop(0, '#FFF3C4'); q.addColorStop(.45, C.gold); q.addColorStop(1, '#6E4A0E');
    g.fillStyle = q; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.restore();
    if (t > 9.35) contactShadow(cx, 80, .6);
    if (win(t, 8.8, 8.95)) { g.fillStyle = `rgba(255,240,200,${1 - ramp(t, 8.8, 8.95)})`; g.beginPath(); g.arc(cx, cy, r * 1.6, 0, 7); g.fill(); }
  } else cyanDissolve(poly(cx, cy, r * .6, 30), (t - 10.3) / .8, 9, 220);
}
function spears(t) { // S5
  if (!win(t, 15.05, 19.05)) return;
  for (let s = 0; s < 2; s++) {
    const t0 = 15.1 + s * .15, launch = 15.7 + s * .55, sx = HX - 60, sy = 1010 + s * 70;
    const ex = s ? 380 : 520, ey = s ? FY - 30 : 1080, hitT = s ? 17.7 : 16.35;
    const k = launch > t ? 0 : Math.min(1, (t - launch) / (hitT - launch + (s ? 0 : .35)));
    const x = lerp(sx, ex, s ? E.in(k) : k), y = lerp(sy, ey, s ? E.in(k) : k), ang = Math.atan2(ey - sy, ex - sx);
    const L = 210, pts = [[x - Math.cos(ang) * L, y - Math.sin(ang) * L], [x, y], [x - Math.cos(ang - .25) * 40, y - Math.sin(ang - .25) * 40], [x, y], [x - Math.cos(ang + .25) * 40, y - Math.sin(ang + .25) * 40]];
    if (s === 0) goldObj(t, pts, t0, t0 + .35, 16.35, 9, 4);
    else { goldStroke(pts, ramp(t, t0, t0 + .35), 9, t > t0 + .45 ? 1 : 0); if (t > 17.7) { g.save(); g.globalAlpha = .5; g.fillStyle = '#2A1A00'; g.fillRect(ex - 30, FY + 2, 60, 6); g.restore(); } }
  }
}
function rewindGhosts(t) {
  if (!win(t, 17.48, 18.6)) return;
  const k = ramp(t, 17.48, 18.6);
  for (let i = 0; i < 5; i++) {
    const x = lerp(400, 210, i / 4);
    g.save(); g.globalAlpha = (1 - k) * .35; g.translate(x - 210, 0); g.filter = 'blur(1px)';
    g.strokeStyle = C.cyan; g.lineWidth = 18; g.lineCap = 'round';
    const b = { x: 210, y: KHY, rot: 0, dir: 1, sc: 1, pose: P.ready }, w = joints(b);
    limb(w.hip, w.lk, w.lf); limb(w.hip, w.rk, w.rf); line(w.hip, w.neck); g.beginPath(); g.arc(w.headC[0], w.headC[1], 60, 0, 7); g.stroke();
    g.restore();
  }
  g.filter = 'none';
}
function box(t) { // S6 walls & ceiling around Kip
  if (!win(t, 19.05, 21.8)) return;
  const L = [[110, FY], [110, 880]], R = [[310, FY], [310, 880]], T = [[100, 880], [320, 880]];
  goldObj(t, L, 19.1, 19.5, 20.75, 12, 5); goldObj(t, R, 19.3, 19.7, 20.75, 12, 6); goldObj(t, T, 19.9, 20.25, 20.75, 12, 7);
}
function grid(t) { // S7/S8
  if (!win(t, 21.6, 30.4)) return;
  const fall = E.in(ramp(t, 21.85, 22.25)), oy = lerp(-900, 0, fall), x0 = 60, x1 = 1020, y0 = 740, y1 = FY;
  const del = 28.35, k = t < del ? 0 : (t - del) / 1.2;
  g.save();
  for (let i = 0; i <= 8; i++) {
    const x = lerp(x0, x1, i / 8), y = lerp(y0, y1, i / 8);
    const v = [[x, y0 + oy], [x, y1 + oy]], h = [[x0, y + oy], [x1, y + oy]];
    const fx = k * k * 900 * (.4 + rnd(i)), rot = k * (rnd(i + 3) - .5) * .6;
    for (const [pts, sd] of [[v, i], [h, i + 20]]) {
      if (k <= 0) goldStroke(pts, ramp(t, 21.6, 21.85), 7, 1);
      else if (k < 1) { g.save(); g.translate(0, fx); g.rotate(rot * .1); goldStroke(pts, 1, 7, 1); g.restore(); cyanDissolve(pts, k, sd, 140); }
    }
  }
  // anchor bolt (top-left corner)
  if (t < del) { const p = .5 + .5 * Math.sin(t * 9); g.fillStyle = C.goldHi; g.shadowColor = C.gold; g.shadowBlur = 20 + (t > 26.8 ? 30 * p : 0); g.beginPath(); g.arc(x0, y0 + oy, 18 + (t > 26.8 ? 6 * p : 0), 0, 7); g.fill(); }
  g.restore();
  if (win(t, 22.25, 22.8)) dustBurst(t - 22.25, 540, FY, 40);
}
function stairs(t) { // S11 (wall scene, world coords): ledges stepping "up" (real up = -x)
  if (!win(t, 36.4, 37.85)) return;
  const pts = []; let x = 760, y = FY;
  for (let i = 0; i < 6; i++) { pts.push([x, y]); pts.push([x, y - 120]); x -= 95; pts.push([x, y - 120]); pts.push([x, y]); }
  goldStroke(pts, ramp(t, 36.55, 37.3), 9, t > 37.35 ? 1 : 0);
}
function cages(t) { // S12
  if (!win(t, 38.3, 50.6)) return;
  const fallK = t > ROOF_GONE ? E.in(ramp(t, ROOF_GONE + .2, 50.1)) * 900 : 0;
  const cg = (x, y, w, h, n) => { const pts = []; for (let i = 0; i <= n; i++) { const xx = x + w * i / n; pts.push([[xx, y], [xx, y + h]]); } pts.push([[x, y], [x + w, y]]); pts.push([[x, y + h], [x + w, y + h]]); return pts; };
  const C1 = cg(150, 760, 540, 690, 7), C2 = cg(240, 880, 360, 570, 6), C3 = cg(300, 960, 240, 490, 5);
  g.save(); g.translate(0, fallK);
  C1.forEach((p, i) => goldObj(t, p, 38.42 + i * .04, 38.75 + i * .04, 39.8, 9, 30 + i));
  C2.forEach((p, i) => goldObj(t, p, 39.9, 40.3, 42.3, 9, 50 + i));
  C3.forEach((p, i) => { if (t > 42.4) goldStroke(p, ramp(t, 42.45, 42.8), 9, 1); });
  g.restore();
}
function parachute(t, hx, hy) {
  if (t < 54.2) return;
  const k = ramp(t, 54.2, 55.0), open = E.back(ramp(t, 55.0, 55.4));
  const cx = hx, cy = hy - 330, rw = lerp(60, 260, open), rh = lerp(40, 120, open);
  const canopy = [...Array(25)].map((_, i) => { const a = Math.PI + i / 24 * Math.PI; return [cx + Math.cos(a) * rw, cy + Math.sin(a) * rh]; });
  goldStroke(canopy, k, 10, t > 55.1 ? 1 : 0);
  if (t > 55.0) { g.save(); g.globalAlpha = .25 * open; g.fillStyle = C.gold; g.beginPath(); canopy.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); g.restore(); }
  for (const s of [-1, -.4, .4, 1]) goldStroke([[cx + s * rw, cy], [hx + s * 10, hy - 120]], ramp(t, 54.7, 55.0), 4, 1);
}

// ---------------- environments ----------------
function cityLayer(t, depth, seed, baseY, col, winCol, parX) {
  for (let i = 0; i < 14; i++) {
    const w = 90 + rnd(i + seed) * 140, h = 300 + rnd(i * 2 + seed) * 900 * depth, x = -400 + i * 150 + rnd(i + seed * 3) * 60 + parX;
    g.fillStyle = col; g.fillRect(x, baseY - h, w, h + 2000);
    for (let wy = baseY - h + 30; wy < baseY; wy += 46) for (let wx = x + 14; wx < x + w - 14; wx += 30)
      if (rnd(wx * .13 + wy * .07 + seed) > .62) { g.fillStyle = winCol; g.fillRect(wx, wy, 12, 18); }
  }
}
function drawSky(t) {
  g.fillStyle = lingrad(0, -1500, 0, FY, [[0, '#03070F'], [.6, '#0B1A2A'], [1, '#1D3A4C']]);
  g.fillRect(-1600, -1600, 4300, FY + 1700);
  // moon glow / cloud band
  const q = g.createRadialGradient(840, 300, 10, 840, 300, 700); q.addColorStop(0, 'rgba(160,200,220,.28)'); q.addColorStop(1, 'rgba(160,200,220,0)');
  g.fillStyle = q; g.fillRect(-1600, -1600, 4300, FY + 1700);
}
function drawRoof(t) {
  drawSky(t);
  cityLayer(t, .9, 11, FY + 200, '#0C1826', 'rgba(255,180,110,.55)', -t * 2);
  g.fillStyle = 'rgba(70,110,130,.18)'; g.fillRect(-1600, 700, 4300, 900);            // fog between layers
  cityLayer(t, .6, 37, FY + 60, '#081019', 'rgba(255,160,90,.75)', -t * 5);
  // rooftop props: water tower, vents, antenna
  g.fillStyle = '#060B12';
  g.fillRect(-120, FY - 380, 160, 300); g.beginPath(); g.moveTo(-140, FY - 380); g.lineTo(-40, FY - 470); g.lineTo(60, FY - 380); g.fill();
  for (const lx of [-110, 20]) g.fillRect(lx, FY - 80, 12, 80);
  g.fillRect(940, FY - 160, 180, 160); g.fillRect(970, FY - 230, 40, 70);
  g.strokeStyle = '#060B12'; g.lineWidth = 6; line([1060, FY - 160], [1060, FY - 520]); g.fillStyle = '#FF3B3B'; g.beginPath(); g.arc(1060, FY - 525, 6 + 2 * Math.sin(t * 3), 0, 7); g.fill();
  // roof slab (deletable)
  const gone = roofGone(t);
  g.fillStyle = lingrad(0, FY, 0, FY + 600, [[0, '#2B3E4A'], [1, '#0A121A']]);
  if (gone <= 0) g.fillRect(-1600, FY, 4300, 1200);
  else {
    const cell = 60;
    for (let gx = -600; gx < 1700; gx += cell) for (let gy = FY; gy < FY + 700; gy += cell) {
      const thr = rnd(gx * 7.13 + gy * 1.71) * .85 + Math.abs(gx - 420) / 5000;
      if (gone > thr + .12) continue;
      const dis = gone > thr; g.globalAlpha = dis ? 1 - (gone - thr) / .12 : 1;
      g.fillStyle = dis ? C.cyan : `rgb(${Math.round(lerp(43, 10, (gy - FY) / 700))},${Math.round(lerp(62, 18, (gy - FY) / 700))},${Math.round(lerp(74, 26, (gy - FY) / 700))})`;
      g.fillRect(gx, gy + (dis ? (gone - thr) * 800 : 0), cell + 1, cell + 1);
    }
    g.globalAlpha = 1;
  }
  if (gone < 1) {
    g.save(); g.globalAlpha = 1 - gone;
    // wet reflections (puddles) of the city lights
    for (let i = 0; i < 9; i++) { const px = 60 + i * 120 + rnd(i) * 40; g.fillStyle = 'rgba(255,170,100,.16)'; g.fillRect(px, FY + 20 + rnd(i + 4) * 80, 6, 50 + rnd(i) * 60); }
    g.fillStyle = 'rgba(150,200,220,.25)'; g.fillRect(-1600, FY - 2, 4300, 4);
    g.restore();
  }
}
function drawWallEnv(t) { // world: floor = skyscraper facade (camera rotated 90°)
  g.fillStyle = lingrad(0, -800, 0, FY, [[0, '#050A12'], [1, '#13283A']]); g.fillRect(-1600, -1600, 4300, FY + 1700);
  // the city far below lies toward +x in world (= screen down): bright band
  const q = g.createLinearGradient(1300, 0, 2200, 0); q.addColorStop(0, 'rgba(255,150,80,0)'); q.addColorStop(1, 'rgba(255,150,80,.35)');
  g.fillStyle = q; g.fillRect(1300, -1600, 900, FY + 1700);
  for (let i = 0; i < 30; i++) { const x = 1250 + rnd(i) * 900, y = -600 + rnd(i + 3) * 2000; g.fillStyle = `rgba(255,${150 + rnd(i) * 80},90,${.3 + rnd(i + 1) * .4})`; g.fillRect(x, y, 6, 6); }
  // facade = floor
  g.fillStyle = '#1B2733'; g.fillRect(-1600, FY, 4300, 900);
  const scroll = (t - 31.55) * 40;
  for (let x = -1000 + (scroll % 160); x < 2400; x += 160) for (let y = FY + 40; y < FY + 700; y += 150) {
    g.fillStyle = rnd(Math.floor((x - scroll) / 160) * 3 + y) > .5 ? 'rgba(255,175,100,.55)' : 'rgba(80,120,150,.35)';
    g.fillRect(x, y, 110, 100); g.strokeStyle = '#0B121A'; g.lineWidth = 6; g.strokeRect(x, y, 110, 100);
  }
  g.fillStyle = 'rgba(150,200,220,.25)'; g.fillRect(-1600, FY - 2, 4300, 4);
}
function drawFallEnv(t) { // screen space: shaft between two towers, windows streaking up
  g.fillStyle = lingrad(0, 0, 0, H, [[0, '#0A1622'], [1, '#02060C']]); g.fillRect(0, 0, W, H);
  const speed = t < 55.0 ? 2600 : (t < 57.85 ? 900 : 300);
  const base = (t - 50.1) * speed;
  // far ground glow
  const q = g.createRadialGradient(540, H + 300, 50, 540, H + 300, 1200); q.addColorStop(0, 'rgba(255,150,80,.4)'); q.addColorStop(1, 'rgba(255,150,80,0)'); g.fillStyle = q; g.fillRect(0, 0, W, H);
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? 0 : W - 230, w = 230;
    g.fillStyle = '#0E1A26'; g.fillRect(x0, 0, w, H);
    for (let r = -1; r < 14; r++) { const y = ((r * 160 - base) % (160 * 14) + 160 * 14) % (160 * 14) - 160;
      for (let c = 0; c < 2; c++) { const lit = rnd(r * 7 + c + side * 13 + Math.floor((r * 160 - base) / (160 * 14))) > .5;
        g.fillStyle = lit ? 'rgba(255,175,100,.6)' : 'rgba(60,90,120,.45)'; g.fillRect(x0 + 30 + c * 100, y, 70, 110); } }
    // speed streaks
    g.fillStyle = 'rgba(200,230,255,.08)'; for (let i = 0; i < 6; i++) g.fillRect(x0 + rnd(i + side) * w, 0, 3, H);
  }
}
function rain(t, cam, mode) {
  // screen-space streaks; direction depends on scene
  g.save(); g.strokeStyle = 'rgba(190,220,240,.35)'; g.lineWidth = 2.5;
  for (let i = 0; i < 140; i++) {
    const z = .5 + rnd(i) * .9, sp = 2200 * z; let x, y, dx, dy;
    if (mode === 'fall') { x = rnd(i + 1) * W; y = ((H - (t * sp * .6 + rnd(i + 2) * H)) % H + H) % H; dx = 0; dy = -60 * z; }
    else if (mode === 'wall') { y = rnd(i + 1) * H; x = ((t * sp + rnd(i + 2) * W) % (W + 200)) - 100; dx = 0; dy = 0; x = x; y = ((t * sp + rnd(i + 2) * H) % H); x = rnd(i + 5) * W; dx = 0; dy = 70 * z; }
    else { x = ((rnd(i + 1) * W - t * 120 * z) % W + W) % W; y = ((t * sp + rnd(i + 2) * H) % (H + 200)) - 100; dx = -10 * z; dy = 70 * z; }
    if (mode === 'slow') { y = (rnd(i + 2) * H + t * 60 * z) % H; dy = 20 * z; dx = -3; }
    g.globalAlpha = .4 + .6 * rnd(i + 9); line([x, y], [x + dx, y + dy]);
  }
  g.restore();
}
function splashes(t) { // world space on the roof line
  if (roofGone(t) > 0) return;
  for (let i = 0; i < 26; i++) { const ph = (t * 2.3 + rnd(i)) % 1, x = rnd(i + 2) * 1400 - 160 + Math.floor(t * 2.3 + rnd(i)) * 37 % 300;
    g.strokeStyle = `rgba(200,230,250,${.5 * (1 - ph)})`; g.lineWidth = 2; g.beginPath(); g.ellipse(x, FY + 4, 4 + ph * 22, 1.5 + ph * 4, 0, 0, 7); g.stroke(); }
}
function dustBurst(k, x, y, n) { for (let i = 0; i < n; i++) { const a = -Math.PI * rnd(i), v = 200 + rnd(i + 2) * 600; g.fillStyle = `rgba(200,220,235,${.6 * (1 - k / .55)})`; g.beginPath(); g.arc(x + Math.cos(a) * v * k * (rnd(i + 5) > .5 ? 1 : -1), y + Math.sin(a) * v * k * .5, 6 + rnd(i) * 10, 0, 7); g.fill(); } }
function vexRing(t, t0, x, y, col = C.cyan, max = 1100) {
  const k = (t - t0) / .55; if (k < 0 || k > 1) return;
  g.save(); g.globalAlpha = 1 - k; g.strokeStyle = col; g.shadowColor = col; g.shadowBlur = 30; g.lineWidth = 10 * (1 - k) + 2;
  g.beginPath(); g.arc(x, y, E.out(k) * max, 0, 7); g.stroke(); g.restore();
}
function flatRing(t, t0, x, y) { // gravity tap: flat ellipse shockwave along the roof
  const k = (t - t0) / .6; if (k < 0 || k > 1) return;
  g.save(); g.globalAlpha = 1 - k; g.strokeStyle = C.cyan; g.shadowColor = C.cyan; g.shadowBlur = 30; g.lineWidth = 8;
  g.beginPath(); g.ellipse(x, y, E.out(k) * 900, E.out(k) * 90, 0, 0, 7); g.stroke(); g.restore();
}

// ---------------- camera ----------------
const CAM = [
  [0, { x: 420, y: 960, z: 2.3, r: 0 }],                // S1 close on Kip + incoming blade
  [0.85, { x: 400, y: 975, z: 2.6, r: 0 }, 'io'],
  [2.19, { x: 400, y: 985, z: 2.7, r: -2 }, 'out'],
  [2.2, { x: 560, y: 1140, z: 1.02, r: 0 }, 'hold'],      // S2 wide rooftop
  [3.4, { x: 560, y: 1130, z: 1.08, r: 0 }],
  [3.6, { x: 720, y: 1080, z: 1.45, r: 2 }, 'out'],       // push to Hex on "except"
  [6.24, { x: 740, y: 1060, z: 1.6, r: 2 }],
  [6.25, { x: 720, y: 1020, z: 1.9, r: 0 }, 'hold'],      // S3 Hex medium
  [8.0, { x: 690, y: 1060, z: 1.75, r: 0 }],
  [9.84, { x: 640, y: 1150, z: 1.55, r: 0 }],
  [9.85, { x: 470, y: 1060, z: 2.6, r: 0 }, 'hold'],  // S4 glove ECU
  [12.64, { x: 500, y: 1070, z: 3.0, r: -3 }],
  [12.65, { x: HX - 20, y: 960, z: 2.2, r: 0 }, 'hold'],  // Hex "needs one"
  [15.04, { x: HX - 30, y: 950, z: 2.5, r: 2 }],
  [15.05, { x: 560, y: 1130, z: 1.12, r: 0 }, 'hold'],    // S5 wide spears
  [16.3, { x: 480, y: 1140, z: 1.3, r: 0 }],
  [17.5, { x: 360, y: 1150, z: 1.4, r: -3 }, 'out'],
  [19.04, { x: 330, y: 1160, z: 1.3, r: 0 }],
  [19.05, { x: 300, y: 1130, z: 1.55, r: 0 }, 'hold'],    // S6 box
  [21.04, { x: 260, y: 1080, z: 1.85, r: 0 }],
  [21.05, { x: 540, y: 1110, z: 1.0, r: 0 }, 'hold'],     // S7 grid wide
  [22.3, { x: 540, y: 1110, z: 1.0, r: 0 }],
  [22.42, { x: 540, y: 1115, z: 1.05, r: 0 }, 'out'],
  [25.9, { x: 420, y: 1120, z: 1.25, r: 0 }],
  [27.0, { x: 330, y: 1000, z: 1.3, r: -4 }],             // S8 look up to the anchor
  [28.3, { x: 300, y: 920, z: 1.45, r: -5 }],
  [29.6, { x: 500, y: 1100, z: 1.05, r: 0 }, 'out'],
  [30.3, { x: 470, y: 1180, z: 1.4, r: 0 }],              // S9 slap
  [31.2, { x: 470, y: 1180, z: 1.5, r: 0 }],
  [31.54, { x: 470, y: 1180, z: 1.5, r: 80 }, 'in'],      // spin into the wall
  [31.55, { x: 600, y: 1240, z: 1.15, r: 90 }, 'hold'],   // S10 wall (rotated)
  [33.6, { x: 650, y: 1220, z: 1.3, r: 92 }],
  [35.24, { x: 700, y: 1220, z: 1.4, r: 90 }],
  [35.25, { x: 820, y: 1100, z: 1.9, r: 90 }, 'hold'],    // S11 Hex deadpan + stairs
  [37.79, { x: 700, y: 1250, z: 1.3, r: 90 }],
  [37.8, { x: 460, y: 1120, z: 1.15, r: 0 }, 'hold'],     // S12 cages
  [40.5, { x: 440, y: 1130, z: 1.3, r: 0 }],
  [42.4, { x: 420, y: 1110, z: 1.55, r: 0 }],
  [43.1, { x: 560, y: 1060, z: 2.8, r: -4 }, 'out'],      // glove ECU "three seconds"
  [44.99, { x: 575, y: 1070, z: 3.2, r: -6 }],
  [45.0, { x: 480, y: 1150, z: 1.25, r: 0 }, 'hold'],     // S13 roof delete
  [48.5, { x: 440, y: 1200, z: 1.6, r: 0 }],
  [49.35, { x: 440, y: 1220, z: 1.7, r: 0 }],
  [50.09, { x: 520, y: 1260, z: 1.2, r: 4 }, 'out'],
  [50.1, { x: 540, y: 960, z: 1.0, r: 0 }, 'hold'],       // FALL (world ≈ screen)
  [53.6, { x: 560, y: 980, z: 1.15, r: 3 }],
  [57.8, { x: 540, y: 1000, z: 1.05, r: 0 }],
  [57.85, { x: 540, y: 900, z: 1.0, r: 0 }, 'hold'],
  [61.29, { x: 540, y: 950, z: 1.15, r: 0 }],
  [61.3, { x: 540, y: 1020, z: 2.6, r: 0 }, 'hold'],      // hands ECU
  [63.4, { x: 540, y: 1020, z: 2.9, r: 0 }],
];
const SHAKES = [[0.9, 14], [9.35, 10], [10.3, 8], [16.35, 10], [17.7, 16], [20.75, 10], [22.25, 26], [28.35, 14], [28.8, 18], [30.55, 30], [39.8, 10], [42.45, 12], [49.35, 40], [55.05, 24], [63.45, 0]];
function shake(t) { let x = 0, y = 0; for (const [t0, a] of SHAKES) if (t >= t0 && t < t0 + .8) { const k = Math.exp(-(t - t0) * 6) * a; x += Math.sin(t * 91 + t0) * k; y += Math.cos(t * 77 + t0 * 3) * k; } return [x, y]; }

// ---------------- captions ----------------
const KEY_CYAN = /delete|deletes|kip|rewinds|gravity|roof/i, KEY_GOLD = /hex|draws|drawing|draw|grid|cage|stairs|pen|parachute|spears|walls/i;
const GROUPS = (() => { const ws = window.WORDS || [], out = []; let cur = [];
  ws.forEach((w, i) => { cur.push(w); const end = /[.?!,…]|\.\.\.$/.test(w[0]); if (cur.length >= 2 || end) { out.push(cur); cur = []; } });
  if (cur.length) out.push(cur); return out.map(gr => ({ words: gr.map(w => w[0]), t0: gr[0][1], t1: gr[gr.length - 1][2] })); })();
function caption(t) {
  let cur = null; for (let i = 0; i < GROUPS.length; i++) { const gr = GROUPS[i], nx = GROUPS[i + 1]; if (t >= gr.t0 - .02 && t < Math.min(nx ? nx.t0 - .02 : 1e9, gr.t1 + .5)) cur = gr; }
  if (!cur) return;
  const words = cur.words.map(w => w.replace(/\.\.\.$/, '…'));
  g.save(); g.font = '900 92px Inter, sans-serif'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
  const widths = words.map(w => g.measureText(w + ' ').width), total = widths.reduce((a, b) => a + b, 0) - g.measureText(' ').width;
  let x = W / 2 - total / 2; const y = H * .72;
  const pop = 1 + .08 * (1 - ramp(t, cur.t0, cur.t0 + .1));
  g.translate(W / 2, y); g.scale(pop, pop); g.translate(-W / 2, -y);
  words.forEach((w, i) => {
    const col = KEY_CYAN.test(w) ? C.cyan : KEY_GOLD.test(w) ? C.gold : '#FFFFFF';
    g.fillStyle = 'rgba(0,0,0,.85)'; g.fillText(w, x + 6, y + 7);
    g.strokeStyle = '#05070C'; g.lineWidth = 14; g.strokeText(w, x, y);
    g.fillStyle = col; g.fillText(w, x, y); x += widths[i];
  });
  g.restore();
}

// ---------------- frame ----------------
const grain = [...Array(4)].map((_, n) => { const c = document.createElement('canvas'); c.width = 270; c.height = 480; const x = c.getContext('2d'); const im = x.createImageData(270, 480);
  for (let i = 0; i < im.data.length; i += 4) { const v = rnd(i * .37 + n * 1000) * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); return c; });
const FLASHES = [[42.3, .3, '#E6FCFF'], [0.9, .5, '#E6FCFF'], [8.8, .35, '#FFF1C8'], [16.35, .4, '#E6FCFF'], [20.75, .35, '#E6FCFF'], [28.35, .45, '#E6FCFF'], [30.55, .5, '#E6FCFF'], [39.8, .4, '#E6FCFF'], [49.35, .8, '#FFFFFF'], [55.0, .5, '#FFF1C8']];
const GLITCHES = [0.9, 16.35, 28.35, 31.4, 49.35, 63.4];
function glitch(t, t0) {
  const n = Math.floor((t - t0) * 30);
  for (let i = 0; i < 9; i++) { const y = rnd(i + n * 13 + t0) * H, h = 20 + rnd(i + 5 + n) * 120, dx = (rnd(i + 9 + n) - .5) * 120; g.drawImage(cv, 0, y, W, h, dx, y, W, h); }
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = .18; g.drawImage(cv, 8, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.fillStyle = 'rgba(56,225,255,.10)'; g.fillRect(0, 0, W, H);
}
function whipBlur(t) { for (const w of WHIPS) if (win(t, w, w + .09)) { const k = 1 - (t - w) / .09; g.save(); g.globalAlpha = .22 * k; for (let i = 1; i <= 4; i++) g.drawImage(cv, i * 26 * k, 0); g.restore(); } }

function worldScene(t, cam) {
  const e = env(t);
  if (e === 'roof') drawRoof(t);
  if (e === 'wall') drawWallEnv(t);
  // props behind characters
  if (e === 'roof') { hexSigil(t); ball(t); box(t); }
  if (e === 'wall') stairs(t);
  // characters
  if (e !== 'fall') {
    // Fold & Lumo
    if (t < 50) { const h = actor('hex', t); drawFold(h.x + 110, h.y - 360, .9, t); }
    if (t < 50) { const k = actor('kip', t), lx = win(t, 26.6, 29.0) ? lerp(k.x - 80, 90, E.out(ramp(t, 26.6, 27.4))) : k.x - 110, ly = win(t, 26.6, 29.0) ? lerp(k.y - 380, 700, E.out(ramp(t, 26.6, 27.4))) : k.y - 390;
      drawLumo(lx, ly, .62, t); if (win(t, 27.3, 28.4)) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(56,225,255,.18)'; g.beginPath(); g.moveTo(lx, ly); g.lineTo(30, 720); g.lineTo(110, 760); g.closePath(); g.fill(); g.restore(); } }
    drawHex(t); drawKip(t);
  }
  if (e === 'roof') { blade(t); spears(t); rewindGhosts(t); grid(t); cages(t); splashes(t); }
  // FX
  vexRing(t, 0.9, 470, 985, C.cyan, 700); vexRing(t, 10.3, 600, FY - 56); vexRing(t, 28.35, 60, 740); vexRing(t, 49.35, 420, FY, C.cyan, 1500);
  flatRing(t, 30.55, 470, FY);
  if (e === 'roof' && win(t, 9.35, 9.9)) dustBurst(t - 9.35, 600, FY, 18);
}
function fallScene(t) {
  drawFallEnv(t);
  g.save(); const cam = track(CAM, t), [sx, sy] = shake(t);
  g.translate(W / 2 + sx, H / 2 + sy); g.scale(cam.z, cam.z); g.rotate(cam.r * D); g.translate(-cam.x, -cam.y);
  const h = actor('hex', t);
  if (t >= 54.2) parachute(t, h.x, h.y - 40);
  // the pen tumbling free until Hex grabs it
  if (t < 52.75) { const k = ramp(t, 50.1, 52.75), px = lerp(560, h.x + 60, k), py = lerp(980, h.y - 60, k); drawPen([px, py], t * 9, t); }
  if (t < 61.3) { drawHex(t); if (t < 57.85 || t >= 57.85) drawKip(t); }
  g.restore();
}
function handsScene(t) { // S17 ECU: gold hand from above, cyan glove from below
  g.fillStyle = lingrad(0, 0, 0, H, [[0, '#120A24'], [.5, '#06101A'], [1, '#03141C']]); g.fillRect(0, 0, W, H);
  const cam = track(CAM, t), z = cam.z / 2.6;
  g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
  const gap = lerp(170, 120, ramp(t, 61.3, 63.4));
  // Hex's arm (violet sleeve) from the top, open hand reaching down
  const hy = 960 - gap / 2, ky = 960 + gap / 2;
  g.save(); g.shadowColor = C.gold; g.shadowBlur = 80; g.fillStyle = 'rgba(242,179,61,.28)'; g.beginPath(); g.arc(545, hy - 60, 200, 0, 7); g.fill(); g.restore();
  g.lineCap = 'round'; g.strokeStyle = C.ink; g.lineWidth = 150; line([600, -200], [550, hy - 230]);
  g.strokeStyle = C.violet; g.lineWidth = 128; line([600, -200], [550, hy - 230]);
  g.strokeStyle = C.gold; g.lineWidth = 10; line([490, hy - 260], [612, hy - 250]);
  g.fillStyle = C.porcelain; g.strokeStyle = C.ink; g.lineWidth = 12; g.beginPath(); g.ellipse(548, hy - 150, 78, 92, 0, 0, 7); g.fill(); g.stroke();
  for (const [dx, len] of [[-58, 70], [-20, 92], [18, 96], [54, 80]]) { g.strokeStyle = C.ink; g.lineWidth = 40; line([548 + dx, hy - 120], [548 + dx * 1.1, hy - 120 + len]); g.strokeStyle = C.porcelain; g.lineWidth = 26; line([548 + dx, hy - 120], [548 + dx * 1.1, hy - 120 + len]); }
  g.strokeStyle = C.ink; g.lineWidth = 40; line([470, hy - 170], [430, hy - 100]); g.strokeStyle = C.porcelain; g.lineWidth = 26; line([470, hy - 170], [430, hy - 100]);
  // Kip's arm with the glove from the bottom
  g.save(); g.shadowColor = C.cyan; g.shadowBlur = 80; g.fillStyle = 'rgba(56,225,255,.18)'; g.beginPath(); g.arc(535, ky + 90, 190, 0, 7); g.fill(); g.restore();
  g.strokeStyle = C.ink; g.lineWidth = 80; line([500, H + 200], [535, ky + 120]);
  drawGlove([535, ky + 90], t, 4.4);
  g.restore();
  // rain, slow
}

function renderAt(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none'; g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const e = env(t);
  if (e === 'black') { if (t < 63.6) { g.fillStyle = `rgba(56,225,255,${.4 * (1 - ramp(t, 63.45, 63.6))})`; g.fillRect(0, 0, W, H); } return; }
  const cam = track(CAM, t), [sx, sy] = shake(t);
  if (t >= 61.3) handsScene(t);
  else if (e === 'fall') fallScene(t);
  else {
    g.save(); g.translate(W / 2 + sx, H / 2 + sy); g.scale(cam.z, cam.z); g.rotate(cam.r * D); g.translate(-cam.x, -cam.y);
    worldScene(t, cam); g.restore();
  }
  // rain (screen space)
  rain(t, cam, t >= 57.85 ? 'slow' : e === 'fall' ? 'fall' : e === 'wall' ? 'wall' : 'roof');
  // atmosphere: fog band + vignette
  g.fillStyle = lingrad(0, H * .55, 0, H, [[0, 'rgba(20,40,55,0)'], [1, 'rgba(20,40,55,.35)']]); g.fillRect(0, 0, W, H);
  for (const [t0, a, c] of FLASHES) if (win(t, t0, t0 + .12)) { g.globalAlpha = a * (1 - (t - t0) / .12); g.fillStyle = c; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  for (const t0 of GLITCHES) if (win(t, t0 + .02, t0 + .12)) glitch(t, t0);
  whipBlur(t);
  const v = g.createRadialGradient(W / 2, H * .46, H * .25, W / 2, H * .5, H * .78); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,3,8,.6)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  g.globalAlpha = .07; g.globalCompositeOperation = 'overlay'; g.drawImage(grain[Math.floor(t * 30) % 4], 0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  caption(t);
}
window.DUR = DUR; window.renderAt = renderAt; window.ready = document.fonts.ready.then(() => true);
