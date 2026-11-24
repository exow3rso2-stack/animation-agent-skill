// "Discipline vs Motivation" (our own 25 s short in the cartoon-3D style of the bridge skill).
// Timeline timed to voice/words.json (ElevenLabs, Brian). One hill with a spiral path, a village at its foot.
// Max runs on motivation (headphones, speech, selfie), quits in the rain, his ego crown pops on. Sam just walks.
import type { LightName } from "./lights";

export const FPS = 30;
export const TOTAL = 750;
export const D0 = 0; // ground level (build.ts houses stand on D0)
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

// ---------------- the hill ----------------
export const C0: V3 = [0, 0, -60];
export const PEAK = 40, SIG = 24;
export const hill = (x: number, z: number) => {
  const dx = x - C0[0], dz = z - C0[2], r2 = dx * dx + dz * dz;
  const ripple = 0.45 * Math.sin(x * 0.23 + 1.3) * Math.cos(z * 0.19 - 0.4) * smooth((Math.sqrt(r2) - 14) / 16);
  return PEAK * Math.exp(-r2 / (2 * SIG * SIG)) + ripple;
};
/** spiral path, u in [0, 1]: 1.1 turns from the trailhead (0, -4) up to the summit */
const TURNS = 2.2 * Math.PI;
const rawPath = (u: number): [number, number] => {
  const th = u * TURNS, r = 1.6 + 54.4 * Math.pow(1 - u, 0.85);
  return [C0[0] + r * Math.sin(th), C0[2] + r * Math.cos(th)];
};
// arc-length table (horizontal + vertical)
const NS = 2000;
const ARC: number[] = [0];
{
  let [px, pz] = rawPath(0), py = hill(px, pz);
  for (let i = 1; i <= NS; i++) {
    const [x, z] = rawPath(i / NS), y = hill(x, z);
    ARC.push(ARC[i - 1] + Math.hypot(x - px, y - py, z - pz));
    px = x; pz = z; py = y;
  }
}
export const PATH_LEN = ARC[NS];
const uOf = (s: number) => {
  if (s <= 0) return 0;
  if (s >= PATH_LEN) return 1;
  let lo = 0, hi = NS;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ARC[m] < s) lo = m; else hi = m; }
  return (lo + (s - ARC[lo]) / (ARC[hi] - ARC[lo])) / NS;
};
/** ground point on the path at distance s (s < 0: the straight trail back toward the village, +z) */
export const pathAt = (s: number): V3 => {
  if (s < 0) { const z = rawPath(0)[1] - s; return [0, hill(0, z), z]; }
  const [x, z] = rawPath(uOf(s));
  return [x, hill(x, z), z];
};
/** horizontal unit tangent (uphill direction of travel) */
export const pathDir = (s: number): V3 => {
  const a = pathAt(s - 0.4), b = pathAt(s + 0.4), dx = b[0] - a[0], dz = b[2] - a[2], n = Math.hypot(dx, dz) || 1;
  return [dx / n, 0, dz / n];
};
/** horizontal unit vector pointing away from the hill centre (downhill side of the path) */
export const outward = (p: V3): V3 => {
  const dx = p[0] - C0[0], dz = p[2] - C0[2], n = Math.hypot(dx, dz) || 1;
  return [dx / n, 0, dz / n];
};
export const SUMMIT: V3 = [C0[0], hill(C0[0], C0[2]), C0[2]];

// ---------------- story positions ----------------
export const MAX_START: V3 = [-1.0, hill(-1.0, 1.6), 1.6];
export const SAM_START: V3 = [1.0, hill(1.0, 1.2), 1.2];
export const SIT_S = 24; // where Max gives up
const sitBase = pathAt(SIT_S), sitOut = outward(sitBase);
export const ROCK: V3 = (() => { const p = add(sitBase, sitOut, 1.35); return [p[0], hill(p[0], p[2]), p[2]]; })();
export const WALK_V = 1.1; // m/s, stride 0.69 at 2 steps/s
/** Sam's distance along the path in each shot (t = film seconds) */
export const samS = (id: number, t: number) => {
  switch (id) {
    case 4: return -4.2 + WALK_V * (t - 6.4);
    case 8: return 62 + WALK_V * (t - 14.67);
    case 9: return 104 + WALK_V * (t - 16.33);
    case 10: return 138 + WALK_V * (t - 17.57);
    case 11: return 164 + WALK_V * (t - 18.8);
    case 13: return Math.min(PATH_LEN - 1.6, PATH_LEN - 4.2 + WALK_V * (t - 22.0) * 1.6);
    default: return 0;
  }
};

