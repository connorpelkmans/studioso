// Every supabase-*.sql file must fit Supabase's SQL Editor, which refuses a query over 0.98 MB.
// Run: node tests/sql-size.test.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const root = path.join(__dirname, ".."), LIMIT = 0.98 * 1024 * 1024;
const files = fs.readdirSync(root).filter(f => /^supabase-.*\.sql$/.test(f));
assert(files.length > 5, "found the SQL files");
for (const f of files) {
  const n = fs.statSync(path.join(root, f)).size;
  assert(n < LIMIT * 0.9, `${f} is ${n} bytes, too close to the SQL Editor's limit of ${Math.floor(LIMIT)}; split it`);
}
console.log(`sql-size.test: ${files.length} files fit the SQL Editor`);
