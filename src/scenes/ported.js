/* Ported from the first prototype: 凸透镜成像 (332) and 物态变化 (317). */
import * as THREE from 'three';
import {C, MAT, phys, std, scene, camera, controls, renderer, keyLight, ground, D2R, TAU, clamp, ease, f1, f2, mesh, unitCyl, stretch, polyLen, polyAt, canvasTex, FONT, makeTag, rand, randn, $} from '../kit.js';
const pressSeg = (id, v) => window.pressSeg(id, v);

export function buildLens(ctx) {
  const K = 12, AY = 210, XB = 66, H = 4; // 12 units / cm, optical axis height, bench half-length (cm), object height (cm)
  const root = new THREE.Group();
  const st = {u: 30, f: 10, fBuilt: 0, scrX: 50, t: 0};
  const X = (cm) => cm * K, P = (x, y) => new THREE.Vector3(x * K, AY + y * K, 0);

  // optical bench
  const rail = mesh(new THREE.BoxGeometry(XB * 2 * K + 60, 26, 74), MAT.dark()); rail.position.y = 45; root.add(rail);
  for (const s of [-1, 1]) { const ft = mesh(new THREE.BoxGeometry(40, 32, 150), MAT.alu()); ft.position.set(s * (XB * K + 10), 16, 0); root.add(ft); }
  const ruler = canvasTex(4096, 96, (g, w, h) => {
    g.fillStyle = '#f6f6f4'; g.fillRect(0, 0, w, h); g.fillStyle = C.ink; g.textAlign = 'center';
    for (let cm = -XB; cm <= XB; cm++) {
      const x = (cm + XB) / (2 * XB) * w, big = cm % 10 === 0, mid = cm % 5 === 0;
      g.fillRect(x - (big ? 2 : 1), 0, big ? 4 : 2, big ? 44 : mid ? 30 : 18);
      if (big) { g.font = FONT(600, 30); g.fillText(String(Math.abs(cm)), x, 84); }
    }
  });
  const rul = mesh(new THREE.PlaneGeometry(XB * 2 * K, 30), new THREE.MeshStandardMaterial({map: ruler, roughness: .6}), false);
  rul.rotation.x = -Math.PI / 2; rul.position.set(0, 58.6, 18); root.add(rul);
  // zone strips (object side: u>2f / f<u<2f / u<f; image side: f<v<2f / v>2f)
  const zoneMat = (c) => new THREE.MeshBasicMaterial({color: c, toneMapped: false});
  const zones = [[C.faint], ['#eba4ab'], [C.red], ['#eba4ab'], [C.faint]].map(([c]) => { const m = mesh(new THREE.BoxGeometry(1, 2, 14), zoneMat(c), false); m.position.set(0, 59, -20); root.add(m); return m; });
  // axis (dashed)
  const axisG = new THREE.BufferGeometry().setFromPoints([P(-XB, 0), P(XB, 0)]);
  const axis = new THREE.Line(axisG, new THREE.LineDashedMaterial({color: C.mute, dashSize: 14, gapSize: 9})); axis.computeLineDistances(); root.add(axis);

  // stand: block on rail + post up to the axis
  function stand(topY) {
    const g = new THREE.Group();
    const blk = mesh(new THREE.BoxGeometry(46, 22, 84), MAT.alu()); blk.position.y = 69; g.add(blk);
    const knob = mesh(new THREE.CylinderGeometry(6, 6, 14, 16), MAT.red()); knob.rotation.x = Math.PI / 2; knob.position.set(0, 69, 48); g.add(knob);
    const post = mesh(unitCyl, MAT.steel()); stretch(post, new THREE.Vector3(0, 80, 0), new THREE.Vector3(0, topY, 0), 5); g.add(post);
    root.add(g); return g;
  }
  // lens
  const lensStand = stand(AY - 5 * K - 6);
  const lensMat = phys({color: 0xeaf4ff, roughness: .02, metalness: 0, transparent: true, opacity: .42, clearcoat: 1, envMapIntensity: 2.2, side: THREE.DoubleSide, depthWrite: false});
  const lens = new THREE.Mesh(new THREE.BufferGeometry(), lensMat); lens.position.y = AY; lens.renderOrder = 2; root.add(lens);
  const ring = mesh(new THREE.TorusGeometry(5 * K + 3, 3.2, 12, 72), MAT.dark()); ring.rotation.y = Math.PI / 2; ring.position.y = AY; root.add(ring);
  function buildLensGeo(f) {
    const R = 5, t0 = .5 + 6 / f, pts = [];
    for (let i = 0; i <= 24; i++) { const r = R * i / 24; pts.push(new THREE.Vector2(r * K, (t0 / 2 * (1 - (r / R) ** 2) + .08) * K)); }
    for (let i = 24; i >= 0; i--) { const r = R * i / 24; pts.push(new THREE.Vector2(r * K, -(t0 / 2 * (1 - (r / R) ** 2) + .08) * K)); }
    lens.geometry.dispose(); lens.geometry = new THREE.LatheGeometry(pts, 72).rotateZ(Math.PI / 2);
  }
  // candle (object) — local origin on the optical axis
  function candle(ghost) {
    const g = new THREE.Group();
    const bodyM = ghost ? phys({color: 0xffffff, transparent: true, opacity: .55, roughness: .3, depthWrite: false}) : MAT.white();
    const body = mesh(new THREE.CylinderGeometry(.9 * K, .9 * K, 3 * K, 32), bodyM, !ghost); body.position.y = 1.5 * K; g.add(body);
    const wick = mesh(new THREE.CylinderGeometry(.08 * K, .08 * K, .4 * K, 6), MAT.dark(), false); wick.position.y = 3.15 * K; g.add(wick);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(.42 * K, 20, 14), MAT.glow(0xff8a2a)); flame.scale.set(1, 1.6, 1); flame.position.y = 3.55 * K; g.add(flame);
    const core = new THREE.Mesh(new THREE.SphereGeometry(.2 * K, 12, 10), MAT.glow(0xfff3c4)); core.scale.set(1, 1.7, 1); core.position.y = 3.45 * K; g.add(core);
    g.userData = {flame, core, bodyM}; return g;
  }
  const objStand = stand(AY - 8);
  const obj = candle(false); obj.position.y = AY; root.add(obj);
  const holder = mesh(new THREE.CylinderGeometry(1.6 * K, 1.6 * K, 8, 32), MAT.dark()); holder.position.y = AY - 4; root.add(holder);
  // screen
  const scrStand = stand(AY - 8 * K);
  const screen = mesh(new THREE.BoxGeometry(6, 16 * K, 16 * K), MAT.white()); screen.position.y = AY; root.add(screen);
  const scrFrame = mesh(new THREE.BoxGeometry(10, 16 * K + 10, 16 * K + 10), MAT.dark()); scrFrame.position.y = AY; scrFrame.scale.set(1, 1, 1); root.add(scrFrame);
  scrFrame.position.x = 4;
  // images
  const realImg = candle(true); realImg.scale.set(.02, -1, 1); root.add(realImg);
  const virtImg = candle(true); root.add(virtImg);
  for (const im of [realImg, virtImg]) im.traverse((o) => { if (o.material) { const was = o.material; o.material = o.material.clone(); if (was === im.userData.bodyM) im.userData.bodyM = o.material; o.material.transparent = true; o.material.depthWrite = false; o.renderOrder = 5; o.castShadow = false; } });
  realImg.userData.bodyM.color.set(0xe0a05a); realImg.userData.bodyM.emissive = new THREE.Color(0x8a4a10); realImg.userData.bodyM.emissiveIntensity = .5;
  // focal markers
  const fMarks = [-2, -1, 1, 2].map((k) => { const m = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 12), MAT.glow(Math.abs(k) === 1 ? C.red : C.ink)); m.position.y = AY; m.userData.k = k; root.add(m); return m; });

  // rays: 3 principal rays, each up to 2 solid segments + 1 dashed construction line
  const RAYC = [C.red, C.orange, C.blue];
  const rays = RAYC.map((c) => {
    const segs = [0, 1].map(() => { const m = new THREE.Mesh(unitCyl, MAT.glow(c)); root.add(m); return m; });
    const dg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const dash = new THREE.Line(dg, new THREE.LineDashedMaterial({color: c, dashSize: 10, gapSize: 8, transparent: true, opacity: .7})); root.add(dash);
    const dash2 = new THREE.Line(dg.clone(), dash.material); root.add(dash2);
    return {segs, dash, dash2, path: [], len: 0};
  });
  const PULSE = 54, pulses = new THREE.InstancedMesh(new THREE.SphereGeometry(3.4, 10, 8), MAT.glow(0xffffff), PULSE); root.add(pulses);
  for (let i = 0; i < PULSE; i++) pulses.setColorAt(i, new THREE.Color(RAYC[i % 3]).lerp(new THREE.Color(0xffffff), .35));
  const dummy = new THREE.Object3D(), tmp = new THREE.Vector3();
  function setDash(line, a, b) { const p = line.geometry.attributes.position; p.setXYZ(0, a.x, a.y, a.z); p.setXYZ(1, b.x, b.y, b.z); p.needsUpdate = true; line.geometry.computeBoundingSphere(); line.computeLineDistances(); line.visible = a.distanceTo(b) > 1; }

  const tags = {
    obj: makeTag('物体', 'Object'), img: makeTag('像', 'Image', true), lens: makeTag('凸透镜', 'Convex lens'), scr: makeTag('光屏', 'Screen'),
    F: makeTag('F'), F2: makeTag('2F'), Fp: makeTag('F′'), F2p: makeTag('2F′'),
  };

  function optics() {
    const {u, f} = st;
    if (Math.abs(u - f) < .25) return {v: Infinity, m: Infinity, real: false, none: true};
    const v = u * f / (u - f); return {v, m: v / u, real: v > 0, none: false};
  }
  const CASES = () => {
    const {u, f} = st, near = (a, b) => Math.abs(a - b) < .26;
    return [
      ['u > 2f · 倒立缩小实像', u > 2 * f && !near(u, 2 * f), '照相机'],
      ['u = 2f · 倒立等大实像', near(u, 2 * f), '测焦距'],
      ['f < u < 2f · 倒立放大实像', u > f && u < 2 * f && !near(u, 2 * f) && !near(u, f), '投影仪'],
      ['u = f · 不成像', near(u, f), '平行光'],
      ['u < f · 正立放大虚像', u < f && !near(u, f), '放大镜'],
    ];
  };

  function update(dt, anim) {
    st.t += anim;
    if (st.fBuilt !== st.f) {
      buildLensGeo(st.f); st.fBuilt = st.f;
      const f = st.f, edges = [-XB, -2 * f, -f, 0, f, 2 * f, XB];
      const segs = [[-XB, -2 * f], [-2 * f, -f], [-f, 0], [f, 2 * f], [2 * f, XB]];
      segs.forEach(([a, b], i) => { zones[i].scale.x = (b - a) * K - 4; zones[i].position.x = (a + b) / 2 * K; });
      for (const m of fMarks) m.position.x = m.userData.k * f * K;
      void edges;
    }
    const {u, f} = st, o = optics();
    const ox = -u * K;
    obj.position.x = ox; objStand.position.x = ox; holder.position.x = ox;
    const fl = 1 + Math.sin(st.t * 23) * .05 + Math.sin(st.t * 37) * .04;
    obj.userData.flame.scale.set(1, 1.6 * fl, 1);
    // screen follows the real image (focusing), otherwise parks at the end
    const target = o.real && o.v < XB - 2 ? o.v : XB - 3;
    st.scrX += (target - st.scrX) * Math.min(1, dt * 5);
    screen.position.x = st.scrX * K; scrFrame.position.x = st.scrX * K + 5; scrStand.position.x = st.scrX * K;
    // real image on the screen: sharp only when the screen sits at v
    const sharp = o.real && o.v < XB - 2 ? clamp(1 - Math.abs(st.scrX - o.v) / 2.5, 0, 1) : 0;
    realImg.visible = sharp > .01;
    if (realImg.visible) {
      const m = Math.min(o.m, 3.6);
      realImg.position.set(st.scrX * K - 9, AY, 0); realImg.scale.set(.03, -m, m);
      realImg.traverse((q) => { if (q.material) q.material.opacity = (q === realImg.userData.flame || q === realImg.userData.core ? 1 : .8) * sharp; });
    }
    // virtual image (u<f): upright, enlarged, on the object side
    virtImg.visible = !o.real && !o.none && o.v > -XB;
    if (virtImg.visible) {
      const m = Math.min(-o.m, 8); virtImg.position.set(o.v * K, AY, 0); virtImg.scale.set(m, m, m);
      virtImg.traverse((q) => { if (q.material) q.material.opacity = q === virtImg.userData.flame || q === virtImg.userData.core ? .55 : .22; });
    }
    lensStand.position.x = 0;
    // principal rays from the flame tip
    const Pt = P(-u, H), img = o.none ? null : P(o.v, -o.m * H);
    const lp = [P(0, H), P(0, 0), o.none ? null : P(0, -H * f / (u - f))];
    const xEnd = o.real ? (o.v < XB - 2 && Math.abs(st.scrX - o.v) < .6 ? o.v - .7 : clamp(Math.max(o.v + 10, o.v * 1.25), 20, XB)) : 46;
    rays.forEach((r, i) => {
      const a = lp[i];
      r.dash.visible = r.dash2.visible = false;
      if (!a || (i === 2 && Math.abs(a.y - AY) > 11 * K)) { r.segs.forEach((s) => s.visible = false); r.path = []; return; }
      let dir;
      if (o.none) dir = new THREE.Vector3().subVectors(P(0, 0), Pt).normalize(); // u=f: everything leaves parallel to the centre ray
      else dir = o.real ? new THREE.Vector3().subVectors(img, a).normalize() : new THREE.Vector3().subVectors(a, img).normalize();
      if (i === 0 && !o.none) dir = new THREE.Vector3().subVectors(P(f, 0), a).normalize();
      if (i === 2) dir = new THREE.Vector3(1, 0, 0);
      if (i === 1) dir = new THREE.Vector3().subVectors(P(0, 0), Pt).normalize();
      const tEnd = (xEnd * K - a.x) / Math.max(dir.x, 1e-3);
      const b = a.clone().addScaledVector(dir, Math.min(tEnd, 5000));
      if (b.y < 40) b.copy(a).addScaledVector(dir, (40 - a.y) / dir.y);
      stretch(r.segs[0], Pt, a, 1.5); stretch(r.segs[1], a, b, 1.5);
      if (!o.real && !o.none && img) setDash(r.dash, a, img); // virtual: backward extensions meet at the image
      if (i === 2 && u < f && !o.none) setDash(r.dash2, P(-f, 0), Pt); // construction line from F through the object
      r.path = [Pt, a, b]; r.len = polyLen(r.path);
    });
    // light pulses travelling along each ray
    for (let i = 0; i < PULSE; i++) {
      const r = rays[i % 3], k = Math.floor(i / 3);
      if (!r.path.length) { dummy.position.set(0, -999, 0); dummy.scale.setScalar(0); }
      else { const s = ((k / (PULSE / 3)) * r.len + st.t * 260) % r.len; polyAt(r.path, s, dummy.position); dummy.scale.setScalar(1); }
      dummy.updateMatrix(); pulses.setMatrixAt(i, dummy.matrix);
    }
    pulses.instanceMatrix.needsUpdate = true;
    // tags
    tags.obj.p.set(ox, AY + 5.4 * K, 0);
    tags.lens.p.set(0, AY + 5.6 * K, 0);
    tags.scr.p.set(st.scrX * K, AY + 8.6 * K, 0);
    tags.img.on = realImg.visible || virtImg.visible;
    if (realImg.visible) tags.img.p.set(st.scrX * K, AY - Math.min(o.m, 3.6) * 4.4 * K - 14, 0), tags.img.set('实像', 'Real image');
    else if (virtImg.visible) tags.img.p.set(o.v * K, AY + Math.min(-o.m, 8) * 4.4 * K + 10, 0), tags.img.set('虚像', 'Virtual image');
    tags.img.el.style.transform = realImg.visible ? 'translate(-50%,0)' : '';
    [['F', -1], ['F2', -2], ['Fp', 1], ['F2p', 2]].forEach(([n, k]) => tags[n].p.set(k * f * K, AY - 16, 0));
    for (const n of ['F', 'F2', 'Fp', 'F2p']) tags[n].el.style.transform = 'translate(-50%,0)', tags[n].el.classList.add('flip');
  }

  function panel() {
    const {u, f} = st, o = optics();
    const big = o.none ? '∞' : f1(Math.abs(o.v));
    const cs = CASES(), cur = cs.find((c) => c[1]) || cs[0];
    const kind = o.none ? '不成像 · 平行光' : o.real ? (Math.abs(o.m - 1) < .02 ? '倒立 · 等大 · 实像' : o.m > 1 ? '倒立 · 放大 · 实像' : '倒立 · 缩小 · 实像') : '正立 · 放大 · 虚像';
    return {
      big, bigFrac: o.none ? 1 : Math.abs(o.v) / XB, bigSub: o.none ? '像距 v → ∞ · 光线平行射出' : o.real ? '像距 v · 光屏上可承接' : '像距 |v| · 虚像与物体同侧，光屏接不到',
      stName: '成像规律 Rule', stAng: `u = ${f1(u)} cm`, stBig: kind, stRed: o.real,
      rows: cs.map(([t, on, app]) => [t, on, app]),
      num: o.none ? '∞' : f2(Math.abs(o.m)), unit: '放大率<small>h′ / h = v / u</small>', frac: o.none ? 1 : Math.abs(o.m) / 5,
      calc: o.none ? `1/u + 1/v = 1/f<br>1/${f1(u)} + 1/v = 1/${f1(f)}<br>⇒ 1/v = <b>0</b>，v → ∞` :
        `1/u + 1/v = 1/f<br>1/${f1(u)} + 1/v = 1/${f1(f)}<br>v = uf/(u−f) = <b>${f1(o.v)} cm</b>${o.real ? '' : '（负号表示虚像）'}<br>h′ = h·|v|/u = 4 × ${f2(Math.abs(o.m))} = <b>${f1(4 * Math.abs(o.m))} cm</b>`,
      chart: {
        x0: 0, x1: 50, y0: -60, y1: 60, xl: 'u / cm', yl: 'v',
        path: (() => { const p = []; for (let x = .5; x <= 50; x += .25) { const v = Math.abs(x - f) < .05 ? null : x * f / (x - f); p.push(v === null || Math.abs(v) > 60 ? null : [x, v]); } return p; })(),
        pt: o.none ? null : [u, clamp(o.v, -60, 60)], vl: [[f, 'f'], [2 * f, '2f']], hl: [[0, ''], [2 * f, '2f'], [f, 'f']],
      },
      cur,
    };
  }

  const views = [['全景', [-760, 560, 1600], [60, 190, 0]], ['透镜', [-430, 330, 560], [-40, 210, 0]], ['光屏', [1150, 340, 640], [420, 210, 0]], ['俯视', [0, 1900, 80], [0, 150, 0]]];
  return {
    key: 'lens', tab: '凸透镜成像', root, st, views, home: views[0], ground: 0,
    kp: {id: 332, chapter: '七下·第2章 对环境的察觉', title: '透镜与凸透镜成像'},
    title: '凸透镜 <i>·</i> 成像规律', spec: '光具座 132 cm &nbsp;•&nbsp; 物高 h = 4 cm &nbsp;•&nbsp; 三条特殊光线', bigUnit: 'CM · 像距 V', bigMin: '0', bigMax: '66',
    fml: '1/u + 1/v = 1/f<br><span class="s">像物高之比 h′/h = v/u</span>', fmlTag: '透镜成像公式', fmlNote: '初中只考<b>成像规律表</b>；公式为课标拓展，帮助理解“物近像远像变大”。虚像的 v 取负值。',
    legend: [['平行于主光轴 → 过焦点', C.red], ['过光心 → 不偏折', C.orange], ['过焦点 → 平行射出', C.blue]],
    driver: {name: '物距 u · Object distance', min: 3, max: 48, step: .5, fmt: (v) => f1(v) + ' cm', get: () => st.u, set: (v) => { st.u = v; },
      scale: () => ['3 cm', `f = ${st.f}`, `2f = ${2 * st.f}`, '48 cm'],
      track: () => [[3, st.f, C.red], [st.f, 2 * st.f, '#eba4ab'], [2 * st.f, 48, C.faint]]},
    extra: (el, refresh) => {
      el.innerHTML = `<div class="grp" style="margin-top:9px"><div class="ph" style="margin:0"><span class="cp mu">焦距 f · Focal length</span><span class="cp" id="vF">${st.f} CM</span></div><input id="sF" type="range" min="5" max="15" step="1" value="${st.f}" aria-label="焦距"></div>
      <div class="note" style="margin-top:6px">焦距越小，透镜越凸、折光本领越强。</div>`;
      $('sF').oninput = (e) => { st.f = +e.target.value; $('vF').textContent = st.f + ' CM'; refresh(); };
    },
    setF(f) { st.f = f; const s = $('sF'); if (s) { s.value = f; $('vF').textContent = f + ' CM'; } },
    reset() { this.setF(10); return 30; },
    update, panel, tags,
    tour: [
      {d: 32, view: 0, cap: '物体在 2 倍焦距以外：光屏上得到倒立、缩小的实像 —— 照相机就是这样成像的。', dur: 6},
      {d: 20, view: 0, cap: '物距等于 2f：像距也等于 2f，成倒立、等大的实像。常用来测凸透镜的焦距。', dur: 5.5},
      {d: 14, view: 2, cap: '物体移到 f 和 2f 之间：像变大、像距变远，光屏要往后退 —— 投影仪的原理。“物近像远像变大”。', dur: 6.5},
      {d: 10, view: 0, cap: '物体放在焦点上：折射光线平行射出，不能成像。', dur: 5},
      {d: 6, view: 1, cap: '物体在焦点以内：光屏上接不到像，透过透镜看到正立、放大的虚像（虚线是光线的反向延长线）—— 放大镜。', dur: 7},
    ],
  };
}