// ---------------- shots ----------------
export type ShotDef = { id: number; a: number; b: number; light: LightName; rain?: boolean; sunAz?: number; sunEl?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 50, light: "day", sunAz: 125, sunEl: 40 },         // Two guys, one mountain.
  { id: 2, a: 50, b: 150, light: "day", sunAz: 115 },                    // Max ran on motivation: loud music, a big speech,
  { id: 3, a: 150, b: 192, light: "day", sunAz: 115 },                   // a selfie at the bottom.
  { id: 4, a: 192, b: 234, light: "day", sunAz: 120 },                   // Sam just walked.
  { id: 5, a: 234, b: 290, light: "rain", rain: true },                  // Day three, it rained.
  { id: 6, a: 290, b: 345, light: "rain", rain: true },                  // Max's motivation went home,
  { id: 7, a: 345, b: 440, light: "rain", rain: true },                  // and his ego said: slow steps are beneath you.
  { id: 8, a: 440, b: 490, light: "rain", rain: true },                  // Sam kept walking.
  { id: 9, a: 490, b: 527, light: "day", sunAz: 110 },                   // Research says a habit
  { id: 10, a: 527, b: 564, light: "golden", sunAz: 60, sunEl: 16 },     // takes about sixty-six
  { id: 11, a: 564, b: 600, light: "day", sunAz: 120 },                  // days to stick.
  { id: 12, a: 600, b: 660, light: "day", sunAz: 125 },                  // Motivation starts the climb.
  { id: 13, a: 660, b: TOTAL, light: "golden", sunAz: 25, sunEl: 9 },    // Discipline finishes it.
];
export const XFADE: Record<number, number> = { 5: 8, 9: 8, 10: 8, 11: 8, 12: 6, 13: 8 };
export const FLASH_AT = 48;
export const LIGHTNING_AT = 263;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
/** impact kicks: flip sign every frame, decaying over 7 f */
const KICKS: [number, number][] = [[263, 0.022], [352, 0.012], [678, 0.016]];
const kickAt = (f: number) => {
  let k = 0;
  for (const [f0, a] of KICKS) { const d = f - f0; if (d >= 0 && d < 7) k += a * (d % 2 ? -1 : 1) * (1 - d / 7); }
  return k;
};
const H = (p: V3, dy: number): V3 => [p[0], p[1] + dy, p[2]];
/** side tracking camera on someone walking the path at distance s */
const track = (s: number, dist: number, up: number, lead: number, back = 0.6, lookUp = 1.0): { pos: V3; look: V3 } => {
  const p = pathAt(s), d = pathDir(s), o = outward(p);
  const pos = add(add(H(p, up), o, dist), d, -back), look = add(H(p, lookUp), d, lead);
  return { pos, look };
};

