// Public flashcards and quizzes: studyboardapp.com/flashcards and /quizzes (supabase-sharing.sql, "Public flashcards and quizzes").
// Rendered here on the server as plain HTML, so search engines read every card and question (like Quizlet's set pages), with:
//   - one page per published deck or quiz at /flashcards/<name>-<code> and /quizzes/<name>-<code> (old names redirect to the current one)
//   - a page per course code (/flashcards/course/biol-201: "BIOL 201 Flashcards"), the strongest pages for searches like "biol 201 flashcards"
//   - an index with search (/flashcards?q=...; result pages are noindex, the index and course pages are indexed)
//   - schema.org Quiz / Question markup (Google's flashcard and practice-question formats), canonical links, Open Graph tags
//   - /sitemap-public.xml listing everything, linked from robots.txt
// Pages are cached at Cloudflare's edge (set pages 15 minutes, lists up to an hour, search results five minutes; the app clears them on publish), so most visits never reach Supabase.
// Only published, not hidden items are ever read; nothing about the person but their display name.

import {ICONS, GUESS, GENERAL, COLORS} from "./course-icons.js";

const SITE = "Studyboard";
const KINDS = {
  flashcards: {kind: "deck", noun: "Flashcards", one: "flashcard set", many: "flashcard sets", unit: "term", appParam: "deck"},
  quizzes: {kind: "quiz", noun: "Quizzes", one: "quiz", many: "quizzes", unit: "question", appParam: "shared"}
};
const PER_PAGE = 30;

/* ---------- small helpers ---------- */
export const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"})[c]);
export function slugify(s){
  const x = String(s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70).replace(/-+$/, "");
  return x || "set";
}
export const codeOf = s => { const x = String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); return x.length === 8 ? x.slice(0, 4) + "-" + x.slice(4) : ""; };
export const urlCode = code => String(code || "").replace(/-/g, "").toLowerCase();
export const itemPath = (section, name, code) => `/${section}/${slugify(name)}-${urlCode(code)}`;
export const courseKey = s => {
  const m = String(s || "").match(/([A-Za-z]{2,8})[\s._-]*([0-9]{2,5}[A-Za-z]{0,2})/);
  if (m && !/^(grade|gr|year|yr|unit|week|wk|chapter|ch|lab|room|page|part|lesson|term|sem|class|period)$/i.test(m[1])) return (m[1] + m[2]).toUpperCase();   // (Grade 12 isn't a code)
  const h = String(s || "").match(/\b([A-Za-z]{3})[\s-]?([1-4])([A-Za-z][A-Za-z0-9]?)\b/);   // high school codes like Ontario's SBI4U
  return h ? (h[1] + h[2] + h[3]).toUpperCase() : "";
};
export const courseSlug = key => { const m = String(key || "").match(/^([A-Z]+)([0-9].*)$/); return m ? (m[1] + "-" + m[2]).toLowerCase() : String(key || "").toLowerCase(); };
export const courseLabelOf = key => { const m = String(key || "").match(/^([A-Z]+)([0-9].*)$/); return m ? m[1] + " " + m[2] : key; };
const clip = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s; };
const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + "s"}`;
const jsonLd = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")}</script>`;
const monthYear = t => { const d = new Date(t); return isNaN(d) ? "" : d.toLocaleDateString("en-US", {month: "long", year: "numeric", timeZone: "UTC"}); };
const isoDate = t => { const d = new Date(t); return isNaN(d) ? "" : d.toISOString().slice(0, 10); };

/* ---------- reading from Supabase (published items only) ---------- */
export async function rpc(env, fn, args){
  const base = String(env.SUPABASE_URL || "").replace(/\/+$/, ""), key = env.SUPABASE_ANON_KEY || "";
  if (!base || !key) throw Object.assign(new Error("not configured"), {status: 503});
  const r = await (env.__fetch || fetch)(`${base}/rest/v1/rpc/${fn}`, {method: "POST", headers: {apikey: key, "content-type": "application/json", accept: "application/json"}, body: JSON.stringify(args || {})});
  if (!r.ok) throw Object.assign(new Error("supabase " + r.status), {status: r.status === 404 ? 503 : 502});
  return r.json();
}

