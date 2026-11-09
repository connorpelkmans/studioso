// node tests/site-download-version.e2e.js: the website's download labels show the version of the file each button really downloads,
// and check:release fails while those links are older than package.json.
const assert = require("assert"); let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const http = require("http"), fs = require("fs"), path = require("path"), cp = require("child_process");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, ".."), W = path.join(root, "website");
const MIME = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml"};
let CONFIG = fs.readFileSync(path.join(W, "config.js"), "utf8");
const server = http.createServer((req, res) => { let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html"; if (p === "/config.js") { res.writeHead(200, {"content-type": "text/javascript"}); res.end(CONFIG); return; } const f = path.join(W, p); if (!f.startsWith(W) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
(async () => {
  await new Promise(r => server.listen(0, r));
  const b = await chromium.launch({executablePath});
  const look = async ua => {
    const ctx = await b.newContext({userAgent: ua}); const page = await ctx.newPage();
    await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForSelector("#allDownloads .plat");
    const r = await page.evaluate(() => ({files: [...document.querySelectorAll("#allDownloads .file")].map(e => e.textContent), hero: document.getElementById("heroDownloads").textContent, all: document.getElementById("allDownloads").textContent}));
    await ctx.close(); return r;
  };
  try {
    const MACUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
    const WINUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
    const link = (k, url, file) => { CONFIG = CONFIG.replace(new RegExp("(" + k + ':[^}]*?)url: "[^"]*", file: "[^"]*"'), '$1url: "' + url + '", file: "' + file + '"'); };
    const REL = "https://github.com/connorpelkmans/installers/releases/download/v1.2.3/";
    CONFIG = CONFIG.replace(/VERSION: "[^"]*"/, 'VERSION: "9.9.9"')
      .replace(/releases\/download\/v[\d.]+\/Studyboard-([\w-]*?)[\d.]+(\.exe)/g, "releases/download/v1.2.3/Studyboard-$11.2.3$2");
    // one universal DMG for every Mac: one Mac button and one Mac card, no "Which Mac do I have?"
    link("macArm", REL + "Studyboard-1.2.3-mac-universal.dmg", "Studyboard-{version}-mac-universal.dmg");
    link("macIntel", REL + "Studyboard-1.2.3-mac-universal.dmg", "Studyboard-{version}-mac-universal.dmg");
    { const mac = await look(MACUA), win = await look(WINUA);
      ok(mac.files.filter(f => /\.dmg$/.test(f)).join() === "Studyboard-1.2.3-mac-universal.dmg", "one universal Mac download: " + mac.files.join(", "));
      ok(/Download for Mac/.test(mac.hero) && /v1\.2\.3/.test(mac.hero) && !/Intel Macs?\b.*Download|Mac with Intel|Which Mac/.test(mac.hero + mac.all), "the Mac hero has a single Mac button: " + mac.hero.replace(/\s+/g, " ").slice(0, 120));
      ok(!/Mac M-series|Mac Intel/.test(win.hero) && /Mac/.test(win.hero), "other computers see one Mac link: " + win.hero.replace(/\s+/g, " ").slice(0, 120)); }
    // separate M-series and Intel files: two Mac cards, named from the version in each link
    link("macArm", REL + "Studyboard-1.2.3-mac.dmg", "Studyboard-{version}-mac.dmg");
    link("macIntel", REL + "Studyboard-1.2.3-mac-intel.dmg", "Studyboard-{version}-mac-intel.dmg");
    { const mac = await look(MACUA);
      ok(mac.files.includes("Studyboard-1.2.3-mac.dmg") && mac.files.includes("Studyboard-1.2.3-mac-intel.dmg"), "Mac file names come from the version in the link, not the web app's: " + mac.files.join(", "));
      ok(!/9\.9\.9/.test(mac.files.filter(f => !/AppImage/.test(f)).join()) && !/v9\.9\.9/.test(mac.hero), "the web app's version is never shown on an installer that has a link: " + mac.hero.replace(/\s+/g, " ").slice(0, 120)); }
  } finally { await b.close(); server.close(); }
  // check:release: the links must be this release
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version;
  const cfg = fs.readFileSync(path.join(W, "config.js"), "utf8"), linked = (/releases\/download\/v([\d.]+)\//.exec(cfg) || [])[1];
  const r = cp.spawnSync(process.execPath, [path.join(root, "scripts", "check-release.js"), "web"], {encoding: "utf8"});
  if (linked === pkg) ok(!/DOWNLOADS\./.test(r.stdout), "check:release is quiet when the links match package.json " + pkg);
  else ok(r.status === 1 && new RegExp("DOWNLOADS\\.windows: links to " + linked.replace(/\./g, "\\.") + ", but package\\.json is " + pkg.replace(/\./g, "\\.")).test(r.stdout), `check:release fails while the website links ${linked} and package.json is ${pkg}`);
  console.log(`\n${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
