/* 七上·第1章 科学入门 : 301–305 */
import * as THREE from 'three';
import {makeSorter} from './sorter.js';
import {C, MAT, G, V, D2R, TAU, clamp, lerp, f0, f1, f2, mesh, box, cyl, sph, rod, arrow, canvasTex, FONT, textPlate, makeTag, liquid, bench, curve, rand} from '../kit.js';

/* ----------------------------------------------------------------- 301 科学并不神秘：自然现象分类 */
const PHEN = [
  ['苹果落地', 0, '受重力下落'], ['雨后彩虹', 0, '光的色散'], ['冰化成水', 0, '物态变化，没有新物质'], ['铁钉生锈', 1, '生成了新物质铁锈'], ['木柴燃烧', 1, '生成二氧化碳和水'], ['饭菜变馊', 1, '微生物分解产生新物质'],
  ['种子发芽', 2, '生物的生长'], ['蝌蚪变青蛙', 2, '生物的发育'], ['向日葵向光', 2, '生物对刺激作出反应'], ['火山喷发', 3, '地球内部能量释放'], ['月相变化', 3, '月球、地球、太阳位置变化'], ['日食', 3, '月球挡住太阳光'],
];
const BINS = ['物理现象', '化学现象', '生命现象', '地球和宇宙现象'];
function b301(ctx) {
  return makeSorter(ctx, {
    items: PHEN, bins: BINS, short: ['物理', '化学', '生命', '地球宇宙'], ask: '这是什么现象？', cardTag: '现象卡片',
    title: '自然现象 <i>·</i> 分类', spec: '科学研究各种自然现象，并寻找它们产生、变化的原因和规律',
    intro: '把每张现象卡片放进正确的分类箱：物理、化学、生命、地球和宇宙。',
    fml: '自然现象 =<br>物理 + 化学 + 生命 + 地球宇宙', fmlTag: '四类', fmlNote: '判断化学现象的关键：<b>有没有新物质生成</b>。',
    onRight: (st) => { if (st.kinds.every((n) => n > 0)) ctx.done(0); if (st.best >= 5) ctx.done(1); },
    missions: (st, items) => [{t: '四类现象各分对至少 1 张', k: '自然现象的分类'}, {t: '连续分对 5 张', k: '物理变化与化学变化的区别'}, {t: '12 张全部完成', k: '科学研究的对象', check: () => st.i >= items.length}],
  });
}

