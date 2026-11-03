// Scan to PDF on a computer: Take Photos shows a QR code, the phone's page sends locked photos through the relay
// (cloudflare/key-relay/src/scan.js, run here in-process), and they turn up as pages on the computer
const path = require("path"), fs = require("fs"), assert = require("assert"), {pathToFileURL} = require("url");
const {chromium, executablePath} = require("./pw");
const ROOT = path.join(__dirname, ".."), APP = "https://app.test", RELAY = "https://relay.test";
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const TYPES = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".woff2": "font/woff2"};
const PHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

(async () => {
  const R = await import(pathToFileURL(path.join(ROOT, "cloudflare", "key-relay", "src", "relay.js")).href);
  const S = await import(pathToFileURL(path.join(ROOT, "cloudflare", "key-relay", "src", "scan.js")).href);
  const stores = [];
  const mem = () => { const m = new Map(); stores.push(m); return {get: async k => m.get(k), put: async (k, v) => { if (typeof k === "object") Object.entries(k).forEach(([x, y]) => m.set(x, y)); else m.set(k, v); },
    delete: async k => m.delete(k), deleteAll: async () => m.clear(), setAlarm: async () => {}, deleteAlarm: async () => {},
    list: async o => new Map([...m].filter(([k]) => k.startsWith((o && o.prefix) || "")))}; };
  const objs = new Map(), scans = new Map();
  const env = {APP_URL: APP, HANDOFF: {getByName: id => { if (!objs.has(id)) objs.set(id, new R.Slot(mem())); return objs.get(id); }},
    SCAN: {getByName: id => { if (!scans.has(id)) scans.set(id, new S.ScanSession(mem())); return scans.get(id); }}};
  const html = require("../scripts/csp").apply(require("../scripts/app-files").source().replace(/const KEY_RELAY = "[^"]*";/, `const KEY_RELAY = "${RELAY}";`).replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"));
  ok(html.includes(`const KEY_RELAY = "${RELAY}";`), "test copy of the app points at the test relay");
  const calls = [], sentBodies = [];
  const relayRoute = async route => {
    const r = route.request(); calls.push(r.method() + " " + new URL(r.url()).pathname);
    const body = ["GET", "HEAD", "OPTIONS"].includes(r.method()) ? undefined : r.postDataBuffer();
    if (body && /\/p$/.test(new URL(r.url()).pathname)) sentBodies.push(body);
    const res = await R.handle(new Request(r.url(), {method: r.method(), headers: r.headers(), body}), env);
    route.fulfill({status: res.status, headers: Object.fromEntries(res.headers), body: res.status === 204 ? "" : Buffer.from(await res.arrayBuffer())});
  };

  const browser = await chromium.launch({executablePath});
  try {
    // a photo of a page: white paper on a dark desk
    const maker = await browser.newPage({viewport: {width: 600, height: 800}});
    await maker.setContent(`<body style="margin:0;background:#333"><div style="position:absolute;left:60px;top:70px;width:470px;height:640px;background:#fff;font:22px Arial;padding:30px;box-sizing:border-box">Homework 3<br>1. Osmosis moves water.</div></body>`);
    const photo = await maker.screenshot({type: "png"}); await maker.close();

    // the computer
    const cctx = await browser.newContext({viewport: {width: 1100, height: 900}});
    await cctx.addInitScript(() => { try { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); } } catch (e) {} });
    await cctx.route(`${APP}/**`, route => {
      const u = new URL(route.request().url()); const p = decodeURIComponent(u.pathname);
      if (p === "/" || p === "/index.html") return route.fulfill({status: 200, contentType: "text/html", body: html});
      const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({status: 404, body: ""});
      route.fulfill({status: 200, contentType: TYPES[path.extname(f)] || "application/octet-stream", body: fs.readFileSync(f)});
    });
    await cctx.route(`${RELAY}/**`, relayRoute);
    const pc = await cctx.newPage(); const errs = []; pc.on("pageerror", e => errs.push(e.message));
    await pc.goto(APP + "/"); await pc.waitForFunction(() => document.readyState === "complete" && document.querySelector("#dlg")); await pc.waitForTimeout(1200);
    await pc.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); const b = document.createElement("button"); b.dataset.act = "pde-scan"; document.body.appendChild(b); b.click(); b.remove(); });
    await pc.waitForSelector("#pdeScanDlg[open]");
    ok(await pc.locator('#pdeScanDlg button[data-scan="phone"]').count() === 1 && await pc.locator("#pdeScanDlg input[capture]").count() === 0, "on a computer, Take Photos is a button for the phone, not the file picker");
    ok(await pc.locator("#pdeScanDlg input[data-scan-in]:not([capture])").count() === 1, "Choose Photos is still there");
    await pc.click('#pdeScanDlg button[data-scan="phone"]');
    await pc.waitForSelector("#pdeScanDlg .pde-phone[data-link] svg.qr");
    await pc.waitForFunction(() => /Waiting for photos/.test(document.querySelector(".pde-phone").textContent));
    ok(true, "it shows a QR code and waits for photos");
    if (process.env.SHOT) await pc.locator("#pdeScanDlg .sheet").screenshot({path: process.env.SHOT});
    const link = await pc.getAttribute(".pde-phone", "data-link");
    ok(link.startsWith(RELAY + "/s#") && /^[A-Za-z0-9_-]{22}$/.test(link.split("#")[1]), "the QR code opens the relay's camera page, with the code after # (never sent to the relay)");
    const code = link.split("#")[1];
    ok(calls.every(c => !c.includes(code)), "the code itself never goes to the relay");

    // the phone
    const pctx = await browser.newContext({viewport: {width: 390, height: 844}, userAgent: PHONE_UA, isMobile: true, hasTouch: true});
    await pctx.route(`${RELAY}/**`, relayRoute);
    const ph = await pctx.newPage(); ph.on("pageerror", e => errs.push("phone: " + e.message));
    await ph.goto(link);
    await ph.waitForFunction(() => /Connected to your computer/.test(document.getElementById("msg").textContent));
    ok(true, "the phone's page connects");
    ok(await ph.evaluate(() => location.hash === ""), "the phone's page takes the code out of the address bar");
    await ph.setInputFiles("#cam", {name: "IMG_0001.png", mimeType: "image/png", buffer: photo});
    await ph.waitForFunction(() => /1 page sent/.test(document.getElementById("msg").textContent), null, {timeout: 15000});
    ok(true, "the phone sends the photo");
    const posted = calls.filter(c => /^POST \/v1\/s\/[0-9a-f]{64}\/p$/.test(c)).length;
    ok(posted === 1, "one locked photo was posted");

    await pc.waitForSelector(".pde-scanlist li img[src^='data:']", {timeout: 15000});
    ok(await pc.locator(".pde-scanlist li").count() === 1, "the photo shows up as a page on the computer");
    await pc.waitForFunction(() => /1 photo from your phone/.test(document.querySelector(".pde-phone").textContent));
    ok(true, "the computer counts the photos from the phone");
    ok(stores.every(m => ![...m.keys()].some(k => /^p\d+$/.test(k))), "the relay keeps nothing once the computer has the photo");
    ok(sentBodies.length === 1 && sentBodies.every(b => b.length > 1000 && !(b[0] === 0xff && b[1] === 0xd8) && !b.includes(Buffer.from("JFIF")) && !b.includes(Buffer.from("Exif"))), "what the phone sends is locked: not a readable JPEG");

    // two more from the phone's photo library
    await ph.setInputFiles("#pick", [{name: "a.png", mimeType: "image/png", buffer: photo}, {name: "b.png", mimeType: "image/png", buffer: photo}]);
    await ph.waitForFunction(() => /3 pages sent/.test(document.getElementById("msg").textContent), null, {timeout: 20000});
    await pc.waitForFunction(() => document.querySelectorAll(".pde-scanlist li").length === 3, null, {timeout: 20000});
    ok(true, "several photos at once arrive in order");

    // closing Scan to PDF ends the session; the phone is told
    await pc.click('#pdeScanDlg [data-scan="close"]').catch(() => pc.evaluate(() => document.querySelector('#pdeScanDlg [data-scan="close"]').click()));
    await pc.waitForTimeout(400);
    ok(calls.some(c => /^DELETE \/v1\/s\/[0-9a-f]{64}$/.test(c)), "closing Scan to PDF ends the session on the relay");
    await ph.setInputFiles("#cam", {name: "late.png", mimeType: "image/png", buffer: photo});
    await ph.waitForFunction(() => /run out/.test(document.getElementById("msg").textContent), null, {timeout: 15000});
    ok(true, "a photo after that tells the phone to scan a new code");

    // a phone doesn't get the QR code: Take Photos opens its camera
    const mctx = await browser.newContext({viewport: {width: 390, height: 844}, userAgent: PHONE_UA, isMobile: true, hasTouch: true});
    await mctx.addInitScript(() => { try { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); } } catch (e) {} });
    await mctx.route(`${APP}/**`, route => {
      const p = decodeURIComponent(new URL(route.request().url()).pathname);
      if (p === "/" || p === "/index.html") return route.fulfill({status: 200, contentType: "text/html", body: html});
      const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({status: 404, body: ""});
      route.fulfill({status: 200, contentType: TYPES[path.extname(f)] || "application/octet-stream", body: fs.readFileSync(f)});
    });
    const pm = await mctx.newPage();
    await pm.goto(APP + "/"); await pm.waitForFunction(() => document.readyState === "complete" && document.querySelector("#dlg")); await pm.waitForTimeout(1200);
    await pm.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); const b = document.createElement("button"); b.dataset.act = "pde-scan"; document.body.appendChild(b); b.click(); b.remove(); });
    await pm.waitForSelector("#pdeScanDlg[open]");
    ok(await pm.locator("#pdeScanDlg input[capture]").count() === 1 && await pm.locator('#pdeScanDlg button[data-scan="phone"]').count() === 0, "on a phone, Take Photos opens the camera as before");

    ok(errs.length === 0, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); }
  console.log(`\nscan-phone.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
