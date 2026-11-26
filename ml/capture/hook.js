// Preload (node -r hook.js tests/x.e2e.js): records every request a test's page sends to an AI company, without changing the test
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "requests.jsonl"), test = path.basename(process.argv[1] || "");
const pw = require("/home/user/studioso/tests/pw.js");
const launch = pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch = async (...a) => {
  const b = await launch(...a), nc = b.newContext.bind(b);
  b.newContext = async (...x) => { const c = await nc(...x);
    c.on("request", r => { const u = r.url(); if (/generativelanguage\.googleapis\.com|api\.anthropic\.com\/v1\/messages$|api\.openai\.com/.test(u) && r.method() === "POST") {
      try { fs.appendFileSync(OUT, JSON.stringify({test, url: u.replace(/\?.*$/, ""), body: r.postData()}) + "\n"); } catch (e) {} } });
    return c; };
  return b;
};
