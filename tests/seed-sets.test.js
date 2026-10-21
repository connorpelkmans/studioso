// Studyboard's own sample sets (seed-sets/*.json -> supabase-seed-sets*.sql): well formed, real schools, honest names, SQL up to date.
// Run: node tests/seed-sets.test.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const root = path.join(__dirname, ".."), G = require("../scripts/gen-seed-sets.js");
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const sets = G.load();
if (!sets.length) { console.log("seed-sets.test: no sets yet"); process.exit(0); }
const schools = fs.readdirSync(root).filter(f => /^supabase-schools.*\.sql$/.test(f)).map(f => fs.readFileSync(path.join(root, f), "utf8")).join("\n");
for (const s of sets) {
  ok(schools.includes(`'${s.school}'`), `${s.id}: ${s.school} is in the school list`);
  ok(s.cards.length >= 15 && s.cards.length <= 60, `${s.id}: 15 to 60 cards (${s.cards.length})`);
  ok(/^https?:\/\//.test(s.src), `${s.id}: has the official page it was based on`);
  ok(!/quizlet|coursehero|studocu|chegg|brainscape|cram\.com|scribd|slideshare|docsity|oneclass|knowt|studylib|pdfcoffee|testbank/i.test(s.src), `${s.id}: based on an official school page, never a study-sharing site (${s.src})`);
  ok(!/\bactual exam\b|\breal exam\b|leaked|answer key/i.test(s.name + " " + s.cards.map(c => c.front + " " + c.back).join(" ")), `${s.id}: never claims to be a real exam`);
  ok(!/<\/?(b|i|p|br|div|span|script|style|a|img|strong|em|ul|ol|li|h[1-6]|table|iframe)\b[^>]*>/i.test(s.cards.map(c => c.front + " " + c.back).join(" ")), `${s.id}: plain text only, no HTML`);
  ok(s.look && G.COLORS.includes(s.look.color) && G.ICONS.includes(s.look.icon), `${s.id}: published with one of the app's colours and icons`);
}
const {files} = G.build();
for (const [f, t] of files) ok(fs.existsSync(path.join(root, f)) && fs.readFileSync(path.join(root, f), "utf8") === t, `${f} is up to date (run node scripts/gen-seed-sets.js)`);
console.log(`seed-sets.test: ${n} checks passed (${sets.length} sets)`);
