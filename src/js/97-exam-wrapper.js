/* ===== module: 97-exam-wrapper.js: after an exam, a short reflection (an "exam wrapper") ===== */
/* After an exam or quiz mark is saved, a one-minute reflection: how you studied, when you started, and how ready you were
   (how ready you felt, and what your flashcards and quizzes said) next to the mark you got. Seeing the prediction next to
   the result is how students learn to judge their own readiness (exam wrappers, Lovett 2013), which also makes the
   measured readiness in examReadiness more useful. It's saved on the exam as t.wrap (synced), and the next exam shows
   what you wrote, so the lesson is there when it matters. */
(() => {
const SNAP_LS = "studyboard:readySnap", SKIP_LS = "studyboard:wrapSkip";
// How you studied, with how strongly research backs each one (3 strong, 0 weak), for the tip under the choices
const METHODS = [
  ["practice", "Practice questions or past exams", 3],
  ["cards", "Flashcards, testing myself", 3],
  ["spaced", "Short sessions over several days", 3],
  ["explain", "Explaining it out loud or teaching it", 2],
  ["summary", "Writing summaries or notes", 1],
  ["group", "Studying with others", 1],
  ["reread", "Rereading notes, slides or the textbook", 0],
  ["rewatch", "Rewatching lectures", 0],
  ["cram", "A long session the night before", 0]];
const STARTS = [["week", "More than a week before"], ["days", "3 to 7 days before"], ["short", "1 or 2 days before"], ["night", "The night before"]];
const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v && typeof v === "object" ? v : d; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const isExam = t => !!t && MILESTONE(t.type) && !t.prepFor;
const markOf = t => t && t.mark && Number(t.mark.outOf) > 0 && isNum(t.mark.got) ? Math.round(Number(t.mark.got) / Number(t.mark.outOf) * 100) : null;
const askOn = () => !(state.settings && state.settings.grades && state.settings.grades.wrap === false);

/* How ready you were when the exam happened: captured the moment it's marked done, before later studying changes it */
function snapNow(t){
  const xr = typeof examReadiness === "function" ? examReadiness(Object.assign({}, t, {status: "todo"})) : null;
  return {felt: xr ? xr.self : null, measured: xr ? xr.measured : null, at: Date.now()};
}
hook("changed", changes => {
  (changes || []).forEach(ch => {
    const t = ch && ch.kind === "task" ? ch.after : null;
    if (!isExam(t) || t.status !== "done" || !t.doneAt || Date.now() - t.doneAt > 10000) return;
    const m = lsGet(SNAP_LS, {}); if (m[t.id]) return;
    m[t.id] = snapNow(t);
    const keys = Object.keys(m).sort((a, b) => m[b].at - m[a].at); keys.slice(60).forEach(k => delete m[k]);
    lsSet(SNAP_LS, m);
  });
});
// Saved with the exam when it was marked done (synced); older exams fall back to this device's copy, then to now
const snapOf = t => t.wrap && (t.wrap.felt != null || t.wrap.measured != null) ? t.wrap : t.readySnap && t.readySnap.at ? t.readySnap : lsGet(SNAP_LS, {})[t.id] || snapNow(t);

// What the comparison says, in one or two sentences
function readOf(felt, measured, mark){
  if (mark == null) return "";
  if (felt != null && felt - mark >= 15) return `You felt more ready (${felt}%) than your mark shows (${mark}%). That's very common: material you've read feels known even when you can't recall it yet. Testing yourself before the next exam gives you a truer picture.`;
  if (measured != null && measured - mark >= 15) return `Your flashcards and quizzes said about ${measured}%, more than your mark. The exam may have asked things your cards don't cover, or in a different way: practice questions in the exam's format help next time.`;
  if (felt != null && mark - felt >= 15) return `You did better than you expected (${mark}%, after feeling ${felt}% ready). Your preparation worked, so you can trust your results a little more next time.`;
  if (felt != null || measured != null) return "How ready you were matched your mark closely. Judging your own readiness well is a real skill.";
  return "Next time, mark how ready you feel before the exam, or study this course's flashcards, to see how well you predict your mark.";
}
// A tip on how you studied, from what research says works
function tipOf(picked){
  if (!picked.length) return "";
  const has = k => picked.includes(k), test = has("practice") || has("cards") || has("explain");
  if ((has("practice") || has("cards")) && has("spaced") && !has("cram")) return "Testing yourself, spread over several days: that's the strongest combination research knows of. Keep it.";
  if (!test && (has("reread") || has("rewatch") || has("summary"))) return "Rereading and rewatching feel productive but stick less than testing yourself. Next time, try flashcards or practice questions for part of that time.";
  if (has("cram") && !has("spaced")) return "One long session the night before is the least effective way to study, and it costs sleep that helps you remember. Shorter sessions over several days work better.";
  if (test && !has("spaced")) return "Testing yourself was a good choice. Spreading it over several days, instead of one or two, makes it stick even better.";
  return "";
}

const bar = (label, v, cls) => `<div class="ewr-row ${cls}"><span class="ewr-l">${esc(label)}</span><span class="ewr-bar" role="img" aria-label="${esc(label)}: ${v == null ? "not measured" : v + " percent"}"><i style="width:${v == null ? 0 : Math.max(0, Math.min(100, v))}%"></i></span><b>${v == null ? "–" : v + "%"}</b></div>`;
function compareHtml(felt, measured, mark){
  return `<div class="ewr-cmp">${bar("How ready you felt", felt, "felt")}${bar("What your results said", measured, "meas")}${bar("Your mark", mark, "mark")}</div>`;
}

function open(id, back){
  const t = state.tasks[id]; if (!isExam(t)) return;
  const c = courseOf(t.courseId), mark = markOf(t), s = snapOf(t), w = t.wrap || {};
  const picked = new Set(w.methods || []);
  openSheet(`<form class="sheet ewr">${head("How Did It Go?")}
    <div class="sheet-body">
      <p style="margin:0"><b>${esc(t.title)}</b>${c ? ` <span class="tag">${esc(courseLabel(c))}</span>` : ""}<br><span class="mini">A minute now makes your next exam easier to prepare for.</span></p>
      ${compareHtml(s.felt, s.measured, mark)}
      <p class="ewr-read">${esc(readOf(s.felt, s.measured, mark))}</p>
      <fieldset class="ewr-fs"><legend>How did you study? <span class="hint">pick all that apply</span></legend>
        <div class="ewr-chips">${METHODS.map(([k, l]) => `<label class="ewr-chip"><input type="checkbox" name="m" value="${k}"${picked.has(k) ? " checked" : ""}><span>${esc(l)}</span></label>`).join("")}</div>
        <p class="ewr-tip" id="ewrTip" aria-live="polite"></p></fieldset>
      <fieldset class="ewr-fs"><legend>When did you start studying for it?</legend>
        <div class="ewr-chips">${STARTS.map(([k, l]) => `<label class="ewr-chip"><input type="radio" name="st" value="${k}"${w.start === k ? " checked" : ""}><span>${esc(l)}</span></label>`).join("")}</div></fieldset>
      <label class="f"><span class="lh">Next Time I'll… <span class="hint">optional, shown before your next exam</span></span><input type="text" name="next" maxlength="200" value="${esc(w.next || "")}" placeholder="e.g. start practice questions a week earlier" data-noenter></label>
      <label class="mi-check"><input type="checkbox" id="ewrAsk"${askOn() ? " checked" : ""}> Ask me after each exam or quiz</label>
    </div>
    <div class="sheet-foot"><button type="button" class="btn" id="ewrSkip">Skip</button><span class="spacer"></span><button type="button" class="btn primary" data-submit>Save Reflection</button></div></form>`, (fd) => {
    const cur = state.tasks[id]; if (!cur) return;
    const n = clone(cur);
    n.wrap = {at: Date.now(), methods: fd.getAll("m").map(String).filter(k => METHODS.some(x => x[0] === k)), start: String(fd.get("st") || ""), next: String(fd.get("next") || "").trim().slice(0, 200), felt: s.felt, measured: s.measured, mark};
    saveAsk();
    dlg.close();
    applyChanges([{kind: "task", id, after: n}], "Reflection saved. You'll see it before your next exam.");
    if (back) setTimeout(back, 40);
    return false;
  });
  const tipEl = $("#ewrTip"), tip = () => { tipEl.textContent = tipOf([...dlg.querySelectorAll('input[name="m"]:checked')].map(i => i.value)); };
  dlg.querySelectorAll('input[name="m"]').forEach(i => i.addEventListener("change", tip)); tip();
  const saveAsk = () => { const on = $("#ewrAsk").checked; if (on !== askOn()) { state.settings = Object.assign({}, state.settings, {grades: Object.assign({}, (state.settings && state.settings.grades) || {}, {wrap: on})}); saveSettings(); } };
  $("#ewrSkip").addEventListener("click", () => { saveAsk(); skip(id); dlg.close(); scheduleRender(); if (back) setTimeout(back, 40); });
}
// Offered right after a first mark is saved, once per exam
const should = id => { const t = state.tasks[id]; return isExam(t) && !t.wrap && askOn() && !lsGet(SKIP_LS, {})[id]; };

// The most recent reflection before this exam: the same course first, any course otherwise
function lastWrap(ex){
  const all = Object.values(state.tasks || {}).filter(t => t.id !== ex.id && isExam(t) && t.wrap && Number(t.wrap.at) > 0).sort((a, b) => b.wrap.at - a.wrap.at);
  return all.find(t => ex.courseId && t.courseId === ex.courseId) || all[0] || null;
}
const pctTxt = v => v == null ? "not measured" : v + "%";
function lastHtml(prev){
  const w = prev.wrap, ms = (w.methods || []).map(k => (METHODS.find(x => x[0] === k) || [])[1]).filter(Boolean);
  return `<div class="ewr-last" role="note"><b>Last time: ${esc(prev.title)}</b><span>You felt ${esc(pctTxt(w.felt))} ready, your results said ${esc(pctTxt(w.measured))}, and you got ${esc(pctTxt(w.mark))}.</span>${ms.length ? `<span>You studied by: ${esc(ms.join(", ").toLowerCase())}.</span>` : ""}${w.next ? `<span>You said next time you'd: <i>${esc(w.next)}</i></span>` : ""}</div>`;
}
// In an exam's view: before it, what you wrote last time; after it, your reflection (or a way to add one)
function viewHtml(t){
  if (!isExam(t)) return "";
  if (t.status !== "done") { const prev = lastWrap(t); return prev ? lastHtml(prev) : ""; }
  if (t.wrap) return `<div class="ewr-last ewr-mine" role="note"><b>Your reflection</b><span>You felt ${esc(pctTxt(t.wrap.felt))} ready, your results said ${esc(pctTxt(t.wrap.measured))}, and you got ${esc(pctTxt(t.wrap.mark))}.</span>${t.wrap.next ? `<span>Next time: <i>${esc(t.wrap.next)}</i></span>` : ""}<button type="button" class="link-btn" data-act="ewr-open" data-id="${esc(t.id)}">Edit</button></div>`;
  return markOf(t) != null ? `<button type="button" class="btn small ewr-btn" data-act="ewr-open" data-id="${esc(t.id)}">Reflect on This ${esc(t.type)}</button>` : "";
}
/* Which flashcards count toward this exam's readiness: Automatic (Studyboard matches the exam's topics, from its notes, the
   school site and announcements, to your decks; or the cards since the last exam; or the whole course), or the decks you pick */
function decksSheet(id){
  const t = state.tasks[id]; if (!isExam(t)) return;
  const ev = examEvidence(Object.assign({}, t, {readyDecks: []})), picked = new Set(t.readyDecks || []), mine = !!picked.size;
  const qn = ev.quizN ? ` and ${ev.quizN} quiz${ev.quizN === 1 ? "" : "zes"}` : "";
  const aiNames = ev.how === "ai" ? (t.aiDecks.ids || []).map(i => (state.decks[i] || {}).name).filter(Boolean) : [];
  const how = ev.how === "ai" ? `uses what ${aiWho() || "Automatic AI"} matched to this exam's topics: ${aiNames.slice(0, 4).join(", ")}${aiNames.length > 4 ? ` and ${aiNames.length - 4} more` : ""} (${ev.cards.length} card${ev.cards.length === 1 ? "" : "s"}${qn})` : ev.how === "topics" ? `matches this exam's topics (${ev.terms && ev.terms.length ? ev.terms.slice(0, 5).join(", ") : "from its notes"}) to ${ev.cards.length} card${ev.cards.length === 1 ? "" : "s"}${qn}` : ev.how === "since" ? `uses the ${ev.cards.length} cards${qn} added since ${ev.prev}` : ev.how === "course" ? `uses every flashcard and quiz in this course` : "has no flashcards or quizzes in this course to use";
  // flashcard decks and quizzes made from slides, notes or your own questions, this course's first
  const decks = decksArr().slice().sort((a, b) => (b.courseId === t.courseId) - (a.courseId === t.courseId));
  openSheet(`<form class="sheet xr-sheet">${head("Which Flashcards and Quizzes Count?")}
    <div class="sheet-body">
      <p style="margin:0">For <b>${esc(t.title)}</b>, readiness is measured from the flashcards and practice quizzes that cover it.</p>
      <label class="mi-check"><input type="radio" name="xrm" value="auto"${mine ? "" : " checked"}> <span><b>Automatic.</b> Right now Studyboard ${esc(how)}.</span></label>
      <label class="mi-check"><input type="radio" name="xrm" value="pick"${mine ? " checked" : ""}> <span><b>Only the decks I pick:</b></span></label>
      <div class="xr-decks" id="xrDecks">${decks.length ? decks.map(d => { const c = courseOf(d.courseId); return `<label class="mi-check"><input type="checkbox" name="d" value="${esc(d.id)}"${picked.has(d.id) ? " checked" : ""}> <span>${esc(d.name)} <span class="mini">${isQuizHolder(d) ? (n => `${n} quiz${n === 1 ? "" : "zes"}`)((d.aiQuizzes || []).length) : `${d.cards.length} card${d.cards.length === 1 ? "" : "s"}`}${c ? " · " + esc(courseLabel(c)) : ""}</span></span></label>`; }).join("") : `<p class="mini">You don't have any flashcards or quizzes yet.</p>`}</div>
    </div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>Save</button></div></form>`, fd => {
    const cur = state.tasks[id]; if (!cur) return;
    const ids = fd.get("xrm") === "pick" ? fd.getAll("d").map(String) : [];
    if (fd.get("xrm") === "pick" && !ids.length) { toast("Pick at least one deck, or choose Automatic"); return false; }
    const n = clone(cur); if (ids.length) n.readyDecks = ids; else delete n.readyDecks;
    dlg.close(); applyChanges([{kind: "task", id, after: n}], ids.length ? `Readiness for ${cur.title} now uses ${ids.length} deck${ids.length === 1 ? "" : "s"}` : "Readiness is automatic again");
    return false;
  });
  // the decks stay clickable: ticking one switches to "Only the decks I pick"; Automatic dims them
  const box = $("#xrDecks"), sync = () => box.classList.toggle("auto", !dlg.querySelector('input[name="xrm"][value="pick"]').checked);
  dlg.querySelectorAll('input[name="xrm"]').forEach(i => i.addEventListener("change", sync));
  box.querySelectorAll("input").forEach(i => i.addEventListener("change", () => { if (i.checked) dlg.querySelector('input[name="xrm"][value="pick"]').checked = true; sync(); }));
  sync();
}
// Exams with a mark (from any source: the mark sheet, the task form, Paste Grades, school sync) and no reflection yet, newest
// first. Today's Plan offers them under Heads Up until reflected on or skipped. Only recent exams, so old marks don't pile up.
function pending(){
  if (!askOn()) return [];
  const skip = lsGet(SKIP_LS, {}), from = addDays(todayISO(), -30);
  return Object.values(state.tasks || {}).filter(t => isExam(t) && !t.wrap && !skip[t.id] && markOf(t) != null && (t.due || "") >= from && (t.status === "done" || (t.due || "") <= todayISO()))
    .sort((a, b) => (b.due || "").localeCompare(a.due || ""));
}
const skip = id => { const k = lsGet(SKIP_LS, {}); k[id] = Date.now(); lsSet(SKIP_LS, k); };
hook("act", (act, el, id) => {
  if (act === "ewr-open") { if (dlg.open) dlg.close(); setTimeout(() => open(id), 30); return true; }
  if (act === "xr-decks") { if (dlg.open) dlg.close(); setTimeout(() => decksSheet(id), 30); return true; }
  if (act === "ewr-skip") { skip(id); scheduleRender(); toast("Skipped. You can still reflect from the exam's details."); return true; }
});
window.SBWRAP = {open, should, viewHtml, lastWrap, readOf, tipOf, pending, markOf, METHODS};
})();
