# Reducing overwhelm while staying feature rich: plan

Written 26 November 2026, from a hands-on review of the app at phone (402x874) and desktop (1300x860) size. The review covered a fresh install and a seeded student with 5 courses, 25 tasks, decks, a shift and a midterm 2 days away, back-dated 1, 2 and 6 weeks. The full findings, with 127 screenshots, a 108-row feature inventory and a jargon list, are summarised in the Appendix.

## The diagnosis in one paragraph

Studyboard doesn't have too many features. It shows too many of them at once, and it interrupts too often.

- Setup is lean: 5 screens.
- The first week after setup is not:
  - unprompted popups (2 on a fresh install by mistake, 5 in a row for a 2-week student);
  - a Today's Plan that is 2.5 phone screens long with 7 primary buttons;
  - four different "you have too much work" systems with four different numbers;
  - an 85-control Exam Prep form two days before an exam;
  - 12 PRO badges on a core sub-tab;
  - product jargon at every choice.
- About 12 of 108 features are needed on day 1. Over 60 are for some or few students, rarely. Many of those still get a top-level tab, a popup or a card on the Board.

## The principles every change follows

1. **One next step.** Every main screen has at most one filled (primary) button above the fold. Everything else is a secondary button, a link or a menu.
2. **Earned attention.** Nothing appears unasked unless it's about the student's own work and timely. Product news, community, referrals and upsells never interrupt.
3. **Relevance unlocks features.** A feature appears when the student's data makes it useful: the first deck, an exam in 14 days, a paper-type task, a group. The Essentials switch (`SBESS`) is the one place that decides this.
4. **Everything stays reachable.** Nothing is removed. Every hidden feature can be found in Search, under More, and in a new **Everything Studyboard Can Do** page. Show Everything turns all of it on at once.
5. **One name, one number per idea.** One answer to "am I behind" (Time Cushion). Plain verbs in the main flows; brand names stay on the feature's own page.
6. **Short form first.** Forms start with what's needed to finish the job. The rest sits under one "More options" with sensible defaults.
7. **Pro in context, once.** A Pro feature is shown only where it fits the task in front of the student, with at most one Pro teaser per screen.

## Phase 0. Bugs that cause overwhelm (do first, small)

| # | Problem | Fix | Where | Test |
|---|---|---|---|---|
| 0.1 | A brand-new student is classed as an existing user, so "Introducing Studyboard AI Pro!" opens about 20 s after setup and the Discord invite about 50 s after. Both contradict the code's own comments. | Record the first-run date at boot, before welcome or setup writes anything. Read `sb:onboarded:at` (`40-onboarding.js:8`) instead of guessing from stored data. | `99-ai-intro.js:37-49`, `99-discord-invite.js:34-46` | e2e on a fresh install with `navigator.webdriver` faked to false: no AI Pro or Discord modal within 2 minutes |
| 0.2 | Every popup skips itself under `navigator.webdriver`, so no test or design screenshot has ever shown the real stack. | Replace the webdriver checks with a test switch (`?popups=on` or a localStorage flag) that tests can turn on. | `99-launch.js`, `01-calendar.js:989`, `99-discord-invite.js:93`, `99-feature-intros.js` | an "observe 60 s" e2e for day 0, week 2 and exam week, asserting at most one popup |
| 0.3 | Feature intros fire in Exam Mode (seen 2 days before a midterm). | Check `SBEXAM.current()` like the other popups do. | `99-feature-intros.js:75` | covered by 0.2 |
| 0.4 | Exam reflection prompts stack without limit (one was for a midterm 10 days old). | Show at most one, and only within 3 days of the mark. | `01-board.js:909` | unit test |
| 0.5 | The README describes Exam Prep twice. | Delete the second paragraph. | `README.md` | n/a |

## Phase 1. An interruption budget

**Goal:** a student never sees more than one unprompted popup per app open. They see none in their first 3 days, in Exam Mode or during Focus.

- **A single gatekeeper:** `SBPOPUP.claim(kind, priority)` in a new `src/js/01-popups.js`.
  - Every modal that opens itself must claim first: daily quote, What's New, feature intros, Discord, AI intro, offers, the free-weeks welcome, the groups nudge, and the store review ask.
  - The gatekeeper allows one per open and one a day.
  - Order of priority: setup steps > What's New (only on a real version change) > a feature intro > everything else.
  - It records what was shown, so a declined item waits at least 14 days before coming back.
