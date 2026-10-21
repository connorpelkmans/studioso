// Public flashcard pages: the Study Flashcards panel (flip, previous and next, shuffle; arrow keys and space). The cards are read from
// the term list already on the page, so nothing is fetched. Without JavaScript the full list still shows and the button jumps to it.
(function () {
  "use strict";
  var panel = document.getElementById("study"), list = document.querySelectorAll(".pub-terms li[data-front]");
  var start = document.querySelector("[data-pub-study]");
  if (!panel || !list.length || !start) return;
  var cards = Array.prototype.map.call(list, function (li) { return {f: li.getAttribute("data-front") || "", b: li.getAttribute("data-back") || ""}; });
  var order = cards.map(function (c, i) { return i; }), i = 0, back = false;
  var card = panel.querySelector("[data-pub-card]"), pos = panel.querySelector("[data-pub-pos]");
  var prev = panel.querySelector("[data-pub-prev]"), next = panel.querySelector("[data-pub-next]"), shuf = panel.querySelector("[data-pub-shuffle]");
  function draw() {
    var c = cards[order[i]];
    card.className = "pub-card" + (back ? " is-back" : "");
    card.textContent = "";
    var s = document.createElement("small"); s.textContent = back ? "Definition" : "Term";
    var t = document.createElement("span"); t.textContent = back ? c.b : c.f;
    card.appendChild(s); card.appendChild(t);
    card.setAttribute("aria-label", (back ? "Definition: " : "Term: ") + (back ? c.b : c.f) + ". Card " + (i + 1) + " of " + cards.length + ". Press to flip.");
    pos.textContent = (i + 1) + " of " + cards.length;
    prev.disabled = i === 0; next.disabled = i >= cards.length - 1;
  }
  function go(d) { var j = Math.max(0, Math.min(cards.length - 1, i + d)); if (j !== i) { i = j; back = false; draw(); } }
  start.addEventListener("click", function (e) { e.preventDefault(); panel.hidden = false; draw(); card.focus(); panel.scrollIntoView({block: "center", behavior: "smooth"}); });
  card.addEventListener("click", function () { back = !back; draw(); });
  prev.addEventListener("click", function () { go(-1); });
  next.addEventListener("click", function () { go(1); });
  shuf.addEventListener("click", function () { for (var k = order.length - 1; k > 0; k--) { var r = Math.floor(Math.random() * (k + 1)), x = order[k]; order[k] = order[r]; order[r] = x; } i = 0; back = false; draw(); });
  panel.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { go(1); e.preventDefault(); }
    else if (e.key === "ArrowLeft") { go(-1); e.preventDefault(); }
  });
})();

// Search filters (school, size, sort): picking one runs the search right away
(function () {
  "use strict";
  var box = document.querySelector("[data-pub-filters]");
  if (!box) return;
  box.addEventListener("change", function (e) {
    var f = e.target && e.target.form; if (!f) return;
    // leave out empty filters so the address stays short
    Array.prototype.forEach.call(f.querySelectorAll("select"), function (s) { s.disabled = !s.value; });
    f.submit();
  });
})();
