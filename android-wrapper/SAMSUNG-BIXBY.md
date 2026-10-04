# Samsung Galaxy: adding tasks by voice

> **Verification status: UNTESTED.** No Samsung device, One UI build or Bixby documentation was available while writing this. Menu names and options below are from memory of One UI and may differ on your version: confirm each one on a real Galaxy before telling anyone it works.

**Bixby Capsules are discontinued for new developers** (Samsung stopped accepting new capsule development), so there is no supported way to build a "Studyboard capsule". The routes that remain:

## 1. Gemini on Galaxy (same code as Pixel)
Recent Galaxy phones ship Gemini as the main assistant, and Galaxy AI features use Gemini models. The **AppFunctions** code (`StudyboardAppFunctions.kt`) and the share sheet/shortcuts are the same as on Pixel. Whether Gemini on a given Galaxy can call third-party app functions depends on the One UI / Android version, the Gemini app version and the region: **verify per device**. Test: side-button/"Hey Google" > "Add a task to Studyboard". See README-ANDROID.md section 6.

## 2. Bixby Voice Quick Commands, and Modes and Routines (deep link)
* **Bixby Quick Command** (Settings > Advanced features > Bixby Voice > Quick commands, or the Bixby app): phrase **"Add task"** > action **Open app** > Studyboard (or an "Open URL" step with `studyboard://action/quickadd`). Result: the app opens on the quick-add screen; the person then types or dictates the task. Using `studyboard://add?text=` with fixed text only suits a *fixed* task ("Add task: take vitamins"): quick commands cannot pass what you say as a parameter.
* **Modes and Routines** (Settings > Modes and Routines > Routines): *If* "Bixby command" or a time/place/NFC trigger, *Then* "Open app" or "Open link" (if offered) with `studyboard://capture?photo=1` for "photo capture". Whether a custom-scheme URL is accepted by the "Open link" action on your One UI version is **unverified**; if not, use the app-shortcut variant: long-press the icon > drag the "Add task" shortcut to the home screen, and choose that shortcut in the action (if listed).
* The deep links open the app; they do not add a task silently. For silent add use section 3.

## 3. Silent capture with an HTTP app (Samsung Routines has no built-in "HTTP request")
Both apps call the capture endpoint directly with the capture token (Studyboard Settings > Quick Capture). The token is a bearer secret: keep it only inside these apps, never in a shared Routine, and revoke it in Studyboard if the phone is lost.

**HTTP Request Shortcuts** (free, open source, Waboodoo; Play Store / F-Droid). Create a shortcut:
```
Method:   POST
URL:      https://<project>.supabase.co/functions/v1/capture-task
Headers:  Authorization: Bearer <capture token>
          Content-Type: application/json
          Idempotency-Key: sb-{{timestamp}}          (any unique 8-64 char [A-Za-z0-9-] value: use the app's variable for the current time/UUID if it has one)
Body (JSON): {"text": "{{task}}", "source": "http"}
Variable "task": type Text, "Ask when executing" (the app shows a prompt; with its voice-input option you can dictate)
```
Then add the shortcut to the home screen, or call it from a Bixby quick command / Routine by opening it (the app can expose each shortcut as a launcher shortcut). Variable syntax and options are from memory: check the app's documentation.

**Tasker** (paid): a profile or a task with
```
1. Input > Get Voice            (Title: "What's the task?")  -> result variable (commonly %VOICE: verify)
2. Variable Set  %id  to  sb-%TIMEMS                        (matches ^[A-Za-z0-9-]{8,64}$)
3. Variable Search Replace  Variable: %VOICE  Search: "  Replace Matches: \"      (escape quotes for JSON)
4. Net > HTTP Request  Method: POST
     URL:     https://<project>.supabase.co/functions/v1/capture-task
     Headers: Authorization: Bearer <capture token>
              Content-Type: application/json
              Idempotency-Key: %id
     Body:    {"text":"%VOICE","source":"http"}
5. Alert > Flash   %http_data    (shows {"ok":true,"message":...,"speech":...})
```
Trigger it by a Bixby quick command that opens Tasker's task shortcut, by a widget, or by a Routine.

## 4. Share sheet
Samsung's share sheet lists Studyboard for text and images exactly as on Pixel (`ShareReceiverActivity`). Text posts silently; images open the app.

## 5. Matrix (nothing here is verified on a device)

| Route | Needs the wrapper app? | Expected to work | Notes |
| --- | --- | --- | --- |
| Gemini AppFunctions "add a task to Studyboard" | Yes | Maybe (experimental) | Android 16+, Gemini support per device/region: verify |
| Bixby Quick Command > Open app / quickadd link | Yes (deep link) or PWA install | Likely | Opens the app; no spoken parameter |
| Bixby Capsule | n/a | No | Discontinued for new developers |
| Routines "Open app / link" | Yes | Likely for app, uncertain for custom scheme | verify |
| HTTP Request Shortcuts / Tasker | No (needs the token) | Likely | Silent add; user maintains the config |
| Share sheet | Yes | Likely | Text silent, image opens app |
| Installed PWA (no wrapper) | No | Partly | Needs cap-core's web share target; no deep-link scheme; no assistant integration |
