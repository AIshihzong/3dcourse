/* Live cutscene player. A cutscene is a list of beats; each beat may move the camera (a huashu-motion camera rig shot),
   change the world, put up a caption / title card / stamp, and say one line. Between shots the camera keeps drifting,
   so no frame is ever still. Lines are typed on and, when the browser has a Chinese voice, spoken. */
import * as THREE from 'three';
import Rig from './camera-rig.js';
import {$, clamp} from '../../kit.js';

export const CAST = {
  nar: {n: '旁白', pitch: 1, rate: 1.05},
  gu: {n: '顾言', pitch: .82, rate: 1},
  zhou: {n: '周建国', pitch: .66, rate: .95},
  lin: {n: '林小舟', pitch: 1.32, rate: 1.06},
  song: {n: '宋凯', pitch: 1.12, rate: 1.12},
};

const V3 = THREE.Vector3;
const smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

export function createCut({camera, sfx, world, getAspect}) {
  const el = $('cut'), sub = $('cutSub'), whoEl = $('cutWho'), txt = $('cutTxt'), cap = $('cutCap'), ttl = $('cutTitle'), stamp = $('cutStamp');
  const opt = {auto: true, voice: true};
  try { const s = JSON.parse(localStorage.getItem('g7game.cut') || '{}'); Object.assign(opt, s); } catch (e) { /* ignore */ }
  const keep = () => { try { localStorage.setItem('g7game.cut', JSON.stringify(opt)); } catch (e) { /* ignore */ } };

  let beats = null, i = -1, b = null, t = 0, rig = null, onEnd = null, on = false, evs = [];
  let full = '', typed = 0, tickN = 0, readFor = 0, voiceDone = true, voiceTimer = 0, hold = 0;
  const base = {p: new V3(0, 500, 1600), q: new V3(0, 200, 0), fov: 36, roll: 0};
  let driftT = 0, driftDir = 1, driftAmp = 1, rigEnd = false;
  const tmp = new V3(), up = new V3(0, 1, 0);

  /* ---------------- voice */
  const tts = typeof speechSynthesis !== 'undefined' ? speechSynthesis : null;
  let zh = null;
  const pickVoice = () => { if (!tts) return; const vs = tts.getVoices().filter((v) => /^zh/i.test(v.lang)); zh = vs.find((v) => /zh[-_]CN/i.test(v.lang)) || vs[0] || null; };
  if (tts) { pickVoice(); tts.addEventListener?.('voiceschanged', pickVoice); }
  const canSpeak = () => !!(tts && zh && opt.voice && sfx.on);
  function speak(who, text) {
    voiceDone = true; if (!canSpeak()) return;
    try {
      tts.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, '')), c = CAST[who] || CAST.nar;
      u.voice = zh; u.lang = zh.lang; u.pitch = c.pitch; u.rate = c.rate; u.volume = .95;
      voiceDone = false; voiceTimer = text.length * .4 + 3;
      u.onend = u.onerror = () => { voiceDone = true; };
      tts.speak(u);
    } catch (e) { voiceDone = true; }
  }
  const hush = () => { try { tts?.cancel(); } catch (e) { /* ignore */ } voiceDone = true; };

  /* ---------------- overlays */
  function setCap(t) { cap.hidden = !t; if (t) { cap.textContent = t; cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in'); } }
  function setTitle(tt) {
    ttl.hidden = !tt; if (!tt) return;
    ttl.innerHTML = `<em>${tt[0]}</em><b>${tt[1]}</b>${tt[2] ? `<span>${tt[2]}</span>` : ''}`;
    ttl.classList.remove('in'); void ttl.offsetWidth; ttl.classList.add('in');
  }
  function setStamp(s) {
    stamp.hidden = !s; if (!s) return;
    stamp.textContent = s; stamp.classList.remove('in'); void stamp.offsetWidth; stamp.classList.add('in');
    setTimeout(() => { sfx.thud(); el.classList.remove('jolt'); void el.offsetWidth; el.classList.add('jolt'); }, 180);
  }

  /* ---------------- beats */
  function begin(list, cb) {
    beats = list; i = -1; onEnd = cb; on = true; el.hidden = false; el.classList.remove('out');
    void el.offsetWidth; el.classList.add('open'); sfx.drone(true); syncBtns();
    next();
  }
  function next() {
    hush(); i++;
    if (i >= beats.length) { end(); return; }
    b = beats[i]; t = 0; hold = 0;
    b.do?.(world);
    if (b.sfx) [].concat(b.sfx).forEach((s) => sfx[s]?.());
    evs = (b.at || []).map(([sec, what]) => ({sec, what}));
    const sk = typeof b.shot === 'function' ? b.shot(world) : b.shot;
    if (sk) {
      const keys = sk.map(([at, position, target, fov = 36, ease = 'outExpo', roll = 0]) => position
        ? {at, position, target, fov, ease, roll} : {at, position: base.p.toArray(), target: base.q.toArray(), fov: base.fov, ease: 'linear', roll: base.roll});
      const dur = Math.max(.001, keys[keys.length - 1].at);
      rig = Rig.create([{id: 'b' + i, start: 0, end: dur, keys}]); rigEnd = false;
      driftDir = b.dir || (i % 2 ? 1 : -1); driftAmp = b.drift ?? 1;
    } else rig = null;
    if ('cap' in b) setCap(b.cap);
    setTitle(b.title || null);
    setStamp(b.stamp || null);
    if (b.line) {
      const [who, text] = b.line, c = CAST[who] || CAST.nar;
      full = text; typed = 0; tickN = 0; sub.hidden = false; sub.className = 'sub ' + who;
      whoEl.textContent = c.n; whoEl.hidden = who === 'nar'; txt.innerHTML = '';
      readFor = text.replace(/<[^>]+>/g, '').length * .17 + .9;
      world.say?.(who === 'nar' ? null : who);
      speak(who, text);
    } else { world.say?.(null); full = ''; typed = 0; readFor = 0; sub.hidden = !!b.clear || sub.hidden; if (b.clear) txt.innerHTML = ''; }
  }
  function end() {
    hush(); on = false; sfx.drone(false); world.say?.(null);
    el.classList.remove('open'); el.classList.add('out');
    setTimeout(() => { if (!on) el.hidden = true; }, 420);
    sub.hidden = true; setCap(null); setTitle(null); setStamp(null);
    const cb = onEnd; onEnd = null; cb?.();
  }

  /* camera: the rig while a shot runs, then a slow orbit + push around the last pose */
  function pose(dt) {
    if (rig && !rigEnd) { // always lands exactly on the last key, even when a frame steps past it
      const s = rig.sample(Math.min(t, rig.duration)); rigEnd = t >= rig.duration;
      base.p.fromArray(s.position); base.q.fromArray(s.target); base.fov = s.fov; base.roll = s.roll; driftT = 0;
    } else driftT += dt;
    const k = smooth(driftT / 1.2) * driftT, a = k * .035 * driftDir * driftAmp;
    tmp.copy(base.p).sub(base.q).applyAxisAngle(up, a).multiplyScalar(1 - Math.min(.12, k * .012 * driftAmp));
    camera.position.copy(base.q).add(tmp);
    camera.up.set(Math.sin(base.roll), Math.cos(base.roll), 0);
    camera.lookAt(base.q);
    const asp = getAspect(), kk = clamp(1 + .55 * (1.6 / asp - 1), 1, 1.9);
    camera.fov = 2 * Math.atan(Math.tan(base.fov * Math.PI / 360) * kk) * 180 / Math.PI;
    camera.clearViewOffset();
  }
  function update(dt) {
    if (!on) return;
    t += dt; pose(dt);
    for (let j = evs.length - 1; j >= 0; j--) if (t >= evs[j].sec) { const w = evs[j].what; evs.splice(j, 1); if (typeof w === 'function') w(world); else sfx[w]?.(); }
    if (full && typed < full.length) {
      typed = Math.min(full.length, typed + dt * 26);
      const n = Math.floor(typed);
      txt.innerHTML = full.slice(0, n).replace(/<[^>]*$/, '') + '<i class="caret"></i>';
      if (n >= tickN + 2) { tickN = n; sfx.type(); }
      if (typed >= full.length) txt.innerHTML = full;
    }
    if (!voiceDone && (voiceTimer -= dt) <= 0) voiceDone = true;
    const camDone = !rig || t >= rig.duration;
    const ready = camDone && typed >= full.length && voiceDone && t >= Math.max(readFor, b.wait || 0);
    sub.classList.toggle('ready', !!full && typed >= full.length);
    if (opt.auto && ready) { hold += dt; if (hold > (b.pause ?? .5)) next(); }
  }
  function tap() {
    if (!on) return;
    if (full && typed < full.length) { typed = full.length; txt.innerHTML = full; return; }
    next();
  }
  function syncBtns() {
    $('cutAuto').classList.toggle('on', opt.auto); $('cutVoice').classList.toggle('on', opt.voice);
    $('cutVoice').hidden = !(tts && zh);
  }
  /* the case board: the camera slowly circles the campus */
  let idleT = 0;
  function idle(dt, spec) {
    idleT += dt;
    const a = spec.a0 + idleT * .02, r = spec.r;
    camera.position.set(spec.c[0] + Math.sin(a) * r, spec.y, spec.c[2] + Math.cos(a) * r);
    camera.up.set(0, 1, 0); camera.lookAt(spec.c[0], spec.c[1], spec.c[2]);
    const asp = getAspect(), kk = clamp(1 + .55 * (1.6 / asp - 1), 1, 1.9);
    camera.fov = 2 * Math.atan(Math.tan(spec.fov * Math.PI / 360) * kk) * 180 / Math.PI;
    camera.clearViewOffset();
  }

  return {
    play: begin, update, tap, idle, end: () => on && end(),
    get on() { return on; },
    skip() { if (on) { while (i < beats.length - 1) { i++; beats[i].do?.(world); } end(); } },
    auto() { opt.auto = !opt.auto; keep(); syncBtns(); },
    voice() { opt.voice = !opt.voice; keep(); syncBtns(); if (!opt.voice) hush(); },
    get beat() { return i; },
  };
}
