// node tests/credits.e2e.js (Playwright + Chromium): Studyboard Credits in the Style Shop, and Studyboard Plus in the Pro sheet
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
    const ctx = await browser.newContext({serviceWorkers: "block"});
    await ctx.addInitScript(cfg => { window.__SB_TEST = true; try { localStorage.setItem("studyboard:paywall-test", "1"); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:plancfg", JSON.stringify(cfg)); } catch (e) {} }, CFG);
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base);
    await page.waitForFunction(() => window.SBCREDITS && window.SBTP && window.__sbCollPreview && window.__sbCollPreview.state && window.__sbCollPreview.state.settings, null, {timeout: 40000});

    // A fake server: the balance, the items and the prices live here, like studyboard_credits_me and studyboard_buy_item
    await page.evaluate(() => {
      const srv = window.__crSrv = {balance: 350, owned: [], calls: []};
      const prices = {skin: 300, sticker: 100, card: 100, pin: 50};
      const me = () => ({on: true, balance: srv.balance, owned: srv.owned.slice(), prices, packs: [
        {id: "credits_100", credits: 100, cents: 99, currency: "usd", label: "100 Credits"}, {id: "credits_300", credits: 300, cents: 299, currency: "usd"},
        {id: "credits_600", credits: 600, cents: 499, currency: "usd", badge: "20% Bonus"}, {id: "credits_1300", credits: 1300, cents: 999, currency: "usd", badge: "Best Value"}]});
      const client = {rpc: async (fn, args) => {
        srv.calls.push([fn, args]);
        if (fn === "studyboard_credits_me") return {data: me(), error: null};
        if (fn === "studyboard_buy_item") {
          const cost = prices[args.p_kind];
          if (srv.owned.some(x => x[0] === args.p_kind && x[1] === args.p_item)) return {data: {ok: true, already: true, balance: srv.balance}, error: null};
          if (srv.balance < cost) return {data: {error: "not_enough", balance: srv.balance, cost}, error: null};
          srv.balance -= cost; srv.owned.push([args.p_kind, args.p_item]);
          return {data: {ok: true, balance: srv.balance, cost}, error: null};
        }
        return {data: null, error: {message: "unknown"}};
      }};
      window.SBCREDITS.fake(client, {id: "11111111-2222-4333-8444-555555555555", email: "a@b.co"});
    });
    await page.waitForFunction(() => window.SBCREDITS.state() && window.SBCREDITS.balance() === 350, null, {timeout: 10000});
    ok(true, "the balance loads from the server");

    // Pick a Pro Theme Collection with a sticker pack and pins, and one with a separately sold pin
    const pick = await page.evaluate(() => {
      const T = window.SBTP, C = window.__sbCollPreview;
      const th = T.ordered().find(id => { const r = T.rec(id); return r && r.pack && r.pins.length && r.card && !C.owns("skin", id); });
      const r = T.rec(th);
      const other = T.ordered().find(id => id !== th && T.rec(id) && T.rec(id).pins.length && !C.owns("skin", id));
      return {th, pack: r.pack, pin: r.pins[0], card: r.card, otherPin: T.rec(other).pins[0], otherTh: other};
    });
    ok(!!pick.th, "found a Pro Theme Collection (" + pick.th + ")");
    const before = await page.evaluate(p => ({skin: window.__sbCollPreview.owns("skin", p.th), pack: window.__sbCollPreview.owns("sticker", p.pack), price: window.SBCREDITS.priceOf("skin", p.th), pinPrice: window.SBCREDITS.priceOf("pin", p.pin), freePin: window.SBCREDITS.priceOf("pin", "pin"), note: window.SBCREDITS.priceOf("note", "torn")}), pick);
    ok(!before.skin && !before.pack, "a free account doesn't own the collection yet");
    ok(before.price === 300 && before.pinPrice === 50, "a collection costs 300 credits and a pin 50");
    ok(before.freePin === 0 && before.note === 0, "free items and note shapes can't be bought");

    // The Style Shop shows the balance and prices on locked items
    await page.evaluate(() => window.SBCREDITS.shop());
    await page.waitForSelector(".cr-bar", {timeout: 10000});
    ok((await page.textContent(".cr-bar")).includes("350"), "the Style Shop shows the balance");
    await page.waitForFunction(() => [...document.querySelectorAll('[data-act="shop-unlock"]')].some(b => /Credits/.test(b.textContent)), null, {timeout: 10000});
    ok(true, "locked items show their price in credits");

    // Tapping a locked collection opens the buy sheet with what's included
    await page.evaluate(th => window.SBCREDITS.unlock("skin", th), pick.th);
    await page.waitForSelector('.cr-sheet [data-act="cr-buy"]', {timeout: 10000});
    const sheet = await page.textContent(".cr-sheet");
    ok(/300 Credits/.test(sheet) && /Comes With/.test(sheet) && /sticker/i.test(sheet) && /pin/i.test(sheet) && /flashcard style/i.test(sheet), "the buy sheet lists the theme, stickers, pins and flashcard style");
    await page.click('.cr-sheet [data-act="cr-buy"]');
    await page.waitForFunction(th => window.__sbCollPreview.owns("skin", th), pick.th, {timeout: 10000});
    const after = await page.evaluate(p => {
      const C = window.__sbCollPreview;
      return {skin: C.owns("skin", p.th), pack: C.owns("sticker", p.pack), pin: C.owns("pin", p.pin), card: C.owns("card", p.card), other: C.owns("pin", p.otherPin), bal: window.SBCREDITS.balance(), srv: window.__crSrv.balance};
    }, pick);
    ok(after.skin && after.pack && after.pin && after.card, "the collection brings its theme, sticker pack, pins and flashcard style for good");
    ok(!after.other, "another collection's pin stays locked");
    const comps = await page.evaluate(p => { const ids = window.SBCREDITS.comps(p.th), other = window.SBCREDITS.comps(p.otherTh);
      return {n: ids.length, owned: ids.every(id => window.__sbCollPreview.owns("comp", id)), otherLocked: other.every(id => !window.__sbCollPreview.owns("comp", id)), listed: window.SBCREDITS.contents(p.th).some(x => /companion/i.test(x))}; }, pick);
    ok(comps.n > 0 && comps.owned && comps.listed, `the collection's ${comps.n} companions come with it`);
    ok(comps.otherLocked, "another collection's companions stay locked");
    ok(after.bal === 50 && after.srv === 50, "300 credits were spent on the server and here");

    // After buying, the Style Shop comes back (and redraws once the server confirms)
    await page.waitForFunction(() => !document.querySelector(".cr-sheet") && document.querySelector(".cr-bar") && /\b50\b/.test(document.querySelector(".cr-bar").textContent), null, {timeout: 10000});
    ok(true, "after buying, the Style Shop comes back with the new balance");
    await page.waitForTimeout(400);

    // Not enough credits: the sheet offers credit packs instead
    await page.evaluate(th => { window.SBCREDITS.buySheet("skin", th); }, pick.otherTh);
    await page.waitForSelector(".cr-sheet", {timeout: 5000});
    ok(/You need 250 more/.test(await page.textContent(".cr-sheet")) && !!(await page.$('.cr-sheet [data-act="cr-packs"]')), "short of credits, it says how many more and offers credit packs");
    await page.click('.cr-sheet [data-act="cr-packs"]');
    await page.waitForSelector(".cr-pack", {timeout: 5000});
    const packs = await page.$$eval(".cr-pack", els => els.map(e => e.textContent.replace(/\s+/g, " ").trim()));
    ok(packs.length === 4 && /1,300 credits/.test(packs[3]) && /\$9\.99/.test(packs[3]) && /\$0\.99/.test(packs[0]), "the four credit packs show with their prices");
    const sent = await page.evaluate(async () => { let body = null; const P = window.__sbPlanObj(); P.checkoutCall = async b => { body = b; return {message: "test"}; }; document.querySelector('.cr-pack[data-id="credits_600"]').click(); await new Promise(r => setTimeout(r, 200)); return body; });
    ok(sent && sent.pack === "credits_600" && !("price" in sent) && !("credits" in sent), "buying a pack sends only the pack id (the server sets the price)");

    // A single pin for 50 credits
    await page.evaluate(p => window.SBCREDITS.buySheet("pin", p.otherPin), pick);
    await page.waitForSelector('.cr-sheet [data-act="cr-buy"]', {timeout: 5000});
    ok(/Theme Collection/.test(await page.textContent(".cr-sheet")), "a collection's pin also points to its whole collection");
    await page.click('.cr-sheet [data-act="cr-buy"]');
    await page.waitForFunction(p => window.__sbCollPreview.owns("pin", p.otherPin), pick, {timeout: 5000});
    await page.waitForTimeout(800);
    ok(await page.evaluate(() => window.SBCREDITS.balance() === 0), "a pin costs 50 credits");

    // Studyboard Plus is offered under the Pro prices, and sends plan "plus"
    await page.evaluate(() => window.__sbPlanObj().openSheet(""));
    await page.waitForSelector(".plan-sheet .plan-plus", {timeout: 5000});
    const plusTxt = await page.textContent(".plan-sheet .plan-plus");
    ok(/\$2\.99/.test(plusTxt) && /Studyboard AI/.test(plusTxt), "the Pro sheet offers Studyboard Plus at $2.99 without Studyboard AI");
    ok(/Not in Plus/.test(await page.textContent(".plan-compare")), "the comparison says Studyboard AI isn't in Plus");

    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs[0] : ""));
    console.log("\ncredits: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
