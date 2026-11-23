// Small animation kit shared by the Set 4 reels (loaded with <script src="{{ROOT}}/marketing/reels/_shared/kit.js">)
const $ = id => document.getElementById(id);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const P = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const oCubic = x => 1 - Math.pow(1 - x, 3);
const io = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const oBack = (x, c = 1.6) => { const d = c + 1; return 1 + d * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
// an element pops in at t0 (scale from `from`, overshoot), fully formed if t0 <= 0
const popIn = (el, t, t0, from = .5, d = .3) => { if (t0 <= 0) { el.style.opacity = 1; el.style.transform = ""; return; }
  const k = P(t, t0, t0 + d); el.style.opacity = k > 0 ? clamp(k * 4) : 0; el.style.transform = `scale(${lerp(from, 1, oBack(k))})`; };
// a single smooth nudge (no fast shakes: they flicker at 30 fps)
const nudge = (t, t0, amp = 14) => { const k = P(t, t0, t0 + .32); return k > 0 && k < 1 ? Math.sin(k * Math.PI) * (1 - k) * amp : 0; };
["400","600","700","800","900"].forEach(w => document.fonts.load(w + " 60px Inter"));
// Companion SVG styling (inject once): call compCSS() in a page that uses {{owl}} {{mochi}} {{inky}} {{packy}}
const compCSS = () => { const s = document.createElement("style"); s.textContent = `
.comp svg{width:100%;height:100%;overflow:visible;display:block;filter:drop-shadow(0 12px 22px rgba(0,0,0,.3))}
.cp-svg .cp-p,.cp-svg .cp-headg,.cp-svg .cp-eye,.cp-svg .cp-page{transform-box:view-box}
.cp-svg .cp-cheeks{opacity:.62}
.cp-svg .cp-e-happy,.cp-svg .cp-e-sleepy,.cp-svg .cp-mouth>g,.cp-svg .cp-prop,.cp-svg .cp-zs{display:none}
.cp-svg[data-m=neutral] .cp-m-neutral,.cp-svg[data-m=smile] .cp-m-smile,.cp-svg[data-m=open] .cp-m-open,.cp-svg[data-m=sleepy] .cp-m-sleepy{display:inline}
.cp-svg[data-e=happy] .cp-eye,.cp-svg[data-e=sleepy] .cp-eye{display:none}
.cp-svg[data-e=happy] .cp-e-happy,.cp-svg[data-e=sleepy] .cp-e-sleepy{display:inline}`; document.head.appendChild(s); };
// set a companion's face: eyes "open" | "happy" | "sleepy", mouth "neutral" | "smile" | "open" | "sleepy"
const face = (el, e, m) => { const s = el.querySelector("svg"); if (s) { s.dataset.e = e; s.dataset.m = m; } };
