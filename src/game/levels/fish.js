/* 331 水下射击: the fish you see from the bank is a refracted image, shallower than the real fish. */
import * as THREE from 'three';
import {MAT, G, V, clamp, mesh, box, cyl, sph, rod} from '../../kit.js';

const X0 = -210, X1 = 520, W0 = 240, N = 1.33, DZ = 300, BANK = W0 + 30, TOP = BANK + 14;
const EYE = V(-296, TOP + 176, 0), HAND = V(-258, TOP + 140, 0);
const COL = [0xb8c4cc, 0x9fb2a4, 0xc9b79a];

/* where the fisher sees a fish that is really at `real`: solve Snell's law for the point S on the surface */
export function seen(real) {
  let lo = EYE.x, hi = real.x, S = 0;
  for (let k = 0; k < 36; k++) {
    S = (lo + hi) / 2;
    const sinW = (real.x - S) / Math.hypot(real.x - S, W0 - real.y), sinA = (S - EYE.x) / Math.hypot(S - EYE.x, EYE.y - W0);
    if (N * sinW > sinA) lo = S; else hi = S;
  }
  const k = (real.x - EYE.x) / (S - EYE.x);
  return {S: V(S, W0, 0), img: V(real.x, EYE.y + (W0 - EYE.y) * k, 0)};
}
function dashed(color) {
  const geo = new THREE.BufferGeometry().setFromPoints([V(), V(1, 0, 0)]);
  const l = new THREE.Line(geo, new THREE.LineDashedMaterial({color, dashSize: 13, gapSize: 9, toneMapped: false, depthTest: false, transparent: true}));
  l.set = (a, b) => { const p = geo.attributes.position; p.setXYZ(0, a.x, a.y, a.z); p.setXYZ(1, b.x, b.y, b.z); p.needsUpdate = true; l.computeLineDistances(); };
  l.renderOrder = 9; l.frustumCulled = false; return l;
}
function makeFish(color, ghost) {
  const f = G(), m = ghost ? MAT.fade(0xffffff, .62) : MAT.col(color, {roughness: .3, metalness: .35});
  const body = mesh(new THREE.SphereGeometry(1, 24, 16), m, !ghost); body.scale.set(42, 20, 13); f.add(body);
  const piv = G(); piv.position.x = -38; f.add(piv);
  const tail = mesh(new THREE.ConeGeometry(19, 30, 4), m, !ghost); tail.rotation.z = -Math.PI / 2; tail.position.x = -16; piv.add(tail);
  const fin = mesh(new THREE.ConeGeometry(9, 18, 4), m, !ghost); fin.position.set(-2, 23, 0); f.add(fin);
  if (!ghost) {
    const p = sph(2.6, MAT.dark(), 10, false); p.position.set(29, 5, 10.5); f.add(p); const back = mesh(new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI * .42), MAT.col(0x3d4a52, {roughness: .4}), true); back.scale.set(42.6, 20.6, 13.4); f.add(back);
  } else f.traverse((o) => { o.renderOrder = 7; });
  f.userData.piv = piv; return f;
}
const kill = (o) => o.traverse((x) => { x.geometry?.dispose(); x.material?.dispose?.(); });

