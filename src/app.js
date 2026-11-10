import * as THREE from 'three';
import {$, C, clamp, ease, coarse, reduce, renderer, scene, camera, controls, canvas, stageEl, ground, chartSvg} from './kit.js';
import KPS from './kp.json';
import {SCENES} from './scenes/index.js';

/* =====================================================================
   七年级科学 3D 实验室 —— 站点外壳：考试范围 → 知识地图 → 3D 实验 → 任务 / 真题 / 冲刺
   ===================================================================== */
const KP = Object.fromEntries(KPS.map((k) => [k.id, k]));
const GLYPH = {301: '科学', 302: '仪器', 303: '探究', 304: '长度', 305: '质量', 306: '生命', 307: '细胞', 308: '脊椎', 309: '无脊', 310: '地球', 311: '经纬', 312: '地形', 313: '火山', 314: '岩石', 315: '分子', 316: '密度', 317: '物态', 318: '性质',
  321: '诞生', 322: '青春', 323: '生殖', 324: '菌类', 325: '衰老', 326: '感官', 327: '声源', 328: '声音', 329: '耳朵', 330: '反射', 331: '折射', 332: '透镜', 333: '眼睛', 334: '参照', 335: '速度', 336: '重力', 337: '惯性', 338: '摩擦'};
const CHAPTERS = [...new Set(KPS.map((k) => k.ch))];
const chNo = (ch) => ch.split(' ')[0];
const EXAMS = [
  {k: 'a-mid', n: '七上期中', ch: ['七上·第1章', '七上·第2章']},
  {k: 'a-end', n: '七上期末', ch: ['七上·第1章', '七上·第2章', '七上·第3章', '七上·第4章']},
  {k: 'b-mid', n: '七下期中', ch: ['七下·第1章', '七下·第2章']},
  {k: 'b-end', n: '七下期末', ch: ['七下·第1章', '七下·第2章', '七下·第3章']},
  {k: 'all', n: '全年', ch: CHAPTERS.map(chNo)},
];
const inExam = (kp, ex) => ex.ch.includes(chNo(kp.ch));

/* ---------------------------------------------------------------- progress store (this browser only) */
const KEY = 'g7sci.v1';
const DEF = () => ({xp: 0, mis: {}, quiz: {}, badges: {}, exam: 'a-mid', streak: {day: '', n: 0}, sprint: {}, seen: {}});
let P = DEF();
try { const raw = localStorage.getItem(KEY); if (raw) P = Object.assign(DEF(), JSON.parse(raw)); } catch (e) { /* storage unavailable */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* ignore */ } };
{ // daily streak
  const d = new Date(), today = d.toISOString().slice(0, 10), y = new Date(d - 864e5).toISOString().slice(0, 10);
  if (P.streak.day !== today) { P.streak.n = P.streak.day === y ? P.streak.n + 1 : 1; P.streak.day = today; save(); }
}
const LEVELS = [[0, '科学新手'], [100, '见习观察员'], [250, '实验学徒'], [450, '测量能手'], [700, '探究小将'], [1000, '实验达人'], [1400, '科学探险家'], [1900, '小研究员'], [2500, '首席科学家'], [3300, '科学大师']];
const level = (xp) => { let i = 0; while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1][0]) i++; return i; };
function misCount(id) { const s = SCENES[id]; return s ? s.n : 0; }
function stars(id) {
  const m = P.mis[id] || [], n = misCount(id), q = P.quiz[id] || {}, total = (KP[id].q || []).length;
  const right = Object.values(q).filter((v) => v === 1).length;
  const s1 = n > 0 && m.filter(Boolean).length >= n;
  const s2 = total > 0 && right >= Math.ceil(total * .75);
  const s3 = s1 && right === total;
  return (s1 ? 1 : 0) + (s2 ? 1 : 0) + (s3 ? 1 : 0);
}
const totalStars = () => KPS.reduce((a, k) => a + stars(k.id), 0);
const BADGES = [
  ['first', '首', '第一次实验', () => Object.values(P.mis).some((a) => a.some(Boolean))],
  ['q10', '10', '答对 10 题', () => Object.values(P.quiz).reduce((a, q) => a + Object.values(q).filter((v) => v === 1).length, 0) >= 10],
  ['optics', '光', '光学达人', () => [330, 331, 332, 333].every((i) => stars(i) >= 1)],
  ['sound', '声', '声音侦探', () => [327, 328, 329].every((i) => stars(i) >= 1)],
  ['earth', '地', '地球探险', () => [310, 311, 312, 313, 314].every((i) => stars(i) >= 1)],
  ['life', '生', '生命观察', () => [306, 307, 308, 309].every((i) => stars(i) >= 1)],
  ['force', '力', '力学小将', () => [334, 335, 336, 337, 338].every((i) => stars(i) >= 1)],
  ['sprint', '满', '冲刺满分', () => Object.values(P.sprint).some((v) => v >= 10)],
  ['streak', '3', '连续 3 天', () => P.streak.n >= 3],
  ['a', '上', '七上通关', () => KPS.filter((k) => k.ch.startsWith('七上')).every((k) => stars(k.id) >= 2)],
];
let lastLv = level(P.xp);
function gain(xp, why) {
  P.xp += xp; save(); toast(`<b>+${xp} XP</b> ${why}`);
  const lv = level(P.xp); if (lv > lastLv) { lastLv = lv; setTimeout(() => { toast(`升级！Lv.${lv + 1} <b>${LEVELS[lv][1]}</b>`); burst(60); }, 600); }
  checkBadges(); renderHeader();
}
function checkBadges() {
  for (const [k, g, n, f] of BADGES) if (!P.badges[k] && f()) { P.badges[k] = Date.now(); save(); setTimeout(() => { toast(`获得徽章 <b>${n}</b>`); burst(40); }, 900); }
}
let starCache = {};
function checkStars(id) {
  const s = stars(id), was = starCache[id] ?? s; starCache[id] = s;
  if (s > was) { setTimeout(() => { toast(`<b>${'★'.repeat(s)}</b> ${KP[id].t}`); burst(30); }, 300); P.xp += 30 * (s - was); save(); }
}

