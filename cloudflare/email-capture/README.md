# Email to Studyboard (Cloudflare Email Worker)

Powers **Settings > Quick Capture > Email to Studyboard** (Studyboard Pro). Each Pro student can make one private address, like `k7m2p9x4qrst@in.studyboard.example`. They forward an email from a professor or their school to it, or set a mail filter to forward course notifications automatically. Studyboard then shows what it found in the email (deadlines, exams, readings) in the usual capture check sheet, to add with one tap. Nothing from an email is added without the student's OK.

It runs on Cloudflare's **free** plan (Email Routing and Workers Free).

## How it works

```
 a forwarded email  ->  Cloudflare Email Routing (catch-all on your inbound domain)  ->  this Worker
      reads the subject and the text (src/mime.js), skips attachments, drops out-of-office replies
      ->  POST capture-email Edge Function  (header X-Studyboard-Email-Secret)
      ->  capture_add_email()  (supabase-capture.sql: is the key real, is the owner Pro, limits, same Message-ID once)
      ->  the owner's capture inbox  ->  the app reads it (with their AI if set up, else its own date reader)  ->  Check and Add
```

- **Nothing is stored here.** The Worker reads the message, posts the subject, the text (at most 20,000 characters), the sender's address and the Message-ID, and forgets it. Observability (logs) is off in `wrangler.jsonc`.
- **The database keeps at most 6,000 characters** of the text, for at most 30 days, and deletes it 7 days after the app has read it (`capture_purge`).
- **An address is a secret, like a capture token.** Whoever has it can send the student things to check, nothing more. Students can make a new address (the old one stops at once) or turn it off.
- **Bounces:** mail to an address that doesn't exist (never made, replaced or turned off) is rejected with a short reason; so is mail to a student whose Pro ended. When the inbox is busy or something fails, the sending server is asked to try again later.
- **Limits:** 15 emails an hour and 60 a day per student, plus the usual capture caps (300 a day, 200 waiting).
- **Gmail forwarding:** Gmail first sends a confirmation code to the new address. Studyboard shows that code in a sheet (instead of making tasks from it), so the student can finish the setup.
- **Big emails:** only the first 3 MB of a message are read. The text comes before the attachments, so the text still arrives.

## Deploy (about 15 minutes)

You need a domain on Cloudflare (DNS managed there) and Node.js 20 or newer. A subdomain such as `in.studyboardapp.com` is best, so it doesn't touch your main mail.

1. **Supabase.** Run `supabase-capture.sql` again in the SQL Editor (it adds the Email to Studyboard tables and functions). Optional: run `supabase-capture-selftest.sql`; it must end with **ALL n CAPTURE CHECKS PASSED**.
2. **A shared secret.** Make a long random string (32 characters or more), for example with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.
3. **The Edge Function.** Deploy `supabase-functions/capture-email/index.ts` as `capture-email` with **Verify JWT off** (`supabase functions deploy capture-email --no-verify-jwt`), and add the secret `EMAIL_CAPTURE_SECRET` with the value from step 2.
4. **The Worker.**
   ```
   cd cloudflare/email-capture
   npx wrangler login
   npx wrangler deploy
   npx wrangler secret put EMAIL_CAPTURE_SECRET     # the same value as step 2
   ```
   If your Supabase project isn't the one in `wrangler.jsonc` (`vars.SUPABASE_URL`), change it first.
5. **Email Routing.** In the Cloudflare dashboard, open your domain, then **Email > Email Routing**. Add the inbound subdomain (Cloudflare adds its MX and SPF records), then **Routing rules > Catch-all address > Edit**: action **Send to a Worker**, Worker `studyboard-email-capture`, and turn it on.
6. **The app.** In `index.html`, set `const CAPTURE_EMAIL_DOMAIN = "in.studyboardapp.com";` (your inbound domain). Then run `node scripts/csp.js`, because the inline script's hash changes, and rebuild the website and apps as usual.

While `CAPTURE_EMAIL_DOMAIN` is empty, the app hides Email to Studyboard and everything else works as before.

**Try it:** sign in with a Pro account, open **Settings > Quick Capture**, choose **Get My Address**, and send an email like *"Lab 4 is now due Friday at 5pm"* to it. Within a minute or so of Studyboard being open, the Check and Add sheet shows "Lab 4".

## Test it locally

These tests run from the repo root in Node, without Cloudflare or Supabase:

```
node tests/email-capture.test.js                                                        # the MIME reader and the Worker
node --experimental-strip-types supabase-functions/tools/test-capture-email.mjs         # the Edge Function
node tests/pro-study.test.js                                                            # the app's email reader and inbox routing
```

## Free plan limits that apply

| Limit | Amount |
|---|---|
| Email Routing | free, no daily cap for routing to a Worker |
| Worker requests | 100,000 a day (one per email) |
| Message size Email Routing accepts | 25 MiB (only the first 3 MB are read) |
