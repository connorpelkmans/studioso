// node tests/whiteboard-share.e2e.js  (Playwright + Chromium; the server is an in-memory stand-in)
// Sharing whiteboards: Share a Copy makes a link (share_item, kind "board") with the drawing, text and pictures; opening the link shows the
// board and Save to My Whiteboards adds a copy. Share With a Study Group makes a live board: the board and everything on it go to the
// group's log, new strokes follow in batches, changes from others show up at once (and are saved). A member sees it in the group's Whiteboards
// tab (preview, who has it), adds it, opens it from its preview, sees who has access, and deleting their copy takes them off its list.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, courses: [{id: "c1", name: "Biology", code: "BIO 101", color: "#2E9A5A"}], tasks: [], decks: [], files: [], events: [], settings: {}, updated: 1,
  notes: [{id: "wb1", text: "Cell Cycle", wb: {v: 1, tpl: "grid"}, courseId: "c1", created: 1, updated: 1,
    wbInk: [{id: "s1", t: "pen", c: "blue", w: 70, d: "gHgHgBgB", at: 1}], wbItems: [{id: "t1", k: "t", x: 500, y: 500, s: "G1 -> S -> G2 -> M", c: "red", f: 90, at: 1}]}]};
// The server: share links, plus the group tables, kept in the page (one page per test user) and readable by the test
function fake(opts){
  const DB = window.__DB = {items: [], study_profiles: [{user_id: opts.me, display_name: "Connor"}], study_groups: opts.groups || [], group_members: opts.members || [], group_items: [], group_messages: [], group_blocks: [],
    group_boards: opts.boards || [], group_board_ops: opts.ops || [], group_board_people: opts.people || [], chans: [], calls: []};
  let opId = 100 + (opts.ops || []).length;
  window.__sbShareStub = async (fn, a) => { DB.calls.push(fn);
    if (fn === "share_item") { let i = DB.items.find(x => x.kind === a.p_kind && x.ref_id === a.p_ref); if (!i) { i = {code: "WBRD-000" + (DB.items.length + 1), kind: a.p_kind, ref_id: a.p_ref, saves: 0}; DB.items.push(i); } Object.assign(i, {title: a.p_title, data: a.p_data, updated_at: new Date().toISOString()}); return i.code; }
    if (fn === "my_shared_items") return DB.items.map(i => ({code: i.code, kind: i.kind, ref_id: i.ref_id, title: i.title, updated_at: i.updated_at, saves: 0, hidden: false}));
    if (fn === "get_public_share") { const i = (opts.shared || []).concat(DB.items).find(x => x.code === a.p_code); return i ? [{code: i.code, kind: i.kind, name: i.title, sharer_name: "Maya", card_count: 0, data: i.data, updated_at: i.updated_at, is_mine: false}] : []; }
    if (fn === "my_username") return "connor";
    if (fn === "my_age") return 20;
    return null; };
  const mk = t => {
    const st = {f: [], op: "select", one: false, rows: null, lim: 0, gt: null};
    const run = async () => {
      await new Promise(r => setTimeout(r, 5));
      if (st.op === "delete") { const keep = (DB[t] || []).filter(r => !st.f.every(f => f(r))); const n0 = (DB[t] || []).length; DB[t] = keep; return {data: null, error: null, count: n0 - keep.length}; }
      if (st.op === "upsert") { const r = Object.assign({user_id: opts.me, added_at: new Date().toISOString()}, st.rows); if (!(DB[t] || []).some(x => x.board_id === r.board_id && x.user_id === r.user_id)) DB[t].push(r); return {data: null, error: null}; }
      if (st.op === "insert") {
        const rows = (Array.isArray(st.rows) ? st.rows : [st.rows]).map(r => { const o = Object.assign({}, r); if (t === "group_board_ops") { o.id = ++opId; o.user_id = opts.me; } if (t === "group_boards") { o.id = o.id || "b" + (DB.group_boards.length + 1); o.deleted = false; o.created_by = opts.me; } return o; });
        DB[t].push(...rows); return {data: st.one ? rows[0] : rows, error: null};
      }
      let rows = (DB[t] || []).filter(r => st.f.every(f => f(r)));
      if (st.lim) rows = rows.slice(0, st.lim);
      return {data: st.one ? rows[0] || null : rows, error: null};
    };
    const api = {select() { return api; }, eq(c, v) { st.f.push(r => r[c] === v); return api; }, neq(c, v) { st.f.push(r => r[c] !== v); return api; }, gt(c, v) { st.f.push(r => r[c] > v); return api; }, in(c, v) { st.f.push(r => v.includes(r[c])); return api; },
      order() { return api; }, limit(k) { st.lim = k; return api; }, gte() { return api; }, or() { return api; }, maybeSingle() { st.one = true; return api; }, single() { st.one = true; return api; },
      insert(r) { st.op = "insert"; st.rows = r; return api; }, upsert(r) { st.op = "upsert"; st.rows = r; return api; }, update() { st.op = "update"; return api; }, delete() { st.op = "delete"; return api; },
      then(res, rej) { return run().then(res, rej); }};
    return api;
  };
  const client = {from: mk, rpc: async (fn, a) => { if (fn === "group_board_preview") { const b = DB.group_boards.find(x => x.id === a.p_board); if (b) { b.preview = a.p_preview; b.preview_dark = a.p_dark || null; } DB.calls.push(fn); return {data: null, error: null}; }
      return {data: fn === "my_username" ? "connor" : fn === "my_age" ? 20 : null, error: null}; }, removeChannel(c) { c.closed = true; },
    channel: name => { const c = {name, subs: [], on(ev, f, cb) { c.subs.push({f, cb}); return c; }, subscribe(cb) { if (cb) cb("SUBSCRIBED"); return c; }}; DB.chans.push(c); return c; }};
  window.__sbGroupsStub = {user: {id: opts.me, email: opts.me + "@x.com"}, client};
  window.__SB_TEST = true;
  try {
    localStorage.setItem("sb:grpName:" + opts.me, "Connor"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
    if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(opts.seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:notesView", "wb"); }
  } catch (e) {}
}
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const boot = async opts => {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, serviceWorkers: "block"});
    await ctx.route(/supabase\.co|googleapis\.com/, r => r.abort());
    await ctx.addInitScript(fake, opts);
    const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.__sbSync && window.SBWB && SBWB.share && window.SBSHARE);
    await page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); const b = document.querySelector('nav.tabs [data-tab="notes"]'); b && b.click(); });
    await page.waitForTimeout(600);
    return {ctx, page};
  };
  const S = page => page.evaluate(() => JSON.parse(JSON.stringify(window.__sbSync.state)));
  const act = (page, a, id) => page.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || ""]);
  try {
    let sharedRow;
    { // share a copy
      const {ctx, page} = await boot({me: "u1", seed: SEED, groups: [{id: "g1", name: "Bio Squad"}]});
      await act(page, "wb-opts"); await page.waitForSelector('dialog[open] [data-act="wb-share-copy"]');
      ok(await page.locator('dialog[open] [data-act="wb-share-group"]').count() === 1, "Board Options has Share a Copy and Share With a Study Group");
      await page.click('dialog[open] [data-act="wb-share-copy"]'); await page.waitForSelector("dialog[open] #shMake");
      ok(/Share Whiteboard/.test(await page.locator("dialog[open] h2").textContent()) && /see it/.test(await page.locator("dialog[open]").textContent()), "Share a Copy opens Share Whiteboard");
      await page.click("dialog[open] #shMake"); await page.waitForSelector("dialog[open] #shLinkIn, dialog[open] .grp-code-big");
      sharedRow = await page.evaluate(() => __DB.items[0]);
      ok(sharedRow.kind === "board" && sharedRow.ref_id === "wb1" && sharedRow.title === "Cell Cycle" && sharedRow.data.ink.length === 1 && sharedRow.data.items[0].s === "G1 -> S -> G2 -> M" && sharedRow.data.tpl === "grid" && sharedRow.data.course.code === "BIO 101",
        "the link holds the board: its drawing, text, template and course");
      ok(await page.locator("dialog[open] .grp-code-big").textContent() === "WBRD-0001", "and shows the code to send");
      ok(((await S(page)).notes.wb1 || Object.values((await S(page)).notes).find(x => x.id === "wb1")).shared.code === "WBRD-0001", "the board remembers it's shared");
      await page.keyboard.press("Escape");

      // share live with a group
      await act(page, "wb-share-group", "wb1"); await page.waitForSelector("dialog[open] [data-submit]");
      ok(/Bio Squad/.test(await page.locator("dialog[open]").textContent()), "Share With a Study Group lists your groups");
      await page.click("dialog[open] [data-submit]"); await page.waitForTimeout(600);
      const db = await page.evaluate(() => ({boards: __DB.group_boards, ops: __DB.group_board_ops}));
      ok(db.boards.length === 1 && db.boards[0].group_id === "g1" && db.boards[0].name === "Cell Cycle" && db.boards[0].tpl === "grid", "it makes the group's board");
      const sentIds = db.ops.flatMap(o => o.ch.map(c => c.t + c.id)).sort();
      ok(db.ops.length >= 1 && JSON.stringify(sentIds) === JSON.stringify(["is1".replace("is1", "it1"), "ss1"].sort()) && db.ops.every(o => o.board_id === "b1" && o.group_id === "g1" && o.tag), "and sends what's already on it: " + sentIds.join(", "));
      const st = await S(page), wb = Object.values(st.notes).find(x => x.id === "wb1");
      ok(wb.wb.g && wb.wb.g.bid === "b1" && wb.wb.g.gn === "Bio Squad" && await page.locator(".wb-livechip.on").count() === 1 && /Live with Bio Squad/.test(await page.locator(".wb-livechip").textContent()), "the board shows Live with Bio Squad");
      await page.waitForTimeout(700);
      ok(await page.evaluate(() => __DB.group_board_people.some(r => r.board_id === "b1" && r.user_id === "u1") && __DB.calls.includes("group_board_preview") && /^data:image\/jpeg/.test(__DB.group_boards[0].preview || "")), "sharing puts you on its list and sends a preview picture for the group's Whiteboards tab");
      const lum = await page.evaluate(async () => { const b = __DB.group_boards[0], m = async u => { if (!u) return -1; const im = new Image(); im.src = u; await im.decode(); const c = document.createElement("canvas"); c.width = 20; c.height = 20; const x = c.getContext("2d"); x.drawImage(im, 0, 0, 20, 20); const d = x.getImageData(0, 0, 20, 20).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2]; return s / (d.length / 4) / 3; }; return [await m(b.preview), await m(b.preview_dark)]; });
      ok(lum[0] > 180 && lum[1] >= 0 && lum[1] < 90, "it sends a light preview and a dark one (for members whose whiteboards are dark): " + lum.map(Math.round));
      // draw: a batch goes out
      const F = await page.evaluate(() => { const r = document.querySelector(".wb-frame").getBoundingClientRect(); return {x: r.left, y: r.top}; });
      await page.evaluate(() => SBWB.setTool("pen"));
      await page.mouse.move(F.x + 200, F.y + 200); await page.mouse.down(); await page.mouse.move(F.x + 320, F.y + 260, {steps: 6}); await page.mouse.up(); await page.waitForTimeout(500);
      const ops2 = await page.evaluate(() => __DB.group_board_ops);
      ok(ops2.length === db.ops.length + 1 && ops2[ops2.length - 1].ch.length === 1 && ops2[ops2.length - 1].ch[0].t === "s" && ops2[ops2.length - 1].ch[0].v.c, "a new stroke is sent to the group a moment later");
      // someone else draws and erases: it shows at once
      const before = (await page.evaluate(() => SBWB.board().strokes.length));
      await page.evaluate(() => { const ch = __DB.chans.find(c => /^sbwb-b1-/.test(c.name) && !c.closed); const row = {id: 900, board_id: "b1", group_id: "g1", user_id: "u2", tag: "other", ch: [{t: "s", id: "r1", v: {id: "r1", t: "pen", c: "green", w: 90, d: "oPoPgBgB", at: 2}}, {t: "s", id: "s1", v: null}, {t: "i", id: "evil", v: {k: "t", x: 1, y: 1, s: "<img src=x onerror=alert(1)>", c: "<b>", f: 50}}]};
        __DB.group_board_ops.push(row); ch.subs.forEach(s => s.cb({new: row})); });
      await page.waitForTimeout(200);
      const L1 = await page.evaluate(() => SBWB.board());
      ok(L1.strokes.length === before && L1.strokes.some(s => s.id === "r1" && s.c === "green") && !L1.strokes.some(s => s.id === "s1"), "a stroke someone else added shows up, and one they erased goes away");
      const evil = L1.items.find(i => i.id === "evil");
      ok(evil && evil.c === "ink" && await page.locator(".wb-t img").count() === 0 && (await page.locator('.wb-t[data-id="evil"]').textContent()).includes("<img"), "their text is checked like any saved text (shown as text, unknown colour made black)");
      ok(await page.evaluate(() => __DB.group_board_ops.length) === ops2.length + 1, "changes from others aren't sent back out");
      // our own echo is ignored
      await page.evaluate(() => { const ch = __DB.chans.find(c => /^sbwb-b1-/.test(c.name) && !c.closed); const mine = __DB.group_board_ops.find(o => o.user_id === "u1" && o.ch.some(c => c.t === "s")); const echo = Object.assign({}, mine, {id: 950}); ch.subs.forEach(s => s.cb({new: echo})); });
      ok(true, "an echo of our own change is skipped (same tag)");
      await page.evaluate(() => SBWB.flush()); await page.waitForTimeout(100);
      const saved = Object.values((await S(page)).notes).find(x => x.id === "wb1");
      ok(saved.wbInk.some(s => s.id === "r1") && !saved.wbInk.some(s => s.id === "s1"), "what others did is saved in your copy");
      ok(!page.errs.length, "no page errors: " + page.errs.join(" | "));
      await ctx.close();
    }
    { // another member: the group board arrives on its own; a shared link opens and saves a copy
      const seed2 = Object.assign({}, SEED, {notes: []});
      const ops = [{id: 101, board_id: "b9", group_id: "g1", user_id: "u1", tag: "x", ch: [{t: "s", id: "a1", v: {id: "a1", t: "pen", c: "red", w: 70, d: "gHgHgBgB", at: 1}}]},
        {id: 102, board_id: "b9", group_id: "g1", user_id: "u1", tag: "x", ch: [{t: "i", id: "a2", v: {id: "a2", k: "t", x: 100, y: 100, s: "Hello group", c: "blue", f: 60, at: 1}}]}];
      const {ctx, page} = await boot({me: "u2", seed: seed2, groups: [{id: "g1", name: "Bio Squad"}], boards: [{id: "b9", group_id: "g1", name: "Group Brainstorm", tpl: "concept", deleted: false, created_by: "u1", preview: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="}], ops,
        people: [{board_id: "b9", group_id: "g1", user_id: "u1"}], members: [{group_id: "g1", user_id: "u1", role: "owner", display_name: "Maya", joined_at: "2026-01-01"}, {group_id: "g1", user_id: "u2", role: "member", display_name: "Connor", joined_at: "2026-01-02"}],
        shared: [Object.assign({}, sharedRow, {code: "WBRD-0001"})]});
      await page.waitForTimeout(800);
      let st = await S(page);
      ok(!Object.values(st.notes).some(x => x.wb && x.wb.g && x.wb.g.bid === "b9"), "a group's board doesn't arrive by itself: the member chooses to add it");
      // the group's Whiteboards tab: a preview, who has it, Add to My Whiteboards
      await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "grp-page"; document.body.appendChild(b); b.click(); b.remove(); });
      await page.waitForSelector('[data-act="grp-open"][data-id="g1"]'); await page.click('[data-act="grp-open"][data-id="g1"]'); await page.waitForSelector("#grpDetail"); await page.waitForTimeout(400);
      ok(await page.locator('[data-act="grp-tab"][data-t="boards"]').count() === 1, "study groups have a Whiteboards tab");
      await page.click('[data-act="grp-tab"][data-t="boards"]'); await page.waitForSelector(".wbg-card"); 
      ok(/Group Brainstorm/.test(await page.locator(".wbg-card").textContent()) && /Maya has it/.test(await page.locator(".wbg-card .wbg-who").textContent()) && await page.locator('.wbg-card img[src^="data:image/png"]').count() === 1, "it lists the shared board with its preview and who has it: " + await page.locator(".wbg-card .wbg-who").textContent());
      ok(await page.locator(".wbg-card .wbg-avs .wbg-face .grp-av").count() >= 1 && await page.locator(".wbg-card .wbg-avs .wbg-av").count() === 0, "who has it shows each member's picture as the group does (companion or initials), not a plain letter");
      await page.locator(".wbg-card").screenshot({path: "tests-out/wbg-card.png"});
      // dark whiteboards show the dark preview (when the board has one)
      await page.evaluate(() => { __DB.group_boards.find(b => b.id === "b9").preview_dark = "data:image/jpeg;base64,QUJD"; });
      await page.emulateMedia({colorScheme: "dark"}); await page.waitForTimeout(300);
      const darkSrc = await page.evaluate(() => (document.querySelector(".wbg-card img") || {}).getAttribute && document.querySelector(".wbg-card img").getAttribute("src"));
      ok(darkSrc === "data:image/jpeg;base64,QUJD", "with dark whiteboards, the group's tab shows the board's dark preview");
      await page.emulateMedia({colorScheme: "light"}); await page.waitForTimeout(300);
      ok(/^data:image\/png/.test(await page.locator(".wbg-card img").getAttribute("src")), "and the light one again in light mode");
      await page.click('.wbg-card [data-act="grp-wb-add"]'); await page.waitForTimeout(600);
      st = await S(page); let gb = Object.values(st.notes).find(x => x.wb && x.wb.g && x.wb.g.bid === "b9");
      ok(gb && gb.text === "Group Brainstorm" && gb.wb.tpl === "concept" && gb.wb.g.gn === "Bio Squad" && (gb.wbInk || []).length === 1 && (gb.wbItems || [])[0].s === "Hello group", "Add to My Whiteboards adds it, with everything drawn on it so far");
      ok(await page.evaluate(() => __DB.group_board_people.some(r => r.board_id === "b9" && r.user_id === "u2")) && /You and Maya have it/.test(await page.locator(".wbg-card .wbg-who").textContent()) && await page.locator('.wbg-card [data-act="grp-wb-open"].btn').count() === 1, "it records that you have it, and the card says so");
      // tapping the preview opens it in Whiteboard
      await page.click(".wbg-card .wbg-pv"); await page.waitForTimeout(500);
      ok(await page.evaluate(id => SBWB.on() && SBWB.curId() === id, gb.id), "tapping its preview opens it in your Whiteboard tab");
      ok(/Live with Bio Squad · 2 people/.test(await page.locator(".wb-livechip").textContent()), "the board shows who has it: " + await page.locator(".wb-livechip").textContent());
      await page.click(".wb-livechip"); await page.waitForSelector("dialog[open] .wbg-people li");
      ok(await page.locator("dialog[open] .wbg-people li").count() === 2 && /Maya/.test(await page.locator("dialog[open] .wbg-people").textContent()), "its panel lists who has access");
      await page.keyboard.press("Escape"); await page.waitForTimeout(150);
      // after a reload, straight to the board (the group page not opened): the panel still names people, not "A member"
      await page.reload(); await page.waitForTimeout(1500);
      await page.evaluate(id => SBWB.open(id), gb.id); await page.waitForSelector(".wb-livechip"); await page.waitForTimeout(400);
      await page.click(".wb-livechip"); await page.waitForSelector("dialog[open] .wbg-people li");
      const ppl = await page.locator("dialog[open] .wbg-people").textContent();
      ok(/Maya/.test(ppl) && !/A member/.test(ppl), "after a reload it names everyone who has it: " + ppl.trim().replace(/\s+/g, " "));
      await page.keyboard.press("Escape"); await page.waitForTimeout(150);
      // delete your copy: you're off its list, and it doesn't come back
      await act(page, "wb-opts"); await page.click('dialog[open] [data-wbo="del"]'); await page.click("dialog[open] [data-submit]"); await page.waitForTimeout(400);
      st = await S(page);
      ok(!Object.values(st.notes).some(x => x.wb && x.wb.g && x.wb.g.bid === "b9") && (st.settings.wbGone || []).includes("b9") && await page.evaluate(() => !__DB.group_board_people.some(r => r.board_id === "b9" && r.user_id === "u2")), "deleting your copy removes it for you and takes you off its list");
      // open the shared link
      await page.evaluate(() => SBSHARE.open("WBRD-0001")); await page.waitForSelector("dialog[open] #wbShSave");
      await page.waitForFunction(() => { const i = document.getElementById("wbShImg"); return i && i.naturalWidth > 0; });
      ok(/Shared Whiteboard/.test(await page.locator("dialog[open] h2").textContent()) && /Cell Cycle/.test(await page.locator("dialog[open]").textContent()), "a shared board's link shows its name and a picture of it");
      await page.click("#wbShSave"); await page.waitForTimeout(400);
      st = await S(page);
      const cp = Object.values(st.notes).find(x => x.wb && x.sharedFrom && x.sharedFrom.code === "WBRD-0001");
      ok(cp && cp.text === "Cell Cycle" && cp.courseId === "c1" && cp.wbInk.length === 1 && cp.wbItems[0].s === "G1 -> S -> G2 -> M" && await page.evaluate(id => SBWB.curId() === id && SBWB.on(), cp.id), "Save to My Whiteboards adds the copy (in the matching course) and opens it");
      ok(!page.errs.length, "no page errors (member): " + page.errs.join(" | "));
      await ctx.close();
    }
    console.log(`whiteboard-share.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
