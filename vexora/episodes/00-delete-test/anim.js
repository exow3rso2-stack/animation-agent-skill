// VEXORA · test 00 · "Delete" — wordless physical-comedy short, 9:16, all drawn in code.
// renderAt(t) is pure: any frame can be rendered in any order.
const W = 1080, H = 1920, DUR = 20.4;
const cv = document.getElementById('c'), g = cv.getContext('2d');
const C = { ink: '#0E1624', slate: '#2F5361', mist: '#9FB7C2', ember: '#FF9A4D', orange: '#E8692A', cyan: '#38E1FF', skin: '#FBE3CC', brass: '#C9A24A', silver: '#E9EEF2', coffee: '#4A2A18' };
const FY = 1450, HY = 1230;               // floor line, standing hip height
const PX = 700, PTOP = FY - 260;          // pedestal centre x, top y

// ---------- maths ----------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const E = {
  lin: k => k,
  io: k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2,
  out: k => 1 - Math.pow(1 - k, 3),
  in: k => k * k * k,
  back: k => { const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
  hold: k => 0,
};
const D = Math.PI / 180;
function mix(a, b, k) {
  if (typeof a === 'number') return lerp(a, b, k);
  if (Array.isArray(a)) return a.map((v, i) => mix(v, b[i], k));
  if (a && typeof a === 'object') { const o = {}; for (const key in a) o[key] = key in b ? mix(a[key], b[key], k) : a[key]; for (const key in b) if (!(key in a)) o[key] = b[key]; return o; }
  return k < 1 ? a : b;
}
// keys: [[t, value, ease-into-this-key]]
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

// ---------- story clock ----------
const PRESS = 0.40, DEL_FLOOR = 4.9, DEL_GRAV = 8.1, DEL_LIGHT = 12.5, SMASH = 14.9, CUT = 19.9;
const TICKS = [[3.4, 3], [3.9, 2], [4.4, 1], [6.6, 3], [7.1, 2], [7.6, 1], [11.0, 3], [11.5, 2], [12.0, 1]];
const LUMO_TICKS = [[17.9, 3], [18.6, 2], [19.3, 1]];
const RINGS = [PRESS, DEL_FLOOR, DEL_GRAV, DEL_LIGHT];
const SHAKES = [[PRESS, 10], [DEL_FLOOR, 22], [DEL_GRAV, 18], [DEL_LIGHT, 8], [SMASH, 34], [CUT, 0]];
const floorGone = t => t < DEL_FLOOR || t >= SMASH + .1 ? 0 : clamp((t - DEL_FLOOR) / .45);
const gravity = t => (t >= DEL_GRAV && t < SMASH + .1) ? -1 : 1;
const dark = t => t < DEL_LIGHT || t >= SMASH + .1 ? 0 : clamp((t - DEL_LIGHT) / .08);

// ---------- poses (angles in deg; limbs 0 = straight down, +90 = facing direction) ----------
const P = {
  stand: { torso: 3, head: 0, ra1: -6, ra2: -2, la1: 8, la2: 4, rl1: 10, rl2: 4, ll1: -9, ll2: -3 },
  press: { torso: 14, head: 8, ra1: 62, ra2: 108, la1: -10, la2: 70, rl1: 14, rl2: 4, ll1: -16, ll2: -6 },
  pressed: { torso: 16, head: 10, ra1: 66, ra2: 120, la1: -10, la2: 70, rl1: 14, rl2: 4, ll1: -16, ll2: -6 },
  emptyHand: { torso: 4, head: 14, ra1: -4, ra2: -2, la1: -6, la2: 74, rl1: 10, rl2: 4, ll1: -9, ll2: -3 },
  shrug: { torso: 0, head: -6, ra1: 38, ra2: 150, la1: -38, la2: -150, rl1: 10, rl2: 4, ll1: -9, ll2: -3 },
  worried: { torso: -8, head: -4, ra1: 20, ra2: 60, la1: 10, la2: 70, rl1: 12, rl2: 4, ll1: -12, ll2: -6 },
  fall: { torso: 0, head: -10, ra1: 160, ra2: 175, la1: -160, la2: -175, rl1: 30, rl2: -20, ll1: -20, ll2: -50 },
  float: { torso: 0, head: 0, ra1: 115, ra2: 140, la1: -115, la2: -140, rl1: 28, rl2: 10, ll1: -28, ll2: -10 },
  grab: { torso: 0, head: 0, ra1: 172, ra2: 176, la1: 178, la2: 180, rl1: 12, rl2: 20, ll1: -6, ll2: 10 },
  holdMug: { torso: 3, head: 0, ra1: -6, ra2: -2, la1: 18, la2: 96, rl1: 10, rl2: 4, ll1: -9, ll2: -3 },
  sip: { torso: -4, head: -6, ra1: -6, ra2: -2, la1: 100, la2: -160, rl1: 10, rl2: 4, ll1: -9, ll2: -3 },
};
const S = { torso: 170, head: 72, hr: 60, ua: 95, fa: 90, th: 112, sh: 108 };
const pol = (o, len, a) => [o[0] + len * Math.sin(a * D), o[1] + len * Math.cos(a * D)];