/* =====================================================================
   2 · 欧姆定律与串并联电路  (data.js id 357 · 八上·第4章)
   ===================================================================== */

export function buildMatter(ctx) {
  const root = new THREE.Group();
  const N = 216, B = 112, FLOOR = 64, HT = 250, R = 9.5; // molecules, box half-width, inner floor, inner height, radius
  const st = {s: 6, dir: 1, sPrev: 6, t: 0, auto: 0};
  // hotplate
  const plate = mesh(new THREE.BoxGeometry(330, 46, 330), MAT.dark()); plate.position.y = 23; root.add(plate);
  const coilM = new THREE.MeshBasicMaterial({color: 0x2a2b2e, toneMapped: false});
  for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(40 + i * 30, 3.2, 8, 64), coilM); t.rotation.x = Math.PI / 2; t.position.y = 46.5; root.add(t); }
  const knob = mesh(new THREE.CylinderGeometry(10, 10, 10, 24), MAT.red()); knob.rotation.x = Math.PI / 2; knob.position.set(130, 23, 168); root.add(knob);
  // glass container
  const cont = new THREE.Mesh(new THREE.BoxGeometry(2 * B + 8, HT + 8, 2 * B + 8), MAT.glass(.12)); cont.position.y = FLOOR + HT / 2; cont.renderOrder = 4; root.add(cont);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(cont.geometry), new THREE.LineBasicMaterial({color: C.mute, transparent: true, opacity: .7})); edges.position.copy(cont.position); root.add(edges);
  const base = mesh(new THREE.BoxGeometry(2 * B + 8, 10, 2 * B + 8), MAT.glass(.25)); base.position.y = FLOOR - 5; root.add(base);
  // thermometer
  const TX = B + 78, TB = 70, TT = 400, tY = (T) => TB + 30 + (T + 30) / 160 * (TT - TB - 50);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, TT - TB, 20, 1, true), MAT.glass(.25)); tube.position.set(TX, (TT + TB) / 2, 0); tube.renderOrder = 4; root.add(tube);
  const bulbT = new THREE.Mesh(new THREE.SphereGeometry(14, 20, 14), MAT.glow(C.red)); bulbT.position.set(TX, TB, 0); root.add(bulbT);
  const col = new THREE.Mesh(unitCyl, MAT.glow(C.red)); root.add(col);
  const stand = mesh(new THREE.CylinderGeometry(26, 30, 8, 24), MAT.alu()); stand.position.set(TX, 4, 0); root.add(stand);
  const rod = mesh(unitCyl, MAT.steel()); stretch(rod, new THREE.Vector3(TX, 0, -34), new THREE.Vector3(TX, TT, -34), 3); root.add(rod);
  const clampM = mesh(new THREE.BoxGeometry(34, 10, 10), MAT.dark()); clampM.position.set(TX, TT - 40, -18); clampM.rotation.y = Math.PI / 2; root.add(clampM);
  const scaleTex = canvasTex(128, 1024, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = C.ink; g.font = FONT(600, 30); g.textBaseline = 'middle';
    for (let T = -20; T <= 120; T += 10) { const y = h - (T + 20) / 140 * h * .96 - h * .02; g.fillRect(0, y - 1.5, T % 50 === 0 ? 40 : 24, 3); if (T % 50 === 0 || T === -20 || T === 120) g.fillText(String(T), 48, y); }
  });
  const scH = tY(120) - tY(-20), scY = (tY(120) + tY(-20)) / 2;
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(scH / 8, scH / .96), new THREE.MeshBasicMaterial({map: scaleTex, transparent: true, toneMapped: false}));
  sc.position.set(TX + 13 + scH / 16, scY, 0); root.add(sc);

  // molecules: O + 2 H (instanced)
  const OM = new THREE.InstancedMesh(new THREE.SphereGeometry(R, 18, 12), phys({color: 0xffffff, roughness: .35, clearcoat: .6}), N);
  const HM = new THREE.InstancedMesh(new THREE.SphereGeometry(R * .58, 12, 8), phys({color: 0xffffff, roughness: .35, clearcoat: .6}), 2 * N);
  OM.castShadow = HM.castShadow = true; root.add(OM, HM);
  const cO = new THREE.Color(0xdfe2e6), cH = new THREE.Color(0xf7f7f6), cR = new THREE.Color(C.red), cRh = new THREE.Color('#f08a94');
  for (let i = 0; i < N; i++) { OM.setColorAt(i, i === 0 ? cR : cO); HM.setColorAt(2 * i, i === 0 ? cRh : cH); HM.setColorAt(2 * i + 1, i === 0 ? cRh : cH); }
  const pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), lat = new Float32Array(N * 3), rank = new Float32Array(N), ph = new Float32Array(N * 3), phase = new Uint8Array(N);
  const q = Array.from({length: N}, () => new THREE.Quaternion()), w = Array.from({length: N}, () => new THREE.Vector3(randn(), randn(), randn()).normalize());
  const SP = 22.5;
  { let i = 0; for (let y = 0; y < 6; y++) for (let z = 0; z < 6; z++) for (let x = 0; x < 6; x++, i++) {
    lat[i * 3] = (x - 2.5) * SP + (y % 2) * 3; lat[i * 3 + 1] = FLOOR + R + 2 + y * SP * .92; lat[i * 3 + 2] = (z - 2.5) * SP + (y % 2) * 3;
  } }
  const order = [...Array(N).keys()].sort(() => rand() - .5);
  // the tracked molecule (index 0) sits at a top corner of the ice so it is visible early on
  { const top = 5 * 36 + 5 * 6 + 5; [lat[0], lat[1], lat[2], lat[top * 3], lat[top * 3 + 1], lat[top * 3 + 2]] = [lat[top * 3], lat[top * 3 + 1], lat[top * 3 + 2], lat[0], lat[1], lat[2]]; }
  order.forEach((k, r) => rank[k] = r / N);
  // melt from the outside in: outer lattice sites melt first
  { const d = [...Array(N).keys()].map((i) => [i, Math.max(Math.abs(lat[i * 3]), Math.abs(lat[i * 3 + 2]), Math.abs(lat[i * 3 + 1] - FLOOR - 60)) + rand() * 18]); d.sort((a, b) => b[1] - a[1]); d.forEach(([i], r) => rank[i] = r / N); rank[0] = .05; }
  for (let i = 0; i < N; i++) { pos[i * 3] = lat[i * 3]; pos[i * 3 + 1] = lat[i * 3 + 1]; pos[i * 3 + 2] = lat[i * 3 + 2]; ph[i * 3] = rand() * TAU; ph[i * 3 + 1] = rand() * TAU; ph[i * 3 + 2] = rand() * TAU; q[i].setFromEuler(new THREE.Euler(rand() * TAU, rand() * TAU, rand() * TAU)); }
  // trail of the tracked molecule
  const TR = 90, trG = new THREE.BufferGeometry(); trG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TR * 3), 3));
  const trail = new THREE.Line(trG, new THREE.LineBasicMaterial({color: C.red, transparent: true, opacity: .45})); trail.frustumCulled = false; root.add(trail);
  const trBuf = []; let trT = 0;

  // stage mapping: slider s ∈ [0,100] → temperature & heat (10 g water)
  const M = 10;
  function thermo(s) {
    if (s < 10) { const T = -20 + 20 * s / 10; return {seg: 0, T, Q: 2.1 * M * (T + 20), fm: 0, fb: 0}; }
    if (s < 40) { const k = (s - 10) / 30; return {seg: 1, T: 0, Q: 420 + 3340 * k, fm: k, fb: 0}; }
    if (s < 60) { const T = 100 * (s - 40) / 20; return {seg: 2, T, Q: 3760 + 4.2 * M * T, fm: 1, fb: 0}; }
    if (s < 90) { const k = (s - 60) / 30; return {seg: 3, T: 100, Q: 7960 + 22600 * k, fm: 1, fb: k}; }
    const T = 100 + 20 * (s - 90) / 10; return {seg: 4, T, Q: 30560 + 2.0 * M * (T - 100), fm: 1, fb: 1};
  }
  const tags = {th: makeTag('温度计', 'Thermometer'), mol: makeTag('跟踪 1 个水分子', 'H₂O', true), cont: makeTag('密闭容器', 'Sealed box'), heat: makeTag('加热台', 'Heater')};
  const dummy = new THREE.Object3D(), qa = new THREE.Quaternion(), off1 = new THREE.Vector3(), off2 = new THREE.Vector3();
  const HOFF = [new THREE.Vector3(R * .78, R * .55, 0), new THREE.Vector3(-R * .78, R * .55, 0)];

  function step(h, th) {
    const T = th.T, kT = (T + 273) / 273;
    for (let i = 0; i < N; i++) phase[i] = rank[i] < th.fb - 1e-6 ? 2 : rank[i] < th.fm - 1e-6 ? 1 : 0;
    const vib = 1.2 + clamp((T + 20) / 20, 0, 1) * 2.4;
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      if (phase[i] === 0) {
        const tx = lat[j] + Math.sin(st.t * 31 + ph[j]) * vib, ty = lat[j + 1] + Math.sin(st.t * 27 + ph[j + 1]) * vib, tz = lat[j + 2] + Math.sin(st.t * 29 + ph[j + 2]) * vib;
        const k = Math.min(1, h * 7);
        pos[j] += (tx - pos[j]) * k; pos[j + 1] += (ty - pos[j + 1]) * k; pos[j + 2] += (tz - pos[j + 2]) * k;
        vel[j] = vel[j + 1] = vel[j + 2] = 0;
      } else if (phase[i] === 1) {
        const sg = (150 + T * 2.2) * Math.sqrt(h);
        vel[j] += randn() * sg; vel[j + 1] += randn() * sg - 1100 * h; vel[j + 2] += randn() * sg;
        const d = Math.exp(-4 * h); vel[j] *= d; vel[j + 1] *= d; vel[j + 2] *= d;
      } else {
        const sp = Math.hypot(vel[j], vel[j + 1], vel[j + 2]) || 1, want = 230 * Math.sqrt(kT);
        const k = 1 + (want / sp - 1) * Math.min(1, h * 3);
        vel[j] = vel[j] * k + randn() * 30 * Math.sqrt(h) * 10; vel[j + 1] = vel[j + 1] * k + randn() * 30 * Math.sqrt(h) * 10; vel[j + 2] = vel[j + 2] * k + randn() * 30 * Math.sqrt(h) * 10;
      }
      if (phase[i]) { pos[j] += vel[j] * h; pos[j + 1] += vel[j + 1] * h; pos[j + 2] += vel[j + 2] * h; }
    }
    // overlap resolution (solids are fixed)
    const D = 2 * R + 1, D2 = D * D;
    for (let i = 0; i < N; i++) for (let k = i + 1; k < N; k++) {
      if (!phase[i] && !phase[k]) continue;
      const a = i * 3, b = k * 3, dx = pos[b] - pos[a], dy = pos[b + 1] - pos[a + 1], dz = pos[b + 2] - pos[a + 2], d2 = dx * dx + dy * dy + dz * dz;
      if (d2 >= D2 || d2 < 1e-6) continue;
      const d = Math.sqrt(d2), o = (D - d) / d;
      const wi = phase[i] ? (phase[k] ? .5 : 1) : 0, wk = phase[k] ? (phase[i] ? .5 : 1) : 0;
      pos[a] -= dx * o * wi; pos[a + 1] -= dy * o * wi; pos[a + 2] -= dz * o * wi;
      pos[b] += dx * o * wk; pos[b + 1] += dy * o * wk; pos[b + 2] += dz * o * wk;
      if (phase[i] === 2 || phase[k] === 2) { // elastic-ish exchange of velocity along the contact normal
        const nx = dx / d, ny = dy / d, nz = dz / d, rv = (vel[b] - vel[a]) * nx + (vel[b + 1] - vel[a + 1]) * ny + (vel[b + 2] - vel[a + 2]) * nz;
        if (rv < 0) { vel[a] += rv * nx * wi * 2; vel[a + 1] += rv * ny * wi * 2; vel[a + 2] += rv * nz * wi * 2; vel[b] -= rv * nx * wk * 2; vel[b + 1] -= rv * ny * wk * 2; vel[b + 2] -= rv * nz * wk * 2; }
      }
    }
    // walls
    const lo = -B + R, hi = B - R, yl = FLOOR + R, yh = FLOOR + HT - R;
    for (let i = 0; i < N; i++) {
      if (!phase[i]) continue; const j = i * 3, e = phase[i] === 2 ? 1 : .3;
      if (pos[j] < lo) { pos[j] = lo; vel[j] = Math.abs(vel[j]) * e; } if (pos[j] > hi) { pos[j] = hi; vel[j] = -Math.abs(vel[j]) * e; }
      if (pos[j + 2] < lo) { pos[j + 2] = lo; vel[j + 2] = Math.abs(vel[j + 2]) * e; } if (pos[j + 2] > hi) { pos[j + 2] = hi; vel[j + 2] = -Math.abs(vel[j + 2]) * e; }
      if (pos[j + 1] < yl) { pos[j + 1] = yl; vel[j + 1] = Math.abs(vel[j + 1]) * e; } if (pos[j + 1] > yh) { pos[j + 1] = yh; vel[j + 1] = -Math.abs(vel[j + 1]) * e; }
    }
  }

  function update(dt, anim) {
    if (st.auto && !window.labTour().on) { const ns = clamp(st.s + st.auto * 6 * anim, 0, 100); if (ns === 0 || ns === 100) st.auto = 0; ctx.setDriver(ns); }
    if (Math.abs(st.s - st.sPrev) > 1e-4) { st.dir = st.s > st.sPrev ? 1 : -1; st.sPrev = st.s; }
    const th = thermo(st.s);
    if (anim > 0) { const n = 2, h = Math.min(anim, 1 / 30) / n; for (let k = 0; k < n; k++) { st.t += h; step(h, th); } }
    const kT = (th.T + 273) / 273;
    for (let i = 0; i < N; i++) {
      const j = i * 3, spin = phase[i] === 0 ? 0 : phase[i] === 1 ? 2.5 : 6 * kT;
      if (anim > 0) { if (phase[i] === 0) qa.setFromAxisAngle(w[i], Math.sin(st.t * 9 + ph[j]) * .01); else qa.setFromAxisAngle(w[i], spin * anim); q[i].premultiply(qa); }
      dummy.position.set(pos[j], pos[j + 1], pos[j + 2]); dummy.quaternion.copy(q[i]); dummy.scale.setScalar(1); dummy.updateMatrix(); OM.setMatrixAt(i, dummy.matrix);
      off1.copy(HOFF[0]).applyQuaternion(q[i]); off2.copy(HOFF[1]).applyQuaternion(q[i]);
      dummy.position.set(pos[j] + off1.x, pos[j + 1] + off1.y, pos[j + 2] + off1.z); dummy.updateMatrix(); HM.setMatrixAt(2 * i, dummy.matrix);
      dummy.position.set(pos[j] + off2.x, pos[j + 1] + off2.y, pos[j + 2] + off2.z); dummy.updateMatrix(); HM.setMatrixAt(2 * i + 1, dummy.matrix);
    }
    OM.instanceMatrix.needsUpdate = HM.instanceMatrix.needsUpdate = true;
    // trail
    trT += anim; if (trT > 1 / 30) { trT = 0; trBuf.push(pos[0], pos[1], pos[2]); if (trBuf.length > TR * 3) trBuf.splice(0, 3); }
    const ta = trG.attributes.position; for (let i = 0; i < TR; i++) { const k = Math.min(i * 3, trBuf.length - 3); ta.setXYZ(i, trBuf[k] ?? pos[0], trBuf[k + 1] ?? pos[1], trBuf[k + 2] ?? pos[2]); } ta.needsUpdate = true;
    trG.setDrawRange(0, Math.max(2, trBuf.length / 3));
    trail.visible = phase[0] !== 0;
    // thermometer & heater
    stretch(col, new THREE.Vector3(TX, TB, 0), new THREE.Vector3(TX, tY(th.T), 0), 4.2);
    const heat = st.auto > 0 || (window.labTour().on && st.dir > 0) ? 1 : 0;
    coilM.color.lerp(new THREE.Color(heat ? 0xff4a2a : 0x2a2b2e), Math.min(1, dt * 3));
    tags.th.p.set(TX, TT + 18, 0); tags.th.set('温度计', f1(th.T) + ' °C');
    tags.mol.p.set(pos[0], pos[1] + 18, pos[2]);
    tags.cont.p.set(-B, FLOOR + HT + 12, -B); tags.heat.p.set(-120, 52, 160);
  }
  const PROC = (seg, dir) => [
    dir > 0 ? ['冰 · 升温', '固态'] : ['冰 · 降温', '固态'],
    dir > 0 ? ['熔化 · 吸热', '固液共存'] : ['凝固 · 放热', '固液共存'],
    dir > 0 ? ['水 · 升温', '液态'] : ['水 · 降温', '液态'],
    dir > 0 ? ['汽化（沸腾）· 吸热', '液气共存'] : ['液化 · 放热', '液气共存'],
    dir > 0 ? ['水蒸气 · 升温', '气态'] : ['水蒸气 · 降温', '气态'],
  ][seg];
  function panel() {
    const th = thermo(st.s), [proc, state] = PROC(th.seg, st.dir), on = (n) => proc.startsWith(n);
    const curve = []; for (let s = 0; s <= 100; s += 1) curve.push([s, thermo(s).T]);
    const calc = [
      `Q = c冰·m·Δt<br>= 2.1 J/(g·°C) × 10 g × ${f1(th.T + 20)} °C<br>= <b>${Math.round(th.Q)} J</b>`,
      `熔化吸热，温度保持 <b>0 °C</b> 不变<br>已熔化 ${Math.round(th.fm * 100)} % · 已吸热 <b>${Math.round(th.Q)} J</b>`,
      `Q = c水·m·Δt<br>= 4.2 J/(g·°C) × 10 g × ${f1(th.T)} °C<br>= ${Math.round(th.Q - 3760)} J（累计 <b>${Math.round(th.Q)} J</b>）`,
      `沸腾吸热，温度保持 <b>100 °C</b>（沸点）<br>已汽化 ${Math.round(th.fb * 100)} % · 已吸热 <b>${Math.round(th.Q)} J</b>`,
      `Q = c汽·m·Δt<br>= 2.0 J/(g·°C) × 10 g × ${f1(th.T - 100)} °C<br>累计 <b>${Math.round(th.Q)} J</b>`,
    ][th.seg];
    return {
      big: f1(th.T), bigFrac: (th.T + 20) / 140, bigSub: `${state} · ${proc}`,
      stName: '物态变化 Phase change', stAng: state, stBig: proc, stRed: th.seg === 1 || th.seg === 3,
      rows: [['熔化 固→液', on('熔化'), '吸热'], ['凝固 液→固', on('凝固'), '放热'], ['汽化 液→气', on('汽化'), '吸热'], ['液化 气→液', on('液化'), '放热'], ['升华 固→气', false, '吸热'], ['凝华 气→固', false, '放热']],
      num: Math.round(th.Q), unit: 'J<small>吸收热量</small>', frac: th.Q / 30960,
      calc,
      chart: {x0: 0, x1: 100, y0: -30, y1: 130, xl: '加热进程（示意）', yl: 'T / °C', path: curve, pt: [st.s, th.T], vl: [], hl: [[0, '熔点 0 °C'], [100, '沸点 100 °C']]},
    };
  }
  const views = [['全景', [300, 470, 980], [40, 190, 0]], ['分子', [110, 260, 430], [0, 150, 0]], ['温度计', [560, 330, 500], [170, 230, 0]]];
  return {
    key: 'matter', tab: '物态变化', root, st, views, home: views[0], ground: 0,
    kp: {id: 317, chapter: '七上·第4章 物质的特性', title: '物态变化'},
    title: '物态变化 <i>·</i> 分子模型', spec: '216 个水分子 &nbsp;•&nbsp; 10 g 水 &nbsp;•&nbsp; 1 标准大气压', bigUnit: '°C · 温度 T', bigMin: '−20', bigMax: '120',
    fml: 'Q = c · m · Δt<br><span class="s">c水 = 4.2 × 10³ J/(kg·°C)</span>', fmlTag: '热量', fmlNote: '晶体熔化、液体沸腾时<b>持续吸热但温度不变</b>。滑块按阶段等分，横轴不与热量成正比。',
    legend: [['被跟踪的分子', C.red], ['氧原子 O', '#c9ccd0'], ['氢原子 H', '#e9eaec']],
    driver: {name: '加热进程 · Heating', min: 0, max: 100, step: .1, fmt: (v) => { const t = thermo(v); return f1(t.T) + ' °C'; }, get: () => st.s, set: (v) => { st.s = v; },
      scale: () => ['冰 −20 °C', '熔化', '水', '沸腾', '汽 120 °C'], track: () => [[0, 10, C.faint], [10, 40, '#eba4ab'], [40, 60, C.faint], [60, 90, '#eba4ab'], [90, 100, C.faint]]},
    extra: (el) => {
      el.innerHTML = `<div class="grp" style="margin-top:9px"><span class="cp mu">自动 Auto</span><div class="seg" id="segAuto"><button class="tb" data-v="1">▲ 加热</button><button class="tb" data-v="0">停</button><button class="tb" data-v="-1">▼ 冷却</button></div></div>
      <div class="note" style="margin-top:6px">固态：分子在固定位置振动；液态：可移动但相互靠近；气态：间距大、运动最剧烈。</div>`;
      el.querySelectorAll('#segAuto .tb').forEach((b) => b.onclick = () => { st.auto = +b.dataset.v; pressSeg('segAuto', b.dataset.v); });
      pressSeg('segAuto', st.auto);
    },
    reset() { st.auto = 0; pressSeg('segAuto', 0); return 6; },
    update, panel, tags, thermo,
    tour: [
      {d: 6, view: 0, cap: '−15 °C 的冰：水分子排成整齐的晶格，只在固定位置附近振动。红色的是我们跟踪的那个水分子。', dur: 6},
      {d: 30, view: 1, dTime: 6, cap: '加热到 0 °C 开始熔化：外层分子先挣脱晶格。熔化过程持续吸热，但温度保持 0 °C —— 冰是晶体，有固定熔点。', dur: 7.5},
      {d: 54, view: 0, dTime: 4, cap: '全部熔化成水后继续吸热，温度升高，分子运动越来越剧烈。Q = cmΔt。', dur: 6},
      {d: 80, view: 2, dTime: 7, cap: '100 °C 沸腾：大量分子脱离液体变成水蒸气。沸腾时继续吸热，温度保持在沸点不变。', dur: 8},
      {d: 96, view: 0, dTime: 3, cap: '气态：分子间距很大，向各个方向高速运动，充满整个容器。', dur: 5.5},
      {d: 66, view: 1, dTime: 5, cap: '反过来冷却：水蒸气液化成小水滴并放热 —— 冬天呼出的“白气”就是这样形成的小水滴。', dur: 7},
    ],
  };
}

