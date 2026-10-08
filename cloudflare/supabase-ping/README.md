# Supabase keep-awake ping (Cloudflare Worker)

Supabase pauses a free project after a week without activity. This Worker makes one small read from your project every third day, at 14:17 UTC, so that never happens.

It replaces `.github/workflows/keep-supabase-awake.yml` and the GitHub workaround that made a tiny commit every 45 days.

It runs on the **Workers Free plan**, where scheduled runs (Cron Triggers) are included, so it costs nothing. It has no public web address (`workers_dev: false`), and only runs on its schedule.

## Deploy

```
cd cloudflare/supabase-ping
npx wrangler login
npx wrangler deploy
```

`wrangler.jsonc` already holds your project's public address and publishable key, the same values the app ships with.

Once it has run once, under **Workers & Pages > studyboard-supabase-ping > Settings > Triggers**, delete the GitHub workflow:

- `.github/workflows/keep-supabase-awake.yml`
- the `SUPABASE_URL` and `SUPABASE_KEY` secrets in the repository settings

Keep the GitHub workflow until then, so there's no gap. Two pings in the same week do no harm.

## Check it

In the dashboard, open the Worker, then **Cron Events**. A failed run (Supabase didn't answer) shows there as an error.

`node tests/supabase-ping.test.js` checks the logic in Node.
