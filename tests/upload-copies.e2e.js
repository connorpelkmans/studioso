// Browser test: uploads kept in Studyboard also get a copy in the student's Google Drive or OneDrive, in a folder per course
// (a class's files in <course>/Lectures/<date> <class>); none when the Studyboard folder on this computer is already inside that
// drive; and a file uploaded into a class's folder in Files shows on that class's page in the Lectures tab.
// Run: node tests/upload-copies.e2e.js
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const FILE = "file://" + path.join(__dirname, "..", "index.html");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const NOW = new Date(2026, 9, 5, 12, 0, 0), KEY = "2026-10-05|10:00|Lecture";
const SEED = {v: 2, updated: 1, tasks: [], notes: [], decks: [], files: [], settings: {capacity: 15, dailyHours: 3},
  courses: [{id: "c1", name: "Biology", code: "BIO 101", color: "#3B6FE0", created: NOW.getTime() - 30 * 864e5, classDates: {from: "2026-09-07", until: "2026-12-11"},
    meetings: [{id: "m1", kind: "Lecture", days: [1, 3], start: "10:00", end: "11:20", where: "Hall B"}]}]};

// In the page: Studyboard storage, the cloud-files function and fake Google Drive / OneDrive
function stubs(provs){
  const P = window.__sbProStudy, C = window.__sbCloud, W = window.__cl = {g: [], gFolders: new Map(), ms: [], n: 0};
  P.caps.assets = {upload: async (file, o) => ({id: "up-" + (++W.n), sizeBytes: file.size, contentType: o.type})};
  C.setCache({accounts: provs.map(p => ({provider: p, account: "sam@example.com", status: "ok"})), providers: {google: true, microsoft: true}});
  C.T.transport = async b => b.action === "token" ? {ok: true, status: 200, data: {access: b.provider[0] + "-at", expires_in: 3600}} : b.action === "status" ? {ok: true, status: 200, data: {accounts: C.cache().accounts, providers: {google: true, microsoft: true}}} : {ok: false, status: 400, data: {}};
  const json = o => new Response(JSON.stringify(o), {status: 200, headers: {"content-type": "application/json"}});
  C.T.fetch = async (url, init) => {
    init = init || {}; const u = new URL(url), m = (init.method || "GET").toUpperCase();
    if (u.host === "www.googleapis.com") {
      if (u.pathname === "/drive/v3/files" && m === "GET") { const q = u.searchParams.get("q"), nm = /name='([^']+)'/.exec(q)[1], par = /'([^']+)' in parents/.exec(q)[1];
        const hit = [...W.gFolders.values()].find(f => f.name === nm && f.parent === par); return json({files: hit ? [{id: hit.id}] : []}); }
      if (u.pathname === "/drive/v3/files" && m === "POST") { const b = JSON.parse(init.body), id = "gf" + (++W.n); W.gFolders.set(id, {id, name: b.name, parent: b.parents[0]}); return json({id}); }
      if (u.pathname === "/upload/drive/v3/files") { const t = await new Response(init.body).text(), meta = JSON.parse(/\r\n\r\n(\{.*?\})\r\n/s.exec(t)[1]), id = "gd" + (++W.n);
        const trail = []; for (let p = meta.parents[0]; p && p !== "root"; p = (W.gFolders.get(p) || {}).parent) trail.unshift((W.gFolders.get(p) || {}).name);
        W.g.push(trail.concat(meta.name).join("/")); return json({id, name: meta.name, mimeType: "text/plain", size: "5", webViewLink: "https://drive.google.com/file/d/" + id + "/view"}); }
    }
    if (u.host === "graph.microsoft.com" && m === "PUT") { const p = decodeURIComponent(u.pathname).replace("/v1.0/me/drive/root:/", "").replace(/:\/content$/, ""); W.ms.push(p); return json({id: "od" + (++W.n), name: p.split("/").pop(), size: 5, webUrl: "https://onedrive.live.com/x"}); }
    throw new Error("unexpected " + m + " " + url);
  };
}

