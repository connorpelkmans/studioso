/* Launch Stats: the daily totals from supabase-launch.sql (studyboard_launch_stats), for the emails in studyboard_config
   'stats_viewers'. Uses the website's sign-in (the Account page), so signing in there is enough. */
(function () {
  "use strict";
  var cfg = window.STUDYBOARD_SITE || {}, $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]; }); };
  var fmt = function (n) { return Number(n || 0).toLocaleString(); };
  var pct = function (a, b) { return b ? Math.round(100 * a / b) + "%" : "–"; };
  var dayName = function (d, long) { var x = new Date(d + "T12:00:00Z"); return x.toLocaleDateString(undefined, long ? {weekday: "short", month: "short", day: "numeric", timeZone: "UTC"} : {month: "short", day: "numeric", timeZone: "UTC"}); };
  function msg(html) { $("st-msg").hidden = false; $("st-msg").innerHTML = html; $("st-body").hidden = true; }

  if (!window.supabase || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) { msg("This website isn't connected to the database yet (config.js)."); return; }
  var sb = window.supabase.createClient(String(cfg.SUPABASE_URL).replace(/\/+$/, ""), cfg.SUPABASE_ANON_KEY,
    {auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "studyboard-site-auth"}});

  var data = null;
  function load() {
    var days = Number($("st-days").value) || 30;
    sb.auth.getSession().then(function (r) {
      var s = r && r.data && r.data.session;
      if (!s) { msg('<p><b>Sign in first.</b> Use the <a href="../account/">Account page</a> with the email that\'s on the stats list, then come back here.</p>'); return; }
      return sb.rpc("studyboard_launch_stats", {p_days: days}).then(function (res) {
        if (res.error) {
          msg(/not allowed|42501/.test(res.error.message + " " + res.error.code)
            ? "<p><b>" + esc(s.user.email) + " isn't on the stats list.</b> Add it in the Supabase SQL editor (see LAUNCH-STATS.md):</p><pre>insert into public.studyboard_config (key, value) values ('stats_viewers', '[\"" + esc(s.user.email) + "\"]')\n  on conflict (key) do update set value = excluded.value, updated_at = now();</pre>"
            : /does not exist|PGRST202/.test(res.error.message + " " + res.error.code) ? "<p>Run <code>supabase-launch.sql</code> in the Supabase SQL editor first.</p>" : "<p>Couldn't load the stats: " + esc(res.error.message) + "</p>");
          return;
        }
        data = res.data; draw(days);
      });
    }).catch(function (e) { msg("<p>Couldn't load the stats: " + esc(e && e.message) + "</p>"); });
  }

  function tile(label, value, sub) { return '<div class="st-tile"><span class="st-l">' + esc(label) + '</span><b class="st-v">' + value + "</b>" + (sub ? '<span class="st-s">' + sub + "</span>" : "") + "</div>"; }
  // a bar chart of one measure (one series, one colour), with the value of the bar under the pointer
  function chart(title, key, rows, note) {
    var W = 640, H = 180, P = {l: 34, r: 6, t: 10, b: 24}, n = rows.length, max = 1;
    rows.forEach(function (r) { max = Math.max(max, Number(r[key]) || 0); });
    var step = Math.pow(10, Math.floor(Math.log10(max))), top = Math.ceil(max / step) * step; if (top / step > 5 && step >= 1) step = step * 2; top = Math.ceil(max / step) * step || 1;
    var bw = (W - P.l - P.r) / Math.max(n, 1), gap = Math.min(2, bw * 0.2), y = function (v) { return P.t + (H - P.t - P.b) * (1 - v / top); };
    var grid = "", bars = "", ticks = "";
    for (var g = 0; g <= top; g += step) grid += '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + y(g) + '" y2="' + y(g) + '" class="st-grid"/><text x="' + (P.l - 6) + '" y="' + (y(g) + 4) + '" class="st-ax" text-anchor="end">' + fmt(g) + "</text>";
    rows.forEach(function (r, i) {
      var v = Number(r[key]) || 0, x = P.l + i * bw + gap / 2, h = Math.max(0, y(0) - y(v)), w = Math.max(1, bw - gap), rad = Math.min(4, w / 2, h);
      var path = h > 0 ? "M" + x + "," + y(0) + "V" + (y(v) + rad) + "Q" + x + "," + y(v) + " " + (x + rad) + "," + y(v) + "H" + (x + w - rad) + "Q" + (x + w) + "," + y(v) + " " + (x + w) + "," + (y(v) + rad) + "V" + y(0) + "Z" : "";
      bars += '<g class="st-bar" data-i="' + i + '"><rect x="' + (P.l + i * bw) + '" y="' + P.t + '" width="' + bw + '" height="' + (H - P.t - P.b) + '" class="st-hit"/>' + (path ? '<path d="' + path + '"/>' : "") + "</g>";
      if (n <= 16 || i % Math.ceil(n / 8) === 0) ticks += '<text x="' + (P.l + i * bw + bw / 2) + '" y="' + (H - 6) + '" class="st-ax" text-anchor="middle">' + esc(dayName(r.day)) + "</text>";
    });
    var total = rows.reduce(function (a, r) { return a + (Number(r[key]) || 0); }, 0);
    return '<figure class="st-chart" data-key="' + key + '"><figcaption><b>' + esc(title) + '</b><span>' + (note || "") + '</span></figcaption>' +
      '<div class="st-plot"><svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(title) + ", daily, " + fmt(total) + ' in all">' + grid + bars + ticks + '</svg><div class="st-tip" hidden></div></div></figure>';
  }

  function draw(days) {
    $("st-msg").hidden = true; $("st-body").hidden = false;
    var t = data.today || {}, rows = (data.days || []).slice(), last = rows[rows.length - 1] || {};
    var invites = function (r) { return (Number(r.group_joins) || 0) + (Number(r.deck_adds) || 0); };
    var vs = function (k, f) { var v = f ? f(last) : last[k]; return rows.length ? "Yesterday " + fmt(v) : ""; };
    $("st-today").innerHTML =
      tile("Accounts Active", fmt(t.active_accounts), vs("active_accounts")) +
      tile("Devices Without an Account", fmt(t.devices_no_account), vs("devices_no_account")) +
      tile("New Accounts", fmt(t.signups), vs("signups")) +
      tile("Decks Studied", fmt(t.decks_studied), vs("decks_studied")) +
      tile("Quizzes Taken", fmt(t.quizzes), vs("quizzes")) +
      tile("Joined a Group or Added a Deck", fmt(invites(t)), vs(null, invites)) +
      tile("Joined From an Invite", fmt(t.invite_joins), vs("invite_joins"));

    // coming back: per cohort day, the share active 1, 7 and 30 days later (cohorts that have reached that age)
    var size = {}, act = {}, today = new Date().toISOString().slice(0, 10);
    rows.forEach(function (r) { size[r.day] = Number(r.signups) || 0; });
    (data.cohorts || []).forEach(function (c) { var age = Math.round((Date.parse(c.day) - Date.parse(c.cohort)) / 864e5); (act[c.cohort] = act[c.cohort] || {})[age] = c.active; });
    var ret = [1, 7, 30].map(function (k) {
      var made = 0, back = 0;
      Object.keys(size).forEach(function (d) { if (Date.parse(d) + k * 864e5 < Date.parse(today)) { made += size[d]; back += (act[d] && act[d][k]) || 0; } });
      return {k: k, made: made, back: back};
    });
    $("st-ret").innerHTML = ret.map(function (r) { return tile("After " + (r.k === 1 ? "1 Day" : r.k + " Days"), pct(r.back, r.made), r.made ? fmt(r.back) + " of " + fmt(r.made) + " new accounts" : "Not enough days yet"); }).join("");

    $("st-charts").innerHTML =
      chart("Accounts Active", "active_accounts", rows, "Opened Studyboard or saved something") +
      chart("Devices Without an Account", "devices_no_account", rows, "Counted once a day per device, nothing kept") +
      chart("New Accounts", "signups", rows, "Accounts made that day") +
      chart("Decks Studied", "decks_studied", rows, "Decks with a card reviewed that day") +
      chart("Quizzes Taken", "quizzes", rows, "Quizzes finished that day") +
      chart("Joined From an Invite", "invite_joins", rows, "New accounts that opened a friend's link");
    wireTips(rows);

    var cr = Object.keys(size).sort().reverse();
    $("st-cohorts").innerHTML = "<thead><tr><th>Day</th><th>New Accounts</th><th>After 1 Day</th><th>After 7 Days</th><th>After 30 Days</th></tr></thead><tbody>" +
      (cr.length ? cr.map(function (d) { var a = act[d] || {}, cell = function (k) { return Date.parse(d) + k * 864e5 < Date.parse(today) ? pct(a[k] || 0, size[d]) : '<span class="st-dim">…</span>'; };
        return "<tr><td>" + esc(dayName(d, true)) + "</td><td>" + fmt(size[d]) + "</td><td>" + cell(1) + "</td><td>" + cell(7) + "</td><td>" + cell(30) + "</td></tr>"; }).join("")
        : '<tr><td colspan="5" class="st-dim">No finished days yet.</td></tr>') + "</tbody>";

    var cols = [["active_accounts", "Accounts Active"], ["devices_no_account", "Devices, No Account"], ["devices_account", "Devices, Signed In"], ["signups", "New Accounts"],
      ["people_studied", "People Who Studied"], ["decks_studied", "Decks Studied"], ["quizzes", "Quizzes"], ["group_joins", "Group Joins"], ["deck_adds", "Decks Added"], ["invite_joins", "From Invites"]];
    $("st-days-table").innerHTML = "<thead><tr><th>Day</th>" + cols.map(function (c) { return "<th>" + c[1] + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.slice().reverse().map(function (r) { return "<tr><td>" + esc(dayName(r.day, true)) + "</td>" + cols.map(function (c) { return "<td>" + fmt(r[c[0]]) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody>";

    var tot = data.totals || {}, pol = data.versions || {};
    $("st-foot").innerHTML = fmt(tot.accounts) + " accounts in all · " + fmt(tot.invite_rewards) + " free months earned from invites · Update rule: " +
      (pol && Object.keys(pol).length ? "<code>" + esc(JSON.stringify(pol)) + "</code>" : "none (every version syncs)") + ". Days are UTC; today's numbers are so far.";
    $("st-sub").textContent = "Totals only, the last " + days + " days. No one is tracked.";
  }

  function wireTips(rows) {
    Array.prototype.forEach.call(document.querySelectorAll(".st-chart"), function (fig) {
      var tip = fig.querySelector(".st-tip"), key = fig.getAttribute("data-key"), plot = fig.querySelector(".st-plot");
      var show = function (g) {
        Array.prototype.forEach.call(fig.querySelectorAll(".st-bar.on"), function (x) { x.classList.remove("on"); });
        if (!g) { tip.hidden = true; return; }
        var r = rows[Number(g.getAttribute("data-i"))]; g.classList.add("on");
        tip.innerHTML = "<span>" + esc(dayName(r.day, true)) + "</span><b>" + fmt(r[key]) + "</b>"; tip.hidden = false;
        var b = g.getBoundingClientRect(), p = plot.getBoundingClientRect(), x = b.left - p.left + b.width / 2;
        tip.style.left = Math.max(40, Math.min(p.width - 40, x)) + "px";
      };
      plot.addEventListener("pointermove", function (e) { show(e.target.closest ? e.target.closest(".st-bar") : null); });
      plot.addEventListener("pointerleave", function () { show(null); });
    });
  }

  $("st-days").addEventListener("change", load);
  load();
})();
