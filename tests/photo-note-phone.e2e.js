// Photo to Note on a computer: Take Photos shows the same QR code as Scan to PDF; the phone's page (cloudflare/key-relay/src/scan.js,
// run here in-process) sends locked photos through the relay, they show up as thumbnails in Photo to Note, and Make Note turns them
// into a note (the AI's reply is mocked). Choose Photos still picks from the computer; on a phone, Take Photo opens the camera.
// SHOTS=dir saves screenshots at 1280 and 390 wide.
const path = require("path"), fs = require("fs"), assert = require("assert"), {pathToFileURL} = require("url");
const {chromium, executablePath} = require("./pw");
const ROOT = path.join(__dirname, ".."), APP = "https://app.test", RELAY = "https://relay.test", SHOTS = process.env.SHOTS || "";
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const TYPES = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".woff2": "font/woff2"};
const PHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const shot = async (loc, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, {recursive: true}); await loc.screenshot({path: path.join(SHOTS, name)}); } };

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
  const html = require("../scripts/csp").apply(require("../scripts/app-files").source().replace(/const KEY_RELAY = "[^"]*";/, `const KEY_RELAY = "${RELAY}";`));
  ok(html.includes(`const KEY_RELAY = "${RELAY}";`), "test copy of the app points at the test relay");
  const calls = [];
  const relayRoute = async route => {
    const r = route.request(); calls.push(r.method() + " " + new URL(r.url()).pathname);
    const body = ["GET", "HEAD", "OPTIONS"].includes(r.method()) ? undefined : r.postDataBuffer();
    const res = await R.handle(new Request(r.url(), {method: r.method(), headers: r.headers(), body}), env);
    route.fulfill({status: res.status, headers: Object.fromEntries(res.headers), body: res.status === 204 ? "" : Buffer.from(await res.arrayBuffer())});
  };
  const appRoute = route => {
    const p = decodeURIComponent(new URL(route.request().url()).pathname);
    if (p === "/" || p === "/index.html") return route.fulfill({status: 200, contentType: "text/html", body: html});
    const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({status: 404, body: ""});
    route.fulfill({status: 200, contentType: TYPES[path.extname(f)] || "application/octet-stream", body: fs.readFileSync(f)});
  };
  // AI set up (a test key, consent given), and its reply mocked
  const aiBodies = [];
  const seed = () => { try { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1");
    localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } catch (e) {} };
  const mkApp = async opts => {
    const ctx = await browser.newContext(opts);
    await ctx.addInitScript(seed);
    await ctx.route(`${APP}/**`, appRoute);
    await ctx.route(`${RELAY}/**`, relayRoute);
    await ctx.route(/generativelanguage\.googleapis\.com/, route => { aiBodies.push(route.request().postData() || "");
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify({title: "Osmosis", notes: "• Osmosis moves water across a membrane", course: "", dates: []})}]}, finishReason: "STOP"}]})}); });
    const pg = await ctx.newPage(); pg.errs = []; pg.on("pageerror", e => pg.errs.push(e.message));
    await pg.goto(APP + "/"); await pg.waitForFunction(() => document.readyState === "complete" && document.querySelector("#dlg")); await pg.waitForTimeout(1200);
    await pg.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); });
    return pg;
  };
  const openPN = pg => pg.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "note-photo"; document.body.appendChild(b); b.click(); b.remove(); });

  const browser = await chromium.launch({executablePath});
  try {
    const maker = await browser.newPage({viewport: {width: 600, height: 800}});
    await maker.setContent(`<body style="margin:0;background:#2b4a3a"><div style="position:absolute;left:40px;top:60px;width:520px;height:380px;background:#1e3b2c;color:#fff;font:28px Arial;padding:30px;box-sizing:border-box;border:8px solid #8a6a3a">Osmosis<br>water → high solute</div></body>`);
    const photo = await maker.screenshot({type: "png"}); await maker.close();

    /* the computer */
    const pc = await mkApp({viewport: {width: 1280, height: 900}});
    await openPN(pc); await pc.waitForSelector("#dlg[open] #pnGo");
    ok(await pc.locator("#pnPhone").count() === 1 && await pc.locator("#pnCam").count() === 0, "on a computer, Take Photos is a button for the phone, not the camera picker");
    ok(await pc.locator("#pnPick").count() === 1 && await pc.getAttribute("#pnFile", "capture") === null, "Choose Photos picks from the computer");
    ok(await pc.locator("#pnEmpty:not([hidden])").count() === 1, "no photos yet");
    await shot(pc.locator("#dlg .sheet"), "pc-1280-empty.png");

    // a photo from the computer shows as a thumbnail and can be removed
    await pc.setInputFiles("#pnFile", {name: "slide.png", mimeType: "image/png", buffer: photo});
    await pc.waitForSelector("#pnSrcs li img[src^='blob:']");
    ok(await pc.locator("#pnSrcs li").count() === 1 && await pc.locator("#pnEmpty[hidden]").count() === 1, "a photo chosen on the computer shows as a thumbnail");
    await pc.click("#pnSrcs [data-rm='0']");
    ok(await pc.locator("#pnSrcs li").count() === 0, "a photo can be removed");

    await pc.click("#pnPhone");
    await pc.waitForSelector("#pnPhoneP .phone-qr[data-link] svg.qr");
    await pc.waitForFunction(() => /Waiting for photos/.test(document.querySelector("#pnPhoneP .phone-qr").textContent));
    ok(await pc.getAttribute("#pnPhone", "aria-pressed") === "true", "it shows the same QR code panel as Scan to PDF, waiting for photos");
    const link = await pc.getAttribute("#pnPhoneP .phone-qr", "data-link");
    ok(link.startsWith(RELAY + "/s?for=notes#") && /^[A-Za-z0-9_-]{22}$/.test(link.split("#")[1]), "the QR code opens the relay's camera page for notes, with the code after #");
    const code = link.split("#")[1];
    ok(calls.every(c => !c.includes(code)), "the code itself never goes to the relay");
    await shot(pc.locator("#dlg .sheet"), "pc-1280-qr.png");

    /* the phone */
    const pctx = await browser.newContext({viewport: {width: 390, height: 844}, userAgent: PHONE_UA, isMobile: true, hasTouch: true});
    await pctx.route(`${RELAY}/**`, relayRoute);
    const ph = await pctx.newPage(); ph.on("pageerror", e => pc.errs.push("phone: " + e.message));
    await ph.goto(link);
    await ph.waitForFunction(() => /Connected to your computer/.test(document.getElementById("msg").textContent));
    ok(/Photo to Note/.test(await ph.textContent("#intro")) && !/PDF/.test(await ph.textContent("main")), "the phone's page is worded for notes, not a PDF");
    await ph.setInputFiles("#cam", {name: "IMG_0001.png", mimeType: "image/png", buffer: photo});
    await ph.waitForFunction(() => /1 photo sent/.test(document.getElementById("msg").textContent), null, {timeout: 15000});
    ok(true, "the phone sends the photo");
    if (SHOTS) await ph.screenshot({path: path.join(SHOTS, "phone-390-camera-page.png")});

    await pc.waitForSelector("#pnSrcs li img[src^='blob:']", {timeout: 15000});
    await pc.waitForFunction(() => /1 photo from your phone/.test(document.querySelector("#pnPhoneP .phone-qr").textContent));
    ok(await pc.locator("#pnSrcs li").count() === 1, "the phone's photo shows up as a thumbnail in Photo to Note");
    ok(stores.every(m => ![...m.keys()].some(k => /^p\d+$/.test(k))), "the relay keeps nothing once the computer has the photo");
    await shot(pc.locator("#dlg .sheet"), "pc-1280-got-photo.png");

    // Cancel asks first, and Keep keeps the photos
    await pc.click("#pnCancel"); await pc.waitForSelector("#askDlg[open]");
    ok(/Discard Photos/.test(await pc.textContent("#askDlg")), "Cancel asks before throwing the photos away");
    await pc.click("#askNo"); await pc.waitForTimeout(200);
    ok(await pc.locator("#dlg[open] #pnSrcs li").count() === 1, "Keep leaves the sheet and its photos as they were");

    // Make Note: the phone's photo goes to the AI, and the session ends
    await pc.click("#pnGo");
    await pc.waitForSelector("#pnText", {timeout: 15000});
    ok(/Osmosis moves water/.test(await pc.inputValue("#pnText")) && aiBodies.some(b => /image\/jpeg/.test(b)), "Make Note sends the phone's photo to the AI and shows the note to check");
    await pc.waitForTimeout(300);
    ok(calls.some(c => /^DELETE \/v1\/s\/[0-9a-f]{64}$/.test(c)), "making the note ends the phone's session on the relay");
    await pc.click("#pnSave"); await pc.waitForTimeout(400);
    ok(await pc.locator(".note", {hasText: "Osmosis moves water"}).count() === 1, "the note is saved to the board");
    await ph.setInputFiles("#cam", {name: "late.png", mimeType: "image/png", buffer: photo});
    await ph.waitForFunction(() => /run out/.test(document.getElementById("msg").textContent), null, {timeout: 15000});
    ok(true, "a photo after that tells the phone to scan a new code");

    // closing the sheet ends the session (a fresh one, never used)
    const before = calls.filter(c => c.startsWith("DELETE")).length;
    await openPN(pc); await pc.waitForSelector("#dlg[open] #pnPhone");
    await pc.click("#pnPhone"); await pc.waitForFunction(() => /Waiting for photos/.test((document.querySelector("#pnPhoneP .phone-qr") || {}).textContent || ""));
    await pc.click("#pnCancel"); await pc.waitForTimeout(400);
    ok(!(await pc.evaluate(() => document.getElementById("dlg").open)) && calls.filter(c => c.startsWith("DELETE")).length === before + 1, "Cancel with no photos closes without asking, and ends the phone's session");
    // set aside with photos (Escape): the session ends, the photos are kept
    await openPN(pc); await pc.waitForSelector("#dlg[open] #pnPhone");
    await pc.click("#pnPhone"); await pc.waitForFunction(() => /Waiting for photos/.test((document.querySelector("#pnPhoneP .phone-qr") || {}).textContent || ""));
    await pc.setInputFiles("#pnFile", {name: "slide.png", mimeType: "image/png", buffer: photo}); await pc.waitForSelector("#pnSrcs li");
    await pc.keyboard.press("Escape"); await pc.waitForTimeout(2200);
    ok(calls.filter(c => c.startsWith("DELETE")).length === before + 2, "setting the sheet aside ends the phone's session");
    await openPN(pc); await pc.waitForSelector("#dlg[open] #pnSrcs li");
    ok(await pc.locator("#pnPhoneP .phone-qr").count() === 0 && await pc.locator("#pnSrcs li").count() === 1, "opening it again keeps the photos, with the QR code put away");
    await pc.click("#pnCancel"); await pc.waitForSelector("#askDlg[open]"); await pc.click("#askYes"); await pc.waitForTimeout(300);
    ok(!(await pc.evaluate(() => document.getElementById("dlg").open)), "Discard closes it");
    ok(pc.errs.length === 0, "no page errors on the computer: " + pc.errs.join(" | "));

    /* a phone: no QR code; Take Photo opens the camera */
    const pm = await mkApp({viewport: {width: 390, height: 844}, userAgent: PHONE_UA, isMobile: true, hasTouch: true});
    await openPN(pm); await pm.waitForSelector("#dlg[open] #pnGo");
    ok(await pm.locator("#pnPhone").count() === 0 && await pm.getAttribute("#pnCam", "capture") === "environment" && await pm.locator("#pnPick").count() === 1, "on a phone, Take Photo opens the camera and Choose Photos the library (no QR code)");
    await shot(pm.locator("#dlg .sheet"), "phone-390-empty.png");
    await pm.setInputFiles("#pnCam", {name: "IMG_0002.png", mimeType: "image/png", buffer: photo});
    await pm.waitForSelector("#pnSrcs li img");
    await shot(pm.locator("#dlg .sheet"), "phone-390-photo.png");
    ok(pm.errs.length === 0, "no page errors on the phone: " + pm.errs.join(" | "));

    /* a narrow window on a computer still gets the QR code */
    const nw = await mkApp({viewport: {width: 390, height: 844}});
    await openPN(nw); await nw.waitForSelector("#dlg[open] #pnPhone");
    await nw.click("#pnPhone"); await nw.waitForSelector("#pnPhoneP .phone-qr[data-link] svg.qr");
    await nw.waitForTimeout(300);
    await shot(nw.locator("#dlg .sheet"), "pc-390-qr.png");
    ok(await nw.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "the QR panel fits a narrow window");
  } finally { await browser.close(); }
  console.log(`\nphoto-note-phone.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
