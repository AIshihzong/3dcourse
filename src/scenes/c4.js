/* 七上·第4章 物质的特性 : 315–318 */
import * as THREE from 'three';
import {makeSorter} from './sorter.js';
import {buildMatter} from './ported.js';
import {C, MAT, G, V, D2R, TAU, clamp, lerp, f0, f1, f2, mesh, box, cyl, sph, rod, canvasTex, FONT, makeTag, bench, liquid, rand, randn, curve} from '../kit.js';

/* ----------------------------------------------------------------- 315 分子运动：冷水和热水中的扩散 */
function b315(ctx) {
  const root = G(), st = {T: 70, t: 0, hot: 0, track: false, mixed: 0, mixT: 0};
  root.add(bench(1300, 760));
  const N = 260, BR = 110, BH = 260;
  const beakers = [-260, 260].map((x, k) => {
    const g = G(); g.position.x = x; root.add(g);
    const gl = mesh(new THREE.CylinderGeometry(BR + 6, BR + 2, BH + 40, 40, 1, true), MAT.glass(.16), false); gl.position.y = (BH + 40) / 2; g.add(gl);
    const w = liquid(BR); w.set(2, BH); w.material.opacity = .22; g.add(w);
    const ink = new THREE.InstancedMesh(new THREE.SphereGeometry(4.2, 8, 6), MAT.glow(C.red), N); g.add(ink);
    const p = new Float32Array(N * 3); for (let i = 0; i < N; i++) { p[i * 3] = randn() * 6; p[i * 3 + 1] = BH - 20 + randn() * 6; p[i * 3 + 2] = randn() * 6; }
    return {g, ink, p};
  });
  const trailG = new THREE.BufferGeometry(); trailG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(240 * 3), 3));
  const trail = new THREE.Line(trailG, new THREE.LineBasicMaterial({color: C.ink})); trail.frustumCulled = false; beakers[1].g.add(trail); const tb = [];
  // 50 mL water + 50 mL alcohol tube
  const tube = G(); tube.position.set(0, 0, -260); root.add(tube);
  const tg = mesh(new THREE.CylinderGeometry(30, 30, 300, 32, 1, true), MAT.glass(.2), false); tg.position.y = 150; tube.add(tg);
  const tw = liquid(28, MAT.water(.45)); tube.add(tw); const ta = liquid(28, MAT.col(0xf6e7b5, {transparent: true, opacity: .55, depthWrite: false})); tube.add(ta);
  const mark = box(70, 2, 2, MAT.red()); mark.position.y = 10 + 260; tube.add(mark);
  const dummy = new THREE.Object3D();
  const spread = (b) => { let s = 0; for (let i = 0; i < N; i++) s += b.p[i * 3] ** 2 + b.p[i * 3 + 2] ** 2 + (b.p[i * 3 + 1] - BH / 2) ** 2 * .3; return Math.sqrt(s / N); };
  const tags = {cold: makeTag('冷水', '10 °C'), hot: makeTag('热水', '', true), tube: makeTag('水 + 酒精', '')};
  const temps = () => [10, st.T];
  return {
    root, tags, title: '分子运动 <i>·</i> 扩散', spec: '物质由分子构成 · 分子在不停地做无规则运动 · 分子之间有空隙',
    bigUnit: '% · 热水中的扩散程度', bigMin: '0', bigMax: '100', intro: '同时往冷水和热水里滴一滴红墨水。拖动滑块改变右边热水的温度，比较扩散的快慢。',
    fml: '温度越高<br>分子运动越剧烈', fmlTag: '扩散', fmlNote: '扩散现象说明分子在<b>不停地做无规则运动</b>；气体、液体、固体之间都能发生扩散。',
    legend: [['红墨水分子', C.red]],
    driver: {name: '右杯水温 · Temperature', min: 10, max: 90, step: 1, fmt: (v) => f0(v) + ' °C', get: () => st.T, set: (v) => { st.T = v; }, scale: () => ['10 °C', '50 °C', '90 °C']},
    extra: (el) => {
      el.innerHTML = `<div class="grp" style="margin-top:9px"><div class="seg"><button class="tb red" id="bDrop" type="button">重新滴墨水</button><button class="tb" id="bTrack" type="button">跟踪一个分子</button></div></div>
      <div class="grp"><span class="cp mu">分子间有空隙</span><div class="seg"><button class="tb" id="bMix" type="button">50 mL 水 + 50 mL 酒精 混合</button></div></div>`;
      el.querySelector('#bDrop').onclick = () => { for (const b of beakers) for (let i = 0; i < N; i++) { b.p[i * 3] = randn() * 6; b.p[i * 3 + 1] = BH - 20 + randn() * 6; b.p[i * 3 + 2] = randn() * 6; } st.hot = 0; tb.length = 0; };
      el.querySelector('#bTrack').onclick = () => { st.track = !st.track; el.querySelector('#bTrack').setAttribute('aria-pressed', st.track); tb.length = 0; };
      el.querySelector('#bMix').onclick = () => { st.mixed = 1; st.mixT = 0; };
    },
    views: [['全景', [0, 520, 1150], [0, 150, -40]], ['热水', [420, 300, 520], [260, 140, 0]], ['混合', [160, 340, 300], [0, 160, -260]]], get home() { return this.views[0]; },
    missions: [
      {t: '把热水调到 60 °C 以上，比较冷热水中的扩散', k: '温度越高，分子运动越剧烈', check: () => st.T >= 60 && spread(beakers[1]) > spread(beakers[0]) * 1.6},
      {t: '跟踪一个墨水分子，看它的运动路线', k: '分子做无规则运动', check: () => st.track && tb.length > 150},
      {t: '把 50 mL 水和 50 mL 酒精混合，看总体积', k: '分子之间存在空隙', check: () => st.mixT > 2.5},
    ],
    update(dt, anim) {
      st.t += anim;
      beakers.forEach((b, k) => {
        const T = temps()[k], step = (4 + T * .55) * Math.sqrt(Math.max(anim, 0)) * 3;
        for (let i = 0; i < N; i++) {
          const j = i * 3; b.p[j] += randn() * step; b.p[j + 1] += randn() * step - anim * 2; b.p[j + 2] += randn() * step;
          const r = Math.hypot(b.p[j], b.p[j + 2]); if (r > BR - 6) { b.p[j] *= (BR - 6) / r; b.p[j + 2] *= (BR - 6) / r; }
          b.p[j + 1] = clamp(b.p[j + 1], 8, BH - 4);
          dummy.position.set(b.p[j], b.p[j + 1], b.p[j + 2]); dummy.updateMatrix(); b.ink.setMatrixAt(i, dummy.matrix);
        }
        b.ink.instanceMatrix.needsUpdate = true;
      });
      const hb = beakers[1].p; if (st.track && anim > 0) { tb.push(hb[0], hb[1], hb[2]); if (tb.length > 240 * 3) tb.splice(0, 3); }
      const a = trailG.attributes.position; for (let i = 0; i < 240; i++) { const k = Math.min(i * 3, Math.max(0, tb.length - 3)); a.setXYZ(i, tb[k] ?? 0, tb[k + 1] ?? 0, tb[k + 2] ?? 0); } a.needsUpdate = true;
      trailG.setDrawRange(0, Math.max(0, tb.length / 3)); trail.visible = st.track;
      // mixing: 50 + 50 → about 97 mL
      if (st.mixed) st.mixT += anim;
      const k = clamp(st.mixT / 2, 0, 1), unit = 2.6;
      if (!st.mixed) { tw.set(10, 50 * unit); ta.set(10 + 50 * unit, 50 * unit); ta.visible = true; }
      else { const tot = lerp(100, 97, k); tw.set(10, tot * unit); tw.material.color.set(new THREE.Color(0x8fc4ee).lerp(new THREE.Color(0xd8d0b0), k)); ta.set(10 + tot * unit, Math.max(.01, (1 - k) * 3)); ta.visible = k < 1; }
      tags.cold.p.set(-260, BH + 70, 0); tags.hot.p.set(260, BH + 70, 0); tags.hot.set('热水', f0(st.T) + ' °C');
      tags.tube.p.set(0, 330, -260); tags.tube.set('水 + 酒精', st.mixed ? f0(lerp(100, 97, k)) + ' mL' : '50 + 50 mL');
    },
    panel() {
      const sc = spread(beakers[0]), sh = spread(beakers[1]), fh = clamp(sh / 95, 0, 1), fc = clamp(sc / 95, 0, 1);
      return {big: f0(fh * 100), bigFrac: fh, bigSub: `冷水中扩散程度 ${f0(fc * 100)}%`,
        stName: '冷热对比', stAng: `${f0(st.T)} °C vs 10 °C`, stBig: sh > sc * 1.3 ? '热水扩散更快' : '差别还不明显', stRed: sh > sc * 1.3,
        rows: [['分子在不停地做无规则运动', true, ''], ['温度越高，运动越剧烈', st.T > 40, ''], ['分子之间有空隙', st.mixT > 2.5, st.mixed ? '97 mL' : '']],
        num: st.mixed ? f0(lerp(100, 97, clamp(st.mixT / 2, 0, 1))) : '100', unit: 'mL · 混合后总体积<small>小于 50 + 50</small>', frac: .97,
        chart: {t: '扩散程度对比', u: '%', x0: 0, x1: 3, y0: 0, y1: 100, xl: '', yl: '%', bars: [[1, fc * 100, C.blue, '冷水'], [2, fh * 100, C.red, '热水']]}};
    },
    reset() { st.mixed = 0; st.mixT = 0; st.track = false; return 70; },
    tour: [{d: 80, view: 0, cap: '同时滴入红墨水：热水中的墨水散开得快得多，说明温度越高分子运动越剧烈。', dur: 7}, {d: 80, view: 2, run() { st.mixed = 1; st.mixT = 0; }, cap: '50 mL 水和 50 mL 酒精混合后，总体积小于 100 mL：分子之间有空隙。', dur: 6}],
    quiz: {},
  };
}