/* ---------- page shell ---------- */
function page({title, description, canonical, robots, body, ld, ogType}){
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ""}
<meta name="robots" content="${robots || "index,follow,max-image-preview:large"}">
<meta property="og:site_name" content="${SITE}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="${ogType || "website"}">
${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ""}
<meta name="twitter:card" content="summary">
<link rel="icon" type="image/png" href="/website/assets/icon-192.png">
<link rel="apple-touch-icon" href="/website/assets/apple-touch-icon.png">
<link rel="stylesheet" href="/website/assets/fonts.css">
<link rel="stylesheet" href="/website/assets/site.css">
<link rel="stylesheet" href="/website/assets/public.css">
${(ld || []).map(jsonLd).join("\n")}
</head>
<body class="pub">
<a class="skip" href="#main">Skip to the content</a>
<header class="top">
  <div class="wrap">
    <a class="brand" href="/website/" aria-label="Studyboard home"><img class="logo-l" src="/website/assets/logo-light.webp" alt="" width="136" height="30"><img class="logo-d" src="/website/assets/logo-dark.webp" alt="" width="136" height="30"></a>
    <nav class="main" aria-label="Main">
      <a href="/flashcards">Flashcards</a>
      <a href="/quizzes">Quizzes</a>
      <a href="/" class="navbtn">Open Studyboard</a>
    </nav>
  </div>
</header>
<main id="main" class="wrap pub-main">
${body}
</main>
<footer class="pub-foot"><div class="wrap">
  <p>Flashcards and quizzes on this page were made and shared by students using <a href="/website/">Studyboard</a>, the free student planner with spaced-repetition flashcards.</p>
  <p><a href="/flashcards">All flashcards</a> · <a href="/quizzes">All quizzes</a> · <a href="/website/privacy.html">Privacy</a> · <a href="/website/terms.html">Terms</a></p>
