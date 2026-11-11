/* The case world: the school grounds (lab building, ecological pond, guard room, a clock tower far behind), three interior
   sets far off to the side, and the four people. The look is soft and atmospheric: a painted sky dome with clouds and stars,
   layered hills fading into fog, warm lamps against cool moonlight, rim-lit characters, drifting motes and fireflies.
   A "mood" (night / dawn / gold / indoor) drives sky, fog and light together. */
import * as THREE from 'three';
import {G, V, TAU, mesh, box, cyl, sph, rod, canvasTex, textPlate, clamp, keyLight, coarse, scene} from '../../kit.js';

const C3 = (h) => new THREE.Color(h);
const RIM = {value: new THREE.Color(0x9fc0ff)}; // shared by every rim-lit material, set by the mood
/* matte material; with `rim` it gets a soft glowing edge facing away from the camera */
function soft(color, {rim = 0, rough = .9, ...o} = {}) {
  const m = new THREE.MeshStandardMaterial({color, roughness: rough, metalness: 0, ...o});
  if (rim) {
    m.onBeforeCompile = (s) => {
      s.uniforms.uRim = RIM;
      s.fragmentShader = 'uniform vec3 uRim;\n' + s.fragmentShader.replace('#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>\n float rimF = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), 2.6);\n rimF *= .35 + .65 * clamp(dot(normal, (viewMatrix * vec4(0., 1., 0., 0.)).xyz) * .6 + .5, 0., 1.);\n totalEmissiveRadiance += uRim * rimF * (diffuseColor.rgb * .65 + .22) * ${rim.toFixed(2)};`);
    };
    m.customProgramCacheKey = () => 'rim' + rim.toFixed(2);
  }
  return m;
}
/* shiny things keep the studio reflections even though the world turns the scene environment off */
let ENV = null;
const metal = (color, rough = .3, o = {}) => new THREE.MeshStandardMaterial({color, metalness: .9, roughness: rough, envMap: ENV, envMapIntensity: .4, ...o});
const hdr = (hex, k = 1) => { const m = new THREE.MeshBasicMaterial({color: C3(hex).multiplyScalar(k), toneMapped: false}); m.userData.base = C3(hex).multiplyScalar(k); return m; };
const add = (hex, op = .5, map = null) => new THREE.MeshBasicMaterial({color: hex, map, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide, fog: false});
const radial = canvasTex(128, 128, (c) => { const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); });
const shaftTex = canvasTex(64, 256, (c) => { const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 256); const h = c.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(.5, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)'); c.globalCompositeOperation = 'destination-out'; c.fillStyle = h; c.fillRect(0, 0, 64, 256); });
const lathe = (pts, seg = 24) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
const capsule = (r, len, m) => mesh(new THREE.CapsuleGeometry(r, len, 6, 14), m);
const blob = (r, m, d = 1) => mesh(new THREE.IcosahedronGeometry(r, d), m);

/* ------------------------------------------------------------ moods */
const N = (x, y, z) => new THREE.Vector3(x, y, z).normalize();
const MOODS = {
  night: {top: 0x070b26, mid: 0x1c2c72, hor: 0x6377cc, sun: N(.72, .4, -.56), sunCol: 0xe6eeff, disc: .99915, halo: .9, stars: 1, cloud: 0x93a6ea, cloudDk: 0x27327a, cloudAmt: .85,
    fog: 0x3e4f9c, fogK: .00021, key: 0xa9c1ff, keyI: 1.7, keyDir: N(.72, .62, .25), hemiS: 0x5870d0, hemiG: 0x2a2448, hemiI: 1.25, lamp: 1, rim: 0xb4ccff, rimK: 1.5, exp: 1.12, bloom: .8, hill: 0x1b2456},
  dawn: {top: 0x3b62c0, mid: 0x9bb6ee, hor: 0xffd3ac, sun: N(-.78, .16, -.6), sunCol: 0xffe2b4, disc: .9989, halo: 1.5, stars: 0, cloud: 0xffe9d6, cloudDk: 0xc59dbe, cloudAmt: .9,
    fog: 0xf0cdbf, fogK: .0002, key: 0xffd2a4, keyI: 2.5, keyDir: N(-.7, .42, .58), hemiS: 0xa9c4ff, hemiG: 0x8a6f72, hemiI: 1.25, lamp: .12, rim: 0xffd9b0, exp: 1, bloom: .5, hill: 0x7c88c8},
  gold: {top: 0x4468c0, mid: 0xf1c3ae, hor: 0xffd596, sun: N(-.66, .17, -.73), sunCol: 0xffdca6, disc: .9988, halo: 1.6, stars: 0, cloud: 0xffe6c8, cloudDk: 0xc98aa4, cloudAmt: .9,
    fog: 0xf2c3a6, fogK: .00017, key: 0xffcb94, keyI: 2.9, keyDir: N(-.62, .36, .6), hemiS: 0xb9b8f2, hemiG: 0x9c806c, hemiI: 1.15, lamp: .22, rim: 0xffdba6, rimK: 1.2, exp: 1, bloom: .55, hill: 0x8e74b2},
  indoor: {top: 0x04060e, mid: 0x070a18, hor: 0x0b1024, sun: N(.5, .6, -.6), sunCol: 0x000000, disc: 2, halo: 0, stars: 0, cloud: 0x000000, cloudDk: 0x000000, cloudAmt: 0,
    fog: 0x0b1026, fogK: .00016, key: 0x9db8ff, keyI: .9, keyDir: N(.55, .7, .45), hemiS: 0x6a7cc0, hemiG: 0x3a2f2c, hemiI: .95, lamp: 1, rim: 0x9fc0ff, exp: 1.12, bloom: .8, hill: 0x000000},
};

function makeSky() {
  const u = {uTop: {value: C3(0)}, uMid: {value: C3(0)}, uHor: {value: C3(0)}, uSun: {value: N(0, 1, 0)}, uSunCol: {value: C3(0)}, uCloud: {value: C3(0)}, uCloudDk: {value: C3(0)},
    uT: {value: 0}, uStars: {value: 0}, uHalo: {value: 0}, uCloudAmt: {value: 0}, uDisc: {value: .999}};
  const m = new THREE.ShaderMaterial({uniforms: u, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `precision highp float; varying vec3 vDir;
      uniform vec3 uTop, uMid, uHor, uSun, uSunCol, uCloud, uCloudDk; uniform float uT, uStars, uHalo, uCloudAmt, uDisc;
      float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float h31(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
      float ns(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++) { s += a * ns(p); p = p * 2.03 + 7.1; a *= .5; } return s; }
      void main(){
        vec3 d = normalize(vDir); float h = d.y;
        vec3 col = mix(uHor, uMid, smoothstep(0., .3, h)); col = mix(col, uTop, smoothstep(.22, .9, h));
        col = mix(col, uHor * .75, smoothstep(0., -.3, h));
        float sd = max(dot(d, uSun), 0.);
        if (uStars > 0.) { vec3 q = d * 170.; float r = h31(floor(q)); float tw = .55 + .45 * sin(uT * (1.5 + r * 3.) + r * 90.);
          col += vec3(.85, .9, 1.) * step(.9955, r) * smoothstep(.45, .05, length(fract(q) - .5)) * tw * uStars * smoothstep(.02, .3, h) * 1.6; }
        col += uSunCol * (pow(sd, 5.) * .16 + pow(sd, 40.) * .35 + pow(sd, 400.) * .6) * uHalo;
        col = mix(col, uSunCol * 2.2, smoothstep(uDisc, uDisc + .0005, sd));
        if (uCloudAmt > 0. && h > -.04) {
          vec2 uv = d.xz / (h + .16) * .9 + vec2(uT * .006, uT * .002);
          float c = fbm(uv * 1.3), c2 = fbm(uv * 1.3 + uSun.xz * .22);
          float a = smoothstep(.47, .8, c) * uCloudAmt * smoothstep(-.04, .16, h);
          vec3 cc = mix(uCloudDk, uCloud, smoothstep(.35, .75, c2 + (c - c2) * 2.)) + uSunCol * pow(sd, 6.) * .5 * uHalo;
          col = mix(col, cc, a * .9);
        }
        gl_FragColor = vec4(col, 1.);
      }`});
  const s = new THREE.Mesh(new THREE.SphereGeometry(14000, 48, 24), m); s.frustumCulled = false; s.renderOrder = -10;
  return s;
}
function makeWater(w, d) {
  const u = {uT: {value: 0}, uDeep: {value: C3(0x0c2f5e)}, uSky: {value: C3(0)}, uLight: {value: C3(0)}, uL: {value: N(0, 1, 0)}};
  const m = new THREE.ShaderMaterial({uniforms: u, transparent: true, depthWrite: false,
    vertexShader: 'varying vec3 vW; void main(){ vec4 p = modelMatrix * vec4(position, 1.0); vW = p.xyz; gl_Position = projectionMatrix * viewMatrix * p; }',
    fragmentShader: `precision highp float; varying vec3 vW; uniform float uT; uniform vec3 uDeep, uSky, uLight, uL;
      void main(){
        vec2 p = vW.xz * .03; float t = uT;
        float dx = cos(p.x * 1.3 + t * .9) * 1.3 + cos((p.x + p.y) * 2.3 + t * 1.2) * 2.3 + cos(p.x * 5.1 - t * 1.9) * sin(p.y * 4.3 + t * 1.4) * 2.5;
        float dz = cos(p.y * 1.7 - t * .7) * 1.7 + cos((p.x + p.y) * 2.3 + t * 1.2) * 2.3 + sin(p.x * 5.1 - t * 1.9) * cos(p.y * 4.3 + t * 1.4) * 2.1;
        vec3 n = normalize(vec3(-dx * .026, 1., -dz * .026));
        vec3 v = normalize(cameraPosition - vW);
        float fr = pow(1. - max(dot(v, n), 0.), 3.);
        vec3 col = mix(uDeep, uSky, clamp(fr * .95 + .1, 0., 1.));
        float sp = pow(max(dot(reflect(-uL, n), v), 0.), 90.);
        col += uLight * sp * 1.6 + uLight * pow(max(dot(reflect(-uL, n), v), 0.), 8.) * .05;
        gl_FragColor = vec4(col, mix(.42, .95, fr));
      }`});
  const wm = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); wm.rotation.x = -Math.PI / 2; wm.renderOrder = 3;
  return wm;
}

