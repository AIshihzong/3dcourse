/* 七上·第2章 观察生物 : 306–309 */
import * as THREE from 'three';
import {makeSorter} from './sorter.js';
import {C, MAT, G, V, D2R, TAU, clamp, lerp, f0, f1, mesh, box, cyl, sph, rod, makeTag, bench, rand} from '../kit.js';

/* ----------------------------------------------------------------- 306 生物与非生物：向光的植物 */
function b306(ctx) {
  const root = G(), st = {ang: 40, days: 12, bend: 0, az: 0, t: 0, seen: new Set()};
  root.add(bench(1400, 900));
  const pot = mesh(new THREE.CylinderGeometry(70, 52, 110, 40), MAT.col(0xb5653c, {roughness: .8})); pot.position.y = 55; root.add(pot);
  const soil = cyl(64, 64, 6, MAT.col(0x4a3426, {roughness: 1})); soil.position.y = 104; root.add(soil);
  const NS = 12, segs = Array.from({length: NS}, () => { const r = rod(MAT.col(0x3f8f4a), 4.5); root.add(r); return r; });
  const leafG = new THREE.SphereGeometry(1, 16, 10), leafM = MAT.col(0x4fae5c);
  const leaves = Array.from({length: 10}, () => { const m = mesh(leafG, leafM); root.add(m); return m; });
  const flower = G(); root.add(flower);
  for (let i = 0; i < 6; i++) { const p = mesh(leafG, MAT.red()); p.scale.set(16, 4, 8); p.position.set(Math.cos(i / 6 * TAU) * 14, 0, Math.sin(i / 6 * TAU) * 14); p.rotation.y = -i / 6 * TAU; flower.add(p); }
  const fc = sph(8, MAT.col(0xf2c14e)); flower.add(fc);
  // lamp on an arc
  const lamp = G(); root.add(lamp);
  const shade = mesh(new THREE.ConeGeometry(46, 60, 32, 1, true), MAT.dark()); shade.material.side = THREE.DoubleSide; lamp.add(shade);
  const bulb = sph(16, MAT.glow(0xfff2c0)); bulb.position.y = -14; lamp.add(bulb);
  const lampL = new THREE.SpotLight(0xfff0c8, 900000, 0, .7, .5, 2); lampL.position.set(0, 0, 0); lamp.add(lampL); root.add(lampL.target);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(120, 380, 32, 1, true), MAT.fade(0xfff2c0, .08)); beam.material.side = THREE.DoubleSide; lamp.add(beam);
  // other things to inspect
  const OB = [
    ['向日葵幼苗', true, '能生长、对光有反应、由细胞构成'],
    ['石头', false, '不需要营养，不能生长和繁殖'],
    ['扫地机器人', false, '会动、会“感觉”障碍物，但不由细胞构成，不能繁殖'],
    ['蘑菇', true, '真菌，能吸收营养、呼吸、繁殖（孢子）'],
    ['钟乳石', false, '会慢慢“长大”，但那是碳酸钙沉积，不是生长'],
  ];
  const things = G(); root.add(things);
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(50, 0), MAT.col(0x8b857c, {roughness: .9})); rock.castShadow = true; rock.scale.set(1, .6, .8); rock.position.set(-430, 30, 180); rock.userData.pick = 1; things.add(rock);
  const robot = G(); robot.position.set(-200, 0, 300); robot.userData.pick = 2; things.add(robot);
  const rb = cyl(70, 70, 26, MAT.white()); rb.position.y = 20; robot.add(rb); const rt = cyl(24, 24, 8, MAT.red()); rt.position.y = 36; robot.add(rt);
  const mush = G(); mush.position.set(330, 0, 260); mush.userData.pick = 3; things.add(mush);
  const ms = cyl(12, 16, 60, MAT.white()); ms.position.y = 30; mush.add(ms); const mc = new THREE.Mesh(new THREE.SphereGeometry(44, 24, 12, 0, TAU, 0, Math.PI / 2), MAT.col(0xb5653c)); mc.castShadow = true; mc.position.y = 56; mush.add(mc);
  const stal = mesh(new THREE.ConeGeometry(30, 160, 16), MAT.col(0xe6dccb)); stal.position.set(480, 80, -120); stal.userData.pick = 4; things.add(stal);
  pot.userData.pick = 0;
  const tags = {lamp: makeTag('台灯', 'Light', true), plant: makeTag('向日葵幼苗', ''), rock: makeTag('石头'), robot: makeTag('扫地机器人'), mush: makeTag('蘑菇'), stal: makeTag('钟乳石')};
  const H = () => 50 + Math.min(st.days, 30) * 8.5;
  return {
    root, tags, pickables: [pot, rock, robot, mush, stal], title: '生物 <i>·</i> 生命特征', spec: '生物能对外界刺激作出反应 · 能生长和繁殖 · 由细胞构成',
    bigUnit: '° · 茎向光弯曲的角度', bigMin: '0', bigMax: '40', intro: '移动台灯，过一会儿看看幼苗的茎往哪边弯。再点点旁边的东西，判断它们是不是生物。',
    fml: '刺激 → 反应<br><span class="s">向光性：茎向光源一侧弯曲生长</span>', fmlTag: '应激性', fmlNote: '会动的不一定是生物（机器人），生物不一定会动（植物）。关键看<b>生命特征</b>。',
    legend: [['光源', '#f2c14e'], ['花（繁殖器官）', C.red]],
    driver: {name: '台灯方向 · Light direction', min: -80, max: 80, step: 1, fmt: (v) => Math.abs(v) < 3 ? '正上方' : (v < 0 ? '左 ' : '右 ') + Math.abs(v) + '°', get: () => st.ang, set: (v) => { st.ang = v; }, scale: () => ['左侧', '正上方', '右侧']},
    extra: (el) => {
      el.innerHTML = `<div class="grp" style="margin-top:9px"><div class="ph" style="margin:0"><span class="cp mu">培养天数 Days</span><span class="cp" id="vDay"></span></div><input id="sDay" type="range" min="0" max="30" step="1" value="${st.days}" aria-label="天数"></div>`;
      const s = el.querySelector('#sDay'), v = el.querySelector('#vDay'), u = () => { v.textContent = '第 ' + st.days + ' 天'; }; u();
      s.oninput = () => { st.days = +s.value; u(); };
    },
    pick: (k) => { if (k === null || k === undefined) return null; st.seen.add(k); const o = OB[k]; return `<b>${o[0]}</b>：${o[1] ? '✓ 是生物' : '✗ 不是生物'} —— ${o[2]}`; },
    views: [['全景', [0, 640, 1350], [0, 160, 40]], ['幼苗', [260, 320, 520], [0, 220, 0]], ['俯视', [0, 1500, 60], [0, 0, 0]]], get home() { return this.views[0]; },
    missions: [
      {t: '把台灯移到一侧，让幼苗向光弯曲超过 20°', k: '生物能对外界刺激作出反应', check: () => st.bend > 20 * D2R},
      {t: '培养到第 24 天，看到幼苗开花', k: '生物能生长和繁殖', check: () => st.days >= 24},
      {t: '检查 4 个物体是不是生物', k: '生物与非生物的区别', check: () => st.seen.size >= 4},
    ],
    update(dt, anim) {
      st.t += anim;
      const th = st.ang * D2R, lp = V(Math.sin(th) * 430, 140 + Math.cos(th) * 360, 60);
      lamp.position.copy(lp); lamp.lookAt(V(0, 160, 0)); lamp.rotateX(-Math.PI / 2);
      lampL.target.position.set(0, 160, 0);
      beam.position.set(0, -200, 0);
      // stem bends toward the light, slowly (it takes "time")
      const targetBend = clamp(Math.abs(st.ang) / 80, 0, 1) * 40 * D2R * clamp(st.days / 6, 0, 1);
      st.bend += (targetBend - st.bend) * Math.min(1, anim * .5);
      st.az = st.ang >= 0 ? 0 : Math.PI;
      const segL = H() / NS; let p = V(0, 104, 0); const pts = [p.clone()];
      for (let i = 0; i < NS; i++) {
        const a = st.bend * (i + 1) / NS * 1.6, d = V(Math.sin(a) * Math.cos(st.az), Math.cos(a), Math.sin(a) * Math.sin(st.az));
        const q = p.clone().addScaledVector(d, segL); segs[i].set(p, q); segs[i].r = 4.5 - i * .2; p = q; pts.push(p.clone());
      }
      const nLeaf = Math.min(leaves.length, Math.floor(st.days / 3));
      leaves.forEach((l, i) => {
        l.visible = i < nLeaf; if (!l.visible) return;
        const node = pts[Math.min(NS, 2 + Math.floor(i / 2) * 2)], side = i % 2 ? 1 : -1, sz = clamp((st.days - i * 3) / 8, .3, 1);
        l.position.copy(node).add(V(0, 0, side * 26 * sz)); l.scale.set(12 * sz, 3, 28 * sz); l.rotation.set(side * .4, 0, 0);
      });
      flower.visible = st.days >= 24; flower.position.copy(p); flower.scale.setScalar(clamp((st.days - 23) / 4, .3, 1.2));
      flower.rotation.z = -st.bend * Math.cos(st.az) * 1.2;
      tags.lamp.p.copy(lp).add(V(0, 40, 0)); tags.plant.p.copy(p).add(V(0, 30, 0)); tags.plant.set('向日葵幼苗', '第 ' + st.days + ' 天');
      tags.rock.p.set(-430, 70, 180); tags.robot.p.set(-200, 60, 300); tags.mush.p.set(330, 110, 260); tags.stal.p.set(480, 170, -120);
    },
    panel() {
      const b = st.bend / D2R;
      return {big: f0(b), bigFrac: b / 40, bigSub: b > 20 ? '茎明显弯向光源 —— 对刺激有反应' : '光从一侧照射，茎会慢慢弯过去',
        stName: '生命特征 Life', stAng: `第 ${st.days} 天`, stBig: st.days >= 24 ? '开花 · 繁殖' : b > 20 ? '向光生长' : '生长中', stRed: b > 20 || st.days >= 24,
        rows: [['需要营养', true, '✓'], ['能进行呼吸', true, '✓'], ['能排出废物', true, '✓'], ['对外界刺激作出反应', b > 20, b > 20 ? '✓' : ''], ['能生长和繁殖', st.days >= 24, st.days >= 24 ? '✓' : ''], ['由细胞构成（除病毒）', true, '✓']],
        num: f0(H() / 10 * 2), unit: 'cm · 株高<small>Height</small>', frac: H() / 305};
    },
    reset() { st.days = 12; const s = document.getElementById('sDay'); if (s) { s.value = 12; s.oninput(); } return 40; },
    tour: [{d: 60, view: 0, cap: '台灯放在右侧，幼苗慢慢弯向光源 —— 生物能对刺激作出反应。', dur: 7}, {d: -60, cap: '换到左侧，茎又会弯向左边。', dur: 7}],
    quiz: {},
  };
}

