/* The Companion tab, being honest and careful (98-companion-tab.js asks these before any AI step):
     cantDo    a request for something outside Studyboard (email, text or call someone, Brightspace or Canvas, book, order or pay,
               print, share the planner, register for classes, a phone alarm, Google Calendar): said plainly, nothing changed, with
               what Studyboard can do instead. Never a made-up "done", a Wikipedia article, or a course called "Spring Classes".
     risk      words about not wanting to live or hurting someone: a caring reply with crisis lines, written here, never left to a
               small model; the next few turns keep a gentle, careful voice (CARE_RULE for the chat model)
     integrity "write my essay", "give me the quiz answers": the chat model kindly declines and helps them do it (INTEGRITY_RULE) */
window.SBCARE = (() => {
  const low = s => String(s == null ? "" : s).toLowerCase().replace(/[’‘]/g, "'");
  // a request ("email dr chen...", "can you book...", "please print..."), not a question about it or a statement
  const ASKS = /^\s*(?:(?:hey|ok(?:ay)?|so|um|pls|please|just|now)[,\s]+)*(?:(?:can|could|would|will) (?:you|u)\s+(?:please\s+|pls\s+|just\s+)?|i (?:want|need) you to\s+|go(?: ahead and)?\s+|help me\s+)?/;
  const RULES = [
    {re: /^(?:e-?mail|send (?:an? )?e-?mail(?: to)?|write (?:an? )?e-?mail to|reply to)\b|^(?:message|text|dm|whatsapp|snapchat)\s+(?!me\b|size\b|colou?r\b|font\b)(?:my|the|him|her|them|everyone|\w+)\b|^(?:let|tell)\s+(?:my|the)\s+(?:study group|group|friends?|class|classmates?|team|roommates?|partner|lab partner)\b/,
      say: w => `I can't send ${/text|message|dm|whatsapp|snap|tell|let/.test(w) ? "texts or messages" : "emails"} from Studyboard, so I didn't change anything. I can help you write what to say, or add a task to remind you to send it.`},
    // a phone call to someone ("call the clinical coordinator", "phone my mom"), not "call it Heart 2", "call me Jules", "call the essay 'X'"
    {re: /^(?:phone|ring|facetime)\s+(?:my|the|him|her|them|dr|prof|professor)\b|^call\s+(?!(?:it|me|this|that|them|the (?:essay|task|deck|note|board|quiz|course|class|event|assignment|lab|paper|project|reading|history|psych|care))\b)(?:my|the|him|her|dr\.?|prof\.?|professor|doctor|nurse|clinical|coordinator|advisor|office|mom|dad|someone)\b(?!.*\binstead\b)/, say: () => "I can't make phone calls, so I didn't change anything. I can add a task to remind you to call, if that helps."},
    {re: /^(?:ask|contact|reach out to|get in touch with|tell)\s+(?:my\s+)?(?:prof|professor|dr|doctor|instructor|teacher|ta|tutor|advisor|coordinator)\b/, say: () => "I can't contact your instructor for you, so I didn't change anything. I can help you write the message, and once they reply, tell me and I'll update the due date."},
    {re: /^(?:submit|upload|turn in|hand in|post|put)\b.*\b(?:to|on|in|into|onto)\s+(?:the\s+|my\s+)?(?:brightspace|canvas|moodle|blackboard|d2l|dropbox|drive|google drive|onedrive|portal|website|site|lms|turnitin)\b/,
      say: w => `I can't ${/upload|dropbox|drive|onedrive/.test(w) ? "upload files to other sites" : "submit work to your school site"}, so I didn't change anything. Once you've ${/upload/.test(w) ? "uploaded" : "submitted"} it, tell me and I'll mark it done.`},
    {re: /^(?:check|look (?:at|in)|log ?in(?:to)?|open|go on|look on)\s+(?:my\s+|the\s+)?(?:brightspace|canvas|moodle|blackboard|d2l|email|inbox|gmail|outlook|portal|student portal)\b/,
      say: w => /email|inbox|gmail|outlook/.test(w) ? "I can't read your email, so I didn't change anything." : "I can't look at Brightspace or your school site from the chat, so I didn't change anything. If you tell me the mark, I'll record it. (Connecting your school site in Settings, School and Calendar brings due dates, grades and announcements in.)"},
    {re: /^(?:book|reserve)\s+(?:me\s+|us\s+)?(?:a\s+|an\s+|the\s+|my\s+)?(?:\w+\s+)?(?:flight|flights|hotel|table|ticket|tickets|room|uber|lyft|ride|trip|appointment|bus|train|car|stay|airbnb)\b|^(?:order|buy|purchase|get)\s+(?:me\s+)?(?:a\s+|an\s+|some\s+)?(?:pizza|food|lunch|dinner|coffee|takeout|delivery|uber|lyft|ride|ticket|tickets|flight|textbook|book)\b|^pay\s+(?:for\s+)?(?:my|the)\b|^order\b/,
      say: w => `I can't ${/^pay/.test(w) ? "make payments" : /^order|^buy|^purchase|^get/.test(w) ? "order or buy things" : "book things"}, so I didn't change anything.${/flight|trip|ticket|appointment/.test(w) ? " I can add a task to remind you to do it." : ""}`},
    {re: /^print\b/, say: () => "I can't print from the chat, so I didn't change anything. Settings has Print or Save as PDF (under AI and Tools) for printing from Studyboard."},
    {re: /^share\s+(?:my\s+|the\s+)?(?:planner|calendar|schedule|board|studyboard|tasks|notes|everything)\b/, say: () => "I can't share your planner with other people, so I didn't change anything. To study together, you can start a study group in Groups and send them the invite code."},
    {re: /^(?:register|enrol+|sign)\s+(?:me\s+)?(?:up\s+)?(?:for|in|into)\b/, say: () => "I can't register you for classes: that's done on your school's site, so I didn't change anything. I can add a task to remind you to register, and once you're in, I can add the courses here."},
    {re: /\balarm\b|\bringtone\b|\bwake me\b/, say: () => "I can't set alarms on your phone, so I didn't change anything. Studyboard can remind you instead: add a task with a time, and reminders are in Settings, Notifications."},
    {re: /^(?:sync|connect|link|export)\b.*\b(?:google|outlook|apple|ical|icloud)\s*(?:calendar|cal)?\b|\b(?:google|outlook|apple)\s+calendar\b.*\bsync\b/, say: () => "I can't connect calendars from the chat, so I didn't change anything. Settings, School and Calendar, Calendar Sync gives you a live link for Google, Apple or Outlook Calendar."},
    {re: /^(?:hack|change|edit|fix)\s+(?:into\s+)?(?:my\s+)?(?:prof(?:essor)?'?s?|the school'?s?|teacher'?s?)\s+(?:grades?|marks?|gradebook|system)|^hack\b/, say: () => "That's a no from me, but nice try! I can help you bring those grades up the honest way, though."}
  ];
  function cantDo(q){
    const w0 = low(q).trim(); if (!w0 || w0.length > 240) return null;
    // a question about it ("can I sync with google calendar?", "how do I print?") is answered, not refused
    if (/^\s*(how|where|is|are|does|do i|can i|could i|what|why|when)\b/.test(w0)) return null;
    const m = ASKS.exec(w0), w = w0.slice(m ? m[0].length : 0).replace(/^(?:please|pls)\s+/, "");
    for (const r of RULES) if (r.re.test(w)) return r.say(w);
    return null;
  }

  // ---- care ----
  const RISK = /\b(kill(ing)? (myself|my ?self)|end(ing)? (it all|my life|things)|take my (own )?life|want(ed)? to die|wanna die|wish i (was|were) dead|don'?t want to (be here|live|exist|wake up)|no reason to (live|be here)|suicid\w*|hurt(ing)? (myself|herself|himself|themselves|themself)|self[- ]?harm\w*|cut(ting)? myself|better off (dead|without me)|can'?t go on|not (be|being) around anymore)\b/;
  const DISTRESS = /\b(hopeless|nothing matters|no point (anymore|in anything)|can'?t breathe|panic attack|having a panic|so alone|feel(ing)? (so )?alone|feel(ing)? empty|worthless|nobody (would )?(care|notice|miss)|no one (would )?(care|notice|miss)|wouldn'?t (even )?notice|bother anyone|falling apart|breaking down|can'?t cope|can'?t do this anymore)\b/;
  const risk = q => RISK.test(low(q));
  const distress = q => RISK.test(low(q)) || DISTRESS.test(low(q));
  // the reply to words about not wanting to live, or about someone else in danger: written here, the same every time
  function riskReply(q){
    const w = low(q), other = /\b(my )?(friend|roommate|sister|brother|cousin|classmate|boyfriend|girlfriend|partner|mom|dad|she|he|they)\b[^.?!]*\b(hurt|kill|die|suicid|end)/.test(w) && !/\b(myself|i want|i'?m going)\b/.test(w);
    if (other) return "Thank you for telling me. That's a lot to carry, and you did the right thing by saying something. Their safety comes first: please tell a trusted adult, your RA or campus counseling soon, even if they asked you to keep it secret. If they might be in danger right now, call 911 (or your local emergency number), or call or text 988 (the Suicide & Crisis Lifeline in the US and Canada) for advice on how to help. How are you holding up?";
    return "I'm really glad you told me, and I care about how you're doing. Are you safe right now? If you're thinking about ending your life or might act on these feelings, please call or text 988 (the Suicide & Crisis Lifeline in the US and Canada) or your local emergency number now; outside North America, your local crisis line can help. Talking to someone you trust, or your campus counseling centre, can help too. I'm here, and we can keep talking.";
  }
  const CARE_RULE = `

IMPORTANT: the student may be struggling emotionally right now. Be gentle, calm and present, in short warm sentences. Don't mention deadlines, tasks, grades or studying unless they bring them up. Validate how they feel, don't lecture, and don't rush to fix. Gently encourage talking to someone they trust or campus counseling. If anything suggests they might hurt themselves or someone else, or don't want to live, say kindly that they can call or text 988 (Suicide & Crisis Lifeline, US and Canada) or their local emergency number, any time. If they want to talk about something lighter, go with it warmly and remind them support is there.`;
  const INTEGRITY = /\b(write|do|finish|complete|make)\s+(my|the|this|that)\s+([\w&]+\s+){0,3}(essay|paper|assignment|homework|hw|care plan|lab report|report|project|intro|introduction|conclusion|discussion post)\b(?!\s+(due|on|for (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)))|\b(do|write|finish)\b[^.?!]{0,30}\bfor me\b|\b(give|tell|send) me (the )?answers?\b|\banswers? to (the |my )?(quiz|test|exam|homework|lab|question)/;
  const INTEGRITY_RULE = `

If they ask you to write or do graded work for them (an essay, a care plan, homework, quiz or test answers), kindly say you won't do it for them, without lecturing, and offer to help them do it themselves: brainstorm, outline, explain, quiz them, or give feedback on their draft. If they insist, stay kind and firm and offer the help again.`;
  const integrity = q => INTEGRITY.test(low(q));
  // the next few messages after a crisis reply, where a model drifts: not sure they're safe, a friend's secret, changing the subject
  // ("i don't know" after "are you safe right now?", "she told me not to tell anyone", "can we just talk about something else")
  function riskFollow(q, other){
    const w = low(q).trim();
    if (other && /\b(not to tell|told me not|don'?t tell|keep (it|this) (a )?secret|promised|be mad|get mad|hate me|be angry|betray|snitch|trust me)\b/.test(w))
      return "I get why that feels hard, and caring about how she'll feel shows you're a good friend. But when someone's safety is at risk, telling a trusted adult isn't betraying her; it's how she gets help. An RA, a counselor or a trusted adult will know what to do. If she might be in danger right now, call 911 or call or text 988. You don't have to carry this by yourself.";
    if (!other && /^(i\s+)?(don'?t|dont|do not)\s+know\b|^(idk|not sure|i'?m not sure|maybe|kind of|kinda|sort of|i guess)\s*[.!?]*$/.test(w))
      return "That's okay. Not being sure is a lot to sit with. Because you're not sure, please reach out to someone now: call or text 988 (the Suicide & Crisis Lifeline in the US and Canada), or your local emergency number if you might act on these feelings. You could also tell someone you trust that you're having a hard time. I'm right here with you.";
    if (!other && /\b(talk about something else|change the subject|something else|distract me|talk about anything)\b/.test(w))
      return "Of course, we can talk about something else. What's something small that made you smile lately, or a show or song you've had on repeat? And if those heavy feelings come back, 988 is there any time, by call or text.";
    return null;
  }
  return {cantDo, risk, distress, riskReply, riskFollow, CARE_RULE, integrity, INTEGRITY_RULE};
})();
