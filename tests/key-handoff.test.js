// Unit tests for Paste My Key and Add AI to Another Device: the QR encoder (QR-START..QR-END in index.html), the code and encryption
// helpers (KEYHO-START..KEYHO-END) and the key relay Worker's logic (cloudflare/key-relay/src/relay.js).
// Run: node tests/key-handoff.test.js
const fs = require("fs"), path = require("path"), assert = require("assert"), crypto = require("crypto"), {pathToFileURL} = require("url");
const s = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const block = (a, b) => s.slice(s.indexOf(a), s.indexOf(b));
const QR = new Function(block("/*QR-START*/", "/*QR-END*/") + ";return QR;")();
const KEYHO = new Function(block("/*KEYHO-START*/", "/*KEYHO-END*/") + ";return KEYHO;")();
const subtle = crypto.webcrypto.subtle, rand = n => crypto.webcrypto.getRandomValues(new Uint8Array(n));
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };

(async () => {
  // ---- QR: every module must match the python-qrcode reference (byte mode, level M, the given mask). Hashes of the module grid,
  // rows of 0/1 joined by newlines, made with qrcode 8.x: QRCode(error_correction=M, mask_pattern=m) + QRData(bytes, MODE_8BIT_BYTE).
  const REF = [["https://keys.example.workers.dev/k#K7Q2-9XMD-4TRP", 0, 4, "74a17a5214fa941b"], ["https://keys.example.workers.dev/k#K7Q2-9XMD-4TRP", 1, 4, "b5935e8dc1a43b49"],
    ["https://keys.example.workers.dev/k#K7Q2-9XMD-4TRP", 2, 4, "8cf8b9460567dfcb"], ["https://keys.example.workers.dev/k#K7Q2-9XMD-4TRP", 3, 4, "11afd738027ea2f6"],
    ["https://keys.example.workers.dev/k#K7Q2-9XMD-4TRP", 4, 4, "e48f5fcf336e6968"], ["https://keys.example.workers.dev/k#K7Q2-9XMD-4TRP", 5, 4, "29da323dcefa82e4"],
    ["https://keys.example.workers.dev/k#K7Q2-9XMD-4TRP", 6, 4, "11aa1ac567a7d673"], ["https://keys.example.workers.dev/k#K7Q2-9XMD-4TRP", 7, 4, "9ca0425f26aec365"],
    ["A", 3, 1, "bc9009ae87ca68f1"], ["x".repeat(100), 5, 6, "103b849692b0e6f9"], ["héllo ✓ ".repeat(12), 2, 8, "c889d2b211776bd6"],
    ["q".repeat(213), 6, 10, "d60b68fc3abcdf4c"], ["z".repeat(150), 0, 8, "34c4cac466b64453"]];
  for (const [text, mask, version, hash] of REF) {
    const q = QR.encode(text, mask), rows = [];
    for (let y = 0; y < q.size; y++) { let r = ""; for (let x = 0; x < q.size; x++) r += q.dark(x, y) ? "1" : "0"; rows.push(r); }
    eq(q.version, version, `version for ${text.slice(0, 12)}`);
    eq(crypto.createHash("sha256").update(rows.join("\n")).digest("hex").slice(0, 16), hash, `modules for ${text.slice(0, 12)} mask ${mask}`);
  }
  ok(QR.encode("q".repeat(214)) === null, "too long for version 10 is refused");
  const auto = QR.encode("https://keys.example.workers.dev/k#K7Q2-9XMD-4TRP");
  ok(auto.mask >= 0 && auto.mask <= 7 && auto.version === 4, "picks a mask on its own");
  const svg = QR.svg("hello", 'a "label" <x>');
  ok(/^<svg class="qr" viewBox="0 0 29 29"/.test(svg) && svg.includes('aria-label="a label x"') && svg.includes('fill="#fff"'), "svg: quiet zone, label stripped, white background");

  // ---- codes
  const code = KEYHO.newCode(rand);
  ok(/^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/.test(code), "new code shape: " + code);
  ok(new Set(Array.from({length: 50}, () => KEYHO.newCode(rand))).size === 50, "codes differ");
  eq(KEYHO.normCode("k7q2 9xmd 4trp"), "K7Q2-9XMD-4TRP", "spaces and lower case");
  eq(KEYHO.normCode("K7Q29XMD4TRP"), "K7Q2-9XMD-4TRP", "no dashes");
  eq(KEYHO.normCode("KOQ2-IXMD-LTRP"), "K0Q2-1XMD-1TRP", "O, I and L read as 0 and 1");
  eq(KEYHO.normCode("K7Q2-9XMD-4TR"), "", "too short");
  eq(KEYHO.normCode("K7Q2-9XMD-4TRU"), "", "U is not in the alphabet");
  eq(KEYHO.codeIn("  k7q2-9xmd-4trp\n"), "K7Q2-9XMD-4TRP", "a copied code");
  eq(KEYHO.codeIn("https://app.example/#sbkey=K7Q2-9XMD-4TRP"), "K7Q2-9XMD-4TRP", "a link with a code");
  eq(KEYHO.codeIn("meet at K7Q2-9XMD-4TRP tomorrow"), "", "a code inside other text is not taken");
  const gk = "AIza" + "SyD-abcdefghijklmnopqrstuvwxyz_0123"; // 39 characters, like a real Gemini key
  eq(KEYHO.geminiKeyIn("my key: " + gk + " thanks"), gk, "finds a Gemini key in copied text");
  eq(KEYHO.geminiKeyIn("AIzaShort"), "", "no partial keys");
  eq(KEYHO.geminiKeyIn(gk + "9"), "", "no cut-off longer strings");
  eq(KEYHO.cleanKeys({gemini: " " + gk + " ", anthropic: "nope", openai: "sk-proj-" + "a".repeat(40), other: "x".repeat(40)}), {gemini: gk, openai: "sk-proj-" + "a".repeat(40)}, "only key-shaped keys of known providers");
  eq(KEYHO.cleanKeys({gemini: "has spaces in it which is wrong"}), {}, "spaces are refused");
  eq(KEYHO.cleanKeys(null), {}, "nothing");

  // ---- derive, seal, open
  const a = await KEYHO.derive("K7Q2-9XMD-4TRP", subtle), b = await KEYHO.derive("k7q2 9xmd 4trp", subtle), c = await KEYHO.derive("K7Q2-9XMD-4TRQ", subtle);
  ok(/^[0-9a-f]{64}$/.test(a.id) && a.id === b.id && a.id !== c.id, "same code, same mailbox; another code, another mailbox");
  const keys = {gemini: gk, anthropic: "sk-ant-" + "b".repeat(40)};
  const box = await KEYHO.seal(a.key, {v: 1, keys}, subtle, rand);
  ok(/^[A-Za-z0-9_-]+$/.test(box) && !box.includes(gk.slice(4)), "box is base64url and doesn't show the key");
  ok(box !== await KEYHO.seal(a.key, {v: 1, keys}, subtle, rand), "a new IV each time");
  eq((await KEYHO.open(b.key, box, subtle)).keys, keys, "the other device opens it with the same code");
  await assert.rejects(KEYHO.open(c.key, box, subtle), "a different code can't open it"); n++;
  const bad = box.slice(0, 30) + (box[30] === "A" ? "B" : "A") + box.slice(31);
  await assert.rejects(KEYHO.open(a.key, bad, subtle), "a changed box is refused"); n++;
  await assert.rejects(KEYHO.derive("nope", subtle), "a bad code is refused"); n++;

  // ---- the relay Worker (no Cloudflare runtime: an in-memory stand-in for Durable Object storage and a clock we move by hand)
  const R = await import(pathToFileURL(path.join(__dirname, "..", "cloudflare", "key-relay", "src", "relay.js")).href);
  let now = 1_000_000;
  const mem = () => { const m = new Map(); let alarm = null; return {
    get: async k => m.get(k), put: async (k, v) => { if (typeof k === "object") Object.entries(k).forEach(([x, y]) => m.set(x, y)); else m.set(k, v); },
    delete: async k => m.delete(k), deleteAll: async () => m.clear(), setAlarm: async t => { alarm = t; }, deleteAlarm: async () => { alarm = null; }, get alarm(){ return alarm; }, m}; };
  const objs = new Map(), env = {APP_URL: "https://app.example/", HANDOFF: {getByName: id => { if (!objs.has(id)) { const st = mem(); objs.set(id, {st, slot: new R.Slot(st, () => now)}); } return objs.get(id).slot; }}};
  const call = (method, p, body) => R.handle(new Request("https://relay.example" + p, {method, body: body == null ? undefined : typeof body === "string" ? body : JSON.stringify(body), headers: {"Content-Type": "application/json"}}), env);
  const id = a.id;
  eq((await call("POST", "/v1/h/" + id, {box})).status, 201, "stores a box");
  eq(objs.get(id).st.alarm, now + R.TTL_MS, "with a 10-minute alarm");
  eq((await call("POST", "/v1/h/" + id, {box})).status, 409, "an id can't be reused while it exists");
  eq(await (await call("GET", "/v1/h/" + id + "/status")).json(), {state: "waiting"}, "waiting");
  const got = await call("GET", "/v1/h/" + id);
  eq([got.status, (await got.json()).box, got.headers.get("Cache-Control"), got.headers.get("Access-Control-Allow-Origin")], [200, box, "no-store", "*"], "hands the box out, uncached");
  eq((await call("GET", "/v1/h/" + id)).status, 404, "only once");
  eq(await (await call("GET", "/v1/h/" + id + "/status")).json(), {state: "taken"}, "the first device sees it was taken");
  ok(!objs.get(id).st.m.has("box"), "the box itself is gone");
  eq((await call("POST", "/v1/h/" + id, {box})).status, 409, "a taken id can't be filled again");
  // expiry, even if the alarm is late
  const id2 = c.id;
  eq((await call("POST", "/v1/h/" + id2, {box})).status, 201, "second box");
  now += R.TTL_MS + 1;
  eq((await call("GET", "/v1/h/" + id2)).status, 404, "expired boxes are not handed out");
  eq(objs.get(id2).st.m.size, 0, "and are wiped");
  // cancel
  const id3 = "f".repeat(64);
  await call("POST", "/v1/h/" + id3, {box});
  eq((await call("DELETE", "/v1/h/" + id3)).status, 204, "the first device can cancel");
  eq(await (await call("GET", "/v1/h/" + id3 + "/status")).json(), {state: "none"}, "cancelled is gone");
  // bad input
  eq((await call("POST", "/v1/h/ABC", {box})).status, 400, "ids are 64 lower-case hex");
  eq((await call("POST", "/v1/h/" + "e".repeat(64), {box: "short"})).status, 400, "tiny boxes are refused");
  eq((await call("POST", "/v1/h/" + "e".repeat(64), {box: "<script>" + "a".repeat(50)})).status, 400, "only base64url");
  eq((await call("POST", "/v1/h/" + "e".repeat(64), "not json")).status, 400, "not JSON");
  eq((await call("POST", "/v1/h/" + "e".repeat(64), {box: "a".repeat(5000)})).status, 413, "too big");
  eq((await call("PUT", "/v1/h/" + "e".repeat(64), {box})).status, 405, "other methods");
  eq((await call("OPTIONS", "/v1/h/" + "e".repeat(64))).headers.get("Access-Control-Allow-Methods"), "GET, POST, DELETE, OPTIONS", "CORS preflight");
  // the page a scanned code opens
  const page = await call("GET", "/k"), html = await page.text();
  ok(html.includes('data-app="https://app.example"') && /script-src 'self'/.test(page.headers.get("Content-Security-Policy")), "page names the app (trailing slash dropped) under a strict CSP");
  ok(!/sbkey|[0-9A-Z]{4}-[0-9A-Z]{4}/.test(html), "the page itself carries no code (it stays in the #fragment)");
  env.APP_URL = 'javascript:alert(1)"';
  ok((await (await call("GET", "/k")).text()).includes('data-app=""'), "an APP_URL that isn't https is ignored");
  env.APP_URL = "https://a.example/?x=\"><b>";
  ok(!(await (await call("GET", "/k")).text()).includes("<b>"), "APP_URL is escaped");
  ok((await call("GET", "/k.js")).headers.get("Content-Type").startsWith("text/javascript"), "page script");
  // the page script fills in the code and the Open link from the fragment
  const els = {}, el = id => els[id] || (els[id] = {hidden: true, textContent: "", href: "", addEventListener(){}, getAttribute: () => "https://app.example"});
  new Function("location", "history", "document", "navigator", R.PAGE_JS)({hash: "#K7Q2-9XMD-4TRP", pathname: "/k"}, {replaceState(){}}, {getElementById: el, querySelector: () => el("main")}, {});
  ok(!els.ok.hidden && els.code.textContent === "K7Q2-9XMD-4TRP" && els.open.href === "https://app.example#sbkey=K7Q2-9XMD-4TRP" && !els.open.hidden, "page shows the code and links back into the app");
  for (const k of Object.keys(els)) delete els[k];
  new Function("location", "history", "document", "navigator", R.PAGE_JS)({hash: "#<img>", pathname: "/k"}, {replaceState(){}}, {getElementById: el, querySelector: () => el("main")}, {});
  ok(!els.bad.hidden && !els.code && els.ok === undefined, "a bad fragment shows the help line, not the text");

  // ---- the desktop main process returns only a key or a code from the clipboard (same patterns as KEYHO)
  const mainSrc = fs.readFileSync(path.join(__dirname, "..", "main.js"), "utf8");
  ok(/ipcMain\.handle\("clip:aikey", e => \{\s*if \(!fromMain\(e\)\) return "";/.test(mainSrc), "clipboard read is only for the main window");
  ok(!/"clipboard-read"/.test(mainSrc), "the page still has no clipboard-read permission");
  console.log(`key-handoff: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
