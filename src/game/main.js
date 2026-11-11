/* 鉴识社 · game shell. Case flow: title → opening cutscene → case board → evidence tests (each a 3-stage mission with
   数据回放 → 结论验证 → 评级) → finding cutscene → deduction → confrontation and truth cutscene → case report. */
import * as THREE from 'three';
import {$, ease, renderer, scene, camera, controls, stageEl, canvasTex, ground, keyLight, coarse} from '../kit.js';
import {sfx} from './sfx.js';
import {ZONES, LEVELS, ORDER, PARENT_URL} from './levels/index.js';
import {CASE} from './case.js';
import {buildWorld} from './story/world.js';
import {createPost} from './story/post.js';
import {createCut, CAST} from './story/cut.js';
import * as SCRIPT from './story/scripts.js';

const V3 = THREE.Vector3;
controls.enabled = false;
const studioBg = scene.background;

/* ------------------------------------------------------------ save data */
const KEY = 'g7game.v2';
const P = {v: 2, best: {}, cards: {}, plays: {}, sound: true, intro: false};
try { Object.assign(P, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* storage blocked: play without saving */ }
P.story = Object.assign({intro: false, seen: {}, solved: false, best: null}, P.story || {});
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* ignore */ } };
sfx.set(P.sound !== false);

/* ------------------------------------------------------------ scoring */
const HINT_COST = 40, FAIL_COST = 30;
const RANKS = [['S', 900], ['A', 750], ['B', 600], ['C', 0]];
const rankOf = (s) => RANKS.find(([, min]) => s >= min)[0];

/* ------------------------------------------------------------ icons */
const IC = {
  back: '<svg viewBox="0 0 24 24" class="ic ln"><path d="M14.5 5l-7 7 7 7"/></svg>',
  snd: '<svg viewBox="0 0 24 24" class="ic ln"><path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z" fill="currentColor"/><path d="M15.5 9a4.2 4.2 0 010 6M18.2 6.5a8 8 0 010 11"/></svg>',
  mute: '<svg viewBox="0 0 24 24" class="ic ln"><path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
  lock: '<svg viewBox="0 0 24 24" class="ic"><path d="M7 10V8a5 5 0 0110 0v2h1.2c.5 0 .8.4.8.8v9.4c0 .4-.3.8-.8.8H5.8a.8.8 0 01-.8-.8v-9.4c0-.4.4-.8.8-.8zm2.3 0h5.4V8a2.7 2.7 0 00-5.4 0z"/></svg>',
  ok: '<svg viewBox="0 0 24 24" class="ic ln"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  no: '<svg viewBox="0 0 24 24" class="ic ln"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
};
const num = (n) => `<span class="n">${n}</span>`;

/* ------------------------------------------------------------ state */
let mode = 'map';          // title | cut | board | deduce | report | map | brief | play | clearing | fail | explain | quiz | result
let lv = null, meta = null, stageI = 0;
let stats = {time: 0, fails: 0, wrong: 0, hints: 0};
let timer = null, quiz = null, step = 0, hintUsed = false;
const afters = [], sysAfters = [], pins = [];
let W = 1, H = 1, post = null;
const pinsEl = $('pins');

/* ------------------------------------------------------------ camera: fit a frame into the free part of the screen */
const cam = {p0: new V3(), t0: new V3(), p1: new V3(0, 300, 1600), t1: new V3(0, 200, 0), tgt: new V3(0, 200, 0), k: 1, dur: 1, fn: null};
const off = {x: 0, y: 0, tx: 0, ty: 0};
camera.position.copy(cam.p1);
function insets() {
  const port = W / H < 1;
  if (mode === 'explain' || mode === 'quiz') return port ? {t: 64, r: 0, b: Math.round(H * .42), l: 0} : {t: 64, r: Math.min(440, W * .38), b: 0, l: 0};
  return {t: 128, r: 0, b: ($('ctrl').offsetHeight || 0) + 16, l: 0};
}
function fit(fn, dur = .8) {
  if (fn) cam.fn = fn;
  if (!cam.fn) return;
  const spec = typeof cam.fn === 'function' ? cam.fn() : cam.fn, ins = insets();
  const fw = Math.max(.3, (W - ins.l - ins.r) / W), fh = Math.max(.3, (H - ins.t - ins.b) / H);
  const tan = Math.tan(camera.fov * Math.PI / 360), pad = spec.pad || 1.05;
  const d = Math.max(spec.h * pad / (2 * tan * fh), spec.w * pad / (2 * tan * camera.aspect * fw));
  const dir = new V3(...(spec.dir || [0, 0, 1])).normalize();
  cam.p0.copy(camera.position); cam.t0.copy(cam.tgt);
  cam.t1.set(...spec.c); cam.p1.copy(cam.t1).addScaledVector(dir, d);
  cam.dur = dur; cam.k = dur > 0 ? 0 : 1;
  off.tx = (ins.r - ins.l) / 2; off.ty = (ins.b - ins.t) / 2;
  if (dur <= 0) { camera.position.copy(cam.p1); cam.tgt.copy(cam.t1); off.x = off.tx; off.y = off.ty; }
}
function resize() {
  W = stageEl.clientWidth || innerWidth; H = stageEl.clientHeight || innerHeight;
  renderer.setSize(W, H, false);
  if (post) post.setSize(W, H);
  camera.aspect = W / H; camera.fov = W / H < 1 ? 50 : 36;
  $('app').classList.toggle('port', W / H < 1);
  fxc.width = W; fxc.height = H;
  if (lv) fit(null, 0);
}
const rc = new THREE.Raycaster(), ndc = new THREE.Vector2(), zPlane = new THREE.Plane(new V3(0, 0, 1), 0), tmp = new V3();
function plane(e) {
  const r = stageEl.getBoundingClientRect();
  ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  rc.setFromCamera(ndc, camera);
  const hit = new V3(); return rc.ray.intersectPlane(zPlane, hit) ? hit : null;
}
function toScreen(p) { tmp.copy(p).project(camera); return {x: (tmp.x * .5 + .5) * W, y: (-tmp.y * .5 + .5) * H, ok: tmp.z > -1 && tmp.z < 1}; }

