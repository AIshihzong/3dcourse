/* 331 叉鱼高手: the fish you see from the bank is a refracted image, shallower than the real fish. */
import * as THREE from 'three';
import {MAT, G, V, clamp, mesh, box, cyl, sph, rod} from '../../kit.js';

const X0 = -210, X1 = 520, W0 = 240, N = 1.33, DZ = 300, BANK = W0 + 30, TOP = BANK + 14;
const EYE = V(-296, TOP + 176, 0), HAND = V(-258, TOP + 140, 0);
const COL = [0xff7a3c, 0xffc233, 0xff5e7e];

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
  const f = G(), m = ghost ? MAT.fade(0xffffff, .62) : MAT.col(color, {roughness: .35});
  const body = mesh(new THREE.SphereGeometry(1, 24, 16), m, !ghost); body.scale.set(42, 20, 13); f.add(body);
  const piv = G(); piv.position.x = -38; f.add(piv);
  const tail = mesh(new THREE.ConeGeometry(19, 30, 4), m, !ghost); tail.rotation.z = -Math.PI / 2; tail.position.x = -16; piv.add(tail);
  const fin = mesh(new THREE.ConeGeometry(9, 18, 4), m, !ghost); fin.position.set(-2, 23, 0); f.add(fin);
  if (!ghost) {
    const e = sph(5.5, MAT.white(), 12, false); e.position.set(27, 5, 9.5); const p = sph(2.7, MAT.dark(), 10, false); p.position.set(29.6, 5, 13.2); f.add(e, p);
  } else f.traverse((o) => { o.renderOrder = 7; });
  f.userData.piv = piv; return f;
}
const kill = (o) => o.traverse((x) => { x.geometry?.dispose(); x.material?.dispose?.(); });

