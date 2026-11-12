/* ===== module: 99-replay.js: Lecture Replay, notes and transcript linked to the recording ===== */
/* Lecture Replay (Pro, like Record a Lecture). A saved lecture's recording plays from any moment: tap a transcript paragraph, a ★ mark,
   a line of your notes, a slide of the deck you added, or a point in the summary, and it plays from just before it. While it plays, the
   line being said lights up in the transcript and in your notes, so you see what you wrote while the lecturer was speaking.
   - Timings. While recording, every caption piece has its time; when the lecture is saved, f.tr.tAt keeps anchors into the transcript text
     ([[charIndex, ms], ...]). AI transcription keeps one anchor per 5-minute part. Between anchors the time is interpolated by characters,
     and an older lecture with no anchors is spread evenly over its length (shown as estimated).
   - Notes typed while recording. The recorder has a Notes box under the captions; each line keeps the time it was started, and the lines
     are saved as a note with the lecture (n.rp = {f: lecture id, k: {lineKey: ms}}). A typed line is placed where its words were said
     in the minute and a half before it was typed (people write after hearing), else a few seconds before it was typed.
   - Notes and slides added afterwards. Any note or file on the lecture (Slides and Notes) or on its class page is matched to the
     recording on this device, without AI: each line of a note, or each page of a PDF or slide deck, is placed where its words were said
     (weighted word overlap, kept roughly in the order of the lecture). Lines that can't be placed stay untimed.
   - Fix Times. In a note's or file's replay view, Fix Times sets a line or page to the moment playing now (f.lec.pins = {itemId:
     {lineKey or "p3": ms}}), for handwriting or scans whose text can't be read, or a line that was placed wrong. One Undo.
   - Hear It. A card made from a lecture (c.from.k === "lecture") shows Hear It after its answer: 30 seconds of the lecture from where
     the card's words were said (c.from.t, kept when the card is made, or found when it is first played).
   - One player. The lecture sheet and the class page show the same small player (play, back and forward 10 seconds, a slider and the
     speed, 0.75x to 2x, remembered). When the sheet closes while it plays, a small pill keeps it going until you stop it.
   The pure part (timings, matching) is between REPLAY-START and REPLAY-END and is unit tested in tests/replay.test.js. */
