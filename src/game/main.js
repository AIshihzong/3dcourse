/* 科学大冒险 · game shell: world map, level flow (闯关 → 揭秘卡 → 守关题 → 奖励) and save data. */
import * as THREE from 'three';
import {$, ease, renderer, scene, camera, controls, stageEl, canvasTex} from '../kit.js';
import {sfx} from './sfx.js';
import {ZONES, LEVELS, ORDER, PARENT_URL} from './levels/index.js';

const V3 = THREE.Vector3;
controls.enabled = false;
const studioBg = scene.background;

/* ------------------------------------------------------------ save data */
const KEY = 'g7game.v1';
const P = {v: 1, stars: {}, cards: {}, coins: 0, plays: {}, sound: true, intro: false};
try { Object.assign(P, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* storage blocked: play without saving */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* ignore */ } };
sfx.set(P.sound !== false);

/* ------------------------------------------------------------ icons */
const IC = {
  star: '<svg viewBox="0 0 24 24" class="ic"><path d="M12 2.2l3 6.2 6.8 1-4.9 4.8 1.2 6.8L12 17.8 5.9 21l1.2-6.8L2.2 9.4l6.8-1z"/></svg>',
  coin: '<svg viewBox="0 0 24 24" class="ic coin"><circle cx="12" cy="12" r="10" fill="#ffc21a"/><circle cx="12" cy="12" r="6.4" fill="none" stroke="#b97a00" stroke-width="1.8"/></svg>',
  back: '<svg viewBox="0 0 24 24" class="ic ln"><path d="M14.5 5l-7 7 7 7"/></svg>',
  snd: '<svg viewBox="0 0 24 24" class="ic ln"><path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z" fill="currentColor"/><path d="M15.5 9a4.2 4.2 0 010 6M18.2 6.5a8 8 0 010 11"/></svg>',
  mute: '<svg viewBox="0 0 24 24" class="ic ln"><path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
  lock: '<svg viewBox="0 0 24 24" class="ic"><path d="M7 10V8a5 5 0 0110 0v2h1.2c.5 0 .8.4.8.8v9.4c0 .4-.3.8-.8.8H5.8a.8.8 0 01-.8-.8v-9.4c0-.4.4-.8.8-.8zm2.3 0h5.4V8a2.7 2.7 0 00-5.4 0z"/></svg>',
  book: '<svg viewBox="0 0 24 24" class="ic"><path d="M5 3.5h11a3 3 0 013 3V20a.5.5 0 01-.8.4c-.7-.5-1.5-.9-2.7-.9H5a1 1 0 01-1-1v-14a1 1 0 011-1zm2.5 4v2h8v-2zm0 4v2h6v-2z"/></svg>',
  ok: '<svg viewBox="0 0 24 24" class="ic ln"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  no: '<svg viewBox="0 0 24 24" class="ic ln"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
};
const BOT = '<svg viewBox="0 0 48 48" class="bot"><line x1="24" y1="4" x2="24" y2="12" stroke="#16204d" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="5" r="4" fill="#ffd23f"/><rect x="5" y="11" width="38" height="31" rx="12" fill="#3ddc97"/><rect x="10" y="17" width="28" height="15" rx="7.5" fill="#16204d"/><circle cx="18" cy="24.5" r="3.6" fill="#fff"/><circle cx="30" cy="24.5" r="3.6" fill="#fff"/><path d="M19 36.5q5 3.4 10 0" fill="none" stroke="#16204d" stroke-width="2.4" stroke-linecap="round"/></svg>';
const starsHtml = (n) => [0, 1, 2].map((i) => `<i class="${i < n ? 'on' : ''}">${IC.star}</i>`).join('');

