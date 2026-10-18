# Studyboard School Sync (browser extension)

Keeps the Studyboard website (studyboardapp.com) up to date with a student's Canvas, Brightspace (D2L) or Blackboard Learn, automatically. It reads the same things as the desktop app and the phone apps: courses, due dates, submissions (late, missing, extensions), grades, feedback and rubrics, announcements, the teaching team, the syllabus and, for Canvas, the Inbox.

One source, four stores: Chrome Web Store, Microsoft Edge Add-ons (same package as Chrome), Firefox Add-ons (AMO) and, for Safari, Apple's App Store (see [Safari](#safari)). Store steps and listing text are in [STORE-LISTING.md](STORE-LISTING.md).

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
| `extension/build/safari/` | Unpacked, for Safari: `scripts/make-safari-app.sh` makes the Xcode project from it (see [Safari](#safari)) |
| `extension/dist/studyboard-school-sync-<version>-firefox.zip` | Upload to AMO |
| `extension/dist/studyboard-school-sync-<version>-safari.zip` | The Safari folder, zipped, to copy to a Mac |
| `extension/dist/studyboard-school-sync-<version>-source.zip` | AMO's "source code" upload (the build makes `harvest.js` from `lms.js`) |

`build/` and `dist/` aren't committed. Rebuild after any change to `lms.js`, so the extension reads exactly what the apps read. Bump `version` in `extension/src/manifest.json` for every store upload, since each store refuses a version it already has.

Store pictures (`extension/store/`): run `node tests/extension.e2e.js`, then `node scripts/extension-store-assets.js`.

## Safari

Safari runs the same extension, but only inside an app: a small Mac app (and iPhone/iPad app) that carries it. Apple's tools make that app, so this part needs a **Mac with Xcode** (free from the App Store).

**Try it on your own Mac (free, no paid Apple account):**

1. Get this repository on the Mac, then run `bash scripts/make-safari-app.sh`. It builds the extension and makes `extension/safari-app/`, an Xcode project for macOS, iPhone and iPad.
2. Open `extension/safari-app/Studyboard School Sync/Studyboard School Sync.xcodeproj` in Xcode.
3. For each target, under **Signing & Capabilities**, set **Team** to your Apple ID (Xcode, Settings, Accounts, add it there first). A free Apple ID is fine for this.
4. Pick the **Studyboard School Sync (macOS)** scheme and press **Run**. A small app opens and points you to Safari.
5. In Safari: **Settings, Advanced**, tick **Show features for web developers**. Then the **Develop** menu, **Allow Unsigned Extensions** (Safari turns this off when it quits, so do it again after a restart).
6. **Safari, Settings, Extensions**: turn on **Studyboard School Sync**. Click its toolbar button to connect a school site. When Safari asks, choose **Always Allow on This Website** (the default, "for one day", stops the hourly sync the next day).
7. Open studyboardapp.com in Safari: Studyboard picks up what was read, as in Chrome and Firefox.

On an iPhone or iPad: plug it in, pick the **(iOS)** scheme and your device in Xcode, press Run, then **Settings, Apps, Safari, Extensions** on the device. With a free Apple ID the app stops opening after 7 days; press Run again to renew it.

After a change to `lms.js` or `extension/src/`: run `node scripts/build-extension.js` and build again in Xcode. The project points at `extension/build/safari/` rather than copying it. Commit `extension/safari-app/` once it's made, so your signing settings are kept.

**Publishing (needs the Apple Developer Program, $99 a year):** in Xcode, **Product, Archive**, then **Distribute App** to App Store Connect, once for macOS and once for iOS. In App Store Connect, fill in the listing (the text in [STORE-LISTING.md](STORE-LISTING.md) works), the privacy policy link (https://studyboardapp.com/website/privacy.html) and the privacy answers (the same data as Firefox's `data_collection_permissions`: website content, names and emails of teaching staff, Canvas messages; none of it is collected by you, it stays in the browser and the student's own Studyboard). The reviewer notes for Chrome apply here too. Then fill in `EXT_STORE.safari` in `index.html` with the App Store link.

What's different in the Safari build (`manifests()` in `scripts/build-extension.js`): a non-persistent background script instead of a service worker (Safari on iPhone and iPad requires it), no `externally_connectable` (the website uses `relay.js`, as with Firefox), and Safari 17 or newer. Two small fallbacks in the shared code cover Safari: reading inside an open school tab uses the extension's own world on that page if the page's world isn't allowed, and the popup doesn't need the windows API, which Safari on iPhone lacks. Safari may close the popup while it asks for a site's permission; the background finishes connecting when the permission arrives, as for Firefox.

To check on the Mac (not covered by the automated tests, which run in Chromium): connecting a site, a background read (Safari's tracking protection may keep the school's sign-in from the background; the read then runs in an open tab of the school site, which works), the hourly timer, and that studyboardapp.com shows the data.

## How it works

```
school site ──GET, the browser's own sign-in──▶ background.js (harvest.js from lms.js, then cleanHarvest)
                                                   │ chrome.storage.local  "result:<platform>"
studyboardapp.com ◀──window.postMessage── relay.js ┘
   └─ index.html: extImport() → the same cleaning (cleanHarvest) and import (importGrab) as the desktop app
```

- **Permissions.** `storage`, `alarms`, `scripting` and `activeTab` are needed at install. School sites are `optional_host_permissions`: nothing is readable until the student connects a site in the popup and the browser asks them to allow that one site. `relay.js` runs only on studyboardapp.com.
- **Reading.** On a timer (every hour by default, 15 minutes to 12 hours), when the student opens the connected site, and on Sync Now. It reads in the background first. If that read isn't signed in (some single sign-on setups don't send their cookies to an extension), it runs the same `harvest.js` inside an open tab of the school site, the way the bookmark does. Every request is a GET to the connected site only: the background's fetch refuses any other address, including a "next page" link to another site.
- **No remote code.** Everything the extension runs is in the package. `harvest.js` is generated at build time from `lms.js` and isn't minified. Nothing is evaluated from text (`tests/extension.test.js` checks).
- **Into Studyboard.** `relay.js` posts the stored results to the page. The web app (`index.html`, "The Studyboard School Sync browser extension") treats them as untrusted: it cleans them again for the address they claim, imports each read once, and opens the usual review the first time. The page can only ask the extension for its data or for a sync now.
- **Talking to the website.** Two ways, both offering only "what was read" and "sync now": `relay.js` (a content script on studyboardapp.com, used by today's website and by Firefox) and, from 1.0.1 on Chrome and Edge, `externally_connectable` (the page calls `chrome.runtime.sendMessage(extensionId, {type: "get" | "sync"})`; `background.js`, `onMessageExternal`). The second needs no content script, so once the website uses it, a later version can drop `relay.js` from the Chrome build and install with no "Read and change your data on studyboardapp.com" warning. Plan: the website asks the extension directly when it can and falls back to `relay.js`; after that is live, a later version drops the relay for Chrome and Edge.
- **Firefox.** Firefox may close the popup while it asks for a permission, so the popup first tells the background which site is pending, and the background finishes connecting when the permission arrives (`permissions.onAdded`).

## Files

| File | |
|---|---|
| `src/manifest.json` | The Chrome manifest. The Firefox and Safari ones are derived from it in `scripts/build-extension.js` (Firefox: background script, add-on id, minimum version and declared data collection; Safari: non-persistent background script and minimum version). |
| `src/background.js` | Schedules, reads, stores, sets the toolbar badge, answers the popup and relay |
| `src/popup.html/.css/.js` | The toolbar popup: connect a site, status, Sync Now, how often, remove |
| `src/relay.js` | Content script on studyboardapp.com only |
| `src/icons/` | 16, 32, 48 and 128 px icons from the app icon |

## Tests

- `node tests/extension.test.js` runs the built background in a sandbox with fake browser APIs and fake school sites. It checks: platform detection, the background read, GET and same-site only, the badge, what a web page may ask for, removing a site, and the store rules (no eval, Firefox manifest).
- `node tests/extension.e2e.js` loads the real build in Chromium, connects a stand-in Canvas, reads it, and checks that Studyboard on studyboardapp.com imports it (tasks, done-when-submitted, grade, feedback, instructor, class times).
- For Firefox: `npx addons-linter extension/dist/*-firefox.zip` should report 0 errors and 0 warnings.
