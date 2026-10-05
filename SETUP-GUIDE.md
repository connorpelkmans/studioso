# Studyboard setup: GitHub + Supabase

About 20 minutes, done once. You'll need the three files that came with this guide:
`index.html`, `supabase-setup.sql` and `keep-supabase-awake.yml`.

Throughout, replace `USERNAME` with your GitHub username.

## What's New in 1.13

- **Ready for everyone:** Privacy Policy, Terms of Service and an About page (version, credits and licenses) are now in the app, in **Settings > App and Notifications** and on the sign-in screen.
- **Delete My Account and Data:** signed-in people can permanently remove their account and everything stored online from **Settings > Account and Sync**. Run `supabase-lean.sql` once more to switch it on (see "Run the SQL files in this order" below).
- **Easier to use:** every sheet has a name for screen readers, Left and Right Arrow move between tabs, closing a sheet puts the keyboard focus back, bigger tap targets on phones, stronger text contrast, and animations stop when a device asks for reduced motion.
- **Faster start:** the sticker picture cache is built only when the page is quiet.
- **Desktop build fixes:** `npm run prep`, `start` and `dist` work from the repository root, and the Intel Mac build uses a current GitHub runner.

## What's New in 1.12

- **1.12.4:** Study Fields scenes only keep animals that fit the subject (like the cells and microbes in Cell Garden, the class hamster and fish tank, the therapy dog at Night Shift, the farm animals in Green Valley and the Ruins cat) and move more calmly, with rare little surprises. Switching your study companion now updates its name and face across the page right away. Today's Plan is calmer: Do This Next shows once, the other tasks are single tidy lines with the main reason (tap +2 for the rest), Full Ranking and How This Is Ranked share one line, and Board cards drop the default Medium pill and repeated dates.
- **1.12.3:** bigger, true-to-size wheelchair and scrubs at the Night Shift station; every Market District ticker is up; Track and Field now has a proper football/soccer field with yard lines, end zones, field goals and soccer nets at each end, plus a high jump; Ancient Ruins has natural marble ruins covered in flowering vines, a neater whitewashed village, and only the ginger cat.
- **1.12.2:** Night Shift is now a real nurses' station and ward (stethoscope, scrubs, call lights, IV pole, wheelchair, shift whiteboard, a therapy dog), Market District's chart is a sharp-cornered stock line, Track and Field is a full sports stadium (scoreboard and jumbotron, soccer net, field goal posts, basketball hoop, long jump pit, starting blocks), and Ancient Ruins is blue and gold Greek, with a whitewashed village and blue domes and just one cat.
- **1.12.1:** the Study Fields scenes are a lot more fun: brighter colours and cute characters living in every scene (a sleepy cat on the night shift desk, counting sheep in Mind Garden, a hamster on its wheel in the classroom, a bunny conductor at the Concert Hall, island cats on the Ancient Ruins and many more), more things moving, little surprises every so often, and bigger scene moments where everyone joins in.
- **Study Fields:** 20 new scene themes, one for each of 20 popular majors, in their own **Study Fields** group in the Style Shop (Pro): Market District (Business), Night Shift (Nursing), Mind Garden (Psychology), Cell Garden (Biology), Code Night (Computer Science), Gear Works (Engineering), Sunny Classroom (Education), On Air (Communications), Civic Square (Political Science and Law), Case Room (Criminal Justice), Writer's Retreat (English), Gallery Night (Fine Arts), Concert Hall (Music), Track and Field (Kinesiology), Infinite Grid (Mathematics), Chem Lab (Chemistry), Observatory (Physics), Ancient Ruins (History), Green Valley (Environmental Science) and Sketch City (Architecture).
- Each one has a living scene in light and dark, its own scene moment and task pop-up, 3 study companions (60 new in all), a sticker pack of 8, 2 pins and a flashcard style, plus Focus Sounds mixes for later.

## What's New in 1.11

