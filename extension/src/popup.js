// Studyboard School Sync: the toolbar popup. Connect a school site (the browser asks to let the extension read that one site),
// see when each was last read, sync now, choose how often, or remove it. Everything shown is built as text nodes, never as HTML.
"use strict";

const APP = "https://studyboardapp.com/";
const NAMES = { canvas: "Canvas", brightspace: "Brightspace", blackboard: "Blackboard" };
const TAGS = { canvas: "Canvas", brightspace: "D2L", blackboard: "Bb" };
const EVERY = [[15, "Every 15 minutes"], [30, "Every 30 minutes"], [60, "Every hour"], [180, "Every 3 hours"], [360, "Every 6 hours"], [720, "Every 12 hours"]];
const originOf = s => globalThis.__studyboardExt.originOf(s);
const $ = id => document.getElementById(id);
// Safari (see popup.css): one fixed height that scrolls inside
if (/Safari\//.test(navigator.userAgent) && !/Chrom(e|ium)\/|Edg\/|Firefox\//.test(navigator.userAgent)) document.documentElement.classList.add("fixed");
const send = m => chrome.runtime.sendMessage(m);

// h("div", {class: "x"}, "text", child): a small element builder (text is always text)
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
// A guess at the platform from an address, so the form can offer it (the background checks it for real)
function guess(url) {
  try {
    const u = new URL(url);
    if (/\.instructure\.com$/i.test(u.hostname) || /^\/courses(\/|$)/.test(u.pathname)) return "canvas";
    if (/^\/d2l\//i.test(u.pathname) || /brightspace|d2l/i.test(u.hostname)) return "brightspace";
    if (/^\/(ultra|webapps)\//i.test(u.pathname) || /blackboard/i.test(u.hostname)) return "blackboard";
  } catch (e) {}
  return "";
}

let tabUrl = "";
async function activeTab() {
  try { const [t] = await chrome.tabs.query({ active: true, currentWindow: true }); return (t && t.url) || ""; } catch (e) { return ""; }
}

function statusLine(id, s, st) {
  if (!st || !st.state) return { text: "Waiting for the first sync…", tone: "" };
  if (st.state === "syncing" && Date.now() - (st.since || 0) < 5 * 60000) return { text: "Syncing now… This can take a minute.", tone: "busy" };
  if (st.state === "ok") return { text: `Synced ${ago(st.lastOk || st.at)} · ${plural(st.courses || 0, "course")}, ${plural(st.items || 0, "item")}, ${plural(st.grades || 0, "grade")}`, tone: "ok" };
  if (st.state === "login") return { text: `Sign in to ${host(s.origin)} in this browser. Studyboard syncs by itself once you're signed in.`, tone: "warn", login: true };
  if (st.state === "permission") return { text: `Studyboard isn't allowed to read ${host(s.origin)} any more. Allow it again to keep syncing.`, tone: "warn", allow: true };
  return { text: `Couldn't read it last time${st.error ? ` (${st.error})` : ""}. It tries again by itself.${st.lastOk ? ` Last synced ${ago(st.lastOk)}.` : ""}`, tone: "warn" };
}

// Asked in the popup itself: Safari's popups can't show confirm() dialogs
function askRemove(btn, id) {
  const box = h("div", { class: "confirm", role: "group", "aria-label": "Remove " + NAMES[id] },
    h("p", { class: "mini" }, `Stop syncing ${NAMES[id]}? Studyboard keeps what it already brought in.`),
    h("div", { class: "row" }, h("span", { class: "spacer" }),
      h("button", { type: "button", class: "btn small", onclick: () => { box.replaceWith(btn); btn.focus(); } }, "Cancel"),
      h("button", { type: "button", class: "btn small danger", onclick: async ev => { ev.currentTarget.disabled = true; await send({ op: "remove", id }).catch(() => {}); render(); } }, "Stop Syncing")));
  btn.replaceWith(box);
  box.querySelector(".danger").focus();
}

function schoolCard(id, s, st) {
  const line = statusLine(id, s, st);
  const busyNow = line.tone === "busy";
  return h("li", { class: "school" },
    h("div", { class: "row" },
      h("span", { class: "badge b-" + id, "aria-hidden": "true" }, TAGS[id]),
      h("div", { class: "who" }, h("b", {}, NAMES[id]), h("span", { class: "mini" }, host(s.origin))),
      h("button", { type: "button", class: "btn small", disabled: busyNow, onclick: async e => { e.target.disabled = true; e.target.textContent = "Syncing…"; await send({ op: "sync", id }); render(); } }, busyNow ? "Syncing…" : "Sync Now")),
    h("p", { class: "status " + line.tone }, line.text),
    h("div", { class: "row actions" },
      line.login ? h("button", { type: "button", class: "btn small primary", onclick: () => chrome.tabs.create({ url: s.origin + "/" }) }, "Open " + host(s.origin)) : null,
      line.allow ? h("button", { type: "button", class: "btn small primary", onclick: () => {
        chrome.permissions.request({ origins: [s.origin + "/*"] }).then(ok => { if (ok) send({ op: "sync", id }).then(render); });
      } }, "Allow Again") : null,
      h("span", { class: "spacer" }),
      h("button", { type: "button", class: "link", onclick: e => askRemove(e.currentTarget, id) }, "Remove")));
}

function connectForm(have) {
  const guessed = guess(tabUrl), tabOrigin = guessed || (tabUrl && !/studyboardapp\.com/i.test(tabUrl)) ? originOf(tabUrl) : null;
  const input = h("input", { type: "text", id: "addr", inputmode: "url", autocomplete: "off", spellcheck: "false", placeholder: "school.instructure.com", value: tabOrigin ? host(tabOrigin) : "", "aria-describedby": "addrHelp" });
  const sel = h("select", { id: "plat" }, h("option", { value: "" }, "Find out automatically"), ...Object.keys(NAMES).filter(k => !have.includes(k) || k === guessed).map(k => h("option", { value: k, selected: k === guessed }, NAMES[k])));
  const msg = h("p", { class: "status", id: "formMsg", role: "status" });
  // The platform is found out by itself; picking it is tucked away (opened when it couldn't be found out)
  const more = h("details", { class: "more" }, h("summary", {}, "Choose the platform"), h("label", { class: "f" }, h("span", { class: "sr" }, "Platform"), sel));
  const go = h("button", { type: "submit", class: "btn primary" }, "Agree, Allow and Connect");
  const form = h("form", { class: "connect", onsubmit: e => {
    e.preventDefault();
    const origin = originOf(input.value);
    if (!origin) { msg.className = "status warn"; msg.textContent = "Type your school site's address, like school.instructure.com or learn.school.edu."; input.focus(); return; }
    const platform = sel.value;
    // The permission request has to start right away, inside the click. Firefox may close this popup while it asks,
    // so the background is told first and finishes connecting when the permission arrives.
    send({ op: "pending", origin, platform }).catch(() => {});
    chrome.permissions.request({ origins: [origin + "/*"] }).then(async ok => {
      if (!ok) { msg.className = "status warn"; msg.textContent = "Studyboard needs your OK to read that site. Nothing was connected."; return; }
      go.disabled = true; msg.className = "status busy"; msg.textContent = "Connecting…";
      const r = await send({ op: "add", origin, platform });
      if (r && r.ok) { render(); return; }
      go.disabled = false; msg.className = "status warn";
      if (r && r.error === "unknown-platform") more.open = true;
      msg.textContent = r && r.error === "unknown-platform" ? "That site doesn't look like Canvas, Brightspace or Blackboard. Check the address, or pick the platform above." : "Couldn't connect that site. Check the address and try again.";
    }, () => { msg.className = "status warn"; msg.textContent = "Couldn't ask for permission here. Try again."; });
  } },
    h("h2", {}, have.length ? "Connect Another School Site" : "Connect Your School Site"),
    h("label", { class: "f" }, h("span", {}, "School Site Address"), input),
    h("p", { class: "mini", id: "addrHelp" }, "Your browser asks you to let Studyboard read this one site. ", more),
    // What it collects and what happens to it, shown before anything is read (Chrome Web Store: prominent disclosure and consent)
    h("div", { class: "disclose", id: "disclose" },
      h("p", {}, h("b", {}, "What it reads: "), "from this site, about every hour, your courses, due dates, submissions, grades, feedback, rubrics, announcements, syllabus, your name, your instructors' names and school emails, and (Canvas) Inbox messages."),
      h("p", {}, h("b", {}, "Where it goes: "), "this browser and your Studyboard planner (and your Studyboard account, if you have one). Only used to show your school work. Never sold or used for ads. ",
        h("a", { href: "https://studyboardapp.com/website/privacy.html#extension", target: "_blank", rel: "noopener noreferrer" }, "Privacy Policy"))),
    go, msg);
  go.setAttribute("aria-describedby", "disclose");
  return form;
}

async function render() {
  const st = await send({ op: "status" }).catch(() => null);
  const main = $("main"); main.textContent = "";
  if (!st || st.error) { main.append(h("p", { class: "status warn" }, "Studyboard School Sync is starting. Close this and open it again in a moment.")); return; }
  $("ver").textContent = "Version " + st.version;
  const ids = Object.keys(st.schools);
  if (ids.length) {
    main.append(h("ul", { class: "schools" }, ids.map(id => schoolCard(id, st.schools[id], st.status[id]))));
    main.append(h("div", { class: "settings" },
      h("label", { class: "f inline" }, h("span", {}, "Check for Changes"),
        h("select", { onchange: e => send({ op: "settings", every: Number(e.target.value) }) }, EVERY.map(([v, l]) => h("option", { value: v, selected: Number(st.settings.every) === v }, l)))),
      h("p", { class: "mini" }, "Also when you open your school site or Studyboard (if it's been 10 minutes). Studyboard on studyboardapp.com brings it in by itself.")));
  }
  if (ids.length < 3) {
    const more = ids.length ? h("details", { class: "more" }, h("summary", {}, "Connect another school site"), connectForm(ids)) : connectForm(ids);
    main.append(more);
  }
  if (ids.some(id => (st.status[id] || {}).state === "syncing")) setTimeout(render, 2500);
}

$("openApp").addEventListener("click", async () => {
  try { const [t] = await chrome.tabs.query({ url: APP + "*" }); if (t) { await chrome.tabs.update(t.id, { active: true }); if (chrome.windows) await chrome.windows.update(t.windowId, { focused: true }).catch(() => {}); /* (Safari on iPhone and iPad has no windows) */ window.close(); return; } } catch (e) {}
  chrome.tabs.create({ url: APP });
});
// Open at the top: Safari focuses the first control by itself and scrolls to it
activeTab().then(u => { tabUrl = u; return render(); }).then(() => {
  if (!document.documentElement.classList.contains("fixed")) return;
  const a = document.activeElement; if (a && a !== document.body && a.blur) a.blur();
  document.body.scrollTop = 0; document.documentElement.scrollTop = 0;
});
