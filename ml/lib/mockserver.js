// A stand-in OpenAI-compatible server for testing the pipeline with no model and no cost: it answers any JSON-schema request with
// a schema-valid object built from the request's own sentences (so the app's checks have something real to check).
//   node ml/lib/mockserver.js 8090   then TEACHER_URL=http://127.0.0.1:8090/v1 TEACHER_MODEL=mock
const http = require("http");
const port = Number(process.argv[2] || 8090);
const {loose} = require("./llm");
function build(schema, ctx, key){
  const s = loose(schema) || {type: "string"};
  if (s.enum) return s.enum[0];
  switch (s.type) {
    case "object": { const o = {}; for (const [k, v] of Object.entries(s.properties || {})) o[k] = build(v, ctx, k); return o; }
    case "array": return Array.from({length: key === "cards" || key === "facts" || key === "questions" ? 4 : 2}, (_, i) => build(s.items, Object.assign({}, ctx, {i: ctx.i * 7 + i}), key));
    case "integer": case "number": return key === "n" ? (ctx.i % 4) + 1 : key === "focusMinutes" ? 0 : 1;
    case "boolean": return true;
    default: {
      const sent = ctx.sents[ctx.i % Math.max(1, ctx.sents.length)] || "A short answer.";
      if (key === "basis") return sent.split(" ").slice(0, 6).join(" ");
      if (key === "front" || key === "stem") return `What does the notes' point ${ctx.i + 1} say about ${sent.split(" ").slice(0, 3).join(" ")}?`;
      if (key === "back" || key === "answer") return sent.split(" ").slice(-8).join(" ");
      return sent;
    }
  }
}
http.createServer((req, res) => {
  let b = ""; req.on("data", c => b += c); req.on("end", () => {
    try {
      const j = JSON.parse(b), user = j.messages.filter(m => m.role !== "system").map(m => m.content).join("\n");
      const sents = (user.match(/[A-Z][^.!?\n]{20,200}[.!?]/g) || []).slice(0, 40);
      const schema = j.response_format && (j.response_format.json_schema ? j.response_format.json_schema.schema : j.response_format.schema);
      const n = j.n || 1, choices = Array.from({length: n}, (_, k) => ({index: k, finish_reason: "stop", message: {role: "assistant", content: JSON.stringify(schema ? build(typeof schema === "string" ? JSON.parse(schema) : schema, {sents: sents.slice(k), i: 0}, "") : {text: sents[0] || "ok"})}}));
      res.writeHead(200, {"content-type": "application/json"}); res.end(JSON.stringify({choices, usage: {prompt_tokens: Math.ceil(user.length / 4), completion_tokens: 200 * n}}));
    } catch (e) { res.writeHead(400); res.end(String(e)); }
  });
}).listen(port, "127.0.0.1", () => console.error("mock model on " + port));
