// node tests/page-text.test.js: a web page's readable text (src/js/01-page-text.js) and the website's /api/page-text
// (cloudflare/site/page-text.js), which fetches a page for Cards From a Link with the AI on the device.
const assert = require("assert"), path = require("path");
require(path.join(__dirname, "..", "src", "js", "01-page-text.js"));
const P = globalThis.SBPAGE;
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const para = (k, topic) => Array.from({length: k}, (_, i) => `<p>${topic} point ${i + 1}: the sodium potassium pump moves three sodium ions out of the cell and two potassium ions in, using one ATP each cycle, which keeps the membrane potential steady.</p>`).join("\n");
const ARTICLE = `<!doctype html><html><head><title>Active transport | Khan Academy</title><meta property="og:title" content="Active transport (article)"><style>.x{color:red}</style><script>var tracking = "secret";</script></head>
<body><header class="site-header"><nav><a href="/">Home</a> <a href="/courses">Courses</a></nav></header>
<div id="cookie-banner">We use cookies. Accept all cookies?</div>
<main><article><h1>Active transport</h1>${para(4, "Primary")}<h2>Secondary &amp; coupled transport</h2><ul><li>Symporters move two things the same way</li><li>Antiporters move them in opposite directions</li></ul>${para(3, "Secondary")}
<figure><img src="pump.png"><figcaption>Figure 1</figcaption></figure><p>Temperature is 37&deg;C &mdash; normal body heat. &#x3b1;-helix &lt;tag&gt; matter here.</p></article>
<aside class="related-articles"><h3>Related</h3><p>Ten other articles you might like about cells and membranes and many more things.</p></aside></main>
<div class="share-bar"><button>Share</button></div><footer>© Khan Academy · Terms · Privacy</footer></body></html>`;

