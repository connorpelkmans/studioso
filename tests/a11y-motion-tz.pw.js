// Browser checks for Animations (reduced motion / low power), text size, contrast and time zones. Run: node tests/a11y-motion-tz.pw.js [index.html]
// Needs Playwright + Chromium (see tests/pw.js for how Playwright and Chromium are found).
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const F = "file://" + path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
let n = 0; const ok = (c, m) => { assert(c, m); n++; console.log("ok -", m); };
const seed = skin => ({courses: [{id: "c1", name: "Biology 101", code: "BIO 101", color: "#2C55D6"}], tasks: [
  {id: "t1", title: "Lab report", courseId: "c1", due: "2026-11-01", time: "23:59", status: "todo", type: "Assignment", created: 1},
  {id: "t2", title: "Essay draft", courseId: "c1", due: "2026-11-02", time: "23:59", status: "todo", type: "Assignment", created: 1}], settings: {capacity: 15, style: {skin}}, updated: 1});
async function mk(b, opts, skin, init) {
  const ctx = await b.newContext(Object.assign({viewport: {width: 1280, height: 800}}, opts));
  await ctx.addInitScript(([s, i]) => { try { localStorage.setItem("coursework:v2", JSON.stringify(s)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); } catch (e) {}
    window.__raf = 0; const o = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => o(t => { window.__raf++; cb(t); });
    if (i) try { eval(i); } catch (e) {} }, [seed(skin), init || ""]);
  const p = await ctx.newPage(); p.errs = []; p.on("pageerror", e => p.errs.push(e.message)); return {ctx, p};
}
(async () => {
  const b = await chromium.launch({executablePath});
  const count = async p => { const a = await p.evaluate(() => window.__raf); await p.waitForTimeout(2500); return (await p.evaluate(() => window.__raf)) - a; };
  const batt = l => `navigator.getBattery=()=>Promise.resolve(Object.assign(new EventTarget(),{level:${l},charging:false}));`;
  // 1. Animation modes: callbacks over 2.5 s on a theme with an engine
  const res = {};
  for (const [name, opts, init] of [["auto", {}, ""], ["reduced-media", {reducedMotion: "reduce"}, ""], ["off", {}, "localStorage.setItem('studyboard:anim','off')"], ["calm", {}, "localStorage.setItem('studyboard:anim','calm')"], ["battery15", {}, batt(0.15)], ["battery5", {}, batt(0.05)]]) {
    const {ctx, p} = await mk(b, opts, "ocean", init); await p.goto(F); await p.waitForTimeout(2200);
    res[name] = {c: await count(p), lvl: await p.evaluate(() => SBMotion.level())}; ok(p.errs.length === 0, name + " loads without errors"); await ctx.close();
  }
  ok(res.auto.c > 25 && res.auto.lvl === "full", "Auto plays the scene at full level");
  ok(res["reduced-media"].c <= 2 && res["reduced-media"].lvl === "static", "system Reduce Motion stops the loop");
  ok(res.off.c <= 2 && res.battery5.c <= 2, "Off and battery under 8% stop the loop");
  ok(res.calm.lvl === "calm" && res.battery15.lvl === "calm" && res.calm.c < res.auto.c * 0.75, "Calm and low battery run at a lower rate");
  // 2. Live toggle
  { const {ctx, p} = await mk(b, {}, "ocean"); await p.goto(F); await p.waitForTimeout(2000);
    await p.emulateMedia({reducedMotion: "reduce"}); await p.waitForTimeout(300); ok((await count(p)) <= 2, "reduce toggles live (stops)");
    await p.emulateMedia({reducedMotion: "no-preference"}); await p.waitForTimeout(300); ok((await count(p)) > 20, "and back (resumes)");
    await p.evaluate(() => window.dispatchEvent(new Event("blur"))); await p.waitForTimeout(300); ok((await count(p)) <= 2, "blur pauses");
    await ctx.close(); }
  // 3. Text size
  { const {ctx, p} = await mk(b, {}, "classic", "localStorage.setItem('studyboard:anim','off');localStorage.setItem('studyboard:textsize','xl')"); await p.goto(F); await p.waitForTimeout(1500);
    ok(await p.evaluate(() => getComputedStyle(document.documentElement).fontSize === "20px"), "Extra Large text is a 20px root");
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "no horizontal overflow at Extra Large"); await ctx.close(); }
  // 4. Travel: the same data in Tokyo shows the notice, times stay 11:59 PM
  { const {ctx, p} = await mk(b, {timezoneId: "Asia/Tokyo"}, "classic", "localStorage.setItem('studyboard:anim','off');if(!localStorage.getItem('studyboard:tz'))localStorage.setItem('studyboard:tz','America/Los_Angeles')");
    await p.clock.install({time: new Date("2026-10-31T20:00:00-07:00")}); await p.goto(F); await p.clock.runFor(2500);
    ok(await p.locator("#tzNote").count() === 1, "time zone notice appears after travel");
    ok(await p.evaluate(() => /11:59 PM/.test(document.querySelector("#view").innerText)), "due times still read 11:59 PM");
    await p.locator('[data-act="tz-keep"]').click(); ok(await p.locator("#tzNote").count() === 0, "Keep my times dismisses it"); await ctx.close(); }
  // 5. Contrast on a few themes (rendered text over scenes)
  for (const skin of ["spring", "gardening", "writing"]) for (const scheme of ["light", "dark"]) {
    const {ctx, p} = await mk(b, {colorScheme: scheme, reducedMotion: "reduce"}, skin, "localStorage.setItem('studyboard:anim','off')"); await p.goto(F); await p.waitForTimeout(1500);
    const worst = await p.evaluate(() => { const v = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim(); return {muted: v("--muted"), paper: v("--paper"), surface: v("--surface")}; });
    const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16) / 255).map(x => x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
    const cr = (a, c) => (Math.max(lum(a), lum(c)) + 0.05) / (Math.min(lum(a), lum(c)) + 0.05);
    ok(cr(worst.muted, worst.paper) >= 4.5 && cr(worst.muted, worst.surface) >= 4.5, `${skin} ${scheme}: muted text >= 4.5:1`); await ctx.close();
  }
  await b.close(); console.log(`${n} browser checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
