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
  var FRAME_MS = 33, F = {s: 1, a: 1}, F_GENTLE = {s: 0.7, a: 0.7};

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

  var live = []; // {tile, box, W, eng, ctx, s, T, drawn, visible}
  function teardown(rec) { if (rec.box && rec.box.parentNode) rec.box.parentNode.removeChild(rec.box); rec.tile.classList.remove("live"); rec.eng = null; rec.ctx = []; }

  // The tile is a picture of the real app (a transparent interface picture made from the app itself) over the live scene, which sits exactly where it does in the app:
  // to the right of the sidebar, drawn at the scale the app uses for that window size.
  function build(rec) {
    if (!L || !rec.tile.isConnected) return;
    var tile = rec.tile, id = tile.getAttribute("data-scene"), dk = isDark(), geo = window.SB_TILE_GEO, g = geo && geo.themes[id] && geo.themes[id][dk ? "dark" : "light"];
    var W = Math.round(tile.getBoundingClientRect().width);
    if (!W || !g) return;
    var t = W / geo.w, H = Math.round(geo.h * t), sx = g.s[0] * t, sy = g.s[1] * t, sw = g.s[2] * t, sh = g.s[3] * t;
    var kApp = Math.max(0.8, Math.min(3, Math.min(g.s[2] / 1200, g.s[3] / 800))), bw = Math.round(g.s[2] / kApp), bh = Math.round(g.s[3] / kApp), desk = g.s[2] / g.s[3] >= 0.9, k = kApp * t;
    var A = null, v = null, eng = null;
    if (L.ENGINES[id] && !broken[id]) {
      try { A = {}; L.setAnim(A); v = L.buildSceneAt(id, dk, bw, bh, desk); L.setAnim(null); eng = L.ENGINES[id](A, v, dk); }
      catch (e) { L.setAnim(null); broken[id] = 1; v = null; eng = null; }
    }
    if (!v) { try { L.setAnim(null); v = L.buildSceneAt(id, dk, bw, bh, desk); } catch (e) { return; } }
    teardown(rec);
    var box = el("div", "scn"); box.setAttribute("aria-hidden", "true");
    // The scene reaches a little way under the sidebar, so no hairline of the tile's own color can show where the picture's edge is scaled.
    var pad = Math.max(3, 10 * t), art = el("div", "scn-art", box), inner = el("div", "scn-in", art);
    art.style.left = (sx - pad) + "px"; art.style.top = sy + "px"; art.style.width = (sw + pad) + "px"; art.style.height = sh + "px"; art.style.background = v.sky;
    inner.style.left = pad + "px"; inner.style.top = "0px"; inner.style.width = sw + "px"; inner.style.height = sh + "px";
    if (v.band && v.band.h) { var b = el("div", "scn-band", art); b.style.top = (v.band.top * k) + "px"; b.style.height = (v.band.h * k) + "px"; b.style.background = v.band.bg; }
    layer(v.far, true, v, k, inner); layer(v.refl, true, v, k, inner); layer(v.mid, true, v, k, inner);
    var cA = eng ? el("canvas", "scn-cv", inner) : null;
    layer(v.near, false, v, k, inner);
    var cS = eng && eng.stat ? el("canvas", "scn-cv", inner) : null;
    var cB = eng ? el("canvas", "scn-cv", inner) : null;
    var dpr = Math.min(1.5, eng && eng.maxDpr || 9, window.devicePixelRatio || 1), sc = k * dpr;
    [cA, cB].forEach(function (c) { if (c) { c.width = Math.round(sw * dpr); c.height = Math.round(sh * dpr); c.style.width = sw + "px"; c.style.height = sh + "px"; } });
    if (cS) { cS.width = eng.stat.width; cS.height = eng.stat.height; cS.style.width = sw + "px"; cS.style.height = sh + "px"; cS.getContext("2d").drawImage(eng.stat, 0, 0); eng.hosted = true; }
    var ui = el("img", "scn-ui-img", box); ui.alt = ""; ui.decoding = "async"; ui.src = "assets/screens/ui-" + id + "-" + (dk ? "dark" : "light") + ".webp";
    var comp = tile.getAttribute("data-comp"), host = null;
    if (comp) { host = el("div", "wcp-host", box); host.setAttribute("data-companion", comp); host.style.left = (g.c[0] / geo.w * 100) + "%"; host.style.top = (g.c[1] / geo.h * 100) + "%"; host.style.width = (g.c[2] / geo.w * 100) + "%"; }
    tile.insertBefore(box, tile.firstChild);
    if (host && window.SBWebComp) window.SBWebComp.mount(host);
    tile.classList.add("live");
    rec.box = box; rec.W = W; rec.eng = eng; rec.ctx = eng ? [cA.getContext("2d"), cB.getContext("2d")] : []; rec.s = sc; rec.T = 0; rec.drawn = false; rec.dk = dk;
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
