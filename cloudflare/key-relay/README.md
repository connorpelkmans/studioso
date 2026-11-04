# Studyboard key relay (Cloudflare Worker)

Powers **Settings > AI Features > Add AI to Another Device**. A student who has set up AI on one device can show a QR code (or a 12-character code) and bring their AI keys to another device without pasting the key again. Unlike **AI Keys on All My Devices**, which keeps a passphrase-locked copy in the student's account, this needs no account and no passphrase, and nothing is kept.

It runs on the **Workers Free plan**. When a free limit runs out, requests fail with an error until the daily reset (00:00 UTC). Nothing is ever billed, unless you upgrade the account yourself.

## What it stores

Only an encrypted box under a random-looking id, for at most 10 minutes, and handed out once.

1. The first device makes a code and derives two things from it with PBKDF2: the mailbox id and an AES-GCM key. This happens in `index.html` (`KEYHO`).
2. It encrypts the keys on the device and posts only the id and the ciphertext here.
3. The other device gets the code from the QR link's `#fragment`, which browsers never send to a server, or the person types it. It derives the same id, fetches the box once and decrypts it.

The relay never sees the code or a key. Each box is deleted when it is collected, when the first device closes the window, or after 10 minutes.

| Route | What it does |
|---|---|
| `POST /v1/h/<id>` with `{"box": "..."}` | Stores a box (201). Returns 409 if the id is already in use. |
| `GET /v1/h/<id>` | Returns the box and deletes it. Returns 404 after that, or once it has expired. |
| `GET /v1/h/<id>/status` | Returns `waiting`, `taken` or `none`. The first device uses it to show "Done". |
| `DELETE /v1/h/<id>` | The first device cancels. |
| `GET /k#XXXX-XXXX-XXXX` | The page a scanned QR code opens. It shows the code with **Copy Code**, and an **Open Studyboard** button if `APP_URL` is set. |

## Phone photos for Scan to PDF and Photo to Note

The same Worker also powers **Take Photos** in Scan to PDF and in Photo to Note on a computer (Photo to Note's QR code opens `/s?for=notes`, which only changes the camera page's wording). Clicking it shows a QR code; the phone opens the relay's camera page (`/s`), and each photo taken there turns up as a page on the computer. No app or sign-in is needed on the phone.

1. The computer makes a random code and works out a session id and an AES-GCM key from it (SHA-256 of `sb-scan-id:` or `sb-scan-key:` plus the code). It opens the session here with only the id.
2. The QR code links to `/s#<code>`. The `#fragment` is never sent to a server.
3. The phone shrinks each photo to a JPEG under 1.8 MB, locks it with the key and posts it. The computer polls, collects each photo once (which deletes it) and unlocks it.

A session ends when the computer closes Scan to PDF (or Photo to Note), or after 30 minutes, and holds at most 60 photos. The relay only ever sees the session id and locked photos (`src/scan.js`).

| Route | What it does |
|---|---|
| `POST /v1/s/<id>` | The computer opens a session (201; 409 if it exists). Rate limited like the key routes. |
| `POST /v1/s/<id>/p` | The phone adds a locked photo (raw bytes, up to 1.9 MB). 404 once the session has ended. |
| `GET /v1/s/<id>/p` | The photos waiting, as `{"ks": [1, 2]}`. |
| `GET /v1/s/<id>/p/<k>` | Hands out a photo once, then deletes it. |
| `GET /v1/s/<id>/status` | `open` or `none`, and how many were sent. |
| `DELETE /v1/s/<id>` | The computer ends the session. |
| `GET /s#<code>` | The phone's camera page. |

While `KEY_RELAY` is empty, Take Photos on a computer opens the file picker as before.

## Deploy (about 5 minutes)

You need a free Cloudflare account and Node.js 20 or newer.

```
cd cloudflare/key-relay
npx wrangler login
npx wrangler deploy
```

1. **Run the deploy.** It prints the Worker's address, for example `https://studyboard-key-relay.<your-subdomain>.workers.dev`.
2. **Set the app's web address.** In `wrangler.jsonc`, set `vars.APP_URL` to your Studyboard web app address (https, no trailing slash), for example `https://app.studyboard.example`. Then run `npx wrangler deploy` again. This makes **Open Studyboard** on the QR page open your app with the code filled in. If you leave it empty, the page only offers **Copy Code**.
3. **Point the app at the Worker.** In `src/js/01-ai.js`, set `const KEY_RELAY = "https://studyboard-key-relay.<your-subdomain>.workers.dev";`. Then run `node scripts/app-files.js` to rebuild `bundle/`, and rebuild the website and apps as usual.

While `KEY_RELAY` is empty, the app hides **Add AI to Another Device** and the code box, and everything else works as before. **Paste My Key** doesn't need the relay at all.

## Test it locally

```
cd cloudflare/key-relay
npx wrangler dev        # http://localhost:8787
```

These tests from the repo root run the same relay code in Node, so they don't need Cloudflare:

```
node tests/key-handoff.test.js
node tests/key-handoff.e2e.js
```

`key-handoff.e2e.js` runs two simulated devices in Chromium.

## Abuse limit

Anyone can post a box, and each one is a new Durable Object, so `wrangler.jsonc` adds a rate limiting binding (`POST_LIMIT`): at most 20 new boxes a minute from one network address (`CF-Connecting-IP`). Past it, `POST` answers 429. Reading, status checks and cancelling aren't limited (they store nothing). The binding's count is kept per Cloudflare location, so treat it as a brake, not an exact quota. If you remove the binding, the relay still works, without the limit; a Cloudflare WAF rate limiting rule on `POST /v1/h/*` does the same job.

## Free plan limits that apply

| Limit | Per day |
|---|---|
| Worker requests | 100,000 |
| Durable Object requests | 100,000 |
| Durable Object rows written | 100,000 |

One successful transfer uses about 8 to 10 requests and about 8 rows. A code nobody uses costs up to about 120 status checks over its 10 minutes. That allows roughly 10,000 transfers a day, and each student needs one per new device.
