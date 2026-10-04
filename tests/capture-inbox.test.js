// node tests/capture-inbox.test.js  (extracts the pure CAPTURE-INBOX block from index.html and tests it)
const fs = require("fs"), path = require("path"), assert = require("assert");
const src = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const a = src.indexOf("/* CAPTURE-INBOX-START"), b = src.indexOf("/* CAPTURE-INBOX-PURE-END */");
assert.ok(a > 0 && b > a, "markers present");
assert.ok(src.indexOf("/* CAPTURE-INBOX-END */") > b, "end marker present");
const api = new Function(src.slice(a, b) + "; return {capDedupe, capConvert, capProcess, capTaskId, capKey, capWho, capNorm, capDraft};")();
let n = 0; const t = async (name, fn) => { await fn(); n++; console.log("ok -", name); };
const T0 = Date.parse("2026-10-03T12:00:00Z");
const row = (id, text, extra = {}) => Object.assign({id, text, source: "siri", created_at: new Date(T0).toISOString(), due_date: null, due_time: null, due_text: null, course_hint: null}, extra);
// a tiny stand-in for the quick-add reader
const qaLocal = s => { const m = /\b(friday|tomorrow)\b/i.exec(s); return {title: s.replace(/\b(friday|tomorrow)\b/i, "").replace(/\s+/g, " ").trim(), type: "Assignment", due: m ? "2026-10-09" : "", time: "", courseId: ""}; };
const qaConfident = (s, x) => !!x.title && !/\band\b/.test(s);
const qaCourse = h => /bio/i.test(h) ? {course: {id: "c-bio"}} : null;

