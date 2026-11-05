# Studyboard AI (paid Pro), Cloudflare Worker

Students on a **paid** Pro plan get AI with nothing to set up. Every AI feature runs on **Claude Haiku 5.5**:

- **Claude:** reached through **Cloudflare AI Gateway with Unified Billing**. Cloudflare's own provider keys make the calls and Cloudflare bills your Cloudflare credits, so no Anthropic account or key of yours is involved.
- **YouTube links:** go to Google's Gemini through the same gateway. Gemini watches the video and writes its transcript, then Haiku makes the notes and cards.
- **Lecture audio:** Whisper on Workers AI.
- **Search by meaning:** bge-m3 on Workers AI.

**It's off until the gateway is set up.** Without `CF_ACCOUNT_ID`, `AI_GATEWAY_ID` and the `CF_AIG_TOKEN` secret, every request answers `off`, and the app carries on as before: students use their own key.

## Paying for it: Unified Billing or your company key

- **Unified Billing (the default):** Cloudflare's own provider keys make the calls, and Cloudflare bills your prepaid credits at the providers' prices plus a **5% fee on each credit purchase**. Good for launch: there's no Anthropic account to set up, and you don't start on Anthropic's low new-account rate limits.
- **Your company Anthropic key (no 5%):** in the gateway, open Provider Keys and add your Anthropic key under the name **`default`**. The gateway then uses it for every Claude request, and Anthropic bills you directly. Nothing in the Worker changes. Also set a monthly spend limit in the Anthropic Console. The usage reports, and so the students' allowances and your usage summary, stay exactly the same.
- **YouTube links** (Gemini) stay on Unified Billing unless you also add a Google AI Studio key as `default`.
- **Transcription and search by meaning** run on Workers AI and are billed as normal Workers usage. There's no 5% on them either way.

## Checking usage: your summary

Set the `OWNER_TOKEN` secret (at least 24 random characters): `npx wrangler secret put OWNER_TOKEN`. Then:

```
curl -H "Authorization: Bearer <OWNER_TOKEN>" "https://studyboard-pro-ai.<your-subdomain>.workers.dev/v1/owner/usage?days=30"
```

It returns daily totals and a total for the period. Nothing a student sent is stored. The totals cover:
- jobs and cost, overall and by job (`grade`, `chat`, `plan` and so on)
- for each kind (`claude`, `youtube`, `whisper`, `embed`): input tokens, cache writes, cache reads, output tokens (thinking included), web searches, and minutes of audio

How it should compare with your bills:

| Part | Counted from | Compared with the bill |
|---|---|---|
| Claude | Anthropic's usage report for each job | Matches your Anthropic Console (or Cloudflare's gateway analytics) to within cents: each job is rounded up to the next millionth of a dollar |
| YouTube (Gemini) | Gemini's usage report and the prices in this file | Close. Videos over about 75 minutes are priced as if Google charged double above 200K tokens, so they can read high. The 5% isn't included. |
| Transcription | the audio length Whisper reports, at $0.00052 a minute | About 1% high (Cloudflare charges $0.000513) |
| Search by meaning | the text's size in bytes (Workers AI reports no usage) | Reads high; only about a cent per student a month |

**One student:** add `&user=<their account id>` (or use `?user=` on its own) to see their month so far: dollars used against the monthly limit, today's against the daily one, and their YouTube videos. It shows counts only, never what they asked.

`unreported` counts jobs that came back without a usage report. Those students were charged the job's worst case. A job whose Worker stops partway through (rare) is missing from the summary, so the summary can read slightly below the bill. The prices live in `src/js/01-ai-policy.js` and `src/pro.js`: if a provider changes its prices, update them there.

## Who gets it

Only a Pro plan someone pays for: monthly, semester, yearly or lifetime. The Worker reads the student's own row in `studyboard_entitlements` with their sign-in. Row-level security means it can only read their row, and students can't write it.

| Plan | Studyboard AI |
|---|---|
| Paid Pro or lifetime | Yes |
| The free week of Pro | No |
| Pro from a server grant or a promo code | No |
| Free, lapsed, guest, or an unconfirmed email | No |

## Turn it on

You need:
- A Cloudflare account on the **Workers Paid** plan ($5 a month), with a credit card for AI Gateway credits.
- Node.js 20 or newer.

Steps:

1. **Create the gateway.** In the Cloudflare dashboard, open AI, then AI Gateway, then Create a gateway (for example `studyboard`). In its settings:
   - Turn on **Authenticated Gateway** and create a gateway token.
   - Leave **Require provider credentials** off, so Unified Billing is used.
   - Turn **logging off**, so student content isn't stored.
2. **Buy credits** under AI Gateway, Unified Billing. Cloudflare passes through Anthropic's and Google's prices with no markup and adds a 5% fee on each credit purchase.
   - **Auto top-up** is optional. Without it, AI stops when the credits run out.
   - Cloudflare says a balance can in rare cases go slightly negative, and it then charges your card for the difference.
3. **Add a spend limit** in the gateway (AI Gateway, Spend limits), for example a monthly amount you're comfortable with. This is the backstop for your total bill; each student's own limits are below.
4. **Deploy:**
   ```
   cd cloudflare/ai-pro
   npm install
   npx wrangler login
   ```
   Then put your account id and gateway name into `CF_ACCOUNT_ID` and `AI_GATEWAY_ID` in `wrangler.jsonc`, and run:
   ```
   npx wrangler deploy
   npx wrangler secret put CF_AIG_TOKEN
   ```