</div></footer>
<script src="/website/assets/public.js" defer></script>
</body>
</html>`;
}
const searchForm = (section, q, course) => `<form class="pub-search" action="/${section}" method="get" role="search">
  <label class="sr" for="pubQ">Search ${esc(KINDS[section].noun.toLowerCase())}</label>
  <input id="pubQ" type="search" name="q" value="${esc(q || "")}" placeholder="Search ${section === "quizzes" ? "quizzes" : "flashcards"} by topic or course code, like BIOL 201" maxlength="120" autocomplete="off">
  ${course ? `<input type="hidden" name="course" value="${esc(course)}">` : ""}
  <button class="btn primary" type="submit">Search</button></form>`;
const crumbs = (list, base) => `<nav class="pub-crumbs" aria-label="Breadcrumb"><ol>${list.map((c, i) => `<li>${i < list.length - 1 ? `<a href="${esc(c[1])}">${esc(c[0])}</a>` : `<span aria-current="page">${esc(c[0])}</span>`}</li>`).join("")}</ol></nav>`;
const crumbLd = (list, base) => ({"@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: list.map((c, i) => ({"@type": "ListItem", position: i + 1, name: c[0], item: base + c[1]}))});
// A deck tile drawn like the app's Flashcards screen: a little stack of lined index cards with the course's band, icon and card count.
// The course colour is a class (pc0, pc1...), since the pages allow no inline styles. Same course, same colour on every page.
const GENERAL_COLOR = COLORS.indexOf("#5E6B7E");
const svgOf = k => `<svg class="ci-svg" viewBox="${ICONS[k][0]}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k][1]}</svg>`;
export function deckLook(r){
  const label = String(r.course_label || "").trim();
  // the colour and icon the maker picked when publishing (only the app's own colours and icons)
  const lk = r.look && typeof r.look === "object" ? r.look : null, ci = lk ? COLORS.indexOf(String(lk.color || "").toUpperCase()) : -1;
  if (ci >= 0 && (lk.icon === "general" || Object.prototype.hasOwnProperty.call(ICONS, lk.icon))) return {label: label || "General", color: ci, icon: lk.icon === "general" ? GENERAL : svgOf(lk.icon)};
  if (!label) return {label: "General", color: GENERAL_COLOR, icon: GENERAL};
  const key = String(r.course_key || label).toUpperCase().replace(/[^A-Z0-9]/g, "");
  let h = 0; for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const t = (label + " " + (r.course_name || "") + " " + (r.name || "")).toLowerCase(), hit = GUESS.find(g => g[0].test(t)), k = ICONS[hit ? hit[1] : "note"] ? (hit ? hit[1] : "note") : null;
  const icon = k ? svgOf(k) : GENERAL;
  return {label, color: h % COLORS.length, icon};
}
function deckGrid(section, rows){
  const K = KINDS[section];
  return `<ul class="pdecks">${rows.map(r => { const L = deckLook(r), n = Number(r.n) || 0;
    const meta = [r.school_name, r.sharer_name ? "by " + r.sharer_name : "", r.saves ? plural(Number(r.saves), "save") : ""].filter(Boolean).map(esc).join(" · ");
    return `<li><a class="pdeck pc${L.color}" href="${esc(itemPath(section, r.name, r.code))}">
    <span class="pdeck-lay l3" aria-hidden="true"></span><span class="pdeck-lay l2" aria-hidden="true"></span>
    <span class="pdeck-face"><span class="pdeck-band"><span class="pdeck-ic" aria-hidden="true">${L.icon}</span><span class="pdeck-kick">${esc(L.label)}</span><span class="pdeck-n">${n}<span class="sr"> ${esc(n === 1 ? K.unit : K.unit + "s")}</span></span></span>
    <span class="pdeck-body"><b class="pdeck-name">${esc(r.name)}</b>${meta ? `<span class="pdeck-meta">${meta}</span>` : ""}${r.preview ? `<span class="pdeck-prev">${esc(clip(r.preview, 110))}</span>` : ""}</span></span></a></li>`; }).join("")}</ul>`;
}
function listHtml(section, rows){
  const K = KINDS[section];
  if (!rows.length) return "";
  if (section === "flashcards") return deckGrid(section, rows);
  return `<ul class="pub-list">${rows.map(r => `<li><a class="pub-item" href="${esc(itemPath(section, r.name, r.code))}">
    <b>${esc(r.name)}</b>
    <span class="pub-meta">${esc(plural(Number(r.n) || 0, K.unit))}${r.course_label ? ` · ${esc(r.course_label)}` : ""}${r.school_name ? ` · ${esc(r.school_name)}` : ""}${r.sharer_name ? ` · by ${esc(r.sharer_name)}` : ""}${r.saves ? ` · ${esc(plural(Number(r.saves), "save"))}` : ""}</span>
    ${r.preview ? `<span class="pub-prev">${esc(clip(r.preview, 140))}</span>` : ""}</a></li>`).join("")}</ul>`;
}
const pager = (section, base, pageNo, more) => (pageNo > 1 || more) ? `<nav class="pub-pager" aria-label="Pages">${pageNo > 1 ? `<a class="btn" rel="prev" href="${esc(base + (pageNo === 2 ? "" : (base.includes("?") ? "&" : "?") + "page=" + (pageNo - 1)))}">Previous</a>` : "<span></span>"}<span>Page ${pageNo}</span>${more ? `<a class="btn" rel="next" href="${esc(base + (base.includes("?") ? "&" : "?") + "page=" + (pageNo + 1))}">Next</a>` : "<span></span>"}</nav>` : "";
const cta = section => `<aside class="pub-cta"><div><b>Make your own ${section === "quizzes" ? "practice quizzes" : "flashcards"}, free</b><span>Studyboard plans your semester and brings each card back just before you'd forget it. Works in any browser, no download needed.</span></div><a class="btn primary" href="/">Open Studyboard</a></aside>`;

