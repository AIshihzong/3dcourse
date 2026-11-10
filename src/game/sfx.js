/* Tiny WebAudio synth: every sound in the game is generated here, no audio files. */
let ctx = null, master = null, on = true, nbuf = null;
let bell = null, hissN = null, drn = null;

function ac() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = on ? .9 : 0; master.connect(ctx.destination);
    } catch (e) { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
function tone(f, d, {type = 'sine', v = .2, t = 0, to = 0, a = .006} = {}) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + t;
  o.type = type; o.frequency.setValueAtTime(f, t0); if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + d);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + a); g.gain.exponentialRampToValueAtTime(.0008, t0 + d);
  o.connect(g).connect(master); o.start(t0); o.stop(t0 + d + .04);
}
function noiseBuf(c) {
  if (!nbuf) { nbuf = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  return nbuf;
}
function noise(d, {v = .2, t = 0, f = 1200, q = .8, type = 'bandpass', to = 0} = {}) {
  const c = ac(); if (!c) return;
  const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(), t0 = c.currentTime + t;
  s.buffer = noiseBuf(c); s.loop = true; fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f, t0); if (to) fl.frequency.exponentialRampToValueAtTime(to, t0 + d);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + .008); g.gain.exponentialRampToValueAtTime(.0008, t0 + d);
  s.connect(fl).connect(g).connect(master); s.start(t0); s.stop(t0 + d + .04);
}
const seq = (notes, step, o) => notes.forEach((f, i) => f && tone(f, o.d || .22, {...o, t: i * step}));

export const sfx = {
  get on() { return on; },
  set(v) { on = v; if (master) master.gain.value = v ? .9 : 0; },
  unlock() { ac(); },
  tap() { tone(520, .07, {type: 'triangle', v: .12}); },
  whoosh() { noise(.26, {f: 500, to: 2600, v: .22, q: 1.2}); },
  splash() { noise(.45, {f: 2600, to: 500, v: .3, q: .6}); tone(240, .2, {v: .1, to: 90}); },
  hit() { tone(180, .16, {type: 'square', v: .16, to: 90}); seq([660, 880, 1320], .07, {type: 'triangle', v: .2, d: .2}); },
  miss() { tone(150, .22, {type: 'sawtooth', v: .1, to: 70}); noise(.16, {f: 300, v: .16}); },
  right() { seq([660, 990], .09, {type: 'triangle', v: .22, d: .24}); },
  wrong() { tone(200, .26, {type: 'square', v: .12, to: 130}); },
  clear() { seq([523, 659, 784, 1047], .09, {type: 'triangle', v: .22, d: .3}); },
  win() { seq([523, 659, 784, 1047, 0, 1047, 1319, 1568], .11, {type: 'triangle', v: .22, d: .42}); seq([262, 0, 392, 0, 523], .22, {type: 'sine', v: .14, d: .5}); },
  star(i = 0) { tone(880 * Math.pow(1.26, i), .45, {type: 'triangle', v: .24}); tone(1760 * Math.pow(1.26, i), .3, {v: .1, t: .04}); },
  fail() { seq([392, 330, 262], .16, {type: 'triangle', v: .2, d: .34}); },
  coin() { seq([1245, 1661], .06, {type: 'square', v: .09, d: .16}); },
  pump() { noise(.13, {f: 700, to: 240, v: .34, q: 1.6}); tone(120, .1, {v: .16, to: 70}); },
  seal() { tone(300, .12, {type: 'square', v: .12, to: 600}); noise(.08, {f: 3000, v: .14}); },
  snap() { tone(1175, .09, {type: 'triangle', v: .2}); tone(1568, .16, {type: 'triangle', v: .2, t: .07}); },
  tick() { tone(1000, .05, {type: 'square', v: .08}); },
  go() { tone(784, .3, {type: 'triangle', v: .22}); },
  meow() { tone(700, .4, {type: 'sawtooth', v: .13, to: 420, a: .05}); tone(1400, .4, {type: 'sine', v: .06, to: 840, a: .05}); },
  /* cutscene sound: a low drone bed, a thud for stamps, a riser into reveals, soft type ticks */
  thud() { tone(72, .7, {v: .5, to: 36}); noise(.3, {f: 160, v: .34, type: 'lowpass'}); },
  riser(d = 1.4) { noise(d, {f: 260, to: 5200, v: .12, q: 2.2}); tone(196, d, {type: 'sawtooth', v: .045, to: 588, a: d * .85}); },
  hit2() { tone(110, .9, {v: .32, to: 55}); tone(330, .5, {type: 'triangle', v: .08, to: 165}); noise(.5, {f: 900, to: 200, v: .14}); },
  type() { tone(1900 + Math.random() * 500, .022, {type: 'square', v: .018}); },
  drone(onn) {
    const c = ac(); if (!c) return;
    if (onn && !drn) {
      const out = c.createGain(); out.gain.value = 0; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.connect(out); out.connect(master);
      const os = [55, 55.4, 82.4, 110.3].map((f, i) => { const o = c.createOscillator(); o.type = i < 2 ? 'sawtooth' : 'sine'; o.frequency.value = f; const g = c.createGain(); g.gain.value = [.16, .16, .22, .08][i]; o.connect(g).connect(lp); o.start(); return o; });
      const lfo = c.createOscillator(); lfo.frequency.value = .09; const lg = c.createGain(); lg.gain.value = 160; lfo.connect(lg).connect(lp.frequency); lfo.start();
      drn = {out, os, lfo}; out.gain.setTargetAtTime(.22, c.currentTime, 1.2);
    } else if (!onn && drn) {
      const d = drn; drn = null; d.out.gain.setTargetAtTime(0, c.currentTime, .4);
      setTimeout(() => { try { d.os.forEach((o) => o.stop()); d.lfo.stop(); d.out.disconnect(); } catch (e) { /* ignore */ } }, 1800);
    }
  },
  /* a ringing electric bell: two partials chopped by a 26 Hz hammer */
  bellStart() {
    const c = ac(); if (!c || bell) return;
    const out = c.createGain(); out.gain.value = 0; out.connect(master);
    const am = c.createGain(); am.gain.value = .5; am.connect(out);
    const lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 26; const lg = c.createGain(); lg.gain.value = .5; lfo.connect(lg).connect(am.gain); lfo.start();
    const os = [1870, 2810, 4150].map((f, i) => { const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f; const g = c.createGain(); g.gain.value = [.5, .3, .14][i]; o.connect(g).connect(am); o.start(); return o; });
    bell = {out, lfo, os};
  },
  bellGain(x) { if (bell) bell.out.gain.setTargetAtTime(Math.max(0, x) * .16, ctx.currentTime, .05); },
  bellStop() { if (!bell) return; const b = bell; bell = null; try { b.out.gain.setTargetAtTime(0, ctx.currentTime, .03); setTimeout(() => { b.lfo.stop(); b.os.forEach((o) => o.stop()); b.out.disconnect(); }, 200); } catch (e) { /* ignore */ } },
  /* air hissing through a leak */
  hiss(x) {
    const c = ac(); if (!c) return;
    if (!hissN) {
      if (x <= 0) return;
      const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
      s.buffer = noiseBuf(c); s.loop = true; fl.type = 'highpass'; fl.frequency.value = 4200; g.gain.value = 0;
      s.connect(fl).connect(g).connect(master); s.start(); hissN = {s, g};
    }
    hissN.g.gain.setTargetAtTime(Math.max(0, x) * .1, c.currentTime, .05);
  },
};
