# Schedule Builder from the School Catalog: Plan

Goal: a student picks the courses they want next term, Studyboard shows every timetable that works (no clashes, their preferences), and the chosen one becomes their courses and class times in Studyboard, ready for registration day.

## The key decision: where the class schedule data comes from

Coursicle's advantage is years of per-school scrapers. Copying that school by school is slow and breaks often. The most effective route is three sources, used in this order, so every school works on day one and coverage improves on its own:

| Source | Coverage | Cost | Notes |
|---|---|---|---|
| **1. The student brings the options** (paste, PDF, screenshot or link of the class search; AI reads it) | Every school, from day one | Low: the app already has OCR, syllabus parsing and AI extraction | Slower for the student, but never blocked |
| **2. Adapters for the big public systems**, read on the server and cached | Ellucian Banner 9 alone is about 24% of North American colleges (Listedtech, Jan 2025); its class search has public JSON endpoints. Then Colleague Self-Service, school open-data APIs (Illinois, Cornell, Waterloo and others) | Medium: one adapter covers hundreds of schools | Undocumented endpoints can change: health checks and a fallback to source 1 |
| **3. Systems behind a sign-in** (PeopleSoft, Workday Student, some Banner sites), read in the student's own session by the desktop app or the Studyboard School Sync extension | Large research universities | Medium | Same pattern as the school site sync already in `95-lms.js` and the extension |

Plus a free multiplier: **what students build feeds the catalog.** When enough students at a school (at least 3) confirm the same section and times, it becomes catalog data for everyone at that school. Only course code, section and meeting times are shared, never who took them.

## Phases

### Phase 1: the builder itself, with source 1 (about 2 weeks)
Build the part students actually use first, so it's useful before any scraper exists.
- **Add options:** search what's already known for the school; otherwise paste text, a link or a screenshot of the class search. The AI turns it into sections (`code, title, section, instructor, meetings[{days, start, end, room}], credits, CRN`). The student checks it.
- **Generator** (`src/js/97-schedule-builder.js`, pure core with markers for unit tests): backtracking search with pruning over one section per course, plus linked lab and tutorial sections. Hard rules: no time clashes, linked components together, credit limit. Soft rules, scored: earliest start, days off, fewest gaps or no long gaps, lunch break, walking time between buildings back to back, preferred instructors. Lock a section, exclude a section, show the top 50 ranked. Runs in a Web Worker so a 6-course, 10-section search (about a million combinations, heavily pruned) stays instant.
- **Views:** a week grid like the calendar (colour per course), with arrows to flip through options, and a "compare 2" view.
- **Finish:** "Use This Schedule" creates or updates Studyboard courses with their meetings, uses `schOccurrences` so class reminders and the calendar work at once, and shows a **registration list** (CRNs and section numbers, each with a copy button) for registration day.
- **Classmates tie-in:** "2 classmates picked this section" (opt-in, same rules as Classmates).

### Phase 2: Banner 9 adapter and catalog cache (about 2 weeks)
- **`catalog-find` Edge Function** (like `lms-find`): for a school in `public.schools`, try the usual Banner addresses on its domains (`<host>/StudentRegistrationSsb/ssb/classSearch/getTerms`) and remember the answer for 30 days.
- **`catalog-sync` Edge Function:** for a school and term, open a search session (POST the term), page through `searchResults` (500 a page), and normalise the results into the tables below. Run on demand the first time a student asks, then nightly during registration season (cron) for terms people are using. Only one fetch per school and term at a time, gentle pacing, a clear User-Agent, and robots.txt and opt-out respected.
- **Tables** (`supabase-catalog.sql`): `catalog_terms(school_key, term, label, starts, ends)`, `catalog_sections(school_key, term, subject, number, title, section, crn, credits, instructor, meetings jsonb, seats, cap, linked text[], source, updated_at)`, and `catalog_sources(school_key, kind, base_url, ok_at, fail_count)`. Public read through RPCs with a rate limit; written only by the functions.
- **Health:** a canary query per source each night; after 3 failures the school falls back to source 1 and an admin is told.

### Phase 3: more adapters, ranked by schools gained per hour of work
Colleague Self-Service section search, Jenzabar, school open-data APIs (one small mapping each), then PeopleSoft and Workday through the signed-in reader in the desktop app and extension (source 3). Keep a running coverage report: schools served by an adapter, by student contributions, and by source 1 only.

### Phase 4: contributions, seats and polish
- Aggregate confirmed sections from students (at least 3 to publish, nothing linked to a person).
- **Seat counts:** Banner returns enrollment and capacity. Show "12 seats left" when building. Seat-opening alerts reuse the reminder push queue (`reminder_queue` and `send-reminders`) and a cron that re-reads only watched sections. This is the feature Coursicle charges for, so it makes a natural Pro feature.
- **Course reviews and grade data:** later and separate. They need moderation.

## Why this order is the most effective
1. **Value on day one at every school.** Source 1 means no student hits "your school isn't supported".
2. **The scarce work goes where it pays.** Banner first gives roughly a quarter of schools with one adapter, and every later adapter is ranked by schools per hour.
3. **It reuses what exists:** the schools list and `lms-find` pattern, AI extraction and OCR, the class schedule (`schOccurrences`), the calendar, Classmates, the push reminders and the School Sync extension.
4. **It doesn't rot silently.** Health checks plus the source 1 fallback mean a broken scraper costs convenience, not the feature.

## Risks
- **Terms of use:** public class search pages are generally fine to read gently, but check each adapter's school terms, honour robots.txt, cache hard, and remove a school on request.
- **Data shape:** cross-listed courses, linked lab and tutorial sections, rotating or biweekly meetings and online sections must be modelled from the start (`meetings` as a list with dates).
- **Wrong data on registration day:** always show where and when data came from ("Banner, updated 2 hours ago") and link to the school's own class search.

## Measuring it
Schedules built per week, the share of those that came from catalog data instead of manual entry, schedules turned into courses, coverage (students whose school has a working adapter), and adapter failure rate.
