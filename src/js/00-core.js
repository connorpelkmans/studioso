/* Every on-device database this page opens closes itself when another tab */
try {
  const idbOpen = IDBFactory.prototype.open;
  IDBFactory.prototype.open = function(){
    const r = idbOpen.apply(this, arguments);
    r.addEventListener("success", () => { const d = r.result; if (d && !d.onversionchange) d.onversionchange = () => { try { d.close(); } catch(e) {} }; });
    return r;
  };
} catch(e) {}
/* Basics */
const $ = (s, el=document) => el.querySelector(s);
// Set when Studyboard runs as the installed desktop app
const DESK = window.studiosoDesktop || null;
// School site sign-in and reading
const lmsBridge = () => (DESK && DESK.lms) || window.studiosoLms || null;
const lmsOnPhone = () => !(DESK && DESK.lms) && !!window.studiosoLms;
// The Studyboard School Sync extension on the Chrome Web Store
const EXT_CHROME_URL = "https://chromewebstore.google.com/detail/studyboard-school-sync/ibibaefpedmlgaamopopcoelnnaaollf";
// Where the desktop apps are downloaded
const DESK_DL = "https://studyboardapp.com/website/#download";
function chromeDesktop(){
  try {
    if (DESK || window.Capacitor || !/^https?:$/.test(location.protocol)) return false;
    const ua = navigator.userAgent || "", d = navigator.userAgentData;
    if (/Android|iPhone|iPad|iPod|Mobile|CriOS/i.test(ua) || (d && d.mobile)) return false;
    if (navigator.brave || /Edg\/|OPR\/|Opera|Vivaldi|YaBrowser|SamsungBrowser|Electron/i.test(ua)) return false;
    if (d && Array.isArray(d.brands)) return d.brands.some(b => /^Google Chrome$/i.test(b.brand));
    return /Chrome\/\d/.test(ua) && /Google Inc/.test(navigator.vendor || "");
  } catch (e) { return false; }
}
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
/* Spelling by where you are */
const SPELL = (() => {
  const KEY = "studyboard:spelling";
  const GBR = /^(GB|UK|IE|AU|NZ|ZA|IN|SG|HK|MY|PK|NG|KE|GH|JM|MT|CY|BD|LK)$/;
  function region(){
    let pick = ""; try { pick = localStorage.getItem(KEY) || ""; } catch (e) {}
    if (pick === "us") return ""; if (pick === "ca" || pick === "gb") return pick;
    const L = ((navigator.languages && navigator.languages[0]) || navigator.language || "en").replace("_", "-");
    if (!/^en\b/i.test(L)) return "";
    const r = (L.split("-")[1] || "").toUpperCase();
    if (r === "CA") return "ca"; if (GBR.test(r)) return "gb";
    if (r && r !== "US") return "";
    let tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
    if (/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Montreal|Moncton|Whitehorse|Yellowknife|Iqaluit|Glace_Bay|Goose_Bay|Swift_Current|Dawson_Creek|Fort_Nelson|Creston|Rankin_Inlet|Cambridge_Bay|Inuvik|Atikokan|Blanc-Sablon|Nipigon|Thunder_Bay|Rainy_River|Resolute|Pangnirtung|Dawson)$|^Canada\//.test(tz)) return "ca";
    if (/^(Europe\/(London|Dublin|Belfast|Guernsey|Jersey|Isle_of_Man|Gibraltar|Malta)|Australia\/|Pacific\/Auckland|Pacific\/Chatham|Asia\/(Kolkata|Calcutta|Singapore|Hong_Kong|Kuala_Lumpur|Karachi|Dhaka|Colombo)|Africa\/(Johannesburg|Lagos|Nairobi|Accra))/.test(tz)) return "gb";
    return "";
  }
  const mode = region();
  const W = {color: "colour", colors: "colours", colored: "coloured", colorful: "colourful", coloring: "colouring", favorite: "favorite", favorites: "favorites",
    favorited: "favorited", behavior: "behaviour", behaviors: "behaviours", honor: "honour", honors: "honours", neighbor: "neighbour", neighbors: "neighbours", labor: "labour",
    humor: "humour", flavor: "flavour", harbor: "harbour", rumor: "rumour", center: "centre", centers: "centres", centered: "centred", theater: "theatre", fiber: "fibre",
    liter: "litre", liters: "litres", gray: "grey", grayed: "greyed", canceled: "cancelled", canceling: "cancelling", labeled: "labelled", labeling: "labelling",
    traveled: "travelled", traveling: "travelling", traveler: "traveller", modeled: "modelled", modeling: "modelling", jewelry: "jewellery", catalog: "catalogue",
    defense: "defence", offense: "offence", counselor: "counsellor", counseling: "counselling", tumor: "tumour", endeavor: "endeavour"};
  if (mode === "gb") {
    Object.assign(W, {enroll: "enrol", enrollment: "enrolment", enrollments: "enrolments", fulfill: "fulfil", installment: "instalment", aging: "ageing", skeptical: "sceptical",
      analyze: "analyse", analyzed: "analysed", analyzes: "analyses", analyzing: "analysing", paralyze: "paralyse"});
    ["organiz", "customiz", "prioritiz", "summariz", "recogniz", "realiz", "memoriz", "personaliz", "optimiz", "minimiz", "maximiz", "categoriz", "finaliz", "synchroniz",
      "emphasiz", "authoriz", "specializ", "criticiz", "apologiz", "visualiz", "utiliz", "standardiz", "familiariz", "energiz", "characteriz", "harmoniz", "materializ",
      "normaliz", "randomiz", "revolutioniz", "sympathiz", "theoriz", "localiz", "capitaliz", "generaliz", "stabiliz", "steriliz", "hospitaliz", "itemiz", "agoniz"]
      .forEach(b => ["e", "ed", "es", "ing", "ation", "ations", "er", "ers"].forEach(x => { W[b + x] = b.slice(0, -1) + "s" + x; }));
  }
  const keys = mode ? Object.keys(W).sort((a, b) => b.length - a.length) : [];
  const RX = keys.length ? new RegExp("\\b(" + keys.join("|") + ")\\b", "gi") : null;
  const cased = (m, to) => m === m.toUpperCase() && m.length > 1 ? to.toUpperCase() : m[0] === m[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to;
  const fix = t => (RX && t && RX.test(t) ? (RX.lastIndex = 0, t.replace(RX, m => cased(m, W[m.toLowerCase()] || m))) : (RX && (RX.lastIndex = 0), t));
  const guard = t => (RX && RX.test(t) ? (RX.lastIndex = 0, t.replace(RX, m => "&#" + m.charCodeAt(0) + ";" + m.slice(1))) : (RX && (RX.lastIndex = 0), t));
  const ATTR = /\b(title|placeholder|aria-label|alt|data-tip)="([^"]*)"/g;
  function html(h){
    if (!RX || typeof h !== "string" || !RX.test(h)) { if (RX) RX.lastIndex = 0; return h; }
    RX.lastIndex = 0;
    let skip = "", out = "";
    for (const part of h.split(/(<[^>]*>)/)) {
      if (!part) continue;
      if (part[0] === "<") {
        const m = part.match(/^<\/?\s*([a-zA-Z0-9-]+)/), tag = m ? m[1].toLowerCase() : "";
        if (skip) { if (part[1] === "/" && tag === skip) skip = ""; out += part; continue; }
        if (part[1] !== "/" && (tag === "style" || tag === "script" || tag === "textarea") && !/\/>$/.test(part)) skip = tag;
        out += part.replace(ATTR, (x, a, v) => a + '="' + fix(v) + '"');
      } else out += skip ? part : fix(part);
    }
    return out;
  }
  return {mode, fix, guard, html, KEY};
})();
if (SPELL.mode) {
  // Every bit of HTML the app puts on the page goes through html()
  try {
    const d = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
    Object.defineProperty(Element.prototype, "innerHTML", {configurable: true, enumerable: d.enumerable, get: d.get, set(v){ d.set.call(this, this instanceof HTMLStyleElement || this instanceof HTMLScriptElement ? v : SPELL.html(v)); }});
    const ia = Element.prototype.insertAdjacentHTML;
    Element.prototype.insertAdjacentHTML = function(pos, v){ return ia.call(this, pos, SPELL.html(v)); };
  } catch (e) {}
}
const esc0 = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const esc = SPELL.mode ? s => SPELL.guard(esc0(s)) : esc0;
// Readable plain text from HTML-ish text (LMS text, entity-encoded markup)
const HT_ENT = {amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ensp: " ", emsp: " ", thinsp: " ", zwnj: "", zwj: "", shy: "", lrm: "", rlm: "",
  lsquo: "\u2018", rsquo: "\u2019", sbquo: "\u201A", ldquo: "\u201C", rdquo: "\u201D", bdquo: "\u201E", laquo: "\u00AB", raquo: "\u00BB", lsaquo: "\u2039", rsaquo: "\u203A",
  ndash: "\u2013", mdash: "\u2014", hellip: "\u2026", bull: "\u2022", middot: "\u00B7", sdot: "\u22C5", dagger: "\u2020", Dagger: "\u2021", prime: "\u2032", Prime: "\u2033",
  copy: "\u00A9", reg: "\u00AE", trade: "\u2122", deg: "\u00B0", plusmn: "\u00B1", times: "\u00D7", divide: "\u00F7", minus: "\u2212", frac12: "\u00BD", frac14: "\u00BC", frac34: "\u00BE",
  sup1: "\u00B9", sup2: "\u00B2", sup3: "\u00B3", micro: "\u00B5", para: "\u00B6", sect: "\u00A7", cent: "\u00A2", pound: "\u00A3", yen: "\u00A5", euro: "\u20AC", curren: "\u00A4",
  iexcl: "\u00A1", iquest: "\u00BF", ne: "\u2260", le: "\u2264", ge: "\u2265", asymp: "\u2248", infin: "\u221E", larr: "\u2190", rarr: "\u2192", uarr: "\u2191", darr: "\u2193", harr: "\u2194", check: "\u2713",
  alpha: "\u03B1", beta: "\u03B2", gamma: "\u03B3", delta: "\u03B4", mu: "\u03BC", pi: "\u03C0", sigma: "\u03C3", omega: "\u03C9", Omega: "\u03A9", Delta: "\u0394", ordf: "\u00AA", ordm: "\u00BA",
  szlig: "\u00DF", aelig: "\u00E6", AElig: "\u00C6", oslash: "\u00F8", Oslash: "\u00D8", ntilde: "\u00F1", Ntilde: "\u00D1", ccedil: "\u00E7", Ccedil: "\u00C7"};
