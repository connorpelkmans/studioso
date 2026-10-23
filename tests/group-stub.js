// An in-memory stand-in for the Supabase client, so Study Groups work locally: page.addInitScript(stubInit, opts)
"use strict";
function stubInit(opts){
  const me = {id: opts.me, email: opts.me + "@x.com"};
  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); const z = x => String(x).padStart(2, "0"); return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()); };
  const DB = {
    study_groups: [{id: "g1", name: "Bio Squad", course: "BIOL 201", owner_id: "u1", invite_code: "ABC-DEF", created_at: "2026-01-01", weekly_goal: 0, kind: opts.kind || "study", project_due: null}],
    group_members: [{group_id: "g1", user_id: "u1", role: "owner", display_name: "Connor", joined_at: "2026-01-01"}, {group_id: "g1", user_id: "u2", role: "member", display_name: "Sam", joined_at: "2026-01-02"}, {group_id: "g1", user_id: "u3", role: "member", display_name: "Jo", joined_at: "2026-01-03"}],
    group_items: [], group_messages: [], study_profiles: [{user_id: opts.me, display_name: opts.me === "u1" ? "Connor" : "Sam"}], shared_decks: [], group_blocks: [],
    group_quiz_scores: [], group_rsvps: [], group_stats: [], group_checkins: [], group_reactions: [],
    group_task_lists: [], group_tasks: []
  };
  const nowIso = () => new Date().toISOString(); let n = 0; const id = p => p + (++n);
  (opts.items || []).forEach(x => DB.group_items.push(Object.assign({group_id: "g1", ref_id: "", created_at: "2026-02-01T00:00:00Z", updated_at: "2026-02-01T00:00:00Z"}, x)));
  if (opts.emptyList) DB.group_task_lists.push({id: "L1", group_id: "g1", title: "BIOL 201 Poster", course_code: "BIOL 201", created_by: "u1", created_at: "2026-02-01T00:00:00Z", archived: false});
  if (opts.seed) {
    DB.group_task_lists.push({id: "L1", group_id: "g1", title: "BIOL 201 Poster", course_code: "BIOL 201", created_by: "u2", created_at: "2026-02-01T00:00:00Z", archived: false});
    const t = (i, title, who, due, extra) => Object.assign({id: i, list_id: "L1", group_id: "g1", title, notes: "", status: "todo", assignee_id: who, due_at: due, priority: null, position: DB.group_tasks.length + 1, created_by: "u2", created_at: "2026-02-01T00:00:0" + DB.group_tasks.length + "Z", updated_by: "u2", updated_at: "2026-02-01T00:00:00Z", completed_at: null, completed_by: null, deleted: false}, extra || {});
    DB.group_tasks.push(t("s1", "Write the methods section", "u1", day(2)), t("s2", "Collect survey data", "u1", day(-1)), t("s3", "Design the poster layout", "u2", day(5)), t("s4", "Proofread", null, null), t("s5", "Book printing", "u3", day(-2), {created_by: "u3"}));
  }
  window.__DB = DB; window.__calls = []; window.__chans = []; window.__fail = null; window.__offline = false;
  const tableMissing = t => (opts.missing || []).includes(t);
  const wait = (v, ms) => new Promise(r => setTimeout(() => r(v), ms == null ? 25 : ms));
  const net = () => ({error: {message: "Failed to fetch"}});
  const mk = t => {
    const st = {f: [], op: "select", payload: null, one: false, order: null};
    const run = () => {
      if (window.__offline) return wait(net());
      if (tableMissing(t)) return wait({error: {code: "42P01", message: 'relation "public.' + t + '" does not exist'}});
      const rows = DB[t] || [], hit = rows.filter(r => st.f.every(f => f(r)));
      if (st.op === "insert") { const add = [].concat(st.payload).map(r => Object.assign({id: id("r")}, r)); add.forEach(r => rows.push(r)); window.__calls.push(["insert", t, st.payload]); return wait({data: st.one ? add[0] : add}); }
      if (st.op === "update") { hit.forEach(r => Object.assign(r, st.payload)); return wait({data: st.one ? hit[0] : hit}); }
      if (st.op === "delete") { DB[t] = rows.filter(r => !hit.includes(r)); return wait({data: null}); }
      let out = hit.slice(); if (st.order) out.sort((a, b) => (String(a[st.order[0]]) > String(b[st.order[0]]) ? 1 : -1) * (st.order[1] ? 1 : -1));
      if (st.one) return wait({data: out[0] || null});
      return wait({data: out});
    };
    const api = {select() { return api; }, eq(c, v) { st.f.push(r => r[c] === v); return api; }, neq(c, v) { st.f.push(r => r[c] !== v); return api; }, in(c, v) { st.f.push(r => v.includes(r[c])); return api; },
      gte(c, v) { st.f.push(r => r[c] >= v); return api; },
      or(expr) { const ts = String(expr).split(",").map(x => { const i = x.indexOf("."), j = x.indexOf(".", i + 1); return [x.slice(0, i), x.slice(i + 1, j), x.slice(j + 1)]; });
        const t1 = ([c, op, v], r) => op === "eq" ? String(r[c]) === v : op === "neq" ? String(r[c]) !== v : op === "gte" ? String(r[c] || "") >= v : op === "is" ? (v === "null" ? r[c] == null : String(r[c]) === v) : false;
        st.f.push(r => ts.some(t => t1(t, r))); return api; },
      order(c, o) { st.order = [c, !(o && o.ascending === false)]; return api; }, limit() { return api; },
      maybeSingle() { st.one = true; return run(); }, single() { st.one = true; return run(); },
      insert(rows) { st.op = "insert"; st.payload = rows; return api; }, update(p) { st.op = "update"; st.payload = p; return api; }, delete() { st.op = "delete"; return api; },
      upsert(r) { st.op = "insert"; st.payload = r; return api; }, then(res, rej) { return run().then(res, rej); }};
    return api;
  };
  const E = m => ({error: {message: m}});
  const memberOf = (gid, u) => DB.group_members.some(m => m.group_id === gid && m.user_id === u);
  const ownerOf = gid => DB.study_groups.some(g => g.id === gid && g.owner_id === me.id);
  const rpc = {
    create_task_list(a) { if (!memberOf(a.p_group, me.id)) return E("You're not in that group"); if (DB.group_task_lists.filter(l => l.group_id === a.p_group && !l.archived).length >= 20) return E("A group can keep up to 20 task lists. Archive or delete one first.");
      const r = {id: id("L"), group_id: a.p_group, title: String(a.p_title).trim(), course_code: a.p_course || "", created_by: me.id, created_at: nowIso(), archived: false}; DB.group_task_lists.push(r); return {data: r}; },
    update_task_list(a) { const l = DB.group_task_lists.find(x => x.id === a.p_list); if (!l) return E("That list isn't in one of your groups"); Object.assign(l, a.p_patch); return {data: l}; },
    delete_task_list(a) { const l = DB.group_task_lists.find(x => x.id === a.p_list); if (!l) return E("That list isn't in one of your groups"); if (!(l.created_by === me.id || ownerOf(l.group_id))) return E("Only the group owner or whoever made the list can delete it");
      DB.group_task_lists = DB.group_task_lists.filter(x => x !== l); DB.group_tasks = DB.group_tasks.filter(x => x.list_id !== l.id); return {data: null}; },
    add_group_task(a) { const l = DB.group_task_lists.find(x => x.id === a.p_list); if (!l) return E("That list isn't in one of your groups"); if (a.p_assignee && !memberOf(l.group_id, a.p_assignee)) return E("You can only assign a task to someone in the group.");
      const r = {id: id("T"), list_id: l.id, group_id: l.group_id, title: String(a.p_title).trim(), notes: a.p_notes || "", status: "todo", assignee_id: a.p_assignee || null, due_at: a.p_due || null, priority: a.p_priority || null,
        position: Math.max(0, ...DB.group_tasks.filter(x => x.list_id === l.id).map(x => x.position)) + 1, created_by: me.id, created_at: nowIso(), updated_by: me.id, updated_at: nowIso(), completed_at: null, completed_by: null, deleted: false};
      DB.group_tasks.push(r); return {data: r}; },
    update_group_task(a) { const t = DB.group_tasks.find(x => x.id === a.p_task && !x.deleted); if (!t) return E("That task isn't in one of your groups"); const p = a.p_patch;
      if ("assignee_id" in p && p.assignee_id !== t.assignee_id && t.assignee_id && !(t.assignee_id === me.id || ownerOf(t.group_id))) return E("Only the person it's assigned to, or the group owner, can reassign this task");
      Object.assign(t, p); if (p.status === "done") { t.completed_at = nowIso(); t.completed_by = me.id; } else if ("status" in p) { t.completed_at = null; t.completed_by = null; } t.updated_by = me.id; t.updated_at = nowIso(); return {data: t}; },
    move_group_task(a) { return {data: null}; },
    set_rsvp(a) { const it = DB.group_items.find(x => x.id === a.p_item); DB.group_rsvps = DB.group_rsvps.filter(r => !(r.item_id === a.p_item && r.user_id === me.id)); if (it && a.p_status) DB.group_rsvps.push({item_id: a.p_item, group_id: it.group_id, user_id: me.id, status: a.p_status}); return {data: null}; },
    delete_group_task(a) { const t = DB.group_tasks.find(x => x.id === a.p_task); if (!t) return E("That task isn't in one of your groups"); if (!(t.created_by === me.id || ownerOf(t.group_id))) return E("Only the group owner or whoever added the task can remove it"); t.deleted = true; return {data: null}; }
  };
  const client = {
    from: mk,
    rpc: (name, a) => {
      window.__calls.push(["rpc", name, a]);
      if (window.__offline) return wait(net());
      if (window.__fail && (window.__fail === name || window.__fail === "*")) { const m = window.__failMsg || "Something went wrong"; window.__fail = null; return wait(E(m)); }
      if (tableMissing("group_tasks") && /task/.test(name)) return wait({error: {code: "PGRST202", message: "Could not find the function public." + name + " in the schema cache"}});
      return wait(rpc[name] ? rpc[name](a) : {data: null});
    },
    channel: name => { const c = {name, h: [], on(type, cfg, cb) { c.h.push({cfg, cb}); return c; }, subscribe() { return c; }}; window.__chans.push(c); return c; },
    removeChannel(c) { c.gone = true; }
  };
  window.__sbGroupsStub = {user: me, client};
  try { localStorage.setItem("sb:grpName:" + me.id, me.id === "u1" ? "Connor" : "Sam"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); } catch(e) {}
  window.__fire = (table, ev) => { window.__chans.filter(c => !c.gone).forEach(c => c.h.forEach(h => { if (h.cfg.table === table) h.cb({eventType: ev || "UPDATE", new: {}, old: {}}); })); };
}
module.exports = {stubInit};
