// node tests/cards-from-link.e2e.js
// Cards From a Link: a YouTube video (Gemini file_data) or a web page (url context / web fetch) becomes draft cards through the usual
// review step and a summary note that credits the source. Gemini and Claude are mocked.
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

const VIDEO_NOTES = {status: "ok", title: "Osmosis and Tonicity: Crash Course Biology #27",
  overview: "The video explains how water crosses cell membranes by osmosis and how the solute concentration outside a cell decides whether it swells, shrinks or stays the same.",
  sections: [{heading: "Osmosis", points: ["Osmosis is the passive movement of water across a selectively permeable membrane", "Water moves toward the side where solute is more concentrated", "No ATP is used because water moves down its own gradient"]},
    {heading: "Tonicity", points: ["A hypertonic surrounding draws water out, so an animal cell shrivels (crenation)", "A hypotonic surrounding lets water flood in, so a red blood cell can burst (lysis)", "Plant cells in hypotonic water become turgid because the cell wall stops them bursting"]},
    {heading: "Aquaporins", points: ["Aquaporins are channel proteins that let water cross much faster than through the bilayer alone"]}],
  terms: [{term: "Osmosis", definition: "The passive movement of water across a selectively permeable membrane toward more solute"}, {term: "Hypertonic", definition: "Having a higher solute concentration than the cell"}, {term: "Lysis", definition: "A cell bursting after taking in too much water"}]};
const PAGE_NOTES = {status: "ok", title: "Active transport | Khan Academy",
  overview: "The article describes how cells move substances against their concentration gradients using energy, with the sodium potassium pump as the main example.",
  sections: [{heading: "Primary active transport", points: ["Primary active transport uses ATP directly to move ions against their gradient", "The sodium potassium pump moves three sodium ions out and two potassium ions in per ATP"]},
    {heading: "Secondary active transport", points: ["Secondary active transport uses an existing ion gradient instead of ATP", "Symporters move two substances the same way; antiporters move them in opposite directions"]}],
  terms: [{term: "Antiporter", definition: "A carrier protein that moves two substances in opposite directions"}]};
const CARDS = {deckTitle: "Osmosis and Tonicity", cards: [
  {front: "What is osmosis?", back: "Water passively crossing a selectively permeable membrane toward more solute.", source: "Osmosis"},
  {front: "Which way does water move in osmosis?", back: "Toward the side with the higher solute concentration.", source: "Osmosis"},
  {front: "What happens to an animal cell in a hypertonic surrounding?", back: "It loses water and shrivels (crenation).", source: "Tonicity"},
  {front: "What is lysis?", back: "A cell bursting after taking in too much water.", source: "Key Terms"},
  {front: "What do aquaporins do?", back: "They are channel proteins that let water cross the membrane much faster.", source: "Aquaporins"}]};
const PAGE_CARDS = {deckTitle: "Active Transport", cards: [
  {front: "What does primary active transport use?", back: "ATP, directly.", source: "Primary active transport"},
  {front: "What does the sodium potassium pump move per ATP?", back: "Three sodium ions out and two potassium ions in.", source: "Primary active transport"},
  {front: "What is an antiporter?", back: "A carrier protein moving two substances in opposite directions.", source: "Key Terms"}]};
const TRANSCRIPT = `Hi, I'm Hank and this is Crash Course Biology. Today: osmosis. Imagine a membrane that lets water through but not salt. Water is going to move toward wherever the salt is more concentrated, and it does that without the cell spending any ATP.
If you drop a red blood cell into pure water, water floods in and the cell can actually burst. Biologists call that lysis. Put the same cell in very salty water and it shrivels up, which is called crenation. Plant cells have a wall, so in fresh water they just get firm, or turgid.
Water does sneak through the lipid bilayer a little, but most of it goes through special channel proteins called aquaporins, which are way faster.`;
const SEED = {v: 2, updated: 1, tasks: [], files: [], notes: [], settings: {capacity: 15}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}, {id: "c2", name: "Chemistry", code: "CHEM110", color: "#E07A3B"}],
  decks: [{id: "d1", name: "BIO101 Membranes", courseId: "c1", created: 1, quizzes: [], cards: [{id: "k1", front: "Bilayer", back: "Two layers of phospholipids", box: 0, due: "", seen: 0, right: 0, wrong: 0}]}]};
