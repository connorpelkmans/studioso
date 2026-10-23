const fs = require("fs"), path = require("path"), assert = require("assert");
const src = require("../scripts/app-files").source();
const block = (a, b, names) => { const i = src.indexOf(a), j = src.indexOf(b, i); assert.ok(i > 0 && j > i, "markers " + a); return new Function(src.slice(a.endsWith("*/") ? i + a.length : i, j) + `; return {${names}};`)(); };
let n = 0; const ok = (c, m) => { n++; assert(c, m); };

(async () => {
  /* Linked Notes */
  const L = block("/*NOTELINK-START*/", "/*NOTELINK-END*/", "parseLinks, splitTarget, noteTitle, buildIndex, resolve, renameIn, typing, keyOf, linkName");
  ok(L.linkName("Notes [draft] v2.pdf") === "Notes draft v2.pdf" && L.resolve(L.buildIndex({file: [{id: "f", name: "Notes [draft] v2.pdf"}]}), L.linkName("Notes [draft] v2.pdf")).id === "f", "a name with brackets is linked without them, and still found");
  ok(L.parseLinks("[[" + "x".repeat(180) + "]]").length === 1, "long names make working links");
  const ls = L.parseLinks("See [[Calvin cycle]] and [[Lecture 4 slides#p12]], not [[ ]] or [[a\nb]] or [single].");
  ok(ls.length === 2 && ls[0].name === "Calvin cycle" && ls[1].name === "Lecture 4 slides" && ls[1].page === 12, "links and a page: " + JSON.stringify(ls));
  ok(ls[0].at === 4 && ls[0].len === "[[Calvin cycle]]".length, "where each link is");
  ok(L.splitTarget("Reading#page 3").page === 3 && L.splitTarget("C#").name === "C#" && L.splitTarget("C#").page === 0, "page suffixes, and a # that isn't one");
  ok(L.noteTitle("\n  \n[[Photosynthesis]] notes\nmore") === "Photosynthesis notes" && L.noteTitle("") === "", "a note's name is its first line with words, without brackets");
  const idx = L.buildIndex({note: [{id: "n1", name: "Lab 3"}], task: [{id: "t1", name: "Lab 3"}, {id: "t2", name: "Essay"}], deck: [{id: "d1", name: "Cell Bio"}], file: [{id: "f1", name: "essay.pdf"}]});
  ok(L.resolve(idx, "lab  3").kind === "note" && L.resolve(idx, "ESSAY").id === "t2" && L.resolve(idx, "cell bio").kind === "deck" && L.resolve(idx, "nope") === null, "a note wins over a task with the same name; case and spaces don't matter");
  ok(L.renameIn("[[Lab 3]] and [[lab 3#p2]] but not [[Lab 30]]", "Lab 3", "Lab Three") === "[[Lab Three]] and [[Lab Three#p2]] but not [[Lab 30]]", "renames keep pages and leave other links alone");
  ok(JSON.stringify(L.typing("see [[Cal", 9)) === JSON.stringify({q: "Cal", from: 4}) && L.typing("see [[Cal]] x", 13) === null && L.typing("[[a\nb", 5) === null, "typing [[ is noticed only while the link is open");

  /* Listen */
  const S = block("/*LISTEN-START*/", "/*LISTEN-END*/", "pickCards, speakable");
  const cards = [{id: "a", front: "A", back: "a", seen: 3, right: 1, wrong: 2, due: "2026-10-01"}, {id: "b", front: "B", back: "b", seen: 0}, {id: "c", front: "C", back: "c", seen: 4, right: 4, wrong: 0, due: "2026-12-01"},
    {id: "d", front: "D", back: "d", seen: 2, right: 0, wrong: 2, due: "2026-12-01"}, {id: "e", front: "", back: "x", seen: 0}, {id: "f", front: "F", back: "f", img: {k: "i"}}, {id: "g", front: "G", back: "g", draft: true}];
  ok(S.pickCards(cards, "due", "2026-10-11").map(c => c.id).join() === "a,b", "due and new, without empty, image or draft cards");
  ok(S.pickCards(cards, "all", "2026-10-11").map(c => c.id).join() === "a,b,c,d", "all cards with text");
  ok(S.pickCards(cards, "tricky", "2026-10-11").map(c => c.id).join() === "d,a", "tricky: most missed first");
  ok(S.speakable("<b>Water</b> {{c1::moves}}\n- across\n___ membrane **now**") === "Water moves. across. blank membrane now", "text reads well aloud: " + S.speakable("<b>Water</b> {{c1::moves}}\n- across\n___ membrane **now**"));

  /* Reader */
  const R = block("/*READER-START*/", "/*READER-END*/", "rectsOn, hitAt, cleanSel");
  const box = {left: 100, top: 50, width: 600, height: 800};
  const rs = R.rectsOn([{left: 160, top: 100, width: 100, height: 20}, {left: 262, top: 101, width: 150, height: 19}, {left: 160, top: 130, width: 80, height: 20}, {left: 165, top: 131, width: 20, height: 10}, {left: 0, top: 0, width: 0, height: 0}], box);
  ok(rs.length === 2, "pieces on one line join; a piece inside another goes; empty ones go: " + JSON.stringify(rs));
  ok(Math.abs(rs[0][0] - 0.1) < 1e-4 && Math.abs(rs[0][2] - 252 / 600) < 1e-3 && rs[0][1] === 0.0625, "as fractions of the page");
  ok(R.rectsOn([{left: 50, top: 40, width: 100, height: 20}], box)[0][0] === 0, "clipped to the page");
  const hs = [{id: "x", p: 1, r: [[0.1, 0.1, 0.5, 0.02]]}, {id: "y", p: 1, r: [[0.1, 0.1, 0.2, 0.02]]}, {id: "z", p: 2, r: [[0, 0, 1, 1]]}];
  ok(R.hitAt(hs, 1, 0.15, 0.11).id === "y" && R.hitAt(hs, 1, 0.5, 0.11).id === "x" && R.hitAt(hs, 1, 0.9, 0.9) === null, "the newest highlight under the tap");
  ok(R.cleanSel("photo-\nsynthesis  makes\n sugar") === "photosynthesis makes sugar", "a selection loses hyphenation and line breaks");

  /* Lecture */
  const C = block("/*LECTURE-START*/", "/*LECTURE-END*/", "clock, pickMime, extOf, joinTranscript, studyNoteText, SEG_MS");
  ok(C.clock(0) === "0:00" && C.clock(65000) === "1:05" && C.clock(3725000) === "1:02:05", "clock");
  ok(C.pickMime(m => m === "audio/mp4") === "audio/mp4" && C.pickMime(m => /webm/.test(m)) === "audio/webm;codecs=opus" && C.pickMime(() => false) === "", "the best recording format there is");
  ok(C.extOf("audio/mp4;codecs=x") === "m4a" && C.extOf("audio/webm") === "webm", "file endings");
  ok(C.joinTranscript([{t: 1000, s: "Hello"}, {t: 20000, s: "class."}, {t: 70000, s: "Next minute."}], [30000]) === "Hello class.\n★ 0:30\nNext minute.", "captions in minute paragraphs, marks on their own lines: " + JSON.stringify(C.joinTranscript([{t: 1000, s: "Hello"}, {t: 20000, s: "class."}, {t: 70000, s: "Next minute."}], [30000])));
  const note = C.studyNoteText({title: "Osmosis", summary: "Water moves.", sections: [{heading: "Basics", points: ["Needs a membrane", ""]}], terms: [{term: "Solute", definition: "What is dissolved"}, {term: "x"}], questions: ["Why?"]}, {title: "BIO Lecture", when: "Oct 11", dur: "52:00", link: "[[BIO.webm]]"});
  ok(note === "Osmosis\nOct 11 · 52:00 · [[BIO.webm]]\n\nWater moves.\n\nBasics\n• Needs a membrane\n\nTerms\n• Solute: What is dissolved\n\nQuestions to Review\n• Why?", "study notes become a tidy note: " + JSON.stringify(note));
  ok(C.studyNoteText({title: "T", sections: [{heading: "H", points: ["p ".repeat(6000)]}]}, {title: "x"}).length <= 8000, "never longer than a note can be");
  ok(C.SEG_MS === 300000, "5-minute parts for transcription");

  /* Email */
  const E = block("/*EMAILCAP-START*/", "/*EMAILCAP-END*/", "cleanSubject, dateLines, gmailConfirm");
  ok(E.cleanSubject("RE: Fwd: FW[2]: Lab 4 moved") === "Lab 4 moved" && E.cleanSubject("Reading list") === "Reading list", "reply and forward marks come off the subject");
  const dl = E.dateLines("Fwd: Lab moved", "Hi all,\nLab 4 is now due Friday Oct 16.\nThe office is room 204.\nQuiz 2 on 10/20 covers ch 5.\nThanks!\n" + "Unsubscribe from this list any time by clicking the link in your notification preferences on the course website settings page today and forever.", 8);
  ok(dl.join("|") === "Lab 4 is now due Friday Oct 16.|Quiz 2 on 10/20 covers ch 5.", "only the lines that name work and a day: " + JSON.stringify(dl));
  ok(JSON.stringify(E.gmailConfirm("forwarding-noreply@google.com", "Confirmation code: 123456789\nTo allow, click https://mail-settings.google.com/mail/vf-abc123 ok")) === JSON.stringify({code: "123456789", link: "https://mail-settings.google.com/mail/vf-abc123"}), "Gmail's forwarding confirmation is found");
  ok(E.gmailConfirm("someone@google.com", "Confirmation code: 123456") === null, "only from Gmail's forwarding address");

  /* Capture inbox */
  const I = block("/* CAPTURE-INBOX-START", "/* CAPTURE-INBOX-PURE-END */", "capProcess");
  const row = (id, source, text) => ({id, text: text || id, source, created_at: "2026-10-11T12:00:00Z"});
  const mk = (emailIds, seen) => { const log = {acked: [], seen: [], email: [], ingest: []}; return {log, d: {
    dedupe: () => ({seen: new Set(seen || [])}), seenAdd: ids => log.seen.push(...ids), ack: async ids => { log.acked.push(...ids); },
    ingest: async drafts => { log.ingest.push(...drafts.map(x => x.ref)); return true; },
    email: async rows => { log.email.push(...rows.map(r => r.id)); return emailIds(rows); }}}; };
  let m = mk(rows => rows.map(r => r.id));
  let out = await I.capProcess([row("v1", "siri", "Read ch 4"), row("e1", "email", "Lab moved"), row("e2", "email", "Lab moved"), row("t", "test")], m.d);
  ok(m.log.email.join() === "e1,e2" && m.log.ingest.join() === "v1", "emails go to the email reader (both, though they share a subject), the rest to capture");
  ok(m.log.acked.sort().join() === "e1,e2,t,v1" && out.added === 3, "everything taken care of is acknowledged");
  m = mk(() => ["e1", "zz"]);
  await I.capProcess([row("e1", "email"), row("e2", "email")], m.d);
  ok(m.log.acked.join() === "e1" && m.log.seen.join() === "e1", "an email that couldn't be read stays in the inbox for next time; unknown ids are ignored");
  m = mk(() => [], ["e1"]);
  await I.capProcess([row("e1", "email")], m.d);
  ok(m.log.email.length === 0 && m.log.acked.join() === "e1", "an email this device already handled is only acknowledged");
  m = mk(() => { throw new Error("boom"); });
  out = await I.capProcess([row("e1", "email"), row("v1", "siri", "Task")], m.d);
  ok(m.log.acked.join() === "v1" && !out.failed, "a failing email reader doesn't stop other captures");
  const plain = mk(() => []); delete plain.d.email;
  await I.capProcess([row("e9", "email", "Subject only")], plain.d);
  ok(plain.log.ingest.join() === "e9", "without the email reader (an older setup), an email is an ordinary capture");

  /* Two-way calendar sync */
  const Y = block("/*CALSYNC-START*/", "/*CALSYNC-END*/", "wantList, busyEvent, keyPart");
  const SRCS = ["gcal", "mscal"], SRC = {google: "gcal", microsoft: "mscal"};
  const Yw = new Function("SRCS", "SRC", src.slice(src.indexOf("/*CALSYNC-START*/") + 17, src.indexOf("/*CALSYNC-END*/")) + "; return {wantList, busyEvent};")(SRCS, SRC);
  const course = id => id === "c1" ? {id: "c1", code: "BIO101", name: "Biology"} : null, isExam = t => t === "Exam" || t === "Quiz";
  const tasks = [{id: "a", title: "Lab 3", type: "Lab", courseId: "c1", due: "2026-10-16", time: "23:45", status: "todo"}, {id: "b", title: "Midterm", type: "Exam", courseId: "c1", due: "2026-10-20", time: "09:00"},
    {id: "c", title: "Review ch 4", type: "Study", due: "2026-10-14", time: "18:00", hours: 1.5}, {id: "d", title: "Done", type: "Lab", due: "2026-10-15", status: "done"}, {id: "e", title: "Old", type: "Lab", due: "2026-09-01"},
    {id: "f", title: "BIO101 essay", type: "Essay", courseId: "c1", due: "2026-10-18"}, {id: "g", title: "Archived", type: "Lab", due: "2026-10-18", archivedTerm: "x"}];
  const occ = [{type: "meet", id: "c1", key: "2026-10-13|10:00|Lecture", title: "BIO101", label: "Lecture", date: "2026-10-13", start: "10:00", end: "11:20", where: "Hall B"},
    {type: "meet", id: "c1", key: "2026-10-13|14:00|Office Hours", title: "BIO101", label: "Office Hours", date: "2026-10-13", start: "14:00", end: "15:00"},
    {type: "event", id: "ev1", key: "2026-10-15", title: "Career fair", date: "2026-10-15", allDay: true, ev: {src: ""}}, {type: "event", id: "csg1", key: "2026-10-15", title: "From Google", date: "2026-10-15", start: "13:00", end: "14:00", ev: {src: "gcal"}},
    {type: "meet", id: "c1", key: "2026-10-20|10:00|Lecture", title: "BIO101", label: "Lecture", date: "2026-10-20", skipped: true}, {type: "avail", id: "w", key: "x", title: "Work", date: "2026-10-14", start: "09:00", end: "17:00"}];
  const W = Yw.wantList({tasks, occurrences: occ, course, isExam}, {deadlines: true, classes: true, study: true}, "2026-10-04", "2026-12-10");
  const by = k => W.events.find(e => e.k === k);
  ok(W.events.map(e => e.k).join() === "m:c1:2026-10-13|10:00|Lecture,t:c,e:ev1:2026-10-15,t:a,t:f,t:b", "what goes in, in date order (no done, old, archived, office hours, skipped, availability or calendar events): " + W.events.map(e => e.k).join());
  ok(by("t:a").title === "Due: Lab 3 · BIO101" && by("t:a").start === "23:45" && by("t:a").end === "23:59" && !by("t:a").busy, "a timed deadline: 30 minutes, not past midnight, not busy");
  ok(by("t:b").title === "Midterm · BIO101" && by("t:b").end === "10:00" && by("t:b").busy, "an exam: an hour, busy");
  ok(by("t:c").title === "Study: Review ch 4" && by("t:c").end === "19:30" && by("t:c").busy, "a study session: its hours, busy");
  ok(by("t:f").title === "Due: BIO101 essay" && by("t:f").allDay, "the course code isn't repeated; no time means all day");
  ok(by("m:c1:2026-10-13|10:00|Lecture").title === "BIO101 Lecture" && by("m:c1:2026-10-13|10:00|Lecture").where === "Hall B", "a class");
  ok(W.refs.get("m:c1:2026-10-13|10:00|Lecture").key === "2026-10-13|10:00|Lecture" && W.refs.get("t:a").kind === "task", "each key leads back to what it is");
  const W2 = Yw.wantList({tasks, occurrences: occ, course, isExam}, {deadlines: false, classes: false, study: true}, "2026-10-04", "2026-12-10");
  ok(W2.events.map(e => e.k).join() === "t:c", "each kind can be left out");
  ok(Y.keyPart("2026-10-13|10:00|Office Hours") === "2026-10-13|10:00|Office_Hours" && Y.keyPart("a/b<c>") === "abc", "keys stay safe");
  const be = Yw.busyEvent({id: "abc123def4567890abcd", title: "Shift", date: "2026-10-12", start: "13:00", end: "17:00", allDay: false, where: "Café"}, "google");
  ok(be.id === "csgabc123def4567890abcd" && be.src === "gcal" && be.start === "13:00" && be.where === "Café" && be.icsUid === "abc123def4567890abcd", "busy time becomes a Schedule event with a stable id");
  ok(/^csm[0-9a-f]*$/.test(Yw.busyEvent({id: "zz<script>", title: "", date: "2026-10-12", allDay: true}, "microsoft").id) && Yw.busyEvent({id: "1", date: "2026-10-12", allDay: true, endDate: "2026-10-14"}, "microsoft").title === "Busy", "ids keep hex only; no title is Busy");
  ok(/\/\^\[0-9a-f\]\{12,40\}\$\/\.test/.test(src.slice(src.indexOf("function applyBusy("), src.indexOf("function applyBusy(") + 400)), "busy events without the server's hex id are left out");

  console.log(`pro-study: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
