/* 七下·第3章 运动和力 : 334–338 */
import * as THREE from 'three';
import {C, MAT, G, V, D2R, TAU, clamp, lerp, f0, f1, f2, mesh, box, cyl, sph, rod, arrow, canvasTex, FONT, makeTag, bench, rand, spring, curve} from '../kit.js';

const cap = (t) => { const el = document.getElementById('caption'); if (el) el.innerHTML = t; };
const segBtns = (id, labels, title) => `<div class="grp" style="margin-top:9px"><span class="cp mu">${title}</span><div class="seg" id="${id}">${labels.map((n, i) => `<button class="tb" data-v="${i}" type="button">${n}</button>`).join('')}</div></div>`;
const bindSeg = (el, id, fn) => el.querySelectorAll('#' + id + ' .tb').forEach((b) => b.onclick = () => { fn(+b.dataset.v); window.pressSeg(id, +b.dataset.v); });
function wheelSet(g, xs, z, r = 16, y = r) { xs.forEach((x) => [z, -z].forEach((zz) => { const w = cyl(r, r, 8, MAT.dark(), 20); w.rotation.x = Math.PI / 2; w.position.set(x, y, zz); g.add(w); })); }
function tree(h = 1) { const g = G(); const t = cyl(8, 11, 70 * h, MAT.wood(), 10); t.position.y = 35 * h; g.add(t); const c = sph(42 * h, MAT.col(0x2f9e6a), 16); c.position.y = 95 * h; g.add(c); return g; }
function trainCar(col, len = 300) { const g = G(); const b = box(len, 90, 110, MAT.col(col)); b.position.y = 70; g.add(b); const r = box(len - 10, 10, 116, MAT.white()); r.position.y = 120; g.add(r); for (let i = 0; i < 4; i++) { const w = box(44, 30, 2, MAT.col(0xcfe6ff, {transparent: true, opacity: .7})); w.position.set(-len / 2 + 50 + i * 66, 84, 56); g.add(w); } wheelSet(g, [-len / 2 + 50, len / 2 - 50], 46, 14, 18); return g; }

