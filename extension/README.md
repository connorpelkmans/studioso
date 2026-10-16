# Studyboard School Sync (browser extension)

Keeps the Studyboard website (studyboardapp.com) up to date with a student's Canvas, Brightspace (D2L) or Blackboard Learn, automatically. It reads the same things as the desktop app, the phone apps and the website's Studyboard bookmark: courses, due dates, submissions (late, missing, extensions), grades, feedback and rubrics, announcements, the teaching team, the syllabus and, for Canvas, the Inbox.

One source, three stores: Chrome Web Store, Microsoft Edge Add-ons (same package as Chrome) and Firefox Add-ons (AMO). Store steps and listing text are in [STORE-LISTING.md](STORE-LISTING.md).

## Build

```
node scripts/build-extension.js        # or: npm run build:extension
```

Node 18 or newer, nothing to install. It writes:

| Path | What |
|---|---|
| `extension/build/chrome/` | Unpacked, for Chrome and Edge (`chrome://extensions`, Developer mode, **Load unpacked**) |
| `extension/build/firefox/` | Unpacked, for Firefox (`about:debugging`, This Firefox, **Load Temporary Add-on**, pick `manifest.json`) |
| `extension/dist/studyboard-school-sync-<version>-chrome.zip` | Upload to the Chrome Web Store and to Edge Add-ons |
| `extension/dist/studyboard-school-sync-<version>-firefox.zip` | Upload to AMO |
| `extension/dist/studyboard-school-sync-<version>-source.zip` | AMO's "source code" upload (the build makes `harvest.js` from `lms.js`) |

`build/` and `dist/` aren't committed. Rebuild after any change to `lms.js`, so the extension reads exactly what the apps read. Bump `version` in `extension/src/manifest.json` for every store upload, since each store refuses a version it already has.

Store pictures (`extension/store/`): run `node tests/extension.e2e.js`, then `node scripts/extension-store-assets.js`.

## How it works

```
school site ──GET, the browser's own sign-in──▶ background.js (harvest.js from lms.js, then cleanHarvest)
                                                   │ chrome.storage.local  "result:<platform>"
studyboardapp.com ◀──window.postMessage── relay.js ┘
   └─ index.html: extImport() → the same cleaning and import as the bookmark (importGrab)
```

- **Permissions.** `storage`, `alarms`, `scripting` and `activeTab` are needed at install. School sites are `optional_host_permissions`: nothing is readable until the student connects a site in the popup and the browser asks them to allow that one site. `relay.js` runs only on studyboardapp.com.
- **Reading.** On a timer (every hour by default, 30 minutes to 12 hours), when the student opens the connected site, and on Sync Now. It reads in the background first. If that read isn't signed in (some single sign-on setups don't send their cookies to an extension), it runs the same `harvest.js` inside an open tab of the school site, the way the bookmark does. Every request is a GET to the connected site only: the background's fetch refuses any other address, including a "next page" link to another site.
- **No remote code.** Everything the extension runs is in the package. `harvest.js` is generated at build time from `lms.js` and isn't minified. Nothing is evaluated from text (`tests/extension.test.js` checks).
- **Into Studyboard.** `relay.js` posts the stored results to the page. The web app (`index.html`, "The Studyboard School Sync browser extension") treats them like a bookmark code: it cleans them again for the address they claim, imports each read once, and opens the usual review the first time. The page can only ask the extension for its data or for a sync now.
- **Talking to the website.** Two ways, both offering only "what was read" and "sync now": `relay.js` (a content script on studyboardapp.com, used by today's website and by Firefox) and, from 1.0.1 on Chrome and Edge, `externally_connectable` (the page calls `chrome.runtime.sendMessage(extensionId, {type: "get" | "sync"})`; `background.js`, `onMessageExternal`). The second needs no content script, so once the website uses it, a later version can drop `relay.js` from the Chrome build and install with no "Read and change your data on studyboardapp.com" warning. Plan: the website asks the extension directly when it can and falls back to `relay.js`; after that is live, 1.0.2 drops the relay for Chrome and Edge.
- **Firefox.** Firefox may close the popup while it asks for a permission, so the popup first tells the background which site is pending, and the background finishes connecting when the permission arrives (`permissions.onAdded`).

## Files

| File | |
|---|---|
| `src/manifest.json` | The Chrome manifest. The Firefox one is derived from it in `scripts/build-extension.js`: background script, add-on id, minimum version and declared data collection. |
| `src/background.js` | Schedules, reads, stores, sets the toolbar badge, answers the popup and relay |
| `src/popup.html/.css/.js` | The toolbar popup: connect a site, status, Sync Now, how often, remove |
| `src/relay.js` | Content script on studyboardapp.com only |
| `src/icons/` | 16, 32, 48 and 128 px icons from the app icon |

## Tests

- `node tests/extension.test.js` runs the built background in a sandbox with fake browser APIs and fake school sites. It checks: platform detection, the background read, GET and same-site only, the badge, what a web page may ask for, removing a site, and the store rules (no eval, Firefox manifest).
- `node tests/extension.e2e.js` loads the real build in Chromium, connects a stand-in Canvas, reads it, and checks that Studyboard on studyboardapp.com imports it (tasks, done-when-submitted, grade, feedback, instructor, class times).
- For Firefox: `npx addons-linter extension/dist/*-firefox.zip` should report 0 errors and 0 warnings.
