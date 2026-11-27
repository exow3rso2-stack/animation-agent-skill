// ============================================================
//  scenes_a.js — 1 the hill (hook) · 2 the straight-line graph · 3 the quitters · 4 the line breaks
// ============================================================
// ---- the hill: shared with the finale (scene 17)
const smooth01 = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
function hillY(x) {
  if (x < 1150) return 780 - 450 * E.sine(clamp((x - 330) / 820));
  const d = x - 1150; return 330 + 0.36 * d * smooth01(d / 380);
}
const HILL = []; for (let x = -900; x <= 5200; x += 16) HILL.push([x, hillY(x)]);
const slopeAt = (x) => Math.atan2(hillY(x + 4) - hillY(x - 4), 8);
function onHill(x, r) { const a = slopeAt(x); return [x + Math.sin(a) * r, hillY(x) - Math.cos(a) * r, a]; }

// ---- scene 1: pushing a glowing ball up the hill; over the crest it rolls away by itself and snowballs
const H1 = { climb0: 0.55, crest: WT('hook', 7) - 0.05, end: 5.3 };
function ballX(t) {
  if (t < H1.climb0) return 360;
  if (t < H1.crest) {   // heavy, slipping push
    const u = (t - H1.climb0) / (H1.crest - H1.climb0);
    const slip = Math.sin(u * 26) * 9 * (1 - u) * Math.min(1, u * 6);
    return 360 + (1150 - 360) * E.io2(u) * 0.985 + slip;
  }
  if (t < H1.crest + 0.22) return 1150 - 12 + 12 * E.io((t - H1.crest) / 0.22);  // teeter on the crest
  const tau = t - H1.crest - 0.22; return 1150 + 700 * tau * tau + 60 * tau;
}
function ballR(t) { const tau = t - H1.crest - 0.22; return tau <= 0 ? 52 : 52 + 120 * E.o(clamp(tau / 1.9)); }
function ballVal(t) {
  const x = ballX(t); if (t < H1.crest + 0.22) return clamp((x - 360) / 790) * 10000;
  const tau = t - H1.crest - 0.22; return 10000 + 100000 * Math.pow(clamp(tau / 1.55), 1.7);
}
function glowBall(x, y, r, rot, val, t) {
  ctx.save(); ctx.translate(x, y);
  glow('rgba(68,198,255,0.85)', r * 0.9);
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.05, 0, 0, r);
  g.addColorStop(0, '#2a7fb8'); g.addColorStop(0.6, '#0c2c4c'); g.addColorStop(1, '#0a2440');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#8fe0ff'; ctx.lineWidth = Math.max(3, r * 0.07); ctx.stroke(); noGlow();
  ctx.fillStyle = 'rgba(230,248,255,0.85)'; ctx.beginPath(); ctx.ellipse(-r * 0.38, -r * 0.42, r * 0.18, r * 0.09, -0.7, 0, TAU); ctx.fill();
  T('$', 0, r * 0.03, { s: r * 0.95, w: 900, c: C.cy, g: r * 0.4 });
  // rotating band so the roll reads
  ctx.save(); ctx.rotate(rot); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = Math.max(2, r * 0.05);
  ctx.beginPath(); ctx.ellipse(0, 0, r * 0.92, r * 0.3, 0, 0, TAU); ctx.stroke(); ctx.restore();
  ctx.restore();
  if (val != null) T(money(val), x, y - r - 34 - r * 0.15, { s: 30 + r * 0.16, w: 800, f: MONO, c: C.wh, g: 14 });
}
scene('hill', 0, H1.end,
  (t) => {
    const bx = ballX(t), [cx, cy] = onHill(bx, ballR(t));
    const climb = t < H1.crest + 0.3;
    const z = climb ? lerp(1.28, 1.12, P(t, 0, H1.crest)) : lerp(1.12, 0.62, E.io(P(t, H1.crest + 0.2, 1.6)));
    const lag = climb ? 0 : clamp((t - H1.crest - 0.2) / 0.6) * 160;
    return { x: cx + 120 - lag, y: cy + 40 + (climb ? -30 : 60), z, r: climb ? -0.06 : 0.1 * E.io(P(t, H1.crest, 1.2)), px: 0 };
  },
  (t) => {
    // ground with grass ticks
    const vis = HILL.filter(([x]) => x > -500 && x < 4800);
    line(vis, { c: 'rgba(214,232,255,0.9)', lw: 3.2, g: 10, gc: 'rgba(120,200,255,0.5)' });
    ticks(vis, t, { n: 140, seed: 'hill' });
    // under-ground soft fill
    ctx.save(); ctx.beginPath(); vis.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.lineTo(4800, 3000); ctx.lineTo(-500, 3000); ctx.closePath();
    const gf = ctx.createLinearGradient(0, 300, 0, 1400); gf.addColorStop(0, 'rgba(20,50,90,0.35)'); gf.addColorStop(1, 'rgba(4,10,20,0)'); ctx.fillStyle = gf; ctx.fill(); ctx.restore();
    const bx = ballX(t), r = ballR(t), [cx, cy] = onHill(bx, r);
    // hero: pushes until the crest, then stays on top and watches
    const hxp = t < H1.crest ? bx - r - 62 : 1150 - 52 - 62 + 30 * E.io(P(t, H1.crest, 0.5));
    const [hx, hy, ha] = onHill(hxp, 0);
    const pushing = t < H1.crest;
    hero(hx, hy, 118, { t, lean: pushing ? 0.42 + Math.sin(t * 9) * 0.04 : lerp(0.42, -0.05, E.o(P(t, H1.crest, 0.4))) + ha * 0.2, hop: pushing ? Math.abs(Math.sin(t * 9)) * 3 : 0 });
    // effort drops
    if (pushing && t > 0.8) {
      const R = RNG('sweat');
      for (let i = 0; i < 10; i++) {
        const t0 = 0.8 + i * 0.27 + R() * 0.1, k = (t - t0) / 0.5; if (k < 0 || k > 1) continue;
        ctx.save(); ctx.globalAlpha = (1 - k) * 0.8; ctx.fillStyle = C.cyL;
        ctx.beginPath(); ctx.arc(hx - 10 - k * 40 * (0.5 + R()), hy - 120 - k * 30 + k * k * 60, 3.5, 0, TAU); ctx.fill(); ctx.restore();
      }
    }
    // dust trail when rolling
    if (!climb(t)) {
      const R = RNG('trail');
      for (let i = 0; i < 26; i++) {
        const lagt = i * 0.045, tt = t - lagt; if (tt < H1.crest + 0.22) continue;
        const px = ballX(tt), [qx, qy] = onHill(px, 4);
        ctx.save(); ctx.globalAlpha = 0.5 * (1 - i / 26); ctx.fillStyle = '#7fd4ff';
        ctx.beginPath(); ctx.arc(qx + (R() - 0.5) * 20, qy - R() * 30 - i * 2, 2 + R() * 5, 0, TAU); ctx.fill(); ctx.restore();
      }
    }
    const rot = (bx - 360) / r;
    glowBall(cx, cy, r, rot, ballVal(t), t);
    // speed lines once it runs away
    const sp = clamp((t - H1.crest - 0.6) / 0.6);
    if (sp > 0) {
      const R = RNG('speed'), a = slopeAt(bx);
      for (let i = 0; i < 16; i++) {
        const off = (R() - 0.5) * 520, len = 120 + R() * 260, ph = ((t * 3 + R()) % 1);
        const sx = cx - Math.cos(a) * (200 + ph * 900) + Math.sin(a) * off, sy = cy - Math.sin(a) * (200 + ph * 900) - Math.cos(a) * off;
        line([[sx, sy], [sx - Math.cos(a) * len, sy - Math.sin(a) * len]], { c: 'rgba(160,225,255,0.5)', lw: 2, a: sp * (1 - ph) });
      }
    }
    function climb(tt) { return tt < H1.crest + 0.22; }
  });
