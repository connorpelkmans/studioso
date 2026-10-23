// One top bar on every page: the website's pages and the public flashcard and quiz pages
const assert = require("assert"), path = require("path"), fs = require("fs");
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const W = path.join(__dirname, "..", "website");
const header = t => (t.match(/<header class="top">[\s\S]*?<\/header>/) || [""])[0];

(async () => {
  const P = await import(path.join(__dirname, "..", "cloudflare", "site", "public-pages.js"));
  const pages = {"index.html": "", "privacy.html": "", "terms.html": "", "success.html": "", "cancel.html": "", "account/index.html": "account"};
  for (const [f, cur] of Object.entries(pages))
    ok(header(fs.readFileSync(path.join(W, f), "utf8")) === P.siteHeader(cur), `website/${f} has the shared top bar (copy it from siteHeader in public-pages.js)`);

  const bar = P.siteHeader("");
  const hrefs = [...bar.matchAll(/href="([^"]*)"/g)].map(m => m[1]);
  ok(hrefs.every(h => h.startsWith("/")), "every link in the bar is absolute, so it works from /flashcards too");
  for (const want of ["/website/", "/website/#features", "/website/#sync", "/flashcards", "/quizzes", "/website/#pricing", "/website/account/", "/website/#download"]) ok(hrefs.includes(want), "the bar links to " + want);
  const home = fs.readFileSync(path.join(W, "index.html"), "utf8");
  for (const h of hrefs.filter(x => x.includes("#"))) ok(home.includes(`id="${h.split("#")[1]}"`), "the home page has the section " + h);
  ok(/id="menu-toggle"[^>]*aria-controls="site-links"/.test(bar) && /id="site-links"/.test(bar), "a menu button for narrow screens");
  ok((P.siteHeader("quizzes").match(/aria-current="page"/g) || []).length === 1 && /href="\/quizzes" aria-current="page"/.test(P.siteHeader("quizzes")), "the current section is marked");

  // The public pages use the same bar and load the script that runs it
  const env = {SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "k", __noCache: true,
    __fetch: async () => new Response(JSON.stringify([]), {status: 200, headers: {"content-type": "application/json"}})};
  for (const [p, cur] of [["/flashcards", "flashcards"], ["/quizzes", "quizzes"], ["/flashcards/x-abcdefgh", "flashcards"]]) {
    const t = await (await P.handlePublic(new Request("https://studyboardapp.com" + p), env, {waitUntil() {}})).text();
    ok(header(t) === P.siteHeader(cur), p + " has the shared top bar with its section marked");
    ok(/<script src="\/website\/assets\/site.js" defer><\/script>/.test(t), p + " loads site.js (theme and menu buttons)");
  }

  // Plain zeros: the body font takes its digits from Lexend
  const fonts = fs.readFileSync(path.join(W, "assets", "fonts.css"), "utf8"), css = fs.readFileSync(path.join(W, "assets", "site.css"), "utf8");
  const digits = [...fonts.matchAll(/@font-face\{font-family:"SB Digits";[^}]*\}/g)].map(m => m[0]);
  ok(digits.length === 3 && digits.every(d => /unicode-range:U\+0030-0039/.test(d) && fs.existsSync(path.join(W, "assets", d.match(/url\(([^)]+)\)/)[1]))), "SB Digits covers 0-9 with files that exist");
  ok(/--body:"SB Digits",/.test(css), "SB Digits comes first in the body font");
  console.log(`site-nav.test: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
