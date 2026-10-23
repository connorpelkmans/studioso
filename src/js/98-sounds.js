/* ===== module: 98-sounds.js ===== */
/* Studyboard 1.11.0: Focus Sounds. Module prefix 98-sounds.
   Calm ambient sounds for the Focus timer, made entirely in the browser with the Web Audio API (no audio files, so it
   works offline and adds almost nothing to the app's size). Each sound is a small recipe: looping noise buffers
   through gentle filters, pre-rendered "texture" buffers of thousands of tiny grains (rain drops, bubbles, crackles),
   rare scheduled events (a wave, a bird, a page turn) and slow random drift so nothing sounds like a loop.
   Every buffer is circular (it wraps into itself), so loops never click.
   Controls: a Focus Sounds card in the Focus Timer sheet, a small on/off button beside the timer pill while a session
   is active, and a Settings row (Study and AI). Settings live in state.settings.sounds (a few hundred bytes).
   Free: Rain, Brown Noise and Ocean Waves, one at a time. Pro: every sound, each theme's own mix, mixing up to 3.
   With the paywall off, everything is unlocked.

   SWITCHED OFF FOR NOW (Studyboard 1.11): SOUNDS_ENABLED is false, so none of the controls, menu rows or focus hooks are
   registered and nothing ever plays. The whole engine stays in place so custom sound files can be added later: set
   SOUNDS_ENABLED to true (and add file-based sounds to LIST) to bring it back. */
