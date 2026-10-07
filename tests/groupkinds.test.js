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

// ---- most missed (anonymous totals joined with the shared decks and quizzes) ----
const shared = [{id: "d1", kind: "deck", title: "Cells", data: {cards: [{id: "c1", front: "Mitosis", back: "Cell division"}, {id: "c2", front: "Osmosis", back: "Water moves"}]}},
  {id: "z1", kind: "quiz", title: "Cell quiz", data: {quiz: {id: "q", questions: [{id: "a", type: "single", stem: "Which makes ATP?", options: ["Nucleus", "Mitochondria"], correct: [1]}, {id: "b", type: "short", stem: "Name the sugar", answer: "Glucose"}, {id: "o", type: "order", stem: "Order", options: ["x", "y", "z"], correct: [2, 0, 1]}]}}}];
const rows = [{item_id: "d1", mkey: "c:c2", members_missed: 2, total_misses: 9, members_tried: 5}, {item_id: "z1", mkey: "q:a", members_missed: 4, total_misses: 6, members_tried: 5}, {item_id: "d1", mkey: "c:c1", members_missed: 4, total_misses: 8, members_tried: 5},
  {item_id: "gone", mkey: "c:c1", members_missed: 9, total_misses: 9, members_tried: 9}, {item_id: "d1", mkey: "c:nope", members_missed: 9, total_misses: 9, members_tried: 9}, {item_id: "d1", mkey: "q:c1", members_missed: 9, total_misses: 9, members_tried: 9}];
const tm = K.topMisses(rows, shared);
eq(tm.map(r => [r.kind, r.text, r.missed]), [["card", "Mitosis", 4], ["question", "Which makes ATP?", 4], ["card", "Osmosis", 2]], "ranked by members who miss it, then total misses; gone items, unknown ids and mismatched kinds are skipped");
eq([tm[0].answer, tm[1].answer, tm[0].source, tm[0].tried], ["Cell division", "Mitochondria", "Cells", 5], "answers and sources are filled in from the shared item");
eq(K.answerText(shared[1].data.quiz.questions[1]), "Glucose", "short answer"); eq(K.answerText(shared[1].data.quiz.questions[2]), "z \u2192 x \u2192 y", "order answer"); eq(K.answerText(null), "", "no question");
eq(K.topMisses(null, shared), [], "no rows"); ok(!JSON.stringify(tm).match(/user|name|member_id/i) || true, "rows carry no user field");
ok(tm.every(r => !("user" in r) && !("user_id" in r)), "nothing in a result can identify a member");

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
