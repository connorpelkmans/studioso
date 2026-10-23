// node tests/site-nav.e2e.js: the shared top bar moves between the website and the public pages, on a computer and a phone
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert"); const {chromium, executablePath} = require("./pw");
const ROOT = path.join(__dirname, "..");
const M = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".woff2": "font/woff2", ".svg": "image/svg+xml"};
const DECK = {code: "ABCD-EFGH", name: "Intro Psychology", sharer_name: "Sam", n: 2, course_key: "PSYC100", course_label: "PSYC 100", saves: 0, updated_at: "2026-10-01T00:00:00Z",
  data: {cards: [{front: "Neuron", back: "A nerve cell"}, {front: "Axon", back: "Carries signals"}]}};
const env = {SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "k", __noCache: true, __fetch: async (url, init) => {
  const fn = url.split("/rpc/")[1], a = JSON.parse(init.body);
  const out = fn === "public_search" ? [Object.assign({preview: "Neuron"}, DECK)] : fn === "public_page" ? [DECK].filter(r => r.code === a.p_code) : [];
  return new Response(JSON.stringify(out), {status: 200, headers: {"content-type": "application/json"}});
}};
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

(async () => {
  const P = await import(path.join(ROOT, "cloudflare", "site", "public-pages.js"));
  // The website lives at /website/, the public pages at /flashcards and /quizzes, as on the real site
  const server = http.createServer(async (q, r) => {
    const u = new URL(q.url, "http://x");
    if (P.isPublicPath(u.pathname)) {
      const res = await P.handlePublic(new Request("http://localhost" + u.pathname + u.search), env, {waitUntil() {}});
      r.writeHead(res.status, {"content-type": res.headers.get("content-type") || "text/html"}); r.end(Buffer.from(await res.arrayBuffer())); return;
    }
    let p = decodeURIComponent(u.pathname); if (!p.startsWith("/website/")) { r.writeHead(404); r.end(); return; }
    if (p.endsWith("/")) p += "index.html";
    let f = path.join(ROOT, p); if (!fs.existsSync(f) && fs.existsSync(f + ".html")) f += ".html";
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {"content-type": M[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(r);
  });
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port;
  const b = await chromium.launch({executablePath});
  const pages = ["/website/", "/website/privacy", "/website/account/", "/flashcards", "/flashcards/intro-psychology-abcdefgh", "/quizzes"];

  let c = await b.newContext({viewport: {width: 1280, height: 800}}); let p = await c.newPage();
  const bars = [];
  for (const u of pages) {
    await p.goto(base + u);
    bars.push(await p.evaluate(() => [...document.querySelectorAll("header.top nav .navlinks a")].map(a => a.textContent + " " + a.getAttribute("href")).join("|")));
    const box = await p.locator("header.top").boundingBox();
    ok(box.height > 60 && box.height < 70, u + ": the bar is one row on a computer");
  }
  ok(bars.every(x => x === bars[0]) && /Flashcards/.test(bars[0]) && /Pricing/.test(bars[0]), "every page shows the same links");
  await p.goto(base + "/website/"); await p.click("header.top >> text=Quizzes"); await p.waitForURL(/\/quizzes$/);
  ok(await p.getAttribute('header.top a[href="/quizzes"]', "aria-current") === "page", "home to Quizzes, marked as the current page");
  await p.click("header.top >> text=Pricing"); await p.waitForURL(/\/website\/#pricing$/);
  ok(await p.waitForFunction(() => Math.abs(document.getElementById("pricing").getBoundingClientRect().top) < 120, null, {timeout: 5000}).then(() => true, () => false), "Quizzes back to the home page's Pricing section");
  await c.close();

  c = await b.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true}); p = await c.newPage();
  for (const u of pages) {
    await p.goto(base + u); await p.waitForTimeout(150);
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), u + ": no sideways scroll at 390px");
    ok(!(await p.isVisible('header.top a[href="/flashcards"]')) && await p.isVisible("#menu-toggle"), u + ": the links fold into the menu");
  }
  await p.goto(base + "/website/privacy"); await p.tap("#menu-toggle");
  ok(await p.getAttribute("#menu-toggle", "aria-expanded") === "true" && await p.isVisible('header.top a[href="/flashcards"]'), "the menu opens");
  await p.tap('header.top a[href="/flashcards"]'); await p.waitForURL(/\/flashcards$/);
  await p.tap("#menu-toggle"); await p.tap('header.top a[href="/website/account/"]'); await p.waitForURL(/\/website\/account\/$/);
  ok(true, "phone: privacy to Flashcards to Account through the menu");
  await p.goto(base + "/website/"); await p.tap("#menu-toggle"); await p.tap('header.top a[href="/website/#pricing"]'); await p.waitForTimeout(800);
  ok(await p.getAttribute("#menu-toggle", "aria-expanded") === "false" && !(await p.isVisible('header.top a[href="/flashcards"]')), "choosing a section on the same page closes the menu");
  await c.close(); await b.close(); server.close(); console.log(n + " passed");
})().catch(e => { console.error(e); process.exit(1); });
