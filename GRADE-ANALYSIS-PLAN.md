# Deeper Grade Analysis: Plan

Goal: Studyboard already answers "where am I?" and "what do I need?" better than most grade apps. The next step is answering **"why am I here, what's likely to happen, and what should I do about it?"** It should do this from data the app already has (marks, weights, due dates, focus time, flashcard readiness, exam reflections), on the device, without asking the student to type in anything new.

## What exists today (the baseline)

| Area | What's there | Where |
|---|---|---|
| Course math | Current grade, projected final, secured/possible range, drops, bonus, extra credit, excused, missed work counted as 0, category weights, points courses, unweighted fallback, must-pass parts | `90-grades.js` (`courseGrade`, `GRULES`) |
| Targets | What Do I Need (pass, goal, keep current letter), What If with Solve, grouped rows, pretend marks over real ones | `needLines`, `whatIfHtml`, `wiSolve` |
| Insight lines | Category averages ("Where Your Grade Comes From"), biggest boost/drag mark, biggest swing item, vs class average (opt-in) | `breakdownHtml`, `markImpact`, `biggestSwing`, `vsClass` |
| Trend | Running grade after each mark (chart + card sparkline), "up N points over last K grades" | `90-grade-trend.js` |
| Term | Credit-weighted average, term/projected/cumulative GPA, past terms, past courses | `termStats`, `gpaStrip`, `histHtml` |
| Action | At-risk/under-goal courses boosted in Today's Plan, Rough Week Rescue, graded work in the next 2 weeks | `boostFocus`, `rwPlan`, `comingUpHtml` |
| Reflection | Exam wrapper (felt vs practice vs mark, study methods, when you started) with patterns after 3+ exams | `97-exam-wrapper.js` |
| AI | "Ask AI About Your Grades" fed by exact numbers + app-computed JUDGMENTS | `aiContext`, `aiJudgments` |

**The gaps:** every analysis is per course and per mark. Nothing looks at the whole term over time. Projections are a single number with no idea of how sure they are. Nothing links *behaviour* (when you started, how long you worked, late penalties) to *results*, except the exam wrapper, which only covers exams and needs the student to fill it in. And nothing ranks "where would an hour help most?"

## What other apps do well (and what to borrow)

| App | Strength | Borrow |
|---|---|---|
| **Canvas / Brightspace** | What-If grades, class mean/median/high/low per item | Already have What If. Show the class **distribution** (median, high, low are already synced from Brightspace in `lms.js`), not just the mean |
| **Gradescope** | Per-question and per-rubric breakdowns, "points lost by question" | **Points-lost analysis**: where your missing percentage points actually went |
| **PowerSchool / Infinite Campus** | Alerts when a grade changes, term-over-term views | **Mark impact moment** and a **weekly grade digest** |
| **GPA calculator apps** (College GPA, GPA Calculator Pro) | Target-GPA solver across courses | **Target GPA planner**: what each course needs for a 3.5 |
| **Khan Academy / Quizlet Learn** | Mastery by skill/topic | **Topic tags** on marks, linked to flashcard decks (later phase) |
| **Forest / Todoist Insights / RescueTime** | "Your best hours", productivity patterns from passive data | **Habits ↔ results**: start lead time, focus minutes, lateness vs marks |
| **FiveThirtyEight-style forecasts** | A range with a likelihood, not one number | **Grade forecast with confidence**: "about 70% chance of a B+ or better" |
| **Spotify Wrapped / Duolingo Year in Review** | Shareable recap | **Term Recap** card at term end (also feeds `studyboard-reels`) |

## The features, ranked by value per effort

### 1. Where Your Points Went (points-lost analysis). Small.
For each course: the percentage points lost so far, `Σ w·(100 − pct)/D`, split by category and by item. Missed work, late penalties (`mark.pen` / `mark.before`) and dropped marks get separate slices.
- *"You've lost 11.4 points of Chem so far: 5.2 on Quizzes, 3.8 on Lab 3 (missed), 1.6 to late penalties, 0.8 on Assignments."*
- This differs from the current category averages: a 60% on a 2% quiz matters less than an 85% on a 30% midterm, and this shows that directly.
- A horizontal stacked bar in the course Grades card, under "Where Your Grade Comes From". On the Grades page: the **total lost to late penalties this term** (it's a cheap habit to fix and students rarely see it added up).
- Pure function `lostOf(gr)` beside `byType`, with tests.

### 2. Mark Impact Moment. Small.
When a mark is saved (the `changed` hook, like the exam wrapper), toast or sheet: *"Quiz 4: 82%. Chem is now 87.3% (+0.6). Still an A-, 2.3 points above the line."* If a letter changes, or a goal is locked in or lost, say so with a little celebration (reuse haptics and the companion).
- Uses `courseGrade(c)` before and after (`asOf` set without the new mark).
- Also a **letter-boundary watch** on each course row: *"0.4 pts from B+"* when the current grade is within 1 point of the next letter up or down.

### 3. Grade Forecast with Confidence. Medium.
Replace the single "Projected Final" with a range and a likelihood.
- Model, kept simple and explainable: per category, the mean and spread of the student's marks (shrunk toward the course mean when there are few marks, with a floor on the spread so 2 marks don't look certain). A Monte Carlo of about 2,000 runs over the unmarked items, run through `GRULES.finalWith` so drops, bonus and must-pass parts all count. Results go into letter buckets.
- Show: *"Most likely B+ (84–88%). About 70% chance of a B+ or better, 15% chance of an A-."* A small bar coloured by letter bucket, and the pass-mark risk as a probability for at-risk courses.
- Language rules (as with `aiJudgments`): never "you will"; under 3 marks in a course say "too early to forecast"; always show what would change it ("an 85 on the final moves this to 60% chance of an A-").
- The term version gives a **GPA forecast band** in `gpaStrip`.
- Pure core `GFORECAST` with `/*FORECAST-START*/` markers so the unit tests can load it alone, the same way as `GRULES` and `GTREND`. Seeded random numbers so tests are deterministic.

