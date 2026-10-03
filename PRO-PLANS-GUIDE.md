## Studyboard Pro: Plans and Payments

Studyboard has a **Free** plan and a **Pro** plan built in. Everything is ready, but the paywall is **switched off**: right now every theme and feature is unlocked for everyone, and no limits apply. Nothing changes until you do the Launch Day steps at the end of this guide.

You can do the setup below any time before launch (in any order). While the paywall is off, none of it blocks anyone.

### What's Free and What's Pro

**Free, forever** (this is what gets people to download Studyboard):
- The whole planner: Board, Timeline, Schedule, Today's Plan, Focus, notes and stickers, flashcards and quizzes, Grade Tracker, Rough Week Rescue and Search Everywhere.
- Sync on up to **2 devices**.
- Brightspace, Canvas and Blackboard sync, with the desktop sign-in or calendar links.
- Reminders and notifications, including phone push.
- Study groups (up to **3 members**, messages kept **60 days**) and deck sharing.
- AI with your own Gemini key.
- The 14 plain color themes, and the free card styles, note shapes, pins and sticker packs.
- **100 MB** of cloud file storage (plus unlimited files kept on the device, or links to Google Drive or OneDrive), and **25 MB** of synced data.
- Backups on the device: the desktop folder, plus the last 14 days in the browser.

**Pro** ($2.99 a month or $19.99 a year, with a 7-day free trial):
- Unlimited devices.
- **10 GB** of cloud file storage and **250 MB** of synced data.
- Every premium theme, including the 4 seasons (Winter, Spring, Summer and Autumn Leaves), plus every premium card style, note shape, pin and sticker pack, and all 46 Theme Collections.
- 30 days of online backup history.
- Study groups of up to **100 members** with unlimited message history.
- Later: grade and study insights, and built-in AI credits (both are switches that stay off for now).

In the app, **Settings > Studyboard Pro** shows the plan, what Pro adds, how much storage you use, and **Your Devices**.


### How It Fits Together

```
 App (index.html)                         Website (website/ on any static host)
   |  Buy / Manage opens                     |  account/ : log in with the SAME Supabase account
   +------------------------------------->   |  reads ?plan=monthly|yearly&src=app, then:
   |                                         |
   |                                         v   (user JWT, only "monthly" or "yearly" is sent)
   |                                  create-checkout  ----> Stripe Checkout (prices come from server secrets)
   |                                  create-portal-session -> Stripe customer portal
   |                                                              |
   |                                                              v  signed webhooks
   |                       billing-webhook  <-----------  Stripe     RevenueCat (App Store, Google Play)
   |                            |  verify signature/auth, then ONE database call
   |                            v
   |                  studyboard_apply_billing()  (idempotent, ordered, service role only)
   |                            v
   |                  studyboard_entitlements  (users can only READ their own row)
   |                            ^                       ^
   |   entitlement-token  ------+   studyboard_grant_pro / _revoke_pro (SQL Editor only)
   |   (signed {tier,exp,uid,iat,sig}, Ed25519)
   v
 App checks the signature with ENT_PUBKEY, works offline until "exp"

 Always enforced by the database (when paywall = true): devices, storage MB, data MB, group size,
 message retention, online backups. These do not depend on the app being honest.
```

The app only ever **asks**. The server decides who is Pro: money arrives through Stripe or RevenueCat webhooks, gifts come from you in the SQL Editor, and nothing a signed-in person can send changes either.

Files (all in the zip):
- `supabase-plans.sql` (tables, limits, grants, lock-down) and `supabase-plans-selftest.sql` (attack simulation)
- `billing-webhook` (`index (1).ts` in the flat copy), `supabase-functions/create-checkout`, `supabase-functions/create-portal-session`, `supabase-functions/entitlement-token`
- `supabase-functions/tools/gen-ent-key.mjs` (key pair) and `supabase-functions/tools/test-functions.mjs` (offline tests)
- `website/` (landing, pricing, account, privacy, terms, success, cancel)

### Owner Steps, In Order

Do these in test mode first. Everything stays free for everyone until Launch Day.

