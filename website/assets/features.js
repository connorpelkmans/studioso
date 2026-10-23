// "What's Inside" on the home page: each feature card plays a short loop of the feature working.
// A card's data-ms lists how long each step is held. Step n adds the class sN to its stage (assets/features.css says what each step looks like),
// [data-type] text is typed out on step 1, and after the last step the stage fades and starts over.
// Loops only run while the card is on screen. With "reduce motion" (or no IntersectionObserver), nothing moves:
// the stage keeps the classes it has in the page, a still picture of the finished moment.
(function () {
  "use strict";
  var cards = [].slice.call(document.querySelectorAll(".fx[data-fx]"));
  if (!cards.length || !("IntersectionObserver" in window)) return;
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  function loop(card) {
    var st = card.querySelector(".fx-stage");
    var ms = String(card.getAttribute("data-ms") || "1000,1000,1000,1600").split(",").map(Number);
    var n = ms.length, step = 0, timer = 0, on = false, typing = 0;
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
        if (!on) { el.textContent = text; return; }
        el.textContent = text.slice(0, ++j);
        if (j < text.length) typing = setTimeout(next, per);
      })();
    }
    function snap() {
      st.classList.add("fx-snap");
      clearTimeout(typing);
      typers.forEach(function (el) { el.textContent = ""; });
      set(0);
      void st.offsetWidth;   // apply the first step at once, without transitions
      st.classList.remove("fx-snap");
    }
    function tick() {
      if (!on) return;
      if (step >= n - 1) {
        st.classList.add("fx-out");
        timer = setTimeout(function () { snap(); st.classList.remove("fx-out"); timer = setTimeout(tick, ms[0]); }, 380);
        return;
      }
      set(step + 1);
      timer = setTimeout(tick, ms[step]);
    }
    snap();
    st.classList.add("paused");
    return {
      start: function () { if (on) return; on = true; st.classList.remove("paused"); timer = setTimeout(tick, ms[step]); },
      stop: function () { on = false; clearTimeout(timer); clearTimeout(typing); st.classList.add("paused"); }
    };
  }

  var loops = new Map();
  cards.forEach(function (c) { loops.set(c, loop(c)); });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { var l = loops.get(e.target); if (e.isIntersecting && !document.hidden) l.start(); else l.stop(); });
  }, {threshold: 0.35});
  cards.forEach(function (c) { io.observe(c); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) loops.forEach(function (l) { l.stop(); });
    else cards.forEach(function (c) { io.unobserve(c); io.observe(c); });   // observe again: running cards report back and restart
  });
})();