(async () => {
  const browser = await chromium.launch({executablePath});
  const errs = [];
  async function open(provs){
    const ctx = await browser.newContext({viewport: {width: 1200, height: 900}});
    await ctx.addInitScript(([seed, now]) => {
      const D = Date, off = now - D.now(); window.Date = class extends D { constructor(...a){ super(...(a.length ? a : [D.now() + off])); } static now(){ return D.now() + off; } };
      localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1");
    }, [SEED, NOW.getTime()]);
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(FILE); await page.waitForFunction(() => window.SBCLOUD && window.__sbCloud && window.__sbProStudy && window.SBCLS);
    await page.evaluate(stubs, provs);
    return {ctx, page};
  }
  const files = page => page.evaluate(() => Object.values(window.__sbProStudy.state().files));
  const upload = async (page, name) => page.setInputFiles("#fUploadIn", [{name, mimeType: "text/plain", buffer: Buffer.from("notes")}]);

  // 1. Google Drive connected, uploads kept in Studyboard
  {
    const {ctx, page} = await open(["google"]);
    await page.evaluate(() => { const P = window.__sbProStudy; Object.assign(P.ui, {tab: "files", fCourse: "c1", fFolder: "assignments", fCls: ""}); P.render(); });
    await upload(page, "Problem set 3.txt");
    await page.waitForFunction(() => Object.values(window.__sbProStudy.state().files).some(f => f.name === "Problem set 3.txt" && f.copy));
    let f = (await files(page)).find(x => x.name === "Problem set 3.txt");
    ok(f.kind === "file" && f.copy.p === "google" && /drive\.google\.com/.test(f.copy.url), "a Files upload stays in Studyboard, with a copy in Google Drive noted on it");
    ok((await page.evaluate(() => window.__cl.g)).includes("Studyboard/BIO 101/Problem set 3.txt"), "the copy is in Studyboard > BIO 101 in Google Drive");

    // the reverse way: uploaded into a class's folder in Files, it's on the class's page in the Lectures tab
    await page.evaluate(k => { const P = window.__sbProStudy; Object.assign(P.ui, {fFolder: "notes", fCls: k}); P.render(); }, KEY);
    await upload(page, "Week 5 slides.txt");
    await page.waitForFunction(() => Object.values(window.__sbProStudy.state().files).some(f => f.name === "Week 5 slides.txt" && f.copy));
    f = (await files(page)).find(x => x.name === "Week 5 slides.txt");
    ok(f.cls === KEY && f.folderId === "notes" && f.courseId === "c1", "a file uploaded into a class's folder in Files is linked to that class");
    ok((await page.evaluate(() => window.__cl.g)).some(p => /^Studyboard\/BIO 101\/Lectures\/2026-10-05 Lecture \d+\/Week 5 slides\.txt$/.test(p)), "its copy is in the class's own folder under Lectures: " + (await page.evaluate(() => window.__cl.g)).join(", "));
    await page.evaluate(() => { const P = window.__sbProStudy; Object.assign(P.ui, {tab: "courses", courseId: "c1", fCls: ""}); P.render(); });
    ok(await page.evaluate(k => window.SBCLS.itemsOf("c1", k).files.some(f => f.name === "Week 5 slides.txt"), KEY), "the class's items include it");
    await page.evaluate(k => window.SBCLS.open("c1", k), KEY); await page.waitForSelector("#dlg .cls-sheet");
    ok(/Week 5 slides\.txt/.test(await page.textContent("#dlg .cls-sheet")), "and it's on the class page, opened from the Lectures tab");

    // turned off: no copy
    await page.evaluate(() => { window.SBCLOUD.setPrefs({copy: "off"}); const P = window.__sbProStudy; P.dlg().close(); Object.assign(P.ui, {tab: "files", fCourse: "c1", fFolder: "other", fCls: ""}); P.render(); });
    const before = (await page.evaluate(() => window.__cl.g)).length;
    await upload(page, "Kept here.txt");
    await page.waitForFunction(() => Object.values(window.__sbProStudy.state().files).some(f => f.name === "Kept here.txt")); await page.waitForTimeout(400);
    ok((await page.evaluate(() => window.__cl.g)).length === before && !(await files(page)).find(x => x.name === "Kept here.txt").copy, "with copies turned off, nothing goes to Google Drive");
    await ctx.close();
  }

  // 2. OneDrive connected, and the Studyboard folder on this computer is inside OneDrive: no second copy
  {
    const {ctx, page} = await open(["microsoft"]);
    await page.evaluate(() => { Object.assign(window.__sbCloud.FSB, {where: "C:\\Users\\Sam\\OneDrive\\Studyboard", status: "on"}); const P = window.__sbProStudy; Object.assign(P.ui, {tab: "files", fCourse: "c1", fFolder: "other", fCls: ""}); P.render(); });
    await upload(page, "Reading.txt");
    await page.waitForFunction(() => Object.values(window.__sbProStudy.state().files).some(f => f.name === "Reading.txt")); await page.waitForTimeout(400);
    ok(!(await page.evaluate(() => window.__cl.ms)).length && !(await files(page)).find(x => x.name === "Reading.txt").copy, "with the Studyboard folder already in OneDrive, no copy is uploaded to OneDrive");
    await page.evaluate(() => window.SBCLOUD.open()); await page.waitForSelector("#clBody .cl-copy");
    ok(/already in OneDrive/.test(await page.textContent("#clBody")), "Cloud Storage says why");
    // a folder elsewhere: the copy goes to OneDrive
    await page.evaluate(() => { window.__sbProStudy.dlg().close(); window.__sbCloud.FSB.where = "C:\\Users\\Sam\\Documents\\Studyboard"; });
    await upload(page, "Lab sheet.txt");
    await page.waitForFunction(() => Object.values(window.__sbProStudy.state().files).some(f => f.name === "Lab sheet.txt" && f.copy));
    ok((await page.evaluate(() => window.__cl.ms)).includes("Studyboard/BIO 101/Lab sheet.txt"), "with the folder outside OneDrive, the copy goes to Studyboard > BIO 101 in OneDrive");
    await ctx.close();
  }

  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await browser.close();
  console.log(`upload-copies.e2e.js: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
