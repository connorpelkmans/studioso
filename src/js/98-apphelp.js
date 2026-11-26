/* ===== module: 98-apphelp.js: questions about Studyboard itself, answered from its own guide (no AI) ===== */
/* "How do I import my syllabus", "how do I change the theme", "can I connect Canvas", plus hello, thanks and "what can you do".
   Common ones have a written answer; anything else gets the best-matching lines of the app guide (98-assist.js GUIDE). Exact
   and instant; null when it isn't about the app. */
window.SBAPPHELP = (() => {
  const low = s => String(s == null ? "" : s).toLowerCase();
  const S = "Settings (the gear at the bottom of the sidebar, or in the top bar on phones)";
  // what to do to which thing ("change a course's colour", "delete a deck", "mark a task done"): before the single-word topics below
  const PAIRS = [
    [/\b(course|class)(?:'?s)?\b[^?]*\b(colou?rs?|name|instructor|prof(?:essor)?|teacher|room|times?|schedule|link)\b|\b(colou?r|rename|instructor|prof(?:essor)?|room)\b[^?]*\b(course|class)\b/, "Open Courses in the sidebar, open the course, tap More, then Edit Course: its name, color, class times, instructor and links are all there. Or just tell me, like \"make psych purple\"."],
    [/\b(delete|remove|rename|get rid of|erase)\b[^?]*\b(decks?|flash ?card sets?)\b/, "Open Review in the sidebar and tap Edit Deck on that deck: rename it at the top, or tap Delete Deck at the bottom. Or just tell me, like \"delete my heart deck\"."],
    [/\b(mark|check off|tick off|complete|finish|cross off)\b[^?]*\b(tasks?|assignments?|homework|done|complete|finished)\b/, "Tap the circle next to the task (on the Board, Today, or its course) to mark it done; tap it again to undo. Or just tell me, like \"I finished the lab report\"."],
    [/\b(add|make|write|put|create)\b[^?]*\bnotes?\b/, "Open Notes in the sidebar and add a sticky note to a board (one board per course if you like), or a whiteboard. Or just tell me: \"make a note that says...\"."],
  ];
  const FAQ = [
    [/\b(syllabus|syllabi)\b/, `Open ${S}, then School and Calendar, then Import a Syllabus. Pick the PDF and Studyboard turns it into a course with its deadlines; check them and tap Add.`],
    [/\b(theme|themes|colou?rs?|look|style shop|dark mode|light mode|dark|appearance)\b/, `Open ${S}, then Appearance: choose Light, Dark or System. For themes, flashcard styles, note shapes and stickers, open the Style Shop (in Appearance, or from the sidebar Tools).`],
    [/\b(canvas|brightspace|d2l|blackboard|moodle|lms|school site|school account)\b/, `Yes. Open ${S}, then School and Calendar, and choose Brightspace, Canvas, Blackboard or Moodle. Studyboard brings in your due dates, grades and announcements.`],
    [/\b(share|sharing|send|friend|classmates?|group|groups)\b/, "Use Study Groups in the sidebar to share decks, quizzes and deadlines with classmates, plan sessions together and join the weekly challenge."],
    [/\b(flash ?cards?|decks?)\b/, "Open Review in the sidebar and make a deck: type cards yourself, or let AI make them from your slides, notes or readings (or ask me: \"make flashcards on photosynthesis\"). Study a deck with spaced repetition; keys 1 to 4 rate each card."],
    [/\b(quiz|quizzes|practice test)\b/, "Open Review in the sidebar: every deck can make a practice quiz, and AI can write one from your course materials. Or ask me: \"quiz me on the heart\"."],
    [/\b(grade|grades|mark|marks|weights?|gpa)\b/, "Open Courses, pick the course, and use its Grades tab: enter each mark and its weight, and it shows your current grade and what you need on the rest. Grades from Canvas, Brightspace, Blackboard or Moodle come in on their own once connected."],
    [/\b(course|courses|class|classes)\b/, "Open Courses in the sidebar and add a course, with its class times. Or import a syllabus (Settings, School and Calendar, Import a Syllabus) and the course is made for you."],
    [/\b(task|tasks|assignment|homework|to-?do)\b/, "Type it in the add bar on the Board, like \"bio quiz fri 2pm\", or press N anywhere. You can also just ask me: \"add bio quiz on Friday\"."],
    [/\b(export|calendar sync|sync my calendar|google calendar|apple calendar|outlook|ics)\b/, `Open ${S}, then School and Calendar, then Calendar Sync: connect Apple, Google or Outlook with a live link, or save a file.`],
    [/\b(backup|back up|restore|export my data)\b/, `Open ${S}, then Data and Backups: automatic backups to Google Drive or OneDrive (with an account), a backup file, restore, or export your data.`],
    [/\b(import|anki|quizlet|knowt|todoist|notion)\b/, `Open ${S}, then Data and Backups, then import from Anki, Quizlet, Knowt, Todoist or Notion.`],
    [/\b(timer|pomodoro|focus)\b/, "Use the Focus timer in the sidebar Tools for pomodoro sessions on a task, or ask me: \"start a 25 minute timer for my lab report\"."],
    [/\b(notes?|whiteboard|sticky)\b/, "Open Notes in the sidebar: sticky-note boards (one per course if you like) and whiteboards to draw, write and add pictures. Or ask me: \"make a note that says...\"."],
    [/\b(concept map|mind map|map)\b/, "Open a course and choose Concept Map, or ask me: \"make a concept map with photosynthesis in the center connected to sunlight, water and soil\"."],
    [/\b(notification|notifications|reminder|reminders|remind)\b/, `Open ${S}, then Notifications and Widgets, then Reminders and Notifications.`],
    [/\b(ai|gemini|key|api key|studyboard ai)\b/, `Open ${S}, then AI and Tools, then AI Features. AI runs free on your computer (Chrome's built-in AI or Google's Gemma, downloaded once), or with Studyboard Pro AI in paid Pro.`],
    [/\b(sign in|log in|login|account|password|email|sync)\b/, `Open ${S}, then Account: sign in to keep everything in sync across your devices, or change your email or password.`],
    [/\b(pro|subscription|upgrade|price|cost|pay)\b/, `Open ${S}, then Account, then Studyboard Pro.`],
    [/\b(delete|deleted|undo|recover|recently deleted|archive)\b/, `Press Ctrl+Z (Cmd+Z) to undo. Deleted things stay in ${S}, Data and Backups, Recently Deleted for 30 days.`],
    [/\b(shortcut|shortcuts|keyboard|hotkey)\b/, "Press ? anywhere to see the keyboard shortcuts. Keys 1 to 7 switch pages, N adds a task, C opens Quick Capture, Ctrl+K (Cmd+K) searches everything."],
    [/\b(search)\b/, "Press Ctrl+K (Cmd+K) to Search Everywhere: tasks, cards, notes and the text inside your files, and it can answer with AI."],
    [/\b(language|text size|font size|high contrast|accessibility)\b/, `Open ${S}, then Accessibility: text size, high contrast, calm backgrounds and language.`],
    [/\b(companion|mochi|wardrobe|accessor(y|ies)|outfit|dress)\b/, "Open Companion in the sidebar: the Wardrobe has accessories you earn by studying. Choose or rename your companion in Settings, Appearance."],
    [/\b(study hours|study plan|exam mode|autopilot|weekly hours)\b/, `Open ${S}, then Study Plan: study hours per day, weekly hours limit, free time, Exam Mode and Autopilot.`],
    [/\b(widget|widgets|install|app on my phone|home screen)\b/, `Open ${S}, then Notifications and Widgets: widgets and installing the app.`],
    [/\b(new term|new semester|start over|clear)\b/, `Open ${S}, then Data and Backups, then Start a New Term (it archives this term) or clear all data.`],
    [/\b(bug|feedback|report|support|help)\b/, `Open ${S}, then Help and About: report a bug or send feedback, the app tour and page tips.`],
  ];
  const HOWQ = /^\s*(how (do|can|to|would) i|how do you|where (is|are|do|can|did|'?s)|can i|can you|is there|does (it|studyboard|the app)|is it possible|i (can'?t|cannot) find|where('?s| is) the)\b/i;

  function answer(q){
    const s = low(q).replace(/[?!.]+$/, "").trim();
    // hello, thanks, who are you, what can you do
    if (/^(hi|hey|hello|yo|hiya|good (morning|afternoon|evening)|sup|what'?s up)\b[\w' !.,]{0,16}$/.test(s)) {
      const L = window.SBLOCALANS, nx = L && L.nextLine ? L.nextLine() : "";
      return {answer: `Hi! ${nx ? nx.replace(/\*\*/g, "").replace(/^Today's Plan says to do this next:\s*/i, "Next up: ") + "." : "Nothing is urgent right now."} Ask me what's due, about your notes, or to add a task, start a timer or make flashcards.`, show: []};
    }
    if (/^(thanks|thank you|thx|ty|cool|ok(ay)?|great|nice|awesome|perfect|got it)\b[\w' !.,]{0,20}$/.test(s) && !/\b(can|could|what|how|why|do|does|is|are|will|would|you|u|me|let'?s|now|then|but)\b/.test(s.replace(/^(thanks|thank you|thx|ty|cool|ok(ay)?|great|nice|awesome|perfect|got it)\b/, ""))) return {answer: /^(thanks|thank you|thx|ty)\b/.test(s) ? "You're welcome! Anything else?" : "Okay! Anything else?", show: []};
    if (/\b(what can you do|what do you do|how can you help|what can i ask)\b/.test(s)) return {answer: "I can answer questions about your planner (what's due, grades, classes, exams), explain things from your notes or the web, and do things for you: add or move tasks, start a focus timer, make notes, flashcards, quizzes and concept maps, and find anything in Studyboard. Try \"what's due this week?\" or \"explain the cardiac cycle\".", show: []};
    if (!HOWQ.test(s) && !/\b(settings?|feature|button|tab|page)\b/.test(s)) return null;
    // "can you make..." / "can you add..." are requests, not questions about the app
    if (/^\s*can you (make|add|create|start|set|move|mark|delete|explain|quiz|find|show|tell|help)\b/.test(s)) return null;
    const pair = PAIRS.find(([re]) => re.test(s));
    if (pair) return {answer: pair[1], show: []};
    // the topic they name first is what it's about ("how do I add grades for a quiz" is grades; "add a deck to a course" is decks)
    const hit = FAQ.map(([re, a]) => { const m = re.exec(s); return m ? {a, at: m.index} : null; }).filter(Boolean).sort((x, y) => x.at - y.at)[0];
    if (hit) return {answer: hit.a, show: []};
    // the guide's own lines that share the most words with the question (only for something clearly about the app)
    if (!/\b(studyboard|app|settings?|page|tab|button|feature|sidebar|board|planner|deck|notes?|calendar|widget|companion|account|sync|search|timer)\b/.test(s)) return null;
    const G = window.SBASSIST && SBASSIST.GUIDE ? String(SBASSIST.GUIDE) : ""; if (!G) return null;
    const qw = (s.match(/[a-z]{4,}/g) || []).filter(w => !/^(how|where|what|does|this|that|with|from|have|make|find|there|change|studyboard|would|could|should|into)$/.test(w));
    const lines = G.split(/\n|; (?=[A-Z])/).map(l => l.replace(/^[-\s]+/, "").trim()).filter(l => l.length > 20);
    const scored = lines.map(l => ({l, n: qw.filter(w => low(l).includes(w.replace(/s$/, ""))).length})).filter(x => x.n).sort((a, b) => b.n - a.n);
    if (!scored.length) return {answer: `I'm not sure where that is. Look in ${S}: its sections are Account, Appearance, Accessibility, Study Plan, AI and Tools, School and Calendar, Notifications and Widgets, Data and Backups, and Help and About.`, show: []};
    return {answer: `From the Studyboard guide: ${scored[0].l}${scored[1] && scored[1].n === scored[0].n ? `\n${scored[1].l}` : ""}`, show: []};
  }
  return {answer};
})();
