// node tests/concept-map-export.e2e.js
// Concept map Export (the ⋯ menu): PDF, PNG, JPG and Word. Each saves a file of the right kind; the picture is the whole map (its aspect
// ratio, its name at the top); a picture you added comes out; an embed whose picture site allows it has its picture, and one whose site
// doesn't (no CORS) is the plain box; the Word file holds the picture and the outline (ideas, connections, notes, cards, links).
// SHOTS=<dir> also saves screenshots and the exported files.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert"), zlib = require("zlib");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json", ".woff2": "font/woff2"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SHOTS = process.env.SHOTS || "";
// a small solid-colour PNG (for the picture you add)
function png(w, h, rgb){
  const crcT = []; for (let i = 0; i < 256; i++) { let c = i; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcT[i] = c >>> 0; }
  const crc = b => { let c = 0xFFFFFFFF; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.set(rgb, y * (w * 3 + 1) + 1 + x * 3);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ih), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
// the stored (uncompressed) zip the app writes: name -> text
function unzip(buf){
  const out = {}; let p = 0;
  while (p + 30 <= buf.length && buf.readUInt32LE(p) === 0x04034b50) { const size = buf.readUInt32LE(p + 18), nl = buf.readUInt16LE(p + 26), xl = buf.readUInt16LE(p + 28), name = buf.slice(p + 30, p + 30 + nl).toString(); out[name] = buf.slice(p + 30 + nl + xl, p + 30 + nl + xl + size); p += 30 + nl + xl + size; }
  return out;
}
const EMB = {
  yt: {p: "youtube", u: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", e: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0", th: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg", tt: "Rick Astley video"},
  vi: {p: "vimeo", u: "https://vimeo.com/76979871", e: "https://player.vimeo.com/video/76979871", th: "https://i.vimeocdn.com/video/452001751-d_295x166", tt: "The Vimeo Player"}
};
const SEED = () => ({v: 2, updated: 1, settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO 101", color: "#2F6FE4", maps: [{id: "m1", name: "Cell Respiration", auto: false, created: 1, at: 1,
  add: [{id: "a", label: "Glycolysis", at: {f: "f1", p: 4}}, {id: "b", label: "Krebs cycle", ev: ["c:d1:k1"]}, {id: "d", label: "ATP"}, {id: "yt", label: "", emb: EMB.yt}, {id: "vi", label: "", emb: EMB.vi}],
  links: [{a: "root", b: "idea:a", label: "starts with"}, {a: "idea:a", b: "idea:b", label: "feeds", arrow: "end"}, {a: "idea:b", b: "idea:d", label: "makes"}, {a: "root", b: "note:n1", label: "see"}, {a: "idea:a", b: "idea:yt", label: ""}, {a: "idea:b", b: "idea:vi", label: ""}],
  pos: {"idea:a": [-260, 0], "idea:b": [0, 170], "idea:d": [260, 170], "note:n1": [260, -120], "idea:yt": [-300, 220], "idea:vi": [10, 400]}}]}],
  tasks: [], notes: [{id: "n1", text: "Mitochondria\nPowerhouse of the cell", courseId: "c1", x: 40, y: 40, z: 1, created: 1}],
  decks: [{id: "d1", name: "Bio Deck", courseId: "c1", cards: [{id: "k1", front: "Where does the Krebs cycle happen?", back: "In the mitochondrial matrix"}]}],
  files: [{id: "f1", name: "Biology.pdf", kind: "file", courseId: "c1", folderId: "", revs: [{name: "Biology.pdf"}]}], events: []});
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: 1280, height: 860}, serviceWorkers: "block", acceptDownloads: true});
  await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} }, SEED());
  const pic = col => `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270"><rect width="480" height="270" fill="${col}"/></svg>`;
  const asked = [];
  // YouTube's picture host here doesn't allow other sites to read it (no CORS header): the map shows it, the export draws the plain box.
  // Vimeo's does: its picture is in the export.
  await ctx.route(/i\.ytimg\.com|i\.vimeocdn\.com/, r => { const url = r.request().url(); asked.push(url + " " + r.request().method());
    if (/ytimg/.test(url)) return r.fulfill({status: 200, contentType: "image/svg+xml", headers: {"access-control-allow-origin": "https://www.youtube.com"}, body: pic("#FF00FF")}); // another site only
    r.fulfill({status: 200, contentType: "image/svg+xml", headers: {"access-control-allow-origin": "*"}, body: pic("#00FF80")}); });
  await ctx.route(/oembed|youtube-nocookie\.com|player\.vimeo\.com/, r => r.fulfill({status: 404, body: "no"}));
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|ERR_FAILED|CORS|Access-Control/i.test(m.text())) errs.push(m.text()); });
  await page.goto(base); await page.waitForFunction(() => window.__sbProStudy && window.SBCMAP); await page.waitForTimeout(500);
  await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "cm-open"; b.dataset.id = "c1"; b.dataset.kind = "course"; b.dataset.map = "m1"; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); });
  await page.waitForSelector('.cm-node[data-n="idea:vi"] image.cm-emb-th'); await page.waitForTimeout(400);
  ok(await page.locator('.cm-node[data-n="idea:yt"] image.cm-emb-th').count() === 1, "on the map, the YouTube box shows its picture (an <img> needs no CORS)");

  // a picture of your own, added beside ATP
  await page.click('.cm-node[data-n="idea:d"]'); await page.waitForTimeout(200);
  await page.click('.cm-tools [data-cm="menu"][data-v="add"]');
  const [fc] = await Promise.all([page.waitForEvent("filechooser"), page.click('.cm-menu [data-cm="pic"]')]);
  await fc.setFiles({name: "blue.png", mimeType: "image/png", buffer: png(120, 80, [0, 0, 255])});
  await page.waitForFunction(() => { const i = document.querySelector('.cm-node image.cm-img'); return i && /^blob:/.test(i.getAttribute("href")); }, null, {timeout: 6000});
  await page.waitForTimeout(300);
  if (!(await page.locator(".cm-sheet").count())) throw new Error("the map closed");

  /* the menu */
  await page.click('.cm-tools [data-cm="menu"][data-v="more"]'); await page.waitForSelector(".cm-menu");
  ok(/Tidy Layout/.test(await page.textContent(".cm-menu")) && await page.locator('.cm-menu [data-cm="xmenu"]').textContent() === "Export…", "the ⋯ menu has Tidy Layout and Export…");
  if (SHOTS) { fs.mkdirSync(SHOTS, {recursive: true}); await page.waitForTimeout(500); await page.screenshot({path: path.join(SHOTS, "menu.png")}); }
  await page.click('.cm-menu [data-cm="xmenu"]'); await page.waitForSelector('.cm-menu [data-cm="export"]');
  const items = await page.$$eval('.cm-menu [data-cm="export"]', b => b.map(x => x.dataset.v + ":" + x.textContent.trim()));
  ok(items.join("|") === "pdf:PDF|png:Picture (PNG)|jpg:Picture (JPG)|docx:Word (.docx)", "Export… offers PDF, PNG, JPG and Word: " + items.join(", "));
  ok(await page.evaluate(() => document.activeElement && document.activeElement.dataset.v === "pdf"), "the first format has the keyboard focus");
  if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({path: path.join(SHOTS, "menu-export.png")}); }
  await page.click('.cm-tools [data-cm="menu"][data-v="more"]'); await page.waitForTimeout(100);
  await page.click('.cm-tools [data-cm="menu"][data-v="more"]'); await page.waitForSelector(".cm-menu");
  ok(await page.locator('.cm-menu [data-cm="xmenu"]').count() === 1 && !(await page.locator('.cm-menu [data-cm="export"]').count()), "the menu opens on its first page again");
  await page.click('.cm-tools [data-cm="menu"][data-v="more"]'); await page.waitForTimeout(100);

  const save = async fmt => {
    await page.click('.cm-tools [data-cm="menu"][data-v="more"]'); await page.click('.cm-menu [data-cm="xmenu"]'); await page.waitForSelector(`.cm-menu [data-cm="export"][data-v="${fmt}"]`);
    const [dl] = await Promise.all([page.waitForEvent("download", {timeout: 30000}), page.click(`.cm-menu [data-cm="export"][data-v="${fmt}"]`)]);
    const p = await dl.path(), buf = fs.readFileSync(p);
    if (SHOTS) fs.writeFileSync(path.join(SHOTS, dl.suggestedFilename()), buf);
    await page.waitForFunction(() => !window.SBCMAP.state().exporting); return {name: dl.suggestedFilename(), buf};
  };
  // what the map's whole drawing measures, to check the picture's shape
  const box = await page.evaluate(() => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; [".cm-nodes", ".cm-edges"].forEach(s => { const b = document.querySelector(".cm-world " + s).getBBox(); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); }); return {w: x1 - x0, h: y1 - y0}; });

  /* PNG */
  const P = await save("png");
  ok(P.name === "Cell Respiration.png" && P.buf.slice(1, 4).toString() === "PNG" && P.buf.length > 20000, `PNG: ${P.name}, ${Math.round(P.buf.length / 1024)} KB`);
  const pw = P.buf.readUInt32BE(16), ph = P.buf.readUInt32BE(20), want = (box.w + 88) / (box.h + 88 + 54);
  ok(Math.abs(pw / ph - want) / want < 0.03 && pw === Math.round((box.w + 88) * 2), `the whole map at twice its size, with its name on top: ${pw}x${ph} (map ${Math.round(box.w)}x${Math.round(box.h)})`);
  // what's in the picture: read back in the page
  const px = await page.evaluate(async b64 => {
    const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const x = c.getContext("2d"); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data;
    let blue = 0, mag = 0, grn = 0, ink = 0; for (let i = 0; i < d.length; i += 4) { const r = d[i], g = d[i + 1], bl = d[i + 2];
      if (r < 25 && g < 25 && bl > 225) blue++; if (r > 235 && g < 25 && bl > 235) mag++; if (r < 25 && g > 235 && bl > 100 && bl < 160) grn++; if (r < 90 && g < 90 && bl < 110) ink++; }
    // the title band: dark letters near the top middle
    let top = 0; for (let y = 40; y < 140; y++) for (let x2 = Math.floor(c.width * 0.35); x2 < c.width * 0.65; x2++) { const i = (y * c.width + x2) * 4; if (d[i] < 90 && d[i + 1] < 90 && d[i + 2] < 110) top++; }
    return {blue, mag, grn, ink, top, corner: [d[0], d[1], d[2], d[3]]};
  }, P.buf.toString("base64"));
  ok(px.blue > 2000, "your picture is in it (" + px.blue + " blue pixels)");
  ok(px.grn > 2000, "the Vimeo box has its picture: its site allows it (" + px.grn + " pixels)");
  ok(px.mag === 0, "the YouTube picture's site doesn't allow it, so the plain box is drawn instead (no error, no blank)");
  ok(px.top > 150 && px.ink > 1000, "the map's name is at the top, and the labels are drawn");
  ok(px.corner[3] === 255, "the map's background, not transparent");
  ok(asked.some(a => /ytimg.* GET/.test(a)) && asked.some(a => /vimeocdn/.test(a)), "both picture sites were asked");

  /* JPG */
  const J = await save("jpg");
  ok(J.name === "Cell Respiration.jpg" && J.buf[0] === 0xFF && J.buf[1] === 0xD8 && J.buf.length > 20000, `JPG: ${J.name}, ${Math.round(J.buf.length / 1024)} KB`);

  /* PDF */
  const D = await save("pdf"), pdf = D.buf.toString("latin1"), mb = /MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(pdf);
  ok(D.name === "Cell Respiration.pdf" && pdf.startsWith("%PDF-") && D.buf.length > 20000 && /\/Image/.test(pdf), `PDF: ${D.name}, ${Math.round(D.buf.length / 1024)} KB, with the map as a picture`);
  ok(mb && Math.abs(Number(mb[1]) / Number(mb[2]) - pw / ph) < 0.02 && Math.abs(Number(mb[1]) - pw / 2 * 0.75) < 2, `one page the map's shape, at its own size: ${mb && mb[1]} x ${mb && mb[2]} pt`);

  /* Word */
  { const uris = [...pdf.matchAll(/\/Subtype\s*\/Link[\s\S]*?\/URI\s*\(([^)]*)\)/g)].map(m => m[1]);
    ok(uris.some(u => /youtube\.com\/watch/.test(u)) && uris.some(u => /vimeo\.com\/76979871/.test(u)) && uris.length === 2, "PDF: each embed box is a link to its page: " + uris.join(", ")); }
  const W = await save("docx"), z = unzip(W.buf), doc = (z["word/document.xml"] || "").toString(), rels = (z["word/_rels/document.xml.rels"] || "").toString();
  ok(W.name === "Cell Respiration.docx" && W.buf.slice(0, 2).toString() === "PK" && z["word/media/map.png"] && z["word/media/map.png"].slice(1, 4).toString() === "PNG", `Word: ${W.name}, ${Math.round(W.buf.length / 1024)} KB, with the map's picture`);
  { const hl = [...doc.matchAll(/<wp:anchor[\s\S]*?<a:hlinkClick r:id="(rIdL\d+)"/g)].map(m => m[1]), tgt = id => ((new RegExp(`Id="${id}"[^>]*Target="([^"]+)"`)).exec(rels) || [])[1] || "";
    ok(hl.length === 2 && hl.some(id => /youtube\.com\/watch/.test(tgt(id))) && hl.some(id => /vimeo\.com/.test(tgt(id))) && z["word/media/link.png"], "Word: a clear link area lies over each embed box on the picture: " + hl.map(tgt).join(", ")); }
  const text = doc.replace(/<[^>]+>/g, "");
  ["Cell Respiration", "Ideas and Connections", "Glycolysis", "→ connects to Krebs cycle: feeds", "← comes from Glycolysis: feeds", "→ connects to ATP: makes", "Powerhouse of the cell",
    "Card: Where does the Krebs cycle happen? → In the mitochondrial matrix", "PDF page: page 4 of Biology.pdf", "Picture: shown on the map above", "Rick Astley video", "The Vimeo Player"].forEach(s => ok(text.includes(s.replace(/&/g, "&amp;")), "the outline has: " + s));
  ok(/<w:hyperlink r:id="rIdL\d"/.test(doc) && /Target="https:\/\/www\.youtube\.com\/watch\?v=dQw4w9WgXcQ" TargetMode="External"/.test(rels), "a video is a link to it");
  ok(text.indexOf("Cell Respiration") < text.indexOf("Glycolysis") && text.indexOf("Glycolysis") < text.indexOf("Krebs cycle  "), "the centre first, then outward along the lines");


  /* a map style: its background, pattern and boxes come out as shown */
  const sub = await page.evaluate(() => { const C = window.CMPACK; return C.SUBJECTS.find(id => !C.P[id].native) || C.SUBJECTS[0]; });
  await page.click('.cm-tools [data-cm="looks"]'); await page.waitForSelector(`.cm-look[data-v="${sub}"]`); await page.click(`.cm-look[data-v="${sub}"]`); await page.waitForTimeout(300);
  await page.click('.cm-panel [data-cm="looks-x"]').catch(() => {}); await page.waitForTimeout(200);
  const base0 = await page.evaluate(() => getComputedStyle(document.querySelector(".cm-canvas")).backgroundColor);
  const S2 = await save("png"); if (SHOTS) fs.writeFileSync(path.join(SHOTS, "Cell Respiration (" + sub + " style).png"), S2.buf);
  const c2 = await page.evaluate(async b64 => { const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode(); const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const x = c.getContext("2d"); x.drawImage(img, 0, 0); const d = x.getImageData(1, 1, 1, 1).data; return `rgb(${d[0]}, ${d[1]}, ${d[2]})`; }, S2.buf.toString("base64"));
  ok(S2.buf.length > 20000 && c2 === base0, `in the ${sub} map style: its background (${c2})`);
  if (SHOTS) { await page.goto("about:blank"); await page.setContent(`<body style="margin:0;background:#888"><img src="data:image/png;base64,${P.buf.toString("base64")}" style="max-width:100%"></body>`); await page.screenshot({path: path.join(SHOTS, "exported-png-view.png"), fullPage: true}); }
  ok(!errs.length, "no errors: " + errs.join(" | "));
  console.log(`\n${n} checks passed`);
  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
