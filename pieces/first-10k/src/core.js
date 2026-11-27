"use strict";
// ============================================================
//  core.js — time, easing, RNG, drawing primitives, post (bloom, vignette, grain)
//  1920x1080 @ 60fps; everything is a pure function of time t (seconds)
// ============================================================
const W = 1920, H = 1080, FPS = 60;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const VOICE = window.VOICE;
const DURATION = Math.round(VOICE.duration * FPS) / FPS;
const NFRAMES = Math.round(DURATION * FPS);

const C = {
  bg0: '#03070f', bg1: '#0a1a31', bg2: '#0d2340',
  cy: '#44c6ff', cyD: '#1d7fb8', cyL: '#a9e6ff', cyGlow: 'rgba(68,198,255,0.9)',
  wh: '#eef5ff', mu: '#8090a8', dim: '#2a3f5c', line: '#3a5677', grey: '#5d6c84', ink: '#071222',
};
const SANS = '"Inter Display", "Inter", "DejaVu Sans", sans-serif';
const MONO = '"JetBrains Mono", "DejaVu Sans Mono", monospace';
const TAU = Math.PI * 2;

// ---------- math
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, u) => a + (b - a) * u;
const P = (t, t0, d) => clamp((t - t0) / d, 0, 1);
const E = {
  io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  io2: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
  o: (x) => 1 - Math.pow(1 - x, 3),
  o5: (x) => 1 - Math.pow(1 - x, 5),
  i: (x) => x * x * x,
  i2: (x) => x * x,
  ob: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
};
// damped spring 0 -> 1 with overshoot (closed form)
function SPR(t, t0, f = 2.0, z = 0.42) {
  if (t <= t0) return 0;
  const x = t - t0, w = TAU * f, wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * x) * (Math.cos(wd * x) + (z * w / wd) * Math.sin(wd * x));
}
function RNG(seed) {
  let a = 0;
  for (const ch of String(seed)) a = (Math.imul(a ^ ch.charCodeAt(0), 2654435761) + 0x9e3779b9) | 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const nz1 = (x, s = 0) => Math.sin(x * 1.7 + s) * 0.5 + Math.sin(x * 2.9 + s * 1.3) * 0.3 + Math.sin(x * 5.3 + s * 2.1) * 0.2;

// ---------- voice cues
const LN = (id) => VOICE.lines.find((l) => l.id === id);
const WT = (id, n) => LN(id).words[n].t0;                         // n-th word start
const WE = (id, n) => LN(id).words[n].t1;                         // n-th word end
const WF = (id, sub) => { const w = LN(id).words.find((w) => w.w.toLowerCase().includes(sub)); if (!w) throw new Error('cue ' + id + ':' + sub); return w.t0; };

// ---------- sfx cues (collected by the exporter for the mix)
const SFX = [];
function sfx(name, t, gain = 0, opt = {}) { SFX.push({ name, t: +t.toFixed(4), gain, ...opt }); }

// ---------- money formatting
const money = (n) => '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const num = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// ---------- drawing primitives
function rr(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function glow(color = C.cyGlow, blur = 24) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
function noGlow() { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; }
function font(size, weight = 800, fam = SANS) { ctx.font = `${weight} ${size}px ${fam}`; }
function T(str, x, y, o = {}) {
  const s = o.s || 40;
  ctx.save();
  font(s, o.w || 800, o.f || SANS);
  ctx.textAlign = o.al || 'center'; ctx.textBaseline = o.bl || 'middle';
  ctx.letterSpacing = (o.ls || 0) + 'px';
  ctx.globalAlpha *= o.a == null ? 1 : o.a;
  ctx.fillStyle = o.c || C.wh;
  if (o.g) glow(o.gc || C.cyGlow, o.g);
  if (o.sc && o.sc !== 1) { ctx.translate(x, y); ctx.scale(o.sc, o.sc); x = 0; y = 0; }
  ctx.fillText(str, x, y);
  if (o.stroke) { noGlow(); ctx.lineWidth = o.stroke; ctx.strokeStyle = o.sk || C.ink; ctx.strokeText(str, x, y); }
  ctx.restore();
}
function TW(str, s, w = 800, fam = SANS, ls = 0) { ctx.save(); font(s, w, fam); ctx.letterSpacing = ls + 'px'; const m = ctx.measureText(str).width; ctx.restore(); return m; }

// pill label (white capsule, dark caps text) — pops in with a spring
function pill(str, x, y, t, t0, o = {}) {
  if (t < t0) return;
  const k = o.k == null ? SPR(t, t0, 2.4, 0.5) : o.k;
  const a = clamp((t - t0) / 0.12) * (o.a == null ? 1 : o.a);
  const s = o.s || 22, pw = TW(str, s, 800, SANS, 1.2) + s * 1.6, ph = s * 1.9;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.globalAlpha *= a;
  if (o.dark) { ctx.fillStyle = 'rgba(10,22,40,0.92)'; rr(-pw / 2, -ph / 2, pw, ph, ph / 2); ctx.fill(); ctx.strokeStyle = o.dark; ctx.lineWidth = 2; ctx.stroke(); }
  else { glow('rgba(160,220,255,0.55)', 18); ctx.fillStyle = o.bg || '#f4f8ff'; rr(-pw / 2, -ph / 2, pw, ph, ph / 2); ctx.fill(); noGlow(); }
  T(str, 0, 1, { s, w: 800, c: o.dark ? (o.tc || C.wh) : (o.tc || '#0a1424'), ls: 1.2 });
  ctx.restore();
}

// the hero: a glowing "user" glyph. (x,y) = feet. h = height.
function hero(x, y, h, o = {}) {
  const c = o.c || C.cy, a = o.a == null ? 1 : o.a;
  if (a <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.lean || 0);
  const br = 1 + Math.sin((o.t || 0) * 2.4 + (o.ph || 0)) * 0.012;     // breathing
  ctx.scale(o.flip ? -1 : 1, br);
  ctx.globalAlpha *= a;
  const hw = h * 0.36, bodyH = h * 0.5, headR = h * 0.2, headY = -bodyH - headR * 1.12 - (o.hop || 0);
  const grd = ctx.createLinearGradient(0, -h, 0, 0);
  grd.addColorStop(0, o.c2 || C.cyL); grd.addColorStop(1, c);
  if (o.glow !== 0) glow(o.gc || 'rgba(68,198,255,0.75)', o.glow || h * 0.35);
  ctx.fillStyle = o.fill || grd;
  // torso: dome + flat base
  ctx.beginPath(); ctx.moveTo(-hw, 0); ctx.lineTo(-hw, -bodyH * 0.45);
  ctx.bezierCurveTo(-hw, -bodyH * 1.05, hw, -bodyH * 1.05, hw, -bodyH * 0.45); ctx.lineTo(hw, 0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(o.headX || 0, headY, headR, 0, TAU); ctx.fill();
  noGlow();
  ctx.restore();
}
// grey crowd member
const grey = (x, y, h, o = {}) => hero(x, y, h, { c: '#46566e', c2: '#6c7d97', glow: 0, ...o });

// outlined card
function card(x, y, w, h, o = {}) {
  ctx.save();
  ctx.globalAlpha *= o.a == null ? 1 : o.a;
  ctx.fillStyle = o.fill || 'rgba(9,20,38,0.88)'; rr(x, y, w, h, o.r || 16); ctx.fill();
  if (o.glowc) glow(o.glowc, o.gb || 26);
  ctx.strokeStyle = o.sc || 'rgba(200,220,245,0.75)'; ctx.lineWidth = o.lw || 2.5; rr(x, y, w, h, o.r || 16); ctx.stroke();
  noGlow(); ctx.restore();
}
function line(pts, o = {}) {
  ctx.save(); ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = o.c || C.wh; ctx.lineWidth = o.lw || 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (o.dash) ctx.setLineDash(o.dash); if (o.off) ctx.lineDashOffset = o.off;
  ctx.globalAlpha *= o.a == null ? 1 : o.a;
  if (o.g) glow(o.gc || C.cyGlow, o.g);
  ctx.stroke(); ctx.restore();
}
// part of a polyline by arc-length fraction
function sub(pts, f) {
  if (f >= 1) return pts; if (f <= 0) return [pts[0]];
  let tot = 0; const L = [0]; for (let i = 1; i < pts.length; i++) { tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(tot); }
  const tgt = tot * f, out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (L[i] < tgt) { out.push(pts[i]); continue; }
    const u = (tgt - L[i - 1]) / (L[i] - L[i - 1] || 1); out.push([lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]); break;
  }
  return out;
}
function ptAt(pts, f) { const s = sub(pts, clamp(f, 0.0001, 1)); return s[s.length - 1]; }
function resamp(pts, n) { const out = []; for (let i = 0; i < n; i++) out.push(ptAt(pts, i / (n - 1))); return out; }

// little "grass" ticks along a polyline (from the reference's ground language)
function ticks(pts, t, o = {}) {
  const R = RNG(o.seed || 'tk'), n = o.n || 40;
  ctx.save(); ctx.strokeStyle = o.c || 'rgba(160,190,225,0.55)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const f = (i + R() * 0.6) / n, p = ptAt(pts, f), q = ptAt(pts, Math.min(1, f + 0.002));
    const ang = Math.atan2(q[1] - p[1], q[0] - p[0]), s = 7 + R() * 6, sw = Math.sin(t * 2 + i) * 0.15;
    ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(-s * 0.4, -s); ctx.lineTo(0, -1); ctx.lineTo(s * 0.4 + sw * s, -s); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}
// gear outline
function gear(x, y, r, rot, o = {}) {
  const n = o.n || 8, ri = r * 0.78;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * TAU, a1 = a0 + TAU / n * 0.25, a2 = a0 + TAU / n * 0.5, a3 = a0 + TAU / n * 0.75;
    ctx.lineTo(Math.cos(a0) * ri, Math.sin(a0) * ri); ctx.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
    ctx.lineTo(Math.cos(a2) * r, Math.sin(a2) * r); ctx.lineTo(Math.cos(a3) * ri, Math.sin(a3) * ri);
  }
  ctx.closePath();
  ctx.lineWidth = o.lw || 3; ctx.strokeStyle = o.c || C.cyL; if (o.g) glow(C.cyGlow, o.g);
  if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
  ctx.stroke(); noGlow();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, TAU); ctx.stroke();
  ctx.restore();
}
// coin (front view or edge-on)
function coin(x, y, r, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(o.sx == null ? 1 : o.sx, 1);
  ctx.globalAlpha *= o.a == null ? 1 : o.a;
  if (o.g !== 0) glow('rgba(68,198,255,0.8)', o.g || r);
  ctx.fillStyle = o.fill || C.cy; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); noGlow();
  ctx.strokeStyle = 'rgba(230,248,255,0.9)'; ctx.lineWidth = Math.max(1.2, r * 0.09); ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, TAU); ctx.stroke();
  T('$', 0, r * 0.04, { s: r * 1.0, w: 900, c: '#04223a' });
  ctx.restore();
}
// flat stacked coin (ellipse) for stacks
function coinFlat(x, y, r, o = {}) {
  ctx.save(); ctx.globalAlpha *= o.a == null ? 1 : o.a;
  ctx.fillStyle = 'rgba(8,24,44,0.95)'; ctx.strokeStyle = o.c || C.cyL; ctx.lineWidth = 2.4;
  if (o.g) glow(C.cyGlow, o.g);
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.28, 0, 0, TAU); ctx.fill(); ctx.stroke(); noGlow();
  ctx.restore();
}
// rotating isometric cube (the product)
function cube(x, y, s, rot, o = {}) {
  const v = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
  const tilt = o.tilt == null ? 0.55 : o.tilt, cr = Math.cos(rot), sr = Math.sin(rot), ct = Math.cos(tilt), st = Math.sin(tilt);
  const pr = v.map(([a, b, c]) => { const X = a * cr - c * sr, Z = a * sr + c * cr; const Y = b * ct - Z * st, Z2 = b * st + Z * ct; return [x + X * s, y + Y * s, Z2]; });
  const faces = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [1, 2, 6, 5], [0, 3, 7, 4]];
  const shade = ['#3fb6f0', '#2a8fcf', '#8fdcff', '#1c6aa3', '#5cc8fb', '#2f9fe0'];
  const vis = faces.map((f, i) => ({ f, i, z: f.reduce((s, k) => s + pr[k][2], 0) / 4 })).sort((a, b) => b.z - a.z);
  ctx.save(); ctx.globalAlpha *= o.a == null ? 1 : o.a;
  glow('rgba(68,198,255,0.85)', o.g || s * 0.9);
  for (const { f, i } of vis.slice(3)) {
    ctx.beginPath(); f.forEach((k, j) => (j ? ctx.lineTo(pr[k][0], pr[k][1]) : ctx.moveTo(pr[k][0], pr[k][1]))); ctx.closePath();
    ctx.fillStyle = shade[i]; ctx.fill();
  }
  noGlow();
  for (const { f } of vis.slice(3)) {
    ctx.beginPath(); f.forEach((k, j) => (j ? ctx.lineTo(pr[k][0], pr[k][1]) : ctx.moveTo(pr[k][0], pr[k][1]))); ctx.closePath();
    ctx.strokeStyle = 'rgba(220,245,255,0.7)'; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.restore();
}
// crossed-out badge
function xmark(x, y, r, k = 1, o = {}) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = o.fill || '#0b1628'; ctx.strokeStyle = o.c || C.wh; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r * 0.4, -r * 0.4); ctx.lineTo(r * 0.4, r * 0.4); ctx.moveTo(r * 0.4, -r * 0.4); ctx.lineTo(-r * 0.4, r * 0.4); ctx.stroke();
  ctx.restore();
}
function heart(x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 20, s / 20); ctx.globalAlpha *= o.a == null ? 1 : o.a;
  ctx.beginPath(); ctx.moveTo(0, 6); ctx.bezierCurveTo(-14, -4, -8, -16, 0, -8); ctx.bezierCurveTo(8, -16, 14, -4, 0, 6); ctx.closePath();
  if (o.g) glow(C.cyGlow, o.g); ctx.fillStyle = o.c || C.cy; ctx.fill(); noGlow(); ctx.restore();
}