/* ------------------------------------------------------------ small UI helpers */
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }
function say(t, cls = '') { const el = $('goal'); el.hidden = !t; if (!t) return; el.className = 'goal ' + cls; el.querySelector('.gl').textContent = cls === 'fb' ? '反馈' : cls === 'hint' ? '提示' : '目标'; $('goalT').innerHTML = t; void el.offsetWidth; el.classList.add('pop'); }
function info(t) { $('hInfo').hidden = !t; if (t) $('hInfo').innerHTML = t; }
function banner(t) { const el = $('banner'); el.hidden = !t; if (!t) return; el.innerHTML = t; el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); }
function sheet(html, cls = '') { const s = $('sheet'); s.className = 'sheet ' + cls; s.innerHTML = html; $('ov').hidden = false; s.scrollTop = 0; return s; }
function closeSheet() { $('ov').hidden = true; $('sheet').innerHTML = ''; }
function sndIcon() { for (const id of ['bSnd', 'mSnd']) $(id).innerHTML = sfx.on ? IC.snd : IC.mute; }
const bgCache = {};
function setBg(cols) {
  if (!cols) { scene.background = studioBg; return; }
  const key = cols.join(); if (bgCache[key]) { scene.background = bgCache[key]; return; }
  scene.background = bgCache[key] = canvasTex(4, 512, (g) => { const gr = g.createLinearGradient(0, 0, 0, 512); cols.forEach((c, i) => gr.addColorStop(i / (cols.length - 1), c)); g.fillStyle = gr; g.fillRect(0, 0, 4, 512); });
}
function pin(html, p, {cls = '', tap = null} = {}) {
  const el = document.createElement(tap ? 'button' : 'div'); el.className = 'pin ' + cls + (tap ? ' tap' : ''); el.innerHTML = html; if (tap) el.type = 'button';
  pinsEl.appendChild(el);
  const o = {el, p: new V3().copy(p), on: true, remove() { el.remove(); const i = pins.indexOf(o); if (i >= 0) pins.splice(i, 1); }};
  if (tap) el.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); if (mode === 'play') tap(o); });
  pins.push(o); return o;
}
function pop(text, p, cls = '') {
  const s = toScreen(p), el = document.createElement('div'); el.className = 'popt ' + cls; el.textContent = text;
  el.style.left = s.x + 'px'; el.style.top = s.y + 'px'; pinsEl.appendChild(el); setTimeout(() => el.remove(), 1300);
}
function shake() { stageEl.classList.remove('shake'); void stageEl.offsetWidth; stageEl.classList.add('shake'); }

/* sparks: short streaks in the HUD colours */
const fxc = $('fx'), fg = fxc.getContext('2d'); let parts = [];
const SPARK = ['#3ee6ff', '#bff6ff', '#ffffff', '#ffb547'];
function burst(n = 40, x = W / 2, y = H * .34) {
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = 160 + Math.random() * 520; parts.push({x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c: SPARK[i % SPARK.length], t: 0, life: .45 + Math.random() * .5}); }
}
function fxTick(dt) {
  if (!parts.length && !fxc.dirty) return;
  fg.clearRect(0, 0, W, H); fxc.dirty = parts.length > 0;
  parts = parts.filter((p) => (p.t += dt) < p.life);
  fg.lineCap = 'round';
  for (const p of parts) {
    p.vx *= 1 - dt * 3; p.vy *= 1 - dt * 3; p.vy += 260 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    fg.globalAlpha = Math.min(1, (p.life - p.t) * 3); fg.strokeStyle = p.c; fg.lineWidth = 2.4;
    fg.beginPath(); fg.moveTo(p.x, p.y); fg.lineTo(p.x - p.vx * .05, p.y - p.vy * .05); fg.stroke();
  }
  fg.globalAlpha = 1;
}

/* ------------------------------------------------------------ what a level can call */
const g = {
  sfx, burst, shake, pin, pop, plane, toScreen, info, toast,
  say: (t) => say(t), feedback: (t) => say(t, 'fb'),
  get portrait() { return W / H < 1; },
  get stats() { return stats; },
  fit: (fn, dur) => fit(fn, dur),
  ctrl(html) { const el = $('ctrl'); el.innerHTML = html || ''; el.hidden = !html; return el; },
  after(sec, fn) { afters.push({t: sec, fn}); },
  timer(sec, onEnd) { timer = {t: sec, onEnd, last: Math.ceil(sec)}; $('hTime').hidden = false; showTime(); },
  stopTimer,
  clear() {
    if (mode !== 'play') return;
    mode = 'clearing'; stopTimer(); sfx.clear(); burst(36); $('bHint').hidden = true;
    const last = stageI === lv.stages.length - 1;
    banner(last ? '任务完成' : `阶段 ${stageI + 1} / ${lv.stages.length} 完成`); renderDots(stageI + 1);
    sysAfters.push({t: 1.5, fn: () => { banner(null); if (last) startExplain(); else beginStage(stageI + 1); }});
  },
  fail(why) {
    if (mode !== 'play') return;
    mode = 'fail'; stats.fails++; stopTimer(); sfx.fail(); shake(); $('bHint').hidden = true;
    sysAfters.push({t: .7, fn: () => sheet(`<div class="fail"><div class="stamp">任务失败</div><p>${why}</p><p class="cost">重试本阶段 · 扣 ${FAIL_COST} 分</p><div class="btns"><button class="btn" type="button" data-act="map">返回案件板</button><button class="btn pri" type="button" data-act="retry">重试</button></div></div>`, 'small')});
  },
};
function stopTimer() { timer = null; $('hTime').hidden = true; $('hTime').classList.remove('hot'); }
function showTime() { const s = Math.max(0, Math.ceil(timer.t)); $('hTime').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; $('hTime').classList.toggle('hot', s <= 10); }

