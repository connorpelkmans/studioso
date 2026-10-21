// Public share links (decks, notes, quizzes) and the Course Library (97-sharing.js), with in-memory stand-ins for the server:
// window.__sbShareStub answers the sharing functions (supabase-sharing.sql), window.__sbGroupsStub the signed-in groups client.
// Run: node tests/sharing.e2e.js [screenshot-dir]      (needs Playwright; see tests/pw.js)
const path = require("path"), fs = require("fs"), assert = require("assert");
const file = path.resolve(__dirname, "..", "index.html");
const shots = path.resolve(process.argv[2] || path.join(__dirname, "..", "tests-out"));
fs.mkdirSync(shots, {recursive: true});
const {chromium, executablePath} = require("./pw");
let checks = 0; const ok = (c, m) => { checks++; assert(c, m); console.log("ok -", m); };

// The server, in the page: shared decks and items, the library, reports and saves
function serverInit(opts){
  const SV = window.__SV = {
    decks: [{code: "DECK-AAAA", owner: "u2", name: "Cell Bio Basics", sharer_name: "Sam", card_count: 3, listed: true, course_key: "BIOL201", school_key: "uwaterloo.ca", school_name: "University of Waterloo", saves: 4,
      updated_at: "2026-10-01T00:00:00Z", data: {v: 1, name: "Cell Bio Basics", course: {code: "BIOL 201", name: "Biology"}, cards: [{id: "a", front: "Mitochondria", back: "Makes ATP"}, {id: "b", front: "Ribosome", back: "Makes protein"}, {id: "c", front: "Nucleus", back: "Holds DNA"}], quizzes: []}},
      {code: "DECK-BBBB", owner: "u3", name: "Other School Deck", sharer_name: "Jo", card_count: 2, listed: true, course_key: "BIOL201", school_key: "uoft.ca", school_name: "U of T", saves: 1, updated_at: "2026-10-02T00:00:00Z",
        data: {v: 1, name: "Other School Deck", cards: [{id: "x", front: "Cell", back: "Unit of life"}, {id: "y", front: "DNA", back: "Genetic code"}], quizzes: []}}],
    items: [{code: "NOTE-CCCC", owner: "u2", kind: "note", ref_id: "n9", title: "Lecture 3 summary", sharer_name: "Sam", updated_at: "2026-10-03T00:00:00Z", saves: 0,
      data: {v: 1, type: "note", text: "Lecture 3 summary\nCells use [[Glycolysis|glycolysis]] for energy.", color: "blue", course: {code: "BIOL 201", name: "Biology"}}},
      {code: "QUIZ-DDDD", owner: "u2", kind: "quiz", ref_id: "d:q", title: "Cell Quiz", sharer_name: "Sam", updated_at: "2026-10-03T00:00:00Z", saves: 0,
        data: {v: 1, type: "quiz", course: {code: "BIOL 201", name: "Biology"}, quiz: {id: "q1", title: "Cell Quiz", questions: [{id: "qq1", type: "single", stem: "Which organelle makes ATP?", options: ["Nucleus", "Mitochondria"], correct: [1], rationale: "It's the powerhouse."}]}}}],
    calls: [], reports: [], saves: []
  };
  const me = () => opts.me || null;
  const wait = v => new Promise(r => setTimeout(() => r(v), 15));
  const norm = c => { const x = String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); return x.length === 8 ? x.slice(0, 4) + "-" + x.slice(4) : x; };
  let n = 0;
  const F = {
    get_public_share: a => { const k = norm(a.p_code), d = SV.decks.find(x => x.code === k && !x.hidden);
      if (d) return [{code: d.code, kind: "deck", name: d.name, sharer_name: d.sharer_name, card_count: d.card_count, data: d.data, updated_at: d.updated_at, is_mine: d.owner === me()}];
      const i = SV.items.find(x => x.code === k && !x.hidden); return i ? [{code: i.code, kind: i.kind, name: i.title, sharer_name: i.sharer_name, card_count: 0, data: i.data, updated_at: i.updated_at, is_mine: i.owner === me()}] : []; },
    share_item: a => { if (!me()) throw {message: "Sign in first"}; let i = SV.items.find(x => x.owner === me() && x.kind === a.p_kind && x.ref_id === a.p_ref);
      if (i) Object.assign(i, {title: a.p_title, data: a.p_data, updated_at: new Date().toISOString()});
      else { i = {code: "MINE-000" + (++n), owner: me(), kind: a.p_kind, ref_id: a.p_ref, title: a.p_title, data: a.p_data, sharer_name: "Connor", updated_at: new Date().toISOString(), saves: 0}; SV.items.push(i); }
      return i.code; },
    my_shared_items: () => SV.items.filter(x => x.owner === me()).map(x => ({code: x.code, kind: x.kind, ref_id: x.ref_id, title: x.title, updated_at: x.updated_at, saves: x.saves, hidden: false})),
    stop_share_item: a => { SV.items = SV.items.filter(x => !(x.code === a.p_code && x.owner === me())); return null; },
    library_decks: a => SV.decks.filter(d => d.listed && !d.hidden && d.course_key === a.p_course_key && (!a.p_school_key || d.school_key === a.p_school_key))
      .map(d => ({code: d.code, name: d.name, sharer_name: d.sharer_name, card_count: d.card_count, updated_at: d.updated_at, saves: d.saves, school_name: d.school_name, school_key: d.school_key, course_label: "", is_mine: d.owner === me()})),
    library_counts: a => { const m = {}; SV.decks.filter(d => d.listed && a.p_course_keys.includes(d.course_key) && (!a.p_school_key || d.school_key === a.p_school_key) && d.owner !== me()).forEach(d => { m[d.course_key] = (m[d.course_key] || 0) + 1; });
      return Object.keys(m).map(k => ({course_key: k, n: m[k]})); },
    library_list: a => { const d = SV.decks.find(x => x.code === a.p_code && x.owner === me()); if (!d) throw {message: "Share the deck with a link first."};
      Object.assign(d, {listed: a.p_listed, course_key: a.p_course_key, school_key: a.p_school_key, school_name: a.p_school_name}); return null; },
    share_saved: a => { if (me()) SV.saves.push(a.p_code); return null; },
    report_share: a => { SV.reports.push(a); return null; },
    search_schools: a => [{key: "uwaterloo.ca", name: "University of Waterloo", country: "Canada", region: "Ontario", web: ""}, {key: "wlu.ca", name: "Wilfrid Laurier University", country: "Canada", region: "", web: ""}].filter(x => x.name.toLowerCase().includes(String(a.p_q).toLowerCase()) || x.key.startsWith(String(a.p_q).toLowerCase())),
    school_for_host: a => /uwaterloo\.ca$/.test(String(a.p_host)) ? [{key: "uwaterloo.ca", name: "University of Waterloo", country: "Canada", region: "Ontario", web: ""}] : [],
    set_my_school: a => { if (!me()) throw {message: "Sign in first"}; if (!["uwaterloo.ca", "wlu.ca"].includes(a.p_key)) throw {message: "Pick your school from the list."}; SV.school = a.p_key; return [{key: a.p_key}]; },
    request_school: a => { SV.requests = (SV.requests || []).concat([a]); return null; },
    share_deck: a => { let d = SV.decks.find(x => x.owner === me() && x.deck_id === a.p_deck_id);
      if (!d) { d = {code: "PUBD-000" + (SV.decks.length), owner: me(), deck_id: a.p_deck_id, sharer_name: "Connor", saves: 0}; SV.decks.push(d); }
      Object.assign(d, {name: a.p_name, data: a.p_data, card_count: a.p_count}); return d.code; },
    my_publish_state: a => !!(SV.decks.find(d => d.code === a.p_code && d.owner === me() && d.published) || SV.items.find(i => i.code === a.p_code && i.owner === me() && i.published)),
    share_publish: a => { if (a.p_on && !SV.school) throw {message: "SB_SCHOOL: Pick your school first."}; const x = SV.decks.find(d => d.code === a.p_code && d.owner === me()) || SV.items.find(i => i.code === a.p_code && i.owner === me()); if (!x) throw {message: "Share it with a link first."}; x.published = a.p_on; return null; }
  };
  window.__sbShareStub = async (fn, a) => { SV.calls.push([fn, a]); await wait(); if (!F[fn]) throw {code: "PGRST202", message: "Could not find the function public." + fn}; return F[fn](a); };
  if (opts.me) {
    // the signed-in client the groups module uses (profiles, the deck link sheet and its share_deck)
    const user = {id: opts.me, email: opts.me + "@x.com"};
    const tables = {study_profiles: [{user_id: opts.me, display_name: "Connor"}], shared_decks: SV.decks, study_groups: [], group_members: [], group_items: [], group_messages: [], group_blocks: []};
    const mk = t => { const st = {f: [], one: false, op: "select"}; const run = () => { const rows = (t === "shared_decks" ? SV.decks.map(d => Object.assign({owner_id: d.owner, deck_id: d.deck_id}, d)) : tables[t] || []).filter(r => st.f.every(f => f(r)));
        if (st.op === "delete") { if (t === "shared_decks") SV.decks = SV.decks.filter(d => !rows.some(r => r.code === d.code)); return wait({data: null}); }
        return wait({data: st.one ? rows[0] || null : rows}); };
      const api = {select() { return api; }, eq(c, v) { st.f.push(r => r[c] === v); return api; }, in(c, v) { st.f.push(r => v.includes(r[c])); return api; }, order() { return api; }, limit() { return api; }, gte() { return api; },
        maybeSingle() { st.one = true; return run(); }, single() { st.one = true; return run(); }, delete() { st.op = "delete"; return api; }, upsert() { return api; }, insert() { return api; }, update() { return api; }, then(res, rej) { return run().then(res, rej); }};
      return api; };
    const client = {from: mk, rpc: async (name, a) => { SV.calls.push(["grp:" + name, a]); await wait();
        if (name === "share_deck") { let d = SV.decks.find(x => x.owner === opts.me && x.deck_id === a.p_deck_id);
          if (!d) { d = {code: "MYDK-0001", owner: opts.me, deck_id: a.p_deck_id, sharer_name: "Connor", listed: false, saves: 0}; SV.decks.push(d); }
          Object.assign(d, {name: a.p_name, data: a.p_data, card_count: a.p_count, updated_at: new Date().toISOString()}); return {data: d.code}; }
        return {data: null}; },
      channel: () => { const c = {on() { return c; }, subscribe() { return c; }}; return c; }, removeChannel() {}};
    window.__sbGroupsStub = {user, client};
    try { localStorage.setItem("sb:grpName:" + opts.me, "Connor"); } catch (e) {}
  }
  window.__SB_TEST = true;
  try {
    localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
    if (opts.seed) { localStorage.setItem("coursework:v2", JSON.stringify(opts.seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); }
  } catch (e) {}
}

