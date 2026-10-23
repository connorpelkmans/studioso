// Shared by every page
(function () {
  "use strict";
  var KEY = "studyboard-site-theme";
  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) { } }
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

  // Phone menu for the top bar's links
  var menu = document.getElementById("menu-toggle"), top = document.querySelector("header.top");
  if (menu && top) {
    var setOpen = function (on) { top.classList.toggle("menu-open", on); menu.setAttribute("aria-expanded", String(on)); menu.setAttribute("aria-label", on ? "Close menu" : "Menu"); };
    menu.addEventListener("click", function () { setOpen(!top.classList.contains("menu-open")); });
    top.addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".navlinks a")) setOpen(false); });
    document.addEventListener("click", function (e) { if (!top.contains(e.target)) setOpen(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && top.classList.contains("menu-open")) { setOpen(false); menu.focus(); } });
  }

  // Put the owner's support address (config.js) into every .support-email element
  var cfg = window.STUDYBOARD_SITE || {};
  var mail = typeof cfg.SUPPORT_EMAIL === "string" && /^[^\s@<>"]+@[^\s@<>"]+$/.test(cfg.SUPPORT_EMAIL) ? cfg.SUPPORT_EMAIL : "support@studyboardapp.com";
  var els = document.querySelectorAll(".support-email");
  for (var i = 0; i < els.length; i++) {
    els[i].textContent = mail;
    if (els[i].tagName === "A") els[i].setAttribute("href", "mailto:" + mail);
  }
  // The year and the app version in the footer and the hero
  var yr = document.querySelectorAll("[data-year]");
  for (var y = 0; y < yr.length; y++) yr[y].textContent = String(new Date().getFullYear());
  var vers = document.querySelectorAll("[data-version]");
  for (var z = 0; z < vers.length; z++) if (typeof cfg.VERSION === "string" && /^[0-9][0-9A-Za-z.\-]*$/.test(cfg.VERSION)) vers[z].textContent = cfg.VERSION;
  var app = document.querySelectorAll("a.app-link");
  for (var j = 0; j < app.length; j++) {
    try { var u = new URL(cfg.APP_URL); if (u.protocol === "https:" && !/YOUR-APP/.test(u.hostname)) app[j].setAttribute("href", u.href); } catch (e) { }
  }
})();
