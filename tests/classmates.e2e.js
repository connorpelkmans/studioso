// Browser checks for Classmates and Course Hubs (supabase-classmates.sql, src/js/96-classmates.js)
const path = require("path"), fs = require("fs"), assert = require("assert");
const file = path.resolve(__dirname, "..", "index.html");
const shots = path.resolve(process.argv[2] || path.join(__dirname, "..", "tests-out"));
fs.mkdirSync(shots, {recursive: true});
const {chromium, executablePath} = require("./pw");
let checks = 0; const ok = (c, m) => { checks++; assert(c, m); };

// A stand-in server: Study Groups tables plus the Classmates functions
function stubInit(opts){
  const me = {id: "u1", email: "u1@x.com"};
  const DB = {visible: !!opts.visible, band: opts.band === undefined ? "adult" : opts.band, sent: null, others: {cv_math: [{user_id: "u2", name: "Sam"}, {user_id: "u3", name: "Jo"}]},
    study_groups: [], group_members: [], group_items: [], group_messages: [], study_profiles: [{user_id: "u1", display_name: "Connor"}], group_blocks: []};
  window.__DB = DB; window.__calls = [];
  const wait = v => new Promise(r => setTimeout(() => r(v), 15));
  const E = m => ({error: {message: m}});
  const mk = t => {
    const st = {f: [], one: false, op: "select", payload: null};
    const run = () => { const rows = DB[t] || [], hit = rows.filter(r => st.f.every(f => f(r)));
      if (st.op === "delete") { DB[t] = rows.filter(r => !hit.includes(r)); return wait({data: null}); }
      if (st.op === "insert") { [].concat(st.payload).forEach(r => rows.push(r)); return wait({data: st.payload}); }
      return wait({data: st.one ? hit[0] || null : hit}); };
    const api = {select() { return api; }, eq(c, v) { st.f.push(r => r[c] === v); return api; }, neq() { return api; }, in(c, v) { st.f.push(r => v.includes(r[c])); return api; }, gte() { return api; }, gt() { return api; },
      or() { return api; }, order() { return api; }, limit() { return api; }, maybeSingle() { st.one = true; return run(); }, single() { st.one = true; return run(); },
      insert(r) { st.op = "insert"; st.payload = r; return api; }, upsert(r) { st.op = "insert"; st.payload = r; return api; }, update() { return api; }, delete() { st.op = "delete"; return api; }, then(a, b) { return run().then(a, b); }};
    return api;
  };
  const rows = () => (DB.sent || []).map(c => { const o = DB.others[c.ref] || [], h = DB.study_groups.find(g => g.course_ref === c.ref);
    return {ref: c.ref, label: c.label, classmates: o.length, hub_id: h ? h.id : null, in_hub: !!h && DB.group_members.some(m => m.group_id === h.id && m.user_id === "u1"), hub_members: h ? DB.group_members.filter(m => m.group_id === h.id).length : 0}; });
  const rpc = {
    classmates_me() { return {data: {visible: DB.visible, band: DB.band}}; },
    classmates_set_visible(a) { if (a.p_on && !DB.band) return E("SB_AGE_NEEDED: Add your birthday first."); DB.visible = !!a.p_on; if (!a.p_on) DB.sent = null; return {data: DB.visible}; },
    classmates_sync(a) { if (!DB.visible) return {data: 0}; DB.sent = a.p_courses; return {data: a.p_courses.length}; },
    classmates_summary() { return {data: DB.visible ? rows() : []}; },
    classmates_list(a) { return {data: DB.visible ? DB.others[a.p_ref] || [] : []}; },
    classmates_join_hub(a) {
      const c = (DB.sent || []).find(x => x.ref === a.p_ref); if (!c) return E("SB_CM_COURSE: That course isn't synced from your school site yet.");
      let g = DB.study_groups.find(x => x.course_ref === a.p_ref);
      if (!g) { g = {id: "hub1", name: c.label, course: c.label, owner_id: "u1", invite_code: "HUBC-ODE1", created_at: "2026-01-01", weekly_goal: 0, kind: "course", project_due: null, course_ref: a.p_ref, deleted_at: null}; DB.study_groups.push(g);
        DB.group_members.push({group_id: "hub1", user_id: "u2", role: "member", display_name: "Sam", joined_at: "2026-01-01"}); }
      if (!DB.group_members.some(m => m.group_id === g.id && m.user_id === "u1")) DB.group_members.push({group_id: g.id, user_id: "u1", role: "member", display_name: "Connor", joined_at: "2026-01-02"});
      return {data: g.id};
    }
  };
  const client = {from: mk, rpc: (name, a) => { window.__calls.push([name, a]); if (opts.noServer && /^classmates_/.test(name)) return wait({error: {code: "PGRST202", message: "Could not find the function public." + name + " in the schema cache"}}); return wait(rpc[name] ? rpc[name](a) : {data: null}); },
    channel: name => { const c = {name, on() { return c; }, subscribe() { return c; }}; return c; }, removeChannel() {}};
  window.__sbGroupsStub = {user: me, client};
  const seed = {v: 2, updated: 1, tasks: [], notes: [], decks: [], settings: {capacity: 15, dailyHours: 3}, courses: [
    {id: "cv_math", name: "Calculus I", code: "MATH 101", color: "#3B6FE0", cv: {ou: 48213}, links: [{label: "Canvas", url: "https://canvas.test.edu/courses/48213"}]},
    {id: "c_piano", name: "Piano", code: "MUS 1", color: "#E0663B", links: []}]};
  try {
    localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1");
    localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("sb:grpName:u1", "Connor");
    if (opts.asked) localStorage.setItem("studyboard:cm:asked:u1", "1");
  } catch (e) {}
}