/* ----------------------------------------------------------------- 302 实验室仪器与安全：酒精灯火焰 */
function b302(ctx) {
  const root = G(), st = {h: 60, vol: .25, lit: true, heat: 0, outer: 0, cap: 0, blown: false, t: 0, msg: ''};
  root.add(bench(1300, 700));
  // alcohol lamp
  const lamp = G(); root.add(lamp);
  const body = new THREE.Mesh(new THREE.SphereGeometry(70, 32, 20, 0, TAU, Math.PI * .25, Math.PI * .75), MAT.glass(.22)); body.scale.y = .8; body.position.y = 56; lamp.add(body);
  const alc = new THREE.Mesh(new THREE.SphereGeometry(66, 32, 20, 0, TAU, Math.PI * .55, Math.PI * .45), MAT.water(.35)); alc.scale.y = .8; alc.position.y = 56; lamp.add(alc);
  const neck = cyl(16, 20, 26, MAT.alu()); neck.position.y = 112; lamp.add(neck);
  const wick = cyl(5, 5, 14, MAT.white()); wick.position.y = 130; lamp.add(wick);
  const capM = box(1, 1, 1, MAT.dark()); // placeholder replaced below
  const cap = mesh(new THREE.CylinderGeometry(24, 30, 60, 32, 1, true), MAT.dark()); cap.material.side = THREE.DoubleSide; cap.position.set(160, 30, 60); root.add(cap); void capM;
  const capTop = cyl(24, 24, 3, MAT.dark()); capTop.position.y = 30; cap.add(capTop);
  // flame layers: outer / inner / core (FY = flame base)
  const FY = 137;
  const flame = G(); flame.position.y = FY; lamp.add(flame);
  const fl = (r, h, c, op) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), MAT.fade(c, op)); m.scale.set(r, h, r); m.position.y = h * .8; flame.add(m); return m; };
  const fOuter = fl(22, 70, 0xff9a3a, .35), fInner = fl(14, 46, 0xffc06a, .55), fCore = fl(7, 20, 0x6aa8ff, .7);
  fOuter.renderOrder = 7; fInner.renderOrder = 8; fCore.renderOrder = 9;
  const glow = new THREE.PointLight(0xffa040, 30000, 0, 2); glow.position.y = FY + 50; lamp.add(glow);
  // test tube in a clamp, height driven by the slider
  const tube = G(); root.add(tube);
  const glass = mesh(new THREE.CylinderGeometry(14, 14, 200, 24, 1, true), MAT.glass(.3), false); glass.position.y = 100; tube.add(glass);
  const bottom = new THREE.Mesh(new THREE.SphereGeometry(14, 24, 12, 0, TAU, Math.PI / 2, Math.PI / 2), MAT.glass(.3)); tube.add(bottom);
  const liq = liquid(12.5, MAT.water(.6)); tube.add(liq);
  const clampArm = box(180, 8, 14, MAT.wood()); clampArm.position.set(110, 150, 0); tube.add(clampArm);
  const handle = box(80, 14, 18, MAT.wood()); handle.position.set(220, 150, 0); tube.add(handle);
  tube.rotation.z = -45 * D2R;
  const therm = makeTag('', '', true);
  // other instruments to identify
  const INS = [['烧杯', '盛放、加热较多液体（需垫石棉网）'], ['量筒', '量取液体体积，不能加热，不能作反应容器'], ['胶头滴管', '吸取、滴加少量液体，竖直悬空滴加'], ['试管', '少量试剂反应，可直接加热，液体不超过 1/3'], ['酒精灯', '用外焰加热，用灯帽盖灭，不能用嘴吹']];
  const pickables = [];
  const beaker = mesh(new THREE.CylinderGeometry(60, 56, 140, 32, 1, true), MAT.glass(.25), false); beaker.position.set(-420, 70, -80); beaker.userData.pick = 0; root.add(beaker);
  const bw = liquid(55); bw.set(4, 70); beaker.add(bw); bw.position.y -= 70;
  const cylinder = mesh(new THREE.CylinderGeometry(22, 22, 260, 24, 1, true), MAT.glass(.25), false); cylinder.position.set(-260, 140, -160); cylinder.userData.pick = 1; root.add(cylinder);
  const cbase = cyl(46, 50, 10, MAT.glass(.3)); cbase.position.set(-260, 5, -160); root.add(cbase);
  const dropper = G(); dropper.position.set(-560, 0, 60); dropper.userData.pick = 2; root.add(dropper);
  const dg = cyl(6, 2, 120, MAT.glass(.35)); dg.position.y = 80; dropper.add(dg); const bulb = sph(14, MAT.red()); bulb.scale.y = 1.6; bulb.position.y = 160; dropper.add(bulb); dropper.rotation.z = Math.PI / 2; dropper.position.y = 16;
  glass.userData.pick = 3; lamp.userData.pick = 4;
  pickables.push(beaker, cylinder, dropper, glass, lamp);
  const tags = {lamp: makeTag('酒精灯', 'Alcohol lamp'), tube: makeTag('试管', 'Test tube'), beaker: makeTag('烧杯', ''), cyl: makeTag('量筒', ''), drop: makeTag('胶头滴管', ''), therm};
  // temperature at height y above wick (from the zones)
  const zone = (y) => !st.lit ? 'none' : y < 18 ? 'core' : y < 50 ? 'inner' : y < 92 ? 'outer' : 'above';
  const TEMP = {core: 400, inner: 520, outer: 700, above: 260, none: 20};
  const NAME = {core: '焰心', inner: '内焰', outer: '外焰', above: '火焰上方', none: '灯已熄灭'};
  return {
    root, tags, pickables, title: '酒精灯 <i>·</i> 实验安全', spec: '外焰温度最高 · 试管液体 ≤ 1/3 · 灯帽盖灭',
    bigUnit: '°C · 试管底部温度（示意）', bigMin: '20', bigMax: '700', intro: '拖动滑块上下移动试管，找出酒精灯火焰中温度最高的部分。',
    fml: '外焰 > 内焰 > 焰心', fmlTag: '火焰温度', fmlNote: '把火柴梗平放进火焰 1–2 秒，<b>两端先变黑</b>，说明外焰温度最高。',
    legend: [['外焰', '#ff9a3a'], ['内焰', '#ffc06a'], ['焰心', '#6aa8ff']],
    driver: {name: '试管底部离灯芯的高度', min: 0, max: 140, step: 1, fmt: (v) => f0(v) + ' mm', get: () => st.h, set: (v) => { st.h = v; }, scale: () => ['灯芯', '焰心', '内焰', '外焰', '上方'], track: () => [[0, 18, '#6aa8ff'], [18, 50, '#ffc06a'], [50, 92, '#ff9a3a']]},
    extra: (el) => {
      el.innerHTML = `<div class="grp" style="margin-top:9px"><div class="ph" style="margin:0"><span class="cp mu">试管中液体 Liquid</span><span class="cp" id="vVol"></span></div><input id="sVol" type="range" min="0.05" max="0.8" step="0.01" value="${st.vol}" aria-label="液体体积"></div>
      <div class="grp"><span class="cp mu">熄灭 Put out</span><div class="seg" id="segOut"><button class="tb" data-v="cap" type="button">灯帽盖灭</button><button class="tb" data-v="blow" type="button">用嘴吹灭</button><button class="tb" data-v="lit" type="button">重新点燃</button></div></div>`;
      const sv = el.querySelector('#sVol'), vv = el.querySelector('#vVol'); const upd = () => { vv.textContent = Math.round(st.vol * 100) + '%'; }; upd();
      sv.oninput = () => { st.vol = +sv.value; upd(); };
      el.querySelectorAll('#segOut .tb').forEach((b) => b.onclick = () => {
        const v = b.dataset.v, cap = document.getElementById('caption');
        if (v === 'cap') { st.lit = false; st.cap = 1; cap.textContent = '✓ 用灯帽盖灭：隔绝空气，火焰熄灭。'; ctx.done(2); }
        if (v === 'blow') { st.blown = true; cap.textContent = '✗ 危险！用嘴吹可能把火焰压入灯内，引起爆炸。一定要用灯帽盖灭。'; }
        if (v === 'lit') { st.lit = true; st.cap = 0; cap.textContent = '用火柴点燃。禁止用一只酒精灯去引燃另一只。'; }
      });
    },
    pick: (k) => k === null || k === undefined ? null : `<b>${INS[k][0]}</b>：${INS[k][1]}`,
    views: [['全景', [180, 560, 1100], [-120, 120, -20]], ['火焰', [120, 220, 420], [0, 170, 0]], ['仪器', [-380, 380, 700], [-380, 80, -60]]], get home() { return this.views[0]; },
    missions: [
      {t: '把试管底部放到外焰加热 3 秒', k: '外焰温度最高，用外焰加热', check: () => st.outer > 3},
      {t: '加热时试管中液体不超过 1/3', k: '给试管里的液体加热', check: () => st.heat > 2 && st.vol <= .34},
      {t: '用灯帽把酒精灯盖灭', k: '酒精灯的使用安全'},
    ],
    update(dt, anim) {
      st.t += anim;
      const z = zone(st.h);
      tube.position.set(0, FY + st.h + 2, 0);
      liq.set(0, 200 * st.vol); liq.material.color.set(st.vol > .34 ? 0xf0b9be : 0x8fc4ee);
      const flick = 1 + Math.sin(st.t * 21) * .04 + Math.sin(st.t * 33) * .03;
      flame.visible = st.lit; flame.scale.set(1, flick, 1); glow.intensity = st.lit ? 30000 : 0;
      cap.position.lerp(st.cap ? V(0, 148, 0) : V(160, 30, 60), Math.min(1, dt * 6));
      if (z === 'outer' && st.lit) st.outer += dt; else st.outer = Math.max(0, st.outer - dt * .5);
      if (st.lit && z !== 'none' && z !== 'above') st.heat += dt; else st.heat = Math.max(0, st.heat - dt);
      therm.set(NAME[z], f0(TEMP[z]) + ' °C'); therm.p.set(-30, FY + st.h + 10, 0);
      tags.lamp.p.set(0, 40, 80); tags.lamp.below = true; tags.tube.p.set(80, FY + st.h + 150, 0);
      tags.beaker.p.set(-420, 150, -80); tags.cyl.p.set(-260, 285, -160); tags.drop.p.set(-560, 50, 60);
    },
    panel() {
      const z = zone(st.h), T = TEMP[z];
      return {big: f0(T), bigFrac: (T - 20) / 680, bigSub: NAME[z] + (z === 'outer' ? ' · 温度最高' : ''),
        stName: '火焰分层 Flame', stAng: st.lit ? '燃烧中' : '已熄灭', stBig: st.lit ? NAME[z] : '已熄灭', stRed: z === 'outer',
        rows: [['外焰 · 约 700 °C', z === 'outer', '最高'], ['内焰 · 约 520 °C', z === 'inner', ''], ['焰心 · 约 400 °C', z === 'core', '最低']],
        num: Math.round(st.vol * 100) + '%', unit: '液体占试管<small>不超过 1/3</small>', frac: st.vol,
        calc: `试管口不对着人 · 试管夹夹在离管口 1/3 处<br>先预热，再集中在外焰加热<br>液体体积 ${Math.round(st.vol * 100)}% ${st.vol <= .34 ? '<b>✓ 合格</b>' : '<b>✗ 超过 1/3</b>'}`, calcT: '操作要点 Checklist',
        chart: {t: '火焰温度分布', u: '示意', x0: 0, x1: 140, y0: 0, y1: 800, xl: '高度 / mm', yl: '°C', path: curve((y) => TEMP[zone(y)], 0, 140, 140).map((p) => [p[0], p[1]]), pt: [st.h, T]}};
    },
    reset() { st.lit = true; st.cap = 0; return 60; },
    tour: [
      {d: 10, view: 1, cap: '焰心：靠近灯芯，酒精还没充分燃烧，温度最低。', dur: 4.5},
      {d: 35, cap: '内焰：温度比焰心高。', dur: 4},
      {d: 70, cap: '外焰：和空气接触最充分，燃烧最完全，温度最高。所以加热要用外焰。', dur: 6},
      {d: 70, view: 2, cap: '点击桌上的仪器，看看它们的用途和注意事项。', dur: 5},
    ],
    quiz: {},
  };
}