/* ----------------------------------------------------------------- 307 细胞：植物细胞 vs 动物细胞 + 显微镜放大倍数 */
const PARTS = {
  wall: ['细胞壁', '支持和保护细胞（植物细胞特有）', 1], mem: ['细胞膜', '控制物质进出细胞', 0], cyto: ['细胞质', '流动的胶状物，是生命活动的场所', 0],
  nuc: ['细胞核', '含有遗传物质，控制生物的发育和遗传', 0], vac: ['液泡', '含细胞液，储存糖分、色素等（植物细胞特有，很大）', 1], chl: ['叶绿体', '进行光合作用的场所（植物绿色部分特有）', 1], mito: ['线粒体', '呼吸作用的场所，为细胞提供能量', 0],
};
function b307(ctx) {
  const root = G(), st = {cut: .5, kind: 'plant', eye: 10, obj: 10, found: new Set(), sel: null, t: 0};
  root.add(bench(1300, 900));
  const clip = new THREE.Plane(V(0, 0, -1), 0);
  const cell = G(); cell.position.y = 260; root.add(cell);
  const mk = (geo, mat, key, clipIt = false) => { const m = mesh(geo, mat, false); m.userData.pick = key; if (clipIt) { mat.clippingPlanes = [clip]; mat.side = THREE.DoubleSide; } return m; };
  const tr = (c, op) => MAT.col(c, {transparent: true, opacity: op, depthWrite: false});
  // plant cell (box-like)
  const plant = G(); cell.add(plant);
  const wall = mk(new THREE.BoxGeometry(420, 280, 280, 1, 1, 1), MAT.col(0x7fae5a, {transparent: true, opacity: .55, roughness: .7}), 'wall', true); plant.add(wall);
  const memP = mk(new THREE.BoxGeometry(396, 258, 258), tr(0xe9d8a6, .35), 'mem', true); plant.add(memP);
  const cytoP = mk(new THREE.BoxGeometry(388, 250, 250), tr(0xf6efd8, .25), 'cyto', true); plant.add(cytoP);
  const vac = mk(new THREE.SphereGeometry(1, 32, 20), tr(0x8fc4ee, .6), 'vac'); vac.scale.set(150, 95, 95); vac.position.x = 30; plant.add(vac);
  const nucP = mk(new THREE.SphereGeometry(42, 32, 20), MAT.red(), 'nuc'); nucP.position.set(-150, 40, 40); plant.add(nucP);
  for (let i = 0; i < 14; i++) { const c = mk(new THREE.SphereGeometry(1, 16, 10), MAT.col(0x3f9e4a), 'chl'); c.scale.set(18, 9, 11); const a = i / 14 * TAU; c.position.set(Math.cos(a) * 170, Math.sin(a * 2) * 90, Math.sin(a) * 100); c.rotation.set(a, a * 2, 0); plant.add(c); }
  // animal cell (round)
  const animal = G(); cell.add(animal);
  const memA = mk(new THREE.SphereGeometry(1, 48, 32), tr(0xf0c6b0, .4), 'mem', true); memA.scale.set(200, 150, 160); animal.add(memA);
  const cytoA = mk(new THREE.SphereGeometry(1, 48, 32), tr(0xf8e6da, .25), 'cyto', true); cytoA.scale.set(192, 142, 152); animal.add(cytoA);
  const nucA = mk(new THREE.SphereGeometry(50, 32, 20), MAT.red(), 'nuc'); animal.add(nucA);
  for (const g of [plant, animal]) for (let i = 0; i < 8; i++) { const m = mk(new THREE.CapsuleGeometry(7, 18, 6, 12), MAT.col(0xf05a23), 'mito'); const a = i / 8 * TAU + .3; m.position.set(Math.cos(a) * 120, Math.sin(a * 3) * 60, Math.sin(a) * 80); m.rotation.set(a, 0, a); g.add(m); }
  const pickables = [plant, animal];
  const tags = {nuc: makeTag('', '', true)};
  const mag = () => st.eye * st.obj;
  return {
    root, tags, pickables, title: '细胞 <i>·</i> 显微观察', spec: '细胞是生物体结构和功能的基本单位',
    bigUnit: '× · 显微镜放大倍数', bigMin: '20', bigMax: '640', intro: '拖动滑块把细胞“切开”，点击里面的结构认一认。切换植物细胞和动物细胞，找出它们的不同。',
    fml: '放大倍数 = 目镜 × 物镜', fmlTag: '显微镜', fmlNote: '放大倍数越大，看到的细胞越大，但<b>视野中细胞数目越少</b>、视野越暗。',
    legend: [['细胞核', C.red], ['叶绿体', '#3f9e4a'], ['线粒体', C.orange], ['液泡', '#8fc4ee']],
    driver: {name: '剖切 · Cut away', min: 0, max: 1, step: .01, fmt: (v) => Math.round(v * 100) + '%', get: () => st.cut, set: (v) => { st.cut = v; }, scale: () => ['完整', '切开一半']},
    extra: (el) => {
      el.innerHTML = `<div class="grp" style="margin-top:9px"><span class="cp mu">细胞 Cell</span><div class="seg" id="segK"><button class="tb" data-v="plant" type="button">植物细胞</button><button class="tb" data-v="animal" type="button">动物细胞</button></div></div>
      <div class="grp"><span class="cp mu">目镜 Eyepiece</span><div class="seg" id="segE"><button class="tb" data-v="5" type="button">5×</button><button class="tb" data-v="10" type="button">10×</button><button class="tb" data-v="16" type="button">16×</button></div></div>
      <div class="grp"><span class="cp mu">物镜 Objective</span><div class="seg" id="segO"><button class="tb" data-v="4" type="button">4×</button><button class="tb" data-v="10" type="button">10×</button><button class="tb" data-v="40" type="button">40×</button></div></div>`;
      const sync = () => { window.pressSeg('segK', st.kind); window.pressSeg('segE', st.eye); window.pressSeg('segO', st.obj); };
      el.querySelectorAll('#segK .tb').forEach((b) => b.onclick = () => { st.kind = b.dataset.v; sync(); });
      el.querySelectorAll('#segE .tb').forEach((b) => b.onclick = () => { st.eye = +b.dataset.v; sync(); });
      el.querySelectorAll('#segO .tb').forEach((b) => b.onclick = () => { st.obj = +b.dataset.v; sync(); });
      sync();
    },
    pick: (k) => {
      if (!k) { st.sel = null; return null; }
      st.sel = k; st.found.add(st.kind + ':' + k); const p = PARTS[k];
      if (k === 'nuc') ctx.done(0);
      if (['wall', 'vac', 'chl'].every((x) => st.found.has('plant:' + x))) ctx.done(1);
      return `<b>${p[0]}</b>：${p[1]}`;
    },
    views: [['全景', [300, 560, 980], [0, 240, 0]], ['正面', [0, 280, 700], [0, 260, 0]]], get home() { return this.views[0]; },
    missions: [
      {t: '在细胞里找到细胞核', k: '细胞核控制遗传'},
      {t: '找出植物细胞特有的细胞壁、液泡、叶绿体', k: '动植物细胞结构的异同'},
      {t: '把显微镜调到 400 倍观察', k: '显微镜放大倍数 = 目镜 × 物镜', check: () => mag() === 400},
    ],
    update(dt, anim) {
      st.t += anim;
      plant.visible = st.kind === 'plant'; animal.visible = st.kind === 'animal';
      clip.constant = lerp(200, 0, st.cut);
      const s = clamp(mag() / 400, .12, 1.5); cell.scale.setScalar(s); cell.position.y = 40 + 220 * s;
      cell.rotation.y = Math.sin(st.t * .2) * .25;
      for (const g of [plant, animal]) g.traverse((o) => { if (o.material?.emissive) { const on = o.userData.pick === st.sel; o.material.emissive.set(on ? 0xd6182b : 0); o.material.emissiveIntensity = on ? .35 : 0; } });
      const n = st.kind === 'plant' ? nucP : nucA; tags.nuc.p.copy(n.position); cell.updateMatrixWorld(); cell.localToWorld(tags.nuc.p); root.worldToLocal(tags.nuc.p); tags.nuc.p.y += 60 * s; tags.nuc.set('细胞核', 'Nucleus');
    },
    panel() {
      const P = st.kind === 'plant';
      const keys = P ? ['wall', 'mem', 'cyto', 'nuc', 'vac', 'chl', 'mito'] : ['mem', 'cyto', 'nuc', 'mito'];
      return {big: f0(mag()), bigFrac: mag() / 640, bigSub: `目镜 ${st.eye}× · 物镜 ${st.obj}×` + (mag() === 400 ? ' · 最适合观察细胞' : ''),
        stName: P ? '植物细胞 Plant cell' : '动物细胞 Animal cell', stAng: `已认出 ${keys.filter((k) => st.found.has(st.kind + ':' + k)).length} / ${keys.length}`,
        stBig: st.sel ? PARTS[st.sel][0] : '点击结构', stRed: !!st.sel,
        rows: keys.map((k) => [PARTS[k][0] + (PARTS[k][2] ? ' · 植物特有' : ''), st.found.has(st.kind + ':' + k), st.found.has(st.kind + ':' + k) ? '✓' : '']),
        num: f0(Math.max(1, Math.round(16000 / (mag() * mag()) * 10))), unit: '个 · 视野中细胞数（约）<small>倍数越大越少</small>', frac: 1 - mag() / 640,
        calc: `放大倍数 = 目镜 × 物镜<br>= ${st.eye} × ${st.obj} = <b>${mag()} 倍</b>`};
    },
    reset() { st.kind = 'plant'; st.sel = null; return .5; },
    tour: [{d: .6, view: 0, cap: '植物细胞：最外面是细胞壁，里面有细胞膜、细胞质、细胞核，还有大液泡和叶绿体。', dur: 7}, {d: .6, set: {kind: 'animal'}, cap: '动物细胞：没有细胞壁、叶绿体和大液泡。', dur: 6}],
    set(o) { Object.assign(st, o); window.pressSeg('segK', st.kind); },
    quiz: {},
  };
}