// local skeleton (hip at 0,0)
function skel(p) {
  const hip = [0, 0];
  const neck = [S.torso * Math.sin(p.torso * D), -S.torso * Math.cos(p.torso * D)];
  const hd = (p.torso + p.head) * D;
  const headC = [neck[0] + S.head * Math.sin(hd), neck[1] - S.head * Math.cos(hd)];
  const sh = [neck[0] * .86, neck[1] * .86];
  const re = pol(sh, S.ua, p.ra1), rh = pol(re, S.fa, p.ra2);
  const le = pol(sh, S.ua, p.la1), lh = pol(le, S.fa, p.la2);
  const rk = pol(hip, S.th, p.rl1), rf = pol(rk, S.sh, p.rl2);
  const lk = pol(hip, S.th, p.ll1), lf = pol(lk, S.sh, p.ll2);
  return { hip, neck, headC, sh, re, rh, le, lh, rk, rf, lk, lf };
}
function toWorld(pt, b) {
  const c = Math.cos(b.rot * D), s = Math.sin(b.rot * D), sc = b.sc || 1;
  return [b.x + (pt[0] * c - pt[1] * s) * sc, b.y + (pt[0] * s + pt[1] * c) * sc];
}
// hip position that puts the (right) hand of pose p, rotated by rot, on target
function hipFor(p, rot, target, hand = 'rh') {
  const k = skel(p)[hand]; const w = toWorld(k, { x: 0, y: 0, rot });
  return [target[0] - w[0], target[1] - w[1]];
}
const GRAB_HIP = hipFor(P.grab, 180, [PX - 70, PTOP + 4]);

// body track: x, y, rot + pose
function walkPhase(t) { return t * 9; }
const BODY = [
  [0, { x: 525, y: HY, rot: 0, pose: P.press }],
  [PRESS, { x: 525, y: HY, rot: 0, pose: P.pressed }, 'out'],
  [0.95, { x: 520, y: HY, rot: 0, pose: P.emptyHand }, 'io'],
  [1.8, { x: 520, y: HY, rot: 0, pose: { ...P.emptyHand, head: 22 } }, 'io'],
  [2.6, { x: 520, y: HY, rot: 0, pose: { ...P.stand, head: 0 } }, 'io'],
  [3.0, { x: 520, y: HY, rot: 0, pose: P.shrug }, 'back'],
  [3.35, { x: 520, y: HY, rot: 0, pose: P.shrug }, 'hold'],
  [3.6, { x: 515, y: HY, rot: 0, pose: P.worried }, 'out'],
  [4.8, { x: 385, y: HY, rot: 0, pose: P.worried }, 'io'],
  [4.9, { x: 385, y: HY, rot: 0, pose: P.stand }, 'out'],
  [5.55, { x: 385, y: HY, rot: 0, pose: { ...P.stand, head: 0 } }, 'hold'],
  [5.62, { x: 385, y: HY - 14, rot: 0, pose: P.fall }, 'out'],
  [6.15, { x: 395, y: HY + 1000, rot: 14, pose: P.fall }, 'in'],
  [8.35, { x: 420, y: 2350, rot: -20, pose: P.float }, 'hold'],
  [9.4, { x: 470, y: 1650, rot: 60, pose: P.float }, 'out'],
  [10.4, { x: GRAB_HIP[0], y: GRAB_HIP[1], rot: 180, pose: P.grab }, 'io'],
  [12.5, { x: GRAB_HIP[0], y: GRAB_HIP[1], rot: 180, pose: P.grab }, 'io'],
  [15.0, { x: 470, y: HY, rot: 0, pose: P.holdMug }, 'hold'],
  [16.2, { x: 470, y: HY + 6, rot: 0, pose: { ...P.holdMug, torso: -2 } }, 'io'],
  [16.7, { x: 470, y: HY, rot: 0, pose: P.holdMug }, 'io'],
  [17.3, { x: 470, y: HY, rot: 0, pose: P.sip }, 'io'],
  [19.3, { x: 470, y: HY, rot: 0, pose: { ...P.sip, head: 4 } }, 'io'],
  [19.6, { x: 470, y: HY, rot: 0, pose: { ...P.sip, la1: 40, la2: 30 } }, 'out'],
];
// face: look [dx,dy] in head radii, eyes, brows [l,r] degrees, lift, mouth
const FACE = [
  [0, { look: [.32, .12], eyes: 'dot', brow: [0, 0], lift: 0, mouth: 'none' }],
  [0.8, { look: [.36, .3], eyes: 'ring', brow: [12, -12], lift: 8, mouth: 'o' }, 'out'],
  [1.8, { look: [.25, .45], eyes: 'ring', brow: [12, -12], lift: 8, mouth: 'o' }],
  [2.6, { look: [0, 0], eyes: 'dot', brow: [0, -18], lift: 4, mouth: 'smirk' }],
  [3.4, { look: [0, 0], eyes: 'dot', brow: [0, -18], lift: 4, mouth: 'smirk' }, 'hold'],
  [3.5, { look: [.4, .05], eyes: 'dot', brow: [16, -16], lift: 6, mouth: 'line' }, 'out'],
  [4.9, { look: [.4, .05], eyes: 'ring', brow: [16, -16], lift: 8, mouth: 'line' }],
  [5.05, { look: [.15, .5], eyes: 'dot', brow: [10, -10], lift: 4, mouth: 'line' }, 'out'],
  [5.3, { look: [0, 0], eyes: 'half', brow: [0, 0], lift: 0, mouth: 'line' }, 'out'],
  [5.62, { look: [0, -.2], eyes: 'ring', brow: [18, -18], lift: 12, mouth: 'o' }, 'out'],
  [10.4, { look: [.1, .3], eyes: 'ring', brow: [18, -18], lift: 12, mouth: 'o' }],
  [12.5, { look: [0, 0], eyes: 'ring', brow: [18, -18], lift: 12, mouth: 'o' }],
  [13.5, { look: [-.35, 0], eyes: 'dot', brow: [0, 0], lift: 0, mouth: 'none' }, 'io'],
  [14.0, { look: [.3, 0], eyes: 'half', brow: [-14, 14], lift: -2, mouth: 'line' }, 'io'],
  [15.0, { look: [-.3, 0], eyes: 'ring', brow: [14, -14], lift: 8, mouth: 'o' }, 'hold'],
  [15.5, { look: [.3, -.05], eyes: 'ring', brow: [14, -14], lift: 8, mouth: 'o' }, 'io'],
  [15.9, { look: [.35, .35], eyes: 'dot', brow: [6, -6], lift: 4, mouth: 'line' }, 'io'],
  [16.3, { look: [0, 0], eyes: 'closed', brow: [-6, 6], lift: 0, mouth: 'line' }, 'io'],
  [16.7, { look: [0, 0], eyes: 'dot', brow: [0, -18], lift: 4, mouth: 'smirk' }, 'io'],
  [17.3, { look: [0, 0], eyes: 'closed', brow: [0, 0], lift: 0, mouth: 'none' }, 'io'],
  [17.9, { look: [0, 0], eyes: 'closed', brow: [0, 0], lift: 0, mouth: 'none' }, 'hold'],
  [18.0, { look: [.45, -.05], eyes: 'dot', brow: [0, 0], lift: 0, mouth: 'none' }, 'out'],
  [18.6, { look: [.45, -.05], eyes: 'dot', brow: [0, 0], lift: 0, mouth: 'none' }, 'hold'],
  [18.7, { look: [.45, -.05], eyes: 'ring', brow: [16, -16], lift: 10, mouth: 'none' }, 'out'],
  [19.3, { look: [.45, -.05], eyes: 'pin', brow: [22, -22], lift: 14, mouth: 'o' }, 'out'],
];