/* ----------------------------------------------------------------- 334 机械运动与参照物 */
function b334(ctx) {
  const root = G(), st = {v: 60, ref: 0, t: 0, x: {train: 0, opp: 400, w: 0}, seen: new Set([0])};
  root.add(bench(2000, 700));
  const WR = 1000; // wrap half-width
  const world = G(); root.add(world);
  const rails = [-60, 120].map((z) => { const r = box(2 * WR + 400, 6, 60, MAT.grey()); r.position.set(0, 3, z); root.add(r); return r; });
  const sleepers = G(); for (let i = 0; i < 40; i++) { const s = box(16, 4, 90, MAT.wood()); s.position.set(-WR + i * 50, 2, -60); sleepers.add(s); const s2 = s.clone(); s2.position.z = 120; sleepers.add(s2); } world.add(sleepers);
  const trees = [-800, -450, -100, 260, 620].map((x, i) => { const t = tree(.9 + (i % 2) * .25); t.position.set(x, 0, -230); world.add(t); return t; });
  const station = box(220, 140, 80, MAT.white()); station.position.set(-300, 70, -300); world.add(station);
  const train = G(); [-310, 0, 310].forEach((x, i) => { const c = trainCar(i === 2 ? 0xd6182b : 0xf3f0ea); c.position.x = x; train.add(c); }); train.position.z = 120; root.add(train);
  const pax = G(); const pb = cyl(14, 14, 40, MAT.col(0x3d8fe0)); pb.position.y = 78; pax.add(pb); const ph = sph(12, MAT.col(0xf2c9b0)); ph.position.y = 108; pax.add(ph); pax.position.set(310 - 60, 0, 30); train.add(pax);
  const opp = G(); [0, 310].forEach((x) => { const c = trainCar(0x5d6670); c.position.x = x; opp.add(c); }); opp.position.z = -60; root.add(opp);
  const REFS = ['地面', '车厢', '对面列车'];
  const tags = {pax: makeTag('乘客', '', true), tree: makeTag('大树', ''), opp: makeTag('对面列车', '60 km/h')};
  const vel = () => ({tree: 0, train: st.v, pax: st.v, opp: -60});
  const rel = (k) => vel()[k] - [0, st.v, -60][st.ref];
  const wrap = (x) => ((x + WR) % (2 * WR) + 2 * WR) % (2 * WR) - WR;
  return {
    root, tags, title: '参照物 <i>·</i> 运动是相对的', spec: '物体位置随时间变化叫机械运动 · 选不同的参照物，结论可能不同',
    bigUnit: 'km/h · 火车车速（对地）', bigMin: '0', bigMax: '120', intro: '你坐在红色车厢里。切换参照物，看看大树、乘客和对面的列车谁在动、谁静止。',
    fml: '运动和静止是相对的', fmlTag: '关键结论', fmlNote: '判断物体是否运动，先选<b>参照物</b>；相对参照物位置改变 → 运动，不变 → 静止。参照物不能选研究对象本身。',
    legend: [['我们的火车', C.red], ['对面列车', C.grey]],
    driver: {name: '火车车速 · Train speed', min: 0, max: 120, step: 1, fmt: (v) => f0(v) + ' km/h', get: () => st.v, set: (v) => { st.v = v; }, scale: () => ['0', '60', '120 km/h']},
    extra: (el) => { el.innerHTML = segBtns('segR', REFS, '参照物 Reference'); bindSeg(el, 'segR', (v) => { st.ref = v; st.seen.add(v); cap(`以<b>${REFS[v]}</b>为参照物：乘客${Math.abs(rel('pax')) < .5 ? '<b>静止</b>' : '<b>运动</b>'}，大树${Math.abs(rel('tree')) < .5 ? '<b>静止</b>' : '<b>运动</b>'}。`); }); window.pressSeg('segR', st.ref); },
    views: [['全景', [0, 760, 2100], [0, 40, 0]], ['车厢', [250, 260, 520], [250, 90, -60]]], get home() { return this.views[0]; },
    missions: [
      {t: '以车厢为参照物，看乘客是否运动', k: '乘客相对车厢静止', check: () => st.ref === 1 && st.v > 0},
      {t: '以对面列车为参照物，算一算相对速度', k: '相向而行，相对速度相加', check: () => st.ref === 2 && st.v > 0},
      {t: '让火车停下，以车厢为参照物看大树', k: '车停下时大树相对车厢静止', check: () => st.ref === 1 && st.v === 0},
    ],
    update(dt, anim) {
      st.t += anim;
      const k = 3.2; // units per (km/h·s)
      const camV = [0, st.v, -60][st.ref];
      st.x.w -= camV * k * anim;
      st.x.train = wrap(st.x.train + (st.v - camV) * k * anim); st.x.opp = wrap(st.x.opp + (-60 - camV) * k * anim);
      if (st.ref === 1) st.x.train = 0; if (st.ref === 2) st.x.opp = 0;
      train.position.x = st.x.train; opp.position.x = st.x.opp;
      sleepers.position.x = ((st.x.w % 50) + 50) % 50;
      world.children.forEach((c) => { if (c === sleepers) return; const x0 = c.userData.x0 ?? (c.userData.x0 = c.position.x); c.position.x = wrap(x0 + st.x.w); });
      const pw = V(); pax.getWorldPosition(pw); tags.pax.p.copy(pw).add(V(0, 140, 0)); tags.pax.set('乘客', Math.abs(rel('pax')) < .5 ? '静止' : `运动 ${f0(Math.abs(rel('pax')))} km/h`);
      const tw = V(); trees[2].getWorldPosition(tw); tags.tree.p.copy(tw).add(V(0, 160, 0)); tags.tree.set('大树', Math.abs(rel('tree')) < .5 ? '静止' : `运动 ${f0(Math.abs(rel('tree')))} km/h`);
      tags.opp.p.set(opp.position.x + 150, 150, -60); tags.opp.set('对面列车', Math.abs(rel('opp')) < .5 ? '静止' : `运动 ${f0(Math.abs(rel('opp')))} km/h`);
    },
    panel() {
      const items = [['大树', 'tree'], ['乘客', 'pax'], ['对面列车', 'opp']];
      return {big: f0(st.v), bigFrac: st.v / 120, bigSub: `参照物：${REFS[st.ref]}`,
        stName: '以' + REFS[st.ref] + '为参照物', stAng: '相对速度', stBig: `乘客${Math.abs(rel('pax')) < .5 ? '静止' : '运动'}`, stRed: Math.abs(rel('pax')) >= .5,
        rows: items.map(([n, k]) => [n, Math.abs(rel(k)) >= .5, Math.abs(rel(k)) < .5 ? '静止' : f0(Math.abs(rel(k))) + ' km/h']),
        num: f0(Math.abs(rel('opp'))), unit: 'km/h · 对面列车的相对速度<small>相向：v₁ + v₂</small>', frac: Math.abs(rel('opp')) / 180,
        calc: st.ref === 2 ? `相向行驶：v相对 = ${f0(st.v)} + 60<br>= <b>${f0(st.v + 60)} km/h</b>` : `v相对 = v物 − v参照物<br>乘客：${f0(st.v)} − ${f0([0, st.v, -60][st.ref])} = <b>${f0(rel('pax'))} km/h</b>`, calcT: '相对速度（拓展）'};
    },
    reset() { st.ref = 0; window.pressSeg('segR', 0); return 60; },
    tour: [{d: 60, view: 0, run: () => { st.ref = 0; window.pressSeg('segR', 0); }, cap: '以地面为参照物：火车和乘客在运动，大树静止。', dur: 6}, {view: 1, run: () => { st.ref = 1; window.pressSeg('segR', 1); }, cap: '以车厢为参照物：乘客静止，窗外的大树向后运动。', dur: 6}, {view: 0, run: () => { st.ref = 2; window.pressSeg('segR', 2); }, cap: '以对面列车为参照物：我们的火车以 120 km/h 的速度飞驰。运动是相对的。', dur: 7}],
    quiz: {0: {view: 0, run: () => { st.ref = 0; window.pressSeg('segR', 0); }, cap: '验证：“月亮躲进云里”是以云为参照物，月亮在运动。'}, 1: {view: 1, run: () => { st.ref = 1; window.pressSeg('segR', 1); }, cap: '验证：以车厢为参照物乘客静止，以地面为参照物乘客运动。'}, 3: {view: 1, run: () => { st.ref = 1; window.pressSeg('segR', 1); }, cap: '验证：乘客相对座椅（车厢）静止。'}},
  };
}