/* ---------- the pages ---------- */
async function indexPage(env, section, url, origin){
  const K = KINDS[section], q = (url.searchParams.get("q") || "").trim().slice(0, 120), courseIn = url.searchParams.get("course") || "";
  const pageNo = Math.max(1, Math.min(100, parseInt(url.searchParams.get("page") || "1", 10) || 1));
  // a search that is just a course code goes to that course's page
  const ck = courseKey(q);
  if (q && ck && q.replace(/[\s._-]/g, "").toUpperCase() === ck && !courseIn) return Response.redirect(`${origin}/${section}/course/${courseSlug(ck)}`, 302);
  const [rows, courses] = await Promise.all([
    rpc(env, "public_search", {p_kind: K.kind, p_q: q, p_course: courseIn, p_limit: PER_PAGE + 1, p_offset: (pageNo - 1) * PER_PAGE}),
    q || pageNo > 1 ? Promise.resolve([]) : rpc(env, "public_courses", {p_kind: K.kind, p_limit: 40})]);
  const more = rows.length > PER_PAGE, list = rows.slice(0, PER_PAGE);
  const title = q ? `“${q}” ${K.noun} | ${SITE}` : `${K.noun} Made by Students: Search ${K.noun} by Course | ${SITE}`;
  const description = q ? `${K.noun} about ${q}, made by students on Studyboard.` : `Search free ${K.many} made by students, by topic or course code. Study them online or add them to Studyboard with spaced repetition.`;
  const base = `/${section}` + (q ? `?q=${encodeURIComponent(q)}` : "");
  const body = `<div class="pub-hero"><h1>${q ? `${esc(K.noun)} for “${esc(q)}”` : `${esc(K.noun)} made by students`}</h1>
    <p class="lede">${q ? `${list.length ? "" : "Nothing matches that yet. Try a course code or fewer words."}` : `Free ${esc(K.many)} for your courses, shared by students on Studyboard. Search by topic or course code.`}</p>
    ${searchForm(section, q)}</div>
    ${courses.length ? `<section class="pub-sec"><h2>Popular courses</h2><ul class="pub-chips">${courses.map(c => `<li><a href="/${section}/course/${esc(courseSlug(c.course_key))}">${esc(c.course_label || courseLabelOf(c.course_key))} <span>${esc(c.n)}</span></a></li>`).join("")}</ul></section>` : ""}
    <section class="pub-sec"><h2>${q ? "Results" : "Newest " + esc(K.many)}</h2>${listHtml(section, list) || `<p class="pub-none">No ${esc(K.many)} here yet. Share one from Studyboard: open it, tap Share, then Publish.</p>`}${pager(section, base, pageNo, more)}</section>
    ${cta(section)}`;
  const ld = q ? [] : [{"@context": "https://schema.org", "@type": "WebSite", name: SITE, url: origin + "/", potentialAction: {"@type": "SearchAction", target: `${origin}/${section}?q={search_term_string}`, "query-input": "required name=search_term_string"}}];
  return {html: page({title, description, canonical: q ? "" : `${origin}/${section}${pageNo > 1 ? "?page=" + pageNo : ""}`, robots: q ? "noindex,follow" : "", body, ld}), ttl: q ? 300 : 1800};
}

