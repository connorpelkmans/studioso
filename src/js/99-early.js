/* ===== module: 99-early.js ===== */
/* Founders and Early Supporters (PRO-PLANS-GUIDE.md, "Founders and Early Supporters") */
var SBEARLY = null;
(() => {
  const K = "studyboard:early", K_SEEN = "studyboard:earlySeen";
  const read = k => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const S = () => state.settings || {};
  const uidNow = () => (typeof sbUser !== "undefined" && sbUser ? sbUser.id : null);
  const paywall = () => typeof PLAN !== "undefined" && !!PLAN && PLAN.paywall();
  const paid = () => typeof PLAN !== "undefined" && !!PLAN && PLAN.paywall() && PLAN.isPro();
  const dateStr = v => { const t = Date.parse(v || ""); return isNaN(t) ? "" : new Date(t).toLocaleDateString(undefined, {month: "short", day: "numeric", year: "numeric"}); };
  const errText = e => String((e && e.message) || "").replace(/^SB_\w+:\s*/, "").slice(0, 160);

  // The last answer, per account (so badges and kept themes work offline)
  let E = (() => { const c = read(K); return c && c.d && typeof c.d === "object" ? c : {uid: null, d: null, at: 0}; })();
  const mine = () => (E.d && E.d.member && E.uid && E.uid === uidNow()) ? E.d : null;
  const status = () => E.d || {on: false};
  const kind = () => { const d = mine(); return d ? (d.founder ? "founder" : "early") : null; };
  const keeps = id => { const d = mine(); return !!d && Array.isArray(d.keep) && d.keep.includes(id); };

  let loading = false, lastLoad = 0;
  async function load(force){
    if (loading || typeof sb === "undefined" || !sb || !sb.rpc) return;
    if (!force && Date.now() - lastLoad < 10 * 60000) return;
    if (typeof inPreview === "function" && inPreview()) return;
    loading = true; lastLoad = Date.now();
    const before = JSON.stringify([kind(), (mine() || {}).keep, status().foundersLeft, status().supportersLeft, (mine() || {}).codes, (mine() || {}).themes]);
    try {
      const uid = uidNow();
      const {data, error} = await sb.rpc(uid ? "studyboard_my_early" : "studyboard_early_status");
      if (error) {
        if (/could not find|does not exist|schema cache/i.test(String(error.message || "")) || error.code === "PGRST202") E = {uid, d: {on: false}, at: Date.now()};
        return;
      }
      E = {uid, d: data && typeof data === "object" ? data : {on: false}, at: Date.now()};
      write(K, E);
    } catch (e) { return; }
    finally { loading = false; }
    if (JSON.stringify([kind(), (mine() || {}).keep, status().foundersLeft, status().supportersLeft, (mine() || {}).codes, (mine() || {}).themes]) !== before) {
      fire("early-changed", kind());
      try { if (typeof applySkin === "function") applySkin(); } catch (e) {}
      if (dlg.open && dlg.querySelector(".plan-sheet") && typeof PLAN !== "undefined" && PLAN) PLAN.openSheet("");
      scheduleRender();
    }
    welcome();
  }

  /* Pictures */
  const ROSETTE = (px = 30) => `<svg viewBox="0 0 24 24" width="${px}" height="${px}" aria-hidden="true"><path d="M8.2 15.5 6 23l3.4-1.6L11 24l1-7.6z" fill="#7C4DDB"/><path d="M15.8 15.5 18 23l-3.4-1.6L13 24l-1-7.6z" fill="#9B6BF0"/><path d="M12 .8l2 1.6 2.6-.4 1 2.4 2.4 1-.4 2.6 1.6 2-1.6 2 .4 2.6-2.4 1-1 2.4-2.6-.4-2 1.6-2-1.6-2.6.4-1-2.4-2.4-1 .4-2.6-1.6-2 1.6-2-.4-2.6 2.4-1 1-2.4 2.6.4z" fill="#F5B82E" stroke="#C98A0B" stroke-width=".8"/><circle cx="12" cy="10" r="5.6" fill="none" stroke="#FFF3CF" stroke-width=".9" opacity=".9"/><path d="M12 5.9l1.1 2.8 3 .2-2.3 1.9.7 2.9-2.5-1.6-2.5 1.6.7-2.9-2.3-1.9 3-.2z" fill="#fff"/></svg>`;
  const SEEDLING = (px = 28) => `<svg viewBox="0 0 24 24" width="${px}" height="${px}" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#1FA58F"/><path d="M12 19v-7" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M12 13c0-3.4-2.3-5.6-5.8-5.6 0 3.4 2.3 5.6 5.8 5.6z" fill="#D9FFF6"/><path d="M12 11.2c0-3 2-5 5.2-5 0 3-2 5-5.2 5z" fill="#fff"/></svg>`;
  const sw = (act, on, label) => `<button type="button" class="pro-sw" role="switch" aria-checked="${!!on}" data-act="${act}" aria-label="${esc(label)}"><i></i></button>`;

  /* Settings > Studyboard Pro */
  function themeLine(d){
    const t = Array.isArray(d.themes) ? d.themes : [];
    const picked = t.find(x => x.status === "picked");
    if (picked) {
      const live = picked.themeId && typeof SKINS !== "undefined" && SKINS.some(s => s.id === picked.themeId);
      return `<p class="mini" style="margin:0"><b>${esc(picked.name)}</b> was picked! ${live ? "It's in the Style Shop under Founder Themes, and it's yours to keep." : "It's being made now. When it's ready it appears in the Style Shop, and it's yours to keep, with or without Pro."}</p>`;
    }
    return `<p class="mini" style="margin:0">${t.length ? `You've suggested ${t.length} of 3. One will be built into Studyboard for every Pro user, and it's yours to keep, with or without Pro.` : "Suggest up to 3 themes. One will be built into Studyboard for every Pro user, and it's yours to keep, with or without Pro."}</p>`;
  }
  function codesHtml(d){
    const c = Array.isArray(d.codes) ? d.codes : [];
    if (!c.length) return "";
    const until = c.find(x => x.until) ? ` Each one works once, until ${esc(dateStr(c.find(x => x.until).until))}.` : "";
    return `<div class="ec-sec"><b>Pro for Your Friends</b><p class="mini" style="margin:0">Give each code to a friend for a month of Pro. They redeem it in Studyboard Pro, Redeem a Code.${until}</p>
      <ul class="ec-codes">${c.map(x => `<li><code>${esc(x.code)}</code>${x.used ? `<span class="pill">Used</span>` : x.off ? `<span class="pill">Stopped</span>` : `<button type="button" class="btn small" data-act="early-copy" data-id="${esc(x.code)}">Copy</button>${navigator.share ? `<button type="button" class="btn small" data-act="early-share" data-id="${esc(x.code)}">Share</button>` : ""}`}</li>`).join("")}</ul></div>`;
  }
  function sheetHtml(){
    const d = mine(), st = status();
    if (d) {
      const f = !!d.founder;
      return `<section class="early-card ${f ? "founder" : "early"}">
        <div class="ec-top">${f ? ROSETTE() : SEEDLING()}<div><b>${f ? `Founder #${esc(d.founderNumber || "")}` : `Early Supporter #${esc(d.number || "")}`}</b><span class="mini">${f ? "One of the first 10 people on a Semester or Yearly plan. Thank you for helping build Studyboard!" : "One of Studyboard's first 100 Pro members. Thank you!"}</span></div></div>
        <div class="ec-row"><span><b>Show My ${f ? "Founder" : "Early Supporter"} Badge in Groups</b><span class="mini">Beside your name in study groups. It stays even if your Pro ends.</span></span>${sw("pro-badge", S().badge, "Show my badge in groups")}</div>
        ${f ? `<div class="ec-sec"><b>Your Founder Theme</b>${themeLine(d)}<button type="button" class="btn small" data-act="early-themes">${(d.themes || []).length ? "See Your Suggestions" : "Suggest Themes"}</button></div>` : ""}
        ${codesHtml(d)}
      </section>`;
    }
    if (!st.on || !paywall() || paid()) return "";
    const fl = +st.foundersLeft || 0, sl = +st.supportersLeft || 0;
    if (!fl && !sl) return "";
    return `<section class="early-offer">${fl ? ROSETTE(34) : SEEDLING(30)}<div>
      ${fl ? `<b>Become a Founder</b><span>The first ${esc(st.founders)} people on a Semester or Yearly plan get a Founder badge in groups and suggest a theme that's built into Studyboard, theirs to keep. <b>${fl} of ${esc(st.founders)} places left.</b></span>` : ""}
      ${sl ? `<span>${fl ? "Then the" : "The"} first ${esc(st.supporters)} on any plan get an Early Supporter badge and a month of Pro for ${(st.friendCodes || 3) === 1 ? "a friend" : "friends"}. <b>${sl} left.</b></span>` : ""}
    </div></section>`;
  }

  /* Founder theme suggestions */
  function themesSheet(){
    const d = mine();
    if (!d || !d.founder) { toast("Theme suggestions are for Studyboard's Founders."); return; }
    const t = Array.isArray(d.themes) ? d.themes : [], at = n => t.find(x => x.slot === n) || {};
    const locked = t.some(x => x.status === "picked");
    openSheet(`<form class="sheet" id="earlyThemes">${head("Your Founder Themes")}<div class="sheet-body">
      <p style="margin:0">${locked ? "One of your themes was picked. Thank you! Your suggestions are final now." : "Describe up to 3 themes you'd love to study with: colors, a scene, a mood. We'll build one of them into Studyboard for every Pro user, and it's yours to keep for good."}</p>
      ${[1, 2, 3].map(n => { const x = at(n), p = x.status === "picked"; return `<fieldset class="ec-theme${p ? " picked" : ""}"><legend>${p ? "Picked: " : ""}Theme ${n}</legend>
        <label class="f">Name<input type="text" name="n${n}" maxlength="40" value="${esc(x.name || "")}" placeholder="${["Ocean Glass", "Library at Night", "Cherry Blossom Rain"][n - 1]}"${locked ? " disabled" : ""}></label>
        <label class="f">Description<textarea name="d${n}" maxlength="500" rows="3" placeholder="What it looks like, and how it should feel"${locked ? " disabled" : ""}>${esc(x.description || "")}</textarea></label></fieldset>`; }).join("")}
      <p class="mini" id="ecMsg" aria-live="polite" style="margin:0"></p>
    </div><div class="sheet-foot"><button type="button" class="btn" data-act="plan-open">Back</button><span class="spacer"></span>${locked ? `<button type="button" class="btn primary" data-act="close">Done</button>` : `<button type="submit" class="btn primary" id="ecSave">Save</button>`}</div></form>`);
    const f = $("#earlyThemes"); if (!f || locked) return;
    f.addEventListener("submit", async e => {
      e.preventDefault();
      const msg = $("#ecMsg"), go = $("#ecSave"); go.disabled = true; msg.textContent = "Saving…";
      // Check every suggestion first, then send only what changed since the last save
      const saved = n => (((mine() || {}).themes || []).find(x => x.slot === n)) || {};
      const rows = [1, 2, 3].map(n => ({n, name: f.elements["n" + n].value.trim(), desc: f.elements["d" + n].value.trim()}));
      const bad = rows.find(r => r.name && !r.desc);
      if (bad) { go.disabled = false; msg.textContent = `Add a short description for theme ${bad.n}.`; return; }
      try {
        for (const r of rows) {
          const x = saved(r.n);
          if (r.name === (x.name || "") && (r.desc === (x.description || "") || !r.name)) continue;
          const {error} = await sb.rpc("founder_theme_save", {p_slot: r.n, p_name: r.name, p_description: r.desc});
          if (error) throw error;
        }
      } catch (err) { go.disabled = false; msg.textContent = errText(err) || "Couldn't save. Check your connection and try again."; load(true); return; }
      await load(true);
      toast("Your theme suggestions are saved. Thank you!");
      if (dlg.open && dlg.querySelector("#earlyThemes")) dlg.close();
    });
  }

  /* A one-time hello when someone gets a place */
  function welcome(){
    const d = mine(), uid = uidNow();
    if (!d || !uid || typeof qodPop !== "function") return;
    const seen = read(K_SEEN) || {}, key = uid + ":" + (d.founder ? "founder" : "early");
    if (seen[key]) return;
    seen[key] = Date.now(); if (d.founder) seen[uid + ":early"] = Date.now(); write(K_SEEN, seen);
    const f = !!d.founder;
    setTimeout(() => qodPop(`<div class="qod-eyebrow">${f ? "Founder" : "Early Supporter"}</div><div style="display:flex;justify-content:center;margin:4px 0 8px">${f ? ROSETTE(56) : SEEDLING(52)}</div>
      <h2 id="qodT">${f ? `You're Founder #${esc(d.founderNumber || "")}!` : `You're Early Supporter #${esc(d.number || "")}!`}</h2>
      <p class="qod-q" style="font-size:1.02rem">${f ? "You're one of the first 10 people to back Studyboard on a longer plan." : "You're one of Studyboard's first 100 Pro members."}</p>
      <p class="mini">${f ? "A Founder badge for your groups, a theme you get to suggest (and keep), and" : "An Early Supporter badge for your groups, and"} ${(d.codes || []).length ? `${(d.codes || []).length} month${(d.codes || []).length === 1 ? "" : "s"} of Pro to give friends.` : "our thanks."} It's all in Settings, Studyboard Pro.</p>
      <div class="qod-foot"><button type="button" class="btn" data-qod-close data-act="plan-open">See It All</button><button type="button" class="btn primary" data-qod-close data-act="early-badge-on">Show My Badge</button></div>`, "reward"), 900);
  }

  async function copy(code){
    try { await navigator.clipboard.writeText(code); toast("Code copied. Send it to a friend!"); }
    catch (e) { toast(code); }
  }
  hook("act", (act, el, id) => {
    switch (act) {
      case "early-copy": copy(id); return true;
      case "early-share": navigator.share({title: "A month of Studyboard Pro", text: `Here's a month of Studyboard Pro on me. In Studyboard, open Settings, Studyboard Pro, Redeem a Code, and type ${id}`}).catch(() => {}); return true;
      case "early-themes": themesSheet(); return true;
      case "early-badge-on": if (!S().badge) { state.settings = Object.assign({}, state.settings, {badge: true}); saveSettings(); fire("pro-badge", true); } toast("Your badge shows in your groups."); return true;
    }
    return false;
  });
  let lastUid;
  hook("render", () => { const u = uidNow(); if (u !== lastUid) { lastUid = u; load(true); } });
  hook("plan-changed", () => load(false));
  hook("boot", () => {
    load(true);
    setInterval(() => load(false), 6 * 3600000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) load(false); });
  });

  const css = document.createElement("style");
  css.textContent = `
.early-card{display:grid;gap:12px;border-radius:4px 14px 14px 14px;padding:14px;border:1px solid var(--line);background:var(--surface)}
.early-card.founder{background:linear-gradient(135deg,color-mix(in srgb,#F5B82E 16%,var(--surface)),color-mix(in srgb,#8B5CF6 12%,var(--surface)));border-color:color-mix(in srgb,#C9971E 40%,var(--line))}
.early-card.early{background:color-mix(in srgb,#1FA58F 10%,var(--surface));border-color:color-mix(in srgb,#1FA58F 35%,var(--line))}
.ec-top{display:flex;gap:12px;align-items:center}
.ec-top>div{display:grid;gap:2px}
.ec-top b{font:600 1.1rem var(--display)}
.ec-row{display:flex;gap:12px;align-items:center;justify-content:space-between}
.ec-row>span{display:grid;gap:2px}
.ec-sec{display:grid;gap:6px;justify-items:start}
.ec-codes{list-style:none;margin:0;padding:0;display:grid;gap:6px;width:100%}
.ec-codes li{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.ec-codes code{font:600 .95rem ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em;background:var(--soft);border-radius:6px;padding:3px 8px;flex:1;min-width:0}
.early-offer{display:flex;gap:12px;align-items:flex-start;border-radius:12px;padding:12px 14px;margin:0;background:linear-gradient(135deg,color-mix(in srgb,#F5B82E 14%,var(--surface)),color-mix(in srgb,#8B5CF6 10%,var(--surface)));border:1px solid color-mix(in srgb,#C9971E 35%,var(--line))}
.early-offer svg{flex:none}
.early-offer>div{display:grid;gap:4px;font-size:.92rem;line-height:1.4}
.ec-theme{border:1px solid var(--line);border-radius:10px;padding:8px 12px 10px;margin:0;display:grid;gap:8px}
.ec-theme legend{font-weight:700;padding:0 4px}
.ec-theme.picked{border-color:#C9971E;background:color-mix(in srgb,#F5B82E 10%,var(--surface))}
`;
  document.head.appendChild(css);

  SBEARLY = {kind, keeps, status, mine, sheetHtml, themesSheet, refresh: () => load(true)};
  window.SBEARLY = SBEARLY;
})();
