// node tests/lms-feed-weekly.e2e.js: a school calendar link keeps weekly items of the same name apart (by the item's id in its link,
// else by the day), still joins an item's opens/due/closes entries, and folds the same entry given twice into one task
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
  const errs = [];
  try {
    const ctx = await browser.newContext({serviceWorkers: "block"});
    await ctx.route(/supabase\.co/, r => r.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: "[]"}));
    await ctx.addInitScript(() => { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); });
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.SBLMS && SBLMS.brightspace && SBLMS.canvas);
    const r = await page.evaluate(() => {
      const z = x => String(x).padStart(2, "0"), day = k => { const d = new Date(Date.UTC(2031, 0, 6 + k)); return `${d.getUTCFullYear()}${z(d.getUTCMonth() + 1)}${z(d.getUTCDate())}`; };
      const ev = (uid, sum, when, extra) => ["BEGIN:VEVENT", "UID:" + uid, "SUMMARY:" + sum, "DTSTART:" + when + "T235900Z", "DTEND:" + when + "T235900Z"].concat(extra || [], "END:VEVENT");
      const cal = evs => ["BEGIN:VCALENDAR", "VERSION:2.0"].concat(...evs, "END:VCALENDAR").join("\r\n");
      const titles = out => out.recs.map(x => x.title + "@" + x.due).sort();
      // Brightspace: no item id in the links; ten "Weekly Reflection - Due" a week apart, each with its own "Availability Starts"
      const bsLink = id => "URL:https://school.brightspace.com/d2l/le/calendar/6606/event/" + id + "/detailsview";
      const bsEvs = [];
      for (let w = 0; w < 10; w++) {
        bsEvs.push(ev("due" + w, "Weekly Reflection - Due", day(w * 7 + 4), [bsLink(100 + w), "LOCATION:NURS 101"]));
        bsEvs.push(ev("start" + w, "Weekly Reflection - Availability Starts", day(w * 7), [bsLink(200 + w), "LOCATION:NURS 101"]));
      }
      bsEvs.push(ev("due0", "Weekly Reflection - Due", day(4), [bsLink(100), "LOCATION:NURS 101"]));   // the same entry twice
      bsEvs.push(ev("x1", "Care Plan - Due", day(20), [bsLink(300), "LOCATION:NURS 101"]), ev("x2", "Care Plan - Availability Starts", day(10), [bsLink(301), "LOCATION:NURS 101"]));
      const bs = SBLMS.brightspace.fromFeed(cal(bsEvs), "feed");
      const wr = bs.recs.filter(x => x.title === "Weekly Reflection"), cp = bs.recs.find(x => x.title === "Care Plan");
      // Canvas: weekly assignments with the same name, keyed by their assignment ids; the same assignment twice is one
      const cvEv = (id, k) => ev("event-assignment-" + id, "Discussion Post [BIO 110]", day(k), ["URL:https://school.instructure.com/calendar?include_contexts=course_42&month=01&year=2031#assignment_" + id]);
      const cv = SBLMS.canvas.fromFeed(cal([cvEv(901, 2), cvEv(902, 9), cvEv(903, 16), cvEv(903, 16)]), "feed");
      return {wr: wr.map(x => ({due: x.due, start: x.start, key: x.key || ""})), cp, cv: cv.recs.map(x => ({due: x.due, key: x.key || "", url: x.url})), all: titles(bs)};
    });
    ok(r.wr.length === 10, "ten weekly Brightspace items of one name stay ten tasks (the repeat entry folded in): " + r.wr.length);
    ok(r.wr.every(x => x.start && x.start < x.due) && new Set(r.wr.map(y => y.key)).size === 10, "each keeps its own week's start and its own key: " + JSON.stringify(r.wr.slice(0, 2)));
    ok(r.wr.every(x => (Date.parse(x.due) - Date.parse(x.start)) / 864e5 === 4), "each week's start goes with that week's due day");
    ok(r.cp && r.cp.start && !r.cp.key, "a single item still joins its opens and due entries, under its usual key: " + JSON.stringify(r.cp && {due: r.cp.due, start: r.cp.start, key: r.cp.key}));
    ok(r.cv.length === 3 && new Set(r.cv.map(x => x.key)).size === 3 && r.cv.every(x => /\/assignments\/90[123]$/.test(x.url) && x.key.endsWith(x.url.match(/\d+$/)[0])), "Canvas assignments of one name are told apart by their ids: " + JSON.stringify(r.cv));
    ok(!errs.length, "no page errors: " + errs.join("; "));
    console.log(`lms-feed-weekly: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
