// ============================================================
//  scenes_c.js — 10 the summit (payoff) · 11 the post that hit + what people pay for · 12 product, clients, system · 13 repeat ×10
// ============================================================
// ---- 10: the summit. Hard cut on the impact, the three "?" ignite into what he learned.
const T10 = { t0: 39.75, got: WT('top', 6), money: WT('top', 9), end: LN('knows').t0 - 0.12 };
const SUM = { x: 560, y: 470 };   // summit (feet), stairs descend to the right
function iconGlyph(kind, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#04223a'; ctx.strokeStyle = '#04223a'; ctx.lineWidth = 3;
  if (kind === 0) heart(0, 4, s * 1.5, { c: '#04223a' });
  if (kind === 1) { for (const [dx, sc] of [[-16, 0.8], [16, 0.8], [0, 1]]) { ctx.save(); ctx.translate(dx * s / 26, 0); hero(0, s * 0.55, s * 1.1 * sc, { fill: '#04223a', glow: 0 }); ctx.restore(); } }
  if (kind === 2) gear(0, 0, s * 0.75, t * 1.2, { c: '#04223a', lw: 3.5, n: 8 });
  ctx.restore();
}
const ICON_LAB = ['ЧТО ЦЕПЛЯЕТ', 'АУДИТОРИЯ', 'СИСТЕМА'];
scene('top', T10.t0, T10.end,
  camKeys([[T10.t0, { x: 980, y: 560, z: 1.12, r: 0.02 }], [T10.t0 + 1.2, { x: 990, y: 560, z: 1.02, r: 0 }], [T10.end, { x: 1040, y: 560, z: 1.08, r: -0.01 }]], E.o),
  (t) => {
    const tau = t - T10.t0;
    // light rays behind the hero
    ctx.save(); ctx.translate(SUM.x, SUM.y - 90); ctx.rotate(t * 0.15);
    const ra = 0.16 + 0.5 * Math.exp(-tau * 2.5);
    for (let i = 0; i < 18; i++) { ctx.rotate(TAU / 18); const g = ctx.createLinearGradient(0, 0, 900, 0); g.addColorStop(0, `rgba(120,210,255,${ra})`); g.addColorStop(1, 'rgba(120,210,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(900, -40); ctx.lineTo(900, 40); ctx.fill(); }
    ctx.restore();
    // stairs going down-right from the summit
    const pts = [[SUM.x - 500, SUM.y], [SUM.x + 90, SUM.y]];
    for (let i = 0; i < 8; i++) { const x = SUM.x + 90 + i * 120, y = SUM.y + i * 74; pts.push([x, y + 74], [x + 120, y + 74]); }
    ctx.save(); ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.lineTo(2400, 1400); ctx.lineTo(SUM.x - 500, 1400); ctx.closePath();
    const g = ctx.createLinearGradient(0, SUM.y, 0, 1200); g.addColorStop(0, 'rgba(40,120,180,0.5)'); g.addColorStop(1, 'rgba(6,18,36,0.2)'); ctx.fillStyle = g; ctx.fill(); ctx.restore();
    line(pts, { c: 'rgba(210,235,255,0.95)', lw: 3, g: 12 });
    hero(SUM.x, SUM.y, 120, { t, hop: tau < 0.5 ? Math.sin(tau / 0.5 * Math.PI) * 26 : 0 });
    // burst particles
    const R = RNG('burst');
    for (let i = 0; i < 70; i++) {
      const ang = R() * TAU, sp = 300 + R() * 900, k = tau * (0.5 + R() * 0.5); if (k > 1.6) continue;
      const x = SUM.x + Math.cos(ang) * sp * (1 - Math.exp(-k * 2)) / 2, y = SUM.y - 70 + Math.sin(ang) * sp * (1 - Math.exp(-k * 2)) / 2 + k * k * 40;
      ctx.save(); ctx.globalAlpha = clamp(1 - k / 1.6) * 0.9; ctx.fillStyle = R() > 0.5 ? C.cyL : '#ffffff'; ctx.beginPath(); ctx.arc(x, y, 1.5 + R() * 3, 0, TAU); ctx.fill(); ctx.restore();
    }
    // $10 000 next to the hero; it steps back when "not just money"
    const ma = 1 - 0.65 * E.io(P(t, T10.money, 0.5));
    T('$10 000', SUM.x + 40, SUM.y - 185, { s: 54, w: 800, f: MONO, c: C.cy, g: 22, a: ma, sc: lerp(1, 0.82, E.io(P(t, T10.money, 0.5))) });
    if (t > T10.money) { const k = E.o(P(t, T10.money + 0.05, 0.3)), w = TW('$10 000', 54, 800, MONO) * 0.82; line([[SUM.x + 40 - w / 2, SUM.y - 185], [SUM.x + 40 - w / 2 + w * k, SUM.y - 185]], { c: C.wh, lw: 4, a: 0.9 }); }
    // the three icons ignite, staggered
    ICONS.forEach(([x, y], i) => {
      const k = SPR(t, T10.t0 + 0.05 + i * 0.12, 2.2, 0.38);
      const big = 1 + 0.12 * E.io(P(t, T10.money, 0.5));
      ctx.save(); ctx.translate(x, y + Math.sin(t * 1.6 + i) * 6); ctx.scale(k * big, k * big);
      glow('rgba(68,198,255,0.95)', 40); ctx.fillStyle = C.cy; ctx.beginPath(); ctx.arc(0, 0, 62, 0, TAU); ctx.fill(); noGlow();
      ctx.strokeStyle = 'rgba(230,248,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 72 + Math.sin(t * 3 + i) * 3, 0, TAU); ctx.stroke();
      iconGlyph(i, 0, 0, 26, t);
      ctx.restore();
      T(ICON_LAB[i], x, y + 108, { s: 17, w: 800, c: C.wh, ls: 2, a: E.o(P(t, T10.got + i * 0.12, 0.3)) });
    });
  });
sfx('impact', T10.t0 - 0.11, 0); shake(T10.t0, 26, 0.9);
for (let i = 0; i < 3; i++) sfx('ding', T10.t0 + 0.05 + i * 0.12, -12 - i * 2);
for (let i = 0; i < 3; i++) sfx('pop', T10.got + i * 0.12, -14);
POSTO = (t) => {
  const o = {};
  if (t > T9.t0 && t < T10.t0) o.dark = 0.12 * E.io(P(t, T9.t0, 1.2));
  if (t >= T10.t0 && t < T10.t0 + 0.45) { o.bloom = 1 + 2.2 * Math.exp(-(t - T10.t0) * 7); }
  if (t > 74.9) o.dark = E.io(P(t, 74.9, 0.6));
  return o;
};

// ---- 11: the post that hit, and what people actually pay for
const T11 = { t0: T10.end, post: WT('knows', 3), hit: WT('knows', 4), pay0: WT('knows', 8), pay: WT('knows', 10), end: LN('system').t0 - 0.15 };
scene('knows', T11.t0, T11.end,
  camKeys([[T11.t0, { x: 780, y: 580, z: 1.12 }], [T11.hit + 0.4, { x: 800, y: 570, z: 1.16 }], [T11.pay0 - 0.2, { x: 1000, y: 570, z: 1.0 }], [T11.end, { x: 1040, y: 570, z: 1.04 }]]),
  (t) => {
    const gx0 = 760, gy0 = 600, tw = 170, th = 124, gap = 22;
    const hit = E.o(P(t, T11.hit - 0.05, 0.35)), payA = E.o(P(t, T11.pay0 - 0.3, 0.5));
    for (let r = -1; r <= 1; r++) for (let c = -1; c <= 1; c++) {
      if (!r && !c) continue;
      const x = gx0 + c * (tw + gap), y = gy0 + r * (th + gap), k = SPR(t, T11.t0 + 0.05 + (r + 1 + c + 1) * 0.04, 2.6, 0.55);
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.globalAlpha = 1 - hit * 0.55;
      card(-tw / 2, -th / 2, tw, th, { r: 12, lw: 2, sc: 'rgba(190,210,240,0.5)' });
      ctx.fillStyle = 'rgba(190,210,240,0.3)'; rr(-tw / 2 + 14, -th / 2 + 14, tw - 28, 54, 8); ctx.fill();
      T('♡ ' + (12 + ((r * 7 + c * 13 + 40) % 30)), -tw / 2 + 18, th / 2 - 22, { s: 14, w: 700, f: MONO, c: C.mu, al: 'left' });
      ctx.restore();
    }
    // the hit post
    {
      const k = SPR(t, T11.t0 + 0.02, 2.6, 0.55), s = k * (1 + 0.32 * hit);
      ctx.save(); ctx.translate(gx0, gy0 - hit * 14); ctx.scale(s, s);
      card(-tw / 2, -th / 2, tw, th, { r: 12, lw: 2.5, fill: hit > 0 ? 'rgba(236,246,255,0.98)' : 'rgba(9,20,38,0.88)', glowc: hit > 0 ? 'rgba(160,225,255,0.9)' : null, gb: 40 });
      ctx.fillStyle = hit > 0 ? 'rgba(40,90,140,0.5)' : 'rgba(190,210,240,0.3)'; rr(-tw / 2 + 14, -th / 2 + 14, tw - 28, 54, 8); ctx.fill();
      const views = t < T11.hit ? 1139 : 1139 + (24000 - 1139) * E.o(P(t, T11.hit, 1.1));
      T('▶ ' + num(views), 0, th / 2 - 24, { s: 18, w: 800, f: MONO, c: hit > 0 ? '#0a2a4a' : C.mu });
      ctx.restore();
      // hearts rising
      if (t > T11.hit) { const R = RNG('hearts'); for (let i = 0; i < 16; i++) { const t0 = T11.hit + i * 0.1, k2 = (t - t0) / 1.3; if (k2 < 0 || k2 > 1) continue; heart(gx0 + (R() - 0.5) * 220 + Math.sin(k2 * 6 + i) * 18, gy0 - 90 - k2 * 260, 14 + R() * 12, { a: 1 - k2, g: 10, c: R() > 0.3 ? C.cy : C.wh }); } }
      pill('ПОСТ, КОТОРЫЙ ВЫСТРЕЛИЛ', gx0, gy0 - 250, t, T11.hit + 0.1);
    }
    // what people pay for: the product card
    if (payA > 0) {
      const x = lerp(1900, 1420, payA), y = 590;
      line([[gx0 + 120, gy0], [x - 150, y]], { c: 'rgba(160,210,250,0.7)', lw: 2.5, dash: [6, 10], off: -t * 40, a: payA });
      ctx.save(); ctx.translate(x, y);
      card(-140, -150, 280, 300, { r: 22, lw: 3, glowc: 'rgba(120,210,255,0.7)', gb: 30 });
      cube(0, -20, 52, t * 0.9, {});
      const pk = SPR(t, T11.pay - 0.05, 2.4, 0.45);
      ctx.save(); ctx.translate(60, 70); ctx.scale(pk, pk); ctx.fillStyle = C.cy; glow(C.cyGlow, 20); rr(-46, -22, 92, 44, 12); ctx.fill(); noGlow(); T('$49', 0, 1, { s: 26, w: 900, c: '#04223a' }); ctx.restore();
      ctx.restore();
      T('ЗА ЧТО ПЛАТЯТ', x, y + 190, { s: 18, w: 800, c: C.wh, ls: 2.5, a: E.o(P(t, T11.pay, 0.3)) });
    }
  },
  { type: 'zoomin', d: 0.5, at: [1150, 540], to: [760, 600] });
sfx('whoosh', T11.t0 - 0.2, -10); sfx('heart', T11.hit, -4); sfx('pop', T11.hit + 0.1, -10); sfx('whoosh', T11.pay0 - 0.3, -12); sfx('ding', T11.pay - 0.05, -8);

// ---- 12: product, first clients, a system that doesn't run on luck
const T12 = { t0: T11.end, prod: WT('system', 3), cli: WT('system', 5), sys: WT('system', 7), luck0: WT('system', 10), luck: WT('system', 13), end: LN('battle').t0 - 0.1 };
scene('system', T12.t0, T12.end,
  camKeys([[T12.t0, { x: 960, y: 600, z: 1.18, r: 0.015 }], [T12.cli + 0.3, { x: 960, y: 590, z: 1.02, r: 0 }], [T12.sys + 0.5, { x: 1060, y: 580, z: 0.98, r: -0.012 }], [T12.luck, { x: 900, y: 590, z: 1.0, r: 0.008 }], [T12.end, { x: 940, y: 590, z: 1.04 }]]),
  (t) => {
    const cx = 960, cy = 600;
    // orbit (3D ellipse): back half first, then cube, then front half
    const ca = E.o(P(t, T12.cli - 0.3, 0.5));
    const nCli = t < T12.cli - 0.1 ? 0 : Math.min(6, 1 + Math.floor((t - T12.cli + 0.1) / 0.11));
    const cl = Array.from({ length: 6 }, (_, i) => { const a = t * 0.35 + (i / 6) * TAU; return { i, a, x: cx + Math.cos(a) * 360, y: cy + 40 + Math.sin(a) * 120, d: Math.sin(a) }; });
    ctx.save(); ctx.globalAlpha = ca * 0.6; ctx.strokeStyle = 'rgba(150,200,245,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([4, 10]); ctx.beginPath(); ctx.ellipse(cx, cy + 40, 360, 120, 0, Math.PI, TAU); ctx.stroke(); ctx.restore();
    const drawCli = (c) => { if (c.i >= nCli) return; const k = SPR(t, T12.cli - 0.1 + c.i * 0.11, 2.6, 0.5), s = 0.72 + 0.28 * (c.d + 1) / 2; hero(c.x, c.y + 40, 70 * s * k, { t, ph: c.i, c: '#e9f4ff', c2: '#ffffff', gc: 'rgba(200,235,255,0.6)', glow: 14, a: 0.55 + 0.45 * (c.d + 1) / 2 }); };
    cl.filter((c) => c.d < 0).forEach(drawCli);
    // the product
    const pk = SPR(t, T12.prod - 0.15, 2.0, 0.45);
    const fl = Math.sin(t * 1.4) * 10;
    ctx.save(); ctx.globalAlpha = 0.5; const sh = ctx.createRadialGradient(cx, cy + 120, 10, cx, cy + 120, 150); sh.addColorStop(0, 'rgba(68,198,255,0.5)'); sh.addColorStop(1, 'rgba(68,198,255,0)'); ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(cx, cy + 120, 150, 30, 0, 0, TAU); ctx.fill(); ctx.restore();
    if (pk > 0) cube(cx, cy - 20 + fl, 78 * pk, t * 0.6 + 0.5, {});
    pill('ПРОДУКТ', cx, cy - 190, t, T12.prod);
    ctx.save(); ctx.globalAlpha = ca * 0.6; ctx.strokeStyle = 'rgba(150,200,245,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([4, 10]); ctx.beginPath(); ctx.ellipse(cx, cy + 40, 360, 120, 0, 0, Math.PI); ctx.stroke(); ctx.restore();
    cl.filter((c) => c.d >= 0).forEach(drawCli);
    // counter
    T('КЛИЕНТЫ', 330, 330, { s: 17, w: 800, c: C.mu, ls: 2.5, a: ca });
    T(String(nCli), 330, 385, { s: 56, w: 900, c: C.cy, g: 16, a: ca, sc: 1 + 0.15 * Math.max(0, Math.sin(Math.PI * clamp(((t - T12.cli + 0.1) % 0.11) / 0.11))) * (nCli < 6 ? 1 : 0) });
    // the system: interlocking gears with pulses to the product
    const sa = SPR(t, T12.sys - 0.1, 2.0, 0.5);
    if (sa > 0) {
      const gx = 1600, gyy = 560, spin = (t - T12.sys) * 1.6;
      ctx.save(); ctx.translate(gx, gyy); ctx.scale(sa, sa);
      gear(-34, -20, 54, spin, { n: 10, g: 14, lw: 3 }); gear(42, 48, 38, -spin * 1.42 + 0.3, { n: 8, g: 12, lw: 3 }); gear(-46, 74, 26, -spin * 2.1, { n: 6, lw: 2.6 });
      ctx.restore();
      T('СИСТЕМА', gx, gyy + 150, { s: 18, w: 800, c: C.wh, ls: 2.5, a: clamp(sa) });
      const path = [[gx - 100, gyy], [cx + 110, cy - 20]];
      line(path, { c: 'rgba(150,210,250,0.5)', lw: 2, dash: [5, 9], a: clamp(sa) });
      for (let k = 0; k < 4; k++) { const f = ((t - T12.sys) * 0.8 + k / 4) % 1, p = ptAt(path, f); ctx.save(); glow(C.cyGlow, 14); ctx.fillStyle = C.cyL; ctx.globalAlpha = clamp(sa) * Math.sin(f * Math.PI); ctx.beginPath(); ctx.arc(p[0], p[1], 5, 0, TAU); ctx.fill(); ctx.restore(); }
    }
    // luck: a die that gets crossed out and falls away
    const da = E.o(P(t, T12.luck0 - 0.4, 0.4));
    if (da > 0) {
      const drop = E.i2(P(t, T12.luck + 0.45, 0.6));
      const dx = 330, dy = 640 + drop * 500;
      ctx.save(); ctx.globalAlpha = da * (1 - drop * 0.8); ctx.translate(dx, dy); ctx.rotate(-0.2 + drop * 1.4 + Math.sin(t * 2) * 0.05);
      card(-48, -48, 96, 96, { r: 16, lw: 3, sc: 'rgba(200,215,235,0.8)' });
      ctx.fillStyle = C.wh; [[-22, -22], [22, 22], [0, 0], [22, -22], [-22, 22]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill(); });
      ctx.restore();
      T('УДАЧА', dx, 740 + drop * 500, { s: 17, w: 800, c: C.mu, ls: 2.5, a: da * (1 - drop) });
      xmark(dx + 56, dy - 56, 22, SPR(t, T12.luck - 0.05, 2.6, 0.45));
    }
  },
  { type: 'whip', d: 0.45, dir: [1, 0] });
sfx('whoosh', T12.t0 - 0.2, -10); sfx('pop', T12.prod, -6);
for (let i = 0; i < 6; i++) sfx('pop', T12.cli - 0.1 + i * 0.11, -14 - i);
sfx('gear', T12.sys - 0.05, -6); sfx('tick', T12.luck - 0.05, -6); sfx('whoosh', T12.luck + 0.45, -16);

// ---- 13: not a new battle — repeat what works, nine more times
const BEAT8 = 0.3, GRID0B = 39.75;   // music part B: 100 BPM, first beat at 39.75
const T13 = { t0: T12.end, first: WT('battle', 0) + 0.15, battle: WT('battle', 8), rep: WT('repeat', 1), end: LN('notmoney').t0 - 0.15 };
const FILLS = Array.from({ length: 9 }, (_, k) => GRID0B + Math.ceil((T13.rep + 0.25 - GRID0B) / BEAT8) * BEAT8 + k * BEAT8);
const slotXY = (i) => [960 - 2 * 210 + (i % 5) * 210, 470 + Math.floor(i / 5) * 118];
scene('repeat', T13.t0, T13.end,
  (t) => {
    const base = camKeys([[T13.t0, { x: 960, y: 560, z: 1.12 }], [T13.rep, { x: 960, y: 560, z: 1.0 }], [T13.end, { x: 960, y: 560, z: 1.1 }]])(t);
    for (const f of FILLS) if (t > f) base.z += 0.012 * Math.exp(-(t - f) * 10);
    return base;
  },
  (t) => {
    T('ЦЕЛЬ: $100 000', 960, 330, { s: 22, w: 800, c: C.mu, ls: 3, a: E.o(P(t, T13.t0, 0.4)) });
    const done = FILLS.filter((f) => t >= f).length + (t >= T13.first ? 1 : 0);
    for (let i = 0; i < 10; i++) {
      const [x, y] = slotXY(i), k = SPR(t, T13.t0 + 0.05 + i * 0.03, 2.8, 0.6);
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
      ctx.setLineDash([6, 8]); ctx.strokeStyle = 'rgba(170,200,235,0.5)'; ctx.lineWidth = 2; rr(-92, -46, 184, 92, 14); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      const ft = i === 0 ? T13.first : FILLS[i - 1];
      if (t < ft - 0.25) continue;
      // a copy of the first block flies to its slot (repeat what already works)
      const [x0, y0] = slotXY(0), fk = i === 0 ? 1 : E.o5(clamp((t - ft + 0.25) / 0.25));
      const px = lerp(x0, x, fk), py = lerp(y0, y, fk) - Math.sin(fk * Math.PI) * 50;
      const land = t - ft, sq = land > 0 ? Math.exp(-land * 12) * Math.sin(land * 40) * 0.08 : 0;
      ctx.save(); ctx.translate(px, py); ctx.scale(1 + sq, 1 - sq);
      if (i === 0) { const k0 = SPR(t, T13.first, 2.6, 0.45); ctx.scale(k0, k0); }
      glow('rgba(68,198,255,0.9)', land > 0 && land < 0.25 ? 50 : 24); ctx.fillStyle = C.cy; rr(-92, -46, 184, 92, 14); ctx.fill(); noGlow();
      ctx.strokeStyle = '#04223a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-58, 0); ctx.lineTo(-46, 12); ctx.lineTo(-26, -12); ctx.stroke();
      T('×' + (i + 1), 22, 2, { s: 30, w: 900, c: '#04223a' });
      ctx.restore();
    }
    const val = done * 10000;
    const allDone = t >= FILLS[8];
    T('ЧТО УЖЕ РАБОТАЕТ', 960, 750, { s: 18, w: 800, c: C.mu, ls: 3, a: E.o(P(t, T13.first, 0.3)) });
    T(money(val), 960, 820, { s: allDone ? 78 : 62, w: 800, f: MONO, c: allDone ? C.cy : C.wh, g: allDone ? 26 : 0, a: E.o(P(t, T13.first, 0.3)), sc: 1 + 0.06 * Math.exp(-Math.max(0, t - Math.max(...FILLS.filter((f) => t >= f), 0)) * 9) });
    pill('НЕ НОВАЯ БИТВА', 960, 650, t, T13.battle, { a: 1 - P(t, T13.rep, 0.3) });
    if (allDone) { const k = clamp((t - FILLS[8]) / 0.6); ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = C.cyL; ctx.lineWidth = 3; glow(C.cyGlow, 30); rr(960 - 520 - k * 40, 410 - k * 30, 1040 + k * 80, 240 + k * 60, 24); ctx.stroke(); ctx.restore(); }
  },
  { type: 'zoom', d: 0.5, at: [960, 580], to: [960, 470] });
sfx('whoosh', T13.t0 - 0.25, -10); sfx('pop', T13.first, -4); sfx('pop', T13.battle, -8);
FILLS.forEach((f, k) => sfx('slots', f, -8 + k * 0.4, { rate: Math.pow(2, [0, 2, 4, 5, 7, 9, 11, 12, 14][k] / 12) }));
sfx('ding', FILLS[8] + 0.02, -4);
