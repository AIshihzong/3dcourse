/* 七上·第3章 人类的家园——地球 : 310–314 */
import * as THREE from 'three';
import {C, MAT, G, V, D2R, TAU, clamp, lerp, f0, f1, mesh, box, cyl, sph, rod, canvasTex, FONT, makeTag, bench, rand, curve} from '../kit.js';

/* ----------------------------------------------------------------- 310 地球的形状：海上来船 */
function b310(ctx) {
  const root = G(), st = {d: 1500, flat: false, sawMast: false, sawFlat: false, t: 0};
  const R = 2600, EYE = 46, MAST = 130, HULL = 34;
  const sea = new THREE.Mesh(new THREE.SphereGeometry(R, 160, 80, 0, TAU, 0, .9), MAT.col(0x7fb6e6, {roughness: .25, clearcoat: .8}));
  sea.position.y = -R; sea.receiveShadow = true; root.add(sea);
  const flatSea = mesh(new THREE.BoxGeometry(5200, 20, 1400), MAT.col(0x7fb6e6, {roughness: .25, clearcoat: .8})); flatSea.position.set(1500, -10, 0); root.add(flatSea);
  // observer on a lighthouse
  const tower = cyl(16, 22, EYE, MAT.white()); tower.position.set(0, EYE / 2, 0); root.add(tower);
  const eye = sph(10, MAT.red()); eye.position.set(0, EYE + 10, 0); root.add(eye);
  // ship
  const ship = G(); root.add(ship);
  const hull = box(150, HULL, 46, MAT.dark()); hull.position.y = HULL / 2; ship.add(hull);
  const deck = box(70, 24, 36, MAT.white()); deck.position.set(-20, HULL + 12, 0); ship.add(deck);
  const mast = cyl(3, 3, MAST - HULL, MAT.steel()); mast.position.y = HULL + (MAST - HULL) / 2; ship.add(mast);
  const flag = box(36, 22, 2, MAT.red()); flag.position.set(18, MAST - 12, 0); ship.add(flag);
  const sight = rod(MAT.glow(C.red), 1.4); root.add(sight);
  const place = (s) => { if (st.flat) return {p: V(s, 0, 0), a: 0}; const a = s / R; return {p: V(R * Math.sin(a), R * Math.cos(a) - R, 0), a}; };
  const dEye = () => Math.sqrt(2 * R * (EYE + 10));
  const hidden = () => st.flat ? 0 : st.d <= dEye() ? 0 : (st.d - dEye()) ** 2 / (2 * R);
  const tags = {eye: makeTag('观察者', 'Observer', true), ship: makeTag('帆船', ''), hor: makeTag('地平线', 'Horizon')};
  const KM = 0.012; // display scale: 1 unit ≈ 0.012 km
  return {
    root, tags, title: '海上来船 <i>·</i> 地球是球体', spec: '先看到桅杆，再看到船身 · 曲率已放大便于观察',
    bigUnit: '% · 船身露出水面（看得见的部分）', bigMin: '0', bigMax: '100', intro: '帆船从远处驶来。拖动滑块让它靠近，注意先出现的是哪一部分。',
    fml: '地球半径 ≈ 6371 km<br><span class="s">赤道周长约 4 万千米</span>', fmlTag: '地球的大小', fmlNote: '证据：海上来船先见桅杆、月食时地球的影子是圆弧形、麦哲伦环球航行、卫星照片。',
    legend: [['观察者的视线', C.red]],
    driver: {name: '帆船离观察者的距离（示意）', min: 150, max: 2200, step: 5, fmt: (v) => f1(v * KM) + ' km', get: () => st.d, set: (v) => { st.d = v; }, scale: () => ['近', '地平线', '远']},
    extra: (el) => {
      el.innerHTML = `<div class="grp" style="margin-top:9px"><span class="cp mu">假设 Model</span><div class="seg" id="segF"><button class="tb" data-v="0" type="button">球形地球</button><button class="tb" data-v="1" type="button">平面地球</button></div></div><div class="note" style="margin-top:6px">比较两种假设下看到的情景，哪一个和真实观察相符？</div>`;
      el.querySelectorAll('#segF .tb').forEach((b) => b.onclick = () => { st.flat = b.dataset.v === '1'; window.pressSeg('segF', +st.flat); if (st.flat && st.d > 1200) st.sawFlat = true; });
      window.pressSeg('segF', 0);
    },
    views: [['观察者', [-260, 140, 260], [900, 20, 0]], ['侧面', [700, 500, 1700], [800, -60, 0]], ['船', [1200, 180, 360], [st.d, 40, 0]]], get home() { return this.views[1]; },
    missions: [
      {t: '让帆船只露出桅杆、船身还在地平线下', k: '海上来船先见桅杆后见船身', check: () => { const h = hidden(); return h > HULL + 4 && h < MAST - 10; }},
      {t: '让帆船完整出现在海面上', k: '地球是一个球体', check: () => hidden() < 1 && st.d > 400 && !st.flat},
      {t: '切换到“平面地球”，看远处的船是否整体可见', k: '用证据检验假设', check: () => st.flat && st.d > 1200},
    ],
    update(dt, anim) {
      st.t += anim;
      sea.visible = !st.flat; flatSea.visible = st.flat;
      const {p, a} = place(st.d); ship.position.copy(p); ship.rotation.z = -a; ship.position.y += Math.sin(st.t * 1.5) * 1.5;
      // tangent line from the eye to the horizon, extended
      const e = V(0, EYE + 10, 0);
      if (st.flat) sight.set(e, V(2600, EYE + 10 - 0.02 * 2600, 0));
      else { const ta = Math.acos(R / (R + EYE + 10)), tp = V(R * Math.sin(ta), R * Math.cos(ta) - R, 0), dir = tp.clone().sub(e).normalize(); sight.set(e, e.clone().addScaledVector(dir, 2600)); tags.hor.p.copy(tp).add(V(0, 0, 0)); }
      tags.hor.on = !st.flat; tags.eye.p.set(0, EYE + 30, 0); tags.ship.p.copy(ship.position).add(V(0, MAST + 20, 0)); tags.ship.set('帆船', f1(st.d * KM) + ' km');
    },
    panel() {
      const h = hidden(), vis = clamp((MAST - h) / MAST, 0, 1), mastOnly = h > HULL && h < MAST;
      return {big: f0(vis * 100), bigFrac: vis, bigSub: st.flat ? '平面上：远处的船整体变小，不会“先见桅杆”' : h >= MAST ? '船完全在地平线以下，看不见' : mastOnly ? '只看到桅杆，船身被弯曲的海面挡住' : '整艘船都看得见',
        stName: '观察 Observation', stAng: st.flat ? '平面假设' : '球形假设', stBig: h >= MAST ? '看不见' : mastOnly ? '只见桅杆' : '看见整艘船', stRed: mastOnly,
        rows: [['桅杆顶', h < MAST, h < MAST ? '可见' : '—'], ['桅杆中部', h < (MAST + HULL) / 2, ''], ['船身', h < HULL, h < HULL ? '可见' : '—']],
        num: f1(dEye() * KM), unit: 'km · 观察者能看到的地平线距离<small>站得越高看得越远</small>', frac: dEye() / 2200,
        calc: `被挡住的高度 ≈ (d − d₀)² ÷ 2R<br>= ${f0(h)} 单位（桅杆高 ${MAST}）<br>能看到：<b>${mastOnly ? '桅杆' : h >= MAST ? '无' : '整艘船'}</b>`, calcT: '几何解释'};
    },
    reset() { st.flat = false; window.pressSeg('segF', 0); return 1500; },
    tour: [{d: 2100, view: 0, cap: '帆船在很远的地方，完全被弯曲的海面挡住了。', dur: 4}, {d: 1300, dTime: 5, view: 0, cap: '慢慢驶近：先看到桅杆顶……', dur: 6}, {d: 500, dTime: 4, cap: '……然后才看到船身。这说明地球表面是弯曲的。', dur: 6}],
    quiz: {},
  };
}

