// node tests/qol-app.e2e.js (Playwright + Chromium) Focus after redraws, toasts, Back and page addresses, sync status, the month calendar on a small phone,
// keyboard shortcuts and the phone bottom bar
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp.js"), root = path.join(__dirname, "..");
const server = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {"content-type": f.endsWith(".html") ? "text/html" : f.endsWith(".js") ? "text/javascript" : f.endsWith(".css") ? "text/css" : f.endsWith(".json") ? "application/json" : "application/octet-stream"});
  if (p === "/index.html") r.end(csp.apply(fs.readFileSync(f, "utf8"))); else fs.createReadStream(f).pipe(r); });
const iso = d => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const SEED = () => ({v: 2, updated: 1, settings: {},
  courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}, {id: "c2", name: "Chemistry", code: "CHEM210", color: "#F2B233"}],
  tasks: [1, 2, 3, 4].map(i => ({id: "t" + i, title: "Lab report " + i, courseId: i % 2 ? "c1" : "c2", type: "Assignment", start: iso(0), due: iso(i + 1), status: "todo", hours: 1, created: i === 1 ? 1 : Date.now()}))});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const open = async (viewport, extra) => {
    const ctx = await browser.newContext(Object.assign({serviceWorkers: "block", viewport}, extra || {}));
    await ctx.addInitScript(seed => { try { if (!localStorage.getItem("sb:onboarded")) { localStorage.setItem("coursework:v2", JSON.stringify(seed));
      localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} }, SEED());
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    return {ctx, page, errs};
  };
  const ready = async (p, url) => { await p.goto(url || base); await p.waitForFunction(() => window.__sbProStudy, null, {timeout: 40000}); await p.waitForTimeout(900); };
  const H = (p, f, a) => p.evaluate(f, a);
  try {
    /* ---------- Computer ---------- */
    const {ctx, page, errs} = await open({width: 1280, height: 900});
    await ready(page);
    await H(page, () => { const S = window.__sbProStudy; S.ui.tab = "courses"; S.ui.courseId = "c1"; S.render(); });
    await page.waitForSelector('#view li.task [data-act="toggle"][data-id="t1"]:visible');

    // 1. Focus survives a redraw
    await page.locator('#view li.task [data-act="edit-task"][data-id="t3"]').focus();
    await H(page, () => window.__sbProStudy.render());
    ok(await H(page, () => { const a = document.activeElement; return a && a.dataset.act === "edit-task" && a.dataset.id === "t3" && !!a.closest("li.task"); }), "a background redraw keeps keyboard focus on the same task");
    await H(page, () => { document.activeElement.blur(); window.__sbProStudy.render(); });
    ok(await H(page, () => document.activeElement === document.body), "a redraw doesn't take focus when nothing on the page had it");
    await page.locator('#view li.task [data-act="toggle"][data-id="t1"]').focus();
    await page.keyboard.press("Enter"); await page.waitForTimeout(400);
    ok(await H(page, () => { const a = document.activeElement; return !!a && a !== document.body && document.getElementById("view").contains(a); }), "completing a task with Enter leaves focus on the page, not on the body: " + await H(page, () => { const a = document.activeElement; return a ? a.tagName + "." + (a.dataset.act || a.id) : "none"; }));
    await page.keyboard.press("Tab");
    ok(await H(page, () => document.getElementById("view").contains(document.activeElement)), "Tab carries on from there");

    // 3. Toasts
    const toastAt = () => H(page, () => { const t = document.getElementById("toast"); return {show: t.classList.contains("show"), role: t.getAttribute("role"), x: !!document.getElementById("toastX") && !document.getElementById("toastX").hidden, extra: document.getElementById("toastExtra").hidden ? "" : document.getElementById("toastExtra").textContent}; });
    const long = "Your browser may clear website data on its own. Keep your planner safe: install the app, sign in, or export a backup.";
    const toastFn = await H(page, () => typeof window.SBTOAST === "function");
    ok(toastFn, "the page exposes its toast helper for tests");
    await H(page, () => window.SBTOAST("Saved"));
    await page.waitForTimeout(3300);
    ok(!(await toastAt()).show, "a short toast hides after about 3 seconds");
    await H(page, m => window.SBTOAST(m), long);
    await page.waitForTimeout(3300);
    ok((await toastAt()).show, "a long toast is still there after 3 seconds (time to read it)");
    await page.waitForTimeout(6500);
    ok(!(await toastAt()).show, "and goes once it has had its time");
    await H(page, () => window.SBTOAST("Your saved data on this device couldn't be read.", null, {label: "Open Backups", fn: () => { window.__openedBackups = true; }}, {error: true}));
    let t = await toastAt();
    ok(t.show && t.role === "alert" && t.x && t.extra === "Open Backups", "an error toast is an alert with a Dismiss button and an Open Backups action");
    await page.waitForTimeout(10000);
    ok((await toastAt()).show, "an error toast stays until dismissed");
    await page.click("#toastExtra");
    ok(await H(page, () => window.__openedBackups === true) && !(await toastAt()).show, "Open Backups runs and closes it");
    await H(page, () => window.SBTOAST("Storage is full.", null, null, {error: true}));
    await page.click("#toastX");
    ok(!(await toastAt()).show && (await toastAt()).role === "alert", "Dismiss closes an error toast");
    await H(page, () => window.SBTOAST("Done"));
    ok((await toastAt()).role === "status", "an ordinary toast goes back to a polite status");

    // 4. Back, Forward, addresses and page titles
    await page.click('nav.tabs [data-tab="notes"]'); await page.waitForTimeout(250);
    ok(/[?&]view=notes\b/.test(page.url()) && /^Notes · Studyboard$/.test(await page.title()), "Notes has its own address and title: " + page.url() + " / " + await page.title());
    await page.click('nav.tabs [data-tab="courses"]'); await page.waitForTimeout(250);
    await page.click('#view .course-card[data-id="c2"], #view [data-act="open-course"][data-id="c2"]').catch(async () => { await H(page, () => { const S = window.__sbProStudy; S.ui.courseId = "c2"; S.render(); }); });
    await page.waitForTimeout(250);
    ok(/course=c2/.test(page.url()) && /^Chemistry · Studyboard$/.test(await page.title()), "a course has its own address and title: " + await page.title());
    await page.goBack(); await page.waitForTimeout(300);
    ok(await H(page, () => { const u = window.__sbProStudy.ui; return u.tab === "courses" && !u.courseId; }), "Back goes from a course to All Courses");
    await page.goBack(); await page.waitForTimeout(300);
    ok(await H(page, () => window.__sbProStudy.ui.tab) === "notes", "Back again goes to Notes");
    await page.goForward(); await page.waitForTimeout(300);
    ok(await H(page, () => window.__sbProStudy.ui.tab) === "courses", "Forward works too");
    await page.keyboard.press("n"); await page.waitForSelector("#dlg[open] form.sheet");
    await page.goBack(); await page.waitForTimeout(300);
    ok(await H(page, () => !document.getElementById("dlg").open && window.__sbProStudy.ui.tab === "courses"), "Back closes an open sheet first and stays on the page");
    await page.keyboard.press("n"); await page.waitForSelector("#dlg[open] form.sheet");
    await page.keyboard.press("Escape"); await page.waitForTimeout(300);
    await page.goBack(); await page.waitForTimeout(300);
    ok(await H(page, () => window.__sbProStudy.ui.tab) === "notes", "a sheet closed with Esc leaves no extra Back step");
    await page.goto(base + "?view=courses&course=c1"); await page.waitForFunction(() => window.__sbProStudy, null, {timeout: 40000}); await page.waitForTimeout(600);
    ok(await H(page, () => { const u = window.__sbProStudy.ui; return u.tab === "courses" && u.courseId === "c1"; }) && /Biology/.test(await page.title()), "a page address opens that page (a link or a refresh)");

    // 15. Shortcuts
    await page.click('nav.tabs [data-tab="board"]'); await page.waitForTimeout(200);
    await page.keyboard.press("2"); await page.waitForTimeout(250);
    ok(await H(page, () => ["timeline", "schedule", "crunch"].includes(window.__sbProStudy.ui.tab)), "2 opens the Calendar");
    await page.keyboard.press("Control+4"); await page.waitForTimeout(250);
    ok(await H(page, () => window.__sbProStudy.ui.tab) === "notes", "Ctrl+4 opens Notes");
    await page.keyboard.press("?"); await page.waitForSelector("#dlg[open] .kb-sheet");
    const help = await page.textContent("#dlg .kb-sheet");
    ok(/New task/.test(help) && /Settings/.test(help) && /Undo/.test(help) && /Board/.test(help), "? lists the shortcuts");
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);
    await page.keyboard.press("Control+,"); await page.waitForSelector("#dlg[open] .us");
    ok(await H(page, () => document.activeElement && document.activeElement.classList.contains("us-q")), "Ctrl+, opens Settings, with focus in Search Settings");
    ok(/Keyboard Shortcuts/.test(await page.textContent("#dlg")), "Settings links to Keyboard Shortcuts");
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);
    await page.click('nav.tabs [data-tab="board"]'); await page.waitForTimeout(250);
    await page.focus("#qaIn"); await page.keyboard.type("n2?");
    ok(await H(page, () => !document.getElementById("dlg").open && window.__sbProStudy.ui.tab === "board" && document.getElementById("qaIn").value === "n2?"), "no shortcut fires while typing in a box");
    await H(page, () => { const i = document.getElementById("qaIn"); i.value = ""; i.dispatchEvent(new Event("input", {bubbles: true})); i.blur(); });
    await page.keyboard.press("n"); await page.waitForSelector("#dlg[open] form.sheet");
    ok(await H(page, () => document.activeElement && document.activeElement.name === "title") && await H(page, () => { const f = document.querySelector("#dlg form.sheet"), ti = f.querySelector('[name="title"]'), ty = f.querySelector('[name="type"]'); return !!(ti.compareDocumentPosition(ty) & Node.DOCUMENT_POSITION_FOLLOWING); }), "N opens New Task with focus in Title, which comes first");
    await page.keyboard.press("Escape");

    // 16. Skip to Navigation
    await page.keyboard.press("Tab"); await page.keyboard.press("Tab").catch(() => {});
    await H(page, () => document.querySelector('a.skip-link[href="#navTabs"]').click());
    ok(await H(page, () => !!document.activeElement.closest("nav.tabs")), "Skip to Navigation moves focus into the side menu");

    // 17. Tooltips for icon-only controls
    await page.click('nav.tabs [data-tab="notes"]'); await page.waitForTimeout(300);
    const ic = page.locator('#view button.icon-btn[aria-label]:visible, #view .nbz-b[aria-label]:visible').first();
    await ic.hover(); await page.waitForTimeout(800);
    const tipT = await H(page, () => { const t = document.querySelector(".sb-tip"); return t ? t.textContent : ""; });
    ok(!!tipT && tipT === await ic.getAttribute("aria-label"), "hovering an icon-only button shows its name in a tooltip: " + tipT);
    ok(await H(page, () => !document.querySelector("nav.tabs [title]")), "the side menu buttons carry no title attributes");

    ok(errs.length === 0, "no page errors on a computer: " + errs.join(" | "));
    await ctx.close();

    /* ---------- Phone, 360 px ---------- */
    const P = await open({width: 360, height: 740}, {hasTouch: true, isMobile: true});
    await ready(P.page);
    await H(P.page, () => { const S = window.__sbProStudy; S.ui.tab = "timeline"; S.ui.tlMode = "calendar"; S.render(); });
    await P.page.waitForTimeout(400);
    const cal = await H(P.page, () => { const cells = [...document.querySelectorAll("#view .cal .day")]; const last = cells[6]; const r = last && last.getBoundingClientRect(); return {n: cells.length, right: r ? r.right : 0, w: innerWidth, sw: document.documentElement.scrollWidth}; });
    ok(cal.n >= 28 && cal.right <= cal.w && cal.sw <= cal.w, "the month calendar fits at 360 px, Saturday included: " + JSON.stringify(cal));
    const bar = await H(P.page, () => [...document.querySelectorAll("nav.tabs .in > button")].filter(b => b.offsetParent).map(b => ({t: b.dataset.tab || b.dataset.act, f: parseFloat(getComputedStyle(b).fontSize)})));
    ok(bar.length <= 6 && !bar.some(b => b.t === "groups"), "the bottom bar has six places or fewer, with Groups in More: " + bar.map(b => b.t).join(","));
    ok(bar.filter(b => b.t !== "companion").every(b => b.f >= 11), "bottom bar labels are at least 11 px");
    await P.page.click('header.top [data-act="menu"]'); await P.page.waitForSelector("#dlg[open] .more-sheet");
    const more = await P.page.textContent("#dlg .more-sheet");
    ok(/Study Groups/.test(more) && /Settings/.test(more) && /Style Shop/.test(more) && /Archive/.test(more), "the header's More button holds Groups, Style, Archive and Settings");
    await P.page.keyboard.press("Escape"); await P.page.waitForTimeout(200);
    const chk = await H(P.page, () => { const S = window.__sbProStudy; S.ui.tab = "courses"; S.ui.courseId = "c1"; S.render(); const b = [...document.querySelectorAll('#view li.task button.check')].find(x => x.offsetParent); const a = getComputedStyle(b, "::after"), r = b.getBoundingClientRect(); return {w: parseFloat(a.width), h: parseFloat(a.height), ring: Math.round(r.width)}; });
    ok(chk.w >= 44 && chk.h >= 44 && chk.ring < 30, "Mark Complete keeps its small ring but has a 44 px tap area on a phone: " + JSON.stringify(chk));

    // 5. The sync status on a phone is a button that opens a status sheet
    await H(P.page, () => { const s = document.getElementById("sync"); s.textContent = "Not saved"; s.dataset.state = "warn"; });
    const sb = await H(P.page, () => { const s = document.getElementById("sync"), r = s.getBoundingClientRect(); return {tag: s.tagName, w: r.width, h: r.height}; });
    ok(sb.tag === "BUTTON" && sb.w >= 40 && sb.h >= 40, "a sync problem shows as a button with a full-size tap target: " + JSON.stringify(sb));
    await P.page.click("#sync"); await P.page.waitForSelector("#dlg[open] .sync-sheet");
    ok(/Try Again/.test(await P.page.textContent("#dlg .sync-sheet")), "it opens Sync Status with Try Again");
    ok(P.errs.length === 0, "no page errors on a phone: " + P.errs.join(" | "));
    await P.ctx.close();
  } finally { await browser.close(); server.close(); }
  console.log(`\nqol-app.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
