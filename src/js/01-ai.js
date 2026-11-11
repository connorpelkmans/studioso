/* ===== module: 01-ai.js: the app's core, AI: providers, keys, consent, study sets, quizzes, syllabus reading, settings ===== */
/* AI: Google Gemini (free) by default, or paid Gemini, Claude or ChatGPT with your own key */
const AI_ICON = '<svg class="ai-ic" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M11 2.5l1.6 4.4a3 3 0 0 0 1.8 1.8L18.8 10.3l-4.4 1.6a3 3 0 0 0-1.8 1.8L11 18.1l-1.6-4.4a3 3 0 0 0-1.8-1.8L3.2 10.3l4.4-1.6a3 3 0 0 0 1.8-1.8z"/><path d="M18.5 14.5l.8 2.1a1.5 1.5 0 0 0 .9.9l2.1.8-2.1.8a1.5 1.5 0 0 0-.9.9l-.8 2.1-.8-2.1a1.5 1.5 0 0 0-.9-.9l-2.1-.8 2.1-.8a1.5 1.5 0 0 0 .9-.9z"/></svg>';
// 1.11.1: with a study companion out, AI work is presented as the companion's
const aiWho = (fb) => { try { const n = window.SBCOMP && SBCOMP.aiName ? SBCOMP.aiName() : ""; return n || fb || ""; } catch(e) { return fb || ""; } };
// Free Gemini models, best first
const AI_MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
// Paid Gemini models (billing needed)
const AI_PRO_MODELS = ["gemini-3.1-pro-preview"];
/* Task routing: every AI call names its job and the job decides which models are tried */
const AI_TIERS = {
  reason: ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"],
  mid: ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"],
  lite: ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.8-flash"]
};
const AI_TASKS = {
  ask: ["reason", "high"], tutor: ["reason", "medium"], cards: ["reason", "medium"], quiz: ["reason", "medium"], cases: ["reason", "medium"],
  syllabus: ["reason", "medium"], examplan: ["reason", "medium"], plan: ["mid", "medium"], practice: ["reason", "medium"], rubric: ["reason", "medium"],
  transcribe: ["lite", "low"], ocr: ["lite", "low"],
  topics: ["mid", "medium"], explain: ["mid", "medium"], summary: ["mid", "medium"], chat: ["mid", "medium"], linknotes: ["mid", "low"], "cards-light": ["mid", "low"], "quiz-light": ["mid", "low"], "cases-light": ["mid", "low"], photo: ["mid", "medium"], capture: ["mid", "low"], tune: ["mid", "low"], estimate: ["mid", "low"], breakdown: ["mid", "high"],
  school: ["mid", "low"], quickadd: ["lite", "low"], grade: ["lite", "low"], news: ["lite", "low"], triage: ["lite", "low"], annintel: ["lite", "low"], coach: ["mid", "low"], weekly: ["mid", "low"], remote: ["lite", "low"], classify: ["lite", "low"], tag: ["lite", "low"], rewrite: ["lite", "low"], ping: ["lite", "low"],
  assist: ["mid", "medium"], mathread: ["mid", "low"], describe: ["lite", "low"]
};
const aiTask = (task, fast) => { const t = AI_TASKS[task]; return t ? {tier: t[0], think: t[1], task} : fast ? {tier: "lite", think: "low", task: ""} : {tier: "mid", think: "medium", task: ""}; };
const AI_PROVIDERS = {
  gemini: {label: "Google Gemini", short: "Gemini", keyLabel: "Gemini API Key", keyUrl: "https://aistudio.google.com/apikey", keyHint: "Free from Google AI Studio",
    models: [["auto", "Gemini Auto (free, recommended)", "free"], ["gemini-3.8-flash", "Gemini 3.8 Flash (free)", "free"], ["gemini-3.7-flash", "Gemini 3.7 Flash (free)", "free"], ["gemini-3.6-flash", "Gemini 3.6 Flash (free)", "free"], ["gemini-3.5-flash", "Gemini 3.5 Flash (free)", "free"], ["gemini-3.5-flash-lite", "Gemini 3.5 Flash-Lite (free, fastest)", "free"], ["gemini-3.1-pro-preview", "Gemini 3.1 Pro (paid, needs billing)", "paid"], ["auto-pro", "Gemini, Smartest First (Pro for hard jobs, paid, needs billing)", "paid"]]},
  anthropic: {label: "Anthropic Claude", short: "Claude", keyLabel: "Claude API Key", keyUrl: "https://console.anthropic.com/settings/keys", keyHint: "Paid, billed per use by Anthropic",
    // Claude runs only as Studyboard AI does: Haiku 5.5, thinking matched to each job, with its limits (src/js/01-ai-policy.js)
    models: [["studyboard", "Claude Haiku 5.5, Studyboard AI Mode (paid)", "paid"]]},
  openai: {label: "OpenAI ChatGPT", short: "ChatGPT", keyLabel: "OpenAI API Key", keyUrl: "https://platform.openai.com/api-keys", keyHint: "Paid, billed per use by OpenAI",
    models: [["gpt-6-sol", "GPT-6 Sol (paid)", "paid"], ["gpt-6-luna", "GPT-6 Luna (paid, cheapest)", "paid"], ["gpt-6-astra", "GPT-6 Astra (paid, most capable)", "paid"]]}
};
const AI_LIMIT_BYTES = 18 * 1024 * 1024;
/* Where AI keys are kept On this device only, never in the settings that sync to the account */
const AI_KEYS_LS = "studyboard:aiKeys", AI_SECRET = "ai-keys";
let aiLocalKeys = (() => { try { const k = JSON.parse(localStorage.getItem(AI_KEYS_LS) || "null"); return k && typeof k === "object" && !Array.isArray(k) ? k : {}; } catch(e) { return {}; } })();
let aiKeychain = false;
// The system keychain
const AI_SECRETS = (DESK && DESK.secrets) || window.StudyboardSecrets || null;
// Other device-only secrets (a Canvas access token)
const DEVSECRET = (() => {
  const DB = "studyboard-secrets", NAME = /^[a-z0-9-]{1,40}$/;
  let chain = null;
  const useChain = () => chain || (chain = (async () => { try { return !!(AI_SECRETS && await AI_SECRETS.available()); } catch (e) { return false; } })());
  const db = () => new Promise((res, rej) => { try { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore("s"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } });
  const tx = async (mode, fn) => { const d = await db(); try { return await new Promise((res, rej) => { const t = d.transaction("s", mode), st = t.objectStore("s"), out = fn(st); t.oncomplete = () => res(out && "result" in out ? out.result : undefined); t.onerror = t.onabort = () => rej(t.error); }); } finally { d.close(); } };
  async function key(){
    let k = await tx("readonly", st => st.get("_key"));
    if (!k) { k = await crypto.subtle.generateKey({name: "AES-GCM", length: 256}, false, ["encrypt", "decrypt"]); await tx("readwrite", st => st.put(k, "_key")); k = await tx("readonly", st => st.get("_key")); }
    return k;
  }
  const enc = new TextEncoder(), dec = new TextDecoder();
  return {
    async get(name){
      if (!NAME.test(name)) return null;
      if (await useChain()) { try { return (await AI_SECRETS.get(name)) || null; } catch (e) { return null; } }
      try { const box = await tx("readonly", st => st.get(name)); if (!box || !box.iv || !box.ct) return null; return dec.decode(await crypto.subtle.decrypt({name: "AES-GCM", iv: box.iv}, await key(), box.ct)); } catch (e) { return null; }
    },
    async set(name, value){
      if (!NAME.test(name)) return false;
      if (await useChain()) { try { if (await AI_SECRETS.set(name, String(value))) return true; } catch (e) {} }
      try { const iv = crypto.getRandomValues(new Uint8Array(12)), ct = new Uint8Array(await crypto.subtle.encrypt({name: "AES-GCM", iv}, await key(), enc.encode(String(value)))); await tx("readwrite", st => st.put({iv, ct, at: Date.now()}, name)); return true; } catch (e) { return false; }
    },
    async remove(name){
      if (!NAME.test(name)) return;
      try { if (AI_SECRETS) await AI_SECRETS.remove(name); } catch (e) {}
      try { await tx("readwrite", st => st.delete(name)); } catch (e) {}
    },
    async wipe(names){ for (const n of names || []) await this.remove(n); try { await new Promise(ok => { const r = indexedDB.deleteDatabase(DB); r.onsuccess = r.onerror = r.onblocked = () => ok(); }); } catch (e) {} }
  };
})();
function aiKeysPersist(){
  const has = Object.values(aiLocalKeys).some(Boolean);
  if (aiKeychain && AI_SECRETS) {
    Promise.resolve(AI_SECRETS[has ? "set" : "remove"](AI_SECRET, JSON.stringify(aiLocalKeys))).catch(() => {});
    try { localStorage.removeItem(AI_KEYS_LS); } catch(e) {}
  } else { try { if (has) localStorage.setItem(AI_KEYS_LS, JSON.stringify(aiLocalKeys)); else localStorage.removeItem(AI_KEYS_LS); } catch(e) {} }
}
function aiKeysSetLocal(keys){ aiLocalKeys = {}; Object.entries(keys || {}).forEach(([p, k]) => { if (k && AI_PROVIDERS[p]) aiLocalKeys[p] = String(k); }); aiKeysPersist(); }
// Sign-out, "Turn Off" and switching servers
const AI_PREFS_LS = "studyboard:aiPrefs";
function aiWipeLocal(keepKeys){
  if (keepKeys) {
    try {
      const ai = state.settings && state.settings.ai;
      if (ai && typeof ai === "object") { const p = Object.assign({}, ai); delete p.keys; delete p.key; localStorage.setItem(AI_PREFS_LS, JSON.stringify(p)); }
      localStorage.removeItem(AI_MEM);
    } catch(e) {}
    return;
  }
  try { localStorage.removeItem(AI_PREFS_LS); } catch(e) {}
  aiLocalKeys = {};
  try { localStorage.removeItem(AI_KEYS_LS); localStorage.removeItem(AI_CONSENT_LS); localStorage.removeItem(AI_MEM); } catch(e) {}
  try { if (AI_SECRETS) Promise.resolve(AI_SECRETS.remove(AI_SECRET)).catch(() => {}); } catch(e) {}
}
if (AI_SECRETS) (async () => {
  try {
    if (!(await AI_SECRETS.available())) return;
    aiKeychain = true;
    const raw = await AI_SECRETS.get(AI_SECRET);
    if (raw) aiLocalKeys = Object.assign({}, JSON.parse(raw), aiLocalKeys);
    if (localStorage.getItem(AI_KEYS_LS)) aiKeysPersist();
    scheduleRender();
  } catch(e) {}
})();

/*QR-START*/
/* QR codes */
const QR = (() => {
  const M = [null, [10, 1, 16, 0, 0], [16, 1, 28, 0, 0], [26, 1, 44, 0, 0], [18, 2, 32, 0, 0], [24, 2, 43, 0, 0], [16, 4, 27, 0, 0], [18, 4, 31, 0, 0],
    [22, 2, 38, 2, 39], [22, 3, 36, 2, 37], [26, 4, 43, 1, 44]];
  const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
  const gmul = (x, y) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 255; };
  function rsDivisor(deg){ const r = new Array(deg).fill(0); r[deg - 1] = 1; let root = 1;
    for (let i = 0; i < deg; i++) { for (let j = 0; j < deg; j++) { r[j] = gmul(r[j], root); if (j + 1 < deg) r[j] ^= r[j + 1]; } root = gmul(root, 2); } return r; }
  function rsRemainder(data, div){ const r = new Array(div.length).fill(0);
    for (const b of data) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= gmul(c, f); }); } return r; }
  const dataCap = v => { const t = M[v]; return t[1] * t[2] + t[3] * t[4]; };
  function encode(text, forceMask){
    const bytes = [...new TextEncoder().encode(String(text))];
    let v = 1; while (v <= 10 && 4 + (v < 10 ? 8 : 16) + bytes.length * 8 > dataCap(v) * 8) v++;
    if (v > 10) return null;
    const bits = [], put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
    const capBits = dataCap(v) * 8;
    put(0, Math.min(4, capBits - bits.length)); put(0, (8 - bits.length % 8) % 8);
    for (let p = 0xEC; bits.length < capBits; p ^= 0xEC ^ 0x11) put(p, 8);
    const data = []; for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(""), 2));
    const [ecLen, n1, d1, n2, d2] = M[v], div = rsDivisor(ecLen), blocks = [];
    let k = 0; for (let b = 0; b < n1 + n2; b++) { const len = b < n1 ? d1 : d2, d = data.slice(k, k + len); k += len; blocks.push({d, e: rsRemainder(d, div)}); }
    const all = [];
    for (let i = 0; i < Math.max(d1, d2); i++) blocks.forEach(b => { if (i < b.d.length) all.push(b.d[i]); });
    for (let i = 0; i < ecLen; i++) blocks.forEach(b => all.push(b.e[i]));
    const size = v * 4 + 17, mod = [], fn = [];
    for (let y = 0; y < size; y++) { mod.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    const setF = (x, y, d) => { mod[y][x] = d; fn[y][x] = true; };
    for (let i = 0; i < size; i++) { setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(([cx, cy]) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx, y = cy + dy, dist = Math.max(Math.abs(dx), Math.abs(dy)); if (x >= 0 && x < size && y >= 0 && y < size) setF(x, y, dist !== 2 && dist !== 4); } });
    const al = ALIGN[v], last = al.length - 1;
    al.forEach((ay, i) => al.forEach((ax, j) => { if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setF(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }));
    const format = mask => { const d = mask; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537); const f = ((d << 10) | r) ^ 0x5412, bit = i => ((f >>> i) & 1) === 1;
      for (let i = 0; i <= 5; i++) setF(8, i, bit(i));
      setF(8, 7, bit(6)); setF(8, 8, bit(7)); setF(7, 8, bit(8));
      for (let i = 9; i < 15; i++) setF(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i++) setF(size - 1 - i, 8, bit(i));
      for (let i = 8; i < 15; i++) setF(8, size - 15 + i, bit(i));
      setF(8, size - 8, true); };
    format(0);
    if (v >= 7) { let r = v; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25); const f = (v << 12) | r;
      for (let i = 0; i < 18; i++) { const d = ((f >>> i) & 1) === 1, a = size - 11 + i % 3, b = Math.floor(i / 3); setF(a, b, d); setF(b, a, d); } }
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) { if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) { const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if (!fn[y][x] && i < all.length * 8) { mod[y][x] = ((all[i >>> 3] >>> (7 - (i & 7))) & 1) === 1; i++; } } }
    const MASKS = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, x => x % 3 === 0, (x, y) => (x + y) % 3 === 0, (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
      (x, y) => x * y % 2 + x * y % 3 === 0, (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
    const apply = m => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && MASKS[m](x, y)) mod[y][x] = !mod[y][x]; };
    const penalty = () => {
      let p = 0, dark = 0;
      const line = get => { let run = 1; for (let a = 1; a <= size; a++) { if (a < size && get(a) === get(a - 1)) run++; else { if (run >= 5) p += run - 2; run = 1; } }
        for (let a = 0; a + 10 < size; a++) { const s = []; for (let b = 0; b < 11; b++) s.push(get(a + b) ? 1 : 0); const t = s.join("");
          if (t === "10111010000" || t === "00001011101") p += 40; } };
      for (let y = 0; y < size; y++) line(x => mod[y][x]);
      for (let x = 0; x < size; x++) line(y => mod[y][x]);
      for (let y = 0; y + 1 < size; y++) for (let x = 0; x + 1 < size; x++) { const c = mod[y][x]; if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) p += 3; }
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (mod[y][x]) dark++;
      return p + Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
    };
    let mask = forceMask;
    if (!(mask >= 0 && mask <= 7)) { let best = Infinity; for (let m = 0; m < 8; m++) { apply(m); format(m); const pn = penalty(); if (pn < best) { best = pn; mask = m; } apply(m); } }
    apply(mask); format(mask);
    return {size, version: v, mask, dark: (x, y) => mod[y][x]};
  }
  function svg(text, label){
    const q = encode(text); if (!q) return "";
    const n = q.size + 8; let d = "";
    for (let y = 0; y < q.size; y++) for (let x = 0; x < q.size; x++) if (q.dark(x, y)) d += `M${x + 4} ${y + 4}h1v1h-1z`;
    return `<svg class="qr" viewBox="0 0 ${n} ${n}" role="img" aria-label="${String(label || "QR code").replace(/[<>&"]/g, "")}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }
  return {encode, svg};
})();
/*QR-END*/
/*KEYHO-START*/
/* Moving AI keys to another device */
const KEYHO = (() => {
  const ABC = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const fmt = c => c.slice(0, 4) + "-" + c.slice(4, 8) + "-" + c.slice(8, 12);
  const newCode = rand => fmt([...rand(12)].map(b => ABC[b & 31]).join(""));
  function normCode(s){
    const c = String(s || "").toUpperCase().replace(/[\s-]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
    return c.length === 12 && [...c].every(ch => ABC.includes(ch)) ? fmt(c) : "";
  }
  const GEMINI_RE = /AIza[0-9A-Za-z_-]{35}(?![0-9A-Za-z_-])/;
  const geminiKeyIn = text => { const m = String(text || "").match(GEMINI_RE); return m ? m[0] : ""; };
  function codeIn(text){
    const t = String(text || "").trim().slice(0, 600);
    const m = t.match(/[#&?]sbkey=([0-9A-Za-z-]{12,16})/); if (m) return normCode(m[1]);
    return /^[0-9A-Za-z]{4}[\s-]?[0-9A-Za-z]{4}[\s-]?[0-9A-Za-z]{4}$/.test(t) ? normCode(t) : "";
  }
  const KEY_RE = {gemini: /^[\w.-]{20,300}$/, anthropic: /^sk-ant-[\w-]{20,300}$/, openai: /^sk-[\w-]{20,300}$/};
  function cleanKeys(o){ const out = {}; if (o && typeof o === "object") Object.keys(KEY_RE).forEach(p => { const k = typeof o[p] === "string" ? o[p].trim() : ""; if (k && KEY_RE[p].test(k)) out[p] = k; }); return out; }
  const b64u = u8 => { let s = ""; u8.forEach(b => { s += String.fromCharCode(b); }); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  const unb64u = s => Uint8Array.from(atob(String(s).replace(/-/g, "+").replace(/_/g, "/")), ch => ch.charCodeAt(0));
  const hex = u8 => [...u8].map(b => b.toString(16).padStart(2, "0")).join("");
  const ITER = 150000, SALT = "studyboard-key-handoff-v1";
  async function derive(code, subtle){
    const c = normCode(code); if (!c) throw new Error("bad code");
    const te = new TextEncoder(), base = await subtle.importKey("raw", te.encode(c), "PBKDF2", false, ["deriveBits"]);
    const bits = new Uint8Array(await subtle.deriveBits({name: "PBKDF2", hash: "SHA-256", salt: te.encode(SALT), iterations: ITER}, base, 512));
    return {id: hex(bits.slice(32)), key: await subtle.importKey("raw", bits.slice(0, 32), "AES-GCM", false, ["encrypt", "decrypt"])};
  }
  async function seal(key, payload, subtle, rand){
    const iv = rand(12), ct = new Uint8Array(await subtle.encrypt({name: "AES-GCM", iv}, key, new TextEncoder().encode(JSON.stringify(payload))));
    const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12); return b64u(out);
  }
  async function open(key, box, subtle){
    const u8 = unb64u(box); if (u8.length < 29) throw new Error("bad box");
    return JSON.parse(new TextDecoder().decode(await subtle.decrypt({name: "AES-GCM", iv: u8.slice(0, 12)}, key, u8.slice(12))));
  }
  return {newCode, normCode, geminiKeyIn, codeIn, cleanKeys, derive, seal, open, TTL_MIN: 10};
})();
/*KEYHO-END*/
// The key relay
const KEY_RELAY = "https://studyboard-key-relay.connor-pelkmans.workers.dev";
// Email to Studyboard (Pro)
const CAPTURE_EMAIL_DOMAIN = "";
// The signed-in student's access token, for Studyboard's own AI server
async function aiSessionToken(){ try { const {data} = await sb.auth.getSession(); return (data && data.session && data.session.access_token) || ""; } catch(e) { return ""; } }
/* Studyboard AI, included with Pro: cloudflare/ai-pro, a Worker that holds Studyboard's Anthropic key (Claude Haiku 5.5).
   The server checks the plan and keeps each student's allowance; this only shows what it last said. Until the Worker is deployed
   (cloudflare/ai-pro/README.md) the address doesn't answer and the app carries on without it; "" switches it off in the app. */
const AI_PRO = "https://ai.studyboardapp.com";
const AI_PRO_LS = "studyboard:aiPro";
function aiProGet(){ try { const t = JSON.parse(localStorage.getItem(AI_PRO_LS) || "null"); return t && sbUser && t.uid === sbUser.id ? t : null; } catch(e) { return null; } }
function aiProSet(j){
  if (!sbUser || !j || typeof j !== "object") return;
  const prev = aiProGet() || {}, today = new Date().toISOString().slice(0, 10);
  const on = j.on === false ? false : j.on === true ? true : !!prev.on;
  const next = {uid: sbUser.id, on, tier: j.tier || prev.tier || "", usedPct: typeof j.usedPct === "number" ? j.usedPct : prev.usedPct || 0, soft: typeof j.soft === "boolean" ? j.soft : !!prev.soft,
    resets: j.resets !== undefined ? j.resets : prev.resets || null, transcribe: typeof j.transcribe === "boolean" ? j.transcribe : !!prev.transcribe, youtube: typeof j.youtube === "boolean" ? j.youtube : !!prev.youtube, at: Date.now(),
    // today's share, as a percentage (the server's day is UTC); kept only for the day it was read
    dayPct: typeof j.dayPct === "number" ? j.dayPct : prev.dayDay === today ? prev.dayPct : undefined, dayDay: typeof j.dayPct === "number" ? today : prev.dayDay === today ? today : "",
    youtubeLeft: typeof j.youtubeLeft === "number" ? j.youtubeLeft : prev.youtubeLeft, youtubeMonthly: typeof j.youtubeMonthly === "number" ? j.youtubeMonthly : prev.youtubeMonthly,
    // Out of today's allowance: the student's own key covers the rest of the day
    outDay: j.error === "today" ? today : prev.outDay === today ? today : ""};
  try { localStorage.setItem(AI_PRO_LS, JSON.stringify(next)); } catch(e) {}
}
const aiProUsedUp = () => { const t = aiProGet(); return !!t && (t.usedPct >= 100 || t.outDay === new Date().toISOString().slice(0, 10)); };
// The student's own key to fall back on when Studyboard AI runs out: Gemini first, then any other key they added
const aiProBackup = keys => keys.gemini ? "gemini" : keys.anthropic ? "anthropic" : keys.openai ? "openai" : "";
// The student turned it off to use their own key instead (Settings, AI Features)
const aiProDeclined = () => { try { return !!((state.settings && state.settings.ai) || {}).ownKey; } catch(e) { return false; } };
let aiProChecking = null, aiProTried = 0;
function aiProAvail(){
  if (!AI_PRO || !sbUser || sbUser.is_anonymous || inPreview()) return false;
  const t = aiProGet();
  // Checked again in the background every half hour, so a new or ended plan shows up; when it doesn't answer, tried again after 10 minutes
  if ((!t || Date.now() - (t.at || 0) > 30 * 60000) && !aiProChecking && Date.now() - aiProTried > 10 * 60000) aiProRefresh().then(() => { try { scheduleRender(); } catch(e) {} });
  return !!(t && t.on);
}
// A Pro student: everything Studyboard AI runs (the built-in AI, or their own Claude key in its mode) is shown only as "Studyboard AI" (a paid plan only counts with the paywall on: with it off, PLAN.isPro() is true for everyone)
function aiProUser(){ try { return aiProAvail() || (typeof PLAN !== "undefined" && !!PLAN && PLAN.paywall() && PLAN.isPro()); } catch(e) { return false; } }
// What to call a Claude key's AI on screen: "Studyboard AI" for Pro students, "Claude" otherwise
const aiClaudeName = () => aiProUser() ? "Studyboard AI" : "Claude";
async function aiProRefresh(){
  if (!AI_PRO || !sbUser || sbUser.is_anonymous) return null;
  if (aiProChecking) return aiProChecking;
  aiProTried = Date.now();
  aiProChecking = (async () => {
    const tok = await aiSessionToken(); if (!tok) return null;
    try { const res = await fetchT(`${AI_PRO}/v1/status`, {headers: {Authorization: "Bearer " + tok}, cache: "no-store"}, 15000); if (!res.ok && res.status !== 200) return null; const j = await res.json(); aiProSet(j); return j; } catch(e) { return null; }
  })();
  try { return await aiProChecking; } finally { aiProChecking = null; }
}
// Delete My Account
async function aiProForget(){
  if (!AI_PRO || !sbUser) return;
  const tok = await aiSessionToken(); if (!tok) return;
  try { await fetchT(`${AI_PRO}/v1/me`, {method: "DELETE", headers: {Authorization: "Bearer " + tok}, cache: "no-store"}, 8000); } catch(e) {}
  try { localStorage.removeItem(AI_PRO_LS); } catch(e) {}
}
// Test handle (only when a test page sets window.__SB_TEST)
if (window.__SB_TEST) window.__sbAi = {cfg: () => aiCfg(), proRefresh: () => aiProRefresh(), proGet: () => aiProGet(), useOwnMode: () => aiSaveCfg({provider: "anthropic", model: "studyboard"})};
// Studyboard AI's rules (src/js/01-ai-policy.js): the built-in AI, or a student's own Claude key in Studyboard AI Mode
const aiSbMode = c => !!c && (c.provider === "studyboard" || (c.provider === "anthropic" && c.model === "studyboard"));
/* A student's own Claude key in Studyboard AI Mode: the same rules as the built-in AI (SBPOLICY.runJob: model, thinking per job,
   output caps, the same weekly, daily, per-minute and at-once limits), run on this device and paid by their key. The allowance
   is kept on this device, one change at a time across tabs. */
const AI_OWN_LS = "studyboard:ownAI";
const ownStore = {
  all(){ try { const o = JSON.parse(localStorage.getItem(AI_OWN_LS) || "{}"); return o && typeof o === "object" ? o : {}; } catch(e) { return {}; } },
  async get(k){ return this.all()[k]; },
  async put(k, v){ const o = this.all(); if (k && typeof k === "object") Object.assign(o, k); else o[k] = v; try { localStorage.setItem(AI_OWN_LS, JSON.stringify(o)); } catch(e) {} },
  async deleteAll(){ try { localStorage.removeItem(AI_OWN_LS); } catch(e) {} }
};
const ownLock = typeof navigator !== "undefined" && navigator.locks && navigator.locks.request ? fn => navigator.locks.request("studyboard-own-ai", () => fn()) : null;
let OWN_METER = null;
// Jobs in flight belong to this page; each open page checks in every 20 seconds, so jobs left behind by a page that was
// closed or reloaded stop counting as in flight straight away (they used to block new ones for 15 minutes)
const OWN_SID = Math.random().toString(36).slice(2, 12), OWN_LIVE = "studyboard:aiOwnLive";
const ownBeats = () => { try { const o = JSON.parse(localStorage.getItem(OWN_LIVE) || "{}"); return o && typeof o === "object" ? o : {}; } catch(e) { return {}; } };
function ownBeat(){ try { const o = ownBeats(), now = Date.now(); o[OWN_SID] = now; Object.keys(o).forEach(k => { if (now - o[k] > 120000) delete o[k]; }); localStorage.setItem(OWN_LIVE, JSON.stringify(o)); } catch(e) {} }
const ownAlive = sid => sid === OWN_SID || (!!sid && Date.now() - (ownBeats()[sid] || 0) < 60000);
const ownMeter = () => { if (!OWN_METER) { ownBeat(); setInterval(ownBeat, 20000); OWN_METER = new SBPOLICY.Meter(ownStore, () => Date.now(), ownLock, {sid: OWN_SID, alive: ownAlive}); } return OWN_METER; };
const ownLimits = () => SBPOLICY.limits({});
// Claude straight from this device with the student's key, in the shape SBPOLICY.runJob expects (errors carry their status)
function ownClaude(key, signal, ms){
  const call = async (path, body, beta) => {
    const hdr = {"content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true"};
    if (beta) hdr["anthropic-beta"] = beta;
    let res;
    try { res = await fetchT("https://api.anthropic.com" + path, {method: "POST", headers: hdr, body: JSON.stringify(body)}, ms, signal); }
    catch (e) { throw Object.assign(new Error(signal && signal.aborted ? "cancelled" : "offline"), {net: true, aborted: !!(signal && signal.aborted)}); }
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error((j && j.error && j.error.message) || "error " + res.status), {status: res.status});
    return j;
  };
  return {
    create: req => call("/v1/messages", req, (req.tools || []).some(t => t.name === "web_fetch") ? "web-fetch-2025-09-10" : ""),
    count: async req => { const rest = Object.assign({}, req); delete rest.max_tokens; return (await call("/v1/messages/count_tokens", rest)).input_tokens; }
  };
}
const ownView = () => { try { const r = ownStore.all(), L = ownLimits(), m = SBPOLICY.weekOf(Date.now()), spent = r.month === m ? r.spent || 0 : 0; return {usedPct: Math.min(100, Math.round(spent / L.monthMicro * 100)), soft: spent >= L.softMicro, resets: SBPOLICY.nextWeek(Date.now())}; } catch(e) { return {usedPct: 0, soft: false, resets: null}; } };
// "Resets on December 1"
const aiProResets = () => { const t = aiProGet(); if (!t || !t.resets) return ""; try { return new Date(t.resets).toLocaleDateString(undefined, {month: "long", day: "numeric", timeZone: "UTC"}); } catch(e) { return ""; } };
// A scanned code opens the app as <app>#sbkey=XXXX-XXXX-XXXX
const KEYHO_LINK = (() => {
  try {
    const m = location.hash.match(/(?:^#|&)sbkey=([0-9A-Za-z-]{12,16})/); if (!m) return "";
    history.replaceState(null, "", location.pathname + location.search);
    return KEYHO.normCode(m[1]);
  } catch (e) { return ""; }
})();

/* Consent before anything is sent to an AI company */
const AI_CONSENT_LS = "studyboard:aiConsent", AI_CONSENT_V = 1;
const AI_WHO = {
  gemini: {company: "Google", product: "Gemini", host: "generativelanguage.googleapis.com", policy: "https://policies.google.com/privacy"},
  anthropic: {company: "Anthropic", product: "Claude", host: "api.anthropic.com", policy: "https://www.anthropic.com/legal/privacy"},
  openai: {company: "OpenAI", product: "ChatGPT", host: "api.openai.com", policy: "https://openai.com/policies/privacy-policy"},
  studyboard: {company: "Anthropic", product: "Studyboard AI", host: (() => { try { return new URL(AI_PRO).host; } catch(e) { return "Studyboard's AI server"; } })(), policy: "https://www.anthropic.com/legal/privacy"},
};
const aiConsentMap = () => { try { const m = JSON.parse(localStorage.getItem(AI_CONSENT_LS) || "{}"); return m && typeof m === "object" && !Array.isArray(m) ? m : {}; } catch(e) { return {}; } };
const aiConsented = provider => ((aiConsentMap()[provider] || {}).v || 0) >= AI_CONSENT_V;
function aiConsentSet(provider){ try { const m = aiConsentMap(); m[provider] = {v: AI_CONSENT_V, at: Date.now()}; localStorage.setItem(AI_CONSENT_LS, JSON.stringify(m)); } catch(e) {} }
let aiAsking = null;
function aiConsentAsk(provider){
  const W = AI_WHO[provider]; if (!W) return Promise.resolve(false);
  if (aiConsented(provider)) return Promise.resolve(true);
  if (aiAsking && aiAsking.provider === provider) return aiAsking.promise;
  const d = document.createElement("dialog"); d.className = "ai-consent"; d.setAttribute("aria-labelledby", "aiConsentTitle");
  d.innerHTML = `<div class="sheet"><div class="sheet-head"><h2 id="aiConsentTitle">Send Your Content to ${esc(W.company)}?</h2></div>
    <div class="sheet-body">
      ${provider === "studyboard" ? `<p style="margin:0">Studyboard AI comes with your Pro plan. It runs on <b>Anthropic's Claude</b>. To answer, the content of each request goes from this device to Studyboard's AI server (<b>${esc(W.host)}</b>, run on Cloudflare), which passes it to Anthropic and sends the answer back. Studyboard's server doesn't store what you send or keep logs of it, and Anthropic doesn't use it to train its models.</p>`
        : `<p style="margin:0">Studyboard's AI features use <b>${esc(W.company)} ${esc(W.product)}</b> with the API key you added. To answer, they send the content of each request directly from this device to <b>${esc(W.host)}</b>. Studyboard's own servers are not involved.</p>`}
      <p style="margin:0"><b>What is sent:</b> what you type into an AI window, plus the material for that job, such as the task, note, flashcards, file, slides or photo you choose, and your course names, deadlines and progress when you ask about your schedule or plan. If Automatic AI is on, short summaries of your tasks and deadlines are also sent in the background.</p>
      <p style="margin:0"><b>What is not sent:</b> your Studyboard password, your email address, or anything when you aren't using an AI feature.</p>
      <p class="mini" style="margin:0">${esc(W.company)} handles it under its own terms and <a href="${esc(W.policy)}" target="_blank" rel="noopener noreferrer">privacy policy</a>${provider === "gemini" ? ". On Google's free tier, Google may use what you send to improve its products" : ""}. Don't send anything private, such as health records or other people's personal details. You can turn AI off at any time in Settings, AI Features.</p>
    </div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-no>Not Now</button><button type="button" class="btn primary" data-yes>I Agree, Use ${esc(W.product)}</button></div></div>`;
  let done;
  const promise = new Promise(res => { done = res; });
  const finish = ok => { if (!aiAsking || aiAsking.d !== d) return; if (ok) aiConsentSet(provider); aiAsking = null; try { d.close(); } catch(e) {} d.remove(); done(ok); if (ok) { try { scheduleRender(); } catch(e) {} } };
  d.addEventListener("cancel", e => { e.preventDefault(); finish(false); });
  d.querySelector("[data-yes]").addEventListener("click", () => finish(true));
  d.querySelector("[data-no]").addEventListener("click", () => finish(false));
  aiAsking = {provider, promise, d};
  document.body.appendChild(d); d.showModal();
  return promise;
}
// Keys an older version kept inside the settings
function aiAdoptLegacyKeys(){
  const raw = state.settings && state.settings.ai;
  if (!raw || typeof raw !== "object" || !((raw.keys && Object.values(raw.keys).some(Boolean)) || raw.key)) return;
  const legacy = Object.assign({}, raw.key ? {gemini: raw.key} : {}, raw.keys || {});
  aiKeysSetLocal(Object.assign({}, legacy, aiLocalKeys));
  const next = Object.assign({}, raw, {keys: {}}); delete next.key;
  state.settings = Object.assign({}, state.settings, {ai: next}); saveLocal();
}
// Keys are masked text boxes, not password fields, so browsers don't offer to save or update a password for them
const KEY_MASK = (() => { try { return CSS.supports("-webkit-text-security", "disc"); } catch (e) { return false; } })();
function aiCfg(){
  aiAdoptLegacyKeys();
  const raw = (state.settings && state.settings.ai) || {};
  const keys = Object.assign({gemini: "", anthropic: "", openai: ""}, raw.keys || {}, aiLocalKeys);
  if (raw.key && !keys.gemini) keys.gemini = raw.key;
  let provider = AI_PROVIDERS[raw.provider] ? raw.provider : "gemini";
  let model = raw.model || (provider === "gemini" ? "auto" : AI_PROVIDERS[provider].models[0][0]);
  if (!keys[provider]) { const p = ["gemini", "anthropic", "openai"].find(x => keys[x]); if (p) { provider = p; model = p === "gemini" ? "auto" : AI_PROVIDERS[p].models[0][0]; } }
  if (provider === "anthropic") model = "studyboard";
  // Studyboard AI (Pro) unless the student chose their own key; once this week's is used up, their own key takes over if they have one
  // Paid Pro: Studyboard AI first, always. The student's own key (Gemini first) only once this week's or today's allowance is used up.
  if (aiProAvail() && !raw.ownKey) {
    if (!aiProUsedUp()) return {provider: "studyboard", model: "studyboard", keys, key: "studyboard"};
    const b = aiProBackup(keys);
    if (b) return {provider: b, model: b === "gemini" ? (raw.provider === "gemini" && raw.model ? raw.model : "auto") : AI_PROVIDERS[b].models[0][0], keys, key: keys[b], backup: true};
    return {provider: "studyboard", model: "studyboard", keys, key: "studyboard"};
  }
  return {provider, model, keys, key: keys[provider]};
}
const aiReady = () => !inPreview() && !!aiCfg().key;
const aiErr = (code, message) => Object.assign(new Error(message), {code});
function aiModelName(provider, model){
  if (provider === "studyboard" || (provider === "anthropic" && aiProUser())) return "Studyboard AI";
  const P = AI_PROVIDERS[provider]; if (!P) return model;
  const m = P.models.find(x => x[0] === model);
  return m ? m[1].replace(/ \(.*$/, "").replace(/, Auto$/, "") : model;
}
// One model's label in a picker: a Claude key runs as Studyboard AI does, so for Pro students it's just "Studyboard AI"
const aiOptLabel = (p, m, l) => p === "anthropic" && m === "studyboard" && aiProUser() ? "Studyboard AI" : l;
/* The model choices for the keys given, grouped by company. For Pro students the Claude key's choice stands on its own as
   "Studyboard AI", with no company group around it. sel: the chosen "provider|model"; extra(p, P): more options for a group */
function aiModelOpts(keys, sel, extra){
  const pro = aiProUser();
  return Object.entries(AI_PROVIDERS).filter(([p]) => keys[p]).map(([p, P]) => {
    const opts = P.models.map(([m, l]) => `<option value="${p}|${esc(m)}" ${`${p}|${m}` === sel ? "selected" : ""}>${esc(aiOptLabel(p, m, l))}</option>`).join("") + (extra ? extra(p, P) : "");
    return p === "anthropic" && pro ? opts : `<optgroup label="${esc(P.label)}">${opts}</optgroup>`;
  }).join("");
}
function aiSaveCfg(patch){
  const c = aiCfg(), raw = (state.settings && state.settings.ai) || {};
  const next = {provider: patch.provider || c.provider, model: patch.model || c.model, keys: Object.assign({}, raw.keys || {}, patch.keys || {})};
  if (next.provider === "studyboard") { next.provider = raw.provider || "gemini"; next.model = raw.model || "auto"; }
  const own = patch.ownKey !== undefined ? patch.ownKey : raw.ownKey; if (own) next.ownKey = true;
  if (patch.provider && !patch.model) next.model = patch.provider === "gemini" ? "auto" : AI_PROVIDERS[patch.provider].models[0][0];
  state.settings = Object.assign({}, state.settings, {ai: next}); saveSettings();
}
function aiParseJson(text){
  if (!text) return null;
  let t = String(text).trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(t); } catch(e) {}
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch(e) {} }
  return aiRepairJson(t);
}
/* AI-QUALITY-START: pure helpers (no app globals) that check and repair what the AI sends back. Unit-tested in tests/ai-quality.test.js. */
// Cut-off or slightly broken JSON
function aiRepairJson(text){
  let t = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const st = t.search(/[\[{]/); if (st < 0) return null; t = t.slice(st);
  const stack = [], cuts = []; let inStr = false, esc = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") { stack.pop(); if (stack.length) cuts.push([i + 1, stack.slice()]); }
  }
  for (let k = cuts.length - 1; k >= Math.max(0, cuts.length - 60); k--) {
    const [pos, s] = cuts[k];
    try { return JSON.parse(t.slice(0, pos) + s.slice().reverse().map(c => c === "{" ? "}" : "]").join("")); } catch(e) {}
  }
  return null;
}
const AI_SUP = {"0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻", "n": "ⁿ"};
const AI_SUB = {"0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉", "+": "₊", "-": "₋"};
const AI_TEX = {rightarrow: "→", to: "→", leftarrow: "←", leftrightarrow: "↔", rightleftharpoons: "⇌", times: "×", cdot: "·", pm: "±", leq: "≤", geq: "≥", le: "≤", ge: "≥", neq: "≠", approx: "≈", degree: "°", circ: "°", Delta: "Δ", delta: "δ", alpha: "α", beta: "β", gamma: "γ", mu: "μ", lambda: "λ", sigma: "σ", pi: "π", theta: "θ", omega: "ω", Omega: "Ω", rho: "ρ", tau: "τ", infty: "∞", sum: "Σ", propto: "∝", uparrow: "↑", downarrow: "↓"};
// Cards and questions are shown as plain text, so strip markdown
function aiTidyText(s){
  s = String(s == null ? "" : s);
  s = s.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?(?:p|div|span|b|i|u|em|strong|li|ul|ol|sup|sub|code|pre|h[1-6]|table|tr|td|th)\b[^>]*>/gi, "")
    .replace(/```[a-z]*\n?/gi, "").replace(/\*\*([^*\n]+)\*\*/g, "$1").replace(/__([^_\n]+)__/g, "$1").replace(/`([^`\n]+)`/g, "$1").replace(/^\s{0,3}#{1,6}\s+/gm, "");
  s = s.replace(/\$\$?([^$\n]{1,240}?)\$\$?/g, (m, x) => /[\\^_{]/.test(x) ? x : m).replace(/\\[(\[]\s*/g, "").replace(/\s*\\[)\]]/g, "");
  for (let k = 0; k < 3; k++) s = s.replace(/\\(?:text|mathrm|mathbf|mathit|textbf|textit|operatorname)\{([^{}]*)\}/g, "$1").replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (m, a, b) => (/^[\w.]+$/.test(a) ? a : "(" + a + ")") + "/" + (/^[\w.]+$/.test(b) ? b : "(" + b + ")")).replace(/\\sqrt\{([^{}]*)\}/g, "√($1)");
  s = s.replace(/\\([A-Za-z]+)(\s?)/g, (m, w, sp) => AI_TEX[w] == null ? m : AI_TEX[w] + (/^(Delta|delta|alpha|beta|gamma|mu|lambda|sigma|pi|theta|omega|Omega|rho|tau)$/.test(w) ? "" : sp)).replace(/\\%/g, "%").replace(/\\([{}_&#$])/g, "$1");
  const map = (t, M) => { let o = ""; for (const c of t) { if (!M[c]) return null; o += M[c]; } return o; };
  s = s.replace(/\^\{?([0-9+\-n]{1,4})\}?/g, (m, x) => map(x, AI_SUP) || m).replace(/([A-Za-z)\]])_\{?([0-9+\-]{1,4})\}?/g, (m, a, x) => a + (map(x, AI_SUB) || "_" + x));
  return s.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
const AI_FILLER = new Set("what which who whom whose is are was were the a an of to in on for and or does do did define definition explain describe state name list give how why when this that these those with by as at from be it its into".split(" "));
function aiKeyTokens(s){ return [...new Set(String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9%.]+/g, " ").split(" ").map(w => w.replace(/^\.+|\.+$/g, "")).filter(w => w && !AI_FILLER.has(w)).map(w => w.length > 4 ? w.replace(/(ies|es|s)$/, "") : w))]; }
function aiJaccard(a, b){ if (!a.length || !b.length) return 0; const B = new Set(b); let n = 0; a.forEach(x => { if (B.has(x)) n++; }); return n / (a.length + b.length - n); }
// What the student's own material contains
function aiCorpus(texts){
  const t = texts.join("\n").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return {words: new Set(t.match(/[a-z]{5,}/g) || []), nums: new Set((t.replace(/(\d),(\d{3})/g, "$1$2").match(/\d+(?:\.\d+)?/g) || []))};
}
// A short reason when a card says something the material doesn't
function aiGroundNote(text, corpus){
  if (!corpus) return "";
  const t = String(text || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const nums = (t.replace(/(\d),(\d{3})/g, "$1$2").match(/\d+(?:\.\d+)?/g) || []).filter(n => n.length >= 2 || n.includes("."));
  const miss = nums.find(n => !corpus.nums.has(n));
  if (miss) return `The number ${miss} isn't in your material`;
  const words = [...new Set(t.match(/[a-z]{5,}/g) || [])];
  if (words.length >= 4 && words.filter(w => corpus.words.has(w) || corpus.words.has(w.replace(/(ies|es|s|ed|ing)$/, ""))).length / words.length < 0.4) return "Mostly not in your material";
  return "";
}
// Copy check: an item that repeats 8 or more words in a row from the student's material is copied, not restated
const AI_COPY_RUN = 8;
const aiCopyWords = t => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\u2018\u2019']/g, "").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
function aiCopyIndex(texts){
  const idx = new Set();
  (Array.isArray(texts) ? texts : [texts]).forEach(t => { const w = aiCopyWords(t); for (let i = 0; i + AI_COPY_RUN <= w.length; i++) idx.add(w.slice(i, i + AI_COPY_RUN).join(" ")); });
  return idx.size ? idx : null;
}
function aiCopied(text, idx){
  if (!idx) return false;
  const w = aiCopyWords(text);
  for (let i = 0; i + AI_COPY_RUN <= w.length; i++) if (idx.has(w.slice(i, i + AI_COPY_RUN).join(" "))) return true;
  return false;
}
// Cards copied word for word from a file (c.copied): AI writing from a deck must not repeat them either
const aiCopiedCardsIndex = cards => aiCopyIndex((cards || []).filter(c => c && c.copied).map(c => `${c.front || ""}\n${c.back || ""}`));
const aiDropCopiedQs = (qs, idx) => idx ? qs.filter(q => ![q.stem, q.answer, q.rationale].concat(q.options || [], q.notes || []).some(t => aiCopied(t, idx))) : qs;
// Flashcard quality gate
function aiGateCards(list, opts){
  opts = opts || {}; const max = opts.max > 0 ? opts.max : 60, seen = [], keys = new Set(), out = [], dropped = {dup: 0, long: 0, empty: 0, copied: 0};
  (Array.isArray(list) ? list : []).forEach(c => {
    if (!c || typeof c !== "object") { dropped.empty++; return; }
    const front = aiTidyText(c.front), back = aiTidyText(c.back), source = aiTidyText(c.source).slice(0, 60);
    const ft = aiKeyTokens(front), same = aiKeyTokens(front).join(" ") === aiKeyTokens(back).join(" ");
    if (front.length < 3 || !back || same) { dropped.empty++; return; }
    if (front.length > 300 || back.length > 700) { dropped.long++; return; }
    if (aiCopied(front, opts.copy) || aiCopied(back, opts.copy)) { dropped.copied++; return; }
    const key = ft.slice().sort().join(" ");
    if (keys.has(key) || seen.some(x => aiJaccard(ft, x.ft) >= 0.8 || (x.back === back.toLowerCase() && aiJaccard(ft, x.ft) >= 0.3))) { dropped.dup++; return; }
    keys.add(key); seen.push({ft, back: back.toLowerCase()});
    out.push({front, back, source, check: opts.corpus ? aiGroundNote(front + " " + back, opts.corpus) : ""});
  });
  return {cards: out.slice(0, max), dropped};
}
// Question gate (after aiCleanQuestions)
function aiGateQuestions(qs, opts){
  opts = opts || {}; const max = opts.max > 0 ? opts.max : 60, seen = [], out = []; let dup = 0, bad = 0, copied = 0;
  qs.forEach(q => {
    if ([q.stem, q.answer, q.rationale].concat(q.options || [], q.notes || []).some(t => aiCopied(t, opts.copy))) { copied++; return; }
    const st = aiKeyTokens(q.stem);
    const on = (q.options || []).map(o => aiKeyTokens(o).join(" ") || String(o).toLowerCase()), same = on.slice().sort().join("|") + "#" + (q.type === "short" ? aiKeyTokens(q.answer).join(" ") : q.correct.map(i => on[i]).sort().join(","));
    if (seen.some(x => aiJaccard(st, x.st) >= 0.75 || (same.length > 3 && x.same === same && aiJaccard(st, x.st) >= 0.45))) { dup++; return; }
    if (q.type !== "truefalse" && new Set(on).size !== on.length) { bad++; return; }
    seen.push({st, same});
    q.check = opts.corpus ? aiGroundNote(q.stem + " " + (q.type === "short" ? q.answer : q.correct.map(i => q.options[i]).join(" ")), opts.corpus) : "";
    out.push(q);
  });
  return {questions: out.slice(0, max), dropped: {dup, bad, copied}};
}
const aiDayNum = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5 : NaN; };
// Syllabus items
function aiGateSyllabus(items, today){
  const seen = new Set(), out = []; let dups = 0, fixed = 0;
  items.forEach(i => { const k = String(i.title).toLowerCase().replace(/[^a-z0-9]/g, "") + "|" + i.due; if (seen.has(k)) { dups++; return; } seen.add(k); out.push(i); });
  const days = out.map(i => aiDayNum(i.due)).filter(x => !isNaN(x)).sort((a, b) => a - b), now = aiDayNum(today);
  const med = days.length ? days[Math.floor(days.length / 2)] : now;
  out.forEach(i => {
    const d = aiDayNum(i.due);
    if (!isNaN(d) && (Math.abs(d - med) > 240 || d < now - 366 || d > now + 800)) { i.due = ""; i.source = "ai-low"; fixed++; }
    if (i.start && (isNaN(aiDayNum(i.start)) || (i.due && i.start > i.due))) i.start = "";
  });
  return {items: out, dups, fixed};
}
// Answers cite sources like [2]
function aiCleanCites(text, n){ return String(text || "").replace(/\s?\[(\d{1,2})\]/g, (m, k) => Number(k) >= 1 && Number(k) <= n ? m : "").trim(); }
// Quick add: true when reading the sentence on this device is enough
function qaConfident(text, t){
  const s = String(text || "");
  if (s.length > 140 || /[;\n]|\balso\b|\bthen\b|\band\b.*\b(due|by|on)\b/i.test(s)) return false;
  if (!t || !t.title || !/[a-z]{2}/i.test(t.title) || t.title === t.type) return false;
  if ((t.flags || []).length) return false;
  const left = String(t.title);
  if (/\b20\d\d\b/.test(left)) return false;
  if (/\b(next|this|end of|eom|eow|week|weekend|month|after|before|until|till|semester|term|morning|evening|afternoon|night|noon|midnight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december|today|tomorrow|tonight|days?|hrs?|hours?|mins?|minutes?)\b|\d/i.test(left.replace(/\b(?:lab|quiz|exam|test|project|chapter|ch|homework|hw|assignment|problem set|pset|week|module|unit|part|lecture|report|essay|paper|midterm|final|reading|read|worksheet|discussion|post|presentation|draft|set)\s*\d+(?:\.\d+)?\b/gi, " "))) return false;
  return true;
}
/* AI-QUALITY-END */
// Schemas are written in Gemini's format; Claude and ChatGPT take standard JSON Schema
function toJsonSchema(s){
  if (Array.isArray(s)) return s.map(toJsonSchema);
  if (!s || typeof s !== "object") return s;
  const o = {};
  Object.entries(s).forEach(([k, v]) => {
    if (k === "type") o.type = String(v).toLowerCase();
    else if (k === "properties") { o.properties = {}; Object.entries(v).forEach(([pk, pv]) => { o.properties[pk] = toJsonSchema(pv); }); }
    else if (k === "items") o.items = toJsonSchema(v);
    else if (["required", "enum", "description"].includes(k)) o[k] = v;
  });
  return o;
}
// Remembers which free model answered last and which ones were busy
const AI_MEM = "studyboard:aiModels";
function aiMem(){ try { return JSON.parse(localStorage.getItem(AI_MEM) || "{}") || {}; } catch(e) { return {}; } }
function aiMemSet(fn){ try { const m = aiMem(); fn(m); localStorage.setItem(AI_MEM, JSON.stringify(m)); } catch(e) {} }
// Models to try, in order, for a job
function geminiOrder(pinned, tier = "reason"){
  const m = aiMem(), now = Date.now();
  const cool = x => (m.cool && m.cool[x] || 0) > now;
  const slow = x => (m.slow && m.slow[x] || 0) > now;
  const free = (AI_TIERS[tier] || AI_MODELS).slice().sort((a, b) => (cool(a) - cool(b)) || (slow(a) - slow(b)));
  if (!pinned || pinned === "auto") return free;
  if (pinned === "auto-pro") { const pro = AI_PRO_MODELS.filter(x => !cool(x)); return tier === "reason" ? pro.concat(free) : free; }
  const rest = free.filter(x => x !== pinned);
  return tier === "lite" ? rest.concat(pinned) : [pinned].concat(rest);
}
function fetchT(url, opts, ms, signal){
  const ac = typeof AbortController === "function" ? new AbortController() : null;
  const t = ac ? setTimeout(() => ac.abort(), ms) : null;
  if (ac && signal) { if (signal.aborted) ac.abort(); else signal.addEventListener("abort", () => ac.abort(), {once: true}); }
  return fetch(url, Object.assign({}, opts, ac ? {signal: ac.signal} : {})).finally(() => clearTimeout(t));
}
const offlineErr = who => aiErr("offline", navigator.onLine === false ? "You're offline. AI features need an internet connection." : `Couldn't reach ${who}. Check your connection and try again.`);
async function errMsg(res){ try { const e = await res.json(); return (e.error && (e.error.message || e.error.type)) || e.message || ""; } catch(e) { return ""; } }

