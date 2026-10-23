// Writes a hardened `_headers` file (Netlify / Cloudflare Pages) for the Studyboard website
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const src = path.resolve(process.argv[2] || path.join(__dirname, "index.html"));
const out = path.resolve(process.argv[3] || path.join(__dirname, "_headers.strict"));
const html = fs.readFileSync(src, "utf8");
const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => `'sha256-${crypto.createHash("sha256").update(m[1], "utf8").digest("base64")}'`);
if (!hashes.length) throw new Error("make-headers: no inline scripts found in " + src);
const base = fs.readFileSync(path.join(__dirname, "_headers"), "utf8");
const strict = base.replace("'unsafe-inline' https://cdn.jsdelivr.net", hashes.join(" ") + " https://cdn.jsdelivr.net");
if (strict === base) throw new Error("make-headers: couldn't find the script-src placeholder in _headers");
fs.writeFileSync(out, strict);
console.log(`Wrote ${out} with ${hashes.length} script hashes.`);
