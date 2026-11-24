// Cast of the discipline short as lit flat cards in the 3D world (pool / Actor / Fx machinery from the bridge
// skill's cast.ts, unchanged), plus the staging of Max, Sam and Max's little "motivation" star per shot.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxNote, fxBurst, fxContact, Outfit, Expr, FrontOpts, SideOpts, INK } from "./toon";
import { FPS, SHOTS, V3, MAX_START, SAM_START, ROCK, SIT_S, samS, pathAt, pathDir, outward, clamp01, smooth, WALK_V } from "./story";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";
// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
export const SU_SWING = 2.3 / 1830; // swing canvas: rope of 1830 units = 2.3 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
/** world roots that hold actors (to find the scene's sun when world.ts does not pass it) */
const ROOTS = new Set<THREE.Object3D>();

/** lit flat character: cardShade() material, receives shadows (dims to the bright floor only), casts its silhouette
 *  when world.ts says so (golden). Drawn after the contact blobs (renderOrder 1). */
export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    // rim width is in output pixels: tell the card shader the render height (1920 = 1080 x 1920 frame)
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
/** unlit effect card: hard cut-out (ink drawings), soft see-through (dust, mist) or a multiply ground blob */
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      // no mipmaps: at grazing views the mip chain averages the blob with its white surround and it fades out
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    }
    else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0; }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing"; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
/** sun = world direction TOWARD the sun (optional: when absent the scene's shadow-casting light is used) */

export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };
// ---------------- cast ----------------
const MAX: Outfit = { jacket: "#e8692e", pants: "#34497a", boots: "#f4f1ea", hat: "hair", hair: "#3a2a22" };
const SAM: Outfit = { jacket: "#3f7fbf", pants: "#47474f", boots: "#5a3b2a", hat: "cap", cap: "#2f8a4f", skin: "#f5c9a0" };
const q = (v: number, n = 120) => Math.round(v * n) / n;
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
const tmp = new THREE.Vector3();
/** canvas angle the sun comes FROM on an upright card facing the camera, in 45-degree steps */
const light2D = (cam: CamInfo, mirror: boolean) => {
  const S = cam.sun!;
  const sx = S.dot(cam.right) * (mirror ? -1 : 1), sy = -S.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};
const LEAD = 2 / FPS;
const LID = [0.5, 1, 1, 0.5];
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const lidAt = (t: number, i: number) => {
  const f = Math.round(t * FPS);
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13));
  }
  return 0;
};

export type Stage = { places: Place[]; fx: FxPlace[] };
type Who = { i: number; o: Outfit; okey: string; seed: number };
const WMAX: Who = { i: 1, o: MAX, okey: "max", seed: 3 };
const WSAM: Who = { i: 2, o: SAM, okey: "sam", seed: 6 };

const front = (cam: CamInfo, who: Who, p: V3, fo: FrontOpts, out: Stage, t: number, blob = true) => {
  const d = cam.pos.distanceTo(tmp.set(p[0], p[1] + 1.2, p[2]));
  const [w, h, k] = tier(d);
  const f2: FrontOpts = { blink: lidAt(t, who.i), ...fo, light: light2D(cam, false), seed: who.seed };
  out.places.push({ key: `F|${who.okey}|${fkey(f2)}`, x: p[0], y: p[1], z: p[2], size: [w, h, k], draw: (pp) => bodyFront(pp, who.o, f2) });
  if (blob) contact(out, p, fo.mode === "sit" ? 1.2 : 1);
};
/** walking side view along horizontal direction dir */
const side = (cam: CamInfo, who: Who, p: V3, dir: V3, so: SideOpts, out: Stage, t: number) => {
  const d = cam.pos.distanceTo(tmp.set(p[0], p[1] + 1.2, p[2]));
  const [w, h, k] = tier(d);
  const tx = cam.pos.x - p[0], tz = cam.pos.z - p[2], tl = Math.hypot(tx, tz) || 1, c = (tx * dir[0] + tz * dir[2]) / tl;
  const fs = Math.round(Math.sqrt(Math.max(0.05, 1 - c * c)) * 20) / 20;
  const mirror = dir[0] * cam.right.x + dir[2] * cam.right.z < 0;
  const s2: SideOpts = { blink: lidAt(t, who.i), ...so, stride: (so.stride ?? 0.69) * fs, light: light2D(cam, mirror), seed: who.seed };
  out.places.push({ key: `S|${who.okey}|${fkey(s2)}`, x: p[0], y: p[1], z: p[2], mirror, size: [w, h, k], draw: (pp) => bodySide(pp, who.o, s2) });
  contact(out, p, 1);
};
const CONTACT_COL = "#3a3a58";
const contact = (out: Stage, p: V3, sc: number) =>
  out.fx.push({ key: `blob|contact|${CONTACT_COL}`, cw: 128, ch: 128, draw: (pp) => fxContact(pp, CONTACT_COL), x: p[0], y: p[1] + 0.03, z: p[2], w: 0.62 * sc, h: 0.5 * sc, flat: true });

