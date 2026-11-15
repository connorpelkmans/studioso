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
5. `references/tools.md`: how to use **vidIQ** (live outlier research before a batch, Instagram insights after) and **Metricool** (best times, scheduling after the user approves). Run the outlier research at the start of each new batch.
6. `README.md` at the repo root if the reel is about a specific feature: it's the source of truth for what the app does and whether it's free or Pro. Never promise anything the README doesn't say. A promo that overclaims gets called out in the comments and costs trust.

## The workflow

### 1. Brief (one feature, one feeling)

Pin down, briefly, in your own reasoning or with the user if it's unclear:
- **The feature** (one per reel; a feature tour gets skipped).
- **The student moment** it fixes, in their words: "it's 11pm and I just remembered the lab report".
- **The format**: motion graphic (rendered entirely here), filmed (the user films; you write the script and render overlays), or hybrid (filmed hook, then app scenes). If the user hasn't said, default to motion graphic and mention that a filmed 2–3 s face hook usually holds better.
- **Platform**: Reels, TikTok and Shorts share 9:16, so one file usually serves all three. Note differences in the caption only.

Don't stall on questions. If the request is "make a reel about Quick Add", decide the rest and state your choices.

### 1a. Pick the feature

`marketing/reels/CONTENT-PLAN.md` ranks Studyboard's features by impact (timely, pain, sendable, visual, free, evidence). Take the highest-ranked one not yet made unless the user asks for something specific, and re-rank when the season changes (finals, new term).

### 1b. Pick the reel type

Live research (Nov 2026) shows two kinds of reel work for this audience, and a healthy feed mixes them about 2:1:
- **Relatable** (reach): modelled on the top outlier. A real person at frame 0 (stock b-roll), one persistent native caption (white bold Inter, black outline), the Studyboard calendar as the "proof" shot cut on a music hit, a punchline shot, and a loop. Then, unlike a creator's meme, **always a short payoff**: a turn line ("plot twist: you can see it coming"), about 2 s of Studyboard fixing the exact problem from the hook, and a 1.4 s end card (name, "free · no account needed", URL). A business reel that never shows the product gets views but no users. Keep the opening native: the brand appears only after the hook has earned attention. The template paces it at 18.0 s: 4 s hook, 4 s problem, 3 s punchline, 5 s fix, 2 s end card. These get sent and are how a new account reaches people who don't follow it. Example: `marketing/reels/2026-11-16-same-week/`.
- **The fix** (conversion): hook → payoff demo → URL. Example: `marketing/reels/2026-11-15-crunch-week/`.
- **Entertainment-first** (shares, follows; about 1 in 3 posts): no product demo at all. A format students already share (a "field guide" of friend types, expectation vs. reality, a time-lapse with lock-screen timestamps), written like a student would write it, with a 1–2 s soft sign-off (app icon + "Studyboard", or one wry line such as "We can't stop autoplay. We can plan around it."). The companions make a great recurring cast; give each one **a face that matches its situation** (see `decorate()` in `marketing/reels/2026-11-20-types-of-students/reel.html`: proud, shocked, tired and nervous faces drawn over the real art, with brows, sweat drops, lids and idle motion), and keep that face consistent wherever the character appears. Examples: `marketing/reels/2026-11-20-types-of-students/`, `2026-11-21-plan-vs-reality/`, `2026-11-22-one-episode/`.

To look professional and not AI-made: real typography and the app's own art, one consistent actor or anonymous close-ups (hands, clocks) for the "me" in a live-action story, a colour grade that matches across shots, no on-screen text in a language the audience doesn't read, and nothing on a screen that contradicts the story (crop it out). Break lines by hand where the phrase breaks.

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

For a **problem-fix reel** (the default), write only a `scenes.html` with the four blocks (scene CSS, problem HTML, fix HTML, scene JS) and run `scripts/make_reel.py scenes.html reel.html`: it fills `assets/problem-fix-template.html`, which already handles the timeline, captions, cuts, flashes, the feature label and the end card. Examples: `marketing/reels/2026-11-17-what-you-need/`, `2026-11-18-exam-prep/`, `2026-11-19-breakdown/`. Otherwise, make a folder `marketing/reels/<YYYY-MM-DD>-<slug>/` and copy `assets/template.html` into it as `reel.html`. The template has the brand styles, animation helpers (`rise`, `pop`, `scene`, `typeText`, `highlight`, `hop`), reusable pieces (deadline chips, task cards, plan rows, flashcard, speech bubble, URL pill), a burned-in caption track, and a three-scene skeleton (hook → payoff → loop-back end). Edit it; don't start from a blank page. `marketing/instagram/reel-1/src/reel.html` is a full worked example.

