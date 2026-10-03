# Studyboard

A calm student planner for courses, deadlines, study sessions and flashcards. It works as a website you can install on a phone (a PWA) and as a desktop app for Windows, Mac and Linux. No account is needed: your data stays on your device. An optional free account syncs it between devices.

## Features

- **Board and Today's Plan:** every task and deadline in one place, with a ranked plan for today that fits your study hours.
- **Plan Ahead:** a Timeline and a Schedule (classes, exams and events) in one tab.
- **Courses, grades and syllabi:** import a syllabus PDF, track grades, "What do I need?" and Rough Week Rescue.
- **Flashcards and quizzes**, notes with stickers, files, and Search Everywhere.
- **Focus timer** with sounds, and a study companion.
- **School sites:** Brightspace, Canvas and Blackboard (read only) on desktop, or calendar links anywhere.
- **Reminders and calendar sync** on phones and desktop; study groups with shared Project Tasks (task lists with assignees and due dates, workload view, tasks assigned to you show up on your Board), shared decks and Study Together rooms.
- **Themes and styles**, light and dark mode, reduced motion, keyboard and screen reader support.
- **Optional AI helpers** that use your own Gemini, Claude or ChatGPT key.
- **Privacy:** no ads and no analytics. Privacy Policy, Terms and About are in the app (Settings), and **Delete My Account and Data** is under Settings > Account and Sync.

## Run it

**Website.** `index.html` is the whole app. Serve the folder over HTTPS (GitHub Pages works) or run a local server:

```
python3 -m http.server 8080
```

then open http://localhost:8080. The service worker (`sw.js`), `manifest.webmanifest` and the icons make it installable and available offline.

**Desktop app.** You need Node.js 20 or newer.

```
npm ci
npm run start        # prepares app/, widget/ and build/ from the files in this folder, then opens the app
npm run dist         # Windows installer in dist/   (also: dist:mac, dist:mac-intel, dist:linux)
```

`npm run prep` alone stages the offline copy of the page with its fonts and libraries. The `build-desktop` GitHub workflow (`.github/workflows/build-desktop.yml`) builds the installers when you push a tag such as `v1.13.0` or run it by hand from the Actions tab.

## Deploy

1. **Supabase (optional, for accounts and sync).** Create a free project and run the SQL files in the order in [SETUP-GUIDE.md](SETUP-GUIDE.md) ("Run the SQL files in this order"). Deploy the four Edge Functions (`index.ts`, `index (1).ts`, `index (2).ts`, `index (3).ts`) as described there.
2. **Website.** Upload `index.html`, `sw.js`, the two `.webmanifest` files and the icons to GitHub Pages or any static host.
3. **Desktop.** Tag a release, or run `npm run dist` locally.
4. **Before going public,** work through the *Public launch checklist* at the end of the setup guide and [RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md).

## Documentation

- [SETUP-GUIDE.md](SETUP-GUIDE.md): GitHub, Supabase, accounts, installing the app, and every feature's setup.
- [PRO-PLANS-GUIDE.md](PRO-PLANS-GUIDE.md): the optional Free and Pro plans and Stripe payments.
- [RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md): release status and what the owner still has to do.
- [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md): fonts and libraries and their licenses.

## License

MIT, see [LICENSE](LICENSE). Third-party licenses are in THIRD-PARTY-NOTICES.md.
