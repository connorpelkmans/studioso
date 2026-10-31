/* ===== module: 95-announce.js ===== */
/* Class announcements in one place */
(() => {
  const KEY = "studyboard:annRead", TAB_KEY = "studyboard:annTab", FRESH_DAYS = 21, HOME = "home";
  const plats = () => ["brightspace", "canvas", "blackboard", "schoology", "classroom"].map(k => window.SBLMS && window.SBLMS[k]).filter(L => L && L.cfg && L.connected(L.cfg()));
  let readMem = null;
  const readSet = () => { if (!readMem) { try { readMem = new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch(e) { readMem = new Set(); } } return readMem; };
  const saveRead = () => { try { localStorage.setItem(KEY, JSON.stringify([...readSet()].slice(-600))); } catch(e) {} };
  let restOpen = false;
  document.addEventListener("toggle", e => { if (e.target && e.target.classList && e.target.classList.contains("ann-rest")) restOpen = e.target.open; }, true);
  let tab = HOME; try { tab = localStorage.getItem(TAB_KEY) || HOME; } catch(e) {}
  const setTab = k => { tab = k; try { localStorage.setItem(TAB_KEY, k); } catch(e) {} };
  // The last Check Now
  let st = {busy: false, kind: "", msg: "", btn: null};
  // Everything announced, newest first
  function items(){
    const out = [];
    plats().forEach(L => {
      const c = L.cfg(), seen = new Set();
      (c.newsItems || []).forEach(n => {
        const m = c.map && c.map[n.ou]; if (m === "skip") return;
        const key = L.P.id + "|" + n.ou + "|" + n.id; if (seen.has(key)) return; seen.add(key);
        const cr = m && m !== "new" ? state.courses[m] : null, bc = (c.courses || {})[n.ou] || {};
        out.push({key, ou: n.ou, id: n.id, title: htmlLine(n.title) || "(No title)", text: htmlText(n.text), long: !!n.long, date: n.date || "", url: safeUrl(n.url) || "", plat: L.P.name,
          cid: cr ? cr.id : "", course: htmlLine(cr ? courseLabel(cr) : (cleanCourseCode(bc.code, bc.name) || bc.name || L.P.name + " Course")),
          courseName: htmlLine(cr ? cr.name : (bc.name || "")), color: cr ? cr.color : "#8A94A6"});
      });
    });
    return out.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }
  const isNew = (n, rs) => !rs.has(n.key) && (!n.date || Date.parse(n.date) > Date.now() - FRESH_DAYS * 864e5);
  const unread = () => { const rs = readSet(); return items().filter(n => isNew(n, rs)).length; };
  window.SBANN = {items, info: key => { try { return AUTO_ON && autoFeatOn("news") && AUTO.ann && AUTO.ann[key] || null; } catch(e) { return null; } }};
  function badge(){
    const on = plats().length > 0, n = on ? unread() : 0;
    $$(".ann-btn").forEach(b => {
      b.hidden = !on;
      const dot = b.querySelector(".ann-n"); if (dot) { dot.hidden = !n; dot.textContent = n > 9 ? "9+" : String(n); }
      b.setAttribute("aria-label", n ? `Class announcements, ${n} unread` : "Class announcements");
    });
  }
  // "today", "yesterday", "3 days ago", "2 weeks ago", else the date
  function rel(d){
    const t = Date.parse(d); if (isNaN(t)) return "";
    const n = Math.floor((Date.now() - t) / 864e5);
    return n <= 0 ? "today" : n === 1 ? "yesterday" : n < 14 ? `${n} days ago` : n < 60 ? `${Math.floor(n / 7)} weeks ago` : fmtShort(iso(new Date(t)));
  }
  const ago = ms => { const m = Math.floor((Date.now() - ms) / 6e4); return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.floor(m / 60)} h ago` : `${Math.floor(m / 1440)} d ago`; };
  const bsDesk = () => !!lmsBridge();
  // Can this connection fetch announcements from this device
  function how(L){
    const c = L.cfg();
    if (!bsDesk()) return "web";
    if (c.mode !== "api" || !c.host) return "feed";
    return c.news === false ? "off" : "api";
  }
  const lastChecked = () => { const t = Math.max(0, ...plats().map(L => (L.cfg().last || 0))); return t > 1e11 ? t : 0; };

  function sheet(){
    const body0 = dlg.querySelector(".ann-sheet .sheet-body"), top = body0 ? body0.scrollTop : 0, hadFocus = !!(document.activeElement && document.activeElement.closest && document.activeElement.closest(".ann-sel"));
    const rs = readSet(), all = items(), np = plats();
    const nUn = all.filter(n => isNew(n, rs)).length;
    const groups = [];
    all.forEach(n => { const k = n.cid || n.plat + n.ou; let g = groups.find(x => x.k === k); if (!g) groups.push(g = {k, name: n.course, full: n.courseName, color: n.color, list: []}); g.list.push(n); });
    groups.forEach(g => { g.un = g.list.filter(n => isNew(n, rs)).length; });
    groups.sort((a, b) => (!!b.un - !!a.un) || String(b.list[0].date).localeCompare(String(a.list[0].date)));
    if (tab !== HOME && !groups.some(g => g.k === tab)) tab = HOME;
    const cur = groups.find(g => g.k === tab);
    const row = (n, chip) => { const un = isNew(n, rs), when = n.date && !isNaN(Date.parse(n.date)) ? rel(n.date) : "";
      const ai = window.SBANN.info(n.key), AB = ai && ai.imp ? `<p class="ann-ai"><span class="ann-attn">Needs attention</span> ${ai.sum ? esc(ai.sum) : ""}</p>` : "";
      return `<li class="${un ? "unread" : ""}${ai && ai.imp ? " attn" : ""}">${chip ? `<span class="ann-chip" style="--c:${esc(n.color)}"${n.courseName && n.courseName !== n.course ? ` title="${esc(n.courseName)}"` : ""}><span class="sd"></span>${esc(n.course)}</span>` : ""}<b>${esc(n.title)}</b><span class="mini">${esc(n.plat)}${when ? ` · <span title="${esc(fmtShort(iso(new Date(n.date))))}">${esc(when)}</span>` : ""}${un ? " · New" : ""}</span>${AB}
        ${n.text ? (n.text.length > 200 || n.long ? `<details><summary><span class="ann-pre">${esc(n.text.slice(0, 120).replace(/\s+/g, " "))}… Read more</span><span class="ann-less">Show less</span></summary><p class="ann-txt">${esc(n.text)}${n.long ? "…" : ""}</p></details>` : `<p class="ann-txt">${esc(n.text)}</p>`) : ""}
        <span class="bs-btns">${n.url ? `<button type="button" class="btn small" data-act="ann-go" data-key="${esc(n.key)}" data-url="${esc(n.url)}">Open in ${esc(n.plat)}</button>` : ""}<button type="button" class="btn small" data-act="ann-read" data-key="${esc(n.key)}">${un ? "Mark Read" : "Mark Unread"}</button></span></li>`; };
    const opt = (k, label, un) => `<option value="${esc(k)}"${tab === k ? " selected" : ""}>${esc(label)}${un ? ` · ${un} new` : ""}</option>`;
    let panel;
    if (!all.length) panel = "";
    else if (tab === HOME) {
      const recent = all.slice(0, 3);
      const older = all.slice(3);
      panel = `<ul class="ann-list">${recent.map(n => row(n, true)).join("")}</ul>
        ${older.length ? `<details class="ann-rest"${restOpen ? " open" : ""}><summary>Older announcements<span class="ann-rest-n">${older.length}</span></summary><ul class="ann-list">${older.map(n => row(n, true)).join("")}</ul></details>` : ""}`;
    } else {
      panel = `<h3 class="ann-course" style="--c:${esc(cur.color)}"><span class="sd"></span>${esc(cur.name)}${cur.full && cur.full !== cur.name ? ` <span class="mini">${esc(cur.full)}</span>` : ""}<span class="n">${cur.list.length} announcement${cur.list.length === 1 ? "" : "s"}${cur.un ? `, ${cur.un} new` : ""}</span></h3>
        <ul class="ann-list">${cur.list.map(n => row(n, false)).join("")}</ul>`;
    }
    const status = st.busy ? `<p class="ann-status" role="status" aria-live="polite" data-kind="busy">Checking your school site for new announcements…</p>`
      : st.msg ? `<p class="ann-status" role="status" aria-live="polite" data-kind="${esc(st.kind)}">${esc(st.msg)}${st.btn ? ` <button type="button" class="btn small" data-act="${esc(st.btn.act)}" data-plat="${esc(st.btn.plat || "")}">${esc(st.btn.label)}</button>` : ""}</p>` : "";
    const lc = lastChecked();
    openSheet(`<div class="sheet ann-sheet">${head("Class Announcements")}
      <div class="sheet-body">
        ${np.length ? `<p class="mini ann-bar">${nUn ? `${nUn} unread` : "All caught up"}${lc ? ` · checked ${esc(ago(lc))}` : ""}</p>` : ""}
        ${np.length || all.length ? `<div class="ann-ctl">${all.length ? `<select class="ann-sel" id="annSel" aria-label="Show announcements for" aria-controls="annPanel">${opt(HOME, "All Classes", 0)}${groups.map(g => opt(g.k, g.name, g.un)).join("")}</select>` : ""}${np.length ? `${nUn ? `<button type="button" class="btn small" data-act="ann-readall">Mark All Read</button>` : ""}<button type="button" class="btn small" data-act="ann-check"${st.busy ? " disabled" : ""}>${st.busy ? "Syncing…" : "Sync"}</button>` : ""}</div>` : ""}${np.length ? status : ""}
        ${all.length ? `<div id="annPanel" role="tabpanel" aria-labelledby="annSel" tabindex="0">${panel}</div>` : ""}
        ${!np.length ? `<div class="empty"><strong>No School Site Connected</strong>Connect Brightspace, Canvas or Blackboard in Settings and your class announcements show up here.</div>` : !all.length ? `<div class="empty"><strong>No Announcements Yet</strong>When your instructors post one, it shows up here after the next sync. ${bsDesk() ? "Press Check Now to look right away." : "Announcements come in through the Studyboard School Sync extension or the Studyboard app."}</div>` : ""}
      </div></div>`);
    if (!dlg.open) dlg.showModal();
    const b = dlg.querySelector(".ann-sheet .sheet-body"); if (b && top) b.scrollTop = top;
    if (hadFocus) { const sel = dlg.querySelector(".ann-sel"); if (sel) sel.focus({preventScroll: true}); }
    badge();
  }
  const mark = (key, on) => { on ? readSet().add(key) : readSet().delete(key); saveRead(); };

  // Check Now: a real sync, started by hand
  async function check(){
    if (st.busy) return;
    const ps = plats();
    if (!ps.length) { st = {busy: false, kind: "info", msg: "No school site is connected yet. Connect one in Settings.", btn: null}; sheet(); return; }
    if (!navigator.onLine) { st = {busy: false, kind: "err", msg: "You're offline. Connect to the internet and try again.", btn: null}; sheet(); return; }
    const can = ps.filter(L => how(L) === "api"), cant = ps.filter(L => how(L) !== "api");
    let why = "", btn = null;
    if (cant.length) {
      const w = cant[0], h = how(w), nm = cant.map(L => L.P.name).join(" and ");
      why = h === "web" ? `${nm} announcements come in through the Studyboard School Sync extension or the Studyboard desktop, iPhone or Android app, which sign in to your school's site. This page shows what they've already brought in.`
        : h === "feed" ? `${nm} is connected with a calendar link, which has no announcements in it. Sign in through the desktop app to get them.`
        : `Announcements are switched off for ${nm}. Turn them on in its school settings.`;
      if (h !== "web") btn = {act: "ann-setup", plat: w.P.id, label: "Open Settings"};
    }
    if (!can.length) { st = {busy: false, kind: "info", msg: why, btn}; sheet(); return; }
    const before = new Set(items().map(n => n.key)), t0 = Date.now();
    st = {busy: true, kind: "", msg: "", btn: null}; sheet();
    const slow = new Promise(r => setTimeout(() => r("slow"), 90000));
    const results = await Promise.all(can.map(L => Promise.race([L.syncNow({quiet: true}).then(() => "done", () => "fail"), slow])));
    const errs = [], login = [];
    can.forEach((L, i) => {
      const lo = L.local();
      if (results[i] === "slow") errs.push(`${L.P.name} took too long to answer.`);
      else if (lo.needLogin) login.push(L);
      else if (!(lo.lastOk >= t0)) errs.push(lo.err || `Couldn't finish checking ${L.P.name}. Try again in a minute.`);
    });
    const fresh = items().filter(n => !before.has(n.key) && isNew(n, readSet())).length;
    let kind = "ok", msg;
    if (login.length) { kind = "err"; msg = `Your ${login.map(L => L.P.name).join(" and ")} sign-in ran out, so announcements couldn't be fetched.`; btn = {act: login[0].P.k + "-login", plat: login[0].P.id, label: "Sign In"}; }
    else if (errs.length) { kind = "err"; msg = errs.join(" "); btn = null; }
    else msg = fresh ? `${fresh} new announcement${fresh === 1 ? "" : "s"}.` : "Up to date. No new announcements.";
    if (!login.length && why) msg += " " + why;
    st = {busy: false, kind, msg, btn: login.length || !errs.length ? btn : null};
    if (dlg.querySelector(".ann-sheet")) sheet(); else badge();
  }

  hook("act", (act, el) => {
    switch (act) {
      case "ann-open": sheet(); return true;
      case "ann-tab": setTab(el.dataset.ann || HOME); sheet(); return true;
      case "ann-read": { const rs = readSet(), n = items().find(x => x.key === el.dataset.key); if (n) mark(n.key, isNew(n, rs)); else mark(el.dataset.key, !rs.has(el.dataset.key)); sheet(); return true; }
      case "ann-readall": items().forEach(n => readSet().add(n.key)); saveRead(); sheet(); return true;
      case "ann-go": mark(el.dataset.key, true); openOutside(el.dataset.url); sheet(); return true;
      case "ann-setup": { const L = plats().find(x => x.P.id === el.dataset.plat); if (L) { dlg.close(); L.bsSheet(); } return true; }
      case "ann-check": check(); return true;
    }
    return false;
  });
  // The class picker is a native dropdown
  document.addEventListener("change", e => { const sel = e.target && e.target.closest && e.target.closest(".ann-sel"); if (sel) { setTab(sel.value || HOME); sheet(); } });
  hook("render", () => badge());
  hook("boot", () => { badge(); setTimeout(badge, 3000); });
})();


