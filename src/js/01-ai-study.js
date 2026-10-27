/* ===== module: 01-ai-study.js: the app's core, AI study helpers: explain, grade by meaning, weak spots, case studies, summaries, photos to notes, ask your course ===== */
/* Explain this card or question */
const EXPLAIN_SCHEMA = {type: "OBJECT", properties: {
  explanation: {type: "STRING", description: "2 to 4 plain sentences"}, analogy: {type: "STRING"}, memoryTip: {type: "STRING", description: "A mnemonic or memory hook"},
  example: {type: "STRING", description: "A short real-world example"}, mistake: {type: "STRING", description: "The common mistake or confusion, if any"}}, required: ["explanation"]};
// key: "c|deckId|cardId" for a flashcard
function explainTarget(key){
  const [k, deckId, a, b] = key.split("|"), d = state.decks[deckId]; if (!d) return null;
  if (k === "c") { const c = d.cards.find(x => x.id === a); return c ? {d, item: c, prompt: c.front, answer: c.back} : null; }
  const qz = (d.aiQuizzes || []).find(x => x.id === a), q = qz && qz.questions.find(x => x.id === b);
  if (!q) return null;
  const ans = q.type === "short" ? q.answer : q.type === "order" ? q.correct.map((i, n) => `${n + 1}. ${q.options[i]}`).join("; ") : q.correct.map(i => q.options[i]).join("; ");
  return {d, qz, item: q, prompt: (qz.scenario ? `Case: ${qz.scenario}\n` : "") + (q.update ? q.update + "\n" : "") + q.stem + (q.options.length ? "\nOptions: " + q.options.join(" | ") : ""), answer: ans, rationale: q.rationale};
}
function explainHtml(key, given){
  if (!aiReady()) return "";
  const x = explainTarget(key); if (!x) return "";
  const st = ui.explain && ui.explain.key === key ? ui.explain : null;
  const data = x.item.explain;
  if (data) return `<div class="explain">${AI_ICON}<div>
      <p>${esc(data.explanation)}</p>
      ${data.analogy ? `<p><b>Think of it like this:</b> ${esc(data.analogy)}</p>` : ""}
      ${data.example ? `<p><b>Example:</b> ${esc(data.example)}</p>` : ""}
      ${data.memoryTip ? `<p><b>Memory tip:</b> ${esc(data.memoryTip)}</p>` : ""}
      ${data.mistake ? `<p><b>Watch out for:</b> ${esc(data.mistake)}</p>` : ""}
    </div></div>`;
  if (st && st.busy) return `<p class="explain-wait"><span class="ai-spin" aria-hidden="true"></span> Explaining…</p>`;
  return `<div class="explain-row"><button class="btn small ai-btn" data-act="ai-explain" data-key="${esc(key)}" data-given="${esc(given || "")}">${AI_ICON} ${key[0] === "q" ? "Explain More" : "Explain This"}</button>${st && st.err ? `<span class="mini">${esc(st.err)}</span>` : ""}</div>`;
}
async function runExplain(key, given){
  const x = explainTarget(key); if (!x) return;
  ui.explain = {key, busy: true}; render();
  try {
    const c = courseOf(x.d.courseId);
    const r = await aiCall({task: "explain", fast: true, maxTokens: 2500, temperature: 0.4, schema: EXPLAIN_SCHEMA, parts: [{text: `Course: ${c ? c.name : x.d.name}\nQuestion or card front: ${x.prompt}\nCorrect answer: ${x.answer}${x.rationale ? `\nRationale given: ${x.rationale}` : ""}${given ? `\nThe student answered: ${given}` : ""}`}],
      system: "You're a patient tutor. Explain why the answer is right so it sticks: plain words first, then an analogy, a quick example, a memory tip, and the usual mistake (address the student's answer if they got it wrong). Keep every part short. Don't repeat the question. Return JSON only."});
    const d = clone(state.decks[x.d.id]);
    const item = key[0] === "c" ? d.cards.find(y => y.id === x.item.id) : d.aiQuizzes.find(y => y.id === x.qz.id).questions.find(y => y.id === x.item.id);
    item.explain = {explanation: String(r.data.explanation || ""), analogy: String(r.data.analogy || ""), example: String(r.data.example || ""), memoryTip: String(r.data.memoryTip || ""), mistake: String(r.data.mistake || "")};
    if (ui.fc && ui.fc.qs) ui.fc.qs.forEach(q => { if (q.id === x.item.id) q.explain = item.explain; });
    ui.explain = null; saveDeck(d, null);
  } catch(e) { ui.explain = {key, err: e.message || "Couldn't explain that."}; render(); }
}

/* Grading typed answers by meaning */
const GRADE_SCHEMA = {type: "OBJECT", properties: {verdict: {type: "STRING", enum: ["correct", "partly", "incorrect"]}, feedback: {type: "STRING", description: "One or two sentences to the student"}}, required: ["verdict", "feedback"]};
async function aiGrade(question, expected, given){
  const r = await aiCall({task: "grade", fast: true, maxTokens: 800, temperature: 0, schema: GRADE_SCHEMA, parts: [{text: `Question: ${question}\nExpected answer: ${expected}\nStudent's answer: ${given}`}],
    system: "Grade a student's short typed answer by meaning, not wording. Accept synonyms, abbreviations, reasonable spelling mistakes, and fuller answers that are still correct. Use 'partly' when the key idea is there but something required is missing or slightly off, and 'incorrect' when the main idea is wrong or missing. Feedback speaks to the student in one or two sentences: what they got right and what was missing or wrong. Return JSON only."});
  const v = ["correct", "partly", "incorrect"].includes(r.data.verdict) ? r.data.verdict : "incorrect";
  return {correct: v === "correct", partly: v === "partly", ai: String(r.data.feedback || "").trim()};
}
// Local check first; only ask the AI when the answer doesn't match word for word
async function smartGrade(question, expected, given){
  const local = gradeWritten(given, expected);
  if (local.correct || !aiReady()) return local;
  try { return await aiGrade(question, expected, given); } catch(e) { console.warn(e); return local; }
}