/* ----------------------------------------------------------------- 316 密度：同体积不同质量、沉与浮 */
const MATS = [['铁', 7.9, 0x8d939b], ['铝', 2.7, 0xd9dbdf], ['铜', 8.9, 0xc07a45], ['冰', .9, 0xdff1fb], ['木块', .6, 0xc8a27a], ['泡沫', .05, 0xf6f6f2]];
function b316(ctx) {
  const root = G(), st = {V: 40, mi: 0, inWater: false, rec: [], t: 0, y: 0};
  root.add(bench(1300, 760));
  // electronic scale
  const scale = G(); scale.position.set(-300, 0, 0); root.add(scale);
  const sb = box(260, 50, 220, MAT.white()); sb.position.y = 25; scale.add(sb);
  const pan = cyl(100, 100, 8, MAT.steel()); pan.position.y = 56; scale.add(pan);
  const lcdT = canvasTex(256, 80, () => {});
  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(120, 36), new THREE.MeshBasicMaterial({map: lcdT, toneMapped: false})); lcd.position.set(0, 26, 111); scale.add(lcd);
  // water tank
  const tank = G(); tank.position.set(280, 0, 0); root.add(tank);
  const tg = mesh(new THREE.BoxGeometry(300, 300, 240), MAT.glass(.14), false); tg.position.y = 150; tank.add(tg);
  const tw = mesh(new THREE.BoxGeometry(296, 220, 236), MAT.water(.32), false); tw.position.y = 110; tank.add(tw);
  const cube = mesh(new THREE.BoxGeometry(1, 1, 1), MAT.col(0x8d939b)); root.add(cube);
  const tags = {cube: makeTag('', '', true), scale: makeTag('电子秤', 'Scale'), tank: makeTag('水槽', 'ρ水 = 1.0 g/cm³')};
  const side = () => Math.cbrt(st.V) * 10; // 1 cm = 10 units
  const m = () => MATS[st.mi][1] * st.V;
  const setMat = (i) => { st.mi = i; cube.material.color.set(MATS[i][2]); cube.material.transparent = MATS[i][0] === '冰'; cube.material.opacity = MATS[i][0] === '冰' ? .8 : 1; };
  return {
    root, tags, title: '密度 <i>·</i> ρ = m / V', spec: '单位体积某种物质的质量 · 物质的一种特性',
    bigUnit: 'g · 质量 m', bigMin: '0', bigMax: '900', intro: '选择一种物质，拖动滑块改变它的体积。放到秤上称质量，再放进水里看沉浮。',
    fml: 'ρ = m / V', fmlTag: '密度公式', fmlNote: '1 g/cm³ = 1×10³ kg/m³。同种物质密度一般不变，质量与体积<b>成正比</b>。',
    legend: [['ρ > ρ水：下沉', C.grey], ['ρ < ρ水：上浮', '#c8a27a']],
    driver: {name: '体积 V · Volume', min: 5, max: 100, step: 1, fmt: (v) => f0(v) + ' cm³', get: () => st.V, set: (v) => { st.V = v; }, scale: () => ['5 cm³', '50', '100 cm³']},
    extra: (el) => {
      el.innerHTML = `<div class="grp" style="margin-top:9px"><span class="cp mu">物质 Material</span><div class="seg" id="segMat">${MATS.map((x, i) => `<button class="tb" data-v="${i}" type="button">${x[0]}</button>`).join('')}</div></div>
      <div class="grp"><span class="cp mu">放到 Put on</span><div class="seg" id="segW"><button class="tb" data-v="0" type="button">电子秤</button><button class="tb" data-v="1" type="button">水里</button></div></div>
      <div class="grp"><div class="seg"><button class="tb red" id="bRec" type="button">记录 m 和 V</button><button class="tb" id="bClr" type="button">清空</button></div></div>`;
      el.querySelectorAll('#segMat .tb').forEach((b) => b.onclick = () => { setMat(+b.dataset.v); window.pressSeg('segMat', st.mi); });
      el.querySelectorAll('#segW .tb').forEach((b) => b.onclick = () => { st.inWater = b.dataset.v === '1'; window.pressSeg('segW', +st.inWater); });
      el.querySelector('#bRec').onclick = () => { st.rec.push({mi: st.mi, V: st.V, m: m()}); if (st.rec.length > 16) st.rec.shift(); document.getElementById('caption').textContent = `记录：${MATS[st.mi][0]}，V = ${st.V} cm³，m = ${f1(m())} g，ρ = ${MATS[st.mi][1]} g/cm³`; };
      el.querySelector('#bClr').onclick = () => { st.rec = []; };
      window.pressSeg('segMat', st.mi); window.pressSeg('segW', +st.inWater);
    },
    views: [['全景', [0, 820, 1650], [0, 90, 0]], ['水槽', [420, 300, 560], [280, 130, 0]]], get home() { return this.views[0]; },
    missions: [
      {t: '体积相同时，分别记录铁和木块的质量', k: '体积相同，不同物质质量不同', check: () => st.rec.some((a) => a.mi === 0 && st.rec.some((b) => b.mi === 4 && b.V === a.V))},
      {t: '把一种密度比水小的物体放进水里，看它漂浮', k: 'ρ物 < ρ水 时上浮', check: () => st.inWater && MATS[st.mi][1] < 1 && st.t > 0},
      {t: '同一种物质记录 3 个不同体积，发现 m 与 V 成正比', k: '密度是物质的特性', check: () => MATS.some((_, i) => new Set(st.rec.filter((r) => r.mi === i).map((r) => r.V)).size >= 3)},
    ],
    update(dt, anim) {
      st.t += anim;
      const s = side(); cube.scale.setScalar(s);
      const rho = MATS[st.mi][1];
      let target;
      if (!st.inWater) target = V(-300, 60 + s / 2, 0);
      else { const top = 220; const y = rho >= 1 ? 2 + s / 2 : top - s * rho + s / 2; target = V(280, y + Math.sin(st.t * 2) * (rho < 1 ? 2 : 0), 0); }
      cube.position.lerp(target, Math.min(1, dt * 4));
      lcdT.redraw((g, w, h) => { g.fillStyle = '#1b2a22'; g.fillRect(0, 0, w, h); g.fillStyle = '#9fe6b8'; g.font = FONT(700, 54); g.textAlign = 'right'; g.fillText((st.inWater ? 0 : m()).toFixed(1), w - 50, 60); g.font = FONT(600, 28); g.fillText('g', w - 16, 60); });
      tags.cube.p.copy(cube.position).add(V(0, s / 2 + 12, 0)); tags.cube.set(MATS[st.mi][0], `ρ = ${MATS[st.mi][1]} g/cm³`);
      tags.scale.p.set(-300, -2, 120); tags.scale.below = true; tags.tank.p.set(280, 320, 0);
    },
    panel() {
      const rho = MATS[st.mi][1], cols = [C.ink, C.grey, C.orange, C.blue, '#c8a27a', C.faint];
      return {big: f1(m()), bigFrac: m() / 900, bigSub: `${MATS[st.mi][0]} · V = ${st.V} cm³`,
        stName: '沉浮判断', stAng: `ρ水 = 1.0`, stBig: rho > 1 ? '下沉' : rho < 1 ? '漂浮' : '悬浮', stRed: rho < 1,
        rows: MATS.map((x, i) => [`${x[0]} · ${x[1]} g/cm³`, i === st.mi, x[1] > 1 ? '沉' : '浮']),
        num: String(rho), unit: 'g/cm³ · 密度<small>与体积大小无关</small>', frac: rho / 9,
        calc: `m = ρV<br>= ${rho} g/cm³ × ${st.V} cm³<br>= <b>${f1(m())} g</b>`,
        chart: {t: '质量–体积 m–V', u: '斜率 = 密度', x0: 0, x1: 100, y0: 0, y1: 900, xl: 'V / cm³', yl: 'm / g', paths: MATS.map((x, i) => ({pts: [[0, 0], [100, Math.min(900, x[1] * 100)]].map((p, k) => k ? [Math.min(100, 900 / x[1]), Math.min(900, x[1] * 100)] : p), c: i === st.mi ? C.red : C.faint, w: i === st.mi ? 1.8 : 1})), dots: st.rec.map((r) => [r.V, r.m]), pt: [st.V, m()]}};
    },
    reset() { st.rec = []; st.inWater = false; window.pressSeg('segW', 0); return 40; },
    tour: [{d: 40, view: 0, cap: '体积都是 40 cm³：铁块 316 g，木块只有 24 g。体积相同，不同物质的质量不同。', dur: 6}, {d: 80, dTime: 3, cap: '同一种物质，体积增大一倍，质量也增大一倍：m 与 V 成正比，比值 m/V 就是密度。', dur: 7}],
    quiz: {},
  };
}