### 4. Target GPA Planner. Medium.
"What do I need for a 3.5 this term?" Pick a target GPA. The planner finds the cheapest set of letter targets across current courses, where "cheapest" means the smallest total required average above each course's current average (its need), weighted by credits and by how much of the course is left. It then shows each course's target letter and the average needed on what's left.
- Lock a course ("I'm happy with a B in Physics") and re-solve.
- Feeds back: the chosen per-course targets can be saved as each course's goal in one tap (existing `grading.goal`), so What Do I Need, Today's Plan boosts and goal-short nudges all follow.
- Also cumulative: *"To reach a 3.3 cumulative by graduation you need a 3.6 average over the next 4 terms"* using past terms and planned credits.
- Small search (letters per course × at most 8 courses, pruned) in a pure function with tests.

### 5. Habits and Results (passive study analytics). Medium. This is the differentiator.
Extend the exam wrapper's "Your pattern" idea to **all graded work, with no forms**, using data already stored on tasks:
- **Start lead time:** the first `workLog` entry (or `history` status change) vs `due`. *"Work you started 3+ days early averaged 88%; work started the day before averaged 76% (14 items)."*
- **Time invested:** `focusMin` + logged minutes vs mark, per type. *"Your essays score about 6 points higher when you put in 3+ hours."* Show a scatter only when there are 8+ points.
- **Lateness:** late hand-ins and their penalty cost (shares data with feature 1).
- **Flashcard readiness before exams:** `readySnap.measured` vs mark, a calibration line ("your card scores predict your mark within ±6 points").
- **Day/time:** marks by when the work was mostly done (evening vs late night), only shown when the gap is large and the counts are meaningful.
- Guardrails: minimum counts (n ≥ 4 per group, gap ≥ 5 points), wording as correlation ("tended to", never "caused"), at most 3 insights shown, ranked by gap × n. Each one comes with one action that links to the planner ("Start essays 3 days early: add a start date to the next one").
- Location: a new **"Your Patterns"** section on the Grades page and per course, plus lines added to `aiJudgments` so the AI coach can use them without inventing correlations.
- New module `90-grade-habits.js`, pure core with markers and tests.

### 6. Term Timeline. Medium.
A term-wide chart: credit-weighted average (and GPA, when on) by week, with each course as a faint line. Rebuilt from marks by date, using the same `asOf` reconstruction as `GTREND.points`. Notes on the chart for the big swings ("Midterm 2, −3.1").
- Week-over-week change on the Grades hero: *"+1.2 since last week."*
- Past terms: once saved with snapshots, compare this term's curve to the last one at the same week.
- Store a small weekly snapshot (`gset().snaps`, at most 30 per term) so the history survives changed weights and archived courses.

### 7. Best Use of the Next Hour (grade ROI). Small to medium.
A ranked list on the Grades page: unmarked graded items by **expected grade gain per hour**, roughly `weight/D × (achievable lift over your forecast mean) / remaining hours (remainingOf)`, with a bonus when the item crosses a letter boundary or the pass mark (taken from the forecast).
- *"Lab Report 4: about +0.9 course points per hour. Your lab average is 71% and it's worth 8%."*
- The same score can quietly feed `boostFocus` as a small multiplier, so Today's Plan and the Grades page agree.

### 8. Class Comparison, Richer. Small.
Where the school site shares them (`fb.cls` already has `mean`, `median`, `lo`, `hi` from Brightspace; add Canvas `score_statistics` in `lms.js`): a strip per item showing low–median–high with your mark as a dot, and a course-level "above the median on 7 of 9". It stays opt-in (`gset().cls`), keeping the current wording that it's context, not a ranking.

### 9. Weekly Grade Digest. Small.
A Sunday card on Today (and an optional push through the existing reminder queue): new marks this week and their impact, courses that moved, the biggest graded item next week, one habit insight. With no new marks it stays quiet.

