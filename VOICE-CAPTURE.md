# Voice and shortcut capture

Add a task to Studyboard by asking your phone: "Hey Siri, Add to Studyboard", Gemini on a Pixel or Galaxy, Bixby, or the iOS share sheet. Free for everyone (not a Pro feature). It needs a Studyboard account, because tasks travel through your account's inbox.

## Why an inbox

A voice assistant cannot reach into a web app, and the app may be closed. So the assistant (or a Shortcut) sends the text to a small server function with a **capture token**. The function drops it in your **inbox** on the server. The next time Studyboard is open (on start, on focus, when back online, and every few minutes while visible) it pulls the inbox, makes the tasks on that device (so sync, trash and plan limits work as always) and then tells the server it is done. The server never writes into your `items` table.

```
 Siri Shortcut / HTTP Shortcuts / Tasker / native app (iOS App Intents, Android)
          |  HTTPS POST  Authorization: Bearer sbc_...   {text, due?, course?, source}
          v
 Edge Function  capture-task   (Verify JWT OFF; the token is the credential)
          |  service role -> RPC capture_add(sha256(token), ...)
          v
 Postgres: capture_tokens (hash only)   capture_inbox (text, due, course, source)
          ^                                   |
          | capture_ack(ids)                  | capture_pull_inbox()   (signed-in app, RLS by auth.uid())
          +----------------- Studyboard app: makes tasks locally, saves, THEN acks
```

The contract used by the native apps is in `capture-contract.json` (tested by `node tests/capture-contract.test.js`).

## Security model

- **Token**: `sbc_` plus 32 random bytes (made in the database), shown once. Only its SHA-256 is stored. Up to 5 active tokens per person, each named ("Siri on iPhone", "Pixel Gemini", ...). Revoke any time in Settings.
- **Scope**: `add_task` only. A token can put a short text (500 characters, optional due date/words, course hint up to 60, source label up to 24) in its owner's inbox. It cannot read tasks, the inbox, other tokens or anything else.
- **What a leaked token can do**: add inbox items for you, at most 30 per hour and 200 per day per token (300 per day and 200 waiting per person), until you revoke it. Items are plain text that becomes a normal editable task. Control and bidirectional characters are stripped.
- **Tables**: `capture_tokens` and `capture_inbox` have Row Level Security on and no grants for the app; everything goes through `SECURITY DEFINER` functions with a pinned `search_path`. `capture_add` is callable by the service role only. The token list never returns the hash.
- **No token oracle**: unknown, revoked and malformed tokens get the same 401. Logs are structured JSON without tokens, text or query strings.
- **GET with `?token=`** is off by default and enabled per token ("Also allow use in a link"). Use it only for tools that cannot send headers (some Bixby Quick Commands): URLs end up in logs, browser history and backups, so a token in a URL is easier to leak. The query string is never logged by this function.
- **Natural-language dates are not parsed on the server.** `due: "friday 5pm"` is stored as text; the app parses it with the person's own time zone and courses. ISO dates (`2026-10-09`, `2026-10-09T17:00`) fill the date and time directly (a trailing `Z`/offset is ignored, so send local time).
- Duplicates: the same `Idempotency-Key` header (or `id` field) within 10 minutes adds nothing twice; the app also drops the same text and due within 10 minutes. Task ids are derived from the inbox id, so a retry after a crash cannot double-add.
- Account deletion removes both tables' rows (`studyboard_delete_my_account()` in `supabase-lean.sql`).

## Deploy (owner)

