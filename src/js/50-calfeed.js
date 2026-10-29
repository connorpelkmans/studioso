/* ===== module: 50-calfeed.js ===== */
/* Studyboard 1.11.0 module 50-calfeed */
(() => {
// ==== STUDYBOARD ICS CORE START ====
// Shared by the app (download) and the calendar-feed Edge Function (live link)
// School days: days off (holidays, reading week, snow days) and a rotating class cycle (Day 1-6, A/B days).
// settings.school = {off: [{id, name, from, to}], cycle: {n, ref, k, days, names}}: the cycle has n days, ref was
// day k, and it advances one step on each school day (the weekdays in days that aren't a day off).
const SBSCHOOL = (() => {
  const p2 = n => String(n).padStart(2, "0");
  const isDate = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)));
  const dMs = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  const msD = ms => { const d = new Date(ms); return d.getUTCFullYear() + "-" + p2(d.getUTCMonth() + 1) + "-" + p2(d.getUTCDate()); };
  const addD = (s, n) => msD(dMs(s) + n * 864e5);
  const dow = s => new Date(dMs(s)).getUTCDay();
  const NO = {off: [], cycle: null};
  let lastIn = null, lastOut = NO;
  function norm(s){
    if (s === lastIn) return lastOut;
    const o = s && typeof s === "object" ? s : {};
    const off = (Array.isArray(o.off) ? o.off : []).filter(x => x && isDate(x.from)).slice(0, 300)
      .map(x => ({id: String(x.id || x.from).slice(0, 40), name: String(x.name || "").slice(0, 60), from: x.from, to: isDate(x.to) && x.to >= x.from && dMs(x.to) - dMs(x.from) < 200 * 864e5 ? x.to : x.from}))
      .sort((a, b) => a.from < b.from ? -1 : a.from > b.from ? 1 : 0);
    const c = o.cycle && typeof o.cycle === "object" ? o.cycle : null, n = c ? Math.round(Number(c.n)) : 0;
    const days = c && Array.isArray(c.days) ? [...new Set(c.days.map(Number))].filter(d => d >= 0 && d <= 6).sort() : [];
    const cycle = c && n >= 2 && n <= 10 && isDate(c.ref) ? {n, ref: c.ref, k: Math.min(n, Math.max(1, Math.round(Number(c.k)) || 1)), days: days.length ? days : [1, 2, 3, 4, 5], names: c.names === "abc" ? "abc" : "num"} : null;
    lastIn = s; lastOut = {off, cycle};
    return lastOut;
  }
  const offOn = (S, d) => { for (const x of S.off) { if (x.from > d) break; if (d <= x.to) return x; } return null; };
  const isSchool = (S, d) => !!S.cycle && S.cycle.days.includes(dow(d)) && !offOn(S, d);
  // The first school day on or after d
  const nextSchool = (S, d) => { for (let i = 0, x = d; i < 400; i++, x = addD(x, 1)) if (isSchool(S, x)) return x; return d; };
  const memo = {S: null, m: {}};
  // The cycle day (1..n) on a date; 0 when there's no cycle or it isn't a school day
  function dayOf(s, d){
    const S = norm(s); if (!S.cycle || !isDate(d) || !isSchool(S, d)) return 0;
    if (memo.S !== S) { memo.S = S; memo.m = {}; }
    if (memo.m[d] != null) return memo.m[d];
    const C = S.cycle; let cnt = 0;
    if (d >= C.ref) { for (let x = C.ref, i = 0; x < d && i < 4000; x = addD(x, 1), i++) if (isSchool(S, x)) cnt++; }
    else { for (let x = d, i = 0; x < C.ref && i < 4000; x = addD(x, 1), i++) if (isSchool(S, x)) cnt--; }
    return (memo.m[d] = ((C.k - 1 + cnt) % C.n + C.n) % C.n + 1);
  }
  // "Day 3" or "C Day"; short: "3" or "C"
  const label = (s, k, short) => { const S = norm(s); if (!S.cycle || !k) return ""; const a = S.cycle.names === "abc" ? String.fromCharCode(64 + k) : String(k); return short ? a : S.cycle.names === "abc" ? a + " Day" : "Day " + a; };
  // Does a class time meet on this date? Never on a day off; a rotating one on its cycle days, a weekly one on its weekdays
  function meets(s, m, d){
    const S = norm(s); if (offOn(S, d)) return false;
    if (m && Array.isArray(m.cyc) && m.cyc.length) return S.cycle ? m.cyc.includes(dayOf(s, d)) : false;
    return !!m && Array.isArray(m.days) && m.days.includes(dow(d));
  }
  return {norm, off: (s, d) => offOn(norm(s), d), dayOf, label, meets, isSchool: (s, d) => isSchool(norm(s), d), nextSchool: (s, d) => nextSchool(norm(s), d), isDate, addD, dow};
})();
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

  /* time zones (Intl only, so it works the same in browsers, Node and Deno) */
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
      a.forEach(t => {
        let d1970 = t.nth > 0 ? 1 + ((t.wd - new Date(Date.UTC(1970, t.month - 1, 1)).getUTCDay() + 7) % 7) + (t.nth - 1) * 7 : 0;
        if (t.nth < 0) { const last = new Date(Date.UTC(1970, t.month, 0)); d1970 = last.getUTCDate() - ((last.getUTCDay() - t.wd + 7) % 7); }
        comp(t.from, t.to, "1970" + p2(t.month) + p2(d1970) + "T" + t.time, ["RRULE:FREQ=YEARLY;BYMONTH=" + t.month + ";BYDAY=" + (t.nth < 0 ? "-1" : t.nth) + DAY[t.wd]], t.at + 3600e3);
      });
    } else {
      const first = a[0] || b[0];
      comp(first.from, first.from, "19700101T000000", [], first.at - 864e5);
      for (let y = y0; y <= y1; y++) transitions(tz, y).map(info).forEach(t => comp(t.from, t.to, t.date.replace(/-/g, "") + "T" + t.time, [], t.at + 3600e3));
    }
    L.push("END:VTIMEZONE");
    return L;
  }

  /* text */
  const clean = s => String(s == null ? "" : s).replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "");
  const esc = s => clean(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  // Lines longer than 75 bytes are split with CRLF + space, never inside a character
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

  /* the app's data, read the same way the app reads it */
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
      days: [...new Set((Array.isArray(m.days) ? m.days : []).map(Number))].filter(d => d >= 0 && d <= 6).sort(), cyc: [...new Set((Array.isArray(m.cyc) ? m.cyc : []).map(Number))].filter(k => k >= 1 && k <= 10).sort((a, b) => a - b), start: m.start, end: m.end, where: String(m.where || "")}))
    .filter(m => (m.days.length || m.cyc.length) && isTime(m.start) && isTime(m.end) && m.end > m.start);
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
  // Studyboard's own reminder settings (settings.reminders, from the Reminders feature)
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
  // Reminder times for a task, in minutes from the start of its calendar entry
  function taskAlarms(t, opt, cfg){
    const timed = isTime(t.time), base = timed ? tMin(t.time) : 0, exam = t.type === "Exam" || t.type === "Quiz";
    const dayAt = (n, time) => -n * 1440 + tMin(time) - base;
    if (opt === "none" || t.status === "done") return [];
    if (typeof opt === "number" && isFinite(opt) && opt >= 0) {
      const m = Math.min(20160, Math.round(opt));
      if (timed) return [-m];
      return m >= 1440 ? [dayAt(Math.floor(m / 1440), "09:00")] : [tMin("09:00")];
    }
    if (!cfg) return timed ? [-1440] : [dayAt(1, "09:00")];
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

  /* build */
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
    const evAlarm = (desc, isClass) => { if (o.remind !== "app" || !remCfg || !remCfg.events || (isClass && !remCfg.classes)) return; L.push("BEGIN:VALARM", "ACTION:DISPLAY"); add("DESCRIPTION", esc(desc)); add("TRIGGER", trigger(-remCfg.eventLead)); L.push("END:VALARM"); };
    const ev = (uid, fields) => {
      L.push("BEGIN:VEVENT"); add("UID", uid); add("DTSTAMP", stamp);
      fields();
      L.push("END:VEVENT");
    };
    const timed = (d, s, e) => { years.push(+d.slice(0, 4)); let ed = d, em = tMin(e); if (em >= 1440) { ed = addD(d, Math.floor(em / 1440)); em %= 1440; } add("DTSTART" + tzp, local(d, s)); add("DTEND" + tzp, local(ed, minT(em))); };
    const allDay = (d, endExcl) => { add("DTSTART;VALUE=DATE", d.replace(/-/g, "")); add("DTEND;VALUE=DATE", endExcl.replace(/-/g, "")); };

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

    if (o.classes) {
      const until = o.classesUntil || addD(today, 112);
      Object.values(courses).forEach(c => {
        if (!c || !c.id || c.archived || hide.has(String(c.id))) return;
        const created = typeof c.created === "number" && isFinite(c.created) ? todayIn(tz, c.created) : "";
        const start = o.classesFrom || (created && created > addD(until, -240) ? created : addD(today, -28));
        meetingsOf(c).forEach(m => {
          // rotating class times (Day 1-6, A/B days) don't repeat by weekday: one event per day they meet
          if (m.cyc.length) {
            const title = (label(c) ? label(c) + " " : "") + m.kind, where = m.where || (m.kind !== "Office Hours" ? String(c.room || "") : "");
            const desc = [String(c.name || ""), c.instructor ? "Instructor: " + c.instructor : ""].filter(Boolean).join("\n"), mv = c.meetMoves && typeof c.meetMoves === "object" ? c.meetMoves : {};
            let n = 0;
            for (let d = start; d <= until && n < 400; d = addD(d, 1)) {
              if (!SBSCHOOL.meets(settings.school, m, d)) continue;
              const x = mv[d + "|" + m.start + "|" + m.kind]; if (x && x.skip) continue;
              const dd = x && isDate(x.date) ? x.date : d, s0 = x && isTime(x.start) ? x.start : m.start, e0 = x && isTime(x.end) && x.end > s0 ? x.end : m.end;
              n++;
              ev("class-" + c.id + "-" + m.id + "-" + d + "@studyboard", () => { add("SUMMARY", esc(title)); timed(dd, s0, e0); addText("LOCATION", where); addText("DESCRIPTION", desc); add("CATEGORIES", esc(m.kind)); add("TRANSP", "OPAQUE"); evAlarm(title, true); });
            }
            if (n) { counts.classes++; years.push(+until.slice(0, 4)); }
            return;
          }
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
            // no class on days off
            SBSCHOOL.norm(settings.school).off.forEach(o => { for (let d = o.from; d <= o.to; d = addD(d, 1)) if (isInst(d) && !moves.some(x => x.d === d)) add("EXDATE" + tzp, local(d, m.start)); });
            addText("LOCATION", where); addText("DESCRIPTION", desc);
            add("CATEGORIES", esc(m.kind)); add("TRANSP", "OPAQUE"); evAlarm(title, true);
          });
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
window.SBSCHOOL = SBSCHOOL;

/* Calendar Sync */
const CS_TABLE = "calendar_feeds", CS_FN = "calendar-feed";
const CS_SQL = "-- Studyboard: live calendar link (Calendar Sync)\n-- Run this once in Supabase > SQL Editor. Running it again is safe.\n-- Each row is one private calendar link. Only you can see or change your own links.\n-- The calendar-feed Edge Function reads this table with the service role key to find whose calendar a link belongs to.\n\ncreate table if not exists public.calendar_feeds (\n  token text primary key check (char_length(token) between 32 and 128),\n  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,\n  options jsonb not null default '{}'::jsonb,\n  created_at timestamptz not null default now(),\n  last_fetched_at timestamptz\n);\n\n-- Keep each link's options small, and tokens to plain URL-safe characters (they go in a web address).\nalter table public.calendar_feeds drop constraint if exists calendar_feeds_limits;\nalter table public.calendar_feeds add constraint calendar_feeds_limits check (token ~ '^[A-Za-z0-9_-]+$' and pg_column_size(options) <= 20000) not valid;\n\ncreate index if not exists calendar_feeds_user_id_idx on public.calendar_feeds (user_id);\n\n-- ---------- The token's SHA-256 (what the calendar-feed function looks links up by) ----------\n-- The function finds a link by token_hash, so the token itself never goes into its database queries or logs. The hash is\n-- filled in by the database on every insert or token change (the app keeps sending the token as before), and existing links\n-- are filled in below. The token column stays for now because the app reads it back to show you your link.\nalter table public.calendar_feeds add column if not exists token_hash text;\ncreate or replace function public.calendar_feeds_hash() returns trigger\nlanguage plpgsql set search_path = public as $$\nbegin\n  if new.token is not null then\n    new.token_hash := encode(sha256(convert_to(new.token, 'UTF8')), 'hex');\n  elsif tg_op = 'UPDATE' then\n    new.token_hash := old.token_hash;      -- the hash can't be changed on its own\n  end if;\n  if new.token_hash is null or new.token_hash !~ '^[0-9a-f]{64}$' then raise exception 'calendar link token missing' using errcode = '23514'; end if;\n  return new;\nend $$;\ndrop trigger if exists calendar_feeds_hash on public.calendar_feeds;\ncreate trigger calendar_feeds_hash before insert or update on public.calendar_feeds\n  for each row execute function public.calendar_feeds_hash();\nupdate public.calendar_feeds set token_hash = encode(sha256(convert_to(token, 'UTF8')), 'hex')\n  where token is not null and token_hash is distinct from encode(sha256(convert_to(token, 'UTF8')), 'hex');\ncreate unique index if not exists calendar_feeds_token_hash_idx on public.calendar_feeds (token_hash);\n\nalter table public.calendar_feeds enable row level security;\n\ndrop policy if exists \"calendar_feeds_select_own\" on public.calendar_feeds;\ncreate policy \"calendar_feeds_select_own\" on public.calendar_feeds\n  for select to authenticated using ((select auth.uid()) = user_id);\n\ndrop policy if exists \"calendar_feeds_insert_own\" on public.calendar_feeds;\ncreate policy \"calendar_feeds_insert_own\" on public.calendar_feeds\n  for insert to authenticated with check ((select auth.uid()) = user_id);\n\ndrop policy if exists \"calendar_feeds_update_own\" on public.calendar_feeds;\ncreate policy \"calendar_feeds_update_own\" on public.calendar_feeds\n  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);\n\ndrop policy if exists \"calendar_feeds_delete_own\" on public.calendar_feeds;\ncreate policy \"calendar_feeds_delete_own\" on public.calendar_feeds\n  for delete to authenticated using ((select auth.uid()) = user_id);\n\n-- The app only ever writes the token, its own user_id and the options (it changes nothing else), so that is all a signed-in\n-- person may write. Every other column (token_hash, last_fetched_at and the cache_key/cache_text columns that supabase-lean.sql\n-- adds) is written only by this database and by the calendar-feed function with the service role, so nobody can plant their\n-- own calendar text for the function to serve. Columns added later get no client grant either (there is no table-wide one).\nrevoke all on public.calendar_feeds from anon;\nrevoke insert, update, truncate, references, trigger on public.calendar_feeds from authenticated;\ngrant select, delete on public.calendar_feeds to authenticated;\ngrant insert (token, user_id, options) on public.calendar_feeds to authenticated;\ngrant update (options) on public.calendar_feeds to authenticated;\n\n-- At most 5 links per account. The app keeps one: a new link is added, then the old one is removed.\ncreate or replace function public.calendar_feeds_cap() returns trigger\nlanguage plpgsql security definer set search_path = public as $$\nbegin\n  perform pg_advisory_xact_lock(hashtextextended('sb-calfeed:' || new.user_id::text, 0));   -- two at once can't both slip under the cap\n  if (select count(*) from public.calendar_feeds where user_id = new.user_id) >= 5 then\n    raise exception 'You already have 5 calendar links. Turn the live calendar off, then on again, to start fresh.' using errcode = 'P0001';\n  end if;\n  return new;\nend $$;\nrevoke all on function public.calendar_feeds_cap() from public, anon, authenticated;\ndrop trigger if exists calendar_feeds_cap on public.calendar_feeds;\ncreate trigger calendar_feeds_cap before insert on public.calendar_feeds\n  for each row execute function public.calendar_feeds_cap();\n\n-- LATER (only once your app no longer reads the token back, see SETUP-GUIDE \"Calendar Sync\"): to keep only the hash, run\n--   alter table public.calendar_feeds drop constraint calendar_feeds_pkey, alter column token drop not null;\n--   alter table public.calendar_feeds add primary key using index calendar_feeds_token_hash_idx;\n--   update public.calendar_feeds set token = null;\n-- and from then on the trigger above keeps filling token_hash from the token the app sends, with a second trigger\n-- (before insert or update, after calendar_feeds_hash) that sets new.token := null.\n\n-- Ask the API to notice the new table right away\nnotify pgrst, 'reload schema';\n";
const cs = {tab: "live", phase: "idle", row: null, err: "", fn: "", fnAt: 0, confirm: "", busy: false, saved: ""};
let csSaveTimer = null;

// The calendar link uses the HOME zone
const csTz = () => { try { const h = window.SBTZ && SBTZ.schoolZone(); if (h && SBICS.validTz(h)) return h; const z = Intl.DateTimeFormat().resolvedOptions().timeZone; return SBICS.validTz(z) ? z : "America/Vancouver"; } catch (e) { return "America/Vancouver"; } };
const csAppUrl = () => /^https?:$/.test(location.protocol) ? location.origin + location.pathname : "";
const csCourses = () => Object.values(state.courses || {}).filter(c => c && !c.archived).sort((a, b) => courseLabel(a).localeCompare(courseLabel(b)));
const csHasImported = () => Object.values(state.events || {}).some(e => e && e.src === "ics");
const csStudyList = () => { const s = state.settings || {}; const l = s.studyPlan && typeof s.studyPlan === "object" ? s.studyPlan.sessions : s.studySessions; return Array.isArray(l) ? l : l && typeof l === "object" ? Object.values(l) : []; };
// A guess at when classes end
function csGuessUntil(){
  const today = todayISO(), ids = new Set(csCourses().map(c => c.id));
  const last = Object.values(state.tasks || {}).filter(t => t && ids.has(t.courseId) && !t.archivedTerm && t.due && t.due > addDays(today, 14)).map(t => t.due).sort().pop();
  const y = today.slice(0, 4), m = Number(today.slice(5, 7));
  let term = m >= 9 ? y + "-12-15" : m <= 4 ? y + "-04-30" : y + "-08-15";
  if (term <= addDays(today, 14)) term = addDays(today, 112);
  const guess = last && addDays(last, 7) > term ? addDays(last, 7) : term;
  return guess > addDays(today, 200) ? addDays(today, 200) : guess;
}
function csOpts(){
  const saved = (state.settings && state.settings.calSync) || {};
  return Object.assign({hideCourses: [], classes: true, events: true, imported: true, done: false, study: true, remind: "app", classesFrom: mondayOf(todayISO()), classesUntil: csGuessUntil()}, saved);
}
function csFeedOpts(o, prev){
  const url = csAppUrl() || (prev && prev.appUrl) || "";
  return Object.assign({}, o, {tz: csTz(), appUrl: url, pastDays: 60, appReminders: !!window.studyboardReminders, v: 1});
}
const csData = () => ({tasks: Object.values(state.tasks || {}), courses: Object.values(state.courses || {}), events: Object.values(state.events || {}), settings: state.settings || {}});
const csBuild = (feed) => SBICS.build(csData(), Object.assign({}, csOpts(), {tz: csTz(), appUrl: csAppUrl(), pastDays: feed ? 60 : 0, appReminders: !!window.studyboardReminders}), Date.now(), !!feed);

/* links */
const csBase = () => { const c = sbConfig(); return c && c.url ? String(c.url).replace(/\/+$/, "") : ""; };
const csFnUrl = () => csBase() + "/functions/v1/" + CS_FN;
const csFeedUrl = token => csFnUrl() + "?token=" + encodeURIComponent(token);
const csWebcal = u => u.replace(/^https?:\/\//i, "webcal://");
const csGoogle = u => "https://calendar.google.com/calendar/render?cid=" + encodeURIComponent(csWebcal(u));
const csOutlook = (u, work) => `https://outlook.${work ? "office" : "live"}.com/calendar/0/addfromweb?url=${encodeURIComponent(u)}&name=Studyboard`;
function csToken(){
  const b = new Uint8Array(32); crypto.getRandomValues(b);
  let s = ""; b.forEach(x => { s += String.fromCharCode(x); });
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
const csMissingTable = e => /calendar_feeds|PGRST205|42P01|schema cache/i.test(String((e && (e.code + " " + e.message + " " + (e.details || ""))) || e));
const csNet = e => /fetch|network|Load failed|timed? ?out/i.test(String(e && e.message || e));

/* Supabase */
function csWhyNot(){
  if (inPreview()) return "claude";
  if (sbLocalOnly() || !sbConfig()) return "local";
  if (!sb) return navigator.onLine === false ? "offline" : "connecting";
  if (!sbUser) return "signin";
  return "";
}
async function csLoad(){
  if (csWhyNot()) { cs.phase = "unavailable"; csDraw(); return; }
  cs.phase = "loading"; cs.err = ""; csDraw();
  try {
    const {data, error} = await sb.from(CS_TABLE).select("token,options,created_at,last_fetched_at").eq("user_id", sbUser.id).order("created_at", {ascending: false}).limit(1);
    if (error) throw error;
    cs.row = data && data[0] || null;
    cs.phase = cs.row ? "on" : "off";
    if (cs.row) csCheckFn();
  } catch (e) {
    cs.row = null;
    cs.phase = csMissingTable(e) ? "notable" : "error";
    cs.err = csNet(e) || navigator.onLine === false ? "You're offline. Connect to the internet to set up your live calendar." : "Couldn't check your calendar link: " + String(e && e.message || e).slice(0, 140);
  }
  csDraw();
}
// Is the Edge Function deployed and open to calendar apps
async function csCheckFn(){
  cs.fn = "checking"; csDraw();
  const ping = async headers => { const r = await fetch(csFnUrl() + "?ping=1", {cache: "no-store", headers: headers || {}}); if (!r.ok) return {status: r.status}; const j = await r.json().catch(() => ({})); return {status: r.status, ok: j && j.app === "studyboard-calendar-feed"}; };
  let res = "missing";
  try { const r = await ping(); res = r.ok ? "ok" : r.status === 401 || r.status === 403 ? "jwt" : "missing"; }
  catch (e) {
    if (navigator.onLine === false) res = "offline";
    else {
      try { const c = sbConfig(), r = await ping({apikey: c.key, Authorization: "Bearer " + c.key}); res = r.ok ? "jwt" : "missing"; } catch (e2) { res = "unreachable"; }
    }
  }
  cs.fn = res; cs.fnAt = Date.now(); csDraw();
}
async function csTurnOn(reset){
  if (cs.busy) return;
  cs.busy = true; cs.confirm = ""; csDraw();
  const token = csToken(), o = csOpts();
  try {
    const {error} = await sb.from(CS_TABLE).insert({token, user_id: sbUser.id, options: csFeedOpts(o, cs.row && cs.row.options)});
    if (error) throw error;
    const {error: e2} = await sb.from(CS_TABLE).delete().eq("user_id", sbUser.id).neq("token", token);
    if (e2) console.warn("Couldn't remove the old calendar link", e2);
    if (!(state.settings && state.settings.calSync)) { state.settings = Object.assign({}, state.settings, {calSync: o}); saveSettings(); }
    cs.row = {token, options: csFeedOpts(o), created_at: new Date().toISOString(), last_fetched_at: null};
    cs.phase = "on"; cs.busy = false;
    toast(reset ? "New calendar link made. The old one no longer works." : "Live calendar is on. Now add it to your calendar app.");
    csDraw(); csCheckFn();
  } catch (e) {
    cs.busy = false;
    if (csMissingTable(e)) { cs.phase = "notable"; csDraw(); return; }
    toast(csNet(e) ? "You're offline. Try again when you're connected." : "Couldn't turn on the live calendar: " + String(e && e.message || e).slice(0, 120));
    csDraw();
  }
}
async function csTurnOff(){
  if (cs.busy) return;
  cs.busy = true; cs.confirm = ""; csDraw();
  try {
    const {error} = await sb.from(CS_TABLE).delete().eq("user_id", sbUser.id);
    if (error) throw error;
    cs.row = null; cs.phase = "off"; cs.fn = "";
    toast("Live calendar is off. Remove the Studyboard calendar from your calendar app too.");
  } catch (e) { toast(csNet(e) ? "You're offline. Try again when you're connected." : "Couldn't turn it off: " + String(e && e.message || e).slice(0, 120)); }
  cs.busy = false; csDraw();
}
function csSaveOpts(o){
  state.settings = Object.assign({}, state.settings, {calSync: o});
  saveSettings();
  if (cs.phase !== "on" || !cs.row) { cs.saved = ""; csDrawCounts(); return; }
  cs.saved = "Saving…"; csDrawSaved();
  clearTimeout(csSaveTimer);
  csSaveTimer = setTimeout(async () => {
    const row = cs.row; if (!row) return;
    const opts = csFeedOpts(o, row.options);
    try {
      const {error} = await sb.from(CS_TABLE).update({options: opts}).eq("token", row.token);
      if (error) throw error;
      row.options = opts; cs.saved = "Saved. Your calendar app picks this up on its next refresh.";
    } catch (e) { cs.saved = csNet(e) ? "You're offline, so the live link wasn't updated. Change an option again when you're connected." : "Couldn't save to your live link. Try again."; }
    csDrawSaved();
  }, 700);
}

/* the sheet */
const csWhen = iso => { try { return new Date(iso).toLocaleString(undefined, {weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"}); } catch (e) { return ""; } };
const csHasRem = () => !!window.studyboardReminders || !!(state.settings && state.settings.reminders);
const csRemindLabel = () => csHasRem() ? "Match Studyboard Reminders" : "1 Day Before (Default)";
function csSummary(o){
  const n = csCourses().length, hidden = csCourses().filter(c => o.hideCourses.includes(c.id)).length;
  const bits = [hidden ? `${n - hidden} of ${n} courses` : "All courses"];
  if (o.classes) bits.push("classes"); if (o.events) bits.push("events"); if (o.done) bits.push("completed tasks");
  return bits.join(", ");
}
function csSetupSteps(fnOnly){
  if (SB_HOSTED && !sbCustom()) return "";
  return `<ol class="cs-steps">
    ${fnOnly ? "" : `<li>In your server's dashboard, open <b>SQL Editor</b>, then <b>New query</b>. Paste the setup SQL and click <b>Run</b>. <button type="button" class="btn small" data-cs="copy-sql">Copy Setup SQL</button></li>`}
    <li>Open <b>Edge Functions</b>, then <b>Deploy a new function</b>, then <b>Via Editor</b>. Name it <code>calendar-feed</code>, paste in everything from <code>calendar-feed/index.ts</code> (it came with this update) and click <b>Deploy</b>.</li>
    <li>In that function's <b>Details</b>, turn <b>off</b> <b>Verify JWT</b> (it may be called <b>Enforce JWT Verification</b>) and save. Calendar apps can't sign in, so the private link is what keeps your calendar safe.</li>
    <li>Come back here${fnOnly ? " and choose Check Again." : " and choose Turn On Live Calendar."}</li></ol>
    <p class="mini" style="margin:0">Step by step: <b>Calendar Sync</b> in your setup guide (SETUP-GUIDE.md).</p>`;
}
function csOptsHtml(o, open){
  const cs0 = csCourses(), anyNone = Object.values(state.tasks || {}).some(t => t && !courseOf(t.courseId)) || Object.values(state.events || {}).some(e => e && !e.courseId);
  const box = (k, label, on, extra) => `<label class="mi-check"><input type="checkbox" data-cs-opt="${k}" ${on ? "checked" : ""}> <span>${label}${extra ? `<span class="mini cs-sub">${extra}</span>` : ""}</span></label>`;
  const R = [["app", csRemindLabel()], ["none", "No Reminders"], [15, "15 Minutes Before a Deadline"], [60, "1 Hour Before a Deadline"], [180, "3 Hours Before a Deadline"], [1440, "1 Day Before a Deadline"], [2880, "2 Days Before a Deadline"], [10080, "1 Week Before a Deadline"]];
  return `<details class="adv cs-opts" ${open ? "open" : ""} data-cs-details><summary><span class="adv-title">What to Include</span><span class="adv-sum" id="csSum">${esc(csSummary(o))}</span></summary><div class="adv-body">
    ${cs0.length || anyNone ? `<fieldset><legend>Courses</legend><div class="cs-courses">
      ${cs0.map(c => `<label class="mi-check cs-course" style="--c:${esc(c.color || "var(--accent)")}"><input type="checkbox" data-cs-course="${esc(c.id)}" ${o.hideCourses.includes(c.id) ? "" : "checked"}><span class="dot"></span><span>${esc(courseLabel(c))}${c.code && c.name ? `<span class="mini cs-sub">${esc(c.name)}</span>` : ""}</span></label>`).join("")}
      ${anyNone ? `<label class="mi-check cs-course" style="--c:#8A94A6"><input type="checkbox" data-cs-course="_none" ${o.hideCourses.includes("_none") ? "" : "checked"}><span class="dot"></span><span>No course</span></label>` : ""}
    </div></fieldset>` : ""}
    <fieldset><legend>Include</legend>
      <label class="mi-check"><input type="checkbox" checked disabled> <span>Deadlines, exams and quizzes<span class="mini cs-sub">Tasks with a due date</span></span></label>
      ${box("done", "Completed tasks", o.done)}
      ${box("classes", "Class times", o.classes, "Your weekly classes, repeating")}
      ${box("events", "Your events", o.events, "Events you added on the Schedule")}
      ${csHasImported() ? box("imported", "Events imported from another calendar", o.imported, "Turn off if they show up twice") : ""}
      ${csStudyList().length ? box("study", "Study sessions", o.study, "From your study plan") : ""}
    </fieldset>
    <div class="two cs-dates" ${o.classes ? "" : "hidden"}>
      <label class="f">Classes From<input type="date" data-cs-opt="classesFrom" value="${esc(o.classesFrom || "")}"></label>
      <label class="f">Classes Until<input type="date" data-cs-opt="classesUntil" value="${esc(o.classesUntil || "")}"></label>
    </div>
    <label class="f">Reminders in Your Calendar<select data-cs-opt="remind">${R.map(([v, l]) => `<option value="${v}" ${String(o.remind) === String(v) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>
    <p class="mini" style="margin:0">${csHasRem() ? "Match Studyboard Reminders copies your reminder settings, including before events and classes if you turned those on." : "Reminders go on deadlines, exams and quizzes."} Your calendar app shows these even when Studyboard is closed, so with Studyboard notifications on too, you may get each reminder twice.</p>
    <p class="mini cs-saved" id="csSaved" aria-live="polite">${esc(cs.saved)}</p>
  </div></details>`;
}
function csNote(title, body, warn){ return `<div class="cs-note${warn ? " warn" : ""}">${title ? `<b class="cs-note-t">${title}</b>` : ""}${body}</div>`; }
function csFnStatus(){
  const r = cs.row, seen = r && r.last_fetched_at ? `Last checked by a calendar app: ${esc(csWhen(r.last_fetched_at))}.` : "No calendar app has checked it yet.";
  if (cs.fn === "checking" || !cs.fn) return `<p class="cs-status"><i class="cs-dot"></i>Checking your link…</p>`;
  if (cs.fn === "ok") return `<p class="cs-status ok"><i class="cs-dot"></i><span>Your link is working. ${seen}</span></p>`;
  if (cs.fn === "offline") return `<p class="cs-status"><i class="cs-dot"></i><span>You're offline, so the link couldn't be checked. ${seen}</span></p>`;
  if ((cs.fn === "jwt" || cs.fn !== "ok") && SB_HOSTED && !sbCustom()) return csNote("Your Link Isn't Ready Yet", `<p>Your link is saved, but Studyboard's calendar service didn't answer just now. Calendar apps show an error until it does. Please try again a bit later.</p><button type="button" class="btn small" data-cs="check">Check Again</button>`, true);
  if (cs.fn === "jwt") return csNote("Almost There: Turn Off Verify JWT", `<p>The calendar-feed function is set up, but it still asks for a sign-in, and calendar apps can't sign in. In your server's dashboard, open <b>Edge Functions</b>, choose <b>calendar-feed</b>, open <b>Details</b>, turn off <b>Verify JWT</b> (it may be called <b>Enforce JWT Verification</b>) and save.</p><button type="button" class="btn small" data-cs="check">Check Again</button>`, true);
  return csNote(cs.fn === "unreachable" ? "Your Link Can't Be Reached Yet" : "One More Step: Add the Calendar Function", `<p>Your link is saved, but the calendar-feed function on your server ${cs.fn === "unreachable" ? "didn't answer. It may not be deployed yet, or Verify JWT may still be on" : "isn't deployed yet"}. Calendar apps show an error until it is.</p>${csSetupSteps(true)}<button type="button" class="btn small" data-cs="check">Check Again</button>`, true);
}
function csLivePane(){
  const o = csOpts();
  if (cs.phase === "unavailable") {
    const why = csWhyNot();
    if (why === "claude") return csNote("Needs Studyboard's Own Site", `<p>A live calendar link works on the Studyboard website and in the desktop app, when you're signed in to your Studyboard account. Here, use <b>Download a File</b> instead.</p>`);
    if (why === "local") return csNote("Needs a Studyboard Account", `<p>Studyboard is only saving on this device right now. Calendar apps fetch a live link from the internet, so it needs a free Studyboard account. Until then, you can use <b>Download a File</b>.</p><div class="cs-row"><button type="button" class="btn small" data-act="sb-connect">${SB_HOSTED ? "Sign In" : "Set Up Sync"}</button></div>`);
    if (why === "signin") return csNote("Sign In First", `<p>Sign in to your Studyboard account to make a live calendar link.</p><div class="cs-row"><button type="button" class="btn small" data-act="sb-signin">Sign In</button></div>`);
    if (why === "offline") return csNote("You're Offline", `<p>Connect to the internet to set up or change your live calendar link. You can still download a calendar file.</p><div class="cs-row"><button type="button" class="btn small" data-cs="retry">Try Again</button></div>`);
    return csNote("Connecting…", `<p>Studyboard is still connecting. Try again in a moment.</p><div class="cs-row"><button type="button" class="btn small" data-cs="retry">Try Again</button></div>`);
  }
  if (cs.phase === "loading" || cs.phase === "idle") return `<p class="status-msg">Checking your calendar link…</p>`;
  if (cs.phase === "error") return csNote("Something Went Wrong", `<p>${esc(cs.err)}</p><div class="cs-row"><button type="button" class="btn small" data-cs="retry">Try Again</button></div>`, true);
  if (cs.phase === "notable" && SB_HOSTED && !sbCustom()) return csNote("Live Link Unavailable", `<p>${esc(srvSetup("Live calendar links", "calendar-feed.sql"))} Until then, use <b>Download a File</b>.</p><div class="cs-row"><button type="button" class="btn small" data-cs="retry">Check Again</button></div>`);
  if (cs.phase === "notable") return csNote("One-Time Setup Needed", `<p>Your server needs a small table and a calendar function before it can make live links. It takes about 5 minutes.</p>${csSetupSteps(false)}<div class="cs-row"><button type="button" class="btn small" data-cs="retry">Check Again</button></div>`);
  const how = `<ul class="help-list cs-list">
      <li>Calendar apps check the link on their own schedule, so changes you make here show up a little later.</li>
      <li><b>Apple Calendar</b> checks as often as you choose (every 15 minutes to once a week). <b>Outlook</b> checks every few hours.</li>
      <li><b>Google Calendar</b> can take several hours, sometimes up to a day. That's Google's timing and can't be sped up.</li>
      <li>It's read-only: edit things in Studyboard, not in your calendar app.</li></ul>`;
  if (cs.phase === "off") return `<p style="margin:0">Turn this on to get a private link that Apple Calendar, Google Calendar and Outlook can subscribe to. Your deadlines, exams and classes then appear in your calendar and stay up to date on their own.</p>
    ${how}${csOptsHtml(o, false)}
    <div class="cs-row"><button type="button" class="btn primary" data-cs="on" ${cs.busy ? "disabled" : ""}>${cs.busy ? "Turning On…" : "Turn On Live Calendar"}</button></div>`;
  const url = csFeedUrl(cs.row.token);
  const confirm = cs.confirm === "reset" ? csNote("Reset Your Link?", `<p>You'll get a new link, and the old one stops working right away. Add the new link to your calendar apps again, and remove the old Studyboard calendar there.</p><div class="cs-row"><button type="button" class="btn" data-cs="cancel">Cancel</button><button type="button" class="btn primary" data-cs="reset-yes">Reset Link</button></div>`, true)
    : cs.confirm === "off" ? csNote("Turn Off the Live Calendar?", `<p>The link stops working right away. Your calendar apps keep the last copy until you remove the Studyboard calendar from them.</p><div class="cs-row"><button type="button" class="btn" data-cs="cancel">Cancel</button><button type="button" class="btn danger" data-cs="off-yes">Turn Off</button></div>`, true) : "";
  return `<div class="cs-linkbox"><label class="f"><span class="lh">Your Private Calendar Link</span>
      <span class="cs-link"><input type="text" readonly value="${esc(url)}" id="csUrl" aria-label="Your private calendar link"><button type="button" class="btn small" data-cs="copy">Copy Link</button></span></label>
      <p class="mini" style="margin:0">Keep it private: anyone with this link can see your calendar. If it gets shared by mistake, reset it.</p></div>
    ${csFnStatus()}
    <div class="cs-add">
      <a class="btn" href="${esc(csWebcal(url))}" data-cs-link="apple"><span>Add to Apple Calendar</span><span class="mini">iPhone, iPad, Mac</span></a>
      <a class="btn" href="${esc(csGoogle(url))}" target="_blank" rel="noopener" data-cs-link="google"><span>Add to Google Calendar</span><span class="mini">Opens in your browser</span></a>
      <a class="btn" href="${esc(csOutlook(url))}" target="_blank" rel="noopener" data-cs-link="outlook"><span>Add to Outlook</span><span class="mini">Outlook.com</span></a>
    </div>
    <p class="mini" style="margin:0">School or work Outlook account? <a href="${esc(csOutlook(url, true))}" target="_blank" rel="noopener">Use this link instead</a>. Anything else: paste the link where your calendar app says "Subscribe" or "From URL". On a phone, add it to Google Calendar from a browser, since the Google Calendar app can't add links.</p>
    <details class="cs-how"><summary>How Updates Work</summary>${how}</details>
    ${csOptsHtml(o, false)}
    ${confirm || `<div class="cs-row"><button type="button" class="btn" data-cs="reset" ${cs.busy ? "disabled" : ""}>Reset Link</button><button type="button" class="btn danger" data-cs="off" ${cs.busy ? "disabled" : ""}>Turn Off</button></div>`}`;
}
function csCountText(){
  const n = csBuild(false).counts, parts = [];
  if (n.tasks) parts.push(`${n.tasks} deadline${n.tasks === 1 ? "" : "s"}`);
  if (n.classes) parts.push(`${n.classes} weekly class time${n.classes === 1 ? "" : "s"}`);
  if (n.events) parts.push(`${n.events} event${n.events === 1 ? "" : "s"}`);
  if (n.study) parts.push(`${n.study} study session${n.study === 1 ? "" : "s"}`);
  return {total: n.tasks + n.classes + n.events + n.study, text: parts.length ? "The file will have " + parts.join(", ").replace(/, ([^,]*)$/, " and $1") + "." : "Nothing to add yet. Add due dates or class times, or include more above."};
}
function csUploadPane(){
  return `<p style="margin:0">Add events from a calendar file (.ics). Apple Calendar, Google Calendar and Outlook can all make one.</p>
    <div class="cs-row"><button type="button" class="btn primary" data-cs="upload">Choose Files</button></div>
    <ul class="help-list cs-list">
      <li><b>Apple Calendar on a Mac:</b> select the calendar in the sidebar, then File &gt; Export &gt; Export.</li>
      <li><b>Google Calendar:</b> Settings &gt; Import &amp; export &gt; Export.</li>
      <li><b>Outlook:</b> File &gt; Save Calendar.</li>
      <li><b>Your school's portal:</b> look for "Export" or "Download .ics".</li>
    </ul>
    <p class="mini">Repeating classes stay repeating. You can add several calendars: each one keeps its own events, and importing the same calendar again updates what's already here.</p>`;
}
function csFilePane(){
  const o = csOpts(), n = csCountText();
  return `<p style="margin:0">Download a calendar file (.ics) and open it in your calendar app. It's a one-time copy that won't update when Studyboard changes, so download a new one after big changes, or use a <b>Live Link</b>.</p>
    ${csOptsHtml(o, true)}
    <p class="cs-count" id="csCount">${esc(n.text)}</p>
    <div class="cs-row"><button type="button" class="btn primary" data-cs="download" ${n.total ? "" : "disabled"}>Download Calendar File</button></div>
    <ul class="help-list cs-list">
      <li><b>Apple Calendar and Outlook:</b> open the file${caps.downloads ? " (unzip the download first)" : ""} and choose which calendar to add it to.</li>
      <li><b>Google Calendar:</b> on a computer, open Settings, then Import &amp; export, and choose the file.</li>
      <li>Importing a newer file again updates the same items in Apple Calendar and Outlook. Google Calendar may add copies, so a live link works better there.</li></ul>`;
}
function csDraw(){
  const root = document.getElementById("csRoot"); if (!root || !dlg.open) return;
  root.querySelectorAll("[data-cs-tab]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.csTab === cs.tab)));
  const pane = root.querySelector("#csPane");
  const same = pane.dataset.csPane === cs.tab, openD = same && pane.querySelector("[data-cs-details]"), wasOpen = openD ? openD.open : null, y = root.scrollTop;
  pane.innerHTML = cs.tab === "two" && window.SBPRO && SBPRO.calPane ? SBPRO.calPane() : cs.tab === "file" ? csFilePane() : cs.tab === "upload" ? csUploadPane() : csLivePane();
  pane.dataset.csPane = cs.tab;
  const d = pane.querySelector("[data-cs-details]"); if (d && wasOpen != null) d.open = wasOpen;
  root.scrollTop = y;
}
function csDrawSaved(){ const el = document.getElementById("csSaved"); if (el) el.textContent = cs.saved; csDrawCounts(); }
function csDrawCounts(){
  const s = document.getElementById("csSum"); if (s) s.textContent = csSummary(csOpts());
  const c = document.getElementById("csCount"); if (c) { const n = csCountText(); c.textContent = n.text; const b = document.querySelector('[data-cs="download"]'); if (b) b.disabled = !n.total; }
  const dates = document.querySelector(".cs-dates"); if (dates) dates.hidden = !csOpts().classes;
}
function csReadOpts(root){
  const o = csOpts();
  const hide = new Set(o.hideCourses);
  root.querySelectorAll("[data-cs-course]").forEach(i => { if (i.checked) hide.delete(i.dataset.csCourse); else hide.add(i.dataset.csCourse); });
  o.hideCourses = [...hide];
  root.querySelectorAll("[data-cs-opt]").forEach(i => {
    const k = i.dataset.csOpt;
    if (i.type === "checkbox") o[k] = i.checked;
    else if (k === "remind") o[k] = i.value === "app" || i.value === "none" ? i.value : Number(i.value);
    else if (i.type === "date") o[k] = /^\d{4}-\d{2}-\d{2}$/.test(i.value) ? i.value : "";
  });
  if (o.classesFrom && o.classesUntil && o.classesUntil < o.classesFrom) { toast("Classes Until must be after Classes From"); return null; }
  return o;
}
async function csCopy(text, done){
  try { await navigator.clipboard.writeText(text); toast(done); return; } catch (e) {}
  try {
    const ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;opacity:0;left:0;top:0";
    (dlg.open ? dlg : document.body).appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove();
    toast(ok ? done : "Couldn't copy. Select the text and copy it yourself.");
  } catch (e) { toast("Couldn't copy. Select the text and copy it yourself."); }
}
async function csDownload(){
  const {text} = csBuild(false);
  const dl = caps.downloads || await useCap("downloads");
  if (!dl) {
    if (!inPreview()) { saveBlob("studyboard-calendar.ics", text, "text/calendar"); toast("Calendar file saved"); return; }
    toast("Downloads aren't available here"); return;
  }
  try { await dl.save({filename: "studyboard-calendar.zip", data: zipOne("studyboard-calendar.ics", text)}); toast("Calendar file saved"); }
  catch (e) {
    if (e && e.code === "declined") return;
    toast(e && e.code === "extension_not_enabled" ? "Calendar files can't be downloaded here" : "Couldn't save the file. Try again.");
  }
}
function calSyncSheet(tab){
  cs.tab = tab || (cs.phase === "on" || !csWhyNot() ? "live" : cs.tab || "live"); cs.confirm = ""; cs.saved = "";
  openSheet(`<div class="sheet cs-sheet">${head("Calendar Sync")}<div class="sheet-body" id="csRoot">
    <p style="margin:0">See your deadlines, exams and classes in Apple Calendar, Google Calendar or Outlook.</p>
    <div class="segb cs-tabs" role="group" aria-label="How to add to your calendar"><button type="button" data-cs-tab="live" aria-pressed="true">Live Link</button><button type="button" data-cs-tab="upload" aria-pressed="false">Upload a File</button><button type="button" data-cs-tab="file" aria-pressed="false">Download a File</button>${window.SBPRO && SBPRO.calTab ? SBPRO.calTab() : ""}</div>
    <div id="csPane" class="cs-pane"></div>
    </div><div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Done</button></div></div>`);
  const root = document.getElementById("csRoot");
  root.addEventListener("click", e => {
    const t = e.target.closest("[data-cs-tab]");
    if (t) { cs.tab = t.dataset.csTab; cs.confirm = ""; csDraw(); return; }
    const b = e.target.closest("[data-cs]"); if (!b) return;
    const a = b.dataset.cs;
    if (a === "copy") { const i = document.getElementById("csUrl"); if (i) { i.select(); csCopy(i.value, "Calendar link copied"); } }
    else if (a === "copy-sql") csCopy(CS_SQL, "Setup SQL copied. Paste it into your server's SQL Editor.");
    else if (a === "on") csTurnOn(false);
    else if (a === "reset" || a === "off") { cs.confirm = a; csDraw(); }
    else if (a === "cancel") { cs.confirm = ""; csDraw(); }
    else if (a === "reset-yes") csTurnOn(true);
    else if (a === "off-yes") csTurnOff();
    else if (a === "check") csCheckFn();
    else if (a === "retry") csLoad();
    else if (a === "download") csDownload();
    else if (a === "upload") { dlg.close(); icsPick(); }
  });
  root.addEventListener("change", e => {
    if (!e.target.closest("[data-cs-opt],[data-cs-course]")) return;
    const o = csReadOpts(root); if (!o) return;
    csSaveOpts(o);
  });
  root.addEventListener("click", e => { const l = e.target.closest("[data-cs-link=apple]"); if (l) setTimeout(() => toast("If nothing opened, copy the link and add it in Calendar: File > New Calendar Subscription"), 1200); });
  csDraw();
  csLoad();
}

/* entry points */
hook("act", act => {
  if (act === "cal-export" || act === "cal-sync") { calSyncSheet(); return true; }
  if (act === "sch-ics") { calSyncSheet("upload"); return true; }
  return false;
});
const csOrigMenu = menuSheet;
menuSheet = function(){
  const r = csOrigMenu.apply(this, arguments);
  const b = dlg.querySelector('[data-act="cal-export"]');
  if (b) b.innerHTML = `<span>Calendar Sync<span class="sub">Put your deadlines and classes in Apple, Google or Outlook Calendar, with a live link or a file</span></span>`;
  return r;
};
hook("render", tab => {
  if (tab !== "schedule") return;
  const nav = document.querySelector(".sch-nav");
  if (nav && !nav.querySelector('[data-act="cal-sync"]')) nav.insertAdjacentHTML("beforeend", `<button class="btn small" data-act="cal-sync" title="Put your classes and deadlines in Apple, Google or Outlook Calendar">Calendar Sync</button>`);
});
// Links in calendar events open the task
let csDeep = null, csDeepTries = 0;
try { const q = new URLSearchParams(location.search); csDeep = q.get("task"); if (csDeep && history.replaceState) { q.delete("task"); history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "") + location.hash); } } catch (e) {}
const csOpenDeep = () => {
  if (!csDeep) return;
  const t = state.tasks && state.tasks[csDeep];
  if (t) { const id = csDeep; csDeep = null; setTimeout(() => { if (!dlg.open && state.tasks[id]) taskForm(state.tasks[id]); }, 250); }
  else if (++csDeepTries > 40) csDeep = null;
};
hook("boot", csOpenDeep);
hook("render", csOpenDeep);
})();


