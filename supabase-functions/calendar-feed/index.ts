// @ts-nocheck
// Studyboard calendar feed (Supabase Edge Function "calendar-feed").
// Calendar apps (Apple Calendar, Google Calendar, Outlook) fetch
//   https://<your-project>.supabase.co/functions/v1/calendar-feed?token=<private token>
// and get your deadlines, exams, class times and events as an iCalendar (.ics) feed.
// Setup: see "Calendar Sync" in the setup guide. "Verify JWT" must be OFF for this function,
// because calendar apps can't sign in. The private token in the link is what protects your calendar.
// It uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, which Supabase provides to every Edge Function.
// The link is looked up by the SHA-256 of its token (calendar_feeds.token_hash, see supabase-calendar-feed.sql), and the
// token itself never goes into a database query. Errors shown to calendar apps are short and never describe the setup.

// ==== STUDYBOARD ICS CORE START ====
// Shared by the app (download) and the calendar-feed Edge Function (live link). Plain JavaScript, no imports.
// Keep both copies identical: test/calfeed.test.js checks that they match.
const SBICS = (() => {
  const DAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  const PRIO = {low: "Low", med: "Medium", high: "High", urgent: "Urgent"};
  const p2 = n => String(n).padStart(2, "0");
  const isDate = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)));
  const isTime = s => typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
  const dMs = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  const msD = ms => { const d = new Date(ms); return d.getUTCFullYear() + "-" + p2(d.getUTCMonth() + 1) + "-" + p2(d.getUTCDate()); };
  const addD = (s, n) => msD(dMs(s) + n * 864e5);
  const dow = s => new Date(dMs(s)).getUTCDay();
  const monday = s => addD(s, -((dow(s) + 6) % 7));
  const wkDiff = (a, b) => Math.round((dMs(monday(a)) - dMs(monday(b))) / 6048e5);
  const tMin = t => +t.slice(0, 2) * 60 + +t.slice(3, 5);
  const minT = m => p2(Math.floor(m / 60)) + ":" + p2(m % 60);

  /* ----- time zones (Intl only, so it works the same in browsers, Node and Deno) ----- */
  const fmts = {};
  const parts = (tz, ms) => {
    const f = fmts[tz] || (fmts[tz] = new Intl.DateTimeFormat("en-US", {timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit"}));
    const o = {}; f.formatToParts(new Date(ms)).forEach(x => { o[x.type] = x.value; }); return o;
  };
  const validTz = tz => { try { return typeof tz === "string" && tz.length < 64 && !!new Intl.DateTimeFormat("en-US", {timeZone: tz}); } catch (e) { return false; } };
  // minutes east of UTC at this instant
  const offset = (tz, ms) => { const o = parts(tz, ms); return Math.round((Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour % 24, +o.minute, +o.second) - Math.floor(ms / 1000) * 1000) / 6e4); };
  const todayIn = (tz, ms) => { const o = parts(tz, ms); return o.year + "-" + o.month + "-" + o.day; };
  // wall-clock date and time in tz -> UTC milliseconds
  const zonedMs = (tz, date, time) => { const g = dMs(date) + tMin(time) * 6e4; let ms = g - offset(tz, g) * 6e4; const o2 = offset(tz, ms); if (g - o2 * 6e4 !== ms) ms = g - o2 * 6e4; return ms; };
  const utcStamp = ms => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  function transitions(tz, year){
    const out = [], end = Date.UTC(year + 1, 0, 1);
    let prev = offset(tz, Date.UTC(year, 0, 1));
    for (let d = Date.UTC(year, 0, 2); d <= end; d += 864e5) {
      const o = offset(tz, d);
      if (o === prev) continue;
      let lo = d - 864e5, hi = d;
      while (hi - lo > 6e4) { const mid = Math.floor((lo + hi) / 1.2e5) * 6e4; if (offset(tz, mid) === prev) lo = mid; else hi = mid; }
      out.push({at: hi, from: prev, to: o}); prev = o;
    }
    return out;
  }
  const offStr = m => (m < 0 ? "-" : "+") + p2(Math.floor(Math.abs(m) / 60)) + p2(Math.abs(m) % 60);
  function vtimezone(tz, y0, y1){
    const L = ["BEGIN:VTIMEZONE", "TZID:" + tz, "X-LIC-LOCATION:" + tz];
    const abbr = ms => { try { const n = (new Intl.DateTimeFormat("en-US", {timeZone: tz, timeZoneName: "short"}).formatToParts(new Date(ms)).find(x => x.type === "timeZoneName") || {}).value; return /^[A-Z]{3,5}$/.test(n || "") ? n : ""; } catch (e) { return ""; } };
    const info = tr => {
      const local = tr.at + tr.from * 6e4, d = new Date(local), date = msD(local), day = d.getUTCDate();
      const dim = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
      const nth = day + 7 > dim ? -1 : Math.ceil(day / 7);
      return Object.assign({}, tr, {date, time: p2(d.getUTCHours()) + p2(d.getUTCMinutes()) + p2(d.getUTCSeconds()), month: d.getUTCMonth() + 1, nth, wd: d.getUTCDay(),
        key: [d.getUTCMonth() + 1, nth, d.getUTCDay(), d.getUTCHours(), d.getUTCMinutes(), tr.from, tr.to].join("|")});
    };
    const comp = (from, to, dtstart, extra, nameAt) => {
      const kind = to > from ? "DAYLIGHT" : "STANDARD", n = abbr(nameAt);
      L.push("BEGIN:" + kind, "DTSTART:" + dtstart, "TZOFFSETFROM:" + offStr(from), "TZOFFSETTO:" + offStr(to));
      if (n) L.push("TZNAME:" + n);
      extra.forEach(x => L.push(x));
      L.push("END:" + kind);
    };
    const a = transitions(tz, y0).map(info), b = transitions(tz, y0 + 1).map(info);
    if (!a.length && !b.length) {
      const o = offset(tz, Date.UTC(y0, 6, 1));
      comp(o, o, "19700101T000000", [], Date.UTC(y0, 6, 1));
    } else if (a.length === 2 && b.length === 2 && a[0].key === b[0].key && a[1].key === b[1].key) {
      // Same rule every year: write it as a yearly rule, the way calendar apps export their own zones.
      a.forEach(t => {
        let d1970 = t.nth > 0 ? 1 + ((t.wd - new Date(Date.UTC(1970, t.month - 1, 1)).getUTCDay() + 7) % 7) + (t.nth - 1) * 7 : 0;
        if (t.nth < 0) { const last = new Date(Date.UTC(1970, t.month, 0)); d1970 = last.getUTCDate() - ((last.getUTCDay() - t.wd + 7) % 7); }
        comp(t.from, t.to, "1970" + p2(t.month) + p2(d1970) + "T" + t.time, ["RRULE:FREQ=YEARLY;BYMONTH=" + t.month + ";BYDAY=" + (t.nth < 0 ? "-1" : t.nth) + DAY[t.wd]], t.at + 3600e3);
      });
    } else {
      // Rules change between years (or no clean pattern): list each change.
      const first = a[0] || b[0];
      comp(first.from, first.from, "19700101T000000", [], first.at - 864e5);
      for (let y = y0; y <= y1; y++) transitions(tz, y).map(info).forEach(t => comp(t.from, t.to, t.date.replace(/-/g, "") + "T" + t.time, [], t.at + 3600e3));
    }
    L.push("END:VTIMEZONE");
    return L;
  }

  /* ----- text ----- */
  const clean = s => String(s == null ? "" : s).replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "");
  const esc = s => clean(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  // Lines longer than 75 bytes are split with CRLF + space, never inside a character.
  function fold(line){
    const out = []; let cur = "", n = 0;
    for (const ch of line) {
      const cp = ch.codePointAt(0), b = cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
      if (n + b > (out.length ? 74 : 75)) { out.push(cur); cur = ""; n = 0; }
      cur += ch; n += b;
    }
    out.push(cur);
    return out.join("\r\n ");
  }
  const dur = (m, sign) => { const d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60), mi = m % 60; return (sign || "") + "P" + (d ? d + "D" : "") + (h || mi || !d ? "T" + (h ? h + "H" : "") + (mi || (!h && !d) ? mi + "M" : "") : ""); };
  const safeUrl = u => typeof u === "string" && /^https?:\/\/[^\s"<>]+$/i.test(u) && u.length < 1000 ? u : "";

  /* ----- the app's data, read the same way the app reads it ----- */
  function meetingDays(s){
    s = String(s || ""); const days = new Set();
    const words = s.match(/\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*/gi);
    if (words) words.forEach(w => days.add(["sun", "mon", "tue", "wed", "thu", "fri", "sat"].indexOf(w.slice(0, 3).toLowerCase())));
    else { const code = (s.match(/\b([MTWRFSU]|Th|Tu|Sa|Su){2,5}\b/) || [""])[0]; code.replace(/Th|Tu|Sa|Su|[MTWRFSU]/g, t => { days.add({M: 1, T: 2, Tu: 2, W: 3, R: 4, Th: 4, F: 5, S: 6, Sa: 6, Su: 0, U: 0}[t]); return t; }); }
    days.delete(-1); days.delete(undefined);
    return [...days].sort();
  }
  function timeRange(s){
    const m = String(s).match(/(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\s*(?:-|–|—|to)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i);
    if (!m) return null;
    let sh = +m[1], sm = +(m[2] || 0), eh = +m[4], em = +(m[5] || 0);
    const a1 = m[3] && m[3][0].toLowerCase(), a2 = m[6] && m[6][0].toLowerCase();
    const to24 = (h, ap) => ap === "p" ? (h % 12) + 12 : ap === "a" ? h % 12 : h;
    eh = a2 ? to24(eh, a2) : (eh < 8 ? eh + 12 : eh);
    if (a1) sh = to24(sh, a1); else if (a2 === "p" && sh < 12 && sh + 12 <= eh) sh += 12; else if (!a2 && sh < 8) sh += 12;
    if (sh > 23 || eh > 23 || sm > 59 || em > 59 || eh * 60 + em <= sh * 60 + sm) return null;
    return {start: p2(sh) + ":" + p2(sm), end: p2(eh) + ":" + p2(em)};
  }
  function parseMeetings(text, kind, where){
    const out = [];
    String(text || "").split(/;|\n|\s\/\s|,\s(?=[A-Z][a-z]*\s*(?:lab|discussion|recitation)\b)/i).forEach(part => {
      const days = meetingDays(part), tr = timeRange(part);
      if (days.length && tr) out.push({kind: /\blab\b/i.test(part) ? "Lab" : /tutorial|\btut\b/i.test(part) ? "Tutorial" : /discussion|recitation|\bdis\b/i.test(part) ? "Discussion" : kind || "Lecture", days, start: tr.start, end: tr.end, where: where || ""});
    });
    return out;
  }
  const meetingsOf = c => (Array.isArray(c.meetings) ? c.meetings : parseMeetings(c.schedule, "Lecture", c.room).concat(parseMeetings(c.office, "Office Hours")))
    .map((m, i) => ({id: m.id ? String(m.id) : i + "-" + String(m.kind || "").replace(/\W/g, "") + "-" + String(m.start || "").replace(":", ""), kind: String(m.kind || "Lecture"),
      days: [...new Set((Array.isArray(m.days) ? m.days : []).map(Number))].filter(d => d >= 0 && d <= 6).sort(), start: m.start, end: m.end, where: String(m.where || "")}))
    .filter(m => m.days.length && isTime(m.start) && isTime(m.end) && m.end > m.start);
  function normEvent(e){
    e = Object.assign({title: "Event", courseId: "", label: "", date: "", endDate: "", start: "", end: "", allDay: false, where: "", notes: "", repeat: null, exdates: [], moved: {}, src: ""}, e);
    if (!isDate(e.date)) return null;
    if (!isDate(e.endDate)) e.endDate = "";
    if (!isTime(e.start)) e.start = ""; if (!isTime(e.end)) e.end = "";
    if (!e.allDay && e.start && (!e.end || tMin(e.end) <= tMin(e.start))) e.end = minT(Math.min(1439, tMin(e.start) + 60));
    if (!e.allDay && !e.start) e.allDay = true;
    if (e.allDay) { e.start = ""; e.end = ""; }
    if (e.repeat && (!Array.isArray(e.repeat.days) || !e.repeat.days.length)) e.repeat = null;
    if (e.repeat) e.repeat = {days: [...new Set(e.repeat.days.map(Number))].filter(d => d >= 0 && d <= 6).sort(), every: Math.max(1, Math.min(4, Number(e.repeat.every) || 1)), until: isDate(e.repeat.until) ? e.repeat.until : ""};
    if (e.repeat && !e.repeat.days.length) e.repeat = null;
    if (!Array.isArray(e.exdates)) e.exdates = [];
    if (!e.moved || typeof e.moved !== "object" || Array.isArray(e.moved)) e.moved = {};
    return e;
  }
  // Studyboard's own reminder settings (settings.reminders, from the Reminders feature). Same defaults as the app.
  const REM_DEF = {tasks: true, dayBefore: true, dayTime: "18:00", hoursBefore: true, hours: 2, exams: true, events: true, eventLead: 15, classes: false, morningTime: "07:30"};
  const OVR_MIN = {"0": 0, "15m": 15, "1h": 60, "2h": 120}, OVR_DAY = {"1d": 1, "2d": 2, "3d": 3, "1w": 7};
  function remCfgOf(settings, appHasReminders){
    const r = settings && settings.reminders;
    if (!(r && typeof r === "object") && !appHasReminders) return null;
    const c = Object.assign({}, REM_DEF, r && typeof r === "object" ? r : {});
    ["dayTime", "morningTime"].forEach(k => { if (!isTime(c[k])) c[k] = REM_DEF[k]; });
    c.hours = Math.max(0.25, Math.min(24, Number(c.hours) || REM_DEF.hours));
    c.eventLead = Math.max(0, Math.min(240, Number(c.eventLead) || 0));
    return c;
  }
  // Reminder times for a task, in minutes from the start of its calendar entry (negative = before).
  function taskAlarms(t, opt, cfg){
    const timed = isTime(t.time), base = timed ? tMin(t.time) : 0, exam = t.type === "Exam" || t.type === "Quiz";
    const dayAt = (n, time) => -n * 1440 + tMin(time) - base;
    if (opt === "none" || t.status === "done") return [];
    if (typeof opt === "number" && isFinite(opt) && opt >= 0) {
      const m = Math.min(20160, Math.round(opt));
      if (timed) return [-m];
      return m >= 1440 ? [dayAt(Math.floor(m / 1440), "09:00")] : [tMin("09:00")];
    }
    if (!cfg) return timed ? [-1440] : [dayAt(1, "09:00")]; // no reminder settings: 1 day before
    const o = t.remind;
    if (o === "off") return [];
    if (o != null && Object.prototype.hasOwnProperty.call(OVR_DAY, String(o))) return [dayAt(OVR_DAY[o], cfg.dayTime)];
    if (o != null && Object.prototype.hasOwnProperty.call(OVR_MIN, String(o))) return [timed ? -OVR_MIN[o] : tMin(cfg.morningTime)];
    if (!cfg.tasks || cfg.off || t.type === "Study") return [];
    const out = [];
    if (cfg.dayBefore) out.push(dayAt(1, cfg.dayTime));
    if (cfg.hoursBefore && timed) out.push(-Math.round(cfg.hours * 60));
    if (cfg.exams && exam) out.push(dayAt(3, cfg.dayTime));
    return [...new Set(out)];
  }
  const trigger = m => m < 0 ? dur(-m, "-") : dur(m);
  function normOptions(o){
    o = o && typeof o === "object" ? o : {};
    return {hideCourses: Array.isArray(o.hideCourses) ? o.hideCourses.map(String) : [], classes: o.classes !== false, events: o.events !== false, imported: o.imported !== false,
      done: !!o.done, study: o.study !== false, appReminders: !!o.appReminders, remind: o.remind === "none" || typeof o.remind === "number" ? o.remind : "app",
      classesFrom: isDate(o.classesFrom) ? o.classesFrom : "", classesUntil: isDate(o.classesUntil) ? o.classesUntil : "", tz: validTz(o.tz) ? o.tz : "America/Vancouver", appUrl: safeUrl(o.appUrl), pastDays: Math.max(0, Math.min(3650, Number(o.pastDays) >= 0 ? Number(o.pastDays) : 60))};
  }

  /* ----- build ----- */
  // data: {tasks, courses, events, settings} as arrays/objects from the app. opts: see normOptions. now: ms. feed: true for the live link.
  function build(data, rawOpts, now, feed){
    const o = normOptions(rawOpts), tz = o.tz;
    now = typeof now === "number" ? now : Date.now();
    const today = todayIn(tz, now), stamp = utcStamp(now), hide = new Set(o.hideCourses), NONE = "_none";
    const list = x => Array.isArray(x) ? x : x && typeof x === "object" ? Object.values(x) : [];
    const settings = (data && data.settings) || {};
    const courses = {}; list(data && data.courses).forEach(c => { if (c && c.id) courses[c.id] = c; });
    const courseOk = id => { const c = id && courses[id]; if (!c) return !hide.has(NONE); return !c.archived && !hide.has(String(c.id)); };
    const label = c => String(c.code || c.name || "").trim();
    const link = (kind, id) => o.appUrl ? o.appUrl + (o.appUrl.includes("?") ? "&" : "?") + kind + "=" + encodeURIComponent(id) : "";
    const local = (d, t) => d.replace(/-/g, "") + "T" + t.replace(":", "") + "00";
    const tzp = ";TZID=" + tz;
    const untilUtc = d => utcStamp(zonedMs(tz, d, "23:59") + 59e3);
    const years = [];
    const L = [], counts = {tasks: 0, classes: 0, events: 0, study: 0};
    const add = (k, v) => L.push(fold(k + ":" + v));
    const addText = (k, v) => { if (clean(v).trim()) add(k, esc(v)); };
    const remCfg = remCfgOf(settings, o.appReminders);
    // Classes and events get reminders only when following Studyboard's reminder settings.
    const evAlarm = (desc, isClass) => { if (o.remind !== "app" || !remCfg || !remCfg.events || (isClass && !remCfg.classes)) return; L.push("BEGIN:VALARM", "ACTION:DISPLAY"); add("DESCRIPTION", esc(desc)); add("TRIGGER", trigger(-remCfg.eventLead)); L.push("END:VALARM"); };
    const ev = (uid, fields) => {
      L.push("BEGIN:VEVENT"); add("UID", uid); add("DTSTAMP", stamp);
      fields();
      L.push("END:VEVENT");
    };
    const timed = (d, s, e) => { years.push(+d.slice(0, 4)); let ed = d, em = tMin(e); if (em >= 1440) { ed = addD(d, Math.floor(em / 1440)); em %= 1440; } add("DTSTART" + tzp, local(d, s)); add("DTEND" + tzp, local(ed, minT(em))); };
    const allDay = (d, endExcl) => { add("DTSTART;VALUE=DATE", d.replace(/-/g, "")); add("DTEND;VALUE=DATE", endExcl.replace(/-/g, "")); };

    // Tasks with due dates
    const from = addD(today, -o.pastDays);
    list(data && data.tasks).forEach(t => {
      if (!t || !t.id || !isDate(t.due) || t.due < from || t.archivedTerm || t.deleted) return;
      if (t.status === "done" && !o.done) return;
      if (!courseOk(t.courseId)) return;
      const c = courses[t.courseId], type = String(t.type || "Assignment"), exam = type === "Exam" || type === "Quiz";
      const pre = t.status === "done" ? "Done · " : exam ? type + " · " : type === "Study" ? "Study · " : "Due · ";
      counts.tasks++;
      ev("task-" + t.id + "@studyboard", () => {
        add("SUMMARY", esc(pre + (c && label(c) ? label(c) + ": " : "") + String(t.title || "Untitled")));
        if (isTime(t.time)) timed(t.due, t.time, minT(tMin(t.time) + (exam ? 60 : 30)));
        else allDay(t.due, addD(t.due, 1));
        addText("LOCATION", t.location);
        const u = link("task", t.id);
        const w = Number(t.weight);
        addText("DESCRIPTION", [c ? String(c.name || label(c)) : "", type + (t.weight != null && t.weight !== "" && isFinite(w) && w > 0 ? " · Worth " + w + "%" : "") + (PRIO[t.priority] ? " · " + PRIO[t.priority] + " priority" : ""),
          clean(t.notes).trim().slice(0, 1500), u ? "Open in Studyboard: " + u : ""].filter(Boolean).join("\n\n"));
        if (u) add("URL", u);
        add("CATEGORIES", esc(exam ? type : "Deadline"));
        add("TRANSP", exam && isTime(t.time) ? "OPAQUE" : "TRANSPARENT");
        taskAlarms(t, o.remind, remCfg).forEach(m => {
          L.push("BEGIN:VALARM", "ACTION:DISPLAY"); add("DESCRIPTION", esc(String(t.title || "Task") + (exam || type === "Study" ? "" : " is due"))); add("TRIGGER", trigger(m)); L.push("END:VALARM");
        });
      });
    });

    // Weekly class times
    if (o.classes) {
      const until = o.classesUntil || addD(today, 112);
      Object.values(courses).forEach(c => {
        if (!c || !c.id || c.archived || hide.has(String(c.id))) return;
        const created = typeof c.created === "number" && isFinite(c.created) ? todayIn(tz, c.created) : "";
        const start = o.classesFrom || (created && created > addD(until, -240) ? created : addD(today, -28));
        meetingsOf(c).forEach(m => {
          let first = start; while (!m.days.includes(dow(first))) first = addD(first, 1);
          if (first > until) return;
          const isInst = d => isDate(d) && d >= first && d <= until && m.days.includes(dow(d));
          const moves = Object.entries(c.meetMoves && typeof c.meetMoves === "object" ? c.meetMoves : {}).map(([k, v]) => { const [d, s, kind] = k.split("|"); return {d, s, kind, v}; })
            .filter(x => x.s === m.start && x.kind === m.kind && isInst(x.d) && x.v && typeof x.v === "object").sort((a, b) => a.d < b.d ? -1 : 1);
          const uid = "class-" + c.id + "-" + m.id + "@studyboard", title = (label(c) ? label(c) + " " : "") + m.kind, where = m.where || (m.kind !== "Office Hours" ? String(c.room || "") : "");
          const desc = [String(c.name || ""), c.instructor ? "Instructor: " + c.instructor : ""].filter(Boolean).join("\n");
          counts.classes++;
          years.push(+until.slice(0, 4));
          ev(uid, () => {
            add("SUMMARY", esc(title)); timed(first, m.start, m.end);
            add("RRULE", "FREQ=WEEKLY;WKST=MO;BYDAY=" + m.days.map(d => DAY[d]).join(",") + ";UNTIL=" + untilUtc(until));
            moves.filter(x => x.v.skip).forEach(x => add("EXDATE" + tzp, local(x.d, m.start)));
            addText("LOCATION", where); addText("DESCRIPTION", desc);
            add("CATEGORIES", esc(m.kind)); add("TRANSP", "OPAQUE"); evAlarm(title, true);
          });
          // One week moved: a replacement for that week
          moves.filter(x => !x.v.skip).forEach(x => {
            const d = isDate(x.v.date) ? x.v.date : x.d, s = isTime(x.v.start) ? x.v.start : m.start, e = isTime(x.v.end) && x.v.end > s ? x.v.end : minT(Math.min(1439, tMin(s) + tMin(m.end) - tMin(m.start)));
            ev(uid, () => {
              add("RECURRENCE-ID" + tzp, local(x.d, m.start)); add("SUMMARY", esc(title + " (moved this week)"));
              timed(d, s, e); addText("LOCATION", where); addText("DESCRIPTION", desc); add("CATEGORIES", esc(m.kind)); add("TRANSP", "OPAQUE"); evAlarm(title, true);
            });
          });
        });
      });
    }

    // Your own events
    if (o.events) list(data && data.events).forEach(raw => {
      if (!raw || !raw.id || raw.deleted) return;
      const e = normEvent(Object.assign({}, raw)); if (!e) return;
      if (e.src === "ics" && !o.imported) return;
      if (e.courseId && !courseOk(e.courseId)) return;
      if (!e.courseId && hide.has(NONE)) return;
      const uid = "event-" + e.id + "@studyboard", c = e.courseId ? courses[e.courseId] : null;
      const desc = [e.label && e.label !== e.title ? e.label : "", c ? String(c.name || label(c)) : "", clean(e.notes).trim().slice(0, 1500)].filter(Boolean).join("\n\n");
      const common = () => { addText("LOCATION", e.where); addText("DESCRIPTION", desc); if (e.label) add("CATEGORIES", esc(e.label)); add("TRANSP", e.allDay ? "TRANSPARENT" : "OPAQUE"); if (!e.allDay) evAlarm(e.title, false); };
      const mvOf = d => { const v = e.moved[d]; return v && typeof v === "object" ? v : null; };
      if (!e.repeat) {
        const mv = mvOf(e.date); if (mv && mv.skip) return;
        const d = mv && isDate(mv.date) ? mv.date : e.date;
        counts.events++;
        ev(uid, () => {
          add("SUMMARY", esc(e.title));
          if (e.allDay) allDay(d, e.endDate && e.endDate > e.date ? addD(e.endDate, 1 + Math.round((dMs(d) - dMs(e.date)) / 864e5)) : addD(d, 1));
          else { const s = mv && isTime(mv.start) ? mv.start : e.start; timed(d, s, mv && isTime(mv.end) && mv.end > s ? mv.end : e.end > s ? e.end : minT(Math.min(1439, tMin(s) + 60))); }
          common();
        });
        return;
      }
      const r = e.repeat, lim = r.until || "";
      let first = e.date, guard = 0;
      while (guard++ < 400 && !(r.days.includes(dow(first)) && wkDiff(first, e.date) % r.every === 0)) first = addD(first, 1);
      if (guard > 400 || (lim && first > lim)) return;
      const isInst = d => isDate(d) && d >= first && (!lim || d <= lim) && r.days.includes(dow(d)) && wkDiff(d, e.date) % r.every === 0;
      const ex = [...new Set(e.exdates.filter(isInst))].sort();
      const moves = Object.keys(e.moved).filter(d => isInst(d) && !ex.includes(d) && mvOf(d)).sort();
      const skipped = moves.filter(d => mvOf(d).skip), shifted = moves.filter(d => !mvOf(d).skip);
      const at = d => e.allDay ? d.replace(/-/g, "") : local(d, e.start);
      counts.events++;
      if (lim) years.push(+lim.slice(0, 4));
      ev(uid, () => {
        add("SUMMARY", esc(e.title));
        if (e.allDay) allDay(first, addD(first, 1)); else timed(first, e.start, e.end);
        add("RRULE", "FREQ=WEEKLY;WKST=MO" + (r.every > 1 ? ";INTERVAL=" + r.every : "") + ";BYDAY=" + r.days.map(d => DAY[d]).join(",") + (lim ? ";UNTIL=" + (e.allDay ? lim.replace(/-/g, "") : untilUtc(lim)) : ""));
        ex.concat(skipped).sort().forEach(d => add(e.allDay ? "EXDATE;VALUE=DATE" : "EXDATE" + tzp, at(d)));
        common();
      });
      shifted.forEach(d => {
        const v = mvOf(d), nd = isDate(v.date) ? v.date : d;
        ev(uid, () => {
          add(e.allDay ? "RECURRENCE-ID;VALUE=DATE" : "RECURRENCE-ID" + tzp, at(d));
          add("SUMMARY", esc(e.title));
          if (e.allDay) allDay(nd, addD(nd, 1));
          else { const s = isTime(v.start) ? v.start : e.start; timed(nd, s, isTime(v.end) && v.end > s ? v.end : minT(Math.min(1439, tMin(s) + tMin(e.end) - tMin(e.start)))); }
          common();
        });
      });
    });

    // Study sessions, if a study plan saved any
    if (o.study) {
      const sp = settings.studyPlan && typeof settings.studyPlan === "object" ? settings.studyPlan.sessions : settings.studySessions;
      list(sp).forEach((s, i) => {
        if (!s || !isDate(s.date) || !isTime(s.start) || s.date < from || s.done === true && !o.done) return;
        const t = s.taskId ? list(data && data.tasks).find(x => x && x.id === s.taskId) : null;
        if (t && !courseOk(t.courseId)) return;
        const c = t ? courses[t.courseId] : null;
        const end = isTime(s.end) && s.end > s.start ? s.end : minT(Math.min(1439, tMin(s.start) + (Number(s.minutes) > 0 ? Math.round(Number(s.minutes)) : 60)));
        counts.study++;
        ev("study-" + String(s.id || s.date + "-" + s.start.replace(":", "") + "-" + i) + "@studyboard", () => {
          add("SUMMARY", esc("Study · " + (s.title || (t ? (c && label(c) ? label(c) + ": " : "") + t.title : "Study session"))));
          timed(s.date, s.start, end);
          const u = t ? link("task", t.id) : "";
          addText("DESCRIPTION", [s.notes ? clean(s.notes).slice(0, 1000) : "", u ? "Open in Studyboard: " + u : ""].filter(Boolean).join("\n\n"));
          add("CATEGORIES", "Study"); add("TRANSP", "OPAQUE");
        });
      });
    }

    const y = +today.slice(0, 4), ys = years.filter(n => n > 1900 && n < 3000);
    const y0 = Math.max(y - 10, Math.min(y - 1, ...ys)), y1 = Math.min(Math.max(y + 1, ...ys), y + 5);
    const head = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Studyboard//Calendar 1.11//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Studyboard", "NAME:Studyboard",
      "X-WR-CALDESC:" + esc(feed ? "Deadlines, exams and classes from Studyboard. Updates on its own." : "Deadlines, exams and classes from Studyboard"), "X-WR-TIMEZONE:" + tz];
    if (feed) head.push("REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H");
    const text = head.concat(vtimezone(tz, y0, y1)).map(fold).concat(L, ["END:VCALENDAR"]).join("\r\n") + "\r\n";
    return {text, counts};
  }
  return {build, normOptions, remCfgOf, taskAlarms, fold, esc, vtimezone, transitions, offset, zonedMs, todayIn, validTz, meetingsOf, VERSION: 1};
})();
// ==== STUDYBOARD ICS CORE END ====

