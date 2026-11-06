// node tests/native-save-links.e2e.js: in the phone apps (real native bridge, stand-in Capacitor plugins)
// - Export Backup writes the file with @capacitor/filesystem and opens @capacitor/share; "saved" shows only when that worked,
//   cancelling says nothing, and a build without the plugins says so instead of pretending.
// - a deep link or reminder tap while the app is running opens in place (no reload); http:// links open in the browser sheet.
const assert = require("assert"); let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const http = require("http"), fs = require("fs"), path = require("path");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css"};
const server = http.createServer((req, res) => { let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
const BRIDGE = fs.readFileSync(path.join(root, "ios-wrapper", "native-bridge.js"), "utf8");
const SEED = {v: 2, courses: [], tasks: [{id: "t1", title: "Lab report", due: "2030-01-01", status: "todo", created: 1}], decks: [], files: [], events: [], notes: [], settings: {}, updated: 1};
async function open(b, plugins){
  const ctx = await b.newContext({viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true});
  await ctx.addInitScript(([seed, plugins]) => { window.__SB_TEST = true; try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(seed)); } catch (e) {}
    window.StudyboardDevice = Object.freeze({idiom: "phone"});
    window.__L = {}; window.__log = []; window.__share = "ok";
    const listen = (ev, fn) => { window.__L[ev] = fn; return Promise.resolve({remove(){}}); };
    const P = {ScreenOrientation: {lock: () => Promise.resolve(), unlock: () => Promise.resolve()}, Keyboard: {setScroll: () => Promise.resolve(), setAccessoryBarVisible: () => Promise.resolve(), addListener: listen},
      App: {addListener: listen}, Browser: {open: o => { window.__log.push("browser:" + o.url); return Promise.resolve(); }},
      PushNotifications: {addListener: listen, checkPermissions: () => Promise.resolve({receive: "prompt"})}};
    window.__files = {};
    if (plugins) Object.assign(P, {Filesystem: {writeFile: o => { window.__log.push("write:" + o.directory + ":" + o.path + ":" + atob(o.data).slice(0, 25)); window.__files[o.path] = atob(o.data); return Promise.resolve({uri: "file:///cache/" + o.path}); },
        appendFile: o => { window.__appends = (window.__appends || 0) + 1; window.__files[o.path] += atob(o.data); return Promise.resolve(); },
        stat: o => Promise.resolve({size: (window.__files[o.path] || "").length}), deleteFile: o => { delete window.__files[o.path]; return Promise.resolve(); }},
      Share: {share: o => { window.__log.push("share:" + o.files[0]); return window.__share === "ok" ? Promise.resolve({}) : Promise.reject(new Error(window.__share)); }}});
    window.Capacitor = {isNativePlatform: () => true, getPlatform: () => "ios", Plugins: P}; }, [SEED, plugins]);
  await ctx.addInitScript(BRIDGE);
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForFunction(() => window.__sbSync && window.SBOPEN); await page.waitForTimeout(600);
  await page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); window.__alive = 1; window.__exp = () => { const x = document.createElement("button"); x.dataset.act = "export-json"; x.hidden = true; document.body.appendChild(x); x.click(); x.remove(); }; });
  return {ctx, page, errs};
}
(async () => {
  await new Promise(r => server.listen(0, r));
  const b = await chromium.launch({executablePath});
  try {
    { const {ctx, page, errs} = await open(b, true);
      const toastAfter = async fn => { await page.evaluate(() => { document.getElementById("toastMsg").textContent = ""; }); await page.evaluate(fn); await page.waitForTimeout(300); return page.evaluate(() => document.getElementById("toastMsg").textContent); };
      let t = await toastAfter(() => window.__exp());
      const log = await page.evaluate(() => window.__log.slice());
      ok(/^write:CACHE:studyboard-backup-\d{4}-\d\d-\d\d\.json:\{\s+"app": "studyboard"/.test(log[0] || ""), "Export Backup writes the backup to the app's cache: " + log[0]);
      ok(/^share:file:\/\/\/cache\/studyboard-backup-/.test(log[1] || ""), "and offers it in the share sheet: " + log[1]);
      ok(t === "Backup file saved", "and says saved only after that: " + t);
      // a big backup (uploaded files make them hundreds of MB) is written in pieces and comes out whole
      await page.evaluate(() => { const S = window.__sbSync, big = "x".repeat(7.5e6); S.applyChanges([{kind: "note", id: "bignote", after: {id: "bignote", title: "Big", body: big, courseId: "", created: 1, updated: 1}}], "big"); window.__log = []; window.__appends = 0; });
      await page.waitForTimeout(300);
      t = await toastAfter(() => window.__exp()); await page.waitForTimeout(1500);
      const big = await page.evaluate(() => { const k = Object.keys(window.__files).find(n => /backup/.test(n)); const txt = window.__files[k]; let notes = null; try { notes = JSON.parse(txt).notes; } catch (e) {} return {appends: window.__appends, len: txt.length, ok: !!notes && notes.some(n => n.id === "bignote" && n.body.length === 7.5e6)}; });
      ok(big.appends >= 2 && big.ok, "a large backup is written in pieces and reads back whole: " + JSON.stringify(big));
      await page.evaluate(() => { window.__share = "Share canceled"; localStorage.removeItem("studioso:lastExport"); });
      t = await toastAfter(() => window.__exp());
      ok(t === "" && !(await page.evaluate(() => localStorage.getItem("studioso:lastExport"))), "cancelling the share sheet says nothing and isn't counted as a backup: " + JSON.stringify(t));
      await page.evaluate(() => { window.__share = "boom"; });
      t = await toastAfter(() => window.__exp());
      ok(/^Couldn't open the share sheet/.test(t), "a share-sheet failure is reported: " + t);
      // deep links while the app is running: in place, no reload
      await page.evaluate(() => window.__L.appUrlOpen({url: "studyboard://action/search"})); await page.waitForTimeout(500);
      ok(await page.evaluate(() => window.__alive === 1), "studyboard://action/search with the app running doesn't reload the page");
      await page.evaluate(() => window.__L.pushNotificationActionPerformed({notification: {data: {taskId: "t1", rid: "r1"}}})); await page.waitForTimeout(600);
      ok(await page.evaluate(() => window.__alive === 1 && document.querySelector("dialog[open]") && /Lab report/.test(document.querySelector("dialog[open]").innerHTML)), "tapping a reminder with the app running opens its task in place");
      await page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); window.__L.appUrlOpen({url: "https://studyboardapp.com/?deck=ABCD-EFGH"}); }); await page.waitForTimeout(300);
      ok(await page.evaluate(() => window.__alive === 1 && /"kind":"deck"/.test(localStorage.getItem("sb:grpPending") || "")), "a deck link with the app running is queued for the deck sheet, no reload");
      // http:// links open in the browser sheet instead of doing nothing
      await page.evaluate(() => { window.open("http://example.edu/syllabus"); window.open("javascript:alert(1)"); });
      ok(JSON.stringify(await page.evaluate(() => window.__log.filter(x => /^browser:/.test(x)))) === '["browser:http://example.edu/syllabus"]', "http:// links open in the in-app browser; other schemes still don't");
      ok(!errs.length, "no page errors: " + errs.join("; "));
      await ctx.close(); }
    { const {ctx, page, errs} = await open(b, false);
      await page.evaluate(() => window.__exp()); await page.waitForTimeout(300);
      const t = await page.evaluate(() => document.getElementById("toastMsg").textContent);
      ok(/isn't available in this version of the app/.test(t) && !(await page.evaluate(() => localStorage.getItem("studioso:lastExport"))), "without the file plugins, Export Backup says it can't save instead of \"saved\": " + t);
      ok(!errs.length, "no page errors: " + errs.join("; "));
      await ctx.close(); }
  } finally { await b.close(); server.close(); }
  console.log(`\n${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