/** Max's "motivation": a little yellow star with a face */
const buddyDraw = (mood: "happy" | "sad") => (p: Pen) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 78 : 170; pts.push([200 + r * Math.cos(a), 215 + r * Math.sin(a)]); }
  p.poly(pts, "#ffd23f", 14);
  p.ell(200, 228, 95, 70, "#ffe27a", 0);
  p.dot(172, 205, 13, INK); p.dot(228, 205, 13, INK);
  if (mood === "happy") p.arc(200, 238, 30, 22, 15, 165, 10, INK);
  else { p.arc(200, 262, 26, 16, 200, 340, 10, INK); p.dot(242, 228, 7, "#7fc4f0"); }
};
const buddy = (out: Stage, p: V3, sz: number, mood: "happy" | "sad", rot = 0) =>
  out.fx.push({ key: `buddy|${mood}`, cw: 400, ch: 400, draw: buddyDraw(mood), x: p[0], y: p[1], z: p[2], w: sz, h: sz, rot });
const note = (out: Stage, p: V3, kind: number, sz = 0.28, rot = 0) =>
  out.fx.push({ key: `note|${kind}`, cw: 256, ch: 256, draw: (pp) => fxNote(pp, kind, "#1f2a44"), x: p[0], y: p[1], z: p[2], w: sz, h: sz, rot });
const burst = (out: Stage, p: V3, k: number, sz: number, col = "#fff3b0") => {
  const kk = Math.round(k * 12) / 12;
  out.fx.push({ key: `burst|${kk}|${col}`, cw: 500, ch: 500, draw: (pp) => fxBurst(pp, kk, col, 12, 40, 240), x: p[0], y: p[1], z: p[2], w: sz, h: sz });
};

const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const up = (p: V3, dy: number): V3 => [p[0], p[1] + dy, p[2]];
const neg = (v: V3): V3 => [-v[0], -v[1], -v[2]];

