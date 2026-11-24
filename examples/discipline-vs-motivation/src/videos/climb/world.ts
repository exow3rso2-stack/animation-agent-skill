// The discipline short's world as one three.js scene: sky (5-stop shader), painted clouds, a grassy hill with a
// spiral dirt path and a summit flag, a village at its foot, cartoon trees and rocks, far blue hills, rain, and the
// cast. Look modules (shade / cardshade / lights / paint / build / ink) come unchanged from the bridge skill.
import * as THREE from "three";
import { getInputProps } from "remotion";
import { Batch, boxGeo, V, lam, house, prop, setSight, Ray } from "./build";
import { ctex, rng, grassHD, cloudHD, stoneHD, cobbleHD } from "./paint";
import { LIGHTS, LOOK, LightName } from "./lights";
import { TONE, CHAR, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, SHOTS, ShotDef, camAt, hill, C0, PATH_LEN, pathAt, outward, SUMMIT, ROCK, V3, MAX_START, SAM_START } from "./story";

const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const haloTex = () => ctex("sunHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});
/** painted dirt for the path: warm sand with darker pebbles and wheel-worn streaks */
const dirtTex = () => ctex("dirtHD", 512, 512, (g, r) => {
  g.fillStyle = "#cfa874"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) {
    const x = r() * 512, y = r() * 512, s = 2 + r() * 6, c = r() < 0.5 ? "rgba(140,100,60,0.35)" : "rgba(235,205,160,0.45)";
    for (const ox of [-512, 0, 512]) for (const oy of [-512, 0, 512]) { g.fillStyle = c; g.beginPath(); g.ellipse(x + ox, y + oy, s, s * 0.7, r() * 3, 0, 7); g.fill(); }
  }
  g.fillStyle = "rgba(120,85,50,0.18)"; g.fillRect(150, 0, 40, 512); g.fillRect(330, 0, 40, 512);
});
const flagTex = () => ctex("flagRed", 256, 160, (g) => {
  g.fillStyle = "#d8383a"; g.fillRect(0, 0, 256, 160);
  g.fillStyle = "#f7e9c8"; g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 22 : 52; g.lineTo(128 + r * Math.cos(a), 84 + r * Math.sin(a)); }
  g.fill();
});

/** every lens position of the film looking at its subject (houses and trees there are left out) */
const sightLines = (): Ray[] => {
  const out: Ray[] = [];
  for (const s of SHOTS) for (let f = s.a - 6; f < s.b + 6; f += 2) {
    const c = camAt(s.id, Math.max(0, f)), o = V(...c.pos), look = V(...c.look);
    const fw = look.clone().sub(o), len = fw.length();
    fw.normalize();
    const rt = fw.clone().cross(V(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
    const ty = Math.tan((c.fov * Math.PI) / 360), tx = ty * (9 / 16);
    for (const [sx, sy] of [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.6], [0, -0.4]])
      out.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len, core: sx === 0 && sy === 0 });
  }
  return out;
};

