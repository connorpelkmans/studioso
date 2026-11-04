// node tests/ui-a11y-fixes.e2e.js: toasts above the keyboard and above any pop-up, sheets focusing their heading, the phone
// course picker by keyboard, the landscape lock never while typing, Ctrl+1-7 only in the installed app, the side menu's sync
// status, switches for on/off settings, small-phone labels, search's "No matches", the timeline's edges, the Groups title,
// tooltips off the side menu, the companion chat's live region, named colour swatches and one completion pop-up at a time
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"});
  // the app runs inside one closure: hand the test its toast()
  if (f === path.join(ROOT, "bundle", "app.js")) { const s = fs.readFileSync(f, "utf8"), i = s.lastIndexOf("})();"); res.end(s.slice(0, i) + "window.__ui = {toast};\n" + s.slice(i)); return; }
  fs.createReadStream(f).pipe(res);
});
let checks = 0; const ok = (c, m) => { checks++; if (!c) { console.log("FAIL:", m); process.exitCode = 1; } else console.log("ok -", m); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const COURSES = [["c1", "Biology 101", "BIO101", "#4F8A5B"], ["c2", "Calculus II", "MATH152", "#3B6FD8"], ["c3", "Intro Psychology", "PSY100", "#C2577A"]].map(([id, name, code, color]) => ({id, name, code, color}));
const D = n => { const d = new Date("2026-10-23T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const T = (id, title, courseId, due, o) => Object.assign({id, title, courseId, type: "Assignment", start: D(-3), due: D(due), time: "", priority: "med", status: "todo", notes: "", hours: 2, checklist: [], pct: 0, dependsOn: [], history: [], created: 1, order: 10}, o || {});
const TASKS = [T("t1", "Lab report: enzyme kinetics", "c1", 0, {time: "23:59", hours: 3}), T("t2", "Problem set 7", "c2", 1), T("t3", "Read chapter 6", "c3", 1, {hours: 1.5})];
const seed = ([data, extra]) => {
  for (const [k, v] of [["studioso:welcomed", "1"], ["studioso:sb", JSON.stringify("local")], ["studioso:tour", "done"], ["studyboard:tour", "done"], ["sb:onboarded", "1"]]) localStorage.setItem(k, v);
  for (const k in extra || {}) localStorage.setItem(k, extra[k]);
  if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(data));
};
async function open(browser, o = {}){
  const W = o.w || 390, phone = W < 640;
  const ctx = await browser.newContext({viewport: {width: W, height: o.h || (phone ? 844 : 860)}, timezoneId: "America/New_York", locale: "en-US", serviceWorkers: "block", hasTouch: phone, isMobile: phone});
  await ctx.routeWebSocket(/supabase\.co/, ws => ws.close()); await ctx.route(/supabase\.co/, r => r.abort());
  const p = await ctx.newPage(), errs = []; p.on("pageerror", e => errs.push(e.message)); p.errs = errs;
  await p.clock.install({time: new Date("2026-10-23T10:30:00-04:00")});
  await p.addInitScript(seed, [{v: 2, courses: COURSES, tasks: TASKS, files: [], notes: [], decks: [], events: [], settings: {capacity: 15, dailyHours: 4}, updated: 1}, o.ls]);
  await p.goto("http://127.0.0.1:" + server.address().port + "/index.html");
  await p.waitForSelector("#view", {state: "attached"}); await wait(1200);
  return {ctx, p};
}
const tab = async (p, t) => { await p.evaluate(t => document.querySelector(`nav.tabs [data-tab="${t}"]`).click(), t); await wait(400); };
const sheet = p => p.evaluate(() => { const d = document.createElement("dialog"); d.id = "xd"; d.innerHTML = "<div class='sheet'><div class='sheet-head'><h2>Focus Settings</h2></div><div class='sheet-body'><button type='button'>A button</button></div></div>"; document.body.appendChild(d); d.showModal(); });

(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({executablePath});
  try {
    /* Phone */
    { const {ctx, p} = await open(browser, {w: 390});
      // U1: with the keyboard up, a toast sits just above it
      await p.evaluate(() => { const r = document.documentElement; r.style.setProperty("--kb-h", "300px"); r.classList.add("kb-open"); __ui.toast("Fill in the title"); }); await wait(250);
      const gap = await p.evaluate(() => innerHeight - document.getElementById("toast").getBoundingClientRect().bottom);
      ok(Math.abs(gap - 312) <= 1, "keyboard up: the toast sits 12px above the keyboard (" + gap + ")");
      await p.evaluate(() => document.documentElement.classList.remove("kb-open"));
      // U3 + U10: a pop-up other than the main sheet: its heading takes focus, a toast shows inside it and on top
      await sheet(p); await wait(250);
      ok(await p.evaluate(() => { const a = document.activeElement; return a.tagName === "H2" && a.tabIndex === -1 && !a.hasAttribute("aria-hidden") && getComputedStyle(a).outlineStyle === "none"; }), "a sheet focuses its heading (not a hidden element), with no focus ring");
      await p.evaluate(() => __ui.toast("Saved")); await wait(250);
      ok(await p.evaluate(() => { const t = document.getElementById("toast"), r = t.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return t.parentNode.id === "xd" && !!hit && t.contains(hit); }), "a toast shows on top of any open pop-up, not behind it");
      await p.evaluate(() => document.getElementById("xd").close()); await wait(300);
      ok(await p.evaluate(() => document.getElementById("toast").parentNode === document.body), "and goes back to the page when the pop-up closes");
      // a toast for this page only goes when the page changes
      await p.evaluate(() => __ui.toast("Moved", null, {label: "Open", fn: () => {}}, {view: true})); await tab(p, "plan");
      ok(await p.evaluate(() => !document.getElementById("toast").classList.contains("show")), "a toast made for one page goes away on another page");
      await p.evaluate(() => __ui.toast("Kept")); await tab(p, "board");
      ok(await p.evaluate(() => document.getElementById("toast").classList.contains("show")), "other toasts stay across pages");
      // B18: Groups and Notes have a plain title, not a one-choice switch
      await tab(p, "groups");
      ok(await p.evaluate(() => { const s = document.querySelector("#view > .ph-solo"), t = s.querySelector(".ph-solo-t"), bg = x => getComputedStyle(x).backgroundColor; return s.getAttribute("role") === "heading" && /rgba\(0, 0, 0, 0\)|transparent/.test(bg(s)) && /rgba\(0, 0, 0, 0\)|transparent/.test(bg(t)) && getComputedStyle(t).boxShadow === "none"; }), "phone Groups: a plain heading, not a pill switch");
      await tab(p, "board");
      // U11: the phone's course picker by keyboard / VoiceOver
      await p.evaluate(() => document.querySelector("#fab, .fab").click()); await wait(700);
      const at = await p.evaluate(() => { const s = document.querySelector("dialog[open] select.cs-custom"), r = s.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2}; });
      await p.touchscreen.tap(at.x, at.y); await wait(300);
      ok(await p.evaluate(() => { const a = document.activeElement; return !!a.closest(".cs-menu") && a.getAttribute("aria-selected") === "true"; }), "course picker: the chosen course has focus when it opens");
      await p.keyboard.press("ArrowDown"); await p.keyboard.press("ArrowDown"); await p.keyboard.press("Enter"); await wait(200);
      ok(await p.evaluate(() => { const s = document.querySelector("dialog[open] select.cs-custom"); return !document.querySelector(".cs-menu") && document.activeElement === s && s.selectedIndex === 2; }), "arrow keys move through the courses, Enter picks one and focus returns to the dropdown");
      await p.touchscreen.tap(at.x, at.y); await wait(200); await p.keyboard.press("Escape"); await wait(150);
      ok(await p.evaluate(() => !document.querySelector(".cs-menu") && document.activeElement.tagName === "SELECT" && !!document.querySelector("dialog[open]")), "Esc closes just the picker");
      await p.evaluate(() => document.querySelector("dialog[open]").close()); await wait(300);
      // U6, U8, U9: sheets sized by the visible height, keep their scrolling, clear the home bar
      ok(await p.evaluate(() => { const s = [...document.styleSheets].flatMap(x => { try { return [...x.cssRules]; } catch (e) { return []; } }).map(r => r.cssText).join("\n"); return /max-height: 90dvh/.test(s) && /max-height: 92dvh/.test(s); }), "sheets use the visible height (dvh), with vh as the fallback");
      await sheet(p); await wait(200);
      ok(await p.evaluate(() => { const b = document.querySelector("#xd .sheet-body"); return getComputedStyle(b).overscrollBehaviorY === "contain" && /env\(safe-area-inset-bottom/.test([...document.styleSheets].flatMap(x => { try { return [...x.cssRules]; } catch (e) { return []; } }).map(r => r.cssText).find(t => t.startsWith(".sheet-body:where(")) || ""); }), "a sheet's scrolling stops at its end; a footer-less sheet keeps clear of the home bar");
      await p.evaluate(() => document.getElementById("xd").close()); await wait(200);
      // B9: finishing a second task replaces the question about the first
      await p.evaluate(() => { const b = [...document.querySelectorAll("button")].find(b => /Task Board/.test(b.textContent)); if (b) b.click(); }); await wait(400);
      await p.evaluate(() => document.querySelector('[data-act="toggle"][data-id="t2"]').click()); await wait(900);
      const first = await p.evaluate(() => { const c = document.getElementById("accChip"); return c && !c.hidden ? c.textContent : ""; });
      await p.evaluate(() => document.querySelector('[data-act="toggle"][data-id="t3"]').click()); await wait(900);
      ok(await p.evaluate(() => { const c = document.getElementById("accChip"); return !c || c.hidden || /Read chapter 6/.test(c.textContent); }), "a second task finished: no question left about the first one (" + first.slice(0, 40) + ")");
      ok(!p.errs.length, "phone: no page errors: " + p.errs.join(" | "));
      await ctx.close(); }

    /* Smallest phone */
    { const {ctx, p} = await open(browser, {w: 320});
      const cut = () => p.evaluate(() => [...document.querySelectorAll("#view .pr-lead, #view .c2-foot > .mini, #view .sch-range")].filter(e => e.offsetParent && e.scrollWidth > e.clientWidth + 1).map(e => e.textContent));
      ok(!(await cut()).length, "320px: Today's Plan reasons aren't cut off: " + await cut());
      await tab(p, "courses"); ok(!(await cut()).length, "320px: course card hours aren't cut off: " + await cut());
      await tab(p, "plan");
      ok(await p.evaluate(() => [...document.querySelectorAll("#view > .pview-tabs button")].every(b => b.getBoundingClientRect().right <= innerWidth && b.scrollWidth <= b.clientWidth + 1)), "320px: Due Dates, Schedule and Crunch all fit");
      ok(!p.errs.length, "320px: no page errors: " + p.errs.join(" | "));
      await ctx.close(); }

    /* Phone turned sideways */
    { const ctx = await browser.newContext({viewport: {width: 844, height: 390}, isMobile: true, hasTouch: true, serviceWorkers: "block"});
      await ctx.addInitScript(seed, [{v: 2, courses: [], tasks: [], settings: {}, updated: 1}]);
      const p = await ctx.newPage(); await p.goto("http://127.0.0.1:" + server.address().port + "/index.html"); await wait(1200);
      const locked = () => p.evaluate(() => getComputedStyle(document.body).visibility === "hidden");
      ok(await locked(), "a phone turned sideways still shows the turn-upright screen");
      await p.setViewportSize({width: 360, height: 740}); await wait(200);
      await p.evaluate(() => document.getElementById("qaIn").focus()); await p.setViewportSize({width: 360, height: 300}); await wait(250);
      ok(!(await locked()), "but never while typing (a keyboard can make a small phone's page wider than tall)");
      await p.evaluate(() => document.activeElement.blur()); await p.setViewportSize({width: 1024, height: 700}); await wait(200);
      ok(!(await locked()), "a sideways tablet is never locked");
      await ctx.close(); }

    /* Desktop */
    { const {ctx, p} = await open(browser, {w: 1280, ls: {"studioso:sb": "null"}});
      // B5: the side menu's sync status is one short line with the rest in a tooltip
      await wait(500);
      ok(await p.evaluate(() => { const s = document.getElementById("syncSide"), r = s.getBoundingClientRect(), nx = s.nextElementSibling; let b = nx; while (b && !b.getClientRects().length) b = b.nextElementSibling; return s.textContent === "Not signed in" && /^(Not signed in(, changes kept here)?)?$/.test(s.dataset.tip || "") && (!b || b.getBoundingClientRect().top >= r.bottom - 1); }), "side menu: \"Not signed in\" fits on its line, the full status is its tooltip");
      await ctx.close(); }
    { const {ctx, p} = await open(browser, {w: 1280});
      // U15: Ctrl+1-7 only listed in the installed app
      await p.keyboard.press("?"); await wait(400);
      ok(await p.evaluate(() => [...document.querySelectorAll(".kb-t th")].filter(t => /^[1-7]/.test(t.textContent)).every(t => !/Ctrl|⌘/.test(t.textContent))), "in a browser tab the shortcut list shows 1-7 without Ctrl (the browser takes Ctrl+1-7)");
      await p.keyboard.press("Escape"); await wait(300);
      // B12: on/off settings are switches with their state beside them
      await p.evaluate(() => [...document.querySelectorAll("nav.tabs .nav-foot button")].find(b => /Settings/.test(b.textContent)).click()); await wait(600);
      await p.evaluate(() => [...document.querySelectorAll("dialog[open] button")].find(b => /^Appearance/.test(b.textContent.trim())).click()); await wait(400);
      const sw = () => p.evaluate(() => { const i = document.querySelector('[data-key="still"]'), l = i.closest("label"); return {after: getComputedStyle(l, "::after").content, w: i.getBoundingClientRect().width, app: getComputedStyle(i).appearance}; });
      let s1 = await sw();
      ok(/"Off"/.test(s1.after) && s1.w === 42 && s1.app === "none", "Companion Stays Put: a switch that says Off when it's off: " + JSON.stringify(s1));
      await p.click('[data-key="still"]'); await wait(200); s1 = await sw();
      ok(/"On"/.test(s1.after), "and On once switched on: " + s1.after);
      await p.click('[data-key="still"]'); await p.keyboard.press("Escape"); await wait(300);
      // B14: search says when nothing matched, and Esc first clears
      await p.keyboard.press("Control+k"); await wait(500); await p.keyboard.type("zzqxvy"); await wait(500);
      ok(await p.evaluate(() => /No matches for “zzqxvy”/.test((document.querySelector(".sx-none, .sx-empty") || {}).textContent || "") && /Esc Clear/.test(document.querySelector(".sx-keys").textContent)), "search: a plain \"No matches\" line, and the hint says Esc clears");
      await p.keyboard.press("Escape"); await wait(250);
      ok(await p.evaluate(() => document.querySelector("dialog.sx-dlg").open && /Esc Close/.test(document.querySelector(".sx-keys").textContent)), "after clearing, the hint says Esc closes");
      await p.keyboard.press("Escape"); await wait(300);
      // B17: the timeline's day numbers fade at both edges
      await tab(p, "plan");
      ok(await p.evaluate(() => { const h = [...document.querySelectorAll(".tl-headrow")].pop(); return getComputedStyle(h, "::after").position === "sticky" && getComputedStyle(h.querySelector(".tl-label")).boxShadow !== "none"; }), "calendar timeline: the first and last visible day numbers fade instead of being cut");
      // B19: a tooltip for the first column stays off the side menu
      await tab(p, "board");
      await p.evaluate(() => { const b = [...document.querySelectorAll("button")].find(b => /Task Board/.test(b.textContent)); if (b) b.click(); }); await wait(400);
      const c = await p.evaluate(() => { const r = document.querySelector('.card [data-act="toggle"]').getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2}; });
      await p.mouse.move(c.x, c.y); await wait(800);
      ok(await p.evaluate(() => { const t = document.querySelector(".sb-tip"); return !!t && t.getBoundingClientRect().left >= document.querySelector("nav.tabs").getBoundingClientRect().right; }), "the Mark Complete tooltip stays off the side menu");
      // U14: colour swatches have names
      await p.evaluate(() => { const i = document.createElement("input"); i.type = "color"; i.value = "#3366ff"; document.body.appendChild(i); i.click(); }); await wait(300);
      ok(await p.evaluate(() => { const s = [...document.querySelectorAll(".sb-cp-s")].map(b => b.getAttribute("aria-label")); return s[0] === "Red" && s.includes("Blue") && !s.some(x => /^#/.test(x)); }), "colour swatches are named (Red, Blue…), not hex codes");
      await p.keyboard.press("Escape");
      // U4: the companion chat isn't one big live region
      await tab(p, "companion");
      ok(await p.evaluate(() => { const l = document.getElementById("cptLog"), s = document.getElementById("cptSay"); return !l || (!l.hasAttribute("aria-live") && !!s && s.getAttribute("aria-live") === "polite"); }), "companion chat: only the newest reply is announced, not the whole log");
      ok(!p.errs.length, "desktop: no page errors: " + p.errs.join(" | "));
      await ctx.close(); }
  } finally { await browser.close(); server.close(); }
  console.log(`\n${checks} checks${process.exitCode ? " (with failures)" : " passed"}`);
})().catch(e => { console.error(e); process.exit(1); });