/* ----------------------------------------------------------------- 311 地球仪与经纬网 */
const LAND = [
  [[-168, 66], [-140, 70], [-95, 72], [-80, 62], [-60, 55], [-66, 45], [-80, 32], [-81, 25], [-97, 26], [-105, 20], [-90, 15], [-83, 9], [-78, 8], [-95, 17], [-110, 24], [-118, 34], [-125, 42], [-124, 49], [-135, 58], [-150, 60], [-165, 60]],
  [[-80, 10], [-60, 10], [-50, 0], [-35, -6], [-40, -22], [-48, -28], [-58, -38], [-65, -55], [-73, -50], [-71, -30], [-80, -6]],
  [[-10, 36], [-9, 43], [-2, 48], [5, 52], [10, 57], [5, 62], [20, 70], [40, 68], [60, 70], [80, 73], [105, 77], [140, 72], [170, 68], [180, 65], [160, 58], [140, 50], [130, 42], [122, 40], [121, 30], [110, 20], [105, 10], [100, 14], [95, 16], [80, 8], [72, 20], [57, 25], [50, 30], [35, 30], [28, 36], [22, 40], [12, 44], [3, 42]],
  [[-17, 15], [-10, 28], [0, 36], [11, 37], [30, 31], [33, 28], [43, 12], [51, 11], [40, -5], [40, -15], [32, -28], [20, -35], [15, -25], [12, -6], [8, 4], [-8, 5], [-15, 10]],
  [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [153, -28], [150, -37], [140, -38], [132, -32], [115, -34]],
  [[-50, 60], [-20, 70], [-20, 82], [-60, 82], [-70, 76]],
];
const lonlat = (lon, lat, r) => { const ph = (lon + 180) * D2R, th = (90 - lat) * D2R; return V(-r * Math.cos(ph) * Math.sin(th), r * Math.cos(th), r * Math.sin(ph) * Math.sin(th)); };
function b311(ctx) {
  const root = G(), st = {lon: 60, lat: 10, spin: 0, t: 0};
  root.add(bench(1100, 800));
  const tex = canvasTex(2048, 1024, (g, w, h) => {
    g.fillStyle = '#8fc4ee'; g.fillRect(0, 0, w, h);
    const X = (lon) => (lon + 180) / 360 * w, Y = (lat) => (90 - lat) / 180 * h;
    g.fillStyle = '#e6dcc4'; for (const poly of LAND) { g.beginPath(); poly.forEach(([lo, la], i) => i ? g.lineTo(X(lo), Y(la)) : g.moveTo(X(lo), Y(la))); g.closePath(); g.fill(); }
    g.fillRect(0, Y(-66), w, h - Y(-66));
    g.strokeStyle = 'rgba(22,24,27,.35)'; g.lineWidth = 2;
    for (let lo = -180; lo <= 180; lo += 15) { g.beginPath(); g.moveTo(X(lo), 0); g.lineTo(X(lo), h); g.stroke(); }
    for (let la = -75; la <= 75; la += 15) { g.beginPath(); g.moveTo(0, Y(la)); g.lineTo(w, Y(la)); g.stroke(); }
    g.strokeStyle = C.red; g.lineWidth = 5; g.beginPath(); g.moveTo(0, Y(0)); g.lineTo(w, Y(0)); g.stroke(); g.beginPath(); g.moveTo(X(0), 0); g.lineTo(X(0), h); g.stroke();
    g.strokeStyle = 'rgba(22,24,27,.7)'; g.setLineDash([16, 12]); for (const lo of [-20, 160]) { g.beginPath(); g.moveTo(X(lo), 0); g.lineTo(X(lo), h); g.stroke(); }
    g.setLineDash([]); g.fillStyle = C.red; g.beginPath(); g.arc(X(120), Y(30), 9, 0, TAU); g.fill();
  });
  const stand = G(); root.add(stand);
  const base = cyl(120, 150, 30, MAT.dark()); base.position.y = 15; stand.add(base);
  const post = cyl(10, 10, 120, MAT.brass()); post.position.y = 90; stand.add(post);
  const tilt = G(); tilt.position.y = 420; tilt.rotation.z = -23.5 * D2R; stand.add(tilt);
  const ring = mesh(new THREE.TorusGeometry(300, 5, 10, 96, Math.PI * 1.2), MAT.brass()); ring.rotation.z = -Math.PI * .1; tilt.add(ring);
  const globe = G(); tilt.add(globe);
  const R = 270;
  const ball = mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.MeshStandardMaterial({map: tex, roughness: .55})); globe.add(ball);
  const axis = rod(MAT.steel(), 3); axis.set(V(0, -R - 40, 0), V(0, R + 40, 0)); tilt.add(axis);
  const pin = G(); globe.add(pin);
  const pinHead = sph(9, MAT.red()); pin.add(pinHead);
  const latRing = new THREE.Mesh(new THREE.TorusGeometry(R, 1.6, 6, 96), MAT.glow(C.red)); latRing.rotation.x = Math.PI / 2; globe.add(latRing); let latBuilt = null;
  const lonRing = new THREE.Mesh(new THREE.TorusGeometry(R + 1.5, 1.6, 6, 96, Math.PI), MAT.glow(C.orange)); globe.add(lonRing);
  const tags = {pin: makeTag('', '', true), N: makeTag('北极', 'N'), S: makeTag('南极', 'S')};
  const hemiEW = () => (st.lon >= -20 && st.lon <= 160 ? '东半球' : '西半球');
  const band = () => Math.abs(st.lat) < 30 ? '低纬度' : Math.abs(st.lat) < 60 ? '中纬度' : '高纬度';
  const lonTxt = () => Math.abs(st.lon) < .5 ? '0°' : Math.abs(st.lon) > 179.5 ? '180°' : Math.abs(st.lon) + '°' + (st.lon > 0 ? 'E' : 'W');
  const latTxt = () => Math.abs(st.lat) < .5 ? '0°' : Math.abs(st.lat) + '°' + (st.lat > 0 ? 'N' : 'S');
  return {
    root, tags, title: '地球仪 <i>·</i> 经纬网', spec: '经线指示南北方向 · 纬线指示东西方向',
    bigUnit: '经度 · 纬度', bigMin: '', bigMax: '', intro: '拖动滑块改变经度，用左下角滑块改变纬度，把红色定位点移到你想去的地方。',
    fml: '东西半球界线：<br>20°W 和 160°E', fmlTag: '半球划分', fmlNote: '南北半球以<b>赤道</b>为界；0°–30° 低纬度，30°–60° 中纬度，60°–90° 高纬度。',
    legend: [['纬线（所在纬度）', C.red], ['经线（所在经度）', C.orange]],
    driver: {name: '经度 · Longitude', min: -180, max: 180, step: 1, fmt: () => lonTxt(), get: () => st.lon, set: (v) => { st.lon = v; }, scale: () => ['180°', '90°W', '0°', '90°E', '180°'], track: () => [[-20, 160, '#f0b9be']]},
    extra: (el) => {
      el.innerHTML = `<div class="grp" style="margin-top:9px"><div class="ph" style="margin:0"><span class="cp mu">纬度 Latitude</span><span class="cp" id="vLat"></span></div><input id="sLat" type="range" min="-90" max="90" step="1" value="${st.lat}" aria-label="纬度"></div>`;
      const s = el.querySelector('#sLat'), v = el.querySelector('#vLat'), u = () => { v.textContent = latTxt(); }; u();
      s.oninput = () => { st.lat = +s.value; u(); }; st.setLat = (x) => { st.lat = x; s.value = x; u(); };
    },
    views: [['全景', [0, 520, 1150], [0, 400, 0]], ['近看', [0, 430, 720], [0, 420, 0]]], get home() { return this.views[0]; },
    missions: [
      {t: '找到杭州：约 120°E、30°N', k: '用经纬度确定位置', check: () => Math.abs(st.lon - 120) <= 3 && Math.abs(st.lat - 30) <= 3},
      {t: '找一个经度是东经、却在西半球的地方', k: '东西半球的划分（20°W、160°E）', check: () => st.lon > 160},
      {t: '把定位点移到南半球的高纬度地区', k: '高中低纬度与南北半球', check: () => st.lat <= -60},
    ],
    update(dt, anim) {
      st.t += anim;
      // keep the chosen point turned toward the viewer
      const want = -(st.lon + 90) * D2R; st.spin += ((want - st.spin + Math.PI * 3) % TAU - Math.PI) * Math.min(1, dt * 3); globe.rotation.y = st.spin;
      const p = lonlat(st.lon, st.lat, R + 6); pin.position.copy(p);
      const rr = R * Math.cos(st.lat * D2R); if (latBuilt !== st.lat) { latRing.geometry.dispose(); latRing.geometry = new THREE.TorusGeometry(rr + 1.5, 1.6, 6, 96); latBuilt = st.lat; } latRing.position.y = R * Math.sin(st.lat * D2R);
      lonRing.rotation.set(0, (st.lon + 180) * D2R + Math.PI / 2 + Math.PI, 0); lonRing.rotation.order = 'YXZ'; lonRing.rotation.z = Math.PI / 2;
      lonRing.rotation.set(0, -(st.lon + 180) * D2R + Math.PI, Math.PI / 2, 'YXZ');
      tilt.updateMatrixWorld(); const w = pin.getWorldPosition(V()); root.worldToLocal(w); tags.pin.p.copy(w).add(V(0, 14, 0)); tags.pin.set(`${lonTxt()} · ${latTxt()}`, `${hemiEW()} · ${st.lat >= 0 ? '北半球' : '南半球'}`);
      const n = V(0, R + 40, 0); tilt.localToWorld(n); root.worldToLocal(n); tags.N.p.copy(n); const s = V(0, -R - 40, 0); tilt.localToWorld(s); root.worldToLocal(s); tags.S.p.copy(s); tags.S.below = true;
    },
    panel() {
      return {big: `${lonTxt()}`, bigFrac: (st.lon + 180) / 360, bigSub: `纬度 ${latTxt()} · ${band()}`,
        stName: '位置判断', stAng: hemiEW(), stBig: `${st.lat >= 0 ? '北' : '南'}半球 · ${hemiEW()}`, stRed: true,
        rows: [['东经 E：向东度数增大', st.lon > 0, ''], ['西经 W：向西度数增大', st.lon < 0, ''], ['北纬 N：赤道以北', st.lat > 0, ''], ['南纬 S：赤道以南', st.lat < 0, ''], [band(), true, '']],
        num: f0(Math.cos(st.lat * D2R) * 40076 / 1000) + 'k', unit: 'km · 这条纬线的长度<small>纬度越高纬线越短</small>', frac: Math.cos(st.lat * D2R),
        calc: `纬线长度 ≈ 赤道长度 × cos(纬度)<br>= 40076 km × cos ${Math.abs(st.lat)}°<br>≈ <b>${f0(40076 * Math.cos(st.lat * D2R))} km</b>`, calcT: '纬线长度（拓展）'};
    },
    reset() { st.setLat?.(10); return 60; },
    tour: [{d: 120, run() { st.setLat?.(30); }, cap: '杭州大约在 120°E、30°N：东半球、北半球、中纬度。', dur: 6}, {d: 170, run() { st.setLat?.(0); }, cap: '170°E 虽然是东经，却在西半球。东西半球的界线是 20°W 和 160°E。', dur: 7}],
    quiz: {},
  };
}

