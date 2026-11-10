/* 327 静音行动: pump the air out so the bell cannot be heard; then race sound through air, water and steel. */
import * as THREE from 'three';
import {MAT, G, V, TAU, clamp, mesh, box, cyl, sph, rod, canvasTex} from '../../kit.js';

const JX = -230, CX = 360, PX = -560;
const LANES = [{n: '空气', v: 340, y: 330, c: 0xdfeaf5, dots: 26}, {n: '水', v: 1500, y: 210, c: 0x6fb6ee, dots: 60}, {n: '钢铁', v: 5200, y: 90, c: 0x9aa3ad, dots: 130}];
const RX0 = -500, RX1 = 500, DIST = 1700;
const LEAKS = [[-112, 118, 114], [92, 196, 130], [4, 268, 108], [124, 96, 102], [-64, 226, 132], [58, 140, 150], [-128, 62, 96]];

export function buildBell(g) {
  const stats = g.stats;
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
  /* the external monitor: microphone on a stand + a dB display + an alarm beacon */
  const mon = G(); mon.position.set(CX, 0, 20); mainG.add(mon);
  const metal = MAT.col(0x8a96a3, {metalness: .8, roughness: .35});
  const base = cyl(60, 70, 16, MAT.dark(), 32); base.position.y = 8; mon.add(base);
  const pole = cyl(6, 6, 250, metal, 16); pole.position.set(-70, 125, 0); mon.add(pole);
  const boom = rod(metal, 5); boom.set(V(-70, 250, 0), V(-150, 262, 0)); mon.add(boom);
  const mic = cyl(15, 11, 58, MAT.dark(), 20); mic.rotation.z = Math.PI / 2; mic.position.set(-170, 262, 0); mon.add(mic);
  const grill = sph(17, MAT.col(0x55606b, {metalness: .6, roughness: .5}), 16); grill.position.set(-200, 262, 0); mon.add(grill);
  const caseM = box(190, 124, 30, MAT.col(0x1c242d, {roughness: .5})); caseM.position.set(40, 150, 0); mon.add(caseM);
  const legM = cyl(7, 7, 90, metal, 12); legM.position.set(40, 45, 0); mon.add(legM);
  let lastDb = -1, lastAlarm = null;
  const disp = canvasTex(380, 240, () => {});
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(172, 108), new THREE.MeshBasicMaterial({map: disp, toneMapped: false})); screen.position.set(40, 150, 15.6); mon.add(screen);
  const beacon = sph(15, MAT.glow(0x3a4450), 16, false); beacon.position.set(40, 226, 0); mon.add(beacon);
  function drawDisp(db, exp, alarm) {
    disp.redraw((c, w, h) => {
      c.fillStyle = alarm ? '#2a0c0c' : '#071318'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#5d7a86'; c.font = '600 22px ' + 'Menlo, Consolas, monospace'; c.textAlign = 'left'; c.fillText(alarm ? 'ALERT · 暴露' : 'MONITOR · 罩外', 18, 36);
      c.fillStyle = alarm ? '#ff5f57' : db > 35 ? '#ffb547' : '#3ee6ff'; c.font = '700 96px Menlo, Consolas, monospace'; c.textAlign = 'right'; c.fillText(String(db), 300, 142);
      c.font = '700 30px Menlo, Consolas, monospace'; c.textAlign = 'left'; c.fillText('dB', 308, 142);
      c.fillStyle = '#1b2b33'; c.fillRect(18, 176, w - 36, 22); c.fillStyle = alarm ? '#ff5f57' : '#ffb547'; c.fillRect(18, 176, (w - 36) * exp, 22);
      c.fillStyle = '#5d7a86'; c.font = '600 18px Menlo, Consolas, monospace'; c.fillText('阈值 35 dB · 暴露值', 18, 226);
    });
  }

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
  function showCat(up) { awake = up; beacon.material.color.set(up ? 0xff5f57 : 0x3a4450); }
  function panelUI(extra = '') {
    ui = g.ctrl(`<div class="panel"><div class="meter air"><span>罩内气压</span><div class="bar"><i id="mAir"></i></div><b id="vAir">101 kPa</b></div><div class="meter cat"><span>暴露值</span><div class="bar"><i id="mCat"></i></div><b id="vCat"></b></div>${extra}</div><button class="big-btn" type="button" id="bPump">抽气<small>连续点击</small></button>`);
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
    k.pin = g.pin('LEAK', V(JX + x, y, z), {cls: 'leak', tap: () => {
      if (!k.open) return; k.open = false; k.pin.remove(); k.pin = null; jar.remove(spot); sealed++;
      const patch = mesh(new THREE.CircleGeometry(20, 20), new THREE.MeshBasicMaterial({color: 0xffd23f, toneMapped: false, side: THREE.DoubleSide}), false);
      patch.position.set(x, y, z + 2); patch.lookAt(JX * 0 + x * 2, y, z * 2 + 200); k.patch = patch; jar.add(patch);
      g.sfx.seal(); g.pop('已封堵', V(JX + x, y + 20, z), 'good'); showLeakInfo();
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
    ui = g.ctrl(`<div class="race"><span id="rkT">按速度从快到慢依次点击</span><div class="chips">${LANES.map((l, i) => `<button class="ch" type="button" data-i="${i}">${l.n}</button>`).join('')}</div></div>`);
    ui.querySelectorAll('.ch').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i; if (race || picks.includes(i)) return;
      picks.push(i); b.classList.add('sel'); b.insertAdjacentHTML('beforeend', `<em>${picks.length}</em>`); g.sfx.tap();
      if (picks.length === 3) { ui.querySelector('#rkT').textContent = '预测已提交，开始测速'; g.after(.7, startRace); }
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
      /* the external monitor */
      if (playing && !awake) {
        wake = clamp(wake + (loud > .25 ? (loud - .25) * wakeRate : -.05) * dt, 0, 1);
        if (wake >= 1) { showCat(true); woke++; g.sfx.meow(); g.pop('暴露', V(CX + 40, 250, 40), 'bad'); g.sfx.hiss(0); g.fail('罩外监听器测到声音超过阈值，位置暴露。抽气要更快，让罩内尽快接近真空。'); }
      }
      { const db = Math.round(20 + 60 * (live ? loud : 0)), al = awake; if (db !== lastDb || al !== lastAlarm || Math.abs(wake - (drawDisp.w || 0)) > .03) { lastDb = db; lastAlarm = al; drawDisp.w = wake; drawDisp(db, wake, al); } }
      beacon.scale.setScalar(awake ? 1 + Math.sin(t * 20) * .15 : 1);
      if (ui && stage < 2) {
        const a = ui.querySelector('#mAir'); if (a) { a.style.width = air + '%'; ui.querySelector('#vAir').textContent = Math.round(air * 1.01) + ' kPa'; ui.querySelector('#mCat').style.width = wake * 100 + '%'; a.parentNode.parentNode.classList.toggle('ok', air <= 5); }
      }
      if (playing && stage === 0) { hold = air <= 5 ? hold + dt : 0; if (hold > .5) { air = 0; g.feedback('小锤仍在敲击，罩外读数却降到底：<b>声音传不出来了</b>。'); g.clear(); } }
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
          else if (picks.join() === '2,1,0') { g.feedback('预测正确：<b>钢铁 > 水 > 空气</b>。'); g.after(.6, () => g.clear()); }
          else { g.sfx.wrong(); g.feedback('预测错误。实测：<b>钢铁 > 水 > 空气</b>。重新提交排名。'); stats.wrongRace = (stats.wrongRace || 0) + 1; g.after(1.5, () => { race = null; laneObjs.forEach((l) => { l.pulse.position.x = RX0; }); rankUI(); }); }
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
    root, bg: ['#0b1016', '#121a23', '#1a2632'],
    stages: [
      {goal: '警报器在罩内响个不停。<b>连续抽气</b>，在暴露前让罩内接近真空', hint: '抽气越快越好。罩内空气越少，传到罩外的声音越小，暴露值就不再上涨。', frame: fMain, start() {
        stage = 0; wakeRate = .2; resetMain(100); panelUI(); g.sfx.bellStart();
        g.pin('警报器', V(JX, 372, 0), {cls: 'lbl'}); g.pin('罩外监听器', V(CX + 40, 300, 0), {cls: 'lbl'});
      }},
      {goal: '罩体出现漏点。<b>点击 LEAK 封堵</b>，同时保持真空', hint: '每个漏点都会让空气持续流入。先封漏点再抽气，否则抽多少漏多少。', frame: fMain, start() {
        stage = 1; wakeRate = .3; resetMain(4); leakT = 0; plan = {times: [1.2, 4, 6.4, 8.6, 9.6, 11.8, 12.6], at: 0, total: 7};
        panelUI(); showLeakInfo(); g.sfx.bellStart();
      }},
      {goal: '提交预测：声音在<b>空气、水、钢铁</b>中的速度排名（从快到慢）', hint: '想想把耳朵贴在铁轨上，为什么能更早听到远处的火车。', frame: fRace, start() {
        stage = 2; resetMain(0); g.sfx.bellStop(); g.sfx.hiss(0); mainG.visible = false; raceG.visible = true; lanePin(); rankUI();
        g.info('赛道长 1700 米');
      }},
    ],
    update,
    explain: {
      frame: fJar,
      start() { resetMain(100); stage = 3; exOn = true; t = 0; g.sfx.bellStart(); },
      steps: [
        {t: '警报器始终在振动。空气被抽走后，罩外读数降到底；空气回流，读数又升高。声音由物体<b>振动</b>产生。', on() { g.pin('警报器持续振动', V(JX, 372, 0), {cls: 'lbl yel'}); }},
        {t: '声音的传播需要<b>介质</b>：气体、液体、固体都可以。没有介质的空间是真空，<b>真空不能传声</b>。所以宇航员在月面要靠无线电通话。', on() {}},
        {t: '同样 1700 m：钢铁 0.33 s，水 1.13 s，空气 5 s。一般情况下声速 <b>v固 > v液 > v气</b>，15 °C 空气中约 340 m/s。', frame: fRace, on() { g.sfx.bellStop(); exRace = true; mainG.visible = false; raceG.visible = true; lanePin(); }},
      ],
    },
    perf: () => { const wr = stats.wrongRace || 0, sc = clamp(1 - woke * .5 - wr * .35, 0, 1); return {score: sc, text: `暴露 ${woke} 次 · 测速预测${wr ? `错 ${wr} 次` : '一次正确'}`, tip: '零暴露、测速预测一次正确，这一项拿满分。'}; },
    dispose() { g.sfx.bellStop(); g.sfx.hiss(0); },
    dbg: () => ({air, wake, stage, sealed, open: leaks.filter((k) => k.open).length, race: race && race.t, picks}),
  };
}
