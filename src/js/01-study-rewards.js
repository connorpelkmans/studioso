/* ===== module: 01-study-rewards.js: studying that feels rewarding, without the annoying parts ===== */
/* What the Gizmo study (reports/, LAUNCH-STATS.md's neighbour) found worth copying, done Studyboard's way:
   1. Mochi's Hint: a nudge about the idea before you answer or rate, never the answer itself, in two steps (Hint, Another Hint).
      Using it costs nothing and changes nothing. How hints are made: see "Hints are about the idea" below.
   2. Why a card is back ("You missed this yesterday") and an "in a row" chip from 3 known cards on.
   3. A daily goal you choose (Tiny 5, Steady 20, Strong 50, Exam Week 100): card ratings and quiz answers count, any rating,
      so honest ratings never cost anything. Reaching it is a quiet celebration.
   4. A rewarding end to a study session: a ring of what you knew, cards newly mastered, your best run, today's goal and Mochi's
      next accessory.
   5. AI quiz questions you missed become flashcards in that deck (with Undo), so a quiz always ends with a next step.
   Never here: hearts or lives, lockouts, cooldowns, speed scoring, anything bought. */

/* ---------- 3. The daily goal ---------- */
const GOALS = [["tiny", 5, "Tiny", "For busy days. About 2 minutes."], ["steady", 20, "Steady", "Most students. About 8 minutes."],
  ["strong", 50, "Strong", "About 20 minutes."], ["exam", 100, "Exam Week", "Goes back to Steady after your next exam."]];
function goalCfg(){
  const s = state.settings && state.settings.goal, k = s && GOALS.some(g => g[0] === s.k) ? s.k : "steady";
  // Exam Week turns itself back to Steady the day after the exam it was set for
  if (k === "exam" && s.until && s.until < todayISO()) return GOALS[1];
  return GOALS.find(g => g[0] === k);
}
const goalToday = () => { const g = state.settings && state.settings.goalDay; return g && g.d === todayISO() ? Math.max(0, Number(g.n) || 0) : 0; };
function goalBump(n){
  const was = goalToday(), now = Math.max(0, was + (n || 1)), target = goalCfg()[1];
  state.settings = Object.assign({}, state.settings, {goalDay: {d: todayISO(), n: now}});
  saveSettings();
  if (was < target && now >= target) setTimeout(() => {
    toast(`Daily goal reached: ${target} today. Nice work.`);
    try { celebrate("check"); } catch (e) {}
    fire("good-moment", "goal");
  }, 350);
}
function goalRing(size){
  const t = goalCfg()[1], n = goalToday(), r = size / 2 - 5, C = 2 * Math.PI * r, p = Math.min(1, n / t);
  return `<svg class="goal-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="5" class="gr-track"></circle>${p > 0 ? `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="5" stroke-linecap="round" class="gr-fill" stroke-dasharray="${(C * p).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"></circle>` : ""}</svg>`;
}
function goalRingHtml(){
  const t = goalCfg()[1], n = goalToday(), done = n >= t;
  return `<button type="button" class="goal-btn${done ? " done" : ""}" data-act="goal-open" aria-label="Daily goal: ${Math.min(n, t)} of ${t} today. Change goal">${goalRing(40)}<span class="goal-t"><b>${Math.min(n, t)} / ${t}</b><span>${done ? "goal done" : "today"}</span></span></button>`;
}
function dailyGoalSheet(){
  const cur = goalCfg()[0];
  openSheet(`<form class="sheet goal-sheet">${head("Your Daily Goal")}<div class="sheet-body">
    <p class="mini" style="margin:0 0 4px">Flashcards you rate and quiz questions you answer. Every rating counts, so rate honestly.</p>
    <div class="goal-opts" role="radiogroup" aria-label="Daily goal">${GOALS.map(g => `<button type="button" role="radio" class="goal-opt" data-act="goal-pick" data-id="${g[0]}" aria-checked="${g[0] === cur}"><span><b>${esc(g[2])}</b><span class="mini">${esc(g[3])}</span></span><b class="goal-n">${g[1]}</b></button>`).join("")}</div>
    <p class="mini" style="margin:6px 0 0">Today: ${goalToday()} so far.</p>
  </div></form>`);
}
function goalPick(k){
  const nextExam = tasksArr().filter(t => t.status !== "done" && t.due && t.due >= todayISO() && (window.SBEXAM ? SBEXAM.EXAMMODE.isExam(t) : /^(Exam|Quiz)$/.test(t.type))).map(t => t.due).sort()[0];
  state.settings = Object.assign({}, state.settings, {goal: k === "exam" ? {k, until: nextExam || addDays(todayISO(), 7)} : {k}});
  saveSettings(); if (dlg.open) dlg.close(); render();
  toast(`Daily goal: ${goalCfg()[1]} a day`);
}
hook("fc-rated", () => goalBump(1));
hook("fc-unrated", () => goalBump(-1));