/*REPLAY-START*/
const RPLAY = (() => {
  const STOP = new Set(("a an the of to in on for and or is are was were be been being it its it's this that these those with by as at from into than then " +
    "there their they them he she we you your i me my our not no but if so do does did done can could may might will would should shall also just very really " +
    "about like okay ok um uh yeah yes right now well here what which who whom how why when where all any some each every more most other such only own same " +
    "too one get got go going gonna want let lets say said says thing things kind sort lot lots there's that's we're you're i'm don't doesn't can't won't " +
    "isn't aren't wasn't let's gonna wanna kinda basically actually").split(" "));
  const norm = s => String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const stem = w => w.length > 5 ? w.replace(/ies$/, "y").replace(/(ing|ed|es|s)$/, "") : w.length > 3 ? w.replace(/s$/, "") : w;
  // The words that carry meaning, as stems
  const toks = s => norm(s).replace(/['’]/g, "").replace(/[^a-z0-9]+/g, " ").split(" ").filter(w => w && (w.length > 1 || /\d/.test(w)) && !STOP.has(w)).map(stem);
  const clock = ms => { const s = Math.max(0, Math.floor((Number(ms) || 0) / 1000)), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : String(m)) + ":" + String(x).padStart(2, "0"); };
  const parseClock = s => { const m = /^\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*$/.exec(String(s || "")); if (!m) return null; return (m[3] != null ? (+m[1] * 3600 + +m[2] * 60 + +m[3]) : (+m[1] * 60 + +m[2])) * 1000; };
  const MARK = /^\s*★\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*$/;
  // A short, stable key for a line of a note, so its time survives other lines being added or moved
  function lineKey(s){ const t = norm(s).replace(/\s+/g, " ").trim(); let h = 5381; for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) >>> 0; return h.toString(36); }
  const okMs = v => Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) < 864e5;

  /* Timings */
  // Where each timed piece of text landed in the transcript: [[charIndex, ms], ...], in order. Pieces that were edited away are skipped.
  // live: the pieces are browser captions, timed when the phrase ended, so each starts a little earlier (about 0.38 s a word)
  function anchorsFor(text, pieces, o){
    o = o || {};
    const low = String(text || "").toLowerCase(), out = []; let at = 0, last = 0;
    (Array.isArray(pieces) ? pieces : []).filter(p => p && okMs(p.t) && String(p.s || "").trim()).slice().sort((a, b) => a.t - b.t).forEach(p => {
      const s = String(p.s).trim().toLowerCase(), probe = s.slice(0, 120), i = low.indexOf(probe, at);
      if (i < 0 || (at && i - at > 6000)) return;
      let t = Math.round(Number(p.t));
      if (o.live) t = Math.max(last, t - Math.min(8000, s.split(/\s+/).length * 380));
      if (t < last) t = last;
      out.push([i, t]); last = t; at = i + probe.length;
    });
    return thin(out, 1500);
  }
  const thin = (a, max) => { if (a.length <= max) return a; const k = a.length / max, out = []; for (let i = 0; i < max - 1; i++) out.push(a[Math.floor(i * k)]); out.push(a[a.length - 1]); return out; };
  // Clean anchors read from a saved lecture (synced data): pairs of whole numbers, in order, inside the text
  function cleanAt(at, len){
    const out = []; let li = -1, lt = -1;
    (Array.isArray(at) ? at : []).slice(0, 3000).forEach(p => { if (!Array.isArray(p) || p.length !== 2) return; const i = Math.round(Number(p[0])), t = Math.round(Number(p[1]));
      if (!(i >= 0 && i <= len && okMs(t)) || i <= li || t < lt) return; out.push([i, t]); li = i; lt = t; });
    return out;
  }
  // A function from a character position in the transcript to its time in the recording (ms)
  function mapper(at, len, dur){
    const A = cleanAt(at, len);
    if (!A.length || A[0][0] > 0) A.unshift([0, 0]);
    const D = okMs(dur) ? Number(dur) : 0, end = A[A.length - 1];
    if (D > end[1] && len > end[0]) A.push([len, D]);
    return i => {
      if (i <= 0) return A[0][1];
      let lo = 0, hi = A.length - 1;
      if (i >= A[hi][0]) return A[hi][1];
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (A[m][0] <= i) lo = m; else hi = m; }
      const a = A[lo], b = A[hi]; return Math.round(a[1] + (b[1] - a[1]) * (i - a[0]) / Math.max(1, b[0] - a[0]));
    };
  }
  // Transcribed parts joined into one text, with an anchor where each part starts: parts = [[text, startMs], ...]
  function joinParts(parts, sep){
    const keep = (parts || []).filter(p => p && String(p[0] || "").trim());
    let text = "", at = [];
    keep.forEach((p, k) => { if (k) text += sep; at.push([text.length, Math.round(Number(p[1]) || 0)]); text += String(p[0]); });
    return {text, at};
  }

  /* The transcript as timed sentences, grouped into overlapping windows of about 20 seconds of speech */
  function units(text, at, dur){
    const T = String(text || ""), map = mapper(at, T.length, dur), out = [];
    const re = /[^\n.!?]+[.!?]*/g; let m;
    while ((m = re.exec(T))) {
      const s = m[0].trim(); if (!s || MARK.test(s) || /^\[part \d+ couldn/i.test(s)) continue;
      const k = toks(s); if (!k.length) continue;
      out.push({i: m.index, t: map(m.index), s, k});
    }
    return out;
  }
  const W_TOK = 24;
  function index(us){
    const wins = [];
    for (let a = 0; a < us.length;) {
      let n = 0, b = a; const bag = new Map();
      for (; b < us.length && n < W_TOK; b++) { us[b].k.forEach(w => bag.set(w, (bag.get(w) || 0) + 1)); n += us[b].k.length; }
      wins.push({a, b: b - 1, t: us[a].t, bag, bi: bigrams(us.slice(a, b).flatMap(u => u.k))});
      // the next window starts about half way into this one
      let h = 0, c = a; while (c < b - 1 && h < W_TOK / 2) { h += us[c].k.length; c++; }
      if (b >= us.length) break;
      a = Math.max(a + 1, c);
    }
    const df = new Map(); wins.forEach(w => w.bag.forEach((_, k) => df.set(k, (df.get(k) || 0) + 1)));
    const N = Math.max(1, wins.length), idf = new Map(); df.forEach((d, k) => idf.set(k, Math.log(1 + N / d)));
    let tot = 0; idf.forEach(v => { tot += v; });
    wins.forEach(w => { let s = 0; w.bag.forEach((_, k) => { s += idf.get(k) || 0; }); w.sum = s; });
    return {us, wins, idf, mean: idf.size ? tot / idf.size : 1};
  }
  const bigrams = k => { const s = new Set(); for (let i = 1; i < k.length; i++) s.add(k[i - 1] + " " + k[i]); return s; };
  function prep(IX, text){
    const k = [...new Set(toks(text))], all = toks(text);
    let known = 0, unknown = 0; k.forEach(w => { if (IX.idf.has(w)) known += IX.idf.get(w); else unknown++; });
    const bi = bigrams(all);
    return {k, bi, n: k.filter(w => IX.idf.has(w)).length, sum: known + 0.25 * unknown * IX.mean};
  }
  // How well a window holds a line's words: shared words weighted by rarity, plus a bonus for shared word pairs
  function score(IX, P, w){
    if (!P.n) return 0;
    let hit = 0, hits = 0;
    P.k.forEach(x => { if (w.bag.has(x)) { hit += IX.idf.get(x) || 0; hits++; } });
    if (!hits) return 0;
    let bh = 0; P.bi.forEach(b => { if (w.bi.has(b)) { const [x, y] = b.split(" "); bh += ((IX.idf.get(x) || 0) + (IX.idf.get(y) || 0)) / 2; } });
    const s = (hit + 0.5 * bh) / Math.max(1e-6, Math.min(P.sum, w.sum) + 0.25 * bh);
    // one shared word means little unless it is the line's only word, and rare
    if (hits < 2 && !(P.n === 1 && (IX.idf.get(P.k.find(x => w.bag.has(x))) || 0) > Math.log(1 + 4))) return Math.min(s, 0.2);
    return Math.min(1, s);
  }
  // The first sentence in a window that matches the line nearly as well as the best one: where it starts being said
  function bestUnit(IX, P, w){
    const K = new Set(P.k), sc = [], cov = [];
    for (let u = w.a; u <= w.b; u++) { let s = 0, h = 0; const uk = IX.us[u].k; uk.forEach(x => { if (K.has(x)) { s += IX.idf.get(x) || 0; h++; } }); sc.push(s); cov.push(uk.length ? h / uk.length : 0); }
    // a long text (a paragraph, a page) starts at the first sentence it holds nearly all of
    const top = Math.max(...sc), long = P.k.length >= 12, k = sc.findIndex((s, i) => s > 0 && (s >= 0.6 * top || (long && cov[i] >= 0.7)));
    return IX.us[w.a + Math.max(0, k)].t;
  }
  const THR = 0.3, BACK = 2, LAMBDA = 0.35;
  /* Each text segment's time in the lecture, or null. order: segments mostly follow the lecture (notes, a tidied transcript, slides),
     so going back more than a moment costs a little; without it each segment is placed on its own (summary points, a card). */
  function align(IX, segs, o){
    o = o || {};
    const n = segs.length, m = IX.wins.length, out = segs.map(() => ({t: null, sc: 0}));
    if (!n || !m) return out;
    const P = segs.map(s => prep(IX, s)), S = P.map(p => IX.wins.map(w => score(IX, p, w)));
    let pick = new Array(n).fill(-1);
    if (o.order === false) pick = S.map(row => { let j = -1, b = THR; row.forEach((v, k) => { if (v > b + 1e-9) { b = v; j = k; } }); return j; });
    else {
      let prev = new Float64Array(m); const from = [], kind = [];
      for (let i = 0; i < n; i++) {
        const pre = new Float64Array(m), suf = new Float64Array(m + 1), preI = new Int32Array(m), sufI = new Int32Array(m + 1);
        for (let j = 0; j < m; j++) { if (j && pre[j - 1] >= prev[j]) { pre[j] = pre[j - 1]; preI[j] = preI[j - 1]; } else { pre[j] = prev[j]; preI[j] = j; } }
        suf[m] = -Infinity; sufI[m] = -1; for (let j = m - 1; j >= 0; j--) { if (suf[j + 1] > prev[j]) { suf[j] = suf[j + 1]; sufI[j] = sufI[j + 1]; } else { suf[j] = prev[j]; sufI[j] = j; } }
        const cur = new Float64Array(m), fr = new Int32Array(m), kd = new Uint8Array(m);
        for (let j = 0; j < m; j++) {
          cur[j] = prev[j]; fr[j] = j; kd[j] = 0;
          const s = S[i][j]; if (s < THR) continue;
          const lim = Math.min(m - 1, j + BACK); let b = pre[lim], bj = preI[lim];
          if (lim + 1 < m && suf[lim + 1] - LAMBDA > b) { b = suf[lim + 1] - LAMBDA; bj = sufI[lim + 1]; }
          // a tiny lean toward the earlier of two equal places: where a thing is first said
          const v = b + (s - THR) - j * 1e-7;
          if (v > cur[j] + 1e-9) { cur[j] = v; fr[j] = bj; kd[j] = 1; }
        }
        from.push(fr); kind.push(kd); prev = cur;
      }
      let j = 0; for (let k = 1; k < m; k++) if (prev[k] > prev[j] + 1e-9) j = k;
      for (let i = n - 1; i >= 0; i--) { if (kind[i][j]) pick[i] = j; j = from[i][j]; }
    }
    let lastJ = -1;
    pick.forEach((j, i) => {
      if (j < 0) return;
      // move back to where it starts being said, while the earlier windows match nearly as well
      let a = j; while (a > 0 && a - 1 > lastJ && S[i][a - 1] >= 0.8 * S[i][j]) a--;
      out[i] = {t: bestUnit(IX, P[i], IX.wins[a]), sc: Math.round(S[i][j] * 100) / 100};
      if (o.order !== false) lastJ = a;
    });
    return out;
  }
  // A line typed while recording: placed where its words were said in the 90 seconds before it was typed, else a few seconds before
  function refineTyped(IX, text, typedAt){
    const P = prep(IX, text); let best = -1, bs = THR;
    IX.wins.forEach((w, j) => { if (w.t > typedAt + 5000 || w.t < typedAt - 90000) return; const s = score(IX, P, w); if (s > bs + 1e-9) { bs = s; best = j; } });
    return best >= 0 ? Math.min(typedAt, bestUnit(IX, P, IX.wins[best])) : Math.max(0, typedAt - 4000);
  }

  /* What gets a time */
  // A note's lines: every line with words (bullets and markup taken off), with its key; a heading or title is a line too
  function noteSegs(text){
    const seen = new Map(), out = [];
    String(text || "").split("\n").forEach((raw, li) => {
      const shown = raw.replace(/^\s*(?:[-*•▪●‣◦·–—]|\d{1,3}[.)]|#{1,6}|>|\[[ xX]\])\s*/, "").replace(/\[\[([^\]|]*)(?:\|[^\]]*)?\]\]/g, "$1").trim();
      const s = shown.replace(/\*\*|__|~~|==|`|\$/g, "").trim();
      if (!s) return;
      let k = lineKey(s); const c = seen.get(k) || 0; seen.set(k, c + 1); if (c) k += "." + c;
      out.push({li, key: k, s, shown, words: toks(s).length});
    });
    return out;
  }
  // A transcript or summary as blocks to show: headings, paragraphs and bullet points, each with its own text and any ★ mark's time
  function docBlocks(text){
    const out = []; let para = [];
    const flush = () => { if (para.length) { out.push({k: "p", s: para.join(" ")}); para = []; } };
    String(text || "").split("\n").forEach(l => { const t = l.trim();
      if (!t) { flush(); return; }
      const mk = MARK.exec(t); if (mk) { flush(); out.push({k: "mark", s: t, mark: parseClock(mk[1])}); return; }
      if (/^#{1,3}\s/.test(t)) { flush(); out.push({k: "h", s: t.replace(/^#+\s*/, "")}); return; }
      if (/^[•\-*]\s/.test(t)) { flush(); out.push({k: "li", s: t.replace(/^[•\-*]\s*/, "")}); return; }
      para.push(t); });
    flush(); return out;
  }
  // Each block's time: marks keep their own; a heading takes the time of the text under it
  function timeBlocks(IX, blocks, o){
    const idx = [], segs = [];
    blocks.forEach((b, i) => { if (b.k !== "mark" && b.k !== "h") { idx.push(i); segs.push(b.s); } });
    const al = align(IX, segs, o), out = blocks.map(b => ({t: b.k === "mark" ? b.mark : null, sc: b.k === "mark" ? 1 : 0}));
    idx.forEach((bi, k) => { out[bi] = al[k]; });
    for (let i = blocks.length - 1; i >= 0; i--) if (blocks[i].k === "h") { const nx = out.slice(i + 1).find(x => x.t != null); if (nx) out[i] = {t: nx.t, sc: nx.sc}; }
    return out;
  }
  // A file's pages or slides, from the reader's text ("[Slide 3] text" per line)
  function pageSegs(text){
    const out = []; let cur = null;
    String(text || "").split("\n").forEach(l => {
      const m = /^\[(Page|Slide|Sheet)\s+(\d{1,5})\]\s?(.*)$/.exec(l);
      if (m) { cur = {key: "p" + m[2], label: m[1] + " " + m[2], s: m[3] || ""}; out.push(cur); return; }
      if (!cur) { cur = {key: "p1", label: "Page 1", s: ""}; out.push(cur); }
      cur.s += (cur.s ? "\n" : "") + l;
    });
    return out.filter(p => p.s.trim() || p.key);
  }
  const cleanPins = (o, max) => { const out = {}; if (!o || typeof o !== "object") return out; let n = 0;
    for (const k of Object.keys(o)) { if (n >= (max || 600)) break; if (/^[\w.:-]{1,24}$/.test(k) && okMs(o[k])) { out[k] = Math.round(Number(o[k])); n++; } } return out; };

  return {toks, clock, parseClock, lineKey, anchorsFor, cleanAt, mapper, joinParts, units, index, align, refineTyped, noteSegs, docBlocks, timeBlocks, pageSegs, cleanPins, THR};
})();
/*REPLAY-END*/
var SBREPLAY = null;
(() => {
  const R = RPLAY, P = () => window.SBPRO;
  const locked = () => { try { return !!(P() && P().locked()); } catch (e) { return false; } };
  const proWhy = why => { if (typeof PLAN !== "undefined" && PLAN) PLAN.openSheet(why); };
  const SV = (p, s) => `<svg viewBox="0 0 24 24" width="${s || 18}" height="${s || 18}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${p}</svg>`;
  const IC = {
    play: s => `<svg viewBox="0 0 24 24" width="${s || 20}" height="${s || 20}" aria-hidden="true" focusable="false"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>`,
    pause: s => `<svg viewBox="0 0 24 24" width="${s || 20}" height="${s || 20}" aria-hidden="true" focusable="false"><rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/></svg>`,
    back: s => SV('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><text x="12" y="15.5" font-size="7.5" text-anchor="middle" fill="currentColor" stroke="none" font-weight="700">10</text>', s),
    fwd: s => SV('<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/><text x="12" y="15.5" font-size="7.5" text-anchor="middle" fill="currentColor" stroke="none" font-weight="700">10</text>', s),
    ear: s => SV('<path d="M6 9a6 6 0 1 1 12 0c0 3-2 4.5-3 5.5s-1 2.5-1 3.5a3 3 0 0 1-6 0"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-1.5 2-1.5 3"/>', s),
    pin: s => SV('<path d="M12 22v-7"/><path d="M8 3h8l-1 5 3 4H6l3-4z"/>', s),
    note: s => SV('<path d="M4 4h16v10l-6 6H4z"/><path d="M14 20v-6h6"/>', s),
    file: s => SV('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>', s)
  };
  const clock = R.clock;
  // Beta: one small β beside the player, the recorder's notes, a note's replay and Hear It. Set to false to take it off everywhere.
  const BETA = true;
  const beta = () => BETA ? `<span class="beta-sym" title="Beta: still being improved" role="img" aria-label="Beta">β</span>` : "";
  const hasAudio = f => !!f && f.folderId === "lectures" && ((Array.isArray(f.revs) && f.revs.length) || !!f.cloud);
  const durOf = f => f && Number(f.dur) > 0 ? Math.round(Number(f.dur) * 1000) : 0;

  /* ---------- The timeline of a lecture (kept while the transcript doesn't change) ---------- */
  const IXC = new Map();
  function timeline(f){
    const text = String((f && f.tr && f.tr.text) || ""); if (!text.trim()) return null;
    const tAt = R.cleanAt(f.tr.tAt, text.length), key = [f.id, text.length, tAt.length, durOf(f)].join("|");
    let x = IXC.get(f.id);
    if (!x || x.key !== key) { x = {key, IX: R.index(R.units(text, tAt, durOf(f))), est: !tAt.length, map: R.mapper(tAt, text.length, durOf(f))}; IXC.set(f.id, x); }
    return x;
  }
  const canTime = f => { const x = timeline(f); return !!(x && x.IX.wins.length && (!x.est || durOf(f))); };
  const timeOf = (fid, text) => { const f = state.files[fid]; if (!f || !canTime(f)) return null; const a = R.align(timeline(f).IX, [String(text || "")], {order: false})[0]; return a && a.t != null ? a.t : null; };

  /* ---------- The player: one recording at a time ---------- */
  const RATE_LS = "studyboard:replayRate", RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];
  const rate = () => { let v = 1; try { v = Number(localStorage.getItem(RATE_LS)) || 1; } catch (e) {} return RATES.includes(v) ? v : 1; };
  const PL = {fid: "", url: "", a: null, loading: null, loadFid: "", clipEnd: 0, err: ""};
  function el(){
    if (PL.a) return PL.a;
    const a = PL.a = new Audio(); a.preload = "auto";
    ["timeupdate", "play", "pause", "ended", "loadedmetadata", "durationchange", "seeked"].forEach(ev => a.addEventListener(ev, () => {
      if (ev === "timeupdate" && PL.clipEnd && a.currentTime >= PL.clipEnd) { PL.clipEnd = 0; a.pause(); }
      paint(ev === "timeupdate");
    }));
    return a;
  }
  // A recording made in the browser has no length written in it until it is read to the end: read it once so the slider and seeking work
  const fixLength = a => new Promise(res => {
    if (isFinite(a.duration) && a.duration > 0) { res(); return; }
    let done = false; const end = () => { if (done) return; done = true; a.removeEventListener("durationchange", on); try { a.currentTime = 0; } catch (e) {} res(); };
    const on = () => { if (isFinite(a.duration)) end(); };
    a.addEventListener("durationchange", on); setTimeout(end, 4000);
    try { a.currentTime = 1e101; } catch (e) { end(); }
  });
  async function load(fid){
    if (PL.fid === fid && PL.url) return true;
    if (PL.loading && PL.loadFid === fid) return PL.loading;
    const f = state.files[fid]; if (!hasAudio(f)) return false;
    PL.loadFid = fid; PL.err = ""; paint();
    PL.loading = (async () => {
      try {
        const bytes = await fileBytes(f);
        const url = URL.createObjectURL(new Blob([bytes], {type: fileTypeOf(f) || "audio/webm"})), a = el();
        a.pause(); if (PL.url) URL.revokeObjectURL(PL.url);
        PL.url = url; PL.fid = fid; PL.clipEnd = 0;
        a.src = url; a.playbackRate = rate();
        await new Promise(res => { if (a.readyState >= 1) res(); else { a.addEventListener("loadedmetadata", res, {once: true}); a.addEventListener("error", res, {once: true}); setTimeout(res, 8000); } });
        await fixLength(a);
        return true;
      } catch (e) {
        PL.err = f.cloud ? `Couldn't load the recording here. It can be played in ${CLOUD_NAMES[f.cloud.p] || "the cloud"}.` : "Couldn't load the recording. Check your connection and try again.";
        toast(PL.err); return false;
      } finally { if (PL.loadFid === fid) { PL.loading = null; PL.loadFid = ""; } paint(); }
    })();
    return PL.loading;
  }
  const lenOf = fid => { const a = PL.a; if (a && PL.fid === fid && isFinite(a.duration) && a.duration > 0) return a.duration * 1000; return durOf(state.files[fid]); };
  const nowOf = fid => PL.a && PL.fid === fid ? PL.a.currentTime * 1000 : 0;
  const playing = fid => !!(PL.a && PL.fid === fid && !PL.a.paused);
  async function seek(fid, ms, o){
    o = o || {};
    if (!(await load(fid))) return;
    const a = el(), lead = o.lead == null ? 5000 : o.lead, at = Math.max(0, (Number(ms) || 0) - lead);
    try { a.currentTime = at / 1000; } catch (e) {}
    PL.clipEnd = o.clip ? (at + o.clip) / 1000 : 0;
    a.playbackRate = rate();
    try { await a.play(); } catch (e) {}
    PL.follow = Date.now();
    paint();
  }
  async function toggle(fid){
    if (PL.fid !== fid || !PL.url) { await seek(fid, 0, {lead: 0}); return; }
    const a = el(); PL.clipEnd = 0;
    if (a.paused) { try { await a.play(); } catch (e) {} } else a.pause();
  }
  function skip(fid, d){ if (PL.fid !== fid || !PL.a) return; const a = PL.a; a.currentTime = Math.max(0, Math.min(a.duration || 1e9, a.currentTime + d)); PL.clipEnd = 0; paint(); }
  function cycleRate(){ const v = RATES[(RATES.indexOf(rate()) + 1) % RATES.length]; try { localStorage.setItem(RATE_LS, String(v)); } catch (e) {} if (PL.a) PL.a.playbackRate = v; paint(); }
  function stopAll(){ if (PL.a) PL.a.pause(); PL.clipEnd = 0; if (PL.url) URL.revokeObjectURL(PL.url); if (PL.a) PL.a.removeAttribute("src"); PL.url = ""; PL.fid = ""; paint(); }

  /* ---------- Drawing the player ---------- */
  function dockHtml(fid, o){
    o = o || {};
    const f = state.files[fid]; if (!hasAudio(f)) return "";
    const len = lenOf(fid), now = nowOf(fid);
    return `<div class="rp-dock${o.compact ? " compact" : ""}" data-rp-dock="${esc(fid)}" role="group" aria-label="Recording player">
      <button type="button" class="rp-btn rp-main" data-act="rp-toggle" data-id="${esc(fid)}" aria-label="${playing(fid) ? "Pause" : "Play"}">${playing(fid) ? IC.pause() : IC.play()}</button>
      <button type="button" class="rp-btn" data-act="rp-skip" data-id="${esc(fid)}" data-d="-10" aria-label="Back 10 seconds">${IC.back(20)}</button>
      <div class="rp-bar"><input type="range" class="rp-seek" data-id="${esc(fid)}" min="0" max="${Math.max(1, Math.round(len / 1000))}" step="1" value="${Math.round(now / 1000)}" aria-label="Position in the recording" aria-valuetext="${clock(now)} of ${clock(len)}">
        <span class="rp-time mini"><span class="rp-now">${clock(now)}</span> / <span class="rp-len">${len ? clock(len) : "–:––"}</span>${beta()}</span></div>
      <button type="button" class="rp-btn" data-act="rp-skip" data-id="${esc(fid)}" data-d="10" aria-label="Forward 10 seconds">${IC.fwd(20)}</button>
      <button type="button" class="rp-rate" data-act="rp-rate" aria-label="Playback speed ${rate()} times">${rate()}×</button>
    </div>`;
  }
  // Every player on screen, the line playing now in each replay list, and the small pill when no player is on screen
  const lists = new WeakMap();
  let lastPaint = 0;
  function paint(tick){
    const t = Date.now(); if (tick && t - lastPaint < 200) return; lastPaint = t;
    document.querySelectorAll(".rp-dock").forEach(d => {
      const fid = d.dataset.rpDock, on = playing(fid), now = nowOf(fid), len = lenOf(fid), busy = PL.loadFid === fid;
      const b = d.querySelector(".rp-main"); if (b) { const want = busy ? "busy" : on ? "pause" : "play"; if (b.dataset.st !== want) { b.dataset.st = want; b.innerHTML = busy ? `<span class="ai-spin" aria-hidden="true"></span>` : on ? IC.pause() : IC.play(); b.setAttribute("aria-label", busy ? "Loading the recording" : on ? "Pause" : "Play"); } }
      const s = d.querySelector(".rp-seek"); if (s && !s.matches(":active")) { s.max = String(Math.max(1, Math.round(len / 1000))); s.value = String(Math.round(now / 1000)); s.setAttribute("aria-valuetext", `${clock(now)} of ${clock(len)}`); s.style.setProperty("--p", len ? (now / len * 100).toFixed(2) + "%" : "0%"); }
      const n = d.querySelector(".rp-now"); if (n) n.textContent = clock(now);
      const l = d.querySelector(".rp-len"); if (l && len) l.textContent = clock(len);
      const r = d.querySelector(".rp-rate"); if (r) { r.textContent = rate() + "×"; r.setAttribute("aria-label", `Playback speed ${rate()} times`); }
    });
    // the line being said lights up
    document.querySelectorAll("[data-rp-f]").forEach(box => {
      const fid = box.dataset.rpF, now = PL.fid === fid && PL.url ? nowOf(fid) : -1;
      let L = lists.get(box); const cnt = box.querySelectorAll("[data-rp-t]").length;
      if (!L || L.n !== cnt) { L = {n: cnt, items: [...box.querySelectorAll("[data-rp-t]")].map(e => [Number(e.dataset.rpT), e]).filter(x => Number.isFinite(x[0])), cur: null}; lists.set(box, L); }
      let hit = null; if (now >= 0 && (playing(fid) || now > 0)) L.items.forEach(([tt, e]) => { if (tt <= now + 600 && (!hit || tt >= hit[0])) hit = [tt, e]; });
      const e = hit && hit[1];
      if (L.cur !== e) {
        if (L.cur) L.cur.classList.remove("rp-on");
        if (e) { e.classList.add("rp-on"); if (playing(fid) && Date.now() - (PL.scrolled || 0) > 4000) { try { e.scrollIntoView({block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"}); } catch (x) {} } }
        L.cur = e;
      }
    });
    pill();
  }
  function pill(){
    let p = document.getElementById("rpPill");
    // a player on screen (a closed sheet keeps its content in the page, so it doesn't count)
    const onScreen = [...document.querySelectorAll(`.rp-dock[data-rp-dock="${CSS.escape(PL.fid)}"]`)].some(d => !d.closest("dialog:not([open])") && d.getClientRects().length > 0);
    const show = PL.url && PL.a && (!PL.a.paused || p) && !onScreen;
    if (!show) { if (p) p.remove(); return; }
    const f = state.files[PL.fid]; if (!f) { stopAll(); return; }
    if (!p) { p = document.createElement("div"); p.id = "rpPill"; p.className = "rp-pill"; p.setAttribute("role", "group"); p.setAttribute("aria-label", "Lecture playing"); document.body.appendChild(p); }
    const on = !PL.a.paused, sig = [on, f.name, clock(nowOf(PL.fid))].join("|"); if (p.dataset.sig === sig) return; p.dataset.sig = sig;
    p.innerHTML = `<button type="button" class="rp-btn" data-act="rp-toggle" data-id="${esc(f.id)}" aria-label="${on ? "Pause" : "Play"}">${on ? IC.pause(18) : IC.play(18)}</button>
      <button type="button" class="rp-pill-t" data-act="lec-view" data-id="${esc(f.id)}"><b>${esc(f.name)}</b><span class="mini">${clock(nowOf(PL.fid))}</span></button>
      <button type="button" class="x-btn" data-act="rp-stop" aria-label="Stop playing">${CLOSE}</button>`;
  }
  document.addEventListener("wheel", e => { if (e.target && e.target.closest && e.target.closest(".sheet-body")) PL.scrolled = Date.now(); }, {passive: true});
  document.addEventListener("touchmove", e => { if (e.target && e.target.closest && e.target.closest(".sheet-body")) PL.scrolled = Date.now(); }, {passive: true});
  document.addEventListener("input", e => { const s = e.target; if (!s || !s.classList || !s.classList.contains("rp-seek")) return; const fid = s.dataset.id; const n = s.closest(".rp-dock").querySelector(".rp-now"); if (n) n.textContent = clock(Number(s.value) * 1000); s.style.setProperty("--p", (Number(s.value) / Math.max(1, Number(s.max)) * 100).toFixed(2) + "%"); void fid; });
  document.addEventListener("change", async e => { const s = e.target; if (!s || !s.classList || !s.classList.contains("rp-seek")) return; const fid = s.dataset.id, v = Number(s.value) * 1000;
    if (PL.fid === fid && PL.url) { PL.a.currentTime = v / 1000; PL.clipEnd = 0; paint(); } else await seek(fid, v, {lead: 0}); });

  /* ---------- What can be replayed with a lecture: its notes and files ---------- */
  const noteName = n => (String(n.text || "").split("\n").map(l => l.replace(/\[\[|\]\]/g, "").trim()).find(Boolean) || "Note").slice(0, 80);
  function items(f){
    const out = [], seen = new Set(), add = (k, id, why) => { const key = k + ":" + id; if (seen.has(key)) return; const x = k === "note" ? state.notes[id] : state.files[id];
      if (!x || x.archived || (k === "note" && x.wb) || (k === "file" && (x.folderId === "lectures" || x.kind === "link"))) return; seen.add(key); out.push({k, id, why}); };
    ((f.lec && Array.isArray(f.lec.att)) ? f.lec.att : []).forEach(a => a && add(a.k, a.id, "att"));
    Object.values(state.notes || {}).forEach(n => { if (n && n.rp && n.rp.f === f.id) add("note", n.id, "typed"); });
    if (f.lec && f.lec.note) add("note", f.lec.note, "study");
    try { if (window.SBCLS) { const key = SBCLS.recKeyOf(f); if (key) { const I = SBCLS.itemsOf(f.courseId, key); I.notes.forEach(n => add("note", n.id, "class")); I.files.forEach(x => add("file", x.id, "class")); } } } catch (e) {}
    return out;
  }
  const pinsOf = (f, id) => R.cleanPins(f && f.lec && f.lec.pins && f.lec.pins[id]);
  // A note's lines with their times: pinned by hand, typed while recording (placed by their words just before), or placed by their words
  function noteTimes(f, n){
    const segs = R.noteSegs(n.text), pins = pinsOf(f, n.id), X = canTime(f) ? timeline(f) : null;
    const typed = n.rp && n.rp.f === f.id ? R.cleanPins(n.rp.k, 2000) : {};
    const al = X ? R.align(X.IX, segs.map(s => s.s)) : segs.map(() => ({t: null, sc: 0}));
    return segs.map((s, i) => {
      if (pins[s.key] != null) return Object.assign({}, s, {t: pins[s.key], how: "pin"});
      if (typed[s.key] != null) return Object.assign({}, s, {t: X ? R.refineTyped(X.IX, s.s, typed[s.key]) : Math.max(0, typed[s.key] - 4000), how: "typed"});
      return Object.assign({}, s, {t: s.words ? al[i].t : null, how: al[i].t != null && s.words ? "words" : ""});
    });
  }
  async function pageTimes(f, x){
    let text = ""; try { text = window.SBFILETEXT ? await SBFILETEXT(x.id, 400000) : ""; } catch (e) {}
    const pins = pinsOf(f, x.id), X = canTime(f) ? timeline(f) : null;
    let pg = R.pageSegs(text).filter(p => p.s.trim());
    if (!pg.length) pg = [{key: "p1", label: /^image\//.test(fileTypeOf(x)) ? "Picture" : "Whole File", s: "", none: true}];
    const al = X && !pg[0].none ? R.align(X.IX, pg.map(p => p.s)) : pg.map(() => ({t: null}));
    return pg.map((p, i) => pins[p.key] != null ? Object.assign({}, p, {t: pins[p.key], how: "pin"}) : Object.assign({}, p, {t: al[i].t, how: al[i].t != null ? "words" : ""}));
  }

  /* ---------- In the lecture's sheet ---------- */
  // Under the Transcript and Summary buttons: the ★ marks, to play from each
  function mainHtml(f){
    if (!hasAudio(f)) return "";
    const marks = ((f.lec && Array.isArray(f.lec.marks)) ? f.lec.marks : []).filter(t => Number.isFinite(Number(t)) && t >= 0).slice(0, 60);
    const X = timeline(f);
    return `${marks.length ? `<div class="rp-marks" data-rp-f="${esc(f.id)}"><span class="mini">Your marks</span>${marks.map(t => `<button type="button" class="rp-chip" data-act="rp-at" data-id="${esc(f.id)}" data-t="${Math.round(t)}" data-rp-t="${Math.round(t)}" aria-label="Play from your mark at ${clock(t)}">★ ${clock(t)}</button>`).join("")}</div>` : ""}
      ${X && X.est && durOf(f) ? `<p class="mini rp-est">This lecture was saved before times were kept, so its times are estimated from the transcript's length.</p>` : ""}`;
  }
  // A replay button on each row of Slides and Notes
  const rowBtn = (f, a) => hasAudio(f) ? `<button type="button" class="btn small rp-row" data-act="rp-item" data-id="${esc(f.id)}" data-k="${esc(a.k)}" data-a="${esc(a.id)}" aria-label="Replay the lecture with ${esc(a.k === "note" ? "this note" : "this file")}">${IC.play(14)}Replay</button>` : "";
  // Notes and files that belong with the lecture without being added to it (typed while recording, its class page, its study notes)
  const extraItems = f => items(f).filter(x => x.why !== "att");
  const chip = (fid, t, how, label) => t == null ? `<span class="rp-chip none" aria-hidden="true">–:––</span>`
    : `<button type="button" class="rp-chip${how === "pin" ? " pinned" : ""}" data-act="rp-at" data-id="${esc(fid)}" data-t="${Math.round(t)}" aria-label="Play from ${clock(t)}${label ? ": " + esc(label) : ""}">${how === "pin" ? IC.pin(12) : ""}${clock(t)}</button>`;
  // The transcript or summary with a time on each paragraph and point
  function docHtml(f, doc, text){
    const X = canTime(f) ? timeline(f) : null, bl = R.docBlocks(text);
    if (!X || !hasAudio(f)) return null;
    let times;
    if (doc === "sum") times = R.timeBlocks(X.IX, bl, {order: false});
    else if (!(f.lec && f.lec.org) || text === f.tr.text) { let at = 0; const T = String(f.tr.text || ""); times = bl.map(b => { if (b.k === "mark") return {t: b.mark}; const i = T.indexOf(b.s.slice(0, 60), at); if (i < 0) return {t: null}; at = i + 1; return {t: X.map(i)}; }); }
    else times = R.timeBlocks(X.IX, bl);
    let h = "", ul = false;
    const endUl = () => { if (ul) { h += "</ul>"; ul = false; } };
    bl.forEach((b, i) => {
      const t = times[i] && times[i].t, on = t != null ? ` data-rp-t="${Math.round(t)}"` : "";
      if (b.k === "li") { if (!ul) { h += "<ul>"; ul = true; } h += `<li${on}>${t != null ? chip(f.id, t, "", "") + " " : ""}${esc(b.s)}</li>`; return; }
      endUl();
      if (b.k === "h") h += `<h4${on}>${esc(b.s)}</h4>`;
      else if (b.k === "mark") h += `<p class="lec-mk"${on}>${t != null ? chip(f.id, t, "", "your mark") : ""} <span>★ Marked</span></p>`;
      else h += `<p class="rp-para"${on}>${t != null ? chip(f.id, t, "", "") + " " : ""}${esc(b.s)}</p>`;
    });
    endUl();
    return `<div class="rp-doc" data-rp-f="${esc(f.id)}">${h}</div>${X.est ? `<p class="mini rp-est">Times are estimated: this lecture was saved before times were kept.</p>` : ""}`;
  }

  /* A note's or file's replay view: every line or page with its time, lighting up as the lecture plays */
  const VIEW = {fix: false};
  async function drawItem(fid, k, id){
    const f = state.files[fid], b = dlg.querySelector(".lec-view"), ft = dlg.querySelector(".lec-vfoot"); if (!f || !b || !ft) return;
    if (locked()) { proWhy("Lecture Replay is part of Studyboard Pro: tap a line of your notes or a slide to hear that moment of the lecture."); return; }
    const x = k === "note" ? state.notes[id] : state.files[id];
    if (!x) { toast("That's not here any more."); window.SBLEC && SBLEC.redraw(fid); return; }
    b.dataset.id = fid; b.dataset.rpItem = k + ":" + id;
    const name = k === "note" ? noteName(x) : x.name, X = canTime(f) ? timeline(f) : null;
    const top = `<div class="lec-doc-head"><button type="button" class="link-btn" data-act="lec-doc" data-id="${esc(fid)}" data-doc="">‹ ${esc(f.name)}</button><h3>${k === "note" ? IC.note(16) : IC.file(16)} ${esc(name)}${beta()}</h3></div>`;
    let rows = [];
    if (k === "note") rows = noteTimes(f, x);
    else { b.innerHTML = `${top}<p class="lec-busy"><span class="ai-spin" aria-hidden="true"></span> Reading the file…</p>`; rows = await pageTimes(f, x); if (b.dataset.rpItem !== k + ":" + id) return; }
    const timed = rows.filter(r => r.t != null).length, words = rows.filter(r => k === "file" ? !r.none : r.words).length;
    const fix = VIEW.fix, nowT = nowOf(fid);
    const why = !X ? "This lecture has no transcript, so lines can't be matched by their words. Play the recording and use Fix Times to set them."
      : k === "file" && rows[0] && rows[0].none ? "Studyboard can't read the words in this file, so it can't match it to the lecture. Play the recording and use Fix Times to set when you were on it."
      : timed ? `${timed} of ${rows.length} ${k === "note" ? "lines" : "pages"} matched to the lecture${timed < words ? ". Fix Times sets the rest" : ""}.` : `None of this matched what was said. Use Fix Times to set the times while you listen.`;
    const row = (r, i) => {
      const label = k === "note" ? (r.shown || r.s) : `${r.label}${r.s.trim() ? ": " + r.s.replace(/\s+/g, " ").trim().slice(0, 140) : ""}`;
      if (fix) return `<li class="rp-line fix"><button type="button" class="rp-set" data-act="rp-pin" data-id="${esc(fid)}" data-k="${esc(k)}" data-a="${esc(id)}" data-key="${esc(r.key)}" aria-label="Set “${esc(label.slice(0, 60))}” to the moment playing now">${IC.pin(14)}<span class="rp-set-t">Set to <b class="rp-now">${clock(nowT)}</b></span></button><span class="rp-txt">${r.t != null ? `<span class="mini">${clock(r.t)}${r.how === "pin" ? " (set by you)" : ""}</span> ` : ""}${esc(label)}</span>${r.how === "pin" ? `<button type="button" class="link-btn mini" data-act="rp-unpin" data-id="${esc(fid)}" data-a="${esc(id)}" data-key="${esc(r.key)}">Clear</button>` : ""}</li>`;
      return `<li class="rp-line${r.t == null ? " untimed" : ""}${k === "file" ? " page" : ""}"${r.t != null ? ` data-rp-t="${Math.round(r.t)}"` : ""}>${chip(fid, r.t, r.how, label.slice(0, 60))}<span class="rp-txt">${k === "file" ? `<b>${esc(r.label)}</b> ` : ""}${esc(k === "note" ? r.shown || r.s : r.s.replace(/\s+/g, " ").trim().slice(0, 220))}</span></li>`;
    };
    b.innerHTML = `${top}<div class="rp-ihead"><p class="mini">${esc(why)}</p><button type="button" class="btn small${fix ? " primary" : ""}" data-act="rp-fix" data-id="${esc(fid)}" data-k="${esc(k)}" data-a="${esc(id)}" aria-pressed="${fix}">${IC.pin(14)}${fix ? "Done Fixing" : "Fix Times"}</button></div>
      ${fix ? `<p class="mini rp-fixhint">Play the recording to the moment you want, then tap a ${k === "note" ? "line" : "page"} to set it there.</p>` : ""}
      <ol class="rp-lines" data-rp-f="${esc(fid)}">${rows.map(row).join("")}</ol>`;
    ft.innerHTML = `${k === "note" ? `<button type="button" class="btn" data-act="rp-open-note" data-id="${esc(id)}">Open Note</button>` : `<a class="btn" href="${esc(fileHref(x))}" ${typeof fileAttr === "function" ? fileAttr(x) : ""} target="_blank" rel="noopener noreferrer">Open File</a>`}<span class="spacer"></span><button type="button" class="btn primary" data-act="close">Done</button>`;
    paint();
  }
  function setPin(fid, id, key, ms){
    const cur = state.files[fid]; if (!cur) return;
    const L = Object.assign({}, cur.lec || {}), pins = Object.assign({}, L.pins || {}), mine = R.cleanPins(pins[id]);
    if (ms == null) delete mine[key]; else mine[key] = Math.round(ms);
    if (Object.keys(mine).length) pins[id] = mine; else delete pins[id];
    // at most 40 notes and files keep times set by hand on one lecture
    Object.keys(pins).slice(40).forEach(k => { delete pins[k]; });
    L.pins = pins;
    applyChanges([{kind: "file", id: fid, after: Object.assign(clone(cur), {updated: Date.now(), lec: L})}], ms == null ? "Time cleared" : `Set to ${clock(ms)}`);
  }

  /* ---------- Notes typed while recording ---------- */
  // Which lines are new: a line kept, or being edited in place, keeps its time; a new line gets the time it was started
  function trackLines(prev, text, now){
    prev = Array.isArray(prev) ? prev : [];
    const used = new Set(), close = (a, b) => { if (!a || !b) return !a || !b; let p = 0; while (p < a.length && p < b.length && a[p] === b[p]) p++; let q = 0; while (q < a.length - p && q < b.length - p && a[a.length - 1 - q] === b[b.length - 1 - q]) q++; return p + q >= Math.min(a.length, b.length) * 0.6; };
    return String(text || "").split("\n").map((s, i) => {
      let t = null; const same = prev[i];
      if (same && same.s === s) { t = same.t; used.add(i); }
      else { const k = prev.findIndex((p, j) => !used.has(j) && p.s === s && s.trim()); if (k >= 0) { t = prev[k].t; used.add(k); } else if (same && !used.has(i) && close(same.s.trim(), s.trim())) { t = same.t; used.add(i); } }
      if (t == null && s.trim()) t = Math.round(now);
      return {s, t: s.trim() ? t : null};
    }).slice(0, 2000);
  }
  function recNotesHtml(REC, review){
    const lines = Array.isArray(REC.typed) ? REC.typed : [];
    if (review && !lines.some(l => l && String(l.s || "").trim())) return "";
    return `<label class="f rp-recnotes"><span class="lh">Your Notes${beta()}<span class="mini"> ${review ? "Saved as a note with the lecture. Each line plays the moment you wrote it." : "Each line remembers when you wrote it, so you can play that moment later."}</span></span>
      <textarea id="rpRecNotes" rows="${review ? 5 : 4}" maxlength="8000" placeholder="Type notes as the lecture goes. A new line for each point." spellcheck="true">${esc(lines.map(l => l.s).join("\n"))}</textarea></label>`;
  }
  function recNotesWire(REC, elapsed, onChange){
    const ta = document.getElementById("rpRecNotes"); if (!ta) return;
    ta.addEventListener("input", () => { REC.typed = trackLines(REC.typed, ta.value, REC.view === "rec" ? elapsed() : null); if (onChange) onChange(); });
  }
  function placeNote(cid){
    const b = cid && noteBoards().find(x => x.courseId === cid), board = b ? b.id : "";
    const on = notesArr().filter(n => !n.archived && (n.board || "") === board), z = notesArr().reduce((m, n) => Math.max(m, n.z || 0), 0) + 1;
    return {board, z, x: 40 + (on.length % 4) * (NOTE_W() + 30), y: 40 + Math.floor(on.length / 4) * 260};
  }
  // The typed notes become a note filed with the lecture, each line keeping when it was written
  function typedNote(REC, fid, cid){
    const lines = (Array.isArray(REC.typed) ? REC.typed : []).filter(l => l && typeof l.s === "string");
    if (!lines.some(l => l.s.trim())) return null;
    const title = `${REC.title || "Lecture"}: My Notes`, text = [title].concat(lines.map(l => l.s)).join("\n").slice(0, 8000);
    const segs = R.noteSegs(text), k = {};
    // segment line li is lines[li - 1] (the title is line 0)
    segs.forEach(s => { const l = lines[s.li - 1]; if (l && Number.isFinite(l.t)) k[s.key] = Math.round(l.t); });
    const pl = placeNote(cid);
    return normNote({id: uid(), text, color: "blue", x: pl.x, y: pl.y, z: pl.z, rot: 0, courseId: cid || "", board: pl.board, created: Date.now(), rp: {f: fid, k}});
  }
  // a recording that becomes a class's: its typed notes go with it
  hook("changed", changes => {
    if (!Array.isArray(changes)) return;
    changes.forEach(c => { if (!c || c.kind !== "file" || !c.after || !c.after.cls || c.after.folderId !== "lectures") return;
      const fid = c.id, key = c.after.cls;
      const ns = Object.values(state.notes || {}).filter(n => n && n.rp && n.rp.f === fid && !n.cls);
      if (ns.length) setTimeout(() => { const ch = ns.filter(n => state.notes[n.id] && !state.notes[n.id].cls).map(n => ({kind: "note", id: n.id, after: Object.assign(clone(state.notes[n.id]), {cls: key})})); if (ch.length) applyChanges(ch, ""); }, 0); });
  });

  /* ---------- Hear It on a card ---------- */
  const TC = new Map();
  function cardLecture(c){
    const fr = c && c.from; if (!fr) return null;
    if (fr.k === "lecture") { const f = state.files[fr.id]; return hasAudio(f) ? f : null; }
    if (fr.k === "note") { const n = state.notes[fr.id]; const fid = n && ((n.rp && n.rp.f) || n.lec); const f = fid && state.files[fid]; return hasAudio(f) ? f : null; }
    return null;
  }
  function cardHtml(d, c){
    const f = cardLecture(c); if (!f || !d) return "";
    const t = c.from && Number.isFinite(c.from.t) ? c.from.t : TC.get(c.id);
    return `<div class="rp-hear-row"><button type="button" class="btn small rp-hear" data-act="rp-card" data-deck="${esc(d.id)}" data-id="${esc(c.id)}">${IC.ear(16)}Hear It${beta()}${locked() ? ` <span class="pro-badge">PRO</span>` : ""}</button><span class="mini">${esc(f.name)}${t != null ? ` · ${clock(t)}` : ""}</span></div>`;
  }
  async function hearCard(deckId, cardId){
    if (locked()) { proWhy("Hear It is part of Studyboard Pro: hear the 30 seconds of the lecture where a card's answer was taught."); return; }
    const d = state.decks[deckId], c = d && (d.cards || []).find(x => x.id === cardId), f = cardLecture(c); if (!f) return;
    let t = Number.isFinite(c.from && c.from.t) ? c.from.t : TC.get(c.id);
    if (t == null) { t = timeOf(f.id, `${c.front || ""} ${c.back || ""}`); if (t != null) TC.set(c.id, t); }
    if (t == null) { toast("Couldn't find where this was said. Playing the lecture from the start."); t = 0; }
    await seek(f.id, t, {clip: 30000, lead: t ? 5000 : 0});
  }

  /* ---------- Actions ---------- */
  hook("act", (act, el, id) => {
    switch (act) {
      case "rp-toggle": toggle(id); return true;
      case "rp-skip": skip(id, Number(el.dataset.d) || 0); return true;
      case "rp-rate": cycleRate(); return true;
      case "rp-stop": stopAll(); return true;
      case "rp-at": seek(id, Number(el.dataset.t) || 0, {lead: el.closest(".rp-doc") ? 1500 : 5000}); return true;
      case "rp-card": hearCard(el.dataset.deck, id); return true;
      case "rp-item": VIEW.fix = false; if (!dlg.open || !dlg.querySelector(".lec-view")) { if (window.SBLEC && SBLEC.open) SBLEC.open(id, () => drawItem(id, el.dataset.k, el.dataset.a)); } else drawItem(id, el.dataset.k, el.dataset.a); return true;
      case "rp-fix": VIEW.fix = !VIEW.fix; drawItem(id, el.dataset.k, el.dataset.a); return true;
      case "rp-pin": {
        if (PL.fid !== id || !PL.url) { toast("Play the recording to the moment you want first."); toggle(id); return true; }
        setPin(id, el.dataset.a, el.dataset.key, nowOf(id) + 1000); drawItem(id, el.dataset.k, el.dataset.a); return true; }
      case "rp-unpin": { const k = state.notes[el.dataset.a] ? "note" : "file"; setPin(id, el.dataset.a, el.dataset.key, null); drawItem(id, k, el.dataset.a); return true; }
      case "rp-open-note": { if (!state.notes[id]) return true; if (dlg.open) dlg.close(); if (P() && P().openLink) P().openLink({kind: "note", id}, 0); else { ui.tab = "notes"; render(); } return true; }
    }
    return false;
  });
  // the "Set to" buttons follow the player
  setInterval(() => { if (!VIEW.fix || !PL.url) return; document.querySelectorAll(".rp-set .rp-now").forEach(b => { b.textContent = clock(nowOf(PL.fid)); }); }, 500);

  SBREPLAY = window.SBREPLAY = {
    anchors: (text, pieces, live) => { try { return R.anchorsFor(text, pieces, {live: !!live}); } catch (e) { return []; } },
    typedNote, recNotesHtml, recNotesWire, trackLines, dockHtml, mainHtml, rowBtn, extraItems, docHtml, drawItem, cardHtml, hasAudio,
    prime: fid => { const f = state.files[fid]; if (hasAudio(f) && PL.fid !== fid && !PL.loading && !(PL.a && !PL.a.paused)) load(fid); },
    timeOf, seek, paint, stop: stopAll, state: () => ({fid: PL.fid, playing: playing(PL.fid), now: nowOf(PL.fid), clipEnd: PL.clipEnd})
  };
})();
