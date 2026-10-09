# Publishing Studyboard in the Microsoft Store

The Windows app goes to the Store as an **MSIX package** (electron-builder's `appx` target). The Store signs the package itself, so you don't need a code-signing certificate. Installs and uninstalls are clean, and the Store delivers updates. The website's `.exe` installer stays as it is for direct downloads.

Publisher: **Connor Pelkmans (Studyboard)**, an **Individual** developer account.

## 1. Account

* Sign up at <https://developer.microsoft.com/en-us/store/register> and choose **Individual**. Company accounts are for registered legal entities (a corporation or an LLC), verified with business documents. A sole proprietor with no registered entity uses Individual. An Individual account **can't be converted to Company later**: if you form an LLC, you open a new Company account and move the app.
* **Publisher display name:** `Connor Pelkmans (Studyboard)`. It is 28 characters (the limit is 50). Microsoft refuses a name someone else already uses, or one they hold rights to. If it's refused, use `Connor Pelkmans` and change `publisherDisplayName`, `author.name` and `copyright` in `package.json` to match (`tests/msstore.test.js` checks that they agree).
* Identity verification: a government ID and a selfie. You can reserve the name and build while it's pending.

## 2. Reserve the name and copy the identity into package.json

1. Partner Center > **Apps and games** > **New product** > **MSIX or PWA app** > reserve **Studyboard**.
2. Open the product > **Product management** > **Product identity**. Copy two values into `package.json` > `build.appx`:

| Partner Center | package.json `build.appx` | Looks like |
|---|---|---|
| Package/Identity/Name | `identityName` | `12345ConnorPelkmans.Studyboard` |
| Package/Identity/Publisher | `publisher` | `CN=1A2B3C4D-…` |
| Package/Properties/PublisherDisplayName | `publisherDisplayName` | `Connor Pelkmans (Studyboard)` (already set; it must match exactly) |

3. `npm run check:msstore` must print *nothing left to fill in*. Until then the build stops on purpose, because the Store refuses a package with the wrong identity.

## 3. Build the packages

* **GitHub:** Actions > *Build Studyboard desktop app* > **Run workflow** > kind **msstore**. The artifact *Studyboard-msstore* holds `Studyboard-<version>-x64.appx` and `Studyboard-<version>-arm64.appx`. Upload both: the Store serves each PC the right one, including Windows-on-ARM laptops.
* **On a Windows PC:** `npm ci`, then `npm run dist:msstore`.
* Tiles and logos come from `build-resources/appx/` (made by `python3 tools/make-appx-assets.py` from `icon-1024.png`; re-run it if the icon changes). The listing art is in `build-resources/msstore-listing/`.
* Every update needs a higher version: change `version` in `package.json` and the `APP_VERSION` / `VERSION` constants in `index.html` (the release checklist covers this).

**Testing before you submit.** An unsigned package can't be installed by double-clicking. Either:
* use a **private audience** submission (Partner Center > Pricing and availability > Private audience), then install it from the Store on your own PC; or
* sign a copy with a self-signed certificate whose subject is exactly the `publisher` value, trust that certificate on the test PC, and run `Add-AppxPackage`.

What to try in the packaged app:
* reminders show as notifications and clicking one opens the task;
* a `studyboard://action/today` link opens the app;
* Settings > Widgets and Desktop > **Open Startup Settings** goes to Windows' Startup page, and turning Studyboard on there starts it at sign-in;
* the tray icon, the Today widget, Ctrl+Shift+Alt+C screenshots, a school sign-in window, and Documents\Studyboard filling up;
* on a PC that also has the website version installed: the "installed twice" note appears once.

## 4. The submission

**Pricing and availability:** Free. Markets: all, or the ones your terms cover.

**Properties**
* Category: **Education**.
* Privacy policy URL: `https://studyboardapp.com/website/privacy.html` (open it first and check it loads).
* Website: `https://studyboardapp.com`. Support contact: `support@studyboardapp.com`.
* "This product has in-app purchases": **Yes**. Pro is sold through the Studyboard website with Stripe. Microsoft's policy lets non-game apps use their own payment system, and Microsoft takes no fee on it. Leave the Microsoft Store in-app purchase (add-ons) section empty.
* "Accesses, collects or transmits personal information": **Yes** (account email, synced data, files).
* System requirements: Windows 10 version 1809 or later (the package's minimum), x64 or ARM64, internet for sync and AI.

**Age ratings (IARC questionnaire).** Answer it honestly. The points specific to Studyboard:
* **Users can interact or exchange content:** Yes. Study groups have chat, shared tasks and decks. Report and Block exist, and the Terms ban objectionable content.
* **Shares the user's location:** No.
* **Digital purchases:** Yes (Pro).
* **Unrestricted internet:** the school sign-in windows only open the school's own site. Links open in the browser, and the app never browses the web itself. Most developers answer No for this.
* **Generative AI:** Yes (see below).

**Store listing (English, United States)**
* Description (edit to taste):

  > Studyboard keeps every class, deadline, note and file in one place. Today's Plan helps you choose what to do next, flashcards and quizzes help you study, and study groups let you plan with classmates. It works offline, keeps a copy of everything in a Studyboard folder on your PC, and syncs with your free account when you sign in.
  >
  > Optional AI features (Google Gemini, Anthropic Claude or OpenAI ChatGPT) use your own API key: they summarize files, answer questions about your own notes, plan your day and make flashcards. AI answers are written by the model you choose from what you send it, can be wrong, and can be reported from the answer itself or in Settings, AI Features. Studyboard Pro is an optional subscription bought on the Studyboard website.

* Features (short lines): Task board and Today's Plan · Courses, grades and syllabus import · Flashcards and practice quizzes · Study groups and shared decks · Brightspace, Canvas and Blackboard sync (read-only) · Reminders, tray icon and a Today widget · Screenshot to task (Ctrl+Shift+Alt+C) · Optional AI with your own key.
* **Screenshots:** at least 1, up to 10, at least 1366×768 (1920×1080 recommended). The light and dark board images from the website (`website/assets/screens/`) are a good start; capture the rest from the packaged app.
* **Store logos:** `build-resources/msstore-listing/BoxArt-1080x1080.png` (1:1), `Poster-720x1080.png` (2:3) and `Logo-300x300.png`.

**Notes for certification** (paste into the submission's notes field):

> Studyboard works without an account. Sign-in is optional and only needed to sync between devices. AI features need the tester's own free Google Gemini API key (Settings > AI Features). Without one, AI buttons explain how to add a key, and nothing else is affected. Closing the window keeps Studyboard running in the notification area for reminders; a tip says so, and Quit Studyboard on the tray icon closes it (Settings > Widgets and Desktop can turn this off). Start-at-sign-in is declared as a startup task that is off until the user turns it on in Windows Settings > Apps > Startup. The global shortcut Ctrl+Shift+Alt+C starts a screenshot to turn part of the screen into a task, and can be turned off in Settings > Quick Capture. Pro is an optional subscription bought on our website (third-party payment, non-game app).

## 5. What the Store build does differently (main.js, `IS_MSSTORE`)

| | Direct download (.exe) | Microsoft Store (MSIX) |
|---|---|---|
| App ID for notifications | `com.studioso.app` | from the package (not overridden) |
| `studyboard://` links | registered in the registry at start | declared in the package manifest |
| Start at sign-in | a toggle in Settings | a startup task, off by default; Settings opens Windows' Startup page |
| Updates | none (download a new installer) | automatic, from the Store |
| Buying Pro | website (Stripe) | the same (`studiosoDesktop.store === "msstore"` buys like `"direct"`) |
| Both installed | — | a one-time note suggests removing the website version (data stays) |

Uninstalling the Store app removes its settings and keychain-protected AI keys. The Studyboard folder in Documents stays.
