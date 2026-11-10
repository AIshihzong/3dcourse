/* 七下·第2章 对环境的察觉 : 326–333 */
import * as THREE from 'three';
import {makeSorter} from './sorter.js';
import {buildLens} from './ported.js';
import {C, MAT, G, V, D2R, TAU, clamp, lerp, f0, f1, f2, mesh, box, cyl, sph, rod, arrow, canvasTex, FONT, makeTag, bench, rand, polyLen, polyAt, curve, textPlate} from '../kit.js';

const cap = (t) => { const el = document.getElementById('caption'); if (el) el.innerHTML = t; };
function dashed(color, op = 1) {
  const g = new THREE.BufferGeometry().setFromPoints([V(), V(1, 0, 0)]);
  const l = new THREE.Line(g, new THREE.LineDashedMaterial({color, dashSize: 10, gapSize: 7, transparent: op < 1, opacity: op, toneMapped: false}));
  l.set = (a, b) => { const p = g.attributes.position; p.setXYZ(0, a.x, a.y, a.z); p.setXYZ(1, b.x, b.y, b.z); p.needsUpdate = true; g.computeBoundingSphere(); l.computeLineDistances(); };
  l.renderOrder = 5; return l;
}
const glowRod = (c, r = 2.6) => { const m = rod(MAT.glow(c), r); m.renderOrder = 4; return m; };
const segBtns = (id, labels, title) => `<div class="grp" style="margin-top:9px"><span class="cp mu">${title}</span><div class="seg" id="${id}">${labels.map((n, i) => `<button class="tb" data-v="${i}" type="button">${n}</button>`).join('')}</div></div>`;
const bindSeg = (el, id, fn) => el.querySelectorAll('#' + id + ' .tb').forEach((b) => b.onclick = () => { fn(+b.dataset.v); window.pressSeg(id, +b.dataset.v); });

/* ----------------------------------------------------------------- 326 感觉与感官 */
const SENSE = [
  ['看到红绿灯变色', 0, '光刺激 → 眼（视网膜）'], ['读课本上的字', 0, '视觉'], ['看见闪电', 0, '视觉'],
  ['听到上课铃声', 1, '声刺激 → 耳（耳蜗）'], ['分辨同学的声音', 1, '听觉 · 音色'],
  ['闻到桂花香', 2, '气味 → 鼻（嗅觉细胞）'], ['闻到烧焦的味道', 2, '嗅觉'],
  ['尝出糖是甜的', 3, '化学物质 → 舌（味蕾）'], ['吃到很咸的菜', 3, '味觉'],
  ['摸到冰块很冷', 4, '冷觉 · 皮肤'], ['被针扎到很疼', 4, '痛觉 · 皮肤'], ['摸出布料粗糙', 4, '触觉 · 皮肤'],
];
function b326(ctx) {
  return makeSorter(ctx, {
    items: SENSE, bins: ['视觉 · 眼', '听觉 · 耳', '嗅觉 · 鼻', '味觉 · 舌', '皮肤感觉'], short: ['眼', '耳', '鼻', '舌', '皮肤'], ask: '是哪种感觉？', cardTag: '刺激卡片',
    title: '感觉 <i>·</i> 与感官', spec: '刺激 → 感受器 → 神经 → 大脑皮层 · 形成感觉',
    intro: '把每种刺激分到对应的感觉器官。注意：感受器接受刺激，但感觉最终在大脑皮层形成。',
    fml: '感觉在大脑皮层形成', fmlTag: '关键结论', fmlNote: '皮肤里有触觉、痛觉、冷觉、热觉感受器。单凭感觉判断有时不可靠，需要用<b>仪器</b>测量。',
    onRight: (st) => { if (st.kinds[4] >= 2) ctx.done(0); if (st.kinds.every((n) => n > 0)) ctx.done(1); },
    missions: (st, items) => [{t: '分对 2 种皮肤感觉', k: '皮肤能感受冷热、痛、触'}, {t: '五种感觉各分对 1 张', k: '感觉器官与刺激'}, {t: '12 张全部完成', k: '感觉与感官', check: () => st.i >= items.length}],
  });
}

