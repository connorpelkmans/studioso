// Copies the app's course icons, icon guesses and course colours from index.html into cloudflare/site/course-icons.js,
// so the public flashcard pages draw decks the same way the app does. Run after changing them in index.html:
//   node scripts/gen-course-icons.js          (tests/public-pages.test.js fails when the copy is out of date)
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
function build(){
  const src = require("./app-files").source();
  const grab = (start, end) => { const i = src.indexOf(start); if (i < 0) throw new Error("not found: " + start); const j = src.indexOf(end, i); return src.slice(i, j + end.length); };
  const code = [grab("const COURSE_ICONS = {", "\n};"), grab("const COURSE_ICON_VB = {", "};"), grab("const COURSE_ICON_GUESS = [", "]];"), grab("const GENERAL_ICON = `", "`;"), grab("const COURSE_COLORS = [", "];")].join("\n");
  const box = {}; vm.runInNewContext(code + "\nthis.r = {COURSE_ICONS, COURSE_ICON_VB, COURSE_ICON_GUESS, GENERAL_ICON, COURSE_COLORS};", box);
  const r = box.r, icons = {};
  for (const k of Object.keys(r.COURSE_ICONS)) icons[k] = [r.COURSE_ICON_VB[k] || "0 0 24 24", r.COURSE_ICONS[k][1]];
  return `// Made by scripts/gen-course-icons.js from index.html. Don't edit by hand.
export const ICONS = ${JSON.stringify(icons)};
export const GUESS = [${r.COURSE_ICON_GUESS.map(g => `[${g[0].toString()}, ${JSON.stringify(g[1])}]`).join(", ")}];
export const GENERAL = ${JSON.stringify(r.GENERAL_ICON)};
export const COLORS = ${JSON.stringify(r.COURSE_COLORS)};
`;
}
module.exports = {build, file: path.join(root, "cloudflare", "site", "course-icons.js")};
if (require.main === module) { fs.writeFileSync(module.exports.file, build()); console.log("wrote", module.exports.file); }
