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
      SBONENOTE.T.transport = async body => {
        if (body.action === "status") return {ok: true, status: 200, data: {accounts: [{provider: "onenote", account: "sam@school.edu", status: "ok"}], providers: {onenote: true}}};
        if (body.action === "token" && body.provider === "onenote") { G.tokens++; return {ok: true, status: 200, data: {access: "tok", expires_in: 3600}}; }
        return {ok: false, status: 400, data: {}};
      };
      const J = (o, st) => new Response(JSON.stringify(o), {status: st || 200, headers: {"content-type": "application/json"}});
      SBONENOTE.T.fetch = async (url, init) => {
        const u = new URL(url), p = decodeURIComponent(u.pathname).replace("/v1.0/me/onenote", ""), m = (init && init.method) || "GET";
        G.calls.push(m + " " + p);
        if (init.headers.Authorization !== "Bearer tok") return J({}, 401);
        if (m === "GET" && p === "/sections") return J({value: [{id: "S2", displayName: "Lab Notes", parentNotebook: {displayName: "Chem"}}, {id: "S1", displayName: "BIO 101 Lectures", parentNotebook: {displayName: "School"}}]});
        let x;
        if (m === "GET" && (x = /^\/sections\/([^/]+)\/pages$/.exec(p))) return J({value: G.pages[x[1]] || []});
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

    // the note toolbar and Open Notes
    ok(/Open in OneNote/.test(await page.evaluate(id => SBONENOTE.saveBtn(id), cell.id)), "a note from OneNote offers Open in OneNote");
    await page.click('#onBody [data-act="on-open-board"]'); await page.waitForTimeout(300);
    ok(await page.locator("dialog[open]").count() === 0, "Open Notes goes to the board");

    // Save to OneNote: the first time asks where, then saves there
    await page.evaluate(() => { const s = SBIMPORT.state(); s.notes.mine1 = {id: "mine1", text: "Exam tips\n\n• Sleep well\n☐ Pack a calculator", color: "yellow", x: 40, y: 40, z: 1, rot: 0, courseId: "bio", archived: false, shape: "", pin: "", stickers: []}; });
    ok(/Save to OneNote/.test(await page.evaluate(() => SBONENOTE.saveBtn("mine1"))), "a Studyboard note offers Save to OneNote");
    await act("on-save", "mine1"); await page.waitForSelector("#onSec");
    ok(/Where should Save to OneNote put pages/.test(await page.textContent("#onBody")), "the first save asks for a section");
    await page.selectOption("#onSec", "0"); await page.click('#onBody [data-act="on-save-here"]');
    await page.waitForFunction(() => __G.posts.length === 1 && SBIMPORT.state().notes.mine1.onSaved, null, {timeout: 10000});
    const post = await page.evaluate(() => __G.posts[0]);
    ok(post.sid === "S2" && post.type === "text/html", "posted to the chosen section as HTML");
    ok(post.body.includes("<title>Exam tips</title>") && post.body.includes("<ul><li>Sleep well</li></ul>") && post.body.includes('<p data-tag="to-do">Pack a calculator</p>'), "the page has the note's title, list and to-do");
    ok((await S()).on.saveTo.sid === "S2", "the section is remembered");
    ok(/Open in OneNote/.test(await page.evaluate(() => SBONENOTE.saveBtn("mine1"))) && /Save Again/.test(await page.evaluate(() => SBONENOTE.saveBtn("mine1"))), "after saving: Open in OneNote and Save Again");
    await act("on-save", "mine1"); await page.waitForFunction(() => __G.posts.length === 2, null, {timeout: 10000});
    ok(true, "the next save goes straight there");

    // tokens are reused, not asked for each call
    ok(await page.evaluate(() => __G.tokens) === 1, "one access token for all of it");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\nonenote.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
