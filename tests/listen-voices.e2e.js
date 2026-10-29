// node tests/listen-voices.e2e.js
// Listen's voice picker with stubbed device voices: the best voice is picked automatically, listed first with a label,
// the student's own choice wins, and a tip shows how to get better voices when only basic ones exist.
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
const v = (name, lang, extra) => Object.assign({name, lang, voiceURI: "uri:" + name, localService: true, default: false}, extra || {});
const EDGE = [v("Microsoft David - English (United States)", "en-US", {default: true}), v("Microsoft Zira - English (United States)", "en-US"),
  v("Microsoft Aria Online (Natural) - English (United States)", "en-US"), v("Microsoft Guy Online (Natural) - English (United States)", "en-US"),
  v("Microsoft Sonia Online (Natural) - English (United Kingdom)", "en-GB"), v("Microsoft Katja Online (Natural) - German (Germany)", "de-DE")];
const MAC_BASIC = [v("Fred", "en-US"), v("Bad News", "en-US"), v("Samantha", "en-US", {default: true}), v("Daniel", "en-GB"), v("Thomas", "fr-FR")];
const MAC_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const SEED = {v: 2, updated: 1, notes: [], tasks: [], files: [], settings: {capacity: 15}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}],
  decks: [{id: "d1", name: "Cell Biology", courseId: "c1", created: 1, quizzes: [], cards: [
    {id: "k1", front: "ATP", back: "Energy currency of the cell", box: 0, due: "", seen: 0, right: 0, wrong: 0},
    {id: "k2", front: "Ribosome", back: "Makes proteins", box: 0, due: "", seen: 0, right: 0, wrong: 0},
    {id: "k3", front: "Mitochondria", back: "Where cellular respiration happens", box: 0, due: "", seen: 0, right: 0, wrong: 0}]}]};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const open = async (voices, o) => {
    o = o || {};
    const ctx = await browser.newContext(Object.assign({viewport: o.phone ? {width: 390, height: 844} : {width: 1280, height: 900}, serviceWorkers: "block", locale: "en-US"}, o.ua ? {userAgent: o.ua} : {}));
    await ctx.addInitScript(([seed, voices]) => {
      window.__SB_TEST = true;
      try {
        if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); }
      } catch (e) {}
      window.__said = [];
      const fake = {speaking: false, pending: false, paused: false, cancel(){}, pause(){}, resume(){}, getVoices: () => voices.slice(),
        speak(u){ window.__said.push({text: u.text, voice: u.voice ? u.voice.name : "", lang: u.lang || ""}); setTimeout(() => u.onend && u.onend(), 5); }};
      Object.defineProperty(window, "speechSynthesis", {value: fake, configurable: true});
      window.SpeechSynthesisUtterance = function(t){ this.text = t; };
    }, [SEED, voices]);
    const page = await ctx.newPage(); page.errs = [];
    page.on("pageerror", e => page.errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) page.errs.push(m.text()); });
    await page.goto(base); await page.waitForFunction(() => window.__sbSync); await page.waitForTimeout(500);
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "ls-open"; b.dataset.id = "d1"; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForSelector(".ls-body select[data-ls=voice]");
    return page;
  };
  const opts = page => page.evaluate(() => [...document.querySelectorAll(".ls-body select[data-ls=voice] option")].map(o => ({text: o.textContent, value: o.value, group: o.parentNode.tagName === "OPTGROUP" ? o.parentNode.label : ""})));
  const fits = page => page.evaluate(() => { const d = document.getElementById("dlg"); return {dlg: d.scrollWidth - d.clientWidth, page: document.documentElement.scrollWidth - innerWidth}; });
  try {
    /* Edge on Windows */
    let page = await open(EDGE);
    let o = await opts(page);
    ok(o[0].value === "" && o[0].text === "Automatic (Microsoft Aria Online (Natural) - English (United States))", "Automatic names the best voice: " + o[0].text);
    ok(/Aria Online \(Natural\).*· Natural$/.test(o[1].text) && /Guy Online \(Natural\).*· Natural$/.test(o[2].text), "Natural voices are listed first, labelled: " + o.slice(1, 3).map(x => x.text).join(" | "));
    ok(/Sonia/.test(o[3].text) && /David/.test(o[4].text) && !/·/.test(o[4].text), "then other English Natural voices, then the basic ones, unlabelled");
    ok(o.find(x => /Katja/.test(x.text)).group === "Other languages", "other languages stay in their own group");
    ok(await page.locator(".ls-vtip").count() === 0, "no tip when good voices exist");
    await page.click('[data-act="ls-play"]'); await page.waitForTimeout(300);
    let said = await page.evaluate(() => window.__said.slice());
    ok(said[0] && said[0].text === "ATP" && said[0].voice === "Microsoft Aria Online (Natural) - English (United States)" && said[0].lang === "en-US", "with no choice made it reads with the Natural voice: " + JSON.stringify(said[0]));
    await page.click('[data-act="ls-play"]');
    await page.selectOption(".ls-body select[data-ls=voice]", "uri:Microsoft David - English (United States)"); await page.waitForTimeout(300);
    ok(await page.evaluate(() => JSON.parse(localStorage.getItem("studyboard:listen")).voice === "uri:Microsoft David - English (United States)"), "choosing a voice saves it");
    said = await page.evaluate(() => window.__said.slice());
    ok(said[said.length - 1].voice === "Microsoft David - English (United States)", "and the student's own choice wins (the sample is read with it)");
    ok(await page.evaluate(() => document.querySelector(".ls-body select[data-ls=voice]").value) === "uri:Microsoft David - English (United States)", "the picker shows the choice");
    await page.selectOption(".ls-body select[data-ls=voice]", ""); await page.waitForTimeout(200);
    await page.evaluate(() => { window.__said = []; }); await page.click('[data-act="ls-play"]'); await page.waitForTimeout(300);
    said = await page.evaluate(() => window.__said.slice());
    ok(said[0] && /Aria/.test(said[0].voice), "back on Automatic, the best voice again");
    ok(page.errs.length === 0, "no console errors: " + page.errs.join(" | "));
    await page.context().close();

    /* A Mac with only basic voices: Samantha, never Fred, and a tip */
    page = await open(MAC_BASIC, {ua: MAC_UA});
    o = await opts(page);
    ok(o[0].text === "Automatic (Samantha)" && /^Samantha/.test(o[1].text) && o.findIndex(x => /^Fred/.test(x.text)) > o.findIndex(x => /^Daniel/.test(x.text)), "Samantha first, the novelty voices last: " + o.map(x => x.text).join(" | "));
    ok(/Enhanced or Premium voice in Settings, Accessibility, Spoken Content/.test(await page.textContent(".ls-vtip")), "a Mac or iPhone is told where to download a better voice");
    await page.click('[data-act="ls-play"]'); await page.waitForTimeout(300);
    ok((await page.evaluate(() => window.__said[0].voice)) === "Samantha", "it reads with Samantha");
    ok(page.errs.length === 0, "no console errors (Mac): " + page.errs.join(" | "));
    await page.context().close();

    /* A phone */
    page = await open(EDGE, {phone: true});
    const f = await fits(page);
    ok(f.dlg <= 1 && f.page <= 0, "at 390px Listen fits with long voice names: " + JSON.stringify(f));
    ok(page.errs.length === 0, "no console errors (phone): " + page.errs.join(" | "));
    await page.context().close();
  } finally { await browser.close(); server.close(); }
  console.log(`listen-voices.e2e.js: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
