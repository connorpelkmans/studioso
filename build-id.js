// Build id for crash reports: APP_VERSION plus a short content hash of the exact index.html being shipped, so a stack line such as
// "index.html:30412:9" in a report can be matched to that file. See ERROR-REPORTING.md ("Reading a stack").
//   node build-id.js [index.html]              prints the id, e.g. 1.13.0+3fa91c2b07de
//   node build-id.js --write out.html [index.html]   writes a copy with BUILD_ID = "<id>" filled in (line numbers do not change)
//   node build-id.js --check shipped.html      prints the id of a stamped file and whether its hash matches its own content
// The hash is taken with the BUILD_ID value reset to "dev", so stamping never changes the id.
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const LINE = /const BUILD_ID = "[^"]*";/;
function idOf(html) {
  const version = (/const APP_VERSION = "([^"]+)"/.exec(html) || [])[1] || "0";
  const base = html.replace(LINE, 'const BUILD_ID = "dev";');
  return version + "+" + crypto.createHash("sha256").update(base, "utf8").digest("hex").slice(0, 12);
}
function stamp(html) { return html.replace(LINE, () => `const BUILD_ID = "${idOf(html)}";`); }
module.exports = { idOf, stamp };
if (require.main === module) {
  const a = process.argv.slice(2), w = a.indexOf("--write"), c = a.indexOf("--check");
  // a page that loads its code from bundle/ (scripts/app-files.js) is read as one piece: the page with its bundle/ files
  const whole = f => { let h = fs.readFileSync(f, "utf8"); try { const AF = require("./scripts/app-files"); if (AF.refs(h).length) h = AF.inline(h, p => fs.readFileSync(path.join(path.dirname(f), p), "utf8")); } catch (e) { /* not split */ } return h; };
  if (c >= 0) {
    const html = whole(path.resolve(a[c + 1])), have = (/const BUILD_ID = "([^"]*)";/.exec(html) || [])[1];
    console.log(have, idOf(html) === have ? "matches the file's content" : "does NOT match (expected " + idOf(html) + ")");
    process.exit(idOf(html) === have ? 0 : 1);
  }
  const src = path.resolve(a.find((x, i) => !x.startsWith("--") && i !== w + 1) || path.join(__dirname, "index.html"));
  const html = whole(src);   // the id is taken over the whole app as one piece
  if (w >= 0) fs.writeFileSync(path.resolve(a[w + 1]), stamp(html));
  else console.log(idOf(html));
}