/* ------------------------------------------------------------ mission flow */
function renderDots(done = stageI) {
  $('dots').innerHTML = lv.stages.map((_, i) => `<i class="${i < done ? 'on' : i === stageI && mode === 'play' ? 'cur' : ''}"></i>`).join('');
}
function leaveLevel() {
  if (lv) {
    lv.dispose?.(); scene.remove(lv.root);
    lv.root.traverse((o) => { o.geometry?.dispose?.(); const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => { x.map?.dispose?.(); x.dispose?.(); }); });
  }
  lv = null; afters.length = 0; sysAfters.length = 0; stopTimer();
  pins.length = 0; pinsEl.innerHTML = ''; $('tags').innerHTML = '';
  sfx.bellStop(); sfx.hiss(0);
  $('card').hidden = true; banner(null); closeSheet(); g.ctrl(''); info(null); say(null); setBg(null); $('bHint').hidden = true;
}
const zoneOf = (m) => ZONES.find((z) => z.k === m.zone);
function enterLevel(id) {
  exitWorld(); leaveLevel();
  meta = LEVELS[id]; mode = 'brief'; stageI = 0; stats = {time: 0, fails: 0, wrong: 0, hints: 0};
  $('map').hidden = true; $('hud').hidden = false; stageEl.style.visibility = 'visible';
  $('lvName').textContent = meta.name; $('lvCode').textContent = meta.id;
  lv = meta.build(g); scene.add(lv.root); setBg(lv.bg);
  resize(); renderDots(0);
  g.ctrl(''); say(null); info(null);
  fit(lv.stages[0].frame, 0);
  const zone = zoneOf(meta), best = P.best[id];
  sheet(`<div class="brief" style="--zc:${zone.c}">
    <div class="eyebrow">任务简报 · ${zone.code}-${meta.id} · ${zone.n}</div>
    <h2>${meta.name}</h2>
    ${evOf(id) ? `<div class="evb"><em>物证 ${evOf(id).k} · ${evOf(id).name}</em><p>${evOf(id).note}</p><p>${evOf(id).brief}</p></div>` : ''}
    <p>${meta.story}</p>
    <ol class="obj">${meta.goals.map((t, i) => `<li><span class="n">0${i + 1}</span>${t}</li>`).join('')}</ol>
    <div class="rules"><span>评级</span>完成任务 400 · 结论验证一次答对 200 · ${meta.perfName} 300 · 不用提示 100。提示每次扣 ${HINT_COST}，失败重试每次扣 ${FAIL_COST}。</div>
    ${best ? `<div class="pb">个人纪录 <b class="rk r${best.rank}">${best.rank}</b>${num(best.score)} 分</div>` : ''}
    <div class="btns"><button class="btn" type="button" data-act="map">返回案件板</button><button class="btn pri big" type="button" data-act="start">开始鉴定</button></div>
  </div>`, 'small');
}
function beginStage(i) {
  stageI = i; afters.length = 0; stopTimer(); info(null); banner(null); closeSheet();
  pins.slice().forEach((p) => p.remove());
  mode = 'play'; renderDots(); hintUsed = false;
  const s = lv.stages[i];
  s.start(false); say(s.goal);
  $('bHint').hidden = !s.hint;
  fit(s.frame, .9);
  sfx.go();
}
function useHint() {
  const s = lv?.stages[stageI]; if (mode !== 'play' || !s?.hint) return;
  if (!hintUsed) { hintUsed = true; stats.hints++; }
  say(typeof s.hint === 'function' ? s.hint() : s.hint, 'hint');
}
function startExplain() {
  mode = 'explain'; g.ctrl(''); say(null); info(null); afters.length = 0;
  pins.slice().forEach((p) => p.remove());
  lv.explain.start(); step = -1; $('card').hidden = false;
  nextStep();
}
function nextStep() {
  const steps = lv.explain.steps;
  if (step >= steps.length - 1) { startQuiz(); return; }
  step++; sfx.tap();
  const s = steps[step], last = step === steps.length - 1;
  $('card').innerHTML = `<div class="ctag"><span>数据回放</span><span class="n">${step + 1} / ${steps.length}</span></div>
    <div class="ctext">${s.t}</div>
    ${last ? `<div class="memo"><span>结论</span><b>${meta.memo}</b></div>` : ''}
    <div class="crow"><span class="cdots">${steps.map((_, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</span><button class="btn pri" type="button" data-act="cnext">${last ? '进入结论验证' : '下一条'}</button></div>`;
  s.on?.();
  fit(s.frame || lv.explain.frame, 1);
}
function startQuiz() {
  mode = 'quiz'; $('card').hidden = true;
  const src = meta.quiz[(P.plays[meta.id] || 0) % meta.quiz.length];
  const opts = src.o.map((t, i) => ({t, ok: i === 0}));
  for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
  quiz = {src, opts, done: false};
  sheet(`<div class="qz"><div class="eyebrow">结论验证 · 一次答对 +200</div><h2>${src.q}</h2>
    <div class="opts">${opts.map((o, i) => `<button class="opt" type="button" data-act="opt" data-i="${i}"><i>${'ABC'[i]}</i><span>${o.t}</span></button>`).join('')}</div>
    <div class="qfb" id="qfb"></div></div>`, 'small');
}
function answer(btn) {
  if (!quiz || quiz.done) return;
  const o = quiz.opts[+btn.dataset.i];
  if (o.ok) {
    quiz.done = true; btn.classList.add('ok'); sfx.right();
    document.querySelectorAll('.opt').forEach((b) => { b.disabled = true; });
    $('qfb').innerHTML = `<p class="good"><b>${stats.wrong ? '正确' : '正确 · +200'}</b>${quiz.src.why}</p><button class="btn pri big" type="button" data-act="finish">查看评级</button>`;
  } else {
    stats.wrong++; btn.classList.add('no'); btn.disabled = true; sfx.wrong();
    $('qfb').innerHTML = `<p class="hint"><b>错误</b>${quiz.src.hint}</p>`;
  }
}
function finish() {
  mode = 'result';
  const perf = lv.perf(), id = meta.id;
  const rows = [
    ['完成任务', 400, true],
    ['结论验证', stats.wrong ? 80 : 200, !stats.wrong, stats.wrong ? `答错 ${stats.wrong} 次` : '一次答对'],
    [meta.perfName, Math.round(perf.score * 300), perf.score >= .99, perf.text],
    ['独立完成', stats.hints ? 0 : 100, !stats.hints, stats.hints ? `用了 ${stats.hints} 次提示` : '没有用提示'],
  ];
  const minus = stats.hints * HINT_COST + stats.fails * FAIL_COST;
  if (stats.hints) rows.push(['提示', -stats.hints * HINT_COST, false, `${stats.hints} 次 × ${HINT_COST}`]);
  if (stats.fails) rows.push(['失败重试', -stats.fails * FAIL_COST, false, `${stats.fails} 次 × ${FAIL_COST}`]);
  const score = Math.max(0, rows.reduce((s, r) => s + r[1], 0)), rank = rankOf(score);
  void minus;
  const prev = P.best[id], record = !prev || score > prev.score;
  if (record) P.best[id] = {score, rank};
  P.plays[id] = (P.plays[id] || 0) + 1; P.intro = true;
  const newCard = !P.cards[id]; P.cards[id] = Math.max(P.cards[id] || 0, rank === 'S' ? 2 : 1); save();
  const nxt = ORDER[ORDER.indexOf(id) + 1], zone = zoneOf(meta);
  const nextRank = RANKS[RANKS.findIndex(([r]) => r === rank) - 1];
  sheet(`<div class="res" style="--zc:${zone.c}">
    <div class="eyebrow">任务报告 · ${zone.code}-${id}</div>
    <div class="rhead"><div class="rank r${rank}"><b>${rank}</b></div><div><h2>${meta.name}</h2><div class="score">${num(score)}<span>/ 1000</span></div>${record ? `<div class="rec">${prev ? `新纪录 · 比上次高 ${score - prev.score} 分` : '首次完成'}</div>` : `<div class="rec dim">个人纪录 ${prev.rank} · ${prev.score} 分</div>`}</div></div>
    <ul class="brk">${rows.map(([t, v, ok, sub]) => `<li class="${v < 0 ? 'neg' : ok ? 'ok' : ''}"><span>${t}${sub ? `<small>${sub}</small>` : ''}</span>${num((v > 0 ? '+' : '') + v)}</li>`).join('')}</ul>
    ${evOf(id) ? `<div class="find"><em>鉴定结论 · 物证 ${evOf(id).k}</em><p>${evOf(id).finding}</p></div>` : ''}
    <div class="file${P.cards[id] === 2 ? ' s' : ''}"><span class="fc">${id}</span><div><em>${newCard ? '数据档案已解锁' : P.cards[id] === 2 ? 'S 级档案' : '数据档案'}</em><b>${meta.memo}</b></div></div>
    ${nextRank ? `<p class="tip">再拿 ${nextRank[1] - score} 分升到 ${nextRank[0]} 级。${perf.score < .99 ? perf.tip : stats.hints ? '下次试试不用提示。' : '结论验证要一次答对。'}</p>` : ''}
    <div class="btns"><button class="btn" type="button" data-act="again">再鉴定一次</button>${evOf(id) ? `<button class="btn pri" type="button" data-act="afterCut" data-k="${evOf(id).k}">继续调查</button>` : `<button class="btn pri" type="button" data-act="map">返回案件板</button>`}</div>
  </div>`, 'small');
  sfx.win(); setTimeout(() => mode === 'result' && sfx.star(RANKS.findIndex(([r]) => r === rank) === 0 ? 2 : 0), 500);
}

