// node tests/capture.e2e.js  (Playwright + Chromium; serves the app over http so the service worker runs; the AI network call is stubbed)
// Checks: typed capture speed, undo, confirm sheet, URL handler, share-target manifest + service-worker POST, paste, photo flow, offline queue, ingest contract. Writes screenshots to $SHOTS.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, ".."), SHOTS = process.env.SHOTS || path.join(require("os").tmpdir(), "cap-shots");
fs.mkdirSync(SHOTS, {recursive: true});
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream", "service-worker-allowed": "/"}); fs.createReadStream(f).pipe(res);
});
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addD = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const nextFri = () => { const d = new Date(), k = (5 - d.getDay() + 7) % 7 || 7; return addD(k); };
const DUE10 = (() => { const d = new Date(); d.setDate(d.getDate() + 10); return iso(d); })();
const SEED = {v: 2, courses: [{id: "c1", name: "Intro Biology", code: "BIO101", color: "#3B6FE0"}, {id: "c2", name: "Organic Chemistry", code: "CHEM201", color: "#1E9E74"}], tasks: [], settings: {capacity: 15}, updated: 1};
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mkCtx = async (opts = {}) => {
    const ctx = await browser.newContext(Object.assign({viewport: {width: 1280, height: 800}, acceptDownloads: false}, opts.ctx || {}));
    await ctx.addInitScript(([seed, ai, native]) => {
      try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
        if (ai) { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } } catch (e) {}
      if (native) window.StudyboardNative = {forwardsDeepLinks: true};
    }, [SEED, opts.ai !== false, !!opts.native]);
    await ctx.route(/generativelanguage\.googleapis\.com/, async route => { ctx.aiCalls = (ctx.aiCalls || []).concat(route.request().postData()); if (ctx.aiDelay) await new Promise(r => setTimeout(r, ctx.aiDelay));
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(ctx.aiReply || {items: [], rawText: ""})}]}, finishReason: "STOP"}]})}); });
    return ctx;
  };
  const open = async (ctx, url = base) => { const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message)); page.errs = errs; await page.goto(url); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.SBCAPTURE); await page.waitForTimeout(400); return page; };
  const tasks = page => page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).tasks);
  try {
    // ---- manifest ----
    const man = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
    ok(man.share_target && man.share_target.method === "POST" && man.share_target.enctype === "multipart/form-data" && man.share_target.params.files[0].accept.includes("image/*"), "manifest share_target parses (POST multipart, images)");
    ok(man.shortcuts.some(s => s.url === "./?capture=1") && man.shortcuts.some(s => s.url === "./?capture=photo"), "manifest has the capture and photo shortcuts");

    // ---- typed capture speed, keyboard, undo ----
    let ctx = await mkCtx(); let page = await open(ctx);
    ok(await page.evaluate(() => typeof SBCAPTURE.ingest === "function" && typeof SBCAPTURE.registerInbox === "function" && typeof SBCAPTURE.handleUrl === "function" && typeof SBCAPTURE.settingsExtra === "function"), "SBCAPTURE exposes ingest, registerInbox, handleUrl, settingsExtra");
    const t0 = Date.now();
    await page.keyboard.press("c");
    await page.waitForSelector("#qcIn:focus", {timeout: 2000}).catch(async e => { console.log(await page.evaluate(() => document.querySelector("#dlg").innerText.slice(0,200)), await page.evaluate(() => [document.querySelector("dialog[open]") && document.querySelector("dialog[open]").id, document.activeElement.tagName, document.activeElement.id, document.querySelector("#capDlg").open])); throw e; });
    const tOpen = Date.now() - t0;
    await page.keyboard.type("bio lab report fri 5pm");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => /Added: Bio lab report/.test(document.querySelector("#toastMsg").textContent) && document.querySelector("#toast").classList.contains("show"), null, {timeout: 3000});
    const tAll = Date.now() - t0;
    console.log(`timing: open+focus ${tOpen} ms, open -> typed -> Enter -> task visible ${tAll} ms`);
    ok(tAll < 3000, "typed capture end to end under 3 s (" + tAll + " ms)");
    let ts = await tasks(page); ok(ts.length === 1 && ts[0].title === "Bio lab report" && ts[0].due === nextFri() && ts[0].time === "17:00" && ts[0].courseId === "c1" && ts[0].type === "Lab", "task has title, due Friday, 5 PM, course and type");
    const toast = await page.textContent("#toastMsg"); ok(/Added: Bio lab report, due .*5 PM/.test(toast), "toast reads: " + toast);
    ok(await page.isVisible("#toastUndo") && await page.isVisible("#toastExtra"), "toast has Undo and Edit");
    await page.click("#toastUndo"); await page.waitForTimeout(150); ok((await tasks(page)).length === 0, "Undo removes the task");

    // ---- Ctrl+Enter keeps open; Esc cancels ----
    await page.keyboard.press("c"); await page.waitForSelector("#qcIn:focus");
    await page.keyboard.type("hw 1 tomorrow"); await page.keyboard.press("Control+Enter");
    await page.waitForFunction(() => /Added: Hw|Added: Homework/i.test(document.querySelector("#capLive").textContent));
    ok(await page.evaluate(() => document.querySelector("#capDlg").open && document.activeElement.id === "qcIn" && document.querySelector("#qcIn").value === ""), "Ctrl+Enter adds and stays open with focus in the field");
    await page.keyboard.type("hw 2 tomorrow"); await page.keyboard.press("Escape"); await page.waitForTimeout(100);
    ok(!(await page.evaluate(() => document.querySelector("#capDlg").open)) && (await tasks(page)).length === 1, "Esc cancels without adding");

    // ---- ambiguous -> confirm sheet, one Enter ----
    await page.keyboard.press("c"); await page.keyboard.type("finish paper next week"); await page.keyboard.press("Shift+Enter"); await page.keyboard.type("bio quiz fri 2pm"); await page.keyboard.press("Enter");
    await page.waitForSelector(".qc-row");
    ok((await page.$$(".qc-row")).length === 2 && (await page.$$(".cap-miss")).length === 1, "ambiguous input opens the confirm sheet, missing due date highlighted");
    await page.setViewportSize({width: 390, height: 780}); await page.screenshot({path: path.join(SHOTS, "confirm-390.png")});
    await page.setViewportSize({width: 1280, height: 800}); await page.screenshot({path: path.join(SHOTS, "confirm-1280.png")});
    await page.keyboard.press("Enter"); await page.waitForTimeout(200);
    ts = await tasks(page); ok(ts.length === 3 && !(await page.evaluate(() => document.querySelector("#capDlg").open)), "one Enter in the sheet adds all");

    // ---- typed sheet screenshots ----
    await page.keyboard.press("c"); await page.keyboard.type("chem201 pset oct 28 2h"); await page.waitForTimeout(80);
    ok(/Will add: .*CHEM201/.test(await page.textContent("#capPv")), "live preview names the course");
    await page.setViewportSize({width: 390, height: 780}); await page.screenshot({path: path.join(SHOTS, "sheet-390.png")});
    await page.setViewportSize({width: 1280, height: 800}); await page.screenshot({path: path.join(SHOTS, "sheet-1280.png")}); await page.keyboard.press("Escape");

    // ---- ingest contract ----
    const r1 = await page.evaluate(async () => [await SBCAPTURE.ingest({id: "n-1", kind: "text", text: "read ch 9 oct 30", source: "siri", createdAt: Date.now()}), await SBCAPTURE.ingest({id: "n-1", kind: "text", text: "read ch 9 oct 30", source: "siri", createdAt: Date.now()}), await SBCAPTURE.ingest({id: "n-2", kind: "text", text: "", source: "siri"})]);
    await page.waitForTimeout(200); await page.keyboard.press("Escape");
    ok(r1[0] === true && r1[1] === true && r1[2] === false, "ingest(item) resolves true when kept, true again for the same id, false for an empty item");
    ts = await tasks(page); ok(ts.filter(t => /Read ch 9/i.test(t.title)).length <= 1, "ingest is idempotent on id (no duplicate)");
    const inbox = await page.evaluate(async () => { let acked = null; SBCAPTURE.registerInbox(async () => ({drafts: [{id: "s1", title: "Inbox lab 5", due: "2030-01-01", course: "BIO101"}, {id: "s2", title: "<b>Read ch 2</b>", dueDate: "", type: "reading"}], ack: async ids => { acked = ids; }}));
      await new Promise(r => setTimeout(r, 1500)); return acked; });
    ok(Array.isArray(inbox) && inbox.length === 2, "registerInbox puller is called and acked");
    ok(await page.evaluate(() => !!document.querySelector(".qc-row") && !document.querySelector(".qc-row input[type=text]").value.includes("<")), "inbox drafts go through the confirm sheet, sanitized");
    await page.keyboard.press("Escape");

    // ---- URL handler ----
    const url = async (u, o) => page.evaluate(([u, o]) => SBCAPTURE.handleUrl(u, o), [u, o]);
    await page.evaluate(() => localStorage.setItem("studyboard:cap:seen", "[]"));
    let before = (await tasks(page)).length;
    let res = await url(base + "?capture=" + encodeURIComponent("chem quiz oct 29 2pm") + "&source=ios-shortcut");
    ok(res.ok && res.confirm === true && res.trusted === false && (await tasks(page)).length === before && await page.isVisible(".cap-ext"), "external web link with a trusted-looking source forces the confirm sheet");
    await page.keyboard.press("Escape");
    res = await url("javascript:alert(1)", {quiet: true}); ok(res.ok === false, "javascript: URL rejected");
    res = await url("studyboard://open?task=1", {quiet: true}); ok(res.ok === false, "other studyboard:// actions are not capture links");
    res = await url(base + "?capture=" + encodeURIComponent('<img src=x onerror=window.__pwn=1> hw 3 fri <script>window.__pwn=1</script>') + "&due=bad&type=hax&link=javascript:window.__pwn=1");
    ok(res.ok && !(await page.evaluate(() => window.__pwn)) && !(await page.evaluate(() => document.querySelector("#capDlg").innerHTML.includes("<img"))), "malicious text is sanitized and never executes");
    await page.keyboard.press("Escape");
    res = await page.evaluate(() => { try { history.replaceState(null, "", "/#capture=hw%204%20fri&source=web"); } catch (e) {} return SBCAPTURE.handleUrl(location.href, {quiet: true}); });
    ok(res.ok && res.action === "text", "hash form is understood"); await page.keyboard.press("Escape");
    let accepted = 0; await page.evaluate(() => localStorage.setItem("studyboard:cap:prefs", JSON.stringify({auto: false})));
    for (let i = 0; i < 14; i++) { const r = await url(base + "?capture=" + encodeURIComponent("rate test " + i + " fri")); if (r.ok) accepted++; }
    ok(accepted <= 10, "rate limit: at most 10 link captures a minute (" + accepted + " accepted of 14 + earlier)");
    await page.keyboard.press("Escape"); await page.evaluate(() => localStorage.removeItem("studyboard:cap:prefs"));
    await page.close(); await ctx.close();

    // ---- native wrapper: trusted source adds right away ----
    ctx = await mkCtx({native: true}); page = await open(ctx);
    res = await page.evaluate(due => SBCAPTURE.handleUrl("studyboard://add?title=" + encodeURIComponent("Bio quiz") + "&due=" + due + "&course=BIO101&source=siri"), DUE10);
    await page.waitForTimeout(200); ts = await tasks(page);
    ok(res.ok && res.trusted === false && res.confirm === true && ts.length === 0 && await page.isVisible(".cap-ext"), "a studyboard:// link never auto-adds, even from a trusted-looking source in the wrapper: it opens the confirm sheet"); await page.keyboard.press("Escape");
    res = await page.evaluate(() => SBCAPTURE.handleUrl("studyboard://add?title=" + encodeURIComponent("Evil") + "&source=made-up"));
    ok(res.ok && res.trusted === false && res.confirm === true, "unknown source is not trusted even in the wrapper"); await page.keyboard.press("Escape");
    ok(await page.evaluate(async () => (await SBCAPTURE.ingest({id: "x9", kind: "text", text: "lab 2 fri 3pm", source: "share-ios"})) === true), "native item (share-ios) accepted"); await page.waitForTimeout(200);
    ok((await tasks(page)).some(t => /lab 2/i.test(t.title)), "confident native text is added without a sheet");
    const imgRes = await page.evaluate(async () => { const c = document.createElement("canvas"); c.width = 50; c.height = 50; const u = c.toDataURL("image/jpeg"); return [await SBCAPTURE.ingest({id: "img-1", kind: "image", text: "", image: u, source: "share-android", createdAt: Date.now()}), await SBCAPTURE.ingest({id: "img-1", kind: "image", image: u, source: "share-android"}), await SBCAPTURE.ingest({id: "bad", kind: "image", image: "data:text/html;base64,AAAA", text: "", source: "siri"})]; });
    ok(imgRes[0] === true && imgRes[1] === true && imgRes[2] === false, "native image item (JPEG data URL) is queued and acknowledged once; a non-JPEG data URL is refused");
    await page.close(); await ctx.close();

    // ---- page-load URL: ?capture=1, ?capture=photo, ?capture=<text> ----
    ctx = await mkCtx(); page = await open(ctx, base + "?capture=1");
    ok(await page.evaluate(() => document.querySelector("#capDlg").open && document.activeElement.id === "qcIn") && !page.url().includes("capture="), "?capture=1 opens the sheet with focus and cleans the address");
    await page.close(); page = await open(ctx, base + "?capture=photo");
    ok(await page.isVisible("#capBig"), "?capture=photo opens the photo sheet with a big Take Photo button"); await page.close();
    page = await open(ctx, base + "?capture=" + encodeURIComponent("bio quiz fri 2pm") + "&source=ios-shortcut");
    ok(await page.isVisible(".qc-row"), "?capture=<text> from the web shows the confirm sheet"); await page.reload(); await page.waitForTimeout(500);
    ok(!(await page.evaluate(() => document.querySelector("#capDlg").open)), "reload does not capture again");
    await page.close(); await ctx.close();

    // ---- photo flow with a test whiteboard image ----
    ctx = await mkCtx(); page = await open(ctx);
    const jpeg = await page.evaluate(async () => { const c = document.createElement("canvas"); c.width = 2400; c.height = 1600; const g = c.getContext("2d"); g.fillStyle = "#f4f4f0"; g.fillRect(0, 0, 2400, 1600); g.fillStyle = "#123"; g.font = "bold 110px sans-serif";
      ["BIO101  Lab report 3", "due Friday 5pm", "Midterm  Nov 12", "Read ch 7"].forEach((t, i) => g.fillText(t, 120, 260 + i * 260)); const b = await new Promise(r => c.toBlob(r, "image/jpeg", 0.92)); return Array.from(new Uint8Array(await b.arrayBuffer())); });
    // splice an EXIF block (orientation 6 = rotated, plus GPS-looking bytes) right after the JPEG start
    const tiff = Buffer.concat([Buffer.from("MM\0*\0\0\0\x08", "binary"), Buffer.from([0, 1, 1, 18, 0, 3, 0, 0, 0, 1, 0, 6, 0, 0, 0, 0, 0, 0]), Buffer.from("GPSLatitude 48.8584 GPSLongitude 2.2945")]);
    const body = Buffer.concat([Buffer.from("Exif\0\0", "binary"), tiff]); const seg = Buffer.concat([Buffer.from([0xFF, 0xE1, (body.length + 2) >> 8, (body.length + 2) & 255]), body]);
    const jb = Buffer.from(jpeg), withExif = Buffer.concat([jb.slice(0, 2), seg, jb.slice(2)]); const imgPath = path.join(SHOTS, "whiteboard-exif.jpg"); fs.writeFileSync(imgPath, withExif);
    const fri = nextFri();
    ctx.aiReply = {rawText: "BIO101 Lab report 3 due Friday 5pm\nMidterm Nov 12\nRead ch 7", items: [
      {title: "Lab report 3", dueDate: fri, dueTime: "17:00", course: "BIO101", type: "Lab", notes: "", confidence: 0.92},
      {title: "Midterm", dueDate: addD(0).slice(0, 4) + "-11-12", dueTime: "", course: "", type: "Exam", notes: "", confidence: 0.85},
      {title: "Read ch 7", dueDate: "2030-03-03", dueTime: "", course: "", type: "Reading", notes: "", confidence: 0.3},
      {title: "Homework", dueDate: null, type: "Assignment", confidence: 0.9}]};
    ctx.aiDelay = 900;
    const fc = page.waitForEvent("filechooser"); await page.click('[data-act="cap-photo"]'); (await fc).setFiles(imgPath);
    const tp = Date.now(); await page.waitForSelector(".cap-skel", {timeout: 3000}); ok(true, "progress skeleton shows straight away");
    ok(await page.isVisible('[data-cap="cancel-ai"]'), "cancel button is there while reading");
    await page.waitForSelector(".qc-row", {timeout: 8000}); console.log("timing: photo -> drafts " + (Date.now() - tp) + " ms (stub adds 900 ms)");
    const rows = await page.$$eval(".qc-row", rs => rs.map(r => ({t: r.querySelector("[data-f=title]").value, due: r.querySelector("[data-f=due]").value, on: r.querySelector("[data-f=checked]").checked, c: r.querySelector("[data-f=courseId]").value})));
    ok(rows.length === 3 && rows[0].c === "c1" && rows[0].due === fri && rows[0].on && rows[1].on && !rows[2].on, "drafts: 3 items (generic dropped), course matched, low confidence unchecked: " + JSON.stringify(rows.map(r => r.t + ":" + r.on)));
    ok(rows[2].due === "" || rows[2].due === "2030-03-03", "date stays only if the photo states it"); 
    ok(await page.isVisible(".cap-thumb"), "original photo thumbnail is shown beside the drafts");
    const sent = JSON.parse(ctx.aiCalls[0]), inl = sent.contents[0].parts.find(p => p.inline_data).inline_data;
    const bytes = Buffer.from(inl.data, "base64"); let w = 0, h = 0; for (let i = 2; i < bytes.length;) { if (bytes[i] !== 0xFF) { i++; continue; } const m = bytes[i + 1]; if (m >= 0xC0 && m <= 0xC3) { h = bytes.readUInt16BE(i + 5); w = bytes.readUInt16BE(i + 7); break; } i += 2 + bytes.readUInt16BE(i + 2); }
    ok(inl.mime_type === "image/jpeg" && Math.max(w, h) === 1600, "photo sent is JPEG and downscaled to 1600 on its longest side (" + w + "x" + h + ")");
    ok(h > w, "EXIF orientation honoured (landscape photo marked rotated is sent upright: " + w + "x" + h + ")");
    ok(!bytes.includes(Buffer.from("Exif")) && !bytes.includes(Buffer.from("GPSLatitude")), "EXIF and GPS are stripped from what is sent");
    ok(/Today is \w+day \d{4}-\d\d-\d\d/.test(sent.contents[0].parts.slice(-1)[0].text) && /Never invent/.test(sent.systemInstruction.parts[0].text), "prompt carries today's date and the never-invent rule");
    await page.setViewportSize({width: 390, height: 780}); await page.waitForTimeout(150); console.log("thumb", JSON.stringify(await page.evaluate(() => { const i = document.querySelector(".cap-thumb"); const r = i.getBoundingClientRect(); const b = document.querySelector(".cap-body"); return [r.x, r.y, r.width, r.height, i.complete, i.naturalWidth, b.scrollTop, b.getBoundingClientRect().y, document.querySelector(".cap-thumbs").getBoundingClientRect().height, getComputedStyle(i).display]; }))); await page.screenshot({path: path.join(SHOTS, "photo-confirm-390.png")});
    await page.setViewportSize({width: 1280, height: 800}); await page.screenshot({path: path.join(SHOTS, "photo-confirm-1280.png")});
    await page.click("#capAddAll"); await page.waitForTimeout(300); ts = await tasks(page);
    ok(ts.length === 2 && ts.some(t => t.title === "Lab report 3" && t.link === ""), "Add all adds only the checked items");
    // cancel works
    ctx.aiDelay = 4000; const fc2 = page.waitForEvent("filechooser"); await page.click('[data-act="cap-photo"]'); (await fc2).setFiles(imgPath); await page.waitForFunction(() => /Reading your photo/.test(document.querySelector("#capStatus") ? document.querySelector("#capStatus").textContent : "")); await page.click('[data-cap="cancel-ai"]');
    ok(await page.isVisible("#qcIn") && /Cancelled/.test(await page.textContent(".cap-body")), "cancel stops the AI and offers typing it in with the photo visible"); await page.keyboard.press("Escape");
    // paste an image
    ctx.aiDelay = 0; await page.evaluate(() => { document.activeElement && document.activeElement.blur(); });
    await page.evaluate(async () => { const c = document.createElement("canvas"); c.width = 300; c.height = 200; c.getContext("2d").fillRect(0, 0, 300, 200); const b = await new Promise(r => c.toBlob(r, "image/png")); const dt = new DataTransfer(); dt.items.add(new File([b], "shot.png", {type: "image/png"}));
      document.body.dispatchEvent(new ClipboardEvent("paste", {clipboardData: dt, bubbles: true, cancelable: true})); });
    await page.waitForSelector(".qc-row, #qcIn", {timeout: 5000}); ok(await page.evaluate(() => document.querySelector("#capDlg").open), "pasting an image on the Board starts photo capture");
    await page.keyboard.press("Escape");
    // multi-line text paste
    await page.evaluate(() => { const dt = new DataTransfer(); dt.setData("text/plain", "hw 5 oct 30\nlab 6 nov 2"); document.body.dispatchEvent(new ClipboardEvent("paste", {clipboardData: dt, bubbles: true, cancelable: true})); });
    await page.waitForTimeout(300); ts = await tasks(page); ok(ts.some(t => /hw 5|homework 5/i.test(t.title)) && ts.some(t => /lab 6/i.test(t.title)), "pasting several lines adds several tasks");
    // drop an image file
    await page.evaluate(async () => { const c = document.createElement("canvas"); c.width = 100; c.height = 100; const b = await new Promise(r => c.toBlob(r, "image/png")); const dt = new DataTransfer(); dt.items.add(new File([b], "d.png", {type: "image/png"})); window.dispatchEvent(new DragEvent("drop", {dataTransfer: dt, bubbles: true, cancelable: true})); });
    await page.waitForTimeout(500); ok(await page.evaluate(() => document.querySelector("#capDlg").open), "dropping an image on the window starts photo capture"); await page.keyboard.press("Escape");
    // AI errors are honest
    ctx.aiReply = "not json at all"; const fc3 = page.waitForEvent("filechooser"); await page.click('[data-act="cap-photo"]'); (await fc3).setFiles(imgPath);
    await page.waitForSelector('[role=alert], #qcIn', {timeout: 8000}); ok(/couldn.t be read|garbled|Try again/i.test(await page.textContent(".cap-body")), "a garbled AI answer says so and offers retry / type it in"); await page.keyboard.press("Escape");
    await page.close(); await ctx.close();

    // ---- no AI key: honest fallback keeps the photo visible ----
    ctx = await mkCtx({ai: false}); page = await open(ctx);
    const fc4 = page.waitForEvent("filechooser"); await page.click('[data-act="cap-photo"]'); (await fc4).setFiles(imgPath);
    await page.waitForSelector(".cap-thumb"); ok(/No AI is set up/.test(await page.textContent(".cap-body")) && await page.isVisible("#qcIn") && await page.isVisible('[data-cap="savenote"]'), "no AI: photo stays visible, 'type it in' box and Save Photo as a Note offered");
    await page.fill("#qcIn", "lab report fri 5pm"); await page.keyboard.press("Enter"); await page.waitForTimeout(300); ok((await tasks(page)).length === 1 || await page.isVisible(".qc-row"), "typed text from the no-AI sheet is added");
    await page.close(); await ctx.close();

    // ---- offline queue ----
    ctx = await mkCtx(); page = await open(ctx); await ctx.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    const offOk = await page.evaluate(() => navigator.onLine === false);
    const fc5 = page.waitForEvent("filechooser"); await page.click('[data-act="cap-photo"]'); (await fc5).setFiles(imgPath);
    await page.waitForSelector(".cap-thumb"); const msg = await page.textContent(".cap-body");
    ok(offOk && /offline.*saved \(1 waiting\)/i.test(msg), "offline photo is queued honestly: " + msg.slice(0, 80)); ok(await page.evaluate(() => SBCAPTURE.queueCount()) === 1, "queue holds 1 photo (IndexedDB)");
    await page.keyboard.press("Escape"); await ctx.setOffline(false);
    await page.close(); await ctx.close();

    // ---- settings page ----
    ctx = await mkCtx(); page = await open(ctx); await page.evaluate(() => SBCAPTURE.settingsExtra(() => '<p id="extraProbe">extra from another module</p>'));
    await page.locator('[data-act="menu"]:visible').first().click(); await page.waitForSelector(".us-cat");
    await page.click('.us-cat[data-us="capture"]'); await page.waitForSelector('[data-cap-pref="auto"]');
    ok(await page.isChecked('[data-cap-pref="auto"]') && !(await page.isChecked('[data-cap-pref="keep"]')) && await page.isChecked('[data-cap-pref="ai"]'), "settings: auto-add ON, keep photos OFF, use AI ON by default");
    ok((await page.$$('[data-act="cap-try"]')).length === 4 && !(await page.$('[data-cap-slot="voice"]')) && !(await page.$('[data-cap-shot]')) && await page.isVisible("#extraProbe"), "settings (web): 4 Try it buttons, no empty voice placeholder, no desktop-only screenshot row, settingsExtra content");
    await page.screenshot({path: path.join(SHOTS, "settings-1280.png")});
    await page.click('[data-cap-pref="auto"]'); ok((await page.evaluate(() => SBCAPTURE.prefs())).auto === false, "toggle saves");
    await page.click('[data-act="cap-try"][data-try="sheet"]'); await page.waitForSelector("#qcIn"); ok(/Will add/.test(await page.textContent("#capPv")), "Try it opens the capture sheet"); await page.keyboard.press("Escape");
    await page.setViewportSize({width: 390, height: 780}); await page.keyboard.press("c"); await page.keyboard.type("x"); await page.keyboard.press("Escape");
    await page.close(); await ctx.close();

    // ---- service worker share target ----
    ctx = await mkCtx(); page = await open(ctx);
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => 1)); await page.reload(); await page.waitForFunction(() => navigator.serviceWorker.controller, null, {timeout: 8000});
    ctx.aiReply = {rawText: "Lab report 3 due Friday", items: [{title: "Lab report 3", dueDate: nextFri(), type: "Lab", confidence: 0.9}]};
    const nav = page.waitForNavigation({url: /share=1/}); 
    await page.evaluate(async b64 => { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      const f = document.createElement("form"); f.method = "POST"; f.action = "share-target"; f.enctype = "multipart/form-data";
      const mk = (n, v) => { const i = document.createElement("input"); i.type = "hidden"; i.name = n; i.value = v; f.appendChild(i); }; mk("title", "Whiteboard"); mk("text", "from the share sheet");
      const fi = document.createElement("input"); fi.type = "file"; fi.name = "files"; const dt = new DataTransfer(); dt.items.add(new File([u], "wb.jpg", {type: "image/jpeg"})); fi.files = dt.files; f.appendChild(fi); document.body.appendChild(f); f.submit(); }, withExif.toString("base64"));
    await nav; await page.waitForFunction(() => window.SBCAPTURE); await page.waitForSelector(".qc-row", {timeout: 10000});
    ok(await page.isVisible(".cap-thumb") && (await page.$$(".qc-row")).length === 1, "service worker received the POST share of an image and the confirm sheet shows its drafts");
    ok(await page.evaluate(async () => { const c = await caches.open("sb-capture-stage"); return (await c.keys()).length; }) === 0, "staged share files are deleted once read");
    ok(!page.url().includes("share="), "share parameters are removed from the address");
    // bad shares
    const bad = await page.evaluate(async () => { const out = []; const post = async fd => { const r = await fetch("share-target", {method: "POST", body: fd, redirect: "manual"}); return r.type + ":" + r.status; };
      const fd = new FormData(); fd.append("files", new File([new Uint8Array(16 * 1048576)], "big.jpg", {type: "image/jpeg"})); out.push(await post(fd));
      const fd2 = new FormData(); for (let i = 0; i < 11; i++) fd2.append("files", new File([new Uint8Array(10)], i + ".png", {type: "image/png"})); out.push(await post(fd2));
      return out; });
    ok(bad.every(s => /opaqueredirect/.test(s)), "oversize and too-many shares are redirected away (" + bad.join(", ") + ")");
    await page.close(); await ctx.close();
    console.log("\n" + n + " e2e checks passed. Screenshots in " + SHOTS);
  } catch (e) { console.error("E2E FAILED:", e.message); process.exitCode = 1; }
  await browser.close(); server.close();
})();
