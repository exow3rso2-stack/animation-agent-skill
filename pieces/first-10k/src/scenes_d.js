// ============================================================
//  scenes_d.js — 14 coins become a machine · 15 the hill again (the machine does the pushing) · 16 title
// ============================================================
// the machine, in local coords (body 320x210 centred at 0,0). k: per-part assembly 0..1, on: running 0..1
const MPARTS = ['body', 'gearA', 'gearB', 'funnel', 'chimney', 'chute'];
function machine(x, y, s, t, k = {}, on = 0, from = null) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const part = (name, fn) => {
    const kk = k[name] == null ? 1 : k[name]; if (kk <= 0) return;
    ctx.save();
    if (from && kk < 1) { const [fx, fy, fr] = from[name]; const u = 1 - E.o5(kk); ctx.translate(fx * u, fy * u); ctx.rotate(fr * u); }
    ctx.globalAlpha *= clamp(kk * 3); fn(); ctx.restore();
  };
  const st = 'rgba(214,236,255,0.95)', spin = on > 0 ? (t - 65.0) * 2.4 * on : 0;
  part('chimney', () => {
    ctx.strokeStyle = st; ctx.lineWidth = 3.5; ctx.fillStyle = 'rgba(8,22,42,0.95)';
    rr(80, -175, 36, 72, 6); ctx.fill(); ctx.stroke(); rr(72, -186, 52, 16, 5); ctx.fill(); ctx.stroke();
    if (on > 0) for (let i = 0; i < 6; i++) { const ph = ((t * 0.9 + i / 6) % 1); ctx.save(); ctx.globalAlpha *= on * (1 - ph) * 0.55; ctx.fillStyle = '#bfe6ff'; ctx.filter = 'blur(3px)'; ctx.beginPath(); ctx.arc(98 + Math.sin(ph * 6 + i) * 12 + ph * 30, -200 - ph * 110, 10 + ph * 22, 0, TAU); ctx.fill(); ctx.restore(); }
  });
  part('funnel', () => {
    ctx.strokeStyle = st; ctx.lineWidth = 3.5; ctx.fillStyle = C.cy; glow(C.cyGlow, 20);
    ctx.beginPath(); ctx.moveTo(-130, -170); ctx.lineTo(-30, -170); ctx.lineTo(-60, -105); ctx.lineTo(-100, -105); ctx.closePath(); ctx.fill(); noGlow();
  });
  part('body', () => {
    ctx.fillStyle = 'rgba(8,22,42,0.96)'; ctx.strokeStyle = st; ctx.lineWidth = 4; glow('rgba(120,210,255,0.6)', 26 + 20 * on);
    rr(-160, -105, 320, 210, 22); ctx.fill(); noGlow(); rr(-160, -105, 320, 210, 22); ctx.stroke();
    for (let i = 0; i < 3; i++) { const lit = on > 0 && Math.sin(t * 8 - i * 1.3) > 0; ctx.fillStyle = lit ? C.cyL : 'rgba(120,150,190,0.5)'; if (lit) glow(C.cyGlow, 14); ctx.beginPath(); ctx.arc(64 + i * 30, -70, 7, 0, TAU); ctx.fill(); noGlow(); }
  });
  part('gearA', () => gear(-62, 12, 58, spin, { n: 10, lw: 3.5, g: 10 + 14 * on }));
  part('gearB', () => gear(48, 40, 38, -spin * 1.5 + 0.2, { n: 8, lw: 3.5, g: 8 + 12 * on }));
  part('chute', () => {
    ctx.strokeStyle = st; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(160, 40); ctx.lineTo(250, 92); ctx.moveTo(160, 82); ctx.lineTo(232, 124); ctx.stroke();
  });
  ctx.restore();
}