5. **Point the app at the Worker.** In `src/js/01-ai.js`, set `const AI_PRO = "https://studyboard-pro-ai.<your-subdomain>.workers.dev";`, run `node scripts/csp.js`, and ship. Once that version is out, adding or removing the gateway token turns Studyboard AI on or off for every paid Pro student with no new release.

Two things to confirm in your gateway before launch:
- **Google's Gemini** (YouTube links) needs to be available through Unified Billing. If it isn't, those requests are refused, cost nothing, and the app suggests pasting the transcript. Set `YOUTUBE_OFF` to `"1"` to hide the option.
- **Anthropic's token count** (`count_tokens`) may not pass through the gateway. If it doesn't, files are estimated generously instead (6,000 tokens an image, 5,000 a PDF page), so jobs still run and are still charged first.

To turn everything off without removing anything, set `PRO_AI_OFF` to `"1"` and deploy.

## One set of rules, two places

The rules live in **`src/js/01-ai-policy.js`**, and nowhere else:
- the model
- the thinking level and output cap for each job
- prices
- each student's limits
- the job itself, from checking it to charging and settling

The Worker imports that file, and the app bundles the very same file. A student, or you, can also add their own Claude API key and choose **Studyboard AI Mode** (Settings, AI Features, Default Model). The app then runs the identical rules on the device with that key: the same model, thinking and limits. The only differences are that the key pays and the allowance is kept on that device. The browser test checks that the requests match.

| Jobs | Thinking |
|---|---|
| Grading answers, Teach It Back, Rubric Check, Ask About Course, syllabus import, flashcard, quiz and case sets, practice tests, Break It Down | High |
| Companion chat, Ask, summaries, explanations, exam plans | Medium |
| The automatic plan, session tuning, estimates, weekly review | Low |
| Exam location check, quick add, announcement dates, companion lines | None |

The app sends only the job's name, its text and files, and the answer shape it wants. Any model, thinking level, output cap, temperature or tool list it sends is ignored.

## Limits, per student

| | Default | Highest a setting can go |
|---|---|---|
| `MONTHLY_SOFT_USD`: past it, everyday jobs think less | $3 | the hard limit |
| `MONTHLY_HARD_USD`: AI stops until the 1st (UTC) | $4 | $10 |
| `DAILY_USD` | $1 | $3 |
| `PER_MINUTE` requests | 20 | 60 |
| `YOUTUBE_MONTHLY` videos (each at most 2 hours, about $0.10 an hour) | 20 | 100 (`0` turns YouTube links off) |
| `MAX_INFLIGHT` jobs at once | 4 | 8 |

There's no limit shared across students. Your total is bounded by the gateway's spend limit (step 3), and by your credits if auto top-up is off.

How the limits hold:
- **Charged before it runs.** Each job's worst case is reserved first: every input token cache-written, and the whole output cap used. Afterwards the charge is corrected to the usage report.
  - **Plain text** is counted by its UTF-8 bytes, which is never below its token count.
  - **Files** are counted by Anthropic, or estimated generously when the count isn't available.
  - **Anything that might have been billed without a report keeps its full reservation:** a timeout, a dropped connection, a Worker that stopped.
- **One change at a time.** The allowance lives in a Durable Object per student, and each change happens on its own, so 50 simultaneous jobs can't overspend.
- **Prompt size:** prompts are capped at 90K tokens, under Haiku's 5× long-prompt rate. Web lookups (one search, one page) stay under that too.
- **What students can send:** text, images and PDFs. URLs, file ids, tools and custom cache settings are dropped or refused.
- **Token counts** are free but count toward the per-minute limit, so they can't be used to flood Anthropic.
- **No retries inside the SDK,** so nothing is billed twice.
- **Delete My Account** closes the id for good, so deleting can't reset an allowance.
- **Logs are off,** and nothing students send is stored.

## Cost per student

From a simulation of the app's real prompts:

| Student | A month |
|---|---|
| Average | about $0.96 |
| Typical | about $0.65 |
| Heavy | about $2.30 |
| Uses every feature as much as the app allows | stopped at $4 |

A one-hour YouTube lecture costs about $0.10, and a one-hour recording transcribed by Whisper about $0.03. Add Cloudflare's 5% credit fee.

## Endpoints

All need the student's Supabase access token as `Authorization: Bearer …`.

| | |
|---|---|
| `GET /v1/status` | `{on, tier, usedPct, soft, resets, transcribe, youtube, youtubeLeft, youtubeMonthly}` |
| `POST /v1/ai` | `{task, system, content: [blocks], schema, search?, urlContext?}` → `{data, truncated, usedPct, soft, resets}` |
| `POST /v1/embed` | `{texts: [up to 100]}` → `{vectors}` |
| `POST /v1/transcribe` | raw audio (up to 20 MB), `Content-Type: audio/*` → `{text}` |
| `POST /v1/youtube` | `{url}` → `{title, transcript, onScreen}` |
| `DELETE /v1/me` | Delete My Account |
| `GET /v1/owner/usage?days=30` | Your usage summary (needs `OWNER_TOKEN`, not a student's sign-in); `?user=<id>` for one student |

Errors: `402` `used_up` or `today`; `429` `rate`; `413` `too_long`; `403` `not_pro` or `unconfirmed`; `422` `refused` or `video`; `503` `busy` or `off`.

## Tests

- `node tests/ai-pro.test.js`: every limit, and the ways around them we could think of.
- `node tests/ai-pro.e2e.js`: the app against the Worker's logic, and Studyboard AI Mode on a Claude key.
