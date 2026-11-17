// node tests/writing-studio-doc.e2e.js
// Writing Studio's My Doc tab: a Google Doc and a Word file linked to a paper, with Google Docs and OneDrive played by stand-ins in the page
// (documents.get / batchUpdate with revisions; a real .docx read, changed and saved back with its eTag). Linking reads the document and
// checks it; Fix All, one Fix and Add to My Draft are made in the document itself; Undo puts it back; a document changed since its check
// isn't fixed; and the open document isn't loaded again while Writing Studio redraws around it.
// SB_NO_CITEPROC=1 blocks citeproc.js and skips the formatting checks (the stand-in formatter is used instead).
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const NO_CP = !!process.env.SB_NO_CITEPROC;
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".xml": "application/xml", ".csl": "application/xml", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const pad = x => String(x).padStart(2, "0"), day = off => { const d = new Date(); d.setDate(d.getDate() + off); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const rev = nm => [{id: "r1", name: nm, size: 1000, at: 1}];
function SEED(){
  return {v: 2, updated: 1, settings: {}, courses: [{id: "c1", name: "Environmental Science", code: "ENV 210", color: "#2E9E5B"}, {id: "c2", name: "Writing and Rhetoric", code: "ENG 102", color: "#E0563B"}],
    tasks: [
      {id: "t1", title: "Research paper: urban heat", courseId: "c2", type: "Assignment", due: day(9), start: day(0), status: "todo", priority: "high", notes: "Use APA format.", created: 5,
        ws: {style: "apa", src: [
          {id: "s1", type: "article-journal", title: "The urban heat island effect and green infrastructure", author: [{family: "Smith", given: "Jordan A."}, {family: "Lee", given: "Kim"}], "container-title": "Urban Climate", volume: "38", issue: "2", page: "100–118", issued: {"date-parts": [[2021, 5]]}, DOI: "10.1016/j.uclim.2021.100118", fid: "f1"},
          {id: "s2", type: "book", title: "Cities and climate change", author: [{family: "Ng", given: "Mo"}], publisher: "Routledge", "publisher-place": "London", issued: {"date-parts": [[2019]]}}],
          q: [{id: "q1", sid: "s1", t: "Parks in Phoenix were on average four degrees cooler than the surrounding blocks.", p: "104", fid: "f1", hl: "h1", sec: "", at: 1}], out: []}},
      {id: "t2", title: "Problem set 4", courseId: "c1", type: "Exam", due: day(3), status: "todo", priority: "med", created: 6},
      {id: "x1", title: "Midterm Exam", courseId: "c1", type: "Exam", due: day(6), status: "todo", priority: "high", created: 7,
        prep: {topics: [{id: "tp1", name: "Carbon cycle", conf: "weak", links: [{k: "deck", id: "d1"}, {k: "note", id: "n1"}]}, {id: "tp2", name: "Urban heat islands", conf: "ok", links: [{k: "note", id: "n3"}]}, {id: "tp3", name: "Ecosystem services", conf: "strong", links: [{k: "deck", id: "d2"}]}]}}],
    notes: [
      {id: "n1", text: "Carbon cycle\nCarbon moves between air, ocean and soil. See [[Greenhouse effect]].", courseId: "c1", x: 40, y: 40, z: 1, created: 1},
      {id: "n2", text: "Greenhouse effect\nCO2 traps heat.", courseId: "c1", x: 300, y: 40, z: 2, created: 2},
      {id: "n3", text: "Urban heat islands\nAsphalt stores heat. [[Lecture 4 slides.pdf#p3]]", courseId: "c1", x: 560, y: 40, z: 3, created: 3},
      {id: "n4", text: "Field trip notes\nWetland visit.", courseId: "c1", x: 40, y: 300, z: 4, created: 4}],
    decks: [{id: "d1", name: "Carbon cycle cards", courseId: "c1", cards: [{id: "k1", front: "Largest carbon sink?", back: "Oceans", srcNote: "n1"}]}, {id: "d2", name: "Ecosystem services deck", courseId: "c1", cards: [{id: "k3", front: "A regulating service", back: "Cooling"}]}],
    files: [
      {id: "f1", name: "Smith 2021 urban heat.pdf", courseId: "c2", kind: "file", revs: rev("Smith 2021 urban heat.pdf"), taskIds: ["t1"], hl: [{id: "h1", p: 104, t: "Parks in Phoenix were on average four degrees cooler than the surrounding blocks.", c: "yellow", r: [[0.1, 0.2, 0.5, 0.02]], a: "r1"}, {id: "h2", p: 109, t: "Tree canopy cover explained more of the variation in surface temperature than any other factor.", c: "green", r: [[0.1, 0.3, 0.5, 0.02]], a: "r1"}]},
      {id: "f2", name: "Lecture 4 slides.pdf", courseId: "c1", kind: "file", revs: rev("Lecture 4 slides.pdf"), taskIds: []}],
    events: []};
}
const DOI_CSL = {DOI: "10.1037/0003-066x.59.1.29", type: "journal-article", title: "How the mind hurts and heals the body", "container-title": "American Psychologist", volume: "59", issue: "1", page: "29-40", author: [{given: "Oakley", family: "Ray"}], issued: {"date-parts": [[2004]]}};
const OL = {"ISBN:9780374275631": {title: "Thinking, Fast and Slow", authors: [{name: "Daniel Kahneman"}], publishers: [{name: "Farrar, Straus and Giroux"}], publish_places: [{name: "New York"}], publish_date: "2011"}};
const Z_ITEMS = [{key: "ZK1", csljson: {id: "x", type: "report", title: "Heat Action Plans", author: [{literal: "City of Phoenix"}], issued: {"date-parts": [[2022]]}, publisher: "City of Phoenix"}}, {key: "ZK2", csljson: {id: "y", type: "book", title: "Cities and climate change", author: [{family: "Ng", given: "Mo"}], issued: {"date-parts": [[2019]]}}}];
const textOf = body => { try { const out = []; const walk = v => { if (typeof v === "string") out.push(v); else if (v && typeof v === "object") Object.values(v).forEach(walk); }; walk(JSON.parse(body)); return out.join("\n"); } catch (e) { return String(body || ""); } };
const cap = s => String(s || "").replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  // a map control may sit in a toolbar menu (Add, Study, More), the idea panel's Attach menu, or its Style section: open whichever holds it, then click
  const cmClick = async (page, sel) => {
    const shown = () => page.locator(sel).first().isVisible().catch(() => false);
    for (const op of ['.cm-panel [data-cm="style"]', '.cm-tools [data-cm="menu"][data-v="add"]', '.cm-tools [data-cm="menu"][data-v="study"]', '.cm-tools [data-cm="menu"][data-v="more"]', '.cm-panel [data-cm="menu"][data-v="attach"]']) {
      if (await shown()) break;
      if (op.includes('"style"') && await page.locator(".cm-panel .cm-style").count()) continue;
      if (await page.locator(op).count()) { await page.click(op); await page.waitForTimeout(60); }
    }
    await page.click(sel);
  };
  const mkCtx = async (o, viewport) => {
    const ctx = await browser.newContext({viewport: viewport || {width: 1280, height: 900}, serviceWorkers: "block", acceptDownloads: true});
    Object.assign(ctx, {bodies: [], zot: []});
    if (NO_CP) await ctx.route(/citeproc\.js/, r => r.abort());
    await ctx.route(/doi\.org\/10\.1037/, r => r.fulfill({status: 200, contentType: "application/vnd.citationstyles.csl+json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(DOI_CSL)}));
    await ctx.route(/openlibrary\.org\/api\/books/, r => r.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(OL)}));
    await ctx.route(/api\.zotero\.org/, r => {
      const u = new URL(r.request().url()); ctx.zot.push(u.pathname + u.search + " key=" + (r.request().headers()["zotero-api-key"] || ""));
      const j = b => r.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*", "total-results": String(Array.isArray(b) ? b.length : 1)}, body: JSON.stringify(b)});
      if (/^\/keys\//.test(u.pathname)) return /GOODKEY/.test(u.pathname) ? j({userID: 4242, username: "jordan", access: {user: {library: true}}}) : r.fulfill({status: 403, body: "Forbidden"});
      if (/\/groups$/.test(u.pathname)) return j([]);
      if (/\/collections$/.test(u.pathname)) return j([{key: "COL1", data: {name: "Urban heat", parentCollection: false}}]);
      if (/\/items/.test(u.pathname)) return j(Z_ITEMS);
      return r.fulfill({status: 404, body: "{}"});
    });
    await ctx.route(/generativelanguage\.googleapis\.com/, route => {
      const t = textOf(route.request().postData() || ""); ctx.bodies.push(t);
      const reply = /see how their course material connects/.test(t) ? {links: [{a: "note:n2", b: "note:n3", label: "warms", why: "Trapped heat adds to city heat."}], concepts: [{name: "Albedo", near: ["note:n3"], label: "explains", why: "Dark surfaces absorb more sun."}]} : {};
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(reply)}]}, finishReason: "STOP"}]})});
    });
    await ctx.route(/\/v1\/ai$/, route => route.fulfill({status: 500, body: "{}"}));
    await ctx.addInitScript(([seed, o]) => {
      try {
        if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); }
        if (o.key) { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); }
        if (o.free) localStorage.setItem("studyboard:paywall-test", "1");
      } catch (e) {}
    }, [SEED(), o]);
    return ctx;
  };
  const open = async ctx => {
    const page = await ctx.newPage(); page.errs = [];
    page.on("pageerror", e => page.errs.push(e.message));
    page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|ERR_FAILED/.test(m.text())) page.errs.push(m.text()); });
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.__sbProStudy && window.SBWRITE && window.SBCMAP);
    await page.waitForTimeout(700); return page;
  };
  const act = (page, a, id, extra) => page.evaluate(([a, id, extra]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; Object.assign(b.dataset, extra || {}); b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || "", extra || {}]);
  const task = (page, id) => page.evaluate(id => window.__sbProStudy.state().tasks[id], id);
  // a course, with its first concept map as .cmap (a course can hold several maps now: c.maps)
  const course = (page, id) => page.evaluate(id => { const c = Object.assign({}, window.__sbProStudy.state().courses[id]); c.cmap = (Array.isArray(c.maps) && c.maps[0]) || c.cmap; return c; }, id);
  const fits = page => page.evaluate(() => { const d = document.querySelector("dialog[open]"), w = document.documentElement; return w.scrollWidth <= w.clientWidth + 1 && (!d || [...d.querySelectorAll(".sheet-body, .sheet-foot, .ws-ref, .ws-q, .ws-acts, .ws-row, .cm-panel")].every(x => x.scrollWidth <= x.clientWidth + 1)); });
  // a node is tapped with the keyboard (Enter), which also brings it into view
  const tap = async (page, id) => { await page.focus(`.cm-node[data-n="${id}"]`); await page.keyboard.press("Enter"); await page.waitForTimeout(380); };
  const refs = page => page.$$eval("#dlg[open] .ws-ref .ws-cite", x => x.map(e => e.textContent.trim()));

  const ctx = await mkCtx({key: true});
  await ctx.route(/docs\.google\.com|onedrive\.live\.com/, r => r.fulfill({status: 200, contentType: "text/html", body: "<!doctype html><title>doc</title><p>document</p>"}));
  const page = await open(ctx);
  const draftOf = async () => ((await task(page, "t1")).ws.draft || {}).t || "";
  const openWS = async () => { await act(page, "edit-task", "t1"); await page.waitForSelector('#dlg[open] [data-act="ws-open"]'); await page.click('#dlg[open] [data-act="ws-open"]'); await page.waitForSelector("#dlg[open] .ws-tabs"); };
  const G0 = "Heat in Cities\n\nCities are warming fast (Smith & Lee 2021). Ng (2019) says cities must plan for heat. Parks are cooler than the blocks around them (Smith & Lee, 2018).  \n\nBibliography\nNg, M. (2019). Cities and climate change. Routledge.";
  // the stand-ins: a Google Doc kept as text (with its revision), and a Word file kept as .docx bytes (with its eTag)
  await page.evaluate(g0 => {
    const F = window.__fake = {g: {raw: g0 + "\n", rev: 1, calls: []}, w: {etag: "e1", puts: 0, locked: false, calls: []}, connected: ["google"]};
    const res = (status, j, buf) => ({ok: status >= 200 && status < 300, status, json: async () => j, arrayBuffer: async () => buf});
    const gdoc = () => { let i = 1; const content = [{sectionBreak: {}, endIndex: 1}]; F.g.raw.split(/(?<=\n)/).forEach(p => { const els = [], cut = p.length > 14 ? 7 : p.length; [[0, cut], [cut, p.length]].filter(([a, b]) => b > a).forEach(([a, b]) => { els.push({startIndex: i, endIndex: i + b - a, textRun: {content: p.slice(a, b)}}); i += b - a; }); content.push({startIndex: els[0].startIndex, endIndex: i, paragraph: {elements: els}}); }); return {title: "Urban heat essay", revisionId: "rev" + F.g.rev, body: {content}}; };
    const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    // a small zip (stored, as the app saves it) to make and read the .docx with
    const enc = new TextEncoder(), dec = new TextDecoder();
    const crcT = Array.from({length: 256}, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
    const crc = d => { let c = 0xFFFFFFFF; for (const b of d) c = crcT[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
    const zipMany = entries => { const parts = [], cd = []; let off = 0; entries.forEach(({name, data}) => { const nm = enc.encode(name), d = typeof data === "string" ? enc.encode(data) : data, lh = new DataView(new ArrayBuffer(30)), ch = new DataView(new ArrayBuffer(46));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint32(14, crc(d), true); lh.setUint32(18, d.length, true); lh.setUint32(22, d.length, true); lh.setUint16(26, nm.length, true);
      ch.setUint32(0, 0x02014b50, true); ch.setUint32(16, crc(d), true); ch.setUint32(20, d.length, true); ch.setUint32(24, d.length, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
      parts.push(new Uint8Array(lh.buffer), nm, d); cd.push(new Uint8Array(ch.buffer), nm); off += 30 + nm.length + d.length; });
      const size = cd.reduce((a, x) => a + x.length, 0), ed = new DataView(new ArrayBuffer(22)); ed.setUint32(0, 0x06054b50, true); ed.setUint16(8, entries.length, true); ed.setUint16(10, entries.length, true); ed.setUint32(12, size, true); ed.setUint32(16, off, true);
      const all = [...parts, ...cd, new Uint8Array(ed.buffer)], out = new Uint8Array(all.reduce((a, x) => a + x.length, 0)); let q = 0; all.forEach(x => { out.set(x, q); q += x.length; }); return out; };
    const unzip = u => { const dv = new DataView(u.buffer, u.byteOffset, u.byteLength), out = {}; let e = u.length - 22; while (dv.getUint32(e, true) !== 0x06054b50) e--; let p = dv.getUint32(e + 16, true); const n = dv.getUint16(e + 10, true);
      for (let k = 0; k < n; k++) { const cs = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true), name = dec.decode(u.subarray(p + 46, p + 46 + nl)); if (dv.getUint16(p + 10, true) !== 0) throw new Error("stored only"); const st = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true); out[name] = u.subarray(st, st + cs); p += 46 + nl + xl + cl; } return out; };
    F.xml = () => dec.decode(unzip(F.w.bytes)["word/document.xml"]);
    const un = s => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
    F.mkDocx = paras => zipMany([{name: "[Content_Types].xml", data: '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>'},
      {name: "word/document.xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paras.map(p => `<w:p>${/^(Bibliography|References)$/.test(p) ? '<w:pPr><w:pStyle w:val="Heading1"/></w:pPr>' : ""}${p ? `<w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">${esc(p.slice(0, 6))}</w:t></w:r><w:r><w:t xml:space="preserve">${esc(p.slice(6))}</w:t></w:r>` : ""}</w:p>`).join("")}<w:sectPr/></w:body></w:document>`},
      {name: "word/media/image1.png", data: new Uint8Array([137, 80, 78, 71, 1, 2, 3])}]);
    F.w.bytes = F.mkDocx(["Heat essay", "Cities are warming fast (Smith & Lee 2021) and parks help.", "", "References", "Ng, M. (2019). Cities and climate change. Routledge."]);
    F.wText = async () => F.xml().split(/<w:p(?=[ >\/])/).slice(1).map(p => [...p.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)].map(m => un(m[1])).join("")).join("\n");
    F.wHas = async name => !!unzip(F.w.bytes)[name];
    const C = window.SBCLOUD;
    C.connected = () => F.connected; C.canPickFiles = () => true;
    C.pickGoogleDoc = async () => ({id: "gdoc123", name: "Urban heat essay", type: "application/vnd.google-apps.document", url: "https://docs.google.com/document/d/gdoc123/edit"});
    C.docApi = async (p, url, init, mode) => { const out = await api(p, url, init, mode); return mode === "raw" && !(out && typeof out === "object" && "ok" in out) ? res(out ? 200 : 404, out) : out; };
    const api = async (p, url, init, mode) => {
      init = init || {}; const m = init.method || "GET";
      if (p === "google") {
        F.g.calls.push(m + " " + url.replace(/\?.*/, ""));
        if (m === "GET") return /gdoc123/.test(url) ? gdoc() : null;
        const b = JSON.parse(init.body);
        if (b.writeControl.requiredRevisionId !== "rev" + F.g.rev) return res(400, {error: {message: "revision"}});
        const arr = [""].concat([...F.g.raw]);
        b.requests.forEach(r => { if (r.deleteContentRange) { const {startIndex: a, endIndex: e} = r.deleteContentRange.range; if (a < 1 || e > arr.length - 1) throw new Error("bad range"); arr.splice(a, e - a); } else { const at = r.insertText.location.index; if (at < 1 || at > arr.length - 1) throw new Error("bad insert"); arr.splice(at, 0, ...r.insertText.text); } });
        F.g.raw = arr.slice(1).join(""); F.g.rev++; return res(200, {});
      }
      F.w.calls.push(m + " " + url.replace(/^https:\/\/graph\.microsoft\.com\/v1\.0/, "").replace(/\?.*/, ""));
      if (/\/recent/.test(url)) return res(400, {error: {code: "invalidRequest", message: "recent is not supported"}});
      if (/\/search\(/.test(url)) return {value: [{id: "W1", name: "Heat essay.docx", webUrl: "https://onedrive.live.com/edit?id=W1", lastModifiedDateTime: new Date().toISOString(), parentReference: {driveId: "D1"}}, {id: "X9", name: "Budget.xlsx", parentReference: {driveId: "D1"}}]};
      if (/\/preview$/.test(url)) return {getUrl: "https://onedrive.live.com/embed?resid=W1&em=2"};
      if (/\/content$/.test(url) && m === "GET") return res(200, null, F.w.bytes.buffer.slice(F.w.bytes.byteOffset, F.w.bytes.byteOffset + F.w.bytes.byteLength));
      if (/\/content$/.test(url) && m === "PUT") { if (F.w.locked) return res(423, {}); if (init.headers["If-Match"] !== F.w.etag) return res(412, {}); F.w.bytes = new Uint8Array(init.body); F.w.etag = "e" + (++F.w.puts + 1); return res(200, {eTag: F.w.etag}); }
      return {id: "W1", name: "Heat essay.docx", eTag: F.w.etag, webUrl: "https://onedrive.live.com/edit?id=W1", size: F.w.bytes.length};
    };
  }, G0);
  const G = () => page.evaluate(() => window.__fake.g.raw.replace(/\n$/, ""));
  await openWS(); await page.click('#dlg[open] [data-ws-tab="doc"]');
  ok(await page.locator("#dlg[open] .ws-ldk").count() === 2 && await page.locator("#dlg[open] [data-ws-ldg]").count() === 1 && await page.locator('#dlg[open] [data-ws-ldcon]:has-text("Connect OneDrive")').count() === 1, "My Doc: a Google Doc (Drive connected: Choose) or a Word file (Connect OneDrive first)");
  const shot = async nm => { if (process.env.SHOT) await page.screenshot({path: process.env.SHOT + nm + ".png"}); };
  await shot("ld-cards");
  // a doc Google gives no access to (the picker set up for another project): it says so
  await page.evaluate(() => { const C = window.SBCLOUD, was = C.pickGoogleDoc; C.pickGoogleDoc = async () => { C.pickGoogleDoc = was; return {id: "nope42", name: "Other", type: "application/vnd.google-apps.document"}; }; });
  await page.click("#dlg[open] [data-ws-ldg]"); await page.waitForSelector("#dlg[open] .ws-err", {timeout: 10000});
  ok(/Google didn't give Studyboard access to that doc/.test(await page.textContent("#dlg[open] .ws-err")) && !(await task(page, "t1")).ws.ld, "a doc Google won't open isn't linked, and it says why");
  // link the Google Doc: read, made the paper's draft, checked
  await page.click("#dlg[open] [data-ws-ldg]");
  await page.waitForSelector("#dlg[open] .ws-ldf", {timeout: 15000}); await page.waitForSelector("#dlg[open] .ws-ldsum", {timeout: 15000});
  const t1 = await task(page, "t1");
  ok(t1.ws.ld && t1.ws.ld.p === "google" && t1.ws.ld.id === "gdoc123" && t1.ws.draft.ld && t1.ws.draft.t === cap(G0), "linking makes the doc the paper's draft (tidied as every draft is)");
  ok(await page.getAttribute("#dlg[open] .ws-ldf", "src") === "https://docs.google.com/document/d/gdoc123/edit", "the doc is open to write in, in Google Docs");
  ok(/Writing Studio can fix [234] problems for you/.test(await page.textContent("#dlg[open] .ws-ldsum")) && await page.locator("#dlg[open] .ws-ldsum [data-ws-fixall]").count() === 1, "and its check is above it, with Fix All");
  await shot("ld-google");
  await page.evaluate(() => { document.querySelector("#dlg[open] .ws-ldf").__mark = 1; });
  await page.click("#dlg[open] .ws-ldsum [data-ws-fixall]");
  await page.waitForFunction(() => /Fixed \d+ things in your Google Doc/.test((document.querySelector("#dlg[open] .ws-ok") || {}).textContent || ""), null, {timeout: 15000});
  const g1 = await G();
  ok(/\(Smith & Lee, 2021\)\. Ng/.test(g1) && /around them \(Smith & Lee, 2021\)\./.test(g1) && /\n\nReferences\nNg, M\. \(2019\)[^\n]*\nSmith, J\. A\., & Lee, K\. \(2021\)/.test(g1) && !/Bibliography/.test(g1), "Fix All: made in the Google Doc itself: " + JSON.stringify(g1.slice(-160)));
  ok(/^Heat in Cities\n\n/.test(g1) && /\(Smith & Lee, 2021\)\. {2}\n/.test(g1), "and the rest of it (its blank line, the spaces it had) is as it was");
  ok(await page.evaluate(() => document.querySelector("#dlg[open] .ws-ldf").__mark === 1), "the open doc wasn't loaded again");
  ok((await draftOf()) === cap(g1) && !(await page.locator("#dlg[open] .ws-ldsum [data-ws-fixall]").count()), "the draft is the doc again, checked: nothing left to fix");
  ok(await page.evaluate(() => window.__fake.g.calls.filter(c => /batchUpdate/.test(c)).length) >= 1, "with batchUpdate");
  await page.click("#toastUndo");
  await page.waitForFunction(g0 => window.__fake.g.raw.includes("(Smith & Lee 2021)"), G0, {timeout: 15000});
  ok(cap(await G()) === cap(G0), "Undo puts the Google Doc back");
  await page.waitForTimeout(500);
  ok(/Writing Studio can fix/.test(await page.textContent("#dlg[open] .ws-ldsum")), "and it's checked again");
  // changed since the check: nothing is fixed
  await page.evaluate(() => { const F = window.__fake; F.g.raw = F.g.raw.replace("Heat in Cities", "Heat in Our Cities"); F.g.rev++; });
  await page.click("#dlg[open] .ws-ldsum [data-ws-fixall]"); await page.waitForSelector("#dlg[open] .ws-err", {timeout: 15000});
  ok(/changed since it was checked, so nothing was fixed/.test(await page.textContent("#dlg[open] .ws-err")) && (await G()).includes("(Smith & Lee 2021)"), "a doc changed since its check isn't fixed: " + await page.textContent("#dlg[open] .ws-err"));
  ok((await draftOf()).startsWith("Heat in Our Cities"), "and it's read and checked again");
  // one Fix from the Check tab goes into the doc too
  await page.click('#dlg[open] [data-ws-tab="check"]');
  await page.click('#dlg[open] .ws-is:has-text("write (Smith & Lee, 2021)") [data-ws-fix]');
  await page.waitForFunction(() => !window.__fake.g.raw.includes("(Smith & Lee 2021)"), null, {timeout: 15000});
  ok((await G()).includes("fast (Smith & Lee, 2021). Ng") && (await G()).includes("Bibliography"), "one Fix: only that citation, in the doc");
  ok(!(await page.locator("#dlg[open] [data-ws-dcopy]").count()), "no Copy Fixed Draft: the doc is already fixed");
  // Unlink, then a Word file
  await page.click('#dlg[open] [data-ws-tab="doc"]'); await page.click("#dlg[open] [data-ws-ldoff]"); await page.waitForTimeout(300);
  ok(!(await task(page, "t1")).ws.ld && !(await task(page, "t1")).ws.draft.ld && await page.locator("#dlg[open] .ws-ldk").count() === 2, "Unlink: the draft stays as Writing Studio's copy");
  await page.evaluate(() => { window.__fake.connected = ["google", "microsoft"]; }); await page.click('#dlg[open] [data-ws-tab="check"]'); await page.click('#dlg[open] [data-ws-tab="doc"]');
  await page.click("#dlg[open] [data-ws-ldw]"); await page.waitForSelector("#dlg[open] [data-ws-ldpick]", {timeout: 10000});
  ok(await page.locator("#dlg[open] [data-ws-ldpick]").count() === 1 && /Heat essay\.docx/.test(await page.textContent("#dlg[open] .ws-flist")) && !(await page.locator("#dlg[open] .ws-err").count()), "Choose a Word File: Word files in OneDrive only, found by search (OneDrive's recent list refuses)");
  ok(await page.evaluate(() => window.__fake.w.calls.some(c => /search\(q='.docx'\)/.test(decodeURIComponent(c)))), "searched for .docx");
  await page.click('#dlg[open] [data-ws-ldpick="W1"]');
  await page.waitForSelector("#dlg[open] .ws-ldsum", {timeout: 15000}); await page.waitForSelector("#dlg[open] .ws-ldf", {timeout: 10000});
  ok((await task(page, "t1")).ws.ld.p === "microsoft" && (await task(page, "t1")).ws.ld.drive === "D1" && /^Heat essay\nCities are warming fast \(Smith & Lee 2021\)/.test(await draftOf()), "a Word file linked: its text is the draft");
  ok(/onedrive\.live\.com\/embed/.test(await page.getAttribute("#dlg[open] .ws-ldf", "src")) && /Word for the web shows it here to read/.test(await page.textContent("#dlg[open] .ws-ldtop")), "Word's preview is shown, and it says how to write in it");
  await shot("ld-word");
  await page.evaluate(() => { window.__fake.w.locked = true; });
  await page.click("#dlg[open] .ws-ldsum [data-ws-fixall]"); await page.waitForSelector("#dlg[open] .ws-err", {timeout: 15000});
  ok(/locked/.test(await page.textContent("#dlg[open] .ws-err")) && /\(Smith & Lee 2021\)/.test(await page.evaluate(() => window.__fake.wText())), "a Word file that's locked isn't changed, and it says why");
  await page.evaluate(() => { window.__fake.w.locked = false; });
  await page.click("#dlg[open] .ws-ldsum [data-ws-fixall]");
  await page.waitForFunction(() => /Fixed \d+ things? in your Word file/.test((document.querySelector("#dlg[open] .ws-ok") || {}).textContent || ""), null, {timeout: 15000});
  const w1 = await page.evaluate(() => window.__fake.wText());
  ok(/\(Smith & Lee, 2021\) and parks/.test(w1) && /References\nNg, M\. \(2019\)[^\n]*\nSmith, J\. A\., & Lee, K\. \(2021\)/.test(w1), "Fix All: saved into the Word file: " + JSON.stringify(w1));
  ok(await page.evaluate(() => window.__fake.wHas("word/media/image1.png")) && await page.evaluate(() => window.__fake.w.etag) === "e2", "the rest of the file (its picture) is kept, saved once with its eTag");
  const xml = await page.evaluate(() => window.__fake.xml());
  ok(/^<\?xml/.test(xml) && /<w:i\/><\/w:rPr><w:t xml:space="preserve">Cities<\/w:t>/.test(xml) && /Heading1/.test(xml), "and its formatting");
  // Add to My Draft: a new source into the Word file's list
  await page.evaluate(() => { const s = window.__sbProStudy.state(); s.tasks.t1.ws.src.push({id: "s3", type: "report", title: "Heat action plans", author: [{literal: "City of Phoenix"}], publisher: "City of Phoenix", issued: {"date-parts": [[2022]]}}); });
  await page.click('#dlg[open] [data-ws-tab="sources"]'); await page.click("#dlg[open] [data-ws-refadd]");
  for (let i = 0; i < 60 && !/Phoenix/.test(await page.evaluate(() => window.__fake.wText())); i++) await page.waitForTimeout(250);
  await page.waitForTimeout(400);
  const w2 = await page.evaluate(() => window.__fake.wText());
  ok(/References\nCity of Phoenix\. \(2022\)[^\n]*\nNg, M\./.test(w2), "Add to My Draft: into the Word file's list, in order: " + JSON.stringify(w2.slice(-200)));
  ok(/to the list in your Word file, Heat essay\.docx/.test(await page.textContent("#dlg[open]")), "and it says so");
  ok(!page.errs.length, "no page errors: " + page.errs.join(" | "));
  await browser.close(); server.close();
  console.log(`writing-studio-doc.e2e: ${n} passed`);
})().catch(e => { console.error(e); process.exit(1); });
