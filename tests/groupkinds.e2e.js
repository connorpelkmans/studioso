// Browser checks for the study group and group project pages (1.15), with an in-memory stand-in for the Supabase client (window.__sbGroupsStub).
// Run: node tests/groupkinds.e2e.js [screenshot-dir]      (needs Playwright; see tests/pw.js for how it and Chromium are found)
const path = require("path"), fs = require("fs"), assert = require("assert");
const file = path.resolve(__dirname, "..", "index.html");
const shots = path.resolve(process.argv[2] || path.join(__dirname, "..", "tests-out"));
fs.mkdirSync(shots, {recursive: true});
const {chromium, executablePath} = require("./pw");
let checks = 0; const ok = (c, m) => { checks++; assert(c, m); }; const eq = (a, b, m) => { checks++; assert.deepStrictEqual(a, b, m); };

function stubInit(opts){
  const me = {id: opts.me, email: opts.me + "@x.com"};
  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); const z = x => String(x).padStart(2, "0"); return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()); };
  const mem = (g, u, role, name) => ({group_id: g, user_id: u, role, display_name: name, joined_at: "2026-01-0" + (u.slice(1))});
  const NAMES = {u1: "Connor", u2: "Sam", u3: "Jo"};
  const DB = {
    study_groups: [{id: "g1", name: "Bio Squad", course: "BIOL 201", owner_id: "u1", invite_code: "ABC-DEF", created_at: "2026-01-01", weekly_goal: 0, kind: "study", project_due: null},
      {id: "g2", name: "Poster Team", course: "BIOL 201", owner_id: "u1", invite_code: "XYZ-123", created_at: "2026-01-02", weekly_goal: 0, kind: "project", project_due: day(opts.due == null ? 10 : opts.due)}],
    group_members: ["g1", "g2"].flatMap(g => [mem(g, "u1", "owner", "Connor"), mem(g, "u2", "member", "Sam"), mem(g, "u3", "member", "Jo")]),
    group_items: [], group_messages: [], study_profiles: [{user_id: opts.me, display_name: NAMES[opts.me]}], shared_decks: [], group_blocks: [],
    group_quiz_scores: [], group_misses: [], group_rsvps: [], group_stats: [], group_checkins: [], group_reactions: [], group_task_lists: [], group_tasks: [], group_peer_ratings: []
  };
  let n = 0; const id = p => p + (++n), nowIso = () => new Date().toISOString();
  window.__DB = DB; window.__calls = []; window.__chans = [];
  const wait = v => new Promise(r => setTimeout(() => r(v), 15));
  const missing = t => (opts.missing || []).includes(t);
  const mk = t => {
    const st = {f: [], op: "select", payload: null, one: false, order: null};
    const run = () => {
      if (missing(t)) return wait({error: {code: "42P01", message: 'relation "public.' + t + '" does not exist'}});
      const rows = DB[t] || [], hit = rows.filter(r => st.f.every(f => f(r)));
      if (st.op === "insert") {
        if (t === "group_items" && !(opts.kinds || ["deck", "task", "quiz", "event", "qa", "answer", "link", "minutes", "role", "weak"]).includes([].concat(st.payload)[0].kind)) return wait({error: {code: "23514", message: 'new row violates check constraint "group_items_kind_check"'}});
        const add = [].concat(st.payload).map(r => Object.assign({id: id("r"), created_at: nowIso(), updated_at: nowIso(), user_id: me.id, author_name: NAMES[me.id]}, r));
        add.forEach(r => rows.push(r)); window.__calls.push(["insert", t, st.payload]); return wait({data: st.one ? add[0] : add});
      }
      if (st.op === "update") { hit.forEach(r => Object.assign(r, st.payload, {updated_at: nowIso()})); return wait({data: st.one ? hit[0] : hit}); }
      if (st.op === "delete") { DB[t] = rows.filter(r => !hit.includes(r)); return wait({data: null}); }
      const out = hit.slice(); if (st.order) out.sort((a, b) => (String(a[st.order[0]]) > String(b[st.order[0]]) ? 1 : -1) * (st.order[1] ? 1 : -1));
      return wait({data: st.one ? out[0] || null : out});
    };
    const api = {select() { return api; }, eq(c, v) { st.f.push(r => r[c] === v); return api; }, neq(c, v) { st.f.push(r => r[c] !== v); return api; }, in(c, v) { st.f.push(r => v.includes(r[c])); return api; },
      gte(c, v) { st.f.push(r => r[c] >= v); return api; }, order(c, o) { st.order = [c, !(o && o.ascending === false)]; return api; }, limit() { return api; },
      maybeSingle() { st.one = true; return run(); }, single() { st.one = true; return run(); }, insert(rows) { st.op = "insert"; st.payload = rows; return api; },
      update(p) { st.op = "update"; st.payload = p; return api; }, delete() { st.op = "delete"; return api; }, upsert(r) { st.op = "insert"; st.payload = r; return api; }, then(res, rej) { return run().then(res, rej); }};
    return api;
  };
  const E = m => ({error: {message: m}});
  const ownerOf = gid => DB.study_groups.some(g => g.id === gid && g.owner_id === me.id);
  const rpc = {
    create_task_list(a) { const r = {id: id("L"), group_id: a.p_group, title: String(a.p_title).trim(), course_code: a.p_course || "", created_by: me.id, created_at: nowIso(), archived: false}; DB.group_task_lists.push(r); return {data: r}; },
    add_group_task(a) { const l = DB.group_task_lists.find(x => x.id === a.p_list); if (!l) return E("That list isn't in one of your groups");
      const r = {id: id("T"), list_id: l.id, group_id: l.group_id, title: String(a.p_title).trim(), notes: a.p_notes || "", status: "todo", assignee_id: a.p_assignee || null, due_at: a.p_due || null, priority: a.p_priority || null,
        position: Math.max(0, ...DB.group_tasks.filter(x => x.list_id === l.id).map(x => x.position)) + 1, created_by: me.id, created_at: nowIso(), updated_by: me.id, updated_at: nowIso(), completed_at: null, completed_by: null, deleted: false};
      DB.group_tasks.push(r); return {data: r}; },
    update_group_task(a) { const t = DB.group_tasks.find(x => x.id === a.p_task && !x.deleted); if (!t) return E("That task isn't in one of your groups"); Object.assign(t, a.p_patch);
      if (a.p_patch.status === "done") { t.completed_at = nowIso(); t.completed_by = me.id; } else if ("status" in a.p_patch) { t.completed_at = null; t.completed_by = null; } t.updated_by = me.id; t.updated_at = nowIso(); return {data: t}; },
    create_group(a) { const g = {id: "gnew" + (++n), name: a.p_name, course: a.p_course || "", owner_id: me.id, invite_code: "NEW-" + n, created_at: nowIso(), weekly_goal: 0, kind: "study", project_due: null}; DB.study_groups.push(g); DB.group_members.push(mem(g.id, me.id, "owner", NAMES[me.id])); return {data: g.id}; },
    set_group_kind(a) { const g = DB.study_groups.find(x => x.id === a.p_group); if (!g || g.owner_id !== me.id) return E("Only the owner can do that"); g.kind = a.p_kind; g.project_due = a.p_kind === "project" ? a.p_due : null; return {data: null}; },
    report_misses(a) { DB.group_misses = DB.group_misses.filter(r => !(r.group_id === a.p_group && r.user_id === me.id));
      a.p_rows.forEach(r => { if (DB.group_items.some(i => i.id === r.item && i.group_id === a.p_group)) DB.group_misses.push({group_id: a.p_group, item_id: r.item, mkey: r.k, user_id: me.id, misses: r.m, tries: r.t}); }); return {data: null}; },
    forget_misses(a) { DB.group_misses = DB.group_misses.filter(r => !(r.group_id === a.p_group && r.user_id === me.id)); return {data: null}; },
    top_misses(a) { const rows = DB.group_misses.filter(r => r.group_id === a.p_group); if (new Set(rows.map(r => r.user_id)).size < 3) return {data: []};
      const by = {}; rows.forEach(r => { const k = r.item_id + "|" + r.mkey; (by[k] = by[k] || []).push(r); });
      return {data: Object.values(by).map(g => ({item_id: g[0].item_id, mkey: g[0].mkey, members_missed: g.filter(r => r.misses > 0).length, total_misses: g.reduce((x, r) => x + r.misses, 0), members_tried: g.length})).filter(r => r.members_missed >= 2).sort((a, b) => b.members_missed - a.members_missed)}; },
    submit_peer(a) { if (a.p_to === me.id) return E("You can only rate someone else in the group"); if (a.p_score < 1 || a.p_score > 5) return E("Pick a score from 1 to 5");
      const ex = DB.group_peer_ratings.find(r => r.group_id === a.p_group && r.from_user === me.id && r.to_user === a.p_to);
      if (ex) Object.assign(ex, {score: a.p_score, note: a.p_note}); else DB.group_peer_ratings.push({group_id: a.p_group, from_user: me.id, to_user: a.p_to, score: a.p_score, note: a.p_note, updated_at: nowIso()}); return {data: null}; },
    peer_summary(a) { if (!ownerOf(a.p_group)) return E("Only the owner can see the summary"); const by = {};
      DB.group_peer_ratings.filter(r => r.group_id === a.p_group).forEach(r => { (by[r.to_user] = by[r.to_user] || []).push(r.score); });
      return {data: Object.keys(by).map(k => ({to_user: k, raters: by[k].length, avg_score: Math.round(by[k].reduce((x, y) => x + y, 0) / by[k].length * 10) / 10}))}; }
  };
  const client = {
    from: mk,
    rpc: (name, a) => { window.__calls.push(["rpc", name, a]);
      if (missing("group_peer_ratings") && /peer/.test(name)) return wait({error: {code: "PGRST202", message: "Could not find the function public." + name + " in the schema cache"}});
      return wait(rpc[name] ? rpc[name](a) : {data: null}); },
    channel: name => { const c = {name, h: [], on(type, cfg, cb) { c.h.push({cfg, cb}); return c; }, subscribe() { return c; }}; window.__chans.push(c); return c; },
    removeChannel(c) { c.gone = true; }
  };
  window.__sbGroupsStub = {user: me, client};
  window.__fire = table => { window.__chans.filter(c => !c.gone).forEach(c => c.h.forEach(h => { if (h.cfg.table === table) h.cb({eventType: "UPDATE", new: {}, old: {}}); })); };
  window.__day = day;
  try { localStorage.setItem("sb:grpName:" + me.id, NAMES[me.id]); } catch(e) {}
  { const now = nowIso();
    DB.group_items.push({id: "dk1", group_id: "g1", user_id: "u2", author_name: "Sam", kind: "deck", ref_id: "x", title: "Group deck", data: {cards: [{id: "s1", front: "Mitochondria", back: "Powerhouse of the cell"}, {id: "s2", front: "Ribosome", back: "Makes protein"}], quizzes: []}, created_at: now, updated_at: now},
      {id: "qz1", group_id: "g1", user_id: "u2", author_name: "Sam", kind: "quiz", ref_id: "d:q", title: "Cell quiz", data: {quiz: {id: "qid", questions: [{id: "qq1", type: "single", stem: "Which organelle makes ATP?", options: ["Nucleus", "Mitochondria"], correct: [1]}]}}, created_at: now, updated_at: now}); }
  if (opts.seed) { try { localStorage.setItem("coursework:v2", JSON.stringify(opts.seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } catch(e) {} }
}

const SEED = {v: 2, courses: [{id: "c1", name: "Biology", code: "BIOL 201", color: "#3B6FE0"}], settings: {capacity: 15, dailyHours: 3}, updated: 1, tasks: [], notes: [],
  decks: [{id: "d1", name: "Cells", courseId: "c1", created: 1, cards: [
    {id: "k1", front: "Mitochondria", back: "Powerhouse of the cell", box: 1, due: "", seen: 3, right: 0, wrong: 3},
    {id: "k2", front: "Ribosome", back: "Makes protein", box: 1, due: "", seen: 2, right: 0, wrong: 2},
    {id: "k3", front: "Nucleus", back: "Holds DNA", box: 4, due: "", seen: 4, right: 4, wrong: 0}]},
  {id: "cp1", name: "Group deck", courseId: "c1", created: 2, sharedFrom: {g: "g1", i: "dk1", v: "2026-01-01T00:00:00Z", by: "Sam", n: "Bio Squad"}, cards: [
    {id: "l1", sid: "s1", front: "Mitochondria", back: "Powerhouse of the cell", box: 1, due: "", seen: 3, right: 0, wrong: 3},
    {id: "l2", sid: "s2", front: "Ribosome", back: "Makes protein", box: 3, due: "", seen: 2, right: 2, wrong: 0}]},
  {id: "cp2", name: "Group quiz", courseId: "c1", created: 3, sharedFrom: {g: "g1", i: "qz1", v: "2026-01-01T00:00:00Z", by: "Sam", n: "Bio Squad", q: 1}, cards: [], aiQuizzes: [
    {id: "lq", sid: "qid", title: "Cell quiz", questions: [{id: "qq1", type: "single", stem: "Which organelle makes ATP?", options: ["Nucleus", "Mitochondria"], correct: [1], rationale: "x", optionNotes: ["", ""], tries: 2, miss: 2}]}]}]};

async function boot(browser, w, opts){
  const ctx = await browser.newContext({viewport: {width: w, height: w < 600 ? 844 : 900}});
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", c => { if (c.type() === "error" && !/net::ERR|CORS|Failed to load resource|supabase-js/.test(c.text())) errs.push("console: " + c.text().slice(0, 200)); });
  await page.addInitScript(stubInit, Object.assign({seed: SEED}, opts));
  // an AI key with consent, and a stand-in for the AI: Start From a Plan asks it for the project's tasks
  await page.addInitScript(() => { try { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } catch (e) {} });
  await ctx.route(/generativelanguage\.googleapis\.com/, route => route.fulfill({status: 200, contentType: "application/json",
    body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(ctx.aiReply || {tasks: []})}]}, finishReason: "STOP"}]})}));
  await page.goto("file://" + file); await page.waitForTimeout(1500);
  return {ctx, page, errs};
}
const act = (page, a) => page.evaluate(a => { const b = document.createElement("button"); b.dataset.act = a; document.body.appendChild(b); b.click(); b.remove(); }, a);
async function openGroup(page, gid){
  await act(page, "grp-page"); await page.waitForSelector(`[data-act="grp-open"][data-id="${gid}"]`); await page.click(`[data-act="grp-open"][data-id="${gid}"]`);
  await page.waitForSelector("#grpDetail"); await page.waitForTimeout(700);
}
const tab = async (page, t) => { await page.click(`[data-act="grp-tab"][data-t="${t}"]`); await page.waitForTimeout(80); };
const tabs = page => page.$$eval(".grp-tabs [role=tab]", e => e.map(x => x.innerText.trim()));
const txt = (page, sel) => page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.innerText.replace(/\s+/g, " ") : ""; }, sel);
const noOverflow = async (page, label) => ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "no horizontal overflow: " + label);
const sheet = (page, sel) => page.waitForSelector("dialog[open] " + sel);

