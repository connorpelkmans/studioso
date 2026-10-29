/* ===== module: 01-helpers.js: the app's core, backups, helpers, workload and shared pieces ===== */
/* Backups */
let autoBackupDone = false;
// Backups are kept on this device
const DEV_BACKUP_DAYS = 14;
const cloudBackupsOn = () => cloud.on && (inPreview() || typeof PLAN === "undefined" || !PLAN || PLAN.can("cloud-backups"));
const backupSnap = () => ({at: Date.now(), courses: Object.values(state.courses), tasks: Object.values(state.tasks), files: Object.values(state.files), notes: Object.values(state.notes), decks: Object.values(state.decks || {}), events: Object.values(state.events || {}), avail: (state.settings && state.settings.avail) || null,
  keep: (() => { const o = clone(syncSettings(state.settings || {})); delete o.ai; o.all = true; return o; })()});
async function deviceBackups(){
  let arr = await SBC.all("backups");
  try { arr = arr.concat(JSON.parse(localStorage.getItem(LSB) || "[]").map(b => Object.assign({where: "device"}, b))); } catch(e) {}
  return arr.filter(b => b && b.at).sort((a, b) => b.at - a.at);
}
// One backup a day ("d-<date>", the last 14 kept)
const DEV_BACKUP_KEPT = 10;
async function saveDeviceBackup(snap, before){
  const id = before ? "k-" + new Date().toISOString() : "d-" + todayISO();
  await SBC.putStrict("backups", id, Object.assign({id, where: "device"}, snap));
  const keys = await SBC.keys("backups");
  const prune = async (pre, n) => { for (const k of keys.filter(k => String(k).startsWith(pre)).sort().reverse().slice(n)) await SBC.del("backups", k); };
  await prune("d-", DEV_BACKUP_DAYS); await prune("k-", DEV_BACKUP_KEPT);
  return id;
}
// A device backup of everything here right now, before it is replaced
function backupBefore(note){
  const has = ["tasks", "courses", "notes", "decks", "files", "events"].some(k => Object.keys(state[k] || {}).length);
  if (has && !inPreview()) saveDeviceBackup(Object.assign(backupSnap(), {note}), true).catch(e => console.warn("backup before replacing", e));
}
async function cloudBackupList(){
  const s = await cloud.backups.orderBy("at", "desc").limit(10).get();
  return s.docs.map(d => Object.assign({id: d.id, where: "cloud"}, clone(d.data()))).sort((a, b) => b.at - a.at);
}
async function listBackups(){
  let all = await deviceBackups();
  if (cloudBackupsOn()) { try { all = all.concat(await cloudBackupList()); } catch(e) {} }
  if (window.SBCLOUD && SBCLOUD.backup && SBCLOUD.backup.on()) { try { all = all.concat(await SBCLOUD.backup.restorable()); } catch(e) {} }
  const seen = new Set();
  return all.sort((a, b) => b.at - a.at).filter(b => { const k = b.where + b.id; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 24);
}
async function makeBackup(){
  const snap = backupSnap();
  await saveDeviceBackup(snap);
  if (cloudBackupsOn()) {
    const id = "wk-" + mondayOf(todayISO());
    await cloud.backups.doc(id).set(snap);
    const keep = typeof PLAN !== "undefined" && PLAN && !inPreview() ? Math.max(1, Math.ceil((PLAN.limits().cloudBackupDays || 30) / 7)) : 6;
    const all = await cloudBackupList();
    for (const b of all.slice(keep)) { try { await cloud.backups.doc(b.id).delete(); } catch(e){} }
  }
}
async function maybeAutoBackup(){
  if (autoBackupDone) return;
  autoBackupDone = true;
  const has = ["tasks", "courses", "notes", "decks", "files"].some(k => Object.keys(state[k] || {}).length);
  if (!has) return;
  try {
    const dev = await deviceBackups();
    const daily = dev.filter(b => !String(b.id || "").startsWith("k-"));
    if (!daily.length || Date.now() - daily[0].at > 864e5) await saveDeviceBackup(backupSnap());
    if (cloudBackupsOn()) {
      const cl = await cloudBackupList();
      if (!cl.length || Date.now() - cl[0].at > 7 * 864e5) await makeBackup();
    }
  } catch(e) { console.warn("Backup skipped", e); }
}
function replaceAllChanges(courses, tasks, files, notes, decks, events){
  const ch = [];
  if (Array.isArray(events)) {
    const ne = {}; events.forEach(e => { if (e && e.id) ne[e.id] = e; });
    Object.keys(state.events || {}).forEach(id => { if (!ne[id]) ch.push({kind:"event", id, after:null}); });
    Object.values(ne).forEach(e => { if (JSON.stringify(normEvent(clone(e))) !== JSON.stringify(state.events[e.id])) ch.push({kind:"event", id:e.id, after:e}); });
  }
  if (Array.isArray(decks)) {
    const nd = {}; decks.forEach(d => { if (d && d.id) nd[d.id] = d; });
    Object.keys(state.decks || {}).forEach(id => { if (!nd[id]) ch.push({kind:"deck", id, after:null}); });
    Object.values(nd).forEach(d => { if (JSON.stringify(normDeck(clone(d))) !== JSON.stringify(state.decks[d.id])) ch.push({kind:"deck", id:d.id, after:d}); });
  }
  if (Array.isArray(notes)) {
    const nn = {}; notes.forEach(n => { if (n && n.id) nn[n.id] = n; });
    Object.keys(state.notes).forEach(id => { if (!nn[id]) ch.push({kind:"note", id, after:null}); });
    Object.values(nn).forEach(n => { if (JSON.stringify(normNote(clone(n))) !== JSON.stringify(state.notes[n.id])) ch.push({kind:"note", id:n.id, after:n}); });
  }
  if (Array.isArray(files)) {
    const nf = {}; files.forEach(f => { if (f && f.id) nf[f.id] = f; });
    Object.keys(state.files).forEach(id => { if (!nf[id]) ch.push({kind:"file", id, after:null}); });
    Object.values(nf).forEach(f => { if (JSON.stringify(normFile(clone(f))) !== JSON.stringify(state.files[f.id])) ch.push({kind:"file", id:f.id, after:f}); });
  }
  const nc = {}, nt = {};
  courses.forEach(c => { if (c && c.id) nc[c.id] = c; });
  tasks.forEach(t => { if (t && t.id) nt[t.id] = t; });
  Object.keys(state.tasks).forEach(id => { if (!nt[id]) ch.push({kind:"task", id, after:null}); });
  Object.keys(state.courses).forEach(id => { if (!nc[id]) ch.push({kind:"course", id, after:null}); });
  Object.values(nc).forEach(c => { if (JSON.stringify(c) !== JSON.stringify(state.courses[c.id])) ch.push({kind:"course", id:c.id, after:c}); });
  Object.values(nt).forEach(t => { if (JSON.stringify(normTask(clone(t))) !== JSON.stringify(state.tasks[t.id])) ch.push({kind:"task", id:t.id, after:t}); });
  return ch;
}
/* Helpers */
const ARCHIVE_DAYS = 14;
const doneTime = t => t.doneAt || (t.due ? parse(t.due).getTime() + 864e5 : (t.created || Date.now()));
const autoArchived = t => t.status === "done" && Date.now() - doneTime(t) > ARCHIVE_DAYS * 864e5;
const isArchived = t => !!t.archivedTerm || autoArchived(t);
const allTasks = () => Object.values(state.tasks);
const tasksArr = () => allTasks().filter(t => !isArchived(t));
// Courses keep the order you dragged them into (order), then the order they were added
const courseOrd = c => typeof c.order === "number" ? c.order : 1e15 + (c.created || 0);
const allCourses = () => Object.values(state.courses).sort((a, b) => (courseOrd(a) - courseOrd(b)) || String(a.name).localeCompare(String(b.name)));
const coursesArr = () => allCourses().filter(c => !c.archived);
const courseOf = id => id ? state.courses[id] : null;
const colorOf = id => { const c = courseOf(id); return c ? c.color : "#8A94A6"; };
const courseLabel = c => c.code || c.name;
// A course code from a school site
const COURSE_CODE_RX = /\b([A-Za-z]{2,6})[\s_-]?(\d{2,4}[A-Za-z]?)\b/;
const cleanCourseCode = (raw, name) => {
  for (const s of [raw, name]) { const m = String(s || "").match(COURSE_CODE_RX); if (m) return m[1].toUpperCase() + " " + m[2].toUpperCase(); }
  return "";
};
// A start no further back than a year before the due date (a missing or broken "created", like 1, would otherwise mean 1970)
const START_SPAN_DAYS = 365, CREATED_MIN = Date.UTC(2000, 0, 1);
function startOf(t){
  if (MILESTONE(t.type) && t.due) return t.due;
  const made = Number(t.created) > CREATED_MIN ? iso(new Date(Number(t.created))) : "";
  let s = t.start || made || t.due;
  if (t.due && (!s || s > t.due)) s = t.due;
  if (t.due && s && s < addDays(t.due, -START_SPAN_DAYS)) s = addDays(t.due, -START_SPAN_DAYS);
  return s;
}
/* Exam readiness: measured first, your own feeling second.
   Feeling ready is a poor guide on its own: material you've read feels learned even when you can't recall it (illusions of
   competence). So readiness comes from what you can actually do: your exam prep plan's sessions, cards and quizzes when there
   is a plan, otherwise your flashcards for the course (cards never studied count as not known), recent practice quizzes, and
   the automatic AI's read of both. The Preparedness slider (how ready you feel) only fills in while there is little evidence,
   and when the two disagree by 20 points or more, the gap is shown: noticing it is how you learn to judge yourself better. */
const XR_GAP = 20, XR_FULL = 30, XR_DAYS = 30;
/* Which flashcards count toward one exam's readiness, so Midterm 1 and the Final don't share one number:
   1. the decks you linked to the exam, if you did
   2. (a prep plan's topics are used by the plan itself, see examReadiness)
   3. automatic: the exam's topics, from its title, its notes (where school-site instructions land) and course announcements
      that mention it, matched to deck names and card text, including chapter, unit and week numbers ("Chapters 4-6")
   4. the cards added since the course's previous exam, unless this one is a final or cumulative
   5. otherwise the whole course, as before */
const XR_STOP = new Set("about after again also bring calculator cards class closed cover covers covered exam exams final finals from have held in-class including lecture lectures material materials midterm midterms note notes online open page pages paper pencil please quiz quizzes review room section sections study test tests that their there these this time topic topics will with what when where which your chapter chapters unit units week weeks module modules part parts book textbook slides questions question answer answers multiple choice short long take taken home person minutes hour hours worth grade percent points".split(" "));
const xrStem = w => w.length > 5 && /ies$/.test(w) ? w.slice(0, -3) + "y" : w.length > 5 && /(sses|ches|shes|xes)$/.test(w) ? w.slice(0, -2) : w.length > 4 && /s$/.test(w) && !/(ss|us|is)$/.test(w) ? w.slice(0, -1) : w.length > 6 && /ing$/.test(w) ? w.slice(0, -3) : w.length > 5 && /ed$/.test(w) ? w.slice(0, -2) : w;
const xrWords = txt => String(txt || "").toLowerCase().replace(/<[^>]*>/g, " ").split(/[^a-z\u00c0-\u024f]+/).filter(w => w.length >= 4 && !XR_STOP.has(w)).map(xrStem);
// Chapter, unit, module, week and lecture numbers named in a text: {kind: Set of numbers}
function xrNums(txt){
  const out = {}, re = /\b(ch(?:apter)?s?|units?|modules?|weeks?|lectures?|lessons?)\.?\s*((?:\d{1,2}\s*(?:-|–|to|,|&|and)?\s*)+)/gi;
  let m; while ((m = re.exec(String(txt || "")))) {
    const k = m[1].toLowerCase().replace(/^ch.*/, "ch").replace(/s$/, ""), set = out[k] || (out[k] = new Set());
    const parts = m[2].replace(/–|to/g, "-").split(/,|&|and/);
    parts.forEach(p => { const r = p.split("-").map(x => parseInt(x, 10)).filter(n => n >= 0 && n < 100); if (r.length === 2 && r[1] >= r[0] && r[1] - r[0] < 30) { for (let i = r[0]; i <= r[1]; i++) set.add(i); } else if (r.length) set.add(r[0]); });
  }
  return out;
}
const xrNumHit = (nums, txt) => { const t = xrNums(txt); return Object.keys(t).some(k => nums[k] && [...t[k]].some(n => nums[k].has(n))); };
// When a card was made: card ids start with the time they were created
const cardBorn = c => { const n = parseInt(String(c.id || "").slice(0, 8), 36); return n > 1.4e12 && n < Date.now() + 864e5 ? n : 0; };
const isCumulative = ex => /\b(final|cumulative|comprehensive)\b/i.test((ex.title || "") + " " + (ex.notes || ""));
let XE_CACHE = {k: "", m: {}};
// The words of a practice quiz (its title, what it was made from, and its questions), to match it to an exam's topics
const quizText = qz => [qz.title, ...(qz.sources || []), ...(qz.questions || []).map(q => Object.values(q || {}).filter(v => typeof v === "string").join(" "))].join(" ");
// The results of a set of quizzes, newest first: [{at, score, total}]
const quizResults = list => list.flatMap(qz => (qz.results || []).filter(r => r && Number(r.total) > 0 && Number(r.at) > 0));
function examEvidence(ex){
  const k = todayISO() + "|" + (state.updated || 0);
  if (XE_CACHE.k !== k) XE_CACHE = {k, m: {}};
  const ck = ex.id + "|" + (ex.readyDecks || []).join(",") + "|" + (ex.notes || "").length + "|" + ex.title + "|" + ex.courseId;
  if (ex.id && XE_CACHE.m[ck]) return XE_CACHE.m[ck];
  const live = c => !c.draft, alive = Object.values(state.decks || {}).filter(d => d && !d.archived);
  const all = alive.filter(d => !isQuizHolder(d)), course = all.filter(d => ex.courseId && d.courseId === ex.courseId);
  // Quizzes not made from flashcards (from slides, notes, a file or your own questions) live on their own, by course
  const holders = alive.filter(d => isQuizHolder(d)), courseQz = holders.filter(d => ex.courseId && d.courseId === ex.courseId).flatMap(d => (d.aiQuizzes || []).map(qz => Object.assign({deck: d}, qz)));
  // a flashcard deck's quiz history covers its own quizzes (made from its cards or saved in it)
  const deckRes = ds => ds.flatMap(d => (d.quizzes || []).filter(r => r && Number(r.total) > 0 && Number(r.at) > 0));
  let out = null;
  const linked = (ex.readyDecks || []).map(id => alive.find(d => d.id === id)).filter(Boolean);
  if (linked.length) {
    const ds = linked.filter(d => !isQuizHolder(d)), qs = linked.filter(d => isQuizHolder(d)).flatMap(d => d.aiQuizzes || []);
    out = {how: "linked", decks: ds, cards: ds.flatMap(d => d.cards.filter(live)), quiz: deckRes(ds).concat(quizResults(qs)), quizN: qs.length};
  }
  if (!out && (course.length || courseQz.length)) {
    // the exam's own words: its title, its notes, and announcements in its course that name it
    const name = String(ex.title || "").toLowerCase().replace(/\s+/g, " ").trim();
    let ann = ""; try { if (window.SBANN && name.length >= 4) ann = SBANN.items().filter(n => n.cid === ex.courseId && (n.title + " " + n.text).toLowerCase().includes(name)).map(n => n.title + " " + n.text).join(" "); } catch (e) {}
    const src = [ex.title, ex.notes, ann].join(" "), nums = xrNums(src), cards = course.flatMap(d => d.cards.filter(live).map(c => ({c, d})));
    // words that name topics: not shared by most of the course's cards and quizzes (those say nothing about this exam)
    const docs = cards.map(({c}) => c.front + " " + c.back).concat(courseQz.map(quizText)), freq = {};
    docs.forEach(t => new Set(xrWords(t)).forEach(w => { freq[w] = (freq[w] || 0) + 1; }));
    const terms = new Set(xrWords(src).filter(w => (freq[w] || 0) <= Math.max(1, docs.length * 0.5)));
    const textHit = t => xrNumHit(nums, t) || xrWords(t).some(w => terms.has(w));
    if (terms.size || Object.keys(nums).length) {
      const deckHit = d => xrNumHit(nums, d.name) || xrWords(d.name).some(w => terms.has(w));
      const hit = cards.filter(({c, d}) => deckHit(d) || textHit(c.front + " " + c.back));
      const qHit = courseQz.filter(qz => deckHit(qz.deck) || textHit(quizText(qz)));
      const cardsOk = hit.length >= 5 && hit.length >= cards.length * 0.1 && hit.length < cards.length * 0.95, quizOk = qHit.length > 0 && qHit.length < courseQz.length;
      if (cardsOk || (!cards.length && quizOk)) {
        const ds = course.filter(d => hit.filter(h => h.d === d).length >= d.cards.filter(live).length * 0.5);
        const runs = a => { const v = [...a].sort((x, y) => x - y), o = []; v.forEach(n => { const l = o[o.length - 1]; if (l && n === l[1] + 1) l[1] = n; else o.push([n, n]); }); return o.map(([x, y]) => x === y ? String(x) : x + "–" + y).join(", "); };
        // "chapters 4-6", "unit 2" for the sheet that explains what Automatic picked
        const label = Object.keys(nums).map(kk => ({ch: "chapter", unit: "unit", module: "module", week: "week", lecture: "lecture", lesson: "lesson"}[kk] || kk) + (nums[kk].size > 1 ? "s " : " ") + runs(nums[kk]));
        out = {how: "topics", decks: ds, cards: hit.map(h => h.c), terms: label.concat([...terms]).slice(0, 8), quiz: deckRes(ds).concat(quizResults(qHit)), quizN: qHit.length};
      }
    }
    // what was made since the course's previous exam (a later exam usually covers the newer material)
    if (!out && !isCumulative(ex)) {
      const prev = Object.values(state.tasks || {}).filter(t => t.id !== ex.id && t.courseId === ex.courseId && MILESTONE(t.type) && !t.prepFor && t.due && t.due < ex.due && (t.type === "Exam" || weightOf(t) >= 10)).sort((a, b) => b.due.localeCompare(a.due))[0];
      if (prev) {
        const since = parse(prev.due).getTime() + 864e5, fresh = cards.filter(({c, d}) => (cardBorn(c) || Number(d.created) || 0) >= since);
        const qFresh = courseQz.filter(qz => (Number(qz.created) || Number(qz.deck.created) || 0) >= since);
        if ((fresh.length >= 5 && fresh.length < cards.length * 0.95) || (!cards.length && qFresh.length && qFresh.length < courseQz.length)) {
          const ds = course.filter(d => (Number(d.created) || 0) >= since);
          out = {how: "since", decks: ds, cards: fresh.map(x => x.c), prev: prev.title, quiz: deckRes(ds).concat(quizResults(qFresh)), quizN: qFresh.length};
        }
      }
    }
    if (!out) out = {how: "course", decks: course, cards: course.flatMap(d => d.cards.filter(live)), quiz: deckRes(course).concat(quizResults(courseQz)), quizN: courseQz.length};
  }
  if (!out) out = {how: "none", decks: [], cards: [], quiz: [], quizN: 0};
  if (ex.id) XE_CACHE.m[ck] = out;
  return out;
}
let XR_CACHE = {k: "", m: {}};
function examReadiness(t){
  if (!t || !MILESTONE(t.type)) return null;
  const today = todayISO(), k = today + "|" + (typeof state !== "undefined" ? state.updated || 0 : 0);
  if (XR_CACHE.k !== k) XR_CACHE = {k, m: {}};
  const ck = [t.id, t.pct, t.aiPrep && t.aiPrep.at, t.status, t.courseId, (t.readyDecks || []).join(","), (t.notes || "").length].join("|");
  if (t.id && XR_CACHE.m[ck]) return XR_CACHE.m[ck];
  const self = Number(t.pct) > 0 ? Math.max(0, Math.min(100, Math.round(Number(t.pct)))) : null;
  const parts = {}, ws = [];
  let n = 0;
  // A prep plan's readiness already weighs its sessions, linked flashcards and quiz scores
  const ps = t.id ? allTasks().filter(x => x.prepFor === t.id) : [];
  const plan = ps.length && t.prep && window.SBPREP ? SBPREP.pct(t) : null;
  if (plan != null) { parts.plan = plan; n += XR_FULL; }
  else {
    const ev = examEvidence(t), decks = ev.decks, cards = ev.cards, seen = cards.filter(c => c.seen > 0).length;
    parts.how = ev.how; parts.prev = ev.prev || "";
    if (cards.length >= 5 && seen >= Math.min(10, cards.length)) { parts.cards = typeof DR !== "undefined" ? DR.deck(cards, today) : null; parts.cardsSeen = seen; parts.cardsAll = cards.length; if (parts.cards != null) { ws.push([parts.cards, 1]); n += seen; } }
    const since = Date.now() - XR_DAYS * 864e5;
    // practice quizzes: from the exam's flashcards, and quizzes made from slides, notes or your own questions in its course
    const qs = (ev.quiz || []).filter(q => Number(q.at) >= since).sort((a, b) => b.at - a.at).slice(0, 5);
    if (qs.length) { parts.quiz = Math.round(qs.reduce((s2, q) => s2 + Number(q.score) / Number(q.total), 0) / qs.length * 100); parts.quizN = qs.length; ws.push([parts.quiz, 1.5]); n += qs.reduce((s2, q) => s2 + Math.min(12, Math.max(4, Number(q.total) || 6)), 0); }
    const ai = typeof autoPlanOn === "function" && autoPlanOn() && t.status !== "done" && t.aiPrep && autoFresh(t.aiPrep, 4) ? t.aiPrep : null;
    if (ai) { parts.ai = Math.round(Number(ai.pct) || 0); ws.push([parts.ai, 1]); n += 10; }
  }
  const measured = parts.plan != null ? parts.plan : ws.length ? Math.round(ws.reduce((s2, w) => s2 + w[0] * w[1], 0) / ws.reduce((s2, w) => s2 + w[1], 0)) : null;
  const conf = measured == null ? 0 : Math.min(1, n / XR_FULL);
  const pct = measured == null ? self : self == null ? measured : Math.round(conf * measured + (1 - conf) * self);
  const gap = measured != null && self != null && n >= 10 && Math.abs(self - measured) >= XR_GAP ? self - measured : 0;
  const from = measured == null ? (self == null ? "none" : "feel") : conf >= 0.999 || self == null ? "results" : "both";
  const out = {pct, measured, self, conf, from, gap, parts, n};
  if (t.id) XR_CACHE.m[ck] = out;
  return out;
}
// What the measured readiness is made of, in words
function readinessSource(r){
  if (!r || !r.parts) return "";
  const p = r.parts, bits = [];
  if (p.plan != null) bits.push("your prep plan's sessions, flashcards and quizzes");
  if (p.cards != null) bits.push(`${p.how === "linked" ? "the flashcards you linked" : p.how === "topics" ? "flashcards on this exam's topics" : p.how === "since" ? `flashcards added since ${p.prev}` : "your flashcards for the course"} (${p.cardsSeen} of ${p.cardsAll} studied)`);
  if (p.quiz != null) bits.push(`${p.quizN === 1 ? "a practice quiz" : p.quizN + " practice quizzes"} (${p.quiz}% average)`);
  if (p.ai != null && p.plan == null) bits.push("the AI's read of your study");
  return bits.length > 1 ? bits.slice(0, -1).join(", ") + " and " + bits[bits.length - 1] : bits[0] || "";
}
// The gap between how ready you feel and what your results say, as one sentence (empty when they roughly agree)
function readinessGapText(r){
  if (!r || !r.gap) return "";
  return r.gap > 0 ? `You rate yourself ${r.self}% ready, but your results say about ${r.measured}%. Testing yourself on the cards you miss is the quickest way to close the gap.`
    : `Your results say about ${r.measured}%, more than the ${r.self}% you rate yourself. You may be further along than you think.`;
}
// The different days you studied for an exam before it: focus or logged time on the exam or its study sessions,
// study sessions finished, and flashcard reviews in its course. Spreading study over several days is what makes it stick.
const STUDY_TIME_RX = /^(?:Focus session|Logged time):? (\d+)m/;
function examStudyDays(ex){
  if (!ex || !ex.due) return [];
  const days = new Set(), before = d => d && d < ex.due, dayOfMs = ms => iso(new Date(Number(ms)));
  allTasks().filter(t => t.id === ex.id || t.prepFor === ex.id).forEach(t => {
    (t.history || []).forEach(h => { const m = STUDY_TIME_RX.exec((h && h.text) || ""); if (m && Number(m[1]) >= 5 && Number(h.at) > 0) { const d = dayOfMs(h.at); if (before(d)) days.add(d); } });
    if (t.prepFor && t.status === "done" && Number(t.doneAt) > 0) { const d = dayOfMs(t.doneAt); if (before(d)) days.add(d); }
  });
  if (ex.courseId) Object.values(state.decks || {}).filter(d => d.courseId === ex.courseId && d.rv).forEach(d => Object.keys(d.rv).forEach(k => { if (before(k) && Number(d.rv[k]) >= 5 && k >= addDays(ex.due, -30)) days.add(k); }));
  return [...days].sort();
}
// Studied for it on 3 or more days, starting 5 or more days before
const examSpread = ex => { const ds = examStudyDays(ex); return ds.length >= 3 && ds[0] <= addDays(ex.due, -5); };
function progress(t){
  if (t.breakdownParent) { const k = allTasks().filter(x => x.breakdownOf === t.id); if (k.length) { const d = k.filter(x => x.status === "done").length; return {total: k.length, done: d, frac: t.status === "done" ? 1 : d / k.length, ms: true}; } }
  const total = (t.checklist || []).length, done = (t.checklist || []).filter(i => i.done).length;
  if (MILESTONE(t.type)) {
    const ps = t.status === "done" ? [] : allTasks().filter(x => x.prepFor === t.id);
    const pm = ps.reduce((s, x) => s + (Number(x.hours) || 0), 0), dm = ps.filter(x => x.status === "done").reduce((s, x) => s + (Number(x.hours) || 0), 0);
    const ai = autoPlanOn() && t.status !== "done" && t.aiPrep && autoFresh(t.aiPrep, 4) ? t.aiPrep : null;
    const xr = examReadiness(t), sess = pm ? dm / pm : 0;
    // Measured readiness leads; with no evidence at all, how ready you feel (or the share of planned sessions done)
    const frac = t.status === "done" ? 1 : xr && xr.measured != null ? xr.pct / 100 : Math.max((Number(t.pct) || 0) / 100, sess);
    return {total, done, frac, prep: true, plan: ps.length, ai, xr};
  }
  return {total, done, frac: total ? done / total : (t.status === "done" ? 1 : (Number(t.pct) || 0) / 100)};
}
function hoursLeft(t){
  if (!isNum(t.hours) || t.status === "done" || MILESTONE(t.type)) return 0;
  if (bdHasKids(t)) return 0.25;
  return Number(t.hours) * (1 - progress(t).frac);
}
const inFilter = t => ui.filter === "all" || t.courseId === ui.filter;
const inFilterCourse = id => ui.filter === "all" || id === ui.filter;
function matchesQ(t){
  const q = ui.q.trim().toLowerCase();
  if (!q) return true;
  const c = courseOf(t.courseId);
  const hay = [t.title, t.notes, t.type, c && c.name, c && c.code, ...(t.checklist || []).map(i => i.text)].join(" ").toLowerCase();
  return q.split(/\s+/).every(w => hay.includes(w));
}
const visibleTasks = () => tasksArr().filter(t => inFilter(t) && matchesQ(t));
function sortTasks(a, b){
  if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1;
  if (a.due && !b.due) return -1;
  if (!a.due && b.due) return 1;
  if ((a.time || "") !== (b.time || "")) return (a.time || "99") < (b.time || "99") ? -1 : 1;
  const p = {urgent:0, high:1, med:2, low:3};
  return (p[a.priority] ?? 2) - (p[b.priority] ?? 2);
}
function boardOrder(a, b){
  const ao = typeof a.order === "number" ? a.order : Infinity, bo = typeof b.order === "number" ? b.order : Infinity;
  if (ao !== bo) return ao < bo ? -1 : 1;
  return sortTasks(a, b);
}
function relDue(t){
  if (!t.due) return "No due date";
  const n = dayDiff(todayISO(), t.due);
  let s;
  if (n === 0) s = "Due today";
  else if (n === 1) s = "Due tomorrow";
  else if (n < 0 && t.status !== "done") s = n === -1 ? "1 day late" : `${-n} days late`;
  else if (n > 1 && n < 7) s = "Due " + parse(t.due).toLocaleDateString(undefined, {weekday:"long"});
  else s = "Due " + fmtDate(t.due);
  if (t.time) s += ", " + fmtTime(t.time);
  return s;
}
function dueDate(t){ const d = parse(t.due); if (t.time) { const [h, m] = t.time.split(":").map(Number); d.setHours(h, m); } else d.setHours(23, 59); return d; }
function soonBadge(t){
  if (t.status === "done" || !t.due) return "";
  const h = (dueDate(t) - new Date()) / 36e5;
  if (h < 0) return `<span class="soon late">Late</span>`;
  if (h <= 48) {
    const label = t.due === todayISO() ? (t.time ? "Due in " + Math.max(1, Math.round(h)) + "h" : "Due today") : (h < 24 && t.time ? "Due in " + Math.round(h) + "h" : "Due tomorrow");
    return `<span class="soon">${label}</span>`;
  }
  return "";
}
const blockers = t => (t.dependsOn || []).map(id => state.tasks[id]).filter(d => d && d.status !== "done");
function atRisk(t){
  if (t.status === "done" || !t.due) return false;
  const fx = FOCUS && FOCUS.info[t.id];
  if (fx && fx.behind >= 0.5 && fx.dl >= 0) return true;
  const d = dayDiff(todayISO(), t.due);
  if (MILESTONE(t.type)) return d >= 0 && d <= 3 && progress(t).frac < 0.5;
  return d >= 0 && d <= 2 && progress(t).frac < 0.5 && (t.status === "todo" || hoursLeft(t) > 2);
}
const filesOfTask = id => Object.values(state.files).filter(f => f.taskIds.includes(id));
function statusBadges(t){
  let h = "";
  const b = blockers(t);
  if (b.length && t.status !== "done") h += `<span class="pill wait" title="Waiting on ${esc(b.map(x => x.title).join(", "))}">Waiting on ${esc(b[0].title)}${b.length > 1 ? " +" + (b.length - 1) : ""}</span>`;
  if (atRisk(t)) h += `<span class="pill risk">At risk</span>`;
  return h;
}
function shiftPlan(rootId){
  const plan = {};
  const get = id => Object.assign({}, state.tasks[id], plan[id] || {});
  const queue = [rootId]; let guard = 0;
  while (queue.length && guard++ < 300) {
    const pid = queue.shift(), pr = get(pid);
    if (!pr.due) continue;
    tasksArr().filter(x => (x.dependsOn || []).includes(pid) && x.status !== "done").forEach(sx => {
      const cur = get(sx.id); if (!cur.due) return;
      const st = startOf(cur);
      if (st <= pr.due) { const delta = dayDiff(st, addDays(pr.due, 1)); plan[sx.id] = {start: addDays(st, delta), due: addDays(cur.due, delta)}; queue.push(sx.id); }
    });
  }
  return plan;
}
function shiftOffer(rootId){
  const plan = shiftPlan(rootId), ids = Object.keys(plan);
  if (!ids.length) return null;
  return {label: `Shift ${ids.length} dependent task${ids.length === 1 ? "" : "s"}`, fn: () => {
    applyChanges(ids.map(id => ({kind:"task", id, after: Object.assign(clone(state.tasks[id]), plan[id])})), `Shifted ${ids.length} dependent task${ids.length === 1 ? "" : "s"}`);
  }};
}
const prioBadge = p => `<span class="prio ${esc(p || "med")}">${esc(PRIO[p] || "Medium")}</span>`;
const fmtH = h => (Math.round(h * 10) / 10) + "h";
function nextOrder(status){
  const same = tasksArr().filter(x => x.status === status && typeof x.order === "number");
  return same.length ? Math.max(...same.map(x => x.order)) + 10 : 10;
}
function newTask(fields){
  const due = fields.due || "";
  let start = fields.start || todayISO();
  if (due && start > due) start = due;
  return normTask(Object.assign({id: uid(), created: Date.now(), order: nextOrder(fields.status || "todo")}, fields, {start}));
}
let toastT, toastUndoFn = null, toastExtraFn = null, toastExtra2Fn = null, toastMs = 0, toastErr = false, toastAt = 0;
// Long enough to read (about 15 characters a second), longer with a button to press
const toastLen = (msg, undoFn, n) => Math.max(n ? 9000 : undoFn ? 8000 : 2600, Math.min(12000, 1500 + String(msg || "").length * 65));
// extra is one {label, fn} or a list of up to two. opts.error: stays until dismissed and is announced at once
function toast(msg, undoFn, extra, opts){
  const t = $("#toast"), b = $("#toastUndo"), x = $("#toastExtra"), more = extra ? [].concat(extra).filter(Boolean) : [], err = !!(opts && opts.error);
  let xx = $("#toastX");
  if (!xx) { xx = document.createElement("button"); xx.id = "toastX"; xx.type = "button"; xx.className = "toast-x"; xx.setAttribute("aria-label", "Dismiss"); t.appendChild(xx); xx.addEventListener("click", () => { clearTimeout(toastT); t.classList.remove("show", "toast-err"); toastErr = false; toastUndoFn = null; toastExtraFn = null; toastExtra2Fn = null; }); }
  t.setAttribute("role", err ? "alert" : "status"); t.classList.toggle("toast-err", err); t.classList.toggle("toast-done", !err && !!(opts && opts.done)); xx.hidden = !err; toastErr = err;
  $("#toastMsg").textContent = SPELL.fix(msg);
  toastUndoFn = undoFn || null;
  b.hidden = !undoFn;
  toastExtraFn = more[0] ? more[0].fn : null;
  x.hidden = !more[0]; if (more[0]) x.textContent = more[0].label;
  let x2 = $("#toastExtra2");
  if (more[1] && !x2) { x2 = document.createElement("button"); x2.id = "toastExtra2"; x.after(x2); x2.addEventListener("click", () => { const f = toastExtra2Fn; toastExtra2Fn = null; t.classList.remove("show"); if (f) f(); }); }
  toastExtra2Fn = more[1] ? more[1].fn : null;
  if (x2) { x2.hidden = !more[1]; if (more[1]) x2.textContent = more[1].label; }
  let host = document.body; try { if (dlg.open) host = dlg; } catch(e) {}
  if (t.parentNode !== host) host.appendChild(t);
  t.classList.add("show");
  toastMs = toastLen(msg, undoFn, more.length); toastAt = Date.now();
  if (err || t.contains(document.activeElement)) clearTimeout(toastT); else toastTimer(toastMs);
  try { document.documentElement.style.setProperty("--toast-h", t.offsetHeight + "px"); } catch(e) {}
}
function toastTimer(ms){
  clearTimeout(toastT);
  toastT = setTimeout(() => { $("#toast").classList.remove("show"); toastUndoFn = null; toastExtraFn = null; toastExtra2Fn = null; }, ms);
}
document.addEventListener("close", e => { const t = $("#toast"); if (t && e.target && t.parentNode === e.target) document.body.appendChild(t); }, true);
$("#toastUndo").addEventListener("click", () => { const f = toastUndoFn; toastUndoFn = null; $("#toast").classList.remove("show"); if (f) f(); });
$("#toastExtra").addEventListener("click", () => { const f = toastExtraFn; toastExtraFn = null; $("#toast").classList.remove("show"); if (f) f(); });
// Pointing at a toast with a button, or tabbing into it, holds it open
{ const t = $("#toast"), acts = () => t.classList.contains("show") && !!(toastUndoFn || toastExtraFn || toastExtra2Fn), hold = e => { if (acts() && (e.type === "focusin" || Date.now() - toastAt > 700)) clearTimeout(toastT); }, go = () => { if (acts() && !toastErr) toastTimer(Math.max(3000, toastMs / 2)); };
  t.addEventListener("pointerenter", hold); t.addEventListener("pointermove", hold); t.addEventListener("focusin", hold);
  t.addEventListener("pointerleave", () => { if (!t.contains(document.activeElement)) go(); });
  t.addEventListener("focusout", () => setTimeout(() => { if (!t.contains(document.activeElement) && !t.matches(":hover")) go(); }, 0)); }
// Empty pages: two notebook cards and Mochi's sprout, drawn in the theme's colours
function emptyArt(){
  const star = (x, y, r, c) => { const a = +(r * .18).toFixed(2), b = +(r * .82).toFixed(2); return `<path class="${c}" d="M${x} ${y - r}q${a} ${b} ${r} ${r}q-${b} ${a}-${r} ${r}q-${a}-${b}-${r}-${r}q${b}-${a} ${r}-${r}z"/>`; };
  return `<svg class="es-art" viewBox="0 0 200 140" aria-hidden="true" focusable="false">
    <g transform="rotate(-8 73 78)"><rect class="es-card" x="34" y="30" width="78" height="96" rx="10"/><rect class="es-hl2" x="44" y="46" width="40" height="7" rx="3.5"/><rect class="es-line" x="44" y="62" width="58" height="5" rx="2.5"/><rect class="es-line" x="44" y="74" width="46" height="5" rx="2.5"/><rect class="es-line" x="44" y="86" width="52" height="5" rx="2.5"/></g>
    <g transform="rotate(7 127 70)"><rect class="es-card" x="88" y="22" width="78" height="96" rx="10"/><rect class="es-hl" x="98" y="38" width="44" height="7" rx="3.5"/><rect class="es-line" x="98" y="54" width="58" height="5" rx="2.5"/><rect class="es-line" x="98" y="66" width="50" height="5" rx="2.5"/><rect class="es-line" x="98" y="78" width="54" height="5" rx="2.5"/></g>
    <path class="es-stem" d="M100 91v-10"/><path class="es-leaf" d="M100 83q-9-7-14-1q7 5 14 1zM100 83q9-7 14-1q-7 5-14 1z"/>
    <circle class="es-face" cx="100" cy="112" r="22"/><circle class="es-eye" cx="93" cy="111" r="2.2"/><circle class="es-eye" cx="107" cy="111" r="2.2"/><path class="es-smile" d="M96 117q4 3 8 0"/><circle class="es-cheek" cx="88" cy="116" r="3"/><circle class="es-cheek" cx="112" cy="116" r="3"/>
    ${star(172, 32, 7, "es-star")}${star(26, 30, 5, "es-star2")}
  </svg>`;
}
function safeUrl(u){
  u = String(u || "").trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try { const x = new URL(u); return (x.protocol === "http:" || x.protocol === "https:") ? x.href : null; } catch(e){ return null; }
}

// The page for a task on the school's learning site (Canvas, Brightspace, Blackboard)
const LMS_NAMES = {bs: "Brightspace", cv: "Canvas", bb: "Blackboard"};
const LMS_GO = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/></svg>';
const lmsSite = t => { const k = t && Object.keys(LMS_NAMES).find(f => t[f] && t[f].key); return k ? LMS_NAMES[k] : ""; };
function lmsGoBtn(t, cls){
  const u = t && t.link ? safeUrl(t.link) : null; if (!u) return "";
  const where = lmsSite(t) || "the school site";
  return `<button type="button" class="lms-go ${cls || ""}" data-act="lms-go" data-url="${esc(u)}" title="Open in ${esc(where)}" aria-label="Open ${esc(t.title)} in ${esc(where)}">${LMS_GO}</button>`;
}
// A course's home page on the school's site
function lmsCourseLink(c){
  const names = Object.values(LMS_NAMES), l = ((c && c.links) || []).find(x => x && names.includes(x.label) && safeUrl(x.url));
  return l ? {name: l.label, url: safeUrl(l.url)} : null;
}
// Opens in a new tab, or in the computer's own browser in the desktop app
function openOutside(u){ u = safeUrl(u); if (!u) return; try { window.open(u, "_blank", "noopener,noreferrer"); } catch(e) { location.href = u; } }
hook("act", (act, el) => { if (act !== "lms-go") return false; openOutside(el.dataset.url); return true; });

/* Workload */
function workloadByDay(ts){
  const per = {};
  ts.forEach(t => {
    if (!isNum(t.hours) || !t.due || Number(t.hours) <= 0 || MILESTONE(t.type)) return;
    const s = startOf(t), n = dayDiff(s, t.due) + 1, h = (bdHasKids(t) ? 0.25 : Number(t.hours)) / n;
    for (let i = 0; i < n; i++) { const k = addDays(s, i); per[k] = (per[k] || 0) + h; }
  });
  return per;
}
function weekHours(ts, monday){
  const per = workloadByDay(ts);
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += per[addDays(monday, i)] || 0;
  return sum;
}

/* Shared pieces */
// Course filter as a dropdown
function coursePickHtml(){
  const cs = coursesArr();
  if (!cs.length) return "";
  const on = cs.find(c => c.id === ui.filter);
  return `<label class="cf-pick${on ? " on" : ""}"${on ? ` style="--c:${esc(on.color)}"` : ""}>${on ? `<span class="dot" aria-hidden="true"></span>` : `<span class="dot dot-all" aria-hidden="true" style="--dots:conic-gradient(${cs.slice(0, 6).map((c, i, a) => `${esc(c.color)} ${Math.round(i / a.length * 100)}% ${Math.round((i + 1) / a.length * 100)}%`).join(",")})"></span>`}<span class="cf-l">${esc(on ? courseLabel(on) : "All Courses")}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
    <select data-course-filter aria-label="Filter by course"><option value="all"${on ? "" : " selected"}>All Courses</option>${cs.map(c => `<option value="${esc(c.id)}"${on === c ? " selected" : ""}>${esc(courseLabel(c))}${c.name && courseLabel(c) !== c.name ? ` · ${esc(c.name)}` : ""}</option>`).join("")}</select></label>`;
}
function chipsHtml(right){
  const cs = coursesArr();
  if (!cs.length) return "";
  const on = cs.find(c => c.id === ui.filter);
  return `<div class="chips cf-chips" role="group" aria-label="Filter by course">
    <button class="chip" data-act="filter" data-id="all" aria-pressed="${ui.filter === "all"}">All Courses</button>
    ${cs.map(c => `<button class="chip" style="--c:${esc(c.color)}" data-act="filter" data-id="${esc(c.id)}" aria-pressed="${ui.filter === c.id}"><span class="dot"></span>${esc(courseLabel(c))}</button>`).join("")}
  </div><div class="cf-row">${coursePickHtml()}${right || ""}</div>`;
}
function searchNote(){
  if (!ui.q.trim()) return "";
  if (ui.tab === "files") { const n = filesVisible().length; return `<div class="search-note">${n} file${n === 1 ? "" : "s"} match “${esc(ui.q.trim())}”. <button class="link-btn" data-act="search-clear">Clear Search</button></div>`; }
  const n = visibleTasks().length;
  return `<div class="search-note">${n} task${n === 1 ? "" : "s"} match “${esc(ui.q.trim())}”. <button class="link-btn" data-act="search-clear">Clear Search</button></div>`;
}
function taskRow(t, opts = {}){
  const c = courseOf(t.courseId);
  const late = t.status !== "done" && t.due && t.due < todayISO();
  const meta = [];
  if (c && !opts.hideCourse) meta.push(`<span class="tag">${esc(courseLabel(c))}</span>`);
  meta.push(`<span>${esc(t.type || "Task")}</span>`);
  meta.push(`<span class="${late ? "late" : ""}">${esc(relDue(t))}</span>`);
  if (t.status === "doing") meta.push(`<span class="pill">In Progress</span>`);
  if ((t.priority === "high" || t.priority === "urgent") && t.status !== "done") meta.push(prioBadge(t.priority));
  const sb = statusBadges(t); if (sb) meta.push(sb);
  const p = progress(t);
  if (p.prep && t.status !== "done") { meta.push(`<span>${Math.round(p.frac * 100)}% prepared</span>`); const pl = window.SBPREP ? SBPREP.rowLine(t) : ""; if (pl) meta.push(`<span>${esc(pl)}</span>`); }
  else if (p.ms) meta.push(window.SBBREAK ? SBBREAK.rowMeta(t) : `<span>${p.done}/${p.total} milestones</span>`);
  else if (p.total) meta.push(`<span>${p.done}/${p.total} steps</span>`);
  if (t.breakdownOf && window.SBBREAK) meta.push(SBBREAK.rowMeta(t));
  if (opts.why) meta.push(`<span class="why">${esc(opts.why)}</span>`);
  return `<li class="task ${t.status === "done" ? "is-done" : ""}" style="--c:${esc(colorOf(t.courseId))}">
    <button class="check" data-act="toggle" data-id="${esc(t.id)}" aria-label="${t.status === "done" ? "Mark not complete" : "Mark complete"}: ${esc(t.title)}">${CHECK}</button>
    <button class="task-main" data-act="edit-task" data-id="${esc(t.id)}">
      <span class="task-title">${esc(t.title)}</span>
      <span class="task-meta">${meta.join("")}</span>
    </button>${window.SBBREAK ? SBBREAK.rowBtn(t) : ""}${window.SBPREP ? SBPREP.rowBtn(t) : ""}${lmsGoBtn(t)}</li>`;
}
const taskList = (ts, opts) => `<ul class="tasks">${ts.map(t => taskRow(t, opts)).join("")}</ul>`;
function section(title, ts, cls = "", opts){
  if (!ts.length) return "";
  return `<h2 class="sec ${cls}"><span class="t">${esc(title)}</span><span class="n">${ts.length}</span></h2>${taskList(ts, opts)}`;
}