var SOUNDS_ENABLED = false;
var SOUNDS_HOOK = hook;
(() => {
  const hook = (name, fn) => SOUNDS_ENABLED ? SOUNDS_HOOK(name, fn) : undefined;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function rngOf(seed){ let s = (seed >>> 0) || 0x9E3779B9; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }
  const rr = (rng, a, b) => a + (b - a) * rng();
  const rlog = (rng, a, b) => a * Math.pow(b / a, rng());
  const hash = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  /* ---------- The sounds ---------- */
  const LIST = [
    ["rain", "Rain"], ["window", "Rain on a Window"], ["thunder", "Thunder Far Away"], ["ocean", "Ocean Waves"], ["stream", "Stream"],
    ["wind", "Wind"], ["snow", "Snowy Wind"], ["fire", "Fireplace"], ["cafe", "Café"], ["birds", "Forest Birds"], ["crickets", "Night Crickets"],
    ["city", "City at Night"], ["library", "Library Room"], ["brown", "Brown Noise"], ["pink", "Pink Noise"], ["pad", "Soft Pad"]];
  const NAME = Object.fromEntries(LIST);
  const FREE = new Set(["rain", "brown", "ocean"]);
  // Loudness trim per sound, measured offline so switching between sounds doesn't jump (see test/sounds-analyze.py).
  const CAL = {rain: 0.574, window: 0.576, thunder: 0.604, ocean: 0.492, stream: 0.618, wind: 0.806, snow: 0.913, fire: 0.564, cafe: 0.703, birds: 0.936, crickets: 0.748, city: 0.552, library: 0.524, brown: 0.367, pink: 0.297, pad: 0.311};

  /* Each theme's own mix: "sound level, sound level" for daytime, then "| ..." for dark mode when it differs. */
  const THEME = {
    classic: "rain 1", paper: "brown 1", slate: "rain 1", sand: "brown 1", blush: "rain 1", lavender: "brown 1", sky: "ocean 1",
    sage: "rain 1", peach: "brown 1", butter: "rain 1", teal: "ocean 1", mocha: "brown 1", plum: "rain 1", indigo: "brown 1",
    winter: "snow 1, fire .7", spring: "birds 1, rain .35 | crickets 1, rain .4", summer: "ocean 1, birds .25 | ocean 1, crickets .4",
    autumn: "wind 1, fire .45", ocean: "ocean 1", sakura: "stream .7, birds .8 | stream .7, crickets .5", forest: "birds 1, stream .7 | crickets 1, stream .5",
    galaxy: "pad 1", arctic: "snow 1, pad .5", lemonade: "birds 1, wind .4 | crickets 1, wind .3", xmas: "fire 1, snow .5", cafe: "cafe 1, rain .5",
    sunset: "ocean 1, wind .3", mint: "stream 1, birds .4 | stream 1, crickets .4", bokeh: "city .7, pad .7", neon: "city 1, rain .5",
    candy: "pad 1, stream .3", arcade: "pad 1, city .4", cats: "fire 1, rain .4", music: "pad 1, rain .3", reading: "library 1, rain .5 | library 1, fire .6",
    knitting: "fire 1, library .6", painting: "rain .7, pad .5", baking: "cafe 1, fire .4", gardening: "birds 1, wind .4 | crickets 1, wind .3",
    gaming: "pad 1, brown .5", photography: "city .7, birds .5 | city 1, rain .3", newyear: "city 1, pad .4", lunarnewyear: "pad .6, stream .6",
    valentines: "pad 1, fire .5", stpatricks: "rain .6, birds .6", easter: "birds 1, stream .5", july4: "wind .6, birds .6 | crickets 1, city .4",
    halloween: "wind 1, crickets .4 | thunder 1, wind .6", thanksgiving: "fire 1, cafe .5", hanukkah: "fire 1, snow .5", diwali: "pad 1, fire .5",
    balloons: "wind 1, birds .6", koi: "stream 1, birds .6 | stream 1, crickets .6", rain: "window 1, thunder .35", alpine: "wind .7, stream .7, birds .3 | wind .6, stream .5",
    dunes: "wind 1 | wind .8, crickets .4", jelly: "pad 1, brown .6", bamboo: "stream .8, birds .5, wind .4", lavenderfields: "birds .8, wind .6 | crickets 1, wind .4",
    rooftops: "city 1, wind .4 | city 1, rain .4",
    business: "city 1, cafe .4 | city 1, wind .3", nursing: "pad .8, rain .3 | pad .8, city .3", psych: "birds .8, stream .5 | crickets 1, stream .5",
    biology: "stream 1, pad .4", compsci: "pad 1, brown .5", engineering: "fire .4, library .6, rain .3", education: "library 1, birds .4 | library 1, rain .3",
    comms: "pad .8, city .5", civics: "city .7, birds .6, stream .4 | city .7, crickets .5", justice: "rain 1, library .5 | rain 1, thunder .3",
    writing: "library 1, birds .4 | library 1, fire .6", concert: "pad 1, library .3", track: "wind .8, birds .5 | wind .6, crickets .6",
    math: "pad 1, brown .4", chem: "library .8, stream .4", observatory: "wind .6, crickets .8 | wind .5, pad .6", ruins: "ocean .7, wind .6, birds .3 | ocean .7, crickets .6",
    valley: "wind 1, birds .6 | wind .8, crickets .6", sketchcity: "library 1, city .4",
    onsen: "stream 1, snow .5 | stream .9, snow .4, crickets .3", rainforest: "birds 1, rain .45, stream .4 | crickets 1, rain .5, stream .4", tidepool: "ocean 1, wind .35, birds .25 | ocean 1, crickets .35", volcano: "ocean .8, wind .5, birds .35 | ocean .7, fire .45, crickets .4", savanna: "wind 1, birds .5 | wind .7, crickets 1",  // sounds-n1
    pride: "city 1, birds .5 | city 1, crickets .5", graduation: "birds .9, wind .5 | crickets 1, wind .4", birthday: "cafe .6, pad .6 | pad .8, fire .5", geology: "stream .6, pad .7 | pad .9, stream .5",  // sounds-n5
    film: "pad .8, library .5 | pad .9, city .3", culinary: "cafe 1, fire .4 | cafe .7, fire .6", marinebio: "ocean .8, stream .5, brown .3 | ocean .7, pad .5",  // sounds-n6
    mushrooms: "stream .6, birds .8 | crickets 1, stream .5", sunflowers: "birds 1, wind .6 | crickets 1, wind .4", nighttrain: "brown 1, window .3 | brown 1, rain .4", ramen: "cafe 1, rain .6 | rain 1, cafe .5, city .3",  // sounds-n2
    greenhouse: "rain .5, birds .6, stream .3 | rain 1, pad .3", pottery: "library .7, birds .3, fire .3 | fire 1, library .5", campfire: "fire .8, birds .5, stream .3 | fire 1, crickets .8", aquarium: "pad .8, stream .6 | pad 1, brown .4",  // sounds-n3
    diadelosmuertos: "pad .7, birds .5, wind .3 | pad .8, crickets .6, fire .3", holi: "birds 1, wind .4, pad .3 | crickets .8, pad .6", ramadan: "wind .5, pad .6, city .3 | pad .8, crickets .6, wind .3", midautumn: "stream 1, wind .3, birds .3 | stream 1, crickets .7",  // sounds-n4
    france: "city .6, cafe .7, birds .5 | city .4, rain .35, pad .5",  // sounds-france
    japan: "birds .9, stream .8, wind .3 | crickets .9, stream .7, wind .35",  // sounds-japan
    morocco: "stream .9, birds .6, city .25 | stream .8, crickets .6, pad .4",  // sounds-morocco
    thailand: "ocean 1, birds .5, wind .3 | ocean .9, crickets .7, pad .4",  // sounds-thailand
    italy: "ocean 1, birds .5, cafe .4 | ocean 1, crickets .6",  // sounds-italy
    greece: "ocean 1, wind .4, birds .4 | ocean .9, crickets .7",  // sounds-greece
    egypt: "wind .6, birds .5, stream .4 | wind .4, crickets .7, pad .5",  // sounds-egypt
    canada: "stream .8, birds .7, wind .4 | wind .6, crickets .8, stream .5",  // sounds-canada
    venice: "stream .9, birds .5, city .3 | stream .8, crickets .6, pad .45",  // sounds-venice
    mexico: "city .55, birds .7, cafe .3 | city .3, crickets .8, pad .45",  // sounds-mexico
    brazil: "ocean 1, birds .6, city .25 | ocean .9, city .3, crickets .7",  // sounds-brazil
  };
  const parseMix = s => s.split(",").map(p => p.trim().split(/\s+/)).filter(p => NAME[p[0]]).map(([id, v]) => ({id, v: clamp(Number(v) || 1, 0, 1)}));
  function themeMix(skin, dark){
    let s = THEME[skin];
    if (!s) { const sk = (typeof SKINS !== "undefined" && SKINS.find(x => x.id === skin)) || {}; s = sk.group === "plain" ? "rain 1" : "rain 1, pad .4"; }
    const [day, night] = s.split("|");
    return parseMix(dark && night ? night : day);
  }

  /* ---------- Buffers: made once per sample rate, all circular so loops are seamless ---------- */
  const BUF = new Map();
  function cached(ctx, key, make){ const k = ctx.sampleRate + "|" + key; let b = BUF.get(k); if (!b) { b = make(); BUF.set(k, b); } return b; }
  function toBuffer(ctx, chans){ const b = ctx.createBuffer(chans.length, chans[0].length, ctx.sampleRate); chans.forEach((d, i) => b.getChannelData(i).set(d)); return b; }
  const NOISE_SEC = {white: 7.3, pink: 10.1, brown: 11.7};
  function noiseBuf(ctx, kind){
    return cached(ctx, "n:" + kind, () => {
      const sr = ctx.sampleRate, n = Math.round(NOISE_SEC[kind] * sr), rng = rngOf(hash("noise" + kind)), w = new Float32Array(n);
      for (let i = 0; i < n; i++) w[i] = rng() * 2 - 1;
      let d = w;
      // Two passes of each filter: the first warms it up from the end of the buffer, so the output wraps around smoothly.
      if (kind === "pink") {
        d = new Float32Array(n); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let p = 0; p < 2; p++) for (let i = 0; i < n; i++) {
          const x = w[i];
          b0 = .99886 * b0 + x * .0555179; b1 = .99332 * b1 + x * .0750759; b2 = .969 * b2 + x * .153852; b3 = .8665 * b3 + x * .3104856;
          b4 = .55 * b4 + x * .5329522; b5 = -.7616 * b5 - x * .016898; const y = b0 + b1 + b2 + b3 + b4 + b5 + b6 + x * .5362; b6 = x * .115926;
          if (p) d[i] = y;
        }
      } else if (kind === "brown") {
        d = new Float32Array(n); let y = 0; const k = Math.exp(-TAU * 22 / sr);
        for (let p = 0; p < 2; p++) for (let i = 0; i < n; i++) { y = k * y + (1 - k) * w[i]; if (p) d[i] = y; }
      }
      let m = 0; for (let i = 0; i < n; i++) m += d[i]; m /= n;
      let e = 0; for (let i = 0; i < n; i++) { d[i] -= m; e += d[i] * d[i]; }
      const sc = .25 / Math.sqrt(e / n); for (let i = 0; i < n; i++) d[i] *= sc;
      return toBuffer(ctx, [d]);
    });
  }
  // A stereo texture of many short grains, wrapped around the end so it loops without a seam.
  function texBuf(ctx, key, sec, fill){
    return cached(ctx, "t:" + key, () => {
      const sr = ctx.sampleRate, n = Math.round(sec * sr), L = new Float32Array(n), R = new Float32Array(n);
      const put = (at, g, pan, amp) => {
        const gl = Math.cos((pan + 1) * Math.PI / 4) * amp, gr = Math.sin((pan + 1) * Math.PI / 4) * amp;
        let j = ((Math.floor(at) % n) + n) % n;
        for (let k = 0; k < g.length; k++) { L[j] += g[k] * gl; R[j] += g[k] * gr; if (++j === n) j = 0; }
      };
      fill({sr, n, rng: rngOf(hash(key)), put});
      for (const d of [L, R]) { let m = 0; for (let i = 0; i < n; i++) m += d[i]; m /= n; for (let i = 0; i < n; i++) d[i] -= m; }
      return toBuffer(ctx, [L, R]);
    });
  }
  const smoothIn = (i, na) => .5 - .5 * Math.cos(Math.PI * i / na);
  function taper(g, sr){ const nt = Math.min(g.length, Math.max(4, Math.round(.002 * sr))); for (let i = 0; i < nt; i++) g[g.length - 1 - i] *= i / nt; return g; }
  // A short burst of noise ringing through a resonance: a drop, a tick or a crackle. Peak is 1.
  function blip(sr, rng, f, decay, q, att){
    const len = Math.max(8, Math.min(Math.ceil(decay * sr * 6 + sr * 3 * q / (Math.PI * f)), sr)), g = new Float32Array(len);
    const w = TAU * Math.min(f, sr * .45) / sr, r = Math.exp(-Math.PI * (f / q) / sr), c1 = 2 * r * Math.cos(w), c2 = -r * r;
    const na = Math.max(2, Math.round(att * sr)), kd = Math.exp(-1 / (decay * sr));
    let y1 = 0, y2 = 0, e = 1, pk = 0;
    for (let i = 0; i < len; i++) {
      const a = i < na ? smoothIn(i, na) : (e *= kd), y = (rng() * 2 - 1) * a * (1 - r) + c1 * y1 + c2 * y2;
      y2 = y1; y1 = y; g[i] = y; const ay = y < 0 ? -y : y; if (ay > pk) pk = ay;
    }
    if (pk) for (let i = 0; i < len; i++) g[i] /= pk;
    return taper(g, sr);
  }
  // A water bubble: a sine whose pitch rises as it decays.
  function bubble(sr, f, dur, rise){
    const len = Math.ceil(dur * sr * 5), g = new Float32Array(len), na = Math.max(2, Math.round(.0012 * sr)), kd = Math.exp(-1 / (dur * sr));
    let ph = 0, e = 1;
    for (let i = 0; i < len; i++) { const t = i / sr; ph += TAU * f * (1 + rise * Math.min(1.5, t / dur)) / sr; g[i] = Math.sin(ph) * (i < na ? smoothIn(i, na) : (e *= kd)); }
    return taper(g, sr);
  }
  // A smooth tone pulse (a cricket's wing stroke)
  function tonePulse(sr, f, d){
    const len = Math.round(d * sr), g = new Float32Array(len);
    for (let i = 0; i < len; i++) { const s = Math.sin(Math.PI * i / len); g[i] = Math.sin(TAU * f * i / sr) * s * s; }
    return g;
  }
  // A soft room reverb: decaying noise that gets darker as it fades, scaled to unit energy.
  function irBuf(ctx){
    return cached(ctx, "ir", () => {
      const sr = ctx.sampleRate, sec = 1.5, n = Math.round(sec * sr), rng = rngOf(99);
      return toBuffer(ctx, [0, 1].map(() => {
        const d = new Float32Array(n); let y = 0, e = 0;
        for (let i = 0; i < n; i++) {
          const t = i / sr, env = Math.exp(-t * 6.9 / 1.4) * (t < .015 ? smoothIn(t, .015) : 1), a = .7 - .64 * Math.min(1, t / 1.0);
          y += a * ((rng() * 2 - 1) - y); d[i] = y * env; e += d[i] * d[i];
        }
        const sc = 1 / Math.sqrt(e); for (let i = 0; i < n; i++) d[i] *= sc;
        return d;
      }));
    });
  }

  /* ---------- Engine: one per AudioContext (live, or offline for testing) ---------- */
  function Engine(ctx){
    const E = {ctx, voices: new Map(), live: false};
    E.mix = ctx.createGain(); E.master = ctx.createGain(); E.fade = ctx.createGain(); E.fade.gain.value = 0;
    // A gentle safety limiter: only touches rare peaks, so mixes never clip.
    E.lim = ctx.createDynamicsCompressor();
    E.hp = ctx.createBiquadFilter(); E.hp.type = "highpass"; E.hp.frequency.value = 25; E.hp.Q.value = .6;
    E.lim.threshold.value = -6; E.lim.knee.value = 4; E.lim.ratio.value = 12; E.lim.attack.value = .004; E.lim.release.value = .3;
    E.mix.connect(E.hp); E.hp.connect(E.master); E.master.connect(E.fade); E.fade.connect(E.lim); E.lim.connect(ctx.destination);
    E.verb = ctx.createConvolver(); E.verb.normalize = false; E.verb.buffer = irBuf(ctx); E.verb.connect(E.mix);
    E.tick = (look = 4) => {
      const now = ctx.currentTime;
      for (const [id, vc] of E.voices) {
        if (vc.dying && now > vc.dying) { vc.dispose(); E.voices.delete(id); }
        else vc.tick(now, now + look);
      }
    };
    E.apply = (mix, xf) => {
      const now = ctx.currentTime, norm = 1 / Math.sqrt(Math.max(1, mix.reduce((s, m) => s + m.v * m.v, 0))), want = new Map(mix.map(m => [m.id, m.v]));
      for (const [id, vc] of E.voices) if (!want.has(id) && !vc.dying) { vc.setLevel(0, xf); vc.dying = now + xf * 1.6 + .2; }
      for (const [id, v] of want) {
        let vc = E.voices.get(id);
        if (!vc) { vc = makeVoice(E, id, now + .03, (Math.random() * 4294967296) >>> 0); E.voices.set(id, vc); vc.tick(now, now + 4); }
        vc.dying = 0; vc.setLevel((CAL[id] || 1) * v * norm, xf);
      }
    };
    E.clear = () => { for (const vc of E.voices.values()) vc.dispose(); E.voices.clear(); for (const k of [...BUF.keys()]) if (k.includes("|t:")) BUF.delete(k); };
    return E;
  }
  // Move a parameter smoothly (an exponential approach that's done in about 'sec')
  function glide(param, v, sec, ctx){
    const now = ctx.currentTime;
    try { param.cancelScheduledValues(now); } catch (e) {}
    if (sec <= .02) param.setValueAtTime(v, now); else param.setTargetAtTime(v, now, sec / 4.5);
  }

  const kRate = p => { try { if (p && p.automationRate === "a-rate") p.automationRate = "k-rate"; } catch (e) {} };
  function makeVoice(E, id, t0, seed){
    const ctx = E.ctx, rng = rngOf(seed), body = ctx.createGain(), level = ctx.createGain(), wetIn = ctx.createGain(), wetLevel = ctx.createGain();
    level.gain.value = 0; wetLevel.gain.value = 0;
    body.connect(level); level.connect(E.mix); wetIn.connect(wetLevel); wetLevel.connect(E.verb);
    const srcs = [], seqs = [];
    const X = {
      ctx, rng, sr: ctx.sampleRate, out: body, wet: wetIn, t0,
      r: (a, b) => rr(rng, a, b), rl: (a, b) => rlog(rng, a, b), ri: (a, b) => Math.floor(rr(rng, a, b + 1)),
      g(v){ const n = ctx.createGain(); n.gain.value = v; return n; },
      // Filters update once per 128-sample block (k-rate): slow sweeps sound the same and cost far less CPU.
      bq(type, f, Q){ const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = Q == null ? .707 : Q; kRate(n.frequency); kRate(n.Q); return n; },
      pan(p){ const n = ctx.createStereoPanner(); n.pan.value = clamp(p, -1, 1); return n; },
      chain(...ns){ for (let i = 0; i < ns.length - 1; i++) ns[i].connect(ns[i + 1]); return ns[ns.length - 1]; },
      send(node, amt){ const s = X.g(amt); node.connect(s); s.connect(wetIn); return s; },
      loop(buf, rate){ const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate || 1; s.start(t0, rng() * buf.duration); srcs.push(s); return s; },
      noise(kind){ const s = X.loop(noiseBuf(ctx, kind), rr(rng, .97, 1.03)); X.drift(s.playbackRate, .955, 1.045, 7, 18); return s; },
      stereo(kind){ const m = ctx.createChannelMerger(2); X.noise(kind).connect(m, 0, 0); X.noise(kind).connect(m, 0, 1); return m; },
      tex(key, sec, fill, rate){ const s = X.loop(texBuf(ctx, key, sec, fill), rate || 1); X.drift(s.playbackRate, (rate || 1) * .97, (rate || 1) * 1.03, 6, 16); return s; },
      // a one-shot slice of a looping buffer, from a random spot
      once(buf, at, dur, rate){ const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate || rr(rng, .93, 1.07); s.start(at, rng() * buf.duration); s.stop(at + dur); return s; },
      osc(type, f, at, end){ const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.start(at); if (end) o.stop(end); else srcs.push(o); return o; },
      // a smooth shape over time for a gain (values 0..1 scaled by amp), always starting and ending at 0
      shape(param, at, dur, amp, fn){ const N = 96, c = new Float32Array(N); for (let i = 0; i < N; i++) c[i] = amp * fn(i / (N - 1)); c[0] = 0; c[N - 1] = 0; param.setValueAtTime(0, at); param.setValueCurveAtTime(c, at + .001, dur); },
      // slow random wandering of a parameter between lo and hi
      drift(param, lo, hi, dMin, dMax, log){ kRate(param); const f = () => log ? rlog(rng, lo, hi) : rr(rng, lo, hi); param.value = f(); seqs.push({next: t0, fn: t => { const d = rr(rng, dMin, dMax); param.setTargetAtTime(f(), t, d / 3); return t + d; }}); },
      // an event stream: fn(t) schedules something at t and returns the next time
      seq(first, fn){ seqs.push({next: first, fn}); }
    };
    (R[id] || R.rain)(X);
    return {
      id, level, dying: 0,
      setLevel(v, sec){ glide(level.gain, v, sec, ctx); glide(wetLevel.gain, v, sec, ctx); },
      tick(now, t1){ for (const s of seqs) { if (s.next < now) s.next = now + .05; let guard = 0; while (s.next < t1 && guard++ < 4000) { const nx = s.fn(s.next); s.next = nx > s.next ? nx : s.next + .05; } } },
      dispose(){ srcs.forEach(s => { try { s.stop(); } catch (e) {} }); try { level.disconnect(); wetLevel.disconnect(); } catch (e) {} }
    };
  }

  /* ---------- Recipes ---------- */
  const R = {};
  const patterFill = (rate, lo, hi) => T => {
    const cnt = Math.round(rate * T.n / T.sr);
    for (let k = 0; k < cnt; k++) T.put(T.rng() * T.n, blip(T.sr, T.rng, rlog(T.rng, lo, hi), rr(T.rng, .0015, .006), rr(T.rng, 1.5, 5), .0007), rr(T.rng, -.9, .9), Math.pow(T.rng(), 2.6) * .3);
  };
  // Soft steady rain: a hiss bed, a low body and a patter of thousands of tiny drops.
  R.rain = (X, lv = 1) => {
    const O = X.g(1); O.connect(X.out); X.drift(O.gain, .78, 1.1, 10, 24); X = Object.assign({}, X, {out: O});
    const lp = X.bq("lowpass", 3400, .5), bed = X.g(.5); X.drift(lp.frequency, 2400, 3800, 6, 16, true); X.drift(bed.gain, .38 * lv, .58 * lv, 5, 14);
    X.chain(X.stereo("pink"), X.bq("highpass", 380, .6), lp, bed, X.out);
    X.chain(X.stereo("brown"), X.bq("lowpass", 320, .6), X.g(.45 * lv), X.out);
    const pl = X.g(.6), plp = X.bq("lowpass", 4600, .5); X.drift(pl.gain, .45 * lv, .75 * lv, 4, 11);
    X.tex("patter1", 8.3, patterFill(420, 900, 4000)).connect(pl);
    X.tex("patter2", 6.1, patterFill(300, 800, 3400), .97).connect(pl);
    X.chain(pl, plp, X.out);
  };
  // Rain on a window: a muffled rain bed with drops ticking on the glass and the odd trickle.
  R.window = X => {
    const lp = X.bq("lowpass", 1500, .5), bed = X.g(.5); X.drift(lp.frequency, 1150, 1900, 6, 15, true); X.drift(bed.gain, .38, .6, 5, 13);
    X.chain(X.stereo("pink"), X.bq("highpass", 200, .6), lp, bed, X.out);
    X.chain(X.stereo("brown"), X.bq("lowpass", 260, .6), X.g(.42), X.out);
    const ticks = (key, sec, rate, drops) => X.tex(key, sec, T => {
      const cnt = Math.round(rate * sec);
      for (let k = 0; k < cnt; k++) T.put(T.rng() * T.n, blip(T.sr, T.rng, rlog(T.rng, 1300, 2900), rr(T.rng, .0015, .005), rr(T.rng, 6, 14), .0005), rr(T.rng, -.95, .95), Math.pow(T.rng(), 1.8) * .45);
      const soft = Math.round(150 * sec);
      for (let k = 0; k < soft; k++) T.put(T.rng() * T.n, blip(T.sr, T.rng, rlog(T.rng, 700, 2200), rr(T.rng, .002, .006), rr(T.rng, 2, 4), .0008), rr(T.rng, -.95, .95), Math.pow(T.rng(), 3) * .14);
      const big = Math.round(drops * sec);
      for (let k = 0; k < big; k++) {
        let at = T.rng() * T.n; const pan = rr(T.rng, -.8, .8), a = rr(T.rng, .35, .75), f = rlog(T.rng, 650, 1300);
        T.put(at, blip(T.sr, T.rng, f, rr(T.rng, .008, .018), rr(T.rng, 8, 16), .0008), pan, a);
        if (T.rng() < .4) for (let j = 0, m = Math.floor(rr(T.rng, 2, 6)); j < m; j++) { at += rr(T.rng, .035, .09) * T.sr; T.put(at, blip(T.sr, T.rng, f * rr(T.rng, 1.3, 2.2), .003, 10, .0005), pan + rr(T.rng, -.1, .1), a * .35 * (1 - j / m)); }
      }
    });
    const tg = X.g(.8); X.drift(tg.gain, .6, .95, 4, 12);
    ticks("wticks1", 7.7, 22, 2.2).connect(tg); ticks("wticks2", 5.3, 14, 1.4).connect(tg);
    const tl = X.chain(tg, X.bq("lowpass", 4200, .5), X.g(1)); tl.connect(X.out); X.send(tl, .12);
  };
  // Far thunder: soft rain with a rare, slow rolling rumble.
  R.thunder = X => {
    R.rain(X, .82);
    X.seq(X.t0 + X.r(3, 9), t => {
      const lp = X.bq("lowpass", X.rl(95, 170), .6), env = X.g(0), p = X.pan(X.r(-.6, .6)), a = env.gain, pk = X.r(.65, 1);
      a.setValueAtTime(0, t); a.setTargetAtTime(pk, t, X.r(.3, .6));
      let tt = t + X.r(1, 1.8);
      for (let k = 0, m = X.ri(1, 3); k < m; k++) { a.setTargetAtTime(pk * X.r(.45, 1), tt, X.r(.3, .7)); tt += X.r(.9, 1.7); }
      a.setTargetAtTime(0, tt, X.r(1.6, 2.4));
      lp.frequency.setTargetAtTime(lp.frequency.value * .7, tt, 1.5);
      X.chain(X.once(noiseBuf(X.ctx, "brown"), t, tt - t + 14), lp, env, p, X.out); X.send(p, .25);
      return t + X.r(22, 60);
    });
  };
  // Ocean: a distant surf bed, then waves that swell, break into foam and wash back.
  R.ocean = X => {
    X.chain(X.stereo("brown"), X.bq("lowpass", 260, .5), X.g(.7), X.out);
    X.seq(X.t0 + X.r(.1, 1.2), t => {
      const rise = X.r(2.6, 4.4), fall = X.r(5, 7.5), dur = rise + fall, pk = X.r(.55, .85), p0 = X.r(-.45, .45), c = rise / dur;
      const wave = x => x < c ? Math.pow(Math.sin(Math.PI / 2 * x / c), 2) : Math.exp(-4.2 * (x - c) / (1 - c)) * (1 - Math.pow((x - c) / (1 - c), 8));
      const lp = X.bq("lowpass", 230, .6), e = X.g(0), pn = X.pan(p0);
      lp.frequency.setValueAtTime(230, t); lp.frequency.exponentialRampToValueAtTime(X.rl(900, 1500), t + rise); lp.frequency.exponentialRampToValueAtTime(260, t + dur);
      X.shape(e.gain, t, dur, pk * 1.2, wave);
      X.chain(X.once(noiseBuf(X.ctx, "pink"), t, dur + .1), lp, e, pn, X.out);
      // foam: a hiss and a fizz of tiny bubbles as the wave breaks and slides back
      const w0 = t + rise * .8, wd = fall * 1.1, wc = .12, foam = x => x < wc ? Math.pow(Math.sin(Math.PI / 2 * x / wc), 2) : Math.exp(-3.4 * (x - wc) / (1 - wc)) * (1 - Math.pow((x - wc) / (1 - wc), 8));
      const bp = X.bq("bandpass", 1300, .5), fe = X.g(0), fp = X.pan(p0); fp.pan.setValueAtTime(p0, w0); fp.pan.linearRampToValueAtTime(clamp(p0 + X.r(-.4, .4), -1, 1), w0 + wd);
      X.shape(fe.gain, w0, wd, pk * .55, foam);
      X.chain(X.once(noiseBuf(X.ctx, "pink"), w0, wd + .1), bp, fe, fp, X.out);
      const fz = X.g(0); X.shape(fz.gain, w0 + .3, wd, pk * .45, foam);
      X.chain(X.once(texBuf(X.ctx, "patter1", 8.3, patterFill(420, 900, 4000)), w0 + .3, wd + .1), X.bq("lowpass", 3800, .5), fz, fp);
      fp.connect(X.out); X.send(fp, .12);
      return t + X.r(6.5, 10.5);
    });
  };
  // A babbling stream: thousands of little bubbles over a soft water hiss.
  R.stream = X => {
    const bed = X.g(.35); X.drift(bed.gain, .25, .45, 4, 10);
    X.chain(X.stereo("pink"), X.bq("highpass", 300, .6), X.bq("lowpass", 2400, .5), bed, X.out);
    X.chain(X.stereo("brown"), X.bq("lowpass", 380, .6), X.g(.25), X.out);
    const brook = (key, sec, base) => X.tex(key, sec, T => {
      const ph1 = T.rng() * TAU, ph2 = T.rng() * TAU; let i = 0;
      while (i < T.n) {
        const x = i / T.n, rate = base * (1 + .55 * Math.sin(TAU * 3 * x + ph1) + .3 * Math.sin(TAU * 7 * x + ph2));
        i += Math.max(1, -Math.log(1 - T.rng()) / Math.max(5, rate) * T.sr);
        const deep = T.rng() < .12, f = deep ? rlog(T.rng, 170, 380) : rlog(T.rng, 380, 1300), dur = clamp(9 / f * rr(T.rng, .7, 1.5), .006, .05);
        T.put(i, bubble(T.sr, f, dur, rr(T.rng, .15, .6)), rr(T.rng, -.85, .85), Math.pow(T.rng(), 1.6) * (deep ? .7 : .45));
      }
    });
    const a = X.g(.5), b = X.g(.5); X.drift(a.gain, .25, .7, 3, 9); X.drift(b.gain, .25, .7, 3, 9);
    brook("brook1", 7.9, 75).connect(a); brook("brook2", 5.7, 55).connect(b);
    const bl = X.bq("lowpass", 3000, .5); a.connect(bl); b.connect(bl); bl.connect(X.out); X.send(bl, .1);
  };
  // Wind: two wandering gusty layers and a low body.
  R.wind = (X, lv = 1) => {
    const layer = (lo, hi, pan) => {
      const bp = X.bq("bandpass", 500, 1.2), gg = X.g(.5), pn = X.pan(pan);
      X.drift(bp.frequency, lo, hi, 3, 9, true); X.drift(bp.Q, .7, 2.2, 4, 10); X.drift(gg.gain, .06 * lv, 1 * lv, 2.5, 8); X.drift(pn.pan, pan - .35, pan + .35, 4, 10);
      X.chain(X.noise("pink"), bp, gg, pn, X.out);
    };
    layer(260, 750, -.45); layer(330, 950, .45);
    const low = X.g(.45); X.drift(low.gain, .25 * lv, .6 * lv, 3, 9);
    X.chain(X.stereo("brown"), X.bq("lowpass", 170, .6), low, X.out);
    const rs = X.g(.05); X.drift(rs.gain, 0, .1 * lv, 2, 7);
    X.chain(X.stereo("pink"), X.bq("highpass", 1600, .6), X.bq("lowpass", 4200, .5), rs, X.out);
  };
  // Snowy wind: hushed and airy, with a faint whistle.
  R.snow = X => {
    const lp = X.bq("lowpass", 3400, .5), air = X.g(.5); X.drift(lp.frequency, 2600, 3900, 5, 12, true); X.drift(air.gain, .22, .8, 4, 12);
    X.chain(X.stereo("pink"), X.bq("highpass", 650, .6), lp, air, X.out);
    const bp = X.bq("bandpass", 1100, 6), wh = X.g(.06), wp = X.pan(.3);
    X.drift(bp.frequency, 800, 1500, 4, 11, true); X.drift(bp.Q, 4, 9, 5, 12); X.drift(wh.gain, .01, .12, 3, 9); X.drift(wp.pan, -.5, .5, 6, 14);
    X.chain(X.noise("pink"), bp, wh, wp, X.out);
    const low = X.g(.3); X.drift(low.gain, .15, .4, 4, 10);
    X.chain(X.stereo("brown"), X.bq("lowpass", 160, .6), low, X.out);
  };
  // Fireplace: a warm roar, a faint hiss, crackle bursts and the odd soft pop.
  R.fire = X => {
    const roar = X.g(.7); X.drift(roar.gain, .45, .9, 1.2, 3.5);
    X.chain(X.stereo("brown"), X.bq("lowpass", 380, .6), roar, X.out);
    const hiss = X.g(.06); X.drift(hiss.gain, .025, .08, .8, 3);
    X.chain(X.stereo("pink"), X.bq("highpass", 1400, .6), X.bq("lowpass", 4000, .5), hiss, X.out);
    const crackle = (key, sec, bursts) => X.tex(key, sec, T => {
      for (let b = 0, nb = Math.round(bursts * sec); b < nb; b++) {
        let at = T.rng() * T.n; const m = Math.floor(rr(T.rng, 2, 14)), ca = rr(T.rng, .3, 1), pan = rr(T.rng, -.7, .7);
        for (let k = 0; k < m; k++) { at += rr(T.rng, .004, .045) * T.sr; T.put(at, blip(T.sr, T.rng, rlog(T.rng, 800, 3000), rr(T.rng, .0007, .0025), rr(T.rng, 1.5, 5), .0007), pan + rr(T.rng, -.15, .15), Math.pow(T.rng(), 1.5) * ca * .9); }
      }
      for (let k = 0, m = Math.round(22 * sec); k < m; k++) T.put(T.rng() * T.n, blip(T.sr, T.rng, rlog(T.rng, 700, 2800), rr(T.rng, .0007, .002), rr(T.rng, 1.5, 4), .0007), rr(T.rng, -.8, .8), Math.pow(T.rng(), 2) * .12);
    });
    const cg = X.g(.7); X.drift(cg.gain, .45, .9, 2, 6);
    crackle("crackle1", 7.3, 1.6).connect(cg); crackle("crackle2", 5.9, 1.1).connect(cg);
    X.chain(cg, X.bq("lowpass", 4200, .6), X.bq("lowpass", 5200, .6), X.out);
    const pops = texBuf(X.ctx, "pops", 2, T => { for (let k = 0; k < 6; k++) T.put(k * T.n / 6 + 50, blip(T.sr, T.rng, rlog(T.rng, 600, 1500), rr(T.rng, .004, .01), 3, .0008), 0, 1); });
    X.seq(X.t0 + X.r(1, 4), t => {
      const p = X.pan(X.r(-.6, .6)), f = X.r(120, 210), o = X.osc("sine", f, t, t + .3), og = X.g(0), a = X.r(.15, .3);
      o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .6, t + .08);
      og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(a, t + .003); og.gain.setTargetAtTime(0, t + .004, .03);
      const s = X.ctx.createBufferSource(); s.buffer = pops; s.playbackRate.value = X.r(.8, 1.2); const sg = X.g(X.r(.3, .55));
      s.start(t, X.ri(0, 5) * 2 / 6); s.stop(t + .25);
      X.chain(o, og, p); X.chain(s, sg, X.bq("lowpass", 4000, .5), p); p.connect(X.out);
      return t + X.r(1.5, 7);
    });
  };
  // Café: a warm murmur of distant voices (formant-filtered buzz and breath), room tone and the occasional cup clink.
  R.cafe = X => {
    X.chain(X.stereo("brown"), X.bq("lowpass", 450, .6), X.g(.5), X.out);
    const far = X.g(.2); X.drift(far.gain, .14, .27, 4, 12);
    X.chain(X.stereo("pink"), X.bq("bandpass", 650, .6), X.bq("lowpass", 1500, .5), far, X.out); X.send(far, .3);
    const breath = X.noise("pink");  // one shared breath source for every talker
    const VOW = [[730, 1090], [530, 1840], [270, 2290], [570, 840], [440, 1020], [300, 870], [660, 1720], [490, 1350], [400, 1600]];
    const talker = (pan, base, sc, lvl) => {
      const o = X.osc("sawtooth", base, X.t0), og = X.g(.2), ng = X.g(.35); kRate(o.frequency);
      const f1 = X.bq("bandpass", 500, 5), f2 = X.bq("bandpass", 1500, 7), g1 = X.g(1), g2 = X.g(.5), env = X.g(0), lp = X.bq("lowpass", X.r(1100, 1600), .5), pn = X.pan(pan);
      o.connect(og); breath.connect(ng);
      [og, ng].forEach(s => { s.connect(f1); s.connect(f2); });
      f1.connect(g1); f2.connect(g2); g1.connect(env); g2.connect(env); X.chain(env, lp, pn, X.out); X.send(pn, .55);
      let left = 0, b2 = base;
      X.seq(X.t0 + X.r(0, 2.5), t => {
        if (left <= 0) { left = X.ri(4, 16); b2 = base * X.r(.92, 1.08); }
        const d = X.r(.11, .26), v = VOW[Math.floor(X.rng() * VOW.length)], a = X.r(.5, 1) * lvl;
        f1.frequency.setTargetAtTime(v[0] * sc, t, .03); f2.frequency.setTargetAtTime(v[1] * sc, t, .03);
        o.frequency.setTargetAtTime(b2 * X.r(.9, 1.15), t, .06);
        env.gain.setTargetAtTime(a, t, .025); env.gain.setTargetAtTime(a * X.r(.1, .35), t + d * .65, .035);
        if (--left <= 0) { env.gain.setTargetAtTime(0, t + d, .06); return t + d + X.r(.6, 3.5); }
        return t + d;
      });
    };
    talker(-.6, 110, 1, .85); talker(-.15, 205, 1.12, .75); talker(.3, 128, 1, .9); talker(.65, 215, 1.15, .65);
    X.seq(X.t0 + X.r(3, 10), t => {
      const clink = (t1, a) => {
        const f0 = X.rl(1500, 2300), p = X.pan(X.r(-.7, .7));
        [[1, 1, .35], [1.52, .5, .25], [2.21, .3, .15]].forEach(([m, g, d]) => { const o = X.osc("sine", f0 * m, t1, t1 + d * 6), og = X.g(0); og.gain.setValueAtTime(0, t1); og.gain.linearRampToValueAtTime(a * g, t1 + .003); og.gain.setTargetAtTime(0, t1 + .004, d / 3); X.chain(o, og, p); });
        p.connect(X.out); X.send(p, .6);
      };
      const a = X.r(.04, .08); clink(t, a); if (X.rng() < .4) clink(t + X.r(.05, .12), a * .6);
      return t + X.r(7, 22);
    });
  };
  // Forest birds: sparse, gentle calls from different directions over a soft breeze.
  R.birds = X => {
    const br = X.g(.3); X.drift(br.gain, .12, .4, 3, 9);
    X.chain(X.stereo("pink"), X.bq("highpass", 350, .6), X.bq("lowpass", 2000, .5), br, X.out);
    X.chain(X.stereo("brown"), X.bq("lowpass", 220, .6), X.g(.3), X.out);
    const note = (o, g, t, f0, f1, d, a) => {
      const e = Math.min(.018, d * .3);
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + e); g.gain.setValueAtTime(a, t + d - e); g.gain.linearRampToValueAtTime(0, t + d);
      return t + d;
    };
    const SPECIES = [
      (o, g, t, a) => { const f = X.r(3000, 3600); note(o, g, t, f, f * .93, .28, a); return note(o, g, t + .4, f * .82, f * .8, .34, a * .9); },
      (o, g, t, a) => { const f = X.r(2400, 3100), m = X.ri(6, 11), d = X.r(.035, .05), gap = X.r(.025, .04); let e = t; for (let k = 0; k < m; k++) e = note(o, g, t + k * (d + gap), f * 1.05, f * .95, d, a * (.7 + .3 * Math.sin(k))); return e; },
      (o, g, t, a) => { let e = t; for (let k = 0, m = X.ri(4, 7); k < m; k++) { const f = X.r(2200, 3400); e = note(o, g, e + .03, f, f * X.r(.85, 1.15), X.r(.07, .13), a * X.r(.6, 1)); } return e; },
      (o, g, t, a) => { let e = t; for (let k = 0, m = X.ri(1, 3); k < m; k++) e = note(o, g, e + .12, 2000, X.r(2800, 3300), .06, a); return e; },
      (o, g, t, a) => { let e = t; for (let k = 0, m = X.ri(2, 3); k < m; k++) e = note(o, g, e + .25, 640, 610, .38, a * 1.3); return e; }
    ];
    const call = (t, sp, pan, a) => {
      const o = X.osc("sine", 3000, t), g = X.g(0), pn = X.pan(pan);
      X.chain(o, g, pn, X.out); X.send(pn, .5);
      const end = SPECIES[sp](o, g, t, a); o.stop(end + .05); return end;
    };
    X.seq(X.t0 + X.r(.5, 2), t => {
      const sp = X.ri(0, SPECIES.length - 1), pan = X.r(-.85, .85), a = X.r(.05, .14);
      let end = call(t, sp, pan, a);
      if (X.rng() < .35) end = call(end + X.r(.4, 1.2), sp, clamp(-pan + X.r(-.2, .2), -1, 1), a * X.r(.5, .8));
      return end + X.r(1.2, 6);
    });
  };
  // Night crickets: a few nearby crickets, a faint far chorus and a soft night bed.
  R.crickets = X => {
    const bed = X.g(.55); X.drift(bed.gain, .45, .65, 5, 14);
    X.chain(X.stereo("brown"), X.bq("lowpass", 320, .6), bed, X.out);
    X.chain(X.stereo("pink"), X.bq("bandpass", 1100, .5), X.g(.06), X.out);
    const cricket = (key, sec, f, period, pan, amp) => X.tex(key, sec, T => {
      const chirps = Math.max(1, Math.round(sec / period)), per = T.n / chirps;
      for (let c = 0; c < chirps; c++) {
        const at = c * per + rr(T.rng, -.03, .03) * T.sr, m = T.rng() < .5 ? 3 : 4;
        for (let p = 0; p < m; p++) T.put(at + p * .03 * T.sr, tonePulse(T.sr, f * rr(T.rng, .996, 1.004), .018), pan, amp * rr(T.rng, .85, 1));
      }
    });
    const cl = X.bq("lowpass", 5200, .5);
    [["cr1", 5.1, 3350, .72, -.55], ["cr2", 4.3, 3800, .61, .5], ["cr3", 3.7, 4100, .9, .1]].forEach(([k, s, f, per, pan]) => {
      const gg = X.g(.8); X.drift(gg.gain, .05, 1, 4, 14); cricket(k, s, f, per, pan, .075).connect(gg); gg.connect(cl);
    });
    X.chain(X.tex("crchorus", 6.7, T => {
      for (let c = 0; c < 14; c++) { const f = rr(T.rng, 3000, 4500), pan = rr(T.rng, -.9, .9), per = rr(T.rng, .5, 1.1), a = rr(T.rng, .01, .026), ch = Math.max(1, Math.round(6.7 / per)), step = T.n / ch, off = T.rng() * T.n;
        for (let k = 0; k < ch; k++) for (let p = 0; p < 3; p++) T.put(off + k * step + p * .03 * T.sr, tonePulse(T.sr, f, .016), pan, a); }
    }), X.g(.8), cl);
    cl.connect(X.out); X.send(cl, .25);
  };
  // City at night: distant traffic hum, cars passing now and then, and a rare far-off horn or siren.
  R.city = X => {
    const hum = X.g(.75); X.drift(hum.gain, .55, .85, 5, 14);
    X.chain(X.stereo("brown"), X.bq("lowpass", 200, .6), hum, X.out);
    const wash = X.g(.2); X.drift(wash.gain, .1, .28, 5, 15);
    X.chain(X.stereo("pink"), X.bq("bandpass", 420, .7), X.bq("lowpass", 1100, .5), wash, X.out);
    X.seq(X.t0 + X.r(.5, 3), t => {
      const d = X.r(5, 9), s = X.r(-1, 1) < 0 ? -1 : 1, e = X.g(0), pn = X.pan(-.9 * s), bp = X.bq("bandpass", X.r(300, 600), .9);
      pn.pan.setValueAtTime(-.9 * s, t); pn.pan.linearRampToValueAtTime(.9 * s, t + d);
      X.shape(e.gain, t, d, X.r(.35, .75), x => Math.exp(-Math.pow((x - .5) / .2, 2)));
      X.chain(X.once(noiseBuf(X.ctx, "pink"), t, d + .1), bp, X.bq("lowpass", 1300, .5), e, pn, X.out);
      return t + X.r(3, 11);
    });
    X.seq(X.t0 + X.r(8, 20), t => {
      const k = X.rng(), p = X.pan(X.r(-.8, .8)), lp = X.bq("lowpass", 1000, .5); X.chain(lp, p, X.out); X.send(p, .8);
      if (k < .45) { // a distant car horn
        const f = X.r(300, 360), n = X.rng() < .5 ? 1 : 2;
        for (let i = 0; i < n; i++) { const t1 = t + i * .45, d = X.r(.25, .4); [f, f * 1.26].forEach(fr => { const o = X.osc("triangle", fr, t1, t1 + d + .1), g = X.g(0); X.shape(g.gain, t1, d, .03, x => Math.min(1, x * 12, (1 - x) * 12)); X.chain(o, g, lp); }); }
      } else if (k < .8) { // a far-off siren
        const o = X.osc("sine", 650, t, t + 9), g = X.g(0), c = new Float32Array(64);
        for (let i = 0; i < 64; i++) c[i] = 760 + 130 * Math.sin(TAU * 2 * i / 63);
        o.frequency.setValueCurveAtTime(c, t, 8.8); X.shape(g.gain, t, 8.8, .022, x => Math.pow(Math.sin(Math.PI * x), 2)); X.chain(o, g, lp);
      } else { // a train rumbling past far away
        const g = X.g(0); X.shape(g.gain, t, 12, .9, x => Math.pow(Math.sin(Math.PI * x), 2));
        X.chain(X.once(noiseBuf(X.ctx, "brown"), t, 12.1), X.bq("lowpass", 150, .6), g, lp);
      }
      return t + X.r(35, 80);
    });
  };
  // Library: quiet room tone with soft air, and a rare page turn.
  R.library = X => {
    X.chain(X.stereo("brown"), X.bq("highpass", 35, .6), X.bq("lowpass", 280, .6), X.g(.7), X.out);
    const air = X.g(.13); X.drift(air.gain, .1, .16, 10, 25);
    X.chain(X.stereo("pink"), X.bq("highpass", 180, .6), X.bq("lowpass", 1300, .5), air, X.out);
    X.seq(X.t0 + X.r(4, 10), t => {
      const d = X.r(.35, .6), a = X.r(.22, .38), bp = X.bq("bandpass", 1700, .8), e = X.g(0), p = X.pan(X.r(-.5, .5));
      bp.frequency.setValueAtTime(1700, t); bp.frequency.linearRampToValueAtTime(2600, t + d);
      const fl = Array.from({length: 7}, () => X.r(.3, 1));
      X.shape(e.gain, t, d, a, x => { const i = Math.min(5, Math.floor(x * 6)), f = x * 6 - i; return (fl[i] * (1 - f) + fl[i + 1] * f) * Math.pow(Math.sin(Math.PI * x), .6); });
      X.chain(X.once(noiseBuf(X.ctx, "pink"), t, d + .1), bp, X.bq("lowpass", 4200, .5), e, p); p.connect(X.out); X.send(p, .4);
      const th = X.g(0), t2 = t + d * .85; X.shape(th.gain, t2, .09, a * 1.4, x => Math.pow(Math.sin(Math.PI * x), 2));
      X.chain(X.once(noiseBuf(X.ctx, "brown"), t2, .2), X.bq("lowpass", 450, .6), th, p);
      return t + X.r(18, 55);
    });
  };
  R.brown = X => { const lv = X.g(1); X.drift(lv.gain, .92, 1.05, 10, 25); X.chain(X.stereo("brown"), X.bq("highpass", 32, .6), X.bq("lowpass", 1000, .5), lv, X.out); };
  R.pink = X => { const lv = X.g(1); X.drift(lv.gain, .92, 1.05, 10, 25); X.chain(X.stereo("pink"), X.bq("highpass", 40, .6), X.bq("lowpass", 5200, .5), lv, X.out); };
  // Soft pad: a slow, warm chord drone that breathes and drifts between three related chords. No melody.
  R.pad = X => {
    const bus = X.g(1), lp = X.bq("lowpass", 1300, .5); X.drift(lp.frequency, 900, 1700, 10, 25, true);
    X.chain(bus, lp, X.out); X.send(lp, .9);
    X.chain(X.stereo("pink"), X.bq("bandpass", 1800, .4), X.g(.012), X.out);
    const root = [123.47, 130.81, 138.59, 146.83][X.ri(0, 3)];
    const CH = [[-12, -5, 0, 4, 11, 14], [-15, -8, -3, 0, 4, 7], [-19, -7, -3, 0, 4, 7]];
    const act = new Map();
    let ci = 0;
    const setChord = (t, ch, fade) => {
      ch.forEach(s => {
        if (act.has(s)) return;
        const f = root * Math.pow(2, s / 12), lv = .085 * (f < 90 ? 1.25 : f > 300 ? .7 : 1);
        const o1 = X.osc("sine", f, t), o2 = X.osc("triangle", f * Math.pow(2, X.r(-5, 5) / 1200), t), g2 = X.g(.35), g = X.g(0);
        o1.connect(g); X.chain(o2, g2, g); g.connect(bus);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lv, t + fade);
        act.set(s, {o1, o2, g, lv, next: t + fade});
      });
      for (const [s, v] of act) if (!ch.includes(s)) {
        v.g.gain.cancelScheduledValues(t); v.g.gain.setTargetAtTime(0, t, fade / 3.5);
        v.o1.stop(t + fade * 2.2); v.o2.stop(t + fade * 2.2); act.delete(s);
      }
    };
    X.seq(X.t0, t => {
      if (t === X.t0) setChord(t, CH[0], 6);
      else { ci = (ci + (X.rng() < .5 ? 1 : 2)) % CH.length; setChord(t, CH[ci], X.r(9, 12)); }
      return t + X.r(30, 48);
    });
    X.seq(X.t0 + 6, t => { for (const v of act.values()) if (v.next <= t + 2) { const d = X.r(6, 14); v.g.gain.setTargetAtTime(v.lv * X.r(.55, 1), v.next, d / 3); v.next += d; } return t + 2; });
  };

  /* ---------- Settings and plan ---------- */
  const DEF = {on: false, mode: "focus", vol: .7, pick: "theme", mix: [{id: "rain", v: 1}], stopAfter: 60, hidePause: false};
  const cfg = () => { const s = (state.settings && state.settings.sounds) || {}; return Object.assign({}, DEF, s, {mix: Array.isArray(s.mix) && s.mix.length ? s.mix.filter(m => m && NAME[m.id]).slice(0, 3) : DEF.mix}); };
  function save(p){ state.settings = Object.assign({}, state.settings, {sounds: Object.assign(cfg(), p)}); saveSettings(); }
  const isPro = () => { try { return typeof PLAN === "undefined" || !PLAN ? true : !!PLAN.isPro(); } catch (e) { return true; } };
  const paywallOn = () => { try { return typeof PLAN !== "undefined" && PLAN ? !!PLAN.paywall() : false; } catch (e) { return false; } };
  const proSheet = why => { try { if (typeof PLAN !== "undefined" && PLAN) { PLAN.openSheet(why); return; } } catch (e) {} toast(why); };
  const skinNow = () => document.documentElement.dataset.skin || (typeof effSkinId === "function" ? effSkinId() : "classic") || "classic";
  const darkNow = () => { try { return isDark(); } catch (e) { return document.documentElement.dataset.theme === "dark"; } };
  const skinName = id => { const s = (typeof SKINS !== "undefined" && SKINS.find(x => x.id === id)) || null; return s ? s.name : "Your Theme"; };
  // What to play right now, after plan rules
  function resolveMix(c = cfg()){
    const pro = isPro();
    if (c.pick === "theme" && pro) return themeMix(skinNow(), darkNow());
    let m = c.mix.map(x => ({id: x.id, v: clamp(Number(x.v) || 1, .05, 1)}));
    if (!pro) m = m.filter(x => FREE.has(x.id)).slice(0, 1).map(x => ({id: x.id, v: 1}));
    return m.length ? m.slice(0, 3) : [{id: "rain", v: 1}];
  }
  const joinNames = ids => { const n = ids.map(id => NAME[id]); return n.length < 2 ? n.join("") : n.slice(0, -1).join(", ") + " and " + n[n.length - 1]; };

  /* ---------- Playback control ---------- */
  let E = null, tickT = null, suspendT = null, idleT = null, sleepT = null, previewT = null, blockT = null, themeT = null;
  let armed = false, slept = false, hiddenHold = false, previewing = null, blocked = false;
  function engine(){
    if (E) return E;
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    try { E = Engine(new C({latencyHint: "playback"})); } catch (e) { try { E = Engine(new C()); } catch (e2) { E = null; } }
    return E;
  }
  const focusOn = () => !!(pomo.running && pomo.mode === "focus");
  const timerActive = () => !!(pomo.running || pomo.left > 0);
  function desired(){
    if (previewing) return true;
    const c = cfg();
    if (!c.on || !armed || slept || hiddenHold) return false;
    return c.mode === "always" ? true : focusOn();
  }
  const live = () => !!(E && E.live);
  const volGain = v => Math.pow(clamp(Number(v) || 0, 0, 1), 1.5);
  function sync(fin = 3, fout = 3){
    if (desired()) start(fin); else if (live()) stop(fout);
    bits();
  }
  function start(fin){
    const e = engine(); if (!e) { toast("Sounds aren't available in this browser"); previewing = null; return; }
    clearTimeout(suspendT); clearTimeout(idleT);
    if (e.ctx.state !== "running") {
      try { const p = e.ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (err) {}
      clearTimeout(blockT); blockT = setTimeout(() => { const b = !!(E && E.live && E.ctx.state !== "running"); if (b !== blocked) { blocked = b; bits(); } }, 600);
    } else blocked = false;
    e.master.gain.value = volGain(cfg().vol);
    const was = e.live;
    e.apply(previewing || resolveMix(), was ? 2.5 : .02);
    if (!was) { e.live = true; glide(e.fade.gain, 1, fin, e.ctx); }
    if (!tickT) tickT = setInterval(() => { if (E) E.tick(); }, 700);
    e.tick();
    const c = cfg();
    if (!previewing && c.mode === "always" && c.stopAfter > 0 && !sleepT) sleepT = setTimeout(() => { sleepT = null; slept = true; sync(0, 40); }, c.stopAfter * 60000);
  }
  function stop(fout){
    if (!E) return;
    E.live = false; blocked = false;
    clearTimeout(sleepT); sleepT = null;
    glide(E.fade.gain, 0, fout, E.ctx);
    clearTimeout(suspendT);
    suspendT = setTimeout(() => {
      if (!E || E.live) return;
      clearInterval(tickT); tickT = null;
      try { E.ctx.suspend(); } catch (e) {}
      clearTimeout(idleT); idleT = setTimeout(() => { if (E && !E.live) E.clear(); }, 120000);
    }, fout * 1400 + 300);
  }
  function preview(mix){
    clearTimeout(previewT);
    if (live() && !previewing) { E.apply(mix, 1.5); return; }  // already playing: just switch
    previewing = mix; start(1); bits();
    if (live()) E.apply(mix, 1.2);
    previewT = setTimeout(() => { previewing = null; if (desired()) E.apply(resolveMix(), 2); sync(2, 2.5); }, 9000);
  }
  // After a settings change: switch what's playing (crossfade), or start/stop
  function refresh(){ if (live() && !previewing) { E.master.gain.value = volGain(cfg().vol); E.apply(resolveMix(), 2.5); } sync(2, 2.5); }

  // Focus timer events. Clicks on Start run this synchronously, so the browser allows sound to begin.
  hook("focus", e => {
    const c = cfg();
    if (!e || !c.on) return;
    if (e.type === "start") { if (e.mode === "focus") { armed = true; slept = false; } if (previewing) { clearTimeout(previewT); previewing = null; if (live()) E.apply(resolveMix(), 2); } sync(4, 3); }
    else if (e.type === "pause") sync(2, 2);
    else if (e.type === "stop") sync(2, 3);
    else if (e.type === "end") sync(4, e.mode === "focus" ? 12 : 3);  // a slow, sleep-safe fade when a focus session ends
  });
  document.addEventListener("visibilitychange", () => {
    const h = !!(document.hidden && cfg().hidePause);
    if (h !== hiddenHold) { hiddenHold = h; sync(2, 1.5); }
  });
  // Theme or dark mode changed while a theme mix is playing: glide to the new mix
  try {
    new MutationObserver(() => { if (!live() || previewing || cfg().pick !== "theme") return; clearTimeout(themeT); themeT = setTimeout(() => { if (live() && !previewing) E.apply(resolveMix(), 4); bits(); }, 700); })
      .observe(document.documentElement, {attributes: true, attributeFilter: ["data-skin", "data-theme"]});
  } catch (e) {}

  /* ---------- UI ---------- */
  const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const IC_ON = svg(`<path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" stroke-width="1.6"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.3 6.5a8 8 0 0 1 0 11"/>`);
  const IC_OFF = svg(`<path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" stroke-width="1.6"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>`);
  const IC_WAVE = svg(`<path d="M3 12c2-5 4-5 6 0s4 5 6 0 4-5 6 0"/>`);
  const CHEV = svg(`<path d="M6 9l6 6 6-6"/>`);
  const EQ = `<span class="snd-eq" aria-hidden="true"><i></i><i></i><i></i></span>`;
  let panelOpen = false, touched = false;
  const pb = () => PRO_BADGE;
  function summary(c = cfg()){
    const pro = isPro(), m = resolveMix(c), what = c.pick === "theme" && pro && m.length > 1 ? `${skinName(skinNow())} Mix` : joinNames(m.map(x => x.id));
    if (!shownOn(c)) return "Off. Turn on for calm sounds while you focus.";
    if (blocked) return `${what}. Tap the speaker to start the sound.`;
    if (c.mode === "always") return `${what}, keeps playing`;
    return `${what}, plays during focus`;
  }
  function panelHTML(c = cfg()){
    const pro = isPro(), lockedPro = paywallOn() && !pro, theme = c.pick === "theme" && pro;
    const sel = new Set(theme ? [] : resolveMix(c).map(m => m.id));
    const tm = themeMix(skinNow(), darkNow());
    const chips = LIST.map(([id, name]) => `<button type="button" class="snd-chip" data-act="snd-pick" data-id="${id}" aria-pressed="${sel.has(id)}">${esc(name)}${lockedPro && !FREE.has(id) ? pb() : ""}</button>`).join("");
    const mixRows = !theme && pro && sel.size ? `<div class="snd-mix">${resolveMix(c).map(m => `<label class="snd-lv"><span>${esc(NAME[m.id])}</span><input type="range" min="0.05" max="1" step="0.05" value="${m.v}" data-snd-lv="${m.id}" aria-label="${esc(NAME[m.id])} Volume"></label>`).join("")}</div>` : "";
    return `<div class="snd-panel">
      <div class="snd-sec"><span class="snd-h">Sound</span>
        <div class="snd-chips">
          <button type="button" class="snd-chip snd-match" data-act="snd-theme" aria-pressed="${theme}">${IC_WAVE}Match Theme${pb()}</button>${chips}
        </div>
        <p class="mini snd-note">${theme ? `${esc(skinName(skinNow()))}${darkNow() ? " at night" : ""}: ${esc(joinNames(tm.map(m => m.id)))}. Tap a sound to make your own mix.` : pro ? `Tap up to 3 sounds to mix them. ${sel.size > 1 ? "Set each one's level below." : ""}` : "Rain, Brown Noise and Ocean Waves are free, one at a time. Pro adds every sound, theme mixes and your own mixes."}</p>
        ${mixRows}
      </div>
      <label class="snd-vol"><span class="snd-h">Volume</span><input type="range" min="0.05" max="1" step="0.05" value="${c.vol}" data-snd-vol aria-label="Focus Sounds Volume"></label>
      <div class="snd-sec"><span class="snd-h">Play</span>
        <div class="segb snd-mode" role="group" aria-label="When sounds play"><button type="button" data-act="snd-mode" data-id="focus" aria-pressed="${c.mode === "focus"}">During Focus Only</button><button type="button" data-act="snd-mode" data-id="always" aria-pressed="${c.mode === "always"}">Keep Playing</button></div>
        <p class="mini snd-note">${c.mode === "focus" ? "Fades in when a focus session starts and gently fades out for breaks." : "Plays until you turn it off, through breaks too."}</p>
        ${c.mode === "always" ? `<label class="f snd-after">Stop After<select data-snd-after>${[[0, "Never"], [15, "15 Minutes"], [30, "30 Minutes"], [60, "1 Hour"], [120, "2 Hours"]].map(([v, l]) => `<option value="${v}" ${Number(c.stopAfter) === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>` : ""}
        <label class="mi-check"><input type="checkbox" data-snd-hide ${c.hidePause ? "checked" : ""}> Pause when Studyboard is hidden</label>
      </div>
    </div>`;
  }
  function cardHTML(forceOpen){
    const c = cfg(), open = forceOpen || panelOpen, on = shownOn(c), playing = live() && !previewing;
    return `<div class="snd-card ${on ? "on" : ""} ${playing ? "live" : ""} ${forceOpen ? "fixed" : ""}">
      <div class="snd-top">
        ${forceOpen ? `<div class="snd-head"><span class="snd-ic">${playing ? EQ : on ? IC_ON : IC_OFF}</span><span class="snd-txt"><b>Focus Sounds</b><span class="sub">${esc(summary(c))}</span></span></div>`
          : `<button type="button" class="snd-head" data-act="snd-more" aria-expanded="${open}"><span class="snd-ic">${playing ? EQ : on ? IC_ON : IC_OFF}</span><span class="snd-txt"><b>Focus Sounds</b><span class="sub">${esc(summary(c))}</span></span><span class="snd-chev">${CHEV}</span></button>`}
        <button type="button" class="snd-sw" role="switch" data-act="snd-toggle" aria-checked="${on}" aria-label="Focus Sounds"><i></i></button>
      </div>
      ${open ? panelHTML(c) : ""}
    </div>`;
  }
  function paint(){
    $$(".snd-card").forEach(el => { const f = el.classList.contains("fixed"), a = document.activeElement, key = a && el.contains(a) ? (a.dataset.act ? `[data-act="${a.dataset.act}"]${a.dataset.id ? `[data-id="${a.dataset.id}"]` : ""}` : null) : null; el.outerHTML = cardHTML(f); if (key) { const n = $(key); if (n) n.focus(); } });
    const sub = $(".snd-set-sub"); if (sub) sub.textContent = summary();
  }
  // The small speaker beside the timer: in the phone header next to the timer pill, and as a badge on the sidebar Focus pill
  function bits(){
    const c = cfg(), playing = live() && !previewing && !blocked;
    $$(".snd-quick").forEach(q => {
      q.hidden = !(live() && !previewing || (timerActive() && (c.on || touched)));
      q.classList.toggle("on", playing);
      q.innerHTML = playing ? IC_ON : IC_OFF;
      q.setAttribute("aria-label", playing ? "Focus Sounds on. Turn off" : "Focus Sounds off. Turn on"); q.title = playing ? "Turn Sounds Off" : "Play Focus Sounds";
    });
    paint();
  }
  // The switch shows "on" only when sound is on and allowed to play now (after a reload it waits for a click).
  function shownOn(c = cfg()){ return !!c.on && !slept && (armed || (c.mode === "focus" && !focusOn())); }
  // Turn sounds on or off from a click (so the browser lets them start)
  function setOn(next){
    clearTimeout(previewT); previewing = null;
    if (next) { armed = true; slept = false; if (!cfg().on) save({on: true}); if (E && E.ctx.state !== "running") { try { const p = E.ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) {} } }
    else if (cfg().on) save({on: false});
    sync(next ? 2 : 1, 2);
    if (next && cfg().mode === "focus" && !focusOn()) toast("Focus Sounds will play when you start a focus session");
  }

  hook("act", (act, el, id) => {
    if (!act.startsWith("snd-")) return false;
    const c = cfg(), pro = isPro();
    switch (act) {
      case "snd-toggle": case "snd-quick": {
        touched = true;
        if (blocked && live()) { try { E.ctx.resume().then(() => { blocked = E.ctx.state !== "running"; bits(); }); } catch (e) {} return true; }
        setOn(act === "snd-quick" ? !(live() && !previewing) : !shownOn(c)); return true;
      }
      case "snd-more": panelOpen = !panelOpen; paint(); return true;
      case "snd-theme": {
        if (!pro) { proSheet("Theme mixes are part of Studyboard Pro. Each theme gets its own blend of sounds."); return true; }
        save({pick: "theme"}); paint(); if (live() && !previewing) refresh(); else preview(themeMix(skinNow(), darkNow()));
        return true;
      }
      case "snd-pick": {
        if (!NAME[id]) return true;
        if (!pro && !FREE.has(id)) { proSheet("Every Focus Sound is part of Studyboard Pro. Rain, Brown Noise and Ocean Waves are free."); return true; }
        let mix = c.pick === "theme" && pro ? [] : resolveMix(c).map(m => ({id: m.id, v: m.v}));
        if (!pro) mix = [{id, v: 1}];
        else if (mix.some(m => m.id === id)) { if (mix.length > 1) mix = mix.filter(m => m.id !== id); }
        else { if (mix.length >= 3) { toast("You can mix up to 3 sounds. Tap one to take it out first."); return true; } mix.push({id, v: mix.length ? .6 : 1}); }
        save({pick: "custom", mix});
        paint();
        if (live() && !previewing) refresh(); else preview(resolveMix());
        return true;
      }
      case "snd-mode": save({mode: id === "always" ? "always" : "focus"}); slept = false; clearTimeout(sleepT); sleepT = null; paint(); if (cfg().on && armed) sync(2, 3); return true;
      case "snd-settings": openSettings(); return true;
      case "snd-open-timer": if (dlg.open) dlg.close(); openPomo(); return true;
    }
    return false;
  });
  document.addEventListener("input", e => {
    const t = e.target; if (!t || !t.closest || !t.closest(".snd-panel")) return;
    if (t.hasAttribute("data-snd-vol")) { if (E) E.master.gain.setTargetAtTime(volGain(Number(t.value)), E.ctx.currentTime, .05); }
    else if (t.dataset.sndLv) {
      const mix = resolveMix().map(m => m.id === t.dataset.sndLv ? {id: m.id, v: Number(t.value)} : m);
      if (live() && !previewing) E.apply(mix, .15);
    }
  });
  document.addEventListener("change", e => {
    const t = e.target; if (!t || !t.closest || !t.closest(".snd-panel")) return;
    if (t.hasAttribute("data-snd-vol")) save({vol: clamp(Number(t.value), .05, 1)});
    else if (t.dataset.sndLv) save({pick: "custom", mix: resolveMix().map(m => m.id === t.dataset.sndLv ? {id: m.id, v: clamp(Number(t.value), .05, 1)} : m)});
    else if (t.hasAttribute("data-snd-after")) { save({stopAfter: Number(t.value) || 0}); clearTimeout(sleepT); sleepT = null; if (live() && !previewing) start(1); }
    else if (t.hasAttribute("data-snd-hide")) { save({hidePause: t.checked}); }
    else return;
    const sub = $$(".snd-card .snd-txt .sub"); sub.forEach(s => { s.textContent = summary(); });
  });

  // The Focus Timer sheet: add the Focus Sounds card under the timer controls
  const origRenderPomo = renderPomo;
  if (SOUNDS_ENABLED) renderPomo = function(){
    const r = origRenderPomo.apply(this, arguments);
    try {
      const ctl = $("#pomoDlg .pomo-ctl");
      if (ctl && !$("#pomoDlg .snd-card")) ctl.insertAdjacentHTML("afterend", cardHTML(false));
    } catch (e) { console.warn("focus sounds", e); }
    return r;
  };
  const origRenderBits = renderPomoBits;
  if (SOUNDS_ENABLED) renderPomoBits = function(){ const r = origRenderBits.apply(this, arguments); try { bits(); } catch (e) {} return r; };

  function openSettings(){
    openSheet(`<div class="sheet snd-sheet">${head("Focus Sounds")}<div class="sheet-body">
      <p class="mini" style="margin:0">Calm sounds made in your browser, so they work offline. They play from the Focus timer once you turn them on.</p>
      ${cardHTML(true)}
    </div><div class="sheet-foot"><button type="button" class="btn" data-act="snd-open-timer">Open Focus Timer</button><span class="spacer"></span><button type="button" class="btn primary" data-act="close">Done</button></div></div>`);
  }
  hook("menu", () => `<button data-act="snd-settings" data-group="study"><span>Focus Sounds<span class="sub snd-set-sub">${esc(summary())}</span></span></button>`);

  hook("boot", () => {
    const add = (after, id, cls) => { const a = $(after); if (!a || $("#" + id)) return; const b = document.createElement("button"); b.type = "button"; b.id = id; b.className = cls; b.dataset.act = "snd-quick"; b.hidden = true; a.insertAdjacentElement("afterend", b); };
    add("#pomoBtn", "sndQuick", "icon-btn snd-quick");
    add("#navPomo", "sndQuickNav", "snd-quick snd-quick-nav");
    bits();
  });

  /* ---------- For tests: render any mix offline and report state ---------- */
  window.StudyboardSounds = {
    enabled: () => SOUNDS_ENABLED,
    list: () => LIST.map(([id, name]) => ({id, name, free: FREE.has(id)})),
    themeMix: (skin, dark) => themeMix(skin, !!dark),
    themes: () => Object.keys(THEME),
    resolve: over => resolveMix(Object.assign(cfg(), over || {})),
    skins: () => (typeof SKINS !== "undefined" ? SKINS : []).map(x => ({id: x.id, name: x.name, group: x.group})),
    state: () => ({live: live(), armed, previewing: !!previewing, blocked, fade: E ? E.fade.gain.value : 0, ctx: E ? E.ctx.state : "none", voices: E ? [...E.voices.values()].filter(v => !v.dying).map(v => v.id) : []}),
    async render(mix, sec = 25, sr = 44100, seed = 1){
      const ctx = new OfflineAudioContext(2, Math.round(sec * sr), sr), e = Engine(ctx);
      e.fade.gain.value = 1; e.master.gain.value = 1;
      const m = typeof mix === "string" ? [{id: mix, v: 1}] : mix, norm = 1 / Math.sqrt(Math.max(1, m.reduce((s, x) => s + x.v * x.v, 0)));
      m.forEach((x, i) => { const vc = makeVoice(e, x.id, 0, seed * 7919 + i); vc.setLevel((CAL[x.id] || 1) * x.v * norm, 0); e.voices.set(x.id, vc); vc.tick(0, sec); });
      const b = await ctx.startRendering();
      return [b.getChannelData(0), b.getChannelData(1)];
    }
  };
})();



