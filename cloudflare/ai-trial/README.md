# Studyboard AI trial (Cloudflare Worker)

A signed-in student with a confirmed email and no AI key gets a few free AI tries before they add their own free Gemini key. By default that's 15 tries, at most 5 a day. The tries run on a small open model, Google's Gemma 4, through Cloudflare Workers AI. When they run out, the app shows how to get a free Gemini key.

- **Only jobs the student starts use the trial.** Automatic AI never does, and windows that would start AI on their own wait for a tap.
- **Text only.** Files, photos and web lookups need the student's own key, and the app says so.

## You can never be billed

This depends on one thing you control: **the Cloudflare account must stay on the Workers Free plan.** On that plan Cloudflare can't charge for AI. Its pricing page says Workers Free includes "10,000 Neurons per day" with no paid option ("Upgrade to Workers Paid"), and "If you exceed any one of the above limits, further operations will fail with an error." So the worst case on the Free plan is that the trial answers "busy" until midnight UTC.

To keep it that way:

1. **Use a Cloudflare account just for Studyboard, with no payment method on file.** You can't be upgraded to a paid plan without one, by mistake or otherwise.
2. **Never upgrade that account to Workers Paid, and never buy AI Gateway credits on it.** Both would let AI usage past the free amount be billed.
3. **Don't use Workers AI for anything else on that account.** The playground and `wrangler dev` with AI connected both use the same 10,000 a day.

The Worker adds its own limits on top. None of them is needed on the Free plan; they're a second line of protection.

| Protection | What it does |
|---|---|
| Hard daily ceiling | The Worker counts neurons per UTC day and stops at `DAILY_NEURONS` (8,000 by default). The code never allows more than **9,000**, whatever the setting says. Workers AI's free amount is 10,000. |
| Reserve first | Before the model runs, each request reserves its worst-case cost: input counted at 2 characters per token, a deliberate overestimate, plus the full output cap. Afterwards the reservation is replaced with what the model reports it used. If the model doesn't report usage, or fails, the full reservation stays counted. |
| Free-plan models only | Only models that run on the Free plan, with their rates written into the code. A model that needs paid billing (Kimi K2.6/K2.7, GLM 5.x, DeepSeek V4) is never used, even if `MODEL` names one. |
| Size caps | Input up to 16,000 characters and output up to 1,500 tokens by default. The settings can't go past 40,000 characters and 4,000 tokens. |
| Per-student caps | Tries in total and per day, counted in a Durable Object for each student. |
| Off switch | Set `TRIAL_OFF` to `"1"` and deploy. Every try then answers "busy" and the app points students to their own Gemini key. |

Nothing else in Studyboard can bill you for AI. Students' Gemini, Claude and ChatGPT keys are their own, and AI requests go from their device straight to that company. No Supabase function and no other part of this repository holds an AI key or calls an AI service.

## Turnstile (the "not a robot" check)

When `TURNSTILE_SITE_KEY` (in `wrangler.jsonc`) and the `TURNSTILE_SECRET` secret are both set, each student passes one Cloudflare Turnstile check before their first try.

1. The app asks this Worker for a check link. The link is signed for that student and lasts 15 minutes.
2. The app opens the link in the browser. That works from the website, the desktop app and the phone apps alike.
3. The page runs Turnstile and sends the result to this Worker, which confirms it with Cloudflare's siteverify.
4. The app sees the check is done and carries on.

Turnstile is free. Setup steps are in `cloudflare/PROTECTION.md`, section 6. While either key is missing there's no check, and everything else works the same.

## What it stores

- **Per student:** a count of tries (total, and today), and whether they passed the check, under their Supabase user id.
- **Per day:** the neurons used. Old days are deleted after 3 days.

What students send isn't stored. Logs are off (`observability.enabled: false`).

## Deploy (about 5 minutes)

You need the free Cloudflare account described above, and Node.js 20 or newer.

```
cd cloudflare/ai-trial
npx wrangler login
npx wrangler deploy
```

1. **Check the settings before deploying.** `wrangler.jsonc` already has your Supabase project's public address and publishable key, the same ones the app ships with. They're used only to check who is signed in. Change `TRIAL_USES`, `DAILY_USES` or `DAILY_NEURONS` if you like.
2. **Point the app at the Worker.** In `index.html`, set `const AI_TRIAL = "https://studyboard-ai-trial.<your-subdomain>.workers.dev";`.
3. **Refresh and rebuild.** Run `node scripts/csp.js`, then rebuild the website and apps as usual.
4. **Optional checks.** In the Cloudflare dashboard, Workers & Pages should say **Free** plan. Under Billing there should be no payment method. AI > Workers AI shows the neurons used each day.

While `AI_TRIAL` is empty there's no trial, and the app works exactly as before.

## How far the free amount goes

A typical try (a few thousand characters in, a few hundred tokens out) costs roughly 15 to 40 neurons. The default 8,000 a day covers roughly 200 to 500 tries a day across all students.

## Test it

These run the same code in Node, with a fake model:

```
node tests/ai-trial.test.js     # the limits and the money rules
node tests/ai-trial.e2e.js      # the app in Chromium, signed in, with the trial
```
