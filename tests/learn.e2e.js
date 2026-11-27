// node tests/learn.e2e.js [screenshot-dir]  Learn on a deck: pick, then type, misses come back, "I was right", a session kept
// between visits, and the review schedule left alone unless "Count toward review" is ticked. Phone and desktop.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const shots = process.argv[2] ? path.resolve(process.argv[2]) : "";
if (shots) fs.mkdirSync(shots, {recursive: true});
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const card = (id, front, back, x) => Object.assign({id, front, back, box: 2, due: "2030-01-01", seen: 3, right: 2, wrong: 1, last: "2026-01-01"}, x || {});
const SEED = {v: 2, updated: 1, courses: [{id: "c1", name: "Biology", code: "BIOL 1200", color: "#1E9E74"}], tasks: [], notes: [], settings: {},
  decks: [
    {id: "d1", name: "Cell biology", courseId: "c1", created: 1, quizzes: [], aiQuizzes: [], cards: [
      card("k1", "Mitochondria", "Powerhouse of the cell"), card("k2", "Ribosome", "Makes proteins"), card("k3", "Nucleus", "Holds the DNA"),
      card("k4", "Golgi body", "Packages proteins"), card("k5", "Lysosome", "Breaks down waste"), card("k6", "Chloroplast", "Site of photosynthesis"),
      card("k7", "Cell membrane", "Controls what enters and leaves"), card("k8", "Kinetic energy", "$\\frac{1}{2}mv^2$"), card("k9", "Osmosis", "Water crossing a membrane"),
      card("k10", "Draft card", "Not ready", {draft: true}), card("k11", "Name the hidden label", "", {img: {k: "a:x", w: 10, h: 10, nl: 1}})]},
    {id: "d2", name: "Tiny", courseId: "c1", created: 2, quizzes: [], aiQuizzes: [], cards: [card("t1", "One", "1"), card("t2", "Two", "2"), card("t3", "Three", "3")]}]};

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    for (const [w, h, mob] of [[402, 874, true], [1300, 860, false]]) {
      const tag = mob ? "phone" : "desktop";
      const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: w, height: h}, isMobile: mob, hasTouch: mob, deviceScaleFactor: 1, reducedMotion: mob ? "no-preference" : "reduce"});
      await ctx.addInitScript(require("./consent-ok")); await ctx.routeWebSocket(/supabase\.co/, ws => ws.close()); await ctx.route(/supabase\.co/, r => r.abort());
      await ctx.addInitScript(seed => {
        if (localStorage.getItem("coursework:v2")) return;
        localStorage.setItem("coursework:v2", JSON.stringify(seed));
        localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done");
      }, SEED);
      const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto(base); await page.waitForFunction(() => window.__sbLearn && window.SBLEARN, null, {timeout: 40000}); await page.waitForTimeout(600);
      await page.evaluate(() => { window.SBLEARN.auto = false; });
      const openDeck = async id => { await page.evaluate(id => { const L = window.__sbLearn; L.ui.tab = "flashcards"; L.ui.fc = null; L.ui.deckId = id; L.render(); }, id); await page.waitForSelector(`[data-fc-deck="${id}"]`); await page.waitForTimeout(150); };
      const deck = id => page.evaluate(id => JSON.parse(JSON.stringify(window.__sbLearn.state().decks[id])), id);
      const sched = d => d.cards.map(c => [c.id, c.box, c.due, c.seen, c.right, c.last].join("|")).join(";");
      const S = () => page.evaluate(() => { const R = window.__sbLearn.session(); return R ? JSON.parse(JSON.stringify(R.S)) : null; });
      const kind = () => page.evaluate(() => { const s = document.querySelector("dialog[open] .lr-sheet"); return s ? s.dataset.lrn + (s.dataset.lrType ? ":" + s.dataset.lrType : "") : ""; });
      const text = sel => page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.innerText.replace(/\s+/g, " ").trim() : ""; }, sel);
      const backOf = (d, id) => d.cards.find(c => c.id === id).back;
      const shot = async name => { if (shots) await page.screenshot({path: path.join(shots, `${name}-${tag}.png`)}); };
      const noOverflow = async what => { const o = await page.evaluate(() => { const d = document.querySelector("#dlg"), b = document.querySelector("#dlg .sheet-body"); return {page: document.documentElement.scrollWidth - document.documentElement.clientWidth, dlg: d.scrollWidth - d.clientWidth, body: b ? b.scrollWidth - b.clientWidth : 0}; });
        ok(o.page <= 0 && o.dlg <= 0 && o.body <= 0, `${tag}: no sideways scrolling ${what} ` + JSON.stringify(o)); };
      // answers the question on screen rightly, then moves on
      const d0 = await deck("d1");
      async function answerRight(){
        const s = await S(), q = s.cur;
        if (q.type === "mc") await page.click(`dialog[open] .lr-opt[data-id="${q.right}"]`);
        else if (q.type === "type") { await page.fill("#lrIn", backOf(d0, q.id)); await page.press("#lrIn", "Enter"); }
        else await page.click('[data-act="lrn-free"]');
        await page.waitForSelector('dialog[open] .lr-sheet[data-lrn="fb"]');
        await page.click('dialog[open] [data-act="lrn-next"]');
      }
      let sawMath = false;
      async function step(){ if (!sawMath) sawMath = await page.evaluate(() => !!document.querySelector("dialog[open] .lr-sheet .mth.mth-ok .katex")); const k = await kind(); if (k === "round") await page.click('[data-act="lrn-round"]'); else if (k.startsWith("q")) await answerRight(); await page.waitForTimeout(20); }

      /* The button */
      await openDeck("d2");
      ok(!(await page.$('[data-fc-deck="d2"] [data-act="lrn-start"]')), `${tag}: a deck with fewer than 4 cards has no Learn button`);
      await openDeck("d1");
      const acts = await page.evaluate(() => [...document.querySelectorAll('[data-fc-deck="d1"] .row-actions .btn[data-act]')].map(b => b.dataset.act));
      ok(acts.indexOf("lrn-start") === acts.indexOf("fc-study") + 1, `${tag}: Learn sits beside Study: ` + acts.join());
      ok(await page.evaluate(() => { const b = document.querySelector('[data-act="lrn-start"]'), r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !b.closest(".ra-menu"); }), `${tag}: Learn shows on the deck page, not folded under More`);
      await shot("deck");
      await page.click('[data-act="lrn-start"]'); await page.waitForSelector('dialog[open] .lr-sheet[data-lrn="intro"]');
      const intro = await text("dialog[open] .lr-sheet");
      ok(/9 cards/.test(intro) && /Pick/.test(intro) && /Type/.test(intro) && /Left out: 1 picture card with no typed label/.test(intro), `${tag}: the first screen says how it works and what's left out: ` + intro);
      ok(!(await page.isChecked("#lrCount")), `${tag}: Count toward review starts off`);
      await page.click('[data-act="lrn-go"]'); await page.waitForSelector('dialog[open] .lr-sheet[data-lrn="q"]');
      let s = await S();
      ok(s.order.length === 9 && s.round.ids.length === 7 && !s.count, `${tag}: 9 cards, a round of 7`);
      ok(await kind() === "q:mc" && (await page.$$("dialog[open] .lr-opt")).length === 4, `${tag}: a new card is multiple choice with 4 options`);
      ok(await text("dialog[open] .lr-legend") === "New 9 Familiar 0 Mastered 0", `${tag}: the bar counts New, Familiar and Mastered: ` + await text("dialog[open] .lr-legend"));
      await noOverflow("on a question"); await shot("mc");
      // right, by keyboard
      s = await S();
      if (!mob) { await page.keyboard.press(String(s.cur.right + 1)); }
      else await page.click(`dialog[open] .lr-opt[data-id="${s.cur.right}"]`);
      await page.waitForSelector('dialog[open] .lr-sheet[data-lrn="fb"]');
      ok(await page.evaluate(() => document.querySelector("dialog[open] .lr-sheet").dataset.lrOk) === "1" && /Right/.test(await text("dialog[open] .lr-fb")) && (s.cur.id === "k8" ? !/type it/.test(await text("dialog[open] .lr-fb")) : /type it/.test(await text("dialog[open] .lr-fb"))), `${tag}: a right pick says so, and that it'll be typed next time (not for a formula)`);
      ok((await S()).items[s.cur.id].lv === 1, `${tag}: picked right: Familiar`);
      await page.waitForTimeout(120);
      ok(/^Right/.test(await page.evaluate(() => document.getElementById("lrSay").textContent)), `${tag}: screen readers hear it`);
      await shot("right");
      if (!mob) { ok(await page.evaluate(() => document.activeElement && document.activeElement.id === "lrNext"), `${tag}: Continue has the focus`); await page.keyboard.press("Enter"); } else await page.click('[data-act="lrn-next"]');
      await page.waitForSelector('dialog[open] .lr-sheet[data-lrn="q"]');
      ok(true, `${tag}: Continue (Enter on desktop) moves on`);
      // wrong
      s = await S(); const missId = s.cur.id, wrong = (s.cur.right + 1) % s.cur.opts.length;
      await page.click(`dialog[open] .lr-opt[data-id="${wrong}"]`); await page.waitForSelector('dialog[open] .lr-sheet[data-lrn="fb"]');
      ok(await page.evaluate(([w, r]) => document.querySelector(`.lr-opts.is-done .lr-opt:nth-child(${w + 1})`).classList.contains("no") && document.querySelector(`.lr-opts.is-done .lr-opt:nth-child(${r + 1})`).classList.contains("ok"), [wrong, s.cur.right]), `${tag}: a wrong pick shows the pick in red and the right one in green`);
      ok(/comes back later in this round/.test(await text("dialog[open] .lr-fb")) && !(await page.$('[data-act="lrn-right"]')), `${tag}: a miss says it comes back (no "I was right" for a pick)`);
      ok((await S()).round.queue.slice(-1)[0] === missId, `${tag}: the missed card is at the end of the round`);
      await noOverflow("on feedback"); await shot("wrong");
      await page.click('[data-act="lrn-next"]');
      // the rest of round 1
      let guard = 0; while (await kind() !== "round" && guard++ < 30) await step();
      ok(/Round 1 done/.test(await text("dialog[open] .lr-round")) && (await page.$$("dialog[open] .lr-list li")).length === 7, `${tag}: between rounds, how the round went`);
      await page.click('[data-act="lrn-round"]'); await page.waitForSelector('dialog[open] .lr-sheet[data-lrn="q"]');
      // to a typed question
      guard = 0; while (await kind() !== "q:type" && guard++ < 30) await step();
      ok(await kind() === "q:type", `${tag}: a Familiar card is typed`);
      ok(await page.evaluate(() => document.activeElement && document.activeElement.id === "lrIn"), `${tag}: the answer box has the cursor`);
      await page.fill("#lrIn", "Mito"); await shot("typed");
      const bar = await page.evaluate(() => { const b = document.querySelector(".lr-bar"); return {now: +b.getAttribute("aria-valuenow"), text: b.getAttribute("aria-valuetext"), f: document.querySelector(".lr-bar .lr-f").style.width}; });
      ok(/mastered, \d+ familiar, \d+ new/.test(bar.text) && parseFloat(bar.f) > 0, `${tag}: the progress bar mid-session: ` + JSON.stringify(bar));
      await shot("progress");
      // typed wrong, then "I was right"
      s = await S(); const tId = s.cur.id;
      await page.fill("#lrIn", "something else entirely"); await page.click('[data-act="lrn-submit"]'); await page.waitForSelector('dialog[open] .lr-sheet[data-lrn="fb"]');
      ok(/Not quite/.test(await text("dialog[open] .lr-fb")) && /something else entirely/.test(await text("dialog[open] .lr-given")), `${tag}: a typed miss shows the answer and what was written`);
      ok((await S()).items[tId].lv === 0, `${tag}: a typed miss goes back to New`);
      await shot("typed-wrong");
      await page.click('[data-act="lrn-right"]'); await page.waitForSelector('dialog[open] .lr-sheet[data-lrn="fb"][data-lr-ok="1"]');
      s = await S();
      ok(s.items[tId].lv === 2 && !s.round.queue.includes(tId) && /Counted as right/.test(await text("dialog[open] .lr-fb")) && /Mastered/.test(await text("dialog[open] .lr-fb")), `${tag}: "I was right" counts it and masters it`);
      await page.click('[data-act="lrn-next"]');
      // a typo is forgiven
      guard = 0; while (await kind() !== "q:type" && guard++ < 30) await step();
      s = await S(); const typo = backOf(d0, s.cur.id).replace(/[aeiou](?=[^aeiou]*$)/, "");
      await page.fill("#lrIn", typo.toUpperCase()); await page.press("#lrIn", "Enter"); await page.waitForSelector('dialog[open] .lr-sheet[data-lrn="fb"]');
      ok(await page.evaluate(() => document.querySelector("dialog[open] .lr-sheet").dataset.lrOk) === "1", `${tag}: a small typo, in capitals, is right ("${typo.toUpperCase()}")`);
      await page.click('[data-act="lrn-next"]');
      // leave half way and come back
      await page.waitForSelector('dialog[open] .lr-sheet[data-lrn]');
      const mid = await S(); await page.keyboard.press("Escape"); await page.waitForTimeout(250);
      ok(!(await page.$("dialog[open] .lr-sheet")), `${tag}: Esc closes Learn`);
      const kept = await page.evaluate(() => JSON.parse(localStorage.getItem("sb:learn:d1") || "null"));
      ok(kept && kept.n === mid.n && JSON.stringify(kept.items) === JSON.stringify(mid.items), `${tag}: the session is kept on this device`);
      await openDeck("d1");
      ok(!!(await page.$('[data-act="lrn-start"] .lr-dot')), `${tag}: the Learn button shows a session in progress`);
      await page.click('[data-act="lrn-start"]'); await page.waitForSelector('dialog[open] .lr-sheet[data-lrn="intro"]');
      ok(/Pick up where you left off/.test(await text("dialog[open] .lr-sheet")) && !!(await page.$('[data-act="lrn-over"]')), `${tag}: coming back offers to pick up where you left off, or start over`);
      await page.click('[data-act="lrn-go"]'); await page.waitForSelector('dialog[open] .lr-sheet[data-lrn]');
      const back = await S();
      ok(back.n === mid.n && JSON.stringify(back.items) === JSON.stringify(mid.items) && (!mid.cur || (back.cur && back.cur.id === mid.cur.id)), `${tag}: it picks up on the same question`);
      // to the end
      guard = 0; while (await kind() !== "done" && guard++ < 80) await step();
      ok(await kind() === "done", `${tag}: the session ends when every card is mastered`);
      ok(sawMath, `${tag}: math in a card is drawn as math`);
      const done = await text("dialog[open] .lr-sheet");
      ok(/You know all 9 cards/.test(done) && /right first time/.test(done) && /review schedule wasn't changed/.test(done), `${tag}: the summary: ` + done);
      ok(await page.evaluate(() => [...document.querySelectorAll("dialog[open] .sheet-foot .btn")].map(b => b.textContent.trim()).join()) === "Learn Again,Done", `${tag}: Learn Again and Done`);
      await noOverflow("on the summary"); await shot("done");
      ok(sched(await deck("d1")) === sched(d0), `${tag}: the review schedule is untouched by default`);
      ok(await page.evaluate(() => { const g = window.__sbLearn.state().settings.goalDay; return g && g.n; }) === 9, `${tag}: each mastered card counted once toward the daily goal`);
      ok(await page.evaluate(() => localStorage.getItem("sb:learn:d1")) === null, `${tag}: a finished session isn't kept`);
      await page.click('[data-act="close"]'); await page.waitForTimeout(200);

      /* Count toward review */
      await openDeck("d1");
      await page.click('[data-act="lrn-start"]'); await page.waitForSelector('dialog[open] .lr-sheet[data-lrn="intro"]');
      await page.check("#lrCount"); await page.click('[data-act="lrn-go"]'); await page.waitForSelector('dialog[open] .lr-sheet[data-lrn="q"]');
      ok((await S()).count, `${tag}: Count toward review is on for this session`);
      // miss the first card once, so it's rated Hard
      s = await S(); const hardId = s.cur.id; await page.click('[data-act="lrn-dunno"]'); await page.waitForSelector('dialog[open] .lr-sheet[data-lrn="fb"]');
      ok(/The answer/.test(await text("dialog[open] .lr-fb")), `${tag}: Don't Know shows the answer`);
      await page.click('[data-act="lrn-next"]');
      // a right answer moves on by itself after a moment
      await page.evaluate(() => { window.SBLEARN.auto = true; }); s = await S();
      if (s.cur && s.cur.type === "mc") { await page.click(`dialog[open] .lr-opt[data-id="${s.cur.right}"]`); await page.waitForSelector('dialog[open] .lr-sheet[data-lrn="fb"]'); await page.waitForTimeout(1300);
        ok(await kind() !== "fb", `${tag}: after a right answer Learn moves on by itself`); }
      await page.evaluate(() => { window.SBLEARN.auto = false; });
      guard = 0; while (await kind() !== "done" && guard++ < 80) await step();
      const d2 = await deck("d1"), was = Object.fromEntries(d0.cards.map(c => [c.id, c]));
      const changed = d2.cards.filter(c => !c.draft && !c.img);
      ok(changed.every(c => c.seen === was[c.id].seen + 1 && c.last !== was[c.id].last && c.due !== was[c.id].due), `${tag}: with Count toward review each card moved along its schedule once`);
      ok(d2.cards.find(c => c.id === hardId).rate === "hard" && changed.filter(c => c.id !== hardId).every(c => c.rate === "good"), `${tag}: Good for cards never missed, Hard for the one missed`);
      ok(/9 cards moved along your review schedule/.test(await text("dialog[open] .lr-sched")), `${tag}: the summary says the schedule changed`);
      ok(await page.evaluate(() => window.__sbLearn.state().settings.goalDay.n) === 18, `${tag}: the review ratings count toward the goal, once each`);
      ok(await page.evaluate(() => window.__sbLearn.state().settings.learnCount) === true, `${tag}: the Count toward review choice is remembered`);
      if (!mob) ok(await page.evaluate(() => !!document.querySelector(".lr-sheet.lr-still")), `${tag}: with reduced motion, Learn doesn't animate`);
      ok(!errs.length, `${tag}: no page errors: ` + errs.join(" | "));
      await ctx.close();
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\nlearn.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
