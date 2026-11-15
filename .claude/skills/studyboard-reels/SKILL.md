---
name: studyboard-reels
description: Plans, scripts and renders short-form vertical promo videos (Instagram Reels, TikTok, YouTube Shorts) for Studyboard, the student planner in this repo, built so students don't scroll past. Writes hooks, storyboards, on-screen captions and post captions in Studyboard's brand, then renders a 1080x1920 MP4 from HTML with Playwright and ffmpeg, or lays branded captions and app shots over footage the user filmed. Use this whenever the user wants a reel, TikTok, Short, promo video, video ad, hook ideas, a script for filming themselves, a caption or overlay for a video, a new version of an existing reel, or wants to learn from how earlier reels performed or why a post got low views, likes, comments, shares or followers, even if they just say "make a video about Exam Prep" or "something for socials".
---

# Studyboard reels

Short-form videos that make a student stop scrolling, watch to the end, and want Studyboard. The craft is about the first second and the feeling. The rendering part is solved: `scripts/render.js` turns an HTML timeline into an MP4.

## Before anything: read what already exists

1. `marketing/reels/LOG.md`, if it exists. It records every reel made with this skill and, when the user has shared them, the numbers (views, 3-second hold, average watch time, shares). Lean toward what held attention and away from what didn't, and say so when you do ("The POV hooks held better last time, so two of these are POV").
2. `references/brand.md` for colours, fonts, companions, voice, and the rules on what Studyboard may claim.
3. `references/retention.md` for hook formulas, pacing, and the formats that work for a student audience.
4. `references/diagnose.md`: five lenses (views, likes, comments, shares, follows), used as a pre-flight check on every storyboard and to diagnose a reel whose numbers came back weak.
5. `README.md` at the repo root if the reel is about a specific feature: it's the source of truth for what the app does and whether it's free or Pro. Never promise anything the README doesn't say. A promo that overclaims gets called out in the comments and costs trust.

## The workflow

### 1. Brief (one feature, one feeling)

Pin down, briefly, in your own reasoning or with the user if it's unclear:
- **The feature** (one per reel; a feature tour gets skipped).
- **The student moment** it fixes, in their words: "it's 11pm and I just remembered the lab report".
- **The format**: motion graphic (rendered entirely here), filmed (the user films; you write the script and render overlays), or hybrid (filmed hook, then app scenes). If the user hasn't said, default to motion graphic and mention that a filmed 2–3 s face hook usually holds better.
- **Platform**: Reels, TikTok and Shorts share 9:16, so one file usually serves all three. Note differences in the caption only.

Don't stall on questions. If the request is "make a reel about Quick Add", decide the rest and state your choices.

### 2. Hooks first