/* ----------------------------------------------------------------- 308 脊椎动物分类 */
const VERT = [
  ['鲫鱼', 0, '用鳃呼吸，用鳍游泳，体表有鳞片', '生活在水中'], ['海马', 0, '虽然长得像马，但用鳃呼吸、有鳍，是鱼类', ''], ['鲸', 4, '用肺呼吸、胎生哺乳，是哺乳类不是鱼', '生活在海洋里'],
  ['青蛙', 1, '幼体（蝌蚪）用鳃呼吸，成体用肺和皮肤呼吸', ''], ['大鲵（娃娃鱼）', 1, '名字里有“鱼”，却是两栖类', ''],
  ['蛇', 2, '体表有鳞片，用肺呼吸，在陆地产卵', ''], ['乌龟', 2, '有坚硬的甲，用肺呼吸，卵生', ''], ['鳄鱼', 2, '名字里有“鱼”，其实是爬行类', ''],
  ['鸽子', 3, '体表被羽毛，前肢变成翼，体温恒定', ''], ['企鹅', 3, '不会飞，但有羽毛、卵生，是鸟类', ''],
  ['蝙蝠', 4, '会飞，但胎生哺乳，是哺乳类', ''], ['兔子', 4, '体表有毛，胎生哺乳，体温恒定', ''],
];
function b308(ctx) {
  return makeSorter(ctx, {
    items: VERT, bins: ['鱼类', '两栖类', '爬行类', '鸟类', '哺乳类'], ask: '它属于哪一类？', cardTag: '动物卡片',
    title: '脊椎动物 <i>·</i> 五大类', spec: '鱼类 · 两栖类 · 爬行类 · 鸟类 · 哺乳类', intro: '根据呼吸方式、体表覆盖物、生殖方式，把动物放进正确的类别。',
    fml: '体内有脊椎骨 → 脊椎动物', fmlTag: '分类依据', fmlNote: '鸟类和哺乳类<b>体温恒定</b>，鱼、两栖、爬行类体温不恒定。',
    onRight: (st) => { if (st.kinds.every((n) => n > 0)) ctx.done(0); if (['鲸', '蝙蝠', '大鲵（娃娃鱼）', '鳄鱼'].filter((n) => st.hits.has(n)).length >= 3) ctx.done(1); },
    missions: (st, items) => [{t: '五大类各分对至少 1 种', k: '脊椎动物的主要特征'}, {t: '分对 3 种“名字骗人”的动物（鲸、蝙蝠、大鲵、鳄鱼）', k: '易错动物的分类'}, {t: '12 种动物全部分完', k: '恒温动物与变温动物', check: () => st.i >= items.length}],
    calc: (st) => '鱼类：鳃呼吸、鳍<br>两栖类：幼体鳃、成体肺 + 皮肤<br>爬行类：鳞片、肺、陆上产卵<br>鸟类：羽毛、恒温、卵生<br>哺乳类：毛、恒温、<b>胎生哺乳</b>', calcT: '特征速查',
  });
}