const SEED = {v: 2, updated: 1, courses: [{id: "c1", name: "Biology", code: "BIOL 201", color: "#3B6FE0"}], tasks: [],
  settings: {capacity: 15, dailyHours: 3, webUrl: "https://app.example.edu/", brightspace: {host: "learn.uwaterloo.ca"}},
  notes: [{id: "n1", text: "Krebs cycle\nHappens in the mitochondria.", color: "yellow", x: 40, y: 40, z: 1, rot: 0, courseId: "c1"}],
  decks: [{id: "d3", name: "Organelles", courseId: "c1", created: 3, cards: ["Nucleus|DNA", "Ribosome|Protein", "Golgi|Packaging", "Lysosome|Waste", "Vacuole|Storage"].map((x, i) => ({id: "o" + i, front: x.split("|")[0], back: x.split("|")[1], box: 0, due: "", seen: 0, right: 0, wrong: 0}))},
    {id: "d1", name: "My Cells", courseId: "c1", created: 1, cards: [{id: "k1", front: "Cell wall", back: "Plants have it", box: 0, due: "", seen: 0, right: 0, wrong: 0}],
    aiQuizzes: [{id: "q1", title: "Krebs Quiz", questions: [{id: "z1", type: "single", stem: "Where does the Krebs cycle happen?", options: ["Mitochondria", "Nucleus"], correct: [0]}]}]}]};

