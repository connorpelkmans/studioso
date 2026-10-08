// Browser test for Paste My Key and Add AI to Another Device, with several browser contexts standing in for separate devices.
// Run: node tests/key-handoff.e2e.js    (Playwright + Chromium; the app is served from this folder at https://app.test with KEY_RELAY set,
// the relay is cloudflare/key-relay/src/relay.js running in this process, and Gemini is stubbed)
// Covers: a code made on one device and typed on another (any case, no dashes) brings the keys over and turns AI on; the first device
// sees "Done"; a used code fails; a scanned link (#sbkey=) is taken off the address and asks before fetching; Paste My Key with a
// key, with nothing useful on the clipboard, and with a bad key; coming back to the tab with a key copied; pasting into the box.
const path = require("path"), fs = require("fs"), assert = require("assert"), {pathToFileURL} = require("url");
const {chromium, executablePath} = require("./pw");
const ROOT = path.join(__dirname, ".."), APP = "https://app.test", RELAY = "https://relay.test";
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const KEY = "AIzaSyD-abcdefghijklmnopqrstuvwxyz_0123", KEY2 = "AIzaSyD-zyxwvutsrqponmlkjihgfedcba_9876", BADKEY = "AIzaSyD-bbbbbbbbbbbbbbbbbbbbbbbbbbb_0000";
const TYPES = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json"};

