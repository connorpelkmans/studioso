// Studyboard desktop: your school's learning platforms (Brightspace/D2L, Canvas and Blackboard Learn).
// You sign in yourself in a normal browser window (your school's own sign-in page, with MFA if it uses it).
// Studyboard never sees your password. Each platform's sign-in is kept in its own private cookie store
// ("persist:brightspace", "persist:canvas", "persist:blackboard"), separate from Studyboard's, and Studyboard only
// ever reads (GET requests): your courses, due dates, submissions, grades, announcements and calendar.
// It never submits, posts or changes anything there.
const { BrowserWindow, ipcMain, net, session, app } = require("electron");
const path = require("path");
const fsp = require("fs").promises;

const busy = {};

// "learn.bcit.ca", "https://learn.bcit.ca/d2l/home" or similar -> "https://learn.bcit.ca". Only real https hostnames.
function originOf(host) {
  let s = String(host || "").trim();
  if (!s || s.length > 300) return null;
  if (process.env.STUDYBOARD_BS_TEST === "1" && /^http:\/\/127\.0\.0\.1:\d+$/.test(s)) return s;   // automated tests only
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    const h = u.hostname.toLowerCase();
    if (u.protocol !== "https:" || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(h) || /^(localhost|\d+\.\d+\.\d+\.\d+)$/.test(h)) return null;
    return "https://" + h + (u.port && u.port !== "443" ? ":" + u.port : "");
  } catch (e) { return null; }
}
// Some sign-in pages turn away browsers they don't recognise, so the windows use a plain Chrome user agent.
function chromeUA() { return String(app.userAgentFallback || "").replace(/\s(Electron|studyboard|Studyboard|studioso)\/\S+/g, ""); }
const prefs = P => ({ partition: P.part, contextIsolation: true, nodeIntegration: false, sandbox: true });
const timeout = (ms, what) => new Promise((_, rej) => setTimeout(() => rej(new Error(what || "timeout")), ms));

// ---------- Who's signed in (run inside the platform's own page) ----------
const WHO = {
  brightspace: `(async () => {
  try {
    const v = await (await fetch('/d2l/api/versions/', {credentials: 'include'})).json();
    const lp = ((v || []).find(x => String(x.ProductCode).toLowerCase() === 'lp') || {}).LatestVersion || '1.30';
    const r = await fetch('/d2l/api/lp/' + lp + '/users/whoami', {credentials: 'include', headers: {Accept: 'application/json'}});
    if (!r.ok) return null; const me = await r.json();
    return (me.Identifier || me.FirstName || me.UniqueName) ? {name: [me.FirstName, me.LastName].filter(Boolean).join(' ')} : null;
  } catch (e) { return null; }
})()`,
  canvas: `(async () => {
  try { const r = await fetch('/api/v1/users/self', {credentials: 'include', headers: {Accept: 'application/json'}}); if (!r.ok) return null; const me = await r.json(); return me && me.id ? {name: me.name || me.short_name || ''} : null; } catch (e) { return null; }
})()`,
  blackboard: `(async () => {
  for (const p of ['/learn/api/public/v1/users/me', '/learn/api/v1/users/me']) {
    try { const r = await fetch(p, {credentials: 'include', headers: {Accept: 'application/json'}}); if (!r.ok) continue; const me = await r.json();
      if (me && me.id) return {name: me.name ? [me.name.given, me.name.family].filter(Boolean).join(' ') : [me.givenName, me.familyName].filter(Boolean).join(' ')}; } catch (e) {}
  }
  return null;
})()`
};

