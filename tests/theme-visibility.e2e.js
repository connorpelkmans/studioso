// node tests/theme-visibility.e2e.js (Playwright + Chromium) Hidden themes
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
const VISIBLE = {
  world: ["japan", "italy", "greece", "egypt", "canada", "mexico", "brazil", "morocco"],
  majors: ["nursing", "biology", "compsci", "engineering", "education", "justice", "chem", "sketchcity"],
  hobby: ["reading", "pottery", "film", "culinary", "music", "photography", "gaming", "baking"],
  season: ["winter", "spring", "summer", "autumn"]
};
const SCENES_ADDED = ["volcano", "rainforest", "geology", "nighttrain", "campfire", "greenhouse", "marinebio", "aquarium"];
const SCENES_HIDDEN = ["balloons", "rain", "alpine", "dunes", "rooftops"];
const HOLIDAYS_ADDED = ["diadelosmuertos", "holi", "ramadan", "midautumn"];
const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x));

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({serviceWorkers: "block"});
    await ctx.addInitScript(() => { try { window.__SB_TEST = true; localStorage.setItem("sb:onboarded", "1"); } catch (e) {} });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.SBThemes && window.SBTP && window.StudyboardSounds && window.__sbCollPreview, null, {timeout: 40000});
    const list = () => page.evaluate(() => StudyboardSounds.skins());
    const byGroup = l => l.reduce((g, s) => ((g[s.group] = g[s.group] || []).push(s.id), g), {});

    let l = await list(), g = byGroup(l);
    ok(!(await page.evaluate(() => SBThemes.all())), "hidden themes are hidden by default");
    for (const k of Object.keys(VISIBLE)) ok(sameSet(g[k] || [], VISIBLE[k]), `${k}: exactly the chosen themes show (${(g[k] || []).join(", ")})`);
    const scenes = (g.pro || []).concat(g.newscenes || []);
    ok(SCENES_ADDED.every(id => scenes.includes(id)), "the chosen New Ideas themes are in Scenes");
    ok(SCENES_HIDDEN.every(id => !scenes.includes(id)), "Balloon Festival, Rainy Window, Alpine Lake, Desert Dunes and City Rooftops are hidden");
    ok((g.pro || []).length === 13, "every original Scenes theme still shows (Christmas Lights is in Holidays)");
    ok(HOLIDAYS_ADDED.every(id => (g.holiday || []).includes(id)) && (g.holiday || []).length === 15, "all holidays show, plus Christmas Lights and the four new ones");
    ok(!g.ideas, "New Theme Ideas has nothing left to show");
    ok((g.plain || []).length === 14, "the free plain colors all show");
    const hidden = await page.evaluate(() => SBThemes.hidden());
    ok(hidden.every(id => !l.some(s => s.id === id)), "no hidden theme is in the theme list");
    ok((await page.evaluate(h => SBTP.themes().filter(id => h.includes(id)).length, hidden)) === 0, "no hidden theme has a Theme Collection showing");
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "shop"; b.id = "tvShop"; document.body.appendChild(b); b.click(); });
    await page.waitForSelector("#dlg .shop", {timeout: 10000}); await page.waitForTimeout(500);
    const shop = await page.evaluate(() => { const d = document.querySelector("#dlg"); d.querySelectorAll(".ui-sec, details").forEach(x => { try { x.open = true; } catch (e) {} }); const h = d.innerHTML; return {venice: /Venice/.test(h), ideas: /New Theme Ideas|New Ideas/.test(h), seasons: /Seasons/.test(h) && /Autumn Leaves/.test(h), kelp: /Kelp Forest|marinebio/.test(h)}; });
    console.log("   shop:", JSON.stringify(shop));
    ok(!shop.venice && !shop.ideas && shop.seasons && shop.kelp, "the Style Shop shows Seasons and has no hidden theme or empty section");

    const r = await page.evaluate(() => { const st = __sbCollPreview.state; st.settings.style = Object.assign({}, st.settings.style, {skin: "venice"}); return {shown: __sbCollPreview.shown(), saved: st.settings.style.skin}; });
    ok(r.shown === "classic" && r.saved === "venice", "a hidden theme in use falls back to Classic without losing the choice");

    const order0 = l.map(s => s.id);
    await page.evaluate(() => { window.__asked = []; SBThemes.fake({from: t => ({select: () => ({eq: (c, v) => ({maybeSingle: async () => { window.__asked.push([t, c, v]); return {data: {all_themes: true}, error: null}; }})})})}, {id: "u1"}); });
    await page.waitForFunction(() => SBThemes.all(), null, {timeout: 5000});
    l = await list(); g = byGroup(l);
    ok(JSON.stringify(await page.evaluate(() => window.__asked[0])) === JSON.stringify(["studyboard_theme_access", "user_id", "u1"]), "it reads the signed-in account's own row");
    ok(hidden.every(id => l.some(s => s.id === id)), "with access, every hidden theme is back");
    ok(g.season.length === 4 && g.world.length === 11 && g.majors.length === 19, "with access, the whole of Seasons, World and Fields show");
    ok(await page.evaluate(() => { const C = __sbCollPreview; if (!C.owns("skin", "venice")) C.start("venice"); const on = C.shown() === "venice"; C.end(); return on; }), "with access, a hidden theme can be used again");
    ok(/"on":true/.test(await page.evaluate(() => localStorage.getItem("studyboard:theme-access"))), "access is remembered for the next start");

    await page.evaluate(() => SBThemes.fake(null, null));
    await page.waitForFunction(() => !SBThemes.all(), null, {timeout: 5000});
    l = await list();
    ok(JSON.stringify(l.map(s => s.id)) === JSON.stringify(order0), "signed out: the same themes are hidden again, in the same order");
    ok(!(await page.evaluate(() => localStorage.getItem("studyboard:theme-access"))), "signed out: the remembered access is cleared");

    await page.evaluate(() => SBThemes.fake({from: () => ({select: () => ({eq: () => ({maybeSingle: async () => ({data: null, error: {message: "relation does not exist"}})})})})}, {id: "u2"}));
    await page.waitForTimeout(300);
    ok(!(await page.evaluate(() => SBThemes.all())) && (await list()).length === order0.length, "no table or no row: the themes stay hidden");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log(`\n${n} passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