**1. Run the SQL.** In Supabase **SQL Editor** paste all of `supabase-plans.sql` and **Run** (safe to run again; run `supabase-groups.sql` and the main setup first, and `supabase-lean.sql` if you use it). Then paste `supabase-plans-selftest.sql` and **Run**. It must end with the notice **ALL n SECURITY CHECKS PASSED** (it changes nothing for real). Run it again after any future SQL change. If it ever stops with `EXPLOIT SUCCEEDED`, do not launch.

**2. Make the signing key.** On your computer (Node 18+): `node supabase-functions/tools/gen-ent-key.mjs`. It prints a **PRIVATE** value (`ENT_SIGNING_KEY`, PKCS8 as base64url) and a **PUBLIC** value (`ENT_PUBKEY`, 43 characters). Put the private one in Supabase **Edge Functions > Secrets** as `ENT_SIGNING_KEY` (never in the app, the website or git). Paste the public one into `const ENT_PUBKEY = "..."` in `index.html` and ship the app. If the private key ever leaks, run the script again, replace both and ship the app again.

**3. Stripe (test mode first).**
- **Product catalog > Add product** "Studyboard Pro" with a **Recurring** price of $2.99 per month and another of $19.99 per year. Copy both price ids (`price_...`). No payment links are needed any more; the checkout is created by your server.
- **Settings > Billing > Customer portal:** turn it on (allow cancel and card changes).
- **Developers > API keys > Create restricted key** with **Write** on Customers, Checkout Sessions and Customer portal sessions, and **Read** on Subscriptions and Charges. This is `STRIPE_SECRET_KEY` (the webhook uses it to read renewal dates and to find the owner of a disputed charge).

**4. Deploy the four functions** (Supabase **Edge Functions > Deploy a new function > Via Editor**, paste the file, exact name, **Deploy**), then open each one's **Details** and set **Verify JWT**:

