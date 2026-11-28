/* ===== module: 98-0study-credits.js ===== */
/* Studyboard Credits: the gold coins students earn by studying, spent on companion accessories (98-companion.js, the Wardrobe).
   They're separate from Studyboard Bucks, the green bills bought with money for the Style Shop (97-credits.js).

   How many credits each kind of work earns follows how hard it is, roughly per minute of real effort:
     - Focus time       1 per 2 minutes          (at most 3 hours a day count)
     - Flashcards       1 per card reviewed      active recall (at most 150 a day count)
     - Practice quizzes 1 per right answer, +5 for passing (70%+ of 3 or more questions), +5 more for a perfect score; 3 tries a quiz a day
     - Tasks            by type: Exam 40, Project 30, Quiz 20, Assignment and Lab 12, Reading and Study 6, Other 4;
                        a step of a broken-down task 3 (at most 8 tasks a day count, so splitting work up doesn't pay)
     - Presentations    3 for each slide inside its time, +20 when the whole talk is on target, +30 more the first time; 2 runs a day

   How that meets the prices (98-companion.js PRICE: Common 100, Uncommon 200, Rare 300, Epic 500, Legendary 1,000): a steady
   study day (a 25-minute focus session 12, 20 cards 20, a passed 10-question quiz 13, an assignment and a reading 18) is about
   65 credits, plus about one chest. So a Common takes about a day, a Rare half a week, an Epic about a week and a Legendary about two weeks.
   The daily caps keep a timer left running or a list of tiny tasks from shortcutting that.

   Where they come from: everything except presentations is worked out from what's already saved (decks, quizzes, tasks, focus
   minutes), so credits sync with the rest of a student's work and include what they did before this existed. Each kind keeps
   its highest total (state.settings.sc.hw), so deleting an old deck or finished task never takes credits back. Presentations live
   on one device (99-present.js, IndexedDB), so each run's credits are written down once (sc.ev, by run id).
   Spending: sc.own {accessoryId: price}. The balance is everything earned minus everything spent, never below zero.
   Nothing here is money: it's all in the student's own synced settings. */