async function coursePage(env, section, slug, url, origin){
  const K = KINDS[section], key = courseKey(slug.replace(/-/g, " "));
  if (!key) return null;
  if (courseSlug(key) !== slug) return Response.redirect(`${origin}/${section}/course/${courseSlug(key)}`, 301);
  const pageNo = Math.max(1, Math.min(100, parseInt(url.searchParams.get("page") || "1", 10) || 1));
  const rows = await rpc(env, "public_search", {p_kind: K.kind, p_q: "", p_course: key, p_limit: PER_PAGE + 1, p_offset: (pageNo - 1) * PER_PAGE});
  if (!rows.length && pageNo === 1) return null;
  const more = rows.length > PER_PAGE, list = rows.slice(0, PER_PAGE), label = (list[0] && list[0].course_label && courseKey(list[0].course_label) === key) ? list[0].course_label : courseLabelOf(key);
  const other = section === "quizzes" ? "flashcards" : "quizzes";
  const cr = [[K.noun, `/${section}`], [label, `/${section}/course/${courseSlug(key)}`]];
  const title = `${label} ${K.noun}${section === "flashcards" ? " and Study Sets" : " and Practice Questions"} | ${SITE}`;
  const description = `${plural(list.length + (more ? 1 : 0), K.one, K.many).replace(/^\d+ /, m => more ? "Over " + (list.length) + " " : m)} for ${label}, made by students: ${clip(list.slice(0, 4).map(r => r.name).join(", "), 120)}.`;
  const body = `${crumbs(cr)}<div class="pub-hero"><h1>${esc(label)} ${esc(K.noun)}</h1>
    <p class="lede">${esc(K.many[0].toUpperCase() + K.many.slice(1))} for ${esc(label)} shared by students. Study them here or add them to Studyboard.</p>
    ${searchForm(section, "", key)}</div>
    <section class="pub-sec"><h2>${esc(plural(list.length, K.one, K.many))}${more ? "+" : ""}</h2>${listHtml(section, list)}${pager(section, `/${section}/course/${courseSlug(key)}`, pageNo, more)}</section>
    <p class="pub-also">Also see <a href="/${other}/course/${esc(courseSlug(key))}">${esc(label)} ${other}</a>.</p>
    ${cta(section)}`;
  return {html: page({title, description, canonical: `${origin}/${section}/course/${courseSlug(key)}${pageNo > 1 ? "?page=" + pageNo : ""}`, body, ld: [crumbLd(cr, origin)]}), ttl: 3600};
}

const LETTER = i => String.fromCharCode(65 + i);
function quizAnswerText(q){
  const o = Array.isArray(q.options) ? q.options : [], c = Array.isArray(q.correct) ? q.correct : [];
  if (q.type === "short") return String(q.answer || "");
  if (q.type === "order") return c.map(i => o[i]).filter(Boolean).join(" → ");
  return c.map(i => o[i] != null ? `${LETTER(i)}. ${o[i]}` : "").filter(Boolean).join("; ");
}

