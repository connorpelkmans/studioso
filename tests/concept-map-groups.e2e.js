// node tests/concept-map-groups.e2e.js
// Live concept maps in study groups, like live whiteboards: two members (two browsers) share one server, kept here in Node with
// the group rules (members only) and live updates (each change reaches the other browser like Supabase realtime would).
// Sharing from the map's ⋯ menu (the sharer's own notes stay private), adding from the group's tab (with its preview), both
// editing at once (both edits survive), who's here and who just changed what, Undo of your own step only, offline, a picture
// (with the rights check), Export, leaving the group, and the same for a free account.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert"), zlib = require("zlib");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const SHOTS = process.env.CMG_SHOTS || "";
let FREE = false;
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", FREE ? "const PRO_ENFORCED = true;" : "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
function png(w, h, rgb){
  const crcT = []; for (let i = 0; i < 256; i++) { let c = i; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcT[i] = c >>> 0; }
  const crc = b => { let c = 0xFFFFFFFF; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.set(rgb, y * (w * 3 + 1) + 1 + x * 3);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ih), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

/* The server: tables, the group rules, and live updates */
function newDB(){
  return {study_groups: [{id: "g1", name: "Bio Squad", owner_id: "u1", invite_code: "ABCD-EFGH", course: "BIO 101", kind: "study", created_at: "2026-01-01T00:00:00Z"}],
    group_members: [{group_id: "g1", user_id: "u1", role: "owner", display_name: "Connor", joined_at: "2026-01-01T00:00:00Z"}, {group_id: "g1", user_id: "u2", role: "member", display_name: "Maya", joined_at: "2026-01-02T00:00:00Z"}],
    study_profiles: [{user_id: "u1", display_name: "Connor"}, {user_id: "u2", display_name: "Maya"}],
    group_maps: [], group_map_ops: [], group_map_people: [], rpc: []};
}
let DB = newDB(), opId = 0, hold = false, held = [];
const pages = new Set();
const member = (gid, u) => DB.group_members.some(m => m.group_id === gid && m.user_id === u);
const GROUPED = new Set(["group_maps", "group_map_ops", "group_map_people", "group_members", "group_items", "group_messages", "group_boards", "group_board_people", "group_board_ops"]);
async function deliver(row){ for (const p of pages) { try { await p.evaluate(r => (window.__chans || []).filter(c => !c.closed).forEach(c => c.subs.forEach(s => { if (s.f && s.f.table === "group_map_ops" && s.f.filter === "map_id=eq." + r.map_id) s.cb({new: r}); })), row); } catch (e) {} } }
async function release(){ hold = false; const l = held.splice(0); for (const r of l) await deliver(r); }
async function serve(me, req){
  const t = req.t, rows0 = DB[t] || [];
  const pass = r => (req.f || []).every(([k, c, v]) => k === "eq" ? r[c] === v : k === "neq" ? r[c] !== v : k === "gt" ? (typeof v === "number" ? r[c] > v : String(r[c] || "") > String(v)) : k === "in" ? v.includes(r[c]) : true);
  const visible = r => t === "study_groups" ? member(r.id, me) : GROUPED.has(t) ? member(r.group_id, me) : true;
  if (req.op === "insert" || req.op === "upsert") {
    const out = [];
    for (const r0 of [].concat(req.rows)) {
      const r = Object.assign({}, r0);
      if (!member(r.group_id, me)) return {error: {code: "42501", message: "new row violates row-level security policy for table \"" + t + "\""}};
      if (t === "group_maps") { if (DB.group_maps.filter(m => m.group_id === r.group_id && !m.deleted).length >= 40) return {error: {message: "A group can have 40 concept maps. Take one off the group first."}}; Object.assign(r, {id: "map" + (DB.group_maps.length + 1), created_by: me, deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString()}); }
      if (t === "group_map_ops") { const m = DB.group_maps.find(x => x.id === r.map_id && x.group_id === r.group_id && !x.deleted); if (!m) return {error: {code: "42501", message: "new row violates row-level security policy"}}; Object.assign(r, {id: ++opId, user_id: me}); m.updated_at = new Date().toISOString(); }
      if (t === "group_map_people") { r.user_id = me; if (DB.group_map_people.some(x => x.map_id === r.map_id && x.user_id === me)) continue; }
      (DB[t] = DB[t] || []).push(r); out.push(r);
      if (t === "group_map_ops") { if (hold) held.push(r); else setTimeout(() => deliver(r), 30); }
    }
    return {data: req.one ? out[0] || null : out};
  }
  if (req.op === "update") { const hit = rows0.filter(r => visible(r) && pass(r)); if (t === "group_maps" && hit.some(r => r.created_by !== me && !DB.study_groups.some(g => g.id === r.group_id && g.owner_id === me))) return {data: []}; hit.forEach(r => Object.assign(r, req.patch)); return {data: hit}; }
  if (req.op === "delete") { const hit = rows0.filter(r => visible(r) && pass(r) && (t !== "group_map_people" || r.user_id === me)); DB[t] = rows0.filter(r => !hit.includes(r)); return {data: null}; }
  let rows = rows0.filter(r => visible(r) && pass(r));
  if (req.order) rows = rows.slice().sort((a, b) => (a[req.order[0]] > b[req.order[0]] ? 1 : a[req.order[0]] < b[req.order[0]] ? -1 : 0) * (req.order[1] ? 1 : -1));
  if (req.lim) rows = rows.slice(0, req.lim);
  rows = JSON.parse(JSON.stringify(rows));
  return {data: req.one ? rows[0] || null : rows};
}
async function rpc(me, fn, a){
  DB.rpc.push(fn);
  if (fn === "group_map_preview") { const m = DB.group_maps.find(x => x.id === a.p_map && !x.deleted); if (!m || !member(m.group_id, me)) return {error: {message: "That map isn't in one of your groups."}}; m.preview = a.p_preview; return {data: null}; }
  if (fn === "my_username") return {data: me === "u1" ? "connor" : "maya"};
  if (fn === "my_age") return {data: 20};
  return {data: null};
}
// In the page: a Supabase client that asks the server above
function fake(o){
  const me = o.me;
  window.__chans = [];
  const mk = t => {
    const st = {t, f: [], op: "select", rows: null, one: false, lim: 0, order: null, patch: null};
    const run = async () => { if (!navigator.onLine) return {data: null, error: {message: "Failed to fetch"}}; const r = await window.__sbq(st); return r.error ? {data: null, error: r.error} : {data: r.data, error: null}; };
    const api = {select() { return api; }, eq(c, v) { st.f.push(["eq", c, v]); return api; }, neq(c, v) { st.f.push(["neq", c, v]); return api; }, gt(c, v) { st.f.push(["gt", c, v]); return api; }, in(c, v) { st.f.push(["in", c, v]); return api; },
      gte() { return api; }, lte() { return api; }, or() { return api; }, is() { return api; }, not() { return api; }, ilike() { return api; }, range() { return api; },
      order(c, x) { st.order = [c, !(x && x.ascending === false)]; return api; }, limit(k) { st.lim = k; return api; }, maybeSingle() { st.one = true; return api; }, single() { st.one = true; return api; },
      insert(r) { st.op = "insert"; st.rows = r; return api; }, upsert(r) { st.op = "upsert"; st.rows = r; return api; }, update(p) { st.op = "update"; st.patch = p; return api; }, delete() { st.op = "delete"; return api; },
      then(res, rej) { return run().then(res, rej); }};
    return api;
  };
  const client = {from: mk, rpc: async (fn, a) => { if (!navigator.onLine) return {data: null, error: {message: "Failed to fetch"}}; return window.__sbrpc(fn, a || {}); }, removeChannel(c) { c.closed = true; },
    channel: name => { const c = {name, subs: [], on(ev, f, cb) { c.subs.push({f, cb}); return c; }, subscribe(cb) { c.status = cb; if (cb) setTimeout(() => cb("SUBSCRIBED"), 0); return c; }}; window.__chans.push(c); return c; }};
  window.__sbGroupsStub = {user: {id: me, email: me + "@x.com"}, client};
  window.__sbShareStub = async fn => fn === "my_username" ? (me === "u1" ? "connor" : "maya") : fn === "my_age" ? 20 : null;
  window.__SB_TEST = true;
  try {
    localStorage.setItem("sb:grpName:" + me, me === "u1" ? "Connor" : "Maya"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
    if (o.free) localStorage.setItem("studyboard:paywall-test", "1");
    if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(o.seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); }
  } catch (e) {}
}
const SEED_A = () => ({v: 2, updated: 1, settings: {}, tasks: [], decks: [{id: "d1", name: "Private cells deck", courseId: "c1", cards: [{id: "k1", front: "Secret card front", back: "x"}], created: 1}], files: [], events: [],
  courses: [{id: "c1", name: "Biology", code: "BIO 101", color: "#2E9A5A", maps: [{id: "m1", name: "Cell Respiration", auto: false, created: 1, at: Date.now() - 864e5,
    add: [{id: "a", label: "Glycolysis"}, {id: "b", label: "Krebs cycle"}, {id: "c", label: "ATP"}], mat: ["note:n1"],
    links: [{a: "root", b: "idea:a", label: "starts with"}, {a: "idea:a", b: "idea:b", label: "feeds"}, {a: "idea:b", b: "idea:c", label: "makes", arrow: "end"}, {a: "root", b: "note:n1", label: "notes"}],
    pos: {root: [0, 0], "idea:a": [-260, 140], "idea:b": [0, 260], "idea:c": [260, 140], "note:n1": [0, -180]}, styles: {"idea:c": {shape: "circle", fill: "#FFE066"}}}]}],
  notes: [{id: "n1", text: "My private lecture notes\nThe exam answer is 42 (SECRET)", courseId: "c1", created: 1, updated: 1}]});
const SEED_B = () => ({v: 2, updated: 1, settings: {}, tasks: [], decks: [], files: [], events: [], notes: [{id: "mn", text: "Maya's own note\nnot for the group", courseId: "cb", created: 1}],
  courses: [{id: "cb", name: "Intro Biology", code: "BIO 101", color: "#7C5CFF"}, {id: "cx", name: "History", code: "HIS 110", color: "#E8590C"}]});

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const boot = async (me, seed, vp, extra) => {
    const ctx = await browser.newContext({viewport: vp || {width: 1280, height: 860}, serviceWorkers: "block", acceptDownloads: true});
    await ctx.routeWebSocket(/supabase\.co/, ws => ws.close());
    await ctx.route(/supabase\.co|googleapis\.com/, r => r.abort());
    await ctx.exposeFunction("__sbq", req => serve(me, req));
    await ctx.exposeFunction("__sbrpc", (fn, a) => rpc(me, fn, a));
    await ctx.addInitScript(fake, Object.assign({me, seed}, extra || {}));
    const page = await ctx.newPage(); page.errs = [];
    page.on("pageerror", e => page.errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.SBCMAP && window.SBCMAPG && window.SBGROUPS && SBGROUPS.share);
    await page.waitForTimeout(700); await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    pages.add(page); return {ctx, page};
  };
  const act = (page, a, id, extra) => page.evaluate(([a, id, extra]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; Object.assign(b.dataset, extra || {}); b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || "", extra || {}]);
  const S = page => page.evaluate(() => JSON.parse(JSON.stringify(window.__sbSync.state)));
  const mapsIn = async (page, cid) => (Object.values((await S(page)).courses).find(c => c.id === cid) || {}).maps || [];
  const liveMap = async (page) => { const st = await S(page); for (const c of Object.values(st.courses)) for (const m of c.maps || []) if (m.g) return {cid: c.id, m}; return null; };
  const node = (page, label) => page.locator(".cm-node", {hasText: label}).first();
  const nodeId = (page, label) => node(page, label).getAttribute("data-n");
  const more = async (page, cm) => { await page.click('.cm-tools [data-cm="menu"][data-v="more"]'); await page.waitForSelector(`.cm-menu [data-cm="${cm}"]`); await page.click(`.cm-menu [data-cm="${cm}"]`); };
  const rename = async (page, label, to) => { await node(page, label).click(); await page.waitForSelector('.cm-panel [data-cm="rename"]'); await page.click('.cm-panel [data-cm="rename"]'); await page.fill("#cmAsk", to); await page.press("#cmAsk", "Enter"); await page.waitForTimeout(80); await page.click('.cm-panel [data-cm="desel"]').catch(() => {}); };
  const drag = async (page, label, dx, dy) => { const b = await node(page, label).boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.mouse.move(b.x + b.width / 2 + dx, b.y + b.height / 2 + dy, {steps: 8}); await page.mouse.up(); await page.waitForTimeout(80); };
  const chip = async page => (await page.locator(".cm-glive").innerText()).replace(/\s+/g, " ");
  const settle = ms => new Promise(r => setTimeout(r, ms || 700));
  if (SHOTS) fs.mkdirSync(SHOTS, {recursive: true});
  try {
    /* Connor shares his map */
    const A = await boot("u1", SEED_A());
    await act(A.page, "cm-open", "c1", {kind: "course", map: "m1"}); await A.page.waitForSelector(".cm-sheet .cm-node");
    ok(await A.page.locator('.cm-node[data-n="note:n1"]').count() === 1, "Connor's own map shows his private note on it");
    await A.page.click('.cm-tools [data-cm="menu"][data-v="more"]'); await A.page.waitForSelector('.cm-menu [data-cm="g-share"]');
    ok((await A.page.locator('.cm-menu [data-cm="g-share"]').textContent()).trim() === "Share With a Group…", "the map's ⋯ menu has Share With a Group…");
    await A.page.click('.cm-menu [data-cm="g-share"]'); await A.page.waitForSelector("dialog[open] .cm-gshare [data-submit]");
    const sheet = await A.page.locator("dialog[open]").textContent();
    ok(/Bio Squad/.test(sheet) && /1 box opens your own notes, decks, files or exams/.test(sheet) && /Only its name goes to the group/.test(sheet), "the sheet lists his groups and says the box that opens his note goes by name only");
    if (SHOTS) await A.page.screenshot({path: path.join(SHOTS, "share-sheet-desktop.png")});
    await A.page.click("dialog[open] [data-submit]"); await A.page.waitForSelector(".cm-sheet .cm-glive"); await settle();
    ok(DB.group_maps.length === 1 && DB.group_maps[0].group_id === "g1" && DB.group_maps[0].name === "Cell Respiration" && DB.group_maps[0].course === "BIO 101", "it makes the group's map");
    const sent = JSON.stringify(DB.group_map_ops);
    ok(DB.group_map_ops.length >= 1 && /Glycolysis/.test(sent) && /My private lecture notes/.test(sent), "and sends what's on it (the note's box as a plain idea with its name)");
    ok(!/note:|deck:|n1|SECRET|42|Secret card|mat/.test(sent.replace(/"map_id":"[^"]*"/g, "")), "nothing private leaves: no ids of his notes or decks, no note text, no card, no material list");
    const AL = await liveMap(A.page);
    ok(AL && AL.cid === "c1" && AL.m.g.bid === "map1" && AL.m.g.gn === "Bio Squad" && (await mapsIn(A.page, "c1")).some(m => m.id === "m1" && !m.g && m.add.length === 3), "the live copy sits beside his own map, which stays as it was");
    ok(await A.page.locator('.cm-node[data-n="note:n1"]').count() === 0 && /Live with Bio Squad/.test(await A.page.locator(".cm-glive").getAttribute("aria-label")) && await A.page.locator(".cm-glive.on").count() === 1, "the live copy is open: no link to his note, and the chip says Live with Bio Squad");
    ok(DB.group_map_people.some(r => r.map_id === "map1" && r.user_id === "u1") && DB.group_maps[0].preview && DB.group_maps[0].preview.n.length === 5, "sharing puts him on its list and sends a preview of its boxes");
    await A.page.click('.cm-tools [data-cm="menu"][data-v="add"]'); await A.page.click('.cm-menu [data-cm="mat"]'); await A.page.waitForTimeout(150);
    ok(/doesn't link to your own notes, decks, files/.test(await A.page.locator(".cm-panel").textContent()), "on a group map, Course Material says it stays private instead");
    await A.page.click('.cm-panel [data-cm="err-x"]').catch(() => {});

    /* Maya adds it from the group's tab */
    const B = await boot("u2", SEED_B());
    await act(B.page, "grp-page"); await B.page.waitForSelector('[data-act="grp-open"][data-id="g1"]'); await B.page.click('[data-act="grp-open"][data-id="g1"]'); await B.page.waitForSelector("#grpDetail");
    await B.page.click('[data-act="grp-tab"][data-t="boards"]'); await B.page.waitForSelector(".cmg-card");
    const card = await B.page.locator(".cmg-card").textContent();
    ok(/Cell Respiration/.test(card) && /Connor has it/.test(card) && await B.page.locator(".cmg-card .cm-peek .pk-n").count() >= 3, "the group's Whiteboards tab lists the map under Concept Maps, with a picture of its boxes and who has it");
    await B.page.click('.cmg-card [data-act="grp-cm-add"]'); await settle();
    let BL = await liveMap(B.page);
    ok(BL && BL.cid === "cb" && BL.m.add.length === 4 && BL.m.add.some(i => i.label === "My private lecture notes") && BL.m.links.length === 4, "Add to My Maps files it under her matching course (BIO 101), with everything on it");
    ok(DB.group_map_people.some(r => r.map_id === "map1" && r.user_id === "u2") && /You and Connor have it/.test(await B.page.locator(".cmg-card .wbg-who").textContent()), "it records that she has it");
    if (SHOTS) { await B.page.locator(".grp-cms").scrollIntoViewIfNeeded(); await B.page.screenshot({path: path.join(SHOTS, "group-page-desktop.png")}); }
    await B.page.click(".cmg-card .cm-peekb"); await B.page.waitForSelector(".cm-sheet .cm-node"); await settle(400);
    ok(await B.page.locator(".cm-node", {hasText: "Maya's own note"}).count() === 0 && await B.page.locator(".cm-node").count() === 5, "it opens in her map editor, without her own notes on it");
    ok(/^Live · 2/.test(await chip(B.page)) && /Live with Bio Squad, 2 people/.test(await B.page.locator(".cm-glive").getAttribute("aria-label")), "her chip shows it's live, with 2 people");

    /* Both edit at once: different boxes, both survive */
    hold = true;
    await drag(A.page, "Glycolysis", 120, -60);
    await rename(B.page, "Krebs cycle", "Citric acid cycle");
    await settle(500);
    await release(); await settle(900);
    const aIdG = await nodeId(A.page, "Glycolysis"), bIdK = await nodeId(B.page, "Citric acid cycle");
    const posA = (await liveMap(A.page)).m.pos[aIdG], posB = (await liveMap(B.page)).m.pos[aIdG];
    ok(await A.page.locator(".cm-node", {hasText: "Citric acid cycle"}).count() === 1 && await B.page.locator(".cm-node", {hasText: "Citric acid cycle"}).count() === 1, "Maya's rename shows up for Connor");
    ok(posA && posB && posA[0] === posB[0] && posA[1] === posB[1], "and Connor's move shows up for Maya: both edits survive (" + posA + " / " + posB + ")");
    ok(await B.page.locator(`.cm-node.cm-peer[data-n="${aIdG}"] .cm-peertag`).count() === 1 && /Connor/.test(await B.page.locator(`.cm-node[data-n="${aIdG}"] .cm-peertag`).textContent()), "the box Connor just moved is marked with his name on Maya's screen");
    ok(/Connor editing/.test(await chip(B.page)), "and her chip says Connor is editing");
    if (SHOTS) { await B.page.screenshot({path: path.join(SHOTS, "two-editing-maya-desktop.png")}); await A.page.screenshot({path: path.join(SHOTS, "two-editing-connor-desktop.png")}); }
    // a new idea and a connection with a style
    await A.page.click('.cm-tools [data-cm="menu"][data-v="add"]'); await A.page.click('.cm-menu [data-cm="idea"]'); await A.page.fill("#cmAsk", "Pyruvate"); await A.page.press("#cmAsk", "Enter"); await settle(900);
    ok(await B.page.locator(".cm-node", {hasText: "Pyruvate"}).count() === 1, "an idea Connor adds appears on Maya's map, connected");
    // Undo is your own: Maya's undo takes back her rename, not Connor's move or idea
    await B.page.click('.cm-panel [data-cm="desel"]').catch(() => {});
    await B.page.click('.cm-tools [data-cm="undo"]'); await settle(900);
    BL = await liveMap(B.page);
    ok(BL.m.add.some(i => i.label === "Krebs cycle") && BL.m.add.some(i => i.label === "Pyruvate") && JSON.stringify(BL.m.pos[aIdG]) === JSON.stringify(posA), "Maya's Undo takes back only her rename: Connor's move and idea stay");
    ok(await A.page.locator(".cm-node", {hasText: "Krebs cycle"}).count() === 1 && await A.page.locator(".cm-node", {hasText: "Pyruvate"}).count() === 1, "and her undo reaches Connor too");
    ok(!(await A.page.evaluate(() => SBCMAP.state().undoS.some(e => /Krebs|Citric/.test(e.label)))), "Connor's Undo list holds only his own steps");

    /* Offline: Maya's changes wait, then go */
    await B.ctx.setOffline(true); await settle(300);
    await rename(B.page, "ATP", "ATP (energy)"); await settle(500);
    ok(/Offline/.test(await chip(B.page)) && await B.page.locator(".cm-glive.on").count() === 0, "offline, her chip says so");
    ok(await B.page.evaluate(() => Object.values(SBCMAPG.queue()).some(x => x.q.length)) && /ATP \(energy\)/.test(await B.page.evaluate(() => localStorage.getItem("studyboard:cmQueue"))), "her change waits on the device (kept even if the app closes)");
    ok(await A.page.locator(".cm-node", {hasText: "ATP (energy)"}).count() === 0, "and hasn't reached Connor yet");
    await B.ctx.setOffline(false); await B.page.evaluate(() => window.dispatchEvent(new Event("online"))); await settle(1200);
    ok(await A.page.locator(".cm-node", {hasText: "ATP (energy)"}).count() === 1 && await B.page.evaluate(() => !Object.keys(SBCMAPG.queue()).length), "back online, it's sent and reaches Connor");

    /* A picture: confirmed as hers to share first, then sent inside the map */
    await B.page.click('.cm-tools [data-cm="menu"][data-v="add"]');
    const [fc] = await Promise.all([B.page.waitForEvent("filechooser"), B.page.click('.cm-menu [data-cm="pic"]')]);
    await fc.setFiles({name: "cell.png", mimeType: "image/png", buffer: png(60, 40, [0, 120, 255])}); await settle(400);
    const gated = await B.page.locator('.cm-panel [data-cm="g-rights-ok"]').count() === 1;
    ok(gated && /Everyone in Bio Squad sees the pictures/.test(await B.page.locator(".cm-panel").textContent()), "adding a picture to a group map first asks her to confirm it's hers to share");
    await B.page.click('.cm-panel [data-cm="g-rights-ok"]'); await settle(200);
    ok(await B.page.locator(".cm-panel #shRights").count() === 1, "Continue needs the box ticked");
    await B.page.check(".cm-panel #shRights"); await B.page.click('.cm-panel [data-cm="g-rights-ok"]');
    await B.page.waitForFunction(() => document.querySelector(".cm-node image.cm-img"), null, {timeout: 8000}); await settle(1500);
    ok(DB.group_map_ops.some(o => o.user_id === "u2" && o.ch.some(c => c.t === "a" && c.v && c.v.img && /^data:image\/jpeg;base64,/.test(c.v.img.src || ""))), "the picture goes to the group as a small image inside the map");
    await A.page.waitForFunction(() => { const i = document.querySelector(".cm-node image.cm-img"); return i && /^blob:/.test(i.getAttribute("href") || ""); }, null, {timeout: 8000});
    ok(true, "and shows on Connor's map");

    /* Export still works on a group map */
    await A.page.click('.cm-tools [data-cm="menu"][data-v="more"]'); await A.page.click('.cm-menu [data-cm="xmenu"]'); await A.page.waitForSelector('.cm-menu [data-cm="export"][data-v="png"]');
    const [dl] = await Promise.all([A.page.waitForEvent("download", {timeout: 30000}), A.page.click('.cm-menu [data-cm="export"][data-v="png"]')]);
    const buf = fs.readFileSync(await dl.path());
    ok(/Cell Respiration.*\.png$/.test(dl.suggestedFilename()) && buf.slice(1, 4).toString() === "PNG" && buf.length > 2000, "Export saves the group map as a picture: " + dl.suggestedFilename());
    await A.page.waitForFunction(() => !window.SBCMAP.state().exporting);

    /* Phone width */
    if (SHOTS) {
      const P = await boot("u2", null, {width: 390, height: 844}, {});
      await P.page.evaluate(s => { localStorage.setItem("coursework:v2", s); }, JSON.stringify(await S(B.page))); await P.page.reload(); await P.page.waitForFunction(() => window.SBCMAP && window.SBCMAPG); await settle(800);
      await P.page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
      await act(P.page, "grp-page"); await P.page.waitForSelector('[data-act="grp-open"][data-id="g1"]'); await P.page.click('[data-act="grp-open"][data-id="g1"]'); await P.page.waitForSelector("#grpDetail");
      await P.page.click('[data-act="grp-tab"][data-t="boards"]'); await P.page.waitForSelector(".cmg-card"); await settle(500); await P.page.locator(".grp-cms").scrollIntoViewIfNeeded();
      await P.page.screenshot({path: path.join(SHOTS, "group-page-phone.png")});
      await P.page.click(".cmg-card .cm-peekb"); await P.page.waitForSelector(".cm-sheet .cm-node"); await settle(500);
      await drag(A.page, "Pyruvate", 80, 40); await settle(900);
      await P.page.screenshot({path: path.join(SHOTS, "two-editing-phone.png")});
      ok(await P.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "at phone width nothing scrolls sideways");
      pages.delete(P.page); await P.ctx.close();
    }

    /* Leaving the group: her copy stays, as her own map */
    DB.group_members = DB.group_members.filter(m => m.user_id !== "u2");
    await B.page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close())); await settle(200);
    const bl = await liveMap(B.page);
    await act(B.page, "cm-open", bl.cid, {kind: "course", map: bl.m.id}); await settle(1200);
    const after = (await mapsIn(B.page, bl.cid)).find(m => m.id === bl.m.id);
    ok(after && !after.g && after.add.length >= 4 && await B.page.locator(".cm-glive").count() === 0, "after she leaves the group, her copy stays as her own map, no longer live");

    /* Deleting your copy takes you off its list; the group's map stays for everyone else */
    await A.page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close())); await settle(200);
    const al = await liveMap(A.page);
    await act(A.page, "cm-del", al.m.id, {course: al.cid}); await A.page.waitForSelector("dialog[open] [data-submit]"); await A.page.click("dialog[open] [data-submit]"); await settle(600);
    ok(!(await liveMap(A.page)) && !DB.group_map_people.some(r => r.map_id === al.m.g.bid && r.user_id === "u1") && DB.group_maps.some(m => m.id === al.m.g.bid && !m.deleted) && ((await S(A.page)).settings.cmGone || []).includes(al.m.g.bid), "deleting his copy removes it for him and takes him off its list; the group's map stays");

    ok(!A.page.errs.length && !B.page.errs.length, "no page errors: " + A.page.errs.concat(B.page.errs).join(" | "));
    pages.delete(A.page); pages.delete(B.page); await A.ctx.close(); await B.ctx.close();

    /* A free account: sharing and editing group maps is free, like group whiteboards; pictures stay Pro */
    FREE = true; DB = newDB(); opId = 0;
    const F = await boot("u1", SEED_A(), null, {free: true});
    ok(await F.page.evaluate(() => !!(window.SBPRO && SBPRO.locked())), "this account is on the free plan");
    await act(F.page, "cm-open", "c1", {kind: "course", map: "m1"}); await F.page.waitForSelector(".cm-sheet .cm-node");
    await more(F.page, "g-share"); await F.page.waitForSelector("dialog[open] .cm-gshare [data-submit]");
    await F.page.check('dialog[open] input[name="drop"]');
    await F.page.click("dialog[open] [data-submit]"); await F.page.waitForSelector(".cm-sheet .cm-glive"); await settle();
    const FL = await liveMap(F.page);
    ok(DB.group_maps.length === 1 && FL && FL.m.add.length === 3 && !FL.m.add.some(i => /private lecture/.test(i.label)) && !/private lecture/.test(JSON.stringify(DB.group_map_ops)), "a free account shares too; with Leave those boxes out, the note's box doesn't go at all");
    await F.page.click('.cm-tools [data-cm="menu"][data-v="add"]'); await F.page.click('.cm-menu [data-cm="pic"]'); await settle(400);
    ok(await F.page.locator('dialog[open]').count() === 1 && !(await F.page.locator('.cm-panel [data-cm="g-rights-ok"]').count()), "adding a picture is still Pro (the Pro sheet, before any rights check)");
    ok(!F.page.errs.length, "no page errors (free): " + F.page.errs.join(" | "));
    pages.delete(F.page); await F.ctx.close();
    console.log(`concept-map-groups.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
