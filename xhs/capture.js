// Capture deterministic frames of the site for the XHS video. usage: node capture.js <sceneName>
const {chromium} = require('playwright');
const path = require('path'), fs = require('fs');
const SITE = 'file://' + path.resolve(__dirname, '../build/page.html');
const FPS = 30;
const lab = (js) => `(()=>{const L=window.lab;${js}})()`;
const SCENES = {
  hook: {hash: 'kp-332', dur: 3, at: [[0, lab('L.setDriver(34);L.applyGo({d:16,dTime:3})')]]},
  home: {hash: 'home', dur: 3, page: true, at: [[0.6, `document.querySelectorAll('#exams .tb')[1].click()`]]},
  lens: {hash: 'kp-332', dur: 7, at: [[0, lab('L.setDriver(32)')], [0.3, lab('L.applyGo({d:6,dTime:6})')]]},
  fish: {hash: 'kp-331', dur: 7, at: [[0, lab('L.applyGo({view:2})')], [1.6, `document.getElementById('bB').click()`]]},
  sound: {hash: 'kp-327', dur: 7, at: [[0, lab('L.setDriver(100);L.applyGo({view:1})')], [1.0, lab('L.applyGo({d:0,dTime:5})')]]},
  contour: {hash: 'kp-312', dur: 6, at: [[0, lab('L.setDriver(0)')], [0.4, lab('L.applyGo({d:1,dTime:5})')]]},
  eye: {hash: 'kp-333', dur: 6, at: [[0, lab('L.setDriver(100);L.applyGo({view:1})') + `;document.querySelectorAll('#segE .tb')[1].click()`], [3, `document.querySelectorAll('#segG .tb')[1].click()`]]},
  sprint: {hash: 'home', dur: 5, page: true, at: [[0.4, `document.getElementById('goSprint').click()`]]},
  end: {hash: 'kp-330', dur: 6, at: [[0, lab('L.setDriver(-20);L.applyGo({d:25,dTime:6})')]]},
};
(async () => {
  const name = process.argv[2], sc = SCENES[name], out = path.join(__dirname, 'frames', name);
  fs.mkdirSync(out, {recursive: true});
  const b = await chromium.launch({args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  const p = await b.newPage({viewport: {width: 800, height: 1280}, deviceScaleFactor: 1.35, hasTouch: true});
  p.on('pageerror', (e) => console.log('PAGEERR', e.message));
  await p.addInitScript(() => {
    let vt = 0, q = [];
    performance.now = () => vt;
    window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
    window.__step = (ms) => { const end = vt + ms; while (vt < end - 1e-6) { vt = Math.min(end, vt + 1000 / 60); const cur = q; q = []; cur.forEach((cb) => cb(vt)); } };
  });
  await p.goto(SITE + '#' + sc.hash);
  await p.waitForTimeout(800); await p.evaluate(() => window.__step(1500));
  const box = sc.page ? {x: 0, y: 56, width: 800, height: 742} : await p.evaluate(() => { const r = document.getElementById('stage').getBoundingClientRect(); return {x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 742)}; });
  const N = Math.round(sc.dur * FPS), todo = [...sc.at];
  for (let i = 0; i < N; i++) {
    const t = i / FPS;
    while (todo.length && todo[0][0] <= t + 1e-6) { await p.evaluate(todo.shift()[1]); }
    await p.evaluate((ms) => window.__step(ms), 1000 / FPS);
    await p.screenshot({path: path.join(out, String(i).padStart(4, '0') + '.jpg'), clip: box, type: 'jpeg', quality: 92, timeout: 120000});
  }
  console.log(name, N, 'frames', JSON.stringify(box));
  await b.close();
})();
