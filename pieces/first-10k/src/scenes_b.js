// ============================================================
//  scenes_b.js — 5 the start (three walls) · 6 posting into silence · 7 launch: $40 · 8 the staircase · 9 what he can't see
// ============================================================
const GY = 740;   // ground line in ground scenes
function ground(t, x0 = -400, x1 = 2400, a = 1) {
  line([[x0, GY], [x1, GY]], { c: 'rgba(214,232,255,0.85)', lw: 3, a, g: 8, gc: 'rgba(120,200,255,0.45)' });
  ticks([[x0, GY], [x1, GY]], t, { n: 70, seed: 'gr' + x0 });
}
// ---- 5: the start
const T5 = { t0: TG.end, hero: WT('start', 1), flag: WT('start', 3), c1: WT('start', 5), c2: WT('start', 7), c3: WT('start', 9), none: WT('start', 13) - 0.15, end: LN('posts').t0 - 0.2 };
const WALLS = [
  { x: 760, t: T5.c1, lab: 'НЕТ АУДИТОРИИ', icon: 'seats' }, { x: 1010, t: T5.c2, lab: 'НЕТ ПРОДУКТА', icon: 'box' }, { x: 1260, t: T5.c3, lab: 'НЕТ ДОКАЗАТЕЛЬСТВ', icon: 'flat' }];
