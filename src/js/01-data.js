/* ===== module: 01-data.js: the app's core, dates, the app's state, Recently Deleted and Export My Data ===== */
/* ---------- Dates ---------- */
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parse = s => { const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d); };
const todayISO = () => iso(new Date());
const dayDiff = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const isDate = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const fmtShort = s => parse(s).toLocaleDateString(undefined, {month:"short", day:"numeric"});
const fmtDate = s => parse(s).toLocaleDateString(undefined, {weekday:"short", month:"short", day:"numeric"});
const mondayOf = s => { const d = parse(s); const wd = (d.getDay() + 6) % 7; return addDays(s, -wd); };
function fmtTime(t){ const [h,m] = t.split(":").map(Number); const d = new Date(2001, 0, 15, h, m, 0); return d.toLocaleTimeString(undefined, {hour:"numeric", minute:"2-digit"}); }

/*TRASH-START*/
/* Recently Deleted and Export My Data */
const TB = (() => {
  const DAY = 864e5, KEEP_DAYS = 30, MAX_ENTRIES = 400, MAX_BYTES = 12e6, BULK_AFTER = 40, SYNC_MAX = 1.5e6;
  const KINDS = ["course", "task", "note", "deck", "file", "event", "card", "quiz", "bulk"];
  const KIND_TITLE = {course: "Courses", task: "Tasks", note: "Notes", deck: "Flashcard Decks", card: "Flashcards", quiz: "Quizzes", file: "Files", event: "Events", bulk: "Bulk Deletions"};
  const cl = o => o == null ? o : JSON.parse(JSON.stringify(o));
  const sizeOf = o => { try { return JSON.stringify(o).length; } catch (e) { return 0; } };
  const cut = (s, n) => { s = String(s == null ? "" : s).replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  function labelFor(kind, d){
    d = d || {};
    if (kind === "course") return cut(d.name || d.code, 70) || "Course";
    if (kind === "task") return cut(d.title, 70) || "Task";
    if (kind === "note") return d.wb ? "Whiteboard: " + (cut(String(d.text || "").split("\n").find(x => x.trim()) || "", 60) || "Untitled") : cut(String(d.text || "").split("\n").find(x => x.trim()) || "", 60) || "Empty note";
    if (kind === "deck") return cut(d.name, 70) || "Flashcard deck";
    if (kind === "file") return cut(d.name, 70) || "File";
    if (kind === "event") return cut(d.title, 70) || "Event";
    if (kind === "card") return cut(d.front, 60) || "Flashcard";
    if (kind === "quiz") return cut(d.title, 60) || "Quiz";
    return "Item";
  }
  const isSub = k => k === "card" || k === "quiz";
  function normEntry(e){
    e = Object.assign({id: "", kind: "bulk", label: "", detail: "", deletedAt: 0, items: []}, e && typeof e === "object" ? e : {});
    e.id = String(e.id || ""); if (!KINDS.includes(e.kind)) e.kind = "bulk";
    e.deletedAt = Number(e.deletedAt) || 0;
    e.items = (Array.isArray(e.items) ? e.items : []).filter(i => i && typeof i === "object" && KINDS.includes(i.kind) && i.id && i.data && typeof i.data === "object");
    e.label = cut(e.label, 140) || (e.items[0] ? labelFor(e.items[0].kind, e.items[0].data) : "Deleted item");
    e.detail = cut(e.detail, 200);
    return e;
  }
  const countsText = items => {
    const c = {}; items.forEach(i => { c[i.kind] = (c[i.kind] || 0) + 1; });
    const nm = {course: "course", task: "task", note: "note", deck: "deck", file: "file", event: "event", card: "card", quiz: "quiz"};
    return KINDS.filter(k => c[k] && nm[k]).map(k => plural(c[k], nm[k])).join(", ");
  };
  function makeEntries(deleted, now, newId, opts){
    opts = opts || {};
    const out = [], used = new Set(), mk = (kind, label, items, detail) => {
      const e = {id: newId(), kind, label, detail: detail || "", deletedAt: now, items: items.map(i => Object.assign({}, i, {data: cl(i.data)}))};
      if (opts.batch) e.batch = opts.batch;
      if (sizeOf(e) > SYNC_MAX) e.local = true;
      out.push(e);
    };
    const left = () => deleted.filter(d => !used.has(d));
    deleted.filter(d => d.kind === "course").forEach(c => {
      const ts = deleted.filter(d => d.kind === "task" && d.data && d.data.courseId === c.id && !used.has(d));
      used.add(c); ts.forEach(t => used.add(t));
      mk("course", labelFor("course", c.data), [c].concat(ts), ts.length ? plural(ts.length, "task") + " moved with it" : "");
    });
    const rest = left();
    if (rest.length > BULK_AFTER) mk("bulk", opts.bulkLabel || `${plural(rest.length, "item")} deleted together`, rest, countsText(rest));
    else rest.forEach(d => {
      if (isSub(d.kind)) return;
      mk(d.kind, labelFor(d.kind, d.data), [d], d.kind === "deck" ? plural((d.data.cards || []).length, "card") : d.kind === "file" ? plural((d.data.revs || []).length, "version") : "");
    });
    const subs = rest.length > BULK_AFTER ? [] : rest.filter(d => isSub(d.kind));
    const byDeck = new Map(); subs.forEach(s => { const k = s.kind + ":" + (s.parent && s.parent.id); (byDeck.get(k) || byDeck.set(k, []).get(k)).push(s); });
    byDeck.forEach(list => {
      const kind = list[0].kind, dn = (list[0].parent && list[0].parent.name) || "a deck";
      mk(kind, list.length === 1 ? labelFor(kind, list[0].data) : plural(list.length, kind === "card" ? "flashcard" : "quiz").replace("quizs", "quizzes") + " from " + dn, list, "From " + dn);
    });
    return out;
  }
  const expiresAt = e => (e.deletedAt || 0) + KEEP_DAYS * DAY;
  const daysLeft = (e, now) => Math.max(0, Math.ceil((expiresAt(e) - now) / DAY));
  function purge(entries, now, caps){
    caps = Object.assign({entries: MAX_ENTRIES, bytes: MAX_BYTES}, caps || {});
    const keep = [], dropped = [];
    const fresh = entries.filter(e => { const ok = e && e.id && e.deletedAt && now < expiresAt(e) && Array.isArray(e.items) && e.items.length; if (!ok) dropped.push(e); return ok; }).sort((a, b) => b.deletedAt - a.deletedAt);
    let bytes = 0;
    fresh.forEach(e => { const s = sizeOf(e); if (keep.length < caps.entries && (bytes + s <= caps.bytes || !keep.length)) { keep.push(e); bytes += s; } else dropped.push(e); });
    return {keep, dropped};
  }
  function superseded(e, exists){
    return !e.items.some(i => isSub(i.kind) ? !exists(i.kind, i.id, i.parent) : !exists(i.kind, i.id));
  }
  function restorePlan(e, ctx, seen){
    seen = seen || new Set([e.id]);
    const changes = [], notes = [], entries = [e.id], idMap = {};
    const items = e.items, have = new Set(items.map(i => i.kind + ":" + i.id));
    const nid = (k, id) => idMap[k + ":" + id] || id;
    items.forEach(i => { if (!isSub(i.kind) && ctx.exists(i.kind, i.id)) { idMap[i.kind + ":" + i.id] = ctx.newId(); notes.push(`${labelFor(i.kind, i.data)} was already in use, so it came back as a copy`); } });
    const parentCourse = d => {
      const cid = d.courseId; if (!cid) return;
      if (have.has("course:" + cid)) { d.courseId = nid("course", cid); return; }
      if (ctx.exists("course", cid)) return;
      const be = ctx.binCourse(cid);
      if (be && !seen.has(be.id)) {
        seen.add(be.id);
        const p = restorePlan(be, ctx, seen);
        p.changes.forEach(c => changes.push(c)); p.notes.forEach(n => notes.push(n)); p.entries.forEach(x => entries.push(x));
        notes.push("Its course was restored too");
        return;
      }
      d.courseId = ""; notes.push(`${labelFor("task", d)} went to No Course because its course is gone`);
    };
    const decksTouched = {};
    items.forEach(i => {
      if (isSub(i.kind)) {
        const pid = i.parent && i.parent.id;
        let deck = decksTouched[pid] || (pid && ctx.getDeck(pid) ? cl(ctx.getDeck(pid)) : null);
        if (!deck) {
          const nd = ctx.newId(); deck = {id: nd, name: "Restored " + (i.kind === "card" ? "cards" : "quizzes"), courseId: "", cards: [], quizzes: [], aiQuizzes: []};
          notes.push("Its deck is gone, so it went into a new deck"); if (pid) decksTouched[pid] = deck; else decksTouched[nd] = deck;
        }
        decksTouched[deck.id] = deck;
        if (i.kind === "card") { const d = cl(i.data); if (deck.cards.some(c => c.id === d.id)) d.id = ctx.newId(); deck.cards.push(d); }
        else { const d = cl(i.data); deck.aiQuizzes = deck.aiQuizzes || []; if (deck.aiQuizzes.some(c => c.id === d.id)) d.id = ctx.newId(); deck.aiQuizzes.push(d); }
        return;
      }
      const d = cl(i.data); d.id = nid(i.kind, i.id);
      if (i.kind === "task" || i.kind === "deck" || i.kind === "file" || i.kind === "note" || i.kind === "event") parentCourse(d);
      if (i.kind === "file" && d.folderId && !ctx.folderOk(d.folderId, d.courseId)) d.folderId = "other";
      if (i.kind === "note" && d.taskId && !ctx.exists("task", d.taskId) && !have.has("task:" + d.taskId)) d.taskId = "";
      changes.push({kind: i.kind, id: d.id, after: d});
    });
    Object.keys(decksTouched).forEach(k => { const d = decksTouched[k]; if (!changes.some(c => c.kind === "deck" && c.id === d.id)) changes.push({kind: "deck", id: d.id, after: d}); });
    return {changes, notes: [...new Set(notes)], entries: [...new Set(entries)]};
  }

  /* CSV (RFC 4180, UTF-8 with BOM for Excel, formula-injection safe per OWASP) */
  function csvCell(v){
    if (v == null) return "";
    let s = typeof v === "boolean" ? (v ? "true" : "false") : String(v);
    s = s.replace(/\r\n?/g, "\n");
    if (/^[=+\-@\t]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = "'" + s;
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  const csv = (header, rows) => "﻿" + [header].concat(rows).map(r => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
  const isoDay = ms => ms ? new Date(ms).toISOString() : "";
  const nz = v => v == null || v === "" ? "" : v;
  const pctOf = t => t && t.mark && Number(t.mark.outOf) > 0 && t.mark.got !== "" && t.mark.got != null && !isNaN(Number(t.mark.got)) ? Math.round(Number(t.mark.got) / Number(t.mark.outOf) * 1000) / 10 : "";
  const cname = (courses, id) => { const c = courses[id]; return c ? (c.code ? c.code + " " : "") + (c.name || "") : ""; };
  function toCsvFiles(data, want){
    const courses = {}; (data.courses || []).forEach(c => { courses[c.id] = c; });
    const f = {}, w = k => !want || want[k];
    const examOf = {}; (data.tasks || []).forEach(t => { if (t && t.id) examOf[t.id] = t; });
    if (w("tasks")) f["tasks.csv"] = csv(["title", "course", "type", "status", "due_date", "due_time_local", "due_iso_local", "start_date", "hours", "priority", "weight_percent", "score", "out_of", "notes", "link", "completed_at", "milestone_of", "step", "take_home", "prep_for_exam", "topic"],
      (data.tasks || []).map(t => [t.title, cname(courses, t.courseId), t.type, t.status, t.due, t.time || "", t.due ? t.due + (t.time ? "T" + t.time : "") : "", t.start, nz(t.hours), t.priority, nz(t.weight), t.mark ? nz(t.mark.got) : "", t.mark ? nz(t.mark.outOf) : "", t.notes, t.link, t.status === "done" ? isoDay(t.doneAt) : "", t.breakdownOf ? (((data.tasks || []).find(x => x.id === t.breakdownOf) || {}).title || "") : "", t.step || "", (t.type === "Exam" || t.type === "Quiz") && (t.remote === "yes" || t.remote === "no") ? t.remote : "", t.prepFor ? ((examOf[t.prepFor] || {}).title || "") : "", t.topic || ""]));
    if (w("notes")) f["notes.csv"] = csv(["title", "course", "text", "updated_at", "created_at", "archived"],
      (data.notes || []).map(n => [labelFor("note", n), cname(courses, n.courseId), n.text, isoDay(n.updated), isoDay(n.created), !!n.archived]));
    if (w("grades")) {
      const gt = (data.tasks || []).filter(t => t.mark && pctOf(t) !== "");
      f["grades.csv"] = csv(["course", "assessment", "type", "weight_percent", "score", "out_of", "percent", "date"], gt.map(t => [cname(courses, t.courseId), t.title, t.type, nz(t.weight), t.mark.got, t.mark.outOf, pctOf(t), t.due]));
      const by = {}; gt.forEach(t => { (by[t.courseId || ""] = by[t.courseId || ""] || []).push(t); });
      f["grades-summary.csv"] = csv(["course", "graded_items", "graded_weight_percent", "current_percent", "goal_percent"], Object.keys(by).map(cid => {
        const l = by[cid], wt = l.filter(t => Number(t.weight) > 0), tw = wt.reduce((s, t) => s + Number(t.weight), 0);
        const cur = wt.length ? wt.reduce((s, t) => s + pctOf(t) * Number(t.weight), 0) / tw : l.reduce((s, t) => s + pctOf(t), 0) / l.length;
        const g = courses[cid] && courses[cid].grading;
        return [cname(courses, cid), l.length, tw ? Math.round(tw * 10) / 10 : "", Math.round(cur * 10) / 10, g ? nz(g.goal) : ""];
      }));
    }
    if (w("decks")) {
      f["flashcards.csv"] = csv(["deck", "course", "front", "back", "source", "box", "due"], (data.decks || []).flatMap(d => (d.cards || []).map(c => [d.name, cname(courses, d.courseId), c.front, c.back, d.source || d.sourceName || c.source || "", c.box, c.due || ""])));
      const q = s => /[\t\n\r"]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      f["flashcards-anki.txt"] = "#separator:tab\n#html:false\n#tags column:3\n" + (data.decks || []).flatMap(d => (d.cards || []).map(c => [q(String(c.front || "").replace(/\r\n?/g, "\n")), q(String(c.back || "").replace(/\r\n?/g, "\n")), String(d.name || "deck").trim().replace(/\s+/g, "_")].join("\t"))).join("\n") + "\n";
    }
    if (w("courses")) f["courses.csv"] = csv(["name", "code", "color", "goal_percent", "pass_percent", "meetings", "tasks"], (data.courses || []).map(c => [c.name, c.code, c.color, c.grading ? nz(c.grading.goal) : "", c.grading ? nz(c.grading.pass) : "",
      (c.meetings || []).map(m => `${m.kind || "Class"} ${(m.days || []).join("/")} ${m.start || ""}-${m.end || ""}`).join("; "), (data.tasks || []).filter(t => t.courseId === c.id).length]));
    if (w("events")) f["events.csv"] = csv(["title", "course", "date", "end_date", "start_time", "end_time", "all_day", "where", "repeat_days", "repeat_until", "notes"],
      (data.events || []).map(e => [e.title, cname(courses, e.courseId), e.date, e.endDate, e.start, e.end, !!e.allDay, e.where, e.repeat ? (e.repeat.days || []).join("/") : "", e.repeat ? e.repeat.until || "" : "", e.notes]));
    if (w("sessions")) f["study-sessions.csv"] = csv(["task", "course", "type", "focus_minutes", "status", "due_date"],
      (data.tasks || []).filter(t => Number(t.focusMin) > 0).map(t => [t.title, cname(courses, t.courseId), t.type, Math.round(Number(t.focusMin)), t.status, t.due]));
    return f;
  }
  const README = [
    "Studyboard data export",
    "This is a copy of your own data, kept so you can open it in other apps, keep it, or move it (data portability).",
    "studyboard-export.json holds everything in one file and can be imported back with Settings > Import from a Backup File.",
    "The .csv files open in Excel, Numbers, Google Sheets and similar. They are UTF-8 with a byte order mark and use ISO dates (YYYY-MM-DD).",
    "Cells that start with = + - or @ are prefixed with an apostrophe so a spreadsheet never runs them as formulas.",
    "flashcards-anki.txt is tab separated and can be imported into Anki (File > Import).",
    "In tasks.csv, take_home is yes (an exam or quiz you can take from home) or no (taken in person); blank when it isn't known or the task isn't an exam or quiz.",
    "Never included: AI keys, sign-in tokens or sessions, device ids, or anything from other people's groups."
  ].join("\r\n") + "\r\n";
  /* ZIP (STORE, CRC32) */
  let CT = null;
  function crc32(bytes, crc){
    if (!CT) { CT = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CT[n] = c >>> 0; } }
    let c = crc == null ? 0xFFFFFFFF : crc;
    for (let i = 0; i < bytes.length; i++) c = CT[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return crc == null ? (c ^ 0xFFFFFFFF) >>> 0 : c;
  }
  async function zipBlob(entries, opts){
    opts = opts || {};
    const enc = new TextEncoder(), parts = [], central = [], d = new Date(opts.now || Date.now());
    const dosT = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), dosD = (Math.max(1980, d.getFullYear()) - 1980 << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    let off = 0;
    for (let i = 0; i < entries.length; i++) {
      const {name, data} = entries[i], nm = enc.encode(name), b = data instanceof Uint8Array ? data : enc.encode(String(data));
      if (b.length > 0xFFFFFFF0 || off > 0xFFFFFFF0) throw new Error("too big for a zip");
      const crc = crc32(b);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true); lh.setUint16(10, dosT, true); lh.setUint16(12, dosD, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, b.length, true); lh.setUint32(22, b.length, true); lh.setUint16(26, nm.length, true); lh.setUint16(28, 0, true);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true); ch.setUint16(12, dosT, true); ch.setUint16(14, dosD, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, b.length, true); ch.setUint32(24, b.length, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
      parts.push(new Uint8Array(lh.buffer), nm, b); central.push(new Uint8Array(ch.buffer), nm);
      off += 30 + nm.length + b.length;
      if (opts.onProgress) opts.onProgress(i + 1, entries.length);
      if (opts.yield) await opts.yield();
    }
    const cdSize = central.reduce((s, x) => s + x.length, 0), ed = new DataView(new ArrayBuffer(22));
    ed.setUint32(0, 0x06054b50, true); ed.setUint16(8, entries.length, true); ed.setUint16(10, entries.length, true); ed.setUint32(12, cdSize, true); ed.setUint32(16, off, true);
    return new Blob(parts.concat(central, [new Uint8Array(ed.buffer)]), {type: "application/zip"});
  }
  function jsonExport(arrays, now, include){
    const out = Object.assign({app: "studyboard"}, arrays);
    out.export = {schema: "studyboard-export", version: 1, exportedAt: new Date(now).toISOString(), includes: include || [],
      counts: {courses: (arrays.courses || []).length, tasks: (arrays.tasks || []).length, notes: (arrays.notes || []).length, decks: (arrays.decks || []).length, cards: (arrays.decks || []).reduce((s, d) => s + (d.cards || []).length, 0), events: (arrays.events || []).length, files: (arrays.files || []).length},
      readme: README.split("\r\n").filter(Boolean)};
    return out;
  }
  return {KEEP_DAYS, DAY, KIND_TITLE, KINDS, labelFor, normEntry, makeEntries, purge, daysLeft, expiresAt, superseded, restorePlan, csvCell, csv, toCsvFiles, README, crc32, zipBlob, jsonExport, sizeOf, isSub, SYNC_MAX};
})();
/*TRASH-END*/

/* ---------- State ---------- */
let state = {courses:{}, tasks:{}, files:{}, notes:{}, decks:{}, events:{}, trash:{}, settings:{capacity:15}, updated:0};
const ui = {tab:"board", courseId:null, q:"", focusOpen:true, showOldDone:false,
  planView: (() => { try { const v = localStorage.getItem("studyboard:planview"); return v === "schedule" || v === "crunch" ? v : "timeline"; } catch(e) { return "timeline"; } })(),
  tlMode: (() => { try { return localStorage.getItem("studyboard:tlmode") === "calendar" ? "calendar" : "bars"; } catch(e) { return "bars"; } })(),
  tlZoom: (() => { try { const v = localStorage.getItem("studyboard:tlzoom"); return v === "week" || v === "term" ? v : "month"; } catch(e) { return "month"; } })(), tlScroll:null, tlJump:true, calMonth:null, calDay:null,
  groupBy: (() => { try { return localStorage.getItem("coursework:group") || "none"; } catch(e) { return "none"; } })(), fCourse:"all", fFolder:"", fSort:"date"};
// The course filter belongs to the section it was picked in: Board, the plan, Flashcards and the rest each keep their own
{ const per = {}, key = () => (typeof isPlanTab === "function" && isPlanTab(ui.tab)) ? "plan" : ui.tab;
  Object.defineProperty(ui, "filter", {enumerable: true, configurable: true, get(){ return per[key()] || "all"; }, set(v){ per[key()] = v || "all"; }}); }
const caps = {downloads:null, assets:null};

function normTask(t){
  t = Object.assign({title:"Untitled", courseId:"", type:"Assignment", start:"", due:"", time:"", priority:"med", status:"todo", notes:"", hours:null, checklist:[], pct:0, dependsOn:[], history:[], location:"", link:"", team:"", reading:"", weight:null, difficulty:"med", late:"unknown"}, t);
  if (!DIFF_M[t.difficulty]) t.difficulty = "med";
  if (!LATE_M[t.late]) t.late = "unknown";
  if (t.wrap != null) {
    const w = t.wrap, num = v => isNum(v) && Number(v) >= 0 && Number(v) <= 150 ? Math.round(Number(v)) : null;
    if (!w || typeof w !== "object") delete t.wrap;
    else t.wrap = {at: Number(w.at) > 0 ? Number(w.at) : 0, methods: (Array.isArray(w.methods) ? w.methods : []).filter(k => typeof k === "string" && /^[a-z]{2,12}$/.test(k)).slice(0, 12),
      start: typeof w.start === "string" && /^[a-z]{2,12}$/.test(w.start) ? w.start : "", next: String(w.next || "").replace(/<[^>]*>/g, "").slice(0, 200), felt: num(w.felt), measured: num(w.measured), mark: num(w.mark)};
  }
  if (t.aiDecks != null && !(t.aiDecks && Array.isArray(t.aiDecks.ids) && typeof t.aiDecks.sig === "string")) delete t.aiDecks;
  else if (t.aiDecks) t.aiDecks.ids = t.aiDecks.ids.filter(x => typeof x === "string" && x.length <= 80).slice(0, 30);
  if (t.readyDecks != null) { if (Array.isArray(t.readyDecks)) t.readyDecks = t.readyDecks.filter(x => typeof x === "string" && x.length <= 80).slice(0, 30); else delete t.readyDecks; }
  if (t.readySnap != null) {
    const r = t.readySnap, num = v => isNum(v) && Number(v) >= 0 && Number(v) <= 100 ? Math.round(Number(v)) : null;
    if (!r || typeof r !== "object" || !(Number(r.at) > 0)) delete t.readySnap; else t.readySnap = {felt: num(r.felt), measured: num(r.measured), at: Number(r.at)};
  }
  if (t.latePen != null) { const v = Number(t.latePen); if (t.late === "penalty" && isFinite(v) && v > 0) t.latePen = Math.min(100, v); else delete t.latePen; }
  if (!Array.isArray(t.dependsOn)) t.dependsOn = [];
  if (!Array.isArray(t.history)) t.history = [];
  t.pct = Math.max(0, Math.min(100, Number(t.pct) || 0));
  if (!STATUS_LABEL[t.status]) t.status = "todo";
  if (!PRIO[t.priority]) t.priority = "med";
  if (!Array.isArray(t.checklist)) t.checklist = [];
  if (!isDate(t.due)) t.due = "";
  if (!isDate(t.start)) t.start = "";
  delete t.earned; delete t.possible;
  if (t.prep != null) t.prep = normPrep(t.prep);
  ["breakdownOf", "step", "bdKind"].forEach(k => { if (typeof t[k] !== "string" || !t[k]) delete t[k]; });
  if (!isDate(t.bdDue)) delete t.bdDue;
  if (t.breakdownParent) t.breakdownParent = true; else delete t.breakdownParent;
  if (!(Number(t.bdHours) > 0)) delete t.bdHours; else t.bdHours = Number(t.bdHours);
  if (t.remote !== "yes" && t.remote !== "no") { delete t.remote; delete t.remoteSrc; delete t.remoteWhy; delete t.remoteAt; delete t.remoteSig; }
  else {
    if (!["user", "lms", "ai", "rule"].includes(t.remoteSrc)) t.remoteSrc = "rule";
    t.remoteWhy = String(t.remoteWhy || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 120);
    t.remoteAt = Number(t.remoteAt) > 0 ? Number(t.remoteAt) : 0;
    t.remoteSig = String(t.remoteSig || "").slice(0, 12);
  }
  return scrubFields(t, ["title", "location", "team", "reading"], t.synced || t.icsUid || t.src ? ["notes"] : []);
}
// An exam's prep plan settings (task.prep, from the Exam Prep Planner)
function normPrep(p){
  if (!p || typeof p !== "object" || Array.isArray(p)) return null;
  const str = (v, n) => String(v == null ? "" : v).replace(/[<>\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
  const o = {v: 1, topics: [], intensity: Math.max(15, Math.min(300, Math.round(Number(p.intensity)) || 90)), style: [], styleText: str(p.styleText, 200), days: null, rest: !!p.rest, light: p.light !== false, start: isDate(p.start) ? p.start : "",
    ai: p.ai !== false, examDue: isDate(p.examDue) ? p.examDue : "", createdAt: Number(p.createdAt) || 0, updatedAt: Number(p.updatedAt) || 0};
  if (p.archived) o.archived = true;
  const seen = new Set();
  (Array.isArray(p.topics) ? p.topics : []).slice(0, 60).forEach((t, i) => {
    if (!t || !str(t.name, 80)) return;
    const id = str(t.id, 40).replace(/[^\w.-]/g, "") || "pt" + i; if (seen.has(id)) return; seen.add(id);
    const w = t.weight === null || t.weight === "" || t.weight === undefined || isNaN(Number(t.weight)) ? null : Math.max(0, Math.min(100, Number(t.weight)));
    o.topics.push({id, name: str(t.name, 80), conf: ["weak", "ok", "strong"].includes(t.conf) ? t.conf : "ok", weight: w || null, done: !!t.done, edited: !!t.edited,
      links: (Array.isArray(t.links) ? t.links : []).slice(0, 8).filter(l => l && ["deck", "note", "quiz", "file"].includes(l.k) && l.id).map(l => ({k: l.k, id: str(l.id, 64), title: str(l.title, 120), deckId: str(l.deckId, 64), cardIds: Array.isArray(l.cardIds) ? l.cardIds.slice(0, 300).map(x => str(x, 64)) : null, total: Math.max(0, Math.round(Number(l.total)) || 0)}))});
  });
  if (Array.isArray(p.style)) o.style = p.style.filter(x => ["mc", "short", "calc", "essay", "practical"].includes(x)).slice(0, 5);
  if (Array.isArray(p.days)) { const d = [...new Set(p.days.map(Number))].filter(x => x >= 0 && x <= 6).sort(); if (d.length && d.length < 7) o.days = d; }
  return o;
}
function normFile(f){
  f = Object.assign({name:"Untitled", courseId:"", folderId:"other", kind:"file", revs:[], taskIds:[], desc:"", url:""}, f);
  if (!Array.isArray(f.revs)) f.revs = [];
  if (!Array.isArray(f.taskIds)) f.taskIds = [];
  if (f.cloud != null && (typeof f.cloud !== "object" || !["google", "microsoft"].includes(f.cloud.p) || !f.cloud.id)) delete f.cloud;
  if (f.kind === "cloud" && !f.cloud) f.kind = "link";
  if (f.ink != null) { const k = normInk(f.ink, 4000); if (k) f.ink = k; else delete f.ink; }
  return f;
}
// Pen ink (the iPad app's handwriting, module 99-ink), on a PDF (f.ink) or a note (n.ink)
function normInk(list, max){
  if (!Array.isArray(list)) return undefined;
  const seen = new Set(), out = [];
  for (const s of list) {
    if (out.length >= max) break;
    if (!s || typeof s !== "object" || typeof s.id !== "string" || !/^[\w-]{1,40}$/.test(s.id) || seen.has(s.id)) continue;
    if (typeof s.d !== "string" || !/^[A-Za-z0-9_-]{3,24000}$/.test(s.d)) continue;
    const o = {id: s.id, t: s.t === "hl" ? "hl" : "pen", c: typeof s.c === "string" && /^[a-z]{1,12}$/.test(s.c) ? s.c : "ink", w: Math.max(1, Math.min(600, Math.round(Number(s.w)) || 30)), d: s.d, at: Number(s.at) > 0 ? Math.round(Number(s.at)) : 0};
    if (s.p != null) { o.p = Math.max(1, Math.min(99999, Math.round(Number(s.p)) || 1)); o.a = String(s.a == null ? "" : s.a).slice(0, 120); }
    if (Array.isArray(s.x)) { const x = s.x.filter(e => Array.isArray(e) && e.length === 4 && e.every(Number.isFinite) && e[2] > 0).slice(-300).map(e => [Math.round(e[0] * 10) / 10, Math.round(e[1] * 10) / 10, Math.round(Math.min(2000, e[2]) * 10) / 10, Math.round(Math.max(0, Math.min(1, e[3])) * 100) / 100]); if (x.length) o.x = x; }
    seen.add(s.id); out.push(o);
  }
  return out.length ? out : undefined;
}
// Calendar events
function normEvent(e){
  const isT = x => /^([01]\d|2[0-3]):[0-5]\d$/.test(x || ""), tm = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  e = Object.assign({title: "Event", courseId: "", label: "", date: "", endDate: "", start: "", end: "", allDay: false, where: "", notes: "", repeat: null, exdates: [], moved: {}, icsUid: "", src: ""}, e);
  if (!isDate(e.date)) e.date = iso(new Date());
  if (!isDate(e.endDate)) e.endDate = "";
  if (!isT(e.start)) e.start = ""; if (!isT(e.end)) e.end = "";
  if (!e.allDay && e.start && (!e.end || tm(e.end) <= tm(e.start))) { const m = Math.min(1439, tm(e.start) + 60); e.end = pad(Math.floor(m / 60)) + ":" + pad(m % 60); }
  if (!e.allDay && !e.start) e.allDay = true;
  if (e.allDay) { e.start = ""; e.end = ""; }
  if (e.repeat && (!Array.isArray(e.repeat.days) || !e.repeat.days.length)) e.repeat = null;
  if (e.repeat) e.repeat = {days: [...new Set(e.repeat.days.map(Number))].filter(d => d >= 0 && d <= 6).sort(), every: Math.max(1, Math.min(4, Number(e.repeat.every) || 1)), until: isDate(e.repeat.until) ? e.repeat.until : ""};
  if (!Array.isArray(e.exdates)) e.exdates = [];
  if (!e.moved || typeof e.moved !== "object" || Array.isArray(e.moved)) e.moved = {};
  return scrubFields(e, ["title", "where"], e.icsUid || e.synced || e.src ? ["notes"] : []);
}
const norm = (kind, o) => kind === "task" ? normTask(o) : kind === "file" ? normFile(o) : kind === "note" ? normNote(o) : kind === "deck" ? normDeck(o) : kind === "event" ? normEvent(o) : kind === "trash" ? TB.normEntry(o) : o;
function fromArrays(o){
  const s = {courses:{}, tasks:{}, files:{}, notes:{}, decks:{}, events:{}, trash:{}, settings:Object.assign({capacity:15}, (o && o.settings) || {}), updated:(o && o.updated) || 0};
  ((o && Array.isArray(o.courses)) ? o.courses : []).forEach(c => { if (c && c.id) { const k = scrubFields(clone(c), ["name", "code"]); if (!/^(#[0-9a-f]{3,8}|(rgb|hsl)a?\([\d\s.,%\/-]{1,60}\)|[a-z]{3,20})$/i.test(String(k.color || "").trim())) k.color = "#8A94A6"; s.courses[c.id] = k; } });
  ((o && Array.isArray(o.tasks)) ? o.tasks : []).forEach(t => { if (t && t.id) s.tasks[t.id] = normTask(clone(t)); });
  ((o && Array.isArray(o.files)) ? o.files : []).forEach(f => { if (f && f.id) s.files[f.id] = normFile(clone(f)); });
  ((o && Array.isArray(o.notes)) ? o.notes : []).forEach(n => { if (n && n.id) s.notes[n.id] = normNote(clone(n)); });
  ((o && Array.isArray(o.decks)) ? o.decks : []).forEach(d => { if (d && d.id) s.decks[d.id] = normDeck(clone(d)); });
  ((o && Array.isArray(o.events)) ? o.events : []).forEach(e => { if (e && e.id) s.events[e.id] = normEvent(clone(e)); });
  ((o && Array.isArray(o.trash)) ? o.trash : []).forEach(e => { if (e && e.id) s.trash[e.id] = TB.normEntry(clone(e)); });
  return s;
}
const toArrays = () => ({v:2, courses:Object.values(state.courses), tasks:Object.values(state.tasks), files:Object.values(state.files), notes:Object.values(state.notes), decks:Object.values(state.decks || {}), events:Object.values(state.events || {}), trash:Object.values(state.trash || {}), settings:state.settings, updated:state.updated});
// Set while this device's copy is being wiped
let deviceWiping = false;
let saveWarnAt = 0;
function saveWarn(e){
  if (window.SBERR && e && /quota/i.test(e.name + " " + e.message)) SBERR.flow("storage-quota", e);
  if (Date.now() - saveWarnAt > 6e4) { saveWarnAt = Date.now(); setTimeout(() => { try { toast("Couldn't save on this device. Storage is full or blocked. Export a backup so nothing is lost.", null, null, {error: true}); } catch(e2) {} }, 700); }
}
/* The big copy: localStorage holds only about 5 MB, which a few whiteboards and a lot of notes can fill.
   Once the saved copy is over SPILL_AT characters, or localStorage refuses it, it moves to IndexedDB (far more
   room) and stays there on this device. A small marker in localStorage says so, and its change tells other tabs. */
const LS2_IDB = "coursework:v2:idb", SPILL_KEY = "device:v2", SPILL_AT = 3e6;
const spillMarked = () => { try { return !!localStorage.getItem(LS2_IDB); } catch(e) { return false; } };
const spillOk = () => typeof indexedDB !== "undefined" && !inPreview();
let spilled = spillMarked(), spillRaw = null, spillMoving = false, spillNext = null, spillT = 0, spillQ = null, spillChain = Promise.resolve();
function spillWrite(json){
  const p = spillChain.then(() => SBC.putStrict("rows", SPILL_KEY, json)).then(() => { try { localStorage.setItem(LS2_IDB, String(Date.now())); } catch(e) {} });
  spillChain = p.catch(() => {});
  return p;
}
function spillMove(json){
  spillNext = json;
  if (spillMoving) return;
  spillMoving = true;
  spillWrite(json).then(() => {
    spilled = true; spillMoving = false;
    try { localStorage.removeItem(LS2); } catch(e) {}
    const later = spillNext; spillNext = null;
    if (later && later !== json) spillQueue(later);
  }, e => { spillMoving = false; spillNext = null; saveWarn(e); });
}
function spillQueue(json){
  spillQ = json; clearTimeout(spillT);
  spillT = setTimeout(spillFlush, 300);
}
// Writes what's waiting now (also when the page is hidden or closed)
function spillFlush(){
  clearTimeout(spillT);
  const json = spillQ; spillQ = null;
  if (json == null) return spillChain;
  return spillWrite(json).catch(saveWarn);
}
async function spillRead(){ try { const v = await SBC.get("rows", SPILL_KEY); return typeof v === "string" && v ? v : null; } catch(e) { return null; } }
// Called before loadLocal when the copy is in IndexedDB
async function spillLoad(){ spilled = spilled || spillMarked(); if (spilled) spillRaw = await spillRead(); }
window.addEventListener("pagehide", () => { try { spillFlush(); } catch(e) {} });
document.addEventListener("visibilitychange", () => { if (document.hidden) { try { spillFlush(); } catch(e) {} } });
function saveLocal(){
  if (deviceWiping || demoDrawing) return;
  if (lsHold) return;
  let json;
  try { const a = toArrays(); delete a.trash; json = JSON.stringify(a); } catch(e) { console.warn("save", e); return; }
  if (!spilled && spillMarked()) spilled = true;
  if (spilled) { spillQueue(json); return; }
  if (spillMoving || json.length > SPILL_AT && spillOk()) { spillMove(json); return; }
  try { localStorage.setItem(LS2, json); }
  catch(e){
    if (spillOk()) { spillMove(json); return; }
    saveWarn(e);
  }
}
// A saved copy that can't be read is set aside, never overwritten
let loadProblem = "";
// Set when that copy couldn't be set aside in localStorage
let lsHold = false;
// Two tabs of a device-only copy
function adoptOtherTab(raw){
  try {
    const keepTrash = state.trash, editing = typeof noteEditing !== "undefined" && noteEditing, mine = editing && state.notes[editing];
    state = fromArrays(JSON.parse(raw)); state.trash = keepTrash || state.trash || {};
    if (editing) { if (mine) state.notes[editing] = mine; return; }
    scheduleRender();
  } catch(x) {}
}
window.addEventListener("storage", e => {
  try {
    if (!e.newValue || (typeof cloud !== "undefined" && cloud.on)) return;
    if (e.key === LS2_IDB) { spilled = true; spillRead().then(v => { if (v) adoptOtherTab(v); }); return; }
    if (e.key === LS2) adoptOtherTab(e.newValue);
  } catch(x) {}
});
function keepUnreadable(key, raw){
  try {
    const k = "studyboard:unreadable:" + key + ":" + Date.now();
    localStorage.setItem(k, raw);
    const old = Object.keys(localStorage).filter(x => x.indexOf("studyboard:unreadable:") === 0).sort((a, b) => Number(a.split(":").pop()) - Number(b.split(":").pop()));
    old.slice(0, Math.max(0, old.length - 3)).forEach(x => localStorage.removeItem(x));
    return;
  } catch(e) {}
  if (key !== "v2" || !raw) return;
  lsHold = true;
  SBC.putStrict("backups", "unreadable-" + Date.now(), {unreadable: raw, keptAt: Date.now()})
    .then(() => { lsHold = false; saveLocal(); })
    .catch(e => { console.warn("Couldn't set the unreadable copy aside", e); setTimeout(() => { try { toast("Studyboard can't save on this device until some storage is freed: your earlier saved copy couldn't be read and is being kept. Export a backup now.", null, null, {error: true}); } catch(x) {} }, 3000); });
}
// Desktop app: the copy in the Studyboard folder (read by deskBoot)
let deskFolderCopy = null;
function deskNewer(own){
  const f = deskFolderCopy;
  if (!f || (own && !(Number(f.updated) > Number(own.updated || 0)))) return null;
  const out = clone(f); delete out.app; delete out.savedAt; delete out.trash;
  const ms = (own && own.settings) || {}; out.settings = Object.assign({}, out.settings || {});
  if (ms.ai) out.settings.ai = ms.ai;
  try { LMS_FEED_IDS.forEach(id => { if (ms[id] && typeof ms[id] === "object" && "feed" in ms[id]) out.settings[id] = Object.assign({}, out.settings[id], {feed: ms[id].feed}); }); } catch(e) {}
  return out;
}
function loadLocal(){
  let r = null;
  try {
    r = spillRaw != null ? spillRaw : localStorage.getItem(LS2);
    spillRaw = null;
    if (!r && spilled) { loadProblem = "v2"; const f = deskNewer(null); if (f) { state = fromArrays(f); spillQueue(JSON.stringify(f)); loadProblem = ""; trashLoadLocal(); return; } }
    if (r) {
      const own = JSON.parse(r), newer = deskNewer(own);
      state = fromArrays(newer || own);
      if (newer) { if (spilled) spillQueue(JSON.stringify(newer)); else { try { localStorage.setItem(LS2, JSON.stringify(newer)); } catch(e) {} } }
      trashLoadLocal(); return;
    }
  } catch(e) {
    keepUnreadable("v2", r || ""); loadProblem = "v2";
    try { const f = deskNewer(null); if (f) { state = fromArrays(f); trashLoadLocal(); return; } } catch(e2) {}
  }
  try {
    const o = localStorage.getItem(LS1);
    if (o) { state = fromArrays(JSON.parse(o)); }
  } catch(e) { keepUnreadable("v1", localStorage.getItem(LS1) || ""); }
  trashLoadLocal();
}

/* Recently Deleted (the bin) */
const LS_TRASH = "studioso:trash";
const trashList = () => Object.values((state && state.trash) || {}).filter(e => e && Array.isArray(e.items));
function trashLoadLocal(){
  const m = {};
  try { const r = localStorage.getItem(LS_TRASH); if (r) JSON.parse(r).forEach(e => { if (e && e.id) m[e.id] = TB.normEntry(e); }); } catch(e) {}
  state.trash = m;
}
let trashDirty = false, trashT = 0, trashWarnAt = 0;
function trashSaveLocal(){
  if (demoDrawing) return;
  trashDirty = true; clearTimeout(trashT);
  trashT = setTimeout(trashFlush, 500);
}
function trashFlush(){
  if (!trashDirty || deviceWiping) return; trashDirty = false;
  const list = trashList().sort((a, b) => b.deletedAt - a.deletedAt);
  let left = 0;
  for (let guard = 0; guard < 40; guard++) {
    try { localStorage.setItem(LS_TRASH, JSON.stringify(list)); break; }
    catch(e) { if (!list.length) break; let big = 0, bs = -1; list.forEach((x, i) => { const n = JSON.stringify(x).length; if (n > bs) { bs = n; big = i; } }); list.splice(big, 1); left++; }
  }
  if (left && !(typeof cloud !== "undefined" && cloud.on) && Date.now() - trashWarnAt > 6e4) { trashWarnAt = Date.now(); try { toast("This device's storage is full, so some of Recently Deleted can't be kept after you close Studyboard. Restore what you need now, or export a backup.", null, null, {error: true}); } catch(e) {} }
}
window.addEventListener("pagehide", () => { try { trashFlush(); } catch(e) {} });
// Stored files only go away when the bin lets go of them
function trashAssets(entries){
  const ids = (entries || []).flatMap(e => (e.items || []).filter(i => i.kind === "file").flatMap(i => (i.data.revs || []).map(r => r.assetId))).filter(Boolean);
  if (ids.length) cleanupAssets([...new Set(ids)], 0);
}
// A note with nothing in it (no text, drawing, photo or sticker) isn't worth keeping in Recently Deleted
const trashHas = v => Array.isArray(v) ? v.length > 0 : !!(v && typeof v === "object" && Object.keys(v).length);
const emptyNote = d => !!d && !d.wb && !String(d.text || "").trim() && !trashHas(d.ink) && !trashHas(d.photos) && !trashHas(d.stickers);
const emptyEntry = e => (e.items || []).length > 0 && e.items.every(i => i && i.kind === "note" && emptyNote(i.data));
// 30 days, then it's gone
function trashEnforce(){
  let skewMs = 0; try { skewMs = Number(localStorage.getItem("studioso:skew")) || 0; } catch(e) {}
  const r = TB.purge(trashList(), Date.now() + skewMs);
  trashList().forEach(e => { if (emptyEntry(e) && !r.dropped.includes(e)) r.dropped.push(e); });
  if (!r.dropped.length) return 0;
  r.dropped.forEach(e => { if (e && e.id && state.trash[e.id]) { delete state.trash[e.id]; try { queueWrite("trash", e.id, null); } catch(x) {} } });
  trashAssets(r.dropped.filter(e => e && Date.now() + skewMs >= TB.expiresAt(e)));
  trashSaveLocal();
  return r.dropped.length;
}
function trashDrop(ids){
  (ids || []).forEach(id => { if (state.trash[id]) { delete state.trash[id]; queueWrite("trash", id, null); } });
  if (ids && ids.length) trashSaveLocal();
}
// Called by applyChanges before anything is removed
function trashCapture(changes, label){
  const deleted = [], inDecks = new Set();
  changes.forEach(c => { if (c.kind === "deck" && c.after) (c.after.cards || []).forEach(x => inDecks.add(x.id)); });
  changes.forEach(c => {
    if (c.kind === "trash") return;
    const cur = getItem(c.kind, c.id); if (!cur) return;
    if (c.after === null) { if (!(c.kind === "note" && emptyNote(cur))) deleted.push({kind: c.kind, id: c.id, data: clone(cur)}); }
    else if (c.kind === "deck") {
      const keepC = new Set((c.after.cards || []).map(x => x.id)), keepQ = new Set((c.after.aiQuizzes || []).map(x => x.id)), par = {kind: "deck", id: cur.id, name: cur.name};
      (cur.cards || []).filter(x => !keepC.has(x.id) && !inDecks.has(x.id)).slice(0, 2000).forEach(x => deleted.push({kind: "card", id: x.id, data: clone(x), parent: par}));
      (cur.aiQuizzes || []).filter(x => !keepQ.has(x.id)).forEach(x => deleted.push({kind: "quiz", id: x.id, data: clone(x), parent: par}));
    }
  });
  if (!deleted.length) return [];
  const entries = TB.makeEntries(deleted, Date.now(), uid, {batch: uid(), bulkLabel: label || ""});
  entries.forEach(e => { state.trash[e.id] = TB.normEntry(e); if (!e.local) queueWrite("trash", e.id, e); });
  trashEnforce(); trashSaveLocal();
  return entries.map(e => e.id).filter(id => state.trash[id]);
}
const trashBtn = kind => { const n = trashVisible().filter(e => e.kind === kind || (kind === "deck" && TB.isSub(e.kind))).length; return n ? `<button class="btn small trash-btn" data-act="trash-open" data-kind="${kind}" aria-label="Recently Deleted (${n})" title="Recently Deleted (${n})"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg><span>${n}</span></button>` : ""; };
const plural0 = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const trashExists = (kind, id, parent) => {
  if (kind === "card") { const d = state.decks[parent && parent.id]; return !!(d && d.cards.some(c => c.id === id)); }
  if (kind === "quiz") { const d = state.decks[parent && parent.id]; return !!(d && (d.aiQuizzes || []).some(c => c.id === id)); }
  const m = mapOf(kind); return !!(m && m[id]);
};
// What shows in the bin
const trashVisible = () => trashList().filter(e => e.items.length && Date.now() < TB.expiresAt(e) && !TB.superseded(e, trashExists)).sort((a, b) => b.deletedAt - a.deletedAt);
// Puts entries back where they were
function trashRestore(ids){
  const entries = ids.map(id => state.trash[id]).filter(Boolean);
  if (!entries.length) return {count: 0, notes: []};
  const ctx = {exists: (k, id) => trashExists(k, id), newId: uid, getDeck: id => state.decks[id],
    folderOk: (fid, cid) => foldersOf(cid).some(f => f.id === fid),
    binCourse: cid => trashList().find(x => !ids.includes(x.id) && x.items.some(i => i.kind === "course" && i.id === cid)) || null};
  const changes = [], notes = [], consumed = new Set(), seenKey = new Set();
  entries.forEach(e => {
    if (consumed.has(e.id)) return;
    const p = TB.restorePlan(e, ctx);
    p.changes.forEach(c => { const k = c.kind + ":" + c.id; if (!seenKey.has(k)) { seenKey.add(k); changes.push(c); } });
    p.notes.forEach(n => notes.push(n)); p.entries.forEach(x => consumed.add(x));
  });
  const gone = [...consumed].map(id => state.trash[id]).filter(Boolean);
  const inv = applyChanges(changes, null) || [];
  gone.forEach(e => { delete state.trash[e.id]; queueWrite("trash", e.id, null); });
  saveLocal(); trashSaveLocal();
  const count = gone.reduce((n, e) => n + e.items.length, 0);
  undoStack.forEach(s => { if (s.binned) s.done = true; });
  return {count, notes: [...new Set(notes)], entries: gone, inverse: inv};
}
// Entries that came in with a backup or export
function trashMerge(list){
  let n = 0;
  (list || []).forEach(e => { if (e && e.id && !state.trash[e.id] && e.items && e.items.length && Date.now() < TB.expiresAt(e)) { state.trash[e.id] = e; if (!e.local) queueWrite("trash", e.id, e); n++; } });
  if (n) { trashEnforce(); trashSaveLocal(); }
  return n;
}
function trashForever(ids){
  const gone = ids.map(id => state.trash[id]).filter(Boolean);
  gone.forEach(e => { delete state.trash[e.id]; queueWrite("trash", e.id, null); });
  trashAssets(gone); trashSaveLocal();
  return gone.length;
}

/* SYNC-MERGE-START
   Conflict policy for synced items (pure functions: no DOM, no network, no app globals; tests/sync-merge.test.js loads this block as is).
   Principle: never silently lose what someone typed.
   mergeItem(kind, base, mine, theirs, opts) is a three-way merge:
     base   = the version this device last saw from the server (null when unknown), mine = this device's edit, theirs = what the server has now.
   - only one side changed since base: take that side.   - both changed: field by field (arrays of records by id, sets by value).
   - same field changed on both: text (note text, task notes, card sides) is merged by line (diff3) and, where the edits overlap, BOTH are kept
     inside the text between friendly dividers; other fields take the later edit (this device's edit time, corrected for clock skew, against the
     server's time for the other version; within SKEW_GUARD the device merging last wins) and the loser is written to syncLog.
   - task status: done is sticky (done beats not-done unless one side explicitly reopened it, which is a one-sided change and so wins).
   - deletions (null, or any {deleted|trashed|deletedAt|trashedAt} tombstone) against an edit: the edit wins and the item is restored,
     unless the soft deletion is newer than the edit by more than DELETE_MARGIN. A hard delete (null) never beats an edit made elsewhere.
   - adds on both sides are unioned (ids are time + random, so they cannot collide). */
const SyncMerge = (() => {
  const CAP = {hist: 5, histChars: 12000, log: 12, logChars: 200, cells: 4e6, history: 30};
  const SKEW_GUARD = 5 * 60e3, DELETE_MARGIN = 24 * 36e5;
  const TOMB_KEYS = ["deleted", "trashed", "deletedAt", "trashedAt"];
  const TEXT_KEYS = {note: ["text"], task: ["notes"], event: ["notes"], deck: ["front", "back", "notes"], course: ["notes"], file: ["desc"]};
  const isObj = v => !!v && typeof v === "object" && !Array.isArray(v);
  const copy = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  const eq = (a, b) => {
    if (a === b) return true;
    if (!a || !b || typeof a !== "object" || typeof b !== "object" || Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) return a.length === b.length && a.every((x, i) => eq(x, b[i]));
    const ka = Object.keys(a).filter(k => a[k] !== undefined), kb = Object.keys(b).filter(k => b[k] !== undefined);
    return ka.length === kb.length && ka.every(k => eq(a[k], b[k]));
  };
  const has = (arr, x) => arr.some(y => eq(x, y));
  const ms = v => typeof v === "number" ? v : v ? (Date.parse(v) || 0) : 0;
  const tombAt = o => {
    if (!isObj(o)) return 0;
    const t = Math.max(ms(o.deletedAt), ms(o.trashedAt));
    return t || (o.deleted === true || o.trashed === true || o.deletedAt === true || o.trashedAt === true ? 1 : 0);
  };
  const isTomb = o => o === null || tombAt(o) > 0;
  const untomb = o => { const x = copy(o); TOMB_KEYS.forEach(k => { delete x[k]; }); return x; };
  const skewFrom = (serverNow, t0, t1) => ms(serverNow) ? ms(serverNow) - Math.round((t0 + t1) / 2) : 0;
  const fmtAt = at => { try { return new Date(at).toLocaleString("en-US", {month: "short", day: "numeric", hour: "numeric", minute: "2-digit"}); } catch(e) { return ""; } };

  /* text: diff3 by line */
  const MARK = {mine: "─── Your edit on this device ───", end: "─── End of conflicting edit ───", theirsRe: /^─── Conflicting edit from your other device( \(.*\))? ───$/};
  const theirsMark = at => "─── Conflicting edit from your other device" + (at ? " (" + fmtAt(at) + ")" : "") + " ───";
  const hasMarks = t => typeof t === "string" && t.includes(MARK.mine) && t.includes(MARK.end);
  function lcs(a, b){
    let s = 0; while (s < a.length && s < b.length && a[s] === b[s]) s++;
    let ea = a.length, eb = b.length; while (ea > s && eb > s && a[ea - 1] === b[eb - 1]) { ea--; eb--; }
    const pairs = []; for (let i = 0; i < s; i++) pairs.push([i, i]);
    const n = ea - s, m = eb - s;
    if (n && m) {
      if (n * m > CAP.cells) return null;
      const w = m + 1, t = new Uint16Array((n + 1) * w);
      for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) t[i * w + j] = a[s + i] === b[s + j] ? t[(i + 1) * w + j + 1] + 1 : Math.max(t[(i + 1) * w + j], t[i * w + j + 1]);
      let i = 0, j = 0;
      while (i < n && j < m) { if (a[s + i] === b[s + j]) { pairs.push([s + i, s + j]); i++; j++; } else if (t[(i + 1) * w + j] >= t[i * w + j + 1]) i++; else j++; }
    }
    for (let k = 0; k < a.length - ea; k++) pairs.push([ea + k, eb + k]);
    return pairs;
  }
  function diff3(base, mine, theirs){
    const pa = lcs(base, mine), pb = lcs(base, theirs);
    if (!pa || !pb) return null;
    const ma = new Map(pa), mb = new Map(pb), anchors = [];
    for (let i = 0; i < base.length; i++) if (ma.has(i) && mb.has(i)) anchors.push([i, ma.get(i), mb.get(i)]);
    anchors.push([base.length, mine.length, theirs.length]);
    const sameArr = (x, y) => x.length === y.length && x.every((v, i) => v === y[i]);
    const out = []; let bi = 0, ai = 0, ci = 0;
    for (const [i, a, c] of anchors) {
      const B = base.slice(bi, i), A = mine.slice(ai, a), C = theirs.slice(ci, c);
      if (sameArr(A, B)) out.push({ok: C}); else if (sameArr(C, B) || sameArr(A, C)) out.push({ok: A}); else out.push({mine: A, theirs: C, base: B});
      if (i < base.length) out.push({ok: [base[i]]});
      bi = i + 1; ai = a + 1; ci = c + 1;
    }
    return out;
  }
  function mergeText(base, mine, theirs, o){
    o = o || {}; mine = String(mine == null ? "" : mine); theirs = String(theirs == null ? "" : theirs);
    if (mine === theirs) return {text: mine, conflicts: 0};
    if (typeof base === "string") { if (mine === base) return {text: theirs, conflicts: 0}; if (theirs === base) return {text: mine, conflicts: 0}; }
    const whole = () => ({text: [MARK.mine, ...mine.split("\n"), theirsMark(o.theirsAt), ...theirs.split("\n"), MARK.end].join("\n"), conflicts: 1});
    if (typeof base !== "string") {
      if (!mine.trim()) return {text: theirs, conflicts: 0};
      if (!theirs.trim() || mine.includes(theirs)) return {text: mine, conflicts: 0};
      if (theirs.includes(mine)) return {text: theirs, conflicts: 0};
      return whole();
    }
    const parts = diff3(base.split("\n"), mine.split("\n"), theirs.split("\n"));
    if (!parts) return whole();
    const lines = []; let conflicts = 0;
    parts.forEach(p => {
      if (p.ok) { lines.push(...p.ok); return; }
      if (!p.base.length) { lines.push(...p.mine, ...p.theirs); return; }
      if (!p.mine.length) { lines.push(...p.theirs); return; }
      if (!p.theirs.length) { lines.push(...p.mine); return; }
      conflicts++; lines.push(MARK.mine, ...p.mine, theirsMark(o.theirsAt), ...p.theirs, MARK.end);
    });
    return {text: lines.join("\n"), conflicts};
  }
  function resolveText(text, choice){
    const out = []; let mode = 0, A = [], C = [];
    const flush = () => { if (choice === "mine") out.push(...A); else if (choice === "theirs") out.push(...C); else { out.push(...A); if (A.join("\n") !== C.join("\n")) out.push(...C); } };
    String(text).split("\n").forEach(ln => {
      if (mode === 0) { if (ln === MARK.mine) { mode = 1; A = []; C = []; } else out.push(ln); }
      else if (mode === 1) { if (MARK.theirsRe.test(ln)) mode = 2; else A.push(ln); }
      else if (ln === MARK.end) { flush(); mode = 0; } else C.push(ln);
    });
    if (mode === 1) out.push(MARK.mine, ...A); else if (mode === 2) out.push(MARK.mine, ...A, theirsMark(0), ...C);
    return out.join("\n");
  }
  function conflictParts(text){
    const lines = String(text).split("\n"), res = []; let mode = 0, A = [], C = [], at = "";
    lines.forEach(ln => {
      if (mode === 0) { if (ln === MARK.mine) { mode = 1; A = []; C = []; at = ""; } }
      else if (mode === 1) { if (MARK.theirsRe.test(ln)) { mode = 2; const m = /\((.*)\)/.exec(ln); at = m ? m[1] : ""; } else A.push(ln); }
      else if (ln === MARK.end) { res.push({mine: A.join("\n"), theirs: C.join("\n"), at}); mode = 0; } else C.push(ln);
    });
    return res;
  }

  /* values */
  const pickMine = o => {
    if (o.mineAt == null) return false;
    if (o.theirsAt == null) return true;
    return !(ms(o.theirsAt) - (o.mineAt + (o.skew || 0)) > SKEW_GUARD);
  };
  const shorten = v => { let s; try { s = typeof v === "string" ? v : JSON.stringify(v); } catch(e) { s = String(v); } s = s === undefined ? "(empty)" : s; return s.length > CAP.logChars ? s.slice(0, CAP.logChars) + "..." : s; };
  function mv(path, b, m, t, c){
    if (eq(m, t)) return m;
    if (c.hasBase) { if (eq(m, b)) return t; if (eq(t, b)) return m; }
    if (m === undefined) return t;
    if (t === undefined) return m;
    const key = path[path.length - 1];
    if (path.length === 1 && key === "schema" && typeof m === "number" && typeof t === "number") return Math.max(m, t);
    if (path.length === 1 && key === "status" && c.kind === "task" && (m === "done") !== (t === "done")) {
      const win = m === "done" ? m : t, lost = m === "done" ? t : m;
      c.losers.push({field: "status", lost, from: m === "done" ? "other" : "this"});
      return win;
    }
    if (isObj(m) && isObj(t)) return mo(isObj(b) ? b : undefined, m, t, c, path);
    if (Array.isArray(m) && Array.isArray(t)) return ma(Array.isArray(b) ? b : undefined, m, t, c, path);
    if (typeof m === "string" && typeof t === "string" && c.textKeys.includes(key)) {
      const r = mergeText(typeof b === "string" ? b : (c.hasBase ? "" : null), m, t, c.o);
      c.texts++; c.tconf += r.conflicts; c.textFields.add(path.join(".")); return r.text;
    }
    const mine = pickMine(c.o);
    c.losers.push({field: path.join("."), lost: mine ? t : m, from: mine ? "other" : "this"});
    return mine ? m : t;
  }
  function mo(b, m, t, c, path){
    const out = {};
    new Set([...Object.keys(t), ...Object.keys(m)]).forEach(k => { const v = mv(path.concat(k), b ? b[k] : undefined, m[k], t[k], c); if (v !== undefined) out[k] = v; });
    return out;
  }
  function ma(b, m, t, c, path){
    const all = [...m, ...t];
    if (all.length && all.every(x => isObj(x) && x.id != null)) return byId(b, m, t, c, path);
    let res;
    if (c.hasBase && b) {
      const rm = b.filter(x => !has(m, x)), rt = b.filter(x => !has(t, x));
      res = t.filter(x => !has(rm, x));
      m.forEach(x => { if (!has(res, x) && !has(b, x) && !has(rt, x)) res.push(x); });
    } else { res = t.slice(); m.forEach(x => { if (!has(res, x)) res.push(x); }); }
    if (res.length && res.every(x => isObj(x) && typeof x.at === "number")) res.sort((x, y) => x.at - y.at);
    return res;
  }
  function byId(b, m, t, c, path){
    const bm = new Map((b || []).map(x => [x.id, x])), mm = new Map(m.map(x => [x.id, x])), tm = new Map(t.map(x => [x.id, x]));
    const idsB = (b || []).map(x => x.id), idsM = m.map(x => x.id), idsT = t.map(x => x.id);
    const reordered = ids => !eq(idsB.filter(i => ids.includes(i)), ids.filter(i => idsB.includes(i)));
    const mineOrder = c.hasBase && reordered(idsM) && !reordered(idsT);
    const order = (mineOrder ? idsM : idsT).slice();
    (mineOrder ? idsT : idsM).forEach(i => { if (!order.includes(i)) order.push(i); });
    const out = [];
    order.forEach(id => {
      const bi = bm.get(id), mi = mm.get(id), ti = tm.get(id);
      if (mi && ti) out.push(eq(mi, ti) ? mi : mo(bi, mi, ti, c, path.concat(id)));
      else if (mi) { if (!(c.hasBase && bi !== undefined && eq(mi, bi))) out.push(mi); }
      else if (ti) { if (!(c.hasBase && bi !== undefined && eq(ti, bi))) out.push(ti); }
    });
    return out;
  }
  const titleOf = (kind, o) => {
    if (!isObj(o)) return "";
    const s = kind === "note" ? String(o.text || "").trim().split("\n")[0] : kind === "deck" || kind === "course" ? o.name : o.title;
    return String(s || "").slice(0, 40);
  };
  function histPush(obj, text, from, at){
    if (typeof text !== "string" || !text.trim()) return;
    const h = (Array.isArray(obj.hist) ? obj.hist : []).slice();
    if (h.some(x => x && x.text === text.slice(0, CAP.histChars))) return;
    h.push({at, from, text: text.slice(0, CAP.histChars)});
    obj.hist = h.sort((x, y) => (x.at || 0) - (y.at || 0)).slice(-CAP.hist);
  }
  function mergeItem(kind, base, mine, theirs, o){
    o = o || {}; const now = o.now || Date.now();
    if (base === undefined) base = null;
    const R = (merged, state, extra) => {
      const r = Object.assign({merged: copy(merged === undefined ? null : merged), state, conflict: false, losers: [], title: titleOf(kind, merged || mine || theirs || base)}, extra);
      if (kind === "meta" && isObj(r.merged) && typeof r.merged.schema === "number") r.merged.schema = Math.max(r.merged.schema, (mine && mine.schema) || 0, (theirs && theirs.schema) || 0);
      return r;
    };
    if (eq(mine, theirs)) return R(mine, "same");
    if (base !== null && eq(mine, base)) return R(theirs, "theirs");
    if (base !== null && eq(theirs, base)) return R(mine, "mine");
    const mt = isTomb(mine), tt = isTomb(theirs);
    if (mt || tt) {
      if (mt && tt) return R(theirs, "theirs");
      if (mt) {
        if (mine !== null && tombAt(mine) + (o.skew || 0) - ms(o.theirsAt) > DELETE_MARGIN && o.theirsAt != null) return R(mine, "deleted");
        return R(theirs, "restored");
      }
      if (theirs !== null && o.mineAt != null && (ms(o.theirsAt) || tombAt(theirs)) - (o.mineAt + (o.skew || 0)) > DELETE_MARGIN) return R(theirs, "deleted");
      return R(untomb(mine), "restored");
    }
    const c = {kind, o, hasBase: base !== null, losers: [], texts: 0, tconf: 0, textFields: new Set(), textKeys: TEXT_KEYS[kind] || []};
    const merged = mo(isObj(base) ? base : undefined, mine, theirs, c, []);
    if (kind === "task") {
      const RK = ["remote", "remoteSrc", "remoteWhy", "remoteAt", "remoteSig"], um = isObj(mine) && mine.remoteSrc === "user" && (mine.remote === "yes" || mine.remote === "no"), ut = isObj(theirs) && theirs.remoteSrc === "user" && (theirs.remote === "yes" || theirs.remote === "no");
      const w = um && ut ? ((Number(mine.remoteAt) || 0) >= (Number(theirs.remoteAt) || 0) ? mine : theirs) : um ? mine : ut ? theirs : null;
      if (w) RK.forEach(k => { if (w[k] === undefined) delete merged[k]; else merged[k] = w[k]; });
    }
    if (kind === "note" && c.texts) { [["this device", mine], ["other device", theirs]].forEach(([from, x]) => { if (x && x.text !== merged.text) histPush(merged, x.text, from, now); }); }
    if (Array.isArray(merged.history)) merged.history = merged.history.slice(-CAP.history);
    if (Array.isArray(merged.hist)) merged.hist = merged.hist.sort((x, y) => (x.at || 0) - (y.at || 0)).slice(-CAP.hist);
    const marked = TEXT_KEYS[kind] ? TEXT_KEYS[kind].some(k => hasMarks(merged[k])) : false;
    if (c.tconf || marked) merged.conflict = {at: now, n: Math.max(1, c.tconf), theirsAt: ms(o.theirsAt) || now};
    else if (merged.conflict) delete merged.conflict;
    if (c.losers.length && kind !== "meta" && kind !== "backup") {
      merged.syncLog = (Array.isArray(merged.syncLog) ? merged.syncLog : []).concat(c.losers.map(l => ({at: now, field: l.field, lost: shorten(l.lost), from: l.from}))).slice(-CAP.log);
      if (kind === "task" && Array.isArray(merged.history)) c.losers.forEach(l => { if (/^(due|start|status|title|priority|time|courseId|type)$/.test(l.field)) merged.history = merged.history.concat([{at: now, text: "Sync: kept " + (l.from === "other" ? "the newer" : "this device's") + " " + l.field + "; the other value was " + shorten(l.lost)}]).slice(-CAP.history); });
    }
    return R(merged, "merged", {conflict: !!(c.tconf || marked), losers: c.losers, texts: c.texts});
  }
  return {mergeItem, mergeText, diff3, resolveText, conflictParts, hasMarks, isTomb, tombAt, untomb, skewFrom, pickMine, eq, MARK, CAP, SKEW_GUARD, DELETE_MARGIN, titleOf};
})();
/* SYNC-MERGE-END */