/* ---------------------------------------------------------------- toast + confetti */
function toast(html) {
  const el = document.createElement('div'); el.className = 'tst'; el.innerHTML = html; $('toast').appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
const fx = $('fx'), fxg = fx.getContext('2d'); let parts = [];
function burst(n) {
  if (reduce) return;
  fx.width = innerWidth; fx.height = innerHeight;
  for (let i = 0; i < n; i++) parts.push({x: innerWidth / 2, y: 90, vx: (Math.random() - .5) * 9, vy: Math.random() * -5 - 1, r: 3 + Math.random() * 4, c: [C.red, C.ink, '#f0b9be', '#c9ccd0'][i % 4], a: Math.random() * 6, l: 1});
}
function tickFx(dt) {
  if (!parts.length) return;
  fxg.clearRect(0, 0, fx.width, fx.height);
  parts = parts.filter((p) => p.l > 0);
  for (const p of parts) { p.vy += 14 * dt; p.x += p.vx * 60 * dt; p.y += p.vy * 60 * dt; p.a += dt * 8; p.l -= dt * .6; fxg.globalAlpha = Math.max(0, p.l); fxg.fillStyle = p.c; fxg.save(); fxg.translate(p.x, p.y); fxg.rotate(p.a); fxg.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); fxg.restore(); }
  if (!parts.length) fxg.clearRect(0, 0, fx.width, fx.height);
}

/* ---------------------------------------------------------------- header */
function renderHeader() {
  const lv = level(P.xp), lo = LEVELS[lv][0], hi = LEVELS[lv + 1]?.[0] ?? lo + 1000;
  $('pLv').textContent = lv + 1; $('pName').textContent = LEVELS[lv][1];
  $('pXp').style.width = clamp((P.xp - lo) / (hi - lo), 0, 1) * 100 + '%'; $('pXpTxt').textContent = `${P.xp} / ${hi} XP`;
  $('pStars').textContent = totalStars(); $('pStreak').textContent = `连续 ${P.streak.n} 天`;
}