function wallCard(w, t, k) {
  // falls from above, lands with squash
  const fall = clamp((t - w.t + 0.32) / 0.32), land = t - w.t;
  const y = lerp(-500, GY - 210, E.i2(fall));
  const sq = land > 0 ? Math.exp(-land * 9) * Math.sin(land * 30) * 0.08 : 0;
  ctx.save(); ctx.translate(w.x, GY); ctx.scale(1 + sq, 1 - sq); ctx.translate(-w.x, -GY);
  const x = w.x - 115, yy = y;
  card(x, yy, 230, 200, { r: 18, glowc: land > 0 && land < 0.3 ? 'rgba(200,230,255,0.6)' : null });
  T(w.lab, w.x, yy + 30, { s: 15, w: 900, c: C.wh, ls: 1.5 });
  ctx.save(); ctx.translate(w.x, yy + 115); ctx.strokeStyle = 'rgba(200,220,245,0.85)'; ctx.lineWidth = 2.4;
  if (w.icon === 'seats') { for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) { rr(-80 + c * 33, -26 + r * 30, 26, 22, 5); ctx.stroke(); } }
  if (w.icon === 'box') { ctx.beginPath(); ctx.moveTo(-46, -24); ctx.lineTo(46, -24); ctx.lineTo(46, 44); ctx.lineTo(-46, 44); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-46, -24); ctx.lineTo(-60, -44); ctx.moveTo(46, -24); ctx.lineTo(60, -44); ctx.stroke(); T('?', 0, 12, { s: 40, w: 800, c: C.cy, g: 12 }); }
  if (w.icon === 'flat') { ctx.beginPath(); for (let i = 0; i <= 40; i++) { const xx = -85 + i * 4.25, yv = 36 + Math.sin(i * 2.3 + t * 3) * 3 + Math.sin(i * 0.7) * 2; i ? ctx.lineTo(xx, yv) : ctx.moveTo(xx, yv); } ctx.stroke(); ctx.beginPath(); ctx.moveTo(-85, -40); ctx.lineTo(-85, 46); ctx.lineTo(88, 46); ctx.stroke(); }
  ctx.restore();
  xmark(x + 230, yy, 18, SPR(t, w.t + 0.18, 2.6, 0.45));
  ctx.restore();
  // dust puff on landing
  if (land > 0 && land < 0.6) {
    const R = RNG('puff' + w.x);
    for (let i = 0; i < 14; i++) { const dir = i < 7 ? -1 : 1, s = R(); ctx.save(); ctx.globalAlpha = 0.5 * (1 - land / 0.6); ctx.fillStyle = '#9fd2ff'; ctx.beginPath(); ctx.arc(w.x + dir * (110 + land * 200 * s), GY - 6 - land * 40 * R(), 3 + 6 * R(), 0, TAU); ctx.fill(); ctx.restore(); }
  }
}
scene('start', T5.t0, T5.end,
  camKeys([[T5.t0, { x: 960, y: 560, z: 1.08 }], [T5.c1 - 0.2, { x: 950, y: 580, z: 1.14 }], [T5.c3 + 0.4, { x: 1000, y: 580, z: 1.18 }], [T5.end, { x: 900, y: 610, z: 1.26 }]]),
  (t) => {
    floorGrid(t, GY, 0, 0.7);
    // shards fall into place as the new ground
    const tau = t - T5.t0, gl = E.o(P(t, T5.t0 + 0.05, 0.55));
    if (tau < 0.6) {
      const R = RNG('fallshards');
      for (let i = 0; i < 18; i++) { const x = 100 + i * 100 + (R() - 0.5) * 40, k = clamp((tau - R() * 0.25) / 0.35), y = lerp(-80 - R() * 300, GY, E.i2(k)), ang = (1 - k) * (R() - 0.5) * 4; line([[x - 40 * Math.cos(ang), y - 40 * Math.sin(ang)], [x + 40 * Math.cos(ang), y + 40 * Math.sin(ang)]], { c: C.cyL, lw: 4, g: 14, a: 1 - k * 0.6 }); }
    }
    ground(t, 960 - 1400 * gl, 960 + 1400 * gl);
    // hero at the start
    const hp = SPR(t, T5.hero - 0.15, 2.2, 0.45);
    if (hp > 0) hero(380, GY, 130 * hp, { t, headX: Math.sin(t * 0.8) * 3 });
    // the flag at $10 000, far away, with a dotted path
    const fp = SPR(t, T5.flag - 0.1, 2.0, 0.5);
    if (fp > 0) {
      line([[460, GY - 20], [1580, GY - 20]], { c: 'rgba(160,200,240,0.5)', lw: 2.5, dash: [3, 12], a: clamp(fp) });
      ctx.save(); ctx.translate(1640, GY); ctx.scale(fp, fp);
      line([[0, 0], [0, -170]], { c: C.wh, lw: 3 });
      const wv = Math.sin(t * 4) * 7; ctx.fillStyle = C.wh; glow('rgba(200,235,255,0.6)', 20);
      ctx.beginPath(); ctx.moveTo(2, -170); ctx.quadraticCurveTo(40, -162 + wv, 84, -150); ctx.lineTo(2, -118); ctx.fill(); noGlow();
      T('$10 000', 40, -205, { s: 34, w: 800, f: MONO, c: C.cy, g: 16 });
      ctx.restore();
    }
    for (const w of WALLS) if (t > w.t - 0.34) wallCard(w, t);
    pill('НИЧЕГО ПОКА НЕ РАБОТАЕТ', 1010, 520, t, T5.none);
  },
  { type: 'whip', d: 0.5, dir: [0, 1] });
sfx('whoosh_big', T5.t0 - 0.3, -10); sfx('pop', T5.hero - 0.1, -10); sfx('pop', T5.flag, -10);
for (const w of WALLS) { sfx('thud', w.t, -1); sfx('tick', w.t + 0.18, -12); shake(w.t, 7, 0.3); }
sfx('pop', T5.none, -8);