async function itemPage(env, section, slug, code, origin){
  const K = KINDS[section];
  const row = (await rpc(env, "public_page", {p_kind: K.kind, p_code: code}))[0];
  if (!row) return null;
  const want = itemPath(section, row.name, row.code);
  if (`/${section}/${slug ? slug + "-" : ""}${urlCode(code)}` !== want) return Response.redirect(origin + want, 301);
  const canonical = origin + want, d = row.data || {}, course = d.course && typeof d.course === "object" ? d.course : null;
  const label = row.course_label || (course && (course.code || course.name)) || "", key = row.course_key || courseKey(label);
  const cr = [[K.noun, `/${section}`]].concat(key ? [[label || courseLabelOf(key), `/${section}/course/${courseSlug(key)}`]] : []).concat([[row.name, want]]);
  const related = key ? (await rpc(env, "public_search", {p_kind: K.kind, p_q: "", p_course: key, p_limit: 9, p_offset: 0}).catch(() => [])).filter(r => r.code !== row.code).slice(0, 8) : [];
  const appLink = `/?${K.appParam}=${encodeURIComponent(row.code)}`;
  const school = row.school_name || "";
  const meta = `${esc(plural(Number(row.n) || 0, K.unit))}${label ? ` · ${esc(label)}` : ""}${school ? ` · ${esc(school)}` : ""}${row.sharer_name ? ` · Made by ${esc(row.sharer_name)}` : ""}${row.updated_at ? ` · Updated ${esc(monthYear(row.updated_at))}` : ""}`;
  let body, ld, title, description;
  if (K.kind === "deck") {
    const cards = (Array.isArray(d.cards) ? d.cards : []).filter(c => c && (c.front || c.back)).slice(0, 2000);
    title = `${row.name}${label && !row.name.toLowerCase().includes(label.toLowerCase()) ? " (" + label + ")" : ""} Flashcards | ${SITE}`;
    description = clip(`Study ${row.name}${label ? " for " + label : ""}${school ? " at " + school : ""} with ${cards.length} flashcards: ${cards.slice(0, 5).map(c => c.front).join(", ")}.`, 158);
    // Drawn like the deck page in the app: the course band with the actions, the big course icon, the name and its numbers, then the cards as lined index cards
    const L = deckLook({course_label: label, course_key: key, name: row.name, look: d.look});
    const chips = [`<b>${esc(String(cards.length))}</b> ${esc(cards.length === 1 ? K.unit : K.unit + "s")}`, school && esc(school), row.sharer_name && "by " + esc(row.sharer_name), row.updated_at && "Updated " + esc(monthYear(row.updated_at))].filter(Boolean);
    body = `${crumbs(cr)}<header class="pdh pc${L.color}"><div class="pdh-band"><span class="pdh-kick">${esc(label || "General")} · Flashcards</span></div>
      <div class="pdh-low"><span class="pdh-ring" aria-hidden="true">${L.icon}</span><div class="pdh-txt"><h1>${esc(row.name)}</h1><p class="pdh-chips">${chips.map(x => `<span>${x}</span>`).join("")}</p></div></div>
      <div class="pdh-acts"><a class="pdh-btn primary" href="#study" data-pub-study>Study Flashcards</a><a class="pdh-btn" href="${esc(appLink)}">Add to Studyboard</a></div></header>
      <section id="study" class="pub-study" hidden aria-label="Study these flashcards"><button type="button" class="pub-card" data-pub-card aria-live="polite"></button>
        <div class="pub-nav"><button type="button" class="btn" data-pub-prev>Previous</button><span data-pub-pos></span><button type="button" class="btn" data-pub-next>Next</button><button type="button" class="btn" data-pub-shuffle>Shuffle</button></div></section>
      <section class="pub-sec"><h2>Terms in this set (${cards.length})</h2>
      <ol class="pub-terms pcards">${cards.map(c => `<li data-front="${esc(c.front)}" data-back="${esc(c.back)}"><span class="t">${esc(c.front)}</span><span class="d">${esc(c.back)}</span></li>`).join("")}</ol></section>`;
    ld = [{"@context": "https://schema.org", "@type": "Quiz", name: row.name, about: {"@type": "Thing", name: label || row.name}, educationalLevel: "University",
      ...(row.sharer_name ? {author: {"@type": "Person", name: row.sharer_name, ...(school ? {affiliation: {"@type": "CollegeOrUniversity", name: school}} : {})}} : {}), ...(school ? {sourceOrganization: {"@type": "CollegeOrUniversity", name: school}} : {}), dateModified: isoDate(row.updated_at), url: canonical,
      hasPart: cards.slice(0, 500).map(c => ({"@type": "Question", eduQuestionType: "Flashcard", text: clip(c.front, 600), acceptedAnswer: {"@type": "Answer", text: clip(c.back, 1200)}}))}];
  } else {
    const qz = d.quiz && typeof d.quiz === "object" ? d.quiz : {}, qs = (Array.isArray(qz.questions) ? qz.questions : []).filter(q => q && q.stem).slice(0, 300);
    title = `${row.name}${label && !row.name.toLowerCase().includes(label.toLowerCase()) ? " (" + label + ")" : ""}: Practice Quiz | ${SITE}`;
    description = clip(`Practice quiz with ${qs.length} questions${label ? " for " + label : ""}${school ? " at " + school : ""}: ${qs.slice(0, 2).map(q => q.stem).join(" ")}`, 158);
    body = `${crumbs(cr)}<header class="pub-head"><h1>${esc(row.name)}</h1><p class="pub-meta">${meta}</p>
      <div class="pub-acts"><a class="btn primary" href="${esc(appLink)}">Take the Quiz in Studyboard</a></div></header>
      ${qz.kind === "case" && qz.scenario ? `<section class="pub-sec pub-case"><h2>Case</h2><p>${esc(qz.scenario)}</p></section>` : ""}
      <section class="pub-sec"><h2>Questions (${qs.length})</h2><ol class="pub-qs">${qs.map((q, i) => {
        const o = Array.isArray(q.options) ? q.options : [];
        return `<li class="pub-q"><p class="stem">${esc(q.stem)}</p>${o.length && q.type !== "short" ? `<ol class="opts" type="A">${o.map(x => `<li>${esc(x)}</li>`).join("")}</ol>` : ""}
          <details><summary>Show answer</summary><p class="ans"><b>${esc(quizAnswerText(q))}</b></p>${q.rationale ? `<p class="why">${esc(q.rationale)}</p>` : ""}</details></li>`; }).join("")}</ol></section>`;
    ld = [{"@context": "https://schema.org", "@type": "Quiz", name: row.name, about: {"@type": "Thing", name: label || row.name}, educationalLevel: "University",
      ...(row.sharer_name ? {author: {"@type": "Person", name: row.sharer_name, ...(school ? {affiliation: {"@type": "CollegeOrUniversity", name: school}} : {})}} : {}), ...(school ? {sourceOrganization: {"@type": "CollegeOrUniversity", name: school}} : {}), dateModified: isoDate(row.updated_at), url: canonical,
      hasPart: qs.slice(0, 300).map(q => {
        const o = Array.isArray(q.options) ? q.options : [], c = Array.isArray(q.correct) ? q.correct : [];
        if (q.type === "short" || !o.length) return {"@type": "Question", eduQuestionType: "Short answer", text: clip(q.stem, 600), acceptedAnswer: {"@type": "Answer", text: clip(quizAnswerText(q), 600)}};
        return {"@type": "Question", eduQuestionType: q.type === "multiple" ? "Checkbox" : "Multiple choice", text: clip(q.stem, 600),
          encodingFormat: "text/html",
          suggestedAnswer: o.map((x, i) => c.includes(i) ? null : {"@type": "Answer", position: i, text: clip(x, 300)}).filter(Boolean),
          acceptedAnswer: c.map(i => o[i] != null ? {"@type": "Answer", position: i, text: clip(o[i], 300), ...(q.rationale ? {answerExplanation: {"@type": "Comment", text: clip(q.rationale, 600)}} : {})} : null).filter(Boolean)};
      })}];
  }
  ld.push(crumbLd(cr, origin));
  body += `${related.length ? `<section class="pub-sec"><h2>More ${esc(label || courseLabelOf(key))} ${esc(K.noun.toLowerCase())}</h2>${listHtml(section, related)}<p><a href="/${section}/course/${esc(courseSlug(key))}">See all ${esc(label || courseLabelOf(key))} ${esc(K.noun.toLowerCase())}</a></p></section>` : ""}
    ${cta(section)}
    <p class="pub-report">Something wrong with this ${esc(K.one)}? <a href="${esc(appLink)}">Open it in Studyboard</a> and choose Report.</p>`;
  return {html: page({title, description, canonical, body, ld, ogType: "article"}), ttl: 900};
}

