// Two-device sync simulation: two real browser contexts (two "devices") share one in-memory stand-in for the Supabase `items` table.
// Run:  node tests/sync-two-device.e2e.js                 (new code, server WITH supabase-sync-conflicts.sql)  -> asserts every scenario
//       MODE=nosql node tests/sync-two-device.e2e.js      (new code, server WITHOUT it: the fallback path)       -> asserts the no-text-loss rules
//       INDEX=/path/to/old/index.html OBSERVE=1 node ...   (any version, only prints what happened)
// The stand-in server mirrors supabase-lean.sql (server-stamped updated_at, deletions list) and, when MODE=cas, supabase-sync-conflicts.sql
// (rev, compare-and-set RPCs). The SQL itself was run on PostgreSQL 16 separately; this checks the client's behaviour against that contract.
const fs = require("fs"), path = require("path"), assert = require("assert"), http = require("http");
const {chromium, executablePath} = require("./pw");
const INDEX = path.resolve(process.env.INDEX || path.join(__dirname, "..", "index.html"));
const MODE = process.env.MODE || "cas", OBSERVE = !!process.env.OBSERVE, ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
const HOUR = 36e5, DAY = 864e5;
// The page is served from a tiny local web server (a real origin): localStorage on file:// pages is not reliable across reloads in a headless browser.
let BASE = "";
const web = http.createServer((req, res) => {
  const f = path.join(path.dirname(INDEX), decodeURIComponent(req.url.split("?")[0]).replace(/^\/+$/, "/" + path.basename(INDEX)));
  fs.readFile(f.startsWith(path.dirname(INDEX)) ? f : "/nonexistent", (e, b) => { if (e) { res.writeHead(404); res.end(); } else { res.writeHead(200, {"content-type": /\.html$/.test(f) ? "text/html" : /\.js$/.test(f) ? "text/javascript" : /\.css$/.test(f) ? "text/css" : "application/octet-stream"}); res.end(b); } });
});

/* ---------------- the stand-in server ---------------- */
class Server {
  constructor(cas){ this.cas = cas; this.rows = new Map(); this.deletions = []; this.devs = {}; this.writes = 0; }
  reset(){ this.rows.clear(); this.deletions = []; this.writes = 0; this.watch = null; }
  k(kind, id){ return kind + "|" + id; }
  stamp(){ return new Date().toISOString(); }
  seed(kind, id, data, ageMs, rev){ this.rows.set(this.k(kind, id), {user_id: "u1", kind, id, data, rev: rev || (this.cas ? 1 : undefined), updated_at: new Date(Date.now() - (ageMs || 0)).toISOString(), edited_at: new Date(Date.now() - (ageMs || 0)).toISOString(), updated_by: "seed"}); }
  get(kind, id){ const r = this.rows.get(this.k(kind, id)); return r ? r.data : undefined; }
  write(kind, id, data, dev, opts){
    const key = this.k(kind, id), old = this.rows.get(key), now = this.stamp();
    if (this.watch) this.watch(kind, id, data, dev);                // a scenario can see every row written, not only the end state
    const row = {user_id: "u1", kind, id, data, updated_at: now, edited_at: (opts && opts.editedAt) || now, updated_by: dev};
    if (this.cas) row.rev = old ? (JSON.stringify(old.data) !== JSON.stringify(data) ? old.rev + 1 : old.rev) : 1;
    this.rows.set(key, row); this.writes++;
    this.emit({eventType: old ? "UPDATE" : "INSERT", new: row, old: {kind, id, user_id: "u1"}});
    return row;
  }
  remove(kind, id){
    const key = this.k(kind, id); if (!this.rows.has(key)) return;
    this.rows.delete(key); this.writes++; this.deletions.push({kind, id, deleted_at: this.stamp()});
    this.emit({eventType: "DELETE", new: null, old: {kind, id, user_id: "u1"}});
  }
  emit(ev){ Object.values(this.devs).forEach(d => { if (d.online && d.page) d.page.evaluate(e => window.__rt && window.__rt(e), ev).catch(() => {}); }); }
  net(dev, isWrite){
    const d = this.devs[dev];
    if (!d.online) return {error: {message: "TypeError: Failed to fetch"}};
    if (isWrite && d.failWritesAfter != null) { if (d.failWritesAfter <= 0) return {error: {message: "TypeError: Failed to fetch"}}; d.failWritesAfter--; }
    return null;
  }
  call(dev, op, a){
    const down = this.net(dev, op === "q" && /^(upsert|delete|insert|update)$/.test(a.method) || (op === "rpc" && /item_(put|delete)/.test(a.name)));
    if (down) return down;
    const d = this.devs[dev];
    if (op === "rpc") return this.rpc(dev, a, d);
    const t = a.table, ch = a.chain, has = m => ch.find(c => c.m === m), all = m => ch.filter(c => c.m === m);
    if (t === "studyboard_deletions") {
      if (!this.lean()) return {data: null, error: {message: "relation does not exist", code: "42P01"}};
      let rows = this.deletions.slice();
      all("gt").forEach(c => { rows = rows.filter(r => Date.parse(r[c.a[0]]) > Date.parse(c.a[1])); });
      return {data: rows.map(r => Object.assign({}, r)), error: null};
    }
    if (t !== "items") return {data: null, error: {message: "Could not find the table", code: "42P01"}};
    const w = ch.find(c => /^(upsert|insert|update|delete)$/.test(c.m));
    if (w && w.m === "upsert") {
      const row = w.a[0], old = this.rows.get(this.k(row.kind, row.id));
      this.write(row.kind, row.id, row.data, dev);
      if (d.dropResponseOnce) { d.dropResponseOnce = false; return {error: {message: "TypeError: Failed to fetch"}}; }
      return {data: has("select") ? [{updated_at: this.rows.get(this.k(row.kind, row.id)).updated_at}] : null, error: null};
    }
    if (w && w.m === "delete") {
      const f = {}; all("eq").forEach(c => { f[c.a[0]] = c.a[1]; });
      this.remove(f.kind, f.id); return {data: null, error: null};
    }
    const sel = has("select"), cols = sel ? String(sel.a[0] || "*").split(",").map(x => x.trim()) : ["*"];
    if (cols.includes("rev") && !this.cas) return {data: null, error: {message: "column items.rev does not exist", code: "42703"}};
    let rows = [...this.rows.values()];
    all("neq").forEach(c => { rows = rows.filter(r => r[c.a[0]] !== c.a[1]); });
    all("eq").forEach(c => { rows = rows.filter(r => r[c.a[0]] === c.a[1]); });
    all("gt").forEach(c => { rows = rows.filter(r => Date.parse(r[c.a[0]]) > Date.parse(c.a[1])); });
    all("order").forEach(c => { const col = c.a[0], asc = !(c.a[1] && c.a[1].ascending === false); rows.sort((x, y) => (x[col] > y[col] ? 1 : x[col] < y[col] ? -1 : 0) * (asc ? 1 : -1)); });
    const rg = has("range"); if (rg) rows = rows.slice(rg.a[0], rg.a[1] + 1);
    const lm = has("limit"); if (lm) rows = rows.slice(0, lm.a[0]);
    const proj = r => cols[0] === "*" ? Object.assign({}, r) : Object.fromEntries(cols.map(c => [c, r[c]]));
    if (has("maybeSingle") || has("single")) return {data: rows[0] ? proj(rows[0]) : null, error: null};
    return {data: rows.map(proj), error: null};
  }
  lean(){ return true; }
  rpc(dev, a, d){
    const args = a.args || {};
    if (!this.cas) return {data: null, error: {message: "Could not find the function public." + a.name, code: "PGRST202"}};
    if (a.name === "studyboard_clock") return {data: this.stamp(), error: null};
    if (a.name === "studyboard_item_put") {
      const key = this.k(args.p_kind, args.p_id), r = this.rows.get(key), base = Math.max(args.p_base_rev || 0, 0), now = this.stamp();
      const ed = args.p_edited_at ? new Date(Math.min(Date.parse(args.p_edited_at), Date.now())).toISOString() : now;
      let res;
      if (!r) { this.write(args.p_kind, args.p_id, args.p_data, args.p_device, {editedAt: ed}); res = {ok: true, rev: base + 1, created: true, restored: base > 0, now}; this.rows.get(key).rev = base + 1; }
      else if (r.rev === base) { this.write(args.p_kind, args.p_id, args.p_data, args.p_device, {editedAt: ed}); res = {ok: true, rev: this.rows.get(key).rev, now}; }
      else if (JSON.stringify(r.data) === JSON.stringify(args.p_data)) res = {ok: true, rev: r.rev, same: true, now};
      else res = {ok: false, conflict: true, rev: r.rev, data: r.data, updated_at: r.updated_at, edited_at: r.edited_at || r.updated_at, updated_by: r.updated_by, now};
      if (res.ok && !res.same && d.dropResponseOnce) { d.dropResponseOnce = false; return {error: {message: "TypeError: Failed to fetch"}}; }
      return {data: res, error: null};
    }
    if (a.name === "studyboard_item_delete") {
      const key = this.k(args.p_kind, args.p_id), r = this.rows.get(key), now = this.stamp();
      if (!r) return {data: {ok: true, gone: true, now}, error: null};
      if (r.rev === Math.max(args.p_base_rev || 0, 0)) { this.remove(args.p_kind, args.p_id); return {data: {ok: true, now}, error: null}; }
      return {data: {ok: false, conflict: true, rev: r.rev, data: r.data, updated_at: r.updated_at, edited_at: r.edited_at || r.updated_at, now}, error: null};
    }
    return {data: null, error: {message: "Could not find the function", code: "PGRST202"}};
  }
}

