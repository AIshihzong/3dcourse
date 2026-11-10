/* 七下·第1章 代代相传的生命 : 321–325 */
import * as THREE from 'three';
import {makeSorter} from './sorter.js';
import {C, MAT, G, V, TAU, clamp, lerp, f0, f1, mesh, box, cyl, sph, canvasTex, FONT, makeTag, bench, rand, randn, polyLen, polyAt, curve} from '../kit.js';

const soft = (c, op) => MAT.col(c, {transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide});
const fib = (n, r) => { const out = []; for (let i = 0; i < n; i++) { const y = 1 - 2 * (i + .5) / n, a = i * 2.39996, s = Math.sqrt(1 - y * y); out.push(V(Math.cos(a) * s * r, y * r, Math.sin(a) * s * r)); } return out; };

/* ----------------------------------------------------------------- 321 新生命的诞生 */
function b321(ctx) {
  const root = G(), st = {p: 0, t: 0, picked: new Set()};
  root.add(bench(1200, 600));
  const Y0 = 110;
  // uterus (pear-shaped lathe, flattened)
  const prof = [[0, 0], [22, 0], [26, 40], [48, 90], [80, 160], [96, 215], [90, 248], [62, 268], [0, 274]].map(([r, y]) => new THREE.Vector2(r, y));
  const ut = G(); ut.position.set(0, Y0, 0); root.add(ut);
  const uterus = mesh(new THREE.LatheGeometry(prof, 48), soft(0xeba4ab, .32), false); uterus.scale.z = .6; uterus.userData.pick = 'ut'; ut.add(uterus);
  const wall = mesh(new THREE.LatheGeometry(prof.map((v) => new THREE.Vector2(v.x * .86, v.y * .97 + 6)), 48), soft(0xd6182b, .10), false); wall.scale.z = .6; ut.add(wall);
  // oviducts + ovaries (both sides)
  const tubePts = (s) => [V(s * 300, Y0 + 205, 0), V(s * 310, Y0 + 262, 0), V(s * 230, Y0 + 290, 0), V(s * 140, Y0 + 268, 0), V(s * 78, Y0 + 245, 0)];
  const tubes = [-1, 1].map((s) => { const m = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tubePts(s)), 60, 9, 10), soft(0xeba4ab, .55), false); m.userData.pick = 'tube'; root.add(m); return m; });
  const ovaries = [-1, 1].map((s) => { const m = sph(1, MAT.col(0xf3c6c9), 24); m.scale.set(40, 24, 24); m.position.set(s * 238, Y0 + 178, 0); m.userData.pick = 'ov'; root.add(m); return m; });
  // path the egg / sperm follow (right side)
  const tp = tubePts(1);
  const eggPath = [V(258, Y0 + 182, 0), ...tp];
  const spermPath = [V(0, Y0 + 6, 0), V(0, Y0 + 110, 0), V(50, Y0 + 220, 0), ...tp.slice().reverse()];
  const FERT = .32; // fraction along tube (from ovary end) where fertilisation happens
  const egg = sph(11, MAT.col(0xfff4e6, {emissive: 0xffd9b3, emissiveIntensity: .25})); root.add(egg);
  const sperm = []; for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(3.2, 8, 6), MAT.glow(0x3d8fe0)); m.scale.set(1, 1, 2.2); m.userData.o = rand(); m.userData.j = V(randn() * 9, randn() * 9, randn() * 5); root.add(m); sperm.push(m); }
  const cells = fib(32, 1).map(() => { const m = sph(1, MAT.col(0xfbe3d8), 12); root.add(m); return m; });
  const cellPos = [1, 2, 4, 8, 16, 32].map((n) => fib(n, n === 1 ? 0 : 6 + Math.cbrt(n) * 3));
  // fetus, sac, placenta, cord
  const fetus = G(); root.add(fetus);
  const sac = mesh(new THREE.SphereGeometry(1, 32, 22), soft(0x8fc4ee, .22), false); fetus.add(sac);
  const body = sph(1, MAT.col(0xf2c3b3)); body.scale.set(.5, .62, .42); body.position.set(.08, -.15, 0); fetus.add(body);
  const head = sph(.36, MAT.col(0xf2c3b3)); head.position.set(-.12, .42, 0); fetus.add(head);
  const placenta = sph(1, MAT.col(0xb5283a), 24); placenta.userData.pick = 'pl'; root.add(placenta);
  const cordM = MAT.col(0xd88b9a); let cord = null;
  const IMPL = V(-28, Y0 + 228, 0);
  const tags = {egg: makeTag('卵细胞', 'Egg'), z: makeTag('受精卵', 'Zygote', true), f: makeTag('胎儿', 'Fetus', true), ut: makeTag('子宫', 'Uterus'), tube: makeTag('输卵管', 'Oviduct'), ov: makeTag('卵巢', 'Ovary'), pl: makeTag('胎盘', 'Placenta')};
  const eL = polyLen(eggPath), sL = polyLen(spermPath), tmp = V();
  const day = (p) => p < 30 ? p / 30 : p < 58 ? 1 + (p - 30) / 28 * 6 : 7 + (p - 58) / 42 * 273;
  const STAGES = [['排卵 · 卵巢排出卵细胞', 0], ['受精 · 输卵管', 30], ['细胞分裂 · 移向子宫', 34], ['着床 · 子宫内膜', 58], ['胚胎 → 胎儿 · 胎盘交换', 64], ['分娩 · 约 280 天', 99]];
  const stage = () => { let k = 0; STAGES.forEach((s, i) => { if (st.p >= s[1]) k = i; }); return k; };
  const INFO = {ov: '卵巢：产生卵细胞，分泌雌性激素。', tube: '输卵管：输送卵细胞，<b>受精的场所</b>。', ut: '子宫：<b>胚胎和胎儿发育的场所</b>。', pl: '胎盘：胎儿通过<b>胎盘和脐带</b>与母体进行物质交换，获得养料和氧气，排出废物。'};
  return {
    root, tags, pickables: [uterus, ...tubes, ...ovaries, placenta], title: '新生命 <i>·</i> 的诞生', spec: '卵细胞 + 精子 → 受精卵 → 胚胎 → 胎儿 · 约 280 天',
    bigUnit: '天 · 孕期', bigMin: '0', bigMax: '280', intro: '拖动滑块推进时间：看卵细胞和精子在哪里相遇，受精卵又在哪里安家长大。点击器官看它的作用。',
    fml: '受精卵 = 新生命的起点', fmlTag: '关键结论', fmlNote: '受精场所：<b>输卵管</b>；发育场所：<b>子宫</b>；物质交换：<b>胎盘、脐带</b>。',
    legend: [['卵细胞 / 受精卵', '#e6b9a0'], ['精子', C.blue], ['胎盘', '#b5283a']],
    driver: {name: '进程 · Timeline', min: 0, max: 100, step: .5, fmt: (v) => '第 ' + f0(day(v)) + ' 天', get: () => st.p, set: (v) => { st.p = v; }, scale: () => ['排卵', '受精', '着床', '分娩'],
      track: () => [[0, 30, C.blue], [30, 58, '#eba4ab'], [58, 100, C.red]]},
    views: [['全景', [0, 520, 1250], [0, 270, 0]], ['输卵管', [200, 420, 520], [190, 380, 0]], ['子宫', [0, 330, 560], [0, 300, 0]]], get home() { return this.views[0]; },
    missions: [
      {t: '推进到精子与卵细胞相遇', k: '受精的场所是输卵管', check: () => st.p >= 30},
      {t: '看受精卵移到子宫，完成着床', k: '胚胎发育的场所是子宫', check: () => st.p >= 60},
      {t: '点击胎盘，看胎儿怎样获得营养', k: '胎盘和脐带进行物质交换'},
    ],
    pick(k) { if (!k) return null; st.picked.add(k); if (k === 'pl') ctx.done(2); return INFO[k]; },
    update(dt, anim) {
      st.t += anim; const p = st.p, sg = stage();
      // egg travels from ovary to the fertilisation point
      const eggK = clamp(p / 30, 0, 1) * (FERT * polyLen(tp) + eggPath[0].distanceTo(eggPath[1])) / eL;
      polyAt(eggPath, eggK * eL, egg.position); egg.visible = p < 30;
      const fertPos = polyAt(eggPath, eggK * eL, V());
      sperm.forEach((m) => { const k = clamp((p - 4) / 26 + (m.userData.o - .5) * .25, 0, .999); polyAt(spermPath, Math.min(k * sL, sL - polyLen(tp) * FERT - 4), m.position); m.position.add(m.userData.j).addScaledVector(V(Math.sin(st.t * 9 + m.userData.o * 20), Math.cos(st.t * 8 + m.userData.o * 9), 0), 2); m.visible = p > 3 && p < 30; });
      // zygote divides while moving to the uterus
      const zk = clamp((p - 30) / 28, 0, 1), n = p < 30 ? -1 : Math.min(5, Math.floor(zk * 6));
      const zPath = [fertPos, ...tp.slice(3), V(40, Y0 + 238, 0), IMPL];
      const zp = polyAt(zPath, zk * polyLen(zPath), V());
      cells.forEach((c, i) => { const on = n >= 0 && i < (1 << n) && p < 64; c.visible = on; if (!on) return; const r = n === 0 ? 11 : 11 / Math.cbrt(1 << n) * 1.25; c.scale.setScalar(r); c.position.copy(zp).add(cellPos[n][i]); });
      // fetus grows after implantation
      const fk = clamp((p - 58) / 42, 0, 1);
      ut.scale.setScalar(1 + fk * .55); ut.position.y = Y0 - fk * 18;
      fetus.visible = p >= 62; const fs = 14 + fk * 92; fetus.scale.setScalar(fs); fetus.position.copy(V(lerp(-28, 0, fk), Y0 + lerp(225, 170, fk), 0)); fetus.rotation.z = .5 + Math.sin(st.t * .8) * .05;
      placenta.visible = p >= 64; placenta.scale.set(10 + fk * 34, 5 + fk * 9, 8 + fk * 16); placenta.position.set(-20 - fk * 26, Y0 + 255 + fk * 112, 0); placenta.rotation.z = .25;
      if (cord) { root.remove(cord); cord.geometry.dispose(); }
      if (placenta.visible) { const a = placenta.position.clone(), b = fetus.position.clone().add(V(fs * .1, -fs * .1, fs * .3)); const mid = a.clone().lerp(b, .5).add(V(fs * .5, 0, fs * .4)); cord = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, mid, b]), 20, 2 + fk * 2.5, 6), cordM); root.add(cord); } else cord = null;
      tags.egg.p.copy(egg.position).add(V(0, 18, 0)); tags.egg.on = egg.visible;
      tags.z.p.copy(zp).add(V(0, 24, 0)); tags.z.on = n >= 0 && p < 62; tags.z.set(n <= 0 ? '受精卵' : `${1 << n} 个细胞`, n <= 0 ? '新生命的起点' : '边分裂边移动');
      tags.f.p.copy(fetus.position).add(V(0, fs + 8, 0)); tags.f.on = fetus.visible; tags.f.set(p < 80 ? '胚胎' : '胎儿', `第 ${f0(day(p) / 7)} 周`);
      tags.ut.p.set(0, Y0 + 10, 0); tags.ut.below = true; tags.tube.p.set(-230, Y0 + 300, 0); tags.ov.p.set(-238, Y0 + 150, 0); tags.ov.below = true;
      tags.pl.p.copy(placenta.position).add(V(-20, 12, 0)); tags.pl.on = placenta.visible;
    },
    panel() {
      const d = day(st.p), sg = stage();
      return {big: f0(d), bigFrac: d / 280, bigSub: STAGES[sg][0],
        stName: '发育阶段', stAng: `第 ${f0(d / 7)} 周`, stBig: STAGES[sg][0].split(' · ')[0], stRed: sg >= 3,
        rows: STAGES.map((s, i) => [s[0], i === sg, i < sg ? '✓' : '']),
        num: st.p < 30 ? '1' : st.p < 58 ? String(1 << Math.min(5, Math.floor((st.p - 30) / 28 * 6))) : '—', unit: '细胞数<small>受精卵不断分裂</small>', frac: clamp((st.p - 30) / 28, 0, 1),
        calc: `营养来源：${st.p < 58 ? '卵黄（受精卵自身）' : '母体 → <b>胎盘、脐带</b> → 胎儿'}<br>场所：${st.p < 58 ? '<b>输卵管</b>' : '<b>子宫</b>'}`, calcT: '营养与场所'};
    },
    reset() { st.picked.clear(); return 0; },
    tour: [{d: 30, dTime: 6, view: 1, cap: '卵巢排出卵细胞，精子穿过子宫游进输卵管。两者在输卵管里结合，形成受精卵 —— 新生命从这里开始。', dur: 8},
      {d: 60, dTime: 6, view: 2, cap: '受精卵一边分裂一边移向子宫，大约一周后埋入子宫内膜，这叫着床。', dur: 8},
      {d: 100, dTime: 7, view: 0, cap: '胚胎在子宫里发育成胎儿，通过胎盘和脐带从母体获得养料和氧气。约 280 天后分娩。', dur: 9}],
    quiz: {0: {d: 64, dTime: 5, view: 0, cap: '验证：受精在输卵管完成，胚胎在子宫里发育。'}, 1: {d: 90, dTime: 4, view: 2, run: () => ctx.done(2), cap: '验证：胎儿通过胎盘和脐带与母体交换物质。'}, 3: {d: 30, dTime: 5, view: 1, cap: '验证：精子和卵细胞在输卵管里相遇，形成受精卵。'}},
  };
}