export const camAt = (id: number, f: number): Cam => {
  const s = SHOTS[id - 1], u = clamp01((f - s.a) / Math.max(1, s.b - s.a - 1)), t = f / FPS;
  let c: Cam;
  const M = MAX_START, R = ROCK;
  switch (id) {
    case 1: c = { pos: lerp3([0.4, M[1] + 1.5, 6.8], [0.25, M[1] + 1.4, 5.2], u), look: [0, M[1] + 5.2, -22], fov: 52, roll: 0 }; break;
    case 2: {
      const k = glide((f - 118) / 22);
      c = { pos: lerp3([M[0] + 0.5, M[1] + 1.25, M[2] + 3.5], [M[0] + 0.35, M[1] + 1.2, M[2] + 2.75], u), look: [M[0] + 0.05, M[1] + 1.15, M[2]], fov: 40, roll: lerp(0, 0.075, k) };
      break;
    }
    case 3: c = { pos: lerp3([M[0] - 0.55, M[1] + 1.45, M[2] + 2.05], [M[0] - 0.45, M[1] + 1.42, M[2] + 1.65], u), look: [M[0] + 0.12, M[1] + 1.48, M[2]], fov: 40, roll: -0.05 }; break;
    case 4: { const tr = track(samS(4, t), 4.6, 1.2, 0.8); c = { ...tr, fov: 40, roll: 0 }; break; }
    case 5: c = { pos: lerp3([16, 7.5, 36], [13.5, 7.2, 30], u), look: [0, 15, -52], fov: 46, roll: 0 }; break;
    case 6: {
      const o = outward(R), d = pathDir(SIT_S);
      const base = add(add(H(R, 1.05), o, 3.5), d, -0.2);
      c = { pos: lerp3(base, add(base, o, -0.6), u), look: add(H(R, 0.75), d, -0.25), fov: 40, roll: 0 };
      break;
    }
    case 7: {
      const o = outward(R), d = pathDir(SIT_S);
      const base = add(add(H(R, 1.35), o, 2.45), d, 0.5);
      const k = glide((f - 372) / 20);
      c = { pos: lerp3(base, add(base, o, -0.45), u), look: add(H(R, lerp(0.95, 1.3, k)), d, 0.05), fov: 40, roll: lerp(0, -0.07, glide((f - 378) / 24)) };
      break;
    }
    case 8: { const tr = track(samS(8, t), 4.0, 1.0, 0.9); c = { ...tr, fov: 42, roll: 0.04 }; break; }
    case 9: case 10: case 11: {
      // uphill of Sam looking out over the valley: village, far hills and sky behind him
      const S = pathAt(samS(id, t)), o = outward(S), d = pathDir(samS(id, t));
      const back = id === 10 ? 0.5 : -0.5, dist = 3.6;
      const pos = add(add(S, o, -dist), d, back);
      pos[1] = Math.max(S[1] + 1.9, hill(pos[0], pos[2]) + 1.3);
      c = { pos, look: add(H(S, 0.2), o, 10), fov: 50, roll: id === 10 ? -0.04 : 0.03 };
      break;
    }
    case 12: {
      const P = MAX_START;
      c = { pos: lerp3([P[0] + 0.6, P[1] + 2.4, P[2] + 4.6], [P[0] + 0.5, P[1] + 2.2, P[2] + 3.9], u), look: [P[0], P[1] + 0.95, P[2]], fov: 42, roll: 0 };
      break;
    }
    default: {
      const S = pathAt(samS(13, t)), a0 = 2.35, a = a0 + 0.5 * glide(u * 1.1);
      const rad = lerp(6.5, 5.0, u);
      c = { pos: [S[0] + rad * Math.sin(a), S[1] + lerp(1.0, 1.6, u), S[2] + rad * Math.cos(a)], look: H(S, 1.25), fov: 44, roll: lerp(0.0, 0.06, glide((f - 662) / 20)) };
    }
  }
  c.roll += kickAt(f);
  return c;
};

/** lens blur per shot: cInf (px at 1080 wide) and the focus point */
export const dofAt = (f: number): { cInf: number; focus?: (f: number) => V3 } => {
  const id = shotAt(f).id, t = f / FPS;
  const head = (p: V3): V3 => H(p, 1.35);
  switch (id) {
    case 2: return { cInf: 11, focus: () => head(MAX_START) };
    case 3: return { cInf: 14, focus: () => head(MAX_START) };
    case 4: return { cInf: 10, focus: () => head(pathAt(samS(4, t))) };
    case 6: return { cInf: 11, focus: () => H(ROCK, 1.0) };
    case 7: return { cInf: 13, focus: () => H(ROCK, 1.3) };
    case 8: return { cInf: 10, focus: () => head(pathAt(samS(8, t))) };
    case 12: return { cInf: 8, focus: () => head(MAX_START) };
    case 13: return { cInf: 5, focus: () => head(pathAt(samS(13, t))) };
    default: return { cInf: 0 };
  }
};