/* ---------------------------------------------------------------- home */
const exam = () => EXAMS.find((e) => e.k === P.exam) || EXAMS[0];
function nextKp() {
  const list = KPS.filter((k) => inExam(k, exam()));
  return list.find((k) => stars(k.id) === 0) || list.find((k) => stars(k.id) < 3) || list[0];
}
function renderHome() {
  const ex = exam(), list = KPS.filter((k) => inExam(k, ex));
  const got = list.reduce((a, k) => a + stars(k.id), 0), max = list.length * 3, pct = max ? Math.round(got / max * 100) : 0;
  $('heroT').innerHTML = `${ex.n} <i>·</i> ${list.length} 个知识点`;
  $('heroP').textContent = `每个知识点都是一个可以动手的 3D 实验。完成考点任务得 1 星，真题答对 3/4 得 2 星，全部答对得 3 星。`;
  $('exams').innerHTML = EXAMS.map((e) => `<button class="tb" type="button" data-k="${e.k}" aria-pressed="${e.k === ex.k}">${e.n}</button>`).join('');
  $('exams').querySelectorAll('.tb').forEach((b) => b.onclick = () => { P.exam = b.dataset.k; save(); renderHome(); });
  $('ringArc').setAttribute('stroke-dasharray', `${pct} 100`); $('ringTxt').textContent = pct + '%';
  const mDone = list.reduce((a, k) => a + (P.mis[k.id] || []).filter(Boolean).length, 0), mAll = list.reduce((a, k) => a + misCount(k.id), 0);
  const qRight = list.reduce((a, k) => a + Object.values(P.quiz[k.id] || {}).filter((v) => v === 1).length, 0), qAll = list.reduce((a, k) => a + k.q.length, 0);
  $('rstats').innerHTML = `<span>星星 <b>${got} / ${max}</b></span><span>考点任务 <b>${mDone} / ${mAll}</b></span><span>真题答对 <b>${qRight} / ${qAll}</b></span>${P.sprint[ex.k] !== undefined ? `<span>冲刺最佳 <b>${P.sprint[ex.k]} / 10</b></span>` : ''}`;
  const nk = nextKp(); $('goNext').innerHTML = `继续学习 <small>${nk.t}</small>`; $('goNext').onclick = () => go('kp-' + nk.id);
  $('badges').innerHTML = BADGES.map(([k, g, n]) => `<div class="bdg${P.badges[k] ? ' on' : ''}" title="${n}"><b>${g}</b><span>${n}</span></div>`).join('');
  $('map').innerHTML = CHAPTERS.map((ch) => {
    const ks = KPS.filter((k) => k.ch === ch), on = ex.ch.includes(chNo(ch));
    if (!on && ex.k !== 'all') return '';
    const s = ks.reduce((a, k) => a + stars(k.id), 0);
    return `<section class="chap"><div class="chapH"><span class="cp">${chNo(ch)}</span><h3>${ch.split(' ').slice(1).join(' ')}</h3><span class="bar2"><i style="width:${s / (ks.length * 3) * 100}%"></i></span><span class="cp mu">★ ${s} / ${ks.length * 3}</span></div>
      <div class="tiles">${ks.map((k) => { const st = stars(k.id), sc = SCENES[k.id]; return `<button class="tile${st === 3 ? ' done' : ''}" type="button" data-id="${k.id}">
        <span class="no">#${k.id}</span>${!P.seen[k.id] ? '<span class="new">NEW</span>' : ''}<span class="gl">${GLYPH[k.id] || ''}</span><span class="tt">${k.t}</span>
        <span class="ft"><span class="stars">${[0, 1, 2].map((i) => `<span class="${i < st ? 'on' : ''}">★</span>`).join('')}</span><span class="kd">${sc ? sc.n + ' 个考点任务' : ''}</span></span></button>`; }).join('')}</div></section>`;
  }).join('');
  $('map').querySelectorAll('.tile').forEach((t) => t.onclick = () => go('kp-' + t.dataset.id));
  $('midbar').innerHTML = '';
  renderHeader();
}
$('goSprint').onclick = () => startSprint();
$('brand').onclick = () => go('home');
$('player').onclick = () => go('home');

