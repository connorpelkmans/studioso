# Protecting studyboardapp.com with Cloudflare (all free)

studyboardapp.com is already served through Cloudflare: the root `wrangler.jsonc` publishes the site, and `.assetsignore` limits it to what the app and website load. Everything below is free on the **Free plan** and needs no payment method, so none of it can bill you.

These are settings in the Cloudflare dashboard, not code. Open **dash.cloudflare.com**, pick the **studyboardapp.com** domain, and go through the list once, in order. Each step takes a minute or two.

## 1. DDoS protection: check it's on (it is by default)

Cloudflare blocks DDoS attacks automatically and without limit on every plan, for all traffic that goes through it.

- **DNS > Records:** every record for `studyboardapp.com` and `www` should show an orange cloud (**Proxied**). A grey cloud (**DNS only**) bypasses Cloudflare, protection included. Switch any grey ones to orange, except records for email (MX) or verification (TXT), which have no cloud.
- **Workers and the website:** these are always behind Cloudflare. That includes the key relay, the AI trial and the site itself.

## 2. Bot Fight Mode

**Security > Bots > Bot Fight Mode: On.** Known bad bots get a challenge or a block.

Also on that page:

- **Block AI bots: On** (optional). This stops AI crawlers from scraping the website.
- **AI Labyrinth** (optional). It gives misbehaving crawlers fake pages to waste their time.

Bot Fight Mode only covers traffic to `studyboardapp.com`. It doesn't touch:

- Supabase (`*.supabase.co`), so sign-in, sync and Stripe webhooks aren't affected.
- The Workers on `workers.dev`: the key relay, the AI trial and the Supabase ping.

**Keep the Workers on their `workers.dev` addresses.** On the Free plan, Bot Fight Mode can't make exceptions. If a Worker moved to your own domain, it could challenge the desktop and phone apps' requests to it.

After switching it on, check these in a private browser window:

- the website
- the account page (sign in, Manage Plan)
- the web app

## 3. Security settings

Under **Security > Settings**:

- **Security level:** leave it at the default (Medium). Raise it to **I'm Under Attack** only during an attack. That shows every visitor a 5-second check, so switch it back afterwards.
- **Browser Integrity Check:** **On**. It turns away requests with forged or missing browser headers.
- **Challenge passage:** 30 minutes is fine.

## 4. WAF (web application firewall)

- **Security > WAF > Managed rules:** the **Cloudflare Free Managed Ruleset** is on by default on Free plans. It covers common attacks. Leave it on.
- **Security > WAF > Rate limiting rules:** the Free plan includes one rule. A good use is the account page:
  - **If:** URI path starts with `/website/account`
  - **Rate:** more than 30 requests in 10 seconds, from the same IP
  - **Then:** Block, for 10 seconds

  Real students never come close to this, but password-guessing scripts do. Supabase also limits sign-in attempts on its side.

## 5. SSL/TLS

- **SSL/TLS > Edge Certificates > Always Use HTTPS:** **On**.
- **Minimum TLS Version:** **TLS 1.2**.
- **HSTS:** leave it off here. Your `_headers` file already sends HSTS (with preload), and two sources would conflict.

## 6. Turnstile (the "not a robot" check)

Students pass this once, before their first free AI try. It stops bots from creating accounts just to use up the free AI everyone shares.

1. **Turnstile > Add widget.**
   - **Name:** Studyboard AI trial.
   - **Hostname:** the AI trial Worker's address without `https://`, for example `studyboard-ai-trial.<your-subdomain>.workers.dev`.
   - **Widget mode:** Managed.
2. **Copy the site key** into `TURNSTILE_SITE_KEY` in `cloudflare/ai-trial/wrangler.jsonc`.
3. **Store the secret key** as a secret, never in a file:

   ```
   cd cloudflare/ai-trial
   npx wrangler secret put TURNSTILE_SECRET
   npx wrangler deploy
   ```

Why it isn't on the sign-in form: Turnstile only runs on real web addresses (running anywhere is an Enterprise feature). The desktop app (`app://studioso`) and the phone apps (`capacitor://localhost`) aren't web addresses. If Supabase required Turnstile at sign-in, students couldn't sign in from the apps. So the check runs on the AI trial's own page, which opens in the browser from every version of the app. Sign-up is still protected by email confirmation and Supabase's own rate limits.

## What's protected after this

| Threat | Protection |
|---|---|
| DDoS floods | Cloudflare's automatic DDoS protection, with no limit (step 1) |
| Scrapers and bad bots on the website | Bot Fight Mode, plus Block AI bots (step 2) |
| Common web attacks | Free Managed Ruleset (step 4) |
| Password guessing on the account page | One rate-limiting rule (step 4), plus Supabase's own limits |
| Bots using up the free AI trial | Turnstile check (step 6), confirmed email, per-student and daily caps |
| Bots using up the key relay | 10-minute, single-use boxes, and the free plan's hard limits |
| Repo internals readable on the site | `.assetsignore` allow-list (already done) |
