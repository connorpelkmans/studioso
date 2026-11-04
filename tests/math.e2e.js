// node tests/math.e2e.js [screenshot-dir]  Math, chemistry and formatting in cards, notes and the editors (module 01-math.js)
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const shots = path.resolve(process.argv[2] || path.join(require("os").tmpdir(), "math-shots"));
fs.mkdirSync(shots, {recursive: true});
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const card = (id, front, back) => ({id, front, back, box: 1, due: "2030-01-01", seen: 1, right: 1, wrong: 0});
const SEED = {v: 2, courses: [{id: "c1", name: "Calculus", code: "MATH 101", color: "#3B6FE0"}], settings: {capacity: 15, dailyHours: 3}, updated: 1, tasks: [],
  notes: [{id: "n1", text: "Water is \\ce{H2O}, and **bold**, *italic*, ==marked==.\n$$\\int_0^1 x\\,dx = \\frac{1}{2}$$\nIt costs $5 and $10.", color: "yellow", x: 40, y: 40, z: 1, rot: 0, courseId: "c1"}],
  decks: [{id: "d1", name: "Derivatives", courseId: "c1", created: 1, quizzes: [], aiQuizzes: [], cards: [card("k1", "What is $\\frac{d}{dx}x^2$?", "$2x$, by the **power rule**"), card("k2", "Plain card", "No math, a*b*c and 2*3*4 stay")]}]};
