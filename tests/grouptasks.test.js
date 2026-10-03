// Unit tests for the Project Tasks logic (pure code between /*GT-START*/ and /*GT-END*/ in index.html).  Run: node tests/grouptasks.test.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const s = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const code = s.slice(s.indexOf("/*GT-START*/"), s.indexOf("/*GT-END*/"));
const G = new Function(code + ";return GTL;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };

const ME = "u-me", SAM = "u-sam", JO = "u-jo", ALEX = "u-alex", T = "2026-10-03";
const members = [{user_id: ME, display_name: "Me"}, {user_id: SAM, display_name: "Sam"}, {user_id: JO, display_name: "Jo"}, {user_id: ALEX, display_name: "Alex"}];
let seq = 0;
const task = (o = {}) => Object.assign({id: "t" + (++seq), list_id: "L1", group_id: "g1", title: "Task " + seq, notes: "", status: "todo", assignee_id: null, due_at: null, priority: null,
  position: seq, created_by: SAM, created_at: "2026-10-01T10:00:0" + (seq % 10) + "Z", updated_by: SAM, updated_at: "2026-10-01T10:00:00Z", completed_at: null, completed_by: null, deleted: false}, o);

// ---- dates: whole days, never shifted by time zone or daylight saving ----
eq(G.diff("2026-03-07", "2026-03-09"), 2, "across US spring-forward");
eq(G.diff("2026-11-01", "2026-11-02"), 1, "across US fall-back");
eq(G.diff("2026-03-28", "2026-03-30"), 2, "across EU spring-forward");
eq(G.diff("2026-12-31", "2027-01-01"), 1, "year end");
eq(G.diff("2028-02-28", "2028-03-01"), 2, "leap year");
eq(G.addDays("2026-03-07", 1), "2026-03-08", "addDays across DST");
eq(G.addDays("2026-12-31", 1), "2027-01-01", "addDays year end");
eq(G.addDays("2026-03-01", -1), "2026-02-28", "addDays back");
ok(G.isDay("2026-10-03") && !G.isDay("") && !G.isDay(null) && !G.isDay("soon") && G.isDay("2026-10-03T00:00:00Z"), "isDay");
eq(G.localISO(new Date(2026, 9, 3, 23, 59)), "2026-10-03", "local date late evening is still today");
eq(G.localISO(new Date(2026, 0, 1, 0, 1)), "2026-01-01", "local date just after midnight");

// ---- due classification ----
eq(G.due(null, T).k, "none", "no date");
eq(G.due("2026-10-02", T).k, "overdue", "yesterday is overdue");
ok(G.due("2026-10-02", T).late && !G.due("2026-10-02", T).soon, "overdue is late, not soon");
eq(G.due(T, T).k, "today", "today");
eq(G.due("2026-10-04", T).k, "tomorrow", "tomorrow");
eq(G.due("2026-10-06", T).k, "soon", "3 days is soon");
eq(G.due("2026-10-07", T).k, "later", "4 days is later");
ok(G.due(T, T).soon && G.due("2026-10-04", T).soon && !G.due("2026-10-07", T).soon, "soon flags");
eq(G.due("2026-03-09", "2026-03-07").n, 2, "countdown across DST is whole days");
const wd = d => ({"2026-10-05": "Mon", "2026-10-08": "Thu"})[d] || "Day", md = d => "Oct " + Number(d.slice(8));
eq(G.dueLabel(null, T, wd, md), "No date", "label none");
eq(G.dueLabel("2026-10-02", T, wd, md), "Due yesterday", "label yesterday");
eq(G.dueLabel("2026-09-30", T, wd, md), "3d overdue", "label overdue");
eq(G.dueLabel(T, T, wd, md), "Due today", "label today");
eq(G.dueLabel("2026-10-04", T, wd, md), "Due tomorrow", "label tomorrow");
eq(G.dueLabel("2026-10-08", T, wd, md), "Due Thu", "label weekday within a week");
eq(G.dueLabel("2026-10-12", T, wd, md), "Due Oct 12", "label date beyond a week");

// ---- ordering ----
{
  const a = task({position: 2}), b = task({position: 1}), c = task({position: 3, status: "done", completed_at: "2026-10-02T09:00:00Z"}), d = task({position: 4, status: "done", completed_at: "2026-10-03T09:00:00Z"}), e = task({position: 0, deleted: true});
  eq(G.order([a, b, c, d, e]).map(t => t.id), [b.id, a.id, d.id, c.id], "open by position, then done newest first, deleted gone");
  const x = task({position: 5, created_at: "2026-10-01T10:00:02Z"}), y = task({position: 5, created_at: "2026-10-01T10:00:01Z"});
  eq(G.order([x, y]).map(t => t.id), [y.id, x.id], "ties break on created_at");
}

// ---- filters ----
const list = [
  task({title: "mine open", assignee_id: ME, due_at: "2026-10-05"}),
  task({title: "mine late", assignee_id: ME, due_at: "2026-10-01"}),
  task({title: "mine done", assignee_id: ME, status: "done", completed_at: "2026-10-02T00:00:00Z", due_at: "2026-09-01"}),
  task({title: "sam open", assignee_id: SAM, due_at: "2026-10-02"}),
  task({title: "jo doing", assignee_id: JO, status: "doing"}),
  task({title: "nobody", assignee_id: null}),
  task({title: "nobody done", assignee_id: null, status: "done"}),
  task({title: "gone", assignee_id: ME, deleted: true})
];
const titles = f => G.filter(list, f, ME, T).map(t => t.title);
eq(titles("all").length, 7, "all hides deleted only");
eq(titles("mine").sort(), ["mine late", "mine open"], "mine = my open tasks");
eq(titles("unassigned"), ["nobody"], "unassigned = open and nobody's");
eq(titles("overdue").sort(), ["mine late", "sam open"], "overdue = open and past due (done ones don't count)");
eq(titles("done").sort(), ["mine done", "nobody done"], "done");
eq(titles("bogus").length, 7, "unknown filter shows all");
eq(G.counts(list, ME, T), {all: 7, mine: 2, unassigned: 1, overdue: 2, done: 2}, "counts");

// ---- progress ----
eq(G.progress(list), {done: 2, total: 7, pct: 29}, "progress ignores deleted");
eq(G.progress([]), {done: 0, total: 0, pct: 0}, "empty progress");

// ---- workload ----
{
  const w = G.workload(list, members, T);
  eq(w.rows.map(r => [r.name, r.open]), [["Jo", 1], ["Me", 2], ["Sam", 1], ["Alex", 0]].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])), "open per member, busiest first");
  eq(w.rows.find(r => r.id === ME).overdue, 1, "overdue per member");
  eq(w.rows.find(r => r.id === ME).done, 1, "done per member");
  eq(w.unassigned, 1, "unassigned open");
  eq(w.uneven, null, "gap of 2 is not flagged");
  const big = list.concat([task({assignee_id: SAM}), task({assignee_id: SAM}), task({assignee_id: SAM})]);
  const w2 = G.workload(big, members, T);
  eq(w2.uneven, {hi: "Sam", lo: "Alex", gap: 4}, "gap of 3 or more is flagged");
  const gone = G.workload([task({assignee_id: "u-left"})], members, T);
  eq(gone.unassigned, 1, "a task held by someone no longer in the group counts as unassigned");
  eq(G.workload([], [{user_id: ME, display_name: ""}], T).rows[0].name, "Member", "nameless member");
}

