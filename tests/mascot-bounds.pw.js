// The study companion is ENTIRELY on screen at all times (sprite + props/outfit + shadow + tap area, and its speech bubble when open).
// Run: node tests/mascot-bounds.pw.js [index.html]          (ONLY=320x480,390x844 limits the matrix; QUICK=1 skips the slow trips)
// Needs Playwright + Chromium (PLAYWRIGHT_MODULE / CHROMIUM_PATH override the defaults used in this repo's CI image).
//
// What is measured: independently of the app's own guard, the test unions getBoundingClientRect() of EVERY element drawn inside the
// sprite (.cp-rig *: parts, props, outfit pieces, with whatever animation transform is applied at that instant), its shadow, its tap area
// (.cp-hit) and, when visible, the speech bubble, and asserts the union lies inside [inset + 8 px, viewport - inset - 8 px].
// The app reads the safe area through the .cp-probe element: padding = env(safe-area-inset-*), overridden by --sb-sai-top/right/bottom/left
// on <html>. The test sets those variables to simulate a notch, rounded corners and a home indicator.
// Also asserted: at the default spot the companion's tap area covers no button, link or field (the earlier overlap property), and there is
// no gutter "sliver" any more (the companion is never partly off screen, even for one frame).
const path = require("path"), assert = require("assert");
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || "/opt/node-tools/node_modules/playwright");
const exe = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";
const F = "file://" + path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const MARGIN = 8, TOL = 0.6;
const VIEWPORTS = [[320, 480, 3, 1], [360, 640, 3, 1], [375, 667, 2, 1], [390, 844, 3, 1], [393, 852, 3, 1], [412, 915, 2.6, 1], [430, 932, 3, 1],
  [667, 375, 2, 1], [844, 390, 3, 1], [768, 1024, 2, 1], [1024, 768, 2, 0], [1280, 800, 1, 0]];