/* ----------------------------------------------------------------- 327 声音的产生与传播 */
const MEDIA = [['空气', 340, 0xdfe7ee], ['水', 1500, 0x8fc4ee], ['钢铁', 5200, 0x8d939b]];
function b327(ctx) {
  const root = G(), st = {air: 100, t: 0, vac: false, back: false, race: -1, done: false};
  root.add(bench(1500, 760));
  const JX = -330;
  const jar = G(); jar.position.x = JX; root.add(jar);
  const plate = cyl(190, 200, 22, MAT.dark(), 48); plate.position.y = 11; jar.add(plate);
  const dome = mesh(new THREE.SphereGeometry(160, 48, 24, 0, TAU, 0, Math.PI / 2), MAT.glass(.2), false); dome.position.y = 150; jar.add(dome);
  const wallJ = mesh(new THREE.CylinderGeometry(160, 160, 128, 48, 1, true), MAT.glass(.2), false); wallJ.position.y = 86; jar.add(wallJ);
  const knob = sph(16, MAT.dark()); knob.position.y = 316; jar.add(knob);
  const post = cyl(4, 4, 120, MAT.steel()); post.position.y = 82; jar.add(post);
  const bell = mesh(new THREE.SphereGeometry(44, 32, 14, 0, TAU, 0, Math.PI / 2), MAT.brass()); bell.position.y = 140; bell.rotation.x = Math.PI; bell.position.y = 190; jar.add(bell);
  const hammer = G(); hammer.position.set(0, 120, 30); jar.add(hammer); const hr = rod(MAT.steel(), 2.5); hr.set(V(), V(0, 40, 0)); hammer.add(hr); const hb = sph(8, MAT.dark()); hb.position.y = 40; hammer.add(hb);
  const pump = box(110, 90, 90, MAT.white()); pump.position.set(JX - 300, 45, 120); root.add(pump);
  const hose = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(JX - 250, 30, 120), V(JX - 220, 8, 120), V(JX - 150, 8, 60), V(JX - 90, 14, 30)]), 30, 7, 8), MAT.dark()); root.add(hose);
  const NA = 90, airM = new THREE.InstancedMesh(new THREE.SphereGeometry(3, 6, 4), MAT.col(0x9fb3c8), NA); jar.add(airM);
  const airP = Array.from({length: NA}, () => ({p: V((rand() - .5) * 240, 30 + rand() * 230, (rand() - .5) * 240), v: V(rand() - .5, rand() - .5, rand() - .5).multiplyScalar(80)}));
  const rings = Array.from({length: 6}, (_, i) => { const m = mesh(new THREE.TorusGeometry(1, .02, 6, 64), MAT.fade(C.red, .5), false); m.userData.o = i / 6; jar.add(m); return m; });
  // race lanes
  const LX0 = 60, LX1 = 700;
  const lanes = MEDIA.map((m, i) => { const z = -110 + i * 110; const lane = box(LX1 - LX0, 14, 60, MAT.col(m[2], m[0] === '水' ? {transparent: true, opacity: .7} : {})); lane.position.set((LX0 + LX1) / 2, 7, z); root.add(lane);
    const pulse = sph(12, MAT.glow(C.red)); pulse.position.set(LX0, 30, z); root.add(pulse); const flag = box(6, 70, 6, MAT.dark()); flag.position.set(LX1, 35, z); root.add(flag); return {z, pulse, t: null}; });
  const tags = {jar: makeTag('真空罩', 'Bell jar'), pump: makeTag('抽气机', 'Pump'), ...Object.fromEntries(MEDIA.map((m, i) => ['l' + i, makeTag(m[0], m[1] + ' m/s')]))};
  const raceLen = 1700;
  const loud = () => st.air / 100;
  return {
    root, tags, title: '声音 <i>·</i> 产生与传播', spec: '声音由物体振动产生 · 传播需要介质 · 真空不能传声',
    bigUnit: '% · 罩内空气', bigMin: '0', bigMax: '100', intro: '电铃一直在响。拖动滑块用抽气机把罩里的空气抽走，听到的铃声会怎样？右边比一比声音在三种介质里谁跑得快。',
    fml: 's = v t', fmlTag: '声速', fmlNote: '15 °C 空气中声速约 <b>340 m/s</b>；一般 v固 > v液 > v气。真空中声速为 0。',
    legend: [['声波', C.red], ['空气分子', '#9fb3c8']],
    driver: {name: '罩内空气 · Air left', min: 0, max: 100, step: 1, fmt: (v) => f0(v) + ' %', get: () => st.air, set: (v) => { st.air = v; if (v < 5) st.vac = true; if (st.vac && v > 90) st.back = true; }, scale: () => ['真空', '50 %', '100 %'], track: () => [[0, 10, C.faint], [10, 100, '#eba4ab']]},
    extra: (el) => {
      el.innerHTML = `<div class="grp" style="margin-top:9px"><span class="cp mu">声速比赛 Race · 1700 m</span><div class="seg"><button class="tb red" type="button" id="bRace">敲一下，开始比赛</button></div></div>`;
      el.querySelector('#bRace').onclick = () => { st.race = 0; lanes.forEach((l) => l.t = null); cap('三条跑道同时出发：钢铁、水、空气……谁先到终点？'); };
    },
    views: [['全景', [80, 1100, 2400], [60, 60, 0]], ['真空罩', [JX, 300, 640], [JX, 160, 0]], ['跑道', [380, 520, 760], [380, 0, 0]]], get home() { return this.views[0]; },
    missions: [
      {t: '把罩内空气抽到接近真空，听铃声', k: '真空不能传声', check: () => st.vac},
      {t: '再把空气放回去，铃声又出现了', k: '声音的传播需要介质', check: () => st.back},
      {t: '完成一次声速比赛', k: 'v固 > v液 > v气'},
    ],
    update(dt, anim) {
      st.t += anim;
      hammer.rotation.z = Math.sin(st.t * 40) * .35; bell.rotation.z = Math.sin(st.t * 40) * .02;
      const L = loud();
      rings.forEach((r) => { const k = (r.userData.o + st.t * .5) % 1; r.scale.setScalar(40 + k * 300); r.position.y = 170; r.material.opacity = (1 - k) * .6 * L * (k * 300 > 150 ? L : 1); r.visible = L > .02; });
      const n = Math.round(NA * L), dm = new THREE.Object3D();
      airP.forEach((a, i) => { a.p.addScaledVector(a.v, anim); ['x', 'z'].forEach((ax) => { if (Math.abs(a.p[ax]) > 130) a.v[ax] *= -1; }); if (a.p.y < 30 || a.p.y > 270) a.v.y *= -1; dm.position.copy(a.p); dm.scale.setScalar(i < n ? 1 : 0); dm.updateMatrix(); airM.setMatrixAt(i, dm.matrix); });
      airM.instanceMatrix.needsUpdate = true;
      if (st.race >= 0) {
        st.race += anim;
        lanes.forEach((l, i) => { const d = MEDIA[i][1] * st.race; const k = Math.min(1, d / raceLen); l.pulse.position.x = LX0 + k * (LX1 - LX0); l.pulse.position.y = 30 + Math.sin(k * Math.PI) * 30; if (k >= 1 && l.t === null) { l.t = raceLen / MEDIA[i][1]; ctx.toast?.(`${MEDIA[i][0]}到达：${f2(l.t)} s`); } });
        if (lanes.every((l) => l.t !== null) && !st.done) { st.done = true; ctx.done(2); ctx.burst?.(); cap('钢铁 0.33 s，水 1.13 s，空气 5 s。一般情况下：固体 > 液体 > 气体。'); }
        if (lanes.every((l) => l.t !== null)) st.race = -1, st.done = false;
      }
      tags.jar.p.set(JX, 340, 0); tags.pump.p.set(JX - 300, 100, 120);
      lanes.forEach((l, i) => tags['l' + i].p.set(LX0 - 20, 40, l.z));
    },
    panel() {
      const L = loud();
      return {big: f0(st.air), bigFrac: L, bigSub: L > .6 ? '铃声清楚' : L > .1 ? '铃声越来越小' : '几乎听不到',
        stName: '我们听到的', stAng: '电铃在振动', stBig: L > .6 ? '铃声响亮' : L > .1 ? '声音变小' : '听不到声音', stRed: L <= .1,
        rows: MEDIA.map((m, i) => [`${m[0]} · ${m[1]} m/s`, lanes[i].t !== null, lanes[i].t !== null ? f2(lanes[i].t) + ' s' : '—']).concat([['真空 · 0 m/s', st.air < 5, '不能传声']]),
        num: '340', unit: 'm/s · 空气中声速<small>15 °C</small>', frac: 340 / 5200,
        calc: `t = s / v = 1700 m ÷ 340 m/s<br>= <b>5 s</b>（空气）`, calcT: '声速计算',
        chart: {t: '不同介质中的声速', u: 'm/s', x0: 0, x1: 4, y0: 0, y1: 5200, xl: '', yl: 'v', bars: [[.8, 340, C.faint, '空气'], [2, 1500, C.blue, '水'], [3.2, 5200, C.grey, '钢铁']]}};
    },
    reset() { st.vac = st.back = false; st.race = -1; lanes.forEach((l) => { l.t = null; l.pulse.position.x = LX0; }); return 100; },
    tour: [{d: 0, dTime: 6, view: 1, cap: '抽气机把罩里的空气越抽越少：电铃仍在振动，铃声却越来越小。推理：真空不能传声。', dur: 8}, {d: 100, dTime: 3, view: 1, cap: '放进空气，铃声又响起来了：声音的传播需要介质。', dur: 6}, {d: 100, view: 2, run: () => document.getElementById('bRace')?.click(), cap: '同样 1700 m：钢铁里只要 0.33 s，水里 1.13 s，空气里要 5 s。', dur: 7}],
    quiz: {1: {d: 0, dTime: 4, view: 1, cap: '验证：空气抽完后铃声消失 —— 真空不能传声。'}, 2: {view: 2, run: () => document.getElementById('bRace')?.click(), cap: '验证：空气中 1700 m 用了 5 s，v = 340 m/s。'}, 3: {view: 2, run: () => document.getElementById('bRace')?.click(), cap: '验证：声音在固体、液体、气体中都能传播，传播需要介质。'}},
  };
}