// ---- 14: the first $10 000 is a stack of coins... it's not about money: it becomes a machine
const T14 = { t0: T13.end, ten: WT('notmoney', 1), money: WT('notmoney', 6), burst: WT('notmoney', 6) + 0.45, build: WT('machine', 4), on: WT('machine', 5), end: LN('easier').t0 - 0.1 };
const MC = { x: 960, y: 600 };
const PART_T = MPARTS.map((n, i) => T14.burst + 0.42 + i * 0.2);
const COINP = (() => { const R = RNG('coinburst'); return Array.from({ length: 10 }, (_, i) => ({ ang: -Math.PI / 2 + (R() - 0.5) * 2.6, d: 260 + R() * 220, spin: (R() - 0.5) * 16 })); })();
const MFROM = {}; MPARTS.forEach((n, i) => { const c = COINP[i]; MFROM[n] = [Math.cos(c.ang) * c.d, -110 + Math.sin(c.ang) * c.d * 0.8 - 40, c.spin * 0.2]; });
scene('coins', T14.t0, T14.end,
  camKeys([[T14.t0, { x: 960, y: 610, z: 1.04 }], [T14.ten + 0.3, { x: 960, y: 620, z: 1.16, r: 0.01 }], [T14.burst, { x: 960, y: 590, z: 0.96, r: -0.01 }], [T14.on, { x: 960, y: 600, z: 1.06 }], [T14.end, { x: 960, y: 600, z: 1.1 }]]),
  (t) => {
    // contact shadow
    ctx.save(); const sg = ctx.createRadialGradient(MC.x, 720, 10, MC.x, 720, 260); sg.addColorStop(0, 'rgba(68,198,255,0.25)'); sg.addColorStop(1, 'rgba(68,198,255,0)'); ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(MC.x, 718, 260, 40, 0, 0, TAU); ctx.fill(); ctx.restore();
    const burstK = clamp((t - T14.burst) / 0.45);
    // the coin stack: falls in, then bursts
    for (let i = 0; i < 10; i++) {
      const t0 = T14.t0 + 0.05 + i * 0.07, k = clamp((t - t0) / 0.22);
      if (k <= 0) continue;
      const sy = 700 - i * 15, y = lerp(sy - 420, sy, E.i2(k));
      if (burstK <= 0) { coinFlat(MC.x, y, 86, { g: i === 9 ? 18 : 0 }); continue; }
      const c = COINP[i], partT = PART_T[i];
      if (i < 6 && t > partT - 0.4) continue;            // this coin has become a part
      const bx = MC.x + Math.cos(c.ang) * c.d * E.o(burstK), by = sy - 110 + Math.sin(c.ang) * c.d * 0.8 * E.o(burstK) - 40 * burstK;
      coin(bx, by, 26, { sx: Math.cos(t * c.spin), a: i >= 6 ? 1 - clamp((t - T14.burst - 0.6) / 0.5) : 1 });
    }
    // $10 000 label, struck through on "money"
    const la = E.o(P(t, T14.ten - 0.05, 0.3)) * (1 - clamp((t - T14.burst) / 0.3));
    if (la > 0) {
      T('$10 000', MC.x, 470, { s: 64, w: 800, f: MONO, c: C.wh, a: la, g: 10 });
      if (t > T14.money) { const k = E.o(P(t, T14.money, 0.28)), w = TW('$10 000', 64, 800, MONO); line([[MC.x - w / 2 - 10, 474], [MC.x - w / 2 - 10 + (w + 20) * k, 474]], { c: C.cy, lw: 6, g: 14, a: la }); }
    }
    // the machine assembles from the coins
    if (t > PART_T[0] - 0.45) {
      const k = {}; MPARTS.forEach((n, i) => (k[n] = clamp((t - PART_T[i] + 0.4) / 0.4)));
      machine(MC.x, MC.y, 1.0, t, k, E.o(P(t, T14.on, 0.5)), MFROM);
    }
    // first coins come out
    if (t > T14.on + 0.3) for (let j = 0; j < 4; j++) { const t0 = T14.on + 0.35 + j * 0.28, u = (t - t0) / 0.7; if (u < 0 || u > 1) continue; coin(MC.x + 250 + u * 260, MC.y + 110 + u * u * 140, 18, { sx: Math.cos(t * 9), a: 1 - u }); }
  },
  { type: 'zoom', d: 0.45, at: [960, 600], to: [960, 620] });
