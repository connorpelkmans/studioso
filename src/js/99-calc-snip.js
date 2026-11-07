/* ===== module: 99-calc-snip.js: "select an equation on screen" for the calculator ===== */
/* The calculator's corner button lays a sheet over the app; drag a box over an equation anywhere (a note, a card, a PDF, a
   whiteboard, a picture) and it's typed into the calculator, ready for =. Reading it, in order:
   1. math the app drew itself (KaTeX keeps each formula's TeX), turned into calculator text here;
   2. plain text under the box, tidied (×, ÷, −, ², √, π, ½ ...) and used as it is when it's clearly just math;
   3. otherwise the AI reads the text and a picture of the box (handwriting, photos, drawings, word problems) and writes
      the equation in the calculator's own syntax, which is checked before it's typed in.
   Without AI only 1 and 2 work, and the calculator says so for pictures. */
(() => {
  let veil = null;
  const calcWin = () => window.SBCALC && SBCALC.win && SBCALC.win();

  /* The sheet you drag on */
  function start(){
    if (veil) return;
    const W = calcWin(); if (W) W.style.visibility = "hidden";
    veil = document.createElement("div"); veil.className = "cxs-veil"; veil.setAttribute("role", "dialog"); veil.setAttribute("aria-label", "Select an equation");
    // "Esc to cancel" only where there's a keyboard: on a touch screen (iPad, phone) there's no Esc key (a tap cancels)
    const touch = !!(window.matchMedia && matchMedia("(hover: none) and (pointer: coarse)").matches);
    veil.innerHTML = `<div class="cxs-hint">Drag over an equation${touch ? "" : " <span>Esc to cancel</span>"}</div><div class="cxs-box" hidden></div>`;
    document.body.appendChild(veil);
    const box = veil.querySelector(".cxs-box");
    let x0 = 0, y0 = 0, on = false;
    const draw = (x, y) => { const L = Math.min(x0, x), T = Math.min(y0, y); Object.assign(box.style, {left: L + "px", top: T + "px", width: Math.abs(x - x0) + "px", height: Math.abs(y - y0) + "px"}); box.hidden = false; };
    veil.addEventListener("pointerdown", e => { if (e.button > 0) { end(null); return; } e.preventDefault(); on = true; x0 = e.clientX; y0 = e.clientY; draw(x0, y0); veil.setPointerCapture(e.pointerId); veil.classList.add("is-drag"); });
    veil.addEventListener("pointermove", e => { if (on) draw(e.clientX, e.clientY); });
    veil.addEventListener("pointerup", e => {
      if (!on) return; on = false;
      const r = {left: Math.min(x0, e.clientX), top: Math.min(y0, e.clientY), right: Math.max(x0, e.clientX), bottom: Math.max(y0, e.clientY)};
      r.width = r.right - r.left; r.height = r.bottom - r.top;
      end(r.width < 8 || r.height < 6 ? null : r);
    });
    veil.addEventListener("contextmenu", e => { e.preventDefault(); end(null); });
    document.addEventListener("keydown", esc0, true);
  }
  function esc0(e){ if (e.key === "Escape" && veil) { e.preventDefault(); e.stopImmediatePropagation(); end(null); } }
  function end(rect){
    document.removeEventListener("keydown", esc0, true);
    if (veil) { veil.remove(); veil = null; }
    // what's under the box is read before the calculator comes back over it
    let got = null; if (rect) { try { got = {tex: texIn(rect), text: textIn(rect)}; } catch (e) { console.warn("calculator select", e); } }
    const W = calcWin(); if (W) W.style.visibility = "";
    if (rect) read(rect, got).catch(e => { console.warn("calculator select", e); say("Couldn't read that"); });
  }
  const say = t => { if (window.SBCALC) SBCALC.note(t); };

  /* What's under the box */
  const over = (a, r) => Math.max(0, Math.min(a.right, r.right) - Math.max(a.left, r.left)) * Math.max(0, Math.min(a.bottom, r.bottom) - Math.max(a.top, r.top));
  const skip = el => !!(el && el.closest && el.closest("#calc,.cxs-veil,script,style,noscript,template,[hidden],.katex-mathml"));
  // only what's on top at that point (not text hidden under a sheet or a window)
  const onTop = (x, y, el) => { const h = document.elementFromPoint(x, y); return !!h && (h === el || el.contains(h) || h.contains(el)); };
  const shown = el => { const cs = getComputedStyle(el); return cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) > 0.05; };
  function texIn(r){
    const out = [];
    document.querySelectorAll(".mth[data-tex]").forEach(m => { if (skip(m) || !shown(m)) return; const b = m.getBoundingClientRect(); if (b.width && over(b, r) >= 0.5 * b.width * b.height && onTop(b.left + b.width / 2, b.top + b.height / 2, m)) out.push({tex: m.dataset.tex, top: b.top, left: b.left}); });
    return out;
  }
  function textIn(r){
    const bits = [], walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {acceptNode: n => {
      const p = n.parentElement; if (!p || !n.nodeValue.trim() || skip(p) || p.closest(".mth,.katex")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT; }});
    const range = document.createRange();
    for (let n = walker.nextNode(), seen = 0; n && seen < 4000; n = walker.nextNode()) {
      const pr = n.parentElement.getBoundingClientRect(); if (!over(pr, r) && !(pr.width === 0 && pr.height === 0)) continue;
      range.selectNodeContents(n); const rects = [...range.getClientRects()]; if (!rects.some(x => over(x, r) > 0)) continue;
      if (!shown(n.parentElement)) continue; seen++;
      const all = range.getBoundingClientRect(), s = n.nodeValue;
      const first = rects.find(x => over(x, r) > 0);
      if (all.left >= r.left - 2 && all.right <= r.right + 2 && all.top >= r.top - 2 && all.bottom <= r.bottom + 2) { if (onTop(first.left + first.width / 2, first.top + first.height / 2, n.parentElement)) bits.push({s, top: all.top, left: all.left, h: all.height}); continue; }
      // partly inside: keep the letters whose middle is in the box
      let cur = null; const lim = Math.min(s.length, 3000);
      for (let i = 0; i < lim; i++) {
        range.setStart(n, i); range.setEnd(n, i + 1); const b = range.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        const inside = b.width + b.height > 0 && cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom && onTop(cx, cy, n.parentElement);
        if (inside) { if (!cur || Math.abs(b.top - cur.top) > b.height / 2) { cur = {s: "", top: b.top, left: b.left, h: b.height}; bits.push(cur); } cur.s += s[i]; } else cur = null;
      }
    }
    // form fields under the box: their text (or what's selected in them)
    document.querySelectorAll("input,textarea").forEach(f => {
      if (skip(f) || !shown(f) || /^(checkbox|radio|button|submit|range|color|file|hidden|password)$/i.test(f.type)) return;
      const b = f.getBoundingClientRect(); if (!over(b, r) || !onTop(b.left + b.width / 2, b.top + b.height / 2, f)) return;
      const v = f.selectionEnd > f.selectionStart ? f.value.slice(f.selectionStart, f.selectionEnd) : f.value;
      if (v.trim()) bits.push({s: v, top: b.top, left: b.left, h: b.height});
    });
    // lines, top to bottom, then left to right
    bits.sort((a, b) => Math.abs(a.top - b.top) > Math.min(a.h, b.h) / 2 ? a.top - b.top : a.left - b.left);
    let txt = "", last = null;
    bits.forEach(b => { txt += !last ? b.s : Math.abs(b.top - last.top) > Math.min(b.h, last.h) / 2 ? "\n" + b.s : (/\s$/.test(txt) || /^\s/.test(b.s) ? "" : " ") + b.s; last = b; });
    return txt.replace(/[ \t]+/g, " ").trim().slice(0, 4000);
  }
  // A picture of the box: the images, canvases and drawings under it (text is read separately). null when there are none.
  async function pictureOf(r){
    const els = [...document.querySelectorAll("img,canvas,svg,video")].filter(el => {
      if (skip(el) || !shown(el) || (el.tagName === "svg" && el.parentElement && el.parentElement.closest("svg"))) return false;
      const b = el.getBoundingClientRect(); if (b.width < 24 || b.height < 16 || !over(b, r)) return false;
      if (el.tagName === "svg" && b.width < 48 && b.height < 48) return false;   // icons
      return true;
    });
    if (!els.length) return null;
    const scale = Math.min(2.5, Math.max(1, 1400 / Math.max(r.width, r.height))), c = document.createElement("canvas");
    c.width = Math.round(r.width * scale); c.height = Math.round(r.height * scale);
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
    let drew = 0;
    for (const el of els) {
      const b = el.getBoundingClientRect(), dx = (b.left - r.left) * scale, dy = (b.top - r.top) * scale, dw = b.width * scale, dh = b.height * scale;
      try {
        if (el.tagName === "svg") {
          const cl = el.cloneNode(true); cl.setAttribute("width", b.width); cl.setAttribute("height", b.height); if (!cl.getAttribute("xmlns")) cl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
          // strokes drawn with currentColor or CSS colours: write the computed ones in
          const src = el.querySelectorAll("path,line,polyline,polygon,circle,ellipse,rect,text"), dst = cl.querySelectorAll("path,line,polyline,polygon,circle,ellipse,rect,text");
          src.forEach((s, i) => { const cs = getComputedStyle(s); if (dst[i]) { dst[i].setAttribute("stroke", cs.stroke); dst[i].setAttribute("fill", cs.fill); dst[i].setAttribute("stroke-width", cs.strokeWidth); } });
          const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(cl)], {type: "image/svg+xml"}));
          try { const im = new Image(); im.src = url; await im.decode(); g.drawImage(im, dx, dy, dw, dh); drew++; } finally { URL.revokeObjectURL(url); }
        } else if (el.tagName === "IMG") {
          if (!el.complete || !el.naturalWidth) continue;
          // object-fit contain / cover: where the picture really is inside the element
          const fit = getComputedStyle(el).objectFit, iw = el.naturalWidth, ih = el.naturalHeight;
          let x = dx, y = dy, w = dw, h = dh;
          if (fit === "contain" || fit === "cover") { const k = (fit === "contain" ? Math.min : Math.max)(dw / iw, dh / ih); w = iw * k; h = ih * k; x = dx + (dw - w) / 2; y = dy + (dh - h) / 2; }
          g.save(); g.beginPath(); g.rect(dx, dy, dw, dh); g.clip(); g.drawImage(el, x, y, w, h); g.restore(); drew++;
        } else { g.drawImage(el, dx, dy, dw, dh); drew++; }
      } catch (e) { /* a picture from another site can't be read */ }
    }
    if (!drew) return null;
    try { c.getContext("2d").getImageData(0, 0, 1, 1); } catch (e) { return null; }   // tainted
    return await new Promise(res => c.toBlob(b => res(b), "image/jpeg", 0.9));
  }

  /*SNIP-START*/
  /* Tidying text into the calculator's syntax (see fromText in 99-calculator.js) */
  const SUPS = {"⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-", "⁺": "+", "ˣ": "x", "ⁿ": "n", "⁽": "(", "⁾": ")"};
  const VULG = {"½": "(1/2)", "⅓": "(1/3)", "⅔": "(2/3)", "¼": "(1/4)", "¾": "(3/4)", "⅕": "(1/5)", "⅖": "(2/5)", "⅗": "(3/5)", "⅘": "(4/5)", "⅙": "(1/6)", "⅚": "(5/6)", "⅛": "(1/8)", "⅜": "(3/8)", "⅝": "(5/8)", "⅞": "(7/8)"};
  const FUN = /^(sin|cos|tan|asin|acos|atan|arcsin|arccos|arctan|sinh|cosh|tanh|sqrt|cbrt|ln|log|abs|exp|root|integrate|deriv|sum|nCr|nPr|pi|Ans)$/;
  function tidy(s){
    let deg = false;
    // equations on separate lines are a system
    const lines = String(s || "").split(/\n+/).map(x => x.trim()).filter(Boolean);
    if (lines.length > 1 && lines.every(x => /=/.test(x))) s = lines.join("; ");
    s = String(s || "").replace(/[​ ]/g, " ");
    s = s.replace(/[×✕⨯·⋅∙]/g, "*").replace(/[÷∶]/g, "/").replace(/[−–—‒﹣]/g, "-").replace(/[＝]/g, "=").replace(/[（]/g, "(").replace(/[）]/g, ")");
    s = s.replace(/π/g, " pi ").replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, c => VULG[c]);
    s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ˣⁿ⁽⁾]+/g, m => "^(" + [...m].map(c => SUPS[c]).join("") + ")");
    if (/°/.test(s)) { deg = true; s = s.replace(/°/g, ""); }
    // √x, √(x), ∛x
    s = s.replace(/([√∛])\s*(\((?:[^()]|\([^()]*\))*\)|[\d.]+|[A-Za-z])/g, (m, r, a) => (r === "√" ? "sqrt" : "cbrt") + (a[0] === "(" ? a : "(" + a + ")"));
    s = s.replace(/\*\*/g, "^").replace(/\s+/g, " ").trim().replace(/[.?:]+$/, "").trim();
    return {s, deg};
  }
  // Is this just math (not a sentence with numbers in it)?
  function justMath(s){
    if (!s || !/^[0-9A-Za-z+\-*/^().,=;!% ]+$/.test(s) || !/[\d]/.test(s) && !/=/.test(s)) return false;
    const words = s.match(/[A-Za-z]{2,}/g) || [];
    return words.every(w => FUN.test(w)) && /[+\-*/^=!%]|[A-Za-z]\(/.test(s);
  }
  // The math in a line of text, without AI: words become breaks, and the longest piece that's clearly math is kept
  function mathRuns(s){
    const t = s.replace(/[A-Za-z]{2,}/g, w => FUN.test(w) ? w : "|").replace(/\b(?:a|A|I)\b(?!\s*[-+*/^=(\d])/g, "|").replace(/[^0-9A-Za-z+\-*/^().,=;!% ]/g, "|");
    return t.split("|").map(x => {
      x = x.trim().replace(/^[,;=*/^)+]+|[,;=*/^(+-]+$/g, "").trim();
      for (let k = 0; k < 4; k++) { const o = (x.match(/\(/g) || []).length, c = (x.match(/\)/g) || []).length; if (o > c && x[0] === "(") x = x.slice(1).trim(); else if (c > o && x.endsWith(")")) x = x.slice(0, -1).trim(); else break; }
      return x;
    }).filter(justMath).sort((a, b) => b.length - a.length);
  }
  /* TeX (from the app's own math) to calculator text; "" if it uses something this doesn't know (then the AI reads it) */
  function group(s, i){ if (s[i] !== "{") { const m = /^\\[A-Za-z]+|^./.exec(s.slice(i)); return m ? [m[0], i + m[0].length] : ["", i]; } let d = 0; for (let k = i; k < s.length; k++) { if (s[k] === "{") d++; else if (s[k] === "}" && --d === 0) return [s.slice(i + 1, k), k + 1]; } return [s.slice(i + 1), s.length]; }
  function texToCalc(tex){
    let s = String(tex || "").replace(/\\(left|right|displaystyle|textstyle|,|;|!|quad|qquad)\b|\\[,;! ]/g, " ").replace(/\$/g, "").replace(/&/g, "");
    let out = "", i = 0;
    while (i < s.length) {
      if (s.startsWith("\\frac", i) || s.startsWith("\\dfrac", i) || s.startsWith("\\tfrac", i)) { i = s.indexOf("frac", i) + 4; while (s[i] === " ") i++; const [a, j] = group(s, i); let k = j; while (s[k] === " ") k++; const [b, l] = group(s, k); const A = texToCalc(a), B = texToCalc(b); if (!A || !B) return ""; const w = x => /^\s*(?:[\d.]+|[A-Za-z])\s*$/.test(x) ? x.trim() : `(${x})`; out += `(${w(A)}/${w(B)})`; i = l; continue; }
      if (s.startsWith("\\sqrt", i)) { i += 5; while (s[i] === " ") i++; let n = ""; if (s[i] === "[") { const e = s.indexOf("]", i); n = texToCalc(s.slice(i + 1, e)); i = e + 1; } const [a, j] = group(s, i); const A = texToCalc(a); if (!A) return ""; out += n ? `root(${n}, ${A})` : `sqrt(${A})`; i = j; continue; }
      if (s[i] === "^") { i++; while (s[i] === " ") i++; const [a, j] = group(s, i); const A = texToCalc(a); if (!A) return ""; out += `^(${A})`; i = j; continue; }
      if (s[i] === "_") return "";   // subscripts (log bases, indices): left to the AI
      if (s[i] === "{") { const [a, j] = group(s, i); const A = texToCalc(a); if (!A && a.trim()) return ""; out += `(${A})`; i = j; continue; }
      if (s[i] === "\\") {
        const m = /^\\([A-Za-z]+)/.exec(s.slice(i)); if (!m) { i++; continue; }
        const w = m[1], MAP = {cdot: "*", times: "*", div: "/", pi: "pi", sin: "sin", cos: "cos", tan: "tan", ln: "ln", log: "log", sinh: "sinh", cosh: "cosh", tanh: "tanh", arcsin: "asin", arccos: "acos", arctan: "atan", exp: "exp"};
        if (!(w in MAP)) return "";
        out += " " + MAP[w] + " "; i += m[0].length; continue;
      }
      out += s[i]; i++;
    }
    // sin x → sin(x), sin 2x → sin(2x)
    out = out.replace(/\b(sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|ln|log|exp)\s+(?!\()([\d.]*[A-Za-z]?(?:\^\([^()]*\))?)/g, (m, f, a) => a ? `${f}(${a})` : m);
    return tidy(out).s;
  }
  /*SNIP-END*/

  const CALC_RULES = `Write it in this calculator syntax, nothing else:
- numbers, + - * / ^ and brackets; implied multiplication is fine (2x, 3(x+1))
- functions: sqrt(x), cbrt(x), root(n, x) for the nth root, ln(x), log(x) for base 10, log(x, b) for base b, exp(x), abs(x), sin cos tan asin acos atan sinh cosh tanh, n! for factorial, nCr(n, r), nPr(n, r)
- constants: pi, e
- unknowns: single letters only (x, y, z, t, n ...); never use e as an unknown
- an equation uses one =; the equations of a system are separated by ;
- calculus: integrate(f, x, a, b) for a definite integral, deriv(f, x, a) for the derivative at x = a, sum(f, n, a, b) for a sum from n = a to b
- a fraction a over b is (a)/(b); a mixed number like 2 1/2 is (2+1/2); percent: write 15% of 80 as 0.15*80`;
  const SYSTEM = `You read math for a student's scientific calculator. The student dragged a box over part of their screen; you get the text found in the box and, when there is one, a picture of it (handwriting, a photo, a drawing or a screenshot).
Find the one equation or expression they most likely want calculated or solved, and write it exactly as shown (don't solve it, don't simplify it, don't change any number).
If it's a word problem or an instruction like "solve for x", write the equation it gives. If there are several, take the first complete one; a system of equations is one answer.
${CALC_RULES}
angle: "deg" when the problem uses degrees (°), "rad" when it uses radians or calculus with trig, otherwise "none".
If there's no math in it, set found to false.`;
  const SCHEMA = {type: "OBJECT", properties: {found: {type: "BOOLEAN"}, calc: {type: "STRING"}, angle: {type: "STRING", enum: ["none", "deg", "rad"]}}, required: ["found", "calc", "angle"]};

  async function read(r, got){
    say("Reading…");
    const tex = got ? got.tex : texIn(r), text = got ? got.text : textIn(r);
    // 1. the app's own math, when that's all that's in the box
    if (tex.length && text.replace(/\s+/g, "").length < 3) {
      const calc = tex.sort((a, b) => a.top - b.top || a.left - b.left).map(t => texToCalc(t.tex)).filter(Boolean);
      if (calc.length === tex.length && calc.length <= 4 && SBCALC.put(calc.join("; "))) { done(); return; }
    }
    // 2. plain math as text
    const t = tidy(text);
    if (!tex.length && justMath(t.s) && SBCALC.put(t.s, t.deg ? "deg" : "")) { done(); return; }
    // 3. the AI
    const pic = await pictureOf(r);
    if (!aiReady()) {
      // the last try without AI: the longest run of math in the text
      const runs = mathRuns(t.s);
      if (runs[0] && SBCALC.put(runs[0], t.deg ? "deg" : "")) { done(); return; }
      say(""); toast(pic || tex.length ? "Turn on AI in Settings to read equations from pictures and handwriting" : "No equation found there");
      return;
    }
    if (!text && !tex.length && !pic) { say(""); toast("Nothing to read there"); return; }
    const parts = [];
    if (pic) parts.push({inline_data: {mime_type: "image/jpeg", data: bytesToB64(new Uint8Array(await pic.arrayBuffer()))}});
    parts.push({text: `TEXT IN THE BOX:\n"""${text || "(none)"}"""${tex.length ? `\nFORMULAS IN THE BOX (LaTeX):\n${tex.map(x => x.tex).join("\n")}` : ""}`});
    let res;
    try { res = await aiCall({task: "mathread", fast: true, temperature: 0, maxTokens: 1500, timeout: 45000, schema: SCHEMA, system: SYSTEM, parts}); }
    catch (e) { say(""); toast((e && e.message) || "Couldn't read that. Try again."); return; }
    const d = res && res.data;
    if (!d || !d.found || !d.calc) { say(""); toast("No equation found there"); return; }
    const calc = tidy(d.calc).s;
    if (!SBCALC.put(calc, d.angle)) { say(""); toast("Couldn't read that equation"); return; }
    done();
  }
  function done(){
    const W = calcWin(); if (!W) return;
    const ex = W.querySelector(".cx-expr"); if (ex) { ex.classList.remove("cx-in"); void ex.offsetWidth; ex.classList.add("cx-in"); }
    const eq = W.querySelector('[data-cx="eq"]'); if (eq) eq.focus({preventScroll: true});
  }

  window.SBCALCSNIP = {start, read, tidy, justMath, mathRuns, texToCalc, textIn, texIn};
})();
