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

### 1. Add the Plan Tables (Once)

You'll need `supabase-plans.sql` from the zip. Run the SQL files in the order listed in `SETUP-GUIDE.md` ("Run the SQL files in this order"): `supabase-setup.sql` first, `supabase-groups.sql` before this file, and `supabase-lean.sql` last.

In Supabase open **SQL Editor**, then **New query**. Paste everything from `supabase-plans.sql` and click **Run**. You should see *Success. No rows returned*. It's safe to run again any time, and it never changes values you've edited.

It adds:
- **studyboard_config:** prices, limits and switches. The app reads it, so you can change a price or a limit here without a new version of the app.
- **studyboard_entitlements:** who has Pro and until when. People can see only their own row. Only the payment function below can change it.
- **studyboard_devices:** the devices signed in to each account.
- **studyboard_usage:** a running total of each account's data and files.
- Checks that keep free accounts to their limits (only once the paywall is on), and a nightly clean-up of group messages older than 60 days in groups owned by free accounts.

Run `supabase-groups.sql` before `supabase-plans.sql`, so the group limits can be added. If you run `supabase-groups.sql` later, run `supabase-plans.sql` again after it.

If you see a notice that the file storage triggers were skipped, that's OK. Some Supabase projects don't allow extra rules on file storage. The app still checks the storage limit before each upload.

**Change a price or a limit:** in **Table Editor**, open **studyboard_config** and edit the **value** of a row. For example, `limits` holds both plans. A blank (`null`) limit means no limit. The app always shows devices, group members and group message history as 2 / 3 / 60 days on Free and unlimited / 100 / unlimited on Pro, whatever this row says; changing those three needs an app update (and the matching change in `supabase-plans.sql`).

**Give someone Pro for free** (a friend, a tester, yourself), in **SQL Editor**:
```sql
select public.studyboard_grant_pro('friend@example.com', 365);   -- a year of Pro
select public.studyboard_grant_pro('you@example.com', null);     -- Pro for good
```

### 2. Set Up Stripe (Website and Desktop App)

Stripe takes the card payments. You don't need to write any code: Stripe **Payment Links** are ready-made checkout pages.

