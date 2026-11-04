# Studyboard AI (Pro), Cloudflare Worker

Pro students get AI with nothing to set up. Every AI feature runs on **Claude Haiku 5.5** through this Worker, which holds Studyboard's Anthropic key. YouTube links go through Google's Gemini API, which watches the video and writes its transcript; Haiku then makes the notes and cards. Lecture audio uses Whisper on Cloudflare Workers AI, and search by meaning uses bge-m3, also on Workers AI.

**It's off until you add the key.** Without `ANTHROPIC_API_KEY` every request answers `off`, and the app carries on as before: students use their own key or the free trial.

## Turn it on

You need a Cloudflare account on the **Workers Paid** plan ($5 a month), an Anthropic API key and Node.js 20 or newer.

1. **Set a monthly spend limit in the Anthropic Console first.** Go to Settings, Limits, and pick an amount you're comfortable with. This is the backstop that nothing in code can get past. See "What protects you" below.
2. Deploy:
   ```
   cd cloudflare/ai-pro
   npm install
   npx wrangler login
   npx wrangler deploy
   npx wrangler secret put ANTHROPIC_API_KEY
   ```
3. For YouTube links (optional): `npx wrangler secret put GOOGLE_AI_KEY`. Use a key from Google AI Studio **with billing on**. On the free tier Google allows only 8 hours of YouTube video a day across all your students, and may use what's sent to improve its products.
4. Point the app at the Worker. In `src/js/01-ai.js`, set `const AI_PRO = "https://studyboard-pro-ai.<your-subdomain>.workers.dev";`, then run `node scripts/csp.js` and ship the app as usual.

You can deploy the Worker and ship the address in the app before you add the key. The app checks the Worker's status, so adding the key later (step 2's last command) turns Studyboard AI on for every Pro student without a new release.

To turn it off later without removing the key, set `PRO_AI_OFF` to `"1"` in `wrangler.jsonc` and deploy. Students then fall back to their own key.

## Who gets it

The Worker reads the student's own row in `studyboard_entitlements`, using their sign-in. Row-level security means it can only read their row, and students can't write it, so the app can't claim Pro it doesn't have.

| Plan | Allowance |
|---|---|
| Paid Pro or lifetime | `MONTHLY_HARD_USD` a month ($4 by default) |
| Pro from a grant or promo code | `GIFT_MONTHLY_HARD_USD` ($4 by default) |
| The free week of Pro | `TRIAL_TOTAL_USD` in total, once ($0.30 by default; `"0"` gives none) |
| Free, lapsed, guest or unconfirmed email | None |

## What each job costs, and who decides

The app sends only the job's name, its text and files, and the shape of the answer it wants. **The Worker chooses everything else.** It ignores any model, thinking level, output cap, temperature or tool list the app sends.

| Jobs | Thinking | Why |
|---|---|---|
| Grading answers, Teach It Back, Rubric Check, Ask About Course, syllabus import, flashcard, quiz and case sets, practice tests, Break It Down | High | Where answer quality matters most |
| Companion chat, Ask, summaries, explanations, exam plans | Medium | Good answers, short replies |
| The automatic plan, session tuning, estimates, weekly review | Low | Ranks and words what the app has already worked out |
| Exam location check, quick add, announcement dates, companion lines | None | Thinking adds cost and nothing else |

`TASKS` in `src/pro.js` lists every job with its thinking level and output cap. **Past the soft limit** (`MONTHLY_SOFT_USD`, $3 by default), everything except the hard jobs drops to low thinking, so the month lasts. **At the hard limit**, AI stops until the 1st of the next month (UTC), and the app offers the student's own Gemini key.

## What protects you

Every job is charged **before** it runs, at its worst case, and corrected afterwards to what Anthropic, Google or Cloudflare reports.

- **Reserve first, settle after.** The worst case assumes every input token is written to the cache (1.25×) and the whole output cap is used. Input is counted three ways:
  - **Plain text:** its UTF-8 byte count. A byte is never split across tokens, so this is always at least the token count.
  - **Files, or text too long for that bound to fit the limit:** Anthropic's own `count_tokens` result.
  - **Anything else** that could be billed but didn't report usage (a timeout, a dropped connection, a Worker that stopped) keeps its full reservation.
- **Per student,** in a Durable Object that handles one request at a time:
  - a monthly limit
  - a daily limit (`DAILY_USD`, $1)
  - the free-week total
  - `PER_MINUTE` requests (20)
  - `MAX_INFLIGHT` jobs at once (4)
- **For everyone together:** `GLOBAL_DAILY_USD` ($25) a day. Past it, every request answers "busy" until midnight UTC.
- **Settings can't be raised past hard ranges** in code (`HARD` in `src/pro.js`): $10 a month and $3 a day per student, $2000 a day for everyone.
- **Prompt size:**
  - Prompts are capped at 90K tokens, under Haiku's 100K long-prompt rate (5× the price).
  - Web lookups use at most one search and one page, with at most about 8K tokens of input, so the whole tool loop stays under 100K too.
- **What students can send:** text, images (PNG, JPEG, GIF, WebP) and PDFs. URLs, file ids, tools and custom cache settings are dropped or refused.
- **No retries inside the SDK,** so a retried request can't be billed twice.
- **Deleting an account** (Delete My Account) closes its id for good, so deleting can't reset an allowance.
- **Logs are off** (`observability.enabled: false`). What students send isn't stored.

**The one thing code can't promise:**
- A student can use their own allowance for anything Haiku will answer, since the instructions come from the app. That's bounded by their allowance, which is the point of it.
- The absolute ceiling on your Anthropic bill is the **spend limit in the Anthropic Console** (step 1). Set it.
- Google (YouTube) and Cloudflare (Whisper, embeddings) usage is reserved and counted the same way. Set a budget alert in Google Cloud for the YouTube key as well.

## Cost per student

From a simulation of the app's real prompts (a busy semester: 6 courses, 90 tasks, 1,200 flashcards, lecture transcripts), with the settings above:

| Student | A month |
|---|---|
| Average (light, typical and heavy, weighted) | about $0.96 |
| Typical | about $0.65 |
| Heavy | about $2.30 |
| Uses every feature as much as the app allows | stopped at $4 (the hard limit) |

A one-hour YouTube lecture costs about $0.10. A one-hour recording transcribed by Whisper costs about $0.03.

## Endpoints

All need the student's Supabase access token as `Authorization: Bearer …`.

| | |
|---|---|
| `GET /v1/status` | `{on, tier, usedPct, soft, resets, transcribe, youtube}` |
| `POST /v1/ai` | `{task, system, content: [blocks], schema, search?, urlContext?}` → `{data, truncated, usedPct, soft, resets}` |
| `POST /v1/embed` | `{texts: [up to 100]}` → `{vectors}` |
| `POST /v1/transcribe` | raw audio (up to 20 MB), `Content-Type: audio/*` → `{text}` |
| `POST /v1/youtube` | `{url}` → `{title, transcript, onScreen}` |
| `DELETE /v1/me` | Delete My Account |

Errors: `402` `used_up` or `today`; `429` `rate`; `413` `too_long`; `403` `not_pro` or `unconfirmed`; `422` `refused` or `video`; `503` `busy` or `off`.

## Tests

- `node tests/ai-pro.test.js`: every limit, and the ways around them we could think of.
- `node tests/ai-pro.e2e.js`: the app against this Worker's logic.
