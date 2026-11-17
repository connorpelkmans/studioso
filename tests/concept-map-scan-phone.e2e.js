// Concept maps, Scan a Drawing: on a computer, Take Photo With Your Phone shows the QR code (as Scan to PDF and Photo to Note do); the
// phone's page (cloudflare/key-relay/src/scan.js, run here in-process), worded for a concept map, sends the photo locked through the relay,
// it shows as the drawing, the phone's link closes, and Scan My Drawing makes the map (the AI's reply is mocked). Upload a Picture picks
// from the computer; on a phone, Take Photo opens the camera. SHOTS=dir saves screenshots.
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
  const html = require("../scripts/csp").apply(require("../scripts/app-files").source().replace(/const KEY_RELAY = "[^"]*";/, `const KEY_RELAY = "${RELAY}";`).replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"));
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
    localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}}));
    localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO 101", color: "#7C5CFF"}], tasks: [], notes: [], decks: [], files: [], events: []})); localStorage.setItem("studioso:welcomed", "1"); } } catch (e) {} };
  const mkApp = async opts => {
    const ctx = await browser.newContext(opts);
    await ctx.addInitScript(seed);
    await ctx.route(`${APP}/**`, appRoute);
    await ctx.route(`${RELAY}/**`, relayRoute);
    await ctx.route(/generativelanguage\.googleapis\.com/, route => { aiBodies.push(route.request().postData() || "");
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify({center: "Osmosis", cx: 50, cy: 50, concepts: [{name: "Water", x: 20, y: 30, shape: "cloud"}, {name: "Membrane", x: 80, y: 70, shape: "box"}], links: [{from: "Osmosis", to: "Water", label: "moves", arrow: "end", line: "solid"}, {from: "Water", to: "Membrane", label: "crosses", arrow: "end", line: "dashed"}]})}]}, finishReason: "STOP"}]})}); });
    const pg = await ctx.newPage(); pg.errs = []; pg.on("pageerror", e => pg.errs.push(e.message));
    await pg.goto(APP + "/"); await pg.waitForFunction(() => document.readyState === "complete" && document.querySelector("#dlg")); await pg.waitForTimeout(1200);
    await pg.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); });
    return pg;
  };
  const newScan = async pg => { await pg.waitForFunction(() => window.SBCMAP && window.__sbProStudy, null, {timeout: 20000}).catch(async e => { console.log("ERRS", pg.errs, await pg.evaluate(() => ({cm: typeof window.SBCMAP, pro: typeof window.__sbProStudy, view: (document.querySelector("#view") || {}).textContent && document.querySelector("#view").textContent.slice(0, 120)}))); throw e; }); await pg.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "cm-new"; b.dataset.course = "c1"; document.body.appendChild(b); b.click(); b.remove(); });
    await pg.waitForSelector("#cmName"); await pg.check('[name="cmStart"][value="scan"]'); await pg.waitForTimeout(150); };
  const browser = await chromium.launch({executablePath});
  try {
    const maker = await browser.newPage({viewport: {width: 600, height: 800}});
    await maker.setContent(`<body style="margin:0;background:#fff"><div style="position:absolute;left:60px;top:80px;border:4px solid #222;border-radius:30px;padding:20px 40px;font:32px Arial">Osmosis</div><div style="position:absolute;left:300px;top:400px;border:4px solid #222;padding:20px 40px;font:32px Arial">Water</div></body>`);
    const photo = await maker.screenshot({type: "png"}); await maker.close();

    /* the computer */
    const pc = await mkApp({viewport: {width: 1280, height: 900}});
    await newScan(pc);
    ok(await pc.locator("[data-scan-phone]").count() === 1 && await pc.locator("[data-scan-pick]").count() === 1 && /Upload a Picture/.test(await pc.textContent("[data-scan-pick]")) && await pc.locator("#cmScanCam").count() === 0,
      "on a computer: Take Photo With Your Phone and Upload a Picture (no camera picker)");
    await pc.click("[data-scan-phone]");
    await pc.waitForSelector("[data-scan-qr] .phone-qr[data-link] svg.qr");
    await pc.waitForFunction(() => /Waiting for photos/.test(document.querySelector("[data-scan-qr] .phone-qr").textContent));
    const link = await pc.getAttribute("[data-scan-qr] .phone-qr", "data-link");
    ok(link.startsWith(RELAY + "/s?for=map#") && await pc.getAttribute("[data-scan-phone]", "aria-pressed") === "true", "it shows the QR code, for the phone's concept-map page");
    if (SHOTS) await pc.locator("#dlg .sheet").screenshot({path: path.join(SHOTS, "cm-scan-qr-1280.png")});

    /* the phone */
    const pctx = await browser.newContext({viewport: {width: 390, height: 844}, userAgent: PHONE_UA, isMobile: true, hasTouch: true});
    await pctx.route(`${RELAY}/**`, relayRoute);
    const ph = await pctx.newPage(); ph.on("pageerror", e => pc.errs.push("phone: " + e.message));
    await ph.goto(link);
    await ph.waitForFunction(() => /Connected to your computer/.test(document.getElementById("msg").textContent));
    ok(/concept map you drew/.test(await ph.textContent("#intro")) && !/PDF|Photo to Note/.test(await ph.textContent("main")), "the phone's page is worded for a concept map");
    await ph.setInputFiles("#cam", {name: "IMG_0001.png", mimeType: "image/png", buffer: photo});
    await ph.waitForFunction(() => /1 photo sent/.test(document.getElementById("msg").textContent), null, {timeout: 15000});

    await pc.waitForSelector("[data-cm-shot]:not([hidden])", {timeout: 15000});
    await pc.waitForFunction(() => !document.querySelector("[data-scan-qr] .phone-qr"));
    ok(/^blob:/.test(await pc.getAttribute("[data-cm-shot]", "src")) && await pc.getAttribute("[data-scan-phone]", "aria-pressed") === "false", "the phone's photo shows as the drawing, and the phone's link closes");
    await pc.fill("#cmName", ""); await pc.click("#dlg[open] [data-submit]");
    await pc.waitForSelector('.cm-node[data-n="root"]', {timeout: 20000});
    const mp = await pc.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).courses.find(c => c.id === "c1").maps[0]);
    ok(mp.name === "Osmosis" && mp.add.length === 2 && aiBodies.length === 1 && /image\/jpeg/.test(aiBodies[0]), "Scan My Drawing makes the map from the phone's photo");
    ok(pc.errs.length === 0, "no errors on the computer or the phone: " + pc.errs.join(" | "));

    /* a phone, by itself */
    const pp = await browser.newContext({viewport: {width: 390, height: 844}, userAgent: PHONE_UA, isMobile: true, hasTouch: true});
    await pp.addInitScript(seed); await pp.route(`${APP}/**`, appRoute); await pp.route(`${RELAY}/**`, relayRoute);
    const pg2 = await pp.newPage(); await pg2.goto(APP + "/"); await pg2.waitForFunction(() => document.readyState === "complete" && window.SBCMAP); await pg2.waitForTimeout(800);
    await pg2.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await newScan(pg2);
    ok(await pg2.locator("[data-scan-phone]").count() === 0 && /Take Photo/.test(await pg2.textContent("[data-scan-cam]")) && await pg2.getAttribute("#cmScanCam", "capture") === "environment" && /Choose a Picture/.test(await pg2.textContent("[data-scan-pick]")),
      "on a phone: Take Photo opens the camera, and Choose a Picture");
    await pg2.setInputFiles("#cmScanCam", {name: "IMG.png", mimeType: "image/png", buffer: photo}); await pg2.waitForSelector("[data-cm-shot]:not([hidden])");
    ok(true, "a photo from the phone's camera shows as the drawing");
    if (SHOTS) await pg2.screenshot({path: path.join(SHOTS, "cm-scan-phone-390.png")});
  } finally { await browser.close(); }
  console.log(`concept-map-scan-phone.e2e: ${n} passed`);
})().catch(e => { console.error(e); process.exit(1); });