const gem = (text, extra) => ({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [Object.assign({content: {parts: [{text}]}, finishReason: "STOP"}, extra || {})]})});
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mkPage = async o => {
    o = o || {};
    const ctx = await browser.newContext({viewport: o.phone ? {width: 390, height: 844} : {width: 1280, height: 900}, serviceWorkers: "block"});
    ctx.gem = []; ctx.claude = [];
    await ctx.route(/generativelanguage\.googleapis\.com/, route => {
      const body = route.request().postData() || ""; ctx.gem.push(body);
      if (/BOOMBOOMBOO/.test(body)) { route.fulfill({status: 400, contentType: "application/json", body: JSON.stringify({error: {code: 400, message: "Request contains an invalid argument.", status: "INVALID_ARGUMENT"}})}); return; }
      if (/LongLongLon/.test(body)) { route.fulfill({status: 400, contentType: "application/json", body: JSON.stringify({error: {code: 400, message: "The input token count (2210000) exceeds the maximum number of tokens allowed (1048576).", status: "INVALID_ARGUMENT"}})}); return; }
      if (/file_uri/.test(body)) { route.fulfill(gem(JSON.stringify(VIDEO_NOTES))); return; }
      if (/url_context/.test(body)) {
        const pay = /paywalled/.test(body), url = (/(https:\/\/[^\s"\\]+)/.exec(body.split("web page at ")[1] || "") || [])[1] || "";
        route.fulfill(gem(pay ? "```json\n" + JSON.stringify({status: "ok", title: "Subscribe to read", overview: "Made-up content the model should not have written about membranes.", sections: [{heading: "x", points: ["A long made up point about membrane transport that was never on the page at all."]}]}) + "\n```" : "Here are the notes:\n```json\n" + JSON.stringify(PAGE_NOTES) + "\n```",
          {urlContextMetadata: {urlMetadata: [{retrievedUrl: url, urlRetrievalStatus: pay ? "URL_RETRIEVAL_STATUS_PAYWALL" : "URL_RETRIEVAL_STATUS_SUCCESS"}]}}));
        return;
      }
      if (/write excellent flashcards/.test(body)) { route.fulfill(gem(JSON.stringify(/Study notes on .Active transport/.test(body) ? PAGE_CARDS : CARDS))); return; }
      route.fulfill(gem("{}"));
    });
    await ctx.route(/api\.anthropic\.com/, route => {
      const req = route.request(), body = JSON.parse(req.postData() || "{}"); ctx.claude.push({body, headers: req.headers()});
      const sys = String(body.system || "");
      let content;
      if (/write excellent flashcards/.test(sys)) content = [{type: "tool_use", id: "t1", name: "answer", input: /Active transport/.test(JSON.stringify(body.messages)) ? PAGE_CARDS : CARDS}];
      else if ((body.tools || []).some(t => t.type === "web_fetch_20250910")) content = [{type: "server_tool_use", id: "s1", name: "web_fetch", input: {url: "https://www.khanacademy.org/science/biology/membranes/active-transport"}},
        {type: "web_fetch_tool_result", tool_use_id: "s1", content: {type: "web_fetch_result", url: "https://www.khanacademy.org/science/biology/membranes/active-transport", content: {type: "document", source: {type: "text", media_type: "text/plain", data: "..."}}}},
        {type: "text", text: JSON.stringify(PAGE_NOTES)}];
      else content = [{type: "tool_use", id: "t2", name: "answer", input: VIDEO_NOTES}];
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({content, stop_reason: "end_turn"})});
    });
    await ctx.addInitScript(([seed, o]) => {
      window.__SB_TEST = true;
      try {
        if (!localStorage.getItem("coursework:v2")) {
          const s = JSON.parse(JSON.stringify(seed)); if (o.claude) s.settings.ai = {provider: "anthropic", model: "claude-sonnet-5"};
          localStorage.setItem("coursework:v2", JSON.stringify(s)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
          localStorage.setItem("studyboard:aiKeys", JSON.stringify(o.claude ? {anthropic: "sk-ant-TESTTESTTESTTESTTEST"} : {gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"}));
          localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}, anthropic: {v: 1, at: 1}}));
          if (o.free) localStorage.setItem("studyboard:paywall-test", "1");
        }
      } catch (e) {}
    }, [SEED, o]);
    const page = await ctx.newPage(); page.errs = [];
    page.on("pageerror", e => page.errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) page.errs.push(m.text()); });
    page.on("dialog", d => { page.errs.push("native dialog: " + d.message()); d.dismiss().catch(() => {}); });
    await page.goto(base); await page.waitForFunction(() => window.__sbSync && window.SBLINKCARDS); await page.waitForTimeout(500);
    return page;
  };
  const S = page => page.evaluate(() => JSON.parse(JSON.stringify(window.__sbSync.state)));
  const openCreate = async (page, act) => {
    await page.evaluate(a => { const d = window.__sbSync.dlg; if (d.open) d.close(); const b = document.createElement("button"); b.dataset.act = a; document.body.appendChild(b); b.click(); b.remove(); }, act || "fc-ai-cards");
    await page.waitForSelector("#aiGo");
  };
  const useLink = async (page, url) => { if (!(await page.evaluate(() => document.getElementById("aiLinkD").open))) await page.click("#aiLinkD summary"); await page.fill("#aiLink", url); };
  const status = page => page.evaluate(() => document.getElementById("aiStatus").textContent);
  const fits = page => page.evaluate(() => { const d = document.getElementById("dlg"); return {dlg: d.scrollWidth - d.clientWidth, page: document.documentElement.scrollWidth - innerWidth}; });
  try {
    /* A YouTube video, with Gemini */
    const page = await mkPage();
    await openCreate(page);
    ok(await page.locator("#aiLinkD summary").textContent() === "Or From a YouTube Video or Web Page", "Create with AI has one more input: a link, folded away");
    await useLink(page, "https://youtu.be/aBcDeFgHiJk?si=share123");
    ok(/YouTube video\. Gemini watches it/.test(await page.textContent("#aiLinkHint")), "the link is recognised as it's typed");
    await page.selectOption("#aiCourse", "c1");
    let f = await fits(page); ok(f.dlg <= 1 && f.page <= 0, "the sheet fits at 1280px: " + JSON.stringify(f));
    await page.click("#aiGo");
    await page.waitForSelector("#arSave", {timeout: 15000});
    ok(page.context().gem.length === 2, "two AI requests: the video into notes, then the notes into cards");
    const r1 = JSON.parse(page.context().gem[0]);
    const fd = r1.contents[0].parts.find(p => p.file_data);
    ok(fd && fd.file_data.file_uri === "https://www.youtube.com/watch?v=aBcDeFgHiJk" && fd.file_data.mime_type === "video/*", "the video goes to Gemini as file_data with file_uri (the link made plain): " + JSON.stringify(fd));
    ok(r1.generationConfig.mediaResolution === "MEDIA_RESOLUTION_LOW" && r1.generationConfig.responseMimeType === "application/json", "at low media resolution (longer videos fit), as JSON");
    const sys1 = r1.systemInstruction.parts[0].text;
    ok(/own words/.test(sys1) && /never copy its sentences/.test(sys1) && /very short exact term/.test(sys1) && /Never invent or guess content you couldn't see/.test(sys1), "the AI must write in its own words, quote only short terms, and never invent");
    const r2 = page.context().gem[1];
    ok(/Study notes on “Osmosis and Tonicity: Crash Course Biology #27”/.test(r2) && /write excellent flashcards/.test(r2) && !/file_uri/.test(r2), "the cards are made from the notes, by the usual flashcard maker");
    ok(!/AIzaTEST/.test(page.context().gem.join("")), "no key in any request body");
    ok(await page.locator("#arCards li").count() === 4 && /Review Before Saving/.test(await page.textContent("dialog h2")), "the draft cards go through Review Before Saving");
    ok(/Left out 1 flashcard that copied your material word for word/.test(await page.textContent("dialog[open] .sheet-body p")), "a card that repeats the notes word for word is left out by the usual copy check");
    await page.locator("#arCards li").nth(3).locator("[data-rmc]").click();
    await page.locator("#arCards li").first().locator('textarea[data-f="back"]').fill("Water moving across a selectively permeable membrane toward more solute, with no ATP.");
    ok(await page.inputValue("#arName") === "Osmosis and Tonicity", "a new deck, named by the AI");
    f = await fits(page); ok(f.dlg <= 1, "the review fits");
    ok(await page.locator("#arNoteOn").count() === 1 && !(await page.isChecked("#arNoteOn")), "Save a Summary Note Too is offered, and off unless you turn it on");
    await page.check("#arNoteOn");
    await page.click("#arSave"); await page.waitForTimeout(400);
    let st = await S(page);
    const deck = Object.values(st.decks).find(d => d.name === "Osmosis and Tonicity");
    ok(deck && deck.courseId === "c1" && deck.cards.length === 3 && deck.cards.every(c => c.ai) && /no ATP/.test(deck.cards[0].back) && !deck.cards.some(c => /aquaporins/.test(c.back)), "the kept and edited cards land in the deck, in the course");
    const note = Object.values(st.notes).find(x => x.src && x.src.url);
    ok(note && note.courseId === "c1" && note.src.url === "https://www.youtube.com/watch?v=aBcDeFgHiJk" && note.src.deck === deck.id && note.src.k === "youtube", "one summary note under the course, remembering the source and the deck");
    const lines = note.text.split("\n");
    ok(lines[0] === "Osmosis and Tonicity: Crash Course Biology #27" && /^From the YouTube video “Osmosis and Tonicity: Crash Course Biology #27”, summarized in AI's own words\.$/.test(lines[1]) && lines[2] === "Source: Osmosis and Tonicity: Crash Course Biology #27, https://www.youtube.com/watch?v=aBcDeFgHiJk" && lines[3] === "Flashcards: [[Osmosis and Tonicity]]", "the note credits the source (title and link) and links the deck: " + lines.slice(0, 4).join(" / "));
    ok(/• Water moves toward the side where solute is more concentrated/.test(note.text) && /• Lysis: A cell bursting/.test(note.text), "with the key points and terms");
    ok(Object.keys(st.notes).length === 1 && Object.keys(st.decks).length === 2, "nothing else was made");
    ok(page.errs.length === 0, "no console errors: " + page.errs.join(" | "));

    /* A web page, with Gemini's url context, into an existing deck */
    await openCreate(page);
    await useLink(page, "www.khanacademy.org/science/biology/membranes/active-transport#intro");
    ok(/Web page on khanacademy\.org/.test(await page.textContent("#aiLinkHint")), "an article is recognised");
    await page.click("#aiGo"); await page.waitForSelector("#arSave", {timeout: 15000});
    const a1 = JSON.parse(page.context().gem[2]);
    ok(JSON.stringify(a1.tools) === JSON.stringify([{url_context: {}}]) && !a1.generationConfig.responseMimeType && !a1.generationConfig.responseSchema, "the page is read with the url_context tool (no JSON mode with a tool)");
    ok(/the web page at https:\/\/www\.khanacademy\.org\/science\/biology\/membranes\/active-transport\b/.test(a1.contents[0].parts[0].text) && !/#intro/.test(a1.contents[0].parts[0].text) && /Answer with JSON only/.test(a1.contents[0].parts[0].text), "the request names the page (https added, the #part dropped) and asks for JSON");
    await page.selectOption("#arDeck", "d1");
    await page.check("#arNoteOn");
    await page.click("#arSave"); await page.waitForTimeout(400);
    st = await S(page);
    ok(st.decks.d1.cards.length === 3 && st.decks.d1.cards.some(c => c.front === "What is an antiporter?"), "the cards are added to the chosen deck");
    const pn = Object.values(st.notes).find(x => x.src && /khanacademy/.test(x.src.url));
    ok(pn && /^Active transport \| Khan Academy\nFrom the web page/.test(pn.text) && /Source: Active transport \| Khan Academy, https:\/\/www\.khanacademy\.org\/science\/biology\/membranes\/active-transport\n/.test(pn.text) && /Flashcards: \[\[BIO101 Membranes\]\]/.test(pn.text) && pn.courseId === "c1", "its note credits the page and links that deck");

    /* A paywall */
    await openCreate(page);
    const before = page.context().gem.length;
    await useLink(page, "https://www.example-news.com/paywalled/osmosis-explained");
    await page.click("#aiGo"); await page.waitForFunction(() => /paywall/.test(document.getElementById("aiStatus").textContent), null, {timeout: 15000});
    ok(/behind a login or paywall, so the AI only saw a preview\. Paste the text instead/.test(await status(page)) && await page.locator('#aiStatus [data-cl="paste"]').count() === 1, "a paywalled page is explained (from the page's own fetch status, even though the AI wrote something) with Paste the Text Instead");
    ok(page.context().gem.length === before + 1 && !(await page.locator("#arSave").count()), "and no cards are made from it");
    ok(await page.evaluate(() => !document.getElementById("aiGo").disabled), "Create can be tried again");

    /* Invalid links: nothing is sent */
    const sentBefore = page.context().gem.length;
    for (const [url, re] of [["javascript:alert(1)", /Only web links/], ["https://www.youtube.com/@crashcourse", /channel, playlist or search/], ["osmosis video", /doesn't look like a web link/], ["http://localhost:8080/notes", /only works on your own computer/]]) {
      await page.fill("#aiLink", url); await page.click("#aiGo"); await page.waitForTimeout(100);
      ok(re.test(await status(page)), `"${url}" is refused: ${await status(page)}`);
    }
    ok(page.context().gem.length === sentBefore, "no request for an invalid link");

    /* A private video and a very long one */
    await page.fill("#aiLink", "https://www.youtube.com/watch?v=BOOMBOOMBOO"); await page.click("#aiGo");
    await page.waitForFunction(() => /couldn't watch/.test(document.getElementById("aiStatus").textContent), null, {timeout: 15000});
    ok(/private, age-restricted, members-only or removed/.test(await status(page)) && await page.locator('#aiStatus [data-cl="paste"]').count() === 1, "an AI error on a video is explained plainly, with the paste option");
    await page.fill("#aiLink", "https://www.youtube.com/shorts/LongLongLon"); await page.click("#aiGo");
    await page.waitForFunction(() => /too long/.test(document.getElementById("aiStatus").textContent), null, {timeout: 15000});
    ok(/too long to cover in one go/.test(await status(page)), "a video over the limit is explained: " + await status(page));
    await page.click('#aiStatus [data-cl="paste"]');
    ok(await page.evaluate(() => document.getElementById("aiPasteD").open && document.activeElement && document.activeElement.id === "aiPaste"), "Paste the Text Instead opens the paste box");
    ok(page.errs.length === 0, "no console errors: " + page.errs.join(" | "));
    await page.context().close();

    /* Claude: YouTube needs Gemini; pasting the transcript works; pages are read with web fetch */
    const pc = await mkPage({claude: true});
    await openCreate(pc);
    await useLink(pc, "https://www.youtube.com/watch?v=aBcDeFgHiJk&t=30s");
    ok(/Only Google's Gemini can watch YouTube videos/.test(await pc.textContent("#aiLinkHint")), "with Claude, the hint says YouTube needs Gemini");
    await pc.click("#aiGo"); await pc.waitForTimeout(150);
    ok(/YouTube links need a Gemini key: only Google's Gemini can watch YouTube videos, and you're using Claude/.test(await status(pc)) && /Show Transcript/.test(await status(pc)) && pc.context().claude.length === 0, "Create explains it plainly and sends nothing");
    await pc.click('#aiStatus [data-cl="paste"]');
    await pc.fill("#aiPaste", TRANSCRIPT);
    await pc.selectOption("#aiCourse", "c1");
    await pc.click("#aiGo"); await pc.waitForSelector("#arSave", {timeout: 15000});
    const c1 = pc.context().claude[0].body;
    ok(/The student pasted its transcript/.test(JSON.stringify(c1.messages)) && /Today: osmosis/.test(JSON.stringify(c1.messages)) && !(c1.tools || []).some(t => /web_fetch/.test(t.type)), "the pasted transcript goes to Claude as text, with no web tool");
    ok(/The source's own text/.test(JSON.stringify(pc.context().claude[1].body.messages)), "and the cards are checked against it");
    await pc.check("#arNoteOn");
    await pc.click("#arSave"); await pc.waitForTimeout(400);
    let sc = await S(pc);
    const cn = Object.values(sc.notes).find(x => x.src);
    ok(cn && cn.src.url === "https://www.youtube.com/watch?v=aBcDeFgHiJk" && /Source: Osmosis and Tonicity: Crash Course Biology #27, https:\/\/www\.youtube\.com\/watch\?v=aBcDeFgHiJk/.test(cn.text), "the note still credits the video");
    await openCreate(pc);
    await useLink(pc, "https://www.khanacademy.org/science/biology/membranes/active-transport");
    await pc.click("#aiGo"); await pc.waitForSelector("#arSave", {timeout: 15000});
    const wf = pc.context().claude.find(x => (x.body.tools || []).some(t => t.type === "web_fetch_20250910"));
    ok(wf && wf.headers["anthropic-beta"] === "web-fetch-2025-09-10" && wf.body.tools.find(t => t.type === "web_fetch_20250910").name === "web_fetch" && !wf.body.tool_choice, "Claude reads the page with its web fetch tool (beta header, no forced tool)");
    { const before = Object.keys((await S(pc)).notes).length; await pc.click("#arSave"); await pc.waitForTimeout(400); const after = await S(pc);
      ok(Object.keys(after.notes).length === before && Object.values(after.decks).some(d => /Active Transport/.test(d.name)), "saved with the switch off: the deck, and no note on the board"); }
    ok(!JSON.stringify(pc.context().claude.map(x => x.body)).includes("sk-ant-TEST"), "no key in the bodies");
    ok(pc.errs.length === 0, "no console errors with Claude: " + pc.errs.join(" | "));
    await pc.context().close();

    /* The free plan */
    const pf = await mkPage({free: true});
    await openCreate(pf);
    ok(await pf.locator("#aiLinkD summary .pro-badge").count() === 1, "free: the link input shows it's Pro");
    await pf.click("#aiLinkD summary"); await pf.waitForTimeout(300);
    ok(await pf.evaluate(() => !!window.__sbSync.dlg.querySelector(".plan-sheet")) && pf.context().gem.length === 0, "free: opening it shows the Pro sheet, and nothing is sent");
    ok(pf.errs.length === 0, "no console errors (free): " + pf.errs.join(" | "));
    await pf.context().close();

    /* A phone, and the quiz-only sheet */
    const pp = await mkPage({phone: true});
    await openCreate(pp, "qz-ai");
    ok(await pp.locator("#aiLinkD").count() === 0, "Make a Quiz with AI doesn't offer links (cards only)");
    await openCreate(pp, "fc-ai-cards");
    await useLink(pp, "https://www.youtube.com/watch?v=BOOMBOOMBOO"); await pp.click("#aiGo");
    await pp.waitForFunction(() => /couldn't watch/.test(document.getElementById("aiStatus").textContent), null, {timeout: 15000});
    f = await fits(pp); ok(f.dlg <= 1 && f.page <= 0, "at 390px the sheet with a link and an error fits: " + JSON.stringify(f));
    ok(pp.errs.length === 0, "no console errors (phone): " + pp.errs.join(" | "));
    await pp.context().close();
  } finally { await browser.close(); server.close(); }
  console.log(`cards-from-link.e2e.js: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
