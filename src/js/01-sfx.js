/* ===== module: 01-sfx.js ===== */
/* Sound effects for rewarding moments: coins counting up, chests opening, the prize wheel, buying and unlocking accessories, holiday
   presents, a passed or perfect quiz, a good flashcard session, a presentation on time or mastered, a streak milestone and a task
   checked off. Each is made in the browser with Web Audio (no files, works offline), short and soft, through one gentle compressor
   and a little room reverb so they sit together.
   SFX.play(name, opts) plays one now; SFX.render(name, opts) makes it as a WAV (for previews). Off in Settings (Sound Effects), and
   never while the app is in the background. Places that call it: 98-0study-credits.js (rewards, chests, the wheel), 98-companion.js
   (buying, reveals, presents), 99-review-streaks.js (milestones), 01-flashcards.js (a good session), 01-style-shop.js (a task) */
const SFX = (() => {
  const KEY = "studyboard:sfx";
  const on = () => { try { return localStorage.getItem(KEY) !== "off"; } catch (e) { return true; } };
  let AC = null, bus = null, lastAt = {};
  const VOL = 1.7;

  // ---- building blocks: each draws into (ctx, out) starting at time t ----
  const env = (ctx, g, t, a, peak, dur) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); };
  function tone(ctx, out, t, f, dur, o){
    o = o || {}; const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || "sine"; osc.frequency.setValueAtTime(f, t); if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || dur));
    if (o.detune) osc.detune.setValueAtTime(o.detune, t);
    env(ctx, g, t, o.a || 0.005, (o.gain || 0.2), dur);
    let node = osc; if (o.lp) { const fl = ctx.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = o.lp; osc.connect(fl); node = fl; }
    node.connect(g); g.connect(out); osc.start(t); osc.stop(t + dur + 0.05);
  }
  // a bell or coin: a few inharmonic partials that fade at different rates
  function bell(ctx, out, t, f, dur, gain){ [[1, 1], [2.76, .45], [5.4, .22], [8.9, .1]].forEach(([m, a], k) => tone(ctx, out, t, f * m, dur / (1 + k * 0.7), {gain: gain * a, a: 0.002})); }
  let NOISE = null;
  function noiseBuf(ctx){ if (NOISE && NOISE.sampleRate === ctx.sampleRate) return NOISE; const n = ctx.sampleRate * 1.5, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); let s = 12345; for (let i = 0; i < n; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = (s / 0x3fffffff) - 1; } return (NOISE = b); }
  function noise(ctx, out, t, dur, o){
    o = o || {}; const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf(ctx); f.type = o.type || "bandpass"; f.frequency.setValueAtTime(o.f || 2000, t); if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur); f.Q.value = o.q || 1;
    env(ctx, g, t, o.a || 0.01, o.gain || 0.15, dur);
    src.connect(f); f.connect(g); g.connect(out); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  }
  const N = n => 440 * Math.pow(2, (n - 69) / 12);  // a MIDI note
  const arp = (ctx, out, t, notes, step, o) => notes.forEach((n, i) => { tone(ctx, out, t + i * step, N(n), (o && o.dur) || 0.5, Object.assign({type: "triangle", gain: 0.16}, o)); tone(ctx, out, t + i * step, N(n + 12), ((o && o.dur) || 0.5) * 0.6, {gain: 0.05}); });
  const chord = (ctx, out, t, notes, dur, gain) => notes.forEach((n, i) => { tone(ctx, out, t, N(n), dur, {type: "triangle", gain: gain || 0.09, a: 0.02, detune: (i % 2 ? 4 : -4)}); tone(ctx, out, t, N(n), dur, {type: "sawtooth", gain: (gain || 0.09) * 0.25, a: 0.03, lp: 1800}); });
  const sparkle = (ctx, out, t, n, gain) => { const P = [84, 86, 88, 91, 93, 96, 98, 100, 103]; for (let i = 0; i < n; i++) bell(ctx, out, t + i * 0.055, N(P[i % P.length]), 0.35, (gain || 0.06) * (1 - i / (n * 1.6))); };
  const RANK = {common: 0, uncommon: 1, rare: 2, exotic: 3, legendary: 4};

  // ---- the sounds: each returns how long it lasts ----
  const S = {
    // one coin landing in the pile (played many times while credits count up; o.i varies the pitch a little)
    coin: (c, o, t, x) => { const k = [0, 2, 4, 7, 9][(x.i || 0) % 5]; bell(c, o, t, N(93 + k), 0.18, 0.09); return 0.2; },
    // the total lands: a bright two-note ding
    coinLand: (c, o, t) => { bell(c, o, t, N(95), 0.5, 0.08); bell(c, o, t + 0.09, N(100), 0.8, 0.1); return 0.9; },
    // a reward screen opens: a short stinger, 1 (nice), 2 (passed, on time, a good session), 3 (perfect, mastered)
    reward: (c, o, t, x) => { const lv = x.level || 1;
      if (lv >= 3) { arp(c, o, t, [60, 64, 67, 72, 76], 0.07, {dur: 0.4}); chord(c, o, t + 0.36, [60, 64, 67, 72], 1.2, 0.08); sparkle(c, o, t + 0.4, 8, 0.05); return 1.6; }
      if (lv === 2) { arp(c, o, t, [67, 71, 74, 79], 0.075, {dur: 0.45}); chord(c, o, t + 0.3, [67, 71, 74], 0.8, 0.06); return 1.1; }
      arp(c, o, t, [72, 76, 79], 0.07, {dur: 0.35, gain: 0.12}); return 0.6; },
    // a small reward (a task done): a soft pop and one coin
    pop: (c, o, t) => { tone(c, o, t, 660, 0.09, {to: 1180, glide: 0.06, gain: 0.16}); bell(c, o, t + 0.05, N(96), 0.25, 0.07); return 0.3; },
    // a chest opening: a wooden thunk, the lid's whoosh, then a sparkle that grows with its rarity
    chest: (c, o, t, x) => { const r = RANK[x.rarity] || 0;
      tone(c, o, t, 140, 0.18, {to: 70, gain: 0.3}); noise(c, o, t, 0.12, {type: "lowpass", f: 500, gain: 0.18});
      noise(c, o, t + 0.06, 0.35, {f: 700, to: 4200, q: 0.8, gain: 0.07});
      arp(c, o, t + 0.2, [72, 76, 79, 84, 88, 91].slice(0, 3 + r), 0.06, {dur: 0.4, gain: 0.11});
      if (r >= 2) sparkle(c, o, t + 0.35, 4 + r * 2, 0.05); if (r >= 4) chord(c, o, t + 0.55, [60, 67, 72, 76], 1.4, 0.06);
      return 0.9 + r * 0.25; },
    // the wheel starts: a rising whoosh
    whoosh: (c, o, t) => { noise(c, o, t, 0.5, {f: 400, to: 2600, q: 0.7, gain: 0.2, a: 0.12}); return 0.6; },
    // the pointer passing a slice
    tick: (c, o, t) => { noise(c, o, t, 0.025, {type: "highpass", f: 2500, gain: 0.16, a: 0.001}); tone(c, o, t, 1900, 0.03, {gain: 0.05, a: 0.001}); return 0.05; },
    // the wheel stops: coins (x.coins) or an accessory (x.rarity)
    win: (c, o, t, x) => { if (x.coins) { S.coinLand(c, o, t); for (let i = 0; i < 6; i++) S.coin(c, o, t + 0.15 + i * 0.06, {i}); return 1; }
      const r = RANK[x.rarity] || 0; S.reward(c, o, t, {level: r >= 3 ? 3 : 2}); if (r >= 2) sparkle(c, o, t + 0.5, 3 + r * 2, 0.05); return 1.7; },
    // buying an accessory: a cash register's ka-ching
    buy: (c, o, t) => { noise(c, o, t, 0.06, {type: "lowpass", f: 900, gain: 0.2, a: 0.002}); tone(c, o, t, 200, 0.07, {to: 120, gain: 0.15});
      bell(c, o, t + 0.07, N(98), 0.7, 0.1); bell(c, o, t + 0.14, N(103), 1.0, 0.1); for (let i = 0; i < 5; i++) S.coin(c, o, t + 0.22 + i * 0.05, {i: i + 2}); return 1.1; },
    // a new accessory: a magical rise, more sparkle the rarer it is
    reveal: (c, o, t, x) => { const r = RANK[x.rarity] || 0;
      tone(c, o, t, 500, 0.6, {to: 1600, glide: 0.5, type: "sine", gain: 0.06, a: 0.1}); arp(c, o, t + 0.15, [72, 79, 84, 88, 91].slice(0, 3 + Math.min(2, r)), 0.08, {dur: 0.5, gain: 0.1});
      sparkle(c, o, t + 0.45, 3 + r * 2, 0.05); if (r >= 3) chord(c, o, t + 0.6, [65, 69, 72, 77], 1.3, 0.055); return 1.4 + r * 0.15; },
    // a holiday present appears: a few soft sleigh bells
    present: (c, o, t) => { for (let i = 0; i < 8; i++) bell(c, o, t + i * 0.07 + (i % 2) * 0.02, N(98 + (i % 3) * 2), 0.18, 0.07); return 0.8; },
    // a present opened: paper tearing, then ta-da
    unwrap: (c, o, t) => { for (let i = 0; i < 7; i++) noise(c, o, t + i * 0.035, 0.06, {f: 1800 + i * 400, q: 1.5, gain: 0.1, a: 0.003}); arp(c, o, t + 0.3, [67, 72, 76], 0.06, {dur: 0.3}); chord(c, o, t + 0.5, [67, 72, 76, 79], 1.1, 0.075); return 1.6; },
    // a study-streak milestone: a warm rising chord
    streak: (c, o, t) => { arp(c, o, t, [65, 69, 72, 76], 0.09, {dur: 0.7, gain: 0.11}); chord(c, o, t + 0.36, [65, 69, 72, 76], 1.4, 0.06); return 1.8; }
  };

  function ctx(){
    try {
      if (AC && AC.state === "closed") AC = null;
      if (!AC) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AC = new C(); bus = null; }
      if (AC.state !== "running") AC.resume().catch(() => {});
      return AC;
    } catch (e) { return null; }
  }
  // one gentle compressor and a short room reverb shared by every sound
  function chain(c){
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
    const master = c.createGain(); master.gain.value = VOL;
    const wet = c.createGain(); wet.gain.value = 0.16; const conv = c.createConvolver(); const n = Math.round(c.sampleRate * 0.9), ir = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let s = 777 + ch; for (let i = 0; i < n; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = ((s / 0x3fffffff) - 1) * Math.pow(1 - i / n, 3); } }
    conv.buffer = ir; const inp = c.createGain();
    inp.connect(comp); inp.connect(conv); conv.connect(wet); wet.connect(comp); comp.connect(master); master.connect(c.destination);
    return inp;
  }
  // (repeats of one sound are spaced: a burst of coins can't pile up into noise)
  const GAP = {coin: 0.045, tick: 0.03, pop: 0.25};
  function play(name, opts){
    try {
      if (!S[name] || !on() || document.hidden) return false;
      const now = performance.now() / 1000, gap = GAP[name] == null ? 0.12 : GAP[name];
      if (lastAt[name] && now - lastAt[name] < gap) return false; lastAt[name] = now;
      if (window.__SB_TEST) { (window.__sfxLog = window.__sfxLog || []).push(name + (opts && (opts.rarity || opts.level || opts.coins) ? ":" + (opts.rarity || opts.level || "coins") : "")); }
      const c = ctx(); if (!c) return false;
      if (!bus || bus.context !== c) bus = chain(c);
      S[name](c, bus, c.currentTime + 0.02, opts || {});
      return true;
    } catch (e) { return false; }
  }
  // a sound as a 16-bit WAV (Blob), for previews and the settings row's sample
  async function render(name, opts){
    const C = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!C || !S[name]) return null;
    const sr = 44100, len = Math.ceil(sr * 3), c = new C(2, len, sr), inp = chain(c);
    S[name](c, inp, 0.05, opts || {}); const buf = await c.startRendering();
    const L = buf.getChannelData(0), R = buf.getChannelData(1); let end = len; while (end > sr * 0.3 && Math.abs(L[end - 1]) < 1e-4) end--; end = Math.min(len, end + sr * 0.15);
    const dv = new DataView(new ArrayBuffer(44 + end * 4)), w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); dv.setUint32(4, 36 + end * 4, true); w(8, "WAVE"); w(12, "fmt "); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true); dv.setUint32(24, sr, true); dv.setUint32(28, sr * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); w(36, "data"); dv.setUint32(40, end * 4, true);
    for (let i = 0; i < end; i++) { dv.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); dv.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
    return new Blob([dv.buffer], {type: "audio/wav"});
  }
  return {play, render, on, KEY, names: () => Object.keys(S), set: v => { try { if (v) localStorage.removeItem(KEY); else localStorage.setItem(KEY, "off"); } catch (e) {} }};
})();
window.SBSFX = SFX;