/* Weak spots */
function weakSpots(deckIds){
  const cards = [], qs = [];
  deckIds.forEach(id => {
    const d = state.decks[id]; if (!d) return;
    d.cards.forEach(c => { if (c.seen > 0 && c.wrong > 0 && (c.wrong >= c.right || c.box <= 1)) cards.push({d, c, s: c.wrong * 2 - c.right + (c.box <= 1 ? 1 : 0)}); });
    (d.aiQuizzes || []).forEach(qz => qz.questions.forEach(q => { if ((q.miss || 0) > 0 && (q.miss || 0) >= (q.tries || 0) - (q.miss || 0)) qs.push({d, qz, q, s: q.miss * 2 - ((q.tries || 0) - q.miss)}); }));
  });
  cards.sort((a, b) => b.s - a.s); qs.sort((a, b) => b.s - a.s);
  return {cards, qs, n: cards.length + qs.length};
}
function weakSheet(deckIds){
  const w = weakSpots(deckIds);
  const topics = [...new Set(w.qs.map(x => x.q.topic).filter(Boolean))];
  if (!w.n) { toast("No weak spots yet. Study or take a quiz first, and anything you keep missing shows up here."); return; }
  const single = deckIds.length === 1 ? state.decks[deckIds[0]] : null;
  openSheet(`<form class="sheet ai-sheet">${head("Practice Your Weak Spots")}
    <div class="sheet-body">
      <p style="margin:0">You keep missing <b>${w.cards.length}</b> card${w.cards.length === 1 ? "" : "s"}${w.qs.length ? ` and <b>${w.qs.length}</b> practice question${w.qs.length === 1 ? "" : "s"}` : ""}${topics.length ? `, mostly on ${esc(topics.slice(0, 4).join(", "))}` : ""}.</p>
      <ul class="weak-list">${w.cards.slice(0, 6).map(x => `<li><b>${esc(x.c.front)}</b><span class="mini">Missed ${x.c.wrong} time${x.c.wrong === 1 ? "" : "s"}</span></li>`).join("")}${w.qs.slice(0, 4).map(x => `<li><b>${esc(x.q.stem.slice(0, 120))}</b><span class="mini">Missed ${x.q.miss} of ${x.q.tries || x.q.miss}</span></li>`).join("")}</ul>
      ${aiReady() ? `<fieldset><legend>New Questions on These Concepts</legend><p class="mini" style="margin:0 0 8px">AI writes fresh questions on the same ideas from new angles, so you learn the concept, not one question.</p>${seg("wkN", [["8", "8"], ["12", "12"], ["20", "20"]], "12")}</fieldset>${aiModelBar()}` : `<p class="mini" style="margin:0">Turn on AI Features in Settings to get new questions written on these concepts.</p>`}
      <p class="status-msg" id="wkStatus" style="margin:0" aria-live="polite"></p>
    </div>
    <div class="sheet-foot"><button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span>${w.cards.length ? `<button type="button" class="btn" id="wkStudy">Study These Cards</button>` : ""}${aiReady() ? `<button type="button" class="btn primary" id="wkGo">${AI_ICON} Make a Quiz</button>` : ""}</div>
  </form>`);
  const st = $("#wkStudy"); if (st) st.addEventListener("click", () => { dlg.close(); const ids = [...new Set(w.cards.map(x => x.d.id))]; startStudy(ids, w.cards.map(x => x.c.id)); });
  const go = $("#wkGo"); if (!go) return;
  go.addEventListener("click", async () => {
    const n = (dlg.querySelector("input[name=wkN]:checked") || {}).value || "12", status = $("#wkStatus");
    go.disabled = true; go.classList.add("busy"); status.innerHTML = `<span class="ai-spin" aria-hidden="true"></span> Writing questions on your weak spots…`;
    const home = single || w.cards.concat(w.qs).map(x => x.d).sort((a, b) => w.cards.concat(w.qs).filter(x => x.d === b).length - w.cards.concat(w.qs).filter(x => x.d === a).length)[0];
    const material = w.cards.slice(0, 40).map(x => `Card: ${x.c.front} => ${x.c.back} (missed ${x.c.wrong}x)`).concat(w.qs.slice(0, 25).map(x => `Missed question${x.q.topic ? ` [${x.q.topic}]` : ""}: ${x.q.stem} Correct: ${x.q.type === "short" ? x.q.answer : x.q.correct.map(i => x.q.options[i]).join("; ")}`)).join("\n");
    try {
      const r = await aiCall({task: "quiz", maxTokens: 24000, schema: QUIZ_SCHEMA, onStatus: m => { status.textContent = m; }, parts: [{text: `Concepts this student keeps missing:\n${material}\n\nStyle: ${home.aiStyle || "Clear, exam-style questions"}\nWrite ${n} new questions.`}],
        system: "You write targeted practice questions on a student's weak spots. Test the SAME underlying concepts as the missed items but with new wording, new scenarios and different angles (application, comparison, 'which is NOT', cause and effect), so the student must understand rather than recognize. Mix types: 'single' (usually 4 options), 'multiple' (select all that apply, 5 or 6 options, 2 or more correct), 'order' when there's a sequence, and 'short'. 'correct' holds zero-based option indexes; for 'order' the indexes in the right order. Every question gets a rationale and one short note per option in 'optionNotes', plus a 'topic'. Return JSON only."});
      const qs = aiCleanQuestions(r.data.questions);
      if (!qs.length) throw aiErr("empty", "The AI didn't write any usable questions. Try again.");
      const d = clone(state.decks[home.id]);
      const qz = {id: uid(), title: `Weak Spots, ${fmtShort(todayISO())}`, style: home.aiStyle || "", created: Date.now(), sources: ["Your missed cards and questions"], questions: qs, results: [], kind: "weak"};
      d.aiQuizzes = (d.aiQuizzes || []).concat(qz);
      dlg.close(); saveDeck(d, `Made a ${qs.length}-question weak spots quiz`); startAiQuiz(d.id, qz.id);
    } catch(e) { status.textContent = e.message || "Something went wrong. Try again."; go.disabled = false; go.classList.remove("busy"); }
  });
}

