/* ===== module: 96-school.js ===== */
/* School Days: days off (holidays, reading week, snow days) and a rotating class cycle (Day 1 to 6, A/B days).
   Saved in settings.school; the rules live in SBSCHOOL (the calendar core), so the schedule, Today's Plan and the
   calendar feed all agree. */
(() => {
  const S = () => window.SBSCHOOL;
  const cfg = () => (state.settings && state.settings.school) || {};
  const WD = [1, 2, 3, 4, 5, 6, 0];
  const dayName = (d, o) => parse(d).toLocaleDateString(undefined, o || {weekday: "short", month: "short", day: "numeric"});
  const range = o => o.to && o.to !== o.from ? `${dayName(o.from)} to ${dayName(o.to)}` : dayName(o.from, {weekday: "long", month: "short", day: "numeric"});
  const cycName = (names, k) => names === "abc" ? String.fromCharCode(64 + k) + " Day" : "Day " + k;

  function save(next, msg){
    const school = {off: next.off, cycle: next.cycle};
    if (!school.off.length) delete school.off;
    if (!school.cycle) delete school.cycle;
    state.settings = Object.assign({}, state.settings, {school});
    if (!school.off && !school.cycle) { const n = Object.assign({}, state.settings); delete n.school; state.settings = n; }
    saveSettings(); scheduleRender();
    if (msg) toast(msg);
  }

  function open(focus){
    const now = S().norm(cfg()), today = todayISO();
    let off = now.off.map(o => Object.assign({}, o));
    const cy = now.cycle;
    const draft = {on: !!cy, n: cy ? cy.n : 6, names: cy ? cy.names : "num", days: cy ? cy.days.slice() : [1, 2, 3, 4, 5]};
    // the day the "Today is" answer is about: today if it's a school day, else the next one
    const refDay = () => S().nextSchool({off, cycle: {n: draft.n, ref: today, k: 1, days: draft.days}}, today);
    const curK = () => { const r = refDay(); return cy ? (S().dayOf(cfg(), r) || 1) : 1; };
    let k = Math.min(draft.n, curK());
    // days off that ended more than two weeks ago stay saved (they still set the cycle) but leave the list
    const recent = () => off.filter(o => (o.to || o.from) >= addDays(today, -14));
    const offRows = () => recent().length ? recent().map(o => `<li class="sd-off"><span><b>${esc(o.name || "Day off")}</b><span class="mini">${esc(range(o))}</span></span><button type="button" class="btn small" data-sd-rm="${esc(o.id)}" aria-label="Remove ${esc(o.name || "day off")}">Remove</button></li>`).join("")
      : `<li class="mini sd-none">None yet. Classes don't show on days off, and Today's Plan treats them as free days.</li>`;
    const isSchoolToday = () => !off.some(o => today >= o.from && today <= (o.to || o.from)) && ![0, 6].includes(parse(today).getDay());
    const refText = () => { const r = refDay(); return r === today ? "Today is" : `${parse(r).toLocaleDateString(undefined, {weekday: "long"})} (${dayName(r, {month: "short", day: "numeric"})}) is`; };
    openSheet(`<form class="sheet sd-sheet">${head("School Days")}
      <div class="sheet-body">
        <fieldset class="sd-fs"><legend>Days Off</legend>
          <ul class="sd-list" id="sdList">${offRows()}</ul>
          <div class="sd-add">
            <label class="f"><span class="lh">Name</span><input type="text" id="sdName" maxlength="60" placeholder="Thanksgiving, Reading Week, Snow Day" data-noenter></label>
            <div class="two"><label class="f"><span class="lh">From</span><input type="date" id="sdFrom" value="${esc(today)}"></label><label class="f"><span class="lh">To <span class="hint">optional</span></span><input type="date" id="sdTo"></label></div>
            <div class="row-actions"><button type="button" class="btn small" id="sdAdd">Add Day Off</button><button type="button" class="btn small" id="sdToday"${isSchoolToday() ? "" : " hidden"}>No School Today</button></div>
          </div>
        </fieldset>
        <fieldset class="sd-fs"><legend>Class Schedule</legend>
          ${seg("sdMode", [["week", "Same every week"], ["cycle", "Rotates by school day"]], draft.on ? "cycle" : "week")}
          <div class="sd-cycle" id="sdCycle"${draft.on ? "" : " hidden"}>
            <p class="mini" style="margin:0">For schedules like Day 1 to 6 or A/B days. The cycle moves one step each school day and pauses on weekends and days off.</p>
            <div class="two">
              <label class="f"><span class="lh">Days in the cycle</span><select id="sdN">${[2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => `<option value="${v}"${v === draft.n ? " selected" : ""}>${v}</option>`).join("")}</select></label>
              <label class="f"><span class="lh">Called</span><select id="sdNames"><option value="num"${draft.names === "num" ? " selected" : ""}>Day 1, Day 2…</option><option value="abc"${draft.names === "abc" ? " selected" : ""}>A Day, B Day…</option></select></label>
            </div>
            <label class="f"><span class="lh" id="sdRefL">${esc(refText())}</span><select id="sdK"></select></label>
            <div class="f"><span class="lh">School days</span><div class="meet-days" role="group" aria-label="School days" id="sdDays">${WD.map(d => `<button type="button" data-day="${d}" aria-pressed="${draft.days.includes(d)}">${DAY_SHORT[d]}</button>`).join("")}</div></div>
            <p class="mini" style="margin:0">Then in each course, pick which cycle days a class meets under Class Times.</p>
          </div>
        </fieldset>
      </div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>Save</button></div>
    </form>`, fd => {
      const on = fd.get("sdMode") === "cycle";
      if (on && !draft.days.length) { toast("Pick at least one school day"); return false; }
      const cycle = on ? {n: draft.n, ref: refDay(), k: Math.min(draft.n, k), days: draft.days.slice().sort(), names: draft.names} : null;
      save({off, cycle}, "School days saved");
    });
    const f = dlg.querySelector(".sd-sheet"), $f = q => f.querySelector(q);
    const drawK = () => { const sel = $f("#sdK"); k = Math.min(k, draft.n); sel.innerHTML = Array.from({length: draft.n}, (_, i) => `<option value="${i + 1}"${i + 1 === k ? " selected" : ""}>${esc(cycName(draft.names, i + 1))}</option>`).join(""); $f("#sdRefL").textContent = refText(); };
    const drawOff = () => { $f("#sdList").innerHTML = offRows(); $f("#sdToday").hidden = !isSchoolToday(); $f("#sdRefL").textContent = refText(); };
    drawK();
    f.addEventListener("change", e => {
      if (e.target.name === "sdMode") $f("#sdCycle").hidden = e.target.value !== "cycle";
      if (e.target.id === "sdN") { draft.n = Number(e.target.value); drawK(); }
      if (e.target.id === "sdNames") { draft.names = e.target.value; drawK(); }
      if (e.target.id === "sdK") k = Number(e.target.value);
    });
    f.addEventListener("click", e => {
      const db = e.target.closest("#sdDays [data-day]");
      if (db) { const d = Number(db.dataset.day), i = draft.days.indexOf(d); if (i >= 0) draft.days.splice(i, 1); else draft.days.push(d); db.setAttribute("aria-pressed", String(i < 0)); $f("#sdRefL").textContent = refText(); return; }
      const rm = e.target.closest("[data-sd-rm]");
      if (rm) { off = off.filter(o => o.id !== rm.dataset.sdRm); drawOff(); return; }
      if (e.target.closest("#sdAdd")) {
        const from = $f("#sdFrom").value, to = $f("#sdTo").value, name = $f("#sdName").value.trim();
        if (!isDate(from)) { toast("Pick the first day off"); return; }
        if (to && to < from) { toast("The last day off can't be before the first"); return; }
        off.push({id: uid(), name: name || "Day off", from, to: to && to !== from ? to : from});
        off.sort((a, b) => a.from < b.from ? -1 : 1);
        $f("#sdName").value = ""; $f("#sdTo").value = ""; drawOff(); return;
      }
      if (e.target.closest("#sdToday")) { off.push({id: uid(), name: "No school", from: today, to: today}); off.sort((a, b) => a.from < b.from ? -1 : 1); drawOff(); }
    });
    if (focus === "cycle") { const r = f.querySelector('input[name="sdMode"][value="cycle"]'); if (r) { r.checked = true; $f("#sdCycle").hidden = false; } }
  }

  hook("act", (a) => {
    if (a !== "school-open" && a !== "school-cycle") return false;
    if (dlg.open) dlg.close();
    setTimeout(() => open(a === "school-cycle" ? "cycle" : ""), 30);
    return true;
  });
  hook("menu", () => `<button data-act="school-open" data-group="school"><span>School Days<span class="sub">Holidays, reading week and snow days, and a rotating schedule (Day 1 to 6, A/B days)</span></span></button>`);
  window.SBSCHOOLUI = {open};
})();
