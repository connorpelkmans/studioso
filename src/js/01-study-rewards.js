/* ===== module: 01-study-rewards.js: studying that feels rewarding, without the annoying parts ===== */
/* What the Gizmo study (reports/, LAUNCH-STATS.md's neighbour) found worth copying, done Studyboard's way:
   1. Mochi's Hint: a nudge before you answer or rate, never the answer itself. The companion's AI when AI is on, else the first
      letters (cards) or one wrong option taken away (quizzes). Using it costs nothing and changes nothing.
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
// No AI: the first letter of each word, the rest as blanks ("T__ i____ m_______"); numbers stay hidden too
function localHint(answer){
  const words = String(answer || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (!words.length) return "Think about what this goes with in your notes.";
  if (words.length > 10) return `Starts with "${words.slice(0, 2).join(" ").replace(/[^\p{L}\p{N} '-]/gu, "")}…" (${words.length} words)`;
  return "Starts like: " + words.map(w => w.replace(/^([^\p{L}\p{N}]*)([\p{L}\p{N}])([\p{L}\p{N}]*)(.*)$/u, (m, a, b, rest, z) => a + b + "_".repeat(rest.length) + z)).join(" ");
}
// An AI hint that gives a word of the answer away is no hint: the letters version stands in
const HINT_SCHEMA = {type: "OBJECT", properties: {hint: {type: "STRING", description: "One nudge, under 20 words, that never states the answer"}}, required: ["hint"]};
function hintLeaks(hint, answer){
  const h = " " + String(hint || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ") + " ";
  return String(answer || "").toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 4).some(w => h.includes(" " + w + " ") || h.includes(" " + w + "s "));
}
async function aiHint(prompt, answer, extra){
  const r = await aiCall({task: "hint", fast: true, maxTokens: 400, temperature: 0.5, schema: HINT_SCHEMA,
    parts: [{text: `Question or card front: ${prompt}\nThe answer (never say it, or any of its key words): ${answer}${extra ? "\n" + extra : ""}`}],
    system: `You are ${buddyName()}, a friendly study companion. Give ONE short hint, under 20 words, that nudges the student toward recalling the answer: what it relates to, its category, how it works, or a memory cue. Never state the answer, never use its key words, never list options. Warm and plain. Return JSON only.`});
  const t = String((r.data && r.data.hint) || "").trim();
  return t && !hintLeaks(t, answer) ? t : "";
}
// Flashcards: Hint before the answer shows
async function fcHint(){
  const f = ui.fc, it = f && f.q[f.i]; if (!it || f.flipped) return;
  const d = state.decks[it.deckId], c = d && d.cards.find(x => x.id === it.cardId); if (!c) return;
  f.hints = f.hints || {}; f.hinted = (f.hinted || 0) + (f.hints[c.id] ? 0 : 1);
  if (c.hint) { f.hints[c.id] = {text: c.hint}; render(); return; }
  if (!aiReady() || c.img) { f.hints[c.id] = {text: localHint(c.back), local: true}; render(); return; }
  f.hints[c.id] = {busy: true}; render();
  let text = "";
  try { text = await aiHint(c.front, c.back); } catch (e) { console.warn("hint", e); }
  if (!text) { f.hints[c.id] = {text: localHint(c.back), local: true}; render(); return; }
  f.hints[c.id] = {text};
  // kept on the card, so the next session's hint is instant and free
  const nd = clone(state.decks[d.id]), k = nd && nd.cards.find(x => x.id === c.id);
  if (k) { k.hint = text; saveDeck(nd, null); } else render();
}
function fcBuddyHtml(d, c, f, key){
  const name = buddyName(), face = `<span class="fc-buddy-face" aria-hidden="true">${buddyFace()}</span>`;
  if (!f.flipped) {
    const h = (f.hints || {})[c.id];
    if (h) return `<div class="fc-buddy has-tip">${face}<p class="fc-bubble" role="status">${h.busy ? `<span class="ai-spin" aria-hidden="true"></span> ${esc(name)} is thinking…` : esc(h.text)}</p></div>`;
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
// AI quizzes: a Hint before answering (AI nudge, or one wrong option taken away)
async function aiQuizHint(){
  const f = ui.fc, q = f && f.qs[f.i]; if (!q || f.ans[f.i]) return;
  f.qhint = f.qhint || {};
  if (f.qhint[q.id]) return;
  const strike = () => {
    const wrong = (q.options || []).map((o, i) => i).filter(i => !(q.correct || []).includes(i));
    if ((q.type === "single" || q.type === "multiple") && wrong.length > 1) { const i = wrong[(q.stem.length + f.i) % wrong.length]; f.qhint[q.id] = {text: `It isn't "${q.options[i]}".`, strike: i}; }
    else if (q.type === "multiple") f.qhint[q.id] = {text: `${q.correct.length} of these are right.`};
    else if (q.type === "order") f.qhint[q.id] = {text: `"${q.options[q.correct[0]]}" comes first.`};
    else f.qhint[q.id] = {text: localHint(quizAnswerText(q))};
  };
  if (!aiReady()) { strike(); render(); return; }
  f.qhint[q.id] = {busy: true}; render();
  let text = "";
  try { text = await aiHint(q.stem, quizAnswerText(q), q.options && q.options.length ? "Options shown: " + q.options.join(" | ") : ""); } catch (e) { console.warn("hint", e); }
  if (text) f.qhint[q.id] = {text}; else strike();
  render();
}
function aiQuizHintHtml(f, q){
  const h = (f.qhint || {})[q.id], name = buddyName(), face = `<span class="fc-buddy-face" aria-hidden="true">${buddyFace()}</span>`;
  if (h) return `<div class="fc-buddy has-tip">${face}<p class="fc-bubble" role="status">${h.busy ? `<span class="ai-spin" aria-hidden="true"></span> ${esc(name)} is thinking…` : esc(h.text)}</p></div>`;
  return `<div class="fc-buddy">${face}<button type="button" class="btn small fc-hint-btn" data-act="qz-hint" title="${esc(name)} gives a nudge, not the answer">Hint</button></div>`;
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
function firstDeckGo(){
  // the planner setup steps aside (the Board keeps its Set Up Your Semester card); this was the student's choice
  try { localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:firstDeck", "1"); } catch (e) {}
  if (dlg.open) dlg.close();
  setTimeout(() => { ui.tab = "flashcards"; ui.rvView = ""; ui.deckId = null; ui.fc = null; render(); firstDeckSheet(); }, 80);
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
if (window.__SB_TEST) window.__sbRewards = {localHint, hintLeaks, goalCfg, goalToday, goalBump};
