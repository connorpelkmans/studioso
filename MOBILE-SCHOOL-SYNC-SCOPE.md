# Full school site sync on iOS and Android: scope

Goal: the iOS and Android apps get the same school information as the desktop app (courses, due dates, submissions, grades, announcements, calendar, file downloads, Canvas inbox) for Brightspace, Canvas and Blackboard, not only the calendar link.

Status: **built, but untested on any device.** The shared layer is done and tested here; the Swift and Kotlin plugins are written but were never compiled or run (no Xcode, Android Studio, emulator or school account was available).

| Piece | State |
| --- | --- |
| `lms-mobile.src.js` + `scripts/build-lms-mobile.js` -> `lms-mobile.js` (same harvest scripts and result cleaning as desktop, copied from `lms.js` at build time) | Done. `tests/lms-mobile.test.js` (11 checks) and `tests/lms-mobile.e2e.js` (7 checks, real page, stand-in plugin running the real Brightspace harvest against a fake school) pass. |
| `index.html`: `lmsBridge()` so the desktop bridge or the phone bridge feeds the same sync, grades, announcements, files and Canvas inbox code; 10 minute checks; Sync Now; copy for phones | Done and tested. |
| `prepare.js`: builds `lms-mobile.js` into staged iOS/Android folders and loads it | Written; not run (needs `npm ci`). |
| `ios-wrapper/native/StudyboardLms.swift` | Written, UNTESTED, never compiled. |
| `android-wrapper/.../StudyboardLms.kt` | Written, UNTESTED, never compiled. |
| READMEs: plugin registration and store notes | Done. |

Original plan follows.

## 1. How the desktop app does it today

`lms.js` (Electron main process) and `preload.js` expose `window.studiosoDesktop.lms` to the page:

| Call | What it does on desktop |
| --- | --- |
| `connect(id, host)` | Opens a visible window on the school's own sign-in page (SSO and MFA included). Polls until a "who am I" script succeeds. Studyboard never sees the password. |
| `sync(id, host, opts)` | Opens a hidden window in the same private cookie store, loads a small page on the school's origin, then runs a **harvest script** inside it (`bsHarvest`, `cvHarvest`, `bbHarvest`). The script makes same-origin GET requests to the platform's own APIs and returns plain JSON. Read only. |
| `file(id, host, spec)` | Brightspace: a harvest-style script returns the file as base64. Canvas: script finds the URL, then a hidden window downloads it. |
| `mail(id, host, spec)` | Canvas inbox, same pattern. |
| `feed(id, url)` | Fetches the calendar link with Node networking. |
| `signOut(id)` | Clears that platform's cookie store. |

`index.html` already does everything above that: planning the sync, mapping courses, applying changes, grades, announcements, AI scanning of announcements. It only needs `bsDesk()` (`window.studiosoDesktop && window.studiosoDesktop.lms`) to be true and the six calls to exist.

Key point: **the harvest scripts are plain JavaScript strings that run inside a page on the school's origin.** They do not use Electron. They can run unchanged in a WKWebView (iOS) or Android WebView.

## 2. Proposed design

Add a native "school session" layer per platform and present it to the web layer through the **same interface** as desktop.

1. **JS shim** (`ios-wrapper/native-bridge.js`, shared with Android): when running inside Capacitor and the native plugin `StudyboardLms` exists, define `window.studiosoDesktop.lms = {connect, sync, file, mail, feed, signOut}` that forwards to the plugin. Then `bsDesk()` is true and all existing sync code runs. (Check other `DESK` uses so the shim does not switch on unrelated desktop-only features; the shim should define only the `lms` member, and `bsDesk()` should be changed to look at `window.studiosoDesktop.lms` only, which it already does in the second copy at line ~40979. The first copy at ~39951 uses `DESK && DESK.lms`; make it consistent.)
2. **Harvest source shared as data**: export the three harvest scripts and `WHO`, `BS_FILE`, `CV_FILE`, `cvMail` strings from `lms.js` into a generated `lms-scripts.json` (a build step in `prepare.js`) so desktop and mobile run identical code. `tests/lms-harvest.test.js` already runs the exact injected strings in an empty context, which keeps them self-contained.
3. **Native plugin `StudyboardLms`**
   - **iOS (Swift, Capacitor plugin):** one `WKWebView` per platform with its own persistent store (`WKWebsiteDataStore(forIdentifier:)`, iOS 17+; for iOS 15 and 16 a single shared store with per-platform cookie clearing). 
     - `connect`: present a full-screen view controller with a visible web view, a read-only address bar showing the host, and Cancel. Poll `WHO` with `callAsyncJavaScript` until it returns a user.
     - `sync` / `mail` / `file`: an off-screen web view loads `origin + ctx`, confirms the final origin matches (else `needLogin`), runs the harvest with `callAsyncJavaScript`, and returns the sanitised JSON. Port the `plain()`, `cleanHarvest()` and `cleanFile()` sanitising from `lms.js` (it is pure logic).
     - Canvas file download: `WKDownload` (iOS 14.5+) or fetch inside the page and return base64.
     - `feed`: `URLSession` with the same https-only, redirect and size rules.
     - `signOut`: remove the data store records for the host.
   - **Android (Kotlin, Capacitor plugin):** `WebView` with `CookieManager`. Android has one cookie jar per app, so per-platform separation is done by clearing cookies for that host on sign-out. Same connect, sync, file, mail and feed logic as above, using `evaluateJavascript` and a `JavascriptInterface` or `WebMessagePort` to return results. Downloads via `DownloadListener` or in-page fetch to base64.
   - **Both:** https only, hosts validated with the same `originOf()` rules (no localhost, private ranges or local suffixes), no camera, microphone or location permissions in these web views, no JavaScript bridge exposed to school pages, a plain mobile browser user agent, 150 s sync timeout, one sync at a time per platform, 50 MB file cap.