async function boot(browser, w, opts, query){
  const ctx = await browser.newContext({viewport: {width: w, height: w < 600 ? 844 : 900}});
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", c => { if (c.type() === "error" && !/net::ERR|CORS|Failed to load resource|supabase-js/.test(c.text())) errs.push("console: " + c.text().slice(0, 200)); });
  await page.addInitScript(serverInit, opts);
  await page.goto("file://" + file + (query || "")); await page.waitForTimeout(1600);
  return {ctx, page, errs};
}
const act = (page, a, attrs) => page.evaluate(([a, attrs]) => { const b = document.createElement("button"); b.dataset.act = a; Object.entries(attrs || {}).forEach(([k, v]) => { b.dataset[k] = v; }); document.body.appendChild(b); b.click(); b.remove(); }, [a, attrs]);
// a button that stays on the page for a moment (the Share picker clicks it again once your groups have loaded)
const actStay = (page, a, attrs) => page.evaluate(([a, attrs]) => { const b = document.createElement("button"); b.dataset.act = a; Object.entries(attrs || {}).forEach(([k, v]) => { b.dataset[k] = v; }); b.style.cssText = "position:fixed;left:0;top:0;opacity:0"; document.body.appendChild(b); b.click(); setTimeout(() => b.remove(), 2500); }, [a, attrs]);
const txt = (page, sel) => page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.innerText.replace(/\s+/g, " ") : ""; }, sel);
const calls = (page, fn) => page.evaluate(fn => window.__SV.calls.filter(c => c[0] === fn), fn);
const noOverflow = async (page, label) => ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "no horizontal overflow: " + label);

