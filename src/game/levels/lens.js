/* 332 放映师: move the candle and the screen. 物近像远像变大. Reuses the optical bench from the lab. */
import * as THREE from 'three';
import {buildLens} from '../../scenes/ported.js';
import {MAT, G, V, clamp, box, canvasTex} from '../../kit.js';

const K = 12, AY = 210; // same scale as buildLens: 12 units per cm, height of the optical axis

export function buildLensLevel(g) {
  const L = buildLens({}), st = L.st, root = G(); root.add(L.root);
  st.manual = true; st.hideRays = true; st.f = 10; st.u = 30; st.scrX = 46;
  const table = box(1900, 26, 520, MAT.wood()); table.position.y = -13; root.add(table);
  L.tags.obj.set('蜡烛'); L.tags.lens.set('凸透镜'); L.tags.scr.set('光屏');
  /* an out-of-focus image is a soft glow on the screen */
  const blurTex = canvasTex(128, 128, (c) => { const gr = c.createRadialGradient(64, 64, 2, 64, 64, 62); gr.addColorStop(0, 'rgba(255,216,150,1)'); gr.addColorStop(.5, 'rgba(255,170,80,.5)'); gr.addColorStop(1, 'rgba(255,150,60,0)'); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); });
  const blur = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({map: blurTex, transparent: true, depthWrite: false, toneMapped: false}));
  blur.rotation.y = -Math.PI / 2; blur.renderOrder = 4; root.add(blur);

  let stage = 0, drag = null, hold = 0, wasSharp = false, exOn = false, exU = 30, said = '', idle = 0, ui = null, hp = null, lastSec = -1;
  const optics = () => { const u = st.u, f = st.f; if (Math.abs(u - f) < .25) return {none: true, real: false, m: 0, v: 0}; const v = u * f / (u - f); return {none: false, v, m: Math.abs(v / u), real: v > 0}; };
  const isSharp = (o) => o.real && o.v <= 63.5 && Math.abs(st.scrX - o.v) < .5;
  const sayOnce = (key, text) => { if (said !== key) { said = key; g.feedback(text); } };
  function hint(text, what) { if (hp) hp.pin.remove(); hp = {what, pin: g.pin(text, V(), {cls: 'lbl yel'})}; }
  function panel(size) {
    ui = g.ctrl(`<div class="panel">${size ? '' : '<div class="meter"><span>清晰度</span><div class="bar"><i id="mA"></i></div><b id="vA"></b></div>'}<div class="meter"><span>${size ? '放大倍数' : '像的大小'}</span><div class="bar"><i id="mB"></i></div><b id="vB"></b></div></div>`);
  }
  function meter(id, frac, text, ok) {
    const bar = ui?.querySelector('#m' + id); if (!bar) return;
    bar.style.width = clamp(frac, 0, 1) * 100 + '%'; ui.querySelector('#v' + id).textContent = text; bar.parentNode.parentNode.classList.toggle('ok', !!ok);
  }

  function update(dt, playing) {
    if (exOn) st.u += (exU - st.u) * (1 - Math.exp(-dt * 2.2));
    L.update(dt, dt);
    const o = optics(), sharp = isSharp(o);
    /* blur spot */
    blur.visible = !exOn && o.real && stage < 2;
    if (blur.visible) {
      const def = Math.abs(st.scrX - o.v), mm = clamp(o.m, .3, 3.4), d = Math.min(15.5, mm * 4.4 + 10 * def / Math.max(o.v, 4)) * K;
      blur.scale.set(d, d, 1); blur.position.set(st.scrX * K - 7, AY - Math.min(mm * 1.9 * K, 60), 0);
      blur.material.opacity = clamp(def / 1.6, 0, 1) * clamp(1.3 - d / (15.5 * K), .28, .85);
    }
    if (hp) { hp.pin.p.set((hp.what === 'obj' ? -st.u : st.scrX) * K, AY + (hp.what === 'obj' ? 96 : 132), 0); }
    if (!playing) return;
    const sec = Math.floor(g.stats.time); if (sec !== lastSec) { lastSec = sec; g.info(`用时 <b>${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}</b>`); }
    if (sharp && !wasSharp) { g.sfx.snap(); g.pop('对焦', V(st.scrX * K, AY + 110, 0), 'good'); }
    wasSharp = sharp; idle += dt;
    let ok = false;
    if (stage < 2) {
      const clear = o.real ? clamp(1 - Math.abs(st.scrX - o.v) / 14, 0, 1) : 0;
      meter('A', clear, sharp ? '对焦' : clear > .6 ? '接近' : '模糊', sharp);
      meter('B', sharp ? o.m / 3 : 0, sharp ? `×${o.m.toFixed(2)}` : '—', sharp && (stage === 0 ? o.m < .95 : o.m >= 2));
      if (stage === 0) {
        ok = sharp && o.m < .95;
        if (sharp && !ok) sayOnce('big', `已对焦，但 ×${o.m.toFixed(2)} 不是缩小像。照相机需要<b>缩小</b>的像。`);
      } else {
        ok = sharp && o.m >= 2;
        if (sharp && !ok) sayOnce('small', `已对焦，放大倍数 ×${o.m.toFixed(2)}，未达到 2 倍。`);
        else if (!o.real && !drag) sayOnce('in', '物距小于焦距，光屏上接不到像。');
      }
    } else {
      const vis = !o.none && !o.real && o.v > -66;
      meter('B', vis ? o.m / 6 : 0, vis ? `×${o.m.toFixed(2)}` : o.real ? '实像' : '过远', vis && o.m >= 3);
      ok = vis && o.m >= 3;
      if (!o.real && !vis && !drag) sayOnce('far', '物体太靠近焦点，虚像远到无法观察。');
      else if (vis && !ok && !drag) sayOnce('more', `观察到正立虚像，×${o.m.toFixed(2)}，未达到 3 倍。`);
    }
    hold = ok ? hold + dt : 0;
    if (hold > .55) {
      g.feedback([`u = ${st.u.toFixed(1)} cm > 2f：倒立、缩小的实像，<b>照相机</b>。`, `f < u = ${st.u.toFixed(1)} cm < 2f：倒立、放大的实像，<b>投影仪</b>。`, `u = ${st.u.toFixed(1)} cm < f：正立、放大的虚像，<b>放大镜</b>。`][stage]);
      drag = null; g.clear();
    }
  }
  function begin(i) { stage = i; hold = 0; said = ''; idle = 0; drag = null; wasSharp = false; exOn = false; st.manual = true; st.hideRays = true; lastSec = -1; }

  const fBench = () => (g.portrait ? {c: [130, 225, 0], w: 980, h: 620, dir: [-1, .48, 1]} : {c: [150, 222, 0], w: 1380, h: 520, dir: [-.42, .3, 1]});
  const fAll = () => (g.portrait ? {c: [60, 225, 0], w: 1150, h: 640, dir: [-1, .48, 1]} : {c: [40, 222, 0], w: 1560, h: 540, dir: [-.42, .3, 1]});
  const fMag = () => (g.portrait ? {c: [-260, 300, 0], w: 760, h: 700, dir: [.9, .3, 1]} : {c: [-300, 300, 0], w: 1080, h: 640, dir: [.8, .22, 1]});
  return {
    root, bg: ['#090d12', '#101822', '#182431'], tags: L.tags,
    stages: [
      {goal: '照相机模式：拖动<b>光屏</b>，在屏上得到清晰的缩小像', hint: '实像只在一个位置清晰。慢慢拖动光屏，看清晰度读数，读数最高时就是像距。', frame: fBench, start() {
        begin(0); st.u = 30; st.scrX = 46; panel(false); hint('可拖动', 'scr');
      }},
      {goal: '投影仪模式：得到清晰的、<b>2 倍以上</b>的放大实像', hint: '物近像远像变大：蜡烛移到 f 和 2f 之间并靠近 f，光屏要往远处移。', frame: fBench, start() {
        begin(1); if (st.u < 18) st.u = 30; st.scrX = clamp(st.scrX, 6, 63); panel(false); hint('可拖动', 'obj');
      }},
      {goal: '放大镜模式：得到 <b>3 倍以上</b>的正立虚像', hint: '物体放在焦点以内才成虚像；越靠近焦点，像越大。', frame: fMag, start() {
        begin(2); st.u = clamp(st.u, 12, 20); st.scrX = 60; panel(true); hint('可拖动', 'obj');
      }},
    ],
    update,
    down(pt, e) {
      if (!pt) return;
      const sc = g.toScreen(V(st.scrX * K, AY, 0)), ob = g.toScreen(V(-st.u * K, AY, 0));
      const what = stage === 2 || Math.hypot(e.clientX - ob.x, e.clientY - ob.y) < Math.hypot(e.clientX - sc.x, e.clientY - sc.y) ? 'obj' : 'scr';
      drag = {what, x0: pt.x, v0: what === 'obj' ? st.u : st.scrX}; idle = 0; g.sfx.tap();
      if (hp) { hp.pin.remove(); hp = null; }
    },
    move(pt) {
      if (!drag || !pt) return;
      const d = (pt.x - drag.x0) / K; idle = 0;
      if (drag.what === 'obj') {
        st.u = clamp(drag.v0 - d, 4, 60);
        const o = optics(); // settle on the exact focus when it is close
        if (stage < 2 && o.real && st.scrX > st.f + 1 && Math.abs(o.v - st.scrX) < 1.1) st.u = st.scrX * st.f / (st.scrX - st.f);
      } else {
        st.scrX = clamp(drag.v0 + d, 6, 63);
        const o = optics(); if (o.real && o.v <= 63 && Math.abs(st.scrX - o.v) < 1.1) st.scrX = o.v;
      }
    },
    up() { drag = null; },
    explain: {
      frame: fAll,
      start() { stage = 3; exOn = true; st.manual = false; st.hideRays = false; exU = 30; if (hp) { hp.pin.remove(); hp = null; } },
      steps: [
        {t: '<b>u > 2f</b>：像在 f 和 2f 之间，倒立、缩小的实像。应用：<b>照相机</b>。', on() { exU = 32; }},
        {t: '<b>f < u < 2f</b>：像距大于 2f，倒立、放大的实像。应用：<b>投影仪</b>。规律：<b>物近像远像变大</b>。', on() { exU = 14; }},
        {t: '<b>u < f</b>：光屏接不到像，透过透镜看到正立、放大的虚像，和物体在同一侧。应用：<b>放大镜</b>。', frame: fMag, on() { exU = 7.2; }},
      ],
    },
    perf: () => { const s = Math.round(g.stats.time); return {score: clamp((150 - s) / 90, 0, 1), text: `三个阶段共用 ${s} 秒`, tip: '60 秒内完成三个阶段，这一项拿满分。'}; },
    dispose() {},
    dbg: () => ({u: st.u, scrX: st.scrX, stage, hold, ...optics()}),
  };
}
