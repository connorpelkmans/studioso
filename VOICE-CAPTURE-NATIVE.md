# Voice and native quick capture: Siri, Gemini (Pixel and Samsung), share sheet

**Owner requirement:** add tasks from the iOS share sheet and a Siri shortcut, and by talking to Siri (iOS 27) and the AI assistants on Samsung and Pixel.

> **Status: NOTHING IN THIS DOCUMENT HAS BEEN RUN ON A DEVICE.** The native sources (Swift, Kotlin, XML) were written on a Linux sandbox with no Xcode, no Android Studio, no Swift or Kotlin compiler, and no documentation for iOS 27 or the newest Android APIs. The shared contract, the JS bridge and the endpoint contract are tested (`node tests/capture-contract.test.js`); the native code is not. **Do not tell users that Siri, Gemini or Galaxy AI "work" until the checklist at the bottom is done.**

## 1. Support matrix

"Status" is what I can honestly say today. "Wrapper" = needs the Capacitor iOS/Android app (the web/PWA alone cannot register with an assistant). "Token" = needs the capture token created in Settings (cap-server) and saved natively with `StudyboardNative.saveCaptureToken`.

| Platform | Entry point | Wrapper? | Token? | Silent (no app open)? | Status |
| --- | --- | --- | --- | --- | --- |
| iOS 16+ | "Hey Siri, add a task to Studyboard" (App Intents `AddTaskIntent`, Siri asks "What's the task?") | yes | yes | yes | untested here; API forms are the long-stable ones |
| iOS 16+ | Shortcuts app / Spotlight / Action Button / Control (iOS 18+) running the same intent | yes | yes | yes | untested here |
| iOS 26 / 27 | Apple Intelligence Siri using the same App Intent; task spoken inside the sentence | yes | yes | yes | **unknown**: needs the iOS 27 SDK docs and a device. In-phrase free-text parameters are not supported by App Shortcuts; richer mechanisms may exist: verify |
| iOS 16+ | "Take a photo for Studyboard" (`OpenCaptureIntent`) | yes | no | no (opens app) | untested here |
| iOS 16+ | Share sheet: text/URL (Safari, Notes...) | yes | yes | yes | untested here |
| iOS 16+ | Share sheet: image (Photos) | yes | no | no: finish in app | untested here |
| iOS (any) | `studyboard://add?text=...` / `studyboard://capture?photo=1` (links, QR, other apps) | yes | no | no (opens app) | needs cap-core router; untested |
| Pixel | "Hey Google / Gemini, add a task to Studyboard" via AppFunctions | yes | yes | yes | **experimental, unverified**: depends on `androidx.appfunctions`, Android 16+ and Gemini support |
| Pixel | Google Assistant App Actions / built-in intents | yes | n/a | n/a | **not implemented**: could not confirm a supported intent |
| Samsung Galaxy | Gemini on Galaxy (same AppFunctions) | yes | yes | yes | **experimental, unverified** per device/One UI version |
| Samsung Galaxy | Bixby Quick Command / Routine opening `studyboard://action/quickadd` | yes | no | no | likely; untested |
| Samsung Galaxy | Bixby capsule | n/a | n/a | n/a | **not possible** (discontinued for new developers) |
| Android (any) | Share sheet text (silent) / image (opens app) | yes | text: yes | text yes | untested here |
| Android (any) | Quick Settings tile, launcher shortcuts | yes | no | no | untested here |
| Android (any) | Tasker / HTTP Request Shortcuts calling the endpoint | no | yes | yes | likely; untested; see `android-wrapper/SAMSUNG-BIXBY.md` |
| Android PWA | Web share target | no | n/a | no | cap-core; no assistant integration |
| Any | Direct HTTP `POST /functions/v1/capture-task` (curl, automations) | no | yes | yes | cap-server tests |

## 2. Data flow

```
 "Hey Siri / Hey Google"        Share sheet            Tile / shortcut / deep link
        |                           |                              |
  AddTaskIntent (iOS)         ShareViewController (iOS)     studyboard://add | capture
  AppFunctions.addTask         ShareReceiverActivity (A)            |
  (Android, experimental)             |                             v
        |                             |                   MainActivity / app (Capacitor)
        |  text, due, course, source  |                   native-bridge.js appUrlOpen
        v                             v                             |
   +-------------- capture client (SBCapture.swift / CaptureClient.kt) --+   v
   | token + endpoint from Keychain group / Keystore-encrypted prefs      |  SBCAPTURE.handleUrl(url)
   | POST https://<project>.supabase.co/functions/v1/capture-task         |
   | Authorization: Bearer <capture token>  Idempotency-Key: <uuid>       |
   +--------------------------+------------------------------------------+
            ok                |  offline / error / not configured
            v                 v
  {ok, message, speech}   App Group file queue (iOS) / filesDir queue (Android)
  spoken / Toast               |  next launch or resume
                               v
                 native-bridge.js: StudyboardSharedQueue.drain() -> SBCAPTURE.ingest(item) -> board -> ack
```

The contract (`capture-contract.json`) is the single source for the path, headers, body fields, limits and the queue-item shape; `tests/capture-contract.test.js` checks the Swift and Kotlin sources against it and runs a contract-enforcing mock. cap-server's docs and function must match it (if cap-server changes a limit, change the JSON and the two clients).

