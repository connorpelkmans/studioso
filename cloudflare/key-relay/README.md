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

## Deploy (about 5 minutes)

You need a free Cloudflare account and Node.js 20 or newer.

```
cd cloudflare/key-relay
npx wrangler login
npx wrangler deploy
```

1. **Run the deploy.** It prints the Worker's address, for example `https://studyboard-key-relay.<your-subdomain>.workers.dev`.
2. **Set the app's web address.** In `wrangler.jsonc`, set `vars.APP_URL` to your Studyboard web app address (https, no trailing slash), for example `https://app.studyboard.example`. Then run `npx wrangler deploy` again. This makes **Open Studyboard** on the QR page open your app with the code filled in. If you leave it empty, the page only offers **Copy Code**.
3. **Point the app at the Worker.** In `index.html`, set `const KEY_RELAY = "https://studyboard-key-relay.<your-subdomain>.workers.dev";`. Then run `node scripts/csp.js`, because the inline script's hash changes, and rebuild the website and apps as usual.

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

## Free plan limits that apply

| Limit | Per day |
|---|---|
| Worker requests | 100,000 |
| Durable Object requests | 100,000 |
| Durable Object rows written | 100,000 |

One successful transfer uses about 8 to 10 requests and about 8 rows. A code nobody uses costs up to about 120 status checks over its 10 minutes. That allows roughly 10,000 transfers a day, and each student needs one per new device.
