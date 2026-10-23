// node tests/image-cards.e2e.js (Playwright + Chromium; see tests/pw.js) Image cards
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const pad = x => String(x).padStart(2, "0");
const day = off => { const d = new Date(); d.setDate(d.getDate() + off); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
// Two cards made by an older version
const OLD = i => ({id: "o" + i, front: "Name the hidden label", back: ["Nucleus", "Ribosome"][i], box: 0, due: "", seen: 0, right: 0, wrong: 0,
  img: {k: "i:old", w: 400, h: 300, m: [[0.1, 0.1, 0.2, 0.1], [0.6, 0.6, 0.2, 0.1]], i, mode: "all", src: "Old cell"}});
function SEED(){
  return {v: 2, updated: 1, settings: {}, tasks: [], courses: [{id: "c1", name: "Biology", code: "BIO1", color: "#3B6FE0"}],
    decks: [{id: "d1", name: "Old Pictures", courseId: "c1", created: 1, cards: [OLD(0), OLD(1)], quizzes: []},
      {id: "d3", name: "Cell Parts", courseId: "c1", created: 2, cards: [], quizzes: []}]};
}
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mkCtx = async (seed, free) => {
    const ctx = await browser.newContext({viewport: {width: 390, height: 844}});
    await ctx.addInitScript(([seed, free]) => {
      window.__SB_TEST = true;
      try {
        if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); }
        if (free) localStorage.setItem("studyboard:paywall-test", "1");
      } catch (e) {}
    }, [seed, !!free]);
    return ctx;
  };
  const open = async ctx => { const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) page.errs.push(m.text()); }); await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.__sbSync); await page.waitForTimeout(700); return page; };
  const act = (page, a, id) => page.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || ""]);
  const noOverflow = async (page, what) => { const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); ok(o <= 0, "no horizontal scroll " + what + " (" + o + ")"); };
  const deck = (page, id) => page.evaluate(id => JSON.parse(JSON.stringify(window.__sbSync.state.decks[id])), id);
  const studyDeck = async (page, id) => { await page.click('nav.tabs [data-tab="flashcards"]').catch(() => {}); await page.waitForTimeout(200); await act(page, "fc-open", id); await page.waitForTimeout(200); await act(page, "fc-study", id); await page.waitForTimeout(300); };
  const curCard = async page => { const id = await page.getAttribute(".ic-study", "data-ic-card"); const d = await page.evaluate(() => { const S = window.__sbSync, it = S.ui.fc.q[S.ui.fc.i]; return JSON.parse(JSON.stringify(S.state.decks[it.deckId])); }); return d.cards.find(c => c.id === id); };
  try {
    const page = await open(await mkCtx(SEED()));

    // Older masks still render and study
    await studyDeck(page, "d1");
    ok(await page.locator(".ic-study").count() === 1 && await page.locator(".flip").count() === 0, "an image card is studied on the image card screen");
    ok(await page.locator('.ic-study button.ci-box.me[data-act="fc-flip"]').count() === 1, "old masks: the card's own label is a button that shows the answer");
    ok(await page.locator(".ic-study .ci-box.other").count() === 1 && await page.locator(".ic-study rect").count() === 2, "old masks: Hide All covers the other label too, drawn as boxes");
    ok(/Hide All, Guess One/.test(await page.locator(".ic-top").textContent()), "the study mode has a clear name");
    const c1 = await curCard(page);
    await page.click('.ic-study button.ci-box.me'); await page.waitForTimeout(200);
    ok((await page.locator(".ic-study .ci-ans").textContent()).trim() === c1.back && await page.locator(".ic-study .ci-box.me.shown .ci-tag").count() === 1, "the back shows the answer word, on the picture and under it: " + c1.back);
    ok(await page.locator(".ic-study .ci-box.other").count() === 1, "Hide All keeps the other labels covered on the back");
    await page.click(".rate-btn.good"); await page.waitForTimeout(250);
    ok((await deck(page, "d1")).cards.find(c => c.id === c1.id).seen === 1, "rating an old-format card saves it");
    await noOverflow(page, "studying an image card");
    await page.click('[data-act="fc-exit"]').catch(() => {}); await page.waitForTimeout(200);

    // The editor: shapes, a group, undo
    await page.evaluate(async () => {
      const cv = document.createElement("canvas"); cv.width = 400; cv.height = 300; const g = cv.getContext("2d");
      g.fillStyle = "#fff"; g.fillRect(0, 0, 400, 300); g.fillStyle = "#222"; g.font = "16px sans-serif";
      [["Nucleus", 30, 40], ["Ribosome", 250, 40], ["Golgi", 30, 250], ["Cell", 250, 200], ["membrane", 250, 225]].forEach(([t, x, y]) => g.fillText(t, x, y));
      const blob = await new Promise(r => cv.toBlob(r, "image/jpeg", 0.9));
      window.SBPRO.openImageEditor("d3", [{blob, w: 400, h: 300, boxes: [], src: "Cell diagram"}]);
    });
    await page.waitForTimeout(400);
    ok(await page.locator('.oc-tools [data-act="pro-oc-tool"]').count() === 4 && await page.locator('input[name="ocMode"]').count() === 3, "the editor has Box, Oval, Freehand and Pan, and three study modes");
    let st = null;
    const measure = async () => { await page.locator(".oc-stage").scrollIntoViewIfNeeded(); st = await page.locator(".oc-stage").boundingBox(); };
    const P = (fx, fy) => [st.x + st.width * fx, st.y + st.height * fy];
    const drag = async (a, b, steps) => { await measure(); await page.mouse.move(...P(...a)); await page.mouse.down(); for (let i = 1; i <= (steps || 6); i++) await page.mouse.move(...P(a[0] + (b[0] - a[0]) * i / (steps || 6), a[1] + (b[1] - a[1]) * i / (steps || 6))); await page.mouse.up(); await page.waitForTimeout(150); };
    const label = async t => { await page.locator(".oc-list input").last().fill(t); };
    await drag([0.05, 0.06], [0.3, 0.17]); await label("Nucleus");
    await page.click('[data-act="pro-oc-tool"][data-id="oval"]');
    await drag([0.6, 0.06], [0.85, 0.17]); await label("Ribosome");
    await page.click('[data-act="pro-oc-tool"][data-id="free"]');
    await measure(); await page.mouse.move(...P(0.05, 0.75)); await page.mouse.down();
    for (const [x, y] of [[0.15, 0.72], [0.25, 0.76], [0.26, 0.86], [0.15, 0.9], [0.06, 0.86], [0.05, 0.78]]) await page.mouse.move(...P(x, y), {steps: 4});
    await page.mouse.up(); await page.waitForTimeout(150); await label("Golgi");
    await page.click('[data-act="pro-oc-tool"][data-id="rect"]');
    await drag([0.6, 0.6], [0.75, 0.69]); await label("Cell");
    await drag([0.62, 0.73], [0.85, 0.8]); await label("membrane");
    ok(await page.locator(".oc-stage .oc-box").count() === 5 && await page.locator(".oc-stage ellipse").count() === 1 && await page.locator(".oc-stage polygon").count() === 1, "the editor draws boxes, an oval and a freehand shape");
    await page.click('.oc-list li:nth-child(2) [data-act="pro-oc-del"]'); await page.waitForTimeout(150);
    ok(await page.locator(".oc-stage .oc-box").count() === 4, "a box can be removed");
    await page.click('[data-act="pro-oc-undo"]'); await page.waitForTimeout(150);
    ok(await page.locator(".oc-stage .oc-box").count() === 5 && await page.locator(".oc-stage ellipse").count() === 1, "Undo brings it back");
    await page.click('[data-act="pro-oc-multi"]');
    await page.click('.oc-stage [data-oc-box="3"]'); await page.click('.oc-stage [data-oc-box="4"]');
    await page.click('[data-act="pro-oc-group"]'); await page.waitForTimeout(150);
    ok(await page.locator(".oc-list li").count() === 4 && await page.locator('.oc-list input[data-oc-ans="3"]').inputValue() === "Cell membrane", "two boxes grouped make one card, their words joined: Cell membrane");
    await page.click('.oc-list [data-act="pro-oc-pick"][data-id="0"]'); await page.waitForTimeout(100);
    await measure(); const h = await page.locator(".oc-h.se").boundingBox();
    await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await page.mouse.down(); await page.mouse.move(...P(0.4, 0.22), {steps: 4}); await page.mouse.up(); await page.waitForTimeout(150);
    await page.check('input[name="ocMode"][value="tap"]');
    await page.click('[data-act="pro-oc-zoom"][data-id="in"]'); await page.waitForTimeout(100);
    ok(/scale\(1\.5/.test(await page.getAttribute(".oc-zoom", "style")), "the editor zooms in");
    await noOverflow(page, "in the editor");
    ok(/Keep 4 Cards/.test(await page.textContent("#ocKeep")), "Keep counts cards, not boxes");
    await page.click("#ocKeep"); await page.waitForTimeout(700);
    let d3 = await deck(page, "d3");
    const m = d3.cards[0] && d3.cards[0].img.m;
    ok(d3.cards.length === 4 && m.length === 5 && d3.cards.every(c => c.img.mode === "tap" && c.img.s && c.img.s === d3.cards[0].img.s), "four cards share one picture set, Tap to Peek");
    ok(m.every(b => b.length >= 4 && b.slice(0, 4).every(v => typeof v === "number")) && m[1][4] === "e" && /^p\d/.test(m[2][4]) && m[0].length === 4, "masks stay [x, y, w, h], with \"e\" or freehand points added as a 5th item");
    ok(m[0][2] > 0.32, "the resized box is saved larger (" + m[0][2] + ")");
    const grp = d3.cards.find(c => c.back === "Cell membrane");
    ok(grp && grp.img.g && grp.img.g.join() === "3,4" && grp.img.i === 3, "the grouped card hides both its masks (g), i is the first");
    ok(await page.evaluate(() => { const d = window.__sbSync.state.decks.d3, c = d.cards.find(x => x.back === "Cell membrane"); return (window.SBPRO.studyCard(d, c, {flipped: false}).match(/class="ci-box me"/g) || []).length; }) === 2, "studying the grouped card covers both parts as one question");

    // Studying: Tap to Peek, Type Answers, keyboard
    await studyDeck(page, "d3");
    ok(await page.locator(".ic-study ellipse").count() === 1 && await page.locator(".ic-study polygon").count() === 1, "the oval and freehand masks are drawn in study");
    const peeks = page.locator('.ic-study [data-act="pro-ic-peek"]');
    ok(await peeks.count() >= 3, "Tap to Peek: the other labels are buttons (" + await peeks.count() + ")");
    ok(await page.evaluate(() => [...document.querySelectorAll('.ic-study [data-act="pro-ic-peek"]')].every(b => /Peek/.test(b.getAttribute("aria-label")))), "covered labels are named for screen readers");
    await peeks.first().focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(150);
    ok(await page.locator('.ic-study [data-act="pro-ic-peek"][aria-pressed="true"]').count() >= 1 && await page.locator(".ic-study.is-back").count() === 0, "Enter on a covered label peeks at it (the card isn't flipped)");
    ok(await page.locator('.ic-study [data-act="pro-ic-peek"][aria-pressed="true"] .ci-tag').count() === 1, "a peeked label shows its answer on the picture");
    await page.click('[data-act="pro-ic-type"]'); await page.waitForTimeout(150);
    ok(await page.locator("#icTypeIn").count() === 1 && await page.evaluate(() => window.__sbSync.state.settings.icType === true), "Type Answers is on, with a box to type in");
    const c2 = await curCard(page);
    await page.fill("#icTypeIn", c2.back.slice(0, -1) + (c2.back.length > 5 ? "" : c2.back.slice(-1))); await page.press("#icTypeIn", "Enter"); await page.waitForTimeout(200);
    ok(await page.locator(".ic-study.is-back").count() === 1 && /Right|Close enough/.test(await page.locator(".ic-verdict").textContent()), "a typed answer is checked, a small slip still counts: " + (await page.locator(".ic-verdict").textContent()));
    ok(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains("good")), "after a right answer, Good is ready to press");
    await page.click(".rate-btn.good"); await page.waitForTimeout(200);
    await page.fill("#icTypeIn", "zzz"); await page.press("#icTypeIn", "Enter"); await page.waitForTimeout(200);
    ok(/Not quite/.test(await page.locator(".ic-verdict").textContent()) && await page.evaluate(() => document.activeElement && document.activeElement.classList.contains("again")), "a wrong answer says so and readies Again");
    await page.click(".rate-btn.again"); await page.waitForTimeout(200);
    await page.click('[data-act="pro-ic-type"]'); await page.waitForTimeout(100);
    await page.click('[data-act="pro-ic-zoom"][data-id="in"]'); await page.waitForTimeout(100);
    ok(/scale\(1\.5/.test(await page.getAttribute(".ic-study .ci-zoom", "style")) && await page.locator(".ic-frame.zoomed").count() === 1, "the study picture zooms in");
    await noOverflow(page, "studying zoomed in");
    await page.click('[data-act="fc-exit"]').catch(() => {}); await page.waitForTimeout(200);

    // Editing a picture's cards later keeps their history
    await page.evaluate(() => { const S = window.__sbSync, d = S.clone(S.state.decks.d3); d.cards.forEach(c => Object.assign(c, {seen: 4, right: 3, wrong: 1, box: 3})); S.applyChanges([{kind: "deck", id: "d3", after: d}], null); });
    const before = await deck(page, "d3");
    const nuc = before.cards.find(c => c.back === "Nucleus"), rib = before.cards.find(c => c.back === "Ribosome");
    await act(page, "fc-open", "d3"); await page.waitForTimeout(200);
    ok(await page.locator('[data-act="pro-dp-open"]').count() === 1, "the deck page offers Practice Diagram");
    await act(page, "pro-cf-open", "d3"); await page.waitForTimeout(400);
    ok(/Pictures in This Deck/.test(await page.textContent("#dlg")) && await page.locator('#dlg .ic-sets [data-act="pro-ic-edit"]').count() === 1, "Image Cards lists the deck's pictures, with Edit");
    await page.click('#dlg .ic-sets [data-act="pro-ic-edit"]'); await page.waitForTimeout(400);
    ok(await page.locator(".oc-stage .oc-box").count() === 5 && await page.locator(".oc-list li").count() === 4 && await page.locator(".oc-stage ellipse").count() === 1, "Edit opens the picture with its boxes, shapes and groups");
    ok(await page.locator('input[name="ocMode"][value="tap"]').isChecked() && (await page.textContent("#ocSkip")).trim() === "Cancel", "the study mode is kept, and the picture can be left unchanged");
    await page.locator('.oc-list input[data-oc-ans="0"]').fill("Cell nucleus");
    await page.click('.oc-list [data-act="pro-oc-del"][data-id="1"]'); await page.waitForTimeout(150);
    await page.locator(".oc-stage").scrollIntoViewIfNeeded(); const st2 = await page.locator(".oc-stage").boundingBox();
    await page.mouse.move(st2.x + st2.width * 0.4, st2.y + st2.height * 0.4); await page.mouse.down(); await page.mouse.move(st2.x + st2.width * 0.55, st2.y + st2.height * 0.5, {steps: 5}); await page.mouse.up(); await page.waitForTimeout(150);
    await page.locator(".oc-list input").last().fill("Vacuole");
    await page.click("#ocKeep"); await page.waitForTimeout(600);
    const after = await deck(page, "d3");
    const nuc2 = after.cards.find(c => c.id === nuc.id);
    ok(nuc2 && nuc2.back === "Cell nucleus" && nuc2.seen === 4 && nuc2.box === 3 && nuc2.right === 3, "an edited label keeps its card and its history");
    ok(!after.cards.some(c => c.id === rib.id) && after.cards.length === 4, "a removed mask's card goes");
    const vac = after.cards.find(c => c.back === "Vacuole");
    ok(vac && !vac.seen && vac.img.s === nuc2.img.s && vac.img.m.length === 5 && after.cards.every(c => c.img.m.length === 5), "a new box is a new card in the same picture, every card has the new masks");
    const cm = after.cards.find(c => c.back === "Cell membrane");
    ok(cm && cm.seen === 4 && cm.img.g.length === 2 && cm.img.g.every(j => j < 4), "the grouped card is still grouped, history kept, its masks renumbered");

    // Diagram Practice
    await act(page, "pro-dp-open", "d3"); await page.waitForTimeout(400);
    ok(await page.locator("#dlg .dp-pin").count() === 4 && await page.locator("#dlg .dp-lab").count() === 4 && /0:0\d/.test(await page.textContent("#dlg .dp-time")), "Diagram Practice shows numbered spots, the labels and a timer");
    ok(!(await page.isChecked("[data-dp-count]")), "Count as a Review is off unless you choose it");
    const labs = await page.$$eval("#dlg .dp-lab", els => els.map(e => e.dataset.dpLab));
    const wrongSpot = await page.$$eval("#dlg .dp-pin", (els, id) => els.find(e => e.dataset.dpSpot !== id).dataset.dpSpot, labs[0]);
    await page.click(`#dlg [data-dp-lab="${labs[0]}"]`); await page.click(`#dlg [data-dp-spot="${wrongSpot}"]`); await page.waitForTimeout(150);
    ok(/Not that spot/.test(await page.textContent("#dlg .dp-msg")) && await page.locator(`#dlg [data-dp-lab="${labs[0]}"][aria-pressed="true"]`).count() === 1, "a wrong spot says so and keeps the label picked");
    await page.click(`#dlg [data-dp-spot="${labs[0]}"]`); await page.waitForTimeout(150);
    ok(/Right/.test(await page.textContent("#dlg .dp-msg")) && await page.locator("#dlg .dp-pin.ok").count() === 1, "the right spot places it");
    await page.click(`#dlg [data-dp-spot="${labs[1]}"]`); await page.click(`#dlg [data-dp-lab="${labs[1]}"]`); await page.waitForTimeout(150);
    const lb = await page.locator(`#dlg [data-dp-lab="${labs[2]}"]`).boundingBox(), sp = await page.locator(`#dlg [data-dp-spot="${labs[2]}"]`).boundingBox();
    await page.mouse.move(lb.x + lb.width / 2, lb.y + lb.height / 2); await page.mouse.down(); await page.mouse.move(sp.x + sp.width / 2, sp.y + sp.height / 2, {steps: 8}); await page.mouse.up(); await page.waitForTimeout(200);
    ok(await page.locator("#dlg .dp-pin.ok").count() === 3, "dragging a label onto its spot places it");
    await noOverflow(page, "in Diagram Practice");
    await page.click(`#dlg [data-dp-lab="${labs[3]}"]`); await page.click(`#dlg [data-dp-spot="${labs[3]}"]`); await page.waitForTimeout(200);
    ok(/All 4 placed in \d+:\d\d/.test(await page.textContent("#dlg .dp-done")) && /3 of 4 right the first time/.test(await page.textContent("#dlg .dp-done")), "a summary: time, and how many were right first time");
    const mid = await deck(page, "d3");
    ok(mid.cards.every(c => c.seen === (after.cards.find(x => x.id === c.id) || {}).seen), "practice didn't change the study schedule");
    await page.check("[data-dp-count]"); await page.waitForTimeout(300);
    const fin = await deck(page, "d3"), missed = fin.cards.find(c => c.id === labs[0]);
    ok(fin.cards.every(c => c.seen === (after.cards.find(x => x.id === c.id) || {}).seen + 1) && missed.box === 0 && fin.cards.filter(c => c.id !== labs[0]).every(c => c.box >= 1), "Count as a Review rates each card: missed ones Again, the rest Good");
    ok(/Counted as a review/.test(await page.textContent("#dlg .dp-done")), "the summary says it was counted");
    await page.click('#dlg [data-act="pro-dp-again"]'); await page.waitForTimeout(150);
    ok(await page.locator("#dlg .dp-pin.ok").count() === 0 && await page.locator("#dlg .dp-lab").count() === 4, "Try Again starts a fresh round");
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);

    // A box you draw takes the page's own text under it
    await page.evaluate(async () => {
      const cv = document.createElement("canvas"); cv.width = 400; cv.height = 300; cv.getContext("2d").fillRect(0, 0, 4, 4);
      const blob = await new Promise(r => cv.toBlob(r, "image/jpeg", 0.9));
      window.SBPRO.openImageEditor("d1", [{blob, w: 400, h: 300, boxes: [], src: "Slide", words: [{x: 0.32, y: 0.1, w: 0.2, h: 0.06, t: "body"}, {x: 0.1, y: 0.1, w: 0.2, h: 0.06, t: "Golgi"}, {x: 0.7, y: 0.7, w: 0.2, h: 0.06, t: "Elsewhere"}]}]);
    });
    await page.waitForTimeout(400);
    await drag([0.05, 0.05], [0.6, 0.22]);
    ok(await page.locator(".oc-list input").last().inputValue() === "Golgi body", "a drawn box is filled in from the PDF's text under it, in reading order");
    await page.click("#ocSkip"); await page.waitForTimeout(300);
    ok((await deck(page, "d1")).cards.length === 2, "skipping the picture adds nothing");
    ok(page.errs.length === 0, "no console errors: " + page.errs.join(" | "));

    // Dark mode renders
    const dk = await page.context().newPage(); await dk.emulateMedia({colorScheme: "dark"}); await dk.goto(base); await dk.waitForTimeout(900);
    await dk.evaluate(() => { const S = window.__sbSync; S.ui.tab = "flashcards"; S.ui.deckId = "d3"; S.render(); });
    await dk.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "fc-study"; b.dataset.id = "d3"; document.body.appendChild(b); b.click(); b.remove(); }); await dk.waitForTimeout(300);
    ok(await dk.evaluate(() => { const b = document.querySelector(".ic-study"); return !!b && getComputedStyle(b).backgroundColor !== "rgb(255, 255, 255)"; }), "dark mode: the image card screen takes the dark surface");
    await dk.close();

    // Free plan: keeps studying, no new extras
    const p3 = await open(await mkCtx(SEED(), true));
    await studyDeck(p3, "d1");
    ok(await p3.locator(".ic-study .ci-box.me").count() === 1 && await p3.locator('[data-act="pro-ic-type"]').count() === 0, "free: image cards you have still study, without Type Answers");
    await p3.click('[data-act="fc-exit"]').catch(() => {}); await p3.waitForTimeout(200);
    await act(p3, "fc-open", "d1"); await p3.waitForTimeout(200);
    ok(await p3.locator('[data-act="pro-dp-open"]').count() === 0, "free: no Practice Diagram button");
    await act(p3, "pro-dp-open", "d1"); await p3.waitForTimeout(400);
    ok(await p3.locator("#dlg .plan-sheet").count() === 1, "free: Diagram Practice opens the Pro sheet");
    ok(p3.errs.length === 0, "no console errors (free): " + p3.errs.join(" | "));
    console.log(`\nimage-cards.e2e: ${n} checks passed`);
  } catch (e) { console.error("FAIL:", e.message); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
