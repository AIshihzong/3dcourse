/* The case world: the school at night (lab building, ecological pond, guard room), three interior sets far off to the side,
   and the four people. Everything is low-poly boxes and cylinders lit like a night exterior. */
import * as THREE from 'three';
import {MAT, G, V, TAU, mesh, box, cyl, sph, rod, canvasTex, textPlate} from '../../kit.js';

const col = (c, o = {}) => MAT.col(c, {roughness: .8, clearcoat: 0, ...o});
const glow = (c) => MAT.glow(c);

/* a person: about 170 tall, faceless, with a clear silhouette per role */
function person({coat, pants = 0x22262d, skin = 0xc9a58a, hair = 0x1a1a1e, cap = null, long = false, h = 1}) {
  const p = G(), body = G(); p.add(body); body.scale.setScalar(h);
  const cm = col(coat), pm = col(pants), sm = col(skin);
  const legs = [-1, 1].map((s) => { const l = G(); l.position.set(s * 10, 88, 0); const m = cyl(7, 6, 86, pm, 10); m.position.y = -43; l.add(m); const shoe = box(14, 8, 24, col(0x111214)); shoe.position.set(0, -86, 4); l.add(shoe); body.add(l); return l; });
  const torso = long ? cyl(19, 27, 92, cm, 16) : cyl(20, 18, 64, cm, 16); torso.position.y = long ? 108 : 120; body.add(torso);
  const chest = cyl(17, 20, 28, cm, 16); chest.position.y = 142; body.add(chest);
  const arms = [-1, 1].map((s) => { const a = G(); a.position.set(s * 24, 150, 0); const m = cyl(5.5, 5, 64, cm, 8); m.position.y = -32; a.add(m); const hd = sph(5.5, sm, 8); hd.position.y = -66; a.add(hd); a.rotation.z = s * .08; body.add(a); return a; });
  const neck = cyl(5, 5, 8, sm, 8); neck.position.y = 160; body.add(neck);
  const head = sph(11.5, sm, 18); head.scale.set(1, 1.15, 1.05); head.position.y = 175; body.add(head);
  const hr = mesh(new THREE.SphereGeometry(12.2, 18, 12, 0, TAU, 0, Math.PI * .55), col(hair)); hr.position.y = 177; hr.rotation.x = -.25; body.add(hr);
  if (cap) { const c = cyl(13, 13, 7, col(cap), 18); c.position.y = 187; body.add(c); const v = box(16, 2, 12, col(cap)); v.position.set(0, 184, 13); body.add(v); }
  p.userData = {legs, arms, head, body, t: Math.random() * 10, walk: 0};
  return p;
}
function animPerson(p, dt) {
  const u = p.userData; u.t += dt;
  const w = u.walk, s = Math.sin(u.t * 7);
  u.legs[0].rotation.x = s * .5 * w; u.legs[1].rotation.x = -s * .5 * w;
  u.arms[0].rotation.x = -s * .4 * w + (u.armL || 0); u.arms[1].rotation.x = s * .4 * w + (u.armR || 0);
  u.body.position.y = Math.abs(s) * 2.2 * w + Math.sin(u.t * 1.3) * .6;
  u.head.rotation.y = (u.look || 0) + Math.sin(u.t * .7) * .06;
}
function trophy() {
  const t = G();
  const base = cyl(9, 11, 6, MAT.brass(), 20); base.position.y = 3; t.add(base);
  const stem = cyl(2.6, 3.4, 8, MAT.brass(), 12); stem.position.y = 10; t.add(stem);
  const cr = new THREE.Mesh(new THREE.OctahedronGeometry(9, 0), MAT.col(0xcff3ff, {transparent: true, opacity: .7, roughness: .02, metalness: .1, clearcoat: 1, envMapIntensity: 2.4}));
  cr.scale.set(1, 1.6, 1); cr.position.y = 27; t.add(cr);
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(3.4, 0), glow(0x9ff0ff)); core.scale.set(1, 1.6, 1); core.position.y = 27; t.add(core);
  t.userData.cr = cr; return t;
}

