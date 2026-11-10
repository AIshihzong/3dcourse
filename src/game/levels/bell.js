/* 327 静音行动: pump the air out so the bell cannot be heard; then race sound through air, water and steel. */
import * as THREE from 'three';
import {MAT, G, V, TAU, clamp, mesh, box, cyl, sph, rod, canvasTex} from '../../kit.js';

const JX = -230, CX = 360, PX = -560;
const LANES = [{n: '空气', v: 340, y: 330, c: 0xdfeaf5, dots: 26}, {n: '水', v: 1500, y: 210, c: 0x6fb6ee, dots: 60}, {n: '钢铁', v: 5200, y: 90, c: 0x9aa3ad, dots: 130}];
const RX0 = -500, RX1 = 500, DIST = 1700;
const LEAKS = [[-112, 118, 114], [92, 196, 130], [4, 268, 108], [124, 96, 102], [-64, 226, 132], [58, 140, 150], [-128, 62, 96]];

export function buildBell(g) {
  const root = G(), mainG = G(), raceG = G(); root.add(mainG, raceG); raceG.visible = false;
  let t = 0, air = 100, wake = 0, awake = false, stage = 0, wakeRate = .2, hold = 0, pumpK = 0, ui = null, woke = 0;
  let leaks = [], plan = [], leakT = 0, sealed = 0, exOn = false, exRace = false;
  let race = null, picks = [], lanePins = [];

  /* ---------------- table, jar, bell ---------------- */
  const table = box(1560, 26, 620, MAT.wood()); table.position.y = -13; root.add(table);
  const jar = G(); jar.position.x = JX; mainG.add(jar);
  const plate = cyl(186, 196, 22, MAT.dark(), 48); plate.position.y = 11; jar.add(plate);
  const dome = mesh(new THREE.SphereGeometry(160, 48, 24, 0, TAU, 0, Math.PI / 2), MAT.glass(.2), false); dome.position.y = 172; jar.add(dome);
  const wall = mesh(new THREE.CylinderGeometry(160, 160, 150, 48, 1, true), MAT.glass(.2), false); wall.position.y = 97; jar.add(wall);
  const knob = sph(17, MAT.dark()); knob.position.y = 338; jar.add(knob);
  const post = cyl(5, 5, 150, MAT.steel()); post.position.y = 97; jar.add(post);
  const bell = mesh(new THREE.SphereGeometry(52, 32, 14, 0, TAU, 0, Math.PI / 2), MAT.brass()); bell.position.y = 176; jar.add(bell);
  const hub = sph(9, MAT.dark()); hub.position.y = 228; jar.add(hub);
  const hammer = G(); hammer.position.set(66, 120, 0); jar.add(hammer);
  const hr = rod(MAT.steel(), 3); hr.set(V(), V(0, 58, 0)); hammer.add(hr);
  const hb = sph(10, MAT.dark()); hb.position.y = 58; hammer.add(hb);
  const NA = 70, airM = new THREE.InstancedMesh(new THREE.SphereGeometry(4, 8, 6), MAT.col(0x7fa8d8), NA); jar.add(airM);
  const airP = Array.from({length: NA}, () => { const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * 130; return {p: V(Math.cos(a) * r, 34 + Math.random() * 190, Math.sin(a) * r), v: V(Math.random() - .5, Math.random() - .5, Math.random() - .5).multiplyScalar(110)}; });
  const dm = new THREE.Object3D();
  /* sound waves spreading from the bell: seen from the front as growing circles */
  const rings = Array.from({length: 5}, (_, i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, .012, 6, 96), new THREE.MeshBasicMaterial({color: 0xff5a4d, transparent: true, depthWrite: false, toneMapped: false})); m.userData.o = i / 5; m.position.set(JX, 190, 40); m.renderOrder = 6; mainG.add(m); return m; });
  /* pump */
  const pump = G(); pump.position.set(PX, 0, 60); mainG.add(pump);
  const pb = box(120, 26, 100, MAT.dark()); pb.position.y = 13; pump.add(pb);
  const pc = cyl(34, 34, 170, MAT.col(0x4c7bd9), 32); pc.position.y = 111; pump.add(pc);
  const handle = G(); pump.add(handle);
  const hrod = cyl(6, 6, 150, MAT.steel()); hrod.position.y = 75; handle.add(hrod);
  const hbar = cyl(9, 9, 120, MAT.col(0xff6b5e)); hbar.rotation.z = Math.PI / 2; hbar.position.y = 152; handle.add(hbar);
  const hose = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(PX + 50, 22, 60), V(PX + 130, 10, 80), V(JX - 250, 10, 60), V(JX - 180, 14, 20)]), 30, 8, 8), MAT.dark()); mainG.add(hose);
  /* the sleeping cat */
  const cat = G(); cat.position.set(CX, 0, 20); mainG.add(cat);
  const cushion = cyl(150, 160, 26, MAT.col(0x7a55e8, {roughness: .8, clearcoat: 0}), 40); cushion.position.y = 13; cat.add(cushion);
  const fur = MAT.col(0xf4a650, {roughness: .8, clearcoat: 0}), furL = MAT.col(0xfff1dc, {roughness: .8, clearcoat: 0});
  const cbody = sph(1, fur, 28); cbody.scale.set(104, 54, 78); cbody.position.set(-14, 74, 0); cat.add(cbody);
  const chead = G(); chead.position.set(68, 78, 46); cat.add(chead);
  const hd = sph(44, fur, 28); chead.add(hd);
  for (const s of [-1, 1]) { const ear = mesh(new THREE.ConeGeometry(15, 28, 4), fur); ear.position.set(s * 24, 42, 0); ear.rotation.z = -s * .25; chead.add(ear); }
  const muzzle = sph(17, furL, 16); muzzle.scale.set(1.25, .8, .7); muzzle.position.set(0, -12, 36); chead.add(muzzle);
  const nose = sph(4.5, MAT.col(0xff8a9a), 10, false); nose.position.set(0, -6, 48); chead.add(nose);
  const shut = [-1, 1].map((s) => { const e = box(15, 3.2, 3, MAT.dark(), false); e.position.set(s * 17, 6, 40.5); e.rotation.z = s * .18; chead.add(e); return e; });
  const open = [-1, 1].map((s) => { const e = G(); const w = sph(9, MAT.white(), 12, false); const p = sph(4.6, MAT.dark(), 10, false); p.position.z = 6.5; e.add(w, p); e.position.set(s * 17, 7, 37); e.visible = false; chead.add(e); return e; });
  const tail = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-108, 60, 10), V(-124, 44, 60), V(-70, 36, 96), V(0, 34, 98)]), 24, 11, 8), fur); cat.add(tail);

  /* ---------------- race lanes (小关 3) ---------------- */
  const laneObjs = LANES.map((L, i) => {
    const mat = i === 0 ? MAT.glass(.3) : i === 1 ? MAT.water(.72) : MAT.col(L.c, {metalness: .7, roughness: .35});
    const bar = mesh(new THREE.BoxGeometry(RX1 - RX0, 62, 62), mat, i === 2); bar.position.set(0, L.y, 0); raceG.add(bar);
    const tex = canvasTex(1024, 64, (c, w, h) => { c.fillStyle = i === 2 ? '#2d3340' : i === 1 ? '#0f5fa8' : '#5d7fa6'; let s = 7 + i * 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let k = 0; k < L.dots; k++) { const x = i === 2 ? (k % 65) * (w / 65) + 8 : rnd() * w, y = i === 2 ? (k < 65 ? 20 : 44) : 8 + rnd() * (h - 16); c.beginPath(); c.arc(x, y, i === 2 ? 4.5 : 5, 0, TAU); c.fill(); } });
    const face = mesh(new THREE.PlaneGeometry(RX1 - RX0, 62), new THREE.MeshBasicMaterial({map: tex, transparent: true, depthWrite: false, toneMapped: false}), false); face.position.set(0, L.y, 31.6); face.renderOrder = 5; raceG.add(face);
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(20, 20, 14), new THREE.MeshBasicMaterial({color: 0xffe14a, toneMapped: false, depthTest: false, transparent: true})); pulse.position.set(RX0, L.y, 34); pulse.renderOrder = 8; raceG.add(pulse);
    const flag = box(10, 96, 10, MAT.dark()); flag.position.set(RX1 + 16, L.y, 0); raceG.add(flag);
    return {pulse, T: DIST / L.v, done: false};
  });
  const hitBar = box(34, 340, 90, MAT.col(0xff6b5e)); hitBar.position.set(RX0 - 26, 210, 0); raceG.add(hitBar);

  /* ---------------- shared logic ---------------- */
  const L = () => air / 100;
  function showCat(up) {
    awake = up; shut.forEach((e) => { e.visible = !up; }); open.forEach((e) => { e.visible = up; });
    chead.position.y = up ? 108 : 78; chead.rotation.x = up ? -.1 : .12;
  }
  function panelUI(extra = '') {
    ui = g.ctrl(`<div class="panel"><div class="meter air"><span>罩里的空气</span><div class="bar"><i id="mAir"></i></div><b id="vAir">100%</b></div><div class="meter cat"><span>小猫快醒了</span><div class="bar"><i id="mCat"></i></div><b id="vCat"></b></div>${extra}</div><button class="big-btn" type="button" id="bPump">抽气！<small>连续快点</small></button>`);
    ui.querySelector('#bPump').addEventListener('pointerdown', (e) => { e.preventDefault(); doPump(); });
  }
  function doPump() {
    if (awake) return;
    air = Math.max(0, air - Math.max(3, air * .11)); pumpK = 1; g.sfx.pump();
  }
  function resetMain(a) {
    mainG.visible = true; raceG.visible = false; air = a; wake = 0; hold = 0; showCat(false);
    leaks.forEach((k) => { k.pin?.remove(); jar.remove(k.patch, k.spot); }); leaks = []; sealed = 0;
    lanePins.forEach((p) => p.remove()); lanePins = []; race = null; exOn = exRace = false;
  }
  function addLeak(i) {
    const [x, y, z] = LEAKS[i % LEAKS.length];
    const spot = new THREE.Mesh(new THREE.SphereGeometry(9, 12, 10), new THREE.MeshBasicMaterial({color: 0xff3b30, toneMapped: false})); spot.position.set(x, y, z); jar.add(spot);
    const k = {spot, patch: null, open: true};
    k.pin = g.pin('漏', V(JX + x, y, z), {cls: 'leak', tap: () => {
      if (!k.open) return; k.open = false; k.pin.remove(); k.pin = null; jar.remove(spot); sealed++;
      const patch = mesh(new THREE.CircleGeometry(20, 20), new THREE.MeshBasicMaterial({color: 0xffd23f, toneMapped: false, side: THREE.DoubleSide}), false);
      patch.position.set(x, y, z + 2); patch.lookAt(JX * 0 + x * 2, y, z * 2 + 200); k.patch = patch; jar.add(patch);
      g.sfx.seal(); g.pop('封住了！', V(JX + x, y + 20, z), 'good'); showLeakInfo();
    }});
    leaks.push(k); g.sfx.tick();
  }
  const showLeakInfo = () => g.info(`封住漏洞 <b>${sealed}/${plan.total}</b>`);
  function startRace() {
    race = {t: 0, end: false}; laneObjs.forEach((l) => { l.done = false; }); lanePins.forEach((p) => p.remove()); lanePins = [];
    g.sfx.hit();
  }
  function rankUI() {
    picks = [];
    ui = g.ctrl(`<div class="rank"><span id="rkT">谁第 1 个到终点？按名次从快到慢依次点</span><div class="chips">${LANES.map((l, i) => `<button class="ch" type="button" data-i="${i}">${l.n}</button>`).join('')}</div></div>`);
    ui.querySelectorAll('.ch').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i; if (race || picks.includes(i)) return;
      picks.push(i); b.classList.add('sel'); b.insertAdjacentHTML('beforeend', `<em>${picks.length}</em>`); g.sfx.tap();
      if (picks.length === 3) { ui.querySelector('#rkT').textContent = '预备……敲！'; g.after(.7, startRace); }
    }));
  }

  function update(dt, playing) {
    t += dt;
    const live = playing || exOn;
    /* jar, bell, air */
    if (mainG.visible) {
      if (exOn && !exRace) air = 50 + 50 * Math.cos(t * .9);
      if (playing && stage === 0) air = Math.min(100, air + 1.4 * dt);
      if (playing && stage === 1) {
        leakT += dt;
        while (plan.at < plan.times.length && leakT >= plan.times[plan.at]) addLeak(plan.at++);
        const n = leaks.filter((k) => k.open).length; air = Math.min(100, air + n * 12 * dt);
        g.sfx.hiss(n ? .5 + n * .25 : 0);
      }
      const loud = L();
      hammer.rotation.z = .62 + Math.sin(t * 60) * .16; bell.rotation.z = Math.sin(t * 60) * .012;
      rings.forEach((r) => { const k = (r.userData.o + t * .55) % 1; r.scale.setScalar(60 + k * 520); r.material.opacity = (1 - k) * .75 * loud; r.visible = loud > .04; });
      const n = Math.round(NA * loud);
      airP.forEach((a, i) => { a.p.addScaledVector(a.v, dt); if (Math.hypot(a.p.x, a.p.z) > 140) { a.v.x *= -1; a.v.z *= -1; a.p.addScaledVector(a.v, dt * 2); } if (a.p.y < 30 || a.p.y > 250) a.v.y *= -1; dm.position.copy(a.p); dm.scale.setScalar(i < n ? 1 : 0); dm.updateMatrix(); airM.setMatrixAt(i, dm.matrix); });
      airM.instanceMatrix.needsUpdate = true;
      pumpK = Math.max(0, pumpK - dt * 7); handle.position.y = 100 - pumpK * 70;
      g.sfx.bellGain(live ? loud * (exOn ? .55 : 1) : 0);
      /* the cat */
      if (playing && !awake) {
        wake = clamp(wake + (loud > .25 ? (loud - .25) * wakeRate : -.05) * dt, 0, 1);
        if (wake >= 1) { showCat(true); woke++; g.sfx.meow(); g.pop('喵！！', V(CX + 60, 190, 40), 'bad'); g.sfx.hiss(0); g.fail('铃声把小猫吵醒了。再快一点，把罩里的空气抽光！'); }
      }
      cbody.scale.y = 54 + Math.sin(t * 1.6) * 2.4;
      if (!awake) chead.rotation.z = Math.sin(t * 9) * .05 * clamp((wake - .45) * 3, 0, 1);
      if (ui && stage < 2) {
        const a = ui.querySelector('#mAir'); if (a) { a.style.width = air + '%'; ui.querySelector('#vAir').textContent = Math.round(air) + '%'; ui.querySelector('#mCat').style.width = wake * 100 + '%'; a.parentNode.parentNode.classList.toggle('ok', air <= 5); }
      }
      if (playing && stage === 0) { hold = air <= 5 ? hold + dt : 0; if (hold > .5) { air = 0; g.say('听！电铃还在敲，可是<b>一点声音也传不出来了</b>。'); g.clear(); } }
      if (playing && stage === 1 && plan.at >= plan.times.length && sealed >= plan.total) { hold = air <= 8 ? hold + dt : 0; if (hold > .4) g.clear(); }
    }
    /* race */
    if (raceG.visible) {
      if (exRace && !race) startRace();
      hitBar.rotation.z = race && race.t < .15 ? -.12 : 0;
      if (race) {
        race.t += dt;
        laneObjs.forEach((l, i) => {
          const k = Math.min(1, race.t / l.T); l.pulse.position.x = RX0 + k * (RX1 - RX0); l.pulse.scale.setScalar(1 + Math.sin(race.t * 30) * .15);
          if (k >= 1 && !l.done) { l.done = true; g.sfx.tick(); lanePins.push(g.pin(`${l.T.toFixed(2)} 秒`, V(RX1 + 70, LANES[i].y, 30), {cls: 'time'})); }
        });
        if (!race.end && race.t > LANES.length && laneObjs.every((l) => l.done)) {
          race.end = true;
          if (exRace) g.after(1.6, () => { race = null; });
          else if (picks.join() === '2,1,0') { g.say('猜对了！声音在<b>钢铁</b>里最快，水第二，空气最慢。'); g.after(.6, () => g.clear()); }
          else { g.sfx.wrong(); g.say('没猜对。看：<b>钢铁最快</b>，水第二，空气最慢。再排一次！'); g.after(1.5, () => { race = null; laneObjs.forEach((l) => { l.pulse.position.x = RX0; }); rankUI(); }); }
        }
      } else laneObjs.forEach((l) => { l.pulse.position.x = RX0; });
    }
  }

  const fMain = () => (g.portrait ? {c: [-60, 190, 0], w: 1190, h: 460} : {c: [-90, 185, 0], w: 1330, h: 430});
  const fRace = () => ({c: [20, 210, 0], w: 1300, h: 400});
  const fJar = () => ({c: [JX - 60, 185, 0], w: 760, h: 430});
  const lanePin = () => LANES.forEach((l) => g.pin(l.n, V(RX0 - 70, l.y + 44, 30), {cls: 'lbl'}));
  resetMain(100);
  return {
    root, bg: ['#ffd9a6', '#ffe9c9', '#fff4e2'],
    stages: [
      {goal: '闹铃响了！<b>快速连点“抽气”</b>，把罩里的空气抽光', frame: fMain, start() {
        stage = 0; wakeRate = .2; resetMain(100); panelUI(); g.sfx.bellStart();
        g.pin('z Z', V(CX + 96, 200, 40), {cls: 'zzz'}); g.pin('电铃', V(JX, 372, 0), {cls: 'lbl'});
      }},
      {goal: '罩子漏气了！<b>点住红点把它封上</b>，空气多了就接着抽', frame: fMain, start() {
        stage = 1; wakeRate = .3; resetMain(4); leakT = 0; plan = {times: [1.2, 4, 6.4, 8.6, 9.6, 11.8, 12.6], at: 0, total: 7};
        panelUI(); showLeakInfo(); g.sfx.bellStart(); g.pin('z Z', V(CX + 96, 200, 40), {cls: 'zzz'});
      }},
      {goal: '小猫睡着了。猜一猜：声音在<b>空气、水、钢铁</b>里，谁跑得最快？', frame: fRace, start() {
        stage = 2; resetMain(0); g.sfx.bellStop(); g.sfx.hiss(0); mainG.visible = false; raceG.visible = true; lanePin(); rankUI();
        g.info('赛道长 1700 米');
      }},
    ],
    update,
    explain: {
      frame: fJar,
      start() { resetMain(100); stage = 3; exOn = true; t = 0; g.sfx.bellStart(); },
      steps: [
        {t: '电铃一直在敲。可是空气被抽走后，铃声就<b>传不出来</b>了；空气放回去，铃声又响了。', on() { g.pin('电铃一直在振动', V(JX, 372, 0), {cls: 'lbl yel'}); }},
        {t: '声音要靠空气、水、钢铁这样的物质来传。什么都没有的地方叫真空，<b>真空不能传声</b>。', on() {}},
        {t: '声音在不同物质里快慢不一样：<b>固体最快，液体第二，气体最慢</b>。', frame: fRace, on() { g.sfx.bellStop(); exRace = true; mainG.visible = false; raceG.visible = true; lanePin(); }},
      ],
    },
    perf: () => ({ok: woke === 0, label: woke ? `一次也没有吵醒小猫（吵醒了 ${woke} 次）` : '一次也没有吵醒小猫'}),
    dispose() { g.sfx.bellStop(); g.sfx.hiss(0); },
    dbg: () => ({air, wake, stage, sealed, open: leaks.filter((k) => k.open).length, race: race && race.t, picks}),
  };
}
