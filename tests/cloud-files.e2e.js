// node tests/cloud-files.e2e.js   (Playwright + Chromium; see tests/pw.js)
// Google Drive and OneDrive (Studyboard Pro, module 99-pro): Files > Cloud, saving uploads there, cloud files in Files (open, read by AI,
// remove without deleting), moving a stored file to the cloud, a recording kept in the cloud, and watching OneDrive folders.
// The cloud-files function and both clouds are stand-ins inside the page, so every check is deterministic.
/* global fileBytes, readableFile, clone, applyChanges, fileHref -- copied onto window from __sbCloud.core below */
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": p.endsWith(".html") ? "text/html" : p.endsWith(".js") ? "text/javascript" : "application/octet-stream"});
  if (p === "/index.html") { res.end(csp.apply(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, updated: 1, tasks: [], notes: [], decks: [], settings: {},
  courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}, {id: "c2", name: "History of Art", code: "ART210", color: "#C2410C"}],
  files: [{id: "f1", name: "Reading 4.txt", courseId: "c1", folderId: "other", kind: "file", taskIds: [], desc: "", url: "", revs: [{assetId: "a-read4", name: "Reading 4.txt", size: 26, type: "text/plain", at: 1}]}]};

// In the page: the cloud-files function and fake Google Drive / OneDrive
function stubs(){
  const C = window.__sbCloud, W = window.__cl = {status: {accounts: [{provider: "google", account: "sam@gmail.com", status: "ok"}, {provider: "microsoft", account: "sam@outlook.com", status: "ok"}], providers: {google: true, microsoft: true}},
    tokenFail: 0, tokens: 0, g: {files: new Map(), n: 0, uploads: []}, ms: {items: new Map(), n: 0, puts: [], chunks: 0}};
  C.T.transport = async b => {
    if (b.action === "status") return {ok: true, status: 200, data: W.status};
    if (b.action === "start") return {ok: true, status: 200, data: {url: "https://x.supabase.co/functions/v1/cloud-files?begin=abc"}};
    if (b.action === "token") { W.tokens++; if (W.tokenFail) return {ok: false, status: W.tokenFail, data: {}}; return {ok: true, status: 200, data: {access: b.provider[0] + "-at", expires_in: 3600}}; }
    if (b.action === "disconnect") return {ok: true, status: 200, data: {ok: true}};
    return {ok: false, status: 400, data: {}};
  };
  // OneDrive: a tiny tree. root > School > (BIO101 Lectures > slides.pdf, Week 2 notes.docx), (ART210 > essay brief.pdf), random.txt
  const it = (id, name, parent, file, extra) => W.ms.items.set(id, Object.assign({id, name, parent, webUrl: "https://onedrive.live.com/?id=" + id, lastModifiedDateTime: "2026-10-01T10:00:00Z", createdDateTime: "2026-09-01T10:00:00Z"}, file ? {file: {mimeType: file}, size: 2048} : {folder: {childCount: 0}}, extra || {}));
  it("school", "School", "root"); it("bio", "BIO101 Lectures", "school"); it("art", "ART210", "school"); it("other", "Other Stuff", "root");
  it("s1", "slides week 1.pdf", "bio", "application/pdf"); it("s2", "Week 2 notes.docx", "bio", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  it("s3", "essay brief.pdf", "art", "application/pdf"); it("s4", "random.txt", "school", "text/plain"); it("s5", "~$lock.docx", "school", "x/y");
  const json = (o, status) => new Response(JSON.stringify(o), {status: status || 200, headers: {"content-type": "application/json"}});
  C.T.fetch = async (url, init) => {
    init = init || {}; const u = new URL(url), m = (init.method || "GET").toUpperCase(), auth = (init.headers || {}).Authorization || "";
    if (u.host === "www.googleapis.com") {
      if (auth !== "Bearer g-at") return json({}, 401);
      if (u.pathname === "/drive/v3/files" && m === "GET") { const q = u.searchParams.get("q"), nm = /name='([^']+)'/.exec(q), parent = /'([^']+)' in parents/.exec(q)[1], folder = /google-apps\.folder/.test(q);
        const meta = f => ({id: f.id, name: f.name, mimeType: f.folder ? "application/vnd.google-apps.folder" : "application/json", size: String((f.content || "").length), webViewLink: "https://drive.google.com/file/d/" + f.id + "/view", modifiedTime: f.mod || "2026-10-20T10:00:00Z"});
        const hits = [...W.g.files.values()].filter(f => !!f.folder === folder && f.parent === parent && (!nm || f.name === nm[1]));
        return json({files: hits.map(meta)}); }
      if (u.pathname === "/drive/v3/files" && m === "POST") { const b = JSON.parse(init.body); const id = "gf" + (++W.g.n); W.g.files.set(id, {id, name: b.name, parent: b.parents[0], folder: true}); return json({id}); }
      if (u.pathname === "/upload/drive/v3/files" && u.searchParams.get("uploadType") === "multipart") {
        const text = await new Response(init.body).text(); const meta = JSON.parse(/\r\n\r\n(\{.*?\})\r\n/s.exec(text)[1]); const id = "gd" + (++W.g.n);
        const content = text.split("\r\n\r\n")[2].replace(/\r\n--sb[a-z0-9]+--$/, "");
        W.g.files.set(id, {id, name: meta.name, parent: meta.parents[0], content}); W.g.uploads.push(meta);
        return json({id, name: meta.name, mimeType: "text/plain", size: String(content.length), webViewLink: "https://drive.google.com/file/d/" + id + "/view", modifiedTime: "2026-10-20T10:00:00Z"});
      }
      const pm = /^\/upload\/drive\/v3\/files\/([^/]+)$/.exec(u.pathname);
      if (pm && m === "PATCH") { const f = W.g.files.get(pm[1]); if (!f) return json({}, 404); f.content = await new Response(init.body).text(); f.mod = new Date().toISOString(); W.g.patches = (W.g.patches || 0) + 1; return json({id: f.id, name: f.name, mimeType: "application/json", size: String(f.content.length), webViewLink: "https://drive.google.com/file/d/" + f.id + "/view", modifiedTime: f.mod}); }
      const mm = /^\/drive\/v3\/files\/([^/]+)$/.exec(u.pathname);
      if (mm && m === "DELETE") { W.g.files.delete(mm[1]); return new Response(null, {status: 204}); }
      if (mm && u.searchParams.get("alt") === "media") { const f = W.g.files.get(mm[1]); return f ? new Response(f.content) : json({}, 404); }
    }
    if (u.host === "graph.microsoft.com") {
      if (auth !== "Bearer m-at") return json({}, 401);
      const p = decodeURIComponent(u.pathname.replace("/v1.0/me/drive", ""));
      let mm = /^\/items\/([^/]+)\/children$/.exec(p);
      if (mm) { const id = mm[1] === "root" ? "root" : mm[1]; if (id !== "root" && !W.ms.items.has(id)) return json({}, 404); return json({value: [...W.ms.items.values()].filter(x => x.parent === id)}); }
      mm = /^\/root:\/(.+):\/content$/.exec(p) || /^\/items\/([^/:]+):\/(.+):\/content$/.exec(p);
      if (mm && m === "PUT") { const id = "up" + (++W.ms.n), full = mm.length === 3 ? mm[1] + "/" + mm[2] : mm[1]; W.ms.puts.push(full); const body = await new Response(init.body).arrayBuffer(); return json({id, name: full.split("/").pop(), size: body.byteLength, file: {mimeType: (init.headers || {})["Content-Type"]}, webUrl: "https://onedrive.live.com/?id=" + id, lastModifiedDateTime: "2026-10-20T10:00:00Z"}); }
      mm = /^\/root:\/(.+):\/createUploadSession$/.exec(p);
      if (mm && m === "POST") { W.ms.session = mm[1]; return json({uploadUrl: "https://upload.onedrive.test/session1"}); }
      mm = /^\/items\/([^/]+)$/.exec(p);
      if (mm && m === "GET") { const x = W.ms.items.get(mm[1]); return x ? json(Object.assign({}, x, {"@microsoft.graph.downloadUrl": "https://download.onedrive.test/" + mm[1]})) : json({}, 404); }
    }
    if (u.host === "upload.onedrive.test") { W.ms.chunks++; const r = (init.headers || {})["Content-Range"]; const [, a, b, t] = /bytes (\d+)-(\d+)\/(\d+)/.exec(r); return Number(b) + 1 >= Number(t) ? json({id: "big1", name: W.ms.session.split("/").pop(), size: Number(t), file: {mimeType: "audio/webm"}, webUrl: "https://onedrive.live.com/?id=big1"}, 201) : new Response(null, {status: 202}); }
    if (u.host === "download.onedrive.test") return new Response("Text of " + u.pathname.slice(1));
    throw new Error("unexpected " + m + " " + url);
  };
}

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: 1200, height: 900}, serviceWorkers: "block"});
  await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} window.confirm = () => true; }, SEED);
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.goto(base); await page.waitForFunction(() => window.SBCLOUD && window.__sbCloud && window.SBPINPICK);
  await page.evaluate(() => { const T = window.SBPINPICK; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); window.ui = T.ui; window.render = T.render; });
  await page.evaluate(stubs);
  await page.evaluate(() => Object.assign(window, window.__sbCloud.core));

  // 1. Files > Cloud: connected accounts, where uploads go
  await page.evaluate(() => { ui.tab = "files"; render(); });
  await page.waitForSelector('.f-title [data-act="cl-open"]');
  ok(/Cloud/.test(await page.textContent('.f-title [data-act="cl-open"]')), "Files has a Cloud button");
  await page.click('.f-title [data-act="cl-open"]'); await page.waitForSelector("#clBody .cl-card");
  await page.waitForFunction(() => document.querySelectorAll("#clBody .cl-card").length === 2 && /sam@gmail\.com/.test(document.getElementById("clBody").textContent));
  ok(/sam@outlook\.com/.test(await page.textContent("#clBody")), "both accounts show, with their addresses");
  ok(await page.locator('#clBody input[name=clSave][value=studyboard]').isChecked(), "uploads stay in Studyboard until chosen");
  await page.check('#clBody input[name=clSave][value=google]');
  ok(await page.evaluate(() => SBCLOUD.target()) === "google", "choosing Google Drive makes it the upload target");
  await page.click('#dlg [data-act="close"]');
  await page.waitForFunction(() => /Google Drive/.test(document.querySelector('.f-title [data-act="cl-open"]').textContent));
  ok(true, "the Cloud button names where uploads go");

  // 2. Upload in Files -> Google Drive, in Studyboard/<course>
  await page.evaluate(() => { ui.fCourse = "c1"; ui.fFolder = "notes"; render(); });
  await page.setInputFiles("#fUploadIn", [{name: "Lab notes.txt", mimeType: "text/plain", buffer: Buffer.from("Mitochondria make ATP.")}]);
  await page.waitForFunction(() => Object.values(state.files).some(f => f.kind === "cloud" && f.name === "Lab notes.txt"));
  const g = await page.evaluate(() => { const f = Object.values(state.files).find(x => x.name === "Lab notes.txt"); const W = window.__cl; const parent = W.g.files.get(W.g.uploads[0].parents[0]), grand = W.g.files.get(parent.parent); return {f, parent: parent.name, grand: grand.name, gp: grand.parent}; });
  ok(g.f.cloud.p === "google" && g.f.courseId === "c1" && g.f.folderId === "notes" && /drive\.google\.com/.test(g.f.url), "the file is a Google Drive file in its course and folder");
  ok(g.parent === "BIO101" && g.grand === "Studyboard" && g.gp === "root", "saved in Studyboard > BIO101 in Google Drive");
  await page.waitForSelector('.frow .f-cloud');
  ok(/Google Drive/.test(await page.textContent(".frow .f-cloud")), "the row shows it's in Google Drive");
  ok(await page.getAttribute('.frow:has(.f-cloud) a.btn', "href") === g.f.url, "Open goes to Google Drive");
  // read back through the person's access (what Summarize and AI use)
  ok(await page.evaluate(async id => new TextDecoder().decode(await fileBytes(state.files[id])), g.f.id) === "Mitochondria make ATP.", "its bytes come back from Google Drive");
  // AI reads cloud files only when allowed (the checkbox while connecting); without it the file still opens
  ok(await page.evaluate(id => !readableFile(state.files[id]), g.f.id), "AI doesn't read Google Drive files until it's allowed");
  await page.evaluate(() => { const d = document.querySelector("dialog[open]"); if (d) d.close(); SBCLOUD.open(); });
  await page.waitForSelector('[data-cl-ai="google"]', {timeout: 5000});
  ok(await page.locator("[data-cl-ai]").count() === 2 && /still works/.test(await page.locator(".cl-ai").first().textContent()), "each account has an Allow AI checkbox that says the account still works without it");
  await page.check('[data-cl-ai="google"]'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => SBCLOUD.aiOk("google") && !SBCLOUD.aiOk("microsoft")), "ticking it allows AI for that account only");
  await page.evaluate(() => { const d = document.querySelector("dialog[open]"); if (d) d.close(); });
  ok(await page.evaluate(id => readableFile(state.files[id]), g.f.id), "allowed: AI can read it (Summarize)");
  ok((await page.evaluate(id => SBFILETEXT(id, 200), g.f.id)).includes("Mitochondria"), "and its text is available to course tools");
  // the file sheet: In your Google Drive, Remove (not Delete)
  await page.click(`.frow[data-fid="${g.f.id}"] .fmain`); await page.waitForSelector("#dlg .cl-info");
  ok(/In your Google Drive/.test(await page.textContent("#dlg .cl-info")), "its sheet says where it lives");
  ok((await page.textContent("#fsDel")).trim() === "Remove", "the button says Remove");
  await page.click("#fsDel");
  await page.waitForFunction(id => !state.files[id], g.f.id);
  ok(await page.evaluate(() => window.__cl.g.files.size) >= 3, "removing it in Studyboard leaves it in Google Drive");

  // 3. A token problem falls back to Studyboard storage... (local mode has none, so it says so) and marks Connect Again
  await page.evaluate(() => { window.__cl.tokenFail = 409; Object.keys(window.__sbCloud.TOK).forEach(k => delete window.__sbCloud.TOK[k]); });
  const r3 = await page.evaluate(async () => { try { await SBCLOUD.saveBlob("google", new Blob(["x"]), "x.txt", {courseId: "c1"}); return "saved"; } catch (e) { return e.message; } });
  ok(/connect it again/.test(r3), "revoked access asks to connect again: " + r3);
  ok(await page.evaluate(() => window.__sbCloud.cache().accounts.find(a => a.provider === "google").status) === "reauth", "and the account shows Connect Again");
  ok(await page.evaluate(() => SBCLOUD.target()) === "", "uploads go back to Studyboard while it's disconnected");
  await page.evaluate(() => { window.__cl.tokenFail = 0; window.__sbCloud.setCache({accounts: window.__cl.status.accounts}); });

  // 4. OneDrive: a stored file moves there (big recordings go up in pieces)
  await page.evaluate(() => SBCLOUD.setPrefs({save: "microsoft"}));
  await page.evaluate(() => { window.__sbCloud.T.bytes = async () => new TextEncoder().encode("Chapter 4: osmosis..."); });
  const moved = await page.evaluate(async () => { await SBCLOUD.move("f1", "microsoft"); return {f: state.files.f1, puts: window.__cl.ms.puts.slice()}; });
  ok(moved.f.kind === "cloud" && moved.f.cloud.p === "microsoft" && !moved.f.revs.length, "Move to OneDrive turns it into a OneDrive file");
  ok(moved.puts[0] === "Studyboard/BIO101/Reading 4.txt", "saved in OneDrive under Studyboard/BIO101: " + moved.puts[0]);
  const big = await page.evaluate(async () => { const b = new Blob([new Uint8Array(6 * 1048576)], {type: "audio/webm"}); return SBCLOUD.saveBlob("microsoft", b, "Lecture 3.webm", {courseId: "c1", folderId: "lectures", type: "audio/webm"}); });
  ok(big.id === "big1" && await page.evaluate(() => window.__cl.ms.chunks) === 2 && await page.evaluate(() => window.__cl.ms.session) === "Studyboard/BIO101/Lectures/Lecture 3.webm", "a 6 MB recording goes to Studyboard/BIO101/Lectures in two pieces");

  // 5. Watch a OneDrive folder
  await page.click('.f-title [data-act="cl-open"]'); await page.waitForSelector("#clBody .cl-card");
  await page.waitForSelector('#clBody [data-act="cl-browse"][data-mode="watch"]');
  await page.click('#clBody [data-act="cl-browse"][data-mode="watch"]');
  await page.waitForSelector('#clBody .cl-fold');
  ok((await page.locator("#clBody .cl-fold").allTextContents()).join("|").includes("School"), "the picker lists OneDrive's folders");
  await page.click('#clBody .cl-fold:has-text("School")'); await page.waitForSelector('#clBody [data-act="cl-pick"]');
  ok(/Watch “School”/.test(await page.textContent('#clBody [data-act="cl-pick"]')), "inside a folder you can watch it");
  await page.click('#clBody [data-act="cl-pick"]');
  await page.waitForFunction(() => Object.values(state.files).filter(f => f.cloud && f.cloud.w === "school").length === 4, null, {timeout: 10000});
  const w = await page.evaluate(() => Object.fromEntries(Object.values(state.files).filter(f => f.cloud && f.cloud.w === "school").map(f => [f.cloud.name, [f.courseId, f.folderId, f.id]])));
  ok(w["slides week 1.pdf"][0] === "c1" && w["slides week 1.pdf"][1] === "notes", "BIO101 Lectures/slides go to Biology, Lecture Notes");
  ok(w["essay brief.pdf"][0] === "c2", "ART210/ goes to History of Art");
  ok(w["random.txt"][0] === "" && !w["~$lock.docx"], "loose files go to General; Office lock files are skipped");
  ok(await page.evaluate(() => /School/.test(document.getElementById("clBody").textContent) && /4 files/.test(document.getElementById("clBody").textContent)), "the sheet lists the watched folder and its files");
  // a second check changes nothing; a file deleted in OneDrive leaves; one removed in Studyboard stays away
  const before = await page.evaluate(() => JSON.stringify(Object.values(state.files).filter(f => f.cloud && f.cloud.w).map(f => f.id).sort()));
  await page.evaluate(() => SBCLOUD.scan({quiet: true}));
  ok(await page.evaluate(() => JSON.stringify(Object.values(state.files).filter(f => f.cloud && f.cloud.w).map(f => f.id).sort())) === before, "checking again doesn't duplicate anything");
  await page.evaluate(id => { window.__cl.ms.items.delete("s4"); SBCLOUD.remove(state.files[id]); }, w["essay brief.pdf"][2]);
  await page.evaluate(() => SBCLOUD.scan({quiet: true}));
  const after = await page.evaluate(() => Object.values(state.files).filter(f => f.cloud && f.cloud.w).map(f => f.cloud.name).sort());
  ok(!after.includes("random.txt"), "a file deleted in OneDrive leaves Studyboard");
  ok(!after.includes("essay brief.pdf"), "a file removed in Studyboard isn't brought back");
  // moved by hand: the next check keeps it where you put it
  await page.evaluate(id => { const f = clone(state.files[id]); f.courseId = "c2"; f.folderId = "other"; f.cloud = Object.assign({}, f.cloud, {pin: true}); applyChanges([{kind: "file", id, after: f}], null); }, w["slides week 1.pdf"][2]);
  await page.evaluate(() => SBCLOUD.scan({quiet: true}));
  ok(await page.evaluate(id => state.files[id].courseId, w["slides week 1.pdf"][2]) === "c2", "a file you moved stays where you put it");
  // stop watching: its files leave Studyboard
  await page.click('#clBody [data-act="cl-unwatch"]');
  await page.waitForFunction(() => !Object.values(state.files).some(f => f.cloud && f.cloud.w));
  ok(true, "Stop Watching takes its files out of Studyboard");

  // 6. Locked (free): no Cloud button unless there are cloud files, and cloud files still open as links
  await page.evaluate(() => { SBPRO.locked = () => true; render(); });
  ok(await page.evaluate(() => SBCLOUD.target()) === "" && await page.evaluate(() => SBCLOUD.choices().length) === 0, "without Pro nothing goes to the cloud");
  ok(await page.locator('.f-title [data-act="cl-open"]').count() === 1, "the Cloud button stays while there are cloud files (to reconnect or upgrade)");
  ok(/onedrive/.test(await page.evaluate(() => fileHref(state.files.f1))), "a cloud file still opens in OneDrive");

  // 7a. Backups straight to Google Drive: Studyboard > Backups, replaced in place, the latest in Files, and in Restore a Backup
  await page.evaluate(() => { SBPRO.locked = () => false; const d = document.querySelector("dialog[open]"); if (d) d.close(); });
  await page.evaluate(() => SBCLOUD.backup.want("google"));
  await page.waitForFunction(() => SBCLOUD.backup.on() && !SBCLOUD.backup.state().busy && SBCLOUD.backup.state().last > 0, null, {timeout: 10000});
  const bk1 = await page.evaluate(() => { const W = window.__cl, fs = [...W.g.files.values()], folder = fs.find(f => f.folder && f.name === "Backups"), top = folder && fs.find(f => f.id === folder.parent);
    return {top: top && top.name, names: fs.filter(f => folder && f.parent === folder.id).map(f => f.name).sort(), rec: Object.values(state.files).find(f => f.name === "Studyboard Backup.json")}; });
  ok(bk1.top === "Studyboard" && bk1.names.length === 2 && bk1.names.includes("studyboard-latest.json") && bk1.names.some(n => /^studyboard-\d{4}-\d{2}-\d{2}\.json$/.test(n)), "a backup goes to Studyboard > Backups in Google Drive: " + bk1.names.join(", "));
  ok(bk1.rec && bk1.rec.kind === "cloud" && bk1.rec.cloud.p === "google" && bk1.rec.courseId === "", "the latest backup shows in Files like a saved file");
  await page.evaluate(() => SBCLOUD.backup.run()); await page.waitForTimeout(300);
  await page.waitForFunction(() => !SBCLOUD.backup.state().busy);
  const bk2 = await page.evaluate(() => { const fs = [...window.__cl.g.files.values()], folder = fs.find(f => f.folder && f.name === "Backups"); return {n: fs.filter(f => f.parent === folder.id).length, patches: window.__cl.g.patches || 0, recs: Object.values(state.files).filter(f => f.name === "Studyboard Backup.json").length}; });
  ok(bk2.n === 2 && bk2.patches >= 2 && bk2.recs === 1, "backing up again replaces them in place: no copies in Drive or in Files: " + JSON.stringify(bk2));
  const rs = await page.evaluate(async () => (await SBCLOUD.backup.restorable()).map(b => ({where: b.where, label: b.label, courses: (b.courses || []).length})));
  ok(rs.length === 1 && rs[0].where === "drive" && rs[0].label === "Google Drive" && rs[0].courses === 2, "and it's in Restore a Backup, read back from Google Drive: " + JSON.stringify(rs));
  await page.evaluate(() => SBCLOUD.backup.stop());
  ok(await page.evaluate(() => !SBCLOUD.backup.on()), "Stop turns cloud backups off");

  // 7. A saved summary: shown in the file list, and opens without AI being set up
  await page.evaluate(() => { const d = document.querySelector("dialog[open]"); if (d) d.close(); });
  await page.evaluate(() => { const f = state.files.f1; f.summary = {at: Date.now(), provider: "gemini", model: "", overview: "Osmosis moves water across membranes.", keyPoints: ["Water moves toward higher solute concentration."], keyTerms: [{term: "Osmosis", definition: "Diffusion of water"}], questions: []}; ui.fCourse = "all"; ui.fFolder = ""; render(); });
  ok(await page.locator('.frow[data-fid="f1"] .f-sum').count() === 1, "a file with a saved summary has a Summary button in the list");
  await page.click('.frow[data-fid="f1"] .f-sum');
  await page.waitForSelector("dialog[open] .sum-list", {timeout: 5000});
  ok(/Osmosis moves water/.test(await page.textContent("dialog[open]")), "it opens the saved summary straight away, with no AI call or setup");
  await page.evaluate(() => document.querySelector("dialog[open]").close());

  ok(errs.length === 0, "no page errors: " + errs.join("; "));
  await browser.close(); server.close(); console.log(n + " checks passed");
})().catch(e => { console.error(e); process.exit(1); });