/* ------------------------------------------------------------ mission map */
const unlocked = (id) => { const i = ORDER.indexOf(id); return i === 0 || (i > 0 && !!P.best[ORDER[i - 1]]); };
function showMap() {
  exitWorld(); leaveLevel(); mode = 'map';
  $('hud').hidden = true; stageEl.style.visibility = 'hidden'; $('map').hidden = false;
  const all = Object.values(LEVELS), total = ORDER.reduce((s, id) => s + (P.best[id]?.score || 0), 0);
  const next = ORDER.find((id) => !P.best[id]), weakest = ORDER.filter((id) => P.best[id]).sort((a, b) => P.best[a].score - P.best[b].score)[0];
  const node = (l) => {
    const built = !!l.build, b = P.best[l.id], open = built && unlocked(l.id), z = zoneOf(l);
    const cls = !built ? 'soon' : !open ? 'lock' : b ? 'done' : 'open';
    return `<button class="node ${cls}${l.id === next ? ' cur' : ''}" type="button" data-act="lv" data-id="${l.id}">
      <span class="nc">${z.code}-${l.id}</span><span class="nm">${l.name}</span>
      <span class="ns">${!built ? '开发中' : !open ? `${IC.lock}完成上一项解锁` : b ? `<b class="rk r${b.rank}">${b.rank}</b>${num(b.score)}` : '<em>待执行</em>'}</span></button>`;
  };
  const city = ZONES.find((z) => z.k === 'city');
  const cityLv = [...ORDER.map((id) => LEVELS[id]), ...all.filter((l) => l.zone === 'city' && !ORDER.includes(l.id))];
  $('mScore').textContent = total; $('mCards').textContent = `${Object.keys(P.cards).length}/36`;
  const heroId = next || weakest || ORDER[0];
  $('mBody').innerHTML = `
    <section class="hero">
      <div class="htxt"><div class="eyebrow">${next ? '下一项任务' : '全部完成 · 刷新纪录'}</div><h1>${LEVELS[heroId].name}</h1><p>${next ? LEVELS[heroId].story : `目前最低分是这一项（${P.best[heroId].rank} · ${P.best[heroId].score} 分），再挑战一次争取 S。`}</p></div>
      <button class="btn pri big" type="button" data-act="lv" data-id="${heroId}">${next ? '执行任务' : '再挑战'}</button>
    </section>
    <section class="zone" style="--zc:${city.c}">
      <div class="zh"><i>${city.code}</i><h2>${city.n}</h2><span>试玩版开放 3 项任务 · 满分 3000</span></div>
      <div class="path">${cityLv.map(node).join('')}</div>
    </section>
    <div class="soonh">其他实验区开发中</div>
    <section class="zgrid">${ZONES.filter((z) => z.k !== 'city').map((z) => { const ls = all.filter((l) => l.zone === z.k); return `<div class="ztile" style="--zc:${z.c}"><div class="zh"><i>${z.code}</i><h2>${z.n}</h2><span>${ls.length} 项</span></div><p>${ls.map((l) => l.name).join(' · ')}</p></div>`; }).join('')}</section>
    <footer class="mfoot"><button type="button" data-act="board">返回案件板</button><a href="${PARENT_URL}" target="_blank" rel="noopener">家长入口 · 学习模式</a></footer>`;
  $('mBody').scrollTop = 0;
}
function showCards() {
  const all = Object.values(LEVELS);
  sheet(`<div class="album"><div class="ah"><h2>数据档案</h2><span>${Object.keys(P.cards).length} / 36</span><button class="btn" type="button" data-act="close">关闭</button></div>
    ${ZONES.map((z) => `<h3 style="--zc:${z.c}"><i>${z.code}</i>${z.n}</h3><div class="agrid">${all.filter((l) => l.zone === z.k).map((l) => {
      const c = P.cards[l.id];
      return c ? `<div class="file${c === 2 ? ' s' : ''}" style="--zc:${z.c}"><span class="fc">${l.id}</span><div><em>${l.name}</em><b>${l.memo}</b></div></div>` : `<div class="file none"><span class="fc">${l.id}</span><div><em>${l.build ? l.name : '开发中'}</em><b>完成任务后解锁</b></div></div>`;
    }).join('')}</div>`).join('')}</div>`, 'wide');
}

