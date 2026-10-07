// Unit tests for the study group / group project logic (pure code between /*GK-START*/ and /*GK-END*/ in index.html).  Run: node tests/groupkinds.test.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const s = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const gt = s.slice(s.indexOf("/*GT-START*/"), s.indexOf("/*GT-END*/")), gk = s.slice(s.indexOf("/*GK-START*/"), s.indexOf("/*GK-END*/"));
const K = new Function(gt + gk + ";return GK;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };
const T = "2026-10-03";

// ---- tabs: each kind has its own set ----
eq(K.tabIds("study"), ["study", "sessions", "challenge", "chat", "members"], "study group tabs");
eq(K.tabIds("project"), ["overview", "tasks", "files", "meetings", "chat", "members"], "group project tabs");
eq(K.tabIds("whatever"), K.tabIds("study"), "an unknown kind is a study group");
eq([K.kindOf({kind: "project"}), K.kindOf({}), K.kindOf(null)], ["project", "study", "study"], "kindOf");
ok(K.tabIds("study").every(t => t !== "tasks"), "study groups have no Tasks tab");
eq(K.roleLabel("editor"), "Editor", "role label"); eq(K.roleLabel("nope"), "", "unknown role");
eq(K.ROLES.map(r => r[1]).slice(0, 4), ["Lead", "Researcher", "Editor", "Presenter"], "the four roles");

// ---- countdown ----
eq(K.countdown("", T).k, "none", "no date");
eq(K.countdown("2026-10-10", T), {k: "left", n: 7, label: "7 days left"}, "a week left");
eq(K.countdown("2026-10-04", T).label, "1 day left", "one day left");
eq(K.countdown(T, T).label, "Due today", "today");
eq(K.countdown("2026-10-02", T).label, "Due yesterday", "yesterday");
eq(K.countdown("2026-09-30", T).label, "3 days overdue", "overdue");

// ---- starter plan ----
let p = K.planFromDue("2026-10-31", T);
eq(p.length, 6, "six milestones"); eq(p[5].due, "2026-10-31", "the last milestone is the due date");
ok(p.every((x, i) => x.due >= T && x.due <= "2026-10-31" && (i === 0 || x.due >= p[i - 1].due)), "dates stay between today and the due date, in order");
ok(p[0].due < p[5].due, "spread out over a month");
p = K.planFromDue("2026-10-04", T); ok(p.length === 6 && p.every(x => x.due === T || x.due === "2026-10-04"), "a one-day project still gets dates within it");
p = K.planFromDue(T, T); ok(p.every(x => x.due === T), "due today: everything today");
eq(K.planFromDue("2026-10-01", T), [], "no plan for a due date in the past"); eq(K.planFromDue("", T), [], "no plan without a date");

// ---- overview ----
const members = [{user_id: "a", display_name: "Ana"}, {user_id: "b", display_name: "Ben"}, {user_id: "c", display_name: "Cy"}];
const t = (id, who, st, due, extra) => Object.assign({id, list_id: "L", title: id, status: st, assignee_id: who, due_at: due, position: 1, created_at: "2026-10-01", deleted: false}, extra);
const tasks = [t("1", "a", "done", "2026-10-01"), t("2", "b", "todo", "2026-10-01"), t("3", "b", "doing", "2026-09-30"), t("4", "c", "todo", "2026-10-09"), t("5", null, "todo", null), t("6", "a", "todo", null, {deleted: true})];
let o = K.overview(tasks, members, T);
eq(o.progress, {done: 1, total: 5, pct: 20}, "progress ignores deleted tasks"); eq(o.open, 4, "open tasks");
eq(o.behind.map(r => [r.name, r.overdue]), [["Ben", 2]], "Ben is behind with two overdue tasks"); eq(o.unassigned, 1, "one unclaimed");
eq(K.overview([], members, T).progress.pct, 0, "an empty project is 0%");
eq(K.myTasks(tasks, "b").map(x => x.id), ["3", "2"], "my open tasks, soonest first"); eq(K.myTasks(tasks, "a").length, 0, "done and deleted are not mine to do");
const b = K.board(tasks); eq([b.todo.length, b.doing.length, b.done.length], [3, 1, 1], "board columns");

// ---- quiz battle ----
const sc = [{user_id: "a", item_id: "q1", best_correct: 8, best_total: 10}, {user_id: "a", item_id: "q2", best_correct: 5, best_total: 10}, {user_id: "b", item_id: "q1", best_correct: 9, best_total: 10}];
const bt = K.battle(sc, members);
eq(bt.map(r => [r.name, r.taken, r.pct]), [["Ben", 1, 90], ["Ana", 2, 65], ["Cy", 0, 0]], "ranked by average best score; people who haven't played last");
eq([bt[1].correct, bt[1].total], [13, 20], "totals");
eq(K.battle([], members).map(r => r.name), ["Ana", "Ben", "Cy"], "no scores: alphabetical");

// ---- weak spots ----
const wc = K.weakCards([{c: {front: " Mitosis ", back: "Cell division", wrong: 3}, d: {name: "Bio"}}, {c: {front: "", back: "x", wrong: 1}, d: {name: "Bio"}}, {c: {front: "Osmosis", back: "Water moves", wrong: 0}, d: {name: "Bio"}}]);
eq(wc.map(x => [x.f.trim(), x.n]), [["Mitosis", 3], ["Osmosis", 1]], "blank cards are dropped and a count is at least 1");
eq(K.weakCards(Array.from({length: 40}, (_, i) => ({c: {front: "f" + i, back: "b", wrong: 1}, d: {name: "D"}}))).length, K.LIM.weakCards, "at most 20 cards shared");
const ag = K.weakAggregate([{user: "a", cards: [{f: "Mitosis", b: "Cell division", d: "Bio", n: 2}, {f: "Osmosis", b: "Water", d: "Bio", n: 5}]}, {user: "b", cards: [{f: " mitosis ", b: "Cell division", d: "Bio", n: 1}]}, {user: "b", cards: [{f: "mitosis", b: "x", d: "Bio", n: 1}]}]);
eq(ag.map(x => [x.f, x.people, x.n]), [["Mitosis", 2, 4], ["Osmosis", 1, 5]], "same card from two people counts as two people; one person twice counts once");

// ---- Q&A ----
const items = [{id: "q1", kind: "qa", data: {solved: true}, created_at: "2026-10-01"}, {id: "q2", kind: "qa", data: {}, created_at: "2026-10-02"}, {id: "q3", kind: "qa", data: {}, created_at: "2026-10-03"},
  {id: "a1", kind: "answer", ref_id: "q1", created_at: "2026-10-01T10"}, {id: "a2", kind: "answer", ref_id: "q1", created_at: "2026-10-01T09"}, {id: "a3", kind: "answer", ref_id: "q2", created_at: "2026-10-02"}];
eq(K.questionsOf(items).map(x => x.id), ["q3", "q2", "q1"], "unsolved first, newest first");
eq(K.answersOf(items, "q1", "").map(x => x.id), ["a2", "a1"], "oldest answer first");
eq(K.answersOf(items, "q1", "a1").map(x => x.id), ["a1", "a2"], "the best answer comes first"); eq(K.answersOf(items, "q9", "").length, 0, "no answers");

// ---- meeting actions ----
const acts = K.parseActions("- Ana: book the room\n2) Ben: send the draft\n\nBuy markers\nZed: unknown person\n  * Cy: print it", members);
eq(acts.map(a => [a.text, a.who]), [["book the room", "a"], ["send the draft", "b"], ["Buy markers", ""], ["Zed: unknown person", ""], ["print it", "c"]], "action lines: bullets stripped, names matched");
eq(K.parseActions("x\n".repeat(30), members).length, K.LIM.actions, "at most 12 actions");
eq(K.parseActions("", members), [], "nothing");

// ---- peer check-in window, hosts ----
ok(K.peerOpen("", T) && K.peerOpen("2026-10-17", T) && K.peerOpen("2026-09-01", T) && !K.peerOpen("2026-10-18", T), "check-in opens 14 days before the due date and stays open");
eq([K.hostOf("https://www.docs.google.com/x"), K.hostOf("nope")], ["docs.google.com", ""], "hostOf");
console.log(`groupkinds.test: ${n} checks passed`);