/* ------------------------------------------------------------ state */
let mode = 'map';          // map | brief | play | clearing | fail | explain | quiz | result
let lv = null, meta = null, stageI = 0;
let stats = {time: 0, fails: 0, wrong: 0};
let timer = null, quiz = null, step = 0;
const afters = [], sysAfters = [], pins = [];
let W = 1, H = 1;
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
function say(t) { const el = $('goal'); el.hidden = !t; if (!t) return; $('goalT').innerHTML = t; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
function info(t) { $('hInfo').hidden = !t; if (t) $('hInfo').innerHTML = t; }
function banner(t) { const el = $('banner'); el.hidden = !t; if (!t) return; el.innerHTML = t; el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); }
function sheet(html, cls = '') { const s = $('sheet'); s.className = 'sheet ' + cls; s.innerHTML = html; $('ov').hidden = false; s.scrollTop = 0; return s; }
function closeSheet() { $('ov').hidden = true; $('sheet').innerHTML = ''; }
function sndIcon() { for (const id of ['bSnd', 'mSnd']) $(id).innerHTML = sfx.on ? IC.snd : IC.mute; }
function setBg(cols) {
  if (!cols) { scene.background = studioBg; return; }
  scene.background = canvasTex(4, 512, (g) => { const gr = g.createLinearGradient(0, 0, 0, 512); cols.forEach((c, i) => gr.addColorStop(i / (cols.length - 1), c)); g.fillStyle = gr; g.fillRect(0, 0, 4, 512); });
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

/* confetti */
const fxc = $('fx'), fg = fxc.getContext('2d'); let parts = [];
const CONF = ['#ffd23f', '#ff6b5e', '#3ddc97', '#4cc3ff', '#a78bff', '#ffffff'];
function burst(n = 46, x = W / 2, y = H * .34) {
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = 180 + Math.random() * 520; parts.push({x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 260, r: 4 + Math.random() * 6, c: CONF[i % CONF.length], t: 0, life: 1 + Math.random() * .8, w: Math.random() * 6}); }
}
function fxTick(dt) {
  if (!parts.length && !fxc.dirty) return;
  fg.clearRect(0, 0, W, H); fxc.dirty = parts.length > 0;
  parts = parts.filter((p) => (p.t += dt) < p.life);
  for (const p of parts) {
    p.vy += 1300 * dt; p.vx *= 1 - dt * .9; p.x += p.vx * dt; p.y += p.vy * dt;
    fg.globalAlpha = Math.min(1, (p.life - p.t) * 2.5); fg.fillStyle = p.c;
    fg.save(); fg.translate(p.x, p.y); fg.rotate(p.t * 9 + p.w); fg.fillRect(-p.r, -p.r * .5, p.r * 2, p.r); fg.restore();
  }
  fg.globalAlpha = 1;
}

/* ------------------------------------------------------------ what a level can call */
const g = {
  sfx, burst, shake, pin, pop, plane, toScreen, say, info, toast,
  get portrait() { return W / H < 1; },
  get stats() { return stats; },
  fit: (fn, dur) => fit(fn, dur),
  ctrl(html) { const el = $('ctrl'); el.innerHTML = html || ''; el.hidden = !html; return el; },
  after(sec, fn) { afters.push({t: sec, fn}); },
  timer(sec, onEnd) { timer = {t: sec, onEnd, last: Math.ceil(sec)}; $('hTime').hidden = false; showTime(); },
  stopTimer,
  clear() {
    if (mode !== 'play') return;
    mode = 'clearing'; stopTimer(); sfx.clear(); burst(50);
    const last = stageI === lv.stages.length - 1;
    banner(last ? '三小关全部完成！' : `第 ${stageI + 1} 小关 完成！`); renderDots(stageI + 1);
    sysAfters.push({t: 1.5, fn: () => { banner(null); if (last) startExplain(); else beginStage(stageI + 1); }});
  },
  fail(why) {
    if (mode !== 'play') return;
    mode = 'fail'; stats.fails++; stopTimer(); sfx.fail(); shake();
    sysAfters.push({t: .7, fn: () => sheet(`<div class="fail"><div class="face">${BOT}</div><h2>差一点点！</h2><p>${why}</p><div class="btns"><button class="btn" type="button" data-act="map">回地图</button><button class="btn pri" type="button" data-act="retry">再试一次</button></div></div>`, 'small')});
  },
};
function stopTimer() { timer = null; $('hTime').hidden = true; $('hTime').classList.remove('hot'); }
function showTime() { const s = Math.max(0, Math.ceil(timer.t)); $('hTime').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; $('hTime').classList.toggle('hot', s <= 10); }