/* ------------------------------------------------------------ people */
/* quiet, simple figures about 170 tall: a round head with two eyes and nothing else, a one-piece tunic, slim limbs, and a
   cape that hangs from the collar and moves all the time. Each person is told apart by colour, height and one shape
   (a peaked cap, a ponytail, spiky hair, a long cape). */
const HIP = 70, SH = 118, HEAD = 147;
function person(o) {
  const p = G(), body = G(); p.add(body); body.scale.setScalar(o.h || 1);
  const R = 1.6, wd = o.wide || 1, mk = (c, x = {}) => soft(c, {rim: R, ...x});
  const skin = mk(o.skin || 0xf3d2bc), top = mk(o.top, {side: THREE.DoubleSide}), bot = mk(o.bot || 0x2f3a66), hair = mk(o.hair || 0x2a2024, {rough: .7});
  const capeM = mk(0xffffff, {side: THREE.DoubleSide, emissive: o.cape, emissiveIntensity: .12, rough: .8, vertexColors: true}), capeC = C3(o.cape), collarM = mk(o.cape, {emissive: o.cape, emissiveIntensity: .12});
  const u = {legs: null, arms: null, head: null, body, eyes: [], sway: [], capes: [], t: Math.random() * 10, walk: 0, talk: 0, blink: 2 + Math.random() * 3, flow: [], h: o.h || 1, wd};
  u.legs = [-1, 1].map((s) => {
    const l = G(); l.position.set(s * 6.6 * wd, HIP, 0);
    l.add(mesh(lathe([[0, 2], [5.8, 0], [4.6, -34], [4, -62], [0, -64]], 12), bot));
    const ft = sph(5.4, bot, 12); ft.scale.set(.95, .6, 1.6); ft.position.set(0, -66, 3.6); l.add(ft);
    body.add(l); return l;
  });
  /* the tunic: shoulders to mid-thigh (or the knee), open at the hem */
  const hem = o.long ? HIP - 30 : HIP - 6;
  const tunic = mesh(lathe([[0, SH + 11], [5.4, SH + 10.4], [11.2, SH + 7], [14.4, SH], [13.6, SH - 12], [13.6, HIP + 22], [15.8, HIP + 4], [o.long ? 21 : 17.6, hem]], 28), top); tunic.scale.set(wd, 1, .76); body.add(tunic); u.sway.push(tunic);
  u.arms = [-1, 1].map((s) => {
    const a = G(); a.position.set(s * (14.4 * wd + 3.4), SH + 2.5, 0); a.rotation.z = s * .12;
    const up = capsule(4, 20, top); up.position.y = -12; a.add(up);
    const fore = G(); fore.position.y = -24; fore.rotation.x = -.18; a.add(fore);
    const lo = mesh(lathe([[0, 2], [4, 0], [3.3, -22], [0, -24]], 12), top); fore.add(lo);
    const hd = sph(4.2, skin, 12); hd.position.y = -25.5; fore.add(hd);
    a.userData.fore = fore; body.add(a); return a;
  });
  const neck = cyl(4, 4.6, 10, skin, 12); neck.position.y = SH + 13; body.add(neck);
  const collar = mesh(new THREE.TorusGeometry(7.6, 3.3, 10, 26), collarM); collar.rotation.x = Math.PI / 2 + .1; collar.scale.set(1.06, .95, 1); collar.position.set(0, SH + 11, .4); body.add(collar);
  /* head: only the eyes */
  const head = G(); head.position.y = HEAD; body.add(head); u.head = head;
  const skull = sph(20, skin, 32); skull.scale.set(1, .97, .96); head.add(skull);
  const eyeM = new THREE.MeshBasicMaterial({color: 0x2b2233}), glintM = hdr(0xffffff, 1.2);
  for (const s of [-1, 1]) {
    const e = G(); e.position.set(s * 7, -2.6, 17.5); e.rotation.y = s * .34; head.add(e); u.eyes.push(e);
    const ball = sph(2.5, eyeM, 14, false); ball.scale.set(1, 1.55, .42); e.add(ball);
    const gl = sph(.8, glintM, 8, false); gl.position.set(.8, 1.7, 1); e.add(gl);
  }
  const hc = mesh(new THREE.SphereGeometry(21.2, 30, 18, 0, TAU, 0, Math.PI * (o.hairLen || .55)), hair); hc.rotation.x = -.34; head.add(hc);
  const lock = (x, y, z, rx, ry, rz, sx = 1, sy = 1, sz = 1, r = 7) => { const b = sph(r, hair, 14); b.position.set(x, y, z); b.rotation.set(rx, ry, rz); b.scale.set(sx, sy, sz); head.add(b); return b; };
  /* the cape: a sheet hung behind the shoulders; its vertices are moved every frame */
  const cape = (len, flare = 31, spread = 1.45) => {
    const C = 12, Rn = 8, g = new THREE.PlaneGeometry(1, 1, C, Rn), col = new Float32Array((C + 1) * (Rn + 1) * 3);
    for (let j = 0; j <= Rn; j++) for (let i = 0; i <= C; i++) { const k = j / Rn, f = .8 + .3 * k + (j === Rn ? .12 : 0); col.set([capeC.r * f, capeC.g * f, capeC.b * f], (j * (C + 1) + i) * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, capeM); m.castShadow = true; m.frustumCulled = false; body.add(m); u.capes.push({m, len, spread, flare, C, Rn, ph: Math.random() * 6});
  };

  if (o.role === 'guard') {
    const capM = mk(0x25315c);
    const band = cyl(18.2, 19, 7, capM, 28); band.position.y = 12; head.add(band);
    const crown = cyl(23, 19, 6, capM, 28); crown.position.y = 18.5; head.add(crown);
    const capTop = sph(23, capM, 24); capTop.scale.set(1, .16, 1); capTop.position.y = 21.5; head.add(capTop);
    const visor = sph(15, soft(0x151a30, {rough: .5}), 18); visor.scale.set(1.15, .12, .8); visor.position.set(0, 9.2, 17); head.add(visor);
    const torch = cyl(2.4, 3.2, 15, soft(0x20222c), 12); torch.rotation.x = Math.PI / 2; torch.position.set(0, -26, 6); u.arms[1].userData.fore.add(torch);
    cape(72, 32);
  }
  if (o.role === 'girl') {
    lock(0, 9.5, 15, .25, 0, 0, 2.5, .9, .7, 7);
    let g = head; for (let i = 0; i < 3; i++) { const j = G(); j.position.set(0, i ? -15 : 9, i ? 0 : -19); g.add(j); const m = capsule(5.2 * (1 - i * .18), 10, hair); m.position.y = -7.5; j.add(m); u.flow.push({o: j, ax: 'x', base: i ? .2 : .45, amp: .16, sp: 2.1, ph: i * .9}); g = j; }
    cape(66, 30);
  }
  if (o.role === 'boy') {
    for (const [x, y, z, rx, rz, sc] of [[-8, 18, 5, .45, .5, 1.1], [1, 21, 2, .15, 0, 1.3], [10, 18, 4, .4, -.55, 1.1], [0, 15, 15, 1.1, 0, 1]]) { const tf = mesh(new THREE.ConeGeometry(7 * sc, 15 * sc, 8), hair); tf.position.set(x, y, z); tf.rotation.set(rx, 0, rz); head.add(tf); }
    cape(66, 30);
  }
  if (o.role === 'lead') {
    lock(-3, 12, 14.4, .3, 0, .22, 2.5, .7, .7, 7);
    cape(104, 36);
  }
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshBasicMaterial({map: radial, color: 0x0a0a30, transparent: true, opacity: .4, depthWrite: false})); sh.rotation.x = -Math.PI / 2; sh.position.y = .9; sh.renderOrder = 2; p.add(sh);
  p.userData = u;
  return p;
}
function animPerson(p, dt) {
  const u = p.userData; u.t += dt;
  const w = u.walk, s = Math.sin(u.t * 7.5), tk = u.talk, t = u.t;
  u.legs[0].rotation.x = s * .6 * w; u.legs[1].rotation.x = -s * .6 * w;
  u.arms[0].rotation.x = -s * .5 * w + (u.armL || 0) + Math.sin(t * 1.1) * .04 - tk * .1 * (1 + Math.sin(t * 2.3 + 1));
  u.arms[1].rotation.x = s * .5 * w + (u.armR || 0) - Math.sin(t * 1.1) * .04 - tk * (.34 + Math.sin(t * 3.1) * .2);
  u.arms[1].userData.fore.rotation.x = -.18 - tk * (.75 + Math.sin(t * 3.1 + .6) * .3) - w * .3;
  u.arms[0].userData.fore.rotation.x = -.18 - tk * .25 - w * .3;
  u.body.position.y = Math.abs(s) * 2.6 * w + Math.sin(t * 1.5) * .9 + tk * Math.abs(Math.sin(t * 4.3)) * .8;
  u.body.rotation.x = w * .07; u.body.rotation.z = Math.sin(t * .7) * .014;
  u.head.rotation.y = (u.look || 0) + Math.sin(t * .6) * .09 + tk * Math.sin(t * 1.7) * .08;
  u.head.rotation.x = Math.sin(t * 5.4) * .06 * tk + Math.sin(t * .9) * .025 + (u.nod || 0);
  u.head.rotation.z = Math.sin(t * .5 + 1) * .04 + tk * Math.sin(t * 2.6) * .03;
  u.blink -= dt; const bl = u.blink < .13 ? .1 : 1; if (u.blink < 0) u.blink = 2.2 + Math.random() * 3.5;
  for (const e of u.eyes) e.scale.y = bl;
  for (const c of u.sway) { c.rotation.x = Math.sin(t * 1.3) * .02 - w * .05; }
  for (const f of u.flow) f.o.rotation[f.ax] = f.base + Math.sin(t * f.sp - (f.ph || 0)) * f.amp + w * .28;
  for (const c of u.capes) {
    const a = c.m.geometry.attributes.position, amp = 1 + w * 1.6 + tk * .3;
    for (let j = 0; j <= c.Rn; j++) for (let i = 0; i <= c.C; i++) {
      const k = j / c.Rn, ang = (i / c.C - .5) * 2 * c.spread, r = 15 + (c.flare - 15) * Math.pow(k, .7) + Math.sin(ang * 4.5) * 1.6 * k + Math.sin(t * 2.3 - k * 4.4 + ang * 1.6 + c.ph) * k * 3.2 * amp;
      const back = k * k * c.len * (.16 + w * .42) + Math.sin(t * 1.5 - k * 3 + c.ph) * k * 3;
      a.setXYZ(j * (c.C + 1) + i, Math.sin(ang) * r * u.wd + Math.sin(t * 1.1 + c.ph) * k * 2.5, SH + 8 - k * c.len * (1 - w * .2), -Math.cos(ang) * r * .86 - back);
    }
    a.needsUpdate = true; c.m.geometry.computeVertexNormals();
  }
}
function trophy() {
  const t = G(), gold = metal(0xe9c46a, .28);
  const base = mesh(lathe([[0, 0], [11, 0], [11, 2.5], [8, 5], [4, 7], [2.8, 15], [5, 17.5], [0, 18]], 28), gold); t.add(base);
  const cr = new THREE.Mesh(new THREE.OctahedronGeometry(9, 0), new THREE.MeshPhysicalMaterial({color: 0xd8f6ff, transparent: true, opacity: .62, roughness: .02, metalness: 0, clearcoat: 1, emissive: 0x3aa0c8, emissiveIntensity: .5, envMap: ENV, envMapIntensity: 1.2}));
  cr.scale.set(1, 1.7, 1); cr.position.y = 32; t.add(cr);
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(3.6, 0), hdr(0xa8f2ff, 1.7)); core.scale.set(1, 1.7, 1); core.position.y = 32; t.add(core);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({map: radial, color: 0x7fe6ff, transparent: true, opacity: .3, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false})); halo.scale.set(64, 64, 1); halo.position.y = 32; t.add(halo);
  t.userData.cr = cr; return t;
}
function tree(s = 1, tone = 0) {
  const t = G(), bark = soft(0x6b5a55), leaf = [soft(0x4f9a7c), soft(0x3f8a78), soft(0x66ad84)];
  const trunk = mesh(lathe([[13, 0], [9, 40], [7, 130], [5, 190]], 10), bark); t.add(trunk);
  const crown = G(); crown.position.y = 210; t.add(crown);
  for (const [x, y, z, r] of [[0, 30, 0, 100], [-70, -10, 20, 72], [66, 0, -18, 78], [10, 90, 10, 66], [-20, 20, -60, 64], [30, -20, 58, 60]]) { const b = blob(r, leaf[(tone + Math.abs(Math.round(x))) % 3], 2); b.position.set(x, y, z); b.scale.y = .86; crown.add(b); }
  t.scale.setScalar(s); t.userData.crown = crown; return t;
}

