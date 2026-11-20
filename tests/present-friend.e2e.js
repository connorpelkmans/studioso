// node tests/present-friend.e2e.js: Rehearse With a Friend, without a group or an account. The host starts it and gets a short code;
// the friend opens the join page, types the code and their name, and (over the real encrypted live channel) sees the slide itself
// (a PDF slide's picture), the clock and the notes, and can start the run and move the slides.
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const OUT = require("os").tmpdir() + "/sbfriend";
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) process.exitCode = 1; };
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + server.address().port;
  const b = await chromium.launch({executablePath});
  const hc = await b.newContext({viewport: {width: 1280, height: 800}, serviceWorkers: "block"});
  await hc.addInitScript(() => { window.__SB_TEST = true; localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1");
    new MutationObserver(() => document.querySelectorAll(".cpu").forEach(x => { try { x.hidePopover(); } catch (e) {} x.remove(); })).observe(document, {childList: true, subtree: true}); });
  const H = await hc.newPage(); const errs = []; H.on("pageerror", e => errs.push("host: " + e.message));
  await H.goto(base + "/index.html");
  await H.waitForFunction(() => window.SBPRESENT && window.__sbSync, null, {timeout: 20000}); await H.waitForTimeout(500);
  await H.evaluate(() => window.SBPRESENT.add("")); await H.waitForSelector("#prFile", {state: "attached"});
  await H.setInputFiles("#prFile", path.join(__dirname, "fixtures/present-deck.pdf")); await H.waitForSelector(".pr-picked", {timeout: 20000});
  await H.fill("#prName", "Sleep Talk"); await H.click('[data-act="pr-create"]'); await H.waitForSelector("#prStage .pr-play", {timeout: 15000});
  // no Pro needed: rehearsing with a friend is free
  await H.click('#prStage [data-act="pr-friend"]'); await H.waitForSelector(".pr-fr-code", {timeout: 15000});
  const code = (await H.textContent(".pr-fr-code")).replace(/\s/g, "");
  ok(/^[A-HJ-NP-Z2-9]{8}$/.test(code), "the host gets a short code to send: " + code);
  await H.screenshot({path: OUT + "-host.png"});

  // the friend: the join page, the code and their name
  const fc = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2});
  const F = await fc.newPage(); F.on("pageerror", e => errs.push("friend: " + e.message));
  await F.goto(base + "/present-remote.html");
  await F.waitForSelector("#join:not([hidden])");
  await F.fill("#jcode", "nope"); await F.fill("#jname", "Sam"); await F.click("#join button"); await F.waitForTimeout(200);
  ok(/8 letters and numbers/.test(await F.textContent("#jerr")), "a wrong code says what a code looks like");
  await F.fill("#jcode", code.slice(0, 4).toLowerCase() + "-" + code.slice(4)); await Promise.all([F.waitForNavigation().catch(() => {}), F.click("#join button")]);
  await F.waitForSelector("#ui:not([hidden])", {timeout: 25000}); await F.waitForTimeout(2500);
  ok(/Sleep Talk/.test(await F.textContent("#name")), "the friend sees the presentation");
  await H.waitForFunction(() => /Sam/.test((document.querySelector(".pr-fr-card") || {}).textContent || ""), null, {timeout: 15000}).catch(() => {});
  ok(/Sam is with you/.test(await H.textContent(".pr-fr-card")), "the host sees who joined");
  await F.waitForSelector("#pic:not([hidden]) img[src^='data:image/jpeg']", {timeout: 15000}).catch(() => {});
  ok(await F.locator("#pic:not([hidden]) img[src^='data:image/jpeg']").count() === 1, "the friend sees the slide itself");
  await F.screenshot({path: OUT + "-friend.png"});
  // the friend starts it and moves the slides
  await F.click("#nextb"); await H.waitForTimeout(2500);
  ok(await H.evaluate(() => !!(window.SBPRESENT.px.stage() && window.SBPRESENT.px.stage().started)), "the friend's Start starts the host's clock");
  await F.click("#nextb"); await H.waitForTimeout(2500);
  ok(await H.evaluate(() => window.SBPRESENT.px.stage().i) === 1, "the friend's Next moves the host's slide");
  await F.waitForTimeout(1500);
  ok(/Teens sleep less/.test(await F.textContent("#title")) || /2 \/ 6/.test(await F.textContent("#cnt")), "the friend follows to slide 2: " + await F.textContent("#cnt"));
  await F.screenshot({path: OUT + "-friend-2.png"});
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await b.close(); server.close();
  console.log("present-friend.e2e: done" + (process.exitCode ? "" : ", all passed"));
})().catch(e => { console.error(e); process.exit(1); });
