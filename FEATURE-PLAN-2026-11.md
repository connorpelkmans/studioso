# Six improvements from the competitor review: plan

Written 26 November 2026. Each item builds on code that already exists instead of adding a parallel system. Every item works offline, needs no AI, and is free unless it says otherwise.

Ground rules for all six:
- Plain, calm copy in the app's existing voice (sentence case in body text, Title Case on buttons, no exclamation marks in warnings).
- Nothing new is shown when it has nothing useful to say.
- Every action that changes the plan has Undo.
- Works at phone width (402 px) and desktop width, in light and dark mode, with keyboard and screen reader.
- Source changes go in `src/js` and `src/css`, the native folders and `tests/`. `bundle/` is rebuilt with `node scripts/csp.js`.

## 1. Time Cushion: one number for "ahead or behind"

**Why:** Shovel's best-loved feature. Studyboard already computes the shortfall (`computeFocusNow()` in `src/js/01-board.js`, `F.crunch`), but only shows it as a Heads Up warning once you're short. Students never see that they're fine, or by how much.

**What the student sees**
- A small pill next to Time Today on Today's Plan:
  - green "2h 30m to spare" when every deadline in the next 14 days fits your study time with room left;
  - amber "Tight: 20m spare by Tue" under 30 minutes;
  - red "45m short by Tue" when it doesn't fit.
- Tapping it opens a Time Cushion sheet:
  - a row per upcoming deadline, showing the work needed by then, the study time you have by then, and the cushion;
  - the tightest point is highlighted;
  - one or two fixes: add time on a day, start a big task earlier (opens the existing Crunch preview), or check the estimates (opens Quick Estimates when tasks have none).
- The time counted uses the planning-accuracy scale you already have (`accOf()`), and the sheet says so in one line ("Based on how long your work really takes").
- Tasks without an estimate are counted with the planner's default, and the sheet names how many.
- The Heads Up shortfall line stays as is. The pill is the always-there summary.

**Also:** the number goes into the widget feed (`phoneData().cushion`) so widgets can show it.

**Tests:** unit tests for the cushion maths (spare, tight, short, no work, a day off). An e2e test checks the pill and the sheet at 402 px and 1300 px.

## 2. Android home-screen widgets

**Why:** widgets keep students opening a planner, and countdowns are a standout in reviews. iPhone already has widgets; Android has none.

**What the student sees:** two widgets from the launcher's widget picker.
- **Today (resizable, 2x2 to 4x4):** Do This Next with its time slot, then today's tasks with a checkbox. Ticking a box marks the task done; it reaches the app through the same `drain`/`ack` queue as iPhone. Exam Mode shows the exam countdown at the top, and the Time Cushion line is at the bottom.
- **Countdown (2x1 to 4x2):** the next exam or big deadline, the days left, and readiness when known. Tap it to open the exam.
- Both use the theme accent and follow the system's light or dark mode. With no data, or after sign-out, they say "Open Studyboard to see your day".

**How:**
- A Kotlin Capacitor plugin `StudyboardHomeWidgets` with the same JS name and methods as iPhone (`save`, `drain`, `ack`, `clear`). It stores the JSON in private SharedPreferences and calls `AppWidgetManager.updateAppWidget`.
- `native-bridge.js` stops excluding Android.
- The page code (`src/js/70-widgets.js`) already sends the data. Midnight and the next block's start time are handled with an `AlarmManager` inexact alarm, so the widget moves on without the app.

**Verify:** `npm run android:debug` builds. There is no emulator here (no KVM), so on-device behaviour is untested.

## 3. Focus that holds: a growing sprout, and blocking on phones

**Why:** Forest is loved for a reward you can see. Opal is loved for actually blocking apps. Studyboard has a calm Focus timer and site blocking on desktop only (Pro).

**What the student sees**
- **Focus Sprout (all platforms, free):**
  - A seedling in the Focus timer grows through five stages as the session runs.
  - A finished session adds that plant to a **Focus Garden** shelf for the week, in course colours. It shows in the Focus sheet and the Insights week.
  - Leaving the app or tab mid-session pauses the growth, and on return it says "Welcome back. Your sprout waited for you."
  - An optional Strict Sprout setting wilts it instead after 60 seconds away. The wilted plant stays on the shelf as a dry sprout.
  - With reduced motion, the stages change without animation.
