// node tests/study-focus-fixes.e2e.js: the focus timer across tabs and mid-session settings, classic-deck cramming,
// Study and Quiz keys, a stale Undo toast, and the quiz's I Was Right
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let checks = 0; const ok = (c, m) => { checks++; console.log((c ? "ok - " : "FAIL: ") + m); if (!c) process.exitCode = 1; };
const iso = d => new Date(Date.now() + d * 864e5 - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const card = (id, o) => Object.assign({id, front: "Front " + id, back: "Back " + id, box: 0, due: "", seen: 0, right: 0, wrong: 0}, o);
const SEED = {v: 2, updated: 1, tasks: [], files: [], notes: [], events: [], settings: {},
  courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}],
  decks: [
    {id: "dEarly", name: "Crammed", courseId: "c1", created: 1, sched: "classic", cards: [card("e1", {seen: 3, box: 2, due: iso(5), last: iso(-2)})]},
    {id: "dDue", name: "Due Deck", courseId: "c1", created: 2, sched: "classic", cards: [card("u1", {seen: 3, box: 2, due: iso(-1), last: iso(-4)})]},
    {id: "dBig", name: "Big Deck", courseId: "c1", created: 3, sched: "classic", cards: Array.from({length: 61}, (_, i) => card("b" + i, {seen: 1, box: 1, due: iso(3)}))},
    {id: "dEmpty", name: "Empty Deck", courseId: "c1", created: 4, cards: []}]};