/* ------------------------------------------------------------ level flow */
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
  $('card').hidden = true; banner(null); closeSheet(); g.ctrl(''); info(null); say(null); setBg(null);
}
function enterLevel(id) {
  leaveLevel();
  meta = LEVELS[id]; mode = 'brief'; stageI = 0; stats = {time: 0, fails: 0, wrong: 0};
  $('map').hidden = true; $('hud').hidden = false; stageEl.style.visibility = 'visible';
  $('lvName').textContent = meta.name;
  lv = meta.build(g); scene.add(lv.root); setBg(lv.bg);
  $('app').classList.toggle('dark3d', !!lv.dark);
  resize(); renderDots(0);
  g.ctrl(''); say(null); info(null);
  fit(lv.stages[0].frame, 0);
  const zone = ZONES.find((z) => z.k === meta.zone);
  sheet(`<div class="brief" style="--zc:${zone.c}">
    <div class="ztag">${zone.n}</div>
    <div class="orb big"><b>${meta.glyph}</b></div>
    <h2>${meta.name}</h2>
    <p>${meta.story}</p>
    <ul class="how"><li>${IC.star}闯过三小关</li><li>${IC.star}守关题一次答对</li><li>${IC.star}${meta.star3}</li></ul>
    <div class="btns"><button class="btn" type="button" data-act="map">回地图</button><button class="btn pri big" type="button" data-act="start">开始！</button></div>
  </div>`, 'small');
}
function beginStage(i) {
  stageI = i; afters.length = 0; stopTimer(); info(null); banner(null); closeSheet();
  pins.slice().forEach((p) => p.remove());
  mode = 'play'; renderDots();
  const s = lv.stages[i];
  s.start(false); say(s.goal);
  fit(s.frame, .9);
  sfx.go();
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
  $('card').innerHTML = `<div class="ctag">${BOT}<span>揭秘时间</span></div>
    <div class="ctext">${s.t}</div>
    ${last ? `<div class="memo"><span>口诀卡</span><b>${meta.memo}</b></div>` : ''}
    <div class="crow"><span class="cdots">${steps.map((_, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</span><button class="btn pri" type="button" data-act="cnext">${last ? '记住了，去守关！' : '下一步'}</button></div>`;
  s.on?.();
  fit(s.frame || lv.explain.frame, 1);
}
function startQuiz() {
  mode = 'quiz'; $('card').hidden = true;
  const src = meta.quiz[(P.plays[meta.id] || 0) % meta.quiz.length];
  const opts = src.o.map((t, i) => ({t, ok: i === 0}));
  for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
  quiz = {src, opts, done: false};
  sheet(`<div class="qz"><div class="qtag">守关题 · 答对就通关</div><h2>${src.q}</h2>
    <div class="opts">${opts.map((o, i) => `<button class="opt" type="button" data-act="opt" data-i="${i}"><i>${'ABC'[i]}</i><span>${o.t}</span></button>`).join('')}</div>
    <div class="qfb" id="qfb"></div></div>`, 'small');
}
function answer(btn) {
  if (!quiz || quiz.done) return;
  const o = quiz.opts[+btn.dataset.i];
  if (o.ok) {
    quiz.done = true; btn.classList.add('ok'); sfx.right(); burst(30);
    document.querySelectorAll('.opt').forEach((b) => { b.disabled = true; });
    $('qfb').innerHTML = `<p class="good"><b>答对了！</b>${quiz.src.why}</p><button class="btn pri big" type="button" data-act="finish">领奖励</button>`;
  } else {
    stats.wrong++; btn.classList.add('no'); btn.disabled = true; sfx.wrong();
    $('qfb').innerHTML = `<p class="hint"><b>再想想。</b>${quiz.src.hint}</p>`;
  }
}
function finish() {
  mode = 'result';
  const perf = lv.perf(), got = [true, stats.wrong === 0, !!perf.ok], n = got.filter(Boolean).length;
  const id = meta.id, prev = P.stars[id] || 0, first = prev === 0;
  const coins = first ? 30 + n * 10 : 5 + Math.max(0, n - prev) * 10;
  P.stars[id] = Math.max(prev, n); P.coins += coins; P.plays[id] = (P.plays[id] || 0) + 1; P.intro = true;
  const gold = P.stars[id] === 3, newCard = !P.cards[id], upCard = gold && P.cards[id] === 1;
  P.cards[id] = gold ? 2 : 1; save();
  const nxt = ORDER[ORDER.indexOf(id) + 1], zone = ZONES.find((z) => z.k === meta.zone);
  const conds = ['闯过三小关', '守关题一次答对', perf.label];
  sheet(`<div class="res" style="--zc:${zone.c}">
    <div class="rtag">通关！</div><h2>${meta.name}</h2>
    <div class="stars3">${got.map((ok, i) => `<i class="${ok ? 'on' : ''}" style="--d:${.25 + i * .35}s">${IC.star}</i>`).join('')}</div>
    <ul class="conds">${conds.map((c, i) => `<li class="${got[i] ? 'ok' : 'no'}">${got[i] ? IC.ok : IC.no}<span>${c}</span></li>`).join('')}</ul>
    <div class="loot">
      <div class="kcard${gold ? ' gold' : ''}"><span class="orb"><b>${meta.glyph}</b></span><div><em>${newCard ? '获得知识卡' : upCard ? '知识卡升级成金卡' : gold ? '金色知识卡' : '知识卡'}</em><b>${meta.memo}</b></div></div>
      <div class="coins">${IC.coin}<b>+${coins}</b><span>金币</span></div>
    </div>
    ${!nxt && first ? '<p class="tip">试玩版的三关都通过了！更多关卡正在建造中。</p>' : n < 3 ? '<p class="tip">再玩一次可以把星星补满，三颗星的知识卡会变成金卡。</p>' : ''}
    <div class="btns"><button class="btn" type="button" data-act="map">回地图</button><button class="btn" type="button" data-act="again">再玩一次</button>${nxt ? `<button class="btn pri" type="button" data-act="lv" data-id="${nxt}">下一关</button>` : ''}</div>
  </div>`, 'small');
  sfx.win(); burst(80);
  got.forEach((ok, i) => ok && setTimeout(() => mode === 'result' && sfx.star(i), 250 + i * 350));
}