/* ------------------------------------------------------------ the case: world, cutscenes, board, deduction, report */
const studioLights = scene.children.filter((o) => o.isLight).map((l) => [l, l.intensity]);
const studioEnv = scene.environment, studioKey = {c: keyLight.color.clone(), p: keyLight.position.clone(), exp: renderer.toneMappingExposure};
let world = null, cut = null, worldOn = false, ded = null;
const evOf = (level) => CASE.evidence.find((e) => e.level === level);
const evDone = (e) => !!P.best[e.level];
const BOARD_CAM = {c: [-100, 470, -400], r: 2700, y: 250, a0: .35, fov: 42};
/* the world brings its own sky, fog and light; the studio's lights step aside while it is on */
function enterWorld() {
  leaveLevel();
  if (!world) { world = buildWorld(); cut = createCut({camera, sfx, world, getAspect: () => W / H}); post = createPost(renderer, scene, camera, {lite: coarse}); }
  if (!worldOn) {
    scene.add(world.root); worldOn = true; world.wake();
    for (const [l] of studioLights) if (l !== keyLight) l.intensity = 0;
    scene.environment = null; scene.fog = world.fog; ground.visible = false;
  }
  setBg(null);
  $('map').hidden = true; $('hud').hidden = true; stageEl.style.visibility = 'visible';
  resize();
}
function exitWorld() {
  if (!worldOn) return;
  cut.end(); scene.remove(world.root); worldOn = false;
  for (const [l, v] of studioLights) l.intensity = v;
  keyLight.color.copy(studioKey.c); keyLight.position.copy(studioKey.p); keyLight.target.position.set(0, 0, 0); keyLight.target.updateMatrixWorld();
  renderer.toneMappingExposure = studioKey.exp;
  scene.environment = studioEnv; scene.fog = null; ground.visible = true;
  $('board').hidden = true;
}
function playCut(list, then) {
  enterWorld(); mode = 'cut'; $('board').hidden = true; closeSheet();
  cut.play(list, then);
}
const face = (k) => { const c = {zhou: '#8aa4d6', lin: '#e6ebf0', song: '#e08a7a', gu: '#ffb547'}[k]; return `<span class="who" style="background:${c}">${CAST[k].n[0]}</span>`; };
function showTitle() {
  enterWorld(); mode = 'title'; world.reset(); world.setMood('night');
  $('board').hidden = false; $('board').className = 'title';
  $('bBody').innerHTML = `
    <div class="btop"><span class="mark">鉴识社</span><div><b>明川实验中学 · 鉴识社</b><small>七年级科学 · 探案试玩版</small></div></div>
    <div class="chead"><div class="eyebrow">${CASE.code}</div><h1>${CASE.title}</h1><p>${CASE.summary}</p></div>
    <div class="bact"><button class="btn pri big" type="button" data-act="begin">开始调查</button><small>开场约 2 分钟，点屏幕可加快，右上角可跳过</small></div>
    <p class="credit">过场镜头使用 <a href="https://github.com/alchaincyf/huashu-motion" target="_blank" rel="noopener">huashu-motion</a> 的相机系统（MIT 许可）</p>`;
  $('board').scrollTop = 0;
}
function showBoard() {
  enterWorld(); mode = 'board'; world.reset(); world.setMood(P.story.solved ? 'gold' : P.story.intro ? 'dawn' : 'night'); $('board').className = '';
  const done = CASE.evidence.filter(evDone).length, all = done === CASE.evidence.length, sb = P.story.best;
  $('board').hidden = false;
  $('bBody').innerHTML = `
    <div class="btop"><span class="mark">鉴识社</span><div><b>明川实验中学 · 鉴识社</b><small>${P.story.solved ? `已结案 · 评级 ${sb.rank} · ${sb.score} 分` : `物证鉴定 ${done} / ${CASE.evidence.length}`}</small></div><span class="sp"></span><button class="ib" id="bSnd2" type="button" data-act="snd" aria-label="声音开关">${sfx.on ? IC.snd : IC.mute}</button></div>
    <div class="chead"><div class="eyebrow">${CASE.code} · 案件板</div><h1>${CASE.title}</h1><p>${CASE.summary}</p></div>
    <section class="bsec"><h3>证词</h3><div class="says">${CASE.says.map((x) => `<div class="say">${face(x.who)}<div class="nm">${CASE.people[x.who].name}<small>${CASE.people[x.who].role}</small></div><q>${x.t}</q></div>`).join('')}</div></section>
    <section class="bsec"><h3>物证</h3><div class="evs">${CASE.evidence.map((e) => { const b = P.best[e.level]; return `<div class="ev${b ? ' done' : ''}">
      <div class="k">物证 ${e.k} · ${b ? '已鉴定' : '待鉴定'}${b ? `<b class="rk r${b.rank}">${b.rank}</b>` : ''}</div><h4>${e.name}</h4>
      <p>${e.note}</p>${b ? `<p class="fd">${e.finding}</p>` : ''}
      <button class="btn${b ? '' : ' pri'}" type="button" data-act="ev" data-id="${e.level}">${b ? '重新鉴定' : '开始鉴定'}</button></div>`; }).join('')}</div></section>
    <div class="bact"><button class="btn pri big" type="button" data-act="deduce"${all ? '' : ' disabled'}>${P.story.solved ? '重新推理' : '开始推理'}</button><small>${all ? '三件物证都已鉴定。逐条判断证词，再指认作案人。' : `还有 ${CASE.evidence.length - done} 件物证没鉴定`}</small></div>
    <footer class="mfoot"><button type="button" data-act="replay">重看开场</button>${P.story.solved ? '<button type="button" data-act="replayEnd">重看结局</button>' : ''}<button type="button" data-act="lab">鉴定训练记录</button><a href="${PARENT_URL}" target="_blank" rel="noopener">家长入口</a><button type="button" data-act="reset">清除记录</button></footer>
    <p class="credit">过场镜头使用 <a href="https://github.com/alchaincyf/huashu-motion" target="_blank" rel="noopener">huashu-motion</a> 的相机系统（MIT 许可）</p>`;
}
const CH = [['成立', null], ...CASE.evidence.map((e) => [`与物证 ${e.k} 矛盾`, e.k])];
function showDeduce() {
  mode = 'deduce'; ded = {pick: {}, checked: false, wrongS: 0, wrongA: 0, out: {}};
  const s = sheet(`<div class="dd"><div class="eyebrow">${CASE.code} · 推理</div><h2>这些证词，哪句成立？</h2>
    <p>每句证词选一项。判断错一句扣 50 分，指认错一人扣 100 分。</p>
    ${CASE.says.map((x) => `<div class="drow" data-k="${x.k}"><span class="nm">${CASE.people[x.who].name}</span><q>${x.t}</q>
      <div class="chs">${CH.map(([t, v]) => `<button type="button" data-act="dpick" data-k="${x.k}" data-v="${v ?? ''}">${t}</button>`).join('')}</div><div class="why" hidden></div></div>`).join('')}
    <div class="btns"><button class="btn" type="button" data-act="board">返回案件板</button><button class="btn pri" type="button" data-act="dcheck" id="dcheck" disabled>提交判断</button></div>
    <div id="accuse"></div></div>`, 'wide');
  void s;
}
function dPick(b) {
  if (ded.checked) return;
  const k = b.dataset.k; ded.pick[k] = b.dataset.v || null;
  b.parentNode.querySelectorAll('button').forEach((x) => x.classList.toggle('sel', x === b));
  $('dcheck').disabled = Object.keys(ded.pick).length < CASE.says.length;
}
function dCheck() {
  if (ded.checked) return; ded.checked = true;
  for (const x of CASE.says) {
    const row = document.querySelector(`.drow[data-k="${x.k}"]`), got = ded.pick[x.k], ok = got === x.by;
    if (!ok) ded.wrongS++;
    row.querySelectorAll('button').forEach((b) => { b.disabled = true; const v = b.dataset.v || null; if (v === x.by) b.classList.add('ok'); else if (v === got) b.classList.add('no'); });
    const w = row.querySelector('.why'); w.hidden = false;
    w.innerHTML = `<b class="${ok ? 'ok' : 'no'}">${ok ? '正确' : '错误 −50'}</b>${x.by ? `与物证 ${x.by} 矛盾：` : ''}${x.why}`;
  }
  ded.wrongS ? sfx.wrong() : sfx.right();
  $('dcheck').hidden = true;
  $('accuse').innerHTML = `<div class="drow"><h2>谁把奖杯扔进了生态池？</h2><div class="who3">${Object.keys(CASE.people).map((k) => `<button type="button" data-act="accuse" data-k="${k}">${face(k)}<b>${CASE.people[k].name}</b><small>${CASE.people[k].role}</small></button>`).join('')}</div><div class="why" id="denyT" hidden></div></div>`;
  $('accuse').scrollIntoView({behavior: 'smooth', block: 'start'});
}
function accuse(b) {
  const k = b.dataset.k; if (ded.out[k]) return;
  if (k !== CASE.culprit) {
    ded.out[k] = true; ded.wrongA++; b.classList.add('no'); sfx.wrong(); shake();
    const d = $('denyT'); d.hidden = false; d.innerHTML = `<b class="no">指认错误 −100</b>${CASE.people[k].name}：“${CASE.deny[k]}”`;
    return;
  }
  sfx.right();
  const evScore = CASE.evidence.reduce((t, e) => t + (P.best[e.level]?.score || 0), 0) / CASE.evidence.length;
  const dScore = Math.max(0, 300 - ded.wrongS * 50 - ded.wrongA * 100), score = Math.round(evScore * .7 + dScore);
  ded.result = {evScore: Math.round(evScore * .7), dScore, score, rank: rankOf(score)};
  playCut(SCRIPT.finale(world), showReport);
}
function showReport() {
  const r = ded.result, prev = P.story.best, record = !prev || r.score > prev.score;
  if (record) P.story.best = {score: r.score, rank: r.rank};
  P.story.solved = true; save();
  mode = 'report'; $('board').hidden = true;
  sheet(`<div class="res cr" style="--zc:#3ee6ff">
    <div class="eyebrow">结案报告 · ${CASE.code}</div>
    <div class="rhead"><div class="rank r${r.rank}"><b>${r.rank}</b></div><div><h2>${CASE.title}</h2><div class="score">${num(r.score)}<span>/ 1000</span></div>${record ? `<div class="rec">${prev ? `新纪录 · 比上次高 ${r.score - prev.score} 分` : '首次结案'}</div>` : `<div class="rec dim">最好成绩 ${prev.rank} · ${prev.score} 分</div>`}</div></div>
    <ul class="brk">
      <li class="${r.evScore >= 650 ? 'ok' : ''}"><span>物证鉴定<small>三次鉴定平均分 × 0.7</small></span>${num('+' + r.evScore)}</li>
      <li class="${r.dScore === 300 ? 'ok' : ''}"><span>推理<small>${ded.wrongS ? `判断错 ${ded.wrongS} 句` : '证词全部判断正确'}${ded.wrongA ? ` · 指认错 ${ded.wrongA} 次` : ''}</small></span>${num('+' + r.dScore)}</li>
    </ul>
    <h3 style="margin:14px 0 8px;font:700 13px/1 var(--mono);letter-spacing:.14em;color:var(--mut)">真相</h3>
    <ul class="truth">${CASE.reveal.map((t) => `<li>${t}</li>`).join('')}</ul>
    <h3 style="margin:14px 0 8px;font:700 13px/1 var(--mono);letter-spacing:.14em;color:var(--mut)">本案用到的知识</h3>
    <div class="kn">${CASE.evidence.map((e) => `<span>${LEVELS[e.level].memo}</span>`).join('')}</div>
    <div class="btns"><button class="btn" type="button" data-act="replayEnd">重看结局</button><button class="btn pri" type="button" data-act="board">返回案件板</button></div>
  </div>`, 'small');
  sfx.win();
}
function afterCut(k) {
  P.story.seen[k] = true; save();
  playCut(SCRIPT.after((enterWorld(), world), k), showBoard);
}