- **1.11.1:** Today's Plan now puts deadlines first (work due soon always stays above work due weeks later, unless the later one is too big to leave), and weighs more things like quick tasks due soon, stalled work and a change of subject. Your study companion now handles the AI features itself (its face, its name, and it tells you when it's on it), and every companion line is a lot more excited, with livelier speech bubbles.
- **Studyboard accounts:** students only ever see Studyboard. They sign in or create a Studyboard account with their email, confirm it with a 6-digit code from a Studyboard email, and reset a forgotten password the same way, all inside the app (desktop app included). Nothing in the app mentions the service behind it. See **Part 1b: Studyboard Accounts** below.
- **Follow-ups:** Ask About This (your companion can explain the card, note, task, file or course on your screen), quick Time Estimates for many tasks at once, exams never shown as Do This Next, page tips that tidy away after 2 weeks, Brightspace discussions marked done when you post, and two sessions of the same class on one day both showing. Focus Sounds is switched off for now.
- **Welcome tour** for first-time users: courses, theme, study hours, reminders, AI and installing the app, in about two minutes. Replay it from Settings.
- **Calendar Sync:** a live calendar link your Apple, Google or Outlook calendar subscribes to, so deadlines, classes and events show up there and stay up to date. You can still download a one-time calendar file.
- **Reminders and notifications** before things are due, a Morning Summary, study nudges, flashcards due and quiet hours. They reach you even when Studyboard is closed: through the desktop app, and on your phone through your Supabase project.
- **Widgets:** a Today widget on your desktop, a tray icon with Quick Add, app shortcuts (press and hold the Studyboard icon), a Today card you can add to your phone's Home Screen, and the Windows 11 Widgets board.
- **Search Everywhere** (Ctrl+K or ⌘K): tasks, courses, flashcards, notes, events and what's inside your files. With AI set up, **Ask With AI** finds things by meaning and can answer with where it found it.
- **Share Decks and Study Groups:** share a deck with a link or code, and make study groups with shared decks, quizzes (with everyone's scores), deadlines, proposed study sessions with RSVPs, a weekly focus challenge, daily check-ins and a message board with reactions and pins.
- **Brightspace, Canvas and Blackboard sync:** connect your school's learning platform once, and your assignments, quizzes, discussions and exams land on your Board and Timeline by themselves, with due-date changes, submitted work marked done, grades in the Grade Tracker, announcements on each course page, and AI that spots new dates in announcements.
- **Theme Collections:** every scene theme now has its own sticker pack (8 stickers), 2 pins and a flashcard style: 528 stickers, 132 pins and 66 flashcard styles in all. Find them in the Style Shop under Theme Collections; your current theme's set comes first, and its sticker pack opens by default in the sticker envelope.
- **Grade Tracker:** add your marks, see your current and projected grade and your pass mark, and find out what you need on the rest.
- **Rough Week Rescue:** when a week is overloaded, Studyboard suggests what to push and what can't move, and applies it in one step.
- **Tidier Settings and Style Shop:** Settings is sorted into six groups (Account and Sync, Appearance, Study and AI, School and Groups, App and Notifications, Data and Backups) with a search box, and the Style Shop has filters, folding sections and a **Collections** tab that shows each theme's stickers, pins and flashcard style together. The side menu now always fits your window without scrolling.
- **Lean Sync:** after the first load, each device only downloads what changed, live updates pause while Studyboard is in the background, backups are kept on your device, and your other devices can search your files without downloading them again. This keeps a Supabase free plan going for a lot more students. Run `supabase-lean.sql` once to switch it on (see Keeping Supabase Free below).
- **Studyboard Pro, built in and switched off:** the Free and Pro plans, limits, a Pro page and payment hooks are ready for when you want to sell Pro. Nothing is locked until you turn it on. The 4 season themes are now part of Pro.
- **Study Companions:** 3 little companions for every theme that live in the scene, study with you, celebrate your wins, grow accessories as you focus, and can use AI to notice what your day looks like.
- **Study Together:** focus at the same time as your study group, with a shared countdown and cheers. Run `supabase-rooms.sql` once to turn it on.
- **Your Photo Themes:** turn your own photo into a full theme with matching colours.
- **Term Scrapbook:** each term gets a scrapbook page that fills with stickers for real milestones: tasks, grades, streaks, focus hours and flashcards.
- **Scene touch-ups:** a careful pass over every scene theme fixed things drawn in the wrong order (like fences over trees and wall lines over chairs), strings and branches that didn't connect, see-through joins, stars and moons in the wrong places, jerky movement, and the aurora's rough edges.
- **All 46 scene themes redrawn** as full scenes with living animations and a scene moment of their own (for focus sessions, study sessions, quizzes and clearing Today's Plan), plus 9 new ones, each with its own task pop-up.

### Updating to 1.11 (one time)

1. **Website:** upload everything from `studyboard-github-files-1.13.0.zip` to your GitHub repository, replacing what's there: `index.html`, `sw.js`, `manifest.webmanifest`, `today.webmanifest`, the `icons` and `widgets` folders, and the `desktop` and `.github` folders. If you had filled in `SB_DEFAULT` in the old `index.html`, fill it in again first.
2. **Database:** in Supabase open **SQL Editor**, then **New query**, and run each of these once: `supabase-groups.sql`, `supabase-calendar-feed.sql`, `supabase-reminders.sql` (paste your Project URL and publishable key into the two lines marked PASTE in the reminders file first) `supabase-rooms.sql` (for Study Together) and, last, `supabase-lean.sql`. `supabase-plans.sql` can wait until you want to sell Pro. The sections below explain what each one is for.
3. **Small Supabase functions** (for Calendar Sync, phone notifications, and optionally school-platform calendar links on your phone): the steps are in the Calendar Sync, Reminders and Brightspace, Canvas and Blackboard sections below. All are pasted into the Supabase dashboard, with no command line.
4. **Desktop:** run the new installer for your computer. Your data stays as it is.

Everything else in 1.11 works as soon as the new `index.html` is up.

---

## Part 1: Supabase (your online storage)

**1. Create the project**
Go to supabase.com and sign in (you can sign in with your GitHub account). Click **New project**, name it `Studyboard`, choose a strong database password and save it somewhere safe, pick a US region close to you, and create it on the **Free** plan. It takes a minute or two to start.

**2. Run the setup SQL**
In the left sidebar open **SQL Editor**, then **New query**. Open `supabase-setup.sql`, copy everything into the editor and click **Run**. You should see *Success. No rows returned*. This creates your data table, locks it so only your account can read it, turns on live sync, and makes a private storage area for files.

**3. Tell Supabase where the app lives**
Open **Authentication**, then **URL Configuration**.
- **Site URL:** `https://USERNAME.github.io/studioso/`
- **Redirect URLs:** add the same address.

Save. This is where confirmation and password-reset emails send you back to.

**4. Copy two values** (you'll paste them into the app and into GitHub)
- **Project URL**, like `https://abcdefgh.supabase.co`. It's on the project's home page (the **Connect** button) and under Project Settings.
- **Publishable key**, starting with `sb_publishable_`, under **Project Settings > API Keys**. Older projects show an **anon** key instead, which works the same way.

Never use the **secret** or **service_role** key. The app refuses them.

---

## Run the SQL files in this order

Open **SQL Editor > New query** in Supabase, paste a whole file and click **Run**. Every file is safe to run again. Run them in this order on a new project:

| Step | File | What it is for | Needed? |
|---|---|---|---|
| 1 | `supabase-setup.sql` | Your synced data table (`items`) and the private file storage | Required |
| 2 | `supabase-groups.sql` | Share decks and study groups | Recommended |
| 3 | `supabase-calendar-feed.sql` | The live calendar link | Optional |
| 4 | `supabase-rooms.sql` | Study Together rooms (needs step 2) | Optional |
| 5 | `supabase-reminders.sql` | Phone and desktop reminders (paste your Project URL and key into the two lines marked PASTE first) | Optional |
| 6 | `supabase-bug-reports.sql` | Report a Bug or Send Feedback | Recommended |
| 7 | `supabase-plans.sql` | Free and Pro plans, limits, devices (run after step 2 so group limits are added) | Before you sell Pro, and for notification keys |
| 8 | `supabase-lean.sql` | Lean Sync and **Delete My Account and Data** (run it last) | Required for a public launch |
| 9 | `supabase-capture.sql` | Voice and shortcut capture (Siri, Gemini, Bixby, share sheet). Run it after step 8 so account deletion also clears it, then deploy the `capture-task` function with Verify JWT **off**. Optional check: `supabase-capture-selftest.sql`. See `VOICE-CAPTURE.md` | Optional |
| 10 | `supabase-sync-conflicts.sql` | Sync conflicts: two devices editing the same thing never overwrite each other (run it after `supabase-lean.sql`; see "Two devices, one note" below) | Strongly recommended |

If you run `supabase-groups.sql` or `supabase-calendar-feed.sql` later, run `supabase-plans.sql` and `supabase-lean.sql` again afterwards. Running `supabase-groups.sql` again also resets who can see blocked people's tasks, so run `supabase-moderation.sql` again after it.

**Edge Functions.** Each one lives in its own folder, `supabase-functions/<name>/index.ts`. Deploy it either by pasting the file into Supabase (Edge Functions > Deploy a new function > Via Editor, named exactly as below, then set the Verify JWT switch in its Details), or with the Supabase CLI from the repository root. `supabase/config.toml` records the same names, entrypoints and Verify JWT settings, but the commands below set the switch themselves, so they are right with any CLI version:

| File in this repository | Function name | Verify JWT | CLI command (add `--project-ref <your-project-ref>`) |
|---|---|---|---|
| `supabase-functions/calendar-feed/index.ts` | `calendar-feed` | Off | `supabase functions deploy calendar-feed --no-verify-jwt` |
| `supabase-functions/billing-webhook/index.ts` | `billing-webhook` | Off | `supabase functions deploy billing-webhook --no-verify-jwt` |
| `supabase-functions/lms-feed/index.ts` | `lms-feed` | On | `supabase functions deploy lms-feed` |
| `supabase-functions/send-reminders/index.ts` | `send-reminders` | Off | `supabase functions deploy send-reminders --no-verify-jwt` |
| `supabase-functions/delete-account/index.ts` | `delete-account` | **On** | `supabase functions deploy delete-account` |
| `supabase-functions/create-checkout/index.ts` | `create-checkout` | On | `supabase functions deploy create-checkout` |
| `supabase-functions/create-portal-session/index.ts` | `create-portal-session` | On | `supabase functions deploy create-portal-session` |
| `supabase-functions/entitlement-token/index.ts` | `entitlement-token` | On | `supabase functions deploy entitlement-token` |
| `supabase-functions/capture-task/index.ts` | `capture-task` | Off | `supabase functions deploy capture-task --no-verify-jwt` |
| `supabase-functions/error-ingest/index.ts` | `error-ingest` | Off | `supabase functions deploy error-ingest --no-verify-jwt` |

The CLI looks for functions in `supabase/functions/` unless your version reads the `entrypoint` lines in `supabase/config.toml`. If yours says it can't find a function, deploy that one by pasting it in the dashboard instead (or copy the folder to `supabase/functions/<name>/` first). Offline checks for the functions: `node --experimental-strip-types supabase-functions/tools/test-functions.mjs` and `node --experimental-strip-types supabase-functions/tools/test-capture.mjs`.

**delete-account** is what makes "Delete My Account and Data" remove everything on the server, including the uploaded files themselves (SQL cannot delete files in Storage; this function uses the service role to list and remove every file under `<user id>/` in the `studioso-files` bucket, then runs `studyboard_delete_user_data` from `supabase-lean.sql`, then deletes the sign-in account, which ends every session). It also cancels a Stripe card subscription so billing never keeps running, asks for a recent sign-in or the password, and allows 5 tries an hour. Secrets: `STRIPE_SECRET_KEY` (the one the billing functions use; skip if you never took card payments) and `SITE_ORIGINS` (your web address, same value as for `create-checkout`). Without this function the app falls back to deleting files and rows with the person's own sign-in, but it cannot cancel Stripe, so it asks them to cancel first. Test it with `node --experimental-strip-types supabase-functions/tools/test-functions.mjs` and, in Supabase, with `supabase-delete-selftest.sql` (SQL Editor, run after `supabase-lean.sql`; it rolls back).

---

## Part 1b: Studyboard Accounts (one server for everyone)

This makes your Supabase project the Studyboard server for every student. They never see a "connect" screen or the word Supabase: they just **Sign In to Studyboard** or **Create Account**, and the emails come from Studyboard.

**1. Build your server into the app**
Put your Project URL and publishable key (from Part 1, step 4) into a file called `server.json` next to `build.py`:
```
{ "url": "https://abcdefgh.supabase.co", "key": "sb_publishable_..." }
```
(`server.example.json` shows the shape.) Every copy built after that (website, desktop app and phone) connects to your server by itself. The publishable key is meant to be public, so it's safe inside the app. Never put the secret key there; the build refuses it.

**2. Email sign-in settings** (Authentication, then Sign In / Providers, then Email)
- **Enable Email provider:** on. **Confirm email:** on.
- **Minimum password length:** 8 (or more). Turn on **Prevent use of leaked passwords** (Authentication, Sign In / Providers, Email; a Pro plan feature) and require letters and digits if you like.
- **Secure email change:** on (a change needs a confirmation from the old AND the new address; it uses the `change-email.html` template). **Secure password change:** on (asks for a fresh code, `reauthentication.html`, when the sign-in is old). **Prevent use of leaked passwords:** see above.
- **CAPTCHA protection:** turn it on before a big public launch (Authentication, Attack Protection; hCaptcha or Turnstile) if you see fake sign-ups. If you turn it on, the sign-in forms need the CAPTCHA token added to `signUp`, `signInWithPassword` and `resetPasswordForEmail` in `index.html` and `website/account/account.js`; the apps do not send one today, so test sign-up right after switching it on.
- **Email OTP Expiration:** 3600 seconds (1 hour). **Email OTP Length:** 6.
- Under **URL Configuration**, keep the Site URL and Redirect URL from Part 1, step 3. The links in emails open the website; the codes work everywhere, including the desktop app. See "Redirect URLs allowlist" below for the full list.
- **Unconfirmed accounts:** with **Confirm email** on, a new account has no session until the code or link is used: the app shows "Check Your Email", says that until then Studyboard works on this device only and does not sync, and the **Send a New Code** button has a 30 second cooldown. Signing in before confirming sends a new code automatically.
- **No account guessing:** sign-up for an existing address, "forgot password" for an unknown address and a wrong password all show the same words in the app and on the website. Keep it that way if you edit the messages.

**3. Send emails from Studyboard (custom SMTP, free)**
Supabase's built-in email sender only sends a few emails an hour and is meant for testing, so set up your own before real students sign up. Pick one:
- **Gmail** (free, no domain needed, up to about 500 emails a day): turn on 2-Step Verification for your Google account, then make an **App Password** (Google Account, Security, App passwords). Host `smtp.gmail.com`, port `587`, username your Gmail address, password the app password.
- **Brevo** (free, 300 emails a day): make an account, add and verify your sender email, then use the SMTP details under SMTP and API. Host `smtp-relay.brevo.com`, port `587`.
- **Resend** (free, 3,000 emails a month, 100 a day): best deliverability, but it needs a domain you own (about $15 a year), verified with a few DNS records. Host `smtp.resend.com`, port `465`, username `resend`, password your API key.

In Supabase open **Authentication**, then **Emails**, then **SMTP Settings**, turn on **Enable custom SMTP** and fill in:
- **Sender email:** your address (for example `hello@yourdomain.com`, or your Gmail).
- **Sender name:** `Studyboard`
- **Host, Port, Username, Password:** from the provider above.

Then open **Authentication**, then **Rate Limits**, and raise **emails sent per hour** to what your provider allows (for example 100).

**4. Studyboard email templates**
In **Authentication**, then **Emails**, then **Templates**, open each template, paste the matching file from the `email-templates` folder into the message body, and use the subject from `SUBJECTS.txt`:
- Confirm signup: `confirm-signup.html`
- Reset password: `reset-password.html`
- Magic link: `magic-link.html`
- Change email address: `change-email.html`
- Invite user: `invite.html`
- Reauthentication: `reauthentication.html`

The six files are in the repository root (not in a folder). Each email shows a big 6-digit code (Studyboard asks for it), a button that does the same thing on the web, the link written out in plain text for mail apps that hide buttons, the app name, and a link to your site (`{{ .SiteURL }}`). They use only these Supabase variables: `{{ .Token }}`, `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}` (change email only) and `{{ .SiteURL }}`. They contain no images, scripts or trackers (`node tests/store-readiness.test.js` checks this). Send yourself a test of every template: sign up (confirm-signup), forgot password (reset-password), change email in Settings (change-email, sent to both addresses), change password when asked for a code (reauthentication). Magic link and invite are only used if you switch those flows on in Supabase; the app has no magic-link button.

**4b. Custom SMTP checklist (emails that actually arrive)**
- [ ] **From address on your own domain** (for example `hello@yourdomain.com`), not a free webmail address, and the **Sender name** is `Studyboard`.
- [ ] **SPF:** one TXT record on the domain that includes your provider (the provider shows the exact value, for example `v=spf1 include:amazonses.com ~all`). Only one SPF record per domain.
- [ ] **DKIM:** add the CNAME/TXT records your provider gives you and wait until the provider shows "verified".
- [ ] **DMARC:** TXT record on `_dmarc.yourdomain.com`, start with `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`, move to `quarantine` once reports look clean.
- [ ] **Test deliverability:** send each template to a Gmail, an Outlook and a school address; check inbox vs junk and the "Show original" headers say SPF, DKIM and DMARC = PASS (or use mail-tester.com).
- [ ] **Template variables:** open each template in the dashboard after pasting and check the preview shows a code, not `{{ .Token }}`. Subjects come from `SUBJECTS.txt`.
- [ ] **Token expiry:** Email OTP Expiration 3600 seconds, length 6 (the emails say "1 hour").
- [ ] **Rate limits:** Authentication, Rate Limits: emails per hour matches your provider; sign-ups and sign-ins per hour per IP left at the defaults or lower. The app shows "Too many tries just now" for them.
- [ ] **Bounces and spam complaints** are monitored in your provider's dashboard; add the provider to your privacy policy ("Email delivery", fill in the provider name).

**4c. Redirect URLs allowlist** (Authentication, URL Configuration)
- **Site URL:** your website address, for example `https://app.yourdomain.com` (also the address of `website/` if hosted together; if the account page lives on a different host, add it below).
- **Redirect URLs** (all of these; wildcards allowed only where shown):
  - `https://app.yourdomain.com/**` (the web app and the website's `account/` page)
  - `https://www.yourdomain.com/**` (if the marketing website is on another host)
  - `studyboard://**` (iOS and desktop deep links)
  - `capacitor://localhost/**` (the Capacitor iOS app's own address)
  - `http://localhost:3000/**` only while developing; remove it before launch.
- The desktop and phone apps do not send an `emailRedirectTo`, so their emails use the Site URL; the 6-digit code works there regardless of the link.
- An email link that is expired or already used lands on the app with `#error_code=otp_expired`; the app and the account page then show "That link has expired or was already used" with buttons to send a new one.

**5. Phone notifications for everyone** (after Reminders is set up, see below)
Open `notification-keys.html` (it came with this guide) in your browser and click **Make Keys**. Add the three values to **Edge Functions**, then **Secrets**, and run the SQL line it gives you. From then on, students just tap **Turn On for This Device** in Reminders. (`supabase-plans.sql` must be run first, because the public key is kept in its settings table.)

**6. Later, if you want**
- **Google sign-in (careful):** Studyboard has no Google, Facebook or other social login today, which is why the iPhone app does not need Sign in with Apple (App Store guideline 4.8). **If you add Google sign-in later you must also add Sign in with Apple** in the same release, or Apple rejects the app. See `APP-STORE-CHECKLIST.md`, "If you add Google sign-in later you must also add Sign in with Apple".
- **Custom domain** (a paid Supabase add-on): the one place the Supabase address still shows is the live calendar link students paste into their calendar app (and a Google sign-in popup, if you add one). Only pay for a custom domain if that bothers people.

---

## Part 2: GitHub (hosting and the keep-awake ping)

**5. Upload the new app**
Open your `studioso` repository, click **Add file > Upload files**, drag in the new `index.html`, and click **Commit changes**. It replaces the old one, and your site updates within a couple of minutes.

**6. Add two secrets for the ping**
Open the repository's **Settings > Secrets and variables > Actions** and click **New repository secret** twice:
- Name `SUPABASE_URL`, value: your Project URL
- Name `SUPABASE_KEY`, value: your publishable key

**7. Add the keep-awake job**
Back on the repository's main page, click **Add file > Create new file**. For the file name, type exactly
`.github/workflows/keep-supabase-awake.yml`
(the slashes create the folders). Paste in everything from `keep-supabase-awake.yml` and click **Commit changes**.

**8. Test it**
Open the **Actions** tab, choose **Keep Supabase awake**, then **Run workflow**. After a few seconds it should show a green check. From now on it runs every third day on its own. It also makes a tiny commit every 45 days, because GitHub switches off scheduled jobs in public repositories that go 60 days without commits.

---

## Part 3: Move in and switch on backups

**9. Export everything from the Claude version**
Open Studyboard in Claude, open the **⋯** menu and choose **Export Backup with Files**. This saves one `.zip` with all your data and every uploaded file. (If you never uploaded files, **Export a Backup File** is enough.)

**10. Connect and create your account**
Open `https://USERNAME.github.io/studioso/`. The **Connect to Supabase** screen appears: paste your Project URL and publishable key, then click **Connect**. Enter your email and a password (at least 8 characters) and click **Create Account**. Open the confirmation email from Supabase; the link brings you back signed in.

**11. Import your data**
Open **⋯ > Import from a Backup File** and choose the `.zip` (or `.json`) from step 9. Confirm with **Replace**. Your files are uploaded to your Supabase storage as part of the import.

**12. Turn on automatic folder backups** (Chrome or Edge on your computer)
Open **⋯ > Automatic Backups > Choose Folder** and pick or create a folder inside OneDrive or Google Drive, for example `OneDrive/Studyboard Backups`. Allow access when asked. Studyboard then keeps:
- `studyboard-latest.json`, updated a minute after every change
- `Daily backups/`, one copy per day, the last 90 days
- `Files/`, a copy of every uploaded file, sorted by course and folder

Your cloud drive keeps its own version history of all of it. After a restart, Chrome may ask for access again. If it offers **Allow on every visit**, choose that; otherwise a **Resume Backups** banner appears on the Board, and one click turns them back on.

**13. Add your phone and other devices**
Open the same address, paste the Project URL and publishable key, and sign in. On a phone, use **Add to Home Screen** so it opens like an app. Everything syncs live between devices.

To skip pasting the two values on every new device, you can put them in `index.html` itself: find the line `const SB_DEFAULT = {url: "", key: ""};`, fill in both, and upload the file again. The publishable key is safe to include; your data is protected by your login.

---

## How your data is protected

| Risk | What keeps your data safe |
|---|---|
| Supabase pauses the project | The GitHub ping keeps it active. Even if it paused, nothing is deleted and each device still has a full working copy. |
| Supabase is down or you're offline | Every device keeps a full copy and works offline. Changes wait and sync when you're back online, even if you close the page first. |
| A mistake, like deleting a course | Undo right away, or restore a backup from **Settings > Data and Backups > Restore a Backup**. Each device keeps a daily backup for the last 14 days, and your account keeps weekly ones. |
| Losing your Supabase account or project | Daily backups and file copies in your cloud folder. Import `studyboard-latest.json` (or any daily file) into a new project. |
| Losing your computer | The cloud folder and Supabase both still have everything. |

**Free plan limits:** 500 MB of data (years of tasks and notes) and 1 GB of uploaded files, up to 50 MB per file.

**Signing out** removes this device's copy; everything stays in your account.

## Studyboard as an App

There are two ways to install Studyboard. Both sync through your Supabase account, so you can switch between devices.

### On your Windows computer: the Studyboard app

1. Run **Studyboard-Setup-1.13.0.exe**. Windows may say "Windows protected your PC", because the installer isn't signed with a paid code-signing certificate. Click **More info**, then **Run anyway**.
2. Pick where to install (the default is fine) and finish. Studyboard gets a Start menu entry, a desktop shortcut and an uninstaller in Settings > Apps.
3. The first time it opens, choose **Connect to Supabase** and paste the same Project URL and publishable key as on the website, then sign in. Or choose **Use Without an Account** to work only on this computer, and connect later in Settings.

What the app keeps on your computer, in **Documents\Studyboard** (Settings > Open Folder):

- `studyboard-latest.json`: everything, updated a few seconds after each change and again when you close the app.
- `Daily backups\`: one copy per day for the last 90 days.
- `Files\`: every file you add, sorted by course and folder. Files you add while offline are saved here first and upload to your account the next time you're online and signed in.

To also get a cloud copy of that folder, choose **Change** in Settings and pick a folder inside OneDrive or Google Drive. Everything moves over and nothing is deleted from the old folder. If you ever reinstall Windows or the app, install Studyboard again and it picks everything back up from the Studyboard folder or your account.

Updating: installing a newer version over the old one keeps all your data. To build a new installer after changing `index.html`, open your GitHub repository, go to **Actions**, choose **Build Studyboard desktop app**, then **Run workflow**, and download the installer from the finished run.

### On a Mac (macOS 12 or newer, Apple Silicon)

Use **Studyboard-1.13.0-mac.dmg** on Apple silicon Macs (M1 and newer) and **Studyboard-1.13.0-mac-intel.dmg** on Intel Macs. The Intel version needs macOS 12 Monterey or newer, which covers the last generation of Intel Macs (2018 to 2020). Not sure which you have? Apple menu > About This Mac shows either "Chip: Apple M…" or "Processor: Intel".

1. Open the .dmg for your Mac and drag **Studyboard** onto **Applications**.
2. The first time, macOS says it can't verify the developer, because the app isn't notarized by Apple (that needs a paid Apple Developer account, $99 a year). Click **Done**, then open **System Settings › Privacy & Security**, scroll down and click **Open Anyway** next to Studyboard, and confirm. After that it opens normally.
3. When asked, allow Studyboard to use your **Documents** folder. That's where it keeps the Studyboard folder with your data, daily backups and files, just like on Windows.
4. Connect to Supabase and sign in the same way as on Windows, and your Mac, PC and phone stay in sync.

This build is for Macs with Apple silicon (M1 and newer), which is every Mac that runs macOS 27.

### On your phone (or any browser): install the website

On a phone, the Board tab has two tabs at the top, **Today's Plan** and **Task Board**, so you see one at a time. Press and hold a card to drag it; the board stays on the column you drop it in.


1. Upload the files from **studyboard-github-files-1.13.0.zip** to your GitHub repository, next to `index.html` (replace it too): `manifest.webmanifest`, `sw.js`, the `icons` folder, and optionally the `desktop` and `.github` folders so GitHub can build the Windows app for you.
2. Open your Studyboard site once while online.
3. On an **iPhone**, tap **Share**, then **Add to Home Screen**. On **Android** or in **Chrome/Edge** on a computer, open the browser menu and choose **Install app** (or **Add to Home screen**). Studyboard's Settings also shows an **Install** button when the browser offers one.

After that it has its own icon and window and opens without internet. Changes made offline are kept on the device and sync when you're back online.

### Moving over from Studioso

Studioso is now called **Studyboard**. Nothing about your account or data changes:

- **Website:** upload the new files from `studyboard-github-files-1.13.0.zip` as usual. Your GitHub repository and web address can keep their old names; if you rename the repository, update the Site URL in Supabase (Authentication > URL Configuration) to the new address.
- **Windows app:** run `Studyboard-Setup-1.13.0.exe`. It replaces Studioso (the old shortcuts go away and new Studyboard ones appear). The first time Studyboard opens, it renames **Documents\Studioso** to **Documents\Studyboard** and brings over your sign-in and settings. The old app data is left in place as a spare copy.
- **Phone:** the home-screen app updates itself the next time you open it online. To get the new name under the icon, remove it and add it to the Home Screen again.
- **Behind the scenes:** Supabase names (like the `studioso-files` storage bucket) stay as they are, so everything keeps syncing.

## AI Features (free with Google Gemini)

Studyboard's AI uses Google Gemini by default because it's free. One student's studying fits comfortably in the free tier.

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and sign in with a Google account.
2. Click **Create API key**. Don't add billing to that project; without billing it can never charge you. If you hit the free limit, AI just pauses until it resets.
3. In Studyboard, open **Settings → AI Features → Set Up**, paste the key, press **Test**, then **Save**.

Your keys sync to your other devices through your account, and they're left out of backup files you export.

**Choosing a model.** Every AI window has a **Model** picker. "Gemini, Auto" is free and recommended: it uses the best free Gemini model and quietly moves to another one if Google's servers are busy. You can also use paid models:
- **Paid Gemini** (like Gemini 3.1 Pro): turn on billing for your key in Google AI Studio.
- **Claude** or **ChatGPT**: add an API key from [Anthropic](https://console.anthropic.com/settings/keys) or [OpenAI](https://platform.openai.com/api-keys) under "Use a Paid Model Instead". These are billed per use to your account with that company, separately from any Claude or ChatGPT subscription. Big PDFs cost the most.

**Automatic AI.** In Settings → AI Features, "Improve Today's Plan and study sessions automatically" lets the AI work in the background without you pressing anything. It:
- picks **Do This Next** and the alternatives behind "Something Else", with a reason and a first step
- estimates hours for tasks you didn't estimate, using how long your past tasks took
- estimates the work left on started tasks from your focus time and progress
- judges how ready you are for each exam from your study sessions, flashcards and quizzes
- tunes the next study sessions to what you keep missing, and picks the flashcards for Study Cards
- prepares the practice test before a practice day, so Practice Quiz is ready to go
- reads each task's instructions, your next few days on the Schedule, your course standings from the Grade Tracker and recent announcements from Brightspace, Canvas or Blackboard, and lists up to 3 things you could easily miss under **Heads Up** in Today's Plan (an earlier draft or pre-lab deadline, a changed due date, a full lab, placement or work day right before something is due). Dismiss one with ×.
- rates how demanding tasks look when you haven't set Easy or Hard, so hard ones get more time and start earlier
- checks whether a new exam or quiz can be **taken from home** (Exam Location Check): it only reads the instructions your school site already gave Studyboard, never guesses without a quote from them, and an exam that isn't known to be take-home is never suggested as Do This Next. Switch it off under Suggestions, Manage; it never uses more than 6 requests a day

It only runs when something changed and a few times a day, and anything it changed is marked with ✦. It's on by default only if your default model is free Gemini. It can run on free Gemini even when your default is a paid model. It will never use a paid model unless you choose that, tick "I understand", and press **Confirm and Turn On**, and it asks again if you switch to a different paid model. If you turned on billing for your Gemini key, even "free" Gemini requests may be billed.

**What AI does in Studyboard**
- **Quick add** (top of the Board): type a sentence like "bio quiz fri 2pm worth 5%" and check the task before it's added. Without AI it still reads dates, times, hours, grade weights and course names on your device.
- **Time estimates**: the Estimate button next to Hours Needed. Studyboard learns from your focus sessions how long your tasks really take; AI adds a range, a reason and steps you can add to the checklist.
- **Do This Next**: the top of Today's Plan picks one task for right now, with a reason and a focus button. "Something Else" shows the next pick. This runs on your device and doesn't need AI.

**How Today's Plan decides** (all on your device, no AI needed)
- **Deadlines come first:** the closer the exact due time, the higher the task. Due tomorrow counts about five times as much as due in a week, and dozens of times more than due in a month. Anything due in the next week always stays above work due 10 or more days after it, unless that later task is big enough to need most of your study time before its deadline (then it climbs early so it gets started in time, and the plan says why).
- **Your time:** your study hours per day, less on long class, lab or placement days from your Schedule (an all-day event called Placement, Practicum, Internship or Clinical counts as a full day). Focus time you've already done today comes off today's time.
- **Deadlines and workload:** everything due before each deadline is added up and compared with the time you have, so you see a warning before you fall behind.
- **Grade impact:** each task's weight fine-tunes the order between similar deadlines (a 40% project counts about twice a 1% reading, not more). If your school's gradebook isn't weighted, school sync works it out from the points (a 40-point assignment in a 200-point course is about 20%).
- **Late submissions:** from school sync, when each item stops accepting work. Something that still accepts late work is less urgent than something that closes at the due time, and anything that can't be handed in any more stops taking up your time.
- **Instructions:** word or page counts ("1500 words, APA") make time estimates more realistic, and an earlier step with its own deadline (a draft, an outline, a pre-lab) is pointed out.
- **Other things it weighs:** your priority, tasks already started or nearly finished, small tasks due within 2 days (quick to clear), hard tasks due within 5 days, started work left alone for 5+ days, a full placement or class day coming up before the due date, tasks other tasks are waiting on, and courses close to their pass mark. After 2 hours on one course in a day, Do This Next leans toward a different course for a change of subject.
- **Right now:** with a class coming up within the hour, Do This Next suggests something that fits in the gap and sizes the focus session to it. Hard work goes in the morning, short tasks late at night, and an exam or quiz is only Do This Next when it can be taken from home (Studyboard works that out from your school site and the instructions, and asks you if it can't tell; you can also set it under Where is this taken? on the exam). In-person exams and quizzes stay on the calendar, and their study sessions are what gets suggested.
- **Automatic AI** (when it's on) is a second opinion: it can reorder the picks, but it can't bury something due today that you're short of time for, or jump to something due weeks away ahead of work due in the next few days.

**Your study companion does the AI work**
When you have a study companion out, it's the one handling Studyboard's smart features: its little face replaces the ✦ AI mark, Do This Next shows as its pick ("Mochi's Pick"), Heads Up becomes "Mochi Noticed", and buttons say things like **Create with Mochi** and **Ask Mochi**. When you start something like making flashcards or a summary, your companion says it's on it, then cheers when it's ready. Turn companions off and everything goes back to the plain AI labels.
- **Create with AI** (Flashcards): flashcards, practice quizzes and case studies from your slides, in any style (AP, MCAT, USMLE, NCLEX, bar exam, CPA, select all that apply, a general mixed quiz, and more).
- **Explain This**: on a flipped flashcard or an answered question, get a plain explanation, an analogy, an example and a memory tip.
- **Typed answers graded by meaning**: "K+" counts for "Potassium". You still have "I was right" if you disagree.
- **Weak Spots**: gathers the cards and questions you keep missing and writes fresh questions on those ideas.
- **Case studies**: scenarios that unfold step by step with new information before each question.
- **Exam Prep Planner** (**Plan My Prep** on any exam or quiz: its row, its detail sheet, the Courses page, a prompt on Today when an exam is within 3 weeks, the New exam form, a captured exam, or Search): enter the date, type or paste the topics (or tap **Suggest Topics** to fill them from the course's decks, notes, files and the chapters named in the exam notes), and mark each one Shaky, OK or Strong with an optional weight. It spreads sessions across the days before the exam (learn, reviews a day, three days and six days later, a recap in the last 2 days, a timed practice 3 to 5 days out, a light review the night before), fits them into your free time and away from crunch days, and links each topic to its matching decks, notes, quizzes and files (editable). Each session is a Study task that opens the deck, note or quiz. With very little time you get a crash plan that lists what it dropped. The **Prep plan** view shows the day-by-day agenda, coverage per topic and readiness (shown only once you have a finished session, flashcard progress or a quiz score), with **Catch Up** for missed days and **Re-plan** if the exam moves. It works fully offline; if AI is set up it can word each session's instruction (dates and minutes always stay exact). Older study plans keep working.
- **Summarize** (open a file in Files): key points, key terms, likely exam questions, with buttons to turn the terms into flashcards or pin the summary as a note.
- **Photo to Note** (Notes): photos of the whiteboard or slides become typed notes, and dates in them can become tasks.
- **Ask AI** (a course, or Files with a course open): chat with your course files. Answers cite the file and slide. Every question re-sends the checked files, so check only what you need.
- **Syllabus import**: reads dates, weights, class times and now work-hour estimates.
- **Break It Down** (a big paper or project): words the milestones for your assignment text. It never picks dates; those come from your calendar, and it falls back to a template if the answer isn't usable.

Things to know:
- On Google's free tier, Google may use what you upload to improve its products. Don't upload private information such as personal or sensitive details.
- PDF is the best format for slides, because the AI also sees pictures and diagrams. From .pptx and .docx files only the text and speaker notes are used.
- About 13 MB of files can go in one request. Split very large PDFs.
- AI can get things wrong, so check cards, rationales and summaries against your notes.
- AI needs an internet connection and doesn't work inside the Claude preview; use the app or your website.

## Big Assignment Breakdown

Open a paper, project, lab report or presentation and tap **Break It Down** (also on the task row, under Courses, or from the menu to paste a prompt or rubric or add a PDF). You get 3 to 8 milestones, scheduled backward from the due date, with the last one a day before it by default. You can edit titles, dates and hours, move a milestone off a heavy day, and create them all at once; one Undo reverses everything. It needs no setup and works offline; if AI Features are on, the steps are worded for your assignment (the dates and hours always come from your calendar). When a syllabus is imported, big assignments have a "Break down into milestones" checkbox. The parent task keeps the real due date and shows "3 of 6 milestones done". If its due date changes later, Studyboard offers to re-plan the open milestones, and an overdue milestone offers a catch-up plan. Nothing to run on the server: milestones are ordinary tasks and sync with everything else.

## Quick Capture

Settings > Quick Capture explains each way in that works on your device (the share sheet and Siri link rows are for the web and phone apps; the screenshot row is for the desktop app), with a Try it button for each, and three switches: Add right away when I'm sure (on), Keep photos with tasks (off), Use AI to read photos (on once AI is set up).

- **Typing:** press **C** anywhere (or open `./?capture=1`, or the "Quick capture" app shortcut). Type a sentence such as `bio lab report fri 5pm`, `exam 12/5 9am`, `chem201 pset in 3 days 2h` or `read ch 4 wk 9`. **Enter** adds, **Ctrl/Cmd+Enter** adds and keeps the window open for the next one, **Esc** cancels. One task per line. Dates are read on the device (today, tomorrow, fri, next tue, oct 28, 10/28, in 3 days, end of the month, wk N), so no network is needed. A clear sentence with a date is added at once with an Undo button ("Added: Bio lab report, due Fri 5 PM"). Anything unsure (no date, a second course that fits, "next week") opens a small check sheet where one Enter adds everything.
- **Photo:** the camera button beside the add bar (or the "Capture photo" shortcut, or paste or drop a picture on the Board) shrinks the photo on the device (1600 px, no location data), then sends it to your own AI provider after the AI consent sheet. You get a list to check next to the photo. Items the AI is unsure about start unchecked, and dates that are not in the photo are removed. Without AI, or if you say no, the photo stays on screen while you type it in, or you can save it as a note. Photos taken offline are kept (up to 50) and offered when you are back online.
- **Share sheet:** Android, ChromeOS and desktop installs of the web app appear in Share (the manifest `share_target` posts to `share-target`, handled by `sw.js`: images only, 10 files, 15 MB each, held only until the page reads them). iPhone Safari web apps cannot receive shares; the iOS app has a share extension (see `ios-wrapper`).
- **Shortcuts and links:** `./?capture=<text>&due=YYYY-MM-DD&time=HH:MM&course=BIO101&source=ios-shortcut`, the same after `#`, and `studyboard://add?title=...&due=...` or `studyboard://capture?photo=1`. Only those fields are read; text is stripped of HTML and capped. A link only ever makes a draft and always shows the check sheet (one Enter adds it): custom link schemes can be launched by any app or website, so links are never added silently. Items handed over directly by the native app (Siri action, share extension, tile) are added straight away. More than 10 links a minute are ignored.
- **Screenshot anything (Windows, Mac and Linux desktop app only):** press **Ctrl/Cmd+Alt+C** anywhere on the computer, even with Studyboard in the background (Settings > Quick Capture can switch it off or pick another of four shortcuts; the tray menu has **Screenshot to Task** too). The screen under the mouse freezes, you drag a box around what you want (**Esc** cancels, **Enter** takes the whole screen), and only that part is sent to the Studyboard window as a JPEG (never saved to disk). The AI first says what it is: deadlines, an assignment page, an email or announcement become tasks on the usual Check and Add sheet; a syllabus or timetable opens **Import a Syllabus** on the same picture; lecture slides, a textbook page or an article open **Photo to Note**; anything else says so and offers typing it in. It needs AI Features turned on and your AI consent, like a photo. On a Mac, allow Studyboard under System Settings > Privacy & Security > Screen Recording the first time. Code: `startShot()` in `main.js`, the picker in `shot.html`, `shot.js`, `shot.css`, `shot-preload.js` (staged into `widget/` by `prepare.js`), and `routeShot()` in the capture module. Test: `node tests/screenshot.e2e.js`.
- **For developers:** `window.SBCAPTURE.handleUrl(url)`, `ingest(draftsOrItem, {source})`, `registerInbox(fn)` and `settingsExtra(fn)` are documented at the top of the "75-capture" module. Tests: `node tests/capture.test.js` (parser, links, photo-answer checks) and `node tests/capture.e2e.js` (Playwright and Chromium).

## Schedule and Calendar

- **Plan Ahead:** Timeline and Schedule are one tab, **Plan Ahead**, with a **Timeline | Schedule** switch at the top. Studyboard remembers which one you last used.
- **Your classes** come from each course's class times. **+ Event** adds your own events: appointments, work shifts, study groups. They can be one-time or repeat every week or every 2 weeks.
- **This week only:** if a class or office hours moves for one week, drag it on the Schedule to the new time or day (on a phone, press and hold it first). You can also tap it and change the date and time for that week, or **Skip This Week**. Every other week stays the same. Moved classes are outlined and marked "This week only", and skipped ones show faintly so you can bring them back. **Reset to Usual Time** undoes a change, and **Edit All Weeks** changes the class itself.
- **Import Calendar** reads a calendar file (.ics):
  - **Apple Calendar on a Mac:** select the calendar, then File > Export > Export.
  - **Google Calendar:** Settings > Import & export > Export.
  - **Outlook:** File > Save Calendar.
- **What happens on import:**
  - Repeating classes stay repeating, so you can still move just one week.
  - Appointments and other events go on the Schedule.
  - Exams, quizzes and anything due become tasks.
  - Course codes like "CHEM 110" are matched to your courses, or added as new courses if you tick them.
  - Importing the same file again updates what's already there instead of adding copies.
  - Things older than a month are left out unless you ask for them.
- Events sync to your other devices like everything else and are included in backups.

## Daily Quote and Streak Rewards

- **Daily quote:** the first time you open Studyboard each day, a short motivational quote pops up with your streak. Turn it off in Settings with **Daily Quote**, or see today's again from **Today's Quote and Streak**.
- **Progress streak:** every day you make progress, your streak grows. Progress means completing a task, moving one from To Do to In Work, raising its progress, or ticking a checklist item. The 🔥 count sits next to the date on the Board.
- **Rewards:** every 10 days in a row earns one Pro sticky note shape, sticker pack or flashcard style, picked at random from ones you don't have yet. It's added to your collection and stays yours when Studyboard Pro arrives. Everything is free during early access. Missing a day starts the streak over.

## Style Shop

Open **Style** in the sidebar (or Settings → Style Shop on a phone).
- **Themes:** 60 themes, each with a light and a dark version that follow your Appearance setting (System, Light or Dark).
  - Free plain colors: Classic, Plain Paper, Slate, Sand, Blush, Lavender, Sky, Sage, Peach, Butter, Teal, Mocha, Plum and Indigo.
  - Pro seasons: Winter, Spring, Summer and Autumn Leaves.
  - Pro new scenes: Balloon Festival, Koi Pond, Rainy Window, Alpine Lake, Desert Dunes, Jellyfish Drift, Bamboo Grove, Lavender Fields and City Rooftops.
  - Pro scenes: Ocean Waves, Sakura, Evergreen, Galaxy, Northern Lights, Lemonade, Christmas Lights, Cozy Café, Sunset Beach, Mint Chip, Colorful Bokeh, Neon Dusk, Candy Land and Synthwave.
  - Pro cozy and hobby themes: Cozy Cats, Music Room, Reading Nook, Knitting Nook, Art Studio, Bake Shop, Garden Plot, Game Night and Photo Walk.
  - Pro holiday themes: New Year's Eve, Lunar New Year, Valentine's Day, St. Patrick's Day, Easter, Fourth of July, Halloween, Thanksgiving, Hanukkah and Diwali.
  - Every theme except the plain colors is a full scene that fills the whole background, drawn for your screen's real shape, so it fills a tall phone as well as a wide monitor.
- **Note board size:** the board fills its frame with no scroll bars. Drag a note past the edge and the board grows, with scroll bars, so there's always room for more.
- **Theme Collections:** every scene theme has its own sticker pack (8 stickers), 2 pins and a flashcard style: 528 stickers, 132 pins and 66 flashcard styles in all. They work with any theme. In the Style Shop, the Flashcards, Pins and Stickers tabs each have a **Theme Collections** section with your current theme's set first. The sticker envelope on the Notes board opens your theme's pack, and **Theme Packs** in the envelope switches to any other. When you edit a note, the pin menu lists every theme's pins by theme.

  | Theme | Sticker Pack | Pins | Flashcard Style |
  |---|---|---|---|
  | Winter | Frost and Flurries | Ice Crystal, Fair Isle Tape | Frosted Pane |
  | Spring | Meadow Friends | Tulip Pin, Gingham Washi | Tulip Border |
  | Summer | Sandy Toes | Beach Ball, Cabana Stripe | Shoreline |
  | Autumn Leaves | Harvest Glow | Amber Maple, Wooden Peg | Golden Hour |
  | Ocean Life | Making Waves | Glass Float, Wave Washi | Tide Line |
  | Sakura | Hanami Day | Petal Washi, Kanzashi Pin | Hanami Washi |
  | Evergreen | Quiet Woods | Firefly Glow, Pine Washi | Misty Ridge |
  | Galaxy | Stardust Dreams | Moon Pin, Starry Night Tape | Stargazer |
  | Northern Lights | Aurora Nights | Aurora Ribbon, Frost Peg | Aurora Frost |
  | Lemonade | Sunny Squeeze | Lemon Wheel Magnet, Lemon Stripe Tape | Lemon Stand |
  | Christmas Lights | Twinkle Lights | Glass Bauble, Twinkle String Tape | Twinkle Lights |
  | Cozy Café | Café Corner | Coffee Bean Pin, Coffee Stamp Tape | Coffee Sleeve |
  | Sunset Beach | Golden Hour Shore | Sunset Bead, Starfish Washi | Beach Postcard |
  | Mint Chip | Mint Chip Parlor | Mint Chip Magnet, Mint Chip Washi | Chocolate Drizzle |
  | Colorful Bokeh | Dreamy Glow | Glass Orb, Light Dot Washi | Soft Focus |
  | Neon Dusk | Neon Nights | Neon Ring Tack, Neon Paperclip | Shop Window |
  | Candy Land | Sweet Shoppe | Pinwheel Mint, Sprinkle Washi | Candy Stripe |
  | Synthwave | Retro Wave | Retro Sun Pin, Sunset Stripe Tape | Retro Grid |
  | Cozy Cats | Kitty Corner | Kitty Magnet, Paw Print Washi | Catnap |
  | Music | Recital Day | Treble Clef Clip, Piano Key Tape | Recital Program |
  | Reading Nook | Bookworm Club | Wax Seal, Bookmark Ribbon | Book Page |
  | Knitting Nook | Cozy Stitches | Wooden Button, Knit Stitch Tape | Knit Swatch |
  | Art Studio | Paint Party | Paint Splat Pin, Paintbrush Clip | Watercolor Wash |
  | Bake Shop | Fresh From the Oven | Cherry Charm, Sprinkle Tape | Pink Icing |
  | Garden Plot | Potting Bench | Terracotta Charm, Ivy Washi | Ivy Trellis |
  | Game Night | Power Up Pals | Arcade Button, Pixel Heart Tape | Pixel Quest |
  | Photo Walk | Snapshot Club | Darkroom Peg, Film Strip Tape | Contact Sheet |
  | New Year's Eve | Midnight Sparkle | Gold Star Pin, Confetti Ribbon | Midnight Fireworks |
  | Lunar New Year | Lantern Luck | Plum Blossom Pin, Red Paper Tape | Red Paper Gold |
  | Valentine's Day | Sweetheart Post | Candy Heart Pin, Lace Ribbon | Love Letter |
  | St. Patrick's Day | Pot o' Luck | Shamrock Button, Rainbow Washi | Rainbow's End |
  | Easter | Egg Hunt | Speckled Egg, Carrot Peg | Bunny Peek |
  | Fourth of July | Star Spangled Picnic | Star Pin, Stripe Tape | Firework Night |
  | Halloween | Pumpkin Patch Spooks | Jack Pin, Bat Washi | Pumpkin Glow |
  | Thanksgiving | Harvest Friends | Maple Leaf Magnet, Flannel Plaid | Harvest Plaid |
  | Hanukkah | Festival of Lights | Star of David Pin, Garland Ribbon | Festive Garland |
  | Diwali | Diya Delight | Diya Charm, Rangoli Washi | Rangoli Glow |
  | Balloon Festival | Up and Away | Balloon Pushpin, Bunting Tape | Morning Drift |
  | Koi Pond | Pond Pals | Lily Pad Magnet, Ripple Washi | Lily Pond |
  | Rainy Window | Cozy Rainy Day | Raindrop Pin, Umbrella Clip | Misty Window |
  | Alpine Lake | Mountain Trail | Trail Compass, Peak Washi | Trail Postcard |
  | Desert Dunes | Dune Wanderers | Desert Compass, Dune Washi | Sand Ripple |
  | Jellyfish Drift | Glow Drifters | Glow Pearl, Jelly Washi | Sunlit Shallows |
  | Bamboo Grove | Grove Friends | Bamboo Peg, Leaf Washi | Bamboo Scroll |
  | Lavender Fields | Lavender Lane | Lavender Seal, Gingham Ribbon | Pressed Lavender |
  | City Rooftops | Rooftop Nights | Moon Magnet, Brick Tape | City Lights |
- **Living scenes and scene moments:** every scene moves gently (at a relaxed, Balanced pace) and has its own little scene moment, played by the scene itself. The moment plays for bigger wins: when a **Focus timer session** ends (after you close the timer's alert), when you finish a **flashcard study session or a quiz**, and when you tick off the **last task on Today's Plan** (the task's pop-up plays first, then the scene moment). You can also watch it any time with **Play Scene Moment** at the top of the Style Shop's Themes tab, in Settings, or by searching for it. The scenes run at about 30 frames a second, rest while a task pop-up is playing, pause when Studyboard is hidden or your battery is low (under 20% and not charging), and stay still if your computer is set to reduce motion (you then get a short, gentle version of the scene moment). Here's what each one does:
  - **Balloon Festival:** Balloons drift slowly upward and sway, and their burners flicker at night. Scene moment: A new balloon lifts off from behind the hills with a burst of burner flame.
  - **Koi Pond:** Koi swim slow loops under the lily pads and ripples spread across the water; move your pointer over the pond and they swim away from it. Scene moment: The koi gather and circle together in the open water, then drift apart.
  - **Rainy Window:** Raindrops slide down the glass one at a time, picking up smaller drops and leaving trails, while new drops keep landing. Scene moment: A clear streak wipes across the glass, then the rain slowly fills it back in.
  - **Alpine Lake:** A rowboat drifts across the lake leaving soft rings, light glints slide over the water and reeds sway. Scene moment: The peaks blush pink with alpenglow while a V of geese flies over, mirrored in the lake.
  - **Desert Dunes:** The camel caravan plods along the dune crest and wisps of sand blow off the ridges. Scene moment: A fennec fox pokes its big ears over a dune, looks around with a blink and ducks back down.
  - **Jellyfish Drift:** The jellyfish pulse their bells and drift slowly upward, tentacles trailing. Scene moment: A sea turtle glides by, and each jellyfish it passes glows brighter.
  - **Bamboo Grove:** The bamboo sways gently and loose leaves tumble down through the grove. Scene moment: A little panda climbs a stalk, waves hello and slides back down.
  - **Lavender Fields:** A breeze rolls across the lavender rows, with butterflies by day and fireflies at dusk. Scene moment: A gust sends a straw hat cartwheeling across the field.
  - **City Rooftops:** The string lights sway and twinkle, chimneys puff smoke and windows light up one by one at night. Scene moment: A window lights up and a paper plane glides out, loops over the street and lands on a rooftop.
  - **Winter:** Snow blows across the valley in soft gusts and the chimney smoke bends with the wind. Scene moment: The snowman tips his top hat to you and waves.
  - **Spring:** Butterflies flutter over the tulips and land on the flowers while the windmill turns. Scene moment: All the butterflies lift off together, twirl in a ring dance and settle on new flowers.
  - **Summer:** The surf washes in and out, boats cruise along the shore and little crabs scuttle on the sand but never into the sea. Scene moment: A sea turtle nest hatches and three baby turtles scurry down the beach into the sea.
  - **Autumn Leaves:** Maple and oak leaves tumble down and gusts sweep them sideways. Scene moment: A little whirlwind of leaves spins up from the path and dances away.
  - **Ocean Waves:** Swells roll in, sailboats bob, fish leap out of the water, gulls circle and at night the lighthouse beam turns. Scene moment: A whale surfaces and blows a sparkly spout with a tiny rainbow, then waves its tail as it dives.
  - **Sakura:** The blossom branch sways and petals drift down onto the lake. Scene moment: A little white-eye bird lands on the branch and the buds around it pop open.
  - **Evergreen:** Mist drifts through the pines, birds glide by day and fireflies wander at night. Scene moment: A ring of red-capped mushrooms pops up one by one with a soft glow.
  - **Galaxy:** Stars twinkle, the Big Dipper glimmers and shooting stars streak across the sky. Scene moment: The Big Dipper lights up star by star, then tips its bowl and pours out glittering stardust.
  - **Northern Lights:** The aurora ripples and shimmers, and the cabin's chimney smoke curls in the breeze. Scene moment: A bright wave of aurora sweeps across the sky and the cabin puffs three little smoke rings.
  - **Lemonade:** The lemon garland sways, the lemonade fizzes and bubbles float up. Scene moment: A ripe lemon drops, bounces off the awning and lands in the crate.
  - **Christmas Lights:** Snow falls softly while the tree and string lights slowly brighten and dim. Scene moment: The tree lights race upward, the star blooms and the snowman tips his hat.
  - **Cozy Café:** Soft ribbons of steam curl up from both cups and bend with a changing breeze. Scene moment: A curl of steam loops into a heart and floats away.
  - **Sunset Beach:** Waves slide up the sand, the sun path glitters, gulls glide and crabs scuttle on the sand. Scene moment: A bigger wave leaves a shiny pink shell, and the nearest crab hurries over and does two happy hops.
  - **Mint Chip:** The mint sprigs sway and loose leaves drift down over the hills. Scene moment: A big silver spoon swoops in and scoops a round scoop of mint chip.
  - **Colorful Bokeh:** The colored light orbs drift and gently brighten and dim. Scene moment: The lens pulls focus in a soft wave, turning each orb into a tiny twinkling star.
  - **Neon Dusk:** The neon tubes ripple and the shop signs hum brighter and dimmer. Scene moment: A spark races along the tube and wakes up each sign, and the check mark draws its tick.
  - **Candy Land:** Sprinkles drift down and the big lollipop swirls turn slowly. Scene moment: A gumdrop hops along the candy path, lighting up each stepping stone.
  - **Synthwave:** The sun's stripes glide down and the glowing grid rolls toward you. Scene moment: A little neon car cruises down the grid into the sunset.
  - **Cozy Cats:** The tabby swishes her tail and pats the yarn, and the window cat breathes softly as she naps. Scene moment: The tabby swats the yarn ball across the floor, then catches it as it rolls back.
  - **Music Room:** Notes bob along the staff and drift up, and the metronome ticks. Scene moment: The piano plays a run up the keys and notes flutter onto the staff.
  - **Reading Nook:** Steam curls from the tea and the ribbon bookmark sways. Scene moment: The top book floats up, riffles through its pages and settles back down.
  - **Knitting Nook:** The bunting sways and the yarn strands drift across the floor. Scene moment: The needles pop out and knit a little swatch, row by row.
  - **Art Studio:** Clouds drift past the window, dust motes float in the light and the lamp sways. Scene moment: A brush hops out of the jar and paints a little rainbow on the canvas.
  - **Bake Shop:** The bunting flutters, the cake turns slowly on its stand and the cherry bobs. Scene moment: A birthday candle pops up on the cake, lights with a warm glow and puffs out.
  - **Garden Plot:** The hanging planters sway and butterflies land on the flowers (moths at night). Scene moment: The watering can tips over the seed tray and a new flower blooms.
  - **Game Night:** Coins spin in turn, the star twinkles and the platforms bob. Scene moment: The star power-up bounces along collecting every coin, and a bonus heart pops into the HUD.
  - **Photo Walk:** The prints sway on their line and soft bokeh lights drift. Scene moment: The camera flashes and a new print flutters up to the line and develops.
  - **New Year's Eve:** Fireworks in gold, rose, teal and violet bloom and fade over the skyline. Scene moment: The clock tower lights up like a countdown and launches a big rainbow firework.
  - **Lunar New Year:** The red lanterns sway and glow and plum petals drift over the lake. Scene moment: A magpie, a sign of good luck, lands on the plum branch and shakes loose some petals.
  - **Valentine's Day:** Heart balloons float up and sway, and tiny hearts drift up from the garden. Scene moment: Two heart balloons drift together, glow like a heartbeat and float off as a pair.
  - **St. Patrick's Day:** Shamrocks twirl through the air and a shimmer slides along the rainbow. Scene moment: One shamrock grows a lucky fourth leaf and spins in a golden glow.
  - **Easter:** Butterflies rest on the tulips and the painted eggs wobble now and then. Scene moment: An egg cracks open and a fluffy chick peeks out and flaps its wings.
  - **Fourth of July:** The flag stripes ripple, the stars twinkle and sailboats drift. Scene moment: A rocket bursts into a red, white and blue star firework over the lake.
  - **Halloween:** The jack-o'-lanterns flicker like candles and bats flap across the sky. Scene moment: The biggest jack-o'-lantern flares up and two bats flutter out of the tree.
  - **Thanksgiving:** Leaves tumble on the breeze and the turkey bobs its head. Scene moment: An apple rolls out of the cornucopia to the turkey, who fans its tail proudly.
  - **Hanukkah:** The eight candles and the shamash flicker and snow drifts past the window. Scene moment: The dreidel spins, lands on gimel, and a gold gelt coin drops onto the stack.
  - **Diwali:** The brass lanterns sway and every diya flame flickers. Scene moment: A marigold drifts into the rangoli and the ring of diyas brightens one by one.
- **Animation switches:** Settings has **Background Animations** and **Completion Animations** switches, so you can turn either off if it gets distracting. Background Animations is also at the top of the Style Shop's Themes tab.
- **Theme kits:** each artwork theme also brings its own default flashcard design in the theme's colors, sticky note colors, note shape and pin (scalloped notes with washi tape for Sakura, torn notes with tape for Evergreen, hearts for Candy Land and so on), plus button and add-button shapes to match. Your note shape and pin stay the same when you switch themes. To have them change with every theme, choose **Always Match Theme** in the shop's Note Shapes or Pins tab. The flashcard design follows the theme until you pick your own. A style you give one deck or one note always stays. Pins and tape are placed to sit on round, heart and cloud notes too.
- **Plain color themes** have the same faint notebook grid as Classic, tinted to match.
- **Light mode** is toned slightly softer than pure white on every theme except Plain Paper, and the sidebar's buttons have the same strong contrast in light and dark.
- **Task pop-ups:** finishing a task plays a quick pop-up in front of the page. Classic and the plain colors keep the confetti (dragging a task to Complete) and fireworks (ticking a task off). Every other theme has its own: light bulbs for Christmas Lights, bubbles for Ocean Waves, petals for Sakura, snowflakes for Winter, butterflies for Spring, coffee beans and steam for Cozy Café, neon rings for Neon Dusk and so on. The new scenes have theirs too: balloons lifting off (Balloon Festival), koi and ripples (Koi Pond), rain and colorful umbrellas (Rainy Window), alpine flowers and snowflakes (Alpine Lake), a gust of sand under twinkling stars (Desert Dunes), glowing jellyfish and bubbles (Jellyfish Drift), tumbling bamboo leaves (Bamboo Grove), lavender sprigs and butterflies (Lavender Fields) and paper planes (City Rooftops).
- **What the switches do:** **Completion Animations** turns off both the task pop-ups and the automatic scene moments. **Background Animations** stops the scene's movement and its automatic moments (Play Scene Moment still works when you ask for it). With reduced motion turned on in your computer's settings, pop-ups are lighter and scene moments are short and gentle.
- **Flashcard styles:** Match Theme, Index Card, Clean and Graph Paper (free); Holographic, Neon, Chalkboard, Blueprint, Parchment, Polaroid, Ticket, Kraft Paper and Pastel Dream (Pro). Pick one for all decks, or give a deck its own under Edit Deck.
- **Sticky note shapes:** Square and Rounded (free); Torn Edge, Dog-Eared, Lined Paper, Graph Paper, Speech Bubble, Circle, Heart, Cloud and Scalloped (Pro).
- **Pins:** chosen separately from the shape, so any pin works with any shape. Red Pin, Clear Tape, Staple and No Pin (free); Gold Pushpin, Heart Pin, Star Pin, Washi Dots, Washi Stripes, Corner Tape, Paperclip, Binder Clip and Magnet (Pro). Pick defaults in the shop, or change one note's shape and pin while editing it.
- **Stickers:** 122 stickers in 15 packs. Free: Basics and Labels (simple flat shapes and tags). Pro: Cute Shapes, Study Buddies, Animal Friends, Snack Time, Outer Space, Ocean Life, Garden, Dino Pals, Fantasy, Kawaii Faces, Music, Holidays and Weather.
- **Sticker envelope:** on the Notes page, the Stickers envelope sits beside the board (on a phone, tap **Stickers** at the bottom to open it). Pick a pack along the top, then drag a sticker onto any note and drop it where you want it. It stays in that spot when you move the note. Drag it to another note to move it, drag it off onto the board to remove it (Undo brings it back), and tap it to change its size.

Your choices sync to your other devices. Everything is free during early access; items marked PRO are ready to go behind a paywall later.

## Welcome Tour

The first time Studyboard opens on a device with an empty planner, a short welcome tour helps you set up in about two minutes: add your courses (or import a syllabus), pick a theme, set your study hours, turn on reminders, set up the free AI, and install the app. Every step can be skipped.

There's nothing to set up for it. A few things to know:

- **With Supabase**, the tour waits until you've connected and signed in, and only shows if your account has nothing in it yet. If you sign in on a new phone to an account that already has your courses, you won't see it.
- **It shows once per device.** Closing it early counts too, so it won't keep popping up.
- **Want to see it again?** Open **Settings** and choose **Replay Welcome Tour**.

## App Tour

New people get a short guided tour (a spotlight and a card for each main tab and control, with Back, Next, Skip and progress dots; arrow keys and Esc work too). It shows once per device, right after the welcome setup above is finished or closed, and never on its own for anyone who already has courses or tasks. Open **Settings** and choose **Take the App Tour** to see it again (it's also in Search Everywhere). If a tab or control isn't on screen (for example Groups on a phone), that step is skipped.

## Bug Reports and Feedback

Settings has **Report a Bug or Send Feedback** (also in Search Everywhere). People pick a category, describe what happened, can add steps and a screenshot, and can tick a box to let you email them. Studyboard attaches only technical details: app version, browser and screen size, current page, plan and recent error messages, never their tasks, notes or files. It works signed in or signed out. If the person is offline, the report is kept on their device and sent when they're back online.

### One-time setup

1. In Supabase, open **SQL Editor > New query**, paste all of `supabase-bug-reports.sql` and click **Run**. It is safe to run again.
2. That's it. Reports can now be sent by anyone using the app, but only you can read them (the app has no way to read, change or delete reports). Each device or account is limited to 5 reports an hour, and 200 an hour overall.

### Reading your reports

- **Table Editor:** open **Table Editor > bug_reports**. Newest first; sort by `created_at`. `diagnostics` holds the version, browser and recent errors.
- **SQL Editor:** run `select * from public.bug_reports_inbox limit 50;` for a tidy list (no screenshots). To see one screenshot, run `select screenshot from public.bug_reports where id = '...';` and paste the value into a browser address bar.
- **Mark one handled:** `update public.bug_reports set status = 'fixed' where id = '...';`

### Getting an email or chat message for each report (optional)

In Supabase open **Database > Webhooks > Create a new hook**, pick the `bug_reports` table and the **Insert** event, and point it at a URL that forwards the message: a Slack or Discord incoming webhook, a Zapier or Make "catch hook", or an Edge Function that sends you an email. The new row (category, message, version, and the contact email if they gave one) is in the webhook body.

### Without Supabase

If your copy of Studyboard has no server, reports can't be delivered. They stay saved on the device and the form says so.

## Calendar Sync (Apple, Google and Outlook Calendar)

Studyboard can put your deadlines, exams, quizzes, class times and events into the calendar app you already use. Open **Settings > Calendar Sync**, or **Calendar Sync** at the top of the Schedule. There are two ways:

- **Live Link:** your calendar app subscribes to a private link and keeps itself up to date. This needs a one-time setup in Supabase (about 5 minutes, below).
- **Download a File:** a one-time calendar file (.ics). It works everywhere, even in local-only mode, but it doesn't update when you change things in Studyboard.

### What goes into your calendar

- **Deadlines** with a due date, at their due time (or as an all-day item). Titles start with **Due**, **Exam** or **Quiz**, then the course code, like "Exam · BSNC 1120: Midterm exam". The room and a link back to Studyboard are included.
- **Class times** from each course, repeating every week between **Classes From** and **Classes Until**. Classes you skipped or moved for one week on the Schedule are skipped or moved in your calendar too.
- **Your events** from the Schedule, including ones that repeat every week or every 2 weeks, and any weeks you skipped or moved.
- **Reminders:** by default they match your Studyboard reminder settings. You can pick a different timing, or none.
- Under **What to Include** you can leave out courses, classes, events, events you imported from another calendar, and completed tasks.

### One-time setup for the Live Link

You need the two files that came with this update: `supabase-calendar-feed.sql` and `supabase-functions/calendar-feed/index.ts`. Everything happens on the Supabase website. No command line needed.

**1. Create the table**
In Supabase, open **SQL Editor**, then **New query**. Open `supabase-calendar-feed.sql`, copy everything into the editor and click **Run**. You should see *Success. No rows returned*. This makes a small table for your private calendar links, locked so only your account can see or change yours.

(In Studyboard, **Calendar Sync > Live Link** also has a **Copy Setup SQL** button. Use the file if they differ: the file is newer.) The function finds your link by a SHA-256 fingerprint of its private code (`token_hash`), which the database fills in by itself. If you update the calendar-feed function, run `supabase-calendar-feed.sql` again so older links get their fingerprint.

**2. Add the calendar function**
- In the left sidebar open **Edge Functions**.
- Click **Deploy a new function**, then **Via Editor**.
- Delete the sample code in the editor. Open `supabase-functions/calendar-feed/index.ts`, copy everything and paste it in.
- At the bottom, set the function name to exactly `calendar-feed`.
- Click **Deploy function**. It takes a few seconds.

**3. Turn off Verify JWT (important)**
Calendar apps can't sign in to your account, so this function has to accept calls without a sign-in. The long private code in your link is what keeps your calendar safe.
- In **Edge Functions**, click **calendar-feed**, then open its **Details** tab.
- Turn **off** the switch called **Verify JWT** (it may be called **Enforce JWT Verification**).
- Click **Save changes**.

The function reads your data with your project's service role key, which Supabase gives every Edge Function automatically. You don't copy or paste any keys.

**4. Turn it on in Studyboard**
Open **Settings > Calendar Sync > Live Link** and click **Turn On Live Calendar**. You'll see *Your link is working*. If you see a message about the function instead, check steps 2 and 3, then click **Check Again**.

### Add the link to your calendar app

Use the buttons under your link:

- **Add to Apple Calendar** opens Calendar on your iPhone, iPad or Mac and asks to subscribe. On a Mac you can pick how often it refreshes (every 15 minutes is fine).
  If nothing opens, copy the link, then in Calendar choose **File > New Calendar Subscription** and paste it. On iPhone: **Settings > Apps > Calendar > Calendar Accounts > Add Account > Other > Add Subscribed Calendar**.
- **Add to Google Calendar** opens Google Calendar in your browser. Click **Add**. Do this on a computer or in a phone's browser, since the Google Calendar app can't add links. After that, the calendar shows up in the app too.
  If it doesn't work, open Google Calendar on a computer, click **+** next to *Other calendars*, choose **From URL** and paste the link.
- **Add to Outlook** opens Outlook.com. For a school or work Microsoft account, use the **Use this link instead** link under the buttons. In Outlook on a computer you can also choose **Add calendar > Subscribe from web** and paste the link.

### How updates work

- Your calendar app checks the link on its own schedule, so changes show up a little later, not instantly.
- **Apple Calendar:** as often as you choose. **Outlook:** every few hours. **Google Calendar:** every several hours, sometimes up to a day. That's Google's timing and can't be sped up.
- The Studyboard calendar is read-only in your calendar app. Make changes in Studyboard.
- Calendar Sync shows when a calendar app last checked your link.

### Keep your link private

Anyone who has the link can see your calendar (but can't change anything). If it gets shared by mistake, click **Reset Link**: the old link stops working right away. Then add the new link to your calendar apps again and remove the old Studyboard calendar there. **Turn Off** stops the link completely.

### If something isn't working

| What you see | What to do |
|---|---|
| "One-Time Setup Needed" in Studyboard | Do steps 1 to 3 above, then click **Check Again**. |
| "Almost There: Turn Off Verify JWT" | Step 3: turn off **Verify JWT** for calendar-feed and save. |
| "Your Link Can't Be Reached Yet" | Make sure the function is named exactly `calendar-feed` and is deployed (step 2), and that Verify JWT is off (step 3). |
| Your calendar app says the link isn't found | The link was reset or turned off. Copy the current link from Calendar Sync. |
| Changes don't show up | Wait for your calendar app's next refresh (Google can take a day). In Apple Calendar on a Mac, right-click the calendar and choose **Refresh**. |
| Times are an hour off | Check that your computer or phone is set to the right time zone, then change any option in **What to Include** once so the link picks up your time zone. |

In local-only mode, or when using Studyboard inside Claude, the Live Link isn't available. **Download a File** still works: open the file in Apple Calendar or Outlook, or in Google Calendar go to **Settings > Import & export**.

## Reminders and Notifications

Studyboard can remind you before things are due, give you a Morning Summary, nudge you on study days, tell you when flashcards are due, and stay quiet at night. Open **Settings > Reminders and Notifications** to choose what you get and when.

There are three ways reminders reach you:

- **While Studyboard is open** (any device): click **Turn On Notifications** in Reminders and Notifications and allow them when your browser asks. Reminders pop up even when Studyboard is in another tab. If you're looking at Studyboard, they show as a message at the bottom instead.
- **Desktop app, even with the window closed:** nothing to set up. The Windows and Mac app shows reminders as long as it's running in the notification area (Windows) or menu bar (Mac).
- **Phone and web, even with Studyboard closed:** your Supabase project sends them. This needs the one-time setup below, about 10 minutes.

**Using Studyboard without an account (local-only)?** Then only the first two work: reminders while Studyboard is open, and the desktop app. Phone notifications with Studyboard closed need your Supabase connection.

**Change one task's reminder:** open the task, then **Advanced Settings > Reminder**. Pick a time, or **No Reminder**. **Default** follows your settings.

### Set up phone notifications (once)

You'll need two files that came with this update: `supabase-reminders.sql` and `supabase-functions/send-reminders/index.ts`. Everything happens in the Supabase dashboard and in Studyboard. No command line.

**1. Add the reminder tables**
In Supabase open **SQL Editor**, then **New query**. Paste everything from `supabase-reminders.sql`. Near the top are two lines marked **PASTE**:
- Replace `PASTE_YOUR_PROJECT_URL_HERE` with your Project URL, like `https://abcdefgh.supabase.co`
- Replace `PASTE_YOUR_PUBLISHABLE_KEY_HERE` with your publishable key (starts with `sb_publishable_`; older projects use the **anon** key)

These are the same two values you pasted into Studyboard when you first connected. Keep the quotes around them. Click **Run**. You should see *Success. No rows returned*. If you see "Paste your Project URL...", a value is still missing. It's safe to run again.

This adds a list of your devices and a list of upcoming reminders (only your account can see them), and a schedule that checks for due reminders every 5 minutes. Your two values are kept encrypted in Supabase Vault.

**2. Make your keys** (in Studyboard)
Open **Settings > Reminders and Notifications > Set Up Phone Notifications** and click **Make Keys**. Studyboard shows three values. Leave that screen open.

**3. Add the keys to Supabase**
In Supabase open **Edge Functions**, then **Secrets**. Add three secrets, copying each value from Studyboard with its **Copy** button:
- Name `VAPID_PUBLIC_KEY`, value: the Public Key
- Name `VAPID_PRIVATE_KEY`, value: the Private Key
- Name `VAPID_SUBJECT`, value: the Contact (it starts with `mailto:`)

Click **Save**. Copy the private key now: Studyboard doesn't keep it. If you lose it, click **Make New Keys**, update all three secrets, and turn notifications on again on each device.

**4. Add the send-reminders function**
Still in **Edge Functions**, click **Deploy a new function**, then **Via Editor**. Name it exactly `send-reminders`. Delete the sample code, paste everything from `supabase-functions/send-reminders/index.ts`, and click **Deploy function**.
Then open the function's **Details** and turn **off** the **Verify JWT** switch (it may be called *Enforce JWT Verification*), and save. The 5-minute schedule and the Snooze and Mark Done buttons don't sign in, so they need this off. It's still safe: sending only happens when the call carries the schedule secret, each Snooze or Mark Done button carries its own random code that works for that one reminder only, and notifications only ever go to the real push services (Google, Mozilla, Microsoft and Apple).

The schedule secret needs nothing from you: `supabase-reminders.sql` makes it (a long random value kept in Vault as `studyboard_cron_secret`), the 5-minute schedule sends it in an `x-studyboard-cron` header, and the function checks it with the database. If you update the function from an older version, run `supabase-reminders.sql` again too (with your two PASTE values), or the function answers the schedule with "Not allowed" and nothing is sent. Optional: to check the secret without asking the database, copy it (`select decrypted_secret from vault.decrypted_secrets where name = 'studyboard_cron_secret';` in the SQL Editor) into an Edge Function secret named `REMINDERS_CRON_SECRET`. To change it, delete the `studyboard_cron_secret` row in **Vault**, run `supabase-reminders.sql` again, and update `REMINDERS_CRON_SECRET` if you set it.

**5. Turn it on for each device**
On each phone or computer you want reminders on, open Studyboard, go to **Set Up Phone Notifications**, click **Turn On for This Device**, and allow notifications. Then click **Send a Test Now**. A test notification should arrive within a few seconds.

**iPhone and iPad:** notifications only work in the Home Screen app (iOS 16.4 or newer). In Safari tap **Share**, then **Add to Home Screen**, open Studyboard from the new icon, and do step 5 there.

### Good to know

- Reminders by phone arrive within about 5 minutes of their time, since your Supabase checks every 5 minutes.
- Studyboard updates the list of upcoming reminders (the next 14 days) whenever you use it on any device. If you change a due date on your laptop, your phone gets the new time.
- **Snooze 1 Hour** and **Mark Done** appear on the notification on Android, Windows, Mac and Chrome. iPhone doesn't show these buttons; tap the notification to open the task.
- A reminder that's already shown on a device that has Studyboard open isn't sent again by phone.
- If your Supabase project is paused, phone reminders stop until it's running again. The keep-awake ping from Part 2 of the setup prevents this.
- Each account can have up to 10 devices; turning notifications on for an 11th replaces the one that hasn't checked in for the longest time.
- **Not arriving?** Check that the three secrets are spelled exactly as above, that **Verify JWT** is off, that you ran `supabase-reminders.sql` after your last update of the function (Logs show "Not allowed" otherwise), and that notifications are allowed for Studyboard in your phone's settings. In Supabase, **Edge Functions > send-reminders > Logs** shows each run, and **Integrations > Cron** shows the 5-minute schedule.
- **Turn it off on a device:** Set Up Phone Notifications, then **Turn Off Here**.

## Widgets and Shortcuts

Studyboard 1.11 can show your day without opening the whole app. What you get depends on the device. Settings, then **Widgets and Desktop**, shows what works on the device you're using.

### The files to upload (one time)

Upload these to your GitHub repository, next to `index.html`, along with the new `index.html` and `sw.js`:

- `manifest.webmanifest` (replace the old one) and the new `today.webmanifest`
- the `icons` folder (it has four new small icons for the shortcuts)
- the new `widgets` folder (`today-template.json`, `today-data.json` and `today-screenshot.png`)
- the `desktop` folder, if you build the desktop app from GitHub

Then open your Studyboard site once while online, so your phone or computer picks up the new version.

### On the Windows or Mac desktop app

The desktop app now has three extras.

**Tray icon.** Studyboard puts an icon in the Windows notification area (bottom right, you may need the little ^ arrow) or the Mac menu bar. Click it (right-click on Windows) for **Open Studyboard**, **Quick Add Task**, **Show Today Widget**, **Pause Reminders for 1 Hour** and **Quit Studyboard**.

**Keeps running in the background.** Closing the Studyboard window now hides it instead of closing it, so reminders and the widget keep working. To close Studyboard all the way, choose **Quit Studyboard** from the tray icon. Don't like that? Turn off **Keep Running in the Background** in Settings, Widgets and Desktop.

**Start when you sign in.** Turn on **Start When I Sign In to My Computer** in the same place. Studyboard then starts quietly in the tray each time you sign in, ready with your reminders, without opening its window.

**Today widget.** Choose **Show Today Widget** from the tray icon or in Settings. It's a small window with **Do This Next**, today's list with checkboxes, the flashcards due for review, and your streak, in your current theme's colors (light and dark).

- Drag it by the top to move it, and drag its edges to resize it. It remembers where you put it.
- The pin button keeps it on top of other windows. Click it again to let it go behind.
- Tick a task to mark it done. It's changed in Studyboard itself, so it syncs, and you can undo it in Studyboard.
- Click a task to open it in Studyboard, or click **Today** at the top to open Studyboard.
- The × hides the widget. Bring it back from the tray icon.

**Reminders.** Studyboard's reminders appear as normal Windows or Mac notifications, even with the window closed, and after a restart. Each reminder shows once. If your computer was off or asleep, reminders from the last 6 hours still show when it wakes up; older ones are skipped. **Pause Reminders for 1 Hour** holds them back, and anything that came up during the pause is shown when the pause ends. If no notifications appear on Windows, check Settings > System > Notifications and make sure Studyboard is allowed. On a Mac, check System Settings > Notifications > Studyboard.

### On your phone

**Today icon.** Studyboard can open straight to a small Today card: Do This Next, today's list with checkboxes, flashcards due and your streak. To give it its own Home Screen icon:

1. In Studyboard, open Settings, then **Widgets and Desktop**, then **Open Today View**. (Or go to your Studyboard address with `?widget=today` at the end, like `https://USERNAME.github.io/studioso/?widget=today`.)
2. On an **iPhone**, tap **Share**, then **Add to Home Screen**. On **Android**, open Chrome's menu and choose **Add to Home screen** (or **Install**).

It's called **Today** on your Home Screen and uses your current theme.

**Shortcuts.** Once Studyboard is installed on Android, press and hold its icon for **Quick Add**, **Today**, **Focus Timer** and **Search**. (On Windows, right-click the installed app's icon in the Start menu or taskbar for the same list.) iPhone doesn't offer these shortcuts for websites yet, so use the Today icon instead.

**About real phone widgets.** True Home Screen widgets on iPhone and Android, the kind that sit on the Home Screen and update by themselves, can only come from a native app installed from the App Store or Google Play. Studyboard doesn't have those apps yet, so the Today icon and the shortcuts are the closest thing for now.

### On a Windows 11 computer, in the Widgets board

If you install the Studyboard website as an app from **Microsoft Edge** (menu, then Apps, then Install Studyboard), Studyboard can also appear in the Windows 11 Widgets board:

1. Press **Windows + W** (or click the weather in the taskbar), then **Add widgets (+)**.
2. Pick **Studyboard Today** and choose **Pin**.

It shows Do This Next, up to five of today's tasks, flashcards due and your streak. It updates whenever Studyboard is open, and keeps showing the last update when it isn't. Click a task to open it, the circle next to it to mark it done, or **Quick Add** to add a task. If Studyboard Today isn't in the list, your Windows or Edge version doesn't support website widgets yet; everything else still works. This is separate from the desktop app's own Today widget, which works on any Windows or Mac computer.

## Search Everywhere

Press **Ctrl+K** (on a Mac, **⌘K**) anywhere in Studyboard, or tap the search button, to search everything at once: tasks, courses, flashcards and decks, sticky notes, events and class times, files, practice quizzes, and settings like "Import a Syllabus".

- Results show up as you type, grouped by kind, with the matching words highlighted. Small typos are fine ("digoxn" finds Digoxin).
- Use the chips to show only one kind (like **Files**), and the course menu to show only one course.
- On a computer, use the arrow keys to move and **Enter** to open. Opening a result takes you to the right place: the task opens, a deck or card opens on the Flashcards page, a note is highlighted on your Notes board, an event opens on its day in your Schedule.
- The old Board filter is still there: pick **Filter the Board** at the bottom of the results.

Nothing to set up for this part. It works offline and without an account.

### Searching inside your files

Search also finds words **inside** your PDFs, Word (.docx) and PowerPoint (.pptx) files, and text or Markdown files. For a PDF or slides it tells you the page or slide. Photos are searched by their AI summary if you made one.

Studyboard reads each file's text in the background, right after you upload it and the first time you open search, then keeps that text **on this device only** so later searches are instant. Each device reads the files once. You need to be signed in (or using the desktop app) so it can get your files. Scanned PDFs that are only pictures have no text to read.

You can turn this off, or clear the saved text and start over, in **Settings → Search Everywhere**.

### Ask With AI (search by meaning)

Switch search to **Ask With AI** and describe what you want in your own words, like "that slide about photosynthesis and light" or "when is my bio midterm". It finds the best matches by meaning, even if they use different words, and writes a short answer with numbered links to where it found it (for example "Week 3 Antihypertensives.pptx, slide 3"). Tap a number to open it.

This uses your **free Google Gemini key** (see AI Features above). There's nothing extra to set up:
- After you've used search, Studyboard quietly sends short pieces of your tasks, notes, flashcards, practice questions and file text to Gemini so it can "understand" them. This happens a little at a time in the background, only for things that are new or changed, and the results are saved on this device. With a lot of files the first time can take a while, and the footer of the search window shows how far along it is.
- It uses Google's free embedding model (gemini-embedding-2, or gemini-embedding-001 if your key doesn't have the newer one). If you hit the free limit it just pauses and picks up later.
- The short answer uses free Gemini too. If your only AI key is a paid one (Claude or ChatGPT), search asks you to tick "I understand" and confirm before it ever uses it for answers, and it asks again if you switch to a different paid model.

**Without a Gemini key**, Ask With AI still works: it looks for your words plus common abbreviations and synonyms (like calc and calculus, bio and biology, or BP and blood pressure), and offers **Set Up AI**.

## Share Decks and Study Groups

Share a flashcard deck with a link or a short code, or make a study group where classmates share decks, upcoming deadlines, quizzes, study sessions and a message board. It all runs through your own Supabase project, so it needs one extra piece of setup SQL. You'll need the file `supabase-groups.sql` that came with this update.

**1. Run the groups SQL (once)**
In Supabase, open **SQL Editor**, then **New query**. Open `supabase-groups.sql`, copy everything into the editor and click **Run**. You should see *Success. No rows returned*. It's safe to run again later if you're not sure it worked.

This adds the tables for shared decks, groups, members, shared items and messages, and turns on live updates for groups. It doesn't change your own data table at all.

**2. Share it with classmates**
Everyone who joins your group or opens your deck links uses the same Studyboard website you set up in Part 2, with their own account on your Supabase project. Send them the site address (`https://USERNAME.github.io/studioso/`) so they can create an account there first.

**3. Pick your name**
The first time you share or join, Studyboard asks what classmates should call you. Your first name is enough. You can change it on the **Groups** page.

### Sharing a deck
- Open a deck and tap **Share**, then **Create Link**. You get a link and a code like `K7P-4QD`. Tick **Include my practice quizzes** if you want your AI quizzes to go along.
- Anyone with Studyboard can open the link, or tap **Enter a Share Code** on the Flashcards page. They see a preview and tap **Add to My Flashcards** to get their own copy with fresh study progress.
- Changed the deck? Open **Share** again and tap **Update Shared Copy**. People who added it see **Get Update**, which adds the new cards and keeps their progress.
- **Stop Sharing** turns the link and code off. Copies people already added stay theirs.

### Project Tasks (new in 1.13)
Each group page has a **Project Tasks** section: shared task lists (for example "BIOL 201 Poster") with assignees, due dates, a progress bar, filters (All, Mine, Unassigned, Overdue, Done) and a per-person workload line that shows an uneven split. Anyone can add and edit tasks and mark them done, anyone can claim an unassigned task, and only the person a task is assigned to (or the group owner) can reassign it. Tasks assigned to you also appear under Today's Plan on your Board. A group keeps up to 20 active lists with up to 200 tasks each. To turn it on, run `supabase-groups.sql` again (it is safe to repeat), then `supabase-moderation.sql` again. Until then, the group owner sees a note saying to run it and other members see nothing. Run `supabase-plans-selftest.sql` afterwards to confirm the new tables and functions are locked down (section 9 covers them).

### Study groups
- Open **Groups** (in the sidebar on a computer, or from the Flashcards page or **Settings** on a phone) and tap **New Group**. Add a name and, if you like, a course.
- Tap **Invite Classmates** to send the invite link or code. They tap **Enter a Code** on the Groups page (or just open the link) and then **Join Group**.
- **Shared Decks:** tap **Share a Deck**. Members can **Study Now** or **Add Copy**.
- **Shared Deadlines:** tap **Share Deadlines**, pick a course and tick the tasks. Members tap **Add to My Board**. When you change one of your shared tasks, the group's copy updates on its own, and members see what changed with an **Update My Copy** button.
- **Message Board:** newest messages first, updated live. You can delete your own messages.
- The group owner can rename the group, make a new invite code, remove members and delete the group (**Edit Group**). Members can **Leave Group** any time.

### Without Supabase
In local-only mode (or before you connect), you can still share a deck as a file: open the deck, tap **Share**, then **Share as File**. Send the `.studyboard-deck.json` file any way you like. The other person taps **Import a Deck File** on the Flashcards page. This works between anyone, with or without an account.

### How your data is protected
| Question | Answer |
|---|---|
| Can group members see my tasks, notes or files? | No. Only what you choose to share is copied to the group. Your own data stays locked to your account. |
| Who can read a group? | Only its members. People outside the group can't list or open anything in it. |
| Can someone guess codes to find every shared deck? | No. Codes are only looked up one at a time, and there's no way to list shared decks or groups. |
| Who can change or delete things? | You can change or remove what you shared and delete your own messages. The group owner can remove anything in the group, remove members, or delete the group. |
| What if the owner deletes the group? | The group and its messages are gone for everyone, but copies people added to their own boards and flashcards stay. |

The desktop app uses the website address for share links. If a share sheet in the desktop app shows only a code, share a deck or send an invite once from the Studyboard website, and links appear in the app after that. The code always works on its own.

## Brightspace, Canvas and Blackboard

Studyboard can bring in everything from your school's learning platform on its own: **Brightspace** (D2L, like BCIT's Learning Hub), **Canvas** or **Blackboard Learn**. Assignments, quizzes, discussions and exams go on your Board and Timeline with their due dates, instructor calendar events go on your Schedule, and your grades go into the Grade Tracker. Open **Settings > Brightspace, Canvas and Blackboard**, or the **School Sites** button on the Courses page, and pick your platform. Using more than one? Connect each; they stay separate and nothing is added twice.

Studyboard only ever **reads** from these sites. It never submits, posts or changes anything there.

### Two ways to connect

**Sign In (desktop app, recommended).** Type your school's address (Brightspace is filled in as `learn.bcit.ca`; Canvas is usually like `yourschool.instructure.com`, Blackboard like `yourschool.blackboard.com`), click **Sign In**, and the platform's own sign-in page opens in a small window. Sign in the way you always do, including any two-step check. Studyboard never sees your password; each platform's sign-in is kept in its own private storage on your computer. This brings in the most:
- Everything with a due date, with the instructions in the task's notes and a link straight to it.
- Whether you've **submitted**: the task is marked done for you (only once, so you can undo it). For Brightspace **discussions**, it checks whether you've posted in the topic, and marks it done once you have. (A calendar link can't tell whether you've posted, so this needs Sign In.)
- **Grades:** your marks go into the Grade Tracker, with each item's weight when the platform has it (Brightspace weighted gradebooks, Canvas weighted assignment groups). Graded things you don't have as tasks, like participation, are added as finished tasks so your course grade adds up. A mark you typed yourself is never replaced.
- **Announcements** on each course page, and the course grade the platform shows.
- **Assignment files** (Brightspace attachments, and files linked in Canvas assignments): **Save to Studyboard** on the course page adds them to the course's files, linked to the task.

The sign-in lasts as long as your school allows (usually days to weeks). When it runs out, Studyboard asks you to sign in again, and meanwhile uses your calendar link if you've added one.

**Calendar Link (works everywhere, including your phone).** Brings in due dates, quizzes and calendar events (not grades, submissions or announcements). Where to find it:
- **Brightspace:** Calendar, then **Subscribe**, choose All Courses, copy the link.
- **Canvas:** Calendar in the left menu, then **Calendar Feed** at the bottom of the right-hand column, copy the link (it ends in `.ics`).
- **Blackboard:** Calendar from the main menu (not inside a course), the **Calendar Settings** gear, the menu next to the heading, then **Share Calendar**, copy the link.

In the desktop app the link works right away. On the website and your phone it needs the small `lms-feed` Supabase function below. The link is private to you: anyone with it can see your calendar. If it ever gets out, reset it in the same place and paste the new one.

You can use both: sign in on your computer, and add the calendar link so your phone can sync too. No connection at all? **Import a downloaded calendar file** does a one-time import.

### How syncing works

- The first time, you choose where each course goes: a course you already have (matched by code, like BSNC 1100), a new course, or **Don't Import**. Change it later under **Courses** in that platform's sheet.
- It then syncs by itself about every hour while Studyboard is open (in the desktop app, also while it's running in the background). **Sync Now** does it straight away. A short message tells you what changed, and **Recent Changes** keeps a list.
- **Your changes win.** If you rename a task, change its due date or write notes, the platform won't change them back. If an instructor moves a due date, your task moves and you'll see "is now due" in Recent Changes.
- Tasks you already typed in yourself are matched by name and course and linked, not added twice. If something disappears from the platform, Studyboard asks before removing it.
- Tasks from each platform have a small tag on the Board: **D2L**, **Canvas** or **Bb**.

### Dates hiding in announcements (AI)

With AI set up (the free Gemini key), Studyboard reads new announcements for concrete dates, like "Journal 2 is now due Friday", and lists them under **Dates Found in Announcements**. Nothing changes until you click **Move It** or **Add It**. You can also click **Check for Dates** on any announcement, or turn this off under Options.

### Set up the calendar helper for the website and phone (once, about 3 minutes)

Only needed for calendar links on the website or your phone. The desktop app doesn't need it.
1. In Supabase, open **Edge Functions**, click **Deploy a new function**, then **Via Editor**.
2. Delete the sample code. Open `supabase-functions/lms-feed/index.ts`, copy everything and paste it in.
3. Name the function exactly `lms-feed` and click **Deploy function**.
4. Leave **Verify JWT** **on** (the default). Only you, signed in to Studyboard, can use it. It only fetches Brightspace, Canvas and Blackboard calendar links and doesn't store anything.

### If something isn't working

| What you see | What to do |
|---|---|
| "The calendar helper isn't set up on your Supabase yet" | Do the four steps above, or sync from the desktop app. |
| "... refused the calendar link" | The link was reset. Copy a fresh one (see where above) and **Save Link**. |
| "Sign In Again" | Your sign-in on this computer ran out. Click **Sign In**. |
| A course went to the wrong place | Change it under **Courses** in that platform's sheet, then **Sync Now**. |
| Old courses from past terms | They're left out when they have nothing coming up. Set any you don't want to **Don't Import**. |
| Nothing shows for a course | Some instructors don't put due dates on everything. Add those yourself; they'll be linked if they appear later. |
| Blackboard: few items or no grades | Some schools limit what Blackboard shares. The calendar link still brings in due dates. |

## Time Estimates

Today's Plan spreads your work over the days before each thing is due, and it does that best when tasks have a time estimate. After importing a syllabus or syncing your school site, you don't have to open each task:
- **Estimate Times** lists every open task due in the next 2 weeks without an estimate (or all of them). Tap **30m, 1h, 2h, 3h or 5h**, type your own, or tap the **Suggested** time. **Use All Suggestions** fills every empty one at once, and **Suggest With AI** asks the AI for the whole list in one go.
- Open it from the small line in **Today's Plan** ("3 tasks due in the next 2 weeks have no time estimate"), or your study companion asks about it once a day (and right after a big import).
- Exams and quizzes don't need one: they happen at a set time. They're also never picked as **Do This Next**; their study sessions are.

## Page Tips

The how-to lines on everyday pages (under the Timeline and the Board, on the note board, in Flashcards and Files, in the sticker envelope) show for your first 14 days of using Studyboard, then tidy away. Tips for things you rarely do, like the scrapbook, setting up a new term or school sync, always stay. Turn on **Settings > Appearance > Always Show Page Tips** to keep them.

## Grades and Rough Week Rescue

Nothing to set up. Both work offline and without Supabase. Your marks and grade settings sync with the rest of your data when you're connected.

**1. Give graded work a weight**
Open a task, then **Advanced Settings**, and fill in **Grade Weight** (the percent of the course grade it's worth, from your course outline). Studyboard only counts tasks with a weight.

**2. Add marks as you get them back**
Open the task and type your mark in the **Mark** box, like `43/50` or `86%`. The box shows up once a task has a weight or is complete. When you finish a weighted task, a small note asks if you want to add your mark. Tap **Not Now** to skip it, or **Don't Ask Again** to turn it off (you can turn it back on in **Settings > Grades**).

**3. Check each course's pass mark**
Open **Settings > Grades**, tap the sliders button next to a course (or **Grade Settings** on the course page), and set:
- **Pass Mark:** the minimum grade to pass. It starts at 65%. Check your course outline, since some courses also need a pass on each part, like the exams.
- **Your Goal:** optional, the final grade you're aiming for.
- **Letter Scale:** starts with BCIT's usual scale. Change it if your course outline uses a different one.

Each course page then shows your grade so far, your projected final, and what you need on the rest to reach your goal and to pass. When a course gets close to its pass mark, Today's Plan moves that course's graded work up a little.

**4. Rough weeks**
When the next 7 days hold more work than your study time (from **Study Hours per Day** and **Weekly Hours Limit** in Settings), or several tasks are overdue, a banner on the Board offers **Rough Week? Make a Plan**. It shows what can't move, suggests what can wait, and applies everything in one step. Tap **Undo** on the message right after if you change your mind. **Not This Week** hides the banner until next Monday. You can also open it any time from **Settings > Grades > Plan a Rough Week**.

If you've set up AI, **Write a Short Plan** adds a few encouraging sentences about your plan. It uses the free Gemini key. If your AI is set to a paid model, you have to tick a box first, and it's never used on its own.

## Focus Sounds

**Switched off for now.** Focus Sounds is hidden in this version while custom sound files are prepared. Everything below comes back when it's switched on again.

Calm sounds to study to, made right in Studyboard (no audio files, and they work offline). Open the **Focus** timer and tap the **Focus Sounds** card under Start.
- **Match Theme** plays your theme's own mix: rain on the glass for Rainy Window, café murmur and rain for Cozy Café, waves for Ocean Waves, birds and a stream for Koi Pond, and so on. Many themes switch to a night mix in dark mode.
- Or pick your own from 16 sounds: Rain, Rain on a Window, Thunder Far Away, Ocean Waves, Stream, Wind, Snowy Wind, Fireplace, Café, Forest Birds, Night Crickets, City at Night, Library Room, Brown Noise, Pink Noise and Soft Pad. Mix up to 3, each with its own level.
- **During Focus Only** fades the sound in when a focus session starts and out on breaks. **Keep Playing** keeps it going, with an optional **Stop After** timer.
- Sound keeps playing when you switch tabs to study. Turn on **Pause When Studyboard Is Hidden** if you'd rather it stopped.
- The same options are in **Settings > Study and AI > Focus Sounds**.
- **Free:** Rain, Brown Noise and Ocean Waves, one at a time. **Pro:** every sound, Match Theme and mixing.

## Study Companions

Every theme has 3 little companions to choose from (201 in all). Yours lives in the scene. It sits a little to the left of the **Add Task** button, never on top of text, buttons, your note board or the calendar grids. It stays put when you switch pages (it only moves if something there would be covered), and every so often it wanders to a new clear spot along the bottom of the screen to keep things fresh. When it moves, it travels in its own style: a trail of bouncy hops with little dust puffs, a big leap with a flip, a speedy dash, or (for floaters) a swoop with a loop-the-loop. Its speech bubble follows it the whole way. It never sits in the side menu.
- **Tap it** to say hi. Pet it a few times for a special reaction. Long-press or right-click it to choose a different companion, rename it, or pick an accessory. You can also choose in **Style > Companions** or **Settings > Appearance > Study Companion**.
- **It lives alongside you:** it has more energy in the morning and gets sleepy late at night, naps when you've been away for a few minutes and wakes when you're back, glances at what you're doing, studies with you (or dozes) during a focus session, stretches on breaks, and celebrates when you finish a task.
- **What it says:** a few friendly words when you tap it, a little cheer about 15 seconds after you finish a task, and a hello about once an hour. It stays quiet while you're focusing, typing or have a window open. Every built-in line was reviewed to keep them calm and natural, with no cringey puns.
- **Choosing a companion:** the one you pick gets a clear highlight and a check mark.
- **It grows with you:** focus hours unlock accessories: Cozy Scarf (1 hour), Tiny Hat (5), Round Glasses (15), Star Badge (60) and Graduation Cap (100).
- **Ideas when you tap:** sometimes it suggests a next step, like starting a focus on the top task in Today's Plan or reviewing due flashcards. **Let's Do It** starts it; **Not Now** stops ideas for the day.
- **Smart Lines (with AI):** if you've set up AI and turned on automatic AI, your companion writes its lines from what's actually going on ("Bio quiz tomorrow. One card round?"). It reacts to the task you just finished, the end of a focus session, coming back after a break, a new exam or a busy week, and it keeps fresh lines for your taps. Each request writes lines for several moments at once, and everything is kept on your device.
  - **It never takes from your other AI features:** with free Gemini it has its own daily allowance (up to 50 small requests a day, at least 2 minutes apart, never while Studyboard is hidden) and only uses Gemini's Flash-Lite models, which have their own free quota, separate from the models the rest of Studyboard uses. If Google says the free quota is used up, it simply rests until tomorrow. The companion settings show how many it has used today. With a paid model it keeps to one small plan a few times a day.
  - **Ask About This:** while you're studying a flashcard, editing a note, looking at a course, or just after opening a file, the Ask button becomes **Ask About This**. Ask things like "explain this card", "quiz me on this note" or "summarize this reading". Only when you ask (and only if **About this ...** stays ticked) does it send what's on screen: the card, the note, the course's task list, or the text inside the file. The task window has its own **Ask About This Task** link under Notes, for "what is this assignment asking me to do?". Please don't use it with real patient information.
  - **Ask Me:** after a tap, tap **Ask** and type a short question ("what should I do next?", "quiz me on something"). It answers in a sentence or two in character, and can offer to start a focus on the right task.
  - **What it sends:** only the time of day, how many tasks are due, your next 3 deadlines (title, course code, type, date), tasks finished in the last 2 days, your streak, focus minutes, days to your next exam, and your companion's name and personality (plus your question, for Ask Me). No notes, files, grades or keys. Turn Smart Lines off in the companion settings. Without AI, it uses its own lines.
- **Its lines are excited to see you:** big cheers when you finish a task or a focus session, a happy hello, morning and break lines, and a speech bubble that springs in (celebrations wiggle and sparkle). It stays softer during focus sessions and late at night.
- Turn the companion or its speech bubbles off any time in its settings. With reduced motion on, it holds still and just blinks.
- **Free:** the first companion of every theme, plus the scarf and hat. **Pro:** all 3 companions for every theme and every accessory.

## Your Photo Themes

Make a theme from your own photo: your campus, your pet, a favourite place. Open **Style > Themes > Your Photos** and choose **Add a Photo** (or drop a photo on it).
- Drag to choose the part of the photo that should show (the editor shows what a computer and a phone will see), set the blur and brightness, and give it a name.
- Studyboard picks the theme's colours from your photo, for buttons, sticky notes and flashcards, in light and dark versions, and adds a soft shade when needed so text on your cards stays easy to read. Tap a colour swatch to choose the accent yourself.
- Your photo is saved on this device, and when you're signed in it's uploaded to your Supabase storage so your other devices get the theme too. Deleting it removes it everywhere.
- Switching to a photo theme keeps your note shape and pin.
- **Pro:** up to 5 photo themes.

## Study Together Rooms

Focus at the same time as your study group, from wherever you are. Anyone in a group can start a session, everyone else gets a gentle note, and you all count down together. It runs through your own Supabase project, so it needs one extra piece of setup SQL: the file `supabase-rooms.sql` that came with this update. Set up study groups first (`supabase-groups.sql`, above).

**1. Run the rooms SQL (once)**
In Supabase, open **SQL Editor**, then **New query**. Open `supabase-rooms.sql`, copy everything into the editor and click **Run**. You should see *Success. No rows returned*. It's safe to run again later if you're not sure it worked.

That's all. It adds a small table for each group's current session, the rules that keep it private to the group's members, and live updates. It doesn't change your own data or your groups.

### Starting a session
- Open **Groups**, then your group. Near the top you'll see **Study Together**.
- Tap **Start a Session**, pick a length (**25**, **50** or **90 minutes**, or **Custom**) and, if you like, a short goal like *Biology chapter 5*. Tap **Start Session**.
- Everyone in the group who has Studyboard open gets a small note (and sees a **Studying Now** banner on the Groups page). They can join any time before it ends.

### In the room
- The big countdown is the same for everyone, even if someone's phone clock is a bit off.
- You see who's in the room and each person's goal.
- Tap a cheer (👏 🔥 💪 ⭐ 💖) to send a little encouragement. It floats up on everyone's screen. There's no chat here; the group's Message Board is right below.
- Switch tabs or apps to study. You stay in the room until you tap **Leave Room**, and you can **Rejoin** while it's running.
- Your own **Focus** timer is separate, so you can keep using it as usual.
- The person who started the session (or the group owner) can **End for Everyone**.

### When the time is up
Everyone sees a shared moment, like *You All Focused 50 Minutes Together*, with everyone's names. The minutes you were actually in the room (5 or more) are added to your focus stats. Then there's a 5 minute break, and anyone can tap **Go Again** for another round.

### Notes
Don't want the small note when someone starts a session? Open **Settings**, then **School and Groups**, and turn off **Study Together Notes**. Sessions still show on the Groups page.

### Room size
| Group owner's plan | People in a room | Longest session |
|---|---|---|
| Free | 4 | 60 minutes |
| Pro | 30 | 3 hours |

The group owner's plan decides, so one Pro owner gives the whole group bigger rooms. While Pro isn't switched on (the paywall is off), every group gets the Pro sizes. You can change these numbers in the `limits` row of `studyboard_config` (`roomPeople` and `roomMinutes`).

### Without Supabase
Study Together rooms need your Supabase connection and an account, like study groups. In local-only mode, the Groups page explains how to connect.

### How your data is protected
| Question | Answer |
|---|---|
| Who can see a session? | Only members of that group. People outside it can't see or join it. |
| What do others see about me? | Your display name, your goal for the session, and the cheers you send. Nothing else from your planner. |
| What gets saved? | Only the group's current session and who joined it. Finished sessions are cleaned up after 12 hours. Your focus minutes are saved in your own settings. |

## Term Scrapbook

Nothing to set up. Every term gets its own scrapbook page that fills with stickers as you reach real milestones, so by the end of term you have a keepsake of your semester. It works offline and without Supabase, and your pages sync with your settings when you're connected.

**Where to find it**
- Tap the 🔥 streak count on the Board (or **Settings > Appearance > Today's Quote and Streak**) and choose **Scrapbook**.
- **Settings > Study and AI > Term Scrapbook**.
- Past terms' pages are at the bottom of the **Archive**, under **Scrapbook Pages**.

**How a term works**
A page starts when you choose **Start a New Term** and runs until the next time you do. When you start a new term, the old page is saved with a short summary (stickers, tasks done, focus hours, best streak, average mark) and a **Term Complete** sticker, and a fresh page opens. If you tap **Undo** right after, the old page comes back as it was.
The first time you open Studyboard with the scrapbook, it starts your page from your last new term, or from the start of this school term, and quietly adds the stickers you've already earned, with one short message. After that, a small message says **New Sticker** when you earn one, at most once every few minutes. You can turn these messages off in **Page Details**.

**Making it yours**
- Drag stickers anywhere. Tap one to turn it, make it bigger or smaller, or **Put Back** in its spot. On a phone, pinch with two fingers to turn and resize. With a keyboard, use the arrow keys to move, **[** and **]** to turn, and **+** and **-** to resize.
- **Decorate** adds captions on little paper tags, washi tape and doodle frames.
- **Paper** changes the page design. **Page Details** renames the term and adds your name.
- **Zoom In** (on a phone) makes the page bigger so you can place stickers precisely.

**Free and Pro**
The scrapbook, every milestone and every sticker are free. Studyboard Pro adds extra paper designs (Grid Journal, Dot Journal, Blush, Night Sky, Meadow and Match My Theme), extra washi tape and frames, and **Save as Image**, which saves your page as a picture to share. While Pro isn't switched on, everyone has all of it.

**Fair play**
Only work you finish counts. Tasks that arrive already done (from your school site, a calendar file, or added as done) don't count, and neither does checking and unchecking the same task: once you have a sticker it stays, but it can't be earned twice. Nothing rewards studying late at night or huge single days.

### Every Milestone

**Getting Started**
- **Hello, New Term:** your page opens.
- **First Course Added:** add a course for this term.
- **First Task Done:** finish your first task this term.
- **First Week Planned:** have 5 tasks with due dates in one week.

**Tasks**
- **10, 25, 50 and 100 Tasks Done:** finish that many tasks this term (bronze, silver, gold and rainbow ribbons).
- **Clean Sweep Week:** finish every task due in one week by its due date (at least 3 tasks).
- **Early Bird:** finish 5 tasks at least 2 days before they're due.
- **Study Plan Made:** make a Study Plan for an exam or quiz.
- **Study Plan Complete:** finish every session in a Study Plan (3 or more) before the exam.
- **Exam Day Done:** mark an exam or quiz as done.
- **Rough Week, Handled:** use Rough Week Rescue to lighten a busy week.

**Grades**
- **First Mark In:** record a mark for any task.
- **80% or More** and **90% or More:** get a mark that high.
- **On Target:** have a course average at or above your goal grade, with 2 or more marks (set the goal in Grades).
- **Passing Everything:** be above the pass mark in every course with marks, with 3 or more marks.
- **Level Up:** beat your last mark in the same course.
- **All Marks In:** have every graded item in a course marked (3 or more).

**Streaks** (make progress on a task each day)
- **3, 7, 14, 30 and 60-Day Streaks.**
- **Streak Reward:** every 10 days in a row earns a streak reward, and each one also adds a gift sticker to your page.

**Focus**
- **First Focus Session:** finish a focus session.
- **5, 15, 30 and 60 Focus Hours:** focus time this term, from the Focus timer and Study Together rooms.
- **Steady Week:** focus on 5 different days in one week, 15 minutes or more each.

**Flashcards and Practice**
- **First Deck:** make a flashcard deck with at least 5 cards.
- **100 and 500 Cards Reviewed:** flashcards reviewed this term.
- **Deck Mastered:** learn every card in a deck of 10 or more.
- **Quiz Whiz:** score 85% or more on a practice quiz with 5 or more questions.
- **Practice Makes Progress:** finish 5 practice quizzes this term.

**Together**
- **Study Together:** focus with classmates in a Study Together room.
- **Shared a Deck:** share a flashcard deck with a link, a group or a file.
- **Study Buddies:** join or make a study group.

**Term**
- **Term Complete:** finish the term with Start a New Term.

## Two Devices, One Note (Sync Conflicts)

Students edit on a phone on the bus and a laptop at home, often offline. Without this step, whichever device saves last silently replaces the whole item, so an edit made on the other device can vanish. Run `supabase-sync-conflicts.sql` once (SQL Editor > New query > paste > Run, after `supabase-lean.sql`; it is safe to run again) and Studyboard stops that from happening:

- A device that was offline merges what happened meanwhile before it sends its own changes, so a phone that was in a drawer for three weeks cannot undo this week's work.
- Notes are merged line by line. If both devices changed the same line, **both versions are kept** in the note under a friendly divider, the note shows "Edited on two devices", and **Settings > Account and Sync > Sync Issues** lets the student keep theirs, the other, or both. Other things (task fields, flashcards, settings) are merged field by field, and the value that loses is written to a hidden history.
- Nothing is blocked and nothing needs your attention as the app owner. The rules are in `SYNC-POLICY.md`.

If you skip the file, sync keeps working as before, and devices coming back from offline still read before they write; but two devices saving at the same moment can still overwrite each other, because only the server can check that safely. Update the app and run the file together, in either order.

## Keeping Supabase Free (Lean Sync)

Supabase's free plan counts how much data it sends out each month (5 GB), how much it stores, and how busy the database is. Lean Sync keeps all three low so one free project can carry a lot of students.

**Switch it on (one time):** in Supabase, open **SQL Editor > New query**, paste everything from `supabase-lean.sql`, and click **Run**. Run it after your other setup files. It's safe to run again. For the clean-ups to run by themselves, turn on **pg_cron** first (**Database > Extensions**, search "pg_cron", switch it on), then run the file.

What it does:
- **Only changes are downloaded.** The first time a device opens Studyboard it downloads everything and keeps a copy. After that it only asks for what changed since last time, plus a short list of what was deleted. Once a week it does one full check to fix anything missed. Without the SQL file, every device downloads everything each time, like before.
- **Live updates pause in the background.** When Studyboard has been hidden for a minute, it stops listening for live changes, and catches up the moment you come back.
- **Backups stay on your device.** Each device keeps a daily backup for the last 14 days (the desktop app also keeps daily backups in its folder). Weekly online backups are still made while Pro is switched off; once Pro is on, they're a Pro extra.
- **Search reads each file once.** When one device reads the text inside a file for Search Everywhere, it saves that text (a small zipped copy) next to the file, so your other devices don't download the whole file again.
- **School settings stay small.** Brightspace, Canvas and Blackboard's change log and the full text of announcements are kept on each device instead of in your synced settings.
- **Calendar links are cached.** The Live Calendar link is only rebuilt when something changed, and calendar apps that already have the latest copy are told "nothing new". Your school's calendar link is also checked with a quick "has it changed?" first.
- **Limits against runaway use.** Each account can check a school calendar link 60 times an hour, each live calendar link can be read 120 times an hour, and invite or deck codes can be looked up 30 times an hour. Normal use never comes close.
- **Quiet accounts are packed away.** Accounts with no sign-in and no changes for 6 months are packed into one compressed record once a month. The next time that person opens Studyboard, everything is unpacked automatically in a second or two. Their files are not touched.

Update the `calendar-feed` and `lms-feed` functions too (Edge Functions > the function > Code, paste the new `supabase-functions/<name>/index.ts`, Deploy), and run `supabase-groups.sql` again if you use study groups.

## Studyboard Pro

Studyboard has a Free plan and a Pro plan built in, but the paywall is **switched off**. Right now everything is unlocked for everyone and nothing is limited. You don't need to set anything up until you decide to launch Pro.
- **Free, forever:** the whole planner, sync on up to 2 devices, Brightspace, Canvas and Blackboard sync, reminders, study groups (up to 3 members, messages kept 60 days), AI with your own Gemini key, the 14 plain color themes and the free styles, 100 MB of cloud files and 25 MB of synced data.
- **Pro ($2.99 a month or $19.99 a year, with a 7-day free trial):** unlimited devices, 10 GB of cloud files and 250 MB of synced data, every premium theme (including the 4 seasons) and style, 30 days of online backups, and study groups of up to 100 members with unlimited message history.
- **See it:** Settings → **Studyboard Pro** shows the plan, what Pro adds and how much storage you use.

When you're ready to sell Pro, follow the step-by-step guide in `PRO-PLANS-GUIDE.md` (Studyboard Pro: Plans and Payments), which comes in the same zip. It covers running `supabase-plans.sql`, making Stripe payment links, the `billing-webhook` function, App Store and Google Play through RevenueCat, and a short Launch Day checklist.

## Updating Studyboard later

To install a new version, upload the new `index.html` to your GitHub repository (Add file, Upload files) and replace the old one. Your data stays in Supabase, so nothing is lost. If you had filled in `SB_DEFAULT` in the old file, fill it in again in the new one before uploading.

**Flashcards update (one time, only if your project was made before 1.11 with an older `supabase-setup.sql`).** Flashcard decks need a small database change before they can sync. In Supabase open **SQL Editor**, then **New query**. Paste the contents of `supabase-update-flashcards.sql` and click **Run**. Supabase may show a "Potential issue detected" warning because the query drops a rule. It's safe: it only swaps the rule on which kinds of items are allowed, and no data is deleted. Confirm and run it. Until you do, decks are still saved on each device, and Studyboard shows a reminder.

---

## Public launch checklist

Work through this before you tell the public about Studyboard.

**Server (Supabase)**
- [ ] All SQL files run in the order above, ending with `supabase-lean.sql` (it adds Delete My Account and Data).
- [ ] Custom SMTP set up and the six email templates pasted in (Part 1b, steps 3 and 4). The built-in sender only allows a few emails an hour.
- [ ] Email confirmation on, password length 8, Site URL and Redirect URLs set to your real web address.
- [ ] Edge Functions deployed with the right Verify JWT setting (table above) and their secrets set.
- [ ] Deploy the `delete-account` Edge Function (Verify JWT **On**) and run `supabase-delete-selftest.sql` (expect "ALL 41 ACCOUNT-DELETION CHECKS PASSED").
- [ ] Test **Delete My Account and Data** with a spare account that has an uploaded file: it signs out, the account is gone from Authentication > Users, the rows are gone, and the file is gone from Storage > studioso-files. Also test with a spare Stripe test-mode subscription: it is cancelled in the Stripe dashboard.
- [ ] A weekly backup of the database turned on (Supabase paid plans) or a regular export of your tables, and the keep-awake workflow running if you stay on the free plan.
- [ ] Row Level Security shows **enabled** on every table in Table Editor, and the secret or service_role key appears nowhere in the app or repository.

**Legal and contact**
- [ ] In `index.html`, change `const SUPPORT = "support@YOUR-DOMAIN"` (in the 99-release module) to your real support address, and monitor that inbox.
- [ ] Read the in-app Privacy Policy and Terms of Service (Settings > App and Notifications) and have them checked for your country or state. They describe the app as built; change them if you change what Studyboard collects.
- [ ] Add your legal name or business name where you are required to, and the governing law in the Terms.
- [ ] Switch the same support address into Stripe, your email templates and the store listings.

**App**
- [ ] Version is the same everywhere (`package.json`, `APP_VERSION`, the installer file names in this guide).
- [ ] Desktop installers built from a tagged release (`v1.13.0`) with the GitHub workflow and tested on a clean Windows and Mac. Decide about code signing (see the Windows and Mac sections above).
- [ ] The website is served over HTTPS and Add to Home Screen works on a phone.
- [ ] If you sell Pro: finish `PRO-PLANS-GUIDE.md` and its Launch Day steps. If you do not, leave the paywall off.

## Recently Deleted and Export My Data (no setup needed)

- Deleted items are kept for 30 days in a bin that syncs like the rest of your data. It uses the existing `items` table with `kind = 'trash'`, so there is no SQL to run. Bin entries count toward each account's data size like any other item (a deleted deck still takes its space until the 30 days pass or it is deleted forever). Stored files are not removed from storage until the bin lets go of them.
- If the same item is edited on another device after it was deleted, the live copy wins and the bin entry is hidden until it expires. Nothing is removed from the account because of a conflict.
- Settings > Export My Data builds a ZIP (JSON plus CSV files) on the device; nothing is sent to the server.
