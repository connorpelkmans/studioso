/* ===== module: 01-page-text.js: a web page's readable text, from its HTML ===== */
/* One copy, used in two places (like 01-ai-policy.js):
   - the website's Worker (cloudflare/site/page-text.js) fetches a page for the website, which browsers can't do across sites, and
     returns only this text (never the page itself);
   - the iPhone app fetches the page itself and runs this on it.
   Then the AI (any of them, including the small one on the device) makes study notes from plain text, which needs no web access.
   Plain script, no DOM and no imports, so it runs in the app's bundle and in a Worker (both read globalThis.SBPAGE).
   Unit tested in tests/page-text.test.js. */
const SBPAGE = (() => {
  const MAX_HTML = 2000000, MAX_TEXT = 60000;
  const ENT = {amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", copy: "©", reg: "®", deg: "°", times: "×", middot: "·", bull: "•", eacute: "é", egrave: "è", aacute: "á", iacute: "í", oacute: "ó", uacute: "ú", ntilde: "ñ", uuml: "ü", ouml: "ö", auml: "ä", szlig: "ß", ccedil: "ç", plusmn: "±", micro: "µ", alpha: "α", beta: "β", gamma: "γ", delta: "δ", pi: "π", sigma: "σ", mu: "μ", lambda: "λ", theta: "θ", omega: "ω", le: "≤", ge: "≥", ne: "≠", rarr: "→", larr: "←", harr: "↔", minus: "−", frac12: "½", sup2: "²", sup3: "³"};
  const decode = s => String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (m, e) => {
    if (e[0] === "#") { const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); try { return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ""; } catch (x) { return ""; } }
    const k = e.toLowerCase(); return ENT[k] != null ? ENT[k] : m;
  });
  // Parts of a page that are never the content
  const DROP = ["script", "style", "noscript", "template", "svg", "canvas", "iframe", "object", "embed", "select", "button", "form", "nav", "footer", "aside", "header", "menu", "dialog", "figure"];
  // class or id words that mark page furniture
  // (and Wikipedia's: citation marks, "For other uses" notes, pronunciation, edit links, reference lists, navigation boxes, categories)
  const FURNITURE = /(^|[\s_-])(nav|navbar|menu|footer|header|sidebar|side-bar|breadcrumb|cookie|consent|banner|advert|ad|ads|promo|newsletter|subscribe|signup|share|social|related|recommend|comments?|popup|modal|toolbar|skip|masthead|byline|author|credit|caption|toc|table-of-contents|hatnote|shortdescription|editsection|reference|references|reflist|navbox|catlinks|infobox|noprint|metadata|ipa|sitesub|printfooter|jump-link)([\s_-]|$)/i;
  const BLOCK = /^(p|div|section|article|main|li|ul|ol|dl|dt|dd|tr|table|thead|tbody|blockquote|pre|br|hr|h[1-6]|figcaption|caption|summary|details|address)$/i;
  const titleOf = html => { const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html), og = /<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i.exec(html) || /<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:title["']/i.exec(html);
    return decode((og ? og[1] : m ? m[1] : "").replace(/\s+/g, " ").trim()).slice(0, 200); };
  // Remove whole elements (with what's inside them) by tag name, or by a class/id that marks furniture. Nested tags of the same name
  // are counted, so an open <div class="nav"> removes up to its own closing tag.
  function strip(html){
    let h = html.replace(/<!--[\s\S]*?-->/g, " ").replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, " ");
    for (const t of DROP) h = h.replace(new RegExp(`<${t}\\b[^>]*>[\\s\\S]*?<\\/${t}\\s*>`, "gi"), " ").replace(new RegExp(`<${t}\\b[^>]*\\/?>`, "gi"), " ");
    // furniture by class or id, on block elements: find each opening tag and cut to its matching close
    const open = /<(div|section|ul|ol|span|p|table|sup)\b([^>]*)>/gi; let out = "", last = 0, m;
    while ((m = open.exec(h))) {
      const attrs = m[2]; if (!/\b(class|id|role|aria-label)\s*=/.test(attrs)) continue;
      const vals = (attrs.match(/\b(?:class|id|role)\s*=\s*["']([^"']*)["']/gi) || []).join(" ");
      if (!FURNITURE.test(vals.replace(/\b(class|id|role)\s*=\s*["']/gi, " ").replace(/["']/g, " ")) && !/role\s*=\s*["'](navigation|banner|contentinfo|complementary|dialog|search)["']/i.test(attrs)) continue;
      const tag = m[1].toLowerCase(), re = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi"); re.lastIndex = open.lastIndex; let depth = 1, end = -1, x;
      while ((x = re.exec(h))) { depth += x[1] ? -1 : 1; if (!depth) { end = re.lastIndex; break; } }
      if (end < 0) continue;
      out += h.slice(last, m.index) + " "; last = end; open.lastIndex = end;
    }
    return out + h.slice(last);
  }
  // The part of the page that holds the content: <article> or <main> when there's real text in it, else the whole body
  // (scored by the length of their text, measured once each: this runs in a Worker with a few milliseconds to spare)
  const textLen = c => c.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").length;
  function main(h){
    const pick = tag => { let best = "", bl = 0; for (const x of h.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi"))) { const l = textLen(x[1]); if (l > bl) { bl = l; best = x[1]; } } return [best, bl]; };
    for (const t of ["article", "main"]) { const [c, l] = pick(t); if (l >= 700) return c; }
    const role = /<([a-z]+)\b[^>]*role=["']main["'][^>]*>/i.exec(h);
    if (role) { const rest = h.slice(role.index); if (textLen(rest) >= 700) return rest; }
    const body = /<body\b[^>]*>([\s\S]*)<\/body>/i.exec(h); return body ? body[1] : h;
  }
  const words = t => { const m = String(t).match(/[^\s\-–—|•·.,;:!?()"']+/g); return m ? m.length : 0; };
  const plain = h => decode(String(h).replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  // HTML to text: block elements become line breaks, headings become "## Heading" lines (so the study set pipeline finds them),
  // list items become "- item", table cells are separated
  function toText(h){
    // the page's own line breaks are just spaces (lines in its source end mid-sentence); only block elements make new lines
    h = h.replace(/\s+/g, " ");
    let t = h.replace(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi, (m, tag, inner) => `\n\n${"#".repeat(Math.min(3, Number(tag[1])))} ${plain(inner)}\n\n`)
      .replace(/<li\b[^>]*>/gi, "\n- ").replace(/<\/(td|th)>/gi, " | ").replace(/<(br|hr)\b[^>]*>/gi, "\n")
      .replace(/<\/?([a-z0-9]+)\b[^>]*>/gi, (m, tag) => BLOCK.test(tag) ? "\n" : "");
    t = decode(t).replace(/\u00a0/g, " ").replace(/[ \t\f\v]+/g, " ").replace(/ *\n */g, "\n")
      // citation marks ([1], [a], [citation needed]) and the spaces markup left before punctuation
      .replace(/ ?\[ ?(\d+(?: ?[–-] ?\d+)?|[a-z]|citation needed|note \d+|nb \d+|clarification needed|when\?|who\?|page needed)\s?\]/gi, "").replace(/ +([,.;:!?)])/g, "$1").replace(/([(]) +/g, "$1")
      // brackets emptied by what was removed (a pronunciation, a citation): "Osmosis (,) is" becomes "Osmosis is"
      .replace(/ ?\(\s*[,;:/]*\s*\)/g, "");
    // lines that are page furniture even in the content: very short lines of links ("Share", "Print", "Next article"), cookie text
    const lines = t.split("\n").map(x => x.trim()).filter(x => x && !/^(share|print|email|tweet|next|previous|back to top|advertisement|read more|related|subscribe|sign in|log in|skip to (main )?content|menu|search|\|)$/i.test(x) && !/^[-|•·\s]+$/.test(x));
    return tidy(lines).join("\n").replace(/\n{3,}/g, "\n\n").replace(/\n(- )/g, "\n$1").trim();
  }
  // What's left around the article: bylines, photo credits and a table of contents before it, author bios and link lists after it,
  // the reference sections at its end, repeated footer lines, and runs of very short lines (a menu that wasn't marked as one)
  const n2 = l => words(l.replace(/^[#-]+ /, ""));
  const END = /^#+ (references|notes|see also|external links|further reading|bibliography|sources|citations|footnotes|works cited|related( articles| reading)?|about the authors?|more (from|on) .*|read more|you (may|might) also like)\.?$/i;
  function tidy(lines){
    const big = l => !/^#/.test(l) && n2(l) >= 15;
    const first = lines.findIndex(big); if (first < 0) return lines;
    let last = lines.length - 1; while (last > first && !big(lines[last])) last--;
    // before the first real paragraph, only its headings stay; after the last one, only a short list that belongs to it
    let out = lines.slice(0, first).filter(l => /^#/.test(l)).concat(lines.slice(first, last + 1));
    // (kept: a short closing sentence or a list of real items; it stops at the first line that's neither, such as a promo or link)
    const keeps = l => (/^- /.test(l) && n2(l) >= 3) || (!/^#/.test(l) && n2(l) >= 5 && /[.!?”"')]$/.test(l));
    let tail = lines.slice(last + 1); const k = tail.findIndex(l => !keeps(l)); tail = k < 0 ? tail : tail.slice(0, k); if (tail.length <= 8) out = out.concat(tail);
    // the reference sections, once past half the article
    const e = out.findIndex((l, i) => i > out.length * 0.5 && END.test(l)); if (e > 0) out = out.slice(0, e);
    // runs of six or more very short lines (each three words or fewer, not headings): a menu or table of contents
    const res = []; let run = [];
    const flush = () => { if (run.length < 6) res.push(...run); run = []; };
    for (const l of out) { if (!/^#/.test(l) && n2(l) <= 3) run.push(l); else { flush(); res.push(l); } }
    flush();
    // a line repeated word for word (a footer printed twice) stays once
    const seen = new Set(); return res.filter(l => { const key = l.toLowerCase(); if (n2(l) >= 3 && n2(l) < 15 && seen.has(key)) return false; seen.add(key); return true; });
  }
  // A page that only shows a login, paywall or cookie wall: little text, and that text is about signing in or subscribing
  const WALL = /\b(subscribe|subscription|sign in|log in|create (a free )?account|already a (member|subscriber)|to continue reading|members only|paywall|enable javascript|verify you are (a )?human|are you a robot|access denied|captcha)\b/i;
  // A bot check instead of the page, and a page that only builds its content with JavaScript (an app shell): neither can be read
  // without a browser, and saying so is better than "nothing to study"
  const CHALLENGE = /<title>\s*(just a moment|attention required|client challenge|access denied|security check|please wait|are you a robot)|cf-chl-|challenge-platform|captcha-delivery|px-captcha|_incapsula_/i;
  const SHELL = /<(div|main)[^>]+id=["'](root|app|__next|__nuxt|svelte|main-app)["']|window\.__(NEXT_DATA|NUXT|INITIAL_STATE|APOLLO_STATE)__|data-reactroot|ng-version=/i;
  function extract(html, url){
    const raw = String(html || "").slice(0, MAX_HTML);
    const title = titleOf(raw), body = toText(main(strip(raw)));
    let text = body.length > MAX_TEXT ? body.slice(0, MAX_TEXT).replace(/\n[^\n]*$/, "") : body;
    const n = words(text), cut = body.length > MAX_TEXT;
    const status = n < 40 ? (CHALLENGE.test(raw) ? "blocked" : WALL.test(text + " " + title) ? "paywall" : SHELL.test(raw) ? "needs_js" : "empty") : n < 150 && (text.match(new RegExp(WALL.source, "gi")) || []).length >= 2 ? "paywall" : "ok";
    if (status !== "ok") text = "";
    return {status, title, text, words: n, cut, url: url || ""};
  }
  // Only ordinary public web pages: http or https, the usual ports, a real host name (no addresses inside a network, no IP literals
  // in private or special ranges, no logins in the address). Checked again after every redirect.
  function safeUrl(raw){
    let u; try { u = new URL(String(raw || "").trim()); } catch (e) { return null; }
    if (!/^https?:$/.test(u.protocol) || u.username || u.password) return null;
    if (u.port && !["80", "443"].includes(u.port)) return null;
    const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
    if (!h || !h.includes(".") || /(^|\.)(localhost|local|internal|intranet|lan|home|corp|arpa|test|invalid|example)$/.test(h)) return null;
    if (/^[\d.]+$/.test(h)) { const p = h.split(".").map(Number); if (p.length !== 4 || p.some(x => !(x >= 0 && x <= 255))) return null;
      const [a, b] = p; if (a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19))) return null; }
    if (h.includes(":")) return null; // IPv6 literals: not needed for articles, and easy to get wrong
    u.hash = ""; return u;
  }
  return {extract, safeUrl, toText, titleOf, decode, words, MAX_HTML, MAX_TEXT};
})();
globalThis.SBPAGE = SBPAGE;