function walkOverlay(p, t) {
  // backwards shuffle 3.6–4.8
  if (!win(t, 3.6, 4.8)) return p;
  const a = Math.sin(walkPhase(t)) * 16, k = Math.sin(clamp((t - 3.6) / 1.2) * Math.PI);
  return { ...p, rl1: p.rl1 + a * k, ll1: p.ll1 - a * k, rl2: p.rl2 + Math.max(0, a) * k, ll2: p.ll2 + Math.max(0, -a) * k };
}
function flailOverlay(p, t) {
  if (win(t, 5.62, 6.4)) { const s = Math.sin(t * 38) * 14; return { ...p, ra1: p.ra1 + s, la1: p.la1 - s, ra2: p.ra2 + s * 1.5, la2: p.la2 - s * 1.5, rl1: p.rl1 + s, ll1: p.ll1 - s }; }
  if (win(t, 8.35, 10.4)) { const s = Math.sin(t * 7) * 18, q = Math.sin(t * 5.3) * 12; return { ...p, ra1: p.ra1 + s, la1: p.la1 + q, ra2: p.ra2 + q, la2: p.la2 - s, rl1: p.rl1 + q, ll1: p.ll1 - s * .6 }; }
  if (win(t, 10.4, 15)) { const s = Math.sin(t * 3.1) * 7; return { ...p, rl1: p.rl1 + s, ll1: p.ll1 - s, rl2: p.rl2 + s * 1.4, ll2: p.ll2 + s }; }
  return p;
}
function body(t) {
  const b = track(BODY, t);
  let p = flailOverlay(walkOverlay(b.pose, t), t);
  let rot = b.rot;
  if (win(t, 10.4, 15)) rot += Math.sin(t * 2.2) * 5;            // float wobble
  // breathing / secondary motion
  p = { ...p, torso: p.torso + Math.sin(t * 2.6) * 1.2, head: p.head + Math.sin(t * 1.7 + 1) * 1.2 };
  // anticipation dip before the fall
  return { x: b.x, y: b.y + (win(t, 5.45, 5.62) ? Math.sin((t - 5.45) / .17 * Math.PI) * 18 : 0), rot, sc: 1, pose: p };
}

// ---------- camera ----------
const CAM = [
  [0, { x: PX - 50, y: PTOP - 10, z: 3.6, r: 0 }],
  [0.58, { x: PX - 40, y: PTOP, z: 4.0, r: 0 }, 'io'],
  [0.6, { x: 560, y: 1130, z: 1.22, r: 0 }, 'hold'],          // smash zoom out
  [2.6, { x: 545, y: 1100, z: 1.34, r: 0 }, 'out'],
  [3.4, { x: 545, y: 1100, z: 1.38, r: 0 }, 'io'],
  [3.55, { x: 575, y: 1110, z: 1.5, r: 0 }, 'out'],            // tick push
  [4.85, { x: 540, y: 1140, z: 1.3, r: 0 }, 'io'],
  [5.5, { x: 520, y: 1120, z: 1.24, r: -4 }, 'io'],
  [6.2, { x: 520, y: 1380, z: 1.12, r: 0 }, 'in'],             // tilt down with the fall
  [6.4, { x: PX, y: PTOP + 60, z: 1.75, r: 0 }, 'hold'],       // cut to pedestal
  [8.05, { x: PX, y: PTOP + 40, z: 1.95, r: 0 }, 'io'],
  [8.6, { x: 600, y: 1350, z: 1.05, r: 8 }, 'out'],            // zoom out: zero-g
  [10.4, { x: 600, y: 1080, z: 1.1, r: 8 }, 'io'],
  [12.4, { x: 640, y: 1000, z: 1.32, r: 4 }, 'io'],
  [14.9, { x: 640, y: 960, z: 1.45, r: 2 }, 'io'],
  [15.0, { x: 520, y: 1110, z: 1.36, r: 0 }, 'hold'],
  [16.9, { x: 500, y: 1060, z: 1.5, r: 0 }, 'io'],
  [18.55, { x: 520, y: 990, z: 1.75, r: 0 }, 'io'],
  [18.75, { x: 545, y: 950, z: 2.3, r: 0 }, 'out'],            // smash push on "2"
  [19.9, { x: 550, y: 940, z: 2.7, r: -3 }, 'lin'],            // dolly in on "1"
];
function shake(t) {
  let x = 0, y = 0;
  for (const [t0, a] of SHAKES) if (t >= t0 && t < t0 + .8) { const k = Math.exp(-(t - t0) * 6) * a; x += Math.sin(t * 91 + t0) * k; y += Math.cos(t * 77 + t0 * 3) * k; }
  return [x, y];
}