async function sitemap(env, origin){
  const [decks, quizzes, dc, qc] = await Promise.all([rpc(env, "public_sitemap", {p_kind: "deck", p_limit: 40000, p_offset: 0}), rpc(env, "public_sitemap", {p_kind: "quiz", p_limit: 9000, p_offset: 0}),
    rpc(env, "public_courses", {p_kind: "deck", p_limit: 500}), rpc(env, "public_courses", {p_kind: "quiz", p_limit: 500})]);
  const u = (loc, mod) => `<url><loc>${esc(origin + loc)}</loc>${mod ? `<lastmod>${esc(isoDate(mod))}</lastmod>` : ""}</url>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[u("/flashcards"), u("/quizzes"),
    ...dc.map(c => u(`/flashcards/course/${courseSlug(c.course_key)}`)), ...qc.map(c => u(`/quizzes/course/${courseSlug(c.course_key)}`)),
    ...decks.map(r => u(itemPath("flashcards", r.name, r.code), r.updated_at)), ...quizzes.map(r => u(itemPath("quizzes", r.name, r.code), r.updated_at))].join("\n")}\n</urlset>\n`;
  return xml;
}

/* ---------- the router ---------- */
const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "content-security-policy": "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  "x-content-type-options": "nosniff", "referrer-policy": "strict-origin-when-cross-origin", "x-frame-options": "DENY"
};
export const isPublicPath = p => /^\/(flashcards|quizzes)(\/|$)/.test(p) || p === "/sitemap-public.xml";

