# Crunch week reel (Crunch Forecast)

Three versions of the same reel. Only the hook text (the first ~4.5 s) differs, so comparing them tells you which hook works.

| File | Hook (beats 1 → 2 → 3) | Formula | Length |
|---|---|---|---|
| `reel.mp4` (A) | "3 exams. 1 week." → "Most people find out the week before." → "But you could see it coming." | Number shock, then lean-in / interjection / snapback | 12.7 s |
| `reel-b.mp4` (B) | "Your worst week this term is already booked." → "You just can't see it yet." → "Here's how to find it." | Curiosity gap | 13.1 s |
| `reel-c.mp4` (C) | "POV: you spot hell week a month early." → "3 exams. Same week." → "And you're actually ready." | POV + dream outcome | 12.5 s |

All are 1080 × 1920, 30 fps, H.264, silent. Covers: `cover.png`, `reel-b-cover.png` and `reel-c-cover.png` (the hook frames).

## Why this reel

- **Feature:** Crunch Forecast (free). The README's own line is "a week with three exams and a paper glows red weeks ahead", which is the hook. A problem you can *see* (a red, shaking week) works as a first frame in a way a feature name never could.
- **Timing:** mid-November, finals are 2–4 weeks out. Students are living this right now, which makes it **sendable** ("this is literally our week 11"). Instagram ranks on watch time, likes and sends.
- **Structure (Kallaway):** context lean-in (the pain, in 3–5 words) → interjection → snapback, then the payoff starts by about 4.5 s: the calendar fills with colour week by week, Week 11 is tapped, its exams are listed, *Pull work forward*, the red cools and Hoot hops. End card: "See crunch week coming." with the URL, then a fade to the same navy as frame 0 so it loops.
- **Claims check:** everything shown is in the README (colours calm to crunch, tap a week for what's driving it, pull work forward with Undo, prep moves but exam dates don't, free). No invented numbers or testimonials.

## Pre-flight: five lenses

| Lens | Check | Result |
|---|---|---|
| Views | Frame 0 shows the problem, ≤ 7 words, motion, opens a loop? | Yes: red shaking week with stacked exams, "3 exams. 1 week.", then "Most people find out…" opens the loop. |
| Likes | Pain specific to this moment of the term? Payoff satisfying? | Pain: yes (finals in 2–4 weeks). Payoff was too small (the cooling happened in the shrunken calendar). **Fixed:** Week 11 now gets a green "calm" outline and the calendar pushes in when the work moves. |
| Comments | One easy personal question or mild debatable take, on screen and in the caption? | Was caption-only. **Fixed:** end card now asks "Which week is your Week 11? 👇", matching the caption. Pinned comment idea: "Mine's week 12: 2 exams and a lab report. Yours?" |
| Shares | Who sends this to whom, and which line? | A student sends it to the study group or the classmate taking the same exams. "3 exams. 1 week." carries it; the caption says "Send this to your study group." |
| Follows | Part of a series the profile promises more of? | Not yet. **Suggestion:** make this part 1 of a "Finals survival" series (next: Exam Prep Planner "3 days out", Exam Mode, Rough Week Rescue), pin it, and put "Finals survival series 📌" on the cover or a highlight. To check the profile itself, send Claude screenshots of the profile page, bio and highlights. |

## Storyboard (A; B and C shift by the hook's length)

| Time | On screen |
|---|---|
| 0–1.25 s | Navy. Dim term calendar, Week 11 glowing red and shaking, three exam chips piled on it. **"3 exams. 1 week."** |
| 1.25–2.9 s | **"Most people find out the week before."** |
| 2.9–4.45 s | **"But you could *see it coming.*"** |
| 4.45–5.9 s | Paper opens from Week 11. "Crunch Forecast · free / Every week, *calm to crunch.*" The calendar fills with colour, top to bottom. |
| 5.9–7.7 s | A tap on Week 11. The calendar slides up, the Week 11 sheet rises (Bio midterm, Chem exam, Calc exam, History essay, Calc review). Hoot: "Week 11 looks rough." |
| 7.7–9.9 s | *Pull work forward* is pressed. "Draft starts Week 9" and "Moved to Week 10" pop in, Crunch → Manageable, Week 11 cools from red to amber. Hoot hops: "Way better." |
| 9.9–12.7 s | End card: app icon, **"See crunch week coming."**, "Free · any browser · no account", studyboardapp.com, "Which week is your Week 11? 👇", Mochi and Hoot hop. Fades to navy (loops into frame 0). |

## Posting

**Test plan:** post A first. Post B and C on later days at the same time of day (or as Trial Reels on Instagram if your account has them, which show a reel to non-followers first). Compare **average watch time and sends per reach** in Insights after 3 days, then tell Claude the numbers.

**Sound:** add audio in the app. Pick something with a clear beat change around 4–5 s (when the paper opens), e.g. a trending lo-fi or "calm after chaos" track from the Reels/TikTok library. Library tracks are licensed for this; outside tracks may be muted.

**Caption (Instagram):**

> finals are closer than they look 👀
>
> Studyboard colours every week of your term from calm to crunch, so a week with 3 exams shows up red weeks ahead. Tap it and pull the work forward.
>
> Free, works in any browser, no account needed. Link in bio.
>
> Send this to your study group. Which week is your hell week? 👇
>
> #studytok #finalsweek #studyhacks #studentplanner #studyboard

**Caption (TikTok):** same, but put the search words first: "how to plan for finals week when you have 3 exams in one week 📚", and keep the hashtags to 4–5.

**Alt text:** A term calendar where week 11 glows red with three exams stacked on it. Text: "3 exams. 1 week. Most people find out the week before. But you could see it coming." The Studyboard app colours each week from calm to crunch, opens week 11, pulls work forward, and the week turns from red to amber.

## Editing

Copy is in `HOOKS` near the top of `reel.html`, and timings are worked out from the hook's word count. To make another hook variant, add an entry to `HOOKS`, copy `reel.html` to `reel-d.html` with `const VARIANT = "d"`, then:

```bash
node .claude/skills/studyboard-reels/scripts/render.js marketing/reels/2026-11-15-crunch-week --html reel-d.html
```