/* ------------------------------------------------------------ input */
const ACT = {
  lv(b) {
    const l = LEVELS[b.dataset.id];
    if (!l.build) return toast('这项任务还在开发中');
    if (!unlocked(l.id)) return toast('先完成上一项任务');
    enterLevel(l.id);
  },
  start() { closeSheet(); P.intro = true; save(); beginStage(0); },
  retry() { closeSheet(); beginStage(stageI); },
  again() { enterLevel(meta.id); },
  map() { showBoard(); },
  board() { closeSheet(); showBoard(); },
  lab() { showMap(); },
  begin() { sfx.unlock(); playCut(SCRIPT.intro((enterWorld(), world)), () => { P.story.intro = true; save(); showBoard(); }); },
  replay() { playCut(SCRIPT.intro((enterWorld(), world)), showBoard); },
  replayEnd() { closeSheet(); playCut(SCRIPT.finale((enterWorld(), world)), showBoard); },
  ev(b) { enterLevel(+b.dataset.id); },
  afterCut(b) { closeSheet(); afterCut(b.dataset.k); },
  deduce() { showDeduce(); },
  dpick: dPick, dcheck: dCheck, accuse,
  cutSkip() { cut.skip(); }, cutAuto() { cut.auto(); }, cutVoice() { cut.voice(); },
  back() { if (mode === 'play') sheet('<div class="fail"><h2>放弃这次任务？</h2><p>离开后本次进度不保存。</p><div class="btns"><button class="btn" type="button" data-act="map">返回案件板</button><button class="btn pri" type="button" data-act="close">继续任务</button></div></div>', 'small'); else showMap(); },
  close() { closeSheet(); },
  cnext() { nextStep(); },
  hint: useHint,
  opt: answer,
  finish,
  cards: showCards,
  snd() { sfx.set(!sfx.on); P.sound = sfx.on; save(); sndIcon(); const b2 = $('bSnd2'); if (b2) b2.innerHTML = sfx.on ? IC.snd : IC.mute; },
  reset() { sheet('<div class="fail"><h2>清除任务记录？</h2><p>所有鉴定评级、结案记录和数据档案都会清空。</p><div class="btns"><button class="btn" type="button" data-act="close">取消</button><button class="btn pri" type="button" data-act="doReset">清除</button></div></div>', 'small'); },
  doReset() { P.best = {}; P.cards = {}; P.plays = {}; P.intro = false; P.story = {intro: false, seen: {}, solved: false, best: null}; save(); closeSheet(); showTitle(); },
};
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b && mode === 'cut' && e.target.closest('#cut')) { sfx.unlock(); cut.tap(); return; }
  if (!b || b.disabled) return;
  sfx.unlock(); if (b.dataset.act !== 'cnext') sfx.tap();
  ACT[b.dataset.act]?.(b);
});
const ptr = (name) => (e) => { if (mode !== 'play' || !lv?.[name]) return; if (name === 'down') { sfx.unlock(); try { stageEl.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } } lv[name](plane(e), e); };
stageEl.addEventListener('pointerdown', ptr('down'));
stageEl.addEventListener('pointermove', ptr('move'));
stageEl.addEventListener('pointerup', ptr('up'));
stageEl.addEventListener('pointercancel', ptr('up'));
stageEl.addEventListener('contextmenu', (e) => e.preventDefault());
addEventListener('resize', resize);
addEventListener('keydown', (e) => { if (mode === 'cut' && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); cut.tap(); } });

