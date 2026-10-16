// A small, dependency-free email reader for Email to Studyboard: from the raw message to {subject, from, messageId, text}.
// It handles what forwarded school email really looks like: multipart/alternative and mixed, quoted-printable and base64, RFC 2047
// encoded headers, UTF-8, Latin-1 and Windows-1252, HTML-only mail (turned into plain text), and a message forwarded as an attachment
// (message/rfc822). Attachments are skipped; only text is kept. Pure functions: also run in Node by tests/email-capture.test.js.

const MAX_TEXT = 20000, MAX_DEPTH = 6, MAX_HTML = 200000;

// Raw bytes <-> a "binary string" (one char per byte), which keeps the structure parsing simple and lossless
const toBin = bytes => { let s = ""; for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192)); return s; };
const fromBin = s => { const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 255; return b; };

// Windows-1252's characters in 0x80..0x9F (Latin-1 has control codes there); anything else in Latin-1 maps to the same code point
const W1252 = { 0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160, 0x8B: 0x2039, 0x8C: 0x0152, 0x8E: 0x017D,
  0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014, 0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A, 0x9C: 0x0153, 0x9E: 0x017E, 0x9F: 0x0178 };
export function decodeCharset(bytes, charset){
  const cs = String(charset || "utf-8").toLowerCase().replace(/^["']|["']$/g, "").trim();
  if (/^(us-ascii|ascii|iso-8859-1|latin1|l1|iso_8859-1|windows-1252|cp1252|x-cp1252)$/.test(cs)) {
    let s = ""; for (const b of bytes) s += String.fromCharCode(b >= 0x80 && b <= 0x9F && W1252[b] ? W1252[b] : b); return s;
  }
  try { return new TextDecoder(cs === "utf8" ? "utf-8" : cs, { fatal: false }).decode(bytes); }
  catch (e) { return new TextDecoder("utf-8", { fatal: false }).decode(bytes); }
}
function b64Bytes(s){
  let t = String(s).replace(/[^A-Za-z0-9+/]/g, "");   // padding comes back below; anything else (line breaks) is not data
  if (t.length % 4 === 1) t = t.slice(0, -1);
  t += "===".slice(0, (4 - t.length % 4) % 4);
  return fromBin(typeof atob === "function" ? atob(t) : Buffer.from(t, "base64").toString("latin1"));
}
function qpBytes(s, header){
  let t = String(s);
  if (header) t = t.replace(/_/g, " ");
  else t = t.replace(/=\r?\n/g, "");   // soft line breaks
  const out = [];
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === "=" && /^[0-9A-Fa-f]{2}$/.test(t.substr(i + 1, 2))) { out.push(parseInt(t.substr(i + 1, 2), 16)); i += 2; }
    else out.push(t.charCodeAt(i) & 255);
  }
  return new Uint8Array(out);
}
// =?utf-8?B?...?= and =?iso-8859-1?Q?...?= words in a header; the space between two encoded words is dropped.
// NUL marks the decoded words below, so a NUL in the header itself is removed first (it would split the header in the wrong places).
const uriDecode = p => { try { return decodeURIComponent(p); } catch (e) { return p; } };
export function decodeWords(v){
  const s = String(v || "").replace(/\u0000/g, "").replace(/(=\?[^?]+\?[bBqQ]\?[^?]*\?=)\s+(?==\?[^?]+\?[bBqQ]\?[^?]*\?=)/g, "$1");
  const bin = s.replace(/=\?([^?*]+)(?:\*[^?]*)?\?([bBqQ])\?([^?]*)\?=/g, (all, cs, enc, txt) => {
    try { return "\u0000" + encodeURIComponent(decodeCharset(enc.toUpperCase() === "B" ? b64Bytes(txt) : qpBytes(txt, true), cs)) + "\u0000"; } catch (e) { return all; }
  });
  // what was not encoded is raw bytes (often UTF-8 sent as-is); what was decoded is marked and passed through
  return bin.split("\u0000").map((p, i) => i % 2 ? uriDecode(p) : decodeCharset(fromBin(p), "utf-8")).join("");
}
// Headers: unfolded, names in lower case, first value wins (all values kept in .all)
export function parseHeaders(head){
  const lines = String(head).replace(/\r\n/g, "\n").split("\n"), h = { all: {} };
  let cur = null;
  for (const l of lines) {
    if (/^[ \t]/.test(l) && cur) { cur.v += " " + l.trim(); continue; }
    const m = /^([^:\s]+):\s*(.*)$/.exec(l);
    if (!m) { cur = null; continue; }
    cur = { k: m[1].toLowerCase(), v: m[2] };
    (h.all[cur.k] = h.all[cur.k] || []).push(cur);
  }
  for (const k of Object.keys(h.all)) h[k] = h.all[k][0].v;
  return h;
}
// "text/plain; charset=UTF-8; boundary="x"" -> {type: "text/plain", params: {charset: "UTF-8", boundary: "x"}}
export function parseType(v){
  const parts = String(v || "text/plain").split(";"), type = parts.shift().trim().toLowerCase() || "text/plain", params = {};
  const rest = parts.join(";"), re = /([\w*.-]+)\s*=\s*("(?:[^"\\]|\\.)*"|[^;]*)/g; let m;
  while ((m = re.exec(rest))) params[m[1].toLowerCase()] = m[2].trim().replace(/^"|"$/g, "").replace(/\\(.)/g, "$1");
  return { type, params };
}
const addrOf = v => { const s = decodeWords(v || ""), m = /<([^<>\s@]+@[^<>\s@]+)>/.exec(s) || /([^\s<>"',;:]+@[^\s<>"',;:]+)/.exec(s); return m ? m[1].toLowerCase() : ""; };

const ENT = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", ndash: "–", mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", bull: "•", middot: "·", copy: "©", reg: "®", trade: "™", eacute: "é", egrave: "è", agrave: "à", ccedil: "ç", uuml: "ü", ouml: "ö", auml: "ä", szlig: "ß", ntilde: "ñ" };
// Every pattern here runs in linear time, whatever the mail holds: a tag stops at the next "<" ([^<>]), an unclosed comment, style or
// script runs to the end (as in a browser; <head> itself is just a tag, its title and styles go here), and a link's words are looked
// for in at most 2000 characters. Very long HTML is cut first.
export function htmlToText(html){
  let t = String(html || "").slice(0, MAX_HTML);
  t = t.replace(/<!--[\s\S]*?(?:-->|$)/g, " ").replace(/<(style|script|title|xml)\b[\s\S]*?(?:<\/\1\s*>|$)/gi, " ");
  t = t.replace(/<br\s*\/?>/gi, "\n").replace(/<li\b[^<>]*>/gi, "\n• ").replace(/<\/(p|div|tr|h[1-6]|table|blockquote|section|article|ul|ol)\s*>/gi, "\n").replace(/<(p|div|tr|h[1-6]|table|blockquote|ul|ol)\b[^<>]*>/gi, "\n").replace(/<\/t[dh]\s*>/gi, "  ");
  t = t.replace(/<a\b[^<>]*href\s*=\s*["']?(https?:[^"'\s<>]+)["']?[^<>]*>([\s\S]{0,2000}?)<\/a\s*>/gi, (all, href, label) => label.replace(/<[^<>]*>/g, "").trim() || href);   // a link keeps its words (tracking addresses are long)
  t = t.replace(/<[^<>]*>/g, "");
  t = t.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, e) => { if (e[0] === "#") { const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ""; } return ENT[e.toLowerCase()] ?? all; });
  return tidy(t);
}
// Plain text that reads well: no trailing spaces, no long runs of blank lines, quoting marks removed
export function tidy(t){
  return String(t || "").replace(/\r\n?/g, "\n").replace(/[ \t ]+/g, " ").split("\n").map(l => l.replace(/^(\s*>)+\s?/, "").trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function splitHeadBody(bin){
  const m = /\r?\n\r?\n/.exec(bin);
  return m ? [bin.slice(0, m.index), bin.slice(m.index + m[0].length)] : [bin, ""];
}
function bodyBytes(raw, enc){
  const e = String(enc || "").toLowerCase().trim();
  if (e === "base64") return b64Bytes(raw);
  if (e === "quoted-printable") return qpBytes(raw, false);
  return fromBin(raw);
}
// Collects {plain: [], html: [], inner: [parsed forwarded messages]}
function walk(bin, out, depth){
  const [head, body] = splitHeadBody(bin), h = parseHeaders(head), ct = parseType(h["content-type"]);
  const disp = String(h["content-disposition"] || "").toLowerCase();
  if (ct.type.startsWith("multipart/") && ct.params.boundary && depth < MAX_DEPTH) {
    const b = "--" + ct.params.boundary, parts = body.split(new RegExp("\\r?\\n?" + b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?:--)?[ \\t]*\\r?\\n?"));
    parts.slice(1).forEach(p => { if (p.trim()) walk(p, out, depth + 1); });
    return h;
  }
  if (ct.type === "message/rfc822" && depth < MAX_DEPTH) { out.inner.push(parseBin(toBin(bodyBytes(body, h["content-transfer-encoding"])), depth + 1)); return h; }
  if (/^attachment/.test(disp) && !/^text\/plain/.test(ct.type)) return h;
  if (ct.type === "text/plain" || ct.type === "text/html") {
    const text = decodeCharset(bodyBytes(body, h["content-transfer-encoding"]), ct.params.charset);
    (ct.type === "text/html" ? out.html : out.plain).push(text);
  }
  return h;
}
function parseBin(bin, depth){
  const out = { plain: [], html: [], inner: [] }, h = walk(bin, out, depth || 0);
  let text = out.plain.length ? tidy(out.plain.join("\n\n")) : out.html.length ? htmlToText(out.html.join("\n")) : "";
  out.inner.forEach(m => {
    const head = [m.from && `From: ${m.from}`, m.subject && `Subject: ${m.subject}`].filter(Boolean).join("\n");
    text = (text ? text + "\n\n" : "") + "---------- Forwarded message ----------\n" + (head ? head + "\n\n" : "") + m.text;
  });
  return { subject: decodeWords(h.subject || "").replace(/\s+/g, " ").trim(), from: addrOf(h.from), messageId: String(h["message-id"] || "").trim().replace(/^<|>$/g, "").slice(0, 200),
    autoSubmitted: String(h["auto-submitted"] || "").toLowerCase().trim(), text: text.slice(0, MAX_TEXT) };
}
// The whole message (a Uint8Array or a string of bytes) -> {subject, from, messageId, autoSubmitted, text}
export function parseEmail(raw){
  return parseBin(typeof raw === "string" ? raw : toBin(raw), 0);
}