const only = (process.env.ONLY || "").split(",").filter(Boolean);
const fails = []; let checks = 0;
const check = (c, m) => { checks++; if (!c) { fails.push(m); console.log("FAIL -", m); } };
const dated = n => { const x = new Date(); x.setDate(x.getDate() + n); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
const seed = (n, extra) => ({v: 2, courses: [{id: "c1", name: "Biology 101", code: "BIO101", color: "#2a9d8f"}, {id: "c2", name: "History", code: "HIS", color: "#e76f51"}],
  tasks: Array.from({length: n}, (_, i) => ({id: "t" + i, title: ["Lab report", "Read chapter 4", "Problem set 3", "Essay draft", "Quiz prep", "Presentation", "Flashcards review", "Email prof", "Reading notes", "Final exam"][i % 10] + (i >= 10 ? " " + i : ""),
    courseId: i % 2 ? "c2" : "c1", type: i % 3 ? "Assignment" : "Exam", due: dated(i % 6), start: dated(0), hours: 2, status: i % 7 === 6 ? "done" : "todo", priority: "med", created: 1})),
  files: [], notes: [{id: "n1", text: "Remember lab goggles", x: 30, y: 30, color: "yellow"}, {id: "n2", text: "Call advisor", x: 190, y: 120, color: "pink"}], decks: [], events: [], settings: Object.assign({capacity: 15}, extra || {}), updated: 1});

// In the page: the true visual bounds, measured with no help from the app's guard
const MEASURE = () => {
  const box = document.querySelector("#compFront .cp"); if (!box || box.hidden) return null;
  let L = 1e9, T = 1e9, R = -1e9, B = -1e9;
  const add = r => { if (r && (r.width || r.height)) { L = Math.min(L, r.left); T = Math.min(T, r.top); R = Math.max(R, r.right); B = Math.max(B, r.bottom); } };
  box.querySelectorAll(".cp-rig *").forEach(e => { if (e.getBoundingClientRect) add(e.getBoundingClientRect()); });
  box.querySelectorAll(".cp-shadow,.cp-hit").forEach(e => add(e.getBoundingClientRect()));
  const bub = document.querySelector("#compFront .cp-bubble.on"), br = bub && bub.getBoundingClientRect();
  const de = document.documentElement, vv = window.visualViewport;
  return {v: {L, T, R, B}, b: br ? {L: br.left, T: br.top, R: br.right, B: br.bottom} : null,
    vp: (() => { // the visual viewport, unless it lies (almost) outside the layout viewport that fixed elements live in (an odd zoomed-and-scrolled emulation state)
      const a = {l: vv ? vv.offsetLeft : 0, t: vv ? vv.offsetTop : 0, r: Math.min(de.clientWidth, vv ? vv.offsetLeft + vv.width : 1e9), b: Math.min(de.clientHeight, vv ? vv.offsetTop + vv.height : 1e9)};
      return a.r - a.l >= 100 && a.b - a.t >= 100 ? a : {l: 0, t: 0, r: de.clientWidth, b: de.clientHeight}; })(),
    ins: ["top", "right", "bottom", "left"].map(k => parseFloat(de.style.getPropertyValue("--sb-sai-" + k)) || 0), op: +getComputedStyle(box).opacity, hit: box.querySelector(".cp-hit").className, scale: getComputedStyle(box).scale};
};
function problem(m, what) {
  if (!m) return "companion is missing";
  const [it, ir, ib, il] = m.ins, l = Math.max(m.vp.l, il) + MARGIN - TOL, t = Math.max(m.vp.t, it) + MARGIN - TOL, r = Math.min(m.vp.r, m.vp.r - 0 - ir) - MARGIN + TOL, b = Math.min(m.vp.b, m.vp.b - ib) - MARGIN + TOL;
  const bad = [];
  for (const [n, q] of [["companion", m.v], ["bubble", m.b]]) { if (!q) continue;
    if (q.L < l) bad.push(`${n} left ${q.L.toFixed(1)} < ${l.toFixed(1)}`); if (q.R > r) bad.push(`${n} right ${q.R.toFixed(1)} > ${r.toFixed(1)}`);
    if (q.T < t) bad.push(`${n} top ${q.T.toFixed(1)} < ${t.toFixed(1)}`); if (q.B > b) bad.push(`${n} bottom ${q.B.toFixed(1)} > ${b.toFixed(1)}`); }
  return bad.length ? what + ": " + bad.join("; ") : "";
}
// Placed and settled: lets the debounced placement run, then the guard has had its say
const settle = async (p, ms) => { await p.waitForTimeout(ms || 900); };
// ... and not mid-trip (a trip passes over things on its way; the overlap property is about where it stands)
const calm = async p => { await p.waitForFunction(() => { const b = window.SBCOMP && SBCOMP.el(); return b && !b.dataset.travel; }, null, {timeout: 5000}).catch(() => {}); await p.waitForTimeout(450); };
async function now(p, what, label) {
  const m = await p.evaluate(MEASURE); const e = problem(m, label); check(!e, `${what}: ${label || "in bounds"}${e ? " -> " + e.replace(/^[^:]*: /, "") : ""}`);
  if (e && process.env.DEBUG) console.log("   state:", JSON.stringify(await p.evaluate(() => { const b = SBCOMP.el(), q = SBCOMP.bounds(); return {style: b.style.cssText, travel: b.dataset.travel || "", spot: q.spot, safe: q.safe, range: q.range, win: [innerWidth, innerHeight, document.documentElement.clientWidth, document.documentElement.clientHeight], scroll: [scrollX, scrollY], last: q.last, shrink: q.shrink}; })));
  return m;
}
// Sample the bounds every 100 ms for `ms`, inside the page (no round trips), and report the worst excursion
async function sample(p, what, label, ms, during) {
  await p.evaluate(([fnSrc, ms]) => { window.__smp = []; const fn = eval(fnSrc); const t0 = performance.now(); window.__smpT = setInterval(() => { try { window.__smp.push(fn()); } catch (e) {} }, 100); window.__smpEnd = t0 + ms; }, [MEASURE.toString(), ms]);
  if (during) await during();
  await p.waitForTimeout(ms);
  const arr = await p.evaluate(() => { clearInterval(window.__smpT); return window.__smp; });
  let worst = "", n = 0;
  for (const m of arr) { n++; const e = problem(m, label); if (e && !worst) worst = e; }
  check(arr.length >= Math.floor(ms / 130) && !worst, `${what}: ${label} (${n} samples)${worst ? " -> " + worst : ""}`);
}
const PRIMARY = () => {
  const box = document.querySelector("#compFront .cp"), hit = box && box.querySelector(".cp-hit"); if (!hit) return null;
  const h = hit.getBoundingClientRect(), off = hit.classList.contains("cp-hit-off") || box.classList.contains("cp-duck"); let worst = 0, who = "";   // (a toast makes it step aside: invisible, no taps)
  document.querySelectorAll("button,a[href],input,select,textarea,[role=button],[data-tab],#fab").forEach(el => {
    if (el.closest("#compFront,#toast")) return; const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || (el.checkVisibility && !el.checkVisibility({checkVisibilityCSS: true}))) return;
    if (r.width * r.height > innerWidth * innerHeight * 0.3) return;
    const ox = Math.min(h.right, r.right) - Math.max(h.left, r.left), oy = Math.min(h.bottom, r.bottom) - Math.max(h.top, r.top);
    if (ox > 0 && oy > 0 && ox * oy > worst) { worst = ox * oy; who = (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 24); }
  });
  return {area: off ? 0 : Math.round(worst), who};
};

