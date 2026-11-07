// node tests/pdf-edit-layout-fixes.e2e.js   (PDE_SHOTS=<folder> also saves screenshots)
// The PDF editor's toolbar and panels at every width: the pages don't jump as tools change, the More and Download menus stay
// on screen, phones get one-row bars and big enough targets, page changes keep the header's page numbers right, the watermark
// waits for Done, Contents can be made from Edit, Turn In follows the task picked, and saving keeps Edit on
/* global state */
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const L = require("pdf-lib");
const root = path.join(__dirname, "..");
const SHOTS = process.env.PDE_SHOTS || "";
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

async function makePdf(pages){
  const d = await L.PDFDocument.create(), f = await d.embedFont(L.StandardFonts.Helvetica), fb = await d.embedFont(L.StandardFonts.HelveticaBold);
  for (let i = 1; i <= pages; i++) { const pg = d.addPage([612, 792]);
    pg.drawText(`Bio Notes - Sheet ${i}`, {x: 72, y: 700, size: 22, font: fb});
    for (let k = 0; k < 18; k++) pg.drawText(`Line ${k + 1} of sheet ${i}: the cell membrane controls what goes in and out.`, {x: 72, y: 650 - k * 22, size: 11, font: f});
  }
  return Buffer.from(await d.save());
}

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const pdf4 = await makePdf(4), pdf2 = await makePdf(2);
  const rev = (id, name, size) => ({assetId: id, name, size, type: "application/pdf", at: 1});
  const seed = {v: 2, updated: 1, decks: [], notes: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}],
    tasks: [{id: "t1", title: "Lab report", courseId: "c1", due: "2026-11-09", status: "todo"}, {id: "t2", title: "Osmosis worksheet", courseId: "c1", due: "2026-11-12", status: "todo"}],
    files: [{id: "f1", name: "Bio Notes.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: ["t1"], desc: "", url: "", revs: [rev("a1", "Bio Notes.pdf", pdf4.length)]},
      {id: "f2", name: "Short.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: [], desc: "", url: "", revs: [rev("a2", "Short.pdf", pdf2.length)]}]};
  const errs = [];
  // a fresh window at a size (a phone one is touch)
  async function at(w, h){
    const phone = w < 600;
    const ctx = await browser.newContext({viewport: {width: w, height: h}, hasTouch: phone, isMobile: phone, deviceScaleFactor: 1, serviceWorkers: "block", acceptDownloads: true});
    await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "1"); } } catch (e) {} }, seed);
    const page = await ctx.newPage();
    page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.__sbProStudy);
    await page.evaluate(() => { const T = window.__sbProStudy; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); });
    await page.waitForTimeout(400);
    await page.evaluate(async files => { for (const [k, b] of files) await window.__sbProStudy.idbSet("pdf:" + k, new Blob([new Uint8Array(b)], {type: "application/pdf"})); }, [["a1", [...pdf4]], ["a2", [...pdf2]]]);
    await page.evaluate(() => { window.__ups = []; window.__sbProStudy.caps.assets = {upload: async (file, o) => { const id = "up-" + (window.__ups.length + 1), b = new Uint8Array(await file.arrayBuffer()); window.__ups.push({id, name: file.name, size: b.length}); await window.__sbProStudy.idbSet("pdf:" + id, new Blob([b])); return {id, sizeBytes: b.length, contentType: o.type}; }}; });
    const act = (a, id) => page.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; document.body.appendChild(b); b.click(); b.remove(); }, [a, id]);
    const open = async (fid, edit) => { await act("pdr-open", fid); await page.waitForSelector(".pdr-page .pdr-cv", {timeout: 20000}); await page.waitForTimeout(500); if (edit) { await page.click("#pdeBtn"); await page.waitForFunction(() => !!window.PDFLib); await page.waitForTimeout(500); } };
    const tool = async id => { if (await page.locator(`.pde-tools > .pde-tool[data-id="${id}"]`).count()) await page.click(`.pde-tools > .pde-tool[data-id="${id}"]`); else { await page.click('[data-act="pde-more"]'); await page.click(`.pde-mi[data-id="${id}"]`); } await page.waitForTimeout(250); };
    const shot = async name => { if (SHOTS) { fs.mkdirSync(SHOTS, {recursive: true}); await page.screenshot({path: path.join(SHOTS, name + ".png")}); } };
    const E = () => page.evaluate(() => { const e = window.__sbProStudy.pde(); return e && {on: e.on, tool: e.tool, sel: e.sel, rev: e.rev, panel: !!e.panel}; });
    const edits = () => page.evaluate(() => (state.files.f1.pe || []).filter(e => e.a === window.__sbProStudy.pde().rev));
    return {ctx, page, act, open, tool, shot, E, edits};
  }
  const pageTop = page => page.evaluate(() => Math.round(document.querySelector(".pdr-page").getBoundingClientRect().top));
  const clickLine = async (page, text) => { const p = await page.evaluate(t => { const s = [...document.querySelectorAll(".pdr-page .textLayer span")].find(s => s.textContent.includes(t)); const r = s.getBoundingClientRect(); return {x: r.x + 30, y: r.y + r.height / 2}; }, text); await page.mouse.click(p.x, p.y); await page.waitForTimeout(450); };
  // every item of the open menu can be reached: scrolled into view inside the menu only, inside the window, and on top
  const menuReach = (page, sel) => page.evaluate(sel => {
    const m = document.querySelector(sel); if (!m) return "no menu";
    const mr = m.getBoundingClientRect(); if (mr.left < 0 || mr.right > innerWidth || mr.top < 0) return "menu off screen " + JSON.stringify([mr.left, mr.top, mr.right]);
    return [...m.querySelectorAll(".pde-mi")].map(i => { m.scrollTop = i.offsetTop - 6; const q = i.getBoundingClientRect(), x = q.left + q.width / 2, y = q.top + q.height / 2, e = y < innerHeight && x < innerWidth ? document.elementFromPoint(x, y) : null; return e && i.contains(e) ? "" : i.dataset.id || i.dataset.act; }).filter(Boolean).join(",") || "ok";
  }, sel);
  const dlg = page => page.evaluate(() => window.__sbProStudy.dlg().open);

  try {
    /* Desktop: the pages stay put while tools and picks change */
    {
      const T = await at(1280, 900), {page} = T;
      await T.open("f1", true);
      const y0 = await pageTop(page), ys = {};
      for (const t of ["add", "white", "mark", "find", "text"]) { await T.tool(t); ys[t] = await pageTop(page); }
      await clickLine(page, "Line 3 of sheet 1"); ys.picked = await pageTop(page);
      await page.keyboard.type("ab"); await page.waitForTimeout(200); ys.typed = await pageTop(page);
      ok(Object.values(ys).every(y => y === y0), "the page doesn't move as tools change, text is picked and typed: " + y0 + " " + JSON.stringify(ys));
      await T.shot("1-desktop-picked");
      await page.click('[data-act="pdr-mode"][data-id="read"]'); await page.waitForTimeout(300);
      // Ask and Study: different icons, and names for screen readers
      const ai = await page.evaluate(() => ["pde-ask", "pde-st"].map(a => { const b = document.querySelector(`.pdr-bar [data-act="${a}"]`); return [b.getAttribute("aria-label"), b.querySelector("svg, img").outerHTML]; }));
      ok(ai[0][0] === "Ask This PDF" && ai[1][0] === "Study From This PDF" && ai[0][1] !== ai[1][1], "Ask and Study have their own icons and names");
      // Download menu: Escape closes it, not the reader
      await page.click('[data-act="pde-dlmenu"]'); await page.waitForSelector(".pdr-dlmenu");
      await page.keyboard.press("Escape"); await page.waitForTimeout(200);
      ok(await page.locator(".pdr-dlmenu").count() === 0 && await dlg(page) && await page.getAttribute('[data-act="pde-dlmenu"]', "aria-expanded") === "false", "Escape closes the Download menu and leaves the reader open");
      await T.ctx.close();
    }

    /* Tablet and small laptop widths: More and its menu fit, every tool in it can be clicked */
    for (const [w, h] of [[768, 1024], [820, 900], [1024, 700]]) {
      const T = await at(w, h), {page} = T;
      await T.open("f1", true);
      const row = await page.evaluate(() => { const k = [...document.querySelectorAll(".pde-tools > *")]; return {one: k.every(x => Math.abs(x.offsetTop - k[0].offsetTop) < 4), right: Math.max(...k.map(x => x.getBoundingClientRect().right)), bar: document.querySelector(".pde-bar").getBoundingClientRect().right}; });
      ok(row.one && row.right <= row.bar, `${w}×${h}: the tools are one row inside the bar`);
      await page.click('[data-act="pde-more"]'); await page.waitForSelector(".pde-more-wrap .pde-menu");
      ok(await menuReach(page, ".pde-more-wrap .pde-menu") === "ok", `${w}×${h}: every tool in More can be reached and clicked`);
      await T.shot(`2-more-${w}`);
      const last = await page.evaluate(() => { const l = [...document.querySelectorAll(".pde-menu .pde-mi")].pop(); l.scrollIntoView({block: "nearest"}); return l.dataset.id; });
      await page.click(`.pde-menu .pde-mi[data-id="${last}"]`); await page.waitForTimeout(300);
      ok(await page.locator(".pde-panel").count() === 1 || (await T.E()).tool === last, `${w}×${h}: and its last tool opens`);
      await T.ctx.close();
    }

    /* iPhone, with unsaved edits: the mode switch shares its row with Ask and Study, and Save and Download share the page row */
    for (const PW of [402, 393, 375]) {
      const T = await at(PW, 874), {page} = T;
      await T.open("f1", true);
      for (const [ln, txt] of [["Line 3 of sheet 1", "ab"], ["Line 5 of sheet 1", "cd"], ["Line 7 of sheet 1", "ef"]]) { await clickLine(page, ln); await page.waitForTimeout(250); await page.keyboard.type(txt); await page.waitForTimeout(150); await page.keyboard.press("Escape"); await page.waitForTimeout(250); }
      await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.waitForTimeout(300);
      const L2 = await page.evaluate(() => { const r = s => { const e = document.querySelector(s); if (!e || !e.getClientRects().length) return null; const q = e.getBoundingClientRect(); return {t: Math.round(q.top), b: Math.round(q.bottom), l: Math.round(q.left), r: Math.round(q.right)}; };
        return {modes: r(".pdr-modes"), ask: r('[data-act="pde-ask"]'), study: r('[data-act="pde-st"]'), dl: r('[data-act="pde-dl"]'), save: r(".pdr-save"), badge: r(".pdr-save .pdr-badge")}; });
      const row = (a, b) => !!a && !!b && Math.abs((a.t + a.b) / 2 - (b.t + b.b) / 2) < 6;
      ok(row(L2.modes, L2.ask) && row(L2.modes, L2.study), `${PW}px iPhone with edits: Ask This PDF and Study sit on the Read / Mark Up / Edit row: ` + JSON.stringify({modes: L2.modes, ask: L2.ask, study: L2.study}));
      ok(!L2.badge && row(L2.dl, L2.save) && L2.save.t < L2.modes.b + 60, `${PW}px iPhone: Save is just its icon (no count) and sits with Download on the page row: ` + JSON.stringify({dl: L2.dl, save: L2.save}));
      if (PW === 393) await T.shot("3-iphone-bars");
      await T.ctx.close();
    }

    /* Phone */
    {
      const T = await at(390, 844), {page} = T;
      await T.open("f1", false);
      await page.click('[data-act="pde-dlmenu"]'); await page.waitForSelector(".pdr-dlmenu");
      ok(await menuReach(page, ".pdr-dlmenu") === "ok", "the Download menu is on screen on a phone");
      await T.shot("3-phone-dlmenu");
      await page.keyboard.press("Escape"); await page.waitForTimeout(200);
      await page.click("#pdeBtn"); await page.waitForFunction(() => !!window.PDFLib); await page.waitForTimeout(500);
      const ocr = await page.evaluate(() => { const b = document.querySelector('.pde-tools > .pde-tool[data-id="ocr"]'); if (!b) return "not in the row"; const vis = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).display !== "none";
        return {scan: vis(b.querySelector(".pde-ocr-ic")), face: [...b.querySelectorAll(".cp-ai-face, .ai-ic")].some(vis), purple: b.classList.contains("ai-btn")}; });
      ok(ocr === "not in the row" || (ocr.scan && !ocr.face && ocr.purple), "on a phone Recognize Text shows a scan icon (not the companion), still purple: " + JSON.stringify(ocr));
      // an iPad held upright has room for it in the row, as an icon alone: a scan icon there
      for (const wd of [430, 600, 700, 820]) {
        await page.setViewportSize({width: wd, height: 1100}); await page.waitForTimeout(600); await page.click('.pde-tools > .pde-tool[data-id="white"]'); await page.waitForTimeout(400); await page.click('.pde-tools > .pde-tool[data-id="text"]'); await page.waitForTimeout(400);
        const o2 = await page.evaluate(() => { const b = document.querySelector('.pde-tools > .pde-tool[data-id="ocr"]'); if (!b || !b.getClientRects().length) return "not in the row"; const vis = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).display !== "none";
          return {scan: vis(b.querySelector(".pde-ocr-ic")), face: [...b.querySelectorAll(".cp-ai-face, .ai-ic")].some(vis), purple: b.classList.contains("ai-btn"), label: vis(b.querySelector(".pde-lbl")) && b.querySelector(".pde-lbl").getBoundingClientRect().width > 2}; });
        if (o2 !== "not in the row" && !o2.label) ok(o2.scan && !o2.face && o2.purple, `${wd}px wide: Recognize Text as an icon alone is a purple scan icon, not the companion: ` + JSON.stringify(o2));
      }
      await page.setViewportSize({width: 390, height: 844}); await page.waitForTimeout(600);
      await clickLine(page, "Line 3 of sheet 1"); await page.waitForTimeout(300);
      const hd = await page.evaluate(() => { const one = el => { const k = [...el.children].filter(x => x.offsetWidth && getComputedStyle(x).position !== "absolute"); const b = el.getBoundingClientRect(); return b.height <= 72 && k.every(x => { const r = x.getBoundingClientRect(); return r.top >= b.top - 1 && r.bottom <= b.bottom + 1; }); };
        return {top: Math.round(document.querySelector("#pdrPages").getBoundingClientRect().top), reader: (b => b.scrollWidth <= b.clientWidth + 1 && b.getBoundingClientRect().height <= 125)(document.querySelector(".pdr-bar")), sub: one(document.querySelector(".pde-sub")), doc: document.documentElement.scrollWidth}; });
      ok(hd.top <= 300 && hd.reader && hd.sub && hd.doc <= 390, "editing on a phone, the reader bar is two tidy rows, the tool rows one each, and the page keeps most of the screen: " + JSON.stringify(hd));
      await T.shot("4-phone-picked");
      // typing with the keyboard up (a 364px keyboard leaves 480px): only the text style row stays above the line being typed
      { await clickLine(page, "Line 3 of sheet 1"); await page.waitForTimeout(300);
        const typing = await page.evaluate(() => !!document.querySelector(".pde-e.editing"));
        if (typing) {
          await page.evaluate(() => { const d = document.documentElement; d.style.setProperty("--vv-h", "480px"); d.style.setProperty("--kb-h", "364px"); d.classList.add("kb-open"); });
          await page.waitForTimeout(500);
          const kb = await page.evaluate(() => { const vis = s => { const e = document.querySelector(s); return !!e && e.getBoundingClientRect().height > 0; }, ed = document.querySelector(".pde-e.editing").getBoundingClientRect(), pages = document.querySelector("#pdrPages").getBoundingClientRect(), dl = document.getElementById("dlg").getBoundingClientRect();
            return {head: vis(".pdr-sheet > .sheet-head"), bar: vis(".pdr-bar"), tools: vis(".pde-bar .pde-tools"), sub: vis(".pde-sub"), dlgBottom: Math.round(dl.bottom), pagesH: Math.round(pages.height), edTop: Math.round(ed.top), edBottom: Math.round(ed.bottom)}; });
          ok(!kb.head && !kb.bar && !kb.tools && kb.sub && kb.dlgBottom <= 482, "keyboard up while typing: just the text style row, and the reader ends at the keyboard: " + JSON.stringify(kb));
          ok(kb.pagesH >= 300 && kb.edTop >= 0 && kb.edTop < 480, "the page keeps most of the space and the line being typed is in view above the keyboard: " + JSON.stringify(kb));
          await T.shot("4b-phone-typing-keyboard");
          await page.evaluate(() => document.documentElement.classList.remove("kb-open")); await page.waitForTimeout(300);
          ok(await page.evaluate(() => document.querySelector(".pdr-bar").getBoundingClientRect().height > 0), "the bars come back when the keyboard closes");
        } else ok(false, "clicking the picked line starts typing");
      }
      const y1 = await pageTop(page); await T.tool("mark"); const y2 = await pageTop(page); await T.tool("text");
      ok(y1 === y2, "the page doesn't jump when the tool changes on a phone");
      // a panel tool: the pick and the old tool's options go, the tool shows as pressed, the options row makes room
      await T.tool("mark"); await clickLine(page, "Line 5 of sheet 1");
      await T.tool("pages"); await page.waitForSelector("#pdeGrid .pde-card");
      const st = await page.evaluate(() => { const b = document.querySelector('[data-act="pde-more"]') ; return {e: window.__sbProStudy.pde().tool, sel: window.__sbProStudy.pde().sel, more: b && b.getAttribute("aria-pressed"), sub: document.querySelector(".pde-sub").offsetHeight}; });
      ok(st.e === "text" && !st.sel && st.more === "true" && st.sub === 0, "opening Pages puts Edit Text back, drops the pick, shows the tool pressed and hides the options row: " + JSON.stringify(st));
      // touch targets: at least 40px
      const pg = await page.evaluate(() => { const b = document.querySelector(".pde-cardbar .icon-btn").getBoundingClientRect(); return [b.width, b.height]; });
      ok(pg[0] >= 40 && pg[1] >= 40, "the Pages card buttons are big enough to tap");
      await page.click('.pde-card[data-i="0"] .pde-thumb'); await page.click('[data-act="pde-pgm"][data-id="to"]'); await page.waitForTimeout(250);
      const cover = await page.evaluate(() => { const t = document.getElementById("toast").getBoundingClientRect(), f = document.querySelector(".pde-panel .pde-pf").getBoundingClientRect(); return !document.getElementById("toast").classList.contains("show") || t.bottom > f.top && t.top < f.bottom; });
      ok(!cover, "a toast doesn't cover the panel's Cancel and Apply");
      await page.click('.pde-pf [data-act="pde-panel-close"]'); await page.waitForTimeout(200);
      const big = await page.evaluate(() => { const r = s => document.querySelector(s).getBoundingClientRect(); return {mode: r('[data-act="pdr-mode"]').height, caret: r(".pdr-dl-more").width}; });
      ok(big.mode >= 40 && big.caret >= 40, "the Read / Mark Up / Edit switch and the Download caret are big enough to tap: " + JSON.stringify(big));
      await clickLine(page, "Line 3 of sheet 1");
      const hit = await page.evaluate(() => { const d = [...document.querySelectorAll(".pde-fmt .pde-col")].find(x => x.offsetWidth); d.scrollIntoView({inline: "center", block: "nearest"}); const r = d.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        return [[19, 0], [-19, 0], [0, 19], [0, -19]].every(([dx, dy]) => { const e = document.elementFromPoint(cx + dx, cy + dy); return e && (e === d || d.contains(e)); }); });
      ok(hit, "a colour dot can be tapped 19px from its middle");
      await page.evaluate(() => { const S = window.__sbProStudy.pde(); S.sel = null; }); await T.tool("find");
      const chk = await page.evaluate(() => document.querySelector(".pde-find .pde-chk").getBoundingClientRect().height);
      ok(chk >= 40, "Match case and Whole words are big enough to tap");
      // More: every tool has its own icon
      await page.click('[data-act="pde-more"]'); await page.waitForSelector(".pde-more-wrap .pde-menu");
      const icons = await page.evaluate(() => [...document.querySelectorAll(".pde-tools > .pde-tool, .pde-menu .pde-mi")].map(b => (b.querySelector("svg, img") || {}).outerHTML));
      ok(new Set(icons).size === icons.length, "every edit tool has its own icon (" + icons.length + " tools)");
      ok(await menuReach(page, ".pde-more-wrap .pde-menu") === "ok", "and every tool in More can be reached on a phone");
      // Undo and Redo: not in the full row on a phone, but at the top of More
      ok(await page.evaluate(() => { const ur = document.querySelector(".pde-ur"), row = document.querySelector(".pde-tools"); return (!ur || !ur.offsetParent) && row.scrollWidth <= row.clientWidth + 1; }), "on a phone the row fits, with Undo and Redo moved out of it");
      ok(await page.evaluate(() => { const it = [...document.querySelectorAll(".pde-menu .pde-mi")].filter(x => x.offsetParent).map(x => x.querySelector("b").textContent); return it[0] === "Undo" && it[1] === "Redo"; }), "Undo and Redo head the More menu on a phone");
      await T.shot("5-phone-more");
      await page.keyboard.press("Escape");
      await T.ctx.close();
    }

    /* Pages: header page numbers after moving pages, quick moves, duplicate, asking before throwing changes away, Edit stays on */
    {
      const T = await at(1280, 900), {page} = T;
      await T.open("f1", true);
      await T.tool("header"); await page.waitForSelector("#pdeHdNum");
      await page.selectOption("#pdeHdNum", "bc"); await page.selectOption("#pdeHdFmt", "pnn"); await page.waitForTimeout(200);
      await page.click('.pde-panel [data-act="pde-panel-close"]');
      ok((await T.edits()).some(e => e.k === "h" && e.num === "bc"), "a header with page numbers is waiting");
      await T.tool("pages"); await page.waitForSelector("#pdeGrid .pde-card img[src^='data:']", {timeout: 15000});
      // sheet 3 to the start in one go
      await page.click('.pde-card[data-i="2"] .pde-thumb'); await page.click('[data-act="pde-pgm"][data-id="start"]');
      let order = await page.evaluate(() => window.__sbProStudy.pde().pp.plan.map(x => x.blank ? "b" : x.p).join(""));
      ok(order === "3124", "Move to Start moves the selected page there in one go: " + order);
      await page.click('.pde-card[data-i="3"] .pde-thumb'); await page.fill("#pdePgTo", "2"); await page.click('[data-act="pde-pgm"][data-id="to"]');
      order = await page.evaluate(() => window.__sbProStudy.pde().pp.plan.map(x => x.blank ? "b" : x.p).join(""));
      ok(order === "3412", "Move to page 2 puts it second: " + order);
      await page.click('.pde-card[data-i="1"] .pde-thumb'); await page.click('[data-act="pde-pgm"][data-id="dup"]');
      order = await page.evaluate(() => window.__sbProStudy.pde().pp.plan.map(x => x.blank ? "b" : x.p).join(""));
      ok(order === "34412", "Duplicate copies a page next to itself: " + order);
      await page.click('.pde-card[data-i="1"] .pde-thumb'); await page.click('[data-act="pde-pg"][data-id="x:1"]');
      await page.click('[data-act="pde-pg"][data-id="b:0"]');
      order = await page.evaluate(() => window.__sbProStudy.pde().pp.plan.map(x => x.blank ? "b" : x.p).join(""));
      ok(order === "3b412", "then a blank page after the first: " + order);
      await page.click('.pde-pf [data-act="pde-panel-close"]'); await page.waitForSelector("#askDlg[open]");
      ok(await page.locator(".pde-panel #pdeGrid").count() === 1, "Cancel asks before throwing the planned page changes away");
      await page.click('#askDlg [data-ans="no"], #askDlg button:has-text("Keep Editing")'); await page.waitForTimeout(200);
      ok(await page.locator(".pde-panel #pdeGrid").count() === 1, "Keep Editing keeps them");
      await T.shot("6-pages-planned");
      const rev0 = (await T.E()).rev;
      await page.click('[data-act="pde-pages-apply"]');
      await page.waitForFunction(r => { const e = window.__sbProStudy.pde(); return e && e.rev !== r && e.on && e.pages.size; }, rev0, {timeout: 30000});
      await page.waitForTimeout(500);
      const after = await T.E();
      ok(after.on, "after Apply the new version opens still in Edit");
      const hd = (await T.edits()).filter(e => e.k === "h");
      ok(hd.length === 1 && hd[0].num === "bc", "the header stays a waiting edit of the new version, so it can still be changed");
      const pages = await page.evaluate(async () => {
        const f = state.files.f1, id = f.revs[f.revs.length - 1].assetId, b = await window.__sbProStudy.idbGet("pdf:" + id), bytes = new Uint8Array(await (b instanceof Blob ? b.arrayBuffer() : b));
        const edits = (f.pe || []).filter(e => e.a === id), out = await window.__sbProStudy.pdeEngine.pdeBake(window.PDFLib, bytes, edits.map(e => Object.assign({}, e)), {fonts: {}, images: {}, annots: []});
        const read = async data => { const d = await window.pdfjsLib.getDocument({data, disableFontFace: true, isEvalSupported: false}).promise, t = []; for (let p = 1; p <= d.numPages; p++) t.push((await (await d.getPage(p)).getTextContent()).items.map(i => i.str).join(" ")); return t; };
        return {stored: await read(bytes.slice()), saved: await read(out.bytes)};
      });
      ok(!pages.stored.some(t => /Page \d of/.test(t)), "the rearranged pages don't have the old page numbers baked in");
      ok(pages.saved.length === 5 && pages.saved.every((t, i) => t.includes(`Page ${i + 1} of 5`)) && /Sheet 3/.test(pages.saved[0]) && /Sheet 4/.test(pages.saved[2]), "saved, every page (the blank one too) is numbered in its new place: " + pages.saved.map(t => (t.match(/Page \d of \d/) || ["-"])[0]).join(", "));
      await T.shot("7-after-apply");

      /* Watermark: a preview until Done */
      await T.tool("watermark"); await page.waitForSelector("#pdeWmText");
      ok(await page.locator(".pde-wm").count() >= 1 && !(await T.edits()).some(e => e.k === "m"), "opening Watermark previews it without adding it");
      await page.click('.pde-ph [data-act="pde-panel-close"]'); await page.waitForTimeout(200);
      ok(await page.locator(".pde-wm").count() === 0 && !(await T.edits()).some(e => e.k === "m"), "closing it adds nothing");

      /* Contents from Edit, for a PDF that has none */
      await T.tool("toc"); await page.waitForSelector("#pdeTocEd");
      ok(await page.locator("#pdeTocEd input").count() === 0, "Contents (under More) starts an empty list when the PDF has none");
      await page.click('[data-act="pde-toc-add"]'); await page.fill('[data-toct="0"]', "Results"); await page.click('[data-act="pde-toc-save"]'); await page.waitForTimeout(300);
      await T.tool("toc"); await page.waitForSelector(".pde-toc-item");
      ok(/Results/.test(await page.locator(".pde-panel").textContent()), "and Contents then shows the contents waiting to be saved");
      await page.click('.pde-ph [data-act="pde-panel-close"]');

      /* Turn In: the file name follows the task */
      await page.click('[data-act="pde-dlmenu"]'); await page.click('.pdr-dlmenu [data-act="pde-ti"]'); await page.waitForSelector("#pdeTiTask");
      const n1 = await page.inputValue("#pdeTiName"); await page.selectOption("#pdeTiTask", "t2"); const n2 = await page.inputValue("#pdeTiName");
      ok(/Lab_report/.test(n1) && /Osmosis_worksheet/.test(n2), "Turn In's file name follows the task picked: " + n1 + " → " + n2);
      ok(/Osmosis worksheet/.test(await page.locator("#pdeTiDoneRow").textContent()), "and says which task it marks done");
      await page.click('.pde-pf [data-act="pde-panel-close"]');

      /* Without AI set up, Ask and Recognize Text offer to set it up */
      await page.click('[data-act="pde-ask"]'); await page.waitForSelector(".pde-panel");
      ok(await page.locator('.pde-panel [data-act="ai-setup"]').count() === 1, "Ask without AI has a button to set it up");
      await page.click('.pde-ph [data-act="pde-panel-close"]');
      await T.ctx.close();
    }

    ok(errs.length === 0, "no page errors: " + errs.join(" | "));
    console.log(`\n${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error("FAIL:", e && e.stack || e); server.close(); process.exit(1); });