/* ---------------- the page-side stand-in for supabase-js ---------------- */
const STUB = () => {
  const listeners = [];
  window.__rt = ev => listeners.forEach(f => { try { f(ev); } catch (e) { console.error(e); } });
  const call = (op, a) => window.__srv(JSON.stringify({op, a})).then(JSON.parse);
  const builder = table => {
    const chain = [];
    const b = new Proxy({}, {get(_, m) {
      if (m === "then") return (ok, no) => call("q", {table, chain, method: (chain.find(c => /^(upsert|insert|update|delete)$/.test(c.m)) || {}).m}).then(ok, no);
      return (...a) => { chain.push({m, a}); return b; };
    }});
    return b;
  };
  const client = {
    auth: {
      getSession: async () => ({data: {session: {user: Object.assign({id: "u1", email: "student@example.com"}, window.__created ? {created_at: window.__created} : {}), access_token: "t"}}}),
      onAuthStateChange: () => ({data: {subscription: {unsubscribe() {}}}}),
      signOut: async () => ({}), getUser: async () => ({data: {user: {id: "u1", email: "student@example.com"}}}),
    },
    from: builder,
    rpc: (name, args) => call("rpc", {name, args}),
    channel: () => { const ch = {on(t, f, cb) { ch.cb = cb; return ch; }, subscribe() { listeners.push(ch.cb); return ch; }}; return ch; },
    removeChannel: ch => { const i = listeners.indexOf(ch.cb); if (i >= 0) listeners.splice(i, 1); },
    storage: {from: () => ({upload: async () => ({error: {message: "no storage"}}), remove: async () => ({}), download: async () => ({error: {message: "no storage"}})})},
    functions: {invoke: async () => ({data: null, error: {message: "none"}})},
  };
  window.supabase = {createClient: () => client};
};

async function device(browser, srv, name, opts) {
  opts = opts || {};
  const ctx = await browser.newContext({viewport: {width: 900, height: 900}, serviceWorkers: "block"});
  const dev = {name, online: true, ctx, srv, page: null, errors: []};
  srv.devs[name] = dev;
  await ctx.exposeFunction("__srv", s => { const {op, a} = JSON.parse(s); return JSON.stringify(srv.call(name, op, a)); });
  await ctx.addInitScript({content: `
    ${opts.toured ? `try { if (!localStorage.getItem("seen")) { localStorage.setItem("seen", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("sb:onboarded", "1"); } } catch (e) {}`
      : `try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("sb:onboarded", "1"); } catch (e) {}`}
    window.__created = ${JSON.stringify(opts.created || "")};
    window.__off = ${Number(opts.clockOffset || 0)}; window.__SB_TEST = true; window.__SB_RETRY_MS = 4;
    (function () { const RD = Date; class FD extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now() + window.__off); } static now() { return RD.now() + window.__off; } } window.Date = FD; })();
    (${STUB.toString()})();`});
  const open = async () => {
    dev.page = await ctx.newPage();
    dev.page.on("pageerror", e => dev.errors.push(e.message));
    await dev.page.goto(BASE + "/" + path.basename(INDEX));
    await dev.page.waitForFunction(() => window.__sbSync && window.__sbSync.cloud.on === true, null, {timeout: 20000});
    await dev.page.waitForTimeout(150);
  };
  dev.open = open;
  kit(dev);
  await open();
  return dev;
}
// The test helpers of one open copy of the app (a device's tab, or a second tab of the same browser: see tab()).
function kit(dev) {
  // "Close and reopen the app": reload the same tab (closing the tab itself can drop recent localStorage writes in a headless browser context).
  dev.reload = async () => { await dev.page.waitForTimeout(300); await dev.page.reload(); await dev.page.waitForFunction(() => window.__sbSync && window.__sbSync.cloud.on === true, null, {timeout: 20000}); await dev.page.waitForTimeout(150); };
  dev.reopen = async () => { dev.online = true; await dev.reload(); };      // the app is closed and opened again with the network back
  dev.eval = (fn, arg) => dev.page.evaluate(fn, arg);
  dev.goOffline = () => { dev.online = false; };
  dev.goOnline = async () => { dev.online = true; await dev.page.evaluate(() => window.dispatchEvent(new Event("online"))); };
  dev.settle = async (ms) => {
    await dev.page.waitForFunction(() => window.__sbSync.idle(), null, {timeout: ms || 15000}).catch(() => {});
    await dev.page.waitForTimeout(200);
  };
  dev.pull = async () => { await dev.page.evaluate(() => window.__sbSync.refresh()); await dev.page.waitForTimeout(250); };
  dev.state = (kind, id) => dev.page.evaluate(([k, i]) => { const m = window.__sbSync.mapOf(k); return JSON.parse(JSON.stringify(m[i] || null)); }, [kind, id]);
  dev.settings = () => dev.page.evaluate(() => JSON.parse(JSON.stringify(window.__sbSync.state.settings)));
  dev.set = (kind, id, patchOrNull) => dev.page.evaluate(([k, i, p]) => { const S = window.__sbSync; S.applyChanges([{kind: k, id: i, after: p === null ? null : Object.assign(S.clone(S.getItem(k, i) || {id: i}), p)}], null); }, [kind, id, patchOrNull]);
  dev.outbox = () => dev.page.evaluate(() => Object.keys(window.__sbSync.outboxGet()));
  dev.toasts = () => dev.page.evaluate(() => window.__sbSync.toastText());
  return dev;
}
// A second tab of the app in the same browser profile as dev (shares its localStorage, cookies and network). It gets no realtime
// events until it is registered with live(tab, true): a backgrounded tab whose realtime connection was dropped, holding a stale copy.
async function tab(dev, srv) {
  const t = {name: dev.name + "2", online: true, ctx: null, srv, page: await dev.ctx.newPage(), errors: []};
  t.page.on("pageerror", e => t.errors.push(e.message));
  await t.page.goto(BASE + "/" + path.basename(INDEX));
  await t.page.waitForFunction(() => window.__sbSync && window.__sbSync.cloud.on === true, null, {timeout: 20000});
  await t.page.waitForTimeout(150);
  return kit(t);
}