// ---------- drawing: world ----------
function grad(y0, y1, stops) { const gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
function drawBackdrop(t) {
  // cyclorama wall
  g.fillStyle = grad(-600, FY, [[0, '#0A1622'], [.5, '#1E3D4E'], [1, '#4F7C8E']]);
  g.fillRect(-1200, -1200, 3500, FY + 1200);
  // key light pool on the wall
  const k = g.createRadialGradient(PX - 60, FY - 380, 20, PX - 60, FY - 380, 900);
  k.addColorStop(0, 'rgba(255,170,110,.26)'); k.addColorStop(1, 'rgba(255,190,130,0)');
  g.fillStyle = k; g.fillRect(-1200, -1200, 3500, FY + 1200);
  // distant shelving silhouettes (depth)
  g.fillStyle = 'rgba(14,22,36,.35)';
  for (let i = 0; i < 7; i++) { const x = -160 + i * 230, h = 380 + rnd(i) * 260; g.fillRect(x, FY - h, 150, h); }
  g.fillStyle = 'rgba(255,170,110,.20)';
  for (let i = 0; i < 7; i++) { const x = -160 + i * 230, h = 380 + rnd(i) * 260; for (let j = 0; j < 4; j++) g.fillRect(x + 12, FY - h + 30 + j * 90, 126, 6); }
  // Lumo tick light: tiny practical lamps blink with every tick (clue)
}
function drawFloor(t) {
  const gone = floorGone(t);
  // void beneath everything
  g.fillStyle = grad(FY, FY + 1600, [[0, '#08101C'], [1, '#02050A']]);
  g.fillRect(-1200, FY, 3500, 2400);
  if (gone > 0) { // faint cyan grid in the void
    g.save(); g.globalAlpha = .35 * gone; g.strokeStyle = C.cyan; g.lineWidth = 2;
    for (let i = -10; i < 20; i++) { g.beginPath(); g.moveTo(540 + i * 140, FY); g.lineTo(540 + i * 420, FY + 2400); g.stroke(); }
    for (let j = 1; j < 14; j++) { const y = FY + Math.pow(j, 1.7) * 30; g.globalAlpha = .3 * gone * (1 - j / 14); g.beginPath(); g.moveTo(-1200, y); g.lineTo(2400, y); g.stroke(); }
    g.restore();
  }
  // the floor slab dissolves into cyan squares
  const cell = 60;
  for (let gx = -1200; gx < 2400; gx += cell) for (let gy = FY; gy < FY + 900; gy += cell) {
    const i = gx * 7.13 + gy * 1.71, thr = rnd(i) * .85 + Math.abs(gx - PX) / 6000;
    if (gone > thr + .12) continue;
    const dissolving = gone > thr;
    const yy = gy + (dissolving ? (gone - thr) * 900 : 0);
    const shade = 0.2 + (gy - FY) / 1600;
    g.fillStyle = dissolving ? C.cyan : `rgb(${Math.round(lerp(58, 18, shade))},${Math.round(lerp(92, 34, shade))},${Math.round(lerp(106, 46, shade))})`;
    g.globalAlpha = dissolving ? 1 - (gone - thr) / .12 : 1;
    g.fillRect(gx, yy, cell + 1, cell + 1);
  }
  g.globalAlpha = 1;
  if (gone < 1) {
    // perspective boards + warm light pool on the floor
    g.save(); g.globalAlpha = 1 - gone;
    g.strokeStyle = 'rgba(14,22,36,.25)'; g.lineWidth = 3;
    for (let i = -12; i < 20; i++) { g.beginPath(); g.moveTo(540 + i * 90, FY); g.lineTo(540 + i * 330, FY + 900); g.stroke(); }
    const pool = g.createRadialGradient(PX - 80, FY + 60, 10, PX - 80, FY + 60, 620);
    pool.addColorStop(0, 'rgba(255,160,90,.30)'); pool.addColorStop(1, 'rgba(255,170,100,0)');
    g.fillStyle = pool; g.fillRect(-1200, FY, 3500, 900);
    g.fillStyle = 'rgba(255,220,190,.35)'; g.fillRect(-1200, FY - 2, 3500, 4);
    g.restore();
  }
}
function contactShadow(x, w, a = .45) {
  const s = g.createRadialGradient(x, FY + 6, 4, x, FY + 6, w);
  s.addColorStop(0, `rgba(5,10,20,${a})`); s.addColorStop(1, 'rgba(5,10,20,0)');
  g.save(); g.translate(x, FY + 6); g.scale(1, .18); g.translate(-x, -(FY + 6));
  g.fillStyle = s; g.beginPath(); g.arc(x, FY + 6, w, 0, 7); g.fill(); g.restore();
}
function currentDigit(t) {
  const ev = [...TICKS.map(([a, n]) => [a, n]), [DEL_FLOOR, 'X'], [DEL_GRAV, 'X'], [DEL_LIGHT, 'X']].sort((a, b) => a[0] - b[0]);
  let last = null; for (const e of ev) if (t >= e[0]) last = e;
  if (!last) return null;
  if (last[1] === 'X') return t - last[0] < .6 ? 'X' : null;
  return last[1];
}
function pedestalAlive(t) { return t < SMASH; }
function drawPedestal(t, emissiveOnly = false) {
  if (!pedestalAlive(t)) return;
  const gone = floorGone(t);
  const press = win(t, PRESS - .05, PRESS + .25) ? Math.sin(clamp((t - PRESS + .05) / .3) * Math.PI) : 0;
  if (!emissiveOnly) {
    if (gone < 1) contactShadow(PX, 150, .5 * (1 - gone));
    // column (extends into the void once the floor is gone)
    const bottom = FY + gone * 2000;
    const col = g.createLinearGradient(PX - 55, 0, PX + 55, 0);
    col.addColorStop(0, '#3A5A69'); col.addColorStop(.35, '#6E93A3'); col.addColorStop(1, '#1B2C3A');
    g.fillStyle = col; g.fillRect(PX - 55, PTOP + 18, 110, bottom - PTOP - 18);
    g.strokeStyle = C.ink; g.lineWidth = 8; g.strokeRect(PX - 55, PTOP + 18, 110, bottom - PTOP - 18);
    // top plate
    const pl = g.createLinearGradient(0, PTOP, 0, PTOP + 30);
    pl.addColorStop(0, '#9BB8C4'); pl.addColorStop(1, '#3B5967');
    g.fillStyle = pl; roundRect(PX - 78, PTOP, 156, 28, 8); g.fill(); g.stroke();
    // display
    g.fillStyle = '#071019'; roundRect(PX - 36, PTOP + 60, 72, 92, 10); g.fill(); g.stroke();
  }
  const d = currentDigit(t);
  if (d !== null) {
    g.save(); g.fillStyle = d === 'X' ? '#FF3B3B' : C.cyan; g.shadowColor = g.fillStyle; g.shadowBlur = 24;
    g.font = '900 72px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(d === 'X' ? '×' : String(d), PX, PTOP + 108); g.restore();
  }
  // dome button
  const by = PTOP - 26 + press * 12;
  g.save();
  g.shadowColor = C.cyan; g.shadowBlur = 60 + 30 * Math.sin(t * 6);
  const dome = g.createRadialGradient(PX - 16, by - 18, 4, PX, by, 54);
  dome.addColorStop(0, '#E6FCFF'); dome.addColorStop(.35, C.cyan); dome.addColorStop(1, '#0B7F99');
  g.fillStyle = dome; g.beginPath(); g.ellipse(PX, by + 12, 52, 44, 0, Math.PI, 0); g.closePath(); g.fill();
  g.restore();
  if (!emissiveOnly) { g.strokeStyle = C.ink; g.lineWidth = 8; g.beginPath(); g.ellipse(PX, by + 12, 52, 44, 0, Math.PI, 0); g.closePath(); g.stroke(); }
}
function roundRect(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

// ---------- character ----------
function line(a, b) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
function limb(a, b, c) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.stroke(); }
function mugState(t) {
  if (t < 0.6) return 'full';
  if (t < 0.95) return 'dissolve';
  if (t < SMASH + .1) return 'none';
  if (t < 19.3) return 'full';
  return 'drop';
}
function drawMug(at, k = 1, tilt = 0) {
  g.save(); g.translate(at[0], at[1]); g.rotate(tilt); g.globalAlpha *= k;
  g.lineWidth = 8; g.strokeStyle = C.ink;
  g.fillStyle = '#F3F1EC'; roundRect(-6, -40, 50, 56, 8); g.fill(); g.stroke();
  g.fillStyle = C.orange; g.fillRect(-2, -18, 42, 12);
  g.beginPath(); g.arc(48, -12, 14, -Math.PI / 2, Math.PI / 2); g.stroke();
  g.fillStyle = C.coffee; g.fillRect(-2, -36, 42, 7);
  g.restore();
}
function drawFigure(t, opts = {}) {
  const b = body(t), k = skel(b.pose), w = {};
  for (const key in k) w[key] = toWorld(k[key], b);
  const f = track(FACE, t);
  // contact shadow
  if (floorGone(t) < 1 && b.y < FY && gravity(t) > 0) contactShadow(b.x + 10, 120, .55 * (1 - floorGone(t)));
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = C.ink;
  // scarf tails (behind body): blown opposite to neck velocity, lifted when gravity is off
  const b2 = body(t - .07), n2 = toWorld(skel(b2.pose).neck, b2);
  const vx = (w.neck[0] - n2[0]) / .07, vy = (w.neck[1] - n2[1]) / .07;
  const gdir = gravity(t);
  for (let i = 0; i < 2; i++) {
    const L = 95 - i * 18, fl = Math.sin(t * 9 + i * 1.7) * 14;
    const dx = clamp(-vx * .09, -80, 80) - 26 - i * 10, dy = clamp(-vy * .09, -90, 90) + 60 * gdir;
    const m = Math.hypot(dx, dy) || 1, ux = dx / m, uy = dy / m;
    const end = [w.neck[0] + ux * L, w.neck[1] + 10 + uy * L];
    const mid = [w.neck[0] + ux * L * .5 - uy * fl, w.neck[1] + 10 + uy * L * .5 + ux * fl];
    g.strokeStyle = i ? '#B9501F' : C.orange; g.lineWidth = 22 - i * 4;
    g.beginPath(); g.moveTo(w.neck[0], w.neck[1] + 10); g.quadraticCurveTo(mid[0], mid[1], end[0], end[1]); g.stroke();
  }
  g.strokeStyle = C.ink;
  // back limbs
  g.lineWidth = 20; g.globalAlpha = .92;
  limb(w.hip, w.lk, w.lf); limb(w.sh, w.le, w.lh);
  g.globalAlpha = 1;
  // torso
  g.lineWidth = 22; line(w.hip, w.neck);
  // scarf collar
  g.strokeStyle = C.orange; g.lineWidth = 26; line([w.neck[0] - 4, w.neck[1] + 12], [w.neck[0] + 6, w.neck[1] + 4]);
  g.strokeStyle = C.ink;
  // front limbs
  g.lineWidth = 20; limb(w.hip, w.rk, w.rf);
  // mug in back (left) hand
  const ms = mugState(t);
  if (ms === 'full') drawMug([w.lh[0] - 4, w.lh[1] + 6], 1, b.rot * D * 0 + (b.pose.la2 < -100 ? -0.9 : 0));
  if (ms === 'dissolve') drawMug([w.lh[0] - 4, w.lh[1] + 6], 1 - (t - .6) / .35);
  if (ms === 'drop') { const k2 = (t - 19.3); drawMug([w.lh[0] + 10 + k2 * 60, w.lh[1] + 6 + k2 * k2 * 2400], 1, k2 * 5); }
  limb(w.sh, w.re, w.rh);
  // head
  drawHead(w.headC, (b.rot + b.pose.torso + b.pose.head) * D, f, t);
  return w;
}
function drawHead(c, ang, f, t, eyesOnly = false) {
  const r = S.hr;
  g.save(); g.translate(c[0], c[1]); g.rotate(ang);
  if (!eyesOnly) {
    // skin with soft 2.5D shading: warm key from the left, cool bounce from the right
    const sk = g.createRadialGradient(-22, -18, 6, 0, 0, r * 1.05);
    sk.addColorStop(0, '#FFF1E2'); sk.addColorStop(.6, C.skin); sk.addColorStop(1, '#D9B9A2');
    g.fillStyle = sk; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
    // hair cap
    g.fillStyle = '#20232B';
    g.beginPath(); g.arc(0, 0, r, Math.PI * 1.02, Math.PI * 1.98);
    for (let i = 0; i <= 6; i++) { const a = Math.PI * 1.98 - i * (Math.PI * .96 / 6); const rr = i % 2 ? r - 18 : r - 6; g.lineTo(Math.cos(a) * rr * (i % 2 ? .9 : 1), Math.sin(a) * rr * .55 - 6); }
    g.closePath(); g.fill();
    // tuft + silver streak
    g.strokeStyle = '#20232B'; g.lineWidth = 12; g.beginPath(); g.moveTo(-6, -r + 4); g.quadraticCurveTo(-4, -r - 26, 18, -r - 22); g.stroke();
    g.strokeStyle = C.silver; g.lineWidth = 9; g.beginPath(); g.moveTo(10, -r + 8); g.quadraticCurveTo(26, -r + 30, 18, -r + 48); g.stroke();
    // goggles on forehead
    g.strokeStyle = '#5A4630'; g.lineWidth = 7; g.beginPath(); g.arc(0, 0, r - 3, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    for (const gx of [-12, 26]) { g.fillStyle = '#7FD8E6'; g.strokeStyle = C.brass; g.lineWidth = 6; g.beginPath(); g.arc(gx, -r + 18, 13, 0, 7); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(gx - 4, -r + 13, 4, 0, 7); g.fill(); }
    g.strokeStyle = C.ink; g.lineWidth = 12; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke();
  }
  // face
  const [lx, ly] = f.look, ex = lx * r * .55, ey = ly * r * .45 + 8;
  const eyes = [[-20 + ex, ey], [20 + ex, ey]];
  const col = eyesOnly ? '#FFFFFF' : C.ink;
  g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 6;
  const blink = (t % 3.3) < .09 && f.eyes === 'dot';
  eyes.forEach(([x, y], i) => {
    if (blink || f.eyes === 'closed') { g.beginPath(); g.arc(x, y - 2, 8, .15, Math.PI - .15); g.stroke(); return; }
    if (f.eyes === 'dot') { g.beginPath(); g.ellipse(x, y, 7, 9, 0, 0, 7); g.fill(); }
    if (f.eyes === 'ring') { g.beginPath(); g.arc(x, y, 11, 0, 7); g.stroke(); g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill(); }
    if (f.eyes === 'pin') { g.beginPath(); g.arc(x, y, 13, 0, 7); g.stroke(); g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); }
    if (f.eyes === 'half') { g.lineWidth = 7; line([x - 9, y], [x + 9, y]); g.lineWidth = 6; }
  });
  if (eyesOnly) { g.restore(); return; }
  // brows
  g.lineWidth = 7;
  eyes.forEach(([x, y], i) => {
    const a = (i ? f.brow[1] : f.brow[0]) * D, by = y - 22 - f.lift - (i && f.mouth === 'smirk' ? 6 : 0);
    g.save(); g.translate(x, by); g.rotate(a); line([-10, 0], [10, 0]); g.restore();
  });
  // mouth
  const mx = ex * .8 + 2, my = 34 + ly * 8;
  g.lineWidth = 6;
  if (f.mouth === 'smirk') { g.beginPath(); g.moveTo(mx - 12, my + 2); g.quadraticCurveTo(mx + 2, my + 8, mx + 16, my - 4); g.stroke(); }
  if (f.mouth === 'line') line([mx - 9, my + 2], [mx + 9, my + 2]);
  if (f.mouth === 'o') { g.beginPath(); g.ellipse(mx, my + 2, 7, 9, 0, 0, 7); g.stroke(); }
  g.restore();
}

// ---------- Lumo ----------
const LUMO = [
  [0, { x: 880, y: 860, s: .68, blur: 2 }],
  [17.4, { x: 880, y: 860, s: .68, blur: 2 }, 'hold'],
  [17.45, { x: 1150, y: 900, s: 1, blur: 0 }, 'hold'],
  [17.95, { x: 640, y: 905, s: 1, blur: 0 }, 'back'],
];
function lumoDigit(t) { let d = null; for (const [tt, n] of LUMO_TICKS) if (t >= tt) d = n; return d; }
function tickFlash(t) { for (const [tt] of TICKS) if (t >= tt && t < tt + .18) return 1 - (t - tt) / .18; return 0; }
function drawLumo(t, emissiveOnly = false) {
  if (win(t, DEL_FLOOR, SMASH) && !emissiveOnly && dark(t) > 0) return;
  const L = track(LUMO, t), x = L.x, y = L.y + Math.sin(t * 2.4) * 10, s = L.s;
  g.save(); g.translate(x, y); g.scale(s, s);
  if (L.blur && !emissiveOnly) g.filter = `blur(${L.blur}px)`;
  if (!emissiveOnly) {
    // levitation ring
    g.strokeStyle = 'rgba(56,225,255,.85)'; g.lineWidth = 5; g.shadowColor = C.cyan; g.shadowBlur = 20;
    g.beginPath(); g.ellipse(0, 52, 30, 7, 0, 0, 7); g.stroke(); g.shadowBlur = 0;
    const sh = g.createRadialGradient(-12, -14, 4, 0, 0, 40);
    sh.addColorStop(0, '#FFFFFF'); sh.addColorStop(.7, '#DCE3E8'); sh.addColorStop(1, '#8E9BA6');
    g.fillStyle = sh; g.beginPath(); g.arc(0, 0, 38, 0, 7); g.fill();
    g.strokeStyle = C.ink; g.lineWidth = 6; g.stroke();
    g.lineWidth = 3; g.strokeStyle = 'rgba(14,22,36,.5)'; g.beginPath(); g.ellipse(0, 0, 38, 9, 0, 0, Math.PI); g.stroke();
  }
  // eye
  const d = lumoDigit(t), fl = Math.max(tickFlash(t), 0);
  g.shadowColor = C.cyan; g.shadowBlur = 25 + fl * 40;
  g.fillStyle = C.cyan; g.beginPath(); g.arc(10, -4, 15 + fl * 3, 0, 7); g.fill();
  g.shadowBlur = 0;
  if (d !== null) { g.fillStyle = '#04202A'; g.font = '900 24px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(d), 10, -3); }
  else { g.fillStyle = '#04202A'; g.beginPath(); g.arc(13, -4, 5, 0, 7); g.fill(); }
  g.restore(); g.filter = 'none';
}

// ---------- FX ----------
function vexRing(t, t0, x, y) {
  const k = (t - t0) / .55; if (k < 0 || k > 1) return;
  const r = E.out(k) * 1100;
  g.save(); g.globalAlpha = (1 - k);
  g.strokeStyle = C.cyan; g.shadowColor = C.cyan; g.shadowBlur = 30; g.lineWidth = 10 * (1 - k) + 2;
  g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
  g.lineWidth = 3; g.globalAlpha = (1 - k) * .5; g.beginPath(); g.arc(x, y, r * .82, 0, 7); g.stroke();
  g.restore();
}
function mugParticles(t, at) {
  if (!win(t, .6, 1.6)) return;
  const k = t - .6;
  for (let i = 0; i < 40; i++) {
    const a = rnd(i) * 6.28, sp = 80 + rnd(i + 9) * 260;
    const x = at[0] + 20 + Math.cos(a) * sp * k + (rnd(i + 3) - .5) * 40, y = at[1] - 10 + Math.sin(a) * sp * k - 120 * k;
    const s = 6 + rnd(i + 5) * 10;
    g.globalAlpha = clamp(1 - k / (.4 + rnd(i + 2) * .6));
    g.fillStyle = i % 4 ? C.cyan : '#FFFFFF'; g.fillRect(x, y, s, s);
  }
  g.globalAlpha = 1;
}
let MUG0 = null;
function coffee(t) {
  if (!MUG0) { const b = body(.6), k = skel(b.pose); MUG0 = toWorld(k.lh, b); MUG0 = [MUG0[0] - 4, MUG0[1] + 6]; }
  const [mx, my] = MUG0;
  if (win(t, .7, 1.7)) { // floating coffee keeps the mug's shape
    g.fillStyle = C.coffee; const wob = Math.sin(t * 14) * 2;
    roundRect(mx - 4 + wob, my - 36, 46, 50, 10); g.fill();
    g.fillStyle = 'rgba(255,200,150,.35)'; g.fillRect(mx + 4, my - 30, 8, 30);
  }
  if (win(t, 1.7, 1.95)) { const k = (t - 1.7) / .25; const y = lerp(my - 36, FY - 40, k * k);
    g.fillStyle = C.coffee; g.beginPath(); g.ellipse(mx + 20, y + 25, 22 - k * 6, 28 + k * 20, 0, 0, 7); g.fill(); }
  if (t >= 1.95 && t < DEL_FLOOR + .3) {
    const k = clamp((t - 1.95) / .35), a = t < DEL_FLOOR ? 1 : 1 - (t - DEL_FLOOR) / .3;
    g.save(); g.globalAlpha = a; g.fillStyle = C.coffee;
    g.beginPath(); g.ellipse(mx + 20, FY + 8, 30 + 60 * E.out(k), 9 + 7 * E.out(k), 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,210,170,.35)'; g.beginPath(); g.ellipse(mx + 6, FY + 4, 20 * E.out(k), 3, 0, 0, 7); g.fill();
    if (k < 1) for (let i = 0; i < 14; i++) { const a2 = -Math.PI * rnd(i + 40), sp = 200 + rnd(i) * 300, tt = t - 1.95;
      g.beginPath(); g.arc(mx + 20 + Math.cos(a2) * sp * tt, FY + Math.sin(a2) * sp * tt + 1400 * tt * tt, 6, 0, 7); g.fill(); }
    g.restore();
  }
  // gravity off: drops float upward
  if (win(t, DEL_GRAV, SMASH)) { const k = t - DEL_GRAV; g.fillStyle = C.coffee;
    for (let i = 0; i < 10; i++) g.beginPath(), g.arc(mx + (rnd(i) - .5) * 200 + Math.sin(t + i) * 10, FY + 300 - k * (60 + rnd(i + 2) * 90), 7 + rnd(i) * 6, 0, 7), g.fill(); }
}
function dust(t) {
  const gdir = gravity(t);
  for (let i = 0; i < 70; i++) {
    const x0 = rnd(i) * 1400 - 160, z = .4 + rnd(i + 7) * .8;
    let y = (rnd(i + 3) * 2200 - 300 + (gdir > 0 ? t * 14 : (DEL_GRAV * 14 - (t - DEL_GRAV) * 90)) * z) % 2200;
    if (y < 0) y += 2200;
    const x = x0 + Math.sin(t * .6 + i) * 30;
    g.fillStyle = `rgba(255,225,190,${.18 * z})`; g.beginPath(); g.arc(x, y - 300, 2.5 * z, 0, 7); g.fill();
  }
}
function lightBeam(t) {
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createLinearGradient(-200, 0, 900, 1500);
  gr.addColorStop(0, 'rgba(255,190,130,.10)'); gr.addColorStop(1, 'rgba(255,190,130,0)');
  g.fillStyle = gr; g.beginPath(); g.moveTo(-300, -400); g.lineTo(80, -400); g.lineTo(1000, FY); g.lineTo(450, FY); g.closePath(); g.fill();
  g.restore();
}
function shards(t) {
  if (!win(t, SMASH, SMASH + 2.6)) return;
  const k = t - SMASH;
  for (let i = 0; i < 46; i++) {
    const a = -Math.PI * (.1 + .8 * rnd(i)), sp = 300 + rnd(i + 1) * 900;
    const x = PX + Math.cos(a) * sp * k, y = PTOP - 20 + Math.sin(a) * sp * k + 900 * k * k;
    g.save(); g.translate(x, y); g.rotate(k * 8 * (rnd(i + 2) - .5)); g.globalAlpha = clamp(1.4 - k * .7);
    g.fillStyle = i % 3 ? C.cyan : '#E6FCFF'; g.shadowColor = C.cyan; g.shadowBlur = 12;
    const s = 8 + rnd(i + 4) * 22; g.beginPath(); g.moveTo(0, -s); g.lineTo(s * .6, s * .5); g.lineTo(-s * .5, s * .4); g.closePath(); g.fill(); g.restore();
  }
}
function foreground(t, cam) {
  // blurred hanging cable on the left edge (parallax 1.6x)
  g.save(); g.filter = 'blur(14px)'; g.strokeStyle = '#05080E'; g.lineWidth = 46; g.lineCap = 'round';
  const ox = -(cam.x - 540) * .6, sway = Math.sin(t * .9) * 20;
  g.beginPath(); g.moveTo(40 + ox, -100); g.quadraticCurveTo(140 + ox + sway, 700, 30 + ox, 1300); g.stroke();
  g.restore(); g.filter = 'none';
}

// ---------- frame ----------
const grain = [...Array(4)].map((_, n) => { const c = document.createElement('canvas'); c.width = 270; c.height = 480; const x = c.getContext('2d'); const im = x.createImageData(270, 480);
  for (let i = 0; i < im.data.length; i += 4) { const v = rnd(i * .37 + n * 1000) * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); return c; });

function renderAt(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none'; g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  if (t >= CUT) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); return; }
  const cam = track(CAM, t), [sx, sy] = shake(t);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.save();
  g.translate(W / 2 + sx, H / 2 + sy); g.scale(cam.z, cam.z); g.rotate(cam.r * D); g.translate(-cam.x, -cam.y);
  drawBackdrop(t);
  if (t < 17.45) drawLumo(t);
  drawFloor(t);
  lightBeam(t);
  coffee(t);
  drawPedestal(t);
  const figVisible = !(win(t, 6.2, 8.35));
  let fw = null;
  if (figVisible) fw = drawFigure(t);
  if (MUG0) mugParticles(t, MUG0);
  shards(t);
  if (t >= 17.45) drawLumo(t);
  dust(t);
  for (const r of RINGS) vexRing(t, r, PX, PTOP - 20);
  g.restore();

  // darkness: only emissive things survive
  const dk = dark(t);
  if (dk > 0) {
    g.fillStyle = `rgba(0,0,0,${dk})`; g.fillRect(0, 0, W, H);
    g.save(); g.translate(W / 2 + sx, H / 2 + sy); g.scale(cam.z, cam.z); g.rotate(cam.r * D); g.translate(-cam.x, -cam.y);
    if (t < SMASH) drawPedestal(t, true);
    drawLumoBg(t);
    if (fw && !win(t, 14.45, SMASH)) { const b = body(t); drawHead(fw.headC, (b.rot + b.pose.torso + b.pose.head) * D, track(FACE, t), t, true); }
    g.restore();
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  foreground(t, cam);
  // whoosh streak in the dark before the smash
  if (win(t, 14.45, SMASH)) { const k = (t - 14.45) / .45; g.fillStyle = `rgba(255,255,255,${.6 * k})`; g.fillRect(0, 900 + k * 40, W * k, 6); }
  // flashes: press, deletes, smash
  const flashes = [[PRESS, .55, '#E6FCFF'], [DEL_FLOOR, .45, '#E6FCFF'], [DEL_GRAV, .45, '#E6FCFF'], [SMASH, 1, '#FFFFFF'], [0.6, .35, '#FFFFFF']];
  for (const [t0, a, c] of flashes) if (win(t, t0, t0 + .12)) { g.globalAlpha = a * (1 - (t - t0) / .12); g.fillStyle = c; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  // glitch: strips shifted + cyan tint on every deletion
  for (const t0 of [PRESS, DEL_FLOOR, DEL_GRAV, DEL_LIGHT]) if (win(t, t0 + .03, t0 + .13)) glitch(t, t0);
  // grade: vignette + grain
  const v = g.createRadialGradient(W / 2, H * .46, H * .25, W / 2, H * .5, H * .75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,4,10,.55)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  g.globalAlpha = .07; g.globalCompositeOperation = 'overlay';
  g.drawImage(grain[Math.floor(t * 30) % 4], 0, 0, W, H);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}
function drawLumoBg(t) { if (t < 17.45) drawLumo(t, true); }
function glitch(t, t0) {
  const n = Math.floor((t - t0) * 30);
  for (let i = 0; i < 9; i++) {
    const y = rnd(i + n * 13 + t0) * H, h = 20 + rnd(i + 5 + n) * 120, dx = (rnd(i + 9 + n) - .5) * 120;
    g.drawImage(cv, 0, y, W, h, dx, y, W, h);
  }
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = .18; g.drawImage(cv, 8, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.fillStyle = 'rgba(56,225,255,.12)'; g.fillRect(0, 0, W, H);
}
window.DUR = DUR;
window.renderAt = renderAt;
window.ready = document.fonts.ready.then(() => true);