- **Block distracting apps (phone apps, opt-in in Focus settings):**
  - Android: Do Not Disturb for the length of the session, using notification-policy access the student grants once. It's restored when the session ends, the student stops it, or the app is killed (the end time is stored and checked on next open).
  - iPhone: Screen Time blocking (FamilyControls `FamilyActivityPicker` to choose apps, ManagedSettings shields for the session, cleared by a `DeviceActivityMonitor` at the end time). Shipping it needs Apple's Family Controls entitlement; the plugin is written and documented, and the row is hidden until the plugin reports it's available.
- The desktop's existing site blocking stays as it is.

**Interface between the two halves:** `window.StudyboardNative.focusGuard = {available(): Promise<{dnd:boolean, apps:boolean}>, pickApps(): Promise<boolean>, start({until:number, apps:boolean, dnd:boolean}): Promise<boolean>, stop(): Promise<boolean>}`, defined in `ios-wrapper/native-bridge.js` only when a native plugin exists.

## 4. On the wrist: Apple Watch and Wear OS without a separate watch app

**Why:** students ask for a glance and a timer on the wrist. Separate watch apps are weeks of work and need hardware to test. Both watches already mirror the phone's notifications and Live Activities, so making those good gets most of the value.

**What the student sees**
- **Apple Watch (watchOS 11+):** the Focus Live Activity shows in the Smart Stack with a layout made for the watch: the time left, the task, and a ring. The reminder notifications for a due task carry Mark Done and Snooze 1 Hour actions, which also work from the watch.
- **Wear OS and Android:** a Focus session shows an ongoing notification with a live countdown (Chronometer) and Pause and Stop actions. Wear OS shows it as an ongoing activity on the watch face. Deadline reminders get Mark Done and Snooze 1 Hour actions.
- Actions taken from a notification reach the page through a small action queue the app drains on open (the same pattern as the widgets).

**Verify:** the Android parts compile in the debug build. The Swift parts can't be compiled here and are marked UNTESTED like the other iOS native files.

## 5. A calmer first week: Essentials view

**Why:** MyStudyLife wins on simplicity. Studyboard has far more features, and a new student meets all of them at once.

**What the student sees**
- New students start in **Essentials**:
  - the main tabs only (Board/Today's Plan, Calendar, Courses, Review);
  - Today's Plan shows Do This Next, the day's tasks and the time strip;
  - the advanced cards (Crunch, Heads Up extras, companion lines) wait until they're relevant or switched on.
- Everything else is one tap away under **More**, and a Settings row "Show Everything" switches Essentials off.
- Features turn on as they become relevant: adding a first deck shows Review's flashcards, joining a group shows Groups, and an exam within 14 days introduces Exam Prep with one dismissible card. Each unlock is announced once in one line.
- Existing students keep what they see today (Essentials only switches on for new installs).
- The Getting Started checklist (`97-getting-started.js`) links to the unlocks instead of listing everything.

The deeper overwhelm plan (separate document) builds on this switch.

## 6. Move it on the timeline: drag study blocks to another time

**Why:** Structured and Google Calendar are praised for dragging blocks onto the day. Today's Plan already lays out a strip of real times (`F.slotsBy`), but you can't change them.

**What the student sees**
- On a computer, drag a study block in the time strip onto a free slot or another time. On a phone, long-press a block, then drag.
- For keyboard and screen-reader users, and as a simpler phone option, a block's menu has Move To… with times that fit, Tomorrow, and Let Studyboard Pick.
- Classes, events and availability blocks are fixed. A drop that overlaps one snaps to the nearest free time and says so.
- A moved block is pinned for that day (a small pin icon). The planner plans around it, and Let Studyboard Pick removes the pin.
- One Undo reverses the move.
- Pins live on the task (`task.pins = [{date, s, e}]`). They sync with the account and expire after their day.

**Tests:** unit tests for planning around pins and snapping out of fixed blocks. An e2e test drags with the mouse at 1300 px, uses Move To… at 402 px, and checks Undo.

## Order and merge

1, 5 and 6 are web code in separate modules. 2, 3 and 4 share the Android and iPhone wrapper and are built together. After everything is merged: `node scripts/csp.js`, `npm test`, the new e2e tests, `npm run android:debug`, and screenshots of each feature at phone and desktop size.