/* ----------------------------------------------------------------- 322 青春期 */
function growth(pk, amp) { const H = [116], dt = .05; for (let a = 6 + dt; a <= 20.001; a += dt) { const v = Math.max(0, 5.5 / (1 + Math.exp((a - pk - 1.6) / .5))) + amp * Math.exp(-(((a - pk) / 1.1) ** 2)); H.push(H[H.length - 1] + v * dt); } return H; }
const HG = growth(11.5, 3.6), HB = growth(13.5, 4.6);
const hAt = (H, a) => H[clamp(Math.round((a - 6) / .05), 0, H.length - 1)];
const vAt = (H, a) => (hAt(H, a + .5) - hAt(H, a - .5));
function person(col, girl) {
  const g = G(), skin = MAT.col(0xf2c9b0), cloth = MAT.col(col);
  const legL = cyl(9, 7, 80, MAT.col(0x3b4252), 14); legL.position.set(-11, 40, 0); const legR = legL.clone(); legR.position.x = 11; g.add(legL, legR);
  const torso = cyl(girl ? 20 : 22, girl ? 21 : 19, 62, cloth, 20); torso.position.y = 112; g.add(torso);
  const armL = cyl(5.5, 5, 60, skin, 10); armL.position.set(-29, 112, 0); armL.rotation.z = .12; const armR = armL.clone(); armR.position.x = 29; armR.rotation.z = -.12; g.add(armL, armR);
  const neck = cyl(6, 6, 10, skin, 10); neck.position.y = 148; g.add(neck);
  const head = sph(17, skin); head.position.y = 168; g.add(head);
  const hair = sph(18, MAT.col(0x2a2420), 20); hair.scale.set(1, girl ? 1.05 : .75, 1); hair.position.set(0, girl ? 170 : 176, -3); g.add(hair);
  g.userData.parts = {torso, head, legL, legR}; return g;
}
function b322(ctx) {
  const root = G(), st = {age: 8, t: 0, sel: 0};
  root.add(bench(900, 560));
  // height ruler
  const ruler = box(10, 200 * 1.8, 6, MAT.white()); ruler.position.set(0, 180, -60); root.add(ruler);
  const marks = canvasTex(128, 1024, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = C.ink; for (let c = 0; c <= 200; c += 10) { const y = h - c / 200 * h; g.fillRect(0, y - 1, c % 50 ? 18 : 34, 2); if (c % 50 === 0 && c) { g.font = FONT(700, 22); g.fillText(c, 40, y + 8); } } });
  const mk = new THREE.Mesh(new THREE.PlaneGeometry(70, 360), new THREE.MeshBasicMaterial({map: marks, toneMapped: false})); mk.position.set(40, 180, -56.5); root.add(mk);
  const girl = person(0xd6182b, true), boy = person(0x3d8fe0, false); girl.position.x = -120; boy.position.x = 120; root.add(girl, boy);
  girl.userData.pick = 0; boy.userData.pick = 1;
  const SCL = 1.8 / 170 * 0.98; // figure modelled 185 units tall ≈ 170 cm → world: 1 cm = 1.8 units
  const tags = {g: makeTag('', '', true), b: makeTag('', '')};
  const traits = [['乳房发育', '骨盆变宽', '月经初潮'], ['长出胡须', '喉结突出', '声音变低沉']];
  const markAge = (k) => { const pk = k ? 13.5 : 11.5, ok = Math.abs(st.age - pk) < .9; ctx.toast?.(ok ? `${k ? '男' : '女'}生突增期找到了！` : '再找找长得最快的年龄', ok ? '' : 'warn'); if (ok) ctx.done(k); return ok ? `✓ ${k ? '男' : '女'}生在 ${f0(st.age)} 岁左右长得最快，一年约 ${f1(vAt(k ? HB : HG, st.age))} cm。${k ? '男生比女生晚约 2 年进入青春期。' : '女生一般比男生早约 2 年进入青春期。'}` : `✗ 现在 ${f1(st.age)} 岁，每年长 ${f1(vAt(k ? HB : HG, st.age))} cm，还不是最快。看右下角曲线最陡的位置。`; };
  return {
    root, tags, pickables: [girl, boy], title: '青春期 <i>·</i> 发育', spec: '身高突增 · 性器官发育成熟 · 出现第二性征',
    bigUnit: 'cm · 女生身高', bigMin: '110', bigMax: '180', intro: '拖动年龄滑块，看男生和女生的身高怎样变化。找出各自长得最快的年龄，然后点“标记”。',
    fml: '青春期 ≈ 10–20 岁', fmlTag: '主要特点', fmlNote: '身高突增是显著特点；<b>性器官迅速发育、成熟</b>是主要标志。女生比男生早约 2 年。',
    legend: [['女生', C.red], ['男生', C.blue]],
    driver: {name: '年龄 · Age', min: 6, max: 20, step: .1, fmt: (v) => f1(v) + ' 岁', get: () => st.age, set: (v) => { st.age = v; }, scale: () => ['6 岁', '10', '14', '20 岁'],
      track: () => [[6, 10, C.faint], [10, 18, '#eba4ab'], [18, 20, C.faint]]},
    extra: (el) => {
      el.innerHTML = `<div class="grp" style="margin-top:9px"><span class="cp mu">标记身高突增期 Mark</span><div class="seg"><button class="tb red" type="button" id="mG">标记：女生最快</button><button class="tb" type="button" id="mB">标记：男生最快</button></div></div>`;
      el.querySelector('#mG').onclick = () => { document.getElementById('caption').textContent = markAge(0); };
      el.querySelector('#mB').onclick = () => { document.getElementById('caption').textContent = markAge(1); };
    },
    views: [['全景', [0, 330, 980], [0, 170, 0]], ['女生', [-150, 260, 420], [-120, 200, 0]], ['男生', [150, 260, 420], [120, 200, 0]]], get home() { return this.views[0]; },
    missions: [
      {t: '找出女生身高增长最快的年龄并标记', k: '身高突增是青春期显著特点'},
      {t: '找出男生身高增长最快的年龄并标记', k: '男生比女生晚约 2 年'},
      {t: '把年龄拖到 14 岁以后，点击人物看第二性征', k: '第二性征'},
    ],
    pick(k) { if (k === null || k === undefined) return null; const pk = k ? 13.5 : 11.5; if (st.age < pk - 1) return `${k ? '男' : '女'}生还没进入青春期，第二性征还没出现。把年龄往后拖。`; if (st.age >= 14) ctx.done(2); return `${k ? '男' : '女'}生第二性征：<b>${traits[k].join('、')}</b>。由${k ? '睾丸分泌的雄性激素' : '卵巢分泌的雌性激素'}引起。`; },
    update(dt, anim) {
      st.t += anim;
      [[girl, HG, 0], [boy, HB, 1]].forEach(([p, H, k]) => { const h = hAt(H, st.age); p.scale.setScalar(h * SCL * 1.8 / 1.85 / 1.8 * 1.0); p.scale.setScalar(h / 185 * 1.8); p.rotation.y = Math.sin(st.t * .6 + k) * .15; const pk = k ? 13.5 : 11.5; p.userData.parts.torso.scale.x = k && st.age > pk ? 1 + clamp((st.age - pk) / 4, 0, 1) * .18 : 1; });
      const hg = hAt(HG, st.age), hb = hAt(HB, st.age);
      tags.g.p.set(-120, hg * 1.8 + 16, 0); tags.g.set(`女生 ${f0(hg)} cm`, st.age >= 10.5 ? traits[0].slice(0, Math.min(3, Math.floor(st.age - 9.5))).join(' · ') : '');
      tags.b.p.set(120, hb * 1.8 + 16, 0); tags.b.set(`男生 ${f0(hb)} cm`, st.age >= 12.5 ? traits[1].slice(0, Math.min(3, Math.floor(st.age - 11.5))).join(' · ') : '');
    },
    panel() {
      const hg = hAt(HG, st.age), hb = hAt(HB, st.age), vg = vAt(HG, st.age), vb = vAt(HB, st.age);
      const ph = (a, pk) => a < pk - 2 ? '童年期' : a < pk + 3.5 ? '青春期' : '成年早期';
      return {big: f0(hg), bigFrac: (hg - 110) / 70, bigSub: `男生 ${f0(hb)} cm · ${f1(st.age)} 岁`,
        stName: '发育阶段', stAng: `${f1(st.age)} 岁`, stBig: `女 ${ph(st.age, 11.5)} · 男 ${ph(st.age, 13.5)}`, stRed: st.age > 9.5 && st.age < 17,
        rows: [['女生 每年长高', vg > 6, f1(vg) + ' cm'], ['男生 每年长高', vb > 6, f1(vb) + ' cm'], ['女生 第二性征', st.age >= 10.5, st.age >= 10.5 ? '出现' : '—'], ['男生 第二性征', st.age >= 12.5, st.age >= 12.5 ? '出现' : '—']],
        num: f1(Math.max(vg, vb)), unit: 'cm/年 · 生长速度<small>突增期可达 8 cm 以上</small>', frac: Math.max(vg, vb) / 10,
        calc: `生长速度 = 一年长高的 cm 数<br>女生 ${f1(vg)} cm/年 · 男生 ${f1(vb)} cm/年`, calcT: '速度对比',
        chart: {t: '身高–年龄', u: '女 红 · 男 蓝', x0: 6, x1: 20, y0: 110, y1: 180, xl: '年龄 / 岁', yl: 'h / cm', paths: [{pts: curve((a) => hAt(HG, a), 6, 20), c: C.red}, {pts: curve((a) => hAt(HB, a), 6, 20), c: C.blue}], vl: [[11.5, '11.5'], [13.5, '13.5']], pt: [st.age, hg]}};
    },
    reset() { return 8; },
    tour: [{d: 11.5, dTime: 5, view: 0, cap: '10 岁以后女生先进入青春期，身高突增，一年能长 7–8 cm，比同龄男生还高。', dur: 7},
      {d: 14, dTime: 4, view: 0, cap: '男生大约晚 2 年进入青春期，突增期更猛，很快反超女生。', dur: 7},
      {d: 18, dTime: 4, view: 0, cap: '青春期后期身高增长逐渐停止。性器官发育成熟是青春期的主要标志。', dur: 7}],
    quiz: {0: {d: 15, dTime: 3, view: 2, cap: '验证：男生第二性征是长胡须、喉结突出、声音变低沉。'}, 3: {d: 14, dTime: 3, view: 0, cap: '验证：青春期身高、体重迅速增长，但神经系统并不是这时才“完全发育成熟”。'}},
  };
}