// ---------- background: deep navy, parallax dust in three depth planes (far = sharp+dim, near = big blurred bokeh)
const DUST = [0, 1, 2].map((L) => { const R = RNG('dust' + L), n = [110, 46, 12][L]; return Array.from({ length: n }, () => ({ x: R(), y: R(), r: R(), ph: R() * TAU })); });
let BGP = { x: 0, y: 0, dim: 0, warm: 0 };       // parallax offset (px) & dimming, set by the scene
function background(t) {
  const g = ctx.createRadialGradient(W * 0.5, H * 0.42, 50, W * 0.5, H * 0.5, W * 0.75);
  g.addColorStop(0, C.bg2); g.addColorStop(0.45, C.bg1); g.addColorStop(1, C.bg0);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const depth = [0.12, 0.35, 1.1], size = [1.3, 2.6, 26], alpha = [0.5, 0.42, 0.10];
  for (let L = 0; L < 3; L++) {
    ctx.save();
    if (L === 2) ctx.filter = 'blur(10px)';
    for (const d of DUST[L]) {
      const x = ((d.x * (W + 200) - BGP.x * depth[L] + t * 6 * depth[L]) % (W + 200) + (W + 200)) % (W + 200) - 100;
      const y = ((d.y * (H + 200) - BGP.y * depth[L] - t * (3 + d.r * 5)) % (H + 200) + (H + 200)) % (H + 200) - 100;
      const tw = 0.6 + 0.4 * Math.sin(t * (0.8 + d.r) + d.ph);
      ctx.globalAlpha = alpha[L] * tw * (1 - BGP.dim * 0.8);
      ctx.fillStyle = L === 2 ? '#5fb8ff' : '#9fd2ff';
      ctx.beginPath(); ctx.arc(x, y, size[L] * (0.5 + d.r), 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
}
// faint perspective floor grid (ground scenes): horizon hy, ground at gy, scrolls with camera x
function floorGrid(t, gy, camx, a = 1) {
  ctx.save(); ctx.globalAlpha = 0.22 * a; ctx.strokeStyle = '#2d5a8a'; ctx.lineWidth = 1.2;
  const hy = gy - 260, vx = W / 2;
  for (let i = -22; i <= 22; i++) {
    const bx = vx + (i * 150 - (camx % 150)) * 3.2;
    ctx.beginPath(); ctx.moveTo(vx + (bx - vx) * 0.0 + (i * 150 - (camx % 150)) * 0.35, gy); ctx.lineTo(bx, H + 40); ctx.stroke();
  }
  for (let j = 0; j < 7; j++) { const yy = gy + Math.pow(j / 6, 1.8) * (H - gy + 40); ctx.globalAlpha = 0.22 * a * (0.4 + j / 10); ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
  // fade near horizon
  const fg = ctx.createLinearGradient(0, gy, 0, gy + 160); fg.addColorStop(0, 'rgba(6,15,30,0.9)'); fg.addColorStop(1, 'rgba(6,15,30,0)');
  ctx.globalAlpha = a; ctx.fillStyle = fg; ctx.fillRect(0, gy, W, 160);
  ctx.restore();
}

// ---------- post: bloom (two radii), vignette, grain
const BL1 = document.createElement('canvas'); BL1.width = 480; BL1.height = 270; const b1 = BL1.getContext('2d');
const BL2 = document.createElement('canvas'); BL2.width = 240; BL2.height = 135; const b2 = BL2.getContext('2d');
const GR = [0, 1, 2, 3].map((k) => {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), id = g.createImageData(256, 256), R = RNG('grain' + k);
  for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (R() - 0.5) * 120; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  g.putImageData(id, 0, 0); return c;
});
function post(t, o = {}) {
  // bloom: threshold-ish via contrast, blur at two radii, add
  b1.clearRect(0, 0, 480, 270); b1.filter = 'brightness(0.9) contrast(2.6) blur(5px)'; b1.drawImage(cv, 0, 0, 480, 270); b1.filter = 'none';
  b2.clearRect(0, 0, 240, 135); b2.filter = 'blur(9px)'; b2.drawImage(BL1, 0, 0, 240, 135); b2.filter = 'none';
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.42 * (o.bloom || 1); ctx.drawImage(BL1, 0, 0, W, H);
  ctx.globalAlpha = 0.55 * (o.bloom || 1); ctx.drawImage(BL2, 0, 0, W, H);
  ctx.restore();
  // vignette
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.72);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,2,8,${0.62 + (o.vig || 0)})`);
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  if (o.dark) { ctx.fillStyle = `rgba(1,4,10,${o.dark})`; ctx.fillRect(0, 0, W, H); }
  // grain (deterministic per frame) — also dithers the dark gradients against banding
  const f = Math.round(t * FPS), g = GR[f % 4], ox = (f * 73) % 256, oy = (f * 151) % 256;
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.07;
  ctx.translate(-ox, -oy); const pat = ctx.createPattern(g, 'repeat'); ctx.fillStyle = pat; ctx.fillRect(0, 0, W + 256, H + 256);
  ctx.restore();
}