/* ----------------------------------------------------------------- 312 地形与等高线地形图 */
function b312(ctx) {
  const root = G(), st = {flat: 0, cut: 300, picked: new Set(), t: 0};
  const W = 1000, D = 760, N = 110, VS = .32; // world size, grid, vertical scale (units per metre)
  const hgt = (x, z) => {
    const g = (cx, cz, s, h) => h * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (2 * s * s));
    let y = 60 + g(-190, -40, 150, 840) + g(200, 30, 140, 640) + g(10, -10, 120, 220);
    y += 380 / (1 + Math.exp(-(z - 230) / 14)) * Math.exp(-((x + 40) ** 2) / (2 * 160 * 160)); // a cliff wall on the south side
    return y;
  };
  const geo = new THREE.PlaneGeometry(W, D, N, N); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, H0 = new Float32Array(pos.count), col = new Float32Array(pos.count * 3);
  const band = [[0, 0x9ccc7a], [200, 0xcfe0a0], [400, 0xe6d79a], [600, 0xd8b07a], [800, 0xb98a5e]];
  for (let i = 0; i < pos.count; i++) {
    const h = hgt(pos.getX(i), pos.getZ(i)); H0[i] = h;
    let c = band[0][1]; for (const [lv, cc] of band) if (h >= lv) c = cc; const cc = new THREE.Color(c); col.set([cc.r, cc.g, cc.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const terrain = mesh(geo, new THREE.MeshStandardMaterial({vertexColors: true, roughness: .85, flatShading: false})); root.add(terrain);
  const side = mesh(new THREE.BoxGeometry(W, 20, D), MAT.dark()); side.position.y = -10; root.add(side);
  // contour lines via marching squares
  const LV = [100, 200, 300, 400, 500, 600, 700, 800, 900];
  const contours = LV.map((lv) => {
    const seg = [], dx = W / N, dz = D / N, at = (i, j) => hgt(-W / 2 + i * dx, -D / 2 + j * dz);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
      const pts = [];
      const edge = (h1, h2, x1, z1, x2, z2) => { if ((h1 < lv) !== (h2 < lv)) { const t = (lv - h1) / (h2 - h1); pts.push([x1 + (x2 - x1) * t, z1 + (z2 - z1) * t]); } };
      const x0 = -W / 2 + i * dx, z0 = -D / 2 + j * dz;
      edge(a, b, x0, z0, x0 + dx, z0); edge(b, c, x0 + dx, z0, x0 + dx, z0 + dz); edge(c, d, x0 + dx, z0 + dz, x0, z0 + dz); edge(d, a, x0, z0 + dz, x0, z0);
      if (pts.length >= 2) seg.push(pts[0], pts[1]); if (pts.length === 4) seg.push(pts[2], pts[3]);
    }
    const arr = new Float32Array(seg.length * 3); seg.forEach(([x, z], k) => arr.set([x, 0, z], k * 3));
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const line = new THREE.LineSegments(g, new THREE.LineBasicMaterial({color: lv % 500 === 0 ? 0x16181b : 0x5d6670, transparent: true, opacity: .85})); line.userData.lv = lv; root.add(line); return line;
  });
  const cutPlane = new THREE.Mesh(new THREE.PlaneGeometry(W, D), MAT.fade(0x3d8fe0, .18)); cutPlane.rotation.x = -Math.PI / 2; root.add(cutPlane);
  const FEAT = [['山顶', -190, -40, '等高线闭合，中间高四周低'], ['鞍部', 0, -10, '两个山顶之间相对低洼的部位'], ['陡崖', -40, 232, '多条等高线重合在一起'], ['缓坡', 380, -200, '等高线稀疏，坡度缓'], ['陡坡', -190, 130, '等高线密集，坡度陡']];
  const feats = FEAT.map(([n, x, z], k) => { const m = new THREE.Mesh(new THREE.SphereGeometry(26, 12, 8), MAT.fade(0xffffff, .001)); m.userData.pick = k; m.position.set(x, hgt(x, z) * VS, z); root.add(m); return m; });
  const tags = Object.fromEntries(FEAT.map(([n], k) => [k, makeTag(n, '')]));
  const ys = () => lerp(VS, .004, st.flat);
  return {
    root, tags, pickables: feats, title: '等高线 <i>·</i> 地形图', spec: '把立体的山“压平”，就得到等高线地形图',
    bigUnit: 'M · 截面海拔', bigMin: '0', bigMax: '900', intro: '拖动滑块把山压平，看等高线怎样变成地形图。点击山上的标记认识山顶、鞍部、陡崖。',
    fml: '相对高度 = 海拔差<br><span class="s">山顶 A 900 m − 山顶 B 700 m = 200 m</span>', fmlTag: '海拔与相对高度', fmlNote: '等高线<b>越密集坡越陡</b>，越稀疏坡越缓；多条等高线重合处是陡崖。',
    legend: [['等高距 100 m', C.grey], ['截面', '#3d8fe0']],
    driver: {name: '压平成地形图 · Flatten', min: 0, max: 1, step: .01, fmt: (v) => v > .95 ? '等高线地形图' : v < .05 ? '立体地形' : Math.round(v * 100) + '%', get: () => st.flat, set: (v) => { st.flat = v; }, scale: () => ['立体', '地形图']},
    extra: (el) => {
      el.innerHTML = `<div class="grp" style="margin-top:9px"><div class="ph" style="margin:0"><span class="cp mu">截面海拔 Level</span><span class="cp" id="vCut"></span></div><input id="sCut" type="range" min="0" max="900" step="100" value="${st.cut}" aria-label="截面海拔"></div>`;
      const s = el.querySelector('#sCut'), v = el.querySelector('#vCut'), u = () => { v.textContent = st.cut + ' m'; }; u(); s.oninput = () => { st.cut = +s.value; u(); };
    },
    pick: (k) => { if (k === null || k === undefined) return null; st.picked.add(k); return `<b>${FEAT[k][0]}</b>：${FEAT[k][3]}`; },
    views: [['全景', [0, 820, 1100], [0, 60, 40]], ['俯视', [0, 1500, 10], [0, 0, 0]], ['侧面', [1100, 380, 380], [0, 120, 0]]], get home() { return this.views[0]; },
    missions: [
      {t: '把山压平，得到等高线地形图', k: '等高线地形图的绘制原理', check: () => st.flat > .95},
      {t: '在山上找到山顶和鞍部', k: '在地形图上判读山顶、鞍部', check: () => st.picked.has(0) && st.picked.has(1)},
      {t: '找到陡崖，并比较陡坡与缓坡', k: '等高线疏密与坡度', check: () => st.picked.has(2) && st.picked.has(3) && st.picked.has(4)},
    ],
    update(dt) {
      const s = ys();
      for (let i = 0; i < pos.count; i++) pos.setY(i, H0[i] * s); pos.needsUpdate = true; geo.computeVertexNormals();
      for (const c of contours) { c.position.y = c.userData.lv * s + 1.5; c.material.color.set(c.userData.lv === st.cut ? C.red : c.userData.lv % 500 === 0 ? 0x16181b : 0x5d6670); }
      cutPlane.position.y = st.cut * s + 1; cutPlane.visible = st.flat < .9;
      FEAT.forEach(([n, x, z], k) => { const y = hgt(x, z) * s; feats[k].position.y = y; tags[k].p.set(x, y + 14, z); tags[k].set(n, st.picked.has(k) ? '✓' : '点击'); });
      side.scale.y = 1;
    },
    panel() {
      return {big: f0(st.cut), bigFrac: st.cut / 900, bigSub: `红色等高线 = ${st.cut} m`,
        stName: '地形部位', stAng: `已认出 ${st.picked.size} / 5`, stBig: st.flat > .95 ? '等高线地形图' : '立体地形', stRed: st.flat > .95,
        rows: FEAT.map(([n, , , d], k) => [n, st.picked.has(k), st.picked.has(k) ? '✓' : '']), num: '100', unit: 'm · 等高距<small>相邻等高线的高度差</small>', frac: .3,
        calc: `山顶 A 海拔 900 m<br>山顶 B 海拔 700 m<br>相对高度 = 900 − 700 = <b>200 m</b>`};
    },
    reset() { st.picked.clear(); return 0; },
    tour: [{d: 0, view: 0, cap: '这是一座有两个山顶的山。等高线把海拔相同的点连成线。', dur: 5}, {d: 1, dTime: 4, view: 1, cap: '把山压平、从正上方看，就是等高线地形图。', dur: 6}, {d: 0, dTime: 3, view: 2, cap: '南侧等高线重合的地方是陡崖。', dur: 5}],
    quiz: {},
  };
}

/* ----------------------------------------------------------------- 313 火山与地震：板块挤压 */
function b313(ctx) {
  const root = G(), st = {s: 20, quake: 0, quakes: 0, erupt: 0, epi: false, act: -1, t: 0, shakeAmp: 0};
  const L = 1300;
  const crust = G(); root.add(crust);
  const layers = [[0x6b5a4a, 120], [0x8a7560, 90], [0xa98f72, 60]];
  const plateL = G(), plateR = G(); crust.add(plateL, plateR);
  let y = 0; for (const [c, h] of layers) { for (const [g, s] of [[plateL, -1], [plateR, 1]]) { const b = box(L / 2, h, 400, MAT.col(c, {roughness: .9})); b.position.set(s * L / 4, y + h / 2, 0); g.add(b); } y += h; }
  const mantle = box(L + 200, 80, 420, MAT.col(0xd6542b, {roughness: .6})); mantle.position.y = -40; root.add(mantle);
  // volcano on the right plate
  const VX = 300, TOP = y;
  const cone = mesh(new THREE.CylinderGeometry(40, 230, 260, 48, 1, true), MAT.col(0x6b5a4a, {roughness: .9, side: THREE.DoubleSide})); cone.position.set(VX, TOP + 130, 0); root.add(cone);
  const conduit = cyl(16, 16, 1, MAT.glow(0xff5a1f)); root.add(conduit);
  const chamber = sph(70, MAT.glow(0xff6a2a)); chamber.scale.set(1.6, .7, 1); chamber.position.set(VX, 120, 0); root.add(chamber);
  const NP = 160, lava = new THREE.InstancedMesh(new THREE.SphereGeometry(9, 8, 6), MAT.glow(0xff7a2a), NP); root.add(lava);
  const lp = Array.from({length: NP}, () => ({p: V(VX, -999, 0), v: V(), life: 0}));
  const smoke = new THREE.InstancedMesh(new THREE.SphereGeometry(30, 10, 8), MAT.fade(0x5d6670, .25), 40); root.add(smoke);
  const sp = Array.from({length: 40}, () => ({p: V(VX, -999, 0), life: 0}));
  // earthquake focus (震源) and epicenter (震中)
  const focus = sph(14, MAT.red()); focus.position.set(-60, 90, 0); root.add(focus);
  const rings = Array.from({length: 3}, () => { const r = new THREE.Mesh(new THREE.TorusGeometry(1, 3, 6, 64), MAT.fade(C.red, .6)); r.rotation.x = Math.PI / 2; r.position.set(-60, TOP + 2, 0); root.add(r); return r; });
  const houses = G(); root.add(houses);
  for (let i = 0; i < 5; i++) { const h = box(50, 50, 50, MAT.white()); h.position.set(-520 + i * 90, TOP + 25, 120); const rf = mesh(new THREE.ConeGeometry(42, 30, 4), MAT.red()); rf.rotation.y = Math.PI / 4; rf.position.y = 40; h.add(rf); houses.add(h); }
  const dummy = new THREE.Object3D();
  const tags = {focus: makeTag('震源', 'Focus', true), epi: makeTag('震中', 'Epicenter', true), vol: makeTag('火山口', 'Crater'), mag: makeTag('岩浆', 'Magma'), plates: makeTag('板块交界处', 'Plate boundary')};
  const ACTS = ['躲到坚固的桌子下', '乘电梯快速下楼', '跑到阳台上跳下', '站在高大的玻璃窗边'];
  return {
    root, tags, title: '火山与地震 <i>·</i> 板块运动', spec: '火山和地震多发生在板块交界地带 · 地壳运动的表现',
    bigUnit: '% · 地壳中积累的能量（示意）', bigMin: '0', bigMax: '100', intro: '拖动滑块让两个板块相互挤压，能量积累到一定程度会发生地震，岩浆也会冲出地面形成火山喷发。',
    fml: '地球内部能量 → 地壳运动<br><span class="s">火山、地震是地壳运动的表现</span>', fmlTag: '内力作用', fmlNote: '地震时<b>不能乘电梯</b>，在室内要躲到坚固的桌子下或墙角，到室外要远离高大建筑。',
    legend: [['岩浆 Magma', '#ff6a2a'], ['地震波', C.red]],
    driver: {name: '板块挤压 · Stress', min: 0, max: 100, step: 1, fmt: (v) => f0(v) + '%', get: () => st.s, set: (v) => { st.s = v; }, scale: () => ['平静', '火山活跃', '地震'], track: () => [[60, 90, '#ffb08a'], [90, 100, C.red]]},
    extra: (el) => {
      el.innerHTML = `<div class="grp" style="margin-top:9px"><span class="cp mu">地震来了，你应该 What to do</span><div class="seg" id="segAct">${ACTS.map((a, i) => `<button class="tb" data-v="${i}" type="button">${a}</button>`).join('')}</div></div>`;
      el.querySelectorAll('#segAct .tb').forEach((b) => b.onclick = () => { st.act = +b.dataset.v; window.pressSeg('segAct', st.act); document.getElementById('caption').textContent = st.act === 0 ? '✓ 正确：用坚固的家具保护头部，等震动停止后再有序撤离。' : '✗ 危险！地震时不能乘电梯、不能跳楼，也要远离玻璃窗。'; if (st.act === 0) ctx.done(2); });
    },
    pick: null,
    views: [['全景', [200, 620, 1500], [0, 160, 0]], ['火山', [700, 520, 700], [VX, 300, 0]], ['剖面', [0, 200, 1300], [0, 120, 0]]], get home() { return this.views[0]; },
    missions: [
      {t: '让岩浆冲出火山口，看到火山喷发', k: '火山喷发是地壳运动的表现', check: () => st.erupt > 1.5},
      {t: '让能量积累到极限，引发一次地震，找到震源和震中', k: '震源、震中与地震波', check: () => st.quakes >= 1},
      {t: '选出地震时正确的避险方法', k: '地震中的自我保护'},
    ],
    update(dt, anim) {
      st.t += anim;
      const s = st.s / 100;
      plateL.position.x = s * 18; plateR.position.x = -s * 18; plateL.rotation.z = -s * .03; plateR.rotation.z = s * .03;
      // magma rises with stress; erupts above 60%
      const lvl = lerp(120, TOP + 260, clamp((s - .2) / .45, 0, 1));
      conduit.position.set(VX, (120 + lvl) / 2, 0); conduit.scale.y = Math.max(1, lvl - 120);
      const erupting = s > .6; if (erupting) st.erupt += anim; else st.erupt = Math.max(0, st.erupt - anim);
      lp.forEach((q, i) => {
        if (q.life <= 0 && erupting && rand() < anim * 30 * s) { q.p.set(VX + (rand() - .5) * 30, TOP + 262, (rand() - .5) * 30); q.v.set((rand() - .5) * 320, 380 + rand() * 300 * s, (rand() - .5) * 320); q.life = 2; }
        if (q.life > 0) { q.life -= anim; q.v.y -= 600 * anim; q.p.addScaledVector(q.v, anim); if (q.p.y < TOP) q.life = 0; }
        dummy.position.copy(q.life > 0 ? q.p : V(0, -999, 0)); dummy.scale.setScalar(q.life > 0 ? 1 : 0); dummy.updateMatrix(); lava.setMatrixAt(i, dummy.matrix);
      });
      lava.instanceMatrix.needsUpdate = true;
      sp.forEach((q, i) => {
        if (q.life <= 0 && erupting && rand() < anim * 6) { q.p.set(VX, TOP + 280, 0); q.life = 4; }
        if (q.life > 0) { q.life -= anim; q.p.y += 90 * anim; q.p.x += 30 * anim; }
        dummy.position.copy(q.life > 0 ? q.p : V(0, -999, 0)); dummy.scale.setScalar(q.life > 0 ? 1 + (4 - q.life) * .6 : 0); dummy.updateMatrix(); smoke.setMatrixAt(i, dummy.matrix);
      });
      smoke.instanceMatrix.needsUpdate = true;
      // earthquake at the limit: shake, rings from the epicenter, energy released
      if (s >= .99 && st.quake <= 0) { st.quake = 2.6; st.quakes++; st.epi = true; setTimeout(() => window.lab?.setDriver(25), 2600); }
      if (st.quake > 0) st.quake -= dt;
      const sh = st.quake > 0 ? Math.sin(st.t * 60) * 8 * Math.min(1, st.quake) : 0; crust.position.x = sh; houses.position.x = sh * 1.6; houses.rotation.z = sh * .004;
      rings.forEach((r, i) => { const k = st.quake > 0 ? ((2.6 - st.quake) * 1.2 + i * .33) % 1 : 0; r.visible = st.quake > 0; r.scale.setScalar(20 + k * 600); r.material.opacity = .6 * (1 - k); });
      tags.focus.p.set(-60, 76, 0); tags.focus.below = true; tags.epi.p.set(-60, TOP + 4, 0); tags.epi.on = st.epi;
      tags.vol.p.set(VX, TOP + 300, 0); tags.mag.p.set(VX - 110, 140, 0); tags.plates.p.set(0, TOP + 40, -200);
    },
    panel() {
      const s = st.s;
      return {big: f0(s), bigFrac: s / 100, bigSub: st.quake > 0 ? '地震！能量突然释放' : s > 60 ? '火山喷发中' : s > 30 ? '岩浆在上升' : '地壳相对平静',
        stName: '地壳活动', stAng: `地震 ${st.quakes} 次`, stBig: st.quake > 0 ? '地震发生' : s > 60 ? '火山喷发' : '能量积累中', stRed: st.quake > 0 || s > 60,
        rows: [['震源：地下发生地震的地方', st.epi, ''], ['震中：震源正上方的地面', st.epi, ''], ['火山：岩浆喷出地表', s > 60, ''], ['都分布在板块交界地带', true, '']],
        num: st.quake > 0 ? '6.5' : '—', unit: '级 · 震级（示意）<small>震级越大释放能量越多</small>', frac: st.quake > 0 ? .65 : 0};
    },
    reset() { st.act = -1; return 20; },
    tour: [{d: 50, dTime: 3, view: 2, cap: '两个板块相互挤压，地下的岩浆在上升。', dur: 5}, {d: 80, dTime: 3, view: 1, cap: '压力继续增大，岩浆冲出地面：火山喷发。', dur: 6}, {d: 100, dTime: 2, view: 0, cap: '岩层突然断裂，能量以地震波的形式传播：这就是地震。红点是震源，正上方地面是震中。', dur: 7}],
    quiz: {},
  };
}

/* ----------------------------------------------------------------- 314 岩石与矿物：沉积岩与三大类岩石 */
const ROCKS = [['花岗岩', '岩浆岩', '岩浆冷却凝固形成，有明显的矿物颗粒'], ['玄武岩', '岩浆岩', '岩浆喷出地表后快速冷却，有气孔'], ['砂岩', '沉积岩', '砂粒沉积、压实形成，有层理，可能含化石'], ['页岩', '沉积岩', '泥土沉积形成，层理明显'], ['大理岩', '变质岩', '石灰岩在高温高压下变质而成'], ['板岩', '变质岩', '页岩变质而成，可以劈成薄板']];
function b314(ctx) {
  const root = G(), st = {my: 0, picked: new Set(), fossil: false, t: 0};
  root.add(bench(1400, 800));
  const tank = mesh(new THREE.BoxGeometry(520, 420, 260), MAT.glass(.14), false); tank.position.set(-200, 210, -60); root.add(tank);
  const water = mesh(new THREE.BoxGeometry(516, 380, 256), MAT.water(.18), false); water.position.set(-200, 190, -60); root.add(water);
  const COL = [0xc9b48a, 0x9c8a6a, 0xd9c7a2, 0x7d6d58, 0xb59b74, 0x8f7b62, 0xcbb894, 0x6f604e];
  const NAMES = ['砂', '泥', '砂', '黏土', '砂砾', '泥', '砂', '泥'];
  const layers = COL.map((c, i) => { const b = box(512, 40, 252, MAT.col(c, {roughness: 1})); b.position.set(-200, 0, -60); root.add(b); return b; });
  const fossils = [2, 5].map((li) => { const f = mesh(new THREE.TorusGeometry(14, 5, 8, 24, Math.PI * 1.7), MAT.col(0xf3f0ea)); f.userData.pick = 'fossil'; f.rotation.x = .3; root.add(f); f.userData.li = li; return f; });
  const samples = ROCKS.map((r, i) => {
    const g = G(); g.position.set(250 + (i % 3) * 150, 0, -120 + Math.floor(i / 3) * 200); g.userData.pick = i; root.add(g);
    const ped = cyl(50, 56, 20, MAT.dark()); ped.position.y = 10; g.add(ped);
    const cols = {岩浆岩: [0xd8cfc6, 0x2d2d2d], 沉积岩: [0xc9a878, 0x9c7c58], 变质岩: [0xf1efea, 0x6a6f78]}[r[1]];
    const rock = mesh(new THREE.DodecahedronGeometry(42, 1), MAT.col(i % 2 ? cols[1] : cols[0], {roughness: .9})); rock.position.y = 60; rock.scale.set(1, .75, .9); g.add(rock);
    return g;
  });
  const tags = {tank: makeTag('沉积作用', 'Sedimentation'), old: makeTag('越往下越古老', '', true), ...Object.fromEntries(ROCKS.map((r, i) => ['s' + i, makeTag(r[0], '')]))};
  return {
    root, tags, pickables: [...samples, ...fossils], title: '岩石 <i>·</i> 沉积与化石', spec: '岩浆岩 · 沉积岩 · 变质岩',
    bigUnit: '层 · 已形成的沉积岩层', bigMin: '0', bigMax: '8', intro: '拖动滑块让时间流逝：泥沙一层层沉积、压实，变成沉积岩。点击岩层中的化石和右边的岩石标本。',
    fml: '沉积 → 压实 → 固结 → 沉积岩', fmlTag: '沉积岩的形成', fmlNote: '沉积岩有<b>层理</b>，常含<b>化石</b>；一般下面的岩层比上面的岩层更古老。',
    legend: [['化石', '#f3f0ea']],
    driver: {name: '时间 · 百万年', min: 0, max: 80, step: .5, fmt: (v) => f0(v) + ' 百万年', get: () => st.my, set: (v) => { st.my = v; }, scale: () => ['现在开始', '40', '80 百万年']},
    pick: (k) => {
      if (k === null || k === undefined) return null;
      if (k === 'fossil') { st.fossil = true; ctx.done(1); return '<b>化石</b>：古代生物的遗体或遗迹被埋在沉积物中形成，是研究生物进化的证据。'; }
      st.picked.add(ROCKS[k][1]); return `<b>${ROCKS[k][0]}</b>（${ROCKS[k][1]}）：${ROCKS[k][2]}`;
    },
    views: [['全景', [100, 620, 1350], [0, 140, 0]], ['岩层', [-200, 260, 620], [-200, 140, -60]], ['标本', [400, 420, 600], [400, 50, -20]]], get home() { return this.views[0]; },
    missions: [
      {t: '让时间流逝，沉积出 6 层以上的岩层', k: '沉积岩的形成与层理', check: () => st.my >= 60},
      {t: '在岩层中找到化石', k: '沉积岩中常含有化石'},
      {t: '认出岩浆岩、沉积岩、变质岩三类标本', k: '岩石的分类', check: () => st.picked.size >= 3},
    ],
    update(dt) {
      const n = st.my / 10; let y = 4;
      layers.forEach((b, i) => {
        const f = clamp(n - i, 0, 1); b.visible = f > 0.01;
        const comp = clamp(n - i - 1, 0, 3) / 3, h = 40 * f * (1 - comp * .35);
        b.scale.y = Math.max(h / 40, .01); b.position.y = y + h / 2; b.userData.top = y + h; b.userData.mid = y + h / 2; y += h;
      });
      fossils.forEach((f) => { const b = layers[f.userData.li]; f.visible = b.visible && b.scale.y > .5; f.position.set(-260 + f.userData.li * 30, b.userData.mid || 0, 72); });
      water.scale.y = 1; tags.tank.p.set(-200, 440, -60); tags.old.p.set(-470, 24, 70); tags.old.on = n > 2;
      ROCKS.forEach((r, i) => { const t = tags['s' + i]; t.p.copy(samples[i].position).add(V(0, 120, 0)); t.set(r[0], st.picked.has(r[1]) ? r[1] : '点击识别'); });
    },
    panel() {
      const n = Math.floor(st.my / 10 + 1e-6);
      return {big: f0(Math.min(n, 8)), bigFrac: n / 8, bigSub: n ? `最底层形成于约 ${f0(st.my)} 百万年前` : '还没有沉积',
        stName: '三大类岩石', stAng: `已认出 ${st.picked.size} / 3 类`, stBig: st.picked.size >= 3 ? '全部认出' : '点击标本识别', stRed: st.picked.size >= 3,
        rows: [['岩浆岩：岩浆冷凝形成', st.picked.has('岩浆岩'), ''], ['沉积岩：有层理、含化石', st.picked.has('沉积岩'), ''], ['变质岩：高温高压下变质', st.picked.has('变质岩'), ''], ['在沉积岩中找到化石', st.fossil, '']],
        num: NAMES.slice(0, Math.min(n, 8)).length ? NAMES[Math.max(0, Math.min(n, 8) - 1)] : '—', unit: '最新一层的沉积物<small>Top layer</small>', frac: n / 8};
    },
    reset() { st.picked.clear(); return 0; },
    tour: [{d: 40, dTime: 6, view: 1, cap: '泥沙在水底一层层沉积，上面的压力把下面的沉积物压实、固结成岩石。', dur: 7}, {d: 80, dTime: 5, view: 1, cap: '越往下的岩层形成得越早，越古老。被埋藏的生物遗体变成了化石。', dur: 7}, {d: 80, view: 2, cap: '点击右边的标本：岩浆岩、沉积岩、变质岩，看看它们是怎样形成的。', dur: 6}],
    quiz: {},
  };
}

export const C3 = {310: {n: 3, build: b310}, 311: {n: 3, build: b311}, 312: {n: 3, build: b312}, 313: {n: 3, build: b313}, 314: {n: 3, build: b314}};
