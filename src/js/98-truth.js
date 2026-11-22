/* Keeping the small on-device AI honest and useful (Ask in the bubble, the Companion tab, and any on-device request that wants the web):
     facts     planner questions answered by the app's own code, never by a model: what's due when, what's overdue, when one task is
               due, a course's grade or one item's mark, what to do next. Always exact.
     steps     a request with several things to do ("add X, then start a timer") split into one request per thing
     check     every number, date and name in an AI answer must be in what the AI was given; one that isn't means the answer
               is asked for again more strictly, then replaced by what was found
     web       a free look-up for the on-device model: Wikipedia's search and article openings (called straight from the browser;
               only the question goes to Wikipedia), given to the model as sources to answer from, with the links shown
   Used only with the AI on the device: cloud models do these well on their own. */
window.SBTRUTH = (() => {
  const low = s => String(s == null ? "" : s).toLowerCase();
  const clip = (s, n) => String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n);
  const WD = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const words = s => (low(s).match(/[a-z0-9]+/g) || []).filter(w => w.length > 2 && !/^(the|and|for|with|due|when|what|is|are|my|was|did|get|got|on|in|of|to|a|an)$/.test(w));
  const ACTION = /\b(add|create|make|put|schedule|remind|move|change|rename|delete|remove|mark|set|start|begin|open|show|find|turn|update|edit|cancel|skip)\b/i;

  /* ---------- facts: the planner's own answers ---------- */
  function range(s, today){
    let m;
    if (/\boverdue|late|missed|past due\b/.test(s)) return {from: "0000-00-00", to: addDays(today, -1), label: "overdue"};
    if (/\btoday|tonight\b/.test(s)) return {from: today, to: today, label: "today"};
    if (/\btomorrow\b/.test(s)) return {from: addDays(today, 1), to: addDays(today, 1), label: "tomorrow"};
    if (/\bnext week\b/.test(s)) { const d0 = new Date(today + "T12:00:00").getDay(), start = addDays(today, 7 - d0 + 1 > 7 ? 1 : 7 - d0 + 1); return {from: start, to: addDays(start, 6), label: "next week"}; }
    if (/\b(this week|the week|rest of the week|7 days|seven days|coming up|upcoming|soon)\b/.test(s)) return {from: today, to: addDays(today, 6), label: "in the next 7 days"};
    if ((m = s.match(/\b(?:on |this |next )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/))) { const w = WD.indexOf(m[1]), d0 = new Date(today + "T12:00:00").getDay(); let k = (w - d0 + 7) % 7; if (k === 0 && !/\btoday\b/.test(s)) k = 7; const d = addDays(today, k); return {from: d, to: d, label: "on " + m[1][0].toUpperCase() + m[1].slice(1)}; }
    return null;
  }
  // a task the question names, by its title words (the best match, and only a clear one)
  function taskNamed(s){
    const q = words(s); if (!q.length) return null;
    let best = null, bs = 0;
    tasksArr().forEach(t => { const tw = words(t.title); if (!tw.length) return; const hit = tw.filter(w => q.includes(w)).length, sc = hit / tw.length + hit * 0.05; if (hit && sc > bs) { bs = sc; best = t; } });
    return bs >= 0.6 ? best : null;
  }
  function courseNamed(s){
    const L = low(s); let best = null, bs = 0;
    coursesArr().forEach(c => { const keys = [c.code, c.name].filter(Boolean).map(low); keys.forEach(k => { if (k && L.includes(k) && k.length > bs) { bs = k.length; best = c; } }); const cw = words(c.name); const hit = cw.filter(w => words(s).includes(w)).length; if (cw.length && hit / cw.length >= 0.6 && hit * 3 > bs) { bs = hit * 3; best = c; } });
    return best;
  }
  function facts(q){
    const s = low(q).replace(/[?!.]+$/, ""), today = todayISO(), L = window.SBLOCALANS;
    if (!s || s.length > 160) return null;
    // an action, not a question ("add a task due tomorrow", "move my exam"): the AI's job
    if (ACTION.test(s) && !/^\s*(what|when|which|how many|do i|is there|are there|have i)\b/.test(s)) return null;
    // what to do next
    if (L && L.NEXT_Q.test(q)) { const nx = L.nextLine(); if (nx) return {answer: nx.replace(/\*\*/g, ""), show: []}; }
    // grades: a course's standing, or one item's mark
    if (/\b(grade|grades|mark|marks|score|scores|percent|gpa|standing|did i get|how am i doing|how'?s my|passing|failing|pass|fail)\b/.test(s)) {
      const passQ = /\b(passing|failing|pass|fail)\b/.test(s);
      const verdict = line => { if (!passQ) return line; const cur = Number((line.match(/current ([\d.]+)%/) || [])[1]), pm = Number((line.match(/pass mark ([\d.]+)%/) || [])[1]);
        if (!isFinite(cur) || !cur && cur !== 0) return line; if (!isFinite(pm) || !pm) return line;
        return (cur >= pm ? `Yes, you're passing: ${cur}% so far, and the pass mark is ${pm}%. ` : `Not yet: ${cur}% so far, below the pass mark of ${pm}%. `) + line; };
      const G = window.SBGRADES; if (!G) return null;
      let items = []; try { items = G.items ? G.items() : []; } catch (e) {}
      const it = (() => { const qw = words(s); let best = null, bs = 0; items.forEach(x => { const tw = words(x.title); const hit = tw.filter(w => qw.includes(w)).length; const sc = tw.length ? hit / tw.length : 0; if (hit && sc > bs) { bs = sc; best = x; } }); return bs >= 0.6 ? best : null; })();
      if (it) return {answer: `You got ${it.mark} on ${it.title}${it.course ? " (" + it.course + ")" : ""}: ${it.pct}%${it.letter ? ", " + it.letter : ""}.`, show: []};
      const c = courseNamed(s); let lines = []; try { lines = G.lines ? G.lines() : []; } catch (e) {}
      if (c) { const k = [c.code, c.name].filter(Boolean).map(low); const line = lines.find(x => k.some(y => y && low(x).includes(y))); if (line) return {answer: verdict(line.replace(/\*\*/g, "")), show: []}; return {answer: `${courseLabel(c)} doesn't have any marks in Studyboard yet.`, show: []}; }
      if (/\b(all|my|each|every)\b.*\bgrades?\b|\bgpa\b/.test(s) && lines.length) return {answer: lines.slice(0, 12).map(x => "- " + x.replace(/\*\*/g, "")).join("\n"), show: []};
      return null;
    }
    // when one named task is due
    if (/^\s*when\b|\bwhat day\b|\bwhat time\b|\bdue date\b/.test(s)) {
      const t = taskNamed(s);
      if (t) return {answer: L ? L.taskLine(t).replace(/\*\*/g, "") + "." : `${t.title}: ${t.due ? "due " + t.due : "no due date"}.`, show: [{kind: "task", id: t.id}]};
    }
    // what's due in a window, or overdue
    if (/\b(due|left|to do|todo|have|homework|assignments?|tasks?|exams?|quiz(zes)?|tests?|anything|deadlines?|overdue|late)\b/.test(s)) {
      const r = range(s, today); if (!r) return null;
      const kind = /\bexams?|tests?|midterms?|finals?\b/.test(s) ? t => /exam|midterm|final|test/i.test(t.type + " " + t.title) : /\bquiz(zes)?\b/.test(s) ? t => /quiz/i.test(t.type + " " + t.title) : () => true;
      const c = courseNamed(s);
      const list = tasksArr().filter(t => t.status !== "done" && t.due && t.due >= r.from && t.due <= r.to && kind(t) && (!c || t.courseId === c.id)).sort((a, b) => (a.due + (a.time || "")).localeCompare(b.due + (b.time || "")));
      const what = /\bexams?|tests?\b/.test(s) ? "exams" : /\bquiz/.test(s) ? "quizzes" : "tasks";
      if (!list.length) return {answer: `${what === "tasks" ? "Nothing" : "No " + what} ${r.label === "overdue" ? (what === "tasks" ? "is" : "are") + " overdue" : (what === "tasks" ? "is" : "are") + " due " + r.label}${c ? " for " + courseLabel(c) : ""}.${r.label === "overdue" ? " You're all caught up!" : ""}`, show: []};
      const head = r.label === "overdue" ? `${list.length} ${list.length === 1 ? what.replace(/s$/, "") + " is" : what + " are"} overdue` : `${list.length} ${list.length === 1 ? what.replace(/s$/, "") : what} due ${r.label}${c ? " for " + courseLabel(c) : ""}`;
      return {answer: head + ":\n" + list.slice(0, 12).map(t => "- " + (L ? L.taskLine(t).replace(/\*\*/g, "") : t.title)).join("\n") + (list.length > 12 ? `\n…and ${list.length - 12} more.` : ""), show: []};
    }
    return null;
  }

  /* ---------- steps: one request per thing to do ---------- */
  function steps(q){
    const s = String(q || "").trim(); if (s.length < 12 || s.length > 400) return [s];
    const parts = s.split(/\s*(?:;|\.\s+(?=[A-Z])|,?\s+(?:and then|then|and also|also|after that|plus)\s+|,\s+and\s+(?=(?:add|create|make|start|set|remind|move|change|show|open|delete|mark|schedule)\b)|\s+and\s+(?=(?:add|create|make|start|set|remind|move|change|show|open|delete|mark|schedule)\b))\s*/i).map(x => x.trim()).filter(x => x.length > 3);
    // only a real split: every part asks for something
    return parts.length > 1 && parts.length <= 5 && parts.every(p => ACTION.test(p) || /\?$|^(what|when|how|why|which|who)\b/i.test(p)) ? parts : [s];
  }

  /* ---------- check: nothing in the answer that wasn't given ---------- */
  const MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec";
  function specifics(text){
    const t = String(text || ""), out = new Set();
    (t.match(/\b\d+(?:[.,:]\d+)?%?/g) || []).forEach(x => { if (!/^(1|2|3|4|5|10|0)$/.test(x)) out.add(x.replace(/,/g, "")); });
    (t.match(new RegExp(`\\b(?:${MONTHS})[a-z]*\\.? \\d{1,2}\\b`, "gi")) || []).forEach(x => out.add(low(x)));
    // names: capitalized words in the middle of a sentence
    (t.match(/(?<=[a-z,;:] )[A-Z][a-z]{2,}(?: [A-Z][a-z]+)*/g) || []).forEach(x => { if (!/^(I|I'm|I'll|Studyboard|Mochi|Today|Tomorrow|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December|Apply|Show|Review|Notes|Calendar|Files|Settings|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)$/.test(x)) out.add(x); });
    return [...out];
  }
  // the date forms the context may hold for an answer's date ("Dec 3" vs "2026-12-03")
  const MO12 = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const dateForms = x => { const m = new RegExp(`^(${MONTHS})[a-z]*\\.? (\\d{1,2})$`, "i").exec(x); if (!m) return [x]; const mo = MO12.indexOf(m[1].toLowerCase().slice(0, 3)) + 1; return [x, `-${String(mo).padStart(2, "0")}-${String(m[2]).padStart(2, "0")}`]; };
  function unsupported(answer, given){
    const g = low(given).replace(/,(?=\d{3})/g, "");
    return specifics(answer).filter(x => !dateForms(low(x)).some(f => g.includes(low(f))) && !(/%$/.test(x) && g.includes(x.slice(0, -1))));
  }

  /* ---------- web: Wikipedia, for the on-device model ---------- */
  const WIKI = "https://en.wikipedia.org/w/api.php";
  const webOk = () => { try { return navigator.onLine !== false && localStorage.getItem("studyboard:webLookupOff") !== "1"; } catch (e) { return true; } };
  async function web(q, o){
    o = o || {};
    if (!webOk() || (window.__SB_TEST && !window.__SB_WEB_TEST)) return [];
    const term = String(q || "").replace(/^\s*(what|who|why|how|when|where|which)\s+(is|are|was|were|does|do|did|can|could)\s+/i, "").replace(/[?!.]+$/, "").slice(0, 200);
    const get = async params => { const u = WIKI + "?" + new URLSearchParams(Object.assign({format: "json", formatversion: "2", origin: "*"}, params)); const r = await fetchT(u, {credentials: "omit"}, o.ms || 8000); if (!r.ok) throw new Error("wiki " + r.status); return r.json(); };
    try {
      const s = await get({action: "query", list: "search", srsearch: term, srlimit: String(o.n || 3), srprop: ""});
      const titles = ((s.query || {}).search || []).map(x => x.title).slice(0, o.n || 3);
      if (!titles.length) return [];
      const e = await get({action: "query", prop: "extracts", exintro: "1", explaintext: "1", exchars: String(o.chars || 1600), titles: titles.join("|"), redirects: "1"});
      const pages = ((e.query || {}).pages || []).filter(p => p.extract && p.extract.length > 80);
      return titles.map(t => pages.find(p => p.title === t || low(p.title) === low(t))).filter(Boolean).map(p => ({title: p.title, url: "https://en.wikipedia.org/wiki/" + encodeURIComponent(p.title.replace(/ /g, "_")), text: clip(p.extract, o.chars || 1600)}));
    } catch (e) { return []; }
  }
  const webText = list => list.map((x, i) => `[W${i + 1}] ${x.src || "Wikipedia"}: ${x.title} (${x.url})\n${x.text}`).join("\n\n");

  /* ---------- research: several models and sources working together ----------
       1. the AI on the device plans: 1 to 3 search queries, and whether papers or a definition would help
       2. free sources, in parallel: Wikipedia, OpenAlex (scholarly papers' abstracts), Wiktionary (definitions)
       3. the device's search model (bge-small, 30-search.js) ranks every passage by meaning against the question
       4. the best few go to the AI as numbered sources (and the fact check holds the answer to them)
     Only the search words leave the device (to Wikimedia and OpenAlex), straight from the browser. */
  const OA = "https://api.openalex.org/works";
  async function openAlex(q, n){
    if (!webOk() || (window.__SB_TEST && !window.__SB_WEB_TEST)) return [];
    try {
      const u = OA + "?" + new URLSearchParams({search: String(q).slice(0, 200), "per-page": String(n || 4), filter: "has_abstract:true", select: "id,title,publication_year,abstract_inverted_index,primary_location,open_access,cited_by_count"});
      const r = await fetchT(u, {credentials: "omit"}, 8000); if (!r.ok) return [];
      const j = await r.json();
      return (j.results || []).map(w => {
        const inv = w.abstract_inverted_index || {}, words = []; Object.entries(inv).forEach(([k, v]) => v.forEach(i => { words[i] = k; }));
        const abs = words.filter(Boolean).join(" ");
        const url = (w.open_access && w.open_access.oa_url) || ((w.primary_location || {}).landing_page_url) || w.id;
        return abs.length > 120 ? {src: "Research paper", title: `${w.title}${w.publication_year ? " (" + w.publication_year + ")" : ""}`, url, text: clip(abs, 1600), cites: w.cited_by_count || 0} : null;
      }).filter(Boolean);
    } catch (e) { return []; }
  }
  async function wiktionary(word){
    if (!webOk() || (window.__SB_TEST && !window.__SB_WEB_TEST) || !/^[a-z][a-z -]{1,40}$/i.test(word)) return [];
    try {
      const u = "https://en.wiktionary.org/w/api.php?" + new URLSearchParams({action: "query", format: "json", formatversion: "2", origin: "*", prop: "extracts", explaintext: "1", exchars: "900", titles: word.toLowerCase(), redirects: "1"});
      const r = await fetchT(u, {credentials: "omit"}, 6000); if (!r.ok) return [];
      const p = (((await r.json()).query || {}).pages || [])[0];
      return p && p.extract ? [{src: "Wiktionary", title: p.title, url: "https://en.wiktionary.org/wiki/" + encodeURIComponent(p.title), text: clip(p.extract.replace(/=+[^=]+=+/g, " "), 900)}] : [];
    } catch (e) { return []; }
  }
  // passages of about 600 characters, so ranking picks the right part of a long article
  const passages = list => list.flatMap(x => { const t = x.text, out = []; for (let i = 0; i < t.length && out.length < 4; i += 600) { const seg = t.slice(i, i + 700); if (seg.length > 80) out.push(Object.assign({}, x, {text: seg, part: out.length})); } return out; });
  async function research(q, o){
    o = o || {};
    let plan = {queries: [String(q).slice(0, 200)], papers: false, define: ""};
    // (a separate planning step only when asked for: the question itself searches well, and every model call is seconds on a laptop)
    const dm = String(q).match(/\bwhat (?:does|is the meaning of) ["']?([a-z][a-z -]{1,30}?)["']? mean\b|\bdefine ["']?([a-z][a-z -]{1,30})|\bmeaning of ["']?([a-z][a-z -]{1,30})/i);
    if (dm) plan.define = (dm[1] || dm[2] || dm[3] || "").trim();
    plan.queries = [String(q).replace(/^\s*(please\s+)?(can you\s+)?(explain|describe|tell me about|what is|what are|who was|who is|how does|how do|why does|why do|why is|why are)\s+/i, "").replace(/[?!.]+$/, "").slice(0, 120) || String(q).slice(0, 120)];
    if (o.plan && typeof aiOnDevice === "function" && aiOnDevice() && !o.noPlan) {
      try {
        const r = await aiCall({task: "chat", maxTokens: 220, temperature: 0, quiet: true, schema: {type: "OBJECT", properties: {queries: {type: "ARRAY", items: {type: "STRING"}}, papers: {type: "BOOLEAN"}, define: {type: "STRING"}}, required: ["queries"]},
          system: "You plan a web look-up for a student's question. queries: 1 to 3 short search queries (2 to 6 words each) that together find what the answer needs. papers: true only if research findings or studies would help. define: the single word or term to look up in a dictionary if the student asks what a word means, else empty.",
          parts: [{text: "Question: " + String(q).slice(0, 600)}]});
        const d = (r && r.data) || {}, qs = (d.queries || []).map(x => clip(x, 80)).filter(x => x.length > 2).slice(0, 3);
        if (qs.length) plan = {queries: qs, papers: !!d.papers, define: clip(d.define, 40)};
      } catch (e) {}
    }
    if (o.onStatus) o.onStatus("Looking it up…");
    const jobs = plan.queries.slice(0, 2).map(x => web(x, {n: 2, chars: 2400}));
    if (plan.papers || /\b(research|stud(y|ies)|evidence|paper|journal|findings|effect of)\b/i.test(q)) jobs.push(openAlex(plan.queries[0], 4));
    if (plan.define) jobs.push(wiktionary(plan.define));
    // the whole look-up gets a few seconds; a source that's slower is left out of this answer
    const cap = (pr, ms, v) => Promise.race([pr.catch(() => v), new Promise(r => setTimeout(() => r(v), ms))]);
    const found = (await Promise.all(jobs.map(j => cap(j, o.ms || 4000, [])))).flat();
    const seen = new Set(), uniq = found.filter(x => { const k = x.url; if (seen.has(k)) return false; seen.add(k); return true; });
    let parts = passages(uniq);
    if (!parts.length) return {list: [], text: ""};
    // rank by meaning with the device's search model (or whichever search-by-meaning model is set up); word overlap if none
    let ranked = null;
    try {
      const vecs = window.SBSEARCH && SBSEARCH.embedTexts ? await cap(SBSEARCH.embedTexts([String(q)].concat(parts.map(x => x.title + ". " + x.text)), true), 2500, null) : null;
      if (vecs && vecs.length === parts.length + 1) { const qv = vecs[0]; ranked = parts.map((x, i) => ({x, s: vecs[i + 1].reduce((a, v, k) => a + v * (qv[k] || 0), 0)})); }
    } catch (e) {}
    if (!ranked) { const qw = new Set(words(q)); ranked = parts.map(x => ({x, s: words(x.title + " " + x.text).filter(w => qw.has(w)).length})); }
    ranked.sort((a, b) => b.s - a.s);
    const top = []; const per = new Map();
    for (const r of ranked) { const n = per.get(r.x.url) || 0; if (n >= 2) continue; per.set(r.x.url, n + 1); top.push(r.x); if (top.length >= (o.max || 5)) break; }
    return {list: top, text: webText(top), plan};
  }
  // a general-knowledge question (not about the student's own planner)
  // (never a question to the companion itself, "what are you working on", or one about today, the student or their things)
  const general = q => /^\s*(what|who|why|how|when|where|which|explain|define|describe|compare|tell me about)\b/i.test(q) && !/\b(my|i|i'm|me|mine|our|we|us|you|your|you're|yours|today|tonight|tomorrow|now|this week)\b/i.test(q) && !/\b(due|grade|task|deadline|class|deck|note|board|course|schedule|calendar|studyboard|mochi|working on|doing)\b/i.test(q) && String(q).replace(/[^a-z]/gi, "").length >= 8;

  return {facts, steps, specifics, unsupported, web, webText, general, research, openAlex, wiktionary, courseNamed};
})();
