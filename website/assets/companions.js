// Animated study companions on the home page. It loads the app's own companion art and animation code (companions-data.js and
// companions-engine.js, copied from the app) the first time one comes near the screen, then draws it, blinks, plays its idle moves and has it say
// something every so often (only the one on the first screen talks; the others just move), like the companion in the app. No inline styles or scripts are used (strict Content-Security-Policy).
(function () {
  "use strict";
  var W = null, loading = false, waiting = [];
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

  function loadScript(src, cb) { var s = document.createElement("script"); s.src = src; s.onload = cb; s.onerror = function () { waiting = []; }; document.head.appendChild(s); }
  function ready(cb) {
    if (W) return cb();
    waiting.push(cb);
    if (loading) return;
    loading = true;
    loadScript("assets/companions-data.js", function () { loadScript("assets/companions-engine.js", function () { W = window.SBCOMPW; var q = waiting.splice(0); if (W) q.forEach(function (f) { f(); }); }); });
  }

  // What it says: short lines from its own set (the same lines the app's companion uses).
  function linesOf(c, max) {
    var out = [];
    ["tap", "hello", "morning", "focus", "break", "task"].forEach(function (k) { (c.lines[k] || []).forEach(function (t) { if (typeof t === "string" && t.length <= max) out.push(t); }); });
    return out.length ? out : (W.GENERIC.tap || []).filter(function (t) { return t.length <= max; });
  }

  function start(host) {
    var id = host.getAttribute("data-companion"), c = W.BYID[id];
    if (!c || host.__cp) return;
    var talks = host.hasAttribute("data-talk"), max = 80;
    // The drawing carries inline style attributes (each limb's pivot). The page's security policy does not allow those, so they are renamed before the
    // drawing is parsed and then set through the DOM.
    var geo = window.SB_TILE_GEO, hg = host.getAttribute("data-geo") === "hero" && geo && geo.hero && geo.hero.light;
    if (hg) { host.style.left = (hg.c[0] / hg.w * 100) + "%"; host.style.top = (hg.c[1] / hg.h * 100) + "%"; host.style.width = (hg.c[2] / hg.w * 100) + "%"; }
    var svg = W.rigSvg(c, {}).replace(/\sstyle="([^"]*)"/g, ' data-st="$1"');
    host.innerHTML = '<div class="cp cp-' + c.pose + '"><span class="cp-shadow"></span><div class="cp-move"><div class="cp-breathe">' + svg + "</div></div></div>";
    host.querySelectorAll("[data-st]").forEach(function (n) {
      String(n.getAttribute("data-st")).split(";").forEach(function (d) { var i = d.indexOf(":"); if (i > 0) n.style.setProperty(d.slice(0, i).trim(), d.slice(i + 1).trim()); });
      n.removeAttribute("data-st");
    });
    var root = host.firstChild, bubble = document.createElement("div");
    bubble.className = "wcp-bubble"; bubble.setAttribute("role", "status"); host.appendChild(bubble);
    var act = W.actor(c, root, {spawn: function () {}}), lines = linesOf(c, max), last = "";
    var inst = host.__cp = {host: host, timers: [], visible: false, alive: true};
    var after = function (ms, fn) { var t = setTimeout(function () { if (!inst.alive) return; if (!host.isConnected) { stop(inst); return; } if (!inst.visible || document.hidden) { after(1500, fn); return; } fn(); }, ms); inst.timers.push(t); };
    function say(t) {
      if (!talks) return;
      bubble.textContent = t; bubble.classList.add("on");
      act.mouth("open"); setTimeout(function () { act.mouth("smile"); }, 900);
      clearTimeout(inst.hide); inst.hide = setTimeout(function () { bubble.classList.remove("on"); act.mouth("neutral"); }, Math.min(6500, 2600 + t.length * 55));
    }
    function talk(tap) {
      var t, n = 0; do { t = pick(lines); n++; } while (t === last && n < 6); last = t;
      say(t); act.motion(tap || !talks ? c.cheer : pick(c.idle), false);
    }
    function loop() {
      after(rand(2600, 5200), function () { act.blink(); loop(); });
    }
    function moves() {
      after(rand(5000, 9500), function () { act.motion(pick(c.idle), false); if (Math.random() < 0.5) act.look(rand(-1, 1), rand(-0.6, 0.6)); moves(); });
    }
    function chat(first) {
      after(first ? rand(3500, 7000) : rand(15000, 26000), function () { talk(false); chat(false); });
    }
    act.eyes("open"); act.mouth("neutral");
    loop(); moves(); if (talks) chat(true);
    host.addEventListener("click", function () { if (!inst.visible) return; clearTimeout(inst.hide); if (talks) talk(true); else act.motion(c.cheer, false); });
    host.setAttribute("role", "img"); host.setAttribute("aria-label", c.name + ", a study companion");
  }
  function stop(inst) { inst.alive = false; inst.timers.forEach(clearTimeout); clearTimeout(inst.hide); inst.host.__cp = null; }

  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var h = en.target;
      if (en.isIntersecting && !h.__cp) ready(function () { start(h); if (h.__cp) h.__cp.visible = en.isIntersecting; });
      if (h.__cp) h.__cp.visible = en.isIntersecting;
    });
  }, {rootMargin: "100px 0px"}) : null;

  // Hosts are found on the page or handed over by the live theme tiles when they are drawn.
  function mount(host) { if (io && host && !host.__watched) { host.__watched = true; io.observe(host); } }
  window.SBWebComp = {mount: mount};
  document.querySelectorAll("[data-companion]").forEach(mount);
})();