sfx('whoosh', T14.t0 - 0.2, -12);
for (let i = 0; i < 10; i++) sfx('tick', T14.t0 + 0.05 + i * 0.07 + 0.2, -10);
sfx('whoosh', T14.money - 0.05, -14); sfx('shatter', T14.burst, -12); sfx('whoosh_big', T14.burst, -12);
MPARTS.forEach((n, i) => sfx(i < 3 ? 'gear' : 'tick', PART_T[i], i < 3 ? -6 : -8));
sfx('machine', T14.on + 0.05, -6); sfx('ding', T14.on + 0.05, -10);
BLURW.push([T14.burst, T14.burst + 0.45]);

// ---- 15: the hill from the opening — now the machine sits on the crest and the money rolls down by itself
const T15 = { t0: T14.end, each: WT('easier', 4), easy: WT('easier', 8), end: LN('outro').t0 - 0.16 };
const MS = 0.5, MW = { x: 1150, y: 330 - 105 * MS };   // machine on the crest
const CHUTE = [MW.x + 241 * MS, MW.y + 108 * MS];
const NCOIN = 70;
const coinT = (j) => T15.t0 + 0.15 + (T15.end - T15.t0 + 0.6) * Math.pow(j / NCOIN, 0.62);   // inter-arrival keeps shrinking
const coinX = (tau) => CHUTE[0] + 30 * tau + 520 * tau * tau;
const income = (t) => 15800 * Math.exp(0.5 * Math.max(0, t - T15.t0 - 0.2));
scene('hill2', T15.t0, T15.end + 0.4,
  camKeys([[T15.t0, { x: MW.x, y: MW.y, z: 2.2 }], [T15.t0 + 1.5, { x: 1350, y: 470, z: 0.8, r: 0.04 }], [T15.end, { x: 1850, y: 640, z: 0.66, r: 0.09 }]], E.io),
  (t) => {
    const vis = HILL.filter(([x]) => x > -500 && x < 5000);
    ctx.save(); ctx.beginPath(); vis.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.lineTo(5000, 3500); ctx.lineTo(-500, 3500); ctx.closePath();
    const gf = ctx.createLinearGradient(0, 300, 0, 1600); gf.addColorStop(0, 'rgba(20,60,110,0.4)'); gf.addColorStop(1, 'rgba(4,10,20,0)'); ctx.fillStyle = gf; ctx.fill(); ctx.restore();
    line(vis, { c: 'rgba(214,232,255,0.9)', lw: 3.2, g: 10, gc: 'rgba(120,200,255,0.5)' });
    ticks(vis, t, { n: 160, seed: 'hill' });
    machine(MW.x, MW.y, MS, t, {}, 1);
    // the hero, relaxed, beside the machine
    const [hx, hy] = onHill(MW.x - 150, 0); hero(hx, hy, 62, { t, lean: -0.05 });
    // coins roll down, faster and faster; a growing ball leads them (the snowball from the opening)
    let lead = 0;
    for (let j = 0; j < NCOIN; j++) {
      const tau = t - coinT(j); if (tau < 0) continue;
      const x = coinX(tau); if (x > 4900) continue;
      lead = Math.max(lead, x);
      const [cx, cy] = x < CHUTE[0] + 60 ? [x, lerp(CHUTE[1], onHill(x, 14)[1], clamp((x - CHUTE[0]) / 60))] : onHill(x, 14);
      coin(cx, cy, 14, { sx: Math.cos(tau * 12 + j), g: 12 });
    }
    const n = Math.max(0, Math.min(NCOIN, Math.floor(NCOIN * Math.pow(clamp((t - T15.t0 - 0.15) / (T15.end - T15.t0 + 0.6)), 1 / 0.62))));
    if (lead > CHUTE[0] + 200) { const r = 30 + n * 1.5; const [bx, by] = onHill(lead + r * 0.6, r); glowBall(bx, by, r, (lead) / r, null, t); }
    // the old struggle, faint: the uphill side, empty
  },
  { type: 'cut', d: 0 });
