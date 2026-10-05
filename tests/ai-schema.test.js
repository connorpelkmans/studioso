// AI response schemas: Gemini rejects a schema whose enum holds an empty string ("enum[0]: cannot be empty"), which made whole companion
// actions (flashcards from an uploaded file, task edits) fail. Run: node tests/ai-schema.test.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const src = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const enums = [...src.matchAll(/enum:\s*\[([^\]]*)\]/g)].map(m => ({at: src.slice(0, m.index).split("\n").length, body: m[1]}));
ok(enums.length > 5, `found the schema enums (${enums.length})`);
for (const e of enums) ok(!/(^|,)\s*(""|'')\s*(,|$)/.test(e.body), `index.html:${e.at}: an enum must not contain an empty string: [${e.body.slice(0, 80)}]`);
// The companion's edit_tasks action says "keep" for an unchanged priority or status, and the parser treats anything else as no change.
ok(/enum: \["keep", "low", "med", "high", "urgent"\]/.test(src) && /enum: \["keep", "todo", "doing", "done"\]/.test(src), "edit_tasks uses keep, not an empty string");
ok(/priority: \["low", "med", "high", "urgent"\]\.includes\(x\.priority\) \? x\.priority : ""/.test(src) && /status: \["todo", "doing", "done"\]\.includes\(x\.status\) \? x\.status : ""/.test(src), "keep maps to no change when the action is read");
console.log(`ai-schema: ${n} checks passed`);
