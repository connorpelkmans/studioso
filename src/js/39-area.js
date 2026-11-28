/* ===== module: 39-area.js ===== */
/* Area of study */
var SBAREA = (() => {
  const T = (...a) => a;
  const AREAS = [
    {id: "stem", name: "Science and Math", blurb: "Biology, Chemistry, Physics, Math", skin: "biology", ctx: "science and math", ex: "chem lab report fri 5pm worth 8%", types: T("Lab", "Assignment", "Exam", "Quiz", "Reading", "Study", "Project", "Other"), hrs: {Lab: 4.5, Assignment: 3.5, Exam: 9}},
    {id: "eng", name: "Engineering", blurb: "Mechanical, Electrical, Civil, Chemical", skin: "engineering", ctx: "engineering", ex: "statics problem set 4 thu 11pm", types: T("Assignment", "Lab", "Project", "Exam", "Quiz", "Study", "Reading", "Other"), hrs: {Assignment: 4, Lab: 4.5, Project: 12, Exam: 9}},
    {id: "cs", name: "Computer Science", blurb: "Programming, Data, Software", skin: "compsci", ctx: "computer science", ex: "cs project milestone mon 11pm", types: T("Project", "Assignment", "Lab", "Exam", "Quiz", "Reading", "Study", "Other"), hrs: {Project: 12, Assignment: 4, Lab: 3}},
    {id: "health", name: "Nursing and Health", blurb: "Nursing, Pre-Med, Pharmacy, Therapy", skin: "nursing", ctx: "nursing or health sciences", ex: "pharm exam thu 9am worth 20%", types: T("Exam", "Quiz", "Study", "Assignment", "Lab", "Reading", "Project", "Other"), hrs: {Exam: 10, Quiz: 2.5, Study: 1.5}},
    {id: "business", name: "Business and Economics", blurb: "Finance, Marketing, Accounting", skin: "business", ctx: "business and economics", ex: "marketing case study due wed 5pm", types: T("Assignment", "Project", "Exam", "Quiz", "Reading", "Study", "Lab", "Other"), hrs: {Project: 11, Reading: 1.5}},
    {id: "social", name: "Psychology and Social Sciences", blurb: "Psychology, Sociology, Politics", skin: "psych", ctx: "psychology and social sciences", ex: "psych paper draft fri 11:59pm", types: T("Reading", "Assignment", "Exam", "Quiz", "Project", "Study", "Lab", "Other"), hrs: {Reading: 2.5, Assignment: 4}},
    {id: "humanities", name: "Humanities and Writing", blurb: "Literature, History, Philosophy", skin: "writing", ctx: "humanities, languages and writing", ex: "read ch 4 and essay outline tue", types: T("Reading", "Assignment", "Project", "Exam", "Quiz", "Study", "Lab", "Other"), hrs: {Reading: 3, Assignment: 5, Project: 12}},
    {id: "arts", name: "Arts and Design", blurb: "Studio, Music, Film, Architecture", skin: "concert", ctx: "arts and design", ex: "portfolio piece critique mon 2pm", types: T("Project", "Assignment", "Reading", "Exam", "Quiz", "Lab", "Study", "Other"), hrs: {Project: 12, Assignment: 4.5}},
    {id: "education", name: "Education", blurb: "Teaching, Early Childhood, Counselling", skin: "education", ctx: "education", ex: "lesson plan due thu 4pm", types: T("Assignment", "Project", "Reading", "Exam", "Quiz", "Study", "Lab", "Other"), hrs: {Assignment: 4, Project: 10}},
    {id: "law", name: "Law and Public Policy", blurb: "Law, Criminal Justice, Government", skin: "justice", ctx: "law and public policy", ex: "contracts brief due mon 9am", types: T("Reading", "Assignment", "Exam", "Project", "Quiz", "Study", "Lab", "Other"), hrs: {Reading: 3, Exam: 10, Assignment: 5}},
    {id: "other", name: "Something Else", blurb: "Undecided, or a Mix of Fields", skin: "", ctx: "", ex: "", types: null, hrs: {}}
  ];
  const BASE = {}; let based = false;
  const get = () => { const a = state.settings && state.settings.area; return a && AREAS.some(x => x.id === a.id) ? a : null; };
  // A typed field the AI has tuned (area.custom) is laid over the preset in the same shape
  const def = () => {
    const a = get(), d = a ? AREAS.find(x => x.id === a.id) : null;
    return d && a.custom && a.text && a.custom.for === a.text ? Object.assign({}, d, a.custom, {hrs: Object.assign({}, d.hrs, a.custom.hrs)}) : d;
  };
  const label = () => { const a = get(), d = def(); if (!d) return ""; return a.text ? a.text : d.id === "other" ? "" : d.name; };
  function applyDefaults(){
    try {
      if (typeof TYPE_DEFAULTS === "undefined") return;
      if (!based) { Object.keys(TYPE_DEFAULTS).forEach(k => { BASE[k] = TYPE_DEFAULTS[k].h; }); based = true; }
      Object.keys(BASE).forEach(k => { TYPE_DEFAULTS[k].h = BASE[k]; });
      const d = def(); if (d) Object.entries(d.hrs || {}).forEach(([k, h]) => { if (TYPE_DEFAULTS[k]) TYPE_DEFAULTS[k].h = h; });
    } catch (e) { console.warn("area defaults", e); }
  }
  const FIELD_SKINS = ["business", "nursing", "psych", "biology", "compsci", "engineering", "education", "comms", "civics", "justice", "writing", "concert", "track", "math", "chem", "observatory", "ruins", "valley", "sketchcity"].filter(id => SKINS.some(s => s.id === id));
  const AREA_SCHEMA = {type: "OBJECT", properties: {
    ctx: {type: "STRING", description: "The field in a few lowercase words, as in 'marine biology', for a sentence like 'The student is studying ...'"},
    ex: {type: "STRING", description: "One realistic quick-add example task for a student in this field, like 'chem lab report fri 5pm worth 8%'. Lowercase, under 60 characters, with a short day and optional time or weight"},
    types: {type: "ARRAY", items: {type: "STRING", enum: ["Assignment", "Exam", "Quiz", "Reading", "Project", "Lab", "Study", "Other"]}, description: "All eight task types, the ones this field uses most first"},
    hours: {type: "OBJECT", properties: {Assignment: {type: "NUMBER"}, Project: {type: "NUMBER"}, Lab: {type: "NUMBER"}, Reading: {type: "NUMBER"}, Exam: {type: "NUMBER"}, Quiz: {type: "NUMBER"}, Study: {type: "NUMBER"}}, description: "Typical hours a student in this field spends on one task of each type"},
    skin: {type: "STRING", enum: FIELD_SKINS.concat(["none"]), description: "The theme that fits the field best, or none when none really does"}}, required: ["ctx", "ex", "types", "hours", "skin"]};
  // The same tuning each preset field has
  const cleanTuned = (r, text) => {
    if (!r || typeof r !== "object") return null;
    const all = typeof TYPES !== "undefined" ? TYPES : [], seen = new Set(), tys = [];
    (Array.isArray(r.types) ? r.types : []).forEach(t => { if (all.includes(t) && !seen.has(t)) { seen.add(t); tys.push(t); } });
    if (tys.length < 3) return null;
    all.forEach(t => { if (!seen.has(t)) tys.push(t); });
    const hrs = {}; Object.entries(r.hours || {}).forEach(([k, v]) => { const h = Number(v); if (all.includes(k) && h >= 0.5 && h <= 24) hrs[k] = Math.round(h * 2) / 2; });
    const line = x => String(x || "").replace(/[^\w\s,&'’.%:\-\/]/g, "").replace(/\s+/g, " ").trim();
    return {for: text, ctx: line(r.ctx).slice(0, 60), ex: line(r.ex).slice(0, 70), types: tys, hrs, skin: FIELD_SKINS.includes(r.skin) ? r.skin : ""};
  };
  let tuning = "";
  async function tune(text){
    if (!text || tuning === text) return;
    const a = get(); if (!a || (a.custom && a.custom.for === text)) return;
    let ok = false; try { ok = aiReady(); } catch (e) {}
    if (!ok) return;
    tuning = text;
    try {
      const r = await aiCall({task: "classify", fast: true, maxTokens: 900, temperature: 0.3, schema: AREA_SCHEMA, parts: [{text: `Field of study typed by the student: "${text.replace(/"/g, "'")}"`}],
        system: "You set up a student planner for the field the student typed. Pick the task types that field uses most, a realistic example task, typical hours per task type (a lab report or a case brief takes hours, a quiz less), and the closest matching theme. Use only what the field plainly implies. Return JSON only."});
      const c = cleanTuned(r.data, text), cur = get();
      if (c && cur && cur.text === text) {
        state.settings = Object.assign({}, state.settings, {area: Object.assign({}, cur, {custom: c})});
        saveSettings(); applyDefaults(); applied = key(); try { scheduleRender(); } catch (e) {}
        toast(`Studyboard is set up for ${text}`);
      }
    } catch (e) { }
    tuning = "";
  }
  function set(id, text){
    const d = AREAS.find(x => x.id === id), t = String(text || "").replace(/\s+/g, " ").trim().slice(0, 60), old = get();
    state.settings = Object.assign({}, state.settings, {area: d ? Object.assign({id, text: t}, old && old.id === id && old.text === t && old.custom ? {custom: old.custom} : {}) : null});
    saveSettings(); applyDefaults(); applied = key(); try { scheduleRender(); } catch (e) {}
    if (d && t) tune(t);
  }
  const types = () => { const d = def(); return d && d.types ? d.types.slice() : (typeof TYPES !== "undefined" ? TYPES.slice() : []); };
  const example = () => { const d = def(); return d && d.ex ? d.ex : ""; };
  // One line for AI prompts; "" when the student hasn't said
  const aiLine = () => { const d = def(); if (!d) return ""; const t = (get().text || "").replace(/[^\w\s,&'’.\-]/g, "").trim(); return t ? `The student studies ${t}${d.ctx ? " (" + d.ctx + ")" : ""}.` : d.ctx ? `The student is studying ${d.ctx}.` : ""; };
  const aiSystem = s => { const l = aiLine(); return l && typeof s === "string" && !s.includes(l) ? s + " " + l : s; };
  // Each field's icon and colour
  const IC = {
    stem: ["#16A34A", '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 18l-5-9V3"/><path d="M7.5 15h9"/>'],
    eng: ["#EA580C", '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/>'],
    cs: ["#2563EB", '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>'],
    health: ["#DC2626", '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M8.5 12h2l1-2 1.5 4 1-2h1.5"/>'],
    business: ["#0891B2", '<path d="M4 20V10M10 20V5M16 20v-7M22 20H2"/>'],
    social: ["#7C3AED", '<circle cx="9" cy="8" r="3"/><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5"/><path d="M16 5.5a3 3 0 0 1 0 5.5M18 14c2 .6 3 2.3 3 5"/>'],
    humanities: ["#B45309", '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8.5 7.5h6M8.5 11h4"/>'],
    arts: ["#DB2777", '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.5-1.2-1.8-1.2-3s.9-2 2.2-2H17a4 4 0 0 0 4-4c0-4-4-7-9-7z"/><circle cx="7.5" cy="11" r="1.1"/><circle cx="10.5" cy="7" r="1.1"/><circle cx="15" cy="7.5" r="1.1"/>'],
    education: ["#CA8A04", '<path d="M3 9.5L12 5l9 4.5-9 4.5z"/><path d="M7 11.5V16c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5v-4.5"/>'],
    law: ["#475569", '<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z"/>'],
    other: ["#4F46E5", '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>']
  };
  const icon = id => { const [c, d] = IC[id] || IC.other; return `<span class="area-ic" style="--ac:${c}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg></span>`; };
  // The fields, then Something Else across the whole width: a box to type your own field straight into (picking a field above
  // empties it; typing in it unpicks the field)
  const chips = (sel, attr, text, boxId) => `<div class="area-grid" role="radiogroup" aria-label="Area of study">${AREAS.filter(a => a.id !== "other").map(a => `<button type="button" class="area-chip${a.id === sel ? " on" : ""}" role="radio" aria-checked="${a.id === sel}" ${attr}="${a.id}">${icon(a.id)}<span class="area-t"><b>${esc(a.name)}</b><span>${esc(a.blurb)}</span></span></button>`).join("")}
    <label class="area-chip area-other${(text || "").trim() ? " on" : ""}">${icon("other")}<span class="area-t"><b>Something Else</b><input type="text" id="${boxId || "areaText"}" maxlength="60" value="${esc(text || "")}" placeholder="Type your major or program, e.g. Marine Biology" autocomplete="off" data-noenter aria-label="Something else: your major or program"></span></label></div>`;
  function sheet(){
    const a = get() || {id: "", text: ""};
    // one or the other: a field picked from the list, or your own typed in (saved as Something Else, tuned by the AI). Picking a
    // field empties the box; typing in the box unpicks the field (it used to keep both, and the picked field was ignored)
    const typed = !!(a.text || "").trim();
    openSheet(`<form class="sheet">${head("Area of Study")}<div class="sheet-body">
      <p class="mini" style="margin:0">Studyboard uses this to tailor task types, example tasks, typical hours and its AI helpers to your field. Change it any time.</p>
      ${chips(typed ? "" : a.id, "data-area", a.text || "", "areaText")}
      <p class="mini" style="margin:0">${aiReady() ? "Type your own field and the AI tunes task types, example tasks, typical hours and the theme to it, just like the fields above." : "Turn on AI Features in Settings and your own field is tuned the same way as the fields above."}</p>
      </div><div class="sheet-foot">${a.id ? `<button type="button" class="btn" data-area-clear>Clear</button>` : ""}<span class="spacer"></span><button type="button" class="btn primary" data-area-save ${a.id || a.text ? "" : "disabled"}>Save</button></div></form>`);
    let sel = typed ? "" : a.id;
    const form = dlg.querySelector("form"), box = form.querySelector("#areaText"), save = form.querySelector("[data-area-save]");
    const mark = id => form.querySelectorAll(".area-chip[data-area]").forEach(x => { const on = x.dataset.area === id; x.classList.toggle("on", on); x.setAttribute("aria-checked", String(on)); });
    form.addEventListener("input", e => {
      if (e.target.id !== "areaText") return;
      if (e.target.value.trim() && sel) { sel = ""; mark(""); }
      form.querySelector(".area-other").classList.toggle("on", !!e.target.value.trim());
      save.disabled = !sel && !e.target.value.trim();
    });
    form.addEventListener("click", e => {
      const b = e.target.closest("[data-area]");
      if (b) { sel = b.dataset.area; mark(sel); box.value = ""; form.querySelector(".area-other").classList.remove("on"); save.disabled = false; return; }
      if (e.target.closest("[data-area-clear]")) { set(null); dlg.close(); toast("Area of study cleared"); return; }
      if (e.target.closest("[data-area-save]")) { const t = box.value.trim(); set(t ? "other" : sel, t); dlg.close(); toast(`Area of study: ${label() || "Something else"}`); }
    });
  }
  hook("menu", () => `<button data-act="area-open"><span>Area of Study<span class="sub">${esc(label() || "Not set. Tell Studyboard what you study so it can suit the app to your field.")}</span></span></button>`);
  hook("act", act => { if (act !== "area-open") return false; sheet(); return true; });
  // Re-applied whenever the area changes, including from another device through sync
  let applied = null;
  const key = () => { const a = get(); return a ? a.id + "|" + (a.custom ? a.custom.for : "") : ""; };
  const sync = () => { const k = key(); if (k !== applied) { applied = k; applyDefaults(); } };
  hook("boot", sync);
  hook("render", sync);
  return {AREAS, get, def, label, set, types, example, aiLine, aiSystem, chips, sheet, applyDefaults};
})();
window.SBAREA = SBAREA;
const AREA_CSS = document.createElement("style");
AREA_CSS.textContent = `.area-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px}
.area-chip{display:flex;align-items:center;gap:11px;text-align:left;padding:10px 12px;border-radius:12px;border:1.5px solid var(--line);background:var(--surface);color:var(--ink);cursor:pointer;min-height:56px}
.area-t{display:grid;gap:2px;min-width:0;flex:1}
.area-chip b{font:700 .92rem var(--display)}.area-t > span{font-size:.78rem;color:var(--muted)}
.area-ic{flex:none;display:grid;place-items:center;width:36px;height:36px;border-radius:11px;color:var(--ac);background:color-mix(in srgb,var(--ac) 14%,var(--surface))}
.area-ic svg{width:20px;height:20px}
.area-chip.area-other{grid-column:1/-1;cursor:text}
.area-other input{width:100%;box-sizing:border-box;margin-top:4px;min-height:38px;border:1px solid var(--line);border-radius:9px;background:var(--field,var(--surface));padding:6px 10px;font:inherit;font-size:.9rem;color:var(--ink)}
.area-other input:focus{outline:2px solid color-mix(in srgb,var(--accent) 55%,transparent);outline-offset:0;border-color:var(--accent)}
.area-chip:hover{border-color:color-mix(in srgb,var(--accent) 45%,var(--line))}
.area-chip.on{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,var(--surface));box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 25%,transparent)}`;
document.head.appendChild(AREA_CSS);