/* ----------------------------------------------------------------- 328 声音的特性 */
const TIMBRE = [['音叉', [0, 1]], ['钢琴', [0, 1, .55, .3, .18, .08]], ['小提琴', [0, 1, .5, .33, .25, .2, .16, .14, .12]]];
const wave = (h, x) => { let y = 0, n = 0; h.forEach((a, k) => { if (k) { y += a * Math.sin(k * x); n += a; } }); return y / (h.length > 2 ? n * .62 : 1); };
let actx = null;
function playTone(f, amp, h) {
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain(), re = new Float32Array(h.length), im = new Float32Array(h);
    o.setPeriodicWave(actx.createPeriodicWave(re, im)); o.frequency.value = f;
    const v = [.04, .1, .22][amp], t = actx.currentTime; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .03); g.gain.exponentialRampToValueAtTime(.0005, t + 1.1);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 1.15);
  } catch (e) { /* audio unavailable */ }
}
function b328(ctx) {
  const root = G(), st = {f: 262, amp: 1, tb: 0, t: 0, seen: new Set([0]), played: 0};
  root.add(bench(1300, 700));
  const spk = G(); spk.position.set(-360, 0, 0); root.add(spk);
  const cab = box(200, 300, 160, MAT.dark()); cab.position.y = 150; spk.add(cab);
  const cone = mesh(new THREE.ConeGeometry(70, 40, 40, 1, true), MAT.grey()); cone.rotation.x = -Math.PI / 2; cone.position.set(0, 170, 82); spk.add(cone);
  const dust = sph(20, MAT.dark()); dust.position.set(0, 170, 92); spk.add(dust);
  const tw = cyl(18, 18, 8, MAT.grey()); tw.rotation.x = Math.PI / 2; tw.position.set(0, 265, 82); spk.add(tw);
  // air compression bands
  const bands = Array.from({length: 10}, () => { const m = mesh(new THREE.TorusGeometry(1, .03, 6, 48), MAT.fade(C.red, .4), false); spk.add(m); return m; });
  // oscilloscope
  const osc = G(); osc.position.set(180, 0, 0); root.add(osc);
  const bez = box(620, 380, 70, MAT.white()); bez.position.y = 220; osc.add(bez);
  const scrT = canvasTex(1024, 560, () => {});
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(560, 306), new THREE.MeshBasicMaterial({map: scrT, toneMapped: false})); scr.position.set(0, 230, 36); osc.add(scr);
  const legs = [-240, 240].map((x) => { const l = box(20, 40, 50, MAT.dark()); l.position.set(x, 20, 0); osc.add(l); return l; });
  const tags = {spk: makeTag('扬声器', 'Speaker'), osc: makeTag('示波器', 'Oscilloscope')};
  const AMPS = [.32, .6, .92];
  const draw = () => scrT.redraw((g, w, h) => {
    g.fillStyle = '#10161a'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(160,220,200,.16)'; g.lineWidth = 2;
    for (let x = 0; x <= w; x += w / 10) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += h / 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    const cyc = st.f / 100, A = AMPS[st.amp] * h * .44, h0 = TIMBRE[st.tb][1], ph = st.t * 2;
    g.strokeStyle = '#7ef0b6'; g.lineWidth = 5; g.shadowColor = '#7ef0b6'; g.shadowBlur = 12; g.beginPath();
    for (let x = 0; x <= w; x += 2) { const y = h / 2 - A * wave(h0, x / w * cyc * TAU - ph); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.shadowBlur = 0;
    g.fillStyle = 'rgba(200,255,230,.8)'; g.font = FONT(700, 26); g.fillText(`${f0(st.f)} Hz · ${TIMBRE[st.tb][0]} · 振幅 ${['小', '中', '大'][st.amp]}`, 24, 40);
  });
  return {
    root, tags, title: '声音 <i>·</i> 三个特性', spec: '音调 ↔ 频率 · 响度 ↔ 振幅 · 音色 ↔ 发声体',
    bigUnit: 'Hz · 频率', bigMin: '100', bigMax: '1000', intro: '拖动滑块改变频率，在左下角改振幅和乐器，看示波器上的波形怎样变化。点“听一听”可以真的听到声音。',
    fml: '频率 = 振动次数 ÷ 时间', fmlTag: '音调', fmlNote: '频率越高，<b>音调</b>越高；振幅越大，<b>响度</b>越大；不同发声体波形不同，<b>音色</b>不同。人耳听觉范围约 20–20000 Hz。',
    legend: [['波形', '#2f9e6a'], ['疏密波', C.red]],
    driver: {name: '频率 f · Frequency', min: 100, max: 1000, step: 1, fmt: (v) => f0(v) + ' Hz', get: () => st.f, set: (v) => { st.f = v; }, scale: () => ['100 Hz', '低音', '高音', '1000 Hz'], track: () => [[100, 400, C.faint], [400, 1000, '#eba4ab']]},
    extra: (el) => {
      el.innerHTML = segBtns('segA', ['小', '中', '大'], '振幅 Amplitude') + segBtns('segT', TIMBRE.map((t) => t[0]), '发声体 Timbre') + `<div class="grp"><div class="seg"><button class="tb red" type="button" id="bPlay">▶ 听一听</button></div></div>`;
      bindSeg(el, 'segA', (v) => { st.amp = v; }); bindSeg(el, 'segT', (v) => { st.tb = v; st.seen.add(v); if (st.seen.size >= 3) ctx.done(2); });
      el.querySelector('#bPlay').onclick = () => { st.played++; playTone(st.f, st.amp, TIMBRE[st.tb][1]); if (st.f >= 800) ctx.done(0); if (st.amp === 2) ctx.done(1); };
      window.pressSeg('segA', st.amp); window.pressSeg('segT', st.tb);
    },
    views: [['全景', [-60, 620, 1750], [-40, 180, 0]], ['示波器', [180, 260, 700], [180, 230, 0]], ['扬声器', [-200, 300, 600], [-330, 170, 0]]], get home() { return this.views[0]; },
    missions: [
      {t: '把频率调到 800 Hz 以上再听一听', k: '频率越高，音调越高'},
      {t: '把振幅调到“大”再听一听', k: '振幅越大，响度越大'},
      {t: '换三种发声体，比较波形', k: '音色由发声体决定'},
    ],
    update(dt, anim) {
      st.t += anim;
      const A = AMPS[st.amp], vib = Math.sin(st.t * Math.min(st.f, 400) * .25) * A * 8;
      cone.position.z = 82 + vib; dust.position.z = 92 + vib;
      const lam = 34000 / st.f * .9;
      bands.forEach((b, i) => { const x = ((i * lam + st.t * 120) % (lam * 10)); b.position.set(0, 170, 100 + x); b.scale.setScalar(60 + x * .2); b.material.opacity = Math.max(0, .5 * A * (1 - x / 500)); b.visible = x < 500; });
      draw();
      tags.spk.p.set(-360, 320, 0); tags.osc.p.set(180, 430, 0);
    },
    panel() {
      return {big: f0(st.f), bigFrac: (st.f - 100) / 900, bigSub: st.f >= 600 ? '音调高 · 声音尖细' : st.f <= 300 ? '音调低 · 声音低沉' : '音调中等',
        stName: '声音的特性', stAng: TIMBRE[st.tb][0], stBig: `${st.f >= 600 ? '高音' : st.f <= 300 ? '低音' : '中音'} · ${['轻声', '适中', '响亮'][st.amp]}`, stRed: st.f >= 600 || st.amp === 2,
        rows: [['音调 ↔ 频率', st.f >= 600, f0(st.f) + ' Hz'], ['响度 ↔ 振幅', st.amp === 2, ['小', '中', '大'][st.amp]], ['音色 ↔ 发声体', st.seen.size >= 3, TIMBRE[st.tb][0]]],
        num: f2(1000 / st.f), unit: 'ms · 振动一次的时间<small>频率越高越短</small>', frac: 100 / st.f,
        calc: `每秒振动 ${f0(st.f)} 次<br>周期 T = 1 / f = <b>${f2(1000 / st.f)} ms</b>`, calcT: '频率与周期'};
    },
    reset() { st.amp = 1; st.tb = 0; window.pressSeg('segA', 1); window.pressSeg('segT', 0); return 262; },
    tour: [{d: 880, dTime: 4, view: 1, cap: '频率越高，波形越密，音调越高。', dur: 6}, {d: 262, dTime: 3, view: 1, run: () => { st.amp = 2; window.pressSeg('segA', 2); }, cap: '振幅越大（波形越“高”），响度越大。', dur: 6}, {view: 1, run: () => { st.tb = 2; window.pressSeg('segT', 2); }, cap: '频率、振幅相同，波形形状不同：这就是音色。', dur: 6}],
    quiz: {0: {d: 900, dTime: 3, view: 1, cap: '验证：频率越高，音调越高。'}, 1: {view: 1, run: () => { st.amp = 2; window.pressSeg('segA', 2); }, cap: '验证：“震耳欲聋”是振幅大、响度大。'}, 2: {view: 1, run: () => { st.tb = (st.tb + 1) % 3; window.pressSeg('segT', st.tb); }, cap: '验证：不同乐器波形不同 —— 音色不同。'}, 3: {view: 1, run: () => { st.amp = 2; window.pressSeg('segA', 2); }, cap: '验证：“高声唱歌”的“高”是响度大，不是音调高。'}},
  };
}

