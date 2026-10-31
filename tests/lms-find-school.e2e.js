// node tests/lms-find-school.e2e.js: connecting a school site by signing in, "Your School" suggests schools as you type, and
// picking one fills in its school site address (search_schools and the lms-find function, faked here).
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
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [], asked = [];
  try {
    const ctx = await browser.newContext({viewport: {width: 430, height: 900}, isMobile: true, hasTouch: true});
    await ctx.route(/supabase\.co/, async r => {
      const u = new URL(r.request().url()), body = r.request().postData() || "";
      const cors = {"access-control-allow-origin": "*", "access-control-allow-headers": "*"};
      if (r.request().method() === "OPTIONS") return r.fulfill({status: 204, headers: cors});
      if (u.pathname === "/rest/v1/rpc/search_schools") { asked.push("search " + body);
        return r.fulfill({status: 200, contentType: "application/json", headers: cors, body: JSON.stringify(/bcit|british/i.test(body) ? [{key: "bcit.ca", name: "British Columbia Institute of Technology", country: "Canada", region: "BC", city: "Burnaby", kind: "university"}] : [])}); }
      if (u.pathname === "/functions/v1/lms-find") { asked.push("find " + body); return r.fulfill({status: 200, contentType: "application/json", headers: cors, body: JSON.stringify({host: "learn.bcit.ca"})}); }
      return r.fulfill({status: 200, contentType: "application/json", headers: cors, body: "[]"});
    });
    await ctx.addInitScript(() => {
      localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1");
      // the phone app's school-site layer (signing in to the school's site)
      window.studiosoLms = {connect: () => Promise.resolve({ok: false}), sync: () => Promise.resolve({}), signOut: () => Promise.resolve(), feed: () => Promise.resolve({})};
    });
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForTimeout(2500);
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "bs-open"; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForSelector("#bsSchoolIn", {timeout: 5000});
    ok(await page.evaluate(() => { const s = document.getElementById("bsSchoolIn"), h = document.getElementById("bsHostIn"); return !!s && !!h && !!(s.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING); }), "signing in to Brightspace starts with Your School, above the address");
    await page.fill("#bsSchoolIn", "bcit"); await page.waitForTimeout(600);
    const sugg = await page.evaluate(() => [...document.querySelectorAll("#bsSchoolList li")].map(li => li.textContent));
    ok(sugg.length === 1 && /British Columbia Institute of Technology/.test(sugg[0]) && /Burnaby/.test(sugg[0]) && await page.isVisible("#bsSchoolList"), "typing suggests schools in a list under the box: " + JSON.stringify(sugg));
    if (process.env.SHOT) { const b = await (await page.$(".bs-find")).boundingBox(); await page.screenshot({path: process.env.SHOT, clip: {x: 0, y: Math.max(0, b.y - 40), width: 430, height: 330}}); }
    await page.tap("#bsSchoolList li"); await page.waitForTimeout(500);
    if (process.env.SHOT) { const b = await (await page.$(".bs-find")).boundingBox(); await page.screenshot({path: process.env.SHOT.replace(".png", "-2.png"), clip: {x: 0, y: Math.max(0, b.y - 40), width: 430, height: 330}}); }
    ok(await page.inputValue("#bsHostIn") === "learn.bcit.ca" && await page.inputValue("#bsSchoolIn") === "British Columbia Institute of Technology", "picking BCIT fills in its address, learn.bcit.ca");
    ok(asked.some(a => /^find /.test(a) && /"key":"bcit.ca"/.test(a) && /"lms":"brightspace"/.test(a)), "asking for BCIT's Brightspace address");
    ok(/Found it: learn\.bcit\.ca/.test(await page.textContent("#bsFindMsg")) && !(await page.isVisible("#bsSchoolList")), "it says so, and the list closes");
    await ctx.close();
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log(`lms-find-school.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