/* ----------------------------------------------------------------- 335 速度：百米赛跑 */
function b335(ctx) {
  const root = G(), st = {vB: 4, t: -1, tA: null, tB: null, runs: 0, tie: false, fast: false};
  const L = 1000, X0 = -500; // 100 m = 1000 units
  root.add(bench(1300, 520));
  const lanes = [-70, 70].map((z, i) => { const l = box(L + 80, 4, 120, MAT.col(i ? 0xd6182b : 0x3d8fe0, {transparent: true, opacity: .18})); l.position.set(0, 2, z); root.add(l); return l; });
  for (let m = 0; m <= 100; m += 10) { const t = box(3, 5, 260, MAT.col(m % 50 ? 0xc9ccd0 : 0x16181b)); t.position.set(X0 + m * 10, 3, 0); root.add(t); }
  const finish = box(8, 160, 8, MAT.red()); finish.position.set(X0 + L, 80, -150); root.add(finish); const f2b = finish.clone(); f2b.position.z = 150; root.add(f2b);
  const tape = box(4, 6, 300, MAT.glow(C.red)); tape.position.set(X0 + L, 120, 0); root.add(tape);
  const car = (col) => { const g = G(); const b = box(70, 30, 46, MAT.col(col)); b.position.y = 30; g.add(b); const c = box(36, 22, 40, MAT.col(0xcfe6ff)); c.position.set(-4, 56, 0); g.add(c); wheelSet(g, [-22, 22], 24, 11, 11); return g; };
  const A = car(0x3d8fe0), B = car(0xd6182b); A.position.set(X0, 0, -70); B.position.set(X0, 0, 70); root.add(A, B);
  const tags = {A: makeTag('A 车 · 5 m/s', ''), B: makeTag('', '', true)};
  const vA = 5, sAt = (v) => (st.t < 0 ? 0 : Math.min(100, v * st.t));
  const start = () => { st.t = 0; st.tA = st.tB = null; };
  return {
    root, tags, title: '速度 <i>·</i> 百米赛跑', spec: 'v = s / t · 1 m/s = 3.6 km/h',
    bigUnit: 'm/s · B 车速度', bigMin: '1', bigMax: '20', intro: 'A 车以 5 m/s 匀速行驶。调 B 车的速度，点“开始比赛”，比一比谁先跑完 100 m。看右下角的 s–t 图像。',
    fml: 'v = s / t', fmlTag: '速度公式', fmlNote: '速度表示物体<b>运动快慢</b>。单位换算：1 m/s = 3.6 km/h。匀速直线运动中速度不变，与路程、时间无关。',
    legend: [['A 车', C.blue], ['B 车', C.red]],
    driver: {name: 'B 车速度 · Speed', min: 1, max: 20, step: .5, fmt: (v) => f1(v) + ' m/s', get: () => st.vB, set: (v) => { st.vB = v; }, scale: () => ['1 m/s', '5', '10', '20 m/s']},
    extra: (el) => { el.innerHTML = `<div class="grp" style="margin-top:9px"><span class="cp mu">比赛 Race · 100 m</span><div class="seg"><button class="tb red" type="button" id="bGo">开始比赛</button></div></div>`; el.querySelector('#bGo').onclick = start; },
    views: [['全景', [0, 1250, 1750], [0, 0, 40]], ['终点', [560, 260, 420], [480, 40, 0]]], get home() { return this.views[0]; },
    missions: [
      {t: '完成一次 100 m 比赛', k: 'v = s / t', check: () => st.runs >= 1},
      {t: '让 A、B 两车同时到达终点', k: '速度相同，相同路程用时相同', check: () => st.tie},
      {t: '把 B 车调到 54 km/h 再比一次', k: '54 km/h = 15 m/s', check: () => st.fast},
    ],
    update(dt, anim) {
      if (st.t >= 0) {
        st.t += anim;
        if (st.tA === null && vA * st.t >= 100) st.tA = 100 / vA;
        if (st.tB === null && st.vB * st.t >= 100) st.tB = 100 / st.vB;
        if (st.tA !== null && st.tB !== null) {
          st.runs++; if (Math.abs(st.vB - vA) < .01) st.tie = true; if (Math.abs(st.vB - 15) < .01) st.fast = true;
          const w = st.tB < st.tA ? 'B 车赢了' : st.tB > st.tA ? 'A 车赢了' : '同时到达';
          ctx.toast?.(`🏁 ${w}`); cap(`${w}！A：100 m ÷ ${f1(st.tA)} s = 5 m/s；B：100 m ÷ ${f1(st.tB)} s = ${f1(st.vB)} m/s（${f1(st.vB * 3.6)} km/h）。`); st.t = -2;
        }
      }
      const sa = st.t === -2 ? 100 : sAt(vA), sb = st.t === -2 ? 100 : sAt(st.vB);
      A.position.x = X0 + sa * 10; B.position.x = X0 + sb * 10;
      tags.A.p.copy(A.position).add(V(0, 90, 0)); tags.B.p.copy(B.position).add(V(0, 90, 0)); tags.B.set(`B 车 · ${f1(st.vB)} m/s`, `${f1(st.vB * 3.6)} km/h`);
    },
    panel() {
      const tt = st.t >= 0 ? st.t : 0, maxT = Math.max(20, 100 / st.vB);
      return {big: f1(st.vB), bigFrac: st.vB / 20, bigSub: `= ${f1(st.vB * 3.6)} km/h`,
        stName: '比赛', stAng: st.t >= 0 ? `t = ${f1(tt)} s` : '准备', stBig: st.t >= 0 ? '比赛中' : st.tA ? (st.tB < st.tA ? 'B 车赢' : st.tB > st.tA ? 'A 车赢' : '平局') : '点开始比赛', stRed: st.t >= 0,
        rows: [['A 车用时', !!st.tA, st.tA ? f1(st.tA) + ' s' : '—'], ['B 车用时', !!st.tB, st.tB ? f1(st.tB) + ' s' : '—'], ['B 车 km/h', false, f1(st.vB * 3.6)]],
        num: f1(100 / st.vB), unit: 's · B 车跑完 100 m<small>t = s / v</small>', frac: Math.min(1, (100 / st.vB) / 100),
        calc: `t = s / v = 100 m ÷ ${f1(st.vB)} m/s<br>= <b>${f1(100 / st.vB)} s</b>`, calcT: '代入计算',
        chart: {t: '路程–时间 s–t', u: '斜率 = 速度', x0: 0, x1: maxT, y0: 0, y1: 100, xl: 't / s', yl: 's / m', paths: [{pts: [[0, 0], [20, 100]], c: C.blue}, {pts: [[0, 0], [100 / st.vB, 100]], c: C.red}], pt: st.t >= 0 ? [tt, sAt(st.vB)] : null}};
    },
    reset() { st.t = -1; st.tA = st.tB = null; return 4; },
    tour: [{d: 8, view: 0, run: start, cap: 'B 车 8 m/s，比 A 车快：相同路程用时更少。s–t 图像越陡，速度越大。', dur: 15}, {d: 5, view: 0, run: start, cap: '两车速度相同，同时到达终点。', dur: 21}],
    quiz: {0: {d: 15, view: 0, run: start, cap: '验证：54 km/h ÷ 3.6 = 15 m/s。'}, 1: {d: 5, view: 0, run: start, cap: '验证：100 m 用 20 s，v = 100 ÷ 20 = 5 m/s。'}, 3: {d: 5, view: 0, run: start, cap: '验证：25 m ÷ 5 s = 5 m/s。'}},
  };
}