/* ----------------------------------------------------------------- 323 动植物的生殖方式 */
const REPRO = [
  ['用小麦种子繁殖', 0, '种子由受精卵发育的胚形成', '种子里有胚'], ['鸟类产卵孵化', 0, '精卵结合后形成受精卵'], ['青蛙抱对产卵', 0, '体外受精，仍是有性生殖'], ['蝴蝶 卵→幼虫→蛹→成虫', 0, '完全变态发育，属于有性生殖'], ['试管婴儿', 0, '体外受精，仍有精卵结合'], ['桃花传粉结果', 0, '传粉、受精后形成果实和种子'],
  ['月季扦插', 1, '营养繁殖：用枝条繁殖', '剪一段枝条插进土里'], ['马铃薯块茎繁殖', 1, '营养繁殖：用块茎繁殖'], ['苹果嫁接', 1, '关键：接穗和砧木的形成层紧密结合'], ['草莓匍匐茎繁殖', 1, '营养繁殖：用茎繁殖'], ['克隆羊多莉', 1, '没有精卵结合'], ['植物组织培养', 1, '利用细胞全能性，无性生殖'],
];
function b323(ctx) {
  return makeSorter(ctx, {
    items: REPRO, bins: ['有性生殖', '无性生殖'], ask: '有没有两性生殖细胞结合？', cardTag: '繁殖卡片',
    title: '生殖 <i>·</i> 方式', spec: '有无两性生殖细胞结合 · 种子繁殖与营养繁殖',
    intro: '判断每种繁殖方式是有性生殖还是无性生殖。关键看有没有精子和卵细胞（两性生殖细胞）结合成受精卵。',
    fml: '有性生殖 ⇔ 精卵结合 → 受精卵', fmlTag: '判断依据', fmlNote: '用<b>种子</b>繁殖是有性生殖；扦插、嫁接、压条、块茎等<b>营养繁殖</b>是无性生殖，能保持亲本的优良性状。',
    onRight: (st) => { if (st.hits.has('苹果嫁接')) ctx.done(1); if (st.hits.has('用小麦种子繁殖') && st.hits.has('马铃薯块茎繁殖')) ctx.done(0); },
    missions: (st, items) => [{t: '分对“种子繁殖”和“块茎繁殖”', k: '种子繁殖是有性生殖'}, {t: '分对嫁接，记住成活关键', k: '嫁接：形成层紧密结合'}, {t: '12 张全部完成', k: '有性生殖与无性生殖', check: () => st.i >= items.length}],
  });
}