### 10. Term Recap. Small, once the above exist.
At **Start a New Term** (`96-semester.js`), a recap: GPA vs last term, most-improved course, best mark, total focus hours, the best habit insight. Exportable as an image (reuse `shot.html` rendering). Doubles as a marketing asset for `studyboard-reels`.

### 11. Topics and Mastery. Large, later.
Optional topic/unit tags on graded items, filled in from the syllabus schedule by the AI importer (`01-syllabus.js`), plus an optional per-section score in the exam wrapper. This gives "weakest topics", links to the flashcard decks for those topics, and study sessions planned toward them. Wait until 1–7 show that students engage with the analysis.

## Phases

### Phase 1: quick depth (about 1 week)
Features 1, 2 and 8, plus the letter-boundary watch. All are pure additions to `90-grades.js`, with no data model changes. Add new judgments to `aiJudgments` (points lost, boundary distance).

### Phase 2: forecasting (about 1.5 weeks)
Feature 3 (`GFORECAST`), then 4 (Target GPA Planner), which uses the forecast to pick realistic targets, then 7 (grade ROI), which uses the forecast mean. Replace "Projected Final" in `gradeCard` and the projected GPA tile.

### Phase 3: patterns over time (about 2 weeks)
Feature 5 (`90-grade-habits.js`) and 6 (term timeline + weekly snapshots), then 9 (weekly digest), which uses both.

### Phase 4: recap and topics
Feature 10 at the end of the first term after launch. Feature 11 only if usage supports it.

## How to build it so it fits the codebase
- **Pure cores with markers** (`/*FORECAST-START*/`, `/*HABITS-START*/`) that the unit tests load alone, like `GRULES` and `GTREND`. Every number shown comes from one function that has tests.
- **No new required input.** Everything runs on existing fields: `mark`, `weight`, `due`, `doneAt`, `workLog`, `focusMin`, `history`, `readySnap`, `wrap`, `lms.fb.cls`.
- **On-device and private.** No grade data leaves the device for these features. The AI only gets the computed judgments, as it does today.
- **Honest wording, as now:** minimum sample sizes, correlation language, "too early to tell" states, kind wording for bad news (match `needLines`), and nothing shown that the student can't act on.
- **i18n and accessibility:** all strings through `tr()`/`trn()`. Every chart gets an `aria-label` sentence like `gt-svg`, keeps working in dark mode and with reduced motion, and has a text equivalent.
- **Performance:** `courseGrade` already runs per render. Cache forecast and habit results by `state.updated` (the same pattern as `LPEN`), and keep Monte Carlo to about 2k runs per course (well under 10ms).
- **Pro split (decision needed):** the suggestion is that Phase 1 stays free for everyone (it makes the core better). Forecast, Target GPA Planner, Habits and Term Timeline are a natural **Pro** bundle ("Grade Insights"), using `proBtns("grades")` / `99-pro.js`.
- **Tests:** unit tests for each pure core (edge cases: drops, bonus, must-pass, excused, points courses, unweighted, pass/fail, 0–2 marks), plus one Playwright e2e that seeds a term and checks each new section renders and reads correctly.

## Status (built)

Features 1 to 10 are built, plus a light version of 11 that needs no new tagging. The code:
- `src/js/90-grade-insights.js`: the math for every feature (`GINS`, tested alone in `tests/grade-insights.test.js`), plus Phase 1: Where Your Points Went, letter cutoffs, How You Compare, and the mark moment.
- `src/js/90-grade-forecast.js`: the forecast (course and term GPA), Target GPA, and Best Use of Your Next Hour.
- `src/js/90-grade-habits.js`: Your Patterns, Your Term So Far, This Week in Grades, What to Shore Up, and the grade cards in the Term Recap (`99-pro.js` calls `SBGINS.recapSlides`).
- `tests/grade-insights.e2e.js` checks it all on a computer and a phone, using the term in `tests/grade-insights-seed.js`.

Decisions taken while building (each easy to change):
- **Nothing is behind Pro yet** except the Term Recap, which already was. The open Pro question above still stands.
- **At-risk courses** don't show a chance of failing. They get the likely range and what would change it.
- **The weekly summary** shows on Today from Saturday to Monday (behind Notices, like other board notices) and on the Grades page all week. There's no push notification yet.
- **The timeline is rebuilt from the marks** rather than from stored weekly snapshots. That avoids writing settings (and syncing) on every redraw.
- **Best Use of Your Next Hour** ranks by points per hour and doesn't change Today's Plan yet.
- **Topics (11)** reads the next exam's prep-plan topics and the course's flashcard decks. There's no per-mark topic tagging yet.

## Open questions
1. Free vs Pro split for Phases 2–3 (see above).
2. Should forecast probabilities be shown to students in at-risk courses, or only the range plus "what would change it"? (Option: show the probability only when it's encouraging, and show the range otherwise.)
3. Weekly digest push: on by default or opt-in? (Suggest opt-in, as other non-deadline pushes are.)