const FEED_VERSION = 1;
const CORS = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info"};
const TOKEN_RE = /^[A-Za-z0-9_-]{32,128}$/;

function textResponse(status, body, extra){
  return new Response(body, {status, headers: Object.assign({"Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store"}, CORS, extra || {})});
}

// Talk to the database through its REST API with the service role key (no extra libraries needed).
function dbClient(){
  const url = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
  let key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!key) { try { const k = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); key = String(k.default || Object.values(k)[0] || ""); } catch (e) { /* newer projects only */ } }
  if (!url || !key) throw new Error("missing_env");
  const headers = {apikey: key, "Content-Type": "application/json"};
  if (/^eyJ/.test(key)) headers.Authorization = "Bearer " + key; // older JWT-style keys also go in Authorization
  const rest = async (path, init) => {
    const r = await fetch(url + "/rest/v1/" + path, Object.assign({}, init || {}, {headers: Object.assign({}, headers, (init && init.headers) || {})}));
    if (!r.ok) { const t = await r.text().catch(() => ""); const e = new Error("db " + r.status + " " + t.slice(0, 300)); e.status = r.status; e.body = t; throw e; }
    return r.status === 204 ? null : r.json();
  };
  return {rest};
}

export async function tokenHash(token){
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));
  return Array.from(h, b => b.toString(16).padStart(2, "0")).join("");
}