// ---------- Brightspace: read everything (runs inside a hidden Brightspace page). Self-contained. ----------
async function bsHarvest(o) {
  const q = o || {}, now = Date.now(), T0 = now;
  const fromISO = new Date(now - (q.pastDays || 60) * 864e5).toISOString();
  const toISO = new Date(now + (q.aheadDays || 240) * 864e5).toISOString();
  const enc = encodeURIComponent, errors = [];
  const get = async p => {
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 25000);
    try {
      const r = await fetch(p, { credentials: "include", headers: { Accept: "application/json" }, signal: ctl.signal });
      if (r.status === 401 || r.status === 403) { const e = new Error("denied"); e.status = r.status; throw e; }
      if (!r.ok) { const e = new Error("HTTP " + r.status); e.status = r.status; throw e; }
      return await r.json();
    } finally { clearTimeout(tm); }
  };
  const soft = async (p, quiet) => { try { return await get(p); } catch (e) { if (!quiet) errors.push(String(p).replace(/\?.*/, "").replace(/\/\d{3,}\//g, "/#/") + " " + (e.status || e.name || e.message)); return null; } };
  const listOf = x => Array.isArray(x) ? x : x && Array.isArray(x.Objects) ? x.Objects : x && Array.isArray(x.Items) ? x.Items : [];
  const pages = async (p, quiet, max) => {
    const out = []; let url = p;
    for (let i = 0; url && i < (max || 8); i++) {
      const r = await soft(url, quiet); if (!r) break;
      out.push(...listOf(r));
      url = r && !Array.isArray(r) && typeof r.Next === "string" && r.Next ? r.Next : null;
    }
    return out;
  };
  const txt = (h, n) => {
    if (h && typeof h === "object") h = h.Text && typeof h.Text === "object" ? h.Text : h;
    if (h && typeof h === "object") h = h.Text || (h.Html ? String(h.Html).replace(/<(br|\/p|\/li|\/div)[^>]*>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"') : "");
    return String(h || "").replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim().slice(0, n || 4000);
  };
  const dt = x => (x && typeof x === "string" && !isNaN(Date.parse(x))) ? x : null;

  let vs = null;
  try { vs = await get("/d2l/api/versions/"); } catch (e) { if (e.status === 401 || e.status === 403) return { needLogin: true }; }
  const ver = (code, def) => { const x = listOf(vs).find(v => String(v.ProductCode || "").toLowerCase() === code); return (x && x.LatestVersion) || def; };
  const lp = ver("lp", "1.30"), le = ver("le", "1.50");
  let me;
  try { me = await get(`/d2l/api/lp/${lp}/users/whoami`); }
  catch (e) { return e.status === 401 || e.status === 403 ? { needLogin: true } : { error: "whoami " + (e.status || e.message) }; }

  // Your courses
  const ens = []; let bm = "";
  for (let i = 0; i < 12; i++) {
    const r = await soft(`/d2l/api/lp/${lp}/enrollments/myenrollments/?orgUnitTypeId=3${bm ? "&bookmark=" + enc(bm) : ""}`);
    if (!r) break;
    ens.push(...listOf(r));
    if (!r.PagingInfo || !r.PagingInfo.HasMoreItems || !r.PagingInfo.Bookmark) break;
    bm = r.PagingInfo.Bookmark;
  }
  const all = ens.filter(e => e && e.OrgUnit && e.OrgUnit.Id != null && (!e.Access || (e.Access.CanAccess !== false && e.Access.IsActive !== false)))
    .map(e => ({ ou: String(e.OrgUnit.Id), code: String(e.OrgUnit.Code || ""), name: String(e.OrgUnit.Name || ""), start: dt(e.Access && e.Access.StartDate), end: dt(e.Access && e.Access.EndDate), last: dt(e.Access && e.Access.LastAccessed) }));
  const current = c => (!c.end || Date.parse(c.end) > now - 45 * 864e5) && (!c.start || Date.parse(c.start) < now + 120 * 864e5);
  const only = Array.isArray(q.only) && q.only.length ? new Set(q.only.map(String)) : null;
  const skip = new Set((q.skip || []).map(String));
  const pick = all.filter(c => (only ? only.has(c.ou) : current(c)) && !skip.has(c.ou))
    .sort((a, b) => (Date.parse(b.last || 0) || 0) - (Date.parse(a.last || 0) || 0)).slice(0, 20);

  // Everything for one course
  const detail = async c => {
    const b = `/d2l/api/le/${le}/${c.ou}`;
    const [folders, quizzes, grades, fin, news, events] = await Promise.all([
      soft(`${b}/dropbox/folders/`),
      pages(`${b}/quizzes/`, true),
      q.grades === false ? null : soft(`${b}/grades/values/myGradeValues/`, true),
      q.grades === false ? null : soft(`${b}/grades/final/values/myGradeValue`, true),
      q.news === false ? null : soft(`${b}/news/`, true),
      pages(`${b}/calendar/events/myEvents/?startDateTime=${enc(fromISO)}&endDateTime=${enc(toISO)}`, true)
    ]);
    const fl = listOf(folders).filter(f => f && !f.IsHidden);
    const recent = fl.filter(f => { const d = Date.parse(f.DueDate || (f.Availability && f.Availability.EndDate) || ""); return !isNaN(d) && d > now - 60 * 864e5 && d < now + 240 * 864e5; }).slice(0, 40);
    const subs = {};
    await Promise.all(recent.map(async f => {
      const s = await soft(`${b}/dropbox/folders/${f.Id}/submissions/mysubmissions/`, true);
      if (Array.isArray(s)) subs[f.Id] = s.some(x => x && ((Array.isArray(x.Submissions) && x.Submissions.length > 0) || x.Status === 1 || x.Status === 3));
    }));
    c.folders = fl.slice(0, 120).map(f => ({ id: String(f.Id), name: String(f.Name || ""), due: dt(f.DueDate), start: dt(f.Availability && f.Availability.StartDate), end: dt(f.Availability && f.Availability.EndDate),
      text: txt(f.CustomInstructions), files: (f.Attachments || []).slice(0, 12).map(a => ({ id: String(a.FileId), name: String(a.FileName || "file"), size: Number(a.Size) || 0 })),
      gid: f.GradeItemId != null ? String(f.GradeItemId) : "", outOf: f.Assessment && f.Assessment.ScoreDenominator != null ? Number(f.Assessment.ScoreDenominator) : null, sub: subs[f.Id] === undefined ? null : subs[f.Id] }));
    c.quizzes = quizzes.filter(x => x && x.IsActive !== false).slice(0, 120).map(x => ({ id: String(x.QuizId), name: String(x.Name || ""), due: dt(x.DueDate), start: dt(x.StartDate), end: dt(x.EndDate),
      gid: x.GradeItemId != null ? String(x.GradeItemId) : "", text: txt(x.Description || x.Instructions, 1500), limit: x.TimeLimitValue || (x.TimeLimit && x.TimeLimit.TimeLimitValue) || null }));
    c.grades = listOf(grades).slice(0, 200).map(g => ({ gid: String(g.GradeObjectIdentifier || ""), name: String(g.GradeObjectName || ""), type: Number(g.GradeObjectType) || 0,
      num: g.PointsNumerator, den: g.PointsDenominator, wnum: g.WeightedNumerator, wden: g.WeightedDenominator, shown: String(g.DisplayedGrade || "").trim(), at: dt(g.ReleasedDate || g.LastModified) }));
    c.final = fin && typeof fin === "object" && !Array.isArray(fin) ? { num: fin.PointsNumerator, den: fin.PointsDenominator, wnum: fin.WeightedNumerator, wden: fin.WeightedDenominator, shown: String(fin.DisplayedGrade || "").trim() } : null;
    c.news = listOf(news).filter(n => n && n.IsPublished !== false && !n.IsHidden).slice(0, 25).map(n => ({ id: String(n.Id), title: String(n.Title || ""), text: txt(n.Body, 3000), date: dt(n.StartDate) || dt(n.CreatedDate) || dt(n.LastModifiedDate),
      files: (n.Attachments || []).length }));
    c.events = events.slice(0, 200).map(e => ({ id: String(e.CalendarEventId), title: String(e.Title || ""), text: txt(e.Description, 1500), start: dt(e.StartDateTime), end: dt(e.EndDateTime), allDay: !!e.IsAllDayEvent,
      where: String(e.LocationName || ""), assoc: !!(e.IsAssociatedWithEntity || (e.AssociatedEntity && e.AssociatedEntity.AssociatedEntityId)), kind: e.AssociatedEntity ? String(e.AssociatedEntity.AssociatedEntityType || "") : "", url: String(e.CalendarEventViewUrl || "") }));
  };
  for (let i = 0; i < pick.length; i += 4) await Promise.all(pick.slice(i, i + 4).map(detail));

  // Scheduled items across courses (includes discussions and content with due dates, and whether each is complete)
  let items = [], completions = [];
  for (let i = 0; i < pick.length; i += 50) {
    const csv = pick.slice(i, i + 50).map(c => c.ou).join(",");
    if (!csv) break;
    items.push(...await pages(`/d2l/api/le/${le}/content/myItems/?orgUnitIdsCSV=${csv}&startDateTime=${enc(fromISO)}&endDateTime=${enc(toISO)}`, true, 6));
    completions.push(...await pages(`/d2l/api/le/${le}/content/myItems/completions/?orgUnitIdsCSV=${csv}&completedFromDateTime=${enc(fromISO)}`, true, 6));
  }
  const item = x => ({ ou: String(x.OrgUnitId), id: String(x.ItemId), name: String(x.ItemName || ""), type: Number(x.ItemType), act: Number(x.ActivityType), url: String(x.ItemUrl || ""),
    due: dt(x.DueDate), start: dt(x.StartDate), end: dt(x.EndDate), done: dt(x.DateCompleted), exempt: !!x.IsExempt });
  return { ok: true, origin: location.origin, me: { name: [me.FirstName, me.LastName].filter(Boolean).join(" "), id: String(me.Identifier || "") }, lp, le,
    all: all.map(c => ({ ou: c.ou, code: c.code, name: c.name, start: c.start, end: c.end })), courses: pick, items: items.slice(0, 800).map(item), completions: completions.slice(0, 800).map(item),
    errors: errors.slice(0, 30), ms: Date.now() - T0 };
}

// ---------- Canvas: read everything (runs inside a hidden Canvas page, so your sign-in applies). Self-contained. ----------
async function cvHarvest(o) {
  const q = o || {}, now = Date.now(), T0 = now;
  const fromISO = new Date(now - (q.pastDays || 60) * 864e5).toISOString();
  const toISO = new Date(now + (q.aheadDays || 240) * 864e5).toISOString();
  const enc = encodeURIComponent, errors = [];
  const req = async p => {
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 25000);
    try {
      const r = await fetch(p, { credentials: "include", headers: { Accept: "application/json" }, signal: ctl.signal });
      if (r.status === 401 || r.status === 403) { const e = new Error("denied"); e.status = r.status; throw e; }
      if (!r.ok) { const e = new Error("HTTP " + r.status); e.status = r.status; throw e; }
      const link = r.headers.get("Link") || "";
      const t = await r.text();
      return { body: JSON.parse(t.replace(/^while\(1\);/, "")), next: ((link.match(/<([^>]+)>;\s*rel="next"/) || [])[1]) || null };
    } finally { clearTimeout(tm); }
  };
  const soft = async (p, quiet) => { try { return (await req(p)).body; } catch (e) { if (!quiet) errors.push(String(p).replace(/\?.*/, "").replace(/\/\d+\//g, "/#/") + " " + (e.status || e.name || e.message)); return null; } };
  const pages = async (p, quiet, max) => {
    const out = []; let url = p;
    for (let i = 0; url && i < (max || 10); i++) {
      let r; try { r = await req(url); } catch (e) { if (!quiet) errors.push(String(url).replace(/\?.*/, "") + " " + (e.status || e.message)); break; }
      if (Array.isArray(r.body)) out.push(...r.body); else break;
      url = r.next;
    }
    return out;
  };
  const txt = (h, n) => String(h || "").replace(/<(br|\/p|\/li|\/div|\/h\d)[^>]*>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim().slice(0, n || 4000);
  const dt = x => (x && typeof x === "string" && !isNaN(Date.parse(x))) ? x : null;
  const filesIn = h => { const out = [], seen = {}; const re = /<a[^>]+href="[^"]*\/files\/(\d+)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi; let m; while ((m = re.exec(String(h || ""))) && out.length < 12) { if (seen[m[1]]) continue; seen[m[1]] = 1; out.push({ id: m[1], name: txt(m[2], 120) || "File " + m[1], size: 0 }); } return out; };

  let me;
  try { me = (await req("/api/v1/users/self")).body; } catch (e) { return e.status === 401 || e.status === 403 ? { needLogin: true } : { error: "self " + (e.status || e.message) }; }
  const all = (await pages("/api/v1/courses?enrollment_state=active&include[]=term&include[]=total_scores&per_page=100", false, 5))
    .filter(c => c && c.id != null && c.name && !c.access_restricted_by_date);
  const endOf = c => dt(c.end_at) || dt(c.term && c.term.end_at);
  const startOf = c => dt(c.start_at) || dt(c.term && c.term.start_at);
  const current = c => { const e = endOf(c), s = startOf(c); return (!e || Date.parse(e) > now - 45 * 864e5) && (!s || Date.parse(s) < now + 120 * 864e5); };
  const only = Array.isArray(q.only) && q.only.length ? new Set(q.only.map(String)) : null;
  const skip = new Set((q.skip || []).map(String));
  const pick = all.filter(c => (only ? only.has(String(c.id)) : current(c)) && !skip.has(String(c.id))).slice(0, 20);
  const courses = pick.map(c => ({ ou: String(c.id), code: String(c.course_code || ""), name: String(c.name || ""), start: startOf(c), end: endOf(c), raw: c }));

  const detail = async c => {
    const id = c.ou, raw = c.raw; delete c.raw;
    const [asg, groups, events] = await Promise.all([
      pages(`/api/v1/courses/${id}/assignments?include[]=submission&per_page=100&order_by=due_at`),
      soft(`/api/v1/courses/${id}/assignment_groups?per_page=100`, true),
      pages(`/api/v1/calendar_events?type=event&context_codes[]=course_${id}&start_date=${enc(fromISO)}&end_date=${enc(toISO)}&per_page=100`, true, 4)
    ]);
    const live = asg.filter(a => a && a.published !== false);
    // Weights: when the course weights its assignment groups, each item's share is its group's weight times its share of the group's points
    const gw = {}; (Array.isArray(groups) ? groups : []).forEach(g => { gw[g.id] = Number(g.group_weight) || 0; });
    const weighted = !!raw.apply_assignment_group_weights && Object.values(gw).some(x => x > 0);
    const gpts = {}; live.forEach(a => { if (!a.omit_from_final_grade && Number(a.points_possible) > 0) gpts[a.assignment_group_id] = (gpts[a.assignment_group_id] || 0) + Number(a.points_possible); });
    const wOf = a => weighted && gw[a.assignment_group_id] && gpts[a.assignment_group_id] && Number(a.points_possible) > 0 && !a.omit_from_final_grade ? Math.round(gw[a.assignment_group_id] * Number(a.points_possible) / gpts[a.assignment_group_id] * 100) / 100 : null;
    c.items = []; c.grades = [];
    live.slice(0, 250).forEach(a => {
      const s = a.submission || null;
      const kind = a.is_quiz_assignment || a.quiz_id || (a.submission_types || []).includes("online_quiz") ? "quiz" : (a.submission_types || []).includes("discussion_topic") ? "discussion" : "assignment";
      const done = s ? (!!s.submitted_at || ["submitted", "pending_review"].includes(s.workflow_state) || (s.workflow_state === "graded" && s.score != null) || !!s.excused) && !s.missing : null;
      const due = dt(a.due_at);
      if (due || s && s.score != null) c.items.push({ kind, id: String(a.id), name: String(a.name || ""), due, start: dt(a.unlock_at), end: dt(a.lock_at), text: txt(a.description), url: String(a.html_url || ""), gid: String(a.id),
        outOf: Number(a.points_possible) > 0 ? Number(a.points_possible) : null, done, files: filesIn(a.description) });
      if (Number(a.points_possible) > 0 && (s && s.score != null || wOf(a) != null))
        c.grades.push({ gid: String(a.id), name: String(a.name || ""), num: s && s.score != null && !s.excused ? Number(s.score) : null, den: Number(a.points_possible), weight: wOf(a), shown: s && s.grade != null ? String(s.grade) : "", at: dt(s && s.graded_at) });
    });
    const en = (raw.enrollments || []).find(e => e && (e.computed_current_score != null || e.computed_current_grade));
    c.final = en ? { shown: en.computed_current_grade ? String(en.computed_current_grade) + (en.computed_current_score != null ? ` (${en.computed_current_score}%)` : "") : en.computed_current_score + "%", pct: en.computed_current_score != null ? Number(en.computed_current_score) : null } : null;
    c.events = events.slice(0, 200).map(e => ({ id: String(e.id), title: String(e.title || ""), text: txt(e.description, 1500), start: dt(e.start_at), end: dt(e.end_at), allDay: !!e.all_day, where: String(e.location_name || ""), assoc: false, url: String(e.html_url || "") }));
    c.news = [];
  };
  for (let i = 0; i < courses.length; i += 4) await Promise.all(courses.slice(i, i + 4).map(detail));

  // Announcements for all courses at once
  if (q.news !== false && courses.length) {
    const ctx = courses.map(c => "context_codes[]=course_" + c.ou).join("&");
    const ann = await pages(`/api/v1/announcements?${ctx}&start_date=${enc(new Date(now - 60 * 864e5).toISOString())}&end_date=${enc(new Date(now + 864e5).toISOString())}&per_page=50`, true, 3);
    ann.forEach(n => { const ou = String(n.context_code || "").replace("course_", ""); const c = courses.find(x => x.ou === ou); if (c && c.news.length < 25) c.news.push({ id: String(n.id), title: String(n.title || ""), text: txt(n.message, 3000), date: dt(n.posted_at) || dt(n.created_at), url: String(n.html_url || "") }); });
  }
  // The planner adds discussions, quizzes and pages with to-do dates, and whether you've finished them
  const plan = await pages(`/api/v1/planner/items?start_date=${enc(fromISO)}&end_date=${enc(toISO)}&per_page=100`, true, 6);
  const key = s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  plan.forEach(p => {
    const c = courses.find(x => x.ou === String(p.course_id)); if (!c || !p.plannable) return;
    const t = p.plannable_type; if (!["assignment", "quiz", "discussion_topic", "wiki_page"].includes(t)) return;
    const name = String(p.plannable.title || p.plannable.name || ""); const due = dt(p.plannable.due_at) || dt(p.plannable.todo_date) || dt(p.plannable_date);
    const doneP = !!((p.submissions && (p.submissions.submitted || p.submissions.excused)) || (p.planner_override && p.planner_override.marked_complete));
    const have = c.items.find(x => key(x.name) === key(name));
    if (have) { if (doneP) have.done = true; return; }
    if (!due) return;
    c.items.push({ kind: t === "quiz" ? "quiz" : t === "discussion_topic" ? "discussion" : "other", id: String(p.plannable_id), name, due, start: null, end: null, text: "", url: String(p.html_url || ""), gid: "", outOf: null, done: doneP, files: [] });
  });
  return { ok: true, origin: location.origin, me: { name: String(me.name || ""), id: String(me.id || "") },
    all: all.map(c => ({ ou: String(c.id), code: String(c.course_code || ""), name: String(c.name || "") })), courses, errors: errors.slice(0, 30), ms: Date.now() - T0 };
}

// ---------- Blackboard Learn: read everything (runs inside a hidden Blackboard page, so your sign-in applies). Self-contained. ----------
// Blackboard's own pages read these same REST routes with your sign-in. Each route has a public and an older path; the first that works is used.
async function bbHarvest(o) {
  const q = o || {}, now = Date.now(), T0 = now;
  const errors = [], enc = encodeURIComponent;
  const req = async p => {
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 25000);
    try {
      const r = await fetch(p, { credentials: "include", headers: { Accept: "application/json" }, signal: ctl.signal });
      if (r.status === 401 || r.status === 403) { const e = new Error("denied"); e.status = r.status; throw e; }
      if (!r.ok) { const e = new Error("HTTP " + r.status); e.status = r.status; throw e; }
      return await r.json();
    } finally { clearTimeout(tm); }
  };
  const first = async (paths, quiet) => { let last = null; for (const p of paths) { try { return await req(p); } catch (e) { last = e; if (e.status === 401) break; } } if (!quiet && last) errors.push(String(paths[0]).replace(/\?.*/, "").replace(/_\d+_1/g, "#") + " " + (last.status || last.message)); return null; };
  const listOf = x => Array.isArray(x) ? x : x && Array.isArray(x.results) ? x.results : [];
  const pages = async (paths, quiet, max) => {
    const r0 = await first(paths, quiet); if (!r0) return [];
    const out = listOf(r0).slice(); let next = r0.paging && r0.paging.nextPage;
    for (let i = 1; next && i < (max || 6); i++) { let r; try { r = await req(next); } catch (e) { break; } out.push(...listOf(r)); next = r.paging && r.paging.nextPage; }
    return out;
  };
  const txt = (h, n) => { if (h && typeof h === "object") h = h.rawText || h.displayText || h.text || ""; return String(h || "").replace(/<(br|\/p|\/li|\/div|\/h\d)[^>]*>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim().slice(0, n || 4000); };
  const dt = x => (x && typeof x === "string" && !isNaN(Date.parse(x))) ? x : null;

  let me = null;
  let lastErr = null;
  for (const p of ["/learn/api/public/v1/users/me", "/learn/api/v1/users/me"]) { try { me = await req(p); if (me && me.id) break; } catch (e) { lastErr = e; } }
  if (!me || !me.id) return !lastErr || lastErr.status === 401 || lastErr.status === 403 ? { needLogin: true } : { error: "me " + (lastErr.status || lastErr.message) };
  const uid = me.id, name = me.name ? [me.name.given, me.name.family].filter(Boolean).join(" ") : [me.givenName, me.familyName].filter(Boolean).join(" ");
  const mem = await pages([`/learn/api/public/v1/users/${uid}/courses?expand=course&limit=100`, `/learn/api/v1/users/${uid}/memberships?expand=course&limit=100`], false, 5);
  const all = mem.filter(m => m && m.course && !m.course.organization && (!m.availability || m.availability.available !== "No") && (!m.course.availability || m.course.availability.available !== "No"))
    .map(m => ({ ou: String(m.course.id), code: String(m.course.courseId || ""), name: String(m.course.name || m.course.displayName || ""), last: dt(m.lastAccessed), term: m.course.termId || "", url: String(m.course.externalAccessUrl || "") }));
  const only = Array.isArray(q.only) && q.only.length ? new Set(q.only.map(String)) : null;
  const skip = new Set((q.skip || []).map(String));

  // The calendar knows what's current: due dates (gradebook columns) and course events. It allows about 16 weeks per request.
  const cal = [];
  const span = 16 * 7 * 864e5;
  for (let s = now - (q.pastDays || 60) * 864e5, k = 0; s < now + (q.aheadDays || 240) * 864e5 && k < 4; s += span, k++) {
    cal.push(...await pages([`/learn/api/public/v1/calendars/items?since=${enc(new Date(s).toISOString())}&until=${enc(new Date(s + span).toISOString())}&limit=200`], true, 4));
  }
  const busyIds = new Set(cal.map(x => String(x.calendarId || "")));
  const pick = all.filter(c => (only ? only.has(c.ou) : (busyIds.has(c.ou) || (c.last && Date.parse(c.last) > now - 120 * 864e5))) && !skip.has(c.ou))
    .sort((a, b) => (Date.parse(b.last || 0) || 0) - (Date.parse(a.last || 0) || 0)).slice(0, 20);
  const courses = pick.map(c => ({ ou: c.ou, code: c.code, name: c.name, home: c.url }));

  const detail = async c => {
    const id = c.ou;
    const [cols, mine, news] = await Promise.all([
      pages([`/learn/api/public/v2/courses/${id}/gradebook/columns?limit=200`, `/learn/api/public/v1/courses/${id}/gradebook/columns?limit=200`, `/learn/api/v1/courses/${id}/gradebook/columns?limit=200`], true, 3),
      pages([`/learn/api/public/v2/courses/${id}/gradebook/users/${uid}`, `/learn/api/public/v1/courses/${id}/gradebook/users/${uid}`], true, 3),
      q.news === false ? [] : pages([`/learn/api/public/v1/courses/${id}/announcements?limit=50`, `/learn/api/v1/courses/${id}/announcements?limit=50`], true, 2)
    ]);
    const g = {}; mine.forEach(x => { g[String(x.columnId)] = x; });
    const courseUrl = `${location.origin}/ultra/courses/${id}/outline`;
    c.items = []; c.grades = []; c.final = null;
    cols.forEach(col => {
      const my = g[String(col.id)] || null, due = dt(col.grading && col.grading.due), possible = col.score && Number(col.score.possible) > 0 ? Number(col.score.possible) : null;
      const score = my && (my.score != null ? Number(my.score) : my.displayGrade && my.displayGrade.score != null ? Number(my.displayGrade.score) : null);
      const shown = my && my.displayGrade ? String(my.displayGrade.text || (my.displayGrade.score != null ? my.displayGrade.score : "")) : my && my.text ? String(my.text) : "";
      if (col.externalGrade) { if (my && (shown || score != null)) c.final = { shown: shown || (possible && score != null ? Math.round(score / possible * 1000) / 10 + "%" : String(score)), pct: possible && score != null ? Math.round(score / possible * 1000) / 10 : null }; return; }
      if (col.grading && col.grading.type === "Calculated") return;
      const done = my ? (["NeedsGrading", "Graded", "Completed"].includes(String(my.status)) || score != null) : null;
      if (due) c.items.push({ kind: /\b(test|quiz|exam|midterm)\b/i.test(col.name || "") ? "quiz" : "assignment", id: String(col.id), name: String(col.name || ""), due, start: null, end: null, text: txt(col.description), url: courseUrl, gid: String(col.id), outOf: possible, done, files: [] });
      if (possible && score != null) c.grades.push({ gid: String(col.id), name: String(col.name || ""), num: score, den: possible, weight: null, shown, at: dt(my.modified || my.lastModified) });
    });
    c.news = news.slice(0, 25).map(n => ({ id: String(n.id), title: String(n.title || ""), text: txt(n.body, 3000), date: dt(n.created) || dt(n.availability && n.availability.duration && n.availability.duration.start), url: `${location.origin}/ultra/courses/${id}/announcements` }));
    c.events = [];
  };
  for (let i = 0; i < courses.length; i += 4) await Promise.all(courses.slice(i, i + 4).map(detail));

  const key = s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  cal.forEach(x => {
    const c = courses.find(y => y.ou === String(x.calendarId || "")); if (!c) return;
    const type = String(x.type || "");
    if (type === "GradebookColumn") {
      const name = String(x.title || ""), due = dt(x.end) || dt(x.start);
      const have = c.items.find(y => key(y.name) === key(name) || y.id === String(x.itemSourceId || ""));
      if (have || !due) return;
      c.items.push({ kind: /\b(test|quiz|exam|midterm)\b/i.test(name) ? "quiz" : "assignment", id: String(x.itemSourceId || x.id), name, due, start: null, end: null, text: txt(x.description, 1500), url: `${location.origin}/ultra/courses/${c.ou}/outline`, gid: String(x.itemSourceId || ""), outOf: null, done: null, files: [] });
    } else if (type === "Course" || type === "OfficeHours") {
      c.events.push({ id: String(x.id), title: String(x.title || ""), text: txt(x.description, 1500), start: dt(x.start), end: dt(x.end), allDay: !!x.allDay, where: String(x.location || ""), assoc: false, url: `${location.origin}/ultra/calendar` });
    }
  });
  return { ok: true, origin: location.origin, me: { name, id: String(uid) }, all: all.map(c => ({ ou: c.ou, code: c.code, name: c.name })), courses, errors: errors.slice(0, 30), ms: Date.now() - T0 };
}

// ---------- The three platforms ----------
const CV_FILE = id => `(async () => {
  const r = await fetch('/api/v1/files/${id}', {credentials: 'include', headers: {Accept: 'application/json'}});
  if (r.status === 401 || r.status === 403) return {needLogin: true};
  if (!r.ok) return {error: 'HTTP ' + r.status};
  const f = JSON.parse((await r.text()).replace(/^while\\(1\\);/, ''));
  if (Number(f.size) > 52428800) return {error: 'too-large'};
  return {url: f.url, name: f.display_name || f.filename || '', type: f['content-type'] || ''};
})()`;
const BS_FILE = (ou, folderId, fileId) => `(async () => {
  const v = await (await fetch('/d2l/api/versions/', {credentials: 'include'})).json();
  const le = ((v || []).find(x => String(x.ProductCode).toLowerCase() === 'le') || {}).LatestVersion || '1.50';
  const r = await fetch('/d2l/api/le/' + le + '/${ou}/dropbox/folders/${folderId}/attachments/${fileId}', {credentials: 'include'});
  if (r.status === 401 || r.status === 403) return {needLogin: true};
  if (!r.ok) return {error: 'HTTP ' + r.status};
  const len = Number(r.headers.get('content-length') || 0);
  if (len > 52428800) return {error: 'too-large'};
  const buf = new Uint8Array(await r.arrayBuffer());
  if (buf.length > 52428800) return {error: 'too-large'};
  let cd = r.headers.get('content-disposition') || '', name = '';
  const m = cd.match(/filename\\*=UTF-8''([^;]+)/i) || cd.match(/filename="?([^";]+)"?/i); if (m) { try { name = decodeURIComponent(m[1]); } catch (e) { name = m[1]; } }
  let s = ''; for (let i = 0; i < buf.length; i += 32768) s += String.fromCharCode.apply(null, buf.subarray(i, i + 32768));
  return {ok: true, name, type: r.headers.get('content-type') || '', b64: btoa(s)};
})()`;
const P = {
  brightspace: { part: "persist:brightspace", home: "/d2l/home", ctx: "/d2l/api/versions/", harvest: bsHarvest, feed: /\/d2l\/le\/calendar\/feed\//i },
  canvas: { part: "persist:canvas", home: "/", ctx: "/robots.txt", harvest: cvHarvest, feed: /^\/feeds\/calendars\/[^/]+\.ics$/i },
  blackboard: { part: "persist:blackboard", home: "/ultra/stream", ctx: "/robots.txt", harvest: bbHarvest, feed: /(\/calendarfeed\/|\.ics$)/i }
};
const prov = id => (Object.prototype.hasOwnProperty.call(P, id) ? P[id] : null);

// ---------- Sign in ----------
function connect(id, host, parent) {
  const Pv = prov(id), origin = originOf(host);
  if (!Pv) return Promise.resolve({ ok: false, error: "bad-provider" });
  if (!origin) return Promise.resolve({ ok: false, error: "bad-host" });
  return new Promise(resolve => {
    const w = new BrowserWindow({ width: 1000, height: 780, parent: parent || undefined, title: "Sign In", autoHideMenuBar: true, show: true, webPreferences: prefs(Pv) });
    w.webContents.setUserAgent(chromeUA());
    // Sign-in pages sometimes open a pop-up (Microsoft, Google, Duo). Those stay in the same private cookie store.
    w.webContents.setWindowOpenHandler(() => ({ action: "allow", overrideBrowserWindowOptions: { autoHideMenuBar: true, webPreferences: prefs(Pv) } }));
    let done = false, timer = null;
    const finish = r => { if (done) return; done = true; clearInterval(timer); if (!w.isDestroyed()) w.close(); resolve(r); };
    const check = async () => {
      if (done || w.isDestroyed()) return;
      let here = "";
      try { here = new URL(w.webContents.getURL()).origin; } catch (e) { return; }
      if (here !== origin) return;
      const me = await w.webContents.executeJavaScript(WHO[id], true).catch(() => null);
      if (me) finish({ ok: true, origin, name: me.name || "" });
    };
    timer = setInterval(check, 2500);
    w.webContents.on("did-finish-load", check);
    w.on("closed", () => finish({ ok: false, cancelled: true }));
    w.loadURL(origin + Pv.home).catch(() => {});
  });
}

// A hidden page on the platform's own site to run things in, so your sign-in applies.
async function withPage(Pv, origin, fn) {
  const w = new BrowserWindow({ show: false, width: 800, height: 600, webPreferences: prefs(Pv) });
  w.webContents.setUserAgent(chromeUA());
  w.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  try {
    try { await w.loadURL(origin + Pv.ctx); } catch (e) { /* a redirect or a non-HTML page can reject; checked below */ }
    let here = "";
    try { here = new URL(w.webContents.getURL()).origin; } catch (e) {}
    if (here !== origin) return { needLogin: true };
    return await fn(w);
  } finally { if (!w.isDestroyed()) w.destroy(); }
}

async function sync(id, host, opts) {
  const Pv = prov(id), origin = originOf(host);
  if (!Pv) return { error: "bad-provider" };
  if (!origin) return { error: "bad-host" };
  if (busy[id]) return busy[id];
  const o = opts && typeof opts === "object" ? opts : {};
  const idOk = x => /^[\w.-]{1,40}$/.test(x);
  const safe = { pastDays: Math.min(365, Math.max(1, Number(o.pastDays) || 60)), aheadDays: Math.min(400, Math.max(7, Number(o.aheadDays) || 240)),
    grades: o.grades !== false, news: o.news !== false,
    only: Array.isArray(o.only) ? o.only.map(String).filter(idOk).slice(0, 40) : null,
    skip: Array.isArray(o.skip) ? o.skip.map(String).filter(idOk).slice(0, 200) : [] };
  busy[id] = (async () => {
    try {
      return await withPage(Pv, origin, w => Promise.race([w.webContents.executeJavaScript(`(${Pv.harvest.toString()})(${JSON.stringify(safe)})`, true), timeout(150000)]));
    } catch (e) { return { error: String(e && e.message || e).slice(0, 200) }; }
    finally { busy[id] = null; }
  })();
  return busy[id];
}

// Downloads a file with your sign-in (Canvas files are handed to a storage server, so this follows the download like a browser).
function downloadVia(Pv, url, name) {
  const ses = session.fromPartition(Pv.part);
  const w = new BrowserWindow({ show: false, webPreferences: prefs(Pv) });
  const tmp = path.join(app.getPath("temp"), "studyboard-dl-" + Date.now() + "-" + Math.random().toString(36).slice(2));
  return new Promise(resolve => {
    let t = null;
    const done = r => { ses.removeListener("will-download", onDl); clearTimeout(t); if (!w.isDestroyed()) w.destroy(); resolve(r); };
    const onDl = (e, item, wc) => {
      if (wc !== w.webContents) return;
      item.setSavePath(tmp);
      item.once("done", async (ev, st) => {
        if (st !== "completed") return done({ error: st });
        try { const buf = await fsp.readFile(tmp); fsp.unlink(tmp).catch(() => {}); if (buf.length > 52428800) return done({ error: "too-large" });
          done({ ok: true, name: name || item.getFilename(), type: item.getMimeType() || "", b64: buf.toString("base64") }); }
        catch (err) { done({ error: String(err && err.message || err) }); }
      });
    };
    ses.on("will-download", onDl);
    t = setTimeout(() => done({ error: "timeout" }), 120000);
    w.webContents.downloadURL(url);
  });
}

// One file attached to an assignment, as bytes (for "Save to Studyboard").
async function file(id, host, spec) {
  const Pv = prov(id), origin = originOf(host), s = spec && typeof spec === "object" ? spec : {};
  const num = x => /^\d{1,14}$/.test(String(x));
  if (!Pv || !origin) return { error: "bad-request" };
  try {
    if (id === "brightspace") {
      if (!num(s.ou) || !num(s.folder) || !num(s.id)) return { error: "bad-request" };
      return await withPage(Pv, origin, w => Promise.race([w.webContents.executeJavaScript(BS_FILE(s.ou, s.folder, s.id), true), timeout(120000)]));
    }
    if (id === "canvas") {
      if (!num(s.id)) return { error: "bad-request" };
      const meta = await withPage(Pv, origin, w => Promise.race([w.webContents.executeJavaScript(CV_FILE(s.id), true), timeout(30000)]));
      if (!meta || meta.needLogin || meta.error) return meta || { error: "none" };
      let u; try { u = new URL(meta.url, origin); } catch (e) { return { error: "bad-url" }; }
      if (u.origin !== origin) return { error: "bad-url" };                       // the download always starts on your school's site
      const r = await downloadVia(Pv, u.href, meta.name);
      if (r.ok && !r.type) r.type = meta.type;
      return r;
    }
    return { error: "unsupported" };
  } catch (e) { return { error: String(e && e.message || e).slice(0, 200) }; }
}

// The calendar subscription link (it has its own private key in it, so no sign-in is needed).
function feedOk(id, url) {
  const Pv = prov(id); if (!Pv) return null;
  try {
    const u = new URL(String(url || "").trim().replace(/^webcals?:\/\//i, "https://"));
    const okProto = u.protocol === "https:" || (process.env.STUDYBOARD_BS_TEST === "1" && u.origin.startsWith("http://127.0.0.1:"));
    return okProto && Pv.feed.test(u.pathname) && !!originOf(u.origin) ? u.href : null;
  } catch (e) { return null; }
}
async function feed(id, url) {
  const href = feedOk(id, url);
  if (!href) return { error: "bad-url" };
  try {
    const r = await Promise.race([net.fetch(href, { headers: { Accept: "text/calendar, */*" } }), timeout(30000)]);
    if (!r.ok) return { error: "HTTP " + r.status, status: r.status };
    const text = await r.text();
    if (text.length > 8e6) return { error: "too-large" };
    if (!/BEGIN:VCALENDAR/i.test(text)) return { error: "not-calendar" };
    return { ok: true, text };
  } catch (e) { return { error: String(e && e.message || e).slice(0, 200) }; }
}

async function signOut(id) {
  const Pv = prov(id); if (!Pv) return false;
  try { await session.fromPartition(Pv.part).clearStorageData(); await session.fromPartition(Pv.part).clearCache(); return true; } catch (e) { return false; }
}

function register(getMain) {
  const fromMain = e => { const w = getMain(); return !!(w && !w.isDestroyed() && e.sender === w.webContents); };
  ipcMain.handle("lms:connect", (e, id, host) => fromMain(e) ? connect(String(id), host, getMain()) : null);
  ipcMain.handle("lms:sync", (e, id, host, opts) => fromMain(e) ? sync(String(id), host, opts) : null);
  ipcMain.handle("lms:file", (e, id, host, spec) => fromMain(e) ? file(String(id), host, spec) : null);
  ipcMain.handle("lms:feed", (e, id, url) => fromMain(e) ? feed(String(id), url) : null);
  ipcMain.handle("lms:signout", (e, id) => fromMain(e) ? signOut(String(id)) : null);
}

module.exports = { register, bsHarvest, cvHarvest, bbHarvest, originOf, feedOk, connect, sync, file, feed, signOut };