export function buildWorld() {
  ENV = ENV || scene.environment;
  const root = G();
  const sky = makeSky(); root.add(sky);
  const fog = new THREE.FogExp2(0x3e4f9c, .0002);
  const hemi = new THREE.HemisphereLight(0x5870d0, 0x2a2448, 1.2); root.add(hemi);
  const warm = [], glowMats = []; // lamps and glowing panes that fade with daylight
  const glow = (hex, k, day = 0x5a6da6) => { const m = hdr(hex, k); m.userData.day = C3(day); glowMats.push(m); return m; }, tc = C3(0);
  /* layered hills fading into the fog */
  const hillMat = new THREE.MeshBasicMaterial({color: 0x1b2456, side: THREE.DoubleSide}), hills = [];
  for (const [R, H, seed] of [[4200, 620, 1.3], [5600, 900, 4.1], [7400, 1300, 7.7]]) {
    const n = 120, pos = [], idx = [];
    for (let i = 0; i <= n; i++) { const a = i / n * TAU, h = H * (.45 + .3 * Math.sin(a * 3 + seed) + .16 * Math.sin(a * 7 + seed * 2) + .09 * Math.sin(a * 13 + seed * 3)); pos.push(Math.cos(a) * R, -40, Math.sin(a) * R, Math.cos(a) * R, Math.max(60, h), Math.sin(a) * R); if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    const hm = new THREE.Mesh(g, hillMat); root.add(hm); hills.push(hm);
  }
  /* lawn and paving */
  const lawnTex = canvasTex(256, 256, (c) => { c.fillStyle = '#5f9d7c'; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${40 + Math.random() * 70},${120 + Math.random() * 70},${90 + Math.random() * 50},.22)`; const r = 2 + Math.random() * 9; c.beginPath(); c.arc(Math.random() * 256, Math.random() * 256, r, 0, TAU); c.fill(); } });
  lawnTex.wrapS = lawnTex.wrapT = THREE.RepeatWrapping; lawnTex.repeat.set(26, 26);
  const lawn = mesh(new THREE.CircleGeometry(9000, 64), soft(0xffffff, {map: lawnTex}), false); lawn.rotation.x = -Math.PI / 2; lawn.position.y = -.5; root.add(lawn);
  const paveDraw = (c) => { c.fillStyle = '#d9d1c2'; c.fillRect(0, 0, 256, 256); c.strokeStyle = 'rgba(120,110,100,.35)'; c.lineWidth = 3; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64, 256); c.moveTo(0, i * 64); c.lineTo(256, i * 64); c.stroke(); } };
  const pave = (w, d, x, z) => { const t = canvasTex(256, 256, paveDraw); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 160, d / 160); const m = box(w, 3, d, soft(0xffffff, {map: t}), false); m.position.set(x, .6, z); root.add(m); return m; };
  pave(2300, 150, -200, -430); pave(240, 800, -770, -30); pave(1300, 170, -1250, 330); pave(1500, 150, 250, 330);

  /* ---- lab building ---- */
  const bld = G(); root.add(bld);
  const wallM = soft(0xd9cfc2), trimM = soft(0xf1ebe0), baseM = soft(0x8f8c96), roofM = soft(0x5c6a88), frameM = soft(0xf4efe6);
  const shell = box(1900, 900, 700, wallM); shell.position.set(0, 450, -860); bld.add(shell);
  const plinth = box(1916, 56, 716, baseM); plinth.position.set(0, 28, -860); bld.add(plinth);
  const cornice = box(1950, 26, 750, trimM); cornice.position.set(0, 905, -860); bld.add(cornice);
  const parapet = box(1910, 50, 710, wallM); parapet.position.set(0, 942, -860); bld.add(parapet);
  const roof = box(1700, 60, 520, roofM); roof.position.set(0, 990, -860); bld.add(roof);
  for (let f = 1; f < 3; f++) { const ledge = box(1912, 12, 20, trimM); ledge.position.set(0, 300 * f, -503); bld.add(ledge); }
  for (let c = 0; c <= 8; c++) { const pl = box(30, 846, 16, trimM); pl.position.set(-880 + c * 220, 479, -504); bld.add(pl); }
  const paneTex = canvasTex(64, 64, (c) => { const g = c.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#b9b9b9'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
  const paneDark = metal(0x24366e, .32, {metalness: .5, map: paneTex, envMapIntensity: .5});
  const paneWarm = glow(0xffc070, 1.9), paneCool = glow(0x9fd4ff, 1.5); paneWarm.map = paneCool.map = paneTex;
  const LIT = {'1-1': paneCool, '2-6': paneCool, '0-1': paneWarm, '2-2': paneWarm, '1-4': paneWarm, '0-5': paneCool};
  const win = {};
  for (let f = 0; f < 3; f++) for (let c = 0; c < 8; c++) {
    const key = `${f}-${c}`, x = -770 + c * 220, y = 160 + f * 300; if (key === '0-0') continue;
    const frame = box(150, 170, 12, frameM); frame.position.set(x, y, -507); bld.add(frame);
    const g = mesh(new THREE.PlaneGeometry(134, 154), LIT[key] || paneDark, false); g.position.set(x, y, -500.5); bld.add(g); win[key] = g;
    const mv = box(5, 154, 4, frameM, false); mv.position.set(x, y, -499); bld.add(mv); const mh = box(134, 5, 4, frameM, false); mh.position.set(x, y + 22, -499); bld.add(mh);
    const sill = box(166, 8, 22, trimM); sill.position.set(x, y - 89, -499); bld.add(sill);
  }
  /* entrance */
  const DX = -770;
  for (let i = 0; i < 3; i++) { const st = box(300 - i * 30, 12, 110 - i * 30, baseM); st.position.set(DX, 6 + i * 12, -470 - i * 12); bld.add(st); }
  const dframe = box(190, 262, 14, frameM); dframe.position.set(DX, 167, -506); bld.add(dframe);
  const door = mesh(new THREE.PlaneGeometry(170, 240), glow(0xffc27e, .95), false); door.position.set(DX, 160, -498.5); bld.add(door);
  const dmid = box(6, 240, 4, soft(0x6a4d3a), false); dmid.position.set(DX, 160, -497); bld.add(dmid);
  { const wood = soft(0x7a5a44);
    for (const s of [-1, 1]) { const pan = box(74, 96, 4, wood, false); pan.position.set(DX + s * 44, 92, -497.5); bld.add(pan); const h = sph(3.2, metal(0xe7c36a), 8, false); h.position.set(DX + s * 9, 152, -494); bld.add(h); }
    for (const y of [144, 277]) { const rail = box(170, 8, 5, wood, false); rail.position.set(DX, y, -497); bld.add(rail); } }
  const canopy = box(300, 14, 130, roofM); canopy.position.set(DX, 318, -445); bld.add(canopy);
  for (const s of [-1, 1]) { const col = cyl(8, 8, 280, trimM, 12); col.position.set(DX + s * 132, 176, -392); bld.add(col); const lant = sph(9, glow(0xffd9a0, 3, 0xf0e8d6), 12, false); lant.position.set(DX + s * 132, 290, -380); bld.add(lant); }
  const doorL = new THREE.PointLight(0xffc98a, 2.2, 900, 0); doorL.position.set(DX, 260, -340); bld.add(doorL); warm.push([doorL, 2.2]);
  const signBack = box(250, 50, 6, trimM); signBack.position.set(DX, 350, -383); bld.add(signBack);
  const sign = textPlate('第七实验楼', {h: 38, color: '#3b3550', px: 64}); sign.position.set(DX, 350, -378); bld.add(sign);
  /* optics lab: ground floor, column 5, its transom window left ajar */
  const OX = -770 + 5 * 220;
  const transom = box(134, 40, 5, new THREE.MeshStandardMaterial({color: 0x9fc4ff, roughness: .1, metalness: .4, transparent: true, opacity: .6})); transom.position.set(OX, 258, -486); transom.rotation.x = -.6; bld.add(transom);
  const plate = (t, x) => { const b = box(120, 26, 4, soft(0x39406a)); b.position.set(x, 50, -497); bld.add(b); const s = textPlate(t, {h: 17, color: '#e9edf8', px: 56}); s.position.set(x, 50, -494.5); bld.add(s); };
  plate('光学实验室', OX); plate('声学实验室', -770 + 220);
  for (let c = 1; c < 8; c++) { const b = blob(40, soft(c % 2 ? 0x4f9a7c : 0x3f8a78), 2); b.scale.set(1.4, .6, .9); b.position.set(-660 + c * 220, 20, -462); root.add(b); }
  /* the old clock tower behind the campus, stopped at 4:10 */
  const tower = G(); tower.position.set(-1500, 0, -1750); root.add(tower);
  const tb = box(300, 1500, 300, wallM); tb.position.y = 750; tower.add(tb);
  const tcap = mesh(new THREE.ConeGeometry(250, 380, 4), roofM); tcap.rotation.y = Math.PI / 4; tcap.position.y = 1690; tower.add(tcap);
  const tbelt = box(330, 30, 330, trimM); tbelt.position.y = 1490; tower.add(tbelt);
  const face = mesh(new THREE.CircleGeometry(104, 40), glow(0xfff0c8, 1.25, 0xf2ead6), false); face.position.set(0, 1290, 151); tower.add(face);
  const ring = mesh(new THREE.TorusGeometry(108, 9, 10, 40), trimM); ring.position.set(0, 1290, 151); tower.add(ring);
  const hand = (len, w, ang) => { const h = box(w, len, 4, soft(0x2a2440), false); h.geometry.translate(0, len / 2, 0); h.position.set(0, 1290, 154); h.rotation.z = -ang; tower.add(h); };
  hand(58, 10, (4 + 10 / 60) / 12 * TAU); hand(86, 7, 10 / 60 * TAU);

  /* ---- the ecological pond ---- */
  const PX = 380, PZ = -180, PW = 820, PD = 420, stone = soft(0xcfc7ba), stone2 = soft(0xb9b2a8);
  for (const [x, z, w, d] of [[PX, PZ - PD / 2, PW + 60, 34], [PX, PZ + PD / 2, PW + 60, 34], [PX - PW / 2, PZ, 34, PD], [PX + PW / 2, PZ, 34, PD]]) {
    const n = Math.round(Math.max(w, d) / 70);
    for (let i = 0; i < n; i++) { const along = (i + .5) / n - .5, r = box(w > d ? w / n - 5 : w, 20 + (i % 3) * 3, w > d ? d : d / n - 5, i % 2 ? stone : stone2); r.position.set(x + (w > d ? along * w : 0), 9, z + (w > d ? 0 : along * d)); root.add(r); }
  }
  const bed = box(PW, 2, PD, soft(0x2c5a78), false); bed.position.set(PX, -1, PZ); root.add(bed);
  const water = makeWater(PW, PD); water.position.set(PX, 13, PZ); root.add(water);
  const padM = soft(0x5fae7a, {side: THREE.DoubleSide});
  for (const [x, z, r] of [[-300, -130, 26], [-250, -90, 18], [290, 120, 28], [330, 70, 17], [-340, 150, 20], [200, -150, 22]]) { const pad = mesh(new THREE.CircleGeometry(r, 18, .3, TAU - .6), padM, false); pad.rotation.x = -Math.PI / 2; pad.rotation.z = x; pad.position.set(PX + x, 13.6, PZ + z); root.add(pad); }
  for (const [x, z] of [[-290, -118], [300, 108]]) { const fl = G(); for (let i = 0; i < 7; i++) { const pt = mesh(new THREE.ConeGeometry(4.5, 15, 5), soft(0xffc4dc, {emissive: 0xff8fb8, emissiveIntensity: .5})); pt.position.set(Math.cos(i / 7 * TAU) * 5, 6, Math.sin(i / 7 * TAU) * 5); pt.rotation.set(Math.sin(i / 7 * TAU) * .5, 0, -Math.cos(i / 7 * TAU) * .5); fl.add(pt); } fl.position.set(PX + x, 14, PZ + z); root.add(fl); }
  const reeds = [];
  for (const [x, z] of [[-372, -160], [-352, -182], [-384, -120], [366, 160], [344, 182], [380, 126], [372, -170], [-360, 174]]) for (let i = 0; i < 3; i++) { const h = 60 + ((x + i * 37) % 40 + 40) % 40; const r = mesh(new THREE.ConeGeometry(3.4, h, 5), soft(0x6fb486)); r.geometry.translate(0, h / 2, 0); r.position.set(PX + x + i * 9 - 9, 12, PZ + z + (i % 2) * 8); r.userData.ph = x + i; root.add(r); reeds.push(r); }
  const fishMat = [0xd7e2ea, 0xf0c9a0, 0xffa07a].map((c) => soft(c, {rough: .5, emissive: c, emissiveIntensity: .12}));
  const fishShape = (m, sc = 1) => { const f = G(); const b = sph(10, m, 12); b.scale.set(2.2, .8, .7); f.add(b); const tl = mesh(new THREE.ConeGeometry(7, 12, 4), m); tl.rotation.z = Math.PI / 2; tl.position.x = -26; f.add(tl); f.scale.setScalar(sc); return f; };
  const fishes = [[PX - 160, PZ - 60, 90, .2], [PX + 40, PZ + 80, 120, -.15], [PX + 220, PZ - 90, 70, .25]].map(([x, z, r, w], i) => { const f = fishShape(fishMat[i]); f.userData = {x, z, r, w, a: i * 2}; f.position.y = 3; root.add(f); return f; });
  const sunk = trophy(); sunk.position.set(PX + 120, 5, PZ + 40); sunk.rotation.z = 1.25; sunk.visible = false; root.add(sunk);
  /* ---- guard room ---- */
  const GX = -1450, GZ = 150;
  const gr = box(420, 270, 340, wallM); gr.position.set(GX, 135, GZ); root.add(gr);
  const grRoof = mesh(new THREE.ConeGeometry(340, 130, 4), roofM); grRoof.rotation.y = Math.PI / 4; grRoof.scale.set(1.05, 1, .88); grRoof.position.set(GX, 335, GZ); root.add(grRoof);
  const grFrame = box(12, 126, 186, frameM); grFrame.position.set(GX + 207, 160, GZ + 40); root.add(grFrame);
  const grWin = mesh(new THREE.PlaneGeometry(170, 110), glow(0xffc880, 1.8), false); grWin.position.set(GX + 214, 160, GZ + 40); grWin.rotation.y = Math.PI / 2; root.add(grWin);
  const grSign = textPlate('门卫室', {h: 26, color: '#3b3550', px: 64}); grSign.position.set(GX + 214, 240, GZ + 40); grSign.rotation.y = Math.PI / 2; root.add(grSign);
  const grL = new THREE.PointLight(0xffc98a, 1.6, 700, 0); grL.position.set(GX + 330, 170, GZ + 40); root.add(grL); warm.push([grL, 1.6]);
  /* ---- lamps, trees, flowers ---- */
  const lampM = soft(0x3a3f5c);
  const lamps = [[-420, 260], [930, 140], [-1200, 540], [700, 520]].map(([x, z], i) => {
    const pole = cyl(4, 6, 330, lampM, 10); pole.position.set(x, 165, z); root.add(pole);
    const arm = mesh(new THREE.TorusGeometry(26, 3, 8, 16, Math.PI / 2), lampM); arm.position.set(x, 330, z); arm.rotation.y = Math.PI; root.add(arm);
    const lant = mesh(lathe([[0, 0], [11, 4], [13, 22], [6, 30], [0, 31]], 14), glow(0xffd9a0, 3, 0xf0e8d6), false); lant.position.set(x + 26, 322, z); root.add(lant);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(150, 330, 28, 1, true), add(0xffc98a, .1, shaftTex)); cone.position.set(x + 26, 165, z); root.add(cone);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(560, 560), add(0xffb060, .34, radial)); pool.rotation.x = -Math.PI / 2; pool.position.set(x + 26, 2.6, z); root.add(pool);
    const L = new THREE.PointLight(0xffc98a, i < 2 ? 2 : 1.4, 1000, 0); L.position.set(x + 26, 300, z); root.add(L); warm.push([L, L.intensity], [cone.material, .1, 'op'], [pool.material, .34, 'op']); return L;
  });
  const trees = [[-1050, -400, 1.15], [1180, -360, 1.35], [1290, 260, 1], [-1780, -220, 1.25], [-940, 560, .9], [1420, -820, 1.5], [-1320, -900, 1.4], [1080, 640, .85], [-2100, 380, 1.3], [1900, 100, 1.4], [-1600, 860, .9], [1650, 640, 1.1]].map(([x, z, s], i) => { const t = tree(s, i); t.position.set(x, 0, z); t.rotation.y = i * 1.7; root.add(t); return t; });
  { const n = 260, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { let x, z; do { x = (Math.random() - .5) * 3600; z = -420 + Math.random() * 1300; } while (Math.abs(x - PX) < 450 && Math.abs(z - PZ) < 250); pos.set([x, 5 + Math.random() * 4, z], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    root.add(new THREE.Points(g, new THREE.PointsMaterial({map: radial, color: 0xfff4c8, size: 15, transparent: true, opacity: .85, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false}))); }
  /* drifting motes everywhere, fireflies over the pond */
  const points = (n, size, hex) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); const p = new THREE.Points(g, new THREE.PointsMaterial({map: radial, size, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false})); p.frustumCulled = false; p.userData = {n, col: C3(hex), seed: Array.from({length: n}, () => [Math.random(), Math.random(), Math.random(), Math.random()])}; root.add(p); return p; };
  const motes = points(coarse ? 70 : 130, 9, 0xbfd4ff), flies = points(46, 20, 0xe8ff9a);
  const mist = [[PX, PZ + 60, 900, .5], [-500, 100, 1100, .35], [900, -300, 1000, .3]].map(([x, z, s, o], i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s * .5), add(0x9fb6ff, 0, radial)); m.rotation.x = -Math.PI / 2; m.position.set(x, 30 + i * 8, z); m.userData = {x, o}; root.add(m); return m; });

  /* ---- interior sets, far to the side ---- */
  const floorIn = soft(0x9a8f88), tableM = soft(0xe6dccb), legM = soft(0x77706c), dark = soft(0x2a2c3c, {rough: .5}), steel = metal(0xcfd2d6);
  const room = (x0, tint) => {
    const r = G(); r.position.x = x0; root.add(r);
    const floor = box(1500, 10, 1300, floorIn, false); floor.position.set(0, -5, 300); r.add(floor);
    const wall = box(1500, 520, 14, soft(tint)); wall.position.set(0, 260, -300); r.add(wall);
    for (const s of [-1, 1]) { const side = box(14, 520, 1300, soft(tint)); side.position.set(s * 750, 260, 300); r.add(side); }
    const skirt = box(1500, 18, 6, soft(0xf1ebe0)); skirt.position.set(0, 9, -292); r.add(skirt);
    const light = new THREE.PointLight(0xffe2c0, .5, 1700, 0); light.position.set(80, 400, 260); r.add(light);
    return r;
  };
  const bench = (r, w, d, x, z) => { const t = box(w, 12, d, tableM); t.position.set(x, 90, z); r.add(t); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = box(9, 84, 9, legM); l.position.set(x + sx * (w / 2 - 12), 42, z + sz * (d / 2 - 12)); r.add(l); } };
  const windowIn = (r, x, y, w, h) => {
    const fr = box(w + 20, h + 20, 8, soft(0xf1ebe0)); fr.position.set(x, y, -292); r.add(fr);
    const g = mesh(new THREE.PlaneGeometry(w, h), hdr(0x7fa4ff, 1.15), false); g.position.set(x, y, -287.5); r.add(g);
    const mu = box(6, h, 5, soft(0xf1ebe0), false); mu.position.set(x, y, -286); r.add(mu);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.5, 620), add(0x8fb0ff, .16, shaftTex)); sh.position.set(x - 40, y - 210, -40); sh.rotation.x = -.95; r.add(sh);
  };
  /* optics lab */
  const optics = room(6000, 0xc4cbe0);
  bench(optics, 300, 160, 0, -120);
  const ped = mesh(lathe([[0, 0], [34, 0], [34, 4], [28, 8], [28, 22], [32, 26], [0, 26]], 6), dark); ped.position.set(0, 96, -120); optics.add(ped);
  const prize = trophy(); prize.position.set(0, 122, -120); prize.scale.setScalar(1.3); optics.add(prize);
  const card = box(13, .6, 9, hdr(0xffffff, 1.1), false); card.position.set(15, 122.6, -106); card.rotation.y = .5; card.visible = false; optics.add(card);
  const spot = new THREE.SpotLight(0xdff4ff, 1.5, 900, .3, .7, 0); spot.position.set(0, 430, -60); spot.target = ped; optics.add(spot);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(92, 320, 28, 1, true), add(0xbfe8ff, .07, shaftTex)); beam.position.set(0, 270, -110); optics.add(beam);
  windowIn(optics, 240, 220, 220, 180);
  const otransom = box(220, 50, 4, new THREE.MeshStandardMaterial({color: 0x9fc4ff, roughness: .1, metalness: .4, transparent: true, opacity: .55})); otransom.position.set(240, 344, -282); otransom.rotation.x = -.5; optics.add(otransom);
  { const sh = box(260, 10, 40, tableM); sh.position.set(-280, 230, -272); optics.add(sh); const sh2 = sh.clone(); sh2.position.y = 150; optics.add(sh2);
    const gl = (c) => new THREE.MeshPhysicalMaterial({color: c, transparent: true, opacity: .55, roughness: .03, clearcoat: 1, emissive: c, emissiveIntensity: .25});
    const prism = mesh(new THREE.CylinderGeometry(16, 16, 34, 3), gl(0xbfe6ff)); prism.rotation.z = Math.PI / 2; prism.position.set(-340, 251, -272); optics.add(prism);
    const lens = sph(18, gl(0xd8f0ff), 20); lens.scale.set(1, 1, .3); lens.position.set(-280, 258, -272); optics.add(lens); const lst = cyl(2, 2, 16, legM, 8); lst.position.set(-280, 243, -272); optics.add(lst);
    const ball = sph(14, gl(0xffd0f0), 20); ball.position.set(-218, 249, -272); optics.add(ball);
    for (let i = 0; i < 5; i++) { const bk = box(12, 40 + (i % 3) * 8, 30, soft([0x6f8fe0, 0xe08a7a, 0x7ac8a8, 0xe0c070, 0x9a8ad8][i])); bk.position.set(-360 + i * 15, 175 + (i % 3) * 4, -272); optics.add(bk); }
    const poster = mesh(new THREE.PlaneGeometry(130, 170), new THREE.MeshStandardMaterial({map: canvasTex(260, 340, (c) => { c.fillStyle = '#20264e'; c.fillRect(0, 0, 260, 340); const cols = ['#ff6b6b', '#ffb347', '#ffe66d', '#7bd389', '#5cc8ff', '#7d83ff', '#c77dff']; c.lineWidth = 7; cols.forEach((k, i) => { c.strokeStyle = k; c.beginPath(); c.moveTo(130, 150); c.lineTo(250, 110 + i * 16); c.stroke(); }); c.strokeStyle = '#fff'; c.lineWidth = 5; c.beginPath(); c.moveTo(10, 190); c.lineTo(110, 150); c.stroke(); c.beginPath(); c.moveTo(90, 190); c.lineTo(130, 110); c.lineTo(170, 190); c.closePath(); c.stroke(); c.fillStyle = '#e9edf8'; c.font = '700 30px sans-serif'; c.textAlign = 'center'; c.fillText('光的色散', 130, 280); }), roughness: .8}), false); poster.position.set(-560, 260, -292); optics.add(poster); }
  const camBody = G(); camBody.position.set(-420, 360, -260); optics.add(camBody);
  const cb = mesh(new THREE.CapsuleGeometry(17, 40, 6, 14), soft(0xf2f4f8, {rough: .5})); cb.rotation.z = Math.PI / 2; camBody.add(cb);
  const cl = cyl(12, 14, 14, dark, 20); cl.rotation.z = Math.PI / 2; cl.position.x = 40; camBody.add(cl);
  const cg = mesh(new THREE.CircleGeometry(8.5, 20), hdr(0x3ee6ff, 2), false); cg.rotation.y = Math.PI / 2; cg.position.x = 47.5; camBody.add(cg);
  const crec = sph(3, hdr(0xff3b30, 3), 8, false); crec.position.set(-20, 14, 16); camBody.add(crec);
  camBody.rotation.y = -.55; camBody.rotation.z = -.35;
  const cmount = rod(soft(0xb9c0cc), 3); cmount.set(V(-440, 368, -262), V(-440, 410, -294)); optics.add(cmount);
  /* acoustics lab: the bell jar on its bench */
  const acoustic = room(9000, 0xc9cfdd);
  bench(acoustic, 360, 180, 0, -120);
  const plateJ = cyl(62, 66, 8, dark, 40); plateJ.position.set(-40, 100, -120); acoustic.add(plateJ);
  const glassJ = new THREE.MeshPhysicalMaterial({color: 0xdff2ff, transparent: true, opacity: .26, roughness: .03, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false, emissive: 0x4a7ab8, emissiveIntensity: .25});
  const dome = mesh(new THREE.SphereGeometry(52, 40, 20, 0, TAU, 0, Math.PI / 2), glassJ, false); dome.position.set(-40, 150, -120); acoustic.add(dome);
  const wallJ = mesh(new THREE.CylinderGeometry(52, 52, 46, 40, 1, true), glassJ, false); wallJ.position.set(-40, 127, -120); acoustic.add(wallJ);
  const bell = mesh(new THREE.SphereGeometry(17, 24, 10, 0, TAU, 0, Math.PI / 2), metal(0xe9c46a, .25)); bell.position.set(-40, 150, -120); acoustic.add(bell);
  const hammer = G(); hammer.position.set(-18, 116, -120); acoustic.add(hammer); const hr = rod(steel, 1.4); hr.set(V(), V(0, 26, 0)); hammer.add(hr); const hb = sph(4, dark); hb.position.y = 26; hammer.add(hb);
  const pump = mesh(lathe([[0, 0], [34, 0], [36, 6], [36, 50], [30, 60], [0, 60]], 20), soft(0x4f7fd8, {rough: .5})); pump.position.set(110, 96, -130); acoustic.add(pump);
  const pled = sph(4, hdr(0x4ade80, 3), 8, false); pled.position.set(110, 140, -95); acoustic.add(pled);
  const hose = rod(dark, 3); hose.set(V(76, 110, -128), V(18, 104, -122)); acoustic.add(hose);
  const logFrame = box(180, 108, 10, dark); logFrame.position.set(110, 230, -293); acoustic.add(logFrame);
  const logScr = mesh(new THREE.PlaneGeometry(160, 90), new THREE.MeshBasicMaterial({map: canvasTex(320, 180, (c, w, h) => {
    c.fillStyle = '#071326'; c.fillRect(0, 0, w, h); c.fillStyle = '#5ee6ff'; c.font = '700 22px Menlo, Consolas, monospace';
    c.fillText('VACUUM LOG', 16, 32); c.fillStyle = '#c9d8ee'; c.font = '600 18px Menlo, Consolas, monospace';
    ['20:50  PUMP ON', '21:00  0.2 kPa', '21:30  0.2 kPa', '22:00  0.2 kPa'].forEach((t, i) => c.fillText(t, 16, 66 + i * 26));
  }), toneMapped: false}), false); logScr.material.color.multiplyScalar(1.5); logScr.position.set(110, 230, -287); acoustic.add(logScr);
  windowIn(acoustic, -330, 230, 200, 180);
  { for (let i = 0; i < 3; i++) { const fk = G(); const st = cyl(2, 2, 44, steel, 8); st.position.y = 22; fk.add(st); for (const s of [-1, 1]) { const tn = cyl(2, 2, 46, steel, 8); tn.position.set(s * 7, 66, 0); fk.add(tn); } const bs = box(16, 4, 4, steel); bs.position.y = 44; fk.add(bs); const bx = box(46, 18, 26, tableM); bx.position.y = -9; fk.add(bx); fk.position.set(420 + i * 70, 108, -230); fk.scale.setScalar(1 - i * .12); acoustic.add(fk); }
    const sideT = box(260, 12, 90, tableM); sideT.position.set(490, 84, -230); acoustic.add(sideT); for (const s of [-1, 1]) { const l = box(9, 78, 9, legM); l.position.set(490 + s * 118, 39, -230); acoustic.add(l); } }
  /* guard room interior: desk, a television flickering */
  const guard = room(12000, 0xd6cdbf);
  const desk = box(280, 12, 130, soft(0xb98d68)); desk.position.set(-60, 80, -150); guard.add(desk);
  for (const s of [-1, 1]) { const l = box(12, 74, 110, soft(0x9a7352)); l.position.set(-60 + s * 128, 37, -150); guard.add(l); }
  const tvStand = box(150, 96, 60, soft(0x9a7352)); tvStand.position.set(140, 48, -258); guard.add(tvStand);
  const tv = box(132, 88, 20, dark); tv.position.set(140, 142, -260); guard.add(tv);
  const tvScr = mesh(new THREE.PlaneGeometry(116, 72), hdr(0x6ab8ff, 1.6), false); tvScr.position.set(140, 142, -249); guard.add(tvScr);
  const tvLight = new THREE.PointLight(0x6ab0ff, 1.6, 800, 0); tvLight.position.set(140, 150, -190); guard.add(tvLight);
  const monitor = box(96, 64, 10, dark); monitor.position.set(-120, 126, -195); guard.add(monitor);
  const monScr = mesh(new THREE.PlaneGeometry(84, 52), hdr(0x62d49a, 1.2), false); monScr.position.set(-120, 126, -189); guard.add(monScr);
  const mug = cyl(7, 6, 14, soft(0xf4efe6), 14); mug.position.set(20, 93, -140); guard.add(mug);
  const dlamp = G(); dlamp.position.set(-10, 86, -190); guard.add(dlamp); const dl1 = cyl(9, 11, 3, dark, 14); dlamp.add(dl1); const dl2 = rod(dark, 1.6); dl2.set(V(0, 0, 0), V(8, 40, 0)); dlamp.add(dl2); const dl3 = mesh(new THREE.ConeGeometry(15, 16, 14, 1, true), hdr(0xffd08a, 1.4), false); dl3.material.side = THREE.DoubleSide; dl3.position.set(10, 42, 0); dlamp.add(dl3);
  const dL = new THREE.PointLight(0xffc98a, 1.1, 500, 0); dL.position.set(0, 120, -170); guard.add(dL);
  windowIn(guard, -430, 230, 180, 170);

  /* ---- people ---- */
  const P = {
    zhou: person({role: 'guard', top: 0x3f55a0, cape: 0x27336e, bot: 0x232c56, hair: 0xb4b9c6, skin: 0xeec4a4, wide: 1.14, h: 1, hairLen: .5}),
    lin: person({role: 'girl', top: 0xf4f6fc, cape: 0x86b8f2, bot: 0x35478c, hair: 0x4a2f2a, h: .9}),
    song: person({role: 'boy', top: 0xe2604f, cape: 0xf2a654, bot: 0x3a3d56, hair: 0x241c22, h: .95}),
    gu: person({role: 'lead', top: 0xe3c79c, cape: 0x2fc2b2, bot: 0x39405c, hair: 0x2e2422, h: 1.06, hairLen: .6, long: true}),
  };
  for (const k in P) root.add(P[k]);
  const fill = new THREE.PointLight(0xd8e2ff, .32, 900, 0); root.add(fill);
  const bucket = mesh(new THREE.CylinderGeometry(17, 13, 27, 20, 1, true), soft(0x5f93e0, {side: THREE.DoubleSide})); root.add(bucket);
  const bfloor = cyl(13, 13, 1, soft(0x4a78c0)); bfloor.position.y = -12; bucket.add(bfloor);
  const brim = mesh(new THREE.TorusGeometry(17, 1.4, 8, 24), soft(0xe8ecf4)); brim.rotation.x = Math.PI / 2; brim.position.y = 13.5; bucket.add(brim);
  { const bw = new THREE.Mesh(new THREE.CircleGeometry(15.6, 24), new THREE.MeshBasicMaterial({color: 0x9fd4ff, transparent: true, opacity: .55, depthWrite: false})); bw.rotation.x = -Math.PI / 2; bw.position.y = 5; bucket.add(bw); }
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU, f = fishShape(fishMat[i % 3], .5); f.position.set(Math.cos(a) * 6.5, 6.5 + (i % 2) * 1.6, Math.sin(a) * 6.5); f.rotation.set(0, -a + Math.PI / 2, .12); bucket.add(f); }
  const flash = new THREE.SpotLight(0xfff1d0, 2.4, 1100, .26, .6, 0); const flashT = new THREE.Object3D(); root.add(flash, flashT); flash.target = flashT; flash.visible = false;
  const fbeam = new THREE.Mesh(new THREE.ConeGeometry(70, 300, 20, 1, true), add(0xfff1d0, .09, shaftTex)); fbeam.geometry.translate(0, -150, 0); fbeam.visible = false; root.add(fbeam);
  const thrown = trophy(); thrown.visible = false; root.add(thrown);

  /* ---- mood ---- */
  const cur = {m: MOODS.night}; let moodName = '', outdoor = 'night';
  const sv = new THREE.Vector3(), fv = new THREE.Vector3(), down = V(0, -1, 0);
  function applyMood(name) {
    if (name === moodName) return; moodName = name; const m = MOODS[name], su = sky.material.uniforms;
    su.uTop.value.set(m.top); su.uMid.value.set(m.mid); su.uHor.value.set(m.hor); su.uSun.value.copy(m.sun); su.uSunCol.value.set(m.sunCol); su.uCloud.value.set(m.cloud); su.uCloudDk.value.set(m.cloudDk);
    su.uStars.value = m.stars; su.uHalo.value = m.halo; su.uCloudAmt.value = m.cloudAmt; su.uDisc.value = m.disc;
    fog.color.set(m.fog); fog.density = m.fogK; hillMat.color.set(m.hill);
    keyLight.color.set(m.key); keyLight.intensity = m.keyI; hemi.color.set(m.hemiS); hemi.groundColor.set(m.hemiG); hemi.intensity = m.hemiI;
    RIM.value.set(m.rim).multiplyScalar(m.rimK || 1); cur.m = m; W.bloom = m.bloom; W.exposure = m.exp;
    const wu = water.material.uniforms, om = MOODS[outdoor]; wu.uSky.value.set(om.hor).lerp(C3(om.mid), .5); wu.uLight.value.set(om.sunCol); wu.uL.value.copy(om.sun); wu.uDeep.value.set(om.stars ? 0x0c2a66 : 0x2a6f9c);
    for (const [o, v, kind] of warm) { if (kind === 'op') o.opacity = v * m.lamp; else o.intensity = v * m.lamp; }
    for (const g of glowMats) g.color.copy(g.userData.base).multiplyScalar(m.lamp).add(tc.copy(g.userData.day).multiplyScalar(1 - m.lamp));
    for (const ms of mist) ms.material.opacity = name === 'indoor' ? 0 : ms.userData.o * (m.stars ? .2 : .1);
    for (const hm of hills) hm.visible = name !== 'indoor';
    flies.visible = !!m.stars; fill.intensity = name === 'gold' || name === 'dawn' ? .12 : .32;
  }

  const W = {
    root, P, fill, win, lamps, OX, PX, PZ, GX, GZ, optics, acoustic, guard, prize, card, sunk, thrown, bucket, flash, flashT, camBody, crec, tvScr, tvLight, hammer, transom, fog, bloom: .8, exposure: 1.1,
    pose: {
      zhou: [GX + 520, GZ + 150, .95], lin: [-640, -250, .15], song: [PX - 300, PZ + 260, -.35], gu: [PX + 80, PZ + 440, .5],
    },
    setMood(name) { outdoor = name; },
    wake() { moodName = ''; }, // the studio took the shared key light back while the world was off: apply the mood again
    say(k) { for (const n in P) P[n].userData.talk = n === k ? 1 : 0; },
    place(k, x, z, ry = 0) { const p = P[k]; p.position.set(x, 0, z); p.rotation.y = ry; p.visible = true; return p; },
    reset() {
      for (const k in W.pose) W.place(k, ...W.pose[k]);
      for (const k in P) { const u = P[k].userData; u.walk = 0; u.armL = u.armR = 0; u.look = 0; u.nod = 0; u.talk = 0; }
      bucket.position.set(W.pose.song[0] + 36, 14, W.pose.song[1] + 12); bucket.visible = true;
      sunk.visible = false; thrown.visible = false; prize.visible = true; card.visible = false; flash.visible = false; W.tasks.length = 0;
    },
    tasks: [], time: 0,
    /* move a person along the ground over `dur` seconds */
    walk(k, x, z, dur, ry) {
      const p = P[k], a = p.position.clone(), b = V(x, 0, z), face = ry ?? Math.atan2(b.x - a.x, b.z - a.z);
      p.rotation.y = face; p.userData.walk = 1;
      W.tasks.push({t: 0, dur, fn: (k2) => { p.position.lerpVectors(a, b, k2); if (k2 >= 1) p.userData.walk = 0; }});
    },
    tween(dur, fn) { W.tasks.push({t: 0, dur, fn}); },
    update(dt, camera) {
      const tt = (W.time += dt);
      for (const k in P) animPerson(P[k], dt);
      for (let i = W.tasks.length - 1; i >= 0; i--) { const t = W.tasks[i]; t.t += dt; const k = Math.min(1, t.t / t.dur); t.fn(k); if (k >= 1) W.tasks.splice(i, 1); }
      tvScr.material.color.setHSL(.58, .7, .5 + Math.sin(tt * 9) * .08 + Math.sin(tt * 23) * .06).multiplyScalar(.95); tvLight.intensity = 1.1 + Math.sin(tt * 11) * .3;
      crec.visible = Math.sin(tt * 4) > 0;
      hammer.rotation.z = .6 + Math.sin(tt * 55) * .18;
      for (const f of fishes) { const u = f.userData; u.a += dt * u.w; f.position.x = u.x + Math.cos(u.a) * u.r; f.position.z = u.z + Math.sin(u.a) * u.r * .5; f.rotation.y = -u.a - Math.sign(u.w) * Math.PI / 2; }
      prize.rotation.y += dt * .4; prize.userData.cr.rotation.y += dt * .6;
      for (const t of trees) { t.userData.crown.rotation.z = Math.sin(tt * .5 + t.position.x) * .025; t.userData.crown.rotation.x = Math.sin(tt * .4 + t.position.z) * .02; }
      for (const r of reeds) r.rotation.z = Math.sin(tt * 1.1 + r.userData.ph) * .09;
      mist.forEach((ms, i) => { ms.position.x = ms.userData.x + Math.sin(tt * .05 + i * 2) * 160; });
      sky.material.uniforms.uT.value = tt; water.material.uniforms.uT.value = tt;
      if (flash.visible) { const z = P.zhou; flash.position.set(z.position.x + 20, 96, z.position.z); fbeam.visible = true; fbeam.position.copy(flash.position); sv.copy(flashT.position).sub(flash.position); fbeam.scale.set(1, sv.length() / 300, 1); fbeam.quaternion.setFromUnitVectors(down, sv.normalize()); } else fbeam.visible = false;
      if (!camera) return;
      applyMood(camera.position.x > 4000 ? 'indoor' : outdoor);
      sky.position.copy(camera.position); fill.position.copy(camera.position);
      /* the shadow light follows what the camera looks at */
      camera.getWorldDirection(fv); sv.copy(camera.position).addScaledVector(fv, 700); sv.y = 0; sv.x = Math.round(sv.x / 80) * 80; sv.z = Math.round(sv.z / 80) * 80;
      keyLight.target.position.copy(sv); keyLight.position.copy(sv).addScaledVector(cur.m.keyDir, 2400); keyLight.target.updateMatrixWorld();
      /* motes drift around the camera; fireflies wander over the pond and pulse */
      const mp = motes.geometry.attributes.position, mc = motes.geometry.attributes.color, md = motes.userData;
      for (let i = 0; i < md.n; i++) { const s = md.seed[i], a = clamp(.35 + .65 * Math.sin(tt * (.4 + s[3]) + s[0] * 40), 0, 1) * (moodName === 'gold' ? .35 : .8);
        mp.setXYZ(i, sv.x + ((s[0] * 1800 + tt * (6 + s[3] * 10)) % 1800) - 900, 20 + ((s[1] * 520 + tt * (3 + s[2] * 7)) % 520), sv.z + (s[2] - .5) * 1700 + Math.sin(tt * .2 + s[1] * 9) * 40); mc.setXYZ(i, md.col.r * a, md.col.g * a, md.col.b * a); }
      mp.needsUpdate = mc.needsUpdate = true;
      if (flies.visible) { const fp = flies.geometry.attributes.position, fc = flies.geometry.attributes.color, fd = flies.userData;
        for (let i = 0; i < fd.n; i++) { const s = fd.seed[i], a = Math.pow(clamp(Math.sin(tt * (1 + s[3] * 1.6) + s[0] * 30), 0, 1), 2) * 1.5;
          fp.setXYZ(i, PX + (s[0] - .5) * 1100 + Math.sin(tt * .3 + s[1] * 20) * 70, 30 + s[1] * 150 + Math.sin(tt * .7 + s[2] * 20) * 22, PZ + (s[2] - .5) * 700 + Math.cos(tt * .25 + s[3] * 20) * 70); fc.setXYZ(i, fd.col.r * a, fd.col.g * a, fd.col.b * a); }
        fp.needsUpdate = fc.needsUpdate = true; }
    },
  };
  W.reset();
  return W;
}