- **Demote things that shouldn't be modals:**
  - **Daily quote:** a single line in the Board header. Off by default for new installs.
  - **Discord:** a row in Help and About, and one line in the Weekly Review.
  - **Invite Friends, Get Pro Free:** out of What's New. It stays in Help.
  - **AI Pro introduction:** only in the AI setup sheet and the Pro sheet.
  - **Feature intros:** become one dismissible line in Notices, not a modal.
- **Offers** (`99-offers.js`) count against the budget and never show in a student's first 14 days.

**Done when:** the observe tests from 0.2 pass for day 0, week 1, week 2 and exam week. On those days a student sees 0, ≤1, ≤1 and 0 popups.

## Phase 2. One answer to "am I behind?"

There are five names today: Heads Up shortfall, Crunch, Crunch ahead, Rough Week, and Exam Mode's Also Due. They give three numbers over three different time windows.

- **The Time Cushion pill is the one number.** It shipped this week: "2h 30m to spare" / "Tight" / "45m short by Tue".
  - The Heads Up shortfall line goes away; its text moves into the cushion sheet.
  - The Crunch forecast card only appears when the cushion is short, and links to the cushion sheet.
  - Rough Week Rescue becomes the sheet's "Lighten This Week" action.
- **Rename for students:**
  - Crunch → **Busy Weeks** (the Calendar view and the card);
  - Rough Week Rescue → **Lighten This Week**;
  - Weekly Hours Limit → **Most study hours a week**.
- **In Essentials:** the Calendar's Crunch sub-tab is hidden until the first short cushion. The Essentials agent noted it isn't gated yet.

**Done when:** a student with a heavy week sees one number in one place, and every other surface either links to it or uses the same figure. A unit test checks that the pill, the sheet and the forecast agree.

## Phase 3. A lighter Today's Plan

Today a 6-week student's Today's Plan has 49–60 controls, 342 words and 7 primary buttons. **Target: under 25 controls, under 150 words, 1 primary button.**

1. **Order:** Exam card (only in Exam Mode) → time strip → Do This Next → the day's list. Nothing else above the list.
2. **Do This Next:**
   - one primary button (Start Focus, or Study for the exam);
   - Log Time and Enough for Today move into its ⋯ menu;
   - the explanation lines collapse to one, under "Why this?".
3. **In Exam Mode:** the exam is Do This Next unless something is due before the next study session. An overdue small task (the "buy lab goggles" case) shows as a row, not as Do This Next.
4. **Heads Up:** dissolves.
   - The shortfall goes to the cushion (Phase 2).
   - The reflection prompt (at most one, Phase 0.4) and other notes go into Notices.
5. **Housekeeping and setup cards move inside Notices, never above the add bar.** That covers Keep Your Work Safe, A Few More Things, Set Up Your Semester and the backup notice.
   - Getting Started becomes a slim collapsed row under the add bar, and folds away after 3 days.
   - `KEEP` in `99-motion-a11y-tz.js:459-505` stops pinning these on top.