/* ----------------------------------------------------------------- 329 耳与听觉 */
function b329(ctx) {
  const root = G(), st = {p: 0, t: 0, mouth: 0, boom: 0, picked: new Set()};
  root.add(bench(1300, 600));
  const Y = 260, P = (x, y, z = 0) => V(x, Y + y, z);
  const skin = MAT.col(0xf2c9b0), pinkM = () => MAT.col(0xeba4ab);
  const part = (m, key) => { m.userData.pick = key; root.add(m); return m; };
  const auricle = part(sph(1, skin, 32), 'au'); auricle.scale.set(28, 120, 70); auricle.position.copy(P(-430, 10));
  const rim = part(mesh(new THREE.TorusGeometry(80, 14, 12, 40, Math.PI * 1.4), skin), 'au'); rim.position.copy(P(-420, 20)); rim.rotation.set(0, Math.PI / 2, -Math.PI * .2); rim.scale.set(1, 1.35, 1);
  const canal = part(mesh(new THREE.CylinderGeometry(22, 20, 230, 24, 1, true), MAT.col(0xf2c9b0, {side: THREE.DoubleSide, transparent: true, opacity: .55, depthWrite: false}), false), 'canal'); canal.rotation.z = Math.PI / 2; canal.position.copy(P(-290, 0));
  const drum = part(mesh(new THREE.CircleGeometry(30, 32), MAT.col(0xd6182b, {side: THREE.DoubleSide, transparent: true, opacity: .8})), 'drum'); drum.rotation.y = Math.PI / 2; drum.position.copy(P(-172, 0));
  const cav = mesh(new THREE.SphereGeometry(70, 32, 20), MAT.col(0xf6e6e0, {transparent: true, opacity: .25, depthWrite: false, side: THREE.DoubleSide}), false); cav.position.copy(P(-110, 4)); root.add(cav);
  const oss = G(); const bones = [P(-160, 6), P(-120, 26), P(-90, 14), P(-62, 2)]; for (let i = 0; i < 3; i++) { const r = rod(MAT.col(0xf3efe4), 6); r.set(bones[i], bones[i + 1]); oss.add(r); const s = sph(9, MAT.col(0xf3efe4), 12); s.position.copy(bones[i + 1]); oss.add(s); } oss.userData.pick = 'oss'; root.add(oss);
  const spiral = []; for (let i = 0; i <= 140; i++) { const a = i / 140 * 2.75 * TAU, r = 46 - i / 140 * 36; spiral.push(P(10 + Math.cos(a) * r, -30 + Math.sin(a) * r, i * .25)); }
  const coch = part(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiral), 200, 9, 10), pinkM()), 'coch');
  const canals = [[0, 0], [Math.PI / 2, 0], [0, Math.PI / 2]].map(([rx, ry], i) => { const m = part(mesh(new THREE.TorusGeometry(26, 5, 8, 36), MAT.col(0xf3c6c9)), 'semi'); m.position.copy(P(-20 + i * 14, 62, i * 6)); m.rotation.set(rx, ry, 0); return m; });
  const nervePts = [P(50, -24), P(120, -10), P(200, 40), P(270, 100)];
  const nerve = part(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(nervePts), 40, 6, 8), MAT.col(0xf0c64a)), 'nerve');
  const brain = part(sph(1, MAT.col(0xf3b8bf), 32), 'brain'); brain.scale.set(130, 95, 110); brain.position.copy(P(380, 150));
  const euPts = [P(-110, -60), P(-80, -130), P(-30, -200)]; const eus = part(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(euPts), 30, 8, 8), MAT.col(0xe8a7a0)), 'eus');
  const path = [P(-560, 0), P(-174, 0), ...bones.slice(1), P(0, -30), ...nervePts, P(360, 150)];
  const PL = polyLen(path), pulse = sph(12, MAT.glow(C.red)); root.add(pulse);
  const waves = Array.from({length: 5}, (_, i) => { const m = mesh(new THREE.TorusGeometry(1, .04, 6, 40), MAT.fade(C.red, .5), false); m.rotation.y = Math.PI / 2; m.userData.o = i / 5; root.add(m); return m; });
  const STG = [['外耳道 · 收集传导声波', 0, 'canal'], ['鼓膜 · 产生振动', .22, 'drum'], ['听小骨 · 传导放大振动', .3, 'oss'], ['耳蜗 · 感受器产生神经冲动', .4, 'coch'], ['听神经 · 传导冲动', .55, 'nerve'], ['大脑皮层 · 形成听觉', .92, 'brain']];
  const sIdx = () => { let k = 0; STG.forEach((s, i) => { if (st.p / 100 >= s[1]) k = i; }); return k; };
  const INFO = {au: '耳廓：收集声波。', canal: '外耳道：传导声波。', drum: '鼓膜：接受声波刺激<b>产生振动</b>。', oss: '听小骨（锤骨、砧骨、镫骨）：把振动传到内耳。', coch: '耳蜗：内有<b>听觉感受器</b>，接受振动刺激产生神经冲动。', semi: '半规管和前庭：感受头部位置变化，与<b>平衡</b>有关（晕车与它有关）。', nerve: '听神经：把神经冲动传到大脑。', brain: '大脑皮层的听觉中枢：<b>形成听觉</b>。', eus: '咽鼓管：连通鼓室和咽，保持<b>鼓膜内外气压平衡</b>。'};
  const tags = {au: makeTag('耳廓', ''), drum: makeTag('鼓膜', ''), oss: makeTag('听小骨', ''), coch: makeTag('耳蜗', '感受器', true), semi: makeTag('半规管', ''), nerve: makeTag('听神经', ''), brain: makeTag('大脑皮层', '听觉中枢'), eus: makeTag('咽鼓管', '')};
  const hiMats = {canal, drum, oss, coch, nerve, brain};
  return {
    root, tags, pickables: [auricle, rim, canal, drum, oss, coch, ...canals, nerve, brain, eus], title: '耳 <i>·</i> 与听觉', spec: '外耳 · 中耳 · 内耳 · 听觉在大脑皮层形成',
    bigUnit: '% · 传导进程', bigMin: '0', bigMax: '100', intro: '拖动滑块，跟着一个声波走一遍：从耳廓到大脑，听觉是怎样形成的？点击各个结构看作用。',
    fml: '声波 → 外耳道 → 鼓膜 → 听小骨 → 耳蜗 → 听神经 → 大脑', fmlTag: '听觉形成', fmlNote: '<b>耳蜗</b>是听觉感受器所在处；听觉在<b>大脑皮层听觉中枢</b>形成。巨响时张口，使鼓膜内外气压平衡。',
    legend: [['声波 / 冲动', C.red], ['听神经', '#f0c64a']],
    driver: {name: '传导进程 · Signal path', min: 0, max: 100, step: .5, fmt: (v) => STG[sIdx()][0].split(' · ')[0], get: () => st.p, set: (v) => { st.p = v; }, scale: () => ['外耳', '中耳', '内耳', '大脑'], track: () => [[0, 22, C.faint], [22, 40, '#eba4ab'], [40, 55, C.red], [55, 100, '#f0c64a']]},
    extra: (el) => {
      el.innerHTML = segBtns('segM', ['闭着嘴', '张开嘴'], '遇到巨响 Loud noise') + `<div class="grp"><div class="seg"><button class="tb red" type="button" id="bBoom">💥 放一声巨响</button></div></div>`;
      bindSeg(el, 'segM', (v) => { st.mouth = v; });
      el.querySelector('#bBoom').onclick = () => { st.boom = 1.6; if (st.mouth) { ctx.done(2); cap('✓ 张开嘴，气体经<b>咽鼓管</b>进入鼓室，鼓膜内外气压平衡，鼓膜没有被震破。'); } else cap('✗ 闭着嘴：鼓膜外侧气压骤增，鼓膜被猛推向内，容易受伤！试试张开嘴。'); };
      window.pressSeg('segM', st.mouth);
    },
    views: [['全景', [-20, 640, 1650], [-20, 250, 0]], ['中耳', [-130, 340, 420], [-130, 260, 0]], ['内耳', [0, 330, 360], [0, 250, 0]]], get home() { return this.views[0]; },
    missions: [
      {t: '点击找到听觉感受器所在的结构', k: '耳蜗内有听觉感受器'},
      {t: '把声波一直送到大脑', k: '听觉在大脑皮层形成', check: () => st.p >= 95},
      {t: '巨响时用正确的方法保护鼓膜', k: '张口使鼓膜内外气压平衡'},
    ],
    pick(k) { if (!k) return null; st.picked.add(k); if (k === 'coch') ctx.done(0); return INFO[k]; },
    update(dt, anim) {
      st.t += anim; st.boom = Math.max(0, st.boom - dt);
      const k = st.p / 100, sg = sIdx();
      polyAt(path, k * PL, pulse.position); pulse.material.color.set(k > .4 ? 0xf0a020 : C.red); pulse.visible = st.p > 0 && st.p < 100;
      waves.forEach((w) => { const q = (w.userData.o + st.t * .6) % 1; w.position.copy(P(-560 + q * 380, 0)); w.scale.setScalar(20 + q * 40); w.material.opacity = (1 - q) * .55; w.visible = st.p < 25 || st.boom > 0; });
      const vib = (k > .2 ? Math.sin(st.t * 30) * 4 : 0) + (st.boom > 0 && !st.mouth ? Math.sin(st.boom * 6) * 22 + 10 : 0);
      drum.position.x = P(-172, 0).x + vib * .5; drum.scale.setScalar(1 + (st.boom > 0 && !st.mouth ? .08 : 0));
      oss.position.x = k > .28 ? Math.sin(st.t * 30) * 2 : 0;
      Object.entries(hiMats).forEach(([key, m]) => { const on = STG[sg][2] === key; const mats = m.isGroup ? m.children.map((c) => c.material) : [m.material]; mats.forEach((mt) => { if (mt.emissive) { mt.emissive.set(on ? 0xd6182b : 0x000000); mt.emissiveIntensity = on ? .35 : 0; } }); });
      tags.au.p.copy(P(-440, 140)); tags.drum.p.copy(P(-180, 40)); tags.oss.p.copy(P(-110, 50)); tags.coch.p.copy(P(10, -90)); tags.coch.below = true; tags.semi.p.copy(P(-10, 100)); tags.nerve.p.copy(P(170, 30)); tags.brain.p.copy(P(380, 260)); tags.eus.p.copy(P(-30, -210)); tags.eus.below = true;
    },
    panel() {
      const sg = sIdx();
      return {big: f0(st.p), bigFrac: st.p / 100, bigSub: STG[sg][0],
        stName: '听觉形成过程', stAng: `第 ${sg + 1} / 6 步`, stBig: STG[sg][0].split(' · ')[0], stRed: sg >= 3,
        rows: STG.map((s, i) => [s[0], i === sg, i < sg ? '✓' : '']),
        num: String(st.picked.size), unit: '个结构 · 已认识<small>点击 3D 模型</small>', frac: st.picked.size / 9,
        calc: st.mouth ? '张口：外界 ⇄ 咽 ⇄ 咽鼓管 ⇄ 鼓室<br>鼓膜两侧气压 <b>相等</b>' : '闭口：巨响时鼓膜外侧压强突然增大<br>鼓膜两侧气压 <b>不平衡</b>', calcT: '保护鼓膜'};
    },
    reset() { st.picked.clear(); return 0; },
    tour: [{d: 30, dTime: 5, view: 1, cap: '声波经外耳道传到鼓膜，引起鼓膜振动；听小骨把振动传到内耳。', dur: 7}, {d: 50, dTime: 3, view: 2, cap: '耳蜗里的听觉感受器受到刺激，产生神经冲动。', dur: 6}, {d: 100, dTime: 4, view: 0, cap: '神经冲动沿听神经传到大脑皮层的听觉中枢，形成听觉。', dur: 7}],
    quiz: {0: {d: 48, dTime: 3, view: 2, cap: '验证：耳蜗中的感受器接受刺激，产生神经冲动。'}, 1: {d: 100, dTime: 3, view: 0, cap: '验证：听觉在大脑皮层的听觉中枢形成。'}, 2: {view: 1, run: () => { st.mouth = 1; window.pressSeg('segM', 1); document.getElementById('bBoom')?.click(); }, cap: '验证：张口时咽鼓管使鼓膜内外气压平衡。'}, 3: {d: 100, dTime: 3, view: 0, cap: '验证：听觉形成于大脑皮层的听觉中枢，不是耳蜗。'}},
  };
}

