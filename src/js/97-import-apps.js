/* ===== module: 97-import-apps.js ===== */
/* Import From Another App */
(() => {
/*IMPORTAPPS-START*/
const IA = (() => {
  const CARD_CAP = 20000, NOTE_CAP = 500, TEXT_CAP = 4000, NOTE_TEXT = 8000;
  const pad2 = n => String(n).padStart(2, "0");
  const isoLocal = ms => { const d = new Date(ms); return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); };
  const okDate = (y, m, d) => { const t = new Date(y, m - 1, d); return t.getFullYear() === y && t.getMonth() === m - 1 && t.getDate() === d ? y + "-" + pad2(m) + "-" + pad2(d) : ""; };
  const addDaysISO = (s, n) => { const [y, m, d] = s.split("-").map(Number); return isoLocal(new Date(y, m - 1, d + n).getTime()); };
  // the level (0..5) that matches an interval in days
  const boxFor = n => n <= 0 ? 0 : n <= 1 ? 1 : n <= 3 ? 2 : n <= 8 ? 3 : n <= 20 ? 4 : 5;
  const clip = (s, n) => s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;

  /* SQLite, read only */
  function sqlite(bytes){
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    const MAGIC = "SQLite format 3\u0000";
    if (u8.length < 512) throw new Error("not sqlite");
    for (let i = 0; i < 16; i++) if (u8[i] !== MAGIC.charCodeAt(i)) throw new Error("not sqlite");
    let ps = dv.getUint16(16); if (ps === 1) ps = 65536;
    if (ps < 512 || (ps & (ps - 1))) throw new Error("bad page size");
    const usable = ps - u8[20], pages = Math.floor(u8.length / ps), enc = dv.getUint32(56);
    const dec = new TextDecoder(enc === 2 ? "utf-16le" : enc === 3 ? "utf-16be" : "utf-8");
    const vi = (a, p) => { let v = 0; for (let i = 0; i < 8; i++) { const b = a[p + i]; v = v * 128 + (b & 0x7f); if (!(b & 0x80)) return [v, p + i + 1]; } return [v * 256 + a[p + 8], p + 9]; };
    const int = (a, p, len) => {
      if (len === 8) { const v = new DataView(a.buffer, a.byteOffset + p, 8); return v.getInt32(0) * 4294967296 + v.getUint32(4); }
      let v = 0; for (let i = 0; i < len; i++) v = v * 256 + a[p + i];
      return a[p] & 0x80 ? v - Math.pow(2, 8 * len) : v;
    };
    const LEN = [0, 1, 2, 3, 4, 6, 8];
    function payload(p, n){
      if (n > u8.length) throw new Error("bad record");
      const X = usable - 35;
      if (n <= X) return u8.subarray(p, p + n);
      const M = Math.floor((usable - 12) * 32 / 255) - 23, K = M + (n - M) % (usable - 4), local = K <= X ? K : M;
      const out = new Uint8Array(n); out.set(u8.subarray(p, p + local), 0);
      let got = local, next = dv.getUint32(p + local), hops = 0;
      while (got < n && next && hops++ <= pages) {
        if (next > pages) throw new Error("bad overflow page");
        const o = (next - 1) * ps, take = Math.min(usable - 4, n - got);
        out.set(u8.subarray(o + 4, o + 4 + take), got); got += take; next = dv.getUint32(o);
      }
      if (got < n) throw new Error("short record");
      return out;
    }
    function record(b){
      let r = vi(b, 0); const hs = r[0]; let hp = r[1], dp = hs; const out = [];
      while (hp < hs) {
        r = vi(b, hp); const t = r[0]; hp = r[1];
        if (t === 0 || t === 10 || t === 11) out.push(null);
        else if (t <= 6) { out.push(int(b, dp, LEN[t])); dp += LEN[t]; }
        else if (t === 7) { out.push(new DataView(b.buffer, b.byteOffset + dp, 8).getFloat64(0)); dp += 8; }
        else if (t === 8 || t === 9) out.push(t - 8);
        else { const len = (t - (t % 2 ? 13 : 12)) / 2, s = b.subarray(dp, dp + len); out.push(t % 2 ? dec.decode(s) : s); dp += len; }
      }
      return out;
    }
    function walk(root, fn){
      const stack = [root], seen = new Set();
      while (stack.length) {
        const pg = stack.pop();
        if (!(pg >= 1 && pg <= pages) || seen.has(pg)) throw new Error("bad page " + pg);
        seen.add(pg);
        const base = (pg - 1) * ps, h = pg === 1 ? base + 100 : base, type = u8[h], n = dv.getUint16(h + 3);
        if (type === 13) {
          for (let i = 0; i < n; i++) {
            const c = base + dv.getUint16(h + 8 + 2 * i); let r = vi(u8, c); const size = r[0]; r = vi(u8, r[1]);
            fn(record(payload(r[1], size)), r[0]);
          }
        } else if (type === 5) {
          stack.push(dv.getUint32(h + 8));
          for (let i = n - 1; i >= 0; i--) stack.push(dv.getUint32(base + dv.getUint16(h + 12 + 2 * i)));
        } else throw new Error("not a table page");
      }
    }
    function columns(sql){
      const body = sql.slice(sql.indexOf("(") + 1, sql.lastIndexOf(")")), parts = []; let depth = 0, q = "", cur = "";
      for (const ch of body) {
        if (q) { if (ch === q) q = ""; cur += ch; continue; }
        if (ch === '"' || ch === "'" || ch === "`" || ch === "[") { q = ch === "[" ? "]" : ch; cur += ch; continue; }
        if (ch === "(") depth++; else if (ch === ")") depth--;
        if (ch === "," && !depth) { parts.push(cur); cur = ""; } else cur += ch;
      }
      parts.push(cur);
      const cols = [];
      parts.map(s => s.trim()).filter(s => s && !/^(constraint|primary\s+key|unique|check|foreign\s+key)\b/i.test(s)).forEach(s => {
        const m = /^(?:"([^"]+)"|\[([^\]]+)\]|`([^`]+)`|'([^']+)'|(\S+))/.exec(s);
        cols.push({name: (m[1] || m[2] || m[3] || m[4] || m[5]).toLowerCase(), ipk: /^\S+\s+integer\s+primary\s+key\b/i.test(s)});
      });
      return cols;
    }
    const tables = {};
    walk(1, v => { if (v[0] === "table" && typeof v[4] === "string") tables[String(v[1]).toLowerCase()] = {root: v[3], cols: columns(v[4])}; });
    const has = name => !!tables[name];
    function each(name, fn, pick){
      const t = tables[name]; if (!t) return;
      const idx = t.cols.map((c, i) => [c.name, i, c.ipk]).filter(c => !pick || pick.includes(c[0]));
      walk(t.root, (v, rowid) => { const o = {}; for (const [k, i, ipk] of idx) o[k] = ipk && v[i] == null ? rowid : v[i] === undefined ? null : v[i]; fn(o); });
    }
    const all = (name, pick) => { const out = []; each(name, o => out.push(o), pick); return out; };
    const count = name => { let n = 0; if (tables[name]) walk(tables[name].root, () => { n++; }); return n; };
    return {has, each, all, count, tables: () => Object.keys(tables)};
  }

  /* Text from Anki's HTML fields */
  const ENT = {amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
    times: "×", divide: "÷", deg: "°", middot: "·", bull: "•", copy: "©", reg: "®", trade: "™", euro: "€", pound: "£", cent: "¢", yen: "¥", sect: "§", para: "¶",
    plusmn: "±", micro: "µ", laquo: "«", raquo: "»", shy: "", larr: "←", rarr: "→", uarr: "↑", darr: "↓", harr: "↔", le: "≤", ge: "≥", ne: "≠", asymp: "≈", minus: "−", alpha: "α",
    beta: "β", gamma: "γ", delta: "δ", pi: "π", sigma: "σ", mu: "μ", lambda: "λ", theta: "θ", omega: "ω", Delta: "Δ", Sigma: "Σ", Omega: "Ω", infin: "∞", radic: "√", sup2: "²", sup3: "³", frac12: "½", frac14: "¼", frac34: "¾"};
  const MARK = {acute: "\u0301", grave: "\u0300", circ: "\u0302", uml: "\u0308", tilde: "\u0303", ring: "\u030a", cedil: "\u0327"};
  Object.assign(ENT, {szlig: "ß", aelig: "æ", AElig: "Æ", oslash: "ø", Oslash: "Ø", eth: "ð", thorn: "þ", iexcl: "¡", iquest: "¿"});
  const named = e => { if (ENT[e] != null) return ENT[e]; const m = /^([a-zA-Z])(acute|grave|circ|uml|tilde|ring|cedil)$/.exec(e); return m ? (m[1] + MARK[m[2]]).normalize("NFC") : ENT[e.toLowerCase()]; };
  const chr = n => n > 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : "";
  const decodeEnt = s => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (m, e) => e[0] === "#" ? chr(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : named(e) != null ? named(e) : m);
  // count: {pics, sounds} is added to for each picture and sound left out
  function htmlText(h, count){
    let s = String(h == null ? "" : h);
    s = s.replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
    s = s.replace(/<img\b[^>]*>/gi, () => { if (count) count.pics++; return ""; }).replace(/\[sound:[^\]]*\]/gi, () => { if (count) count.sounds++; return ""; });
    s = s.replace(/<br\s*\/?>/gi, "\n").replace(/<li\b[^>]*>/gi, "\u0001• ").replace(/<\/?(div|p|li|ul|ol|h[1-6]|tr|table|blockquote|pre|section)\b[^>]*>/gi, "\u0001");
    s = s.replace(/<[^>]*>/g, "");
    s = decodeEnt(s).replace(/ /g, " ").replace(/\n?\u0001+\n?/g, "\n").replace(/\r\n?/g, "\n");
    return s.split("\n").map(l => l.replace(/[ \t]+/g, " ").trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  const CLOZE = /\{\{c(\d+)::([\s\S]*?)(?:::([\s\S]*?))?\}\}/g;
  const hasCloze = s => /\{\{c\d+::/.test(s);
  // One cloze card the way Studyboard writes fill-in-the-blank cards
  function clozeCard(text, n){
    const ans = [];
    const front = text.replace(CLOZE, (m, k, a, hint) => { if (Number(k) !== n) return a; ans.push(a); return hint ? `_____ (${hint})` : "_____"; });
    return ans.length ? {front, back: ans.join(", ")} : null;
  }
  // NotetypeConfig (protobuf, newer Anki)
  function pbKind(b){
    if (!(b instanceof Uint8Array)) return 0;
    let p = 0;
    const v = () => { let x = 0, m = 1; for (let i = 0; i < 10 && p < b.length; i++) { const c = b[p++]; x += (c & 0x7f) * m; m *= 128; if (!(c & 0x80)) break; } return x; };
    while (p < b.length) {
      const key = v(), f = Math.floor(key / 8), wt = key % 8;
      if (wt === 0) { const x = v(); if (f === 1) return x; }
      else if (wt === 1) p += 8; else if (wt === 5) p += 4;
      else if (wt === 2) p += v(); else break;
    }
    return 0;
  }

  /* Anki collection -> decks of Studyboard cards */
  const isPlaceholder = db => db.has("notes") && db.count("notes") <= 1;
  function readAnki(db, opts){
    opts = opts || {};
    const cap = opts.cap || CARD_CAP;
    const col = (db.has("col") ? db.all("col", ["crt", "models", "decks"]) : [])[0] || {};
    const crt = Number(col.crt) || 0;
    const deckName = {}, cloze = {};
    if (db.has("decks")) db.each("decks", r => { deckName[r.id] = String(r.name || "").split("\u001f").join("::"); }, ["id", "name"]);
    if (typeof col.decks === "string" && col.decks.length > 2) { try { Object.values(JSON.parse(col.decks)).forEach(d => { if (d && d.id != null && !deckName[d.id]) deckName[d.id] = String(d.name || ""); }); } catch (e) { } }
    if (typeof col.models === "string" && col.models.length > 2) { try { Object.values(JSON.parse(col.models)).forEach(m => { if (m && m.id != null) cloze[m.id] = m.type === 1; }); } catch (e) { } }
    if (db.has("notetypes")) db.each("notetypes", r => { cloze[r.id] = pbKind(r.config) === 1; }, ["id", "config"]);
    const notes = new Map();
    db.each("notes", r => { notes.set(r.id, {mid: r.mid, flds: String(r.flds == null ? "" : r.flds).split("\u001f"), used: false}); }, ["id", "mid", "flds"]);
    const lastRev = new Map();
    if (db.has("revlog")) db.each("revlog", r => { const t = Number(r.id) || 0; if (t > (lastRev.get(r.cid) || 0)) lastRev.set(r.cid, t); }, ["id", "cid"]);
    const raw = [];
    db.each("cards", r => raw.push(r), ["id", "nid", "did", "ord", "type", "queue", "due", "ivl", "factor", "reps", "lapses", "odue", "odid", "data"]);
    const dayDate = due => isoLocal((crt + due * 86400) * 1000);
    const count = {pics: 0, sounds: 0}, groups = new Map();
    let skipped = 0;
    raw.sort((a, b) => a.nid - b.nid || a.ord - b.ord);
    for (const c of raw) {
      const n = notes.get(c.nid); if (!n) { skipped++; continue; }
      const did = c.odid ? c.odid : c.did, dueRaw = c.odid && c.odue ? c.odue : c.due;
      const pc = {pics: 0, sounds: 0}, f = n.flds.map(x => htmlText(x, pc));
      let fb = null;
      const zi = f.findIndex(hasCloze);
      if (cloze[n.mid] || (cloze[n.mid] == null && zi >= 0)) {
        const z = zi >= 0 ? zi : 0, card = clozeCard(f[z], (c.ord | 0) + 1);
        if (card) { const extra = f.filter((x, i) => i !== z && x).join("\n"); fb = {front: card.front, back: card.back + (extra ? "\n\n" + extra : "")}; }
      } else if ((c.ord | 0) >= 1 && f.length >= 2) fb = {front: f[Math.min(c.ord | 0, f.length - 1)], back: f[0]};
      else fb = {front: f[0] || "", back: f[1] || f.slice(2).find(Boolean) || ""};
      if (!fb || !fb.front.trim() || !fb.back.trim()) { skipped++; if (!n.used) { count.pics += pc.pics; count.sounds += pc.sounds; n.used = true; } continue; }
      if (!n.used) { count.pics += pc.pics; count.sounds += pc.sounds; n.used = true; }
      const card = {front: clip(fb.front, TEXT_CAP), back: clip(fb.back, TEXT_CAP), box: 0, due: "", seen: 0, right: 0, wrong: 0};
      const reps = Math.max(0, c.reps | 0), lapses = Math.max(0, c.lapses | 0);
      if (c.type !== 0) {
        let data = null; try { data = c.data && String(c.data).trim().startsWith("{") ? JSON.parse(c.data) : null; } catch (e) { data = null; }
        const ivl = c.ivl > 0 ? c.ivl : 0;
        const due = Number(dueRaw) > 1e8 ? isoLocal(Number(dueRaw) * 1000) : dayDate(Number(dueRaw) || 0);
        card.seen = Math.max(1, reps); card.wrong = Math.min(lapses, card.seen); card.right = Math.max(0, card.seen - card.wrong);
        card.due = due; card.box = boxFor(ivl);
        const lr = lastRev.get(c.id), lrt = data && Number(data.lrt) > 0 ? Number(data.lrt) * 1000 : 0;
        card.last = lr ? isoLocal(lr) : lrt ? isoLocal(lrt) : ivl ? addDaysISO(due, -ivl) : due;
        if (data && Number(data.s) > 0 && Number(data.d) > 0) card.fs = {s: Math.round(Number(data.s) * 1000) / 1000, d: Math.round(Math.min(10, Math.max(1, Number(data.d))) * 1000) / 1000};
        else {
          const fac = Number(c.factor) || 2500;
          card.fs = {s: Math.max(0.5, ivl), d: Math.round(Math.min(10, Math.max(1, 5 + (2500 - fac) / 200)) * 100) / 100};
        }
      }
      if (!groups.has(did)) groups.set(did, []);
      groups.get(did).push(card);
    }
    const paths = [...groups.keys()].map(did => ({did, path: deckName[did] || "Anki Deck"})).sort((a, b) => a.path.localeCompare(b.path));
    const short = p => p.split("::").pop().trim() || p;
    const clash = new Map(); paths.forEach(x => clash.set(short(x.path).toLowerCase(), (clash.get(short(x.path).toLowerCase()) || 0) + 1));
    let left = cap, found = 0;
    const decks = [];
    for (const x of paths) {
      const all = groups.get(x.did); found += all.length;
      const cards = all.slice(0, Math.max(0, left)); left -= cards.length;
      if (!cards.length) continue;
      const name = clash.get(short(x.path).toLowerCase()) > 1 ? x.path.split("::").map(s => s.trim()).join(" › ") : short(x.path);
      decks.push({name: clip(name, 120), path: x.path, cards, learned: cards.filter(c => c.seen > 0).length});
    }
    const total = decks.reduce((a, d) => a + d.cards.length, 0);
    return {decks, total, found, capped: found > total, learned: decks.reduce((a, d) => a + d.learned, 0), pics: count.pics, sounds: count.sounds, skipped};
  }

  /* CSV */
  function parseCSV(text){
    text = String(text || "").replace(/^﻿/, "");
    const first = text.slice(0, text.indexOf("\n") < 0 ? text.length : text.indexOf("\n"));
    const sep = first.indexOf(",") < 0 && first.indexOf("\t") >= 0 ? "\t" : first.indexOf(",") < 0 && first.indexOf(";") >= 0 ? ";" : ",";
    const rows = []; let row = [], f = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; continue; }
      if (ch === '"' && f === "") q = true;
      else if (ch === sep) { row.push(f); f = ""; }
      else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; }
      else f += ch;
    }
    if (f !== "" || row.length) { row.push(f); rows.push(row); }
    return rows;
  }

  /* Dates written the way people type them (Todoist, Notion) */
  const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const MON = "(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?";
  // -> {date: "YYYY-MM-DD", time: "HH:MM" or ""} or null
  function looseDate(s, today){
    s = String(s || "").toLowerCase().trim(); if (!s) return null;
    const [ty, tm, td] = today.split("-").map(Number);
    let time = "", m;
    if ((m = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/.exec(s))) { let h = Number(m[1]) % 12; if (m[3] === "pm") h += 12; if (h < 24 && Number(m[2] || 0) < 60) time = pad2(h) + ":" + (m[2] || "00"); }
    else if ((m = /(?:t|\s|^|at\s)([01]?\d|2[0-3]):([0-5]\d)\b/.exec(s))) time = pad2(Number(m[1])) + ":" + m[2];
    const out = d => d ? {date: d, time} : null;
    if ((m = /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(s))) return out(okDate(+m[1], +m[2], +m[3]));
    if ((m = /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/.exec(s))) return out(okDate(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[1], +m[2]));
    const withYear = (mo, d, y) => { if (y) return okDate(y, mo, d); let x = okDate(ty, mo, d); if (x && x < today) x = okDate(ty + 1, mo, d); return x; };
    if ((m = new RegExp("\\b" + MON + "\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?:,?\\s+(\\d{4}))?").exec(s))) return out(withYear(MONTHS.indexOf(m[1]) + 1, +m[2], m[3] ? +m[3] : 0));
    if ((m = new RegExp("\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+" + MON + "(?:,?\\s+(\\d{4}))?").exec(s))) return out(withYear(MONTHS.indexOf(m[2]) + 1, +m[1], m[3] ? +m[3] : 0));
    if (/\b(today|tod|every ?day|daily|every weekday|every workday)\b/.test(s)) return out(today);
    if (/\b(tomorrow|tom)\b/.test(s)) return out(addDaysISO(today, 1));
    if ((m = /\b(sun|mon|tue|wed|thu|fri|sat)[a-z]*\b/.exec(s))) {
      const want = DAYS.indexOf(m[1]), now = new Date(ty, tm - 1, td).getDay();
      return out(addDaysISO(today, (want - now + 7) % 7));
    }
    return null;
  }

  /* Todoist */
  const tdName = n => String(n || "").split("/").pop().replace(/\.csv$/i, "").replace(/\s*\[\d+\]\s*$/, "").replace(/_/g, " ").trim() || "Todoist";
  // markdown in a task's title
  const mdInline = s => String(s || "").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, "$1 ($2)").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2").replace(/(^|[\s(])[*_]([^*_\n]+)[*_](?=$|[\s).,!?:;])/g, "$1$2").replace(/~~(.+?)~~/g, "$1").replace(/`([^`]+)`/g, "$1");
  const TD_PRIO = {4: "urgent", 3: "high", 2: "med", 1: "med"};
  function todoist(text, fileName, today){
    const rows = parseCSV(text); if (!rows.length) return null;
    const H = rows[0].map(h => h.trim().toUpperCase()), at = k => H.indexOf(k);
    if (at("TYPE") < 0 || at("CONTENT") < 0) return null;
    const get = (r, k) => at(k) >= 0 ? String(r[at(k)] || "").trim() : "";
    const tasks = []; let section = "", parent = null, last = null, steps = 0;
    for (const r of rows.slice(1)) {
      const type = get(r, "TYPE").toLowerCase(), content = mdInline(get(r, "CONTENT")).trim();
      if (!content && type !== "note") continue;
      if (type === "section") { section = content; parent = null; continue; }
      if (type === "note") { if (last && content) last.notes = (last.notes ? last.notes + "\n\n" : "") + content; continue; }
      if (type !== "task") continue;
      const indent = Math.max(1, Number(get(r, "INDENT")) || 1);
      if (indent > 1 && parent) { parent.checklist.push(clip(content, 400)); steps++; last = parent; continue; }
      const date = looseDate(get(r, "DATE"), today), dl = looseDate(get(r, "DEADLINE"), today);
      const t = {title: clip(content, 200), notes: [get(r, "DESCRIPTION"), section ? "Section: " + section : ""].filter(Boolean).join("\n\n"),
        priority: TD_PRIO[Number(get(r, "PRIORITY"))] || "med", due: "", start: "", time: "", checklist: []};
      if (dl) { t.due = dl.date; if (date && date.date <= dl.date) t.start = date.date; t.time = dl.time || ""; }
      else if (date) { t.due = date.date; t.time = date.time; }
      tasks.push(t); parent = t; last = t;
    }
    return {name: tdName(fileName), tasks, steps};
  }

  /* Notion */
  const ID32 = /\s+[0-9a-f]{32}$/i;
  const notionTitle = n => { let b = String(n || "").split("/").pop().replace(/\.(md|csv)$/i, "").replace(/_all$/, ""); b = b.replace(ID32, ""); return b.trim() || "Untitled"; };
  const notionDir = n => String(n || "").split("/").slice(0, -1).map(p => p.replace(ID32, "").trim()).join("/");
  // A Notion page in Markdown -> note text
  function mdText(md, count){
    const lines = String(md || "").replace(/^﻿/, "").replace(/\r\n?/g, "\n").split("\n"), out = [];
    let fence = false;
    for (let l of lines) {
      if (/^\s*(```|~~~)/.test(l)) { fence = !fence; continue; }
      if (fence) { out.push(l); continue; }
      if (/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(l) && l.indexOf("-") >= 0 && l.indexOf("|") >= 0) continue;
      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(l)) { out.push(""); continue; }
      l = l.replace(/!\[[^\]]*\]\([^)]*\)/g, () => { if (count) count.pics++; return ""; }).replace(/<img\b[^>]*>/gi, () => { if (count) count.pics++; return ""; });
      l = l.replace(/<\/?(aside|details|summary|div|span|u|mark)\b[^>]*>/gi, "").replace(/<br\s*\/?>/gi, " ");
      let m;
      if ((m = /^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/.exec(l))) { if (out.length && out[out.length - 1] !== "") out.push(""); out.push(mdInline(m[1])); continue; }
      l = l.replace(/^(\s*)[-*+]\s+\[[xX]\]\s+/, "$1☑ ").replace(/^(\s*)[-*+]\s+\[ \]\s+/, "$1☐ ").replace(/^(\s*)[-*+]\s+/, "$1• ").replace(/^\s*>\s?/, "");
      l = l.replace(/^( {2,})/, sp => " ".repeat(Math.floor(sp.length / 2)));
      out.push(decodeEnt(mdInline(l).replace(/\[([^\]]*?)\s+[0-9a-f]{32}\]/gi, "[$1]")).replace(/\s+$/, ""));
    }
    return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  const HEAD = s => String(s || "").trim().toLowerCase().replace(/^﻿/, "");
  const PAIRS = [["term", "definition"], ["front", "back"], ["question", "answer"], ["word", "meaning"], ["word", "definition"], ["term", "meaning"], ["concept", "definition"], ["prompt", "answer"], ["q", "a"], ["english", "translation"], ["vocab", "definition"], ["vocabulary", "definition"], ["card front", "card back"]];
  const DONE = /^(yes|done|complete|completed|finished|true|✅|☑|x)$/i;
  // A Notion database
  function notionTable(text, fileName, today){
    const rows = parseCSV(text).filter(r => r.some(x => String(x).trim())); if (rows.length < 2) return null;
    const H = rows[0].map(HEAD), name = notionTitle(fileName), body = rows.slice(1);
    for (const [a, b] of PAIRS) {
      const i = H.indexOf(a), j = H.indexOf(b);
      if (i >= 0 && j >= 0) { const cards = body.map(r => ({front: clip(String(r[i] || "").trim(), TEXT_CAP), back: clip(String(r[j] || "").trim(), TEXT_CAP)})).filter(c => c.front && c.back); return cards.length ? {kind: "deck", name, cards} : null; }
    }
    let dateCol = H.findIndex(h => /^(due|due date|date|deadline|due on|do date|when|due by)$/.test(h)); if (dateCol < 0) dateCol = H.findIndex(h => /\b(due|deadline)\b/.test(h));
    let nameCol = H.findIndex(h => /^(name|task|task name|title|assignment|to-?do|item|tasks)$/.test(h)); if (nameCol < 0 && dateCol > 0) nameCol = 0;
    if (dateCol >= 0 && nameCol >= 0) {
      const st = H.findIndex(h => /^(status|done|complete|completed|checkbox|finished)$/.test(h)), pr = H.indexOf("priority");
      const notesCol = H.findIndex(h => /^(notes|description|details)$/.test(h));
      let done = 0; const tasks = [];
      body.forEach(r => {
        const title = String(r[nameCol] || "").trim(); if (!title) return;
        if (st >= 0 && DONE.test(String(r[st] || "").trim())) { done++; return; }
        const parts = String(r[dateCol] || "").split("→").map(x => looseDate(x, today)).filter(Boolean), d = parts[parts.length - 1];
        const p = String(pr >= 0 ? r[pr] || "" : "").toLowerCase();
        tasks.push({title: clip(title, 200), notes: notesCol >= 0 ? String(r[notesCol] || "").trim() : "", priority: /urgent|highest|p1/.test(p) ? "urgent" : /high|p2/.test(p) ? "high" : /low|p4/.test(p) ? "low" : "med",
          due: d ? d.date : "", start: parts.length > 1 && parts[0].date <= d.date ? parts[0].date : "", time: d ? d.time : "", checklist: []});
      });
      return tasks.length ? {kind: "tasks", name, tasks, done} : null;
    }
    if (H.length === 2) { const cards = body.map(r => ({front: clip(String(r[0] || "").trim(), TEXT_CAP), back: clip(String(r[1] || "").trim(), TEXT_CAP)})).filter(c => c.front && c.back); return cards.length ? {kind: "deck", name, cards} : null; }
    return null;
  }

  /* Files (text) -> what the preview offers */
  function plan(files, today){
    const groups = [], count = {pics: 0, sounds: 0}; let skipped = 0, notesCut = 0, done = 0;
    const csv = files.filter(f => /\.csv$/i.test(f.name)), md = files.filter(f => /\.(md|markdown)$/i.test(f.name));
    const names = new Set(csv.map(f => f.name));
    const dbDirs = new Set();
    csv.forEach(f => {
      if (!/_all\.csv$/i.test(f.name) && names.has(f.name.replace(/\.csv$/i, "_all.csv"))) return;
      const td = todoist(f.text, f.name, today);
      if (td) { if (td.tasks.length) groups.push({kind: "tasks", app: "todoist", name: td.name, items: td.tasks, steps: td.steps}); return; }
      const nt = notionTable(f.text, f.name, today);
      if (nt) {
        dbDirs.add((notionDir(f.name) ? notionDir(f.name) + "/" : "") + notionTitle(f.name));
        done += nt.done || 0;
        groups.push(nt.kind === "deck" ? {kind: "deck", app: "notion", name: nt.name, items: nt.cards} : {kind: "tasks", app: "notion", name: nt.name, items: nt.tasks});
      } else skipped++;
    });
    const pages = [];
    md.forEach(f => {
      const dir = notionDir(f.name);
      if ([...dbDirs].some(d => dir === d || dir.startsWith(d + "/"))) return;
      const title = notionTitle(f.name), pc = {pics: 0, sounds: 0};
      let text = mdText(f.text, pc);
      const firstLine = text.split("\n")[0].trim();
      if (firstLine !== title) text = title + "\n\n" + text;
      if (!text.slice(title.length).trim()) return;
      count.pics += pc.pics;
      if (text.length > NOTE_TEXT) { text = clip(text, NOTE_TEXT); notesCut++; }
      pages.push({title, text: text.trim(), dir});
    });
    if (pages.length) {
      const over = Math.max(0, pages.length - NOTE_CAP);
      groups.push({kind: "notes", app: "notion", name: "Pages", items: pages.slice(0, NOTE_CAP), over});
    }
    return {groups, skipped, pics: count.pics, notesCut, done};
  }

  // The course a file belongs to, when its name has a course's code or name in it
  function matchCourse(name, courses){
    const words = s => " " + (String(s || "").toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).join(" ") + " ", flat = s => words(s).replace(/ /g, "");
    const n = words(name), nf = flat(name); if (!nf) return "";
    let best = "", len = 0;
    (courses || []).forEach(c => [c.code, c.name].forEach(x => {
      const w = words(x), f = flat(x);
      if (f.length >= 3 && (n.includes(w) || (/\d/.test(f) && /\p{L}/u.test(f) && nf.includes(f))) && f.length > len) { best = c.id; len = f.length; }
    }));
    return best;
  }

  /* zstd: a plain frame of raw blocks (for tests; Anki's real files are unpacked by fzstd) */
  function zstdRaw(data){
    const parts = [new Uint8Array([0x28, 0xb5, 0x2f, 0xfd, 0x00, 0x58])], B = 131072;
    for (let i = 0; i < data.length || i === 0; i += B) {
      const c = data.subarray(i, i + B), last = i + B >= data.length ? 1 : 0, h = c.length * 8 + last;
      parts.push(new Uint8Array([h & 255, (h >> 8) & 255, (h >> 16) & 255]), c);
      if (!data.length) break;
    }
    const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0)); let o = 0; parts.forEach(p => { out.set(p, o); o += p.length; });
    return out;
  }
  const isZstd = b => b && b.length > 4 && b[0] === 0x28 && b[1] === 0xb5 && b[2] === 0x2f && b[3] === 0xfd;
  const isZip = b => b && b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && (b[2] === 3 || b[2] === 5);
  const isSqlite = b => b && b.length > 16 && String.fromCharCode.apply(null, b.subarray(0, 15)) === "SQLite format 3";

  return {CARD_CAP, NOTE_CAP, sqlite, readAnki, isPlaceholder, htmlText, clozeCard, pbKind, parseCSV, looseDate, todoist, notionTitle, notionDir, mdText, notionTable, plan, matchCourse, zstdRaw, isZstd, isZip, isSqlite, boxFor};
})();
/*IMPORTAPPS-END*/

  /* Reading the picked file */
  const FZSTD_URL = "vendor/fzstd-0.1.1.umd.js", FZSTD_SRI = "sha384-j11FJIL1HatEZOwEloCeZcNzDESMGs1ncTc2Kt0LgG0QpBU7lZHgyGU0Mif1OHeH";
  const ANKI_MAX = 300 * 1024 * 1024, NESTED_MAX = 300 * 1024 * 1024, TEXT_TOTAL = 80 * 1024 * 1024;
  let zstdReady = null;
  const loadZstd = () => zstdReady || (zstdReady = (window.fzstd ? Promise.resolve() : loadScript(FZSTD_URL, FZSTD_SRI)).then(() => { if (!window.fzstd) throw new Error("no fzstd"); }).catch(e => { zstdReady = null; throw e; }));
  async function unzstd(bytes){
    await loadZstd();
    const parts = []; let n = 0;
    const d = new window.fzstd.Decompress(chunk => { n += chunk.length; if (n > ANKI_MAX) throw new Error("too big"); parts.push(chunk); });
    d.push(bytes, true);
    const out = new Uint8Array(n); let o = 0; parts.forEach(p => { out.set(p, o); o += p.length; });
    return out;
  }
  const oops = msg => Object.assign(new Error(msg), {friendly: true});
  async function readAnkiFile(src){
    const files = await unzipBytes(src, n => /^collection\.anki(2|21|21b)$/.test(n), {max: ANKI_MAX});
    let db = null;
    const legacy = files["collection.anki21"] || files["collection.anki2"];
    if (legacy && IA.isSqlite(legacy)) { db = IA.sqlite(legacy); if (files["collection.anki21b"] && IA.isPlaceholder(db)) db = null; }
    if (!db && files["collection.anki21b"]) {
      let b = files["collection.anki21b"];
      if (IA.isZstd(b)) { try { b = await unzstd(b); } catch (e) { throw oops(tr("ia.err.zstd", "This Anki file needs a part of Studyboard that didn't load. Check your connection and try again, or in Anki turn on “Support older Anki versions” when you export.")); } }
      db = IA.sqlite(b);
    }
    if (!db) throw oops(tr("ia.err.anki", "That doesn't look like an Anki deck file. In Anki, choose File, then Export, and pick Anki Deck Package."));
    return IA.readAnki(db, {cap: IA.CARD_CAP});
  }
  // Every CSV and Markdown file in a ZIP, and in a ZIP inside it (Notion does that), as [{name
  async function zipTexts(src, depth, out, budget){
    const files = await unzipBytes(src, n => /\.(csv|md|markdown|zip)$/i.test(n) && !/(^|\/)__MACOSX\//.test(n), {max: NESTED_MAX, entries: 60000});
    const dec = new TextDecoder();
    for (const name of Object.keys(files)) {
      const b = files[name];
      if (/\.zip$/i.test(name)) { if (depth < 2 && IA.isZip(b)) await zipTexts(b, depth + 1, out, budget); continue; }
      if (b.length > ZIP_MAX_OUT || (budget.left -= b.length) < 0) continue;
      out.push({name, text: dec.decode(b)});
    }
    return out;
  }
  async function readFile(file){
    const head = new Uint8Array(await file.slice(0, 8).arrayBuffer()), today = todayISO();
    if (/\.(apkg|colpkg)$/i.test(file.name) || (IA.isZip(head) && /\.anki/i.test(file.name))) return {app: "anki", anki: await readAnkiFile(file)};
    if (IA.isZip(head)) {
      const names = []; await unzipBytes(file, n => { names.push(n); return false; }, {entries: 60000});
      if (names.some(n => /^collection\.anki(2|21|21b)$/.test(n))) return {app: "anki", anki: await readAnkiFile(file)};
      const texts = await zipTexts(file, 0, [], {left: TEXT_TOTAL});
      return {app: "files", plan: IA.plan(texts, today)};
    }
    if (file.size > ZIP_MAX_OUT) throw oops(tr("ia.err.big", "That file is too big to read here."));
    if (/\.(csv|md|markdown|txt)$/i.test(file.name)) return {app: "files", plan: IA.plan([{name: file.name.replace(/\.txt$/i, ".md"), text: await file.text()}], today)};
    throw oops(tr("ia.err.type", "Studyboard can read Anki files (.apkg, .colpkg), Todoist CSV or backup files, and Notion exports (.zip). Choose one of those."));
  }

  /* The sheets */
  let PV = null;
  const n0 = n => trn("ia.n", n, "{n}|{n}");
  const cardsW = n => trn("ia.cards", n, "{n} card|{n} cards"), decksW = n => trn("ia.decks", n, "{n} deck|{n} decks"), tasksW = n => trn("ia.tasks", n, "{n} task|{n} tasks"), notesW = n => trn("ia.notes", n, "{n} note|{n} notes");
  const APPS = () => [
    ["anki", "Anki", tr("ia.how.anki", "In Anki, choose File, then Export. Pick Anki Deck Package (.apkg) or Collection Package (.colpkg), keep Include Scheduling Information on, then choose the file here.")],
    ["quizlet", "Quizlet", tr("ia.how.quizlet", "In Quizlet, open the set, choose the three dots, then Export. Copy the text, then use Paste Cards here.")],
    ["todoist", "Todoist", tr("ia.how.todoist", "In Todoist, open a project, choose the three dots, then Export as CSV. Or download a backup ZIP from Settings, then Backups.")],
    ["notion", "Notion", tr("ia.how.notion", "In Notion, open the page, choose the three dots, then Export. Pick Markdown & CSV, include subpages, then choose the ZIP file here.")],
  ];
  // A file being read, or read and waiting in the preview, is set aside when you tap away and comes back here; Cancel or Import clears it
  const IKEY = "import-apps";
  let IJ = null;
  function open(){
    if (sheetResume(IKEY)) return;
    PV = null;
    openSheet(`<div class="sheet ia-sheet">${head(tr("ia.title", "Import From Another App"))}
      <div class="sheet-body">
        <p class="mini" style="margin:0 0 6px">${esc(tr("ia.intro", "Bring in your flashcards, tasks and notes. Files are read on this device and nothing is uploaded."))}</p>
        <div class="menu-list ia-apps">${APPS().map(([id, name, how]) => `<button type="button" data-act="${id === "quizlet" ? "ia-quizlet" : "ia-pick"}" data-id="${id}"><span>${esc(name)}<span class="sub">${esc(how)}</span></span></button>`).join("")}</div>
        <div class="ia-drop" id="iaDrop"><span>${esc(tr("ia.drop", "Drop an .apkg, .colpkg, .csv or .zip file here, or"))}</span> <button type="button" class="btn small" data-act="ia-pick">${esc(tr("ia.choose", "Choose a File"))}</button></div>
        <input type="file" id="iaFile" hidden>
        <p class="status-msg" id="iaMsg" aria-live="polite" style="margin:8px 0 0"></p>
      </div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">${esc(tr("ia.cancel", "Cancel"))}</button></div></div>`);
    const inp = $("#iaFile"), drop = $("#iaDrop"), body = dlg.querySelector(".ia-sheet");
    const job = IJ = {reading: false, dropped: false, el: body};
    sheetKeep(IKEY, {name: tr("ia.title", "Import From Another App"), dirty: () => false, busy: () => job.reading, drop: () => { job.dropped = true; }});
    inp.addEventListener("change", () => { const f = inp.files && inp.files[0]; inp.value = ""; if (f) take(f); });
    body.addEventListener("dragover", e => { if (e.dataTransfer && [...(e.dataTransfer.types || [])].includes("Files")) { e.preventDefault(); e.stopPropagation(); drop.classList.add("drop-on"); } });
    body.addEventListener("dragleave", e => { if (!body.contains(e.relatedTarget)) drop.classList.remove("drop-on"); });
    body.addEventListener("drop", e => { e.preventDefault(); e.stopPropagation(); drop.classList.remove("drop-on"); const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) take(f); });
  }
  async function take(file){
    const job = IJ, el = (job && job.el) || dlg.querySelector(".ia-sheet"), msg = el.querySelector("#iaMsg"), say = t => { if (msg) msg.textContent = t; };
    say(tr("ia.reading", "Reading {name}…", {name: file.name}));
    el.querySelectorAll("button").forEach(b => { if (b.dataset.act !== "close") b.disabled = true; });
    if (job) job.reading = true;
    let r;
    try { r = await readFile(file); }
    catch (e) {
      console.warn("import", e);
      if (job) { job.reading = false; if (job.dropped) return; }
      el.querySelectorAll("button").forEach(b => { b.disabled = false; });
      say(e && e.friendly ? e.message : e && e.code === "big" ? e.message : tr("ia.err.read", "Studyboard couldn't read that file. Check that it's an export from Anki, Todoist or Notion and try again."));
      if (sheetKept(IKEY)) toast(tr("ia.err.away", "Studyboard couldn't read that file. Open Import From Another App again to see why."), null, {label: tr("ia.open", "Open"), fn: () => sheetResume(IKEY)}, {error: true});
      return;
    }
    if (job) { job.reading = false; if (job.dropped) return; }
    // shown now if its sheet is open, or from a toast when it was set aside
    sheetReady(IKEY, () => preview(r, file.name), tr("ia.ready", "{name} is ready to import", {name: file.name}));
  }
  function preview(r, fileName){
    const courses = coursesArr().map(c => ({id: c.id, name: c.name, code: c.code}));
    const groups = [], warn = [];
    let head1 = "", app = r.app;
    if (r.app === "anki") {
      const a = r.anki;
      a.decks.forEach(d => groups.push({kind: "deck", name: d.name, items: d.cards, on: true, courseId: matchCourseFor(d.path, courses)}));
      head1 = a.total ? tr("ia.sum.anki", "Found {decks}, {cards}", {decks: decksW(a.decks.length), cards: cardsW(a.total)}) + (a.learned ? " " + tr("ia.sum.learned", "({n} already learned, history kept)", {n: n0(a.learned)}) : "") + "." : tr("ia.sum.none", "That file has no cards to bring in.");
      if (a.capped) warn.push(tr("ia.w.cap", "This file has {found} cards. Studyboard brings in the first {cap} at once.", {found: n0(a.found), cap: n0(a.total)}));
      if (a.pics) warn.push(trn("ia.w.pics", a.pics, "{n} picture wasn't brought in.|{n} pictures weren't brought in."));
      if (a.sounds) warn.push(trn("ia.w.sounds", a.sounds, "{n} sound wasn't brought in.|{n} sounds weren't brought in."));
      if (a.skipped) warn.push(trn("ia.w.skip", a.skipped, "{n} card had nothing but pictures or sound on one side and was left out.|{n} cards had nothing but pictures or sound on one side and were left out."));
    } else {
      const p = r.plan;
      p.groups.forEach(g => groups.push(Object.assign({}, g, {on: true, courseId: g.kind === "notes" ? "" : matchCourseFor(g.name + " " + fileName, courses)})));
      app = groups.some(g => g.app === "todoist") && !groups.some(g => g.app === "notion") ? "todoist" : groups.some(g => g.app === "notion") ? "notion" : "files";
      const nd = groups.filter(g => g.kind === "deck"), nt = groups.filter(g => g.kind === "tasks"), nn = groups.filter(g => g.kind === "notes");
      const bits = [];
      if (nt.length) bits.push(tasksW(nt.reduce((a, g) => a + g.items.length, 0)));
      if (nd.length) bits.push(tr("ia.bit.deck", "{cards} in {decks}", {cards: cardsW(nd.reduce((a, g) => a + g.items.length, 0)), decks: decksW(nd.length)}));
      if (nn.length) bits.push(notesW(nn.reduce((a, g) => a + g.items.length, 0)));
      head1 = bits.length ? tr("ia.sum.found", "Found {what}.", {what: bits.join(", ")}) : tr("ia.sum.nothing", "Nothing in that file could be brought in. Studyboard reads Todoist CSV files and Notion's Markdown & CSV export.");
      const steps = nt.reduce((a, g) => a + (g.steps || 0), 0);
      if (steps) warn.push(trn("ia.w.steps", steps, "{n} sub-task becomes a checklist step.|{n} sub-tasks become checklist steps."));
      if (p.done) warn.push(trn("ia.w.done", p.done, "{n} finished task was left out.|{n} finished tasks were left out."));
      if (p.pics) warn.push(trn("ia.w.pics", p.pics, "{n} picture wasn't brought in.|{n} pictures weren't brought in."));
      if (p.notesCut) warn.push(trn("ia.w.cut", p.notesCut, "{n} long page was shortened to fit a note.|{n} long pages were shortened to fit a note."));
      nn.forEach(g => { if (g.over) warn.push(tr("ia.w.notecap", "Only the first {n} pages are brought in at once.", {n: n0(IA.NOTE_CAP)})); });
      if (p.skipped) warn.push(trn("ia.w.tables", p.skipped, "{n} table wasn't tasks or flashcards and was left out.|{n} tables weren't tasks or flashcards and were left out."));
    }
    PV = {app, groups};
    const title = {anki: tr("ia.t.anki", "Import From Anki"), todoist: tr("ia.t.todoist", "Import From Todoist"), notion: tr("ia.t.notion", "Import From Notion")}[app] || tr("ia.t.file", "Import");
    const kindW = g => g.kind === "deck" ? cardsW(g.items.length) + (g.items.some(c => c.seen > 0) ? " · " + tr("ia.learnedN", "{n} learned", {n: n0(g.items.filter(c => c.seen > 0).length)}) : "") : g.kind === "tasks" ? tasksW(g.items.length) : notesW(g.items.length);
    const opts = sel => `<option value="">${esc(tr("ia.nocourse", "No course"))}</option>` + coursesArr().map(c => `<option value="${esc(c.id)}"${c.id === sel ? " selected" : ""}>${esc(courseLabel(c))}</option>`).join("");
    const row = (g, i) => `<div class="ia-row">
        <label class="ia-on"><input type="checkbox" data-ia-on="${i}" ${g.on ? "checked" : ""}><span><b>${esc(g.kind === "notes" ? tr("ia.pages", "Pages as notes") : g.name)}</b><span class="sub">${esc((g.kind === "deck" ? tr("ia.k.deck", "Deck") : g.kind === "tasks" ? tr("ia.k.tasks", "Tasks") : tr("ia.k.notes", "Notes")) + " · " + kindW(g))}</span></span></label>
        ${coursesArr().length ? `<select data-ia-course="${i}" aria-label="${esc(tr("ia.courseFor", "Course for {name}", {name: g.name}))}">${opts(g.courseId)}</select>` : ""}
      </div>`;
    openSheet(`<div class="sheet ia-sheet">${head(title)}
      <div class="sheet-body">
        <p style="margin:0 0 4px;font-weight:600" id="iaSum">${esc(head1)}</p>
        ${warn.map(w => `<p class="mini" style="margin:2px 0">${esc(w)}</p>`).join("")}
        ${groups.length ? `<div class="ia-list">${groups.map(row).join("")}</div>` : ""}
        ${groups.length ? `<p class="mini" style="margin:8px 0 0">${esc(tr("ia.undo", "Everything comes in as one change, so one Undo takes it all back out."))}</p>` : ""}
        <p class="status-msg" id="iaMsg" aria-live="polite" style="margin:6px 0 0"></p>
      </div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="ia-open">${esc(tr("ia.back", "Back"))}</button><span class="spacer"></span><button type="button" class="btn" data-act="close">${esc(tr("ia.cancel", "Cancel"))}</button>${groups.length ? `<button type="button" class="btn primary" data-act="ia-go" id="iaGo">${esc(tr("ia.import", "Import"))}</button>` : ""}</div></div>`);
    const mine = PV;
    sheetKeep(IKEY, {name: title, dirty: () => mine.groups.length > 0, resume: () => { PV = mine; }});
    dlg.querySelectorAll("[data-ia-on]").forEach(cb => cb.addEventListener("change", () => { PV.groups[+cb.dataset.iaOn].on = cb.checked; const g = $("#iaGo"); if (g) g.disabled = !PV.groups.some(x => x.on); }));

    dlg.querySelectorAll("[data-ia-course]").forEach(s => s.addEventListener("change", () => { PV.groups[+s.dataset.iaCourse].courseId = s.value; }));
  }
  const matchCourseFor = (name, courses) => IA.matchCourse(name, courses);

  // The whole import as one applyChanges
  function commit(){
    if (!PV) return;
    const now = Date.now(), changes = [], made = {deck: 0, card: 0, task: 0, note: 0}, ids = new Set();
    const fresh = () => { let id; do id = uid(); while (ids.has(id)); ids.add(id); return id; };
    let firstDeck = "";
    PV.groups.filter(g => g.on).forEach((g, gi) => {
      if (g.kind === "deck") {
        const d = normDeck({id: fresh(), created: now + gi, updated: now, name: g.name, courseId: g.courseId || "", cards: g.items.map(c => Object.assign({id: fresh()}, c))});
        changes.push({kind: "deck", id: d.id, after: d}); made.deck++; made.card += d.cards.length; if (!firstDeck) firstDeck = d.id;
      } else if (g.kind === "tasks") {
        g.items.forEach((x, i) => {
          const t = newTask({title: x.title, courseId: g.courseId || "", type: "Other", due: x.due || "", start: x.start || "", time: x.due ? x.time || "" : "", priority: x.priority || "med", notes: clipNotes(x.notes),
            checklist: (x.checklist || []).map(s => ({id: fresh(), text: s, done: false}))});
          t.order += i; t.id = fresh();
          changes.push({kind: "task", id: t.id, after: t}); made.task++;
        });
      } else if (g.kind === "notes") {
        const live = notesArr().filter(n => !n.archived && !noteBoardOf(n));
        const top = live.reduce((m, n) => Math.max(m, (n.y || 0) + 280), 40);
        let z = notesArr().reduce((m, n) => Math.max(m, n.z || 0), 0);
        g.items.forEach((p, i) => {
          const n = normNote({id: fresh(), text: p.text, color: "yellow", x: 40 + (i % 4) * (NOTE_W() + 24), y: top + Math.floor(i / 4) * 300, z: ++z, rot: 0, courseId: g.courseId || "", board: "", created: now + i});
          changes.push({kind: "note", id: n.id, after: n}); made.note++;
        });
      }
    });
    if (!changes.length) return;
    try {
      const have = (localStorage.getItem(LS2) || "").length, adding = JSON.stringify(changes.map(c => c.after)).length;
      if (!spillOk() && have + adding > 4.6e6) { const m = $("#iaMsg"); if (m) m.textContent = tr("ia.err.space", "That's more than Studyboard can keep on this device at once. Untick a few decks and import the rest afterwards."); return; }
    } catch (e) { }
    const what = [made.deck ? decksW(made.deck) + " (" + cardsW(made.card) + ")" : "", made.task ? tasksW(made.task) : "", made.note ? notesW(made.note) : ""].filter(Boolean).join(", ");
    dlg.close();
    const tab = made.deck ? "flashcards" : made.task ? "board" : "notes";
    ui.tab = tab; if (tab === "flashcards") { ui.fc = null; ui.deckId = made.deck === 1 ? firstDeck : null; }
    if (tab === "notes") ui.noteBoard = "";
    applyChanges(changes, tr("ia.done", "Imported {what}", {what}));
    PV = null;
    window.scrollTo(0, 0);
  }
  const clipNotes = s => { s = String(s || ""); return s.length > 5000 ? s.slice(0, 4999) + "…" : s; };

  // Quizlet has no file
  function quizlet(){
    const cur = ui.deckId && state.decks[ui.deckId];
    if (cur) { bulkSheet(cur); return; }
    const d = normDeck({id: uid(), created: Date.now(), name: tr("ia.qz.name", "Quizlet Set"), courseId: ui.filter && ui.filter !== "all" ? ui.filter : ""});
    ui.tab = "flashcards"; ui.fc = null; ui.deckId = d.id;
    saveDeck(d, tr("ia.qz.made", "Made a new deck for your Quizlet set. Rename it with Edit Deck."));
    bulkSheet(state.decks[d.id]);
  }

  const css = document.createElement("style");
  css.textContent = `.ia-apps button .sub{white-space:normal}
.ia-drop{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;margin-top:12px;padding:16px 12px;border:2px dashed var(--line);border-radius:14px;color:var(--muted);text-align:center;font-size:.9rem}
.ia-list{display:flex;flex-direction:column;margin-top:10px;border-top:1px solid var(--line)}
.ia-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;padding:10px 2px;border-bottom:1px solid var(--line)}
.ia-on{display:flex;align-items:flex-start;gap:10px;flex:1 1 200px;min-width:0;cursor:pointer}
.ia-on input{margin-top:3px;flex:none}
.ia-on b{display:block;overflow-wrap:anywhere}
.ia-on .sub{display:block;color:var(--muted);font-size:.85rem}
.ia-row select{flex:0 1 180px;min-width:0;max-width:100%}
@media (max-width:480px){.ia-row select{flex:1 1 100%}}`;
  document.head.appendChild(css);

  hook("act", a => {
    if (a === "ia-open") { open(); return true; }
    if (a === "ia-pick") { const i = $("#iaFile"); if (i) i.click(); else open(); return true; }
    if (a === "ia-quizlet") { quizlet(); return true; }
    if (a === "ia-go") { commit(); return true; }
    return false;
  });
  window.SBIMPORT = {open, readFile, preview: () => PV, IA, state: () => state};
})();