(async () => {
  await t("task ids come from the inbox id (stable, safe characters)", () => {
    assert.strictEqual(api.capTaskId("AB12-cd34-ef56"), "capab12cd34ef56");
    assert.strictEqual(api.capTaskId("AB12-cd34-ef56"), api.capTaskId("ab12cd34ef56"));
    assert.ok(/^cap[a-z0-9]+$/.test(api.capTaskId("x/../y z")));
  });
  await t("dedupe: same text and due within 10 minutes is one task; 11 minutes apart is two", () => {
    const rows = [row("1", "Read chapter 4!"), row("2", "read chapter 4", {created_at: new Date(T0 + 9 * 60e3).toISOString()}), row("3", "Read chapter 4", {created_at: new Date(T0 + 21 * 60e3).toISOString()})];
    const d = api.capDedupe(rows, {});
    assert.deepStrictEqual(d.fresh.map(r => r.id), ["1", "3"]); assert.deepStrictEqual(d.ackOnly, ["2"]);
  });
  await t("dedupe: a different due date is a different task", () => {
    const d = api.capDedupe([row("1", "Essay", {due_date: "2026-10-09"}), row("2", "Essay", {due_date: "2026-10-10"})], {});
    assert.strictEqual(d.fresh.length, 2);
  });
  await t("dedupe: already stored on this device (seen id or task id) is only acknowledged", () => {
    const d = api.capDedupe([row("1", "A"), row("2", "B"), row("3", "C")], {seen: new Set(["1"]), hasTask: id => id === api.capTaskId("2")});
    assert.deepStrictEqual(d.fresh.map(r => r.id), ["3"]); assert.deepStrictEqual(d.ackOnly.sort(), ["1", "2"]);
  });
  await t("dedupe: repeats of a task made a moment ago in the app", () => {
    const d = api.capDedupe([row("1", "Buy goggles"), row("2", "Lab report")], {recent: [{key: api.capKey("Buy goggles", ""), at: T0 - 120e3}]});
    assert.deepStrictEqual(d.fresh.map(r => r.id), ["2"]);
  });
  await t("convert: ISO due date wins, raw due words are read by the app's reader, unknown words mean 'not sure'", () => {
    const D = {qaLocal, qaConfident, qaCourse};
    let x = api.capConvert(row("a1", "Finish essay", {due_date: "2026-10-12", due_time: "17:00:00"}), D);
    assert.strictEqual(x.due, "2026-10-12"); assert.strictEqual(x.time, "17:00"); assert.strictEqual(x.sure, true); assert.strictEqual(x.id, "capa1");
    x = api.capConvert(row("a2", "Finish essay", {due_text: "friday"}), D);
    assert.strictEqual(x.due, "2026-10-09"); assert.strictEqual(x.sure, true);
    x = api.capConvert(row("a3", "Finish essay", {due_text: "whenever the moon is full"}), D);
    assert.strictEqual(x.due, ""); assert.strictEqual(x.sure, false);
    x = api.capConvert(row("a4", "Quiz prep", {course_hint: "Bio 101"}), D);
    assert.strictEqual(x.courseId, "c-bio"); assert.strictEqual(x.sure, true);
    x = api.capConvert(row("a5", "Quiz prep", {course_hint: "Underwater basket weaving"}), D);
    assert.strictEqual(x.courseId, ""); assert.strictEqual(x.sure, false);
    x = api.capConvert(row("a6", "x".repeat(500)), D); assert.strictEqual(x.title.length, 200);
  });
  await t("who: one source is named, mixed sources say voice capture", () => {
    assert.strictEqual(api.capWho(["siri", "siri"]), "Siri"); assert.strictEqual(api.capWho(["pixelgemini"]), "Gemini");
    assert.strictEqual(api.capWho(["bixby"]), "Bixby"); assert.strictEqual(api.capWho(["siri", "bixby"]), "voice capture"); assert.strictEqual(api.capWho(["zzz"]), "your voice assistant");
  });

  const harness = (over = {}) => {
    const log = [], tasks = new Set();
    const d = Object.assign({
      dedupe: () => ({seen: new Set(), hasTask: id => tasks.has(id), recent: []}),
      convert: r => api.capConvert(r, {qaLocal, qaConfident, qaCourse}),
      addTasks: async items => { log.push("add:" + items.map(x => x.id).join(",")); items.forEach(x => tasks.add(x.id)); },
      verifySaved: ids => { log.push("verify"); return true; },
      seenAdd: ids => log.push("seen:" + ids.join(",")), ack: async ids => { log.push("ack:" + ids.join(",")); },
      onTest: rows => log.push("test:" + rows.length)
    }, over);
    return {d, log, tasks};
  };
  await t("ordering: store, verify saved, remember, THEN acknowledge", async () => {
    const h = harness(); const r = await api.capProcess([row("1", "Read ch 4"), row("2", "Lab report friday")], h.d);
    assert.deepStrictEqual(h.log, ["add:cap1,cap2", "verify", "seen:1,2", "ack:1,2"]); assert.strictEqual(r.added, 2); assert.strictEqual(r.failed, false);
  });
  await t("if saving fails nothing is acknowledged (the capture stays in the inbox)", async () => {
    const h = harness({verifySaved: () => false}); const r = await api.capProcess([row("1", "Read ch 4")], h.d);
    assert.ok(!h.log.some(x => x.startsWith("ack") || x.startsWith("seen"))); assert.strictEqual(r.failed, true); assert.strictEqual(r.added, 0);
  });
  await t("if storing throws nothing is acknowledged", async () => {
    const h = harness({addTasks: async () => { throw new Error("boom"); }}); const r = await api.capProcess([row("1", "Read ch 4")], h.d);
    assert.deepStrictEqual(h.log, []); assert.strictEqual(r.failed, true);
  });
  await t("crash after storing but before the acknowledgement: the retry only acknowledges, no double task", async () => {
    const h = harness({ack: async () => { throw new Error("offline"); }});
    let r = await api.capProcess([row("1", "Read ch 4")], h.d);
    assert.strictEqual(r.ackFailed, true); assert.strictEqual(h.tasks.size, 1);
    const h2 = harness(); h2.tasks.add("cap1");
    r = await api.capProcess([row("1", "Read ch 4")], h2.d);
    assert.deepStrictEqual(h2.log, ["ack:1"]); assert.strictEqual(r.added, 0); assert.strictEqual(r.duplicates, 1);
  });
  await t("test captures are acknowledged and reported, never made into tasks", async () => {
    const h = harness(); const r = await api.capProcess([row("9", "Studyboard test capture", {source: "test"})], h.d);
    assert.deepStrictEqual(h.log, ["ack:9", "test:1"]); assert.strictEqual(r.added, 0);
  });
  await t("pipeline path: only the refs it reports stored are acknowledged", async () => {
    const h = harness({ingest: async drafts => { h.log.push("ingest:" + drafts.map(x => x.ref).join(",") + ":" + drafts[0].text); return {stored: ["1"]}; }});
    const r = await api.capProcess([row("1", "A"), row("2", "B")], h.d);
    assert.deepStrictEqual(h.log, ["ingest:1,2:A", "seen:1", "ack:1"]); assert.strictEqual(r.added, 1);
    const h2 = harness({ingest: async () => { throw new Error("x"); }}); const r2 = await api.capProcess([row("1", "A")], h2.d);
    assert.deepStrictEqual(h2.log, []); assert.strictEqual(r2.failed, true);
    const h3 = harness({ingest: async () => true}); const r3 = await api.capProcess([row("1", "A"), row("2", "B")], h3.d);
    assert.deepStrictEqual(h3.log, ["seen:1,2", "ack:1,2"]); assert.strictEqual(r3.added, 2);
  });
  await t("empty and junk input is harmless", async () => {
    const h = harness(); await api.capProcess([], h.d); await api.capProcess(null, h.d); await api.capProcess([null, {}], h.d); assert.deepStrictEqual(h.log, []);
  });
  console.log(`\n${n} capture-inbox tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