async function studyGroup(browser, w){
  const tag = "study " + w + "px", {ctx, page, errs} = await boot(browser, w, {me: "u1"});
  await openGroup(page, "g1");
  eq(await tabs(page), ["Study", "Sessions", "Challenge", "Chat", "Members"], tag + " tabs");
  ok(/study group/i.test(await txt(page, "#grpHead")) && await page.$("#grpHead.k-study") !== null, tag + " header says Study Group");
  ok(await page.$("#grpOverview") === null || (await page.$eval("#grpOverview", e => e.children.length)) === 0, tag + " no project overview in a study group");
  // Study tab: decks, quizzes, weak spots, Q&A
  ok(await page.isVisible("#grpDecks") && await page.isVisible("#grpQuizzes") && await page.isVisible("#grpWeak") && await page.isVisible("#grpQA"), tag + " Study tab holds decks, quizzes, weak spots and Q&A");
  ok(!(await page.isVisible("#grpChallenge")) && !(await page.isVisible("#grpSessions")), tag + " challenge and sessions are on their own tabs");
  // Q&A
  ok(/Stuck on something/.test(await txt(page, "#grpQA")), tag + " Q&A empty state");
  await page.click('[data-act="grp-q-new"]'); await sheet(page, 'input[name="title"]');
  await page.fill('dialog input[name="title"]', "Why does the Krebs cycle need oxygen?"); await page.fill('dialog textarea[name="body"]', "I thought it never touches O2.");
  await page.click("dialog [data-submit]"); await page.waitForTimeout(300);
  ok(/Krebs cycle/.test(await txt(page, "#grpQA")) && /0 answers/.test(await txt(page, "#grpQA")), tag + " question appears");
  ok(await page.evaluate(() => window.__DB.group_items.some(i => i.kind === "qa" && i.data.body && i.data.solved === false)), tag + " question saved with its details");
  await page.evaluate(() => { const q = window.__DB.group_items.find(i => i.kind === "qa"); window.__DB.group_items.push({id: "a-sam", group_id: "g1", user_id: "u2", author_name: "Sam", kind: "answer", ref_id: q.id, title: "NADH needs it", data: {v: 1, body: "NADH is re-oxidised by the electron transport chain, which needs O2."}, created_at: new Date().toISOString(), updated_at: new Date().toISOString()}); window.__fire("group_items"); });
  await page.waitForTimeout(900);
  ok(/1 answer/.test(await txt(page, "#grpQA")), tag + " a teammate's answer arrives live");
  await page.click('#grpQA [data-act="grp-q-open"]'); await sheet(page, "#gkThread");
  ok(/NADH is re-oxidised/.test(await txt(page, "#gkThread")), tag + " thread shows the answer");
  await page.fill("#gkAnswerIn", "Same question here!"); await page.press("#gkAnswerIn", "Control+Enter").catch(() => {}); await page.click('#gkAnswer button[type="submit"]'); await page.waitForTimeout(300);
  ok(/2 Answers/.test(await txt(page, "#gkThread")), tag + " I can answer too");
  await page.click('[data-act="grp-q-best"][data-a="a-sam"]'); await page.waitForTimeout(250);
  ok(/Best answer/.test(await txt(page, "#gkThread")) && /Solved/.test(await txt(page, "#gkThread")), tag + " best answer marks it solved");
  ok(await page.evaluate(() => { const q = window.__DB.group_items.find(i => i.kind === "qa"); return q.data.solved === true && q.data.best === "a-sam"; }), tag + " saved");
  eq(await page.$$eval("#gkThread .grp-item .grp-item-main span:first-child", e => e[0].innerText.slice(0, 19)), "NADH is re-oxidised", tag + " best answer is listed first");
  await page.screenshot({path: path.join(shots, `gk-study-${w}-thread.png`)});
  await page.keyboard.press("Escape"); await page.waitForTimeout(100);
  ok(/Solved/.test(await txt(page, "#grpQA")), tag + " list shows Solved");
  // Most missed: anonymous
  ok(/Share a deck or a quiz|Share your results/.test(await txt(page, "#grpWeak")) && /Anonymous/.test(await txt(page, "#grpWeak")), tag + " Most Missed explains it is anonymous");
  await page.click('[data-act="grp-weak-on"]'); await page.waitForSelector("dialog[open] .btn.primary, dialog[open] button.danger"); await page.screenshot({path: path.join(shots, `gk-study-${w}-misses-consent.png`)});
  await page.locator("dialog[open] button").filter({hasText: "Share Anonymously"}).click(); await page.waitForTimeout(800);
  const sent = await page.evaluate(() => window.__calls.filter(c => c[1] === "report_misses").map(c => c[2]));
  ok(sent.length >= 1 && sent[0].p_rows.length === 3 && sent[0].p_rows.some(r => r.k === "c:s1" && r.m === 3 && r.t === 3) && sent[0].p_rows.some(r => r.k === "q:qq1" && r.m === 2 && r.t === 2), tag + " my totals per shared card and question were sent: " + JSON.stringify(sent[0] && sent[0].p_rows));
  ok(!/Connor|u1|front|back|stem|Mitochondria/.test(JSON.stringify(sent[0].p_rows)), tag + " the report holds no name and no card text");
  ok(/at least 3 members/.test(await txt(page, "#grpWeak")), tag + " nothing is shown until 3 members take part: " + await txt(page, "#grpWeak"));
  await page.evaluate(() => { const D = window.__DB; ["u2", "u3"].forEach((u, i) => D.group_misses.push({group_id: "g1", item_id: "dk1", mkey: "c:s1", user_id: u, misses: 2 + i, tries: 3}, {group_id: "g1", item_id: "qz1", mkey: "q:qq1", user_id: u, misses: 1, tries: 2}, {group_id: "g1", item_id: "dk1", mkey: "c:s2", user_id: u, misses: i, tries: 3})); window.__fire("group_items"); });
  await page.waitForTimeout(1200);
  const mm = await txt(page, "#grpWeak");
  ok(/card\s+Mitochondria/i.test(mm) && /3 of 3 members miss this/.test(mm) && /question\s+Which organelle makes ATP\?/i.test(mm) && /Answer: Powerhouse of the cell/.test(mm) && /Answer: Mitochondria/.test(mm), tag + " the most-missed card and quiz question are listed: " + mm);
  ok(mm.indexOf("Mitochondria") < mm.indexOf("Which organelle") && !/Ribosome/.test(mm), tag + " most missed first, and a card only one member missed is left out");
  ok(!/Sam|Jo\b|Connor/.test(mm.replace(/Powerhouse/g, "")), tag + " no member is named anywhere in it");
  await page.click('[data-act="grp-weak-deck"]'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => Object.values(window.SBPINPICK.state().decks).some(d => /Most Missed: Bio Squad/.test(d.name) && d.cards.length === 1 && d.cards[0].front === "Mitochondria")), tag + " a deck can be made from the missed cards");
  await page.click('[data-act="grp-weak-off"]'); await page.waitForTimeout(500);
  ok(await page.evaluate(() => !window.__DB.group_misses.some(r => r.user_id === "u1")) && await page.evaluate(() => window.__calls.some(c => c[1] === "forget_misses")), tag + " stopping removes my numbers");
  await noOverflow(page, tag + " study tab");
  await page.screenshot({path: path.join(shots, `gk-study-${w}-study.png`), fullPage: true});
  // Sessions and Challenge tabs
  await tab(page, "sessions"); ok(await page.isVisible("#grpSessions") && /Study Sessions/.test(await txt(page, "#grpSessions")), tag + " Sessions tab");
  await tab(page, "challenge");
  ok(await page.isVisible("#grpChallenge") && await page.isVisible("#grpCheckin"), tag + " Challenge tab holds the weekly challenge and check-in");
  ok(/Quiz Battle/.test(await txt(page, "#grpBattle")) && /Hasn't played yet/.test(await txt(page, "#grpBattle")), tag + " battle lists everyone before anyone has played");
  await page.evaluate(() => { const now = new Date().toISOString(), D = window.__DB;
    D.group_quiz_scores.push({item_id: "qz1", group_id: "g1", user_id: "u2", best_correct: 9, best_total: 10, last_correct: 9, last_total: 10, attempts: 1}, {item_id: "qz1", group_id: "g1", user_id: "u3", best_correct: 6, best_total: 10, last_correct: 6, last_total: 10, attempts: 2});
    window.__fire("group_items"); window.__fire("group_quiz_scores"); });
  await page.waitForTimeout(1200);
  const bt = await txt(page, "#grpBattle"); ok(/Quiz Battle/.test(bt) && bt.indexOf("Sam") < bt.indexOf("Jo") && /90%/.test(bt) && /60%/.test(bt) && /Hasn't played yet/.test(bt), tag + " quiz battle ranks by average best score: " + bt);
  await noOverflow(page, tag + " challenge tab");
  await page.screenshot({path: path.join(shots, `gk-study-${w}-challenge.png`), fullPage: true});
  // creating a group shows what each kind comes with
  await act(page, "grp-back"); await page.waitForSelector("[data-grp-list]"); await act(page, "grp-new"); await sheet(page, ".gk-kind-note");
  ok(/Quiz Battle/.test(await txt(page, "dialog .gk-kind-note:not([hidden])")) && await page.$$eval("dialog .gk-kind-note:not([hidden]) .gk-kind-tabs span", e => e.map(x => x.innerText).join()) === "Study,Sessions,Challenge,Chat,Members", tag + " the study preview lists its tabs");
  await page.click('dialog .grp-kind [data-kind="project"]');
  ok(await page.$$eval("dialog .gk-kind-note:not([hidden]) .gk-kind-tabs span", e => e.map(x => x.innerText).join()) === "Overview,Tasks,Files,Meetings,Chat,Members" && /Create Project/.test(await txt(page, "#grpSave")), tag + " the project preview lists its tabs");
  await page.screenshot({path: path.join(shots, `gk-create-${w}.png`)});
  ok(errs.length === 0, tag + " no page errors " + errs.join(" | "));
  await ctx.close();
}

async function projectGroup(browser, w){
  const tag = "project " + w + "px", {ctx, page, errs} = await boot(browser, w, {me: "u1"});
  await openGroup(page, "g2");
  eq(await tabs(page), ["Overview", "Tasks", "Files", "Meetings", "Chat", "Members"], tag + " tabs");
  ok(await page.$("#grpHead.k-project") !== null && /group project/i.test(await txt(page, "#grpHead")) && /Invite Teammates/.test(await txt(page, "#grpHead")), tag + " header says Group Project");
  ok(await page.evaluate(() => getComputedStyle(document.querySelector("#grpDetail")).getPropertyValue("--gk").trim()) === "#C9702B", tag + " the project has its own accent colour");
  // Overview
  ok(/10 days left/.test(await txt(page, "#grpOverview .gk-hero")), tag + " countdown: " + await txt(page, "#grpOverview .gk-hero"));
  ok(await page.isVisible("#grpOverview") && !(await page.isVisible("#grpDecks")) , tag + " Overview is the first tab");
  ok(/No tasks yet/.test(await txt(page, "#grpOverview")), tag + " empty overview offers a plan");
  await page.click('#grpOverview [data-act="grp-role-set"][data-r="lead"]'); await page.waitForTimeout(300);
  ok(/You're the Lead/.test(await txt(page, "#grpOverview")) && await page.evaluate(() => window.__DB.group_items.some(i => i.kind === "role" && i.user_id === "u1" && i.data.role === "lead")), tag + " I picked Lead");
  await page.click('#grpOverview [data-act="grp-role-set"][data-r="editor"]'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => window.__DB.group_items.filter(i => i.kind === "role").length === 1 && window.__DB.group_items.find(i => i.kind === "role").data.role === "editor"), tag + " changing role updates the one role item");
  ok(/Editor/.test(await txt(page, "#grpOverview .gk-team")), tag + " roles list shows it");
  // Tasks: plan from the due date, then the board
  await tab(page, "tasks");
  ok(await page.isVisible("#grpPT") && /Start From a Plan/.test(await txt(page, "#grpPT")), tag + " Tasks tab offers a plan");
  // the AI suggests six milestones spaced out up to the due date; all are kept
  { const due = await page.evaluate(() => window.__DB.study_groups[1].project_due), back = n => { const d = new Date(due + "T12:00:00"); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
    ctx.aiReply = {tasks: ["Pick the topic", "Find sources", "Write the outline", "Draft the slides", "Rehearse together", "Present"].map((title, i) => ({title, due: back((5 - i) * 2)}))}; }
  await page.click('#grpPT [data-act="grp-pt-plan"]'); await sheet(page, "#gpIdea");
  await page.fill("#gpIdea", "A ten minute poster talk on how warming water bleaches coral reefs."); await page.screenshot({path: path.join(shots, `gk-project-${w}-plan.png`)});
  await page.click("#gpGo"); await sheet(page, "#gpAdd"); ok(await page.locator("dialog [data-gp]").count() === 6, tag + " the plan suggests six tasks to review");
  await page.click("#gpAdd"); await page.waitForTimeout(1200);
  const planTasks = await page.evaluate(() => window.__DB.group_tasks.map(t => [t.title, t.due_at]));
  eq(planTasks.length, 6, tag + " six milestones created"); eq(planTasks[5][1], await page.evaluate(() => window.__DB.study_groups[1].project_due), tag + " the last milestone is the due date");
  ok(planTasks.every((t, i) => !i || t[1] >= planTasks[i - 1][1]), tag + " milestones are in date order");
  // a group project's tasks are always on the board (there is no list view to switch from)
  eq(await page.$$eval("#grpPT .kb-col h4", e => e.map(x => x.innerText.replace(/\s+/g, " "))), ["To Do 6", "In Progress 0", "Done 0"], tag + " board columns");
  // cards change status by being dragged to another column
  const drag = async (card, col) => { const a = await page.locator(card).first().boundingBox(), b = await page.locator(`#grpPT [data-kbcol="${col}"]`).boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
    for (let i = 1; i <= 12; i++) await page.mouse.move(a.x + a.width / 2 + (b.x + b.width / 2 - a.x - a.width / 2) * i / 12, a.y + a.height / 2 + (b.y + Math.min(b.height / 2, 60) - a.y - a.height / 2) * i / 12);
    await page.mouse.up(); await page.waitForTimeout(400); };
  // on a phone the columns stack and the next one is usually off screen, so status is changed in the card's Edit Task sheet there
  const setStatus = async (card, to) => { await page.locator(card + " .pt-title").first().click(); await sheet(page, 'select[name="status"]');
    await page.selectOption('dialog select[name="status"]', to); await page.click("dialog [data-submit]"); await page.waitForTimeout(500); };
  const move = (card, to) => w < 760 ? setStatus(card, to) : drag(card, to);
  await move("#grpPT .k-todo .kb-card", "doing");
  eq(await page.$$eval("#grpPT .kb-col h4", e => e.map(x => x.innerText.replace(/\s+/g, " "))), ["To Do 5", "In Progress 1", "Done 0"], tag + " a card moved to In Progress");
  await move("#grpPT .k-doing .kb-card", "done");
  eq(await page.$$eval("#grpPT .kb-col h4", e => e.map(x => x.innerText.replace(/\s+/g, " "))), ["To Do 5", "In Progress 0", "Done 1"], tag + " and then to Done");
  ok(await page.evaluate(() => window.__DB.group_tasks.filter(t => t.status === "done").length) === 1, tag + " saved to the server");
  await noOverflow(page, tag + " board"); await page.screenshot({path: path.join(shots, `gk-project-${w}-board.png`), fullPage: true});
  await tab(page, "overview");
  ok(/17%/.test(await txt(page, "#grpOverview .gk-hero")) && /1 of 6 tasks done/.test(await txt(page, "#grpOverview .gk-hero")), tag + " overview progress follows the board: " + await txt(page, "#grpOverview .gk-hero"));
  await page.evaluate(() => { const t = window.__DB.group_tasks[2]; t.assignee_id = "u3"; t.due_at = window.__day(-2); window.__fire("group_tasks"); });
  await page.waitForTimeout(1200);
  { const behind = await txt(page, "#grpOverview .gk-behind");
    ok(/Write the outline/.test(behind) && /overdue/.test(behind) && /Jo/.test(behind) && await page.locator("#grpOverview .gk-behind li").count() === 1, tag + " What's Behind lists the late task and Jo: " + behind); }
  await page.screenshot({path: path.join(shots, `gk-project-${w}-overview.png`), fullPage: true});
  // Files and links
  await tab(page, "files"); ok(/Keep everything in one place/.test(await txt(page, "#grpFiles")), tag + " files empty state");
  // the Add File button at the bottom right offers an upload or a link
  await page.click('[data-act="grp-file-new"]:visible'); await sheet(page, '[data-act="grp-link-new"]'); await page.click('dialog [data-act="grp-link-new"]'); await sheet(page, 'input[name="url"]');
  await page.fill('dialog input[name="title"]', "Poster draft"); await page.fill('dialog input[name="url"]', "not a link at all"); await page.click("dialog [data-submit]"); await page.waitForTimeout(150);
  ok(await page.evaluate(() => !window.__DB.group_items.some(i => i.kind === "link")), tag + " a bad link is refused");
  await page.fill('dialog input[name="url"]', "javascript:alert(1)"); await page.click("dialog [data-submit]"); await page.waitForTimeout(150);
  ok(await page.evaluate(() => !window.__DB.group_items.some(i => i.kind === "link")), tag + " a javascript: link is refused");
  await page.fill('dialog input[name="url"]', "https://www.docs.google.com/presentation/d/abc"); await page.fill('dialog input[name="note"]', "Edit access for all"); await page.click("dialog [data-submit]"); await page.waitForTimeout(300);
  ok(/Poster draft/.test(await txt(page, "#grpFiles")) && /docs\.google\.com/.test(await txt(page, "#grpFiles")), tag + " the link is listed with its site");
  eq(await page.$eval('#grpFiles a[href]', a => [a.target, a.rel]), ["_blank", "noopener noreferrer"], tag + " links open safely");
  await page.evaluate(() => window.__DB.group_items.push({id: "evil", group_id: "g2", user_id: "u2", author_name: "Sam", kind: "link", ref_id: "", title: "Sneaky", data: {url: "javascript:alert(1)"}, created_at: new Date().toISOString(), updated_at: new Date().toISOString()}));
  await page.evaluate(() => window.__fire("group_items")); await page.waitForTimeout(900);
  ok(!/Sneaky/.test(await txt(page, "#grpFiles")), tag + " a hostile link from someone else is never shown");
  await noOverflow(page, tag + " files");
  // Meetings: notes become tasks
  await tab(page, "meetings"); ok(await page.isVisible("#grpSessions") && /Meetings/.test(await txt(page, "#grpSessions")) && await page.isVisible("#grpMinutes"), tag + " Meetings tab holds meetings and notes");
  await page.click('[data-act="grp-min-new"]'); await sheet(page, 'input[name="title"]');
  await page.fill('dialog input[name="title"]', "Kickoff call"); await page.fill('dialog textarea[name="decisions"]', "Poster on cell respiration.");
  await page.fill('dialog textarea[name="actions"]', "Sam: book the printer\n- Jo: collect figures\nBuy markers");
  const before = await page.evaluate(() => window.__DB.group_tasks.length);
  await page.click("dialog [data-submit]"); await page.waitForTimeout(1200);
  const added = await page.evaluate(b => window.__DB.group_tasks.slice(b).map(t => [t.title, t.assignee_id]), before);
  eq(added, [["book the printer", "u2"], ["collect figures", "u3"], ["Buy markers", null]], tag + " action items became assigned tasks");
  ok(/Kickoff call/.test(await txt(page, "#grpMinutes")) && /Actions added to Tasks/.test(await txt(page, "#grpMinutes")), tag + " notes are listed");
  await page.click("#grpMinutes summary"); ok(/Poster on cell respiration/.test(await txt(page, "#grpMinutes")), tag + " notes open to show the decisions");
  await noOverflow(page, tag + " meetings"); await page.screenshot({path: path.join(shots, `gk-project-${w}-meetings.png`), fullPage: true});
  // Members: roles (the contribution check-in was removed from group projects)
  await tab(page, "members");
  ok(/Editor/.test(await txt(page, "#grpMembers")), tag + " the member list shows roles");
  ok(await page.locator("#grpPeer, [data-act=\"grp-peer-open\"]").count() === 0 && !/Contribution Check-in/.test(await txt(page, "#grpDetail")), tag + " no contribution check-in");
  await noOverflow(page, tag + " members");
  ok(errs.length === 0, tag + " no page errors " + errs.join(" | "));
  await ctx.close();
}

async function memberView(browser){
  const {ctx, page, errs} = await boot(browser, 1280, {me: "u2", due: 30});
  await openGroup(page, "g2"); await tab(page, "members");
  ok(!/Contribution Check-in/.test(await txt(page, "#grpDetail")), "member: no contribution check-in");
  ok(/Owner|owner/.test(await txt(page, "#grpMembers")), "member: members list");
  await tab(page, "overview"); ok(/30 days left/.test(await txt(page, "#grpOverview .gk-hero")), "member: countdown");
  ok(!/Set a due date/.test(await txt(page, "#grpOverview")), "member: no owner prompts");
  ok(errs.length === 0, "member: no page errors " + errs.join(" | "));
  await ctx.close();
}
async function overdueAndSetup(browser){
  let r = await boot(browser, 1280, {me: "u1", due: -3});
  await openGroup(r.page, "g2");
  ok(/3 days overdue/.test(await txt(r.page, "#grpOverview .gk-hero")) && await r.page.$(".gk-hero.k-overdue") !== null, "overdue project shows the overdue state");
  ok(r.errs.length === 0, "overdue: no page errors " + r.errs.join(" | ")); await r.ctx.close();
  // the new SQL has not been run: nothing breaks, the owner is told once, and adding something says what is missing
  r = await boot(browser, 1280, {me: "u1", kinds: ["deck", "task", "quiz", "event"]});
  await openGroup(r.page, "g2");
  await tab(r.page, "files"); await r.page.click('[data-act="grp-file-new"]:visible'); await sheet(r.page, '[data-act="grp-link-new"]'); await r.page.click('dialog [data-act="grp-link-new"]'); await sheet(r.page, 'input[name="url"]');
  await r.page.fill('dialog input[name="title"]', "x"); await r.page.fill('dialog input[name="url"]', "https://example.com"); await r.page.click("dialog [data-submit]"); await r.page.waitForTimeout(500);
  ok(/groups\.sql|setup|available yet/i.test(await r.page.evaluate(() => document.querySelector("#toast, .toast") ? document.querySelector("#toast, .toast").innerText : document.body.innerText)), "adding a link without the new SQL says what's missing");
  ok(await r.page.isVisible("#grpFiles"), "the page still works");
  await r.ctx.close();
}


async function createProject(browser){
  const {ctx, page, errs} = await boot(browser, 1280, {me: "u1"});
  await act(page, "grp-page"); await page.waitForSelector("[data-grp-list]"); await act(page, "grp-new"); await sheet(page, ".grp-kind");
  await page.click('dialog .grp-kind [data-kind="project"]');
  await page.fill('dialog input[name="name"]', "History Paper"); await page.fill('dialog input[name="due"]', await page.evaluate(() => window.__day(20)));
  await page.click("dialog #grpSave"); await page.waitForSelector("#grpDetail", {timeout: 8000}); await page.waitForTimeout(800);
  eq(await page.evaluate(() => window.__DB.study_groups.find(g => g.name === "History Paper").kind), "project", "creating a group project saves it as a project");
  eq(await tabs(page), ["Overview", "Tasks", "Files", "Meetings", "Chat", "Members"], "and opens with the project tabs: " + (await tabs(page)).join());
  ok(errs.length === 0, "create: no page errors " + errs.join(" | ")); await ctx.close();
}

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    for (const w of [1280, 390]) { await studyGroup(browser, w); await projectGroup(browser, w); }
    await memberView(browser); await overdueAndSetup(browser); await createProject(browser);
  } finally { await browser.close(); }
  console.log(`groupkinds.e2e.js: ${checks} checks passed. Screenshots in ${shots}`);
})().catch(e => { console.error("FAILED:", e.message.split("\n")[0], (e.stack.match(/groupkinds.e2e.js:\d+/g) || []).join(" ")); process.exit(1); });
