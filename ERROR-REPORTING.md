# Crash and error reporting

Studyboard can tell you about bugs before users leave a review. It sends **one small, scrubbed, anonymous event per bug** to a Sentry project you own (primary path) or to your own Supabase project (optional path). There is **no Sentry SDK and no third-party script**: the page does a plain `fetch` POST of an event in Sentry's envelope format. With no DSN pasted, **nothing is ever sent**.

## Setup in 5 minutes (Sentry, free tier)

1. Create a free account at sentry.io, then **Create Project > Platform: Browser JavaScript** (name it `studyboard`). Copy the **DSN** (Settings > Projects > studyboard > Client Keys).
2. In the project's **Settings > Security & Privacy**, turn on **Prevent Storing of IP Addresses** (so even the network address is never kept) and leave **Data Scrubber** on. This is what lets you answer "not linked to identity" in App Store Connect.
3. In `index.html`, find the block at the top of module `49-errreport.js` and paste the DSN:
   ```js
   const ERROR_REPORTING = {dsn: "https://PUBLICKEY@o0000.ingest.sentry.io/0000000", environment: "production", release: APP_VERSION, supabaseFallback: false};
   ```
   Bump `APP_VERSION` (and `package.json`, and `VERSION` in `99-release.js`) for every release: it becomes Sentry's **release**.
4. Deploy as usual. For the website, stamp the build id (see "Reading a stack"); for desktop and iOS `node prepare.js` does it. That is all: upload no source maps and no files to Sentry.
5. Check it: open the app, then in the browser console run `setTimeout(function checkErrors(){ throw new Error("test from console") })`. The event shows up in Sentry > Issues within a few seconds.

The desktop app's main process reads the same DSN: `prepare.js` copies it into `app/error-config.json`, so rebuild the desktop app after pasting it.

## What is captured

| Source | Event `kind` tag |
| --- | --- |
| Uncaught errors, unhandled promise rejections | `error`, `promise` |
| `console.error(...)` (sampled 50%) | `console` |
| Exception inside `render()` | `flow-render` |
| Sync gave up after its retries | `flow-sync` |
| AI call failed for a reason that is not the user's key (garbled answer, provider 5xx, blocked, too long, or an unexpected bug). Bad key, no credit, rate limit, offline and cancel are never reported | `flow-ai` |
| Service worker error, service worker registration failure | `sw`, `flow-sw-register` |
| Storage full / blocked when saving | `flow-storage-quota` |
| Desktop main process: `uncaughtException`, `unhandledRejection`, `render-process-gone`, `child-process-gone`, `gpu-process-crashed` | `main-uncaught`, `main-promise`, `renderer-gone`, `child-gone`, `gpu-crashed` |
| iPhone/iPad wrapper | web errors as above (`platform` = `ios-wrapper`); native crashes come from Apple, see `ios-wrapper/README-IOS.md` |

Every event carries tags: `platform` (`web`, `pwa`, `electron`, `ios-wrapper`), `build` (version plus content hash), `pro` (`yes`/`no` only), `theme` (the theme id, for animation bugs), `dark`, `sw` (service worker cache version), `kind`. The `release` is `APP_VERSION`.

## Privacy guarantees (what the code enforces)

