// node tests/match-game.e2e.js [screenshot-dir]
const path = require("path"), fs = require("fs"), assert = require("assert");
const file = path.resolve(__dirname, "..", "index.html");
const shots = path.resolve(process.argv[2] || path.join(require("os").tmpdir(), "match-shots"));
fs.mkdirSync(shots, {recursive: true});
const {chromium, executablePath} = require("./pw");
let checks = 0; const ok = (c, m) => { checks++; assert(c, m); console.log("ok -", m); };

const LONG = "The process by which a population grows quickly at first and then slows as it approaches the carrying capacity of its environment, because resources such as food, water and space become limited and competition rises";
const card = (id, front, back, extra) => Object.assign({id, front, back, box: 2, due: "2030-01-01", seen: 3, right: 2, wrong: 1}, extra || {});
const SEED = {v: 2, courses: [{id: "c1", name: "Biology", code: "BIOL 201", color: "#3B6FE0"}], settings: {capacity: 15, dailyHours: 3}, updated: 1, tasks: [], notes: [],
  decks: [
    {id: "d1", name: "Ecology", courseId: "c1", created: 1, quizzes: [], aiQuizzes: [], cards: [
      card("k1", "Osmosis", "Water moving across a membrane"), card("k2", "Logistic growth", LONG), card("k3", "Niche", "A species' role in its ecosystem"),
      card("k4", "Biome", "A large region with a typical climate and life"), card("k5", "Keystone species", "A species others depend on heavily"),
      card("k6", "Producer", "Makes its own food"), card("k7", "Detritivore", "Eats dead matter"),
      card("k8", "Picture card", "Label", {img: {k: "a:x", w: 10, h: 10}}), card("k9", "Draft term", "Draft back", {draft: true}), card("k10", "", "Back only")]},
    {id: "d2", name: "Tiny", courseId: "c1", created: 2, quizzes: [], aiQuizzes: [], cards: [card("t1", "One", "1"), card("t2", "Two", "2")]}]};

