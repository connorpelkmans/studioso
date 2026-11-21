// Which job a request is, from its system prompt (the app's on-device study-set steps have their own prompts)
const STEPS = [
  [/^You list the facts in a student's notes/, "facts"],
  [/^You turn facts into flashcards/, "fact-cards"],
  [/^You write multiple-choice practice questions from facts/, "fact-quiz"],
  [/^You make flashcards from a student's notes/, "cards"],
  [/^You are a careful student taking a quiz/, "solve"],
  [/^You are a strict, fair teacher/, "check"],
  [/practice (exam )?questions/i, "quiz"],
];
function stepOf(system, fallback){
  for (const [re, id] of STEPS) if (re.test(system)) return id;
  if (fallback) return fallback;
  const cat = require("../tasks/catalog.json");
  const hit = cat.find(j => j.system && system.startsWith(j.system.slice(0, 60)));
  return hit ? hit.id : "other";
}
module.exports = {stepOf};
