// node tests/onenote.e2e.js
// OneNote against a stand-in for Studyboard's server and Microsoft Graph: link a section, its pages come in as notes on a
// course board, updates follow, your own edits and deletions are respected, and Save to OneNote adds a page
"use strict";
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

const PAGE1 = `<html lang="en-US"><head><title>Cell division</title><meta name="created" content="2026-10-30T10:00:00Z" /></head>
<body data-absolute-enabled="true" style="font-family:Calibri"><div style="position:absolute;left:48px;top:120px">
<h1>Mitosis</h1><p>Makes two <span style="font-weight:bold">identical</span>   cells</p>
<ul><li>Prophase</li><li>Metaphase<ul><li>Chromosomes line up</li></ul></li></ul>
<ol><li><p>Count</p></li><li>Draw</li></ol>
<p data-tag="to-do">Read ch. 5</p><p data-tag="to-do:completed">Watch video</p>
<table><tr><td>Phase</td><td>What happens</td></tr><tr><td>Anaphase</td><td>Pulled apart</td></tr></table>
<img src="https://graph.microsoft.com/v1.0/me/onenote/resources/x/$value" alt="diagram" /><script>window.__bad = 1</script>
</div></body></html>`;
const EXPECT1 = "Cell division\n\nMitosis\nMakes two identical cells\n• Prophase\n• Metaphase\n  • Chromosomes line up\n1. Count\n2. Draw\n☐ Read ch. 5\n☑ Watch video\nPhase | What happens\nAnaphase | Pulled apart";

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: 1200, height: 900}}); await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(() => {
      window.__opened = []; window.open = u => { window.__opened.push(String(u)); return null; };
      if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1");
      localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [{id: "bio", name: "Biology", code: "BIO 101", color: "#3B6FE0"}], tasks: [], settings: {}}));
      localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done");
    });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.SBONENOTE && window.SBIMPORT && document.querySelector('[data-act="menu"]'), null, {timeout: 40000}); await page.waitForTimeout(400);

    // the stand-ins
    await page.evaluate(([page1]) => {
      const G = window.__G = {calls: [], posts: [], tokens: 0, pages: {
        S1: [{id: "p1", title: "Cell division", lastModifiedDateTime: "2026-11-01T10:00:00Z", createdDateTime: "2026-10-30T10:00:00Z", links: {oneNoteWebUrl: {href: "https://onedrive.live.com/view.aspx?p1"}}},
             {id: "p2", title: "Genetics", lastModifiedDateTime: "2026-11-01T11:00:00Z", createdDateTime: "2026-10-31T10:00:00Z", links: {oneNoteWebUrl: {href: "https://onedrive.live.com/view.aspx?p2"}}}]},
        content: {p1: page1, p2: "<html><head><title>Genetics</title></head><body><div><p>Genetics</p><p>Alleles come in pairs</p></div></body></html>"}};
      G.cls = false; G.clsTokens = 0;
      SBONENOTE.T.transport = async body => {
        if (body.action === "status") return {ok: true, status: 200, data: {accounts: [{provider: "onenote", account: "sam@school.edu", status: "ok"}].concat(G.cls ? [{provider: "onenote_class", account: "sam@school.edu", status: "ok"}] : []), providers: {onenote: true, onenote_class: true}}};
        if (body.action === "token" && body.provider === "onenote") { G.tokens++; return {ok: true, status: 200, data: {access: "tok", expires_in: 3600}}; }
        if (body.action === "token" && body.provider === "onenote_class") { if (!G.cls) return {ok: false, status: 404, data: {}}; G.clsTokens++; return {ok: true, status: 200, data: {access: "ctok", expires_in: 3600}}; }
        if (body.action === "start" && body.provider === "onenote_class") return {ok: true, status: 200, data: {url: "https://example.test/cloud-files?begin=cls"}};
        if (body.action === "disconnect") { if (body.provider === "onenote_class") G.cls = false; return {ok: true, status: 200, data: {ok: true}}; }
        return {ok: false, status: 400, data: {}};
      };
      const J = (o, st) => new Response(JSON.stringify(o), {status: st || 200, headers: {"content-type": "application/json"}});
      SBONENOTE.T.fetch = async (url, init) => {
        const u = new URL(url), m = (init && init.method) || "GET", full = decodeURIComponent(u.pathname);
        G.calls.push(m + " " + full);
        // Class Notebooks: the class teams and their notebooks, with the class token only
        if (/^\/v1\.0\/(me\/joinedTeams|groups\/)/.test(full)) {
          if (init.headers.Authorization !== "Bearer ctok") return J({}, 401);
          if (m !== "GET") return J({}, 403);
          if (full === "/v1.0/me/joinedTeams") return J({value: [{id: "T1", displayName: "BIO 101 Period 3"}, {id: "T2", displayName: "Soccer Team"}]});
          if (full === "/v1.0/groups/T1/onenote/sections") return J({value: [{id: "CS1", displayName: "Handouts", parentNotebook: {displayName: "BIO 101 Notebook"}}]});
          if (full === "/v1.0/groups/T2/onenote/sections") return J({}, 404);
          if (full === "/v1.0/groups/T1/onenote/sections/CS1/pages") return J({value: [{id: "c1", title: "Photosynthesis", lastModifiedDateTime: "2026-11-01T10:00:00Z", links: {oneNoteWebUrl: {href: "https://school.sharepoint.com/c1"}}}]});
          if (full === "/v1.0/groups/T1/onenote/pages/c1/content") return new Response("<html><body><p>Light reactions make ATP</p></body></html>", {headers: {"content-type": "text/html"}});
          return J({}, 404);
        }
        const p = full.replace("/v1.0/me/onenote", "");
        if (init.headers.Authorization !== "Bearer tok") return J({}, 401);
        if (m === "GET" && p === "/sections") return J({value: [{id: "S2", displayName: "Lab Notes", parentNotebook: {displayName: "Chem"}}, {id: "S1", displayName: "BIO 101 Lectures", parentNotebook: {displayName: "School"}}]});
        let x;
        if (m === "GET" && (x = /^\/sections\/([^/]+)\/pages$/.exec(p))) return J({value: G.pages[x[1]] || []});
        if (m === "GET" && (x = /^\/pages\/([^/]+)\/content$/.exec(p)) && G.wait) await G.wait;
        if (m === "GET" && (x = /^\/pages\/([^/]+)\/content$/.exec(p))) return G.content[x[1]] ? new Response(G.content[x[1]], {headers: {"content-type": "text/html"}}) : J({}, 404);
        if (m === "POST" && (x = /^\/sections\/([^/]+)\/pages$/.exec(p))) { G.posts.push({sid: x[1], type: init.headers["Content-Type"], body: init.body}); return J({id: "new" + G.posts.length, links: {oneNoteWebUrl: {href: "https://onedrive.live.com/view.aspx?new" + G.posts.length}}}, 201); }
        return J({}, 404);
      };
    }, [PAGE1]);
    const S = () => page.evaluate(() => { const s = SBIMPORT.state(); return {notes: Object.values(s.notes), boards: (s.settings.noteBoards || []), on: s.settings.onenote}; });
    const act = (a, id) => page.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }, [a, id]);
    const fromOn = async () => (await S()).notes.filter(x => x.on);

    // Import From Another App lists OneNote and opens its sheet
    await act("ia-open"); await page.waitForSelector('dialog[open] [data-act="on-open"]');
    ok(/OneNote/.test(await page.textContent('dialog[open] [data-act="on-open"]')), "Import From Another App lists OneNote");
    await page.click('dialog[open] [data-act="on-open"]'); await page.waitForSelector("dialog[open] .on-sheet");
    await page.waitForFunction(() => /Connected as/.test(document.querySelector("#onBody").textContent));
    ok(/sam@school\.edu/.test(await page.textContent("#onBody")), "the sheet shows the connected account");

    // link a section
    await page.click('#onBody [data-act="on-add"]'); await page.waitForSelector("#onSec");
    const opts = await page.$$eval("#onSec option", o => o.map(x => x.textContent));
    ok(opts[0] === "Chem › Lab Notes" && opts[1] === "School › BIO 101 Lectures", "sections are listed by notebook: " + opts);
    await page.selectOption("#onSec", "1");
    await page.selectOption("#onCourse", "bio");
    await page.click('#onBody [data-act="on-link"]');
    await page.waitForFunction(() => Object.values(SBIMPORT.state().notes).filter(n => n.on).length === 2, null, {timeout: 15000});
    let st = await S(), mine = st.notes.filter(x => x.on);
    const cell = mine.find(x => x.on.p === "p1");
    ok(cell.text === EXPECT1, "a page becomes a note with its headings, lists, to-dos and tables:\n" + cell.text);
    ok(!(await page.evaluate(() => window.__bad)), "nothing in a page runs");
    ok(mine.every(x => x.courseId === "bio"), "the notes belong to the course");
    const board = st.boards.find(b => b.id === cell.board);
    ok(board && board.name === "BIO 101 Lectures" && board.courseId === "bio", "on a board named after the section, tied to the course");
    ok(cell.on.u === "https://onedrive.live.com/view.aspx?p1" && cell.on.s === "S1", "each note remembers its page");
    await page.waitForFunction(() => /2 pages/.test(document.querySelector("#onBody").textContent));
    ok(true, "the sheet counts the pages");

    // updates: a changed page follows, your own edit is kept, a deleted note stays deleted
    const gen = mine.find(x => x.on.p === "p2");
    await page.evaluate(([gid]) => {
      const s = SBIMPORT.state();
      s.notes[gid].text += "\nMy own line";   // edited here
      __G.pages.S1[0].lastModifiedDateTime = "2026-11-02T09:00:00Z"; __G.content.p1 = __G.content.p1.replace("Pulled apart", "Pulled to the poles");
      __G.pages.S1[1].lastModifiedDateTime = "2026-11-02T09:00:00Z";
      __G.pages.S1.push({id: "p3", title: "Ecology", lastModifiedDateTime: "2026-11-02T08:00:00Z", links: {}});
      __G.content.p3 = "<html><body><p>Food webs</p></body></html>";
    }, [gen.id]);
    await page.click('#onBody [data-act="on-sync"]');
    await page.waitForFunction(() => Object.values(SBIMPORT.state().notes).filter(n => n.on).length === 3, null, {timeout: 15000});
    await page.waitForTimeout(300);
    mine = await fromOn();
    ok(/Pulled to the poles/.test(mine.find(x => x.on.p === "p1").text), "a page changed in OneNote updates its note");
    ok(/My own line/.test(mine.find(x => x.on.p === "p2").text), "a note edited in Studyboard keeps its edits");
    ok(mine.find(x => x.on.p === "p3").text === "Ecology\n\nFood webs", "a new page comes in");
    await page.evaluate(() => { const s = SBIMPORT.state(); const n = Object.values(s.notes).find(x => x.on && x.on.p === "p3"); delete s.notes[n.id]; __G.pages.S1.find(p => p.id === "p3").lastModifiedDateTime = "2026-11-02T12:00:00Z"; });
    await page.click('#onBody [data-act="on-sync"]'); await page.waitForTimeout(1200);
    ok(!(await fromOn()).some(x => x.on.p === "p3"), "a note you deleted isn't brought back");
    // a note edited while the sync is running keeps the edit
    await page.evaluate(() => { __G.wait = new Promise(r => { __G.go = r; }); __G.pages.S1[0].lastModifiedDateTime = "2026-11-03T09:00:00Z"; __G.content.p1 = __G.content.p1.replace("Pulled to the poles", "Pulled to the spindle"); });
    await page.click('#onBody [data-act="on-sync"]'); await page.waitForTimeout(300);
    await page.evaluate(() => { const n = Object.values(SBIMPORT.state().notes).find(x => x.on && x.on.p === "p1"); n.text += "\nTyped during the sync"; __G.wait = null; __G.go(); });
    await page.waitForTimeout(1200);
    const p1 = (await fromOn()).find(x => x.on.p === "p1");
    ok(/Typed during the sync/.test(p1.text) && !/spindle/.test(p1.text), "a note edited during a sync keeps the edit");

    // the note toolbar and Open Notes
    ok(/Open in OneNote/.test(await page.evaluate(id => SBONENOTE.saveBtn(id), cell.id)), "a note from OneNote offers Open in OneNote");
    await page.click('#onBody [data-act="on-open-board"]'); await page.waitForTimeout(300);
    ok(await page.locator("dialog[open]").count() === 0, "Open Notes goes to the board");

    // Microsoft's own OneNote icon on the buttons, unchanged
    const want = "data:image/svg+xml;base64," + fs.readFileSync(path.join(root, "vendor", "microsoft-office-icons", "onenote_20x1.svg")).toString("base64");
    const iconOk = await page.evaluate(w => { const d = document.createElement("div"); d.innerHTML = SBONENOTE.saveBtn(Object.values(SBIMPORT.state().notes).find(n => n.on).id); const i = d.querySelector("img.ms-ic"); return !!i && i.getAttribute("src") === w && i.getAttribute("alt") === ""; }, want);
    ok(iconOk, "Open in OneNote shows Microsoft's OneNote icon (the official file, decorative to screen readers)");

    // Class Notebooks: off until added, then their sections are offered, read only
    await act("on-open"); await page.waitForFunction(() => /Add Class Notebooks/.test((document.querySelector("#onBody") || {}).textContent || ""));
    ok(await page.getAttribute('#onBody a[data-on-go="cls"]', "href") === "https://example.test/cloud-files?begin=cls", "Add Class Notebooks opens Microsoft's sign-in for the extra permission");
    ok(await page.locator('#onBody a[data-on-go="cls"] img.ms-ic').count() === 1, "with the OneNote icon");
    await page.evaluate(() => { __G.cls = true; });
    await act("on-open"); await page.waitForFunction(() => /Turn Off Class Notebooks/.test((document.querySelector("#onBody") || {}).textContent || ""));
    await page.click('#onBody [data-act="on-add"]'); await page.waitForSelector("#onSec optgroup", {state: "attached"});
    const groups = await page.$$eval("#onSec optgroup", g => g.map(x => x.label + ": " + [...x.querySelectorAll("option")].map(o => o.textContent).join(", ")));
    ok(groups[1] === "Class Notebooks (read only): BIO 101 Period 3 › BIO 101 Notebook › Handouts", "class sections listed by team and notebook; a team without one is skipped: " + groups);
    const csIdx = await page.$eval("#onSec", s => [...s.options].find(o => /Handouts/.test(o.textContent)).value);
    await page.selectOption("#onSec", csIdx); await page.selectOption("#onCourse", "bio");
    await page.click('#onBody [data-act="on-link"]');
    await page.waitForFunction(() => Object.values(SBIMPORT.state().notes).some(n => n.on && n.on.p === "c1"), null, {timeout: 15000});
    const cn = (await fromOn()).find(x => x.on.p === "c1");
    ok(cn.text === "Photosynthesis\n\nLight reactions make ATP" && cn.courseId === "bio" && cn.on.s === "CS1", "a class notebook page comes in as a note for the course");
    ok((await S()).on.links.find(l => l.sid === "CS1").g === "T1", "the link remembers its class team");
    ok(await page.evaluate(() => __G.calls.filter(c => /groups|joinedTeams/.test(c)).every(c => c.startsWith("GET "))), "class notebooks are only ever read");

    // Save to OneNote: the first time asks where, then saves there
    await page.evaluate(() => { const s = SBIMPORT.state(); s.notes.mine1 = {id: "mine1", text: "Exam tips\n\n• Sleep well\n☐ Pack a calculator", color: "yellow", x: 40, y: 40, z: 1, rot: 0, courseId: "bio", archived: false, shape: "", pin: "", stickers: []}; });
    ok(/Save to OneNote/.test(await page.evaluate(() => SBONENOTE.saveBtn("mine1"))), "a Studyboard note offers Save to OneNote");
    await act("on-save", "mine1"); await page.waitForSelector("#onSec");
    ok(/Where should Save to OneNote put pages/.test(await page.textContent("#onBody")), "the first save asks for a section");
    ok(!/Handouts/.test(await page.textContent("#onSec")), "and only offers your own notebooks, not class ones");
    await page.selectOption("#onSec", await page.$eval("#onSec", s => [...s.options].find(o => /Lab Notes/.test(o.textContent)).value)); await page.click('#onBody [data-act="on-save-here"]');
    await page.waitForFunction(() => __G.posts.length === 1 && SBIMPORT.state().notes.mine1.onSaved, null, {timeout: 10000});
    const post = await page.evaluate(() => __G.posts[0]);
    ok(post.sid === "S2" && post.type === "text/html", "posted to the chosen section as HTML");
    ok(post.body.includes("<title>Exam tips</title>") && post.body.includes("<ul><li>Sleep well</li></ul>") && post.body.includes('<p data-tag="to-do">Pack a calculator</p>'), "the page has the note's title, list and to-do");
    ok((await S()).on.saveTo.sid === "S2", "the section is remembered");
    ok(/Open in OneNote/.test(await page.evaluate(() => SBONENOTE.saveBtn("mine1"))) && /Save Again/.test(await page.evaluate(() => SBONENOTE.saveBtn("mine1"))), "after saving: Open in OneNote and Save Again");
    await act("on-save", "mine1"); await page.waitForFunction(() => __G.posts.length === 2, null, {timeout: 10000});
    ok(true, "the next save goes straight there");

    // tokens are reused, not asked for each call
    ok(await page.evaluate(() => __G.tokens === 1 && __G.clsTokens === 1), "one access token per connection for all of it");
    // the Import From Another App row shows the icon beside the full name
    await act("ia-open"); await page.waitForSelector('dialog[open] [data-act="on-open"] img.ms-ic');
    ok(true, "Import From Another App shows the OneNote icon beside its name");
    // no "school accounts can't connect yet" note any more: before connecting, or for Class Notebooks
    await page.evaluate(() => { document.querySelector("dialog[open]") && document.querySelector("dialog[open]").close(); const t = SBONENOTE.T.transport;
      SBONENOTE.T.transport = async b => b.action === "status" ? {ok: true, status: 200, data: {accounts: [], providers: {onenote: true, onenote_class: true}}} : b.action === "start" ? {ok: true, status: 200, data: {url: "https://example.test/x"}} : t(b); });
    await act("on-open"); await page.waitForFunction(() => /Connect OneNote/.test((document.querySelector("#onBody") || {}).textContent || ""));
    ok(!/can't connect yet|coming in the future/.test(await page.textContent("#onBody")), "before connecting: no school-accounts note");
    await page.evaluate(() => { SBONENOTE.T.transport = async b => b.action === "status" ? {ok: true, status: 200, data: {accounts: [{provider: "onenote", account: "sam@outlook.com", status: "ok"}], providers: {onenote: true, onenote_class: true}}} : {ok: true, status: 200, data: {url: "https://example.test/x"}}; });
    await act("on-open"); await page.waitForFunction(() => /Add Class Notebooks/.test((document.querySelector("#onBody") || {}).textContent || ""));
    ok(await page.locator('#onBody a[data-on-go="cls"]').count() === 1, "Add Class Notebooks is offered, with a school account");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\nonenote.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
