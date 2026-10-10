# Import review: school sites, calendars, syllabi and grades (October 2026)

How Studyboard brings in courses, due dates, grades and announcements, where it gets things wrong, what was fixed in this round, and what to do next. Findings say how they were checked: **tested** (a test in the repo now covers it), **reproduced** (run against crafted input) or **from reading the code** (not run).

## 1. Every way data comes in

| Path | Where | What it brings | Desktop | Phone | Website |
| --- | --- | --- | --- | --- | --- |
| Signed-in school sync (Brightspace, Canvas, Blackboard) | `lms.js` harvest scripts, `index.html` `makeLms` (`bsFromApi`, `fromCommon`, `plan`, `applyPlan`) | Due dates, submissions, grades and weights, course grade, announcements, files, Canvas inbox | Yes | Written but never run on a device (`MOBILE-SCHOOL-SYNC-SCOPE.md`) | **New:** the Studyboard bookmark (section 3) |
| Calendar link (feed) | `fromFeed`, `supabase-functions/lms-feed` | Due dates and events only | Yes | Yes | Yes |
| Downloaded school calendar file | `pickFile` → `fromFeed` | Same as the calendar link, once | Yes | Yes | Yes |
| Any .ics file (Apple, Google, Outlook) | `icsParse`, `icsPlan`, `icsImportSheet` | Classes, events, tasks | Yes | Yes | Yes |
| Syllabus (PDF, photo or pasted text; with or without AI) | `importSheet`, `SY` parser, `aiReadSyllabus` | Course details, dated work, class times, grade weights | Yes | Yes | Yes |
| Paste grades | `parseBsGrades`, `pasteGradesSheet` | Marks from a copied Brightspace Grades page | Yes | Yes | Yes |
| AI dates in announcements | `scanNews` | Suggested new or moved deadlines (reviewed before adding) | Yes | Phone: once announcements arrive | **New:** once the bookmark brings announcements |
| Desktop sync relayed through your account | settings and tasks sync | Everything the desktop read | n/a | Yes | Yes |

## 2. Fixed in this round