/* ---------------- scenarios ---------------- */
const R = [];                              // results for the printed table
const noteRow = (id, text, extra) => Object.assign({id, text, color: "yellow", x: 40, y: 40, z: 1, rot: 0, archived: false, stickers: [], created: 1}, extra);
const taskRow = (id, extra) => Object.assign({id, title: "Essay", courseId: "", type: "Assignment", start: "", due: "2026-10-20", time: "", priority: "med", status: "todo", notes: "", hours: null, checklist: [], pct: 0, dependsOn: [], history: [], location: "", link: "", team: "", reading: "", weight: null, difficulty: "med", late: "unknown"}, extra);
const cardRow = (id, front, back) => ({id, front, back, box: 0, due: "", seen: 0, right: 0, wrong: 0});
const deckRow = (id, cards) => ({id, name: "Biology", courseId: "", cards, quizzes: [], aiQuizzes: [], created: 1});
const allText = o => JSON.stringify(o || {});

async function fresh(browser, srv, seedFn, opts) {
  srv.reset(); Object.keys(srv.devs).forEach(k => delete srv.devs[k]);
  seedFn(srv);
  const A = await device(browser, srv, "A", opts && opts.A), B = await device(browser, srv, "B", opts && opts.B);
  return {A, B, close: async () => { await A.ctx.close(); await B.ctx.close(); }};
}
const coming = async (...devs) => { for (const d of devs) { await d.goOnline(); await d.settle(); } };
async function converge(A, B) { for (let i = 0; i < 2; i++) { await A.pull(); await B.pull(); await A.settle(); await B.settle(); } }

// Photo themes ("Your Photo", ids "ph-...") live in settings.photoThemes; settings.photoGone holds the deleted ones ({id, at}) and a
// theme's ed is its last edit time. These do what the photo theme editor does to settings (save, edit, delete), without the photo.
const phRec = (id, name) => ({id, name, sw: ["#336699", "#CC8844"], at: Date.now()});
const phMake = (d, recs, skin) => d.eval(([rs, sk]) => { const S = window.__sbSync; S.state.settings = Object.assign({}, S.state.settings, {photoThemes: (S.state.settings.photoThemes || []).concat(rs), style: Object.assign({}, S.state.settings.style, {skin: sk, skinAt: Date.now()})}); S.saveSettings(); }, [recs, skin]);
const phEdit = (d, id, name) => d.eval(([i, n]) => { const S = window.__sbSync; S.state.settings = Object.assign({}, S.state.settings, {photoThemes: (S.state.settings.photoThemes || []).map(r => r.id === i ? Object.assign({}, r, {name: n, ed: Date.now()}) : r)}); S.saveSettings(); }, [id, name]);
const phDelete = (d, id) => d.eval(i => { const S = window.__sbSync, st = S.state.settings; S.state.settings = Object.assign({}, st, {photoThemes: (st.photoThemes || []).filter(r => r.id !== i), photoGone: (st.photoGone || []).filter(g => g.id !== i).concat([{id: i, at: Date.now()}])}); S.saveSettings(); }, id);
const setSetting = (d, patch) => d.eval(p => { const S = window.__sbSync; S.state.settings = Object.assign({}, S.state.settings, p); S.saveSettings(); }, patch);
const pause = (d, ms) => d.eval(m => new Promise(r => setTimeout(r, m)), ms);
// What a copy of the settings says: {skin, ph: "id:name,...", ...the named plain settings}
const phLook = (st, keys) => { st = st || {}; const o = {skin: (st.style || {}).skin, ph: (st.photoThemes || []).map(r => r.id + ":" + r.name).join(",")}; (keys || []).forEach(k => { o[k] = st[k]; }); return o; };
const phSeen = async (srv, devs, keys) => { const o = {server: phLook((srv.get("meta", "planner") || {}).settings, keys)}; for (const d of devs) o[d.name] = phLook(await d.settings(), keys); return o; };
const phShow = o => Object.entries(o).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(" ");
const phAll = (o, fn) => Object.values(o).every(fn);
// The end state can look right after a theme vanished for a moment (on screen the theme reverts, and the photo is purged once a theme
// has been missing for the grace time), so each copy of the app is watched the whole time: once it has had ph-test1 (as its theme),
// the newer edit of it, or has seen ph-test2 deleted, it must never go back.
const phWatchDevice = d => d.eval(() => {
  const w = window.__phw = {bad: []}, bad = m => { if (!w.bad.includes(m)) w.bad.push(m); };
  setInterval(() => {
    const s = (window.__sbSync && window.__sbSync.state.settings) || {}, ph = Array.isArray(s.photoThemes) ? s.photoThemes : [], r1 = ph.find(r => r && r.id === "ph-test1"), has2 = ph.some(r => r && r.id === "ph-test2"), skin = (s.style || {}).skin;
    if (r1) w.had1 = true; else if (w.had1) bad("ph-test1 vanished");
    if (skin === "ph-test1") w.skin1 = true; else if (w.skin1) bad("theme reverted to " + skin);
    if (r1 && /Newer edit/.test(r1.name)) w.newer = true; else if (w.newer && r1) bad("newer edit replaced by " + JSON.stringify(r1.name));
    if (has2) { w.had2 = true; if (w.gone2) bad("deleted ph-test2 came back"); } else if (w.had2) w.gone2 = true;
  }, 20);
});
const phDeviceBad = async devs => { const o = []; for (const d of devs) (await d.eval(() => window.__phw ? window.__phw.bad.splice(0) : [])).forEach(m => o.push(d.name + ": " + m)); return o; };
// Every settings row the server is given is checked while a rule is set (a device reading the row in between would adopt it).
const phWatchServer = srv => { const w = {bad: [], rule: null}; srv.watch = (kind, id, data, dev) => { const why = kind === "meta" && w.rule && w.rule((data && data.settings) || {}); if (why && !w.bad.includes(why)) w.bad.push(why); }; return w; };
const phMissing = st => { const l = phLook(st); return !l.ph.includes("ph-test1") ? "a copy without ph-test1 (theme " + l.skin + ")" : l.skin !== "ph-test1" ? "a copy with the theme reverted to " + l.skin : ""; };
const phWhy = a => a.length ? " [" + a.join("; ") + "]" : "";

