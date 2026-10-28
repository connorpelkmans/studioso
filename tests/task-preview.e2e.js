// Clicking a task opens a preview with a draggable progress bar; Edit opens the form
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let checks = 0; const ok = (c, m) => { checks++; if (!c) { console.log("FAIL:", m); process.exitCode = 1; } };
const OUT = process.env.SHOTS || "";
const COURSE = {id: "c1", name: "Nursing", code: "BSNC 1030", color: "#D7262E"};
const T = (id, title, extra) => Object.assign({id, title, courseId: "c1", type: "Assignment", start: "2026-10-01", due: "2026-10-12", time: "07:00", priority: "med", status: "todo", notes: "", hours: 2, checklist: [], pct: 0, dependsOn: [], history: [], created: 1, order: 10, doneAt: null}, extra);
const TASKS = [T("t1", "Sim (CH1) Reflection", {notes: "Reflect on the simulation, 2 pages."}), T("t2", "Care Plan", {checklist: [{id: "a", text: "Assessment", done: true}, {id: "b", text: "Diagnosis", done: false}], order: 20})];
const seed = ([tasks, course]) => {
  localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("sb:onboarded", "1");
  if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [course], tasks, files: [], notes: [], decks: [], events: [], settings: {capacity: 15, dailyHours: 4}, updated: 1}));
};
// Paint the layers under the coloured header two different colours: if the corner pixels change, a pale sliver can show
async function cornerLeak(p){
  await p.waitForTimeout(700); await p.evaluate(() => Promise.all(document.getAnimations().filter(a => { const t = a.effect && a.effect.getComputedTiming(); return t && isFinite(t.endTime); }).map(a => a.finished.catch(() => {}))));
  const grab = async col => {
    await p.evaluate(col => { for (const el of [document.querySelector("#dlg"), document.querySelector("#dlg > .sheet")]) { const cs = getComputedStyle(el); if (el.dataset.bg == null) { el.dataset.bg = cs.backgroundColor; el.dataset.bgi = cs.backgroundImage; }
      if (!/rgba\(0, 0, 0, 0\)|transparent/.test(el.dataset.bg)) el.style.setProperty("background-color", col, "important");
      if (el.dataset.bgi && el.dataset.bgi !== "none") el.style.setProperty("background-image", el.dataset.bgi.replace(/rgba?\([^)]*\)/g, m => m === "rgba(0, 0, 0, 0)" ? m : col), "important"); } }, col);
    await p.waitForTimeout(150);
    const r = await p.evaluate(() => { const d = document.querySelector("#dlg").getBoundingClientRect(); return {x: d.left, y: d.top, w: d.width}; });
    const out = []; for (const x of [r.x, r.x + r.w - 26]) out.push((await p.screenshot({clip: {x, y: r.y, width: 26, height: 26}})).toString("base64")); return out;
  };
  const A = await grab("#ff00ff"), B = await grab("#00ff00");
  await p.evaluate(() => { for (const el of [document.querySelector("#dlg"), document.querySelector("#dlg > .sheet")]) { el.style.removeProperty("background-color"); el.style.removeProperty("background-image"); delete el.dataset.bg; delete el.dataset.bgi; } });
  let worst = 0;
  for (let k = 0; k < 2; k++) worst = Math.max(worst, await p.evaluate(async ([a, b]) => { const px = async s => { const img = new Image(); img.src = "data:image/png;base64," + s; await img.decode(); const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const x = c.getContext("2d"); x.drawImage(img, 0, 0); return x.getImageData(0, 0, c.width, c.height).data; };
    const da = await px(a), db = await px(b); let w = 0; for (let i = 0; i < da.length; i++) w = Math.max(w, Math.abs(da[i] - db[i])); return w; }, [A[k], B[k]]));
  return worst;
}
const task = (p, id) => p.evaluate(id => JSON.parse(localStorage.getItem("coursework:v2")).tasks.find(t => t.id === id), id);
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({executablePath});
  for (const W of [1280, 390]) {
    const ctx = await browser.newContext({viewport: {width: W, height: 860}, timezoneId: "America/New_York", locale: "en-US", serviceWorkers: "block", hasTouch: W < 600, deviceScaleFactor: W < 600 ? 3 : 1});
    const p = await ctx.newPage(), errs = []; p.on("pageerror", e => errs.push(e.message));
    await p.clock.install({time: new Date("2026-10-06T15:00:00-04:00")});
    await p.addInitScript(seed, [TASKS, COURSE]);
    await p.goto("http://127.0.0.1:" + server.address().port + "/index.html");
    await p.waitForFunction(() => window.__sbAvail && document.readyState === "complete", null, {timeout: 20000});
    await p.evaluate(() => window.__sbAvail.view({tab: "board", bview: "board"}));
    await p.waitForSelector('.card[data-id="t1"]');
    const tag = "w" + W;
    // Clicking a task shows a preview, not the form
    await p.click('.card[data-id="t1"]'); await p.waitForSelector("#dlg[open] .tv");
    ok(!(await p.locator("#dlg form").count()), tag + ": a click opens the preview, not the edit form");
    { const leak = await cornerLeak(p); ok(leak === 0, tag + ": no pale sliver at the header's top corners (preview): " + leak); }
    ok(/Sim \(CH1\) Reflection/.test(await p.textContent("#dlg .occv-title")) && /Reflect on the simulation/.test(await p.textContent("#dlg")), tag + ": the preview shows the title and notes");
    // Drag the bar to about 60%
    const box = await p.locator("#tvBar").boundingBox();
    await p.mouse.move(box.x + 2, box.y + box.height / 2); await p.mouse.down();
    await p.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2, {steps: 4});
    await p.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2, {steps: 4}); await p.mouse.up(); await p.waitForTimeout(250);
    let t1 = await task(p, "t1");
    ok(t1.pct === 60 && t1.status === "doing", tag + ": dragging the bar saves 60% and moves it to In Progress: " + t1.pct + " " + t1.status);
    ok((await p.textContent("#tvPct")) === "60%" && await p.locator("#dlg[open] .tv").count() === 1, tag + ": the preview stays open and shows 60%");
    if (OUT) await p.screenshot({path: path.join(OUT, `preview-${tag}.png`)});
    // Undo puts it back, and the open preview follows
    await p.click("#toastUndo"); await p.waitForTimeout(250);
    t1 = await task(p, "t1"); ok(t1.pct === 0 && t1.status === "todo" && (await p.textContent("#tvPct")) === "0%", tag + ": Undo restores 0% in the open preview: " + t1.pct);
    // Keyboard: arrows nudge by 5 and save shortly after
    await p.focus("#tvBar"); await p.keyboard.press("ArrowRight"); await p.keyboard.press("ArrowRight"); await p.waitForTimeout(900);
    t1 = await task(p, "t1"); ok(t1.pct === 10, tag + ": arrow keys change it too: " + t1.pct);
    await p.keyboard.press("End"); await p.waitForTimeout(900);
    t1 = await task(p, "t1"); ok(t1.pct === 100 && t1.status === "done", tag + ": 100% marks it done: " + t1.status);
    // Edit opens the full form
    await p.click("#dlg #tvEdit"); await p.waitForSelector('#dlg form.sheet input[name="title"]');
    { const leak = await cornerLeak(p); ok(leak === 0, tag + ": no pale sliver at the header's top corners (edit form): " + leak); }
    ok(await p.inputValue('#dlg input[name="pct"]') === "100", tag + ": Edit opens the form with the new progress");
    await p.keyboard.press("Escape"); await p.waitForTimeout(250);
    // Checklist-driven progress: the bar is read-only and the steps can be ticked
    await p.click('.card[data-id="t2"]'); await p.waitForSelector("#dlg[open] .tv");
    ok(await p.getAttribute("#tvBar", "role") === "progressbar" && (await p.textContent("#tvPct")) === "50%", tag + ": a checklist task shows its checklist progress, not a slider");
    await p.click('#dlg [data-tv-cl="1"]'); await p.waitForTimeout(250);
    const t2 = await task(p, "t2"); ok(t2.checklist[1].done && (await p.textContent("#tvPct")) === "100%", tag + ": ticking a step saves and updates the bar");
    // Mark Done closes the preview
    await p.keyboard.press("Escape"); await p.waitForTimeout(200);
    ok(!errs.length, tag + ": no page errors: " + errs.join(" | "));
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log(`task-preview.e2e: ${checks} checks ${process.exitCode ? "FAILED" : "passed"}`);
})().catch(e => { console.error(e); process.exit(1); });