/* ----------------------------------------------------------------- 317 物态变化（移植自原型） */
function b317(ctx) {
  const s = buildMatter(ctx);
  const st = s.st; let melt = 0, boil = 0, cond = 0;
  const up = s.update; s.update = (dt, anim) => { up(dt, anim); const th = s.thermo(st.s); if (th.seg === 1 && st.dir > 0) melt += dt; if (th.seg === 3 && st.dir > 0) boil += dt; if (th.seg === 3 && st.dir < 0) cond += dt; };
  s.missions = [
    {t: '加热冰，看到熔化时温度保持 0 °C', k: '晶体熔化吸热，温度不变', check: () => melt > 2.5},
    {t: '继续加热到水沸腾', k: '沸腾时吸热，温度保持沸点', check: () => boil > 2.5},
    {t: '把水蒸气冷却，观察液化', k: '液化放热（“白气”是小水滴）', check: () => cond > 2},
  ];
  s.quiz = {2: {from: 58, d: 88, dTime: 8, view: 2, cap: '验证：持续加热，温度计停在 100 °C 不动，分子却在不断变成水蒸气。'}, 3: {from: 97, d: 64, dTime: 7, view: 1, cap: '验证：水蒸气遇冷（放热）液化，分子重新聚到一起成为小水滴。'}};
  s.hint = '拖动滑块加热或冷却 · 左下角可自动加热';
  return s;
}

