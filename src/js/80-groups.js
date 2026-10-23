/* ===== module: 80-groups.js ===== */
/* Studyboard 1.11 */
(() => {
  /* Connection */
  const stub = () => window.__sbGroupsStub || null;
  const cli = () => { const s = stub(); return s ? s.client : (sbActive() ? sb : null); };
  const me = () => { const s = stub(); return s ? s.user : sbUser; };
  const online = () => !!cli() && !!me();
  const myId = () => (me() || {}).id || "";

  function gErr(e){
    const m = String((e && (e.message || e.error_description || e.details)) || e || "");
    const code = String((e && e.code) || "");
    if (/fetch|network|Load failed|timed? ?out/i.test(m)) return new Error("Couldn't reach Studyboard. Check your internet connection and try again.");
    if (["42P01", "42883", "PGRST202", "PGRST205", "PGRST200"].includes(code) || /does not exist|Could not find the (function|table)|schema cache/i.test(m))
      return Object.assign(new Error(srvSetup("Study Groups", "groups.sql")), {setup: true});
    if (/Sign in first|JWT|not authenticated/i.test(m)) return new Error("Sign in to Studyboard first, then try again.");
    if (code === "42501" || /row-level security|permission denied/i.test(m)) return new Error("You don't have permission to do that in this group.");
    if (code === "PGRST116") return new Error("That item isn't there anymore. It may have been removed.");
    if (/group_items_kind_check/.test(m)) return Object.assign(new Error(srvSetup("Sharing this with the group", "groups.sql")), {setup: true});
    if (code === "23514" || /check constraint|too long/i.test(m)) return new Error("That's too long or empty. Shorten it and try again.");
    return new Error(m.replace(/^SB_[A-Z0-9_]+:\s*/, "").slice(0, 160) || "Something went wrong. Try again.");
  }
  const q = async p => { let r; try { r = await p; } catch(e) { throw gErr(e); } if (r && r.error) throw gErr(r.error); return r ? r.data : null; };
  const first = r => (Array.isArray(r) ? r[0] : r) || null;

  // The whole data layer
  const api = {
    profile: () => q(cli().from("study_profiles").select("display_name").eq("user_id", myId()).maybeSingle()),
    setProfile: name => q(cli().from("study_profiles").upsert({user_id: myId(), display_name: name}, {onConflict: "user_id"})),
    shareDeck: (deckId, name, data, count) => q(cli().rpc("share_deck", {p_deck_id: deckId, p_name: name, p_data: data, p_count: count})),
    getDeck: async code => first(await q(cli().rpc("get_shared_deck", {p_code: code}))),
    myShares: () => q(cli().from("shared_decks").select("code,deck_id,name,card_count,updated_at").eq("owner_id", myId()).order("updated_at", {ascending: false})),
    stopShare: code => q(cli().from("shared_decks").delete().eq("code", code).eq("owner_id", myId())),
    groups: () => q(cli().from("study_groups").select("*").order("created_at")),
    members: ids => q(cli().from("group_members").select("group_id,user_id,role,display_name,joined_at").in("group_id", ids).order("joined_at")),
    stamps: ids => q(cli().from("group_items").select("id,group_id,kind,user_id,ref_id,updated_at").in("group_id", ids)),
    items: gid => q(cli().from("group_items").select("*").eq("group_id", gid).order("created_at", {ascending: false})),
    messages: gid => q(cli().from("group_messages").select("*").eq("group_id", gid).order("created_at", {ascending: false}).limit(150)),
    group: gid => q(cli().from("study_groups").select("*").eq("id", gid).maybeSingle()),
    // A group's icon is one small shared item (a hidden "link" row titled __icon__)
    icons: ids => q(cli().from("group_items").select("id,group_id,data").eq("kind", "link").eq("title", "__icon__").in("group_id", ids)),
    // 1.12 extras (quiz scores, study sessions, weekly challenge, check-ins, reactions)
    scores: async gid => { try { return await q(cli().rpc("group_quiz_board", {p_group: gid})); } catch(e) { if (!e.setup) throw e; return q(cli().from("group_quiz_scores").select("*").eq("group_id", gid)); } },
    rsvps: gid => q(cli().from("group_rsvps").select("*").eq("group_id", gid)),
    stats: (gid, since) => q(cli().from("group_stats").select("*").eq("group_id", gid).gte("week", since)),
    checkins: (gid, since) => q(cli().from("group_checkins").select("*").eq("group_id", gid).gte("day", since)),
    reactions: gid => q(cli().from("group_reactions").select("message_id,user_id,kind").eq("group_id", gid).limit(3000)),
    // shown: "name" or "anon"; left out, a score already posted keeps its choice
    submitScore: async (item, right, total, shown) => {
      const a = {p_item: item, p_correct: right, p_total: total};
      if (!shown) return q(cli().rpc("submit_quiz_score", a));
      try { return await q(cli().rpc("submit_quiz_score", Object.assign({p_shown: shown}, a))); }
      catch(e) { if (e.setup && shown === "name") return q(cli().rpc("submit_quiz_score", a)); throw e.setup ? new Error("Anonymous scores need the latest groups.sql on the server. " + srvSetup("This", "groups.sql")) : e; }
    },
    scoreShown: (item, shown) => q(cli().rpc("set_quiz_score_shown", {p_item: item, p_shown: shown})),
    rsvp: (item, status) => q(cli().rpc("set_rsvp", {p_item: item, p_status: status})),
    report: (gid, week, focus, quizzes) => q(cli().rpc("group_report", {p_group: gid, p_week: week, p_focus: focus, p_quizzes: quizzes})),
    checkin: (gid, day, plan, done) => q(cli().rpc("group_checkin", {p_group: gid, p_day: day, p_plan: plan, p_done: done})),
    react: (msg, kind) => q(cli().rpc("toggle_reaction", {p_msg: msg, p_kind: kind})),
    pin: (msg, on) => q(cli().rpc("pin_message", {p_msg: msg, p_pin: on})),
    createGroup: (name, course) => q(cli().rpc("create_group", {p_name: name, p_course: course})),
    setGroupKind: (gid, kind, due) => q(cli().rpc("set_group_kind", {p_group: gid, p_kind: kind, p_due: due || null})),
    preview: async code => first(await q(cli().rpc("group_preview", {p_code: code}))),
    join: code => q(cli().rpc("join_group", {p_code: code})),
    newCode: gid => q(cli().rpc("new_group_code", {p_group: gid})),
    updateGroup: (gid, patch) => q(cli().from("study_groups").update(patch).eq("id", gid)),
    deleteGroup: gid => q(cli().from("study_groups").delete().eq("id", gid)),
    // A deleted group is kept for 30 days on the server (groups.sql)
    deletedGroups: () => q(cli().rpc("my_deleted_groups")),
    restoreGroup: gid => q(cli().rpc("restore_group", {p_group: gid})),
    removeMember: (gid, uidv) => q(cli().from("group_members").delete().eq("group_id", gid).eq("user_id", uidv)),
    addItems: rows => q(cli().from("group_items").insert(rows).select()),
    updateItem: (id, patch) => q(cli().from("group_items").update(patch).eq("id", id).select().single()),
    removeItem: id => q(cli().from("group_items").delete().eq("id", id)),
    post: (gid, body) => q(cli().from("group_messages").insert({group_id: gid, body}).select().single()),
    unpost: id => q(cli().from("group_messages").delete().eq("id", id)),
    // Safety (supabase-moderation.sql)
    fileReport: row => q(cli().from("group_reports").insert(row)),
    blocks: () => q(cli().from("group_blocks").select("blocked_id").eq("blocker_id", myId())),
    block: id => q(cli().from("group_blocks").insert({blocked_id: id})),
    unblock: id => q(cli().from("group_blocks").delete().eq("blocker_id", myId()).eq("blocked_id", id)),
    listen(gid, cb){
      const c = cli(); if (!c || typeof c.channel !== "function") return () => {};
      const ch = c.channel("sbg-" + gid + "-" + uid());
      ["group_items", "group_messages", "group_members"].forEach(t => {
        ch.on("postgres_changes", {event: "*", schema: "public", table: t, filter: "group_id=eq." + gid}, p => cb(t, p));
        ch.on("postgres_changes", {event: "DELETE", schema: "public", table: t}, p => cb(t, p, true));
      });
      ch.on("postgres_changes", {event: "*", schema: "public", table: "study_groups", filter: "id=eq." + gid}, p => cb("study_groups", p));
      try { ch.subscribe(); } catch(e) {}
      return () => { try { c.removeChannel(ch); } catch(e) {} };
    },
    ptLists: gid => q(cli().from("group_task_lists").select("*").eq("group_id", gid).order("created_at")),
    ptTasks: gid => q(cli().from("group_tasks").select("*").eq("group_id", gid).eq("deleted", false).order("position").limit(3000)),
    ptMine: () => q(cli().from("group_tasks").select("*").eq("assignee_id", myId()).eq("deleted", false).or("status.neq.done,completed_at.gte." + new Date(Date.now() - 14 * 864e5).toISOString()).limit(500)),
    ptListsIn: ids => q(cli().from("group_task_lists").select("id,group_id,title,course_code,archived,created_by").in("group_id", ids)),
    ptNewList: (gid, title, course) => q(cli().rpc("create_task_list", {p_group: gid, p_title: title, p_course: course})),
    ptUpdList: (id, patch) => q(cli().rpc("update_task_list", {p_list: id, p_patch: patch})),
    ptDelList: id => q(cli().rpc("delete_task_list", {p_list: id})),
    ptAdd: (list, title, who, due, notes, prio) => q(cli().rpc("add_group_task", {p_list: list, p_title: title, p_assignee: who, p_due: due, p_notes: notes, p_priority: prio})),
    ptUpd: (id, patch) => q(cli().rpc("update_group_task", {p_task: id, p_patch: patch})),
    ptMove: (id, dir) => q(cli().rpc("move_group_task", {p_task: id, p_dir: dir})),
    ptDel: id => q(cli().rpc("delete_group_task", {p_task: id})),
    // 1.15 contribution check-in
    peerMine: gid => q(cli().from("group_peer_ratings").select("to_user,score,note,updated_at").eq("group_id", gid).eq("from_user", myId())),
    peerSubmit: (gid, to, score, note) => q(cli().rpc("submit_peer", {p_group: gid, p_to: to, p_score: score, p_note: note})),
    peerSummary: gid => q(cli().rpc("peer_summary", {p_group: gid})),
    // 1.15 most missed (anonymous)
    reportMisses: (gid, rows) => q(cli().rpc("report_misses", {p_group: gid, p_rows: rows})),
    forgetMisses: gid => q(cli().rpc("forget_misses", {p_group: gid})),
    topMisses: gid => q(cli().rpc("top_misses", {p_group: gid, p_limit: 10})),
    // A third channel for the Project Task tables, opened only once they are known to exist
    listenTasks(gid, cb){
      const c = cli(); if (!c || typeof c.channel !== "function") return () => {};
      const ch = c.channel("sbt-" + gid + "-" + uid());
      ["group_task_lists", "group_tasks"].forEach(t => ch.on("postgres_changes", {event: "*", schema: "public", table: t, filter: "group_id=eq." + gid}, () => cb()));
      ch.on("postgres_changes", {event: "DELETE", schema: "public", table: "group_task_lists"}, () => cb());
      try { ch.subscribe(); } catch(e) {}
      return () => { try { c.removeChannel(ch); } catch(e) {} };
    },
    // A second channel for the 1.12 tables, only opened once they are known to exist
    listenExtras(gid, cb){
      const c = cli(); if (!c || typeof c.channel !== "function") return () => {};
      const ch = c.channel("sbx-" + gid + "-" + uid());
      ["group_quiz_scores", "group_rsvps", "group_stats", "group_checkins", "group_reactions"].forEach(t => {
        ch.on("postgres_changes", {event: "*", schema: "public", table: t, filter: "group_id=eq." + gid}, () => cb());
        ch.on("postgres_changes", {event: "DELETE", schema: "public", table: t}, () => cb());
      });
      try { ch.subscribe(); } catch(e) {}
      return () => { try { c.removeChannel(ch); } catch(e) {} };
    }
  };

  /* Project Tasks */
  /*GT-START*/
  const GTL = (() => {
    const LIM = {lists: 20, listsAll: 40, tasks: 200, title: 200, listTitle: 80, notes: 1000, course: 40};
    const dayNum = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || "")); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5 : NaN; };
    const isDay = s => Number.isFinite(dayNum(s));
    const diff = (a, b) => dayNum(b) - dayNum(a);
    const addDays = (s, n) => new Date((dayNum(s) + n) * 864e5).toISOString().slice(0, 10);
    const localISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const open = t => t && !t.deleted && t.status !== "done";
    function due(d, today){
      if (!isDay(d)) return {k: "none", n: null, soon: false, late: false};
      const n = diff(today, d);
      return {k: n < 0 ? "overdue" : n === 0 ? "today" : n === 1 ? "tomorrow" : n <= 3 ? "soon" : "later", n, soon: n >= 0 && n <= 3, late: n < 0};
    }
    function dueLabel(d, today, wd, md){
      const c = due(d, today);
      if (c.k === "none") return "No date";
      if (c.k === "overdue") return c.n === -1 ? "Due yesterday" : `${-c.n}d overdue`;
      if (c.k === "today") return "Due today";
      if (c.k === "tomorrow") return "Due tomorrow";
      return c.n <= 6 ? `Due ${wd(d)}` : `Due ${md(d)}`;
    }
    const byPos = (a, b) => (a.position - b.position) || String(a.created_at || "").localeCompare(String(b.created_at || "")) || String(a.id).localeCompare(String(b.id));
    const order = tasks => {
      const live = tasks.filter(t => !t.deleted);
      return live.filter(t => t.status !== "done").sort(byPos).concat(live.filter(t => t.status === "done").sort((a, b) => String(b.completed_at || "").localeCompare(String(a.completed_at || "")) || byPos(a, b)));
    };
    function filter(tasks, f, me, today){
      const live = tasks.filter(t => !t.deleted);
      const pick = f === "mine" ? t => t.assignee_id === me && t.status !== "done"
        : f === "unassigned" ? t => !t.assignee_id && t.status !== "done"
        : f === "overdue" ? t => t.status !== "done" && due(t.due_at, today).late
        : f === "done" ? t => t.status === "done"
        : () => true;
      return order(live.filter(pick));
    }
    const counts = (tasks, me, today) => ({all: tasks.filter(t => !t.deleted).length, mine: filter(tasks, "mine", me, today).length, unassigned: filter(tasks, "unassigned", me, today).length,
      overdue: filter(tasks, "overdue", me, today).length, done: filter(tasks, "done", me, today).length});
    function progress(tasks){
      const live = tasks.filter(t => !t.deleted), done = live.filter(t => t.status === "done").length;
      return {done, total: live.length, pct: live.length ? Math.round(done / live.length * 100) : 0};
    }
    function workload(tasks, members, today){
      const live = tasks.filter(t => !t.deleted), ids = new Set(members.map(m => m.user_id));
      const rows = members.map(m => {
        const mine = live.filter(t => t.assignee_id === m.user_id);
        return {id: m.user_id, name: m.display_name || "Member", open: mine.filter(t => t.status !== "done").length, done: mine.filter(t => t.status === "done").length,
          overdue: mine.filter(t => t.status !== "done" && due(t.due_at, today).late).length};
      }).sort((a, b) => (b.open - a.open) || a.name.localeCompare(b.name));
      const unassigned = live.filter(t => t.status !== "done" && (!t.assignee_id || !ids.has(t.assignee_id))).length;
      const hi = rows[0], lo = rows[rows.length - 1];
      const uneven = rows.length > 1 && hi.open - lo.open >= 3 ? {hi: hi.name, lo: lo.name, gap: hi.open - lo.open} : null;
      return {rows, unassigned, uneven};
    }
    const canReassign = (t, me, owner) => !t.assignee_id || t.assignee_id === me || !!owner;
    const canDeleteTask = (t, me, owner) => !!owner || (!!t.created_by && t.created_by === me);
    const canDeleteList = (l, me, owner) => !!owner || (!!l.created_by && l.created_by === me);
    const canAddTask = (tasks, listId) => tasks.filter(t => !t.deleted && t.list_id === listId).length < LIM.tasks;
    const canAddList = lists => lists.filter(l => !l.archived).length < LIM.lists && lists.length < LIM.listsAll;
    const clamp = (s, n) => String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n);
    function applyPatch(t, patch, me, nowIso){
      const n = Object.assign({}, t);
      ["title", "notes", "status", "assignee_id", "due_at", "priority", "reviewer_id"].forEach(k => { if (k in patch) n[k] = patch[k]; });
      if (n.status === "done" && t.status !== "done") { n.completed_at = nowIso; n.completed_by = me; }
      else if (n.status !== "done") { n.completed_at = null; n.completed_by = null; }
      n.updated_at = nowIso; n.updated_by = me;
      return n;
    }
    function reconcile(local, server, pending){
      const keep = new Map(local.filter(t => pending.has(t.id)).map(t => [t.id, t]));
      const out = server.map(t => keep.get(t.id) || t);
      local.forEach(t => { if (t._tmp && pending.has(t.id) && !out.some(x => x.id === t.id)) out.push(t); });
      return out;
    }
    function deriveMine(tasks, lists, groupName, gid, me, withDone){
      const L = new Map(lists.map(l => [l.id, l])), cut = Date.now() - 14 * 864e5;
      const recentDone = t => withDone && t && !t.deleted && t.status === "done" && Date.parse(t.completed_at) >= cut;
      return tasks.filter(t => (open(t) || recentDone(t)) && t.assignee_id === me && !t._tmp && L.has(t.list_id) && !L.get(t.list_id).archived).map(t => {
        const l = L.get(t.list_id);
        return {id: t.id, gid, listId: t.list_id, title: t.title, due: isDay(t.due_at) ? String(t.due_at).slice(0, 10) : "", status: t.status, hours: 1, priority: t.priority || "",
          courseCode: l.course_code || "", listTitle: l.title, groupName: groupName || "", badge: "Group: " + (l.title || groupName || "Study group"), notes: t.notes || "", by: t.updated_by || t.created_by || ""};
      }).sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999") || a.title.localeCompare(b.title));
    }
    function newlyAssigned(prev, next, me, seen){
      const had = new Set(prev.filter(t => t.assignee_id === me).map(t => t.id));
      return next.filter(t => open(t) && t.assignee_id === me && !had.has(t.id) && !seen.has(t.id) && t.updated_by && t.updated_by !== me && !t._tmp);
    }
    function weekDue(rows, today){
      let week = 0, late = 0, tomorrow = 0;
      rows.forEach(r => { const c = due(r.due, today); if (c.k === "overdue") late++; else if (c.k !== "none" && c.n <= 6) week++; if (c.k === "tomorrow") tomorrow++; });
      return {week, late, tomorrow};
    }
    function move(tasks, id, dir){
      const live = tasks.filter(t => !t.deleted).sort(byPos), me = live.find(t => t.id === id); if (!me) return {};
      const pos = new Map(live.map((t, i) => [t.id, i + 1]));
      const same = live.filter(t => (t.status === "done") === (me.status === "done")), i = same.findIndex(t => t.id === id), j = i + (dir < 0 ? -1 : 1);
      if (j < 0 || j >= same.length) return {};
      const a = same[i].id, b = same[j].id, pa = pos.get(a); pos.set(a, pos.get(b)); pos.set(b, pa);
      const out = {}; live.forEach(t => { if (t.position !== pos.get(t.id)) out[t.id] = pos.get(t.id); });
      return out;
    }
    const nextListId = (lists, cur, showArchived) => {
      const vis = lists.filter(l => showArchived || !l.archived);
      return vis.some(l => l.id === cur) ? cur : (vis[0] || {}).id || "";
    };
    return {LIM, dayNum, isDay, diff, addDays, localISO, due, dueLabel, order, filter, counts, progress, workload, canReassign, canDeleteTask, canDeleteList, canAddTask, canAddList,
      clamp, applyPatch, reconcile, move, deriveMine, newlyAssigned, weekDue, nextListId};
  })();
  /*GT-END*/

  /* Group kinds (1.15) */
  /*GK-START*/
  const GK = (() => {
    const TABS = {
      study: [["study", "Study"], ["sessions", "Sessions"], ["challenge", "Challenge"], ["boards", "Whiteboards"], ["chat", "Chat"], ["members", "Members"]],
      project: [["overview", "Overview"], ["tasks", "Tasks"], ["files", "Files"], ["meetings", "Meetings"], ["boards", "Whiteboards"], ["chat", "Chat"], ["members", "Members"]]
    };
    const ROLES = [["lead", "Lead"], ["researcher", "Researcher"], ["editor", "Editor"], ["presenter", "Presenter"], ["designer", "Designer"]];
    const LIM = {question: 300, detail: 1000, answer: 1000, linkTitle: 120, linkNote: 200, minutes: 2000, actions: 12, peerNote: 300};
    const kindOf = g => g && g.kind === "project" ? "project" : "study";
    const tabsFor = kind => TABS[kind === "project" ? "project" : "study"];
    const tabIds = kind => tabsFor(kind).map(t => t[0]);
    const roleLabel = key => (ROLES.find(r => r[0] === key) || [0, ""])[1];
    function countdown(due, today){
      if (!GTL.isDay(due)) return {k: "none", n: null, label: "No due date yet"};
      const n = GTL.diff(today, due);
      if (n < 0) return {k: "overdue", n, label: n === -1 ? "Due yesterday" : `${-n} days overdue`};
      if (n === 0) return {k: "today", n, label: "Due today"};
      return {k: "left", n, label: n === 1 ? "1 day left" : `${n} days left`};
    }
    const STEPS = [["Agree on the topic and who does what", 0.06], ["Research and collect sources", 0.28], ["Outline it and split the sections", 0.42], ["Write a first draft of every section", 0.66], ["Put it together and review it as a team", 0.84], ["Final polish and hand it in", 1]];
    function planFromDue(due, today){
      if (!GTL.isDay(due) || GTL.diff(today, due) < 0) return [];
      const span = GTL.diff(today, due);
      let last = today;
      return STEPS.map(([title, f]) => {
        let d = GTL.addDays(today, Math.round(span * f));
        if (GTL.diff(last, d) < 0) d = last;
        if (GTL.diff(d, due) < 0) d = due;
        last = d;
        return {title, due: d};
      });
    }
    function overview(tasks, members, today){
      const live = tasks.filter(t => !t.deleted), pr = GTL.progress(live), wl = GTL.workload(live, members, today);
      const behind = wl.rows.filter(r => r.overdue > 0).sort((a, b) => b.overdue - a.overdue || a.name.localeCompare(b.name));
      return {progress: pr, open: live.filter(t => t.status !== "done").length, behind, unassigned: wl.unassigned, uneven: wl.uneven};
    }
    const myTasks = (tasks, me) => tasks.filter(t => !t.deleted && t.status !== "done" && t.assignee_id === me)
      .sort((a, b) => (a.due_at || "9999").localeCompare(b.due_at || "9999") || String(a.title).localeCompare(String(b.title)));
    function board(tasks){
      const live = GTL.order(tasks.filter(t => !t.deleted));
      return {todo: live.filter(t => t.status === "todo"), doing: live.filter(t => t.status === "doing" || t.status === "review"), done: live.filter(t => t.status === "done")};
    }
    function battle(scores, members){
      const rows = members.map(m => {
        const mine = scores.filter(s => s.user_id === m.user_id && s.best_total > 0);
        const correct = mine.reduce((a, s) => a + s.best_correct, 0), total = mine.reduce((a, s) => a + s.best_total, 0);
        const pct = mine.length ? Math.round(mine.reduce((a, s) => a + s.best_correct / s.best_total, 0) / mine.length * 100) : 0;
        return {id: m.user_id, name: m.display_name || "Member", taken: mine.length, pct, correct, total};
      });
      return rows.sort((a, b) => (b.taken > 0) - (a.taken > 0) || b.pct - a.pct || b.taken - a.taken || a.name.localeCompare(b.name));
    }
    function answerText(q){
      if (!q) return "";
      if (q.type === "short") return String(q.answer || "");
      const o = Array.isArray(q.options) ? q.options : [], c = Array.isArray(q.correct) ? q.correct : [];
      return q.type === "order" ? c.map(i => o[i]).filter(Boolean).join(" \u2192 ") : c.map(i => o[i]).filter(Boolean).join("; ");
    }
    function topMisses(rows, items){
      const by = new Map(items.map(it => [it.id, it])), out = [];
      (rows || []).forEach(r => {
        const it = by.get(r.item_id), d = (it && it.data) || {}, id = String(r.mkey || "").slice(2); let text = "", answer = "", kind = "";
        if (it && it.kind === "deck" && /^c:/.test(r.mkey)) { const c = (Array.isArray(d.cards) ? d.cards : []).find(x => x.id === id); if (c) { kind = "card"; text = c.front; answer = c.back; } }
        else if (it && it.kind === "quiz" && /^q:/.test(r.mkey)) { const q = ((d.quiz && d.quiz.questions) || []).find(x => x.id === id); if (q) { kind = "question"; text = q.stem; answer = answerText(q); } }
        if (!kind || !String(text || "").trim()) return;
        out.push({kind, text: String(text).slice(0, 300), answer: String(answer || "").slice(0, 300), source: String(it.title || ""), itemId: it.id, key: r.mkey, missed: r.members_missed | 0, total: r.total_misses | 0, tried: r.members_tried | 0});
      });
      return out.sort((a, b) => b.missed - a.missed || b.total - a.total || a.text.localeCompare(b.text));
    }
    function answersOf(items, qid, bestId){
      return items.filter(x => x.kind === "answer" && x.ref_id === qid).sort((a, b) => (b.id === bestId) - (a.id === bestId) || String(a.created_at).localeCompare(String(b.created_at)));
    }
    const questionsOf = items => items.filter(x => x.kind === "qa").sort((a, b) => ((a.data && a.data.solved) ? 1 : 0) - ((b.data && b.data.solved) ? 1 : 0) || String(b.created_at).localeCompare(String(a.created_at)));
    function parseActions(text, members){
      return String(text || "").split(/\r?\n/).map(l => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim()).filter(Boolean).slice(0, LIM.actions).map(l => {
        const m = /^([^:]{1,40}):\s*(.+)$/.exec(l);
        if (m) {
          const nm = m[1].trim().toLowerCase(), who = members.find(x => { const d = String(x.display_name || "").toLowerCase(); return d && (d === nm || d.split(/\s+/)[0] === nm); });
          if (who) return {text: m[2].trim().slice(0, 200), who: who.user_id};
        }
        return {text: l.slice(0, 200), who: ""};
      });
    }
    const peerOpen = (due, today) => !GTL.isDay(due) || GTL.diff(today, due) <= 14;
    const peerLabels = [[1, "Hardly helped"], [2, "Did a little"], [3, "Did their share"], [4, "Did more than their share"], [5, "Carried a lot"]];
    const hostOf = url => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch(e) { return ""; } };
    return {TABS, ROLES, LIM, kindOf, tabsFor, tabIds, roleLabel, countdown, planFromDue, overview, myTasks, board, battle, answerText, topMisses, answersOf, questionsOf, parseActions, peerOpen, peerLabels, hostOf};
  })();
  /*GK-END*/

  /* Small helpers */
  const S = {groups: null, members: {}, items: {}, msgs: {}, busy: false, err: "", setup: false, loadingG: {}, errG: {},
    name: undefined, shares: null, sharesBusy: false, unsub: null, subGid: null, drafts: {}, changed: {}, pushQ: new Set(), pushT: 0, linkChecked: {}, linkNew: {},
    ext: {}, lb: {}, rep: {}, repT: 0, extT: 0, unsubX: null, subX: null, pick: "", blocked: new Set(), blocksFor: "",
    pt: {}, peer: {}, miss: {}, ptPend: new Map(), ptT: 0, unsubT: null, subT: null, mine: {}, mineFor: "", mineAt: 0, mineBusy: false, mineOff: false, tab: {}};
  const str = (x, n) => String(x == null ? "" : x).slice(0, n);
  const hashOf = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  const plural = (n, w, ws) => `${n} ${n === 1 ? w : (ws || w + "s")}`;
  const ts = x => new Date(x || 0).getTime() || 0;
  const initials = n => { const w = String(n || "?").trim().split(/\s+/).filter(Boolean); return ((w[0] || "?")[0] + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase(); };
  const hueOf = s => COLORS[parseInt(hashOf(String(s || "x")), 36) % COLORS.length];
  // My own picture is a headshot of the companion I have selected
  const faceCache = {};
  function faceOfMember(uid2){
    if (!uid2) return "";
    let id = "";
    for (const k in S.members) { const m = (S.members[k] || []).find(x => x.user_id === uid2 && x.face); if (m) { id = m.face; break; } }
    if (!id || !/^[a-z0-9-]{1,40}$/.test(id)) return "";
    if (faceCache[id] == null) {
      let h = ""; try { const C = window.SBCOMP; h = C && typeof C.head === "function" ? C.head(id) : ""; } catch(e) { h = ""; }
      faceCache[id] = typeof h === "string" && h && h.length < 60000 && !/<\s*script|\son\w+=/i.test(h) ? h.replace(/\bid="([^"]+)"/g, 'id="$1-m"').replace(/url\(#([^)]+)\)/g, "url(#$1-m)").replace(/href="#([^"]+)"/g, 'href="#$1-m"') : "";
    }
    return faceCache[id];
  }
  function myFace(){
    const C = window.SBCOMP; if (!C) return "";
    try {
      const h = typeof C.head === "function" ? C.head() : "";
      return typeof h === "string" && h && h.length < 60000 && !/<\s*script|\son\w+=/i.test(h) ? h : "";
    } catch(e) { return ""; }
  }
  // The group's icon
  const iconItem = g => (S.items[g.id] || []).find(x => x.kind === "link" && x.title === "__icon__" && x.data && STICKERS[x.data.icon]);
  const iconKey = g => { const it = iconItem(g); return it ? it.data.icon : (S.icons && S.icons[g.id] && STICKERS[S.icons[g.id].key] ? S.icons[g.id].key : ""); };
  async function setGroupIcon(g, key){
    const it = iconItem(g), known = S.icons && S.icons[g.id], id = it ? it.id : known ? known.id : "";
    if (!key) { if (id) { await api.removeItem(id); if (S.items[g.id]) S.items[g.id] = S.items[g.id].filter(x => x.id !== id); } if (S.icons) delete S.icons[g.id]; return; }
    if (id) { const row = await api.updateItem(id, {title: "__icon__", data: {v: 1, icon: key}}); if (it) Object.assign(it, row || {data: {v: 1, icon: key}}); }
    else { const rows = await api.addItems([{group_id: g.id, kind: "link", ref_id: "", title: "__icon__", data: {v: 1, icon: key}}]); if (rows && rows[0]) { addRows(g.id, rows); (S.icons = S.icons || {})[g.id] = {id: rows[0].id, key}; return; } }
    (S.icons = S.icons || {})[g.id] = {id: id || (S.icons[g.id] || {}).id, key};
  }
  const iconTile = g => { const k = iconKey(g); return k ? `<span class="grp-ic" aria-hidden="true">${stickerSvg(k)}</span>` : ""; };
  // The round icon on a group's card and header
  const ringIcon = g => { const k = iconKey(g); return k ? stickerSvg(k) : `<span class="g2-sym">${isProj(g) ? I_CUBE : ICON_GROUP}</span>`; };
  // Each member's colour in a group (picked when they join; Members tab to change)
  const MEMBER_COLORS = ["#E5484D", "#F76B15", "#E2A50B", "#30A46C", "#12A594", "#0090FF", "#3E63DD", "#8E4EC6", "#D6409F", "#6E5240"];
  // A member's colour
  const okColor = c => /^#[0-9A-F]{6}$/i.test(c || "");
  const memberHue = (gid, id, name) => {
    const ms = gid ? S.members[gid] || [] : [], m = id ? ms.find(x => x.user_id === id) : null;
    if (m && okColor(m.color)) return m.color;
    if (m) {
      const used = new Set(ms.filter(x => okColor(x.color)).map(x => String(x.color).toUpperCase())), left = MEMBER_COLORS.filter(c => !used.has(c));
      const order = ms.filter(x => !okColor(x.color)).slice().sort((a, b) => String(a.joined_at || "").localeCompare(String(b.joined_at || "")) || String(a.user_id).localeCompare(String(b.user_id)));
      const i = order.findIndex(x => x.user_id === id);
      if (left.length && i >= 0) return left[i % left.length];
    }
    return hueOf(id || name);
  };
  // A member's picture (their companion, or initials) in their colour
  const inkOn = c => { if (!okColor(c)) return "#fff"; const [r, g, b] = [1, 3, 5].map(i => parseInt(c.substr(i, 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#1F2430" : "#fff"; };
  const av = (name, id, gid) => { const f = id && id === myId() ? myFace() : faceOfMember(id), raw = memberHue(gid != null ? gid : (ui.tab === "groups" ? ui.grp : ""), id, name), c = esc(raw);
    return f ? `<span class="grp-av is-comp" style="--c:${c}" data-mc="${c}" aria-hidden="true">${f}</span>` : `<span class="grp-av" style="--c:${c};color:${inkOn(raw)}" data-mc="${c}" aria-hidden="true">${esc(initials(name))}</span>`; };
  // Rows that belong to one person learn that person's colour (--mc)
  function paintRows(root){
    (root || document).querySelectorAll("#grpDetail .grp-av[data-mc]").forEach(a => {
      const row = a.closest(".grp-msg, li"); if (!row || row.classList.contains("kb-card") || row.closest(".grp-avs, .kb-band, .pt-who, .grp-members, .grp-checks")) return;
      const avs = [...row.querySelectorAll(".grp-av[data-mc]")].filter(x => x.closest(".grp-msg, li") === row);
      if (new Set(avs.map(x => x.dataset.mc)).size !== 1) return;
      if (row.style.getPropertyValue("--mc") !== a.dataset.mc) row.style.setProperty("--mc", a.dataset.mc);
      row.classList.add("mc-row");
    });
    (root || document).querySelectorAll("#grpDetail li.grp-item:not(.mc-row)").forEach(li => {
      if (li.closest("#grpSessions")) return;
      const idEl = li.querySelector("[data-id]"), it = idEl && typeof itemOf === "function" ? itemOf(idEl.dataset.id) : null;
      if (!it || !it.user_id || !(S.members[it.group_id] || []).some(m => m.user_id === it.user_id)) return;
      li.style.setProperty("--mc", memberHue(it.group_id, it.user_id)); li.classList.add("mc-row");
    });
  }
  { let q = 0; new MutationObserver(() => { if (q || ui.tab !== "groups") return; q = requestAnimationFrame(() => { q = 0; paintRows(); }); }).observe(document.documentElement, {childList: true, subtree: true}); }
  const ago = (x, low) => {
    const t = ts(x); if (!t) return "";
    const s = (Date.now() - t) / 1000;
    if (s < 60) return low ? "just now" : "Just now"; if (s < 3600) return Math.floor(s / 60) + " min ago"; if (s < 86400) return Math.floor(s / 3600) + " h ago";
    const d = iso(new Date(t)); return d === addDays(todayISO(), -1) ? (low ? "yesterday" : "Yesterday") : (low ? "on " : "") + fmtShort(d);
  };
  const normCode = s => {
    s = String(s || "").trim();
    const m = s.match(/[?&](deck|group)=([A-Za-z0-9-]+)/);
    const kind = m ? m[1] : "";
    let x = (m ? m[2] : s).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!m && x.length !== 8) { const t = s.match(/(?:^|[^A-Za-z0-9])([A-Za-z0-9]{4}-?[A-Za-z0-9]{4})(?![A-Za-z0-9-])/); if (t) x = t[1].toUpperCase().replace(/[^A-Z0-9]/g, ""); }
    return {kind, code: x.length === 8 ? x.slice(0, 4) + "-" + x.slice(4) : ""};
  };
  const webBase = () => /^https?:$/.test(location.protocol) ? location.origin + location.pathname : ((state.settings || {}).webUrl || "");
  const linkFor = (kind, code) => { const b = webBase(); return b ? `${b}?${kind}=${encodeURIComponent(code)}` : ""; };
  // Remember the website address so links made in the desktop app point to it
  function rememberWebUrl(){
    if (!/^https:$/.test(location.protocol) || /^(localhost|127\.)/.test(location.hostname)) return;
    const w = location.origin + location.pathname;
    if ((state.settings || {}).webUrl !== w) { state.settings = Object.assign({}, state.settings, {webUrl: w}); saveSettings(); }
  }
  // One of your courses for a course code or name from someone else
  const NOT_CODE = /^(GRADE|GR|YEAR|YR|UNIT|WEEK|WK|CHAPTER|CH|LAB|ROOM|PAGE|PART|LESSON|TERM|SEM|CLASS|PERIOD|QUIZ|TEST|EXAM|MIDTERM|FINAL|LECTURE|LEC|MODULE|TOPIC|SECTION|SEC|GROUP|TEAM|DAY|SET|DECK|LEVEL|NOTE|NOTES|VERSION|STEP|ROUND|BOOK|VOL|NO|NUMBER|COVID)$/;
  const codeKey = s => {
    s = String(s || ""); let m;
    if ((m = s.match(/(?:^|[^0-9])([0-9]{2})[:. -]([0-9]{3})[:. -]([0-9]{3})(?![0-9])/))) return m[1] + m[2] + m[3];
    if ((m = s.match(/(?:^|[^A-Za-z])([A-Z]{2,8})-([A-Z]{2})\s*([0-9]{1,4}[A-Z]?)(?![A-Za-z0-9])/))) return (m[1] + m[2] + m[3]).toLowerCase();
    if ((m = s.match(/(?:^|[^A-Za-z])([A-Za-z]{2,8})[\s._-]*([0-9][A-Za-z][0-9]{2}|[0-9]{2,5}[A-Za-z]{0,2})/)) && (/^[0-9]{3}/.test(m[2]) || !NOT_CODE.test(m[1].toUpperCase()))) return (m[1] + m[2]).toLowerCase();
    if ((m = s.match(/(?:^|[^A-Za-z])([A-Za-z]{9,12})\s+([0-9]{4}[A-Za-z]?)(?![0-9])/))) return (m[1] + m[2]).toLowerCase();
    if ((m = s.match(/(?:^|[^A-Za-z0-9])([A-Z]{2,8})[\s._-]?([0-9][A-Z]?)(?![A-Za-z0-9])/)) && !NOT_CODE.test(m[1])) return (m[1] + m[2]).toLowerCase();
    if ((m = s.match(/(?:^|[^A-Za-z0-9])([A-Z])\s?([0-9]{3}[A-Z]?)(?![A-Za-z0-9])/))) return (m[1] + m[2]).toLowerCase();
    const h = s.match(/\b([a-z]{3})[\s-]?([1-4])([a-z][a-z0-9]?)\b/i); return h ? (h[1] + h[2] + h[3]).toLowerCase() : "";
  };
  const matchCourse = pc => {
    if (!pc) return "";
    const n = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
    const same = (a, b) => !!a && !!b && (n(a) === n(b) || (!!codeKey(a) && codeKey(a) === codeKey(b)));
    const c = coursesArr().find(c => (pc.code && same(c.code, pc.code)) || (pc.name && n(c.name) && n(c.name) === n(pc.name)) || (typeof pc === "string" && (same(c.code, pc) || (n(c.name) && n(c.name) === n(pc)))));
    return c ? c.id : "";
  };
  // Is a shared deadline (its payload's course) for this group's course
  const nkey = v => String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  function forGroupCourse(g, data, strict){
    const gc = String((g && g.course) || "").trim();
    if (!gc) return !strict;
    const c = data && data.course; if (!c) return false;
    const gk = codeKey(gc);
    return (!!gk && (codeKey(c.code) === gk || codeKey(c.name) === gk)) || (!!nkey(gc) && (nkey(c.code) === nkey(gc) || nkey(c.name) === nkey(gc)));
  }
  // A group's colour, on this device
  const colorSynced = {};
  hook("render", tab => {
    if (tab !== "groups" || !online() || !Array.isArray(S.groups)) return;
    S.groups.forEach(g => {
      if (!g || g.owner_id !== myId()) return;
      const cid = matchCourse(g.course), col = cid ? String(colorOf(cid)).toUpperCase() : "";
      if (!/^#[0-9A-F]{6}$/.test(col) || String(g.color || "").toUpperCase() === col || colorSynced[g.id] === col) return;
      colorSynced[g.id] = col;
      api.updateGroup(g.id, {color: col}).then(() => { g.color = col; }).catch(() => {});
    });
  });
  const grpColor = g => { const cid = matchCourse(g && g.course); return cid ? colorOf(cid) : g && /^#[0-9A-F]{6}$/i.test(g.color || "") ? g.color : hueOf(g && g.id); };
  async function copyText(text, label){
    try { await navigator.clipboard.writeText(text); toast(label || "Copied"); }
    catch(e) { toast("Couldn't copy. Select the text and copy it yourself."); }
  }
  async function sendText(title, text, url){
    if (navigator.share) { try { await navigator.share(url ? {title, text, url} : {title, text}); return; } catch(e) { if (e && e.name === "AbortError") return; } }
    copyText(url || text, "Copied");
  }
  const busyBtn = (b, on) => { if (b) { b.disabled = on; b.classList.toggle("busy", on); } };

  const ICON_GROUP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 19.5c0-3.2 2.7-5.5 6-5.5s6 2.3 6 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.1c2.6.2 4.5 2.2 4.5 4.9"/></svg>';
  const ICON_SHARE = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px;margin-right:4px"><circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1"/></svg>';

  /* Deck payloads */
  function cleanQuiz(qz){
    const o = {id: str(qz.id, 60) || uid(), title: str(qz.title, 200) || "Practice Quiz", style: str(qz.style, 500),
      questions: (qz.questions || []).map(x => { const c = clone(x); delete c.tries; delete c.miss; return c; })};
    if (qz.kind === "case") { o.kind = "case"; o.scenario = str(qz.scenario, 6000); }
    return o;
  }
  function deckPayload(d, withQ){
    const c = courseOf(d.courseId);
    const cards = d.cards.filter(x => String(x.front || "").trim() || String(x.back || "").trim()).map(x => ({id: x.id, front: x.front, back: x.back}));
    const quizzes = withQ ? (d.aiQuizzes || []).map(cleanQuiz) : [];
    const p = {v: 1, app: "studyboard", type: "deck", name: d.name, course: c ? {code: c.code || "", name: c.name || ""} : null, cards, quizzes};
    if (d.pubLook && d.pubLook.color && d.pubLook.icon) p.look = {color: d.pubLook.color, icon: d.pubLook.icon};
    p.hash = hashOf(JSON.stringify(p.look ? [p.name, cards, quizzes, p.look] : [p.name, cards, quizzes]));
    return p;
  }
  // Anything that comes from someone else
  function cleanPayload(p){
    if (!p || typeof p !== "object" || !Array.isArray(p.cards)) return null;
    const cards = p.cards.slice(0, 5000).map(c => c && typeof c === "object" ? {id: str(c.id, 60) || uid(), front: str(c.front, 5000), back: str(c.back, 5000)} : null).filter(c => c && (c.front.trim() || c.back.trim()));
    const quizzes = (Array.isArray(p.quizzes) ? p.quizzes : []).slice(0, 100).map(qz => {
      if (!qz || typeof qz !== "object") return null;
      const qs = aiCleanQuestions((Array.isArray(qz.questions) ? qz.questions : []).slice(0, 300).filter(x => x && typeof x === "object").map(x => Object.assign({}, x, {optionNotes: x.notes})));
      if (!qs.length) return null;
      const o = {id: str(qz.id, 60) || uid(), title: str(qz.title, 200) || "Practice Quiz", style: str(qz.style, 500), questions: qs};
      if (qz.kind === "case") { o.kind = "case"; o.scenario = str(qz.scenario, 6000); }
      return o;
    }).filter(Boolean);
    const course = p.course && typeof p.course === "object" ? {code: str(p.course.code, 40), name: str(p.course.name, 120)} : null;
    return {name: str(p.name, 120).trim() || "Shared Deck", course, cards, quizzes, sharedBy: str(p.sharedBy, 40), hash: str(p.hash, 40)};
  }
  // sh remembers the text as shared, so a later update can tell a card you edited
  const shOf = c => (c.front || "") + "\u0001" + (c.back || "");
  const localCard = c => ({id: uid(), sid: c.id, front: c.front, back: c.back, sh: shOf(c), box: 0, due: "", seen: 0, right: 0, wrong: 0});
  const localQuiz = qz => Object.assign(clone(qz), {id: uid(), sid: qz.id, sh: JSON.stringify(qz.questions || null), results: [], sources: ["Shared deck"], created: Date.now()});
  function addDeckCopy(p, meta, courseId, then, stay){
    const nd = normDeck({id: uid(), created: Date.now(), name: p.name, courseId: courseId || "", cards: p.cards.map(localCard), aiQuizzes: p.quizzes.map(localQuiz), sharedFrom: meta});
    if (!stay) { ui.tab = "flashcards"; ui.fc = null; ui.deckId = nd.id; window.scrollTo(0, 0); }
    saveDeck(nd, `Added ${p.name} to your Flashcards`);
    if (then) then(nd);
    return nd;
  }
  function mergeDeck(local, p, meta){
    const nd = clone(local);
    const bySid = new Map(nd.cards.filter(c => c.sid).map(c => [c.sid, c]));
    let added = 0, changed = 0, addedQ = 0;
    p.cards.forEach(c => { const x = bySid.get(c.id); if (!x) { nd.cards.push(localCard(c)); added++; } else if ((x.front !== c.front || x.back !== c.back) && x.sh === shOf(x)) { x.front = c.front; x.back = c.back; x.sh = shOf(c); changed++; } });
    p.quizzes.forEach(qz => {
      const i = (nd.aiQuizzes || []).findIndex(x => x.sid === qz.id), nq = localQuiz(qz);
      if (i >= 0) { const old = nd.aiQuizzes[i], shq = JSON.stringify(qz.questions || null); if (old.sh !== undefined && old.sh === JSON.stringify(old.questions || null)) { nq.id = old.id; nq.results = old.results || []; nq.sh = shq; nd.aiQuizzes[i] = nq; } } else { nd.aiQuizzes = (nd.aiQuizzes || []).concat(nq); addedQ++; }
    });
    nd.sharedFrom = Object.assign({}, nd.sharedFrom, meta);
    return {nd, added, changed, addedQ};
  }
  const mergeMsg = (name, r) => `Updated ${name}: ${[r.added && plural(r.added, "new card"), r.addedQ && plural(r.addedQ, "new quiz", "new quizzes"), r.changed && plural(r.changed, "changed card")].filter(Boolean).join(", ") || "nothing new"}. Your progress is kept.`;
  const copyOfItem = itemId => decksArr().find(d => d.sharedFrom && d.sharedFrom.i === itemId);
  const copyOfCode = code => decksArr().find(d => d.sharedFrom && d.sharedFrom.code === code);

  /* Task payloads (shared deadlines) */
  function taskPayload(t){
    const c = courseOf(t.courseId);
    const p = {v: 1, title: t.title, type: t.type, due: t.due || "", time: t.time || "", start: t.start || "", notes: str(t.notes, 4000), location: t.location || "", link: t.link || "", reading: t.reading || "",
      weight: isNum(t.weight) ? Number(t.weight) : null, hours: isNum(t.hours) ? Number(t.hours) : null, checklist: (t.checklist || []).map(i => str(i.text, 400)).filter(Boolean).slice(0, 50),
      course: c ? {code: c.code || "", name: c.name || ""} : null};
    p.hash = hashOf(JSON.stringify(p));
    return p;
  }
  function taskFields(p){
    p = p && typeof p === "object" ? p : {};
    return {title: str(p.title, 300).trim() || "Untitled", type: TYPES.includes(p.type) ? p.type : "Assignment", due: isDate(p.due) ? p.due : "", start: isDate(p.start) ? p.start : "",
      time: /^([01]\d|2[0-3]):[0-5]\d$/.test(p.time || "") ? p.time : "", notes: str(p.notes, 4000), location: str(p.location, 200), link: safeUrl(str(p.link, 500)) || "", reading: str(p.reading, 500),
      weight: isNum(p.weight) ? Number(p.weight) : null, hours: isNum(p.hours) && Number(p.hours) > 0 ? Number(p.hours) : null};
  }
  const copyOfTask = itemId => Object.values(state.tasks).find(t => t.groupRef && t.groupRef.i === itemId);
  function taskDiff(t, p){
    const f = taskFields(p), out = [];
    if (f.title !== t.title) out.push(`renamed to ${f.title}`);
    if (f.due !== (t.due || "")) out.push(f.due ? `due ${fmtShort(f.due)}` : "no due date");
    if (f.time !== (t.time || "")) out.push(f.time ? `time ${fmtTime(f.time)}` : "no time");
    if (f.type !== t.type) out.push(`now ${f.type}`);
    if (f.location !== (t.location || "")) out.push(f.location ? `at ${f.location}` : "no location");
    if (f.notes !== (t.notes || "")) out.push("notes changed");
    return out;
  }
  // Which of my tasks are shared to which group items, so edits I make update the group's copy
  const IDX = () => "sb:grpShared:" + myId();
  const readIdx = () => { try { return JSON.parse(localStorage.getItem(IDX()) || "{}") || {}; } catch(e) { return {}; } };
  const writeIdx = x => { try { localStorage.setItem(IDX(), JSON.stringify(x)); } catch(e) {} };
  function indexItems(gid, items){
    const idx = readIdx();
    Object.keys(idx).forEach(k => { idx[k] = idx[k].filter(r => r.g !== gid); if (!idx[k].length) delete idx[k]; });
    items.filter(it => it.kind === "task" && it.user_id === myId() && it.ref_id).forEach(it => { (idx[it.ref_id] = idx[it.ref_id] || []).push({g: gid, i: it.id, h: (it.data || {}).hash || ""}); });
    writeIdx(idx);
  }
  async function pushTasks(){
    const ids = [...S.pushQ]; S.pushQ.clear();
    if (!online()) return;
    const idx = readIdx(); let n = 0;
    for (const id of ids) {
      const refs = idx[id], t = state.tasks[id]; if (!refs || !t) continue;
      const p = taskPayload(t);
      for (const r of refs.slice()) {
        if (r.h === p.hash) continue;
        try {
          const row = await api.updateItem(r.i, {title: str(t.title, 300) || "Untitled", data: p});
          r.h = p.hash; n++;
          const list = S.items[r.g]; if (list && row) { const k = list.findIndex(x => x.id === row.id); if (k >= 0) list[k] = row; }
        } catch(e) { if (/isn't there/.test(e.message)) refs.splice(refs.indexOf(r), 1); }
      }
      if (!refs.length) delete idx[id];
    }
    writeIdx(idx);
    if (n && ui.tab === "groups" && ui.grp) patch(ui.grp);
  }

  /* Your name in groups */
  const NAMEK = () => "sb:grpName:" + myId();
  function guessName(){
    const u = me() || {}, md = u.user_metadata || {};
    const full = md.first_name || md.given_name || md.full_name || md.name || "";
    if (full) return String(full).trim().split(/\s+/)[0].slice(0, 40);
    const w = String(u.email || "").split("@")[0].split(/[._\-+0-9]+/).filter(Boolean)[0] || "";
    return w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : "";
  }
  async function ensureName(then){
    if (!S.name) { try { S.name = localStorage.getItem(NAMEK()) || S.name; } catch(e) {} }
    if (S.name) return then();
    try { const r = await api.profile(); S.name = (r && r.display_name) || null; }
    catch(e) { toast(e.message); return; }
    if (S.name) { try { localStorage.setItem(NAMEK(), S.name); } catch(e) {} return then(); }
    nameSheet(true, then);
  }
  function nameSheet(firstTime, then){
    openSheet(`<form class="sheet">${head(firstTime ? "What Should Classmates Call You?" : "Your Name in Groups")}
      <div class="sheet-body">
        <p style="margin:0">People in your study groups and anyone you share a deck with will see this name. Your first name is enough.</p>
        <label class="f"><span class="lh">Display Name ${REQ}</span><input type="text" name="name" required maxlength="40" autocomplete="given-name" value="${esc(S.name || guessName())}" autofocus placeholder="e.g. Connor"></label>
      </div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>${firstTime ? "Continue" : "Save Name"}</button></div>
    </form>`, fd => {
      const name = String(fd.get("name") || "").trim().replace(/\s+/g, " ").slice(0, 40); if (!name) return false;
      (async () => {
        try { await api.setProfile(name); S.name = name; try { localStorage.setItem(NAMEK(), name); } catch(e) {}
          (S.groups || []).forEach(g => (S.members[g.id] || []).forEach(m => { if (m.user_id === myId()) m.display_name = name; }));
          if (then) then(); else { toast(`Groups will see you as ${name}`); scheduleRender(); } }
        catch(e) { toast(e.message); }
      })();
    });
  }

  /* Loading group data */
  async function loadGroups(quiet){
    if (S.busy || !online()) return;
    S.busy = true; if (!quiet) { S.err = ""; }
    try {
      const gs = await api.groups() || [];
      const ids = gs.map(g => g.id);
      const ms = ids.length ? await api.members(ids) || [] : [];
      const members = {}; ids.forEach(id => { members[id] = []; }); ms.forEach(m => { (members[m.group_id] = members[m.group_id] || []).push(m); });
      try { const rows = ids.length ? await api.icons(ids) || [] : []; S.icons = {}; rows.forEach(x => { if (x.data && STICKERS[x.data.icon]) S.icons[x.group_id] = {id: x.id, key: x.data.icon}; }); } catch(e) {}
      S.groups = gs; S.members = members; S.err = ""; S.setup = false;
      if (S.name === undefined) { try { const r = await api.profile(); S.name = (r && r.display_name) || null; if (S.name) localStorage.setItem(NAMEK(), S.name); } catch(e) {} }
      if (ids.length) { try { markChanges(await api.stamps(ids) || []); } catch(e) {} }
      try { S.binned = await api.deletedGroups() || []; } catch(e) { S.binned = []; }
    } catch(e) { S.err = e.message; S.setup = !!e.setup; if (!S.groups) S.groups = null; }
    S.busy = false;
    if (ui.tab === "groups") render();
    updateNavBadge();
    reportStats();
  }
  // Count shared items that changed since you copied them, per group
  function markChanges(stamps){
    const ch = {};
    stamps.forEach(s => {
      const t = s.kind === "task" ? copyOfTask(s.id) : null, d = s.kind === "deck" || s.kind === "quiz" ? copyOfItem(s.id) : null;
      const ref = t ? t.groupRef : d ? d.sharedFrom : null;
      if (ref && s.user_id !== myId() && ts(s.updated_at) > ts(ref.v) + 1000) ch[s.group_id] = (ch[s.group_id] || 0) + 1;
    });
    S.changed = ch;
    return Object.values(ch).reduce((a, b) => a + b, 0);
  }
  async function loadGroup(gid){
    if (S.loadingG[gid] || !online()) return;
    S.loadingG[gid] = true;
    try {
      const [g, items, msgs, ms] = await Promise.all([api.group(gid), api.items(gid), api.messages(gid), api.members([gid]), loadBlocks()]);
      if (!g) { S.groups = (S.groups || []).filter(x => x.id !== gid); if (ui.grp === gid) { ui.grp = null; toast("You're not in that group anymore."); } unsubscribe(); }
      else {
        const k = (S.groups || []).findIndex(x => x.id === gid); if (k >= 0) S.groups[k] = g; else S.groups = (S.groups || []).concat(g);
        S.items[gid] = (items || []).filter(x => !S.blocked.has(x.user_id)); S.msgs[gid] = (msgs || []).filter(x => !S.blocked.has(x.user_id)); S.members[gid] = ms || [];
        indexItems(gid, S.items[gid]); delete S.errG[gid]; calSync(gid);
        const n = (S.items[gid] || []).filter(it => { const c = it.kind === "task" ? copyOfTask(it.id) : copyOfItem(it.id), ref = c && (c.groupRef || c.sharedFrom); return ref && it.user_id !== myId() && ts(it.updated_at) > ts(ref.v) + 1000; }).length;
        if (n) S.changed[gid] = n; else delete S.changed[gid];
        updateNavBadge();
      }
    } catch(e) { S.errG[gid] = e.message; }
    S.loadingG[gid] = false;
    if (ui.tab === "groups" && ui.grp === gid && $("#grpDetail") && S.items[gid]) patch(gid); else if (ui.tab === "groups") render();
    if (S.items[gid]) { loadExtras(gid); loadPT(gid); loadMisses(gid); }
  }
  let refreshT = 0;
  function subscribe(gid){
    if (S.subGid === gid) return;
    unsubscribe();
    S.subGid = gid;
    S.unsub = api.listen(gid, (table, p, anyDelete) => {
      if (anyDelete) {
        const old = (p && p.old) || {};
        const hit = table === "group_members" ? old.group_id === gid : (table === "group_items" ? S.items[gid] || [] : S.msgs[gid] || []).some(x => x.id === old.id);
        if (!hit) return;
      }
      clearTimeout(refreshT); refreshT = setTimeout(() => loadGroup(gid), 350);
    });
    if (extOf(gid)) subscribeExtras(gid);
    if (ptX(gid)) subscribePT(gid);
  }
  function unsubscribe(){ if (S.unsub) S.unsub(); S.unsub = null; S.subGid = null; if (S.unsubX) S.unsubX(); S.unsubX = null; S.subX = null; if (S.unsubT) S.unsubT(); S.unsubT = null; S.subT = null; }
  function subscribeExtras(gid){
    if (S.subX === gid || S.subGid !== gid) return;
    if (S.unsubX) S.unsubX();
    S.subX = gid;
    S.unsubX = api.listenExtras(gid, () => { clearTimeout(S.extT); S.extT = setTimeout(() => loadExtras(gid), 500); });
  }
  function updateNavBadge(){
    const b = $('nav.tabs [data-tab="groups"]'); if (!b) return;
    const n = Object.values(S.changed).reduce((a, x) => a + x, 0);
    let dot = $(".grp-dot", b);
    if (!n) { if (dot) dot.remove(); return; }
    if (!dot) { dot = document.createElement("span"); dot.className = "grp-dot"; b.appendChild(dot); }
    dot.textContent = n > 9 ? "9+" : String(n);
    b.setAttribute("aria-label", `Groups, ${n} update${n === 1 ? "" : "s"}`);
  }

  /* Pages */
  const groupOf = gid => (S.groups || []).find(g => g.id === gid);
  const isOwner = g => g && g.owner_id === myId();

  function offlineView(){
    const local = !sbConfig(), preview = inPreview();
    return `<div class="view-head"><h2>Groups</h2></div>
      <div class="empty grp-offline sb-es">${emptyArt()}<strong>${preview ? "Sharing Isn't Available Here" : "Study Better Together"}</strong>
        ${preview ? "Study groups and share links work on the Studyboard website and in the desktop app, where you sign in to your Studyboard account." : "Sharing needs a free Studyboard account. Sign in to make or join study groups and share decks."}
        ${preview ? "" : `<div class="row-actions" style="justify-content:center;margin-top:12px"><button class="btn primary" data-act="${local ? "sb-connect" : "sb-signin"}">${local && !SB_HOSTED ? "Set Up Sync" : "Sign In"}</button></div>`}</div>
      <section class="grp-file"><h3 class="fsec">Share Without an Account</h3>
        <p>No account? Share a deck as a file: open it, tap <b>Share</b>, then <b>Share as File</b>. Others use <b>Import a Deck File</b>.</p>
        <div class="row-actions"><button class="btn" data-act="grp-import">Import a Deck File</button><button class="btn" data-act="grp-to-decks">Go to Flashcards</button></div></section>`;
  }
  function errBox(msg, setup){
    return `<div class="grp-err" role="alert"><span>${esc(msg)}</span><button class="btn small" data-act="grp-retry">Try Again</button>${""}</div>`;
  }
  const isProj = g => !!g && g.kind === "project";
  function listView(){
    const gOrd = (() => { try { return JSON.parse(localStorage.getItem("studyboard:grpOrder") || "[]"); } catch (e) { return []; } })();
    const gs = S.groups ? S.groups.slice().sort((a, b) => { const ia = gOrd.indexOf(a.id), ib = gOrd.indexOf(b.id); return (ia < 0 ? 1e9 : ia) - (ib < 0 ? 1e9 : ib); }) : S.groups;
    const cards = (gs || []).map(g => {
      const ms = S.members[g.id] || [], ch = S.changed[g.id] || 0;
      const meta = [isProj(g) ? "Group Project" : "Study Group", plural(ms.length, "Member"), isOwner(g) ? "You Own It" : ""].filter(Boolean).join(" · ");
      const pill = isProj(g) && g.project_due ? `<span class="g2-pill due">Due ${esc(fmtShort(g.project_due))}</span>` : ch ? `<span class="g2-pill grp-upd">${plural(ch, "Update")} for Your Copies</span>` : "";
      return `<article class="grp-card g2-card k-${isProj(g) ? "project" : "study"}${iconKey(g) ? " has-ic" : ""}" data-sort-id="${esc(g.id)}" style="--c:${esc(grpColor(g))}">
        <button class="grp-main" data-act="grp-open" data-id="${esc(g.id)}">
          <span class="g2-band"><span class="g2-kick">${esc(g.course || (isProj(g) ? "Group Project" : "Study Group"))}</span></span>
          <span class="g2-ring" aria-hidden="true">${ringIcon(g)}</span>
          <span class="grp-name">${esc(g.name)}</span>
          <span class="g2-meta">${esc(meta)}</span>
          <span class="gc-foot"><span class="grp-avs">${ms.slice(0, 6).map(m => av(m.display_name, m.user_id)).join("")}${ms.length > 6 ? `<span class="grp-av more">+${ms.length - 6}</span>` : ""}</span>${pill}</span>
        </button></article>`;
    }).join("");
    const name = S.name || (() => { try { return localStorage.getItem(NAMEK()); } catch(e) { return ""; } })();
    return `<div class="view-head" data-grp-list><h2>Groups</h2></div>
      ${S.err ? errBox(S.err, S.setup) : ""}
      ${gs == null ? (S.err ? "" : `<p class="status-msg"><span class="ai-spin" aria-hidden="true"></span> Loading your groups…</p>`)
        : gs.length ? `<div class="grp-grid" data-sortable="groups">${cards}</div>`
        : `<div class="empty sb-es">${emptyArt()}<strong>No Groups Yet</strong>Start a study group or a group project, then send the invite code. Have a code? Enter it to join.<div class="row-actions" style="justify-content:center;margin-top:10px"><button class="btn primary" data-act="grp-new">New Group</button><button class="btn" data-act="grp-code">Enter a Code</button></div></div>`}
      ${(S.binned || []).length ? `<section class="grp-shares grp-binned"><h3 class="fsec">Recently Deleted Groups<span class="n">${S.binned.length}</span></h3>
        <p class="hint-line">Kept for 30 days with everything in them. Restoring brings a group back for all its members.</p>
        <ul class="grp-list">${S.binned.map(b => `<li class="grp-item"><div class="grp-item-main"><b>${esc(b.name)}</b><span class="mini">Deleted ${esc(fmtShort(String(b.deleted_at).slice(0, 10)))} · gone for good after ${esc(fmtShort(String(b.purge_at).slice(0, 10)))}</span></div>
          <div class="grp-item-btns"><button class="btn small" data-act="grp-restore" data-id="${esc(b.id)}">Restore</button></div></li>`).join("")}</ul></section>` : ""}
      <section class="grp-shares" id="grpShares">${sharesHtml()}</section>
      <p class="hint-line">${name ? `Classmates see you as <b>${esc(name)}</b>. <button class="link-btn" data-act="grp-name">Change</button>` : `You'll pick the name classmates see the first time you share or join.`}</p>`;
  }
  function sharesHtml(){
    const list = S.shares;
    if (!list || !list.length) return "";
    return `<h3 class="fsec">${ICON_SHARE}Your Shared Decks<span class="n">${list.length}</span></h3>
      <ul class="grp-list">${list.map(s => { const d = decksArr().find(x => x.id === s.deck_id);
        return `<li class="grp-item"><div class="grp-item-main"><b>${esc(s.name)}</b><span class="mini">Code <span class="grp-code-sm">${esc(s.code)}</span> · ${plural(s.card_count, "card")} · updated ${esc(ago(s.updated_at, 1))}</span></div>
          <div class="grp-item-btns"><button class="btn small" data-act="grp-share-copy" data-id="${esc(s.code)}">Copy Link</button>${d ? `<button class="btn small" data-act="grp-deck-share" data-id="${esc(d.id)}">Manage</button>` : ""}<button class="x-btn" data-act="grp-share-stop" data-id="${esc(s.code)}" aria-label="Stop sharing ${esc(s.name)}">${CLOSE}</button></div></li>`; }).join("")}</ul>`;
  }
  async function loadShares(){
    if (S.sharesBusy || !online()) return;
    S.sharesBusy = true;
    try { S.shares = await api.myShares() || []; } catch(e) { S.shares = S.shares || []; }
    S.sharesBusy = false;
    const el = $("#grpShares"); if (el) el.innerHTML = sharesHtml();
  }

  function detailView(gid){
    const g = groupOf(gid);
    if (!g) return `<button class="back" data-act="grp-back">${BACK}All Groups</button><p class="status-msg"><span class="ai-spin" aria-hidden="true"></span> Opening the group…</p>`;
    return `<div id="grpDetail" data-gid="${esc(gid)}" data-kind="${GK.kindOf(g)}" data-feat="${esc([...hiddenOf(g)].sort().join())}" style="--c:${esc(grpColor(g))}">
      <button class="back" data-act="grp-back">${BACK}All Groups</button>
      ${headHtml(g)}
      ${S.errG[gid] ? errBox(S.errG[gid]) : ""}
      ${setupNote(g)}
      ${panesHtml(g)}</div>`;
  }
  // Each kind of group has its own sections, one tab at a time
  const GFEAT = {
    study: [["decks", "Shared Decks"], ["quizzes", "Practice Quizzes"], ["qa", "Questions and Answers"], ["deadlines", "Deadlines"],
            ["sessions", "Sessions"], ["findtime", "Find a Time"], ["boards", "Whiteboards"], ["chat", "Chat"]],
    project: [["tasks", "Tasks"], ["files", "Files and Links"], ["meetings", "Meetings"], ["findtime", "Find a Time"], ["boards", "Whiteboards"], ["chat", "Chat"]]
  };
  // Pro group features, in the same list with a PRO badge
  const GXFEAT = {
    study: [["weak", "Most-Missed Cards"], ["challenge", "Weekly Challenge"], ["topics", "Split Exam Topics"], ["livequiz", "Live Quiz"]],
    project: [["split", "Split the Work"], ["rubric", "Rubric Checklist"], ["report", "Contribution Report"], ["uploads", "File Uploads"]]
  };
  const hiddenOf = g => new Set(g && Array.isArray(g.hidden_features) ? g.hidden_features.filter(x => typeof x === "string") : []);
  // Most-Missed Cards and Weekly Challenge moved to Pro
  const PROSEC = new Set(["weak", "challenge"]);
  const proSecOk = g => { try { return gxOn(g); } catch (e) { return true; } };
  const featOn = (g, k) => !hiddenOf(g).has(k) && (!PROSEC.has(k) || proSecOk(g));
  // Whiteboards tab
  const wbPaneHtml = g => fire("grp-boards", g).filter(Boolean).join("") || `<section class="card grp-sec"><h3 class="fsec">Whiteboards</h3><p class="empty mini">Shared whiteboards show up here.</p></section>`;
  function panesHtml(g){
    const P = (k, html) => `<div class="grp-pane" data-pane="${k}" id="grpPane-${k}" role="tabpanel" aria-labelledby="grpTab-${k}"${paneOn(g, k)}>${html}</div>`, on = k => featOn(g, k);
    const owner = isOwner(g), none = `<p class="empty mini grp-feat-none">${owner ? "Every feature here is turned off. Turn them on in Edit Group, under Features." : "Nothing is turned on here yet."}</p>`;
    if (isProj(g)) return P("overview", overviewHtml(g)) + (on("tasks") ? P("tasks", ptHtml(g)) : "") + (on("files") ? P("files", linksHtml(g)) : "") + (on("meetings") ? P("meetings", sessionsHtml(g) + minutesHtml(g)) : "") + (on("boards") ? P("boards", wbPaneHtml(g)) : "") + (on("chat") ? P("chat", boardHtml(g)) : "") + P("members", membersHtml(g));
    const study = (on("decks") ? decksHtml(g) : "") + (on("quizzes") ? quizzesHtml(g) : "") + (on("weak") ? weakHtml(g) : "") + (on("qa") ? qaHtml(g) : "") + (on("deadlines") ? tasksHtml(g) : "") + ptHtml(g);
    return P("study", ["decks", "quizzes", "weak", "qa", "deadlines"].some(on) ? study : study + none) + (on("sessions") ? P("sessions", sessionsHtml(g)) : "") + (on("challenge") ? P("challenge", checkinHtml(g) + challengeHtml(g) + battleHtml(g)) : "") + (on("boards") ? P("boards", wbPaneHtml(g)) : "") + (on("chat") ? P("chat", boardHtml(g)) : "") + P("members", membersHtml(g));
  }
  const tabsOf = g => GK.tabsFor(GK.kindOf(g)).filter(([k], i) => i === 0 || k === "members" || featOn(g, k));
  const curTab = g => tabsOf(g).some(x => x[0] === S.tab[g.id]) ? S.tab[g.id] : tabsOf(g)[0][0];
  const paneOn = (g, k) => curTab(g) === k ? "" : " hidden";
  const tabsHtml = g => `<div class="grp-tabs" role="tablist" aria-label="Group sections">${tabsOf(g).map(([k, l]) => { const on = curTab(g) === k; return `<button type="button" role="tab" id="grpTab-${k}" class="${on ? "on" : ""}" aria-selected="${on}" aria-controls="grpPane-${k}" tabindex="${on ? 0 : -1}" data-act="grp-tab" data-t="${k}">${l}</button>`; }).join("")}</div>`;
  // A redraw keeps keyboard focus on the section tabs
  let tabFocus = false;
  document.addEventListener("focusin", e => { tabFocus = !!(e.target.closest && e.target.closest("#grpDetail .grp-tabs [role=tab]")); });
  const keepTabFocus = () => { if (!tabFocus || (document.activeElement && document.activeElement !== document.body)) return; const b = $('#grpDetail .grp-tabs [aria-selected="true"]'); if (b) b.focus(); };
  function showTab(g, t){
    if (!g || !tabsOf(g).some(x => x[0] === t)) return false;
    S.tab[g.id] = t;
    $$("#grpDetail .grp-pane").forEach(p => { p.hidden = p.dataset.pane !== t; });
    $$("#grpDetail .grp-tabs [role=tab]").forEach(b => { const on = b.dataset.t === t; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; });
    refreshFab(); return true;
  }
  const BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>';
  function headHtml(g){
    const ms = S.members[g.id] || [], its = S.items[g.id] || [], proj = isProj(g), n = k => its.filter(x => x.kind === k && (k !== "task" || forGroupCourse(g, x.data))).length;
    const bits = [plural(ms.length, "Member")].concat(proj ? (GTL.isDay(g.project_due) ? ["Due " + fmtShort(g.project_due)] : [])
      : [[n("deck"), "Deck", "Decks"], [n("quiz"), "Quiz", "Quizzes"], [n("qa"), "Question", "Questions"], [n("task"), "Deadline", "Deadlines"]].filter(x => x[0]).map(x => plural(x[0], x[1], x[2])));
    return `<div class="deck-head grp-head g2-head k-${proj ? "project" : "study"}${iconKey(g) ? " has-ic" : ""}" id="grpHead" style="--c:${esc(grpColor(g))}">
      <div class="g2-band"><span class="g2-kick">${g.course ? esc(g.course) + " · " : ""}${proj ? "Group Project" : "Study Group"}</span>
        <div class="row-actions">${proj || !featOn(g, "sessions") ? "" : `<button class="btn g2-session" data-act="room-start">Start a Session</button>`}<button class="btn primary" data-act="grp-invite" data-id="${esc(g.id)}">${proj ? "Invite Teammates" : "Invite Classmates"}</button>${isOwner(g) ? `<button class="btn" data-act="grp-edit" data-id="${esc(g.id)}" aria-label="${proj ? "Edit project" : "Edit group"}">Edit</button>` : `<button class="btn" data-act="grp-leave" data-id="${esc(g.id)}" aria-label="Leave group">Leave</button>`}</div></div>
      <div class="g2-low"><span class="g2-ring" aria-hidden="true">${ringIcon(g)}</span>
        <div class="g2-txt"><h2>${esc(g.name)}</h2>
          <div class="g2-meta">${g.course ? `<span class="g2-code">${esc(g.course)}</span>` : ""}<span class="grp-avs">${ms.slice(0, 8).map(m => av(m.display_name, m.user_id)).join("")}${ms.length > 8 ? `<span class="grp-av more">+${ms.length - 8}</span>` : ""}</span><span>${esc(bits.join(" · "))}</span></div>
          ${nextUpHtml(g)}</div></div>
      ${tabsHtml(g)}
    </div>`;
  }
  const loadingLine = gid => S.items[gid] ? "" : `<p class="status-msg"><span class="ai-spin" aria-hidden="true"></span> Loading…</p>`;
  function decksHtml(g){
    const its = (S.items[g.id] || []).filter(x => x.kind === "deck"), owner = isOwner(g);
    const rows = its.map(it => {
      const p = it.data || {}, mine = it.user_id === myId(), copy = mine ? null : copyOfItem(it.id);
      const nc = Array.isArray(p.cards) ? p.cards.length : 0, nq = Array.isArray(p.quizzes) ? p.quizzes.length : 0;
      const src = mine ? state.decks[it.ref_id] : null, stale = src && deckPayload(src, nq > 0).hash !== p.hash;
      const upd = copy && ts(it.updated_at) > ts(copy.sharedFrom.v) + 1000;
      const btns = mine
        ? `${stale ? `<button class="btn small primary" data-act="grp-item-push" data-id="${esc(it.id)}">Update</button>` : ""}<button class="btn small" data-act="grp-item-view" data-id="${esc(it.id)}">View</button>`
        : copy ? `${upd ? `<button class="btn small primary" data-act="grp-item-update" data-id="${esc(it.id)}">Get Update</button>` : ""}<button class="btn small" data-act="grp-item-open" data-id="${esc(it.id)}">Open</button>`
        : `<button class="btn small primary" data-act="grp-item-study" data-id="${esc(it.id)}">Study Now</button><button class="btn small" data-act="grp-item-add" data-id="${esc(it.id)}">Add Copy</button>`;
      const mtBtn = window.SBMATCH && window.SBMATCH.usable(p.cards) >= 3 ? `<button class="btn small" data-act="grp-match" data-id="${esc(it.id)}" aria-label="Match: ${esc(it.title)}">Match</button>` : "";
      return `<li class="grp-item${upd ? " is-upd" : ""}"><button class="grp-item-main" data-act="grp-item-view" data-id="${esc(it.id)}"><b>${esc(it.title)}</b>
          <span class="mini">${plural(nc, "card")}${nq ? `, ${plural(nq, "practice quiz", "practice quizzes")}` : ""} · ${mine ? "Shared by you" : "Shared by " + esc(it.author_name || "a member")}${copy && !upd ? " · In your Flashcards" : ""}</span>
          ${upd ? `<span class="grp-chg">Updated ${esc(ago(it.updated_at, 1))}. Get the new cards and keep your progress.</span>` : stale ? `<span class="grp-chg">You changed this deck. Update the group's copy?</span>` : ""}</button>
        <div class="grp-item-btns">${btns}${mtBtn}${mine ? "" : repBtn(it)}${mine || owner ? `<button class="x-btn" data-act="grp-item-del" data-id="${esc(it.id)}" aria-label="Remove ${esc(it.title)} from the group">${CLOSE}</button>` : ""}</div></li>`;
    }).join("");
    return `<section class="grp-sec" id="grpDecks"><h3 class="fsec">${FC_ICON}Shared Decks<span class="n">${its.length}</span><span class="spacer"></span><button class="btn small" data-act="grp-share-deck" data-id="${esc(g.id)}">Share a Deck</button></h3>
      ${loadingLine(g.id) || (its.length ? `<ul class="grp-list">${rows}</ul>` : `<p class="grp-none">No decks yet. Share one of yours so everyone can study it.</p>`)}</section>`;
  }
  function tasksHtml(g){
    const today = todayISO(), owner = isOwner(g);
    const its = (S.items[g.id] || []).filter(x => x.kind === "task" && forGroupCourse(g, x.data)).map(it => ({it, f: taskFields(it.data)}))
      .sort((a, b) => ((a.f.due && a.f.due < today) - (b.f.due && b.f.due < today)) || (a.f.due || "9999").localeCompare(b.f.due || "9999") || (a.f.time || "").localeCompare(b.f.time || ""));
    const rows = its.map(({it, f}) => {
      const p = it.data || {}, mine = it.user_id === myId(), copy = mine ? null : copyOfTask(it.id), past = f.due && f.due < today;
      const upd = copy && ts(it.updated_at) > ts(copy.groupRef.v) + 1000, diff = upd ? taskDiff(copy, p) : [];
      const d = f.due ? parse(f.due) : null;
      const cl = p.course && (p.course.code || p.course.name);
      return `<li class="grp-item grp-task${past ? " is-past" : ""}${upd ? " is-upd" : ""}">
        <span class="grp-date" style="--c:${esc(matchCourse(p.course) ? colorOf(matchCourse(p.course)) : "var(--muted)")}">${d ? `<small>${esc(d.toLocaleDateString(undefined, {month: "short"}))}</small><b>${d.getDate()}</b>` : `<small>No</small><b>–</b>`}</span>
        <div class="grp-item-main"><b>${esc(f.title)}</b>
          <span class="mini">${[cl && esc(cl), esc(f.type), f.time && esc(fmtTime(f.time)), d && esc(d.toLocaleDateString(undefined, {weekday: "short"})), mine ? "Shared by you" : "Shared by " + esc(it.author_name || "a member")].filter(Boolean).join(" · ")}${copy && !upd ? " · On your board" : ""}</span>
          ${upd ? `<span class="grp-chg">Changed ${esc(ago(it.updated_at, 1))}${diff.length ? ": " + esc(diff.join(", ")) : ""}</span>` : ""}</div>
        <div class="grp-item-btns">${mine ? "" : copy ? (upd ? `<button class="btn small primary" data-act="grp-task-update" data-id="${esc(it.id)}">Update My Copy</button>` : `<button class="btn small" data-act="grp-task-open" data-id="${esc(it.id)}">Open</button>`) : `<button class="btn small primary" data-act="grp-task-add" data-id="${esc(it.id)}">Add to My Board</button>`}${mine ? "" : repBtn(it)}${mine || owner ? `<button class="x-btn" data-act="grp-item-del" data-id="${esc(it.id)}" aria-label="Remove ${esc(f.title)} from the group">${CLOSE}</button>` : ""}</div></li>`;
    }).join("");
    const nPast = its.filter(x => x.f.due && x.f.due < today).length;
    return `<section class="grp-sec" id="grpTasks"><h3 class="fsec"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v3M16 3v3"/></svg>Shared Deadlines<span class="n">${its.length - nPast}${nPast ? ` upcoming, ${nPast} past` : ""}</span><span class="spacer"></span><button class="btn small" data-act="grp-share-tasks" data-id="${esc(g.id)}">Share Deadlines</button></h3>
      ${loadingLine(g.id) || (its.length ? `<ul class="grp-list">${rows}</ul>` : `<p class="grp-none">No deadlines yet. Share a course's upcoming tasks so nobody misses one.</p>`)}</section>`;
  }
  /* 1.12: message reactions, pins, check-ins, challenge, quizzes and study sessions */
  const REACTS = [["like", "\u{1F44D}", "Like"], ["love", "\u2764\uFE0F", "Love"], ["laugh", "\u{1F602}", "Funny"], ["party", "\u{1F389}", "Celebrate"], ["fire", "\u{1F525}", "Fire"], ["think", "\u{1F914}", "Hmm"]];
  const gi = d => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I_PIN = gi('<path d="M9 4h6l-1 6 3 3H7l3-3z"/><path d="M12 13v7"/>');
  const I_QUIZ = gi('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 114 2c-.9.6-1.6 1.1-1.6 2.1M12 16.8v.1"/>');
  const I_CAL = gi('<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v3M16 3v3M8 14l2.5 2.5L16 12"/>');
  const I_TROPHY = gi('<path d="M8 4h8v5a4 4 0 01-8 0zM8 6H4.5c0 3 1.5 4.5 3.5 5M16 6h3.5c0 3-1.5 4.5-3.5 5M12 13v4M8.5 20h7M10 17h4"/>');
  const I_CHECK = gi('<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.7 2.7L16 9.5"/>');
  const wkStart = t => { const d = t || todayISO(); return addDays(d, -((parse(d).getDay() + 6) % 7)); };
  const extOf = gid => { const x = S.ext[gid]; return x && x.ok ? x : null; };
  const mName = (gid, id) => { const m = (S.members[gid] || []).find(x => x.user_id === id); return m ? m.display_name || "Member" : "Member"; };
  const gPct = (c, t) => t ? Math.round(c / t * 100) : 0;
  const gMins = n => n >= 60 ? `${Math.floor(n / 60)}h${n % 60 ? " " + (n % 60) + "m" : ""}` : `${n}m`;
  const gWhen = x => { const d = new Date(x); return isNaN(d) ? "" : d.toLocaleString(undefined, {weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"}); };
  const relDays = n => n <= 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`;
  const canPin = (g, m) => isOwner(g) || m.user_id === myId();

  // Your own totals for this week, from this device's data
  function myWeek(){
    const wk = wkStart(); let focus = 0, quizzes = 0;
    try { focus = SBSTATS.focusMinutes(wk, todayISO()); } catch(e) {}
    const t0 = parse(wk).getTime();
    decksArr().forEach(d => {
      (d.aiQuizzes || []).forEach(qz => (qz.results || []).forEach(r => { if (r && r.at >= t0) quizzes++; }));
      (d.quizzes || []).forEach(r => { if (r && !r.ai && r.at >= t0) quizzes++; });
    });
    return {wk, focus: Math.max(0, Math.round(focus)), quizzes};
  }
  // Tell every group your totals for the week
  function reportStats(){
    if (!online() || !S.groups || !S.groups.length) return;
    const w = myWeek(), key = `${w.wk}|${w.focus}|${w.quizzes}`;
    S.groups.forEach(g => {
      const ext = S.ext[g.id];
      if ((ext && !ext.ok) || S.rep[g.id] === key) return;
      S.rep[g.id] = key;
      api.report(g.id, w.wk, w.focus, w.quizzes).then(() => {
        const x = extOf(g.id); if (!x) return;
        const r = x.stats.find(s => s.user_id === myId() && s.week === w.wk);
        if (r) { r.focus_min = Math.max(r.focus_min, w.focus); r.quizzes = Math.max(r.quizzes, w.quizzes); } else x.stats.push({group_id: g.id, user_id: myId(), week: w.wk, focus_min: w.focus, quizzes: w.quizzes});
        if (ui.tab === "groups" && ui.grp === g.id) patch(g.id);
      }).catch(e => { if (e.setup) S.ext[g.id] = Object.assign(S.ext[g.id] || {}, {ok: false, setup: true}); else delete S.rep[g.id]; });
    });
  }
  const reportSoon = () => { clearTimeout(S.repT); S.repT = setTimeout(reportStats, 2500); };
  async function loadExtras(gid){
    if (!online() || (S.ext[gid] && S.ext[gid].busy)) return;
    const prev = S.ext[gid]; S.ext[gid] = prev && prev.ok ? Object.assign(prev, {busy: true}) : {ok: false, busy: true};
    try {
      const [scores, rsvps, stats, checkins, reactions] = await Promise.all([api.scores(gid), api.rsvps(gid), api.stats(gid, addDays(wkStart(), -7)), api.checkins(gid, addDays(todayISO(), -60)), api.reactions(gid)]);
      S.ext[gid] = {ok: true, scores: scores || [], rsvps: rsvps || [], stats: stats || [], checkins: checkins || [], reactions: reactions || []};
      if (ui.grp === gid) subscribeExtras(gid);
    } catch(e) { S.ext[gid] = {ok: false, setup: !!e.setup}; }
    if (S.ext[gid].ok) reportStats();
    if (ui.tab === "groups" && ui.grp === gid && $("#grpDetail")) patch(gid);
  }
  // Owners see a note until the newer groups.sql has been run
  function setupNote(g){
    const x = S.ext[g.id];
    if (!x || x.ok || !x.setup || !isOwner(g)) return `<div id="grpSetup"></div>`;
    return `<div class="grp-note" id="grpSetup">The weekly challenge, check-ins, study sessions, reactions and pins need the latest <b>groups.sql</b>. ${esc(srvSetup("This", "groups.sql"))}</div>`;
  }

  /* Streaks and badges */
  function streakOf(ext, uid2){
    const days = new Set(ext.checkins.filter(c => c.user_id === uid2).map(c => c.day));
    let d = todayISO(); if (!days.has(d)) d = addDays(d, -1);
    let n = 0; while (days.has(d)) { n++; d = addDays(d, -1); }
    return n;
  }
  function weekVal(ext, gid, uid2, week, field){
    const r = ext.stats.find(s => s.user_id === uid2 && s.week === week);
    let v = r ? Number(r[field]) || 0 : 0;
    if (uid2 === myId() && week === wkStart()) { const w = myWeek(); v = Math.max(v, field === "quizzes" ? w.quizzes : w.focus); }
    return v;
  }
  function badgesFor(g, uid2){
    const ext = extOf(g.id); if (!ext) return [];
    const out = [], st = streakOf(ext, uid2), its = S.items[g.id] || [];
    if (st >= 7) out.push(["streak", "7-Day Streak", "Checked in 7 days in a row"]); else if (st >= 3) out.push(["streak", "3-Day Streak", "Checked in 3 days in a row"]);
    const goal = Number(g.weekly_goal) || 0;
    if (goal && weekVal(ext, g.id, uid2, wkStart(), "focus_min") >= goal) out.push(["goal", "Goal Met", `Reached the weekly goal of ${gMins(goal)}`]);
    const last = ext.stats.filter(s => s.week === addDays(wkStart(), -7) && s.focus_min > 0).sort((a, b) => b.focus_min - a.focus_min)[0];
    if (last && last.user_id === uid2) out.push(["champ", "Last Week's Champ", `Most focus time last week (${gMins(last.focus_min)})`]);
    if (ext.scores.some(s => s.user_id === uid2 && s.best_total >= 5 && gPct(s.best_correct, s.best_total) >= 90)) out.push(["quiz", "Quiz Whiz", "Scored 90% or more on a shared quiz"]);
    return out;
  }

  /* Exam countdown and next study session in the group header */
  function nextUpHtml(g){
    const its = S.items[g.id] || [], today = todayISO(), chips = [];
    const ex = its.filter(x => x.kind === "task" && forGroupCourse(g, x.data, true)).map(x => ({it: x, f: taskFields(x.data)})).filter(x => MILESTONE(x.f.type) && x.f.due && x.f.due >= today)
      .sort((a, b) => a.f.due.localeCompare(b.f.due) || (a.f.time || "").localeCompare(b.f.time || ""))[0];
    if (ex) { const n = dayDiff(today, ex.f.due); chips.push(`<span class="grp-chip${n <= 3 ? " soon" : ""}"><small>Next ${esc(ex.f.type.toLowerCase())}</small><b>${esc(ex.f.title)}</b><em>${n <= 0 ? "Today" : n === 1 ? "Tomorrow" : `${n} days away`} · ${esc(fmtShort(ex.f.due))}</em></span>`); }
    const ev = its.filter(x => x.kind === "event" && x.data && ts(x.data.start) > Date.now() - 36e5).sort((a, b) => ts(a.data.start) - ts(b.data.start))[0];
    if (ev) chips.push(`<span class="grp-chip"><small>${isProj(g) ? "Next meeting" : "Next study session"}</small><b>${esc(ev.title)}</b><em>${esc(gWhen(ev.data.start))}</em></span>`);
    return chips.length ? `<div class="grp-chips">${chips.join("")}</div>` : "";
  }

  /* Weekly challenge */
  function challengeHtml(g){
    const ext = extOf(g.id); if (!ext) return `<div id="grpChallenge"></div>`;
    const wk = wkStart(), last = addDays(wk, -7), mode = S.lb[g.id] || "focus", field = mode === "quiz" ? "quizzes" : "focus_min";
    const ms = S.members[g.id] || [], goal = Number(g.weekly_goal) || 0;
    const rows = ms.map(m => ({m, v: weekVal(ext, g.id, m.user_id, wk, field), f: weekVal(ext, g.id, m.user_id, wk, "focus_min")}))
      .sort((a, b) => b.v - a.v || String(a.m.display_name).localeCompare(String(b.m.display_name)));
    const max = Math.max(1, ...rows.map(r => r.v)), total = rows.reduce((a, r) => a + r.f, 0), need = goal * ms.length;
    const champ = ext.stats.filter(s => s.week === last && s.focus_min > 0).sort((a, b) => b.focus_min - a.focus_min)[0];
    const mine = rows.find(r => r.m.user_id === myId());
    const dl = Math.max(0, dayDiff(todayISO(), addDays(wk, 7)));
    return `<section class="grp-sec" id="grpChallenge"><h3 class="fsec">${I_TROPHY}Weekly Challenge<span class="n">resets in ${dl} day${dl === 1 ? "" : "s"}</span></h3>
      <div class="grp-card2">
        ${goal ? `<div class="grp-goal"><div class="grp-goal-top"><b>Group goal</b><span class="mini">${gMins(total)} of ${gMins(need)} (${gMins(goal)} each)</span></div><div class="score-bar"><i style="width:${Math.min(100, gPct(total, need))}%"></i></div>${total >= need ? `<span class="grp-chg">Goal reached. Nice teamwork.</span>` : mine && mine.f >= goal ? `<span class="grp-chg">You've hit your ${gMins(goal)}. Help the others get there.</span>` : mine ? `<span class="mini">You need ${gMins(Math.max(0, goal - mine.f))} more for your share.</span>` : ""}</div>` : ""}
        <div class="grp-seg" role="group" aria-label="Rank by"><button type="button" class="${mode === "focus" ? "on" : ""}" data-act="grp-lb" data-m="focus" aria-pressed="${mode === "focus"}">Focus Time</button><button type="button" class="${mode === "quiz" ? "on" : ""}" data-act="grp-lb" data-m="quiz" aria-pressed="${mode === "quiz"}">Quizzes Taken</button></div>
        <ol class="grp-lb">${rows.map((r, i) => `<li class="${r.m.user_id === myId() ? "me" : ""}"><span class="rk${i === 0 && r.v > 0 ? " top" : ""}">${i + 1}</span>${av(r.m.display_name, r.m.user_id)}<span class="nm">${esc(r.m.display_name || "Member")}${r.m.user_id === myId() ? ` <span class="mini">(You)</span>` : ""}</span><span class="bar" aria-hidden="true"><i style="width:${Math.round(r.v / max * 100)}%"></i></span><b>${mode === "quiz" ? r.v : gMins(r.v)}</b></li>`).join("")}</ol>
        ${champ ? `<p class="mini grp-champ">Last week's champion: <b>${esc(mName(g.id, champ.user_id))}</b> with ${gMins(champ.focus_min)} of focus time.</p>` : `<p class="mini grp-champ">Focus sessions and quizzes you finish count automatically. Resets every Monday.</p>`}
      </div></section>`;
  }

  /* Daily check-in */
  function checkinHtml(g){
    const ext = extOf(g.id); if (!ext) return `<div id="grpCheckin"></div>`;
    const today = todayISO(), ms = S.members[g.id] || [], mine = ext.checkins.find(c => c.user_id === myId() && c.day === today);
    const todays = ext.checkins.filter(c => c.day === today).sort((a, b) => ts(a.updated_at) - ts(b.updated_at));
    const st = streakOf(ext, myId());
    return `<section class="grp-sec" id="grpCheckin"><h3 class="fsec">${I_CHECK}Daily Check-in<span class="n">${todays.length} of ${ms.length} today</span></h3>
      <form class="grp-check" id="grpCheck" data-gid="${esc(g.id)}"><input type="text" name="plan" maxlength="140" value="${esc(mine ? mine.plan : "")}" placeholder="What are you studying today?" aria-label="What are you studying today?" autocomplete="off"><button type="submit" class="btn primary small">${mine ? "Update" : "Check In"}</button>${mine ? `<button type="button" class="btn small" data-act="grp-check-done">${mine.done ? "Undo Done" : "Mark Done"}</button>` : ""}</form>
      ${st ? `<p class="mini grp-streak">Your streak: <b>${st} day${st === 1 ? "" : "s"}</b> in a row${mine ? "" : ". Check in today to keep it going"}.</p>` : `<p class="mini grp-streak">Check in on 3 days in a row for a streak badge.</p>`}
      ${todays.length ? `<ul class="grp-checks">${todays.map(c => `<li class="${c.done ? "done" : ""}">${av(mName(g.id, c.user_id), c.user_id)}<span class="nm"><b>${esc(c.user_id === myId() ? "You" : mName(g.id, c.user_id))}</b><span class="mini">${esc(c.plan || "Checked in")}</span></span>${c.done ? `<span class="pill ok">Done</span>` : ""}</li>`).join("")}</ul>` : `<p class="grp-none">Nobody has checked in yet today. Be the first and set the pace.</p>`}</section>`;
  }

  /* Quizzes */
  function quizPayload(qz, courseId){
    const c = courseOf(courseId), p = {v: 1, type: "quiz", quiz: cleanQuiz(qz), course: c ? {code: c.code || "", name: c.name || ""} : null};
    p.hash = hashOf(JSON.stringify(p.quiz));
    return p;
  }
  function cleanQuizPayload(p){
    if (!p || typeof p !== "object" || !p.quiz) return null;
    const cp = cleanPayload({name: "", cards: [], quizzes: [p.quiz], course: p.course});
    return cp && cp.quizzes[0] ? {quiz: cp.quizzes[0], course: cp.course} : null;
  }
  const quizSource = it => { const [did, qid] = String(it.ref_id || "").split(":"), d = state.decks[did], qz = d && (d.aiQuizzes || []).find(x => x.id === qid); return qz ? {d, qz} : null; };
  const scoresOf = (gid, itemId) => { const x = extOf(gid); return x ? x.scores.filter(s => s.item_id === itemId) : []; };
  function quizzesHtml(g){
    const its = (S.items[g.id] || []).filter(x => x.kind === "quiz"), owner = isOwner(g), ext = extOf(g.id);
    const rows = its.map(it => {
      const p = it.data || {}, nq = p.quiz && Array.isArray(p.quiz.questions) ? p.quiz.questions.length : 0, mine = it.user_id === myId();
      const sc = scoresOf(g.id, it.id), my = sc.find(s => s.user_id === myId());
      const src = mine ? quizSource(it) : null, stale = src && quizPayload(src.qz, src.d.courseId).hash !== p.hash;
      const copy = mine ? null : copyOfItem(it.id), upd = copy && ts(it.updated_at) > ts(copy.sharedFrom.v) + 1000;
      const top = sc.slice().sort((a, b) => gPct(b.best_correct, b.best_total) - gPct(a.best_correct, a.best_total))[0];
      return `<li class="grp-item${upd ? " is-upd" : ""}"><button class="grp-item-main" data-act="grp-quiz-scores" data-id="${esc(it.id)}"><b>${esc(it.title)}</b>
          <span class="mini">${plural(nq, "question")} · ${mine ? "Shared by you" : "Shared by " + esc(it.author_name || "a member")}${ext ? ` · ${sc.length ? plural(sc.length, "member") + " took it" : "No scores yet"}` : ""}${my ? ` · Your best ${gPct(my.best_correct, my.best_total)}%` : ""}</span>
          ${upd ? `<span class="grp-chg">Updated ${esc(ago(it.updated_at, 1))}. Taking it uses the new questions.</span>` : stale ? `<span class="grp-chg">You changed this quiz. Update the group's copy?</span>` : top && sc.length > 1 ? `<span class="grp-chg">Top score: ${esc(top.user_id ? mName(g.id, top.user_id) : "Anonymous")}, ${gPct(top.best_correct, top.best_total)}%</span>` : ""}</button>
        <div class="grp-item-btns">${stale ? `<button class="btn small primary" data-act="grp-quiz-push" data-id="${esc(it.id)}">Update</button>` : ""}<button class="btn small${stale ? "" : " primary"}" data-act="grp-quiz-take" data-id="${esc(it.id)}">${my ? "Retake" : "Take Quiz"}</button>${ext ? `<button class="btn small" data-act="grp-quiz-scores" data-id="${esc(it.id)}">Scores</button>` : ""}${mine ? "" : repBtn(it)}${mine || owner ? `<button class="x-btn" data-act="grp-item-del" data-id="${esc(it.id)}" aria-label="Remove ${esc(it.title)} from the group">${CLOSE}</button>` : ""}</div></li>`;
    }).join("");
    return `<section class="grp-sec" id="grpQuizzes"><h3 class="fsec">${I_QUIZ}Shared Quizzes<span class="n">${its.length}</span><span class="spacer"></span><button class="btn small" data-act="grp-share-quiz" data-id="${esc(g.id)}">Share a Quiz</button></h3>
      ${loadingLine(g.id) || (its.length ? `<ul class="grp-list">${rows}</ul>` : `<p class="grp-none">No quizzes yet. Share a practice quiz so everyone can test themselves and compare scores.</p>`)}</section>`;
  }
  function shareQuizSheet(g, pre){
    const list = [];
    decksArr().forEach(d => (d.aiQuizzes || []).forEach(qz => { if (qz.questions && qz.questions.length) list.push({d, qz}); }));
    if (!list.length) { toast("You have no quizzes yet. Open a flashcard deck and tap Make a Quiz."); return; }
    const mineIn = new Map((S.items[g.id] || []).filter(x => x.kind === "quiz" && x.user_id === myId()).map(x => [x.ref_id, x]));
    openSheet(`<form class="sheet">${head("Share a Quiz")}<div class="sheet-body">
      <p style="margin:0">Members take it right in their own app, and everyone's best score shows on the quiz. They get your questions, not your results.</p>
      <fieldset><legend>Quizzes</legend><div class="check-list grp-pick">${list.map(({d, qz}, i) => `<label class="mi-check"><input type="checkbox" name="q" value="${esc(d.id + ":" + qz.id)}" ${(pre ? d.id + ":" + qz.id === pre : i === 0) ? "checked" : ""}> <span><b>${esc(qz.title || "Practice Quiz")}</b> <span class="mini">${esc(d.name)} · ${plural(qz.questions.length, "question")}${mineIn.has(d.id + ":" + qz.id) ? " · already shared, sharing again updates it" : ""}</span></span></label>`).join("")}</div></fieldset></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit id="grpQGo">Share With ${esc(g.name.length > 22 ? "Group" : g.name)}</button></div></form>`, fd => {
      const picks = fd.getAll("q").map(v => { const [did, qid] = String(v).split(":"), d = state.decks[did], qz = d && (d.aiQuizzes || []).find(x => x.id === qid); return qz ? {d, qz, ref: v} : null; }).filter(Boolean);
      if (!picks.length) { toast("Tick the quizzes you want to share"); return false; }
      const b = $("#grpQGo"); busyBtn(b, true);
      ensureName(async () => {
        try {
          const add = [];
          for (const {d, qz, ref} of picks) {
            const p = quizPayload(qz, d.courseId), title = str(qz.title, 300) || "Practice Quiz", ex = mineIn.get(ref);
            if (ex) await api.updateItem(ex.id, {title, data: p}); else add.push({group_id: g.id, kind: "quiz", ref_id: ref, title, data: p});
          }
          if (add.length) await api.addItems(add);
          if (dlg.open) dlg.close(); toast(`Shared ${plural(picks.length, "quiz", "quizzes")} with ${g.name}`); loadGroup(g.id);
        } catch(e) { busyBtn(b, false); toast(e.message); }
      });
      return false;
    });
  }
  // Take a group quiz
  function takeQuiz(it){
    const cq = cleanQuizPayload(it.data); if (!cq) { toast("That quiz couldn't be read."); return; }
    const g = groupOf(it.group_id), src = it.user_id === myId() ? quizSource(it) : null;
    if (dlg.open) dlg.close();
    if (src) { startAiQuiz(src.d.id, src.qz.id); return; }
    const meta = {g: it.group_id, i: it.id, v: it.updated_at, by: it.author_name, n: g ? g.name : "", q: 1}, run = nd => { if (nd && nd.aiQuizzes[0]) startAiQuiz(nd.id, nd.aiQuizzes[0].id); };
    const ex = copyOfItem(it.id);
    if (!ex) { addDeckCopy({name: str(it.title, 120) || "Group Quiz", cards: [], quizzes: [cq.quiz]}, meta, matchCourse(cq.course) || matchCourse(g && g.course), run, true); return; }
    const cur = ex.aiQuizzes[0];
    if (!cur || ts(it.updated_at) > ts(ex.sharedFrom.v) + 1000) {
      const nd = clone(ex), nq = localQuiz(cq.quiz);
      if (cur) { nq.id = cur.id; nq.results = cur.results || []; }
      nd.aiQuizzes = [nq]; nd.sharedFrom = Object.assign({}, ex.sharedFrom, meta);
      saveDeck(nd, null);
      if (S.changed[it.group_id]) { S.changed[it.group_id]--; if (S.changed[it.group_id] <= 0) delete S.changed[it.group_id]; updateNavBadge(); }
      run(state.decks[nd.id] || nd); return;
    }
    run(ex);
  }
  // Your choice for a shared quiz's score, kept on this device
  const gqKey = itemId => "studyboard:gqshare:" + myId() + ":" + itemId;
  const gqPref = itemId => { try { return JSON.parse(localStorage.getItem(gqKey(itemId)) || "null"); } catch(e) { return null; } };
  const gqSetPref = (itemId, v) => { try { if (v) localStorage.setItem(gqKey(itemId), JSON.stringify(v)); else localStorage.removeItem(gqKey(itemId)); } catch(e) {} };
  const gqKeep = (itemId, right, total) => { const p = gqPref(itemId), better = !p || !p.t || right * p.t > p.c * total; gqSetPref(itemId, {shown: "private", c: better ? right : p.c, t: better ? total : p.t}); };
  // Ask how a finished group quiz's score is shared
  function shareScoreSheet(itemId, right, total, gid){
    const it = itemOf(itemId), g = groupOf(gid);
    openSheet(`<div class="sheet">${head("Share Your Score?")}<div class="sheet-body">
      <p style="margin:0">You got <b>${right}/${total}</b> (${gPct(right, total)}%)${it ? ` on ${esc(it.title)}` : ""}. How should ${g ? esc(g.name) : "the group"} see it?</p>
      <div class="menu-list">
        <button type="button" data-gq="name"><span>Share With My Name<span class="sub">Members see your name and score on the scoreboard</span></span></button>
        <button type="button" data-gq="anon"><span>Share Anonymously<span class="sub">Counts toward the class average. Nobody in the group, the owner included, sees it's yours</span></span></button>
        <button type="button" data-gq="private"><span>Keep It Private<span class="sub">Only you see it. You can still share it later from Scores</span></span></button>
      </div>
      <p class="mini" style="margin:0">Retakes use the same choice. Change it or remove your score any time from Scores.</p></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Decide Later</button></div></div>`);
    dlg.querySelectorAll("[data-gq]").forEach(b => b.addEventListener("click", () => { const v = b.dataset.gq; dlg.close(); postScore(itemId, right, total, gid, v); }));
  }
  async function postScore(itemId, right, total, gid, shown){
    if (shown === "private") { gqKeep(itemId, right, total); toast("Kept private. Only you can see this score."); return; }
    try {
      await api.submitScore(itemId, right, total, shown);
      gqSetPref(itemId, null);
      const g = groupOf(gid);
      toast(`Score ${shown === "anon" ? "shared anonymously" : "posted"}${g ? (shown === "anon" ? " with " : " to ") + g.name : ""}: ${right}/${total}`);
      if (gid && S.ext[gid] && S.ext[gid].ok) loadExtras(gid);
    } catch(e) { toast(e.message); }
  }
  function scoresSheet(it){
    const g = groupOf(it.group_id), ext = extOf(it.group_id), sc = scoresOf(it.group_id, it.id), ms = S.members[it.group_id] || [];
    const named = ms.map(m => ({m, s: sc.find(x => x.user_id && x.user_id === m.user_id)}));
    const anon = sc.filter(x => !x.user_id).map(s => ({m: null, s}));
    const rows = named.concat(anon)
      .sort((a, b) => (b.s ? gPct(b.s.best_correct, b.s.best_total) : -1) - (a.s ? gPct(a.s.best_correct, a.s.best_total) : -1) || String(a.m ? a.m.display_name : "~").localeCompare(String(b.m ? b.m.display_name : "~")));
    const avg = sc.length ? Math.round(sc.reduce((a, s) => a + gPct(s.best_correct, s.best_total), 0) / sc.length) : 0;
    const my = sc.find(s => s.user_id === myId()), kept = !my && gqPref(it.id), nAnon = anon.length + (my && my.shown === "anon" ? 1 : 0);
    const li = (r, i) => {
      if (!r.m) return `<li class="anon"><span class="rk${i === 0 ? " top" : ""}">${i + 1}</span><span class="grp-av" aria-hidden="true">?</span><span class="nm">Anonymous</span><b>${r.s.best_correct}/${r.s.best_total}<span class="mini"> ${gPct(r.s.best_correct, r.s.best_total)}%</span></b></li>`;
      const me = r.m.user_id === myId();
      return `<li class="${me ? "me" : ""}${r.s ? "" : " none"}"><span class="rk${i === 0 && r.s ? " top" : ""}">${r.s ? i + 1 : "–"}</span>${av(r.m.display_name, r.m.user_id)}<span class="nm">${esc(r.m.display_name || "Member")}${me ? ` <span class="mini">(You${r.s && r.s.shown === "anon" ? ", anonymous to others" : ""})</span>` : ""}${r.s ? `<span class="mini">${r.s.attempts ? plural(r.s.attempts, "attempt") : ""}${r.s.attempts > 1 ? `, latest ${gPct(r.s.last_correct, r.s.last_total)}%` : ""}</span>` : `<span class="mini">${me && kept ? `Kept private: ${kept.c}/${kept.t}` : "No score shared"}</span>`}</span>${r.s ? `<b>${r.s.best_correct}/${r.s.best_total}<span class="mini"> ${gPct(r.s.best_correct, r.s.best_total)}%</span></b>` : ""}</li>`;
    };
    const btn = (v, label) => `<button type="button" class="btn small" data-act="grp-score-shown" data-id="${esc(it.id)}" data-v="${v}">${label}</button>`;
    const mine = !ext ? "" : my
      ? `<div class="grp-myscore"><span class="mini">Your score is shared ${my.shown === "anon" ? "anonymously" : "with your name"}.</span>${my.shown === "anon" ? btn("name", "Show My Name") : btn("anon", "Make Anonymous")}${btn("none", "Remove My Score")}</div>`
      : kept && kept.t ? `<div class="grp-myscore"><span class="mini">Your score is private.</span>${btn("name", "Share With My Name")}${btn("anon", "Share Anonymously")}</div>` : "";
    openSheet(`<div class="sheet">${head(it.title)}<div class="sheet-body">
      ${ext ? `<p style="margin:0">${sc.length ? `${plural(sc.length, "member")} shared a score${nAnon ? ` (${nAnon} anonymously)` : ""}. Class average (best scores): <b>${avg}%</b>.` : "Nobody has shared a score yet. Be the first."}</p>
      <ol class="grp-lb scores">${rows.map(li).join("")}</ol>${mine}`
      : `<p style="margin:0">Scores need the latest groups.sql. ${esc(srvSetup("This", "groups.sql"))}</p>`}</div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Close</button><button type="button" class="btn primary" data-act="grp-quiz-take" data-id="${esc(it.id)}">${my || kept ? "Retake Quiz" : "Take Quiz"}</button></div></div>`);
  }
  async function setScoreShown(itemId, v, sure){
    const it = itemOf(itemId); if (!it) return;
    const gid = it.group_id, my = scoresOf(gid, itemId).find(s => s.user_id === myId()), kept = gqPref(itemId);
    if (my && v === "none" && !sure) { confirmSheet("Remove your score?", "It comes off this quiz's scoreboard and the class average. Your own results stay in your Flashcards.", "Remove", () => setScoreShown(itemId, v, true)); return; }
    try {
      if (my) {
        await api.scoreShown(itemId, v);
        if (v === "none") gqKeep(itemId, my.best_correct, my.best_total);
        toast(v === "none" ? "Your score was removed from the group." : v === "anon" ? "Your score is now anonymous." : "Your score now shows your name.");
      } else if (kept && kept.t && v !== "none") { await api.submitScore(itemId, kept.c, kept.t, v); gqSetPref(itemId, null); toast(v === "anon" ? "Score shared anonymously." : "Score shared."); }
      else return;
      await loadExtras(gid);
      const fresh = itemOf(itemId); if (fresh) scoresSheet(fresh);
    } catch(e) { toast(e.message); }
  }

  /* Study sessions */
  function sessionsHtml(g){
    const ext = extOf(g.id); if (!ext) return `<div id="grpSessions"></div>`;
    const now = Date.now(), all = (S.items[g.id] || []).filter(x => x.kind === "event" && x.data && ts(x.data.start)), owner = isOwner(g);
    const at = it => typeof occStart === "function" ? (occStart(it) || ts(it.data.start)) : ts(it.data.start);
    const up = all.filter(x => at(x) >= now - 72e5).sort((a, b) => at(a) - at(b)), past = all.filter(x => at(x) < now - 72e5).sort((a, b) => at(b) - at(a)).slice(0, 3);
    const row = (it, isPast) => {
      const d = new Date(at(it)), rs = ext.rsvps.filter(r => r.item_id === it.id), my = rs.find(r => r.user_id === myId()), mine = it.user_id === myId(), wk = !!(it.data.repeat && it.data.repeat.weekly);
      const names = st => rs.filter(r => r.status === st).map(r => r.user_id === myId() ? "You" : mName(g.id, r.user_id));
      const yes = names("yes"), maybe = names("maybe");
      const btn = (s, label) => `<button class="btn small${my && my.status === s ? " primary" : ""}" data-act="grp-rsvp" data-id="${esc(it.id)}" data-s="${s}" aria-pressed="${!!(my && my.status === s)}">${label}</button>`;
      return `<li class="grp-item grp-task${isPast ? " is-past" : ""}">
        <span class="grp-date" style="--c:var(--accent)"><small>${esc(d.toLocaleDateString(undefined, {month: "short"}))}</small><b>${d.getDate()}</b></span>
        <div class="grp-item-main"><b>${esc(it.title)}</b>
          <span class="mini">${esc(gWhen(at(it)))} to ${esc(new Date(at(it) + sessMins(it) * 60000).toLocaleTimeString(undefined, {hour: "numeric", minute: "2-digit"}))}${wk ? " · Every week" + (it.data.repeat.until ? " until " + esc(fmtShort(it.data.repeat.until)) : "") : ""}${it.data.where ? " · " + esc(it.data.where) : ""} · ${mine ? "Proposed by you" : "Proposed by " + esc(it.author_name || "a member")}</span>
          ${it.data.notes ? `<span class="mini">${esc(str(it.data.notes, 300))}</span>` : ""}
          ${!isPast && calCopy(it.id) ? `<span class="mini grp-oncal">On your calendar</span>` : ""}
          <span class="mini grp-rsvp-sum"><b>${yes.length}</b> going${maybe.length ? `, ${maybe.length} maybe` : ""}${yes.length ? ` · ${esc(yes.slice(0, 6).join(", "))}${yes.length > 6 ? ` +${yes.length - 6}` : ""}` : ""}</span></div>
        <div class="grp-item-btns">${isPast ? "" : btn("yes", "I'm In") + btn("maybe", "Maybe") + btn("no", "Can't") + (calCopy(it.id) ? "" : `<button class="btn small" data-act="grp-cal-add" data-id="${esc(it.id)}">Add to My Calendar</button>`)}${mine ? `<button class="btn small" data-act="grp-event-edit" data-id="${esc(it.id)}">Edit</button>` : repBtn(it)}${mine || owner ? `<button class="x-btn" data-act="grp-item-del" data-id="${esc(it.id)}" aria-label="Remove ${esc(it.title)} from the group">${CLOSE}</button>` : ""}</div></li>`;
    };
    return `<section class="grp-sec" id="grpSessions"><h3 class="fsec">${I_CAL}${isProj(g) ? "Meetings" : "Study Sessions"}<span class="n">${up.length} upcoming</span><span class="spacer"></span>${!isProj(g) && typeof gxOn === "function" && gxOn(g) ? `<button class="btn small" data-act="gx-ft" data-id="${esc(g.id)}">Find a Time</button>` : `<button class="btn small" data-act="grp-event-new" data-id="${esc(g.id)}">Propose a Time</button>`}</h3>
      ${loadingLine(g.id) || (all.length ? `<ul class="grp-list">${up.map(it => row(it, false)).join("")}${past.map(it => row(it, true)).join("")}</ul>` : `<p class="grp-none">Nothing planned. Propose a time, like Thursday at 6 pm, and see who can make it.</p>`)}</section>`;
  }
  /* Sessions you're in, on your own calendar */
  const SESS_LENS = [30, 45, 60, 90, 120, 180];
  const sessMins = it => { const m = Math.round(Number(it && it.data && it.data.mins)); return m >= 15 && m <= 600 ? m : 60; };
  const lenTxt = m => m < 60 ? `${m} min` : `${Math.floor(m / 60)} ${m < 120 ? "hour" : "hours"}${m % 60 ? ` ${m % 60} min` : ""}`;
  const calCopy = itemId => eventsArr().find(e => e.groupRef && e.groupRef.i === itemId) || null;
  function calEvent(g, it, prev){
    const d = it.data || {}, s0 = new Date(d.start); if (isNaN(s0)) return null;
    const e0 = new Date(s0.getTime() + sessMins(it) * 60000), hm = x => `${String(x.getHours()).padStart(2, "0")}:${String(x.getMinutes()).padStart(2, "0")}`;
    return normEvent(Object.assign({id: uid()}, prev, {title: str(it.title, 120), courseId: (prev && prev.courseId) || matchCourse(g.course) || "", date: iso(s0), start: hm(s0), end: iso(e0) === iso(s0) ? hm(e0) : "23:59", allDay: false,
      where: str(d.where, 120), notes: `${isProj(g) ? "Meeting" : "Study session"} with ${g.name}.${d.notes ? " " + str(d.notes, 300) : ""}`,
      repeat: d.repeat && d.repeat.weekly ? {days: [s0.getDay()], every: 1, until: isDate(d.repeat.until) ? d.repeat.until : ""} : null, groupRef: {g: g.id, i: it.id, v: it.updated_at || "", n: g.name}}));
  }
  function calAdd(g, it, label){
    if (calCopy(it.id)) return false;
    const ev = calEvent(g, it); if (!ev) return false;
    applyChanges([{kind: "event", id: ev.id, after: ev}], label || `Added ${it.title} to your calendar`);
    return true;
  }
  function calDrop(it){
    const ev = calCopy(it.id); if (!ev) return;
    applyChanges([{kind: "event", id: ev.id, after: null}], `Removed ${it.title} from your calendar`);
  }
  // Copies follow changes to the session, and go when it is removed
  function calSync(gid){
    const g = groupOf(gid), its = S.items[gid]; if (!g || !its) return;
    const ch = [];
    eventsArr().filter(e => e.groupRef && e.groupRef.g === gid).forEach(e => {
      const it = its.find(x => x.id === e.groupRef.i && x.kind === "event");
      if (!it) { ch.push({kind: "event", id: e.id, after: null}); return; }
      if (String(it.updated_at || "") === String(e.groupRef.v || "")) return;
      const n = calEvent(g, it, e); if (n) ch.push({kind: "event", id: e.id, after: n});
    });
    if (ch.length) applyChanges(ch, null);
  }
  // The start times of a session between two moments
  function sessTimes(it, from, to){
    const d = it.data || {}, t0 = ts(d.start), len = sessMins(it) * 60000, out = []; if (!t0) return out;
    if (!(d.repeat && d.repeat.weekly)) { if (t0 + len > from && t0 < to) out.push([t0, t0 + len]); return out; }
    const until = isDate(d.repeat.until) ? parse(d.repeat.until).getTime() + 864e5 : Infinity;
    for (let s1 = new Date(t0); s1.getTime() < to && s1.getTime() < until; s1.setDate(s1.getDate() + 7)) { const a = s1.getTime(); if (a + len > from) out.push([a, a + len]); }
    return out;
  }
  function eventSheet(g, it){
    const tom = addDays(todayISO(), 1), pj = isProj(g), ed = it ? it.data || {} : null, sd = ed && ts(ed.start) ? new Date(ed.start) : null, p2 = n => String(n).padStart(2, "0");
    const dDate = sd ? `${sd.getFullYear()}-${p2(sd.getMonth() + 1)}-${p2(sd.getDate())}` : tom, dTime = sd ? `${p2(sd.getHours())}:${p2(sd.getMinutes())}` : "18:00";
    openSheet(`<form class="sheet">${head(it ? (pj ? "Edit Meeting" : "Edit Study Session") : pj ? "Propose a Meeting" : "Propose a Study Session")}<div class="sheet-body">${REQ_NOTE}
      <label class="f"><span class="lh">${pj ? "What Is the Meeting About?" : "What Will You Study?"} ${REQ}</span><input type="text" name="title" required maxlength="120" autofocus value="${esc(it ? it.title : "")}" placeholder="${pj ? "e.g. Poster planning call" : "e.g. Biology midterm review"}"></label>
      <div class="two"><label class="f"><span class="lh">Day ${REQ}</span><input type="date" name="date" required value="${dDate}"${it ? "" : ` min="${todayISO()}"`}></label>
      <label class="f"><span class="lh">Time ${REQ}</span><input type="time" name="time" required value="${dTime}"></label></div>
      <label class="f"><span class="lh">Length</span><select name="mins">${[...new Set(SESS_LENS.concat(sessMins(it)))].sort((a, b) => a - b).map(m => `<option value="${m}"${m === sessMins(it) ? " selected" : ""}>${esc(lenTxt(m))}</option>`).join("")}</select></label>
      <label class="f"><span class="lh">Where <span class="hint">optional</span></span><input type="text" name="where" maxlength="120" value="${esc(ed ? ed.where || "" : "")}" placeholder="e.g. Library room 204, or a video call link"></label>
      <label class="f"><span class="lh">Notes <span class="hint">optional</span></span><textarea name="notes" rows="2" maxlength="500" placeholder="${pj ? "Agenda, what to bring" : "What to bring or cover"}">${esc(ed ? ed.notes || "" : "")}</textarea></label>
      ${typeof gxOn === "function" && gxOn(g) ? `<div class="two"><label class="mi-check" style="align-self:end"><input type="checkbox" name="weekly"${ed && ed.repeat && ed.repeat.weekly ? " checked" : ""}> Every week</label><label class="f"><span class="lh">Until <span class="hint">optional</span></span><input type="date" name="until" value="${esc(ed && ed.repeat && ed.repeat.until || "")}"></label></div>` : ""}
      <p class="mini" style="margin:0">Members answer I'm In, Maybe or Can't. Propose a few times to find the one that works for most people.</p></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit id="grpEvGo">${it ? "Save" : "Propose"}</button></div></form>`, fd => {
      const title = String(fd.get("title") || "").trim().slice(0, 120), date = String(fd.get("date") || ""), time = String(fd.get("time") || "");
      if (!title || !isDate(date) || !/^\d\d:\d\d$/.test(time)) return false;
      const start = new Date(`${date}T${time}`); if (isNaN(start)) return false;
      const b = $("#grpEvGo"); busyBtn(b, true);
      ensureName(async () => {
        try {
          const data = {v: 1, type: "event", start: start.toISOString(), mins: sessMins({data: {mins: fd.get("mins")}}), where: str(fd.get("where"), 120).trim(), notes: str(fd.get("notes"), 500).trim()};
          if (fd.get("weekly")) { const until = String(fd.get("until") || ""); data.repeat = {weekly: true, until: isDate(until) && until >= date ? until : ""}; }
          if (it) {
            const row = await api.updateItem(it.id, {title, data}); Object.assign(it, row || {title, data});
            if (dlg.open) dlg.close(); toast("Saved the changes"); calSync(g.id); patch(g.id); return;
          }
          const rows = await api.addItems([{group_id: g.id, kind: "event", ref_id: "", title, data}]);
          if (dlg.open) dlg.close();
          if (rows && S.items[g.id]) { S.items[g.id] = rows.concat(S.items[g.id]); patch(g.id); }
          if (!(rows && rows[0] && calAdd(g, rows[0], `Proposed ${title}. It's on your calendar too.`))) toast(`Proposed ${title}`);
          api.rsvp(rows && rows[0] ? rows[0].id : "", "yes").then(() => loadExtras(g.id)).catch(() => {});
          loadGroup(g.id);
        } catch(e) { busyBtn(b, false); toast(e.message); }
      });
      return false;
    });
  }

  function replaceKeep(el, html, id){
    const prev = new Map([...el.querySelectorAll(".score-bar")].map(b => [b.getAttribute("aria-label") || "", b.firstElementChild ? b.firstElementChild.style.width : ""]));
    el.outerHTML = html;
    const n = id && document.getElementById(id); if (!n) return;
    n.querySelectorAll(".score-bar").forEach(b => {
      const i = b.firstElementChild, k = b.getAttribute("aria-label") || ""; if (!i || !prev.has(k) || !prev.get(k) || prev.get(k) === i.style.width) return;
      const to = i.style.width; i.style.width = prev.get(k); void i.offsetWidth; requestAnimationFrame(() => { i.style.width = to; });
    });
  }
  const swapEl = (id, html) => { const el = document.getElementById(id); if (el) replaceKeep(el, html, id); };
  const kindItems = (gid, kind) => (S.items[gid] || []).filter(x => x.kind === kind);
  const myItem = (gid, kind) => kindItems(gid, kind).find(x => x.user_id === myId());
  const addRows = (gid, rows) => { if (rows && rows.length && S.items[gid]) S.items[gid] = rows.concat(S.items[gid]); };
  const canRemove = (g, it) => it.user_id === myId() || isOwner(g);
  const rmBtn = (it, what) => `<button class="x-btn" data-act="grp-item-del" data-id="${esc(it.id)}" aria-label="Remove ${esc(str(what || it.title, 60))} from the group">${CLOSE}</button>`;
  const by = (g, it) => it.user_id === myId() ? "you" : esc(it.author_name || "a member");
  const secHead = (icon, title, n, btn) => `<h3 class="fsec">${icon}${title}${n == null ? "" : `<span class="n">${n}</span>`}<span class="spacer"></span>${btn || ""}</h3>`;
  const I_LINK = gi('<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>');
  const I_NOTE = gi('<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>');
  const I_ASK = gi('<path d="M4 5h16v11H9l-5 4z"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.8.5-1.5 1-1.5 1.8M12 15v.1"/>');
  const I_WEAK = gi('<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17v.1"/>');
  const I_CUBE = gi(TYPE_ICONS.Project);
  const noSetup = (what, g) => isOwner(g) ? `<div class="grp-note">${esc(what)} need the latest <b>groups.sql</b>. ${esc(srvSetup("This", "groups.sql"))}</div>` : "";

  /* Roles: one per member, chosen by that member (a "role" item whose ref_id is the member) */
  const roleOf = (gid, uid2) => { const it = kindItems(gid, "role").find(x => x.user_id === uid2); return it && it.data && (GK.ROLES.some(r => r[0] === it.data.role) || (it.data.role === "custom" && str(it.data.label, 30).trim())) ? it.data.role : ""; };
  const roleName = (gid, uid2) => { const k = roleOf(gid, uid2); if (!k) return ""; if (k !== "custom") return GK.roleLabel(k); const it = kindItems(gid, "role").find(x => x.user_id === uid2); return str(it.data.label, 30).trim(); };
  async function setRole(g, key, label){
    const cur = myItem(g.id, "role"), custom = key === "custom", name = custom ? str(label, 30).trim() : GK.roleLabel(key);
    if ((custom && !name) || (!key && !cur)) return;
    const same = cur && cur.data && cur.data.role === key && (!custom || str(cur.data.label, 30).trim() === name), data = custom ? {v: 1, role: "custom", label: name} : {v: 1, role: key};
    try {
      if (cur && (same || !key)) { await api.removeItem(cur.id); S.items[g.id] = S.items[g.id].filter(x => x.id !== cur.id); }
      else if (cur) { const row = await api.updateItem(cur.id, {title: name, data}); Object.assign(cur, row || {}); }
      else await new Promise(res => ensureName(async () => { try { addRows(g.id, await api.addItems([{group_id: g.id, kind: "role", ref_id: myId(), title: name, data}])); } catch(e) { toast(e.message); } res(); }));
    } catch(e) { toast(e.message); }
    patch(g.id);
  }

  document.addEventListener("submit", e => {
    const f = e.target; if (!f || f.id !== "gkRoleForm") return;
    e.preventDefault();
    const g = groupOf(f.dataset.gid); if (!g) return;
    const v = str(new FormData(f).get("role"), 30).trim(); if (!v) { const i = $("input", f); if (i) i.focus(); return; }
    const preset = GK.ROLES.find(x => x[1].toLowerCase() === v.toLowerCase());
    setRole(g, preset ? preset[0] : "custom", v);
  });
  /* Overview (group projects) */
  function overviewHtml(g){
    if (!isProj(g)) return `<div id="grpOverview"></div>`;
    const x = ptX(g.id), today = todayISO(), cd = GK.countdown(g.project_due, today), me = myId(), ms = (S.members[g.id] || []).filter(m => m.user_id === me || !S.blocked.has(m.user_id));
    const mine = roleOf(g.id, me), wait = S.pt[g.id] && S.pt[g.id].setup ? "Tasks need the latest groups.sql." : "Loading…";
    const live = x ? (act => x.tasks.filter(t => act.has(t.list_id)))(new Set(x.lists.filter(l => !l.archived).map(l => l.id))) : [];
    const ov = x ? GK.overview(live, ms, today) : null;
    const lateTasks = live.filter(t => !t.deleted && t.status !== "done" && GTL.due(t.due_at, today).late).sort((a, b) => String(a.due_at).localeCompare(String(b.due_at)));
    const dueLine = GTL.isDay(g.project_due) ? `Due ${esc(parse(g.project_due).toLocaleDateString(undefined, {weekday: "long", month: "long", day: "numeric"}))}` : (isOwner(g) ? `<button class="link-btn" data-act="grp-edit" data-id="${esc(g.id)}">Set a due date</button> so everyone sees the countdown` : "The owner hasn't set a due date yet");
    const hero = `<div class="gk-hero k-${cd.k}"><div class="gk-hero-main"><span class="gk-eyebrow">Project deadline</span><b class="gk-big">${esc(cd.label)}</b><span class="mini">${dueLine}</span></div>
      <div class="gk-hero-prog">${ov ? `<div class="score-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${ov.progress.pct}" aria-label="Project progress"><i style="width:${ov.progress.pct}%"></i></div><span class="mini"><b>${ov.progress.pct}%</b> · ${ov.progress.done} of ${ov.progress.total} tasks done</span>` : `<span class="mini">${wait}</span>`}</div></div>`;
    const roles = `<div class="gk-roles" role="group" aria-label="Your role">${GK.ROLES.map(([k, l]) => `<button type="button" class="pt-f${mine === k ? " on" : ""}" data-act="grp-role-set" data-r="${k}" aria-pressed="${mine === k}">${esc(l)}</button>`).join("")}</div>`;
    const myCard = `<div class="gk-card"><h4>${I_CUBE}My Part</h4><p class="mini">${mine ? `You're the <b>${esc(roleName(g.id, me))}</b>. Tap it again to clear it.` : "Pick what you're covering so the team knows who to ask."}</p>${roles}
      <form class="gk-role-custom" id="gkRoleForm" data-gid="${esc(g.id)}" autocomplete="off"><input type="text" name="role" maxlength="30" placeholder="Or type your own role" aria-label="Your own role title" value="${mine === "custom" ? esc(roleName(g.id, me)) : ""}"><button type="submit" class="btn small">${mine === "custom" ? "Change" : "Set Role"}</button>${mine === "custom" ? `<button type="button" class="btn small" data-act="grp-role-set" data-r="">Clear</button>` : ""}</form></div>`;
    const behind = !ov ? `<p class="mini">${wait}</p>` : !ov.progress.total ? `<p class="grp-none">No tasks yet. <button class="link-btn" data-act="grp-pt-plan">Start from a plan</button> or add your own in <button class="link-btn" data-act="grp-tab" data-t="tasks">Tasks</button>.</p>`
      : (lateTasks.length ? `<ul class="gk-behind">${lateTasks.slice(0, 6).map(t => { const who = t.assignee_id && ms.some(m => m.user_id === t.assignee_id) ? t.assignee_id : ""; return `<li>${who ? av(mName(g.id, who), who) : ""}<span class="gk-behind-t"><button type="button" class="pt-title" data-act="grp-pt-edit" data-id="${esc(t.id)}">${esc(t.title)}</button><span class="mini"><span class="late">${esc(ptDueTxt(t.due_at))}</span> · ${who ? esc(who === me ? "You" : mName(g.id, who)) : "Unassigned"}</span></span></li>`; }).join("")}</ul>${lateTasks.length > 6 ? `<button class="link-btn" data-act="grp-tab" data-t="tasks">${lateTasks.length - 6} more in Tasks</button>` : ""}` : `<p class="gk-ok">${I_CHECK} Nothing is overdue. The team is on track.</p>`)
        + (ov.unassigned ? `<p class="mini">${plural(ov.unassigned, "open task")} nobody has claimed. <button class="link-btn" data-act="grp-pt-claim-one">Claim one</button></p>` : "") + (ov.uneven ? `<p class="mini pt-uneven">${esc(ov.uneven.hi)} has ${ov.uneven.gap} more open tasks than ${esc(ov.uneven.lo)}.</p>` : "");
    const team = `<div class="gk-card"><h4>${ICON_GROUP}Roles</h4><ul class="gk-team">${ms.map(m => { const r = roleOf(g.id, m.user_id); return `<li>${av(m.display_name, m.user_id)}<span class="nm">${esc(m.user_id === me ? "You" : m.display_name || "Member")}</span>${r ? `<span class="pill gk-role">${esc(roleName(g.id, m.user_id))}</span>` : `<span class="mini">No role yet</span>`}</li>`; }).join("")}</ul></div>`;
    return `<section class="grp-sec" id="grpOverview">${hero}<div class="gk-grid">${myCard}<div class="gk-card"><h4>${I_CHECK}What's Behind</h4>${behind}</div>${team}</div></section>`;
  }

  /* Files and links (group projects) */
  const webLink = v => { const u = safeUrl(v); if (!u) return ""; try { const h = new URL(u).hostname; return /^([a-z0-9-]+\.)+[a-z][a-z0-9-]+$/i.test(h) || h === "localhost" ? u : ""; } catch(e) { return ""; } };
  function linksHtml(g){
    if (!isProj(g)) return `<div id="grpFiles"></div>`;
    const its = kindItems(g.id, "link").map(it => ({it, url: webLink((it.data || {}).url), file: fileOf(it)})).filter(x => x.url || x.file);
    const rows = its.map(({it, url, file}) => `<li class="grp-item"><div class="grp-item-main"><b>${esc(it.title)}</b><span class="mini">${file ? `${esc(fileSize(file.size))} file` : esc(GK.hostOf(url))} · Added by ${by(g, it)} ${esc(ago(it.created_at, 1))}</span>${(it.data || {}).note ? `<span class="mini">${esc(str(it.data.note, 200))}</span>` : ""}</div>
      <div class="grp-item-btns">${file ? `<a class="btn small primary" href="${esc(file.url)}" download="${esc(file.name)}">Download</a>` : `<a class="btn small primary" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open</a><button class="btn small" data-act="grp-link-copy" data-id="${esc(it.id)}">Copy</button>`}${it.user_id === myId() ? "" : repBtn(it)}${canRemove(g, it) ? rmBtn(it) : ""}</div></li>`).join("");
    return `<section class="grp-sec" id="grpFiles">${secHead(I_LINK, "Files and Links", its.length)}
      ${loadingLine(g.id) || (its.length ? `<ul class="grp-list">${rows}</ul>` : `<p class="grp-none">Keep the shared doc, slides, data and sources in one place. Tap Add File at the bottom right to upload a file or add a link.</p>`)}
      <p class="mini">Links open in a new tab. For files that change a lot, share a link so everyone always sees the latest version.</p></section>`;
  }
  // An uploaded file is kept inside the shared item itself (small files only)
  const FILE_MAX = 1500000;
  const fileSize = n => n >= 1e6 ? (n / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1e3)) + " KB";
  function fileOf(it){
    const f = it && it.data && it.data.file; if (!f || typeof f.url !== "string" || typeof f.name !== "string") return null;
    const m = /^data:[a-z0-9.+\/-]*;base64,([A-Za-z0-9+\/=]+)$/i.exec(f.url); if (!m) return null;
    const name = str(f.name, 120).replace(/[\\/:*?"<>|\u0000-\u001f‪-‮⁦-⁩]/g, "_").replace(/[.\s]+$/, "") || "file";
    if (/\.(exe|msi|msix|appx|bat|cmd|com|scr|pif|cpl|lnk|url|reg|vbs|vbe|js|jse|wsf|wsh|hta|ps1|psm1|jar|jnlp|app|command|tool|pkg|dmg|sh|py|apk|ipa|desktop|scpt|workflow|iso|img|vhd|vhdx|html?|svg|xhtml|mht|xml|xsl)$/i.test(name)) return null;
    return {name, url: "data:application/octet-stream;base64," + m[1], size: Number(f.size) || Math.round(m[1].length * .75)};
  }
  function fileAddSheet(g){
    openSheet(`<div class="sheet">${head("Add a File or Link")}<div class="sheet-body"><div class="fm-list" style="display:grid;gap:10px">
      <button type="button" class="btn" data-act="grp-file-pick" style="justify-content:flex-start;text-align:left;padding:14px 16px"><span><b>Upload a File</b><span class="sub" style="display:block;font-weight:400">A document, image or PDF up to ${fileSize(FILE_MAX)}</span></span></button>
      <button type="button" class="btn" data-act="grp-link-new" data-id="${esc(g.id)}" style="justify-content:flex-start;text-align:left;padding:14px 16px"><span><b>Add a Link</b><span class="sub" style="display:block;font-weight:400">A shared Google Doc, slide deck or website</span></span></button></div></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button></div></div>`);
  }
  function pickGroupFile(g){
    const inp = document.createElement("input"); inp.type = "file"; inp.style.display = "none"; document.body.appendChild(inp);
    inp.addEventListener("change", () => {
      const f = inp.files && inp.files[0]; inp.remove(); if (!f) return;
      if (f.size > FILE_MAX) { toast(`That file is ${fileSize(f.size)}. Files can be up to ${fileSize(FILE_MAX)}. Share a link to a bigger one.`); return; }
      const rd = new FileReader();
      rd.onerror = () => toast("Couldn't read that file.");
      rd.onload = () => {
        const url = String(rd.result || ""), name = str(f.name, 120);
        if (!/^data:[^;,]*;base64,/.test(url)) { toast("Couldn't read that file."); return; }
        if (!fileOf({data: {file: {name, url}}})) { toast("That kind of file can't be shared here. Share a document, image or PDF."); return; }
        ensureName(async () => {
          try { addRows(g.id, await api.addItems([{group_id: g.id, kind: "link", ref_id: "", title: name, data: {v: 1, file: {name, size: f.size, url}}}])); if (dlg.open) dlg.close(); toast(`Added ${name}`); patch(g.id); }
          catch(e) { toast(e.message); }
        });
      };
      rd.readAsDataURL(f);
    });
    inp.click();
  }
  function linkSheet(g){
    openSheet(`<form class="sheet">${head("Add a Link")}<div class="sheet-body">${REQ_NOTE}
      <label class="f"><span class="lh">Name ${REQ}</span><input type="text" name="title" required maxlength="${GK.LIM.linkTitle}" autofocus placeholder="e.g. Poster draft (Google Slides)"></label>
      <label class="f"><span class="lh">Link ${REQ}</span><input type="url" name="url" required maxlength="500" inputmode="url" placeholder="https://docs.google.com/…"></label>
      <label class="f"><span class="lh">What Is It? <span class="hint">optional</span></span><input type="text" name="note" maxlength="${GK.LIM.linkNote}" placeholder="e.g. Edit access for everyone, please don't delete"></label></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit id="gkLinkGo">Add Link</button></div></form>`, fd => {
      const title = str(fd.get("title"), GK.LIM.linkTitle).trim(), url = webLink(fd.get("url")), note = str(fd.get("note"), GK.LIM.linkNote).trim();
      if (!title) return false;
      if (!url) { toast("That doesn't look like a web link. Paste the full address."); return false; }
      const b = $("#gkLinkGo"); busyBtn(b, true);
      ensureName(async () => {
        try { addRows(g.id, await api.addItems([{group_id: g.id, kind: "link", ref_id: "", title, data: {v: 1, url, note}}])); if (dlg.open) dlg.close(); toast(`Added ${title}`); patch(g.id); }
        catch(e) { busyBtn(b, false); toast(e.message); }
      });
      return false;
    });
  }

  /* Meeting notes (group projects) */
  function minutesHtml(g){
    if (!isProj(g)) return `<div id="grpMinutes"></div>`;
    const its = kindItems(g.id, "minutes").sort((a, b) => String((b.data || {}).date || "").localeCompare(String((a.data || {}).date || "")) || ts(b.created_at) - ts(a.created_at));
    const block = (label, text) => text ? `<div class="gk-min-b"><b>${label}</b><p>${esc(str(text, GK.LIM.minutes)).replace(/\n/g, "<br>")}</p></div>` : "";
    const rows = its.map(it => { const d = it.data || {};
      return `<li class="grp-item gk-min"><details><summary><b>${esc(it.title)}</b><span class="mini">${esc(GTL.isDay(d.date) ? fmtShort(d.date) : "")} · Notes by ${by(g, it)}${d.made ? " · Actions added to Tasks" : ""}</span></summary>
        ${block("Agenda", d.agenda)}${block("Decisions", d.decisions)}${block("Action items", d.actions)}${!d.agenda && !d.decisions && !d.actions ? `<p class="mini">No details were written.</p>` : ""}</details>
        <div class="grp-item-btns">${it.user_id === myId() ? `<button class="btn small" data-act="grp-min-edit" data-id="${esc(it.id)}">Edit</button>` : repBtn(it)}${canRemove(g, it) ? rmBtn(it) : ""}</div></li>`; }).join("");
    return `<section class="grp-sec" id="grpMinutes">${secHead(I_NOTE, "Meeting Notes", its.length, `<button class="btn small" data-act="grp-min-new" data-id="${esc(g.id)}">Add Notes</button>`)}
      ${loadingLine(g.id) || (its.length ? `<ul class="grp-list">${rows}</ul>` : `<p class="grp-none">After each meeting, write down what you decided and who does what. Action items can go straight into Tasks.</p>`)}</section>`;
  }
  function minutesSheet(g, it){
    const d = it ? it.data || {} : {}, x = ptX(g.id);
    openSheet(`<form class="sheet">${head(it ? "Edit Meeting Notes" : "Meeting Notes")}<div class="sheet-body">${REQ_NOTE}
      <div class="gk-tr"><button type="button" class="btn small ai-btn" id="gkTrOpen">${AI_ICON} Fill From a Transcript</button>
        <div id="gkTrBox" hidden><p class="mini" style="margin:6px 0">Upload the transcript (a .txt, .vtt, .srt or .md file) or paste it here. ${esc(aiWho("AI"))} turns it into the agenda, decisions and action items below.</p>
          <textarea id="gkTrText" rows="5" maxlength="60000" placeholder="Paste the meeting transcript"></textarea>
          <div class="segb" role="group" aria-label="Length of the notes" id="gkTrLen" style="margin:6px 0"><button type="button" data-len="short" aria-pressed="true">Short Notes</button><button type="button" data-len="long" aria-pressed="false">Detailed Notes</button></div>
          <div class="row-actions"><button type="button" class="btn small" id="gkTrFile">Upload Transcript</button><button type="button" class="btn small primary" id="gkTrGo">${AI_ICON} Make Notes</button></div>
          <p class="status-msg" id="gkTrStatus" style="margin:0" aria-live="polite"></p></div></div>
      <div class="two"><label class="f"><span class="lh">Meeting ${REQ}</span><input type="text" name="title" required maxlength="120" autofocus value="${esc(it ? it.title : "")}" placeholder="e.g. Kickoff call"></label>
      <label class="f"><span class="lh">Date</span><input type="date" name="date" value="${esc(GTL.isDay(d.date) ? d.date : todayISO())}"></label></div>
      <label class="f"><span class="lh">Agenda <span class="hint">optional</span></span><textarea name="agenda" rows="2" maxlength="${GK.LIM.minutes}" placeholder="What you planned to cover">${esc(d.agenda || "")}</textarea></label>
      <label class="f"><span class="lh">Decisions <span class="hint">optional</span></span><textarea name="decisions" rows="3" maxlength="${GK.LIM.minutes}" placeholder="What the team agreed on">${esc(d.decisions || "")}</textarea></label>
      <label class="f"><span class="lh">Action Items <span class="hint">one per line. Start a line with a name, like “Sam: book the room”, to assign it</span></span><textarea name="actions" rows="4" maxlength="${GK.LIM.minutes}" placeholder="Sam: book the room&#10;Alex: send the draft to everyone">${esc(d.actions || "")}</textarea></label>
      ${x ? `<label class="mi-check"><input type="checkbox" name="mk" ${it ? "" : "checked"}> <span>Add the action items to Tasks${it && d.made ? " again (they were added before)" : ""}</span></label>` : ""}</div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit id="gkMinGo">${it ? "Save" : "Save Notes"}</button></div></form>`, fd => {
      const title = str(fd.get("title"), 120).trim(); if (!title) return false;
      const date = String(fd.get("date") || ""), data = {v: 1, date: GTL.isDay(date) ? date : todayISO(), agenda: str(fd.get("agenda"), GK.LIM.minutes).trim(), decisions: str(fd.get("decisions"), GK.LIM.minutes).trim(), actions: str(fd.get("actions"), GK.LIM.minutes).trim(), made: !!d.made};
      const acts = fd.get("mk") ? GK.parseActions(data.actions, S.members[g.id] || []) : [];
      if (acts.length) data.made = true;
      const b = $("#gkMinGo"); busyBtn(b, true);
      ensureName(async () => {
        try {
          if (it) { const row = await api.updateItem(it.id, {title, data}); Object.assign(it, row || {}); }
          else addRows(g.id, await api.addItems([{group_id: g.id, kind: "minutes", ref_id: "", title, data}]));
          let made = 0; if (acts.length) made = await addActionTasks(g, acts);
          if (dlg.open) dlg.close(); toast(made ? `Saved. ${plural(made, "action item")} added to Tasks.` : "Saved the meeting notes"); patch(g.id);
        } catch(e) { busyBtn(b, false); toast(e.message); }
      });
      return false;
    });
    wireTranscript(g);
  }
  // "Fill From a Transcript"
  const TR_SCHEMA = {type: "OBJECT", properties: {title: {type: "STRING", description: "Short meeting title"}, agenda: {type: "STRING", description: "What was covered, one item per line"}, decisions: {type: "STRING", description: "What the team agreed on, one per line"}, actions: {type: "STRING", description: "One action item per line, as 'Name: task' when a person was named"}}, required: ["agenda", "decisions", "actions"]};
  function wireTranscript(g){
    const open = $("#gkTrOpen"), box = $("#gkTrBox"); if (!open || !box) return;
    const status = $("#gkTrStatus"), txt = $("#gkTrText"), go = $("#gkTrGo"); let len = "short";
    $("#gkTrLen").addEventListener("click", e => { const b = e.target.closest("[data-len]"); if (!b) return; len = b.dataset.len; $$("#gkTrLen [data-len]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); });
    open.addEventListener("click", () => { if (!aiReady()) { aiSetupSheet(true); return; } box.hidden = !box.hidden; if (!box.hidden) txt.focus(); });
    $("#gkTrFile").addEventListener("click", () => {
      const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".txt,.vtt,.srt,.md,text/plain"; inp.style.display = "none"; document.body.appendChild(inp);
      inp.addEventListener("change", async () => {
        const f = inp.files && inp.files[0]; inp.remove(); if (!f) return;
        if (f.size > 2e6) { status.textContent = "That file is too big. Paste the part you need instead."; return; }
        try { txt.value = String(await f.text()).replace(/^WEBVTT.*$/m, "").replace(/^\d+\s*$/gm, "").replace(/^[\d:.,]+\s*-->.*$/gm, "").replace(/\n{2,}/g, "\n").trim().slice(0, 60000); status.textContent = `Loaded ${f.name}.`; }
        catch(e) { status.textContent = "Couldn't read that file."; }
      });
      inp.click();
    });
    go.addEventListener("click", async () => {
      const text = String(txt.value || "").trim();
      if (text.length < 40) { status.textContent = "Add the transcript first."; return; }
      go.disabled = true; status.innerHTML = `<span class="ai-spin" aria-hidden="true"></span> ${esc(aiWho("AI"))} is reading the transcript…`;
      try {
        const names = (S.members[g.id] || []).map(m => m.display_name).filter(Boolean).join(", ");
        const detailed = len === "long", r2 = await aiCall({task: "transcript", maxTokens: detailed ? 6000 : 3000, schema: TR_SCHEMA, onStatus: m => { status.textContent = m; },
          system: "You turn a meeting transcript into short meeting notes for a student group project. Write the agenda (topics discussed), the decisions that were actually made, and the action items. " + (detailed ? "Be thorough: the agenda covers every topic with a line of context, and each decision says briefly why it was made." : "Keep it short: at most 4 agenda lines, 5 decisions and 6 action items, each under 100 characters.") + " Every action item is a short task of at most 8 words (a verb phrase such as 'Book the library room'), never a sentence or a paragraph. Write an action item as 'Name: task' when the transcript says who will do it, using the team member names given when they match. Never invent decisions or tasks that are not in the transcript. Leave a part empty if the transcript has nothing for it.",
          parts: [{text: `Team members: ${names || "unknown"}.\nTranscript:\n${text}`}]});
        const d = r2.data || {}, set = (n, v) => { const el = dlg.querySelector(`[name="${n}"]`); if (el && String(v || "").trim()) el.value = String(v).trim().slice(0, GK.LIM.minutes); };
        const t = dlg.querySelector('[name="title"]'); if (t && !t.value.trim() && d.title) t.value = String(d.title).trim().slice(0, 120);
        set("agenda", d.agenda); set("decisions", d.decisions); set("actions", d.actions);
        box.hidden = true; toast("Notes filled in. Check them, then save.");
      } catch(e) { status.textContent = e.message || "Something went wrong. Try again."; }
      go.disabled = false;
    });
  }
  // Put action items into the project's first open task list (made if there isn't one)
  async function addActionTasks(g, acts){
    const x = ptX(g.id); if (!x) { toast("Tasks need the latest groups.sql, so the action items were saved in the notes only."); return 0; }
    let list = x.lists.find(l => !l.archived);
    if (!list) list = await api.ptNewList(g.id, "Meeting actions", "");
    let n = 0;
    const short = t => { t = String(t || "").replace(/\s+/g, " ").trim(); if (t.length <= 60) return t; const cut = t.slice(0, 60), sp = cut.lastIndexOf(" "); return (sp > 30 ? cut.slice(0, sp) : cut).replace(/[,;:\s-]+$/, "") + "…"; };
    for (const a of acts) { try { await api.ptAdd(list.id, short(a.text), a.who || null, null, a.text.length > 60 ? str(a.text, GTL.LIM.notes) : "", null); n++; } catch(e) { toast(e.message); break; } }
    loadPT(g.id); return n;
  }

  /* Starter plan (group projects) */
  const PLAN_SCHEMA = {type: "OBJECT", properties: {tasks: {type: "ARRAY", items: {type: "OBJECT", properties: {title: {type: "STRING", description: "A concrete task starting with a verb, under 70 characters"}, due: {type: "STRING", description: "YYYY-MM-DD, or empty"}}, required: ["title"]}}}, required: ["tasks"]};
  function planSheet(g){
    const x = ptX(g.id);
    if (!x) { toast("Tasks aren't ready yet. Try again in a moment."); return; }
    if (!aiReady()) { aiSetupSheet(true); return; }
    const today = todayISO(), hasDue = GTL.isDay(g.project_due) && g.project_due >= today, who = aiWho("AI");
    openSheet(`<form class="sheet ai-sheet">${head("Start From a Plan")}<div class="sheet-body" id="gpBody">
      <label class="f"><span class="lh">What Is the Project About? ${REQ}</span><textarea id="gpIdea" rows="5" maxlength="1500" autofocus placeholder="e.g. A 10 minute presentation on how coral reefs are affected by warming oceans, with slides, a handout and a short demo."></textarea></label>
      <p class="mini" style="margin:0">${esc(who)} reads this and suggests a list of tasks${hasDue ? `, spaced out before the due date (${esc(fmtShort(g.project_due))})` : ""}. You choose which ones to add.</p>
      <p class="status-msg" id="gpStatus" style="margin:0" aria-live="polite"></p></div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span><button type="button" class="btn primary" id="gpGo">${AI_ICON} Suggest Tasks</button></div></form>`);
    const status = $("#gpStatus");
    $("#gpGo").addEventListener("click", async () => {
      const idea = String($("#gpIdea").value || "").trim(), go = $("#gpGo");
      if (idea.length < 8) { status.textContent = "Say a little more about the project first."; return; }
      go.disabled = true; go.classList.add("busy"); status.innerHTML = `<span class="ai-spin" aria-hidden="true"></span> ${esc(who)} is planning…`;
      try {
        const ms = (S.members[g.id] || []).length, have = x.tasks.filter(t => !t.deleted).map(t => t.title).slice(0, 40);
        const r2 = await aiCall({task: "groupplan", maxTokens: 4000, schema: PLAN_SCHEMA, onStatus: m => { status.textContent = m; },
          system: "You help a student team plan a group project. Break the project into 6 to 12 concrete tasks the team can split between them, in the order they should be done. Each title starts with a verb and is under 70 characters. Cover research, drafting, the main deliverable, review and rehearsal or submission where they fit. Do not repeat tasks the team already has. If a due date is given, suggest due dates (YYYY-MM-DD) spread from today up to a few days before the deadline; otherwise leave due empty.",
          parts: [{text: `Today is ${today}. Project name: ${g.name}.${g.course ? " Course: " + g.course + "." : ""} ${hasDue ? "Project due date: " + g.project_due + "." : "No due date was set."} Team size: ${ms}.${have.length ? " Tasks already on the board: " + have.join("; ") + "." : ""}\nWhat the project is about: ${idea}`}]});
        const lo = today, hi = hasDue ? g.project_due : "9999-12-31";
        const list = (r2.data.tasks || []).map(t => ({title: GTL.clamp(t && t.title, GTL.LIM.title), due: t && GTL.isDay(t.due) && t.due >= lo && t.due <= hi ? String(t.due).slice(0, 10) : ""})).filter(t => t.title).slice(0, 14);
        if (!list.length) throw aiErr("empty", "Couldn't come up with tasks from that. Try describing the project in a bit more detail.");
        review(list);
      } catch(e) { status.textContent = e.message || "Something went wrong. Try again."; go.disabled = false; go.classList.remove("busy"); }
    });
    const review = list => {
      $("#gpBody").innerHTML = `<p class="mini" style="margin:0">${esc(who)} suggests these tasks. Untick any you don't want.</p>
        <fieldset><legend>Suggested Tasks</legend>${list.map((t, i) => `<label class="mi-check"><input type="checkbox" data-gp="${i}" checked> ${esc(t.title)}${t.due ? ` <span class="mini">${esc(fmtShort(t.due))}</span>` : ""}</label>`).join("")}</fieldset>
        <p class="status-msg" id="gpStatus2" style="margin:0" aria-live="polite"></p>`;
      $(".sheet-foot", dlg).innerHTML = `<button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span><button type="button" class="btn primary" id="gpAdd">Add Tasks</button>`;
      $("#gpAdd").addEventListener("click", async () => {
        const pick = list.filter((t, i) => { const cb = dlg.querySelector(`[data-gp="${i}"]`); return cb && cb.checked; }), add = $("#gpAdd"), st = $("#gpStatus2");
        if (!pick.length) { st.textContent = "Tick at least one task."; return; }
        add.disabled = true; st.innerHTML = `<span class="ai-spin" aria-hidden="true"></span> Adding…`;
        let n = 0;
        try {
          const lst = await ptDefaultList(g); if (!lst) throw new Error("Couldn't start the task list. Try again.");
          for (const t of pick) { if (!GTL.canAddTask(x.tasks, lst.id)) { toast(`A project holds up to ${GTL.LIM.tasks} tasks.`); break; } await api.ptAdd(lst.id, t.title, null, t.due || null, "", null); n++; }
          await loadPT(g.id); if (dlg.open) dlg.close(); toast(`Added ${plural(n, "task")}`);
        } catch(e) { st.textContent = e.message; add.disabled = false; if (n) loadPT(g.id); }
      });
    };
  }

  /* Task board (group projects) */
  function ptWhoChip(g, t){
    const who = t.assignee_id && (S.members[g.id] || []).some(m => m.user_id === t.assignee_id) ? t.assignee_id : "";
    return who ? `<span class="pt-who">${av(mName(g.id, who), who)}<span>${esc(who === myId() ? "You" : mName(g.id, who))}</span></span>` : `<span class="pt-who none">Unassigned</span>`;
  }
  // Laid out like the Task Board
  function ptBoard(g, tasks, today){
    const cols = GK.board(tasks), ms = S.members[g.id] || [];
    const card = t => { const late = t.status !== "done" && GTL.due(t.due_at, today).late;
      const who = t.assignee_id && ms.some(m => m.user_id === t.assignee_id) ? t.assignee_id : "", nm = who ? (who === myId() ? "You" : mName(g.id, who)) : "Unassigned";
      return `<li class="kb-card${late ? " is-late" : ""}${t._tmp ? " is-saving" : ""}${who ? "" : " is-free"}" data-id="${esc(t.id)}" data-kb="${esc(t.status)}" style="--kc:${esc(who ? memberHue(g.id, who) : "#8A94A6")}">
        <div class="kb-band">${who ? av(mName(g.id, who), who) : `<span class="kb-free" aria-hidden="true"></span>`}<span>${esc(nm)}</span></div>
        <div class="kb-main"><button type="button" class="pt-check" role="checkbox" aria-checked="${t.status === "done"}" data-act="grp-pt-done" data-id="${esc(t.id)}" aria-label="${t.status === "done" ? "Mark not done" : "Mark done"}: ${esc(str(t.title, 80))}"><span class="pt-box">${CHECK}</span></button><button type="button" class="pt-title" data-act="grp-pt-edit" data-id="${esc(t.id)}">${esc(t.title)}</button></div>
        <div class="pt-meta">${ptDuePill(t, today)}${t.priority === "high" || t.priority === "urgent" ? `<span class="pt-prio ${esc(t.priority)}">${t.priority === "urgent" ? "Urgent" : "High"}</span>` : ""}${typeof gxReviewBtns === "function" ? gxReviewBtns(g, t) : ""}</div>
        ${t.status !== "done" && !who ? `<button type="button" class="btn small kb-claim" data-act="grp-pt-claim" data-id="${esc(t.id)}">Claim This</button>` : ""}
</li>`; };
    const DOT = {todo: "#8A94A6", doing: "#2C55D6", done: "#1E9E74"};
    const col = (k, label, list, empty) => `<section class="kb-col k-${k}" data-kbcol="${k}" aria-label="${label}, ${list.length}" style="--sc:${DOT[k]}"><h4><span class="sd" aria-hidden="true"></span>${label}<small>${list.length}</small></h4><ul>${list.map(card).join("") || `<li class="kb-none">${empty}</li>`}</ul></section>`;
    return `<div class="kb" role="group" aria-label="Task board. Drag a card to another column to change its status.">${col("todo", "To Do", cols.todo, "Nothing waiting")}${col("doing", "In Progress", cols.doing, "Nobody is working on anything")}${col("done", "Done", cols.done, "Nothing finished yet")}</div>`;
  }

  /* Q&A board (study groups) */
  function qaHtml(g){
    if (isProj(g)) return `<div id="grpQA"></div>`;
    const qs = GK.questionsOf(kindItems(g.id, "qa")), all = S.items[g.id] || [], open = qs.filter(q => !(q.data || {}).solved).length;
    const rows = qs.map(q => { const d = q.data || {}, n = GK.answersOf(all, q.id, d.best).length;
      return `<li class="grp-item${d.solved ? " is-solved" : ""}"><button class="grp-item-main" data-act="grp-q-open" data-id="${esc(q.id)}"><b>${esc(q.title)}</b><span class="mini">Asked by ${by(g, q)} ${esc(ago(q.created_at, 1))} · ${plural(n, "answer")}</span></button>
        <div class="grp-item-btns">${d.solved ? `<span class="pill ok">Solved</span>` : ""}<button class="btn small${d.solved ? "" : " primary"}" data-act="grp-q-open" data-id="${esc(q.id)}">${n || d.solved ? "Open" : "Answer"}</button>${q.user_id === myId() ? "" : repBtn(q)}${canRemove(g, q) ? rmBtn(q) : ""}</div></li>`; }).join("");
    return `<section class="grp-sec" id="grpQA">${secHead(I_ASK, "Questions and Answers", qs.length ? `${open} open` : null, `<button class="btn small" data-act="grp-q-new" data-id="${esc(g.id)}">Ask a Question</button>`)}
      ${loadingLine(g.id) || (qs.length ? `<ul class="grp-list">${rows}</ul>` : `<p class="grp-none">Stuck on something? Ask the group. Anyone can answer, and you mark the answer that helped.</p>`)}</section>`;
  }
  function askSheet(g){
    openSheet(`<form class="sheet">${head("Ask the Group")}<div class="sheet-body">${REQ_NOTE}
      <label class="f"><span class="lh">Question ${REQ}</span><input type="text" name="title" required maxlength="${GK.LIM.question}" autofocus placeholder="e.g. Why does the Krebs cycle need oxygen if it doesn't use it directly?"></label>
      <label class="f"><span class="lh">Details <span class="hint">optional</span></span><textarea name="body" rows="4" maxlength="${GK.LIM.detail}" placeholder="What you've tried, or where in the notes it comes from"></textarea></label></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit id="gkAskGo">Post Question</button></div></form>`, fd => {
      const title = str(fd.get("title"), GK.LIM.question).trim(); if (!title) return false;
      const b = $("#gkAskGo"); busyBtn(b, true);
      ensureName(async () => {
        try { addRows(g.id, await api.addItems([{group_id: g.id, kind: "qa", ref_id: "", title, data: {v: 1, body: str(fd.get("body"), GK.LIM.detail).trim(), solved: false, best: ""}}])); if (dlg.open) dlg.close(); toast("Question posted"); patch(g.id); }
        catch(e) { busyBtn(b, false); toast(e.message); }
      });
      return false;
    });
  }
  function threadSheet(qid){
    openSheet(`<div class="sheet">${head("Question")}<div class="sheet-body" id="gkThread" data-q="${esc(qid)}"></div></div>`);
    drawThread();
  }
  function drawThread(){
    const box = $("#gkThread"); if (!box) return;
    const q = itemOf(box.dataset.q), g = q && groupOf(q.group_id);
    if (!q || !g) { box.innerHTML = `<p class="grp-none">That question isn't there anymore.</p>`; return; }
    const d = q.data || {}, mine = q.user_id === myId(), ans = GK.answersOf(S.items[g.id] || [], q.id, d.best), typed = $("#gkAnswerIn") ? $("#gkAnswerIn").value : "";
    const hadFocus = document.activeElement && document.activeElement.id === "gkAnswerIn";
    box.innerHTML = `<h3 class="gk-q">${esc(q.title)}</h3>
      <p class="mini">Asked by ${by(g, q)} ${esc(ago(q.created_at, 1))}${d.solved ? ` · <span class="pill ok">Solved</span>` : ""}</p>
      ${d.body ? `<p style="margin:0">${esc(str(d.body, GK.LIM.detail)).replace(/\n/g, "<br>")}</p>` : ""}
      ${mine ? `<div class="row-actions"><button type="button" class="btn small" data-act="grp-q-solve" data-id="${esc(q.id)}">${d.solved ? "Reopen Question" : "Mark as Solved"}</button></div>` : ""}
      <h4 class="gk-sub">${plural(ans.length, "Answer")}</h4>
      ${ans.length ? `<ul class="grp-list">${ans.map(a => { const best = a.id === d.best;
        return `<li class="grp-item${best ? " is-best" : ""}"><div class="grp-item-main"><span>${esc(str((a.data || {}).body || a.title, GK.LIM.answer)).replace(/\n/g, "<br>")}</span><span class="mini qa-by">${av(a.author_name || "A member", a.user_id)}${esc(a.user_id === myId() ? "You" : a.author_name || "A member")} · ${esc(ago(a.created_at, 1))}${best ? ` · <b>Best answer</b>` : ""}</span></div>
          <div class="grp-item-btns">${mine ? `<button type="button" class="btn small${best ? "" : " primary"}" data-act="grp-q-best" data-id="${esc(q.id)}" data-a="${esc(a.id)}">${best ? "Unmark Best" : "Best Answer"}</button>` : ""}${a.user_id === myId() ? "" : repBtn(a)}${canRemove(g, a) ? `<button type="button" class="x-btn" data-act="grp-q-del" data-id="${esc(a.id)}" aria-label="Delete this answer">${CLOSE}</button>` : ""}</div></li>`; }).join("")}</ul>` : `<p class="grp-none">No answers yet. Be the first to help.</p>`}
      <form id="gkAnswer" data-q="${esc(q.id)}" class="gk-answer"><textarea id="gkAnswerIn" name="body" rows="3" maxlength="${GK.LIM.answer}" required aria-label="Your answer" placeholder="Write an answer…">${esc(typed)}</textarea><button type="submit" class="btn primary">Post Answer</button></form>`;
    if (hadFocus) { const t = $("#gkAnswerIn"); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }
  }
  const saveQ = async (q, data) => { const row = await api.updateItem(q.id, {data}); Object.assign(q, row || {data}); };

  /* Most missed (study groups) */
  const missKey = gid => "sb:grpMiss:" + myId() + ":" + gid;
  const missOn = gid => { try { return localStorage.getItem(missKey(gid)) === "1"; } catch(e) { return false; } };
  const missSet = (gid, on) => { try { if (on) localStorage.setItem(missKey(gid), "1"); else localStorage.removeItem(missKey(gid)); } catch(e) {} };
  // My misses on this group's shared decks and quizzes, wherever my copy lives
  function collectMisses(gid){
    const out = [];
    (S.items[gid] || []).forEach(it => {
      const mine = it.user_id === myId(), d = it.data || {};
      if (it.kind === "deck") {
        const deck = mine ? state.decks[it.ref_id] : copyOfItem(it.id); if (!deck) return;
        (Array.isArray(d.cards) ? d.cards : []).forEach(sc => { const c = deck.cards.find(x => (mine ? x.id : x.sid) === sc.id); if (c && c.seen > 0) out.push({item: it.id, k: "c:" + sc.id, m: Math.min(c.wrong | 0, c.seen), t: c.seen | 0}); });
      } else if (it.kind === "quiz" && d.quiz) {
        let qz = null;
        if (mine) { const src = quizSource(it); qz = src && src.qz; } else { const deck = copyOfItem(it.id); qz = deck && (deck.aiQuizzes.find(x => x.sid === d.quiz.id) || deck.aiQuizzes[0]); }
        if (!qz) return;
        (d.quiz.questions || []).forEach(sq => { const q = qz.questions.find(x => x.id === sq.id); if (q && q.tries > 0) out.push({item: it.id, k: "q:" + sq.id, m: Math.min(q.miss | 0, q.tries), t: q.tries | 0}); });
      }
    });
    return out.slice(0, 300);
  }
  async function loadMisses(gid, force){
    const g = groupOf(gid); if (!online() || !g || isProj(g)) return;
    const x = S.miss[gid] = S.miss[gid] || {ok: false}; if (x.busy) return; x.busy = true;
    try {
      if (missOn(gid) && (force || Date.now() - (x.sentAt || 0) > 5 * 60 * 1000)) { await api.reportMisses(gid, collectMisses(gid)); x.sentAt = Date.now(); }
      x.rows = await api.topMisses(gid) || []; x.ok = true; x.setup = false; x.err = "";
    } catch(e) { x.ok = false; x.setup = !!e.setup; x.err = e.message; }
    x.busy = false;
    if (ui.tab === "groups" && ui.grp === gid) swapEl("grpWeak", weakHtml(g));
  }
  function weakHtml(g){
    if (isProj(g)) return `<div id="grpWeak"></div>`;
    const x = S.miss[g.id], on = missOn(g.id), its = (S.items[g.id] || []).filter(i => i.kind === "deck" || i.kind === "quiz");
    if (x && !x.ok && x.setup) return `<div id="grpWeak">${noSetup("Most missed cards and questions", g)}</div>`;
    const btn = on ? `<button class="btn small" data-act="grp-weak-off" data-id="${esc(g.id)}">Stop Sharing Mine</button>` : `<button class="btn small primary" data-act="grp-weak-on" data-id="${esc(g.id)}">Share My Results</button>`;
    const list = x && x.ok ? GK.topMisses(x.rows, S.items[g.id] || []) : [], cards = list.filter(r => r.kind === "card");
    const rows = list.map(r => `<li class="grp-item"><div class="grp-item-main"><span class="gk-tag">${r.kind === "card" ? "Card" : "Question"}</span><b>${esc(r.text)}</b>${r.answer ? `<span class="mini">Answer: ${esc(r.answer)}</span>` : ""}<span class="mini">${r.missed} of ${r.tried} members miss this · ${esc(r.source)}</span></div><span class="gk-miss" title="Members who miss this">${r.missed}</span></li>`).join("");
    const body = !its.length ? `<p class="grp-none">Share a deck or a quiz with the group first. The cards and questions members miss most then show up here.</p>`
      : !x ? `<p class="status-msg"><span class="ai-spin" aria-hidden="true"></span> Loading…</p>`
      : !x.ok ? `<div class="grp-err" role="alert"><span>${esc(x.err || "Couldn't load this.")}</span><button type="button" class="btn small" data-act="grp-weak-retry">Try Again</button></div>`
      : list.length ? `<ul class="grp-list">${rows}</ul>${cards.length ? `<div class="row-actions"><button class="btn small" data-act="grp-weak-deck" data-id="${esc(g.id)}">Make a Deck From the Cards</button></div>` : ""}`
      : `<p class="grp-none">${on ? "Nothing to show yet. This appears once 3 members share their results and 2 miss the same card or question." : "Share your results to join in. It appears once at least 3 members take part and at least 2 miss the same card or question."}</p>`;
    return `<section class="grp-sec" id="grpWeak">${secHead(I_WEAK, "Most Missed", null, btn)}${body}
      <p class="mini">Anonymous: only totals per card or question are kept, and nobody, not even the owner, can see who missed what.</p></section>`;
  }
  function weakDeck(g){
    const cards = GK.topMisses((S.miss[g.id] || {}).rows, S.items[g.id] || []).filter(r => r.kind === "card").slice(0, 20);
    if (!cards.length) return;
    const nd = normDeck({id: uid(), created: Date.now(), name: str(`Most Missed: ${g.name}`, 120), courseId: matchCourse(g.course) || "", cards: cards.map(c => ({id: uid(), front: c.text, back: c.answer || "-", box: 0, due: "", seen: 0, right: 0, wrong: 0}))});
    saveDeck(nd, `Made a deck of ${plural(nd.cards.length, "card")} the group misses most`);
  }

  /* Quiz battle (study groups) */
  function battleHtml(g){
    if (isProj(g)) return `<div id="grpBattle"></div>`;
    const ext = extOf(g.id); if (!ext) return `<div id="grpBattle"></div>`;
    const quizzes = kindItems(g.id, "quiz"), ms = (S.members[g.id] || []).filter(m => m.user_id === myId() || !S.blocked.has(m.user_id));
    if (!quizzes.length) return `<section class="grp-sec" id="grpBattle">${secHead(I_QUIZ, "Quiz Battle")}<p class="grp-none">Share a practice quiz in <button class="link-btn" data-act="grp-tab" data-t="study">Study</button> and see who scores highest.</p></section>`;
    const joined = new Set(kindItems(g.id, "battle").filter(x => x.data && x.data.on).map(x => x.user_id)), inIt = joined.has(myId());
    const players = ms.filter(m => joined.has(m.user_id));
    const join = inIt ? `<button type="button" class="link-btn" data-act="grp-battle" data-on="0" data-g="${esc(g.id)}">Leave the Battle</button>` : `<button type="button" class="btn small primary" data-act="grp-battle" data-on="1" data-g="${esc(g.id)}">Join the Battle</button>`;
    if (!players.length) return `<section class="grp-sec" id="grpBattle">${secHead(I_QUIZ, "Quiz Battle", plural(quizzes.length, "quiz", "quizzes"), join)}<p class="grp-none">See who scores highest on the group's quizzes. Nobody is on the board until they join, and you can leave any time.</p></section>`;
    const ids = new Set(quizzes.map(q => q.id)), rows = GK.battle(ext.scores.filter(s => ids.has(s.item_id)), players), max = Math.max(1, ...rows.map(r => r.pct));
    return `<section class="grp-sec" id="grpBattle">${secHead(I_QUIZ, "Quiz Battle", plural(quizzes.length, "quiz", "quizzes"), join)}
      <div class="grp-card2"><p class="mini" style="margin:0 0 8px">Ranked by the average of each person's best score on the group's quizzes. Only members who joined are shown${inIt ? "" : ": join to add yours"}.</p>
      <ol class="grp-lb">${rows.map((r, i) => `<li class="${r.id === myId() ? "me" : ""}${r.taken ? "" : " none"}"><span class="rk${i === 0 && r.taken ? " top" : ""}">${r.taken ? i + 1 : "–"}</span>${av(r.name, r.id)}<span class="nm">${esc(r.name)}${r.id === myId() ? ` <span class="mini">(You)</span>` : ""}<span class="mini">${r.taken ? plural(r.taken, "quiz", "quizzes") + " taken" : "Hasn't played yet"}</span></span><span class="bar" aria-hidden="true"><i style="width:${Math.round(r.pct / max * 100)}%"></i></span><b>${r.taken ? r.pct + "%" : ""}</b></li>`).join("")}</ol></div></section>`;
  }

  /* Actions for the pieces above */
  async function setBattle(g, on){
    const cur = myItem(g.id, "battle");
    try {
      if (on && !cur) { const rows = await api.addItems([{group_id: g.id, kind: "battle", ref_id: "", title: "battle", data: {v: 1, on: true}}]); addRows(g.id, rows); toast("You're in the Quiz Battle"); }
      else if (on && cur && !(cur.data || {}).on) { await saveBattleData(cur, Object.assign({}, cur.data, {v: 1, on: true})); toast("You're in the Quiz Battle"); }
      else if (!on && cur && matchHas(cur)) { await saveBattleData(cur, Object.assign({}, cur.data, {on: false})); toast("You left the Quiz Battle. Your scores aren't shown any more."); }
      else if (!on && cur) { await api.removeItem(cur.id); S.items[g.id] = (S.items[g.id] || []).filter(x => x.id !== cur.id); indexItems(g.id, S.items[g.id]); toast("You left the Quiz Battle. Your scores aren't shown any more."); }
      patch(g.id);
    } catch(e) { toast(/kind_check|battle/i.test(e.message) ? srvSetup("Joining the Quiz Battle", "groups.sql") : e.message); }
  }
  /* Match times on shared decks (the game is 97-match.js) */
  const MT_MAX = 40;
  const matchHas = it => !!(it && it.data && it.data.match && Object.keys(it.data.match).length);
  async function saveBattleData(cur, data){
    const row = await api.updateItem(cur.id, {data}); Object.assign(cur, row || {data}); if (!row) cur.data = data;
  }
  const matchBoard = (gid, itemId) => kindItems(gid, "battle").filter(x => !S.blocked.has(x.user_id) && x.data && x.data.match && x.data.match[itemId] && Number(x.data.match[itemId].ms) > 0)
    .map(x => { const e = x.data.match[itemId]; return {id: x.user_id, me: x.user_id === myId(), ms: Number(e.ms), anon: !!e.anon, at: e.at, name: mName(gid, x.user_id)}; })
    .sort((a, b) => a.ms - b.ms || String(a.at).localeCompare(String(b.at)));
  async function setMatchTime(gid, itemId, entry){
    const cur = myItem(gid, "battle"), data = Object.assign({v: 1, on: false}, cur && cur.data);
    const m = Object.assign({}, data.match); if (entry) m[itemId] = entry; else delete m[itemId];
    data.match = Object.fromEntries(Object.entries(m).sort((a, b) => String(b[1].at).localeCompare(String(a[1].at))).slice(0, MT_MAX));
    if (!cur) { if (entry) addRows(gid, await api.addItems([{group_id: gid, kind: "battle", ref_id: "", title: "battle", data}])); }
    else if (!data.on && !Object.keys(data.match).length) { await api.removeItem(cur.id); S.items[gid] = (S.items[gid] || []).filter(x => x.id !== cur.id); }
    else await saveBattleData(cur, data);
  }
  let MT = null;
  function matchPanel(){
    if (!MT) return "";
    const it = MT.it, gid = it.group_id, g = groupOf(gid), rows = matchBoard(gid, it.id), mine = rows.find(r => r.me), clk = window.SBMATCH.clock;
    const nm = r => r.anon ? (r.me ? "You (anonymous)" : "Anonymous member") : r.me ? `${esc(r.name)} <span class="mini">(You)</span>` : esc(r.name);
    const ask = !mine ? `<p>Post your time to ${esc(g ? g.name : "the group")}? Only times people choose to post are on the board.</p>
        <div class="row-actions"><button type="button" class="btn small primary" data-act="grp-mt-post" data-anon="0">Post With My Name</button><button type="button" class="btn small" data-act="grp-mt-post" data-anon="1">Post Anonymously</button></div>`
      : `<p>${MT.ms < mine.ms ? `You beat your posted time of <b>${clk(mine.ms)} s</b>.` : `Your posted time is <b>${clk(mine.ms)} s</b>${mine.anon ? ", without your name" : ""}.`}</p>
        <div class="row-actions">${MT.ms < mine.ms ? `<button type="button" class="btn small primary" data-act="grp-mt-post" data-anon="${mine.anon ? 1 : 0}">Post My New Time</button>` : ""}<button type="button" class="btn small" data-act="grp-mt-del">Remove My Time</button></div>`;
    const lb = rows.length ? `<ol class="mt-lb">${rows.slice(0, 10).map((r, i) => `<li class="${r.me ? "me" : ""}"><span class="rk${i === 0 ? " top" : ""}">${i + 1}</span><span class="nm">${nm(r)}</span><b>${clk(r.ms)} s</b></li>`).join("")}</ol>`
      : `<p class="mini">Nobody has posted a time on this deck yet.</p>`;
    return `<section class="mt-grp" aria-label="Group times"><h3>Best Times in ${esc(g ? g.name : "the Group")}</h3>${ask}${lb}</section>`;
  }
  const drawMatchPanel = () => { const b = $("#mtAfter"); if (b) b.innerHTML = matchPanel(); };
  function playGroupMatch(it){
    const p = itemDeck(it); if (!p || !window.SBMATCH) return;
    const mineDeck = it.user_id === myId() ? state.decks[it.ref_id] : copyOfItem(it.id);
    if (dlg.open) dlg.close();
    window.SBMATCH.start({name: str(it.title, 120) || p.name, cards: p.cards, deckId: mineDeck ? mineDeck.id : ""}, {after: (res, box) => { MT = {it, ms: res.ms}; if (box) box.innerHTML = matchPanel(); }});
  }
  hook("act", (act, el, id) => {
    if (act === "grp-match") { const it = itemOf(id); if (it) playGroupMatch(it); return true; }
    if (act !== "grp-mt-post" && act !== "grp-mt-del") return false;
    if (!MT || !online()) return true;
    const it = MT.it, ms = MT.ms, anon = el.dataset.anon === "1";
    busyBtn(el, true);
    ensureName(async () => {
      try {
        if (act === "grp-mt-post") { await setMatchTime(it.group_id, it.id, {ms, at: new Date().toISOString(), anon}); toast(anon ? "Time posted without your name" : "Time posted to the group"); }
        else { await setMatchTime(it.group_id, it.id, null); toast("Your time was removed from the board"); }
        drawMatchPanel(); if (ui.tab === "groups" && ui.grp === it.group_id) patch(it.group_id);
      } catch(e) { busyBtn(el, false); toast(/kind_check|battle/i.test(e.message) ? srvSetup("Posting Match times", "groups.sql") : e.message); }
    });
    return true;
  });
  hook("act", (act, el, id) => {
    if (!/^grp-(role-set|link-|file-|min-|q-|weak-|battle)/.test(act)) return false;
    const g = groupOf((el && el.dataset && el.dataset.g) || ui.grp);
    if (!g) return true;
    switch (act) {
      case "grp-role-set": setRole(g, el.dataset.r); break;
      case "grp-battle": setBattle(g, el.dataset.on === "1"); break;
      case "grp-link-new": linkSheet(g); break;
      case "grp-file-new": fileAddSheet(g); break;
      case "grp-file-pick": pickGroupFile(g); break;
      case "grp-link-copy": { const it = itemOf(id), u = it && webLink((it.data || {}).url); if (u) copyText(u, "Link copied"); break; }
      case "grp-min-new": minutesSheet(g, null); break;
      case "grp-min-edit": { const it = itemOf(id); if (it && it.user_id === myId()) minutesSheet(g, it); break; }
      case "grp-q-new": askSheet(g); break;
      case "grp-q-open": if (itemOf(id)) threadSheet(id); break;
      case "grp-q-solve": { const q = itemOf(id); if (q && q.user_id === myId()) { const d = Object.assign({}, q.data, {solved: !(q.data || {}).solved}); saveQ(q, d).then(() => { drawThread(); patch(g.id); }).catch(e => toast(e.message)); } break; }
      case "grp-q-best": { const q = itemOf(id); if (q && q.user_id === myId()) { const was = (q.data || {}).best === el.dataset.a, d = Object.assign({}, q.data, {best: was ? "" : el.dataset.a, solved: was ? !!(q.data || {}).solved : true}); saveQ(q, d).then(() => { drawThread(); patch(g.id); }).catch(e => toast(e.message)); } break; }
      case "grp-q-del": { const a = itemOf(id); if (a && canRemove(g, a)) api.removeItem(a.id).then(() => { S.items[g.id] = S.items[g.id].filter(x => x.id !== a.id); drawThread(); patch(g.id); }).catch(e => toast(e.message)); break; }
      case "grp-weak-on": confirmSheet("Share Your Results?", "Your misses on this group's shared decks and quizzes are sent as totals per card, with no name attached. The group only sees how many members miss each card or question, once at least 3 members take part. Stop any time and your numbers are removed.", "Share Anonymously", () => { missSet(g.id, true); loadMisses(g.id, true); toast("Sharing your results anonymously"); }); break;
      case "grp-weak-off": missSet(g.id, false); api.forgetMisses(g.id).then(() => { toast("Stopped. Your numbers were removed."); loadMisses(g.id); }).catch(e => toast(e.message)); patch(g.id); break;
      case "grp-weak-retry": delete S.miss[g.id]; loadMisses(g.id, true); patch(g.id); break;
      case "grp-weak-deck": weakDeck(g); break;
    }
    return true;
  });
  document.addEventListener("submit", e => {
    if (!e.target || e.target.id !== "gkAnswer") return;
    e.preventDefault();
    const qid = e.target.dataset.q, q = itemOf(qid), ta = $("#gkAnswerIn"), body = str(ta && ta.value, GK.LIM.answer).trim();
    if (!q || !body) { if (ta) ta.focus(); return; }
    const btn = $("button[type=submit]", e.target); busyBtn(btn, true);
    ensureName(async () => {
      try { addRows(q.group_id, await api.addItems([{group_id: q.group_id, kind: "answer", ref_id: qid, title: str(body, 300), data: {v: 1, body}}])); if (ta) ta.value = ""; drawThread(); patch(q.group_id); }
      catch(err) { toast(err.message); busyBtn(btn, false); }
    });
  });

  /* Project Tasks (groups.sql 1.13) */
  const PT_ICON = gi('<rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M7.5 9.5l1.5 1.5 2.5-3M7.5 15.5l1.5 1.5 2.5-3M14 10h3.5M14 16h3.5"/>');
  const PT_FILTERS = [["all", "All"], ["mine", "Mine"], ["unassigned", "Unassigned"], ["overdue", "Overdue"], ["done", "Done"]];
  const PT_BFILTERS = [["all", "All"], ["mine", "Mine"], ["unassigned", "Unassigned"]];
  const PT_PRIO = [["", "None"], ["low", "Low"], ["med", "Medium"], ["high", "High"], ["urgent", "Urgent"]];
  const PT_STATUS = [["todo", "To Do"], ["doing", "In Progress"], ["review", "In Review"], ["done", "Done"]];
  const ptInit = gid => (S.pt[gid] = S.pt[gid] || {ok: false, lists: [], tasks: [], filter: "all", list: "", arch: false, draft: {title: "", who: "", due: ""}, view: "list", busy: false, err: "", setup: false});
  const ptX = gid => { const x = S.pt[gid]; return x && x.ok ? x : null; };
  const ptTaskOf = id => { for (const k in S.pt) { const t = (S.pt[k].tasks || []).find(x => x.id === id); if (t) return t; } return null; };
  const ptWd = d => parse(d).toLocaleDateString(undefined, {weekday: "short"});
  const ptDueTxt = d => GTL.dueLabel(d, todayISO(), ptWd, fmtShort);
  const ptWho = (gid, id) => id === myId() ? "You" : mName(gid, id);
  const ptPendAdd = id => S.ptPend.set(id, (S.ptPend.get(id) || 0) + 1);
  const ptPendDone = id => { const n = (S.ptPend.get(id) || 0) - 1; if (n > 0) S.ptPend.set(id, n); else S.ptPend.delete(id); };

  function ptDuePill(t, today){
    const c = GTL.due(t.due_at, today);
    if (c.k === "none") return "";
    const open = t.status !== "done";
    return `<span class="pt-due${open && c.late ? " late" : open && c.soon ? " soon" : ""}"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg>${esc(open ? ptDueTxt(t.due_at) : fmtShort(t.due_at))}</span>`;
  }
  function ptRow(g, t, today){
    const me = myId(), done = t.status === "done", late = !done && GTL.due(t.due_at, today).late, ms = S.members[g.id] || [];
    const who = t.assignee_id && ms.some(m => m.user_id === t.assignee_id) ? t.assignee_id : "";
    const chip = who ? `<span class="pt-who">${av(mName(g.id, who), who)}<span>${esc(who === me ? "You" : mName(g.id, who))}</span></span>` : `<span class="pt-who none">Unassigned</span>`;
    const mini = done ? `Done${t.completed_by ? " by " + esc(ptWho(g.id, t.completed_by)) : ""}` : "";
    const btns = (!done && !who ? `<button type="button" class="btn small" data-act="grp-pt-claim" data-id="${esc(t.id)}">Claim This</button>` : "");
    return `<li class="pt-task${done ? " is-done" : ""}${late ? " is-late" : ""}${t._tmp ? " is-saving" : ""}" data-id="${esc(t.id)}"${t._tmp ? ' aria-busy="true"' : ""}>
      <button type="button" class="pt-check" role="checkbox" aria-checked="${done}" data-act="grp-pt-done" data-id="${esc(t.id)}" aria-label="${done ? "Mark not done" : "Mark done"}: ${esc(str(t.title, 80))}"><span class="pt-box">${CHECK}</span></button>
      <div class="pt-body"><button type="button" class="pt-title" data-act="grp-pt-edit" data-id="${esc(t.id)}" aria-label="Edit task: ${esc(str(t.title, 80))}">${esc(t.title)}</button>
        <div class="pt-meta">${chip}${ptDuePill(t, today)}${t.priority === "high" || t.priority === "urgent" ? `<span class="pt-prio ${esc(t.priority)}">${t.priority === "urgent" ? "Urgent" : "High"}</span>` : ""}${t.status === "doing" ? `<span class="pt-prio doing">In progress</span>` : ""}${t.status === "review" && typeof gxReviewBtns === "function" ? gxReviewBtns(g, t) : ""}${mini ? `<span class="mini">${mini}</span>` : ""}${t.notes ? `<span class="mini pt-notes" title="${esc(str(t.notes, 300))}">${esc(str(t.notes, 70))}${t.notes.length > 70 ? "…" : ""}</span>` : ""}</div></div>
      ${btns ? `<div class="pt-act">${btns}</div>` : ""}</li>`;
  }
  function ptHtml(g){
    const x = S.pt[g.id], owner = isOwner(g), proj = isProj(g), head2 = `<h3 class="fsec">${PT_ICON}${proj ? "Tasks" : "Project Tasks"}`;
    if (!proj && !(x && x.ok && x.lists.length)) return `<div id="grpPT"></div>`;
    if (!x || (!x.ok && !x.setup && !x.err)) return S.items[g.id] ? `<section class="grp-sec" id="grpPT">${head2}</h3><p class="status-msg"><span class="ai-spin" aria-hidden="true"></span> Loading…</p></section>` : `<div id="grpPT"></div>`;
    if (!x.ok) {
      if (x.setup) return owner ? `<section class="grp-sec" id="grpPT">${head2}</h3><div class="grp-note">Project Tasks need the latest <b>groups.sql</b>. ${esc(srvSetup("This", "groups.sql"))}</div></section>` : `<div id="grpPT"></div>`;
      return `<section class="grp-sec" id="grpPT">${head2}</h3><div class="grp-err" role="alert"><span>${esc(x.err)}</span><button type="button" class="btn small" data-act="grp-pt-retry">Try Again</button></div></section>`;
    }
    const me = myId(), today = todayISO(), ms = (S.members[g.id] || []).filter(m => m.user_id === me || !S.blocked.has(m.user_id));
    const lists = x.lists.slice().sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    const curId = GTL.nextListId(lists, x.list, x.arch), cur = lists.find(l => l.id === curId) || null, nArch = lists.filter(l => l.archived).length;
    const activeIds = new Set(lists.filter(l => !l.archived).map(l => l.id)), openAll = x.tasks.filter(t => activeIds.has(t.list_id) && t.status !== "done" && !t.deleted).length;
    const err = x.err ? `<div class="grp-err" role="alert"><span>${esc(x.err)}</span><button type="button" class="btn small" data-act="grp-pt-retry">Try Again</button></div>` : "";
    const top = `${head2}<span class="n">${openAll} open</span><span class="spacer"></span></h3>`;
    if (proj) return ptProjHtml(g, x, top, err, activeIds);
    if (!lists.length) return `<section class="grp-sec grp-pt" id="grpPT">${top}${err}<p class="grp-none">Split up the work: make a list for a project, like “BIOL 201 Poster”, then add the first task.</p>${proj && GTL.isDay(g.project_due) ? `<div class="row-actions"><button type="button" class="btn small" data-act="grp-pt-plan">Start From a Plan</button></div>` : ""}</section>`;
    const chips = lists.filter(l => !l.archived || x.arch).map(l => {
      const n = x.tasks.filter(t => t.list_id === l.id && t.status !== "done" && !t.deleted).length;
      return `<button type="button" class="pt-chip${l.id === curId ? " on" : ""}${l.archived ? " arch" : ""}" data-act="grp-pt-list" data-id="${esc(l.id)}" aria-pressed="${l.id === curId}"><span>${esc(l.title)}</span><small>${l.archived ? "archived" : n + " open"}</small></button>`;
    }).join("");
    const archBtn = nArch ? `<button type="button" class="link-btn" data-act="grp-pt-arch" aria-pressed="${!!x.arch}">${x.arch ? "Hide" : "Show"} Archived (${nArch})</button>` : "";
    if (!cur) return `<section class="grp-sec grp-pt" id="grpPT">${top}${err}<div class="pt-lists">${chips}</div>${archBtn}<p class="grp-none">All your lists are archived. Make a new one, or show the archived ones.</p></section>`;
    const tasks = x.tasks.filter(t => t.list_id === cur.id && !t.deleted), pr = GTL.progress(tasks), cnt = GTL.counts(tasks, me, today);
    const shown = GTL.filter(tasks, x.filter, me, today), wl = ms.length > 1 ? GTL.workload(x.tasks.filter(t => activeIds.has(t.list_id)), ms, today) : null;
    const dr = x.draft || {}, canAdd = !cur.archived && GTL.canAddTask(tasks, cur.id);
    const opts = [`<option value="">Unassigned</option>`].concat(ms.slice().sort((a, b) => (b.user_id === me) - (a.user_id === me) || String(a.display_name).localeCompare(String(b.display_name)))
      .map(m => `<option value="${esc(m.user_id)}"${dr.who === m.user_id ? " selected" : ""}>${esc(m.user_id === me ? "Me" : m.display_name || "Member")}</option>`)).join("");
    const add = cur.archived ? `<p class="grp-none">This list is archived. Open List Options to restore it before adding tasks.</p>`
      : !canAdd ? `<p class="grp-none">This list is full (${GTL.LIM.tasks} tasks). Archive it and start a new list.</p>`
      : `<form class="pt-add" id="grpPTAdd" data-gid="${esc(g.id)}" data-list="${esc(cur.id)}" autocomplete="off">
          <input type="text" id="ptTitle" name="title" maxlength="${GTL.LIM.title}" required placeholder="Add a task, like “Draft the intro”" aria-label="New task" value="${esc(dr.title || "")}">
          <select id="ptWho" name="who" aria-label="Assign to">${opts}</select>
          <input type="date" id="ptDue" name="due" aria-label="Due date" value="${esc(dr.due || "")}">
          <button type="submit" class="btn primary">Add</button></form>`;
    const wlHtml = wl ? `<div class="pt-load-wrap"><ul class="pt-load" aria-label="Open tasks per person">${wl.rows.map(r => `<li class="${r.id === me ? "me" : ""}">${av(r.name, r.id)}<span><b>${esc(r.id === me ? "You" : r.name)}</b> ${r.open} open${r.overdue ? `, <span class="late">${r.overdue} overdue</span>` : ""}</span></li>`).join("")}${wl.unassigned ? `<li class="none"><span><b>Unassigned</b> ${wl.unassigned} open</span></li>` : ""}</ul>
        ${wl.uneven ? `<p class="mini pt-uneven">${esc(wl.uneven.hi)} has ${wl.uneven.gap} more open tasks than ${esc(wl.uneven.lo)}. Worth a quick look at the split.</p>` : ""}</div>` : "";
    const empty = !tasks.length ? `<p class="grp-none">Split up the work: add the first task.</p>`
      : !shown.length ? `<p class="grp-none">${{mine: "Nothing assigned to you here.", unassigned: "Every open task has an owner.", overdue: "Nothing is overdue.", done: "Nothing is done yet."}[x.filter] || "No tasks."}</p>` : "";
    return `<section class="grp-sec grp-pt" id="grpPT">${top}${err}
      <div class="pt-lists" role="group" aria-label="Task lists">${chips}</div>
      <div class="pt-listbar"><span class="pt-lname"><b>${esc(cur.title)}</b>${cur.course_code ? ` <span class="pill">${esc(cur.course_code)}</span>` : ""}</span>${proj ? `<span class="pt-view" role="group" aria-label="View">${[["list", "List"], ["board", "Board"]].map(([v, l]) => `<button type="button" class="pt-f${(x.view || "list") === v ? " on" : ""}" data-act="grp-pt-view" data-v="${v}" aria-pressed="${(x.view || "list") === v}">${l}</button>`).join("")}</span>` : ""}${proj && canAdd && GTL.isDay(g.project_due) ? `<button type="button" class="btn small" data-act="grp-pt-plan">Start From a Plan</button>` : ""}${archBtn}<button type="button" class="btn small" data-act="grp-pt-list-edit" data-id="${esc(cur.id)}">List Options</button></div>
      <div class="pt-prog"><div class="score-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pr.pct}" aria-label="Progress on ${esc(cur.title)}"><i style="width:${pr.pct}%"></i></div><span class="mini">${pr.done} of ${pr.total} done</span></div>
      ${wlHtml}${add}
      ${proj && (x.view || "list") === "board" ? ptBoard(g, tasks, today) : `<div class="pt-filters" role="group" aria-label="Filter tasks">${PT_FILTERS.map(([k, l]) => `<button type="button" class="pt-f${x.filter === k ? " on" : ""}" data-act="grp-pt-filter" data-f="${k}" aria-pressed="${x.filter === k}">${l}${k === "all" ? "" : ` <small>${cnt[k]}</small>`}</button>`).join("")}</div>
      ${shown.length ? `<ul class="pt-tasks" aria-label="Tasks in ${esc(cur.title)}">${shown.map(t => ptRow(g, t, today)).join("")}</ul>` : empty}`}</section>`;
  }
  // A group project has just tasks
  function ptProjHtml(g, x, top, err, activeIds){
    const me = myId(), today = todayISO(), ms = (S.members[g.id] || []).filter(m => m.user_id === me || !S.blocked.has(m.user_id));
    const tasks = x.tasks.filter(t => activeIds.has(t.list_id) && !t.deleted), pr = GTL.progress(tasks), wl = ms.length > 1 ? GTL.workload(tasks, ms, today) : null;
    const wlHtml = wl && wl.uneven ? `<p class="mini pt-uneven">${esc(wl.uneven.hi)} has ${wl.uneven.gap} more open tasks than ${esc(wl.uneven.lo)}. Worth a quick look at the split.</p>` : "";
    const empty = `<p class="grp-none">Split up the work: tap Add Task at the bottom right to add the first one, or describe the project and let ${esc(aiWho("AI"))} suggest tasks.</p>`;
    const bf = PT_BFILTERS.some(f => f[0] === x.bf) ? x.bf : "all", pick = f => f === "mine" ? tasks.filter(t => t.assignee_id === me) : f === "unassigned" ? tasks.filter(t => !t.assignee_id && t.status !== "done") : tasks;
    const filters = tasks.length ? `<div class="pt-filters" role="group" aria-label="Show tasks">${PT_BFILTERS.map(([k, l]) => `<button type="button" class="pt-f${bf === k ? " on" : ""}" data-act="grp-pt-bfilter" data-f="${k}" aria-pressed="${bf === k}">${l}${k === "all" ? "" : ` <small>${pick(k).filter(t => t.status !== "done").length}</small>`}</button>`).join("")}</div>` : "";
    return `<section class="grp-sec grp-pt" id="grpPT">${top}${err}
      <div class="pt-listbar"><button type="button" class="btn small ai-btn" data-act="grp-pt-plan">${AI_ICON} Start From a Plan</button></div>
      <div class="pt-prog"><div class="score-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pr.pct}" aria-label="Project progress"><i style="width:${pr.pct}%"></i></div><span class="mini">${pr.done} of ${pr.total} done</span></div>
      ${wlHtml}${tasks.length ? "" : empty}${filters}
      ${ptBoard(g, pick(bf), today)}</section>`;
  }
  // The one list a project's tasks go on
  async function ptDefaultList(g){
    const x = ptX(g.id); if (!x) return null;
    let list = x.lists.find(l => !l.archived);
    if (!list) { list = await api.ptNewList(g.id, "Tasks", g.course || ""); if (list && !x.lists.some(l => l.id === list.id)) x.lists.push(list); }
    return list;
  }
  function ptAddSheet(g){
    const x = ptX(g.id); if (!x) { toast("Tasks aren't ready yet. Try again in a moment."); return; }
    const me = myId(), ms = (S.members[g.id] || []).filter(m => m.user_id === me || !S.blocked.has(m.user_id));
    openSheet(`<form class="sheet">${head("Add Task")}<div class="sheet-body">${REQ_NOTE}
      <label class="f"><span class="lh">Task ${REQ}</span><input type="text" name="title" required maxlength="${GTL.LIM.title}" autofocus placeholder="e.g. Draft the intro"></label>
      <div class="two"><label class="f"><span class="lh">Assigned To <span class="hint">optional</span></span><select name="who"><option value="">Unassigned</option>${ms.slice().sort((a, b) => (b.user_id === me) - (a.user_id === me) || String(a.display_name).localeCompare(String(b.display_name))).map(m => `<option value="${esc(m.user_id)}">${esc(m.user_id === me ? "Me" : m.display_name || "Member")}</option>`).join("")}</select></label>
      <label class="f"><span class="lh">Due Date <span class="hint">optional</span></span><input type="date" name="due"></label></div></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit id="ptAddGo">Add Task</button></div></form>`, fd => {
      const title = GTL.clamp(fd.get("title"), GTL.LIM.title); if (!title) return false;
      const who = String(fd.get("who") || ""), due = String(fd.get("due") || ""), b = $("#ptAddGo"); busyBtn(b, true);
      (async () => {
        try {
          const list = await ptDefaultList(g); if (!list) throw new Error("Couldn't start the task list. Try again.");
          const ok = await ptAddTask(g.id, list.id, title, who, due);
          if (ok && dlg.open) dlg.close(); else busyBtn(b, false);
        } catch(e) { busyBtn(b, false); toast(e.message); }
      })();
      return false;
    });
  }
  // Redraw the section in place and keep the cursor where it was
  function swapPT(g){
    const el = $("#grpPT"); if (!el || !g) return;
    if (kbDrag && !kbDrag.justDragged) { kbDrag.dirty = true; return; }
    const a = document.activeElement, inside = a && el.contains(a), key = inside ? a.id || "" : "", sel = inside && "selectionStart" in a ? [a.selectionStart, a.selectionEnd] : null;
    const act = inside && !key && a.dataset ? {act: a.dataset.act, id: a.dataset.id, f: a.dataset.f} : null;
    replaceKeep(el, ptHtml(g), "grpPT");
    if (key) { const n = document.getElementById(key); if (n) { n.focus(); if (sel) { try { n.setSelectionRange(sel[0], sel[1]); } catch(e) {} } } }
    else if (act && act.act) { const n = $(`#grpPT [data-act="${act.act}"]${act.id ? `[data-id="${CSS.escape(act.id)}"]` : ""}${act.f ? `[data-f="${CSS.escape(act.f)}"]` : ""}`); if (n) n.focus(); }
  }
  const ptRefresh = gid => { const g = groupOf(gid); if (ui.tab === "groups" && ui.grp === gid && g) { swapPT(g); if (isProj(g)) swapEl("grpOverview", overviewHtml(g)); } };

  /* Mine: the planner's read-through list */
  const MINEK = () => "sb:gtmine:" + myId();
  function readMine(){ try { const o = JSON.parse(localStorage.getItem(MINEK()) || "null"); return o && typeof o.rows === "object" ? o.rows : {}; } catch(e) { return {}; } }
  function persistMine(){ try { localStorage.setItem(MINEK(), JSON.stringify({at: Date.now(), rows: S.mine})); } catch(e) {} }
  function mineRows(opts){
    if (S.mineFor !== myId()) { S.mineFor = myId(); S.mine = myId() ? readMine() : {}; }
    const known = S.groups ? new Set(S.groups.map(g => g.id)) : null;
    return Object.keys(S.mine).filter(gid => !known || known.has(gid)).reduce((a, gid) => a.concat(S.mine[gid] || []), [])
      .filter(r => r && r.id && (!opts || !opts.groupId || r.gid === opts.groupId) && ((opts && opts.all) || r.status !== "done")).sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999") || String(a.title).localeCompare(String(b.title)));
  }
  function deriveMineFor(gid){
    const x = ptX(gid), g = groupOf(gid); if (!x) return;
    const was = JSON.stringify(S.mine[gid] || []);
    S.mine[gid] = GTL.deriveMine(x.tasks, x.lists, g ? g.name : "", gid, myId(), true); persistMine(); decorateBoard();
    if (JSON.stringify(S.mine[gid]) !== was) boardRefresh();
  }
  async function loadMine(){
    if (!online() || S.mineBusy || S.mineOff) return;
    S.mineBusy = true; const id = myId(); mineRows();
    try {
      const gs = await api.groups() || [], names = {}; gs.forEach(g => { names[g.id] = g.name; });
      const rows = gs.length ? await api.ptMine() || [] : [], gids = [...new Set(rows.map(r => r.group_id))];
      const lists = gids.length ? await api.ptListsIn(gids) || [] : [];
      if (myId() !== id) return;
      const next = {};
      gs.forEach(g => { if (ptX(g.id)) next[g.id] = S.mine[g.id] || []; });
      gids.forEach(gid => { if (!ptX(gid)) next[gid] = GTL.deriveMine(rows.filter(r => r.group_id === gid), lists.filter(l => l.group_id === gid), names[gid], gid, id, true); });
      const had = new Set(mineRows().map(r => r.id)), seen = readSeen();
      S.mine = next; persistMine(); S.mineAt = Date.now();
      if (!seen) markSeen(mineRows().map(r => r.id));
      else { const fresh = mineRows().filter(r => !had.has(r.id) && !seen.has(r.id) && r.by && r.by !== id); markSeen(mineRows().map(r => r.id)); if (fresh.length) announceAssigned(fresh); }
      announceDue();
    } catch(e) { if (e && e.setup) S.mineOff = true; S.mineAt = Date.now() - 240000; }
    S.mineBusy = false; decorateBoard(); boardRefresh();
  }
  // Change one of my group tasks from the Task Board
  function setMineStatus(id, status){
    if (!PT_STATUS.some(k => k[0] === status)) return Promise.resolve();
    const r = mineRows({all: true}).find(k => k.id === id); if (!r || (r.status || "todo") === status) return Promise.resolve();
    const x = ptX(r.gid);
    if (x && x.tasks.some(t => t.id === id)) return ptMutate(r.gid, id, {status});
    const rows = S.mine[r.gid] || [];
    S.mine[r.gid] = rows.map(k => k.id === id ? Object.assign({}, k, {status}) : k); persistMine(); decorateBoard(); boardRefresh();
    return api.ptUpd(id, {status}).then(() => { if (status === "done") toast(`Done: ${str(r.title, 50)}`); if (S.pt[r.gid]) loadPT(r.gid); })
      .catch(e => { S.mine[r.gid] = rows; persistMine(); decorateBoard(); boardRefresh(); toast(e.message); });
  }
  // Where I dragged my group tasks on the Task Board
  const ORDK = () => "sb:gtorder:" + myId();
  const readOrders = () => { try { const o = JSON.parse(localStorage.getItem(ORDK()) || "null"); return o && typeof o === "object" && !Array.isArray(o) ? o : {}; } catch(e) { return {}; } };
  const SEENK = () => "sb:gtseen:" + myId();
  function readSeen(){ try { const a = JSON.parse(localStorage.getItem(SEENK()) || "null"); return Array.isArray(a) ? new Set(a) : null; } catch(e) { return null; } }
  function markSeen(ids){ try { const s = readSeen() || new Set(); ids.forEach(i => s.add(i)); localStorage.setItem(SEENK(), JSON.stringify([...s].slice(-400))); } catch(e) {} }
  // A task someone else just gave me, and one that is due tomorrow
  function announceAssigned(list){
    markSeen(list.map(t => t.id));
    const t = list[0], by = t.by && t.by !== myId() ? mName(t.gid, t.by) : "Someone";
    toast(list.length === 1 ? `${by} gave you a task: ${str(t.title, 50)}` : `${plural(list.length, "new group task")} assigned to you`, null, {label: "View", fn: () => openGroupTask(t)});
  }
  function announceDue(){
    const today = todayISO(), key = "sb:gtdue:" + myId() + ":" + today;
    try { if (localStorage.getItem(key)) return; } catch(e) { return; }
    const rows = mineRows().filter(r => GTL.due(r.due, today).k === "tomorrow");
    if (!rows.length) return;
    try { localStorage.setItem(key, "1"); } catch(e) {}
    toast(rows.length === 1 ? `Group task due tomorrow: ${str(rows[0].title, 50)}` : `${plural(rows.length, "group task")} due tomorrow`, null, {label: "View", fn: () => openGroupTask(rows[0])});
  }
  function openGroupTask(r){
    if (!r) return;
    const x = ptInit(r.gid); x.list = r.listId || x.list; S.tab[r.gid] = "tasks";
    openGroup(r.gid); setTimeout(() => { const s = $("#grpPT"); if (s) s.scrollIntoView({block: "start"}); }, 500);
  }
  // The card under Today's Plan on the Board tab
  function decorateBoard(){
    if (ui.tab !== "board") return;
    const v = $("#view"), pane = v && $(".bpane-plan", v); if (!pane) return;
    const old = $("#grpMine", pane); if (old) old.remove();
    const rows = mineRows(); if (!rows.length) return;
    const today = todayISO(), wk = GTL.weekDue(rows, today), shown = rows.slice(0, 5), one = [...new Set(rows.map(r => r.gid))].length === 1;
    const sum = [wk.week ? `${plural(wk.week, "group task")} due this week` : `${plural(rows.length, "group task")} assigned to you`, wk.late ? `${wk.late} overdue` : ""].filter(Boolean).join(" · ");
    const li = r => { const c = GTL.due(r.due, today);
      return `<li class="gm-row${c.late ? " is-late" : ""}"><button type="button" class="pt-check" role="checkbox" aria-checked="false" data-act="grp-pt-done" data-id="${esc(r.id)}" data-g="${esc(r.gid)}" aria-label="Mark done: ${esc(str(r.title, 80))}"><span class="pt-box">${CHECK}</span></button>
        <button type="button" class="gm-main" data-act="grp-pt-open" data-g="${esc(r.gid)}" data-l="${esc(r.listId)}" data-id="${esc(r.id)}"><span class="gm-title">${esc(r.title)}</span>
          <span class="pt-meta"><span class="gm-badge" title="${esc(r.groupName)}">${esc(r.badge)}</span>${r.due ? `<span class="pt-due${c.late ? " late" : c.soon ? " soon" : ""}">${esc(ptDueTxt(r.due))}</span>` : ""}<span class="mini">about ${r.hours}h</span></span></button></li>`; };
    pane.insertAdjacentHTML("beforeend", `<section class="grp-mine" id="grpMine" aria-label="Group tasks assigned to you"><h3 class="fsec">${PT_ICON}My Group Tasks<span class="n">${rows.length}</span></h3>
      <p class="mini gm-sum">${esc(sum)}. <button type="button" class="link-btn" data-act="${one ? "grp-pt-open" : "grp-page"}" data-g="${esc(rows[0].gid)}" data-l="${esc(rows[0].listId)}">${one ? "Open the Group" : "Open Study Groups"}</button></p>
      <ul class="gm-list">${shown.map(li).join("")}</ul>${rows.length > shown.length ? `<p class="mini">+${rows.length - shown.length} more in your groups</p>` : ""}</section>`);
  }

  /* Loading and live updates */
  async function loadPT(gid){
    if (!online()) return;
    const x = ptInit(gid);
    if (x.busy) { x.again = true; return; }
    x.busy = true;
    try {
      await loadBlocks();
      const [ls, ts2] = await Promise.all([api.ptLists(gid), api.ptTasks(gid)]);
      const lists = (ls || []).filter(l => !l.created_by || !S.blocked.has(l.created_by)), ids = new Set(lists.map(l => l.id));
      const tasks = (ts2 || []).filter(t => ids.has(t.list_id) && (!t.created_by || !S.blocked.has(t.created_by)));
      const prev = x.tasks, wasOk = x.ok;
      x.tasks = GTL.reconcile(prev, tasks, S.ptPend); x.lists = lists; x.ok = true; x.setup = false; x.err = "";
      x.list = GTL.nextListId(lists, x.list, x.arch);
      if (wasOk) { const seen = readSeen() || new Set(), fresh = GTL.newlyAssigned(prev, x.tasks, myId(), seen); if (fresh.length) announceAssigned(fresh.map(t => ({id: t.id, gid, listId: t.list_id, title: t.title, by: t.updated_by}))); }
      else markSeen(x.tasks.filter(t => t.assignee_id === myId()).map(t => t.id));
      deriveMineFor(gid);
      if (ui.grp === gid) subscribePT(gid);
    } catch(e) { if (e.setup) { x.ok = false; x.setup = true; } else x.err = e.message; }
    x.busy = false;
    if (x.again) { x.again = false; loadPT(gid); return; }
    ptRefresh(gid);
  }
  function subscribePT(gid){
    if (S.subT === gid || S.subGid !== gid) return;
    if (S.unsubT) S.unsubT();
    S.subT = gid;
    S.unsubT = api.listenTasks(gid, () => { clearTimeout(S.ptT); S.ptT = setTimeout(() => loadPT(gid), 400); });
  }

  /* Changing things */
  function ptMutate(gid, id, patch){
    const x = ptX(gid), i = x ? x.tasks.findIndex(t => t.id === id) : -1; if (i < 0) return Promise.resolve();
    const snap = x.tasks[i], was = snap.status;
    x.tasks[i] = GTL.applyPatch(snap, patch, myId(), new Date().toISOString());
    ptPendAdd(id); deriveMineFor(gid); ptRefresh(gid);
    return api.ptUpd(id, patch).then(row => {
      ptPendDone(id);
      const j = x.tasks.findIndex(t => t.id === id);
      if (j >= 0 && row && !S.ptPend.has(id)) x.tasks[j] = row;
      deriveMineFor(gid); ptRefresh(gid);
      if (patch.status === "done" && was !== "done") ptCelebrate(gid, id, was);
    }).catch(e => {
      ptPendDone(id);
      const j = x.tasks.findIndex(t => t.id === id);
      if (j >= 0) x.tasks[j] = snap;
      deriveMineFor(gid); ptRefresh(gid); toast(e.message);
      if (!/permission|isn't there|only the/i.test(e.message)) return; loadPT(gid);
    });
  }
  function ptCelebrate(gid, id, was){
    const x = ptX(gid), t = x && x.tasks.find(k => k.id === id); if (!t) return;
    const all = x.tasks.filter(k => k.list_id === t.list_id && !k.deleted), l = x.lists.find(k => k.id === t.list_id);
    const undo = () => { const k = ptX(gid) && ptX(gid).tasks.find(z => z.id === id); if (k && k.status === "done") ptMutate(gid, id, {status: was && was !== "done" ? was : "todo"}); };
    if (all.length >= 2 && all.every(k => k.status === "done")) {
      toast(`Everything on ${l ? l.title : "the list"} is done. Nice teamwork.`, undo);
      try { if (typeof celebrate === "function") celebrate("check"); } catch(e) {}
    } else toast(`Done: ${str(t.title, 50)}`, undo);
  }
  async function ptAddTask(gid, listId, title, who, due){
    const x = ptX(gid); if (!x) return false;
    title = GTL.clamp(title, GTL.LIM.title); if (!title) return false;
    if (!GTL.canAddTask(x.tasks, listId)) { toast(`A list holds up to ${GTL.LIM.tasks} tasks. Start a new list.`); return false; }
    const now = new Date().toISOString(), tmp = {id: "tmp-" + uid(), list_id: listId, group_id: gid, title, notes: "", status: "todo", assignee_id: who || null, due_at: GTL.isDay(due) ? due : null, priority: null,
      position: Math.max(0, ...x.tasks.filter(t => t.list_id === listId).map(t => t.position || 0)) + 1, created_by: myId(), created_at: now, updated_by: myId(), updated_at: now, completed_at: null, completed_by: null, deleted: false, _tmp: true};
    x.tasks.push(tmp); ptPendAdd(tmp.id); x.draft = {title: "", who: "", due: ""}; ptRefresh(gid);
    try {
      const row = await api.ptAdd(listId, title, who || null, tmp.due_at, "", null);
      ptPendDone(tmp.id);
      const j = x.tasks.findIndex(t => t.id === tmp.id);
      if (j >= 0) x.tasks[j] = row; else if (row && !x.tasks.some(t => t.id === row.id)) x.tasks.push(row);
      deriveMineFor(gid); ptRefresh(gid);
      if (who && who !== myId()) toast(`Added for ${mName(gid, who)}`);
      return true;
    } catch(e) {
      ptPendDone(tmp.id); x.tasks = x.tasks.filter(t => t.id !== tmp.id);
      x.draft = {title, who: who || "", due: due || ""}; ptRefresh(gid); toast(e.message); return false;
    }
  }
  function ptMove(gid, id, dir){
    const x = ptX(gid), t = x && x.tasks.find(k => k.id === id); if (!t) return;
    const snapP = new Map(x.tasks.filter(k => k.list_id === t.list_id).map(k => [k.id, k.position])), map = GTL.move(x.tasks.filter(k => k.list_id === t.list_id), id, dir);
    if (!Object.keys(map).length) return;
    x.tasks.forEach(k => { if (map[k.id] != null) k.position = map[k.id]; });
    ptPendAdd(id); ptRefresh(gid);
    api.ptMove(id, dir).then(() => ptPendDone(id)).catch(e => { ptPendDone(id); x.tasks.forEach(k => { if (snapP.has(k.id)) k.position = snapP.get(k.id); }); ptRefresh(gid); toast(e.message); });
  }
  async function ptToggle(id, gid){
    const x = ptX(gid), t = x && x.tasks.find(k => k.id === id);
    if (t) { if (t._tmp) return; return ptMutate(gid, id, {status: t.status === "done" ? "todo" : "done"}); }
    const rows = S.mine[gid] || [], r = rows.find(k => k.id === id); if (!r) return;
    S.mine[gid] = rows.map(k => k.id === id ? Object.assign({}, k, {status: "done"}) : k); persistMine(); decorateBoard(); boardRefresh();
    const undo = async () => {
      S.mine[gid] = (S.mine[gid] || []).map(k => k.id === id ? Object.assign({}, k, {status: r.status || "todo"}) : k); persistMine(); decorateBoard(); boardRefresh();
      try { await api.ptUpd(id, {status: r.status && r.status !== "done" ? r.status : "todo"}); if (S.pt[gid]) loadPT(gid); } catch(e) { toast(e.message); }
    };
    try { await api.ptUpd(id, {status: "done"}); toast(`Done: ${str(r.title, 50)}`, undo); if (S.pt[gid]) loadPT(gid); }
    catch(e) { S.mine[gid] = rows; persistMine(); decorateBoard(); boardRefresh(); toast(e.message); }
  }

  /* Sheets */
  function ptListSheet(g, list){
    const x = ptX(g.id); if (!x) return;
    if (!list && !GTL.canAddList(x.lists)) { toast(`A group can keep ${GTL.LIM.lists} active task lists. Archive or delete one first.`); return; }
    const owner = isOwner(g), me = myId(), codes = [...new Set(coursesArr().map(c => c.code).filter(Boolean).concat(g.course ? [g.course] : []))].slice(0, 20);
    const canDel = list && GTL.canDeleteList(list, me, owner);
    openSheet(`<form class="sheet">${head(list ? "List Options" : "New Task List")}<div class="sheet-body">${REQ_NOTE}
      <label class="f"><span class="lh">List Name ${REQ}</span><input type="text" name="title" required maxlength="${GTL.LIM.listTitle}" autofocus value="${esc(list ? list.title : "")}" placeholder="e.g. BIOL 201 Poster"></label>
      <label class="f"><span class="lh">Course Code <span class="hint">optional</span></span><input type="text" name="course" maxlength="${GTL.LIM.course}" list="ptCodes" value="${esc(list ? list.course_code : g.course || "")}" placeholder="e.g. BIOL 201"><datalist id="ptCodes">${codes.map(c => `<option value="${esc(c)}">`).join("")}</datalist></label>
      ${list ? `<div class="pt-sheet-acts"><button type="button" class="btn" data-act="grp-pt-list-arch" data-id="${esc(list.id)}">${list.archived ? "Restore List" : "Archive List"}</button>${canDel ? `<button type="button" class="btn danger" data-act="grp-pt-list-del" data-id="${esc(list.id)}">Delete List</button>` : ""}</div>
        <p class="mini" style="margin:0">Archiving hides the list and its tasks from everyone but keeps them. Deleting removes the list and all its tasks for the whole group${canDel ? "" : ", and only the group owner or whoever made the list can do that"}.</p>` : ""}</div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>${list ? "Save" : "Create List"}</button></div></form>`, fd => {
      const title = GTL.clamp(fd.get("title"), GTL.LIM.listTitle), code = GTL.clamp(fd.get("course"), GTL.LIM.course); if (!title) return false;
      (async () => {
        try {
          if (list) {
            if (title === list.title && code === list.course_code) return;
            const row = await api.ptUpdList(list.id, {title, course_code: code});
            Object.assign(list, row || {title, course_code: code}); deriveMineFor(g.id); ptRefresh(g.id);
          } else {
            const row = await api.ptNewList(g.id, title, code);
            if (row && !x.lists.some(l => l.id === row.id)) x.lists.push(row);
            x.list = row ? row.id : x.list; x.filter = "all"; ptRefresh(g.id); toast(`Made the list ${title}`);
          }
        } catch(e) { toast(e.message); }
      })();
    });
  }
  function ptEditSheet(t){
    const g = groupOf(t.group_id), x = ptX(t.group_id); if (!g || !x || t._tmp) return;
    const owner = isOwner(g), me = myId(), ms = (S.members[g.id] || []).filter(m => m.user_id === me || !S.blocked.has(m.user_id));
    const canRe = GTL.canReassign(t, me, owner), canDel = GTL.canDeleteTask(t, me, owner), cur = ms.some(m => m.user_id === t.assignee_id) ? t.assignee_id : "";
    const whoName = cur ? ptWho(g.id, cur) : "someone";
    openSheet(`<form class="sheet">${head("Edit Task")}<div class="sheet-body">${REQ_NOTE}
      <label class="f"><span class="lh">Task ${REQ}</span><input type="text" name="title" required maxlength="${GTL.LIM.title}" autofocus value="${esc(t.title)}"></label>
      <div class="two"><label class="f"><span class="lh">Assigned To</span><select name="who"${canRe ? "" : " disabled"}><option value="">Unassigned</option>${ms.map(m => `<option value="${esc(m.user_id)}"${m.user_id === cur ? " selected" : ""}>${esc(m.user_id === me ? "Me" : m.display_name || "Member")}</option>`).join("")}</select></label>
        <label class="f"><span class="lh">Due Date <span class="hint">optional</span></span><input type="date" name="due" value="${esc(t.due_at || "")}"></label></div>
      ${canRe ? "" : `<p class="mini" style="margin:-6px 0 0">Only ${esc(whoName)} or the group owner can change who this is assigned to.</p>`}
      <div class="two"><label class="f"><span class="lh">Status</span><select name="status">${PT_STATUS.map(([v, l]) => `<option value="${v}"${t.status === v ? " selected" : ""}>${l}</option>`).join("")}</select></label>
        <label class="f"><span class="lh">Priority</span><select name="priority">${PT_PRIO.map(([v, l]) => `<option value="${v}"${(t.priority || "") === v ? " selected" : ""}>${l}</option>`).join("")}</select></label></div>
      ${typeof gxReviewerField === "function" ? gxReviewerField(g, t) : ""}
      <label class="f"><span class="lh">Notes <span class="hint">optional, up to ${GTL.LIM.notes} characters</span></span><textarea name="notes" rows="3" maxlength="${GTL.LIM.notes}" placeholder="What done looks like, links, who to ask">${esc(t.notes || "")}</textarea></label>
      <div class="pt-sheet-acts">${!cur && t.status !== "done" && canRe ? `<button type="button" class="btn primary" data-act="grp-pt-claim-sheet">Claim This</button>` : ""}<button type="button" class="btn" data-act="grp-pt-move" data-id="${esc(t.id)}" data-dir="-1">Move Up</button><button type="button" class="btn" data-act="grp-pt-move" data-id="${esc(t.id)}" data-dir="1">Move Down</button></div>
      <p class="mini" style="margin:0">Added by ${esc(t.created_by ? ptWho(g.id, t.created_by) : "a former member")} ${esc(ago(t.created_at, 1))}${t.updated_by && ts(t.updated_at) - ts(t.created_at) > 2000 ? ` · Last changed ${esc(ago(t.updated_at, 1))} by ${esc(ptWho(g.id, t.updated_by))}` : ""}${t.status === "done" && t.completed_by ? ` · Done by ${esc(ptWho(g.id, t.completed_by))}` : ""}</p></div>
      <div class="sheet-foot">${canDel ? `<button type="button" class="btn danger" data-act="grp-pt-del" data-id="${esc(t.id)}">Delete</button>` : ""}<span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>Save</button></div></form>`, fd => {
      const title = GTL.clamp(fd.get("title"), GTL.LIM.title); if (!title) return false;
      const patch = {}, due = String(fd.get("due") || ""), notes = String(fd.get("notes") || "").trim().slice(0, GTL.LIM.notes), st = String(fd.get("status") || t.status), pr = String(fd.get("priority") || "");
      if (title !== t.title) patch.title = title;
      if (notes !== (t.notes || "")) patch.notes = notes;
      if (PT_STATUS.some(s => s[0] === st) && st !== t.status) patch.status = st;
      if ((due || null) !== (t.due_at || null) && (!due || GTL.isDay(due))) patch.due_at = due || null;
      if (pr !== (t.priority || "") && PT_PRIO.some(p => p[0] === pr)) patch.priority = pr || null;
      if (canRe && fd.has("who")) { const w = String(fd.get("who") || ""); if ((w || null) !== (t.assignee_id || null) && (!w || ms.some(m => m.user_id === w))) patch.assignee_id = w || null; }
      if (fd.has("reviewer")) { const rv = String(fd.get("reviewer") || ""); if ((rv || null) !== (t.reviewer_id || null) && (!rv || ms.some(m => m.user_id === rv))) patch.reviewer_id = rv || null; }
      if (Object.keys(patch).length) ptMutate(g.id, t.id, patch);
    });
  }

  /* Actions and forms */
  hook("act", (act, el, id) => {
    if (!act.startsWith("grp-pt-")) return false;
    const gid = (el && el.dataset && el.dataset.g) || ui.grp, g = groupOf(ui.grp), x = g ? ptX(g.id) : null;
    switch (act) {
      case "grp-pt-view": if (x) { x.view = el.dataset.v === "board" ? "board" : "list"; ptRefresh(g.id); } return true;
      case "grp-pt-status": { const t = x && x.tasks.find(k => k.id === id); if (t && !t._tmp && PT_STATUS.some(k => k[0] === el.dataset.s)) ptMutate(g.id, id, {status: el.dataset.s}); return true; }
      case "grp-pt-plan": if (g && isProj(g)) planSheet(g); return true;
      case "grp-pt-new": if (g && isProj(g)) ptAddSheet(g); return true;
      case "grp-pt-retry": if (g) { ptInit(g.id).err = ""; loadPT(g.id); ptRefresh(g.id); } return true;
      case "grp-pt-list": if (x) { x.list = id; x.filter = "all"; ptRefresh(g.id); } return true;
      case "grp-pt-arch": if (x) { x.arch = !x.arch; x.list = GTL.nextListId(x.lists, x.list, x.arch); ptRefresh(g.id); } return true;
      case "grp-pt-filter": if (x) { x.filter = PT_FILTERS.some(f => f[0] === el.dataset.f) ? el.dataset.f : "all"; ptRefresh(g.id); } return true;
      case "grp-pt-list-new": if (g && x) ptListSheet(g, null); return true;
      case "grp-pt-list-edit": { const l = x && x.lists.find(k => k.id === id); if (l) ptListSheet(g, l); return true; }
      case "grp-pt-list-arch": { const l = x && x.lists.find(k => k.id === id); if (!l) return true;
        if (l.archived && !GTL.canAddList(x.lists)) { toast(`A group can keep ${GTL.LIM.lists} active task lists. Archive another one first.`); return true; }
        if (dlg.open) dlg.close();
        const was = l.archived; l.archived = !was; x.list = GTL.nextListId(x.lists, was ? l.id : x.list, x.arch); deriveMineFor(g.id); ptRefresh(g.id);
        api.ptUpdList(l.id, {archived: !was}).then(() => toast(was ? `Restored ${l.title}` : `Archived ${l.title}`)).catch(e => { l.archived = was; deriveMineFor(g.id); ptRefresh(g.id); toast(e.message); });
        return true; }
      case "grp-pt-list-del": { const l = x && x.lists.find(k => k.id === id); if (!l) return true;
        if (dlg.open) dlg.close();
        confirmSheet(`Delete ${l.title}?`, "The list and every task on it are deleted for the whole group. Archive it instead to keep them.", "Delete List", async () => {
          try { await api.ptDelList(l.id); x.lists = x.lists.filter(k => k.id !== l.id); x.tasks = x.tasks.filter(k => k.list_id !== l.id); x.list = GTL.nextListId(x.lists, x.list, x.arch); deriveMineFor(g.id); ptRefresh(g.id); toast(`Deleted ${l.title}`); }
          catch(e) { toast(e.message); } });
        return true; }
      case "grp-pt-done": { const t = ptTaskOf(id); ptToggle(id, t ? t.group_id : gid); return true; }
      case "grp-pt-claim": { const t = ptTaskOf(id); if (t) ptMutate(t.group_id, id, {assignee_id: myId()}); return true; }
      case "grp-pt-claim-sheet": { const f = el.closest("form"), w = f && f.querySelector('select[name="who"]'), go = f && f.querySelector("[data-submit]"); if (w && go) { w.value = myId(); go.click(); } return true; }
      case "grp-pt-bfilter": if (x) { x.bf = PT_BFILTERS.some(f => f[0] === el.dataset.f) ? el.dataset.f : "all"; ptRefresh(g.id); } return true;
      case "grp-pt-claim-one": { if (!g || !x) return true; const live = new Set(x.lists.filter(l => !l.archived).map(l => l.id));
        const t = x.tasks.filter(k => live.has(k.list_id) && !k.deleted && !k._tmp && k.status !== "done" && !k.assignee_id).sort((a, b) => String(a.due_at || "9999").localeCompare(String(b.due_at || "9999")) || (a.position - b.position))[0];
        showTab(g, "tasks"); if (t) ptEditSheet(t); return true; }
      case "grp-pt-edit": { const t = ptTaskOf(id); if (t) ptEditSheet(t); return true; }
      case "grp-pt-move": { const t = ptTaskOf(id); if (t) ptMove(t.group_id, id, Number(el.dataset.dir) < 0 ? -1 : 1); return true; }
      case "grp-pt-del": { const t = ptTaskOf(id); if (!t) return true;
        if (dlg.open) dlg.close();
        confirmSheet("Delete This Task?", `${t.title} is removed for the whole group.`, "Delete", async () => {
          const xx = ptX(t.group_id); if (!xx) return; const i = xx.tasks.findIndex(k => k.id === id), snap = xx.tasks[i];
          xx.tasks.splice(i, 1); deriveMineFor(t.group_id); ptRefresh(t.group_id);
          try { await api.ptDel(id); toast("Task deleted"); } catch(e) { xx.tasks.splice(Math.min(i, xx.tasks.length), 0, snap); deriveMineFor(t.group_id); ptRefresh(t.group_id); toast(e.message); } });
        return true; }
      case "grp-pt-open": { const r = mineRows().find(k => k.id === id) || {gid: el.dataset.g, listId: el.dataset.l}; if (r.gid) openGroupTask(r); return true; }
    }
    return false;
  });
  // The add row of a study group's task list
  document.addEventListener("submit", e => {
    const f = e.target; if (!f || f.id !== "grpPTAdd") return;
    e.preventDefault();
    const fd = new FormData(f), gid = f.dataset.gid, title = String(fd.get("title") || "");
    if (!title.trim()) { const i = $("#ptTitle"); if (i) i.focus(); return; }
    ptAddTask(gid, f.dataset.list, title, String(fd.get("who") || ""), String(fd.get("due") || "")).then(ok => { if (ok) { const i = $("#ptTitle"); if (i) i.focus(); } });
  });
  // What is typed there is kept, so a live update that redraws the list doesn't lose it
  document.addEventListener("input", e => {
    const t = e.target; if (!t || !ui.grp || !["ptTitle", "ptWho", "ptDue"].includes(t.id)) return;
    const x = ptInit(ui.grp); x.draft = Object.assign({title: "", who: "", due: ""}, x.draft, {[t.id === "ptTitle" ? "title" : t.id === "ptWho" ? "who" : "due"]: t.value});
  });
  /* Drag a card on the project board to another column (mouse, pen or a long press on touch) */
  let kbDrag = null;
  const kbSuppress = e => { if (kbDrag && kbDrag.justDragged) { e.stopPropagation(); e.preventDefault(); } };
  document.addEventListener("click", kbSuppress, true);
  document.addEventListener("pointerdown", e => {
    if (kbDrag || (e.pointerType === "mouse" && e.button !== 0)) return;
    const c = e.target.closest && e.target.closest("#grpPT .kb-card"); if (!c || c.classList.contains("is-saving")) return;
    kbDrag = {el: c, id: c.dataset.id, from: c.dataset.kb, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, pid: e.pointerId, touch: e.pointerType !== "mouse", started: false};
    if (kbDrag.touch) kbDrag.timer = setTimeout(() => { if (kbDrag && !kbDrag.started) kbStart(); }, 320);
  });
  function kbStart(){
    const d = kbDrag; if (!d) return;
    if (!d.el.isConnected) { const again = d.id && $(`#grpPT .kb-card[data-id="${CSS.escape(d.id)}"]`); if (again) d.el = again; }
    if (!d.el.isConnected || d.el.getBoundingClientRect().width < 20) { clearTimeout(d.timer); kbDrag = null; return; }
    d.started = true;
    if (navigator.vibrate) { try { navigator.vibrate(12); } catch(e) {} }
    const r = d.el.getBoundingClientRect(), gh = d.el.cloneNode(true);
    d.dx = d.x - r.left; d.dy = d.y - r.top;
    gh.className += " kb-ghost"; gh.removeAttribute("data-id"); gh.setAttribute("aria-hidden", "true"); gh.style.width = r.width + "px"; gh.style.minWidth = r.width + "px"; gh.style.boxSizing = "border-box"; gh.style.left = r.left + "px"; gh.style.top = r.top + "px";
    document.body.appendChild(gh); d.ghost = gh; d.el.classList.add("kb-lifted");
    const kb = d.el.closest(".kb"); if (kb) kb.classList.add("kb-dragging");
    kbTick();
  }
  function kbCol(x, y){ const u = document.elementFromPoint(x, y), c = u && u.closest && u.closest("#grpPT .kb-col"); return c || null; }
  function kbTick(){
    const d = kbDrag; if (!d || !d.started) return;
    d.ghost.style.transform = `translate(${d.x - d.dx - parseFloat(d.ghost.style.left)}px, ${d.y - d.dy - parseFloat(d.ghost.style.top)}px) rotate(2deg)`;
    const c = kbCol(d.x, d.y);
    $$("#grpPT .kb-col.over").forEach(k => { if (k !== c) k.classList.remove("over"); });
    if (c) c.classList.add("over");
    d.raf = requestAnimationFrame(kbTick);
  }
  function kbEnd(ok){
    const d = kbDrag; if (!d) return; clearTimeout(d.timer); cancelAnimationFrame(d.raf);
    if (!d.started) { kbDrag = null; return; }
    const c = ok ? kbCol(d.x, d.y) : null, to = c ? c.dataset.kbcol : "";
    if (d.ghost) d.ghost.remove(); d.el.classList.remove("kb-lifted");
    $$("#grpPT .kb-col.over").forEach(k => k.classList.remove("over")); const kb = d.el.closest(".kb"); if (kb) kb.classList.remove("kb-dragging");
    d.justDragged = true; kbDrag = d; setTimeout(() => { if (kbDrag === d) kbDrag = null; }, 350);
    d.started = false;
    const g = groupOf(ui.grp);
    if (g && to && to !== d.from && PT_STATUS.some(k => k[0] === to)) ptMutate(g.id, d.id, {status: to});
    else if (g && d.dirty) ptRefresh(g.id);
  }
  document.addEventListener("pointermove", e => {
    const d = kbDrag; if (!d || d.justDragged || e.pointerId !== d.pid) return;
    d.x = e.clientX; d.y = e.clientY;
    if (!d.started) {
      const m = Math.hypot(d.x - d.x0, d.y - d.y0);
      if (d.touch) { if (m > 10) { clearTimeout(d.timer); kbDrag = null; if (d.dirty) { const g = groupOf(ui.grp); if (g) ptRefresh(g.id); } } }
      else if (m > 5) kbStart();
      return;
    }
    e.preventDefault();
  }, {passive: false});
  document.addEventListener("pointerup", e => { const d = kbDrag; if (!d || d.justDragged || e.pointerId !== d.pid) return; if (d.started) kbEnd(true); else { clearTimeout(d.timer); kbDrag = null; if (d.dirty) { const g = groupOf(ui.grp); if (g) ptRefresh(g.id); } } });
  document.addEventListener("pointercancel", e => { const d = kbDrag; if (!d || d.justDragged || e.pointerId !== d.pid) return; if (d.started) kbEnd(d.touch); else { clearTimeout(d.timer); kbDrag = null; if (d.dirty) { const g = groupOf(ui.grp); if (g) ptRefresh(g.id); } } });
  document.addEventListener("touchmove", e => { if (kbDrag && kbDrag.started) e.preventDefault(); }, {passive: false});
  document.addEventListener("contextmenu", e => { if (kbDrag && kbDrag.started) e.preventDefault(); });
  window.addEventListener("keydown", e => { if (e.key === "Escape" && kbDrag && kbDrag.started) kbEnd(false); });
  // The planner reads group tasks through this (documented above)
  window.SBGROUPTASKS = {
    version: 1,
    mine: opts => mineRows(opts).map(r => Object.assign({}, r)),
    boardRows: status => { const o = readOrders(); return mineRows({all: true}).filter(r => !status || (r.status || "todo") === status).map(r => Object.assign({}, r, {status: r.status || "todo"}, typeof o[r.id] === "number" ? {order: o[r.id]} : {})); },
    setOrders: map => { const o = readOrders(); Object.assign(o, map); const live = new Set(mineRows({all: true}).map(r => r.id)); Object.keys(o).forEach(k => { if (!live.has(k)) delete o[k]; }); try { localStorage.setItem(ORDK(), JSON.stringify(o)); } catch(e) {} },
    setStatus: (id, status) => setMineStatus(id, status),
    count: () => mineRows().length,
    dueThisWeek: () => GTL.weekDue(mineRows(), todayISO()),
    complete: id => { const r = mineRows().find(k => k.id === id); return r ? ptToggle(id, r.gid) : Promise.resolve(); },
    open: id => { const r = mineRows().find(k => k.id === id); if (r) openGroupTask(r); }
  };
  hook("render", tab => {
    if (tab !== "board") return;
    mineRows(); decorateBoard();
    if (online() && Date.now() - S.mineAt > 300000) loadMine();
  });

  const blkKey = () => "sb:blocked:" + myId();
  const localBlocks = () => { try { const a = JSON.parse(localStorage.getItem(blkKey()) || "[]"); return Array.isArray(a) ? a.filter(x => typeof x === "string") : []; } catch(e) { return []; } };
  const saveBlocks = () => { try { localStorage.setItem(blkKey(), JSON.stringify([...S.blocked].slice(0, 500))); } catch(e) {} };
  async function loadBlocks(){
    if (S.blocksFor === myId()) return;
    S.blocksFor = myId(); S.blocked = new Set(localBlocks());
    try { (await api.blocks() || []).forEach(r => { if (r && r.blocked_id) S.blocked.add(r.blocked_id); }); saveBlocks(); } catch(e) { }
  }
  const dropBlocked = gid => { S.msgs[gid] = (S.msgs[gid] || []).filter(x => !S.blocked.has(x.user_id)); S.items[gid] = (S.items[gid] || []).filter(x => !S.blocked.has(x.user_id)); };
  async function blockUser(id, name){
    if (!id || id === myId()) return;
    S.blocked.add(id); saveBlocks();
    Object.keys(S.msgs).concat(Object.keys(S.items)).forEach(gid => dropBlocked(gid));
    try { await api.block(id); } catch(e) { if (!(e && (e.setup || /duplicate|23505/i.test(String(e.message))))) { } }
    if (ui.grp) patch(ui.grp);
  }
  async function unblockUser(id){
    S.blocked.delete(id); saveBlocks();
    try { await api.unblock(id); } catch(e) {}
    if (ui.grp) loadGroup(ui.grp);
  }
  const REPORT_REASONS = [["harassment", "Harassment or bullying"], ["hate", "Hate or discrimination"], ["sexual", "Sexual or inappropriate content"], ["threat", "Threats, violence or self-harm"], ["spam", "Spam or scams"], ["privacy", "Private information about someone"], ["other", "Something else"]];
  const repBtn = it => `<button class="link-btn" data-act="grp-report" data-kind="item" data-id="${esc(it.id)}" aria-label="Report ${esc(str(it.title, 60))}">Report</button>`;
  function reportSheet(g, kind, id){
    let who = "", name = "", excerpt = "", targetId = id;
    if (kind === "message") { const m = (S.msgs[g.id] || []).find(x => x.id === id); if (!m) return; who = m.user_id; name = m.author_name; excerpt = str(m.body, 500); }
    else if (kind === "item") { const it = (S.items[g.id] || []).find(x => x.id === id); if (!it) return; who = it.user_id; name = it.author_name; excerpt = str(`${it.kind}: ${it.title}`, 500); }
    else { const m = (S.members[g.id] || []).find(x => x.user_id === id); if (!m) return; who = m.user_id; name = m.display_name; targetId = m.user_id; }
    if (!who || who === myId()) return;
    const label = name || "this member";
    openSheet(`<form class="sheet grp-report">${head("Report " + (kind === "message" ? "Message" : kind === "item" ? "Shared Item" : "Member"))}
      <div class="sheet-body">
        <p style="margin:0">Reports go privately to the people who run Studyboard, not to the group. We review them and remove content that breaks the rules. Someone who breaks them can be removed from study groups: they lose access to groups and group projects, and the rest of their Studyboard stays as it is.${excerpt ? ` <span class="mini">Reporting: “${esc(excerpt.slice(0, 120))}${excerpt.length > 120 ? "…" : ""}” from ${esc(label)}.</span>` : ` <span class="mini">Reporting ${esc(label)}.</span>`}</p>
        <fieldset><legend>What's wrong?</legend>${REPORT_REASONS.map(([k, t], i) => `<label class="mi-check"><input type="radio" name="reason" value="${k}" ${i === 0 ? "checked" : ""}> ${esc(t)}</label>`).join("")}</fieldset>
        <label class="f"><span class="lh">Details <span class="hint">Optional</span></span><textarea name="details" rows="3" maxlength="500" placeholder="Anything that helps us understand"></textarea></label>
        <label class="mi-check"><input type="checkbox" name="block" checked> Also block ${esc(label)} (you won't see what they post or share)</label>
        <p class="status-msg" id="grpRepMsg" aria-live="polite" style="margin:0"></p>
      </div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>Send Report</button></div></form>`, fd => {
      const reason = REPORT_REASONS.some(r => r[0] === fd.get("reason")) ? fd.get("reason") : "other", details = str(fd.get("details"), 500).trim(), alsoBlock = !!fd.get("block");
      (async () => {
        const msg = $("#grpRepMsg"), go = $("[data-submit]", dlg); if (go) go.disabled = true;
        try {
          await api.fileReport({group_id: g.id, target_kind: kind, target_id: String(targetId), reported_user_id: who, reason, details: details || null, excerpt: excerpt || null});
          if (alsoBlock) await blockUser(who, name);
          if (dlg.open) dlg.close();
          toast(alsoBlock ? `Report sent and ${label} is blocked. Thank you.` : "Report sent. Thank you.");
        } catch(e) {
          if (go) go.disabled = false;
          if (msg) msg.textContent = e.setup ? "Reporting isn't switched on for this server yet. Use Settings, Report a Bug or Send Feedback to tell us instead." : e.message;
          if (e.setup && alsoBlock) { await blockUser(who, name); if (msg) msg.textContent += ` ${label} is blocked on this device.`; }
        }
      })();
      return false;
    });
  }

  /* Messages: reactions and pins */
  function pinsHtml(g){
    const list = (S.msgs[g.id] || []).filter(m => m.pinned && !S.blocked.has(m.user_id));
    if (!list.length) return `<div id="grpPins"></div>`;
    return `<ul class="grp-pins" id="grpPins" aria-label="Pinned messages">${list.map(m => `<li>${I_PIN}<div><span class="mini">Pinned · ${esc(m.user_id === myId() ? "You" : m.author_name || "Member")}</span><p>${esc(str(m.body, 300))}</p></div>${canPin(g, m) ? `<button class="link-btn" data-act="grp-pin" data-id="${esc(m.id)}">Unpin</button>` : ""}</li>`).join("")}</ul>`;
  }
  function msgsHtml(g){
    const owner = isOwner(g), ext = extOf(g.id), all = S.msgs[g.id], list = all && all.filter(m => !S.blocked.has(m.user_id));
    if (!list) return loadingLine(g.id);
    if (!list.length) return `<p class="grp-none">No messages yet. Say hi, or plan your next ${isProj(g) ? "meeting" : "study session"}.</p>`;
    const by = {}; if (ext) ext.reactions.forEach(r => { (by[r.message_id] = by[r.message_id] || []).push(r); });
    return list.map(m => { const mine = m.user_id === myId(), rs = by[m.id] || [];
      const chips = REACTS.map(([k, e, label]) => { const who = rs.filter(r => r.kind === k); if (!who.length) return ""; const on = who.some(r => r.user_id === myId());
        return `<button class="grp-react${on ? " on" : ""}" data-act="grp-react" data-id="${esc(m.id)}" data-k="${k}" aria-pressed="${on}" title="${esc(label + ": " + who.map(r => r.user_id === myId() ? "You" : mName(g.id, r.user_id)).join(", "))}"><span aria-hidden="true">${e}</span>${who.length}</button>`; }).join("");
      const picker = ext && S.pick === m.id ? `<span class="grp-picker">${REACTS.map(([k, e, label]) => `<button type="button" class="grp-react" data-act="grp-react" data-id="${esc(m.id)}" data-k="${k}" aria-label="${esc(label)}">${e}</button>`).join("")}</span>` : "";
      return `<li class="grp-msg${mine ? " mine" : ""}${m.pinned ? " pinned" : ""}">${av(m.author_name, m.user_id)}<div class="grp-msg-main"><div class="grp-msg-top"><b>${esc(mine ? "You" : m.author_name || "Member")}</b><span class="mini" title="${esc(new Date(m.created_at).toLocaleString())}">${esc(ago(m.created_at))}</span>${m.pinned ? `<span class="pill">Pinned</span>` : ""}${mine ? "" : `<button class="link-btn" data-act="grp-report" data-kind="message" data-id="${esc(m.id)}" aria-label="Report message from ${esc(m.author_name || "member")}">Report</button>`}</div><p>${esc(m.body)}</p>
        ${ext ? `<div class="grp-msg-acts">${chips}${picker || `<button class="grp-react add" data-act="grp-react-open" data-id="${esc(m.id)}" aria-label="Add a reaction">+</button>`}${canPin(g, m) ? `<button class="link-btn" data-act="grp-pin" data-id="${esc(m.id)}">${m.pinned ? "Unpin" : "Pin"}</button>` : ""}</div>` : ""}</div>${mine || owner ? `<button class="x-btn" data-act="grp-msg-del" data-id="${esc(m.id)}" aria-label="Delete message">${CLOSE}</button>` : ""}</li>`; }).join("");
  }
  function boardHtml(g){
    const free = isOwner(g) && typeof PLAN !== "undefined" && PLAN && PLAN.paywall() && !(PLAN.limitsPro ? PLAN.limitsPro() : PLAN.isPro()), days = free ? PLAN.limits().groupMsgDays : 0;
    return `<section class="grp-sec" id="grpBoard"><h3 class="fsec"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>Message Board</h3>
      ${pinsHtml(g)}
      <form class="grp-post" id="grpPost" data-gid="${esc(g.id)}"><textarea id="grpMsgIn" rows="2" maxlength="2000" aria-label="Write a message to the group" aria-describedby="grpPostHint" placeholder="Write to the group…">${esc(S.drafts[g.id] || "")}</textarea><button type="submit" class="btn primary small">Post</button><span class="mini grp-post-hint" id="grpPostHint">Press ${/Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || "") ? "⌘" : "Ctrl"}+Enter to post</span></form>
      <ul class="grp-msgs" id="grpMsgList" aria-live="polite">${msgsHtml(g)}</ul>
      ${days ? `<p class="mini" style="margin:8px 0 0">Messages are kept ${days} days in Free groups. <button class="link-btn" data-act="grp-upgrade" data-r="Pro keeps your group's message history for good.">Go Pro</button> to keep them all.</p>` : ""}</section>`;
  }
  // Pick a colour
  const rgbOf = c => [1, 3, 5].map(i => parseInt(String(c).substr(i, 2), 16));
  const colorNear = (a, b) => { if (!okColor(a) || !okColor(b)) return false; const [r1, g1, b1] = rgbOf(a), [r2, g2, b2] = rgbOf(b), rm = (r1 + r2) / 2;
    return Math.sqrt((2 + rm / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + (2 + (255 - rm) / 256) * (b1 - b2) ** 2) < 60; };
  function colorSheet(g, first){
    const ms = S.members[g.id] || [], me = ms.find(m => m.user_id === myId()); if (!me) return;
    const others = ms.filter(m => m.user_id !== myId() && okColor(m.color)), pro = (typeof gxOn === "function" && gxOn(g)) || (typeof PLAN !== "undefined" && !!PLAN && PLAN.isPro());
    const nearWho = c => { const m = others.find(o => colorNear(o.color, c)); return m ? m.display_name || "A member" : ""; };
    const taken = new Map(MEMBER_COLORS.map(c => [c, nearWho(c)]).filter(x => x[1]));
    const mine = okColor(me.color) ? String(me.color).toUpperCase() : "", custom = mine && !MEMBER_COLORS.includes(mine);
    openSheet(`<div class="sheet">${head(first ? "Pick Your Color" : "Your Color")}<div class="sheet-body">
      <p style="margin:0">Everywhere in ${esc(g.name)}, your picture, messages, scores and topics${isProj(g) ? ", and your tasks on the board," : ""} show in this color, so everyone can tell who's who at a glance. Each color belongs to one person.</p>
      <div class="mc-grid" role="group" aria-label="Colors">${MEMBER_COLORS.map(c => { const who = taken.get(c), on = mine === c;
        return `<button type="button" class="mc-sw${on ? " on" : ""}" data-mc="${c}" style="--mc:${c}"${who ? ` disabled title="${esc(who)} has this color"` : ""} aria-pressed="${on}" aria-label="${who ? esc(who) + "'s color" : on ? "Your color" : "Pick this color"}">${who ? esc(initials(who)) : on ? "✓" : ""}</button>`; }).join("")}</div>
      ${pro ? `<div class="mc-any"><span class="mc-any-h"><b>Any Color</b><span class="pro-badge">PRO</span></span>
          <div class="mc-any-row"><input type="color" id="mcAny" value="${esc((mine || "#3E63DD").toLowerCase())}" aria-label="Pick any color"><input type="text" id="mcHex" value="${esc(mine || "#3E63DD")}" maxlength="7" spellcheck="false" autocomplete="off" aria-label="Color code, like #3E63DD"><span class="grp-av mc-prev" id="mcPrev" style="--c:${esc(mine || "#3E63DD")}" aria-hidden="true">${esc(initials(me.display_name || "Me"))}</span><button type="button" class="btn small primary" id="mcUse">Use This Color</button></div>
          <p class="mini mc-msg" id="mcMsg" role="status">${custom ? "You're using your own color." : "Pick any shade. Colors very close to someone else's can't be used."}</p></div>`
        : `<div class="mc-any is-locked" aria-disabled="true"><span class="mc-any-h"><b>Any Color</b><span class="pro-badge">PRO</span></span><p class="mini" style="margin:0">Pick any shade you like with Studyboard Pro (or in a Pro group).</p></div>`}</div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">${first ? "Later" : "Close"}</button></div></div>`);
    const any = dlg.querySelector("#mcAny"), hex = dlg.querySelector("#mcHex"), prev = dlg.querySelector("#mcPrev"), use = dlg.querySelector("#mcUse"), msg = dlg.querySelector("#mcMsg");
    const show = c => { const who = nearWho(c); if (prev) { prev.style.setProperty("--c", c); prev.style.color = inkOn(c); } if (use) use.disabled = !!who || c === mine;
      if (msg) msg.textContent = who ? `Too close to ${who}'s color. Pick another shade.` : c === mine ? "That's your color now." : "Looks good. Use This Color to save it."; };
    if (any) any.addEventListener("input", () => { const c = any.value.toUpperCase(); if (hex) hex.value = c; show(c); });
    const normHex = v => { let c = String(v || "").trim().toUpperCase(); if (c && c[0] !== "#") c = "#" + c; if (/^#[0-9A-F]{3}$/.test(c)) c = "#" + c.slice(1).split("").map(x => x + x).join(""); return c; };
    if (hex) hex.addEventListener("input", () => { const c = normHex(hex.value); if (okColor(c)) { if (any) any.value = c.toLowerCase(); show(c); } else if (use) { use.disabled = true; if (msg) msg.textContent = "Use a color code like #3E63DD."; } });
    if (use) { show(normHex(hex && hex.value) || "#3E63DD"); use.addEventListener("click", () => { const c = normHex(hex && hex.value); if (okColor(c) && !nearWho(c)) pick(use, c); }); }
    dlg.querySelectorAll("[data-mc]").forEach(b => b.addEventListener("click", () => pick(b, b.dataset.mc)));
    async function pick(b, color){
      busyBtn(b, true);
      try { await api.setColor(g.id, color); me.color = color; if (dlg.open) dlg.close(); toast("Color saved"); if (ui.tab === "groups" && ui.grp === g.id) patch(g.id); else render(); }
      catch (e) { busyBtn(b, false); const msg = String(e && e.message || "");
        if (/already has that colou?r|duplicate key|group_members_one_color/i.test(msg)) { toast("Someone just picked that color. Pick another."); loadGroup(g.id); if (dlg.open) dlg.close(); return; }
        toast(/set_member_color|function/i.test(msg) ? "Colors need the latest supabase-groups.sql on your server." : msg); }
    }
  }
  // After joining or making a group project
  function askColorSoon(gid){
    let n = 0;
    const tick = () => { const g = groupOf(gid), me = (S.members[gid] || []).find(m => m.user_id === myId());
      if (g && me) { if (!me.color && !dlg.open) colorSheet(g, true); return; }
      if (++n < 20) setTimeout(tick, 400); };
    setTimeout(tick, 600);
  }
  function membersHtml(g){
    const ms = (S.members[g.id] || []).slice().sort((a, b) => (b.role === "owner") - (a.role === "owner") || String(a.display_name).localeCompare(String(b.display_name)));
    const owner = isOwner(g), ext = extOf(g.id), today = todayISO();
    const mine = ms.find(m => m.user_id === myId());
    return `<section class="grp-sec" id="grpMembers"><h3 class="fsec">${ICON_GROUP}Members<span class="n">${ms.length}</span></h3>
      ${mine ? `<div class="mc-me"><span class="mc-dot" style="--mc:${esc(memberHue(g.id, myId()))}" aria-hidden="true"></span><span class="mc-t"><b>Your Color</b><span class="mini">${mine.color ? `Marks you across the group: your picture, messages, scores${isProj(g) ? " and tasks" : ""}` : "Pick one so everyone can spot you at a glance across the group"}</span></span><button type="button" class="btn small" data-act="grp-color" data-id="${esc(g.id)}">${mine.color ? "Change" : "Pick a Color"}</button></div>` : ""}
      <ul class="grp-members">${ms.map(m => {
        const st = ext ? streakOf(ext, m.user_id) : 0, bd = ext ? badgesFor(g, m.user_id) : [], me2 = m.user_id === myId();
        if (!me2 && S.blocked.has(m.user_id)) return `<li class="blocked">${av(m.display_name, m.user_id)}<span class="nm">${esc(m.display_name || "Member")} <span class="pill">Blocked</span></span><button class="btn small" data-act="grp-unblock" data-id="${esc(m.user_id)}">Unblock</button>${owner ? `<button class="x-btn" data-act="grp-member-del" data-id="${esc(m.user_id)}" aria-label="Remove ${esc(m.display_name)} from the group">${CLOSE}</button>` : ""}</li>`;
        return `<li>${av(m.display_name, m.user_id)}<span class="nm">${esc(m.display_name || "Member")}${m.badge && typeof GX_STAR === "string" ? GX_STAR : ""}${me2 ? ` <span class="mini">(You)</span>` : ""}${bd.length ? `<span class="grp-badges">${bd.map(b => `<span class="grp-badge ${b[0]}" title="${esc(b[2])}">${esc(b[1])}</span>`).join("")}</span>` : ""}${st >= 2 && !bd.some(b => b[0] === "streak") ? `<span class="mini">${st}-day streak</span>` : ""}</span>${isProj(g) && roleOf(g.id, m.user_id) ? `<span class="pill gk-role">${esc(GK.roleLabel(roleOf(g.id, m.user_id)))}</span>` : ""}${m.role === "owner" ? `<span class="pill">Owner</span>` : ""}${me2 ? "" : `<details class="grp-more g2-mm"><summary class="g2-dots" aria-label="More for ${esc(m.display_name || "this member")}">⋯</summary><div class="grp-menu"><button class="btn" data-act="grp-report" data-kind="member" data-id="${esc(m.user_id)}">Report or Block</button>${owner ? `<button class="btn" data-act="grp-member-del" data-id="${esc(m.user_id)}">Remove from Group</button>` : ""}</div></details>`}</li>`; }).join("")}</ul>
      ${isOwner(g) && typeof PLAN !== "undefined" && PLAN && PLAN.paywall() && !(PLAN.limitsPro ? PLAN.limitsPro() : PLAN.isPro()) ? `<p class="mini" style="margin:8px 0 0">Free groups hold up to ${PLAN.limits().groupMembers} members (${ms.length} now). <button class="link-btn" data-act="grp-upgrade" data-r="Pro groups hold up to 100 members.">Go Pro</button> for up to 100.</p>` : ""}</section>`;
  }
  // Update parts of the open group page in place, so a message you're typing isn't lost
  function patch(gid){
    const g = groupOf(gid), root = $("#grpDetail");
    if (!g || !root || root.dataset.gid !== gid) { if (ui.tab === "groups") render(); return; }
    if (root.dataset.feat !== [...hiddenOf(g)].sort().join()) { render(); return; }
    swapEl("grpHead", headHtml(g)); keepTabFocus();
    if (isProj(g)) { swapEl("grpOverview", overviewHtml(g)); swapEl("grpFiles", linksHtml(g)); swapEl("grpMinutes", minutesHtml(g)); }
    else { swapEl("grpChallenge", challengeHtml(g)); swapEl("grpBattle", battleHtml(g)); swapEl("grpDecks", decksHtml(g)); swapEl("grpQuizzes", quizzesHtml(g)); swapEl("grpWeak", weakHtml(g)); swapEl("grpQA", qaHtml(g)); swapEl("grpCheckin", checkinHtml(g)); }
    swapEl("grpSessions", sessionsHtml(g)); swapEl("grpTasks", tasksHtml(g)); swapPT(g); swapEl("grpMembers", membersHtml(g)); swapEl("grpPins", pinsHtml(g)); drawThread();
    const ml = $("#grpMsgList"); if (ml) ml.innerHTML = msgsHtml(g);
    const eb = $(".grp-err", root); if (eb && !S.errG[gid]) eb.remove();
    refreshFab();
  }

  // Signed in as someone else now
  function checkUser(){
    const id = online() ? myId() : "";
    if (S.uid === id) return;
    unsubscribe();
    Object.assign(S, {uid: id, groups: null, members: {}, items: {}, msgs: {}, err: "", setup: false, errG: {}, name: undefined, shares: null, drafts: {}, changed: {}, linkChecked: {}, linkNew: {}, ext: {}, lb: {}, rep: {}, pick: "", blocked: new Set(), blocksFor: "", pt: {}, peer: {}, miss: {}, ptPend: new Map(), mine: {}, mineFor: "", mineAt: 0, mineOff: false});
    ui.grp = null; checked = false; updateNavBadge();
  }
  // The app tour's example (see tourDemo)
  function demoGroupsView(){
    const keep = {groups: S.groups, members: S.members, changed: S.changed, err: S.err, binned: S.binned, icons: S.icons, items: S.items}, me = myId() || "you";
    const day = n => addDays(todayISO(), n);
    Object.assign(S, {err: "", binned: [], changed: {"demo-g1": 2}, items: {}, icons: {"demo-g1": {key: "bone"}, "demo-g2": {key: "brain"}},
      groups: [{id: "demo-g1", name: "Anatomy Study Squad", kind: "study", course: "BIOL 1200", color: "#1E9E74", owner_id: me},
        {id: "demo-g2", name: "Psych Presentation Team", kind: "project", course: "PSYC 1010", color: "#3B6FE0", project_due: day(16), owner_id: "demo-x"}],
      members: {"demo-g1": [{user_id: me, display_name: "You"}, {user_id: "d1", display_name: "Maya"}, {user_id: "d2", display_name: "Jordan"}, {user_id: "d3", display_name: "Priya"}],
        "demo-g2": [{user_id: me, display_name: "You"}, {user_id: "d4", display_name: "Sam"}, {user_id: "d5", display_name: "Alex"}]}});
    try { return listView(); } finally { Object.assign(S, keep); }
  }
  VIEWS.groups = () => {
    if (tourDemo && demoDrawing && !ui.grp && !(online() && S.groups && S.groups.length)) return demoGroupsView();
    checkUser();
    if (!online()) { unsubscribe(); return offlineView(); }
    return ui.grp ? detailView(ui.grp) : listView();
  };

  /* Sheets */
  const loadingSheet = title => openSheet(`<div class="sheet">${head(title)}<div class="sheet-body"><p class="status-msg"><span class="ai-spin" aria-hidden="true"></span> One moment…</p></div></div>`);
  function needOnline(){
    if (online()) return true;
    const local = !sbConfig();
    openSheet(`<div class="sheet">${head("Sharing Needs a Studyboard Account")}<div class="sheet-body">
      <p style="margin:0">${inPreview() ? "Share links and study groups work on the Studyboard website and in the desktop app." : "Sign in to your free Studyboard account, then try again."}</p>
      <p class="mini" style="margin:0">No account? Share a deck as a file from its Share menu.</p></div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="grp-import">Import a Deck File</button><span class="spacer"></span>${inPreview() ? "" : `<button type="button" class="btn primary" data-act="${local ? "sb-connect" : "sb-signin"}">${local && !SB_HOSTED ? "Set Up Sync" : "Sign In"}</button>`}</div></div>`);
    return false;
  }

  // Share one deck with a link and code, or as a file
  function deckShareSheet(d){
    if (!online()) { deckFileSheet(d); return; }
    rememberWebUrl();
    ensureName(async () => {
      loadingSheet(`Share ${d.name}`);
      let row = null;
      try { const list = await api.myShares() || []; S.shares = list; row = list.find(s => s.deck_id === d.id) || null; }
      catch(e) { if (dlg.open) openSheet(`<div class="sheet">${head("Share " + d.name)}<div class="sheet-body">${errBox(e.message, e.setup)}</div><div class="sheet-foot"><button type="button" class="btn" data-act="grp-file-deck" data-id="${esc(d.id)}">Share as File</button><span class="spacer"></span><button type="button" class="btn" data-act="close">Close</button></div></div>`); return; }
      if (!dlg.open) return;
      d = state.decks[d.id] || d;
      const nq = (d.aiQuizzes || []).length, sh = d.shared && row && d.shared.code === row.code ? d.shared : null;
      const withQ = sh ? !!sh.q : true;
      const changed = row && (!sh || deckPayload(d, withQ).hash !== sh.h);
      const qBox = nq ? `<label class="mi-check"><input type="checkbox" id="grpWithQ" ${withQ ? "checked" : ""}> Include my ${plural(nq, "practice quiz", "practice quizzes")}</label>` : "";
      if (!row) {
        openSheet(`<form class="sheet">${head("Share " + d.name)}<div class="sheet-body">
          <p style="margin:0">Make a link and short code for this deck. Anyone with the link can open it in a browser, no account needed, and add a copy. They get your cards, not your progress.</p>
          ${qBox}
          <p class="mini" style="margin:0">They'll see your name as <b>${esc(S.name || "")}</b>. You can update the shared copy or stop sharing any time.</p></div>
          <div class="sheet-foot"><button type="button" class="btn" data-act="grp-file-deck" data-id="${esc(d.id)}">Share as File</button><span class="spacer"></span><button type="button" class="btn primary" data-submit id="grpMake">Create Link</button></div></form>`, () => {
          const wq = !!($("#grpWithQ") || {}).checked;
          doShare(d, wq, $("#grpMake")); return false;
        });
        return;
      }
      const link = linkFor("deck", row.code);
      openSheet(`<form class="sheet">${head("Share " + d.name)}<div class="sheet-body">
        <p style="margin:0">Send the link, or have them type the code in Studyboard (Flashcards, then Enter a Share Code).</p>
        <div class="grp-code-big" aria-label="Share code">${esc(row.code)}</div>
        ${link ? `<div class="grp-link"><input type="text" readonly value="${esc(link)}" aria-label="Share link" id="grpLinkIn"><button type="button" class="btn small" id="grpCopyLink">Copy Link</button></div>` : `<p class="mini" style="margin:0">Send the code. To get links here too, share a deck or send an invite once from the Studyboard website.</p>`}
        <p class="mini" style="margin:0">Shared ${esc(ago(row.updated_at, 1))} with ${plural(row.card_count, "card")}.</p>
        ${window.SBSHARE ? SBSHARE.libRow(d, row.code) : ""}
        ${changed ? `<div class="grp-note">You've changed this deck since you shared it. Update the shared copy so new people get the latest cards.</div>` : ""}
        ${qBox}
        <div class="grp-sub"><button type="button" class="link-btn" data-act="grp-file-deck" data-id="${esc(d.id)}">Share as File</button><button type="button" class="link-btn grp-stop" id="grpStop">Stop Sharing</button></div></div>
        <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn${changed ? " primary" : ""}" id="grpUpd">Update Shared Copy</button>${changed ? "" : `<button type="button" class="btn primary" id="grpSend">Send</button>`}</div></form>`);
      const cl = $("#grpCopyLink"); if (cl) cl.addEventListener("click", () => copyText(link, "Link copied"));
      const li = $("#grpLinkIn"); if (li) li.addEventListener("focus", () => li.select());
      const sd = $("#grpSend"); if (sd) sd.addEventListener("click", () => sendText(d.name, `Study my Studyboard deck "${d.name}". Code: ${row.code}`, link));
      $("#grpUpd").addEventListener("click", e => doShare(d, !!($("#grpWithQ") || {}).checked, e.currentTarget));
      $("#grpStop").addEventListener("click", () => confirmSheet("Stop Sharing?", `The link and code for ${d.name} stop working. People who already added it keep their copy.`, "Stop Sharing", () => stopShare(row.code)));
    });
  }
  async function doShare(d, withQ, btn){
    d = state.decks[d.id] || d;
    const p = deckPayload(d, withQ);
    if (!p.cards.length && !p.quizzes.length) { toast("Add some cards to this deck first"); return; }
    busyBtn(btn, true);
    try {
      const code = await api.shareDeck(d.id, str(d.name, 200) || "Deck", p, p.cards.length);
      const nd = clone(state.decks[d.id]); nd.shared = {code: String(code), h: p.hash, q: withQ ? 1 : 0, at: Date.now()};
      saveDeck(nd, null); S.shares = null;
      toast(d.shared && d.shared.code === code ? "Shared copy updated" : `Link ready. Code ${code}`);
      deckShareSheet(nd);
    } catch(e) { busyBtn(btn, false); toast(e.message); }
  }
  async function stopShare(code){
    try {
      await api.stopShare(code);
      const d = decksArr().find(x => x.shared && x.shared.code === code);
      if (d) { const nd = clone(d); delete nd.shared; saveDeck(nd, null); }
      S.shares = (S.shares || []).filter(s => s.code !== code);
      const el = $("#grpShares"); if (el) el.innerHTML = sharesHtml();
      toast("Stopped sharing. The link and code no longer work.");
    } catch(e) { toast(e.message); }
  }
  // Local-only: a deck file that works between anyone
  function deckFileSheet(d){
    const nq = (d.aiQuizzes || []).length;
    openSheet(`<form class="sheet">${head("Share " + d.name)}<div class="sheet-body">
      <p style="margin:0">Save this deck as a file and send it by email, a chat app or a USB stick. Anyone with Studyboard can tap <b>Import a Deck File</b> on the Flashcards page to add their own copy.</p>
      ${nq ? `<label class="mi-check"><input type="checkbox" id="grpFileQ" checked> Include my ${plural(nq, "practice quiz", "practice quizzes")}</label>` : ""}
      ${online() || inPreview() ? "" : `<p class="mini" style="margin:0">When you're signed in to Studyboard, you can also share with a link or a short code, and use study groups.</p>`}</div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>Share as File</button></div></form>`, () => { exportDeckFile(d, !!($("#grpFileQ") || {}).checked); });
  }
  async function exportDeckFile(d, withQ){
    const p = deckPayload(d, withQ);
    p.sharedBy = S.name || ""; p.exported = new Date().toISOString();
    const data = JSON.stringify(p, null, 1);
    const fn = (d.name.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || "deck") + ".studyboard-deck.json";
    try { const dl = caps.downloads || await useCap("downloads"); if (dl) { await dl.save({filename: fn, data}); toast("Deck file saved. Send it to a classmate."); return; } }
    catch(e) { if (e && e.code === "declined") return; }
    if (!inPreview()) { saveBlob(fn, data, "application/json"); toast("Deck file saved. Send it to a classmate."); return; }
    try { await navigator.clipboard.writeText(data); toast("Deck copied to clipboard"); } catch(e) { toast("Saving files isn't available here"); }
  }
  let fileIn = null;
  function importDeckFile(){
    if (!fileIn) {
      fileIn = document.createElement("input");
      fileIn.type = "file"; fileIn.accept = ".json,application/json"; fileIn.className = "sr"; fileIn.tabIndex = -1; fileIn.setAttribute("aria-hidden", "true");
      document.body.appendChild(fileIn);
      fileIn.addEventListener("change", async () => {
        const f = fileIn.files && fileIn.files[0]; fileIn.value = ""; if (!f) return;
        if (f.size > 8e6) { toast("That file is too big to be a Studyboard deck."); return; }
        let p = null;
        try { const j = JSON.parse(await f.text()); if (j && (j.type === "deck" || Array.isArray(j.cards))) p = cleanPayload(j); } catch(e) {}
        if (!p || (!p.cards.length && !p.quizzes.length)) { toast("That file isn't a Studyboard deck. Ask for a .studyboard-deck.json file."); return; }
        previewSheet({p, sharer: p.sharedBy, meta: {file: 1, by: p.sharedBy, v: new Date().toISOString()}});
      });
    }
    if (dlg.open) dlg.close();
    fileIn.click();
  }

  // Preview a shared deck (from a code, a link, a file or a group) before adding a copy
  function previewSheet({p, sharer, meta, isMine, code, item}){
    const nq = p.quizzes.length, cid = matchCourse(p.course), c = courseOf(cid);
    const existing = code ? copyOfCode(code) : item ? copyOfItem(item.id) : null;
    openSheet(`<form class="sheet grp-prev-sheet">${head("Shared Deck")}<div class="sheet-body">
      <div class="grp-prev" id="grpPrevTile" style="--c:${esc(cid ? colorOf(cid) : "#8A94A6")}"><span class="deck-tab"><span class="gp-ic" aria-hidden="true">${c ? courseRingHtml(c) : GENERAL_ICON}</span><span class="gp-t">${esc(c ? courseLabel(c) : "General")}</span></span>
        <b class="grp-prev-name">${esc(p.name)}</b>
        <span class="mini">${plural(p.cards.length, "card")}${nq ? `, ${plural(nq, "practice quiz", "practice quizzes")}` : ""}${sharer ? ` · Shared by ${esc(sharer)}` : ""}</span></div>
      ${p.cards.length ? `<h3 class="fsec" style="margin:4px 0 0">A Few Cards</h3><ul class="grp-sample">${p.cards.slice(0, 3).map(x => `<li><span class="f">${esc(x.front)}</span><span class="b">${esc(x.back)}</span></li>`).join("")}</ul>${p.cards.length > 3 ? `<details class="grp-more-cards"><summary class="mini">and ${plural(p.cards.length - 3, "more card")}<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></summary><ul class="grp-sample">${p.cards.slice(3, 500).map(x => `<li><span class="f">${esc(x.front)}</span><span class="b">${esc(x.back)}</span></li>`).join("")}</ul>${p.cards.length > 500 ? `<p class="mini">and ${plural(p.cards.length - 500, "more card")} after you add the deck</p>` : ""}</details>` : ""}` : ""}
      ${isMine ? `<div class="grp-note">This is your own shared deck. Adding it makes a second copy.</div>` : existing ? `<div class="grp-note">You already have this deck (${esc(existing.name)}). Adding it again makes another copy.</div>` : ""}
      <label class="f">Put It In<select name="courseId">${courseSelectHtml(cid)}</select></label>
      <p class="mini" style="margin:0">You get your own copy with fresh study progress. ${sharer ? esc(sharer) + " won't" : "Nobody else will"} see how you study.</p></div>
      <div class="sheet-foot">${existing ? `<button type="button" class="btn" id="grpOpenExisting">Open My Copy</button>` : ""}<span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>Add to My Flashcards</button></div></form>`, fd => {
      addDeckCopy(p, meta, String(fd.get("courseId") || ""));
    });
    const sel = $('select[name="courseId"]', dlg), tile = $("#grpPrevTile");
    if (sel && tile) sel.addEventListener("change", () => { const c2 = courseOf(sel.value);
      tile.style.setProperty("--c", c2 ? colorOf(c2.id) : "#8A94A6");
      $(".gp-ic", tile).innerHTML = c2 ? courseRingHtml(c2) : GENERAL_ICON; $(".gp-t", tile).textContent = c2 ? courseLabel(c2) : "General"; });
    const ox = $("#grpOpenExisting"); if (ox) ox.addEventListener("click", () => { dlg.close(); ui.tab = "flashcards"; ui.fc = null; ui.deckId = existing.id; render(); window.scrollTo(0, 0); });
  }
  async function openDeckCode(code){
    loadingSheet("Shared Deck");
    try {
      const r = await api.getDeck(code);
      if (!dlg.open) return;
      if (!r) { codeSheet(code, "That code didn't match a shared deck. It may have been stopped. Check it and try again."); return; }
      const p = cleanPayload(r.data);
      if (!p) { codeSheet(code, "That shared deck couldn't be read. Ask the person to share it again."); return; }
      p.name = str(r.name, 120) || p.name;
      previewSheet({p, sharer: r.sharer_name, isMine: r.is_mine, code: r.code, meta: {code: r.code, by: r.sharer_name, v: r.updated_at}});
    } catch(e) { codeSheet(code, e.message); }
  }
  function groupPreviewSheet(pv, code){
    openSheet(`<form class="sheet">${head("Join a Study Group")}<div class="sheet-body">
      <div class="grp-prev" style="--c:${esc(grpColor(pv))}"><span class="deck-tab">${esc(pv.course || "Study Group")}</span><b class="grp-prev-name">${esc(pv.name)}</b>
        <span class="mini">${plural(pv.member_count, "member")}${pv.owner_name ? ` · Started by ${esc(pv.owner_name)}` : ""}</span></div>
      <p style="margin:0">${pv.is_member ? "You're already in this group." : "Members see each other's display names, shared decks, quizzes, deadlines, study sessions, weekly stats and the message board. You can leave any time."}</p></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit id="grpJoin">${pv.is_member ? "Open Group" : "Join Group"}</button></div></form>`, () => {
      if (pv.is_member) { openGroup(pv.id); return; }
      const b = $("#grpJoin"); busyBtn(b, true);
      ensureName(async () => {
        try { const gid = await api.join(code); S.groups = null; toast(`You joined ${pv.name}`); if (dlg.open) dlg.close(); openGroup(gid || pv.id); await loadGroups(); askColorSoon(gid || pv.id); }
        catch(e) { busyBtn(b, false); toast(e.message); }
      });
      return false;
    });
  }
  async function openGroupCode(code){
    loadingSheet("Join a Study Group");
    try {
      const pv = await api.preview(code);
      if (!dlg.open) return;
      if (!pv) { codeSheet(code, "That code didn't match a study group. The owner may have made a new one. Check it and try again."); return; }
      groupPreviewSheet(pv, code);
    } catch(e) { codeSheet(code, e.message); }
  }
  function codeSheet(val, msg){
    openSheet(`<form class="sheet">${head("Enter a Code")}<div class="sheet-body">
      <p style="margin:0">Type or paste the 8-character code a classmate gave you, like K7P4-QD9X. It works for shared decks and study groups. You can paste a whole link too.</p>
      <label class="f"><span class="lh">Code ${REQ}</span><input type="text" name="code" required maxlength="300" value="${esc(val || "")}" autofocus autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. K7P4-QD9X" class="grp-code-in"></label>
      <p class="grp-code-msg" id="grpCodeMsg" role="status">${esc(msg || "")}</p></div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="grp-import">Import a Deck File</button><span class="spacer"></span><button type="button" class="btn primary" data-submit id="grpCodeGo">Open</button></div></form>`, fd => {
      const {kind, code} = normCode(fd.get("code"));
      const m = $("#grpCodeMsg");
      if (!code) { m.textContent = "Codes have 8 letters and numbers, like K7P4-QD9X."; return false; }
      if (!needOnline()) return false;
      (async () => {
        busyBtn($("#grpCodeGo"), true); m.textContent = "Looking it up…";
        try {
          if (kind !== "group") { const r = await api.getDeck(code); if (r) { openDeckCodeRow(r); return; } }
          if (kind !== "deck") { const pv = await api.preview(code); if (pv) { groupPreviewSheet(pv, code); return; } }
          if (dlg.open && $("#grpCodeMsg")) { $("#grpCodeMsg").textContent = "That code didn't match a shared deck or a study group. Check it and try again."; busyBtn($("#grpCodeGo"), false); }
        } catch(e) { if ($("#grpCodeMsg")) { $("#grpCodeMsg").textContent = e.message; busyBtn($("#grpCodeGo"), false); } }
      })();
      return false;
    });
    const inp = $(".grp-code-in", dlg);
    if (inp) inp.addEventListener("input", () => { const raw = inp.value; if (/[?&=/:\s]/.test(raw.trim())) return; const x = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8); const v = x.length > 4 ? x.slice(0, 4) + "-" + x.slice(4) : x; if (v !== raw) inp.value = v; });
  }
  function openDeckCodeRow(r){
    const p = cleanPayload(r.data);
    if (!p) { toast("That shared deck couldn't be read. Ask the person to share it again."); return; }
    p.name = str(r.name, 120) || p.name;
    previewSheet({p, sharer: r.sharer_name, isMine: r.is_mine, code: r.code, meta: {code: r.code, by: r.sharer_name, v: r.updated_at}});
  }

  // What each kind of group comes with, shown when you choose one so the difference is clear
  const KIND_INFO = {
    study: {lead: "Learn together. Share what you study and keep each other going.", feats: ["Share decks and quizzes, and see who scores highest in a Quiz Battle", "Propose study sessions and see who is coming", "A weekly challenge with daily check-ins", "Ask questions and mark the answer that helped", "Share the cards you keep missing and see which ones trip up the group"]},
    project: {lead: "Get a piece of work finished as a team, on time, with a fair split.", feats: ["A countdown to the due date, a progress bar and what is behind", "A task board with owners and due dates, or a plan worked back from the due date", "Pick your part: Lead, Researcher, Editor, Presenter, Designer or a role of your own", "Shared files and links, and meeting notes whose action items become tasks"]}
  };
  const kindPreview = k => `<div class="gk-kind-note grp-kind-note" data-for="${k}"${k === "study" ? "" : " hidden"}><p class="gk-kind-lead">${esc(KIND_INFO[k].lead)}</p>
      <div class="gk-kind-tabs" aria-label="Tabs you get">${GK.tabsFor(k).map(t => `<span>${esc(t[1])}</span>`).join("")}</div>
      <ul class="gk-kind-feats">${KIND_INFO[k].feats.map(f => `<li>${esc(f)}</li>`).join("")}</ul></div>`;
  function newGroupSheet(g){
    const edit = !!g, proj = edit && isProj(g);
    const opts = coursesArr().map(c => `<option value="${esc(courseLabel(c))}">${esc(c.name)}</option>`).join("");
    const TPL = edit ? [] : tpls();
    const tplPick = TPL.length ? `<div class="f grp-tpls"><span class="lh">Start From</span><div class="grp-tpl-row" role="group" aria-label="Start from a template"><button type="button" class="chip" data-tpl="" aria-pressed="true">Blank</button>${TPL.map(t => `<button type="button" class="chip" data-tpl="${esc(t.id)}" aria-pressed="false">${t.icon && STICKERS[t.icon] ? `<span class="grp-tpl-ic">${stickerSvg(t.icon)}</span>` : ""}${esc(t.name)}<span class="mini">${t.kind === "project" ? (t.tasks || []).length ? `Project · ${t.tasks.length} tasks` : "Project" : "Study group"}</span></button>`).join("")}</div></div>` : "";
    const kindPick = edit ? "" : `${tplPick}<div class="segb grp-kind" role="group" aria-label="Group type"><button type="button" data-kind="study" aria-pressed="true">Study Group</button><button type="button" data-kind="project" aria-pressed="false">Group Project</button></div>
${kindPreview("study")}${kindPreview("project")}`;
    openSheet(`<form class="sheet">${head(edit ? (proj ? "Edit Project" : "Edit Group") : "New Group")}<div class="sheet-body">${REQ_NOTE}
      ${kindPick}
      <label class="f"><span class="lh"><span class="grp-nm-l">${proj ? "Project Name" : "Group Name"}</span> ${REQ}</span><input type="text" name="name" required maxlength="80" value="${esc(edit ? g.name : "")}" autofocus placeholder="${proj ? "e.g. Biology Poster" : "e.g. Biology Study Squad"}"></label>
      <label class="f"><span class="lh">Course <span class="hint">optional</span></span><input type="text" name="course" maxlength="80" list="grpCourses" value="${esc(edit ? g.course : (ui.filter !== "all" && courseOf(ui.filter) ? courseLabel(courseOf(ui.filter)) : ""))}" placeholder="e.g. PSYC 101"><datalist id="grpCourses">${opts}</datalist></label>
      <div class="f grp-color-pick"><span class="lh">Group Color</span>
        <p class="gc-auto mini" hidden><span class="gc-dot" aria-hidden="true"></span><span class="gc-auto-t"></span></p>
        <div class="gc-free"><div class="mc-grid gc-grid" role="group" aria-label="Group color">${MEMBER_COLORS.map(c => `<button type="button" class="mc-sw" data-gc="${c}" style="--mc:${c}" aria-pressed="false" aria-label="Use this color"></button>`).join("")}<label class="gc-any" title="Any color"><input type="color" class="gc-any-in" aria-label="Pick any color"><span aria-hidden="true">+</span></label></div></div>
        <input type="hidden" name="gcolor" value="">
        <span class="mini">Members with this course in their own planner see the group in their course's color.</span></div>
      <div class="f grp-icon-pick"><span class="lh">Icon <span class="hint">optional, one sticker</span></span>
        <div class="gi-row"><span class="gi-cur" id="giCur">${edit && iconKey(g) ? stickerSvg(iconKey(g)) : "None"}</span><button type="button" class="btn small" id="giOpen" aria-expanded="false">Choose a Sticker</button><button type="button" class="btn small" id="giClear"${edit && iconKey(g) ? "" : " hidden"}>Remove</button></div>
        <div class="gi-panel" id="giPanel" hidden><select id="giPack" aria-label="Sticker pack"></select><div class="gi-grid" id="giGrid" role="group" aria-label="Stickers"></div></div>
        <input type="hidden" name="icon" value="${esc(edit ? iconKey(g) : "")}"></div>
      ${edit && proj ? "" : `<label class="f" data-only="study"><span class="lh">Weekly Focus Goal <span class="hint">optional, minutes per member</span></span><input type="number" name="goal" min="0" max="10080" step="15" inputmode="numeric" value="${edit ? Number(g.weekly_goal) || "" : ""}" placeholder="e.g. 120"></label>`}
      ${edit && !proj ? "" : `<label class="f" data-only="project"${edit ? "" : " hidden"}><span class="lh">Due Date <span class="hint">optional</span></span><input type="date" name="due" value="${esc(edit && g.project_due ? g.project_due : "")}"></label>`}
      ${edit ? "" : `<label class="f" data-only="project" hidden><span class="lh">First Task List <span class="hint">optional</span></span><input type="text" name="list" maxlength="80" placeholder="e.g. Poster, Slides or Report"></label>`}
      ${edit ? `<fieldset class="grp-feats"><legend>Features</legend><p class="mini" style="margin:0 0 6px">Turn off what your ${proj ? "team" : "group"} doesn't use, so everyone only sees what you need. Nothing is deleted: turn it back on any time.</p>
        ${GFEAT[proj ? "project" : "study"].map(([k, l]) => `<label class="grp-feat"><input type="checkbox" name="feat" value="${k}" ${featOn(g, k) ? "checked" : ""}><span>${esc(l)}</span></label>`).join("")}
        ${(gxIsOn => GXFEAT[proj ? "project" : "study"].map(([k, l]) => `<label class="grp-feat is-pro${gxIsOn ? "" : " is-locked"}"${gxIsOn ? "" : ` aria-disabled="true"`}><input type="checkbox" name="feat" value="${k}" ${gxIsOn && featOn(g, k) ? "checked" : ""}${gxIsOn ? "" : " disabled"}><span>${esc(l)}</span><span class="pro-badge">PRO</span></label>`).join(""))(typeof gxOn === "function" && gxOn(g))}
        ${typeof gxOn === "function" && gxOn(g) ? "" : `<p class="mini" style="margin:6px 0 0">Features marked PRO come with a Pro group. A member with Studyboard Pro can make this a Pro group.</p>`}</fieldset>` : ""}
      ${edit ? `<div class="cap-row"><span style="flex:1;font-weight:600">Save as Template<span class="sub">Start your next ${proj ? "project" : "group"} with this setup${proj ? " and its tasks" : ""}. It shows up in New Group.</span></span><button type="button" class="btn small" data-act="gx-tpl-save" data-id="${esc(g.id)}">Save</button></div>` : ""}
      ${edit ? `<div class="cap-row"><span style="flex:1;font-weight:600">Invite Code<span class="sub">${esc(g.invite_code)}. Make a new one if the old code got passed around. The old link stops working.</span></span><button type="button" class="btn small" id="grpNewCode">New Code</button></div>` : ""}</div>
      <div class="sheet-foot">${edit ? `<button type="button" class="btn danger" id="grpDel">Delete ${proj ? "Project" : "Group"}</button>` : ""}<span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit id="grpSave">${edit ? "Save" : "Create Group"}</button></div></form>`, fd => {
      const name = String(fd.get("name") || "").trim().slice(0, 80), course = String(fd.get("course") || "").trim().slice(0, 80);
      if (!name) return false;
      const gcolor = /^#[0-9A-F]{6}$/.test(String(fd.get("gcolor") || "")) ? String(fd.get("gcolor")) : "";
      const kind = edit ? (proj ? "project" : "study") : (($(".grp-kind [aria-pressed=true]") || {dataset: {}}).dataset.kind || "study");
      const icon = STICKERS[String(fd.get("icon") || "")] ? String(fd.get("icon")) : "";
      const tpl = edit ? null : tpls().find(t => t.id === (dlg.querySelector(".grp-tpls [aria-pressed=true]") || {dataset: {}}).dataset.tpl) || null;
      const goal = Math.max(0, Math.min(10080, Math.round(Number(fd.get("goal")) || 0))), due = String(fd.get("due") || "").slice(0, 10), list = String(fd.get("list") || "").trim().slice(0, 80);
      const b = $("#grpSave"); busyBtn(b, true);
      if (edit) {
        const patchG = {name, course};
        if (gcolor && gcolor !== String(g.color || "").toUpperCase()) patchG.color = gcolor;
        const shown = new Set(fd.getAll("feat").map(String)), hidden = GFEAT[proj ? "project" : "study"].map(x => x[0]).filter(k => !shown.has(k))
          .concat(GXFEAT[proj ? "project" : "study"].map(x => x[0]).filter(k => typeof gxOn === "function" && gxOn(g) ? !shown.has(k) : hiddenOf(g).has(k)));
        if (hidden.join() !== [...hiddenOf(g)].filter(k => GFEAT[proj ? "project" : "study"].some(x => x[0] === k)).join()) patchG.hidden_features = hidden;
        if (proj) { if (due !== (g.project_due || "")) patchG.project_due = due || null; }
        else if (goal !== (Number(g.weekly_goal) || 0)) patchG.weekly_goal = goal;
        (async () => { try {
          try { await api.updateGroup(g.id, patchG); }
          catch(e1) { const m1 = String(e1 && e1.message || ""); if (!(("hidden_features" in patchG && /hidden_features/i.test(m1)) || ("color" in patchG && /color/i.test(m1)))) throw e1;
            delete patchG.hidden_features; delete patchG.color; await api.updateGroup(g.id, patchG); toast("Saved. Some settings need the latest supabase-groups.sql on your server."); }
          Object.assign(g, patchG);
          if (icon !== iconKey(g)) { try { await setGroupIcon(g, icon); } catch(e2) { toast(`Saved, but the icon couldn't be saved. ${e2.message}`); } }
          if (dlg.open) dlg.close(); toast(proj ? "Project saved" : "Group saved"); if (ui.grp === g.id) patch(g.id); else render(); } catch(e) { busyBtn(b, false); toast(e.message); } })();
      } else ensureName(async () => {
        try {
          const gid = await api.createGroup(name, course); let note = "";
          if (kind === "project") {
            try { await api.setGroupKind(gid, "project", due); const chk = await api.group(gid); if (!chk || chk.kind !== "project") throw new Error("The group didn't become a project."); }
            catch(e) {
              let gone = false; try { await api.deleteGroup(gid); gone = true; } catch(e2) {}
              busyBtn(b, false);
              toast(gone ? `Couldn't make a group project, so nothing was created. ${e.setup ? e.message : "Try again. If it keeps happening, run the latest supabase-groups.sql on your server."}` : `${name} was made as a study group because the project setting failed. Open it, then choose Edit Group, or delete it and try again.`);
              S.groups = null; loadGroups(); return;
            }
            if (list) { try { await api.ptNewList(gid, list, course); } catch(e) {} }
          } else if (goal) { try { await api.updateGroup(gid, {weekly_goal: goal}); } catch(e) {} }
          if (gcolor) { try { await api.updateGroup(gid, {color: gcolor}); } catch(e) {} }
          if (icon) { try { await setGroupIcon({id: gid}, icon); } catch(e) { note = ` The icon couldn't be saved. ${e.message}`; } }
          if (tpl && tpl.kind === kind && (tpl.hidden || []).length) { try { await api.updateGroup(gid, {hidden_features: tpl.hidden.filter(k => GFEAT[kind].some(x => x[0] === k))}); } catch(e) {} }
          if (dlg.open) dlg.close(); S.groups = null; ui.tab = "groups"; ui.grp = gid; render(); await loadGroups();
          if (tpl && tpl.kind === "project" && kind === "project" && (tpl.tasks || []).length) tplTasksWhenReady(gid, tpl.id);
          askColorSoon(gid); toast(`${name} is ready. Invite your ${kind === "project" ? "team" : "classmates"}.${note}`, null, {label: "Invite", fn: () => inviteSheet(groupOf(gid))});
        }
        catch(e) { busyBtn(b, false); toast(e.message); }
      });
      return false;
    });
    {
    {
      const gin = dlg.querySelector('input[name="gcolor"]'), cin = dlg.querySelector('input[name="course"]');
      const auto = dlg.querySelector(".gc-auto"), free = dlg.querySelector(".gc-free"), anyIn = dlg.querySelector(".gc-any-in"), anyL = dlg.querySelector(".gc-any");
      let chosen = edit && g && /^#[0-9A-F]{6}$/i.test(g.color || "") ? g.color.toUpperCase() : "";
      const setC = c => { if (!gin) return; gin.value = c || ""; dlg.querySelectorAll("[data-gc]").forEach(b => { const on = b.dataset.gc === gin.value; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); b.textContent = on ? "✓" : ""; });
        const custom = !!gin.value && !MEMBER_COLORS.includes(gin.value); if (anyL) { anyL.classList.toggle("on", custom); anyL.style.setProperty("--mc", custom ? gin.value : "transparent"); } if (anyIn && custom) anyIn.value = gin.value.toLowerCase(); };
      const sync = () => {
        const cid = matchCourse(cin && cin.value), c = cid && courseOf(cid);
        if (c && auto && free) {
          const col = String(colorOf(cid)).toUpperCase(); auto.hidden = false; free.hidden = true;
          auto.querySelector(".gc-dot").style.background = col; auto.querySelector(".gc-auto-t").textContent = `Matches your ${courseLabel(c)} color. Change it there to change it here.`;
          if (gin) gin.value = /^#[0-9A-F]{6}$/.test(col) ? col : "";
        } else { if (auto) auto.hidden = true; if (free) free.hidden = false; setC(chosen || (edit && g ? String(grpColor(g)).toUpperCase() : MEMBER_COLORS[5])); }
      };
      dlg.querySelectorAll("[data-gc]").forEach(b => b.addEventListener("click", () => { chosen = b.dataset.gc; setC(chosen); }));
      if (anyIn) anyIn.addEventListener("input", () => { chosen = anyIn.value.toUpperCase(); setC(chosen); });
      if (cin) cin.addEventListener("input", sync);
      sync();
    }
      const inp = dlg.querySelector('input[name="icon"]'), cur = $("#giCur"), panel = $("#giPanel"), packSel = $("#giPack"), grid = $("#giGrid"), open = $("#giOpen"), clear = $("#giClear");
      const packs = STICKER_PACKS.filter(p => owns("sticker", p.id) && Object.keys(p.items).length);
      packSel.innerHTML = packs.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("");
      const show = () => { const p = packs.find(x => x.id === packSel.value) || packs[0]; grid.innerHTML = p ? Object.keys(p.items).filter(k => STICKERS[k]).map(k => `<button type="button" data-k="${esc(k)}" aria-pressed="${inp.value === k}" aria-label="${esc(k)}">${stickerSvg(k)}</button>`).join("") : ""; };
      const set = k => { inp.value = k || ""; cur.innerHTML = k && STICKERS[k] ? stickerSvg(k) : "None"; clear.hidden = !k; show(); };
      open.addEventListener("click", () => { panel.hidden = !panel.hidden; open.setAttribute("aria-expanded", String(!panel.hidden)); if (!panel.hidden) { const sp = STICKERS[inp.value]; if (sp && packs.some(x => x.id === sp.pack)) packSel.value = sp.pack; show(); } });
      packSel.addEventListener("change", show);
      grid.addEventListener("click", e => { const b = e.target.closest("[data-k]"); if (b) { set(b.dataset.k); panel.hidden = true; open.setAttribute("aria-expanded", "false"); } });
      clear.addEventListener("click", () => set(""));
    }
    if (!edit && TPL.length) {
      dlg.querySelectorAll(".grp-tpls [data-tpl]").forEach(b => b.addEventListener("click", () => {
        dlg.querySelectorAll(".grp-tpls [data-tpl]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
        const t = TPL.find(x => x.id === b.dataset.tpl), f = dlg.querySelector("form");
        if (!t) return;
        const kb = dlg.querySelector(`.grp-kind [data-kind="${t.kind === "project" ? "project" : "study"}"]`); if (kb) kb.click();
        if (t.course) f.elements.course.value = t.course;
        if (f.elements.goal) f.elements.goal.value = t.goal || "";
        if (t.icon && STICKERS[t.icon]) { f.elements.icon.value = t.icon; const cur = $("#giCur"), cl = $("#giClear"); if (cur) cur.innerHTML = stickerSvg(t.icon); if (cl) cl.hidden = false; }
        const nm = f.elements.name; nm.placeholder = `e.g. ${t.name}`; nm.focus();
      }));
    }
    if (!edit) {
      const sh = dlg.querySelector(".sheet"), pick = kind => {
        sh.querySelectorAll(".grp-kind button").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.kind === kind)));
        sh.querySelectorAll("[data-only]").forEach(x => { x.hidden = x.dataset.only !== kind; });
        sh.querySelectorAll(".grp-kind-note").forEach(x => { x.hidden = x.dataset.for !== kind; });
        sh.querySelector(".grp-nm-l").textContent = kind === "project" ? "Project Name" : "Group Name";
        const sv = sh.querySelector("#grpSave"); if (sv) sv.textContent = kind === "project" ? "Create Project" : "Create Group";
        sh.querySelector("input[name=name]").placeholder = kind === "project" ? "e.g. Biology Poster" : "e.g. Biology Study Squad";
      };
      sh.querySelectorAll(".grp-kind button").forEach(x => x.addEventListener("click", () => pick(x.dataset.kind)));
      pick("study");
    }
    if (!edit) return;
    $("#grpNewCode").addEventListener("click", async e => {
      busyBtn(e.currentTarget, true);
      try { g.invite_code = await api.newCode(g.id); toast(`New invite code: ${g.invite_code}`); newGroupSheet(g); } catch(err) { busyBtn(e.currentTarget, false); toast(err.message); }
    });
    $("#grpDel").addEventListener("click", () => confirmSheet(`Delete ${g.name}?`, "This removes the group, its message board and everything shared in it for all members. Copies people added to their own boards and flashcards stay. You can restore it for 30 days under Recently Deleted Groups.", "Delete Group", async () => {
      try { await api.deleteGroup(g.id); S.groups = (S.groups || []).filter(x => x.id !== g.id); ui.grp = null; unsubscribe(); render(); toast(`Deleted ${g.name}. You can restore it for 30 days.`); loadGroups(true); } catch(e) { toast(e.message); }
    }));
  }
  function inviteSheet(g){
    if (!g) return;
    rememberWebUrl();
    const link = linkFor("group", g.invite_code);
    if (isOwner(g) && typeof PLAN !== "undefined" && PLAN && PLAN.paywall() && !(PLAN.limitsPro ? PLAN.limitsPro() : PLAN.isPro()) && PLAN.limitNote && (S.members[g.id] || []).length >= PLAN.limits().groupMembers)
      setTimeout(() => PLAN.limitNote("group", `${g.name} has ${PLAN.limits().groupMembers} members, the most a free group holds. Upgrade to Pro for groups of up to ${PLAN.proLimits().groupMembers}.`, {reason: `Pro groups hold up to ${PLAN.proLimits().groupMembers} members.`}), 300);
    openSheet(`<div class="sheet">${head("Invite to " + g.name)}<div class="sheet-body">
      <p style="margin:0">Send this link or code to ${isProj(g) ? "your teammates" : "classmates"}. After they sign in to Studyboard, they can join. ${isOwner(g) ? "You can make a new code in Edit Group." : ""}</p>
      ${(() => { if (!isOwner(g) || typeof PLAN === "undefined" || !PLAN || !PLAN.paywall() || (PLAN.limitsPro ? PLAN.limitsPro() : PLAN.isPro())) return ""; const n = (S.members[g.id] || []).length, lim = PLAN.limits().groupMembers; return `<div class="grp-note">Free groups hold up to ${lim} members${n >= lim ? " and yours is full" : ` (${n} now)`}. <button type="button" class="link-btn" data-act="grp-upgrade" data-r="Pro groups hold up to 100 members.">Go Pro</button> for up to 100.</div>`; })()}
      <div class="grp-code-big" aria-label="Invite code">${esc(g.invite_code)}</div>
      ${link ? `<div class="grp-link"><input type="text" readonly value="${esc(link)}" aria-label="Invite link" id="grpInvLink"><button type="button" class="btn small" id="grpInvCopy">Copy Link</button></div>` : `<p class="mini" style="margin:0">They can type the code in Studyboard: Groups, then Enter a Code.</p>`}</div>
      <div class="sheet-foot"><button type="button" class="btn" id="grpInvCode">Copy Code</button><span class="spacer"></span><button type="button" class="btn primary" id="grpInvSend">Send Invite</button></div></div>`);
    const text = `Join my ${isProj(g) ? "group project" : "study group"} "${g.name}" on Studyboard. Code: ${g.invite_code}`;
    const ic = $("#grpInvCopy"); if (ic) ic.addEventListener("click", () => copyText(link, "Invite link copied"));
    $("#grpInvCode").addEventListener("click", () => copyText(g.invite_code, "Code copied"));
    $("#grpInvSend").addEventListener("click", () => sendText(isProj(g) ? "Group Project Invite" : "Study Group Invite", text, link));
  }
  function shareDeckToGroupSheet(g, pre){
    const ds = decksArr().filter(d => d.cards.length || (d.aiQuizzes || []).length);
    if (!ds.length) { toast("Make a deck with some cards first"); return; }
    const mineIn = new Map((S.items[g.id] || []).filter(x => x.kind === "deck" && x.user_id === myId()).map(x => [x.ref_id, x]));
    openSheet(`<form class="sheet">${head("Share a Deck")}<div class="sheet-body">
      <p style="margin:0">Members can study it right away or add their own copy. They get your cards, not your study progress.</p>
      <fieldset><legend>Deck</legend><div class="check-list grp-pick">${ds.map((d, i) => `<label class="mi-check"><input type="radio" name="deck" value="${esc(d.id)}" ${(pre ? d.id === pre : i === 0) ? "checked" : ""}> <span><b>${esc(d.name)}</b> <span class="mini">${plural(d.cards.length, "card")}${(d.aiQuizzes || []).length ? `, ${plural(d.aiQuizzes.length, "quiz", "quizzes")}` : ""}${mineIn.has(d.id) ? " · already shared, sharing again updates it" : ""}</span></span></label>`).join("")}</div></fieldset>
      ${ds.some(d => (d.aiQuizzes || []).length) ? `<label class="mi-check"><input type="checkbox" name="withQ" checked> Include practice quizzes</label>` : ""}</div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit id="grpShareGo">Share With ${esc(g.name.length > 22 ? "Group" : g.name)}</button></div></form>`, fd => {
      const d = state.decks[fd.get("deck")]; if (!d) return false;
      const p = deckPayload(d, !!fd.get("withQ")), b = $("#grpShareGo"); busyBtn(b, true);
      ensureName(async () => {
        try {
          const ex = mineIn.get(d.id);
          if (ex) await api.updateItem(ex.id, {title: str(d.name, 300), data: p}); else await api.addItems([{group_id: g.id, kind: "deck", ref_id: d.id, title: str(d.name, 300) || "Deck", data: p}]);
          if (dlg.open) dlg.close(); toast(ex ? `Updated ${d.name} in ${g.name}` : `Shared ${d.name} with ${g.name}`); loadGroup(g.id);
        } catch(e) { busyBtn(b, false); toast(e.message); }
      });
      return false;
    });
  }
  function shareTasksSheet(g){
    const today = todayISO();
    const all = tasksArr().filter(t => t.status !== "done" && t.due && t.due >= today).sort((a, b) => a.due.localeCompare(b.due) || (a.time || "").localeCompare(b.time || ""));
    const shared = new Set((S.items[g.id] || []).filter(x => x.kind === "task" && x.user_id === myId()).map(x => x.ref_id));
    const pre = matchCourse(g.course), locked = !!String(g.course || "").trim();
    if (locked && !pre) {
      openSheet(`<div class="sheet">${head("Share Deadlines")}<div class="sheet-body"><p style="margin:0">This group is for <b>${esc(g.course)}</b>. Add ${esc(g.course)} to your courses (with that course code) to share its deadlines here.</p></div>
        <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-act="close">OK</button></div></div>`);
      return;
    }
    if (!all.filter(t => !locked || t.courseId === pre).length) { toast(locked ? `You have no upcoming ${g.course} tasks with a due date to share` : "You have no upcoming tasks with a due date to share"); return; }
    const listHtml = cid => { const ts2 = all.filter(t => !cid || t.courseId === cid);
      return ts2.length ? ts2.map(t => { const c = courseOf(t.courseId), done = shared.has(t.id);
        return `<label class="mi-check${done ? " is-done" : ""}"><input type="checkbox" name="t" value="${esc(t.id)}" ${done ? "disabled" : cid ? "checked" : ""}> <span><b>${esc(t.title)}</b> <span class="mini">${esc(fmtShort(t.due))}${t.time ? " " + esc(fmtTime(t.time)) : ""} · ${esc(c ? courseLabel(c) : "General")} · ${esc(t.type)}${done ? " · already shared" : ""}</span></span></label>`; }).join("")
        : `<p class="mini" style="margin:0">No upcoming tasks in this course.</p>`; };
    openSheet(`<form class="sheet">${head("Share Deadlines")}<div class="sheet-body">
      <p style="margin:0">Pick a course's upcoming tasks, or just the ones you want. Members can add them to their own board, and if you change one later, the group's copy updates too.</p>
      ${locked ? `<p class="mini" style="margin:0">Only ${esc(g.course)} deadlines can be shared in this group.</p>` : `<label class="f">Course<select id="grpTC"><option value="">All Courses</option>${coursesArr().map(c => `<option value="${esc(c.id)}" ${c.id === pre ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label>`}
      <div class="check-list grp-pick" id="grpTL">${listHtml(pre)}</div></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit id="grpTGo">Share</button></div></form>`, () => {
      const ids = $$("#grpTL input:checked").map(i => i.value).filter(id => state.tasks[id]);
      if (!ids.length) { toast("Tick the tasks you want to share"); return false; }
      const b = $("#grpTGo"); busyBtn(b, true);
      ensureName(async () => {
        try {
          const rows = await api.addItems(ids.map(id => { const t = state.tasks[id]; return {group_id: g.id, kind: "task", ref_id: t.id, title: str(t.title, 300) || "Untitled", data: taskPayload(t)}; }));
          if (dlg.open) dlg.close(); toast(`Shared ${plural(ids.length, "deadline")} with ${g.name}`);
          if (rows && S.items[g.id]) { S.items[g.id] = rows.concat(S.items[g.id]); indexItems(g.id, S.items[g.id]); patch(g.id); }
          loadGroup(g.id);
        } catch(e) { busyBtn(b, false); toast(e.message); }
      });
      return false;
    });
    const upd = () => { const n = $$("#grpTL input:checked").length; $("#grpTGo").textContent = n ? `Share ${plural(n, "Deadline")}` : "Share"; };
    const tc = $("#grpTC"); if (tc) tc.addEventListener("change", e => { $("#grpTL").innerHTML = listHtml(e.target.value); upd(); });
    $("#grpTL").addEventListener("change", upd); upd();
  }

  /* Actions */
  window.SBGRPFAB = () => {
    const g = ui.grp ? groupOf(ui.grp) : null; if (!g || !isProj(g) || !$("#grpDetail")) return null;
    const t = curTab(g);
    return t === "tasks" ? {act: "grp-pt-new", label: "Add Task"} : t === "files" ? {act: "grp-file-new", label: "Add File", id: g.id} : null;
  };
  function openGroup(gid){
    if (dlg.open) dlg.close();
    ui.tab = "groups"; ui.grp = gid || null; render(); window.scrollTo(0, 0);
  }
  const itemOf = id => { for (const k in S.items) { const it = (S.items[k] || []).find(x => x.id === id); if (it) return it; } return null; };
  function itemDeck(it){ const p = cleanPayload(it.data); if (p) p.name = str(it.title, 120) || p.name; return p; }
  function addTaskCopy(it, g){
    const f = taskFields(it.data), p = it.data || {};
    const t = normTask(Object.assign(f, {id: uid(), courseId: matchCourse(p.course), status: "todo", start: f.start || (f.due && f.due < todayISO() ? f.due : todayISO()),
      checklist: (Array.isArray(p.checklist) ? p.checklist : []).slice(0, 50).map(s => ({id: uid(), text: str(s, 400), done: false})).filter(i => i.text.trim()),
      groupRef: {g: g.id, i: it.id, v: it.updated_at, n: g.name}}));
    if (t.start && t.due && t.start > t.due) t.start = t.due;
    applyChanges([{kind: "task", id: t.id, after: t}], `Added ${t.title} to your board`);
  }
  function updateTaskCopy(it, g){
    const t = copyOfTask(it.id); if (!t) return;
    const f = taskFields(it.data), p = it.data || {}, n = Object.assign(clone(t), f);
    const have = new Set((n.checklist || []).map(i => i.text.trim().toLowerCase()));
    (Array.isArray(p.checklist) ? p.checklist : []).slice(0, 50).forEach(s => { s = str(s, 400); if (s.trim() && !have.has(s.trim().toLowerCase())) n.checklist.push({id: uid(), text: s, done: false}); });
    if (n.start && n.due && n.start > n.due) n.start = n.due;
    n.groupRef = Object.assign({}, t.groupRef, {v: it.updated_at, n: g.name});
    applyChanges([{kind: "task", id: t.id, after: n}], `Updated ${n.title} from ${g.name}`);
  }
  function openTask(t){ if (!t) return; if (dlg.open) dlg.close(); taskForm(state.tasks[t.id]); }

  hook("act", (act, el, id) => {
    if (!act.startsWith("grp-") && act !== "fc-share" && act !== "qz-share" && act !== "qz-share-to") return false;
    const g = groupOf(ui.grp);
    switch (act) {
      case "grp-page": openGroup(null); return true;
      case "grp-to-decks": ui.tab = "flashcards"; ui.fc = null; ui.deckId = null; render(); window.scrollTo(0, 0); return true;
      case "grp-open": openGroup(id); return true;
      case "grp-open-ref": openGroup(id); return true;
      case "grp-back": ui.grp = null; unsubscribe(); render(); window.scrollTo(0, 0); return true;
      case "grp-retry": S.err = ""; if (ui.grp) { delete S.errG[ui.grp]; loadGroup(ui.grp); } else { S.groups = null; loadGroups(); } render(); return true;
      case "grp-code": codeSheet("", ""); return true;
      case "grp-restore": if (!needOnline()) return true; (async () => {
        const b = (S.binned || []).find(x => x.id === id);
        try { const ok = await api.restoreGroup(id); toast(ok ? `Restored ${b ? b.name : "the group"}` : "That group can't be restored anymore"); } catch(e) { toast(e.message); }
        S.groups = null; loadGroups(); })(); return true;
      case "grp-import": importDeckFile(); return true;
      case "grp-name": if (needOnline()) nameSheet(false, null); return true;
      case "grp-new": if (needOnline()) newGroupSheet(null); return true;
      case "grp-edit": if (g && isOwner(g)) newGroupSheet(g); return true;
      case "grp-invite": inviteSheet(groupOf(id) || g); return true;
      case "grp-leave": if (g) confirmSheet(`Leave ${g.name}?`, "You'll stop seeing its decks, quizzes, sessions and messages. Anything you added to your own board or flashcards stays. You can rejoin with the invite code.", "Leave Group", async () => {
        try { await api.removeMember(g.id, myId()); S.groups = (S.groups || []).filter(x => x.id !== g.id); ui.grp = null; unsubscribe(); render(); toast(`You left ${g.name}`); } catch(e) { toast(e.message); } }); return true;
      case "grp-member-del": { const m = g && (S.members[g.id] || []).find(x => x.user_id === id); if (!m) return true;
        confirmSheet(`Remove ${m.display_name || "This Member"}?`, `They'll stop seeing ${g.name}. What they shared stays unless you remove it. They could rejoin with the invite code, so make a new code in Edit Group if needed.`, "Remove", async () => {
          try { await api.removeMember(g.id, id); S.members[g.id] = (S.members[g.id] || []).filter(x => x.user_id !== id); patch(g.id); toast(`Removed ${m.display_name || "member"}`); } catch(e) { toast(e.message); } }); return true; }
      case "grp-deck-share": { const d = state.decks[id]; if (d) deckShareSheet(d); return true; }
      case "grp-file-deck": { const d = state.decks[id]; if (d) deckFileSheet(d); return true; }
      case "grp-share-copy": { const l = linkFor("deck", id); copyText(l || id, l ? "Link copied" : "Code copied"); return true; }
      case "grp-share-stop": { const s = (S.shares || []).find(x => x.code === id); confirmSheet("Stop Sharing?", `The link and code for ${s ? s.name : "this deck"} stop working. People who already added it keep their copy.`, "Stop Sharing", () => stopShare(id)); return true; }
      case "grp-share-deck": if (g) shareDeckToGroupSheet(g); return true;
      case "grp-share-tasks": if (g) shareTasksSheet(g); return true;
      case "grp-item-view": { const it = itemOf(id), p = it && itemDeck(it); if (!p) { if (it) toast("That deck couldn't be read."); return true; }
        previewSheet({p, sharer: it.user_id === myId() ? "" : it.author_name, isMine: it.user_id === myId(), item: it, meta: {g: it.group_id, i: it.id, v: it.updated_at, by: it.author_name, n: g ? g.name : ""}}); return true; }
      case "grp-item-add": case "grp-item-study": { const it = itemOf(id), p = it && itemDeck(it); if (!p) return true;
        const ex = copyOfItem(it.id);
        const go = nd => { if (act === "grp-item-study" && nd.cards.length) { ui.tab = "flashcards"; startStudy([nd.id]); } else if (act === "grp-item-study") { const qz = nd.aiQuizzes[0]; if (qz) startAiQuiz(nd.id, qz.id); } };
        if (ex) { go(ex); return true; }
        addDeckCopy(p, {g: it.group_id, i: it.id, v: it.updated_at, by: it.author_name, n: g ? g.name : ""}, matchCourse(p.course) || matchCourse(g && g.course), go, act === "grp-item-add");
        return true; }
      case "grp-item-open": { const d = copyOfItem(id); if (d) { ui.tab = "flashcards"; ui.fc = null; ui.deckId = d.id; render(); window.scrollTo(0, 0); } return true; }
      case "grp-item-update": { const it = itemOf(id), d = copyOfItem(id), p = it && itemDeck(it); if (!d || !p) return true;
        const r = mergeDeck(d, p, {v: it.updated_at, by: it.author_name});
        saveDeck(r.nd, mergeMsg(d.name, r));
        if (S.changed[it.group_id]) { S.changed[it.group_id]--; updateNavBadge(); }
        return true; }
      case "grp-item-push": { const it = itemOf(id), d = it && state.decks[it.ref_id]; if (!d) return true;
        const nq = Array.isArray((it.data || {}).quizzes) ? it.data.quizzes.length : 0;
        busyBtn(el, true);
        (async () => { try { const row = await api.updateItem(it.id, {title: str(d.name, 300), data: deckPayload(d, nq > 0 || !(it.data || {}).cards)}); Object.assign(it, row || {}); toast(`Updated ${d.name} for the group`); patch(it.group_id); } catch(e) { busyBtn(el, false); toast(e.message); } })();
        return true; }
      case "grp-item-del": { const it = itemOf(id); if (!it) return true;
        confirmSheet("Remove from Group?", `${it.title} disappears from ${g ? g.name : "the group"} for everyone. Copies people already added stay on their own boards.`, "Remove", async () => {
          try { await api.removeItem(it.id); S.items[it.group_id] = (S.items[it.group_id] || []).filter(x => x.id !== it.id); indexItems(it.group_id, S.items[it.group_id]); patch(it.group_id); toast(`Removed ${it.title}`); } catch(e) { toast(e.message); } });
        return true; }
      case "grp-task-add": { const it = itemOf(id); if (it && g) { addTaskCopy(it, g); ui.tab = "groups"; } return true; }
      case "grp-task-update": { const it = itemOf(id); if (it && g) { updateTaskCopy(it, g); if (S.changed[g.id]) { S.changed[g.id]--; updateNavBadge(); } } return true; }
      case "grp-task-open": openTask(copyOfTask(id)); return true;
      case "grp-report": { const k = el && el.dataset ? el.dataset.kind : ""; if (g && ["message", "item", "member"].includes(k)) reportSheet(g, k, id); return true; }
      case "grp-unblock": unblockUser(id); return true;
      case "grp-color": { const gg = groupOf(id); if (gg) colorSheet(gg, false); return true; }
      case "grp-msg-del": { const m = g && (S.msgs[g.id] || []).find(x => x.id === id); if (!m) return true;
        confirmSheet("Delete Message?", "It's removed for everyone in the group.", "Delete", async () => {
          try { await api.unpost(m.id); S.msgs[g.id] = (S.msgs[g.id] || []).filter(x => x.id !== m.id); patch(g.id); } catch(e) { toast(e.message); } });
        return true; }
      case "grp-share-quiz": if (g) shareQuizSheet(g); return true;
      case "fc-share": case "qz-share": {
        const deck = act === "fc-share", ref = deck ? el.dataset.id : el.dataset.deck + ":" + el.dataset.id, gs = S.groups || [];
        const send = gg => deck ? shareDeckToGroupSheet(gg, ref) : shareQuizSheet(gg, ref);
        const linkRow = `<button type="button" data-act="share-link" data-kind="${deck ? "deck" : "quiz"}" data-ref="${esc(ref)}"><span><b>Anyone With the Link</b><span class="sub">A link that opens in any browser, no account needed</span></span></button>`;
        if (!online()) { if (window.SBSHARE) SBSHARE.shareRef(deck ? "deck" : "quiz", ref); else toast(`Sign in to share ${deck ? "decks" : "quizzes"}`); return true; }
        if (S.groups == null && !el.dataset.tried) { el.dataset.tried = "1"; loadGroups(true).then(() => { if (el.isConnected) el.click(); }).catch(() => {}); return true; }
        if (!gs.length) { if (window.SBSHARE) SBSHARE.shareRef(deck ? "deck" : "quiz", ref); else toast(`Join or start a study group to share ${deck ? "decks" : "quizzes"}`, null, {label: "Study Groups", fn: () => openGroup(null)}); return true; }
        openSheet(`<div class="sheet">${head(deck ? "Share Deck" : "Share Quiz")}<div class="sheet-body"><div class="menu-list">${window.SBSHARE ? linkRow : ""}${gs.map(x => `<button type="button" data-act="qz-share-to" data-id="${esc(x.id)}" data-ref="${esc(ref)}" data-kind="${deck ? "deck" : "quiz"}"><span><b>${esc(x.name)}</b>${x.course ? `<span class="sub">${esc(x.course)}</span>` : ""}</span></button>`).join("")}</div></div></div>`);
        return true;
      }
      case "qz-share-to": { const gg = groupOf(el.dataset.id); if (gg) (el.dataset.kind === "deck" ? shareDeckToGroupSheet(gg, el.dataset.ref) : shareQuizSheet(gg, el.dataset.ref)); return true; }
      case "grp-quiz-take": { const it = itemOf(id); if (it) takeQuiz(it); return true; }
      case "grp-quiz-scores": { const it = itemOf(id); if (it) scoresSheet(it); return true; }
      case "grp-score-shown": { setScoreShown(id, el.dataset.v); return true; }
      case "grp-quiz-push": { const it = itemOf(id), src = it && quizSource(it); if (!src) return true;
        busyBtn(el, true);
        (async () => { try { const row = await api.updateItem(it.id, {title: str(src.qz.title, 300) || "Practice Quiz", data: quizPayload(src.qz, src.d.courseId)}); Object.assign(it, row || {}); toast("Updated the quiz for the group"); patch(it.group_id); } catch(e) { busyBtn(el, false); toast(e.message); } })();
        return true; }
      case "grp-event-new": if (g) eventSheet(g); return true;
      case "grp-cal-add": { const it = itemOf(id); if (g && it) { calAdd(g, it); patch(g.id); } return true; }
      case "grp-event-edit": { const it = itemOf(id); if (g && it && it.user_id === myId()) eventSheet(g, it); return true; }
      case "grp-rsvp": { const x = g && extOf(g.id), it = itemOf(id); if (!x || !it) return true;
        const status = el.dataset.s, cur = x.rsvps.find(r => r.item_id === id && r.user_id === myId()), next = cur && cur.status === status ? null : status;
        x.rsvps = x.rsvps.filter(r => !(r.item_id === id && r.user_id === myId()));
        if (next) x.rsvps.push({item_id: id, group_id: g.id, user_id: myId(), status: next});
        if (next === "yes") calAdd(g, it, `You're in. ${it.title} is on your calendar.`); else if (cur && cur.status === "yes") calDrop(it);
        patch(g.id);
        api.rsvp(id, next).catch(e => { toast(e.message); loadExtras(g.id); });
        return true; }
      case "grp-tab": showTab(g, el.dataset.t); return true;
      case "grp-lb": if (g) { S.lb[g.id] = el.dataset.m === "quiz" ? "quiz" : "focus"; patch(g.id); } return true;
      case "grp-check-done": { const x = g && extOf(g.id), mine = x && x.checkins.find(c => c.user_id === myId() && c.day === todayISO()); if (!mine) return true;
        mine.done = !mine.done; patch(g.id);
        api.checkin(g.id, mine.day, mine.plan, mine.done).then(() => { if (mine.done) toast("Nice work. Marked as done."); }).catch(e => { toast(e.message); loadExtras(g.id); });
        return true; }
      case "grp-react-open": S.pick = S.pick === id ? "" : id; if (g) patch(g.id); return true;
      case "grp-react": { const x = g && extOf(g.id); if (!x) return true; const kind = el.dataset.k;
        const i = x.reactions.findIndex(r => r.message_id === id && r.user_id === myId() && r.kind === kind);
        if (i >= 0) x.reactions.splice(i, 1); else x.reactions.push({message_id: id, user_id: myId(), kind});
        S.pick = ""; patch(g.id);
        api.react(id, kind).catch(e => { toast(e.message); loadExtras(g.id); });
        return true; }
      case "grp-pin": { const m = g && (S.msgs[g.id] || []).find(x => x.id === id); if (!m) return true;
        const on = !m.pinned; m.pinned = on; patch(g.id);
        api.pin(id, on).catch(e => { m.pinned = !on; toast(e.message); patch(g.id); });
        return true; }
      case "grp-upgrade": if (typeof PLAN !== "undefined" && PLAN) PLAN.openSheet(el.dataset.r || ""); return true;
      case "grp-link-update": { const d = state.decks[id]; if (!d || !d.sharedFrom || !d.sharedFrom.code) return true;
        busyBtn(el, true);
        (async () => { try { const r = await api.getDeck(d.sharedFrom.code); const p = r && cleanPayload(r.data);
          if (!p) { toast("That deck isn't shared anymore."); busyBtn(el, false); return; }
          const m = mergeDeck(state.decks[d.id], p, {v: r.updated_at, by: r.sharer_name}); delete S.linkNew[d.id];
          saveDeck(m.nd, mergeMsg(d.name, m));
        } catch(e) { busyBtn(el, false); toast(e.message); } })();
        return true; }
    }
    return false;
  });

  // Posting to the message board
  document.addEventListener("submit", e => {
    if (!e.target || e.target.id !== "grpPost") return;
    e.preventDefault();
    const gid = e.target.dataset.gid, ta = $("#grpMsgIn"), body = (ta.value || "").trim();
    if (!body) { ta.focus(); return; }
    const btn = $("button[type=submit]", e.target); busyBtn(btn, true);
    ensureName(async () => {
      try {
        const row = await api.post(gid, body.slice(0, 2000));
        S.drafts[gid] = ""; const t2 = $("#grpMsgIn"); if (t2) t2.value = "";
        if (row && S.msgs[gid] && !S.msgs[gid].some(x => x.id === row.id)) S.msgs[gid].unshift(row);
        patch(gid);
      } catch(err) { toast(err.message); }
      busyBtn($("#grpPost button[type=submit]"), false);
    });
  });
  // Daily check-in
  document.addEventListener("submit", e => {
    if (!e.target || e.target.id !== "grpCheck") return;
    e.preventDefault();
    const gid = e.target.dataset.gid, x = extOf(gid), plan = String(new FormData(e.target).get("plan") || "").trim().slice(0, 140), day = todayISO();
    if (!x) return;
    const btn = $("button[type=submit]", e.target); busyBtn(btn, true);
    ensureName(async () => {
      const cur = x.checkins.find(c => c.user_id === myId() && c.day === day), done = cur ? cur.done : false;
      try {
        await api.checkin(gid, day, plan, done);
        if (cur) { cur.plan = plan; cur.updated_at = new Date().toISOString(); } else { x.checkins.push({group_id: gid, user_id: myId(), day, plan, done, updated_at: new Date().toISOString()}); toast("Checked in. Have a good session."); }
        patch(gid);
      } catch(err) { toast(err.message); }
      busyBtn($("#grpCheck button[type=submit]"), false);
    });
  });
  document.addEventListener("input", e => { if (e.target && e.target.id === "grpMsgIn" && ui.grp) S.drafts[ui.grp] = e.target.value; });
  document.addEventListener("keydown", e => {
    const tb = e.target && e.target.closest && e.target.closest("#grpDetail .grp-tabs [role=tab]");
    if (tb && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
      const all = [...tb.parentNode.querySelectorAll("[role=tab]")], i = all.indexOf(tb), n = all.length;
      const to = all[e.key === "Home" ? 0 : e.key === "End" ? n - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + n) % n];
      e.preventDefault(); if (showTab(groupOf(ui.grp), to.dataset.t)) to.focus(); return;
    }
    if (e.target && e.target.id === "grpMsgIn" && e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); const f = $("#grpPost"); if (f) f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit", {cancelable: true, bubbles: true})); }
  });

  /* Hooks into the rest of the app */
  hook("menu", () => `<button data-act="grp-page"><span>Study Groups<span class="sub">Share decks, quizzes and deadlines, plan sessions, and compete on a weekly challenge</span></span></button>`);
  // Your focus time and quiz results feed the weekly challenge
  hook("stats-focus", reportSoon);
  hook("ai-quiz-done", e => {
    reportSoon();
    if (!e || e.partial || !online()) return;
    const d = state.decks[e.deckId]; if (!d) return;
    let itemId = "";
    if (d.sharedFrom && d.sharedFrom.q && d.sharedFrom.i) itemId = d.sharedFrom.i;
    else { const ref = e.deckId + ":" + e.quizId; for (const k in S.items) { const it = (S.items[k] || []).find(x => x.kind === "quiz" && x.user_id === myId() && x.ref_id === ref); if (it) { itemId = it.id; break; } } }
    if (!itemId) return;
    const it = itemOf(itemId), gid = (it && it.group_id) || (d.sharedFrom && d.sharedFrom.g);
    const posted = gid && scoresOf(gid, itemId).find(s => s.user_id === myId()), pref = gqPref(itemId);
    if (posted) { postScore(itemId, e.right, e.total, gid, posted.shown === "anon" ? "anon" : "name"); return; }
    if (pref && pref.shown === "private") { gqKeep(itemId, e.right, e.total); return; }
    const ask = () => { if (dlg.open) { dlg.addEventListener("close", () => setTimeout(ask, 350), {once: true}); return; } shareScoreSheet(itemId, e.right, e.total, gid); };
    ask();
  });

  hook("render", tab => {
    checkUser();
    if (tab === "groups") {
      keepTabFocus();
      if (online()) {
        if (S.groups == null && !S.busy && !S.err) loadGroups();
        if (!ui.grp && S.shares == null && !S.sharesBusy) loadShares();
        if (ui.grp) { if (!S.items[ui.grp] && !S.loadingG[ui.grp] && !S.errG[ui.grp]) loadGroup(ui.grp); subscribe(ui.grp); } else unsubscribe();
      }
    } else unsubscribe();
    if (tab === "flashcards") decorateFlashcards();
  });
  // Extra buttons on the Flashcards pages, added after the app draws them
  function decorateFlashcards(){
    if (ui.fc) return;
    const v = $("#view"); if (!v) return;
    const d = ui.deckId && state.decks[ui.deckId];
    if (d) {
      const ra = $(".deck-head .row-actions", v);
      if (ra && !$('[data-act="grp-deck-share"]', ra)) ra.insertAdjacentHTML("beforeend", `<button class="btn" data-act="grp-deck-share" data-id="${esc(d.id)}">${ICON_SHARE}Share</button>`);
      const st = $(".deck-head .deck-stats", v), sf = d.sharedFrom;
      if (st && (sf || d.shared) && !$(".grp-from", v)) {
        const bits = [];
        if (sf) bits.push(`${sf.by ? `From ${esc(sf.by)}'s shared deck` : "From a shared deck"}${sf.n ? ` in ${esc(sf.n)}` : ""}${sf.g ? ` <button class="link-btn" data-act="grp-open-ref" data-id="${esc(sf.g)}">Open Group</button>` : ""}${sf.code && S.linkNew[d.id] ? ` · Updated since you added it <button class="link-btn" data-act="grp-link-update" data-id="${esc(d.id)}">Get Update</button>` : ""}`);
        if (d.shared) bits.push(`Shared with code <span class="grp-code-sm">${esc(d.shared.code)}</span>`);
        st.insertAdjacentHTML("afterend", `<p class="grp-from mini">${bits.join(" · ")}</p>`);
      }
      if (sf && sf.code && online() && !S.linkChecked[d.id]) {
        S.linkChecked[d.id] = 1;
        api.getDeck(sf.code).then(r => { if (r && ts(r.updated_at) > ts(sf.v) + 1000 && !r.is_mine) { S.linkNew[d.id] = 1; if (ui.tab === "flashcards" && ui.deckId === d.id) render(); } }).catch(() => {});
      }
    } else if (!ui.deckId && !$(".grp-strip", v)) {
      const anchor = $(".hint-line", v);
      const html = `<section class="grp-strip"><div class="grp-strip-txt">${ICON_GROUP}<span><b>Study Together</b><span class="mini">Share decks with classmates.</span></span></div>
        <div class="grp-strip-btns"><button class="btn small" data-act="grp-page">Study Groups</button><button class="btn small" data-act="grp-code">Enter a Share Code</button><button class="btn small" data-act="grp-import">Import a Deck File</button></div></section>`;
      if (anchor) anchor.insertAdjacentHTML("beforebegin", html); else v.insertAdjacentHTML("beforeend", html);
    }
  }

  // Your edits to shared tasks update the group's copy a few seconds later
  hook("changed", changes => {
    const ids = changes.filter(c => c.kind === "task" && c.after).map(c => c.id);
    if (!ids.length || !online()) return;
    const idx = readIdx(); ids.forEach(id => { if (idx[id]) S.pushQ.add(id); });
    if (!S.pushQ.size) return;
    clearTimeout(S.pushT); S.pushT = setTimeout(pushTasks, 2500);
  });

  // A note on tasks copied from a group, linking back to it
  const origTaskForm = taskForm;
  taskForm = function(t, ...rest){
    const r = origTaskForm.call(this, t, ...rest);
    try {
      if (t && t.groupRef && dlg.open && !$(".grp-ref", dlg)) {
        const b = $(".sheet-body", dlg);
        if (b) b.insertAdjacentHTML("afterbegin", `<div class="grp-ref">${ICON_GROUP}<span>Copied from the study group <b>${esc(t.groupRef.n || "")}</b>.</span>${online() ? `<button type="button" class="btn small" data-act="grp-open-ref" data-id="${esc(t.groupRef.g)}">Open Group</button>` : ""}</div>`);
      }
    } catch(e) { console.warn(e); }
    return r;
  };

  // Groups button in the desktop sidebar (phones reach the page from Flashcards and Settings)
  (() => {
    const inn = $("nav.tabs .in"); if (!inn || $('[data-tab="groups"]', inn)) return;
    const b = document.createElement("button");
    b.dataset.tab = "groups"; b.className = "nav-groups"; b.innerHTML = ICON_GROUP + "Groups";
    b.addEventListener("click", () => { if (ui.tab === "groups") { ui.grp = null; unsubscribe(); } }, true);
    inn.insertBefore(b, $("#navPomo", inn) || null);
  })();

  /* Links (?deck=CODE, ?group=CODE) and update checks */
  const PEND = "sb:grpPending";
  let watchT = 0, checked = false;
  function takePending(){ try { const p = JSON.parse(localStorage.getItem(PEND) || "null"); if (p && Date.now() - p.at < 864e5) return p; localStorage.removeItem(PEND); } catch(e) {} return null; }
  function tick(){
    const p = takePending();
    const pub = p && window.SBSHARE && SBSHARE.can() && (p.kind === "share" || (p.kind === "deck" && !online()));
    if (pub) { if (!dlg.open) { try { localStorage.removeItem(PEND); } catch(e) {} SBSHARE.open(p.code); } }
    else if (p) {
      if (online()) {
        if (!dlg.open) { try { localStorage.removeItem(PEND); } catch(e) {} if (p.kind === "group") openGroupCode(p.code); else openDeckCode(p.code); }
      } else if ((!sbConfig() && sbLocalOnly()) || inPreview()) {
        if (!dlg.open) {
          try { localStorage.removeItem(PEND); } catch(e) {}
          openSheet(`<div class="sheet">${head(p.kind === "group" ? "Study Group Invite" : "Shared Deck")}<div class="sheet-body">
            <p style="margin:0">Someone sent you ${p.kind === "group" ? "an invite to a study group" : "a shared deck"} (code <b>${esc(p.code)}</b>). ${inPreview() ? "Open it on the Studyboard website or in the desktop app to add it." : "Sign in to your Studyboard account to open it."}</p>
            ${p.kind === "group" ? "" : `<p class="mini" style="margin:0">Or ask them to send the deck as a file (Share, then Share as File) and use Import a Deck File.</p>`}</div>
            <div class="sheet-foot">${p.kind === "group" ? "" : `<button type="button" class="btn" data-act="grp-import">Import a Deck File</button>`}<span class="spacer"></span>${inPreview() ? `<button type="button" class="btn primary" data-act="close">OK</button>` : `<button type="button" class="btn primary" data-act="sb-signin">Sign In</button>`}</div></div>`);
        }
      }
    }
    if (!checked && online()) {
      checked = true;
      (async () => {
        try {
          const gs = await api.groups() || []; if (!gs.length) return;
          const n = markChanges(await api.stamps(gs.map(g => g.id)) || []);
          updateNavBadge();
          if (n && ui.tab !== "groups") toast(`${plural(n, "shared item")} changed in your study groups`, null, {label: "View", fn: () => openGroup(Object.keys(S.changed).length === 1 ? Object.keys(S.changed)[0] : null)});
        } catch(e) {}
      })();
    }
    if (!takePending() && (checked || !sbConfig() || inPreview())) { clearInterval(watchT); watchT = 0; }
  }
  /* 1.16: Pro groups A Pro group gets the extras below for every member */
  /*GXP-START*/
  const GXP = (() => {
    const DAYMS = 864e5, SLOT = 30 * 60000, SLOTS = 14 * 48;
    function busyHex(from, busy){
      const bits = new Array(SLOTS).fill(0);
      busy.forEach(([a, b]) => { for (let i = Math.max(0, Math.floor((a - from) / SLOT)); i < SLOTS && from + i * SLOT < b; i++) bits[i] = 1; });
      let hex = ""; for (let i = 0; i < SLOTS; i += 4) hex += ((bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3]).toString(16);
      return hex;
    }
    function freeAt(av, a, b){
      if (!av || typeof av.hex !== "string" || !(av.from > 0)) return null;
      for (let t = a; t < b; t += SLOT) {
        const i = Math.floor((t - av.from) / SLOT); if (i < 0 || i >= av.hex.length * 4) return null;
        if ((parseInt(av.hex[i >> 2], 16) >> (3 - (i & 3))) & 1) return false;
      }
      return true;
    }
    function bestTimes(avs, days, minutes, now, n){
      const out = [], len = minutes * 60000;
      days.forEach(d => { for (let m = 8 * 60; m + minutes <= 22 * 60; m += 30) { const a = d.start + m * 60000; if (a < now + 3600000) continue; let free = 0, known = 0; avs.forEach(av => { const f = freeAt(av, a, a + len); if (f !== null) known++; if (f) free++; }); if (known) out.push({start: a, free, total: avs.length, hour: m / 60}); } });
      const pref = h => h >= 10 && h <= 19 ? 0 : 1;
      out.sort((x, y) => y.free - x.free || pref(x.hour) - pref(y.hour) || x.start - y.start);
      const pick = [], days2 = new Set();
      for (const o of out) { const dk = Math.floor(o.start / DAYMS); if (days2.has(dk) && out.some(z => !pick.includes(z) && Math.floor(z.start / DAYMS) !== dk && z.free === o.free)) continue; pick.push(o); days2.add(dk); if (pick.length >= (n || 3)) break; }
      return pick;
    }
    const ROLE_WORDS = {
      lead: /\b(plan|organi[sz]e|coordinat|schedul|integrat|final|submit|check.?in|meet|outline|timeline|budget|manage)/i,
      research: /\b(research|literature|sources?|data|survey|test|experiment|compar|analy[sz]|find|interview|measure|stud(y|ies))/i,
      editor: /\b(edit|proofread|format|citations?|reference|review|polish|revise|grammar|bibliograph|template)/i,
      presenter: /\b(slides?|present|script|video|demo|poster|practice|rehears|speech|pitch|record)/i
    };
    function split(tasks, members, roles, room, rnd){
      const load = {}, out = {}; members.forEach(m => { load[m] = 0; out[m] = []; });
      const cap = m => Math.max(0.5, Number(room && room[m]) || 1);
      const r = rnd || (() => 0.5);
      tasks.slice().sort((a, b) => String(a.due || "9999").localeCompare(String(b.due || "9999"))).forEach(t => {
        let best = null, bs = Infinity;
        members.forEach(m => {
          const role = roles && roles[m], match = role && ROLE_WORDS[role] && ROLE_WORDS[role].test(t.title) ? 1 : 0;
          const s = (load[m] + 1) / cap(m) - match * 0.6 + r() * 0.05;
          if (s < bs) { bs = s; best = m; }
        });
        if (best == null) return;
        load[best]++; out[best].push(t.id);
      });
      return out;
    }
    function rubricLines(text){
      const seen = new Set(), out = [];
      String(text || "").replace(/\r/g, "").split("\n").forEach(raw => {
        let l = raw.replace(/\s+/g, " ").trim();
        if (!l) return;
        const bullet = /^([-*•●▪◦–]|\(?\d{1,2}[.)]|\(?[a-hA-H][.)]|\[ ?\])\s+/.test(l), pts = /\b\d{1,3}\s*(points?|pts|marks?|%)\b/i.test(l);
        l = l.replace(/^([-*•●▪◦–]|\(?\d{1,2}[.)]|\(?[a-hA-H][.)]|\[ ?\])\s+/, "").replace(/\s*[-–:(]?\s*\d{1,3}\s*(points?|pts|marks?|%)\)?\.?$/i, "").trim();
        if ((!bullet && !pts) || l.length < 6 || l.length > 200 || /^(page|total|name|date|due)\b/i.test(l)) return;
        const k = l.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); if (!k || seen.has(k)) return;
        seen.add(k); out.push(l);
      });
      return out.slice(0, 40);
    }
    function shareTopics(names, members){
      const ms = members.slice().sort();
      return names.map((name, i) => ({id: "t" + (i + 1), name: String(name).trim().slice(0, 80), who: ms.length ? ms[i % ms.length] : ""})).filter(t => t.name);
    }
    function nextWeekly(start, until, now){
      if (!(start > 0)) return null;
      const WK = 7 * DAYMS; let t = start;
      if (t < now - 2 * 3600000) t += Math.ceil((now - 2 * 3600000 - t) / WK) * WK;
      if (until && new Date(t) > new Date(until + "T23:59:59")) return null;
      return t;
    }
    function contrib(tasks, members, minutes){
      return members.map(m => {
        const mine = tasks.filter(t => !t.deleted && t.assignee_id === m.user_id), done = mine.filter(t => t.status === "done");
        const onTime = done.filter(t => !t.due_at || !t.completed_at || String(t.completed_at).slice(0, 10) <= String(t.due_at).slice(0, 10)).length;
        const met = (minutes || []).filter(x => Array.isArray(x.attended) ? x.attended.includes(m.user_id) : false).length;
        return {id: m.user_id, name: m.display_name || "Member", assigned: mine.length, done: done.length, onTime, meetings: met, titles: done.map(t => t.title)};
      });
    }
    return {busyHex, freeAt, bestTimes, split, rubricLines, shareTopics, nextWeekly, contrib, SLOT, SLOTS, ROLE_WORDS};
  })();
  /*GXP-END*/

  S.gpro = S.gpro || {};
  const PAYWALL = () => typeof PLAN !== "undefined" && !!PLAN && PLAN.paywall();
  const meIsPro = () => typeof PLAN === "undefined" || !PLAN || (PLAN.limitsPro ? PLAN.limitsPro() : PLAN.isPro());
  // Is this a Pro group
  const gxOn = g => !!g && (!PAYWALL() || !!(S.gpro[g.id] && S.gpro[g.id].active));
  // How many of your groups you've assigned Pro to
  const GX_MAX = 5, gxMine = () => (S.groups || []).filter(x => S.gpro[x.id] && S.gpro[x.id].by && S.gpro[x.id].by === myId()).length;
  const gxWhy = "This is part of Pro groups. When a member with Pro assigns Pro to the group, everyone in it gets this.";
  api.groupPro = ids => q(cli().rpc("group_pro_status", {p_groups: ids}));
  api.setGroupPro = (gid, on) => q(cli().rpc("group_pro_set", {p_group: gid, p_on: on}));
  api.setBadge = on => q(cli().rpc("set_supporter_badge", {p_on: on}));
  // Members with their badge
  const membersBase = api.members;
  api.members = async ids => {
    try { return await q(cli().from("group_members").select("group_id,user_id,role,display_name,joined_at,badge,color,face").in("group_id", ids).order("joined_at")); } catch(e0) {}
    try { return await q(cli().from("group_members").select("group_id,user_id,role,display_name,joined_at,badge,color").in("group_id", ids).order("joined_at")); }
    catch(e) { try { return await q(cli().from("group_members").select("group_id,user_id,role,display_name,joined_at,badge").in("group_id", ids).order("joined_at")); } catch(e2) { return membersBase(ids); } }
  };
  api.setColor = (gid, c) => q(cli().rpc("set_member_color", {p_group: gid, p_color: c}));
  // Your companion, shared with your groups so they see it as your picture
  api.setFace = f => q(cli().rpc("set_my_face", {p_face: f || null}));
  let faceSent = null;
  function syncMyFace(){
    if (!online() || !myId()) return;
    let cur = ""; try { cur = (window.SBCOMP && SBCOMP.current && SBCOMP.current()) || ""; } catch(e) {}
    if (!/^[a-z0-9-]{1,40}$/.test(cur)) cur = "";
    const mine = Object.values(S.members).flat().filter(m => m && m.user_id === myId());
    if (!mine.length || !mine.some(m => "face" in m) || faceSent === cur || mine.every(m => (m.face || "") === cur)) return;
    faceSent = cur;
    api.setFace(cur).then(() => mine.forEach(m => { m.face = cur || null; })).catch(() => { faceSent = null; });
  }
  hook("render", tab => { if (tab === "groups") setTimeout(syncMyFace, 1200); });
  async function gxLoad(ids){
    ids = (ids || (S.groups || []).map(g => g.id)).filter(Boolean); if (!ids.length || !online()) return;
    const before = JSON.stringify(S.gpro);
    try { const rows = await api.groupPro(ids) || []; rows.forEach(r => { S.gpro[r.group_id] = {active: !!r.active, by: r.by_user || "", byOwner: !!r.by_owner}; }); S.gproErr = ""; }
    catch(e) { S.gproErr = e.setup ? "setup" : e.message; }
    if (ui.tab === "groups" && JSON.stringify(S.gpro) !== before) render();
  }
  const loadGroupsBase = loadGroups;
  loadGroups = async function(quiet){ await loadGroupsBase(quiet); gxLoad(); gxBadgeSync(); };
  const loadGroupBase = loadGroup;
  loadGroup = async function(gid){ await loadGroupBase(gid); gxLoad([gid]); gxAvailRefresh(gid); };
  // The supporter badge follows the setting in Settings > Studyboard Pro
  let badgeDone = false;
  async function gxBadgeSync(force){
    if ((badgeDone && !force) || !online()) return; badgeDone = true;
    const want = !!(state.settings && state.settings.badge) && meIsPro();
    const mine = Object.values(S.members || {}).flat().filter(m => m.user_id === myId());
    if (!force && mine.every(m => !!m.badge === want)) return;
    try { await api.setBadge(want); mine.forEach(m => { m.badge = want; }); if (ui.tab === "groups" && ui.grp) patch(ui.grp); } catch(e) { }
  }
  hook("pro-badge", () => gxBadgeSync(true));
  const GX_STAR = `<svg class="gx-star" viewBox="0 0 24 24" width="14" height="14" role="img" aria-label="Supports Studyboard"><title>Supports Studyboard with Pro</title><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" fill="#FF8A5C"/></svg>`;

  /* Header chip, and the Pro group box in Members */
  const headBase = headHtml;
  // Assign Pro / Unassign Pro (with a PRO badge) goes in the header's More menu (raMore)
  function gxAssignBtn(g){
    if (!PAYWALL() || !meIsPro() || S.gproErr) return "";
    const st = S.gpro[g.id]; if (!st) return "";
    if (st.by && st.by === myId()) return `<button class="btn gx-assign" data-act="gx-pro-off" data-id="${esc(g.id)}">Unassign Pro ${PRO_BADGE}</button>`;
    if (st.active || gxMine() >= GX_MAX) return "";
    return `<button class="btn gx-assign" data-act="gx-pro-sheet" data-id="${esc(g.id)}">Assign Pro ${PRO_BADGE}</button>`;
  }
  headHtml = g => { let h = headBase(g); const b = gxAssignBtn(g); if (b) h = h.replace(/(<button class="btn primary" data-act="grp-invite"[^>]*>[^<]*<\/button>)/, "$1" + b);
    return gxOn(g) && PAYWALL() ? h.replace('<div class="g2-meta">', '<div class="g2-meta"><span class="gx-chip">PRO GROUP</span>') : h; };
  function gxProBox(g){
    if (!PAYWALL()) return "";
    const st = S.gpro[g.id] || {}, by = st.by, me = myId();
    if (S.gproErr === "setup") return isOwner(g) ? `<div class="grp-note">Pro groups need the latest <b>supabase-plans.sql</b>. ${esc(srvSetup("This", "supabase-plans.sql"))}</div>` : "";
    if (gxOn(g)) return `<div class="gx-box on"><span class="pro-badge">PRO GROUP</span><span class="gx-bt">${esc(by === me ? "You assigned Pro to this group." : st.byOwner ? "Pro thanks to the group owner." : by ? `Pro thanks to ${mName(g.id, by)}.` : "A Pro group.")} Everyone here gets the group extras.</span></div>`;
    if (meIsPro()) return gxMine() >= GX_MAX ? `<div class="gx-box"><span class="gx-bt"><b>All 5 Pro Groups Used</b><span class="mini">You've assigned Pro to ${GX_MAX} groups. Unassign one of them to assign Pro here.</span></span></div>`
      : `<div class="gx-box"><span class="gx-bt"><b>Assign Pro to This Group</b><span class="mini">Everyone here gets Split the Work, Team Deadline, Live Quiz and more, and room for up to 100 members. You've used ${gxMine()} of your ${GX_MAX}.</span></span><button type="button" class="btn small gx-assign" data-act="gx-pro-sheet">Assign Pro</button></div>`;
    return `<div class="gx-box"><span class="gx-bt"><span class="mini">A member with Studyboard Pro can make this a Pro group, with extras for everyone in it.</span></span><button type="button" class="btn small" data-act="grp-upgrade" data-r="${esc(gxWhy)}">About Pro</button></div>`;
  }
  function gxProSheet(g){
    const proj = isProj(g);
    const li = (t, s) => `<li><span class="pf-t"><b>${t}</b><span class="mini">${s}</span></span></li>`;
    openSheet(`<div class="sheet pro-sheet">${head("Assign Pro")}<div class="sheet-body">
      <p style="margin:0">Everyone in <b>${esc(g.name)}</b> gets these, even on the free plan, for as long as you're in the group and have Pro.</p>
      <ul class="pro-feats">${proj ? li("Split the Work", "A fair split of tasks by role and free time") + li("Team Deadline", "An earlier date the group works toward") + li("Rubric Checklist and Review Before Done", "Nothing missed at submission") + li("Contribution Report", "A PDF of who did what, for your instructor") + li("Group Uploads", "Up to 2 GB of group files, from your own storage")
        : li("Split Exam Topics", "Each member covers a topic for everyone") + li("Live Quiz", "Quiz each other live in a session")}${li("Weekly Sessions", "Sessions and meetings that repeat")}${li("Up to 100 members, full chat history", "Instead of 5 members and 60 days")}</ul></div>
      <div class="sheet-foot"><span class="mini">Uses 1 of your ${GX_MAX} Pro groups (${GX_MAX - gxMine()} left). Unassign any time.</span><span class="spacer"></span><button type="button" class="btn gx-assign" data-act="gx-pro-on" data-id="${esc(g.id)}">Assign Pro</button></div></div>`);
  }
  async function gxSetPro(g, on){
    try { await api.setGroupPro(g.id, on); toast(on ? `Pro assigned to ${g.name}` : `Pro unassigned from ${g.name}`); if (dlg.open) dlg.close(); await gxLoad([g.id]); }
    catch(e) { toast(String(e.message || "").replace(/^SB_[A-Z_]+:\s*/, "")); }
  }

  /* Team Deadline (group projects) */
  const teamDue = g => g && GTL.isDay(g.team_due) && gxOn(g) ? String(g.team_due).slice(0, 10) : "";
  function gxTeamCard(g){
    const td = teamDue(g), owner = isOwner(g), today = todayISO();
    if (!td && !owner) return "";
    const left = td ? dayDiff(today, td) : 0, real = GTL.isDay(g.project_due) ? String(g.project_due).slice(0, 10) : "";
    return `<div class="gx-card" id="gxTeam"><div class="gx-ct"><span class="gk-eyebrow">Team deadline</span>${td ? `<b class="gx-big">${left > 1 ? left + " days left" : left === 1 ? "Tomorrow" : left === 0 ? "Today" : "Passed"}</b><span class="mini">${esc(parse(td).toLocaleDateString(undefined, {weekday: "long", month: "long", day: "numeric"}))}${real && real > td ? ` · ${dayDiff(td, real)} day${dayDiff(td, real) === 1 ? "" : "s"} before the real one` : ""}. Everyone's planner aims for it.</span>` : `<span class="mini">Pick a date a few days before the real deadline. Everyone's Today's Plan works toward it, so there's time to check everything.</span>`}</div>${owner ? `<button type="button" class="btn small" data-act="gx-team-set">${td ? "Change" : "Set Team Deadline"}</button>` : ""}</div>`;
  }
  function gxTeamSheet(g){
    const real = GTL.isDay(g.project_due) ? String(g.project_due).slice(0, 10) : "", sug = real ? addDays(real, -3) : addDays(todayISO(), 14);
    openSheet(`<form class="sheet">${head("Team Deadline")}<div class="sheet-body">
      <p style="margin:0">Tasks due later show this date in everyone's planner, so the group finishes early with time to check.</p>
      <label class="f"><span class="lh">Team Deadline</span><input type="date" name="td" value="${esc(teamDue(g) || sug)}" min="${todayISO()}"${real ? ` max="${real}"` : ""}></label>
      ${real ? `<p class="mini" style="margin:0">The real deadline is ${esc(fmtShort(real))}.</p>` : ""}</div>
      <div class="sheet-foot">${teamDue(g) ? `<button type="button" class="btn" data-act="gx-team-clear">Remove</button>` : ""}<span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>Save</button></div></form>`, fd => {
      const d = String(fd.get("td") || ""); if (!GTL.isDay(d)) return false;
      gxSetTeam(g, d); return true;
    });
  }
  async function gxSetTeam(g, d){
    try { await api.updateGroup(g.id, {team_due: d || null}); g.team_due = d || null; toast(d ? `Team deadline set for ${fmtShort(d)}` : "Team deadline removed"); deriveMineFor(g.id); patch(g.id); }
    catch(e) { toast(/team_due|column/i.test(e.message) ? srvSetup("Team deadlines", "groups.sql") : e.message); }
  }
  function gxTeamMine(gid){
    const g = groupOf(gid), td = teamDue(g); if (!td || !S.mine[gid]) return;
    let ch = false;
    S.mine[gid] = S.mine[gid].map(r => { if (r.status !== "done" && (!r.due || r.due > td)) { ch = true; return Object.assign({}, r, {due: td, teamDue: true}); } return r; });
    if (ch) { persistMine(); decorateBoard(); boardRefresh(); }
  }
  const deriveMineForBase = deriveMineFor;
  deriveMineFor = gid => { deriveMineForBase(gid); gxTeamMine(gid); };
  const loadMineBase = loadMine;
  loadMine = async function(){ const r = await loadMineBase.apply(this, arguments); Object.keys(S.mine || {}).forEach(gxTeamMine); return r; };

  /* Review Before Done (group projects) */
  const reviewerOf = t => t && t.reviewer_id ? t.reviewer_id : "";
  function gxReviewBtns(g, t){
    if (t.status !== "review") return "";
    const me = myId(), canApprove = reviewerOf(t) === me || isOwner(g);
    return `<span class="pt-prio review">${esc(reviewerOf(t) ? `In review: ${reviewerOf(t) === me ? "you" : mName(g.id, reviewerOf(t))}` : "In review")}</span>${canApprove ? `<button type="button" class="btn small primary" data-act="gx-rv-ok" data-id="${esc(t.id)}">Approve</button><button type="button" class="btn small" data-act="gx-rv-back" data-id="${esc(t.id)}">Send Back</button>` : ""}`;
  }
  function gxReviewerField(g, t){
    if (!gxOn(g)) return "";
    const me = myId(), ms = (S.members[g.id] || []).filter(m => m.user_id === me || !S.blocked.has(m.user_id)), cur = reviewerOf(t);
    return `<label class="f"><span class="lh">Reviewer <span class="hint">checks it before it's done</span></span><select name="reviewer"><option value="">No review</option>${ms.map(m => `<option value="${esc(m.user_id)}"${m.user_id === cur ? " selected" : ""}>${esc(m.user_id === me ? "Me" : m.display_name || "Member")}</option>`).join("")}</select></label>`;
  }

  /* Find a Time */
  const availOf = (gid, uid2) => { const it = kindItems(gid, "avail").find(x => x.user_id === uid2); return it && it.data ? {from: Number(it.data.from), hex: String(it.data.hex || ""), at: it.updated_at} : null; };
  const shareKey = gid => "sb:availShare:" + myId() + ":" + gid;
  // How you share
  const shareMode = gid => { try { const v = localStorage.getItem(shareKey(gid)); return v === "1" || v === "auto" ? "auto" : v === "manual" ? "manual" : ""; } catch(e) { return ""; } };
  const sharing = gid => shareMode(gid) === "auto";
  // My busy half-hours for 14 days
  function myBusy(){
    const start = parse(todayISO()).getTime(), from = todayISO(), to = addDays(from, 13), busy = [];
    try { schOccurrences(from, to).forEach(o => { if (o.skipped || o.allDay || !o.start || !o.end) return; const a = new Date(`${o.date}T${o.start}`).getTime(), b = new Date(`${o.date}T${o.end}`).getTime(); if (b > a) busy.push([a, b]); }); } catch(e) {}
    const end = parse(addDays(from, 14)).getTime();
    Object.keys(S.ext).forEach(gid => { const x = extOf(gid); if (!x) return; x.rsvps.forEach(r => { const it = r.user_id === myId() && r.status === "yes" ? itemOf(r.item_id) : null; if (it && it.kind === "event" && !calCopy(it.id)) sessTimes(it, start, end).forEach(b => busy.push(b)); }); });
    for (let i = 0; i < 14; i++) { const d0 = start + i * 864e5, day = new Date(d0); const at = (h, m) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m).getTime(); busy.push([d0, at(7, 0)]); busy.push([at(23, 0), d0 + 864e5]); }
    return {from: start, hex: GXP.busyHex(start, busy)};
  }
  async function gxShareAvail(gid, quiet, picked){
    const g = groupOf(gid); if (!g || !gxOn(g)) return;
    const mine = picked || myBusy(), it = myItem(gid, "avail"), data = {v: 1, from: mine.from, hex: mine.hex};
    try {
      if (it) { const row = await api.updateItem(it.id, {title: "free", data}); Object.assign(it, row || {data}); }
      else { const rows = await api.addItems([{group_id: gid, kind: "avail", ref_id: "", title: "free", data}]); addRows(gid, rows); }
      try { localStorage.setItem(shareKey(gid), picked ? "manual" : "auto"); } catch(e) {}
      if (!quiet) toast("Your free times are shared with the group");
    } catch(e) { if (!quiet) toast(/kind_check|avail/i.test(e.message) ? srvSetup("Find a Time", "groups.sql") : e.message); }
  }
  // Kept fresh: once you've chosen to share
  function gxAvailRefresh(gid){
    const g = groupOf(gid); if (!g || !gxOn(g) || !isProj(g) || !sharing(gid)) return;
    const a = availOf(gid, myId()); if (a && Date.now() - ts(a.at) < 12 * 3600000 && a.from === parse(todayISO()).getTime()) return;
    gxShareAvail(gid, true);
  }
  let FT = {mins: 60};
  const ftDay = t => { const d = new Date(t); return `<span class="ft-d"><b>${esc(d.toLocaleDateString(undefined, {weekday: "short"}))}</b><small>${esc(d.toLocaleDateString(undefined, {month: "short", day: "numeric"}))}</small></span>`; };
  function gxFindTime(g){
    const ms = (S.members[g.id] || []).filter(m => m.user_id === myId() || !S.blocked.has(m.user_id));
    const avs = ms.map(m => availOf(g.id, m.user_id)).filter(Boolean), have = ms.filter(m => availOf(g.id, m.user_id)).length, iShare = !!availOf(g.id, myId());
    const today = parse(todayISO()).getTime(), days = Array.from({length: 7}, (_, i) => ({start: new Date(new Date(today).setDate(new Date(today).getDate() + i)).getTime()}));
    const enough = have >= 2;
    const best = enough ? GXP.bestTimes(avs, days, FT.mins, Date.now(), 3) : [];
    const hours = Array.from({length: 14}, (_, i) => 8 + i);
    const cell = (d, h) => { const a = d.start + h * 3600000; let f = 0; avs.forEach(av => { if (GXP.freeAt(av, a, a + 3600000)) f++; }); return f; };
    const grid = avs.length ? `<div class="ft-grid" role="img" aria-label="How many people are free, by day and time"><span></span>${days.map(d => ftDay(d.start)).join("")}${hours.map(h => `<span class="ft-h">${esc(new Date(2001, 0, 1, h).toLocaleTimeString(undefined, {hour: "numeric"}))}</span>${days.map(d => { const f = cell(d, h); return `<span class="ft-c" style="--a:${Math.round(f / Math.max(1, avs.length) * 100)}%" title="${f} of ${avs.length} free"></span>`; }).join("")}`).join("")}</div>` : "";
    openSheet(`<div class="sheet pro-sheet">${head("Find a Time")}<div class="sheet-body">
      ${iShare ? `<div class="pr-row"><span class="mini" style="flex:1">${shareMode(g.id) === "auto" ? "Your free times come from your planner." : "You picked your free times."}</span><button type="button" class="btn small" data-act="gx-ft-mine" data-id="${esc(g.id)}">Edit My Free Times</button></div>` : `<div class="gx-box"><span class="gx-bt"><b>Share your free times</b><span class="mini">Tap the hours you're free this week. Only free or busy is shared, never what's in your plan.</span></span><button type="button" class="btn small primary" data-act="gx-ft-mine" data-id="${esc(g.id)}">Pick My Free Times</button></div>`}
      <div class="pr-row"><span class="pr-lbl">How long</span><div class="segb" role="group" aria-label="How long">${[[30, "30 min"], [60, "1 hour"], [120, "2 hours"]].map(([m, l]) => `<button type="button" data-act="gx-ft-len" data-id="${m}" aria-pressed="${FT.mins === m}">${l}</button>`).join("")}</div></div>
      <p class="mini" style="margin:0">${have} of ${ms.length} members shared their free times.${have < ms.length ? " The rest show up once they open Find a Time and share." : ""}${enough ? "" : ` You can add a ${isProj(g) ? "meeting" : "study session"} once at least 2 members have shared.`}</p>
      ${grid}
      ${best.length ? `<h3 class="fsec">Best Times</h3><div class="ft-best" role="radiogroup" aria-label="Best times">${best.map((b, i) => `<button type="button" role="radio" aria-checked="${(FT.pick || 0) === i}" class="pr-kind${(FT.pick || 0) === i ? " on" : ""}" data-act="gx-ft-pick" data-id="${i}"><b>${esc(new Date(b.start).toLocaleString(undefined, {weekday: "short", hour: "numeric", minute: "2-digit"}))}</b><span>${b.free === b.total ? `All ${b.total} free` : `${b.free} of ${b.total} free`}</span></button>`).join("")}</div>` : avs.length ? `<p class="grp-none">No time in the next week works for everyone who shared.</p>` : ""}</div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Close</button>${best.length ? `<button type="button" class="btn primary" data-act="gx-ft-add" data-id="${esc(g.id)}">${isProj(g) ? "Add to Meetings" : "Add to Sessions"}</button>` : ""}</div></div>`);
    FT.best = best; FT.gid = g.id;
  }
  // Pick your own free hours (the default way to share)
  let PF = null;
  function gxPickFree(g){
    const today = parse(todayISO()).getTime(), days = Array.from({length: 7}, (_, i) => new Date(new Date(today).setDate(new Date(today).getDate() + i)).getTime());
    const hours = Array.from({length: 14}, (_, i) => 8 + i);
    const fromPlan = () => { const mine = myBusy(), on = new Set(); days.forEach((d, di) => hours.forEach(h => { const a = d + h * 3600000; if (a >= Date.now() - 3600000 && GXP.freeAt(mine, a, a + 3600000)) on.add(di + ":" + h); })); return on; };
    let filled = false;
    if (!PF || PF.gid !== g.id) {
      const mine = availOf(g.id, myId()), on = new Set();
      if (mine) days.forEach((d, di) => hours.forEach(h => { const a = d + h * 3600000; if (GXP.freeAt(mine, a, a + 3600000)) on.add(di + ":" + h); }));
      PF = {gid: g.id, on: mine ? on : fromPlan()}; filled = !mine;
    }
    const draw = () => {
      const grid = $("#pfGrid"); if (!grid) return;
      grid.querySelectorAll("[data-pf]").forEach(b => { const v = PF.on.has(b.dataset.pf); b.setAttribute("aria-pressed", String(v)); });
      const n = $("#pfN"); if (n) n.textContent = PF.on.size === 1 ? "1 hour picked" : `${PF.on.size} hours picked`;
    };
    openSheet(`<div class="sheet pro-sheet">${head("Your Free Times")}<div class="sheet-body">
      <p style="margin:0">${filled ? "We filled in your free hours from your planner. " : ""}Tap or drag across hours to change them. Only free or busy is shared with the group, never what's in your plan.</p>
      <div class="pr-row"><span class="mini" id="pfN" style="flex:1"></span><button type="button" class="btn small" id="pfAuto">Fill In Automatically</button><button type="button" class="btn small" id="pfClear">Clear</button></div>
      <div class="ft-grid pf-grid" id="pfGrid" role="group" aria-label="Your free hours"><span></span>${days.map(ftDay).join("")}${hours.map(h => `<span class="ft-h">${esc(new Date(2001, 0, 1, h).toLocaleTimeString(undefined, {hour: "numeric"}))}</span>${days.map((d, di) => { const past = d + (h + 1) * 3600000 <= Date.now(); return `<button type="button" class="pf-c" data-pf="${di}:${h}" aria-pressed="false" aria-label="${esc(new Date(d + h * 3600000).toLocaleString(undefined, {weekday: "long", hour: "numeric"}))}"${past ? " disabled" : ""}></button>`; }).join("")}`).join("")}</div>
      <p class="mini" style="margin:0">Fill In Automatically uses your classes, events and work blocks. ${shareMode(g.id) === "auto" ? "Right now your free times come from your planner automatically." : ""}</p>
    </div><div class="sheet-foot"><button type="button" class="btn" id="pfKeepAuto">Share Automatically Instead</button><span class="spacer"></span><button type="button" class="btn" id="pfBack">Back</button><button type="button" class="btn primary" id="pfSave">Share</button></div></div>`);
    draw();
    const grid = $("#pfGrid"), cellAt = e => { const u = document.elementFromPoint(e.clientX, e.clientY), b = u && u.closest && u.closest("#pfGrid [data-pf]"); return b && !b.disabled ? b : null; };
    let paint = null;
    const put = b => { const k = b.dataset.pf; if (paint.on) PF.on.add(k); else PF.on.delete(k); b.setAttribute("aria-pressed", String(paint.on)); };
    grid.addEventListener("pointerdown", e => { const b = cellAt(e); if (!b || (e.pointerType === "mouse" && e.button !== 0)) return; e.preventDefault(); paint = {on: !PF.on.has(b.dataset.pf), id: e.pointerId}; put(b); try { grid.setPointerCapture(e.pointerId); } catch (err) {} });
    grid.addEventListener("pointermove", e => { if (!paint || e.pointerId !== paint.id) return; const b = cellAt(e); if (b) put(b); });
    const stop = () => { if (paint) { paint = null; draw(); } };
    grid.addEventListener("pointerup", stop); grid.addEventListener("pointercancel", stop); grid.addEventListener("lostpointercapture", stop);
    grid.addEventListener("click", e => { if (e.detail) return; const b = e.target.closest("[data-pf]"); if (!b || b.disabled) return; const k = b.dataset.pf; PF.on.has(k) ? PF.on.delete(k) : PF.on.add(k); draw(); });
    $("#pfClear").addEventListener("click", () => { PF.on.clear(); draw(); });
    $("#pfAuto").addEventListener("click", () => { PF.on = fromPlan(); draw(); toast("Filled in from your planner. Change anything, then Share."); });
    $("#pfBack").addEventListener("click", () => gxFindTime(g));
    $("#pfKeepAuto").addEventListener("click", () => { PF = null; gxShareAvail(g.id).then(() => gxFindTime(g)); });
    $("#pfSave").addEventListener("click", () => {
      if (!PF.on.size) { toast("Tap at least one hour you're free."); return; }
      const busy = [], start = today, end = today + 14 * 864e5;
      for (let t = start; t < end; t += 3600000) { const di = Math.round((new Date(t).setHours(0, 0, 0, 0) - today) / 864e5), h = new Date(t).getHours(); if (!(di < 7 && PF.on.has(di + ":" + h))) busy.push([t, t + 3600000]); }
      gxShareAvail(g.id, false, {from: start, hex: GXP.busyHex(start, busy)}).then(() => { PF = null; gxFindTime(g); });
    });
  }
  async function gxFtAdd(g){
    const b = FT.best && FT.best[FT.pick || 0]; if (!b) return;
    if ((S.members[g.id] || []).filter(m => availOf(g.id, m.user_id)).length < 2) { toast("At least 2 members need to share their free times first."); return; }
    ensureName(async () => {
      try {
        const rows = await api.addItems([{group_id: g.id, kind: "event", ref_id: "", title: isProj(g) ? "Team meeting" : "Study session", data: {v: 1, type: "event", start: new Date(b.start).toISOString(), mins: FT.mins, where: "", notes: "Picked with Find a Time"}}]);
        addRows(g.id, rows); if (dlg.open) dlg.close(); const when = new Date(b.start).toLocaleString(undefined, {weekday: "short", hour: "numeric", minute: "2-digit"}), where2 = isProj(g) ? "Meetings" : "Sessions";
        if (!(rows && rows[0] && calAdd(g, rows[0], `Added ${when} to ${where2}. It's on your calendar too.`))) toast(`Added ${when} to ${where2}`);
        api.rsvp(rows && rows[0] ? rows[0].id : "", "yes").then(() => loadExtras(g.id)).catch(() => {});
        patch(g.id);
      } catch(e) { toast(e.message); }
    });
  }

  /* Split the Work */
  let SP2 = null;
  function gxSplitSheet(g){
    const x = ptX(g.id); if (!x) { toast("Tasks aren't ready yet. Try again in a moment."); return; }
    const me = myId(), ms = (S.members[g.id] || []).filter(m => m.user_id === me || !S.blocked.has(m.user_id));
    const act = new Set(x.lists.filter(l => !l.archived).map(l => l.id)), open = x.tasks.filter(t => act.has(t.list_id) && !t.deleted && t.status !== "done" && !t.assignee_id && !t._tmp);
    if (!open.length) { toast("Every open task already has someone on it."); return; }
    const roles = {}; ms.forEach(m => { const r = roleOf(g.id, m.user_id); if (r && r !== "custom") roles[m.user_id] = r; });
    const room = {}; ms.forEach(m => { const av = availOf(g.id, m.user_id); if (!av) return; let free = 0; for (let i = 0; i < GXP.SLOTS; i++) { const t = av.from + i * GXP.SLOT, h = new Date(t).getHours(); if (h >= 8 && h < 22 && GXP.freeAt(av, t, t + GXP.SLOT)) free++; } room[m.user_id] = free / 20; });
    const seed = SP2 && SP2.gid === g.id ? SP2.seed + 1 : 1; let s0 = seed * 9301; const rnd = () => { s0 = (s0 * 9301 + 49297) % 233280; return s0 / 233280; };
    const plan = GXP.split(open.map(t => ({id: t.id, title: t.title, due: t.due_at ? String(t.due_at).slice(0, 10) : ""})), ms.map(m => m.user_id), roles, Object.keys(room).length ? room : null, rnd);
    SP2 = {gid: g.id, seed, plan};
    const tt = id => open.find(t => t.id === id);
    openSheet(`<div class="sheet pro-sheet">${head("Split the Work")}<div class="sheet-body">
      <p style="margin:0">${open.length} unassigned task${open.length === 1 ? "" : "s"}, matched to each person's role${Object.keys(room).length ? " and how much free time they shared" : ""}, soonest due first.</p>
      ${ms.map(m => `<div class="gx-split"><div class="gx-sh">${av(m.display_name, m.user_id)}<b>${esc(m.user_id === me ? "You" : m.display_name || "Member")}</b>${roles[m.user_id] ? `<span class="pill">${esc(GK.roleLabel(roles[m.user_id]))}</span>` : ""}<span class="mini">${(plan[m.user_id] || []).length} task${(plan[m.user_id] || []).length === 1 ? "" : "s"}</span></div>${(plan[m.user_id] || []).map(id => `<div class="gx-st">${esc(tt(id).title)}${tt(id).due_at ? ` <span class="mini">${esc(fmtShort(String(tt(id).due_at).slice(0, 10)))}</span>` : ""}</div>`).join("")}</div>`).join("")}</div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="gx-split-again">Try Another Split</button><span class="spacer"></span><button type="button" class="btn primary" data-act="gx-split-go">Assign</button></div></div>`);
  }
  async function gxSplitGo(){
    const g = SP2 && groupOf(SP2.gid); if (!g) return;
    if (dlg.open) dlg.close();
    const all = Object.entries(SP2.plan).flatMap(([who, ids]) => ids.map(id => [id, who]));
    for (const [id, who] of all) await ptMutate(g.id, id, {assignee_id: who});
    toast(`Assigned ${all.length} task${all.length === 1 ? "" : "s"}`);
    try { await api.post(g.id, `I split up the ${all.length} unassigned task${all.length === 1 ? "" : "s"} with Split the Work. Check Tasks for yours.`); } catch(e) {}
  }

  /* Rubric Checklist */
  let RB = null;
  function gxRubricSheet(g){
    RB = {gid: g.id, lines: []};
    openSheet(`<div class="sheet pro-sheet">${head("Rubric Checklist")}<div class="sheet-body gx-rb">
      <p style="margin:0">Paste the rubric or assignment instructions, or pick the PDF. Each requirement becomes a task, so nothing is missed at submission.</p>
      <label class="f"><span class="lh">Rubric or instructions</span><textarea data-rb-text rows="6" placeholder="- Introduction states the problem (10 points)&#10;- At least 5 peer-reviewed sources&#10;- Slides are 10 minutes or less"></textarea></label>
      <label class="btn" style="position:relative;overflow:hidden;justify-self:start">Pick a PDF<input type="file" accept="application/pdf,.pdf" data-rb-pdf style="position:absolute;inset:0;opacity:0;cursor:pointer"></label>
      <div data-rb-list></div></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-act="gx-rb-go" id="gxRbGo" disabled>Add Tasks</button></div></div>`);
    const ta = dlg.querySelector("[data-rb-text]"), pdf = dlg.querySelector("[data-rb-pdf]");
    const draw = () => {
      RB.lines = GXP.rubricLines(ta.value);
      const box = dlg.querySelector("[data-rb-list]"), go = $("#gxRbGo"); if (!box) return;
      box.innerHTML = RB.lines.length ? `<h3 class="fsec">${RB.lines.length} Requirement${RB.lines.length === 1 ? "" : "s"}</h3><ul class="pro-feats">${RB.lines.map((l, i) => `<li><label class="cf-row"><input type="checkbox" data-rb-i="${i}" checked><span>${esc(l)}</span></label></li>`).join("")}</ul>` : ta.value.trim() ? `<p class="mini">No requirements found yet. Put each one on its own line, starting with a dash or a number.</p>` : "";
      if (go) { go.disabled = !RB.lines.length; go.textContent = RB.lines.length ? `Add ${RB.lines.length} Task${RB.lines.length === 1 ? "" : "s"}` : "Add Tasks"; }
    };
    ta.addEventListener("input", draw);
    pdf.addEventListener("change", async () => { const f = pdf.files && pdf.files[0]; if (!f) return; try { const out = await pdfText(new Uint8Array(await f.arrayBuffer())); ta.value = (Array.isArray(out) ? out.join("\n") : String(out || "")).slice(0, 40000); draw(); } catch(e) { toast("Couldn't read that PDF."); } });
  }
  async function gxRubricGo(){
    const g = RB && groupOf(RB.gid); if (!g) return;
    const keep = RB.lines.filter((l, i) => { const c = dlg.querySelector(`[data-rb-i="${i}"]`); return !c || c.checked; });
    if (!keep.length) return;
    const go = $("#gxRbGo"); if (go) busyBtn(go, true);
    try {
      const list = await api.ptNewList(g.id, "Rubric", g.course || ""); const x = ptX(g.id); if (x && list && !x.lists.some(l => l.id === list.id)) x.lists.push(list);
      const due = teamDue(g) || (GTL.isDay(g.project_due) ? String(g.project_due).slice(0, 10) : "");
      for (const l of keep) await ptAddTask(g.id, list.id, "Check: " + l, "", due);
      if (dlg.open) dlg.close(); toast(`Added ${keep.length} checklist task${keep.length === 1 ? "" : "s"}`);
    } catch(e) { if (go) busyBtn(go, false); toast(e.message); }
  }

  /* Group Templates (kept in your own settings, so they follow you) */
  const tpls = () => (state.settings && Array.isArray(state.settings.grpTemplates) ? state.settings.grpTemplates : []).slice(0, 12);
  // A template keeps the group's setup
  function gxSaveTemplate(g){
    const proj = isProj(g), x = proj ? ptX(g.id) : null;
    let tasks = [];
    if (x) {
      const act = new Set(x.lists.filter(l => !l.archived).map(l => l.id)), due = GTL.isDay(g.project_due) ? String(g.project_due).slice(0, 10) : "";
      tasks = x.tasks.filter(t => act.has(t.list_id) && !t.deleted).sort((a, b) => (a.position || 0) - (b.position || 0)).slice(0, 80).map(t => ({title: str(t.title, 200), off: due && t.due_at ? dayDiff(String(t.due_at).slice(0, 10), due) : null}));
    }
    const t = {id: uid(), name: str(g.name, 60), kind: proj ? "project" : "study", course: str(g.course || "", 80), icon: iconKey(g) || "", hidden: [...hiddenOf(g)].slice(0, 20),
      goal: proj ? 0 : Math.max(0, Number(g.weekly_goal) || 0), tasks, at: Date.now()};
    state.settings = Object.assign({}, state.settings, {grpTemplates: [t].concat(tpls().filter(x2 => x2.name !== t.name)).slice(0, 12)}); saveSettings();
    toast(`Saved ${t.name} as a template${tasks.length ? ` (${tasks.length} tasks)` : ""}. It's in New Group under Start From.`);
  }
  function gxTemplateSheet(g){
    const list = tpls().filter(t => (t.tasks || []).length);
    openSheet(`<div class="sheet pro-sheet">${head("Start From a Template")}<div class="sheet-body">
      ${list.length ? `<ul class="pro-feats">${list.map(t => `<li><span class="pf-t"><b>${esc(t.name)}</b><span class="mini">${t.tasks.length} tasks · saved ${esc(new Date(t.at).toLocaleDateString(undefined, {month: "short", day: "numeric", year: "numeric"}))}</span></span><button type="button" class="btn small primary" data-act="gx-tpl-use" data-id="${esc(t.id)}">Use</button><button type="button" class="x-btn" data-act="gx-tpl-del" data-id="${esc(t.id)}" aria-label="Delete the ${esc(t.name)} template">${CLOSE}</button></li>`).join("")}</ul><p class="mini" style="margin:0">Due dates are set the same number of days before this project's due date.</p>`
        : `<p style="margin:0">No templates yet. In a project you liked, open Overview and choose Save as Template. Its tasks and their timing are kept in your account for next time.</p>`}</div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Close</button></div></div>`);
  }
  // A new project made from a template
  function tplTasksWhenReady(gid, id){
    let n = 0;
    const tick = () => { const g = groupOf(gid); if (g && ptX(gid)) { gxUseTemplate(g, id); return; } if (n === 0 && g) { try { loadPT(gid); } catch(e) {} } if (++n < 40) setTimeout(tick, 500); };
    tick();
  }
  async function gxUseTemplate(g, id){
    const t = tpls().find(x => x.id === id); if (!t) return;
    if (dlg.open) dlg.close();
    const due = teamDue(g) || (GTL.isDay(g.project_due) ? String(g.project_due).slice(0, 10) : "");
    try {
      const list = await ptDefaultList(g); if (!list) throw new Error("Couldn't start the task list. Try again.");
      for (const k of t.tasks) await ptAddTask(g.id, list.id, k.title, "", due && k.off != null ? addDays(due, -Math.max(0, k.off)) : "");
      toast(`Added ${t.tasks.length} tasks from ${t.name}`);
    } catch(e) { toast(e.message); }
  }

  /* Contribution Report (printed or saved as PDF through Studyboard's print page) */
  function gxReport(g){
    const x = ptX(g.id); if (!x) { toast("Tasks aren't ready yet. Try again in a moment."); return; }
    const act = new Set(x.lists.filter(l => !l.archived).map(l => l.id)), tasks = x.tasks.filter(t => act.has(t.list_id));
    const ms = S.members[g.id] || [], mins = kindItems(g.id, "minutes").map(it => it.data || {});
    const rows = GXP.contrib(tasks, ms, mins), real = GTL.isDay(g.project_due) ? String(g.project_due).slice(0, 10) : "";
    const meetings = kindItems(g.id, "minutes").length;
    const html = `<div class="pp-page"><div class="pp-head"><div><h1>Contribution Report</h1><p>${esc(g.name)}${g.course ? " · " + esc(g.course) : ""}</p></div><div class="pp-box">${real ? `Due ${esc(fmtShort(real))}<br>` : ""}${tasks.filter(t => !t.deleted).length} tasks · ${meetings} meeting note${meetings === 1 ? "" : "s"}</div></div>
      <section class="pp-gc"><table><thead><tr><th>Member</th><th>Role</th><th>Tasks done</th><th>On time</th>${meetings ? "<th>Meetings</th>" : ""}</tr></thead><tbody>${rows.map(r => `<tr><td><b>${esc(r.name)}</b></td><td>${esc(roleName(g.id, r.id) || "")}</td><td>${r.done} of ${r.assigned}</td><td>${r.onTime}</td>${meetings ? `<td>${r.meetings}</td>` : ""}</tr>`).join("")}</tbody></table></section>
      <h2>What each person finished</h2><div class="pp-plan">${rows.map(r => `<div class="pp-pd"><b>${esc(r.name)}</b><span>${esc(r.titles.slice(0, 14).join(" · ") || "Nothing marked done yet")}</span></div>`).join("")}</div>
      <div class="pp-foot"><span>Made by Studyboard from the group's own tasks and meeting notes. Every member can see this report.</span><span>${esc(new Date().toLocaleDateString(undefined, {month: "long", day: "numeric", year: "numeric"}))}</span></div></div>`;
    if (!(window.SBPRO && SBPRO.printRaw)) { toast("Printing isn't available here."); return; }
    const name = `Contribution Report - ${g.name}`.slice(0, 80);
    openSheet(`<div class="sheet pro-sheet gx-rep-sheet">${head("Contribution Report")}<div class="sheet-body">
      <p class="mini" style="margin:0">A preview of the report. Every member can see it.</p>
      <div class="pr-prev" aria-label="Preview"><div class="pr-scale letter">${html}</div></div></div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="close">Close</button><span class="spacer"></span><button type="button" class="btn" id="gxRepSave">Download PDF</button><button type="button" class="btn primary" id="gxRepPrint">Print</button></div></div>`);
    $("#gxRepSave").addEventListener("click", () => SBPRO.printRaw(html, null, false, {mode: "save", name}));
    $("#gxRepPrint").addEventListener("click", () => SBPRO.printRaw(html, null, false, {mode: "print", name}));
  }

  /* Group Uploads (group projects) */
  const MAXUP = 50 * 1048576;
  function gxUploadsHtml(g){
    const its = kindItems(g.id, "gfile"), me = myId();
    const size = n => n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
    return `<section class="grp-sec" id="gxUploads">${secHead(gi('<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>'), "Group Uploads", its.length || null, `<label class="btn small" style="position:relative;overflow:hidden">Upload<input type="file" data-gx-up="${esc(g.id)}" style="position:absolute;inset:0;opacity:0;cursor:pointer"></label>`)}
      ${its.length ? `<ul class="grp-list">${its.map(it => `<li class="grp-item"><div class="grp-item-main"><b>${esc(it.title)}</b><span class="mini">${esc(size(Number((it.data || {}).size) || 0))} · ${it.user_id === me ? "Added by you" : "Added by " + esc(it.author_name || "a member")}</span></div><div class="grp-item-btns"><button class="btn small" data-act="gx-up-open" data-id="${esc(it.id)}">Open</button>${it.user_id === me ? `<button class="x-btn" data-act="gx-up-del" data-id="${esc(it.id)}" aria-label="Remove ${esc(str(it.title, 60))}">${CLOSE}</button>` : ""}</div></li>`).join("")}</ul>`
        : `<p class="grp-none">Files everyone in the group can open: drafts, data, images. Up to 2 GB for the group, counted in the uploader's own storage.</p>`}</section>`;
  }
  async function gxUpload(g, file){
    if (!file) return;
    if (file.size > MAXUP) { toast("Files up to 50 MB can be uploaded to a group."); return; }
    const c = cli(); if (!c || !c.storage) { toast("Uploading needs you to be signed in and online."); return; }
    const safe = (file.name || "file").replace(/[^\w.\-]+/g, "_").slice(-80), path = `${myId()}/g/${g.id}/${uid()}-${safe}`;
    toast(`Uploading ${file.name}…`);
    try {
      const {error} = await c.storage.from(SB_BUCKET).upload(path, file, {contentType: file.type || "application/octet-stream", upsert: false});
      if (error) throw error;
      const rows = await api.addItems([{group_id: g.id, kind: "gfile", ref_id: path, title: str(file.name, 200) || "File", data: {v: 1, path, size: file.size, type: file.type || ""}}]);
      addRows(g.id, rows); patch(g.id); toast(`Uploaded ${file.name}`);
    } catch(e) { const m = String(e && e.message || e); toast(/SB_GROUP_STORAGE/.test(m) ? "This group's uploads are full (2 GB). Remove some files first." : /SB_GROUP_PRO/.test(m) ? "Uploading to a group is part of Pro groups." : /SB_STORAGE_LIMIT/.test(m) ? "Your file storage is full." : /kind_check/.test(m) ? srvSetup("Group uploads", "groups.sql") : "Couldn't upload that file. Try again."); }
  }
  async function gxOpenUpload(it){
    const c = cli(), p = it && it.data && it.data.path; if (!c || !c.storage || !p) return;
    try { const data = await sbDownload(p, c); saveBlob(it.title || "file", data, data.type || "application/octet-stream"); }
    catch(e) { toast("Couldn't open that file. Check your connection and try again."); }
  }

  /* Split Exam Topics (study groups) */
  function gxTopicsHtml(g){
    const its = kindItems(g.id, "topics").filter(it => it.data && Array.isArray(it.data.topics) && (!it.data.date || it.data.date >= addDays(todayISO(), -2))).slice(0, 3), me = myId();
    const done = (it, tid, who) => kindItems(g.id, "topic").some(x => x.ref_id === it.id && x.title === tid && x.user_id === who && x.data && x.data.done);
    const body = its.map(it => {
      const mine = it.data.topics.filter(t => t.who === me);
      return `<div class="gx-topics">${mine.length ? `<div class="gx-mine"><span class="mini">Your topic for ${esc(it.title)}${it.data.date ? " · " + esc(fmtShort(it.data.date)) : ""}</span><b>${esc(mine.map(t => t.name).join(", "))}</b><span class="mini">Share a note, a deck or a quiz with the group before the exam, then mark it shared.</span><div class="row-actions">${mine.map(t => `<button type="button" class="btn small${done(it, t.id, me) ? "" : " primary"}" data-act="gx-tp-done" data-id="${esc(it.id)}" data-t="${esc(t.id)}">${done(it, t.id, me) ? "Shared ✓" : mine.length > 1 ? "Mark " + esc(str(t.name, 30)) + " Shared" : "Mark as Shared"}</button>`).join("")}</div></div>` : ""}
        <ul class="gx-tlist" aria-label="Who covers what for ${esc(it.title)}">${it.data.topics.map(t => `<li>${t.who ? av(mName(g.id, t.who), t.who) : ""}<span class="gx-tn"><b>${esc(t.name)}</b><span class="mini">${esc(t.who === me ? "You" : t.who ? mName(g.id, t.who) : "Nobody yet")}</span></span><span class="pill${done(it, t.id, t.who) ? " gx-ok" : ""}">${done(it, t.id, t.who) ? "Shared" : "Not yet"}</span></li>`).join("")}</ul>
        ${canRemove(g, it) ? `<div class="row-actions">${rmBtn(it, it.title + " topics")}</div>` : ""}</div>`;
    }).join("");
    return `<section class="grp-sec" id="gxTopics">${secHead(gi('<path d="M4 19V5M4 19h16M8 15l4-4 3 3 5-6"/>'), "Split Exam Topics", its.length || null, `<button class="btn small" data-act="gx-tp-new" data-id="${esc(g.id)}">Split an Exam</button>`)}
      ${body || `<p class="grp-none">Before a big exam, give each member a topic to summarize for everyone.</p>`}</section>`;
  }
  function gxTopicsSheet(g){
    const ms = (S.members[g.id] || []).filter(m => m.user_id === myId() || !S.blocked.has(m.user_id)).map(m => m.user_id);
    const gcid = String(g.course || "").trim() ? matchCourse(g.course) : null;
    const exams = tasksArr().filter(t => MILESTONE(t.type) && t.status !== "done" && t.due && t.due >= todayISO() && (gcid === null || (gcid && t.courseId === gcid))).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 8);
    const ex = exams[0], topics = ex && ex.prep && Array.isArray(ex.prep.topics) ? ex.prep.topics.map(t => t.name) : [];
    openSheet(`<form class="sheet">${head("Split Exam Topics")}<div class="sheet-body">${REQ_NOTE}
      <label class="f"><span class="lh">Exam ${REQ}</span><input type="text" name="exam" required maxlength="120" list="gxExams" value="${esc(ex ? ex.title : "")}" placeholder="e.g. BIO 201 Midterm"><datalist id="gxExams">${exams.map(t => `<option value="${esc(t.title)}"></option>`).join("")}</datalist></label>
      <label class="f"><span class="lh">Date <span class="hint">optional</span></span><input type="date" name="date" value="${esc(ex ? ex.due : "")}"></label>
      <label class="f"><span class="lh">Topics ${REQ} <span class="hint">one per line</span></span><textarea name="topics" rows="6" required data-noenter placeholder="Cellular respiration&#10;Photosynthesis&#10;Cell membranes">${esc(topics.join("\n"))}</textarea></label>
      <p class="mini" style="margin:0">Topics are shared out in turn between the ${ms.length} member${ms.length === 1 ? "" : "s"}.</p></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit id="gxTpGo">Split Topics</button></div></form>`, fd => {
      const exam = str(String(fd.get("exam") || "").trim(), 120), date = String(fd.get("date") || ""), names = String(fd.get("topics") || "").split("\n").map(x => x.trim()).filter(Boolean).slice(0, 30);
      if (!exam || !names.length) return false;
      const data = {v: 1, date: GTL.isDay(date) ? date : "", topics: GXP.shareTopics(names, ms)};
      ensureName(async () => {
        try { const rows = await api.addItems([{group_id: g.id, kind: "topics", ref_id: "", title: exam, data}]); addRows(g.id, rows); if (dlg.open) dlg.close(); toast(`Split ${names.length} topics`); patch(g.id); }
        catch(e) { toast(/kind_check/.test(e.message) ? srvSetup("Split Exam Topics", "groups.sql") : e.message); }
      });
      return false;
    });
  }
  async function gxTopicDone(g, itemId, tid){
    const ex = kindItems(g.id, "topic").find(x => x.ref_id === itemId && x.title === tid && x.user_id === myId());
    try {
      if (ex) { const row = await api.updateItem(ex.id, {data: {v: 1, done: !(ex.data && ex.data.done)}}); Object.assign(ex, row || {}); }
      else { const rows = await api.addItems([{group_id: g.id, kind: "topic", ref_id: itemId, title: tid, data: {v: 1, done: true}}]); addRows(g.id, rows); }
      patch(g.id);
    } catch(e) { toast(e.message); }
  }

  /* Live Quiz (study groups) */
  const LQ = {gid: "", ch: null, ok: false, host: false, item: null, i: 0, reveal: false, answers: {}, mine: null, live: null, seen: 0};
  /* SECURITY: any group member can broadcast on the channel */
  const lqInt = (v, lo, hi) => { const x = Math.floor(Number(v)); return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : lo; };
  const lqClean = p => {
    if (!p || typeof p !== "object") return null;
    const n = lqInt(p.n, 1, 30), options = (Array.isArray(p.options) ? p.options : []).slice(0, 10).map(o => str(o, 200));
    const ints = a => Array.isArray(a) ? a.slice(0, 10).map(x => lqInt(x, 0, 100000)) : null;
    return {item: str(p.item, 80), title: str(p.title, 200), i: lqInt(p.i, 0, n - 1), n, stem: str(p.stem, 400), options, reveal: p.reveal === true,
      correct: ints(p.correct), counts: ints(p.counts), answered: lqInt(p.answered, 0, 100000), host: str(p.host, 60)};
  };
  const quizQs = it => { const p = it && it.data && cleanQuizPayload(it.data); return p ? (p.quiz.questions || []).filter(x => (x.type === "single" || x.type === "multi") && Array.isArray(x.options) && x.options.length >= 2).slice(0, 30) : []; };
  function lqConnect(g){
    const c = cli(); if (!c || !c.channel || !gxOn(g) || isProj(g)) return;
    if (LQ.ch && LQ.gid === g.id) return;
    lqDisconnect();
    LQ.gid = g.id;
    const ch = c.channel("sbquiz:" + g.id, {config: {private: true, broadcast: {self: false, ack: false}}});
    ch.on("broadcast", {event: "state"}, m => { const p = lqClean(m && m.payload); if (!p || LQ.host) return; LQ.live = Object.assign(p, {at: Date.now()}); if (p.i !== LQ.seen) { LQ.mine = null; LQ.seen = p.i; } lqDraw(); });
    ch.on("broadcast", {event: "ans"}, m => { const p = m && m.payload; if (!LQ.host || !p || p.i !== LQ.i || typeof p.u !== "string") return; LQ.answers[p.u] = Number(p.c); lqSend(); lqDraw(); });
    ch.on("broadcast", {event: "hello"}, () => { if (LQ.host) lqSend(); });
    try { ch.subscribe(st => { if (st === "SUBSCRIBED") { LQ.ok = true; try { ch.send({type: "broadcast", event: "hello", payload: {}}); } catch(e) {} } else if (st === "CHANNEL_ERROR" || st === "TIMED_OUT") LQ.ok = false; lqDraw(); }); } catch(e) {}
    LQ.ch = ch;
  }
  function lqDisconnect(){ const c = cli(); if (LQ.ch && c) { try { c.removeChannel(LQ.ch); } catch(e) {} } Object.assign(LQ, {gid: "", ch: null, ok: false, host: false, item: null, live: null}); }
  function lqSend(){
    if (!LQ.host || !LQ.ch || !LQ.item) return;
    const qs = quizQs(LQ.item), q = qs[LQ.i]; if (!q) return;
    const counts = q.options.map((o, k) => Object.values(LQ.answers).filter(v => v === k).length);
    try { LQ.ch.send({type: "broadcast", event: "state", payload: {item: LQ.item.id, title: LQ.item.title, i: LQ.i, n: qs.length, stem: str(q.stem, 400), options: q.options.map(o => str(o, 200)), reveal: LQ.reveal, correct: LQ.reveal ? q.correct : null, counts: LQ.reveal ? counts : null, answered: Object.keys(LQ.answers).length, host: S.name || ""}}); } catch(e) {}
  }
  setInterval(() => { if (LQ.host) lqSend(); }, 8000);
  function lqHtml(g){
    if (isProj(g)) return "";
    const quizzes = kindItems(g.id, "quiz").filter(it => quizQs(it).length);
    const live = LQ.gid === g.id && LQ.live && Date.now() - LQ.live.at < 30000 ? LQ.live : null;
    let body = "";
    if (LQ.host && LQ.gid === g.id && LQ.item) {
      const qs = quizQs(LQ.item), q = qs[LQ.i];
      body = `<div class="lq-card"><span class="mini">You're hosting · Question ${LQ.i + 1} of ${qs.length} · ${Object.keys(LQ.answers).length} answered</span><b class="lq-stem">${esc(q.stem)}</b><ol class="lq-opts">${q.options.map((o, k) => `<li class="${LQ.reveal && (q.correct || []).includes(k) ? "right" : ""}">${esc(o)}${LQ.reveal ? ` <span class="mini">${Object.values(LQ.answers).filter(v => v === k).length}</span>` : ""}</li>`).join("")}</ol>
        <div class="row-actions"><button type="button" class="btn primary" data-act="gx-lq-next">${LQ.reveal ? (LQ.i < qs.length - 1 ? "Next Question" : "Finish") : "Show the Answer"}</button><button type="button" class="btn" data-act="gx-lq-stop">End Quiz</button></div></div>`;
    } else if (live) {
      body = `<div class="lq-card"><span class="mini">${esc(live.host || "A member")} is running a live quiz · Question ${live.i + 1} of ${live.n}</span><b class="lq-stem">${esc(live.stem)}</b><div class="lq-opts btns">${(live.options || []).map((o, k) => `<button type="button" class="pr-kind${LQ.mine === k ? " on" : ""}${live.reveal && (live.correct || []).includes(k) ? " right" : live.reveal && LQ.mine === k ? " wrong" : ""}" data-act="gx-lq-ans" data-id="${k}"${live.reveal ? " disabled" : ""}><b>${esc(o)}</b>${live.reveal && live.counts ? `<span>${live.counts[k]} chose this</span>` : ""}</button>`).join("")}</div>${live.reveal ? `<p class="mini" style="margin:0">${LQ.mine == null ? "The answer is shown." : (live.correct || []).includes(LQ.mine) ? "You got it." : "Not this time. It's added to your review."}</p>` : ""}</div>`;
    } else body = quizzes.length ? `<p class="grp-none">Quiz each other live: one person hosts, everyone answers on their own device.</p>` : `<p class="grp-none">Share a quiz with the group first, then run it live here.</p>`;
    return `<section class="grp-sec" id="gxLive">${secHead(gi('<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z"/>'), "Live Quiz", null, !LQ.host && quizzes.length ? `<button class="btn small" data-act="gx-lq-start" data-id="${esc(g.id)}">Host a Live Quiz</button>` : "")}${LQ.gid === g.id && !LQ.ok && LQ.ch ? `<p class="mini">Connecting…</p>` : ""}${body}</section>`;
  }
  const lqDraw = () => { const g = groupOf(LQ.gid); if (g && ui.tab === "groups" && ui.grp === g.id) swapEl("gxLive", lqHtml(g)); };
  function lqStartSheet(g){
    const quizzes = kindItems(g.id, "quiz").filter(it => quizQs(it).length);
    openSheet(`<div class="sheet pro-sheet">${head("Host a Live Quiz")}<div class="sheet-body"><p style="margin:0">Everyone with the group open answers on their own device. Only multiple-choice questions are used.</p>
      <ul class="pro-feats">${quizzes.map(it => `<li><span class="pf-t"><b>${esc(it.title)}</b><span class="mini">${quizQs(it).length} questions</span></span><button type="button" class="btn small primary" data-act="gx-lq-go" data-id="${esc(it.id)}">Start</button></li>`).join("")}</ul></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button></div></div>`);
  }

  /* Weekly sessions and meetings */
  const occStart = it => { const d = it.data || {}, t0 = ts(d.start); return d.repeat && d.repeat.weekly ? GXP.nextWeekly(t0, d.repeat.until || "", Date.now()) : t0; };

  /* Where it all shows */
  function gxPane(g, k){
    const proj0 = isProj(g);
    const ftSec = (k === "meetings" || (!proj0 && k === "sessions")) ? (() => { const proj = proj0; return featOn(g, "findtime") ? `<section class="grp-sec" id="gxFind">${secHead(gi('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M12 13v3l2 1"/>'), "Find a Time", null, `<button type="button" class="btn small" data-act="gx-ft" data-id="${esc(g.id)}">Find a Time</button>`)}<p class="grp-none">${proj ? "See when every teammate is free and pick a meeting time that works for all of you." : "See when everyone is free and pick a time to study together."}</p></section>` : ""; })() : "";
    if (!gxOn(g)) return k === "members" ? `<div id="gxPro">${gxProBox(g)}</div>` : ftSec;
    const proj = isProj(g);
    if (k === "members") return `<div id="gxPro">${gxProBox(g)}</div>`;
    if (proj && k === "overview") return `<div id="gxOver" class="gx-over">${gxTeamCard(g)}<div class="gx-tools">${featOn(g, "split") ? `<button type="button" class="btn small" data-act="gx-split" data-id="${esc(g.id)}">Split the Work</button>` : ""}${featOn(g, "report") ? `<button type="button" class="btn small" data-act="gx-report" data-id="${esc(g.id)}">Contribution Report</button>` : ""}<button type="button" class="btn small" data-act="gx-tpl-save" data-id="${esc(g.id)}">Save as Template</button></div></div>`;
    if (proj && k === "tasks") return `<div id="gxTasks" class="gx-tools">${featOn(g, "rubric") ? `<button type="button" class="btn small" data-act="gx-rubric" data-id="${esc(g.id)}">Rubric Checklist</button>` : ""}${featOn(g, "split") ? `<button type="button" class="btn small" data-act="gx-split" data-id="${esc(g.id)}">Split the Work</button>` : ""}<button type="button" class="btn small" data-act="gx-tpl" data-id="${esc(g.id)}">Start From a Template</button></div>`;
    if (proj && k === "files") return featOn(g, "uploads") ? gxUploadsHtml(g) : "";
    if (k === "meetings" || (!proj && k === "sessions")) return ftSec + (proj || !featOn(g, "livequiz") ? "" : lqHtml(g));
    if (!proj && k === "study") return featOn(g, "topics") ? gxTopicsHtml(g) : "";
    return "";
  }
  const panesBase = panesHtml;
  panesHtml = g => panesBase(g).replace(/(<div class="grp-pane" data-pane="(\w+)"[^>]*>)/g, (m, open, k) => open + gxPane(g, k));
  const patchBase = patch;
  patch = gid => {
    patchBase(gid);
    const g = groupOf(gid), root = $("#grpDetail"); if (!g || !root || root.dataset.gid !== gid) return;
    [["gxPro", "members"], ["gxOver", "overview"], ["gxUploads", "files"], ["gxTopics", "study"], ["gxLive", "sessions"]].forEach(([id, k]) => {
      const el = document.getElementById(id); if (!el) return;
      const html = id === "gxLive" ? lqHtml(g) : gxPane(g, k);
      if (id === "gxPro" || id === "gxOver" || id === "gxUploads" || id === "gxTopics" || id === "gxLive") { const t = document.createElement("div"); t.innerHTML = html; const n = t.querySelector("#" + id); if (n) el.replaceWith(n); }
    });
    if (gxOn(g) && !isProj(g) && featOn(g, "livequiz")) lqConnect(g);
  };
  const unsubscribeBase = unsubscribe;
  unsubscribe = function(){ unsubscribeBase(); if (!LQ.host) lqDisconnect(); };

  document.addEventListener("change", e => {
    const inp = e.target && e.target.closest && e.target.closest("[data-gx-up]"); if (!inp) return;
    const g = groupOf(inp.dataset.gxUp); if (g && inp.files && inp.files[0]) gxUpload(g, inp.files[0]);
    inp.value = "";
  });
  hook("act", (act, el, id) => {
    if (!act.startsWith("gx-")) return false;
    const g = groupOf(id) || groupOf(ui.grp);
    const need = () => { if (g && gxOn(g)) return true; if (typeof PLAN !== "undefined" && PLAN) PLAN.openSheet(gxWhy); return false; };
    switch (act) {
      case "gx-pro-sheet": if (g) gxProSheet(g); return true;
      case "gx-pro-on": if (g) gxSetPro(g, true); return true;
      case "gx-pro-off": if (g) confirmSheet("Unassign Pro?", "The group keeps everything, but its group extras and bigger limits end, and you can assign Pro to another group.", "Unassign", () => gxSetPro(g, false)); return true;
      case "gx-team-set": if (g && isOwner(g) && need()) gxTeamSheet(g); return true;
      case "gx-team-clear": if (g && isOwner(g)) { if (dlg.open) dlg.close(); gxSetTeam(g, ""); } return true;
      case "gx-split": if (g && need()) gxSplitSheet(g); return true;
      case "gx-split-again": { const g2 = SP2 && groupOf(SP2.gid); if (g2) gxSplitSheet(g2); return true; }
      case "gx-split-go": gxSplitGo(); return true;
      case "gx-report": if (g && need()) gxReport(g); return true;
      case "gx-rubric": if (g && need()) gxRubricSheet(g); return true;
      case "gx-rb-go": gxRubricGo(); return true;
      case "gx-tpl-save": if (g && (!isProj(g) || need())) gxSaveTemplate(g); return true;
      case "gx-tpl": if (g && need()) gxTemplateSheet(g); return true;
      case "gx-tpl-use": { const gg = groupOf(ui.grp); if (gg) gxUseTemplate(gg, id); return true; }
      case "gx-tpl-del": { state.settings = Object.assign({}, state.settings, {grpTemplates: tpls().filter(t => t.id !== id)}); saveSettings(); const gg = groupOf(ui.grp); if (gg) gxTemplateSheet(gg); return true; }
      case "gx-ft": if (g) gxFindTime(g); return true;
      case "gx-ft-share": if (g) gxShareAvail(g.id).then(() => { if (dlg.open && dlg.querySelector(".ft-grid,.gx-box")) gxFindTime(g); }); return true;
      case "gx-ft-len": { FT.mins = [30, 60, 120].includes(Number(id)) ? Number(id) : 60; FT.pick = 0; const gg = groupOf(FT.gid); if (gg) gxFindTime(gg); return true; }
      case "gx-ft-pick": { FT.pick = Number(id) || 0; const gg = groupOf(FT.gid); if (gg) gxFindTime(gg); return true; }
      case "gx-ft-add": if (g) gxFtAdd(g); return true;
      case "gx-ft-mine": if (g) gxPickFree(g); return true;
      case "gx-up-open": { const it = itemOf(id); if (it) gxOpenUpload(it); return true; }
      case "gx-up-del": { const it = itemOf(id); if (!it || it.user_id !== myId()) return true;
        confirmSheet(`Remove ${str(it.title, 60)}?`, "It's deleted for everyone in the group.", "Remove", async () => { try { const c = cli(); if (c && c.storage && it.data && it.data.path) await c.storage.from(SB_BUCKET).remove([it.data.path]); await api.removeItem(it.id); const gg = groupOf(it.group_id); S.items[it.group_id] = (S.items[it.group_id] || []).filter(x => x.id !== it.id); if (gg) patch(gg.id); toast("Removed"); } catch(e) { toast(e.message); } });
        return true; }
      case "gx-tp-new": if (g && need()) gxTopicsSheet(g); return true;
      case "gx-tp-done": { const gg = groupOf(ui.grp); if (gg) gxTopicDone(gg, id, el.dataset.t); return true; }
      case "gx-lq-start": if (g && need()) lqStartSheet(g); return true;
      case "gx-lq-go": { const it = itemOf(id), gg = it && groupOf(it.group_id); if (!gg) return true; if (dlg.open) dlg.close(); lqConnect(gg); Object.assign(LQ, {host: true, item: it, i: 0, reveal: false, answers: {}}); lqSend(); lqDraw(); return true; }
      case "gx-lq-next": { if (!LQ.host || !LQ.item) return true; const qs = quizQs(LQ.item); if (!LQ.reveal) LQ.reveal = true; else if (LQ.i < qs.length - 1) { LQ.i++; LQ.reveal = false; LQ.answers = {}; } else { LQ.host = false; LQ.item = null; toast("Live quiz finished"); } lqSend(); lqDraw(); return true; }
      case "gx-lq-stop": LQ.host = false; LQ.item = null; lqDraw(); return true;
      case "gx-lq-ans": { if (!LQ.live || LQ.live.reveal || !LQ.ch) return true; LQ.mine = Number(id); try { LQ.ch.send({type: "broadcast", event: "ans", payload: {i: LQ.live.i, c: LQ.mine, u: myId()}}); } catch(e) {} lqDraw(); return true; }
      case "gx-rv-ok": { const t = ptTaskOf(id); if (t) ptMutate(t.group_id, id, {status: "done"}); return true; }
      case "gx-rv-back": { const t = ptTaskOf(id); if (t) ptMutate(t.group_id, id, {status: "doing"}); return true; }
    }
    return false;
  });
  window.SBGXP = GXP;

  const gxCss = document.createElement("style");
  gxCss.textContent = `
.btn.gx-assign{background:linear-gradient(135deg,#FFB443,#FF5C8A)!important;color:#fff!important;border-color:transparent!important;font-weight:700}
.btn.gx-assign::before{display:none!important}
.btn.gx-assign:hover{filter:brightness(1.06)}
.gx-chip{background:linear-gradient(135deg,#FFB443,#FF5C8A);color:#fff;border-radius:6px;padding:2px 7px;font:800 .62rem var(--display);letter-spacing:.08em;align-self:center}
.gx-box{display:flex;align-items:center;gap:12px;border:1px solid var(--line);background:var(--surface);border-radius:12px;padding:10px 12px;margin:0 0 12px}
.gx-box.on{background:color-mix(in srgb,#FFB443 10%,var(--surface))}
#gxPro > .gx-box,#gxPro > .grp-note{margin:0}   /* in a group's tab the sections' own 16px gap spaces it, as between the other sections */
#gxPro:empty{display:none}
.gx-bt{display:grid;gap:2px;flex:1;min-width:0}
.gx-tools{display:flex;flex-wrap:wrap;gap:8px;margin:0}
.gx-over{display:flex;flex-direction:column;gap:16px}   /* the same 16px above and below the tool buttons as the panes around them */
.gx-over>.gx-card{margin:0}
.gx-card{display:flex;align-items:center;gap:12px;border:1px solid var(--line);background:var(--surface);border-radius:4px 12px 12px 12px;box-shadow:var(--shadow);padding:12px 14px;margin:0 0 10px}
.gx-ct{display:grid;gap:2px;flex:1;min-width:0}
.gx-big{font:600 1.25rem var(--display)}
.gx-star{vertical-align:-2px;margin-left:4px}
.gx-split{border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:var(--surface);display:grid;gap:6px}
.gx-sh{display:flex;align-items:center;gap:8px}
.gx-sh .mini{margin-left:auto}
.gx-st{font-size:.92rem;padding-left:34px}
.gx-topics{display:grid;gap:10px;margin-bottom:12px}
.gx-mine{display:grid;gap:4px;background:var(--navy,#0E2A56);color:#fff;border-radius:12px;padding:12px 14px}
.gx-mine .mini{color:#C9D7F2}
.gx-mine b{font:600 1.1rem var(--display)}
.gx-mine .btn:not(.primary){background:transparent;color:#fff;border-color:rgba(255,255,255,.45)}
.gx-tlist{list-style:none;margin:0;padding:0}
.gx-tlist li{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--line)}
.gx-tlist li:first-child{border-top:0}
.gx-tn{display:grid;flex:1;min-width:0}
.pill.gx-ok{background:color-mix(in srgb,var(--leaf) 18%,var(--surface));border-color:color-mix(in srgb,var(--leaf) 40%,var(--line))}
.pt-prio.review{background:color-mix(in srgb,#7A4FD6 14%,var(--surface));color:#5B3BB0}
.ft-grid{display:grid;grid-template-columns:auto repeat(7,minmax(0,1fr));gap:3px;font-size:.72rem;color:var(--muted);align-items:center}
.ft-d{text-align:center;display:grid;line-height:1.15}
.ft-d b{font-weight:700;color:var(--ink)}
.ft-d small{font-size:.66rem}
.ft-h{padding-right:6px;white-space:nowrap}
.ft-c{height:20px;border-radius:4px;background:color-mix(in srgb,var(--accent) var(--a),var(--soft))}
.ft-best{display:grid;gap:8px}
.lq-card{display:grid;gap:10px;border:1px solid var(--line);background:var(--surface);border-radius:12px;padding:12px 14px}
.lq-stem{font:600 1.1rem/1.35 var(--display)}
.lq-opts{margin:0;padding-left:1.2em;display:grid;gap:6px}
.lq-opts.btns{padding:0}
.lq-opts li.right{font-weight:700;color:var(--leaf)}
.pr-kind.right{border:2px solid var(--leaf)}
.pr-kind.wrong{border:2px solid var(--late)}
`;
  document.head.appendChild(gxCss);

  // The "..." menus in groups
  const closeMenus = keep => document.querySelectorAll("details.grp-more[open]").forEach(d => { if (d !== keep) d.open = false; });
  document.addEventListener("pointerdown", e => { const d = e.target.closest && e.target.closest("details.grp-more"); closeMenus(d); }, true);
  document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("details.grp-more[open] [data-act]"); if (b) setTimeout(() => { const d = b.closest("details"); if (d) d.open = false; }, 0); }, true);
  document.addEventListener("keydown", e => { if (e.key !== "Escape") return; const d = document.querySelector("details.grp-more[open]"); if (d) { d.open = false; const sm = d.querySelector("summary"); if (sm) sm.focus(); e.stopPropagation(); } }, true);
  document.addEventListener("toggle", e => { const d = e.target; if (d && d.matches && d.matches("details.grp-more") && d.open) closeMenus(d); }, true);
  window.SBGROUPS = {known: () => Array.isArray(S.groups) ? S.groups.length : null, probe: async () => online() ? ((await api.groups()) || []).length : null};
  // For 97-sharing.js (public links and the Course Library)
  window.SBGROUPS.share = {online, cli, myId, ensureName, rememberWebUrl, linkFor, normCode, cleanPayload, cleanQuizPayload, quizPayload, deckPayload, addDeckCopy, previewSheet,
    deckShareSheet, matchCourse, codeKey, copyText, sendText, busyBtn, hashOf, loadingSheet, myName: () => S.name || "",
    // members of a group (for who has a shared whiteboard) and the groups you're in
    members: gid => (S.members[gid] || []).map(m => ({id: m.user_id, name: m.display_name || "", color: m.color || ""})),
    // a member's picture as the group shows it (their companion in their colour, or initials)
    avatar: (gid, id, name) => av(name, id, gid),
    // open a group on its Whiteboards tab
    openBoards: gid => { if (!gid) return; S.tab[gid] = "boards"; openGroup(gid); },
    // load a group's members (names, colours, companions) when the group page hasn't yet
    loadMembers: async gid => { if (!gid || !online()) return false; if ((S.members[gid] || []).length) return false; try { const ms = await api.members([gid]); if (ms && ms.length) { S.members[gid] = ms; return true; } } catch (e) {} return false; },
    groups: () => (Array.isArray(S.groups) ? S.groups : []).map(g => ({id: g.id, name: g.name, kind: g.kind || "study"}))};
  hook("boot", () => {
    try {
      const u = new URL(location.href), dk = u.searchParams.get("deck"), gp = u.searchParams.get("group"), sh = u.searchParams.get("shared");
      if (dk || gp || sh) {
        const {code} = normCode(dk || gp || sh);
        if (code) localStorage.setItem(PEND, JSON.stringify({kind: dk ? "deck" : sh ? "share" : "group", code, at: Date.now()}));
        u.searchParams.delete("deck"); u.searchParams.delete("group"); u.searchParams.delete("shared");
        history.replaceState(history.state, "", u.pathname + u.search + u.hash);
      }
    } catch(e) {}
    watchT = setInterval(tick, 1500);
    setTimeout(tick, 600);
  });
  // Start watching again after you sign in later
  setInterval(() => { if (!watchT && (takePending() || !checked) && online()) watchT = setInterval(tick, 1500); }, 20000);
})();