export function buildFish(g) {
  const root = G();
  /* ---- test tank: concrete deck on the left, water channel, sensor rig ---- */
  const concrete = MAT.col(0x3a434d, {roughness: .85, clearcoat: 0}), deck = MAT.col(0x4b5662, {roughness: .7, clearcoat: .1});
  const floor = box(X1 - X0 + 140, 40, DZ + 60, MAT.col(0x2a3540, {roughness: .9, clearcoat: 0})); floor.position.set((X0 + X1) / 2 + 20, -17, 0); root.add(floor);
  const bankL = box(330, BANK, DZ + 60, concrete); bankL.position.set(X0 - 165, BANK / 2, 0); root.add(bankL);
  const topL = box(338, 14, DZ + 68, deck); topL.position.set(X0 - 165, BANK + 7, 0); root.add(topL);
  const stripe = box(8, 15, DZ + 70, MAT.glow(0xffb547)); stripe.position.set(X0 - 4, BANK + 7.5, 0); root.add(stripe);
  const bankR = box(70, W0 + 16, DZ + 60, concrete); bankR.position.set(X1 + 35, (W0 + 16) / 2, 0); root.add(bankR);
  const topR = box(78, 14, DZ + 68, deck); topR.position.set(X1 + 35, W0 + 23, 0); root.add(topR);
  const back = box(X1 - X0, W0 + 16, 30, MAT.col(0x26303a, {roughness: .9, clearcoat: 0})); back.position.set((X0 + X1) / 2, (W0 + 16) / 2, -DZ / 2 - 15); root.add(back);
  const topB = box(X1 - X0, 14, 38, deck); topB.position.set((X0 + X1) / 2, W0 + 23, -DZ / 2 - 15); root.add(topB);
  /* depth scale on the back wall, every 50 units */
  for (let y = 40; y < W0; y += 50) { const t = box(26, 2.4, 2, MAT.glow(0x3ee6ff), false); t.position.set(X0 + 30, y, -DZ / 2 + 1); root.add(t); }
  const water = mesh(new THREE.BoxGeometry(X1 - X0, W0, DZ), MAT.col(0x1b7fb8, {transparent: true, opacity: .5, depthWrite: false, roughness: .1, clearcoat: 1}), false); water.position.set((X0 + X1) / 2, W0 / 2, 0); water.renderOrder = 3; root.add(water);
  const surf = mesh(new THREE.PlaneGeometry(X1 - X0, DZ), MAT.fade(0x9fe9ff, .22), false); surf.rotation.x = -Math.PI / 2; surf.position.set((X0 + X1) / 2, W0 + .6, 0); surf.renderOrder = 4; root.add(surf);
  for (const [x, h, z] of [[-150, 96, -90], [-118, 62, -70], [96, 84, -100], [330, 110, -84], [362, 66, -104], [470, 78, -60]]) {
    const w = mesh(new THREE.ConeGeometry(9, h, 6), MAT.col(0x2f6b55, {roughness: .7})); w.position.set(x, h / 2, z); root.add(w);
  }
  for (const [x, r, z] of [[-40, 26, -60], [182, 18, -110], [440, 30, -100]]) { const st = sph(r, MAT.col(0x55606b, {roughness: .8})); st.scale.y = .6; st.position.set(x, r * .3, z); root.add(st); }
  /* ---- sensor rig: tripod, optical sensor at EYE, launcher tube at HAND ---- */
  const rig = G(); root.add(rig);
  const metal = MAT.col(0x8a96a3, {metalness: .8, roughness: .35}), dark = MAT.dark();
  const hub = V(-318, TOP + 120, 0);
  for (const [dx, dz] of [[-46, -34], [44, -30], [0, 52]]) { const leg = rod(metal, 4); leg.set(hub, V(hub.x + dx, TOP, dz)); rig.add(leg); }
  const mast = rod(metal, 6); mast.set(hub, V(EYE.x, EYE.y - 22, 0)); rig.add(mast);
  const head = box(64, 40, 44, dark); head.position.set(EYE.x - 14, EYE.y, 0); rig.add(head);
  const lensR = cyl(13, 13, 16, metal, 24); lensR.rotation.z = Math.PI / 2; lensR.position.set(EYE.x + 22, EYE.y, 0); rig.add(lensR);
  const lensG = new THREE.Mesh(new THREE.CircleGeometry(10, 24), MAT.glow(0x3ee6ff)); lensG.rotation.y = Math.PI / 2; lensG.position.set(EYE.x + 30.5, EYE.y, 0); rig.add(lensG);
  const led = sph(3.2, MAT.glow(0xff5f57), 8, false); led.position.set(EYE.x - 30, EYE.y + 14, 22.5); rig.add(led);
  const arm = rod(metal, 5); arm.set(V(EYE.x - 10, EYE.y - 20, 0), V(HAND.x - 30, HAND.y, 0)); rig.add(arm);
  const tube = cyl(10, 10, 74, dark, 20); rig.add(tube);
  const crate = box(84, 52, 70, MAT.col(0x2f3a45, {roughness: .6})); crate.position.set(-452, TOP + 26, 50); root.add(crate);
  const crateL = box(86, 6, 72, MAT.glow(0x3ee6ff), false); crateL.position.set(-452, TOP + 40, 50); root.add(crateL);
  const inBucket = [0, 1, 2].map((i) => { const f = makeFish(COL[i]); f.scale.setScalar(.5); f.rotation.z = .2; f.position.set(-452, TOP + 60 + i * 14, 50); f.visible = false; root.add(f); return f; });

  /* ---- spear, aim, splash ---- */
  const spear = G(); root.add(spear);
  const shaft = cyl(2.4, 2.4, 250, MAT.col(0xd7dee5, {metalness: .9, roughness: .25}), 8); shaft.rotation.z = -Math.PI / 2; shaft.position.x = -137; spear.add(shaft);
  const tipM = mesh(new THREE.ConeGeometry(7, 26, 10), MAT.steel()); tipM.rotation.z = -Math.PI / 2; tipM.position.x = -13; spear.add(tipM);
  const ret = G(); root.add(ret); ret.visible = false;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(22, 2.6, 8, 40), new THREE.MeshBasicMaterial({color: 0xff3b30, toneMapped: false, depthTest: false, transparent: true})); ring.renderOrder = 10; ret.add(ring);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(4.5, 10, 8), ring.material); dot.renderOrder = 10; ret.add(dot);
  const aimLine = dashed(0xff3b30); root.add(aimLine); aimLine.visible = false;
  const drops = Array.from({length: 10}, () => { const d = sph(5, MAT.fade(0xffffff, .9), 8, false); d.visible = false; d.v = V(); root.add(d); return d; });
  /* ---- 揭秘: light path ---- */
  const exG = G(); exG.visible = false; root.add(exG);
  const glow = new THREE.MeshBasicMaterial({color: 0xffe14a, toneMapped: false, depthTest: false, transparent: true});
  const rayW = rod(glow, 3.4), rayA = rod(glow, 3.4); rayW.renderOrder = rayA.renderOrder = 8; exG.add(rayW, rayA);
  const ext = dashed(0xffffff); exG.add(ext);
  const pulses = [0, 1, 2].map(() => { const p = new THREE.Mesh(new THREE.SphereGeometry(7, 12, 10), new THREE.MeshBasicMaterial({color: 0xffffff, toneMapped: false, depthTest: false, transparent: true})); p.renderOrder = 9; exG.add(p); return p; });

  const fishG = G(); root.add(fishG);
  let fishes = [], need = 1, got = 0, spears = Infinity, throws = 0, misses = 0, stage = 0, t = 0;
  let aiming = false, fly = null, cool = 0, hintPin = null, exOn = false, exStep = 0, warned = false;
  const aim = V(150, 150, 0), tip = V(), tmp = V();

  function setup(list) {
    for (const f of fishes) { fishG.remove(f.model, f.ghost); kill(f.model); kill(f.ghost); }
    fishes = list.map((s, i) => {
      const model = makeFish(COL[i % 3]), ghost = makeFish(0, true); ghost.visible = false; fishG.add(model, ghost);
      return {real: V(s.x, s.y, 0), y0: s.y, vx: s.vx || 0, xa: s.xa, xb: s.xb, model, ghost, caught: false, gone: false, reveal: 0, ph: i * 1.7};
    });
    got = 0; fly = null; aiming = false; cool = 0; ret.visible = aimLine.visible = false; exG.visible = false; exOn = false;
    inBucket.forEach((f) => { f.visible = false; });
    aim.set(150, 150, 0);
  }
  const showInfo = () => g.info(`命中 <b>${got}/${need}</b>${isFinite(spears) ? ` · 剩余 <b>${spears}</b> 发` : ''}`);
  const setAim = (pt) => aim.set(clamp(pt.x, X0 + 30, X1 - 16), clamp(pt.y, 10, W0 - 6), 0);

  function throwSpear() {
    if (fly || cool > 0 || (isFinite(spears) && spears <= 0)) return;
    const dir = aim.clone().sub(HAND).normalize(); if (dir.x < .05 || dir.y > -.02) return;
    fly = {dir, s: 150, len: Math.min((5 - HAND.y) / dir.y, (X1 - 6 - HAND.x) / dir.x), state: 'fly', t: 0, wet: false, fish: null};
    throws++; if (isFinite(spears)) spears--; showInfo(); g.sfx.whoosh();
    if (hintPin) { hintPin.remove(); hintPin = null; }
  }
  function splash(p) {
    g.sfx.splash();
    drops.forEach((d, i) => { d.visible = true; d.position.copy(p); d.v.set((i - 4.5) * 34, 240 + (i % 3) * 90, (i % 2 ? 1 : -1) * 40); });
  }
  function onHit(f) {
    f.caught = true; fly.state = 'hit'; fly.t = 0; fly.fish = f; f.model.position.copy(f.real); f.ghost.visible = false;
    g.sfx.hit(); g.shake(); g.pop('命中', f.real, 'good'); const s = g.toScreen(f.real); g.burst(18, s.x, s.y);
  }
  function onMiss() {
    fly.state = 'stuck'; fly.t = 0; misses++; g.sfx.miss();
    let best = null, bd = 0;
    for (const f of fishes) { if (f.caught) continue; const dy = HAND.y + fly.dir.y * (f.real.x - HAND.x) / fly.dir.x - f.real.y; if (!best || Math.abs(dy) < Math.abs(bd)) { best = f; bd = dy; } }
    if (!best) return;
    g.pop(bd > 0 ? '偏高' : '偏低', tip, 'bad');
    if (stage < 2) {
      best.reveal = 1.6;
      const p = g.pin('真实位置', best.real.clone().add(V(0, -30, 0)), {cls: 'lbl dn hot'}); g.after(1.6, () => p.remove());
    }
    if (stage === 0) g.feedback(bd > 0 ? '轨迹从目标<b>上方</b>经过。真实位置比观测到的位置更深。' : '这次偏低了，修正量小一些。');
  }

  function update(dt, playing) {
    t += dt; cool = Math.max(0, cool - dt);
    for (const f of fishes) {
      if (f.gone) continue;
      const face = f.vx < 0 ? -1 : 1;
      if (!f.caught) {
        if (f.vx && playing) { f.real.x += f.vx * dt; if (f.real.x > f.xb) { f.real.x = f.xb; f.vx = -Math.abs(f.vx); } else if (f.real.x < f.xa) { f.real.x = f.xa; f.vx = Math.abs(f.vx); } }
        f.real.y = f.y0 + Math.sin(t * 1.7 + f.ph) * 4;
        const s = seen(f.real);
        f.model.position.copy(exOn ? f.real : s.img); f.model.scale.x = face;
        f.reveal = Math.max(0, f.reveal - dt);
        f.ghost.visible = exOn ? exStep >= 1 : f.reveal > 0; f.ghost.position.copy(exOn ? s.img : f.real); f.ghost.scale.x = face;
        f.ghost.position.z = 2;
      }
      f.model.userData.piv.rotation.y = Math.sin(t * (f.caught ? 30 : 8) + f.ph) * (f.caught ? .7 : .45);
    }
    /* spear */
    const dir = fly ? fly.dir : tmp.copy(aim).sub(HAND).normalize();
    if (fly) {
      fly.t += dt;
      if (fly.state === 'fly') {
        const step = 1500 * dt, n = Math.max(1, Math.ceil(step / 10));
        for (let k = 0; k < n && fly.state === 'fly'; k++) {
          fly.s = Math.min(fly.len, fly.s + step / n); tip.copy(HAND).addScaledVector(dir, fly.s);
          if (!fly.wet && tip.y < W0) { fly.wet = true; splash(tip); }
          if (tip.y < W0) for (const f of fishes) if (!f.caught && ((tip.x - f.real.x) / 46) ** 2 + ((tip.y - f.real.y) / 25) ** 2 < 1) { onHit(f); break; }
          if (fly.state === 'fly' && fly.s >= fly.len) onMiss();
        }
      } else if (fly.state === 'hit') {
        fly.fish.model.rotation.z = Math.sin(fly.t * 44) * .22;
        if (fly.t > .42) { fly.state = 'back'; fly.t = 0; }
      } else if (fly.state === 'back') {
        fly.s = Math.max(150, fly.s - 2200 * dt); tip.copy(HAND).addScaledVector(dir, fly.s);
        fly.fish.model.position.copy(tip).addScaledVector(dir, -12);
        if (fly.s <= 150) {
          const f = fly.fish; f.gone = true; f.model.visible = false; fly = null; cool = .12;
          if (inBucket[got]) inBucket[got].visible = true;
          got++; g.sfx.coin(); showInfo();
          if (stage === 0 && playing && misses) g.feedback('命中。真实位置在观测位置的<b>下方</b>。');
          if (got >= need && playing) g.after(.45, () => g.clear());
        }
      } else if (fly.t > .75) {
        fly = null; cool = .1;
        if (playing && isFinite(spears) && spears <= 0 && got < need) g.fail(`弹药耗尽，命中 ${got}/${need}。观测到的位置比真实位置浅，瞄准点要放在它的下方。`);
      }
    }
    if (!fly) tip.copy(HAND).addScaledVector(dir, 150);
    spear.position.copy(tip); spear.rotation.z = Math.atan2(dir.y, dir.x);
    tube.position.copy(HAND).addScaledVector(dir, 18); tube.rotation.z = Math.atan2(dir.y, dir.x) - Math.PI / 2;
    ret.visible = aimLine.visible = (aiming && !fly) || (exOn && exStep >= 2);
    if (ret.visible) { ret.position.copy(aim); ret.position.z = 4; ring.scale.setScalar(1 + Math.sin(t * 10) * .08); aimLine.set(HAND, aim); }
    for (const d of drops) { if (!d.visible) continue; d.v.y -= 900 * dt; d.position.addScaledVector(d.v, dt); if (d.position.y < W0 - 4) d.visible = false; }
    /* 揭秘 */
    if (exOn && fishes[0] && !fishes[0].gone) {
      const f = fishes[0], s = seen(f.real);
      rayW.set(f.real, s.S); rayA.set(s.S, EYE); ext.set(s.S, s.img); ext.visible = exStep >= 1;
      const l1 = f.real.distanceTo(s.S), L = l1 + s.S.distanceTo(EYE);
      pulses.forEach((p, i) => { const d = ((t * 360) + i * L / 3) % L; if (d < l1) p.position.lerpVectors(f.real, s.S, d / l1); else p.position.lerpVectors(s.S, EYE, (d - l1) / (L - l1)); });
      if (exStep >= 2) aim.copy(f.real);
    }
  }

  setup([{x: 230, y: 104}]);
  const frame = () => (g.portrait ? {c: [0, 270, 0], w: 980, h: 600} : {c: [20, 262, 0], w: 1130, h: 570});
  const EX = {x: 250, y: 92};
  return {
    root, bg: ['#0a131c', '#10202e', '#173246'],
    stages: [
      {goal: '点击水下目标发射，命中 <b>1</b> 个', hint: '光从水中射入空气时会偏折，你看到的位置不是真实位置。先试一发，看轨迹从哪一侧经过。', frame, start() {
        stage = 0; need = 1; spears = Infinity; misses = 0; setup([{x: 230, y: 104}]); showInfo();
      }},
      {goal: '3 个目标深浅不同，<b>8 发</b>以内全部命中', hint: '目标越深、离观测镜越远，观测位置和真实位置差得越多，瞄准点要放得更低。', frame, start() {
        stage = 1; need = 3; spears = 8; misses = 0; setup([{x: 20, y: 62}, {x: 240, y: 150}, {x: 430, y: 188}]); showInfo();
      }},
      {goal: '目标开始移动，<b>60 秒</b>内命中 3 个', hint: '瞄准点放在观测位置的正下方，深的目标多放一些。发射速度很快，不用提前量。', frame, start() {
        stage = 2; need = 3; spears = Infinity; misses = 0;
        setup([{x: 300, y: 182, vx: -52, xa: 150, xb: 450}, {x: 60, y: 122, vx: 66, xa: 0, xb: 330}, {x: 0, y: 60, vx: 44, xa: -130, xb: 150}]); showInfo();
        g.timer(60, () => g.fail(`时间到，命中 ${got}/${need}。观测到的位置比真实位置浅，瞄准点要放在它的下方。`));
      }},
    ],
    update,
    down(pt) {
      if (!pt || fly || cool > 0) return;
      if (pt.y > W0 + 70 || pt.x < X0 - 30 || pt.x > X1 + 30) { if (!warned) { warned = true; g.toast('点击水中的位置发射'); } return; }
      aiming = true; setAim(pt);
    },
    move(pt) { if (aiming && pt) setAim(pt); },
    up(pt) { if (!aiming) return; if (pt) setAim(pt); aiming = false; throwSpear(); },
    explain: {
      frame,
      start() { stage = 3; setup([EX]); exOn = true; exStep = 0; exG.visible = true; },
      steps: [
        {t: '目标反射的光从水中斜射入空气，在水面发生偏折，这就是<b>光的折射</b>。光进入空气后<b>远离法线</b>。', on() {
          exStep = 0; g.pin('折射点', seen(V(EX.x, EX.y, 0)).S.add(V(0, 22, 0)), {cls: 'lbl yel'});
          g.pin('真实位置', V(EX.x, EX.y - 30, 0), {cls: 'lbl dn'});
        }},
        {t: '观测镜（和人眼一样）默认光沿直线传播，沿进入的光线反向延长，得到的是目标的<b>虚像</b>，位置比真实目标<b>浅</b>。', on() {
          exStep = 1; g.pin('观测位置（像）', seen(V(EX.x, EX.y, 0)).img.add(V(0, 30, 0)), {cls: 'lbl hot'});
        }},
        {t: '所以要瞄准观测位置的<b>下方</b>。目标越深、观察角度越斜，偏差越大。池水看起来比实际浅，也是同一个原因。', on() { exStep = 2; }},
      ],
    },
    perf: () => { const acc = 7 / Math.max(7, throws); return {score: clamp((acc - .35) / .5, 0, 1), text: `${throws} 发命中 7 个 · 命中率 ${Math.round(acc * 100)}%`, tip: '命中率到 85% 以上这一项拿满分：先估算偏差再发射。'}; },
    dispose() { fishes.forEach((f) => { kill(f.model); kill(f.ghost); }); },
    dbg: () => ({throws, got, need, spears, fish: fishes.filter((f) => !f.gone).map((f) => ({real: f.real.clone(), img: seen(f.real).img, caught: f.caught}))}),
  };
}