// ---- 6: posting for weeks into silence
const T6 = { t0: T5.end, wk: WT('posts', 2), quiet: WT('posts', 3), end: LN('launch').t0 - 0.2 };
function phone(x, y, w, h, t, scroll, o = {}) {
  card(x - w / 2, y - h / 2, w, h, { r: 36, lw: 3, fill: 'rgba(6,16,32,0.95)' });
  ctx.save(); rr(x - w / 2 + 12, y - h / 2 + 40, w - 24, h - 64, 18); ctx.clip();
  for (let i = -1; i < 8; i++) {
    const py = y - h / 2 + 52 + i * 118 - (scroll % 118);
    card(x - w / 2 + 24, py, w - 48, 100, { r: 12, lw: 2, sc: 'rgba(190,210,240,0.5)', fill: 'rgba(16,34,60,0.9)' });
    ctx.fillStyle = 'rgba(190,210,240,0.35)'; rr(x - w / 2 + 40, py + 16, 60, 60, 10); ctx.fill();
    rr(x - w / 2 + 114, py + 22, w - 180, 12, 6); ctx.fill(); rr(x - w / 2 + 114, py + 44, (w - 180) * 0.6, 12, 6); ctx.fill();
    T('♡ 0', x - w / 2 + 130, py + 78, { s: 14, w: 700, f: MONO, c: C.mu, al: 'left' });
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(200,220,245,0.6)'; rr(x - 40, y - h / 2 + 16, 80, 8, 4); ctx.fill();
}
function plane(x, y, s, ang, a) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha *= a; ctx.strokeStyle = C.wh; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s, -s * 0.6); ctx.lineTo(-s * 0.5, 0); ctx.lineTo(-s, s * 0.6); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.lineTo(s, 0); ctx.stroke(); ctx.restore();
}
scene('posts', T6.t0, T6.end,
  camKeys([[T6.t0, { x: 960, y: 560, z: 1.0 }], [T6.quiet, { x: 980, y: 560, z: 1.08 }], [T6.end, { x: 1000, y: 565, z: 1.14 }]]),
  (t) => {
    const run = t < T6.quiet ? 1 : Math.exp(-(t - T6.quiet) * 6);
    const scrollT = Math.min(t, T6.quiet) - T6.t0 + (t > T6.quiet ? (1 - Math.exp(-(t - T6.quiet) * 6)) / 6 : 0);
    phone(720, 590, 330, 600, t, scrollT * 260);
    const wk = Math.min(7, 1 + Math.floor(6 * E.io(P(t, T6.t0 + 0.15, T6.quiet - T6.t0 - 0.2))));
    T('НЕДЕЛЯ ' + wk, 720, 252, { s: 30, w: 900, c: C.cy, g: 14, ls: 2 });
    // paper planes leave the phone and drop
    for (let i = 0; i < 9; i++) {
      const t0 = T6.t0 + 0.1 + i * 0.16; if (t0 > T6.quiet) break;
      const k = (t - t0) / 1.4; if (k < 0 || k > 1) continue;
      const x = 900 + k * 620, y = 520 - Math.sin(k * Math.PI * 0.6) * 130 + k * k * 380;
      plane(x, y, 20, -0.4 + k * 1.4, (1 - k) * (0.4 + 0.6 * run));
    }
    // flat stats
    const sa = E.o(P(t, T6.t0 + 0.2, 0.4));
    card(1260, 430, 340, 230, { r: 18, a: sa });
    T('ПРОСМОТРЫ', 1290, 485, { s: 16, w: 800, c: C.mu, al: 'left', ls: 2, a: sa });
    T(String(Math.round(3 + 2 * Math.sin(t * 2))), 1570, 485, { s: 26, w: 800, f: MONO, al: 'right', a: sa });
    T('ЛАЙКИ', 1290, 545, { s: 16, w: 800, c: C.mu, al: 'left', ls: 2, a: sa }); T('0', 1570, 545, { s: 26, w: 800, f: MONO, al: 'right', a: sa });
    T('ПРОДАЖИ', 1290, 605, { s: 16, w: 800, c: C.mu, al: 'left', ls: 2, a: sa }); T('0', 1570, 605, { s: 26, w: 800, f: MONO, al: 'right', a: sa });
    pill('ТИШИНА', 1430, 720, t, T6.quiet, { dark: 'rgba(200,220,245,0.7)' });
  },
  { type: 'zoomin', d: 0.5, at: [380, 700], to: [720, 590] });
sfx('whoosh', T6.t0 - 0.2, -10);
for (let i = 0; i < 6; i++) sfx('paper', T6.t0 + 0.1 + i * 0.32, -16);
for (let i = 0; i < 6; i++) sfx('tick', T6.t0 + 0.15 + (T6.quiet - T6.t0 - 0.2) * (i + 1) / 6, -15);

