/* Shared 3D studio + helpers used by every scene (same look as 机械拆解实验室). */
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';


export const D2R = Math.PI / 180, TAU = Math.PI * 2;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (x) => { x = clamp(x, 0, 1); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const $ = (id) => document.getElementById(id);
export const C = {ink: '#16181b', mute: '#8b8f95', faint: '#c9ccd0', line: '#e1e3e6', red: '#d6182b', blue: '#3d8fe0', grey: '#5d6670', orange: '#f05a23', green: '#2f9e6a', pink: '#eba4ab'};
export const f0 = (x) => String(Math.round(x)), f1 = (x) => (Math.round(x * 10) / 10).toFixed(1), f2 = (x) => (Math.round(x * 100) / 100).toFixed(2);
export const coarse = matchMedia('(pointer: coarse)').matches;
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------- renderer & studio */
export const canvas = $('gl'), stageEl = $('stage');
export const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.6 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
export const scene = new THREE.Scene();
{
  const c = document.createElement('canvas'); c.width = 4; c.height = 512;
  const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#f3f3f4'); gr.addColorStop(.55, '#e9eaec'); gr.addColorStop(1, '#e3e4e6');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 512);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; scene.background = tex;
}
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
export const camera = new THREE.PerspectiveCamera(36, 1, 5, 30000);
export const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = .08; controls.minDistance = 120; controls.maxDistance = 5000;
controls.maxPolarAngle = Math.PI * .495;
scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa0a8, .7));
export const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
keyLight.position.set(500, 1600, 700); keyLight.castShadow = true;
keyLight.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
Object.assign(keyLight.shadow.camera, {left: -1000, right: 1000, top: 1000, bottom: -1000, near: 100, far: 4500});
keyLight.shadow.bias = -0.0004; keyLight.shadow.radius = 6;
scene.add(keyLight);
const fillL = new THREE.DirectionalLight(0xffffff, .5); fillL.position.set(-900, 500, -300); scene.add(fillL);
export const ground = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.ShadowMaterial({color: 0x5d636c, opacity: .26}));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