BLURW.push([T15.t0 + 0.2, T15.t0 + 1.4]);
sfx('whoosh_big', T15.t0 + 0.1, -10); sfx('roll', T15.t0 + 1.0, -8); sfx('roll', T15.t0 + 2.6, -6);
for (let j = 0; j < 26; j++) sfx('coin', coinT(j * 2) + 0.05, -22 + j * 0.25, { rate: 1 + (j % 5) * 0.08 });
// HUD: income, drawn at screen size on top of the hill scene
const HUD = (t) => {
  if (t < T15.t0 + 0.3 || t > T15.end + 0.4) return;
  const a = E.o(P(t, T15.t0 + 0.3, 0.4)) * (1 - P(t, T15.end, 0.4));
  const x = 1720, y = 300;
  ctx.save(); ctx.globalAlpha = a;
  T('ДОХОД', x, y, { s: 18, w: 800, c: C.mu, ls: 3, al: 'right' });
  T(money(income(t)), x, y + 56, { s: 60, w: 800, f: MONO, c: C.cy, g: 22, al: 'right' });
  // exponential sparkline
  const pts = []; for (let i = 0; i <= 40; i++) { const tt = T15.t0 + 0.2 + (t - T15.t0 - 0.2) * i / 40; pts.push([x - 300 + 300 * i / 40, y + 170 - 90 * (income(tt) - 15800) / (140000 - 15800)]); }
  line([[x - 300, y + 172], [x, y + 172]], { c: 'rgba(160,190,225,0.5)', lw: 2 });
  line(pts, { c: C.cy, lw: 3.5, g: 14 });
  ctx.restore();
};

// ---- 16: title
const T16 = { t0: T15.end, w1: WT('outro', 0), w2: WT('outro', 1), sub: WT('outro', 2) };
CAP_HIDE = (t) => t > T16.t0 + 0.1;
scene('title', T16.t0, DURATION + 0.1,
  camKeys([[T16.t0, { x: 960, y: 540, z: 1.0 }], [DURATION, { x: 960, y: 535, z: 1.07 }]], E.sine),
  (t) => {
    const S = 150, words = [['СТРОЙ', T16.w1, C.wh], ['МАШИНУ.', T16.w2, C.cy]];
    const ws = words.map(([w]) => TW(w, S, 900, SANS, 2)), gap = 44, tot = ws[0] + ws[1] + gap;
    let x = W / 2 - tot / 2;
    words.forEach(([w, t0, c], wi) => {
      let xx = x;
      for (let i = 0; i < w.length; i++) {
        const ch = w[i], cw = TW(ch, S, 900, SANS, 2), k = SPR(t, t0 - 0.08 + i * 0.035, 2.2, 0.55), a = clamp((t - t0 + 0.08 - i * 0.035) / 0.12);
        T(ch, xx + cw / 2, 470 + (1 - k) * 90, { s: S, w: 900, c, ls: 2, a, g: wi ? 30 : 0, sc: 0.8 + 0.2 * k });
        xx += cw;
      }
      x += ws[wi] + gap;
    });
    const subs = ['ДЕНЬГИ', 'ПРИДУТ', 'СЛЕДОМ'], st = [T16.sub, WT('outro', 3), WT('outro', 4)];
    const sw = subs.map((s) => TW(s, 38, 600, SANS, 10)), sg = 30, stot = sw.reduce((a, b) => a + b, 0) + sg * 2;
    let sx = W / 2 - stot / 2;
    subs.forEach((s, i) => { const k = E.o(P(t, st[i] - 0.05, 0.35)); T(s, sx + sw[i] / 2, 610 + (1 - k) * 20, { s: 38, w: 600, c: C.mu, ls: 10, a: k }); sx += sw[i] + sg; });
    // a small closing vignette: the machine and its stream, the hero walking with it
    const va = E.o(P(t, T16.sub + 0.4, 0.6));
    if (va > 0) {
      ctx.save(); ctx.globalAlpha = va;
      line([[560, 860], [1360, 860]], { c: 'rgba(200,225,255,0.6)', lw: 2 });
      machine(700, 860 - 105 * 0.34, 0.34, t, {}, 1);
      for (let j = 0; j < 8; j++) { const ph = ((t * 0.45 + j / 8) % 1); coin(790 + ph * 520, 848, 9, { sx: Math.cos(t * 8 + j), a: Math.sin(ph * Math.PI), g: 8 }); }
      hero(1330, 860, 48, { t });
      ctx.restore();
    }
  },
  { type: 'fade', d: 0.6 });
sfx('whoosh', T16.w1 - 0.15, -10); sfx('thud', T16.w2 + 0.1, -6); sfx('ding', T16.w2 + 0.15, -10);