var SBSC = (() => {
  // The gold coin (build-resources/credits-art/credits-coin-256.png, as a 96 px WebP)
  const COIN_SRC = "data:image/webp;base64,UklGRvIQAABXRUJQVlA4WAoAAAAQAAAAXwAAXwAAQUxQSFEEAAABoLRtmyHJHtAb8eXYto5t27Z2tm37rMa2bWtlW8e2zfjiexeNqsqMiJgAVNxnAgB19jnjxqd7jpwxd+7M0X2ev+XsA+sDgM88iu3EA2h19jPTdv/EEn95b87LF7UD4MQVxwmAbnfM+prVxhhVY1TVGI1Vf1j80EEAxBXDZUCj62b/RtKCRmOJFjVEkv8sv7UVID5/ToC2T79DUtVYdtNA8os3ewDiciZA+9e/IaMaK2yq5C/99gEkT05Q79EvSY3MpSn582vN4V1uBDh3MxmMubVAvn8DIDnJ0Kw/qcZcWyAnd4DkwQlO2UWLzH1UfnYpvKuYc7j3XwYWMpCvAr5CHn4AqSxojJzaBFIRj0azqcbCWuDaTpAKeLRcwcBC/893e0DK5tFiPQMLHvj+PpAyeddoJQMLr3ynM3xZnPg5DExg4KamzpVDMICBSQyc5cWVJribgYkMfBtSkscJ/6ilwpRXQUpwvsleKpNp9n0X52snGEBlQpXzILUSnG1qKaHyJkhtfL0djEyq2TdtvKtJ8AiViVX2ga/BuzbfWkyNxX8Odr46wWtUJlc5HlKNc21/MEsP7b9Dna+S4WkqE6wcDAHgXIMPLKbI7JcOcIDgGkYmWfkYBPCYbZqqzeLg0OV3Wppoejx8hjuoTLTyDWQes9MVuUkcWnxLS5Xx3wOAs2lMtvJm4BmGdAUOBqZT0xW53tXdw5gu43cd9/mZli5STznDmPLIG29kTNtLz6RNObRn6uaNoqYscuWM1G2ek7rtcxlTZtw+k5qyyC2jU7e6N2PaFjyfNuWIW9MW+drZxrTdesCvtIRZPKP+e4zpMv7YFXOp6YrcIniFIV2Bo4CLGNOlvAto+zMtVUY9DB5LqKmK3FXHZXgoXYG9kHns9w9TbTwDAo+lpmmK3FsXDhluYqKULyEDHJp/aTFFZn/uAw9A8CZDipST4AHAu26/myUo6omQKhD0o6ZHOQ8e1XrX9bdoqbGoJ0Cqg+A1amqU4yGo0flmH1tMi8VfujtfEwTXMqRF+RgEtRVMpaZEuSbzrlbetf+Klg6Lfx4Kj9oLLqZaMgLvhKBUwasMqQgcBUHJTjCNIQ2Ba+t7Vxqca7yeIQXKjzrCo5weHfdSi6f85hAIyuvR432Goim/Pw4Zyi3o8S7/L1bg18ciQ/kFnTcwFCnww0ORoZKCZjMZY1FMubozBJX1wNukFkPJEQ0gqLRzuPobquXPAv+4C/DIoaDbHFItZ0quOALeIZcC3PoFqZYjNf78hECQV+/QtvffpFo+TI0cuw+cR44FOGzMv6TGykUlbdZJgCDfToAjh/xCMkSrQFQj/5x8KuA9cu8F6PLoBiOpIVppFlVJcsfz+wHeo5BeAHfiG5v+Z9UYNcZoFmPUGFnVdvY8KwPEo7BOAOCAmwat+yay1O+3jLzz8AxA5lFo5zNU7XjyjS8Nmbdy8/btW1YvHPHqrWd0cwAg4lBpAFZQOCB6DAAAEC8AnQEqYABgAD49FolDIiEhFqxHbCADxLUAXZmhQ7Pc/NesD+U/E/N9mwtof631SeKb0p/2u9S/nUf6r1Wf5X1AP7n/jOsW/cD2AP2x9Nr91vgp/dP9xfgN/Yb/85yr8gHlJ/n/CnyQ+683bMvxYeSb8CfnvNXvH4AXsP+9flp/SvfV2Ad8zsP+p/4H9H9gL2Y+qf6rjM8QD9Xv9NxtFAD+V/1b/f/4b3Wf6j/u/6b8zPbp9M/9n/M/4f5Bf5d/UP9l/ev3s/yHzd+z30YP1mURrcTX8NCueWlp4NHrlYrBwefl65gHLAsFJjiPf10f/ka6oCoRhXo/XP5ghVf/54jkeM9mzJAiK9+2xfPVNIKg1YMTJulMc3hxyod4kT1rUkq3CdWDKpEM6YYlQS9o4bruCsT0CFvG4ZDuml6oH7ayApxrqyBlzpWGDqgOS3Cn6HwExCk5wfgY2LDLDTPYDciVI4atff8VBB+LGX0/k/7cSXx9FLHnOUJ63pZtjPWoAAD+/5OFz6XLCrAvfytXDYUBWe8daHaVW6jaUHIj/kgFC9tISN+mFScbQqOotuvVqC4iVJsXDic/elJa/qdGmM+spKpQ2+zpgRnJc1Jz9EKFGxV8XjMwUb3SC+gsUyC95PxYhdqRRc3YeRgleuePtFvfGdB4agFucxdm2m3hGEzAF3NUQtpVVYSHPUPZ8L+v9BsJoJibwcAIES7D9vJd1MrEyv23KelYN8dpwLUGtaM88DZqMnSTvQka65PLIWTQT+nX2lbKKcIrM4xy3SzCeUNV6sJS6nKU2sugk0pgYc5ZBeKSNvIY+JOqIRZybXZcGnU1Fy4RbdOrCsYFSqwIkqUbx9aFm54fht3KJ1ZKw3V/kMWjhdFo3wUFQrC0FeYnGlxUasDEWRq5s4Xvp1ZhoFZyq4UQEmQcq7B4vPAZrGlP/lxIrkxn4Da5yjI0HIEQuMsUqkQpYRrjPUva+V2ljHHb3QqgwkCd5ocwZMdip/YJEAkyZbQtRb1gzTfGX7QjRjiX3PavB8FQby2yGG0Kl7tEaTeGehBan00cDxiKBo/KXJdrj+YeCZDrH37E49gGqIflHUnJYfoJSxZgBSjzJ21yXsrbpqxoMemIYmUXP+LBMW/O+/KZoXI46gKaqJBJuWj3yJp6D1/Ik4Sz9Mi/7yQPxXMYMx6XJWKXdHbKToZ36QS1TbUv/sU/DUDI6Q+ngD/Y1xemfStVDMDwmWqzElqrGq0LLJoIATH+NY6NsgJ8XfDmWOvb2j+aZdZ98Pq6RXyVMB0MWCGMv5mLmWxuGtmOOJif5x0y97x3dSxAepOpuqm9USE2qkWObpLfsqo43xTd8AA5lBuLnXH0SYiAJxza/8ik9JYQCeEWYVtSc8L4VtGF8FSfmW1aKOn7kfkwVsjrEXrLluLU0EEP71dWemth9ZZTGUi/hu4qZqboI9j663GsvKbxFDvD8T7WHmYRJErtCmflraoF+l/UxFaytADVKer4q+/kTVUcRWvFwne9i315nqH77ETQqn+BErn8xqU4ei3Ox3NEo6DDM7aGlSnqZj5XEHmVdar1pG85sXsdqru+WHj3bloLqQPyZrEqKfWZW6tdbx3MeUTf6vL/Le1QJI87QlNjIJ3wNw0m1og/cNtmkYqNwxnl3z+/LxFaSLvCiUFl2XWaNvoGa6jUYxIyL7Xy3uA5Vh3iBazevr9TCc8b1iaoSHGbMBr0eKM2/+klH7WxMZaSU4Lt8vVpNr5qCkBCM83HiKZSyvQnjk2k9mbmaQwsfEp+/GKFMjBHl5wwrMOyZ/L157akWiyMRNrPKtlcFjY8ipYMZZlj+J0nxzw3YjD0aPSx+xdBpWWGmgcjshh+OkRf8xRErzVZR23W8AhjHxhSGLdLFpJw9qQiqW5V9+2XyetQCoHdRIh/v6Yivcb5K1GaildfzUBW0vB3PyUxzDk9+zbIxWRqJsOehD11fWd9xnLmBSKxnsebux5YTjDb6Jx05jO61Jkn/TnX6/BIpJ9bILbCnTnaAaLLNjaYYndTMO0qv5YGJA996v5Rp2NWDX0HO989llwDC7DMizKE5DZtttuQHlSw/8udP98VnNTWCcym7tijlewy1jueN62VaZsOz+M8yETmYG5zDCvKAgKjoDBc+ouTrH/sfk0V8xIrXPHYcF/vj6T9JIrZwU/FFLISC+WG9B3piDKy37JkeqcthdXWHum/4oPQcirtf7k4kcDBTTp4/327Ne6Sf20kXSZRZ3p+3RbhF7uIu7kpUSICitovQgu0kcG5uBcjmv5cu92wmaJRGdfswNxJhf1W6cgWm71RiRH75mujqXJhUGr00g2slJ4V77WCfbN96h7QZwEC/dyJzwfbjtenzNeXfPhJGo+SCIhHNA3i/l/P7APgKx9AbcsMmoaOK+V9ihqOlQzGvW1saKT6o3/ZdGmzQKZD5OCM0YSjbHpaBVYlbk/54/IBmCTJyZ3uPlyuEAUyOPGykFBvJ7BfjhGbI12bSMq8M4Dz8Ydnl3w9GGujvOKZHwMqKbyPUqnb0zqNRw/HqfknLHOUY9LHVpDuVGDIPKCaEiukXFO6WgBGz+aT1KxMY+5oT3DIHbtezY6h5rPDejUqJLxaE2L+cw+j5r1gXxXFIWP2V3jd2EtUIcs/CwnG5oJ+r8bmr8YOrUBQNLYpyyq0usOe3sICz7MDgxLn8ZdUGYNiiNf++8x+6XNWufDyWzuLvIad2I3c4hmNR/kYDvRbFvBFREA8/gvpGuWIqVlH20/0yV4Qu5ikrF513lQASANNeZnX6LrAsAAsfQHUtAGOvSkkaq6vVOPCdRMcMl0fkwKd1kM1sUZ8DbAyNoyFxVYpWgMUaPnzsFcQdTx08xWhVmDxy14gnzO0IeQj6fb1Uu/1cRsxhV7tbH/1n2NO3oJV26+HvRfmDAExiSNoh8hxAylZIYZ5Bdk9MZHOaMYPqaJAIB24Jtqw6H1+kbH/vlVE7zCoF9GvPiX0AaV7pyXigZ8SqWu+OWU85OPWOv7kYNpYR9MiSoxombMP4D0f0v+g6kc1orQSGcb7w5cQXqRWONfYaG2VpGt9re5GI4EMgCDtYPSYw4xsC/p+k187VMXzVBV18jA0bdKvl8cz6dvwCPNPaOiXHjQ7zl0ygXCPccfqNK1I6zzpfZC6o68+FtlrJzwNXK+mLrBlIQ0SfM+D1yk7noI6/z6tXv8eng+Pxx0XU7Vu6IE2l8+N973+Wxjc+uK48Mrhj/UdPFgUQrDC9Jida4DE/4iRzGNV0sDUROOPuVvSnSZ62YOmXf7AnkDhhCh1nNAZ1yy8Nc6DDhbZw08b28nhhMKpiwxVPC8hru95CVjGTSA+bFhLOaxGpbzOzp2E5kOmdNDikpK3+9xtw4GWHqIF4l1u596tNABZNyFuX82D0e5Dpc6i5bmkcBuRGywTI0Vmb9/f9vY3FTD6MZqe7QFfrlpBaLgfxZ926e0/RIu4HTvJPiabf+A53r5/VWX5NT23mG5kXHAUD2IaeTWCjsjztIhF0EztPq88LCZJHSRlL2FU2VZfCsjsDcpzHDDssosXrbgo0Vpd4T4aH+GErFV07jI0dqYHZ7nB24y9FY30Rw1ho9xjV8U8eRuQHNWUYWfAybp/emeC3eB6Sq68GiFguHuHG8yAvzNTWZJ0vVXpBQMfpUL7D2bjFChx3JrNkMPsbPn760jYhL1Wu1WEkuc7vVhHk1O4wT5cPHHkIMFfnNd937/wvgpf155gZWhutBE1eCLdoXtRe5H67948HzS5Xd0y/tXoDoEuDharNU5pWZINcU7GBP1Zr8RQu8PoUmCXsZjx2jZH5ugqRjMWYAJg7ZI6xTWjx5krKbihYJVnLlDx+Dj2ohiT5pBnI0xCJ2n2p4v4YJRoPtmUAKoOgO9o1xshsTwR8EIVYsdWi9vc95escl+gVduLtoaBN/o1h74WtybG7umB38/uOfesh+ich1bysV35hw7a5sb+kkdrD3Rv/GE7+m7T204mc5oLl6fqr9pF1oJMLEz9pzVpIcYm6sv7oHXx+4NUNh6WL9IShomFnxA69B8+BdaVkkoEa/f90vxQ/DyGfTSXmWeuATG3UCCIsjj798Qa4TzW2PUJSwulH03d8tKhOpA9Odn516FjnSbVs7MDZllHfOo//LLT34Ko1dwvQuteYQ8tgAUULvZKhTHEzJTwuiV6ABHcDzACRoKtjEZLKFh/oOy9DQ24oggcH9Lq21OnzkhV8pLpQpGtg7i1+1MAAAA=";
  const coin = (px = 18) => `<img class="scr-coin" src="${COIN_SRC}" width="${px}" height="${px}" alt="" aria-hidden="true">`;

  /* ---------- What each kind of work earns ---------- */
  const TASK_PTS = {Exam: 40, Project: 30, Quiz: 20, Assignment: 12, Lab: 12, Reading: 6, Study: 6, Other: 4};
  const TASK_STEP = 3, TASKS_A_DAY = 8, FOCUS_MIN_A_DAY = 180;
  // Quizzes: 1 per right answer, +5 for passing (70%+ of 3 or more questions), +5 more for a perfect score; up to 3 tries of a quiz a day
  const QUIZ_PASS = 5, QUIZ_PERFECT = 5, QUIZ_TRIES_A_DAY = 3;
  // Presentations: 3 for each slide inside its time, +20 when the whole run lands on target, +30 more the first time it does; 2 runs a day each
  const PRES_SLIDE = 3, PRES_WHOLE = 20, PRES_MASTER = 30, PRES_RUNS_A_DAY = 2;
  // In the order the Wardrobe lists them: [key, name, how it's earned]
  const KINDS = [
    ["focus", "Focus Time", "1 credit for every 2 minutes on the focus timer (up to 3 hours a day)"],
    ["cards", "Flashcards", "1 credit for every card you review (up to 150 a day)"],
    ["quiz", "Practice Quizzes", "1 credit for each right answer, +5 for passing (70% or more), +5 more for a perfect score"],
    ["task", "Tasks", "By how big the task is: an exam 40, a project 30, a quiz 20, an assignment or lab 12, a reading 6 (up to 8 tasks a day)"],
    ["pres", "Presentations", `${PRES_SLIDE} for each slide inside its time, +${PRES_WHOLE} when the whole talk is on target, +${PRES_MASTER} more the first time`]
  ];
  // Worked out from saved work (focus minutes, cards reviewed, finished tasks); quizzes and presentation runs are written down as they end
  const DERIVED = ["focus", "task"];
  // Flashcards: each review counted on the day it happens (sc.cd {day: reviews}), at most CARDS_A_DAY a day
  const CARDS_A_DAY = 150;

  const sc = () => { const s = state.settings && state.settings.sc; return s && typeof s === "object" ? s : {}; };
  function setSc(patch){
    const cur = sc(), next = Object.assign({}, cur, patch);
    ["hw", "ev", "own", "evOld", "cd", "chd", "wsw", "wpro"].forEach(k => { if (patch[k]) next[k] = Object.assign({}, cur[k], patch[k]); });
    // events older than 45 days fold into one total per kind, so the list stays small
    const old = addDays(todayISO(), -45), ev = Object.assign({}, next.ev), fold = Object.assign({}, next.evOld);
    Object.keys(ev).forEach(k => { const m = /^(quiz|pres|chest|spin):(\d{4}-\d{2}-\d{2}):/.exec(k); if (m && m[2] < old) { fold[m[1]] = (Number(fold[m[1]]) || 0) + (Number(ev[k]) || 0); delete ev[k]; } });
    next.ev = ev; next.evOld = fold;
    // card days older than 45 days fold into one total (already capped)
    const cd = Object.assign({}, next.cd); let cdOld = Number(next.cdOld) || 0;
    Object.keys(cd).forEach(d => { if (d < old) { cdOld += Math.min(CARDS_A_DAY, Number(cd[d]) || 0); delete cd[d]; } });
    next.cd = cd; next.cdOld = cdOld;
    state.settings = Object.assign({}, state.settings, {sc: next});
    saveSettings();
  }
  const dayOf = ms => { const d = new Date(Number(ms) || 0); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const tr = (f, dflt = 0) => { try { return f(); } catch (e) { return dflt; } };
  const taskPts = t => t.breakdownOf ? TASK_STEP : TASK_PTS[t.type] || TASK_PTS.Other;

  // What's saved now, per kind (in credits, before rounding)
  const quizPts = (right, total) => (total >= 3 && right / total >= 0.7 ? QUIZ_PASS + (right >= total ? QUIZ_PERFECT : 0) : 0) + Math.max(0, right);
  // quizzes taken before they were written down one by one (each deck keeps only its last 20 results, so they're counted once, at the start)
  const savedQuizPts = () => { let n = 0; tr(() => Object.values(state.decks || {}).forEach(d => (d.quizzes || []).forEach(r => { n += quizPts(Number(r && r.score) || 0, Number(r && r.total) || 0); }))); return n; };
  function current(){
    const out = {focus: 0, task: 0};
    // focus: each day's minutes up to FOCUS_MIN_A_DAY (minutes only kept on tasks, from before days were logged, count as they are)
    out.focus = tr(() => {
      if (typeof SBSTATS === "undefined") return 0;
      const days = Object.values(SBSTATS.focusDays()).map(m => Number(m) || 0), logged = days.reduce((n, m) => n + m, 0);
      const capped = days.reduce((n, m) => n + Math.min(m, FOCUS_MIN_A_DAY), 0), extra = Math.max(0, SBSTATS.totalFocusMinutes() - logged);
      return (capped + extra) / 2;
    });
    tr(() => {
      // finished tasks, by the day they were finished: the biggest ones first, at most TASKS_A_DAY a day
      const per = {};
      Object.values(state.tasks || {}).forEach(t => { if (!t || t.status !== "done") return; const k = t.doneAt ? dayOf(t.doneAt) : "?"; (per[k] = per[k] || []).push(taskPts(t)); });
      Object.values(per).forEach(l => { out.task += l.sort((a, b) => b - a).slice(0, TASKS_A_DAY).reduce((n, x) => n + x, 0); });
    });
    return out;
  }
  // Card reviews: those from before they were counted by day are counted once (sc.cbase, every card's lifetime reviews then);
  // since then each review is added to its day as it's rated (in memory first, saved every few cards and at the session's end)
  const seenSum = () => { let n = 0; tr(() => Object.values(state.decks || {}).forEach(d => (d.cards || []).forEach(c => { n += Number(c && c.seen) || 0; }))); return n; };
  const pend = {};
  const dayCards = d => Math.max(0, (Number((sc().cd || {})[d]) || 0) + (pend[d] || 0));
  function cardsTotal(){
    const base = sc().cbase != null ? Number(sc().cbase) || 0 : Math.max(Number((sc().hw || {}).cards) || 0, seenSum());
    const days = new Set(Object.keys(sc().cd || {}).concat(Object.keys(pend)));
    let n = Number(sc().cdOld) || 0; days.forEach(d => { n += Math.min(CARDS_A_DAY, dayCards(d)); });
    return base + n;
  }
  let pendN = 0;
  function flushCards(){
    const keys = Object.keys(pend); if (!keys.length) return;
    const up = {}; keys.forEach(d => { up[d] = dayCards(d); delete pend[d]; }); pendN = 0;
    setSc({cd: up}); invalidate();
  }
  function cardRated(k){
    // the first review counted this way: everything before it (this one's already in its card's count) is the base
    if (sc().cbase == null) setSc({cbase: Math.max(Number((sc().hw || {}).cards) || 0, seenSum() - (k > 0 ? 1 : 0))});
    const d = todayISO(); pend[d] = (pend[d] || 0) + k; invalidate();
    if (++pendN >= 15) flushCards();
  }
  // Each card counts once per study session, however it was rated: a card marked Again comes back in the same session, and
  // seeing it again earns nothing more (so credits follow how many cards were gone through, never the ratings)
  const sessSeen = () => { try { const f = ui.fc; if (!f || f.mode !== "study") return null; return f.crSeen = f.crSeen || {}; } catch (e) { return null; } };
  hook("fc-rated", e => { const m = sessSeen(), id = e && e.cardId; if (m && id) { m[id] = (m[id] || 0) + 1; if (m[id] > 1) return; if (m[id] === 1) rollChest("cards"); } cardRated(1); });
  hook("fc-unrated", e => { const m = sessSeen(), id = e && e.cardId; if (m && id && m[id]) { m[id]--; if (m[id] > 0) return; } cardRated(-1); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) flushCards(); });
  window.addEventListener("pagehide", flushCards);
  const evSum = kind => Object.entries(sc().ev || {}).reduce((n, [k, v]) => n + (k.indexOf(kind + ":") === 0 ? Number(v) || 0 : 0), 0) + (Number((sc().evOld || {})[kind]) || 0);
  // Each kind's total: what's saved now, or the most it has ever been (so deleting old work never takes credits away)
  let cache = null, cacheAt = 0;
  function totals(){
    const now = Date.now(); if (cache && now - cacheAt < 1500) return cache;
    const cur = current(), hw = sc().hw || {}, by = {};
    DERIVED.forEach(k => { by[k] = Math.max(Number(hw[k]) || 0, cur[k] || 0); });
    by.quiz = (sc().qbase != null ? Number(sc().qbase) || 0 : Math.max(Number(hw.quiz) || 0, savedQuizPts())) + evSum("quiz");
    by.pres = evSum("pres");
    by.chest = evSum("chest");
    by.spin = evSum("spin");
    by.cards = cardsTotal();
    const earned = Math.floor(Object.values(by).reduce((n, x) => n + x, 0));
    cache = {by, cur, earned}; cacheAt = now;
    return cache;
  }
  const invalidate = () => { cache = null; };
  const spent = () => Object.values(sc().own || {}).reduce((n, v) => n + (Number(v) || 0), 0);
  const earned = fresh => { if (fresh) invalidate(); return totals().earned; };
  const balance = () => Math.max(0, earned() - spent());
  // Keep each kind's highest total in the synced settings, now and then (not on every card: a minute apart at most)
  let hwAt = 0;
  function keepHigh(force){
    if (!force && Date.now() - hwAt < 60000) return;
    const t = totals(), hw = sc().hw || {}, up = {};
    DERIVED.forEach(k => { const v = Math.floor(t.cur[k] * 10) / 10; if (v > (Number(hw[k]) || 0)) up[k] = v; });
    const patch = Object.keys(up).length ? {hw: up} : {};
    if (sc().qbase == null) patch.qbase = Math.max(Number(hw.quiz) || 0, savedQuizPts());
    if (sc().cbase == null) patch.cbase = Math.max(Number(hw.cards) || 0, seenSum());
    if (!Object.keys(patch).length) return;
    hwAt = Date.now(); setSc(patch);
  }

  /* ---------- Spending ---------- */
  // An accessory owned from before credits (98-companion.js, props earned by milestones then): kept for good, at no cost
  function grant(id){ if (!id || owns(id)) return; setSc({own: {[id]: 0}}); invalidate(); }
  const owns = id => !!id && Object.prototype.hasOwnProperty.call(sc().own || {}, id);
  // Pays for an accessory: true when bought (or already owned), false when there aren't enough credits
  function buy(id, price){
    price = Math.max(0, Math.round(Number(price) || 0));
    if (!id || owns(id)) return !!id;
    invalidate();
    if (balance() < price) return false;
    keepHigh(true);
    setSc({own: {[id]: price}});
    invalidate(); paintPills();
    return true;
  }

  /* ---------- Chests ----------
     Now and then finishing a piece of work turns up a chest: a flashcard gone through (each card once a session), a quiz question
     answered right, a focus session finished, a presentation slide practiced. It's found quietly (a small note, and a chest by the
     credits chip) and opened at the end of the session, just before the credits screen. Bigger work finds one more often.
     How rare a chest is follows the accessories' rarities and colours. At most CHESTS_A_DAY a day.
     A steady study day (20 cards, about 8 right quiz answers, a focus session) finds about one: a Common about every 2 days,
     an Uncommon every 4, a Rare a week, an Epic every 3 weeks and a Legendary about every 2 months.
     What's inside grows with the rarity, roughly in step with the prices (Common 100 up to Legendary 1,000), a little better
     for the rarer ones; on average a chest holds about 36 credits. */
  const CHEST = {
    common: {name: "Common", min: 12, max: 23, p: 0.54},
    uncommon: {name: "Uncommon", min: 27, max: 45, p: 0.25},
    rare: {name: "Rare", min: 45, max: 75, p: 0.145},
    exotic: {name: "Epic", min: 83, max: 135, p: 0.05},
    legendary: {name: "Legendary", min: 180, max: 300, p: 0.015}
  };
  const CHEST_CHANCE = {cards: 0.025, quiz: 0.04, focus: 0.25, pres: 0.04}, CHESTS_A_DAY = 4;
  const RIM = {common: "#8A93A3", uncommon: "#15803D", rare: "#2563EB", exotic: "#7C3AED", legendary: "#FACC15"};
  const pending = () => (Array.isArray(sc().chq) ? sc().chq : []).filter(c => c && CHEST[c.t]);
  function rollChest(kind){
    try {
      // tests can make every roll find one (window.__SB_TEST only)
      // in browser tests nothing is left to luck: no chests unless a test asks for one (window.__SB_TEST only)
      let chance = CHEST_CHANCE[kind] || 0; try { if (window.__SB_TEST) chance = localStorage.getItem("studyboard:chest-test") ? 1 : 0; } catch (e) {}
      if (Math.random() >= chance) return null;
      const day = todayISO(), found = Number((sc().chd || {})[day]) || 0; if (found >= CHESTS_A_DAY) return null;
      let r = Math.random(), t = "common"; try { const f = window.__SB_TEST && localStorage.getItem("studyboard:chest-test"); if (f && CHEST[f]) { t = f; r = -1; } } catch (e) {}
      if (r >= 0) for (const k of ["legendary", "exotic", "rare", "uncommon", "common"]) { if (r < CHEST[k].p) { t = k; break; } r -= CHEST[k].p; }
      const c = {id: uid(), t, c: CHEST[t].min + Math.floor(Math.random() * (CHEST[t].max - CHEST[t].min + 1)), k: kind, at: Date.now()};
      const old = Object.fromEntries(Object.entries(sc().chd || {}).filter(([d]) => d >= addDays(day, -7)));
      setSc({chq: pending().concat(c), chd: Object.assign(old, {[day]: found + 1})});
      if (kind !== "focus") foundNote(c);
      fire("chest-found", c);
      return c;
    } catch (e) { return null; }
  }
  const takeChests = () => { const l = pending(); if (l.length) setSc({chq: []}); return l; };
  // the chest, drawn: a wooden chest with metal bands and a rim in its rarity's colour (lid apart, so it can open)
  function chestSvg(t, small){
    const rim = RIM[t] || RIM.common, id = "ch" + Math.random().toString(36).slice(2, 7);
    return `<svg class="scr-chest${small ? " sm" : ""}" viewBox="0 0 120 112" aria-hidden="true"><defs>
      <linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B5763A"/><stop offset="1" stop-color="#7A4A1E"/></linearGradient>
      <linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C98A48"/><stop offset="1" stop-color="#94592A"/></linearGradient></defs>
      ${small ? "" : `<ellipse cx="60" cy="104" rx="46" ry="6" fill="rgba(0,0,0,.18)"/>`}
      <g class="ch-glow"><ellipse cx="60" cy="50" rx="40" ry="12" fill="${rim}" opacity=".9"/><ellipse cx="60" cy="50" rx="30" ry="7" fill="#fff" opacity=".85"/></g>
      <g class="ch-base"><rect x="14" y="50" width="92" height="50" rx="6" fill="url(#${id}w)" stroke="#2B2233" stroke-width="3"/>
        <path d="M18 66h84M18 82h84" stroke="#5A3412" stroke-opacity=".45" stroke-width="2"/>
        <rect x="24" y="50" width="10" height="50" fill="${rim}" stroke="#2B2233" stroke-width="2.5"/><rect x="86" y="50" width="10" height="50" fill="${rim}" stroke="#2B2233" stroke-width="2.5"/>
        <rect x="14" y="50" width="92" height="7" fill="${rim}" stroke="#2B2233" stroke-width="2.5"/>
        <rect x="51" y="54" width="18" height="20" rx="3.5" fill="#F2C14E" stroke="#2B2233" stroke-width="2.5"/><circle cx="60" cy="62" r="2.6" fill="#2B2233"/><path d="M60 63v5" stroke="#2B2233" stroke-width="2.4" stroke-linecap="round"/></g>
      <g class="ch-lid"><path d="M14 50V34Q14 12 60 12Q106 12 106 34V50Z" fill="url(#${id}l)" stroke="#2B2233" stroke-width="3" stroke-linejoin="round"/>
        <path d="M24 50V27Q24 17 34 15.5V50ZM86 50V15.5Q96 17 96 27V50Z" fill="${rim}" stroke="#2B2233" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M14 44h92" stroke="#2B2233" stroke-width="2.5"/><path d="M30 24Q60 16 90 24" stroke="#fff" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/>
        <rect x="51" y="40" width="18" height="12" rx="3" fill="#F2C14E" stroke="#2B2233" stroke-width="2.5"/></g></svg>`;
  }
  // Found: a small note near the top that goes by itself (nothing to tap, nothing in the way)
  function foundNote(c){
    if (screensOff()) return;
    try {
      const o = document.createElement("div"); o.className = "scr-found ch-" + c.t + (calm() ? " scr-still" : ""); o.setAttribute("role", "status"); o.setAttribute("aria-live", "polite");
      if (o.showPopover) o.setAttribute("popover", "manual");
      // the very first chest a student finds also says when it opens; after that, the name is enough
      const first = !sc().chSeen; if (first) setSc({chSeen: 1});
      o.innerHTML = `<span class="scr-found-ic">${chestSvg(c.t, true)}</span><span><b>${CHEST[c.t].name} Chest found!</b>${first ? "<small>Opens at the end</small>" : ""}</span>`;
      document.body.appendChild(o); try { if (o.showPopover) o.showPopover(); } catch (e) {}
      placeNote(o);
      requestAnimationFrame(() => o.classList.add("show"));
      setTimeout(() => { o.classList.remove("show"); setTimeout(() => { try { if (o.hidePopover && o.matches(":popover-open")) o.hidePopover(); } catch (e) {} o.remove(); }, 400); }, 2600);
    } catch (e) {}
    document.querySelectorAll("[data-scr-chests]").forEach(el => { el.innerHTML = chestsHtml(); });
  }
  // Where the note goes: in a presentation run, centred just under its top bar (the slides fill the middle and the filmstrip the
  // bottom); in a flashcard session or a quiz, centred on the page's content near the bottom of the screen, above a phone's tab bar
  function placeNote(o){
    try {
      const st = document.getElementById("prStage"), top = st && st.querySelector(".pr-top");
      if (top) { const r = top.getBoundingClientRect(); o.classList.add("at-top"); o.style.top = Math.round(r.bottom + 10) + "px"; o.style.left = Math.round(innerWidth / 2) + "px"; return; }
      const v = document.getElementById("view"), vr = v && v.getBoundingClientRect();
      o.style.left = Math.round(vr && vr.width ? vr.left + vr.width / 2 : innerWidth / 2) + "px";
      // anything fixed along the bottom (a phone's tab bar): the note sits above it
      let edge = innerHeight, e = document.elementFromPoint(innerWidth / 2, innerHeight - 20);
      while (e && e !== document.body && e !== document.documentElement) { const cs = getComputedStyle(e); if (!o.contains(e) && (cs.position === "fixed" || cs.position === "sticky")) { edge = Math.min(edge, e.getBoundingClientRect().top); break; } e = e.parentElement; }
      // (more room on a phone, where the companion sits up out of the tab bar)
      o.style.bottom = Math.round(innerHeight - edge + (innerWidth < 640 && edge < innerHeight ? 34 : 14)) + "px";
    } catch (e) {}
  }
  // the chests waiting to be opened, as little icons (beside the credits chip while studying)
  const chestsHtml = () => pending().slice(0, 4).map(c => `<span class="scr-mini-ch ch-${c.t}" title="${CHEST[c.t].name} chest">${chestSvg(c.t, true)}</span>`).join("");
  // Opening: one chest at a time, in the middle of the screen. Tap it (or Open) and the lid flies up in a burst of its colour,
  // coins spill out and its credits count up. Then the next one, or on to the credits screen
  // An open modal dialog (the Focus timer, a sheet) makes the rest of the page inert, popovers included, so a screen shown over one
  // couldn't be tapped: it goes inside the top one, and moves out (to the next one, or the page) when that dialog closes
  const topModal = () => { const l = [...document.querySelectorAll("dialog[open]")].filter(d => { try { return d.matches(":modal"); } catch (e) { return false; } }); return l[l.length - 1] || null; };
  function mount(o){
    const host = topModal() || document.body;
    host.appendChild(o);
    try { if (o.showPopover && !o.matches(":popover-open")) o.showPopover(); } catch (e) {}
    if (host !== document.body) host.addEventListener("close", function moved(){ host.removeEventListener("close", moved); if (o.isConnected && host.contains(o)) mount(o); });
  }
  function openChests(list, done){
    const still = calm(), o = document.createElement("div");
    o.className = "scr-rw scr-ch" + (still ? " scr-still" : ""); o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-labelledby", "scrChT");
    if (o.showPopover) o.setAttribute("popover", "manual");
    mount(o);
    let i = 0, opened = false;
    const draw = () => {
      const c = list[i]; opened = false;
      o.className = `scr-rw scr-ch ch-${c.t}` + (still ? " scr-still" : "");
      o.innerHTML = `<div class="scr-dim"></div><div class="scr-ch-box">
        <span class="scr-kick ch-kick">${list.length > 1 ? `Chest ${i + 1} of ${list.length}` : "You found a chest!"}</span>
        <h2 id="scrChT">${CHEST[c.t].name} Chest</h2>
        <button type="button" class="scr-ch-stage" data-ch="open" aria-label="Open the ${CHEST[c.t].name} chest"><span class="scr-ch-rays"></span>${chestSvg(c.t)}<span class="scr-ch-coins" aria-hidden="true"></span></button>
        <p class="scr-ch-amt" aria-live="polite"><span class="scr-ch-hint">Tap to open</span></p>
        <div class="scr-acts"><button type="button" class="btn primary scr-go" data-ch="open">Open</button></div></div>`;
      setTimeout(() => { const b = o.querySelector(".scr-go"); if (b) try { b.focus({preventScroll: true}); } catch (e) {} }, 60);
    };
    const open = () => {
      if (opened) { i++; if (i < list.length) draw(); else close(); return; }
      opened = true; const c = list[i];
      o.classList.add("is-open");
      try { if (typeof sbHaptic === "function") sbHaptic(c.t === "common" ? "tap" : "success", {force: true}); } catch (e) {}
      sfx("chest", {rarity: c.t}); setTimeout(() => coinRun(c.c, Math.min(1200, 400 + c.c * 6)), still ? 300 : 700);
      const coins = o.querySelector(".scr-ch-coins");
      if (coins && !still) coins.innerHTML = Array.from({length: c.t === "legendary" ? 14 : c.t === "exotic" ? 11 : c.t === "rare" ? 8 : 6}, (_, k) => `<img src="${COIN_SRC}" alt="" style="--x:${Math.round((k % 2 ? 1 : -1) * (14 + (k * 37) % 90))}px;--y:${-70 - (k * 53) % 80}px;--d:${(k * 0.045).toFixed(2)}s">`).join("");
      const amt = o.querySelector(".scr-ch-amt");
      amt.innerHTML = `${coin(26)}<b>+<span data-n>${still ? c.c : 0}</span></b><span>credits</span>`;
      setTimeout(() => countUp(amt.querySelector("[data-n]"), 0, c.c, Math.min(1200, 400 + c.c * 6)), still ? 0 : 380);
      const b = o.querySelector(".scr-go"); if (b) b.textContent = i + 1 < list.length ? "Next Chest" : "Collect";
    };
    const close = () => { o.classList.add("scr-out"); setTimeout(() => { try { if (o.hidePopover && o.matches(":popover-open")) o.hidePopover(); } catch (e) {} o.remove(); done(); }, still ? 0 : 220); };
    o.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-ch]"); if (b) { if (b.classList.contains("scr-ch-stage") && opened) return; open(); } });
    o.addEventListener("keydown", e => { if (e.key === "Escape") { e.preventDefault(); while (i < list.length - 1) i++; opened = true; open(); } if (e.key === "Tab") e.preventDefault(); });
    draw();
  }
  // chests left from a session that ended without its screen (closed early): opened the next time things are calm
  function openLeftovers(){
    if (!pending().length) return;
    const ae = document.activeElement;
    if (studying() || rOpen || document.hidden || document.querySelector("dialog[open]") || (ae && (/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) || ae.isContentEditable))) { setTimeout(openLeftovers, 15000); return; }
    reward({kind: "hello", kick: "Chests to Open", title: "Found while you were studying", lines: [], showZero: true});
  }

  /* ---------- The prize wheel: a spin for an exam grade of 80% or more ----------
     A mark of 80% or more on an exam (typed in, or from the school site) earns a spin, once per exam,
     at most SPINS_A_WEEK a week (Monday to Sunday). The wheel has 12 prizes, each slice as big as its chance, so what you see is
     what you get: 1 Legendary accessory (2%), 2 Epic (4% each), 3 Rare (6% each), and coins: 25 (18%), 50 (16%), 75 (14%),
     100 (10%), 150 (8%), 200 (6%). The accessories are picked at random from ones the student doesn't own yet (none of a rarity
     left: that slice is coins instead, half its price). Marks already there when this first runs, and more than 3 arriving at
     once (a sync catching up), are counted as seen without a spin. A spin waits (sc.wsq) until it's spun.
     Pro: one free spin every week (Monday to Sunday) on top of the exam spins (sc.wpro marks the week's as given). The Wardrobe
     says so to free students, with Get Pro, and shows Pro students theirs. */
  const WHEEL_ITEMS = [["legendary", 1, 0.02], ["exotic", 2, 0.04], ["rare", 3, 0.06]];
  const WHEEL_COINS = [[25, 0.18], [50, 0.16], [75, 0.14], [100, 0.10], [150, 0.08], [200, 0.06]];
  // Pro: every spin (exam ones too) has double the accessory chances (4%, 8% each, 12% each: 56%), and the coins share the other 44%
  const WHEEL_COINS_PRO = [[25, 0.11], [50, 0.10], [75, 0.08], [100, 0.06], [150, 0.05], [200, 0.04]];
  const SPINS_A_WEEK = 3, ITEM_FALLBACK = {legendary: 500, exotic: 250, rare: 150};
  const gradePct = t => t && t.mark && !t.mark.ex && Number(t.mark.outOf) > 0 && t.mark.got !== "" && t.mark.got != null && !isNaN(Number(t.mark.got)) ? Number(t.mark.got) / Number(t.mark.outOf) * 100 : null;
  const weekKey = () => mondayOf(todayISO());
  const spinsLeftThisWeek = () => Math.max(0, SPINS_A_WEEK - (Number((sc().wsw || {})[weekKey()]) || 0));
  const spinQueue = () => (Array.isArray(sc().wsq) ? sc().wsq : []).filter(x => x && x.id);
  let gradesReady = false;
  function checkGrades(){
    if (!gradesReady) return;
    // exams only (a task of the type Exam)
    const good = Object.values(state.tasks || {}).filter(t => t && t.id && t.type === "Exam" && (gradePct(t) || 0) >= 80);
    const seenList = sc().wg;
    if (!Array.isArray(seenList)) { setSc({wg: good.map(t => t.id).slice(-800)}); return; }
    const seen = new Set(seenList), fresh = good.filter(t => !seen.has(t.id));
    if (!fresh.length) return;
    const ids = seenList.concat(fresh.map(t => t.id)).slice(-800);
    // more than 3 at once: a sync or an import catching up, not grades just earned
    if (fresh.length > 3) { setSc({wg: ids}); return; }
    const wk = weekKey(), used = Number((sc().wsw || {})[wk]) || 0, n = Math.max(0, Math.min(fresh.length, SPINS_A_WEEK - used));
    const add = fresh.slice(0, n).map(t => ({id: uid(), title: String(t.title || "").slice(0, 80), pct: Math.round(gradePct(t))}));
    setSc({wg: ids, wsq: spinQueue().concat(add), wsw: {[wk]: used + add.length}});
    if (add.length) setTimeout(spinSoon, 600);
  }
  // Pro's weekly spin (Pro only counts with the paywall on: with it off, everyone is Pro)
  let planTest = null; // browser tests only: {paywall, pro}
  const plan = () => { try { if (planTest) return planTest; return typeof PLAN !== "undefined" && !!PLAN ? {paywall: PLAN.paywall(), pro: PLAN.isPro()} : null; } catch (e) { return null; } };
  const proNow = () => { const x = plan(); return !!x && x.paywall && x.pro; };
  const proFree = () => { const x = plan(); return !!x && x.paywall && !x.pro; };
  function checkPro(){
    if (!gradesReady || !proNow()) return;
    const wk = weekKey();
    // this week's given already, or last week's still waiting to be spun (this week's comes once that one is)
    if ((sc().wpro || {})[wk] || spinQueue().some(x => x.pro)) return;
    setSc({wpro: {[wk]: 1}, wsq: spinQueue().concat([{id: uid(), pro: true}])});
    setTimeout(spinSoon, 600);
  }
  // A new student's welcome spin: once, when they first get into the app (the welcome setup done, and the App Tour finished or
  // skipped if they took it). 40-onboarding.js and 49-apptour.js call it; sc.wwel marks it given, so it never comes twice
  function welcomeSpin(){
    if (sc().wwel || spinQueue().some(x => x.welcome)) return false;
    setSc({wwel: 1, wsq: spinQueue().concat([{id: uid(), welcome: true}])});
    setTimeout(spinSoon, 900);
    return true;
  }
  const MINI_WHEEL = (() => { const cols = ["#F5B700", "#FFE7A8", "#7C3AED", "#FFD36B", "#2563EB", "#FFE7A8", "#E5484D", "#FFD36B"];
    const p = (d, r) => [20 + r * Math.sin(d * Math.PI / 180), 20 - r * Math.cos(d * Math.PI / 180)].map(v => v.toFixed(2));
    return `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="21" r="18" fill="#2B2233"/>${cols.map((c, k) => { const [x0, y0] = p(k * 45, 15), [x1, y1] = p(k * 45 + 45, 15); return `<path d="M20 20L${x0} ${y0}A15 15 0 0 1 ${x1} ${y1}Z" fill="${c}" transform="translate(0 1)"/>`; }).join("")}<circle cx="20" cy="21" r="4" fill="#FFF4C8" stroke="#2B2233" stroke-width="1.5"/><path d="M16 1.5h8l-4 7z" fill="#E5484D" stroke="#2B2233" stroke-width="1.2" stroke-linejoin="round"/></svg>`; })();
  // the Wardrobe's line about it: Get Pro for free students, their spin for Pro students, nothing with the paywall off
  function proSpinHtml(){
    if (proFree()) return `<div class="wh-pro"><span class="wh-pro-ic">${MINI_WHEEL}</span><span class="wh-pro-t"><b>A free spin every week with Pro</b><span class="mini">Spin the prize wheel for credits and Rare to Legendary accessories, on top of your exam spins.</span></span><button type="button" class="btn small wh-pro-btn" data-act="plan-open" data-reason="Pro members get a free prize wheel spin every week, for credits and Rare to Legendary accessories.">Get Pro</button></div>`;
    if (!proNow()) return "";
    const ready = spinQueue().some(x => x.pro), given = !!(sc().wpro || {})[weekKey()];
    return `<div class="wh-pro is-pro"><span class="wh-pro-ic">${MINI_WHEEL}</span><span class="wh-pro-t"><b>Your free Pro spin</b><span class="mini">${ready ? "This week's is ready." : given ? "Spun this week. The next one comes on Monday." : "One every week, on top of your exam spins."}</span></span>${ready ? `<button type="button" class="btn small wh-pro-btn" data-act="wh-pro-spin">Spin</button>` : ""}</div>`;
  }
  // the Wardrobe's Spin: the wheel straight away (over the sheet), then the Wardrobe redrawn
  function spinPro(after){ const sp = spinQueue().find(x => x.pro); if (!sp || rOpen) return false; showWheel(sp, after); return true; }
  // the wheel's prizes, freshly picked: [{k: "item"|"coins", r: rarity, id, name, n, p}]
  function wheelPrizes(){
    const list = (() => { try { return window.SBCOMP && SBCOMP.accList ? SBCOMP.accList() : []; } catch (e) { return []; } })();
    const out = [], used = new Set();
    const x2 = proNow();
    WHEEL_ITEMS.forEach(([r, count, p0]) => { const p = x2 ? p0 * 2 : p0;
      const pool = list.filter(a => a.rarity === r && !a.owned && !a.festive && !used.has(a.id));
      for (let i = 0; i < count; i++) {
        const a = pool.length ? pool.splice(Math.floor(Math.random() * pool.length), 1)[0] : null;
        if (a) { used.add(a.id); out.push({k: "item", r, id: a.id, name: a.name, p}); }
        else out.push({k: "coins", r, n: ITEM_FALLBACK[r], p});
      }
    });
    (x2 ? WHEEL_COINS_PRO : WHEEL_COINS).forEach(([n, p]) => out.push({k: "coins", r: "", n, p}));
    // items spread between the coins, so the small slices aren't all bunched together
    const mixed = []; const c2 = out.filter(x => !x.r), i2 = out.filter(x => x.r);
    while (c2.length || i2.length) { if (c2.length) mixed.push(c2.shift()); if (i2.length) mixed.push(i2.shift()); }
    return mixed;
  }
  const RCOL = {legendary: ["#FFE680", "#F5B700"], exotic: ["#B794FF", "#6D28D9"], rare: ["#7FB0FF", "#1D4ED8"]};
  // The wheel: 12 equal slices, so every prize shows (each accessory's own picture on a badge in its rarity's colour, each coin
  // prize a coin and its number). Which one it lands on follows the odds (the prize list under it says them); the slice sizes don't.
  function wheelSvg(prizes){
    const C = 160, R = 140, n = prizes.length, step = 360 / n, id = "wh" + Math.random().toString(36).slice(2, 6);
    const pt = (deg, r) => [C + r * Math.sin(deg * Math.PI / 180), C - r * Math.cos(deg * Math.PI / 180)];
    const defs = [`<radialGradient id="${id}c0" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#FFF8E1"/><stop offset="1" stop-color="#FFE7A8"/></radialGradient>`,
      `<radialGradient id="${id}c1" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#FFEDB8"/><stop offset="1" stop-color="#FFD36B"/></radialGradient>`]
      .concat(Object.entries(RCOL).map(([k, [a, b]]) => `<radialGradient id="${id}${k}" cx="50%" cy="50%" r="60%"><stop offset=".25" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`));
    let ci = 0;
    const slices = prizes.map((pz, k) => {
      const a0 = k * step, a1 = a0 + step, [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R), mid = a0 + step / 2;
      pz.mid = mid;
      const fill = pz.r && pz.k === "item" ? `url(#${id}${pz.r})` : pz.r ? `url(#${id}${pz.r})` : `url(#${id}c${(ci++) % 2})`;
      const path = `<path d="M${C} ${C}L${x0.toFixed(2)} ${y0.toFixed(2)}A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z" fill="${fill}" stroke="#2B2233" stroke-width="2.5"/>`;
      // the slice's prize, drawn upright at the top and turned round to its slice
      let art;
      if (pz.k === "item") {
        const ic = (window.SBCOMP && SBCOMP.propIcon ? SBCOMP.propIcon(pz.id) : "").replace("<svg ", `<svg x="${C - 19}" y="${C - R + 21}" width="38" height="38" `);
        const ring = {legendary: "#F5B700", exotic: "#7C3AED", rare: "#2563EB"}[pz.r] || "#2B2233";
        art = `<circle cx="${C}" cy="${C - R + 40}" r="25" fill="${ring}" stroke="#2B2233" stroke-width="2.5" class="wh-badge"/><circle cx="${C}" cy="${C - R + 40}" r="20" fill="#fff"/>${ic}${pz.r === "legendary" ? `<path d="M${C + 19} ${C - R + 14}l2.2 5 5 2.2-5 2.2-2.2 5-2.2-5-5-2.2 5-2.2z" fill="#fff" stroke="#F5B700" stroke-width="1.2"/>` : ""}`;
      } else {
        art = `<image href="${COIN_SRC}" x="${C - 15}" y="${C - R + 18}" width="30" height="30"/><text x="${C}" y="${C - R + 66}" text-anchor="middle" class="wh-n${pz.r ? " on-dark" : ""}">${pz.n}</text>`;
      }
      return path + `<g transform="rotate(${mid.toFixed(2)} ${C} ${C})" style="--cp-wear:#5B7FD6">${art}</g>`;
    }).join("");
    // lights round the rim, every other one lit
    const bulbs = Array.from({length: 24}, (_, k) => { const [bx, by] = pt(k * 15, R + 9); return `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="3.6" class="wh-bulb${k % 2 ? " b2" : ""}"/>`; }).join("");
    return `<svg class="wh-svg" viewBox="0 0 320 320" aria-hidden="true"><defs>${defs.join("")}<radialGradient id="${id}rim" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#4A3A6A"/><stop offset="1" stop-color="#231B33"/></radialGradient>
      <radialGradient id="${id}hub" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#FFF4C8"/><stop offset="1" stop-color="#E9A21C"/></radialGradient>
      <radialGradient id="${id}sh" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      <circle cx="${C}" cy="${C}" r="${R + 16}" fill="url(#${id}rim)"/><circle cx="${C}" cy="${C}" r="${R + 16}" fill="none" stroke="#F2C14E" stroke-width="3"/>${bulbs}
      ${slices}<circle cx="${C}" cy="${C}" r="${R}" fill="url(#${id}sh)" pointer-events="none"/><circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="#2B2233" stroke-width="3"/>
      <circle cx="${C}" cy="${C}" r="30" fill="url(#${id}hub)" stroke="#2B2233" stroke-width="3"/><image href="${COIN_SRC}" x="${C - 22}" y="${C - 22}" width="44" height="44"/></svg>`;
  }
  const prizeName = pz => pz.k === "item" ? pz.name : `${pz.n} credits`;
  const prizeIcon = pz => pz.k === "item" ? (window.SBCOMP && SBCOMP.propIcon ? SBCOMP.propIcon(pz.id) : "") : `<img src="${COIN_SRC}" alt="" width="28" height="28">`;
  const RNAME = {legendary: "Legendary", exotic: "Epic", rare: "Rare"};
  function spinSoon(){
    if (!spinQueue().length || screensOff()) return;
    const ae = document.activeElement;
    // (the welcome spin doesn't wait for an empty box the app put the cursor in: the welcome setup's Add My First Task)
    const typing = ae && (/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) || ae.isContentEditable) && !(spinQueue()[0].welcome && /^(INPUT|TEXTAREA)$/.test(ae.tagName) && !ae.value);
    if (rOpen || studying() || document.hidden || document.querySelector("dialog[open]") || typing) { setTimeout(spinSoon, 2500); return; }
    showWheel(spinQueue()[0]);
  }
  function showWheel(sp, after){
    rOpen = true;
    const still = calm(), prizes = wheelPrizes(), o = document.createElement("div");
    o.className = "scr-rw scr-wh" + (still ? " scr-still" : ""); o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-labelledby", "scrWhT");
    if (o.showPopover) o.setAttribute("popover", "manual");
    const list = prizes.slice().sort((a, b) => a.p - b.p), x2 = proNow(), X2 = `<span class="wh-x2">(x2) <span class="pro-badge">PRO</span></span>`;
    o.innerHTML = `<div class="scr-dim"></div><div class="scr-card wh-card">
      <div class="scr-head">${sp.welcome ? `<span class="scr-kick">Welcome to Studyboard!</span><h2 id="scrWhT">A free spin to start you off</h2>` : sp.pro ? `<span class="scr-kick scr-kick-pro">Weekly Pro Spin</span><h2 id="scrWhT">Your free spin this week</h2>` : `<span class="scr-kick">Great Exam Grade!</span><h2 id="scrWhT">${sp.pct}% on ${esc(sp.title || "your work")}</h2><p class="mini wh-sub">Spin the prize wheel. ${spinsLeftThisWeek() ? "" : "That's this week's last spin."}</p>`}</div>
      <div class="wh-stage"><span class="wh-ptr" aria-hidden="true"></span><div class="wh-clip"><div class="wh-rot">${wheelSvg(prizes)}</div></div></div>
      <div class="wh-result" aria-live="polite"></div>
      ${x2 ? `<p class="wh-x2-line">Accessory chances ${X2}</p>` : ""}
      <details class="wh-odds"><summary>What's on the wheel</summary><ul>${list.map(pz => `<li class="${pz.r ? "r-" + pz.r : ""}"><span class="wh-ic">${prizeIcon(pz)}</span><span>${esc(prizeName(pz))}${pz.r && pz.k === "item" ? ` <span class="cp-rar cp-rar-${pz.r}">${RNAME[pz.r]}</span>` : ""}</span>${x2 && pz.k === "item" ? X2 : ""}<b>${Math.round(pz.p * 1000) / 10}%</b></li>`).join("")}</ul></details>
      <div class="scr-acts"><button type="button" class="btn primary scr-go wh-go" data-wh="spin">Spin</button></div></div>`;
    mount(o);
    setTimeout(() => { const b = o.querySelector(".wh-go"); if (b) try { b.focus({preventScroll: true}); } catch (e) {} }, 80);
    let state0 = "ready", won = null;
    const spin = () => {
      state0 = "spinning";
      // the prize, by its chance; then a landing spot inside its slice
      let r = Math.random(); won = prizes[prizes.length - 1];
      for (const pz of prizes) { if (r < pz.p) { won = pz; break; } r -= pz.p; }
      const half = (360 / prizes.length) / 2 * 0.7, land = won.mid + (Math.random() * 2 - 1) * half, turns = still ? 0 : 5;
      const rot = o.querySelector(".wh-rot"); rot.style.transition = still ? "none" : "transform 4.4s cubic-bezier(.12,.78,.18,1)";
      rot.style.transform = `rotate(${turns * 360 - land}deg)`;
      const b = o.querySelector(".wh-go"); b.disabled = true; b.textContent = "Spinning…"; if (!still) o.classList.add("spinning");
      // the prize is the student's as soon as it's decided (closing the app mid-spin can't lose it)
      if (won.k === "item") grant(won.id); else { setSc({ev: {[`spin:${todayISO()}:${sp.id}`]: won.n}}); invalidate(); }
      setSc({wsq: spinQueue().filter(x => x.id !== sp.id)});
      try { if (typeof sbHaptic === "function") sbHaptic("tap"); } catch (e) {}
      // a click each time the pointer passes a slice, read from the wheel's real turn, so the clicks slow down with it
      if (!still) { sfx("whoosh"); const per = 360 / prizes.length; let last = null, until = performance.now() + 4600;
        const watch = () => { if (!o.isConnected || performance.now() > until) return; const m = getComputedStyle(rot).transform; let a = 0;
          if (m && m !== "none") { const v = m.match(/matrix\(([^)]+)\)/); if (v) { const p = v[1].split(",").map(Number); a = Math.atan2(p[1], p[0]) * 180 / Math.PI; } }
          const slice = Math.floor(((a % 360) + 360) % 360 / per); if (last != null && slice !== last) sfx("tick"); last = slice; requestAnimationFrame(watch); };
        requestAnimationFrame(watch); }
      setTimeout(landed, still ? 50 : 4500);
    };
    const landed = () => {
      state0 = "done"; o.classList.remove("spinning"); o.classList.add("wh-won", won.k === "item" ? "r-" + won.r : "r-coins");
      sfx("win", won.k === "item" ? {rarity: won.r} : {coins: true});
      try { if (typeof sbHaptic === "function") sbHaptic("success", {force: true}); } catch (e) {}
      const res = o.querySelector(".wh-result");
      res.innerHTML = won.k === "item"
        ? `<span class="wh-prize ch-${won.r}"><span class="wh-prize-ic">${prizeIcon(won)}</span></span><b>${esc(won.name)}</b><span class="cp-rar cp-rar-${won.r}">${RNAME[won.r]}</span><span class="mini">It's yours to keep.</span>`
        : `${coin(30)}<b>+${won.n} credits</b>`;
      const acts = o.querySelector(".scr-acts");
      acts.innerHTML = won.k === "item" ? `<button type="button" class="btn" data-wh="done">Later</button><button type="button" class="btn primary scr-go" data-wh="wear">Put It On</button>` : `<button type="button" class="btn primary scr-go" data-wh="done">Collect</button>`;
      setTimeout(() => { const b = acts.querySelector(".scr-go"); if (b) try { b.focus({preventScroll: true}); } catch (e) {} }, 60);
      seenTotal = totals().earned; paintPills();
    };
    const close = wear => {
      if (wear && won && won.k === "item") { try { if (window.SBCOMP && SBCOMP.wearId) SBCOMP.wearId(won.id); } catch (e) {} }
      o.classList.add("scr-out");
      setTimeout(() => { try { if (o.hidePopover && o.matches(":popover-open")) o.hidePopover(); } catch (e) {} o.remove(); rOpen = false; invalidate(); seenTotal = totals().earned; paintPills(); if (after) try { after(); } catch (e) {} setTimeout(() => { try { checkPro(); } catch (e) {} spinSoon(); }, 800); setTimeout(showNext, 300); }, still ? 0 : 220);
    };
    o.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-wh]"); if (!b) return; if (b.dataset.wh === "spin" && state0 === "ready") spin(); else if (state0 === "done") close(b.dataset.wh === "wear"); });
    o.addEventListener("keydown", e => { if (e.key === "Escape" && state0 === "done") { e.preventDefault(); close(false); } if (e.key === "Tab") { const bs = [...o.querySelectorAll("button:not([disabled]),summary")], i = bs.indexOf(document.activeElement); e.preventDefault(); const n = bs[(i + (e.shiftKey ? -1 : 1) + bs.length) % bs.length]; if (n) n.focus(); } });
  }

  /* ---------- The reward screen ----------
     At the end of a focus session, a flashcard session, a quiz, a presentation run and a finished task: the credits it earned,
     counting up in a shower of coins, line by line (what earned what), the balance going up, and a bar filling toward the next
     accessory (with Get It when it's within reach). A finished task gets a smaller card that goes away by itself. */
  let seenTotal = null, lastBy = null, doneSeen = null;
  const calm = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.SBMotion && SBMotion.level() !== "full"); } catch (e) { return false; } };
  const todayN = () => { const t = sc().today; return t && t.d === todayISO() ? Number(t.n) || 0 : 0; };
  /* ---------- How much more ready for an exam this work made you ----------
     Exam readiness (examReadiness, 01-helpers.js: the same number the exam shows everywhere) for each exam in the next 60 days,
     noted while nothing is being earned (readyBase); a reward screen shows the exams it went up for since then, before and
     after, with a soft chime. Readiness from somewhere else (another device, a slider) is noted quietly, never shown as earned. */
  const READY_DAYS = 60;
  let readyBase = null;
  const readyNow = () => {
    const m = {}, today = todayISO(), last = typeof addDays === "function" ? addDays(today, READY_DAYS) : "9999";
    try { Object.values(state.tasks || {}).forEach(t => {
      if (!t || !MILESTONE(t.type) || t.status === "done" || t.prepFor || !t.due || t.due < today || t.due > last) return;
      const r = examReadiness(t); m[t.id] = r && r.pct != null ? r.pct : 0;
    }); } catch (e) {}
    return m;
  };
  const readySet = () => { readyBase = readyNow(); };
  function readyUps(){
    const before = readyBase, now = readyNow(); readyBase = now;
    if (!before) return [];
    const today = todayISO();
    return Object.keys(now).filter(id => before[id] != null && now[id] - before[id] >= 1).map(id => {
      const t = state.tasks[id], days = Math.max(0, Math.round((parse(t.due) - parse(today)) / 864e5));
      return {id, title: t.title || "Exam", from: before[id], to: now[id], days};
    }).sort((a, b) => (b.to - b.from) - (a.to - a.from) || a.days - b.days).slice(0, 2);
  }
  // A soft, short rising chime (two bell-like notes), quiet, only when Reward Sounds is on (Settings, Appearance)
  const FX_KEY = "studyboard:fx";
  const fxOn = () => { try { return localStorage.getItem(FX_KEY) !== "off"; } catch (e) { return true; } };
  let fxAc = null;
  function chime(force){
    try {
      if ((!fxOn() && !force) || document.hidden || (window.__SB_TEST && !window.__SB_FX)) return;
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      fxAc = fxAc || new C(); if (fxAc.state === "suspended") fxAc.resume();
      const t0 = fxAc.currentTime + 0.02, out = fxAc.createGain(); out.gain.value = 0.11; out.connect(fxAc.destination);
      [[659.25, 0], [987.77, 0.11]].forEach(([f, at]) => {
        [[1, 1], [2.01, 0.18]].forEach(([mul, lv]) => {
          const o = fxAc.createOscillator(), g = fxAc.createGain(), s = t0 + at;
          o.type = "sine"; o.frequency.value = f * mul;
          g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(lv, s + 0.012); g.gain.exponentialRampToValueAtTime(0.0008, s + (mul > 1 ? 0.35 : 0.9));
          o.connect(g); g.connect(out); o.start(s); o.stop(s + 1);
        });
      });
    } catch (e) {}
  }
  window.SBSC_FX = force => chime(force);
  const TARGET = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>';
  const whenTxt = d => d === 0 ? "today" : d === 1 ? "tomorrow" : `in ${d} days`;
  const readyHtml = ups => !ups || !ups.length ? "" : `<div class="scr-ready" role="group" aria-label="Exam readiness">
      <div class="scr-ready-h">${TARGET}<span>Exam Readiness</span></div>
      ${ups.map(u => `<div class="scr-rd" data-from="${u.from}" data-to="${u.to}" aria-label="${esc(u.title)}: ${u.from} percent ready, now ${u.to} percent">
        <div class="scr-rd-top"><span class="scr-rd-t"><b>${esc(u.title)}</b><span class="mini">${whenTxt(u.days)}</span></span><span class="scr-rd-n"><b data-rn>${u.from}</b>%</span></div>
        <div class="scr-rd-bar" aria-hidden="true"><i class="scr-rd-was" style="width:${u.from}%"></i><i class="scr-rd-gain" style="left:${u.from}%;width:0"></i></div>
        <span class="scr-rd-up" aria-hidden="true">+${u.to - u.from}% ready</span></div>`).join("")}</div>`;
  // the bars fill to their new readiness, the numbers count up, and the chime plays once
  function readyPlay(o, still, at){
    const rows = [...o.querySelectorAll(".scr-rd")]; if (!rows.length) return;
    setTimeout(() => {
      if (!o.isConnected) return;
      rows.forEach((row, i) => setTimeout(() => {
        const a = Number(row.dataset.from), b = Number(row.dataset.to), g = row.querySelector(".scr-rd-gain");
        if (g) g.style.width = (b - a) + "%";
        countUp(row.querySelector("[data-rn]"), a, b, still ? 0 : 900);
        row.classList.add("on");
      }, still ? 0 : i * 260));
      chime();
      try { if (typeof sbHaptic === "function") sbHaptic("tap", {force: true}); } catch (e) {}
    }, still ? 0 : at);
  }
  const rq = []; let rOpen = false, rWait = 0;
  // What the credits are working toward: the cheapest accessory not owned yet (from the Wardrobe)
  const target = () => { try { const n = window.SBCOMP && SBCOMP.nextFor ? SBCOMP.nextFor() : null; return n ? Object.assign({icon: SBCOMP.propIcon ? SBCOMP.propIcon(n.id) : "", rarity: SBCOMP.rarityOf ? SBCOMP.rarityOf(n.id) : ""}, n) : null; } catch (e) { return null; } };
  // spec: {kind, kick, title, lines: [{t, n, s}], compact, sub}
  // A big screen first opens any chests found along the way (one by one), then shows the credits with a line for each chest
  function reward(spec){
    // the Focus timer's alarm comes first (Start Break, Mark Done); this screen follows once it's put away
    const al = document.getElementById("alarmDlg");
    // (meanwhile the quiet count waits, so it doesn't take this work's credits as arriving from elsewhere)
    if (al && al.open && !screensOff()) { rWait++; al.addEventListener("close", () => setTimeout(() => { rWait--; reward(spec); }, 300), {once: true}); return; }
    const ch = spec.compact ? [] : takeChests();
    if (!ch.length) { rewardNow(spec, []); return; }
    // the coins are added as the chests are opened (or at once, where the screens aren't shown)
    const credit = () => { setSc({ev: Object.fromEntries(ch.map(c => [`chest:${todayISO()}:${c.id}`, c.c]))}); invalidate(); };
    if (screensOff() || document.hidden) { credit(); rewardNow(spec, ch); return; }
    // while chests are being opened nothing else counts or shows (the session's own credits belong on the screen that follows)
    rOpen = true;
    openChests(ch, () => { rOpen = false; credit(); rewardNow(spec, ch); });
  }
  // sound effects (01-sfx.js): quiet when the effects are off or the app is in the background
  const sfx = (n, o) => { try { if (window.SBSFX) SBSFX.play(n, o); } catch (e) {} };
  // coins tinkling while a number counts up: a few for a small amount, more for a big one, over the count's time
  const coinRun = (n, ms) => { const k = Math.max(2, Math.min(14, Math.round(n / 3))); for (let i = 0; i < k; i++) setTimeout(() => sfx("coin", {i}), Math.round(i * ms / k)); };
  function rewardNow(spec, ch){
    invalidate();
    const now = totals().earned, before = seenTotal == null ? now - (spec.lines || []).reduce((a, l) => a + (l.n || 0), 0) : seenTotal;
    let gained = Math.max(0, now - before);
    seenTotal = now; lastBy = Object.assign({}, totals().by);
    keepHigh();
    const chestLines = (ch || []).map(c => ({t: `${CHEST[c.t].name} Chest`, n: c.c, s: "Found while you studied", chest: c.t}));
    const chestSum = chestLines.reduce((a, l) => a + l.n, 0);
    const lines = (spec.lines || []).filter(l => l && (l.n != null || l.s));
    // A single line shows what really counted: daily limits can make it less; it's never more than the work itself can earn (a
    // "fill" line, focus minutes or cards, takes what was added up to that most)
    if (lines.length === 1 && lines[0].n != null) lines[0].n = Math.max(0, Math.min(lines[0].fill || lines[0].n, gained - chestSum));
    lines.push(...chestLines);
    const sum = lines.reduce((a, l) => a + (l.n || 0), 0);
    // Credits that arrived some other way since the last count (another device, work counted after the app opened) were already
    // the student's: they're in the balance, never shown again as if earned now. The screen shows only this work's own credits.
    if (gained > sum) gained = Math.max(0, sum);
    else if (gained < sum) lines.push({t: "Over today's limit", n: gained - sum, s: "Some of it didn't count today"});
    // nothing earned: no screen at all (a limit reached, a quiz with no right answers); a pass, a good session or a mastered talk
    // still gets its sound
    if (!gained) { readySet(); if ((spec.sfx || 0) >= 2) sfx("reward", {level: spec.sfx}); return; }
    if (gained) setSc({today: {d: todayISO(), n: todayN() + gained}});
    const bal = balance();
    // the first screen ever also says what studying from before credits existed has already earned (it's in the balance)
    let welcome = 0;
    if (!sc().intro) { welcome = Math.max(0, bal - gained); setSc({intro: 1}); }
    rq.push(Object.assign({}, spec, {lines, gained, bal, bal0: bal - gained, day: todayN(), tgt: target(), welcome, ready: readyUps()}));
    showNext();
  }
  // browser tests see these screens only when they ask for them (credits are still counted), so older tests' clicks aren't covered
  const screensOff = () => { try { return !!window.__SB_TEST && localStorage.getItem("studyboard:rewards-test") !== "1"; } catch (e) { return false; } };
  function showNext(){
    if (screensOff()) { rq.length = 0; return; }
    if (rOpen || !rq.length) return;
    if (document.hidden) { document.addEventListener("visibilitychange", function once(){ if (!document.hidden) { document.removeEventListener("visibilitychange", once); showNext(); } }); return; }
    const r = rq.shift(); rOpen = true;
    try { (r.compact ? showCompact : showBig)(r); } catch (e) { console.warn("reward", e); rOpen = false; }
  }
  const countUp = (el, from, to, ms, done) => {
    if (!el) return; if (calm() || to === from) { el.textContent = to.toLocaleString(); if (done) done(); return; }
    const t0 = performance.now();
    const step = now => { if (!el.isConnected) return; const f = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - f, 3); el.textContent = Math.round(from + (to - from) * e).toLocaleString(); if (f < 1) requestAnimationFrame(step); else if (done) done(); };
    requestAnimationFrame(step);
  };
  const ICON = {focus: '<path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="8.5"/>', cards: '<rect x="3" y="6" width="14" height="12" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v10"/>',
    quiz: '<path d="M9 9a3 3 0 1 1 4 2.8c-.7.3-1 .9-1 1.7V15"/><circle cx="12" cy="18.5" r=".6"/><circle cx="12" cy="12" r="9.5"/>', task: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    pres: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/>', hello: '<path d="M12 3l2.6 5.6L20 9.4l-4 4.1.9 5.8L12 16.6 7.1 19.3l.9-5.8-4-4.1 5.4-.8z"/>'};
  const icon = k => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k] || ICON.hello}</svg>`;
  function showBig(r){
    const still = calm(), o = document.createElement("div");
    o.className = "scr-rw scr-k-" + r.kind + (still ? " scr-still" : ""); o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-labelledby", "scrRwT");
    if (o.showPopover) o.setAttribute("popover", "manual");
    const rain = still ? "" : Array.from({length: 16}, (_, i) => `<img class="scr-drop" src="${COIN_SRC}" alt="" style="left:${(i * 61 + 7) % 100}%;animation-delay:${(i * 0.137 % 1.1).toFixed(2)}s;width:${18 + (i * 7) % 16}px">`).join("");
    o.innerHTML = `<div class="scr-dim"></div><div class="scr-rain" aria-hidden="true">${rain}</div><div class="scr-card">
      <div class="scr-head"><span class="scr-kick">${icon(r.kind)}${esc(r.kick || "Nice Work!")}</span><h2 id="scrRwT">${esc(r.title || "")}</h2></div>
      <div class="scr-big" aria-live="polite"><span class="scr-big-coin"><img src="${COIN_SRC}" alt="" width="84" height="84"><i class="scr-shine"></i></span>
        <span class="scr-big-n">+<b data-n>${still ? r.gained.toLocaleString() : "0"}</b></span><span class="scr-big-l">Credits</span></div>
      ${r.welcome ? `<p class="scr-welcome"><b>Welcome to Studyboard Credits!</b> Your studying before today already earned you ${coin(16)}<b>${r.welcome.toLocaleString()}</b>. Spend them on accessories for your companion.</p>` : ""}
      <ul class="scr-lines">${r.lines.map((l, i) => `<li style="--d:${0.55 + i * 0.28}s"${l.chest ? ` class="scr-l-chest ch-${l.chest}"` : ""}>${l.chest ? `<span class="scr-l-ic" aria-hidden="true">${chestSvg(l.chest, true)}</span>` : ""}<span><b>${esc(l.t)}</b>${l.s ? `<span class="mini">${esc(l.s)}</span>` : ""}</span><em class="${(l.n || 0) < 0 ? "neg" : ""}">${(l.n || 0) < 0 ? "" : "+"}${(l.n || 0).toLocaleString()}</em></li>`).join("")}</ul>
      ${readyHtml(r.ready)}
      <div class="scr-stats"><span>Balance <b>${coin(16)}<span data-bal>${r.bal0.toLocaleString()}</span></b></span><span>Today <b>+${r.day.toLocaleString()}</b></span></div>
      <div class="scr-acts"><button type="button" class="btn scr-ward" data-scr="wardrobe">Wardrobe</button><button type="button" class="btn primary scr-go" data-scr="ok">Collect</button></div></div>`;
    mount(o);
    try { if (typeof sbHaptic === "function") sbHaptic("success", {force: true}); } catch (e) {}
    // the screen's sound: a stinger for how it went (r.sfx: 1 nice, 2 passed or on time, 3 perfect or mastered; 0 for a focus session,
    // whose timer has just chimed), then coins while the credits count up and a ding when they land
    const lvl = r.sfx != null ? r.sfx : r.kind === "focus" ? 0 : 1;
    if (lvl) sfx("reward", {level: lvl});
    const cMs = Math.min(1600, 500 + r.gained * 25);
    setTimeout(() => coinRun(r.gained, cMs), (still ? 0 : 350) + (lvl >= 2 ? 450 : 150));
    const big = o.querySelector("[data-n]"), balEl = o.querySelector("[data-bal]");
    const tickAt = 0.55 + r.lines.length * 0.28;
    readyPlay(o, still, tickAt * 1000 + 700);
    setTimeout(() => countUp(big, 0, r.gained, cMs, () => { o.classList.add("scr-landed"); sfx("coinLand"); try { if (typeof sbHaptic === "function") sbHaptic("tap"); } catch (e) {} }), still ? 0 : 350);
    setTimeout(() => countUp(balEl, r.bal0, r.bal, 900), still ? 0 : tickAt * 1000 + 200);
    const back = document.activeElement;
    setTimeout(() => { const b = o.querySelector(".scr-go"); if (b) try { b.focus({preventScroll: true}); } catch (e) {} }, 80);
    let closed = false;
    const close = go => {
      if (closed) return; closed = true; o.classList.add("scr-out");
      setTimeout(() => { try { if (o.hidePopover && o.matches(":popover-open")) o.hidePopover(); } catch (e) {} o.remove(); rOpen = false; paintPills(); setTimeout(showNext, 250); if (go) openWardrobe(); }, still ? 0 : 240);
      try { if (!go && back && back.isConnected && back.focus) back.focus({preventScroll: true}); } catch (e) {}
    };
    o.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-scr]"); if (b) close(b.dataset.scr === "wardrobe"); else if (e.target.classList && e.target.classList.contains("scr-dim")) close(false); });
    o.addEventListener("keydown", e => { if (e.key === "Escape") { e.preventDefault(); close(false); } if (e.key === "Tab") { const bs = [...o.querySelectorAll("button")], i = bs.indexOf(document.activeElement); e.preventDefault(); const n = bs[(i + (e.shiftKey ? -1 : 1) + bs.length) % bs.length]; if (n) n.focus(); } });
  }
  // A finished task: a smaller card near the bottom that counts up and goes away by itself (tap it to close sooner); it shows only
  // what was earned, not what it's saving toward
  function showCompact(r){
    const still = calm(), o = document.createElement("div");
    o.className = "scr-mini scr-k-" + r.kind + (still ? " scr-still" : ""); o.setAttribute("role", "status"); o.setAttribute("aria-live", "polite");
    if (o.showPopover) o.setAttribute("popover", "manual");
    o.innerHTML = `<span class="scr-mini-coin"><img src="${COIN_SRC}" alt="" width="44" height="44"></span>
      <span class="scr-mini-t"><span class="scr-mini-k">${esc(r.kick || "Task Done")}</span><b>+<span data-n>${still ? r.gained : 0}</span> Credits</b><span class="mini">${esc(r.title || "")}</span>
      ${(r.ready || []).map(u => `<span class="scr-mini-rd">${TARGET}<span>${esc(u.title)}: <b>${u.from}% → ${u.to}%</b> ready</span></span>`).join("")}</span>`;
    mount(o);
    requestAnimationFrame(() => o.classList.add("show"));
    try { if (typeof sbHaptic === "function") sbHaptic("success"); } catch (e) {}
    sfx("pop");
    setTimeout(() => countUp(o.querySelector("[data-n]"), 0, r.gained, 600), still ? 0 : 250);
    if (r.ready && r.ready.length) setTimeout(chime, still ? 0 : 450);
    let closed = false;
    const close = () => { if (closed) return; closed = true; o.classList.remove("show"); setTimeout(() => { try { if (o.hidePopover && o.matches(":popover-open")) o.hidePopover(); } catch (e) {} o.remove(); rOpen = false; paintPills(); setTimeout(showNext, 200); }, still ? 0 : 300); };
    o.addEventListener("click", close);
    setTimeout(close, r.ready && r.ready.length ? 5200 : 3600);
  }
  function openWardrobe(){
    try { if (window.SBCOMP && SBCOMP.open) SBCOMP.open(); setTimeout(() => { const h = document.querySelector(".cp-acc-h"); if (h) h.scrollIntoView({block: "start"}); }, 120); } catch (e) {}
  }

  /* ---------- Each kind of work's ending ---------- */
  // Focus: when a focus session ends (SBSTATS has logged its minutes by then)
  hook("focus", e => {
    // a session that ends, or one stopped part way (Reset, Skip, a mode change): its minutes are logged either way, and its screen
    // says what they earned (the chip showed them going up, so they shouldn't just vanish); a chest and the big screen only at a
    // session's real end, a small card that goes by itself for one stopped part way
    if (!e || (e.type !== "end" && e.type !== "early") || e.mode !== "focus" || !e.minutes || e.why === "switch") return;
    if (e.type === "end") rollChest("focus");
    setTimeout(() => {
      const m = Math.round(e.minutes), today = tr(() => Number(SBSTATS.focusDays()[todayISO()]) || 0);
      reward({kind: "focus", compact: e.type !== "end", kick: e.type === "end" ? "Focus Session Done" : "Focus Time Counted", title: `${m} minute${m === 1 ? "" : "s"} of focus`,
        lines: [{t: `You focused for ${m} minute${m === 1 ? "" : "s"}`, n: 0, fill: Math.ceil(m / 2) + 1, s: today > FOCUS_MIN_A_DAY ? "Past 3 hours today, so not all of it counted" : ""}]});
    }, 60);
  });
  // Flashcards: at the Session Done screen (01-flashcards.js)
  // good: most of the session's cards were known (01-flashcards.js), which gets a happier sound
  function cardsDone(n, good){
    n = Math.max(0, Math.round(Number(n) || 0)); if (!n) return;
    flushCards();
    const today = dayCards(todayISO());
    reward({kind: "cards", sfx: good ? 2 : 1, kick: good ? "Great Session!" : "Study Session Done", title: `${n} card${n === 1 ? "" : "s"} reviewed`, showZero: true,
      lines: [{t: `You studied ${n} flashcard${n === 1 ? "" : "s"}`, n: 0, fill: n + 1, s: today > CARDS_A_DAY ? `Only ${CARDS_A_DAY} cards a day earn credits, and you've reviewed ${today.toLocaleString()} today. Great work!` : ""}]});
  }
  // A quiz (a deck quiz or an AI practice quiz): written down once, then its screen
  function quizDone(right, total, key){
    right = Math.max(0, Math.round(Number(right) || 0)); total = Math.max(0, Math.round(Number(total) || 0)); if (!total) return;
    const day = todayISO(), id = String(key || "quiz").replace(/:/g, "_"), ev = sc().ev || {};
    const tries = Object.keys(ev).filter(k => k.indexOf(`quiz:${day}:${id}:`) === 0).length;
    const pass = total >= 3 && right / total >= 0.7, perfect = pass && right >= total;
    const lines = tries >= QUIZ_TRIES_A_DAY ? [] : [{t: `${right} of ${total} answers right`, n: right}].concat(pass ? [{t: "For passing", n: QUIZ_PASS}] : [], perfect ? [{t: "For a perfect score!", n: QUIZ_PERFECT}] : []);
    const pts = lines.reduce((a, l) => a + l.n, 0);
    // quizzes from before are counted once (qbase); this one is already in the decks' saved results, so it's left out of that
    if (sc().qbase == null) setSc({qbase: Math.max(Number((sc().hw || {}).quiz) || 0, savedQuizPts() - quizPts(right, total))});
    if (pts) { setSc({ev: {[`quiz:${day}:${id}:${uid()}`]: pts}}); invalidate(); }
    reward({kind: "quiz", sfx: perfect ? 3 : pass ? 2 : 1, kick: perfect ? "Perfect Quiz!" : pass ? "Quiz Passed!" : "Quiz Done", title: `${total} question${total === 1 ? "" : "s"}`,
      lines: tries >= QUIZ_TRIES_A_DAY ? [{t: "No credits this time", n: 0, s: `This quiz has earned credits ${QUIZ_TRIES_A_DAY} times today. Try another, or come back tomorrow.`}] : lines, showZero: true});
  }
  // Presentations: each slide inside its time, and the whole talk on target (99-present.js, on a finished run)
  hook("pr-finish", (p, run) => {
    try {
      if (!p || !run || run.early || !run.id || !Array.isArray(run.times)) return;
      const ev = sc().ev || {}, day = todayISO(), pid = String(p.id || "").replace(/:/g, "_");
      const runsToday = Object.keys(ev).filter(k => k.indexOf(`pres:${day}:${pid}:`) === 0).length;
      const idx = run.sec ? Array.from({length: run.sec[1] - run.sec[0] + 1}, (_, k) => run.sec[0] + k) : run.times.map((_, k) => k);
      // a slide is inside its time when it ran no more than a little over (99-present.js's own "ok": 17% or 3 seconds)
      const ok = idx.filter(k => { const t = Number(run.times[k]) || 0, b = Number((run.budgets || [])[k]) || 0; return b > 0 && t > 0 && (t <= b * 1.17 || t - b <= 3000); }).length;
      const tgt = (Number(run.target) || 0) * 1000, whole = !run.sec && tgt > 0 && run.total <= tgt + 10000 && run.total >= tgt * 0.75;
      const first = whole && !ev[`pres:master:${pid}`] && !Object.keys(ev).some(k => k === `pres:${pid}:master`);
      const lines = runsToday >= PRES_RUNS_A_DAY ? [] : [{t: `You practiced ${idx.length} slide${idx.length === 1 ? "" : "s"}, ${ok} on time`, n: ok * PRES_SLIDE}]
        .concat(whole ? [{t: "For finishing the whole talk on target", n: PRES_WHOLE}] : [], first ? [{t: "Mastered! The first time on target", n: PRES_MASTER}] : []);
      const add = {}, pts = lines.reduce((a, l) => a + l.n, 0);
      if (pts) add[`pres:${day}:${pid}:${run.id}`] = pts - (first ? PRES_MASTER : 0);
      if (first) add[`pres:master:${pid}`] = PRES_MASTER;
      if (Object.keys(add).length) { setSc({ev: add}); invalidate(); }
      reward({kind: "pres", sfx: first ? 3 : whole ? 2 : 1, kick: first ? "Presentation Mastered!" : whole ? "Right on Time!" : "Practice Run Done", title: p.name || "Presentation",
        lines: runsToday >= PRES_RUNS_A_DAY ? [{t: "No credits this time", n: 0, s: `This presentation has earned credits ${PRES_RUNS_A_DAY} times today. Come back tomorrow!`}] : lines, showZero: true});
    } catch (e) { console.warn("study credits: presentation", e); }
  });
  // Tasks (from anywhere: the board, the chat, a widget): noticed when the app draws, with each newly finished task named
  const doneNow = () => { const m = {}; Object.values(state.tasks || {}).forEach(t => { if (t && t.status === "done") m[t.id] = t; }); return m; };
  // nothing to show: readiness as it is now is the new starting point for the next reward screen
  function notice(){ if (!notice0()) readySet(); }
  function notice0(){
    try { checkGrades(); checkPro(); } catch (e) { console.warn("study credits: grades", e); }
    invalidate();
    const t = totals(), done = doneNow();
    if (seenTotal == null) { seenTotal = t.earned; lastBy = Object.assign({}, t.by); doneSeen = done; return false; }
    const fresh = Object.values(done).filter(x => doneSeen && !doneSeen[x.id] && x.doneAt && Date.now() - x.doneAt < 120000);
    doneSeen = done;
    if (t.earned <= seenTotal) { if (t.earned < seenTotal) seenTotal = t.earned; return false; }
    const gained = t.earned - seenTotal;
    // a big jump at once is work arriving from another device (or a backup), not something just done: counted quietly
    if (gained > 250 && !fresh.length) { seenTotal = t.earned; lastBy = Object.assign({}, t.by); paintPills(); keepHigh(); return false; }
    if (fresh.length) {
      const top = fresh.slice(0, 3);
      reward({kind: "task", compact: true, kick: fresh.length === 1 ? `${fresh[0].type || "Task"} Done` : `${fresh.length} Tasks Done`, title: top.map(x => x.title).join(", ") + (fresh.length > 3 ? "…" : ""),
        lines: top.map(x => ({t: x.title, n: taskPts(x)}))});
      return true;
    }
    // credits with no one piece of work behind them (counted quietly): the balance just goes up
    seenTotal = t.earned; lastBy = Object.assign({}, t.by); paintPills(); keepHigh();
    return false;
  }
  // mid-way through a flashcard session, a quiz or a presentation run: wait (its own screen comes at the end)
  const studying = () => { try { const f = ui.fc; return (ui.tab === "flashcards" && f && (f.mode === "study" || f.mode === "quiz") && Array.isArray(f.q || f.qs) && !!(f.q || f.qs)[f.i]) || !!document.getElementById("prStage"); } catch (e) { return false; } };
  let noticeT = 0;
  function noticeSoon(){
    clearTimeout(noticeT);
    noticeT = setTimeout(() => { if (studying() || document.hidden || rOpen || rWait) { noticeSoon(); return; } notice(); }, 1200);
  }
  hook("render", noticeSoon);
  // the first count after start-up (and after the account's data arrives) is quiet: only new work is shown
  hook("boot", () => { setTimeout(() => { invalidate(); seenTotal = totals().earned; lastBy = Object.assign({}, totals().by); doneSeen = doneNow(); keepHigh(); readySet(); }, 3000); setTimeout(openLeftovers, 12000);
    // grades are watched from 15 seconds after start-up (an account's data has arrived by then); a spin left waiting comes back
    setTimeout(() => { gradesReady = true; try { checkGrades(); checkPro(); } catch (e) {} spinSoon(); }, 15000); });
  /* ---------- "+7 credits": a little chip while studying ----------
     Shown during a focus session (the timer), a flashcard session, a quiz and a presentation run: what it has earned so far, going
     up as you go (tasks show theirs when they're done). The final screen still adds what only the end can tell (passing, on target). */
  function liveHtml(n, note, id){
    n = Math.max(0, Math.round(Number(n) || 0));
    return `<span class="scr-live"${id ? ` id="${id}"` : ""} role="status" aria-live="polite" title="Studyboard Credits earned so far">${coin(18)}<b>+${n.toLocaleString()}</b><span class="scr-live-t">${n === 1 ? "credit" : "credits"}</span>${note ? `<span class="scr-live-n">${esc(note)}</span>` : ""}<span class="scr-live-ch" data-scr-chests>${chestsHtml()}</span></span>`;
  }
  // focus: a credit for every 2 minutes of this session so far, as far as today's 3 hours allow
  function focusLive(){
    const el = typeof pomoElapsedMin === "function" ? Math.floor(pomoElapsedMin()) : 0;
    const today = tr(() => Number(SBSTATS.focusDays()[todayISO()]) || 0);
    return {n: Math.floor(Math.max(0, Math.min(el, FOCUS_MIN_A_DAY - today)) / 2), full: today >= FOCUS_MIN_A_DAY};
  }
  // flashcards: how many more cards count today
  const cardsLeftToday = () => Math.max(0, CARDS_A_DAY - dayCards(todayISO()));
  // a quiz: does it still earn today (QUIZ_TRIES_A_DAY tries each)
  const quizTriesLeft = key => { const id = String(key || "quiz").replace(/:/g, "_"), day = todayISO(); return Math.max(0, QUIZ_TRIES_A_DAY - Object.keys(sc().ev || {}).filter(k => k.indexOf(`quiz:${day}:${id}:`) === 0).length); };
  // a presentation: runs left today, and what a run's slides so far have earned (each slide inside its time)
  const presRunsLeft = pid => { const id = String(pid || "").replace(/:/g, "_"), day = todayISO(); return Math.max(0, PRES_RUNS_A_DAY - Object.keys(sc().ev || {}).filter(k => k.indexOf(`pres:${day}:${id}:`) === 0).length); };
  const presSlideOk = (t, b) => b > 0 && t > 0 && (t <= b * 1.17 || t - b <= 3000);

  // A little "+12 Credits" pop (kept for other parts of the app)
  function pop(n, why){ n = Math.round(n); if (n < 1) return; rq.push({kind: "hello", compact: true, kick: "Credits Earned", title: why || "", lines: [], gained: n, bal: balance(), bal0: balance() - n, day: todayN(), tgt: target()}); showNext(); }

  // Anywhere showing the balance (.scr-bal) is kept current
  function paintPills(){
    invalidate();
    const b = balance().toLocaleString();
    document.querySelectorAll("[data-scr-bal]").forEach(el => { el.textContent = b; });
  }
  const pill = () => `<span class="scr-pill" title="Studyboard Credits: earned by studying, spent on accessories">${coin(20)}<b data-scr-bal>${balance().toLocaleString()}</b><span>Credits</span></span>`;
  // How credits are earned, for the Wardrobe: each kind, how it's earned, and how many it has given so far
  function howHtml(){
    const t = totals();
    return `<p class="mini scr-how-day">A steady study day (a 25-minute focus session, 20 flashcards, a practice quiz and a couple of tasks) earns about 65 credits, and finds about one chest: a Common in about a day, a Rare in half a week, an Epic in about a week and a Legendary in about two weeks.</p><ul class="scr-how">${KINDS.map(([k, n, how]) => `<li><span class="scr-how-n"><b>${esc(n)}</b><span class="mini">${esc(how)}</span></span><span class="scr-how-v" title="Earned so far">${coin(16)}${Math.floor(t.by[k] || 0).toLocaleString()}</span></li>`).join("")}</ul>`;
  }

  return {xr: id => { const t = state.tasks[id]; return t ? examReadiness(t) : null; }, prep: id => { const t = state.tasks[id]; return t && window.SBPREP ? SBPREP.pct(t) : null; }, readyNow, readySet, readyBase: () => Object.assign({}, readyBase || {}), fxOn, chime, FX_KEY, balance, earned, spent, owns, buy, grant, checkGrades: () => { gradesReady = true; checkGrades(); }, checkPro: () => { gradesReady = true; checkPro(); }, proSpinHtml, spinPro, welcomeSpin, planTest: o => { if (window.__SB_TEST) planTest = o || null; }, spinQueue: () => spinQueue().map(x => Object.assign({}, x)), spinSoon, spinsLeftThisWeek, rollChest, chestSvg, pendingChests: () => pending().map(c => Object.assign({}, c)), openLeftovers, liveHtml, focusLive, cardsLeftToday, quizTriesLeft, presRunsLeft, presSlideOk, QUIZ_PASS: () => QUIZ_PASS, PRES_SLIDE: () => PRES_SLIDE, PRES_WHOLE: () => PRES_WHOLE, totals: () => { const t = totals(); return {by: Object.assign({}, t.by), earned: t.earned, spent: spent(), balance: balance()}; },
    kinds: () => KINDS.map(k => k.slice()), coin, coinSrc: () => COIN_SRC, pill, howHtml, paintPills, pop, reward, cardsDone, quizDone,
    // For tests: count again now
    refresh: () => { invalidate(); notice(); }};
})();
if (window.__SB_TEST) window.SBSC = SBSC;
