// "What's Inside" on the home page: each feature card shows a still of the feature (the finished moment) and plays a short loop of it
// working while the pointer is over it (or it has keyboard focus). On a touch screen, a tap plays it; scrolling it away stops it.
// A card's data-ms lists how long each step is held. Step n adds the class sN to its stage (assets/features.css says what each step looks like),
// [data-type] text is typed out on step 1, and after the last step the stage fades and starts over.
// With "reduce motion", or without JavaScript, the still is all there is.
(function () {
  "use strict";
  var cards = [].slice.call(document.querySelectorAll(".fx[data-fx]"));
  if (!cards.length) return;
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  function loop(card) {
    var st = card.querySelector(".fx-stage");
    var ms = String(card.getAttribute("data-ms") || "1000,1000,1000,1600").split(",").map(Number);
    var n = ms.length, step = n - 1, timer = 0, on = false, typing = 0;
    var typers = [].slice.call(st.querySelectorAll("[data-type]"));

    function set(i) {
      step = i;
      for (var k = 1; k < n; k++) st.classList.toggle("s" + k, k <= i);
      if (i === 1) typers.forEach(type);
    }
    function type(el) {
      var text = el.getAttribute("data-type"), j = 0, per = Math.max(40, (ms[1] * 0.7) / text.length);
      clearTimeout(typing); el.textContent = "";
      (function next() {
        if (!on) return;
        el.textContent = text.slice(0, ++j);
        if (j < text.length) typing = setTimeout(next, per);
      })();
    }
    // jump to a step at once (no transitions), after a short fade
    function jump(i, then) {
      clearTimeout(timer); clearTimeout(typing);
      st.classList.add("fx-out");
      timer = setTimeout(function () {
        st.classList.add("fx-snap");
        typers.forEach(function (el) { el.textContent = i ? el.getAttribute("data-type") : ""; });
        set(i);
        void st.offsetWidth;
        st.classList.remove("fx-snap", "fx-out");
        if (then) then();
      }, 220);
    }
    function tick() {
      if (!on) return;
      if (step >= n - 1) { jump(0, function () { timer = setTimeout(tick, ms[0]); }); return; }
      set(step + 1);
      timer = setTimeout(tick, ms[step]);
    }
    st.classList.add("paused");
    return {
      on: function () { return on; },
      start: function () { if (on) return; on = true; card.classList.add("fx-playing"); st.classList.remove("paused"); jump(0, function () { timer = setTimeout(tick, ms[0]); }); },
      stop: function () { if (!on) return; on = false; card.classList.remove("fx-playing"); st.classList.add("paused"); jump(n - 1); }   // back to the still
    };
  }

  // The little round faces (study room, study group): each is a companion's face, cropped from its drawing the way the app makes them.
  // The art comes with assets/companions.js (loaded when a companion nears the screen); the letters show until it is here.
  function heads() {
    var W = window.SBCOMPW; if (!W) return false;
    [].slice.call(document.querySelectorAll(".fx [data-head]")).forEach(function (el) {
      var c = W.BYID[el.getAttribute("data-head")]; if (!c) return;
      var ey = c.eyes && typeof c.eyes.y === "number" ? c.eyes.y : 60, y = Math.max(0, Math.min(30, ey - 50));
      var svg = W.rigSvg(c, {eyes: "happy", mouth: "smile"}).replace(/<g class="cp-zs">[\s\S]*?<\/g>/, "")
        .replace(/\sstyle="[^"]*"/g, "").replace('viewBox="0 0 120 120"', 'viewBox="15 ' + y.toFixed(1) + ' 90 90"');
      el.innerHTML = svg; el.classList.add("fx-face"); el.setAttribute("aria-hidden", "true");
    });
    return true;
  }
  if (!heads()) {
    var tries = 0, wait = setInterval(function () { if (heads() || ++tries > 120) clearInterval(wait); }, 500);
    // nothing brings the art in until a companion is near the screen: ask for it when the cards with faces are
    setTimeout(function () { if (!("IntersectionObserver" in window) || !window.SBWebComp) return;   // (companions.js loads after this file)
      var probe = document.querySelector('.fx [data-companion]');
      new IntersectionObserver(function (es, o) { if (es.some(function (x) { return x.isIntersecting; })) { o.disconnect(); if (probe) window.SBWebComp.mount(probe); } }, {rootMargin: "300px 0px"})
        .observe(document.querySelector('.fx[data-fx="focus"]') || document.body);
    }, 0);
  }

  var touch = window.matchMedia && matchMedia("(hover: none)").matches;
  cards.forEach(function (card) {
    var l = loop(card);
    card.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse" || e.pointerType === "pen") l.start(); });
    card.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse" || e.pointerType === "pen") l.stop(); });
    card.addEventListener("focusin", function () { l.start(); });
    card.addEventListener("focusout", function (e) { if (!card.contains(e.relatedTarget)) l.stop(); });
    if (touch) {
      card.addEventListener("click", function (e) {
        if (e.target.closest && e.target.closest("a")) return;   // the deck library link
        if (l.on()) l.stop(); else { cards.forEach(function (c) { if (c !== card) c.dispatchEvent(new CustomEvent("fx-stop")); }); l.start(); }
      });
      card.addEventListener("fx-stop", function () { l.stop(); });
      if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { es.forEach(function (x) { if (!x.isIntersecting) l.stop(); }); }, {threshold: 0}).observe(card);
    }
  });
  document.addEventListener("visibilitychange", function () { if (document.hidden) cards.forEach(function (c) { c.dispatchEvent(new CustomEvent("fx-stop")); }); });
})();