1. Run `supabase-capture.sql` in the SQL Editor (after `supabase-setup.sql` and `supabase-lean.sql`; safe to run again). Turn on `pg_cron` first if you want the nightly clean-up (done captures after 7 days, unread after 30), otherwise run `select public.capture_purge();` now and then.
2. Optional: run `supabase-capture-selftest.sql`. It must end with **ALL n CAPTURE CHECKS PASSED** (it rolls back).
3. Deploy `supabase-functions/capture-task/index.ts` as the function `capture-task` with **Verify JWT off**. No secrets of your own; Supabase provides `SUPABASE_URL` and the service key.
4. Check it: `curl "https://<project>.supabase.co/functions/v1/capture-task?ping=1"` returns `{"ok":true,...}`.
5. The website's CSP already allows it (`connect-src` includes `https:`), so nothing to change.
6. Tests: `node --experimental-strip-types supabase-functions/tools/test-capture.mjs`, `node tests/capture-inbox.test.js`.

## Request format

`POST https://<project>.supabase.co/functions/v1/capture-task`, header `Authorization: Bearer sbc_...` (or `X-Studyboard-Token`), optional `Idempotency-Key`. Body JSON (or form-encoded), max 4 KB:

```json
{"text": "Read chapter 4 for bio", "due": "friday 5pm", "course": "Bio 101", "source": "siri"}
```

Reply: `{"ok":true,"message":"Added to your Studyboard inbox","speech":"Added to Studyboard: Read chapter 4 for bio","duplicate":false}`. Errors: 401 (token), 400 (text missing or over 500), 413 (over 4 KB), 429 (rate limit or full inbox, with `Retry-After`; `X-RateLimit-*` headers on success).

## Per-platform setup (what each really needs)

The in-app guide (Settings, Voice assistants & shortcuts) has the same steps with copy buttons and a **Test it** button.

| Platform | Works via | Needs | Status |
|---|---|---|---|
| iPhone/iPad, "Hey Siri, Add to Studyboard" | A Shortcut you build: Ask for Input (Text) -> Get Contents of URL (POST JSON, Bearer header) -> Get Dictionary Value `speech` -> Speak Text | Shortcuts app + token | Standard Shortcuts features; **not tested on a real iPhone or iOS 27 here** |
| iPhone share sheet | The same shortcut with "Show in Share Sheet" using Shortcut Input | Shortcuts app + token | Not tested on device |
| iPhone, "Hey Siri, add <task> to Studyboard" with no setup | App Intents in the native wrapper | Installed Studyboard iOS app (cap-native) | Wrapper code exists; not testable here |
| Pixel, Gemini | HTTP Shortcuts (or Tasker) app sends the request; Gemini opens the app or shortcut | Free HTTP Shortcuts app + token | Not tested on a real Pixel. Gemini cannot call URLs itself, and launching a shortcut by name depends on the Android/Gemini version |
| Pixel, direct "Hey Google, add ... to Studyboard" | App Actions / AppFunctions in the native wrapper | Installed Studyboard Android app (cap-native) | Wrapper code exists; not testable here |
| Samsung Galaxy, Bixby / Modes and Routines | Routine opens HTTP Shortcuts (a routine cannot send the request itself); links with `?token=` only if the token allows it | HTTP Shortcuts + token | Not tested on a real Galaxy |
| Samsung Galaxy, Gemini | Same as Pixel | HTTP Shortcuts + token | Not tested |

The native wrapper also stores one token in the device keychain through `StudyboardNative.saveCaptureToken(token, supabaseUrl)`; the settings screen calls it after a token is made and `clearCaptureToken()` on revoke and sign-out.

## Troubleshooting

- **401 from the endpoint**: wrong, revoked or mistyped token (they start with `sbc_`, no spaces), or `?token=` used without "allow use in a link".
- **Test it says "reached the server" but nothing arrives**: the app has to be signed in on this device; it pulls on start, focus and every few minutes.
- **"needs one more setup step"** in settings: `supabase-capture.sql` has not been run.
- **Gateway 401 before reaching the function** (`Invalid JWT`): the function was deployed with Verify JWT on. Redeploy with it off.
- **429**: 30 per hour per token reached, or 200 waiting captures; open Studyboard to drain the inbox.
- **Dates not understood**: the task is still added, without a due date; fix it in the app.