const PATH_W = 1.8;
const pathSamples = (() => { const a: V3[] = []; for (let s = -18; s <= PATH_LEN; s += 1) a.push(pathAt(s)); return a; })();
const nearPath = (x: number, z: number, r: number) => pathSamples.some((p) => (p[0] - x) ** 2 + (p[2] - z) ** 2 < r * r);

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<LightName, THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private flag: THREE.Mesh;
  private rain: THREE.InstancedMesh;
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor() {
    const R = this.root;
    // ---- sky + light ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, depthTest: true,
      transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5; this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    { const sm = (getInputProps() as { lite?: { shadow?: number } }).lite?.shadow ?? 4096; this.sun.shadow.mapSize.set(sm, sm); }
    R.add(this.hemi, this.sun, this.sun.target);
    this.cloudMaps = {
      day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)),
      rain: [0, 1, 2, 3].map((k) => cloudHD(k + 10, LOOK.rain.cloud)),
    };
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + 0.3, d = 600 + (i % 3) * 70;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 150 + (i % 4) * 35;
      m.position.set(Math.cos(a) * d, 110 + (i % 4) * 40, Math.sin(a) * d - 60); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- ground + hill ----
    setSight(sightLines());
    const grassM = lam("grassHD", () => ({ map: grassHD(), color: new THREE.Color(0.86, 0.9, 0.8) }));
    const plain = new THREE.PlaneGeometry(2400, 2400, 1, 1); plain.rotateX(-Math.PI / 2);
    const uvp = plain.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uvp.count; i++) uvp.setXY(i, uvp.getX(i) * 600, uvp.getY(i) * 600);
    const plainM = new THREE.Mesh(plain, grassM); plainM.position.y = -0.03; plainM.receiveShadow = true; R.add(plainM);
    const N = 280, SZ = 200;
    const hg = new THREE.PlaneGeometry(SZ, SZ, N, N); hg.rotateX(-Math.PI / 2); hg.translate(C0[0], 0, C0[2]);
    const hp = hg.attributes.position as THREE.BufferAttribute, huv = hg.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < hp.count; i++) {
      const x = hp.getX(i), z = hp.getZ(i);
      // the path is cut a little into the slope so the ribbon never sinks under the grass
      let y = hill(x, z);
      hp.setY(i, y);
      huv.setXY(i, huv.getX(i) * SZ / 4, huv.getY(i) * SZ / 4);
    }
    hg.computeVertexNormals();
    const hillM = new THREE.Mesh(hg, grassM); hillM.receiveShadow = true; hillM.castShadow = true; R.add(hillM);
    // ---- path ribbon (hugs the slope across its width) ----
    {
      const pos: number[] = [], uv: number[] = [], idx: number[] = [];
      const pts: V3[] = []; for (let s = -18; s <= PATH_LEN + 0.01; s += 0.5) pts.push(pathAt(Math.min(s, PATH_LEN)));
      pts.forEach((p, j) => {
        const q = pts[Math.min(pts.length - 1, j + 1)], o = pts[Math.max(0, j - 1)];
        let dx = q[0] - o[0], dz = q[2] - o[2]; const n = Math.hypot(dx, dz) || 1; dx /= n; dz /= n;
        const w = j > pts.length - 6 ? PATH_W * 1.6 : PATH_W;
        for (const sgn of [-1, 1]) {
          const x = p[0] - dz * sgn * w / 2, z = p[2] + dx * sgn * w / 2;
          pos.push(x, hill(x, z) + 0.07, z); uv.push(sgn < 0 ? 0 : 1, j * 0.5 / 2.4);
        }
        if (j) { const a = (j - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx); g.computeVertexNormals();
      // the ribbon is wound downward-facing in places: make sure all normals point up
      const nn = g.attributes.normal as THREE.BufferAttribute;
      for (let i = 0; i < nn.count; i++) if (nn.getY(i) < 0) nn.setXYZ(i, -nn.getX(i), -nn.getY(i), -nn.getZ(i));
      const pm = lam("path", () => ({ map: dirtTex(), side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      const m = new THREE.Mesh(g, pm); m.receiveShadow = true; R.add(m);
    }

    // ---- static batch: village, trees, rocks, far hills, summit ----
    const b = new Batch(), r = rng(7);
    // village square + houses in an arc at the hill's foot, fronts facing the hill
    const cob = lam("cobbleHD", () => ({ map: cobbleHD() }));
    const sq = new THREE.CircleGeometry(16, 40); sq.rotateX(-Math.PI / 2);
    const suv = sq.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < suv.count; i++) suv.setXY(i, suv.getX(i) * 8, suv.getY(i) * 8);
    b.add(sq, cob, new THREE.Matrix4().makeTranslation(0, 0.02, 18));
    let si = 0;
    for (const [ang, rad] of [[-62, 84], [-48, 88], [-34, 86], [-20, 92], [20, 92], [34, 86], [48, 88], [62, 84], [-55, 104], [-27, 108], [27, 108], [55, 104], [0, 112]] as const) {
      const a = (ang * Math.PI) / 180, x = C0[0] + rad * Math.sin(a), z = C0[2] + rad * Math.cos(a);
      const yaw = Math.atan2(C0[0] - x, C0[2] - z);
      house(b, x, z, yaw, [7, 9][si % 2], 8, [7, 8.4, 9.8][si % 3], si % 8, 0);
      si++;
    }
    // trees on the hill and around it (never on the path, never in front of a lens)
    for (let i = 0; i < 520; i++) {
      const a = r() * Math.PI * 2, d = 6 + Math.sqrt(r()) * 120;
      const x = C0[0] + d * Math.sin(a), z = C0[2] + d * Math.cos(a);
      if (nearPath(x, z, 4.2)) continue;
      if (Math.hypot(x - ROCK[0], z - ROCK[2]) < 5) continue;
      if (Math.hypot(x, z - 18) < 20) continue; // the village square
      if (d > 72 && d < 118 && Math.cos(a) > 0.2) continue; // the village ring
      const kind = d < 30 ? (r() < 0.6 ? "tree_cone" : "tree_oak") : r() < 0.3 ? "tree_fat" : r() < 0.6 ? "tree_oak" : r() < 0.8 ? "tree_cone" : "plant_bushLarge";
      prop(b, {}, kind, x, hill(x, z) - 0.15, z, kind.startsWith("plant") ? 1.6 : 4.5 + r() * 3, r() * 6);
    }
    // bushes along the trail head
    for (const [x, z] of [[-4.5, 2], [4.2, 1.2], [-5.5, -6], [5, -7.5]] as const) prop(b, {}, "plant_bushLarge", x, hill(x, z), z, 1.4, x);
    // rocks
    const rockM = lam("rockHD", () => ({ map: stoneHD("rockHD", ["#b9b2a6", "#aea79b", "#c4bdb1", "#a59e92"], "#8a8378") }));
    const rockG = (seed: number) => {
      const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position as THREE.BufferAttribute, rr = rng(seed);
      const o1 = rr() * 10, o2 = rr() * 10; // noise from position: shared corners move together (no cracks)
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 0.85 + 0.15 * Math.sin(x * 3.1 + o1) * Math.cos(z * 2.7 + y * 1.9 + o2); p.setXYZ(i, x * k, y * k * 0.85, z * k); }
      g.computeVertexNormals(); return g;
    };
    { const o = outward(ROCK); const rx = ROCK[0] - o[0] * 0.75, rz = ROCK[2] - o[2] * 0.75; b.add(rockG(3), rockM, new THREE.Matrix4().compose(V(rx, hill(rx, rz) - 0.1, rz), new THREE.Quaternion(), V(0.55, 0.6, 0.5))); }
    for (let i = 0; i < 70; i++) {
      const a = r() * Math.PI * 2, d = 4 + Math.sqrt(r()) * 70, x = C0[0] + d * Math.sin(a), z = C0[2] + d * Math.cos(a);
      if (nearPath(x, z, 2.2) || Math.hypot(x - ROCK[0], z - ROCK[2]) < 2.5) continue;
      if (Math.hypot(x - MAX_START[0], z - MAX_START[2]) < 4 || Math.hypot(x - SAM_START[0], z - SAM_START[2]) < 4) continue;
      const s = 0.3 + r() * 0.9;
      b.add(rockG(i + 11), rockM, new THREE.Matrix4().compose(V(x, hill(x, z) - 0.2 * s, z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), r() * 6), V(s, s, s)));
    }
    // far hills (fog turns them blue)
    const farM = lam("farHill", () => ({ color: "#6fa25a" }));
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + r() * 0.3, d = 480 + r() * 250, h = 45 + r() * 70, w = 120 + r() * 120;
      const g = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      b.add(g, farM, new THREE.Matrix4().compose(V(C0[0] + d * Math.sin(a), -2, C0[2] + d * Math.cos(a)), new THREE.Quaternion(), V(w, h, w * 0.8)));
    }
    // summit: a small cairn and the flag pole
    b.add(rockG(99), rockM, new THREE.Matrix4().compose(V(SUMMIT[0] - 0.9, SUMMIT[1] - 0.1, SUMMIT[2] - 0.5), new THREE.Quaternion(), V(0.7, 0.6, 0.7)));
    const poleM = lam("pole", () => ({ color: "#8a5a34" }));
    b.add(new THREE.CylinderGeometry(0.05, 0.06, 4.2, 10), poleM, new THREE.Matrix4().makeTranslation(SUMMIT[0] - 0.9, SUMMIT[1] + 2.1, SUMMIT[2] - 0.5));
    b.build(R);
    this.flag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.95, 12, 1), lam("flagRed", () => ({ map: flagTex(), side: THREE.DoubleSide })));
    this.flag.position.set(SUMMIT[0] - 0.9, SUMMIT[1] + 3.7, SUMMIT[2] - 0.5); this.flag.castShadow = true; this.flag.frustumCulled = false;
    R.add(this.flag);

    // ---- rain: thin streak quads around the camera (unlit, no ink) ----
    const rg = new THREE.PlaneGeometry(0.012, 0.5);
    const rm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.86, 0.9, 1.0), transparent: true, opacity: 0.3, depthWrite: false, fog: false });
    this.rain = new THREE.InstancedMesh(rg, rm, 900); this.rain.frustumCulled = false; this.rain.layers.set(NOINK); this.rain.renderOrder = 6;
    R.add(this.rain);
  }

  /** camera-relative sun, frozen per shot */
  private shotSun(id: number, s: ShotDef) {
    let v = this.sunCache.get(id);
    if (v) return v;
    const L = LIGHTS[s.light];
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(s.sunAz ?? L.az), el = THREE.MathUtils.degToRad(s.sunEl ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }
  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light], K = LOOK[s.light];
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig ----
    const sunDir = this.shotSun(id, s);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, sun disc, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
      m.position.y = s.light === "rain" ? 70 + (i % 4) * 22 : 110 + (i % 4) * 40;
      const w = (150 + (i % 4) * 35) * (s.light === "rain" ? 1.9 : 1);
      m.scale.set(w, w / 2, 1);
    }
    // ---- flag ----
    const fp = this.flag.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < fp.count; i++) {
      const u = (i % 13) / 12, y = i < 13 ? 0.475 : -0.475;
      fp.setXYZ(i, 0.75 - 0.75 + u * 1.5 - 0.0, y + 0.05 * u * Math.sin(t * 4 - u * 3), 0.22 * u * Math.sin(t * 5.5 - u * 5));
    }
    fp.needsUpdate = true;
    this.flag.position.x = SUMMIT[0] - 0.9 + 0.0;
    // ---- rain ----
    this.rain.visible = !!s.rain;
    if (s.rain) {
      const q = cam.quaternion, rr = rng(5), scl = V(1, 1, 1);
      const fwd = V(0, 0, -1).applyQuaternion(q), slant = new THREE.Quaternion().setFromAxisAngle(fwd, 0.12);
      const rq = slant.multiply(q.clone());
      for (let i = 0; i < this.rain.count; i++) {
        const d = 4 + 26 * rr() ** 1.2, ax = (rr() - 0.5) * 2, ay = rr(), sp = 9 + 4 * rr();
        const halfW = d * Math.tan((c.fov * Math.PI) / 360) * 0.6, halfH = d * Math.tan((c.fov * Math.PI) / 360) * 1.1;
        const yy = ((ay * 2 * halfH - sp * t) % (2 * halfH) + 2 * halfH) % (2 * halfH) - halfH;
        const right = V(1, 0, 0).applyQuaternion(q), upv = V(0, 1, 0).applyQuaternion(q);
        this.v.copy(cam.position).addScaledVector(fwd, d).addScaledVector(right, ax * halfW).addScaledVector(upv, yy);
        scl.set(1 + d * 0.05, 1 + d * 0.03, 1);
        this.rain.setMatrixAt(i, this.m4.compose(this.v, rq, scl));
      }
      this.rain.instanceMatrix.needsUpdate = true;
    }
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, t, { pos: cam.position, right, sun: sunDir });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    for (const p of st.places) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      const sc2 = p.scale ?? 1;
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      a.mesh.castShadow = L.actorShadow;
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft);
      e.mesh.visible = true;
      e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (let i = 0; i < ai; i++) this.actors[i].bind();
    for (let i = 0; i < fi; i++) this.fxs[i].bind();
    return focus;
  }
}