// ---- permissions (mirror of the server rules) ----
{
  const free = task({assignee_id: null}), mine = task({assignee_id: ME}), theirs = task({assignee_id: SAM});
  ok(G.canReassign(free, JO, false), "anyone can assign an unassigned task");
  ok(G.canReassign(mine, ME, false), "the assignee can reassign");
  ok(!G.canReassign(theirs, ME, false), "a plain member can't take someone else's task");
  ok(G.canReassign(theirs, ME, true), "the owner can reassign");
  ok(G.canDeleteTask(task({created_by: ME}), ME, false) && !G.canDeleteTask(task({created_by: SAM}), ME, false) && G.canDeleteTask(task({created_by: SAM}), ME, true), "delete task: author or owner");
  ok(!G.canDeleteTask(task({created_by: null}), ME, false), "a task whose author left can only be deleted by the owner");
  ok(G.canDeleteList({created_by: ME}, ME, false) && !G.canDeleteList({created_by: SAM}, ME, false) && G.canDeleteList({created_by: SAM}, ME, true), "delete list: creator or owner");
}

// ---- caps ----
{
  const mk = (k, o) => Array.from({length: k}, (_, i) => task(Object.assign({list_id: "LC", id: "c" + i + "-" + k}, o)));
  ok(G.canAddTask(mk(199), "LC") && !G.canAddTask(mk(200), "LC"), "200 tasks per list");
  ok(G.canAddTask(mk(200, {deleted: true}), "LC"), "deleted tasks don't count");
  ok(G.canAddTask(mk(250).map(t => Object.assign(t, {list_id: "other"})), "LC"), "other lists don't count");
  const ls = (k, arch) => Array.from({length: k}, (_, i) => ({id: "l" + i, archived: i < arch}));
  ok(G.canAddList(ls(19, 0)) && !G.canAddList(ls(20, 0)), "20 active lists");
  ok(G.canAddList(ls(30, 12)) && !G.canAddList(ls(40, 30)), "40 lists in all, archived ones count toward that but not toward the 20");
  eq(G.clamp("  hello   there  ", 50), "hello there", "clamp collapses spaces");
  eq(G.clamp("x".repeat(300), G.LIM.title).length, 200, "clamp title");
  eq(G.clamp(null, 5), "", "clamp null");
  eq([G.LIM.lists, G.LIM.tasks, G.LIM.title, G.LIM.notes, G.LIM.listTitle], [20, 200, 200, 1000, 80], "limits match groups.sql");
}