/* Case studies */
const CASE_STYLES = [
  ["auto", "Match my course", ""],
  ["general", "General scenario", "Case style: a realistic scenario from the course's own field that unfolds in stages, with a mix of single best answer, select-all-that-apply and put-in-order questions about what matters, why, and what to do next."],
  ["business", "Business case", "Case style: a business case (a company, a market, a decision with numbers such as revenue, costs, timelines and stakeholder views). Questions ask the student to identify the key issue, analyze the data, weigh options and trade-offs, recommend an action and evaluate the result. Mix single best answer with a few short-answer questions."],
  ["legal", "Legal fact pattern", "Case style: a legal fact pattern (parties, events, key facts, procedural history). Questions ask for the issue, the governing rule, how it applies to the facts, the strongest argument for each side and the likely outcome. Mix single best answer with short-answer issue-spotting questions; rationales state the rule and apply it."],
  ["clinical", "Clinical vignette (not nursing)", "Case style: a clinical vignette for a health science, medicine, pharmacy or similar course (patient age, presentation, history, findings, results) that unfolds as new findings arrive. Questions ask for the likely diagnosis, mechanism, best next step, treatment choice and monitoring. Do not use nurse-specific or NCLEX wording."],
  ["short", "Short-answer case", "Case style: a scenario followed by questions that the student answers in their own words ('short' questions, 1 to 3 sentences, with the key points a full answer needs in 'answer'). Use at most one or two multiple choice questions."],
  ["analysis", "Analysis (data / argument)", "Case style: an analysis case. Give the student a source, data set described in words, experiment, argument or design problem, then ask them to interpret it, find the flaw or assumption, compare explanations, justify a conclusion and propose what to check next. Mix single best answer and short-answer questions."],
  ["nclex", "NCLEX-style (nursing)", "Case style: NCLEX Next Generation unfolding nursing case study. The client scenario includes chart data (age, history, vital signs, lab values, nurses' notes), and the questions follow the clinical judgment model: recognize cues, analyze cues, prioritize hypotheses, generate solutions, take action, evaluate outcomes. Express matrix, highlight, drop-down and bow-tie items as select-all-that-apply or one-answer questions with the data in the stem, and give a rationale for each."]
];
const CASE_NURSING_RX = /\b(nursing|nclex|hesi|bsn|lpn|med[- ]?surg)\b|\b(rn|ati)\b/i;
function aiCaseStyleText(key, courseName){
  const k = CASE_STYLES.some(x => x[0] === key) ? key : "auto";
  if (k === "auto") return CASE_NURSING_RX.test(String(courseName || ""))
    ? CASE_STYLES.find(x => x[0] === "nclex")[2]
    : "Case style: choose the realistic case format that fits the course's field (business, legal, scientific, historical, technical, clinical or general). Do NOT use the NCLEX or nursing format.";
  return CASE_STYLES.find(x => x[0] === k)[2];
}
const caseStyleSelect = id => `<select id="${id}" aria-label="Case study style">${CASE_STYLES.map(x => `<option value="${x[0]}">${esc(x[1])}</option>`).join("")}</select>`;
const CASE_SCHEMA = {type: "OBJECT", properties: {cases: {type: "ARRAY", items: {type: "OBJECT", properties: {
  title: {type: "STRING"}, scenario: {type: "STRING", description: "The opening situation: who, where, history, first findings. 3 to 6 sentences."},
  questions: {type: "ARRAY", items: {type: "OBJECT", properties: {
    update: {type: "STRING", description: "New information revealed before this question (time passes, new vitals, labs, events). Empty for the first question."},
    type: {type: "STRING", enum: ["single", "multiple", "order", "truefalse", "short"]}, stem: {type: "STRING"}, options: {type: "ARRAY", items: {type: "STRING"}},
    correct: {type: "ARRAY", items: {type: "INTEGER"}}, answer: {type: "STRING"}, rationale: {type: "STRING"}, optionNotes: {type: "ARRAY", items: {type: "STRING"}}, topic: {type: "STRING"}},
    required: ["type", "stem", "rationale"]}}}, required: ["title", "scenario", "questions"]}}}, required: ["cases"]};
const CASE_SYSTEM = "You write unfolding case studies that make students apply knowledge to a realistic situation. Use a realistic scenario from the course's own field (a lab, a business, a historical event, a design problem, a client or patient for health courses) that unfolds over time, with questions that walk through recognizing what matters, analyzing it, choosing a response, acting and evaluating the outcome. Follow the 'Case style' given with the request. Only use the NCLEX Next Generation nursing format when that style is chosen (it is meant for nursing courses); never use nurse, client or NCLEX wording for other courses. Each case has 5 or 6 questions in order. Before each question after the first, 'update' reveals what happens next (time passes, new findings, the result of an action). Use 'single', 'multiple' (select all that apply), and 'order' questions mostly ('short' for the short-answer and analysis styles). 'correct' holds zero-based option indexes; for 'order' the indexes in the right order. Every question has a rationale and one short note per option in 'optionNotes'. Base everything on the provided material. Return JSON only.";
function aiCleanCases(list){
  return (Array.isArray(list) ? list : []).map(c => {
    const qs = aiCleanQuestions(c.questions);
    return qs.length >= 2 && String(c.scenario || "").trim() ? {title: String(c.title || "Case Study").trim(), scenario: String(c.scenario).trim(), questions: qs} : null;
  }).filter(Boolean);
}
// Asks which kind of case study to write before making one from a deck's cards
function caseStyleSheet(deckId){
  const d = state.decks[deckId]; if (!d) return;
  if (!aiReady()) { aiSetupSheet(true); return; }
  openSheet(`<form class="sheet">${head("Case Study from Cards")}<div class="sheet-body"><label class="f">Case study style${caseStyleSelect("csStyle")}</label><p class="mini" style="margin:0">“Match my course” uses the NCLEX format only for nursing courses. Pick another style for anything else.</p></div><div class="sheet-foot"><button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span><button type="button" class="btn primary" id="csGo">${AI_ICON} Write It</button></div></form>`);
  $("#csGo").addEventListener("click", () => caseFromDeck(deckId, $("#csStyle").value));
}
async function caseFromDeck(deckId, caseStyle){
  const d = state.decks[deckId]; if (!d) return;
  if (!aiReady()) { aiSetupSheet(true); return; }
  if (d.cards.length < 3) { toast("Add a few cards first, or use Create with AI to make a case from your slides."); return; }
  const st = aiBusySheet("Case Study", "Writing a case study from your cards. This usually takes 20 to 40 seconds…");
  try {
    const c = courseOf(d.courseId);
    const r = await aiCall({task: "cases", maxTokens: 16000, schema: CASE_SCHEMA, onStatus: m => st(m), parts: [{text: `Course: ${c ? c.name : d.name}\nStyle: ${d.aiStyle || "realistic, exam-style"}\n${aiCaseStyleText(caseStyle, c ? c.name : d.name)}\nMaterial (flashcards):\n${d.cards.slice(0, 120).map(x => `${x.front} => ${x.back}`).join("\n")}\n\nWrite 1 case study.`}], system: CASE_SYSTEM});
    const cs = aiCleanCases(r.data.cases);
    if (!cs.length) throw aiErr("empty", "The AI couldn't write a case from these cards. Try again.");
    const nd = clone(state.decks[deckId]);
    const qz = Object.assign({id: uid(), created: Date.now(), style: d.aiStyle || "", sources: ["Your flashcards"], results: [], kind: "case"}, cs[0]);
    nd.aiQuizzes = (nd.aiQuizzes || []).concat(qz);
    if (dlg.open) dlg.close();
    saveDeck(nd, `Made a case study: ${qz.title}`); startAiQuiz(deckId, qz.id);
  } catch(e) { st(e.message || "Couldn't make a case study right now.", true); }
}