**Make the product**
- Sign up at [stripe.com](https://stripe.com) and finish the account setup so you can take payments. (You can do everything below in **Test mode** first.)
- Open **Product catalog**, click **Add product**, and name it **Studyboard Pro**.
- Add a **Recurring** price of **$2.99** every **month**, and a second **Recurring** price of **$19.99** every **year**.

**Make two payment links**
- Open **Payment Links** and click **New**. Pick Studyboard Pro and the monthly price.
- Under **Options**, turn on **Include a free trial** and set it to **7 days**.
- Under **After payment**, choose **Don't show confirmation page** and send people back to your Studyboard web address.
- Click **Create link**. Copy the link (it starts with `https://buy.stripe.com/`).
- Do the same for the yearly price.

Studyboard adds the person's account id to the link when they tap a price (`client_reference_id`), so the payment goes to the right account. You don't add anything.

**Put the links in Supabase.** In **SQL Editor**, paste your two links in place of the examples and click **Run**:
```sql
update public.studyboard_config set value = to_jsonb('https://buy.stripe.com/YOUR_MONTHLY_LINK'::text) where key = 'checkout_url_monthly';
update public.studyboard_config set value = to_jsonb('https://buy.stripe.com/YOUR_YEARLY_LINK'::text) where key = 'checkout_url_yearly';
```

**Let people manage their plan.** In Stripe open **Settings > Billing > Customer portal**, turn it on, and copy the **login link**. Then:
```sql
update public.studyboard_config set value = to_jsonb('https://billing.stripe.com/p/login/YOUR_LINK'::text) where key = 'manage_url';
```
**Manage Plan** in the Studyboard Pro sheet opens it, so people can cancel or change cards by themselves.

### 3. Add the Payment Function

This small function hears from Stripe (and from RevenueCat, below) when someone buys, renews or cancels, and turns Pro on or off for them. You'll need `supabase-functions/billing-webhook/index.ts` from the zip.

**Deploy it**
- In Supabase open **Edge Functions**, click **Deploy a new function**, then **Via Editor**.
- Delete the sample code. Paste everything from `supabase-functions/billing-webhook/index.ts`.
- Set the function name to exactly `billing-webhook` and click **Deploy function**.
- Click **billing-webhook**, open **Details**, and turn **off** **Verify JWT** (it may be called **Enforce JWT Verification**). Click **Save changes**. Stripe and RevenueCat can't sign in to Supabase; each message is checked with its own secret instead.

**Tell Stripe about it**
- In Stripe open **Developers > Webhooks** and click **Add endpoint**.
- Endpoint URL: `https://YOUR-PROJECT.supabase.co/functions/v1/billing-webhook/stripe`
- Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` and `invoice.paid`.
- Click **Add endpoint**, then **Reveal** the **Signing secret** (it starts with `whsec_`).

**Add the secrets.** In Supabase open **Edge Functions > Secrets** and add:
- `STRIPE_WEBHOOK_SECRET`: the signing secret from Stripe.
- `STRIPE_SECRET_KEY` (recommended): in Stripe open **Developers > API keys**, click **Create restricted key**, give it **Read** access to **Subscriptions** only, and paste that key. The function uses it to read the exact renewal and trial dates.

**Try it.** In Stripe's Test mode, open your payment link from Studyboard (tap a price in the Studyboard Pro sheet with the paywall on, see Launch Day) and pay with the test card `4242 4242 4242 4242`. Within a few seconds the sheet shows **Your Pro Trial Is On**. In Supabase, **studyboard_entitlements** has a new row.

### 4. App Store and Google Play (Later, With RevenueCat)

Apple and Google require their own payment systems inside phone apps from their stores. **RevenueCat** handles both and tells the same payment function what happened. You only need this once Studyboard is in the App Store or Google Play. The website works on phones without it.

- Make a free account at [revenuecat.com](https://www.revenuecat.com) and add your iOS and Android apps.
- Make the same two products in App Store Connect and Google Play Console (monthly and yearly, with a 7-day free trial), and add them to one RevenueCat **entitlement** called `pro`.
- In the app wrapper, log in to RevenueCat with the person's Supabase user id, so RevenueCat's **App User ID** is that id. When someone taps a price in Studyboard, the app sends a `plan-checkout` event; the wrapper's RevenueCat code shows the store's checkout. **Restore Purchase** sends `plan-restore`.
- In RevenueCat open **Integrations > Webhooks**, and add:
  - URL: `https://YOUR-PROJECT.supabase.co/functions/v1/billing-webhook/revenuecat`
  - Authorization header value: a long random password you make up.
- In Supabase **Edge Functions > Secrets**, add `REVENUECAT_WEBHOOK_AUTH` with that same password.
- Click **Send Test Event** in RevenueCat. It should say it was delivered.

### Entitlement Signing Key (once, before launch)

The app does not trust a "Pro" flag saved on the device. It asks the `entitlement-token` function for a short-lived **signed token** (valid for at most 7 days, refreshed while the subscription is active) and checks the signature with a public key built into the app. The token says `{tier, exp, uid, iat, sig}`, and `sig` is an Ed25519 signature (base64url) over the text `studyboard-ent-v1|<uid>|<tier>|<exp>|<iat>`.

Make the key pair once, on your own computer (Node 18 or newer):
```bash
node -e "const c=require('crypto');const k=c.generateKeyPairSync('ed25519');console.log('PUBLIC  (put in index.html ENT_PUBKEY):',k.publicKey.export({format:'jwk'}).x);console.log('PRIVATE (put in the Supabase secret ENT_SIGNING_KEY):',k.privateKey.export({format:'der',type:'pkcs8'}).toString('base64url'))"
```
- Copy the **PUBLIC** value into `const ENT_PUBKEY = "..."` at the top of the Plans module in `index.html` (it says "REPLACE with the output of the key-generation step"). Until you do, the app falls back to reading each person's own plan row from Supabase, which still works but can't be checked offline.
- Put the **PRIVATE** value in the Supabase secret the `entitlement-token` function uses. Never put it in the app or in git.

Honest note: Studyboard is a client-side app, so a determined person can always edit their own copy of `index.html`. The themes, companions and stickers are locked for everyone else, and the things that cost you money (file and data storage, the device limit, group size and message history, online backups) are enforced by Supabase itself, so they stay limited no matter what the app says.

### Launch Day

There is **one switch in the app** and **one in the server**, and either one turns Pro on:
- **App switch:** `const PRO_ENFORCED = false;` just above `const STORE` in `index.html`, under the heading *FLIP TO true TO LAUNCH PRO*.
- **Server switch:** `studyboard_config.paywall`. Setting it to `true` in Supabase turns Pro on for every copy of the app, with no new build. The app remembers a `true` answer, so deleting local data can't switch it off; only the server answering `false` (or you changing the app constant and the server) switches it back.

Nothing on the device can turn Pro enforcement off once either switch says on. (A tester can force it **on** with `localStorage.setItem("studyboard:paywall-test","1")`.)

When you're ready to start selling Pro:
1. Check the steps above are done: `supabase-plans.sql` run, the `billing-webhook` and `entitlement-token` functions deployed with their secrets, the signing key in place (`ENT_PUBKEY`), your website's account page live, and Stripe switched from Test mode to live.
2. **Set your website address.** In `index.html` set `const SITE_URL = "https://your-site"` (or set `site_url` in `studyboard_config` with `update public.studyboard_config set value = to_jsonb('https://your-site'::text) where key = 'site_url';`, inserting the row first if needed). **Buy** and **Manage Plan** open `https://your-site/account?plan=monthly|yearly&src=app` in the person's browser. People log in there with their Studyboard account and pay with Stripe Checkout; the app notices by itself (when they come back to the window, plus a check every 10 seconds for 2 minutes, plus an **I've Purchased: Refresh** button).
3. **Turn on the server switch.** In **SQL Editor**:
   ```sql
   update public.studyboard_config set value = 'true' where key = 'paywall';
   ```