function notFound(section, origin){
  const html = page({title: `Not found | ${SITE}`, description: "This page isn't available.", robots: "noindex,follow",
    body: `<div class="pub-hero"><h1>This ${section === "quizzes" ? "quiz" : "set"} isn't available</h1><p class="lede">It may have been unpublished or removed. Try searching instead.</p>${searchForm(section || "flashcards", "")}</div>`});
  return new Response(html, {status: 404, headers: Object.assign({"cache-control": "public, max-age=60"}, HTML_HEADERS)});
}

/* The app calls this right after you publish, update, recolour or unpublish something, so its pages here show the change at once
   instead of after the hour they're cached for. It only drops cached copies in this data centre (the next visit rebuilds them from
   Supabase), so anyone may call it: the worst it can do is make a page load fresh. */
async function refresh(request, env, origin){
  const ok = new Response(null, {status: 204, headers: {"access-control-allow-origin": "*", "cache-control": "no-store"}});
  let b = null; try { b = JSON.parse((await request.text()).slice(0, 2000)); } catch (e) {}
  const code = b && codeOf(String(b.code || "").replace(/-/g, ""));
  const cache = typeof caches !== "undefined" && !env.__noCache ? caches.default : null;
  if (!code) return ok;
  const section = b.kind === "quiz" ? "quizzes" : "flashcards", key = courseKey(String(b.course || ""));
  const paths = [itemPath(section, String(b.name || "").slice(0, 200), code), `/${section}`].concat(key ? [`/${section}/course/${courseSlug(key)}`] : []);
  if (env.__refreshed) env.__refreshed.push(...paths);
  if (cache) await Promise.all(paths.map(p => cache.delete(new Request(origin + p, {method: "GET"})).catch(() => false)));
  return ok;
}
export async function handlePublic(request, env, ctx){
  const url = new URL(request.url), origin = url.origin;
  if (request.method === "POST" && url.pathname === "/flashcards/refresh") return refresh(request, env, origin);
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", {status: 405, headers: {allow: "GET, HEAD"}});
  const cache = typeof caches !== "undefined" && !env.__noCache ? caches.default : null;
  const ckey = new Request(url.toString(), {method: "GET"});
  if (cache) { const hit = await cache.match(ckey); if (hit) return hit; }
  let res;
  try {
    if (url.pathname === "/sitemap-public.xml") {
      res = new Response(await sitemap(env, origin), {headers: {"content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600"}});
    } else {
      const m = url.pathname.match(/^\/(flashcards|quizzes)(?:\/(.*?))?\/?$/);
      if (!m) return notFound("", origin);
      const section = m[1], rest = m[2] || "";
      let out = null;
      if (!rest) out = await indexPage(env, section, url, origin);
      else if (/^course\/[a-z0-9-]{2,30}$/i.test(rest)) out = await coursePage(env, section, rest.slice(7).toLowerCase(), url, origin);
      else { const im = rest.match(/^(?:([a-z0-9-]*?)-)?([a-z0-9]{8})$/i); if (im && codeOf(im[2])) out = await itemPage(env, section, (im[1] || "").toLowerCase(), codeOf(im[2]), origin); }
      if (out instanceof Response) return out;
      if (!out) return notFound(section, origin);
      res = new Response(out.html, {headers: Object.assign({"cache-control": `public, max-age=60, s-maxage=${out.ttl}, stale-while-revalidate=86400`}, HTML_HEADERS)});
    }
  } catch (e) {
    return new Response(page({title: `Back soon | ${SITE}`, description: "This page is busy right now.", robots: "noindex",
      body: `<div class="pub-hero"><h1>Back in a moment</h1><p class="lede">We couldn't load this page just now. Please try again in a minute.</p></div>`}),
      {status: 503, headers: Object.assign({"retry-after": "120", "cache-control": "no-store"}, HTML_HEADERS)});
  }
  if (cache && res.ok && ctx && ctx.waitUntil) ctx.waitUntil(cache.put(ckey, res.clone()));
  return res;
}
