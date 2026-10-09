# Studyboard 1.13.0 release checklist

Status key: **Done** = finished in this branch and checked. **Owner** = needs a decision or an action from the owner.

## 1. Repository layout (Owner decision)

This repository is a flat copy of an intended layout. Nothing was moved or renamed in this pass, so the root-level pieces were made to work as they are, and the moves are left as a decision.

| Intended layout | What is in the repo today | What was done without moving files |
|---|---|---|
| `icons/` and `widgets/` folders next to `index.html` | Icons, `shortcut-*.png`, `today-*.json/png` sit in the root | `manifest.webmanifest` and `today.webmanifest` list both `icons/...` and root paths (the browser skips whichever 404s). `sw.js` caches the app shell and treats every icon as optional, so it installs in either layout. Widget `data`/`ms_ac_template`/`screenshots` still point at `widgets/` (a manifest field takes one path), so the Windows Widgets board needs the `widgets/` folder (see below). |
| `desktop/` project with `scripts/prepare.js`, `widget/`, `app/`, `build/` | `package.json`, `main.js`, `preload.js`, `lms.js`, `prepare.js`, `widget*.{html,css,js}`, icons all in the root | `prepare.js` detects the flat layout, builds `app/` from `./index.html`, and stages `widget/` and `build/` from the flat files. `package.json` scripts now call `node prepare.js`, so `npm run prep`, `start` and `dist*` work from the root. `app/`, `build/`, `widget/`, `dist/` are in `.gitignore` (none of them holds committed files). |
| `.github/workflows/build-desktop.yml` | `build-desktop.yml` in the root (GitHub ignores it there) with `working-directory: desktop` | Added a working copy at `.github/workflows/build-desktop.yml` for the flat layout. The root file is kept, marked as a template for the nested layout. |
| `supabase-functions/<name>/index.ts` | `index.ts`, `index (1).ts`, `index (2).ts`, `index (3).ts` | Done: moved to `supabase-functions/calendar-feed`, `billing-webhook`, `lms-feed` and `send-reminders` (`git mv`), with `supabase/config.toml` and per-function deploy commands in SETUP-GUIDE. |
| `email-templates/` folder | `confirm-signup.html`, `reset-password.html`, ... in the root | Nothing to do for the app; the guide says "email-templates folder". |
| (nothing) | A file called `download` containing `node_modules/ app/ dist/` | A stray ignore list. Deleted. |

**Recommended owner decision:** make the repository match the intended layout in one commit (`git mv`), then simplify:
- `desktop/` gets `package.json`, `package-lock.json`, `main.js`, `preload.js`, `lms.js`, `scripts/prepare.js`, `widget/` (the `widget.*` files and `widget-preload.js`) and `build/` (the icon and installer artwork). Delete the root `build-desktop.yml` and the `.github/workflows` copy's flat tweaks (put `working-directory: desktop` back; `prepare.js` also works in that layout).
- `site/` (or the root) gets `index.html`, `sw.js`, `vendor/` (supabase-js, fonts), both manifests, plus `icons/` (`icon-*.png`, `maskable-*.png`, `apple-touch-icon.png`, `shortcut-*.png`) and `widgets/` (`today-data.json`, `today-template.json`, `today-screenshot.png`). `.gitignore` already lists `site/`; change that if `site/` is meant to be committed.
- The four functions are now in `supabase-functions/<name>/index.ts` (done). Still to do: an `email-templates/` folder.
- Also missing from the repo and referenced by the guides: `build.py` (fills `SB_DEFAULT` from `server.json`), `supabase-update-flashcards.sql` and the original `supabase-setup.sql`. If you still have them, add them back.

## 2. Version and packaging

| Item | Status |
|---|---|
| Version 1.13.0 in `package.json`, `package-lock.json`, `APP_VERSION` (feedback module), the new About module, SETUP-GUIDE installer and zip names | Done |
| `dist:mac-intel` script quoting (`${version}` and `${ext}` were expanded empty by the shell) | Done |
| CI runner `macos-13` (retired) replaced by `macos-15-intel` | Done |
| `homepage` placeholder removed from `package.json`, `license` set to UNLICENSED (proprietary, all rights reserved; see LICENSE) | Done (add `homepage` back with your real URL if you want it) |
| Copyright line `Copyright © 2026 Studyboard` in `build.copyright` | Owner: put your legal name or business name there |
| Windows and Mac installers are unsigned (SmartScreen / Gatekeeper warnings; the Mac build uses an ad-hoc identity) | Owner: buy a code-signing certificate / Apple Developer ID and notarize, or keep the guide's workaround text |
| Node and `npm ci` of the desktop build were not run in this environment (no network for npm). `prepare.js` was tested against a stub `node_modules` | Owner: run `npm ci && npm run dist` once on each OS |