// A first-time visitor with no account opens each kind of link
async function visitor(browser){
  // a deck
  let {ctx, page, errs} = await boot(browser, 390, {}, "?deck=deck-aaaa");
  await page.waitForSelector("dialog[open] .sh-view", {timeout: 8000});
  ok(/Cell Bio Basics/.test(await txt(page, "dialog[open]")) && /Shared by Sam/.test(await txt(page, "dialog[open]")), "a deck link opens for a visitor with no account");
  ok(/Mitochondria/.test(await txt(page, "#shCard")) && /1 of 3/.test(await txt(page, "#shPos")), "it shows the first card's front");
  await page.click("#shCard"); ok(/Makes ATP/.test(await txt(page, "#shCard")), "tapping flips the card");
  await page.click("#shNext"); ok(/Ribosome/.test(await txt(page, "#shCard")) && /2 of 3/.test(await txt(page, "#shPos")), "Next shows the next front");
  await noOverflow(page, "deck view on a phone");
  await page.screenshot({path: shots + "/share-deck-phone.png"});
  await page.click(`dialog[open] [data-act="share-report"]`); await page.waitForTimeout(150).catch(() => {});
  ok(!(await page.evaluate(() => window.__SV.reports.length)), "signed out, Report asks to sign in instead of sending");
  await page.click("#shAdd"); await page.waitForTimeout(400);
  const dk = await page.evaluate(() => Object.values(__sbSync.state.decks).find(d => d.sharedFrom && d.sharedFrom.code === "DECK-AAAA") || null);
  ok(dk && dk.cards.length === 3 && dk.cards.every(c => c.box === 0 && !c.seen), "Study This in Studyboard adds a fresh copy of the deck");
  ok(await page.evaluate(() => __sbSync.ui.tab === "flashcards" && !!__sbSync.ui.deckId), "and opens it");
  ok(!(await page.evaluate(() => window.__SV.saves.length)), "a visitor's copy isn't counted as a save (no account)");
  ok(!errs.length, "no errors (deck link): " + errs.join(" | ")); await ctx.close();

  // a note
  ({ctx, page, errs} = await boot(browser, 1280, {seed: SEED}, "?shared=NOTE-CCCC"));
  await page.waitForSelector("dialog[open] .sh-note", {timeout: 8000});
  ok(/Cells use glycolysis for energy/.test(await txt(page, ".sh-note")), "a note link shows the note, with [[links]] as plain words");
  await page.click("#shSave"); await page.waitForTimeout(400);
  ok(await page.evaluate(() => Object.values(__sbSync.state.notes).some(n => n.sharedFrom && n.sharedFrom.code === "NOTE-CCCC" && n.courseId === "c1" && /glycolysis/.test(n.text))), "Save to My Notes adds it, in my matching course");
  ok(await page.evaluate(() => __sbSync.ui.tab === "notes"), "and shows Notes");
  ok(!errs.length, "no errors (note link): " + errs.join(" | ")); await ctx.close();

  // a quiz
  ({ctx, page, errs} = await boot(browser, 1280, {seed: SEED}, "?shared=QUIZ-DDDD"));
  await page.waitForSelector("dialog[open] #shTake", {timeout: 8000});
  ok(/1 question/.test(await txt(page, "dialog[open]")) && /Which organelle makes ATP/.test(await txt(page, ".sh-q")), "a quiz link shows how many questions and the first one");
  await page.click("#shTake"); await page.waitForTimeout(500);
  ok(await page.evaluate(() => __sbSync.ui.fc && __sbSync.ui.fc.mode === "aiquiz"), "Take the Quiz starts it");
  ok(!errs.length, "no errors (quiz link): " + errs.join(" | ")); await ctx.close();

  // a link that was stopped
  ({ctx, page, errs} = await boot(browser, 1280, {seed: SEED}, "?shared=GONE-0000"));
  await page.waitForFunction(() => /doesn't work any more/.test((document.querySelector("dialog[open]") || {}).innerText || ""), null, {timeout: 8000});
  ok(true, "a stopped link says so");
  ok(!errs.length, "no errors (stopped link): " + errs.join(" | ")); await ctx.close();
}

// Signed in: share a note and a quiz with a link, list a deck in the library, browse it, report
async function sharer(browser){
  let {ctx, page, errs} = await boot(browser, 1280, {me: "u1", seed: SEED});
  // a note
  await act(page, "share-link", {kind: "note", ref: "n1"}); await page.waitForSelector("dialog[open] #shMake");
  ok(/Only the text is shared/.test(await txt(page, "dialog[open]")), "sharing a note says what is shared");
  await page.click("#shMake"); await page.waitForSelector("dialog[open] #shStop");
  const si = await calls(page, "share_item");
  ok(si.length === 1 && si[0][1].p_kind === "note" && si[0][1].p_title === "Krebs cycle" && /mitochondria/.test(si[0][1].p_data.text), "Create Link sends the note's text and title");
  ok(/MINE-0001/.test(await txt(page, ".grp-code-big")) && (await page.inputValue("#shLinkIn")) === "https://app.example.edu/?shared=MINE-0001", "the link opens the website with ?shared=");
  ok(await page.evaluate(() => __sbSync.state.notes.n1.shared && __sbSync.state.notes.n1.shared.code === "MINE-0001"), "the note remembers it's shared");
  ok(!/You've changed this note/.test(await txt(page, "dialog[open]")), "unchanged, it doesn't ask to update");
  await page.evaluate(() => { const n = __sbSync.clone(__sbSync.state.notes.n1); n.text += "\nAnd makes NADH."; __sbSync.applyChanges([{kind: "note", id: "n1", after: n}], ""); });
  await act(page, "share-link", {kind: "note", ref: "n1"}); await page.waitForSelector("dialog[open] #shUpd");
  ok(/You've changed this note/.test(await txt(page, "dialog[open]")), "after an edit it offers Update Shared Copy");
  await page.click("#shUpd"); await page.waitForTimeout(300);
  ok((await calls(page, "share_item")).length === 2 && await page.evaluate(() => /NADH/.test(window.__SV.items.find(x => x.code === "MINE-0001").data.text)), "Update sends the new text to the same link");
  await page.click("#shStop"); await page.waitForSelector("#askDlg[open]"); await page.click("#askYes"); await page.waitForTimeout(300);
  ok(await page.evaluate(() => !window.__SV.items.some(x => x.code === "MINE-0001") && !__sbSync.state.notes.n1.shared), "Stop Sharing removes the link");

  // a quiz, through the Share button's picker (no groups: straight to the link)
  await actStay(page, "qz-share", {deck: "d1", id: "q1"}); await page.waitForSelector("dialog[open] #shMake", {timeout: 5000});
  await page.click("#shMake"); await page.waitForSelector("dialog[open] #shStop");
  ok(await page.evaluate(() => { const x = window.__SV.items.find(i => i.kind === "quiz" && i.owner === "u1"); return !!x && x.ref_id === "d1:q1" && x.data.quiz.questions.length === 1; }), "a quiz gets a link with its questions");
  ok(await page.evaluate(() => !!__sbSync.state.decks.d1.aiQuizzes[0].shared), "the quiz remembers it's shared");
  await page.evaluate(() => __sbSync.dlg.close());

  // the deck link sheet lists it in the course library
  await actStay(page, "fc-share", {id: "d1"}); await page.waitForTimeout(400);
  if (await page.$("dialog[open] #grpMake")) { await page.click("dialog[open] #grpMake"); }
  await page.waitForSelector("dialog[open] #libOn", {timeout: 6000});
  ok(/BIOL 201 Course Library/.test(await txt(page, "#libRow")) && /uwaterloo\.ca|University of Waterloo/.test(await txt(page, "#libRow")), "the deck's link sheet offers its course library, at the school from the school site");
  await page.check("#libOn"); await page.waitForTimeout(300);
  const ll = (await calls(page, "library_list"))[0];
  ok(ll && ll[1].p_listed === true && ll[1].p_course_key === "BIOL201" && ll[1].p_school_key === "uwaterloo.ca", "listing sends the course code and school");
  // publishing to the public flashcards pages
  await page.waitForSelector("dialog[open] #pubOn");
  ok(/Publish to Studyboard Flashcards/.test(await txt(page, "#pubRow")), "the deck's Share sheet offers Publish to Studyboard Flashcards");
  await page.evaluate(() => { const st = __sbSync.state.settings; delete st.school; __sbSync.saveSettings(); });
  await page.evaluate(() => { delete window.__SV.school; });
  await page.click("#pubOn"); await page.waitForSelector("dialog[open] #schUseAuto", {timeout: 6000});
  await page.screenshot({path: shots + "/school-auto.png"});
  ok(/From your Brightspace sign-in/.test(await txt(page, "#schAuto")) && /University of Waterloo/.test(await txt(page, "#schAuto")), "publishing asks for a school first, filled in from the Brightspace connection");
  await page.click("#schUseAuto"); await page.waitForSelector("dialog[open] #pubOn");
  ok(await page.evaluate(() => __sbSync.state.settings.school.key === "uwaterloo.ca" && __sbSync.state.settings.school.v === 1 && window.__SV.school === "uwaterloo.ca"), "the school is kept, on this device and on the server");
  await page.check("#pubOn"); await page.waitForSelector("#askDlg[open]");
  ok(/anyone can see the cards, your display name and your school \(University of Waterloo\)/i.test(await txt(page, "#askDlg")), "publishing asks first and says what becomes public, the school included");
  await page.click("#askYes"); await page.waitForSelector("#pubUrlIn");
  ok(await page.evaluate(() => window.__SV.decks.find(d => d.code === "MYDK-0001").published === true), "Publish sends share_publish");
  ok((await page.inputValue("#pubUrlIn")) === "https://app.example.edu/flashcards/my-cells-mydk0001", "it shows the public page's address: " + await page.inputValue("#pubUrlIn"));
  await page.uncheck("#pubOn"); await page.waitForTimeout(300);
  ok(await page.evaluate(() => window.__SV.decks.find(d => d.code === "MYDK-0001").published === false) && !(await page.$("#pubUrlIn")), "unpublishing takes it down (no question needed)");
  await page.evaluate(() => __sbSync.dlg.close());
  // a quiz can be published from its Share sheet
  await actStay(page, "qz-share", {deck: "d1", id: "q1"}); await page.waitForSelector("dialog[open] #pubOn", {timeout: 6000});
  ok(/Publish to Studyboard Quizzes/.test(await txt(page, "#pubRow")), "a quiz's Share sheet offers Publish to Studyboard Quizzes");
  await page.evaluate(() => __sbSync.dlg.close());
  // the Publish button on a deck's page
  await page.evaluate(() => { __sbSync.ui.tab = "flashcards"; __sbSync.ui.fc = null; __sbSync.ui.deckId = "d3"; __sbSync.render(); }); await page.waitForTimeout(300);
  ok(/Publish/.test(await txt(page, '#view [data-act="pub-deck"]')), "a deck's page has a Publish button");
  await page.evaluate(() => document.querySelector('#view [data-act="pub-deck"]').click()); await page.waitForSelector("dialog[open] #pubGo");
  await page.screenshot({path: shots + "/publish-confirm.png"});
  ok(/University of Waterloo/.test(await txt(page, "dialog[open] .pub-sum")) && /BIOL 201/.test(await txt(page, "dialog[open] .pub-sum")) && /5 cards/.test(await txt(page, "dialog[open] .pub-sum")), "Publish shows the school, course and card count first");
  await page.click("#pubGo"); await page.waitForSelector("dialog[open] #pubOff");
  ok(await page.evaluate(() => { const d = window.__SV.decks.find(x => x.deck_id === "d3"); return !!d && d.published === true && d.card_count === 5; }), "it shares the deck and publishes it in one step");
  ok(/is live in Studyboard Flashcards/.test(await txt(page, "dialog[open]")) && /\/flashcards\/organelles-pubd/.test(await page.inputValue("#pubUrl2")), "then shows the live page's address");
  await page.evaluate(() => __sbSync.dlg.close()); await page.evaluate(() => __sbSync.render()); await page.waitForTimeout(200);
  ok(/Published/.test(await txt(page, '#view [data-act="pub-deck"]')), "the button then says Published");
  await page.evaluate(() => document.querySelector('#view [data-act="pub-deck"]').click()); await page.waitForSelector("dialog[open] #pubOff");
  await page.click("#pubOff"); await page.waitForSelector("#askDlg[open]"); await page.click("#askYes"); await page.waitForTimeout(300);
  ok(await page.evaluate(() => window.__SV.decks.find(x => x.deck_id === "d3").published === false && !__sbSync.state.decks.d3.published), "Unpublish takes the page down");
  await page.evaluate(() => { __sbSync.ui.deckId = "d1"; __sbSync.render(); }); await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('#view [data-act="pub-deck"]').click()); await page.waitForTimeout(300);
  ok(/at least 4 cards/.test(await page.evaluate(() => document.querySelector("#toast").textContent)), "a deck with fewer than 4 cards can't be published");
  // Explore opens the public pages
  await page.evaluate(() => { window.__opened = []; window.open = u => { window.__opened.push(u); return null; }; __sbSync.ui.tab = "flashcards"; __sbSync.ui.deckId = null; __sbSync.ui.fc = null; __sbSync.render(); });
  await page.click('[data-act="pub-explore"][data-id="flashcards"]');
  ok(await page.evaluate(() => window.__opened[0] === "https://app.example.edu/flashcards"), "Explore in Flashcards opens studyboardapp.com/flashcards (the website address)");

  // the course page and the library
  await page.evaluate(() => { __sbSync.ui.tab = "courses"; __sbSync.ui.courseId = "c1"; __sbSync.render(); }); await page.waitForTimeout(500); await page.evaluate(() => __sbSync.render()); await page.waitForTimeout(200);
  ok(/1 deck shared for BIOL 201/.test(await txt(page, ".lib-strip")), "the course page counts classmates' decks (not my own)");
  await page.click('.lib-strip [data-act="lib-open"]'); await page.waitForSelector("dialog[open] .lib-item");
  let names = await page.$$eval("dialog[open] .lib-item b", e => e.map(x => x.textContent));
  ok(names.includes("Cell Bio Basics") && !names.includes("Other School Deck"), "the library shows decks from my school only: " + names.join());
  await page.check("#libAll"); await page.waitForSelector("dialog[open] .lib-item"); await page.waitForTimeout(200);
  names = await page.$$eval("dialog[open] .lib-item b", e => e.map(x => x.textContent));
  ok(names.includes("Other School Deck") && /U of T/.test(await txt(page, "dialog[open] .lib-list")), "Other schools too adds them, with the school's name");
  await page.screenshot({path: shots + "/share-library.png"});
  await page.click('dialog[open] .lib-item[data-id="DECK-AAAA"]'); await page.waitForSelector("dialog[open] #shAdd");
  await page.click(`dialog[open] [data-act="share-report"]`); await page.waitForSelector("dialog[open] .sh-reasons");
  await page.check('input[name="reason"][value="cheating"]'); await page.click('dialog[open] button[type="submit"]'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => window.__SV.reports.length === 1 && window.__SV.reports[0].p_reason === "cheating" && window.__SV.reports[0].p_code === "DECK-AAAA"), "Report sends the reason");
  await act(page, "lib-preview", {}); await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "lib-preview"; b.dataset.id = "DECK-AAAA"; document.body.appendChild(b); b.click(); b.remove(); });
  await page.waitForSelector("dialog[open] #shAdd"); await page.click("#shAdd"); await page.waitForTimeout(400);
  ok(await page.evaluate(() => window.__SV.saves.includes("DECK-AAAA")), "adding a library deck counts a save");
  ok(await page.evaluate(() => Object.values(__sbSync.state.decks).some(d => d.sharedFrom && d.sharedFrom.code === "DECK-AAAA" && d.courseId === "c1")), "the copy goes in my matching course");
  ok(!errs.length, "no errors (sharing signed in): " + errs.join(" | ")); await ctx.close();

  // no school site: the library asks for the school first
  const seed2 = JSON.parse(JSON.stringify(SEED)); delete seed2.settings.brightspace;
  ({ctx, page, errs} = await boot(browser, 390, {me: "u1", seed: seed2}));
  await act(page, "lib-open", {}); await page.waitForSelector("dialog[open] #schQ");
  ok(!(await page.$("dialog[open] #schUseAuto")), "with no school site, nothing is suggested");
  await page.fill("dialog[open] #schQ", "zzz"); await page.waitForTimeout(500);
  ok(/No school by that name/.test(await txt(page, "#schList")), "only schools from the list can be picked");
  await page.fill("dialog[open] #schQ", "waterl"); await page.waitForSelector('dialog[open] .sch-item[data-key="uwaterloo.ca"]');
  await page.screenshot({path: shots + "/school-picker-phone.png"});
  await page.click('dialog[open] .sch-item[data-key="uwaterloo.ca"]');
  await page.waitForSelector("dialog[open] .lib-sheet"); await page.waitForTimeout(300);
  ok(await page.evaluate(() => __sbSync.state.settings.school && __sbSync.state.settings.school.key === "uwaterloo.ca" && __sbSync.state.settings.school.v === 1), "a school picked from the list is saved");
  await noOverflow(page, "library on a phone");
  ok(!errs.length, "no errors (school picker): " + errs.join(" | ")); await ctx.close();
}

(async () => {
  const browser = await chromium.launch({executablePath});
  try { await visitor(browser); await sharer(browser); }
  finally { await browser.close(); }
  console.log(`sharing.e2e: ${checks} checks passed`);
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