| Function | File | Verify JWT |
|---|---|---|
| `create-checkout` | `supabase-functions/create-checkout/index.ts` | **ON** |
| `create-portal-session` | `supabase-functions/create-portal-session/index.ts` | **ON** |
| `entitlement-token` | `supabase-functions/entitlement-token/index.ts` | **ON** |
| `billing-webhook` | `index (1).ts` (the billing webhook) | **OFF** (Stripe and RevenueCat can't sign in; each request is verified with its own secret) |

**5. Secrets** (**Edge Functions > Secrets**):
- `ENT_SIGNING_KEY` (step 2)
- `STRIPE_SECRET_KEY` (step 3), `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY` (the two `price_...` ids)
- `SITE_ORIGINS`: your website address, for example `https://studyboard.example` (comma separate more than one). The checkout only ever returns people to these addresses.
- `STRIPE_WEBHOOK_SECRET` (step 6), and later `REVENUECAT_WEBHOOK_AUTH` (a long random password, 16 characters or more)
- Optional: `STRIPE_PORTAL_CONFIG` (a `bpc_...` id), `RC_ALLOW_SANDBOX=1` (only while testing RevenueCat), `ALLOW_LOCALHOST=1` (only while testing the website on your computer)

**6. Stripe webhook.** **Developers > Webhooks > Add endpoint**: `https://YOUR-PROJECT.supabase.co/functions/v1/billing-webhook/stripe` with the events `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `charge.refunded`, `charge.dispute.created` and `charge.dispute.closed`. Reveal the **Signing secret** (`whsec_...`) and save it as `STRIPE_WEBHOOK_SECRET`. (Live mode has its own endpoint and secret.)

**7. The website.** Edit `website/config.js` (Supabase URL, the **public** anon/publishable key, app address, support email), fill the placeholders in `website/privacy.html` and `website/terms.html`, and upload the `website/` folder to a static host over HTTPS (Cloudflare Pages, Netlify or GitHub Pages; Netlify and Cloudflare also read `_headers` for extra security headers). In Supabase **Authentication > URL Configuration** add your website address as the **Site URL** (or an extra **Redirect URL** `https://YOUR-SITE/account/**`) so confirmation and reset links come back to it. Your email templates (`confirm-signup.html`, `reset-password.html`) show both a code and a link; the account page accepts either.

**8. Tell the database your site address.** In **SQL Editor**:
```sql
update public.studyboard_config set value = to_jsonb('https://YOUR-SITE'::text) where key = 'site_url';
```
(The app also has `SITE_URL` in `index.html`.) The checkout also allows this address, so you can add a second site later without touching secrets.

**9. Test with Stripe test mode.** Open `https://YOUR-SITE/account/?plan=monthly&src=app`, make a new account (or sign in), and you are taken to Stripe Checkout. Pay with `4242 4242 4242 4242`, any future date, any CVC. Within seconds `studyboard_entitlements` shows `plan = pro`, and the app shows the trial. Try **Manage billing**, a cancel, and in Stripe **Developers > Webhooks > Resend** an old event (it must be answered as a duplicate or ignored). Check `studyboard_billing_events` for the outcomes. The checkout only gives a 7-day trial to an account that never had one.

**10. App Store and Google Play (later, RevenueCat).** Apple and Google require their own payment system for subscriptions sold inside a store app, so store builds use **RevenueCat** (the app sends `plan-checkout`, **Restore Purchase** sends `plan-restore`), and the **same** `billing-webhook` records it.
- Make a RevenueCat account, add your iOS and Android apps, create the same two products in App Store Connect and Google Play Console (with the 7-day trial) and add them to one entitlement called `pro`.
- In the app wrapper, log in to RevenueCat with the person's Supabase user id, so the **App User ID** is that id. (Purchases under any other id, such as `$RCAnonymousID...`, give nothing.)
- RevenueCat **Integrations > Webhooks**: URL `https://YOUR-PROJECT.supabase.co/functions/v1/billing-webhook/revenuecat`, **Authorization header value** = the `REVENUECAT_WEBHOOK_AUTH` secret. **Send Test Event** should say delivered. Sandbox purchases are ignored unless you set `RC_ALLOW_SANDBOX=1`.
- A store refund (RevenueCat's `CANCELLATION` with reason `CUSTOMER_SUPPORT`) switches Pro off at once. A subscription from one store never cancels one from another (for example, a Stripe cancel can't end an App Store subscription), and none of them ever touches a gift from you.
- Apple only allows the website for people who already pay there (`EXTERNAL_PURCHASE_ALLOWED` stays `false` in store builds unless your storefront entitlements allow external purchase links).

### Launch Day

There is **one switch in the app** and **one in the server**, and either one turns Pro on:
- **App switch:** `const PRO_ENFORCED = false;` just above `const STORE` in `index.html`, under the heading *FLIP TO true TO LAUNCH PRO*.
- **Server switch:** `studyboard_config.paywall`. Setting it to `true` turns on every limit in the database (devices, storage, data, group size, message history, online backups) and tells every copy of the app, with no new build.

When you are ready:
1. Everything above is done in **live** mode: live Stripe products and price ids in the secrets, a live webhook and its `whsec_`, the live restricted key, the website live with the right `config.js`, `site_url` set, the self-test passing.
2. Turn on the server switch (**SQL Editor**):
   ```sql
   update public.studyboard_config set value = 'true' where key = 'paywall';
   ```
3. In `index.html` change `const PRO_ENFORCED = false;` to `true`, build the app and upload the new `index.html`. (Step 2 alone already works for people online; step 3 makes it work from the first moment and offline.)
4. Open **Settings > Studyboard Pro**, check it says **You're on the Free Plan** with the two prices, buy Pro once yourself with a real card, check it turns on, then cancel and refund it (the refund must switch Pro off).

To turn Pro off again set both switches back to `false`. Nobody loses anything.

### Give or Take Back Pro for Specific Accounts (Safely)

Only you can do this: in the **SQL Editor** (or with the service role). The functions refuse every signed-in person and the public key (the self-test proves it), and every use is written to `studyboard_pro_grants` (who ran it, when, how long, why).

```sql
-- by email, a year        select public.studyboard_grant_pro('friend@example.com', 365, 'beta tester');
-- by email, for good      select public.studyboard_grant_pro('you@example.com', null, 'owner');
-- by account id, 30 days  select public.studyboard_grant_pro_uid('PASTE-USER-ID', 30, 'contest winner');
-- take a gift back        select public.studyboard_revoke_pro('friend@example.com', 'ended early');
-- the log                 select * from public.studyboard_pro_grants order by created_at desc;
```
A new grant replaces the old one for that person (the days count from now). The account must already exist (they sign up first). Grants live in their own columns, separate from payments: a cancelled or refunded subscription never removes your gift, and revoking a gift never cancels a subscription. The app shows a gift as **Pro (granted)** and the token tier is `pro` (with an end date) or `lifetime` (no end date). Older gifts made with the previous version of this function are moved into grants automatically when you run the SQL again.

### Threat Model: How Someone Could Try to Get Pro for Free

| Attempt | What stops it |
|---|---|
| Edit their own `studyboard_entitlements` row through the API | Row level security allows **select of your own row only**; there is no insert, update or delete policy, and the table privileges for writing are removed from `anon` and `authenticated`. The self-test tries each. |
| Call the grant function, or the billing function, or the limit helpers | `EXECUTE` is revoked from PUBLIC, anon and signed-in users for every overload (a sweep over `pg_proc` re-applies this each time the SQL runs); the functions pin `search_path`, and also check the caller's role. A forged `role` claim doesn't help, since the database role is what counts. |
| Change prices, limits or the paywall switch | `studyboard_config` is read-only for everyone but you, and a check constraint refuses keys or values that look like secrets (it is publicly readable). |
| Reset their own usage totals, delete or fake device rows of others | `studyboard_usage` is read-only for users, only triggers update it; device rows are limited by row level security to your own. |
| Edit the app (`index.html`, local storage) to say Pro | Themes and style are only cosmetic. The app trusts only a **signed token** (`entitlement-token`, Ed25519, checked with `ENT_PUBKEY`), which expires (at most 7 days; 1 day for free; trials 2 days) and carries the server's clock so a set-back device clock is noticed. Without the private key nobody can forge one. Anything that costs you money is enforced by the database regardless. |
| Replay or forge a Stripe webhook | Signature (HMAC) verified in constant time, timestamps older or newer than 5 minutes refused, and every event id is stored so a repeat does nothing. The result of an event is applied only if it is not older than the newest one already applied. |
| Forge a RevenueCat webhook | The Authorization header is compared in constant time against your secret; RevenueCat sandbox events are ignored in production. |
| Give Pro to a stranger or an invented id with metadata | Only checkouts made by `create-checkout` count (the webhook requires `client_reference_id` = `metadata.uid`, set only by that function); the account must exist in `auth.users`; a Stripe customer is linked to one account only and an id can't be moved to another. |
| Pay a lower price, or choose their own price id | The browser sends only `monthly` or `yearly`; price ids live in server secrets. Return addresses are checked against an allowlist (no open redirect). |
| Get the free trial again and again | The checkout gives the trial only to accounts that never had one. (Making many new accounts with new email addresses can still get a trial each; that's the one thing a card-free app can't fully prevent, and the trial can be turned off with the `app_trial` and trial settings.) |
| Subscribe, then get a refund or chargeback and keep Pro | Full refunds and disputes switch Pro off and **keep it off** until a brand new purchase; a lost dispute stays off, a won one is restored. |
| One payment source cancelling another, or a Stripe cancel wiping a gift | Paid sources are tracked by owner (Stripe vs App Store/Google), and an event from one never ends another's live subscription; gifts have their own columns that payment events never write. |
| Stay on more devices than allowed | The database refuses a 3rd device and limits swaps to 4 removals a week. **Honest limitation:** the device list is written by the app, so a modified app could avoid registering a device at all and sync without being counted. Data and file limits still apply to such a client, so it can't use more storage; to stop this you would have to gate every data write on a registered device, which was not done because it would break normal sign-in. |
| Store unlimited data as "online backups" | Online backups are a Pro feature (refused for free accounts), have their own total and are pruned after 30 days. Changing an item's kind is checked as well, and sizes are measured on the JSON text, so compression can't hide them. |
| Write files with no owner folder | Refused by the storage trigger (when the paywall is on). |
| Read other people's plan, usage, devices or the server-only tables | Row level security; the billing, grant, rate-limit and event tables have no policies and no grants, and none of them is sent over Realtime. |
| Hammer checkout, billing or token functions | Each account is rate limited (10 checkouts, 20 portal opens, 40 tokens per hour), and the sign-in page slows down after 5 wrong passwords (Supabase adds its own limits). |
| Steal the signing key or a Stripe key from the website | Neither is ever in the website or the app. `config.js` holds only public values; the website pages have a strict Content-Security-Policy and write all dynamic text with `textContent`. |

What this does **not** stop: someone who edits their own copy of the app can unlock the cosmetic themes on their own device (nothing else is gained, and Pro can't be proven to anyone), and an account shared between friends (the device limit slows that). If you later sell something expensive, enforce it on the server like the limits above.

### Entitlement Token Contract (for developers)

`entitlement-token` (Verify JWT **on**) returns `{tier, exp, uid, iat, sig}` and the headers `X-Server-Time` and `Date`. `tier` is `free`, `pro`, `trial` or `lifetime`; `exp` and `iat` are unix seconds (never more than 7 days apart, which the app limits to 8); `sig` is Ed25519 over the UTF-8 text `studyboard-ent-v1|<uid>|<tier>|<exp>|<iat>`, base64url without padding. The private key is a PKCS8 DER written as base64url; the public key is the raw 32 bytes as base64url. Test it all offline with `node --experimental-strip-types supabase-functions/tools/test-functions.mjs`.

### Good to Know

- **People who already have a season theme on** will see it switch to Classic after launch unless they have Pro. Their choice is remembered, so it comes back the moment they go Pro.
- **Offline:** the app remembers each person's plan on their device, so Pro keeps working without internet.
- **Devices:** the free plan counts devices when people sign in. On a 3rd device, Studyboard shows the devices on the account with **Remove** buttons, and **Go Pro**.
- **Limits are checked twice:** the app explains the limit before an upload, and Supabase refuses anything over the limit even if someone changes the app.
- **Single items or packs:** the shop can also sell single cosmetic items later. Set `item_purchases` to `true` and hook up a checkout for them. Pro always unlocks everything.


### Public Launch Checklist (Pro)

- [ ] `supabase-plans-selftest.sql` ends with **ALL n SECURITY CHECKS PASSED** on your live project.
- [ ] Stripe is in **live** mode: live price ids, restricted key and webhook secret saved as secrets, and the live webhook points at `billing-webhook/stripe` with all eight events.
- [ ] You bought Pro yourself with a real card on the website, saw it switch on in the app, then cancelled and refunded it (Pro must switch off after the refund). **Manage billing** on the account page opens the Stripe portal.
- [ ] Prices, the trial length and the refund policy on the Stripe checkout page match `website/terms.html` and the Terms in the app. The placeholders in `website/privacy.html` and `website/terms.html` are filled in, and `website/config.js` has your real values.
- [ ] `SITE_ORIGINS` and `site_url` are your real website address; the Supabase **Site URL** and redirect allowlist include `https://YOUR-SITE/account/**`.
- [ ] You know that **Delete My Account and Data does not cancel a Stripe subscription**. Tell people to cancel first (the app says so), and cancel in Stripe yourself if someone writes asking you to remove their account.
- [ ] Both switches (`paywall` in `studyboard_config` and `PRO_ENFORCED` in `index.html`) are set the way you want, and the "early access" wording in the Style Shop and welcome tour disappears once the paywall is on.
- [ ] App Store and Google Play (only if you ship a store app): RevenueCat webhook tested, subscriptions cancellable from each store, Restore Purchase works, and each store's privacy label and data-safety form match the Privacy Policy.