/* ----------------------------------------------------------------- 330 光的反射：激光打靶 */
function b330(ctx) {
  const root = G(), st = {th: -10, t: 0, score: 0, tgt: 40, hitT: 0, diffuse: 0, perp: false};
  root.add(bench(1300, 900));
  const H = 70, O = V(0, H, 0), LP = V(-380, H, 300), dIn = O.clone().sub(LP).normalize(), ALPHA = Math.atan2(LP.x, LP.z) / D2R;
  const laser = G(); laser.position.copy(LP); root.add(laser); const lb = cyl(16, 16, 90, MAT.dark()); lb.rotation.x = Math.PI / 2; laser.add(lb); laser.lookAt(O);
  const mir = G(); mir.position.set(0, 0, 0); root.add(mir);
  const glassM = mesh(new THREE.BoxGeometry(200, 120, 6), std2(), false); glassM.position.set(0, H, -3); mir.add(glassM);
  const back = box(204, 124, 4, MAT.dark()); back.position.set(0, H, -8); mir.add(back);
  const foot = box(60, 10, 40, MAT.dark()); foot.position.set(0, 5, -8); mir.add(foot);
  const bumps = G(); mir.add(bumps); for (let i = 0; i < 18; i++) { const b = box(11, 120, 8, MAT.grey()); b.position.set(-94 + i * 11, H, 2); b.rotation.y = (rand() - .5) * 1.1; bumps.add(b); }
  const rIn = glowRod(C.red), rOut = glowRod(C.red); root.add(rIn, rOut);
  const nLine = dashed(0x16181b); root.add(nLine);
  const diffR = Array.from({length: 7}, () => { const a = glowRod(C.red, 1.6), b = glowRod(C.red, 1.6); root.add(a, b); return [a, b]; });
  const target = G(); root.add(target);
  [[40, C.red], [28, 0xffffff], [16, C.red]].forEach(([r, c], i) => { const d = mesh(new THREE.CircleGeometry(r, 40), MAT.col(c, {side: THREE.DoubleSide})); d.position.z = i * .6; target.add(d); });
  const stand = cyl(4, 4, H, MAT.dark()); stand.position.y = -H / 2; target.add(stand);
  const arcI = new THREE.Mesh(new THREE.RingGeometry(58, 62, 40, 1, 0, 1), MAT.glow(C.blue)), arcR = new THREE.Mesh(new THREE.RingGeometry(58, 62, 40, 1, 0, 1), MAT.glow(C.orange)); root.add(arcI, arcR);
  const tags = {laser: makeTag('激光笔', 'Laser'), mir: makeTag('平面镜', 'Mirror'), tgt: makeTag('靶子', '', true), i: makeTag('', '', false), r: makeTag('', '', false)};
  const newTarget = () => { let a; do { a = -10 + rand() * 110; } while (Math.abs(a - st.tgt) < 20); st.tgt = a; };
  const geo = () => { const th = st.th * D2R, n = V(Math.sin(th), 0, Math.cos(th)); const c = -dIn.dot(n); const r = dIn.clone().addScaledVector(n, 2 * c); return {n, c, r, i: Math.acos(clamp(c, -1, 1)) / D2R, psi: Math.atan2(r.x, r.z) / D2R}; };
  function std2() { return new THREE.MeshPhysicalMaterial({color: 0xdfe8ef, metalness: 1, roughness: .04, envMapIntensity: 2.4}); }
  return {
    root, tags, title: '光的反射 <i>·</i> 激光打靶', spec: '反射角 = 入射角 · 三线共面 · 法线居中',
    bigUnit: '° · 反射角', bigMin: '0', bigMax: '90', intro: '转动平面镜，让反射光打中靶心！注意观察：入射角和反射角总是相等。',
    fml: '∠r = ∠i', fmlTag: '光的反射定律', fmlNote: '反射光线、入射光线、法线在同一平面；反射光线与入射光线分居法线两侧；<b>反射角等于入射角</b>。光路可逆。',
    legend: [['光线', C.red], ['法线', C.ink], ['入射角 i', C.blue], ['反射角 r', C.orange]],
    driver: {name: '镜面转角 · Mirror angle', min: -60, max: 40, step: .5, fmt: (v) => f1(v) + '°', get: () => st.th, set: (v) => { st.th = v; }, scale: () => ['-60°', '0°', '40°']},
    extra: (el) => {
      el.innerHTML = segBtns('segD', ['镜面反射', '漫反射'], '反射面 Surface') + `<div class="grp"><div class="seg"><button class="tb" type="button" id="bNew">换一个靶子</button></div></div>`;
      bindSeg(el, 'segD', (v) => { st.diffuse = v; if (v) { ctx.done(2); cap('漫反射：表面凹凸不平，平行光射向四面八方。每一条光线仍遵守反射定律！我们能从各个方向看到书本，就是因为漫反射。'); } });
      el.querySelector('#bNew').onclick = () => newTarget();
      window.pressSeg('segD', st.diffuse);
    },
    views: [['俯视', [0, 1500, 1050], [0, 0, 140]], ['侧面', [-380, 360, 760], [0, 60, 80]]], get home() { return this.views[0]; },
    missions: [
      {t: '用镜面反射连续打中 3 个靶子', k: '反射角等于入射角', check: () => st.score >= 3},
      {t: '让光线垂直射到镜面上（入射角 0°）', k: '垂直入射时光原路返回', check: () => st.perp},
      {t: '换成漫反射表面，看光线去哪了', k: '漫反射也遵守反射定律'},
    ],
    update(dt, anim) {
      st.t += anim; st.hitT = Math.max(0, st.hitT - dt);
      const g = geo(); mir.rotation.y = st.th * D2R; bumps.visible = !!st.diffuse; glassM.visible = !st.diffuse;
      rIn.set(LP.clone().add(dIn.clone().multiplyScalar(48)), O);
      const front = g.c > 0.01;
      if (Math.abs(g.i) < 1.2) st.perp = true;
      const T = V(Math.sin(st.tgt * D2R) * 470, H, Math.cos(st.tgt * D2R) * 470);
      target.position.copy(T); target.lookAt(O.x, H, O.z);
      const hit = front && !st.diffuse && Math.abs(g.psi - st.tgt) < 2.6;
      rOut.visible = front && !st.diffuse; if (rOut.visible) rOut.set(O, O.clone().addScaledVector(g.r, hit ? 470 : 640));
      if (hit && st.hitT <= 0) { st.score++; st.hitT = 1.4; ctx.toast?.(`🎯 命中！第 ${st.score} 个`); ctx.burst?.(); cap(`命中！入射角 ${f1(g.i)}°，反射角 ${f1(g.i)}° —— 两者相等。`); setTimeout(newTarget, 700); }
      nLine.set(O.clone().addScaledVector(g.n, -10), O.clone().addScaledVector(g.n, 260)); nLine.visible = front;
      diffR.forEach(([a, b], k) => { const on = !!st.diffuse && front; a.visible = b.visible = on; if (!on) return; const off = (k - 3) * 26, tang = V(Math.cos(st.th * D2R), 0, -Math.sin(st.th * D2R)); const hitP = O.clone().addScaledVector(tang, off); a.set(hitP.clone().addScaledVector(dIn, -420), hitP); const nn = g.n.clone().applyAxisAngle(V(0, 1, 0), Math.sin(k * 7.3) * .55); const rr = dIn.clone().addScaledVector(nn, -2 * dIn.dot(nn)); b.set(hitP, hitP.clone().addScaledVector(rr, 300)); });
      rIn.visible = !st.diffuse;
      // angle arcs (in XZ plane, drawn flat)
      const nA = Math.atan2(g.n.x, g.n.z), inA = Math.atan2(-dIn.x, -dIn.z), outA = Math.atan2(g.r.x, g.r.z);
      const arc = (m, a0, a1) => { const s = Math.min(a0, a1), e = Math.max(a0, a1); m.geometry.dispose(); m.geometry = new THREE.RingGeometry(70, 76, 32, 1, 0, Math.max(.001, e - s)); m.rotation.set(-Math.PI / 2, 0, s - Math.PI / 2); m.position.set(0, H + 1, 0); m.visible = front && !st.diffuse; };
      arc(arcI, nA, inA); arc(arcR, nA, outA);
      tags.laser.p.copy(LP).add(V(0, 40, 0)); tags.mir.p.set(0, H + 80, 0); tags.tgt.p.copy(T).add(V(0, 55, 0)); tags.tgt.set(hit ? '命中！' : '靶子', `得分 ${st.score}`);
      const mid = (a) => V(Math.sin(a) * 110, H, Math.cos(a) * 110);
      tags.i.p.copy(mid((nA + inA) / 2)); tags.i.set(`i = ${f0(g.i)}°`); tags.i.on = front && !st.diffuse;
      tags.r.p.copy(mid((nA + outA) / 2)); tags.r.set(`r = ${f0(g.i)}°`); tags.r.on = front && !st.diffuse && g.i > 3;
    },
    panel() {
      const g = geo(), front = g.c > .01;
      return {big: front ? f1(g.i) : '—', bigFrac: g.i / 90, bigSub: front ? `入射角 ${f1(g.i)}°` : '光照到了镜子背面',
        stName: '激光打靶', stAng: `得分 ${st.score}`, stBig: st.diffuse ? '漫反射' : Math.abs(g.psi - st.tgt) < 2.6 ? '命中靶心' : g.psi < st.tgt ? '偏左了' : '偏右了', stRed: Math.abs(g.psi - st.tgt) < 2.6,
        rows: [['入射角 i', true, f1(g.i) + '°'], ['反射角 r', true, f1(g.i) + '°'], ['镜面转过', false, f1(st.th) + '°'], ['反射光转过', false, f1(2 * st.th) + '°']],
        num: String(st.score), unit: '命中次数<small>Hits</small>', frac: Math.min(1, st.score / 3),
        calc: `∠r = ∠i = <b>${f1(g.i)}°</b><br>镜子转 θ，反射光转 2θ`, calcT: '反射定律'};
    },
    reset() { st.score = 0; st.perp = false; st.diffuse = 0; window.pressSeg('segD', 0); return -10; },
    tour: [{d: ALPHA, dTime: 3, view: 0, cap: '光线垂直射到镜面：入射角 0°，反射角也是 0°，光沿原路返回。', dur: 6}, {d: 0, dTime: 3, view: 0, cap: '镜子转过一个角度 θ，入射角变化 θ，反射光线转过 2θ。', dur: 6}, {view: 0, run: () => { st.diffuse = 1; window.pressSeg('segD', 1); }, cap: '漫反射：平行光照到粗糙表面，反射光射向各个方向。', dur: 6}],
    quiz: {1: {d: 15, dTime: 3, view: 0, cap: '验证：转动镜面，反射角始终等于入射角。'}, 2: {view: 0, run: () => { st.diffuse = 1; window.pressSeg('segD', 1); ctx.done(2); }, cap: '验证：粗糙表面发生漫反射，各个方向都能看到。'}, 3: {d: ALPHA, dTime: 3, view: 0, cap: '验证：光垂直射到镜面，入射角为 0°。'}},
  };
}