function seedInit(seed){
  try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {}
}
// A small in-memory Supabase for the study group part
function stubInit(){
  const me = {id: "u1", email: "u1@x.com"}, NAMES = {u1: "Connor", u2: "Sam", u3: "Jo"}, now = new Date().toISOString();
  const mem = (g, u, role) => ({group_id: g, user_id: u, role, display_name: NAMES[u], joined_at: "2026-01-0" + u.slice(1)});
  const cards = [["s1", "Mitochondria", "Powerhouse of the cell"], ["s2", "Ribosome", "Makes protein"], ["s3", "Nucleus", "Holds DNA"], ["s4", "Golgi body", "Packages proteins"], ["s5", "Lysosome", "Breaks down waste"], ["s6", "Chloroplast", "Site of photosynthesis"]].map(([id, front, back]) => ({id, front, back}));
  const DB = {study_groups: [{id: "g1", name: "Bio Squad", course: "BIOL 201", owner_id: "u2", invite_code: "ABC-DEF", created_at: "2026-01-01", weekly_goal: 0, kind: "study", project_due: null}],
    group_members: [mem("g1", "u1", "member"), mem("g1", "u2", "owner"), mem("g1", "u3", "member")],
    group_items: [{id: "dk1", group_id: "g1", user_id: "u2", author_name: "Sam", kind: "deck", ref_id: "x", title: "Cell parts", data: {cards, quizzes: []}, created_at: now, updated_at: now},
      {id: "dk2", group_id: "g1", user_id: "u2", author_name: "Sam", kind: "deck", ref_id: "y", title: "Two cards", data: {cards: cards.slice(0, 2), quizzes: []}, created_at: now, updated_at: now},
      {id: "qz1", group_id: "g1", user_id: "u2", author_name: "Sam", kind: "quiz", ref_id: "d:q", title: "Cell quiz", data: {quiz: {id: "qid", questions: [{id: "qq1", type: "single", stem: "Which organelle makes ATP?", options: ["Nucleus", "Mitochondria"], correct: [1]}]}}, created_at: now, updated_at: now},
      {id: "bt-u2", group_id: "g1", user_id: "u2", author_name: "Sam", kind: "battle", ref_id: "", title: "battle", data: {v: 1, on: true, match: {dk1: {ms: 9000, at: now, anon: false}}}, created_at: now, updated_at: now},
      {id: "bt-u3", group_id: "g1", user_id: "u3", author_name: "Jo", kind: "battle", ref_id: "", title: "battle", data: {v: 1, on: false, match: {dk1: {ms: 99000, at: now, anon: true}}}, created_at: now, updated_at: now}],
    group_messages: [], study_profiles: [{user_id: "u1", display_name: "Connor"}], shared_decks: [], group_blocks: [], group_quiz_scores: [], group_misses: [], group_rsvps: [], group_stats: [], group_checkins: [], group_reactions: [], group_task_lists: [], group_tasks: [], group_peer_ratings: []};
  let n = 0; const nowIso = () => new Date().toISOString(), wait = v => new Promise(r => setTimeout(() => r(v), 15));
  window.__DB = DB; window.__calls = [];
  const mk = t => {
    const st = {f: [], op: "select", payload: null, one: false};
    const run = () => {
      const rows = DB[t] || (DB[t] = []), hit = rows.filter(r => st.f.every(f => f(r)));
      if (st.op === "insert") {
        const add = [].concat(st.payload).map(r => Object.assign({id: "r" + (++n), created_at: nowIso(), updated_at: nowIso(), user_id: me.id, author_name: NAMES[me.id]}, r));
        if (t === "group_items" && add.some(r => r.kind === "battle" && rows.some(x => x.kind === "battle" && x.group_id === r.group_id && x.user_id === r.user_id))) return wait({error: {code: "23505", message: "duplicate key value violates unique constraint \"group_items_one_battle\""}});
        add.forEach(r => rows.push(r)); window.__calls.push(["insert", t, st.payload]); return wait({data: st.one ? add[0] : add});
      }
      if (st.op === "update") { hit.forEach(r => Object.assign(r, JSON.parse(JSON.stringify(st.payload)), {updated_at: nowIso()})); window.__calls.push(["update", t, st.payload]); return wait({data: st.one ? JSON.parse(JSON.stringify(hit[0] || null)) : hit}); }
      if (st.op === "delete") { DB[t] = rows.filter(r => !hit.includes(r)); window.__calls.push(["delete", t]); return wait({data: null}); }
      return wait({data: st.one ? JSON.parse(JSON.stringify(hit[0] || null)) : JSON.parse(JSON.stringify(hit))});
    };
    const api = {select() { return api; }, eq(c, v) { st.f.push(r => r[c] === v); return api; }, neq(c, v) { st.f.push(r => r[c] !== v); return api; }, in(c, v) { st.f.push(r => v.includes(r[c])); return api; },
      gte(c, v) { st.f.push(r => r[c] >= v); return api; }, or() { return api; }, order() { return api; }, limit() { return api; },
      maybeSingle() { st.one = true; return run(); }, single() { st.one = true; return run(); }, insert(rows) { st.op = "insert"; st.payload = rows; return api; },
      update(p) { st.op = "update"; st.payload = p; return api; }, delete() { st.op = "delete"; return api; }, upsert(r) { st.op = "insert"; st.payload = r; return api; }, then(res, rej) { return run().then(res, rej); }};
    return api;
  };
  const client = {from: mk, rpc: (name, a) => { window.__calls.push(["rpc", name, a]); return wait({data: name === "top_misses" ? [] : name === "group_pro_status" ? (a.p_groups || []).map(g => ({group_id: g, active: true, by_user: "u1", by_owner: true})) : null}); },
    channel: name => { const c = {name, on() { return c; }, subscribe() { return c; }}; return c; }, removeChannel() {}};
  window.__sbGroupsStub = {user: me, client};
  try { localStorage.setItem("sb:grpName:u1", "Connor"); } catch (e) {}
}

