# Five more improvements from competitors: plan (round 2)

Written 26 November 2026. Ground rules from `FEATURE-PLAN-2026-11.md` and `OVERWHELM-PLAN.md` apply:
- Each feature extends a flow students already use.
- No new tab, no popup, no Pro wall, and it works offline without AI.
- One primary button per screen, plain words, Undo on anything that changes the plan.
- Existing students see nothing change until they use it.
- Respect Essentials (`window.SBESS`): don't add main-nav items.

## 1. Repeats in quick add (from Todoist)
- **Input:** the quick-add bar (Board add bar, `#qaIn`). These all make a repeating task:
  - "math homework every monday"
  - "lab report every other thu"
  - "reading weekdays until dec 12"
  - "quiz every 2 weeks fri"
  - "every day", "daily", "mon wed fri", "MWF", "TTh"
- **How it works:**
  - It uses the same repeat model as the New Task form's Repeat field (see `src/js/01-render.js` around the `repeatWrap`/`untilWrap` fields, and how the form saves a repeating series).
  - The repeat words are removed from the title.
- **Confirmation toast:** states the rule in plain words ("Every Monday until Dec 12"), with Edit and Undo (undo removes the whole series).
- **Unclear phrases:** left alone, not guessed. Phrases where "every" is part of a title ("Everything Bagel essay") must not trigger.
- **Bug to fix:** today "math homework every monday" creates a one-off task titled "Math Homework Every".

## 2. Reading pace (from Shovel)
- **Input:** a reading task with pages stores `pages` (a number) and drops the page words from the title. These all count:
  - "read ch 4 30 pages"
  - "pp. 45-80" / "pp 45–80"
  - "pages 12 to 40"
  - "30pg"
  - a Pages field in the New Task form's advanced section
- **Estimate:** `hours = pages × minutes-per-page / 60`, using the student's pace for that course (default 3 min/page). It's only used when the task has no hours set by the student.
- **Pace learning:** focus time and logged time on finished reading tasks update the course's pace as a smoothed average, with outliers ignored. Studyboard already has planning accuracy in `src/js/92-accuracy.js` and Quick Estimates in `src/js/92-estimates.js`; reuse their data and patterns.
- **Display:** the task shows "30 pages · about 1h 30m". The course page has a single "Reading pace: 3 min a page" field to edit.

## 3. Learn mode (from Quizlet), free
- **Entry:** a Learn button on each deck with 4 or more cards, beside Study.
- **Rounds:** adaptive rounds of 7 cards.
  - A new card is first asked as multiple choice: 4 options, the wrong ones drawn from the same deck's answers.
  - Once answered right, it's asked as a typed answer.
  - A miss sends it back a step and it returns later in the round.
- **Progress:** a bar showing New / Familiar / Mastered counts. The session ends when everything is Mastered, with a short summary and "Learn again" / "Done".
- **Typed answers:** accept small typos (normalised edit distance, case and accents ignored) and offer an "I was right" override.
- **Card types:** works with math/chem formatting (KaTeX rendering in `src/js/01-math.js`). Picture cards fall back to multiple choice only.
- **Review schedule:** unchanged unless "Count toward review" is ticked. Resume a session after leaving (kept per device).
- **Behaviour:** keyboard (1–4 to pick, Enter to submit), screen reader announcements, reduced motion.

## 4. Wrap Up Today (from Sunsama)
- **When it shows:** in the last hour of the study day (`studyDay()`), or once today's plan is all done. A single quiet row then appears at the bottom of Today's Plan: "Wrap up today". It's never a popup or toast, and isn't shown on a day off.
- **The sheet:**
  - what got done today (tasks finished, focus minutes);
  - each unfinished item that was planned today, with Tomorrow / Pick a Day / Let It Go (Let It Go only removes today's plan time; it never deletes the task);
  - one choice of tomorrow's first task, which becomes Do This Next tomorrow;
  - an optional one-line "on my mind" note, kept as a note.
- **Undo:** one Undo reverses it.
- **After wrapping up:** the row says "Wrapped up. See you tomorrow." and stays quiet.
- **Pinning tomorrow's first task:** reuse the timeline pins from `src/js/01-plan-move.js` (`task.pins`) where it fits, or a small "first tomorrow" flag that `computeFocusNow()` honours.
- **Setting:** a switch in Settings › Study Plan, on by default.
- **Essentials:** shown in Essentials too (it's core).

## 5. Study heatmap (from Anki and TickTick), free
- **The grid:** a year of days (53 columns × 7 rows, weeks starting on the locale's first day), coloured in 5 steps by daily study.
  - Study = focus minutes + cards reviewed + tasks finished, weighted into "study minutes" with a clear formula shown in the tooltip.
- **Stats:** current run and longest run of study days, and the total this term.
- **Tooltip:** tap or hover a day for its details. Keyboard arrows move between days, and the screen-reader table fallback is a monthly summary.
- **Where:** on Insights (free card, placed near the Focus Garden) and on each course page (that course only).
- **Data:** built from history already stored on the device (`SBSTATS`, review history, task `doneAt`). No new tracking.
- **Colours:** work in light and dark and with themes, and the steps stay distinguishable for colour-blind students (vary lightness, not only hue).

## Build split
- One build for 1 + 2: both touch the quick-add parser and estimates.
- Separate builds for 3, 4 and 5.