/* ----------------------------------------------------------------- 303 科学探究：单摆（控制变量） */
function b303(ctx) {
  const root = G(), st = {L: 60, m: 100, amp: 10, th: 10 * D2R, w: 0, t: 0, run: 0, swings: 0, rec: [], concl: -1, prev: 0};
  root.add(bench(900, 600));
  const frame = G(); root.add(frame);
  const post = box(16, 760, 16, MAT.alu()); post.position.set(-160, 380, -80); frame.add(post);
  const arm = box(260, 14, 14, MAT.alu()); arm.position.set(-40, 752, -80); frame.add(arm);
  const baseP = box(140, 14, 120, MAT.dark()); baseP.position.set(-160, 7, -80); frame.add(baseP);
  const pivot = G(); pivot.position.set(60, 745, -80); root.add(pivot);
  const str = rod(MAT.dark(), .9); root.add(str);
  const bob = sph(20, MAT.red()); root.add(bob);
  const arc = new THREE.Mesh(new THREE.RingGeometry(0, 1, 48, 1, -Math.PI / 2 - .3, .6), MAT.fade(C.red, .08)); arc.position.copy(pivot.position); root.add(arc);
  const scaleK = 6.5; // units per cm
  const tags = {bob: makeTag('摆球', ''), piv: makeTag('悬点', 'Pivot')};
  const T = () => TAU * Math.sqrt(st.L / 100 / 9.8);
  const STEPS = ['提出问题', '建立假设', '设计实验', '收集证据', '得出结论', '交流评价'];
  return {
    root, tags, title: '单摆 <i>·</i> 控制变量', spec: '摆的快慢和什么有关？一次只改变一个因素',
    bigUnit: 'S · 周期 T（摆动一次的时间）', bigMin: '0', bigMax: '2.5', intro: '提出问题：摆的快慢与摆长、摆球质量、摆角中的哪个因素有关？',
    fml: 'T = 2π √(L / g)<br><span class="s">只与摆长 L 有关（课外拓展）</span>', fmlTag: '单摆周期', fmlNote: '<b>控制变量法</b>：研究一个因素时，其余因素保持不变。',
    legend: [['摆球', C.red]],
    driver: {name: '摆长 L · Length', min: 20, max: 100, step: 1, fmt: (v) => f0(v) + ' cm', get: () => st.L, set: (v) => { st.L = v; }, scale: () => ['20 cm', '60 cm', '100 cm']},
    extra: (el) => {
      el.innerHTML = `<div class="grp" style="margin-top:9px"><span class="cp mu">摆球质量 Mass</span><div class="seg" id="segM"><button class="tb" data-v="50" type="button">50 g</button><button class="tb" data-v="100" type="button">100 g</button><button class="tb" data-v="200" type="button">200 g</button></div></div>
      <div class="grp"><span class="cp mu">摆角 Angle</span><div class="seg" id="segA"><button class="tb" data-v="5" type="button">5°</button><button class="tb" data-v="10" type="button">10°</button><button class="tb" data-v="15" type="button">15°</button></div></div>
      <div class="grp"><div class="seg"><button class="tb red" id="bRec" type="button">记录一组数据</button><button class="tb" id="bClr" type="button">清空</button></div></div>
      <div class="grp"><span class="cp mu">得出结论 Conclusion</span><div class="seg" id="segC"><button class="tb" data-v="0" type="button">与质量有关</button><button class="tb" data-v="1" type="button">只与摆长有关</button><button class="tb" data-v="2" type="button">与摆角有关</button></div></div>`;
      const sync = () => { window.pressSeg('segM', st.m); window.pressSeg('segA', st.amp); window.pressSeg('segC', st.concl); };
      el.querySelectorAll('#segM .tb').forEach((b) => b.onclick = () => { st.m = +b.dataset.v; bob.scale.setScalar(Math.cbrt(st.m / 100)); sync(); });
      el.querySelectorAll('#segA .tb').forEach((b) => b.onclick = () => { st.amp = +b.dataset.v; st.th = st.amp * D2R; st.w = 0; sync(); });
      el.querySelector('#bRec').onclick = () => {
        st.rec.push({L: st.L, m: st.m, a: st.amp, T: T()}); if (st.rec.length > 12) st.rec.shift();
        const cap = document.getElementById('caption'); cap.textContent = `记录：L = ${st.L} cm，m = ${st.m} g，摆角 ${st.amp}°，测得 T = ${f2(T())} s`;
        const sameL = (a, b) => Math.abs(a.L - b.L) < .5;
        if (st.rec.some((a) => st.rec.some((b) => sameL(a, b) && a.a === b.a && a.m !== b.m))) ctx.done(0);
        if (new Set(st.rec.map((r) => r.L)).size >= 3) ctx.done(1);
      };
      el.querySelector('#bClr').onclick = () => { st.rec = []; };
      el.querySelectorAll('#segC .tb').forEach((b) => b.onclick = () => {
        st.concl = +b.dataset.v; sync(); const cap = document.getElementById('caption');
        if (st.concl === 1 && st.rec.length >= 3) { cap.textContent = '✓ 结论正确：摆的周期只与摆长有关，摆长越长，摆得越慢。'; ctx.done(2); }
        else if (st.concl === 1) cap.textContent = '先多记录几组数据（至少 3 组），用证据支持你的结论。';
        else cap.textContent = '✗ 看看数据：只改变这个因素时，周期变了吗？';
      });
      sync();
    },
    views: [['全景', [520, 520, 1100], [0, 420, -80]], ['摆球', [260, 260, 520], [60, 300, -80]]], get home() { return this.views[0]; },
    missions: [
      {t: '摆长不变，只换摆球质量，各记录一次', k: '控制变量法'},
      {t: '记录至少 3 种不同摆长的数据', k: '收集事实与证据'},
      {t: '根据数据选出正确结论', k: '科学探究的基本过程'},
    ],
    update(dt, anim) {
      st.t += anim;
      const g = 9.8 * 100 * scaleK, Lw = st.L * scaleK; // world units
      const sub = 4, h = anim / sub;
      for (let i = 0; i < sub; i++) { st.w += -g / Lw * Math.sin(st.th) * h; st.th += st.w * h; }
      if (st.prev < 0 && st.th >= 0) st.swings++; st.prev = st.th;
      const p = pivot.position, b = V(p.x + Math.sin(st.th) * Lw, p.y - Math.cos(st.th) * Lw, p.z);
      str.set(p, b); bob.position.copy(b);
      arc.scale.setScalar(Lw); arc.position.copy(p);
      tags.bob.p.copy(b).add(V(0, -26, 0)); tags.bob.below = true; tags.bob.set('摆球', st.m + ' g'); tags.piv.p.copy(p).add(V(0, 14, 0));
    },
    panel() {
      const step = st.concl === 1 ? 4 : st.rec.length >= 3 ? 3 : st.rec.length ? 2 : 0;
      const pts = st.rec.map((r) => r);
      return {big: f2(T()), bigFrac: T() / 2.5, bigSub: `已摆动 ${st.swings} 次 · 数 10 次计时更准确`,
        stName: '探究步骤 Inquiry', stAng: `${st.rec.length} 组数据`, stBig: STEPS[step], stRed: step >= 4,
        rows: STEPS.map((s, i) => [s, i <= step, i === step ? '当前' : '']), num: f2(T() * 10), unit: 's · 摆动 10 次<small>Time for 10 swings</small>', frac: T() * 10 / 25,
        calc: `T = 2π √(L/g)<br>= 2 × 3.14 × √(${f2(st.L / 100)} / 9.8)<br>= <b>${f2(T())} s</b>`,
        chart: {t: '周期–摆长 T–L', u: '红点 = 你的数据', x0: 0, x1: 100, y0: 0, y1: 2.2, xl: 'L / cm', yl: 'T / s', paths: [{pts: curve((x) => TAU * Math.sqrt(x / 100 / 9.8), 1, 100), c: C.faint, dash: '3 3'}],
          dots: pts.map((r) => [r.L, r.T]), pt: [st.L, T()]}};
    },
    reset() { st.rec = []; st.concl = -1; st.th = st.amp * D2R; st.w = 0; return 60; },
    tour: [
      {d: 60, cap: '提出问题：摆的快慢与什么因素有关？先把摆长定为 60 cm。', dur: 5},
      {d: 30, cap: '减小摆长到 30 cm：摆得明显变快了，周期变小。', dur: 5},
      {d: 95, cap: '增大摆长到 95 cm：摆得变慢。换不同质量的摆球试试，周期几乎不变。', dur: 6},
    ],
    quiz: {},
  };
}

