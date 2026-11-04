// node tests/ask-stale.e2e.js
// Ask With AI: an answer that arrives after Search was closed, or after another request, still shows (never stuck on "writing")
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
// A two-page PDF reading for BIO101 (page 2 has the stroma)
function textPdf(){
  const page = lines => lines.map((l, i) => `BT /F1 14 Tf 72 ${700 - i * 24} Td (${l}) Tj ET`).join("\n");
  const c1 = page(["Chapter 6: Photosynthesis", "Plants make sugar from carbon dioxide and water."]);
  const c2 = page(["Chapter 6, continued", "The Calvin cycle runs in the stroma of the chloroplast.", "It uses ATP and NADPH."]);
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 6 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 7 0 R >>",
    `<< /Length ${c1.length} >>\nstream\n${c1}\nendstream`, `<< /Length ${c2.length} >>\nstream\n${c2}\nendstream`];
  let out = "%PDF-1.4\n"; const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length; out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("") + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return [...Buffer.from(out, "latin1")];
}
function SEED(){
  return {v: 2, updated: 1, settings: {search: {meaning: false}},
    courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}, {id: "c2", name: "Chemistry", code: "CHEM200", color: "#E0563B"}],
    notes: [
      {id: "n1", text: "Photosynthesis\nChlorophyll in the thylakoid membranes absorbs light to make ATP.", color: "yellow", x: 40, y: 40, z: 1, courseId: "c1"},
      {id: "n2", text: "Photochemistry\nIn photochemistry, light splits water molecules apart.", color: "blue", x: 320, y: 40, z: 2, courseId: "c2"}],
    decks: [{id: "d1", name: "Cell Biology", courseId: "c1", created: 1, cards: [{id: "k1", front: "What absorbs light in photosynthesis?", back: "Chlorophyll", box: 0, due: "", seen: 0, right: 0, wrong: 0}]}],
    tasks: [{id: "t1", title: "Photosynthesis lab report", courseId: "c1", type: "Lab", due: day(5), start: day(1), status: "todo", priority: "med", created: 5}],
    files: [
      {id: "f3", name: "Lecture 3 Photosynthesis", courseId: "c1", folderId: "lectures", kind: "file", taskIds: [], desc: "", url: "", dur: 3000,
        tr: {text: "Today we saw how light hits chlorophyll in the thylakoid. Then the Calvin cycle fixes carbon into sugar.", by: "ai", at: 1},
        revs: [{assetId: "local:a-lec3", name: "Lecture 3.webm", size: 900000, type: "audio/webm", at: 1}]},
      {id: "f9", name: "Photosynthesis Reading.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: [], desc: "", url: "",
        revs: [{assetId: "a-ps", name: "Photosynthesis Reading.pdf", size: 1200, type: "application/pdf", at: 1}]}]};
}
// Every string in a request body, joined (the prompt, the system text and the sources)
const textOf = body => { try { const out = []; const walk = v => { if (typeof v === "string") out.push(v); else if (v && typeof v === "object") Object.values(v).forEach(walk); }; walk(JSON.parse(body)); return out.join("\n"); } catch (e) { return String(body || ""); } };
// The number of the first numbered source whose block matches re
const srcNum = (t, re) => { for (const p of t.split(/\n(?=\[\d+\] )/)) { const m = /^\[(\d+)\] /.exec(p); if (m && re.test(p)) return Number(m[1]); } return 0; };
function reply(ctx, t){
  if (/You answer questions for a student inside their own planner app/.test(t)) {
    const q = (/QUESTION: ([^\n]*)/.exec(t) || [])[1] || "";
    ctx.asks.push({q, t});
    if (/light get absorbed/.test(q)) { const a = srcNum(t, /Sticky note: Photosynthesis/), b = srcNum(t, /^\[\d+\] Lecture: /); return {answer: `Chlorophyll in the thylakoid membranes absorbs light [${a}]. Your lecture covered it too [${b}].`, sources: [a, b], found: true, followUps: ["What does the Calvin cycle do?", "Where is chlorophyll found?"]}; }
    if (/more simply/.test(q)) { const a = srcNum(t, /Sticky note: Photosynthesis/); return {answer: `Plants catch light with a green pigment [${a}].`, sources: [a], found: true, followUps: []}; }
    if (/Krebs/.test(q)) return {answer: "Your notes don't mention the Krebs cycle.", sources: [], found: false, followUps: []};
    if (/splits water/.test(q)) { const a = srcNum(t, /Photochemistry/); return {answer: `Light splits water molecules [${a}].`, sources: [a], found: true, followUps: []}; }
    if (/stroma|Calvin cycle run/.test(q)) { const a = srcNum(t, /stroma/); return {answer: `In the stroma of the chloroplast [${a}].`, sources: [a], found: true, followUps: []}; }
    return {answer: "Not sure.", sources: [], found: false};
  }
  if (/from general knowledge, because their own course material/.test(t)) { ctx.gens.push(t); return {answer: "The Krebs cycle breaks down acetyl-CoA in the mitochondria to release energy."}; }
  if (/check a student's short answer/.test(t)) { ctx.judges.push(t); return {correct: true, feedback: "Yes, that green pigment is chlorophyll [1]."}; }
  if (/You write excellent flashcards/.test(t)) { ctx.cards.push(t); return {deckTitle: "Light Absorption", cards: [{front: "Where is chlorophyll found?", back: "In the thylakoid membranes", source: "[1]"}, {front: "What does chlorophyll absorb?", back: "Light", source: "[1]"}]}; }
  if (/You write high-quality practice exam questions/.test(t)) { ctx.quizzes.push(t); return {title: "Light", questions: [
    {type: "single", stem: "Where does chlorophyll absorb light?", options: ["Thylakoid membranes", "Nucleus", "Ribosome", "Cell wall"], correct: [0], rationale: "Chlorophyll sits in the thylakoid membranes [1].", source: "[1]"},
    {type: "short", stem: "What pigment absorbs light?", answer: "Chlorophyll", rationale: "Chlorophyll is the pigment [1].", source: "[1]"},
    {type: "truefalse", stem: "The Calvin cycle takes place inside the nucleus.", options: ["True", "False"], correct: [1], rationale: "It runs in the chloroplast, not the nucleus [1].", source: "[1]"}]}; }
  return {answer: "?", found: false};
}
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mkCtx = async (free, viewport) => {
    const ctx = await browser.newContext({viewport: viewport || {width: 1200, height: 900}, serviceWorkers: "block"});
    Object.assign(ctx, {asks: [], gens: [], judges: [], cards: [], quizzes: []});
    await ctx.route(/generativelanguage\.googleapis\.com/, route => {
      const t = textOf(route.request().postData() || "");
      setTimeout(() => route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(reply(ctx, t))}]}, finishReason: "STOP"}]})}), ctx.delay || 0);
    });
    await ctx.addInitScript(([seed, free, pdf]) => {
      try {
        if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); }
        localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}}));
        localStorage.setItem("studyboard:search:debug", "1");
        if (free) localStorage.setItem("studyboard:paywall-test", "1");
      } catch (e) {}
      window.__sxBytes = async assetId => assetId === "a-ps" ? new Uint8Array(pdf) : null;
    }, [SEED(), !!free, textPdf()]);
    return ctx;
  };
  const openPage = async ctx => {
    const page = await ctx.newPage(); page.errs = [];
    page.on("pageerror", e => page.errs.push(e.message));
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"});
    await page.waitForFunction(() => window.__sbProStudy && window.__sxDebug);
    await page.waitForTimeout(600);
    return page;
  };
  const H = page => page.evaluate(() => { const T = window.__sbProStudy; return {tab: T.ui.tab, notes: Object.values(T.state().notes), decks: T.state().decks}; });
  const closeAll = page => page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); });
  const ask = async (page, q) => { await page.fill("#sxQ", q); await page.press("#sxQ", "Enter"); };
  const answered = (page, k) => page.waitForFunction(k => { const S = window.__sxDebug.S; return S.ask && S.ask.answer && S.ask.answer.state === "done" && S.thread.length >= k; }, k, {timeout: 15000});
  const openSearch = page => page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "search"; document.body.appendChild(b); b.click(); b.remove(); });

  const state = page => page.evaluate(() => { const S = window.__sxDebug.S; return {q: S.ask && S.ask.q, inp: document.getElementById("sxQ").value, mode: S.mode, n: S.thread.length, an: S.ask && S.ask.answer && S.ask.answer.state, busy: !!document.querySelector("#sxAnswer .sx-ans.busy"), text: ([...document.querySelectorAll("#sxAnswer .sx-ans-t")].pop() || {}).textContent || ""}; });
  const ctx = await mkCtx(false); ctx.delay = 2500; const page = await openPage(ctx);
  await openSearch(page); await page.waitForSelector("#sxDlg[open]");
  await page.click('#sxDlg [data-sx="mode"][data-id="ask"]');
  await ask(page, "How does light get absorbed in photosynthesis?");
  await page.waitForFunction(() => document.querySelector("#sxAnswer .sx-ans.busy"), null, {timeout: 10000});
  // close Search while the AI is writing, then open it again
  await page.keyboard.press("Escape"); await page.waitForTimeout(150);
  if (await page.$("#sxDlg[open]")) await page.keyboard.press("Escape");
  await page.waitForSelector("#sxDlg[open]", {state: "detached"}).catch(() => {});
  await page.waitForTimeout(3200);
  await openSearch(page); await page.waitForSelector("#sxDlg[open]");
  await page.click('#sxDlg [data-sx="mode"][data-id="ask"]').catch(() => {});
  await page.waitForTimeout(300);
  let st = await state(page);
  ok(st.an === "done" && !st.busy && /Chlorophyll/.test(st.text), "an answer that came while Search was closed shows when it's opened again (" + JSON.stringify(st) + ")");
  // a second question while the first is still being answered: the screen ends on the second answer, not "writing"
  await ask(page, "Where does the Calvin cycle run?");
  await page.waitForTimeout(400);
  await ask(page, "What splits water with light?");
  await page.waitForTimeout(6000);
  st = await state(page);
  ok(st.an === "done" && !st.busy && st.q === "What splits water with light?" && /splits water/.test(st.text), "after asking again mid-answer, the latest answer shows (" + JSON.stringify(st) + ")");
  ok(!page.errs.length, "no page errors: " + page.errs.join("; "));
  console.log(`ask-stale: ${n} checks passed`);
  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
