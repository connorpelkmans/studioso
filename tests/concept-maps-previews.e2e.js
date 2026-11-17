// node tests/concept-maps-previews.e2e.js
// Concept map embeds show a preview of what they hold: the provider's own picture, loaded from the provider by its address (oEmbed or a documented
// thumbnail; only the address is saved), the title as the caption, the plain box when the picture won't load, and a small live view for sites with no picture.
// SHOTS=<dir> also saves screenshots (desktop and phone).
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SHOTS = process.env.SHOTS || "";
const EMB = {
  yt: {p: "youtube", u: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", e: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0", th: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"},
  vi: {p: "vimeo", u: "https://vimeo.com/76979871", e: "https://player.vimeo.com/video/76979871", th: ""},
  lo: {p: "loom", u: "https://www.loom.com/share/0281766fa2d04bb788eaf19e65135184", e: "https://www.loom.com/embed/0281766fa2d04bb788eaf19e65135184", th: ""},
  sp: {p: "spotify", u: "https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5", e: "https://open.spotify.com/embed/episode/7makk4oTQel546B0PZlDM5", th: ""},
  te: {p: "ted", u: "https://www.ted.com/talks/ken_robinson_do_schools_kill_creativity", e: "https://embed.ted.com/talks/ken_robinson_do_schools_kill_creativity", th: ""},
  ph: {p: "phet", u: "https://phet.colorado.edu/en/simulations/projectile-motion", e: "https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_all.html", th: ""},
  gd: {p: "gslides", u: "https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit", e: "https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/embed?start=false&loop=false", th: ""},
  de: {p: "desmos", u: "https://www.desmos.com/calculator/abcdef1234", e: "https://www.desmos.com/calculator/abcdef1234?embed", th: ""},
  gg: {p: "geogebra", u: "https://www.geogebra.org/m/abcd123", e: "https://www.geogebra.org/material/iframe/id/abcd123", th: ""}
};
const KEYS = Object.keys(EMB), XY = {};
KEYS.forEach((k, i) => { XY["idea:" + k] = [-330 + (i % 3) * 330, -230 + Math.floor(i / 3) * 230]; });
const SEED = () => ({v: 2, updated: 1, settings: {}, courses: [{id: "c1", name: "Physics", code: "PHY 101", color: "#2F6FE4", maps: [{id: "m1", name: "Motion", auto: false, created: 1, at: 1,
  add: KEYS.map(k => ({id: k, label: "", emb: EMB[k]})), links: [], pos: XY}]}], tasks: [], notes: [], decks: [], files: [], events: []});
// what each provider's oEmbed answers (the picture lives on the provider's own image host)
const OE = {
  "youtube.com/oembed": {title: "Never Gonna Give You Up (Official Video)", thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"},
  "vimeo.com/api/oembed.json": {title: "The New Vimeo Player (You Know, For Videos)", thumbnail_url: "https://i.vimeocdn.com/video/452001751-d_295x166"},
  "open.spotify.com/oembed": {title: "My Path to Spotify: Women in Engineering", thumbnail_url: "https://image-cdn-fa.spotifycdn.com/image/ab67656300005f1ff8141e891abf749375772343"},
  "ted.com/services/v1/oembed.json": {title: "Sir Ken Robinson: Do schools kill creativity?", thumbnail_url: "https://pi.tedcdn.com/r/pe.tedcdn.com/images/ted/6b6e.jpg?w=560&h=315"}
};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mkCtx = async (viewport, o) => {
    const ctx = await browser.newContext(Object.assign({viewport, serviceWorkers: "block"}, o || {}));
    await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} }, SEED());
    ctx.asked = []; ctx.pics = [];
    const pic = col => `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270"><rect width="480" height="270" fill="${col}"/><circle cx="240" cy="135" r="70" fill="#fff" opacity=".5"/></svg>`;
    await ctx.route(/youtube\.com\/oembed|vimeo\.com\/api\/oembed|loom\.com\/v1\/oembed|open\.spotify\.com\/oembed|ted\.com\/services\/v1\/oembed/, r => {
      const url = r.request().url(); ctx.asked.push(url);
      if (/loom\.com/.test(url)) return r.fulfill({status: 500, body: "down"}); // a provider that fails: the box stays plain
      const k = Object.keys(OE).find(x => url.includes(x)); r.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(OE[k])});
    });
    await ctx.route(/i\.ytimg\.com|i\.vimeocdn\.com|spotifycdn\.com|tedcdn\.com|phet\.colorado\.edu\/sims\/html\/[\w-]+\/latest\/[\w-]+-600\.png|drive\.google\.com\/thumbnail/, r => {
      const url = r.request().url(); ctx.pics.push(url);
      if (/drive\.google\.com/.test(url)) return r.fulfill({status: 404, body: "not shared"}); // a private (or deleted) file: no picture
      const col = /ytimg/.test(url) ? "#C4302B" : /vimeo/.test(url) ? "#1AB7EA" : /spotify/.test(url) ? "#1DB954" : /ted/.test(url) ? "#E62B1E" : "#2A6EBB";
      r.fulfill({status: 200, contentType: "image/svg+xml", body: pic(col)});
    });
    await ctx.route(/desmos\.com|geogebra\.org|youtube-nocookie\.com|player\.vimeo\.com|docs\.google\.com/, r => r.fulfill({status: 200, contentType: "text/html", body: `<!doctype html><body style="margin:0;font:40px sans-serif;background:#eef6ee"><div style="padding:30px">Live ${new URL(r.request().url()).hostname}</div></body>`}));
    return ctx;
  };
  const open = async ctx => {
    const page = await ctx.newPage(); page.errs = [];
    page.on("pageerror", e => page.errs.push(e.message));
    page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|ERR_FAILED/.test(m.text())) page.errs.push(m.text()); });
    await page.goto(base); await page.waitForFunction(() => window.__sbProStudy && window.SBCMAP); await page.waitForTimeout(500);
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "cm-open"; b.dataset.id = "c1"; b.dataset.kind = "course"; b.dataset.map = "m1"; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForSelector('.cm-node[data-n="idea:vi"]'); return page;
  };
  const href = (page, k) => page.evaluate(k => { const i = document.querySelector(`.cm-node[data-n="idea:${k}"] image.cm-emb-th`); return i ? i.getAttribute("href") : ""; }, k);
  const cap = (page, k) => page.evaluate(k => document.querySelector(`.cm-node[data-n="idea:${k}"] .cm-lab`).firstChild.textContent, k);
  const saved = page => page.evaluate(() => window.__sbProStudy.state().courses.c1.maps[0]);

  const ctx = await mkCtx({width: 1280, height: 860}), page = await open(ctx);
  await page.waitForFunction(() => { const i = document.querySelector('.cm-node[data-n="idea:vi"] image.cm-emb-th'); return i && /vimeocdn/.test(i.getAttribute("href")); }, null, {timeout: 6000});
  await page.waitForTimeout(600);
  ok(await href(page, "yt") === EMB.yt.th && /Never Gonna/.test(await cap(page, "yt")), "YouTube: its thumbnail, and the title from oEmbed as the caption");
  ok(await href(page, "vi") === OE["vimeo.com/api/oembed.json"].thumbnail_url && /^The New Vimeo Player/.test(await cap(page, "vi")) && (await cap(page, "vi")).endsWith("…"), "Vimeo: the picture oEmbed names, hotlinked from Vimeo, with the title cut to fit");
  ok(/spotifycdn/.test(await href(page, "sp")) && /tedcdn/.test(await href(page, "te")), "Spotify and TED: their oEmbed pictures");
  ok(await href(page, "ph") === "https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion-600.png", "PhET: the simulation's own screenshot");
  ok(await href(page, "lo") === "" && await cap(page, "lo") === "Loom video" && /Loom/.test(await page.textContent('.cm-node[data-n="idea:lo"] .cm-emb-name')), "Loom's oEmbed failing leaves the plain box with the site's name");
  ok(await href(page, "gd") === "" && ctx.pics.some(u => /drive\.google\.com\/thumbnail\?id=1AbCdEfGhIjKlMnOpQrStUvWxYz/.test(u)) && await page.locator('.cm-node[data-n="idea:gd"] image').count() === 0, "a Google file whose thumbnail won't load (not shared, or deleted) falls back to the plain box, no broken picture");
  // saved: the addresses and titles, never a picture
  const m = await saved(page), em = Object.fromEntries(m.add.map(i => [i.id, i.emb]));
  ok(em.vi.th === OE["vimeo.com/api/oembed.json"].thumbnail_url && /Vimeo Player/.test(em.vi.tt) && /Spotify/.test(em.sp.tt) && em.yt.th === EMB.yt.th && /Never Gonna/.test(em.yt.tt), "the picture's address and the title are saved on the embed");
  ok(!/data:|blob:/.test(JSON.stringify(m.add)) && m.add.every(i => !i.emb.th || /^https:\/\//.test(i.emb.th)), "no picture is copied into the map: only https addresses at the provider");
  // live views for sites with no picture
  await page.waitForSelector(".cm-live .cm-livef iframe", {timeout: 4000});
  const live = await page.$$eval(".cm-live iframe", fs => fs.map(f => ({src: f.getAttribute("src"), pe: getComputedStyle(f).pointerEvents, sb: f.getAttribute("sandbox"), ti: f.getAttribute("tabindex"), lazy: f.getAttribute("loading"), hid: f.getAttribute("aria-hidden")})));
  ok(live.length === 2 && live.some(f => /desmos\.com\/calculator\/abcdef1234\?embed/.test(f.src)) && live.some(f => /geogebra\.org\/material\/iframe/.test(f.src)), "Desmos and GeoGebra show a small live view of the embed");
  ok(live.every(f => f.pe === "none" && /allow-scripts/.test(f.sb) && !/allow-top-navigation/.test(f.sb) && f.ti === "-1" && f.lazy === "lazy" && f.hid === "true"), "the live view can't be clicked or tabbed into, is sandboxed like the player, and loads lazily");
  ok(await page.evaluate(() => getComputedStyle(document.querySelector(".cm-live")).pointerEvents) === "none", "the live layer lets taps through to the map");
  // a tap on a live box still opens the player
  { const b = await page.locator('.cm-node[data-n="idea:de"] .cm-emb').boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await page.waitForSelector(".cm-player iframe"); ok(/desmos/.test(await page.getAttribute(".cm-player iframe", "src")), "a tap on a live view opens the player"); await page.click('[data-cm="unplay"]'); }
  // moving the map hides the live views until it settles, then they follow the box
  const before = await page.$eval('.cm-livef', f => f.getBoundingClientRect().left);
  const cv = await page.locator(".cm-svg").boundingBox();
  await page.mouse.move(cv.x + 20, cv.y + cv.height - 30); await page.mouse.down(); await page.mouse.move(cv.x + 80, cv.y + cv.height - 30, {steps: 4});
  ok(await page.evaluate(() => document.querySelector(".cm-live").classList.contains("is-moving")), "while the map is dragged the live views give way to the plain box");
  await page.mouse.up(); await page.waitForTimeout(500);
  ok(!(await page.evaluate(() => document.querySelector(".cm-live").classList.contains("is-moving"))) && Math.abs(await page.$eval('.cm-livef', f => f.getBoundingClientRect().left) - before - 60) < 3, "after it, they come back over their boxes");
  if (SHOTS) { fs.mkdirSync(SHOTS, {recursive: true}); await page.click('.cm-zoom [data-cm="fit"]'); await page.waitForTimeout(900); await page.screenshot({path: path.join(SHOTS, "desktop-mocked.png")}); }
  ok(page.errs.length === 0, "no console errors: " + page.errs.join(" | "));
  // asked once: the saved address and title mean reopening doesn't ask again
  const asked = ctx.asked.length;
  await page.reload(); await page.waitForFunction(() => window.SBCMAP);
  await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "cm-open"; b.dataset.id = "c1"; b.dataset.kind = "course"; b.dataset.map = "m1"; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); });
  await page.waitForSelector('.cm-node[data-n="idea:vi"] image.cm-emb-th'); await page.waitForTimeout(800);
  ok(ctx.asked.length - asked === 1 && ctx.asked.slice(asked).every(u => /loom/.test(u)), "reopened, the map draws the saved previews at once and asks only for the one still missing");
  await ctx.close();

  /* Phone: pictures yes, live views no (they'd cost smooth panning) */
  const pctx = await mkCtx({width: 390, height: 844}, {isMobile: true, hasTouch: true, deviceScaleFactor: 2}), pp = await open(pctx);
  await pp.waitForFunction(() => { const i = document.querySelector('.cm-node[data-n="idea:vi"] image.cm-emb-th'); return !!i; }, null, {timeout: 6000}); await pp.waitForTimeout(800);
  ok(await pp.locator(".cm-live iframe").count() === 0 && /Desmos/.test(await pp.textContent('.cm-node[data-n="idea:de"] .cm-emb-name')), "on a phone, Desmos and GeoGebra keep the plain box (no live frames)");
  if (SHOTS) await pp.screenshot({path: path.join(SHOTS, "phone-mocked.png")});
  ok(pp.errs.length === 0, "no console errors (phone): " + pp.errs.join(" | "));
  await pctx.close();
  await browser.close(); server.close();
  console.log(`concept-maps-previews.e2e: ${n} passed`);
})().catch(e => { console.error(e); process.exit(1); });