/* ----------------------------------------------------------------- 336 弹簧测力计与重力 */
const PLANETS = [['地球', 10], ['月球', 1.6], ['火星', 3.7]];
function b336(ctx) {
  const root = G(), st = {m: 200, pl: 0, rec: [], t: 0, y: 0, moon: false};
  root.add(bench(1000, 560));
  const stand = G(); root.add(stand);
  const base = box(300, 20, 180, MAT.dark()); base.position.set(-40, 10, 0); stand.add(base);
  const pole = cyl(8, 8, 740, MAT.steel()); pole.position.set(-110, 380, 0); stand.add(pole);
  const arm = cyl(6, 6, 160, MAT.steel()); arm.rotation.z = Math.PI / 2; arm.position.set(-30, 740, 0); stand.add(arm);
  const body = box(70, 260, 26, MAT.white()); body.position.set(50, 590, 0); stand.add(body);
  const faceT = canvasTex(128, 512, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = C.ink; for (let i = 0; i <= 50; i++) { const y = 30 + i * 9; g.fillRect(i % 10 ? 70 : 50, y, i % 10 ? 30 : 50, 2); if (i % 10 === 0) { g.font = FONT(800, 28); g.fillText(String(i / 10), 14, y + 10); } } g.font = FONT(700, 24); g.fillText('N', 54, 500); });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(64, 256), new THREE.MeshBasicMaterial({map: faceT, toneMapped: false})); face.position.set(50, 590, 13.5); stand.add(face);
  const PX = (N) => 590 + 128 - (30 + N * 90) / 512 * 256; // y of N on the face
  const ptr = box(40, 4, 4, MAT.glow(C.red)); ptr.position.z = 16; stand.add(ptr);
  const spr = spring(10, 14, 1.6); spr.position.set(50, 0, 0); stand.add(spr);
  const hookRod = rod(MAT.steel(), 2.4); stand.add(hookRod);
  const masses = Array.from({length: 5}, () => { const m = cyl(30, 30, 34, MAT.brass(), 32); stand.add(m); return m; });
  const gArrow = arrow(C.red, 4); stand.add(gArrow);
  const tags = {sc: makeTag('弹簧测力计', ''), m: makeTag('', '', true)};
  const G_ = () => st.m / 1000 * PLANETS[st.pl][1];
  return {
    root, tags, title: '重力 <i>·</i> G = mg', spec: '弹簧测力计 · 重力方向竖直向下 · g = 10 N/kg',
    bigUnit: 'N · 测力计示数', bigMin: '0', bigMax: '5', intro: '拖动滑块改变钩码的质量，读一读弹簧测力计的示数。再把实验搬到月球和火星上试试！',
    fml: 'G = m g', fmlTag: '重力公式', fmlNote: 'g = 9.8 N/kg，考试常取 <b>10 N/kg</b>。力的单位是牛顿（N）。弹簧测力计原理：在弹性限度内，弹簧伸长量与拉力<b>成正比</b>。',
    legend: [['重力 G', C.red]],
    driver: {name: '钩码质量 m · Mass', min: 0, max: 500, step: 50, fmt: (v) => f0(v) + ' g', get: () => st.m, set: (v) => { st.m = v; }, scale: () => ['0 g', '250 g', '500 g']},
    extra: (el) => {
      el.innerHTML = segBtns('segP', PLANETS.map((p) => p[0]), '星球 Planet') + `<div class="grp"><div class="seg"><button class="tb red" type="button" id="bRec">记录 m 和 G</button><button class="tb" type="button" id="bClr">清空</button></div></div>`;
      bindSeg(el, 'segP', (v) => { st.pl = v; if (v === 1 && st.m > 0) st.moon = true; });
      el.querySelector('#bRec').onclick = () => { st.rec.push([st.m, G_(), st.pl]); cap(`记录：m = ${st.m} g = ${st.m / 1000} kg，G = ${f2(G_())} N（${PLANETS[st.pl][0]}）`); };
      el.querySelector('#bClr').onclick = () => { st.rec = []; };
      window.pressSeg('segP', st.pl);
    },
    views: [['全景', [160, 640, 1700], [0, 380, 0]], ['刻度', [80, 590, 330], [50, 570, 0]]], get home() { return this.views[0]; },
    missions: [
      {t: '在地球上挂 500 g 钩码，读出示数', k: '500 g → 5 N', check: () => st.pl === 0 && st.m === 500},
      {t: '把实验搬到月球上', k: '质量不变，重力约为地球的 1/6', check: () => st.moon || (st.pl === 1 && st.m > 0)},
      {t: '在同一星球记录 3 组 m 和 G', k: '重力与质量成正比', check: () => [0, 1, 2].some((p) => new Set(st.rec.filter((r) => r[2] === p).map((r) => r[0])).size >= 3)},
    ],
    update(dt, anim) {
      st.t += anim;
      const N = G_(), target = PX(N); st.y += (target - st.y) * Math.min(1, dt * 6); if (!st.y) st.y = target;
      ptr.position.set(50, st.y, 16);
      const top = 460, ext = (PX(0) - st.y) * .5, bot = top - 40 - ext;
      spr.position.set(50, bot, 0); spr.scale.set(1, top - bot, 1);
      hookRod.set(V(50, bot, 0), V(50, bot - 40, 0));
      const n = Math.round(st.m / 100), half = st.m % 100 ? 1 : 0;
      masses.forEach((m, i) => { m.visible = i < Math.ceil(st.m / 100); m.scale.y = (i === n && half) ? .5 : 1; m.position.set(50, bot - 60 - i * 36, 0); });
      gArrow.set(V(130, bot - 60, 0), V(0, -Math.max(N * 34, 0), 0));
      tags.sc.p.set(50, 740, 0); tags.sc.set('弹簧测力计', `${f2(N)} N`);
      tags.m.p.set(150, bot - 110, 0); tags.m.set(`G = ${f2(N)} N`, '竖直向下'); tags.m.on = st.m > 0;
    },
    panel() {
      const N = G_(), g = PLANETS[st.pl][1];
      return {big: f2(N), bigFrac: N / 5, bigSub: `${PLANETS[st.pl][0]} · m = ${st.m} g`,
        stName: '星球', stAng: `g = ${g} N/kg`, stBig: PLANETS[st.pl][0], stRed: st.pl !== 0,
        rows: PLANETS.map((p, i) => [`${p[0]} · g = ${p[1]} N/kg`, i === st.pl, f2(st.m / 1000 * p[1]) + ' N']),
        num: f2(st.m / 1000), unit: 'kg · 质量<small>质量不随位置改变</small>', frac: st.m / 500,
        calc: `G = mg = ${st.m / 1000} kg × ${g} N/kg<br>= <b>${f2(N)} N</b>`,
        chart: {t: '重力–质量 G–m', u: '过原点直线', x0: 0, x1: 500, y0: 0, y1: 5, xl: 'm / g', yl: 'G / N', paths: PLANETS.map((p, i) => ({pts: [[0, 0], [500, .5 * p[1]]].map(([x, y]) => [x, Math.min(5, y)]), c: i === st.pl ? C.red : C.faint})), dots: st.rec.map((r) => [r[0], r[1]]), pt: [st.m, N]}};
    },
    reset() { st.rec = []; st.pl = 0; window.pressSeg('segP', 0); return 200; },
    tour: [{d: 500, dTime: 4, view: 0, cap: '在地球上，500 g 钩码重 5 N：G = 0.5 kg × 10 N/kg。', dur: 6}, {view: 0, run: () => { st.pl = 1; window.pressSeg('segP', 1); }, cap: '搬到月球：质量还是 500 g，重力只有 0.8 N。', dur: 6}],
    quiz: {1: {d: 500, dTime: 3, view: 1, run: () => { st.pl = 0; window.pressSeg('segP', 0); }, cap: '验证：0.5 kg × 10 N/kg = 5 N，所以 5 kg 重 50 N。'}, 2: {view: 0, cap: '验证：红色箭头表示重力，方向竖直向下。'}, 3: {view: 0, cap: '验证：重力方向竖直向下（不是“垂直向下”）。'}},
  };
}

