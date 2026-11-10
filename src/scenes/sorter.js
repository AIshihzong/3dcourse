/* Generic "sort the cards into bins" game used by classification knowledge points. */
import * as THREE from 'three';
import {C, MAT, G, V, f0, cyl, box, canvasTex, FONT, textPlate, makeTag, bench, rand} from '../kit.js';

const COLS = [0x3d8fe0, 0xd6182b, 0x2f9e6a, 0x5d6670, 0xf05a23, 0x8a6bd1, 0x16181b];
export function makeSorter(ctx, o) {
  const {items, bins} = o, nb = bins.length, root = G();
  const st = {i: 0, order: [], score: 0, streak: 0, best: 0, kinds: bins.map(() => 0), fly: null, t: 0, last: '', hits: new Set(), shake: 0};
  const spacing = nb > 5 ? 190 : nb > 4 ? 230 : 290, bw = spacing - 30;
  root.add(bench(Math.max(1300, nb * spacing + 160), 820));
  const cardTex = canvasTex(512, 320, () => {});
  const white = MAT.white();
  const card = new THREE.Mesh(new THREE.BoxGeometry(300, 188, 10), [white, white, white, white, new THREE.MeshBasicMaterial({map: cardTex, toneMapped: false}), white]);
  card.castShadow = true; root.add(card);
  const pedestal = cyl(110, 130, 40, MAT.dark()); pedestal.position.set(0, 20, -80); root.add(pedestal);
  const cols = bins.map((_, k) => COLS[k % COLS.length]);
  const binObjs = bins.map((n, k) => {
    const g = G(), x = (k - (nb - 1) / 2) * spacing; g.position.set(x, 0, 250);
    const b = box(bw, 100, 140, MAT.col(cols[k])); b.position.y = 50; b.userData.pick = k; g.add(b);
    const inner = box(bw - 24, 6, 112, MAT.dark()); inner.position.y = 98; g.add(inner);
    const lab = textPlate(n, {h: nb > 5 ? 22 : 28, color: '#ffffff'}); lab.position.set(0, 52, 71); g.add(lab);
    root.add(g); return {g, b};
  });
  const ghost = [];
  const shuffle = () => { st.order = [...items.keys()].sort(() => rand() - .5); st.i = 0; };
  function draw() {
    const p = items[st.order[st.i]];
    cardTex.redraw((g, w, h) => {
      g.fillStyle = '#fbfbfa'; g.fillRect(0, 0, w, h); g.fillStyle = C.red; g.fillRect(0, 0, 14, h);
      g.fillStyle = C.mute; g.font = FONT(600, 22); g.fillText(`第 ${st.i + 1} / ${items.length} 张 · ${o.ask}`, 40, 50);
      g.fillStyle = C.ink; g.font = FONT(800, p[0].length > 5 ? 60 : 76); g.fillText(p[0], 40, 168);
      g.fillStyle = C.grey; g.font = FONT(500, 24); g.fillText(p[3] || '点击下方的分类箱', 40, 250);
    });
  }
  shuffle(); draw();
  function choose(k) {
    if (st.fly || st.i >= items.length) return null;
    const p = items[st.order[st.i]], ok = p[1] === k;
    if (ok) {
      st.score++; st.streak++; st.best = Math.max(st.best, st.streak); st.kinds[k]++; st.hits.add(p[0]);
      st.fly = {t: 0, to: binObjs[k].g.position.clone().add(V(0, 110, 0)), k};
      st.last = `✓ ${p[0]}：${bins[k]}。${p[2]}`;
      o.onRight?.(st, ctx);
    } else { st.streak = 0; st.last = `✗ ${p[0]} 不属于${bins[k]}。提示：${p[2]}`; st.shake = .5; }
    return st.last;
  }
  const tags = {card: makeTag(o.cardTag || '卡片', 'Card')};
  const hex = (c) => '#' + c.toString(16).padStart(6, '0');
  return {
    root, tags, pickables: binObjs.map((b) => b.b), title: o.title, spec: o.spec, bigUnit: '张 · 分对', bigMin: '0', bigMax: String(items.length),
    intro: o.intro, hint: '点击分类箱（或左下角按钮）· 拖动画面旋转', fml: o.fml, fmlTag: o.fmlTag, fmlNote: o.fmlNote,
    legend: o.legend === false ? [] : bins.map((n, k) => [n, hex(cols[k])]), driver: null,
    extra: (el) => {
      el.innerHTML = `<div class="grp" style="margin-top:9px"><span class="cp mu">分类 Sort</span><div class="seg">${bins.map((n, k) => `<button class="tb" type="button" data-k="${k}">${o.short ? o.short[k] : n}</button>`).join('')}</div></div>`;
      el.querySelectorAll('.tb').forEach((b) => b.onclick = () => { const m = choose(+b.dataset.k); if (m) document.getElementById('caption').textContent = m; });
    },
    pick: (k) => (k === null || k === undefined ? null : choose(k)),
    views: [['全景', [0, 1080, 1700], [0, 20, 60]], ['卡片', [0, 330, 640], [0, 200, -80]]], get home() { return this.views[0]; },
    missions: o.missions(st, items),
    update(dt) {
      st.t += dt;
      if (st.fly) {
        st.fly.t += dt * 1.6; const k = Math.min(st.fly.t, 1);
        card.position.lerpVectors(V(0, 190, -80), st.fly.to, k); card.position.y += Math.sin(k * Math.PI) * 160; card.rotation.x = -k * 1.4; card.scale.setScalar(1 - k * .6);
        if (st.fly.t >= 1) {
          const gh = new THREE.Mesh(card.geometry, MAT.col(cols[st.fly.k])); gh.scale.setScalar(.22); gh.position.copy(st.fly.to).add(V((rand() - .5) * (bw - 80), -10 + st.kinds[st.fly.k] * 3, 0)); gh.rotation.x = -Math.PI / 2; root.add(gh); ghost.push(gh);
          st.fly = null; st.i++; card.scale.setScalar(1); card.rotation.x = 0; if (st.i < items.length) draw(); else card.visible = false;
        }
      } else {
        card.position.set(Math.sin(st.shake * 40) * st.shake * 20, 190 + Math.sin(st.t * 1.6) * 6, -80); card.rotation.y = Math.sin(st.t * .7) * .12;
        st.shake = Math.max(0, st.shake - dt);
      }
      tags.card.p.set(0, 300, -80); tags.card.on = card.visible;
    },
    panel() {
      return {big: f0(st.score), bigFrac: st.score / items.length, bigSub: st.i >= items.length ? '全部完成！' : `还剩 ${items.length - st.i} 张`,
        stName: o.stName || '分类统计', stAng: `连对 ${st.streak}`, stBig: st.last ? (st.last[0] === '✓' ? '分对了' : '再想想') : '开始分类', stRed: st.last[0] === '✓',
        rows: bins.map((n, k) => [n, st.kinds[k] > 0, st.kinds[k] + ' / ' + items.filter((it) => it[1] === k).length]), num: f0(st.best), unit: '最高连对<small>Best streak</small>', frac: st.best / items.length,
        calc: o.calc?.(st), calcT: o.calcT};
    },
    reset() { shuffle(); st.score = st.streak = 0; st.kinds = bins.map(() => 0); st.last = ''; st.hits.clear(); card.visible = true; ghost.forEach((g) => root.remove(g)); ghost.length = 0; draw(); },
    quiz: {},
    st,
  };
}