export function buildWorld() {
  const root = G();
  const ground = mesh(new THREE.PlaneGeometry(9000, 9000), col(0x121a1f), false); ground.rotation.x = -Math.PI / 2; ground.position.y = -.5; root.add(ground);
  const path = box(900, 2, 260, col(0x252c33), false); path.position.set(-500, 0, 120); root.add(path);
  /* ---- lab building ---- */
  const bld = G(); root.add(bld);
  const shell = box(1900, 900, 700, col(0x2b333c)); shell.position.set(0, 450, -860); bld.add(shell);
  const roof = box(1940, 24, 740, col(0x1d232a)); roof.position.set(0, 912, -860); bld.add(roof);
  for (let f = 0; f < 3; f++) { const ledge = box(1910, 10, 14, col(0x39434d)); ledge.position.set(0, 300 * f + 8, -505); bld.add(ledge); }
  const winMat = {dark: glow(0x0f171f), cool: glow(0x24465c), warm: glow(0x6e5530)};
  const LIT = {'1-1': 'cool', '2-6': 'cool', '0-1': 'warm'};
  const win = {};
  for (let f = 0; f < 3; f++) for (let c = 0; c < 8; c++) {
    const key = `${f}-${c}`, x = -770 + c * 220, y = 150 + f * 300;
    const frame = box(156, 166, 10, col(0x1a2027)); frame.position.set(x, y, -507); bld.add(frame);
    const g = mesh(new THREE.PlaneGeometry(140, 150), winMat[LIT[key] || 'dark'], false); g.position.set(x, y, -501); bld.add(g); win[key] = g;
  }
  const doorL = mesh(new THREE.PlaneGeometry(160, 230), glow(0x3a4a56), false); doorL.position.set(-770, 115, -500.5); bld.add(doorL);
  win['0-0'].visible = false;
  const lampD = sph(9, glow(0xffd9a0), 12, false); lampD.position.set(-770, 260, -470); bld.add(lampD);
  const sign = textPlate('第七实验楼', {h: 34, color: '#c8d4de', px: 64}); sign.position.set(-770, 274, -498); bld.add(sign);
  /* optics lab: ground floor, column 5, its transom window left ajar */
  const OX = -770 + 5 * 220;
  win['0-5'].material = glow(0x101a22);
  const transom = box(140, 34, 4, MAT.glass(.35)); transom.position.set(OX, 250, -490); transom.rotation.x = -.5; bld.add(transom);
  const opticsSign = textPlate('光学实验室', {h: 20, color: '#8fa3b3', px: 56}); opticsSign.position.set(OX, 262, -498); bld.add(opticsSign);
  const acSign = textPlate('声学实验室', {h: 20, color: '#8fa3b3', px: 56}); acSign.position.set(-770 + 220, 262, -498); bld.add(acSign);
  /* ---- the ecological pond ---- */
  const PX = 380, PZ = -180, PW = 820, PD = 420;
  const rim = [[PX, PZ - PD / 2, PW + 40, 26], [PX, PZ + PD / 2, PW + 40, 26], [PX - PW / 2, PZ, 26, PD], [PX + PW / 2, PZ, 26, PD]];
  for (const [x, z, w, d] of rim) { const r = box(w, 16, d, col(0x3b4248)); r.position.set(x, 8, z); root.add(r); }
  const bed = box(PW, 2, PD, col(0x0b1a20), false); bed.position.set(PX, 1, PZ); root.add(bed);
  const water = mesh(new THREE.PlaneGeometry(PW, PD), MAT.col(0x0d3a52, {transparent: true, opacity: .58, roughness: .05, clearcoat: 1, envMapIntensity: 1.6}), false);
  water.rotation.x = -Math.PI / 2; water.position.set(PX, 12, PZ); water.renderOrder = 3; root.add(water);
  const moonGlint = mesh(new THREE.PlaneGeometry(220, 60), MAT.fade(0x9fc8e0, .12), false); moonGlint.rotation.x = -Math.PI / 2; moonGlint.position.set(PX + 160, 12.5, PZ - 40); root.add(moonGlint);
  for (const [x, z, h] of [[PX - 360, PZ - 150, 70], [PX - 330, PZ - 170, 50], [PX + 350, PZ + 150, 80], [PX + 330, PZ + 170, 56]]) { const reed = mesh(new THREE.ConeGeometry(6, h, 5), col(0x23432f)); reed.position.set(x, h / 2 + 10, z); root.add(reed); }
  /* a few fish under the surface, swimming slow loops */
  const fishMat = [0x9fb2a4, 0xc9b79a, 0xb8c4cc].map((c) => col(c, {roughness: .5}));
  const fishShape = (m, sc = 1) => { const f = G(); const b = sph(10, m, 12); b.scale.set(2.2, .8, .7); f.add(b); const tl = mesh(new THREE.ConeGeometry(7, 12, 4), m); tl.rotation.z = Math.PI / 2; tl.position.x = -26; f.add(tl); f.scale.setScalar(sc); return f; };
  const fishes = [[PX - 160, PZ - 60, 90, .2], [PX + 40, PZ + 80, 120, -.15], [PX + 220, PZ - 90, 70, .25]].map(([x, z, r, w], i) => { const f = fishShape(fishMat[i]); f.userData = {x, z, r, w, a: i * 2}; f.position.y = 3; root.add(f); return f; });
  const sunk = trophy(); sunk.position.set(PX + 120, 3, PZ + 40); sunk.rotation.z = 1.2; sunk.visible = false; root.add(sunk);
  /* ---- guard room ---- */
  const GX = -1450, GZ = 150;
  const gr = box(420, 280, 340, col(0x313a43)); gr.position.set(GX, 140, GZ); root.add(gr);
  const grRoof = box(450, 18, 370, col(0x1d232a)); grRoof.position.set(GX, 289, GZ); root.add(grRoof);
  const grWin = mesh(new THREE.PlaneGeometry(170, 110), glow(0x2a5d73), false); grWin.position.set(GX + 211, 160, GZ + 40); grWin.rotation.y = Math.PI / 2; root.add(grWin);
  const grSign = textPlate('门卫室', {h: 26, color: '#c8d4de', px: 64}); grSign.position.set(GX + 212, 238, GZ + 40); grSign.rotation.y = Math.PI / 2; root.add(grSign);
  /* ---- lamps, trees, moon ---- */
  const lamps = [[-420, 260], [930, 140]].map(([x, z]) => {
    const pole = cyl(4, 5, 340, col(0x2a3036)); pole.position.set(x, 170, z); root.add(pole);
    const head = box(40, 10, 22, col(0x2a3036)); head.position.set(x + 14, 342, z); root.add(head);
    const bulb = box(30, 4, 14, glow(0xffe0b0), false); bulb.position.set(x + 14, 336, z); root.add(bulb);
    const L = new THREE.PointLight(0xffc98a, 1.5, 1100, 0); L.position.set(x + 14, 320, z); root.add(L); return L;
  });
  for (const [x, z, s] of [[-1050, -380, 1.1], [1150, -330, 1.3], [1250, 260, .9], [-1750, -200, 1.2], [-900, 520, .8]]) {
    const tr = G(); const trunk = cyl(9, 12, 120, col(0x2a2420)); trunk.position.y = 60; tr.add(trunk);
    const crown = mesh(new THREE.IcosahedronGeometry(110, 0), col(0x17271f)); crown.position.y = 210; crown.scale.y = 1.25; tr.add(crown);
    tr.position.set(x, 0, z); tr.scale.setScalar(s); root.add(tr);
  }
  const moon = mesh(new THREE.CircleGeometry(90, 32), glow(0xdfe8f0), false); moon.position.set(1800, 2300, -4200); root.add(moon);
  const moonLight = new THREE.DirectionalLight(0x9fbce0, 1.25); moonLight.position.set(1200, 1800, 900); root.add(moonLight);
  const amb = new THREE.HemisphereLight(0x6a88aa, 0x141a20, 1.2); root.add(amb);

  /* ---- interior sets, far to the side ---- */
  const room = (x0, wallC) => {
    const r = G(); r.position.x = x0; root.add(r);
    const floor = box(900, 10, 700, col(0x1c2329)); floor.position.y = -5; r.add(floor);
    const wall = box(900, 420, 12, col(wallC)); wall.position.set(0, 210, -300); r.add(wall);
    const side = box(12, 420, 700, col(wallC)); side.position.set(-450, 210, 50); r.add(side);
    const light = new THREE.PointLight(0x9fc4e0, 1.3, 1500, 0); light.position.set(80, 380, 200); r.add(light);
    return r;
  };
  /* optics lab */
  const optics = room(6000, 0x27313b);
  const tbl = box(300, 12, 160, col(0x3b4652)); tbl.position.set(0, 90, -120); optics.add(tbl);
  for (const [x, z] of [[-140, -190], [140, -190], [-140, -50], [140, -50]]) { const l = box(8, 90, 8, col(0x2a3138)); l.position.set(x, 45, z); optics.add(l); }
  const ped = box(60, 26, 60, col(0x141a20)); ped.position.set(0, 109, -120); optics.add(ped);
  const prize = trophy(); prize.position.set(0, 122, -120); prize.scale.setScalar(1.3); optics.add(prize);
  const spot = new THREE.SpotLight(0xdff4ff, 4, 900, .32, .5, 0); spot.position.set(0, 400, -60); spot.target = ped; optics.add(spot);
  const owin = mesh(new THREE.PlaneGeometry(220, 180), glow(0x16283a), false); owin.position.set(240, 220, -293); optics.add(owin);
  const omullion = box(6, 180, 6, col(0x0d1116)); omullion.position.set(240, 220, -290); optics.add(omullion);
  const otransom = box(220, 50, 4, MAT.glass(.4)); otransom.position.set(240, 340, -285); otransom.rotation.x = -.5; optics.add(otransom);
  const camBody = G(); camBody.position.set(-420, 360, -260); optics.add(camBody);
  const cb = box(64, 34, 34, col(0xd9dde2, {roughness: .5})); camBody.add(cb);
  const cl = cyl(11, 13, 16, MAT.dark(), 20); cl.rotation.z = Math.PI / 2; cl.position.x = 38; camBody.add(cl);
  const cg = mesh(new THREE.CircleGeometry(8, 20), glow(0x3ee6ff), false); cg.rotation.y = Math.PI / 2; cg.position.x = 46.5; camBody.add(cg);
  const crec = sph(3, glow(0xff3b30), 8, false); crec.position.set(-20, 12, 18); camBody.add(crec);
  camBody.rotation.y = -.55; camBody.rotation.z = -.35;
  const cmount = rod(col(0x8a96a3), 3); cmount.set(V(-440, 360, -260), V(-440, 400, -294)); optics.add(cmount);
  /* acoustics lab: the bell jar on its bench */
  const acoustic = room(9000, 0x2a3036);
  const tbl2 = box(360, 12, 180, col(0x3b4652)); tbl2.position.set(0, 90, -120); acoustic.add(tbl2);
  for (const [x, z] of [[-170, -200], [170, -200], [-170, -40], [170, -40]]) { const l = box(8, 90, 8, col(0x2a3138)); l.position.set(x, 45, z); acoustic.add(l); }
  const plate = cyl(62, 66, 8, MAT.dark(), 40); plate.position.set(-40, 100, -120); acoustic.add(plate);
  const dome = mesh(new THREE.SphereGeometry(52, 40, 20, 0, TAU, 0, Math.PI / 2), MAT.glass(.24), false); dome.position.set(-40, 150, -120); acoustic.add(dome);
  const wallJ = mesh(new THREE.CylinderGeometry(52, 52, 46, 40, 1, true), MAT.glass(.24), false); wallJ.position.set(-40, 127, -120); acoustic.add(wallJ);
  const bell = mesh(new THREE.SphereGeometry(17, 24, 10, 0, TAU, 0, Math.PI / 2), MAT.brass()); bell.position.set(-40, 150, -120); acoustic.add(bell);
  const hammer = G(); hammer.position.set(-18, 116, -120); acoustic.add(hammer); const hr = rod(MAT.steel(), 1.4); hr.set(V(), V(0, 26, 0)); hammer.add(hr); const hb = sph(4, MAT.dark()); hb.position.y = 26; hammer.add(hb);
  const pump = box(70, 60, 60, col(0x2f5d8a)); pump.position.set(110, 126, -130); acoustic.add(pump);
  const pled = sph(4, glow(0x4ade80), 8, false); pled.position.set(110, 146, -99); acoustic.add(pled);
  const logScr = mesh(new THREE.PlaneGeometry(160, 90), new THREE.MeshBasicMaterial({map: canvasTex(320, 180, (c, w, h) => {
    c.fillStyle = '#071318'; c.fillRect(0, 0, w, h); c.fillStyle = '#3ee6ff'; c.font = '700 22px Menlo, Consolas, monospace';
    c.fillText('VACUUM LOG', 16, 32); c.fillStyle = '#9fb3c2'; c.font = '600 18px Menlo, Consolas, monospace';
    ['20:50  PUMP ON', '21:00  0.2 kPa', '21:30  0.2 kPa', '22:00  0.2 kPa'].forEach((t, i) => c.fillText(t, 16, 66 + i * 26));
  }), toneMapped: false}), false); logScr.position.set(110, 230, -290); acoustic.add(logScr);
  /* guard room interior: desk, a television flickering */
  const guard = room(12000, 0x2c3238);
  const desk = box(260, 10, 120, col(0x3a332c)); desk.position.set(-60, 80, -150); guard.add(desk);
  const tv = box(120, 80, 20, MAT.dark()); tv.position.set(140, 170, -260); guard.add(tv);
  const tvScr = mesh(new THREE.PlaneGeometry(104, 64), glow(0x3a7ab0), false); tvScr.position.set(140, 170, -249); guard.add(tvScr);
  const tvLight = new THREE.PointLight(0x5aa8e0, 1.4, 700, 0); tvLight.position.set(140, 170, -200); guard.add(tvLight);
  const monitor = box(90, 60, 10, MAT.dark()); monitor.position.set(-120, 125, -195); guard.add(monitor);
  const monScr = mesh(new THREE.PlaneGeometry(80, 50), glow(0x1f3d2c), false); monScr.position.set(-120, 125, -189); guard.add(monScr);

  /* ---- people ---- */
  const P = {
    zhou: person({coat: 0x1f2c44, pants: 0x1a2232, cap: 0x182234, skin: 0xb8937a}),
    lin: person({coat: 0xd8dde3, pants: 0x2f3742, hair: 0x2a1c16, h: .95}),
    song: person({coat: 0x6e2a2a, pants: 0x1d2128, hair: 0x15151a, h: 1.02}),
    gu: person({coat: 0x8a7a62, pants: 0x2a2b30, long: true, hair: 0x22201e, h: 1.04}),
  };
  for (const k in P) root.add(P[k]);
  const fill = new THREE.PointLight(0xc8d8ea, .55, 900, 0); root.add(fill);
  const bucket = mesh(new THREE.CylinderGeometry(16, 12, 26, 18, 1, true), col(0x3b5f8a, {side: THREE.DoubleSide})); root.add(bucket);
  const bfloor = cyl(12, 12, 1, col(0x2b4766)); bfloor.position.y = -12; bucket.add(bfloor);
  for (let i = 0; i < 5; i++) { const f = fishShape(fishMat[i % 3], .42); f.position.set(Math.cos(i * 1.3) * 5, -8 + i * 3, Math.sin(i * 1.3) * 5); f.rotation.set(.3 * (i % 2 ? 1 : -1), i * 1.25, .5); bucket.add(f); }
  const flash = new THREE.SpotLight(0xfff1d0, 6, 1100, .26, .5, 0); const flashT = new THREE.Object3D(); root.add(flash, flashT); flash.target = flashT; flash.visible = false;
  const thrown = trophy(); thrown.visible = false; root.add(thrown);

  const W = {
    root, P, fill, win, lamps, OX, PX, PZ, GX, GZ, optics, acoustic, guard, prize, sunk, thrown, bucket, flash, flashT, camBody, crec, tvScr, tvLight, hammer, transom,
    pose: {
      zhou: [GX + 270, GZ + 60, Math.PI / 2 + .3], lin: [-600, -360, .2], song: [PX - 300, PZ + 250, -.4], gu: [PX - 40, PZ + 420, Math.PI],
    },
    place(k, x, z, ry = 0) { const p = P[k]; p.position.set(x, 0, z); p.rotation.y = ry; p.visible = true; return p; },
    reset() {
      for (const k in W.pose) W.place(k, ...W.pose[k]);
      for (const k in P) { P[k].userData.walk = 0; P[k].userData.armL = P[k].userData.armR = 0; P[k].userData.look = 0; }
      bucket.position.set(W.pose.song[0] + 34, 13, W.pose.song[1] + 10); bucket.visible = true;
      sunk.visible = false; thrown.visible = false; prize.visible = true; flash.visible = false; W.tasks.length = 0;
    },
    tasks: [], time: 0,
    /* move a person along the ground over `dur` seconds */
    walk(k, x, z, dur, ry) {
      const p = P[k], a = p.position.clone(), b = V(x, 0, z), face = ry ?? Math.atan2(b.x - a.x, b.z - a.z);
      p.rotation.y = face; p.userData.walk = 1;
      W.tasks.push({t: 0, dur, fn: (k2) => { p.position.lerpVectors(a, b, k2); if (k2 >= 1) p.userData.walk = 0; }});
    },
    tween(dur, fn) { W.tasks.push({t: 0, dur, fn}); },
    update(dt) {
      for (const k in P) animPerson(P[k], dt);
      for (let i = W.tasks.length - 1; i >= 0; i--) { const t = W.tasks[i]; t.t += dt; const k = Math.min(1, t.t / t.dur); t.fn(k); if (k >= 1) W.tasks.splice(i, 1); }
      const tt = (W.time += dt);
      tvScr.material.color.setHSL(.57, .55, .28 + Math.sin(tt * 9) * .05 + Math.sin(tt * 23) * .04); tvLight.intensity = 1 + Math.sin(tt * 11) * .25;
      crec.visible = Math.sin(tt * 4) > 0;
      hammer.rotation.z = .6 + Math.sin(tt * 55) * .18;
      for (const f of fishes) { const u = f.userData; u.a += dt * u.w; f.position.x = u.x + Math.cos(u.a) * u.r; f.position.z = u.z + Math.sin(u.a) * u.r * .5; f.rotation.y = -u.a - Math.sign(u.w) * Math.PI / 2; }
      prize.rotation.y += dt * .4; prize.userData.cr.rotation.y += dt * .6;
      if (flash.visible) { const z = P.zhou; flash.position.set(z.position.x, 120, z.position.z); }
    },
  };
  W.reset();
  return W;
}
