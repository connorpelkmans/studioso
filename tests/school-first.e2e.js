// node tests/school-first.e2e.js: School Sites in the apps asks for your school first. Connect works out the platform and opens
// its sign-in; Didn't Work? (or no platform found) shows the platforms, and picking one goes straight to typing its address.
// The website keeps the platform list. search_schools, lms-find and the app's sign-in window are faked.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SHOT = process.env.SHOT;
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [], asked = [];
  try {
    const mk = async app => {
      const ctx = await browser.newContext({viewport: {width: 430, height: 900}, isMobile: true, hasTouch: true, serviceWorkers: "block"});
      await ctx.route(/supabase\.co/, async r => {
        const u = new URL(r.request().url()), body = r.request().postData() || "", cors = {"access-control-allow-origin": "*", "access-control-allow-headers": "*"};
        if (r.request().method() === "OPTIONS") return r.fulfill({status: 204, headers: cors});
        const j = o => r.fulfill({status: 200, contentType: "application/json", headers: cors, body: JSON.stringify(o)});
        if (u.pathname === "/rest/v1/rpc/search_schools") return j(/bcit/i.test(body) ? [{key: "bcit.ca", name: "British Columbia Institute of Technology", country: "Canada", region: "BC", city: "Burnaby", kind: "university"}]
          : /nowhere/i.test(body) ? [{key: "hs:us:069999900001", name: "Nowhere High School", country: "United States", region: "California", city: "Nowhere", kind: "high_school"}] : []);
        if (u.pathname === "/functions/v1/lms-find") { asked.push(body); return j(/bcit/.test(body) ? {host: "learn.bcit.ca", lms: "brightspace"} : {host: "", lms: ""}); }
        return j([]);
      });
      await ctx.addInitScript(app => {
        localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1");
        if (app) window.studiosoLms = {connect: (id, host) => { (window.__signins = window.__signins || []).push(id + " " + host); return Promise.resolve({ok: false, cancelled: true}); }, sync: () => Promise.resolve({}), signOut: () => Promise.resolve(), feed: () => Promise.resolve({})};
      }, app);
      const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
      await page.goto(base); await page.waitForFunction(() => window.SBLMS && window.SBLMS.canvas); await page.waitForTimeout(1500);
      await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
      await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "lms-open"; document.body.appendChild(b); b.click(); b.remove(); });
      await page.waitForSelector(".bs-sheet");
      return {ctx, page};
    };
    // the app
    let {ctx, page} = await mk(true);
    ok(/Connect Your School/.test(await page.textContent(".sheet-head")) && await page.isVisible("#bsSchoolIn") && await page.isVisible("#bsGo") && !(await page.isVisible("#bsPlats")) && !(await page.isVisible(".bs-pcard")),
      "School Sites asks for your school first, with Connect; the platforms are hidden");
    if (SHOT) await page.screenshot({path: SHOT});
    await page.fill("#bsSchoolIn", "bcit"); await page.waitForTimeout(600); await page.tap("#bsSchoolList li");
    await page.tap("#bsGo");
    await page.waitForSelector("#lmsConsentYes", {timeout: 5000}); await page.click("#lmsConsentYes");
    await page.waitForFunction(() => (window.__signins || []).length > 0, null, {timeout: 5000});
    ok(JSON.stringify(await page.evaluate(() => window.__signins)) === JSON.stringify(["brightspace learn.bcit.ca"]) && asked.some(b => /"key":"bcit.ca"/.test(b) && /"lms":"auto"/.test(b)),
      "Connect works out that BCIT uses Brightspace and opens learn.bcit.ca's sign-in");
    await page.waitForTimeout(300);
    ok(/uses Brightspace/.test(await page.textContent("#bsFindMsg")) && await page.isVisible("#bsDidnt"), "it says which platform it found, with Didn't Work? underneath");
    if (SHOT) await page.screenshot({path: SHOT.replace(".png", "-2.png")});
    await page.tap("#bsDidnt"); await page.waitForTimeout(300);
    const cards = await page.evaluate(() => [...document.querySelectorAll("#bsPlats > .bs-plist .bs-pcard b")].map(b => b.textContent));
    ok(await page.isVisible("#bsPlats") && JSON.stringify(cards) === JSON.stringify(["Canvas", "Brightspace", "Blackboard", "Moodle"]) && await page.$(".bs-hs"), "Didn't Work? shows the platforms (and High School Sites): " + cards.join(", "));
    if (SHOT) await page.screenshot({path: SHOT.replace(".png", "-3.png"), fullPage: false});
    await page.tap('#bsPlats [data-act="bs-manual"]'); await page.waitForSelector("#bsHostIn");
    ok(await page.isVisible("#bsHostIn") && await page.inputValue("#bsHostIn") === "learn.bcit.ca" && !(await page.$("#bsSchoolIn")) && /British Columbia Institute of Technology's Brightspace address/.test(await page.textContent(".bs-sheet")),
      "picking a platform goes straight to typing its address (filled in with what was tried)");
    if (SHOT) await page.screenshot({path: SHOT.replace(".png", "-4.png")});
    await page.tap('#bsManual [data-act="bs-login"]'); await page.waitForTimeout(400);
    ok((await page.evaluate(() => window.__signins.length)) === 2, "Sign In opens that address");
    // a school whose platform isn't found
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "lms-open"; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForSelector("#bsSchoolIn");
    await page.fill("#bsSchoolIn", "nowhere"); await page.waitForTimeout(600); await page.tap("#bsSchoolList li"); await page.tap("#bsGo"); await page.waitForTimeout(500);
    ok(await page.isVisible("#bsPlats") && /Couldn't tell which platform Nowhere High School uses/.test(await page.textContent("#bsPlatsNote")) && /Schoology or Google Classroom/.test(await page.textContent("#bsPlatsNote")) && (await page.evaluate(() => window.__signins.length)) === 2,
      "not found: the platforms show by themselves (with a tip for high schools), and no sign-in opens");
    await ctx.close();
    // the website keeps the platform list
    ({ctx, page} = await mk(false));
    ok(!(await page.$("#bsSchoolIn")) && (await page.$$(".bs-pcard")).length >= 4, "the website still shows the platform list");
    await ctx.close();
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log(`school-first.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
