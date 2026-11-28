// Browser checks for sending decks, quizzes and concept maps to friends (src/js/82-friend-share.js, supabase-friend-shares.sql)
const path = require("path"), fs = require("fs"), assert = require("assert");
const file = path.resolve(__dirname, "..", "index.html");
const shots = path.resolve(process.argv[2] || path.join(__dirname, "..", "tests-out"));
fs.mkdirSync(shots, {recursive: true});
const {chromium, executablePath} = require("./pw");
const {stubInit} = require("./group-stub.js");
let n = 0; const ok = (c, m) => { n++; assert(c, m); };

// On top of the groups stand-in: friends, and the three sending functions
function friendsInit(o){
  const wait = v => new Promise(r => setTimeout(() => r(v), 20));
  const S = window.__FS = {sent: [], waiting: o.waiting || [], taken: []};
  const tick = setInterval(() => {
    const st = window.__sbGroupsStub; if (!st || st.__fs) return; st.__fs = true; clearInterval(tick);
    const base = st.client.rpc.bind(st.client);
    st.client.rpc = (name, a) => {
      if (name === "my_friends") return wait({data: [{user_id: "u2", display_name: "Sam", username: "sam.lee", status: "accepted", mine: false, via: "username", since: "2026-11-01", face: ""},
        {user_id: "u3", display_name: "Jo", username: "jo", status: "accepted", mine: true, via: "link", since: "2026-11-02", face: ""}]});
      if (name === "send_to_friends") { S.sent.push(a); return wait({data: a.p_to.length}); }
      if (name === "my_friend_shares") return wait({data: S.waiting.filter(r => !S.taken.includes(r.id)).map(r => { const x = Object.assign({}, r); delete x.data; return x; })});
      if (name === "take_friend_share") { const r = S.waiting.find(x => x.id === a.p_id); S.taken.push(a.p_id); return wait({data: a.p_add && r ? {kind: r.kind, title: r.title, from: r.from_name, data: r.data} : null}); }
      return base(name, a);
    };
  }, 1);
  try {
    const seed = {v: 2, updated: 1, tasks: [], notes: [], settings: {capacity: 15, dailyHours: 3}, courses: [{id: "c1", name: "Biology", code: "BIOL 201", color: "#3B6FE0", maps: [{id: "m1", name: "Cells", auto: false, created: 1, at: 1,
        add: [{id: "i1", label: "Mitochondria"}, {id: "i2", label: "Nucleus"}, {id: "i3", label: "ATP"}],
        links: [{a: "root", b: "idea:i1"}, {a: "root", b: "idea:i2"}, {a: "idea:i1", b: "idea:i3"}], pos: {}, styles: {}, names: {}, hide: [], cut: []}]}],
      decks: [{id: "d1", name: "Cells", courseId: "c1", created: 1, cards: [{id: "k1", front: "Mitochondria", back: "Powerhouse", box: 1, due: "", seen: 0}, {id: "k2", front: "Ribosome", back: "Makes protein", box: 1, due: "", seen: 0}]}]};
    if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(seed));
    localStorage.setItem("studioso:sb", JSON.stringify("local"));
  } catch (e) {}
}

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    // 1. Sending a deck from its share sheet
    let ctx = await browser.newContext({viewport: {width: 1280, height: 900}}), page = await ctx.newPage(), errs = [];
    page.on("pageerror", e => errs.push(e.message));
    await page.addInitScript(stubInit, {me: "u1"}); await page.addInitScript(friendsInit, {});
    await page.goto("file://" + file); await page.waitForTimeout(1500);
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "fs-send"; b.dataset.kind = "deck"; b.dataset.ref = "d1"; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForSelector("dialog[open] .fs-list input[name=to]");
    ok(await page.locator("dialog[open] .fs-list li").count() === 2, "the sheet lists your friends");
    await page.screenshot({path: shots + "/fs-send.png"});
    await page.click("#fsGo"); await page.waitForTimeout(200);
    ok(/Pick at least one friend/.test(await page.textContent("#fsMsg")), "a friend must be picked");
    await page.check('dialog[open] input[name=to][value=u2]');
    if (await page.locator("#shRights").count()) await page.check("#shRights");
    await page.click("#fsGo"); await page.waitForTimeout(600);
    const sent = await page.evaluate(() => window.__FS.sent);
    ok(sent.length === 1 && sent[0].p_kind === "deck" && sent[0].p_to.join() === "u2" && sent[0].p_title === "Cells" && sent[0].p_info === "2 cards" && sent[0].p_data.cards.length === 2, "the deck goes to Sam: " + JSON.stringify(sent).slice(0, 200));
    ok(/Sent to Sam/.test(await page.evaluate(() => (document.querySelector("#toastMsg") || {}).textContent || "")), "it says who it went to");

    // the deck's share sheet offers it next to Share as File
    await page.evaluate(() => { const B = window.__sbBreakdown; B.ui.tab = "flashcards"; B.render(); });
    await page.click('[data-act="fc-share"][data-id="d1"]'); await page.waitForTimeout(1200);
    ok(await page.locator('dialog[open] [data-act="fs-send"][data-kind="deck"]').count() === 1, "the deck's Share menu has Your Friends: " + await page.evaluate(() => (document.querySelector("dialog[open]") || {textContent: "no dialog"}).textContent.replace(/\s+/g, " ").slice(0, 200)));
    await page.screenshot({path: shots + "/fs-menu.png"});
    await page.keyboard.press("Escape"); await page.waitForTimeout(300);

    // 2. A concept map: what the sender's map turns into, sent to a friend
    const mapPayload = await page.evaluate(() => window.SBFSHARE.T.payloadOf("map", "c1:m1"));
    ok(mapPayload && mapPayload.data.type === "map" && mapPayload.data.ops.length > 3 && /ideas/.test(mapPayload.info), "a map becomes a payload of its ideas and links: " + JSON.stringify(mapPayload && {t: mapPayload.title, i: mapPayload.info}));
    ok(!errs.length, "no page errors (sending): " + errs.join(" | "));
    await ctx.close();

    // 3. Receiving: it pops up when the app opens; Add makes your own copy
    const deckData = {v: 1, app: "studyboard", type: "deck", name: "Organic Chem", course: {code: "CHEM 211", name: "Chemistry"}, cards: [{id: "x1", front: "Benzene", back: "C6H6"}, {id: "x2", front: "Ethanol", back: "C2H5OH"}], quizzes: []};
    const quizData = {v: 1, type: "quiz", quiz: {id: "q1", title: "Cell quiz", questions: [{id: "qq1", type: "single", stem: "Which organelle makes ATP?", options: ["Nucleus", "Mitochondria"], correct: [1], rationale: "It's the powerhouse."}]}, course: null};
    const waiting = [
      {id: "s1", kind: "deck", title: "Organic Chem", info: "2 cards", created_at: "2026-11-26T10:00:00Z", from_user: "u2", from_name: "Sam", from_username: "sam.lee", from_face: "", data: deckData},
      {id: "s2", kind: "quiz", title: "Cell quiz", info: "1 question", created_at: "2026-11-26T09:00:00Z", from_user: "u3", from_name: "Jo", from_username: "jo", from_face: "", data: quizData},
      {id: "s3", kind: "map", title: "Cells", info: mapPayload.info, created_at: "2026-11-26T08:00:00Z", from_user: "u2", from_name: "Sam", from_username: "sam.lee", from_face: "", data: mapPayload.data}];
    ctx = await browser.newContext({viewport: {width: 1280, height: 900}}); page = await ctx.newPage(); errs = [];
    page.on("pageerror", e => errs.push(e.message));
    await page.addInitScript(stubInit, {me: "u1"}); await page.addInitScript(friendsInit, {waiting});
    await page.goto("file://" + file);
    await page.waitForSelector("dialog[open] .fs-in", {timeout: 9000});
    ok(/Sam sent you a deck/.test(await page.textContent("dialog[open] .sheet-head")) && /Organic Chem/.test(await page.textContent("dialog[open] .fs-card")), "on opening, the newest one pops up");
    await page.screenshot({path: shots + "/fs-receive.png"});
    await page.click("#fsYes"); await page.waitForTimeout(800);
    const deck = await page.evaluate(() => Object.values(window.__sbBreakdown.state().decks).find(d => d.name === "Organic Chem"));
    ok(deck && deck.cards.length === 2 && deck.sharedFrom && deck.sharedFrom.by === "Sam", "Add makes your own copy of the deck, from Sam");
    // the next one follows
    await page.waitForSelector("dialog[open] .fs-in", {timeout: 4000});
    ok(/Jo sent you a quiz/.test(await page.textContent("dialog[open] .sheet-head")), "then the quiz");
    await page.click("#fsYes"); await page.waitForTimeout(800);
    ok(await page.evaluate(() => Object.values(window.__sbBreakdown.state().decks).some(d => (d.aiQuizzes || []).some(q => q.title === "Cell quiz"))), "the quiz is added");
    await page.waitForSelector("dialog[open] .fs-in", {timeout: 4000});
    ok(/Sam sent you a concept map/.test(await page.textContent("dialog[open] .sheet-head")), "then the map");
    const before = await page.evaluate(() => Object.values(window.__sbBreakdown.state().courses).reduce((k, c) => k + ((c.maps || []).length), 0));
    await page.click("#fsYes"); await page.waitForTimeout(800);
    const after = await page.evaluate(() => { const all = Object.values(window.__sbBreakdown.state().courses).flatMap(c => c.maps || []); return {n: all.length, m: all.find(m => m.name === "Cells")}; });
    ok(after.n === before + 1 && after.m && (after.m.add || []).length >= 3, "the map is added as your own, with its ideas: " + JSON.stringify({before, n: after.n, ideas: after.m && (after.m.add || []).length}));
    ok(await page.evaluate(() => window.__FS.taken.join()) === "s1,s2,s3", "each was answered once");

    // No Thanks
    await page.evaluate(() => { window.__FS.waiting.push({id: "s4", kind: "deck", title: "Spam", info: "1 card", created_at: "2026-11-26T11:00:00Z", from_user: "u2", from_name: "Sam", from_face: "", data: {cards: [{id: "z", front: "a", back: "b"}]}}); window.SBFSHARE.check(); });
    await page.waitForSelector("dialog[open] .fs-in", {timeout: 4000});
    await page.click("#fsNo"); await page.waitForTimeout(600);
    ok(!(await page.evaluate(() => Object.values(window.__sbBreakdown.state().decks).some(d => d.name === "Spam"))), "No Thanks adds nothing");
    ok(!errs.length, "no page errors (receiving): " + errs.join(" | "));
    await ctx.close();
  } finally { await browser.close(); }
  console.log(`friend-share e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
