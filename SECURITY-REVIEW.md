# Studyboard security and privacy review (pre-release)

Scope: web/PWA (`index.html`, `sw.js`), Electron app (`main.js`, `preload.js`, `widget-preload.js`, `lms.js`), Supabase SQL and edge functions (`index.ts`, `index (1..3).ts`), repo secrets, dependencies. No secret values appear here, only locations.

## Fixed in this pass

| # | Severity | Area | Problem | Fix |
|---|---|---|---|---|
| 1 | High | Privacy | AI API keys (Gemini/Claude/OpenAI) lived in `state.settings.ai` and were upserted in plain text to the Supabase `items` table (`kind='meta'`) by `saveSettings()`. | New `syncSettings()` strips `ai.keys`/`ai.key` from everything sent to the account (also the first-sync migration). Keys saved by older versions are kept on that device once, then removed from the server on the next settings save. The AI setup text now says keys stay on this device. Side effect: users must paste a key once per device. |
| 2 | High | Privacy | Signing out only removed `coursework:v2` and the outbox. The IndexedDB sync cache (every task, note, deck, and old AI keys), search index, photos, local backups, queued bug reports and Today-widget data stayed on a shared computer. | New `wipeDeviceData()` runs on sign-out and "switch to own server". It clears those stores and signs out the LMS cookie stores in the desktop app. |
| 3 | Medium | Supabase | `group_messages` insert policy let a member insert `pinned = true`, skipping the 3-pin cap and the owner/author rule. No flood limits on group messages or shared items. | `sbg_stamp()` forces `pinned = false` on insert, limits posting to 20 messages a minute per person and 500 shared items per person per group. |
| 4 | Medium | Supabase/edge | `push_subscriptions.endpoint` accepted any string and `send-reminders` called it: a signed-in user could make the function request an arbitrary URL (SSRF). | `https://` check constraint (`NOT VALID`, so old rows are left alone) in `supabase-reminders.sql`, plus an `https` filter in `subsFor()` (`index (3).ts`). |
| 5 | Medium | Edge | `lms-feed` (`index (2).ts`) followed redirects blindly, so a public feed URL could redirect it to an internal address. | Redirects are followed by hand (max 3), each hop must pass a new `hostOk()` check (https, real hostname, no IP/localhost/internal, port 443). |
| 6 | Medium | XSS/CSP | No Content-Security-Policy. | CSP added at the top of `index.html` (inserted by a tiny script, see note below): `default-src 'self'`; scripts from self, inline and jsdelivr only (cdnjs was removed once pdf.js was self-hosted); styles and fonts self and inline only (fonts are self-hosted in `vendor/fonts/`); `connect-src 'self' https: wss: blob: data:`; `img-src` self/data/blob/https; `frame-src 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`. Verified with Playwright: 0 violations or page errors across tabs, and an injected http image, iframe and foreign script were blocked. |
| 7 | Medium | XSS | A stored HTML/SVG file opened from Files ran as a blob page inside the app's origin. | `sbOpenAsset()` hands html/svg/xml/js files over as `application/octet-stream` (download, not render). |
| 8 | Low-Med | XSS (CSS) | Course `color` from imports/backups was put into `style="--c:..."` (esc() cannot stop `;background:url(...)` tracking or CSS injection). | `fromArrays()` (the single load/import path) now only accepts hex, rgb/hsl or a plain color name, otherwise a neutral gray. |
| 9 | Low | Privacy | Bug-report diagnostics include the last 10 error messages, which could contain a key or email. | Error log scrubs API-key patterns, bearer/token values and email addresses before storing. |
| 10 | Low | Electron | See "Electron" below. | `main.js` hardening (below) and `lms.js` pop-up filter. |
| 11 | Low | Edge | Calendar-feed rate limiter stored the private token in `studyboard_rate`. | Stores a SHA-256 fingerprint instead. SQL also limits calendar token characters and `options` size. |
| 12 | Low | Repo | No `.gitignore` (risk of committing `.env`, keys, `node_modules`, build output). | Added. |
| 13 | Info | Chrome quirk | A static CSP `<meta>` made Chrome's parser fire junk 404 requests for template text inside the 5 MB inline script. | The policy is added by an inline script before anything else loads. It is enforced the same way (tested). Also split `<!--` / `<script` literals that confuse HTML parsers. |

### Electron (`main.js`, `lms.js`)
Already good: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity` left on, minimal `contextBridge` surface, path traversal guard (`resolveRel`), IPC checks `fromMain`/`fromWidget`, widget has its own strict CSP, LMS windows use a separate persistent cookie partition and never see passwords. **LMS tokens are not stored by the app at all** (only the platform's own session cookies in the private partition), so `safeStorage` is not needed.

Added: all file/dir IPC handlers now require the main window as sender; `fs:write` validates the payload type; `fs:open` refuses programs/scripts (`.exe .bat .lnk .js .sh .app` and similar) so a synced file can't be launched; `openExternal` only for parsed `http`, `https`, `mailto` URLs (`openSafely`); `will-redirect` locked to `app://studioso/`; `will-attach-webview` denied; permission handler denies everything except clipboard write and notifications; LMS sign-in pop-ups only allowed for `https:`.

### Links / XSS audit result
`esc()` is used consistently for LMS text, group names/messages/items, shared decks, ICS imports and announcements (no unescaped sink found in groups, shares, announcements, ICS preview, bug-report UI). Every `href`, `data-url`, `window.open` for task/course/file links goes through `safeUrl()` (http/https only; `javascript:` and `data:` resolve to nothing). `LINK()` helper made safe too.