/* ----------------------------------------------------------------- 324 细菌与真菌的繁殖 */
function b324(ctx) {
  const root = G(), st = {tm: 0, mode: 0, t: 0, seen: new Set([0])};
  root.add(bench(1300, 760));
  const dish = G(); dish.position.set(-180, 0, 0); root.add(dish);
  const DR = 270;
  dish.add(mesh(new THREE.CylinderGeometry(DR + 8, DR + 8, 30, 64, 1, true), MAT.glass(.25), false));
  dish.children[0].position.y = 15;
  const agar = cyl(DR, DR, 10, MAT.col(0xf3e2a6, {transparent: true, opacity: .85}), 64); agar.position.y = 5; dish.add(agar);
  const MAXN = 1024;
  const bact = new THREE.InstancedMesh(new THREE.CapsuleGeometry(2.6, 5, 3, 8), MAT.col(0x2f9e6a), MAXN); bact.position.y = 12; dish.add(bact);
  const dummy = new THREE.Object3D(), angs = Array.from({length: MAXN}, () => rand() * TAU);
  // magnified single-cell models
  const mag = G(); mag.position.set(330, 0, 0); root.add(mag);
  const lensRing = mesh(new THREE.TorusGeometry(150, 6, 12, 64), MAT.dark()); lensRing.position.y = 200; mag.add(lensRing);
  const lensBg = mesh(new THREE.CircleGeometry(146, 64), MAT.col(0xf7f8f6, {transparent: true, opacity: .9}), false); lensBg.position.set(0, 200, -6); mag.add(lensBg);
  const bA = mesh(new THREE.CapsuleGeometry(20, 40, 6, 16), MAT.col(0x2f9e6a)), bB = bA.clone(); bA.rotation.z = bB.rotation.z = Math.PI / 2; mag.add(bA, bB);
  const yA = sph(42, MAT.col(0xe8d7a8)), yB = sph(1, MAT.col(0xe8d7a8)); mag.add(yA, yB);
  const cap = mesh(new THREE.SphereGeometry(70, 32, 16, 0, TAU, 0, Math.PI / 2), MAT.col(0xb7764a)); cap.scale.y = .55; const stem = cyl(16, 20, 90, MAT.col(0xf1e6d0)); const gill = mesh(new THREE.CircleGeometry(70, 32), MAT.col(0x6b4a33), false); gill.rotation.x = Math.PI / 2;
  const shroom = G(); shroom.add(cap, stem, gill); cap.position.y = 90; gill.position.y = 89.5; stem.position.y = 45; shroom.position.y = 120; mag.add(shroom);
  const spores = new THREE.InstancedMesh(new THREE.SphereGeometry(2.2, 6, 4), MAT.col(0x6b4a33), 120); mag.add(spores); const sp = Array.from({length: 120}, () => ({o: rand(), a: rand() * TAU, r: rand() * 60}));
  const tags = {dish: makeTag('培养皿', 'Petri dish'), mag: makeTag('', '', true)};
  const gen = () => Math.floor(st.tm / 20), N = () => 2 ** gen();
  const MODES = [['细菌 · 分裂生殖', '一个细菌分裂成两个，约 20 分钟一次'], ['酵母菌 · 出芽生殖', '母细胞上长出芽体，长大后脱落'], ['蘑菇 · 孢子生殖', '菌褶里散出大量孢子，落到合适环境萌发']];
  return {
    root, tags, title: '细菌 <i>·</i> 真菌的繁殖', spec: '细菌：分裂生殖 · 酵母菌：出芽生殖 · 霉菌 / 蘑菇：孢子生殖',
    bigUnit: '个 · 细菌数量', bigMin: '1', bigMax: '1024', intro: '拖动时间滑块：一个细菌每 20 分钟分裂一次，数量怎样增长？右边放大镜可以切换三种生物的繁殖方式。',
    fml: 'N = 2ⁿ', fmlTag: '分裂生殖', fmlNote: 'n 为分裂次数。细菌是<b>原核生物</b>（没有成形的细胞核），条件适宜时繁殖极快。',
    legend: [['细菌', C.green], ['酵母菌', '#c9b27a'], ['孢子', '#6b4a33']],
    driver: {name: '时间 t · Time', min: 0, max: 200, step: 1, fmt: (v) => f0(v) + ' min', get: () => st.tm, set: (v) => { st.tm = v; }, scale: () => ['0', '1 h', '2 h', '200 min'],
      track: () => [[0, 200, C.green]]},
    extra: (el) => {
      el.innerHTML = `<div class="grp" style="margin-top:9px"><span class="cp mu">放大镜 Magnify</span><div class="seg" id="segMo">${MODES.map((m, i) => `<button class="tb" data-v="${i}" type="button">${m[0].split(' · ')[0]}</button>`).join('')}</div></div>`;
      el.querySelectorAll('#segMo .tb').forEach((b) => b.onclick = () => { st.mode = +b.dataset.v; st.seen.add(st.mode); window.pressSeg('segMo', st.mode); document.getElementById('caption').textContent = MODES[st.mode].join('：'); if (st.seen.size >= 3) ctx.done(2); });
      window.pressSeg('segMo', st.mode);
    },
    views: [['全景', [0, 760, 1300], [60, 80, 0]], ['培养皿', [-180, 620, 420], [-180, 0, 0]], ['放大镜', [330, 260, 560], [330, 200, 0]]], get home() { return this.views[0]; },
    missions: [
      {t: '让细菌分裂 3 次，数一数有几个', k: '分裂生殖：1→2→4→8', check: () => gen() >= 3},
      {t: '推到 2 小时，验证 2⁶ = 64', k: '细菌繁殖速度快', check: () => st.tm >= 120},
      {t: '用放大镜看完三种生物的繁殖方式', k: '分裂、出芽、孢子生殖'},
    ],
    update(dt, anim) {
      st.t += anim;
      const n = Math.min(MAXN, N()), ph = (st.tm % 20) / 20;
      for (let i = 0; i < MAXN; i++) {
        if (i >= n) { dummy.scale.setScalar(0); } else {
          const r = 9 * Math.sqrt(i + .5), a = i * 2.39996; dummy.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); dummy.rotation.set(Math.PI / 2, 0, angs[i]); dummy.scale.set(1, 1 + ph * .7, 1);
        }
        dummy.updateMatrix(); bact.setMatrixAt(i, dummy.matrix);
      }
      bact.instanceMatrix.needsUpdate = true;
      // magnified loop
      const L = (st.t * .35) % 1;
      [bA, bB].forEach((b) => b.visible = st.mode === 0); [yA, yB].forEach((b) => b.visible = st.mode === 1); shroom.visible = st.mode === 2; spores.visible = st.mode === 2;
      if (st.mode === 0) { const s = L < .5 ? L * 2 : 1; bA.position.set(-s * 46, 200, 0); bB.position.set(s * 46, 200, 0); bA.scale.set(1, 1 - s * .25 + (L < .5 ? s * .4 : 0), 1); bB.scale.copy(bA.scale); bB.visible = L > .1; }
      if (st.mode === 1) { yA.position.set(-10, 195, 0); const s = clamp(L * 1.4, 0, 1); yB.scale.setScalar(6 + s * 22); yB.position.set(-10 + 42 + s * 22 + (L > .85 ? (L - .85) * 200 : 0), 195 + 28 + s * 6, 0); }
      if (st.mode === 2) { sp.forEach((p, i) => { const k = (p.o + st.t * .2) % 1; dummy.position.set(Math.cos(p.a) * p.r, 208 - k * 150, Math.sin(p.a) * p.r * .4 + 20); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); spores.setMatrixAt(i, dummy.matrix); }); spores.instanceMatrix.needsUpdate = true; shroom.position.y = 0; shroom.scale.setScalar(1); shroom.position.set(0, 140, 0); cap.position.y = 90; }
      tags.dish.p.set(-180, 40, DR); tags.dish.below = true;
      tags.mag.p.set(330, 365, 0); tags.mag.set(MODES[st.mode][0], '放大模型');
    },
    panel() {
      const n = N(), g = gen();
      return {big: f0(n), bigFrac: Math.log2(n) / 10, bigSub: `已分裂 ${g} 次 · ${f0(st.tm)} 分钟`,
        stName: '繁殖方式', stAng: '放大镜', stBig: MODES[st.mode][0].split(' · ')[1], stRed: true,
        rows: MODES.map((m, i) => [m[0], i === st.mode, st.seen.has(i) ? '看过' : '']),
        num: String(g), unit: '分裂次数 n<small>每 20 分钟一次</small>', frac: g / 10,
        calc: `n = ${f0(st.tm)} ÷ 20 = ${g}<br>N = 2<sup>${g}</sup> = <b>${n}</b> 个`,
        chart: {t: '数量–时间', u: '指数增长', x0: 0, x1: 200, y0: 0, y1: 1024, xl: 't / min', yl: 'N / 个', path: curve((t) => 2 ** Math.floor(t / 20), 0, 200, 200), pt: [st.tm, n]}};
    },
    reset() { st.seen = new Set([st.mode]); return 0; },
    tour: [{d: 60, dTime: 6, view: 1, cap: '细菌靠分裂生殖：每 20 分钟一分为二，1 → 2 → 4 → 8。', dur: 7}, {d: 200, dTime: 6, view: 0, cap: '3 个多小时就超过 1000 个 —— 这就是食物容易变质的原因。', dur: 7}],
    quiz: {0: {d: 80, dTime: 4, view: 1, cap: '验证：细菌一分为二，是分裂生殖。'}, 1: {view: 2, run: () => { st.mode = 2; st.seen.add(2); window.pressSeg('segMo', 2); }, cap: '验证：蘑菇菌褶散出孢子，是孢子生殖。'}, 3: {d: 40, dTime: 3, view: 2, run: () => { st.mode = 0; window.pressSeg('segMo', 0); }, cap: '验证：细菌主要靠分裂生殖。'}},
  };
}