async function boot(browser, opts){
  opts = opts || {};
  const ctx = await browser.newContext({viewport: {width: opts.w || 1280, height: opts.w && opts.w < 600 ? 844 : 900}, hasTouch: !!opts.touch, isMobile: !!opts.touch, colorScheme: opts.dark ? "dark" : "light", reducedMotion: opts.reduce ? "reduce" : "no-preference"});
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", c => { if (c.type() === "error" && !/net::ERR|CORS|Failed to load resource|supabase-js/.test(c.text())) errs.push("console: " + c.text().slice(0, 200)); });
  await page.addInitScript(seedInit, SEED);
  if (opts.groups) await page.addInitScript(stubInit);
  await page.goto("file://" + file); await page.waitForFunction(() => window.__sbMatch && window.SBMATCH); await page.waitForTimeout(900);
  return {ctx, page, errs};
}
const deckOf = (page, id) => page.evaluate(id => JSON.parse(JSON.stringify(window.__sbMatch.state().decks[id] || null)), id);
const openDeck = async (page, id) => { await page.evaluate(id => { const M = window.__sbMatch; M.ui.tab = "flashcards"; M.ui.fc = null; M.ui.deckId = id; M.render(); }, id); await page.waitForSelector(`[data-fc-deck="${id}"]`); };
const tiles = page => page.evaluate(() => { const R = window.__sbMatch.round(); return [...document.querySelectorAll("dialog[open] .mt-tile")].map(b => { const t = R.tiles[Number(b.dataset.mt)]; return {i: Number(b.dataset.mt), k: t.k, side: t.side, text: t.text, label: b.getAttribute("aria-label"), title: b.title, tag: b.tagName, cls: b.className, gone: !!t.gone}; }); });
const click = (page, i) => page.click(`dialog[open] .mt-tile[data-mt="${i}"]`);
async function solve(page){
  const ts = await tiles(page);
  for (const k of [...new Set(ts.map(t => t.k))]) {
    const a = ts.find(t => t.k === k && t.side === "t"), b = ts.find(t => t.k === k && t.side === "d");
    if (a.gone) continue;
    await click(page, a.i); await click(page, b.i);
  }
  await page.waitForSelector("dialog[open] [data-mt-done]");
}
const toastOf = page => page.evaluate(() => { const t = document.querySelector("#toast"); return t && t.classList.contains("show") ? t.textContent : ""; });
const txt = (page, sel) => page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.innerText.replace(/\s+/g, " ") : ""; }, sel);
const noOverflow = async (page, what) => { const o = await page.evaluate(() => { const d = document.querySelector("#dlg"), b = document.querySelector("#dlg .sheet-body"), g = document.querySelector("#dlg .mt-grid");
  const out = [...document.querySelectorAll("#dlg .mt-tile")].filter(t => { const r = t.getBoundingClientRect(); return r.left < -0.5 || r.right > innerWidth + 0.5; }).length;
  return {page: document.documentElement.scrollWidth - document.documentElement.clientWidth, dlg: d.scrollWidth - d.clientWidth, body: b ? b.scrollWidth - b.clientWidth : 0, grid: g ? g.scrollWidth - g.clientWidth : 0, out}; });
  ok(o.page <= 0 && o.dlg <= 0 && o.body <= 0 && o.grid <= 0 && o.out === 0, `no horizontal overflow ${what} (${JSON.stringify(o)})`); };