const SC = [
  ["0b clearing site data on a device, then signing in again, keeps the account's boards, theme and note placement", async (b, srv) => {
    const boards = [{id: "bd1", name: "Biology", courseId: ""}, {id: "bd2", name: "History", courseId: ""}];
    const style = {skin: "slate", skinAt: Date.now() - HOUR};
    const {A, close} = await fresh(b, srv, s => { s.seed("meta", "planner", {schema: 2, settings: {capacity: 15, noteBoards: boards, style}}, HOUR); ["n1", "n2"].forEach((i, k) => s.seed("note", i, noteRow(i, "note " + i, {board: boards[k].id}), HOUR)); });
    await A.settle(); await A.page.waitForTimeout(4500);
    const before = await A.settings();
    // "Clear site data": local storage and the device copy of the account's rows are gone, then the app is opened again
    await A.eval(async () => { localStorage.clear(); try { await new Promise(r => { const q = indexedDB.deleteDatabase("studyboard-sync"); q.onsuccess = q.onerror = q.onblocked = () => r(); }); } catch (e) {} });
    await A.page.addInitScript(() => { try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("sb:onboarded", "1"); } catch (e) {} });
    await A.reopen(); await A.settle(); await A.page.waitForTimeout(5000); await A.settle();
    const after = await A.settings(), srvSet = (srv.get("meta", "planner") || {}).settings || {};
    const notes = await A.eval(() => Object.values(window.__sbSync.mapOf("note")).map(n => n.id + ":" + (n.board || "")).sort().join(","));
    const names = o => ((o || {}).noteBoards || []).map(x => x.name).sort().join(",");
    await close();
    const okDevice = names(after) === "Biology,History" && (after.style || {}).skin === "slate";
    const okServer = names(srvSet) === "Biology,History" && (srvSet.style || {}).skin === "slate";
    return {out: `before ${names(before)}/${(before.style || {}).skin}; after-reopen device ${names(after)}/${(after.style || {}).skin}; server ${names(srvSet)}/${(srvSet.style || {}).skin}; notes ${notes}`,
      ok: okDevice && okServer && notes === "n1:bd1,n2:bd2", noLoss: okServer};
  }],
  ["0c a device that writes empty settings can never wipe the account's boards and theme", async (b, srv) => {
    const boards = [{id: "bd1", name: "Biology", courseId: ""}], style = {skin: "slate", skinAt: Date.now() - HOUR};
    const {A, B, close} = await fresh(b, srv, s => s.seed("meta", "planner", {schema: 2, settings: {capacity: 15, noteBoards: boards, style}}, HOUR));
    await A.settle(); await B.settle();
    // Worst case: this device has the account's settings cached as its base but its own settings hold none of it
    await A.eval(() => { const S = window.__sbSync; S.state.settings = {capacity: 15, marker: 1}; S.saveSettings(); });
    await A.settle(); await B.settle(); await converge(A, B);
    const st = (srv.get("meta", "planner") || {}).settings || {}, sa = await A.settings(), sb = await B.settings();
    await close();
    const keep = x => ((x.noteBoards || [])[0] || {}).name === "Biology" && (x.style || {}).skin === "slate";
    return {out: `server ${JSON.stringify([(st.noteBoards || []).length, (st.style || {}).skin, st.marker])}; A ${keep(sa)}; B ${keep(sb)}`, ok: keep(st) && keep(sa) && keep(sb), noLoss: keep(st)};
  }],
  ["0d signing out wipes the device for good: a late save cannot bring the old account's data back, and the next account starts empty", async (b, srv) => {
    const {A, close} = await fresh(b, srv, s => s.seed("task", "t1", taskRow("t1"), HOUR));
    await A.settle();
    const r1 = await A.eval(async () => {
      const S = window.__sbSync, K = S.devKeys, before = Object.keys(S.state.tasks).length;
      let err = ""; try { await S.wipeDeviceData(); } catch (e) { err = String(e && e.message); }            // what signing out does to the device
      const ownerNow = localStorage.getItem(K.OWNER);
      S.saveSettings();                    // a late save (a timer, a sync) while it was being cleared
      await new Promise(r => setTimeout(r, 400)); const ownerLater = localStorage.getItem(K.OWNER);
      return {ownerNow, ownerLater, err, before, ls2: localStorage.getItem(K.LS2), outbox: localStorage.getItem(K.OUTBOX), owner: localStorage.getItem(K.OWNER), tasks: Object.keys(S.state.tasks).length};
    });
    // Worst case: something from the old account is still on the device when the next account signs in
    await A.eval(() => { const K = window.__sbSync.devKeys; localStorage.setItem(K.LS2, JSON.stringify({v: 2, tasks: [{id: "x1", title: "leftover from the first account", courseId: "", type: "Assignment", due: "2026-10-20", status: "todo"}], courses: [], notes: [], decks: [], files: [], events: [], settings: {capacity: 15}})); });
    await A.reload(); await A.settle();
    const leftover = await A.state("task", "x1"), onServer = srv.get("task", "x1");
    await close();
    const wiped = r1.before === 1 && !r1.ls2 && !r1.outbox && r1.owner === "none" && r1.tasks === 0;
    return {out: `after wipe + late save: tasks ${r1.tasks}, saved copy ${r1.ls2 ? "BACK" : "none"}, queued writes ${r1.outbox ? "BACK" : "none"}, owner ${r1.owner} (now ${r1.ownerNow}, later ${r1.ownerLater})${r1.err ? " (error: " + r1.err + ")" : ""}; next account: leftover on device ${leftover ? "YES" : "no"}, on server ${onServer ? "YES" : "no"}`, ok: wiped && !leftover && !onServer, noLoss: true};
  }],
  ["0e a brand-new account gets the welcome tour on a device that has had it before; an older account with an empty planner doesn't", async (b, srv) => {
    srv.reset(); Object.keys(srv.devs).forEach(k => delete srv.devs[k]);
    const tourUp = d => d.eval(() => !!document.querySelector("#dlg[open] #obH"));
    const A = await device(b, srv, "A", {toured: true, created: new Date().toISOString()});
    let shown = false; for (let i = 0; i < 12 && !shown; i++) { await A.page.waitForTimeout(500); shown = await tourUp(A); }
    const B = await device(b, srv, "B", {toured: true, created: new Date(Date.now() - 30 * 864e5).toISOString()});
    await B.page.waitForTimeout(4000); const old = await tourUp(B);
    const flags = await A.eval(() => !!localStorage.getItem("sb:onboarded:u1"));
    return {out: `new account: tour ${shown ? "shown" : "NOT shown"}; month-old account: tour ${old ? "shown" : "not shown"}`, ok: shown && !old && !flags, noLoss: true};
  }],
  ["0 theme picked on A (desktop) shows on B (phone), live and after coming back", async (b, srv) => {
    const {A, B, close} = await fresh(b, srv, s => {});
    const skinOf = d => d.eval(() => ({set: (window.__sbSync.state.settings.style || {}).skin, shown: document.documentElement.dataset.skin || "classic"}));
    await A.eval(() => { const S = window.__sbSync; S.state.settings = Object.assign({}, S.state.settings, {style: Object.assign({}, S.state.settings.style, {skin: "slate", skinAt: Date.now()})}); S.saveSettings(); }); await A.settle(); await B.settle();
    // a device that was only just opened can take a few seconds to send its own first settings before it takes the new ones
    await B.page.waitForFunction(() => ((window.__sbSync.state.settings.style || {}).skin) === "slate", null, {timeout: 12000}).catch(() => {});
    const live = await skinOf(B);
    await B.pull(); await B.settle();
    const pulled = await skinOf(B);
    await B.reopen(); await B.settle();
    const reopened = await skinOf(B);
    await close();
    const ok = [live, pulled, reopened].every(x => x.set === "slate");
    return {out: `live ${JSON.stringify(live)}  pulled ${JSON.stringify(pulled)}  reopened ${JSON.stringify(reopened)}`, ok, noLoss: true};
  }],
  ["1 same note edited offline on A and B", async (b, srv) => {
    const {A, B} = await fresh(b, srv, s => s.seed("note", "n1", noteRow("n1", "Bio\nCells are the unit of life\nMitochondria"), HOUR));
    A.goOffline(); B.goOffline();
    await A.set("note", "n1", {text: "Bio\nCells are the basic unit of life (A)\nMitochondria"});
    await B.set("note", "n1", {text: "Bio\nCells are the fundamental unit of life (B)\nMitochondria"});
    await A.settle(); await B.settle();
    await coming(A, B); await converge(A, B);
    const sv = srv.get("note", "n1"), a = await A.state("note", "n1"), bb = await B.state("note", "n1");
    return {out: `server text kept: A=${sv.text.includes("(A)")} B=${sv.text.includes("(B)")} flagged=${!!sv.conflict}; devices agree=${allText(a) === allText(bb)}`,
      ok: sv.text.includes("(A)") && sv.text.includes("(B)") && !!sv.conflict && allText(a) === allText(bb), noLoss: sv.text.includes("(A)") && sv.text.includes("(B)"), extra: {text: sv.text}};
  }],
  ["1b same note: A appends a line, B edits the first line", async (b, srv) => {
    const {A, B} = await fresh(b, srv, s => s.seed("note", "n1", noteRow("n1", "Bio notes\nline two"), HOUR));
    A.goOffline(); B.goOffline();
    await A.set("note", "n1", {text: "Bio notes\nline two\nA added this"}); await B.set("note", "n1", {text: "Bio notes (final)\nline two"});
    await A.settle(); await B.settle(); await coming(A, B); await converge(A, B);
    const sv = srv.get("note", "n1");
    return {out: `merged text = ${JSON.stringify(sv.text)} flagged=${!!sv.conflict}`, ok: sv.text.includes("A added this") && sv.text.includes("(final)") && !sv.conflict, noLoss: sv.text.includes("A added this") && sv.text.includes("(final)")};
  }],
  ["2 same task: A changes due date, B marks done", async (b, srv) => {
    const {A, B} = await fresh(b, srv, s => s.seed("task", "t1", taskRow("t1"), HOUR));
    A.goOffline(); B.goOffline();
    await A.set("task", "t1", {due: "2026-11-30"}); await B.set("task", "t1", {status: "done", pct: 100});
    await A.settle(); await B.settle(); await coming(A, B); await converge(A, B);
    const sv = srv.get("task", "t1");
    return {out: `server due=${sv.due} status=${sv.status}`, ok: sv.due === "2026-11-30" && sv.status === "done", noLoss: sv.due === "2026-11-30" && sv.status === "done"};
  }],
  ["3 A deletes a deck while B edits a card (A syncs first)", async (b, srv) => {
    const {A, B} = await fresh(b, srv, s => s.seed("deck", "d1", deckRow("d1", [cardRow("c1", "q1", "a1"), cardRow("c2", "q2", "a2")]), HOUR));
    A.goOffline(); B.goOffline();
    await A.set("deck", "d1", null);
    await B.eval(() => { const S = window.__sbSync, d = S.clone(S.state.decks.d1); d.cards[1].back = "a2 corrected by B"; S.applyChanges([{kind: "deck", id: "d1", after: d}], null); });
    await A.settle(); await B.settle(); await coming(A, B); await converge(A, B);
    const sv = srv.get("deck", "d1"), aDeck = await A.state("deck", "d1");
    return {out: `server deck ${sv ? "kept, card c2 = " + JSON.stringify(sv.cards[1].back) : "GONE"}; A sees it: ${!!aDeck}`, ok: !!sv && sv.cards[1].back.includes("corrected by B") && !!aDeck, noLoss: !!sv && sv.cards[1].back.includes("corrected by B")};
  }],
  ["3b ...and when B syncs first", async (b, srv) => {
    const {A, B} = await fresh(b, srv, s => s.seed("deck", "d1", deckRow("d1", [cardRow("c1", "q1", "a1"), cardRow("c2", "q2", "a2")]), HOUR));
    A.goOffline(); B.goOffline();
    await A.set("deck", "d1", null);
    await B.eval(() => { const S = window.__sbSync, d = S.clone(S.state.decks.d1); d.cards[1].back = "a2 corrected by B"; S.applyChanges([{kind: "deck", id: "d1", after: d}], null); });
    await A.settle(); await B.settle(); await coming(B, A); await converge(A, B);
    const sv = srv.get("deck", "d1"), aDeck = await A.state("deck", "d1");
    return {out: `server deck ${sv ? "kept, card c2 = " + JSON.stringify(sv.cards[1].back) : "GONE"}; A sees it: ${!!aDeck}`, ok: !!sv && sv.cards[1].back.includes("corrected by B") && !!aDeck, noLoss: !!sv && sv.cards[1].back.includes("corrected by B")};
  }],
  ["4 both add different tasks and notes while offline", async (b, srv) => {
    const {A, B} = await fresh(b, srv, s => s.seed("task", "t0", taskRow("t0"), HOUR));
    A.goOffline(); B.goOffline();
    await A.set("task", "tA", taskRow("tA", {title: "A's task"})); await A.set("note", "nA", noteRow("nA", "A's note"));
    await B.set("task", "tB", taskRow("tB", {title: "B's task"})); await B.set("note", "nB", noteRow("nB", "B's note"));
    await A.settle(); await B.settle(); await coming(A, B); await converge(A, B);
    const have = ["task|tA", "task|tB", "note|nA", "note|nB", "task|t0"].every(k => srv.rows.has(k));
    const aHas = !!(await A.state("task", "tB")) && !!(await B.state("task", "tA")) && !!(await A.state("note", "nB")) && !!(await B.state("note", "nA"));
    return {out: `server has all 5: ${have}; each device sees the other's: ${aHas}`, ok: have && aHas, noLoss: have};
  }],
  ["5 A reorders while B edits (notes z/x/y, deck card order)", async (b, srv) => {
    const cards = [cardRow("c1", "1", "a"), cardRow("c2", "2", "b"), cardRow("c3", "3", "c")];
    const {A, B} = await fresh(b, srv, s => { s.seed("note", "n1", noteRow("n1", "plain", {x: 10, y: 10, z: 1}), HOUR); s.seed("deck", "d1", deckRow("d1", cards), HOUR); });
    A.goOffline(); B.goOffline();
    await A.set("note", "n1", {x: 300, y: 220, z: 9});
    await A.eval(() => { const S = window.__sbSync, d = S.clone(S.state.decks.d1); d.cards = [d.cards[2], d.cards[0], d.cards[1]]; S.applyChanges([{kind: "deck", id: "d1", after: d}], null); });
    await B.set("note", "n1", {text: "plain, edited by B"});
    await B.eval(() => { const S = window.__sbSync, d = S.clone(S.state.decks.d1); d.cards[0].front = "1 (B edit)"; S.applyChanges([{kind: "deck", id: "d1", after: d}], null); });
    await A.settle(); await B.settle(); await coming(A, B); await converge(A, B);
    const n = srv.get("note", "n1"), d = srv.get("deck", "d1");
    const order = d.cards.map(c => c.id).join(","), edited = d.cards.find(c => c.id === "c1").front;
    return {out: `note x=${n.x} z=${n.z} text=${JSON.stringify(n.text)}; deck order=${order}, c1.front=${JSON.stringify(edited)}`,
      ok: n.x === 300 && n.z === 9 && n.text === "plain, edited by B" && order === "c3,c1,c2" && edited === "1 (B edit)", noLoss: n.text === "plain, edited by B" && edited === "1 (B edit)"};
  }],
  ["6a clock skew: A's clock is 1 hour AHEAD (A edits earlier in real time, B later)", async (b, srv) => {
    const {A, B} = await fresh(b, srv, s => s.seed("task", "t1", taskRow("t1"), 2 * DAY), {A: {clockOffset: HOUR}});
    A.goOffline(); B.goOffline();
    await A.set("task", "t1", {title: "A's title (earlier in real time)", notes: "A note"});
    await B.page.waitForTimeout(1500);
    await B.set("task", "t1", {title: "B's title (later in real time)"});
    await A.settle(); await B.settle(); await coming(A, B); await converge(A, B);
    const sv = srv.get("task", "t1");
    return {out: `title=${JSON.stringify(sv.title)} notes=${JSON.stringify(sv.notes)} log=${JSON.stringify((sv.syncLog || []).map(l => l.field + " lost " + l.lost.slice(0, 18)))}`,
      ok: sv.title.includes("B's title") && sv.notes === "A note", noLoss: sv.notes === "A note" && (sv.title.includes("B's") || JSON.stringify(sv.syncLog || []).includes("A's title"))};
  }],
  ["6b clock skew: A's clock is 4 DAYS ahead and A edited later in real time", async (b, srv) => {
    const {A, B} = await fresh(b, srv, s => s.seed("task", "t1", taskRow("t1"), 2 * DAY), {A: {clockOffset: 4 * DAY}});
    A.goOffline(); B.goOffline();
    await B.set("task", "t1", {title: "B's title (earlier)"});
    await A.page.waitForTimeout(1500);
    await A.set("task", "t1", {title: "A's title (later, fast clock)"});
    await A.settle(); await B.settle(); await coming(B, A); await converge(A, B);
    const sv = srv.get("task", "t1");
    return {out: `title=${JSON.stringify(sv.title)}`, ok: sv.title.includes("A's title"), noLoss: sv.title.includes("A's") || JSON.stringify(sv.syncLog || []).includes("A's title")};
  }],
  ["7 device offline for 3 weeks comes back and pushes old state", async (b, srv) => {
    const {A, B} = await fresh(b, srv, s => {
      s.seed("task", "t1", taskRow("t1", {title: "Lab report"}), 22 * DAY); s.seed("task", "t2", taskRow("t2", {title: "Reading"}), 22 * DAY);
      s.seed("note", "n1", noteRow("n1", "Week 1\nintro"), 22 * DAY); s.seed("note", "n2", noteRow("n2", "Old note"), 22 * DAY);
    });
    B.goOffline();
    await B.eval(() => { window.__off = -21 * 864e5; });              // B's clock "3 weeks ago" while it edits
    await B.set("task", "t1", {title: "Lab report (B, 3 weeks ago)", priority: "high"}); await B.set("task", "t2", {notes: "B's old note on reading"});
    await B.set("note", "n1", {text: "Week 1\nintro (B's old edit)"}); await B.settle();
    await B.eval(() => { window.__off = 0; });
    // meanwhile A kept working for three weeks
    await A.set("task", "t1", {title: "Lab report FINAL (A, this week)", due: "2026-11-05", status: "doing"});
    await A.set("note", "n1", {text: "Week 1\nintro\nWeek 2 (A)\nWeek 3 (A)"}); await A.set("note", "n2", {text: "Old note, now rewritten by A"});
    await A.set("task", "t3", taskRow("t3", {title: "New task from A"}));
    await A.settle();
    await B.reopen();                                                   // the stale device is reopened: startup path
    await B.settle(); await converge(A, B);
    const t1 = srv.get("task", "t1"), t2 = srv.get("task", "t2"), n1 = srv.get("note", "n1"), n2 = srv.get("note", "n2");
    const aKept = t1.title.includes("FINAL") && t1.due === "2026-11-05" && t1.status === "doing" && n1.text.includes("Week 3 (A)") && n2.text.includes("rewritten by A") && srv.rows.has("task|t3");
    const bKept = t1.priority === "high" && t2.notes.includes("B's old note") && n1.text.includes("B's old edit");
    return {out: `A's newer data survived: ${aKept} (t1.title=${JSON.stringify(t1.title)}, n2=${JSON.stringify(n2.text)}); B's offline edits kept: ${bKept}`, ok: aKept && bKept, noLoss: aKept && bKept || (aKept && n1.text.includes("B's old edit")), wiped: !aKept};
  }],
  ["8 simultaneous settings changes", async (b, srv) => {
    const {A, B} = await fresh(b, srv, s => s.seed("meta", "planner", {schema: 2, settings: {capacity: 15, studyHours: 3}}, HOUR));
    A.goOffline(); B.goOffline();
    await A.eval(() => { const S = window.__sbSync; S.state.settings.capacity = 22; S.saveSettings(); }); await B.eval(() => { const S = window.__sbSync; S.state.settings.studyHours = 5; S.state.settings.reminderLead = 30; S.saveSettings(); });
    await A.settle(); await B.settle(); await coming(A, B); await converge(A, B);
    const st = srv.get("meta", "planner").settings, sa = await A.settings(), sb = await B.settings();
    return {out: `server settings=${JSON.stringify(st)}; A=${sa.capacity}/${sa.studyHours}/${sa.reminderLead}; B=${sb.capacity}/${sb.studyHours}/${sb.reminderLead}`,
      ok: st.capacity === 22 && st.studyHours === 5 && st.reminderLead === 30 && sa.studyHours === 5 && sb.capacity === 22, noLoss: st.capacity === 22 && st.studyHours === 5};
  }],
  ["9a interrupted sync: B's connection drops after its first push, app is closed, reopened later", async (b, srv) => {
    const {A, B} = await fresh(b, srv, s => { ["n1", "n2", "n3"].forEach(i => s.seed("note", i, noteRow(i, "orig " + i), HOUR)); });
    B.goOffline();
    for (const i of ["n1", "n2", "n3"]) await B.set("note", i, {text: "B edit of " + i});
    await B.settle();
    B.online = true; B.failWritesAfter = 1;                           // the network dies after one write
    await B.eval(() => window.dispatchEvent(new Event("online"))); await B.settle(5000);
    const midway = ["n1", "n2", "n3"].filter(i => srv.get("note", i).text.startsWith("B edit")).length;
    B.failWritesAfter = null; await B.reopen();                       // reopened, network back
    await B.settle(); await converge(A, B);
    const got = ["n1", "n2", "n3"].map(i => srv.get("note", i).text), dupes = [...srv.rows.keys()].filter(k => k.startsWith("note|")).length;
    return {out: `after the drop ${midway}/3 edits had landed; after reopening: ${JSON.stringify(got)}; note rows=${dupes}`, ok: got.every((t, i) => t === "B edit of n" + (i + 1)) && dupes === 3, noLoss: got.every((t, i) => t.includes("B edit of n" + (i + 1)))};
  }],
  ["9b interrupted sync: the server saved the edit but the reply was lost (retry)", async (b, srv) => {
    const {A, B} = await fresh(b, srv, s => s.seed("note", "n1", noteRow("n1", "orig"), HOUR));
    B.dropResponseOnce = true;
    await B.set("note", "n1", {text: "B edit"}); await B.settle(); await B.goOnline(); await B.settle(); await converge(A, B);
    const sv = srv.get("note", "n1");
    return {out: `server text=${JSON.stringify(sv.text)} flagged=${!!sv.conflict}`, ok: sv.text === "B edit" && !sv.conflict, noLoss: sv.text.includes("B edit")};
  }],
  ["10 schema version differences (newer device saved schema 3 and a field this version doesn't know)", async (b, srv) => {
    const {A, B} = await fresh(b, srv, s => { s.seed("meta", "planner", {schema: 2, settings: {capacity: 15}}, 2 * HOUR); s.seed("task", "t1", taskRow("t1", {title: "Old title"}), 2 * HOUR); s.seed("task", "t2", taskRow("t2", {title: "Other"}), 2 * HOUR); });
    B.goOffline();
    await B.set("task", "t1", {title: "B edited the title"}); await B.settle();
    // meanwhile a newer app version saved schema 3 and a new field
    srv.seed("meta", "planner", {schema: 3, settings: {capacity: 15, newThing: true}}, HOUR, 50);   // (a real server bumps rev on every write)
    srv.seed("task", "t1", Object.assign(taskRow("t1", {title: "Old title"}), {futureField: {x: 1}}), HOUR, 2);
    srv.seed("task", "t2", Object.assign(taskRow("t2", {title: "Other, updated by newer app"}), {futureField: "keep"}), HOUR, 2);
    await B.reopen(); await B.settle(); await converge(A, B);
    const t1 = srv.get("task", "t1"), t2 = srv.get("task", "t2"), meta = srv.get("meta", "planner");
    return {out: `t1.title=${JSON.stringify(t1.title)} t1.futureField=${JSON.stringify(t1.futureField)}; t2 still newer=${t2.title.includes("newer app")} (${JSON.stringify(t2.futureField)}); server schema=${meta.schema}`,
      ok: t1.title === "B edited the title" && JSON.stringify(t1.futureField) === '{"x":1}' && t2.title.includes("newer app") && meta.schema === 3 && meta.settings.newThing === true,
      noLoss: JSON.stringify(t1.futureField) === '{"x":1}' && t2.title.includes("newer app"), wiped: !t2.title.includes("newer app")};
  }],
  ["11 what the person sees: toast, note badge, Sync issues in Settings, Resolve sheet", async (b, srv) => {
    const {A, B} = await fresh(b, srv, s => s.seed("note", "n1", noteRow("n1", "Bio\nCells are the unit of life\nMitochondria"), HOUR));
    A.goOffline(); B.goOffline();
    await A.set("note", "n1", {text: "Bio\nCells are the basic unit of life (A)\nMitochondria"}); await B.set("note", "n1", {text: "Bio\nCells are the fundamental unit of life (B)\nMitochondria"});
    await A.settle(); await B.settle(); await coming(A); await coming(B);
    const toast = await B.toasts(), p = B.page;
    await p.click('button[data-tab="notes"]'); await p.waitForSelector(".note-conflict", {timeout: 5000});
    const badge = await p.textContent(".note-conflict");
    await p.click('[data-act="menu"]'); await p.waitForSelector("#dlg[open]");
    await p.evaluate(() => { const c = [...document.querySelectorAll("#dlg .us-cats [data-cat], #dlg .us-cats button")].find(x => /Account and Sync/i.test(x.textContent)); if (c) c.click(); });
    await p.waitForTimeout(300);
    const entry = await p.$('#dlg [data-act="sb-issues"]');
    if (entry) { await entry.click(); } else { await p.evaluate(() => document.querySelector("#dlg").close()); await p.click(".note-conflict"); }
    await p.waitForSelector(".sync-issue", {timeout: 5000});
    const sheet = await p.textContent(".sync-issue"); if (process.env.SHOT) { await p.setViewportSize({width: 390, height: 800}); await p.waitForTimeout(200); await p.screenshot({path: process.env.SHOT}); }
    await p.click('[data-act="sync-resolve"][data-choice="both"]'); await B.settle(); await converge(A, B);
    const sv = srv.get("note", "n1"), left = await p.$$(".note-conflict");
    return {out: `toast=${JSON.stringify(toast)}; badge=${JSON.stringify(badge)}; settings entry ${entry ? "found" : "MISSING"}; sheet shows both: ${/\(A\)/.test(sheet) && /\(B\)/.test(sheet)}; after Keep both: markers gone=${!/───/.test(sv.text)} both kept=${sv.text.includes("(A)") && sv.text.includes("(B)")} flag cleared=${!sv.conflict} badge gone=${left.length === 0}`,
      ok: /edited|collid|both/i.test(toast) && /two devices/i.test(badge) && !!entry && /\(A\)/.test(sheet) && !/───/.test(sv.text) && sv.text.includes("(A)") && sv.text.includes("(B)") && !sv.conflict && left.length === 0, noLoss: sv.text.includes("(A)") && sv.text.includes("(B)")};
  }],
  ["12a Recently Deleted: A deletes a note (goes to the bin), B edits it offline", async (b, srv) => {
    const {A, B} = await fresh(b, srv, s => s.seed("note", "n1", noteRow("n1", "Chem notes\nline"), HOUR));
    A.goOffline(); B.goOffline();
    await A.eval(() => window.__sbSync.applyChanges([{kind: "note", id: "n1", after: null}], "Note deleted"));
    await B.set("note", "n1", {text: "Chem notes\nline\nB typed this on the train"});
    await A.settle(); await B.settle(); await coming(A, B); await converge(A, B);
    const sv = srv.get("note", "n1"), trashRows = [...srv.rows.keys()].filter(k => k.startsWith("trash|")).length;
    const vis = async d => d.eval(() => window.__sbSync.trashVisible().length);
    const aLive = await A.state("note", "n1"), bLive = await B.state("note", "n1");
    return {out: `server note live with B's edit: ${!!sv && sv.text.includes("B typed this")}; bin entries hidden on A=${await vis(A) === 0} B=${await vis(B) === 0} (rows kept: ${trashRows}); A sees note: ${!!aLive}`,
      ok: !!sv && sv.text.includes("B typed this") && await vis(A) === 0 && await vis(B) === 0 && !!aLive && !!bLive, noLoss: !!sv && sv.text.includes("B typed this")};
  }],
  ["12b Recently Deleted: A restores a note, B deletes it forever", async (b, srv) => {
    const {A, B} = await fresh(b, srv, s => s.seed("note", "n1", noteRow("n1", "Keep me"), HOUR));
    await A.eval(() => window.__sbSync.applyChanges([{kind: "note", id: "n1", after: null}], "Note deleted"));
    await A.settle(); await B.pull(); await B.settle();
    const bin = await A.eval(() => window.__sbSync.trashVisible().map(e => e.id));
    A.goOffline(); B.goOffline();
    await A.eval(ids => window.__sbSync.trashRestore(ids), bin);
    await B.eval(ids => window.__sbSync.trashForever(ids), bin);
    await A.settle(); await B.settle(); await coming(A, B); await converge(A, B);
    const sv = srv.get("note", "n1"), rows = [...srv.rows.keys()].filter(k => k.startsWith("trash|")).length;
    const bLive = await B.state("note", "n1");
    return {out: `bin had ${bin.length} entry; server note ${sv ? "live: " + JSON.stringify(sv.text) : "GONE"}; bin rows left=${rows}; B sees it live: ${!!bLive}`,
      ok: bin.length === 1 && !!sv && sv.text === "Keep me" && rows === 0 && !!bLive, noLoss: !!sv};
  }],
  ["13a two tabs: a stale tab's queued settings never wipe a photo theme", async (b, srv) => {
    // Tab A2 is a second, backgrounded tab of the same browser (it shares the localStorage outbox) that missed A's new photo theme. Its
    // settings save is queued in the shared outbox; A's next flush sent A2's stale copy: the photo theme vanished and the theme reverted.
    srv.reset(); Object.keys(srv.devs).forEach(k => delete srv.devs[k]);
    srv.seed("meta", "planner", {schema: 2, settings: {capacity: 15, style: {skin: "classic", skinAt: Date.now() - DAY}}}, HOUR);
    const A = await device(b, srv, "A"), T = await tab(A, srv), sw = phWatchServer(srv);
    // A2's connection: off = it misses realtime and its saves wait in the outbox (mid-request, or its socket dropped while in the background)
    const live = on => { if (on) srv.devs[T.name] = T; else delete srv.devs[T.name]; return T.eval(v => { window.__sbSync.cloud.on = v; if (v) window.dispatchEvent(new Event("online")); }, on); };
    await A.eval(() => window.SBPHOTO && window.SBPHOTO.grace(1500));   // a theme whose record is missing is given up after 1.5 s, not 30 s
    await phWatchDevice(A); await phWatchDevice(T);
    await phMake(A, [phRec("ph-test1", "Mine"), phRec("ph-test2", "Second")], "ph-test1"); await A.settle(); await pause(T, 300);
    sw.rule = phMissing;
    await live(false);
    await setSetting(T, {tips: "always"});                               // A2 saves an unrelated setting from its stale copy
    await A.eval(() => window.dispatchEvent(new Event("online")));      // A's retry timer / 'online' event flushes the outbox
    await pause(A, 2500); await A.settle();
    await live(true); await T.settle(); await converge(A, T);
    sw.rule = null;
    const s1 = await phSeen(srv, [A, T], ["tips"]), b1 = sw.bad.splice(0).map(m => "server got " + m).concat(await phDeviceBad([A, T]));
    const kept = !b1.length && phAll(s1, v => v.skin === "ph-test1" && v.ph.includes("ph-test1:Mine") && v.ph.includes("ph-test2"));
    // the newer edit wins: A2 (no connection) renames ph-test1 first, A renames it later; A2's older edit arrives last
    await live(false); await phEdit(T, "ph-test1", "Older edit (A2)"); await pause(A, 300);
    await phEdit(A, "ph-test1", "Newer edit (A)"); await A.settle();
    await live(true); await T.settle(); await converge(A, T);
    const s2 = await phSeen(srv, [A, T]), b2 = await phDeviceBad([A, T]);
    const edited = !b2.length && phAll(s2, v => v.ph.includes("ph-test1:Newer edit (A)") && !v.ph.includes("Older edit"));
    // a deletion sticks: A deletes ph-test2 while A2 (no connection) saves settings from a copy that still has it
    await live(false); await phDelete(A, "ph-test2"); await A.settle();
    await setSetting(T, {tips: "never"});
    await live(true); await T.settle(); await converge(A, T);
    const s3 = await phSeen(srv, [A, T], ["tips"]), b3 = await phDeviceBad([A, T]);
    const deleted = !b3.length && phAll(s3, v => !v.ph.includes("ph-test2") && v.ph.includes("ph-test1") && v.skin === "ph-test1");
    // (Not asserted: A2's own "tips" change. Both tabs queue settings under the one outbox key "meta:meta", so when A saves settings
    // before A2 reconnects, A's entry replaces A2's and A2's change is dropped; whether that happens here depends on startup timing.)
    return {out: `photo theme and A's theme kept: ${kept}${phWhy(b1)}  ${phShow(s1)}\n      newer edit wins: ${edited}${phWhy(b2)}  ${phShow(s2)}\n      deletion sticks: ${deleted}${phWhy(b3)}  ${phShow(s3)}`,
      ok: kept && edited && deleted, noLoss: kept && edited, wiped: !kept};
  }],
  ["13b slow device: a late settings write never wipes a photo theme", async (b, srv) => {
    // B (a phone on a slow connection, 600 ms per request) has settings writes queued while A makes a photo theme. Without
    // supabase-sync-conflicts.sql each write is a read-merge-upsert, so B's late write of an older copy overwrote the newer row.
    const {A, B} = await fresh(b, srv, s => s.seed("meta", "planner", {schema: 2, settings: {capacity: 15, style: {skin: "classic"}}}, HOUR));
    const sw = phWatchServer(srv);
    await A.settle(); await B.settle(); await pause(A, 500);
    await A.eval(() => window.SBPHOTO && window.SBPHOTO.grace(1500));
    await phWatchDevice(A); await phWatchDevice(B);
    await B.eval(() => { const o = window.__srv; window.__srv = s => new Promise(r => setTimeout(r, 600)).then(() => o(s)); });
    // B saves settings twice in a row (say the scrapbook's start-up save, then a change): the second waits in the queue
    await B.eval(() => { const S = window.__sbSync; S.state.settings = Object.assign({}, S.state.settings, {t1: 1}); S.saveSettings(); S.state.settings = Object.assign({}, S.state.settings, {t1: 1}); });
    await pause(B, 650);                                                 // B's first write landed; the next one waits behind it
    await setSetting(B, {t2: 1}); await pause(B, 200);
    await phMake(A, [phRec("ph-test1", "Mine"), phRec("ph-test2", "Second")], "ph-test1");   // meanwhile you make a photo theme on A
    await A.settle(); sw.rule = phMissing; await B.settle(); await pause(B, 300);
    await setSetting(B, {t3: 1});                                        // later B saves an unrelated setting
    await B.settle(); await A.settle(); await pause(A, 2500); await converge(A, B);
    sw.rule = null;
    const s1 = await phSeen(srv, [A, B], ["t1", "t2", "t3"]), b1 = await phDeviceBad([A, B]), sv1 = sw.bad.splice(0);
    const kept = !b1.length && phAll(s1, v => v.skin === "ph-test1" && v.ph.includes("ph-test1:Mine") && v.ph.includes("ph-test2"));
    const bKept = s1.server.t1 === 1 && s1.server.t2 === 1 && s1.server.t3 === 1;
    // the newer edit wins: B (offline) renames ph-test1 first, A renames it later; B's older edit arrives last
    B.goOffline(); await phEdit(B, "ph-test1", "Older edit (B)"); await B.settle(); await pause(A, 300);
    await phEdit(A, "ph-test1", "Newer edit (A)"); await A.settle();
    await coming(B); await converge(A, B);
    const s2 = await phSeen(srv, [A, B]), b2 = await phDeviceBad([A, B]);
    const edited = !b2.length && phAll(s2, v => v.ph.includes("ph-test1:Newer edit (A)") && !v.ph.includes("Older edit"));
    // a deletion sticks: A deletes ph-test2 while B (offline) saves settings from a copy that still has it
    B.goOffline(); await phDelete(A, "ph-test2"); await A.settle();
    await setSetting(B, {t4: 1}); await B.settle();
    await coming(B); await converge(A, B);
    const s3 = await phSeen(srv, [A, B], ["t4"]), b3 = await phDeviceBad([A, B]);
    const deleted = !b3.length && phAll(s3, v => !v.ph.includes("ph-test2") && v.ph.includes("ph-test1") && v.skin === "ph-test1");
    const own = bKept && s3.server.t4 === 1;
    // (Without the SQL, B's read-merge-upsert can still put a row without the theme on the server for a moment: that's allowed, since
    // every device merges photo themes by id and only a deletion (photoGone) removes one. It is printed, not asserted.)
    return {out: `photo theme and A's theme kept: ${kept}${phWhy(b1)}; B's own settings kept: ${own}${sv1.length ? "; (server briefly got " + sv1.join("; ") + ")" : ""}  ${phShow(s1)}` +
      `\n      newer edit wins: ${edited}${phWhy(b2)}  ${phShow(s2)}\n      deletion sticks: ${deleted}${phWhy(b3)}  ${phShow(s3)}`,
      ok: kept && own && edited && deleted, noLoss: kept && own && edited, wiped: !kept};
  }],
];

