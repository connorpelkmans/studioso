// Groups the captured requests (requests.jsonl) by feature: one example of each distinct system prompt, in Gemini's request
// shape turned back into aiCall's ({system, parts, schema, maxTokens}). Writes unique.json and prints a list.
const fs = require("fs"), path = require("path");
const rows = fs.readFileSync(path.join(__dirname, "requests.jsonl"), "utf8").trim().split("\n").map(l => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);
const out = new Map();
for (const r of rows) {
  if (!/generativelanguage/.test(r.url)) continue;
  let b; try { b = JSON.parse(r.body); } catch (e) { continue; }
  const system = ((b.systemInstruction || {}).parts || []).map(p => p.text || "").join("\n");
  const contents = b.contents || [];
  const user = contents.filter(c => c.role !== "model");
  const parts = (user[user.length - 1] || {}).parts || [];
  // earlier turns of a chat go in as text, as the app's own chat does for every engine
  const hist = contents.length > 1 ? contents.slice(0, -1).map(c => `${c.role === "model" ? "Assistant" : "Student"}: ${(c.parts || []).map(p => p.text || "").join(" ")}`).join("\n") : "";
  const gc = b.generationConfig || {}, tools = JSON.stringify(b.tools || []);
  const search = /google_search/.test(tools), urlc = /url_context/.test(tools);
  const media = parts.filter(p => p.inline_data || p.inlineData || p.file_data).map(p => ((p.inline_data || p.inlineData || {}).mime_type || (p.file_data ? "video" : "?")));
  const key = system.replace(/\s+/g, " ").slice(0, 160);
  if (out.has(key)) { out.get(key).n++; continue; }
  out.set(key, {key: key.slice(0, 90), n: 1, test: r.test, system, parts: (hist ? [{text: hist}] : []).concat(parts.filter(p => typeof p.text === "string").map(p => ({text: p.text}))), media, schema: gc.responseSchema || null, maxTokens: gc.maxOutputTokens || 2000, search, urlc});
}
const list = [...out.values()];
fs.writeFileSync(path.join(__dirname, "unique.json"), JSON.stringify(list, null, 1));
list.forEach((x, i) => console.log(`${i}\t${x.test}\t${x.n}x\t${x.search ? "SEARCH " : ""}${x.urlc ? "URL " : ""}${x.media.length ? "MEDIA:" + x.media.join(",") + " " : ""}${x.schema ? "" : "NOSCHEMA "}${x.key}`));
console.log(list.length + " distinct requests from " + rows.length);