/* ----------------------------------------------------------------- 304 长度和体积：量筒读数与排水法 */
function b304(ctx) {
  const root = G(), st = {eye: 0, stone: 0, sTarget: 0, t: 0, readLvl: 0, readStone: 0};
  root.add(bench(1000, 600));
  const R = 34, H = 420, Y0 = 14, V1 = 50, VS = 20, mmPerMl = H / 110; // 0–100 mL scale over 0..(100*mmPerMl)
  const gc = mesh(new THREE.CylinderGeometry(R, R, H, 40, 1, true), MAT.glass(.2), false); gc.position.y = Y0 + H / 2; root.add(gc);
  const base = cyl(70, 76, 14, MAT.glass(.35)); base.position.y = 7; root.add(base);
  const scaleTex = canvasTex(256, 1024, (g, w, h) => {
    g.fillStyle = C.ink; g.font = FONT(600, 30); g.textBaseline = 'middle';
    for (let ml = 0; ml <= 100; ml += 2) { const y = h - (ml * mmPerMl) / H * h; const big = ml % 10 === 0; g.fillRect(0, y - 1.5, big ? 70 : 38, 3); if (big && ml) g.fillText(String(ml), 84, y); }
    g.font = FONT(700, 26); g.fillText('mL', 84, 40);
  });
  const sc = new THREE.Mesh(new THREE.CylinderGeometry(R + .6, R + .6, H, 40, 1, true, Math.PI / 2 - .7, 1.4), new THREE.MeshBasicMaterial({map: scaleTex, transparent: true, toneMapped: false, depthWrite: false}));
  sc.position.y = Y0 + H / 2; sc.renderOrder = 5; root.add(sc);
  const water = liquid(R - 1.5); root.add(water);
  const menis = new THREE.Mesh(new THREE.TorusGeometry(R - 3, 2.6, 8, 40), MAT.water(.7)); menis.rotation.x = Math.PI / 2; root.add(menis);
  const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(22, 0), MAT.col(0x7d756c, {roughness: .9})); stone.scale.set(1, .8, .9); root.add(stone);
  const thread = rod(MAT.dark(), .6); root.add(thread);
  // eye + sight line
  const eye = G(); root.add(eye);
  const eyeW = sph(16, MAT.white()); eye.add(eyeW); const pupil = sph(7, MAT.dark()); pupil.position.x = -12; eye.add(pupil);
  const sight = rod(MAT.glow(C.red), 1.2); root.add(sight);
  const level = (ml) => Y0 + ml * mmPerMl;
  const tags = {eye: makeTag('眼睛', 'Eye'), read: makeTag('', '', true), cyl: makeTag('量筒', '100 mL')};
  let reading = 0;
  return {
    root, tags, title: '量筒读数 <i>·</i> 排水法', spec: '视线与凹液面最低处相平 · V石 = V2 − V1',
    bigUnit: 'mL · 你的读数', bigMin: '0', bigMax: '100', intro: '移动眼睛的高度，看看俯视、仰视和平视读出的数各是多少。',
    fml: 'V石 = V2 − V1', fmlTag: '排水法测体积', fmlNote: '俯视读数<b>偏大</b>，仰视读数<b>偏小</b>。1 mL = 1 cm³。',
    legend: [['视线', C.red], ['水', '#8fc4ee']],
    driver: {name: '眼睛高度 · Eye level', min: -1, max: 1, step: .01, fmt: (v) => Math.abs(v) < .05 ? '平视' : v > 0 ? '俯视 ↓' : '仰视 ↑', get: () => st.eye, set: (v) => { st.eye = v; }, scale: () => ['仰视', '平视', '俯视'], track: () => [[-.05, .05, C.red]]},
    extra: (el) => {
      el.innerHTML = `<div class="grp" style="margin-top:9px"><span class="cp mu">石块 Stone</span><div class="seg" id="segS"><button class="tb" data-v="1" type="button">用细线放入石块</button><button class="tb" data-v="0" type="button">取出</button></div></div>`;
      el.querySelectorAll('#segS .tb').forEach((b) => b.onclick = () => { st.sTarget = +b.dataset.v; window.pressSeg('segS', st.sTarget); });
      window.pressSeg('segS', st.sTarget);
    },
    views: [['全景', [380, 420, 900], [0, 230, 0]], ['刻度', [140, 300, 340], [0, 270, 0]]], get home() { return this.views[0]; },
    missions: [
      {t: '平视读出水的体积 V1 = 50 mL', k: '量筒的正确读数方法', check: () => st.readLvl > 1.2},
      {t: '俯视读数，发现读数偏大', k: '读数误差分析', check: () => st.stone < .1 && st.eye > .6},
      {t: '放入石块，平视读出 V2，算出石块体积', k: '用排水法测不规则物体体积', check: () => st.readStone > 1.2},
    ],
    update(dt, anim) {
      st.t += anim;
      st.stone += (st.sTarget - st.stone) * Math.min(1, dt * 2.5);
      const sy = lerp(Y0 + H + 80, Y0 + 30, st.stone), sub = clamp((level(V1) + 10 - (sy - 22)) / 44, 0, 1);
      const ml = V1 + VS * sub, top = level(ml);
      water.set(Y0, top - Y0 - 2); menis.position.y = top - 1;
      stone.position.set(0, sy, 0); stone.rotation.y = st.t * .3; thread.set(V(0, sy + 18, 0), V(0, Y0 + H + 160, 0));
      const ey = top + st.eye * 160, ex = 260;
      eye.position.set(ex, ey, 0);
      // reading = where the sight line from the eye through the meniscus bottom hits the scale (front wall)
      // the sight line from the eye through the meniscus bottom crosses the near wall (where the scale is printed)
      const scaleY = ey + (top - ey) * ((ex - R) / ex);
      reading = clamp((scaleY - Y0) / mmPerMl, 0, 110);
      if (Math.abs(st.eye) < .05) reading = ml;
      sight.set(V(ex - 14, ey, 0), V(-R - 30, top - (ey - top) * ((R + 30) / (ex - 14)), 0));
      eye.rotation.z = Math.atan2(top - ey, -ex) + Math.PI;
      const flat = Math.abs(st.eye) < .05;
      if (flat && st.stone < .05) st.readLvl += dt; else st.readLvl = 0;
      if (flat && st.stone > .95) st.readStone += dt; else st.readStone = 0;
      tags.eye.p.set(ex, ey + 22, 0); tags.read.set(f1(reading) + ' mL', flat ? '平视 · 正确' : st.eye > 0 ? '俯视 · 偏大' : '仰视 · 偏小'); tags.read.p.set(-R - 40, top + 10, 0);
      tags.cyl.p.set(0, Y0 + H + 20, 0); st.ml = ml;
    },
    panel() {
      const flat = Math.abs(st.eye) < .05, err = reading - st.ml;
      return {big: f1(reading), bigFrac: reading / 100, bigSub: flat ? '平视读数 · 正确' : (st.eye > 0 ? '俯视 · 读数偏大 ' : '仰视 · 读数偏小 ') + (err > 0 ? '+' : '') + f1(err) + ' mL',
        stName: '读数方法', stAng: `实际 ${f1(st.ml)} mL`, stBig: flat ? '平视 ✓' : st.eye > 0 ? '俯视 · 偏大' : '仰视 · 偏小', stRed: flat,
        rows: [['视线与凹液面最低处相平', flat, flat ? '✓' : ''], ['俯视：读数偏大', st.eye > .05, ''], ['仰视：读数偏小', st.eye < -.05, '']],
        num: st.stone > .9 ? f0(st.ml - V1) : '—', unit: 'cm³ · 石块体积<small>V2 − V1</small>', frac: (st.ml - V1) / 40,
        calc: `V1 = ${V1} mL（只有水）<br>V2 = ${f1(st.ml)} mL（水 + 石块）<br>V石 = V2 − V1 = <b>${f1(st.ml - V1)} cm³</b>`};
    },
    reset() { st.sTarget = 0; return 0; },
    tour: [
      {d: 0, cap: '平视：视线与凹液面的最低处相平，读数 50 mL，这是正确的方法。', dur: 5},
      {d: .9, cap: '俯视：从上往下看，读数偏大。', dur: 4.5},
      {d: -.9, cap: '仰视：从下往上看，读数偏小。', dur: 4.5},
      {d: 0, run() { /* drop stone */ }, set: {stone: 1}, cap: '用细线吊着石块放入水中，水面升到 70 mL。石块体积 = 70 − 50 = 20 cm³。', dur: 6},
    ],
    set(o) { if ('stone' in o) { st.sTarget = o.stone; window.pressSeg('segS', o.stone); } },
    quiz: {},
  };
}

