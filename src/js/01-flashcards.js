/* ===== module: 01-flashcards.js: the app's core, flashcards: decks, spaced repetition, quizzes ===== */
/* Flashcards: decks, spaced-repetition study and auto-generated quizzes */
const BOX_DAYS = [0, 1, 3, 7, 14, 30];
const FC_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="14" height="12" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v10"/></svg>';
function normDeck(d){
  d = Object.assign({name: "Untitled Deck", courseId: "", cards: [], quizzes: []}, d);
  if (!Array.isArray(d.cards)) d.cards = [];
  d.cards = d.cards.filter(c => c && c.id).map(c => Object.assign({front: "", back: "", box: 0, due: "", seen: 0, right: 0, wrong: 0}, c));
  if (!Array.isArray(d.quizzes)) d.quizzes = [];
  if (!Array.isArray(d.aiQuizzes)) d.aiQuizzes = [];
  d.aiQuizzes = d.aiQuizzes.filter(q => q && q.id && Array.isArray(q.questions)).map(q => Object.assign({title: "Practice Quiz", style: "", results: [], sources: []}, q, {questions: q.questions.filter(x => x && x.id).map(x => Object.assign({type: "single", stem: "", options: [], correct: [], answer: "", rationale: "", notes: [], topic: "", source: ""}, x))}));
  return d;
}
const decksArr = () => Object.values(state.decks || {}).filter(d => !d.archived).sort((a, b) => ((a.created || 0) - (b.created || 0)) || a.name.localeCompare(b.name));
// A quiz made straight from slides or notes is kept in a holder deck with no cards
const isQuizHolder = d => !!(d && d.quizOnly && !(d.cards || []).length);
const quizFrom = (d, qz) => isQuizHolder(d) ? ((qz && qz.sources || []).filter(Boolean).map(x => String(x).replace(/\.[a-z0-9]{2,5}$/i, "")).slice(0, 2).join(", ") || "your material") : d.name;
const deckListArr = () => decksArr().filter(d => !isQuizHolder(d));
const cardDue = c => c.seen > 0 && (!c.due || c.due <= todayISO());
const cardNew = c => !c.seen;
/* How prepared you are for a deck (0 to 100), from every card */
/*DR-START*/
const DR = (() => {
  const BASE = [0.15, 0.4, 0.55, 0.7, 0.85, 0.95], GAP = [1, 1, 3, 7, 14, 30];
  const num = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || "")); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5 : NaN; };
  function lastDay(c){
    if (Number.isFinite(num(c.last))) return num(c.last);
    if (Number.isFinite(num(c.due))) return num(c.due) - (c.box > 0 ? GAP[Math.min(5, c.box)] : 0);
    return NaN;
  }
  function card(c, today){
    if (!(c.seen > 0)) return 0;
    const box = Math.max(0, Math.min(5, c.box | 0)), t = num(today), l = lastDay(c);
    const age = Number.isFinite(l) ? Math.max(0, t - l) : 45;
    const gap = GAP[box], late = Math.max(0, age - gap), fade = late ? Math.max(0.15, 1 / (1 + late / Math.max(gap, 3))) : 1;
    const acc = ((c.right || 0) + 1) / ((c.seen || 0) + 2);
    const feel = c.rate === "again" ? 0.6 : c.rate === "hard" ? 0.88 : 1;
    return Math.max(0, Math.min(1, BASE[box] * (0.75 + 0.25 * acc) * fade * feel));
  }
  const deck = (cards, today) => cards.length ? Math.round(cards.reduce((a, c) => a + card(c, today), 0) / cards.length * 100) : 0;
  return {card, deck, lastDay};
})();
/*DR-END*/
const deckStats = d => {
  const cs = d.cards, due = cs.filter(cardDue).length, fresh = cs.filter(cardNew).length, mastered = cs.filter(c => c.box >= 4).length;
  const mastery = cs.length ? cs.reduce((s, c) => s + Math.min(5, c.box), 0) / (cs.length * 5) : 0;
  const last = d.quizzes[d.quizzes.length - 1];
  return {total: cs.length, due, fresh, mastered, mastery, last, ready: DR.deck(cs, todayISO())};
};
const allDueCount = () => decksArr().reduce((s, d) => s + d.cards.filter(cardDue).length, 0);
// What a review session of these decks holds: every due card (up to 60) and up to 20 new ones
const STUDY_MAX = 60, STUDY_NEW = 20;
function studyCounts(deckIds){
  let due = 0, fresh = 0;
  deckIds.forEach(id => { const d = state.decks[id]; if (d) d.cards.forEach(c => { if (c.draft) return; if (cardDue(c)) due++; else if (cardNew(c)) fresh++; }); });
  due = Math.min(due, STUDY_MAX); fresh = Math.min(fresh, STUDY_NEW, STUDY_MAX - due);
  return {due, fresh};
}
// The Review tab shows how many cards are due
hook("render", () => {
  const b = document.querySelector('nav.tabs [data-tab="flashcards"]'); if (!b) return;
  const n = allDueCount(); let dot = b.querySelector(".fc-navdue");
  if (!n) { if (dot) { dot.remove(); b.removeAttribute("aria-label"); } return; }
  if (!dot) { dot = document.createElement("span"); dot.className = "fc-navdue"; dot.setAttribute("aria-hidden", "true"); b.appendChild(dot); }
  const txt = n > 99 ? "99+" : String(n); if (dot.textContent !== txt) dot.textContent = txt;
  b.setAttribute("aria-label", `${tr("nav.flashcards", "Review")}, ${n} card${n === 1 ? "" : "s"} due`);
});
const dueWords = n => `${n.due} due${n.fresh ? ` + ${n.fresh} new` : ""}`;
const reviewDecks = course => decksArr().filter(d => (!course || course === "all" || d.courseId === course) && d.cards.some(c => !c.draft && cardDue(c))).map(d => d.id);
// Flashcard styles grouped for choosing
function cardStyleGroups(){
  const ok = c => c.id !== "theme" || themeKit(), basic = CARD_STYLES.filter(c => !c.theme && ok(c)), groups = [["Flashcard Styles", basic]], by = {};
  CARD_STYLES.filter(c => c.theme).forEach(c => { (by[c.theme] = by[c.theme] || []).push(c); });
  Object.keys(by).forEach(th => { const sk = SKINS.find(x => x.id === th); groups.push([sk ? sk.name + " Collection" : th, by[th]]); });
  return groups;
}
const deckDefaultStyle = d => cardStyleOf(Object.assign({}, d, {cardStyle: ""}));
function saveDeck(d, label){ applyChanges([{kind: "deck", id: d.id, after: d}], label === undefined ? null : label); }
function shuffle(a){ for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const fcMatches = (d, q) => {
  q = (q || "").trim().toLowerCase(); if (!q) return true;
  const c = courseOf(d.courseId);
  return [d.name, c && c.name, c && c.code].join(" ").toLowerCase().includes(q) || d.cards.some(x => (x.front + " " + x.back).toLowerCase().includes(q));
};
function masteryPips(box){ return `<span class="pips" title="Level ${box} of 5">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= box ? "on" : ""}"></i>`).join("")}</span>`; }

/* Review (the Flashcards tab) */
ui.rvView = ui.rvView || (() => { try { return localStorage.getItem("studyboard:rvview") === "quizzes" ? "quizzes" : "cards"; } catch (e) { return "cards"; } })();
const rvSet = v => { ui.rvView = v === "quizzes" ? "quizzes" : "cards"; try { localStorage.setItem("studyboard:rvview", ui.rvView); } catch (e) {} };
const reviewSwitchHtml = () => `<div class="pview-tabs rv-tabs" role="tablist" aria-label="Review"><button role="tab" data-act="rv-view" data-id="cards" aria-selected="${ui.rvView !== "quizzes"}">Flashcards</button><button role="tab" data-act="rv-view" data-id="quizzes" aria-selected="${ui.rvView === "quizzes"}">Quizzes</button></div>`;
const QZ_GROUP_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 19.5c0-3.2 2.7-5.5 6-5.5s6 2.3 6 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.1c2.6.2 4.5 2.2 4.5 4.9"/></svg>';
// Quizzes you put away with Archive (qz.archived) stay on their deck, out of the list
const quizzesAll = archived => { const out = []; decksArr().forEach(d => (d.aiQuizzes || []).forEach(qz => { if (qz && qz.questions && qz.questions.length && !!qz.archived === !!archived) out.push({d, qz}); })); return out.sort((a, b) => (b.qz.created || 0) - (a.qz.created || 0)); };
const qzFind = ref => { const [did, qid] = String(ref || "").split(":"), d = state.decks[did], qz = d && (d.aiQuizzes || []).find(x => x.id === qid); return qz ? {d, qz} : null; };
const qzArchBtn = () => { const n = quizzesAll(true).length; return `<button class="btn small trash-btn fc-arch-btn" data-act="qz-arch-open" aria-label="Archived Quizzes${n ? ` (${n})` : ""}" title="Archived Quizzes${n ? ` (${n})` : ""}">${ARCHIVE.replace('width="26" height="26"', 'width="16" height="16"')}${n ? `<span>${n}</span>` : ""}</button>`; };
function qzSetArchived(ref, on){
  const f = qzFind(ref); if (!f) return;
  const d = clone(f.d), qz = d.aiQuizzes.find(x => x.id === f.qz.id); if (on) qz.archived = true; else delete qz.archived; d.updated = Date.now();
  if (on && ui.qzOpen === ref) ui.qzOpen = null;
  saveDeck(d, on ? `Archived ${f.qz.title || "the quiz"}` : `Restored ${f.qz.title || "the quiz"}`);
}
function archivedQuizzesSheet(){
  const list = quizzesAll(true);
  openSheet(`<div class="sheet fc-arch-sheet">${head("Archived Quizzes")}<div class="sheet-body">
    <p class="mini" style="margin:0 0 10px">${list.length ? "Quizzes you archived stay here, out of your quiz list, until you restore them." : "No archived quizzes. Use a quiz's Archive button to put it away here without deleting it."}</p>
    ${list.length ? `<div class="deck-archived"><ul>${list.map(({d, qz}) => { const c = courseOf(d.courseId);
      return `<li><span class="da-name"><b>${esc(qz.title || "Practice Quiz")}</b><span class="mini">${esc(c ? courseLabel(c) : "General")} · ${qz.questions.length} question${qz.questions.length === 1 ? "" : "s"}</span></span><button class="btn small" data-act="qz-unarchive" data-id="${esc(d.id + ":" + qz.id)}">Restore</button></li>`; }).join("")}</ul></div>` : ""}</div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Done</button></div></div>`);
}
// One quiz: its questions with the answers (and why), and what you can do with it
function viewQuizDetail(d, qz){
  const c = courseOf(d.courseId), res = qz.results || [], last = res[res.length - 1], best = res.reduce((m, r) => Math.max(m, r.total ? r.score / r.total : 0), 0);
  const TL = {single: "One answer", multiple: "Select all that apply", order: "Put in order", truefalse: "True or false", short: "Short answer"};
  const qs = qz.questions.map((q, i) => `<li class="qzd-q"><div class="qzd-top"><b class="qzd-n">${i + 1}</b><span class="pill">${esc(TL[q.type] || "Question")}</span></div>
      <p class="qzd-stem">${esc(q.stem)}</p>
      ${q.type === "short" ? `<p class="qzd-ans">Answer: <b>${esc(q.answer)}</b></p>` : `<ul class="qzd-opts">${(q.type === "order" ? q.correct.map(ix => q.options[ix]) : q.options).map((o, k) => `<li class="${q.type !== "order" && q.correct.includes(k) ? "ok" : ""}">${q.type === "order" ? `<b>${k + 1}.</b> ` : q.correct.includes(k) ? "✓ " : ""}${esc(o)}</li>`).join("")}</ul>`}
      ${q.rationale ? `<details><summary>Why</summary><p>${esc(q.rationale)}</p></details>` : ""}</li>`).join("");
  const ref = d.id + ":" + qz.id;
  return `<button class="back" data-act="qz-back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>All Quizzes</button>
    <div class="deck-head g2-head dk2" style="--c:${esc(colorOf(d.courseId))}">
      <div class="g2-band"><span class="g2-kick">${esc(c ? courseLabel(c) : "General")} · ${qz.kind === "case" ? "Case Study" : "Quiz"}</span>
        <div class="row-actions"><button class="btn primary" data-act="ai-quiz-start" data-deck="${esc(d.id)}" data-id="${esc(qz.id)}">Start</button><button class="btn" data-act="qz-share" data-deck="${esc(d.id)}" data-id="${esc(qz.id)}">Share</button><button class="btn" data-act="qz-archive" data-id="${esc(ref)}">Archive</button><button class="btn" data-act="ai-quiz-del" data-deck="${esc(d.id)}" data-id="${esc(qz.id)}">Delete</button></div></div>
      <div class="g2-low"><span class="g2-ring" aria-hidden="true">${c ? courseRingHtml(c) : GENERAL_ICON}</span>
        <div class="g2-txt"><h2>${esc(qz.title || "Practice Quiz")}</h2>
          <div class="deck-stats"><span><b>${qz.questions.length}</b> questions</span><span>from <b>${esc(quizFrom(d, qz))}</b></span>${last ? `<span>Last score <b>${last.score}/${last.total}</b></span><span>Best <b>${Math.round(best * 100)}%</b></span>` : ""}</div></div></div>
    </div>
    ${qz.kind === "case" && qz.scenario ? `<p class="qzd-scen">${esc(qz.scenario)}</p>` : ""}
    <ol class="qzd-list">${qs}</ol>`;
}
function viewQuizzes(){
  if (ui.qzOpen) { const f = qzFind(ui.qzOpen); if (f && !f.qz.archived) return viewQuizDetail(f.d, f.qz); ui.qzOpen = null; }
  const q = ui.q.trim().toLowerCase(), all = quizzesAll();
  const list = all.filter(({d}) => ui.filter === "all" || d.courseId === ui.filter).filter(({d, qz}) => !q || [qz.title, d.name, qz.style].join(" ").toLowerCase().includes(q));
  const cards = list.map(({d, qz}) => { const c = courseOf(d.courseId), res = qz.results || [], last = res[res.length - 1], n = qz.questions.length;
    return `<article class="qz-card" style="--c:${esc(colorOf(d.courseId))}">
      <div class="qz-band"><span class="fc-ic" aria-hidden="true">${c ? courseRingHtml(c) : GENERAL_ICON}</span><span class="g2-kick">${esc(c ? courseLabel(c) : "General")}</span>${qz.kind === "case" ? `<span class="qz-pill">Case Study</span>` : ""}</div>
      <button class="qz-body" data-act="qz-open" data-id="${esc(d.id + ":" + qz.id)}"><b class="qz-title">${esc(qz.title || "Practice Quiz")}</b><span class="mini">${n} question${n === 1 ? "" : "s"} · from ${esc(quizFrom(d, qz))}${last ? ` · last score ${last.score}/${last.total}` : ""}</span></button>
      <div class="qz-acts"><button class="btn small primary" data-act="ai-quiz-start" data-deck="${esc(d.id)}" data-id="${esc(qz.id)}">Start</button><button class="btn small" data-act="qz-share" data-deck="${esc(d.id)}" data-id="${esc(qz.id)}">Share</button><span class="spacer"></span><button class="btn small deck-arch" data-act="qz-archive" data-id="${esc(d.id + ":" + qz.id)}" title="Put this quiz away" aria-label="Archive ${esc(qz.title || "quiz")}">${ARCHIVE.replace('width="26" height="26"', 'width="16" height="16"')}</button></div></article>`; }).join("");
  return `<div class="view-head" data-qz-list><h2>Your Quizzes</h2>${window.SBSHARE ? SBSHARE.libBtn("quizzes") : ""}${qzArchBtn()}${trashBtn("quiz") || `<button class="btn small trash-btn" data-act="trash-open" data-kind="quiz" aria-label="Recently Deleted" title="Recently Deleted"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>`}</div>
    ${chipsHtml()}${q ? `<div class="search-note">Showing quizzes that match “${esc(ui.q.trim())}”. <button class="link-btn" data-act="search-clear">Clear Search</button></div>` : ""}
    ${list.length ? `<div class="qz-grid">${cards}</div>` : `<div class="empty${all.length ? "" : " sb-es"}" style="margin-top:14px">${all.length ? "" : emptyArt()}<strong>${all.length ? "No Quizzes Match" : "No Quizzes Yet"}</strong>${all.length ? "Try another course or search." : (inPreview() ? "Make a quiz from one of your flashcard decks." : "Upload your slides, notes or readings and " + esc(aiWho("AI")) + " writes a practice quiz. Or make one from a flashcard deck.")}<br><div class="row-actions" style="justify-content:center;margin-top:10px">${inPreview() || all.length ? "" : `<button class="btn primary ai-btn" data-act="qz-ai">${AI_ICON} From Slides or Notes</button>`}<button class="btn${inPreview() ? " primary" : ""}" data-act="qz-from-deck">From a Deck</button></div></div>`}
    <section class="grp-strip"><div class="grp-strip-txt">${QZ_GROUP_IC}<span><b>Study Together</b><span class="mini">Share quizzes with a study group: everyone takes them in their own app and sees the best scores.</span></span></div>
      <div class="grp-strip-btns"><button class="btn small" data-act="grp-page">Study Groups</button></div></section>
    <p class="hint-line tip-everyday">Make a quiz straight from your slides or notes with Add Quiz, or from a deck with Make a Quiz.</p>`;
}
/* Review hero: what's ready, about how long, and one Start button */
// Decks with cards to review or learn, in the chosen course
const readyDecks = course => decksArr().filter(d => (!course || course === "all" || d.courseId === course) && d.cards.some(c => !c.draft && (cardDue(c) || cardNew(c)))).map(d => d.id);
// Days you rated at least one card: kept for two weeks, plus the last day each card was seen
function markReviewDay(){
  const today = todayISO(), had = Array.isArray(state.settings && state.settings.fcDays) ? state.settings.fcDays : [];
  if (had.includes(today)) return;
  state.settings = Object.assign({}, state.settings, {fcDays: had.concat(today).filter(d => d > addDays(today, -15)).slice(-15)});
  saveSettings();
}
function reviewDays(){
  const out = new Set(Array.isArray(state.settings && state.settings.fcDays) ? state.settings.fcDays : []);
  decksArr().forEach(d => d.cards.forEach(c => { if (c.last) out.add(c.last); }));
  return out;
}
function reviewWeekHtml(){
  const today = todayISO(), wd = (parse(today).getDay() + 6) % 7, mon = addDays(today, -wd), done = reviewDays();
  let n = 0;
  const cells = ["M", "T", "W", "T", "F", "S", "S"].map((l, i) => {
    const d = addDays(mon, i), on = done.has(d); if (on && d <= today) n++;
    return `<span class="rv-wd${d === today ? " now" : ""}${on ? " on" : ""}${d > today ? " later" : ""}"><i>${on ? '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : ""}</i>${l}</span>`;
  }).join("");
  return `<div class="rv-week" role="img" aria-label="Reviewed on ${n} day${n === 1 ? "" : "s"} this week">${cells}</div>`;
}
function reviewHeroHtml(){
  const course = ui.filter || "all", inC = decksArr().filter(d => course === "all" || d.courseId === course), cards = inC.reduce((s, d) => s + d.cards.filter(c => !c.draft).length, 0);
  if (!cards) return "";
  const ids = readyDecks(course), n = studyCounts(ids), ready = n.due + n.fresh, w = weakSpots(inC.map(d => d.id));
  const names = ids.map(id => state.decks[id].name), deckWords = names.length <= 2 ? names.join(" and ") : `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`;
  const cids = new Set(inC.map(d => d.courseId).filter(Boolean)), isEx = t => window.SBEXAM ? SBEXAM.EXAMMODE.isExam(t) : /^(Exam|Quiz)$/.test(t.type);
  const ex = tasksArr().filter(t => t.status !== "done" && t.due && t.due >= todayISO() && cids.has(t.courseId) && isEx(t) && dayDiff(todayISO(), t.due) <= 21).sort((a, b) => a.due.localeCompare(b.due))[0];
  const exD = ex ? dayDiff(todayISO(), ex.due) : 0, exWords = ex ? `${ex.title} is ${exD === 0 ? "today" : exD === 1 ? "tomorrow" : `in ${exD} days`}` : "";
  let title, sub;
  if (ready) {
    const mins = Math.max(1, Math.round((n.due * 10 + n.fresh * 20) / 60));
    title = `${ready} card${ready === 1 ? "" : "s"} ready to review`;
    sub = [`About ${mins} minute${mins === 1 ? "" : "s"}`, deckWords, exWords];
  } else {
    const next = inC.reduce((m, d) => d.cards.reduce((mm, c) => !c.draft && c.seen > 0 && c.due && c.due > todayISO() && (!mm || c.due < mm) ? c.due : mm, m), "");
    const nd = next ? dayDiff(todayISO(), next) : 0;
    title = "All caught up";
    sub = [next ? `Next review ${nd === 1 ? "tomorrow" : nd < 7 ? parse(next).toLocaleDateString(undefined, {weekday: "long"}) : fmtShort(next)}` : "Nothing is due", exWords];
  }
  const more = n.due || w.n ? `<button class="btn rv-more" data-act="fc-review-menu">Review Options</button>` : "";
  return `<section class="rv-hero${ready ? "" : " done"}" aria-label="Review">
    <span class="rv-stack" aria-hidden="true"><i></i><i></i><i></i></span>
    <div class="rv-t"><h3>${esc(title)}</h3><p>${sub.filter(Boolean).map(esc).join(" · ")}</p></div>
    ${reviewWeekHtml()}
    <div class="rv-acts">${ready ? `<button class="btn primary rv-go" data-act="fc-review-start" data-course="${esc(course)}">Start Review</button>` : ""}${more}</div>
  </section>`;
}
function viewFlashcards(){
  if (ui.fc && ui.fc.mode === "study") return viewStudy();
  if (ui.fc && ui.fc.mode === "quiz") return viewQuiz();
  if (ui.fc && ui.fc.mode === "aiquiz") return viewAiQuiz();
  if (ui.deckId && state.decks[ui.deckId]) return viewDeck(state.decks[ui.deckId]);
  ui.deckId = null;
  if (ui.rvView === "quizzes") return reviewSwitchHtml() + viewQuizzes();
  let ds = deckListArr().filter(d => ui.filter === "all" || d.courseId === ui.filter).filter(d => fcMatches(d, ui.q));
  if (window.SBEXAM) ds = SBEXAM.sortDecks(ds);
  const tiles = ds.map(d => {
    const st = deckStats(d), c = courseOf(d.courseId), tone = st.ready >= 70 ? "hi" : st.ready >= 35 ? "mid" : "lo";
    return `<article class="deck deck-fc cs-${esc(cardStyleOf(d))}" style="--c:${esc(colorOf(d.courseId))}">
      <span class="deck-lay l3" aria-hidden="true"><span class="face"></span></span><span class="deck-lay l2" aria-hidden="true"><span class="face"></span></span>
      <span class="deck-tab">${esc(c ? courseLabel(c) : "General")}</span>
      <span class="deck-count" role="img" aria-label="${st.total} card${st.total === 1 ? "" : "s"}" title="${st.total} card${st.total === 1 ? "" : "s"}">${st.total}</span>
      <div class="face deck-face">
      <span class="fc-band" aria-hidden="true"><span class="fc-ic">${c ? courseRingHtml(c) : GENERAL_ICON}</span><span class="g2-kick">${esc(c ? courseLabel(c) : "General")}</span></span>
      <button class="deck-main" data-act="fc-open" data-id="${esc(d.id)}">
        <span class="deck-name">${esc(d.name)}</span>${window.SBEXAM ? SBEXAM.deckTag(d) : ""}
        <span class="deck-due mini${st.due ? " on" : ""}">${st.due || st.fresh ? `${st.due} due · ${st.fresh} new` : st.total ? "All caught up" : "No cards yet"}</span>
        <span class="mastery ${tone}" role="img" aria-label="${st.ready}% prepared" title="${st.ready}% prepared. It rises as you review and rate cards well, and falls when you skip reviews or mark cards as not known."><i style="width:${st.ready}%"></i></span>
      </button>
      <div class="deck-actions"><button class="btn small primary" data-act="fc-study" data-id="${esc(d.id)}" ${st.total ? "" : "disabled"}>Study</button><button class="btn small" data-act="fc-share" data-id="${esc(d.id)}" ${st.total ? "" : "disabled"}>Share</button><button class="btn small deck-arch" data-act="fc-archive" data-id="${esc(d.id)}" title="Put this deck away when you're done studying it" aria-label="Archive ${esc(d.name)}">${ARCHIVE.replace('width="26" height="26"', 'width="16" height="16"')}</button></div>
    </div></article>`;
  }).join("");
  return reviewSwitchHtml() + `<div class="view-head" data-fc-list><h2>Your Decks</h2>
      ${window.SBSHARE ? SBSHARE.libBtn() : ""}${archBtn()}${trashBtn("deck") || `<button class="btn small trash-btn" data-act="trash-open" data-kind="deck" aria-label="Recently Deleted" title="Recently Deleted"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>`}</div>
    ${reviewHeroHtml()}${chipsHtml()}${ui.q.trim() ? `<div class="search-note">Showing decks that match “${esc(ui.q.trim())}”. <button class="link-btn" data-act="search-clear">Clear Search</button></div>` : ""}
    ${ds.length ? `<div class="deck-grid">${tiles}</div>` : `<div class="empty${decksArr().length ? "" : " sb-es"}" style="margin-top:14px">${decksArr().length ? "" : emptyArt()}<strong>${deckListArr().length ? "No Decks Match" : "No Decks Yet"}</strong>${decksArr().length ? "Try another course or search." : "Add cards or paste a list, then study them." + (inPreview() ? "" : " Or upload slides and let " + esc(aiWho("AI")) + " make them.")}<br><div class="row-actions" style="justify-content:center;margin-top:10px"><button class="btn primary" data-act="fc-new">New Deck</button>${inPreview() || decksArr().length ? "" : `<button class="btn ai-btn" data-act="fc-ai">${AI_ICON} Create with ${esc(aiWho("AI"))}</button>`}</div></div>`}
    <p class="hint-line tip-everyday">Studyboard learns how fast you forget each card and brings it back just before you would.</p>`;
}
// Decks you put away with Archive (not the ones a finished term moved)
const archivedDecks = () => Object.values(state.decks || {}).filter(d => d.archived === "Archived").sort((a, b) => a.name.localeCompare(b.name));
const archBtn = () => { const n = archivedDecks().length; return `<button class="btn small trash-btn fc-arch-btn" data-act="fc-arch-open" aria-label="Archived Decks${n ? ` (${n})` : ""}" title="Archived Decks${n ? ` (${n})` : ""}">${ARCHIVE.replace('width="26" height="26"', 'width="16" height="16"')}${n ? `<span>${n}</span>` : ""}</button>`; };
function archivedDecksSheet(){
  const list = archivedDecks();
  openSheet(`<div class="sheet fc-arch-sheet">${head("Archived Decks")}<div class="sheet-body">
    <p class="mini" style="margin:0 0 10px">${list.length ? "Decks you archived stay here, out of your deck list and reviews, until you restore them." : "No archived decks. Open a deck and choose Archive to put it away here without deleting it."}</p>
    ${list.length ? `<div class="deck-archived"><ul>${list.map(d => { const c = courseOf(d.courseId);
      return `<li><span class="da-name"><b>${esc(d.name)}</b><span class="mini">${esc(c ? courseLabel(c) : "General")} · ${d.cards.length} card${d.cards.length === 1 ? "" : "s"}</span></span><button class="btn small" data-act="fc-unarchive" data-id="${esc(d.id)}">Restore</button></li>`; }).join("")}</ul></div>` : ""}</div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Done</button></div></div>`);
}
function viewDeck(d){
  const st = deckStats(d), c = courseOf(d.courseId);
  const q = ui.q.trim().toLowerCase();
  const cards = d.cards.filter(x => !q || (x.front + " " + x.back).toLowerCase().includes(q));
  const rows = cards.map(x => `<li class="fc-row">
      <button class="fc-cell face fc-face" data-act="fc-card" data-id="${esc(x.id)}"><span class="fc-front">${esc(x.front)}</span><span class="fc-back">${esc(x.back)}</span></button>
      ${masteryPips(x.box)}
    </li>`).join("");
  return `<button class="back" data-act="fc-back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>All Decks</button>
    <div class="deck-head g2-head dk2" data-fc-deck="${esc(d.id)}" style="--c:${esc(colorOf(d.courseId))}">
      <div class="g2-band"><span class="g2-kick">${esc(c ? courseLabel(c) : "General")} · Flashcards</span>
        <div class="row-actions"><button class="btn primary" data-act="fc-study" data-id="${esc(d.id)}" ${st.total ? "" : "disabled"}>Study</button><button class="btn" data-act="fc-quiz" data-id="${esc(d.id)}" ${st.total >= 2 ? "" : "disabled"}>Make a Quiz</button>${window.SBMATCH ? SBMATCH.deckBtn(d) : ""}<button class="btn" data-act="fc-bulk" data-id="${esc(d.id)}">Paste Cards</button>${window.SBPRO && SBPRO.deckBtns ? SBPRO.deckBtns(d) : ""}<button class="btn" data-act="fc-edit" data-id="${esc(d.id)}">Edit Deck</button></div></div>
      <div class="g2-low"><span class="g2-ring" aria-hidden="true">${c ? courseRingHtml(c) : GENERAL_ICON}</span>
        <div class="g2-txt"><h2>${esc(d.name)}</h2>
          <div class="deck-stats"><span><b>${st.total}</b> cards</span><span class="${st.due ? "due" : ""}"><b>${st.due}</b> due</span><span><b>${st.fresh}</b> new</span><span class="${st.mastered ? "ok" : ""}"><b>${st.mastered}</b> mastered</span>${st.last ? `<span>Last quiz <b>${st.last.score}/${st.last.total}</b></span>` : ""}</div></div></div>
    </div>
    ${window.SBLINKED ? SBLINKED.deckHtml(d) : ""}${deckAiBar(d)}
    ${cards.length ? `<ul class="fc-list fc-styled cs-${esc(cardStyleOf(d))}" style="--c:${esc(colorOf(d.courseId))}">${rows}</ul>` : `<div class="empty" style="margin-top:12px"><strong>${d.cards.length ? "No Cards Match" : "No Cards Yet"}</strong>${d.cards.length ? "" : "Tap Add Card at the bottom right, or use Paste Cards to add a whole list at once."}</div>`}`;
}
function deckSheet(d){
  const isNew = !d;
  d = d ? clone(d) : {name: "", courseId: ui.filter !== "all" ? ui.filter : ""};
  openSheet(`<form class="sheet">${head(isNew ? "New Deck" : "Edit Deck")}
    <div class="sheet-body">${REQ_NOTE}
      <label class="f"><span class="lh">Deck Name ${REQ}</span><input type="text" name="name" required maxlength="120" value="${esc(d.name)}" autofocus placeholder="e.g. Population ecology"></label>
      <label class="f">Course<select name="courseId">${courseSelectHtml(d.courseId)}</select></label>
      <label class="f"><span class="lh">Card Style <span class="hint">how cards look while you study</span></span><select name="cardStyle"><option value="">${esc((CARD_STYLES.find(x => x.id === deckDefaultStyle(d)) || CARD_STYLES[0]).name)} (default)</option>${cardStyleGroups().map(([label, list]) => `<optgroup label="${esc(label)}">${list.map(x => `<option value="${x.id}" ${d.cardStyle === x.id ? "selected" : ""} ${owns("card", x.id) ? "" : "disabled"}>${esc(x.name)}${x.tier === "pro" ? " ✦" : ""}</option>`).join("")}</optgroup>`).join("")}</select></label>
    </div>
    <div class="sheet-foot">${isNew ? "" : `<button type="button" class="btn danger" id="dkDel">Delete Deck</button>`}<span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>${isNew ? "Create Deck" : "Save Deck"}</button></div>
  </form>`, fd => {
    const name = String(fd.get("name") || "").trim(); if (!name) return false;
    const cs = String(fd.get("cardStyle") || "");
    if (isNew) { const nd = normDeck({id: uid(), created: Date.now(), name, courseId: fd.get("courseId") || "", cardStyle: cs}); ui.deckId = nd.id; saveDeck(nd, `Created ${name}`); }
    else saveDeck(Object.assign(clone(state.decks[d.id]), {name, courseId: fd.get("courseId") || "", cardStyle: cs}), "Deck saved");
  });
  const del = $("#dkDel");
  if (del) del.addEventListener("click", () => { dlg.close(); ui.deckId = null; applyChanges([{kind: "deck", id: d.id, after: null}], `Deleted ${d.name}`); });
}
function cardSheet(d, cardId){
  const c = d.cards.find(x => x.id === cardId); if (!c) return;
  openSheet(`<form class="sheet">${head("Edit Card")}
    <div class="sheet-body">${REQ_NOTE}
      <label class="f"><span class="lh">Front ${REQ}</span><textarea name="front" required data-noenter>${esc(c.front)}</textarea></label>
      <label class="f"><span class="lh">Back ${REQ}</span><textarea name="back" required data-noenter>${esc(c.back)}</textarea></label>
      <p class="mini" style="margin:0">Level ${c.box} of 5${c.seen ? `, next review ${c.due && c.due > todayISO() ? esc(fmtDate(c.due)) : "today"}` : ", not studied yet"}. Right ${c.right}, wrong ${c.wrong}.</p>
    </div>
    <div class="sheet-foot"><button type="button" class="btn danger" id="cdDel">Delete</button><button type="button" class="btn" id="cdReset">Reset Progress</button><span class="spacer"></span><button type="button" class="btn primary" data-submit>Save Card</button></div>
  </form>`, fd => {
    const front = String(fd.get("front") || "").trim(), back = String(fd.get("back") || "").trim();
    if (!front || !back) { toast("A card needs both a front and a back"); return false; }
    const nd = clone(state.decks[d.id]); const x = nd.cards.find(y => y.id === cardId); if (!x) return;
    x.front = front; x.back = back; nd.updated = Date.now(); saveDeck(nd, "Card saved");
  });
  $("#cdDel").addEventListener("click", () => { dlg.close(); const nd = clone(state.decks[d.id]); nd.cards = nd.cards.filter(y => y.id !== cardId); saveDeck(nd, "Card deleted"); });
  $("#cdReset").addEventListener("click", () => { dlg.close(); const nd = clone(state.decks[d.id]); const x = nd.cards.find(y => y.id === cardId); Object.assign(x, {box: 0, due: "", seen: 0, right: 0, wrong: 0}); saveDeck(nd, "Card progress reset"); });
}
// Paste a list of cards
const SEPS = {auto: null, tab: "\t", dash: " - ", colon: ":", equals: "=", semicolon: ";", comma: ","};
function parseCards(text, sep){
  const out = [], bad = [];
  String(text || "").replace(/\r/g, "").split("\n").forEach(line => {
    if (!line.trim()) return;
    let i = -1, s = "";
    if (sep && sep !== "auto") { s = SEPS[sep]; i = line.indexOf(s); }
    else for (const cand of ["\t", " - ", " – ", " — ", " : ", ": ", " = ", " ; ", ";", ","]) { const k = line.indexOf(cand); if (k > 0) { i = k; s = cand; break; } }
    if (i <= 0) { bad.push(line); return; }
    const front = line.slice(0, i).trim(), back = line.slice(i + s.length).trim();
    if (front && back) out.push({front, back}); else bad.push(line);
  });
  return {cards: out, bad};
}
function reviewSheet(){
  const course = ui.filter || "all", ids = decksArr().filter(d => course === "all" || d.courseId === course).map(d => d.id);
  const n = studyCounts(reviewDecks(course)), w = weakSpots(ids), c = course !== "all" && courseOf(course);
  openSheet(`<div class="sheet">${head(c ? `Review ${courseLabel(c)}` : "Review")}
    <div class="sheet-body"><div class="menu-list">
      <button data-act="fc-review-all" data-course="${esc(course)}" ${n.due ? "" : "disabled"}><span>Flashcards Due${n.due ? ` (${dueWords(n)})` : ""}<span class="sub">${n.due ? `Study every card that is due today${n.fresh ? `, plus ${n.fresh} new one${n.fresh === 1 ? "" : "s"}` : ""}` : "Nothing is due right now"}</span></span></button>
      <button data-act="fc-weak" ${w.n ? "" : "disabled"}><span>Weak Spots${w.n ? ` (${w.n})` : ""}<span class="sub">${w.n ? "Practice the cards and questions you keep missing" : "Study or take a quiz first, and anything you keep missing shows up here"}</span></span></button>
    </div></div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button></div></div>`);
}
function addCardSheet(d){
  openSheet(`<form class="sheet fc-add" id="fcAdd" data-id="${esc(d.id)}">${head("Add Card")}
    <div class="sheet-body">
      <label class="f"><span class="lh">Front ${REQ}<span class="hint">term or question</span></span><textarea id="fcFront" rows="3" required data-noenter autofocus placeholder="e.g. Logistic growth"></textarea></label>
      <label class="f"><span class="lh">Back ${REQ}<span class="hint">definition or answer</span></span><textarea id="fcBack" rows="3" required data-noenter placeholder="e.g. Growth that slows as a population nears carrying capacity"></textarea></label>
      <span class="mini">Ctrl + Enter adds the card and keeps this open for the next one</span>
    </div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Done</button><button type="submit" class="btn primary">Add Card</button></div>
  </form>`);
  const f = $("#fcFront"); if (f) f.focus();
}
function bulkSheet(d){
  openSheet(`<form class="sheet">${head("Paste Cards")}
    <div class="sheet-body">
      <p class="mini" style="margin:0">One card per line, with the front and back separated by a tab, a dash, a colon or an equals sign. A list exported from Quizlet pastes in as is.</p>
      <label class="f">Cards<textarea id="bkText" rows="9" data-noenter placeholder="Carrying capacity - the largest population an environment can support&#10;r-selected species - many offspring, little parental care"></textarea></label>
      <label class="f">Split Front and Back At<select id="bkSep"><option value="auto">Detect automatically</option><option value="tab">Tab (Quizlet)</option><option value="dash">Dash ( - )</option><option value="colon">Colon ( : )</option><option value="equals">Equals sign ( = )</option><option value="semicolon">Semicolon ( ; )</option><option value="comma">Comma ( , )</option></select></label>
      <p class="status-msg" id="bkMsg" style="margin:0" aria-live="polite">Paste your list above.</p>
    </div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" id="bkAdd" disabled>Add Cards</button></div>
  </form>`);
  const upd = () => {
    const r = parseCards($("#bkText").value, $("#bkSep").value);
    $("#bkMsg").textContent = r.cards.length ? `${r.cards.length} card${r.cards.length === 1 ? "" : "s"} ready${r.bad.length ? `. ${r.bad.length} line${r.bad.length === 1 ? "" : "s"} had no separator and will be skipped` : ""}.` : ($("#bkText").value.trim() ? "No cards found. Check the separator." : "Paste your list above.");
    $("#bkAdd").disabled = !r.cards.length; $("#bkAdd").textContent = r.cards.length ? `Add ${r.cards.length} Card${r.cards.length === 1 ? "" : "s"}` : "Add Cards";
  };
  $("#bkText").addEventListener("input", upd); $("#bkSep").addEventListener("change", upd);
  $("#bkAdd").addEventListener("click", () => {
    const r = parseCards($("#bkText").value, $("#bkSep").value); if (!r.cards.length) return;
    const nd = clone(state.decks[d.id]); r.cards.forEach(x => nd.cards.push({id: uid(), front: x.front, back: x.back, box: 0, due: "", seen: 0, right: 0, wrong: 0}));
    nd.updated = Date.now(); dlg.close(); saveDeck(nd, `Added ${r.cards.length} card${r.cards.length === 1 ? "" : "s"}`);
  });
}