/* ------------------------------------------------------------ world map */
const unlocked = (id) => { const i = ORDER.indexOf(id); return i === 0 || (i > 0 && (P.stars[ORDER[i - 1]] || 0) > 0); };
function showMap() {
  leaveLevel(); mode = 'map';
  $('hud').hidden = true; stageEl.style.visibility = 'hidden'; $('map').hidden = false;
  const all = Object.values(LEVELS), total = ORDER.reduce((s, id) => s + (P.stars[id] || 0), 0);
  const next = ORDER.find((id) => !(P.stars[id] > 0)), cards = Object.keys(P.cards).length;
  const node = (l) => {
    const built = !!l.build, st = P.stars[l.id] || 0, open = built && unlocked(l.id);
    const cls = !built ? 'soon' : !open ? 'lock' : st ? 'done' : 'open';
    return `<button class="node ${cls}${l.id === next ? ' cur' : ''}" type="button" data-act="lv" data-id="${l.id}"><span class="orb"><b>${cls === 'lock' ? IC.lock : l.glyph}</b></span><span class="nm">${l.name}</span><span class="st3">${built ? starsHtml(st) : '<em>建造中</em>'}</span></button>`;
  };
  const city = ZONES.find((z) => z.k === 'city');
  const cityLv = [...ORDER.map((id) => LEVELS[id]), ...all.filter((l) => l.zone === 'city' && !ORDER.includes(l.id))];
  $('mStars').textContent = `${total}/${ORDER.length * 3}`; $('mCoins').textContent = P.coins; $('mCards').textContent = `${cards}/36`;
  $('mBody').innerHTML = `
    <section class="hero">
      <div class="hbot">${BOT}</div>
      <div class="htxt"><h1>${next ? (P.intro ? '接着闯关吧！' : '欢迎来到科学大冒险') : '三关全部通过！'}</h1><p>${next ? '每一关都是一个小游戏。闯过去拿星星、金币和知识卡。' : total < 9 ? '还有星星没拿到，回去把它们补满。' : '九颗星全部到手，你就是声光之城的高手。'}</p></div>
      <button class="btn pri big" type="button" data-act="lv" data-id="${next || ORDER[0]}">${next ? `${P.intro ? '继续' : '开始'}：${LEVELS[next].name}` : '再玩一次'}</button>
    </section>
    <section class="zone" style="--zc:${city.c}">
      <div class="zh"><i></i><h2>${city.n}</h2><span>试玩版开放 3 关</span></div>
      <div class="path">${cityLv.map(node).join('')}</div>
    </section>
    <div class="soonh">更多区域正在建造中</div>
    <section class="zgrid">${ZONES.filter((z) => z.k !== 'city').map((z) => { const ls = all.filter((l) => l.zone === z.k); return `<div class="ztile" style="--zc:${z.c}"><div class="zh"><i></i><h2>${z.n}</h2><span>${ls.length} 关</span></div><p>${ls.map((l) => l.name).join(' · ')}</p></div>`; }).join('')}</section>
    <footer class="mfoot"><a href="${PARENT_URL}" target="_blank" rel="noopener">家长入口 · 学习模式</a><button type="button" data-act="reset">重置游戏进度</button></footer>`;
  $('mBody').scrollTop = 0;
}
function showCards() {
  const all = Object.values(LEVELS);
  sheet(`<div class="album"><div class="ah"><h2>知识卡图鉴</h2><span>${Object.keys(P.cards).length} / 36</span><button class="btn" type="button" data-act="close">关闭</button></div>
    ${ZONES.map((z) => `<h3 style="--zc:${z.c}"><i></i>${z.n}</h3><div class="agrid">${all.filter((l) => l.zone === z.k).map((l) => {
      const c = P.cards[l.id];
      return c ? `<div class="kcard${c === 2 ? ' gold' : ''}" style="--zc:${z.c}"><span class="orb"><b>${l.glyph}</b></span><div><em>${l.name}</em><b>${l.memo}</b></div></div>` : `<div class="kcard none"><span class="orb"><b>?</b></span><div><em>${l.build ? l.name : '建造中'}</em><b>通关后获得</b></div></div>`;
    }).join('')}</div>`).join('')}</div>`, 'wide');
}