/* Extracting the content */
const r = P.extract(ARTICLE, "https://www.khanacademy.org/x");
ok(r.status === "ok" && r.title === "Active transport (article)", "the page's title (og:title first): " + r.title);
ok(/^# Active transport\n/.test(r.text) && /\n## Secondary & coupled transport\n/.test(r.text), "headings become # lines, so the study set pipeline finds them");
ok(/\n- Symporters move two things the same way\n- Antiporters/.test(r.text), "list items become - lines");
ok(/Primary point 4: the sodium potassium pump/.test(r.text) && /Secondary point 3/.test(r.text), "all the article's paragraphs are there");
ok(/37°C — normal body heat\. α-helix <tag>/.test(r.text), "entities are decoded: " + (/Temperature[^\n]*/.exec(r.text) || [])[0]);
ok(!/tracking|secret|color:red|Accept all cookies|Home|Courses|Ten other articles|Terms|Share|Figure 1/.test(r.text), "scripts, styles, the menu, the cookie banner, related links, sharing, the footer and figure captions are left out");
// a page with no <article>: the body, still without its furniture
const plainPage = `<html><body><div class="navbar"><a>Menu</a><div class="nav-inner"><a>Deep link</a></div></div><div class="content"><h2>Osmosis</h2>${para(5, "Osmosis")}</div><div class="footer-links">Contact us</div></body></html>`;
const r2 = P.extract(plainPage);
ok(r2.status === "ok" && /^## Osmosis/.test(r2.text) && !/Menu|Deep link|Contact us/.test(r2.text), "no <article>: the body, with nested menus removed whole");
// walls and empty pages
ok(P.extract(`<html><title>Subscribe</title><body><h1>Subscribe to continue reading</h1><p>Already a subscriber? Sign in.</p></body></html>`).status === "paywall", "a paywall page is recognised");
ok(P.extract(`<html><body><p>Please enable JavaScript to continue.</p></body></html>`).status === "paywall", "a page that needs JavaScript (no content without it) says so, no made-up text");
ok(P.extract(`<html><body><div class="content"></div></body></html>`).status === "empty", "an empty page is empty");
ok(P.extract(`<html><body><p>Hi.</p></body></html>`).text === "", "and nothing is returned for it");
// pages that can't be read without a browser, said plainly
ok(P.extract(`<html><head><title>Just a moment...</title></head><body><div id="cf-chl-widget"></div></body></html>`).status === "blocked", "a bot check is 'blocked'");
ok(P.extract(`<html><head><title>Biology 2e</title><script src="/app.js"></script></head><body><div id="root"></div><script>window.__NEXT_DATA__={}</script></body></html>`).status === "needs_js", "a page built by JavaScript is 'needs_js'");
// Wikipedia's furniture
const wiki = `<html><body><main id="content"><div class="shortdescription">Movement of molecules</div><div role="note" class="hatnote">For other uses, see X.</div><div class="mw-parser-output"><p><b>Osmosis</b> <span class="rt-commentedText"><span class="IPA">/ɒzˈmoʊsɪs/</span></span>,<sup class="reference"><a>[1]</a></sup> is the spontaneous net movement of water across a membrane toward the side with more solute.[2] ${"It matters for cells because water follows solute. ".repeat(12)}</p><h2>References<span class="mw-editsection">[edit]</span></h2><ol class="references"><li>Smith 2020</li></ol></div><div id="catlinks" class="catlinks">Categories: Membrane biology</div></main></body></html>`;
const rw = P.extract(wiki);
ok(/^Osmosis,? is the spontaneous net movement/.test(rw.text) && !/\[\d\]|ɒz|For other uses|Movement of molecules|Smith 2020|Categories|edit\]/.test(rw.text), "Wikipedia: no citation marks, pronunciation, notes, references or categories: " + rw.text.slice(0, 80));
// text a student copied with Select All: the menu and footer copied with it are left out
const copied = ["Skip to content", "Home", "Courses", "Log in", "Search", "Active transport moves ions. " + "The pump moves three sodium ions out and two potassium ions in for each ATP it uses. ".repeat(12), "About", "Contact", "Careers", "Privacy", "Terms", "Cookie settings"].join("\n");
const ct = P.cleanText(copied);
ok(/^Active transport moves ions/.test(ct) && !/Skip to content|Careers|Cookie settings/.test(ct), "copied page text is tidied like a fetched page");
ok(P.cleanText("Just a short note I typed.") === "Just a short note I typed.", "a short paste is left as it is");
// size
const huge = `<html><body><article>${para(4000, "Long")}</article></body></html>`;
const t0 = process.hrtime.bigint(); const rh = P.extract(huge); const ms = Number(process.hrtime.bigint() - t0) / 1e6;
ok(rh.cut && rh.text.length <= P.MAX_TEXT && !/point \d+: the sodium potassium pump moves three sodium ions out of the cell and two potassium ions in, using one ATP each cycle, which keeps the membrane potential$/.test(rh.text), "a very long page is cut at a whole line, under the text limit");
console.log(`  extracting a ${(huge.length / 1e6).toFixed(1)} MB page took ${ms.toFixed(1)} ms`);
const mid = `<html><body><header>${"<a>x</a>".repeat(400)}</header><article>${para(600, "Mid")}</article><footer>${"<a>y</a>".repeat(400)}</footer></body></html>`;
const t1 = process.hrtime.bigint(); P.extract(mid); const ms2 = Number(process.hrtime.bigint() - t1) / 1e6;
console.log(`  a typical long article (${(mid.length / 1e3).toFixed(0)} KB) took ${ms2.toFixed(1)} ms`);

/* Which addresses may be fetched */
for (const good of ["https://en.wikipedia.org/wiki/Osmosis", "http://www.khanacademy.org/a?b=1#c", "https://example.org.uk:443/x"]) ok(P.safeUrl(good), "allowed: " + good);
for (const bad of ["ftp://x.com/a", "javascript:alert(1)", "https://localhost/a", "http://127.0.0.1/", "http://10.0.0.5/x", "http://192.168.1.1", "http://172.20.1.1/", "http://169.254.169.254/latest/meta-data",
  "http://[::1]/", "http://0.0.0.0/", "https://user:pw@site.com/", "https://site.com:8080/", "http://intranet/", "https://printer.local/", "https://db.internal/x", "http://100.64.1.1/", "not a url"]) ok(!P.safeUrl(bad), "refused: " + bad);
ok(P.safeUrl("https://a.com/x#frag").href === "https://a.com/x", "the #part is dropped");

/* The Worker: who may call it, what it fetches and what it returns */
(async () => {
  const {handlePageText} = await import(path.join(__dirname, "..", "cloudflare", "site", "page-text.js"));
  const SITE = "https://studyboardapp.com";
  const req = (u, origin, extra) => new Request("https://studyboardapp.com/api/page-text?url=" + encodeURIComponent(u), {headers: Object.assign(origin ? {origin} : {}, extra || {})});
  const page = (body, type = "text/html; charset=utf-8", status = 200, loc) => new Response(body, {status, headers: Object.assign({"content-type": type}, loc ? {location: loc} : {})});
  const seen = []; const fetchFn = async (u, init) => { seen.push({u, init});
    if (u === "https://www.khanacademy.org/a") return page(ARTICLE);
    if (u === "https://short.link/x") return page("", "text/html", 301, "https://www.khanacademy.org/a");
    if (u === "https://evil.example.com/r") return page("", "text/html", 302, "http://169.254.169.254/latest/meta-data/");
    if (u === "https://loop.com/a") return page("", "text/html", 302, "https://loop.com/a");
    if (u === "https://news.com/paid") return page("", "text/html", 402);
    if (u === "https://files.com/notes.pdf") return page("%PDF-1.7", "application/pdf");
    if (u === "https://files.com/pic.png") return page("x", "image/png");
    if (u === "https://slow.com/") return new Promise(() => {});
    return page("nope", "text/html", 404);
  };
  const call = async (u, origin, extra) => { const res = await handlePageText(req(u, origin, extra), {}, null, fetchFn); return {res, j: await res.json()}; };
  let x = await call("https://www.khanacademy.org/a", SITE);
  ok(x.res.status === 200 && x.j.status === "ok" && /# Active transport/.test(x.j.text) && x.res.headers.get("access-control-allow-origin") === SITE, "the website gets the page's text, with CORS for its own origin");
  ok(!/<(p|script|div|html)\b|tracking/.test(JSON.stringify(x.j)), "only the extracted text comes back, never the page itself");
  const sent = seen[seen.length - 1].init;
  ok(sent.redirect === "manual" && /StudyboardReader/.test(sent.headers["user-agent"]) && !sent.headers.cookie, "it fetches as StudyboardReader, follows no redirect blindly, sends no cookies");
  x = await call("https://www.khanacademy.org/a", "capacitor://localhost");
  ok(x.j.status === "ok" && x.res.headers.get("access-control-allow-origin") === "capacitor://localhost", "the iPhone app may call it too (its fallback)");
  x = await call("https://www.khanacademy.org/a", "https://someone-else.com");
  ok(x.res.status === 403 && !x.res.headers.get("access-control-allow-origin"), "another site can't use it");
  x = await call("https://www.khanacademy.org/a", "");
  ok(x.res.status === 403, "nor can a script with no Origin");
  x = await call("https://www.khanacademy.org/a", "", {"sec-fetch-site": "same-origin"});
  ok(x.j.status === "ok", "a same-site request from the website itself is fine");
  x = await call("https://short.link/x", SITE);
  ok(x.j.status === "ok" && x.j.url === "https://www.khanacademy.org/a", "a redirect to a public page is followed, and the final address reported");
  x = await call("https://evil.example.com/r", SITE);
  ok(x.j.status === "unreachable" && !seen.some(s => /169\.254/.test(s.u)), "a redirect to a private address is refused, never fetched");
  x = await call("https://loop.com/a", SITE);
  ok(x.j.status === "unreachable" && seen.filter(s => s.u === "https://loop.com/a").length === 6, "a redirect loop stops after 5 hops");
  x = await call("http://10.1.2.3/admin", SITE);
  ok(x.res.status === 400 && x.j.status === "bad", "a private address is refused before anything is fetched");
  x = await call("https://news.com/paid", SITE); ok(x.j.status === "paywall", "a 402 is a paywall");
  x = await call("https://files.com/notes.pdf", SITE); ok(x.j.status === "pdf", "a PDF says so (the student can add the file itself)");
  x = await call("https://files.com/pic.png", SITE); ok(x.j.status === "not_page", "an image isn't a page");
  x = await call("https://gone.com/", SITE); ok(x.j.status === "unreachable" && x.j.http === 404, "a missing page is unreachable");
  const limited = await handlePageText(req("https://www.khanacademy.org/a", SITE, {"cf-connecting-ip": "1.2.3.4"}), {PAGE_LIMIT: {limit: async ({key}) => ({success: key !== "page:1.2.3.4"})}}, null, fetchFn);
  ok(limited.status === 429, "past the rate limit: 429");
  const post = await handlePageText(new Request("https://studyboardapp.com/api/page-text?url=x", {method: "POST", headers: {origin: SITE}}), {}, null, fetchFn);
  ok(post.status === 405, "only GET");
  const pre = await handlePageText(new Request("https://studyboardapp.com/api/page-text", {method: "OPTIONS", headers: {origin: "capacitor://localhost"}}), {}, null, fetchFn);
  ok(pre.status === 204 && pre.headers.get("access-control-allow-methods") === "GET", "the preflight answers allowed apps");
  console.log(`page-text: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