(async () => {
  await new Promise(r => web.listen(0, "127.0.0.1", r)); BASE = "http://127.0.0.1:" + web.address().port;
  const srv = new Server(MODE === "cas");
  const browser = await chromium.launch({executablePath});
  let bad = 0, lost = 0;
  for (const [name, fn] of SC) {
    if (ONLY && !ONLY.some(o => name.startsWith(o + " "))) continue;
    let r;
    try { r = await fn(browser, srv); } catch (e) { r = {out: "ERROR " + e.message.split("\n")[0], ok: false, noLoss: false}; }
    for (const d of Object.values(srv.devs)) { try { await d.ctx.close(); } catch (e) {} }
    R.push([name, r]);
    console.log(`${r.ok ? "PASS" : "FAIL"}${r.noLoss ? "" : "  (DATA LOST)"}  ${name}\n      ${r.out}${r.wiped ? "   <- newer data wiped" : ""}`);
    if (r.extra && r.extra.text && process.env.SHOW) console.log("      ---\n" + r.extra.text.split("\n").map(l => "      | " + l).join("\n"));
    if (!r.ok) bad++; if (!r.noLoss) lost++;
  }
  await browser.close(); web.close();
  console.log(`\nmode=${MODE} index=${path.basename(path.dirname(INDEX))}/${path.basename(INDEX)}: ${R.length - bad}/${R.length} scenarios as designed, ${lost} with lost data`);
  if (!OBSERVE) process.exit(bad ? 1 : 0);
})();