## 3. Accessibility

| Item | Status |
|---|---|
| Every icon-only button has an accessible name (checked with a script across Board, Plan Ahead, Flashcards, Notes, Files, Courses, the task form and Settings); three hidden file inputs now have labels | Done |
| Sheets (`#dlg`) now get an accessible name from their heading; they are native modal `<dialog>`s (role and modality built in) | Done |
| Focus returns to the control that opened a sheet, even if the page re-drew that control | Done (tested for Settings, Add task and Focus timer) |
| Visible focus on every control (measured by tabbing through 6 views: all show an outline or ring; the quick-add field shows it on its bar) | Done |
| Tab lists: Left, Right, Home and End move between tabs (Enter or Space picks); Settings categories already had Up and Down | Done |
| Skip link, `<noscript>` message, `lang="en"`, page title | Done |
| Text contrast: default light and dark themes scripted on every visible text node in 6 views and Settings. Fixed: accent blue (`#1F6FEB` to `#1A60D0`, was 4.4:1 on cards), dark-mode "late" and "due soon" chips, the toast button in dark mode, course-colored file tags and the white-on-course-color tab labels | Done. Owner: user-chosen course colors and the 46 art themes were not audited one by one |
| `prefers-reduced-motion`: CSS now stops all animation and transitions globally; JavaScript effects already honored it | Done |
| Touch targets 40px or more on phones for buttons, chips, tabs and form fields; small round controls (task check, focus start, timeline milestones) get a larger invisible tap area. Timeline bars in the chart stay narrow by design | Done |
| Alt text, `autocomplete` on email and password fields | Done (already present) |
| Screen reader pass with NVDA/VoiceOver | Owner |

## 4. First run and edge cases

| Item | Status |
|---|---|
| No `console.log`, TODO or placeholder text in the shipped page; fresh and seeded loads print no console messages | Done |
| "undefined", "NaN", "[object Object]" and "null": scanned visible text, placeholders, titles and aria-labels on every tab, every Settings category and the task form with an empty profile and with a badly broken one (missing names, bad dates, wrong types). None found | Done |
| AI errors (no key, rejected key, quota/credit, rate limit, busy, offline, too big, garbled) already have plain messages for Gemini, Claude and ChatGPT | Done (reviewed) |
| Naming: "Studioso" appears only in internal storage keys (kept so existing data keeps working), never on screen | Done |
| "Early access" wording in the Style Shop, welcome tour and Pro sheet is shown while the paywall is off | Owner: turn the paywall on, or reword before launch |
| Dev/test hooks (`studyboard:search:debug`, `STUDYBOARD_BS_TEST`) are off unless set by hand | Done (reviewed) |

## 5. Legal and store readiness

| Item | Status |
|---|---|
| In-app **Privacy Policy** and **Terms of Service** sheets, reachable from Settings > App and Notifications and from the sign-in and sign-up screens (with a Back button that returns to the form with the email kept) | Done |
| In-app **About** page: version, copyright, credits and licenses (Atkinson Hyperlegible and Lexend under SIL OFL 1.1, pdf.js under Apache-2.0, supabase-js and Electron under MIT) | Done |
| `THIRD-PARTY-NOTICES.md` with the license texts | Done |
| PDF.js 6.4.299 (legacy ES-module build) vendored in `vendor/pdfjs/` (deploy this folder with the web page; `prepare.js` stages it for the desktop app); re-test a PDF syllabus import after any pdf.js update | Done |
| **Delete My Account and Data** (Settings > Account and Sync, signed-in only): explains what is removed, offers an export first, requires typing DELETE, optionally erases this device's copy, clear messages for "server not set up", offline and signed-out. Calls `studyboard_delete_my_account()` after removing the user's files through the Storage API. Tested with a stubbed server (3 outcomes) | Done |
| `studyboard_delete_my_account()` in `supabase-lean.sql`: SECURITY DEFINER, `search_path` set, acts on `auth.uid()` only, execute granted to `authenticated` only, safe to run twice, tolerates Supabase blocking SQL deletes on storage | Done. Owner: run `supabase-lean.sql` and test with a spare account |
| Contact address is the clearly marked placeholder `support@YOUR-DOMAIN` (one constant, `SUPPORT`, in the 99-release module of `index.html`) | Owner: replace it |
| The policy texts match what the app does today but are not legal advice | Owner: have them reviewed for your country or state; add your legal name and governing law |
| Deleting an account does not cancel a Stripe or app-store subscription (the sheet tells people to cancel first) | Owner: decide the process for cancel-on-request |
| App Store / Google Play: privacy label and data-safety form, age rating, screenshots | Owner (only if shipping store apps) |