export function buildFish(g) {
  const root = G();
  /* ---- pond, banks, sky ---- */
  const earth = MAT.col(0xb58a5c, {roughness: .9, clearcoat: 0}), grass = MAT.col(0x7ccf6b, {roughness: .8, clearcoat: 0});
  const sand = box(X1 - X0 + 140, 40, DZ + 60, MAT.col(0xf2dc9c, {roughness: .95, clearcoat: 0})); sand.position.set((X0 + X1) / 2 + 20, -17, 0); root.add(sand);
  const bankL = box(330, BANK, DZ + 60, earth); bankL.position.set(X0 - 165, BANK / 2, 0); root.add(bankL);
  const topL = box(338, 14, DZ + 68, grass); topL.position.set(X0 - 165, BANK + 7, 0); root.add(topL);
  const bankR = box(70, W0 + 16, DZ + 60, earth); bankR.position.set(X1 + 35, (W0 + 16) / 2, 0); root.add(bankR);
  const topR = box(78, 14, DZ + 68, grass); topR.position.set(X1 + 35, W0 + 23, 0); root.add(topR);
  const back = box(X1 - X0, W0 + 16, 30, MAT.col(0x9a7448, {roughness: .9, clearcoat: 0})); back.position.set((X0 + X1) / 2, (W0 + 16) / 2, -DZ / 2 - 15); root.add(back);
  const topB = box(X1 - X0, 14, 38, grass); topB.position.set((X0 + X1) / 2, W0 + 23, -DZ / 2 - 15); root.add(topB);
  const water = mesh(new THREE.BoxGeometry(X1 - X0, W0, DZ), MAT.col(0x2aa3e8, {transparent: true, opacity: .42, depthWrite: false, roughness: .1, clearcoat: 1}), false); water.position.set((X0 + X1) / 2, W0 / 2, 0); water.renderOrder = 3; root.add(water);
  const surf = mesh(new THREE.PlaneGeometry(X1 - X0, DZ), MAT.fade(0xe6f7ff, .34), false); surf.rotation.x = -Math.PI / 2; surf.position.set((X0 + X1) / 2, W0 + .6, 0); surf.renderOrder = 4; root.add(surf);
  for (const [x, h, z] of [[-150, 96, -90], [-118, 62, -70], [96, 84, -100], [330, 110, -84], [362, 66, -104], [470, 78, -60]]) {
    const w = mesh(new THREE.ConeGeometry(11, h, 6), MAT.col(0x3fae6a, {roughness: .7})); w.position.set(x, h / 2, z); root.add(w);
  }
  for (const [x, r, z] of [[-40, 26, -60], [182, 18, -110], [440, 30, -100]]) { const s = sph(r, MAT.col(0x9aa3ad, {roughness: .8})); s.scale.y = .6; s.position.set(x, r * .3, z); root.add(s); }
  for (const [x, y, s] of [[-300, 760, 1.1], [240, 820, 1.5], [640, 700, .9]]) {
    const c = G(); for (const [dx, r] of [[-70, 46], [0, 64], [74, 42]]) { const b = mesh(new THREE.SphereGeometry(r, 16, 12), MAT.fade(0xffffff, .9), false); b.position.x = dx; b.scale.y = .62; c.add(b); }
    c.position.set(x, y, -700); c.scale.setScalar(s); root.add(c);
  }
  /* ---- the fisher ---- */
  const man = G(); man.position.set(-330, TOP, 0); root.add(man);
  for (const s of [-1, 1]) { const leg = cyl(11, 11, 74, MAT.col(0x3a4a8c)); leg.position.set(s * 15, 37, 0); man.add(leg); }
  const body = cyl(28, 34, 86, MAT.col(0xff8a3c)); body.position.y = 117; man.add(body);
  const head = sph(31, MAT.col(0xffd9b0, {clearcoat: 0, roughness: .7})); head.position.y = 178; man.add(head);
  const hat = mesh(new THREE.ConeGeometry(62, 32, 28), MAT.col(0xe8c66a, {roughness: .8})); hat.position.y = 214; man.add(hat);
  const eye = sph(4.4, MAT.dark(), 10, false); eye.position.set(27, 180, 13); man.add(eye);
  const arm = rod(MAT.col(0xff8a3c), 9); arm.set(V(14, 150, 18), V(HAND.x + 330, HAND.y - TOP, 12)); man.add(arm);
  const fist = sph(11, MAT.col(0xffd9b0, {clearcoat: 0})); fist.position.set(HAND.x + 330, HAND.y - TOP, 12); man.add(fist);
  const bucket = mesh(new THREE.CylinderGeometry(38, 28, 54, 24, 1, true), MAT.col(0x4c7bd9, {side: THREE.DoubleSide})); bucket.position.set(-452, TOP + 27, 50); root.add(bucket);
  const inBucket = [0, 1, 2].map((i) => { const f = makeFish(COL[i]); f.scale.setScalar(.62); f.rotation.z = 1.2 + i * .25; f.position.set(-464 + i * 13, TOP + 52, 50 + (i - 1) * 8); f.visible = false; root.add(f); return f; });

  /* ---- spear, aim, splash ---- */
  const spear = G(); root.add(spear);
  const shaft = cyl(2.8, 2.8, 250, MAT.wood(), 8); shaft.rotation.z = -Math.PI / 2; shaft.position.x = -137; spear.add(shaft);
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
  const showInfo = () => g.info(`叉中 <b>${got}/${need}</b>${isFinite(spears) ? ` · 还剩 ${spears} 把叉` : ''}`);
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
    g.sfx.hit(); g.shake(); g.pop('叉中了！', f.real, 'good'); const s = g.toScreen(f.real); g.burst(18, s.x, s.y);
  }
  function onMiss() {
    fly.state = 'stuck'; fly.t = 0; misses++; g.sfx.miss();
    let best = null, bd = 0;
    for (const f of fishes) { if (f.caught) continue; const dy = HAND.y + fly.dir.y * (f.real.x - HAND.x) / fly.dir.x - f.real.y; if (!best || Math.abs(dy) < Math.abs(bd)) { best = f; bd = dy; } }
    if (!best) return;
    g.pop(bd > 0 ? '叉高了！' : '叉低了！', tip, 'bad');
    if (stage < 2) {
      best.reveal = 1.6;
      const p = g.pin('真正的鱼在这儿', best.real.clone().add(V(0, -30, 0)), {cls: 'lbl dn hot'}); g.after(1.6, () => p.remove());
    }
    if (stage === 0) g.say(bd > 0 ? '叉从鱼的上面擦过去了。真正的鱼在更深的地方，<b>往下瞄一点</b>再试！' : '这回又太低了。瞄在看到的鱼下面<b>一点点</b>就行。');
    else if (misses === 2 && bd > 0) g.say('鱼越深、离得越远，看到的位置偏得越多，<b>要往下瞄得更多</b>。');
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
          if (stage === 0 && playing) g.say('叉中了！原来要瞄准<b>看到的鱼的下方</b>。');
          if (got >= need && playing) g.after(.45, () => g.clear());
        }
      } else if (fly.t > .75) {
        fly = null; cool = .1;
        if (playing && isFinite(spears) && spears <= 0 && got < need) g.fail('鱼叉用完了。记住：真正的鱼比看到的更深，要瞄准它的下方。');
      }
    }
    if (!fly) tip.copy(HAND).addScaledVector(dir, 150);
    spear.position.copy(tip); spear.rotation.z = Math.atan2(dir.y, dir.x);
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
    root, bg: ['#6fc6ff', '#b9e6ff', '#eaf8ff'],
    stages: [
      {goal: '看准水里的鱼，<b>点一下</b>就出叉！', frame, start() {
        stage = 0; need = 1; spears = Infinity; misses = 0; setup([{x: 230, y: 104}]); showInfo();
        hintPin = g.pin('点这条鱼', seen(V(230, 104, 0)).img.add(V(0, 44, 0)), {cls: 'hand'});
      }},
      {goal: '三条鱼<b>深浅不同</b>，用 8 把叉全部叉中！', frame, start() {
        stage = 1; need = 3; spears = 8; misses = 0; setup([{x: 20, y: 62}, {x: 240, y: 150}, {x: 430, y: 188}]); showInfo();
      }},
      {goal: '鱼游起来了！<b>60 秒</b>内叉中 3 条', frame, start() {
        stage = 2; need = 3; spears = Infinity; misses = 0;
        setup([{x: 300, y: 182, vx: -52, xa: 150, xb: 450}, {x: 60, y: 122, vx: 66, xa: 0, xb: 330}, {x: 0, y: 60, vx: 44, xa: -130, xb: 150}]); showInfo();
        g.timer(60, () => g.fail('时间到了，鱼都游走了。记住：真正的鱼比看到的更深，要瞄准它的下方。'));
      }},
    ],
    update,
    down(pt) {
      if (!pt || fly || cool > 0) return;
      if (pt.y > W0 + 70 || pt.x < X0 - 30 || pt.x > X1 + 30) { if (!warned) { warned = true; g.toast('点水里的鱼，就会朝那里出叉'); } return; }
      aiming = true; setAim(pt);
    },
    move(pt) { if (aiming && pt) setAim(pt); },
    up(pt) { if (!aiming) return; if (pt) setAim(pt); aiming = false; throwSpear(); },
    explain: {
      frame,
      start() { stage = 3; setup([EX]); exOn = true; exStep = 0; exG.visible = true; },
      steps: [
        {t: '鱼身上的光从水里斜着射进空气时，在水面<b>拐了个弯</b>。这叫光的折射。', on() {
          exStep = 0; g.pin('光在这里拐弯', seen(V(EX.x, EX.y, 0)).S.add(V(0, 22, 0)), {cls: 'lbl yel'});
          g.pin('真正的鱼', V(EX.x, EX.y - 30, 0), {cls: 'lbl dn'});
        }},
        {t: '眼睛以为光是<b>直着</b>来的，顺着光看过去，看到的“鱼”就比真正的鱼<b>浅</b>。', on() {
          exStep = 1; g.pin('看到的鱼（像）', seen(V(EX.x, EX.y, 0)).img.add(V(0, 30, 0)), {cls: 'lbl hot'});
        }},
        {t: '所以叉鱼不能对准看到的鱼，要瞄准它的<b>下方</b>。鱼越深，往下瞄得越多。', on() { exStep = 2; }},
      ],
    },
    perf: () => ({ok: throws <= 11, label: `全程出叉不超过 11 次（你用了 ${throws} 次）`}),
    dispose() { fishes.forEach((f) => { kill(f.model); kill(f.ghost); }); },
    dbg: () => ({throws, got, need, spears, fish: fishes.filter((f) => !f.gone).map((f) => ({real: f.real.clone(), img: seen(f.real).img, caught: f.caught}))}),
  };
}