/* ---------- 1. Mochi's Hint ---------- */
const buddyName = () => { try { const n = window.SBCOMP && typeof SBCOMP.aiName === "function" ? SBCOMP.aiName() : ""; return typeof n === "string" && n ? n : "Mochi"; } catch (e) { return "Mochi"; } };
const BUDDY_SPROUT = `<svg viewBox="0 0 64 60" aria-hidden="true"><path d="M32 9c-2-5-7-7-11-5 3 1 6 3 8 6M32 9c2-5 7-7 11-5-3 1-6 3-8 6" fill="#3BB27E" stroke="#2A8C61" stroke-width="1.2"/><ellipse cx="32" cy="36" rx="25" ry="21" fill="#fff" stroke="#C9D3E1" stroke-width="2"/><circle cx="25" cy="33" r="2.6" fill="#0F1F3D"/><circle cx="39" cy="33" r="2.6" fill="#0F1F3D"/><ellipse cx="18" cy="40" rx="4" ry="2.6" fill="#F7B6C2"/><ellipse cx="46" cy="40" rx="4" ry="2.6" fill="#F7B6C2"/><path d="M28 41q4 4 8 0" fill="none" stroke="#0F1F3D" stroke-width="2" stroke-linecap="round"/></svg>`;
function buddyFace(){
  try { const h = window.SBCOMP && SBCOMP.head ? SBCOMP.head() : ""; if (h) return h; } catch (e) {}
  return BUDDY_SPROUT;
}
/* Hints are about the idea, never the answer: what it does, what it's part of, how it connects to the rest of the topic.
   Two steps: a light nudge, then "Another Hint" that narrows it down further, still without saying it. In order of preference:
   a hint written when the AI made the card or question, the companion's AI (with the course, the deck and neighbouring cards for
   context), then a clue from the card's own material (its rationale or saved explanation) with the answer's words blanked out.
   Only when there's nothing at all to go on: the first letters, with a pointer to turning on AI. */
const HINT_SCHEMA = {type: "OBJECT", properties: {
  hint: {type: "STRING", description: "A light nudge about the idea, under 22 words"},
  hint2: {type: "STRING", description: "A stronger nudge that narrows it down, under 26 words, still without the answer"}}, required: ["hint", "hint2"]};