// Finds the link by the hash of its token. (A project that hasn't run the newer calendar-feed.sql has no token_hash column
// yet; then the older lookup is used until it does.)
async function loadFeed(db, token, hash){
  const by = "token_hash=eq." + hash;
  let rows;
  try { rows = await db.rest("calendar_feeds?select=user_id,options,last_fetched_at,cache_key,cache_text&" + by + "&limit=1"); }
  catch (e) {
    const b = String(e.body || e.message);
    if (/token_hash/.test(b)) { const f = await db.rest("calendar_feeds?select=user_id,options,last_fetched_at&token=eq." + encodeURIComponent(token) + "&limit=1"); return f && f[0] ? Object.assign(f[0], {_by: "token=eq." + encodeURIComponent(token)}) : null; }
    if (!/cache_key|cache_text|42703|PGRST204/.test(b)) throw e;
    rows = await db.rest("calendar_feeds?select=user_id,options,last_fetched_at&" + by + "&limit=1");
  }
  return rows && rows[0] ? Object.assign(rows[0], {_by: by}) : null;
}

// Every text value from the stored data and options loses control characters (CR, LF, tabs and the rest) before it goes
// near the calendar, so nothing can start a new line in the file (UID, URL, RRULE, DTSTART and DTEND are written as-is).
// Multi-line notes keep their line breaks; the core escapes those as \n.
const MULTI = new Set(["notes", "desc", "description", "body", "text"]);
export function cleanDeep(v, key, depth){
  depth = depth || 0;
  if (typeof v === "string") return MULTI.has(key) ? v.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000B-\u001F\u007F\u2028\u2029]/g, "") : v.replace(/[\u0000-\u001F\u007F\u2028\u2029]+/g, " ");
  if (!v || typeof v !== "object" || depth > 12) return typeof v === "object" ? null : v;
  if (Array.isArray(v)) return v.map(x => cleanDeep(x, key, depth + 1));
  const o = {};
  for (const k of Object.keys(v)) o[k] = cleanDeep(v[k], k, depth + 1);
  return o;
}
// The finished file is checked once more: every line must be a property line (NAME: or NAME;) or a folded continuation.
export function icsSafe(text){
  return String(text).split("\r\n").every(l => l === "" || l[0] === " " || /^[A-Z][A-Z0-9-]*[;:]/.test(l));
}