/* ----------------------------------------------------------------- 337 牛顿第一定律：斜面小车 */
const SURF = [['毛巾', .5, 0x8fb7d9], ['棉布', .25, 0xe9e2d0], ['木板', .1, 0xc8a27a], ['理想光滑', 0, 0xf3f6f8]];
function b337(ctx) {
  const root = G(), st = {h: 20, sf: 0, t: 0, run: null, rec: {}, ideal: false};
  root.add(bench(1700, 520));
  const K = 4, ANG = 30 * D2R, RL = 70 * K, X0 = -620; // ramp length 70 cm
  const ramp = box(RL, 8, 120, MAT.wood()); ramp.rotation.z = -ANG; ramp.position.set(X0 - RL / 2 * Math.cos(ANG), RL / 2 * Math.sin(ANG), 0); root.add(ramp);
  const rampSup = box(10, RL * Math.sin(ANG), 100, MAT.dark()); rampSup.position.set(X0 - RL * Math.cos(ANG), RL * Math.sin(ANG) / 2, 0); root.add(rampSup);
  const board = box(1300, 6, 120, MAT.col(SURF[0][2])); board.position.set(X0 + 650, 3, 0); root.add(board);
  for (let c = 0; c <= 300; c += 50) { const t = box(2, 7, 130, MAT.dark()); t.position.set(X0 + c * K, 4, 0); root.add(t); }
  const cart = G(); const cb = box(60, 26, 50, MAT.red()); cb.position.y = 22; cart.add(cb); wheelSet(cart, [-18, 18], 27, 9, 9); root.add(cart);
  const marks = G(); root.add(marks);
  const tags = {cart: makeTag('小车', ''), ...Object.fromEntries(SURF.map((s, i) => ['s' + i, makeTag('', '', i === 3)]))};
  const go = () => { st.run = {s: -st.h * 2, v: 0, phase: 0, done: false}; };
  const pos = (s) => s < 0 ? V(X0 + s * K * Math.cos(ANG), -s * K * Math.sin(ANG), 0) : V(X0 + s * K, 0, 0);
  return {
    root, tags, title: '牛顿第一定律 <i>·</i> 斜面小车', spec: '同一高度静止释放 · 阻力越小运动越远 · 不受力将做匀速直线运动',
    bigUnit: 'cm · 滑行距离', bigMin: '0', bigMax: '300', intro: '让小车从斜面同一高度滑下，换不同的水平表面，比一比它滑得多远。最后试试“理想光滑”的表面。',
    fml: 'F = 0 → 静止或匀速直线运动', fmlTag: '牛顿第一定律', fmlNote: '在实验基础上<b>推理</b>得出，不能直接用实验验证。一切物体都有保持原来运动状态的性质 —— <b>惯性</b>。',
    legend: SURF.slice(0, 3).map((s) => [s[0], '#' + s[2].toString(16).padStart(6, '0')]),
    driver: {name: '释放高度 h · Height', min: 5, max: 30, step: 1, fmt: (v) => f0(v) + ' cm', get: () => st.h, set: (v) => { st.h = v; }, scale: () => ['5 cm', '30 cm']},
    extra: (el) => {
      el.innerHTML = segBtns('segS', SURF.map((s) => s[0]), '水平表面 Surface') + `<div class="grp"><div class="seg"><button class="tb red" type="button" id="bGo">释放小车</button></div></div>`;
      bindSeg(el, 'segS', (v) => { st.sf = v; board.material.color.set(SURF[v][2]); });
      el.querySelector('#bGo').onclick = go; window.pressSeg('segS', st.sf);
    },
    views: [['全景', [-140, 1100, 2700], [-120, 40, 0]], ['斜面', [-700, 260, 520], [-700, 60, 0]]], get home() { return this.views[0]; },
    missions: [
      {t: '在毛巾和木板上各释放一次，比较距离', k: '阻力越小，滑行越远', check: () => st.rec[0] !== undefined && st.rec[2] !== undefined},
      {t: '三种表面都从同一高度释放', k: '控制变量：到达水平面的速度相同', check: () => [0, 1, 2].every((i) => st.rec[i]) && new Set([0, 1, 2].map((i) => st.rec[i].h)).size === 1},
      {t: '推理：在理想光滑表面上释放', k: '不受阻力将永远匀速直线运动', check: () => st.ideal},
    ],
    update(dt, anim) {
      st.t += anim;
      const r = st.run, g = 980 * .35; // slowed for visibility
      if (r && !r.done) {
        if (r.s < 0) { r.v += g * Math.sin(ANG) * anim; r.s = Math.min(0, r.s + r.v * anim); }
        else { const mu = SURF[st.sf][1]; r.v = Math.max(0, r.v - mu * g * anim); r.s += r.v * anim; if (r.v <= 0 || r.s > 300) { r.done = true; if (mu === 0) { st.ideal = true; cap('理想光滑：没有阻力，小车速度不减，将<b>永远做匀速直线运动</b>下去（推理）。'); r.s = 300; } else { st.rec[st.sf] = {s: r.s, h: st.h}; const m = box(4, 30, 130, MAT.col(SURF[st.sf][2])); m.position.set(X0 + r.s * K, 15, 0); marks.add(m); cap(`${SURF[st.sf][0]}：滑行 ${f0(r.s)} cm。阻力越小，速度减小得越慢，滑得越远。`); } } }
      }
      const s = r ? (r.done && SURF[st.sf][1] === 0 ? 300 : r.s) : -st.h * 2;
      const p = pos(s); cart.position.copy(p); cart.rotation.z = s < 0 ? -ANG : 0; cart.visible = !(r && r.done && SURF[st.sf][1] === 0 && false);
      tags.cart.p.copy(p).add(V(0, 70, 0)); tags.cart.set('小车', r && !r.done ? f0(r.v / 100 * 10) / 10 + ' m/s' : '');
      SURF.forEach((sf, i) => { const t = tags['s' + i], rr = st.rec[i]; t.on = !!rr || (i === 3 && st.ideal); if (rr) { t.p.set(X0 + rr.s * K, 40, -70 + i * 10); t.set(sf[0], f0(rr.s) + ' cm'); } if (i === 3) { t.p.set(X0 + 1300, 60, 0); t.set('→ ∞', '永远运动下去'); } });
    },
    panel() {
      const r = st.run, s = r && r.s > 0 ? r.s : 0;
      return {big: f0(Math.min(s, 300)), bigFrac: Math.min(s, 300) / 300, bigSub: `${SURF[st.sf][0]} · h = ${st.h} cm`,
        stName: '水平表面', stAng: `阻力 ${['大', '较大', '小', '无'][st.sf]}`, stBig: SURF[st.sf][0], stRed: st.sf === 3,
        rows: SURF.map((sf, i) => [sf[0], i === st.sf, st.rec[i] ? f0(st.rec[i].s) + ' cm' : i === 3 && st.ideal ? '∞' : '—']),
        num: f0(st.h), unit: 'cm · 释放高度<small>同一高度 → 到底速度相同</small>', frac: st.h / 30,
        calc: `阻力越小 → 速度减小越慢 → 滑得越远<br>阻力为 0 → <b>匀速直线运动</b>`, calcT: '推理',
        chart: {t: '滑行距离对比', u: 'cm', x0: 0, x1: 4, y0: 0, y1: 300, xl: '', yl: 's', bars: SURF.slice(0, 3).map((sf, i) => [.7 + i * 1.2, st.rec[i] ? st.rec[i].s : 0, '#' + sf[2].toString(16).padStart(6, '0'), sf[0]])}};
    },
    reset() { st.rec = {}; st.ideal = false; st.run = null; marks.clear(); st.sf = 0; board.material.color.set(SURF[0][2]); window.pressSeg('segS', 0); return 20; },
    tour: [{view: 0, run: () => { st.sf = 0; board.material.color.set(SURF[0][2]); window.pressSeg('segS', 0); go(); }, cap: '毛巾表面阻力大，小车很快停下。', dur: 5}, {view: 0, run: () => { st.sf = 2; board.material.color.set(SURF[2][2]); window.pressSeg('segS', 2); go(); }, cap: '木板表面阻力小，小车滑得更远。', dur: 6}, {view: 0, run: () => { st.sf = 3; board.material.color.set(SURF[3][2]); window.pressSeg('segS', 3); go(); }, cap: '推理：如果没有阻力，小车将以不变的速度永远运动下去。', dur: 7}],
    quiz: {0: {view: 0, run: () => { st.sf = 3; board.material.color.set(SURF[3][2]); window.pressSeg('segS', 3); go(); }, cap: '验证：不受力时，运动的物体保持匀速直线运动。'}, 3: {view: 0, run: () => { st.sf = 3; board.material.color.set(SURF[3][2]); window.pressSeg('segS', 3); go(); }, cap: '验证：外力全部消失，物体做匀速直线运动。'}},
  };
}

