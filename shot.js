// The screenshot picker: the whole screen is shown still, you drag a box around what you want, and only that part goes to Studyboard.
// It can't do anything else: it hands back four numbers (the box, as fractions of the screen) or a cancel.
(() => {
  const pic = document.getElementById("pic"), sel = document.getElementById("sel");
  let ready = false, a = null, b = null;
  const box = () => {
    const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y), x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  };
  const paint = () => {
    if (!a || !b) { sel.hidden = true; return; }
    const r = box(); sel.hidden = false;
    sel.style.left = r.x + "px"; sel.style.top = r.y + "px"; sel.style.width = r.w + "px"; sel.style.height = r.h + "px";
  };
  const send = r => window.studyboardShot.done(r ? { x: r.x / innerWidth, y: r.y / innerHeight, w: r.w / innerWidth, h: r.h / innerHeight } : { x: 0, y: 0, w: 1, h: 1 });
  window.studyboardShot.onInit(url => { pic.src = url; ready = true; });
  addEventListener("mousedown", e => { if (!ready || e.button !== 0) return; a = { x: e.clientX, y: e.clientY }; b = a; paint(); });
  addEventListener("mousemove", e => { if (!a) return; b = { x: e.clientX, y: e.clientY }; paint(); });
  addEventListener("mouseup", e => {
    if (!a) return;
    b = { x: e.clientX, y: e.clientY }; const r = box(); a = b = null; paint();
    if (r.w >= 12 && r.h >= 12) send(r);          // a click or a tiny drag does nothing: draw a real box
  });
  addEventListener("dblclick", () => { if (ready) send(null); });
  addEventListener("keydown", e => {
    if (e.key === "Escape") { e.preventDefault(); window.studyboardShot.cancel(); }
    else if (e.key === "Enter" && ready) { e.preventDefault(); send(null); }
  });
  addEventListener("contextmenu", e => { e.preventDefault(); window.studyboardShot.cancel(); });
})();