/* ------------------------------------------------------------ input */
const ACT = {
  lv(b) {
    const l = LEVELS[b.dataset.id];
    if (!l.build) return toast('这一关还在建造中');
    if (!unlocked(l.id)) return toast('先通过前一关，这一关就会解锁');
    enterLevel(l.id);
  },
  start() { closeSheet(); P.intro = true; save(); beginStage(0); },
  retry() { closeSheet(); beginStage(stageI); },
  again() { enterLevel(meta.id); },
  map() { showMap(); },
  back() { if (mode === 'play') sheet('<div class="fail"><h2>要回地图吗？</h2><p>这一关还没闯完，现在离开要从头再来。</p><div class="btns"><button class="btn" type="button" data-act="map">回地图</button><button class="btn pri" type="button" data-act="close">继续闯关</button></div></div>', 'small'); else showMap(); },
  close() { closeSheet(); },
  cnext() { nextStep(); },
  opt: answer,
  finish,
  cards: showCards,
  snd() { sfx.set(!sfx.on); P.sound = sfx.on; save(); sndIcon(); },
  reset() { sheet('<div class="fail"><h2>重置游戏进度？</h2><p>星星、金币和知识卡都会清空。</p><div class="btns"><button class="btn" type="button" data-act="close">不重置</button><button class="btn pri" type="button" data-act="doReset">清空重来</button></div></div>', 'small'); },
  doReset() { P.stars = {}; P.cards = {}; P.plays = {}; P.coins = 0; P.intro = false; save(); closeSheet(); showMap(); },
};
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
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
  if (lv) {
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
$('bBack').innerHTML = IC.back; $('icStar').innerHTML = IC.star; $('icCoin').innerHTML = IC.coin; $('icBook').innerHTML = IC.book;
$('goalBot').innerHTML = BOT; $('mLogo').innerHTML = BOT;
resize();
if (!P.intro) enterLevel(ORDER[0]); else showMap();
requestAnimationFrame(tick);
window.game = {P, g, enter: enterLevel, map: showMap, get mode() { return mode; }, get lv() { return lv; }, get stage() { return stageI; }};