/* ----------------------------------------------------------------- 331 光的折射：叉鱼 */
function b331(ctx) {
  const root = G(), st = {i: 45, t: 0, z0: false, sixty: false, spear: null, fish: 0};
  root.add(bench(1300, 700));
  const W0 = 240, n = 1.33;
  const tank = mesh(new THREE.BoxGeometry(900, 300, 320), MAT.glass(.14), false); tank.position.set(0, 150, 0); root.add(tank);
  const water = mesh(new THREE.BoxGeometry(896, W0, 316), MAT.water(.3), false); water.position.set(0, W0 / 2, 0); root.add(water);
  const surf = mesh(new THREE.PlaneGeometry(896, 316), MAT.fade(0x8fc4ee, .25), false); surf.rotation.x = -Math.PI / 2; surf.position.y = W0 + .5; root.add(surf);
  const O = V(-120, W0, 0);
  const rIn = glowRod(C.red), rRef = glowRod(C.red), rOut = glowRod(C.red, 1.6); rOut.material = MAT.fade(C.red, .35); root.add(rIn, rRef, rOut);
  const nLine = dashed(0x16181b); root.add(nLine); nLine.set(O.clone().add(V(0, 200, 0)), O.clone().add(V(0, -220, 0)));
  const laser = cyl(12, 12, 70, MAT.dark()); root.add(laser);
  // fish + eye + spear
  const FX = 260, FY = 90;
  const fishG = G(); fishG.position.set(FX, FY, 0); root.add(fishG);
  const fb = sph(1, MAT.col(0xf05a23)); fb.scale.set(42, 20, 12); fishG.add(fb); const ft = mesh(new THREE.ConeGeometry(16, 26, 4), MAT.col(0xf05a23)); ft.rotation.z = Math.PI / 2; ft.position.x = -50; fishG.add(ft);
  const ghost = fishG.clone(); ghost.traverse((o) => { if (o.isMesh) o.material = MAT.fade(0xf05a23, .35); }); root.add(ghost);
  const EYE = V(80, 470, 0); const eye = sph(16, MAT.white()); eye.position.copy(EYE); root.add(eye); const pup = sph(7, MAT.dark()); pup.position.copy(EYE).add(V(8, -6, 6)); root.add(pup);
  const sight = dashed(0xf05a23, .8), sight2 = glowRod(0xf05a23, 1.2); sight2.material = MAT.fade(0xf05a23, .5); root.add(sight, sight2);
  const spear = G(); const sr = rod(MAT.wood(), 3); sr.set(V(0, 0, 0), V(0, 260, 0)); spear.add(sr); const tip = mesh(new THREE.ConeGeometry(6, 24, 8), MAT.steel()); tip.rotation.z = Math.PI; tip.position.y = -10; spear.add(tip); spear.visible = false; root.add(spear);
  // apparent depth: viewing from EYE, refracted ray from fish to surface
  const app = () => { // find surface point S where ray fish->S->eye obeys Snell, return image (virtual) position
    let lo = EYE.x, hi = FX, S = 0;
    for (let k = 0; k < 40; k++) { S = (lo + hi) / 2; const sinW = (FX - S) / Math.hypot(S - FX, W0 - FY), sinA = (S - EYE.x) / Math.hypot(EYE.x - S, EYE.y - W0); if (n * sinW > sinA) lo = S; else hi = S; }
    const dirA = V(S - EYE.x, W0 - EYE.y, 0).normalize(); const ext = (W0 - FY * .0) ; // extend eye ray below surface to apparent depth along vertical through fish
    const tt = (FX - EYE.x) / dirA.x; const img = EYE.clone().addScaledVector(dirA, tt); return {S: V(S, W0, 0), img};
  };
  const tags = {laser: makeTag('激光', ''), fish: makeTag('真实的鱼', '', true), img: makeTag('看到的鱼（像）', '更浅'), i: makeTag('', ''), r: makeTag('', '')};
  const ang = () => { const i = st.i * D2R, r = Math.asin(Math.sin(i) / n); return {i, r}; };
  const throwAt = (below) => { const {img} = app(); const aim = below ? V(FX, FY, 0) : img; st.spear = {t: 0, aim, ok: below}; spear.visible = true; };
  return {
    root, tags, title: '光的折射 <i>·</i> 叉鱼', spec: '空气斜射入水：折射角 < 入射角 · 看到的鱼比实际浅',
    bigUnit: '° · 折射角', bigMin: '0', bigMax: '90', intro: '拖动滑块改变激光的入射角，看光进入水中怎样偏折。然后试试叉鱼：应该对准看到的鱼，还是往下方叉？',
    fml: '空气 → 水：∠r < ∠i', fmlTag: '折射规律', fmlNote: '光从空气斜射入水或玻璃，折射光线<b>偏向法线</b>；垂直入射时传播方向<b>不变</b>。池水看起来变浅、筷子“折断”都是折射现象。',
    legend: [['光线', C.red], ['法线', C.ink], ['人眼视线', C.orange]],
    driver: {name: '入射角 i · Incidence', min: 0, max: 80, step: .5, fmt: (v) => f1(v) + '°', get: () => st.i, set: (v) => { st.i = v; if (v < .6) st.z0 = true; if (Math.abs(v - 60) < .8) st.sixty = true; }, scale: () => ['0°', '30°', '60°', '80°']},
    extra: (el) => {
      el.innerHTML = `<div class="grp" style="margin-top:9px"><span class="cp mu">叉鱼 Spear fishing</span><div class="seg"><button class="tb" type="button" id="bA">对准看到的鱼</button><button class="tb red" type="button" id="bB">往看到的鱼下方叉</button></div></div>`;
      el.querySelector('#bA').onclick = () => throwAt(false); el.querySelector('#bB').onclick = () => throwAt(true);
    },
    views: [['全景', [40, 520, 1600], [60, 190, 0]], ['入射点', [-120, 300, 560], [-120, 240, 0]], ['叉鱼', [200, 330, 640], [200, 220, 0]]], get home() { return this.views[0]; },
    missions: [
      {t: '让光线垂直射入水中，看方向变不变', k: '垂直入射，方向不变', check: () => st.z0},
      {t: '把入射角调到 60°，读出折射角', k: '折射角小于入射角', check: () => st.sixty},
      {t: '成功叉到一条鱼', k: '看到的是变浅的虚像'},
    ],
    update(dt, anim) {
      st.t += anim;
      const {i, r} = ang(), din = V(Math.sin(i), -Math.cos(i), 0), start = O.clone().addScaledVector(din, -300);
      laser.position.copy(start); laser.quaternion.setFromUnitVectors(V(0, 1, 0), din);
      rIn.set(start.clone().addScaledVector(din, 30), O);
      const dr = V(Math.sin(r), -Math.cos(r), 0); rRef.set(O, O.clone().addScaledVector(dr, (W0 - 4) / Math.cos(r)));
      rOut.set(O, O.clone().add(V(Math.sin(i), Math.cos(i), 0).multiplyScalar(220)));
      const {S, img} = app();
      ghost.position.copy(img); fishG.position.y = FY + Math.sin(st.t * 2) * 3; fishG.rotation.y = Math.sin(st.t) * .2; ghost.rotation.y = fishG.rotation.y;
      sight.set(S, img); sight2.set(EYE, S);
      if (st.spear) {
        st.spear.t += dt * 1.5; const k = Math.min(1, st.spear.t), from = EYE.clone().add(V(40, 60, 0)), dir = st.spear.aim.clone().sub(from).normalize();
        spear.quaternion.setFromUnitVectors(V(0, -1, 0), dir); spear.position.copy(from).lerp(st.spear.aim.clone().addScaledVector(dir, 20), k);
        if (st.spear.t >= 1 && !st.spear.end) { st.spear.end = true; if (st.spear.ok) { st.fish++; ctx.done(2); ctx.toast?.('🐟 叉到了！'); ctx.burst?.(); cap('✓ 叉到了！光从水中斜射入空气时远离法线偏折，人眼逆着折射光看到的是<b>变浅的虚像</b>，所以要往像的下方叉。'); } else cap('✗ 落空了。你看到的是鱼的<b>虚像</b>，它比真实的鱼浅。往下方一点试试。'); }
        if (st.spear.t > 2.2) { st.spear = null; spear.visible = false; }
      }
      tags.laser.p.copy(start).add(V(0, 50, 0)); tags.fish.p.copy(fishG.position).add(V(0, -30, 0)); tags.fish.below = true; tags.img.p.copy(img).add(V(0, 30, 0));
      tags.i.p.copy(O).add(V(-Math.sin(i / 2) * 90 - 10, Math.cos(i / 2) * 90, 0)); tags.i.set(`i = ${f0(st.i)}°`);
      tags.r.p.copy(O).add(V(Math.sin(r / 2) * 100 + 14, -Math.cos(r / 2) * 100, 0)); tags.r.set(`r = ${f0(r / D2R)}°`); tags.r.below = true;
    },
    panel() {
      const {r} = ang(), rd = r / D2R;
      return {big: f1(rd), bigFrac: rd / 90, bigSub: st.i < .6 ? '垂直入射 · 方向不变' : `比入射角小 ${f1(st.i - rd)}°`,
        stName: '空气 → 水', stAng: 'n水 ≈ 1.33', stBig: st.i < .6 ? '不偏折' : '偏向法线', stRed: st.i >= .6,
        rows: [['入射角 i', true, f1(st.i) + '°'], ['折射角 r', true, f1(rd) + '°'], ['叉到的鱼', st.fish > 0, String(st.fish)]],
        num: f1(st.i - rd), unit: '° · 偏折角度<small>i − r</small>', frac: (st.i - rd) / 40,
        calc: `sin r = sin i ÷ 1.33<br>r = <b>${f1(rd)}°</b> < i = ${f1(st.i)}°`, calcT: '折射角（拓展）',
        chart: {t: '折射角–入射角', u: 'r < i', x0: 0, x1: 90, y0: 0, y1: 90, xl: 'i / °', yl: 'r / °', paths: [{pts: [[0, 0], [90, 90]], c: C.faint, dash: '3 3'}, {pts: curve((x) => Math.asin(Math.sin(x * D2R) / n) / D2R, 0, 90), c: C.red}], pt: [st.i, rd]}};
    },
    reset() { st.z0 = st.sixty = false; return 45; },
    tour: [{d: 0, dTime: 3, view: 1, cap: '光垂直射入水中，传播方向不改变。', dur: 5}, {d: 60, dTime: 4, view: 1, cap: '斜射时光向法线偏折：入射角 60°，折射角只有约 41°。', dur: 6}, {view: 2, run: () => throwAt(true), cap: '人眼看到的是鱼的虚像，在真实位置的上方。叉鱼要往下方叉。', dur: 7}],
    quiz: {0: {d: 50, dTime: 3, view: 1, cap: '验证：空气斜射入水，折射角小于入射角。'}, 1: {view: 2, cap: '验证：虚像比真实的鱼浅 —— 池水看起来变浅。'}, 2: {view: 2, cap: '验证：水中的筷子“折断”与看到的鱼变浅是同一个原理：折射。'}, 3: {view: 2, run: () => throwAt(false), cap: '验证：对准看到的“鱼”会叉空 —— 因为折射，看到的是虚像。'}},
  };
}