// ---- 7: launch -> $40
const T7 = { t0: T6.end, press: WT('launch', 0) + 0.05, prod: WT('launch', 2), coin: WT('launch', 5) - 0.32, end: LN('stairs').t0 - 0.22 };
scene('launch', T7.t0, T7.end,
  camKeys([[T7.t0, { x: 860, y: 560, z: 1.06 }], [T7.prod, { x: 900, y: 560, z: 1.06 }], [T7.coin - 0.1, { x: 1160, y: 540, z: 1.2 }], [T7.end, { x: 1180, y: 520, z: 1.28 }]]),
  (t) => {
    // the button
    const pr = t > T7.press ? Math.exp(-(t - T7.press) * 10) * Math.sin((t - T7.press) * 40) : 0;
    const bs = 1 - Math.max(0, pr) * 0.08 - (t > T7.press && t < T7.press + 0.08 ? 0.06 : 0);
    ctx.save(); ctx.translate(640, 600); ctx.scale(bs, bs);
    glow('rgba(68,198,255,0.9)', 40 + (t > T7.press ? 30 * Math.exp(-(t - T7.press) * 3) : 0));
    ctx.fillStyle = C.cy; rr(-150, -50, 300, 100, 50); ctx.fill(); noGlow();
    T('ЗАПУСК', 0, 2, { s: 38, w: 900, c: '#041a2e', ls: 3 });
    ctx.restore();
    if (t > T7.press) for (let k = 0; k < 2; k++) { const u = (t - T7.press - k * 0.15) / 0.9; if (u > 0 && u < 1) { ctx.save(); ctx.globalAlpha = 1 - u; ctx.strokeStyle = C.cy; ctx.lineWidth = 3; rr(640 - 150 - u * 120, 550 - u * 80, 300 + u * 240, 100 + u * 160, 50 + u * 80); ctx.stroke(); ctx.restore(); } }
    // the jar
    const jx = 1280, jy = 560, ja = E.o(P(t, T7.t0 + 0.1, 0.5));
    ctx.save(); ctx.globalAlpha = ja;
    ctx.strokeStyle = 'rgba(210,230,255,0.85)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(jx - 150, jy - 190); ctx.lineTo(jx - 130, jy + 190); ctx.quadraticCurveTo(jx - 128, jy + 210, jx - 108, jy + 210); ctx.lineTo(jx + 108, jy + 210); ctx.quadraticCurveTo(jx + 128, jy + 210, jx + 130, jy + 190); ctx.lineTo(jx + 150, jy - 190); ctx.stroke();
    ctx.globalAlpha = ja * 0.12; ctx.fillStyle = '#9fd8ff'; ctx.fillRect(jx - 125, jy - 170, 20, 340);
    ctx.globalAlpha = ja;
    T('ЦЕЛЬ: $10 000', jx, jy + 262, { s: 20, w: 800, c: C.mu, ls: 2 });
    // progress bar: 0.4%
    const pb = t > T7.coin + 0.4 ? E.o(P(t, T7.coin + 0.4, 0.5)) : 0;
    ctx.strokeStyle = 'rgba(200,220,245,0.6)'; ctx.lineWidth = 2; rr(jx - 160, jy + 300, 320, 16, 8); ctx.stroke();
    ctx.fillStyle = C.cy; glow(C.cyGlow, 12); rr(jx - 160, jy + 300, Math.max(0.01, 320 * 0.004 * pb) + 4 * pb, 16, 8); ctx.fill(); noGlow();
    T('0,4%', jx + 190, jy + 308, { s: 20, w: 800, f: MONO, c: C.cy, al: 'left', a: pb });
    ctx.restore();
    // the single coin
    if (t > T7.coin - 0.05) {
      const k = clamp((t - T7.coin) / 0.38), y = lerp(jy - 420, jy + 186, E.i2(k));
      const bounce = t > T7.coin + 0.38 ? Math.abs(Math.sin((t - T7.coin - 0.38) * 14)) * 22 * Math.exp(-(t - T7.coin - 0.38) * 6) : 0;
      coin(jx, y - bounce, 22, { sx: t > T7.coin + 0.5 ? 1 : Math.cos(t * 14) * 0.9 + 0.1 });
      if (t > T7.coin + 0.3) T('$40', jx + 6, jy - 260, { s: 80, w: 900, f: SANS, c: C.cy, g: 22, a: E.o(P(t, T7.coin + 0.3, 0.2)), sc: 0.6 + 0.4 * SPR(t, T7.coin + 0.3, 2.4, 0.45) });
    }
    // the launched "product" flies from the button to the jar's edge and fizzles
    if (t > T7.prod - 0.3 && t < T7.coin + 0.3) {
      const k = clamp((t - T7.prod + 0.3) / 0.8), x = lerp(640, 1180, E.io(k)), y = 520 - Math.sin(k * Math.PI) * 160;
      cube(x, y, 22 * (1 - 0.3 * k), t * 2, { a: 1 - clamp((t - T7.coin) / 0.3) });
    }
  },
  { type: 'whip', d: 0.45, dir: [1, 0] });
