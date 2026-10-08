// Studyboard home page: works out the visitor's device and fills in the download buttons from DOWNLOADS in config.js.
// Nothing is sent anywhere. No inline scripts or styles are used (strict Content-Security-Policy).
(function () {
  "use strict";
  var cfg = window.STUDYBOARD_SITE || {}, D = cfg.DOWNLOADS || {}, VER = typeof cfg.VERSION === "string" ? cfg.VERSION : "";

  var ICONS = {
    windows: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    mac: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4.5" width="16" height="11" rx="1.8"/><path d="M2 19h20l-1.5-3.5h-17z"/></svg>',
    linux: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 9l3 3-3 3M12.5 15H17"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg>',
    store: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h16l-1.3 12H5.3z"/><path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5v17l14-8.5z"/></svg>',
    web: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/></svg>'
  };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]; }); };
  var httpsUrl = function (u) { try { var x = new URL(u); return x.protocol === "https:" && !x.username && !x.password ? x.href : ""; } catch (e) { return ""; } };
  var WEB = httpsUrl(cfg.APP_URL || "");
  var fileName = function (d) { return d && d.file ? String(d.file).replace("{version}", VER) : ""; };

  // ---- Which device is this? ----
  function detectMacChip(uaData) {
    return Promise.resolve().then(function () {
      if (uaData && uaData.getHighEntropyValues) return uaData.getHighEntropyValues(["architecture"]).then(function (v) { return v.architecture === "arm" ? "arm" : v.architecture === "x86" ? "intel" : ""; }, function () { return ""; });
      return "";
    }).then(function (c) {
      if (c) return c;
      try {
        var gl = document.createElement("canvas").getContext("webgl"), ext = gl && gl.getExtension("WEBGL_debug_renderer_info");
        var r = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
        if (/Apple M\d/i.test(r)) return "arm";
        if (/Intel|AMD|Radeon|NVIDIA/i.test(r)) return "intel";
      } catch (e) { /* fall through */ }
      return "unknown";
    });
  }
  function detectPlatform() {
    var ua = navigator.userAgent || "", touch = navigator.maxTouchPoints || 0;
    if (/iPhone|iPad|iPod/i.test(ua)) return Promise.resolve({os: "ios"});
    if (/Macintosh/i.test(ua) && touch > 1) return Promise.resolve({os: "ios"});   // iPadOS says it is a Mac
    if (/Android/i.test(ua)) return Promise.resolve({os: "android"});
    if (/Windows/i.test(ua)) return Promise.resolve({os: "windows"});
    if (/Macintosh|Mac OS X/i.test(ua)) return detectMacChip(navigator.userAgentData).then(function (chip) { return {os: "mac", chip: chip}; });
    if (/CrOS/i.test(ua)) return Promise.resolve({os: "chromeos"});
    if (/Linux/i.test(ua)) return Promise.resolve({os: "linux"});
    return Promise.resolve({os: "other"});
  }
  var PREVIEWS = {ios: {os: "ios"}, android: {os: "android"}, windows: {os: "windows"}, linux: {os: "linux"}, "mac-arm": {os: "mac", chip: "arm"}, "mac-intel": {os: "mac", chip: "intel"}, "mac-unknown": {os: "mac", chip: "unknown"}};

  // ---- What happens when a download button is pressed ----
  var toastTimer;
  function toast(msg) {
    var t = document.getElementById("toast"); if (!t) return;
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2800);
  }
  var ready = function (k) { return !!(D[k] && httpsUrl(D[k].url)); };
  var hrefFor = function (k) { return ready(k) ? httpsUrl(D[k].url) : "#download"; };
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-download]") : null; if (!b) return;
    var k = b.getAttribute("data-download"), d = D[k]; if (!d) return;
    if (!ready(k)) { e.preventDefault(); toast((k === "ios" ? "Studyboard on the App Store" : k === "android" ? "Studyboard on Google Play" : "Studyboard for " + d.label) + " is coming soon. You can use it in your browser now."); }
  });

  // ---- Buttons ----
  function bigButton(k, icon, small, big, primary) { return '<a class="dl' + (primary ? " primary" : "") + '" data-download="' + k + '" href="' + esc(hrefFor(k)) + '">' + icon + '<span class="t"><small>' + esc(small) + '</small><b>' + esc(big) + "</b></span></a>"; }
  function storeButton(k, primary) {
    var apple = k === "ios";
    return '<a class="dl store' + (primary ? " primary" : "") + '" data-download="' + k + '" href="' + esc(hrefFor(k)) + '">' + (apple ? ICONS.store : ICONS.play) + '<span class="t"><small>' + (ready(k) ? (apple ? "Download on the" : "Get it on") : (apple ? "Coming soon on the" : "Coming soon on")) + "</small><b>" + (apple ? "App Store" : "Google Play") + "</b></span></a>";
  }
  function webButton(primary) { return WEB ? '<a class="dl' + (primary ? " primary" : "") + '" href="' + esc(WEB) + '">' + ICONS.web + '<span class="t"><small>Free · works in any browser, nothing to install</small><b>Open Studyboard</b></span></a>' : ""; }
  function chip(k, icon, text) { return '<a class="chip" data-download="' + k + '" href="' + esc(hrefFor(k)) + '">' + icon + esc(text) + (ready(k) ? "" : " · soon") + "</a>"; }
  var macHelp = '<details class="which"><summary>Which Mac do I have?</summary><p>Click the Apple menu in the top-left corner and choose <b>About This Mac</b>. If it says <b>Chip: Apple M1</b> (or M2, M3, M4 and so on), pick Apple M-series. If it says <b>Processor: Intel</b>, pick Intel.</p></details>';
  var seeAll = '<a href="#download">See all downloads</a>';
  var NAMES = {windows: ["windows", "Windows", "Windows 10 & 11"], macArm: ["mac", "Mac", "Apple M-series"], macIntel: ["mac", "Mac", "Intel Macs"], linux: ["linux", "Linux", "AppImage"]};

  function desktopRow(k, p) {
    var n = NAMES[k], free = "Free · v" + VER + " · " + (D[k] && D[k].needs ? D[k].needs : n[2]);
    if (ready(k)) return webButton(true) + bigButton(k, ICONS[n[0]], free, "Download for " + n[1], false);
    return webButton(true) + bigButton(k, ICONS[n[0]], "Coming soon · " + n[2], n[1], false);
  }

  function renderHero(p) {
    var el = document.getElementById("heroDownloads"); if (!el) return;
    var html = "";
    if (p.os === "ios" || p.os === "android") {
      var first = p.os, second = p.os === "ios" ? "android" : "ios";
      html = '<div class="dlrow">' + webButton(true) + (ready(first) ? storeButton(first, false) + storeButton(second, false) : storeButton(first, false)) + '</div><p class="dlmeta">Free · syncs with your computer. ' + seeAll + "</p>";
    } else if (p.os === "windows") {
      html = '<div class="dlrow">' + desktopRow("windows") + '</div><div class="others"><span>Also on</span>' + chip("macArm", ICONS.mac, "Mac M-series") + chip("macIntel", ICONS.mac, "Mac Intel") + chip("ios", ICONS.phone, "iPhone") + chip("android", ICONS.phone, "Android") + "</div>";
    } else if (p.os === "linux") {
      html = '<div class="dlrow">' + desktopRow("linux") + '</div><div class="others"><span>Also on</span>' + chip("windows", ICONS.windows, "Windows") + chip("macArm", ICONS.mac, "Mac") + chip("ios", ICONS.phone, "iPhone") + chip("android", ICONS.phone, "Android") + "</div>";
    } else if (p.os === "mac") {
      if (p.chip === "arm" || p.chip === "intel") {
        var k = p.chip === "arm" ? "macArm" : "macIntel", other = p.chip === "arm" ? "macIntel" : "macArm";
        html = '<div class="dlrow">' + desktopRow(k) + '</div><div class="others"><span>Also on</span>' + chip(other, ICONS.mac, p.chip === "arm" ? "Mac Intel" : "Mac M-series") + chip("windows", ICONS.windows, "Windows") + chip("ios", ICONS.phone, "iPhone") + chip("android", ICONS.phone, "Android") + "</div>";
      } else {
        html = '<div class="dlrow">' + webButton(true) + (ready("macArm") ? bigButton("macArm", ICONS.mac, "Free · v" + VER + " · Apple M-series", "Download for Mac", false) : bigButton("macArm", ICONS.mac, "Coming soon · Apple M-series", "Mac", false)) + bigButton("macIntel", ICONS.mac, ready("macIntel") ? "Older Macs" : "Coming soon · older Macs", "Mac with Intel", false) + "</div>" + macHelp +
          '<div class="others"><span>Also on</span>' + chip("windows", ICONS.windows, "Windows") + chip("ios", ICONS.phone, "iPhone") + chip("android", ICONS.phone, "Android") + "</div>";
      }
    } else {
      html = '<div class="dlrow">' + webButton(true) + "</div>" + '<div class="others"><span>Also on</span>' + chip("windows", ICONS.windows, "Windows") + chip("macArm", ICONS.mac, "Mac") + chip("linux", ICONS.linux, "Linux") + chip("ios", ICONS.phone, "iPhone") + chip("android", ICONS.phone, "Android") + "</div>";
    }
    el.innerHTML = html;
  }

  function renderAll(p) {
    var el = document.getElementById("allDownloads"); if (!el) return;
    var mine = p.os === "windows" ? "windows" : p.os === "mac" ? (p.chip === "intel" ? "macIntel" : p.chip === "arm" ? "macArm" : "") : p.os === "ios" ? "ios" : p.os === "android" ? "android" : p.os === "linux" ? "linux" : "";
    function card(k, icon, title, action) {
      var d = D[k] || {}, f = fileName(d);
      return '<div class="plat' + (mine === k ? " you" : "") + '">' + (mine === k ? '<span class="you-tag">Your device</span>' : "") + '<div class="ico">' + icon + "</div><h4>" + title + (ready(k) ? "" : '<span class="soon">Soon</span>') + "</h4><div><p>" + esc(d.needs || "") + "</p>" + (f ? '<p class="file">' + esc(f) + "</p>" : "") + '</div><a class="go" data-download="' + k + '" href="' + esc(hrefFor(k)) + '">' + ICONS.down + action + "</a></div>";
    }
    var webCard = WEB ? '<div class="group"><h3>In your browser</h3><div class="plats"><div class="plat web"><div class="ico">' + ICONS.web + '</div><h4>Studyboard on the Web<span class="live">Available Now</span></h4><div><p>Works in Chrome, Edge, Safari and Firefox on any computer or phone. Use the browser\'s install option (or Add to Home Screen) to open it like an app.</p></div><a class="go" href="' + esc(WEB) + '">' + ICONS.web + "Open Studyboard</a></div></div></div>" : "";
    el.innerHTML = webCard +
      '<div class="group"><h3>Computer</h3><div class="plats">' + card("windows", ICONS.windows, "Windows", "Download .exe") + card("macArm", ICONS.mac, "Mac · Apple M-series", "Download .dmg") + card("macIntel", ICONS.mac, "Mac · Intel", "Download .dmg") + card("linux", ICONS.linux, "Linux", "Download AppImage") + "</div>" + macHelp.replace('class="which"', 'class="which mt12"') + "</div>" +
      '<div class="group"><h3>Phone &amp; tablet</h3><div class="plats">' + card("ios", ICONS.phone, "iPhone &amp; iPad", "App Store") + card("android", ICONS.phone, "Android", "Google Play") + "</div></div>";
  }

  // ---- Gallery of real screens: tabs ----
  (function () {
    var tabs = Array.prototype.slice.call(document.querySelectorAll(".gtabs [role=tab]")); if (!tabs.length) return;
    function pick(t, focus) {
      tabs.forEach(function (x) { var on = x === t; x.setAttribute("aria-selected", String(on)); x.tabIndex = on ? 0 : -1; var p = document.getElementById(x.getAttribute("aria-controls")); if (p) p.hidden = !on; });
      if (focus) t.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { pick(t, false); });
      t.addEventListener("keydown", function (e) {
        var j = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
        if (j < 0) return; e.preventDefault(); pick(tabs[(j + tabs.length) % tabs.length], true);
      });
    });
  })();

  var forced = null; try { forced = PREVIEWS[new URLSearchParams(location.search).get("os")] || null; } catch (e) { /* ignore */ }
  detectPlatform().then(function (d) { var p = forced || d; renderHero(p); renderAll(p); });
})();