const HT_ACC = {grave: "\u0300", acute: "\u0301", circ: "\u0302", tilde: "\u0303", uml: "\u0308", ring: "\u030A", cedil: "\u0327"};
// Only real HTML tag names count as markup
const HT_TAGS = "a|abbr|address|article|aside|audio|b|bdi|bdo|big|blockquote|body|br|button|canvas|caption|center|cite|code|col|colgroup|dd|del|details|dfn|dialog|div|dl|dt|em|fieldset|figcaption|figure|font|footer|form|h[1-6]|header|hr|html|i|img|input|ins|kbd|label|legend|li|link|main|mark|meta|nav|o:p|ol|optgroup|option|p|pre|q|s|samp|section|select|small|source|span|strike|strong|sub|summary|sup|table|tbody|td|textarea|tfoot|th|thead|time|tr|tt|u|ul|var|video|wbr|!doctype|\\?xml";
const HT_TAGRE = new RegExp("<\\/?(?:" + HT_TAGS + ")(?=[\\s/>])(?:\"[^\"]*\"|'[^']*'|[^<>\"'])*>", "gi");
const HT_OPENRE = new RegExp("<\\/?(?:" + HT_TAGS + ")(?:\\s[^<>]*)?$", "i");
const HT_HAS = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
function htmlText(s, opts){
  const o = opts || {};
  if (s == null || s === "") return "";
  const t0 = typeof s === "string" ? s : typeof s === "object" ? "" : String(s);
  if (!t0) return "";
  let t = t0;
  const dec = (m, name) => {
    if (name[0] === "#") { const n = name[1] === "x" || name[1] === "X" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10); return n > 0 && n <= 0x10FFFF && !(n >= 0xD800 && n <= 0xDFFF) ? (n === 160 ? " " : String.fromCodePoint(n)) : ""; }
    if (HT_HAS(HT_ENT, name)) return HT_ENT[name];
    const lm = /^([A-Za-z])(grave|acute|circ|tilde|uml|ring|cedil)$/.exec(name); if (lm) return (lm[1] + HT_ACC[lm[2]]).normalize("NFC");
    return m;
  };
  for (let i = 0; i < 5; i++) {
    const before = t;
    t = t.replace(/<!--[\s\S]*?(-->|$)/g, "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<(script|style|head|template|noscript|iframe|object|embed|svg|math)\b[\s\S]*?(<\/\1\s*>|$)/gi, " ")
      .replace(/<\s*br\b[^>]*>/gi, "\n").replace(/<\s*li\b[^>]*>/gi, "\n\u2022 ")
      .replace(/<\/\s*(p|div|h[1-6]|tr|ul|ol|table|blockquote|section|article|pre|dl|dt|dd|header|footer|figure)\s*>/gi, "\n")
      .replace(/<\s*(p|div|h[1-6]|tr|ul|ol|table|blockquote|hr)\b[^>]*>/gi, "\n").replace(/<\/\s*(td|th)\s*>/gi, " ")
      .replace(HT_TAGRE, "").replace(HT_OPENRE, "")
      .replace(/&(#[xX][0-9a-fA-F]+|#\d+|[A-Za-z][A-Za-z0-9]{1,9});?/g, (m, n) => m.endsWith(";") || n[0] === "#" || HT_HAS(HT_ENT, n) ? dec(m, n) : m);
    if (t === before) break;
  }
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\u2060\uFEFF\u00AD]/g, "").replace(/[ \t\f\v\u00A0\u2000-\u200A\u202F\u205F\u3000]+/g, " ").replace(/\r\n?/g, "\n");
  t = o.line ? t.replace(/\s+/g, " ") : t.replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n");
  t = t.trim();
  return o.max && t.length > o.max ? t.slice(0, o.max) : t;
}
const htmlLine = s => htmlText(s, {line: true});
// Text that still carries markup or entities (<p>, &amp;, &#39;)
const HT_DIRTY = new RegExp("<\\/?(?:" + HT_TAGS + ")(?=[\\s/>])|&(?:#\\d+|#[xX][0-9a-fA-F]+|[A-Za-z][A-Za-z0-9]{1,9});");
const scrubText = (s, line) => typeof s === "string" && HT_DIRTY.test(s) ? htmlText(s, {line}) : s;
function scrubFields(o, lineKeys, blockKeys){ lineKeys.forEach(k => { if (o[k]) o[k] = scrubText(o[k], true); }); (blockKeys || []).forEach(k => { if (o[k]) o[k] = scrubText(o[k], false); }); return o; }
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
/* Hooks: how the 1.11 feature modules plug into the app hook(name, fn) registers; fire */
const HOOK = {}, VIEWS = {};
/* Recent errors, kept in memory only (never saved or sent on their own) */
const ERRLOG = [];
(() => {
  const add = (k, m) => { try { ERRLOG.push({t: Date.now(), k, m: String(m || "").replace(/AIza[\w-]{20,}|sk-[\w-]{16,}|sb_(?:secret|publishable)_[\w-]+|eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{5,}|(key|token|apikey|authorization|bearer)([=:\s]+)[\w.~+\/-]{12,}/gi, "[hidden]").replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]").slice(0, 240)}); if (ERRLOG.length > 15) ERRLOG.shift(); } catch(e) {} };
  window.addEventListener("error", e => add("error", (e.message || "error") + (e.filename ? " @" + String(e.filename).split("/").pop().split("?")[0] + ":" + e.lineno : "")));
  window.addEventListener("unhandledrejection", e => add("promise", e.reason && e.reason.message || e.reason));
  const ce = console.error;
  console.error = function(...a){ add("console", a.map(x => x instanceof Error ? x.message : typeof x === "string" ? x : x && x.message || "").join(" ")); return ce.apply(this, a); };
})();
const hook = (name, fn) => { (HOOK[name] = HOOK[name] || []).push(fn); };
// iPhone and iPad: never zoom the whole app. iOS zooms in when a text box with small type gets focus and doesn't zoom back,
// leaving the header and tab bar off screen. A top scale of 1 stops that; Safari still lets people pinch to zoom (iOS
// ignores the limit for pinches), the app's own web view doesn't. The whiteboard and note board zoom inside the page.
(function(){
  try {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const m = document.querySelector('meta[name="viewport"]');
    if (ios && m && !/maximum-scale/.test(m.content)) m.content = m.content + ", maximum-scale=1";
  } catch (e) {}
})();
const fire = (name, ...a) => (HOOK[name] || []).map(fn => { try { return fn(...a); } catch(e) { console.warn("hook " + name, e); return undefined; } });
window.__sbFire = fire;
const clone = o => o == null ? o : JSON.parse(JSON.stringify(o));
