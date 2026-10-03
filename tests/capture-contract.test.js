// Keeps the native capture clients in step with capture-contract.json.  Run: node tests/capture-contract.test.js
// 1. Static: the Swift and Kotlin sources (never compiled here) still contain the contract's path, headers, fields, limits, timeout and source list.
// 2. Behavioural: a request built exactly the way the native code builds it (reference builder below, mirroring SBCapture.send / CaptureClient.send)
//    is sent to a local mock of the endpoint that ENFORCES the contract; plus negative cases the mock must reject.
// It cannot prove the Swift/Kotlin compile or behave: see VOICE-CAPTURE-NATIVE.md "verification checklist".
const fs = require("fs"), path = require("path"), assert = require("assert"), http = require("http"), crypto = require("crypto");
const root = path.join(__dirname, "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8");
const C = JSON.parse(read("capture-contract.json"));
let n = 0; const ok = (c, m) => { n++; assert(c, m); };

// ---------- 1. static checks on the native sources ----------
const swift = read("ios-wrapper/native/SBCapture.swift");
const kotlin = read("android-wrapper/app/src/main/java/com/studioso/app/capture/CaptureClient.kt") + read("android-wrapper/app/src/main/java/com/studioso/app/capture/CaptureStore.kt");
const both = { swift, kotlin };
for (const [name, src] of Object.entries(both)) {
  ok(src.includes(C.path), name + ": endpoint path");
  ok(src.includes(C.hostSuffix) || src.includes(C.hostSuffix.replace(/\./g, "\\\\.")), name + ": host suffix");
  ok(src.includes("Idempotency-Key"), name + ": Idempotency-Key header");
  ok(src.includes("Authorization") && src.includes("Bearer"), name + ": Bearer authorization");
  ok(src.includes(C.headers.contentType), name + ": content type");
  for (const f of Object.keys(C.bodyFields)) ok(src.includes('"' + f + '"'), name + ": body field " + f);
  for (const s of C.bodyFields.source.enum) ok(src.includes('"' + s + '"'), name + ": source " + s);
  ok(!/\bprint\(|NSLog\(|Log\.[dviwe]\(|println\(/.test(src), name + ": no logging calls in the capture client");
}
ok(/timeoutSeconds: TimeInterval = 8\b/.test(swift) && C.timeoutSeconds === 8, "swift timeout 8 s");
ok(/TIMEOUT_MS = 8000\b/.test(kotlin), "kotlin timeout 8000 ms");
ok(swift.includes("maxTextLength = " + C.bodyFields.text.maxLength) && kotlin.includes("MAX_TEXT = " + C.bodyFields.text.maxLength), "text limit");
ok(swift.includes("maxDueLength = " + C.bodyFields.due.maxLength) && kotlin.includes("MAX_DUE = " + C.bodyFields.due.maxLength), "due limit");
ok(swift.includes("maxCourseLength = " + C.bodyFields.course.maxLength) && kotlin.includes("MAX_COURSE = " + C.bodyFields.course.maxLength), "course limit");
ok(/scheme == "https"/.test(swift) && /scheme == "https"/.test(kotlin), "https enforced in both");
// the JS bridge validates the same endpoint shape
const bridge = read("ios-wrapper/native-bridge.js");
ok(bridge.includes(C.path) && bridge.includes("supabase\\.co"), "bridge builds the same endpoint");
// deep links named in the contract exist in the Android shortcuts / README
ok(read("android-wrapper/app/src/main/res/xml/shortcuts.xml").includes("studyboard://capture?photo=1"), "photo deep link in shortcuts");

// ---------- 2. behavioural: reference builder + contract-enforcing mock ----------
const clip = (s, n) => (typeof s === "string" && s.trim() ? s.trim().slice(0, n) : undefined);
function buildRequest(token, endpoint, o) {          // mirrors SBCapture.send / CaptureClient.send
  const text = clip(o.text, C.bodyFields.text.maxLength);
  if (!text) return null;
  const body = { text };
  const due = clip(o.due, C.bodyFields.due.maxLength), course = clip(o.course, C.bodyFields.course.maxLength);
  if (due) body.due = due;
  if (course) body.course = course;
  if (C.bodyFields.source.enum.includes(o.source)) body.source = o.source;
  return { method: C.method, path: new URL(endpoint).pathname, headers: { "Content-Type": C.headers.contentType, Authorization: C.headers.authorizationScheme + " " + token, "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify(body) };
}
function validate(req, token) {                      // what cap-server's function must accept/reject
  if (req.method !== C.method || req.url !== C.path) return [404, { ok: false }];
  if (req.headers.authorization !== "Bearer " + token) return [401, { ok: false }];
  if (req.headers["content-type"] !== C.headers.contentType) return [415, { ok: false }];
  if (!new RegExp(C.headers.idempotencyKeyPattern).test(req.headers["idempotency-key"] || "")) return [400, { ok: false, message: "idempotency" }];
  if (req.raw.length > C.limits.maxRequestBytes) return [413, { ok: false }];
  let b; try { b = JSON.parse(req.raw); } catch (e) { return [400, { ok: false }]; }
  for (const k of Object.keys(b)) if (!(k in C.bodyFields)) return [400, { ok: false, message: "unknown field " + k }];
  for (const [k, spec] of Object.entries(C.bodyFields)) {
    if (b[k] === undefined) { if (spec.required) return [400, { ok: false, message: k }]; continue; }
    if (typeof b[k] !== "string" || b[k].length > (spec.maxLength || 1e9) || (spec.minLength && b[k].length < spec.minLength)) return [400, { ok: false, message: k }];
    if (spec.enum && !spec.enum.includes(b[k])) return [400, { ok: false, message: k }];
  }
  return [200, { ok: true, message: "Added", speech: "Added to Studyboard: " + b.text }];
}
const TOKEN = "tok_" + "a".repeat(32);
const seenKeys = new Set();
const server = http.createServer((rq, rs) => {
  let raw = ""; rq.on("data", d => raw += d); rq.on("end", () => {
    rq.raw = raw;
    const [code, json] = validate(rq, TOKEN);
    if (code === 200) { const k = rq.headers["idempotency-key"]; json.duplicate = seenKeys.has(k); seenKeys.add(k); }
    rs.writeHead(code, { "Content-Type": "application/json" }); rs.end(JSON.stringify(json));
  });
});
function post(port, r) {
  return new Promise((res, rej) => {
    const q = http.request({ host: "127.0.0.1", port, path: r.path, method: r.method, headers: r.headers }, s => { let d = ""; s.on("data", x => d += x); s.on("end", () => res({ status: s.statusCode, json: JSON.parse(d) })); });
    q.on("error", rej); q.end(r.body);
  });
}
server.listen(0, "127.0.0.1", async () => {
  const port = server.address().port, endpoint = "https://abc.supabase.co" + C.path;
  try {
    const good = buildRequest(TOKEN, endpoint, { text: "  bio lab report  ", due: "friday", course: "Biology", source: "siri" });
    let r = await post(port, good);
    ok(r.status === 200 && r.json.ok && r.json.speech.length <= C.limits.speechMaxChars, "good request accepted");
    ok(JSON.parse(good.body).text === "bio lab report", "text trimmed");
    r = await post(port, buildRequest(TOKEN, endpoint, { text: "x" }));
    ok(r.status === 200, "text only accepted");
    const longText = buildRequest(TOKEN, endpoint, { text: "y".repeat(900), source: "bogus" });
    ok(JSON.parse(longText.body).text.length === 500 && !("source" in JSON.parse(longText.body)), "long text clipped, bad source dropped");
    r = await post(port, longText); ok(r.status === 200, "clipped request accepted");
    ok(buildRequest(TOKEN, endpoint, { text: "   " }) === null, "blank text never sent");
    // negative: the mock really enforces the contract
    const bad = (mut) => { const q = buildRequest(TOKEN, endpoint, { text: "t" }); mut(q); return post(port, q); };
    ok((await bad(q => { q.headers.Authorization = "Bearer wrong"; })).status === 401, "wrong token rejected");
    ok((await bad(q => { delete q.headers["Idempotency-Key"]; })).status === 400, "missing idempotency key rejected");
    ok((await bad(q => { q.body = JSON.stringify({ text: "t", extra: 1 }); })).status === 400, "unknown field rejected");
    ok((await bad(q => { q.body = JSON.stringify({ due: "x" }); })).status === 400, "missing text rejected");
    ok((await bad(q => { q.body = JSON.stringify({ text: "t", source: "nope" }); })).status === 400, "bad source rejected");
    // retry with the same Idempotency-Key is seen as a duplicate (server must dedupe; contract requires the key to be stable per item)
    const a = buildRequest(TOKEN, endpoint, { text: "once" });
    await post(port, a); r = await post(port, a);
    ok(r.json.duplicate === true, "same Idempotency-Key detected as duplicate");
    console.log("capture-contract: " + n + " checks passed");
  } catch (e) { console.error(e); process.exitCode = 1; }
  server.close();
});