async function deckGame(browser){
  const {ctx, page, errs} = await boot(browser);
  await openDeck(page, "d1");
  const btn = await page.$('[data-fc-deck="d1"] [data-act="mt-start"]');
  ok(!!btn && (await btn.innerText()).trim() === "Match", "the deck page has a Match button next to Study and Make a Quiz");
  ok(await page.evaluate(() => { const a = [...document.querySelectorAll('[data-fc-deck="d1"] .row-actions .btn')].map(b => b.dataset.act); return a.indexOf("mt-start") === a.indexOf("fc-quiz") + 1; }), "Match sits right after Make a Quiz");
  const before = await deckOf(page, "d1");
  await btn.click(); await page.waitForSelector("dialog[open] [data-mt-play]");
  let ts = await tiles(page);
  ok(ts.length === 12 && ts.filter(t => t.side === "t").length === 6 && ts.filter(t => t.side === "d").length === 6, "12 tiles: 6 terms and 6 definitions");
  ok(ts.every(t => t.tag === "BUTTON" && /^(Term|Definition): /.test(t.label) && (t.title === t.text || t.title === "")), "tiles are buttons with screen reader labels (a title only when it adds something)");
  ok(!ts.some(t => /Picture card|Draft term|Back only|Label|Draft back/.test(t.text)), "image cards, draft cards and cards missing a side are left out");
  const round = await page.evaluate(() => window.__sbMatch.round().cards.map(c => c.id));
  ok(round.length === 6 && round.every(id => /^k[1-7]$/.test(id)), "six of the seven usable cards are in the round: " + round.join());
  ok(await page.evaluate(() => document.getElementById("mtTime").textContent) === "0.0" && await page.evaluate(() => !window.__sbMatch.round().t0), "the clock waits for the first tap");
  const long = ts.find(t => t.text === LONG);
  if (long) ok(/\bs3\b/.test(long.cls) && await page.evaluate(i => { const s = document.querySelector(`.mt-tile[data-mt="${i}"] .mt-tx`); return s.scrollHeight > s.clientHeight + 2 && getComputedStyle(s).webkitLineClamp !== "none"; }, long.i), "long text gets a smaller font and is clamped (full text in the title)");
  await page.screenshot({path: path.join(shots, "match-desktop.png")});
  ok(await page.evaluate(() => getComputedStyle(document.querySelector(".mt-grid")).gridTemplateColumns.split(" ").length) === 4, "desktop grid is 4 across (3 rows)");
  const t0 = ts.find(t => t.side === "t"), wrong = ts.find(t => t.side === "d" && t.k !== t0.k);
  await click(page, t0.i);
  ok(await page.evaluate(i => document.querySelector(`.mt-tile[data-mt="${i}"]`).getAttribute("aria-pressed"), t0.i) === "true", "the first tap selects a tile (aria-pressed)");
  await click(page, wrong.i);
  ok(await page.evaluate(([a, b]) => [a, b].every(i => document.querySelector(`.mt-tile[data-mt="${i}"]`).classList.contains("miss")), [t0.i, wrong.i]), "a wrong pair flashes red and shakes");
  const r1 = await page.evaluate(() => ({pen: window.__sbMatch.round().pen, miss: window.__sbMatch.round().miss, el: window.__sbMatch.elapsed(), say: document.getElementById("mtSay").textContent}));
  ok(r1.pen === 1000 && r1.miss === 1 && r1.el >= 1000, "a wrong pair adds a 1 second penalty: " + JSON.stringify(r1));
  await page.waitForTimeout(150);
  ok(/Not a match/.test(await page.evaluate(() => document.getElementById("mtSay").textContent)), "screen readers hear it was not a match");
  ok(await page.evaluate(() => window.__sbMatch.round().sel) === -1, "a wrong pair clears the selection");
  const t1 = ts.filter(t => t.side === "t")[1];
  await click(page, t0.i); await click(page, t1.i);
  ok(await page.evaluate(() => window.__sbMatch.round().pen) === 1000 && await page.evaluate(i => window.__sbMatch.round().sel === i, t1.i), "tapping two terms just moves the selection");
  await click(page, t1.i);
  await page.focus(`dialog[open] .mt-tile[data-mt="${t0.i}"]`); await page.keyboard.press("Enter");
  ok(await page.evaluate(i => window.__sbMatch.round().sel === i, t0.i), "Enter on a focused tile selects it");
  const p0 = ts.find(t => t.k === t0.k && t.side === "d"); await page.focus(`dialog[open] .mt-tile[data-mt="${p0.i}"]`); await page.keyboard.press("Enter");
  ok(await page.evaluate(([a, b]) => { const R = window.__sbMatch.round(); return R.tiles[a].gone && R.tiles[b].gone && R.left === 5; }, [t0.i, p0.i]), "a matched pair (by keyboard) is cleared");
  await page.waitForTimeout(400);
  ok(await page.evaluate(([a, b]) => [a, b].every(i => { const e = document.querySelector(`.mt-tile[data-mt="${i}"]`); return e.classList.contains("gone") && e.disabled && getComputedStyle(e).visibility === "hidden"; }), [t0.i, p0.i]), "matched tiles vanish but keep their place in the grid");
  ok(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains("mt-tile") && !document.activeElement.disabled), "focus moves on to a tile that is still in play");
  ok(/5 pairs to go/.test(await txt(page, "#mtLeft")), "the footer counts pairs left");
  await solve(page);
  let res = await txt(page, "dialog[open] .mt-res");
  const d1 = await deckOf(page, "d1");
  ok(d1.match && d1.match.best >= 1000 && typeof d1.match.at === "string" && !isNaN(Date.parse(d1.match.at)) && d1.match.recent.length === 1 && d1.match.recent[0].ms === d1.match.best, "the best time is saved on the deck: " + JSON.stringify(d1.match));
  ok(/Your time/.test(res) && /Includes 1 wrong pair/.test(res) && /first time on this deck/i.test(res) && !/New best/.test(res) && /Best time/.test(res), "the result shows the time, the penalty, and the best time: " + res);
  ok(await page.evaluate(() => [...document.querySelectorAll("dialog[open] .sheet-foot .btn")].map(b => b.textContent.trim()).join()) === "Done,Play Again", "Play Again and Done");
  ok(JSON.stringify(d1.cards.map(c => [c.id, c.box, c.due, c.seen, c.right, c.wrong])) === JSON.stringify(before.cards.map(c => [c.id, c.box, c.due, c.seen, c.right, c.wrong])), "spaced repetition is untouched (box, due, seen, right, wrong)");
  await page.screenshot({path: path.join(shots, "match-result.png")});
  await page.click('dialog[open] [data-act="mt-again"]'); await page.waitForSelector("dialog[open] [data-mt-play]");
  ts = await tiles(page); ok(ts.length === 12 && ts.every(t => !t.gone), "Play Again deals a fresh round");
  await solve(page);
  const d1b = await deckOf(page, "d1"); res = await txt(page, "dialog[open] .mt-res");
  ok(d1b.match.best < d1.match.best && d1b.match.recent.length === 2, "a faster round becomes the best, and recent times keep both: " + JSON.stringify(d1b.match));
  ok(/New best!/.test(res) && /No wrong pairs/.test(res), "the result says New best!: " + res);
  ok(await page.$$eval("dialog[open] .mt-recent li", l => l.length) === 2, "recent times are listed");
  await page.evaluate(() => { const M = window.__sbMatch, d = M.clone(M.state().decks.d1); d.match.recent = [1, 2, 3, 4, 5].map(i => ({ms: 50000 + i, at: i})); M.applyChanges([{kind: "deck", id: "d1", after: d}], null); });
  await page.click('dialog[open] [data-act="mt-again"]'); await page.waitForSelector("dialog[open] [data-mt-play]");
  await page.evaluate(() => { window.__sbMatch.round().pen = 60000; }); await solve(page);
  const d1c = await deckOf(page, "d1");
  ok(d1c.match.best === d1b.match.best && d1c.match.recent.length === 5 && d1c.match.recent[4].ms >= 60000 && !d1c.match.recent.some(r => r.ms === 50001), "a slower round keeps the best; only the last 5 times are kept: " + JSON.stringify(d1c.match.recent.map(r => r.ms)));
  ok(/off your best/.test(await txt(page, "dialog[open] .mt-res")), "a slower round says how far off the best it was");
  await page.click('dialog[open] .sheet-foot [data-act="close"]'); await page.waitForTimeout(200);
  ok(!(await page.evaluate(() => document.getElementById("dlg").open)), "Done closes the game");
  await openDeck(page, "d2"); await page.click('[data-fc-deck="d2"] [data-act="mt-start"]'); await page.waitForTimeout(200);
  ok(!(await page.evaluate(() => document.getElementById("dlg").open)) && /at least 3 cards/.test(await toastOf(page)), "fewer than 3 cards: a friendly message, no game: " + await toastOf(page));
  await openDeck(page, "d1"); await page.click('[data-fc-deck="d1"] [data-act="mt-start"]'); await page.waitForSelector("dialog[open] [data-mt-play]");
  ts = await tiles(page); await click(page, ts[0].i); await page.keyboard.press("Escape"); await page.waitForTimeout(250);
  ok(await page.evaluate(() => window.__sbMatch.round() === null), "closing the sheet mid-round ends it");
  ok((await deckOf(page, "d1")).match.recent.length === 5 && (await deckOf(page, "d1")).match.best === d1b.match.best, "a quit round saves nothing");
  ok(errs.length === 0, "deck game: no page errors " + errs.join(" | "));
  await ctx.close();
}

