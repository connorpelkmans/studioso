/* ===== module: 97-learn.js ===== */
/* Learn: a deck asked in short rounds until every card is known (the idea from Quizlet's Learn, done Studyboard's way, free).
   - A Learn button sits beside Study on a deck with 4 or more cards it can ask.
   - Rounds of 7 cards. A new card is asked as multiple choice (the wrong options are other answers from the same deck);
     once it's picked right it's asked again as a typed answer. A typed answer right makes it Mastered.
   - A miss sends the card back a step (Familiar to New) and it comes back later in the same round.
   - Typed answers forgive small typos (edit distance against the answer's length, with case and accents ignored), and
     "I was right" takes a miss back when the answer was right in other words.
   - Picture cards, and answers written with math or chemistry marks, are multiple choice only: they need two right picks.
   - It doesn't touch the review schedule unless "Count toward review" is ticked. Then a card moves along its schedule once,
     when it's mastered: Good if it was never missed in the session, Hard if it was.
   - A session left half way is kept on this device (localStorage, per deck) and picks up where it was.
   The pure part, between LEARN-START and LEARN-END, has no page or app access, so tests can run it. */
(() => {
  /*LEARN-START*/
  const LEARN = (() => {
    const ROUND = 7, MIN = 4, OPTS = 4, BACK = 2, V = 1;
    const NEW = 0, FAMILIAR = 1, MASTERED = 2;
    const norm = s => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
    // Math or chemistry in the text (01-math.js's marks): hard to type, so such answers are picked, not typed
    const mathy = s => /\$[^$\s]|\\\(|\\\[|\\ce\{|\\frac|\\sqrt/.test(String(s || ""));
    // How a card can be asked: "pic" (a picture card, picked), "pick" (math answer, picked), "type" (picked, then typed)
    const kindOf = c => c && c.img ? "pic" : mathy(c && c.back) ? "pick" : "type";
    // Cards Learn can ask: not drafts, with a prompt and an answer. A picture card needs a typed label (not "nl": the picture is the answer)
    const usable = cards => (Array.isArray(cards) ? cards : []).filter(c => c && c.id && !c.draft && norm(c.back) && (c.img ? !c.img.nl : norm(c.front)));
    const mix = (a, rnd) => { rnd = rnd || Math.random; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

    /* Comparing answers */
    // case, accents, formatting marks, punctuation (and in plain, "the/a/an") don't count
    const marks = s => norm(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\*\*|~~|==|`/g, "")
      .replace(/[^\p{L}\p{N}%.\- ]+/gu, " ").replace(/\.+(?=\s|$)/g, " ").replace(/(^|\s)[.\-]+(?=\s|$)/g, " ").replace(/\s+/g, " ").trim();
    const plain = s => marks(s).replace(/\b(the|a|an)\b/g, " ").replace(/\s+/g, " ").trim();
    function lev(a, b){
      if (a === b) return 0; if (!a.length) return b.length; if (!b.length) return a.length;
      let prev = Array.from({length: b.length + 1}, (_, i) => i);
      for (let i = 1; i <= a.length; i++) { const cur = [i]; for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
      return prev[b.length];
    }
    // The ways an answer can be written: the whole thing, without its (brackets), and each of "A; B", "A / B" or "word/word"
    // ("1/2" stays one answer)
    function alts(expected, how){
      const e = norm(expected), out = [e, e.replace(/\([^)]*\)/g, " ")];
      e.split(/\s*;\s*|\s+\/\s+|(?<=\p{L})\/(?=\p{L})/u).forEach(x => out.push(x, x.replace(/\([^)]*\)/g, " ")));
      return [...new Set(out.map(how || plain).filter(Boolean))];
    }
    const digits = s => (s.match(/\d+/g) || []).join(" ");
    const TYPO = 0.2;
    // {ok, close}: close = right, with a small typo (or the key words of a long answer)
    function check(given, expected){
      const g = plain(given); if (!g) return {ok: false, close: false};
      const list = alts(expected);
      if (list.includes(g)) return {ok: true, close: false};
      // a typo is measured with the little words left in too ("holds th dna" is close to "holds the dna")
      const pairs = list.map(a => [g, a]).concat(alts(expected, marks).map(a => [marks(given), a]));
      for (const [x, a] of pairs) {
        // short answers and numbers must be exact: "42" isn't "43", and "1945" isn't "1946"
        if (a.length < 4 || digits(a) !== digits(x)) continue;
        if (lev(x, a) / Math.max(a.length, x.length) <= TYPO) return {ok: true, close: true};
      }
      // a long definition: nearly all of its key words, in any order
      const kw = [...new Set(plain(expected).split(" ").filter(w => w.length > 3))];
      if (kw.length >= 4) { const have = new Set(g.split(" ")); if (kw.filter(w => have.has(w) || [...have].some(h => h.length > 3 && lev(h, w) <= 1)).length / kw.length >= 0.8) return {ok: true, close: true}; }
      return {ok: false, close: false};
    }

    /* Multiple choice */
    // Up to 3 wrong options from the same deck's answers: none the same as the right one or each other, in any spelling.
    // Answers about as long as the right one come first, so the right one doesn't stand out by its length.
    function distractors(card, pool, rnd, n){
      n = n == null ? OPTS - 1 : n;
      const right = plain(card.back), seen = new Set([right]), len = norm(card.back).length, out = [];
      const list = mix(usable(pool).filter(c => c.id !== card.id), rnd).map((c, k) => ({c, k, d: Math.abs(norm(c.back).length - len) / Math.max(8, len)}));
      list.sort((a, b) => (a.d > 1.5) - (b.d > 1.5) || a.k - b.k);
      for (const {c} of list) {
        const p = plain(c.back);
        if (!p || seen.has(p)) continue;
        seen.add(p); out.push({id: c.id, text: norm(c.back)});
        if (out.length >= n) break;
      }
      return out;
    }
    // {opts: [{id, text}], right: index}; fewer than 4 when the deck has fewer different answers
    function choices(card, pool, rnd){
      const opts = mix([{id: card.id, text: norm(card.back)}].concat(distractors(card, pool, rnd)), rnd);
      return {opts, right: opts.findIndex(o => o.id === card.id)};
    }

    /* A session */
    const item = () => ({lv: NEW, miss: 0, right: 0, first: null});
    // cards: the deck's cards. opts: {count: tick "Count toward review", deckId}
    function create(cards, opts, rnd){
      const ids = mix(usable(cards).map(c => c.id), rnd), items = {};
      ids.forEach(id => { items[id] = item(); });
      return {v: V, deckId: (opts && opts.deckId) || "", count: !!(opts && opts.count), order: ids, items, round: null, cur: null, fb: null, last: null, n: 0, ms: 0, at: Date.now()};
    }
    // The deck changed since the session was left: cards gone are dropped, new cards join at the end as New
    function sync(S, cards){
      const ids = usable(cards).map(c => c.id), have = new Set(ids);
      S.order = S.order.filter(id => have.has(id));
      ids.forEach(id => { if (!S.items[id]) { S.items[id] = item(); S.order.push(id); } });
      Object.keys(S.items).forEach(id => { if (!have.has(id)) delete S.items[id]; });
      if (S.round) { S.round.queue = S.round.queue.filter(id => have.has(id) && S.items[id].lv < MASTERED); S.round.ids = S.round.ids.filter(id => have.has(id)); }
      if (S.cur && !have.has(S.cur.id)) S.cur = null;
      if (S.fb && !have.has(S.fb.id)) S.fb = null;
      if (S.last && !have.has(S.last.id)) S.last = null;
      return S;
    }
    function counts(S){
      const out = {fresh: 0, familiar: 0, mastered: 0, total: 0};
      S.order.forEach(id => { const it = S.items[id]; if (!it) return; out.total++; if (it.lv >= MASTERED) out.mastered++; else if (it.lv === FAMILIAR) out.familiar++; else out.fresh++; });
      return out;
    }
    const done = S => S.order.length > 0 && S.order.every(id => S.items[id] && S.items[id].lv >= MASTERED);
    // The next round: the first 7 cards not yet mastered, in the session's order (so cards in progress stay until they're
    // known, and new ones join as others are mastered), shuffled
    function startRound(S, rnd){
      const ids = S.order.filter(id => S.items[id].lv < MASTERED).slice(0, ROUND);
      S.round = {n: ((S.round && S.round.n) || 0) + 1, ids: ids.slice(), queue: mix(ids.slice(), rnd), back: {}};
      S.cur = null; S.fb = null; S.last = null;
      return S.round;
    }
    const roundOver = S => !S.round || (!S.round.queue.length && !S.fb);
    // How a card is asked at its level: New is picked, Familiar is typed (a picture or math card is picked again)
    function typeFor(card, lv){ return lv >= FAMILIAR && kindOf(card) === "type" ? "type" : "mc"; }
    // The question on screen (made once, so it looks the same after leaving and coming back)
    function question(S, byId, rnd){
      if (S.cur) return S.cur;
      if (!S.round || !S.round.queue.length) return null;
      const id = S.round.queue[0], card = byId[id], it = S.items[id];
      if (!card || !it) { S.round.queue.shift(); return question(S, byId, rnd); }
      let type = typeFor(card, it.lv), mc = null;
      if (type === "mc") {
        // wrong options of the same sort when there are enough of them (a picture's labels for a picture card, formulas
        // for a formula), so the right one doesn't stand out by its look
        const all = Object.values(byId), same = all.filter(c => !!c.img === !!card.img && mathy(c.back) === mathy(card.back));
        mc = choices(card, same.length < all.length && distractors(card, same, rnd).length >= OPTS - 1 ? same : all, rnd);
        // no other answers to pick from: typed instead (a picture or math card has only one way left: it's taken as known)
        if (mc.opts.length < 2) { mc = null; type = kindOf(card) === "type" ? "type" : "free"; }
      }
      S.cur = Object.assign({id, type, lv: it.lv}, mc || {});
      return S.cur;
    }
    function step(S, id, right){
      const it = S.items[id], from = it.lv;
      if (right) { it.lv = Math.min(MASTERED, it.lv + 1); it.right++; }
      else { it.lv = Math.max(NEW, it.lv - 1); it.miss++; }
      if (it.first == null) it.first = !!right;
      return {from, to: it.lv, mastered: from < MASTERED && it.lv >= MASTERED};
    }
    // given: {pick: index} for multiple choice, {text} typed, {skip: true} for "Don't know". Returns the feedback.
    function answer(S, byId, given){
      const q = S.cur; if (!q || S.fb) return null;
      const card = byId[q.id]; if (!card) return null;
      given = given || {};
      let ok = false, close = false;
      if (q.type === "free") ok = true;
      else if (given.skip) ok = false;
      else if (q.type === "mc") ok = Number(given.pick) === q.right;
      else { const r = check(given.text, card.back); ok = r.ok; close = r.close; }
      const before = Object.assign({}, S.items[q.id]), queue = S.round.queue.slice(), back = Object.assign({}, S.round.back);
      const st = step(S, q.id, ok);
      S.round.queue.shift();
      // a miss comes back later in the round (at most twice; after that, next round)
      if (!ok && (S.round.back[q.id] || 0) < BACK) { S.round.back[q.id] = (S.round.back[q.id] || 0) + 1; S.round.queue.push(q.id); }
      S.n++;
      S.last = {id: q.id, before, queue, back};
      S.fb = {id: q.id, type: q.type, ok, close, pick: given.pick == null ? null : Number(given.pick), text: given.text == null ? "" : String(given.text).slice(0, 500), skip: !!given.skip, from: st.from, to: st.to, mastered: st.mastered, opts: q.opts || null, right: q.right == null ? null : q.right};
      S.cur = null;
      return S.fb;
    }
    // "I was right": a typed miss counts as right after all
    function override(S){
      const fb = S.fb, L = S.last;
      if (!fb || fb.ok || fb.type !== "type" || !L || L.id !== fb.id) return null;
      S.items[fb.id] = Object.assign({}, L.before); S.round.queue = L.queue.slice(); S.round.back = Object.assign({}, L.back);
      const st = step(S, fb.id, true);
      S.round.queue.shift();
      Object.assign(fb, {ok: true, over: true, from: st.from, to: st.to, mastered: st.mastered});
      S.last = null;
      return fb;
    }
    // Continue after the feedback
    function next(S){ S.fb = null; S.last = null; return S; }
    // The rating a mastered card gives the review schedule, when "Count toward review" is ticked
    const rateFor = it => it && it.miss ? "hard" : "good";
    // The summary at the end
    function summary(S){
      const ids = S.order.filter(id => S.items[id]);
      const first = ids.filter(id => S.items[id].first === true && !S.items[id].miss).length;
      const missed = ids.filter(id => S.items[id].miss).sort((a, b) => S.items[b].miss - S.items[a].miss);
      return {total: ids.length, first, missed, answers: S.n, ms: S.ms, rounds: (S.round && S.round.n) || 0};
    }
    // Kept on the device between visits
    const pack = S => JSON.stringify(S);
    function unpack(raw){
      let S; try { S = typeof raw === "string" ? JSON.parse(raw) : raw; } catch (e) { return null; }
      if (!S || S.v !== V || !Array.isArray(S.order) || !S.items || typeof S.items !== "object") return null;
      if (S.round && !(Array.isArray(S.round.queue) && Array.isArray(S.round.ids))) S.round = null;
      S.n = Number(S.n) || 0; S.ms = Number(S.ms) || 0;
      return S;
    }
    return {ROUND, MIN, OPTS, NEW, FAMILIAR, MASTERED, norm, plain, mathy, kindOf, usable, lev, alts, check, distractors, choices,
      create, sync, counts, done, startRound, roundOver, typeFor, question, answer, override, next, rateFor, summary, pack, unpack};
  })();
  /*LEARN-END*/

  /* ---------- On the page ---------- */
  const KEY = id => "sb:learn:" + id, RIGHT_MS = 900, CAP_MS = 120000;
  let R = null;   // {deckId, S, t0, timer}
  const still = () => { try { return (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) || !!(window.SBMotion && SBMotion.level && SBMotion.level() === "static"); } catch (e) { return false; } };
  const wide = () => { try { return matchMedia("(min-width:601px)").matches; } catch (e) { return true; } };
  const pl = (n, w, ws) => `${n} ${n === 1 ? w : (ws || w + "s")}`;
  const speak = t => { try { return typeof mathSpeech === "function" ? mathSpeech(t) : String(t || ""); } catch (e) { return String(t || ""); } };
  const sayIt = t => { const s = $("#lrSay"); if (s) { s.textContent = ""; setTimeout(() => { if (s.isConnected) s.textContent = t; }, 40); } };
  // Picture cards need the picture-card drawing (99-pro.js); without it they're left out
  const canPic = () => !!(window.SBPRO && SBPRO.cardFace);
  const cardsOf = d => (d && Array.isArray(d.cards) ? d.cards : []).filter(c => !c.img || canPic());
  const byIdOf = d => Object.fromEntries(LEARN.usable(cardsOf(d)).map(c => [c.id, c]));
  const usableN = d => LEARN.usable(cardsOf(d)).length;
  // what's left out, said once on the first screen
  function leftOut(d){
    const all = (d.cards || []).filter(c => !c.draft), pics = all.filter(c => c.img && (c.img.nl || !canPic())).length;
    const empty = all.filter(c => !c.img && !(LEARN.norm(c.front) && LEARN.norm(c.back))).length;
    const out = [];
    if (pics) out.push(`${pl(pics, "picture card")} with no typed label`);
    if (empty) out.push(`${pl(empty, "card")} missing a side`);
    return out.length ? `Left out: ${out.join(" and ")}.` : "";
  }
  /* Kept on this device, per deck (a half-done session isn't worth syncing) */
  function load(id){ try { const S = LEARN.unpack(localStorage.getItem(KEY(id))); return S && !LEARN.done(S) ? S : null; } catch (e) { return null; } }
  function save(){ if (!R) return; try { localStorage.setItem(KEY(R.deckId), LEARN.pack(R.S)); } catch (e) {} }
  function drop(id){ try { localStorage.removeItem(KEY(id)); } catch (e) {} }
  const stopTimer = () => { if (R && R.timer) { clearTimeout(R.timer); R.timer = 0; } };

  /* The review schedule, only with "Count toward review": a mastered card is rated once, the way Study rates it
     (Good if it was never missed in this session, Hard if it was). */
  function review(deckId, cardId, rating){
    const cur = state.decks[deckId]; if (!cur) return;
    const d = clone(cur), c = d.cards.find(x => x.id === cardId); if (!c) return;
    const shown = (() => { try { return rateDues(d, c)[rating]; } catch (e) { return null; } })();
    const sm = window.SBPRO && SBPRO.cardRated ? SBPRO.cardRated(d, c, rating) : null;
    c.box = boxAfter(c, rating);
    c.seen = (Number(c.seen) || 0) + 1; c.last = todayISO(); c.rate = rating; c.right = (Number(c.right) || 0) + 1;
    c.due = nextDue(c.box, rating);
    if (sm) { c.box = sm.box; c.due = sm.due; }
    if (shown && shown.spread) c.due = shown.due;
    d.updated = Date.now();
    saveDeck(d, null);
    fire("fc-rated", {rating, deckId, cardId, from: "learn"});
    earnBump("c"); markReviewDay();
  }
  /* The daily goal (01-study-rewards.js): a card counts once, when it's mastered, the same as rating it once in Study.
     Not every answer: a card takes two or more answers here, and quick picks would fill the goal without the recall it
     stands for. With "Count toward review" ticked, the rating above counts it (through fc-rated), so it isn't counted twice. */
  function mastered(id){
    if (R.S.count) review(R.deckId, id, LEARN.rateFor(R.S.items[id]));
    else if (typeof goalBump === "function") goalBump(1);
  }

  /* Pieces */
  function barHtml(S){
    const k = LEARN.counts(S), t = Math.max(1, k.total), pc = n => (n / t * 100).toFixed(2) + "%";
    return `<div class="lr-prog"><div class="lr-bar" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="${k.total}" aria-valuenow="${k.mastered}" aria-valuetext="${k.mastered} of ${k.total} mastered, ${k.familiar} familiar, ${k.fresh} new"><i class="lr-m" style="width:${pc(k.mastered)}"></i><i class="lr-f" style="width:${pc(k.familiar)}"></i></div>
      <div class="lr-legend" aria-hidden="true"><span class="lr-k k-n">New <b>${k.fresh}</b></span><span class="lr-k k-f">Familiar <b>${k.familiar}</b></span><span class="lr-k k-m">Mastered <b>${k.mastered}</b></span></div></div>`;
  }
  const frontOf = c => c.img && !LEARN.norm(c.front) ? "Picture card" : c.front;
  const promptHtml = c => c.img ? `<div class="lr-pic">${SBPRO.cardFace(c, false)}</div>${LEARN.norm(c.front) ? `<div class="lr-prompt lr-sm rt">${esc(c.front)}</div>` : ""}` : `<div class="lr-prompt rt">${esc(c.front)}</div>`;
  const sheet = (kind, body, foot, extra) => `<div class="sheet lr-sheet${still() ? " lr-still" : ""}" data-lrn="${kind}"${extra || ""}>${head("Learn")}<div class="sheet-body">${body}<p class="sr" id="lrSay" aria-live="polite"></p></div><div class="sheet-foot">${foot}</div></div>`;
  const nameBar = d => `<div class="lr-name"><span>${esc(d.name || "Deck")}</span>${R && R.S.round ? `<span class="mini">Round ${R.S.round.n}</span>` : ""}</div>`;
  const lvPill = lv => lv >= LEARN.MASTERED ? `<span class="lr-lv m">Mastered</span>` : lv === LEARN.FAMILIAR ? `<span class="lr-lv f">Familiar</span>` : `<span class="lr-lv n">New</span>`;

  /* The first screen: how it works, Count toward review, and picking up a session left half way */
  function intro(id){
    const d = state.decks[id]; if (!d) return;
    stopTimer();
    const S = load(id), n = usableN(d), mins = Math.max(1, Math.round(n * 2 * 8 / 60));
    if (S) LEARN.sync(S, cardsOf(d));
    const k = S ? LEARN.counts(S) : null, note = leftOut(d);
    R = null;
    openSheet(sheet("intro", `<div class="lr-name"><span>${esc(d.name || "Deck")}</span><span class="mini">${pl(n, "card")} · about ${mins} min</span></div>
      ${S ? `<div class="lr-resume" role="status"><b>Pick up where you left off</b><span class="mini">${k.mastered} of ${k.total} mastered so far. Saved on this device.</span>${barHtml(S)}</div>`
        : `<ol class="lr-how"><li><span><b>Pick</b> the answer from four.</span></li><li><span><b>Type</b> it from memory the next time.</span></li><li><span><b>Misses</b> come back until you know every card.</span></li></ol>`}
      <label class="lr-count"><input type="checkbox" id="lrCount"${(S ? S.count : !!(state.settings && state.settings.learnCount)) ? " checked" : ""}><span><b>Count toward review</b><span class="mini">Cards you master here also move along your review schedule. Left off, your reviews stay as they are.</span></span></label>
      ${note ? `<p class="mini lr-note">${esc(note)}</p>` : ""}`,
      `${S ? `<button type="button" class="btn" data-act="lrn-over" data-id="${esc(id)}">Start Over</button>` : `<button type="button" class="btn" data-act="close">Cancel</button>`}<span class="spacer"></span><button type="button" class="btn primary" data-act="lrn-go" data-id="${esc(id)}" autofocus>${S ? "Continue" : "Start"}</button>`));
  }
  function go(id, fresh){
    const d = state.decks[id]; if (!d) return;
    const box = $("#lrCount"), count = box ? box.checked : !!(state.settings && state.settings.learnCount);
    // the choice is remembered for next time
    if (!!(state.settings && state.settings.learnCount) !== count) { state.settings = Object.assign({}, state.settings, {learnCount: count}); saveSettings(); }
    let S = fresh ? null : load(id);
    if (S) { LEARN.sync(S, cardsOf(d)); S.count = count; }
    else S = LEARN.create(cardsOf(d), {deckId: id, count});
    if (!S.order.length) { toast("Learn needs cards with text on both sides. Add a few more first."); return; }
    stopTimer();
    R = {deckId: id, S, t0: 0, timer: 0};
    if (!S.round) LEARN.startRound(S);
    save(); draw();
  }

  /* Each screen */
  function draw(){
    if (!R) return;
    const d = state.decks[R.deckId]; if (!d) { if (dlg.open) dlg.close(); return; }
    const S = R.S, byId = byIdOf(d);
    LEARN.sync(S, cardsOf(d));
    if (LEARN.done(S) && !S.fb) { finish(d); return; }
    if (S.fb) { feedback(d, byId); return; }
    if (LEARN.roundOver(S)) { checkpoint(d, byId); return; }
    const q = LEARN.question(S, byId); save();
    if (!q) { LEARN.startRound(S); draw(); return; }
    const c = byId[q.id];
    R.t0 = Date.now();
    const kick = q.type === "type" ? "Type the answer" : q.type === "free" ? "Check yourself" : "Pick the answer";
    let body = `${nameBar(d)}${barHtml(S)}<div class="lr-card" id="lrQ" tabindex="-1"><span class="lr-kick">${kick}${lvPill(q.lv)}</span>${promptHtml(c)}</div>`, foot;
    if (q.type === "mc") {
      body += `<div class="lr-opts" role="group" aria-label="Choose the answer">${q.opts.map((o, i) => `<button type="button" class="lr-opt" data-act="lrn-pick" data-id="${i}" aria-keyshortcuts="${i + 1}"><span class="lr-n" aria-hidden="true">${i + 1}</span><span class="lr-ot rt">${esc(o.text)}</span></button>`).join("")}</div>`;
      foot = `<span class="mini kbd-only">Press 1 to ${q.opts.length} to pick</span><span class="spacer"></span><button type="button" class="btn" data-act="lrn-dunno">Don't Know</button>`;
    } else if (q.type === "type") {
      body += `<div class="lr-type"><label class="sr" for="lrIn">Your answer</label><input type="text" id="lrIn" class="lr-in" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" maxlength="500" placeholder="Type the answer"></div>`;
      foot = `<span class="mini kbd-only">Enter to check</span><span class="spacer"></span><button type="button" class="btn" data-act="lrn-dunno">Don't Know</button><button type="button" class="btn primary" data-act="lrn-submit">Check</button>`;
    } else {
      body += `<div class="lr-ans"><span class="mini">Answer</span><div class="lr-prompt rt">${esc(c.back)}</div></div>`;
      foot = `<span class="spacer"></span><button type="button" class="btn primary" data-act="lrn-free">Got It</button>`;
    }
    openSheet(sheet("q", body, foot, ` data-lr-type="${q.type}"`));
    sayIt(`${q.type === "type" ? "Type the answer" : q.type === "mc" ? `Pick from ${q.opts.length}` : "Check yourself"}: ${speak(frontOf(c))}`);
    const inp = $("#lrIn");
    if (inp) inp.focus(); else if (wide()) { const qq = $("#lrQ"); if (qq) qq.focus({preventScroll: true}); }
  }
  function answer(given){
    if (!R || R.S.fb || !R.S.cur) return;
    const d = state.decks[R.deckId]; if (!d) return;
    if (R.t0) { R.S.ms += Math.min(CAP_MS, Date.now() - R.t0); R.t0 = 0; }
    const fb = LEARN.answer(R.S, byIdOf(d), given); if (!fb) return;
    if (fb.mastered) mastered(fb.id);
    save();
    sbHaptic(fb.ok ? "tap" : "error");
    draw();
  }
  const ICON_OK = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
  const ICON_NO = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M12 7v6M12 17h.01"/></svg>`;
  function feedback(d, byId){
    const S = R.S, fb = S.fb, c = byId[fb.id];
    if (!c) { LEARN.next(S); draw(); return; }
    const ans = `<span class="lr-a rt">${esc(c.back)}</span>`;
    let msg, say;
    if (fb.ok) {
      msg = `<b>${fb.over ? "Counted as right." : "Right."}</b>${fb.close ? ` <span>Watch the spelling: ${ans}</span>` : ""}`;
      msg += fb.mastered ? ` ${lvPill(LEARN.MASTERED)}` : fb.to === LEARN.FAMILIAR && LEARN.typeFor(c, 1) === "type" ? `<span class="mini">Next time you'll type it.</span>` : "";
      say = (fb.over ? "Counted as right." : fb.close ? `Right. Watch the spelling: ${speak(c.back)}.` : "Right.") + (fb.mastered ? " Mastered." : "");
    } else {
      msg = `<b>${fb.skip ? "The answer:" : "Not quite. The answer:"}</b> ${ans}`;
      say = `${fb.skip ? "" : "Not quite. "}The answer: ${speak(c.back)}.${fb.type === "type" && !fb.skip ? " If you meant the same thing, choose I Was Right." : ""}`;
    }
    let body = `${nameBar(d)}${barHtml(S)}<div class="lr-card"><span class="lr-kick">${fb.type === "type" ? "Type the answer" : "Pick the answer"}</span>${promptHtml(c)}</div>`;
    if (fb.type === "mc" && fb.opts) body += `<div class="lr-opts is-done" role="list" aria-label="Answers">${fb.opts.map((o, i) => { const st = i === fb.right ? " ok" : i === fb.pick ? " no" : " dim"; return `<div role="listitem" class="lr-opt${st}"><span class="lr-n" aria-hidden="true">${i === fb.right ? "✓" : i === fb.pick ? "✕" : i + 1}</span><span class="lr-ot rt">${esc(o.text)}</span>${i === fb.right ? `<span class="sr"> (right answer)</span>` : i === fb.pick ? `<span class="sr"> (your pick)</span>` : ""}</div>`; }).join("")}</div>`;
    if (fb.type === "type" && !fb.skip && fb.text) body += `<div class="lr-given${fb.ok ? " ok" : " no"}"><span class="mini">You wrote</span><span class="lr-gt">${esc(fb.text)}</span></div>`;
    body += `<div class="lr-fb ${fb.ok ? "ok" : "no"}"><span class="lr-fbi" aria-hidden="true">${fb.ok ? ICON_OK : ICON_NO}</span><div class="lr-fbt">${msg}${!fb.ok ? `<span class="mini">It comes back later in this round.</span>` : ""}</div></div>`;
    const foot = `<span class="spacer"></span>${!fb.ok && fb.type === "type" && !fb.skip ? `<button type="button" class="btn" data-act="lrn-right" title="Your answer meant the same thing: count it as right">I Was Right</button>` : ""}<button type="button" class="btn primary" data-act="lrn-next" id="lrNext">Continue</button>`;
    openSheet(sheet("fb", body, foot, ` data-lr-ok="${fb.ok ? 1 : 0}"`));
    sayIt(say);
    const nx = $("#lrNext"); if (nx) nx.focus({preventScroll: true});
    stopTimer();
    // a right answer moves on by itself after a moment (Continue or Enter is quicker); a miss waits, so it can be read
    if (fb.ok && api.auto) R.timer = setTimeout(() => { if (R && R.S.fb === fb && dlg.open && dlg.querySelector('[data-lrn="fb"]')) next(); }, RIGHT_MS);
  }
  function next(){ if (!R) return; stopTimer(); LEARN.next(R.S); save(); draw(); }
  function wasRight(){ if (!R) return; stopTimer(); const fb = LEARN.override(R.S); if (!fb) return; if (fb.mastered) mastered(fb.id); save(); draw(); }
  // Between rounds: how this round went
  function checkpoint(d, byId){
    const S = R.S, k = LEARN.counts(S), ids = (S.round && S.round.ids || []).filter(id => byId[id]), left = k.total - k.mastered;
    openSheet(sheet("round", `${nameBar(d)}${barHtml(S)}<div class="lr-round" role="status"><b>Round ${S.round ? S.round.n : 1} done</b><span class="mini">${k.mastered} of ${k.total} mastered. ${left === 1 ? "One card to go." : `${left} cards to go.`}</span></div>
      <ul class="lr-list">${ids.map(id => `<li><span class="lr-lf rt">${esc(frontOf(byId[id]))}</span>${lvPill(S.items[id].lv)}</li>`).join("")}</ul>`,
      `<span class="spacer"></span><button type="button" class="btn primary" data-act="lrn-round" id="lrNext">Next Round</button>`));
    sayIt(`Round ${S.round ? S.round.n : 1} done. ${k.mastered} of ${k.total} mastered.`);
    const nx = $("#lrNext"); if (nx) nx.focus({preventScroll: true});
  }
  function nextRound(){ if (!R) return; LEARN.startRound(R.S); save(); draw(); }
  function finish(d){
    const S = R.S, sm = LEARN.summary(S), byId = byIdOf(d), m = Math.round(sm.ms / 60000);
    drop(R.deckId);
    const miss = sm.missed.filter(id => byId[id]).slice(0, 3);
    if (!R.cheered) { R.cheered = true; sbHaptic("success", {force: true}); try { if (window.SBSFX) SBSFX.play("reward", {level: 2}); } catch (e) {} if (sm.total >= 10) fire("good-moment", "learn"); }
    openSheet(sheet("done", `<div class="lr-done" role="status"><span class="lr-done-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>
        <b class="lr-done-t">You know all ${pl(sm.total, "card")}</b><span class="mini">${esc(d.name || "Deck")}</span></div>
      <div class="lr-tiles"><div class="lr-tile"><b>${sm.first}/${sm.total}</b><span>right first time</span></div><div class="lr-tile"><b>${sm.answers}</b><span>answers</span></div><div class="lr-tile"><b>${m < 1 ? "&lt;1" : m}</b><span>${m > 1 ? "minutes" : "minute"}</span></div></div>
      ${miss.length ? `<div class="lr-miss"><span class="mini">Took a few tries</span><ul class="lr-list">${miss.map(id => `<li><span class="lr-lf rt">${esc(frontOf(byId[id]))}</span><span class="lr-lb rt">${esc(byId[id].back)}</span></li>`).join("")}</ul></div>` : ""}
      <p class="mini lr-sched">${S.count ? `Counted toward review: ${pl(sm.total, "card")} moved along your review schedule.` : "Your review schedule wasn't changed. Tick Count toward review next time to move these cards along it."}</p>`,
      `<span class="spacer"></span><button type="button" class="btn" data-act="lrn-again">Learn Again</button><button type="button" class="btn primary" data-act="close" id="lrDone">Done</button>`));
    sayIt(`Done. You know all ${pl(sm.total, "card")}. ${sm.first} of ${sm.total} right first time.`);
    const b = $("#lrDone"); if (b && wide()) b.focus({preventScroll: true});
  }
  function submit(){ const i = $("#lrIn"); if (!i) return; if (!i.value.trim()) { i.focus(); sayIt("Type an answer first, or choose Don't Know."); return; } answer({text: i.value}); }

  /* Keys: 1 to 4 pick, Enter checks a typed answer or continues, Esc closes (the session is kept) */
  dlg.addEventListener("keydown", e => {
    const sh = dlg.querySelector(".lr-sheet[data-lrn]"); if (!sh || !R || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    const kind = sh.dataset.lrn, inInput = e.target.matches && e.target.matches("input,textarea");
    if (kind === "q" && sh.dataset.lrType === "mc" && !inInput && /^[1-9]$/.test(e.key)) {
      const b = sh.querySelector(`.lr-opt[data-id="${Number(e.key) - 1}"]`); if (b) { e.preventDefault(); answer({pick: Number(e.key) - 1}); }
      return;
    }
    if (e.key !== "Enter" || e.repeat) return;
    if (kind === "q" && e.target.id === "lrIn") { e.preventDefault(); submit(); return; }
    if (e.target.closest && e.target.closest("button,a,input,select,textarea")) return;
    if (kind === "fb") { e.preventDefault(); next(); } else if (kind === "round") { e.preventDefault(); nextRound(); }
  });
  dlg.addEventListener("close", () => {
    if (dlg.open || !R) return;
    stopTimer();
    if (R.t0) { R.S.ms += Math.min(CAP_MS, Date.now() - R.t0); R.t0 = 0; }
    if (!LEARN.done(R.S)) save();
    R = null;
    // the deck page's Learn button shows a session in progress
    if (ui.tab === "flashcards") render();
  });

  hook("act", (act, el, id) => {
    if (!/^lrn-/.test(act)) return false;
    if (act === "lrn-start") { if (state.decks[id]) intro(id); return true; }
    if (act === "lrn-go") { go(id); return true; }
    if (act === "lrn-over") { drop(id); go(id, true); return true; }
    if (!R) return true;
    if (act === "lrn-pick") answer({pick: Number(id)});
    else if (act === "lrn-dunno") answer({skip: true});
    else if (act === "lrn-submit") submit();
    else if (act === "lrn-free") answer({});
    else if (act === "lrn-next") next();
    else if (act === "lrn-right") wasRight();
    else if (act === "lrn-round") nextRound();
    else if (act === "lrn-again") {
      const dId = R.deckId, count = R.S.count, d = state.decks[dId]; drop(dId);
      if (!d) return true;
      R = {deckId: dId, S: LEARN.create(cardsOf(d), {deckId: dId, count}), t0: 0, timer: 0}; LEARN.startRound(R.S); save(); draw();
    }
    return true;
  });
  // The Learn button on a deck page, beside Study: only on a deck with 4 or more cards it can ask
  function deckBtn(d){
    if (!d || usableN(d) < LEARN.MIN) return "";
    const S = load(d.id), k = S ? LEARN.counts(S) : null;
    return `<button class="btn lr-btn" data-act="lrn-start" data-id="${esc(d.id)}" title="${k ? `Pick up where you left off: ${k.mastered} of ${k.total} mastered` : "Learn the cards in short rounds: pick the answer, then type it"}">Learn${k ? `<span class="sr"> (in progress)</span><span class="lr-dot" aria-hidden="true"></span>` : ""}</button>`;
  }
  const api = {deckBtn, start: intro, LEARN, auto: true};
  window.SBLEARN = api;
  // test handle, like __sbMatch
  window.__sbLearn = {state: () => state, ui, render, session: () => R, LEARN, api, key: KEY};
})();