/* ----------------------------------------------------------------- 332 凸透镜成像（移植） */
function b332(ctx) {
  const s = buildLens(ctx), st = s.st;
  s.missions = [
    {t: '找到成倒立、等大实像的位置（u = 2f）', k: 'u = 2f 时 v = 2f', check: () => Math.abs(st.u - 2 * st.f) < .6},
    {t: '把蜡烛放在 f 和 2f 之间（投影仪）', k: 'f < u < 2f，倒立放大实像', check: () => st.u > st.f + .5 && st.u < 2 * st.f - .5},
    {t: '把蜡烛移到焦点以内（放大镜）', k: 'u < f，正立放大虚像', check: () => st.u < st.f - .5},
  ];
  s.quiz = {0: {run: () => s.setF(10), d: 32, view: 0, cap: '验证：u > 2f，倒立缩小实像（照相机）。'}, 1: {run: () => s.setF(10), d: 6, view: 1, cap: '验证：u < f，透过透镜看到正立放大的虚像（放大镜）。'}, 2: {run: () => s.setF(10), d: 15, view: 2, cap: '验证：f = 10 cm，u = 15 cm 在 f 与 2f 之间，成倒立放大实像。'}, 3: {run: () => s.setF(10), d: 6, view: 1, cap: '验证：放大镜成正立、放大的虚像。'}};
  return s;
}