// ---- optimistic update and rollback ----
{
  const base = task({assignee_id: null}), now = "2026-10-03T12:00:00.000Z";
  const claimed = G.applyPatch(base, {assignee_id: ME}, ME, now);
  eq([claimed.assignee_id, claimed.updated_by, claimed.updated_at], [ME, ME, now], "claim stamps who and when");
  ok(base.assignee_id === null, "the original object is not changed (so it can be restored)");
  const done = G.applyPatch(claimed, {status: "done"}, ME, now);
  eq([done.status, done.completed_by, done.completed_at], ["done", ME, now], "done stamps completion");
  const again = G.applyPatch(done, {title: "renamed"}, JO, "2026-10-03T13:00:00.000Z");
  eq([again.completed_by, again.completed_at], [ME, now], "editing a done task keeps who finished it");
  const reopened = G.applyPatch(done, {status: "todo"}, JO, now);
  eq([reopened.completed_by, reopened.completed_at], [null, null], "reopening clears the stamp");
  eq(G.applyPatch(base, {id: "evil", group_id: "g9", created_by: "x"}, ME, now).id, base.id, "only editable fields are applied");
  // rollback = put the snapshot back
  const lst = [base]; const snap = lst[0]; lst[0] = G.applyPatch(snap, {status: "done"}, ME, now); lst[0] = snap;
  eq(lst[0].status, "todo", "rollback restores the snapshot");
}

// ---- reconcile: a refresh from the server must not undo what is being saved right now ----
{
  const a = task({title: "A"}), b = task({title: "B"}), c = task({title: "C"});
  const local = [Object.assign({}, a, {status: "done"}), b, {id: "tmp-1", _tmp: true, title: "typing", list_id: "L1"}];
  const server = [Object.assign({}, a, {status: "todo"}), Object.assign({}, b, {title: "B (edited by Sam)"}), c];
  const out = G.reconcile(local, server, new Map([[a.id, 1], ["tmp-1", 1]]));
  eq(out.find(t => t.id === a.id).status, "done", "pending edit wins over the server copy");
  eq(out.find(t => t.id === b.id).title, "B (edited by Sam)", "other rows take the server's version");
  ok(out.some(t => t.id === c.id), "new rows from other members appear");
  ok(out.some(t => t.id === "tmp-1"), "an unsaved new task stays while pending");
  const out2 = G.reconcile(local, server, new Map());
  eq(out2.find(t => t.id === a.id).status, "todo", "nothing pending: server wins");
  ok(!out2.some(t => t.id === "tmp-1"), "an unsaved task that is no longer pending is dropped");
  ok(!G.reconcile([a], [], new Set()).length, "a task removed on the server disappears");
}

// ---- reordering ----
{
  const mk = (id, position, status) => task({id, position, status: status || "todo", list_id: "LM", created_at: "2026-10-01T10:00:00Z"});
  const l = [mk("a", 1), mk("b", 2), mk("c", 3, "done"), mk("d", 4), mk("e", 5, "done")];
  eq(G.move(l, "b", -1), {a: 2, b: 1}, "move up swaps with the neighbour");
  eq(G.move(l, "b", 1), {b: 4, d: 2}, "an open task skips over done ones, so the move is visible");
  eq(G.move(l, "a", -1), {}, "top stays put");
  eq(G.move(l, "e", 1), {}, "bottom stays put");
  eq(G.move(l, "e", -1), {c: 5, e: 3}, "done tasks move among themselves");
  const messy = [mk("p", 0), mk("q", 0), mk("r", 0)];
  const m = G.move(messy, "r", -1);
  ok(Object.keys(m).length >= 2 && new Set(Object.values(m)).size === Object.values(m).length, "tied positions are renumbered");
  eq(G.move(l, "zzz", 1), {}, "unknown id");
}