// A small sheet that shows progress while the AI works
function aiBusySheet(title, msg){
  openSheet(`<form class="sheet">${head(title)}<div class="sheet-body"><p class="status-msg" id="busyMsg" aria-live="polite"><span class="ai-spin" aria-hidden="true"></span> ${esc(msg)}</p>${aiModelBar()}</div><div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Close</button></div></form>`);
  return (m, err) => { const el = $("#busyMsg"); if (el) el.innerHTML = (err ? "" : `<span class="ai-spin" aria-hidden="true"></span> `) + esc(m); };
}

/* Exam study plans */
const planSessions = examId => allTasks().filter(t => t.prepFor === examId);
const cloudAiOk = f => !(f && f.cloud && !f.revs.length) || !!(window.SBCLOUD && SBCLOUD.aiOk && SBCLOUD.aiOk(f.cloud.p));
const readableFile = f => !!f && (f.kind === "file" && f.revs.length || f.kind === "cloud") && /\.(pdf|pptx|docx|txt|md|png|jpe?g|webp)$/i.test(fileNameOf(f)) && cloudAiOk(f);
// The bytes of a stored file, or of one kept in Google Drive or OneDrive
async function fileBytes(f){
  if (f && f.cloud && !f.revs.length) { if (!window.SBCLOUD) throw new Error("cloud unavailable"); return SBCLOUD.bytes(f); }
  const r = f && curRev(f); if (!r) throw new Error("This file has no stored copy.");
  return assetBytes(r.assetId);
}
const TOPICS_SCHEMA = {type: "OBJECT", properties: {topics: {type: "ARRAY", items: {type: "OBJECT", properties: {name: {type: "STRING", description: "Short topic name, 2 to 6 words"}, weight: {type: "STRING", enum: ["high", "medium", "low"], description: "How heavily it seems to be tested"}}, required: ["name"]}}}, required: ["topics"]};
// The old exam-plan sheet is replaced by the Exam Prep Planner (module 97-examprep.js)
function examPlanSheet(examId){ if (window.SBPREP) window.SBPREP.open(examId); }

/* Summarize a file */
const SUM_SCHEMA = {type: "OBJECT", properties: {
  overview: {type: "STRING", description: "2 to 4 sentences: what this file is about"},
  keyPoints: {type: "ARRAY", items: {type: "STRING"}, description: "5 to 12 key points, one sentence each"},
  keyTerms: {type: "ARRAY", items: {type: "OBJECT", properties: {term: {type: "STRING"}, definition: {type: "STRING"}}, required: ["term", "definition"]}},
  questions: {type: "ARRAY", items: {type: "STRING"}, description: "4 to 8 likely exam questions"}}, required: ["overview", "keyPoints"]};