/* ----------------------------------------------------------------- 333 眼与视觉：近视与远视 */
const EYES = [['正常眼', .024], ['近视眼', .0275], ['远视眼', .0225]];
function b333(ctx) {
  const root = G(), st = {D: 50, mode: 0, gl: 0, t: 0, ok1: false, ok2: false};
  root.add(bench(1300, 640));
  const S = 10000, Y = 240, LX = -100; // lens at x = LX, 1 m = 10000 units
  const eye = G(); root.add(eye);
  const ball = mesh(new THREE.SphereGeometry(1, 48, 32), MAT.col(0xffffff, {transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide}), false); eye.add(ball);
  const retina = mesh(new THREE.SphereGeometry(.97, 48, 32, Math.PI / 2, Math.PI, 0, Math.PI), MAT.col(0xd6182b, {side: THREE.BackSide, transparent: true, opacity: .55}), false); retina.userData.pick = 'ret'; eye.add(retina);
  const cornea = mesh(new THREE.SphereGeometry(.42, 32, 16, 0, TAU, 0, Math.PI / 2), MAT.glass(.3), false); cornea.rotation.z = Math.PI / 2; cornea.position.x = -.86; eye.add(cornea);
  const iris = mesh(new THREE.RingGeometry(.2, .55, 40), MAT.col(0x5b3a24, {side: THREE.DoubleSide})); iris.rotation.y = Math.PI / 2; iris.position.x = -.72; eye.add(iris);
  const lens = sph(1, MAT.col(0xcfe6ff, {transparent: true, opacity: .75, clearcoat: 1})); lens.userData.pick = 'lens'; root.add(lens);
  const nerve = cyl(18, 22, 120, MAT.col(0xf0c64a)); nerve.rotation.z = Math.PI / 2; root.add(nerve); nerve.userData.pick = 'nerve';
  const glasses = G(); root.add(glasses);
  const concave = mesh(new THREE.LatheGeometry([[16, -50], [6, -25], [4, 0], [6, 25], [16, 50]].map(([x, y]) => new THREE.Vector2(x, y)), 32), MAT.glass(.5), false); concave.rotation.z = Math.PI / 2; concave.rotation.set(0, 0, Math.PI / 2);
  const convex = sph(1, MAT.glass(.5)); convex.scale.set(14, 55, 55);
  const frame = mesh(new THREE.TorusGeometry(56, 3, 8, 48), MAT.dark()); frame.rotation.y = Math.PI / 2;
  glasses.add(concave, convex, frame); glasses.position.set(LX - 230, Y, 0);
  const rays = [-44, -22, 22, 44].map(() => [glowRod(C.red, 1.6), glowRod(C.red, 1.6), glowRod(C.red, 1.6)]); rays.flat().forEach((r) => root.add(r));
  const spot = mesh(new THREE.CircleGeometry(1, 32), MAT.glow(C.red), false); spot.rotation.y = Math.PI / 2; root.add(spot);
  const imgT = canvasTex(256, 200, () => {});
  const imgP = new THREE.Mesh(new THREE.PlaneGeometry(130, 102), new THREE.MeshBasicMaterial({map: imgT, toneMapped: false})); imgP.position.set(250, Y + 150, 0); root.add(imgP);
  const objBox = G(); root.add(objBox); const chart = textPlate('E', {h: 50, color: C.ink, bg: '#ffffff', px: 120}); objBox.add(chart);
  const tags = {lens: makeTag('晶状体', '相当于凸透镜'), ret: makeTag('视网膜', '感光细胞', true), img: makeTag('视网膜上的像', ''), obj: makeTag('', ''), gl: makeTag('', '')};
  const P0 = 1 / .024, GL = [0, -5.3, 4];
  const DIST = () => .2 * Math.pow(50, st.D / 100);
  const optics = () => {
    const v0 = EYES[st.mode][1], D = DIST(), g = GL[st.gl], acc = 4;
    const need = 1 / D + 1 / v0 - g, P = clamp(need, P0, P0 + acc);
    const tot = P + g - 1 / D; const v = tot > 0 ? 1 / tot : Infinity;
    return {v0, D, P, v, blur: Math.abs(v === Infinity ? 1 : (v - v0) / v), acc: (P - P0) / acc};
  };
  let lastB = -1;
  const INFO = {lens: '晶状体：透明、有弹性，<b>相当于凸透镜</b>。睫状体调节它的曲度，使远近物体都能成像在视网膜上。', ret: '视网膜：有<b>感光细胞</b>，物像在这里形成（倒立、缩小的实像）。', nerve: '视神经：把神经冲动传到大脑皮层的视觉中枢，<b>形成视觉</b>。'};
  return {
    root, tags, pickables: [lens, retina, nerve], title: '眼 <i>·</i> 近视与远视', spec: '晶状体 ≈ 凸透镜 · 视网膜成倒立缩小实像 · 视觉在大脑形成',
    bigUnit: 'm · 物体距离', bigMin: '0.2', bigMax: '10', intro: '拖动滑块让物体远近变化，看光线会聚在哪里。切换近视眼、远视眼，再给它配一副合适的眼镜。',
    fml: '近视 → 凹透镜 · 远视 → 凸透镜', fmlTag: '矫正方法', fmlNote: '近视：晶状体太凸或眼球前后径过长，远处物体成像在视网膜<b>前方</b>；远视：成像在视网膜<b>后方</b>。',
    legend: [['光线', C.red], ['视网膜', '#d6182b']],
    driver: {name: '物体距离 · Distance', min: 0, max: 100, step: .5, fmt: () => f2(DIST()) + ' m', get: () => st.D, set: (v) => { st.D = v; }, scale: () => ['0.2 m', '1.4 m', '10 m'], track: () => [[0, 30, '#eba4ab'], [30, 100, C.faint]]},
    extra: (el) => {
      el.innerHTML = segBtns('segE', EYES.map((e) => e[0]), '眼睛 Eye') + segBtns('segG', ['不戴', '凹透镜', '凸透镜'], '眼镜 Glasses');
      bindSeg(el, 'segE', (v) => { st.mode = v; }); bindSeg(el, 'segG', (v) => { st.gl = v; });
      window.pressSeg('segE', st.mode); window.pressSeg('segG', st.gl);
    },
    views: [['全景', [-60, 520, 1350], [20, 220, 0]], ['眼球', [-40, 330, 620], [-20, 240, 0]]], get home() { return this.views[0]; },
    missions: [
      {t: '近视眼看远处：戴上合适的眼镜，看清楚', k: '近视戴凹透镜', check: () => st.ok1},
      {t: '远视眼看近处：戴上合适的眼镜，看清楚', k: '远视戴凸透镜', check: () => st.ok2},
      {t: '点击找出相当于凸透镜的结构', k: '晶状体相当于凸透镜'},
    ],
    pick(k) { if (!k) return null; if (k === 'lens') ctx.done(2); return INFO[k]; },
    update(dt, anim) {
      st.t += anim;
      const o = optics(), Lr = o.v0 * S, R = (Lr + 50) / 2, cx = LX - 50 + R;
      ball.scale.set(R, 150, 150); retina.scale.set(R, 150, 150); eye.position.set(cx, Y, 0);
      cornea.scale.set(.5 * 150 / R, .5, .5); cornea.position.x = (LX - 50 - cx) / R + .04; iris.position.x = (LX - 20 - cx) / R;
      lens.position.set(LX, Y, 0); const th = 14 + o.acc * 16; lens.scale.set(th, 52, 52);
      nerve.position.set(cx + R + 40, Y - 20, 0);
      const xr = LX + Lr, D = o.D * S;
      let maxY = 0;
      [-44, -22, 22, 44].forEach((y, k) => {
        const [a, b, c] = rays[k], x0 = LX - 360, sIn = y / D, yStart = y - sIn * 360;
        const yG = y - sIn * 230, gx = LX - 230;
        let s1 = sIn - yG * GL[st.gl] / S; // after glasses
        const yL = yG + s1 * 230;
        a.set(V(x0, Y + yStart, 0), V(gx, Y + yG, 0)); b.set(V(gx, Y + yG, 0), V(LX, Y + yL, 0));
        const s2 = s1 - yL * o.P / S, yR = yL + s2 * Lr; maxY = Math.max(maxY, Math.abs(yR));
        c.set(V(LX, Y + yL, 0), V(xr, Y + yR, 0));
      });
      spot.position.set(xr - 3, Y, 0); spot.scale.setScalar(Math.max(3, maxY)); spot.material.opacity = 1;
      const blur = clamp(maxY * 1.6 - 1, 0, 14);
      if (Math.abs(blur - lastB) > .2) { lastB = blur; imgT.redraw((g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.filter = `blur(${blur}px)`; g.save(); g.translate(w / 2, h / 2 + 6); g.rotate(Math.PI); g.fillStyle = C.ink; g.font = FONT(900, 110); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('E', 0, 0); g.restore(); g.filter = 'none'; g.fillStyle = blur < 1.2 ? C.green : C.red; g.fillRect(0, h - 10, w, 10); }); }
      glasses.visible = st.gl > 0; concave.visible = st.gl === 1; convex.visible = st.gl === 2;
      const clear = maxY < 1.5; st.maxY = maxY;
      if (clear && st.mode === 1 && st.gl === 1 && o.D > 3) st.ok1 = true;
      if (clear && st.mode === 2 && st.gl === 2 && o.D < .4) st.ok2 = true;
      objBox.position.set(LX - 470, Y + 20, 0); chart.scale.setScalar(1);
      tags.lens.p.set(LX, Y + 70, 0); tags.ret.p.set(xr, Y - 160, 0); tags.ret.below = true; tags.img.p.set(250, Y + 210, 0); tags.img.set('视网膜上的像', clear ? '清晰 · 倒立缩小' : '模糊');
      tags.obj.p.set(LX - 470, Y + 70, 0); tags.obj.set('物体', f2(o.D) + ' m');
      tags.gl.p.set(LX - 230, Y + 80, 0); tags.gl.set(['', '凹透镜', '凸透镜'][st.gl], st.gl === 1 ? '发散' : '会聚'); tags.gl.on = st.gl > 0;
    },
    panel() {
      const o = optics(), where = (st.maxY ?? 0) < 1.5 ? '视网膜上' : o.v === Infinity || o.v > o.v0 ? '视网膜后方' : '视网膜前方';
      return {big: f2(o.D), bigFrac: st.D / 100, bigSub: `${EYES[st.mode][0]} · ${['不戴眼镜', '戴凹透镜', '戴凸透镜'][st.gl]}`,
        stName: '成像位置', stAng: EYES[st.mode][0], stBig: where, stRed: where !== '视网膜上',
        rows: [['晶状体调节', o.acc > .02, o.acc >= .99 ? '已到极限' : f0(o.acc * 100) + ' %'], ['成像位置', where === '视网膜上', where], ['看得清吗', where === '视网膜上', where === '视网膜上' ? '清晰' : '模糊']],
        num: f0(o.acc * 100), unit: '% · 晶状体调节<small>看近处时晶状体变凸</small>', frac: o.acc,
        calc: st.mode === 1 ? '近视：像成在视网膜<b>前方</b><br>用<b>凹透镜</b>使光线先发散' : st.mode === 2 ? '远视：像成在视网膜<b>后方</b><br>用<b>凸透镜</b>使光线先会聚' : '正常眼：睫状体调节晶状体曲度<br>远近物体都成像在视网膜上', calcT: '原理'};
    },
    reset() { st.mode = 0; st.gl = 0; window.pressSeg('segE', 0); window.pressSeg('segG', 0); return 50; },
    tour: [{d: 100, view: 1, run: () => { st.mode = 1; st.gl = 0; window.pressSeg('segE', 1); window.pressSeg('segG', 0); }, cap: '近视眼看远处：光线会聚在视网膜前方，看到的是模糊的像。', dur: 6}, {view: 1, run: () => { st.gl = 1; window.pressSeg('segG', 1); }, cap: '戴上凹透镜，光线先发散一些，像就落到了视网膜上。', dur: 6}, {d: 5, view: 1, run: () => { st.mode = 2; st.gl = 2; window.pressSeg('segE', 2); window.pressSeg('segG', 2); }, cap: '远视眼看近处：像在视网膜后方，戴凸透镜矫正。', dur: 7}],
    quiz: {0: {view: 1, cap: '验证：晶状体相当于凸透镜，感光细胞在视网膜上。', run: () => ctx.done(2)}, 2: {d: 100, view: 1, run: () => { st.mode = 1; st.gl = 1; window.pressSeg('segE', 1); window.pressSeg('segG', 1); }, cap: '验证：近视眼佩戴凹透镜矫正。'}, 3: {d: 100, view: 1, run: () => { st.mode = 1; st.gl = 0; window.pressSeg('segE', 1); window.pressSeg('segG', 0); }, cap: '验证：近视眼成像在视网膜前方。'}},
  };
}

export const C6 = {326: {n: 3, build: b326}, 327: {n: 3, build: b327}, 328: {n: 3, build: b328}, 329: {n: 3, build: b329}, 330: {n: 3, build: b330}, 331: {n: 3, build: b331}, 332: {n: 3, build: b332}, 333: {n: 3, build: b333}};