// ---- derive "mine" for the planner ----
{
  const lists = [{id: "L1", title: "BIOL 201 Poster", course_code: "BIOL 201", archived: false}, {id: "L2", title: "Old", course_code: "", archived: true}];
  const ts = [
    task({id: "m1", title: "Draft intro", assignee_id: ME, due_at: "2026-10-09", priority: "high", updated_by: SAM}),
    task({id: "m2", title: "No date", assignee_id: ME}),
    task({id: "m3", title: "Early", assignee_id: ME, due_at: "2026-10-04"}),
    task({id: "m4", title: "Finished", assignee_id: ME, status: "done"}),
    task({id: "m5", title: "Not mine", assignee_id: SAM, due_at: "2026-10-01"}),
    task({id: "m6", title: "On archived list", assignee_id: ME, list_id: "L2"}),
    task({id: "m7", title: "Deleted", assignee_id: ME, deleted: true}),
    task({id: "tmp-9", title: "Unsaved", assignee_id: ME, _tmp: true})
  ];
  const rows = G.deriveMine(ts, lists, "Bio Squad", "g1", ME);
  eq(rows.map(r => r.id), ["m3", "m1", "m2"], "only my open, live tasks on active lists, soonest first, undated last");
  const r = rows.find(x => x.id === "m1");
  eq([r.due, r.hours, r.badge, r.groupName, r.courseCode, r.gid, r.listId, r.priority, r.by], ["2026-10-09", 1, "Group: BIOL 201 Poster", "Bio Squad", "BIOL 201", "g1", "L1", "high", SAM], "row shape: due date, default 1h effort, badge");
  eq(rows.find(x => x.id === "m2").due, "", "no due date stays empty");
  // feeding the same rows twice never duplicates (they are derived, not copied)
  eq(G.deriveMine(ts, lists, "Bio Squad", "g1", ME).length, rows.length, "deriving again gives the same rows");
  // completing one removes it from the derived list
  const after = ts.map(t => t.id === "m1" ? G.applyPatch(t, {status: "done"}, ME, "2026-10-03T00:00:00Z") : t);
  ok(!G.deriveMine(after, lists, "Bio Squad", "g1", ME).some(x => x.id === "m1"), "completed tasks leave the planner list");
  // a reassigned task leaves mine
  ok(!G.deriveMine(ts.map(t => t.id === "m3" ? Object.assign({}, t, {assignee_id: JO}) : t), lists, "x", "g1", ME).some(x => x.id === "m3"), "reassigned tasks leave the planner list");
}

// ---- notices ----
{
  const prev = [task({id: "a", assignee_id: ME}), task({id: "b", assignee_id: null})];
  const next = [task({id: "a", assignee_id: ME}), task({id: "b", assignee_id: ME, updated_by: SAM}), task({id: "c", assignee_id: ME, updated_by: ME}), task({id: "d", assignee_id: ME, updated_by: JO}), task({id: "e", assignee_id: SAM, updated_by: JO})];
  eq(G.newlyAssigned(prev, next, ME, new Set(["d"])).map(t => t.id), ["b"], "newly assigned by someone else and not announced yet (own claims and seen ones are skipped)");
  eq(G.newlyAssigned(prev, [], ME, new Set()).length, 0, "nothing");
  const rows = [{due: "2026-10-02"}, {due: "2026-10-03"}, {due: "2026-10-04"}, {due: "2026-10-09"}, {due: "2026-10-10"}, {due: ""}];
  eq(G.weekDue(rows, T), {week: 3, late: 1, tomorrow: 1}, "this week = today through 6 days ahead; overdue counted apart");
  eq(G.weekDue([], T), {week: 0, late: 0, tomorrow: 0}, "empty week");
}

// ---- list selection ----
{
  const ls = [{id: "x", archived: true}, {id: "y", archived: false}, {id: "z", archived: false}];
  eq(G.nextListId(ls, "z", false), "z", "keeps the current list");
  eq(G.nextListId(ls, "x", false), "y", "an archived current list falls back to the first active one");
  eq(G.nextListId(ls, "x", true), "x", "archived list stays when archived lists are shown");
  eq(G.nextListId([], "x", false), "", "no lists");
}

console.log(`grouptasks.test.js: ${n} checks passed`);