/* ----------------------------------------------------------------- 338 摩擦力 */
const FS = [['木板', .2, 0xc8a27a], ['棉布', .35, 0xe9e2d0], ['毛巾', .5, 0x8fb7d9]];
function b338(ctx) {
  const root = G(), st = {N: 4, sf: 0, roll: 0, t: 0, rec: [], x: -200};
  root.add(bench(1300, 520));
  const board = box(900, 10, 200, MAT.col(FS[0][2])); board.position.set(0, 5, 0); root.add(board);
  const blk = G(); root.add(blk); const bb = box(140, 70, 90, MAT.wood()); bb.position.y = 35; blk.add(bb);
  const wts = Array.from({length: 4}, (_, i) => { const w = cyl(28, 28, 30, MAT.brass(), 28); w.position.set(-30 + (i % 2) * 60, 85 + Math.floor(i / 2) * 32, 0); blk.add(w); return w; });
  const pencils = Array.from({length: 6}, () => { const p = cyl(7, 7, 110, MAT.col(0xf0c64a), 12); p.rotation.x = Math.PI / 2; root.add(p); return p; });
  const scale = G(); root.add(scale); const sb = box(160, 24, 30, MAT.white()); scale.add(sb);
  const sT = canvasTex(512, 64, () => {}); const sf = new THREE.Mesh(new THREE.PlaneGeometry(150, 18), new THREE.MeshBasicMaterial({map: sT, toneMapped: false})); sf.position.set(0, 0, 15.5); scale.add(sf);
  const sptr = box(3, 22, 4, MAT.glow(C.red)); sptr.position.z = 17; scale.add(sptr);
  const string = rod(MAT.dark(), 1.2); root.add(string);
  const fArr = arrow(C.red, 3.5), pArr = arrow(C.blue, 3.5); root.add(fArr, pArr);
  sT.redraw((g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = C.ink; for (let i = 0; i <= 50; i++) { const x = 16 + i * 9.4; g.fillRect(x, i % 10 ? 40 : 26, 2, i % 10 ? 24 : 38); if (i % 10 === 0) { g.font = FONT(800, 22); g.fillText(String(i / 10), x + 4, 24); } } });
  const tags = {blk: makeTag('木块', ''), sc: makeTag('弹簧测力计', '', true), f: makeTag('', '')};
  const mu = () => st.roll ? .02 : FS[st.sf][1], f = () => mu() * st.N;
  return {
    root, tags, title: '摩擦力 <i>·</i> 影响因素', spec: '匀速拉动时 f = F拉 · 压力越大、接触面越粗糙，滑动摩擦力越大',
    bigUnit: 'N · 滑动摩擦力', bigMin: '0', bigMax: '5', intro: '用弹簧测力计水平匀速拉木块：示数就等于摩擦力。加砝码改变压力，换表面改变粗糙程度，再试试垫上圆铅笔。',
    fml: 'f = F拉（匀速）', fmlTag: '二力平衡', fmlNote: '滑动摩擦力与<b>压力大小</b>和<b>接触面粗糙程度</b>有关，与接触面积、速度无关。变滑动为滚动可大大减小摩擦。',
    legend: [['摩擦力 f', C.red], ['拉力 F', C.blue]],
    driver: {name: '压力 F压 · Pressure', min: 2, max: 10, step: 2, fmt: (v) => f0(v) + ' N', get: () => st.N, set: (v) => { st.N = v; }, scale: () => ['2 N', '6 N', '10 N']},
    extra: (el) => {
      el.innerHTML = segBtns('segF', FS.map((s) => s[0]), '接触面 Surface') + segBtns('segRo', ['滑动', '滚动（垫铅笔）'], '方式 Mode') + `<div class="grp"><div class="seg"><button class="tb red" type="button" id="bRec">记录示数</button></div></div>`;
      bindSeg(el, 'segF', (v) => { st.sf = v; board.material.color.set(FS[v][2]); }); bindSeg(el, 'segRo', (v) => { st.roll = v; });
      el.querySelector('#bRec').onclick = () => { st.rec.push({N: st.N, sf: st.sf, roll: st.roll, f: f()}); cap(`记录：${st.roll ? '滚动' : FS[st.sf][0]}，压力 ${st.N} N，摩擦力 ${f2(f())} N。`); };
      window.pressSeg('segF', st.sf); window.pressSeg('segRo', st.roll);
    },
    views: [['全景', [0, 640, 1500], [0, 60, 0]], ['测力计', [300, 220, 460], [240, 60, 0]]], get home() { return this.views[0]; },
    missions: [
      {t: '同一表面记录两种压力下的示数', k: '压力越大，滑动摩擦力越大', check: () => FS.some((_, i) => new Set(st.rec.filter((r) => !r.roll && r.sf === i).map((r) => r.N)).size >= 2)},
      {t: '同一压力记录两种表面下的示数', k: '接触面越粗糙，摩擦力越大', check: () => [2, 4, 6, 8, 10].some((n) => new Set(st.rec.filter((r) => !r.roll && r.N === n).map((r) => r.sf)).size >= 2)},
      {t: '垫上圆铅笔，看摩擦力变成多少', k: '变滑动为滚动可减小摩擦', check: () => st.roll === 1},
    ],
    update(dt, anim) {
      st.t += anim; st.x += 40 * anim; if (st.x > 120) st.x = -200;
      const by = st.roll ? 14 : 10; blk.position.set(st.x, by, 0);
      const n = Math.round((st.N - 2) / 2); wts.forEach((w, i) => w.visible = i < n);
      pencils.forEach((p, i) => { p.visible = !!st.roll; p.position.set(-280 + i * 70 + ((st.x * 0.5) % 70 + 70) % 70 - 35, 17, 0); p.rotation.y = 0; });
      const F = f(), sx = st.x + 70 + 120 + 80; scale.position.set(sx, 45, 0);
      sptr.position.x = -75 + 16 / 512 * 150 + F * 10 * 9.4 / 512 * 150;
      string.set(V(st.x + 70, 45, 0), V(sx - 80, 45, 0));
      fArr.set(V(st.x - 70, 18, 60), V(-F * 40, 0, 0)); pArr.set(V(sx + 80, 45, 0), V(F * 40, 0, 0));
      tags.blk.p.set(st.x, 170, 0); tags.blk.set('木块', `压力 ${st.N} N`);
      tags.sc.p.set(sx, 90, 0); tags.sc.set('弹簧测力计', `${f2(F)} N`);
      tags.f.p.set(st.x - 70 - F * 20, 30, 60); tags.f.set('f = ' + f2(F) + ' N', '与运动方向相反'); tags.f.below = true;
    },
    panel() {
      const F = f();
      return {big: f2(F), bigFrac: F / 5, bigSub: `${st.roll ? '滚动' : FS[st.sf][0]} · 压力 ${st.N} N`,
        stName: '木块状态', stAng: '匀速直线', stBig: 'f = F拉', stRed: true,
        rows: FS.map((s, i) => [`${s[0]}`, !st.roll && i === st.sf, f2(s[1] * st.N) + ' N']).concat([['滚动（铅笔）', !!st.roll, f2(.02 * st.N) + ' N']]),
        num: f2(mu()), unit: 'μ · 粗糙程度<small>（拓展：f = μ F压）</small>', frac: mu() / .5,
        calc: `匀速 → 二力平衡<br>f = F拉 = <b>${f2(F)} N</b>`,
        chart: {t: '摩擦力–压力 f–F压', u: '越粗糙越陡', x0: 0, x1: 10, y0: 0, y1: 5, xl: 'F压 / N', yl: 'f / N', paths: FS.map((s, i) => ({pts: [[0, 0], [10, s[1] * 10]], c: !st.roll && i === st.sf ? C.red : C.faint})), dots: st.rec.map((r) => [r.N, r.f]), pt: [st.N, F]}};
    },
    reset() { st.rec = []; st.roll = 0; st.sf = 0; board.material.color.set(FS[0][2]); window.pressSeg('segF', 0); window.pressSeg('segRo', 0); return 4; },
    tour: [{d: 10, dTime: 3, view: 0, cap: '压力从 4 N 增加到 10 N，滑动摩擦力随之增大。', dur: 6}, {view: 0, run: () => { st.sf = 2; board.material.color.set(FS[2][2]); window.pressSeg('segF', 2); }, cap: '换成毛巾：接触面更粗糙，摩擦力更大。', dur: 6}, {view: 1, run: () => { st.roll = 1; window.pressSeg('segRo', 1); }, cap: '垫上圆铅笔，变滑动为滚动，摩擦力大大减小。', dur: 6}],
    quiz: {0: {d: 10, dTime: 3, view: 0, cap: '验证：压力越大，滑动摩擦力越大。'}, 1: {view: 0, run: () => { st.sf = 2; board.material.color.set(FS[2][2]); window.pressSeg('segF', 2); }, cap: '验证：鞋底刻花纹使接触面更粗糙，增大摩擦。'}, 2: {view: 1, cap: '验证：匀速拉动时拉力与摩擦力是一对平衡力，示数就是摩擦力。'}, 3: {view: 0, run: () => { st.sf = 2; board.material.color.set(FS[2][2]); window.pressSeg('segF', 2); }, cap: '验证：接触面越粗糙摩擦越大 —— 鞋底花纹增大有益摩擦。'}},
  };
}

export const C7 = {334: {n: 3, build: b334}, 335: {n: 3, build: b335}, 336: {n: 3, build: b336}, 337: {n: 3, build: b337}, 338: {n: 3, build: b338}};