Things the renderer does for you in `reel.html`:
- `{{ROOT}}` becomes the repo root (fonts, `icon-512.png`, app screenshots).
- `{{owl}}`, `{{mochi}}`, `{{inky}}`, `{{packy}}` become the companion SVGs.
- `window.render(t)` is called for every frame with `t` in seconds; `window.END` is the length.
- With `--footage`, `window.FOOTAGE` is true and the page background is transparent, so only your overlays show on top of the video.

Energy rules (from Connor's review: "more enthusiastic and expressive, but not over the top"):
- **One yellow highlight per caption, on the phrase that does the work**: in a hook, the gut punch or the joke ("and *it's already Week 10*", "so far *I've written my name*"), not the set-up; in the turn, the twist ("*it does the math for you*"); in the fix line, the benefit ("*weeks early*", "*exactly what you need*"). If you remove everything but the yellow, it should still tell the story.
- **Exclamation marks on the turn, the payoff and the wins** ("Plot twist: …!", the Studyboard line, "Way better!", the end-card headline). Hooks state the problem plainly, and the app's own UI text (buttons, badges) keeps the app's wording.
- Entrances overshoot slightly (the template's `rise` and `pop`); the payoff gets a **small confetti burst behind the card** (`BURST`) and a **ding** (`ding.wav`).
- The companions hop on the end card. One celebration per reel: more than that is over the top.

Pacing rules (from Connor's review: "everything cuts harshly and sometimes there's no time to read"):
- **Nothing on screen leaves before it can be read**: captions get at least 0.45 s + 0.3 s per word; a UI card that shows the payoff gets 3 s or more *after* it finishes building.
- **No hard cuts or white flashes between scenes.** Use 0.3–0.4 s cross-dissolves with a slight settle-in zoom (built into the problem-fix template), and fade captions between lines.
- Energy comes from the music hits and motion *inside* a scene, not from chopping between scenes.
- **Captions follow the picture**: a line arrives when the thing it talks about is on screen (the turn line as the person reacts, the Studyboard line after the fix card has landed), never ahead of it.
- **Give reactions room**: a punchline shot of a person runs about 3 s, so the reaction lands and then sinks in.
- **Show the mechanism, not just the result**: when a feature moves work (Crunch Forecast, Autopilot, the breakdown), the load visibly leaves one place and lands in another, adding up to the same total, in sequence (giver first, then each receiver with a brief ring and a pop). A week that just changes colour on its own looks like a filter.
- **Beat accents are a single smooth nudge**, never a fast shake: anything oscillating faster than about 5 Hz flickers at 30 fps.

Two lessons from earlier builds:
- **Time text beats by word count**, not by feel: about 0.45 s + 0.2 s per word, at least 1.2 s. Derive later timings from the hook's length so hook variants stay in sync (see `marketing/reels/2026-11-15-crunch-week/reel.html`).
- **Never leave 2 s with nothing new on screen**, especially right after the payoff: cut to the end card instead.

Keep text inside **y 250–1480** (the top bar and the bottom caption cover the rest) and **centre everything on x = 540**. The platform buttons only cover the lower right (about x > 940, y 1050–1500), so captions there use a width of about 820 centred. The `--guides` flag shades those zones and draws the centre line.

### 4b. Footage, music and sound (every reel ships with audio)

Silent reels lose: every outlier in the research had music-driven pacing, and many viewers watch with sound on. The kit:
- **Real people** (relatable reels, and optionally the hook of a fix reel): `vidiq_find_broll` (1 credit; Pexels, portrait) for stressed or tired student clips. Download each clip into `marketing/reels/_broll/` and record it in `CREDITS.md`. Check frame strips to find the moment of action, then cut with `scripts/build_bg.py shots.json bg.mp4` (footage segments plus `{"color": …}` placeholders where `reel.html` draws its own opaque scene) and render with `--footage bg.mp4`.
- **Music**: owned tracks in `marketing/reels/_audio/` (see its README for where the hits land). Generate new ones with `vidiq_generate_music` (25 credits) only when a new mood is needed. Measure where the hits fall before editing, then **cut on the hits**.
- **Sound effects**: `scripts/make_sfx.sh` (thud, whoosh, pop, tick). Thud on things landing, whoosh on cuts, pop on UI taps.
- **Mix**: `scripts/mix_audio.py --video silent.mp4 --music … --sfx thud.wav@3.1 … --out reel.mp4`. Use `--bed FILE@AT:OFFSET:DUR:VOL` twice to switch tracks at the payoff (tense hook music into a calm beat). It normalises to about -14 LUFS.
- If the user adds a trending sound in the Instagram app instead, keep our SFX by setting the original-audio volume to about 30–50% rather than muting it.

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

Then run `scripts/check_glitches.py` on every final MP4. The list must be empty: a glitch reads as cheap even when it's only one frame.

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