4. **Turn on the app switch.** In `index.html`, change `const PRO_ENFORCED = false;` to `const PRO_ENFORCED = true;`. Build the app and upload the new `index.html` like any update. (If you only did step 3, Pro is already on for people who open the app online; step 4 makes it on from the first moment, also offline.)
5. **App Store and Google Play builds** use the store's own in-app purchase automatically (the `plan-checkout` event, see RevenueCat above), because Apple requires it for subscriptions sold inside the app. The constant `EXTERNAL_PURCHASE_ALLOWED` (default `false`) lets store builds use your website instead; only change it if your storefronts allow external purchase links.
6. Open Studyboard, go to **Settings > Studyboard Pro**, and check that it says **You're on the Free Plan** with the two prices. Buy Pro once yourself (or use `studyboard_grant_pro`) and check it switches to **You Have Studyboard Pro**. In Settings the plan reads **Free**, **Pro until <date>** or **Pro (granted)**.

To turn Pro off again, set both switches back to `false`. Nobody loses anything: items people bought or earned stay theirs, and anyone's chosen theme comes back as soon as they have Pro again.

### Good to Know

- **People who already have a season theme on** will see it switch to Classic after launch unless they have Pro. Their choice is remembered, so it comes back the moment they go Pro.
- **Offline:** the app remembers each person's plan on their device, so Pro keeps working without internet.
- **Devices:** the free plan counts devices when people sign in. On a 3rd device, Studyboard shows the devices on the account with **Remove** buttons, and **Go Pro**.
- **Limits are checked twice:** the app explains the limit before an upload, and Supabase refuses anything over the limit even if someone changes the app.
- **Single items or packs:** the shop can also sell single cosmetic items later. Set `item_purchases` to `true` and hook up a checkout for them. Pro always unlocks everything.

### Public Launch Checklist (Pro)

- [ ] Stripe is in **live** mode: live payment links saved in `studyboard_config`, a live webhook pointing at `billing-webhook/stripe`, and the live `STRIPE_WEBHOOK_SECRET` set.
- [ ] You bought Pro yourself with a real card, saw it switch on, then cancelled and refunded it. The **Manage** link in `studyboard_config` (`manage_url`) opens the Stripe customer portal.
- [ ] Prices, the trial length and the refund policy shown on the Stripe checkout page match the Terms of Service in the app.
- [ ] `PRIVACY` and `TERMS` in the app mention Stripe (they do) and your support address is set (see the Public Launch Checklist in `SETUP-GUIDE.md`).
- [ ] You know that **Delete My Account and Data does not cancel a Stripe subscription**. Tell people to cancel first (the app says so), and cancel subscriptions yourself in Stripe if someone writes asking you to remove their account.
- [ ] The paywall switches (the `paywall` row and `const STORE` in `index.html`) are set the way you want, and the "early access" wording in the Style Shop and welcome tour disappears once the paywall is on.
- [ ] App Store and Google Play (only if you ship a store app): RevenueCat webhook tested, subscriptions cancellable from each store, Restore Purchase works, and each store's privacy label and data-safety form match the Privacy Policy.