/* ----------------------------------------------------------------- 309 无脊椎动物分类 */
const INV = [
  ['草履虫', 0, '单细胞，靠纤毛运动', ''], ['水母', 1, '身体呈辐射对称，有口无肛门', ''], ['珊瑚虫', 1, '腔肠动物，珊瑚是它的骨骼', ''],
  ['涡虫', 2, '身体扁平，两侧对称', ''], ['蛔虫', 3, '身体细长呈圆柱形，寄生', ''], ['蚯蚓', 4, '身体由许多体节组成，靠刚毛运动', ''],
  ['蜗牛', 5, '身体柔软，有贝壳', ''], ['乌贼', 5, '名叫“墨鱼”，却是软体动物', ''], ['蝴蝶', 6, '身体和附肢分节，体表有外骨骼（昆虫）', ''],
  ['虾', 6, '有外骨骼和分节的附肢（甲壳类）', ''], ['蜘蛛', 6, '有 8 条腿，不是昆虫，但是节肢动物', ''], ['蜈蚣', 6, '身体分节、很多对足', ''],
];
function b309(ctx) {
  return makeSorter(ctx, {
    items: INV, bins: ['原生动物', '腔肠动物', '扁形动物', '线形动物', '环节动物', '软体动物', '节肢动物'], short: ['原生', '腔肠', '扁形', '线形', '环节', '软体', '节肢'],
    ask: '它属于哪一类？', cardTag: '动物卡片', title: '无脊椎动物 <i>·</i> 分类', spec: '体内没有脊椎骨 · 种类占动物总数 95% 以上',
    intro: '看身体结构：是不是单细胞？是否分节？有没有贝壳或外骨骼？', fml: '节肢动物 = 种类最多<br><span class="s">昆虫：3 对足、2 对翅、身体分头胸腹</span>', fmlTag: '物种多样性',
    fmlNote: '保护物种多样性最有效的措施：<b>建立自然保护区</b>。',
    onRight: (st) => { if (st.kinds[6] >= 3) ctx.done(0); if (st.hits.has('乌贼') && st.hits.has('蜘蛛')) ctx.done(1); },
    missions: (st, items) => [{t: '分对 3 种节肢动物', k: '节肢动物是种类最多的类群'}, {t: '分对乌贼和蜘蛛', k: '易错：墨鱼不是鱼，蜘蛛不是昆虫'}, {t: '12 种动物全部分完', k: '无脊椎动物的主要类群', check: () => st.i >= items.length}],
  });
}

export const C2 = {306: {n: 3, build: b306}, 307: {n: 3, build: b307}, 308: {n: 3, build: b308}, 309: {n: 3, build: b309}};
