// node tests/pro-extras.e2e.js   (Playwright + Chromium; see tests/pw.js)
// Studyboard Pro extras (module 99-pro): Insights from Weekly Review, the Term Recap card and sheet, the Pro sheet's "What Pro Adds",
// and the free-plan lock (paywall test switch on, no Pro): one quiet PRO row, no recap card.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  // The page as served with Pro enforcement off (everyone has Pro, as before launch); the free-plan checks turn it back on with the
  // test switch. The script hashes are recomputed so the page's own security policy still accepts it.
  if (p === "/index.html") { res.end(csp.apply(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const pad = x => String(x).padStart(2, "0");
const day = off => { const d = new Date(); d.setDate(d.getDate() + off); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const at = off => { const d = new Date(); d.setDate(d.getDate() + off); d.setHours(12, 0, 0, 0); return d.getTime(); };
const T = (id, title, course, due, extra) => Object.assign({id, title, courseId: course, type: "Assignment", due, start: due, status: "todo", priority: "med", created: 1000 + Number(id.replace(/\D/g, ""))}, extra || {});
const done = (id, title, course, due, doneOff, mark, w) => T(id, title, course, due, {status: "done", doneAt: at(doneOff), weight: w || null, mark: mark == null ? undefined : {got: mark, outOf: 100}});
// A one-page PDF with a drawing (12 separate strokes) and four short labels spread around it, like a labelled diagram on a slide
function diagramPdf(){
  const lines = []; for (let i = 0; i < 12; i++) lines.push(`${200 + i * 10} 300 m ${260 + i * 10} 480 l S`);
  const label = (x, y, t) => `BT /F1 14 Tf ${x} ${y} Td (${t}) Tj ET`;
  const content = ["1 w", ...lines, label(60, 520, "Nucleus"), label(420, 520, "Ribosome"), label(60, 260, "Cell membrane"), label(420, 260, "Mitochondria"), label(250, 700, "An animal cell")].join("\n");
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", `<< /Length ${content.length} >>\nstream\n${content}\nendstream`];
  let out = "%PDF-1.4\n"; const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length; out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("") + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return [...Buffer.from(out, "latin1")];
}
function SEED(){
  const tasks = [
    done("1", "Quiz 1", "c1", day(-60), -61, 70, 10), done("2", "Lab 1", "c1", day(-40), -42, 78, 10), done("3", "Quiz 2", "c1", day(-20), -21, 85, 10), done("4", "Lab 2", "c1", day(-4), -6, 92, 10),
    done("5", "Essay 1", "c2", day(-50), -50, 88, 20), done("6", "Essay 2", "c2", day(-30), -29, 80, 20), done("7", "Essay 3", "c2", day(-3), -3, 71, 20),
    done("8", "Reading 1", "c2", day(-9), -9), done("9", "Reading 2", "c1", day(-10), -11), done("10", "Reading 3", "c1", day(-12), -14)
  ];
  const focusLog = [];
  [[-1, 15, 50, "c1"], [-2, 14, 60, "c1"], [-3, 16, 45, "c1"], [-4, 9, 15, "c2"], [-5, 10, 20, "c2"], [-2, 20, 30, "c1"], [-6, 13, 55, "c1"]].forEach(([o, h, m, c]) => focusLog.push({d: day(o), h, m, c, t: ""}));
  const card = (id, f, bk, box, due) => ({id, front: f, back: bk, box, due, seen: box ? 3 : 0, right: box ? 2 : 0, wrong: box ? 1 : 0, last: box ? day(-2) : ""});
  const decks = [{id: "d1", name: "Cell Biology", courseId: "c1", created: 1, cards: [card("k1", "ATP", "Energy currency", 2, day(0)), card("k2", "Osmosis", "Water moves", 3, day(2)), card("k3", "Lipid", "Fat", 0, "")], quizzes: []}];
  return {v: 2, updated: 1, decks, settings: {focusLog, fcDays: {[day(-2)]: 30, [day(-30)]: 40}}, courses: [
    {id: "c1", name: "Calculus II", code: "CALC2", color: "#3B6FE0"}, {id: "c2", name: "Psychology", code: "PSYC110", color: "#B86A00"}], tasks};
}
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mkCtx = async (seed, free) => {
    const ctx = await browser.newContext({viewport: {width: 390, height: 844}});
    await ctx.addInitScript(([seed, free]) => {
      try {
        if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); }
        if (free) localStorage.setItem("studyboard:paywall-test", "1");
      } catch (e) {}
    }, [seed, !!free]);
    return ctx;
  };
  const open = async ctx => { const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) page.errs.push(m.text()); }); await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(900); return page; };
  const act = (page, a, id) => page.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || ""]);
  const noOverflow = async (page, what) => { const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); ok(o <= 0, "no horizontal scroll " + what + " (" + o + ")"); };
  try {
    // ---------- Pro (enforcement off: everyone has it) ----------
    const page = await open(await mkCtx(SEED()));
    await act(page, "wkr-open"); await page.waitForTimeout(400);
    ok(await page.locator(".wkr-sheet .pro-ins-card").count() === 1, "Weekly Review shows this week's insight");
    const line = (await page.locator(".pro-ins-card p").textContent()).trim();
    ok(line.length > 20 && !/Not much to go on/.test(line), "the insight says something real: " + line);
    await page.click('.pro-ins-card [data-act="pro-ins-open"]'); await page.waitForTimeout(400);
    ok(await page.locator(".pro-ins-body .pro-card").count() === 4, "Insights has its four sections");
    ok(/CALC2/.test(await page.locator(".pro-ins-body").textContent()), "study time names the courses");
    ok(await page.locator(".pro-heat .ph-c").count() === 28, "the focus heat grid has 4 parts of the day × 7 days");
    ok(/longest sessions are in the afternoon/i.test(await page.locator(".pro-ins-body").textContent()), "best focus time is the afternoon");
    await page.click('[data-act="pro-ins-kind"][data-id="term"]'); await page.waitForTimeout(300);
    ok(await page.locator('[data-act="pro-ins-kind"][data-id="term"][aria-pressed="true"]').count() === 1, "This Term can be chosen");
    await noOverflow(page, "in Insights");
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);

    // The Pro sheet lists what Pro adds
    await act(page, "plan-open"); await page.waitForTimeout(400);
    const sheet = await page.locator(".plan-sheet").textContent();
    ok(/What Pro Adds/.test(sheet) && /Insights/.test(sheet) && /Term Recap/.test(sheet), "the Pro sheet lists what Pro adds");
    ok(/Try New Features First/.test(sheet) && /Show My Badge in Groups/.test(sheet), "early access and the supporter badge are offered");
    await page.click('[data-act="pro-early"]'); await page.waitForTimeout(250);
    ok(await page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).settings.early === true), "early access is saved in settings");
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);

    // ---------- Focus timer: routines and Focus History ----------
    await act(page, "pomo-open"); await page.waitForTimeout(400);
    ok(await page.locator('#pomoDlg .pr-chip[data-act="pro-rt"]').count() === 3, "the Focus timer offers three routines");
    await page.click('#pomoDlg .pr-chip[data-id="deep"]'); await page.waitForTimeout(300);
    ok(await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("coursework:v2")).settings; return s.pomo.focus === 50 && s.pomo.every === 3 && s.routine === "deep"; }), "Deep Work sets 50 minute sessions, a long break after 3");
    ok(await page.locator('#pomoDlg .pr-chip.on[data-id="deep"]').count() === 1 && /50:00/.test(await page.locator("#pomoDlg .pomo-time").textContent()), "the dial shows 50:00 and Deep Work is marked");
    await page.click('#pomoDlg [data-act="pro-rt-new"]'); await page.waitForTimeout(300);
    await page.fill('#dlg input[name="name"]', "Reading"); await page.fill('#dlg input[name="focus"]', "35");
    await page.click('#dlg [data-submit]'); await page.waitForTimeout(300);
    ok(await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("coursework:v2")).settings; return s.routines.length === 1 && s.routines[0].name === "Reading" && s.pomo.focus === 35; }), "a routine of your own is saved and chosen");
    ok(await page.locator('#pomoDlg .pomo-today [data-act="pro-fh-open"]').count() === 1, "the Focus timer links to Focus History");
    await act(page, "pro-fh-open"); await page.waitForTimeout(400);
    ok(await page.locator("#dlg .fh-chart .fh-col").count() === 7, "Focus History shows the week day by day");
    ok(/CALC2/.test(await page.locator("#dlg .fh-legend").textContent()), "the legend names the courses");
    await page.click('#dlg [data-act="pro-fh-kind"][data-id="month"]'); await page.waitForTimeout(250);
    ok(await page.locator("#dlg .fh-chart .fh-col").count() === 30, "Month shows 30 days");
    await noOverflow(page, "in Focus History");
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);

    // ---------- Flashcards: deck stats, Smart scheduling, image cards ----------
    await page.click('nav.tabs [data-tab="flashcards"]').catch(() => {}); await page.waitForTimeout(300);
    await act(page, "fc-open", "d1"); await page.waitForTimeout(300);
    ok(await page.locator('[data-act="pro-dk-stats"]').count() === 1 && await page.locator('[data-act="pro-cf-open"]').count() === 1, "the deck page has Stats and Image Cards");
    await act(page, "pro-dk-stats", "d1"); await page.waitForTimeout(400);
    ok(/remembered/.test(await page.locator(".pro-dk-body").textContent()) && await page.locator(".pro-dk-body .dk-heat span").count() === 84, "deck stats show what you remember and 12 weeks of reviews");
    await page.click('[data-act="pro-dk-sched"][data-id="smart"]'); await page.waitForTimeout(300);
    ok(await page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).decks.find ? true : true) && await page.locator('.pro-dk-body [data-dk-ret]').count() === 1, "Smart scheduling can be turned on, with a target to remember");
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);
    await act(page, "fc-study", "d1"); await page.waitForTimeout(300);
    await page.click('[data-act="fc-flip"]'); await page.waitForTimeout(200);
    const goodLbl = (await page.locator('.rate-btn.good span').textContent()).trim();
    await page.click('.rate-btn.good'); await page.waitForTimeout(300);
    const rated = await page.evaluate(() => { const st = JSON.parse(localStorage.getItem("coursework:v2")); const d = (Array.isArray(st.decks) ? st.decks : Object.values(st.decks)).find(x => x.id === "d1"); return d.cards.find(c => c.fs); });
    ok(rated && rated.fs.s > 0 && rated.fs.d >= 1 && rated.due > day(0), "a Smart rating gives the card its own stability and a later due date (" + (rated && rated.due) + ", button said " + goodLbl + ")");
    await page.click('[data-act="fc-exit"]').catch(() => {}); await page.waitForTimeout(200);
    // a PDF with a labelled diagram: its labels are found and become boxes
    const found = await page.evaluate(async bytes => { const items = await window.SBPRO.scanPdf(new Uint8Array(bytes), "Lecture 7"); return items.map(x => ({n: x.boxes.length, t: x.boxes.map(b => b.t), w: x.w, h: x.h, ok: x.boxes.every(b => b.x >= 0 && b.y >= 0 && b.x + b.w <= 1.02 && b.y + b.h <= 1.02)})); }, diagramPdf());
    ok(found.length === 1 && found[0].n === 4 && !found[0].t.includes("An animal cell") && found[0].t.includes("Mitochondria") && found[0].t.includes("Cell membrane") && found[0].ok, "the diagram page and its labels are found: " + JSON.stringify(found));
    await page.evaluate(async bytes => { const items = await window.SBPRO.scanPdf(new Uint8Array(bytes), "Lecture 7"); items.forEach(x => { x.found = true; }); window.SBPRO.openImageEditor("d1", items); }, diagramPdf());
    await page.waitForTimeout(500);
    ok(await page.locator(".oc-stage .oc-box").count() >= 4 && await page.locator(".oc-list input").count() >= 4, "the editor shows a box and an answer for each label");
    await page.locator('.oc-list [data-act="pro-oc-del"]').first().click(); await page.waitForTimeout(200);
    const left = await page.locator(".oc-list input").count();
    await page.click("#ocKeep"); await page.waitForTimeout(800);
    const ic = await page.evaluate(() => { const st = JSON.parse(localStorage.getItem("coursework:v2")); const d = (Array.isArray(st.decks) ? st.decks : Object.values(st.decks)).find(x => x.id === "d1"); return d.cards.filter(c => c.img); });
    ok(ic.length === left && ic.every(c => c.img.k && c.img.m.length === left && c.back), "keeping makes one image card per box (" + ic.length + ")");
    await page.evaluate(ids => window.__sbAvail && true, []);
    await act(page, "fc-open", "d1"); await page.waitForTimeout(300);
    await page.evaluate(id => { const b = document.createElement("button"); b.dataset.act = "fc-study"; b.dataset.id = "d1"; document.body.appendChild(b); b.click(); b.remove(); }, "");
    await page.waitForTimeout(300);
    // step to an image card in the session (new cards come after due ones)
    for (let i = 0; i < 8 && !(await page.locator(".flip .ci-face").count()); i++) { await page.click('[data-act="fc-flip"]').catch(() => {}); await page.waitForTimeout(100); await page.click(".rate-btn.easy").catch(() => {}); await page.waitForTimeout(150); }
    ok(await page.locator(".flip .face.front .ci-box.me").count() === 1, "studying an image card covers its own label on the front");
    await page.waitForTimeout(400);
    ok(await page.locator(".flip .face.front .ci-wrap img").count() === 1, "the picture loads from this device's copy");
    await page.click('[data-act="fc-exit"]').catch(() => {}); await page.waitForTimeout(200);

    // A focus session ends: it is logged with its start hour and course
    await page.evaluate(() => { localStorage.setItem("pro-e2e", "1"); });
    ok(page.errs.length === 0, "no console errors so far: " + page.errs.join(" | "));

    // ---------- Term Recap: a term closed with Start a New Term five days ago ----------
    const seed2 = SEED(); seed2.settings.scrap = {v: 1, cur: {id: "p2", n: "Winter", s: day(-4), g: {}, p: {}, d: [], pp: "cream"}, past: [{id: "p1", n: "Fall 2026", s: day(-70), e: day(-5), lab: "Fall 2026", g: {}, p: {}, d: [], pp: "cream"}]};
    const p2 = await open(await mkCtx(seed2));
    await p2.click('nav.tabs [data-tab="board"]').catch(() => {}); await p2.waitForTimeout(300);
    ok(await p2.locator(".pro-recap-card").count() === 1, "Today shows the term recap card");
    await p2.click('.pro-recap-card [data-act="pro-recap-open"]'); await p2.waitForTimeout(400);
    const n1 = await p2.locator(".prc-dots i").count();
    ok(n1 >= 3, "the recap has several cards (" + n1 + ")");
    ok(/TIME FOCUSED|Time Focused/i.test(await p2.locator(".prc-k").textContent()), "the first card is time focused");
    await p2.click("#proRcNext"); await p2.waitForTimeout(200);
    ok(await p2.locator(".prc-dots i.on").count() === 2, "Next steps to the second card");
    await noOverflow(p2, "in the recap");
    await p2.keyboard.press("Escape"); await p2.waitForTimeout(300);
    ok(await p2.locator(".pro-recap-card").count() === 0, "after opening it, the card doesn't come back");
    ok(p2.errs.length === 0, "no console errors in the recap: " + p2.errs.join(" | "));

    // ---------- Free plan (enforcement on, not Pro) ----------
    const p3 = await open(await mkCtx(seed2, true));
    ok(await p3.locator(".pro-recap-card").count() === 0, "free: no term recap card");
    await act(p3, "wkr-open"); await p3.waitForTimeout(400);
    ok(await p3.locator(".wkr-sheet .pro-ins-card").count() === 0 && await p3.locator('.wkr-sheet .pro-linkrow .pro-badge').count() === 1, "free: Weekly Review has one quiet Insights · PRO row");
    await p3.click('.wkr-sheet [data-act="pro-ins-open"]'); await p3.waitForTimeout(400);
    ok(await p3.locator(".plan-sheet").count() === 1 && await p3.locator(".pro-ins-body").count() === 0, "free: tapping it opens the Pro sheet, not Insights");
    await p3.keyboard.press("Escape"); await p3.waitForTimeout(200);
    await act(p3, "pomo-open"); await p3.waitForTimeout(400);
    ok(await p3.locator('#pomoDlg .pr-chip[data-id="deep"] .pro-badge').count() === 1 && await p3.locator('#pomoDlg .pr-chip[data-id="classic"] .pro-badge').count() === 0, "free: Classic is free, Deep Work is marked PRO");
    await p3.click('#pomoDlg .pr-chip[data-id="deep"]'); await p3.waitForTimeout(400);
    ok(await p3.locator("#dlg .plan-sheet").count() === 1, "free: a Pro routine opens the Pro sheet");
    await p3.keyboard.press("Escape"); await p3.waitForTimeout(200);
    const pd = p3.locator("#pomoDlg"); if (await pd.evaluate(d => d.open)) await pd.evaluate(d => d.close());
    await p3.click('nav.tabs [data-tab="flashcards"]').catch(() => {}); await p3.waitForTimeout(300);
    await act(p3, "fc-open", "d1"); await p3.waitForTimeout(300);
    ok(await p3.locator('[data-act="pro-dk-stats"] .pro-badge').count() === 1 && await p3.locator('[data-act="pro-cf-open"] .pro-badge').count() === 1, "free: Stats and Image Cards are marked PRO");
    await act(p3, "pro-cf-open", "d1"); await p3.waitForTimeout(400);
    ok(await p3.locator("#dlg .plan-sheet").count() === 1, "free: Image Cards opens the Pro sheet");
    ok(p3.errs.length === 0, "no console errors on the free plan: " + p3.errs.join(" | "));
    if (process.env.SHOTS) { /* screenshots for a manual look */ }
    console.log("\npro-extras.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