/* ----------------------------------------------------------------- 325 衰老与死亡、健康 */
const AGING = [
  ['头发变白', 0, '衰老现象', '老年'], ['皮肤出现皱纹', 0, '衰老现象'], ['骨质疏松', 0, '衰老现象'], ['老花眼', 0, '晶状体弹性变差'],
  ['身高迅速增长', 1, '青春期生长发育'], ['长出喉结', 1, '青春期第二性征'], ['体重增加', 1, '生长发育'],
  ['合理膳食', 2, '健康的生活方式能延缓衰老'], ['适量运动', 2, '健康的生活方式'], ['不吸烟不酗酒', 2, '健康的生活方式'], ['保持心情愉快', 2, '心理健康'], ['和同学友好相处', 2, '社会适应良好也是健康'],
];
function b325(ctx) {
  return makeSorter(ctx, {
    items: AGING, bins: ['衰老现象', '生长发育', '健康生活'], ask: '属于哪一类？', cardTag: '生命卡片',
    title: '衰老 <i>·</i> 与健康', spec: '衰老是生命的必然阶段 · 现代以脑死亡为死亡标准',
    intro: '把每张卡片分到“衰老现象”“生长发育”或“健康生活”。健康包括身体、心理和社会适应三方面。',
    fml: '健康 = 身体 + 心理 + 社会适应', fmlTag: '健康的含义', fmlNote: '衰老是机体功能逐渐衰退的过程，健康的生活方式能延缓衰老。现代医学以<b>脑死亡</b>作为判断死亡的标准。',
    onRight: (st) => { if (st.kinds[0] >= 3) ctx.done(0); if (st.hits.has('和同学友好相处')) ctx.done(1); },
    missions: (st, items) => [{t: '分对 3 个衰老现象', k: '衰老现象'}, {t: '认出“和同学友好相处”也属于健康', k: '健康包括社会适应'}, {t: '12 张全部完成', k: '衰老、发育与健康', check: () => st.i >= items.length}],
  });
}

export const C5 = {321: {n: 3, build: b321}, 322: {n: 3, build: b322}, 323: {n: 3, build: b323}, 324: {n: 3, build: b324}, 325: {n: 3, build: b325}};
