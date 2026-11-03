// Browser test for the Word/PowerPoint/Excel renderer (src/js/01-office.js): pages, layout, pictures, escaping
const path = require("path"), fs = require("fs"), http = require("http"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const F = require("./office-fixture");
const ROOT = path.join(__dirname, "..");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SHOTS = process.env.OFFICE_SHOTS || "";

const TYPES = {".html": "text/html", ".mjs": "text/javascript", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png", ".webmanifest": "application/manifest+json"};
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, "") || "index.html";
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": TYPES[path.extname(file)] || "application/octet-stream"});
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: 1400, height: 1000}});
    await ctx.addInitScript(() => { try { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); } catch (e) {} });
    const page = await ctx.newPage();
    const errors = []; page.on("pageerror", e => errors.push(String(e && e.message || e)));
    const dialogs = []; page.on("dialog", d => { dialogs.push(d.message()); d.dismiss().catch(() => {}); });
    await page.goto(base + "index.html");
    await page.waitForFunction(() => window.SBOFFICE && typeof window.SBOFFICE.render === "function", null, {timeout: 30000});
    // Renders a file and mounts its pages, each in a box of exactly w×h, the way the reader does
    const render = (buf, name) => page.evaluate(async ([b64, name]) => {
      const bin = atob(b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const res = await window.SBOFFICE.render(u8, name);
      let host = document.getElementById("ofcTest");
      if (!host) { host = document.createElement("div"); host.id = "ofcTest"; host.style.cssText = "position:absolute;left:0;top:0;z-index:99999;background:#888;padding:10px"; document.body.appendChild(host); }
      host.innerHTML = res.pages.map((p, i) => `<div class="pg" data-i="${i}" style="position:relative;width:${p.w}px;height:${p.h}px;margin:0 0 10px">${p.html}</div>`).join("");
      window.__ofc = res;
      await Promise.all(Array.from(host.querySelectorAll("img")).map(im => im.decode().catch(() => {})));
      return {kind: res.kind, n: res.pages.length, pages: res.pages.map(p => ({w: p.w, h: p.h, label: p.label, notes: p.notes, len: p.html.length})), text: res.text, warnings: res.warnings};
    }, [buf.toString("base64"), name]);
    const shot = async name => { if (SHOTS) { fs.mkdirSync(SHOTS, {recursive: true}); await page.locator("#ofcTest").screenshot({path: path.join(SHOTS, name + ".png")}); } };
    // What a hostile file could get in: elements, handlers, style tricks, links
    const safety = () => page.evaluate(() => {
      const host = document.getElementById("ofcTest"), bad = [];
      host.querySelectorAll("script,iframe,object,embed,style,link,meta,form,svg foreignObject").forEach(e => bad.push(e.tagName));
      host.querySelectorAll("*").forEach(e => { for (const a of e.attributes) { if (/^on/i.test(a.name)) bad.push(e.tagName + "@" + a.name); if (a.name === "style" && /url\(|expression|javascript:|@import/i.test(a.value)) bad.push("style:" + a.value.slice(0, 80)); if ((a.name === "href" || a.name === "src") && !/^(https?:|blob:|data:image\/(png|jpeg|gif|webp|bmp);)/.test(a.value)) bad.push(a.name + "=" + a.value); } });
      return bad;
    });

    // ---- kindOf ----
    const kinds = await page.evaluate(() => ["a.docx", "b.PPTX", "c.xlsx", "d.csv", "e.doc", "f.pdf"].map(n => window.SBOFFICE.kindOf(n)).concat(window.SBOFFICE.kindOf("x", "application/vnd.openxmlformats-officedocument.presentationml.presentation")));
    ok(JSON.stringify(kinds) === JSON.stringify(["docx", "pptx", "xlsx", "csv", "legacy", "", "pptx"]), "kindOf: " + kinds.join(","));

    // ---- Word ----
    const d = await render(F.docx({filler: 60}), "Lab Report.docx");
    ok(d.kind === "docx" && d.n >= 3, `docx paginates into several pages (${d.n})`);
    ok(d.pages.every(p => p.w === 816 && p.h === 1056) && d.pages[0].label === "Page 1" && d.pages[2].label === "Page 3", "Letter pages from sectPr, labelled Page N");
    const dx = await page.evaluate(() => {
      const host = document.getElementById("ofcTest"), pg = Array.from(host.querySelectorAll(".pg"));
      const at = s => pg.findIndex(p => p.textContent.includes(s));
      const title = host.querySelector("h1.ofc-title"), h = Array.from(host.querySelectorAll("h1.ofc-h")).find(e => e.textContent === "Introduction");
      const bold = Array.from(host.querySelectorAll("span")).find(s => s.textContent === "bold words");
      const red = Array.from(host.querySelectorAll("span")).find(s => s.textContent === "red italic");
      const td = host.querySelector("td[colspan='2']"), rs = host.querySelector("td[rowspan='2']");
      const img = host.querySelector("img.ofc-img"), pic = host.querySelector(".ofc-pic");
      const links = Array.from(host.querySelectorAll("a")).map(a => [a.textContent, a.getAttribute("href"), a.target, a.rel]);
      const lis = Array.from(host.querySelectorAll(".ofc-li")).map(e => e.textContent.trim());
      const p1 = pg[0].querySelector(".ofc-p"), cs = getComputedStyle(p1), pageCs = getComputedStyle(pg[0].querySelector(".ofc-page"));
      // nothing runs past the bottom margin (96px) except by rounding
      const over = pg.map(p => { const body = p.querySelector(".ofc-body"); return Math.round(body.getBoundingClientRect().height - (1056 - 192)); });
      return {
        title: title && title.textContent, titleSize: title && getComputedStyle(title.querySelector("span") || title).fontSize,
        h: !!h, hWeight: h && getComputedStyle(h.querySelector("span")).fontWeight, hColor: h && getComputedStyle(h.querySelector("span")).color,
        bold: bold && getComputedStyle(bold).fontWeight, red: red && [getComputedStyle(red).color, getComputedStyle(red).fontStyle, getComputedStyle(red).fontSize],
        td: td && td.textContent, tdBg: td && getComputedStyle(td).backgroundColor, tdBorder: td && getComputedStyle(td).borderTopStyle, rs: rs && rs.textContent,
        img: img && img.getAttribute("src"), imgW: img && img.getBoundingClientRect().width, imgOk: img && img.naturalWidth, alt: img && img.alt, pic: pic && pic.textContent,
        links, lis, color: cs.color, bg: pageCs.backgroundColor, sel: cs.userSelect || cs.webkitUserSelect,
        before: at("Before break"), after: at("After break"), end: at("The end."), over,
        heading2: at("Introduction"),
      };
    });
    ok(dx.title === "Lab Report" && Math.abs(parseFloat(dx.titleSize) - 37.33) < .02, "Title style → h1 at 28pt: " + dx.titleSize);
    ok(dx.h && dx.hWeight === "700" && dx.hColor === "rgb(47, 84, 150)", "Heading 1 from styles.xml: bold, coloured");
    ok(dx.bold === "700", "bold run");
    ok(dx.red && dx.red[0] === "rgb(192, 0, 0)" && dx.red[1] === "italic" && Math.abs(parseFloat(dx.red[2]) - 18.67) < .02, "colour, italic and size of a run: " + dx.red);
    ok(dx.lis.join("|") === "1.|2.|•", "numbered and bulleted lists: " + dx.lis.join("|"));
    ok(dx.td === "Merged header" && dx.tdBg === "rgb(217, 226, 243)" && dx.tdBorder === "solid", "table: gridSpan, shading, Table Grid borders");
    ok(dx.rs === "Tall cell", "table: vMerge → rowspan");
    ok(/^blob:/.test(dx.img || "") && dx.imgOk > 0 && Math.round(dx.imgW) === 100 && dx.alt === "A red square", "inline picture as a blob: URL at its EMU size: " + dx.img);
    ok(dx.pic === "Picture", "an EMF picture becomes a Picture box");
    ok(dx.links.length === 1 && dx.links[0][0] === "Course site" && dx.links[0][1] === "https://example.edu/course?a=1&b=2" && dx.links[0][2] === "_blank" && dx.links[0][3] === "noopener noreferrer", "hyperlinks: safe ones only, new tab, noopener: " + JSON.stringify(dx.links));
    ok(dx.color === "rgb(0, 0, 0)" && dx.bg === "rgb(255, 255, 255)" && dx.sel === "text", "dark text on white, selectable");
    ok(dx.after === dx.before + 1, `a page break moves the rest to the next page (${dx.before} → ${dx.after})`);
    ok(dx.end === d.n - 1, "the last paragraph is on the last page");
    ok(dx.over.every(o => o <= 2), "no page runs past its bottom margin: " + dx.over.join(","));
    ok(d.text.includes("1. First step") && d.text.includes("Merged header\tH3"), "text for AI and search");
    let bad = await safety();
    ok(!bad.length, "docx: nothing unsafe in the DOM: " + bad.join(" "));
    const evil = await page.evaluate(() => { const s = Array.from(document.querySelectorAll("#ofcTest .ofc-p")).find(e => e.textContent.includes("Evil")); return s && [s.textContent, s.outerHTML.match(/style="[^"]*"/g) ? s.outerHTML.match(/style="[^"]*"/g).join(" ") : ""]; });
    ok(evil && evil[0].includes("<script>alert(1)</script>") && evil[0].includes('"onerror=alert(2)') && !/background|url/.test(evil[1] || ""), "hostile text shows as text; bad colour, font and size dropped: " + JSON.stringify(evil));
    await shot("docx");

    // ---- PowerPoint ----
    const p = await render(F.pptx(), "Cells.pptx");
    ok(p.kind === "pptx" && p.n === 2 && p.pages.every(x => x.w === 1280 && x.h === 720), "two 16:9 slides from sldSz");
    ok(p.pages[0].label === "Slide 1" && p.pages[0].notes === "Remember the powerhouse joke", "slide label and speaker notes");
    ok(/^Slide 1:\nCell Biology/.test(p.text) && p.text.includes("Slide 2:"), "slide text in presentation order");
    const px = await page.evaluate(() => {
      const pg = Array.from(document.querySelectorAll("#ofcTest .pg")), s1 = pg[0], s2 = pg[1];
      const box = el => { const r = el.getBoundingClientRect(), o = el.closest(".ofc-page").getBoundingClientRect(); return [Math.round(r.left - o.left), Math.round(r.top - o.top), Math.round(r.width), Math.round(r.height)]; };
      const shapeOf = (root, t) => Array.from(root.querySelectorAll(".ofc-sp")).find(e => e.textContent.includes(t));
      const blue = shapeOf(s1, "Blue box"), title = shapeOf(s1, "Cell Biology"), body = shapeOf(s1, "Mitochondria");
      const bar = Array.from(s1.querySelectorAll(".ofc-sp")).find(e => !e.textContent && getComputedStyle(e.querySelector(".ofc-geo")).backgroundColor === "rgb(237, 125, 49)");
      const tspan = title && title.querySelector("span"), bspan = body && body.querySelector(".ofc-p span:not(.ofc-li)");
      const grp = shapeOf(s2, "Grouped"), img = s2.querySelector("img.ofc-img"), tds = s2.querySelectorAll("td");
      return {
        bg: getComputedStyle(s1.querySelector(".ofc-page")).backgroundColor,
        blue: blue && box(blue), blueBg: blue && getComputedStyle(blue.querySelector(".ofc-geo")).backgroundColor, blueColor: blue && getComputedStyle(blue.querySelector("span")).color,
        title: title && box(title), titleSize: tspan && getComputedStyle(tspan).fontSize, titleAlign: title && getComputedStyle(title.querySelector(".ofc-p")).textAlign, titleBold: tspan && getComputedStyle(tspan).fontWeight,
        body: body && box(body), bodySize: bspan && getComputedStyle(bspan).fontSize, bullet: body && (body.querySelector(".ofc-li") || {}).textContent,
        bar: bar && box(bar), grp: grp && box(grp), grpRadius: grp && getComputedStyle(grp.querySelector(".ofc-geo")).borderRadius,
        img: img && img.getAttribute("src"), imgBox: img && box(img.parentElement), tds: tds.length, th: tds[0] && [getComputedStyle(tds[0]).backgroundColor, getComputedStyle(tds[0].querySelector("span")).color],
      };
    });
    ok(px.bg === "rgb(255, 242, 204)", "slide background colour");
    ok(JSON.stringify(px.blue) === "[96,96,320,96]" && px.blueBg === "rgb(68, 114, 196)" && px.blueColor === "rgb(255, 255, 255)", "a shape at its EMU position with a theme fill: " + px.blue + " " + px.blueBg);
    ok(JSON.stringify(px.title) === "[88,38,1104,139]" && Math.abs(parseFloat(px.titleSize) - 58.67) < .02 && px.titleAlign === "center" && px.titleBold === "700", "title placeholder takes the layout's position and the master's 44pt centred style: " + px.title + " " + px.titleSize);
    ok(px.body && px.body[1] === 192 && Math.abs(parseFloat(px.bodySize) - 37.33) < .02 && px.bullet && px.bullet.trim() === "•", "body placeholder by idx, 28pt with the master's bullet");
    ok(JSON.stringify(px.bar) === "[0,672,1280,48]", "the master's own shapes are drawn: " + px.bar);
    ok(JSON.stringify(px.grp) === "[250,250,50,50]" && px.grpRadius === "50%", "group transform (chOff/chExt) and ellipse: " + px.grp);
    ok(/^blob:/.test(px.img || "") && JSON.stringify(px.imgBox) === "[640,100,200,200]", "picture: " + px.imgBox);
    ok(px.tds === 4 && px.th[0] === "rgb(68, 114, 196)" && px.th[1] === "rgb(255, 255, 255)", "table with a header row");
    bad = await safety();
    ok(!bad.length, "pptx: nothing unsafe in the DOM: " + bad.join(" "));
    await shot("pptx");

    // ---- Excel ----
    const x = await render(F.xlsx(), "Grades.xlsx");
    ok(x.kind === "xlsx" && x.n === 2 && x.pages[0].label === "Sheet: Grades" && x.pages[1].label === "Sheet: Budget", "one page per visible sheet");
    ok(x.pages.every(q => q.w >= 600 && q.h >= 400), "pages at least 600×400");
    ok(x.warnings.some(w => /hidden/i.test(w)), "warns about hidden sheets");
    const xx = await page.evaluate(() => {
      const t = document.querySelector("#ofcTest .pg .ofc-xt"), cells = Array.from(t.querySelectorAll("td")).map(c => c.textContent);
      const m = t.querySelector("td[colspan='3']");
      return {heads: Array.from(t.querySelectorAll("thead th")).map(e => e.textContent).slice(0, 4), rows: Array.from(t.querySelectorAll("tbody th")).map(e => e.textContent), cells,
        merge: m && [m.textContent, getComputedStyle(m).fontWeight, getComputedStyle(m).backgroundColor, getComputedStyle(m).color], colA: t.querySelector("col:nth-child(2)").style.width,
        num: Array.from(t.querySelectorAll("td")).filter(c => c.textContent === "1234.5").map(c => getComputedStyle(c).textAlign)[0]};
    });
    ok(xx.heads.join(",") === ",A,B,C" && xx.rows.join(",") === "1,2,3", "column letters and row numbers");
    ok(xx.merge && xx.merge[0] === "Student grades" && xx.merge[1] === "700" && xx.merge[2] === "rgb(255, 255, 0)" && xx.merge[3] === "rgb(192, 0, 0)", "merged cell with bold, fill and colour from styles.xml");
    ok(["Name", "Score", "Due", "Pct", "Ada <script>", "1234.5", "1/15/2024", "87.5%", "TRUE", "-1,234.57"].every(v => xx.cells.includes(v)), "shared strings, rich text, inline strings, numbers, dates, percent, booleans: " + xx.cells.join("|"));
    ok(xx.colA === "145px" && xx.num === "right", "column width from cols, numbers right-aligned");
    bad = await safety();
    ok(!bad.length, "xlsx: nothing unsafe in the DOM: " + bad.join(" "));
    await shot("xlsx");

    // ---- CSV ----
    const c = await render(F.csv(), "list.csv");
    ok(c.kind === "csv" && c.n === 1 && c.pages[0].label === "Table", "csv: one page");
    const cx = await page.evaluate(() => Array.from(document.querySelectorAll("#ofcTest tbody tr")).map(r => Array.from(r.querySelectorAll("td")).map(td => td.textContent)));
    ok(JSON.stringify(cx) === JSON.stringify([["Name", "Score", "Note"], ["Smith; Ann", "91.5", 'said "hi"'], ["Lee", "78", "<b>bold?</b>"]]), "csv: semicolons, quotes, BOM: " + JSON.stringify(cx));
    ok(!(await safety()).length, "csv: nothing unsafe");

    // ---- errors and clean-up ----
    const errs = await page.evaluate(async () => {
      const r = async (bytes, name) => { try { await window.SBOFFICE.render(bytes, name); return "ok"; } catch (e) { return e.code + ": " + e.message; } };
      return [await r(new Uint8Array([0xD0, 0xCF, 0x11, 0xE0, 0, 0, 0, 0]), "old.ppt"), await r(new TextEncoder().encode("hello"), "x.docx"), await r(new Uint8Array(4), "x.pdf")];
    });
    ok(/^legacy: .*\.pptx or PDF/.test(errs[0]) && /^bad:/.test(errs[1]) && /^unsupported:/.test(errs[2]), "friendly errors: " + errs.join(" / "));
    const blobGone = await page.evaluate(async b64 => {
      const bin = atob(b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const res = await window.SBOFFICE.render(u8, "a.pptx"), url = (res.pages[1].html.match(/src="(blob:[^"]+)"/) || [])[1];
      const before = await fetch(url).then(r => r.ok, () => false);
      window.SBOFFICE.release(res);
      const after = await fetch(url).then(r => r.ok, () => false);
      return [before, after];
    }, F.pptx().toString("base64"));
    ok(blobGone[0] === true && blobGone[1] === false, "release() revokes the picture URLs");
    const tx = await page.evaluate(async b64 => { const bin = atob(b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return window.SBOFFICE.text(u8, "a.xlsx"); }, F.xlsx().toString("base64"));
    ok(tx.startsWith("Sheet: Grades\nStudent grades"), "text() without pages");
    ok(!dialogs.length, "no dialogs (nothing ran)");
    ok(!errors.length, "no page errors: " + errors.join(" | "));
    console.log(`office-render: ${n} checks passed`);
  } finally {
    await browser.close();
    server.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