function seedInit(seed){
  try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {}
}
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}});
    const page = await ctx.newPage(), errs = [];
    page.on("pageerror", e => errs.push(e.message));
    await page.addInitScript(seedInit, SEED);
    await page.goto(base); await page.waitForFunction(() => window.__sbMath); await page.waitForTimeout(600);

    // Reading the marks
    const split = await page.evaluate(() => { const S = s => window.__sbMath.mathSplit(s).map(p => p.m ? (p.d ? "D:" : "M:") + p.s : "T:" + p.s); return {
      price: S("It costs $5 and $10."), range: S("$20-$30 a week"), inline: S("Area $\\pi r^2$ here"), paren: S("\\(a+b\\) and \\[c\\]"), dbl: S("$$x$$"), esc: S("\\$5 is $x$"), chem: S("Water \\ce{H2O}"), nl: S("$a\nb$") }; });
    ok(split.price.length === 1 && split.price[0][0] === "T", "prices with $ stay text");
    ok(split.range.every(p => p[0] === "T"), "a $20-$30 range stays text");
    ok(JSON.stringify(split.inline) === JSON.stringify(["T:Area ", "M:\\pi r^2", "T: here"]), "inline $...$ is math");
    ok(split.paren[0] === "M:a+b" && split.paren[2] === "D:c", "\\(...\\) is inline and \\[...\\] is on its own line");
    ok(split.dbl[0] === "D:x", "$$...$$ is on its own line");
    ok(split.esc[0] === "T:$5 is " && split.esc[1] === "M:x", "\\$ is a plain dollar sign");
    ok(split.chem[1] === "M:\\ce{H2O}", "\\ce{...} on its own is chemistry");
    ok(split.nl.every(p => p[0] === "T"), "a single $ doesn't reach across a line break");
    ok(await page.evaluate(() => window.__sbMath.mathSpeech("$\\frac{a}{b}$ and $x^2$")) === "a over b and x squared", "math is read aloud as words");

    // Cards in a deck
    await page.evaluate(() => { const M = window.__sbMath; M.ui.tab = "flashcards"; M.ui.fc = null; M.ui.deckId = "d1"; M.render(); });
    await page.waitForFunction(() => document.querySelector(".fc-front .mth.mth-ok .katex"), null, {timeout: 15000});
    ok(await page.evaluate(() => !!document.querySelector(".fc-back strong") && document.querySelector(".fc-back strong").textContent === "power rule"), "**bold** on a card back is bold");
    ok(await page.evaluate(() => { const r = [...document.querySelectorAll(".fc-front, .fc-back")].find(e => /a\*b\*c/.test(e.textContent)); return !!r && !r.querySelector("em"); }), "a*b*c and 2*3*4 aren't italic");
    ok(await page.evaluate(() => !!document.querySelector(".fc-front .katex-mathml math")), "math carries MathML for screen readers");
    await page.screenshot({path: path.join(shots, "deck.png")});

    // Editing a card: toolbar, bold, and the equation editor
    await page.click('[data-act="fc-card"][data-id="k2"]');
    await page.waitForSelector('dialog[open] textarea[name="front"]');
    await page.focus('dialog[open] textarea[name="front"]');
    await page.waitForSelector(".rb-bar:not([hidden])");
    ok(await page.evaluate(() => document.querySelector(".rb-bar").parentElement.tagName === "DIALOG"), "the toolbar sits in the sheet, above other layers");
    await page.evaluate(() => { const t = document.querySelector('dialog[open] textarea[name="front"]'); t.setSelectionRange(0, 5); });
    await page.click('.rb-bar [data-rb="b"]');
    ok(await page.$eval('dialog[open] textarea[name="front"]', t => t.value) === "**Plain** card", "Bold wraps the selection");
    await page.click('.rb-bar [data-rb="b"]');
    ok(await page.$eval('dialog[open] textarea[name="front"]', t => t.value) === "Plain card", "Bold again takes it off");
    await page.evaluate(() => { const t = document.querySelector('dialog[open] textarea[name="front"]'); t.setSelectionRange(t.value.length, t.value.length); });
    await page.keyboard.press("Alt+Equal");
    await page.waitForSelector(".rb-eq .rb-eq-in");
    await page.click('.rb-eq [data-eqt="1"]');
    await page.click('.rb-eq [data-eqk="1"]');
    ok(await page.$eval(".rb-eq .rb-eq-in", t => t.value) === "\\int_{a}^{b} \\,dx", "a template goes in at the caret");
    await page.fill(".rb-eq .rb-eq-in", "\\frac{1}{2}");
    await page.waitForSelector(".rb-eq-prev .katex");
    await page.screenshot({path: path.join(shots, "equation-editor.png")});
    await page.fill(".rb-eq .rb-eq-in", "\\frac{1}{");
    await page.waitForFunction(() => document.querySelector(".rb-eq-prev.bad"));
    ok(true, "a formula that isn't finished says so in the preview");
    await page.fill(".rb-eq .rb-eq-in", "\\frac{1}{2}");
    await page.click('.rb-eq [data-eqa="ok"]');
    ok(await page.$eval('dialog[open] textarea[name="front"]', t => t.value) === "Plain card$\\frac{1}{2}$", "Insert puts $...$ at the caret");
    ok(await page.evaluate(() => document.querySelector("dialog").open), "the sheet stays open");
    // The caret in a formula edits it
    await page.evaluate(() => { const t = document.querySelector('dialog[open] textarea[name="front"]'); t.focus(); t.setSelectionRange(14, 14); });
    await page.click('.rb-bar [data-rb="eq"]');
    ok(await page.$eval(".rb-eq .rb-eq-in", t => t.value) === "\\frac{1}{2}", "the caret in a formula opens it for editing");
    await page.keyboard.press("Escape");
    ok(await page.evaluate(() => !document.querySelector(".rb-eq") && document.querySelector("dialog").open), "Escape closes the equation editor, not the sheet");
    await page.evaluate(() => document.querySelector("dialog").close());

    // A note
    await page.evaluate(() => { const M = window.__sbMath; M.ui.tab = "notes"; M.render(); });
    await page.waitForFunction(() => document.querySelector('.note[data-note="n1"] .note-body .mth.mth-ok .katex'), null, {timeout: 15000});
    const note = await page.evaluate(() => { const b = document.querySelector('.note[data-note="n1"] .note-body'); return {chem: !!b.querySelector(".mth .mhchem, .mth .katex"), em: !!b.querySelector("em"), mark: !!b.querySelector("mark.rt-mark"), disp: !!b.querySelector(".mth-d .katex-display"), price: /costs \$5 and \$10/.test(b.textContent), n: b.querySelectorAll(".mth").length}; });
    ok(note.chem && note.em && note.mark && note.disp, "a note shows chemistry, italic, highlight and a display formula");
    ok(note.price && note.n === 2, "the prices in the note stay text");
    await page.screenshot({path: path.join(shots, "note.png")});
    // Typing in a note keeps it open while the equation editor is used
    await page.click('.note[data-note="n1"]'); await page.waitForSelector("#noteText");
    await page.focus("#noteText"); await page.waitForSelector(".rb-bar:not([hidden])");
    await page.click('.rb-bar [data-rb="eq"]'); await page.waitForSelector(".rb-eq .rb-eq-in");
    await page.fill(".rb-eq .rb-eq-in", "E=mc^2"); await page.click('.rb-eq [data-eqa="ok"]');
    ok(await page.evaluate(() => !!document.querySelector("#noteText") && /\$E=mc\^2\$/.test(document.querySelector("#noteText").value)), "the equation goes into the note being edited");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    await ctx.close();
    const mac = await browser.newContext({viewport: {width: 360, height: 760}, userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"});
    const mp = await mac.newPage();
    await mp.addInitScript(() => { Object.defineProperty(navigator, "platform", {get: () => "MacIntel"}); });
    await mp.addInitScript(seedInit, SEED);
    await mp.goto(base); await mp.waitForFunction(() => window.__sbMath); await mp.waitForTimeout(400);
    await mp.evaluate(() => { const M = window.__sbMath; M.ui.tab = "flashcards"; M.ui.fc = null; M.ui.deckId = "d1"; M.render(); });
    await mp.click('[data-act="fc-card"][data-id="k2"]'); await mp.waitForSelector('dialog[open] textarea[name="front"]'); await mp.focus('dialog[open] textarea[name="front"]');
    await mp.keyboard.press("Alt+Equal"); await mp.waitForTimeout(200);
    ok(await mp.locator(".rb-eq").count() === 0, "on a Mac, Option+= is left for typing ≠");
    await mp.keyboard.press("Control+Equal"); await mp.waitForSelector(".rb-eq .rb-eq-in", {timeout: 5000});
    ok(await mp.evaluate(() => { const b = document.querySelector('.rb-bar [data-rb="eq"]'); return /⌃=/.test(b.title + " " + (b.dataset.tip || "")); }), "Control+= opens the equation editor there, and the button says so");
    await mp.keyboard.press("Escape");
    // a long inline formula wraps on a phone instead of running off the side
    await mp.evaluate(() => window.__sbMath.loadKatex());
    const wide = await mp.evaluate(() => { const d = document.createElement("div"); d.style.cssText = "width:300px;position:absolute;left:0;top:0"; d.appendChild(window.__sbMath.richFrag("See $a_1 + a_2 + a_3 + a_4 + a_5 + a_6 + a_7 + a_8 + a_9 + a_{10} + a_{11} + a_{12} + a_{13} + a_{14} = S$ here")); document.body.appendChild(d); const r = d.getBoundingClientRect(), w = Math.max(...[...d.querySelectorAll("*")].filter(e => !e.closest(".katex-mathml")).map(e => e.getBoundingClientRect().right)), ok2 = !!d.querySelector(".mth-ok .katex-html"); d.remove(); return {w, r: r.right, ok2}; });
    ok(wide.ok2 && wide.w <= wide.r + 1, "a long inline formula fits a phone's width: " + JSON.stringify(wide));
    await mac.close();
  } finally { await browser.close(); server.close(); }
  console.log(`\n${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