async function phone(browser, dark){
  const tag = dark ? "phone dark" : "phone";
  const {ctx, page, errs} = await boot(browser, {w: 390, touch: true, dark});
  await openDeck(page, "d1"); await page.waitForSelector('[data-fc-deck="d1"] .ra-more-btn');
  await page.click('[data-fc-deck="d1"] .ra-more-btn'); await page.click('[data-fc-deck="d1"] .ra-menu [data-act="mt-start"]');
  await page.waitForSelector("dialog[open] [data-mt-play]"); await page.waitForTimeout(300);
  ok(await page.evaluate(() => getComputedStyle(document.querySelector(".mt-grid")).gridTemplateColumns.split(" ").length) === 3, tag + ": 3 tiles across (4 rows)");
  await noOverflow(page, tag + " while playing");
  const sz = await page.evaluate(() => [...document.querySelectorAll(".mt-tile")].map(t => { const r = t.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
  ok(sz.every(([w, h]) => w >= 44 && h >= 44), tag + ": every tile is a comfortable tap target " + JSON.stringify(sz.slice(0, 3)));
  ok(await page.evaluate(() => { const g = document.querySelector(".mt-grid").getBoundingClientRect(); return g.bottom <= innerHeight + 1; }), tag + ": the whole grid fits on screen");
  await page.screenshot({path: path.join(shots, `match-${dark ? "phone-dark" : "phone"}.png`)});
  if (!dark) {
    const ts = await tiles(page), t = ts.find(x => x.text === LONG) || ts[0];
    const box = await page.$(`dialog[open] .mt-tile[data-mt="${t.i}"]`).then(e => e.boundingBox());
    const cdp = await ctx.newCDPSession(page);
    const pt = {x: box.x + box.width / 2, y: box.y + box.height / 2};
    await cdp.send("Input.dispatchTouchEvent", {type: "touchStart", touchPoints: [pt]}); await page.waitForTimeout(650);
    ok(await page.evaluate(() => { const p = document.querySelector(".mt-peek"); return p ? p.textContent : ""; }) === t.text, tag + ": a long press shows the full text");
    await cdp.send("Input.dispatchTouchEvent", {type: "touchEnd", touchPoints: []}); await page.waitForTimeout(150);
    ok(await page.evaluate(() => window.__sbMatch.round().sel) === -1, tag + ": the long press didn't pick the tile");
    await solve(page); await page.waitForTimeout(200);
    await noOverflow(page, tag + " on the result");
    await page.screenshot({path: path.join(shots, "match-phone-result.png")});
  }
  ok(errs.length === 0, tag + ": no page errors " + errs.join(" | "));
  await ctx.close();
}

async function reduced(browser){
  const {ctx, page, errs} = await boot(browser, {reduce: true});
  await openDeck(page, "d1"); await page.click('[data-fc-deck="d1"] [data-act="mt-start"]'); await page.waitForSelector("dialog[open] [data-mt-play]");
  ok(await page.$("dialog[open] .mt-sheet.mt-still") !== null, "reduced motion: the game knows to keep still");
  const ts = await tiles(page), a = ts.find(t => t.side === "t"), b = ts.find(t => t.side === "d" && t.k === a.k), w = ts.find(t => t.side === "d" && t.k !== a.k);
  await click(page, a.i); await click(page, w.i);
  ok(await page.evaluate(i => getComputedStyle(document.querySelector(`.mt-tile[data-mt="${i}"]`)).animationName, a.i) === "none", "reduced motion: no shake on a wrong pair (still marked red)");
  await click(page, a.i); await click(page, b.i); await page.waitForTimeout(40);
  ok(await page.evaluate(i => document.querySelector(`.mt-tile[data-mt="${i}"]`).classList.contains("gone"), a.i), "reduced motion: a match vanishes at once");
  await page.keyboard.press("Escape"); await ctx.close();
  const b2 = await boot(browser);
  await b2.page.evaluate(() => { try { window.SBMotion.setPref("off"); } catch (e) {} });
  await openDeck(b2.page, "d1"); await b2.page.click('[data-fc-deck="d1"] [data-act="mt-start"]'); await b2.page.waitForSelector("dialog[open] [data-mt-play]");
  ok(await b2.page.$("dialog[open] .mt-sheet.mt-still") !== null, "Settings > Animations Off also keeps the game still");
  ok(errs.length === 0 && b2.errs.length === 0, "reduced motion: no page errors " + errs.concat(b2.errs).join(" | "));
  await b2.ctx.close();
}

async function group(browser){
  const {ctx, page, errs} = await boot(browser, {groups: true});
  const act = a => page.evaluate(a => { const b = document.createElement("button"); b.dataset.act = a; document.body.appendChild(b); b.click(); b.remove(); }, a);
  await act("grp-page"); await page.waitForSelector('[data-act="grp-open"][data-id="g1"]'); await page.click('[data-act="grp-open"][data-id="g1"]');
  await page.waitForSelector("#grpDecks .grp-item"); await page.waitForTimeout(600);
  ok(await page.$('#grpDecks [data-act="grp-match"][data-id="dk1"]') !== null, "group: a shared deck has a Match button");
  ok(await page.$('#grpDecks [data-act="grp-match"][data-id="dk2"]') === null, "group: no Match button on a shared deck with fewer than 3 cards");
  const decksBefore = await page.evaluate(() => Object.keys(window.__sbMatch.state().decks).length);
  await page.click('#grpDecks [data-act="grp-match"][data-id="dk1"]'); await page.waitForSelector("dialog[open] [data-mt-play]");
  ok(/Cell parts/.test(await txt(page, "dialog[open] .mt-name")) && (await tiles(page)).length === 12, "group: Match plays the shared deck's cards");
  await solve(page); await page.waitForSelector("#mtAfter .mt-grp");
  ok(await page.evaluate(() => Object.keys(window.__sbMatch.state().decks).length) === decksBefore, "group: playing doesn't add a copy of the deck");
  let panel = await txt(page, "#mtAfter");
  ok(/Post your time to Bio Squad/.test(panel) && /Post With My Name/.test(panel) && /Post Anonymously/.test(panel), "group: afterwards it offers to post the time, with my name or anonymously: " + panel);
  ok(/Sam/.test(panel) && /9\.0 s/.test(panel) && /Anonymous member/.test(panel) && /1:39\.0 s/.test(panel) && !/\bJo\b/.test(panel), "group: the board shows posted times; an anonymous one has no name: " + panel);
  ok(await page.evaluate(() => !window.__DB.group_items.some(i => i.kind === "battle" && i.user_id === "u1")), "group: nothing is posted until I choose");
  await page.screenshot({path: path.join(shots, "match-group-offer.png")});
  await page.click('#mtAfter [data-act="grp-mt-post"][data-anon="1"]'); await page.waitForTimeout(300);
  let mine = await page.evaluate(() => JSON.parse(JSON.stringify(window.__DB.group_items.find(i => i.kind === "battle" && i.user_id === "u1") || null)));
  const myMs = await page.evaluate(() => window.__sbMatch.round().ms);
  ok(mine && mine.data.on === false && mine.data.match.dk1.ms === myMs && mine.data.match.dk1.anon === true, "group: my time is posted, anonymously, in my battle item (not joining the Quiz Battle): " + JSON.stringify(mine && mine.data));
  panel = await txt(page, "#mtAfter");
  ok(/You \(anonymous\)/.test(panel) && /Remove My Time/.test(panel) && !/Post With My Name/.test(panel), "group: the board shows me as anonymous and offers Remove My Time: " + panel);
  ok(await page.evaluate(() => document.querySelector("#mtAfter .mt-lb li.me .rk").textContent) === "1", "group: the fastest time is first");
  await page.screenshot({path: path.join(shots, "match-group-posted.png")});
  await page.click('#mtAfter [data-act="grp-mt-del"]'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => !window.__DB.group_items.some(i => i.kind === "battle" && i.user_id === "u1")), "group: Remove My Time takes it off the server");
  ok(/Post With My Name/.test(await txt(page, "#mtAfter")) && !/You/.test(await txt(page, "#mtAfter .mt-lb")), "group: and off the board");
  await page.click('#mtAfter [data-act="grp-mt-post"][data-anon="0"]'); await page.waitForTimeout(300);
  ok(/Connor/.test(await txt(page, "#mtAfter .mt-lb")) && /\(You\)/.test(await txt(page, "#mtAfter .mt-lb")), "group: posted with my name");
  await page.keyboard.press("Escape"); await page.waitForTimeout(200);
  await page.click('[data-act="grp-tab"][data-t="challenge"]'); await page.waitForTimeout(150);
  ok(/Join the Battle/.test(await txt(page, "#grpBattle")) && !/Connor/.test(await txt(page, "#grpBattle")), "group: posting a Match time doesn't put me in the Quiz Battle");
  await page.click('#grpBattle [data-act="grp-battle"][data-on="1"]'); await page.waitForTimeout(400);
  mine = await page.evaluate(() => JSON.parse(JSON.stringify(window.__DB.group_items.filter(i => i.kind === "battle" && i.user_id === "u1"))));
  ok(mine.length === 1 && mine[0].data.on === true && mine[0].data.match.dk1.ms === myMs && /Leave the Battle/.test(await txt(page, "#grpBattle")), "group: joining the battle reuses my item and keeps my time");
  await page.click('#grpBattle [data-act="grp-battle"][data-on="0"]'); await page.waitForTimeout(400);
  mine = await page.evaluate(() => JSON.parse(JSON.stringify(window.__DB.group_items.filter(i => i.kind === "battle" && i.user_id === "u1"))));
  ok(mine.length === 1 && mine[0].data.on === false && mine[0].data.match.dk1.ms === myMs && /Join the Battle/.test(await txt(page, "#grpBattle")), "group: leaving the battle keeps my posted Match time");
  await page.click('[data-act="grp-tab"][data-t="study"]'); await page.waitForTimeout(100);
  await page.click('#grpDecks [data-act="grp-match"][data-id="dk1"]'); await page.waitForSelector("dialog[open] [data-mt-play]");
  await page.evaluate(() => { window.__sbMatch.round().pen = 30000; }); await solve(page); await page.waitForSelector("#mtAfter .mt-grp");
  ok(/Your posted time is/.test(await txt(page, "#mtAfter")) && !(await page.$('#mtAfter [data-act="grp-mt-post"]')), "group: a slower round leaves the posted time alone");
  ok(errs.length === 0, "group: no page errors " + errs.join(" | "));
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch({executablePath});
  try { await deckGame(browser); await phone(browser, false); await phone(browser, true); await reduced(browser); await group(browser); }
  finally { await browser.close(); }
  console.log(`match-game.e2e.js: ${checks} checks passed. Screenshots in ${shots}`);
})().catch(e => { console.error("FAILED:", e.message.split("\n")[0], (e.stack.match(/match-game.e2e.js:\d+/g) || []).join(" ")); process.exit(1); });
