# iOS quick capture: Siri, Shortcuts, share sheet (source templates + test plan)

> **Verification status: UNTESTED.** Every Swift file here was written without a Swift toolchain, Xcode, an iOS SDK or a device (the sandbox is Linux). `swiftc -parse` was not available either, so even the syntax is unchecked. Treat the code as a careful first draft that follows long-stable App Intents / Keychain / URLSession / NSExtension APIs, and expect to fix compile errors. Anything about **iOS 26 / 27** (Apple Intelligence Siri) is **not** verified: I had no documentation access for it. Never write "works with Siri" in release notes until section 5 below has been run on a device.

## 1. What is here

| File | Target | Role |
| --- | --- | --- |
| `SBCapture.swift` | App + ShareExtension | Shared core: Keychain token/endpoint (shared access group), HTTPS POST (8 s, Idempotency-Key), App Group file queue. Constants match `../../capture-contract.json`. |
| `AddTaskIntent.swift` | App | `AddTaskIntent: AppIntent` (`task` required with `requestValueDialog`, optional `due`, `course`; `openAppWhenRun = false`). |
| `OpenCaptureIntent.swift` | App | "Take a photo for Studyboard": opens the app, queues a `route` item for `studyboard://capture?photo=1`. |
| `StudyboardShortcuts.swift` | App | `AppShortcutsProvider` with the spoken phrases. |
| `StudyboardPlugins.swift` | App | Capacitor plugins `StudyboardCaptureToken` (`save`, `clear`) and `StudyboardSharedQueue` (`drain`, `ack`). |
| `MainViewController.swift` | App | Registers the two plugins (Capacitor 6/7 style, verify for your version). |
| `ShareExtension/ShareViewController.swift` | ShareExtension | The share sheet entry. |
| `ShareExtension/Info.plist.snippet.plist`, `ShareExtension.entitlements`, `PrivacyInfo.xcprivacy` | ShareExtension | Extension configuration (the Info.plist needs `SBKeychainAccessGroup`, not only `NSExtension`). |
| `../native-bridge.js` | web | `saveCaptureToken`, `clearCaptureToken`, shared-queue drain on start and `appStateChange`, deep-link forwarding to `SBCAPTURE.handleUrl`. |

## 2. Wiring it into the Xcode project (once, on a Mac)