// Course material belongs to its authors: anything AI makes from it is written in its own words
const AI_COPY = "Copyright rule (always follow it, even if asked otherwise): the student's course material (slides, handouts, readings, textbook pages, an instructor's notes) belongs to its authors. Write everything you produce in your own words. Restate the facts and ideas; never copy the material's sentences or distinctive phrases, and never repeat more than a few words in a row from it. Technical terms, names, numbers, formulas, dates and short labels may stay exact. Never reproduce or closely imitate questions from an instructor's tests, quizzes or exams or a textbook's problem sets; write new questions that test the same ideas. You may follow an exam's format, length and difficulty, but not its wording. The only exception is the student's own words: their own lecture recording or their own handwriting may be transcribed as they are.";
const AI_COPY_TASKS = new Set(["cards", "quiz", "cases", "practice", "explain", "summary", "tutor", "topics", "photo", "ask"]);
const aiCopyRule = (system, task) => AI_COPY_TASKS.has(task) && typeof system === "string" && !system.includes(AI_COPY) ? system + " " + AI_COPY : system;
/* One call, any provider */
// How many AI requests the student is waiting on right now; the companion listens for "sb-ai-wait"
let AI_WAITING = 0;
// A job that got answers from the AI but still failed (the AI couldn't watch the video, nothing usable came back): the companion says so instead of "done"
function aiJobFailed(){ try { document.dispatchEvent(new CustomEvent("sb-ai-job", {detail: {ok: false}})); } catch (e) {} }
// The status line of a sheet scrolls into view when it changes, so a message is never hidden below the fold
function aiShowStatus(el){ try { if (el && el.textContent.trim() && el.isConnected) el.scrollIntoView({block: "nearest", behavior: "smooth"}); } catch (e) {} }
function aiWaiting(d){ AI_WAITING = Math.max(0, AI_WAITING + d); try { document.dispatchEvent(new CustomEvent("sb-ai-wait", {detail: AI_WAITING})); } catch (e) {} }
async function aiCall({system, parts, schema, maxTokens = 24000, temperature = 0.4, onStatus, fast = false, timeout, auto = false, task = "", signal, search = false, urlContext = false}){
  const arguments0 = arguments[0];
  let cfg = aiCfg();
  try { if (window.SBAREA) system = SBAREA.aiSystem(system); } catch (e) {}
  system = aiCopyRule(system, task);
  if (auto) { const a = autoState(); if (!a.on) throw aiErr("auto-off", "Automatic AI is off."); cfg = a.cfg; }
  if (inPreview()) throw aiErr("preview", "AI features work in the Studyboard app and on your website, not in this preview.");
  if (!cfg.key) throw aiErr("nokey", "Set up AI in Settings first.");
  if (aiSbMode(cfg)) {
    // Studyboard AI reads text, photos and PDFs, and can look things up on the web; video (YouTube) needs a Gemini key
    const why = parts.some(x => x && x.text == null && !/^(image\/(png|jpeg|gif|webp)|application\/pdf)$/.test(((x.inline_data || {}).mime_type) || "")) ? "files" : "";
    if (why) { if (!auto) aiProPrompt(why); throw aiErr("pro-" + why, AI_PRO_WORDS[why].err); }
  }
  if (!aiConsented(cfg.provider)) {
    if (auto) throw aiErr("no-consent", "Automatic AI is waiting for your OK.");
    if (!(await aiConsentAsk(cfg.provider))) throw aiErr("no-consent", `AI is off until you agree to send content to ${(AI_WHO[cfg.provider] || {}).company || "the AI company"}. You can agree the next time you use an AI feature.`);
  }
  const ms = timeout || (fast ? 60000 : 180000);
  const hasFiles = parts.some(x => x && x.text == null);
  const slow = onStatus ? setTimeout(() => onStatus(fast ? "Still thinking…" : hasFiles ? "Still working. Big files can take up to a minute…" : "Still thinking…"), fast ? 9000 : 20000) : null;
  // a request the student is waiting on (not background work): the companion shows it's thinking
  if (!auto) aiWaiting(1);
  try {
    if (cfg.provider === "studyboard") {
      const backup = aiProBackup(cfg.keys || {});
      try { return await proCall({system, parts, schema, ms, task, signal, auto, search, urlContext, hasBackup: !!backup}); }
      catch (e) { if (e && e.out && backup && !(signal && signal.aborted) && aiProUsedUp()) { if (!auto) aiWaiting(-1); clearTimeout(slow); try { return await aiCall(arguments0); } finally { if (!auto) aiWaiting(1); } } throw e; }
    }
    // Claude only ever runs as Studyboard AI does (Haiku 5.5, thinking per job, its limits), whatever model was saved
    if (cfg.provider === "anthropic") return await proCall({system, parts, schema, ms, task, signal, auto, search, urlContext, own: cfg.key});
    if (cfg.provider === "openai") return await openaiCall(cfg, {system, parts, schema, maxTokens, ms, signal, search, urlContext});
    return await geminiCall(cfg, {system, parts, schema, maxTokens, temperature, fast, ms, task, signal, search, urlContext});
  } finally { clearTimeout(slow); if (!auto) aiWaiting(-1); }
}
// urlContext (opt-in): the model may open the web pages named in the request (Gemini url_context, Claude web fetch, ChatGPT web search).
// Like search, it answers in plain text (JSON is parsed from it), and r.fetched lists the pages it tried: [{url, ok, status}]
const GEM_MAX_OUT = 65536;
async function geminiCall(cfg, {system, parts, schema, maxTokens, temperature, fast, ms, task, signal, search, urlContext}){
  const T = aiTask(task, fast), models = geminiOrder(cfg.model, T.tier);
  // A short text request that hasn't answered in 25 seconds is stuck (an overloaded free model), so the next model gets a turn instead of waiting minutes
  const light = !search && !urlContext && parts.every(p => p && p.text != null) && parts.reduce((n, p) => n + String(p.text).length, 0) + String(system || "").length < 40000 && maxTokens <= 16000;
  const media = parts.some(p => p && (p.file_data || p.inline_data));
  const msEach = light ? Math.min(ms, (window.__SB_TEST && window.__SB_AI_STALL) || 25000) : ms;
  // Hedging: when a model is slow, the next one starts on the same request too (two at most) and the first good answer wins,
  // so a stalled or overloaded free model costs a short wait instead of minutes, and a slow but working one isn't thrown away
  // Chat is a conversation: a second model starts after 10 seconds, not 20, so a stalled free model doesn't keep the student waiting
  const hedgeMs = (window.__SB_TEST && window.__SB_AI_HEDGE) || (light ? (task === "chat" ? 10000 : 20000) : media ? 90000 : search || urlContext ? 45000 : 60000);
  const url = m => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;
  const cool = (m, ms2) => aiMemSet(x => { x.cool = x.cool || {}; x.cool[m] = Date.now() + ms2; });
  let settled = false;
  const ctrls = new Set();
  // One model's attempt: {ok, r} on success; {err, fatal} when it fails (fatal: no other model will do better); {quiet} when it lost the race
  async function attempt(m, last){
    let thinking = true, roomy = false;
    for (let tries = 0; tries < 4; tries++) {
      const bodyFor = () => {
        // a retry after running out of room: twice the room, and less of it spent thinking
        // Gemini's Flash models write at most 65,536 tokens in one answer
        const gc = {temperature, maxOutputTokens: roomy ? Math.min(GEM_MAX_OUT, Math.max(maxTokens, maxTokens * 2)) : Math.min(GEM_MAX_OUT, maxTokens)};
        if (!search && !urlContext) { gc.responseMimeType = "application/json"; if (schema) gc.responseSchema = schema; }
        if (parts.some(p => p && p.file_data)) gc.mediaResolution = "MEDIA_RESOLUTION_LOW";
        if (thinking) gc.thinkingConfig = {thinkingLevel: roomy ? "low" : T.think};
        const body = {contents: [{role: "user", parts}], systemInstruction: {parts: [{text: system}]}, generationConfig: gc};
        if (search) body.tools = [{google_search: {}}];
        if (urlContext) body.tools = (body.tools || []).concat({url_context: {}});
        return JSON.stringify(body);
      };
      const ac = typeof AbortController === "function" ? new AbortController() : null;
      if (ac) { ctrls.add(ac); if (signal) { if (signal.aborted) ac.abort(); else signal.addEventListener("abort", () => ac.abort(), {once: true}); } }
      const t0 = Date.now();
      let res;
      try { res = await fetchT(url(m), {method: "POST", headers: {"Content-Type": "application/json", "x-goog-api-key": cfg.key}, body: bodyFor()}, last ? ms : msEach, ac ? ac.signal : signal); }
      catch (e) {
        if (signal && signal.aborted) return {err: aiErr("cancelled", "Canceled."), fatal: true};
        if (settled) return {quiet: true};
        if (e && e.name === "AbortError") { aiMemSet(x => { x.cool = x.cool || {}; x.cool[m] = Date.now() + 5 * 60000; x.slow = x.slow || {}; x.slow[m] = Date.now() + 30 * 60000; }); return {err: aiErr("slow", "The AI took too long to answer. Try again, or use fewer files.")}; }
        return {err: offlineErr("Google's AI service"), fatal: true};
      } finally { if (ac) ctrls.delete(ac); }
      if (settled) return {quiet: true};
      if (res.ok) {
        const j = await res.json().catch(() => ({}));
        const cand = j.candidates && j.candidates[0];
        if (!cand) { const br = j.promptFeedback && j.promptFeedback.blockReason; return {err: aiErr("blocked", br ? `Gemini wouldn't process this material (${String(br).toLowerCase()}).` : "The AI didn't send anything back. Try again."), fatal: true}; }
        const text = ((cand.content && cand.content.parts) || []).filter(p => !p.thought).map(p => p.text || "").join("");
        const data = aiParseJson(text);
        if (data) {
          // how long a light answer took: models that answer slowly go to the back of the line for a while
          const took = Date.now() - t0;
          aiMemSet(x => { x.good = m; if (x.cool) delete x.cool[m]; if (light) { x.slow = x.slow || {}; if (took > 25000) x.slow[m] = Date.now() + 30 * 60000; else delete x.slow[m]; } });
          const sources = search ? (((cand.groundingMetadata || {}).groundingChunks) || []).map(c => c && c.web ? {url: String(c.web.uri || ""), title: String(c.web.title || "")} : null).filter(Boolean) : undefined;
          const fetched = urlContext ? (((cand.urlContextMetadata || cand.url_context_metadata || {}).urlMetadata || (cand.urlContextMetadata || cand.url_context_metadata || {}).url_metadata) || []).map(u => { const st = String(u.urlRetrievalStatus || u.url_retrieval_status || ""); return {url: String(u.retrievedUrl || u.retrieved_url || ""), ok: /SUCCESS/.test(st), status: st.replace(/^URL_RETRIEVAL_STATUS_/, "").toLowerCase()}; }) : undefined;
          return {ok: true, r: {data, model: m, provider: "gemini", truncated: cand.finishReason === "MAX_TOKENS", sources, fetched, usage: j.usageMetadata || null}};
        }
        // Out of room with nothing usable: thinking or a stuck, repeating answer can do this even on small jobs, so retry before giving up
        if (cand.finishReason === "MAX_TOKENS") {
          if (!roomy && maxTokens < GEM_MAX_OUT) { roomy = true; continue; }
          // a video or file that ran out of room twice won't do better on another model, and each try costs a full pass over it
          return {err: aiErr("long", task === "photo" ? "Couldn't finish reading that. Try again, or use fewer photos at once." : "That was too much to make in one go. Ask for fewer cards or questions, or use fewer files."), fatal: media};
        }
        return {err: aiErr("bad", "The AI's answer came back garbled. Try again.")};
      }
      const msg = await errMsg(res);
      if (res.status === 400 && thinking && /thinking/i.test(msg)) { thinking = false; continue; }
      if (AI_PRO_MODELS.includes(m) && !last && res.status !== 401 && !/api[ _-]?key/i.test(msg)) { cool(m, 30 * 60000); return {err: aiErr("model", `The model ${m} isn't available on your key.`), weak: true}; }
      if (res.status === 401 || res.status === 403 || (res.status === 400 && /api[ _-]?key/i.test(msg))) return {err: aiErr("key", "Google didn't accept your Gemini key. Check it in Settings, then AI Features."), fatal: true};
      if (res.status === 413 || /too large|payload size|exceeds.*(size|limit)/i.test(msg)) return {err: aiErr("big", "Those files are too big to send at once. Try fewer or smaller files (PDF works best)."), fatal: true};
      if (res.status === 404 || (res.status === 400 && /model/i.test(msg) && !/token|size|large/i.test(msg))) return {err: aiErr("model", `The model ${m} isn't available on your key.`), weak: true};
      if (res.status === 429) { if (!search && !urlContext) cool(m, /day|daily|per ?day/i.test(msg) ? 6 * 3600000 : 70000); return {err: aiErr("limit", "You've used up the free AI requests for now. Wait a minute and try again (if it's the daily limit, it resets tomorrow)." + (msg ? ` Google said (${m}${search ? ", web search" : ""}): ${String(msg).replace(/\s+/g, " ").slice(0, 200)}` : ""))}; }
      // a video or file that Google's servers choke on isn't the model's fault: no bench, and Google's own words go with the error
      if (res.status >= 500) { if (!media) cool(m, 3 * 60000); return {err: Object.assign(aiErr("busy", "Google's AI is very busy right now. Try again in a minute." + (msg ? ` Google said (${m}): ${String(msg).replace(/\s+/g, " ").slice(0, 160)}` : "")), {status: res.status, gmsg: String(msg || "").slice(0, 300)})}; }
      return {err: aiErr("http", msg ? "The AI couldn't do that: " + msg.slice(0, 180) : "The AI couldn't do that right now (error " + res.status + ")."), fatal: true};
    }
    return {err: aiErr("http", "The AI couldn't do that right now.")};
  }
  return new Promise((resolve, reject) => {
    let next = 0, running = 0, hedgeT = 0, lastErr = null;
    const finish = (fn, v) => { if (settled) return; settled = true; clearTimeout(hedgeT); ctrls.forEach(c => { try { c.abort(); } catch (e) {} }); fn(v); };
    const launch = () => {
      if (settled || next >= models.length) return false;
      const m = models[next], last = next === models.length - 1; next++; running++;
      clearTimeout(hedgeT);
      if (!last) hedgeT = setTimeout(() => { if (!settled && running < 2) launch(); }, hedgeMs);
      attempt(m, last).then(o => {
        running--;
        if (settled || o.quiet) return;
        if (o.ok) { finish(resolve, o.r); return; }
        if (o.fatal) { finish(reject, o.err); return; }
        // the first real reason is the one worth showing (a missing model is only a reason when nothing else went wrong)
        if (!lastErr || (lastErr.code === "model" && !o.weak)) lastErr = o.err;
        if (!launch() && running === 0) finish(reject, lastErr || aiErr("http", "The AI couldn't do that right now."));
      }, e => { running--; if (!settled && running === 0 && !launch()) finish(reject, e); });
      return true;
    };
    launch();
  });
}
// Studyboard AI (AI_PRO)
const AI_PRO_WORDS = {
  used_up: {title: "You've Used This Week's Studyboard AI", body: "Studyboard AI is back when your allowance resets. Until then, AI keeps working with your own free Google Gemini key, which takes about a minute to set up.", err: "You've used this month's Studyboard AI. Add your free Gemini key to keep going, or wait for it to reset."},
  today: {title: "You've Used Today's Studyboard AI", body: "Studyboard AI has a daily share so this week's allowance lasts. It's back tomorrow. Your own free Google Gemini key works right away, if you'd like to keep going today.", err: "That's today's Studyboard AI. More tomorrow, or add your free Gemini key."},
  files: {title: "This Needs a Gemini Key", body: "Studyboard AI reads text, photos and PDFs. Videos need Google's Gemini, the only AI that can watch them. A free Gemini key takes about a minute to set up.", err: "Videos need a free Gemini key."},
  search: {title: "This Needs Your Own Key", body: "Looking things up on the web needs your own free Google Gemini key, which takes about a minute.", err: "This needs your own free Gemini key."},
  too_long: {title: "That's Too Much in One Go", body: "Studyboard AI handles up to about 250 pages of text at once. Use fewer or shorter files, or add your own free Google Gemini key for very big jobs.", err: "That's too much for one go. Use fewer or shorter files."}
};
// own: the student's own Claude key in Studyboard AI Mode (the same job, run on this device), otherwise the built-in AI
const AI_OWN_WORDS_PRO = {
  used_up: {title: "Your Own Key's Weekly Limit Is Reached", body: "Studyboard AI keeps your own key to its weekly limit, so AI pauses until it resets. Choose another model in Settings, AI Features to keep going.", err: "Your own key's Studyboard AI limit for this month is reached."},
  today: {title: "That's Today's Limit on Your Own Key", body: "Studyboard AI keeps your own key to its daily limit. It's back tomorrow, or choose another model in Settings, AI Features.", err: "That's today's Studyboard AI limit on your own key. More tomorrow."}
};
const aiOwnWords = () => aiProUser() ? AI_OWN_WORDS_PRO : AI_OWN_WORDS;
const AI_OWN_WORDS = {
  used_up: {title: "Your Claude Key's Weekly Limit Is Reached", body: "Studyboard AI Mode keeps your Claude key to the same weekly limit as Studyboard AI, so AI pauses until it resets. Choose another Claude model in Settings, AI Features to keep going without the limit.", err: "Your Claude key's Studyboard AI Mode limit for this month is reached."},
  today: {title: "That's Today's Limit on Your Claude Key", body: "Studyboard AI Mode keeps your Claude key to the same daily limit as Studyboard AI. It's back tomorrow, or choose another Claude model in Settings, AI Features.", err: "That's today's Studyboard AI Mode limit on your Claude key. More tomorrow."}
};
// A request the student made that meets "too many at once" waits a moment and tries again (up to 3 times) instead of failing
async function proCall(o){
  for (let i = 0; ; i++) {
    try { return await proCallOnce(o); }
    catch(e) {
      if (!(e && e.rate) || o.auto || i >= 3 || (o.signal && o.signal.aborted)) throw e;
      await new Promise(r => setTimeout(r, 2500 * (i + 1)));
    }
  }
}
async function proCallOnce({system, parts, schema, ms, task, signal, auto, search, urlContext, own, hasBackup}){
  const content = claudeBlocks(parts), job = {task, system, content, schema: schema ? toJsonSchema(schema) : null, search: !!search, urlContext: !!urlContext, auto: !!auto};
  let res, j;
  if (own) {
    let r;
    try { r = await SBPOLICY.runJob(job, {meter: ownMeter(), lim: ownLimits(), claude: ownClaude(own, signal, Math.min(ms, 180000))}); }
    catch(e) { if (signal && signal.aborted) throw aiErr("cancelled", "Canceled."); throw offlineErr("Anthropic"); }
    if (signal && signal.aborted) throw aiErr("cancelled", "Canceled.");
    res = {status: r.status, ok: r.status === 200}; j = r.body || {};
    if (j.error === "key") throw aiErr("key", "Anthropic didn't accept your Claude key. Check it in Settings, then AI Features.");
    if (r.status === 503 && j.error === "ai_failed") throw offlineErr("Anthropic");
  } else {
    const tok = await aiSessionToken();
    if (!tok) throw aiErr("nokey", "Sign in again to use Studyboard AI.");
    try { res = await fetchT(`${AI_PRO}/v1/ai`, {method: "POST", headers: {"Content-Type": "application/json", Authorization: "Bearer " + tok}, body: JSON.stringify(job)}, Math.min(ms, 180000), signal); }
    catch(e) {
      if (signal && signal.aborted) throw aiErr("cancelled", "Canceled.");
      if (e && e.name === "AbortError") throw aiErr("slow", "The AI took too long to answer. Try again.");
      throw offlineErr("Studyboard AI");
    }
    j = await res.json().catch(() => ({}));
    aiProSet(j);
  }
  if (res.ok && j.data && typeof j.data === "object") {
    if (j.soft && !own && !(aiProGet() || {}).softTold) { try { const t = aiProGet(); t.softTold = true; localStorage.setItem(AI_PRO_LS, JSON.stringify(t)); } catch(e) {} if (!auto) setTimeout(() => toast("You've used most of this week's Studyboard AI. Everyday jobs now think a little less so the rest lasts."), 600); }
    return {data: j.data, model: own ? aiModelName("anthropic", "studyboard") : "Studyboard AI", provider: own ? "anthropic" : "studyboard", truncated: !!j.truncated};
  }
  const why = res.status === 413 ? "too_long" : AI_PRO_WORDS[j.error] && j.error !== "files" && j.error !== "search" ? j.error : "";
  const out = why === "used_up" || why === "today";
  // Out of allowance with the student's own key to fall back on: no message, the job just moves to their key
  if (why) { if (!auto && !(out && hasBackup)) aiProPrompt(why, !!own); try { scheduleRender(); } catch(e) {} throw Object.assign(aiErr(out ? "limit" : "pro-" + why, (own && aiOwnWords()[why] || AI_PRO_WORDS[why]).err), {out: out && !own}); }
  if (j.error === "not_pro" || j.error === "off" || j.error === "unconfirmed") { aiProSet({on: false}); try { scheduleRender(); } catch(e) {} throw aiErr("nokey", j.error === "unconfirmed" ? "Confirm your email to use Studyboard AI." : "Studyboard AI comes with Pro. Add your own free Gemini key in Settings to use AI without it."); }
  if (res.status === 401) throw aiErr("nokey", "Sign in again to use Studyboard AI.");
  if (res.status === 429) throw Object.assign(aiErr("limit", "Studyboard AI is handling a few requests already. Try again in a minute."), {rate: true});
  if (j.error === "refused") throw aiErr("blocked", "The AI wouldn't help with this one. Try asking another way.");
  if (res.status === 502) throw aiErr("bad", "The AI's answer came back garbled. Try again.");
  if (res.status === 400) throw aiErr("bad", "The AI couldn't read that. Try again, or with a different file.");
  throw aiErr("busy", "Studyboard AI is very busy right now. Try again in a minute.");
}
// Speech to text for lecture recordings (Whisper on Cloudflare), for Pro students on Studyboard AI
async function proTranscribe(blob, signal, ms){
  const tok = await aiSessionToken();
  if (!tok) throw aiErr("nokey", "Sign in again to use Studyboard AI.");
  const type = String(blob.type || "audio/webm").split(";")[0] || "audio/webm";
  let res;
  try { res = await fetchT(`${AI_PRO}/v1/transcribe`, {method: "POST", headers: {"Content-Type": /^(audio|video)\//.test(type) ? type : "audio/webm", Authorization: "Bearer " + tok}, body: blob}, ms || 120000, signal); }
  catch(e) { if (signal && signal.aborted) throw aiErr("cancelled", "Canceled."); if (e && e.name === "AbortError") throw aiErr("slow", "The AI took too long on part of the recording."); throw offlineErr("Studyboard AI"); }
  const j = await res.json().catch(() => ({}));
  aiProSet(j);
  if (res.ok && typeof j.text === "string") return j.text;
  if (j.error === "used_up" || j.error === "today") { aiProPrompt(j.error); throw aiErr("limit", AI_PRO_WORDS[j.error].err); }
  if (res.status === 413) throw aiErr("long", "That part of the recording is too big. Split the recording into shorter parts.");
  if (res.status === 429) throw aiErr("limit", "Studyboard AI is handling a few requests already. Try again in a minute.");
  throw aiErr("busy", "Couldn't transcribe that part right now. Try again in a minute.");
}
// Search by meaning on Studyboard AI: texts in, vectors out (one batch of up to 100)
async function proEmbed(texts, isQuery){
  const tok = await aiSessionToken();
  if (!tok) throw aiErr("nokey", "Sign in again to use Studyboard AI.");
  let res;
  try { res = await fetchT(`${AI_PRO}/v1/embed`, {method: "POST", headers: {"Content-Type": "application/json", Authorization: "Bearer " + tok}, body: JSON.stringify({texts: texts.map(t => String(t || " ").slice(0, 8000) || " ")})}, isQuery ? 20000 : 60000); }
  catch(e) { throw offlineErr("Studyboard AI"); }
  const j = await res.json().catch(() => ({}));
  aiProSet(j);
  if (res.ok && Array.isArray(j.vectors)) return j.vectors;
  if (res.status === 429 || j.error === "used_up" || j.error === "today") throw aiErr("limit", "Search by meaning is resting for now. It picks up again later.");
  throw aiErr("busy", "Studyboard AI is very busy right now. Try again in a minute.");
}
// A YouTube video's transcript and on-screen text, from Studyboard AI (Google's Gemini watches it on the server)
const aiProYoutube = () => { try { return aiCfg().provider === "studyboard" && !!(aiProGet() || {}).youtube; } catch(e) { return false; } };
async function proYoutube(url, signal){
  const tok = await aiSessionToken();
  if (!tok) throw aiErr("nokey", "Sign in again to use Studyboard AI.");
  let res;
  try { res = await fetchT(`${AI_PRO}/v1/youtube`, {method: "POST", headers: {"Content-Type": "application/json", Authorization: "Bearer " + tok}, body: JSON.stringify({url})}, 300000, signal); }
  catch(e) { if (signal && signal.aborted) throw aiErr("cancelled", "Canceled."); if (e && e.name === "AbortError") throw aiErr("slow", "Watching the video took too long. Try a shorter one."); throw offlineErr("Studyboard AI"); }
  const j = await res.json().catch(() => ({}));
  aiProSet(j);
  if (res.ok && typeof j.transcript === "string" && j.transcript) return j;
  if (j.error === "used_up" || j.error === "today") { aiProPrompt(j.error); throw aiErr("limit", AI_PRO_WORDS[j.error].err); }
  if (j.error === "video_limit") throw aiErr("video_limit", `You've used this month's ${j.youtubeMonthly || ""} YouTube videos with Studyboard AI.${aiProResets() ? ` More on ${aiProResets()}.` : ""} Paste the video's transcript instead (on YouTube, open the description and choose Show Transcript), or add your own free Gemini key.`.replace("month's  ", "month's "));
  if (j.error === "video") throw aiErr("video", "That video couldn't be watched. It may be private, unlisted, age-restricted, members-only or removed.");
  if (res.status === 429) throw aiErr("limit", "Studyboard AI is handling a few requests already. Try again in a minute.");
  throw aiErr("busy", "Studyboard AI couldn't watch that video right now. Try again in a minute.");
}
const aiProAudio = () => { try { return aiCfg().provider === "studyboard" && !!(aiProGet() || {}).transcribe; } catch(e) { return false; } };
// Why Studyboard AI stopped, with the way on
let aiProAsking = null;
function aiProPrompt(why, own){
  const W = (own && aiOwnWords()[why]) || AI_PRO_WORDS[why]; if (!W || aiProAsking) return;
  const d = document.createElement("dialog"); d.className = "ai-consent"; d.setAttribute("aria-labelledby", "aiProTitle");
  const when = why === "used_up" ? (own ? (r => { try { return new Date(r).toLocaleDateString(undefined, {month: "long", day: "numeric", timeZone: "UTC"}); } catch(e) { return ""; } })(ownView().resets) : aiProResets()) : "";
  d.innerHTML = `<div class="sheet"><div class="sheet-head"><h2 id="aiProTitle">${esc(W.title)}</h2></div>
    <div class="sheet-body"><p style="margin:0">${esc(W.body)}</p>${when ? `<p class="mini" style="margin:0">Your Studyboard AI resets on ${esc(when)}.</p>` : ""}</div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-no>Not Now</button><button type="button" class="btn primary" data-yes>${own ? "AI Settings" : "Add My Free Gemini Key"}</button></div></div>`;
  const finish = go => { aiProAsking = null; try { d.close(); } catch(e) {} d.remove(); if (go) { aiSetupSheet(true); if (!own) try { window.open("https://aistudio.google.com/apikey", "_blank", "noopener"); } catch(e) {} } };
  d.addEventListener("cancel", e => { e.preventDefault(); finish(false); });
  d.querySelector("[data-yes]").addEventListener("click", () => finish(true));
  d.querySelector("[data-no]").addEventListener("click", () => finish(false));
  aiProAsking = d;
  document.body.appendChild(d); d.showModal();
}
function claudeBlocks(parts){
  return parts.map(p => {
    if (p.text != null) return {type: "text", text: p.text};
    const d = p.inline_data || {};
    if (d.mime_type === "application/pdf") return {type: "document", source: {type: "base64", media_type: "application/pdf", data: d.data}};
    if (/^image\/(png|jpeg|gif|webp)$/.test(d.mime_type)) return {type: "image", source: {type: "base64", media_type: d.mime_type, data: d.data}};
    throw aiErr("type", aiClaudeName() + " can't read HEIC photos. Save the photo as JPG or PNG, or switch to Gemini.");
  });
}
function openaiContent(parts){
  let n = 0;
  return parts.map(p => {
    if (p.text != null) return {type: "input_text", text: p.text};
    const d = p.inline_data || {};
    if (d.mime_type === "application/pdf") return {type: "input_file", filename: `file${++n}.pdf`, file_data: `data:application/pdf;base64,${d.data}`};
    if (/^image\/(png|jpeg|gif|webp)$/.test(d.mime_type)) return {type: "input_image", image_url: `data:${d.mime_type};base64,${d.data}`};
    throw aiErr("type", "ChatGPT can't read HEIC photos. Save the photo as JPG or PNG, or switch to Gemini.");
  });
}
async function openaiCall(cfg, {system, parts, schema, maxTokens, ms, signal, search, urlContext}){
  const body = {model: cfg.model, instructions: system, input: [{role: "user", content: openaiContent(parts)}], max_output_tokens: Math.max(1024, maxTokens), store: false};
  if (schema && !search && !urlContext) body.text = {format: {type: "json_schema", name: "answer", schema: toJsonSchema(schema), strict: false}};
  if (search || urlContext) body.tools = [{type: "web_search"}];
  for (let attempt = 0; attempt < 2; attempt++) {
    let res;
    try { res = await fetchT("https://api.openai.com/v1/responses", {method: "POST", headers: {"Content-Type": "application/json", "Authorization": "Bearer " + cfg.key}, body: JSON.stringify(body)}, ms, signal); }
    catch(e) { if (signal && signal.aborted) throw aiErr("cancelled", "Canceled."); if (e && e.name === "AbortError") throw aiErr("slow", "ChatGPT took too long to answer. Try again, or use fewer files."); throw offlineErr("OpenAI"); }
    if (res.ok) {
      const j = await res.json().catch(() => ({}));
      const text = j.output_text || (j.output || []).filter(o => o.type === "message").flatMap(o => o.content || []).filter(c => c.type === "output_text").map(c => c.text).join("");
      const data = aiParseJson(text);
      if (data) {
        const sources = search ? (j.output || []).filter(o => o.type === "message").flatMap(o => o.content || []).flatMap(c => c.annotations || []).filter(a => a && a.type === "url_citation" && a.url).map(a => ({url: String(a.url), title: String(a.title || "")})) : undefined;
        return {data, model: cfg.model, provider: "openai", truncated: j.status === "incomplete", sources};
      }
      if (j.status === "incomplete") throw aiErr("long", "That was too much to make in one go. Ask for fewer cards or questions, or use fewer files.");
      throw aiErr("bad", "ChatGPT's answer came back garbled. Try again.");
    }
    const msg = await errMsg(res);
    if (res.status === 401 || res.status === 403) throw aiErr("key", "OpenAI didn't accept your key. Check it in Settings, then AI Features.");
    if (/quota|billing|insufficient/i.test(msg)) throw aiErr("credit", "Your OpenAI account is out of credit. Add credit on the OpenAI platform, or switch back to free Gemini.");
    if (res.status === 404 || /model/i.test(msg) && res.status === 400) throw aiErr("model", `The model ${cfg.model} isn't available on your OpenAI account.`);
    if (res.status === 429) throw aiErr("limit", "Your OpenAI account's rate limit was reached. Wait a minute and try again.");
    if (res.status >= 500 && attempt === 0) { await sleep(1500); continue; }
    if (res.status >= 500) throw aiErr("busy", "ChatGPT is very busy right now. Try again in a minute.");
    throw aiErr("http", msg ? "ChatGPT couldn't do that: " + msg.slice(0, 180) : "ChatGPT couldn't do that right now (error " + res.status + ").");
  }
}
// The model picker shown in every AI sheet
function aiModelBar(){
  const c = aiCfg();
  if (c.provider === "studyboard") { const t = aiProGet() || {}; return `<label class="ai-model-bar">${AI_ICON}<span class="mini">Studyboard AI${t.usedPct ? `: ${t.usedPct}% of this week's used` : ""}</span><button type="button" class="link-btn" data-act="ai-setup">Settings</button></label>`; }
  const groups = aiModelOpts(c.keys, `${c.provider}|${c.model}`, (p, P) => p === c.provider && !P.models.some(x => x[0] === c.model) ? `<option value="${p}|${esc(c.model)}" selected>${esc(aiModelName(p, c.model))}</option>` : "");
  return `<label class="ai-model-bar">${AI_ICON}<span class="mini">Model</span><select data-ai-model aria-label="AI model">${groups}</select><button type="button" class="link-btn" data-act="ai-setup">Add Models</button></label>`;
}
document.addEventListener("change", e => {
  const s = e.target.closest && e.target.closest("[data-ai-model]"); if (!s) return;
  const [p, m] = s.value.split("|"); aiSaveCfg({provider: p, model: m});
  const ast = autoState();
  toast(`Using ${aiModelName(p, m)}${AI_PROVIDERS[p].models.some(x => x[0] === m && x[2] === "paid") ? ". This one is billed to your account." : ""}${ast.reason === "confirm" ? " Automatic AI is paused until you confirm paid use in Settings." : ""}`);
  scheduleRender();
});

/* Reading files for the AI */
function bytesToB64(u8){ let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
const xmlDecode = s => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n))).replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCharCode(parseInt(n, 16))).replace(/&amp;/g, "&");
// Reading a PowerPoint or Word file is limited so a booby-trapped file
const ZIP_MAX_IN = 60 * 1024 * 1024, ZIP_MAX_ENTRIES = 5000, ZIP_MAX_OUT = 40 * 1024 * 1024;
async function inflateBytes(data, max){
  const rd = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw")).getReader(), parts = []; let n = 0;
  for (;;) {
    const {done, value} = await rd.read(); if (done) break;
    n += value.length;
    if (n > max) { try { await rd.cancel(); } catch(e) {} throw aiErr("big", "That file unpacks to far more than a normal document. Studyboard won't open it."); }
    parts.push(value);
  }
  return new Uint8Array(await new Blob(parts).arrayBuffer());
}
// The parts of a zip whose names want() accepts, as bytes
async function unzipBytes(src, want, opts){
  opts = opts || {};
  const max = opts.max || ZIP_MAX_OUT, blob = src instanceof Blob ? src : new Blob([src]), size = blob.size;
  const read = async (a, b) => new Uint8Array(await blob.slice(a, b).arrayBuffer());
  const tail = await read(Math.max(0, size - 65557), size), tv = new DataView(tail.buffer);
  let eocd = -1;
  for (let i = tail.length - 22; i >= 0; i--) if (tv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("not a zip");
  const n = Math.min(tv.getUint16(eocd + 10, true), opts.entries || ZIP_MAX_ENTRIES), cdLen = tv.getUint32(eocd + 12, true), cdOff = tv.getUint32(eocd + 16, true);
  if (cdOff + cdLen > size) throw new Error("not a zip");
  const u = await read(cdOff, cdOff + cdLen), dv = new DataView(u.buffer), dec = new TextDecoder(), out = {};
  for (let k = 0, p = 0; k < n && p + 46 <= u.length; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const flags = dv.getUint16(p + 8, true), method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), usize = dv.getUint32(p + 24, true);
    const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    const name = dec.decode(u.subarray(p + 46, p + 46 + nl)); p += 46 + nl + xl + cl;
    if (!want(name) || (flags & 1)) continue;
    if (usize > max || (method === 0 && csize > max)) { if (Array.isArray(opts.big)) opts.big.push(name); continue; }
    if (off + 30 > size) continue;
    const lh = await read(off, off + 30), lv = new DataView(lh.buffer);
    if (lv.getUint32(0, true) !== 0x04034b50) continue;
    const start = off + 30 + lv.getUint16(26, true) + lv.getUint16(28, true);
    if (start + csize > size) continue;
    if (method === 0) out[name] = await read(start, start + csize);
    else if (method === 8 && typeof DecompressionStream === "function") out[name] = await inflateBytes(await read(start, start + csize), max);
  }
  return out;
}
async function unzipText(buf, want){
  if (buf.byteLength > ZIP_MAX_IN) throw aiErr("big", "That file is too big to read here. Export it as a PDF instead.");
  const raw = await unzipBytes(buf, want), dec = new TextDecoder(), out = {};
  Object.keys(raw).forEach(k => { out[k] = dec.decode(raw[k]); });
  return out;
}
const paraText = (xml, pTag, tTag) => xml.split(new RegExp(`</${pTag}>`)).map(p => (p.match(new RegExp(`<${tTag}(?: [^>]*)?>([^<]*)</${tTag}>`, "g")) || []).map(t => xmlDecode(t.replace(/<[^>]+>/g, ""))).join("")).map(s => s.trim()).filter(Boolean);
async function pptxText(buf){
  const files = await unzipText(buf, n => /^ppt\/(slides\/slide|notesSlides\/notesSlide)\d+\.xml$/.test(n));
  const num = n => Number((n.match(/(\d+)\.xml$/) || [0, 0])[1]);
  const slides = Object.keys(files).filter(n => n.startsWith("ppt/slides/")).sort((a, b) => num(a) - num(b));
  return slides.map(n => {
    const body = paraText(files[n], "a:p", "a:t").join("\n");
    const notes = files["ppt/notesSlides/notesSlide" + num(n) + ".xml"];
    const nt = notes ? paraText(notes, "a:p", "a:t").filter(s => !/^\d+$/.test(s)).join(" ") : "";
    return `Slide ${num(n)}:\n${body}${nt ? `\nSpeaker notes: ${nt}` : ""}`;
  }).join("\n\n");
}
async function docxText(buf){
  const files = await unzipText(buf, n => n === "word/document.xml");
  return files["word/document.xml"] ? paraText(files["word/document.xml"], "w:p", "w:t").join("\n") : "";
}
const AI_IMG = {png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", heic: "image/heic", heif: "image/heif"};
// Returns {name, kind, size, part} where part is a Gemini content part
// The plain text of a PDF, kept on this device only to check that AI restated it instead of copying it
async function aiPdfText(u8){
  try {
    if (typeof loadPdfJs !== "function") return "";
    await loadPdfJs();
    const doc = await window.pdfjsLib.getDocument({data: u8.slice(), ...PDF_OPTS}).promise;
    let out = "";
    for (let i = 1; i <= Math.min(doc.numPages, 300) && out.length < 400000; i++) { const tc = await (await doc.getPage(i)).getTextContent(); out += tc.items.map(x => x.str || "").join(" ") + "\n"; }
    try { doc.destroy(); } catch (e) {}
    return out;
  } catch (e) { return ""; }
}
async function aiSourceFromFile(file){
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (file.size > 100 * 1024 * 1024) throw aiErr("big", `${file.name} is too big (over 100 MB).`);
  const buf = await file.arrayBuffer();
  if (ext === "pdf" || file.type === "application/pdf") { const u8 = new Uint8Array(buf); return {name: file.name, kind: "PDF", size: buf.byteLength, part: {inline_data: {mime_type: "application/pdf", data: bytesToB64(u8)}}, pdfBytes: u8}; }
  if (AI_IMG[ext] || /^image\//.test(file.type)) return {name: file.name, kind: "Image", size: buf.byteLength, part: {inline_data: {mime_type: AI_IMG[ext] || file.type, data: bytesToB64(new Uint8Array(buf))}}};
  let text = "";
  if (ext === "pptx") text = await pptxText(buf);
  else if (ext === "docx") text = await docxText(buf);
  else if (ext === "xlsx" && typeof OFFICE !== "undefined") text = await OFFICE.text(new Uint8Array(buf), file.name);
  else if (/^(txt|md|markdown|csv|tsv|rtf|html?)$/.test(ext) || /^text\//.test(file.type)) text = new TextDecoder().decode(buf.byteLength > 20e6 ? buf.slice(0, 20e6) : buf);
  else throw aiErr("type", `${file.name}: this file type can't be read. Use PDF, PowerPoint (.pptx), Word (.docx), Excel (.xlsx), images or text. Older .ppt/.doc/.xls files can be saved as PDF first.`);
  text = text.trim();
  if (!text) throw aiErr("empty", `${file.name} has no readable text. If it's mostly pictures, export it as a PDF instead.`);
  if (text.length > 400000) text = text.slice(0, 400000);
  return {name: file.name, kind: ext === "pptx" ? "Slides" : ext === "docx" ? "Document" : ext === "xlsx" ? "Spreadsheet" : "Text", size: text.length, part: {text: `Source file: ${file.name}\n\n${text}`}};
}
const aiSourceBytes = s => s.part.inline_data ? s.part.inline_data.data.length : s.part.text.length;

/* Study sets: flashcards and quizzes from your material */
const AI_STYLE_GROUPS = ["General Exam Style", "Question Format", "Focus", "Healthcare Exams", "Standardized Exams"];
const AI_STYLES = [
  ["Mixed (multiple choice, true/false, short answer)", "A deliberate mix of question types: about 45% single best answer, 15% true/false, 15% select all that apply, 15% short answer and 10% put-in-order.", 0],
  ["University Midterm", "A typical university midterm: a balanced mix of multiple choice, true/false, a few select-all-that-apply and short-answer questions, ordered from straightforward recall to application.", 0],
  ["Multiple Choice", "Only single best answer multiple choice, 4 options each, with plausible distractors built from common mistakes. No 'all of the above' or 'none of the above'.", 1],
  ["True / False", "True or false statements, half true and half false. For each false statement the rationale gives the corrected true statement. Avoid trick wording and absolutes like 'always' and 'never'.", 1],
  ["Select All That Apply", "Mostly select-all-that-apply questions: 5 or 6 options, 2 to 4 correct, no 'all of the above'. Each option stands alone, and the rationale covers every option.", 1],
  ["Fill in the Blank", "Cloze-style: flashcard fronts are sentences with a ____ gap, and quiz questions are short-answer questions where the student types the missing term. Blank out the key term, never a trivial word.", 1],
  ["Short Answer", "Short-answer questions that need a 1 to 3 sentence explanation. The expected answer lists the key points a good answer must include.", 1],
  ["Put in Order", "Include put-the-steps-in-order questions for processes, pathways, procedures and sequences (4 to 6 steps), plus some single-answer questions about why the order matters.", 1],
  ["Conceptual (Why / How)", "Conceptual questions: why something happens, how it works, what would change if a variable changed, compare and contrast, and predict the effect. Avoid pure recall. Rationales explain the reasoning.", 1],
  ["Calculation Problems", "Numerical problem-solving: give all the values in the stem, make the student calculate (short answer with the number and its units), vary the numbers, and show the worked steps in the rationale. Include unit conversions and, where relevant, rates, concentrations or other applied calculations.", 1],
  ["Scenario / Case-Based", "Each question starts with a short realistic scenario (a business situation, a lab result, a client, a design problem), then asks for the best next step, the most likely cause or the key risk. Test application of the material, not recall.", 1],
  ["Definitions", "Short term-and-definition flashcards and straightforward recall questions.", 2],
  ["Common Mistakes", "Target common misconceptions and look-alike concepts: write distractors from the mistakes students really make, and explain each misconception in the rationale.", 2],
  ["Harder, Applied", "Application and analysis level questions that require combining ideas from different parts of the material, not just recall.", 2],
  ["Pharmacology (Drugs)", "Focus on drug class, mechanism of action, indications, key side effects and adverse effects, contraindications, clinical considerations, monitoring and patient counseling. Compare drugs within a class and flag high-alert medications.", 2],
  ["NCLEX-RN", "NCLEX-RN style: client-centered stems about what the nurse should do, with prioritization (first, priority, most important, next), safety, delegation, infection control and therapeutic communication. Use NCLEX wording and include select-all-that-apply items. Every option plausible, and a rationale for why the right answer is right and the others are wrong.", 3],
  ["NCLEX-RN Case Study (NGN)", "Next Generation NCLEX unfolding case study style: start each question with a short client scenario that includes chart data (age, history, vital signs, lab values, nurses' notes), then ask what the nurse should do, following the clinical judgment model: recognize cues (what findings matter), analyze cues (what they suggest), prioritize hypotheses (what is the likely problem), generate solutions (what to do), take action (what to do first) and evaluate outcomes (what shows it worked). Express matrix, highlight, drop-down and bow-tie items as select-all-that-apply or one-answer questions with the data in the stem, and give a rationale for each.", 3],
  ["HESI / ATI Nursing", "HESI or ATI nursing exam style: application-level, single best answer questions with 4 options on priority actions, delegation, safe medication administration and patient teaching, mixed with some select-all-that-apply items and short dosage calculations.", 3],
  ["USMLE Vignettes", "USMLE Step 1 and 2 style: a 3 to 6 sentence clinical vignette (age, sex, presentation, vital signs, exam and lab findings), then a question such as most likely diagnosis, underlying mechanism, best next step or most likely adverse effect. One best answer from 5 plausible options of the same category. Prefer second- and third-order reasoning (what the finding means, then what to do) over recall. Explain every option in the rationale.", 3],
  ["MCAT Passages", "MCAT style: begin each question with a 100 to 150 word passage (an experiment, a data set described in words, or an argument), then a question that needs reasoning from the passage plus the course concepts, with 4 options. Include data interpretation, experimental design and 'what would happen if' questions. Test reasoning, not recall.", 4],
  ["AP Exam", "AP exam style: stimulus-based multiple choice with 4 options (a short source, data description or scenario, then the question), plus a few free-response prompts as short-answer questions whose expected answer reads like a scoring guide: the key points a full-credit answer must make.", 4],
  ["Bar Exam", "Bar exam style: a short fact pattern (a paragraph), then a question applying the rule of law: which party prevails, which claim or defense is strongest, or what the court is most likely to hold. Multiple choice with 4 options of plausible legal conclusions, rationales that state the governing rule and apply it to the facts, plus a few short-answer issue-spotting prompts.", 4],
  ["CPA Exam", "CPA exam style: multiple-choice questions with 4 options on accounting, auditing, tax and business concepts, plus task-based simulations expressed as short-answer calculations or journal-entry questions with the numbers in the stem. Rationales show the worked steps.", 4],
  ["SAT", "SAT style (digital SAT): single best answer multiple choice with exactly 4 options labeled A, B, C, D and one correct answer, no 'all of the above'. Reading and Writing questions each use a short passage of 25 to 150 words (a literary, science, history or social-science excerpt, or notes) followed by one question on central idea, details, inference, vocabulary in context, evidence, transitions, rhetorical synthesis or standard English conventions (grammar, punctuation, sentence structure). Math questions are multiple choice or short-answer ('student-produced response': a number in 'answer') on algebra, advanced math, problem-solving and data analysis, or geometry and trigonometry, with the numbers in the stem, a short real-world context where natural, and rationales that show the worked steps. Use the mix of reading and writing and math that fits the material, and spread difficulty from easy to hard. Never type letters in the option text (the app adds A, B, C, D).", 4],
  ["ACT", "ACT style: single best answer multiple choice with exactly 4 options per question (the real test labels them A, B, C, D on English, Reading and Science and alternates A, B, C, D with F, G, H, J on Math; the app adds the letters, so never type letters in the option text). English: a passage with an underlined portion, then options that rewrite it, where the first option is 'NO CHANGE', testing grammar, usage, punctuation, rhetorical skills, organization and style. Reading: a 150 to 250 word passage (prose fiction, social science, humanities or natural science) followed by detail, inference, main idea, vocabulary and author's purpose questions. Science: a described experiment, data table or pair of conflicting viewpoints, then data interpretation, investigation design and evaluation of models. Math: pre-algebra through trigonometry with the numbers in the stem and worked steps in the rationale. Use the mix of these sections that fits the material.", 4],
  ["Engineering FE", "FE (Fundamentals of Engineering) exam style: concise problem-solving questions with 4 options, numerical answers with units, standard formulas and reference-handbook style data given in the stem. Rationales show the worked solution and common unit or sign errors.", 4]
];
// Builds the style text sent to the AI
function aiComposeStyle(custom, picks){
  custom = String(custom || "").trim();
  const ps = (picks || []).map(i => AI_STYLES[i]).filter(Boolean);
  const style = [custom].concat(ps.map(x => x[1])).filter(Boolean).join(" ");
  const name = custom ? custom.split(/[.:;\n]/)[0].trim().slice(0, 60) : ps.slice(0, 2).map(x => x[0]).join(" and ");
  return {style, name};
}
// Custom styles the student typed before, newest first, to reuse next time
const AI_STYLE_MEM = "studyboard:aiStyles";
function aiRecentStyles(){ try { const l = JSON.parse(localStorage.getItem(AI_STYLE_MEM) || "[]"); return Array.isArray(l) ? l.filter(x => typeof x === "string" && x.trim()).slice(0, 8) : []; } catch(e) { return []; } }
function aiRememberStyle(text){
  text = String(text || "").trim(); if (text.length < 4) return;
  try { localStorage.setItem(AI_STYLE_MEM, JSON.stringify([text].concat(aiRecentStyles().filter(x => x !== text)).slice(0, 8))); } catch(e) {}
}
function aiForgetStyle(text){ try { localStorage.setItem(AI_STYLE_MEM, JSON.stringify(aiRecentStyles().filter(x => x !== text))); } catch(e) {} }
const CARD_SCHEMA = {type: "OBJECT", properties: {
  deckTitle: {type: "STRING", description: "Short name for this set of cards, 2 to 6 words"},
  cards: {type: "ARRAY", items: {type: "OBJECT", properties: {
    front: {type: "STRING"}, back: {type: "STRING"}, source: {type: "STRING", description: "Slide or page reference, like 'Slides 4-5' or 'p. 12'"}}, required: ["front", "back"]}}},
  required: ["cards"]};
const QUIZ_SCHEMA = {type: "OBJECT", properties: {
  title: {type: "STRING", description: "Short quiz title"},
  questions: {type: "ARRAY", items: {type: "OBJECT", properties: {
    type: {type: "STRING", enum: ["single", "multiple", "order", "truefalse", "short"]},
    stem: {type: "STRING"},
    options: {type: "ARRAY", items: {type: "STRING"}},
    correct: {type: "ARRAY", items: {type: "INTEGER"}, description: "Zero-based indexes of correct options. For order questions, the option indexes in the correct order."},
    answer: {type: "STRING", description: "The expected answer for short questions"},
    rationale: {type: "STRING"},
    optionNotes: {type: "ARRAY", items: {type: "STRING"}, description: "One short note per option saying why it is right or wrong"},
    topic: {type: "STRING"},
    source: {type: "STRING"}}, required: ["type", "stem", "rationale"]}}},
  required: ["questions"]};
function aiCleanQuestions(list){
  const out = [];
  (Array.isArray(list) ? list : []).forEach(q => {
    const type = ["single", "multiple", "order", "truefalse", "short"].includes(q.type) ? q.type : "single";
    const stem = aiTidyText(q.stem); if (!stem) return;
    let options = (Array.isArray(q.options) ? q.options : []).map(o => aiTidyText(o)).filter(Boolean);
    if (type === "truefalse") options = ["True", "False"];
    let correct = (Array.isArray(q.correct) ? q.correct : []).map(Number).filter(i => Number.isInteger(i) && i >= 0 && i < options.length);
    if (type === "truefalse" && !correct.length && q.answer) correct = [/^t/i.test(q.answer) ? 0 : 1];
    const answer = aiTidyText(q.answer);
    if (type === "short") { if (!answer && !(correct.length && options[correct[0]])) return; }
    else if (options.length < 2) return;
    if ((type === "single" || type === "truefalse") && correct.length !== 1) return;
    if (type === "multiple" && !correct.length) return;
    if (type === "order" && (correct.length !== options.length || new Set(correct).size !== options.length)) return;
    const notes = Array.isArray(q.optionNotes) && q.optionNotes.length === options.length ? q.optionNotes.map(s => aiTidyText(s)) : [];
    out.push({id: uid(), type, stem, options: type === "short" ? [] : options, correct: type === "short" ? [] : (type === "multiple" ? [...new Set(correct)].sort((a, b) => a - b) : correct),
      answer: type === "short" ? (answer || options[correct[0]]) : "", rationale: aiTidyText(q.rationale), notes, topic: String(q.topic || "").trim(), source: String(q.source || "").trim(), update: String(q.update || "").trim()});
  });
  return out;
}
const AI_RULES = "Use only the provided course material (and standard facts that agree with it). If the material is thin on a topic, skip it rather than invent details. Match the student's requested style exactly. Write clearly for a university student. Return JSON only.";
const AI_QUIZ_SYSTEM = "You write high-quality practice exam questions. Question types: 'single' (one best answer, usually 4 options), 'multiple' (select all that apply: 5 or 6 options, 2 or more correct; start or end the stem with 'Select all that apply.'), 'order' (4 to 6 steps listed in scrambled order; 'correct' lists the option indexes in the right order), 'truefalse' (options exactly ['True','False']), and 'short' (a brief typed answer in 'answer'). 'correct' holds zero-based option indexes. Every question gets a rationale explaining why the answer is right and why the others are wrong, and 'optionNotes' with one short note per option. The student's style instructions decide the mix of question types, the stem length and format (passages, vignettes, case data, calculations) and the difficulty, so follow them exactly, including a custom format they describe in their own words. If they name an exam (AP, MCAT, USMLE, NCLEX, HESI, bar exam, CPA, FE, a professor's midterm and so on), follow that exam's format and conventions, but write new questions: never reuse or closely imitate real questions from that exam, an instructor's tests or a textbook; for example, NCLEX style uses client-centered stems about what the nurse should do, with priority, first-action, safety and delegation questions and select-all-that-apply items. When no style is given, mix types sensibly. Avoid trivia and 'all of the above' or 'none of the above'. Spread questions across the whole material. Put the slide or page in 'source'. " + AI_RULES;
// One more try when the answer came back garbled or cut off to nothing
async function aiRetry(fn){ try { return await fn(); } catch(e) { if (e && (e.code === "bad" || e.code === "long")) return await fn(); throw e; } }
const AI_GROUND = "Ground every item in the facts of the material above, but write it in your own words: restate each fact or idea instead of copying the material's sentences or phrases (its technical terms, names, numbers and formulas are fine). Never add a fact, number, date, example or definition that is not in the material, and skip a topic rather than guess. Write in the same language as the material. Plain text only (no markdown or HTML). Write simple chemistry and math directly, like H₂O, CO₂, x², Δ, →; write anything harder (fractions, roots, integrals, sums, limits, vectors, matrices, reactions with conditions) in LaTeX between single dollar signs, like $\\frac{a}{b}$, $\\int_0^1 x\\,dx$ or $\\ce{2H2 + O2 -> 2H2O}$, because the app draws it as math. The 'source' field is required: the slide number or page (like 'Slide 12' or 'p. 4'), or the section heading when the material has no pages.";
async function aiMakeStudySet(opts, onStatus){
  const {sources, style, difficulty, cards, quiz, cases, caseCount, caseStyle, cardCount, quizCount, courseName, signal} = opts;
  const diff = difficulty === "easier" ? "Keep it approachable: core facts and main ideas." : difficulty === "harder" ? "Make it challenging: application, analysis and tricky distinctions." : "Mix easier recall with harder application.";
  const ctx = `Course: ${courseName || "not given"}. Student's style and instructions (follow them exactly; if they name an exam or describe a professor's format, match its structure and difficulty with new questions in your own words, never copying or closely imitating its actual questions; where they conflict with your defaults, they win): ${style || "Clear, exam-focused study material."} Difficulty: ${diff}`;
  const parts = sources.map(s => s.part);
  const corpus = sources.every(s => s.part && typeof s.part.text === "string") ? aiCorpus(sources.map(s => s.part.text)) : null;
  // The words of the material, to catch anything copied instead of restated (a PDF's text is read on this device)
  await Promise.all(sources.map(async s => { if (s.copyText == null && s.pdfBytes) s.copyText = await aiPdfText(s.pdfBytes); }));
  const copy = aiCopyIndex(sources.map(s => (s.part && typeof s.part.text === "string" ? s.part.text : "") || s.copyText || "").filter(Boolean));
  const nCards = cardCount === "auto" ? 0 : Number(cardCount) || 0, nQuiz = Number(quizCount) || 10;
  const jobs = [];
  if (cards) jobs.push(aiRetry(() => aiCall({task: opts.light ? "cards-light" : "cards", signal, maxTokens: 24000, onStatus, schema: CARD_SCHEMA, parts: parts.concat({text: `${ctx}\n\nMake ${nCards ? "exactly " + nCards + " flashcards (a few more is fine if the material truly needs them)" : "as many flashcards as the material supports well: roughly one per key idea, usually 15 to 40, at most 60"} from the material above. Spread them across all of its topics in proportion to how much it says about each.`}),
    system: "You write excellent flashcards for students. Each card tests exactly one idea. Fronts are short (a term, a question of at most 20 words, or a sentence with ____ for a cloze). Backs are accurate and concise (1 to 2 sentences). Favor high-yield, exam-relevant content: definitions, mechanisms, comparisons, steps, normal values, and key priorities where relevant. Every card must be answerable from the material alone. No two cards may ask the same thing, and skip trivia such as the lecture title, agenda, instructor names and logistics. " + AI_GROUND + " " + AI_RULES})));
  if (quiz) jobs.push(aiRetry(() => aiCall({task: opts.light ? "quiz-light" : "quiz", signal, maxTokens: 32000, onStatus, schema: QUIZ_SCHEMA, parts: parts.concat({text: `${ctx}\n\nWrite exactly ${quizCount} practice questions from the material above, spread across all of its topics. Every question must be answerable from the material, and its rationale must say where.`}),
    system: AI_QUIZ_SYSTEM + " " + AI_GROUND})));
  if (cases) jobs.push(aiRetry(() => aiCall({task: opts.light ? "cases-light" : "cases", signal, maxTokens: 24000, onStatus, schema: CASE_SCHEMA, parts: parts.concat({text: `${ctx}\n${aiCaseStyleText(caseStyle, courseName)}\n\nWrite ${caseCount || 1} case stud${Number(caseCount) === 1 ? "y" : "ies"} from the material above.`}), system: CASE_SYSTEM})));
  const settled = await Promise.allSettled(jobs);
  const failed = settled.filter(x => x.status === "rejected");
  if (failed.length === settled.length) throw failed[0].reason;
  const res = settled.map(x => x.status === "fulfilled" ? x.value : {data: {}, truncated: false});
  let k = 0, out = {cards: [], questions: [], cases: [], title: "", quizTitle: "", truncated: false, partial: failed.length ? failed[0].reason.message : "", notes: []};
  if (cards) { const r = res[k++], g = aiGateCards(r.data.cards, {max: nCards ? Math.ceil(nCards * 1.2) : 60, corpus, copy}); out.cards = g.cards; out.title = aiTidyText(r.data.deckTitle); out.truncated = out.truncated || r.truncated;
    const dr = []; if (g.dropped.dup) dr.push(g.dropped.dup + " repeated"); if (g.dropped.long) dr.push(g.dropped.long + " too long for one card"); if (g.dropped.empty) dr.push(g.dropped.empty + " incomplete"); if (dr.length) out.notes.push("Left out " + dr.join(", ") + " flashcard" + (g.dropped.dup + g.dropped.long + g.dropped.empty === 1 ? "" : "s") + ".");
    if (g.dropped.copied) out.notes.push(`Left out ${g.dropped.copied} flashcard${g.dropped.copied === 1 ? "" : "s"} that copied your material word for word instead of restating it.`); }
  if (quiz) { const r = res[k++], g = aiGateQuestions(aiCleanQuestions(r.data.questions), {max: Math.ceil(nQuiz * 1.2), corpus, copy}); out.questions = g.questions; out.quizTitle = aiTidyText(r.data.title); out.truncated = out.truncated || r.truncated;
    if (g.dropped.dup + g.dropped.bad) out.notes.push(`Left out ${g.dropped.dup + g.dropped.bad} repeated or malformed question${g.dropped.dup + g.dropped.bad === 1 ? "" : "s"}.`);
    if (g.dropped.copied) out.notes.push(`Left out ${g.dropped.copied} question${g.dropped.copied === 1 ? "" : "s"} that copied your material word for word instead of restating it.`); }
  if (cases) { const r = res[k++]; out.cases = aiCleanCases(r.data.cases).filter(c => !aiCopied(c.scenario, copy) && !(c.questions || []).some(q => [q.stem, q.answer, q.rationale].concat(q.options || []).some(t => aiCopied(t, copy)))); out.truncated = out.truncated || r.truncated; }
  return out;
}

function aiStudySheet(deckId, mode){
  if (inPreview()) { toast("AI features work in the Studyboard app and on your website, not in this preview"); return; }
  const keyK = "ai-create:" + (deckId || "");
  // one AI creation per deck (or none) at a time: an open one, still working or with your material in it, comes back as you left it
  if (sheetResume(keyK)) return;
  if (!aiCfg().key) { aiSetupSheet(true); return; }
  const deck = deckId ? state.decks[deckId] : null;
  const job = {sources: [], busy: false, key: keyK};
  const courseId = deck ? deck.courseId : (ui.filter !== "all" ? ui.filter : "");
  const storedFiles = Object.values(state.files).filter(readableFile);
  openSheet(`<form class="sheet ai-sheet">${head(mode === "quiz" ? "Make a Quiz with AI" : mode === "cards" ? (deck ? `Flashcards with AI: ${deck.name}` : "Make Flashcards with AI") : deck ? `Create with AI: ${deck.name}` : "Create Flashcards and Quizzes with AI")}
    <div class="sheet-body" id="aiBody">
      <div class="drop" id="aiDrop">
        <p style="margin:0 0 10px"><strong>Add your lecture slides, notes or readings.</strong><br><span class="mini">PDF works best (slides and diagrams are read too), but PowerPoint, Word, images and text work as well. You can add several.</span></p>
        <div class="row-actions" style="justify-content:center"><button type="button" class="btn primary" id="aiPick">Choose Files</button>${storedFiles.length ? `<select id="aiFromFiles" aria-label="Add a file from your Files"><option value="">Add from your Files…</option>${storedFiles.sort((a, b) => a.name.localeCompare(b.name)).map(f => { const c = courseOf(f.courseId); return `<option value="${esc(f.id)}">${esc(f.name)}${c ? " (" + esc(courseLabel(c)) + ")" : ""}</option>`; }).join("")}</select>` : ""}</div>
        <input type="file" id="aiFile" multiple accept=".pdf,.pptx,.docx,.xlsx,.csv,.txt,.md,.png,.jpg,.jpeg,.webp,.heic,application/pdf,image/*,text/plain" class="sr" tabindex="-1">
      </div>
      <ul class="ai-srcs" id="aiSrcs"></ul>
      <details id="aiPasteD"><summary>Or Paste Notes or Text</summary><textarea id="aiPaste" style="min-height:110px;margin-top:8px" placeholder="Paste lecture notes, a study guide or a chapter summary…" data-noenter></textarea></details>
      ${window.SBLINKCARDS && mode !== "quiz" ? SBLINKCARDS.html() : ""}
      <fieldset><legend>Make</legend>
        <div class="ai-make"><label class="mi-check"><input type="checkbox" id="aiCards" checked> Flashcards</label>${seg("aiCardN", [["auto", "Auto"], ["10", "10"], ["20", "20"], ["30", "30"], ["50", "50"]], "auto")}</div>
        <div class="ai-make"><label class="mi-check"><input type="checkbox" id="aiQuiz" checked> Practice quiz</label>${seg("aiQuizN", [["5", "5"], ["10", "10"], ["20", "20"], ["30", "30"]], "10")}</div>
        <div class="ai-make"><label class="mi-check"><input type="checkbox" id="aiCase"> Case studies</label>${seg("aiCaseN", [["1", "1"], ["2", "2"], ["3", "3"]], "1")}${caseStyleSelect("aiCaseStyle")}<span class="mini">Realistic scenarios that unfold step by step and test how you apply the material. NCLEX format is only used for nursing or when you pick it.</span></div>
      </fieldset>
      <fieldset><legend>Style</legend>
        <label class="f"><span class="lh">Your Own Style or Exam Format <span class="hint">optional, comes first</span></span><textarea id="aiStyle" rows="2" maxlength="1500" placeholder="e.g. AP-style multiple choice with rationales, or my professor's short case-study questions, or 60-minute midterm with 20 multiple choice and 5 short answers" data-noenter></textarea></label>
        <div class="chips ai-recent" id="aiRecent" role="group" aria-label="Your recent styles"></div>
        <div class="ai-style-sels">${AI_STYLE_GROUPS.map((g, gi) => `<label class="f"><span class="lbl">${esc(g)}</span><select class="ai-style-sel" data-group="${gi}"><option value="">None</option>${AI_STYLES.map((x, i) => x[2] === gi ? `<option value="${i}" title="${esc(x[1])}">${esc(x[0])}</option>` : "").join("")}</select></label>`).join("")}</div>
        <p class="mini" style="margin:8px 0 0">Pick a ready-made style from any of these. They add to what you wrote.</p>
      </fieldset>
      <fieldset><legend>Difficulty</legend>${seg("aiDiff", [["mixed", "Mixed"], ["easier", "Easier"], ["harder", "Harder"]], "mixed")}</fieldset>
      ${deck ? "" : `<label class="f">Course<select id="aiCourse">${courseSelectHtml(courseId)}</select></label>`}
      ${aiModelBar()}
      <p class="mini" style="margin:0">${aiCfg().provider === "gemini" ? "On Gemini's free tier, Google may use what you upload to improve its products, so leave out private or sensitive information. " : ""}AI can make mistakes; you can review everything before it's saved.</p>
      <p class="status-msg" id="aiStatus" style="margin:0" aria-live="polite"></p>
    </div>
    <div class="sheet-foot"><button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span><button type="button" class="btn primary" id="aiGo">${AI_ICON} Create</button></div>
  </form>`);
  const sheetEl = dlg.querySelector(".ai-sheet"), inS = q => sheetEl.querySelector(q);
  sheetKeep(keyK, {name: aiWho("AI"), busy: () => job.busy, drop: () => { job.dropped = true; if (job.ac) try { job.ac.abort(); } catch (e) {} },
    dirty: () => job.busy || job.sources.length > 0 || !!(inS("#aiPaste") && inS("#aiPaste").value.trim()) || !!(inS("#aiLink") && inS("#aiLink").value.trim()) || !!(inS("#aiStyle") && inS("#aiStyle").value.trim() && !(deck && inS("#aiStyle").value.trim() === String(deck.aiStyle || "").trim()))});
  if (mode === "cards" || mode === "quiz") {
    const row = id => $(id) && $(id).closest(".ai-make");
    if (mode === "cards") { [row("#aiQuiz"), row("#aiCase")].forEach(r => { if (r) r.hidden = true; }); $("#aiQuiz").checked = false; $("#aiCase").checked = false; }
    else { const r = row("#aiCards"); if (r) r.hidden = true; $("#aiCards").checked = false; $("#aiQuiz").checked = true; }
  }
  const status = $("#aiStatus"), srcList = $("#aiSrcs");
  const drawSrcs = () => {
    const total = job.sources.reduce((s, x) => s + aiSourceBytes(x), 0);
    srcList.innerHTML = job.sources.map((s, i) => `<li><span class="ficon k-${s.kind === "PDF" ? "pdf" : s.kind === "Image" ? "image" : "text"}" aria-hidden="true">${esc(s.kind === "Slides" ? "PPT" : s.kind === "Document" ? "DOC" : s.kind === "Image" ? "IMG" : s.kind === "PDF" ? "PDF" : "TXT")}</span><span class="nm">${esc(s.name)}</span><span class="mini">${s.part.text ? Math.round(s.size / 1000) + "k characters" : fmtSize(s.size)}</span><button type="button" class="x-btn" data-rm="${i}" aria-label="Remove ${esc(s.name)}">${CLOSE}</button></li>`).join("");
    if (total > AI_LIMIT_BYTES) status.textContent = "That's more than can be sent at once (about 13 MB of files). Remove some, or split big PDFs.";
  };
  const addFiles = async list => {
    for (const f of list) {
      status.textContent = `Reading ${f.name}…`;
      try { job.sources.push(await aiSourceFromFile(f)); status.textContent = ""; }
      catch(e) { status.textContent = e.code ? e.message : `Couldn't read ${f.name}.`; }
      drawSrcs();
    }
  };
  $("#aiPick").addEventListener("click", () => $("#aiFile").click());
  $("#aiFile").addEventListener("change", e => { const l = [...(e.target.files || [])]; e.target.value = ""; addFiles(l); });
  const drop = $("#aiDrop");
  ["dragover", "dragenter"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", e => { const l = [...((e.dataTransfer && e.dataTransfer.files) || [])]; if (l.length) addFiles(l); });
  const fromFiles = $("#aiFromFiles");
  if (fromFiles) fromFiles.addEventListener("change", async () => {
    const f = state.files[fromFiles.value]; fromFiles.value = ""; if (!f) return;
    status.textContent = `Getting ${f.name}…`;
    try { const bytes = await fileBytes(f), n0 = job.sources.length; await addFiles([new File([bytes], fileNameOf(f), {type: fileTypeOf(f)})]); if (job.sources.length > n0) job.sources[job.sources.length - 1].origin = {k: "file", id: f.id}; }
    catch(e) { status.textContent = `Couldn't get ${f.name}${navigator.onLine === false ? " while offline" : ""}.`; }
  });
  srcList.addEventListener("click", e => { const b = e.target.closest("[data-rm]"); if (b) { job.sources.splice(Number(b.dataset.rm), 1); drawSrcs(); status.textContent = ""; } });
  const drawRecent = () => {
    const r = aiRecentStyles(), box = $("#aiRecent");
    box.innerHTML = r.length ? `<span class="mini" style="align-self:center">Recent:</span>` + r.map((t, i) => `<span class="chip" style="display:inline-flex;gap:4px;align-items:center"><button type="button" data-recent="${i}" style="all:unset;cursor:pointer" title="${esc(t)}">${esc(t.length > 44 ? t.slice(0, 43) + "…" : t)}</button><button type="button" data-forget="${i}" style="all:unset;cursor:pointer;opacity:.6" aria-label="Forget this style">×</button></span>`).join("") : "";
  };
  drawRecent();
  $("#aiRecent").addEventListener("click", e => {
    const r = aiRecentStyles(), u = e.target.closest("[data-recent]"), f = e.target.closest("[data-forget]");
    if (u && r[Number(u.dataset.recent)]) { $("#aiStyle").value = r[Number(u.dataset.recent)]; $("#aiStyle").focus(); }
    if (f && r[Number(f.dataset.forget)]) { aiForgetStyle(r[Number(f.dataset.forget)]); drawRecent(); }
  });
  if (deck && deck.aiStyle) $("#aiStyle").value = deck.aiStyle;
  $("#aiGo").addEventListener("click", async () => {
    if (job.busy) return;
    const pasted = $("#aiPaste").value.trim();
    const sources = job.sources.slice(), viaLink = !!(window.SBLINKCARDS && mode !== "quiz" && SBLINKCARDS.claims(dlg));
    if (pasted) sources.push({name: "Pasted notes", kind: "Text", size: pasted.length, part: {text: "Pasted notes:\n\n" + pasted}});
    if (!sources.length && !viaLink) { status.textContent = "Add at least one file, or paste some notes."; return; }
    if (sources.reduce((s, x) => s + aiSourceBytes(x), 0) > AI_LIMIT_BYTES) { status.textContent = "That's more than can be sent at once. Remove some files, or split big PDFs."; return; }
    const wantCards = $("#aiCards").checked, wantQuiz = $("#aiQuiz").checked, wantCase = $("#aiCase").checked;
    if (!wantCards && !wantQuiz && !wantCase) { status.textContent = "Pick flashcards, a quiz, case studies, or a mix."; return; }
    const val = n => (dlg.querySelector(`input[name=${n}]:checked`) || {}).value;
    const custom = $("#aiStyle").value.trim(), picks = $$(".ai-style-sel", dlg).map(s => s.value).filter(v => v !== "").map(Number);
    const {style, name: styleName} = aiComposeStyle(custom, picks), cId = deck ? deck.courseId : ($("#aiCourse") ? $("#aiCourse").value : "");
    if (viaLink) { SBLINKCARDS.run({deck, courseId: cId, mode, job, keepKey: keyK, files: job.sources.slice(), pasted, style, styleName, custom, difficulty: val("aiDiff"), cards: wantCards, quiz: wantQuiz, cases: wantCase, caseCount: val("aiCaseN") || "1", caseStyle: $("#aiCaseStyle") ? $("#aiCaseStyle").value : "auto", cardCount: val("aiCardN") || "auto", quizCount: val("aiQuizN") || "10"}); return; }
    job.busy = true; const go = $("#aiGo"); go.disabled = true; go.classList.add("busy");
    const ac = typeof AbortController === "function" ? new AbortController() : null;
    job.ac = ac;
    status.innerHTML = `<span class="ai-spin" aria-hidden="true"></span> ${esc(aiModelName(aiCfg().provider, aiCfg().model))} is reading your material and writing ${[wantCards && "flashcards", wantQuiz && "a quiz", wantCase && "case studies"].filter(Boolean).join(", ").replace(/, ([^,]*)$/, " and $1")}. This usually takes 20 to 60 seconds…`;
    aiShowStatus(status);
    try {
      const r = await aiMakeStudySet({sources, style, difficulty: val("aiDiff"), cards: wantCards, quiz: wantQuiz, cases: wantCase, caseCount: val("aiCaseN") || "1", caseStyle: $("#aiCaseStyle") ? $("#aiCaseStyle").value : "auto", cardCount: val("aiCardN") || "auto", quizCount: val("aiQuizN") || "10", courseName: courseOf(cId) ? courseOf(cId).name : "", signal: ac && ac.signal}, m => { status.textContent = m; });
      if (ac && ac.signal.aborted) return;
      if (!r.cards.length && !r.questions.length && !r.cases.length) throw aiErr("empty", "The AI couldn't make anything from that material. Try adding more content, or a PDF version.");
      aiRememberStyle(custom);
      job.busy = false;
      const ctx = {deck, courseId: cId, style, styleName, sources: sources.map(s => s.name), origins: sources.map(s => s.origin).filter(Boolean), mode, keepKey: keyK};
      sheetReady(keyK, () => aiReviewSheet(r, ctx), aiReadyMsg(r));
    } catch(e) {
      if (e && e.code === "cancelled") return;
      console.warn(e); status.textContent = e.code ? e.message : "Something went wrong. Try again.";
      aiJobFailed(); aiShowStatus(status);
      job.busy = false; go.disabled = false; go.classList.remove("busy");
      if (sheetKept(keyK)) toast(`${aiWho("AI")} couldn't finish that. Open Create with AI again to see why and try again.`, null, {label: "Open", fn: () => sheetResume(keyK)}, {error: true});
    }
  });
}
// What a finished set is called in the toast when its sheet was set aside
function aiReadyMsg(r){
  const n = (r.cards || []).length, q = (r.questions || []).length, c = (r.cases || []).length;
  const bits = [n && `${n} flashcard${n === 1 ? "" : "s"}`, q && `${q} quiz question${q === 1 ? "" : "s"}`, c && `${c} case stud${c === 1 ? "y" : "ies"}`].filter(Boolean);
  return `Your ${bits.join(" and ") || "study set"} ${bits.length === 1 && /^1 /.test(bits[0]) ? "is" : "are"} ready to review`;
}
function aiReviewSheet(r, ctx){
  const cards = r.cards.slice(), qs = r.questions.slice(), cs = (r.cases || []).slice();
  const decks = deckListArr();
  const quizOnly = !ctx.deck && !cards.length;
  const defName = ctx.deck ? ctx.deck.name : (r.title || (ctx.sources[0] || "AI Study Set").replace(/\.[^.]+$/, "")).slice(0, 80);
  const typeLabel = {single: "One answer", multiple: "Select all that apply", order: "Put in order", truefalse: "True or false", short: "Short answer"};
  const nCheck = cards.filter(c => c.check).length + qs.filter(q => q.check).length;
  const chk = x => x.check ? `<span class="pill ar-chk" title="${esc(x.check)}">Check: ${esc(x.check)}</span>` : "";
  openSheet(`<form class="sheet ai-sheet">${head("Review Before Saving")}
    <div class="sheet-body">
      <p style="margin:0">${cards.length ? `<b>${cards.length}</b> flashcard${cards.length === 1 ? "" : "s"}` : ""}${cards.length && qs.length ? " and " : ""}${qs.length ? `<b>${qs.length}</b> quiz question${qs.length === 1 ? "" : "s"}` : ""}${(cards.length || qs.length) && cs.length ? " and " : ""}${cs.length ? `<b>${cs.length}</b> case stud${cs.length === 1 ? "y" : "ies"}` : ""} ready. Edit or remove anything, then save.${r.truncated ? " (The AI ran out of room, so the last few may be missing. Everything complete was kept.)" : ""}${r.partial ? ` Part of it couldn't be made: ${esc(r.partial)}` : ""}${(r.notes || []).length ? " " + esc(r.notes.join(" ")) : ""}</p>
      ${nCheck ? `<p class="mini ar-check-note" style="margin:0"><b>${nCheck}</b> item${nCheck === 1 ? "" : "s"} marked <b>Check</b>: ${nCheck === 1 ? "it says" : "they say"} something that doesn't clearly appear in your material, so verify against your notes. <button type="button" class="link-btn" id="arDropChk">Remove ${nCheck === 1 ? "it" : "them"}</button></p>` : ""}
      ${ctx.deck ? `<p class="mini" style="margin:0">Saving to <b>${esc(ctx.deck.name)}</b>.</p>` : quizOnly ? `<label class="f"><span class="lh">Course</span><select id="arQzCourse">${courseSelectHtml(ctx.courseId || "")}</select></label>` : `<div class="two"><label class="f"><span class="lh">Save To</span><select id="arDeck"><option value="">A new deck</option>${decks.map(d => `<option value="${esc(d.id)}">${esc(d.name)}</option>`).join("")}</select></label><label class="f" id="arNameL"><span class="lh">New Deck Name ${REQ}</span><input type="text" id="arName" maxlength="120" value="${esc(defName)}"></label></div>`}
      ${ctx.withSave ? `<label class="mi-check ar-qon"><input type="checkbox" id="arNoteOn"><span>Save a Summary Note Too<span class="sub">A note on your board with the main points and a link to the source.</span></span></label>` : ""}
      ${qs.length && cards.length ? `<label class="mi-check ar-qon"><input type="checkbox" id="arQuizOn" checked><span>Save the Practice Quiz Too<span class="sub">${qs.length} question${qs.length === 1 ? "" : "s"} with your cards. Turn off to save just the flashcards.</span></span></label>` : ""}
      ${qs.length ? `<label class="f ar-quiz"><span class="lh">Quiz Name</span><input type="text" id="arQuizName" maxlength="120" value="${esc(r.quizTitle || ctx.styleName || (ctx.style ? ctx.style.split(/[.:,]/)[0].slice(0, 60) : "Practice Quiz"))}"></label>` : ""}
      ${cards.length ? `<h3 class="fsec">Flashcards<span class="n" id="arCardN">${cards.length}</span></h3><ul class="ar-cards" id="arCards">${cards.map((c, i) => `<li data-i="${i}"><textarea data-f="front" rows="2" aria-label="Front">${esc(c.front)}</textarea><textarea data-f="back" rows="2" aria-label="Back">${esc(c.back)}</textarea><button type="button" class="x-btn" data-rmc="${i}" aria-label="Remove card">${CLOSE}</button>${c.source || c.check ? `<span class="mini src">${esc(c.source)} ${chk(c)}</span>` : ""}</li>`).join("")}</ul>` : ""}
      ${qs.length ? `<h3 class="fsec ar-quiz">Quiz Questions<span class="n" id="arQN">${qs.length}</span></h3><ol class="ar-qs ar-quiz" id="arQs">${qs.map((q, i) => `<li data-i="${i}"><div class="ar-q-head"><span class="pill">${typeLabel[q.type]}</span>${q.source ? `<span class="mini">${esc(q.source)}</span>` : ""}${chk(q)}<span class="spacer"></span><button type="button" class="x-btn" data-rmq="${i}" aria-label="Remove question">${CLOSE}</button></div>
          <p class="ar-stem">${esc(q.stem)}</p>
          ${q.type === "short" ? `<p class="mini">Answer: <b>${esc(q.answer)}</b></p>` : `<ul class="ar-opts">${(q.type === "order" ? q.correct.map(ix => q.options[ix]) : q.options).map((o, k) => `<li class="${q.type !== "order" && q.correct.includes(k) ? "ok" : ""}">${q.type === "order" ? `<b>${k + 1}.</b> ` : ""}${esc(o)}</li>`).join("")}</ul>`}
          ${q.rationale ? `<details><summary>Rationale</summary><p>${esc(q.rationale)}</p></details>` : ""}</li>`).join("")}</ol>` : ""}
      ${cs.length ? `<h3 class="fsec">Case Studies<span class="n" id="arCsN">${cs.length}</span></h3><ul class="ar-cases" id="arCases">${cs.map((c, i) => `<li><div class="ar-q-head"><b>${esc(c.title)}</b><span class="mini">${c.questions.length} questions</span><span class="spacer"></span><button type="button" class="x-btn" data-rmcs="${i}" aria-label="Remove case">${CLOSE}</button></div><p class="mini" style="margin:4px 0 0">${esc(c.scenario)}</p></li>`).join("")}</ul>` : ""}
    </div>
    <div class="sheet-foot"><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn" id="arBack">Start Over</button><span class="spacer"></span><button type="button" class="btn primary" id="arSave">Save</button></div>
  </form>`);
  const rmC = new Set(), rmQ = new Set(), rmCs = new Set();
  const csl = $("#arCases"); if (csl) csl.addEventListener("click", e => { const b = e.target.closest("[data-rmcs]"); if (b) { rmCs.add(Number(b.dataset.rmcs)); b.closest("li").remove(); $("#arCsN").textContent = cs.length - rmCs.size; } });
  const cl = $("#arCards"), ql = $("#arQs");
  { const qo = $("#arQuizOn"); if (qo) qo.addEventListener("change", () => { dlg.querySelectorAll(".ar-quiz").forEach(x => { x.hidden = !qo.checked; }); }); }
  if (cl) { cl.addEventListener("input", e => { const li = e.target.closest("li"); if (li && e.target.dataset.f) cards[Number(li.dataset.i)][e.target.dataset.f] = e.target.value; });
    cl.addEventListener("click", e => { const b = e.target.closest("[data-rmc]"); if (b) { rmC.add(Number(b.dataset.rmc)); b.closest("li").remove(); $("#arCardN").textContent = cards.length - rmC.size; } }); }
  if (ql) ql.addEventListener("click", e => { const b = e.target.closest("[data-rmq]"); if (b) { rmQ.add(Number(b.dataset.rmq)); b.closest("li").remove(); $("#arQN").textContent = qs.length - rmQ.size; } });
  const sel = $("#arDeck"); if (sel) sel.addEventListener("change", () => { $("#arNameL").hidden = !!sel.value; });
  const dc = $("#arDropChk"); if (dc) dc.addEventListener("click", () => {
    cards.forEach((c, i) => { if (c.check && !rmC.has(i)) { rmC.add(i); const li = $(`#arCards li[data-i="${i}"]`); if (li) li.remove(); } });
    qs.forEach((q, i) => { if (q.check && !rmQ.has(i)) { rmQ.add(i); const li = $(`#arQs li[data-i="${i}"]`); if (li) li.remove(); } });
    if ($("#arCardN")) $("#arCardN").textContent = cards.length - rmC.size; if ($("#arQN")) $("#arQN").textContent = qs.length - rmQ.size;
    dc.closest("p").remove();
  });
  // set aside like the sheet it came from: a tap outside keeps these drafts, Cancel or Save clears them
  const rvKey = ctx.keepKey || "ai-create:" + (ctx.deck ? ctx.deck.id : "");
  sheetKeep(rvKey, {name: "Review", dirty: () => true});
  $("#arBack").addEventListener("click", () => { sheetDrop(rvKey); if (ctx.fromCards) quizSheet(ctx.fromCards); else aiStudySheet(ctx.deck ? ctx.deck.id : null, ctx.mode); });
  $("#arSave").addEventListener("click", () => {
    const qOn = !$("#arQuizOn") || $("#arQuizOn").checked;
    const keepC = cards.filter((c, i) => !rmC.has(i) && c.front.trim() && c.back.trim()), keepQ = qOn ? qs.filter((q, i) => !rmQ.has(i)) : [], keepCs = cs.filter((c, i) => !rmCs.has(i));
    if (!keepC.length && !keepQ.length && !keepCs.length) { toast("Nothing left to save"); return; }
    let d;
    if (ctx.deck || (sel && sel.value)) d = clone(state.decks[ctx.deck ? ctx.deck.id : sel.value]);
    else if (quizOnly) { const qc = $("#arQzCourse"); d = normDeck({id: uid(), created: Date.now(), quizOnly: true, name: (($("#arQuizName") && $("#arQuizName").value.trim()) || (keepCs[0] && keepCs[0].title) || "Practice Quiz").slice(0, 120), courseId: qc ? qc.value : ctx.courseId || ""}); }
    else { const nm = $("#arName").value.trim(); if (!nm) { toast("Give the new deck a name"); $("#arName").focus(); return; } d = normDeck({id: uid(), created: Date.now(), name: nm, courseId: ctx.courseId || ""}); }
    if (!d) return;
    d.cards = d.cards.concat(keepC.map(c => ({id: uid(), front: c.front.trim(), back: c.back.trim(), box: 0, due: "", seen: 0, right: 0, wrong: 0, ai: true, src: c.source || ""})));
    const qzId = uid();
    if (keepQ.length) d.aiQuizzes = (d.aiQuizzes || []).concat({id: qzId, title: uniqueQuizTitle(($("#arQuizName") && $("#arQuizName").value.trim()) || "Practice Quiz"), style: ctx.style || "", created: Date.now(), sources: ctx.sources, questions: keepQ, results: []});
    keepCs.forEach(c => { d.aiQuizzes = (d.aiQuizzes || []).concat(Object.assign({id: uid(), style: ctx.style || "", created: Date.now(), sources: ctx.sources, results: [], kind: "case"}, c)); });
    if (ctx.style) d.aiStyle = ctx.style;
    if (window.SBLINKED && ctx.origins && ctx.origins.length) SBLINKED.stamp(d, ctx.origins.map(o => SBLINKED.origin(o.k, o.id)), d.cards.slice(d.cards.length - keepC.length));
    d.updated = Date.now();
    sheetDrop(rvKey); dlg.close(); ui.tab = "flashcards"; ui.fc = null;
    if (!keepC.length) { ui.deckId = null; rvSet("quizzes"); } else { ui.deckId = d.id; rvSet("cards"); }
    (ctx.withSave && $("#arNoteOn") && $("#arNoteOn").checked ? (x, l) => applyChanges([{kind: "deck", id: x.id, after: x}].concat(ctx.withSave(x) || []), l) : saveDeck)(d, `Saved ${keepC.length ? keepC.length + " card" + (keepC.length === 1 ? "" : "s") : ""}${keepC.length && keepQ.length ? " and " : ""}${keepQ.length ? "a " + keepQ.length + "-question quiz" : ""}${(keepC.length || keepQ.length) && keepCs.length ? " and " : ""}${keepCs.length ? keepCs.length + " case stud" + (keepCs.length === 1 ? "y" : "ies") : ""} to ${d.name}`);
    if (ctx.fromCards && keepQ.length && !keepC.length) { startAiQuiz(d.id, qzId); return; }
    window.scrollTo(0, 0);
  });
}

/* Taking an AI quiz */
function startAiQuiz(deckId, quizId, onlyIds){
  const d = state.decks[deckId], qz = d && (d.aiQuizzes || []).find(x => x.id === quizId); if (!qz) return;
  let qs = qz.questions.filter(q => !onlyIds || onlyIds.includes(q.id)).map(q => Object.assign({}, q));
  if (qz.kind !== "case") qs = shuffle(qs);
  ui.explain = null;
  ui.tab = "flashcards"; rvSet("quizzes"); ui.fc = {mode: "aiquiz", deckIds: [deckId], deckId, quizId, qs, i: 0, ans: [], pick: [], order: null};
  render(); window.scrollTo(0, 0);
  setTimeout(() => { const w = $("#aiWritten"); if (w) w.focus(); }, 30);
}
function aiAnswer(given, pre){
  const f = ui.fc, q = f.qs[f.i]; if (!q || f.ans[f.i]) return;
  let correct = false, partial = null;
  if (q.type === "single" || q.type === "truefalse") correct = given[0] === q.correct[0];
  else if (q.type === "multiple") { const g = new Set(given); correct = g.size === q.correct.length && q.correct.every(i => g.has(i)); partial = {hit: q.correct.filter(i => g.has(i)).length, of: q.correct.length, extra: given.filter(i => !q.correct.includes(i)).length}; }
  else if (q.type === "order") correct = given.length === q.correct.length && given.every((v, k) => v === q.correct[k]);
  else { const r = pre || gradeWritten(given, q.answer); correct = r.correct; partial = r.close ? {close: true} : r.partly ? {partly: true} : null; if (r.ai) f.aiFb = Object.assign(f.aiFb || {}, {[f.i]: r.ai}); }
  f.ans[f.i] = {given, correct, partial};
  render();
}
function aiFinish(){
  const f = ui.fc; f.done = true;
  const d = clone(state.decks[f.deckId]); if (!d) return;
  const right = f.ans.filter(a => a && a.correct).length, total = f.qs.length;
  const qz = (d.aiQuizzes || []).find(x => x.id === f.quizId);
  if (qz) {
    qz.results = (qz.results || []).concat({at: Date.now(), score: right, total}).slice(-20);
    f.qs.forEach((q, i) => { const o = qz.questions.find(x => x.id === q.id); const a = f.ans[i]; if (o && a) { o.tries = (o.tries || 0) + 1; if (!a.correct) o.miss = (o.miss || 0) + 1; } });
  }
  d.quizzes = d.quizzes.concat({at: Date.now(), score: right, total, ai: true}).slice(-20);
  saveDeck(d, null);
  if (total > 0 && right / total >= 0.8) { try { celebrate("check"); } catch (e) {} }
  if (quizPasses(right, total) && !(!qz || f.qs.length !== qz.questions.length)) earnBump("q");
  fire("ai-quiz-done", {deckId: f.deckId, quizId: f.quizId, right, total, partial: !qz || f.qs.length !== qz.questions.length});
}
function viewAiQuiz(){
  const f = ui.fc, q = f.qs[f.i], a = f.ans[f.i], d = state.decks[f.deckId];
  const qz = d && (d.aiQuizzes || []).find(x => x.id === f.quizId);
  if (!q) {
    if (!f.done) aiFinish();
    const right = f.ans.filter(x => x && x.correct).length, total = f.qs.length, pct = total ? Math.round(right / total * 100) : 0;
    const missed = f.qs.map((x, i) => ({x, a: f.ans[i]})).filter(y => !(y.a && y.a.correct));
    const msg = pct >= 90 ? "Excellent. You know this material." : pct >= 75 ? "Solid. Read the rationales for the ones you missed." : pct >= 50 ? "Getting there. Review the rationales, then retry the missed questions." : "Keep going. Study the material and the rationales below, then try again.";
    const ansText = x => x.type === "short" ? x.answer : x.type === "order" ? x.correct.map((ix, k) => `${k + 1}. ${x.options[ix]}`).join("  ") : x.correct.map(i => x.options[i]).join("; ");
    return `<div class="view-head"><h2>${esc(qz ? qz.title : "Quiz")} Results</h2></div>
      <section class="done-card">
        <p class="big-num">${right}<span> / ${total} correct, ${pct}%</span></p>
        <div class="score-bar"><i style="width:${pct}%"></i></div>
        <p>${msg}</p>
        <div class="row-actions">${missed.length ? `<button class="btn primary" data-act="ai-retry-missed">Retry the ${missed.length} Missed</button>` : ""}<button class="btn ${missed.length ? "" : "primary"}" data-act="ai-retake">Retake Whole Quiz</button><button class="btn" data-act="fc-exit">Done</button></div>
      </section>
      ${missed.length ? `<h3 class="fsec">Review</h3><ul class="miss-list">${missed.map(y => `<li><span class="q">${esc(y.x.stem)}</span><span class="a">Answer: <b>${esc(ansText(y.x))}</b></span>${y.x.rationale ? `<span class="mini">${esc(y.x.rationale)}</span>` : ""}</li>`).join("")}</ul>` : ""}`;
  }
  const letters = "ABCDEFGH";
  let body = "";
  if (q.type === "single" || q.type === "truefalse") {
    body = `<div class="mc ${q.type === "truefalse" ? "two-col" : ""}">${q.options.map((o, i) => {
      const cls = a ? (q.correct.includes(i) ? "right" : a.given.includes(i) ? "wrong" : "") : "";
      return `<button class="opt ${cls}" data-act="ai-pick" data-i="${i}" ${a ? "disabled" : ""}><span class="key">${q.type === "truefalse" && /^(true|false)$/i.test(String(o).trim()) ? String(o).trim()[0].toUpperCase() : letters[i]}</span><span>${esc(o)}${a && q.notes[i] ? `<small class="opt-note">${esc(q.notes[i])}</small>` : ""}</span></button>`; }).join("")}</div>`;
  } else if (q.type === "multiple") {
    const pick = a ? a.given : f.pick;
    body = `<div class="mc sata">${q.options.map((o, i) => {
      const on = pick.includes(i), isC = q.correct.includes(i);
      const cls = a ? (isC && on ? "right" : isC ? "missed" : on ? "wrong" : "") : on ? "on" : "";
      return `<button class="opt sa ${cls}" data-act="ai-toggle" data-i="${i}" aria-pressed="${on}" ${a ? "disabled" : ""}><span class="sa-box" aria-hidden="true"></span><span>${esc(o)}${a && q.notes[i] ? `<small class="opt-note">${esc(q.notes[i])}</small>` : ""}</span></button>`; }).join("")}</div>
      ${a ? "" : `<div class="row-actions"><button class="btn primary" data-act="ai-submit" ${pick.length ? "" : "disabled"}>Submit Answer</button></div>`}`;
  } else if (q.type === "order") {
    if (!f.order) f.order = q.options.map((o, i) => i);
    const seq = a ? a.given : f.order;
    body = `<ol class="order-list">${seq.map((ix, k) => {
      const cls = a ? (q.correct[k] === ix ? "right" : "wrong") : "";
      return `<li class="${cls}"><span class="num">${k + 1}</span><span class="txt">${esc(q.options[ix])}</span>${a ? "" : `<span class="mv"><button type="button" class="icon-btn sm" data-act="ai-up" data-i="${k}" aria-label="Move up" ${k === 0 ? "disabled" : ""}>↑</button><button type="button" class="icon-btn sm" data-act="ai-down" data-i="${k}" aria-label="Move down" ${k === seq.length - 1 ? "disabled" : ""}>↓</button></span>`}</li>`; }).join("")}</ol>
      ${a ? `<p class="mini">Correct order: ${q.correct.map((ix, k) => `${k + 1}. ${esc(q.options[ix])}`).join("  ")}</p>` : `<div class="row-actions"><button class="btn primary" data-act="ai-submit">Submit Order</button></div>`}`;
  } else {
    body = `<form class="written" id="aiForm"><label class="f">Your answer<input type="text" id="aiWritten" autocomplete="off" ${a ? `value="${esc(a.given)}" disabled` : ""} data-noenter></label>${a ? "" : `<button type="submit" class="btn primary${aiReady() ? " ai-btn" : ""}">${aiReady() ? AI_ICON + " " : ""}Check</button>`}</form>`;
  }
  const verdict = a ? (a.correct ? (a.partial && a.partial.close ? "Close enough, counted as correct." : "Correct.") : q.type === "multiple" && a.partial ? `Not quite. You found ${a.partial.hit} of ${a.partial.of} correct answers${a.partial.extra ? ` and picked ${a.partial.extra} wrong one${a.partial.extra === 1 ? "" : "s"}` : ""}.` : "Not quite.") : "";
  const aiFb = f.aiFb && f.aiFb[f.i];
  const fb = a ? `<div class="feedback ${a.correct ? "ok" : "no"}" role="status"><b>${a.partial && a.partial.partly ? "Partly right." : verdict}</b>${q.type === "short" && !a.correct ? ` The answer is <span class="ans">${esc(q.answer)}</span>. <button class="link-btn" data-act="ai-override">I Was Right</button>` : ""}${aiFb ? `<p class="ai-fb">${AI_ICON}${esc(aiFb)}</p>` : ""}</div>
      ${q.rationale ? `<div class="rationale"><span class="face-label">Rationale</span><p>${esc(q.rationale)}</p>${q.source ? `<span class="mini">From ${esc(q.source)}</span>` : ""}</div>` : ""}
      ${explainHtml(`q|${f.deckId}|${f.quizId}|${q.id}`, q.type === "short" ? a.given : "")}
      <div class="row-actions"><button class="btn primary" data-act="ai-next" id="aiNext">${f.i + 1 < f.qs.length ? "Next Question" : "See Results"}</button></div>` : "";
  const label = {single: "Choose the best answer", truefalse: "True or false", multiple: "Select all that apply", order: "Put these in the correct order", short: "Type your answer"}[q.type];
  return `<div class="view-head"><h2>${esc(qz ? qz.title : "Quiz")}</h2><span class="mini">Question ${f.i + 1} of ${f.qs.length}</span><button class="btn small" data-act="fc-exit">Quit</button></div>
    <div class="progress"><i style="width:${Math.round(f.i / f.qs.length * 100)}%"></i></div>
    <section class="q-card ai-q" style="--c:${esc(colorOf(d ? d.courseId : ""))}">
      <span class="face-label">${label}${q.topic ? ` · ${esc(q.topic)}` : ""}</span>
      ${qz && qz.kind === "case" ? `<details class="case-box" ${f.i === 0 ? "open" : ""}><summary>${esc(qz.title)}</summary><p>${esc(qz.scenario)}</p>${f.qs.slice(0, f.i).filter(x => x.update).map(x => `<p class="case-prev">${esc(x.update)}</p>`).join("")}</details>` : ""}
      ${q.update ? `<div class="case-update"><span class="face-label">New Information</span><p>${esc(q.update)}</p></div>` : ""}
      <p class="q-prompt">${esc(q.stem)}</p>
      ${f.grading ? `<p class="status-msg"><span class="ai-spin" aria-hidden="true"></span> Checking your answer…</p>` : ""}
      ${body}${fb}
    </section>`;
}
function aiQuizAction(act, el){
  const f = ui.fc;
  switch (act) {
    case "fc-ai": aiStudySheet(el.dataset.id || null); return true;
    case "ai-quiz-start": startAiQuiz(el.dataset.deck, el.dataset.id); return true;
    case "ai-quiz-del": {
      const d = clone(state.decks[el.dataset.deck]); if (!d) return true;
      const qz = (d.aiQuizzes || []).find(x => x.id === el.dataset.id);
      d.aiQuizzes = (d.aiQuizzes || []).filter(x => x.id !== el.dataset.id);
      if (ui.qzOpen === d.id + ":" + el.dataset.id) ui.qzOpen = null;
      saveDeck(d, `Deleted ${qz ? qz.title : "quiz"}`); return true;
    }
  }
  if (!f || f.mode !== "aiquiz") return false;
  const q = f.qs[f.i];
  switch (act) {
    case "ai-pick": aiAnswer([Number(el.dataset.i)]); return true;
    case "ai-toggle": { const i = Number(el.dataset.i); f.pick = f.pick.includes(i) ? f.pick.filter(x => x !== i) : f.pick.concat(i); render(); return true; }
    case "ai-up": case "ai-down": { const k = Number(el.dataset.i), j = act === "ai-up" ? k - 1 : k + 1; if (j >= 0 && j < f.order.length) { [f.order[k], f.order[j]] = [f.order[j], f.order[k]]; } render(); setTimeout(() => { const b = $(`[data-act="${act}"][data-i="${j}"]`); if (b && !b.disabled) b.focus(); }, 10); return true; }
    case "ai-submit": if (q.type === "multiple") { if (f.pick.length) aiAnswer(f.pick.slice()); } else if (q.type === "order") aiAnswer(f.order.slice()); return true;
    case "ai-next": f.i++; f.pick = []; f.order = null; render(); setTimeout(() => { const w = $("#aiWritten"); if (w) w.focus(); }, 20); return true;
    case "ai-override": { const a = f.ans[f.i]; if (a) { a.correct = true; a.partial = {close: true}; render(); } return true; }
    case "ai-retry-missed": { const ids = f.qs.filter((x, i) => !(f.ans[i] && f.ans[i].correct)).map(x => x.id); startAiQuiz(f.deckId, f.quizId, ids); return true; }
    case "ai-retake": startAiQuiz(f.deckId, f.quizId); return true;
  }
  return false;
}
document.addEventListener("submit", e => {
  if (e.target.id !== "aiForm") return;
  e.preventDefault(); const v = $("#aiWritten").value; if (!v.trim()) { $("#aiWritten").focus(); return; }
  const f = ui.fc, q = f && f.qs[f.i]; if (!q || f.grading) return;
  f.grading = true; render();
  smartGrade(q.stem, q.answer, v).then(r => { f.grading = false; if (ui.fc === f) { aiAnswer(v, r); setTimeout(() => { const n = $("#aiNext"); if (n) n.focus(); }, 30); } });
});
document.addEventListener("keydown", e => {
  if (ui.tab !== "flashcards" || !ui.fc || ui.fc.mode !== "aiquiz" || dlg.open || (e.target.closest && e.target.closest("input,textarea,select"))) return;
  const f = ui.fc, q = f.qs[f.i]; if (!q) return;
  // Ctrl, Cmd and Alt shortcuts belong to the browser; Enter on a focused button presses that button
  if (e.ctrlKey || e.metaKey || e.altKey || (e.key === "Enter" && e.target.closest && e.target.closest("button,a,[role=button],summary") && !e.target.closest("#aiNext"))) return;
  if (f.ans[f.i] && e.key === "Enter") { e.preventDefault(); e.stopPropagation(); aiQuizAction("ai-next", {dataset: {}}); return; }
  if (f.ans[f.i]) return;
  if (q.type === "truefalse" && /^[tf]$/i.test(e.key)) {
    const want = e.key.toLowerCase() === "t" ? /^true$/i : /^false$/i, i = q.options.findIndex(o => want.test(String(o).trim()));
    if (i >= 0) { e.preventDefault(); e.stopPropagation(); aiAnswer([i]); return; }
  }
  const k = "123456".indexOf(e.key) >= 0 ? Number(e.key) - 1 : "abcdef".indexOf(e.key.toLowerCase());
  if (k >= 0 && k < q.options.length && (q.type === "single" || q.type === "truefalse")) { e.preventDefault(); e.stopPropagation(); aiAnswer([k]); }
  else if (k >= 0 && k < q.options.length && q.type === "multiple") { e.preventDefault(); e.stopPropagation(); aiQuizAction("ai-toggle", {dataset: {i: String(k)}}); }
}, true);
// A deck's page
function deckAiBar(d){
  const w = weakSpots([d.id]), nq = (d.aiQuizzes || []).filter(q => q && q.questions && q.questions.length).length;
  if (inPreview() && !w.n && !nq) return "";
  const btns = `<span class="aiq-btns">${w.n ? `<button class="btn small" data-act="fc-weak" data-id="${esc(d.id)}">Weak Spots <span class="n-badge">${w.n}</span></button>` : ""}${inPreview() ? "" : `<button class="btn small ai-btn" data-act="fc-ai-cards" data-id="${esc(d.id)}">${AI_ICON} Create with ${esc(aiWho("AI"))}</button>`}</span>`;
  return `<section class="aiq-sec"><div class="ai-callout">${AI_ICON}<span>${inPreview() ? "" : `Upload lecture slides or notes and let ${esc(aiWho("AI"))} write flashcards for this deck.`}${nq ? ` ${nq === 1 ? "Its quiz is" : `Its ${nq} quizzes are`} in <button class="link-btn" data-act="rv-view" data-id="quizzes">Quizzes</button>.` : ""}</span>${btns}</div></section>`;
}
function aiQuizzesHtml(d){
  const list = d.aiQuizzes || [];
  const w = weakSpots([d.id]);
  const btn = `<span class="aiq-btns">${w.n ? `<button class="btn small" data-act="fc-weak" data-id="${esc(d.id)}">Weak Spots <span class="n-badge">${w.n}</span></button>` : ""}${d.cards.length >= 3 && !inPreview() ? `<button class="btn small ai-btn" data-act="fc-case" data-id="${esc(d.id)}">${AI_ICON} Case Study from Cards</button>` : ""}<button class="btn small ai-btn" data-act="fc-ai" data-id="${esc(d.id)}">${AI_ICON} Create with ${esc(aiWho("AI"))}</button></span>`;
  if (!list.length) return `<div class="ai-callout">${AI_ICON}<span>Upload lecture slides or notes and let ${esc(aiWho("AI"))} write flashcards and practice questions in the style you want, like an AP exam or your professor's midterm, with rationales.</span>${btn}</div>`;
  return `<h3 class="fsec">${AI_ICON}Practice Quizzes<span class="n">${list.length}</span><span class="spacer"></span>${btn}</h3>
    <ul class="aiq-list">${list.slice().reverse().map(qz => { const last = (qz.results || [])[qz.results.length - 1];
      return `<li class="${qz.kind === "case" ? "is-case" : ""}"><div class="aiq-main"><b>${qz.kind === "case" ? `<span class="pill">Case Study</span> ` : ""}${esc(qz.title)}</b><span class="mini">${qz.questions.length} questions${qz.style ? " · " + esc(qz.style.slice(0, 80)) + (qz.style.length > 80 ? "…" : "") : ""}${last ? ` · last score ${last.score}/${last.total}` : ""}</span></div>
        <button class="btn small primary" data-act="ai-quiz-start" data-deck="${esc(d.id)}" data-id="${esc(qz.id)}">Start</button><button class="x-btn" data-act="ai-quiz-del" data-deck="${esc(d.id)}" data-id="${esc(qz.id)}" aria-label="Delete ${esc(qz.title)}">${CLOSE}</button></li>`; }).join("")}</ul>`;
}

/* AI syllabus reading */
const SYL_SCHEMA = {type: "OBJECT", properties: {
  course: {type: "OBJECT", properties: {
    name: {type: "STRING"}, code: {type: "STRING"}, instructor: {type: "STRING"}, term: {type: "STRING"},
    room: {type: "STRING"}, officeHours: {type: "STRING"},
    meetings: {type: "ARRAY", items: {type: "OBJECT", properties: {
      kind: {type: "STRING", enum: ["Lecture", "Lab", "Discussion", "Tutorial", "Office Hours", "Other"]},
      days: {type: "ARRAY", items: {type: "INTEGER"}, description: "0=Sunday, 1=Monday ... 6=Saturday"},
      start: {type: "STRING", description: "24-hour HH:MM"}, end: {type: "STRING", description: "24-hour HH:MM"}, where: {type: "STRING"}}, required: ["kind", "days", "start", "end"]}},
    links: {type: "ARRAY", items: {type: "OBJECT", properties: {label: {type: "STRING"}, url: {type: "STRING"}}, required: ["url"]}}}, required: ["name"]},
  items: {type: "ARRAY", items: {type: "OBJECT", properties: {
    title: {type: "STRING"}, type: {type: "STRING", enum: ["Assignment", "Exam", "Quiz", "Reading", "Project", "Lab", "Other"]},
    due: {type: "STRING", description: "YYYY-MM-DD, or empty if the syllabus gives no date"}, time: {type: "STRING", description: "24-hour HH:MM, or empty"},
    start: {type: "STRING", description: "YYYY-MM-DD when the work is assigned or opens, or empty"},
    weight: {type: "NUMBER", description: "Percent of the final course grade this single item is worth, or 0 if unknown"},
    hours: {type: "NUMBER", description: "Realistic hours of work for a typical student (0 for exams, quizzes and items without work)"},
    location: {type: "STRING"}, reading: {type: "STRING", description: "For readings: what to read"},
    note: {type: "STRING", description: "The syllabus line this came from, shortened"},
    sure: {type: "BOOLEAN", description: "false if the date or details had to be guessed"}}, required: ["title", "type", "due"]}},
  rules: {type: "OBJECT", properties: {
    drops: {type: "ARRAY", items: {type: "OBJECT", properties: {category: {type: "STRING", enum: ["Assignment", "Exam", "Quiz", "Reading", "Project", "Lab", "Other"]}, count: {type: "INTEGER", description: "How many of the lowest are dropped"}}, required: ["category", "count"]}},
    bonus: {type: "NUMBER", description: "The most extra credit, in percentage points, that can be added to the final course grade, or 0"}}}},
  required: ["course", "items"]};
// The AI's grading rules -> the Grades page's form, or null
function aiSylRules(r){
  r = r && typeof r === "object" ? r : {};
  const seen = new Set(), drops = (Array.isArray(r.drops) ? r.drops : []).map(d => ({cat: String((d && d.category) || ""), n: Math.floor(Number(d && d.count)), src: "syllabus"}))
    .filter(d => TYPES.includes(d.cat) && d.cat !== "Study" && d.n >= 1 && d.n <= 10 && !seen.has(d.cat) && seen.add(d.cat));
  const b = Number(r.bonus), bonus = b > 0 && b <= 10 ? {pts: Math.round(b * 100) / 100, got: 0, src: "syllabus"} : null;
  return drops.length || bonus ? {drops, bonus} : null;
}
async function aiReadSyllabus(parts, onStatus, signal){
  const today = todayISO();
  const res = await aiCall({task: "syllabus", maxTokens: 32000, temperature: 0.1, onStatus, signal, schema: SYL_SCHEMA, parts: parts.concat({text: `Today is ${today}. Read this course syllabus and extract the course details and every dated deliverable.`}),
    system: `You extract structured data from college course syllabi for a student planner. Be precise and complete.
Rules:
- One item per graded deliverable or required reading with a date: each homework, problem set, quiz, exam (midterms and the final), lab or lab report, project milestone, paper, presentation, and each dated reading assignment. Do not list holidays, "no class" days, add/drop deadlines, office hours, or policy text as items.
- Resolve every date to YYYY-MM-DD. Use the term and year stated in the syllabus; if none, use the school term that contains or follows ${today}. Resolve "Week 5 Friday", "Class 12", or dates in schedule tables using the course calendar and meeting days.
- Titles are short and specific, like "Homework 3", "Midterm 1", "Lab 4 Report", "Read Ch. 5".
- time: due time or exam start time in 24-hour HH:MM if given. For exams held in class, use the class start time.
- weight: the percent of the final grade for that single item. If a category is worth a total, divide it evenly across every item in it, counting any that will be dropped (e.g. "Quizzes 20%, 10 quizzes, lowest 2 dropped" is 2% each). Use 0 if unknown.
- rules: the grading policy's rules. drops: each "lowest N dropped" rule, with the category it applies to and how many are dropped (use Exam only when midterms or tests are dropped). Leave out rules where a later mark replaces an earlier one. bonus: the most extra credit, in percentage points, that can be added to the final course grade; 0 if there is none or it only counts inside one assignment or exam.
- meetings: every regular class meeting (lecture, lab, discussion, tutorial) and the instructor's office hours, with days as numbers (0=Sunday) and 24-hour times.
- sure=false when you had to infer the date.
Return JSON only.`});
  const d = res.data || {}, c = d.course || {};
  // a real calendar day: "2026-02-30" is left blank, not saved
  const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s || "") && !isNaN(Date.parse(s + "T00:00:00Z")) && new Date(s + "T00:00:00Z").toISOString().slice(0, 10) === s, isTime = s => /^([01]\d|2[0-3]):[0-5]\d$/.test(s || "");
  const meetings = (Array.isArray(c.meetings) ? c.meetings : []).map(m => ({id: uid(), kind: MEET_KINDS.includes(m.kind) ? m.kind : "Other", days: [...new Set((m.days || []).map(Number).filter(x => x >= 0 && x <= 6))].sort(), start: isTime(m.start) ? m.start : "", end: isTime(m.end) ? m.end : "", where: String(m.where || "").trim()})).filter(m => m.days.length && m.start && m.end && m.end > m.start);
  const course = {name: String(c.name || "").trim(), code: String(c.code || "").trim(), instructor: String(c.instructor || "").trim(), room: String(c.room || "").trim(), office: String(c.officeHours || "").trim(),
    schedule: meetingsSummary(meetings), meetings, links: (Array.isArray(c.links) ? c.links : []).map(l => ({label: String(l.label || "Link").trim() || "Link", url: String(l.url || "").trim()})).filter(l => safeUrl(l.url)).slice(0, 8)};
  const items = (Array.isArray(d.items) ? d.items : []).map(i => ({title: String(i.title || "").trim(), type: TYPES.includes(i.type) ? i.type : "Other", due: isDate(i.due) ? i.due : "", start: isDate(i.start) ? i.start : "", time: isTime(i.time) ? i.time : "",
    weight: Number(i.weight) > 0 && Number(i.weight) <= 100 ? Math.round(Number(i.weight) * 10) / 10 : null, hours: Number(i.hours) > 0 && Number(i.hours) < 200 ? Math.round(Number(i.hours) * 4) / 4 : null, source: i.sure === false ? "ai-low" : "ai", note: String(i.note || i.title || "").slice(0, 300), hasDue: true,
    location: String(i.location || "").trim(), reading: String(i.reading || "").trim()})).filter(i => i.title);
  const gate = aiGateSyllabus(items, today); items.length = 0; gate.items.forEach(i => items.push(i));
  items.sort((a, b) => (a.due || "9999") < (b.due || "9999") ? -1 : (a.due || "9999") > (b.due || "9999") ? 1 : 0);
  const gateNote = [gate.fixed ? `${gate.fixed} date${gate.fixed === 1 ? " looked" : "s looked"} wrong (far from the rest) and ${gate.fixed === 1 ? "was" : "were"} left blank for you to fill in.` : "", gate.dups ? `${gate.dups} repeated item${gate.dups === 1 ? " was" : "s were"} merged.` : ""].filter(Boolean).join(" ");
  return {course, items, term: c.term ? {label: String(c.term)} : null, weightsFound: items.some(i => i.weight != null), ai: true, gateNote, rules: aiSylRules(d.rules), truncated: !!res.truncated};
}

/* Settings: turning AI on and choosing a model */
// What Studyboard AI says about this week, for Settings
function aiProLine(){
  const t = aiProGet() || {}, when = aiProResets();
  return `Included with Pro${t.usedPct ? `: ${t.usedPct}% of this week's used` : ""}${when ? `, resets ${when}` : ""}.${t.soft && t.usedPct < 100 ? " Everyday jobs think a little less now, so the rest lasts." : ""}`;
}
/* The AI menu's usage card: this week as a percentage, and today's share, with no amounts or costs. The chip in its header
   always says where things stand; amber once everyday answers get shorter, orange when the week or the day is used up. */
const SBAI_STAR = '<svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor" aria-hidden="true"><path d="M12 4.5l1.9 5.6 5.6 1.9-5.6 1.9L12 19.5l-1.9-5.6-5.6-1.9 5.6-1.9z"/></svg>';
function aiUseCard(){
  const t = aiProGet() || {}, today = new Date().toISOString().slice(0, 10), when = aiProResets();
  const m = Math.max(0, Math.min(100, Math.round(Number(t.usedPct) || 0)));
  const dayOut = t.outDay === today, d = dayOut ? 100 : t.dayDay === today && typeof t.dayPct === "number" ? Math.max(0, Math.min(100, Math.round(t.dayPct))) : null;
  const monthOut = m >= 100, low = !monthOut && !!t.soft;
  // the server's day ends at midnight UTC: said in this person's own time
  const dayEndAt = (() => { const n = new Date(); return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + 1)); })();
  const dayEnds = (() => { try { return dayEndAt.toLocaleTimeString(undefined, {hour: "numeric", minute: "2-digit"}); } catch(e) { return ""; } })();
  // later today where they live (west of UTC), or tomorrow
  const backToday = dayEndAt.toDateString() === new Date().toDateString(), back = backToday && dayEnds ? `back at ${dayEnds}` : "back tomorrow";
  const st = monthOut ? "out" : dayOut ? "day" : low ? "warn" : "";
  const ringCls = monthOut || dayOut ? "out" : low ? "warn" : "", ringPct = monthOut || dayOut ? 100 : m;
  const chip = monthOut ? "Used up" : dayOut ? back.replace(/^b/, "B") : `${m}%`;
  const bar = (label, pct, cls, extra) => `<div class="sbai-row${extra ? " " + extra : ""}"><span>${label}</span><span class="sbai-bar${cls ? " " + cls : ""}" role="img" aria-label="${pct}% of ${label === "Today" ? "today's share" : "this week"} used"><i style="width:${pct}%"></i></span><span>${pct}%</span></div>`;
  const note = monthOut ? `Back ${when ? `<b>${esc(when)}</b>` : "next week"}. Until then, AI keeps working with your backup key below.`
    : dayOut ? `You've used today's share of Studyboard AI. It's ${esc(back)}, or keep going with your backup key below.`
    : low ? `Everyday answers are a little shorter now, so the rest lasts. Big jobs work as usual.${when ? ` The week resets <b>${esc(when)}</b>.` : ""}`
    : `Included with Pro.${when ? ` The week resets <b>${esc(when)}</b>` : ""}${d != null && dayEnds ? `${when ? ";" : ""} today's share resets at ${esc(dayEnds)}.` : when ? "." : ""}`;
  return `<div class="sbai-use${st ? " is-" + st : ""}" id="sbaiUse">
    <div class="sbai-head"><span class="sbai-ic">${SBAI_STAR}</span><b>Studyboard AI</b><span class="sbai-chip"><svg class="sbai-ring" viewBox="0 0 24 24" aria-hidden="true"><circle class="t" cx="12" cy="12" r="9"/><circle class="v${ringCls ? " " + ringCls : ""}" cx="12" cy="12" r="9" stroke-dasharray="56.5" stroke-dashoffset="${(56.5 * (1 - ringPct / 100)).toFixed(1)}"/></svg>${esc(chip)}</span></div>
    <div class="sbai-num">${m}%<small>used this week</small></div>
    <div class="sbai-rows">${bar("This week", m, monthOut ? "out" : low ? "warn" : "")}${d != null ? bar("Today", d, dayOut ? "out" : "", "today") : ""}</div>
    <p class="sbai-note">${note}</p></div>`;
}
function aiRow(){
  const on = aiReady(), c = aiCfg();
  if (on && c.provider === "anthropic" && c.model === "studyboard") { const v = ownView(); return `<div class="cap-row" style="flex-wrap:wrap"><span style="flex:1;min-width:200px;font-weight:600">${AI_ICON} AI Features<span class="sub">${aiProUser() ? "On, using Studyboard AI with your own key, matched to each job." : "On, using your Claude key in Studyboard AI Mode: Claude Haiku 5.5, matched to each job."}${v.usedPct ? ` ${v.usedPct}% of this week's limit used.` : ""}${(a => a.on ? " Automatic AI is on." : " Automatic AI is off.")(autoState())}</span></span><button class="btn small" data-act="ai-setup">Manage</button></div>`; }
  if (on && c.provider === "studyboard") return `<div class="cap-row" style="flex-wrap:wrap"><span style="flex:1;min-width:200px;font-weight:600">${AI_ICON} AI Features<span class="sub">On, using Studyboard AI. ${esc(aiProLine())}${(a => a.on ? " Automatic AI is on." : " Automatic AI is off.")(autoState())}</span></span><button class="btn small" data-act="ai-setup">Manage</button></div>`;
  return `<div class="cap-row" style="flex-wrap:wrap"><span style="flex:1;min-width:200px;font-weight:600">${AI_ICON} AI Features<span class="sub">${inPreview() ? "Available in the Studyboard app and on your website." : on ? `On, using ${esc(aiModelName(c.provider, c.model))}${c.provider === "gemini" && c.model !== "gemini-3.1-pro-preview" ? " (free)" : " (paid)"}.` : "Off. Free with a Google Gemini key: study sets from your slides, quick add, explanations, exam plans and more."}${on ? (a => a.on ? " Automatic AI is on." : a.reason === "confirm" ? " Automatic AI is paused until you confirm paid use." : " Automatic AI is off.")(autoState()) : ""}</span></span>${inPreview() ? "" : `<button class="btn small ${on ? "" : "primary"}" data-act="ai-setup">${on ? "Manage" : "Set Up"}</button>`}</div>`;
}
// Which company a pasted key is from, by its format (Claude keys also start with sk-, so they're checked first)
const aiKeyKind = k => /^sk-ant-/.test(k) ? "anthropic" : /^sk-/.test(k) ? "openai" : /^AIza/.test(k) ? "gemini" : "";
// opts.code: a code from another device (a scanned link) to offer at the top
function aiSetupSheet(fromFeature, opts){
  opts = opts || {};
  const c = aiCfg(), hasKey = !!(c.keys.gemini || c.keys.anthropic || c.keys.openai), pro = aiProAvail();
  // Pro: one box for a backup key from any company, saved into the same per-company keys the separate boxes use
  const backupHint = () => aiProDeclined() ? "Used while Studyboard AI is off. Paste your own AI API key." : "Used if your Studyboard AI runs out. Paste your own AI API key.";
  const backupRow = () => { const b = aiProBackup(c.keys); return `<div class="ai-key" id="aiBackup">
      <label class="f"><span class="lh">Backup API Key <span class="hint" id="aiBackupHint">${esc(backupHint())}</span></span><span class="key-row"><input type="${KEY_MASK ? "text" : "password"}" class="${KEY_MASK ? "key-mask" : ""}" name="sb-ai-key-backup" id="aiBackupKey" value="${esc(b ? c.keys[b] : "")}" placeholder="Paste your key" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" data-1p-ignore data-lpignore="true" data-bwignore data-form-type="other" data-noenter><button type="button" class="btn small" id="aiBackupShow">Show</button><button type="button" class="btn small" id="aiBackupTest">Test</button></span></label>
      <p class="mini" id="aiBackupKind" aria-live="polite" style="margin:0"></p>
      <p class="mini ai-test-msg" id="aiBackupMsg" aria-live="polite" style="margin:0"></p>
      ${Object.keys(AI_PROVIDERS).map(p => `<input type="hidden" data-key="${p}" value="${esc(c.keys[p])}">`).join("")}</div>`; };
  const keyRow = (p) => { const P = AI_PROVIDERS[p]; return `<div class="ai-key" data-p="${p}">
      <label class="f"><span class="lh">${esc(P.keyLabel)}${p === "gemini" ? ` ${REQ}` : ""} <span class="hint">${esc(P.keyHint)}</span></span><span class="key-row"><input type="${KEY_MASK ? "text" : "password"}" class="${KEY_MASK ? "key-mask" : ""}" name="sb-ai-key-${p}" data-key="${p}" value="${esc(c.keys[p])}" placeholder="Paste your key" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" data-1p-ignore data-lpignore="true" data-bwignore data-form-type="other" data-noenter><button type="button" class="btn small" data-show="${p}">Show</button><button type="button" class="btn small" data-test="${p}">Test</button></span></label>
      <p class="mini ai-test-msg" data-msg="${p}" aria-live="polite" style="margin:0"></p></div>`; };
  const modelOpts = live => { const keys = live ? {} : Object.assign({}, c.keys); if (live) $$("[data-key]", dlg).forEach(i => { keys[i.dataset.key] = i.value.trim(); });
    return aiModelOpts(keys, `${c.provider}|${c.model}`) || `<option value="">Add a key first</option>`; };
  openSheet(`<form class="sheet">${head("AI Features")}
    <div class="sheet-body">
      ${aiProAvail() ? `<div class="ai-disclaimer" style="display:grid;gap:10px">${aiUseCard()}<p style="margin:0"><b>Studyboard AI is included with your Pro plan.</b> Nothing to set up: it works in every AI feature${c.provider === "studyboard" ? "" : " when it's on"}.</p>
        <p class="mini" style="margin:0">Studyboard AI runs on Anthropic's Claude, through Studyboard's server on Cloudflare. YouTube videos are watched by Google's Gemini, and recordings are transcribed on Cloudflare.</p>
        <label class="anim-tog" style="justify-self:start"><input type="checkbox" id="aiUsePro" ${aiProDeclined() ? "" : "checked"}> Use Studyboard AI</label>
        <p class="mini" style="margin:0">Turn it off to use your backup key below instead. ${aiProUsedUp() ? "It's used up for now, so your backup key is used until it resets." : "If this week's or today's Studyboard AI runs out, your backup key takes over until it resets."}</p></div>` : ""}
      ${fromFeature && !pro ? `<p style="margin:0"><b>Set up AI first.</b> It takes about a minute and it's free.</p>` : ""}
      ${pro ? "" : `<p style="margin:0">Studyboard uses <b>Google Gemini</b> by default for non-Pro users because it's free.</p>
      <ol class="ai-steps">
        <li>Open <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a></li>
        <li>Click <b>Create API Key</b> (keep billing off)</li>
        <li>Copy the key and paste below</li>
      </ol>`}
      ${opts.code && KEY_RELAY ? `<div class="ai-disclaimer" id="aiHoAsk" style="display:grid;gap:8px"><p style="margin:0"><b>Add AI from your other device?</b> This adds the AI keys you set up there to this device, using code <b>${esc(opts.code)}</b>.</p><div class="row" style="display:flex;gap:8px"><button type="button" class="btn primary small" id="aiHoYes">Add Keys</button><button type="button" class="btn small" id="aiHoNo">Not Now</button></div></div>` : ""}
      <p class="mini" id="aiPasteMsg" aria-live="polite" style="margin:0" hidden></p>
      ${pro ? backupRow() : keyRow("gemini")}
      ${KEY_RELAY ? `<details class="ai-paid" id="aiHoIn" ${opts.code ? "open" : ""}><summary>Already Set Up on Another Device?</summary>
        <div class="ai-handoff-in"><p class="mini" style="margin:0">On that device, open <b>Settings</b>, <b>AI Features</b> and tap <b>Add AI to Another Device</b>. Scan the code it shows with this device's camera, or type the code here.</p>
          <span class="key-row"><input type="text" class="ai-code-in" id="aiHoCode" value="${esc(opts.code || "")}" placeholder="XXXX-XXXX-XXXX" maxlength="16" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Code from your other device" data-noenter><button type="button" class="btn small" id="aiHoGet">Add Keys</button></span>
          <p class="mini" id="aiHoMsg" aria-live="polite" style="margin:0"></p></div></details>` : ""}
      ${pro ? "" : `<details class="ai-paid" ${c.keys.anthropic || c.keys.openai ? "open" : ""}><summary>Use a Paid Model Instead (Optional)</summary>
        <div class="ai-paid-body">
          <p class="mini ai-disclaimer" style="margin:0"><b>These cost money.</b> You can use a paid Gemini model by turning on billing for your key in Google AI Studio, or use Claude or ChatGPT with an API key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">Anthropic</a> or <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI</a>. These usually do not use what you send to train their models.</p>
          ${keyRow("anthropic")}
          ${keyRow("openai")}
        </div></details>`}
      <label class="f"><span class="lh">Default Model <span class="hint">you can also switch in any AI window</span></span><select id="aiDefault">${modelOpts()}</select></label>
      <fieldset class="ai-auto"><legend>Automatic AI</legend>
        <label class="mi-check"><input type="checkbox" id="aiAuto" ${(ai => ai.auto !== undefined ? ai.auto : isFreeModel(c.provider, c.model))((state.settings && state.settings.ai) || {}) ? "checked" : ""}> Improve Today's Plan and study sessions automatically</label>
        <p class="mini" style="margin:0">AI helps in the background, like picking <b>Do This Next</b> and estimating hours. It never changes anything without a tap. Choose the parts in <button type="button" class="link-btn" data-act="auto-panel">What Each Part Does</button>.</p>
        <label class="f"><span class="lh">Model for Automatic AI</span><select id="aiAutoModel"><option value="free" ${((state.settings.ai || {}).autoModel || "free") === "free" ? "selected" : ""}>Free Gemini (no cost)</option><option value="default" ${(state.settings.ai || {}).autoModel === "default" ? "selected" : ""}>My default model</option></select></label>
        <p class="ai-disclaimer mini" id="aiAutoWarn" hidden style="margin:0"></p>
        <button type="button" class="btn small" data-act="auto-panel">What Automatic AI Is Doing</button>
      </fieldset>
      ${KEY_RELAY && hasKey ? `<div class="ai-paste"><button type="button" class="btn" id="aiHoSend">Add AI to Another Device</button><p class="mini">Shows a code to scan on your phone or other computer, so you don't have to paste the key there.</p></div>` : ""}
      <p class="mini" style="margin:0">Your keys stay on this device${DESK ? " (in your system keychain)" : ""}, never in your account or backups. AI requests go to the company you chose. Google's free tier may use them to improve its products, so avoid private info.</p>
      <div class="ai-paste"><button type="button" class="btn" data-ai-report="settings" data-ai-text="">Report an AI Response</button><p class="mini">AI can be wrong. Tell us if a response was wrong or harmful.</p></div>
    </div>
    <div class="sheet-foot">${c.keys.gemini || c.keys.anthropic || c.keys.openai ? `<button type="button" class="btn danger" id="aiRemove">Turn Off</button>` : ""}<span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" id="aiSave">Save</button></div>
  </form>`);
  const keysNow = () => { const k = {}; $$("[data-key]", dlg).forEach(i => { k[i.dataset.key] = i.value.trim(); }); return k; };
  const autoEngine = () => { const k = keysNow(), [p, m] = ($("#aiDefault").value || "gemini|auto").split("|"); return $("#aiAutoModel").value === "free" && k.gemini ? {provider: "gemini", model: "auto"} : {provider: k[p] ? p : "gemini", model: k[p] ? m : "auto"}; };
  const autoWarn = () => { if (!$("#aiAutoWarn") || !$("#aiDefault")) return; const w = $("#aiAutoWarn"), e = autoEngine(), paid = !isFreeModel(e.provider, e.model); w.hidden = !($("#aiAuto").checked && paid);
    w.innerHTML = `<b>This would use a paid model (${esc(aiModelName(e.provider, e.model))}) in the background and may cost money.</b> You'll be asked to confirm before it's turned on.${keysNow().gemini || pro ? "" : " Add a free Gemini key to run it at no cost."}`; };
  let autoTouched = ((state.settings && state.settings.ai) || {}).auto !== undefined;
  $("#aiAuto").addEventListener("change", () => { autoTouched = true; });
  const autoDefault = () => { if (autoTouched || !$("#aiDefault") || !$("#aiAuto")) return; const [p, m] = ($("#aiDefault").value || "gemini|auto").split("|"); $("#aiAuto").checked = !!keysNow()[p] && isFreeModel(p, m); };
  $("#aiDefault").addEventListener("change", autoDefault); $$("[data-key]", dlg).forEach(i => i.addEventListener("change", () => setTimeout(() => { autoDefault(); autoWarn(); }, 0)));
  ["#aiAuto", "#aiAutoModel", "#aiDefault"].forEach(id => $(id).addEventListener("change", autoWarn));
  $$("[data-key]", dlg).forEach(i => i.addEventListener("change", autoWarn));
  autoWarn();
  // A Claude key added here becomes the default (it would otherwise sit unused behind Gemini); the student can switch back
  const hadClaude = !!c.keys.anthropic;
  const refreshModels = () => { const sel = $("#aiDefault"), v = sel.value; sel.innerHTML = modelOpts(true); if ([...sel.options].some(o => o.value === v)) sel.value = v;
    if (!hadClaude && keysNow().anthropic && /^gemini\|/.test(v) && [...sel.options].some(o => o.value === "anthropic|studyboard")) { sel.value = "anthropic|studyboard"; try { sel.dispatchEvent(new Event("change")); } catch(e) {} } };
  $$("[data-key]", dlg).forEach(i => i.addEventListener("change", refreshModels));
  $$("[data-show]", dlg).forEach(b => b.addEventListener("click", () => { const i = dlg.querySelector(`[data-key="${b.dataset.show}"]`), hid = KEY_MASK ? i.classList.toggle("key-mask") : (i.type = i.type === "password" ? "text" : "password") === "password"; b.textContent = hid ? "Show" : "Hide"; }));
  const testKey = async (p, key) => {
    const sel = $("#aiDefault").value.split("|");
    const model = sel[0] === p ? sel[1] : (p === "gemini" ? "auto" : AI_PROVIDERS[p].models[0][0]);
    const prev = state.settings.ai, prevKeys = aiLocalKeys;
    aiLocalKeys = Object.assign({}, aiCfg().keys, {[p]: key});
    state.settings = Object.assign({}, state.settings, {ai: {provider: p, model, keys: {}, ownKey: true}}); // ownKey: test the key itself, not Studyboard AI
    let out;
    try { const r = await aiCall({task: "ping", fast: true, maxTokens: 400, temperature: 0, parts: [{text: "Reply with {\"ok\": true}"}], system: "Reply with JSON only.", schema: {type: "OBJECT", properties: {ok: {type: "BOOLEAN"}}, required: ["ok"]}}); out = {ok: true, model: r.model}; }
    catch(e) { out = {ok: false, err: e.message}; }
    aiLocalKeys = prevKeys; state.settings = Object.assign({}, state.settings, {ai: prev});
    return out;
  };
  $$("[data-test]", dlg).forEach(b => b.addEventListener("click", async () => {
    const p = b.dataset.test, key = keysNow()[p], msg = dlg.querySelector(`[data-msg="${p}"]`);
    if (!key) { msg.textContent = "Paste the key first."; return; }
    msg.textContent = "Testing…"; b.disabled = true;
    const r = await testKey(p, key);
    msg.textContent = r.ok ? `It works. Connected to ${r.model}.` : r.err; b.disabled = false;
  }));
  // Pro's one backup box: the key's format says which company it's from; it replaces any saved keys, and an empty box removes them
  const bx = $("#aiBackupKey"), bxKind = $("#aiBackupKind"), bxMsg = $("#aiBackupMsg");
  const bxSay = () => { if (!bx) return; const v = bx.value.trim(), p = aiKeyKind(v), k = keysNow(), saved = aiProBackup(c.keys), others = Object.keys(AI_PROVIDERS).filter(x => x !== p && k[x]);
    bxKind.textContent = !v ? "No backup key." : !p ? "That doesn't look like a Gemini, OpenAI or Claude key." : `${v === c.keys[p] && p === saved ? "Saved" : "New"}: ${AI_PROVIDERS[p].label} key${others.length ? ` (also ${others.map(x => AI_PROVIDERS[x].short).join(" and ")})` : ""}.`; };
  const bxSet = () => { const v = bx.value.trim(), p = aiKeyKind(v), hid = dlg.querySelector('[data-key="gemini"]');
    $$("[data-key]", dlg).forEach(i => { i.value = p === i.dataset.key ? v : ""; });
    bxMsg.textContent = ""; bxSay(); hid.dispatchEvent(new Event("change")); };
  if (bx) {
    bxSay();
    bx.addEventListener("input", bxSet);
    bx.addEventListener("paste", e => { const t = e.clipboardData ? e.clipboardData.getData("text") : "", code = KEY_RELAY && !aiKeyKind(t.trim()) ? KEYHO.codeIn(t) : ""; if (code) { e.preventDefault(); getKeys(code); } });
    $("#aiBackupShow").addEventListener("click", e => { const hid = KEY_MASK ? bx.classList.toggle("key-mask") : (bx.type = bx.type === "password" ? "text" : "password") === "password"; e.currentTarget.textContent = hid ? "Show" : "Hide"; });
    $("#aiBackupTest").addEventListener("click", async e => { const b = e.currentTarget, v = bx.value.trim(), p = aiKeyKind(v);
      if (!v) { bxMsg.textContent = "Paste the key first."; return; }
      if (!p) { bxMsg.textContent = "That doesn't look like a Gemini, OpenAI or Claude key."; return; }
      bxMsg.textContent = "Testing…"; b.disabled = true;
      const r = await testKey(p, v);
      bxMsg.textContent = r.ok ? `It works. Connected to ${r.model}.` : r.err; b.disabled = false; });
  }
  const save = okMsg => {
    const k = keysNow(), bx = $("#aiBackupKey");
    if (bx) { const v = bx.value.trim(); if (v && !aiKeyKind(v)) { $("#aiBackupMsg").textContent = "That doesn't look like a Gemini, OpenAI or Claude key."; bx.focus(); return; } }
    else if (!k.gemini && !k.anthropic && !k.openai) { const m = dlg.querySelector('[data-msg="gemini"]'); m.textContent = "Paste your Gemini key first."; dlg.querySelector('[data-key="gemini"]').focus(); return; }
    if (k.gemini && /^(sk-|sb_)/.test(k.gemini)) { dlg.querySelector('[data-msg="gemini"]').textContent = "That doesn't look like a Gemini key. Gemini keys come from Google AI Studio."; return; }
    if (k.anthropic && !/^sk-ant-/.test(k.anthropic)) { dlg.querySelector('[data-msg="anthropic"]').textContent = "Claude API keys start with sk-ant-."; return; }
    const [p, m] = ($("#aiDefault").value || "gemini|auto").split("|");
    const prev = state.settings.ai || {};
    const next = {provider: k[p] ? p : "gemini", model: k[p] ? m : "auto", keys: {}, auto: $("#aiAuto").checked, autoModel: $("#aiAutoModel").value, autoPaidOk: prev.autoPaidOk || ""};
    if (prev.ownKey) next.ownKey = true;
    const e = autoEngine(), paid = !isFreeModel(e.provider, e.model), tag = `${e.provider}|${e.model}`;
    const finish = msg => { aiKeysSetLocal(k); state.settings = Object.assign({}, state.settings, {ai: next}); saveSettings(); AUTO.sig = ""; AUTO.planAt = 0; autoErr = null; autoSave(); if (dlg.open) dlg.close(); toast(msg); scheduleRender();
      const pv = next.provider; if (k[pv] && !aiConsented(pv)) setTimeout(() => aiConsentAsk(pv), 300); };
    if (next.auto && paid && next.autoPaidOk !== tag) {
      autoPaidConfirmSheet(e, ok => { if (ok) { next.autoPaidOk = tag; finish("AI settings saved. Automatic AI will use your paid model."); } else { next.auto = false; finish("AI settings saved. Automatic AI is off."); } });
      return;
    }
    if (!next.auto) next.autoPaidOk = "";
    finish(okMsg || "AI settings saved");
  };
  $("#aiSave").addEventListener("click", () => save());
  // A Gemini key on the clipboard
  const pasteMsg = $("#aiPasteMsg"), gIn = dlg.querySelector('[data-key="gemini"]'), sheetEl = dlg.querySelector("form.sheet");
  const pasteSay = t => { if (pasteMsg) { pasteMsg.hidden = !t; pasteMsg.textContent = t; } };
  const live = () => dlg.open && sheetEl.isConnected;
  let lastTried = "", hoBusy = false;
  const useKey = async key => {
    if (!live() || key === lastTried) return;
    lastTried = key;
    gIn.value = key; gIn.dispatchEvent(new Event("change"));
    pasteSay("Found your key. Checking it…");
    const r = await testKey("gemini", key);
    if (!live()) return;
    if (r.ok) { pasteSay(`It works. Connected to ${r.model}.`); save(`AI is on. Connected to ${r.model}.`); }
    else pasteSay(`${r.err} Check that you copied the whole key, then paste it again.`);
  };
  const getKeys = async code => {
    if (hoBusy || !live()) return;
    hoBusy = true;
    const det = $("#aiHoIn"), ci = $("#aiHoCode"), m = $("#aiHoMsg") || pasteMsg;
    if (det) det.open = true;
    if (ci) ci.value = code;
    m.textContent = "Getting your keys from your other device…";
    let keys = null, err = "";
    try { keys = await keyHandoffFetch(code); } catch (e) { err = e.message; }
    hoBusy = false;
    if (!live()) return;
    if (!keys) { m.textContent = err; return; }
    lastTried = keys.gemini || "";
    Object.entries(keys).forEach(([p, k]) => { const i = dlg.querySelector(`[data-key="${p}"]`); if (i) { i.value = k; i.dispatchEvent(new Event("change")); } });
    if (keys.anthropic || keys.openai) { const d = dlg.querySelector("details.ai-paid:not(#aiHoIn)"); if (d) d.open = true; }
    if (bx) { const p = aiProBackup(keysNow()); bx.value = p ? keysNow()[p] : ""; bxSay(); }
    const n = Object.keys(keys).length;
    m.textContent = n === 1 ? "Got your key." : `Got ${n} keys.`;
    setTimeout(() => { if (live()) save(`AI is on. ${n === 1 ? "Your key" : "Your keys"} came from your other device.`); }, 0);
  };
  const useText = text => {
    const k = KEYHO.geminiKeyIn(text); if (k) { useKey(k); return true; }
    const code = KEY_RELAY ? KEYHO.codeIn(text) : ""; if (code) { getKeys(code); return true; }
    return false;
  };
  const readClip = async () => DESK && DESK.aiClipboard ? String(await DESK.aiClipboard() || "") : navigator.clipboard && navigator.clipboard.readText ? await navigator.clipboard.readText() : null;
  const pasteBtn = $("#aiPaste"); if (pasteBtn) pasteBtn.addEventListener("click", async () => {
    let t = null;
    try { t = await readClip(); } catch (e) { t = null; }
    if (t === null) { pasteSay("Studyboard wasn't allowed to read the clipboard here. Paste the key into the box below instead."); gIn.focus(); return; }
    lastTried = "";
    if (!useText(t)) pasteSay("There's no Gemini key on the clipboard yet. In Google AI Studio, click Copy next to your key, then paste it again.");
  });
  gIn.addEventListener("paste", e => {
    const t = e.clipboardData ? e.clipboardData.getData("text") : "", k = KEYHO.geminiKeyIn(t), code = KEY_RELAY && !k ? KEYHO.codeIn(t) : "";
    if (k) setTimeout(() => { lastTried = ""; useKey(k); }, 0);
    else if (code) { e.preventDefault(); getKeys(code); }
  });
  // Watching the clipboard for a free Gemini key is for the Gemini set-up; Pro has the one backup box instead
  if (!pro && DESK && DESK.aiClipboard) {
    let timer = 0;
    const poll = async () => {
      if (!live()) { clearInterval(timer); window.removeEventListener("focus", poll); return; }
      if (!document.hasFocus() || gIn.value.trim()) return;
      try { const k = KEYHO.geminiKeyIn(String(await DESK.aiClipboard() || "")); if (k) useKey(k); } catch (e) {}
    };
    timer = setInterval(poll, 1500); window.addEventListener("focus", poll);
  } else if (!pro && navigator.permissions && navigator.clipboard && navigator.clipboard.readText) {
    const onFocus = async () => {
      if (!live()) { window.removeEventListener("focus", onFocus); return; }
      if (gIn.value.trim()) return;
      try { if ((await navigator.permissions.query({name: "clipboard-read"})).state !== "granted") return; const k = KEYHO.geminiKeyIn(await navigator.clipboard.readText()); if (k) useKey(k); } catch (e) {}
    };
    window.addEventListener("focus", onFocus);
  }
  // Keys from another device
  const yes = $("#aiHoYes");
  if (yes) { yes.addEventListener("click", () => { $("#aiHoAsk").remove(); getKeys(opts.code); }); $("#aiHoNo").addEventListener("click", () => $("#aiHoAsk").remove()); }
  const hoGet = $("#aiHoGet");
  if (hoGet) {
    hoGet.addEventListener("click", () => { const code = KEYHO.normCode($("#aiHoCode").value); if (!code) { $("#aiHoMsg").textContent = "Codes have 12 letters and numbers, like K7Q2-9XMD-4TRP."; return; } getKeys(code); });
    $("#aiHoCode").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); hoGet.click(); } });
  }
  const hoSend = $("#aiHoSend"); if (hoSend) hoSend.addEventListener("click", () => keyHandoffSend(aiCfg().keys));
  // the usage card shows what was last read; read it again now and redraw it in place
  if (aiProAvail() && AI_PRO && sbUser) aiProRefresh().then(j => { const el = j && dlg.open ? dlg.querySelector("#sbaiUse") : null; if (el) el.outerHTML = aiUseCard(); });
  const usePro = $("#aiUsePro");
  if (usePro) usePro.addEventListener("change", () => {
    const raw = Object.assign({}, (state.settings && state.settings.ai) || {});
    if (usePro.checked) delete raw.ownKey; else raw.ownKey = true;
    state.settings = Object.assign({}, state.settings, {ai: raw}); saveSettings();
    const bh = $("#aiBackupHint"); if (bh) bh.textContent = backupHint();
    toast(usePro.checked ? "Studyboard AI is on." : "Using your own key. Turn Studyboard AI back on here any time."); try { scheduleRender(); } catch(e) {}
  });
  if (AI_PRO && sbUser) aiProRefresh().then(j => { if (j) try { scheduleRender(); } catch(e) {} });
  const rm = $("#aiRemove"); if (rm) rm.addEventListener("click", () => { aiWipeLocal(); state.settings = Object.assign({}, state.settings, {ai: null}); saveSettings(); dlg.close(); toast("AI features turned off. Your keys were removed."); scheduleRender(); });
}
/* Add AI to Another Device This device locks its saved keys with a new code */
const khoUrl = (id, tail) => `${KEY_RELAY}/v1/h/${id}${tail || ""}`;
async function keyHandoffFetch(code){
  if (!window.crypto || !crypto.subtle) throw new Error("This browser can't unlock the keys here. Open Studyboard from its https address and try again.");
  const {id, key} = await KEYHO.derive(code, crypto.subtle);
  let res;
  try { res = await fetchT(khoUrl(id), {method: "GET", cache: "no-store"}, 15000); } catch (e) { throw new Error("Couldn't reach Studyboard. Check your internet connection and try again."); }
  if (res.status === 404) throw new Error("That code didn't work. It may have been used already or be more than 10 minutes old. Check it, or make a new one on your other device.");
  if (!res.ok) throw new Error("Studyboard couldn't get your keys just now. Try again in a minute.");
  let keys;
  try { const j = await res.json(); keys = KEYHO.cleanKeys((await KEYHO.open(key, j.box, crypto.subtle)).keys); }
  catch (e) { throw new Error("That code didn't unlock your keys. Make a new one on your other device and try again."); }
  if (!Object.keys(keys).length) throw new Error("No AI keys came with that code. Set up AI on your other device first.");
  return keys;
}
function keyHandoffSend(keys){
  keys = KEYHO.cleanKeys(keys);
  if (!KEY_RELAY || !Object.keys(keys).length) { toast("Set up AI on this device first."); return; }
  openSheet(`<div class="sheet">${head("Add AI to Another Device")}<div class="sheet-body"><div class="kho" id="kho"><p role="status" style="margin:0">Making a code…</p></div></div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Done</button></div></div>`);
  const box = $("#kho"), live = () => dlg.open && box.isConnected, rand = n => crypto.getRandomValues(new Uint8Array(n));
  let id = "", timer = 0;
  const stop = () => { clearInterval(timer); if (id) fetch(khoUrl(id), {method: "DELETE", keepalive: true}).catch(() => {}); id = ""; };
  dlg.addEventListener("close", stop, {once: true});
  const again = msg => { box.innerHTML = `<p role="status" style="margin:0">${msg}</p><button type="button" class="btn primary" id="khoAgain">Make a New Code</button>`; $("#khoAgain").addEventListener("click", () => keyHandoffSend(keys)); };
  (async () => {
    try {
      const code = KEYHO.newCode(rand), d = await KEYHO.derive(code, crypto.subtle);
      const sealed = await KEYHO.seal(d.key, {v: 1, keys}, crypto.subtle, rand);
      const res = await fetchT(khoUrl(d.id), {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({box: sealed})}, 15000);
      if (!res.ok) throw new Error("relay " + res.status);
      id = d.id;
      if (!live()) { stop(); return; }
      const names = Object.keys(keys).map(p => AI_PROVIDERS[p].short), until = Date.now() + KEYHO.TTL_MIN * 60000;
      box.innerHTML = `${QR.svg(`${KEY_RELAY}/k#${code}`, "QR code for adding AI to your other device")}
        <div class="kho-code" aria-label="Code: ${esc(code.replace(/-/g, "").split("").join(" "))}">${esc(code)}</div>
        <p style="margin:0">On your other device, scan this with the camera. Or open Studyboard there, go to <b>Settings</b>, <b>AI Features</b>, <b>Already Set Up on Another Device?</b> and type the code.</p>
        <p class="mini" style="margin:0">Sends your ${esc(names.join(" and "))} key${names.length === 1 ? "" : "s"}, locked with this code. It works once, for 10 minutes. Don't share it: whoever has it gets your key.</p>
        <p class="mini" id="khoState" role="status" style="margin:0">Waiting for your other device…</p>`;
      timer = setInterval(async () => {
        if (!live()) { stop(); return; }
        if (Date.now() > until) { stop(); again("This code has expired."); return; }
        try {
          const j = await (await fetchT(khoUrl(id, "/status"), {cache: "no-store"}, 10000)).json();
          if (j.state === "taken" && live()) { clearInterval(timer); id = ""; box.innerHTML = `<p role="status" style="margin:0"><b>Done.</b> Your other device has your AI keys now.</p>`; }
          else if (j.state === "none" && live()) { stop(); again("This code isn't working any more."); }
        } catch (e) {}
      }, 5000);
    } catch (e) { if (live()) again("Couldn't make a code just now. Check your internet connection and try again."); }
  })();
}
// A scanned code opened the app (KEYHO_LINK)
if (KEYHO_LINK && KEY_RELAY) {
  let tries = 0;
  const offer = () => { if (inPreview()) return; if (dlg.open && tries++ < 120) { setTimeout(offer, 1000); return; } aiSetupSheet(false, {code: KEYHO_LINK}); };
  setTimeout(offer, 1200);
}
// Exported backup files never include your AI keys
function exportArrays(){ const a = clone(toArrays()); if (a.settings && a.settings.ai) delete a.settings.ai; if (a.settings) dropFeeds(a.settings); return a; }

// The planner's own facts for AI answers: every mark, course standings and Today's Plan in the app's own order, so questions like
// "my best assignment mark" or "what's after today's plan" are lookups, not guesses
// Which parts of the planner a question needs, so only those are sent. prev is the question before it, so a follow-up
// ("and the lowest?") keeps its topic. Course names and codes count as asking about that course's work.
const AI_NEED_RX = {
  grades: /\b(grades?|marks?|marked|scores?|scored|gpa|percent(age)?|averages?|best|worst|highest|lowest|top|pass(ing|ed)?|fail(ing|ed)?|goals?|targets?|how am i doing|how i'm doing|standing|letter grade|results?|feedback)\b|%/i,
  plan: /\b(next|today|tonight|right now|plan|planned|should i|after (that|this|i finish|everything)|priorit(y|ies|i[sz]e)|first|focus|work on|start on|study time|free time|time left|how much time|busy|behind|catch up|rough week|crunch|on track|workload|my week|weekend|overwhelmed|stressed)\b/i,
  tasks: /\b(due|deadlines?|to-?dos?|homework|overdue|late|submit(ted)?|this week|next week|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|left|remaining|coming up|upcoming|finished|done|completed)\b/i,
  work: /\b(assignments?|tasks?|essays?|papers?|projects?|labs?|readings?|reflections?|portfolio|discussions?|posts?|exams?|quiz(zes)?|midterms?|finals?|tests?)\b/i,
  schedule: /\b(class(es)?|lectures?|seminars?|clinicals?|placements?|tutorials?|when is|where is|what time|rooms?|office hours|instructors?|professors?|profs?|teach(es|er)?|calendar|schedule)\b/i,
  cards: /\b(flash ?cards?|decks?|cards?|review|quiz me|memori[sz]e|spaced)\b/i,
  notes: /\b(notes?|wrote|jotted|sticky|boards?)\b/i,
  files: /\b(files?|pdfs?|slides?|syllabus|documents?|chapters?|uploads?)\b/i
};
const AI_SMALLTALK = /^\s*(hi|hey|hello|yo|sup|thanks|thank you|thx|ty|ok(ay)?|cool|nice|lol|haha|good (morning|afternoon|evening|night)|how are you|how's it going|what's up|bye|goodnight)\b[\s!.?]*$/i;
function aiNeeds(q, prev){
  const o = {grades: false, plan: false, tasks: false, work: false, schedule: false, cards: false, notes: false, files: false, course: [], small: false};
  q = String(q || ""); prev = String(prev || "");
  if (AI_SMALLTALK.test(q)) { o.small = true; return o; }
  // the question's own topics; a follow-up with none of its own ("and the lowest?") takes the previous question's
  const topics = t => Object.keys(AI_NEED_RX).filter(k => AI_NEED_RX[k].test(t));
  let own = topics(q);
  const follow = !!prev && !own.length && (/^\s*(and|also|what about|how about|which|why|so|ok|then|same)\b/i.test(q) || /\b(it|that|those|them|these|this one|that one)\b/i.test(q) || q.trim().split(/\s+/).length <= 2);
  const s = follow ? q + "\n" + prev : q;
  if (follow) own = topics(s);
  Object.keys(AI_NEED_RX).forEach(k => { o[k] = own.includes(k); });
  const low = s.toLowerCase();
  o.course = coursesArr().filter(c => [c.code, c.name].some(x => { x = String(x || "").toLowerCase().trim(); return x.length >= 3 && (low.includes(x) || low.replace(/\s+/g, "").includes(x.replace(/\s+/g, ""))); })).map(c => c.id);
  // a question about a course with nothing else named: its work and grades
  if (o.course.length && !Object.keys(AI_NEED_RX).some(k => o[k])) { o.tasks = true; o.grades = true; }
  // what to do next depends on what's due
  // naming a kind of work ("assignment", "exam") asks about tasks, unless it's a question about their marks
  if (o.work && !o.grades) o.tasks = true;
  if (o.plan) o.tasks = true;
  return o;
}
const aiNeedsAny = n => !!n && !n.small && (n.grades || n.plan || n.tasks || n.schedule || n.cards || n.notes || n.files || n.course.length > 0);
function aiPlannerFacts(need){
  need = need || {grades: true, plan: true};
  const L = [];
  if (need.grades) try {
    const G = window.SBGRADES;
    const lines = G ? G.lines() : []; if (lines.length) L.push("COURSE GRADES:\n" + lines.map(x => "- " + x).join("\n"));
    const it = G && G.items ? G.items() : [];
    if (it.length) {
      const row = x => `- ${x.title} (${[x.course, x.type, x.weight != null ? "worth " + x.weight + "% of the course" : "", x.due ? "due " + x.due : ""].filter(Boolean).join(", ")}): ${x.mark}${/%$/.test(x.mark) ? "" : " = " + x.pct + "%"}${x.letter ? " (" + x.letter + ")" : ""}`;
      L.push(`MARKED WORK (every item with a mark, ${it.length} in all, highest first):\n` + it.slice().sort((a, b) => b.pct - a.pct).slice(0, 80).map(row).join("\n"));
    } else if (lines.length) L.push("MARKED WORK: no marks have been entered for individual items yet.");
    const w = G && G.waiting ? G.waiting() : [];
    if (w.length) L.push("FINISHED, STILL WAITING FOR A MARK: " + w.slice(0, 20).map(x => `${x.title}${x.course ? " (" + x.course + ")" : ""}`).join("; "));
  } catch (e) {}
  if (need.plan) try {
    // laid out exactly as Today's Plan shows it: Do This Next, the rest of today's planned work, then what comes after, in order
    const F = computeFocus(), cl = t => { const c = courseOf(t.courseId); return c ? courseLabel(c) : ""; };
    let n = null; try { n = dayIsOff(todayISO()) ? null : nextUp(F); } catch (e) { n = null; }
    const heroId = n ? n.x.t.id : "", work = F.ranked.filter(x => !x.fixed && !x.dead && x.t.status !== "done");
    const slot = x => { const sl = (F.slotsBy || {})[x.t.id]; try { return sl && sl.length ? availSlotText(sl) : ""; } catch (e) { return ""; } };
    const desc = x => `${x.t.title} (${[cl(x.t), x.t.type, x.t.due ? "due " + x.t.due + (x.t.time ? " " + x.t.time : "") : "", x.R > 0 ? "about " + fmtHM(x.R) + " of work left" : ""].filter(Boolean).join(", ")})`;
    const today = work.filter(x => x.alloc > 0 && x.t.id !== heroId), after = work.filter(x => !(x.alloc > 0) && x.t.id !== heroId);
    const P = ["TODAY'S PLAN (exactly what the student sees on Today's Plan, top to bottom):"];
    P.push(n ? `DO THIS NEXT (the task to work on right now): ${desc(n.x)}${slot(n.x) ? ", scheduled " + slot(n.x) : ""}${n.x.alloc > 0 ? ", " + fmtHM(n.x.alloc) + " planned today" : ""}` : "DO THIS NEXT: nothing right now.");
    P.push("ALSO PLANNED FOR TODAY: " + (today.length ? "\n" + today.map(x => `- ${desc(x)}: ${fmtHM(x.alloc)} today${slot(x) ? ", " + slot(x) : ""}`).join("\n") : "nothing else."));
    // the whole ranking after today, as Full Ranking shows it: open work in order, then work that starts later or waits on something
    const rest = after.map(x => ({x, note: x.reasons && x.reasons[0] ? x.reasons[0] : ""}))
      .concat((F.later || []).filter(x => x.t.status !== "done").map(x => ({x, note: x.t.start ? "starts " + x.t.start : "starts later"})))
      .concat((F.blocked || []).filter(x => x.t.status !== "done").map(x => ({x, note: "waiting on " + (blockers(x.t) || []).map(y => y.title).join(", ")})));
    P.push(`THEN, AFTER TODAY'S PLAN IS DONE (the full ranking in this exact order: item 1 is what to do once everything above is finished, item 2 comes after item 1, and so on):${rest.length ? "\n" + rest.slice(0, 40).map((r, i) => `${i + 1}. ${desc(r.x)}${r.note ? ": " + r.note : ""}`).join("\n") : " nothing else is open."}`);
    P.push(`Study time: ${fmtHM(Math.max(0, F.doneToday || 0))} done today, ${fmtHM(Math.max(0, F.th))} left today.`);
    L.push(P.join("\n"));
  } catch (e) {}
  return L.join("\n\n");
}
