// The free first deck: when Studyboard uses the AI on this device (no key, no Studyboard AI), a new student's first set of flashcards
// is made by Studyboard's cloud AI instead (Google's Gemma 4 26B on Cloudflare: ai.studyboardapp.com/v1/first-deck), so their first
// experience is fast and good. Once per device. The server only runs it while it fits in Cloudflare's free daily allowance; when
// it doesn't (or anything fails), the device makes the set as usual, without a word. Notes sent for it aren't kept.
const FIRST_DECK = {done: "sb-first-deck", dev: "sb-first-dev", tries: "sb-first-tries", wait: 60000, maxTries: 3};
const aiFirstGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const aiFirstSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
// Only on the device's AI, never under automated tests unless one opts in, and only for the first few sets (if the free allowance
// was used up for the day when a student made their first, it's offered on their next one or two, then not again)
function aiFirstDeckOk(){
  if (!aiOnDevice() || aiFirstGet(FIRST_DECK.done)) return false;
  if (navigator.webdriver && !window.__SB_FIRST_TEST) return false;
  if (navigator.onLine === false) return false;
  return (Number(aiFirstGet(FIRST_DECK.tries)) || 0) < FIRST_DECK.maxTries;
}
// The words of the material (photos and scans were read on this device first)
function aiFirstDeckText(sources){
  return sources.map(s => {
    if (s.part && typeof s.part.text === "string") return s.part.text;
    if (s.pdfPages && s.pdfPages.length) return s.pdfPages.map(p => p.lines.map(l => l.text).join("\n")).join("\n\n");
    return s.copyText || "";
  }).filter(Boolean).join("\n\n").trim();
}
function aiFirstDevice(){ let d = aiFirstGet(FIRST_DECK.dev); if (!d || !/^[A-Za-z0-9_-]{8,200}$/.test(d)) { d = "d" + uid() + uid(); d = d.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 60); aiFirstSet(FIRST_DECK.dev, d); } return d; }
// {cards, deckTitle} from the cloud, or null (then the device makes them)
async function aiFirstDeck({sources, courseName, count, signal, onStatus}){
  if (!aiFirstDeckOk()) return null;
  const text = aiFirstDeckText(sources);
  if (text.length < 150) return null;
  aiFirstSet(FIRST_DECK.tries, String((Number(aiFirstGet(FIRST_DECK.tries)) || 0) + 1));
  const ac = new AbortController(), stop = () => ac.abort(), timer = setTimeout(stop, FIRST_DECK.wait);
  if (signal) { if (signal.aborted) return null; signal.addEventListener("abort", stop, {once: true}); }
  try {
    if (onStatus) onStatus("Making your first set with Studyboard's free cloud AI…");
    const res = await fetch(AI_PRO + "/v1/first-deck", {method: "POST", headers: {"Content-Type": "application/json"}, signal: ac.signal,
      body: JSON.stringify({text: text.slice(0, 20000), course: courseName || "", count: count || 0, device: aiFirstDevice()})});
    if (res.status === 409) { aiFirstSet(FIRST_DECK.done, "1"); return null; }
    if (!res.ok) return null;
    const j = await res.json();
    if (!j || !Array.isArray(j.cards) || !j.cards.length) return null;
    aiFirstSet(FIRST_DECK.done, "1");
    return {cards: j.cards, deckTitle: j.deckTitle || ""};
  } catch (e) {
    if (signal && signal.aborted) throw e;
    return null;
  } finally { clearTimeout(timer); if (signal) signal.removeEventListener("abort", stop); }
}
// Said where the student makes the set, with a way to keep it on the device
function aiFirstDeckNote(){
  return aiFirstDeckOk() ? `<p class="mini ai-first-note" style="margin:0">Your first set is made free by Studyboard's cloud AI, so it's fast. Your notes go to Studyboard's server on Cloudflare to make it and aren't kept. After that, the AI on your computer makes your sets. <button type="button" class="link-btn" data-act="ai-first-skip">Use My Computer Instead</button></p>` : "";
}
hook("act", (act, el) => {
  if (act !== "ai-first-skip") return false;
  aiFirstSet(FIRST_DECK.done, "skipped"); const p = el.closest(".ai-first-note"); if (p) p.remove();
  toast("Your sets will be made by the AI on your computer");
  return true;
});