4. **Background sync:** iOS gives no reliable background web view execution. Use a normal foreground sync (on open, on resume, every 10 minutes while the app is open, plus Sync Now) and optionally `BGAppRefreshTask` for opportunistic refresh. Android can use WorkManager, but a WebView needs a foreground context, so also foreground-only in v1. Be honest in the UI: "Checks while the app is open."
5. **UI changes:** `how()` and the "can't be synced from here" message become accurate on mobile automatically. Settings copy changes from "desktop app" to "the Studyboard app (desktop, iPhone or Android)". Sign-in flows in the connect sheet need a mobile-sized explanation.

## 3. Risks and open questions (ranked)

1. **School single sign-in inside an embedded web view.** Many schools use Microsoft or Google sign-in. Google blocks OAuth sign-in in embedded web views (the "disallowed_useragent" error), and spoofing a user agent is unreliable and against Google's rules. Microsoft generally works in web views. This is the biggest unknown and can only be settled by testing with real school accounts. Fallbacks, in order of effort:
   - Canvas only: let the person paste a **personal access token** (Canvas Settings, New Access Token) when their school allows it. Studyboard would call the Canvas API directly with it. Store it in the Keychain/Keystore.
   - Use `ASWebAuthenticationSession` (iOS) or Custom Tabs (Android) for sign-in. These pass Google's check, but the app cannot read their cookies, so they only help where the platform offers OAuth with a token (Brightspace and Blackboard need an app registered by the school's admin, which most students cannot get).
   - Keep the calendar link as the universal fallback.
2. **App review.** Apple and Google both allow sign-in through a web view when the app is clear about it, never captures the password, and only reads. The desktop design already does this. The privacy manifest, App Store privacy answers and the Play Data safety form need updating: the app reads education records the student is entitled to. Review notes should explain it.
3. **Page layout and API quirks on mobile.** Some schools redirect mobile user agents to a different login or app-download interstitial. Use a desktop-class user agent for these web views and test per platform.
4. **iOS 15/16 storage separation.** Per-platform stores need iOS 17. On older systems separation is by clearing cookies per host.
5. **Memory and time limits.** A 150 s harvest across many courses in a web view can be killed if the app is backgrounded. Chunk by course (`opts.only`) and resume.
6. **Cannot be built or tested here.** This environment has no Xcode, Android Studio, emulator or school accounts. Every plugin line is untested until run on a device. The repo already marks the existing capture plugins "UNTESTED" for the same reason.

## 4. Work breakdown

| Step | Content | Rough effort (one developer with a Mac, devices and a test account per platform) |
| --- | --- | --- |
| 0. Spike | Canvas on iOS and Android: connect, who-am-I, run `cvHarvest`, return JSON through a plugin into the existing sync. Test with two schools' sign-in types (Microsoft, Google). Decide on risk 1 here. | 3 to 5 days |
| 1. Shared layer | Generate `lms-scripts.json` from `lms.js`, JS shim, make `bsDesk()` consistent, port the sanitising helpers to JS shared by both plugins where possible, unit tests. I can do most of this here. | 2 to 3 days |
| 2. iOS plugin | Swift plugin for all six calls, connect view controller, tests on device. | 5 to 8 days |
| 3. Android plugin | Kotlin plugin for the same, connect activity, tests on device. | 5 to 8 days |
| 4. Brightspace and Blackboard | Validate harvest scripts against real tenants on mobile (scripts exist, but each school's configuration differs). | 3 to 5 days |
| 5. Foreground scheduling, copy, settings, docs, privacy manifests, store review notes | | 2 to 3 days |
| 6. Token fallback for Canvas (optional) | Personal access token entry and a direct API client. | 3 to 4 days |

Total: about 4 to 6 weeks of calendar time with device testing, mostly in steps 0, 2, 3 and 4. These numbers are estimates, not measurements.

## 5. What I can do in this environment

- Step 1 completely (shared script export, JS shim, tests that the shim presents the desktop interface and that existing sync code runs against a stubbed plugin).
- Draft the Swift and Kotlin plugins as UNTESTED source templates in `ios-wrapper/native/` and `android-wrapper/`, matching the existing capture-plugin conventions, plus the README sections.
- Not possible here: compiling them, running on a device, or confirming that any school's sign-in works in a web view.

## 6. Recommendation

Do step 0 first, with Canvas, on both platforms and with the sign-in types your target schools use. If Google or Microsoft single sign-on works in the web view, the rest is mostly porting. If it does not, build the Canvas token fallback and keep the calendar link for Brightspace and Blackboard.