| Problem | Effect before | Fix | Check |
| --- | --- | --- | --- |
| Canvas courses without group weights (Canvas's default) sent grades with no weight. | Grades from most Canvas courses never counted toward the course grade, so what-if and "what do I need" didn't work for them. | Each item is worth its share of all the points in the course, the way Canvas totals it. Items left out of the final grade get no weight. | Tested (`lms-harvest`, `lms-accuracy.e2e`) |
| Blackboard always sent `weight: null`. | No Blackboard grade counted in the Grade Tracker. | Each counted column (not calculated, not external, not excluded from calculations) is worth its share of the points. Upcoming columns get their weight before they are graded. | Tested |
| Canvas New Quizzes (`is_quiz_lti_assignment`) came in as assignments. | Wrong type. The "can this be taken from home?" check missed them. | Treated as quizzes. | Tested |
| Same-named items in one course were merged into one task. Records were keyed on course + title. | A course with a weekly "Reflection" (Sep 9, Sep 16, …) showed one task. The other dates were lost. Grades could land on the wrong one. | Items with the same name but different dates get their own key from the platform's id. A task an older version made is reused for the item with its date, so nothing is doubled. The Canvas planner's "submitted" flag now matches by id. | Tested, including that a second sync changes nothing |
| A synced task you deleted in Studyboard came back on the next sync, as a new to-do. | Deleted work kept reappearing. | Each platform remembers the keys of tasks you deleted (with your account, newest 300) and skips them. Undo or restoring from Recently Deleted forgets the key again. | Tested |
| (Checked, already right) Status you set yourself | Sync never moves a task back to To Do or Doing. It only ever sets "done", once per item when the school first shows it submitted. Account sync treats "done" as sticky across devices. | No change needed | Tested: done and Doing survive repeated syncs, a moved due date and a calendar-link sync; a task you reopen isn't marked done again |
| "Include past due dates: Whole Term" (120 days) | The signed-in sync always asked the school for only 60 days back. | It asks as far back as the setting. | Tested by the existing LMS e2e tests |

## 3. The website: grades and announcements without the desktop app

**Why the website couldn't do it.** A web page can't read another site with your sign-in (browsers block it), and Studyboard never asks for school passwords. So the website only had the calendar link. That link carries due dates, but no grades, announcements or submission status. The phone apps would sign in through a native web view, but that code has never run on a device.

**Workaround built: the Studyboard bookmark.** Your own browser is already signed in to the school site, so it can do the reading.

1. On the website, in **Connect Canvas** (or Brightspace / Blackboard) or in that platform's sheet, choose **Read in This Browser**. Studyboard shows a button to drag to the bookmarks bar.
2. On the school site, while signed in, click the bookmark. It runs **the same harvest script the desktop app runs** (generated from `lms.js` and built into `index.html`, so there is no extra file to deploy). It reads with GET requests only and shows a small panel on the page.
3. Click **Open in Studyboard**. The data travels after the `#` in the address, which browsers never send to a server, and Studyboard removes it from the address at once. Or click **Copy** and paste into the sheet.
4. The first time, Studyboard shows the normal "Ready to Import" review. After that, it applies like a desktop sync, with an Undo.

Safety:

- Studyboard treats the incoming data as untrusted. It caps the size (6 MB code, 40 MB unpacked).
- It refuses codes more than 3 days old, unknown platforms, and school addresses that aren't public https sites.
- It cleans the data with the desktop's `cleanHarvest`.
- It asks before using data from a school address other than the connected one.
- Nothing passes through Studyboard's servers.

`tests/lms-grab.e2e.js` runs the real bookmark on a stand-in https Canvas, end to end (23 checks).

Limits, honestly:

- **Manual.** It refreshes when you click the bookmark. The calendar link keeps due dates current in between.
- **Not tested on a real school site.** The harvest scripts are the desktop's, so the API calls are the same ones the desktop already relies on. Untested: whether a school's Content-Security-Policy blocks bookmarks. Chrome, Edge and current Firefox run bookmarks despite page CSP. Safari is less clear.
- **Awkward on phones and iPad.** Mobile Safari and Chrome make bookmarks hard to add and run. The phone apps' native sign-in is the real answer there.
- Brightspace, Canvas and Blackboard only. Like the desktop app, it reads at most 20 current courses.

**Other workarounds, ranked:**

1. **Browser extension (next step after the bookmark).**
   - Same harvest, but it can re-read on a timer while the browser is open.
   - Delivers straight to the open Studyboard tab, with no click.
   - Unaffected by page CSP.
   - Cost: Chrome Web Store / Firefox / Safari review, and a host permission for the school's domain.
2. **Canvas personal access token.** Canvas only, and many schools turn student tokens off.
   - The student pastes a token and an Edge Function calls the Canvas API for them. It works fully in the background.
   - It needs a proxy (Canvas sends no CORS headers for other sites), so the token passes through Studyboard's servers, and should be encrypted at rest.
3. **Desktop relay** (already works). If the desktop app syncs, the website and phone get everything through your account.
4. **Paste grades** (already exists, Brightspace only). See 4.4.

## 4. Remaining findings (not fixed), ranked

### 4.1 School sync

1. **The calendar link still merges same-named items.**
   - `fromFeed` groups by course + title, so weekly items with one name collapse in calendar-link mode.
   - Brightspace feeds split one item into "– Due", "– Availability Ends" and similar entries with no shared id. Telling twins apart needs the event UID or the URL's id, per platform. *From reading the code.*
2. **Brightspace weights only cover released grades.**
   - `myGradeValues` lists only released items. Weights for upcoming work are unknown, so "what do I need on the final" misses items that haven't been graded.
   - In points-based Brightspace courses, each item's share is computed from released items only, so the shares shift during the term.
   - Try `GET /d2l/api/le/{v}/{ou}/grades/` quietly (grade objects with `MaxPoints` and `Weight`). Many schools let students read it. Needs a real tenant to check how category weights are expressed. *From reading the code.*
3. **Canvas "drop lowest" rules are ignored in weights.** Small error, only in courses that use them. *From reading the code.*
4. **Blackboard calendar-link and signed-in keys differ.** The feed uses a made-up course id (`x…`); the API uses `_123_1`. Matching falls back to title, which works unless the two sources word the title differently. *From reading the code.*
5. **Phone sign-in has never run** (Swift and Kotlin plugins). Until it does, phones depend on the desktop relay or the calendar link.

### 4.2 Calendar files (.ics)

1. **Windows time zone names** (Outlook exports `TZID=Eastern Standard Time`) aren't IANA names. `Intl` throws and the time is read as device-local, which is wrong for anyone in another zone. Add a Windows→IANA table for the ~40 common zones. *From reading the code.*
2. **Monthly repeats** add only the first occurrence (the import says so). `VTIMEZONE` blocks are ignored. Usually fine, because the TZID is a standard name.

### 4.3 Syllabus import

These were reproduced against the real `SY` parser with crafted inputs. There is no unit test of `SY.parse`, and that is the biggest test gap.

1. **Common class-time formats give no meetings, with no warning** (`meetingDays`, ~`index.html:15441`).
   - `Tu/Th 2-3:15`, `T/R`, `M W F 9-9:50` all give nothing.
   - Fix: remove `/ , &` and spaces between day tokens, and accept `Tu`/`Th` written alone.
2. **Grade weights are often wrong** (`gradeWeights`, ~:15454).
   - Weights written on one line (`Quizzes 20%, Homework 20%, Midterm 30%`) are never read.
   - Only the first line per category counts, then it is split across all items: `Midterm 1 15%` and `Midterm 2 15%` become 7.5% each.
   - Missing categories: paper/essay, participation, discussion, presentation.
   - A points-table row (`Midterm 150`) becomes a fake task.
   - Drop-lowest is ignored.
   - No warning when the weights don't add up to about 100%.
3. **Re-importing a revised syllabus duplicates moved items.** The duplicate check keys on title + date + course. It should match on title within the course and offer "move from X to Y".
4. **A due time is copied from a class time on the same line.** `Oct 12 Lecture 10:00 am; Homework 3 due` gives Homework 3 due at 10:00.
5. **Two-column PDFs:** a policy cell joined to a dated row becomes a task, for example an Exam named "Exams count 50%".
6. **Dropped silently:**
   - `Unit 2 Test`, `Chapter 4 test`, `Discussion post 3`.
   - "Weekly quizzes every Friday" becomes one quiz.
7. **Two final exams** when the date and the exam-period line both appear.
8. **Term range and no-class dates are thrown away.** Class meetings never end and run through breaks.
9. **Term year:** the first "Fall 2025" in the text wins, even when the syllabus says "revised for Fall 2026".
10. **AI path:**
    - The schema has no fields for end dates, categories with drop rules, term start and end, no-class dates, or time zones.
    - `isDate` accepts `2026-02-30`.
    - PDFs go to the AI without the local parser as a cross-check. Running both and flagging dates that disagree is cheap.

Already solid: year rollover into January, date ranges, "Week N" dates once classes start, 11:59 PM and midnight, repeated headers and footers removed, the scanned-PDF message, and the review UI's flags.

### 4.4 Paste grades

- **Brightspace wording only.** Canvas and Blackboard grade pages copy differently. Canvas can put "18" and "/ 20" on separate lines.
- **Category and total rows** (for example "Assignments 45 / 50") would be read as items if they carry points. The skip list only knows Brightspace's own headings.
- **New tasks** for pasted grades get today as their due date.

With the bookmark, the website now has a structured path for grades. Paste is best kept as a fallback, and the sheet should point to the bookmark.

## 5. Suggested order of work

1. Try the bookmark on one real tenant of each platform (Chrome and Safari). Watch for CSP blocks and for each platform's response on the 20-course limit.
2. Syllabus: class-time separators and one-line weights. These are small, high-impact parser fixes; add `SY.parse` fixture tests while doing them.
3. Brightspace grade objects for upcoming weights (needs a tenant).
4. Windows time zone names in .ics.
5. Browser extension, if the bookmark proves popular.
6. Device testing of the phone sign-in plugins (`MOBILE-SCHOOL-SYNC-SCOPE.md`).

## 6. Files changed in this round

- `lms.js`: Canvas and Blackboard weights, New Quizzes, planner matching by id.
- `index.html`:
  - `makeAdd` (keeps same-named items apart) and planner key handling.
  - Past-days window.
  - The bookmark: `grabRunner`, `grabSheet`, `grabReceive`, `importGrab`, and `SB_GRAB` address capture.
  - Fresh CSP hashes.
- `scripts/build-lms-mobile.js`: `buildGrab` (`--grab`) writes the bookmark's code into `index.html` between the `LMS-GRAB` markers. Rerun it after editing `lms.js`; `tests/lms-grab.e2e.js` fails while the block is stale. (It was a separate `lms-grab.js` at first; a deploy without that file left **Set It Up** doing nothing.)
- `index.html` toast: while a sheet is open the message is shown inside it, so it's visible and its Undo works (before, every message shown over an open sheet was hidden behind it).
- Tests: `tests/lms-harvest.test.js` (+2), new `tests/lms-accuracy.e2e.js` (17 checks) and `tests/lms-grab.e2e.js` (23 checks).
