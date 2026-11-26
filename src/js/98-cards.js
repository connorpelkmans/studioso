/* Flashcards and decks in the chat, read in code (the Companion tab asks this before the AI step). A small model reached for "add a
   task" or "I can't do that" on most card wordings; here every wording in the tests is read the same way:
     add       "add a card to Heart: X / Y", "put 'X / Y' in my psych deck", "Heart deck, add: X? Y", "front: X, back: Y",
               "card: X. deck: Y", "to my psych deck add X = Y", "new card for the heart deck - X? Y", "add one about diastole"
               (a topic only: the AI writes a one-line answer from their notes), "add 3 cards to heart about the conduction pathway"
     follow-up "add another card to it", "and displacement too", "do the same for heart with X", "change the answer to ...",
               "make the answer more complete", "remove it"; the answer to its own question ("which deck?", "what should it say?")
     decks     "make me a deck" asks for the name; "call it X", "idk you choose"; a deck that's already there is said
   The card is saved with Studyboard's own saveDeck (Undo works), and what was added is said in words. */
window.SBCARDS = (() => {
  const low = s => String(s == null ? "" : s).toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
  const clean = s => String(s || "").replace(/^[\s"'“”‘’:,-]+|[\s"'“”‘’,]+$/g, "").replace(/\s+/g, " ").trim();
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const decks = () => (typeof decksArr === "function" ? decksArr() : Object.values(state.decks || {})).filter(d => d && !d.archived && !d.quizOnly);
  const GENERIC = /^(deck|decks|set|cards?|flashcards?|terms?|nursing|my|the|notes?|study|review)$/;
  // the deck a message names, by any of its own words ("psych deck", "heart", "psych nursing terms", "the psych one")
  function deckIn(q){
    const s = low(q); let best = null, bs = 0;
    decks().forEach(d => { const n = low(d.name); let sc = s.includes(n) ? 10 + n.length : 0;
      const ws = (n.match(/[a-z0-9&]+/g) || []).filter(w => w.length >= 3 && !GENERIC.test(w));
      ws.forEach(w => { if (new RegExp(`\\b${w.replace(/[&]/g, "\\&")}`).test(s)) sc += 3; else if (w.length >= 5 && new RegExp(`\\b${w.slice(0, 4)}`).test(s)) sc += 1; });
      if (sc > bs) { bs = sc; best = d; } });
    return bs >= 3 ? best : null;
  }
  // a deck the message names that doesn't exist ("the cardiology deck")
  const missingDeck = q => { const m = /\b(?:the|my|a|to|in|into)\s+([a-z0-9&][\w&' -]{1,30}?)\s+(?:deck|set)\b/i.exec(q) || /\b(?:to|in|into)\s+(?:the\s+)?deck\s+["“']?([\w&' -]{2,40}?)["”']?(?=\s+with\b|\s*[.!?]*$)/i.exec(q) || /\bback\b.*\s(?:to|in|into)\s+(?:the\s+|my\s+)?([A-Z][\w&' -]{1,40}?)\s*[.!?]*$/.exec(q); if (!m) return ""; const n = clean(m[1]).replace(/^(new|empty|blank|flash ?card|my|the)\s+/i, ""); return n && !/^(new|empty|blank|that|this|same|other|right|first|second|last|flashcard|card)$/i.test(n) && !deckIn(n) ? n : ""; };
  const CARD = /\b(flash ?cards?|cards?)\b/i;
  // the question and answer, however they're written
  function qa(q){
    let s = String(q || "").trim(), m;
    const says = x => x.replace(/^(?:side\s+)?(?:that says|which says|saying|says|reading|that reads|is|of|as)\s+/i, "");
    if ((m = /\bfront\s*[:=-]?\s*(.+?)\s*,?\s*(?:and\s+)?(?:the\s+)?\bback\s*[:=-]?\s*(.+?)\s*$/i.exec(s))) return {front: clean(says(m[1].replace(/\b(?:to|in|into)\s+(?:the\s+|my\s+)?[\w ]{1,30}\s+deck\b.*$/i, ""))), back: clean(says(m[2].replace(/\s+(?:to|in|into)\s+(?:the\s+)?deck\s+.*$/i, "").replace(/\s+(?:to|in|into)\s+(?:the\s+|my\s+)?[\w ]{1,30}?\s*deck\b.*$/i, "").replace(/\s+(?:to|in|into)\s+(?:the\s+|my\s+)?[A-Z][\w&' -]{1,40}\s*[.!?]*$/, "").replace(/\.\s*deck\s*:.*$/i, "")))};
    // "card: X? Y. deck: Z"
    s = s.replace(/[.,]?\s*\bdeck\s*:\s*[^.]+$/i, "");
    // the part with the card in it: quoted, after a colon or "goes", or the whole message
    // quoted: "..." or '...' (an apostrophe inside a word, "nurse's", isn't the closing quote)
    const quoted = (/["“]([^"”]{3,300})["”]/.exec(s) || /(?:^|[\s(:])['‘](.{3,300}?)['’](?=[\s.,!?)]|$)/.exec(s) || [])[1];
    let t = quoted || (/\bdo the same for\b.*?\bwith\s+(.{3,300})$/i.exec(s) || [])[1] || (/(?::|\bgoes\b:?|\s-\s)\s*(.{3,300})$/i.exec(s) || [])[1] || "";
    // "heart. what is the bundle of His? part of ...": a deck's name, then the card
    if (!t && /\?\s+\S/.test(s)) t = s.replace(/^\s*[\w&' ]{2,30}?[.:,]\s+(?=(what|who|why|how|when|where|which|define|name)\b)/i, "");
    if (!t && /\s(?:\/|->|→|=)\s/.test(s)) t = s;
    if (!t) { m = /\b(?:add|put|stick|make|new card|card)\b.*?\b(?:deck|terms|set)\b\s*(?:add\s+)?(.{3,300})$/i.exec(s); if (m) t = m[1]; }
    if (!t) { m = /^\s*(?:to|in|into)\s+(?:my\s+|the\s+)?[\w ]{2,30}?\s+(?:deck|set)\s+add\s+(.{3,300})$/i.exec(s) || /\badd\s+(.{3,200}?)\s+(?:to|in|into)\s+(?:my\s+|the\s+)?[\w ]{2,30}?\s*(?:deck|set)?\s*$/i.exec(s); if (m) t = m[1]; }
    if (!t) return null;
    t = t.replace(/\s+(?:to|into|in)\s+(?:my\s+|the\s+)?[\w&' ]{2,30}?\s+(?:deck|set)\s*[?.!]*$/i, "").replace(/\s+(?:on a card|as a card)\b.*$/i, "").trim();
    for (const sep of [/\s+\/\s+|\s*\/\s*(?=[A-Z])/, /\s*->\s*|\s*→\s*/, /\s+=\s+|\s*=\s*/, /\s+\|\s+/]) { const p = t.split(sep); if (p.length === 2 && clean(p[0]) && clean(p[1])) return {front: clean(p[0]), back: clean(p[1])}; }
    if ((m = /^(.{3,200}?\?)\s*(.{2,300})$/.exec(t))) return {front: clean(m[1]), back: clean(m[2]).replace(/[?]$/, "")};
    if ((m = /^(.{3,200}?)\.\s+(.{2,300})$/.exec(t)) && /^(what|who|why|how|when|where|which|define|name)\b/i.test(m[1])) return {front: clean(m[1]) + "?", back: clean(m[2])};
    // "what is denial refusing to accept reality": a "what is X" with the answer straight after it
    if ((m = /^((?:what|who) (?:is|are|was|were) (?:the |an? )?[\w-]+)\s+(.{8,300})$/i.exec(t)) && m[2].split(/\s+/).length >= 3) return {front: cap(clean(m[1])) + "?", back: clean(m[2])};
    return null;
  }
  // a topic with no answer given ("a card about the superego", "one about diastole", "the purkinje fibers card", "and displacement too")
  function topicOf(q){
    const s = String(q || "").trim(); let m;
    if ((m = /\b(?:card|one|flashcard)s?\s+(?:about|on|for|explaining|that asks|asking)\s+(?:what\s+)?(?:the\s+|an?\s+)?(.{2,60}?)(?:\s+(?:is|are))?\s*(?:\b(?:to|in|into|for)\s+(?:my\s+|the\s+)?[\w&' ]{2,30}?\s*(?:deck|set|terms)?)?\s*[?.!]*$/i.exec(s))) return clean(m[1]);
    if ((m = /\b(?:one more|another(?: one)?|one)\s+(?:card\s+)?(?:about|on|for)\s+(?:the\s+)?(.{2,60}?)\s*[?.!]*$/i.exec(s))) return clean(m[1]);
    if ((m = /\badd\s+(?:the\s+|a\s+|an\s+)?(.{2,40}?)\s+card\b/i.exec(s)) && !/^(a|another|one|new|flash)$/i.test(m[1])) return clean(m[1]);
    if ((m = /\bthat asks\s+(?:what|who)\s+(?:the\s+|an?\s+)?(.{2,60}?)\s+(?:is|are|does|do)\s*[?.!]*$/i.exec(s) || /\bthat asks (?:about\s+)?(.{2,60}?)\s*[?.!]*$/i.exec(s))) return clean(m[1]);
    if ((m = /\bcards?\b.*?\babout\s+(?:the\s+|an?\s+)?(.{2,40}?)\s*[?.!]*$/i.exec(s))) return clean(m[1]);
    if ((m = /\bneeds?\s+(?:a\s+)?card\s+(?:on|about|for)\s+(.{2,60}?)\s*[?.!]*$/i.exec(s))) return clean(m[1]);
    if ((m = /\b(?:with|about)\s+(.{2,40}?)\s*[?.!]*$/i.exec(s)) && /\b(same|another|too|also)\b/i.test(s)) return clean(m[1]);
    if ((m = /^\s*(?:and\s+)?(?:add\s+)?(.{2,40}?)\s+(?:too|as well|also)\s*[?.!]*$/i.exec(s))) return clean(m[1]);
    return "";
  }
  const sayIt = (answer, card) => ({answer, sources: [], followUps: [], actions: [], card});
  // an answer for a front, from their notes (or what the AI knows), one short line
  async function backFor(front, deck){
    let notes = ""; try { const R = window.SBSEARCH ? await SBSEARCH.retrieve(front, {max: 4, chars: 600, wait: 800, readWait: 1, semWait: 2000}) : null; if (R && R.text) notes = R.text.slice(0, 2400); } catch (e) {}
    const r = await aiCall({task: "chat", maxTokens: 200, temperature: 0, schema: {type: "OBJECT", properties: {front: {type: "STRING"}, back: {type: "STRING"}}, required: ["front", "back"]},
      system: "You write one flashcard for a student. front: a short question about the topic. back: the answer in one short, correct sentence (under 20 words). Use the student's notes when they cover it; otherwise what is generally taught. No markdown.",
      parts: [{text: `${notes ? "THE STUDENT'S NOTES:\n" + notes + "\n\n" : ""}DECK: ${deck ? deck.name : ""}\nTOPIC: ${front}`}]}).catch(() => null);
    const d = (r && r.data) || {}; return {front: clean(d.front) || `What is ${front}?`, back: clean(d.back)};
  }
  async function cardsAbout(topic, n, deck){
    let notes = ""; try { const R = window.SBSEARCH ? await SBSEARCH.retrieve(topic, {max: 5, chars: 700, wait: 800, readWait: 1, semWait: 2000}) : null; if (R && R.text) notes = R.text.slice(0, 3200); } catch (e) {}
    const have = (deck.cards || []).map(c => c.front).join("; ");
    const r = await aiCall({task: "chat", maxTokens: 600, temperature: 0, schema: {type: "OBJECT", properties: {cards: {type: "ARRAY", items: {type: "OBJECT", properties: {front: {type: "STRING"}, back: {type: "STRING"}}, required: ["front", "back"]}}}, required: ["cards"]},
      system: `You write exactly ${n} flashcards for a student about the topic, each different. front: a short question; back: one short correct sentence. Use the student's notes when they cover it. Don't repeat a card the deck already has.`,
      parts: [{text: `${notes ? "THE STUDENT'S NOTES:\n" + notes + "\n\n" : ""}THE DECK ALREADY HAS: ${have || "nothing"}\nTOPIC: ${topic}`}]}).catch(() => null);
    return (((r && r.data) || {}).cards || []).map(c => ({front: clean(c.front), back: clean(c.back)})).filter(c => c.front && c.back).slice(0, n);
  }
  function save(deck, list){
    const nd = JSON.parse(JSON.stringify(deck)); nd.cards = nd.cards || []; const ids = [];
    list.forEach(c => { const id = uid(); ids.push(id); nd.cards.push({id, front: c.front, back: c.back, box: 0, due: "", seen: 0, right: 0, wrong: 0}); });
    nd.updated = Date.now(); saveDeck(nd, list.length === 1 ? `Card added to ${deck.name}` : `${list.length} cards added to ${deck.name}`); return ids;
  }
  const dupOf = (deck, front) => { const f = low(front).replace(/^(what|who) (is|are|does|do)\s+(the\s+|an?\s+)?|[?.!]/g, "").trim(); return f.length >= 3 ? (deck.cards || []).find(c => low(c.front).includes(f) || (f.split(/\s+/).length === 1 && low(c.front + " " + c.back).match(new RegExp(`\\b${f}\\b`)))) : null; };
  const deckList = () => decks().map(d => d.name).join(", ");

  // the message about a card: a result, or null when it isn't one. last: the card or deck the chat was just about
  async function request(q, last, o){
    o = o || {};
    const s = low(q).trim(), L = last || {};
    const lastDeck = L.deck && state.decks[L.deck] ? state.decks[L.deck] : null, lastCard = lastDeck && L.card ? (lastDeck.cards || []).find(c => c.id === L.card) : null;
    // changing the card just added: "change the answer to X", "make the answer more complete", "remove it"
    if (lastCard && /^\s*(?:actually\s+|no\s+|wait\s+)?(?:change|make|set|fix|edit|update)\s+(?:the\s+|its\s+|that\s+)?(?:answer|back)\b/.test(s)) {
      let back = (/\b(?:to|:)\s+(.{2,300})$/i.exec(q) || [])[1];
      if (!back && /\b(more complete|longer|fuller|better|more detail|more detailed)\b/.test(s)) { const b = await backFor(lastCard.front + " (a fuller answer than: " + lastCard.back + ")", lastDeck); back = b.back; }
      if (!back) return sayIt("What should the answer say?", L);
      const nd = JSON.parse(JSON.stringify(lastDeck)), c = nd.cards.find(x => x.id === lastCard.id); c.back = clean(back); nd.updated = Date.now(); saveDeck(nd, "Card answer changed");
      return sayIt(`Changed the answer on "${lastCard.front}" to "${c.back}". Say "undo" to take it back.`, L);
    }
    if (lastCard && /^\s*(?:remove|delete|take out|get rid of)\s+(?:it|that|that card|the card|this card)\s*[.!]*$/.test(s)) {
      const nd = JSON.parse(JSON.stringify(lastDeck)); nd.cards = nd.cards.filter(c => c.id !== lastCard.id); nd.updated = Date.now(); saveDeck(nd, "Card removed");
      return sayIt(`Removed "${lastCard.front}" from ${lastDeck.name} (${nd.cards.length} card${nd.cards.length === 1 ? "" : "s"} now). Say "undo" to bring it back.`, {deck: lastDeck.id});
    }
    // the answer to its own question: which deck, or what the card says
    // (a new request or question isn't the answer: "create a study group called P3" after "which deck?")
    if (L.ask && !/^\s*(no|nah|never ?mind|cancel|skip|stop)\b/.test(s) && !(!CARD.test(s) && /^\s*(?:please\s+|(?:can|could|would) you\s+)?(?:create|make|start|add|delete|remove|move|set|open|go|take|show|what|how|when|why|who|is|are|do|does|did|mark|change|rename|should|can|could|will|would|where|let'?s|lets|thanks|thank|ok|okay|lol|haha)\b/.test(s) && !/^\s*(?:use|put it in)\b/.test(s)) && !(!CARD.test(s) && /\?\s*$/.test(s) && !/\//.test(s))) {
      const dk = L.ask === "deck" ? (deckIn(q) || (/\b(the )?(first|1st)\b/.test(s) ? decks()[0] : /\b(the )?(second|2nd)\b/.test(s) ? decks()[1] : null)) : lastDeck;
      if (L.ask === "deck" && !dk) { const mn = clean(q.replace(/^(use|in|put it in|the)\s+/i, "")); return sayIt(`You don't have a deck called "${mn}". Your decks: ${deckList()}.`, Object.assign({}, L)); }
      const pend = L.pending || qa(q.replace(new RegExp(`^\\s*(?:${dk ? dk.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "xx"}|[a-z ]{2,20}?)\\s*[.:,]\\s*`, "i"), "")) || (L.ask === "deck" ? qa(q) : null);
      if (pend && dk) { const dup = dupOf(dk, pend.front); if (dup && !o.force) return sayIt(`${dk.name} already has a card on that: "${dup.front}" / "${dup.back}". Add another one anyway?`, {deck: dk.id, ask: "dup", pending: pend});
        const id = save(dk, [pend])[0]; return sayIt(`Added to ${dk.name}: "${pend.front}" / "${pend.back}". Say "undo" to take it back.`, {deck: dk.id, card: id}); }
      if (L.ask === "dup") { if (/^\s*(yes|yeah|yep|sure|ok|okay|add it|do it|anyway)\b/.test(s) && L.pending && lastDeck) { const id = save(lastDeck, [L.pending])[0]; return sayIt(`Added it anyway: "${L.pending.front}" / "${L.pending.back}".`, {deck: lastDeck.id, card: id}); } return sayIt(`Okay, I left ${lastDeck ? lastDeck.name : "the deck"} as it is.`, {deck: L.deck}); }
      if (dk && (L.ask === "deck" || L.ask === "say")) {
        const tp = /^\s*(you (pick|choose|decide)|idk|dunno|anything|whatever|surprise me)\b/.test(s) ? "__pick" : clean(q.replace(new RegExp(`\\b${dk.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"), "").replace(/^\s*(?:use|in|put it in|the|a card (?:about|on))\s+/i, ""));
        if (L.ask === "deck" && !tp.replace(/[^a-z]/gi, "")) return sayIt(`What should the ${dk.name} card say? For example: What is diastole? / The ventricles relax and fill.`, {deck: dk.id, ask: "say"});
        if (tp && tp !== "__pick" && tp.split(/\s+/).length <= 8) { const c = await backFor(tp, dk); if (c.back) { const dup = dupOf(dk, tp); if (dup) return sayIt(`${dk.name} already has a card on that: "${dup.front}".`, {deck: dk.id}); const id = save(dk, [c])[0]; return sayIt(`Added to ${dk.name}: "${c.front}" / "${c.back}". Say "undo" to take it back.`, {deck: dk.id, card: id}); } }
        if (tp === "__pick") { const c = (await cardsAbout(dk.name, 1, dk))[0]; if (c) { const id = save(dk, [c])[0]; return sayIt(`Added to ${dk.name}: "${c.front}" / "${c.back}". Say "undo" to take it back.`, {deck: dk.id, card: id}); } }
      }
    }
    // ("Heart: add 'X / Y'": a deck's name, then add)
    const lead = /^\s*([\w&' ]{2,40}?)\s*[:,-]\s*add\b/.exec(s);
    const isCardMsg = CARD.test(s) || (!!lead && !!deckIn(lead[1])) || /\b(?:deck|terms)\b\s*(?:,|:|-)?\s*add\b|\binto the [\w ]+ deck goes\b|^\s*(?:to|in|into)\s+(?:my|the)\s+[\w ]{2,30}\s+deck\s+add\b/.test(s)
      || (!!lastDeck && /^\s*(?:and\s+)?[\w' -]{2,40}\s+too\s*[?.!]*$|\bdo the same for\b|^\s*(?:and\s+|now\s+)?add\s+(?:another|one more|one)\b/.test(s));
    if (!isCardMsg) return null;
    // going to a page ("take me to flashcards", "open my decks"), not a card
    if (/^\s*(?:(?:can|could) you\s+|please\s+)?(?:take me|go|bring me|switch|navigate|jump|open|show me|show)\b/.test(s) && !/\b(add|put|new card|front|back)\b/.test(s)) return null;
    // not about one card: making a set from material, a quiz, cards from a quiz, counts and lists ("how many cards")
    if (/^\s*(how many|what|which|what's|whats|show|list|study|review|quiz|drill)\b|\b(from (?:my |the )?(?:quiz|test|notes?|file|slides)|turn .* into|into flashcards|make (?:me )?(?:some |a )?(?:flash ?)?cards? (?:on|about|for|from)|(?:flash ?)?cards (?:on|about|for|from))\b/.test(s) && !/\badd\b/.test(s)) return null;
    // studying, quizzing, settings, how-to and checking cards ("lets do psych cards", "start a flashcard session", "notifications off for
    // flashcard reminders", "how do i make a deck", "are my heart flashcards correct", "sum up my flashcards"): not a card to add
    const pend0 = qa(q);
    if (!pend0 && !lead && (/\b(session|study|studying|review|reviewing|quiz|quizzes|test me|go over|practi[cs]e|drill|notifications?|reminders?|remind|settings?|correct|accurate|right\?|sum up|summari[sz]e|section|backwards|shuffle)\b|^\s*(?:ok\s+|okay\s+|fine,?\s+)?(?:let'?s|lets)\b|\b(?:do|doing|start|starting)\s+(?:some |the |my |a |more )?(?:[\w]+ )?(?:flash ?)?cards?\b|^\s*(?:how|is|are|does|do|did|can i|could i|should i|which|why)\b|\bflash ?cards? (?:it is|then)\b/.test(s))) return null;
    // a card only when one is asked for: added, put, made, written, or given as front and back
    if (!pend0 && !lead && !/\b(add|adding|put|new|make|create|write|stick|throw|insert|include|another|one more)\b/.test(s)) return null;
    const follow =/^\s*(?:and\s+|now\s+)?(?:add\s+)?(?:another|one more|more)\b|\bto it\b|^\s*(?:and\s+)?[\w' -]{2,40}\s+too\s*[?.!]*$|\bdo the same\b/.test(s);
    let dk = deckIn(q.replace(/\b(?:front|back)\b.*$/i, "")) || deckIn(q) || (follow || /\b(it|that deck|the deck|this deck)\b/.test(s) ? lastDeck : null);
    // "the deck I just made" when none was
    if (!dk && /\b(i just made|i just created|the new one|my new deck)\b/.test(s)) { const nw = decks().slice().sort((a, b) => (b.created || 0) - (a.created || 0))[0]; dk = L.deck && state.decks[L.deck] ? state.decks[L.deck] : null; if (!dk) return sayIt(`Which deck? I don't see one you just made. Your decks: ${deckList()}.`, {ask: "deck", pending: qa(q)}); }
    const miss = !dk ? missingDeck(q) : "";
    if (miss) return sayIt(`You don't have a deck called "${cap(miss)}". Your decks: ${deckList()}. Which one should it go in? (Or say "make a deck called ${cap(miss)}".)`, {ask: "deck", pending: qa(q)});
    const pend = qa(q);
    // "add 3 cards to heart about the conduction pathway"
    const nm = /\b(\d|two|three|four|five)\s+(?:more\s+)?(?:flash ?)?cards?\b/.exec(s), N = nm ? ({two: 2, three: 3, four: 4, five: 5}[nm[1]] || Number(nm[1])) : 0;
    if (N > 1 && dk) { const tp = (/\b(?:about|on|for|covering)\s+(?:the\s+)?(.{2,60}?)\s*[?.!]*$/i.exec(q) || [])[1] || dk.name; const list = await cardsAbout(clean(tp), Math.min(N, 5), dk);
      if (!list.length) return sayIt(`I couldn't write cards about ${tp} just now. Try again, or tell me what they should say.`, {deck: dk.id});
      const ids = save(dk, list); return sayIt(`Added ${list.length} cards to ${dk.name}:\n${list.map(c => `- ${c.front} / ${c.back}`).join("\n")}\nSay "undo" to take them back.`, {deck: dk.id, card: ids[ids.length - 1], added: ids}); }
    if (!dk) return sayIt(pend ? `Which deck should it go in? Your decks: ${deckList()}.` : `Which deck, and what should the card say? Your decks: ${deckList()}.`, {ask: "deck", pending: pend});
    if (pend) { const dup = dupOf(dk, pend.front); if (dup) return sayIt(`${dk.name} already has a card on that: "${dup.front}" / "${dup.back}". Add another one anyway?`, {deck: dk.id, ask: "dup", pending: pend});
      const id = save(dk, [pend])[0]; return sayIt(`Added to ${dk.name}: "${pend.front}" / "${pend.back}". ${dk.name} has ${(state.decks[dk.id].cards || []).length} cards now. Say "undo" to take it back.`, {deck: dk.id, card: id}); }
    const tp = topicOf(q);
    if (tp && !/^(it|that|this|one|another|a card|card)$/i.test(tp)) {
      // a topic another deck is about ("add sublimation card to heart"): asked first
      const other = decks().find(d => d.id !== dk.id && (d.cards || []).some(c => new RegExp(`\\b${low(tp).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(low(c.front + " " + c.back))));
      if (other && !dupOf(dk, tp)) return sayIt(`${cap(tp)} sounds like it belongs in ${other.name}, not ${dk.name}. Should I put it in ${other.name} instead?`, {deck: other.id, ask: "say", pending: null});
      const dup = dupOf(dk, tp); if (dup) return sayIt(`${dk.name} already has a card on ${tp}: "${dup.front}" / "${dup.back}". Add another one anyway?`, {deck: dk.id, ask: "dup", pending: null});
      const c = await backFor(tp, dk); if (!c.back) return sayIt(`What should the ${tp} card say on the back?`, {deck: dk.id, ask: "say"});
      const id = save(dk, [c])[0]; return sayIt(`Added to ${dk.name}: "${c.front}" / "${c.back}". Say "undo" to take it back.`, {deck: dk.id, card: id});
    }
    return sayIt(`What should the ${dk.name} card say? For example: What is diastole? / The ventricles relax and fill.`, {deck: dk.id, ask: "say"});
  }
  return {request, deckIn, qa, topicOf};
})();
