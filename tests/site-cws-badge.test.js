// Chrome Web Store badge on the website
const fs = require("fs"), path = require("path");
let n = 0;
const ok = (c, m) => { if (!c) { console.error("FAIL: " + m); process.exit(1); } n++; };
const W = path.join(__dirname, "..", "website");
const read = f => fs.readFileSync(path.join(W, f), "utf8");
const cfg = read("config.js"), home = read("assets/home.js"), css = read("assets/site.css");
const app = fs.readFileSync(path.join(__dirname, "..", "src/js/00-core.js"), "utf8");

const id = (s) => (s.match(/chromewebstore\.google\.com\/detail\/[^"]*?([a-p]{32})/) || [])[1];
ok(id(cfg) && id(cfg) === id(app), "the website and the app point to the same Chrome Web Store listing");
for (const f of ["assets/cws-badge.png", "assets/cws-badge-border.png"]) {
  const b = fs.readFileSync(path.join(W, f));
  ok(b.readUInt32BE(16) === 496 && b.readUInt32BE(20) === 150, f + " is Google's badge at its original 496x150 size");
}
ok(/alt="Available in the Chrome Web Store"/.test(home), "the badge keeps Google's wording as its alt text");
ok(/class="cwsb" href="' \+ esc\(CWS\) \+ '" target="_blank" rel="noopener"/.test(home), "the badge links to the listing in a new tab");
ok(/var extCard = CWS \?/.test(home), "no badge is shown without a listing address");
ok(/\.cwsb img\{display:block;height:\d+px;width:auto\}/.test(css), "the badge is only resized, keeping its proportions");
ok(/<img src="assets\/school-sync-icon.png"/.test(home) && fs.existsSync(path.join(W, "assets/school-sync-icon.png")), "the extension card shows the School Sync icon");
console.log(`site-cws-badge: ${n} checks passed`);
