/* ===== module: 99-color-picker.js ===== */
/* One colour picker for the whole app, in the whiteboard's style */
(() => {
  const SW = ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#00c7be", "#30b0c7", "#007aff", "#5856d6", "#af52de", "#ff2d55", "#a2845e", "#8e8e93", "#e83e8c", "#20c997", "#6f42c1", "#fd7e14"];
  const K_RECENT = "studyboard:recentColors";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hsv2hex = (h, s, v) => { const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); }; return "#" + [f(5), f(3), f(1)].map(x => Math.round(x * 255).toString(16).padStart(2, "0")).join(""); };
  const hex2hsv = hex => { const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; return [h, mx ? d / mx : 0, mx]; };
  const okHex = v => /^#[0-9a-f]{6}$/i.test(v || "");
  const recent = () => { try { const a = JSON.parse(localStorage.getItem(K_RECENT) || "[]"); return Array.isArray(a) ? a.filter(okHex).slice(0, 8) : []; } catch (e) { return []; } };
  const ours = inp => inp && inp.type === "color" && !inp.disabled && !(inp.closest && inp.closest(".wb-stage"));
  let OPEN = null, lastPtr = null;
  document.addEventListener("pointerdown", e => { lastPtr = e.target; }, true);

  function close(){
    const o = OPEN; if (!o) return; OPEN = null;
    o.el.remove(); document.removeEventListener("pointerdown", o.away, true);
    if (o.inp.value.toLowerCase() !== o.start) {
      o.inp.dispatchEvent(new Event("change", {bubbles: true}));
      try { localStorage.setItem(K_RECENT, JSON.stringify([o.inp.value.toLowerCase()].concat(recent().filter(x => x !== o.inp.value.toLowerCase())).slice(0, 8))); } catch (e) {}
    }
    if (o.anchor && o.anchor.isConnected && o.anchor.focus) try { o.anchor.focus({preventScroll: true}); } catch (e) {}
  }
  function open(inp){
    if (OPEN) { const same = OPEN.inp === inp; close(); if (same) return; }
    const start = (okHex(inp.value) ? inp.value : "#3e63dd").toLowerCase();
    let [h, sa, va] = hex2hsv(start);
    const vis = el => { const r = el && el.getBoundingClientRect && el.getBoundingClientRect(); return r && r.width > 4 && r.height > 4; };
    const anchor = vis(inp) ? inp : (lastPtr && lastPtr.closest && vis(lastPtr.closest("label,button,[role=button]") || lastPtr) ? (lastPtr.closest("label,button,[role=button]") || lastPtr) : inp.closest("label") || inp.parentElement);
    const el = document.createElement("div"); el.className = "sb-cpick"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", inp.getAttribute("aria-label") || "Pick a color");
    const rec = recent();
    el.innerHTML = `<div class="sb-cp-sv" tabindex="0" aria-label="Shade (arrow keys change it)"><span class="sb-cp-k"></span></div>
      <input type="range" class="sb-cp-hue" min="0" max="359" step="1" aria-label="Hue">
      <div class="sb-cp-row"><span class="sb-cp-now" aria-hidden="true"></span><label class="sb-cp-hexl"><span>#</span><input class="sb-cp-hex" maxlength="7" spellcheck="false" autocomplete="off" aria-label="Hex color"></label><button type="button" class="btn small primary sb-cp-done">Done</button></div>
      <div class="sb-cp-sw" role="group" aria-label="Colors">${SW.map(c => `<button type="button" class="sb-cp-s" data-c="${c}" style="--c:${c}" aria-label="${c}"></button>`).join("")}</div>
      ${rec.length ? `<div class="sb-cp-lbl">Recent</div><div class="sb-cp-sw" role="group" aria-label="Recent colors">${rec.map(c => `<button type="button" class="sb-cp-s" data-c="${c}" style="--c:${c}" aria-label="${c}"></button>`).join("")}</div>` : ""}`;
    (inp.closest("dialog[open]") || document.body).appendChild(el);
    const away = e => { if (!el.contains(e.target) && e.target !== inp) close(); };
    OPEN = {el, inp, start, anchor, away};
    setTimeout(() => { if (OPEN && OPEN.el === el) document.addEventListener("pointerdown", away, true); }, 0);
    const sv = el.querySelector(".sb-cp-sv"), k = el.querySelector(".sb-cp-k"), hue = el.querySelector(".sb-cp-hue"), hexIn = el.querySelector(".sb-cp-hex"), now = el.querySelector(".sb-cp-now");
    const show = fromHex => {
      const hex = hsv2hex(h, sa, va);
      sv.style.backgroundColor = `hsl(${h},100%,50%)`; k.style.left = sa * 100 + "%"; k.style.top = (1 - va) * 100 + "%"; k.style.background = hex;
      hue.value = Math.round(h); now.style.background = hex; if (!fromHex) hexIn.value = hex.slice(1);
      if (inp.value.toLowerCase() !== hex) { inp.value = hex; inp.dispatchEvent(new Event("input", {bubbles: true})); }
    };
    show(); inp.value = start;
    const svAt = e => { const r = sv.getBoundingClientRect(); sa = clamp((e.clientX - r.left) / r.width, 0, 1); va = clamp(1 - (e.clientY - r.top) / r.height, 0, 1); show(); };
    sv.addEventListener("pointerdown", e => { e.preventDefault(); sv.setPointerCapture(e.pointerId); svAt(e); const mv = ev => svAt(ev), up = () => { sv.removeEventListener("pointermove", mv); sv.removeEventListener("pointerup", up); }; sv.addEventListener("pointermove", mv); sv.addEventListener("pointerup", up); });
    sv.addEventListener("keydown", e => { const d = e.shiftKey ? 0.1 : 0.02; if (e.key === "ArrowLeft") sa = clamp(sa - d, 0, 1); else if (e.key === "ArrowRight") sa = clamp(sa + d, 0, 1); else if (e.key === "ArrowUp") va = clamp(va + d, 0, 1); else if (e.key === "ArrowDown") va = clamp(va - d, 0, 1); else return; e.preventDefault(); show(); });
    hue.addEventListener("input", () => { h = Number(hue.value) || 0; show(); });
    hexIn.addEventListener("input", () => { const v = hexIn.value.replace(/[^0-9a-f]/gi, "").toLowerCase(); if (v.length === 6) { [h, sa, va] = hex2hsv("#" + v); show(true); } });
    hexIn.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); close(); } });
    el.addEventListener("click", e => { const b = e.target.closest(".sb-cp-s"); if (b) { [h, sa, va] = hex2hsv(b.dataset.c); show(); } if (e.target.closest(".sb-cp-done")) close(); });
    el.addEventListener("keydown", e => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); } });
    el.addEventListener("cancel", e => e.preventDefault());
    const r = (anchor && anchor.getBoundingClientRect) ? anchor.getBoundingClientRect() : {left: innerWidth / 2, right: innerWidth / 2, top: innerHeight / 3, bottom: innerHeight / 3, width: 0};
    const w = el.offsetWidth, hh = el.offsetHeight;
    el.style.left = clamp(r.left + r.width / 2 - w / 2, 8, Math.max(8, innerWidth - w - 8)) + "px";
    el.style.top = (r.bottom + 8 + hh < innerHeight - 8 ? r.bottom + 8 : Math.max(8, r.top - hh - 8)) + "px";
    sv.focus({preventScroll: true});
  }
  // take over clicks on colour inputs (and their labels) and showPicker()
  document.addEventListener("click", e => {
    const t = e.target, inp = t && t.matches && t.matches('input[type="color"]') ? t : null;
    if (!ours(inp)) return;
    e.preventDefault(); open(inp);
  }, true);
  document.addEventListener("keydown", e => {
    if (OPEN && e.key === "Escape" && !OPEN.el.contains(e.target)) { e.preventDefault(); e.stopPropagation(); close(); return; }
    const t = e.target; if ((e.key === "Enter" || e.key === " ") && ours(t)) { e.preventDefault(); open(t); }
  }, true);
  try {
    const native = HTMLInputElement.prototype.showPicker;
    HTMLInputElement.prototype.showPicker = function(){ if (ours(this)) { open(this); return; } return native && native.call(this); };
  } catch (e) {}
  window.addEventListener("resize", () => close());
  window.SBCOLOR = {open, close, isOpen: () => !!OPEN};
  const css = document.createElement("style");
  css.textContent = `
.sb-cpick{position:fixed;z-index:2147483000;width:236px;padding:12px;border-radius:14px;background:var(--surface,#fff);border:1px solid var(--line,rgba(0,0,0,.12));box-shadow:0 12px 32px rgba(20,30,45,.28);display:flex;flex-direction:column;gap:10px;color:var(--ink,#22262D);margin:0}
.sb-cp-sv{position:relative;height:140px;border-radius:10px;background-image:linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,rgba(255,255,255,0));cursor:crosshair;touch-action:none;outline:none}
.sb-cp-sv:focus-visible{box-shadow:0 0 0 2px var(--accent)}
.sb-cp-k{position:absolute;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.3),0 2px 4px rgba(0,0,0,.3);pointer-events:none}
.sb-cp-hue{-webkit-appearance:none;appearance:none;width:100%;height:14px;border-radius:999px;margin:0;padding:0;border:0;background:linear-gradient(90deg,#f00,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00);outline:none;cursor:pointer}
.sb-cp-hue::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#fff;border:0;box-shadow:0 0 0 1px rgba(0,0,0,.25),0 2px 4px rgba(0,0,0,.3)}
.sb-cp-hue::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#fff;border:0;box-shadow:0 0 0 1px rgba(0,0,0,.25),0 2px 4px rgba(0,0,0,.3)}
.sb-cp-hue:focus-visible{box-shadow:0 0 0 2px var(--accent)}
.sb-cp-row{display:flex;align-items:center;gap:8px}
.sb-cp-now{width:30px;height:30px;border-radius:50%;flex:none;box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)}
.sb-cp-hexl{flex:1;min-width:0;display:flex;align-items:center;gap:2px;height:32px;padding:0 8px;border:1px solid var(--line,rgba(0,0,0,.15));border-radius:8px;background:var(--soft,#F6F8FA);font:600 .9rem ui-monospace,monospace;color:var(--muted,#5A6474)}
.sb-cp-hexl:focus-within{border-color:var(--accent)}
.sb-cp-hex{border:0;background:none;outline:none;width:100%;min-width:0;font:inherit;color:var(--ink,#22262D);text-transform:lowercase;padding:0;height:auto;box-shadow:none}
.sb-cp-lbl{font:700 .72rem var(--display);text-transform:uppercase;letter-spacing:.05em;color:var(--muted,#7A8494);margin-bottom:-4px}
.sb-cp-sw{display:grid;grid-template-columns:repeat(8,1fr);gap:5px}
.sb-cp-s{aspect-ratio:1;width:100%;min-width:0;min-height:0;padding:0;border:0;border-radius:50%;background:var(--c);cursor:pointer;box-shadow:inset 0 0 0 1px rgba(0,0,0,.12)}
.sb-cp-s:hover,.sb-cp-s:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
`;
  document.head.appendChild(css);
})();

