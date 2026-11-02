// node tests/doclinks.e2e.js
// Document links on a task: add a Google Doc and a Canva design in the task sheet, save, open them from the row and the Linked row
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

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: 1200, height: 900}}); await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(() => {
      window.__opened = []; window.open = u => { window.__opened.push(String(u)); return null; };
      if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1");
      const due = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
      localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [{id: "bio", name: "Biology", code: "BIO 101", color: "#3B6FE0"}],
        tasks: [{id: "t1", title: "Lab report", courseId: "bio", type: "Assignment", due, status: "todo", priority: "med", docs: [{url: "javascript:alert(1)"}]}], settings: {}}));
      localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done");
    });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.SBDOCS && window.SBIMPORT && document.querySelector('[data-act="menu"]'), null, {timeout: 40000}); await page.waitForTimeout(400);
    const task = () => page.evaluate(() => SBIMPORT.state().tasks.t1);
    const act = (a, id) => page.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; if (a === "edit-task") b.dataset.edit = "1"; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }, [a, id]);

    ok(!(await task()).docs, "a bad saved link is dropped when the task loads");

    await act("edit-task", "t1"); await page.waitForSelector("dialog[open] #dlFs");
    ok(/Google Docs, Microsoft 365, OneNote, Canva/.test(await page.textContent("#dlFs")), "the task sheet has a Documents section");
    await page.fill("#dlNew", "not a link"); await page.click("#dlAdd");
    ok(/doesn't look like a web address/.test(await page.textContent("#dlMsg")), "a bad link explains itself");
    await page.fill("#dlNew", "https://docs.google.com/document/d/1AbC/edit?usp=sharing"); await page.click("#dlAdd");
    await page.fill("#dlNew", "https://www.canva.com/design/DAFabc/xyz/edit"); await page.press("#dlNew", "Enter");
    ok(await page.locator("#dlList li").count() === 2, "two links in the list");
    ok(/Added Canva Design/.test(await page.textContent("#dlMsg")), "says which app it found");
    await page.fill('#dlList input[data-i="0"]', "Lab report draft");
    await page.click('#dlList [data-dl-open="1"]');
    ok((await page.evaluate(() => window.__opened)).pop() === "https://www.canva.com/design/DAFabc/xyz/edit", "Open in the sheet opens the link");
    ok(await page.locator("dialog[open] #dlFs").count() === 1, "and the task sheet stays open");
    // a link left in the box is kept on Save
    await page.fill("#dlNew", "https://contoso.sharepoint.com/:o:/s/bio/EAbc");
    await page.click("dialog[open] .sheet-foot [data-submit]"); await page.waitForTimeout(300);
    const t = await task();
    ok(t.docs && t.docs.length === 3, "saved with the task: " + JSON.stringify(t.docs));
    ok(t.docs.map(d => d.app).join() === "gdoc,canva,onenote", "apps found: " + t.docs.map(d => d.app));
    ok(t.docs[0].name === "Lab report draft", "the typed name is kept");

    // the row button
    await page.locator('[data-act="bview"][data-id="board"]:visible').first().click();
    await page.waitForTimeout(300);
    const btn = page.locator('.dl-go[data-id="t1"]:visible').first();
    ok(await btn.count() === 1, "a visible task row has a documents button");
    await btn.click(); await page.waitForSelector("dialog[open] .dl-pick");
    ok(await page.locator("dialog[open] .dl-pick [data-act=dl-url]").count() === 3, "several links open a short list");
    await page.locator("dialog[open] .dl-pick [data-act=dl-url]").first().click();
    ok((await page.evaluate(() => window.__opened)).pop() === "https://docs.google.com/document/d/1AbC/edit?usp=sharing", "picking one opens it");
    ok(await page.locator("dialog[open]").count() === 0, "and closes the list");

    // the task's view (what a tap on the task opens)
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "edit-task"; b.dataset.id = "t1"; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForSelector('dialog[open] [data-act="dl-url"]');
    const view = await page.textContent("dialog[open]");
    ok(/Lab report draft/.test(view) && /Canva Design/.test(view) && /OneNote Page/.test(view), "the task's view lists its documents");
    await page.locator('dialog[open] [data-act="dl-url"]').nth(1).click();
    ok((await page.evaluate(() => window.__opened)).pop() === "https://www.canva.com/design/DAFabc/xyz/edit" && await page.locator("dialog[open]").count() === 1, "opening one from the view keeps the view open");
    await page.evaluate(() => document.querySelector("dialog[open]").close());

    // the Linked row at the top of the task sheet
    await act("edit-task", "t1"); await page.waitForSelector("dialog[open] .lk-row");
    ok(await page.locator("dialog[open] .lk-row .k-doc").count() === 3, "the Linked row shows the documents");
    await page.locator("dialog[open] .lk-row .k-doc").nth(2).click();
    ok((await page.evaluate(() => window.__opened)).pop() === "https://contoso.sharepoint.com/:o:/s/bio/EAbc", "a chip opens its page");
    // remove one
    await page.click('#dlList [data-dl-rm="1"]');
    await page.click("dialog[open] .sheet-foot [data-submit]"); await page.waitForTimeout(300);
    ok((await task()).docs.length === 2, "removing a link and saving keeps the rest");

    // a 390px phone
    await page.setViewportSize({width: 390, height: 800});
    await act("edit-task", "t1"); await page.waitForSelector("dialog[open] #dlFs");
    ok(await page.evaluate(() => { const d = document.querySelector("dialog[open]"); return d.scrollWidth <= d.clientWidth + 1 && document.documentElement.scrollWidth <= 391; }), "the sheet fits a phone screen");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\ndoclinks.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