// Lean: a short fingerprint of "what changed and when". The same fingerprint means the same calendar, so it isn't rebuilt.
// It covers the newest change to your tasks, courses and events, the newest deletion, your feed options and today's date.
async function changeKey(db, feed){
  if (!("cache_key" in feed)) return "";
  try {
    const up = await db.rest("items?select=updated_at&user_id=eq." + encodeURIComponent(feed.user_id) + "&kind=in.(task,course,event,meta)&order=updated_at.desc&limit=1");
    let del = [];
    try { del = await db.rest("studyboard_deletions?select=deleted_at&user_id=eq." + encodeURIComponent(feed.user_id) + "&order=deleted_at.desc&limit=1"); } catch (e) { return ""; }
    const src = [FEED_VERSION, (up[0] || {}).updated_at || "", (del[0] || {}).deleted_at || "", JSON.stringify(feed.options || {}), new Date().toISOString().slice(0, 10)].join("|");
    const h = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(src)));
    return Array.from(h.slice(0, 12), b => b.toString(16).padStart(2, "0")).join("");
  } catch (e) { return ""; }
}
async function rateOk(db, key, max, windowSec){
  try { const r = await db.rest("rpc/studyboard_rate_hit", {method: "POST", body: JSON.stringify({p_key: key, p_max: max, p_window: windowSec})}); return r !== false; }
  catch (e) { return true; }
}

