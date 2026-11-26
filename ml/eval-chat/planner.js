(() => { const d = n => { const x = new Date(); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
const card = (id, f, b, seen, dueIn, right, wrong) => ({id, front: f, back: b, box: seen ? 1 : 0, due: seen ? d(dueIn) : "", seen: seen ? 3 : 0, right: right || 0, wrong: wrong || 0});
return {v: 2, updated: 1, settings: {}, files: [], events: [{id: "e1", title: "Clinical orientation", date: d(2), start: "08:00", end: "12:00", where: "St. Mary's Hospital"}, {id: "e2", title: "Study group", date: d(1), start: "18:00", end: "19:30", where: "Library room 4"}],
 courses: [
  {id: "c1", name: "Psychiatric Nursing", code: "PSYN 2100", color: "#8E6BE0", instructor: "Dr. Amy Chen", meetings: [{id: "m1", kind: "Lecture", days: [1, 3], start: "09:00", end: "10:15", where: "Hall B"}, {id: "m2", kind: "Office Hours", days: [4], start: "13:00", end: "14:00", where: "Room 210"}]},
  {id: "c2", name: "Anatomy and Physiology", code: "BIOS 230", color: "#3B6FE0", instructor: "Prof. Luis Ruiz", meetings: [{id: "m3", kind: "Lecture", days: [2, 4], start: "11:00", end: "12:15", where: "Science 104"}, {id: "m4", kind: "Lab", days: [5], start: "14:00", end: "16:50", where: "Lab 3"}]},
  {id: "c3", name: "Nursing Foundations", code: "BSNC 1000", color: "#2E9E6B", meetings: [{id: "m5", kind: "Lecture", days: [1, 3, 5], start: "13:00", end: "13:50", where: "Nursing 120"}]},
  {id: "c4", name: "World History", code: "HIST 1010", color: "#E05A3B", instructor: "Dr. Sam Okafor"}],
 notes: [
  {id: "n1", courseId: "c1", x: 10, y: 10, text: "Freud's structure of personality\nId: the unconscious, primitive part of the mind that seeks immediate gratification of instinctual drives (the pleasure principle). Present from birth.\nEgo: the rational part that mediates between the id and reality (the reality principle); uses defense mechanisms.\nSuperego: the moral conscience, internalized rules from parents and society; causes guilt."},
  {id: "n2", courseId: "c1", x: 300, y: 10, text: "Defense mechanisms\nRepression: pushing painful thoughts out of awareness.\nProjection: attributing your own unacceptable feelings to someone else.\nDisplacement: redirecting emotion to a safer target (angry at boss, yells at dog).\nRationalization: making excuses that sound logical.\nSublimation: channeling urges into acceptable activities."},
  {id: "n3", courseId: "c1", x: 10, y: 250, text: "Therapeutic relationship\nTransference: the patient unconsciously redirects feelings about someone from their past onto the nurse.\nCountertransference: the nurse's emotional reaction to the patient based on the nurse's own past relationships. Nurses must recognize it and seek supervision.\nPhases (Peplau): orientation, working, termination."},
  {id: "n4", courseId: "c1", x: 300, y: 250, text: "Rational-emotive behavior therapy (Albert Ellis)\nGoal: identify and dispute irrational beliefs (musts, shoulds) and replace them with rational ones. ABC model: Activating event, Belief, Consequence."},
  {id: "n5", courseId: "c2", x: 10, y: 10, text: "Cardiac cycle\nSystole: ventricles contract, blood ejected. Diastole: ventricles relax and fill. Normal resting HR 60-100 bpm. SA node is the natural pacemaker; impulse goes to AV node, bundle of His, Purkinje fibers."},
  {id: "n6", courseId: "c4", x: 10, y: 10, text: "Causes of WWI (MAIN): Militarism, Alliances, Imperialism, Nationalism. Spark: assassination of Archduke Franz Ferdinand in Sarajevo, June 1914."}],
 decks: [
  {id: "d1", name: "Psych Nursing Terms", courseId: "c1", cards: [card("k1", "What is transference?", "The patient redirects feelings about someone from their past onto the nurse.", 1, -1, 1, 3), card("k2", "What is the id?", "The primitive, unconscious part of the mind seeking immediate gratification.", 1, -2, 2, 1), card("k3", "What is sublimation?", "Channeling urges into acceptable activities.", 1, 5, 3, 0), card("k4", "Define projection", "Attributing your own unacceptable feelings to someone else.", 0)]},
  {id: "d2", name: "Heart", courseId: "c2", cards: [card("k5", "Natural pacemaker of the heart?", "The SA node.", 1, 0, 2, 0), card("k6", "What happens in systole?", "Ventricles contract and eject blood.", 1, 3, 2, 0)]}],
 tasks: [
  {id: "t1", title: "Care Plan 2", courseId: "c1", due: d(1), time: "23:59", status: "todo", type: "Assignment"},
  {id: "t2", title: "Psych Midterm", courseId: "c1", due: d(9), status: "todo", type: "Exam"},
  {id: "t3", title: "Lab Report: Cardiac Cycle", courseId: "c2", due: d(3), status: "todo", type: "Lab"},
  {id: "t4", title: "A&P Quiz 4", courseId: "c2", due: d(3), status: "todo", type: "Quiz"},
  {id: "t5", title: "Reflection Journal 3", courseId: "c3", due: d(-2), status: "todo", type: "Assignment"},
  {id: "t6", title: "History Essay: Causes of WWI", courseId: "c4", due: d(6), status: "todo", type: "Assignment"},
  {id: "t7", title: "A&P Final Exam", courseId: "c2", due: d(20), status: "todo", type: "Exam"},
  {id: "t8", title: "Read Chapter 7", courseId: "c3", due: d(3), status: "doing", type: "Reading"},
  {id: "g1", title: "Psych Quiz 1", courseId: "c1", due: d(-20), status: "done", type: "Quiz", mark: {got: 17, outOf: 20}},
  {id: "g2", title: "Psych Paper 1", courseId: "c1", due: d(-12), status: "done", type: "Assignment", mark: {got: 88, outOf: 100}},
  {id: "g3", title: "A&P Quiz 1", courseId: "c2", due: d(-18), status: "done", type: "Quiz", mark: {got: 11, outOf: 20}},
  {id: "g4", title: "A&P Lab 1", courseId: "c2", due: d(-10), status: "done", type: "Lab", mark: {got: 30, outOf: 50}},
  {id: "g5", title: "Foundations Quiz 1", courseId: "c3", due: d(-15), status: "done", type: "Quiz", mark: {got: 19, outOf: 20}}]}; })()