sfx('whoosh', T7.t0 - 0.2, -10); sfx('button', T7.press, -2); sfx('whoosh', T7.prod - 0.2, -14); sfx('coin', T7.coin + 0.36, 0); sfx('pop', T7.coin + 0.3, -10);

// ---- 8: the staircase; $10 000 "impossible", $100 000 "a joke"
const T8 = { t0: T7.end, imp: WT('stairs', 4), joke0: WT('stairs', 5), joke: WT('stairs', 9), end: LN('blind').t0 - 0.2 };
const ST = { x0: 360, y0: 920, n: 9, sw: 138, sh: 82 };   // staircase rising right
function stairs(t, a = 1, mirror = false) {
  ctx.save(); ctx.globalAlpha *= a;
  const pts = [[ST.x0 - 400, ST.y0]];
  for (let i = 0; i < ST.n; i++) { const x = ST.x0 + i * ST.sw, y = ST.y0 - i * ST.sh; pts.push([x, y], [x, y - ST.sh]); }
  pts.push([ST.x0 + ST.n * ST.sw + 260, ST.y0 - ST.n * ST.sh]);
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.lineTo(ST.x0 + ST.n * ST.sw + 260, ST.y0 + 400); ctx.lineTo(ST.x0 - 400, ST.y0 + 400); ctx.closePath();
  const g = ctx.createLinearGradient(0, ST.y0 - 800, 0, ST.y0 + 200); g.addColorStop(0, 'rgba(40,110,170,0.55)'); g.addColorStop(1, 'rgba(8,24,48,0.35)');
  ctx.fillStyle = g; ctx.fill();
  line(pts, { c: 'rgba(200,230,255,0.9)', lw: 3, g: 10, gc: 'rgba(120,200,255,0.5)' });
  ctx.restore();
}
const topX = ST.x0 + ST.n * ST.sw + 100, topY = ST.y0 - ST.n * ST.sh;
scene('stairs', T8.t0, T8.end,
  camKeys([[T8.t0, { x: 700, y: 780, z: 1.2 }], [T8.imp - 0.3, { x: 1250, y: 250, z: 1.0 }], [T8.joke0, { x: 1300, y: 120, z: 0.92 }], [T8.joke + 0.2, { x: 1350, y: -80, z: 0.9 }], [T8.end, { x: 1360, y: -95, z: 0.92 }]], E.io2),
  (t) => {
    stairs(t);
    hero(ST.x0 - 150, ST.y0, 70, { t, lean: -0.12 });
    // the $10 000 flag on top + "impossible"
    line([[topX, topY], [topX, topY - 150]], { c: C.wh, lw: 3 });
    ctx.fillStyle = C.wh; ctx.beginPath(); ctx.moveTo(topX + 2, topY - 150); ctx.lineTo(topX + 80, topY - 132); ctx.lineTo(topX + 2, topY - 108); ctx.fill();
    T('$10 000', topX + 20, topY - 190, { s: 40, w: 800, f: MONO, c: C.cy, g: 16 });
    pill('НЕВОЗМОЖНО', topX + 20, topY - 250, t, T8.imp);
    // fog at the top of the stairs
    const fog = ctx.createRadialGradient(topX, topY - 40, 20, topX, topY - 40, 520); fog.addColorStop(0, 'rgba(120,190,240,0.16)'); fog.addColorStop(1, 'rgba(120,190,240,0)');
    ctx.fillStyle = fog; ctx.beginPath(); ctx.arc(topX, topY - 40, 520, 0, TAU); ctx.fill();
    // the cloud with $100 000 and laughter
    const cx = 1150, cy = -230, ca = E.o(P(t, T8.joke0 - 0.2, 0.5));
    if (ca > 0) {
      ctx.save(); ctx.globalAlpha = ca; ctx.translate(cx, cy + Math.sin(t * 1.5) * 8);
      ctx.fillStyle = 'rgba(10,24,44,0.95)'; ctx.strokeStyle = C.wh; ctx.lineWidth = 3; glow('rgba(200,235,255,0.5)', 22);
      ctx.beginPath(); [[-120, 10, 70], [-40, -40, 90], [60, -30, 80], [130, 20, 60], [0, 30, 80]].forEach(([x, y, r]) => { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }); ctx.fill(); noGlow();
      ctx.beginPath(); [[-120, 10, 70], [-40, -40, 90], [60, -30, 80], [130, 20, 60], [0, 30, 80]].forEach(([x, y, r]) => { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }); ctx.stroke();
      ctx.fillStyle = 'rgba(10,24,44,1)'; ctx.beginPath(); [[-120, 10, 68], [-40, -40, 88], [60, -30, 78], [130, 20, 58], [0, 30, 78]].forEach(([x, y, r]) => { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }); ctx.fill();
      T('$100 000', 0, -5, { s: 46, w: 800, f: MONO, c: C.wh });
      ctx.restore();
      const R = RNG('ha');
      for (let i = 0; i < 7; i++) {
        const t0 = T8.joke - 0.1 + i * 0.09; if (t < t0) continue;
        const k = SPR(t, t0, 2.6, 0.4), ang = -2.6 + i * 0.75 + R() * 0.2, d = 230 + R() * 50;
        T('ХА', cx + Math.cos(ang) * d, cy + Math.sin(ang) * d * 0.6 + Math.sin(t * 12 + i) * 6, { s: 30 + R() * 10, w: 900, c: C.cyL, a: clamp(k), sc: k, g: 10 });
      }
      pill('ПРОСТО ШУТКА', cx, cy + 150, t, T8.joke + 0.05);
    }
  },
  { type: 'whip', d: 0.45, dir: [0, -1] });
