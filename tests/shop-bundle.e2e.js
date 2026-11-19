// node tests/shop-bundle.e2e.js (Playwright + Chromium): Build Your Look in the Style Shop, bought as one bundle with credits
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const CFG = {rows: {paywall: true, item_purchases: true, plus_plan: true, prices: {monthly: "$4.99", semester: "$15.99", yearly: "$39.99", plusMonthly: "$2.99", currency: "USD", trialDays: 14}}, at: Date.now()};

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: 1280, height: 900}});
    await ctx.addInitScript(cfg => { window.__SB_TEST = true; try { localStorage.setItem("studyboard:paywall-test", "1"); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:plancfg", JSON.stringify(cfg)); } catch (e) {} }, CFG);
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base);
    await page.waitForFunction(() => window.SBCREDITS && window.SBTP && window.SBSHOPHOME, null, {timeout: 40000});
    // A fake server, like studyboard_credits_me, studyboard_buy_item and studyboard_buy_bundle
    await page.evaluate(() => {
      const srv = window.__crSrv = {balance: 400, owned: [], calls: []};
      const prices = {skin: 300, sticker: 100, card: 100, pin: 50, note: 100, cm: 100};
      const me = () => ({on: true, balance: srv.balance, owned: srv.owned.slice(), prices, packs: []});
      const client = {rpc: async (fn, args) => {
        srv.calls.push([fn, args]);
        if (fn === "studyboard_credits_me") return {data: me(), error: null};
        if (fn === "studyboard_buy_item") {
          const cost = prices[args.p_kind];
          if (srv.balance < cost) return {data: {error: "not_enough", balance: srv.balance, cost}, error: null};
          srv.balance -= cost; srv.owned.push([args.p_kind, args.p_item]);
          return {data: {ok: true, balance: srv.balance, cost}, error: null};
        }
        if (fn === "studyboard_buy_bundle") {
          if (srv.owned.some(x => x[0] === "skin" && x[1] === args.p_theme)) return {data: {error: "own_theme", balance: srv.balance}, error: null};
          if (srv.balance < prices.skin) return {data: {error: "not_enough", balance: srv.balance, cost: prices.skin}, error: null};
          srv.balance -= prices.skin; srv.owned.push(["skin", args.p_theme]); args.p_items.forEach(x => srv.owned.push(x));
          return {data: {ok: true, balance: srv.balance, cost: prices.skin}, error: null};
        }
        return {data: null, error: {message: "unknown"}};
      }};
      window.SBCREDITS.fake(client, {id: "11111111-2222-4333-8444-555555555555", email: "a@b.co"});
    });
    await page.waitForFunction(() => window.SBCREDITS.balance() === 400, null, {timeout: 10000});
    // Concept map styles are sold one by one: 100 credits each
    const map = await page.evaluate(() => window.SBCMSTYLE.ids().find(id => id !== "theme" && id !== "plain" && !window.SBCMSTYLE.free(id)));
    ok(map && await page.evaluate(id => window.SBCREDITS.priceOf("cm", id) === 100 && !window.SBCMSTYLE.owned(id), map), "a subject map style costs 100 credits and starts locked");
    await page.evaluate(() => window.SBCREDITS.shop());
    await page.waitForSelector(".sbh-home", {timeout: 10000});
    await page.click('.sbh-types [data-act="sbh-go"][data-id="maps"]');
    await page.waitForSelector(".sbh-k-cm", {timeout: 5000});
    ok(/Concept Map Styles/.test(await page.textContent(".sbh-back")) && await page.locator(".sbh-k-cm .sbh-tag.cost").count() > 0, "Map Styles has its own page with prices");
    await page.evaluate(id => window.SBCREDITS.unlock("cm", id), map);
    await page.waitForSelector('.sbc-sheet [data-act="sbc-buy"]', {timeout: 10000});
    ok(/100 credits/i.test(await page.textContent(".sbc-sheet")) && /Concept Map Style/.test(await page.textContent(".sbc-sheet")), "the buy sheet shows the map style at 100 credits");
    await page.click('.sbc-sheet [data-act="sbc-buy"]');
    await page.waitForFunction(id => window.SBCMSTYLE.owned(id), map, {timeout: 10000});
    ok(await page.evaluate(() => window.SBCREDITS.balance()) === 300, "buying it takes 100 credits and the style is unlocked for maps");
    await page.evaluate(() => { window.__crSrv.balance = 400; return window.SBCREDITS.load(); });
    await page.waitForFunction(() => window.SBCREDITS.balance() === 400, null, {timeout: 10000});
    if (await page.evaluate(() => !!document.querySelector("dialog[open]"))) await page.evaluate(() => document.querySelector("dialog[open]").close());
    // a Pro theme with a Collection, and a Pro note shape that isn't part of it
    const pick = await page.evaluate(() => ({th: SBTP.ordered().find(id => window.SBCREDITS.priceOf("skin", id) > 0), cm: window.SBCMSTYLE.ids().filter(id => window.SBCREDITS.priceOf("cm", id) > 0)[1]}));
    ok(pick.th && pick.cm, "there is a Pro theme and a map style for sale to build a look from");
    await page.evaluate(() => window.SBCREDITS.shop());
    await page.waitForSelector(".sbh-home", {timeout: 10000});
    await page.evaluate(th => { const b = document.createElement("button"); b.dataset.act = "sbh-try"; b.dataset.kind = "skin"; b.dataset.id = th; document.body.appendChild(b); b.click(); b.remove(); }, pick.th);
    await page.waitForSelector(".sbh-look", {timeout: 10000});
    const slots = await page.$$eval(".sbh-slot-t em", e => e.map(x => x.textContent));
    ok(/^Theme,(Companion|All \d+ Companions),Flashcard Style,(Pin|All \d+ Pins),Concept Map Style$/.test(slots.join()), "Build Your Look has five slots, no stickers or note shapes: " + slots.join());
    await page.click('[data-act="sbh-slot"][data-id="cm"]');
    await page.click(`[data-act="sbh-pick"][data-slot="cm"][data-id="${pick.cm}"]`);
    await page.waitForSelector('[data-act="sbh-bundle"]', {timeout: 5000});
    const sum = await page.textContent(".sbh-sum");
    ok(/This look, together\s*300 credits/.test(sum) && /Bought one by one/.test(sum), "the summary shows the look's one price against buying it piece by piece: " + sum.replace(/\s+/g, " ").trim());
    ok(/Get This Look · 300 credits/.test(await page.textContent('[data-act="sbh-bundle"]')), "one button gets the whole look");
    // Leaving Build Your Look and coming back keeps the picked pieces and the comparison
    await page.click('.sbh-seg [data-id="yours"]'); await page.waitForTimeout(300);
    await page.click('.sbh-seg [data-id="home"]'); await page.waitForTimeout(300);
    await page.click('.sbh-build'); await page.waitForSelector('[data-act="sbh-bundle"]', {timeout: 5000});
    const sum2 = await page.textContent(".sbh-sum");
    ok(/Bought one by one/.test(sum2) && /plus /.test(sum2), "coming back, the comparison and the picked map style are still there: " + sum2.replace(/\s+/g, " ").trim());
    await page.evaluate(() => { document.querySelector("dialog[open]").close(); window.SBCREDITS.shop(); }); await page.waitForSelector(".sbh-home", {timeout: 10000});
    await page.click('.sbh-build'); await page.waitForSelector('[data-act="sbh-bundle"]', {timeout: 5000});
    const sum3 = await page.textContent(".sbh-sum");
    ok(/Bought one by one/.test(sum3), "the picks are kept after the shop is closed and opened again: " + sum3.replace(/\s+/g, " ").trim());
    await page.click('[data-act="sbh-bundle"]');
    await page.waitForFunction(() => window.SBCREDITS.balance() === 100, null, {timeout: 10000});
    const call = await page.evaluate(() => window.__crSrv.calls.find(c => c[0] === "studyboard_buy_bundle"));
    ok(call && call[1].p_theme === pick.th && call[1].p_items.some(x => x[0] === "cm" && x[1] === pick.cm) && call[1].p_items.every(x => ["card", "pin", "cm"].includes(x[0])) && call[1].p_items.length <= 5, "one call buys the theme and the picked pieces: " + JSON.stringify(call && call[1]));
    const own = await page.evaluate(p => ({skin: window.SBCREDITS.owns("skin", p.th), note: window.SBCMSTYLE.owned(p.cm), comps: window.SBCREDITS.comps(p.th).every(id => window.__sbCollPreview.owns("comp", id))}), pick);
    ok(own.skin && own.note && own.comps, "the theme, its companions and the map style are now owned");
    ok(await page.evaluate(th => ((window.__sbCollPreview.state.settings || {}).style || {}).skin === th, pick.th), "the new look is put on");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs[0] : ""));
    console.log("\nshop-bundle: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