const hintWords = answer => String(answer || "").toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 4);
// a hint that says the answer, or any of its key words (or their start, as in "mitochondri…"), is no hint
function hintLeaks(hint, answer){
  const h = " " + String(hint || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ") + " ";
  return hintWords(answer).some(w => { const stem = w.length > 6 ? w.slice(0, Math.max(5, w.length - 3)) : w; return h.includes(" " + stem); });
}
// a sentence from the material with the answer's words blanked out, when enough of it is left to be useful
function maskedClue(text, answer){
  const t = String(text || "").replace(/\s+/g, " ").trim(); if (!t) return "";
  const keys = hintWords(answer).map(w => w.length > 6 ? w.slice(0, Math.max(5, w.length - 3)) : w); if (!keys.length) return "";
  const sent = t.split(/(?<=[.!?])\s+/).filter(x => x.split(" ").length >= 5)[0] || t;
  let hidden = 0;
  const out = sent.split(" ").map(w => { const k = w.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ""); if (k && keys.some(x => k.startsWith(x))) { hidden++; return w.replace(/[\p{L}\p{N}]+/gu, "___"); } return w; });
  const words = out.length;
  if (!hidden || words < 6 || hidden / words > 0.3 || words > 40) return "";
  return out.join(" ");
}
// the last resort: first letters ("M___________")
function lettersHint(answer){
  const words = String(answer || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (!words.length || words.length > 8) return "";
  return "Starts like: " + words.map(w => w.replace(/^([^\p{L}\p{N}]*)([\p{L}\p{N}])([\p{L}\p{N}]*)(.*)$/u, (m, a, b, rest, z) => a + b + "_".repeat(rest.length) + z)).join(" ");
}
const HINT_RULES = `Write two hints that help the student recall the answer by thinking about the idea: what it does, what it's part of, how it works, what it's connected to in this course, or a vivid comparison. Hint 1 is light: it points them at the right area of the topic. Hint 2 narrows it down with one more specific clue (a key property, where it happens, what it's for), still without giving it away. Never state the answer, its key words, a synonym, a translation or an abbreviation of it. Never give its first letter, its length, a rhyme or a fill-in-the-blank of it. Never say which options are wrong. Warm and plain, like a study buddy. Return JSON only.`;
async function aiHints(prompt, answer, ctx){
  const ask = async extra => {
    const r = await aiCall({task: "hint", fast: true, maxTokens: 600, temperature: 0.5, schema: HINT_SCHEMA,
      parts: [{text: `${ctx ? ctx + "\n" : ""}Question or card front: ${prompt}\nThe answer (never say it, or any of its key words): ${answer}${extra || ""}`}],
      system: `You are ${buddyName()}, a friendly study companion. ${HINT_RULES}`});
    return [r.data && r.data.hint, r.data && r.data.hint2].map(x => String(x || "").trim()).filter(x => x && !hintLeaks(x, answer));
  };
  let list = await ask();
  // both gave it away: one more try, told what went wrong
  if (!list.length) list = await ask("\nYour last hints used words from the answer. Describe the idea around it instead.");
  return list.slice(0, 2);
}
// What a deck is about, for the AI: the course, the deck and a few neighbouring cards (fronts only)
function hintContext(d, c){
  const co = courseOf(d.courseId), near = d.cards.filter(x => x.id !== c.id && x.front && !x.img).slice(0, 40), k = d.cards.indexOf(c);
  const pick = near.slice(Math.max(0, k - 3), Math.max(0, k - 3) + 6).map(x => "- " + String(x.front).slice(0, 120));
  return [co ? `Course: ${co.name}` : "", `Deck: ${d.name}`, pick.length ? "Other cards in this deck:\n" + pick.join("\n") : ""].filter(Boolean).join("\n");
}
// The hints a card can give without asking anyone: kept ones, then its own material
function cardHintsLocal(c){
  const out = [];
  if (Array.isArray(c.hints)) out.push(...c.hints.filter(Boolean)); else if (typeof c.hint === "string" && c.hint) out.push(c.hint);
  if (out.length < 2 && c.explain) { const ex = c.explain; [ex.memoryTip, ex.analogy, ex.explanation].forEach(t => { const m = maskedClue(t, c.back); if (m && out.length < 2 && !out.includes(m)) out.push(m); }); }
  return out.filter(x => !hintLeaks(x, c.back)).slice(0, 2);
}
// Flashcards: Hint (and Another Hint) before the answer shows
async function fcHint(){
  const f = ui.fc, it = f && f.q[f.i]; if (!it || f.flipped) return;
  const d = state.decks[it.deckId], c = d && d.cards.find(x => x.id === it.cardId); if (!c) return;
  f.hints = f.hints || {};
  const h = f.hints[c.id];
  if (h && !h.busy) { if (h.at + 1 < h.list.length) { h.at++; render(); } return; }
  f.hinted = (f.hinted || 0) + 1;
  const local = cardHintsLocal(c);
  if (local.length >= 2 || ((!aiReady() || c.img) && local.length)) { f.hints[c.id] = {list: local, at: 0}; render(); return; }
  if (!aiReady() || c.img) { const l = lettersHint(c.back); f.hints[c.id] = {list: [l || "Think about where this came up in your notes and what it was next to."], at: 0, plain: true}; render(); return; }
  f.hints[c.id] = {busy: true, list: [], at: 0}; render();
  let list = [];
  try { list = await aiHints(c.front, c.back, hintContext(d, c)); } catch (e) { console.warn("hint", e); }
  list = local.concat(list.filter(x => !local.includes(x))).slice(0, 2);
  if (!list.length) { const l = lettersHint(c.back); f.hints[c.id] = {list: [l || "Think about where this came up in your notes."], at: 0, plain: true}; render(); return; }
  f.hints[c.id] = {list, at: 0};
  // kept on the card, so next time they're instant, free and work offline
  const nd = clone(state.decks[d.id]), k = nd && nd.cards.find(x => x.id === c.id);
  if (k) { k.hints = list; delete k.hint; saveDeck(nd, null); } else render();
}
function hintBubbleHtml(h, act){
  const name = buddyName();
  if (h.busy) return `<p class="fc-bubble" role="status"><span class="ai-spin" aria-hidden="true"></span> ${esc(name)} is thinking…</p>`;
  const more = h.at + 1 < h.list.length;
  return `<div class="fc-bubble" role="status"><span class="fc-hint-step">${h.list.length > 1 ? `Hint ${h.at + 1} of ${h.list.length}` : "Hint"}</span><p>${esc(h.list[h.at])}</p>${more ? `<button type="button" class="link-btn fc-hint-more" data-act="${act}">Another Hint</button>` : ""}${h.plain ? `<button type="button" class="link-btn fc-hint-more" data-act="ai-setup">Turn on AI for hints about the idea</button>` : ""}</div>`;
}
function fcBuddyHtml(d, c, f, key){
  const name = buddyName(), face = `<span class="fc-buddy-face" aria-hidden="true">${buddyFace()}</span>`;
  if (!f.flipped) {
    const h = (f.hints || {})[c.id];
    if (h) return `<div class="fc-buddy has-tip">${face}${hintBubbleHtml(h, "fc-hint")}</div>`;
    return `<div class="fc-buddy">${face}<button type="button" class="btn small fc-hint-btn" data-act="fc-hint" title="${esc(name)} gives a nudge, not the answer (H)" aria-keyshortcuts="H">Hint</button></div>`;
  }
  // after the answer: the explanation, before you rate (AI set up: Explain; not yet: a way to set it up)
  const ex = explainHtml(key);
  return `<div class="fc-buddy fc-buddy-after">${face}${ex || `<div class="explain-row"><button type="button" class="btn small ai-btn" data-act="ai-setup">${AI_ICON} Explain This</button><span class="mini">Turn on AI to have ${esc(name)} explain it</span></div>`}</div>`;
}

/* ---------- 2. Why it's here, and a run of known cards ---------- */
function missWhen(day){
  const n = dayDiff(day, todayISO());
  if (n <= 0) return "earlier today"; if (n === 1) return "yesterday";
  if (n < 7) return "on " + parse(day).toLocaleDateString(undefined, {weekday: "long"});
  return "on " + fmtShort(day);
}
function fcChipsHtml(c, f){
  const out = [];
  if (!c.seen) out.push(`<span class="fc-chip">New card</span>`);
  else if (c.rate === "again" && c.last) out.push(`<span class="fc-chip">You missed this ${esc(missWhen(c.last))}</span>`);
  else if (c.rate === "hard" && c.last) out.push(`<span class="fc-chip">You found this hard ${esc(missWhen(c.last))}</span>`);
  if ((f.run || 0) >= 3) out.push(`<span class="fc-chip run"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>${f.run} in a row</span>`);
  return out.length ? `<div class="fc-chips">${out.join("")}</div>` : "";
}

/* ---------- 4. The end of a study session ---------- */
const masteredIn = ids => ids.reduce((s, id) => { const d = state.decks[id]; return s + (d ? d.cards.filter(c => !c.draft && c.box >= 4).length : 0); }, 0);
function studyDoneHtml(f, cards, total, again){
  const missed = Object.keys(f.missed || {}).length, known = Math.max(0, cards - missed), pct = cards ? known / cards : 0;
  const R = 84, C = 2 * Math.PI * R, gain = Math.max(0, masteredIn(f.deckIds || []) - (f.m0 || 0));
  const t = goalCfg()[1], g = goalToday();
  let next = null; try { next = window.SBCOMP && SBCOMP.nextFor ? SBCOMP.nextFor("cards") : null; } catch (e) {}
  return `<section class="done-card sd">
      <div class="sd-ring"><svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label="${known} of ${cards} known">
        <circle cx="100" cy="100" r="${R}" fill="none" stroke-width="14" class="gr-track"></circle>
        ${known ? `<circle cx="100" cy="100" r="${R}" fill="none" stroke-width="14" stroke-linecap="round" class="gr-fill" stroke-dasharray="${(C * pct).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 100 100)"></circle>` : ""}</svg>
        <span class="sd-ring-t"><b>${known}</b><span>of ${cards} known</span></span></div>
      <div class="sd-tiles">
        <div class="sd-tile${gain ? " gold" : ""}"><b>${gain ? "+" + gain : "0"}</b><span>newly mastered</span></div>
        <div class="sd-tile"><b>${f.best || 0}</b><span>best run</span></div>
        <div class="sd-tile"><b>${Math.min(g, t)}/${t}</b><span>${g >= t ? "goal done" : "today's goal"}</span></div>
      </div>
      ${next ? `<div class="sd-next"><div class="sd-next-t"><b>${esc(buddyName())}'s ${esc(next.name)}</b><span class="mini">${next.left === 0 ? "Ready to wear" : `${next.left} card${next.left === 1 ? "" : "s"} to go`}</span></div><div class="sd-bar"><i style="width:${Math.round(next.v / next.n * 100)}%"></i></div></div>` : ""}
      ${again ? `<p class="mini">${total} reviews in all: ${again} ${again === 1 ? "was a card" : "were cards"} you missed and saw again.</p>` : ""}
      <p class="mini">Cards you knew come back in a few days. Cards marked Again come back today.${f.hinted ? ` You used ${f.hinted} hint${f.hinted === 1 ? "" : "s"}.` : ""}</p>
      ${keepSafeHtml()}
      <div class="row-actions"><button class="btn primary" data-act="fc-quiz-from-study">Take a Quiz</button><button class="btn" data-act="fc-study-again">Study Again</button>${undoBtn(f)}<button class="btn" data-act="fc-exit">Done</button></div>
    </section>`;
}

/* ---------- 5. Missed quiz questions become cards ---------- */
const quizAnswerText = x => x.type === "short" ? x.answer : x.type === "order" ? x.correct.map((ix, k) => `${k + 1}. ${x.options[ix]}`).join("; ") : x.correct.map(i => x.options[i]).join("; ");
function quizMissedToCards(f){
  const d = state.decks[f.deckId]; if (!d) return;
  const have = new Set(d.cards.map(c => c.fromQ).filter(Boolean));
  const add = f.qs.map((q, i) => ({q, a: f.ans[i]})).filter(y => !(y.a && y.a.correct) && !have.has(f.quizId + "|" + y.q.id) && String(y.q.stem || "").trim())
    .map(({q}) => ({id: uid(), front: String(q.stem).trim().slice(0, 2000), back: (quizAnswerText(q) + (q.rationale ? "\n\n" + q.rationale : "")).trim().slice(0, 4000), box: 0, due: "", seen: 0, right: 0, wrong: 0, fromQ: f.quizId + "|" + q.id}));
  if (!add.length) return;
  const nd = clone(d); nd.cards = nd.cards.concat(add); nd.updated = Date.now();
  f.added = {deckId: d.id, ids: add.map(c => c.id)};
  applyChanges([{kind: "deck", id: d.id, after: nd}], null);
}
function quizAddedHtml(f){
  const a = f.added, d = a && state.decks[a.deckId]; if (!d) return "";
  const n = a.ids.filter(id => d.cards.some(c => c.id === id)).length; if (!n) return "";
  return `<div class="qz-added" role="status"><span><b>${n} missed question${n === 1 ? " is" : "s are"} now ${n === 1 ? "a card" : "cards"}</b> in ${esc(d.name)}, ready to study.</span><button type="button" class="btn small" data-act="qz-added-undo">Undo</button></div>`;
}
function quizAddedUndo(){
  const f = ui.fc, a = f && f.added, d = a && state.decks[a.deckId]; if (!d) return;
  const nd = clone(d); nd.cards = nd.cards.filter(c => !a.ids.includes(c.id)); nd.updated = Date.now();
  f.added = null; applyChanges([{kind: "deck", id: d.id, after: nd}], null); toast("Took those cards back out");
}
// AI quizzes: a Hint before answering, from the question's own hint (written with the quiz), the AI, or its rationale
function quizHintsLocal(q){
  const ans = quizAnswerText(q), out = [];
  if (q.hint && !hintLeaks(q.hint, ans)) out.push(q.hint);
  if (Array.isArray(q.hints)) q.hints.forEach(x => { if (x && !out.includes(x) && !hintLeaks(x, ans)) out.push(x); });
  if (out.length < 2) { const m = maskedClue(q.rationale, ans); if (m && !out.includes(m)) out.push(m); }
  if (out.length < 2 && q.explain) { const m = maskedClue(q.explain.memoryTip || q.explain.explanation, ans); if (m && !out.includes(m)) out.push(m); }
  return out.slice(0, 2);
}
async function aiQuizHint(){
  const f = ui.fc, q = f && f.qs[f.i]; if (!q || f.ans[f.i]) return;
  f.qhint = f.qhint || {};
  const h = f.qhint[q.id];
  if (h && !h.busy) { if (h.at + 1 < h.list.length) { h.at++; render(); } return; }
  const local = quizHintsLocal(q), ans = quizAnswerText(q);
  if (local.length >= 2 || (!aiReady() && local.length)) { f.qhint[q.id] = {list: local, at: 0}; render(); return; }
  if (!aiReady()) { f.qhint[q.id] = {list: [q.topic ? `This one is about ${q.topic}. Think back to what your notes said about it.` : "Read the question again slowly: what is it really asking about?"], at: 0, plain: true}; render(); return; }
  f.qhint[q.id] = {busy: true, list: [], at: 0}; render();
  let list = [];
  const d = state.decks[f.deckId], co = d && courseOf(d.courseId);
  try { list = await aiHints(q.stem, ans, [co ? `Course: ${co.name}` : "", q.topic ? `Topic: ${q.topic}` : "", q.options && q.options.length ? "Options shown to the student (don't rule any out): " + q.options.join(" | ") : ""].filter(Boolean).join("\n")); } catch (e) { console.warn("hint", e); }
  list = local.concat(list.filter(x => !local.includes(x))).slice(0, 2);
  f.qhint[q.id] = list.length ? {list, at: 0} : {list: [q.topic ? `This one is about ${q.topic}.` : "Think about what the question is really asking."], at: 0, plain: true};
  // kept with the quiz, for the next attempt
  if (list.length && d) { const nd = clone(d), qz = (nd.aiQuizzes || []).find(x => x.id === f.quizId), o = qz && qz.questions.find(x => x.id === q.id); if (o) { o.hints = list; saveDeck(nd, null); return; } }
  render();
}
function aiQuizHintHtml(f, q){
  const h = (f.qhint || {})[q.id], name = buddyName(), face = `<span class="fc-buddy-face" aria-hidden="true">${buddyFace()}</span>`;
  if (h) return `<div class="fc-buddy has-tip">${face}${hintBubbleHtml(h, "qz-hint")}</div>`;
  return `<div class="fc-buddy">${face}<button type="button" class="btn small fc-hint-btn" data-act="qz-hint" title="${esc(name)} gives a nudge about the idea, not the answer">Hint</button></div>`;
}

/* ---------- 6. The first deck, before any account ---------- */
// The welcome's "Make Flashcards From My Notes": cards from the student's own material first; the semester setup waits on the
// Board ("Set Up Your Semester"), and an account is offered after the first session, as a way to keep the cards
function firstDeckSheet(){
  const tile = (act, ic, t, s) => `<button type="button" class="fd-tile" data-act="${act}"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic}</svg><b>${t}</b><span>${s}</span></button>`;
  openSheet(`<form class="sheet fd-sheet">${head("Make Your First Deck")}<div class="sheet-body">
    <div class="fd-hi"><span class="fc-buddy-face" aria-hidden="true">${buddyFace()}</span><p>What are you studying right now? Give ${esc(buddyName())} your notes and get flashcards in about a minute.</p></div>
    <div class="fd-grid">
      ${tile("fd-ai", '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', "Photo of Notes", "Handwriting or a whiteboard")}
      ${tile("fd-ai", '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>', "PDF or Slides", "Lecture slides, readings")}
      ${tile("fd-ai", '<rect x="3" y="6" width="18" height="12" rx="3"/><path d="M10 9.5v5l4-2.5z"/>', "YouTube or a Link", "A lecture video or article")}
      ${tile("fd-paste", '<path d="M5 6h14M5 11h14M5 16h9"/>', "Paste a List", "Term, then definition")}
    </div>
    <button type="button" class="fd-row" data-act="fd-import"><span><b>Bring Your Cards Over</b> from Quizlet, Knowt or Anki</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>
    <p class="mini" style="margin:4px 0 0">Free, no account needed. Studyboard says what's sent to the AI before anything is sent.</p>
  </div></form>`);
}
function firstDeckGo(sheet){
  // the planner setup steps aside (the Board keeps its Set Up Your Semester card); this was the student's choice
  try { localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:firstDeck", "1"); } catch (e) {}
  if (dlg.open) dlg.close();
  // the welcome's button goes straight to Flashcards; the website's switch pages also open Make Your First Deck
  setTimeout(() => { ui.tab = "flashcards"; ui.rvView = ""; ui.deckId = null; ui.fc = null; render(); window.scrollTo(0, 0); if (sheet) firstDeckSheet(); }, 80);
}
function firstDeckPaste(){
  // a deck to paste into: taken back out again if nothing was pasted
  const id = uid(), d = normDeck({id, created: Date.now(), name: "My First Deck", courseId: ui.filter && ui.filter !== "all" ? ui.filter : "", cards: []});
  applyChanges([{kind: "deck", id, after: d}], null);
  if (dlg.open) dlg.close();
  setTimeout(() => {
    bulkSheet(state.decks[id]);
    const gone = () => { dlg.removeEventListener("close", gone); setTimeout(() => { const x = state.decks[id]; if (x && !x.cards.length) applyChanges([{kind: "deck", id, after: null}], null); }, 300); };
    dlg.addEventListener("close", gone);
  }, 60);
}
// After the first study session on a device without an account: keep these cards, with a free account (or keep going)
function keepSafeHtml(){
  try {
    if (typeof sbUser !== "undefined" && sbUser) return "";
    if (!(window.SBGUEST && SBGUEST.is()) || localStorage.getItem("studyboard:keepSafe")) return "";
  } catch (e) { return ""; }
  const n = decksArr().reduce((s, d) => s + d.cards.length, 0);
  return `<div class="keep-safe"><b>Keep your ${n} cards safe</b><p class="mini">A free account backs them up and puts them on your phone and laptop. Everything stays here either way.</p>
    <div class="row-actions"><button type="button" class="btn primary" data-act="keep-safe-yes">Save With a Free Account</button><button type="button" class="btn" data-act="keep-safe-no">Keep Going Without One</button></div></div>`;
}

hook("act", act => {
  if (act === "first-deck") { firstDeckGo(); return true; }
  if (act === "fd-ai") { if (dlg.open) dlg.close(); setTimeout(() => aiStudySheet(null), 60); return true; }
  if (act === "fd-paste") { firstDeckPaste(); return true; }
  if (act === "fd-import") { if (dlg.open) dlg.close(); setTimeout(() => fire("act", "grp-share-menu", document.body, ""), 60); return true; }
  if (act === "keep-safe-yes" || act === "keep-safe-no") { try { localStorage.setItem("studyboard:keepSafe", "1"); } catch (e) {} if (act === "keep-safe-yes") { if (typeof sbAsk === "function") sbAsk(); } else render(); return true; }
  if (act === "goal-open") { dailyGoalSheet(); return true; }
  if (act === "fc-hint") { fcHint(); return true; }
  if (act === "qz-hint") { aiQuizHint(); return true; }
  if (act === "qz-added-undo") { quizAddedUndo(); return true; }
  return false;
});
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest('[data-act="goal-pick"]'); if (!b) return;
  e.preventDefault(); e.stopPropagation(); goalPick(b.dataset.id);
}, true);
// H asks for a hint while a card's front or an unanswered quiz question is showing
document.addEventListener("keydown", e => {
  if (e.key !== "h" && e.key !== "H") return;
  if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector("dialog[open]")) return;
  const t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  const f = ui.fc; if (!f) return;
  if (f.mode === "study" && f.q[f.i] && !f.flipped) { e.preventDefault(); fcHint(); }
  else if (f.mode === "aiquiz" && f.qs[f.i] && !f.ans[f.i]) { e.preventDefault(); aiQuizHint(); }
});
// The website's switch pages link here with ?start=paste, ?start=import or ?start=first-deck: once the app is up and nothing else
// is open (a new student sees the welcome first), the matching sheet opens, once
(() => {
  let want = ""; try { const u = new URL(location.href); want = u.searchParams.get("start") || ""; if (want) { u.searchParams.delete("start"); history.replaceState(history.state, "", u.pathname + (u.search || "") + u.hash); } } catch (e) {}
  if (!/^(paste|import|first-deck)$/.test(want)) return;
  let tries = 0;
  const go = () => {
    if (++tries > 120) return;
    if (!window.__sbSync || document.querySelector("dialog[open]")) { setTimeout(go, 500); return; }
    if (want === "paste") firstDeckPaste(); else if (want === "import") { ui.tab = "flashcards"; render(); setTimeout(() => fire("act", "grp-share-menu", document.body, ""), 60); } else firstDeckGo(true);
  };
  setTimeout(go, 900);
})();
if (window.__SB_TEST) window.__sbRewards = {maskedClue, lettersHint, hintLeaks, goalCfg, goalToday, goalBump};