## Reviewed, no change needed
- RLS present on every table in the repo's SQL; group tables are read-only to clients except through `SECURITY DEFINER` functions, all with `set search_path`, `auth.uid()` checks, and `revoke ... from public, anon`. Invite/share code lookups are rate limited (30/hour).
- `bug_reports`: insert-only for clients, server stamps `user_id`, size limits, 5/hour per device or account and 200/hour overall.
- Billing webhook (`index (1).ts`): Stripe HMAC with timestamp tolerance and constant-time compare, RevenueCat bearer compare, "Verify JWT" off as documented.
- Service worker only caches same-origin GET files and CDN libraries; Supabase/API calls always go to the network.
- pdf.js is called with `isEvalSupported: false` (defence in depth for CVE-2024-4367, which is fixed in 4.2.67+; the app now ships pdf.js 5.7.284 from `vendor/pdfjs/`, with XFA, wasm and scripting off).
- Secret scan of the whole tree and the last 8 commits: only the Supabase **publishable** key and URL (`SB_DEFAULT` in `index.html`) are committed, which is by design. No service-role key, `sk-`, `AIza`, `whsec_`, private keys, passwords or personal emails found.
- Diagnostics in bug reports: version, browser, page, plan, signed-in flag, scrubbed error messages. No task or note content.
- Data goes to AI providers only when a key is saved (opt-in) and the user triggers an AI feature or enables "Automatic AI".

## Owner action items (not fixable in code)
1. **Re-run** `supabase-groups.sql`, `supabase-reminders.sql`, `supabase-calendar-feed.sql` and redeploy `calendar-feed`, `lms-feed`, `send-reminders` edge functions.
2. **`supabase-setup.sql` (the `items` table, its RLS and the `studioso-files` storage bucket policies) is not in this repo**, so it could not be reviewed. Confirm: RLS on `items`; select/insert/update/delete limited to `user_id = auth.uid()`; storage policies limited to `bucket_id = 'studioso-files' and (storage.foldername(name))[1] = auth.uid()::text`; bucket private; no anon grants. Consider adding the file to the repo.
3. `send-reminders` accepts the "send" action from anyone (it only sends what is already due, but it costs a database scan each call). Optionally require a secret header from the cron job.
4. Serve the site with real headers if the host allows it: the same CSP plus `frame-ancestors 'none'` (cannot be set in a meta tag), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`.
5. Third-party scripts: supabase-js is now served from the site itself (`vendor/supabase-js-2.117.2.umd.js`, same file as the npm package) and loaded with `integrity` + `crossOrigin=anonymous`; the jsDelivr copy is only a fallback and carries the same SRI hash. Fonts (Lexend, Atkinson Hyperlegible, latin subsets) are self-hosted in `vendor/fonts/`, so Google Fonts is no longer used. pdf.js is now self-hosted too (`vendor/pdfjs/`, 5.7.284; cdnjs removed from the CSP). **Still open**: the SRI hash was computed from the npm file because the CDN could not be reached when it was added. Confirm once: `curl -s https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js | openssl dgst -sha384 -binary | openssl base64 -A` must print `Rj26LVGvoeRVR6+mwQmFfcR3QOBEwT+ZmuCWpuiqeTzJpCs0ER4ITAWGb4Hiy3Ok`. When pdf.js is self-hosted too, remove `cdn.jsdelivr.net` and `cdnjs.cloudflare.com` from the CSP.
6. Stripe: the checkout link's `client_reference_id` is trusted to pick the account. A user can pay for someone else's account (harmless) but could later cancel and downgrade the other account; if that matters, create Checkout Sessions server-side.
7. Desktop builds are unsigned (`CSC_IDENTITY_AUTO_DISCOVERY=false`). Sign and notarize (Windows cert, Apple Developer ID) before public release; consider flipping Electron fuses (`RunAsNode` off, `EnableNodeCliInspectArguments` off, `OnlyLoadAppFromAsar`).
8. `lms.js` feed fetch (`net.fetch`) follows redirects; low risk on the user's own machine, but could use `redirect: "manual"` plus the same host check.
9. Realtime: confirm no other broad policy exists on `realtime.messages` in the project; the room policies in `supabase-rooms.sql` only add member-only rules.
10. Rate limits are per account; free sign-ups are unlimited, so enable Supabase email confirmation and CAPTCHA (Auth settings) to slow guessing of group codes and bug-report spam. A bug-report flood (200/hour) blocks real reports, so watch the table.

## Residual risks (documented, accepted)
- AI keys sit in `localStorage` on the device (readable by any script in the page origin and by anyone with the device). The CSP and escaping reduce script-injection risk; users should use keys with spending limits. Keys are never synced, exported in backups, or put in bug reports.
- The CSP must allow `'unsafe-inline'` scripts/styles because the app is one inline file; moving to nonces needs a build step.
- `connect-src https:` is broad because the app fetches user-supplied calendar links and several AI hosts.

## Dependencies (package.json, report only)
`electron ^38.8.6`, `electron-builder ^26.15.3`, `@supabase/supabase-js ^2.117.2`, `pdfjs-dist 5.7.284` (exact pin; upgraded from 3.11.174, so CVE-2024-4367 is fixed, and `isEvalSupported:false` is kept; the committed `vendor/pdfjs/*.mjs` must match `node_modules/pdfjs-dist/legacy/build/`), fonts only otherwise. Run `npm audit` and keep Electron on the latest stable line for each release (it ships Chromium security fixes). Edge functions pin `@supabase/supabase-js@2.117.2` and `web-push@3.6.7`.