const fileSourceCache = new Map();
async function fileSource(f){
  if (!cloudAiOk(f)) throw aiErr("cloudai", `AI isn't allowed to read files from ${CLOUD_NAMES[f.cloud.p] || "the cloud"}. You can allow it in Files, Cloud.`);
  const r = curRev(f), cl = !r && f.cloud; if (!r && !cl) throw aiErr("empty", "This file has no stored copy.");
  const ck = r ? r.assetId : "cloud:" + cl.p + ":" + cl.id + ":" + (cl.mod || "");
  if (fileSourceCache.has(ck)) return fileSourceCache.get(ck);
  let bytes;
  try { bytes = await fileBytes(f); } catch(e) { throw aiErr("get", `Couldn't open ${f.name}${navigator.onLine === false ? " while offline" : cl ? ` from ${CLOUD_NAMES[cl.p]}` : ""}.`); }
  const src = await aiSourceFromFile(new File([bytes], fileNameOf(f), {type: fileTypeOf(f)}));
  src.name = f.name; fileSourceCache.set(ck, src);
  return src;
}
function summaryHtml(f){
  const s = f.summary;
  return `<p>${esc(s.overview)}</p>
    ${s.keyPoints && s.keyPoints.length ? `<h3 class="fsec">Key Points</h3><ul class="sum-list">${s.keyPoints.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
    ${s.keyTerms && s.keyTerms.length ? `<h3 class="fsec">Key Terms<span class="n">${s.keyTerms.length}</span></h3><dl class="sum-terms">${s.keyTerms.map(x => `<dt>${esc(x.term)}</dt><dd>${esc(x.definition)}</dd>`).join("")}</dl>` : ""}
    ${s.questions && s.questions.length ? `<h3 class="fsec">Likely Exam Questions</h3><ol class="sum-list">${s.questions.map(x => `<li>${esc(x)}</li>`).join("")}</ol>` : ""}
    <p class="mini">Summarized ${esc(new Date(s.at).toLocaleDateString(undefined, {month: "short", day: "numeric"}))} by ${esc(aiModelName(s.provider || "gemini", s.model || ""))}. AI can make mistakes; check against the file. <button type="button" class="link-btn" data-ai-report="file-summary" data-ai-text="${esc([s.overview].concat(s.keyPoints || []).join("\n").slice(0, 1400))}">Report Summary</button></p>`;
}
async function summarizeFile(fid, again){
  const f = state.files[fid]; if (!f || (f.kind !== "file" && f.kind !== "cloud")) return;
  if (!(f.summary && !again)) {
    if (!aiReady()) { aiSetupSheet(true); return; }
    if (!cloudAiOk(f)) { toast(`AI isn't allowed to read files from ${CLOUD_NAMES[f.cloud.p]}. You can allow it in Files, Cloud.`, null, window.SBCLOUD ? {label: "Open Cloud", fn: () => SBCLOUD.open()} : undefined); return; }
    if (!readableFile(f)) { toast("Summaries work for PDF, PowerPoint, Word, text and image files."); return; }
  }
  const show = () => {
    const cur = state.files[fid];
    openSheet(`<form class="sheet ai-sheet">${head("Summary: " + cur.name)}<div class="sheet-body">${summaryHtml(cur)}</div>
      <div class="sheet-foot">${readableFile(cur) ? `<button type="button" class="btn" id="smAgain">Summarize Again</button>` : ""}<span class="spacer"></span>${cur.summary.keyTerms && cur.summary.keyTerms.length ? `<button type="button" class="btn" id="smCards">Make ${cur.summary.keyTerms.length} Flashcards</button>` : ""}<button type="button" class="btn primary" id="smNote">Pin as Sticky Note</button></div></form>`);
    { const a = $("#smAgain"); if (a) a.addEventListener("click", () => summarizeFile(fid, true)); }
    const sc = $("#smCards"); if (sc) sc.addEventListener("click", () => {
      const s = state.files[fid].summary, cId = cur.courseId || "";
      let d = decksArr().find(x => x.name === cur.name.replace(/\.[^.]+$/, "") && x.courseId === cId);
      d = d ? clone(d) : normDeck({id: uid(), created: Date.now(), name: cur.name.replace(/\.[^.]+$/, "").slice(0, 100), courseId: cId});
      const have = new Set(d.cards.map(c => c.front.toLowerCase()));
      const add = s.keyTerms.filter(k => !have.has(k.term.toLowerCase())).map(k => ({id: uid(), front: k.term, back: k.definition, box: 0, due: "", seen: 0, right: 0, wrong: 0, ai: true}));
      d.cards = d.cards.concat(add);
      dlg.close(); ui.tab = "flashcards"; ui.fc = null; ui.deckId = d.id;
      saveDeck(d, `Added ${add.length} card${add.length === 1 ? "" : "s"} to ${d.name}`);
    });
    $("#smNote").addEventListener("click", () => {
      const s = state.files[fid].summary;
      const text = `${cur.name.replace(/\.[^.]+$/, "")}\n\n${s.overview}\n\n${(s.keyPoints || []).map(x => "• " + x).join("\n")}`.slice(0, 8000);
      dlg.close(); addNoteText(text, cur.courseId || "", "blue"); ui.tab = "notes"; render();
      toast("Pinned the summary to your Notes board");
    });
  };
  if (f.summary && !again) { show(); return; }
  const st = aiBusySheet("Summary: " + f.name, "Reading the file and writing a summary…");
  try {
    const src = await fileSource(f), c = courseOf(f.courseId);
    const r = await aiCall({task: "summary", maxTokens: 8000, schema: SUM_SCHEMA, onStatus: m => st(m), parts: [src.part, {text: `Course: ${c ? c.name : "not given"}. Summarize this file for studying.`}],
      system: "You summarize course material for a student who will be tested on it. Be accurate and specific to the file (names, numbers, mechanisms, steps), not generic. Include the key terms with short definitions and the questions an instructor would most likely ask. Use only what the file says: never add facts, numbers or examples that are not in it. Write in the file's language, in plain text without markdown or LaTeX. Return JSON only."});
    const n = clone(state.files[fid]);
    // Anything that copied the file word for word is left out: the summary restates it
    if (src.copyText == null && src.pdfBytes) src.copyText = await aiPdfText(src.pdfBytes);
    const copy = aiCopyIndex([typeof src.part.text === "string" ? src.part.text : "", src.copyText || ""].filter(Boolean)), own = x => !aiCopied(x, copy);
    const cut = (x, n) => String(x || "").replace(/\s+/g, " ").trim().slice(0, n);
    n.summary = {at: Date.now(), model: r.model, provider: r.provider, overview: cut(r.data.overview, 1500), keyPoints: (r.data.keyPoints || []).slice(0, 14).map(x => cut(x, 400)).filter(x => x && own(x)),
      keyTerms: (r.data.keyTerms || []).filter(k => k && k.term && k.definition && own(k.definition)).slice(0, 30).map(k => ({term: cut(k.term, 100), definition: cut(k.definition, 350)})), questions: (r.data.questions || []).slice(0, 10).map(x => cut(x, 300)).filter(x => x && own(x))};
    applyChanges([{kind: "file", id: fid, after: n}], null);
    show();
  } catch(e) { st(e.message || "Couldn't summarize that file.", true); }
}
function addNoteText(text, courseId, color, extra){
  const all = notesArr().filter(n => !n.archived && noteBoardOf(n) === noteBoardId());
  const z = all.reduce((m, n) => Math.max(m, n.z || 0), 0) + 1;
  const col = all.length % 5, row = Math.floor(all.length / 5) % 4;
  const n = normNote(Object.assign({id: uid(), board: noteBoardId(), text, color: color || "yellow", x: 40 + col * (NOTE_W() + 30) + Math.round(Math.random() * 20), y: 40 + row * 240 + Math.round(Math.random() * 20), z, rot: Math.round((Math.random() * 4 - 2) * 10) / 10, courseId: courseId || "", created: Date.now()}, extra || {}));
  applyChanges([{kind: "note", id: n.id, after: n}], null);
  return n;
}

/* Photo of the board or a slide, into a note */
const PHOTO_SCHEMA = {type: "OBJECT", properties: {
  title: {type: "STRING", description: "Short title for the note"},
  notes: {type: "STRING", description: "Clean, well-organized study notes of everything shown. Plain text: short headings on their own line, bullets starting with '• ', keep formulas and numbers exact."},
  course: {type: "STRING", description: "One of the listed course codes if the content clearly belongs to it, else empty"},
  dates: {type: "ARRAY", items: {type: "OBJECT", properties: {title: {type: "STRING"}, type: {type: "STRING", enum: ["Assignment", "Exam", "Quiz", "Reading", "Project", "Lab", "Other"]}, due: {type: "STRING", description: "YYYY-MM-DD"}, time: {type: "STRING"}}, required: ["title", "due"]}, description: "Deadlines or exam dates written in the photo, if any"}},
  required: ["notes"]};
