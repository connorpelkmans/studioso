// Studyboard School Sync
"use strict";

const APP = "https://studyboardapp.com/";
const NAMES = { canvas: "Canvas", brightspace: "Brightspace", blackboard: "Blackboard", moodle: "Moodle" };
const TAGS = { canvas: "Canvas", brightspace: "D2L", blackboard: "Bb", moodle: "M" };
const EVERY = [[15, "Every 15 minutes"], [30, "Every 30 minutes"], [60, "Every hour"], [180, "Every 3 hours"], [360, "Every 6 hours"], [720, "Every 12 hours"]];
const everyText = v => ((EVERY.find(([m]) => m === Number(v)) || EVERY[2])[1]).toLowerCase();
// A sync that started more than 5 minutes ago is treated as stuck (as in statusLine): the popup stops waiting for it
const syncingNow = st => !!st && st.state === "syncing" && Date.now() - (st.since || 0) < 5 * 60000;
const originOf = s => globalThis.__studyboardExt.originOf(s);
const $ = id => document.getElementById(id);
// Safari (see popup.css)
const FIXED = /Safari\//.test(navigator.userAgent) && !/Chrom(e|ium)\/|Edg\/|Firefox\//.test(navigator.userAgent);
const POP_H = "popupHeight", fitH = n => Math.max(300, Math.min(600, Math.round(n)));
function setPopupH(n) { document.documentElement.style.height = document.body.style.height = fitH(n) + "px"; }
if (FIXED) { document.documentElement.classList.add("fixed"); let last = 0; try { last = Number(localStorage.getItem(POP_H)) || 0; } catch (e) {} setPopupH(last || 600); }
const send = m => chrome.runtime.sendMessage(m);

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([k, v]) => { if (v == null || v === false) return; if (k === "class") el.className = v; else if (k.startsWith("on")) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v === true ? "" : String(v)); });
  kids.flat().forEach(k => { if (k == null || k === false) return; el.append(k instanceof Node ? k : document.createTextNode(String(k))); });
  return el;
}
const host = o => { try { return new URL(o).host; } catch (e) { return o; } };
function ago(t) {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60); if (m < 60) return m + " min ago";
  const hr = Math.round(m / 60); if (hr < 24) return hr + (hr === 1 ? " hour ago" : " hours ago");
  const d = Math.round(hr / 24); return d + (d === 1 ? " day ago" : " days ago");
}
const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");
// A guess at the platform from an address, so the form can offer it
function guess(url) {
  try {
    const u = new URL(url);
    if (/\.instructure\.com$/i.test(u.hostname) || /^\/courses(\/|$)/.test(u.pathname)) return "canvas";
    if (/^\/d2l\//i.test(u.pathname) || /brightspace|d2l/i.test(u.hostname)) return "brightspace";
    if (/^\/(ultra|webapps)\//i.test(u.pathname) || /blackboard/i.test(u.hostname)) return "blackboard";
    if (/moodle/i.test(u.hostname) || /^\/(my\/|course\/view\.php|mod\/[a-z]+\/view\.php)/i.test(u.pathname)) return "moodle";
  } catch (e) {}
  return "";
}

let tabUrl = "";
async function activeTab() {
  try { const [t] = await chrome.tabs.query({ active: true, currentWindow: true }); return (t && t.url) || ""; } catch (e) { return ""; }
}

function statusLine(id, s, st) {
  if (!st || !st.state) return { text: "Waiting for the first sync…", tone: "" };
  if (syncingNow(st)) return { text: "Syncing now… This can take a minute.", tone: "busy" };
  if (st.state === "ok") return { text: `Synced ${ago(st.lastOk || st.at)} · ${plural(st.courses || 0, "course")}, ${plural(st.items || 0, "item")}, ${plural(st.grades || 0, "grade")}`, tone: "ok" };
  if (st.state === "login") return { text: `Sign in to ${host(s.origin)} in this browser. Studyboard syncs by itself once you're signed in.`, tone: "warn", login: true };
  if (st.state === "permission") return { text: `Studyboard isn't allowed to read ${host(s.origin)} any more. Allow it again to keep syncing.`, tone: "warn", allow: true };
  return { text: `Couldn't read it last time${st.error ? ` (${st.error})` : ""}. It tries again by itself.${st.lastOk ? ` Last synced ${ago(st.lastOk)}.` : ""}`, tone: "warn" };
}

// Asked in the popup itself
function askRemove(btn, id) {
  const box = h("div", { class: "confirm", role: "group", "aria-label": "Remove " + NAMES[id] },
    h("p", { class: "mini" }, `Stop syncing ${NAMES[id]}? Studyboard keeps what it already brought in.`),
    h("div", { class: "row" }, h("span", { class: "spacer" }),
      h("button", { type: "button", class: "btn small", onclick: () => { box.replaceWith(btn); btn.focus(); } }, "Cancel"),
      h("button", { type: "button", class: "btn small danger", onclick: async ev => { ev.currentTarget.disabled = true; await send({ op: "remove", id }).catch(() => {}); refresh(); } }, "Stop Syncing")));
  btn.replaceWith(box);
  box.querySelector(".danger").focus();
}

function cardActions(id, s, line) {
  return h("div", { class: "row actions" },
    line.login ? h("button", { type: "button", class: "btn small primary", onclick: () => chrome.tabs.create({ url: s.origin + "/" }) }, "Open " + host(s.origin)) : null,
    line.allow ? h("button", { type: "button", class: "btn small primary", onclick: () => {
      chrome.permissions.request({ origins: [s.origin + "/*"] }).then(ok => { if (ok) { refresh(); send({ op: "sync", id }).then(refresh); } });
    } }, "Allow Again") : null,
    h("span", { class: "spacer" }),
    h("button", { type: "button", class: "link", onclick: e => askRemove(e.currentTarget, id) }, "Remove"));
}
function schoolCard(id, s, st) {
  const line = statusLine(id, s, st);
  const busyNow = line.tone === "busy";
  return h("li", { class: "school", "data-id": id, "data-k": (line.login ? "l" : "") + (line.allow ? "a" : "") },
    h("div", { class: "row" },
      h("span", { class: "badge b-" + id, "aria-hidden": "true" }, TAGS[id]),
      h("div", { class: "who" }, h("b", {}, NAMES[id]), h("span", { class: "mini" }, host(s.origin))),
      h("button", { type: "button", class: "btn small sync", disabled: busyNow, onclick: async e => { e.target.disabled = true; e.target.textContent = "Syncing…"; refresh(); await send({ op: "sync", id }); refresh(); } }, busyNow ? "Syncing…" : "Sync Now")),
    h("p", { class: "status " + line.tone }, line.text),
    cardActions(id, s, line));
}
// Only what changed on a card, so a question that is open (Remove) or the button being pressed stays as it is
function updateCard(li, id, s, st) {
  const line = statusLine(id, s, st), busyNow = line.tone === "busy", p = li.querySelector("p.status"), b = li.querySelector("button.sync");
  if (p && (p.textContent !== line.text || p.className !== "status " + line.tone)) { p.className = "status " + line.tone; p.textContent = line.text; }
  if (b && b !== document.activeElement) { b.disabled = busyNow; b.textContent = busyNow ? "Syncing…" : "Sync Now"; }
  const k = (line.login ? "l" : "") + (line.allow ? "a" : ""), row = li.querySelector(".row.actions");
  if (row && li.dataset.k !== k && !li.querySelector(".confirm")) { row.replaceWith(cardActions(id, s, line)); li.dataset.k = k; }
}

// The connect form: kept as it is across redraws once the person has typed or chosen something
let form0 = null;
const formBusy = () => !!form0 && form0.isConnected && (form0.dataset.edited === "1" || form0.contains(document.activeElement));
function connectForm(have, every) {
  const guessed = guess(tabUrl), tabOrigin = guessed || (tabUrl && !/studyboardapp\.com/i.test(tabUrl)) ? originOf(tabUrl) : null;
  const input = h("input", { type: "text", id: "addr", inputmode: "url", autocomplete: "off", spellcheck: "false", placeholder: "school.instructure.com", value: tabOrigin ? host(tabOrigin) : "", "aria-describedby": "addrHelp" });
  const sel = h("select", { id: "plat" }, h("option", { value: "" }, "Find out automatically"), ...Object.keys(NAMES).filter(k => !have.includes(k) || k === guessed).map(k => h("option", { value: k, selected: k === guessed }, NAMES[k])));
  const msg = h("p", { class: "status", id: "formMsg", role: "status" });
  const more = h("details", { class: "more" }, h("summary", {}, "Choose the platform"), h("label", { class: "f" }, h("span", { class: "sr" }, "Platform"), sel));
  const go = h("button", { type: "submit", class: "btn primary" }, "Agree, Allow and Connect");
  const form = h("form", { class: "connect", oninput: () => { form.dataset.edited = "1"; }, onchange: () => { form.dataset.edited = "1"; }, onsubmit: e => {
    e.preventDefault();
    const origin = originOf(input.value);
    if (!origin) { msg.className = "status warn"; msg.textContent = "Type your school site's address, like school.instructure.com or learn.school.edu."; input.focus(); return; }
    const platform = sel.value;
    send({ op: "pending", origin, platform }).catch(() => {});
    chrome.permissions.request({ origins: [origin + "/*"] }).then(async ok => {
      if (!ok) { msg.className = "status warn"; msg.textContent = "Studyboard needs your OK to read that site. Nothing was connected."; return; }
      go.disabled = true; msg.className = "status busy"; msg.textContent = "Connecting…";
      const r = await send({ op: "add", origin, platform });
      if (r && r.ok) { form.dataset.edited = ""; form0 = null; render(); return; }
      go.disabled = false; msg.className = "status warn";
      if (r && r.error === "exists") { msg.className = "status"; msg.textContent = ""; form.dataset.edited = "1"; askReplace(msg, r.id, r.old, origin, () => { form.dataset.edited = ""; form0 = null; render(); }); return; }
      if (r && r.error === "unknown-platform") more.open = true;
      msg.textContent = r && r.error === "unknown-platform" ? "That site doesn't look like Canvas, Brightspace, Blackboard or Moodle. Check the address, or pick the platform above." : "Couldn't connect that site. Check the address and try again.";
    }, () => { msg.className = "status warn"; msg.textContent = "Couldn't ask for permission here. Try again."; });
  } },
    h("h2", {}, have.length ? "Connect Another School Site" : "Connect Your School Site"),
    h("label", { class: "f" }, h("span", {}, "School Site Address"), input),
    h("p", { class: "mini", id: "addrHelp" }, "Your browser asks you to let Studyboard read this one site. ", more),
    h("div", { class: "disclose", id: "disclose" },
      h("p", {}, h("b", {}, "What it reads: "), `from this site, about ${everyText(every)}, your courses, due dates, submissions, grades, feedback, rubrics, announcements, syllabus, your name, your instructors' names and school emails, and (Canvas) Inbox messages.`),
      h("p", {}, h("b", {}, "Where it goes: "), "this browser and your Studyboard planner (and your Studyboard account, if you have one). Only used to show your school work. Never sold or used for ads. ",
        h("a", { href: "https://studyboardapp.com/website/privacy.html#extension", target: "_blank", rel: "noopener noreferrer" }, "Privacy Policy"))),
    go, msg);
  go.setAttribute("aria-describedby", "disclose");
  form0 = form;
  return form;
}
const REPLACE_Q = '.confirm[aria-label^="Replace"]';
function setDisclose(v) { const b = document.querySelector("#disclose p b"), t = b && b.nextSibling; if (t) t.textContent = t.textContent.replace(/about every [^,]+,/, "about " + everyText(v) + ","); }
// The same platform is already connected to another site: replace it only when the person says so
function askReplace(anchor, id, old, origin, done) {
  const box = h("div", { class: "confirm", role: "group", "aria-label": "Replace " + NAMES[id] },
    h("p", { class: "mini" }, `Studyboard already syncs ${NAMES[id]} from ${host(old)}, and it can sync one ${NAMES[id]} site at a time. Switch to ${host(origin)}? Studyboard keeps what it already brought in from ${host(old)}.`),
    h("div", { class: "row" }, h("span", { class: "spacer" }),
      h("button", { type: "button", class: "btn small", onclick: async () => { await send({ op: "keep", origin }).catch(() => {}); box.remove(); done(); } }, "Keep " + host(old)),
      h("button", { type: "button", class: "btn small primary", onclick: async ev => { ev.currentTarget.disabled = true; await send({ op: "add", origin, platform: id, replace: true }).catch(() => {}); box.remove(); done(); } }, "Switch")));
  anchor.after(box);
  box.querySelector(".primary").focus();
  return box;
}

// Draws the popup. While a sync runs, only the status lines are updated (refresh); the whole popup is drawn again only when
// the schools themselves change, and a connect form someone is filling in is carried over as it is.
let shown = "", pollT = 0;
async function render() {
  clearTimeout(pollT);
  const st = await send({ op: "status" }).catch(() => null);
  const main = $("main");
  if (!st || st.error) { shown = ""; main.textContent = ""; main.append(h("p", { class: "status warn" }, "Studyboard School Sync is starting. Close this and open it again in a moment.")); return; }
  $("ver").textContent = "Version " + st.version;
  const ids = Object.keys(st.schools), keep = formBusy() ? form0 : null;
  const openMore = !!(keep && keep.parentElement && keep.parentElement.tagName === "DETAILS" && keep.parentElement.open);
  shown = ids.map(id => id + "=" + st.schools[id].origin).join() + "|" + st.settings.every;
  main.textContent = "";
  document.body.classList.toggle("fresh", !ids.length);
  if (st.conflict && st.schools[st.conflict.id] && !(keep && keep.querySelector(REPLACE_Q))) {
    const note = h("div", {});
    main.append(note);
    askReplace(note, st.conflict.id, st.conflict.old, st.conflict.origin, render);
  }
  if (ids.length) {
    main.append(h("ul", { class: "schools" }, ids.map(id => schoolCard(id, st.schools[id], st.status[id]))));
    main.append(h("div", { class: "settings" },
      h("label", { class: "f inline" }, h("span", {}, "Check for Changes"),
        h("select", { onchange: e => { setDisclose(e.target.value); send({ op: "settings", every: Number(e.target.value) }); } }, EVERY.map(([v, l]) => h("option", { value: v, selected: Number(st.settings.every) === v }, l)))),
      h("p", { class: "mini" }, "Also when you open your school site or Studyboard.")));
  }
  // one site per platform, so every platform can be connected
  if (ids.length < Object.keys(NAMES).length) {
    const f = keep || connectForm(ids, st.settings.every);
    if (keep) setDisclose(st.settings.every);
    const more = ids.length ? h("details", { class: "more", open: openMore }, h("summary", {}, "Connect another school site"), f) : f;
    main.append(more);
  }
  poll(st);
}
// Status lines only; stops once nothing is syncing (or a sync looks stuck, as statusLine says)
async function refresh() {
  clearTimeout(pollT);
  const st = await send({ op: "status" }).catch(() => null);
  if (!st || st.error) return;
  const ids = Object.keys(st.schools), now = ids.map(id => id + "=" + st.schools[id].origin).join() + "|" + st.settings.every;
  if (now !== shown || (!!st.conflict && !document.querySelector(REPLACE_Q))) return render();
  ids.forEach(id => { const li = document.querySelector(`li.school[data-id="${id}"]`); if (li) updateCard(li, id, st.schools[id], st.status[id]); });
  poll(st);
}
function poll(st) {
  clearTimeout(pollT);
  if (Object.keys(st.schools).some(id => syncingNow(st.status[id]))) pollT = setTimeout(refresh, 2500);
}

$("openApp").addEventListener("click", async () => {
  try { const [t] = await chrome.tabs.query({ url: APP + "*" }); if (t) { await chrome.tabs.update(t.id, { active: true }); if (chrome.windows) await chrome.windows.update(t.windowId, { focused: true }).catch(() => {}); window.close(); return; } } catch (e) {}
  chrome.tabs.create({ url: APP });
});
// Open at the top
activeTab().then(u => { tabUrl = u; return render(); }).then(() => {
  if (!FIXED) return;
  const need = ["header", "main", "footer"].reduce((n, sel) => { const el = document.querySelector(sel); return n + (el ? el.offsetHeight : 0); }, 0) + 4;
  try { localStorage.setItem(POP_H, String(fitH(need))); } catch (e) {}
  const a = document.activeElement; if (a && a !== document.body && a.blur) a.blur();
  document.body.scrollTop = 0; document.documentElement.scrollTop = 0;
});
