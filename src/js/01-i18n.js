/* ===== module: 01-i18n.js: localization groundwork =====
   Every user-facing string in NEW code goes through tr(key, englishText, vars) (or trn for plurals).
   English is the source of truth and lives right in the call, so a missing translation is never a blank: it falls back to English.
   Other languages are plain {key: text} catalogs: SBI18N.register("es", {...}) or locales/<lang>.json (loaded on demand and cached).
   Placeholders are {name}; plurals are "one|other" pairs picked with Intl.PluralRules. tools/extract-i18n.js rebuilds locales/en.json from the code.
   Static HTML opts in with data-i18n="key" (text) and data-i18n-aria="key" (aria-label); English stays in data-i18n-en. */
const SBI18N = (() => {
  const LS = "studyboard:lang", CATS = {en: {}}, SOURCES = ["en"];
  let lang = "en", rules = null;
  const norm = l => String(l || "").toLowerCase().replace("_", "-");
  const base = l => norm(l).split("-")[0];
  const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; };
  const pick = () => {
    const saved = norm(store(LS) || "");
    if (saved && saved !== "auto") return saved;
    return norm((navigator.languages && navigator.languages[0]) || navigator.language || "en");
  };
  function setRules(){ try { rules = new Intl.PluralRules(lang); } catch (e) { rules = null; } }
  function fill(str, vars){ return vars ? String(str).replace(/\{(\w+)\}/g, (m, k) => vars[k] != null ? vars[k] : m) : String(str); }
  function lookup(key){ const c = CATS[lang] || CATS[base(lang)]; return c && c[key] != null ? c[key] : null; }
  function tr(key, en, vars){ const hit = lookup(key); return fill(hit != null ? hit : en, vars); }
  // trn(key, n, "one form|other form")
  function trn(key, n, en, vars){
    const forms = String(lookup(key) != null ? lookup(key) : en).split("|");
    const names = ["zero", "one", "two", "few", "many", "other"];
    let i = forms.length - 1;
    if (forms.length === 2) i = (rules ? rules.select(n) : (n === 1 ? "one" : "other")) === "one" ? 0 : 1;
    else if (rules) { const k = rules.select(n), at = forms.length === names.length ? names.indexOf(k) : Math.min(names.indexOf(k), forms.length - 1); if (at >= 0) i = Math.min(at, forms.length - 1); }
    return fill(forms[i], Object.assign({n: fmtN(n)}, vars || {}));
  }
  const fmtN = (n, o) => { try { return new Intl.NumberFormat(lang, o).format(n); } catch (e) { return String(n); } };
  const fmtD = (d, o) => { try { return new Intl.DateTimeFormat(lang, o || {month: "short", day: "numeric"}).format(d instanceof Date ? d : new Date(d)); } catch (e) { return String(d); } };
  function register(l, cat){ l = norm(l); CATS[l] = Object.assign(CATS[l] || {}, cat || {}); if (SOURCES.indexOf(l) < 0) SOURCES.push(l); if (l === lang || l === base(lang)) applyDom(); return CATS[l]; }
  function applyDom(root){
    const r = root || document;
    r.querySelectorAll("[data-i18n]").forEach(el => {
      if (!el.hasAttribute("data-i18n-en")) {
        const t = [...el.childNodes].reverse().find(n => n.nodeType === 3 && n.nodeValue.trim());
        el.setAttribute("data-i18n-en", t ? t.nodeValue.trim() : el.textContent.trim());
      }
      const txt = tr(el.getAttribute("data-i18n"), el.getAttribute("data-i18n-en"));
      const t = [...el.childNodes].reverse().find(n => n.nodeType === 3 && n.nodeValue.trim());
      if (t) t.nodeValue = txt; else if (!el.children.length) el.textContent = txt; else el.appendChild(document.createTextNode(txt));
    });
    r.querySelectorAll("[data-i18n-aria]").forEach(el => {
      if (!el.hasAttribute("data-i18n-aria-en")) el.setAttribute("data-i18n-aria-en", el.getAttribute("aria-label") || "");
      el.setAttribute("aria-label", tr(el.getAttribute("data-i18n-aria"), el.getAttribute("data-i18n-aria-en")));
    });
  }
  async function load(l){
    l = norm(l); const b = base(l);
    for (const x of [b, l]) {
      if (x === "en" || CATS[x] && Object.keys(CATS[x]).length) continue;
      try { const c = JSON.parse(store("studyboard:lang:" + x) || "null"); if (c && typeof c === "object") register(x, c); } catch (e) {}
      try { const r = await fetch("locales/" + x + ".json", {cache: "no-cache"}); if (r.ok) { const c = await r.json(); register(x, c); store("studyboard:lang:" + x, JSON.stringify(c)); } } catch (e) {}
    }
  }
  function use(l){
    lang = norm(l) || "en"; setRules();
    try { document.documentElement.setAttribute("lang", lang); document.documentElement.setAttribute("dir", /^(ar|he|fa|ur)/.test(base(lang)) ? "rtl" : "ltr"); } catch (e) {}
    applyDom();
    try { fire("lang", lang); } catch (e) {}
  }
  async function set(l){ store(LS, l || "auto"); const want = l && l !== "auto" ? l : pick(); await load(want); use(want); }
  const have = l => !!CATS[norm(l)] || !!CATS[base(l)];
  lang = pick(); setRules();
  // English pages stay untouched
  if (base(lang) !== "en") load(lang).then(() => { if (have(lang)) use(lang); else { lang = "en"; setRules(); } });
  return {tr, trn, fmtN, fmtD, register, applyDom, load, set, use, have, get lang(){ return lang; }, get saved(){ return store(LS) || "auto"; }, available: () => SOURCES.slice(), names: {en: "English", es: "Español"}};
})();
const tr = SBI18N.tr, trn = SBI18N.trn;
// Settings: a language picker, shown only once a second language is installed
hook("menu", () => {
  const av = SBI18N.available(); if (av.length < 2) return "";
  const cur = SBI18N.saved, items = [["auto", tr("lang.auto", "Auto")]].concat(av.map(l => [l, SBI18N.names[l] || l]));
  return `<div class="cap-row sb-wide" data-group="appearance"><span style="flex:1;font-weight:600;min-width:12rem">${esc(tr("lang.title", "Language"))}<span class="sub">${esc(tr("lang.sub", "Auto follows your device. Anything not translated yet stays in English."))}</span></span><div class="segb" role="group" aria-label="${esc(tr("lang.title", "Language"))}">${items.map(([k, l]) => `<button type="button" data-act="lang-set" data-id="${esc(k)}" aria-pressed="${cur === k}">${esc(l)}</button>`).join("")}</div></div>`;
});
// Spelling: Automatic (by where you are), or fixed to American, British or Canadian
hook("menu", () => {
  let cur = "auto"; try { cur = localStorage.getItem(SPELL.KEY) || "auto"; } catch (e) {}
  const opts = [["auto", "Automatic"], ["us", "American"], ["gb", "British"], ["ca", "Canadian"]];
  return `<div class="cap-row sb-wide" data-group="appearance"><span style="flex:1;font-weight:600;min-width:12rem">Spelling<span class="sub">Automatic follows where you are: colour and centre in Canada, the UK, Australia and more; &#99;olor and &#99;enter in the US. Your own text is never changed.</span></span><div class="segb" role="group" aria-label="Spelling">${opts.map(([k, l]) => `<button type="button" data-act="spell-set" data-id="${k}" aria-pressed="${cur === k}">${l}</button>`).join("")}</div></div>`;
});
hook("act", (act, el, id) => {
  if (act !== "spell-set") return false;
  try { if (id === "auto") localStorage.removeItem(SPELL.KEY); else localStorage.setItem(SPELL.KEY, id); } catch (e) {}
  location.reload();
  return true;
});
hook("act", (act, el, id) => {
  if (act !== "lang-set") return false;
  SBI18N.set(id).then(() => { try { render(); } catch (e) {} });
  return true;
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const isNum = v => v !== null && v !== "" && v !== undefined && !isNaN(Number(v));
const COLORS = ["#3B6FE0","#1E9E74","#E0673B","#9A4FD1","#D6386F","#1D9BB8","#C79A12","#5E6B7E"];
const TYPES = ["Assignment","Exam","Quiz","Reading","Project","Lab","Study","Other"];
const STATUSES = [["todo","To Do","#8A94A6"],["doing","In Work","#2C55D6"],["done","Complete","#1E9E74"]];
const STATUS_LABEL = {todo:"To Do", doing:"In Work", done:"Complete"};
const PRIO = {low:"Low", med:"Medium", high:"High", urgent:"Urgent"};
const PRIO_W = {urgent:40, high:25, med:10, low:0};
const SPAN = {Assignment:5, Exam:0, Quiz:0, Reading:3, Project:14, Lab:4, Study:0, Other:3};
const MILESTONE = type => type === "Exam" || type === "Quiz";
// Which fields each task type uses, and what they're called
const TYPE_CFG = {
  Assignment: {start:"Start Date", due:"Due Date", time:"Due Time", hours:"Hours Needed", prog:"Progress", checklist:"Checklist", step:"Add a step, e.g. Draft answers", link:"Submission Link", notes:"Notes", notesPh:"Instructions, page numbers…", title:"e.g. Homework 3"},
  Project:    {start:"Start Date", due:"Due Date", time:"Due Time", hours:"Hours Needed", prog:"Progress", checklist:"Milestones", step:"Add a milestone, e.g. Proposal approved", link:"Project Link", team:"Team Members", notes:"Notes", notesPh:"Scope, requirements, meeting times…", title:"e.g. Bridge design project"},
  Lab:        {start:"Lab Session", due:"Report Due", time:"Due Time", hours:"Hours Needed", prog:"Progress", checklist:"Pre-Lab Checklist", step:"Add a step, e.g. Read procedure", location:"Lab Room", link:"Instructions Link", notes:"Notes", notesPh:"Equipment, safety notes, data to collect…", title:"e.g. Lab 3: Tensile testing"},
  Reading:    {start:"Start Date", due:"Read By", hours:"Time Needed", prog:"Progress", checklist:"Sections", step:"Add a section, e.g. 4.2 Equilibrium", reading:"What to Read", notes:"Notes", notesPh:"Key ideas, questions for class…", title:"e.g. Read chapter 4"},
  Exam:       {single:true, due:"Exam Date", prep:true, prog:"Preparedness", checklist:"Study Checklist", step:"Add a topic to review, e.g. Trusses", location:"Location", notes:"What It Covers", notesPh:"Chapters, topics, allowed materials…", title:"e.g. Midterm 1"},
  Quiz:       {single:true, due:"Quiz Date", prep:true, prog:"Preparedness", checklist:"Study Checklist", step:"Add a topic to review", location:"Location", notes:"What It Covers", notesPh:"Topics, format, allowed materials…", title:"e.g. Quiz 2"},
  Study:      {start:"Study Day", due:"Finish By", hours:"Time Needed", prog:"Progress", checklist:"Study Steps", step:"Add a step, e.g. Recall the RAAS pathway", link:"Link", notes:"Notes", notesPh:"What to cover…", title:"e.g. Review cardiac drugs"},
  Other:      {start:"Start Date", due:"Due Date", time:"Due Time", hours:"Hours Needed", prog:"Progress", checklist:"Checklist", step:"Add a step", link:"Link", notes:"Notes", notesPh:"Details…", title:"e.g. Register for spring classes"}
};
const cfgOf = type => TYPE_CFG[type] || TYPE_CFG.Other;
const statusLabels = type => MILESTONE(type) ? {todo:"Not Started", doing:"Studying", done:"Taken"} : type === "Reading" ? {todo:"To Read", doing:"Reading", done:"Read"} : STATUS_LABEL;
const LS2 = "coursework:v2", LS1 = "coursework:v1", LSB = "coursework:backups";
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const REQ = '<span class="req" aria-hidden="true">*</span>';
const REQ_NOTE = '<p class="req-note"><span class="req" aria-hidden="true">*</span> Required</p>';
const FAVICON = "data:image/png;base64,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";
const CLIP = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-1px;margin-right:2px"><path d="M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"/></svg>';
const REPEAT = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-label="Repeats"><path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/></svg>';