/* ------------------------------------------------------------ main loop */
let last = performance.now();
function runAfters(list, dt) { for (let i = list.length - 1; i >= 0; i--) { const a = list[i]; if ((a.t -= dt) <= 0) { list.splice(i, 1); a.fn(); } } }
function tick(now) {
  const dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
  if (lv) {
    const playing = mode === 'play';
    if (playing) {
      stats.time += dt;
      if (timer) { timer.t -= dt; const s = Math.ceil(timer.t); if (s !== timer.last) { timer.last = s; showTime(); if (s <= 5 && s > 0) sfx.tick(); } if (timer.t <= 0) { const f = timer.onEnd; stopTimer(); f(); } }
      runAfters(afters, dt);
    } else if (mode === 'explain') runAfters(afters, dt);
    runAfters(sysAfters, dt);
    if (lv) lv.update(dt, playing);
  }
  if (worldOn) {
    if (cut.on) cut.update(dt); else cut.idle(dt, BOARD_CAM);
    world.update(dt, camera);
    post.bloom.strength = world.bloom; renderer.toneMappingExposure = world.exposure;
    if (!window.__skipDraw) post.render(dt);
  } else if (lv) {
    if (cam.k < 1) { cam.k = Math.min(1, cam.k + dt / cam.dur); const e = ease(cam.k); camera.position.lerpVectors(cam.p0, cam.p1, e); cam.tgt.lerpVectors(cam.t0, cam.t1, e); }
    const k = 1 - Math.exp(-dt * 7); off.x += (off.tx - off.x) * k; off.y += (off.ty - off.y) * k;
    camera.setViewOffset(W, H, off.x, off.y, W, H);
    camera.lookAt(cam.tgt);
    renderer.render(scene, camera);
    if (lv.tags) for (const key in lv.tags) { const t = lv.tags[key], s = toScreen(t.p), vis = t.on !== false && s.ok; t.el.hidden = !vis; if (vis) { t.el.style.left = s.x + 'px'; t.el.style.top = s.y + 'px'; t.el.classList.toggle('below', !!t.below); } }
    for (const p of pins) { const s = toScreen(p.p), vis = p.on && s.ok; p.el.hidden = !vis; if (vis) { p.el.style.left = s.x + 'px'; p.el.style.top = s.y + 'px'; } }
  }
  fxTick(dt);
  requestAnimationFrame(tick);
}

/* ------------------------------------------------------------ boot */
$('bSnd').dataset.act = 'snd'; $('mSnd').dataset.act = 'snd'; sndIcon();
$('bBack').innerHTML = IC.back;
resize();
if (!P.story.intro) showTitle(); else showBoard();
requestAnimationFrame(tick);
window.game = {P, g, enter: enterLevel, map: showMap, board: showBoard, get mode() { return mode; }, get lv() { return lv; }, get stage() { return stageI; }, get cut() { return cut; }, get world() { return world; }, after: afterCut};