/** everything with a face in shot `id` at film time t */
export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] }, f = Math.round(t * FPS), L = LEAD;
  const R = cam.right;
  const sideOf = (p: V3, k: number): V3 => [p[0] + R.x * k, p[1], p[2] + R.z * k];
  const walk = (who: Who, s: number, expr: Expr, extra: Partial<SideOpts> = {}) =>
    side(cam, who, pathAt(s), pathDir(s), { mode: "march", phase: ((t * 1.0) % 1 + 1) % 1, expr, stomp: 1, ...extra }, out, t);
  switch (id) {
    case 1: {
      front(cam, WMAX, MAX_START, { mode: "stand", expr: "grin", headphones: true, facing: 1 }, out, t);
      front(cam, WSAM, SAM_START, { mode: "stand", expr: "neutral", facing: -1 }, out, t);
      buddy(out, up(sideOf(MAX_START, -0.45), 1.95 + 0.06 * Math.sin(t * 6)), 0.42, "happy", 0.1 * Math.sin(t * 4));
      break;
    }
    case 2: {
      const speech = t >= 4.19 - L;
      const phase = (t * 2) % 1;
      front(cam, WMAX, MAX_START, speech
        ? { mode: "stand", expr: "laugh", headphones: true, cheer: 0.5 + 0.5 * Math.sin(t * 9), tilt: 3 * Math.sin(t * 9) }
        : { mode: "stroll", phase, lift: 40, expr: "grin", headphones: true, tilt: 4 * Math.sin(t * Math.PI * 4), headTilt: 5 * Math.sin(t * Math.PI * 4) }, out, t);
      front(cam, WSAM, SAM_START, { mode: "stand", expr: "neutral" }, out, t);
      for (let i = 0; i < 3; i++) {
        const u = ((t * 0.7 + i / 3) % 1);
        note(out, up(sideOf(MAX_START, (i - 1) * 0.42 + 0.1 * Math.sin(t * 3 + i)), 1.7 + u * 0.9), i % 2, 0.26 * (1 - 0.4 * u), 0.3 * Math.sin(t * 5 + i));
      }
      buddy(out, up(sideOf(MAX_START, -0.62), 1.55 + 0.08 * Math.sin(t * 7)), 0.38, "happy", 0.15 * Math.sin(t * 5));
      break;
    }
    case 3: {
      front(cam, WMAX, MAX_START, { mode: "stand", expr: t < 5.28 - L ? "smile" : "grin", wave: 1, phone: true, headphones: true, headTilt: -6, look: 1 }, out, t);
      buddy(out, up(sideOf(MAX_START, -0.42), 1.72), 0.36, "happy", -0.2);
      const k = (f - 158) / 10;
      if (k >= 0 && k < 1) burst(out, up(sideOf(MAX_START, 0.42), 1.95), k, 0.9, "#ffffff");
      break;
    }
    case 4: {
      walk(WSAM, samS(4, t), "neutral");
      front(cam, WMAX, MAX_START, { mode: "stand", expr: "grin", wave: 1, phone: true, headphones: true, headTilt: -6 }, out, t);
      break;
    }
    case 5: {
      walk(WSAM, 40 + WALK_V * (t - 7.8), "neutral");
      front(cam, WMAX, ROCK, { mode: "sit", expr: "pained" }, out, t);
      break;
    }
    case 6: {
      front(cam, WMAX, ROCK, { mode: "sit", expr: t < 10.3 ? "nervous" : "pained", look: t > 10.0 ? -1 : 0 }, out, t);
      // the star gives up too: hops off his shoulder and floats away down the hill
      const k = smooth((t - 9.95) / 1.6), d = pathDir(SIT_S), o = outward(ROCK);
      const p = add(add(up(ROCK, 1.55 + 0.9 * k + 0.08 * Math.sin(t * 6)), neg(d), 3.2 * k * k + 0.35), o, 0.9 * k);
      if (k < 0.98) buddy(out, p, 0.36 * (1 - 0.35 * k), "sad", 0.25 * Math.sin(t * 5));
      break;
    }
    case 7: {
      const crown = t < 11.68 - L ? 0 : (() => { const u = clamp01((t - 11.62) / 0.3); return u < 0.7 ? 1.25 * u / 0.7 : 1.25 - 0.25 * (u - 0.7) / 0.3; })();
      if (t < 14.05) {
        const standing = t >= 12.4;
        front(cam, WMAX, ROCK, {
          mode: standing ? "stand" : "sit", expr: t < 11.68 - L ? "pained" : "smile", crown,
          headTilt: crown > 0 ? -9 : 0, tilt: standing ? -3 : 0, facing: 1,
        }, out, t);
      } else {
        // turns and walks back down the hill
        const d = pathDir(SIT_S), s = (t - 14.05) * WALK_V * 1.2;
        const p0 = add(ROCK, neg(d), s), p: V3 = [p0[0], pathAt(SIT_S - s)[1] + (ROCK[1] - pathAt(SIT_S)[1]), p0[2]];
        side(cam, WMAX, p, neg(d), { mode: "march", phase: (t * 1.2) % 1, expr: "smile", stomp: 1 }, out, t);
      }
      break;
    }
    case 8: walk(WSAM, samS(8, t), "neutral"); break;
    case 9: case 10: case 11: walk(WSAM, samS(id, t), id === 10 ? "smile" : "neutral"); break;
    case 12: {
      front(cam, WMAX, MAX_START, { mode: "stand", expr: "grin", headphones: true, cheer: 0.6 + 0.4 * Math.sin(t * 8) }, out, t);
      buddy(out, up(sideOf(MAX_START, -0.6), 1.6 + 0.07 * Math.sin(t * 7)), 0.36, "happy", 0.15 * Math.sin(t * 5));
      break;
    }
    default: {
      const s = samS(13, t);
      if (t < 22.0) walk(WSAM, s, "neutral");
      else {
        const k = smooth((t - 22.0) / 0.35);
        front(cam, WSAM, pathAt(s), { mode: "stand", expr: t < 22.1 ? "neutral" : "relief_open", cheer: k, facing: 0 }, out, t);
      }
      const kb = (f - 676) / 14;
      if (kb >= 0 && kb < 1) burst(out, add(up(pathAt(s), 1.3), outward(pathAt(s)), -1.2), kb, 3.2, "#ffe3a0");
    }
  }
  return out;
};
