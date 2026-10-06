// The phone apps' school site layer (lms-mobile.src.js, built by scripts/build-lms-mobile.js): it must give the page the desktop app's calls, run the very
// same harvest scripts, and clean what comes back exactly as lms.js does. The native plugin is replaced by a stub that records what it was asked.
// Run: node tests/lms-mobile.test.js   (no Electron, no device)
const path = require("path"), assert = require("assert"), vm = require("vm"), Module = require("module");
const { build } = require("../scripts/build-lms-mobile.js");

const realLoad = Module._load;
Module._load = function (req, ...rest) { if (req === "electron") return { app: { isPackaged: true, userAgentFallback: "" }, BrowserWindow: function () {}, ipcMain: { handle() {} }, net: {}, session: {} }; return realLoad.call(this, req, ...rest); };
const L = require(path.join(__dirname, "..", "lms.js"));
Module._load = realLoad;
const SRC = build();

function load(opts) {
  const o = opts || {}, calls = [], store = {};
  const stub = o.plugin === null ? null : { async connect(a) { calls.push(["connect", a]); return o.connect ? o.connect(a) : { ok: true, name: "Sam" }; },
    async run(a) { calls.push(["run", a]); return o.run ? o.run(a) : { ok: true, json: "{}" }; },
    async signOut(a) { calls.push(["signOut", a]); return o.signOut ? o.signOut(a) : {}; } };
  const win = { Capacitor: stub ? { Plugins: { StudyboardLms: stub } } : {} };
  if (o.desktop) win.studiosoDesktop = { lms: {} };
  const ctx = vm.createContext({ window: win, localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } }, URL, JSON, Promise, Math, Number, String, Array, Object, RegExp, Date, setTimeout });
  vm.runInContext(SRC, ctx);
  return { win, calls, store };
}
const eq = (a, b, m) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), m);   // objects from the vm have another realm's prototypes
let n = 0; const t = async (name, fn) => { n++; try { await fn(); console.log("ok -", name); } catch (e) { console.log("FAIL", name, "\n  ", String(e && e.stack || e).split("\n").slice(0, 6).join("\n   ")); process.exitCode = 1; } };
const SAFE = { pastDays: 60, aheadDays: 240, grades: true, news: true, only: null, skip: [] };

