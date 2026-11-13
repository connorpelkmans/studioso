/* ===== module: 99-class-sessions.js: every class of a course, each with its own page ===== */
/* Class pages. A course's Lectures tab lists every class meeting across the term (lectures, labs, discussions, tutorials,
   office hours), week by week. Each one opens its class page: the notes, slides and files for that class (typed notes,
   uploads, Google Drive files), and its recording with the transcript and summary.
   The same class page opens from a class on the Schedule, and the course's Lecture Notes folder in Files shows the same
   things grouped by class, so a class's material is in one place wherever you look.

   A class is one occurrence of a course meeting, keyed like the Schedule keys it: "date|start|kind" (the usual date, so a
   class moved for one week keeps its key). Notes and files belong to a class by carrying that key as `cls` (with their
   courseId); nothing else is stored. Recordings carry `cls` too, and an older recording without one is matched to the class
   it was made in (same day, during or just after the class). Uploads from a class page go to the course's Lecture Notes
   folder, and in Google Drive or OneDrive to <course>/Lectures/<date> <class>. The term's dates are guessed from the course's
   own dates until the student sets them (course.classDates {from, until}). */
var SBCLS = null;
(() => {
  const SV = (p, s) => `<svg viewBox="0 0 24 24" width="${s || 18}" height="${s || 18}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${p}</svg>`;
  const IC = {
    note: p => SV('<path d="M4 4h16v10l-6 6H4z"/><path d="M14 20v-6h6"/>', p),
    file: p => SV('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>', p),
    mic: p => SV('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>', p),
    sum: p => SV('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 12l2 2 4-4"/>', p),
    board: p => SV('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M7 13l3-3 3 2 4-4M8 21l4-4 4 4"/>', p),
    up: p => SV('<path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/>', p),
    link: p => SV('<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>', p),
    plus: p => SV('<path d="M12 5v14M5 12h14"/>', p),
    prev: p => SV('<path d="M15 18l-6-6 6-6"/>', p),
    next: p => SV('<path d="M9 18l6-6-6-6"/>', p),
    folder: p => SV('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', p)
  };
  const DRIVE = () => (window.SBCLOUD && SBCLOUD.icons && SBCLOUD.icons.google) || IC.file(16);
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const isLec = f => !!f && f.folderId === "lectures";
  const dOf = ms => { const d = new Date(Number(ms) || Date.now()); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const minOfDay = ms => { const d = new Date(Number(ms) || 0); return d.getHours() * 60 + d.getMinutes(); };
  const tMin = t => { const [h, m] = String(t || "0:0").split(":").map(Number); return (h || 0) * 60 + (m || 0); };
  const keyParts = k => { const [date, start, ...kind] = String(k || "").split("|"); return {date, start, kind: kind.join("|") || "Class"}; };
  const day = (d, o) => parse(d).toLocaleDateString(undefined, o || {weekday: "short", month: "short", day: "numeric"});
  const NUMBERED = k => k !== "Office Hours";
  /* Classes also come from calendar events linked to the course (a school calendar's "NK1 Module 8, Class 3 · Lecture"):
     a timed event whose label is a kind of class, or that has no label */
  const CLASS_KIND = /lecture|lab|discussion|tutorial|seminar|recitation|class|studio|clinical|practicum|workshop|office hours|section|lesson/i;
  // An event with no label only counts when it looks like a class: it repeats, names a kind of class, or is titled with the course.
  // Imported deadlines ("Forms DUE", "Essay submission") are timed events too: a clear deadline word always rules one out,
  // and a softer one (plan, report, exam) does unless the title also names a kind of class ("Exam Review Lecture" stays)
  const DUE_WORD = /\bdue\b|deadline|submi(t|ssion)|lab report|\bcloses?\b|\bopens?\b/i;
  const DEADLINE = /assignment|\bexam\b|midterm|\bquiz|\btest\b|\bforms?\b|\bplan\b|\breport\b|\bessay\b|\bpaper\b|\bproject\b|portfolio|reflection|\bavailable\b/i;
  const squash = x => String(x || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const namesCourse = ev => { const c = state.courses && state.courses[ev.courseId], t = squash(ev.title); if (!c || !t) return false;
    return [c.code, c.name].map(squash).some(k => k && (t === k || (t.includes(k) && t.length <= k.length + 12))); };
  const isClassEvent = ev => !!ev && !!ev.courseId && !ev.allDay && !!ev.start && (ev.label ? CLASS_KIND.test(ev.label)
    : unlabeledClass(ev));
  function unlabeledClass(ev){
    const t = ev.title || "";
    if (DUE_WORD.test(t)) return false;
    if (CLASS_KIND.test(t)) return true;
    return !DEADLINE.test(t) && (!!(ev.repeat && ev.repeat.days && ev.repeat.days.length) || namesCourse(ev));
  }
  // A class's key: "date|start|kind" (the usual date and time, so a class moved for one week keeps it)
  const classKey = o => o.type === "meet" ? o.key : `${o.orig}|${(o.ev && o.ev.start) || o.start}|${o.label || "Class"}`;
  const courseIdOf = o => o.type === "meet" ? o.id : o.ev && o.ev.courseId;

  /* The term */
  function termOf(c){
    const cd = c.classDates || {}, today = todayISO();
    let from = isDate(cd.from) ? cd.from : "", until = isDate(cd.until) ? cd.until : "";
    // Courses usually share one term: dates set on another course are the best guess for this one
    if (!from || !until) {
      const other = coursesArr().map(x => x.classDates || {}).filter(d => isDate(d.from) && isDate(d.until) && d.until >= d.from);
      if (other.length) { if (!from) from = other[0].from; if (!until) until = other[0].until; }
    }
    if (!from || !until) {
      // ...otherwise the term is guessed from every course's dates, so all courses agree on Week 1
      const seen = [], mine = new Set(coursesArr().map(x => x.id));
      allTasks().forEach(t => { if (mine.has(t.courseId)) { if (isDate(t.due)) seen.push(t.due); if (isDate(t.start)) seen.push(t.start); } });
      Object.values(state.files || {}).forEach(f => { if (mine.has(f.courseId) && isLec(f)) seen.push(dOf(f.created)); });
      Object.values(state.notes || {}).forEach(n => { if (mine.has(n.courseId) && n.cls) seen.push(keyParts(n.cls).date); });
      eventsArr().forEach(e => { if (mine.has(e.courseId) && isClassEvent(e)) { seen.push(e.date); if (e.repeat && e.repeat.until) seen.push(e.repeat.until); } });
      const early = seen.filter(isDate).sort()[0], late = seen.filter(isDate).sort().pop();
      if (!from) { from = [...coursesArr().map(x => x.created ? dOf(x.created) : today), early || today].filter(isDate).sort()[0] || today; if (from < addDays(today, -150)) from = addDays(today, -150); }
      if (!until) { until = late && late > addDays(today, 28) ? late : addDays(today, 28); if (until > addDays(from, 180)) until = addDays(from, 180); }
    }
    if (until < from) until = from;
    return {from, until, set: isDate(cd.from) && isDate(cd.until)};
  }

  /* Every class of a course in its term, numbered per kind (Lecture 7, Lab 3); skipped classes stay listed but aren't counted */
  let CACHE = null;
  function classesOf(c){
    if (!c) return [];
    if (!CACHE || CACHE.at !== state.updated || CACHE.st !== state) CACHE = {at: state.updated, st: state, by: new Map()};
    if (CACHE.by.has(c.id)) return CACHE.by.get(c.id);
    const T = termOf(c);
    let occ = []; try { occ = schOccurrences(T.from, T.until).filter(o => (o.type === "meet" && o.id === c.id) || (o.type === "event" && o.ev && o.ev.courseId === c.id && isClassEvent(o.ev))); } catch (e) { occ = []; }
    // an imported event at the same time as one of the course's own class times is the same class
    const meetAt = new Set(occ.filter(o => o.type === "meet").map(o => o.date + "|" + o.start));
    occ = occ.filter(o => o.type === "meet" || !meetAt.has(o.date + "|" + o.start));
    occ.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
    const num = {}, total = {};
    occ.forEach(o => { const k = o.label || "Class"; if (!o.skipped) total[k] = (total[k] || 0) + 1; });
    const list = occ.map(o => {
      const kind = o.label || "Class", n = o.skipped ? 0 : (num[kind] = (num[kind] || 0) + 1);
      return {key: classKey(o), cid: c.id, date: o.date, orig: o.orig, start: o.start, end: o.end, where: o.where || "", kind, n, of: total[kind] || 0, skipped: !!o.skipped, moved: !!o.moved,
        title: NUMBERED(kind) && n ? `${kind} ${n}` : kind, name: o.type === "event" && o.title && o.title !== kind ? o.title : ""};
    });
    CACHE.by.set(c.id, list);
    return list;
  }
  const findClass = (cid, key) => classesOf(courseOf(cid)).find(x => x.key === key) || null;
  // A class that isn't in the term any more (its time changed): named from its key
  const looseClass = (cid, key) => { const p = keyParts(key); return {key, cid, date: p.date, start: p.start, end: "", where: "", kind: p.kind, n: 0, of: 0, skipped: false, moved: false, title: p.kind, gone: true}; };
  const classOf = (cid, key) => findClass(cid, key) || (isDate(keyParts(key).date) ? looseClass(cid, key) : null);

  /* What belongs to a class */
  function recKeyOf(f){
    if (!isLec(f)) return "";
    if (f.cls) return f.cls;
    // older recordings: the class it was made in or just after (saving happens at the end), on the day it was made
    const d = dOf(f.created), m = minOfDay(f.created), cands = classesOf(courseOf(f.courseId)).filter(x => x.date === d && !x.skipped);
    const fit = cands.filter(x => m >= tMin(x.start) - 15 && m <= tMin(x.end || x.start) + 90).sort((a, b) => Math.abs(m - tMin(a.end)) - Math.abs(m - tMin(b.end)));
    return fit[0] ? fit[0].key : cands.length === 1 ? cands[0].key : "";
  }
  function itemsOf(cid, key){
    const notes = Object.values(state.notes || {}).filter(n => n && n.courseId === cid && n.cls === key && !n.archived).sort((a, b) => (a.created || 0) - (b.created || 0));
    const files = Object.values(state.files || {}).filter(f => f && f.courseId === cid && f.cls === key && !isLec(f)).sort((a, b) => (a.created || 0) - (b.created || 0));
    const recs = Object.values(state.files || {}).filter(f => f && f.courseId === cid && isLec(f) && recKeyOf(f) === key).sort((a, b) => (a.created || 0) - (b.created || 0));
    return {notes, files, recs, n: notes.length + files.length + recs.length};
  }
  const hasSum = f => !!(f.lec && f.lec.sum);
  function badges(I){
    const b = [];
    const nn = I.notes.length + I.files.length;
    if (nn) b.push(`<span class="cls-b">${IC.note(14)}${nn}</span>`);
    if (I.recs.length) b.push(`<span class="cls-b k-rec">${IC.mic(14)}${I.recs.length > 1 ? I.recs.length : ""}</span>`);
    if (I.recs.some(hasSum)) b.push(`<span class="cls-b k-sum">${IC.sum(14)}</span>`);
    return b.join("");
  }
  const hasLine = I => [I.notes.length ? plural(I.notes.length, "note") : "", I.files.length ? plural(I.files.length, "file") : "", I.recs.length ? "Recording" : "", I.recs.some(hasSum) ? "Summary" : ""].filter(Boolean).join(" · ");

  /* The Lectures tab: every class, week by week */
  const kindsOf = list => [...new Set(list.map(x => x.kind))];
  function listHtml(c){
    const all = classesOf(c), T = termOf(c), today = todayISO();
    const kinds = kindsOf(all), want = ui.clsKind && ui.clsKind[c.id], pick = want && kinds.includes(want) ? want : "";
    const list = all.filter(x => !pick || x.kind === pick);
    const termLine = `${day(T.from, {month: "short", day: "numeric"})} – ${day(T.until, {month: "short", day: "numeric", year: "numeric"})}`;
    const hasNow = list.some(x => mondayOf(x.date) === mondayOf(today));
    const top = `<div class="cls-top">${c2Head("classes", "Classes", all.filter(x => !x.skipped).length || "")}${hasNow ? `<button type="button" class="btn small cls-now" data-act="cls-now">This Week</button>` : ""}</div>
      <p class="mini cls-term">${T.set ? "" : "About "}${esc(termLine)} <button type="button" class="link-btn" data-act="cls-dates" data-cid="${esc(c.id)}">${T.set ? "Change" : "Set Term Dates"}</button></p>`;
    if (!all.length) return `<section class="c2-card2 c2-box cls-tab" style="--c:${esc(c.color)}">${top}<div class="empty"><strong>No Class Times Yet</strong>Add this course's class times (lectures, labs, discussions, office hours) and every class of the term shows here, each with a page for its notes and recording. <div class="row-actions" style="justify-content:center;margin-top:10px"><button type="button" class="btn small primary" data-act="edit-course" data-id="${esc(c.id)}">Add Class Times</button></div></div></section>`;
    const chips = kinds.length > 1 ? `<div class="cls-kinds ep-days" role="group" aria-label="Show">${[["", "All"]].concat(kinds.map(k => [k, k === "Office Hours" ? k : /(s|x|z|ch|sh)$/i.test(k) ? k + "es" : k + "s"])).map(([k, l]) => `<button type="button" data-act="cls-kind" data-cid="${esc(c.id)}" data-k="${esc(k)}" aria-pressed="${pick === k}">${esc(l)}</button>`).join("")}</div>` : "";
    const mon = d => mondayOf(d), wk0 = mon(T.from), weeks = new Map();
    list.forEach(x => { const w = mon(x.date); if (!weeks.has(w)) weeks.set(w, []); weeks.get(w).push(x); });
    const nowW = mon(today), nextUp = list.find(x => !x.skipped && (x.date > today || (x.date === today && tMin(x.end) >= minOfDay(Date.now()))));
    const row = x => {
      const I = itemsOf(c.id, x.key), past = x.date < today, isToday = x.date === today, isNext = nextUp === x;
      return `<li><button type="button" class="cls-row${isToday ? " is-today" : ""}${past ? " is-past" : ""}${x.skipped ? " is-skip" : ""}${I.n ? " has" : ""}" data-act="cls-open" data-cid="${esc(c.id)}" data-key="${esc(x.key)}">
        <span class="cls-date"><b>${parse(x.date).getDate()}</b><span>${esc(day(x.date, {weekday: "short"}))}</span></span>
        <span class="cls-main"><b>${esc(x.title)}${isToday ? ` <span class="cls-pill">Today</span>` : isNext ? ` <span class="cls-pill k-next">Next</span>` : ""}</b><span class="mini">${x.skipped ? "No class this week" : esc([x.name, `${fmtTime(x.start)}–${fmtTime(x.end)}`, x.where, x.moved ? "Moved" : ""].filter(Boolean).join(" · "))}</span></span>
        <span class="cls-has">${badges(I)}</span></button></li>`;
    };
    const body = [...weeks.entries()].map(([w, xs]) => {
      const wn = Math.floor(dayDiff(wk0, w) / 7) + 1;
      return `<div class="cls-week${w === nowW ? " is-now" : ""}"><h3 class="cls-wk"><span>Week ${wn}</span><span class="mini">${esc(day(w, {month: "short", day: "numeric"}))} – ${esc(day(addDays(w, 6), {month: "short", day: "numeric"}))}</span>${w === nowW ? `<span class="cls-pill">This Week</span>` : ""}</h3><ul class="cls-list">${xs.map(row).join("")}</ul></div>`;
    }).join("");
    return `<section class="c2-card2 c2-box cls-tab" style="--c:${esc(c.color)}">${top}${chips}${body}</section>`;
  }
  // Recordings that don't belong to any class, kept under the class list
  const looseRecs = c => Object.values(state.files || {}).filter(f => f.courseId === c.id && isLec(f) && !recKeyOf(f)).map(f => f.id);

  function datesSheet(cid){
    const c = courseOf(cid); if (!c) return;
    const T = termOf(c);
    openSheet(`<form class="sheet">${head("Term Dates")}<div class="sheet-body">
      <p class="mini" style="margin:0 0 10px">When ${esc(courseLabel(c))}'s classes run. Every class between these dates gets its own page in Lectures.</p>
      <div class="two"><label class="f">First Class<input type="date" name="from" value="${esc(T.from)}" required></label><label class="f">Last Class<input type="date" name="until" value="${esc(T.until)}" required></label></div>
      ${coursesArr().length > 1 ? `<label class="mi-check" style="margin-top:6px"><input type="checkbox" name="all" checked> Use these dates for all my courses</label>` : ""}
      </div><div class="sheet-foot"><button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span><button class="btn primary" data-submit>Save</button></div></form>`, fd => {
      const from = String(fd.get("from") || ""), until = String(fd.get("until") || "");
      if (!isDate(from) || !isDate(until) || until < from) { toast("The last class needs to be on or after the first."); return false; }
      const cur = state.courses[cid]; if (!cur) return;
      const ids = fd.get("all") ? coursesArr().map(x => x.id) : [cid];
      applyChanges(ids.filter(id => state.courses[id]).map(id => ({kind: "course", id, after: Object.assign(clone(state.courses[id]), {classDates: {from, until}})})), ids.length > 1 ? `Term dates saved for ${ids.length} courses` : "Term dates saved");
    });
  }

  /* A class's page */
  let OPEN = null;
  const noteName = n => (String(n.text || "").split("\n").map(l => l.replace(/\[\[|\]\]/g, "").trim()).find(Boolean) || "Untitled note").slice(0, 90);
  const notePeek = n => String(n.text || "").split("\n").slice(1).join(" ").replace(/\[\[|\]\]/g, "").replace(/\s+/g, " ").trim().slice(0, 140);
  const srcTag = f => f.kind === "cloud" ? `<span class="cls-src">${f.cloud && f.cloud.p === "google" ? DRIVE() : ""}${esc(CLOUD_NAMES[f.cloud && f.cloud.p] || "Cloud")}</span>` : f.kind === "link" ? `<span class="cls-src">Link</span>` : "";
  function pageHtml(x){
    const c = courseOf(x.cid), I = itemsOf(x.cid, x.key), all = classesOf(c).filter(y => y.kind === x.kind && (!y.skipped || y.key === x.key));
    const i = all.findIndex(y => y.key === x.key), prev = i > 0 ? all[i - 1] : null, next = i >= 0 && i < all.length - 1 ? all[i + 1] : null;
    const rm = (k, id) => `<button type="button" class="x-btn" data-act="cls-unlink" data-k="${k}" data-id="${esc(id)}" aria-label="Take it off this class (it isn't deleted)" title="Take it off this class (it isn't deleted)">${CLOSE}</button>`;
    const noteLi = n => `<li class="cls-it">${n.wb ? IC.board(16) : IC.note(16)}<button type="button" class="cls-it-main" data-act="cls-note" data-id="${esc(n.id)}"><b>${esc(n.wb ? (String(n.text || "").split("\n")[0] || "Whiteboard") : noteName(n))}</b>${!n.wb && notePeek(n) ? `<span class="mini">${esc(notePeek(n))}</span>` : `<span class="mini">${n.wb ? "Whiteboard" : "Note"}</span>`}</button>${rm("note", n.id)}</li>`;
    const fileLi = f => `<li class="cls-it">${IC.file(16)}<button type="button" class="cls-it-main" data-act="cls-file" data-id="${esc(f.id)}"><b>${esc(f.name)}</b><span class="mini">${srcTag(f)}${esc(day(dOf(f.created), {month: "short", day: "numeric"}))}</span></button>${rm("file", f.id)}</li>`;
    const recLi = f => `<li class="cls-it k-rec">${IC.mic(16)}<button type="button" class="cls-it-main" data-act="lec-view" data-id="${esc(f.id)}"><b>${esc(f.name)}</b><span class="mini">${esc([f.dur && window.SBLEC ? SBLEC.clock(f.dur * 1000) : "", f.tr && f.tr.text ? "Transcript" : "", hasSum(f) ? "Summary" : ""].filter(Boolean).join(" · ") || "Recording")}</span></button>${hasSum(f) ? `<button type="button" class="btn small" data-act="cls-sum" data-id="${esc(f.id)}">Summary</button>` : ""}</li>`;
    const nowish = x.date === todayISO() && minOfDay(Date.now()) >= tMin(x.start) - 20 && minOfDay(Date.now()) <= tMin(x.end) + 10;
    const recOk = window.SBLEC && SBLEC.canAdd && SBLEC.canAdd();
    const nav = (y, dir) => y ? `<button type="button" class="btn small cls-nav" data-act="cls-go" data-key="${esc(y.key)}" aria-label="${dir === "p" ? "Previous" : "Next"} class: ${esc(y.title)}, ${esc(day(y.date))}">${dir === "p" ? IC.prev(16) : ""}<span>${esc(y.title)}</span>${dir === "n" ? IC.next(16) : ""}</button>` : `<span></span>`;
    return `<div class="sheet occv cls-sheet" style="--c:${esc(c ? c.color : "var(--accent)")}">
      <div class="occv-band">${c ? `<span class="occv-ic" aria-hidden="true">${courseRingHtml(c)}</span><b>${esc(courseLabel(c))}</b>` : ""}<button type="button" class="icon-btn occv-x" data-act="close" aria-label="Close">${CLOSE}</button></div>
      <div class="sheet-body occv-body">
        <p class="cls-kick">${esc(x.title)}${x.n && x.of ? ` <span class="mini">of ${x.of}</span>` : ""}</p>
        <h2 class="occv-title">${esc(day(x.date, {weekday: "long", month: "long", day: "numeric"}))}</h2>
        ${x.name ? `<p class="cls-name">${esc(x.name)}</p>` : ""}
        <p class="mini cls-when">${esc([x.start ? (x.end ? `${fmtTime(x.start)}–${fmtTime(x.end)}` : fmtTime(x.start)) : "", x.where, x.skipped ? "No class this week" : x.moved ? "Moved this week" : "", x.gone ? "No longer on the schedule" : ""].filter(Boolean).join(" · "))}</p>
        <div class="cls-navs">${nav(prev, "p")}${nav(next, "n")}</div>

        <section class="cls-sec"><h3><span>${esc(x.kind || "Class")} Notes and Files</span><span class="n">${I.notes.length + I.files.length || ""}</span></h3>
          ${I.notes.length + I.files.length ? `<ul class="cls-items">${I.notes.map(noteLi).join("")}${I.files.map(fileLi).join("")}</ul>` : `<p class="mini cls-empty">${x.date > todayISO() ? "Nothing yet. Upload the slides before class." : "Nothing for this class yet."}</p>`}
          <div class="cls-acts"><button type="button" class="btn small primary" data-act="cls-upload">${IC.up(16)}Upload</button><button type="button" class="btn small" data-act="cls-drive">${DRIVE()}Google Drive</button><button type="button" class="btn small" data-act="cls-pick">${IC.link(16)}From Studyboard</button></div>
        </section>

        <section class="cls-sec"><h3><span>Recording</span></h3>
          ${I.recs.length ? `<ul class="cls-items">${I.recs.map(recLi).join("")}</ul>${(r => r ? window.SBREPLAY.dockHtml(r.id, {compact: true}) : "")(window.SBREPLAY && I.recs.find(SBREPLAY.hasAudio))}` : `<p class="mini cls-empty">${recOk ? (nowish ? "This class is on now. Record it for a transcript and a summary." : "Record the class, or upload a recording, for a transcript and a summary.") : "No recording for this class."}</p>`}
          ${recOk && !I.recs.length ? `<div class="cls-acts">${nowish || x.date === todayISO() ? `<button type="button" class="btn small primary" data-act="cls-rec">${IC.mic(16)}Record This Class</button>` : ""}<button type="button" class="btn small" data-act="cls-rec-up">${IC.up(16)}Upload a Recording</button></div>` : ""}
        </section>

      </div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="cls-files">${IC.folder(16)}Open in Files</button><span class="spacer"></span><button type="button" class="btn primary" data-act="close">Done</button></div>
    </div>`;
  }
  function openClass(cid, key){
    const x = classOf(cid, key); if (!x) { toast("That class isn't on the schedule any more."); return; }
    OPEN = {cid, key};
    if (dlg.open) dlg.close();
    openSheet(pageHtml(x));
    dlg.addEventListener("close", () => { if (OPEN && OPEN.cid === cid && OPEN.key === key && !dlg.querySelector(".cls-sheet")) OPEN = null; }, {once: true});
  }
  const redraw = () => { if (!OPEN || !dlg.open || !dlg.querySelector(".cls-sheet")) return; const x = classOf(OPEN.cid, OPEN.key); if (!x) return; const st = dlg.querySelector(".sheet-body").scrollTop; dlg.querySelector(".cls-sheet").outerHTML = pageHtml(x); const b = dlg.querySelector(".sheet-body"); if (b) b.scrollTop = st; };

  /* Adding to a class */
  const subFor = x => ["Lectures", `${x.date} ${x.title}`];
  function tag(kind, ids, key, msg){
    const ch = ids.map(id => { const o = (kind === "note" ? state.notes : state.files)[id]; if (!o) return null; const n = clone(o); if (key) n.cls = key; else delete n.cls; n.updated = Date.now(); return {kind, id, after: n}; }).filter(Boolean);
    if (ch.length) applyChanges(ch, msg || "");
  }
  function upload(x){
    const inp = document.createElement("input"); inp.type = "file"; inp.multiple = true; inp.style.display = "none";
    inp.addEventListener("change", async () => {
      const list = [...(inp.files || [])]; inp.remove(); if (!list.length) return;
      const made = await uploadFiles(list, {courseId: x.cid, folderId: "notes", cloud: true, sub: subFor(x)});
      if (made && made.length) tag("file", made.map(f => f.id), x.key, "");
      redraw();
    });
    document.body.appendChild(inp); inp.click();
  }
  async function drive(x){
    const CL = window.SBCLOUD;
    if (CL && CL.canPickFiles && CL.canPickFiles()) {
      let docs = null; try { toast("Choose the files in the Google Drive window"); docs = await CL.pickFiles(); } catch (e) { toast((e && e.message) || "Couldn't open Google Drive."); return; }
      if (!docs || !docs.length) return;
      const now = Date.now(), ch = docs.map(d => { const f = normFile({id: uid(), name: d.name, courseId: x.cid, folderId: "notes", kind: "cloud", url: d.url || `https://drive.google.com/file/d/${encodeURIComponent(d.id)}/view`,
        cloud: {p: "google", id: d.id, name: d.name, size: d.size || 0, type: d.type || "", mod: new Date(now).toISOString(), url: d.url || ""}, cls: x.key, created: now}); return {kind: "file", id: f.id, after: f}; });
      applyChanges(ch, `Added ${plural(ch.length, "file")} from Google Drive to ${x.title}`);
      redraw(); return;
    }
    // Not connected, or the picker isn't set up on this server: a Drive link works anywhere
    linkSheet(x, CL && CL.connected && !CL.connected().includes("google"));
  }
  function linkSheet(x, offerConnect){
    openSheet(`<form class="sheet">${head("Add From Google Drive")}<div class="sheet-body">
      <p class="mini" style="margin:0 0 10px">Paste the Share link of a Google Doc, Slides file, PDF or folder for ${esc(x.title)}.${offerConnect ? ` Or connect Google Drive to pick files there.` : ""}</p>
      <label class="f"><span class="lh">Link</span><input type="url" name="url" required inputmode="url" placeholder="https://docs.google.com/…" autofocus></label>
      <label class="f"><span class="lh">Name <span class="hint">optional</span></span><input type="text" name="name" maxlength="120" placeholder="e.g. Week 5 slides"></label>
      </div><div class="sheet-foot"><button type="button" class="btn" data-act="cls-back">Back</button>${offerConnect ? `<button type="button" class="btn" data-act="cls-connect">Connect Google Drive</button>` : ""}<span class="spacer"></span><button class="btn primary" data-submit>Add</button></div></form>`, fd => {
      const url = safeUrl(String(fd.get("url") || "").trim()); if (!url || !/^https:\/\//.test(url)) { toast("That doesn't look like a link."); return false; }
      let nm = String(fd.get("name") || "").trim(); if (!nm) { try { const u = new URL(url); nm = /docs\.google\.com/.test(u.hostname) ? ({document: "Google Doc", presentation: "Google Slides", spreadsheets: "Google Sheet"}[u.pathname.split("/")[1]] || "Google Drive file") : /drive\.google\.com/.test(u.hostname) ? "Google Drive file" : u.hostname.replace(/^www\./, ""); } catch (e) { nm = "Link"; } }
      const f = normFile({id: uid(), name: nm.slice(0, 120), courseId: x.cid, folderId: "notes", kind: "link", url, cls: x.key, created: Date.now()});
      applyChanges([{kind: "file", id: f.id, after: f}], `Added ${nm} to ${x.title}`);
      setTimeout(() => openClass(x.cid, x.key), 0);
    });
  }
  function pickSheet(x){
    const all = classesOf(courseOf(x.cid));
    const where = k => { if (!k || k === x.key) return ""; const y = all.find(z => z.key === k) || looseClass(x.cid, k); return `${y.title}, ${day(y.date, {month: "short", day: "numeric"})}`; };
    // the 80 newest, and always every file already with this class (so an older one can be unticked)
    const all0 = Object.values(state.files || {}).filter(f => f.courseId === x.cid && !isLec(f)).sort((a, b) => (b.updated || b.created || 0) - (a.updated || a.created || 0));
    const files = all0.filter((f, i) => i < 80 || f.cls === x.key);
    const item = (k, o, nm) => { const w = where(o.cls); return `<label class="mi-check"><input type="checkbox" data-cls="${k}:${esc(o.id)}"${o.cls === x.key ? " checked" : ""}> <span><b>${esc(nm)}</b>${w ? ` <span class="mini">now in ${esc(w)}</span>` : ""}</span></label>`; };
    openSheet(`<div class="sheet">${head("Add Files From Studyboard")}<div class="sheet-body">
      <p class="mini" style="margin:0">Pick the files from this course's Files that go with ${esc(x.title)}, ${esc(day(x.date))}.</p>
      ${files.length ? `<div class="check-list">${files.map(f => item("file", f, f.name)).join("")}</div>` : `<p>This course has no files yet. Use Upload or Google Drive instead.</p>`}
      </div><div class="sheet-foot"><button type="button" class="btn" data-act="cls-back">Back</button><span class="spacer"></span><button type="button" class="btn primary" id="clsPickOk">Done</button></div></div>`);
    $("#clsPickOk").addEventListener("click", () => {
      const ch = [];
      dlg.querySelectorAll("[data-cls]").forEach(i => {
        const [k, id] = i.dataset.cls.split(":"), o = (k === "note" ? state.notes : state.files)[id]; if (!o) return;
        if (i.checked && o.cls !== x.key) ch.push({kind: k, id, after: Object.assign(clone(o), {cls: x.key, updated: Date.now()})});
        else if (!i.checked && o.cls === x.key) { const n = clone(o); delete n.cls; n.updated = Date.now(); ch.push({kind: k, id, after: n}); }
      });
      if (ch.length) applyChanges(ch, `Updated ${x.title}`);
      openClass(x.cid, x.key);
    });
  }
  // A recording started or uploaded from a class page belongs to that class
  let PEND = null;
  hook("changed", (changes, inverse) => {
    if (!PEND || Date.now() - PEND.at > 6 * 36e5 || !Array.isArray(changes)) return;
    const hit = changes.find((c, i) => c && c.kind === "file" && c.after && isLec(c.after) && c.after.courseId === PEND.cid && !c.after.cls && !(inverse && inverse[i] && inverse[i].after));
    if (!hit) return;
    const key = PEND.key, id = hit.id; PEND = null;
    setTimeout(() => { const f = state.files[id]; if (f && !f.cls) applyChanges([{kind: "file", id, after: Object.assign(clone(f), {cls: key})}], ""); }, 0);
  });
  // the recorder (or whatever opened instead) closed with no recording going on or saved, or the file picker was cancelled:
  // the next recording isn't this class's
  dlg.addEventListener("close", () => { if (!PEND || !PEND.arm) return; const p = PEND; setTimeout(() => { if (PEND === p && !document.getElementById("lecPill") && !(dlg.open && dlg.querySelector(".lec-body"))) PEND = null; }, 60); });
  hook("changed", () => { if (OPEN) setTimeout(redraw, 0); });

  /* Files: the course's Lecture Notes folder, grouped by class */
  function folderHtml(cid, files, row){
    const c = courseOf(cid); if (!c) return null;
    const q = String(ui.q || "").trim().toLowerCase(), m = s => !q || q.split(/\s+/).every(w => String(s || "").toLowerCase().includes(w));
    const groups = new Map(), add = (key, kind, o) => { if (!groups.has(key)) groups.set(key, {notes: [], files: [], recs: []}); groups.get(key)[kind].push(o); };
    const loose = [];
    files.forEach(f => { if (f.cls) add(f.cls, "files", f); else loose.push(f); });
    Object.values(state.notes || {}).forEach(n => { if (n.courseId === cid && n.cls && !n.archived && m(n.text)) add(n.cls, "notes", n); });
    Object.values(state.files || {}).forEach(f => { if (f.courseId === cid && isLec(f) && m(f.name)) { const k = recKeyOf(f); if (k && groups.has(k) || k && (f.cls || itemsOf(cid, k).n)) add(k, "recs", f); } });
    if (!groups.size) return null;
    const noteRow = n => `<li class="frow cls-frow">${n.wb ? IC.board(20) : IC.note(20)}<button class="fmain" data-act="cls-note" data-id="${esc(n.id)}"><span class="fname">${esc(n.wb ? String(n.text || "").split("\n")[0] || "Whiteboard" : noteName(n))}</span><span class="task-meta"><span>${n.wb ? "Whiteboard" : "Typed note"}</span><span>${esc(new Date(n.updated || n.created || Date.now()).toLocaleDateString(undefined, {month: "short", day: "numeric"}))}</span></span></button></li>`;
    const recRow = f => `<li class="frow cls-frow k-rec">${IC.mic(20)}<button class="fmain" data-act="lec-view" data-id="${esc(f.id)}"><span class="fname">${esc(f.name)}</span><span class="task-meta"><span>Recording</span>${f.tr && f.tr.text ? "<span>Transcript</span>" : ""}${hasSum(f) ? "<span>Summary</span>" : ""}</span></button></li>`;
    const keys = [...groups.keys()].sort((a, b) => b.localeCompare(a));
    const out = keys.map(k => {
      const g = groups.get(k), x = classOf(cid, k) || looseClass(cid, k), n = g.notes.length + g.files.length + g.recs.length;
      return `<div class="cls-fgroup"><h4 class="cls-fh"><button type="button" class="link-btn" data-act="cls-open" data-cid="${esc(cid)}" data-key="${esc(k)}">${esc(x.title)} · ${esc(day(x.date))}</button><span class="n">${n}</span></h4><ul class="flist">${g.notes.map(noteRow).join("")}${g.files.map(row).join("")}${g.recs.map(recRow).join("")}</ul></div>`;
    }).join("");
    return out + (loose.length ? `<div class="cls-fgroup"><h4 class="cls-fh"><span>Not linked to a class</span><span class="n">${loose.length}</span></h4><ul class="flist">${loose.map(row).join("")}</ul></div>` : "");
  }

  /* Files > a course > Lecture Notes: a folder for every class of the term, made from the schedule (nothing extra is stored).
     A file put in one (Upload, or dropped on it) is linked to that class. */
  function lecFolders(cid, fs, row){
    const c = courseOf(cid); if (!c) return null;
    const all = classesOf(c); if (!all.length) return null;
    const today = todayISO(), nowW = mondayOf(today), q = String(ui.q || "").trim();
    const known = new Set(all.map(x => x.key));
    if (ui.fCls) {
      const x = classOf(cid, ui.fCls) || looseClass(cid, ui.fCls), I = itemsOf(cid, ui.fCls);
      const files = fs.filter(f => f.cls === ui.fCls), n = I.notes.length + files.length + I.recs.length;
      const noteRow = nt => `<li class="frow cls-frow">${nt.wb ? IC.board(20) : IC.note(20)}<button class="fmain" data-act="cls-note" data-id="${esc(nt.id)}"><span class="fname">${esc(nt.wb ? String(nt.text || "").split("\n")[0] || "Whiteboard" : noteName(nt))}</span><span class="task-meta"><span>${nt.wb ? "Whiteboard" : "Typed note"}</span></span></button></li>`;
      const recRow = f => `<li class="frow cls-frow k-rec">${IC.mic(20)}<button class="fmain" data-act="lec-view" data-id="${esc(f.id)}"><span class="fname">${esc(f.name)}</span><span class="task-meta"><span>Recording</span></span></button></li>`;
      const html = `<div class="lf-bar"><button type="button" class="btn small" data-act="f-cls" data-key="">${IC.prev(16)}All Classes</button><span class="spacer"></span><button type="button" class="btn small" data-act="cls-open" data-cid="${esc(cid)}" data-key="${esc(x.key)}">Open Class Page</button><button type="button" class="btn small primary" data-act="lf-upload" data-cid="${esc(cid)}" data-key="${esc(x.key)}">${IC.up(16)}Upload</button></div>
        ${n ? `<ul class="flist">${I.notes.map(noteRow).join("")}${files.map(row).join("")}${I.recs.map(recRow).join("")}</ul>`
          : `<div class="empty lf-empty"><strong>${q ? "Nothing Here Matches Your Search" : "Nothing for This Class Yet"}</strong>${q ? "" : "Upload the slides or handouts, or drop files here. They're linked to " + esc(x.title) + " automatically."}</div>`}`;
      return {html, n, crumb: `${x.title}, ${day(x.date, {month: "short", day: "numeric"})}`};
    }
    // every class, newest week first; classes still to come fold away at the end
    const count = x => fs.filter(f => f.cls === x.key).length + itemsOf(cid, x.key).notes.length + itemsOf(cid, x.key).recs.length;
    const shown = all.filter(x => !x.skipped || count(x));
    const tile = x => { const k = count(x), isNow = x.date === today;
      return `<li><button type="button" class="lf-tile${isNow ? " is-today" : ""}${k ? " has" : ""}" data-act="f-cls" data-key="${esc(x.key)}" data-drop="${esc(cid)}|notes|${esc(x.key)}">${FOLDER}<span class="lf-t"><b>${esc(x.title)}</b><span class="mini">${esc(day(x.date, {weekday: "short", month: "short", day: "numeric"}))}${isNow ? " · Today" : ""}</span></span><span class="n">${k || ""}</span></button></li>`; };
    const weeks = list => { const m = new Map(); list.forEach(x => { const w = mondayOf(x.date); if (!m.has(w)) m.set(w, []); m.get(w).push(x); }); return [...m.entries()]; };
    const wk = ([w, xs]) => `<div class="lf-week"><h4 class="cls-wk"><span>${w === nowW ? "This Week" : "Week of " + esc(day(w, {month: "short", day: "numeric"}))}</span></h4><ul class="lf-grid">${xs.map(tile).join("")}</ul></div>`;
    const past = shown.filter(x => mondayOf(x.date) <= nowW), later = shown.filter(x => mondayOf(x.date) > nowW);
    const loose = fs.filter(f => !f.cls || !known.has(f.cls));
    const html = weeks(past).reverse().map(wk).join("")
      + (later.length ? `<details class="lf-later"><summary>Upcoming Classes<span class="n">${later.length}</span></summary>${weeks(later).map(wk).join("")}</details>` : "")
      + (loose.length ? `<h3 class="fsec lf-loose">Not Linked to a Class<span class="n">${loose.length}</span></h3><p class="mini lf-hint">Drag one onto a class's folder to link it.</p><ul class="flist">${loose.map(row).join("")}</ul>` : "");
    return {html, n: fs.length, crumb: ""};
  }
  // Upload into a class's folder: the files go in Lecture Notes, linked to the class
  async function uploadTo(cid, key, list){
    const x = classOf(cid, key) || looseClass(cid, key);
    const made = await uploadFiles(list, {courseId: cid, folderId: "notes", cloud: true, sub: subFor(x)});
    if (made && made.length) tag("file", made.map(f => f.id), key, `Added to ${x.title}`);
  }
  function pickUpload(cid, key){
    const inp = document.createElement("input"); inp.type = "file"; inp.multiple = true; inp.style.display = "none";
    inp.addEventListener("change", () => { const list = [...(inp.files || [])]; inp.remove(); if (list.length) uploadTo(cid, key, list); });
    document.body.appendChild(inp); inp.click();
  }
  hook("act", (act, el) => {
    if (act === "f-cls") { ui.fCls = el.dataset.key || ""; render(); window.scrollTo(0, 0); return true; }
    if (act === "lf-upload") { pickUpload(el.dataset.cid, el.dataset.key); return true; }
    return false;
  });

  /* The Schedule: a class's sheet links its page */
  function occRows(o){
    if (!o || !(o.type === "meet" || (o.type === "event" && isClassEvent(o.ev)))) return [];
    const cid = courseIdOf(o), key = classKey(o), x = findClass(cid, key); if (!x) return [];
    const I = itemsOf(cid, key), rows = [];
    rows.push([IC.note(18), `<button type="button" class="link-btn occv-link" data-act="cls-open" data-cid="${esc(cid)}" data-key="${esc(key)}">${I.n ? "Open Class Notes" : "Start Notes for This Class"}</button>`, esc(I.n ? `${x.title} · ${hasLine(I)}` : `${x.title} · notes, files and the recording in one place`)]);
    return rows;
  }

  /* Actions */
  hook("act", (act, el, id) => {
    const cur = () => OPEN && classOf(OPEN.cid, OPEN.key);
    switch (act) {
      case "cls-open": { const cid = el.dataset.cid, key = el.dataset.key; setTimeout(() => openClass(cid, key), 0); return true; }
      case "cls-go": { if (OPEN) openClass(OPEN.cid, el.dataset.key); return true; }
      case "cls-back": { if (OPEN) { const o = OPEN; setTimeout(() => openClass(o.cid, o.key), 0); } return true; }
      case "cls-kind": { ui.clsKind = Object.assign({}, ui.clsKind, {[el.dataset.cid]: el.dataset.k}); render(); return true; }
      case "cls-dates": datesSheet(el.dataset.cid); return true;
      case "cls-upload": { const x = cur(); if (x) upload(x); return true; }
      case "cls-drive": { const x = cur(); if (x) drive(x); return true; }
      case "cls-connect": { if (dlg.open) dlg.close(); setTimeout(() => window.SBCLOUD && SBCLOUD.open(), 0); return true; }
      case "cls-pick": { const x = cur(); if (x) pickSheet(x); return true; }
      case "cls-unlink": { const x = cur(); if (!x) return true; tag(el.dataset.k, [id], "", `Taken off ${x.title}`); return true; }
      case "cls-note": { const n = state.notes[id]; if (!n) return true; if (dlg.open) dlg.close(); if (window.SBPRO && SBPRO.openLink) SBPRO.openLink({kind: n.wb ? "board" : "note", id}, 0); else { ui.tab = "notes"; render(); } return true; }
      case "cls-file": { const f = state.files[id]; if (!f) return true; if (f.kind === "file" && window.SBPRO && SBPRO.canRead && SBPRO.canRead(f) && SBPRO.openReader) { if (dlg.open) dlg.close(); SBPRO.openReader(f.id, 0); } else if (f.kind === "link" || f.kind === "cloud") window.open(fileHref(f), "_blank", "noopener"); else fileSheet(f); return true; }
      case "cls-rec": { const x = cur(); if (!x) return true; const p = PEND = {cid: x.cid, key: x.key, at: Date.now()}; if (dlg.open) dlg.close(); setTimeout(() => { p.arm = true; const b = document.createElement("button"); b.hidden = true; b.dataset.act = "lec-open"; b.dataset.course = x.cid; document.body.appendChild(b); b.click(); b.remove(); }, 0); return true; }
      case "cls-rec-up": { const x = cur(); if (!x) return true; PEND = {cid: x.cid, key: x.key, at: Date.now(), arm: true}; const prev = ui.courseId; ui.courseId = x.cid; const b = document.createElement("button"); b.hidden = true; b.dataset.act = "lec-add-up"; document.body.appendChild(b); b.click(); b.remove(); ui.courseId = prev;
        const p = PEND, inp = [...document.querySelectorAll('input[type="file"]')].pop(); if (inp) inp.addEventListener("cancel", () => { if (PEND === p) PEND = null; }, {once: true}); return true; }
      case "cls-sum": { if (dlg.open) dlg.close(); setTimeout(() => { const b = document.createElement("button"); b.hidden = true; b.dataset.act = "lec-view"; b.dataset.id = id; document.body.appendChild(b); b.click(); b.remove();
        setTimeout(() => { const d = document.createElement("button"); d.hidden = true; d.dataset.act = "lec-doc"; d.dataset.id = id; d.dataset.doc = "sum"; document.body.appendChild(d); d.click(); d.remove(); }, 30); }, 0); return true; }
      case "cls-files": { const x = cur(); if (!x) return true; if (dlg.open) dlg.close(); ui.tab = "files"; ui.courseId = null; ui.fCourse = x.cid; ui.fFolder = "notes"; ui.fCls = x.key; ui.q = ""; render(); window.scrollTo(0, 0); return true; }
    }
    return false;
  });

  // This Week: glide down so the current week sits in the middle of the screen
  hook("act", act => {
    if (act !== "cls-now") return false;
    const w = document.querySelector(".cls-week.is-now"); if (!w) return true;
    const still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    w.scrollIntoView({block: "center", behavior: still ? "auto" : "smooth"});
    return true;
  });

  SBCLS = window.SBCLS = {classesOf, classOf, itemsOf, termOf, listHtml, looseRecs, folderHtml, lecFolders, uploadTo, occRows, open: openClass, recKeyOf};
})();
