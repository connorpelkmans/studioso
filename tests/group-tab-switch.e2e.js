// A group's section tabs switch at once and hold still: no fade-up on the revealed section, and a live update landing
// mid-switch neither redraws the header (whose phone buttons used to fold into More a frame late, so the section jumped
// down a line and back) nor resets the tab row's sideways scroll. Desktop and phone, study group and group project.
const path = require("path"), assert = require("assert");
const file = path.resolve(__dirname, "..", "index.html");
const {chromium, executablePath} = require("./pw");
const {stubInit} = require("./group-stub");
let checks = 0; const ok = (c, m) => { checks++; assert(c, m); };

async function run(browser, label, ctxOpts, kind){
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.addInitScript(stubInit, {me: "u1", kind, seed: true});
  await page.goto("file://" + file); await page.waitForTimeout(1500);
  await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "grp-page"; document.body.appendChild(b); b.click(); b.remove(); });
  await page.waitForSelector('[data-act="grp-open"]'); await page.click('[data-act="grp-open"]');
  await page.waitForSelector("#grpDetail"); await page.waitForTimeout(1500);
  await page.evaluate(() => {
    window.__rm = [];
    new MutationObserver(ms => ms.forEach(m => [...m.removedNodes].forEach(n => { if (n.nodeType === 1 && n.id) window.__rm.push(n.id); }))).observe(document.getElementById("view"), {childList: true, subtree: true});
  });
  const tabs = await page.$$eval("#grpDetail .grp-tabs [role=tab]", bs => bs.map(b => b.dataset.t));
  ok(tabs.length >= 4, `${label}: the group has its section tabs (${tabs})`);
  // the tab row scrolled sideways a little (phones), to see that a live update keeps it there
  const sx0 = await page.evaluate(() => { const r = document.querySelector("#grpDetail .grp-tabs"); r.scrollLeft = 30; return r.scrollLeft; });

  // Switch to a tab and watch every frame for ~0.9s; with `live`, a realtime change arrives 40ms after the click
  const watch = (t, live) => page.evaluate(({t, live}) => new Promise(res => {
    window.__rm = []; const out = [], t0 = performance.now(); let f = 0;
    const tick = () => {
      const p = document.getElementById("grpPane-" + t), r = p.getBoundingClientRect(), cs = getComputedStyle(p), row = document.querySelector("#grpDetail .grp-tabs");
      out.push({top: Math.round(r.top), op: +cs.opacity, tf: cs.transform, hidden: p.hidden, sx: row.scrollLeft, head: Math.round(document.getElementById("grpHead").getBoundingClientRect().height)});
      if (++f === 2) { document.querySelector(`#grpDetail .grp-tabs [data-t="${t}"]`).click(); if (live) setTimeout(() => window.__fire(live), 40); }
      if (performance.now() - t0 < 900) requestAnimationFrame(tick); else res({frames: out.filter(x => !x.hidden), rm: window.__rm});
    };
    requestAnimationFrame(tick);
  }), {t, live});

  const check = (name, {frames, rm}, sx) => {
    ok(frames.length > 10, `${name}: section shown`);
    const tops = [...new Set(frames.map(x => x.top))], heads = [...new Set(frames.map(x => x.head))];
    ok(tops.length === 1, `${name}: the section sits still from its first frame (tops ${tops})`);
    ok(heads.length === 1, `${name}: the header keeps its height (${heads})`);
    ok(frames.every(x => x.op === 1 && x.tf === "none"), `${name}: no fade or slide on the section (${frames.slice(0, 3).map(x => x.op + "/" + x.tf)})`);
    ok(!rm.includes("grpHead"), `${name}: the header (and its tab row) is not redrawn (${rm})`);
    ok(rm.filter(id => id.startsWith("grpPane-")).length === 0, `${name}: the section itself is never replaced`);
    const ids = rm.filter((id, i) => rm.indexOf(id) !== i);
    ok(ids.length === 0, `${name}: each part is redrawn at most once (${ids})`);
    if (sx != null) ok(frames.every(x => Math.abs(x.sx - sx) <= 1), `${name}: tab row keeps its sideways scroll (${[...new Set(frames.map(x => x.sx))]} vs ${sx})`);
  };
  for (const t of tabs.slice(1).concat(tabs[0])) check(`${label} ${t}`, await watch(t), sx0);
  for (const [t, live] of [[tabs[1], "group_items"], [tabs[2], "group_messages"], [tabs[3], "group_members"], [tabs[1], "group_tasks"]]) {
    const r = await watch(t, live); await page.waitForTimeout(500);
    check(`${label} ${t} + live ${live}`, r, sx0);
  }
  // rapid switching: nothing gets redrawn, the last tab wins
  await page.evaluate(() => { window.__rm = []; });
  for (const t of tabs.concat(tabs.slice().reverse())) { await page.click(`#grpDetail .grp-tabs [data-t="${t}"]`, {force: true}); await page.waitForTimeout(25); }
  ok((await page.evaluate(() => window.__rm)).length === 0, `${label}: rapid switching redraws nothing`);
  ok(await page.evaluate(t => !document.getElementById("grpPane-" + t).hidden && document.querySelectorAll("#grpDetail .grp-pane:not([hidden])").length === 1, tabs[0]), `${label}: the last tab tapped is the one shown`);
  // a real change to the header still shows (a new member)
  const folded = await page.evaluate(() => !!document.querySelector("#grpHead .row-actions > .ra-more"));
  await page.evaluate(() => { window.__DB.group_members.push({group_id: "g1", user_id: "u9", role: "member", display_name: "Lee", joined_at: new Date().toISOString()}); window.__fire("group_members"); });
  await page.waitForTimeout(900);
  ok(await page.evaluate(() => /4 Members/.test(document.getElementById("grpHead").textContent)), `${label}: a new member still updates the header`);
  ok(await page.evaluate(() => !!document.querySelector("#grpHead .row-actions > .ra-more")) === folded, `${label}: the redrawn header's buttons fold into More as before (${folded})`);
  ok(!errs.length, `${label}: no page errors (${errs})`);
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    for (const kind of ["study", "project"]) {
      await run(browser, "desktop " + kind, {viewport: {width: 1280, height: 860}}, kind);
      await run(browser, "phone " + kind, {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, deviceScaleFactor: 2, colorScheme: "dark"}, kind);
    }
    console.log(`group-tab-switch.e2e.js: ${checks} checks passed`);
  } catch(e) { console.error("FAILED:", e.message); process.exitCode = 1; }
  await browser.close();
})();