async function loadItems(db, userId){
  const data = {tasks: [], courses: [], events: [], settings: {}};
  for (let from = 0; from < 50000; from += 1000) {
    const rows = await db.rest("items?select=kind,id,data&user_id=eq." + encodeURIComponent(userId) + "&kind=in.(task,course,event,meta)&order=kind.asc,id.asc&limit=1000&offset=" + from);
    (rows || []).forEach(r => {
      const d = r.data && typeof r.data === "object" ? Object.assign({}, r.data, {id: (r.data && r.data.id) || r.id}) : null;
      if (!d) return;
      if (r.kind === "task") data.tasks.push(d);
      else if (r.kind === "course") data.courses.push(d);
      else if (r.kind === "event") data.events.push(d);
      else if (r.kind === "meta" && r.data.settings && typeof r.data.settings === "object") data.settings = r.data.settings;
    });
    if (!rows || rows.length < 1000) break;
  }
  return data;
}

export async function handle(req){
  if (req.method === "OPTIONS") return new Response(null, {status: 204, headers: CORS});
  if (req.method !== "GET" && req.method !== "HEAD") return textResponse(405, "Only GET works here.", {Allow: "GET, HEAD, OPTIONS"});
  const url = new URL(req.url);
  // The app checks that this function is set up with ?ping=1
  if (url.searchParams.has("ping")) {
    return new Response(JSON.stringify({ok: true, app: "studyboard-calendar-feed", version: FEED_VERSION, core: SBICS.VERSION}), {headers: Object.assign({"Content-Type": "application/json", "Cache-Control": "no-store"}, CORS)});
  }
  const token = (url.searchParams.get("token") || "").trim().replace(/\.ics$/i, "");
  if (!TOKEN_RE.test(token)) return textResponse(404, "This calendar link isn't complete. Copy it again from Studyboard > Settings > Calendar Sync.");
  let db;
  try { db = dbClient(); } catch (e) { console.error("calendar-feed: SUPABASE_URL or the service key is missing"); return textResponse(503, "This calendar isn't available right now. Try again later.", {"Retry-After": "3600"}); }
  const hash = await tokenHash(token);
  let feed;
  try { feed = await loadFeed(db, token, hash); }
  catch (e) {
    // The details (for example "run calendar-feed.sql") go to the function's logs only, never to whoever has the link.
    console.error("feed lookup failed", String(e.status || ""), String(e.body || e.message || e).slice(0, 300));
    return textResponse(503, "This calendar isn't available right now. Try again in a few minutes.", {"Retry-After": "300"});
  }
  if (!feed) return textResponse(404, "This calendar link was turned off or reset. Get the current link in Studyboard > Settings > Calendar Sync.");
  // Lean: a calendar app asking too often gets told to come back later (needs lean.sql; skipped without it).
  // The limiter keeps a fingerprint of the link, never the link itself.
  const fp = hash.slice(0, 24);
  if (!(await rateOk(db, "cal:" + fp, 120, 3600))) return textResponse(429, "Too many requests for this calendar. Try again in an hour.", {"Retry-After": "3600"});
  // Lean: reuse the calendar built last time when nothing changed (needs lean.sql's cache columns; skipped without it).
  const ckey = await changeKey(db, feed);
  const etag = ckey ? '"' + ckey + '"' : "";
  if (etag && (req.headers.get("If-None-Match") || "") === etag) return new Response(null, {status: 304, headers: Object.assign({ETag: etag, "Cache-Control": "private, max-age=900"}, CORS)});
  let out;
  if (ckey && feed.cache_key === ckey && feed.cache_text) out = {text: feed.cache_text};
  else {
    let data;
    try { data = await loadItems(db, feed.user_id); }
    catch (e) { console.error("items failed", e); return textResponse(503, "Couldn't load your calendar. Try again in a few minutes.", {"Retry-After": "300"}); }
    try { out = SBICS.build(cleanDeep(data), cleanDeep(feed.options || {}), Date.now(), true); }
    catch (e) { console.error("build failed", e); return textResponse(500, "Couldn't build your calendar. Try again later."); }
    if (!icsSafe(out.text)) { console.error("build produced an unsafe line"); return textResponse(500, "Couldn't build your calendar. Try again later."); }
    if (ckey) { try { await db.rest("calendar_feeds?" + feed._by, {method: "PATCH", headers: {Prefer: "return=minimal"}, body: JSON.stringify({cache_key: ckey, cache_text: out.text})}); } catch (e) { /* cache is optional */ } }
  }
  // Note when a calendar app last checked, so the app can show it (at most every 10 minutes).
  const last = feed.last_fetched_at ? Date.parse(feed.last_fetched_at) : 0;
  if (!last || Date.now() - last > 6e5) {
    try { await db.rest("calendar_feeds?" + feed._by, {method: "PATCH", headers: {Prefer: "return=minimal"}, body: JSON.stringify({last_fetched_at: new Date().toISOString()})}); } catch (e) { /* not important */ }
  }
  const headers = Object.assign({"Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": "inline; filename=\"studyboard.ics\"", "Cache-Control": "private, max-age=900", "X-Robots-Tag": "noindex"}, CORS, etag ? {ETag: etag} : {});
  return new Response(req.method === "HEAD" ? null : out.text, {status: 200, headers});
}

// Only in Supabase, not when the offline tests load this file.
if (typeof Deno !== "undefined" && Deno && typeof Deno.serve === "function") Deno.serve(handle);