/* ----------------------------------------------------------------- 318 物理性质与化学性质 */
const PROP = [
  ['铁是银白色的', 0, '颜色属于物理性质'], ['酒精容易挥发', 0, '挥发性不需要发生化学变化就能表现出来'], ['铜能导电', 0, '导电性是物理性质'], ['水的沸点是 100 °C', 0, '熔点、沸点是物理性质'],
  ['木炭能燃烧', 1, '“能燃烧”描述的是可燃性，是化学性质'], ['铁在潮湿空气中易生锈', 1, '“易生锈”是化学性质'], ['氧气能支持燃烧', 1, '助燃性是化学性质'],
  ['冰雪融化', 2, '只是状态改变，没有新物质'], ['玻璃破碎', 2, '形状改变，没有新物质'], ['蜡烛燃烧', 3, '生成了二氧化碳和水'], ['牛奶变酸', 3, '生成了新物质'], ['铁锅生锈', 3, '生成了新物质铁锈'],
];
function b318(ctx) {
  return makeSorter(ctx, {
    items: PROP, bins: ['物理性质', '化学性质', '物理变化', '化学变化'], short: ['物理性质', '化学性质', '物理变化', '化学变化'], ask: '性质还是变化？', cardTag: '描述卡片',
    title: '性质 <i>·</i> 变化', spec: '有没有新物质生成 · “能、会、易”往往描述性质',
    intro: '判断每句话描述的是物理性质、化学性质，还是正在发生的物理变化、化学变化。',
    fml: '化学变化 ⇔ 有新物质生成', fmlTag: '判断依据', fmlNote: '“木炭能燃烧”是<b>化学性质</b>，“木炭燃烧”是<b>化学变化</b>：性质是能力，变化是过程。',
    onRight: (st) => { if (st.kinds.every((n) => n > 0)) ctx.done(0); if (st.hits.has('木炭能燃烧') && st.hits.has('蜡烛燃烧')) ctx.done(1); },
    missions: (st, items) => [{t: '四类各分对至少 1 张', k: '物理性质与化学性质'}, {t: '分清“木炭能燃烧”和“蜡烛燃烧”', k: '性质与变化的区别'}, {t: '12 张全部完成', k: '物理变化与化学变化', check: () => st.i >= items.length}],
  });
}

export const C4 = {315: {n: 3, build: b315}, 316: {n: 3, build: b316}, 317: {n: 3, build: b317}, 318: {n: 3, build: b318}};