sfx('whoosh_big', T8.t0 - 0.25, -8); sfx('pop', T8.imp, -6); sfx('whoosh', T8.joke0 - 0.3, -14); sfx('laugh', T8.joke - 0.05, -8); sfx('pop', T8.joke + 0.05, -10);

// ---- 9: what he can't see yet (the silence before the payoff)
const T9 = { t0: T8.end, q: WT('blind', 3), see: WT('blind', 5), end: 39.75 };
const ICONS = [[1150, 540], [1360, 540], [1570, 540]];
scene('blind', T9.t0, T9.end,
  camKeys([[T9.t0, { x: 900, y: 600, z: 1.0, dim: 0.5 }], [T9.end, { x: 960, y: 590, z: 1.1, dim: 0.8 }]], E.sine),
  (t) => {
    floorGrid(t, GY + 120, 0, 0.4);
    stairs(t, 0.55);
    hero(ST.x0 - 150, ST.y0, 70, { t, lean: -0.12 });
    ICONS.forEach(([x, y], i) => {
      const k = SPR(t, T9.t0 + 0.35 + i * 0.16, 2.2, 0.5); if (k <= 0) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(t * 0.4 * (i % 2 ? -1 : 1));
      ctx.setLineDash([7, 9]); ctx.strokeStyle = 'rgba(200,220,245,0.75)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 62, 0, TAU); ctx.stroke(); ctx.restore();
      T('?', x, y + 2, { s: 46, w: 800, c: C.wh, a: clamp(k), sc: k });
    });
    pill('ЧЕГО ОН ПОКА НЕ ВИДИТ', 1360, 410, t, T9.see, { dark: 'rgba(200,220,245,0.7)' });
  },
  { type: 'whip', d: 0.4, dir: [0, 1] });
sfx('whoosh', T9.t0 - 0.2, -12); sfx('pop', T9.see, -14);