(async () => {
  const R = await import(pathToFileURL(path.join(ROOT, "cloudflare", "key-relay", "src", "relay.js")).href);
  const mem = () => { const m = new Map(); return {get: async k => m.get(k), put: async (k, v) => { if (typeof k === "object") Object.entries(k).forEach(([x, y]) => m.set(x, y)); else m.set(k, v); },
    delete: async k => m.delete(k), deleteAll: async () => m.clear(), setAlarm: async () => {}, deleteAlarm: async () => {}}; };
  const objs = new Map(), env = {APP_URL: APP, HANDOFF: {getByName: id => { if (!objs.has(id)) objs.set(id, new R.Slot(mem())); return objs.get(id); }}};
  // The relay address changes an inline script, so its CSP hash is refreshed the same way the build does it.
  const html = require("../scripts/csp").apply(fs.readFileSync(path.join(ROOT, "index.html"), "utf8").replace('const KEY_RELAY = "";', `const KEY_RELAY = "${RELAY}";`));
  ok(html.includes(`const KEY_RELAY = "${RELAY}";`), "test copy of the app points at the test relay");

  const browser = await chromium.launch({executablePath});
  const device = async (keys, opts) => {
    const ctx = await browser.newContext({viewport: {width: 900, height: 900}});
    await ctx.addInitScript(([keys]) => {
      try { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1");
        if (keys) localStorage.setItem("studyboard:aiKeys", JSON.stringify(keys));
        localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } catch (e) {}
    }, [keys]);
    await ctx.route(`${APP}/**`, route => {
      const u = new URL(route.request().url()); let p = decodeURIComponent(u.pathname);
      if (p === "/" || p === "/index.html") return route.fulfill({status: 200, contentType: "text/html", body: html});
      const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({status: 404, body: ""});
      route.fulfill({status: 200, contentType: TYPES[path.extname(f)] || "application/octet-stream", body: fs.readFileSync(f)});
    });
    ctx.relayCalls = [];
    await ctx.route(`${RELAY}/**`, async route => {
      const r = route.request(); ctx.relayCalls.push(r.method() + " " + new URL(r.url()).pathname);
      const res = await R.handle(new Request(r.url(), {method: r.method(), headers: r.headers(), body: ["GET", "HEAD", "OPTIONS"].includes(r.method()) ? undefined : r.postData()}), env);
      route.fulfill({status: res.status, headers: Object.fromEntries(res.headers), body: res.status === 204 ? "" : Buffer.from(await res.arrayBuffer())});
    });
    ctx.geminiKeys = [];
    await ctx.route(/generativelanguage\.googleapis\.com/, route => {
      const k = route.request().headers()["x-goog-api-key"]; ctx.geminiKeys.push(k);
      if (k === BADKEY) return route.fulfill({status: 400, contentType: "application/json", body: JSON.stringify({error: {code: 400, message: "API key not valid. Please pass a valid API key.", status: "INVALID_ARGUMENT"}})});
      if (/\/models(\?|$)/.test(route.request().url())) return route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({models: []})});
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: '{"ok": true}'}]}, finishReason: "STOP"}]})});
    });
    if (opts && opts.clipboard) await ctx.grantPermissions(["clipboard-read", "clipboard-write"], {origin: APP});
    const page = await ctx.newPage();
    page.on("pageerror", e => { console.error("page error:", e.message); });
    await page.goto(APP + "/" + ((opts && opts.hash) || ""));
    await page.waitForFunction(() => document.readyState === "complete" && document.querySelector("#dlg"));
    return {ctx, page};
  };
  const savedKeys = page => page.evaluate(() => JSON.parse(localStorage.getItem("studyboard:aiKeys") || "{}"));
  const toast = page => page.evaluate(() => (document.querySelector("#toastMsg") || {}).textContent || "");
  const closeAll = page => page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); });
  // Waits until nothing else (a welcome or what's-new sheet) is in the way, then opens AI Features.
  // The page's functions aren't globals, so AI Features is opened the way a Settings button does it (a data-act="ai-setup" click).
  const openAi = async page => { await page.waitForTimeout(1500); await closeAll(page);
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "ai-setup"; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForSelector("#aiPaste"); };

  try {
    // ---- 1. Device A (set up) shows a code; device B types it.
    const A = await device({gemini: KEY, anthropic: "sk-ant-" + "k".repeat(40)});
    await openAi(A.page);
    ok(await A.page.$("#aiHoSend"), "a set-up device offers Add AI to Another Device");
    await A.page.click("#aiHoSend");
    await A.page.waitForSelector(".kho-code", {timeout: 15000});
    const code = (await A.page.textContent(".kho-code")).trim();
    ok(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(code), "shows a code: " + code);
    ok(await A.page.$(".kho svg.qr path"), "and a QR code");
    ok(/Claude/.test(await A.page.textContent(".kho")), "says which keys it sends");
    ok(A.ctx.relayCalls.some(c => /^POST \/v1\/h\/[0-9a-f]{64}$/.test(c)), "left a locked box with the relay");
    const stored = [...objs.values()][0];
    ok(!JSON.stringify(await stored.s.get("box")).includes(KEY.slice(8)), "the relay holds ciphertext, not the key");

    const B = await device(null);
    await openAi(B.page);
    ok(!(await B.page.$("#aiHoSend")), "a device without keys doesn't offer to send");
    await B.page.click("#aiHoIn summary");
    await B.page.fill("#aiHoCode", code.replace(/-/g, "").toLowerCase());
    await B.page.click("#aiHoGet");
    await B.page.waitForFunction(() => /came from your other device/.test((document.querySelector("#toastMsg") || {}).textContent || ""), null, {timeout: 15000});
    const bk = await savedKeys(B.page);
    ok(bk.gemini === KEY && bk.anthropic === "sk-ant-" + "k".repeat(40), "device B now has both keys");
    
    await A.page.waitForFunction(() => /Done\./.test((document.querySelector("#kho") || {}).textContent || ""), null, {timeout: 10000});
    ok(true, "device A sees that the other device took the keys");

    // ---- 2. The same code again fails with a clear message.
    const C = await device(null);
    await openAi(C.page);
    await C.page.click("#aiHoIn summary");
    await C.page.fill("#aiHoCode", code);
    await C.page.click("#aiHoGet");
    await C.page.waitForFunction(() => /didn't work/.test(document.querySelector("#aiHoMsg").textContent), null, {timeout: 15000});
    ok(Object.keys(await savedKeys(C.page)).length === 0, "a used code brings nothing");
    await C.page.fill("#aiHoCode", "abc");
    await C.page.click("#aiHoGet");
    ok(/12 letters and numbers/.test(await C.page.textContent("#aiHoMsg")), "a code that's too short is explained");

    // ---- 3. A scanned link: the code leaves the address at once and nothing is fetched until Add Keys.
    await openAi(A.page);
    await A.page.click("#aiHoSend");
    await A.page.waitForSelector(".kho-code", {timeout: 15000});
    const code2 = (await A.page.textContent(".kho-code")).trim();
    ok(code2 !== code, "a new code each time");
    const qrLink = `${RELAY}/k#${code2}`;
    const D = await device(null, {hash: "#sbkey=" + code2});
    ok(!/sbkey/.test(await D.page.evaluate(() => location.href)), "the code is taken off the address");
    await D.page.waitForSelector("#aiHoAsk", {timeout: 15000});
    ok(!D.ctx.relayCalls.some(c => c.startsWith("GET /v1/h/") && !c.endsWith("/status")), "nothing fetched before the person says yes");
    ok((await D.page.textContent("#aiHoAsk")).includes(code2), "the question shows the code");
    await D.page.click("#aiHoYes");
    await D.page.waitForFunction(() => /came from your other device/.test((document.querySelector("#toastMsg") || {}).textContent || ""), null, {timeout: 15000});
    ok((await savedKeys(D.page)).gemini === KEY, "the scanned link brought the keys over");
    // The relay page the QR code opens (checked here too, against the same relay) links back into the app with the code.
    const Rp = await A.ctx.newPage();
    await Rp.goto(qrLink.replace(code2, "K7Q2-9XMD-4TRP"));
    await Rp.waitForSelector("#code");
    ok((await Rp.textContent("#code")) === "K7Q2-9XMD-4TRP" && (await Rp.getAttribute("#open", "href")) === `${APP}#sbkey=K7Q2-9XMD-4TRP`, "the QR page shows the code and an Open Studyboard link");
    await Rp.close();

    // ---- 4. Paste My Key.
    const E = await device(null, {clipboard: true});
    await openAi(E.page);
    await E.page.evaluate(() => navigator.clipboard.writeText("nothing useful here"));
    await E.page.click("#aiPaste");
    await E.page.waitForFunction(() => /no Gemini key on the clipboard/.test(document.querySelector("#aiPasteMsg").textContent), null, {timeout: 5000});
    ok(true, "nothing useful on the clipboard is explained");
    await E.page.evaluate(k => navigator.clipboard.writeText("Your API key\n" + k + "\n"), BADKEY);
    await E.page.click("#aiPaste");
    await E.page.waitForFunction(() => /tap Paste My Key again/.test(document.querySelector("#aiPasteMsg").textContent), null, {timeout: 10000});
    ok(Object.keys(await savedKeys(E.page)).length === 0, "a key Google refuses is not saved");
    await E.page.evaluate(k => navigator.clipboard.writeText("Your API key\n" + k + "\n"), KEY2);
    await E.page.click("#aiPaste");
    await E.page.waitForFunction(() => /AI is on/.test((document.querySelector("#toastMsg") || {}).textContent || ""), null, {timeout: 10000});
    ok((await savedKeys(E.page)).gemini === KEY2 && E.ctx.geminiKeys.includes(KEY2), "Paste My Key checked the key with Google and saved it");
    ok(!(await E.page.evaluate(() => document.querySelector("#dlg").open)), "and closed the window");

    // ---- 5. Coming back to the tab with a key copied (clipboard already allowed) is enough.
    const F = await device(null, {clipboard: true});
    await openAi(F.page);
    await F.page.evaluate(k => navigator.clipboard.writeText(k), KEY2);
    await F.page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await F.page.waitForFunction(() => /AI is on/.test((document.querySelector("#toastMsg") || {}).textContent || ""), null, {timeout: 10000});
    ok((await savedKeys(F.page)).gemini === KEY2, "the key was picked up on return");

    // ---- 6. Pasting into the key box checks and saves too; pasting a code there fetches keys instead.
    const G = await device(null);
    await openAi(G.page);
    await G.page.focus('[data-key="gemini"]');
    await G.page.evaluate(k => { const i = document.querySelector('[data-key="gemini"]'), dt = new DataTransfer(); dt.setData("text/plain", k); i.dispatchEvent(new ClipboardEvent("paste", {clipboardData: dt, bubbles: true, cancelable: true})); }, KEY);
    await G.page.waitForFunction(() => /AI is on/.test((document.querySelector("#toastMsg") || {}).textContent || ""), null, {timeout: 10000});
    ok((await savedKeys(G.page)).gemini === KEY, "pasting the key into the box saves it");

    // ---- 7. Closing the code window early deletes the box from the relay.
    await openAi(A.page);
    await A.page.click("#aiHoSend");
    await A.page.waitForSelector(".kho-code", {timeout: 15000});
    await A.page.click('#dlg [data-act="close"]');
    await A.page.waitForTimeout(500);
    ok(A.ctx.relayCalls.some(c => c.startsWith("DELETE /v1/h/")), "closing early deletes the box");

    console.log(`key-handoff e2e: ${n} checks passed`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