async function boot(browser, opts){
  const ctx = await browser.newContext({viewport: {width: opts.w || 1280, height: 900}});
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", c => { if (c.type() === "error" && !/net::ERR|CORS|Failed to load resource|supabase-js/.test(c.text())) errs.push("console: " + c.text().slice(0, 200)); });
  await page.addInitScript(stubInit, opts);
  await page.goto("file://" + file); await page.waitForTimeout(1200);
  return {ctx, page, errs};
}
const openCourse = (page, id) => page.evaluate(id => { const B = window.__sbBreakdown; B.ui.tab = "courses"; B.ui.courseId = id; B.render(); }, id);
const txt = async (page, sel) => ((await page.textContent(sel).catch(() => "")) || "").replace(/\s+/g, " ").trim();
const settle = async (page, sel, ms) => { await page.waitForSelector(sel, {timeout: ms || 6000}); await page.waitForTimeout(150); };
const refresh = page => page.evaluate(() => window.SBMATES.refresh());

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    // 1. Off: the course page offers it; a course added by hand shows nothing
    let {ctx, page, errs} = await boot(browser, {asked: true});
    await openCourse(page, "cv_math"); await refresh(page); await openCourse(page, "cv_math");
    await settle(page, ".mates-card");
    ok(/See which classmates in MATH 101 use Studyboard/.test(await txt(page, ".mates-card")), "off: the card offers Classmates");
    ok(!(await page.evaluate(() => window.__calls.some(c => c[0] === "classmates_sync"))), "off: no course list is sent");
    await openCourse(page, "c_piano"); await page.waitForTimeout(300);
    ok(await page.locator(".mates-card").count() === 0, "a course added by hand has no Classmates card");

    // 2. Turning it on explains what's shared, then sends only synced courses
    await openCourse(page, "cv_math"); await settle(page, '.mates-card [data-act="mates-on"]');
    await page.click('.mates-card [data-act="mates-on"]'); await settle(page, "dialog[open] .mates-sheet");
    const sheetText = await txt(page, "dialog[open]");
    ok(/Only people who turn it on/.test(sheetText) && /Same age group only/.test(sheetText) && /Off anytime/.test(sheetText), "the sheet says who sees what");
    ok(/Connor/.test(sheetText), "the sheet shows the name classmates will see");
    await page.screenshot({path: shots + "/cm-optin.png"});
    await page.click("#cmOnGo"); await page.waitForTimeout(800);
    const sent = await page.evaluate(() => window.__DB.sent);
    ok(Array.isArray(sent) && sent.length === 1 && sent[0].ref === "cv_math" && sent[0].origin === "https://canvas.test.edu" && sent[0].ou === "48213" && sent[0].platform === "cv", "only the synced course is sent: " + JSON.stringify(sent));
    await openCourse(page, "cv_math"); await settle(page, '.mates-card [data-act="mates-who"]');
    ok(/2 classmates use Studyboard/.test(await txt(page, ".mates-card")), "the card counts classmates");
    ok(/Start the Course Hub/.test(await txt(page, ".mates-card")), "no hub yet: Start the Course Hub");
    await page.screenshot({path: shots + "/mates-card.png"});

    // 3. See Who lists names
    await page.click('.mates-card [data-act="mates-who"]'); await settle(page, "dialog[open] .mates-list");
    ok(/Sam/.test(await txt(page, "dialog[open]")) && /Jo/.test(await txt(page, "dialog[open]")), "See Who lists the classmates");
    await page.keyboard.press("Escape"); await page.waitForTimeout(300);

    // 4. Joining opens the hub as a Course Hub, with no invite or edit buttons
    await page.click('.mates-card [data-act="mates-hub-join"]'); await page.waitForTimeout(1500);
    ok(await page.evaluate(() => window.__DB.group_members.some(m => m.group_id === "hub1" && m.user_id === "u1")), "joining adds you to the hub");
    await page.waitForSelector("#grpHead", {timeout: 6000});
    const headTxt = await txt(page, "#grpHead");
    ok(/Course Hub/.test(headTxt), "the group page says Course Hub: " + headTxt);
    ok(await page.locator('#grpHead [data-act="grp-invite"]').count() === 0, "a hub has no invite button");
    ok(await page.locator('#grpHead [data-act="grp-edit"]').count() === 0, "whoever started the hub can't edit it");
    ok(await page.locator('#grpHead [data-act="grp-leave"]').count() === 1, "everyone can leave a hub");
    await page.screenshot({path: shots + "/cm-hub.png"});
    await openCourse(page, "cv_math"); await refresh(page); await openCourse(page, "cv_math"); await settle(page, '.mates-card [data-act="mates-hub-open"]');
    ok(/Course Hub has 2 members/.test(await txt(page, ".mates-card")), "back on the course: Open Course Hub, with its members");

    // 5. Settings turns it off and the list is removed
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "mates-settings"; document.body.appendChild(b); b.click(); b.remove(); });
    await settle(page, "dialog[open] #cmOff");
    await page.click("#cmOff"); await page.waitForTimeout(600);
    ok(await page.evaluate(() => !window.__DB.visible && window.__DB.sent === null), "Turn Off tells the server");
    await openCourse(page, "cv_math"); await settle(page, '.mates-card [data-act="mates-on"]');
    ok(true, "off again: the card offers it again");
    ok(errs.length === 0, "no page errors: " + errs.join(" | "));
    await ctx.close();

    // 6. Once per account, an offer after a sync brings in courses
    ({ctx, page, errs} = await boot(browser, {}));
    await refresh(page); await page.waitForTimeout(400);
    ok(/See which classmates use Studyboard/.test(await txt(page, ".toast, #toast")), "a one-time offer appears");
    ok(await page.evaluate(() => localStorage.getItem("studyboard:cm:asked:u1") === "1"), "and is remembered");
    await ctx.close();

    // 7. No birthday: turning on doesn't go through
    ({ctx, page, errs} = await boot(browser, {asked: true, band: null}));
    await page.evaluate(() => { window.SBUNAME = Object.assign({}, window.SBUNAME, {ageReady: () => Promise.resolve(true)}); });
    await openCourse(page, "cv_math"); await refresh(page); await openCourse(page, "cv_math"); await settle(page, '.mates-card [data-act="mates-on"]');
    await page.click('.mates-card [data-act="mates-on"]'); await settle(page, "#cmOnGo"); await page.click("#cmOnGo"); await page.waitForTimeout(600);
    ok(await page.evaluate(() => !window.__DB.visible), "without a birthday it stays off");
    ok(/birthday/i.test(await txt(page, ".toast, #toast")), "and says to add a birthday");
    await ctx.close();

    // 8. A server without supabase-classmates.sql: no card, no errors
    ({ctx, page, errs} = await boot(browser, {asked: true, noServer: true}));
    await openCourse(page, "cv_math"); await refresh(page); await openCourse(page, "cv_math"); await page.waitForTimeout(400);
    ok(await page.locator(".mates-card").count() === 0, "no server setup: no card");
    ok(errs.length === 0, "no server setup: no page errors " + errs.join(" | "));
    await ctx.close();

    // 9. Phone width: the card fits
    ({ctx, page, errs} = await boot(browser, {asked: true, visible: true, w: 390}));
    await refresh(page); await openCourse(page, "cv_math"); await settle(page, ".mates-card .row-actions");
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "no sideways scroll on a phone");
    await page.screenshot({path: shots + "/cm-phone.png"});
    await ctx.close();
  } finally { await browser.close(); }
  console.log(`classmates e2e: ${checks} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