(async () => {
  await t("it stays out of the way: no plugin, or the desktop app", async () => {
    assert(!load({ plugin: null }).win.studiosoLms, "no plugin, no bridge");
    assert(!load({ desktop: true }).win.studiosoLms, "desktop keeps its own");
    const b = load().win.studiosoLms;
    assert(b && b.mobile && ["connect", "sync", "file", "mail", "signOut"].every(k => typeof b[k] === "function"), "the desktop's calls are all there");
    assert(!("feed" in b), "calendar links are left to the server");
  });
  await t("sync runs the desktop's exact script on the school's page", async () => {
    for (const id of ["brightspace", "canvas", "blackboard"]) {
      const m = load(); await m.win.studiosoLms.sync(id, "learn.example.edu", {});
      const [, a] = m.calls[0];
      assert.strictEqual(a.script, L.harvestScript(L.P[id], SAFE), id + ": same script as lms.js builds");
      assert.strictEqual(a.url, "https://learn.example.edu" + L.P[id].ctx); assert.strictEqual(a.origin, "https://learn.example.edu"); assert.strictEqual(a.id, id);
    }
    const m = load(); await m.win.studiosoLms.sync("canvas", "x.edu", { pastDays: 9999, aheadDays: 1, grades: false, only: ["12", "bad id!"], skip: ["a"] });
    assert(/"pastDays":365/.test(m.calls[0][1].script) && /"aheadDays":7/.test(m.calls[0][1].script) && /"grades":false/.test(m.calls[0][1].script) && /"only":\["12"\]/.test(m.calls[0][1].script), "options are clamped and cleaned like on desktop");
  });
  await t("what comes back is cleaned exactly as on desktop", async () => {
    const raw = { ok: true, me: { name: "A".repeat(500), id: "7", extra: "x" }, all: [{ ou: 1, code: "C", name: "N", evil: "x" }], courses: [{ ou: 1, assignments: [{ title: "T", url: "http://insecure.example.com/x", "bad key!": 1 }] }], items: [{ url: "https://learn.example.edu/a" }], errors: ["e"], lp: "1.30", le: "x", ms: 5 };
    const m = load({ run: () => ({ ok: true, json: JSON.stringify(raw) }) });
    const got = await m.win.studiosoLms.sync("brightspace", "learn.example.edu", {});
    eq(got, L.cleanHarvest(raw, "https://learn.example.edu"));
    assert(got.ok && got.me.name.length === 200 && got.lp === "1.30" && got.le === undefined, "shaped by the same rules");
  });
  await t("sign-in expired, errors and junk are passed on safely", async () => {
    eq(await load({ run: () => ({ needLogin: true }) }).win.studiosoLms.sync("canvas", "x.edu"), { needLogin: true });
    eq(await load({ run: () => ({ error: "timeout" }) }).win.studiosoLms.sync("canvas", "x.edu"), { error: "timeout" });
    eq(await load({ run: () => ({ ok: true, json: "not json" }) }).win.studiosoLms.sync("canvas", "x.edu"), { error: "bad-result" });
    eq(await load({ run: () => { throw new Error("native boom"); } }).win.studiosoLms.sync("canvas", "x.edu"), { error: "native boom" });
    eq(await load({ run: () => ({ ok: true, json: JSON.stringify({ needLogin: true }) }) }).win.studiosoLms.sync("canvas", "x.edu"), { needLogin: true });
  });
  await t("only real https school sites are accepted", async () => {
    const m = load(), b = m.win.studiosoLms;
    for (const h of ["", "localhost", "192.168.0.1", "learn.local", "http://10.0.0.1/x", "nodots", "a b.edu"]) {
      eq(await b.sync("canvas", h), { error: "bad-host" }, "sync " + h);
      eq(await b.connect("canvas", h), { ok: false, error: "bad-host" }, "connect " + h);
    }
    assert.strictEqual(m.calls.length, 0, "the native side was never asked");
    eq(await b.sync("moodle", "x.edu"), { error: "bad-provider" });
  });
  await t("connect: signed in, cancelled, failed", async () => {
    const m = load({ connect: a => ({ ok: true, name: "Sam" }) }), r = await m.win.studiosoLms.connect("canvas", "https://learn.example.edu/d2l/home");
    eq(r, { ok: true, origin: "https://learn.example.edu", name: "Sam" });
    const a = m.calls[0][1]; assert(a.url === "https://learn.example.edu/" && /users\/self/.test(a.who) && a.id === "canvas");
    eq(await load({ connect: () => ({ ok: false, cancelled: true }) }).win.studiosoLms.connect("canvas", "x.edu"), { ok: false, cancelled: true });
    assert.strictEqual((await load({ connect: () => ({ error: "nope" }) }).win.studiosoLms.connect("canvas", "x.edu")).ok, false);
  });
  await t("one sync at a time per site", async () => {
    let release; const gate = new Promise(r => { release = r; });
    const m = load({ run: async () => { await gate; return { ok: true, json: JSON.stringify({ ok: true, me: {}, all: [], courses: [], errors: [] }) }; } });
    const a = m.win.studiosoLms.sync("canvas", "x.edu"), b = m.win.studiosoLms.sync("canvas", "x.edu");
    release(); await Promise.all([a, b]); assert.strictEqual(m.calls.filter(c => c[0] === "run").length, 1);
  });
  await t("Brightspace file: ids are digits only and fill the desktop's script", async () => {
    const m = load({ run: () => ({ ok: true, json: JSON.stringify({ ok: true, name: "a.pdf", type: "application/pdf", b64: "AAAA" }) }) }), b = m.win.studiosoLms;
    const r = await b.file("brightspace", "learn.example.edu", { ou: "12", folder: "34", id: "56" });
    assert(r.ok && r.name === "a.pdf" && r.b64 === "AAAA");
    assert.strictEqual(m.calls[0][1].script, L.BS_FILE("12", "34", "56"), "the same script as desktop");
    eq(await b.file("brightspace", "learn.example.edu", { ou: "1;alert(1)", folder: "3", id: "5" }), { error: "bad-request" });
    eq(await b.file("blackboard", "learn.example.edu", { id: "1" }), { error: "unsupported" });
  });
  await t("Canvas file: look the file up, then fetch it from the signed-in page; another site's address is refused", async () => {
    let step = 0;
    const m = load({ run: a => (++step === 1 ? { ok: true, json: JSON.stringify({ url: "https://learn.example.edu/files/9/download?x=1", name: "n.pdf", type: "application/pdf" }) } : { ok: true, json: JSON.stringify({ ok: true, name: "", type: "", b64: "QUJD" }) }) });
    const r = await m.win.studiosoLms.file("canvas", "learn.example.edu", { id: "9" });
    assert(r.ok && r.name === "n.pdf" && r.type === "application/pdf" && r.b64 === "QUJD", JSON.stringify(r));
    assert.strictEqual(m.calls[0][1].script, L.CV_FILE("9")); assert(/files\/9\/download/.test(m.calls[1][1].script));
    const evil = load({ run: () => ({ ok: true, json: JSON.stringify({ url: "https://evil.example.com/x", name: "n" }) }) });
    eq(await evil.win.studiosoLms.file("canvas", "learn.example.edu", { id: "9" }), { error: "bad-url" });
    assert.strictEqual(evil.calls.length, 1, "nothing was fetched from the other site");
  });
  await t("Canvas inbox goes through the same script, send needs text", async () => {
    const m = load({ run: () => ({ ok: true, json: JSON.stringify({ ok: true, items: [{ id: "1", subject: "Hi", "bad key!": 1 }] }) }) }), b = m.win.studiosoLms;
    const r = await b.mail("canvas", "learn.example.edu", { op: "list", scope: "inbox" });
    assert(r.ok && r.items.length === 1 && !("bad key!" in r.items[0]));
    assert(m.calls[0][1].script.includes(L.cvMail.toString()), "the desktop's mail function");
    eq(await b.mail("canvas", "learn.example.edu", { op: "send", id: "5", body: " " }), { error: "empty" });
    eq(await b.mail("canvas", "learn.example.edu", { op: "get", id: "x" }), { error: "bad-request" });
    eq(await b.mail("brightspace", "learn.example.edu", { op: "list" }), { error: "unsupported" });
  });
  await t("sign out tells the native side which site to forget", async () => {
    const m = load(); await m.win.studiosoLms.sync("canvas", "learn.example.edu", {});
    assert.strictEqual(await m.win.studiosoLms.signOut("canvas"), true);
    eq(m.calls.find(c => c[0] === "signOut")[1], { id: "canvas", origin: "https://learn.example.edu" });
    assert.strictEqual(await m.win.studiosoLms.signOut("nope"), false);
  });
  console.log(`\n${n} checks ${process.exitCode ? "FAILED" : "passed"}`);
})();
