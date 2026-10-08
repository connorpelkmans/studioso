// Animated theme tiles on the home page. It loads the app's own scene library (scenes-lib.js, copied from the app) the first time a tile
// comes near the screen, then draws each tile's scene and plays its animation engine, just like the app does.
// No inline styles or scripts are used (strict Content-Security-Policy): everything is built with the DOM and set through element.style.
(function () {
  "use strict";
  var tiles = Array.prototype.slice.call(document.querySelectorAll(".tile[data-scene]"));
  if (!tiles.length || !("IntersectionObserver" in window)) return;
  var root = document.documentElement, SVGNS = "http://www.w3.org/2000/svg";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var L = null, loading = false, queue = [], broken = {};
  var DESIGN_W = 1200, DESIGN_H = 750, FRAME_MS = 33, F = {s: 1, a: 1}, F_GENTLE = {s: 0.7, a: 0.7};

  function isDark() {
    var t = root.getAttribute("data-theme");
    if (t === "dark") return true;
    if (t === "light") return false;
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }
  function load(cb) {
    if (L) return cb();
    queue.push(cb);
    if (loading) return;
    loading = true;
    var s = document.createElement("script");
    s.src = "assets/scenes-lib.js";
    s.onload = function () { try { L = window.SCN20 || (typeof SCN20 !== "undefined" ? SCN20 : null); } catch (e) { L = null; } var q = queue.splice(0); if (L) q.forEach(function (f) { f(); }); };
    s.onerror = function () { queue = []; };
    document.head.appendChild(s);
  }

  function el(tag, cls, parent) { var e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; }
  function layer(Ly, pad, v, k, parent) {
    var paths = [];
    "abcdefgh".split("").forEach(function (key) { if (Ly[key].d) paths.push({d: Ly[key].d, fill: Ly[key].c}); });
    ["s", "t"].forEach(function (key) { if (Ly[key].d) paths.push({d: Ly[key].d, stroke: Ly[key].c, w: Ly[key].w}); });
    if (!paths.length) return;
    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "scn-l"); svg.setAttribute("viewBox", pad ? v.vbPad : v.vb); svg.setAttribute("preserveAspectRatio", "none");
    paths.forEach(function (p) {
      var path = document.createElementNS(SVGNS, "path"); path.setAttribute("d", p.d);
      if (p.stroke) { path.setAttribute("fill", "none"); path.setAttribute("stroke", p.stroke); path.setAttribute("stroke-width", p.w); path.setAttribute("stroke-linecap", "round"); path.setAttribute("stroke-linejoin", "round"); }
      else path.setAttribute("fill", p.fill);
      svg.appendChild(path);
    });
    var st = svg.style;
    if (pad) { st.left = (-40 * k) + "px"; st.top = (-40 * k) + "px"; st.width = (v.pw * k) + "px"; st.height = (v.phh * k) + "px"; }
    else { st.left = "0px"; st.top = "0px"; st.width = (v.bw * k) + "px"; st.height = (v.bh * k) + "px"; }
    if (Ly.blur) st.filter = "blur(" + (Ly.blur * k).toFixed(2) + "px)";
    parent.appendChild(svg);
  }

  // A small stand-in for the Task Board in the theme's own colors, on top of the live scene.
  function board(parent, v) {
    var ui = el("div", "scn-ui", parent), c = v.c || {};
    var set = function (n, val) { if (val) ui.style.setProperty(n, val); };
    set("--s-spine", c.spine); set("--s-sf", c.sf); set("--s-ink", c.ink); set("--s-mu", c.mu); set("--s-ac", c.ac); set("--s-bt", c.bt); set("--s-bf", c.bf); set("--s-ln", c.ln);
    var sp = el("div", "scn-spine", ui); el("b", "", sp).textContent = "Studyboard"; ["Board", "Calendar", "Flashcards", "Notes"].forEach(function (t, i) { var a = el("span", i ? "" : "on", sp); a.textContent = t; });
    var main = el("div", "scn-main", ui);
    el("div", "scn-add", main).textContent = "Add a task by typing, e.g. bio quiz fri 2pm";
    var cols = el("div", "scn-cols", main);
    [["To Do", ["Read Ch. 7-8", "Problem Set 5"]], ["In Work", ["Lab Report 4", "Essay 2 outline"]], ["Complete", ["Quiz 3", "Care plan draft"]]].forEach(function (col, ci) {
      var d = el("div", "scn-col", cols); el("h5", "", d).textContent = col[0];
      col[1].forEach(function (t) { var cd = el("div", "scn-card" + (ci === 2 ? " done" : ""), d); el("i", "", cd); el("span", "", cd).textContent = t; });
    });
    el("div", "scn-fab", ui).textContent = "+ Add Task";
  }

  var live = []; // {tile, box, W, eng, ctx, s, T, drawn, visible}
  function teardown(rec) { if (rec.box && rec.box.parentNode) rec.box.parentNode.removeChild(rec.box); rec.tile.classList.remove("live"); rec.eng = null; rec.ctx = []; }

  function build(rec) {
    if (!L || !rec.tile.isConnected) return;
    var tile = rec.tile, id = tile.getAttribute("data-scene"), dk = isDark();
    var W = Math.round(tile.getBoundingClientRect().width), k, H;
    if (!W) return;
    k = W / DESIGN_W; H = Math.round(DESIGN_H * k);
    var A = null, v = null, eng = null;
    if (L.ENGINES[id] && !broken[id]) {
      try { A = {}; L.setAnim(A); v = L.buildSceneAt(id, dk, DESIGN_W, DESIGN_H, true); L.setAnim(null); eng = L.ENGINES[id](A, v, dk); }
      catch (e) { L.setAnim(null); broken[id] = 1; v = null; eng = null; }
    }
    if (!v) { try { L.setAnim(null); v = L.buildSceneAt(id, dk, DESIGN_W, DESIGN_H, true); } catch (e) { return; } }
    teardown(rec);
    var box = el("div", "scn"); box.setAttribute("aria-hidden", "true");
    box.style.background = v.sky;
    var art = el("div", "scn-art", box);
    if (v.band && v.band.h) { var b = el("div", "scn-band", art); b.style.top = (v.band.top * k) + "px"; b.style.height = (v.band.h * k) + "px"; b.style.background = v.band.bg; }
    layer(v.far, true, v, k, art); layer(v.refl, true, v, k, art); layer(v.mid, true, v, k, art);
    var cA = eng ? el("canvas", "scn-cv", art) : null;
    layer(v.near, false, v, k, art);
    var cS = eng && eng.stat ? el("canvas", "scn-cv", art) : null;
    var cB = eng ? el("canvas", "scn-cv", art) : null;
    var dpr = Math.min(1.5, eng && eng.maxDpr || 9, window.devicePixelRatio || 1), s = k * dpr;
    [cA, cB].forEach(function (c) { if (c) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); c.style.width = W + "px"; c.style.height = H + "px"; } });
    if (cS) { cS.width = eng.stat.width; cS.height = eng.stat.height; cS.style.width = W + "px"; cS.style.height = H + "px"; cS.getContext("2d").drawImage(eng.stat, 0, 0); eng.hosted = true; }
    board(box, v);
    tile.insertBefore(box, tile.firstChild);
    tile.classList.add("live");
    rec.box = box; rec.W = W; rec.eng = eng; rec.ctx = eng ? [cA.getContext("2d"), cB.getContext("2d")] : []; rec.s = s; rec.T = 0; rec.drawn = false; rec.dk = dk;
    if (eng) frame(rec, 1 / 30);
  }

  function frame(rec, dt) {
    var eng = rec.eng; if (!eng) return;
    try {
      rec.T += dt;
      var f = reduce && reduce.matches ? F_GENTLE : F;
      eng.step(dt, rec.T, f);
      if (rec.drawn && eng.idle && eng.idle(rec.T)) return;
      var uses = typeof eng.uses === "string" ? eng.uses : "ab";
      rec.ctx.forEach(function (x, i) {
        if (uses.indexOf(i ? "b" : "a") < 0) return;
        x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, x.canvas.width, x.canvas.height); x.setTransform(rec.s, 0, 0, rec.s, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
      });
      eng.draw(rec.ctx[0], rec.ctx[1], rec.T, f); rec.drawn = true;
    } catch (e) { broken[rec.tile.getAttribute("data-scene")] = 1; rec.eng = null; }
  }

  // One loop for all tiles on screen.
  var raf = 0, last = 0;
  function tick(ts) {
    raf = 0;
    if (document.hidden) return;
    var any = live.some(function (r) { return r.visible && r.eng; });
    if (!any) { last = 0; return; }
    if (!last || ts - last >= FRAME_MS) {
      var dt = last ? Math.min(0.1, (ts - last) / 1000) : 1 / 30; last = ts;
      live.forEach(function (r) { if (r.visible && r.eng) frame(r, dt); });
    }
    raf = requestAnimationFrame(tick);
  }
  function run() { if (raf || document.hidden || (reduce && reduce.matches)) return; last = 0; raf = requestAnimationFrame(tick); }
  document.addEventListener("visibilitychange", run);
  if (reduce && reduce.addEventListener) reduce.addEventListener("change", function () { if (reduce.matches) { cancelAnimationFrame(raf); raf = 0; } else run(); });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var rec = en.target.__scn; if (!rec) return;
      rec.visible = en.isIntersecting;
      if (en.isIntersecting && !rec.box) load(function () { build(rec); run(); });
      else if (en.isIntersecting) run();
    });
  }, {rootMargin: "200px 0px"});
  tiles.forEach(function (t) { var rec = {tile: t, visible: false}; t.__scn = rec; live.push(rec); io.observe(t); });

  // Light/dark switch and window size: redraw the scenes that are on screen.
  var redrawT = 0;
  function redraw(force) {
    clearTimeout(redrawT);
    redrawT = setTimeout(function () {
      live.forEach(function (r) {
        if (!r.box || !L) return;
        var w = Math.round(r.tile.getBoundingClientRect().width);
        if (force || isDark() !== r.dk || Math.abs(w - r.W) > 8) build(r);
      });
      run();
    }, 120);
  }
  new MutationObserver(function () { redraw(false); }).observe(root, {attributes: true, attributeFilter: ["data-theme"]});
  if (window.matchMedia) { var mq = window.matchMedia("(prefers-color-scheme: dark)"); if (mq.addEventListener) mq.addEventListener("change", function () { redraw(false); }); }
  window.addEventListener("resize", function () { redraw(false); });
})();