* **Never in a report**: task, note, course, file or deck text; file names; email; account id; tokens or AI keys; anything typed. Before building an event the page collects every task title, task note, course name and code, note title and the account id/email and removes any occurrence from the message (`secrets()`); on top of that a scrubber removes API-key and token patterns (the same patterns as the bug-report form, plus a few more), emails, ids, folder paths and file names, reduces every address to its page name (no query, no fragment; other sites such as a school's LMS become `[external-url]`), and replaces any quoted text that is not a plain identifier with `"…"`. A last pass scrubs the whole event, and a size cap drops breadcrumbs, then frames.
* **Identity**: the only identifier is `user.id` = a random 16-hex number made on the device (`studyboard:errid`), never the Supabase user id. Turning reports off deletes it. No cookies, no `Authorization`, no custom headers (a "simple" request with no CORS preflight; credentials are omitted and the referrer is not sent).
* **Breadcrumbs** are limited to a whitelist: tab navigations, `data-act` names, "a sheet opened", sync start/ok/fail, error classes. Anything else is dropped.
* **Consent**: Settings > **Send Anonymous Crash Reports** (default on, disclosed in the Privacy sheet, About, the first-run welcome screen, `website/privacy.html`, and the App Store label answers). It defaults **off** when the browser sends Do Not Track or Global Privacy Control (`navigator.globalPrivacyControl`, `doNotTrack`); an explicit choice always wins. Turning it off also empties the offline queue. The desktop app's main process follows the same choice (the page tells it at every start).
* **Limits**: at most 20 events per session, 3 per fingerprint per hour, 50% of `console.error` sampled out, exponential back-off (30 s doubling to 1 h) after a failed send, an offline queue of at most 20 events flushed on `online`, and reporting stops for the session after three refusals (wrong DSN). Errors inside the reporter are swallowed, it never calls `console.error`, and sending never blocks the UI.
* **Ignored**: `ResizeObserver loop`, cross-origin `Script error.`, extension-injected scripts, aborted fetches, generic network failures (`Failed to fetch`, Safari `Load failed`, which includes the user's own LMS requests), and errors whose stack has only other sites' frames.

Known limits: free-text from `console.error` and from error messages is redacted by rules, not understood. A rare message could still carry a short word from user text, which is why quoted text is removed and why messages are capped at 240 characters. Sentry sees the sender's IP address unless you turned on "Prevent Storing of IP Addresses" (step 2). Native minidumps from the desktop app (Electron `crashReporter`) can contain memory fragments, so they are **off** unless you set `STUDYBOARD_MINIDUMP_URL` when running `prepare.js` (use Sentry's minidump endpoint), the build is not the Mac App Store build, and crash reports are on.

## Reading events

* **Issues** groups events by the app's fingerprint (error class plus the top three frames). Open an issue: the message, the stack, the tags (filter by `platform`, `pro`, `theme`, `build`), the breadcrumbs (what the app was doing: tab, actions, sync status) and the count of anonymous installs.
* Useful searches: `release:1.13.0`, `platform:ios-wrapper`, `kind:flow-sync`, `theme:aurora is:unresolved`.
* **Alert rules to create** (Alerts > Create Alert > Issues): (1) *A new issue is created* in `environment:production` > email you; (2) *An issue changes state from resolved to unresolved* (a regression) > email; (3) *More than 20 events in an issue in 1 hour* > email. Keep the notification volume low: the free tier allows about 5,000 events a month, and the app already caps itself.
* In Sentry, set **Inbound Filters** to *Filter out events from localhost* and *Legacy browsers* to save quota.

## Reading a stack (build id and line numbers)

The app is one inline script, so stack frames look like `renderCard  index.html:30412:9`. The `build` tag (`1.13.0+3fa91c2b07de`) is the version plus a SHA-256 prefix of the exact file shipped, so the line number can be matched to that file:

```bash
node build-id.js                                   # prints the id of the current index.html
node build-id.js --write deploy/index.html         # website: writes a stamped copy (BUILD_ID filled in); line numbers do not change
node build-id.js --check shipped/index.html        # prints the stamped id and whether it matches the file's content
node prepare.js                                    # desktop and iOS: stamps app/index.html (or ios-www/index.html) for you
```

To investigate: check out the release tag (`git checkout v1.13.0`), run `node build-id.js` and confirm the id equals the event's `build` (if it does not, the source differs from what shipped), then `sed -n '30412p' index.html`. For desktop and iOS builds, line numbers refer to the staged `app/index.html` (which can differ from the source by a few lines because `prepare.js` rewrites the font and library tags): `node build-id.js --check app/index.html`, then look at that file. Keep the staged `index.html` of each store build with the release (or rebuild from the tag with the same dependencies).

## Optional: self-hosted path (Supabase) instead of Sentry

1. Supabase > SQL Editor: run `supabase-error-reports.sql`. It creates `client_errors` with **RLS enabled and no policies** (the app can neither read nor write it), a rate-limit function, a `client_errors_summary` view for you, and a daily 30-day clean-up with pg_cron when available (turn on Database > Extensions > pg_cron, then run the file again; otherwise run `select public.client_errors_purge();` now and then).
2. Deploy `supabase-functions/error-ingest/index.ts` as an Edge Function named `error-ingest` with **Verify JWT OFF** (it checks everything itself: 24 KB cap, strict schema, 30 reports an hour per anonymous id, 60 per hashed network address, 500 an hour overall, no new rows once the table holds 20,000 (the 30-day clean-up makes room), text scrubbed again, unknown fields dropped, service-role insert only). Optional secret `ERROR_INGEST_SALT`.
3. In `index.html` set `supabaseFallback: true` (leave `dsn: ""`). With a DSN present, the DSN is always used.
4. Read: `select * from public.client_errors_summary limit 30;` and `select * from public.client_errors where fingerprint = '...' order by created_at desc limit 20;`.

The `build`, `frames` and `crumbs` columns are stored so the same stack-matching steps apply.

## How to turn it off

* **A person**: Settings > Send Anonymous Crash Reports.
* **For everyone**: leave `dsn: ""` and `supabaseFallback: false` (the shipped default). The privacy manifests (`build-resources/*/PrivacyInfo.xcprivacy`), the App Store label and the Privacy text then over-declare: remove the Crash Data / Performance Data entries and the "Anonymous crash reports" paragraph if you never turn it on.
* **Kill switch after release**: delete the Sentry project key (Client Keys > disable). The app sees refusals, stops sending for the session and drops its queue.

## Tests

`node tests/error-report.test.js` (scrubber, fingerprints, rate limiting, back-off, queue, envelope format, DSN parsing, build id, the `error-ingest` schema check, and the main-process reporter against fake Electron objects) and `node tests/error-report.pw.js` (browser: mock Sentry endpoint, empty DSN, toggle and persistence, Do Not Track / Global Privacy Control, no personal data in payloads, offline queue and back-off, CSP violations, Supabase fallback).
