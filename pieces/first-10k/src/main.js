// ============================================================
//  main.js — scene list, transitions, camera, sub-frame motion blur, renderFrame
// ============================================================
// scene: { id, t0, t1, draw(t), cam(t) -> {x,y,z,r,px,py,dim}, into: {type, d, dir, at} }
const SC = [];
const BLURW = [];   // extra [t0,t1] windows with sub-frame motion blur
function scene(id, t0, t1, cam, draw, into) { SC.push({ id, t0, t1, cam, draw, into: into || { type: 'cut', d: 0 } }); }
const CAM0 = { x: W / 2, y: H / 2, z: 1, r: 0 };
// smooth keyframed camera: keys [[t, {x,y,z,r}], ...] eased between
function camKeys(keys, ease = E.io) {
  return (t) => {
    if (t <= keys[0][0]) return { ...CAM0, ...keys[0][1] };
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const [ta, A] = keys[i - 1], [tb, B] = keys[i], u = (keys[i][2] || ease)((t - ta) / (tb - ta));
        const a = { ...CAM0, ...A }, b = { ...CAM0, ...B };
        return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u), r: lerp(a.r, b.r, u), dim: lerp(a.dim || 0, b.dim || 0, u) };
      }
    }
    return { ...CAM0, ...keys[keys.length - 1][1] };
  };
}
let SHAKE = [];  // [t, amp, dur]
function shake(t0, amp, dur) { SHAKE.push([t0, amp, dur]); }
function shakeAt(t) {
  let x = 0, y = 0, r = 0;
  for (const [t0, a, d] of SHAKE) {
    if (t < t0 || t > t0 + d) continue;
    const k = a * Math.pow(1 - (t - t0) / d, 2);
    x += k * nz1(t * 31, t0); y += k * nz1(t * 27, t0 + 4); r += k * 0.0012 * nz1(t * 19, t0 + 9);
  }
  return { x, y, r };
}
function applyCam(c, t) {
  // a living, hand-held drift on top of every move
  const sh = shakeAt(t);
  const dx = Math.sin(t * 0.23) * 7 + Math.sin(t * 0.61) * 3, dy = Math.sin(t * 0.31 + 1) * 5;
  const dr = Math.sin(t * 0.17) * 0.0045 + (c.r || 0);
  ctx.translate(W / 2 + sh.x, H / 2 + sh.y); ctx.rotate(dr + sh.r); ctx.scale(c.z, c.z); ctx.translate(-c.x - dx, -c.y - dy);
}
function trWindow(i) { const s = SC[i], d = s.into.d || 0; return [s.t0 - d / 2, s.t0 + d / 2]; }
function inBlur(t) {
  for (let i = 1; i < SC.length; i++) { const s = SC[i]; if (['whip', 'zoom', 'zoomin'].includes(s.into.type)) { const [a, b] = trWindow(i); if (t > a && t < b) return true; } }
  return BLURW.some(([a, b]) => t > a && t < b);
}
function drawScene(s, t, pre) {
  ctx.save(); if (pre) pre(); const c = s.cam(t); applyCam(c, t); s.draw(t, c); ctx.restore();
}
function drawFrame(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  let i = SC.findIndex((s) => t >= s.t0 && t < s.t1); if (i < 0) i = t < SC[0].t0 ? 0 : SC.length - 1;
  // which transition window are we in?
  let tr = null;
  for (let k = 1; k < SC.length; k++) { const [a, b] = trWindow(k); if (SC[k].into.d && t >= a && t < b) tr = { k, u: (t - a) / (b - a) }; }
  const S = SC[i], c = S.cam(t);
  BGP = { x: c.x * 0.6 + (c.px || 0), y: c.y * 0.6 + (c.py || 0), dim: c.dim || 0 };
  background(t);
  if (!tr) { drawScene(S, t); }
  else {
    const A = SC[tr.k - 1], B = SC[tr.k], o = B.into, u = tr.u, e = E.io(u);
    if (o.type === 'fade') {
      ctx.save(); ctx.globalAlpha = 1 - E.io2(u); drawScene(A, t); ctx.restore();
      ctx.save(); ctx.globalAlpha = E.io2(u); drawScene(B, t); ctx.restore();
    } else if (o.type === 'whip') {
      const [dx, dy] = o.dir, ee = E.io(u);
      ctx.save(); ctx.globalAlpha = 1 - clamp((u - 0.5) * 4); drawScene(A, t, () => ctx.translate(-dx * W * ee, -dy * H * ee)); ctx.restore();
      ctx.save(); ctx.globalAlpha = clamp(u * 4 - 1); drawScene(B, t, () => ctx.translate(dx * W * (1 - ee), dy * H * (1 - ee))); ctx.restore();
    } else if (o.type === 'zoom' || o.type === 'zoomin') {
      const [px, py] = o.at || [W / 2, H / 2], [qx, qy] = o.to || [W / 2, H / 2];
      const ea = E.i(clamp(u * 1.6)), eb = E.o5(clamp(u * 1.6 - 0.6));
      ctx.save(); ctx.globalAlpha = 1 - clamp((u - 0.35) * 3.5);
      drawScene(A, t, () => { const z = 1 + ea * (o.type === 'zoomin' ? 5 : 2.2); ctx.translate(px, py); ctx.scale(z, z); ctx.translate(-px, -py); });
      ctx.restore();
      ctx.save(); ctx.globalAlpha = clamp((u - 0.4) * 3);
      drawScene(B, t, () => { const z = lerp(o.type === 'zoomin' ? 0.35 : 0.6, 1, eb); ctx.translate(qx, qy); ctx.scale(z, z); ctx.translate(-qx, -qy); });
      ctx.restore();
    } else { (t < B.t0 ? drawScene(A, t) : drawScene(B, t)); }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (typeof HUD === 'function') HUD(t);
  captions(t);
}
const ACC = document.createElement('canvas'); ACC.width = W; ACC.height = H; const actx = ACC.getContext('2d');
let POSTO = () => ({});
function renderFrame(t) {
  const blur = window.__exporting && inBlur(t);
  if (!blur) drawFrame(t);
  else {
    const N = 6, sh = 0.85 / FPS;
    actx.clearRect(0, 0, W, H);
    for (let i = 0; i < N; i++) {
      drawFrame(t + (i / (N - 1) - 0.5) * sh);
      actx.globalAlpha = 1 / (i + 1); actx.drawImage(cv, 0, 0);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.drawImage(ACC, 0, 0);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  post(t, POSTO(t));
}
window.renderFrame = renderFrame;