/* ----------------------------------------------------------------- 305 托盘天平：称质量 */
const OBJS = [['橡皮', 23.6], ['苹果', 168.4], ['铁块', 78.2], ['小石块', 41.5]];
function b305(ctx) {
  const root = G(), st = {rider: 0, w: [], obj: 0, ang: 0, av: 0, bal: 0, balObjs: new Set(), t: 0, order: true, msg: ''};
  root.add(bench(1100, 640));
  const base = box(520, 30, 180, MAT.dark()); base.position.y = 15; root.add(base);
  const col = box(30, 260, 30, MAT.alu()); col.position.set(0, 160, 0); root.add(col);
  const beam = G(); beam.position.set(0, 290, 0); root.add(beam);
  const bar = box(560, 14, 18, MAT.alu()); beam.add(bar);
  const ruler = canvasTex(1024, 64, (g, w, h) => { g.fillStyle = '#fbfbfa'; g.fillRect(0, 0, w, h); g.fillStyle = C.ink; g.font = FONT(600, 28); for (let i = 0; i <= 50; i++) { const x = 30 + i / 50 * (w - 60); g.fillRect(x - 1, 0, 2, i % 10 === 0 ? 30 : i % 5 === 0 ? 22 : 14); if (i % 10 === 0) g.fillText(String(i / 10), x - 8, 58); } });
  const rul = new THREE.Mesh(new THREE.PlaneGeometry(200, 13), new THREE.MeshBasicMaterial({map: ruler, toneMapped: false})); rul.position.set(-30, 0, 9.5); beam.add(rul);
  const rider = box(10, 20, 22, MAT.red()); beam.add(rider);
  const pointer = box(4, 200, 3, MAT.dark()); pointer.position.y = -100; beam.add(pointer);
  const dial = box(130, 34, 6, MAT.white()); dial.position.set(0, 92, 20); root.add(dial);
  const mark = box(2, 26, 2, MAT.red()); mark.position.set(0, 92, 24); root.add(mark);
  const pans = [-1, 1].map((s) => {
    const g = G(); root.add(g);
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(90, 80, 10, 40), MAT.steel()); pan.castShadow = true; g.add(pan);
    const hook = rod(MAT.steel(), 1.6); root.add(hook); return {g, s, hook};
  });
  const objMesh = G(); root.add(objMesh);
  const wMeshes = [];
  function setObj(i) {
    st.obj = i; objMesh.clear();
    const m = OBJS[i][1], r = Math.cbrt(m) * 9;
    const o = i === 1 ? sph(r, MAT.col(0xc43b3b)) : i === 2 ? box(r * 1.6, r, r, MAT.steel()) : i === 0 ? box(r * 1.8, r * .8, r, MAT.col(0xf3b6c0)) : new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), MAT.col(0x7d756c));
    o.castShadow = true; o.position.y = r * .5; objMesh.add(o); st.objH = r;
  }
  setObj(0);
  const WS = [100, 50, 20, 10, 5];
  function wsum() { return st.w.reduce((a, b) => a + b, 0); }
  function layoutWeights() {
    wMeshes.forEach((m) => pans[1].g.remove(m)); wMeshes.length = 0;
    st.w.forEach((w, i) => { const r = 6 + Math.cbrt(w) * 3.2, h = r * 1.5; const m = cyl(r, r, h, MAT.brass()); m.position.set((i % 3 - 1) * 40, h / 2 + 5, Math.floor(i / 3) * 34 - 17); const k = cyl(r * .45, r * .45, h * .5, MAT.brass()); k.position.y = h * .7; m.add(k); pans[1].g.add(m); wMeshes.push(m); });
  }
  const tags = {L: makeTag('左盘 · 物体', 'Left'), R: makeTag('右盘 · 砝码', 'Right'), rider: makeTag('游码', 'Rider', true)};
  return {
    root, tags, title: '托盘天平 <i>·</i> 测质量', spec: '左物右码 · 先大后小 · 用镊子夹取砝码',
    bigUnit: 'g · 砝码 + 游码', bigMin: '0', bigMax: '200', intro: '把砝码从大到小放到右盘，再拖动游码，直到指针指在分度盘中央。',
    fml: 'm物 = m砝码 + m游码', fmlTag: '读数', fmlNote: '游码读数看它的<b>左边缘</b>对应的刻度。',
    legend: [['游码', C.red]],
    driver: {name: '游码 · Rider', min: 0, max: 5, step: .1, fmt: (v) => f1(v) + ' g', get: () => st.rider, set: (v) => { st.rider = v; }, scale: () => ['0 g', '1', '2', '3', '4', '5 g']},
    extra: (el) => {
      el.innerHTML = `<div class="grp" style="margin-top:9px"><span class="cp mu">砝码 Weights（加到右盘）</span><div class="seg" id="segW">${WS.map((w) => `<button class="tb" data-v="${w}" type="button">${w}g</button>`).join('')}</div><div class="seg"><button class="tb" id="bUndo" type="button">取下最后一个</button></div></div>
      <div class="grp"><span class="cp mu">换物体 Object</span><div class="seg" id="segO">${OBJS.map((o, i) => `<button class="tb" data-v="${i}" type="button">${o[0]}</button>`).join('')}</div></div>`;
      el.querySelectorAll('#segW .tb').forEach((b) => b.onclick = () => { const w = +b.dataset.v; if (st.w.length && w > Math.min(...st.w)) st.order = false; st.w.push(w); layoutWeights(); });
      el.querySelector('#bUndo').onclick = () => { st.w.pop(); layoutWeights(); };
      el.querySelectorAll('#segO .tb').forEach((b) => b.onclick = () => { setObj(+b.dataset.v); st.w = []; st.order = true; layoutWeights(); window.pressSeg('segO', st.obj); });
      window.pressSeg('segO', st.obj);
    },
    views: [['全景', [0, 520, 1000], [0, 200, 0]], ['游码', [-60, 340, 300], [-30, 290, 0]], ['指针', [0, 200, 420], [0, 220, 0]]], get home() { return this.views[0]; },
    missions: [
      {t: '按“先大后小”的顺序加砝码，使天平平衡', k: '天平的使用方法', check: () => st.bal > 1 && st.order && st.w.length > 0},
      {t: '用游码精确调节到平衡', k: '游码的读数', check: () => st.bal > 1 && st.rider > .05},
      {t: '称出两个不同物体的质量', k: '质量的测量', check: () => st.balObjs.size >= 2},
    ],
    update(dt, anim) {
      st.t += anim;
      const diff = OBJS[st.obj][1] - (wsum() + st.rider); // >0: left heavier
      const target = clamp(diff * .02, -.12, .12);
      st.av += ((target - st.ang) * 40 - st.av * 5) * anim; st.ang += st.av * anim;
      beam.rotation.z = st.ang;
      rider.position.set(-124 + st.rider / 5 * 188 + 5, 0, 12);
      pans.forEach((p) => {
        const end = V(p.s * 250, 0, 0).applyEuler(beam.rotation).add(beam.position);
        p.g.position.set(end.x, end.y - 150, 0); p.hook.set(end, V(end.x, end.y - 145, 0));
      });
      objMesh.position.copy(pans[0].g.position).add(V(0, 5, 0));
      const balanced = Math.abs(diff) < .051;
      if (balanced) { st.bal += dt; if (st.bal > 1) st.balObjs.add(st.obj); } else st.bal = 0;
      tags.L.p.copy(pans[0].g.position).add(V(0, -24, 0)); tags.L.below = true; tags.R.p.copy(pans[1].g.position).add(V(0, -24, 0)); tags.R.below = true;
      tags.rider.p.copy(rider.position).applyEuler(beam.rotation).add(beam.position).add(V(0, 16, 0));
    },
    panel() {
      const tot = wsum() + st.rider, diff = OBJS[st.obj][1] - tot, b = Math.abs(diff) < .051;
      return {big: f1(tot), bigFrac: tot / 200, bigSub: b ? `平衡！${OBJS[st.obj][0]}的质量 = ${f1(tot)} g` : diff > 0 ? '指针偏左 · 右盘还要加' : '指针偏右 · 砝码太重了',
        stName: '天平状态', stAng: OBJS[st.obj][0], stBig: b ? '平衡 ✓' : diff > 0 ? '左盘重' : '右盘重', stRed: b,
        rows: [['左物右码', true, '✓'], ['砝码先大后小', st.order, st.order ? '✓' : '✗'], ['指针指在分度盘中央', b, b ? '✓' : '']],
        num: st.w.length ? st.w.join('+') : '0', unit: 'g · 右盘砝码<small>Weights</small>', frac: wsum() / 200,
        calc: `m = 砝码 + 游码<br>= ${wsum()} g + ${f1(st.rider)} g<br>= <b>${f1(tot)} g</b>`};
    },
    reset() { st.w = []; st.order = true; layoutWeights(); return 0; },
    tour: [{d: 0, cap: '先把物体放在左盘，用镊子按从大到小的顺序往右盘加砝码。', dur: 5, view: 0}, {d: 3.6, view: 1, cap: '最后移动游码。游码向右移，相当于往右盘加小砝码。', dur: 5}],
    quiz: {},
  };
}

export const C1 = {301: {n: 3, build: b301}, 302: {n: 3, build: b302}, 303: {n: 3, build: b303}, 304: {n: 3, build: b304}, 305: {n: 3, build: b305}};