// A phone or tablet (a touch screen as the main pointer)
const phoneLike = () => { try { return window.matchMedia("(pointer:coarse)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || ""); } catch (e) { return false; } };
// Tapping outside the sheet keeps the photos (and a finished note) until Save or Cancel
let PN_DRAFT = null;
function photoNoteSheet(file){
  if (!aiReady()) { aiSetupSheet(true); return; }
  const S = (!file && PN_DRAFT) || {srcs: [], files: [], result: null};
  PN_DRAFT = S;
  openSheet(`<form class="sheet ai-sheet">${head("Photo to Note")}
    <div class="sheet-body" id="pnBody">
      <div class="drop" id="pnDrop"><p style="margin:0 0 10px"><strong>Take or choose photos of the whiteboard, a slide, or handwritten notes.</strong><br><span class="mini">They become clean, typed notes on your board. Dates written in them can be added as tasks.</span></p>
        <div class="row-actions" style="justify-content:center">${phoneLike() ? `<button type="button" class="btn primary" id="pnTake">Take Photo</button>` : ""}<button type="button" class="btn${phoneLike() ? "" : " primary"}" id="pnPick">Choose Photos</button></div>
        <input type="file" id="pnFile" accept="image/*,application/pdf" multiple class="sr" tabindex="-1"><input type="file" id="pnCam" accept="image/*" capture="environment" class="sr" tabindex="-1"></div>
      <ul class="ai-srcs" id="pnSrcs"></ul>
      <label class="f">Course<select id="pnCourse">${courseSelectHtml(ui.filter !== "all" ? ui.filter : "")}</select></label>
      ${aiModelBar()}
      <p class="status-msg" id="pnStatus" style="margin:0" aria-live="polite"></p>
    </div>
    <div class="sheet-foot"><button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span><button type="button" class="btn primary" id="pnGo">${AI_ICON} Make Note</button></div></form>`);
  const form = dlg.querySelector("form.ai-sheet"), live = () => form.isConnected && dlg.open;
  form.addEventListener("click", e => { if (e.target.closest && e.target.closest('[data-act="close"]')) PN_DRAFT = null; }, true);
  const status = $("#pnStatus");
  if (S.course != null) $("#pnCourse").value = S.course;
  $("#pnCourse").addEventListener("change", e => { S.course = e.target.value; });
  const draw = () => { if (!live()) return; $("#pnSrcs").innerHTML = S.srcs.map((s, i) => `<li><span class="ficon">${s.kind === "PDF" ? "PDF" : "IMG"}</span><span class="nm">${esc(s.name)}</span><span class="mini">${fmtSize(s.size)}</span><button type="button" class="x-btn" data-rm="${i}" aria-label="Remove">${CLOSE}</button></li>`).join(""); };
  const add = async list => { for (const f of list) { try { S.srcs.push(await aiSourceFromFile(f)); S.files.push(f); } catch(e) { status.textContent = e.message; } } draw(); };
  if (file) add([file]).then(() => { const g = $("#pnGo"); if (g && S.srcs.length) g.click(); });
  else if (S.srcs.length) draw();
  $("#pnPick").addEventListener("click", () => $("#pnFile").click());
  $("#pnFile").addEventListener("change", e => { const l = [...e.target.files]; e.target.value = ""; add(l); });
  const cam = $("#pnTake"); if (cam) { cam.addEventListener("click", () => $("#pnCam").click()); $("#pnCam").addEventListener("change", e => { const l = [...e.target.files]; e.target.value = ""; add(l); }); }
  const drop = $("#pnDrop");
  ["dragover", "dragenter"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", e => add([...((e.dataTransfer && e.dataTransfer.files) || [])]));
  $("#pnSrcs").addEventListener("click", e => { const b = e.target.closest("[data-rm]"); if (b) { S.srcs.splice(Number(b.dataset.rm), 1); S.files.splice(Number(b.dataset.rm), 1); draw(); } });
  $("#pnGo").addEventListener("click", async () => {
    const go = $("#pnGo");
    if (!S.srcs.length) { status.textContent = "Add a photo first."; return; }
    if (S.srcs.reduce((s, x) => s + aiSourceBytes(x), 0) > AI_LIMIT_BYTES) { status.textContent = "Those photos are too big to send at once. Try fewer."; return; }
    go.disabled = true; go.classList.add("busy"); status.innerHTML = `<span class="ai-spin" aria-hidden="true"></span> Reading your photos…`;
    try {
      const today = todayISO(), courses = coursesArr().map(c => c.code || c.name).join("; ") || "none";
      const r = await aiCall({task: "photo", maxTokens: 8000, schema: PHOTO_SCHEMA, onStatus: m => { status.textContent = m; }, parts: S.srcs.map(s => s.part).concat({text: `Today is ${today}. Courses: ${courses}. Turn these class photos into study notes.`}),
        system: "You turn photos of whiteboards, lecture slides and handwritten notes into clean, organized typed study notes. The student's own handwriting and whiteboard writing may be transcribed as written; anything printed (slides, handouts, textbook pages) must be restated in your own words as concise notes, never copied sentence by sentence. Cover everything that matters, fix obvious typos, expand cryptic abbreviations only when you're sure, keep formulas and numbers exactly, and organize with short headings and bullets. If something is unreadable, write [unclear]. Describe diagrams briefly in words. List any due dates or exam dates you see, resolving them relative to today. Return JSON only."});
      const d = r.data, cSel = $("#pnCourse").value, guess = coursesArr().find(c => (c.code || c.name).toLowerCase() === String(d.course || "").toLowerCase());
      S.result = {title: String(d.title || "").trim(), notes: String(d.notes || "").trim(), courseId: cSel || (guess ? guess.id : ""), dates: (d.dates || []).filter(x => x && x.title && isDate(x.due)).map(x => ({title: String(x.title), type: TYPES.includes(x.type) ? x.type : "Assignment", due: x.due, time: /^\d\d:\d\d$/.test(x.time || "") ? x.time : "", on: true}))};
      if (!S.result.notes) { S.result = null; throw aiErr("empty", "Couldn't read anything in those photos. Try a clearer, closer photo."); }
      if (live()) review();
    } catch(e) { if (!live()) return; status.textContent = e.message || "Something went wrong. Try again."; go.disabled = false; go.classList.remove("busy"); }
  });
  const review = () => {
    const R = S.result;
    $("#pnBody").innerHTML = `<label class="f"><span class="lh">Note</span><textarea id="pnText" rows="14" maxlength="8000">${esc(R.text != null ? R.text : (R.title ? R.title + "\n\n" : "") + R.notes)}</textarea></label>
      <label class="f">Course<select id="pnCourse2">${courseSelectHtml(R.courseId)}</select></label>
      ${R.dates.length ? `<fieldset><legend>Dates Found in the Photos</legend>${R.dates.map((x, i) => `<label class="mi-check"><input type="checkbox" data-pd="${i}" checked> ${esc(x.title)} <span class="mini">${esc(x.type)}, ${esc(fmtDate(x.due))}${x.time ? " " + esc(fmtTime(x.time)) : ""}</span></label>`).join("")}</fieldset>` : ""}
      ${caps.assets ? `<label class="mi-check"><input type="checkbox" id="pnKeep" checked> Also save the photos in the course's Lecture Notes folder</label>` : ""}`;
    $(".sheet-foot", dlg).innerHTML = `<button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span><button type="button" class="btn primary" id="pnSave">Save Note${R.dates.length ? " and Tasks" : ""}</button>`;
    $("#pnText").addEventListener("input", e => { R.text = e.target.value; });
    $("#pnCourse2").addEventListener("change", e => { R.courseId = e.target.value; });
    $("#pnSave").addEventListener("click", async () => {
      const text = $("#pnText").value.trim(); if (!text) return;
      PN_DRAFT = null;
      const cid = $("#pnCourse2").value;
      const tasks = R.dates.filter((x, i) => { const cb = dlg.querySelector(`[data-pd="${i}"]`); return cb && cb.checked; });
      const keep = $("#pnKeep") && $("#pnKeep").checked;
      dlg.close();
      addNoteText(text, cid, "yellow");
      if (tasks.length) applyChanges(tasks.map(x => { const t = newTask({title: x.title, type: x.type, courseId: cid, due: x.due, time: x.time, start: MILESTONE(x.type) ? x.due : addDays(x.due, -(SPAN[x.type] ?? 3)) < todayISO() ? todayISO() : addDays(x.due, -(SPAN[x.type] ?? 3)), priority: x.type === "Exam" ? "high" : "med"}); return {kind: "task", id: t.id, after: t}; }), `Added ${tasks.length} task${tasks.length === 1 ? "" : "s"} from your photos`);
      ui.tab = "notes"; render();
      toast(tasks.length ? `Note saved, and ${tasks.length} task${tasks.length === 1 ? "" : "s"} added` : "Note saved to your board");
      if (keep) uploadOkLater(() => uploadFiles(S.files, {courseId: cid, folderId: "notes"}), "The photos");
    });
  };
  if (!file && S.result) review();
}

/* Ask your course materials */
const ASK_SCHEMA = {type: "OBJECT", properties: {
  answer: {type: "STRING", description: "The answer. Plain text; use short paragraphs, '- ' bullets and **bold** sparingly."},
  sources: {type: "ARRAY", items: {type: "OBJECT", properties: {file: {type: "STRING"}, where: {type: "STRING", description: "Slide or page, e.g. 'Slide 12' or 'p. 4'"}}, required: ["file"]}},
  inFiles: {type: "BOOLEAN", description: "false if the answer isn't in the files and comes from general knowledge"},
  followUps: {type: "ARRAY", items: {type: "STRING"}, description: "2 or 3 short follow-up questions the student might ask next"}}, required: ["answer"]};
function miniMd(s){
  const lines = esc(s).split(/\n/), out = []; let list = false;
  lines.forEach(l => {
    const b = l.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/);
    if (b) { if (!list) { out.push("<ul>"); list = true; } out.push(`<li>${b[1]}</li>`); return; }
    if (list) { out.push("</ul>"); list = false; }
    if (l.trim()) out.push(`<p>${l}</p>`);
  });
  if (list) out.push("</ul>");
  return out.join("").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
}
function askSheet(courseId){
  if (!aiReady()) { aiSetupSheet(true); return; }
  const c = courseOf(courseId);
  const isLec = f => f.folderId === "lectures" && f.tr && String(f.tr.text || "").trim();
  const sizeOf = f => isLec(f) ? String((f.lec && f.lec.org) || f.tr.text).length : (curRev(f) || {}).size || (f.cloud && f.cloud.size) || 0;
  const files = Object.values(state.files).filter(f => (f.courseId || "") === (courseId || "") && (readableFile(f) || isLec(f))).sort((a, b) => (isLec(a) - isLec(b)) || ((b.updated || b.created || 0) - (a.updated || a.created || 0)));
  ui.ask = ui.ask || {};
  const A = ui.ask[courseId || "_"] = ui.ask[courseId || "_"] || {msgs: [], sel: null, info: true};
  if (!A.sel) { let size = 0, nl = 0; A.sel = files.filter(f => { if (isLec(f)) return nl++ < 3; const s = sizeOf(f); if (size + s > 12 * 1048576) return false; size += s; return true; }).slice(0, 10).map(f => f.id); }
  openSheet(`<form class="sheet ai-sheet ask">${head(`Ask About ${c ? courseLabel(c) : "General Files"}`)}
    <div class="sheet-body" id="askBody">
      <details class="ask-src" ${A.msgs.length ? "" : "open"}><summary>Answering From <span class="mini" id="askSrcN"></span></summary>
        ${files.length ? `<div class="ep-files">${files.map(f => `<label class="mi-check"><input type="checkbox" data-askf="${esc(f.id)}" ${A.sel.includes(f.id) ? "checked" : ""}> ${isLec(f) ? "Lecture: " : ""}${esc(f.name)} <span class="mini">${isLec(f) ? "transcript" : fmtSize(sizeOf(f))}</span></label>`).join("")}</div>` : `<p class="mini" style="margin:0">No readable files in this course yet. Upload slides, notes or readings in Files, and they'll show up here.</p>`}
        <label class="mi-check"><input type="checkbox" id="askInfo" ${A.info ? "checked" : ""}> Course details, class times and your tasks</label>
        <p class="mini" style="margin:4px 0 0">Every question sends the checked files again, so check only what you need. Fewer files means faster answers and more free questions.</p>
      </details>
      <div class="ask-log" id="askLog" aria-live="polite"></div>
      ${aiModelBar()}
    </div>
    <div class="sheet-foot ask-foot"><textarea id="askIn" rows="1" placeholder="Ask anything about this course, e.g. What's the difference between systolic and diastolic heart failure?" maxlength="2000" aria-label="Your question"></textarea><button type="button" class="btn primary" id="askGo">Ask</button></div>
  </form>`);
  const log = $("#askLog");
  const selSize = () => A.sel.reduce((s, id) => s + ((state.files[id] && sizeOf(state.files[id])) || 0), 0);
  const drawSrc = () => { $("#askSrcN").textContent = `${A.sel.length} file${A.sel.length === 1 ? "" : "s"}${A.sel.length ? ", " + fmtSize(selSize()) : ""}${A.info ? " + course info" : ""}`; };
  const drawLog = () => {
    log.innerHTML = A.msgs.length ? A.msgs.map((m, i) => `<div class="ask-q">${esc(m.q)}</div>
      <div class="ask-a">${m.busy ? `<p><span class="ai-spin" aria-hidden="true"></span> ${esc(m.status || "Reading your files…")}</p>` : m.err ? `<p class="mini">${esc(m.err)}</p>` : `${miniMd(m.a.answer)}
        ${m.a.inFiles === false ? `<p class="mini">This isn't covered in the checked files, so the answer comes from general knowledge.</p>` : ""}
        ${m.a.sources && m.a.sources.length ? `<div class="ask-cites">${m.a.sources.map(s => `<span class="chip">${esc(s.file)}${s.where ? " · " + esc(s.where) : ""}</span>`).join("")}</div>` : ""}
        <div class="ask-acts"><button type="button" class="link-btn" data-asknote="${i}">Save as Note</button>${(m.a.followUps || []).map(f => `<button type="button" class="chip ask-fu" data-askq="${esc(f)}">${esc(f)}</button>`).join("")}</div>`}</div>`).join("")
      : `<div class="ask-empty"><p class="mini">Try one of these:</p>${["What will probably be on the next exam?", "Explain the hardest idea from the latest lecture in simple terms", "Quiz me with 3 questions on this week's material", "Make a checklist of what I need to know"].map(q => `<button type="button" class="chip ask-fu" data-askq="${esc(q)}">${esc(q)}</button>`).join("")}</div>`;
    log.scrollTop = log.scrollHeight;
    const b = $("#askBody"); b.scrollTop = b.scrollHeight;
  };
  drawSrc(); drawLog();
  $("#askBody").addEventListener("change", e => {
    if (e.target.dataset.askf) { const id = e.target.dataset.askf; A.sel = e.target.checked ? A.sel.concat(id) : A.sel.filter(x => x !== id); drawSrc(); }
    if (e.target.id === "askInfo") { A.info = e.target.checked; drawSrc(); }
  });
  const courseInfo = () => {
    if (!c) return "";
    const ms = courseMeetings(c).map(m => `${m.kind} ${daysLabel(m.days)} ${m.start}-${m.end}${m.where ? " " + m.where : ""}`).join("; ");
    const ts = tasksArr().filter(t => t.courseId === c.id && t.status !== "done").sort(sortTasks).slice(0, 30).map(t => `${t.title} (${t.type}${t.due ? ", due " + t.due : ""}${hasWeight(t) ? ", " + t.weight + "%" : ""})`).join("; ");
    return `Course: ${c.name}${c.code ? " (" + c.code + ")" : ""}. Instructor: ${c.instructor || "?"}. Meets: ${ms || c.schedule || "?"}. Office hours: ${c.office || "?"}.\nOpen tasks: ${ts || "none"}.\nToday is ${todayISO()}.`;
  };
  const send = async q => {
    q = String(q || "").trim(); if (!q) return;
    if (A.msgs.some(m => m.busy)) return;
    if (selSize() > AI_LIMIT_BYTES) { toast("The checked files are too big to send at once. Uncheck some."); return; }
    const m = {q, busy: true}; A.msgs.push(m); $("#askIn").value = ""; askGrow(); drawLog();
    try {
      const parts = [];
      for (const id of A.sel) { const f = state.files[id]; if (!f) continue;
        if (isLec(f)) { parts.push({text: `Lecture transcript: ${f.name}${f.created ? " (" + new Date(f.created).toLocaleDateString() + ")" : ""}\n${String((f.lec && f.lec.org) || f.tr.text).slice(0, 80000)}`}); continue; }
        m.status = `Reading ${f.name}…`; drawLog(); const s = await fileSource(f); parts.push({text: `File: ${f.name}`}); parts.push(s.part); }
      m.status = "Thinking…"; drawLog();
      const hist = A.msgs.filter(x => x !== m && x.a).slice(-6).map(x => `Student: ${x.q}\nTutor: ${x.a.answer}`).join("\n\n");
      parts.push({text: `${A.info ? courseInfo() + "\n\n" : ""}${hist ? "Conversation so far:\n" + hist + "\n\n" : ""}Student's question: ${q}`});
      const r = await aiCall({task: "tutor", maxTokens: 6000, schema: ASK_SCHEMA, onStatus: s => { m.status = s; drawLog(); }, parts,
        system: "You're a friendly, sharp tutor for this course. Answer from the provided course files first and cite the file name and slide or page for what you use. If the files don't cover it, say so and answer from general knowledge (set inFiles false). Be concise and clear for a student: short paragraphs or bullets, define jargon, and give an example when it helps. If asked to quiz them, ask the questions without giving answers away. Return JSON only."});
      m.a = {answer: String(r.data.answer || ""), sources: (r.data.sources || []).filter(s => s && s.file).slice(0, 6), inFiles: r.data.inFiles, followUps: (r.data.followUps || []).map(String).slice(0, 3)};
    } catch(e) { m.err = e.message || "Couldn't answer that right now."; }
    m.busy = false; if (dlg.open && $("#askLog")) drawLog();
  };
  $("#askGo").addEventListener("click", () => send($("#askIn").value));
  $("#askIn").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e.target.value); } });
  const askGrow = () => { const t = $("#askIn"); if (!t) return; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; };
  $("#askIn").addEventListener("input", askGrow);
  log.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.askq) send(b.dataset.askq);
    if (b.dataset.asknote != null) { const m = A.msgs[Number(b.dataset.asknote)]; if (m && m.a) { addNoteText(`${m.q}\n\n${m.a.answer}`.slice(0, 8000), courseId || "", "green"); b.textContent = "Saved to Notes"; b.disabled = true; } }
  });
  setTimeout(() => $("#askIn").focus(), 30);
}