Write 6–10 hooks before anything else, using several formulas from `references/retention.md`. Pick the strongest (or let the user pick if they're engaged in the conversation) and keep two runners-up for A/B variants. The hook decides whether anyone sees the rest, so it gets the most effort:
- **Three layers in frame 0 saying one thing**: the problem made visible (visual), 3–5 big words (text), and "just enough" motion.
- **Lean-in → "but" → snapback**: name the student pain, interject, flip it. Each line should make them need the next.
- **Pain or benefit, never the feature name.** "3 exams. 1 week." beats "Meet Crunch Forecast".
- **Sendable**: Instagram ranks on watch time, likes and sends. Ask "would a student forward this to their group chat?" If not, make it more relatable or more useful.

Render the best two or three hooks as variants of the same body so the user can A/B them: only the hook should differ, or the test teaches nothing.

### 3. Storyboard

A table with time, what's on screen, the on-screen text, and the caption line. Rules, each with its reason:
- **Frame 0 already shows the hook.** No fade from black and no logo intro. Autoplay judges the first frame, and it's also the default thumbnail.
- **7–15 seconds.** Completion and rewatches matter more than length; a 12 s reel watched twice beats a 30 s reel abandoned at 6 s.
- **Something changes every 1.5–2 s**: a new line, a card dropping in, a cut. Stillness is when thumbs move.
- **Problem, then payoff, then proof.** Show the student's mess before the app. The demo is the relief, not the opener.
- **≤ 7 words on screen per beat**, big. People read about 3–4 words a second while also watching.
- **End so it loops.** The last frame leads back into the first (the same chips, the same question answered), so a replay feels seamless. Keep the CTA short: the URL on screen for about 1.5 s is enough.
- **Captions burned in** for anything spoken. Most viewers watch muted.

### 3b. Pre-flight: the five lenses

Before building, run the checklist at the end of `references/diagnose.md` on the storyboard and caption: **views** (does frame 0 stop the scroll?), **likes** (is the pain specific to this moment of the term, and is the payoff satisfying?), **comments** (is there one easy, personal question or a mild debatable take?), **shares** (who sends this to whom, and which line makes them?), **follows** (is it part of a series the profile promises more of?). Fix every "no" in the storyboard now, since it's cheaper than after rendering. Put the filled-in table in `brief.md`.

### 4. Build

Make a folder `marketing/reels/<YYYY-MM-DD>-<slug>/` and copy `assets/template.html` into it as `reel.html`. The template has the brand styles, animation helpers (`rise`, `pop`, `scene`, `typeText`, `highlight`, `hop`), reusable pieces (deadline chips, task cards, plan rows, flashcard, speech bubble, URL pill), a burned-in caption track, and a three-scene skeleton (hook → payoff → loop-back end). Edit it; don't start from a blank page. `marketing/instagram/reel-1/src/reel.html` is a full worked example.

Things the renderer does for you in `reel.html`:
- `{{ROOT}}` becomes the repo root (fonts, `icon-512.png`, app screenshots).
- `{{owl}}`, `{{mochi}}`, `{{inky}}`, `{{packy}}` become the companion SVGs.
- `window.render(t)` is called for every frame with `t` in seconds; `window.END` is the length.
- With `--footage`, `window.FOOTAGE` is true and the page background is transparent, so only your overlays show on top of the video.

Two lessons from earlier builds:
- **Time text beats by word count**, not by feel: about 0.45 s + 0.2 s per word, at least 1.2 s. Derive later timings from the hook's length so hook variants stay in sync (see `marketing/reels/2026-11-15-crunch-week/reel.html`).
- **Never leave 2 s with nothing new on screen**, especially right after the payoff: cut to the end card instead.

Keep text inside the safe area: **x 60–920, y 250–1480**. Instagram's and TikTok's buttons sit on the right, and their captions cover the bottom ~420 px. The `--guides` flag shades the unsafe zones on stills so you can check.

### 5. Check stills before rendering

```bash
node .claude/skills/studyboard-reels/scripts/render.js marketing/reels/<folder> --stills 0,1.5,4,8 --guides
```

Look at the PNGs in `<folder>/stills/` (use the Read tool, it shows images). Check frame 0 has the hook, nothing important falls in a shaded zone, text isn't cut off or overlapping, and fonts loaded (Lexend is geometric and rounded; a serif or Times-looking face means a broken font path). Fix and repeat. This takes seconds; a full render takes a minute or two.

### 6. Render

```bash
node .claude/skills/studyboard-reels/scripts/render.js marketing/reels/<folder>
# Over the user's footage (scaled and cropped to 9:16, its own audio kept):
node .claude/skills/studyboard-reels/scripts/render.js marketing/reels/<folder> --footage path/to/clip.mp4
# With a voiceover or licensed track:
node .claude/skills/studyboard-reels/scripts/render.js marketing/reels/<folder> --audio path/to/voice.m4a
```

Output: `reel.mp4` (1080×1920, 30 fps, H.264) and `cover.png` (the frame at `window.COVER` seconds, the hook frame by default). Look at 2–3 frames of the finished video with ffmpeg if anything was changed since the stills.

### 7. Package for posting

Write `brief.md` in the reel's folder:
- **Hook** chosen, plus the runners-up as ready-to-render variants (often only the hook text changes; render them as `reel-b.mp4` and so on if the user wants to A/B).
- **Storyboard** table.
- **Caption** per `references/retention.md` (first line is a second hook; one question to prompt comments; 3–6 hashtags).
- **Sound**: the reel is silent unless audio was given. Suggest a mood (e.g. upbeat lo-fi) to pick from the app's own music library at posting time, since library tracks are licensed for Reels and TikTok and outside tracks may be muted.
- **Alt text** and the **cover** choice.
- For filmed formats, the **script and shot list** (see below).

Then add a row to `marketing/reels/LOG.md` (create it from `references/log-template.md` if missing) with the date, folder, feature, hook, format and length, leaving the metric columns blank.

## When numbers come back

When the user shares a reel's metrics (or screenshots of Insights or analytics), fill in its row in `LOG.md`. Compare against their own earlier reels, then find the **weakest** metric and run that lens from `references/diagnose.md` in depth: low views → 5 new hooks; low likes → 3–5 relevance fixes; no comments → 5 conversation tweaks; low shares → 3–5 "that's me" angles; few follows → profile review (ask for profile screenshots). Turn the result into the next reel's brief, add one line to "What we've learned" in `LOG.md`, and offer to re-render the reel with the fix (often a new hook variant is enough).

Give the user the path to `reel.mp4`, show them the cover or a still, and say in one or two lines what the hook is and why you chose it.

## Filmed and hybrid reels

The user films; you make everything else. Write:
- **A script** with the spoken lines, each ≤ 2 s, and the first line being the hook.
- **A shot list**: framing (face close, phone in hand, desk overhead), what they do, and how long. Keep it doable alone with a phone in under 10 minutes; no actors or locations.
- **Overlays** in `reel.html`: the burned-in captions synced to the script, plus app scenes (cards, plan, companion) that slide in over or between shots. Render with `--footage` once they send the clip. Until then, render stills with a plain background so they can see the look.

When they send footage, find the actual speech timing (ask, or estimate from the script at ~3 words per second and check stills at the cut points), and adjust the `CAPTIONS` times to match.

## What good looks like

A student who's never heard of Studyboard sees frame 0 and thinks "that's me". By second 3 they've seen the mess get fixed. By second 10 the video loops and they let it. The brand is unmistakable (navy, yellow highlighter, grid paper, the companions) but the reel is about their week, not about the app.