async function open(b, w, h, dsf, touch, opts) {
  opts = opts || {};
  const ctx = await b.newContext({viewport: {width: w, height: h}, deviceScaleFactor: dsf, hasTouch: !!touch, isMobile: !!touch, reducedMotion: opts.rm ? "reduce" : "no-preference"});
  await ctx.addInitScript(([s, init]) => { try { localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(s)); if (init) eval(init); } catch (e) {} }, [seed(opts.tasks || 10, opts.settings), opts.init || ""]);
  const p = await ctx.newPage(); p.errs = []; p.on("pageerror", e => p.errs.push(e.message));
  await p.goto(F); await p.waitForTimeout(opts.wait || 2300);
  return {ctx, p};
}
const sim = (p, ins) => p.evaluate(i => { ["top", "right", "bottom", "left"].forEach((k, n) => document.documentElement.style.setProperty("--sb-sai-" + k, i[n] + "px")); window.dispatchEvent(new Event("resize")); }, ins);

(async () => {
  const b = await chromium.launch({executablePath: exe});
  for (const [w, h, dsf, touch] of VIEWPORTS) {
    const tag = `${w}x${h}`; if (only.length && !only.includes(tag)) continue;
    console.log("==", tag, "dsf", dsf, touch ? "touch" : "mouse");
    const {ctx, p} = await open(b, w, h, dsf, touch, {tasks: 30});
    check(await p.evaluate(() => !!window.SBCOMP && !!SBCOMP.el() && !SBCOMP.el().hidden), `${tag}: the companion is showing`);
    // (a) default placement, no gutter sliver, no control under the tap area
    let m = await now(p, tag, "default placement");
    check(m && m.v.R - m.v.L > 30, `${tag}: whole sprite is on screen (no sliver docking), ${m ? Math.round(m.v.R - m.v.L) : 0}px wide`);
    let o = await p.evaluate(PRIMARY); check(o && o.area <= 4, `${tag}: tap area covers no control at the default spot (${o && o.area}px2 ${o && o.who})`);
    await p.screenshot({path: process.env.SHOTS ? path.join(process.env.SHOTS, `${tag}-default.png`) : undefined}).catch(() => {});
    // tabs and a dense board
    for (const tab of ["courses", "notes", "timeline", "board"]) {
      const clicked = await p.evaluate(t => { const e = document.querySelector(`nav.tabs [data-tab="${t}"]`); if (e) { e.click(); return true; } return false; }, tab);
      if (clicked) { await settle(p, 1500); await calm(p); await now(p, tag, `tab ${tab}`); o = await p.evaluate(PRIMARY); check(o && o.area <= 4, `${tag}: tab ${tab}: no control under the tap area (${o && o.area}px2 ${o && o.who})`); }
    }
    // (b) rotation
    await p.setViewportSize({width: h, height: w}); await p.evaluate(() => window.dispatchEvent(new Event("orientationchange"))); await settle(p, 1000);
    await now(p, tag, "after rotation"); await p.setViewportSize({width: w, height: h}); await settle(p, 1000); await now(p, tag, "rotated back");
    // (c) Extra Large text and 200% zoom (a 200% browser zoom is a viewport half as many CSS px wide and tall)
    await p.evaluate(() => { document.documentElement.setAttribute("data-ts", "xl"); }); await settle(p, 900); await now(p, tag, "Extra Large text");
    await p.setViewportSize({width: Math.round(w / 2), height: Math.round(h / 2)}); await settle(p, 1100); await now(p, tag, "200% zoom + Extra Large text");
    await p.setViewportSize({width: w, height: h}); await p.evaluate(() => document.documentElement.removeAttribute("data-ts")); await settle(p, 900);
    // (d) safe-area insets: portrait notch + home indicator, landscape notch on the side
    for (const ins of [[47, 0, 34, 0], [0, 47, 21, 47], [59, 20, 34, 20]]) { await sim(p, ins); await settle(p, 900); await now(p, tag, `safe area ${ins.join("/")}`); }
    await sim(p, [0, 0, 0, 0]); await settle(p, 600);
    // (e) soft keyboard: the visible height shrinks by 300 px while a field is focused
    { const inp = await p.evaluate(() => { const e = document.querySelector("input[type=text],input:not([type]),textarea"); if (!e) return false; e.focus(); return true; });
      const kh = Math.max(Math.round(h * 0.5), h - 300); await p.setViewportSize({width: w, height: kh}); await settle(p, 1100); await now(p, tag, `keyboard open (${inp ? "field focused" : "no field"}, ${kh}px tall)`);
      await p.setViewportSize({width: w, height: h}); await p.evaluate(() => document.activeElement && document.activeElement.blur()); await settle(p, 900); await now(p, tag, "keyboard closed"); }
    // (i) a horizontally overflowing page, scrolled
    await p.evaluate(() => { const d = document.createElement("div"); d.id = "wideTest"; d.style.cssText = "width:2400px;height:1600px;position:absolute;left:0;top:0;pointer-events:none"; document.body.appendChild(d); });
    await p.evaluate(() => { window.scrollTo(600, 400); }); await settle(p, 900); await now(p, tag, "wide overflowing page, scrolled");
    await p.evaluate(() => { window.scrollTo(0, 0); document.getElementById("wideTest").remove(); }); await settle(p, 500);
    // (g) props, speech bubble, picker
    for (const prop of ["crown", "cape", "beanie"]) {
      await p.evaluate(pr => { const id = SBCOMP.current(), earned = {}; SBCOMP.ACC.forEach(a => earned[a.id] = 1); SBCOMP.setCfg({earned, wear: {[id]: pr}}); }, prop);
      await settle(p, 900); const wearing = await p.evaluate(() => SBCOMP.wearing());
      await now(p, tag, `wearing ${prop} (worn: ${wearing || "none"})`);
      if (prop === "cape") {
        await p.evaluate(() => SBCOMP.say("This is a very long line from the companion so we can see how the speech bubble wraps and where it ends up on small screens, with more words, more words, and even more words to be sure it goes past two lines and keeps going and going until it has to be scrolled or trimmed.", {long: true, ms: 5000}));
        await settle(p, 800); m = await now(p, tag, "long speech bubble"); check(m && m.b, `${tag}: the long bubble is showing`);
        await p.evaluate(() => SBCOMP.say("Quick hi!", {cheer: true, ms: 3000})); await settle(p, 900); await now(p, tag, "cheer bubble");
        await p.evaluate(() => { SBCOMP.askOpen(); }); await settle(p, 900); await now(p, tag, "ask bubble (text field)");
      }
    }
    await p.evaluate(() => SBCOMP.open()); await settle(p, 800);
    { const r = await p.evaluate(() => { const d = document.querySelector("dialog[open]"); if (!d) return null; const q = d.getBoundingClientRect(); return {l: q.left, t: q.top, r: q.right, b: q.bottom, w: innerWidth, h: innerHeight}; });
      check(r && r.l >= -0.5 && r.t >= -0.5 && r.r <= r.w + 0.5 && r.b <= r.h + 0.5, `${tag}: the picker sheet is inside the screen${r ? "" : " (not open)"}`); }
    await p.evaluate(() => { const d = document.querySelector("dialog[open]"); if (d) d.close(); }); await settle(p, 700); await now(p, tag, "after the picker closes");
    // (h) animations: idle moves, celebration, taps, a daily hello and a 6 s sample, bubble included
    await sample(p, tag, "6 s of idles, cheers, taps, hello and trips", 6000, async () => {
      await p.evaluate(() => { SBCOMP.IDLES.concat(["stretch", "flip", "nod"]).forEach((n, i) => setTimeout(() => SBCOMP.motion(n), i * 330)); setTimeout(() => SBCOMP.cheer("task"), 500); setTimeout(() => SBCOMP.greet(), 1800);
        setTimeout(() => SBCOMP.tap(), 2600); setTimeout(() => { for (let i = 0; i < 5; i++) SBCOMP.tap(); }, 3600); setTimeout(() => SBCOMP.place(true), 4800); });
    });
    if (!process.env.QUICK && [320, 375, 667, 1280].includes(w)) {
      const r = await p.evaluate(() => SBCOMP.range()); let k = 0;
      for (const style of ["dash", "leap", "hops", "loop", "wave"]) {
        await sample(p, tag, `trip: ${style}`, 1700, async () => { await p.evaluate(([r, st, k]) => { SBCOMP.trip(k % 2 ? r.L : r.R, k % 3 ? r.T : r.B, st); }, [r, style, k++]); });
        await sample(p, tag, `trip back: ${style}`, 1700, async () => { await p.evaluate(([r, st, k]) => { SBCOMP.trip(k % 2 ? r.R : r.L, k % 3 ? r.B : r.T, st); }, [r, style, k++]); });
      }
    }
    // (f) a stored position from a bigger window, and junk settings, never apply (nothing about its position is stored at all)
    await ctx.close();
    { const {ctx: c2, p: p2} = await open(b, w, h, dsf, touch, {tasks: 12, settings: {comp: {on: true, x: 1800, y: 1400, left: 1600, top: 1200, pos: {x: 1500, y: 1300}}},
        init: "localStorage.setItem('studyboard:comp:pos','{\"x\":1800,\"y\":1400,\"w\":1920,\"h\":1080}');localStorage.setItem('studyboard:comp:spot','{\"left\":1700,\"top\":1300}');localStorage.setItem('studyboard:comp','{\"x\":2000,\"y\":1500}')"});
      await now(p2, tag, "stale stored position from a bigger viewport"); check(p2.errs.length === 0, `${tag}: no page errors${p2.errs.length ? " -> " + p2.errs[0] : ""}`); await c2.close(); }
    // reduced motion: static mode keeps it still and fully inside
    { const {ctx: c3, p: p3} = await open(b, w, h, dsf, touch, {tasks: 30, rm: true});
      await now(p3, tag, "reduced motion: placement"); await sample(p3, tag, "reduced motion: 2 s of reactions", 2000, async () => { await p3.evaluate(() => { SBCOMP.tap(); SBCOMP.cheer("task"); SBCOMP.place(true); }); });
      const st = await p3.evaluate(() => ({fixes: SBCOMP.bounds().fixes})); check(st.fixes >= 0, `${tag}: reduced motion ran`); await c3.close(); }
  }
  // The watchdog and clamp: forcing the element out of bounds is corrected (and the correction is counted)
  { const {ctx, p} = await open(b, 390, 844, 3, 1, {tasks: 10});
    await p.evaluate(() => { const bx = SBCOMP.el(); bx.style.left = "-300px"; bx.style.top = "-200px"; });
    await p.waitForTimeout(2600); await now(p, "watchdog", "a companion forced off screen is brought back within 2 s");
    check(await p.evaluate(() => SBCOMP.bounds().fixes) >= 1, "watchdog: the correction was counted");
    await p.evaluate(() => { const bx = SBCOMP.el(); bx.style.left = "5000px"; bx.style.top = "5000px"; SBCOMP.clamp("test"); }); await now(p, "clamp", "SBCOMP.clamp() pulls a far-away companion back at once");
    await ctx.close(); }
  await b.close();
  console.log(`\n${checks} checks, ${fails.length} failed`);
  if (fails.length) { fails.slice(0, 60).forEach(f => console.log(" -", f)); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