6. **Backups:** one ask, in Notices, after something worth keeping (7 days or 20 items). The answer is remembered for 30 days. Remove the duplicate Getting Started item and the Board card.
7. **Footer:** the 6 links (Free Time, Calendar, Exam Prep, Full Ranking, How This Is Ranked, Take Today Off) become one "More about today" menu.
8. **Study buttons:** keep the 🍅 on each row of the day's list, but as quiet icons. The top-bar 🍅 stays.
9. **The + button:** it overlaps the last button of Do This Next on phones (seen in this week's screenshots). Give the list enough bottom padding to clear it.

**Done when:** a "Today budget" e2e counts controls, words and primary buttons at 402 px for a 6-week student in a normal week and in exam week, and stays under the targets.

## Phase 4. Short forms

- **New Task:** 30 controls today. Target: 4 fields + Add.
  - Title, Course, Due (date and time), Type.
  - "More options" holds reminders, start, repeat, weight, priority, notes, documents, hours, checklist and files.
  - Reminders are one chooser: "Also Remind Me" merges into it.
  - The + button opens the quick-add bar (which already reads "bio quiz fri 2pm worth 5%"), with "Full form" as a link.
- **Task edit sheet:** 41 controls today. Same structure, with what's set shown first.
- **Exam Prep:** 85 controls today. Target: 1 tap.
  - "Make My Plan" uses the defaults: suggested topics at OK, Normal time, every day, starting today.
  - The plan view then offers "Adjust topics" and "More options" (%, Studied, Format, weekdays, start date, day-before options).
  - The Plan It for Me / I'll Make My Own chooser becomes a link.
  - The exam sheet's readiness slider merges into Prep.
- **Focus timer sheet:** routine names show their meaning ("25 min work, 5 min break"). Working On lists the plan's top 5 tasks, with "Other…" for the rest.

**Done when:** e2e tests count the controls in each form's first view.

## Phase 5. Pro in context, once per screen

- **Courses › Studio:**
  - Hidden from free students; Writing Studio opens from the task sheet.
  - Studio shows only paper-type tasks (Essay, Paper, Report, Presentation), never Webwork, Lab or Quiz.
  - It becomes a main sub-tab only when the student has Pro and a paper.
- **Insights:** free students see the free card (and the Focus Garden) first, with one "More with Pro" row instead of three locked cards.
- **One teaser per screen:** a `PLAN.teaser(screen)` helper refuses a second PRO badge or locked card on the same screen.
  - The Pro sheet stays reachable from all 55 entry points. Only the visible badges are limited.
- **Settings:** Pro rows (Autopilot, Print or Save as PDF) sit under each section's Advanced fold with a small PRO tag, not at the top.
- **No upsell inside the first 14 days**, except where a student taps a Pro feature themselves.

## Phase 6. Navigation by relevance (build on Essentials)

This week's Essentials switch (`SBESS`) gives new students Board, Calendar, Review and Courses, with the rest under More. Next:

1. **Sub-tabs follow relevance too:**
   - Review shows only Flashcards until a quiz, map or presentation exists.
   - Notes shows Whiteboard only after the first whiteboard.
   - Companion shows Wardrobe under Style.
   - Courses shows Studio only per Phase 5.
2. **Calendar:**
   - two views on phones (Week and Month);
   - on desktop, Days/Weeks/Term and Timeline/Month become one View menu;
   - Busy Weeks appears as above.
3. **Review header:**
   - Explore, Course Library and Import move under Add Deck;
   - each deck's share and archive move behind ⋯;
   - Start Review stays the one primary button.
4. **Course page:** empty sections (Learning Objectives, Files, Notes, Concept Maps) don't render. One "Add to this course" menu replaces them.
5. **Groups:** while signed out, Groups is under More, not on the bar.
6. **Sync the Essentials choice with the account**, so Show Everything on one device applies everywhere. It's per-device today.
7. **Gate Exam Mode's Today card** with the same unlock as Exam Prep (noted as not done this week).

## Phase 7. Plain language

Rename on core screens; the brand names stay inside each feature's own page, introduced once:

- **Today's Plan:**
  - Time Today → Study Time Today
  - Enough for Today → Stop Here for Today
  - Log Time → I Already Worked on This
  - Full Ranking → All Tasks in Order
  - How This Is Ranked → Why This Order
  - Take Today Off → Day Off
- **Planner settings:**
  - Learn My Pace → Adjust Estimates to My Pace
  - Autopilot → Move Missed Sessions Automatically
  - Smart Reminders → Reminders When I'm Free
- **Courses and Review:**
  - Studio → Citations and Sources
  - Maps → Mind Maps
  - Present → Practise a Talk
  - Course Library → Classmates' Decks
  - Explore → Public Decks
- **Exam Prep:**
  - Shaky / OK / Strong → Don't Know Yet / Getting There / Know It
  - Prep plan → Study Plan for This Exam
  - Catch Up → Fit In Missed Sessions
- **Naming consistency:** "Calendar" everywhere (not Plan Ahead); "Review" in the UI and docs; Notices → Updates.

This is a string change plus the i18n keys in `locales/`. Search keeps the old names as synonyms, so students who learned them still find them.

## Phase 8. Settings in tiers

There are about 62 first-level rows across 9 sections today. **Target: at most 5 rows per section at the top level.**

- Every section gets an **Advanced** fold.
  - Study Plan keeps Study Hours, Availability, Days Off, Exam Mode and the Show Everything switch. The rest goes under Advanced.
  - Data and Backups keeps Backups, Export and Import. Device copies, Protect My Data, clear data and the rest go under Advanced.
- Drop subtitles where the label is clear. Emoji icons stay (they help scanning) but are not repeated in subtitles.
- Split "Your time" (hours, availability, days off) from "How the planner behaves" (pace, exam mode, autopilot, weekly limit).

## Phase 9. Keep it feature rich: making hidden things findable

Hiding only works if students can still find things when they need them.

- **Everything Studyboard Can Do:** a page reached from More, Search ("what can Studyboard do") and Help.
  - It holds the 108 features grouped by job: plan my week, study for an exam, write a paper, manage files, work with classmates, make it mine.
  - Each has a one-line plain description, Free or Pro, and an Open button that also unlocks it.
  - The README's Features list is regenerated from the same data, so the two never drift.
- **Contextual surfacing (one line, once each):**
  - a paper-type task → "Studyboard can manage your sources and citations";
  - a PDF uploaded → "Highlight and make cards from it";
  - a lecture class added → "Record and replay lectures";
  - a deck with 50+ cards → "Try the Matching Game".
  - Each goes through the popup budget as a Notices line, never a modal.
- **Search** keeps finding everything, including hidden features. Opening a hidden feature from Search unlocks it (this already works for tabs).
- **Power users:** Show Everything stays one switch. Students who want everything get it in one tap.

## Measurement

Add these as e2e "budgets" so regressions fail the build:

| Budget | Today | Target |
|---|---|---|
| Unprompted popups: fresh install, first 3 days | 2+ | 0 |
| Unprompted popups: any app open | up to 5 | ≤ 1 |
| Today's Plan at 402 px: primary buttons | 7–9 | 1 |
| Today's Plan at 402 px: controls / words | 49–60 / 342 | < 25 / < 150 |
| New Task first view: controls | 30 | ≤ 8 |
| Exam Prep: taps from exam card to a plan | 3 + 85-control form | 2 |
| PRO badges visible to a free student on one screen | 12 | ≤ 1 |
| Settings first-level rows per section | up to 13 | ≤ 5 |
| Distinct "behind" numbers on the Board | 3 | 1 |

Also worth tracking, on the device only and never sent anywhere, as the app has no analytics: whether a new student opens the app on days 2, 7 and 14. If the owner adds opt-in telemetry later, these are the first numbers to watch.

## Order of work

| Step | Phases | Size | Why first |
|---|---|---|---|
| 1 | 0, 1 | small | bugs and interruptions do the most damage on day 1 |
| 2 | 3 (Today), 2 (one number) | medium | the screen every student sees every day |
| 3 | 4 (short forms) | medium | the two heaviest forms, at the most stressful moments |
| 4 | 5 (Pro in context), 6 (navigation) | medium | builds on Essentials |
| 5 | 7, 8 (language, Settings) | small, mostly strings | low risk and easy to review |
| 6 | 9 (findability) + budgets | medium | locks in the gains |

Every step ships behind the existing Essentials rule: **existing students keep what they see until they choose otherwise.** The exceptions are Phase 0 and Phase 1, which are fixes for everyone.

## Appendix: what the review measured

- **Code:** 240 JS modules, about 152,000 lines.
- **README:** 35 feature bullets, about 3,560 words.
- **Welcome and setup:** 5 screens, 388 words. The app tour is 9 steps, offered, not forced.
- **Unprompted modals:**
  - a fresh install gets 2 in the first 60 s after setup, by mistake;
  - a 2-week student gets 5 in 35 s: daily quote, What's New (which leads with "Invite Friends, Get Pro Free"), Discord, Meet the Focus Timer, AI Pro.
- **Board:** 9 kinds of card can sit above the add bar.
- **Duplicate ways to do one thing:**
  - 9+ ways to add a task;
  - 7 ways to start studying on one Board screen;
  - 6 ways to "see my week".
- **Main navigation:**
  - phone: 7 tabs plus the top bar;
  - desktop: a 12-item sidebar;
  - 21 sub-views, several empty for most students (Maps, Present, Quizzes, Studio).
- **Forms:** New Task has 30 controls, 15 of them below the fold. The edit sheet has 41. Exam Prep has 85.
- **Pro surfaces:** the Pro sheet is opened from 55 places in 29 modules. Courses › Studio shows 12 PRO badges to a free student. Insights shows 3 of 4 cards as PRO.
- **Settings:** 9 sections, about 62 first-level rows. Data and Backups alone has 13.
- **Jargon** found on core screens: Heads Up, Crunch, Rough Week Rescue, Autopilot, Learn My Pace, Studio, Wardrobe, Course Library, Exam Cram, Full Ranking, Take Today Off, Notices, Shaky/OK/Strong, Maps, Present, Match.