/* Study (flip cards and rate yourself) */
function startStudy(deckIds, onlyIds){
  let q = [];
  deckIds.forEach(id => { const d = state.decks[id]; if (d) d.cards.forEach(c => { if (!c.draft && (!onlyIds || onlyIds.includes(c.id))) q.push({deckId: id, cardId: c.id, c}); }); });
  if (!q.length) { toast("Add some cards first"); return; }
  let note = "";
  if (!onlyIds) {
    const due = q.filter(x => cardDue(x.c)), fresh = q.filter(x => cardNew(x.c));
    const pick = shuffle(due).concat(shuffle(fresh).slice(0, STUDY_NEW));
    if (pick.length) q = pick; else { q = shuffle(q); note = "Nothing is due, so you're reviewing every card."; }
  } else q = shuffle(q);
  if (window.SBEXAM) q = SBEXAM.sortQueue(q);
  q = q.slice(0, STUDY_MAX).map(x => ({deckId: x.deckId, cardId: x.cardId}));
  ui.tab = "flashcards"; ui.fc = {mode: "study", deckIds, q, i: 0, flipped: false, again: 0, hard: 0, good: 0, easy: 0, repeats: {}, note, hist: []};
  render(); window.scrollTo(0, 0);
}
const nextDue = (box, rating) => rating === "again" ? todayISO() : addDays(todayISO(), rating === "hard" ? 1 : BOX_DAYS[Math.min(5, box)]);
// Lifetime counts that unlock free companions
function earnBump(k, n){ try { const e = Object.assign({q: 0, c: 0}, (state.settings || {}).earn); e[k] = Math.max(0, (Number(e[k]) || 0) + (n || 1)); state.settings = Object.assign({}, state.settings, {earn: e}); saveSettings(); } catch(err) {} }
const quizPasses = (score, total) => total >= 5 && score / total >= 0.8;
function rateCard(rating){
  const f = ui.fc; const it = f.q[f.i]; if (!it) return;
  const d = clone(state.decks[it.deckId]); if (!d) return;
  const c = d.cards.find(x => x.id === it.cardId);
  const step = {i: f.i, rating, deckId: it.deckId, cardId: it.cardId, card: c ? clone(c) : null, rv: d.rv ? clone(d.rv) : null, rep: f.repeats[it.cardId], pushed: false};
  if (c) {
    const sm = window.SBPRO && SBPRO.cardRated ? SBPRO.cardRated(d, c, rating) : null;
    c.seen++; c.last = todayISO(); c.rate = rating;
    if (rating === "again") { c.box = 0; c.wrong++; }
    else if (rating === "hard") { c.box = Math.max(1, c.box); c.right++; }
    else if (rating === "good") { c.box = Math.min(5, c.box + 1); c.right++; }
    else { c.box = Math.min(5, c.box + 2); c.right++; }
    c.due = nextDue(c.box, rating);
    if (sm) { c.box = sm.box; c.due = sm.due; }
    d.updated = Date.now();
    saveDeck(d, null);
    fire("fc-rated", {rating, deckId: it.deckId, cardId: it.cardId});
    earnBump("c"); markReviewDay();
  }
  f[rating]++;
  if (rating === "again" && (f.repeats[it.cardId] || 0) < 2) { f.repeats[it.cardId] = (f.repeats[it.cardId] || 0) + 1; f.q.push(it); step.pushed = true; }
  f.hist = (f.hist || []).concat(step).slice(-50);
  f.i++; f.flipped = false;
  render();
}
// Undo the last rating: the card, the session and its counts go back to how they were
function undoRate(){
  const f = ui.fc; if (!f || f.mode !== "study" || !f.hist || !f.hist.length) return false;
  const s = f.hist.pop();
  if (s.pushed) f.q.pop();
  if (s.rep == null) delete f.repeats[s.cardId]; else f.repeats[s.cardId] = s.rep;
  f[s.rating] = Math.max(0, (f[s.rating] || 0) - 1);
  f.i = s.i; f.flipped = true;
  const cur = state.decks[s.deckId];
  if (cur && s.card) {
    const d = clone(cur), k = d.cards.findIndex(x => x.id === s.cardId);
    if (k >= 0) { d.cards[k] = s.card; if (s.rv) d.rv = s.rv; else delete d.rv; d.updated = Date.now(); saveDeck(d, null); fire("fc-unrated", {rating: s.rating, deckId: s.deckId, cardId: s.cardId}); earnBump("c", -1); }
  }
  render();
  toast("Rating undone");
  return true;
}
const undoBtn = (f, small) => `<button class="btn${small ? " small" : ""} fc-undo" data-act="fc-undo" title="Undo your last rating (Z)" aria-keyshortcuts="Z Backspace"${f.hist && f.hist.length ? "" : " disabled"}>Undo</button>`;
function viewStudy(){
  const f = ui.fc, it = f.q[f.i];
  const deckNames = f.deckIds.map(id => state.decks[id] && state.decks[id].name).filter(Boolean);
  const title = deckNames.length === 1 ? deckNames[0] : `${deckNames.length} decks`;
  if (!it) {
    const total = f.again + f.hard + f.good + f.easy;
    return `<div class="view-head"><h2>Study Session Done</h2></div>
      <section class="done-card">
        <p class="big-num">${total}<span> cards reviewed</span></p>
        <div class="deck-stats"><span><b>${f.easy + f.good}</b> known</span><span><b>${f.hard}</b> hard</span><span><b>${f.again}</b> to relearn</span></div>
        <p class="mini">Cards you knew come back in a few days. Cards marked Again come back today.</p>
        <div class="row-actions"><button class="btn primary" data-act="fc-quiz-from-study">Take a Quiz</button><button class="btn" data-act="fc-study-again">Study Again</button>${undoBtn(f)}<button class="btn" data-act="fc-exit">Done</button></div>
      </section>`;
  }
  const d = state.decks[it.deckId], c = d && d.cards.find(x => x.id === it.cardId);
  if (!c) { f.i++; return viewStudy(); }
  const box = c.box;
  const lbl = r => { const due = (window.SBPRO && SBPRO.cardPreview ? SBPRO.cardPreview(d, c, r) : "") || nextDue(r === "good" ? Math.min(5, box + 1) : r === "easy" ? Math.min(5, box + 2) : box, r); const n = dayDiff(todayISO(), due); return n <= 0 ? "today" : n === 1 ? "1 day" : n + " days"; };
  return `<div class="view-head"><h2>Studying ${esc(title)}</h2><span class="mini">${f.i + 1} of ${f.q.length}</span>${undoBtn(f, true)}<button class="btn small" data-act="fc-exit">End Session</button></div>
    <div class="progress"><i style="width:${Math.round(f.i / f.q.length * 100)}%"></i></div>
    ${f.note ? `<p class="mini">${esc(f.note)}</p>` : ""}
    ${c.img && window.SBPRO && SBPRO.studyCard ? SBPRO.studyCard(d, c, f) : `<button class="flip cs-${cardStyleOf(d)} ${f.flipped ? "is-flipped" : ""}${c.img ? " has-img" : ""}" data-act="fc-flip" style="--c:${esc(colorOf(d.courseId))}" aria-live="polite" aria-label="${f.flipped ? "Answer shown. " : ""}Flip card">
      <span class="flip-inner">
        <span class="face front"><span class="face-label">Front</span>${c.img && window.SBPRO && SBPRO.cardFace ? SBPRO.cardFace(c, false) : `<span class="face-text">${esc(c.front)}</span>`}<span class="face-hint">Tap<span class="kbd-only"> or press Space</span> to flip</span></span>
        <span class="face back"><span class="face-label">Back</span>${c.img && window.SBPRO && SBPRO.cardFace ? SBPRO.cardFace(c, true) : `<span class="face-text">${esc(c.back)}</span><span class="face-hint">${esc(c.front)}</span>`}</span>
      </span>
    </button>`}
    ${f.flipped ? `<div class="rate" role="group" aria-label="How well did you know it?">
      <button class="rate-btn again" data-act="fc-rate" data-id="again"><b>Again</b><span>${lbl("again")}</span></button>
      <button class="rate-btn hard" data-act="fc-rate" data-id="hard"><b>Hard</b><span>${lbl("hard")}</span></button>
      <button class="rate-btn good" data-act="fc-rate" data-id="good"><b>Good</b><span>${lbl("good")}</span></button>
      <button class="rate-btn easy" data-act="fc-rate" data-id="easy"><b>Easy</b><span>${lbl("easy")}</span></button>
    </div>${explainHtml(`c|${it.deckId}|${it.cardId}`)}<p class="hint-line tip-everyday kbd-only">Keys: 1 Again, 2 Hard, 3 Good, 4 Easy. Z undoes the last rating.</p>` : `<div class="rate"><button class="btn primary" data-act="fc-flip" style="grid-column:1/-1">Show Answer</button></div>`}`;
}