/* ---------------------------------------------------------------- lab */
let cur = null, curId = 0;
const S = {paused: false, tw: null, qi: 0};
function pressSeg(id, v) { document.querySelectorAll('#' + id + ' .tb').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === String(v)))); }
window.pressSeg = pressSeg;
function setDriver(v) {
  const d = cur?.driver; if (!d) return; d.set(clamp(v, d.min, d.max));
  $('sD').value = d.get(); $('dVal').textContent = d.fmt(d.get());
}
function drawTrack() {
  const d = cur.driver; if (!d) return; const el = $('dTrack'), span = d.max - d.min;
  el.innerHTML = (d.track ? d.track() : []).map(([a, b, c]) => `<i style="left:${(a - d.min) / span * 100}%;width:${(b - a) / span * 100}%;background:${c}"></i>`).join('');
  $('dScale').innerHTML = d.scale().map((t) => `<span class="cp mu">${t}</span>`).join('');
}
function disposeScene(sc) {
  scene.remove(sc.root);
  sc.root.traverse((o) => { o.geometry?.dispose?.(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => { x.map?.dispose?.(); x.dispose(); }); });
  for (const t of Object.values(sc.tags || {})) t.el.remove();
  sc.dispose?.();
}
function enterLab(id) {
  const reg = SCENES[id]; if (!reg) return go('home');
  if (cur) disposeScene(cur);
  curId = id; P.seen[id] = 1; save();
  const ctx = {done: (i) => completeMission(i), refresh: () => drawTrack(), setDriver, toast, burst, gain};
  cur = reg.build(ctx); scene.add(cur.root);
  starCache[id] = stars(id);
  S.tw = null; S.qi = 0; S.paused = false; $('bPause').innerHTML = '❚❚ 暂停';
  const kp = KP[id];
  $('title').innerHTML = cur.title; $('spec').innerHTML = cur.spec || kp.s;
  $('bigUnit').textContent = cur.bigUnit || ''; $('bigMin').textContent = cur.bigMin ?? ''; $('bigMax').textContent = cur.bigMax ?? '';
  $('pnFml').hidden = !cur.fml; $('fml').innerHTML = cur.fml || ''; $('fmlTag').textContent = cur.fmlTag || ''; $('fmlNote').innerHTML = cur.fmlNote || '';
  $('legend').innerHTML = (cur.legend || []).map(([n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join('');
  $('drv').style.visibility = cur.driver ? 'visible' : 'hidden';
  if (cur.driver) { $('dName').textContent = cur.driver.name; const sD = $('sD'); sD.min = cur.driver.min; sD.max = cur.driver.max; sD.step = cur.driver.step; setDriver(cur.driver.get()); drawTrack(); }
  $('hint').textContent = cur.hint || (cur.driver ? '拖动滑块改变条件 · 拖动画面旋转 · 双指缩放' : '点击 3D 模型中的部件 · 拖动画面旋转');
  $('extra').innerHTML = ''; cur.extra?.($('extra'), drawTrack);
  $('tourBtn').hidden = !cur.tour?.length;
  camera.position.copy(fitPos(cur.home)); controls.target.set(...cur.home[2]); controls.update();
  ground.position.y = cur.ground || 0;
  const cams = $('segCam'); cams.innerHTML = '';
  cur.views.forEach((v) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'tb'; b.textContent = v[0]; b.onclick = () => { userTouch(); goView(v); }; cams.appendChild(b); });
  $('caption').textContent = cur.intro || ''; stopTour();
  $('drawer').hidden = true;
  const i = KPS.findIndex((k) => k.id === id), pv = KPS[i - 1], nx = KPS[i + 1];
  $('midbar').innerHTML = `<button class="tb" id="bBack" type="button">‹ 知识地图</button><span class="crumb">${kp.ch}<b>${kp.t}</b></span><span class="kpnav">${pv ? `<button class="tb" type="button" id="bPv" aria-label="上一个知识点">‹ ${GLYPH[pv.id]}</button>` : ''}${nx ? `<button class="tb" type="button" id="bNx" aria-label="下一个知识点">${GLYPH[nx.id]} ›</button>` : ''}</span>`;
  $('bBack').onclick = () => go('home'); if (pv) $('bPv').onclick = () => go('kp-' + pv.id); if (nx) $('bNx').onclick = () => go('kp-' + nx.id);
  renderMissions(); showQuiz(); resize(); refreshPanels();
}
/* missions */
function completeMission(i) {
  const arr = P.mis[curId] ||= []; if (arr[i]) return;
  arr[i] = 1; save(); gain(20, '考点任务完成'); burst(24); renderMissions(); checkStars(curId); checkBadges();
}
function renderMissions() {
  const arr = P.mis[curId] || [];
  $('misN').textContent = `${arr.filter(Boolean).length} / ${cur.missions.length}`;
  $('mis').innerHTML = cur.missions.map((m, i) => `<div class="mi${arr[i] ? ' ok' : ''}"><i>${arr[i] ? '✓' : ''}</i><span>${m.t}<small>考点 · ${m.k}</small></span>${arr[i] ? '' : '<em>+20</em>'}</div>`).join('');
}
function checkMissions() { const arr = P.mis[curId] || []; cur.missions.forEach((m, i) => { if (!arr[i] && m.check && m.check()) completeMission(i); }); }

/* exam questions with tappable options */
function parseChoice(q) {
  const m = q.match(/^(.*?)\s*A[.．、]\s*(.+?)\s*B[.．、]\s*(.+?)\s*C[.．、]\s*(.+?)(?:\s*D[.．、]\s*(.+))?$/s);
  if (!m) return null; return {stem: m[1], opts: [m[2], m[3], m[4], m[5]].filter(Boolean)};
}
function showQuiz() {
  const list = KP[curId].q, i = S.qi, q = list[i], rec = (P.quiz[curId] || {})[i];
  const ch = parseChoice(q.q);
  $('qSrc').textContent = q.src; $('qNo').textContent = `${i + 1}/${list.length}`;
  $('qText').textContent = ch ? ch.stem : q.q;
  $('qA').hidden = rec === undefined; $('qA').innerHTML = `答案：<b>${q.a}</b><br>${q.an}`;
  const go = cur.quiz?.[i]; $('qTry').hidden = !go;
  if (ch) {
    $('qBody').innerHTML = `<div class="opts">${ch.opts.map((o, j) => `<button class="opt" type="button" data-j="${j}"><b>${'ABCD'[j]}</b>${o}</button>`).join('')}</div>`;
    const ans = 'ABCD'.indexOf((q.a.match(/[ABCD]/) || ['A'])[0]);
    const mark = () => $('qBody').querySelectorAll('.opt').forEach((b, j) => { if (j === ans) b.classList.add('right'); });
    if (rec !== undefined) mark();
    $('qBody').querySelectorAll('.opt').forEach((b) => b.onclick = () => {
      if ((P.quiz[curId] || {})[i] !== undefined) return;
      const ok = +b.dataset.j === ans; if (!ok) b.classList.add('wrong'); mark(); answer(i, ok);
    });
  } else {
    $('qBody').innerHTML = rec === undefined ? `<div class="qbar"><button class="tb" type="button" id="qShow">先想一想，再看答案</button></div>` : `<div class="qbar"><span class="cp ${rec === 1 ? '' : 'mu'}" style="color:${rec === 1 ? C.green : C.red}">${rec === 1 ? '✓ 已掌握' : '✗ 再复习一下'}</span></div>`;
    $('qShow') && ($('qShow').onclick = () => {
      $('qA').hidden = false;
      $('qBody').innerHTML = `<div class="qbar"><button class="tb red" type="button" id="qY">我答对了</button><button class="tb" type="button" id="qN">没答对</button></div>`;
      $('qY').onclick = () => answer(i, true); $('qN').onclick = () => answer(i, false);
    });
  }
}
function answer(i, ok) {
  const q = P.quiz[curId] ||= {}; if (q[i] !== undefined) return;
  q[i] = ok ? 1 : 0; save(); $('qA').hidden = false;
  if (ok) { gain(10, '真题答对'); } else toast('没关系，看看解析，再到 3D 模型里验证一下');
  checkStars(curId); checkBadges(); setTimeout(showQuiz, 10);
}
$('qPrev').onclick = () => { const n = KP[curId].q.length; S.qi = (S.qi + n - 1) % n; showQuiz(); };
$('qNext').onclick = () => { S.qi = (S.qi + 1) % KP[curId].q.length; showQuiz(); };
$('qTry').onclick = () => { const g = cur.quiz?.[S.qi]; if (!g) return; userTouch(); applyGo(g); $('caption').textContent = g.cap; };

/* learn drawer: explanation + micro lessons */
$('bLearn').onclick = () => {
  const kp = KP[curId], d = $('drawer');
  if (!d.hidden) { d.hidden = true; return; }
  d.innerHTML = `<button class="tb x" type="button" id="dX">关闭</button><div class="cp mu">${kp.ch}</div><h2>${kp.t}</h2><div class="note" style="font-size:12.5px">${kp.s}</div><div class="ex">${kp.e}</div>
    <div class="cp" style="margin-top:20px">B站微课 Micro lessons</div><div class="mc">${kp.mc.map((m) => m.v ? `<a href="https://www.bilibili.com/video/${m.v}" target="_blank" rel="noopener">${m.t}<span>${m.du} ↗</span></a>` : `<a>${m.t}<span>即将上线</span></a>`).join('')}</div>`;
  d.hidden = false; $('dX').onclick = () => { d.hidden = true; };
};

/* camera + driver tweens, tour */
const camTw = {t: 1, from: null, to: null};
/* stacked (portrait/narrow) layout: the HUD no longer covers the stage sides, so frame tighter */
function fitPos(v) { const p = new THREE.Vector3(...v[1]), t = new THREE.Vector3(...v[2]); return innerWidth <= 900 ? t.clone().add(p.sub(t).multiplyScalar(.66)) : p; }
function goView(v) { camTw.from = {pos: camera.position.clone(), tgt: controls.target.clone()}; camTw.to = {pos: fitPos(v), tgt: new THREE.Vector3(...v[2])}; camTw.t = 0; }
function tickCam(dt) { if (camTw.t >= 1) return; camTw.t = Math.min(1, camTw.t + dt / 1.4); const k = ease(camTw.t); camera.position.lerpVectors(camTw.from.pos, camTw.to.pos, k); controls.target.lerpVectors(camTw.from.tgt, camTw.to.tgt, k); }
function tweenDriver(to, dur = 2, from) { const d = cur.driver; if (!d) return; if (from !== undefined) setDriver(from); S.tw = {from: d.get(), to, t: 0, dur}; }
function tickDriver(dt) {
  if (!S.tw) return; S.tw.t += dt; const k = S.tw.dur > 3 ? clamp(S.tw.t / S.tw.dur, 0, 1) : ease(S.tw.t / S.tw.dur);
  setDriver(S.tw.from + (S.tw.to - S.tw.from) * k); if (S.tw.t >= S.tw.dur) S.tw = null;
}
function applyGo(g) {
  if (g.set && cur.set) { cur.set(g.set); drawTrack(); }
  if (g.d !== undefined) tweenDriver(g.d, g.dTime || 2.2, g.from);
  if (g.view !== undefined) goView(cur.views[g.view]);
  g.run?.();
}
const tour = {on: false, i: -1, t: 0};
function nextStep() { const steps = cur.tour; tour.i = (tour.i + 1) % steps.length; tour.t = 0; const s = steps[tour.i]; applyGo(s); $('caption').textContent = s.cap; }
function startTour() { if (!cur.tour?.length) return; tour.on = true; tour.i = -1; $('tourBtn').classList.add('on'); $('tourBtn').querySelector('span').textContent = '演示中 · 点任意处接管'; nextStep(); }
function stopTour() { if (!tour.on) return; tour.on = false; $('tourBtn').classList.remove('on'); $('tourBtn').querySelector('span').textContent = '演示 Demo'; }
function userTouch() { stopTour(); }
function tickTour(dt) { if (!tour.on) return; tour.t += dt; if (tour.t > cur.tour[tour.i].dur) nextStep(); }
$('tourBtn').onclick = (e) => { e.stopPropagation(); tour.on ? userTouch() : startTour(); };
window.labTour = () => tour;

$('sD').oninput = (e) => { userTouch(); S.tw = null; cur.onDrag?.(); setDriver(+e.target.value); };
$('bPause').onclick = () => { userTouch(); S.paused = !S.paused; $('bPause').innerHTML = S.paused ? '▶ 继续' : '❚❚ 暂停'; };
$('bReset').onclick = () => { userTouch(); const v = cur.reset?.(); drawTrack(); if (v !== undefined) tweenDriver(v, 1.2); goView(cur.home); $('caption').textContent = cur.intro || ''; };
addEventListener('keydown', (e) => { if (e.target.tagName !== 'INPUT') userTouch(); });
canvas.addEventListener('wheel', userTouch, {passive: true});
/* tapping parts in the 3D model */
let down = null;
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
canvas.addEventListener('pointerdown', (e) => { userTouch(); down = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', (e) => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8 || !cur?.pick) return;
  const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(cur.pickables || [], true).find((h) => { if (h.object.material?.clippingPlanes?.some((pl) => pl.distanceToPoint(h.point) < 0)) return false; for (let o = h.object; o; o = o.parent) { if (!o.visible) return false; } return true; });
  let o = hit?.object; while (o && o.userData.pick === undefined) o = o.parent;
  const msg = cur.pick(o ? o.userData.pick : null, hit); if (msg) $('caption').innerHTML = msg;
});

/* panels */
let lastRows = '';
function refreshPanels() {
  if (!cur) return; const p = cur.panel();
  $('big').textContent = p.big; $('bigFill').style.width = clamp(p.bigFrac ?? 0, 0, 1) * 100 + '%'; $('bigSub').innerHTML = p.bigSub || '';
  if (p.bigMaxTxt) $('bigMax').textContent = p.bigMaxTxt;
  $('stName').innerHTML = p.stName || ''; $('stAng').innerHTML = p.stAng || ''; $('stBig').textContent = p.stBig || ''; $('stBig').style.color = p.stRed ? C.red : C.ink;
  const rows = (p.rows || []).map(([t, on, v]) => `<div class="cp${on ? ' on' : ''}"><i></i>${t}${v !== undefined ? `<em>${v}</em>` : ''}</div>`).join('');
  if (rows !== lastRows) { $('stList').innerHTML = rows; lastRows = rows; }
  $('stNum').textContent = p.num ?? ''; $('stUnit').innerHTML = p.unit || ''; $('stFill').style.width = clamp(p.frac ?? 0, 0, 1) * 100 + '%';
  $('pnCalc').hidden = !p.calc; $('calc').innerHTML = p.calc || ''; $('calcT').textContent = p.calcT || '代入计算 Substitute';
  $('pnChart').hidden = !p.chart; if (p.chart) { $('chT').textContent = p.chart.t || ''; $('chU').textContent = p.chart.u || ''; $('chart').innerHTML = chartSvg(p.chart); }
  checkMissions();
}
const tv = new THREE.Vector3();
function placeTags() {
  const r = stageEl.getBoundingClientRect(), wide = r.width > 900, side = wide ? (r.width > 1100 ? 270 : 252) : 6;
  for (const t of Object.values(cur.tags || {})) {
    if (!t.on) { t.el.hidden = true; continue; }
    tv.copy(t.p); cur.root.localToWorld(tv); tv.project(camera);
    const x = (tv.x + 1) / 2 * r.width, y = (1 - tv.y) / 2 * r.height;
    const hide = tv.z > 1 || x < side || x > r.width - side || y < 0 || y > r.height;
    t.el.hidden = hide; if (!hide) { t.el.style.left = x.toFixed(1) + 'px'; t.el.style.top = y.toFixed(1) + 'px'; }
    t.el.classList.toggle('below', !!t.below);
  }
}

/* ---------------------------------------------------------------- sprint: 10 timed questions from the exam range */
const SP = {};
function choicePool(ex) {
  const pool = [];
  for (const k of KPS) if (inExam(k, ex)) k.q.forEach((q, i) => { const c = parseChoice(q.q); if (c) pool.push({kp: k, q, c, ans: 'ABCD'.indexOf((q.a.match(/[ABCD]/) || ['A'])[0])}); });
  return pool;
}
function startSprint() {
  const ex = exam(), pool = choicePool(ex).sort(() => Math.random() - .5);
  Object.assign(SP, {ex, list: pool.slice(0, 10), i: 0, hearts: 3, combo: 0, score: 0, right: 0, t: 0, lim: 20, lock: false});
  $('sprint').hidden = false; spQ();
}
function spQ() {
  if (SP.i >= SP.list.length || SP.hearts <= 0) return spEnd();
  const it = SP.list[SP.i]; SP.t = 0; SP.lock = false;
  $('spBox').innerHTML = `<div class="row"><span class="cp">考前冲刺 · ${SP.ex.n}</span><span class="cp mu">第 ${SP.i + 1} / ${SP.list.length} 题</span><span class="hearts">${[0, 1, 2].map((k) => `<span class="${k < SP.hearts ? '' : 'off'}">♥</span>`).join('')}</span><span class="combo">${SP.combo > 1 ? '连击 ×' + SP.combo : ''}</span><span class="score">${SP.score}</span></div>
    <div class="timer"><i id="spT" style="width:100%"></i></div>
    <div class="q">${it.c.stem}</div>
    <div class="opts">${it.c.opts.map((o, j) => `<button class="opt" type="button" data-j="${j}"><b>${'ABCD'[j]}</b>${o}</button>`).join('')}</div>
    <div class="row"><span class="src">${it.kp.t} · ${it.q.src}</span><span style="margin-left:auto"></span><button class="tb" id="spQuit" type="button">退出</button></div>`;
  $('spBox').querySelectorAll('.opt').forEach((b) => b.onclick = () => spAns(+b.dataset.j));
  $('spQuit').onclick = () => { $('sprint').hidden = true; SP.list = null; };
}
function spAns(j) {
  if (SP.lock) return; SP.lock = true; const it = SP.list[SP.i], ok = j === it.ans;
  $('spBox').querySelectorAll('.opt').forEach((b, k) => { if (k === it.ans) b.classList.add('right'); else if (k === j) b.classList.add('wrong'); });
  if (ok) { SP.combo++; SP.right++; SP.score += 10 + Math.max(0, Math.round((SP.lim - SP.t))) + (SP.combo - 1) * 5; burst(12); }
  else { SP.combo = 0; SP.hearts--; }
  const an = document.createElement('div'); an.className = 'note'; an.style.fontSize = '12.5px'; an.innerHTML = `${ok ? '✓ 正确' : '✗ 答案是 ' + 'ABCD'[it.ans]} · ${it.q.an}`;
  $('spBox').insertBefore(an, $('spBox').lastElementChild);
  setTimeout(() => { SP.i++; spQ(); }, ok ? 1100 : 2600);
}
function spEnd() {
  const xp = SP.right * 5 + Math.round(SP.score / 10);
  P.sprint[SP.ex.k] = Math.max(P.sprint[SP.ex.k] || 0, SP.right); save();
  $('spBox').innerHTML = `<span class="cp">冲刺结束 · ${SP.ex.n}</span><div class="row"><span class="res">${SP.right} / ${SP.list.length}</span><span style="font-size:14px">得分 <b>${SP.score}</b><br>获得 <b style="color:var(--red)">${xp} XP</b></span></div>
    <div class="note" style="font-size:12.5px">${SP.right >= 9 ? '太棒了，可以挑战下一个考试范围！' : SP.right >= 6 ? '不错！错题对应的 3D 实验再做一遍，会记得更牢。' : '先到知识地图里把没拿星的实验做一遍，再来挑战。'}</div>
    <div class="row"><button class="big-btn red" id="spAgain" type="button">再来一次</button><button class="big-btn ghost" id="spBack" type="button">回到地图</button></div>`;
  SP.list = null; gain(xp, '冲刺闯关'); if (SP.right >= 8) burst(70);
  $('spAgain').onclick = () => startSprint(); $('spBack').onclick = () => { $('sprint').hidden = true; renderHome(); };
}
function tickSprint(dt) {
  if (!SP.list || SP.lock || $('sprint').hidden) return; SP.t += dt;
  const f = 1 - SP.t / SP.lim, el = $('spT'); if (el) { el.style.width = clamp(f, 0, 1) * 100 + '%'; el.classList.toggle('hot', f < .3); }
  if (f <= 0) spAns(-1);
}

/* ---------------------------------------------------------------- routing + loop */
function go(h) { if (location.hash !== '#' + h) location.hash = h; else route(); }
function route() {
  const m = location.hash.match(/^#kp-(\d+)$/);
  if (m && SCENES[+m[1]]) { $('vHome').hidden = true; $('vLab').hidden = false; enterLab(+m[1]); }
  else { if (cur) { disposeScene(cur); cur = null; } $('vLab').hidden = true; $('vHome').hidden = false; renderHome(); }
}
addEventListener('hashchange', route);
function resize() {
  const r = stageEl.getBoundingClientRect(); if (!r.width) return;
  renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height;
  camera.fov = camera.aspect < 1.25 ? Math.min(72, 36 * 1.25 / camera.aspect) : 36; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stageEl);
let last = performance.now(), tick = 0;
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  tickFx(dt); tickSprint(dt);
  if (cur && !$('vLab').hidden) {
    tickTour(dt); tickDriver(dt);
    cur.update(dt, S.paused ? 0 : dt);
    if (tick++ % 3 === 0) refreshPanels();
    tickCam(dt); controls.update(); placeTags();
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
route(); requestAnimationFrame(frame);
window.lab = {go, setDriver, applyGo, get cur() { return cur; }, P, startTour};