## 6. PWA and meta

| Item | Status |
|---|---|
| Manifest: name, short name, description, start URL, scope, display, colors, categories, language, 192/512 and maskable icons | Done |
| Shortcuts (Quick Add, Today, Focus, Search) checked against the code: all four `?action=` values are handled; Timeline and Schedule were merged into Plan Ahead and no shortcut points at them | Done |
| Page `<head>`: description, theme color, application name, Apple web-app meta tags, `apple-touch-icon`, favicon | Done |
| Service worker: installs even when `icons/` does not exist, new cache name `studyboard-v6`, precaches the vendored supabase-js and fonts | Done (tested over HTTP) |
| Static `<link rel="manifest" href="manifest.webmanifest">` in `<head>` (the script only adds one if it is missing, never two; the manifest lists icons for both layouts) | Done |
| Third-party code: supabase-js and fonts are served from `vendor/` (deploy that folder next to `index.html`, in the `site/` folder if you move files); supabase-js is loaded with SRI, jsDelivr is only a fallback. Google Fonts is no longer used | Done |
| Confirm the SRI hash against the CDN once: `curl -s https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js \| openssl dgst -sha384 -binary \| openssl base64 -A` must print `Rj26LVGvoeRVR6+mwQmFfcR3QOBEwT+ZmuCWpuiqeTzJpCs0ER4ITAWGb4Hiy3Ok` (it was computed from the npm file; only the fallback depends on it) | Owner |
| pdf.js is self-hosted (`vendor/pdfjs/`, 6.4.299); cdnjs is no longer used or allowed in the CSP | Done |
| Widgets entry in the manifest needs `widgets/today-*.json` and screenshot | Owner (follows the layout decision above) |

## 7. Documentation

| Item | Status |
|---|---|
| `README.md` rewritten: features, running web and desktop, deploying, links | Done |
| `SETUP-GUIDE.md`: "What's New in 1.13", every SQL file in run order, Edge Function file mapping, **Public launch checklist** at the end | Done |
| `PRO-PLANS-GUIDE.md`: SQL order note, wrong `base/app.js` path fixed (`const STORE` lives in `index.html`), Public Launch Checklist (Pro) | Done |
| `supabase-setup.sql` was missing although every guide starts with it. A new one was rebuilt from how the app uses the `items` table and the `studioso-files` bucket (own-row policies, private bucket, realtime) | Done. Owner: compare it with the original if you have it and keep the one your live project was made with |
| `SB_DEFAULT` in `index.html` contains a project URL and publishable key (`pivcmrqcjseycjkbocmc`) | Owner: confirm that is your production project (the publishable key is meant to be public) |

## 8. Cold start

Measured with Playwright (Chromium, file load, local data): first contentful paint about 360 ms and the board rendered at about 620 ms on a desktop; about 1.9 s with a 4x CPU slowdown (phone-like). The only long task is the one-time parse and run of the 5.8 MB page (about 215 ms desktop, 980 ms throttled). **Done:** the sticker picture warm-up (which spent about 0.9 s of throttled CPU in the first five seconds, in 12 ms slices) now waits 6 seconds and then runs from `requestIdleCallback`. **Owner (optional):** splitting `index.html` into cached script files and compressing it (gzip or brotli on the host) would cut the parse and download cost much more than any further boot deferral.

## 9. Before you launch (short list)

1. Replace `support@YOUR-DOMAIN`.
2. Run the SQL files in order, ending with `supabase-lean.sql`; test Delete My Account with a spare account.
3. Custom SMTP and the email templates; confirm email on.
4. Decide the paywall and the "early access" wording.
5. Get the legal texts reviewed; fill in your legal name.
6. Build and test the installers on Windows and Mac; decide about signing.
7. Decide about the repository layout (section 1).
8. Microsoft Store: follow `MICROSOFT-STORE.md` (Individual account, copy the Partner Center identity into `package.json` build.appx, `npm run check:msstore`, Actions > Run workflow > msstore). Re-run `supabase-bug-reports.sql` so reported AI responses keep their own "ai" category (until then they arrive as "other", marked "[AI response]").