BLURW.push([H1.crest + 0.4, H1.end]);
sfx('roll', H1.crest + 0.15, -4);
sfx('whoosh', H1.crest + 0.55, -6);

// ---- scenes 2-4: one graph world. Axes, the "straight line" belief, the quitters, the break.
const G = { ox: 380, oy: 880, x1: 1640, y1: 280 };
const gx = (yr) => G.ox + yr * 126, gy = (v) => G.oy - (v / 100000) * 600;
const TG = { start: H1.end, crowd: WT('line', 0), lineOn: WT('line', 3), lineTag: WT('line', 6), y1: WT('years', 5), y10a: WT('years', 6), y10: WT('years', 10),
  quit0: LN('quit').t0 - 0.35, calc: WT('quit', 1), give: WT('quit', 4), notstart: WT('quit', 7), brk: LN('break').t0 - 0.25, crack: WT('break', 3), shatter: WT('break', 4) - 0.02, end: LN('start').t0 - 0.25 };
const CROWD = [[120, 0.96], [178, 1.04], [236, 0.92], [292, 1.0], [150, 0.9], [262, 0.95]].map(([x, s], i) => ({ x, s, i }));
// the dot's progress along the straight line, in years
function dotYears(t) {
  if (t < TG.y1 - 1.1) return 0;
  if (t < TG.y1 + 0.1) return E.io(P(t, TG.y1 - 1.1, 1.2)) * 1;
  if (t < TG.y10a) return 1;
  return 1 + 9 * E.io2(P(t, TG.y10a, TG.y10 - TG.y10a + 0.05));
}
const FRAGS = (() => { const R = RNG('frags'), n = 22, out = []; for (let i = 0; i < n; i++) { const f0 = i / n, f1 = (i + 1) / n; out.push({ f0, f1, vx: (R() - 0.5) * 900, vy: -300 - R() * 700, vr: (R() - 0.5) * 9 }); } return out; })();
scene('graph', TG.start, TG.end,
  camKeys([[TG.start, { x: 980, y: 560, z: 0.92 }], [TG.lineTag, { x: 960, y: 560, z: 1.0 }], [TG.y1 - 1.0, { x: 940, y: 600, z: 1.02 }],
    [TG.y1 + 0.2, { x: 700, y: 690, z: 1.32 }], [TG.y10a, { x: 760, y: 660, z: 1.3 }], [TG.y10 + 0.1, { x: 1320, y: 420, z: 1.18 }],
    [TG.quit0 + 0.2, { x: 1000, y: 580, z: 0.98 }], [TG.calc + 0.3, { x: 480, y: 700, z: 1.38 }], [TG.notstart + 0.3, { x: 470, y: 720, z: 1.45 }],
    [TG.brk + 0.4, { x: 1000, y: 580, z: 0.95 }], [TG.shatter, { x: 1000, y: 570, z: 1.02 }], [TG.end, { x: 1000, y: 470, z: 0.95 }]]),
  (t) => {
    const a = E.o(P(t, TG.start, 0.7));
    // axes
    line(sub([[G.ox, G.y1 - 30], [G.ox, G.oy], [G.x1 + 60, G.oy]], a), { c: 'rgba(200,220,245,0.8)', lw: 2.6 });
    T('$', G.ox - 4, G.y1 - 58, { s: 26, w: 700, c: C.mu, a });
    for (let i = 1; i <= 10; i++) { const p = clamp(a * 12 - i * 0.6); T(String(i), gx(i), G.oy + 30, { s: 20, w: 600, f: MONO, c: C.mu, a: p }); line([[gx(i), G.oy - 6], [gx(i), G.oy + 6]], { c: 'rgba(200,220,245,0.6)', lw: 2, a: p }); }
    T('ГОДЫ', G.x1 + 20, G.oy + 62, { s: 18, w: 800, c: C.mu, ls: 2, a });
    // the believed straight line (dashed), unless shattered
    const brk = t >= TG.shatter;
    const lineP = E.io(P(t, TG.lineOn - 0.2, 0.9));
    const crack = clamp((t - TG.crack) / 0.2);
    if (!brk && lineP > 0) {
      const pts = sub([[G.ox, G.oy], [G.x1, G.y1]], lineP);
      if (crack > 0) {   // a jagged crack runs along it, it trembles
        const R = RNG('crk' + Math.floor(t * 30));
        ctx.save(); ctx.translate((R() - 0.5) * 6 * crack, (R() - 0.5) * 6 * crack);
        line(pts, { c: '#ffffff', lw: 4 + crack * 2, g: 30 * crack });
        ctx.restore();
      } else line(pts, { c: 'rgba(225,238,255,0.85)', lw: 3, dash: [16, 12], off: -t * 30 });
      pill('ПО ПРЯМОЙ', 1050, 470, t, TG.lineTag, { a: 1 - crack });
    }
    if (brk) {   // shards fly and fall
      const tau = t - TG.shatter;
      for (const f of FRAGS) {
        const p0 = ptAt([[G.ox, G.oy], [G.x1, G.y1]], f.f0), p1 = ptAt([[G.ox, G.oy], [G.x1, G.y1]], f.f1);
        const mx = (p0[0] + p1[0]) / 2 + f.vx * tau, my = (p0[1] + p1[1]) / 2 + f.vy * tau + 1500 * tau * tau, rot = f.vr * tau;
        const hl = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / 2 * 0.8, ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) + rot;
        line([[mx - Math.cos(ang) * hl, my - Math.sin(ang) * hl], [mx + Math.cos(ang) * hl, my + Math.sin(ang) * hl]], { c: C.cyL, lw: 4, g: 16, a: 1 - clamp(tau / 1.2) * 0.3 });
      }
    }
    // the progress dot + solid trail
    const yrs = dotYears(t);
    if (t > TG.y1 - 1.2 && !brk) {
      const da = 1 - crack;
      const p = [gx(yrs), gy(yrs * 10000)];
      line([[G.ox, G.oy], p], { c: C.cy, lw: 5, g: 22, a: da });
      ctx.save(); glow(C.cyGlow, 30); ctx.fillStyle = '#dff6ff'; ctx.globalAlpha = da; ctx.beginPath(); ctx.arc(p[0], p[1], 11, 0, TAU); ctx.fill(); ctx.restore();
      if (yrs >= 0.98) T('$10 000', gx(1) + 18, gy(10000) - 34, { s: 30, w: 800, f: MONO, al: 'left', a: E.o(P(t, TG.y1 - 0.1, 0.3)) * da });
      if (t > TG.y10 - 0.1) T('$100 000', gx(10) - 8, gy(100000) - 44, { s: 40, w: 800, f: MONO, al: 'right', c: C.cy, g: 20, a: E.o(P(t, TG.y10 - 0.1, 0.3)) * da, sc: 1 + 0.15 * Math.sin(Math.PI * P(t, TG.y10 - 0.1, 0.35)) });
      // calendar card
      const ca = E.o(P(t, TG.y1 - 1.3, 0.4)) * (1 - E.io(P(t, TG.quit0, 0.5))) * da;
      if (ca > 0) {
        const cx = 610, cy = 360;
        let big, lab;
        if (t < TG.y1) { big = Math.max(1, Math.round(12 * E.io(P(t, TG.y1 - 1.1, 1.1)))); lab = 'МЕСЯЦЕВ'; if (big === 12) { big = 1; lab = 'ГОД'; } }
        else if (t < TG.y10a) { big = 1; lab = 'ГОД'; }
        else { big = Math.max(1, Math.round(yrs)); lab = big === 1 ? 'ГОД' : big < 5 ? 'ГОДА' : 'ЛЕТ'; }
        const flip = (t * 60) % 1;
        ctx.save(); ctx.globalAlpha = ca;
        card(cx - 70, cy - 70, 140, 150, { r: 18, glowc: big === 10 ? C.cyGlow : null });
        ctx.fillStyle = 'rgba(220,235,255,0.9)'; rr(cx - 70, cy - 70, 140, 34, 14); ctx.fill(); ctx.fillRect(cx - 70, cy - 50, 140, 14);
        T(lab, cx, cy - 53, { s: 16, w: 900, c: '#0a1424', ls: 1.5 });
        T(String(big), cx, cy + 22, { s: 64, w: 900, f: SANS, c: big === 10 ? C.cy : C.wh, g: big === 10 ? 18 : 0 });
        ctx.restore();
      }
    }
    // the crowd ("most people") at the origin; they turn away and walk off when they give up
    for (const m of CROWD) {
      const pop = SPR(t, TG.crowd + m.i * 0.07, 2.4, 0.5); if (pop <= 0) continue;
      const leave = clamp((t - TG.give - m.i * 0.16) / 0.9);
      const x = m.x - E.i2(leave) * 260, a = 1 - leave;
      grey(x, G.oy, 84 * m.s * pop, { t, ph: m.i, flip: leave > 0.02, a, lean: -0.08 * Math.sin(leave * 20) * (1 - leave) });
    }
    T('БОЛЬШИНСТВО', 206, G.oy + 34, { s: 16, w: 800, c: C.mu, ls: 2.5, a: E.o(P(t, TG.crowd + 0.3, 0.4)) * (1 - P(t, TG.give, 0.6)) });
    // start flag (never used)
    if (t > TG.calc - 0.3) {
      const fa = E.o(P(t, TG.calc - 0.3, 0.4)) * (1 - P(t, TG.brk + 0.4, 0.5));
      ctx.save(); ctx.globalAlpha = fa;
      line([[G.ox + 60, G.oy], [G.ox + 60, G.oy - 110]], { c: C.wh, lw: 3 });
      const wv = Math.sin(t * 5) * 6;
      ctx.fillStyle = C.wh; ctx.beginPath(); ctx.moveTo(G.ox + 61, G.oy - 110); ctx.quadraticCurveTo(G.ox + 95, G.oy - 104 + wv, G.ox + 125, G.oy - 92); ctx.lineTo(G.ox + 61, G.oy - 74); ctx.fill();
      T('СТАРТ', G.ox + 60, G.oy + 64, { s: 16, w: 800, c: C.mu, ls: 2 });
      ctx.restore();
    }
    // calculator: 100 000 ÷ 10 000 = 10 ЛЕТ
    const kc = E.o(P(t, TG.calc - 0.35, 0.4)) * (1 - E.io(P(t, TG.brk, 0.5)));
    if (kc > 0) {
      const x = 640, y = 560 + (1 - kc) * 40;
      ctx.save(); ctx.globalAlpha = kc;
      card(x - 120, y - 150, 240, 300, { r: 24 });
      ctx.fillStyle = 'rgba(30,70,110,0.6)'; rr(x - 96, y - 126, 192, 70, 10); ctx.fill();
      const txt = '100K ÷ 10K', ty = Math.floor(clamp((t - TG.calc) / 0.4) * txt.length);
      const res = t > WT('quit', 2);
      T(res ? '10 ЛЕТ' : txt.slice(0, ty), x, y - 91, { s: res ? 34 : 24, w: 800, f: MONO, c: res ? C.cy : C.wh, g: res ? 16 : 0 });
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { ctx.strokeStyle = 'rgba(200,220,245,0.55)'; ctx.lineWidth = 2; rr(x - 92 + c * 48, y - 34 + r * 44, 40, 34, 7); ctx.stroke(); }
      ctx.restore();
    }
    pill('СДАЮТСЯ, НЕ НАЧАВ', 330, 700, t, TG.notstart - 0.2, { a: 1 - P(t, TG.brk, 0.4) });
  },
  { type: 'zoom', d: 0.55, at: [1500, 700] });
sfx('pop', TG.crowd, -12); sfx('whoosh', TG.lineOn - 0.15, -14); sfx('pop', TG.lineTag, -8);
for (let i = 0; i < 12; i++) sfx('tick', TG.y1 - 1.1 + i * 0.09, -16);
for (let i = 0; i < 9; i++) sfx('tick', TG.y10a + (TG.y10 - TG.y10a) * E.io2((i + 1) / 9) * 0.98, -14);
sfx('ding', TG.y10 - 0.05, -10);
for (let i = 0; i < 6; i++) sfx('tick', TG.calc + i * 0.07, -18);
sfx('pop', TG.notstart - 0.2, -10);
sfx('rise', TG.crack - 0.9, -10); sfx('shatter', TG.shatter, -2); shake(TG.shatter, 22, 0.6);
BLURW.push([TG.shatter, TG.shatter + 0.5]);
