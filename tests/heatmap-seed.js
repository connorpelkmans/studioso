// A planner with about 6 months of study history for the Study Heatmap tests and screenshots (tests/heatmap.e2e.js).
// Deterministic: the same days every run, counted back from today. Biology and Calculus have history; History has none.
module.exports = function heatmapSeed(now){
  now = now || Date.now();
  let r = 7; const rnd = () => { r = (r * 16807) % 2147483647; return (r - 1) / 2147483646; };
  const p2 = n => String(n).padStart(2, "0");
  const dayOf = ms => { const d = new Date(ms); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
  const at = (back, h) => { const d = new Date(now); d.setHours(h, 10, 0, 0); d.setDate(d.getDate() - back); return d.getTime(); };
  const focusDays = {}, focusLog = [], fcDays = {}, tasks = [], cards = [], garden = {};
  let id = 0;
  for (let back = 182; back >= 0; back--) {
    const ms = at(back, 15), d = dayOf(ms), wd = new Date(ms).getDay();
    // quieter weekends, a lighter stretch in the middle, a busier exam month at the end
    const busy = back < 30 ? 0.85 : back > 80 && back < 100 ? 0.3 : 0.62, chance = wd === 0 || wd === 6 ? busy * 0.45 : busy;
    if (back > 0 && rnd() > chance) continue;
    const course = rnd() < 0.6 ? "c1" : "c2";
    const focus = Math.round(15 + rnd() * (back < 30 ? 120 : 75));
    focusDays[d] = focus;
    focusLog.push({d, h: 14, m: focus, c: course, t: ""});
    if (back < 7) garden[d] = [(focus >= 25 ? "5" : "3") + course];
    const t = {id: "w" + (++id), title: (course === "c1" ? "Read chapter " : "Problem set ") + id, courseId: course, type: "Reading", status: "todo", created: at(back + 5, 9), history: [],
      workLog: [{id: "l" + id, d, m: focus, k: "focus", at: ms}]};
    if (rnd() < 0.45) { t.status = "done"; t.doneAt = at(back, 18); }
    tasks.push(t);
    if (course === "c1" && rnd() < 0.55) { const n = Math.round(10 + rnd() * 60); fcDays[d] = n; for (let i = 0; i < Math.min(4, n); i++) cards.push({id: "k" + cards.length, front: "Term " + cards.length, back: "Meaning", box: 2, due: d, seen: 3, right: 2, wrong: 1, last: d}); }
  }
  return {v: 2, updated: 1, files: [], notes: [], events: [],
    courses: [{id: "c1", name: "Biology", code: "BIOL 1200", color: "#1E9E74"}, {id: "c2", name: "Calculus", code: "MATH 1500", color: "#3B6FE0"}, {id: "c3", name: "History", code: "HIST 1010", color: "#B86A00"}],
    decks: [{id: "d1", name: "Cell Biology", courseId: "c1", created: 1, cards, quizzes: []}],
    tasks, settings: {focusDays, focusLog: focusLog.slice(-600), fcDays, garden}};
};
