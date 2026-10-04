// Shared by every page: the light/dark switch and the filled-in support address. No data leaves the browser here.
(function () {
  "use strict";
  var KEY = "studyboard-site-theme";
  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode: it just won't be remembered */ } }
  var root = document.documentElement;
  var saved = read();
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);

  function isDark() {
    var t = root.getAttribute("data-theme");
    if (t) return t === "dark";
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }
  var btn = document.getElementById("theme-toggle");
  if (btn) {
    var sync = function () { btn.setAttribute("aria-pressed", String(isDark())); btn.setAttribute("aria-label", isDark() ? "Switch to light theme" : "Switch to dark theme"); };
    btn.addEventListener("click", function () { var next = isDark() ? "light" : "dark"; root.setAttribute("data-theme", next); write(next); sync(); });
    sync();
  }

  // Put the owner's support address (config.js) into every .support-email element, as plain text and a mailto link.
  var cfg = window.STUDYBOARD_SITE || {};
  var mail = typeof cfg.SUPPORT_EMAIL === "string" && /^[^\s@<>"]+@[^\s@<>"]+$/.test(cfg.SUPPORT_EMAIL) ? cfg.SUPPORT_EMAIL : "support@YOUR-DOMAIN";
  var els = document.querySelectorAll(".support-email");
  for (var i = 0; i < els.length; i++) {
    els[i].textContent = mail;
    if (els[i].tagName === "A" && !/YOUR-DOMAIN/.test(mail)) els[i].setAttribute("href", "mailto:" + mail);
    if (/YOUR-DOMAIN/.test(mail)) els[i].classList.add("placeholder");
  }
  var app = document.querySelectorAll("a.app-link");
  for (var j = 0; j < app.length; j++) {
    try { var u = new URL(cfg.APP_URL); if (u.protocol === "https:" && !/YOUR-APP/.test(u.hostname)) app[j].setAttribute("href", u.href); } catch (e) { /* keep the placeholder link */ }
  }
})();