1. `npx cap add ios`, then merge `Info.plist.additions.plist` and the entitlements as README-IOS.md says.
2. **App target > Signing & Capabilities**: add **App Groups** with `group.com.studioso.app` and **Keychain Sharing** with `com.studioso.app.shared` (Xcode stores it as `$(AppIdentifierPrefix)com.studioso.app.shared`). Compare with `../App.entitlements.template.plist`. If your bundle id differs, change `SBCaptureConfig.appGroupID`, `keychainService`, and the Info.plist `SBKeychainAccessGroup` value.
3. Drag `SBCapture.swift`, `AddTaskIntent.swift`, `OpenCaptureIntent.swift`, `StudyboardShortcuts.swift`, `StudyboardPlugins.swift`, `MainViewController.swift` into the **App** group (target membership: App). In `Main.storyboard` set the view controller's class to `MainViewController` (Module `App`).
4. **File > New > Target > Share Extension**, name `StudyboardShare`, bundle id `com.studioso.app.share`, embed in App. Replace its `ShareViewController.swift` with `ShareExtension/ShareViewController.swift`, delete the generated storyboard, merge **every top-level key** of `ShareExtension/Info.plist.snippet.plist` into the extension's Info.plist (the `NSExtension` block replaces the generated one, and **`SBKeychainAccessGroup` must be added too**: without it the extension looks in a different Keychain group, cannot see the token, and every share silently ends up queued as "not configured"; check the built `StudyboardShare.appex/Info.plist`), set its entitlements to `ShareExtension.entitlements` (same App Group + Keychain group), add `PrivacyInfo.xcprivacy`, and tick the extension target for `SBCapture.swift`. Deployment target iOS 16+ for both.
5. `npm i` the plugins in README-IOS.md section 2, copy `native-bridge.js` as usual, `npx cap sync ios`.
6. **The token handoff (cap-server's Settings UI must do this).** When the person creates (or regenerates) a capture token, and on every app start while one exists, call:

   ```js
   window.StudyboardNative?.saveCaptureToken?.(token, SUPABASE_URL);   // resolves true/false; SUPABASE_URL = "https://<project>.supabase.co"
   ```

   and when they revoke it or sign out: `window.StudyboardNative?.clearCaptureToken?.()`. The bridge validates the token shape (`^[A-Za-z0-9._~+/-]{16,512}$`) and that the URL is `https://*.supabase.co`, stores only the derived `https://<host>/functions/v1/capture-task`, and the native side validates it again. Outside the native wrappers these calls do not exist, hence the `?.`.
7. **The queue handoff (cap-core).** `native-bridge.js` calls `window.SBCAPTURE.ingest(item)` for every queued item (`{id, kind:"task", text, due, course, source, createdAt, image?}` where `image` is a `data:image/jpeg;base64,...` URL) and acks it unless `ingest` returns `false` or rejects. Route items (`kind:"route"`) call `SBCAPTURE.handleUrl(url)` if younger than 2 minutes. If cap-core's `ingest` has a different signature, adapt `drainSharedQueue` in the bridge (one place).

## 3. Decisions and deviations from the brief (read these)

* **Queue files are decoded tolerantly.** `PendingCapture` has a hand-written `init(from:)` (every key optional, defaults otherwise) and `pendingItems()` takes the id from the file name, so an older or hand-written queue file is delivered and acked instead of being skipped forever.

* **Keychain group.** A Keychain access group is `<TeamID>.<name>`; I used `$(AppIdentifierPrefix)com.studioso.app.shared` and a build-time Info.plist key instead of the literal `group.<bundle>`. (App Group ids can reportedly also act as access groups; I could not confirm it, so I used the plain, documented form.) There is **no App Group UserDefaults fallback**: it would put the token in a plain file. If Keychain Sharing is not set up the intent saves the task to the queue and says so.
* **Accessibility `AfterFirstUnlockThisDeviceOnly`** so Siri works with the phone locked after the first unlock since boot; the item never leaves the device (no backup, no iCloud). Whether Siri may run the intent while locked depends on iOS (`authenticationPolicy`, iOS 17+: verify) and the person's Siri settings.
* **Failure fallback.** The brief asked for "queue, then open `studyboard://add?...`". A silent intent cannot open the app on every iOS version (`OpenURLIntent` / `requestToContinueInForeground` are newer APIs and I did not use APIs I cannot verify). It queues the item (App Group file) and tells the person it will be added the next time the app opens; the bridge drains the queue on launch/resume. If you want the foreground variant, add it for iOS 18+ after checking the docs.
* **Share extension and images.** Extensions cannot reliably open the host app (`UIApplication.shared.open` is unavailable; the responder-chain trick is fragile and review-risky). Text and URL shares post directly; images are queued and finished when the person opens Studyboard. The extension says so.
* **No `NSSiriUsageDescription`**: that key belongs to the old SiriKit/INIntents extensions. App Intents / App Shortcuts need no usage string. Microphone permission is not needed either (Siri hears the person, not the app).
* **App Shortcuts phrases** must contain `\(.applicationName)` and can only interpolate `AppEntity`/`AppEnum` parameters, not a free-form `String`: so "Add a task to Studyboard" works and Siri then asks "What's the task?". Phrases are in code; add `AppShortcuts.strings` only to localise them. Newer Siri / Apple Intelligence may accept the task inside the sentence through App Intents domains or entity-based parameters: **verify** against the iOS 26/27 SDK before building on it. The code deliberately uses only the stable form.
* **Privacy manifest.** The native code uses no `UserDefaults` and reads no file timestamps, so `build-resources/ios/PrivacyInfo.xcprivacy` needs no new required-reason entry. If you later add App Group `UserDefaults(suiteName:)`, add reason `1C8F.1` (verify the current list in Apple's "Describing use of required reason API" page). The extension has its own empty manifest.

## 4. Where it shows up

App Intents are indexed from the built binary: no `Intents.intentdefinition`, no extra Info.plist keys. After installing, the intent appears in: the **Shortcuts** app (App Shortcuts section and the action list under Studyboard), **Spotlight** (suggested shortcuts), **Siri** (the phrases), the **Action Button** (Settings > Action Button > Shortcut), and **Control Center / Lock Screen** (iOS 18+ lets a *shortcut* be added as a control; a dedicated `ControlWidget` is a separate WidgetKit extension, not included).

## 5. Test plan (run on a real device; the simulator's Siri is not representative)

Preconditions: signed-in build with capture enabled in Settings (token saved; check by creating a task by voice, below). Use TestFlight or a debug build.

| # | Action | Expected | Result |
| --- | --- | --- | --- |
| 1 | Install, open the app, sign in, create the capture token in Settings. | `saveCaptureToken` resolves `true` (Safari Web Inspector console). Keychain item exists (Xcode > Debug > Keychain not shown; use the intent in test 3). | |
| 2 | Settings > Siri (Apple Intelligence & Siri) > Apps > Studyboard (name varies by iOS version). | App listed; "Add Task" visible under Shortcuts. | |
| 3 | Shortcuts app > search "Studyboard". Run "Add Task". | Prompts "What's the task?", add "bio lab report friday"; result dialog "Added to Studyboard: ..."; the task appears on the board after refresh/open. | |
| 4 | "Hey Siri, add a task to Studyboard." | Siri asks "What's the task?"; answer; spoken confirmation; app NOT opened. | |
| 5 | Same with "Add to Studyboard" and "Capture in Studyboard". | Same as 4. If Siri says it can't find it, note exact wording and iOS version. | |
| 6 | Airplane mode, repeat 4. | Spoken "saved on your phone"; a JSON file in the App Group queue; turn the network on, open the app: the task appears once (Idempotency-Key). | |
| 7 | Remove the token (Settings > revoke), repeat 4. | "I saved ... Open Studyboard once and turn on Quick Capture ...". | |
| 8 | "Hey Siri, take a photo for Studyboard." | App opens into the photo capture flow. | |
| 9 | Spotlight: type "Add Task". Action Button: assign the shortcut. Lock Screen/Control Center (iOS 18+): add the shortcut control. | Each runs test 3's flow. | |
| 10 | Safari > Share > Add to Studyboard (a page). | "Added to Studyboard"; task text = title + URL. | |
| 11 | Notes > select text > Share > Add to Studyboard. | Task added from the text. | |
| 12 | Photos > Share > Add to Studyboard. | "Saved. Open Studyboard to finish adding the photo."; open the app: the capture sheet gets the photo (needs cap-core `ingest` with `image`). | |
| 13 | Siri with the phone locked (after one unlock since boot). | Record whether it asks to unlock or runs. Either is acceptable; note it. | |
| 14 | iOS 26 and the iOS 27 beta: repeat 4 and 5 with Apple Intelligence Siri on; also try speaking the task in the sentence ("add bio lab report to Studyboard"). | Record exactly what happens; do not assume the in-sentence form works. | |
| 15 | Xcode > Product > Archive > Generate Privacy Report. | No missing required-reason API warnings for the App and the extension. | |

If test 2 does not list the app: delete the app, reinstall, wait a minute (App Intents metadata is extracted at install), and check the build log for the `appintentsmetadataprocessor` step; the intents must be in the **App** target (not a Swift package unless you follow Apple's package-based metadata rules).
