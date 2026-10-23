/* ===== module: 97-match.js ===== */
/* Match: a timed game on a deck */
(() => {
  /*MATCH-START: pure code, no DOM or app state */
  const MATCH = (() => {
    const N = 6, PENALTY = 1000, KEEP = 5, MIN = 3;
    const norm = s => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
    // Cards that can be tiles
    const usable = cards => (Array.isArray(cards) ? cards : []).filter(c => c && !c.draft && !c.img && norm(c.front) && norm(c.back));
    const mix = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    // Up to six cards, none repeating another's text on either side
    function pick(cards, n, rnd){
      rnd = rnd || Math.random; n = n || N;
      const out = [], seen = new Set();
      for (const c of mix(usable(cards).slice(), rnd)) {
        const f = norm(c.front).toLowerCase(), b = norm(c.back).toLowerCase();
        if (f === b || seen.has(f) || seen.has(b)) continue;
        seen.add(f); seen.add(b); out.push(c);
        if (out.length >= n) break;
      }
      return out;
    }
    const tiles = (cards, rnd) => mix(cards.flatMap((c, k) => [{k, side: "t", text: norm(c.front)}, {k, side: "d", text: norm(c.back)}]), rnd || Math.random);
    // Text size step for a tile
    const size = t => { const n = String(t || "").length; return n > 140 ? 3 : n > 70 ? 2 : n > 32 ? 1 : 0; };
    // 12.3 (seconds and tenths), 1:02.3 past a minute
    const clock = ms => { const d = Math.max(0, Math.floor((Number(ms) || 0) / 100)), s = Math.floor(d / 10), t = d % 10; return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}.${t}` : `${s}.${t}`; };
    const say = ms => { const d = Math.max(0, Math.floor((Number(ms) || 0) / 100)), s = Math.floor(d / 10); return s >= 60 ? `${Math.floor(s / 60)} min ${s % 60}.${d % 10} seconds` : `${s}.${d % 10} seconds`; };
    const ok = v => Number.isFinite(v) && v > 0;
    const bestOf = m => m && typeof m === "object" ? (ok(m.best) ? m.best : 0) : 0;
    // A finished round folded into the deck's times
    function record(prev, ms, now){
      ms = Math.max(1, Math.round(Number(ms) || 0)); now = now || Date.now();
      const p = prev && typeof prev === "object" ? prev : {}, old = bestOf(p), better = !old || ms < old;
      const recent = (Array.isArray(p.recent) ? p.recent.filter(r => r && ok(r.ms)) : []).concat({ms, at: now}).sort((a, b) => (a.at || 0) - (b.at || 0)).slice(-KEEP);
      const match = Object.assign({}, p, {best: better ? ms : old, at: better ? new Date(now).toISOString() : (p.at || new Date(now).toISOString()), recent});
      return {match, first: !old, better: !!old && ms < old, prev: old};
    }
    return {N, PENALTY, KEEP, MIN, norm, usable, pick, tiles, size, clock, say, bestOf, record};
  })();
  /*MATCH-END*/

  let R = null;
  const still = () => { try { return (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) || !!(window.SBMotion && SBMotion.level && SBMotion.level() === "static"); } catch (e) { return false; } };
  const pl = (n, w, ws) => `${n} ${n === 1 ? w : (ws || w + "s")}`;
  const now = () => (window.performance && performance.now ? performance.now() : Date.now());
  const elapsed = () => R ? (R.t0 ? now() - R.t0 : 0) + R.pen : 0;
  const tileEl = i => dlg.querySelector(`.mt-tile[data-mt="${i}"]`);
  const sayIt = t => { const s = $("#mtSay"); if (s) { s.textContent = ""; setTimeout(() => { if (s.isConnected) s.textContent = t; }, 30); } };

  function stop(){ if (R && R.iv) { clearInterval(R.iv); R.iv = 0; } }
  function tick(){
    const el = $("#mtTime");
    if (!R || !el) { stop(); return; }
    el.textContent = MATCH.clock(elapsed());
  }
  // src: {name, cards, deckId (the deck that keeps the best time, or "")}. opts.after
  function start(src, opts){
    const cards = MATCH.pick(src && src.cards);
    if (cards.length < MATCH.MIN) {
      const n = MATCH.usable(src && src.cards).length;
      toast(n >= MATCH.MIN ? "Match needs at least 3 cards with different text. Add a few more cards first." : `Match needs at least 3 cards with text on both sides${n ? `. This deck has ${n}` : ""}. Add a few more cards first.`);
      return false;
    }
    stop();
    R = {src, opts: opts || {}, cards, tiles: MATCH.tiles(cards), sel: -1, t0: 0, pen: 0, miss: 0, left: cards.length, done: false, iv: 0, ms: 0};
    draw();
    return true;
  }
  const tileHtml = (t, i) => `<button type="button" class="mt-tile s${MATCH.size(t.text)} ${t.side === "t" ? "is-term" : "is-def"}" data-mt="${i}" aria-pressed="false" aria-label="${t.side === "t" ? "Term" : "Definition"}: ${esc(t.text)}" title="${esc(t.text)}"><span class="mt-tx">${esc(t.text)}</span></button>`;
  function draw(){
    openSheet(`<div class="sheet mt-sheet${still() ? " mt-still" : ""}" data-mt-play>${head("Match")}<div class="sheet-body">
      <div class="mt-bar"><span class="mt-name">${esc(R.src.name || "Deck")}</span><span class="mt-clock"><span id="mtTime" role="timer" aria-label="Time in seconds">0.0</span><span class="mt-pen" id="mtPen" aria-hidden="true">+1s</span></span></div>
      <p class="mini mt-help">Tap a term, then its definition. The clock starts on your first tap, and a wrong pair adds 1 second.</p>
      <div class="mt-grid" role="group" aria-label="Terms and definitions to match">${R.tiles.map(tileHtml).join("")}</div>
      <p class="sr" id="mtSay" aria-live="polite"></p></div>
      <div class="sheet-foot"><span class="mini" id="mtLeft">${pl(R.left, "pair")} to go</span><span class="spacer"></span><button type="button" class="btn" data-act="close">Quit</button><button type="button" class="btn" data-act="mt-again">Shuffle</button></div></div>`);
  }
  function select(i){
    if (R.sel >= 0) { const o = tileEl(R.sel); if (o) { o.classList.remove("on"); o.setAttribute("aria-pressed", "false"); } }
    R.sel = i;
    if (i >= 0) { const e = tileEl(i); if (e) { e.classList.add("on"); e.setAttribute("aria-pressed", "true"); } }
  }
  function tap(i){
    if (!R || R.done) return;
    const t = R.tiles[i]; if (!t || t.gone) return;
    if (!R.t0) { R.t0 = now(); R.iv = setInterval(tick, 100); }
    if (R.sel < 0 || R.sel === i) { select(R.sel === i ? -1 : i); return; }
    const a = R.tiles[R.sel];
    if (a.side === t.side) { select(i); return; }
    const j = R.sel; select(-1);
    if (a.k === t.k) hit(j, i); else miss(j, i);
  }
  function hit(a, b){
    R.tiles[a].gone = R.tiles[b].gone = true; R.left--;
    const els = [tileEl(a), tileEl(b)].filter(Boolean), had = els.includes(document.activeElement);
    els.forEach(e => { e.classList.add("hit"); e.disabled = true; e.setAttribute("aria-hidden", "true"); });
    setTimeout(() => els.forEach(e => e.classList.add("gone")), still() ? 0 : 320);
    const left = $("#mtLeft"); if (left) left.textContent = `${pl(R.left, "pair")} to go`;
    if (!R.left) { finish(); return; }
    sayIt(`Match. ${pl(R.left, "pair")} to go.`);
    if (had) { const nx = R.tiles.findIndex((x, k) => !x.gone && k > b); const k = nx >= 0 ? nx : R.tiles.findIndex(x => !x.gone); const e = tileEl(k); if (e) e.focus(); }
  }
  function miss(a, b){
    R.pen += MATCH.PENALTY; R.miss++;
    [tileEl(a), tileEl(b)].filter(Boolean).forEach(e => { e.classList.remove("miss"); void e.offsetWidth; e.classList.add("miss"); setTimeout(() => e.classList.remove("miss"), 480); });
    const p = $("#mtPen"); if (p) { p.classList.remove("show"); void p.offsetWidth; p.classList.add("show"); setTimeout(() => p.classList.remove("show"), 900); }
    sayIt("Not a match. Plus 1 second.");
    tick();
  }
  function finish(){
    stop(); R.done = true; R.ms = Math.max(1, Math.round(elapsed()));
    const d = R.src.deckId && state.decks[R.src.deckId];
    let rec;
    if (d) { const nd = clone(d); rec = MATCH.record(nd.match, R.ms); nd.match = rec.match; saveDeck(nd, null); }
    else { rec = MATCH.record(R.opts.prev || null, R.ms); R.opts.prev = rec.match; }
    R.rec = rec;
    setTimeout(() => { if (R && R.done && dlg.open && dlg.querySelector("[data-mt-play]")) result(); }, still() ? 0 : 360);
  }
  function result(){
    const rec = R.rec, m = rec.match, best = MATCH.bestOf(m), recent = (m.recent || []).slice().reverse();
    const lead = rec.better ? `<span class="mt-new">New best!</span>` : rec.first ? `<span class="mini">Your first time on this deck. Play again to beat it.</span>` : best && R.ms > best ? `<span class="mini">${MATCH.clock(R.ms - best)} seconds off your best</span>` : "";
    openSheet(`<div class="sheet mt-sheet${still() ? " mt-still" : ""}" data-mt-done>${head("Match")}<div class="sheet-body">
      <div class="mt-res" role="status"><span class="mt-name">${esc(R.src.name || "Deck")}</span><span class="mini">Your time</span>
        <b class="mt-big">${MATCH.clock(R.ms)}<span class="mini"> s</span></b>${lead}
        <span class="mini">${R.miss ? `Includes ${pl(R.miss, "wrong pair")} (+${R.miss} s)` : "No wrong pairs. Clean round!"}</span>
        <span>Best time <b id="mtBest">${MATCH.clock(best)} s</b></span></div>
      ${recent.length > 1 ? `<div class="mt-recent"><span class="mini">Recent</span><ol>${recent.map((r, i) => `<li class="${r.ms === best ? "best" : ""}"${i === 0 ? ' aria-current="true"' : ""}>${MATCH.clock(r.ms)} s</li>`).join("")}</ol></div>` : ""}
      <div id="mtAfter"></div></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Done</button><button type="button" class="btn primary" data-act="mt-again" autofocus>Play Again</button></div></div>`);
    if (R.opts.after) { const box = $("#mtAfter"); try { R.opts.after({ms: R.ms, miss: R.miss, best, better: rec.better, first: rec.first}, box); } catch (e) { console.warn("match after", e); } }
  }

  // Long press on a tile (touch) shows its whole text without picking it
  let press = 0, peeked = false;
  const unpeek = () => { const p = dlg.querySelector(".mt-peek"); if (p) p.remove(); };
  dlg.addEventListener("pointerdown", e => {
    clearTimeout(press); peeked = false;
    const b = e.target.closest && e.target.closest(".mt-tile"); if (!b || e.pointerType === "mouse") return;
    press = setTimeout(() => {
      const t = R && R.tiles[Number(b.dataset.mt)], g = b.closest(".mt-grid"); if (!t || !g) return;
      peeked = true; unpeek();
      const p = document.createElement("p"); p.className = "mt-peek"; p.setAttribute("role", "note"); p.textContent = t.text; g.appendChild(p);
    }, 450);
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(ev => dlg.addEventListener(ev, () => { clearTimeout(press); if (peeked) { setTimeout(unpeek, 1600); setTimeout(() => { peeked = false; }, 500); } }, true));
  dlg.addEventListener("contextmenu", e => { if (e.target.closest && e.target.closest(".mt-tile")) e.preventDefault(); });
  dlg.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest(".mt-tile[data-mt]"); if (!b || !dlg.querySelector("[data-mt-play]")) return;
    if (peeked) { peeked = false; return; }
    unpeek(); tap(Number(b.dataset.mt));
  });
  dlg.addEventListener("close", () => { if (dlg.open) return; stop(); if (R && !R.done) R = null; });

  hook("act", (act, el, id) => {
    if (act === "mt-start") { const d = state.decks[id]; if (d) { if (dlg.open) dlg.close(); start({name: d.name, cards: d.cards, deckId: d.id}); } return true; }
    if (act === "mt-again") { if (R) start(R.src, R.opts); return true; }
    return false;
  });
  // The Match button on a deck page (Flashcards), next to Study and Make a Quiz
  function deckBtn(d){
    const best = MATCH.bestOf(d && d.match);
    return `<button class="btn" data-act="mt-start" data-id="${esc(d.id)}" ${d.cards.length ? "" : "disabled"} title="${best ? `Match the terms and definitions against the clock. Your best: ${MATCH.clock(best)} s` : "Match the terms and definitions against the clock"}">Match</button>`;
  }
  window.SBMATCH = {start, deckBtn, MATCH, clock: MATCH.clock, best: d => MATCH.bestOf(d && d.match), usable: c => MATCH.usable(c).length};
  // test handle, like __sbNotecards
  window.__sbMatch = {state: () => state, ui, render, applyChanges, clone, round: () => R, MATCH, tap, elapsed};
})();

