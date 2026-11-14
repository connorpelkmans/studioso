// node tests/note-sheet-glide.e2e.js
// Notes on a phone, in the iPhone app (its keyboard slides over the page and the app reports its height): the note editor's top
// edge glides, never jumps, when the keyboard comes up (tapping into an open note, or Add Note) and when the options fold away.
// The keyboard is imitated the way ios-wrapper/native-bridge.js reports it: html.kb-native, window.sbVisibleH, --kb-h and an
// sb-kb-cover event, raised the moment the text box is focused.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const note = (id, x, y, text) => ({id, text, color: "yellow", x, y, z: 1, rot: 0, courseId: "", board: "", created: 1, stickers: []});
const SEED = {v: 2, courses: [], tasks: [], decks: [], files: [], events: [], settings: {}, updated: 1, notes: [note("n1", 30, 40, "First note"), note("n2", 200, 60, "Second")]};
const KB = 336;
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [];
  try {
    const ctx = await browser.newContext({viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true});
    await ctx.addInitScript(([seed, KB]) => {
      try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:tour", "done");
        if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(seed)); } catch (e) {}
      // the iPhone app's keyboard, as the bridge reports it
      let cover = 0;
      const R = () => document.documentElement;
      const apply = () => { R().style.setProperty("--kb-h", cover + "px"); R().style.setProperty("--vv-h", (innerHeight - cover) + "px"); dispatchEvent(new Event("sb-kb-cover")); };
      window.sbVisibleH = () => innerHeight - cover;
      document.addEventListener("DOMContentLoaded", () => R().classList.add("kb-native"));
      const box = t => t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT");
      // window.kbLate: the first keyboard of a session, whose height the app learns only as it arrives a moment after the tap
      const raise = () => { if (cover || !box(document.activeElement)) return; cover = KB; R().classList.add("kb-open"); apply(); };
      document.addEventListener("focusin", e => { if (box(e.target) && !cover) { if (window.kbLate) setTimeout(raise, window.kbLate); else raise(); } }, true);
      document.addEventListener("focusout", () => setTimeout(() => { if (!box(document.activeElement) && cover) { cover = 0; R().classList.remove("kb-open"); apply(); } }, 60), true);
    }, [SEED, KB]);
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await page.evaluate(() => { const b = document.querySelector('nav.tabs [data-tab="notes"]'); b && b.click(); });
    await page.waitForSelector("#nbBoard .note"); await page.waitForTimeout(500);
    // the sheet's top edge, every frame, for a while after an action
    const track = (fn, ms = 900) => page.evaluate(([fn, ms]) => new Promise(res => {
      const out = [], t0 = performance.now();
      const tick = () => { const el = document.querySelector(".note.editing.n-sheet"); out.push(el ? Math.round(el.getBoundingClientRect().top) : null); if (performance.now() - t0 < ms) requestAnimationFrame(tick); else res(out); };
      new Function(fn)(); requestAnimationFrame(tick);
    }), [fn, ms]);
    const jumps = tops => { const t = tops.filter(x => x != null); let m = 0; for (let i = 1; i < t.length; i++) m = Math.max(m, Math.abs(t[i] - t[i - 1])); return {max: m, first: t[0], last: t[t.length - 1], frames: t.length}; };

    // 1. open a note: it slides up with its options showing, and no keyboard yet
    await track(`document.querySelector('#nbBoard .note[data-note="n1"]').click()`, 700);
    const open = await page.evaluate(() => { const el = document.querySelector(".note.editing.n-sheet"); return {sheet: !!el, focused: document.activeElement && document.activeElement.id === "noteText", top: el && Math.round(el.getBoundingClientRect().top)}; });
    ok(open.sheet && !open.focused, "a tapped note opens as a sheet with its options, no keyboard yet");
    // 2. tap into its text: the keyboard comes up and the options fold away; the top edge glides there
    const raw2 = await track(`const t = document.getElementById("noteText"); t.focus(); t.setSelectionRange(t.value.length, t.value.length)`), t2 = jumps(raw2);
    const up = await page.evaluate(() => { const el = document.querySelector(".note.editing.n-sheet"), r = el.getBoundingClientRect(); return {bottom: Math.round(r.bottom), top: Math.round(r.top)}; });
    ok(Math.abs(up.bottom - (874 - 336)) <= 2, "typing: the sheet ends on top of the keyboard (" + up.bottom + ")");
    // it used to drop: the options folded away at once (the top edge fell by their height) and only then did it rise
    const low = Math.max(...raw2.filter(x => x != null));
    ok(low <= open.top + 1, "typing: the top edge never dips below where it was (" + open.top + ", lowest " + low + ")");
    ok(t2.max <= 60, "typing: the top edge glides there, its biggest step in one frame is " + t2.max + "px (" + JSON.stringify(t2) + ")");
    // 3. Done: the keyboard goes; the sheet closes
    await page.evaluate(() => { const b = [...document.querySelectorAll(".note.n-sheet button")].find(b => /^Done$/.test(b.textContent.trim())); b && b.click(); });
    await page.waitForTimeout(900);
    ok(!(await page.evaluate(() => !!document.querySelector(".note.editing"))), "Done closes the note");
    // 4. Add Note: the sheet arrives with the keyboard, in one slide, never landing low first and jumping up
    const t4 = await track(`document.querySelector('[data-act="fab-note"]').click()`, 900);
    const j4 = jumps(t4);
    const add = await page.evaluate(() => { const el = document.querySelector(".note.editing.n-sheet"), r = el.getBoundingClientRect(); return {bottom: Math.round(r.bottom), focused: document.activeElement && document.activeElement.id === "noteText"}; });
    ok(add.focused && Math.abs(add.bottom - (874 - 336)) <= 2, "Add Note: the new note's sheet ends on top of the keyboard, ready to type");
    // its top edge only ever rises (sliding in), no step back down
    const seen = t4.filter(x => x != null); let down = 0; for (let i = 1; i < seen.length; i++) down = Math.max(down, seen[i] - seen[i - 1]);
    ok(down <= 1, "Add Note: the sheet only moves up as it arrives (largest step down " + down + "px; " + JSON.stringify(j4) + ")");
    // 5. the keyboard arriving a moment after the tap (its height not known yet): the sheet still moves once, up
    await page.evaluate(() => { const b = [...document.querySelectorAll(".note.n-sheet button")].find(b => /^Done$/.test(b.textContent.trim())); b && b.click(); });
    await page.waitForTimeout(900);
    await track(`document.querySelector('#nbBoard .note[data-note="n2"]').click()`, 700);
    const top5 = await page.evaluate(() => Math.round(document.querySelector(".note.editing.n-sheet").getBoundingClientRect().top));
    await page.evaluate(() => { window.kbLate = 150; });
    const raw5 = await track(`const t = document.getElementById("noteText"); t.focus()`, 1000);
    const low5 = Math.max(...raw5.filter(x => x != null)), j5 = jumps(raw5);
    ok(low5 <= top5 + 1 && j5.max <= 60 && Math.abs(j5.last - 280) <= 2, "a keyboard that arrives late: no dip while waiting for it, then one glide up (" + top5 + " -> " + j5.last + ", lowest " + low5 + ", biggest step " + j5.max + "px)");
    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log(n + " passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
