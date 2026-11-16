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
      const prices = {skin: 300, sticker: 100, card: 100, pin: 50, note: 100};
      const me = () => ({on: true, balance: srv.balance, bought: !!srv.bought, owned: srv.owned.slice(), prices, packs: [
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
    ok(before.freePin === 0, "free items can't be bought");
    const notes = await page.evaluate(() => ({torn: window.SBCREDITS.priceOf("note", "torn"), classic: window.SBCREDITS.priceOf("note", "classic")}));
    ok(notes.torn === 100 && notes.classic === 0, "a Pro note shape costs 100 credits; free shapes aren't sold");

    // The Style Shop shows the balance and prices on locked items
    await page.evaluate(() => window.SBCREDITS.shop());
    await page.waitForSelector(".sheet-head .sbc-pill", {timeout: 10000});
    ok((await page.textContent(".sbc-pill")).includes("350"), "the Style Shop's header shows the balance");
    const pillFixed = await page.evaluate(() => { const b = document.querySelector(".shop-wrap > .sheet-body, .sheet.shop .sheet-body"); const p = document.querySelector(".sbc-pill"); const y0 = p.getBoundingClientRect().top; b.scrollTop = 2000; return Math.abs(p.getBoundingClientRect().top - y0) < 1 && b.scrollTop > 0; });
    ok(pillFixed, "the balance stays in view while the shop's list scrolls");
    await page.waitForFunction(() => [...document.querySelectorAll('[data-act="shop-unlock"]')].some(b => /Credits/.test(b.textContent)), null, {timeout: 10000});
    ok(true, "locked items show their price in credits");

    // Tapping a locked collection opens the buy sheet with what's included
    await page.evaluate(th => window.SBCREDITS.unlock("skin", th), pick.th);
    await page.waitForSelector('.sbc-sheet [data-act="sbc-buy"]', {timeout: 10000});
    const sheet = await page.textContent(".sbc-sheet");
    ok(/300 credits/i.test(sheet) && /companions/i.test(sheet) && /stickers/i.test(sheet) && /pins/i.test(sheet) && /flashcard/i.test(sheet), "the buy sheet shows the theme, companions, stickers, pins and flashcard style");
    await page.click('.sbc-sheet [data-act="sbc-buy"]');
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
    await page.waitForFunction(() => !document.querySelector(".sbc-sheet") && document.querySelector(".sbc-pill") && /(^|\D)50(\D|$)/.test(document.querySelector(".sbc-pill").textContent), null, {timeout: 10000});
    ok(true, "after buying, the Style Shop comes back with the new balance");
    await page.waitForTimeout(400);

    // Not enough credits: the sheet offers credit packs instead
    await page.evaluate(th => { window.SBCREDITS.buySheet("skin", th); }, pick.otherTh);
    await page.waitForSelector(".sbc-sheet", {timeout: 5000});
    ok(/250 more needed/.test(await page.textContent(".sbc-sheet")) && !!(await page.$('.sbc-sheet [data-act="sbc-packs"]')), "short of credits, it says how many more and offers credit packs");
    await page.click('.sbc-sheet [data-act="sbc-packs"]');
    await page.waitForSelector(".sbc-pack", {timeout: 5000});
    const packs = await page.$$eval(".sbc-pack", els => els.map(e => e.textContent.replace(/\s+/g, " ").trim()));
    ok(packs.length === 4 && /1,300 credits/.test(packs[3]) && /\$9\.99/.test(packs[3]) && /\$0\.99/.test(packs[0]), "the four credit packs show with their prices");
    const sent = await page.evaluate(async () => { let body = null; const P = window.__sbPlanObj(); P.checkoutCall = async b => { body = b; return {message: "test"}; }; document.querySelector('.sbc-pack[data-id="credits_600"]').click(); await new Promise(r => setTimeout(r, 200)); return body; });
    ok(sent && sent.pack === "credits_600" && !("price" in sent) && !("credits" in sent), "buying a pack sends only the pack id (the server sets the price)");

    // The real checkout call (not a stub): it sends the signed-in request and returns Stripe's address
    const real = await page.evaluate(async () => {
      const sent = [];
      const client = {functions: {invoke: async (fn, opt) => { sent.push([fn, opt.body]); return {data: {url: "https://checkout.stripe.com/c/pay/test"}, error: null}; }}};
      const user = {id: "11111111-2222-4333-8444-555555555555"};
      const pack = await window.__sbCheckoutCall({pack: "credits_600"}, client, user);
      const plan = await window.__sbCheckoutCall({plan: "monthly"}, client, user);
      const guest = await window.__sbCheckoutCall({pack: "credits_600"}, client, {id: "x", is_anonymous: true});
      return {pack, plan, guest, sent};
    });
    ok(real.pack && real.pack.url === "https://checkout.stripe.com/c/pay/test" && real.plan && real.plan.url, "the app's checkout call reaches the server and gets Stripe's checkout address");
    ok(real.sent.length === 2 && real.sent[0][0] === "create-checkout" && real.sent[0][1].pack === "credits_600" && real.sent[0][1].src === "app" && real.sent[1][1].plan === "monthly", "it sends only the pack or plan (and that it came from the app)");
    ok(real.guest === null, "a guest account isn't sent to checkout");

    // A sticker pack's sheet shows every sticker in it
    const stk = await page.evaluate(p => { window.SBCREDITS.buySheet("sticker", p.pack); return {shown: document.querySelectorAll(".sbc-stage .stk-cell").length}; }, pick);
    ok(stk.shown >= 8, `a sticker pack's sheet shows all its stickers (${stk.shown})`);

    // Each piece of a collection opens bigger, and Back or Escape returns
    await page.evaluate(th => window.SBCREDITS.buySheet("skin", th), pick.th);
    await page.waitForSelector('.sbc-in[data-what="stk"]');
    const zooms = {};
    for (const w of ["comps", "stk", "card", "pins"]) {
      if (!(await page.$(`.sbc-in[data-what="${w}"]`))) continue;
      await page.click(`.sbc-in[data-what="${w}"]`);
      await page.waitForSelector(".sbc-zoom");
      zooms[w] = await page.evaluate(() => ({title: document.querySelector(".sbc-zoom-h b").textContent, items: document.querySelectorAll(".sbc-zoom-b img, .sbc-zoom-b .stk-cell, .sbc-zoom-b .cs-demo, .sbc-zoom-b .ns-demo").length}));
      if (w === "card") await page.keyboard.press("Escape"); else await page.click('[data-act="sbc-zoom-x"]');
      zooms[w].closed = await page.evaluate(() => !document.querySelector(".sbc-zoom") && !!document.querySelector("dialog[open] .sbc-sheet"));
    }
    ok(zooms.comps && zooms.comps.items >= 1 && zooms.stk && zooms.stk.items >= 8 && zooms.card && zooms.card.items === 1 && zooms.pins && zooms.pins.items >= 1, "every piece opens bigger: companions, all stickers, the flashcard, the pins");
    ok(Object.values(zooms).every(z => z.closed), "Back and Escape close the big view and keep the buy sheet open");

    // Checkout waits in the Credits sheet (not a toast), then shows the credits arriving
    await page.evaluate(() => { const P = window.__sbPlanObj(); P.checkoutCall = async () => ({url: "https://checkout.stripe.com/c/pay/test"}); P.openExternal = () => {}; window.SBCREDITS.packsSheet(); });
    await page.waitForSelector('.sbc-pack[data-id="credits_100"]');
    await page.click('.sbc-pack[data-id="credits_100"]');
    await page.waitForSelector(".sbc-wait", {timeout: 5000});
    const waitTxt = await page.textContent(".sbc-wait");
    ok(/checkout tab/i.test(waitTxt) && /100 credits/.test(waitTxt) && !!(await page.$('[data-act="sbc-reopen"]')), "after opening checkout the sheet says to finish in the checkout tab, with Open Checkout Again");
    await page.evaluate(async () => { window.__crSrv.balance += 100; await window.SBCREDITS.load(); });
    await page.waitForSelector(".sbc-done", {timeout: 5000});
    ok(/100 credits added/.test(await page.textContent(".sbc-done")), "when the payment lands the sheet shows the credits added");
    await page.click('.sbc-sheet [data-act="sbc-back"]');
    await page.evaluate(async () => { window.__crSrv.balance -= 100; await window.SBCREDITS.load(); });

    // A note shape for 100 credits: its sheet shows the shape, and buying unlocks it
    await page.evaluate(async () => { window.__crSrv.balance += 100; await window.SBCREDITS.load(); window.SBCREDITS.unlock("note", "torn"); });
    await page.waitForSelector('.sbc-sheet[data-kind="note"] [data-act="sbc-buy"]', {timeout: 5000});
    ok(!!(await page.$(".sbc-stage .ns-demo .ns-torn")) && /Note Shape/.test(await page.textContent(".sbc-sheet")), "a note shape's sheet shows the shape");
    await page.click('.sbc-sheet [data-act="sbc-buy"]');
    await page.waitForFunction(() => window.__sbCollPreview.owns("note", "torn"), null, {timeout: 5000});
    ok(true, "a note shape is kept for good once bought");
    await page.waitForTimeout(600);

    // A single pin for 50 credits
    await page.evaluate(p => window.SBCREDITS.buySheet("pin", p.otherPin), pick);
    await page.waitForSelector('.sbc-sheet [data-act="sbc-buy"]', {timeout: 5000});
    ok(/Get the whole .+ Collection/.test(await page.textContent(".sbc-sheet")), "a collection's pin also points to its whole collection");
    await page.click('.sbc-sheet [data-act="sbc-buy"]');
    await page.waitForFunction(p => window.__sbCollPreview.owns("pin", p.otherPin), pick, {timeout: 5000});
    await page.waitForTimeout(800);
    ok(await page.evaluate(() => window.SBCREDITS.balance() === 0), "a pin costs 50 credits");

    // Pro subscribers don't see the balance, unless they bought credits (or still have some)
    const proVis = await page.evaluate(async () => {
      const P = window.__sbPlanObj(), real = P.isPro, srv = window.__crSrv, open = () => { window.SBCREDITS.shop(); return !!document.querySelector(".sbc-pill"); };
      P.isPro = () => true;
      const out = {};
      srv.balance = 0; srv.bought = false; await window.SBCREDITS.load(); out.proNever = open();
      srv.bought = true; await window.SBCREDITS.load(); out.proBought = open();
      srv.bought = false; srv.balance = 40; await window.SBCREDITS.load(); out.proBalance = open();
      P.isPro = real; srv.balance = 0; await window.SBCREDITS.load(); out.free = open();
      return out;
    });
    ok(!proVis.proNever, "a Pro subscriber who never bought credits doesn't see the balance");
    ok(proVis.proBought && proVis.proBalance, "a Pro subscriber who bought credits (or still has some) keeps seeing it");
    ok(proVis.free, "a free account always sees it, even at 0");

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