## 3. Security

* **Token storage:** the capture token (bearer secret that can only add tasks) is saved by the web layer through `saveCaptureToken` into the **iOS Keychain** shared access group (`AfterFirstUnlockThisDeviceOnly`, never synced or backed up) or an **Android Keystore** AES-GCM key (prefs excluded from backup). It is never put in `localStorage` by this code, never logged. Revoking in Settings calls `clearCaptureToken`.
* **Transport:** HTTPS only, host must end in `.supabase.co` (enforced in JS, Swift and Kotlin), path fixed, no redirects followed (Android), no cleartext (`network_security_config.xml`, ATS untouched on iOS), 8 s timeout.
* **Idempotency:** each item has a UUID used as the `Idempotency-Key`; retries from the queue reuse it, so a task is not created twice. The server must honour the header.
* **No PII in logs:** the native clients contain no log calls (tested by a grep in the test). Do not add `print`/`Log` of requests, errors with URLs, tokens or task text.
* **Blast radius:** a stolen token can only add tasks (cap-server must scope it and rate-limit it); a lost phone: revoke the token in Settings.
* **Queue files** (App Group container / app files dir) hold task text and photos until drained; iOS files use file protection until first unlock; Android's are in app-private storage excluded from backup.
* **Share extension / receiver** accept only text, a web URL and one image; text is clipped to the contract limits; images are downscaled and capped at 8 MB.

## 4. Review notes

**App Store (paste into App Review Information, after testing):**
> Studyboard provides App Intents ("Add Task", "Capture a Photo") and App Shortcuts so people can add a task by asking Siri ("Add a task to Studyboard"), from the Shortcuts app, Spotlight or the Action Button. The intent sends the task text the person speaks or types to the person's own Studyboard account over HTTPS using a revocable capture token stored in the Keychain. A Share Extension ("Add to Studyboard") adds shared text or links the same way and queues shared photos for the app. The app uses no microphone or speech-recognition permission (Siri handles the voice). No tracking. To test: sign in with the demo account, open Settings > Quick Capture and create a token, then say "Hey Siri, add a task to Studyboard".

Give the reviewer a demo account that already has a token, or say where to create it. If the Siri phrase is flaky for the reviewer, say they can run "Add Task" from the Shortcuts app.

**Play:** no new permission, no new SDK; Data safety is unchanged (task text already goes to the app's own backend). For AppFunctions mention in the listing/notes only that the assistant can add tasks on the user's request. There is no restricted permission here (no accessibility, overlay or SMS).

## 5. Owner verification checklist (prioritised)

**P0: before any release that mentions voice**
1. `node tests/capture-contract.test.js` still passes, and compare `capture-contract.json` with cap-server's function (path, fields, limits, `Idempotency-Key` honoured, `speech` field, token scope, rate limit).
2. **Xcode (current stable, then the 27 beta):** create the project, add App Groups + Keychain Sharing, add the Swift files and the Share Extension, build. Fix compile errors (nothing was compiled). Confirm the App Intents metadata is generated (build log) and **Settings > Siri (Apple Intelligence & Siri) > Apps > Studyboard** lists "Add Task".
3. **iOS device:** run `ios-wrapper/native/capture.md` section 5 tests 1 to 8, 10 to 12 (token handoff, Shortcuts, "Hey Siri" phrases, offline queue, share from Safari / Notes / Photos).
4. **Android Studio:** create the project, merge `android-wrapper`, build **debug and a minified release**. Run the `adb` tests in `README-ANDROID.md` section 6 on a Pixel and a Galaxy; confirm logcat shows no token or task text.

**P1: the assistant claims (each separately, record versions)**
5. **iOS 26 / iOS 27 beta:** Siri with Apple Intelligence: does "add a task to Studyboard" still trigger the intent? Does speaking the task in the same sentence work? Check Siri's behaviour with the phone locked. Re-read Apple's current App Intents / App Shortcuts docs for changes (phrase rules, assistant schemas, `authenticationPolicy`).
6. **Pixel:** Gemini app: does it list or offer Studyboard (AppFunctions)? "Hey Google, add a task to Studyboard." Verify `androidx.appfunctions` artifact names, versions, annotations, manifest/permission needs against current docs; fix `StudyboardAppFunctions.kt` and `build.gradle.additions.txt` (VERIFY markers). If unsupported, remove the experiment (README-ANDROID.md section 4).
7. **Samsung Galaxy:** same Gemini test on the Galaxy's One UI/Android version; Bixby Quick Command "Add task" opening the quick-add link; test the HTTP Request Shortcuts / Tasker configs. Update `SAMSUNG-BIXBY.md` with what the menus really say.

**P2: polish and compliance**
8. Xcode Privacy Report on the archive (App and extension); update `PrivacyInfo.xcprivacy` if it asks for more (1C8F.1 only if you add App Group UserDefaults).
9. Shortcuts / Spotlight / Action Button / Lock Screen control (iOS 18+); Android tile, launcher shortcuts, App Links (`pm get-app-links`).
10. Rotated-photo test on Android (EXIF), large-image test on both, share of a very long text (clipped at 500).
11. Update App Store notes (`APP-STORE-CHECKLIST.md` section 5b) and the store listing only for what passed.
