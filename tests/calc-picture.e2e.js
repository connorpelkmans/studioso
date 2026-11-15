// Browser test: bringing an equation into the calculator from outside the app (99-calc-snip.js, 99-calculator.js):
// Picture (a file), Paste Picture (the clipboard), Capture from Screen (the browser's screen sharing; the desktop app's
// overlay, with the app's side stubbed) and the desktop overlay page itself in its calculator mode (shot.html).
// Run: node tests/calc-picture.e2e.js
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".ico": "image/x-icon"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const gem = text => ({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text}]}, finishReason: "STOP"}]})});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
// A picture of "3(4+1)" on white, w × h, the math in the middle
const PIC_JS = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.fillStyle = "#000"; g.font = `${Math.round(h / 4)}px serif`; g.textAlign = "center"; g.fillText("3(4+1)", w / 2, h / 2); return c; };

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mk = async (o = {}) => {
    const ctx = await browser.newContext({viewport: o.viewport || {width: 1280, height: 860}, serviceWorkers: "block", hasTouch: !!o.touch, isMobile: !!o.touch, ...(o.ua ? {userAgent: o.ua} : {})}); ctx.sent = [];
    await ctx.route(/generativelanguage\.googleapis\.com/, route => {
      const body = route.request().postData() || ""; ctx.sent.push(body);
      route.fulfill(gem(/inline_data/.test(body) ? JSON.stringify({found: true, calc: "3(4+1)", angle: "none"}) : JSON.stringify({found: false, calc: "", angle: "none"})));
    });
    await ctx.addInitScript(([ai, desk]) => { try { if (!localStorage.getItem("coursework:v2")) {
      localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1");
      localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [], tasks: [], decks: [], notes: [], files: [], events: [], settings: {}, updated: 1}));
      if (ai) { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); }
    } } catch (e) {}
      if (desk) {
        window.__capCalls = 0;
        window.studiosoDesktop = {platform: "win32", version: "test", store: "direct", getDesktopSettings: async () => ({shot: true, shotKey: "CommandOrControl+Shift+Alt+C", shotKeys: [], shotOn: true, calcShotKey: "CommandOrControl+Shift+Alt+E"}), setDesktopSetting: async () => ({}),
          onScreenshot: () => {}, captureScreen: async () => true, captureEquation: async () => { window.__capCalls++; return true; }, onEquationShot: fn => { window.__eqShot = fn; },
          onCapture: () => {}, onAction: () => {}, onOpenTask: () => {}, onPower: () => {}, getPower: async () => null, onFlush: () => {}, setTitleBar: () => {}, dataDir: async () => "", secrets: {available: async () => false}};
      }
    }, [o.ai !== false, !!o.desk]);
    const page = await ctx.newPage(); page.errs = []; page.ctx = ctx;
    page.on("pageerror", e => page.errs.push(e.message)); page.on("console", m => { if (process.env.DBG && m.type() === "warning") console.log("warn", m.text()); if (m.type() === "error" && !/Failed to load resource/.test(m.text())) page.errs.push(m.text()); });
    await page.goto(base); await page.waitForFunction(() => window.SBCALC && window.SBCALCSNIP); await page.waitForTimeout(500);
    if (!o.closed) { await page.evaluate(() => SBCALC.open()); await page.waitForSelector("#calc:not([hidden])"); await page.waitForFunction(() => !!window.math); }
    return page;
  };
  const expr = page => page.$eval("#calc .cx-expr", el => el.textContent);
  const solve = async page => { await page.click('#calc [data-cx="eq"]'); await page.waitForTimeout(400); return page.$eval("#calc .cx-res", el => el.textContent); };
  const settle = page => page.waitForFunction(() => { const r = document.querySelector("#calc .cx-res"); return r && r.textContent !== "Reading…"; }, null, {timeout: 15000});
  const menuItems = async page => { await page.click('#calc [data-cx="src"]'); await page.waitForSelector("#cxSrc:not([hidden])"); return page.$$eval("#cxSrc .cx-mi", els => els.map(e => e.dataset.cxsrc)); };
  // drag a box over the middle of the picture in the crop step
  const box = async page => {
    const b = await page.locator(".cxp-pic").boundingBox();
    await page.mouse.move(b.x + b.width * 0.2, b.y + b.height * 0.3); await page.mouse.down();
    await page.mouse.move(b.x + b.width * 0.5, b.y + b.height * 0.5, {steps: 3}); await page.mouse.move(b.x + b.width * 0.8, b.y + b.height * 0.7, {steps: 3}); await page.mouse.up();
    await page.waitForFunction(() => !document.querySelector(".cxp"));
  };
  const pngOf = async (page, w, h) => Buffer.from((await page.evaluate(`(${PIC_JS})(${w}, ${h}).toDataURL("image/png")`)).split(",")[1], "base64");
  // the size of the picture the AI was sent last
  const sentSize = (page) => page.evaluate(async body => { const m = /"data":"([^"]+)"/.exec(body); const b = await (await fetch("data:image/jpeg;base64," + m[1])).blob(); const i = await createImageBitmap(b); return {w: i.width, h: i.height}; }, page.ctx.sent[page.ctx.sent.length - 1]);

  // The menu: tidy, labelled, the right sources for a browser on a computer
  { const page = await mk();
    const b = page.locator('#calc [data-cx="src"]');
    ok(await b.getAttribute("aria-label") === "Bring in an equation from a picture or the screen" && await b.getAttribute("aria-expanded") === "false", "the corner button is labelled and says it opens a menu");
    const items = await menuItems(page);
    ok(items.join() === "file,paste,screen", `Picture, Paste Picture and Capture from Screen in a browser on a computer: ${items}`);
    ok(await b.getAttribute("aria-expanded") === "true", "aria-expanded follows the menu");
    const file = page.locator("#cxSrc input[type=file]");
    ok(await file.getAttribute("accept") === "image/*" && await file.getAttribute("capture") === null, "Picture is a real file input for images with no capture attribute (phones offer camera and library)");
    ok(/screen or window to share/.test(await page.textContent('#cxSrc [data-cxsrc="screen"]')), "Capture from Screen says the browser will ask which screen or window to share");
    await page.keyboard.press("Escape"); await page.waitForSelector("#cxSrc[hidden]", {state: "attached"});
    ok(await page.isVisible("#calc"), "Esc closes the menu and leaves the calculator open");
    await menuItems(page); await page.mouse.click(20, 20); await page.waitForSelector("#cxSrc[hidden]", {state: "attached"});
    ok(true, "a click elsewhere closes the menu");
    ok(!page.errs.length, "no errors: " + page.errs.join("; "));
    await page.context().close(); }

  // 1. Picture: a big photo → the box step → the AI → typed in and solved
  { const page = await mk();
    await menuItems(page);
    await page.setInputFiles("#cxSrc input[type=file]", {name: "photo.png", mimeType: "image/png", buffer: await pngOf(page, 3200, 1800)});
    await page.waitForSelector(".cxp .cxp-pic");
    ok(await page.isHidden("#cxSrc"), "choosing a picture closes the menu");
    ok(await page.$eval("#calc", el => getComputedStyle(el).visibility) === "hidden", "the calculator steps aside for the box step");
    ok(await page.isVisible(".cxp-all") && await page.isVisible(".cxp-x"), "the box step offers Use Whole Picture and Cancel");
    await box(page); await settle(page);
    ok(page.ctx.sent.length === 1 && /inline_data/.test(page.ctx.sent[0]) && /image\/jpeg/.test(page.ctx.sent[0]), "the boxed part is sent to the AI as a JPEG");
    const sz = await sentSize(page);
    ok(sz.w > 1000 && sz.w <= 2000 && Math.abs(sz.w / sz.h - (0.6 * 3200) / (0.4 * 1800)) < 0.1, `only the box is sent, at its own shape and no more than 2000px (${sz.w}×${sz.h})`);
    ok(await expr(page) === "3(4+1)" && await solve(page) === "15", "the AI's reading is typed in and solved: 3(4+1) = 15");
    // Use Whole Picture, downscaled
    await menuItems(page);
    await page.setInputFiles("#cxSrc input[type=file]", {name: "big.png", mimeType: "image/png", buffer: await pngOf(page, 4400, 2200)});
    await page.waitForSelector(".cxp .cxp-pic"); await page.click(".cxp-all"); await settle(page);
    const sz2 = await sentSize(page);
    ok(sz2.w === 2000 && sz2.h === 1000, `Use Whole Picture sends the whole picture, shrunk to 2000px (${sz2.w}×${sz2.h})`);
    // Cancel: nothing sent
    const before = page.ctx.sent.length;
    await menuItems(page);
    await page.setInputFiles("#cxSrc input[type=file]", {name: "x.png", mimeType: "image/png", buffer: await pngOf(page, 600, 300)});
    await page.waitForSelector(".cxp"); await page.keyboard.press("Escape"); await page.waitForFunction(() => !document.querySelector(".cxp"));
    ok(page.ctx.sent.length === before && await page.$eval("#calc", el => getComputedStyle(el).visibility) === "visible", "Esc cancels the box step: nothing sent, the calculator is back");
    // not a picture
    await menuItems(page);
    await page.setInputFiles("#cxSrc input[type=file]", {name: "a.txt", mimeType: "text/plain", buffer: Buffer.from("hi")});
    ok(await page.locator(".toast", {hasText: "Choose a picture"}).count() > 0, "a file that isn't a picture says so");
    ok(!page.errs.length, "no errors: " + page.errs.join("; "));
    await page.context().close(); }

  // 1b. Without AI: says how to turn it on, sends nothing
  { const page = await mk({ai: false});
    await menuItems(page);
    await page.setInputFiles("#cxSrc input[type=file]", {name: "p.png", mimeType: "image/png", buffer: await pngOf(page, 800, 400)});
    await page.waitForSelector(".cxp"); await page.click(".cxp-all");
    await page.waitForSelector(".toast:has-text('Turn on AI')");
    ok(page.ctx.sent.length === 0, "without AI a picture says to turn on AI in Settings, and nothing is sent");
    ok(!page.errs.length, "no errors: " + page.errs.join("; "));
    await page.context().close(); }

  // 2. Paste Picture: Ctrl/Cmd+V of an image while the calculator is open, and the button
  { const page = await mk();
    await page.evaluate(async png => {
      const b = await (await fetch("data:image/png;base64," + png)).blob();
      const dt = new DataTransfer(); dt.items.add(new File([b], "shot.png", {type: "image/png"}));
      document.body.dispatchEvent(new ClipboardEvent("paste", {clipboardData: dt, bubbles: true, cancelable: true}));
    }, (await pngOf(page, 900, 400)).toString("base64"));
    await page.waitForSelector(".cxp .cxp-pic");
    ok(true, "pasting a picture while the calculator is open brings up the box step");
    await box(page); await settle(page);
    ok(await expr(page) === "3(4+1)" && await solve(page) === "15", "and the pasted picture is read into the calculator");
    // text pasted into a box elsewhere is left alone
    await page.evaluate(() => { const i = document.createElement("input"); i.id = "tx"; document.body.appendChild(i); i.focus(); const dt = new DataTransfer(); dt.setData("text/plain", "hello"); i.dispatchEvent(new ClipboardEvent("paste", {clipboardData: dt, bubbles: true, cancelable: true})); });
    ok(!(await page.$(".cxp")), "pasting text doesn't open the box step");
    // the button: an empty clipboard, then one with a picture
    await page.evaluate(() => { navigator.clipboard.read = async () => [{types: ["text/plain"], getType: async () => new Blob(["x"])}]; });
    await menuItems(page); await page.click('#cxSrc [data-cxsrc="paste"]');
    await page.waitForSelector(".toast:has-text('Copy a screenshot or picture first')");
    ok(true, "Paste Picture with no picture on the clipboard says to copy a screenshot or picture first");
    await page.evaluate(async png => { const b = await (await fetch("data:image/png;base64," + png)).blob(); navigator.clipboard.read = async () => [{types: ["image/png"], getType: async () => b}]; }, (await pngOf(page, 700, 300)).toString("base64"));
    await menuItems(page); await page.click('#cxSrc [data-cxsrc="paste"]');
    await page.waitForSelector(".cxp .cxp-pic"); await page.click(".cxp-all"); await settle(page);
    ok(await expr(page) === "3(4+1)", "Paste Picture with a picture on the clipboard: the box step, then read");
    ok(!page.errs.length, "no errors: " + page.errs.join("; "));
    await page.context().close(); }

  // 3. Capture from Screen in a browser: one frame from getDisplayMedia, the stream stopped at once, then the box step
  { const page = await mk();
    await page.evaluate(`window.__mkPic = ${PIC_JS}`);
    await page.evaluate(() => {
      window.__tracks = [];
      navigator.mediaDevices.getDisplayMedia = async opts => {
        window.__dmOpts = opts; window.__calcHidden = getComputedStyle(document.getElementById("calc")).visibility === "hidden";
        const c = window.__mkPic(1280, 720); document.body.appendChild(c); c.style.cssText = "position:fixed;left:-9999px";
        const s = c.captureStream(10); window.__tracks.push(...s.getTracks());
        // keep drawing so frames flow
        const tick = () => { const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, 4, 4); if (s.getTracks()[0].readyState === "live") requestAnimationFrame(tick); }; tick();
        return s;
      };
    });
    await menuItems(page); await page.click('#cxSrc [data-cxsrc="screen"]');
    await page.waitForSelector(".cxp.is-screen .cxp-pic");
    ok(await page.evaluate(() => window.__calcHidden), "the calculator is hidden while the screen is shared (not in the picture if it's this tab)");
    ok(await page.evaluate(() => window.__tracks.length > 0 && window.__tracks.every(t => t.readyState === "ended")), "sharing stops as soon as one frame is taken");
    ok(await page.evaluate(() => { const c = document.querySelector(".cxp-pic"); return c.width === 1280 && c.height === 720; }), "the frame is shown full-size for the box");
    await box(page); await settle(page);
    ok(/inline_data/.test(page.ctx.sent[page.ctx.sent.length - 1]) && await expr(page) === "3(4+1)" && await solve(page) === "15", "the boxed part of the screen is read into the calculator and solved");
    // the person cancels the browser's prompt: no message, the calculator is back
    await page.evaluate(() => { navigator.mediaDevices.getDisplayMedia = async () => { throw new DOMException("no", "NotAllowedError"); }; });
    await menuItems(page); await page.click('#cxSrc [data-cxsrc="screen"]'); await page.waitForTimeout(200);
    ok(!(await page.$(".cxp")) && await page.$eval("#calc", el => getComputedStyle(el).visibility) === "visible" && !(await page.locator(".toast", {hasText: "Couldn't capture"}).count()), "cancelling the share prompt quietly brings the calculator back");
    ok(!page.errs.length, "no errors: " + page.errs.join("; "));
    await page.context().close(); }

  // Phone width: the menu fits, Picture is offered, no screen sharing on a phone
  { const page = await mk({viewport: {width: 390, height: 844}, touch: true, ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"});
    const items = await menuItems(page);
    ok(items.join() === "file,paste", `on a phone: Picture and Paste Picture only (${items})`);
    ok(/Take a photo/.test(await page.textContent('#cxSrc [data-cxsrc="file"]')), "on a phone Picture says it can take a photo");
    const r = await page.locator("#cxSrc").boundingBox();
    ok(r.x >= 0 && r.x + r.width <= 390, `the menu fits on a 390px screen (${Math.round(r.x)}–${Math.round(r.x + r.width)})`);
    ok(!page.errs.length, "no errors: " + page.errs.join("; "));
    await page.context().close(); }

  // 4. The desktop app (its side stubbed): the button asks the app, and the boxed part it sends back is read,
  // opening the calculator if it was closed (the shortcut)
  { const page = await mk({desk: true, closed: true});
    await page.evaluate(() => SBCALC.open()); await page.waitForSelector("#calc:not([hidden])"); await page.waitForFunction(() => !!window.math);
    const items = await menuItems(page);
    ok(items.join() === "file,paste,screen", "the desktop app offers Capture from Screen too");
    const t = await page.textContent('#cxSrc [data-cxsrc="screen"]');
    ok(/anywhere on your screen/.test(t) && /Ctrl\+Shift\+Alt\+E/.test(t), `its tip says it works anywhere and shows the shortcut: "${t.trim()}"`);
    await page.click('#cxSrc [data-cxsrc="screen"]'); await page.waitForFunction(() => window.__capCalls === 1);
    ok(!(await page.$(".cxp")), "the desktop button asks the app for its own overlay (no in-page box step)");
    await page.evaluate(() => SBCALC.close());
    const jpg = await page.evaluate(`(async () => { const b = await new Promise(r => (${PIC_JS})(400, 160).toBlob(r, "image/jpeg", 0.9)); return Array.from(new Uint8Array(await b.arrayBuffer())); })()`);
    await page.evaluate(b => window.__eqShot(new Uint8Array(b)), jpg);
    await page.waitForSelector("#calc:not([hidden])"); await settle(page);
    ok(await expr(page) === "3(4+1)" && await solve(page) === "15", "the part of the screen the app sends back opens the calculator and is read in");
    ok(!page.errs.length, "no errors: " + page.errs.join("; "));
    await page.context().close(); }

  // The desktop overlay page (shot.html) in its calculator mode, with its preload stubbed
  { const ctx = await browser.newContext({viewport: {width: 1000, height: 600}});
    await ctx.addInitScript(() => { window.__done = []; window.studyboardShot = {onInit: fn => { window.__init = fn; }, done: r => window.__done.push(r), cancel: () => { window.__cancel = true; }}; });
    const page = await ctx.newPage(); await page.goto(base + "shot.html");
    const plain = await page.textContent("#tip");
    await page.evaluate(() => { const c = document.createElement("canvas"); c.width = 10; c.height = 10; window.__init(c.toDataURL(), "calc"); });
    ok(/equation/.test(await page.textContent("#tip")) && plain !== await page.textContent("#tip"), "in calculator mode the overlay asks for an equation");
    await page.mouse.move(100, 150); await page.mouse.down(); await page.mouse.move(300, 200, {steps: 3}); await page.mouse.move(600, 300, {steps: 3}); await page.mouse.up();
    const d = await page.evaluate(() => window.__done);
    ok(d.length === 1 && Math.abs(d[0].x - 0.1) < 0.01 && Math.abs(d[0].y - 0.25) < 0.01 && Math.abs(d[0].w - 0.5) < 0.01 && Math.abs(d[0].h - 0.25) < 0.01, `and posts the box (as fractions of the screen) for the app to crop: ${JSON.stringify(d[0])}`);
    await page.reload(); await page.evaluate(() => { const c = document.createElement("canvas"); window.__init(c.toDataURL(), ""); });
    ok(await page.textContent("#tip") === plain, "Screenshot to Studyboard keeps its own words");
    await ctx.close(); }

  await browser.close(); server.close();
  console.log(`calc-picture.e2e: ${n} checks passed`);
})().catch(e => { console.error("FAIL:", e && e.stack || e); process.exit(1); });