/* Quizzes made automatically from your cards */
const normAns = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9%.\- ]+/g, " ").replace(/\b(the|a|an)\b/g, " ").replace(/\s+/g, " ").trim();
function lev(a, b){
  if (a === b) return 0; if (!a.length) return b.length; if (!b.length) return a.length;
  let prev = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) { const cur = [i]; for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[b.length];
}
function gradeWritten(given, expected){
  const g = normAns(given); if (!g) return {correct: false};
  const alts = [expected].concat(String(expected).split(/\s*[\/;]\s*/)).map(normAns).filter(Boolean);
  if (alts.includes(g)) return {correct: true};
  for (const a of alts) if (a.length >= 4 && lev(g, a) <= Math.max(1, Math.floor(a.length * 0.15))) return {correct: true, close: true};
  const kw = normAns(expected).split(" ").filter(w => w.length > 3);
  if (kw.length >= 3 && kw.filter(w => g.includes(w)).length / kw.length >= 0.8) return {correct: true, close: true};
  return {correct: false};
}
function buildQuiz(deckIds, n, types, dir){
  const pool = [];
  deckIds.forEach(id => { const d = state.decks[id]; if (d) d.cards.forEach(c => { if (c.front.trim() && c.back.trim() && !c.img && !c.draft) pool.push({deckId: id, c}); }); });
  const picks = shuffle(pool.slice()).sort((a, b) => a.c.box - b.c.box).slice(0, n === "all" ? pool.length : Number(n));
  shuffle(picks);
  const related = deckId => {
    const d = state.decks[deckId], out = [];
    pool.forEach(x => out.push(x));
    decksArr().forEach(o => { if (!deckIds.includes(o.id) && d && o.courseId === d.courseId) o.cards.forEach(c => out.push({deckId: o.id, c})); });
    return out;
  };
  const qs = picks.map((x, k) => {
    const fwd = dir === "fwd" ? true : dir === "rev" ? false : Math.random() < 0.5;
    const prompt = fwd ? x.c.front : x.c.back, answer = fwd ? x.c.back : x.c.front;
    const field = fwd ? "back" : "front";
    const others = [...new Map(related(x.deckId).filter(o => o.c.id !== x.c.id).map(o => [normAns(o.c[field]), o.c[field]])).entries()]
      .filter(([k2]) => k2 && k2 !== normAns(answer)).map(([, v]) => v);
    let type = types[k % types.length];
    if (type === "mc" && others.length < 2) type = types.includes("tf") && others.length >= 1 ? "tf" : "written";
    if (type === "tf" && others.length < 1) type = "written";
    const q = {deckId: x.deckId, cardId: x.c.id, type, prompt, answer, fwd};
    if (type === "mc") q.options = shuffle([answer].concat(shuffle(others).slice(0, 3)));
    if (type === "tf") { q.truth = Math.random() < 0.5; q.shown = q.truth ? answer : shuffle(others)[0]; }
    return q;
  });
  return qs;
}
// A quiz name no other quiz has yet
function uniqueQuizTitle(t){
  t = String(t || "").trim() || "Practice Quiz";
  const have = new Set(quizzesAll().concat(quizzesAll(true)).map(x => String(x.qz.title || "").trim().toLowerCase()));
  if (!have.has(t.toLowerCase())) return t;
  const base = t.replace(/\s*\(\d+\)$/, ""); let n = 2;
  while (have.has((base + " (" + n + ")").toLowerCase())) n++;
  return (base + " (" + n + ")").slice(0, 120);
}
// The choices made last time
const QZ_OPTS_KEY = "studyboard:quizOpts";
function quizOpts(){
  let o = {}; try { o = JSON.parse(localStorage.getItem(QZ_OPTS_KEY) || "{}") || {}; } catch (e) {}
  const qt = Array.isArray(o.qt) ? o.qt.filter(t => ["mc", "tf", "written"].includes(t)) : [];
  return {qn: ["5", "10", "20", "all"].includes(o.qn) ? o.qn : "10", qt: qt.length ? qt : ["mc", "tf", "written"], qd: ["fwd", "rev", "mix"].includes(o.qd) ? o.qd : "fwd"};
}
// Make a Quiz: the options you pick
function quizSheet(deckIds){
  const ds = decksArr().filter(d => d.cards.length);
  if (!ds.length) { toast("Add cards to a deck first"); return; }
  const sel = new Set(deckIds && deckIds.length ? deckIds : [ds[0].id]), ai = aiReady(), last = quizOpts();
  openSheet(`<form class="sheet">${head(ai ? `Make a Quiz with ${aiWho("AI")}` : "Make a Quiz")}
    <div class="sheet-body">
      <fieldset><legend>Decks</legend><div class="check-list">${ds.map(d => `<label class="mi-check"><input type="checkbox" name="deck" value="${esc(d.id)}" ${sel.has(d.id) ? "checked" : ""}> ${esc(d.name)} <span class="mini">${d.cards.length} cards</span></label>`).join("")}</div></fieldset>
      <label class="f"><span class="lh">Quiz Name</span><input type="text" name="qname" maxlength="120" value="${esc(uniqueQuizTitle((state.decks[[...sel][0]] || ds[0]).name + " Quiz"))}"></label>
      <fieldset><legend>Questions</legend>${seg("qn", [["5", "5"], ["10", "10"], ["20", "20"], ["all", "All"]], last.qn)}</fieldset>
      <fieldset><legend>Question Types</legend><div class="check-list row">
        <label class="mi-check"><input type="checkbox" name="qt" value="mc"${last.qt.includes("mc") ? " checked" : ""}> Multiple choice</label>
        <label class="mi-check"><input type="checkbox" name="qt" value="tf"${last.qt.includes("tf") ? " checked" : ""}> True or false</label>
        <label class="mi-check"><input type="checkbox" name="qt" value="written"${last.qt.includes("written") ? " checked" : ""}> Written answer</label></div></fieldset>
      <fieldset><legend>Ask With</legend>${seg("qd", [["fwd", "Front, answer back"], ["rev", "Back, answer front"], ["mix", "Mixed"]], last.qd)}</fieldset>
      <p class="mini" style="margin:0">${ai ? `${esc(aiWho("AI"))} writes the questions from these cards, and you check them before the quiz is saved to Quizzes.` : "The questions come straight from your cards. Set up AI in Settings to have them written for you."}</p>
      <p class="status-msg" id="mqStatus" style="margin:0" aria-live="polite"></p>
    </div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit id="mqGo">${ai ? AI_ICON + " " : ""}Make Quiz</button></div>
  </form>`, fd => {
    const decks = fd.getAll("deck"), types = fd.getAll("qt"), n = fd.get("qn") || "10", dir = fd.get("qd") || "fwd", title = String(fd.get("qname") || "").trim().slice(0, 120) || "Practice Quiz";
    if (!decks.length) { toast("Pick at least one deck"); return false; }
    if (!types.length) { toast("Pick at least one question type"); return false; }
    try { localStorage.setItem(QZ_OPTS_KEY, JSON.stringify({qn: n, qt: types, qd: dir})); } catch (e) {}
    const cardsIn = decks.reduce((t, id) => t + (state.decks[id] ? state.decks[id].cards.length : 0), 0);
    if (cardsIn < 2) { toast("A quiz needs at least 2 cards"); return false; }
    if (ai) { quizFromCardsAi(decks, n, types, dir, title); return false; }
    quizFromCardsLocal(decks, n, types, dir, title); return true;
  });
}
const QZ_TYPES = {mc: "multiple choice (one best answer, or select all that apply)", tf: "true or false", written: "short written answer"};
async function quizFromCardsAi(decks, n, types, dir, title){
  const st = $("#mqStatus"), go = $("#mqGo"); if (go && go.disabled) return;
  const cards = []; decks.forEach(id => { const d = state.decks[id]; if (d) d.cards.forEach(c => { if (c.front.trim() && c.back.trim() && !c.draft) cards.push({d, c}); }); });
  const count = n === "all" ? Math.min(40, cards.length) : Number(n) || 10, first = state.decks[decks[0]], course = courseOf(first.courseId);
  const text = decks.map(id => { const d = state.decks[id]; return d ? `Flashcards in the deck "${d.name}":\n` + d.cards.filter(c => c.front.trim() && c.back.trim()).map(c => `Front: ${c.front}\nBack: ${c.back}`).join("\n\n") : ""; }).join("\n\n");
  const ask = dir === "rev" ? "Ask from the backs of the cards; the answers are on the fronts." : dir === "mix" ? "Mix questions asked from the fronts and from the backs." : "Ask from the fronts of the cards; the answers are on the backs.";
  const style = `A quiz on these flashcards. Use only these question types: ${types.map(t => QZ_TYPES[t]).join(", ")}. ${ask} Every question tests one card or a link between cards, using only what the cards say.`;
  if (go) { go.disabled = true; go.classList.add("busy"); }
  if (st) st.innerHTML = `<span class="ai-spin" aria-hidden="true"></span> ${esc(aiWho("AI"))} is writing ${count} question${count === 1 ? "" : "s"}…`;
  try {
    const r = await aiMakeStudySet({sources: [{name: first.name, kind: "Text", size: text.length, part: {text}}], style, difficulty: "mixed", cards: false, quiz: true, cases: false, quizCount: String(count), courseName: course ? courseLabel(course) : ""});
    if (!r.questions.length) throw aiErr("empty", "The AI couldn't write questions from these cards. Try again, or add more cards.");
    r.quizTitle = title;
    aiReviewSheet(r, {deck: first, courseId: first.courseId, style, styleName: title, sources: decks.map(id => (state.decks[id] || {}).name || ""), fromCards: decks});
  } catch (e) {
    if (e && e.code === "cancelled") return;
    if (st) st.textContent = (e && e.code ? e.message : "Something went wrong. Try again.") + " ";
    if (go) { go.disabled = false; go.classList.remove("busy"); }
  }
}
// Without AI: the questions are made from the cards here, in the same form
function quizFromCardsLocal(decks, n, types, dir, title){
  const qs = aiCleanQuestions(buildQuiz(decks, n, types, dir).map(q => q.type === "mc" ? {type: "single", stem: q.prompt, options: q.options, correct: [q.options.indexOf(q.answer)]}
    : q.type === "tf" ? {type: "truefalse", stem: `${q.prompt}\nAnswer: ${q.shown}`, options: ["True", "False"], correct: [q.truth ? 0 : 1]}
    : {type: "short", stem: q.prompt, answer: q.answer}));
  if (!qs.length) { toast("Couldn't make questions from these cards"); return; }
  const d = clone(state.decks[decks[0]]); if (!d) return;
  const qid = uid(), name = uniqueQuizTitle(title);
  d.aiQuizzes = (d.aiQuizzes || []).concat({id: qid, title: name, style: "", created: Date.now(), sources: decks.map(id => (state.decks[id] || {}).name || ""), questions: qs, results: []}); d.updated = Date.now();
  ui.deckId = null;
  saveDeck(d, `Saved ${name} to Quizzes`);
  startAiQuiz(d.id, qid);
}
function startQuiz(questions, deckIds, opts){
  ui.tab = "flashcards"; ui.fc = {mode: "quiz", deckIds, opts, qs: questions, i: 0, ans: []};
  render(); window.scrollTo(0, 0);
  setTimeout(() => { const w = $("#qWritten"); if (w) w.focus(); }, 30);
}
function answerQuiz(given, pre){
  const f = ui.fc, q = f.qs[f.i]; if (!q || f.ans[f.i]) return;
  let r;
  if (q.type === "mc") r = {given, correct: normAns(given) === normAns(q.answer)};
  else if (q.type === "tf") r = {given, correct: (given === "true") === q.truth};
  else r = Object.assign({given}, pre || gradeWritten(given, q.answer));
  f.ans[f.i] = r;
  const d = state.decks[q.deckId] && clone(state.decks[q.deckId]);
  if (d) { const c = d.cards.find(x => x.id === q.cardId); if (c) { if (r.correct) c.right++; else { c.wrong++; c.box = Math.max(0, c.box - 1); c.due = todayISO(); c.seen = Math.max(1, c.seen); } saveDeck(d, null); } }
  render();
}
function finishQuiz(){
  const f = ui.fc; f.done = true;
  const byDeck = {};
  f.qs.forEach((q, i) => { const b = byDeck[q.deckId] = byDeck[q.deckId] || {score: 0, total: 0}; b.total++; if (f.ans[i] && f.ans[i].correct) b.score++; });
  const changes = Object.entries(byDeck).map(([id, r]) => { const d = clone(state.decks[id]); if (!d) return null; d.quizzes = d.quizzes.concat({at: Date.now(), score: r.score, total: r.total}).slice(-20); return {kind: "deck", id, after: d}; }).filter(Boolean);
  applyChanges(changes, null);
  const sc = Object.values(byDeck).reduce((a, r) => a + r.score, 0), tot = Object.values(byDeck).reduce((a, r) => a + r.total, 0);
  if (tot > 0 && sc / tot >= 0.8) { try { celebrate("check"); } catch (e) {} }
  if (quizPasses(sc, tot)) earnBump("q");
}
function viewQuiz(){
  const f = ui.fc, q = f.qs[f.i], a = f.ans[f.i];
  if (!q) {
    if (!f.done) finishQuiz();
    const right = f.ans.filter(x => x && x.correct).length, total = f.qs.length, pct = total ? Math.round(right / total * 100) : 0;
    const missed = f.qs.map((x, i) => ({x, a: f.ans[i]})).filter(y => !(y.a && y.a.correct));
    const msg = pct >= 90 ? "Excellent. You know this material." : pct >= 75 ? "Solid. Review the few you missed." : pct >= 50 ? "Getting there. Study the missed cards, then try again." : "Keep going. Study these cards, then retake the quiz.";
    return `<div class="view-head"><h2>Quiz Results</h2></div>
      <section class="done-card">
        <p class="big-num">${right}<span> / ${total} correct, ${pct}%</span></p>
        <div class="score-bar"><i style="width:${pct}%"></i></div>
        <p>${msg}</p>
        <div class="row-actions">${missed.length ? `<button class="btn primary" data-act="fc-retry-missed">Retry the ${missed.length} Missed</button><button class="btn" data-act="fc-study-missed">Study Missed Cards</button>` : ""}<button class="btn ${missed.length ? "" : "primary"}" data-act="fc-new-quiz">New Quiz</button><button class="btn" data-act="fc-exit">Done</button></div>
      </section>
      ${missed.length ? `<h3 class="fsec">Missed Questions</h3><ul class="miss-list">${missed.map(y => `<li><span class="q">${esc(y.x.prompt)}</span><span class="a">Answer: <b>${esc(y.x.answer)}</b></span>${y.a && y.a.given && y.x.type !== "tf" ? `<span class="mini">You answered: ${esc(y.a.given)}</span>` : y.x.type === "tf" ? `<span class="mini">Shown: ${esc(y.x.shown)} (${y.x.truth ? "true" : "false"})</span>` : ""}</li>`).join("")}</ul>` : ""}`;
  }
  const d = state.decks[q.deckId];
  const kind = q.fwd ? ["Front", "back"] : ["Back", "front"];
  let body = "";
  if (q.type === "mc") body = `<div class="mc">${q.options.map((o, i) => {
      const cls = a ? (normAns(o) === normAns(q.answer) ? "right" : normAns(o) === normAns(a.given) ? "wrong" : "") : "";
      return `<button class="opt ${cls}" data-act="fc-answer" data-val="${esc(o)}" ${a ? "disabled" : ""}><span class="key">${"ABCD"[i]}</span><span>${esc(o)}</span></button>`; }).join("")}</div>`;
  else if (q.type === "tf") body = `<div class="tf-pair"><span class="mini">Matching ${kind[1]}</span><p>${esc(q.shown)}</p></div>
      <div class="mc two-col">${[["true", "True"], ["false", "False"]].map(([v, l]) => { const isRight = (v === "true") === q.truth; const cls = a ? (isRight ? "right" : a.given === v ? "wrong" : "") : ""; return `<button class="opt ${cls}" data-act="fc-answer" data-val="${v}" ${a ? "disabled" : ""}><span class="key">${l[0]}</span><span>${l}</span></button>`; }).join("")}</div>`;
  else body = `<form class="written" id="qForm"><label class="f">Your answer<input type="text" id="qWritten" autocomplete="off" ${a ? `value="${esc(a.given)}" disabled` : ""} data-noenter></label>${a ? "" : `<button type="submit" class="btn primary">Check</button>`}</form>`;
  const fb = a ? `<div class="feedback ${a.correct ? "ok" : "no"}" role="status"><b>${a.correct ? (a.close ? "Close enough, counted as correct." : "Correct.") : "Not quite."}</b>${a.correct && !a.close ? "" : ` The answer is <span class="ans">${esc(q.answer)}</span>.`}${!a.correct && q.type === "written" ? ` <button class="link-btn" data-act="fc-override">I Was Right</button>` : ""}${a.ai ? `<p class="ai-fb">${AI_ICON}${esc(a.ai)}</p>` : ""}</div>
      ${explainHtml(`c|${q.deckId}|${q.cardId}`, q.type === "written" ? a.given : "")}
      <div class="row-actions"><button class="btn primary" data-act="fc-next" id="qNext">${f.i + 1 < f.qs.length ? "Next Question" : "See Results"}</button></div>` : "";
  return `<div class="view-head"><h2>Quiz</h2><span class="mini">Question ${f.i + 1} of ${f.qs.length}</span><button class="btn small" data-act="fc-exit">Quit</button></div>
    <div class="progress"><i style="width:${Math.round(f.i / f.qs.length * 100)}%"></i></div>
    <section class="q-card" style="--c:${esc(colorOf(d ? d.courseId : ""))}">
      <span class="face-label">${q.type === "mc" ? `Pick the ${kind[1]}` : q.type === "tf" ? "True or false" : `Type the ${kind[1]}`}</span>
      <p class="q-prompt">${esc(q.prompt)}</p>
      ${f.grading ? `<p class="status-msg"><span class="ai-spin" aria-hidden="true"></span> Checking your answer…</p>` : ""}
      ${body}${fb}
    </section>`;
}
function fcKey(e){
  if (ui.tab !== "flashcards" || !ui.fc || dlg.open || e.target.closest("input,textarea,select")) return false;
  const f = ui.fc;
  if (f.mode === "study" && (e.key === "z" || e.key === "Z" || e.key === "Backspace") && !e.altKey && f.hist && f.hist.length) { e.preventDefault(); undoRate(); return true; }
  if (f.mode === "study" && f.q[f.i]) {
    if (e.key === " " || e.key === "Enter") { if (!f.flipped) { e.preventDefault(); f.flipped = true; render(); return true; } }
    if (f.flipped && ["1", "2", "3", "4"].includes(e.key)) { e.preventDefault(); rateCard(["again", "hard", "good", "easy"][Number(e.key) - 1]); return true; }
  }
  if (f.mode === "quiz" && f.qs[f.i]) {
    const q = f.qs[f.i];
    if (f.ans[f.i] && e.key === "Enter") { e.preventDefault(); f.i++; render(); setTimeout(() => { const w = $("#qWritten"); if (w) w.focus(); }, 20); return true; }
    if (!f.ans[f.i] && q.type === "mc" && ["1", "2", "3", "4", "a", "b", "c", "d"].includes(e.key.toLowerCase())) { const k = "1234".includes(e.key) ? Number(e.key) - 1 : "abcd".indexOf(e.key.toLowerCase()); if (q.options[k] != null) { e.preventDefault(); answerQuiz(q.options[k]); return true; } }
    if (!f.ans[f.i] && q.type === "tf" && ["t", "f"].includes(e.key.toLowerCase())) { e.preventDefault(); answerQuiz(e.key.toLowerCase() === "t" ? "true" : "false"); return true; }
  }
  return false;
}
function fcAction(act, el){
  const id = el.dataset.id;
  switch (act) {
    case "fc-new": deckSheet(null); return true;
    case "fc-open": ui.deckId = id; ui.fc = null; render(); window.scrollTo(0, 0); return true;
    case "fc-back": ui.deckId = null; render(); return true;
    case "fc-edit": if (state.decks[id]) deckSheet(state.decks[id]); return true;
    case "fc-bulk": if (state.decks[id]) bulkSheet(state.decks[id]); return true;
    case "fc-add": if (state.decks[id]) addCardSheet(state.decks[id]); return true;
    case "fc-archive": { const d = state.decks[id]; if (d) applyChanges([{kind: "deck", id, after: Object.assign(clone(d), {archived: "Archived", updated: Date.now()})}], `Archived ${d.name}`); return true; }
    case "fc-unarchive": { const d = state.decks[id]; if (d) applyChanges([{kind: "deck", id, after: Object.assign(clone(d), {archived: null, updated: Date.now()})}], `Restored ${d.name}`); if (dlg.open && dlg.querySelector(".fc-arch-sheet")) { if (archivedDecks().length) archivedDecksSheet(); else dlg.close(); } return true; }
    case "fc-arch-open": archivedDecksSheet(); return true;
    case "fc-card": if (ui.deckId && state.decks[ui.deckId]) cardSheet(state.decks[ui.deckId], id); return true;
    case "fc-study": startStudy([id]); return true;
    case "fc-review-menu": reviewSheet(); return true;
    case "fc-review-all": if (el.closest("dialog")) dlg.close(); startStudy(reviewDecks(el.dataset.course)); return true;
    case "fc-review-start": startStudy(readyDecks(el.dataset.course)); return true;
    case "fc-quiz": quizSheet([id]); return true;
    case "fc-flip": if (ui.fc) { ui.fc.flipped = !ui.fc.flipped; render(); } return true;
    case "fc-rate": rateCard(id); return true;
    case "fc-undo": undoRate(); return true;
    case "fc-answer": answerQuiz(el.dataset.val); return true;
    case "fc-next": ui.fc.i++; render(); setTimeout(() => { const w = $("#qWritten"); if (w) w.focus(); }, 20); return true;
    case "fc-override": { const a = ui.fc.ans[ui.fc.i]; if (a) { a.correct = true; a.close = true; const q = ui.fc.qs[ui.fc.i]; const d = clone(state.decks[q.deckId]); const c = d && d.cards.find(x => x.id === q.cardId); if (c) { c.wrong = Math.max(0, c.wrong - 1); c.right++; saveDeck(d, null); } render(); } return true; }
    case "fc-exit": {
      const f = ui.fc, quiz = f && (f.mode === "quiz" || f.mode === "aiquiz"), left = quiz && f.qs[f.i] && f.ans.filter(Boolean).length;
      const leave = () => { if (ui.fc !== f) return; const aq = f && f.mode === "aiquiz", one = !aq && f && f.deckIds.length === 1 ? f.deckIds[0] : null; ui.fc = null; ui.deckId = one; render(); };
      if (left) confirmSheet("Quit This Quiz?", `You've answered ${left} of ${f.qs.length} question${f.qs.length === 1 ? "" : "s"}. If you quit now, this attempt isn't scored or saved.`, "Quit Quiz", leave);
      else leave();
      return true;
    }
    case "fc-study-again": startStudy(ui.fc.deckIds); return true;
    case "fc-quiz-from-study": quizSheet(ui.fc.deckIds); return true;
    case "fc-new-quiz": quizSheet(ui.fc.deckIds); return true;
    case "fc-retry-missed": { const f = ui.fc; const missed = f.qs.filter((q, i) => !(f.ans[i] && f.ans[i].correct)).map(q => Object.assign({}, q, q.options ? {options: shuffle(q.options.slice())} : {})); startQuiz(shuffle(missed), f.deckIds, f.opts); return true; }
    case "fc-study-missed": { const f = ui.fc; const ids = f.qs.filter((q, i) => !(f.ans[i] && f.ans[i].correct)).map(q => q.cardId); startStudy(f.deckIds, ids); return true; }
  }
  return false;
}
document.addEventListener("submit", e => {
  if (e.target.id === "fcAdd") {
    e.preventDefault();
    const d = state.decks[e.target.dataset.id]; if (!d) return;
    const front = $("#fcFront").value.trim(), back = $("#fcBack").value.trim();
    if (!front || !back) { toast(front ? "Add the back of the card" : "Add the front of the card"); (front ? $("#fcBack") : $("#fcFront")).focus(); return; }
    const nd = clone(d); nd.cards.push({id: uid(), front, back, box: 0, due: "", seen: 0, right: 0, wrong: 0}); nd.updated = Date.now();
    saveDeck(nd, "Card added");
    setTimeout(() => { const f = $("#fcFront"); if (f) { f.value = ""; $("#fcBack").value = ""; f.focus(); } }, 30);
  }
  if (e.target.id === "qForm") { e.preventDefault(); const v = $("#qWritten").value; if (!v.trim()) { $("#qWritten").focus(); return; }
    const f = ui.fc, q = f && f.qs[f.i]; if (!q || f.grading) return;
    f.grading = true; render();
    smartGrade(q.prompt, q.answer, v).then(r => { f.grading = false; if (ui.fc === f) { answerQuiz(v, r); setTimeout(() => { const n = $("#qNext"); if (n) n.focus(); }, 30); } }); }
});
document.addEventListener("keydown", e => {
  if (e.target.closest && e.target.closest("#fcAdd") && e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); e.target.closest("form").requestSubmit(); return; }
  if (fcKey(e)) e.stopPropagation();
}, true);