const seed = s => {
  window.__SB_TEST = true;
  localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1");
  if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(s));
};
async function open(ctx){
  const p = await ctx.newPage(); p.errs = []; p.on("pageerror", e => p.errs.push(e.message));
  await p.goto("http://127.0.0.1:" + server.address().port + "/index.html");
  await p.waitForFunction(() => window.__sbSync && window.__sbPomo && document.readyState === "complete", null, {timeout: 20000});
  await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
  return p;
}
const act = (p, a, id) => p.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || ""]);
const P = p => p.evaluate(() => JSON.parse(JSON.stringify(window.__sbPomo.pomo)));
const stored = () => JSON.parse(localStorage.getItem("studioso:pomo"));
const cardOf = (p, deck, id) => p.evaluate(([d, id]) => JSON.parse(JSON.stringify(window.__sbSync.state.decks[d].cards.find(c => c.id === id))), [deck, id]);
const fc = p => p.evaluate(() => { const f = window.__sbSync.ui.fc; return f ? {mode: f.mode, i: f.i, flipped: f.flipped, note: f.note, n: f.q ? f.q.length : 0} : null; });
const studyDeck = async (p, id) => { await p.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); document.activeElement && document.activeElement.blur(); }); await act(p, "fc-study", id); await p.waitForTimeout(150); };

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, serviceWorkers: "block", locale: "en-US"});
  await ctx.addInitScript(seed, SEED);
  try {
    /* S1: two tabs share one timer, and only one finishes a session */
    const a = await open(ctx), b = await open(ctx);
    await act(a, "pomo-start"); await a.waitForTimeout(300);
    const pa = await P(a), pb = await P(b);
    ok(pa.running && pb.running && pa.endAt === pb.endAt, "a timer started in one tab runs in the other too");
    await act(b, "pomo-pause"); await b.waitForTimeout(300);
    ok(!(await P(a)).running && (await P(a)).left > 0, "pausing in the other tab pauses it here");
    await act(a, "pomo-start"); await a.waitForTimeout(300);
    ok((await P(b)).running, "resuming in one tab resumes it in the other");
    const before = await a.evaluate(stored);
    await a.evaluate(() => { const p = window.__sbPomo.pomo; p.endAt = Date.now() + 1200; window.__sbPomo.save(); });
    // the other tab picks up the new end through the storage event; both now race to finish
    await b.waitForFunction(e => window.__sbPomo.pomo.endAt === e, (await P(a)).endAt);
    await a.waitForTimeout(2500);
    const after = await a.evaluate(stored);
    const rang = (await a.evaluate(() => document.getElementById("alarmDlg").open ? 1 : 0)) + (await b.evaluate(() => document.getElementById("alarmDlg").open ? 1 : 0));
    ok(after.sessions === (before.sessions || 0) + 1, `the session is credited once: ${before.sessions || 0} -> ${after.sessions}`);
    ok(after.minutes === (before.minutes || 0) + 25, `with its 25 minutes once: ${before.minutes || 0} -> ${after.minutes}`);
    ok(rang === 1, "only one tab rings: " + rang);
    const fa = await P(a), fb = await P(b);
    ok(fa.mode === fb.mode && fa.mode === "short" && fa.running === fb.running, "both tabs move on to the break together");
    await a.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close())); await b.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await b.close();

    /* S4: a new timer length applies to the next session, not the one under way */
    await act(a, "pomo-mode", "focus"); await a.waitForTimeout(150);
    await act(a, "pomo-start"); await a.waitForTimeout(200);
    ok((await P(a)).len === 25 * 60000, "starting keeps the session's own length (25 minutes)");
    await a.evaluate(() => { const S = window.__sbSync; S.state.settings = Object.assign({}, S.state.settings, {pomo: Object.assign({}, S.state.settings.pomo, {focus: 50})}); S.saveSettings(); });
    const m0 = (await a.evaluate(stored)).minutes;
    await a.evaluate(() => { const p = window.__sbPomo.pomo; p.endAt = Date.now() - 10; window.__sbPomo.finish(); });
    await a.waitForTimeout(200);
    ok((await a.evaluate(stored)).minutes === m0 + 25, "changing the length to 50 mid-session still credits the 25 it ran: " + ((await a.evaluate(stored)).minutes - m0));
    await a.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await act(a, "pomo-mode", "focus"); await a.waitForTimeout(150);
    await act(a, "pomo-open"); await a.waitForTimeout(150);
    ok(await a.evaluate(() => document.querySelector("#pomoDlg .pomo-time").textContent.trim()) === "50:00", "the next session uses the new 50 minutes");
    await a.evaluate(() => document.getElementById("pomoDlg").close());
    ok(await a.evaluate(() => { const ad = document.getElementById("alarmDlg"); return typeof ad.oncancel === "function"; }), "the alarm's Esc handler is set once, not stacked");
    await act(a, "pomo-reset");

    /* B15: the empty deck says where Paste Cards is, and Click on a computer */
    await a.evaluate(() => { const S = window.__sbSync; S.ui.tab = "flashcards"; S.ui.fc = null; S.ui.deckId = "dEmpty"; S.render(); });
    const empty = await a.evaluate(() => document.querySelector("#view .empty").textContent);
    ok(/Click Add Card/.test(empty) && /More, then Paste Cards/.test(empty), "empty deck text: " + empty);

    /* B7: an Undo toast from the deck page doesn't follow into Study */
    await a.evaluate(() => { const S = window.__sbSync, d = JSON.parse(JSON.stringify(S.state.decks.dEarly)); d.updated = Date.now(); S.applyChanges([{kind: "deck", id: d.id, after: d}], "Card added"); });
    ok(await a.evaluate(() => document.getElementById("toast").classList.contains("show") && !document.getElementById("toastUndo").hidden), "a Card added toast with Undo is showing");
    await studyDeck(a, "dEarly");
    ok(await a.evaluate(() => !document.getElementById("toast").classList.contains("show")), "starting a study session puts the Undo toast away");

    /* S2: cramming a classic deck doesn't raise a card's level */
    let f = await fc(a);
    ok(f && f.mode === "study" && /reviewing every card/.test(f.note), "nothing due: reviewing every card");
    await a.keyboard.press("Space"); await a.waitForTimeout(100);
    ok((await fc(a)).flipped, "Space flips the card");
    const lbl = await a.evaluate(() => document.querySelector(".rate-btn.good span").textContent);
    ok(lbl === "3 days", "Good's label shows the same level's gap: " + lbl);
    await a.keyboard.press("3"); await a.waitForTimeout(150);
    let e1 = await cardOf(a, "dEarly", "e1");
    ok(e1.box === 2 && e1.seen === 4 && e1.right === 1, "Good on a card that isn't due keeps its level: box " + e1.box);
    await studyDeck(a, "dDue"); await a.keyboard.press("Space"); await a.keyboard.press("3"); await a.waitForTimeout(150);
    const u1 = await cardOf(a, "dDue", "u1");
    ok(u1.box === 3 && u1.due === iso(7), "Good on a due card still moves it up a level: box " + u1.box + ", due " + u1.due);

    /* S10: a capped session says how many it holds */
    await studyDeck(a, "dBig");
    f = await fc(a);
    ok(f.n === 60 && /reviewing 60 of your cards/.test(f.note), "61 cards, none due: " + f.note);

    /* S3 + S9: keys on focused buttons and with modifiers */
    await studyDeck(a, "dEarly");
    await a.keyboard.press("Space"); await a.waitForTimeout(80);
    await a.keyboard.press("Control+1"); await a.waitForTimeout(80);
    ok((await fc(a)).i === 0, "Ctrl+1 doesn't rate the card");
    await a.keyboard.press("Alt+3"); await a.waitForTimeout(80);
    ok((await fc(a)).i === 0, "Alt+3 doesn't rate the card");
    // (Alt + a number is the app's own shortcut for switching pages, so come back to the card)
    await studyDeck(a, "dEarly"); await a.keyboard.press("Space"); await a.waitForTimeout(80);
    await a.focus('[data-act="fc-rate"][data-id="hard"]'); await a.keyboard.press("Enter"); await a.waitForTimeout(150);
    e1 = await cardOf(a, "dEarly", "e1");
    ok(e1.rate === "hard", "Enter on a focused rating button presses that button");
    await studyDeck(a, "dEarly");
    await a.focus('.view-head [data-act="fc-exit"]'); await a.keyboard.press("Enter"); await a.waitForTimeout(150);
    ok(!(await fc(a)), "Enter on End Session ends the session instead of flipping the card");
    await studyDeck(a, "dEarly");
    await a.focus('[data-act="fc-flip"]'); await a.keyboard.press("Enter"); await a.waitForTimeout(100);
    ok((await fc(a)).flipped, "Enter on the card itself still flips it");

    /* S6: I Was Right puts the card back where it was */
    const u0 = await cardOf(a, "dDue", "u1");
    await a.evaluate(() => { const S = window.__sbSync; S.ui.tab = "flashcards"; S.ui.fc = {mode: "quiz", deckIds: ["dDue"], qs: [{type: "written", deckId: "dDue", cardId: "u1", prompt: "Front u1", answer: "Back u1", fwd: true}], i: 0, ans: []}; S.render(); });
    await a.fill("#qWritten", "something else entirely"); await a.press("#qWritten", "Enter");
    await a.waitForSelector('[data-act="fc-override"]', {timeout: 8000});
    const dropped = await cardOf(a, "dDue", "u1");
    ok(dropped.box === u0.box - 1 && dropped.due === iso(0), "a wrong answer drops the card a level and makes it due");
    await a.click('[data-act="fc-override"]'); await a.waitForTimeout(150);
    const back = await cardOf(a, "dDue", "u1");
    ok(back.box === u0.box && back.due === u0.due && back.wrong === u0.wrong && back.right === u0.right + 1, `I Was Right restores its level and date: box ${back.box}, due ${back.due}`);

    ok(!a.errs.length, "no page errors: " + a.errs.join(" | "));
  } catch (e) { console.log("FAIL:", e); process.exitCode = 1; }
  await browser.close(); server.close();
  console.log(`study-focus-fixes.e2e: ${checks} checks ${process.exitCode ? "FAILED" : "passed"}`);
})();
