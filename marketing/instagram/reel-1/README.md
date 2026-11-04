# Studyboard promo reel

`studyboard-reel.mp4` is a 20-second Instagram Reel: 1080 × 1920 (9:16), 30 fps, H.264, about 3 MB. `cover.png` is the matching cover image (the end card).

Brand as in the first-post concepts: navy, blue and highlighter yellow, grid paper, Lexend and Atkinson Hyperlegible, the real logo and app icon, the app's own course icon and companions.

## Storyboard

| Time | Scene | What happens |
|---|---|---|
| 0–3.6 s | Hook | Deadline chips scatter across navy: "Five classes. Forty deadlines. One plan?" The chips pull together and a paper circle opens from the centre. |
| 3.4–7.6 s | Quick Add | "bio quiz fri 2pm 5%" is typed, Add is pressed, and a BIO 101 quiz card drops in. Packy bounces. |
| 7.4–11.4 s | Today's Plan | The plan card fills row by row in the 4–7 PM free time, and "Bio lab report" becomes Next. |
| 11.2–15.0 s | Companion | A flashcard slides in, Hoot lands on top of it and asks "Quiz you on chapter 4?", the card flips to its answer (Hoot hops), and Good is tapped. |
| 14.8–20 s | End card | Wipes up to navy: "Your whole semester on one board.", "Free · works in any browser · no account needed", studyboardapp.com, and three companions hop twice each, then stay still. |

Text sits between roughly 330 px and 1600 px from the top, clear of Instagram's top bar and the caption and buttons at the bottom. The headline area also survives the 3:4 crop on the profile grid.

## Posting

- **Sound:** the video is silent on purpose. Add a track from Instagram's own music library when posting (an upbeat lo-fi or light pop track works well with these cuts). Music from the library is licensed for Reels, and a separately bought track may not be.
- **Cover:** pick `cover.png` (the end card) as the cover.
- **Caption:**

> Five classes. Forty deadlines. One board. 📚
>
> Studyboard is a calm student planner: type a deadline like you'd say it, let Today's Plan pick what's next, and study with a companion that quizzes you.
>
> Free, works in any browser, no account needed. Link in bio.
>
> #studyboard #studentplanner #studygram #studytok #college #university #studentlife #studytips

## Editing and re-rendering

Everything is in `src/reel.html`. Each scene's timing is in the `render(t)` function (seconds), and `END` sets the length. Companion art comes from `../first-post/assets/`. Needs Node, Playwright and ffmpeg. From the repo root:

```bash
node marketing/instagram/reel-1/render.js
```

To check single frames without encoding the whole video (they go to `stills/`):

```bash
node marketing/instagram/reel-1/render.js --stills 2,5,9
```

A full render takes about 2 minutes.
