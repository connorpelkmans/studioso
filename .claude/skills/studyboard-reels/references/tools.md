# vidIQ and Metricool

Two connected services make the loop data-driven: **vidIQ** for research and Instagram insights, **Metricool** for best posting times and scheduling. Load their tools with ToolSearch ("vidiq", "metricool") if they're deferred.

## Before making a batch: research what's working now (vidIQ)

1. **`vidiq_instagram_tiktok_outlier_search`** (5 credits): posts that beat their creator's median by a lot, from the last 30 days.
   - Run it twice: once with `embeddingType: "concept"` for the student pain this batch is about (e.g. "too many exams in one week, finals"), once with `embeddingType: "format"` for app/tool promos that don't look like ads.
   - Audience string: `Culture/Region: North America (US/Canada); Global: false; Demographics: college and university students 18-24, multiple courses, <season>;`
   - Use `durationMax: 45`. Read the hook (visual/text/audio), the format template, and whether it loops. Call something a pattern only if at least 2 outliers share it.
2. **`vidiq_watch_shortform_content`** (10 credits) on the 1–2 outliers closest to the reel you're making, for exact beat timing. Optional, since the search summary is usually enough.
3. **Never copy an outlier's text.** Take the *pattern* (format, structure, emotion) and write Studyboard's own line.

Credits are limited (the plan had 150 a month in Nov 2026): check `vidiq_balance`, and spend about 10–20 per batch. Note what you learned in `references/retention.md` under "Live outlier patterns", with the date, so later batches don't pay for the same research.

## After posting: read the numbers

- **Instagram** (vidIQ, free): `vidiq_social_account_list` → `vidiq_instagram_owner_insights` with `mode: "reels"` gives views, watch time, watched %, skip rate, shares and saves per reel. Put them in `marketing/reels/LOG.md` and run the weakest lens from `references/diagnose.md`.
- **Metricool**: `getAnalyticsAvailableMetrics` (network instagram/tiktok, connector reels/posts), then `getAnalyticsDataByMetrics`. Use this for TikTok and cross-network comparisons.

## When to post (Metricool)

1. `getBrandSettings` → blogId and the brand's timezone. If it errors with "no social network connected", send the user the connection link it gives, and use the default slots below until it's connected.
2. `getBestTimeToPostByNetwork` for `instagram` (and `tiktok`) over the coming 7 days. Pick the highest-value slots and spread posts at least a day apart. If several slots are close, prefer evenings: students scroll after classes and on study breaks.
3. With a tiny audience (under ~500 followers) the best-time data is thin. Treat it as a hint, and recheck it monthly as the account grows.

**Default slots until Metricool has data** (local time of the target students): Sun–Thu, 6:30–9:30 PM, the post-class and study-break window. **Sunday evening** is when students plan their week, so it's the best slot for planning-themed "fix" reels. Avoid Friday and Saturday nights. Use odd minutes (7:40, not 8:00).

## Scheduling (Metricool, after the user approves)

- Scheduling publishes on the user's behalf, so **always show the plan (reel, caption, date and time, network, regular or Trial) and get an explicit yes** before calling `createScheduledPost`. Never schedule unasked.
- Media needs a public URL. Host the MP4 with `vidiq_video_upload` (`localFile`, free) and pass the returned `videoUrl`. Upload just before scheduling, because signed URLs expire.
- Instagram: `instagramData.type` = `REEL`, or `TRIAL_REEL` for a hook test (shown to non-followers first). **Trial Reels need a follower minimum**; below it Instagram rejects them at publish time ("does not meet the trial reel follower requirement"), so small accounts should test hooks as regular Reels on separate days. `audioConfiguration.audioId` can attach a song from Instagram's library by name on Business accounts linked to a Facebook Page. Ask the user which track (or suggest one that matches the reel's mood) rather than guessing.
- **Post to TikTok in the same call** once TikTok is connected to the Metricool brand (check `getBrandSettings` → `networksData` lists `tiktokData`): add `{"network":"tiktok"}` to `providers` and `tiktokData: {"title":"<the hook line>","privacyOption":"PUBLIC_TO_EVERYONE","commercialContentOwnBrand":true,"isAigc":false,"autoAddMusic":false}` (Metricool rejects TikTok posts without a `title`).
- **YouTube Shorts** (connected Nov 20, 2026): `{"network":"youtube"}` with `youtubeData: {"title":"<hook line, ≤100 chars>","type":"short","privacy":"public","madeForKids":false,"category":"EDUCATION","isAiGeneratedContent":false,"tags":[...]}`; `firstCommentText` works there too.
- **Each network has its own peak** (Metricool, Nov 2026): Instagram weekdays 10 AM, TikTok about 6 PM, YouTube about 4 PM (all PT). When the networks' peaks differ, schedule a separate post for each rather than one shared time. Set `commercialContentOwnBrand` because the reels promote our own app (TikTok's disclosure rule), and `isAigc` false because they're hand-built animation and real app recordings, not AI-generated video. TikTok has no first comment, so put the comment prompt at the end of the caption. To add TikTok to an already scheduled post, use `updateScheduledPost` with the full original content plus the new provider.
- Use `videoCoverMilliseconds` to set the cover at the hook frame.
- Put the comment-prompt in `firstCommentText` when it adds something beyond the caption.
- `getScheduledPosts` to confirm, and give the user the `plannerUrl`s.