/* ---------------------------------------------------------------- materials */
const std = (color, metalness, roughness) => new THREE.MeshStandardMaterial({color, metalness, roughness, envMapIntensity: .8});
const phys = (o) => new THREE.MeshPhysicalMaterial(o);
export {phys, std};
export const MAT = {
  steel: () => std(0xcfd2d6, 1, .3), alu: () => std(0xd9dbdf, .85, .45), brass: () => std(0xb98a55, .9, .35), copper: () => std(0xb87333, .9, .38),
  dark: () => phys({color: 0x141518, roughness: .45, metalness: .2, clearcoat: .7, clearcoatRoughness: .2}),
  white: () => phys({color: 0xf3f0ea, roughness: .4, metalness: 0, clearcoat: .6}),
  grey: () => phys({color: 0x9aa0a8, roughness: .5, metalness: .1, clearcoat: .3}),
  red: () => phys({color: C.red, roughness: .4, metalness: .1, clearcoat: .6}),
  col: (c, o = {}) => phys({color: c, roughness: .45, metalness: 0, clearcoat: .4, ...o}),
  wood: () => phys({color: 0xc8a27a, roughness: .7, metalness: 0}),
  glass: (op = .16) => phys({color: 0xffffff, roughness: .05, metalness: 0, transparent: true, opacity: op, depthWrite: false, envMapIntensity: 1.6, side: THREE.DoubleSide}),
  water: (op = .38) => phys({color: 0x8fc4ee, roughness: .1, metalness: 0, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide, clearcoat: 1}),
  glow: (c) => new THREE.MeshBasicMaterial({color: c, toneMapped: false}),
  fade: (c, op = .5) => new THREE.MeshBasicMaterial({color: c, transparent: true, opacity: op, depthWrite: false, toneMapped: false}),
};
export const UP = new THREE.Vector3(0, 1, 0);
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export function mesh(geo, mat, cast = true) { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; return m; }
export const G = () => new THREE.Group();
export const box = (w, h, d, m, cast) => mesh(new THREE.BoxGeometry(w, h, d), m, cast);
export const cyl = (r1, r2, h, m, seg = 32, cast) => mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m, cast);
export const sph = (r, m, seg = 24, cast) => mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * .7)), m, cast);
export const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 10, 1, false);
export function stretch(m, a, b, r) {
  const d = new THREE.Vector3().subVectors(b, a), L = d.length();
  m.position.copy(a).add(b).multiplyScalar(.5);
  m.scale.set(r, Math.max(L, 1e-3), r);
  if (L > 1e-6) m.quaternion.setFromUnitVectors(UP, d.divideScalar(L));
  m.visible = L > 1e-3;
}
/* a thin solid line segment (cylinder) */
export function rod(mat, r = 1.5) { const m = new THREE.Mesh(unitCyl, mat); m.r = r; m.set = (a, b) => stretch(m, a, b, m.r); return m; }
/* an arrow: shaft + cone, set(from, vector) */
const coneG = new THREE.ConeGeometry(1, 1, 16);
export function arrow(color, r = 3) {
  const g = G(), m = MAT.glow(color), s = new THREE.Mesh(unitCyl, m), h = new THREE.Mesh(coneG, m);
  g.add(s, h);
  g.set = (from, vec) => {
    const L = vec.length(); g.visible = L > .5; if (!g.visible) return;
    const hl = Math.min(r * 4.5, L * .5), dir = vec.clone().divideScalar(L);
    stretch(s, from, from.clone().addScaledVector(dir, L - hl), r);
    h.scale.set(r * 2.4, hl, r * 2.4); h.position.copy(from).addScaledVector(dir, L - hl / 2); h.quaternion.setFromUnitVectors(UP, dir);
  };
  g.mat = m; return g;
}
export function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += pts[i].distanceTo(pts[i - 1]); return L; }
export function polyAt(pts, s, out) {
  for (let i = 1; i < pts.length; i++) {
    const l = pts[i].distanceTo(pts[i - 1]);
    if (s <= l || i === pts.length - 1) return out.lerpVectors(pts[i - 1], pts[i], l ? clamp(s / l, 0, 1) : 0);
    s -= l;
  }
  return out.copy(pts[0]);
}
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.redraw = (fn) => { g.clearRect(0, 0, w, h); fn(g, w, h); t.needsUpdate = true; }; return t;
}
export const FONT = (w, px) => `${w} ${px}px Inter, "Noto Sans SC", system-ui, sans-serif`;
/* flat text plate (billboard optional) */
export function textPlate(text, {h = 30, color = C.ink, bg = null, weight = 700, px = 64, billboard = false} = {}) {
  const lines = String(text).split('\n');
  const mc = document.createElement('canvas').getContext('2d'); mc.font = FONT(weight, px);
  const w = Math.ceil(Math.max(...lines.map((l) => mc.measureText(l).width)) + px * .6), ch = Math.ceil(px * 1.3 * lines.length + px * .3);
  const tex = canvasTex(w, ch, (g) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, ch); }
    g.font = FONT(weight, px); g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((l, i) => g.fillText(l, w / 2, px * .65 + px * 1.3 * i + px * .2));
  });
  const mat = new THREE.MeshBasicMaterial({map: tex, transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide});
  const sc = h * lines.length;
  const m = billboard ? new THREE.Sprite(new THREE.SpriteMaterial({map: tex, transparent: true, toneMapped: false, depthWrite: false})) : new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  m.scale.set(sc * w / ch, sc, 1); m.renderOrder = 6; return m;
}
let rng = 12345;
export const rand = () => (rng = (rng * 16807) % 2147483647) / 2147483647;
export const randn = () => { let u = 0, v = 0; while (!u) u = rand(); v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
/* table top the experiments sit on */
export function bench(w = 1400, d = 700, y = 0) {
  const g = G();
  const top = box(w, 24, d, MAT.white()); top.position.y = y - 12; g.add(top);
  return g;
}
/* liquid column in a cylinder of radius r, level h (updated via set) */
export function liquid(r, mat = MAT.water()) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 40), mat); m.renderOrder = 3;
  m.set = (y0, h) => { m.scale.y = Math.max(h, .01); m.position.y = y0 + h / 2; }; return m;
}
/* helical spring along +y, unit length; scale.y sets length */
export function spring(R = 10, turns = 12, r = 1.6, mat = MAT.steel()) {
  const pts = []; for (let i = 0; i <= turns * 24; i++) { const a = i / 24 * TAU; pts.push(V(Math.cos(a) * R, i / (turns * 24), Math.sin(a) * R)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  const m = mesh(new THREE.TubeGeometry(curve, turns * 24, r, 6, false), mat);
  return m;
}

/* ---------------------------------------------------------------- HTML tags pinned to 3D points */
const tagsEl = $('tags');
export function makeTag(text, sub, red) {
  const el = document.createElement('div'); el.className = 'tag' + (red ? ' red' : '');
  el.innerHTML = text + (sub ? `<small>${sub}</small>` : ''); tagsEl.appendChild(el); el.hidden = true;
  return {el, p: new THREE.Vector3(), on: true, below: false, set(t, s) { const h = t + (s ? `<small>${s}</small>` : ''); if (h !== this._h) { el.innerHTML = h; this._h = h; } }};
}

/* ---------------------------------------------------------------- tiny SVG chart */
export function chartSvg(c) {
  const W = 232, H = 132, L = 28, Rr = 6, T = 8, Bm = 20;
  const X = (x) => L + (x - c.x0) / (c.x1 - c.x0) * (W - L - Rr), Y = (y) => T + (1 - (y - c.y0) / (c.y1 - c.y0)) * (H - T - Bm);
  const line = (path, col, w = 1.5, dash = '') => { let d = '', pen = false; for (const p of path) { if (!p) { pen = false; continue; } d += (pen ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); pen = true; } return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`; };
  let s = `<line x1="${L}" y1="${H - Bm}" x2="${W - Rr}" y2="${H - Bm}" stroke="${C.faint}"/><line x1="${L}" y1="${T}" x2="${L}" y2="${H - Bm}" stroke="${C.faint}"/>`;
  for (const [y, t] of c.hl || []) { s += `<line x1="${L}" x2="${W - Rr}" y1="${Y(y)}" y2="${Y(y)}" stroke="${C.line}" stroke-dasharray="3 3"/>`; if (t) s += `<text x="${W - Rr}" y="${Y(y) - 3}" font-size="8.4" fill="${C.mute}" text-anchor="end">${t}</text>`; }
  for (const [x, t] of c.vl || []) { s += `<line y1="${T}" y2="${H - Bm}" x1="${X(x)}" x2="${X(x)}" stroke="${C.line}" stroke-dasharray="3 3"/><text x="${X(x)}" y="${H - Bm + 10}" font-size="8.4" fill="${C.mute}" text-anchor="middle">${t}</text>`; }
  s += `<text x="${W - Rr}" y="${H - 2}" font-size="8.4" fill="${C.mute}" text-anchor="end">${c.xl}</text><text x="${L + 5}" y="${T + 6}" font-size="8.4" fill="${C.mute}">${c.yl}</text>`;
  s += `<text x="${L - 3}" y="${Y(c.y0) + 3}" font-size="8" fill="${C.mute}" text-anchor="end">${c.y0}</text><text x="${L - 3}" y="${Y(c.y1) + 6}" font-size="8" fill="${C.mute}" text-anchor="end">${c.y1}</text>`;
  if (c.bars) { const bw = (W - L - Rr) / c.bars.length * .62; c.bars.forEach(([x, y, col, lab]) => { s += `<rect x="${X(x) - bw / 2}" y="${Y(Math.max(y, c.y0))}" width="${bw}" height="${Math.max(0, Y(c.y0) - Y(y))}" fill="${col || C.ink}"/>`; if (lab) s += `<text x="${X(x)}" y="${H - Bm + 10}" font-size="8" fill="${C.mute}" text-anchor="middle">${lab}</text>`; }); }
  for (const p of c.paths || []) s += line(p.pts, p.c || C.ink, p.w || 1.5, p.dash);
  if (c.path) s += line(c.path, C.ink);
  for (const d of c.dots || []) s += `<circle cx="${X(d[0])}" cy="${Y(d[1])}" r="3" fill="none" stroke="${C.red}" stroke-width="1.3"/>`;
  if (c.pt) s += `<line x1="${X(c.pt[0])}" x2="${X(c.pt[0])}" y1="${Y(c.pt[1])}" y2="${H - Bm}" stroke="${C.red}" stroke-width=".8"/><circle cx="${X(c.pt[0])}" cy="${Y(c.pt[1])}" r="3.6" fill="${C.red}"/>`;
  return s;
}
export const curve = (f, a, b, n = 120) => { const p = []; for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n, y = f(x); p.push(y === null || !isFinite(y) ? null : [x, y]); } return p; };
