# Studyboard's first Instagram post: concepts

Three options for the account's first post. All are 1080 × 1350 (Instagram's 4:5 portrait feed size) and use the brand as it appears on the website and in the app:

- **Colors:** navy `#0E2A56`, blue `#1F6FEB` / `#3988FE`, highlighter yellow `#FFE45C`, the light grid-paper background `#F2F5FA`, and the course colors (plum, tomato, leaf, blue) from the task board.
- **Type:** Lexend ExtraBold for headlines, Atkinson Hyperlegible Next for body text, Lexend digits.
- **Art:** the real logo and app icon, and the free companions (Hoot, Mochi, Inky, Packy) exported straight from the app's own drawings.
- **Voice:** calm and plain. Copy reuses lines from the website ("Your whole semester on one board.", "Type it like you'd say it.") and states only what the README says the app does.

The files to upload are in `jpg/`. `png/` holds lossless copies for editing. See **Uploading at highest quality** below.

**Recommendation:** post **Concept B (carousel)** first. A first post should say who you are, and a carousel tells the whole story in four swipes. Carousels also tend to get more reach than single images. Keep A and C as posts 2 and 3 so the grid opens with a consistent set.

---

## Concept A: "One board" (single image)

`jpg/a-one-board.jpg`

A light, grid-paper intro: the website's headline, highlighted in yellow, above a slightly tilted mini task board with Mochi sitting on it. Each card uses its course icon from the app.

**Caption**

> Hello, Instagram 👋
>
> We're Studyboard, a calm planner for students. Every class, deadline, note and file lives on one board, and Today's Plan tells you what to work on next.
>
> It's free, works in any browser, and you don't need an account. Link in bio.
>
> #studyboard #studentplanner #studytok #studygram #college #university #studentlife

**Alt text:** Studyboard logo above the headline "Your whole semester on one board." Below, four colorful course task cards (an essay outline, a problem set, a finished quiz and an upcoming exam) with a small cartoon sprout named Mochi perched on top.

---

## Concept B: "Hi, we're Studyboard" (4-slide carousel) ⭐ recommended

`jpg/b1-hello.jpg` → `jpg/b2-today.jpg` → `jpg/b3-companion.jpg` → `jpg/b4-free.jpg`

1. **Hello:** navy cover with the app icon, "Hi. We're Studyboard." and Mochi.
2. **Today's Plan:** "Always knows what's next." with a sample plan fitted into 4–7 PM.
3. **Study Companion:** Hoot asks "Quiz you on chapter 4?"; says AI is optional.
4. **Free:** "Free. No account needed." with four proof points and the link.

**Caption**

> Hi, we're Studyboard 👋
>
> We built a planner for students with lots of classes, shifting due dates and too many PDFs.
>
> → Today's Plan picks what to do next and fits it into your free time
> → A study companion cheers you on (and quizzes you, if you want)
> → Pulls in deadlines from Canvas, Brightspace or Blackboard
>
> Free, works in any browser, and your data stays on your device. Link in bio.
>
> Which class is taking up your whole week? Tell us below 👇
>
> #studyboard #studentplanner #studygram #studytips #college #university #studentlife

**Alt text, per slide**

1. Navy cover with the Studyboard app icon and the words "Hi. We're Studyboard." A small cartoon sprout named Mochi sits in the corner.
2. "Always knows what's next." A Today card shows free time 4–7 PM and four tasks, with "Bio lab report, 45 minutes" marked Next.
3. "A study buddy that cheers you on." A cartoon owl named Hoot asks "Quiz you on chapter 4? Five quick questions." with Let's go and Later buttons.
4. "Free. No account needed." Checklist: works in any browser, data stays on your device, pulls in deadlines from your school site, no ads and no analytics. Button: Link in bio, studyboardapp.com.

---

## Concept C: "Type it like you'd say it" (single image)

`jpg/c-quick-add.jpg`

A navy feature demo: a casual note, "bio quiz fri 2pm 5%", turns into a neat BIO 101 quiz card. Packy the backpack watches.

**Caption**

> Type it like you'd say it ✍️
>
> "bio quiz fri 2pm 5%" → BIO 101 Quiz, Friday 2:00 PM, worth 5%. Done.
>
> That's Quick Add in Studyboard, the calm student planner. Free in any browser. Link in bio.
>
> #studyboard #studentplanner #productivity #studygram #college #studenthacks

**Alt text:** Navy graphic with the headline "Type it like you'd say it." A text box reads "bio quiz fri 2pm 5%" and an arrow points to a green BIO 101 card: Quiz, Friday 2:00 PM, worth 5%, added to Friday. A cartoon backpack sits beside it.

---

## Uploading at highest quality

Instagram always recompresses uploads. The files in `jpg/` are prepared so that recompression costs as little as possible:

- **Size:** exactly 1080 × 1350 (4:5), so Instagram doesn't crop or resample them.
- **Sharpness:** each post is drawn at 2× and scaled down with Lanczos, so text and the tilted cards' edges are smooth.
- **Format:** JPEG at the highest quality with full color resolution (4:4:4, no chroma subsampling), so colored text such as "At risk" and the course headers doesn't blur.
- **Color:** sRGB with an embedded sRGB profile, so colors don't shift.

When posting:

1. In Instagram, open **Settings and activity → Media quality**. Turn **on** "Upload at highest quality" and turn **off** "Use less data".
2. Upload the `.jpg` files directly. Get them to your phone with AirDrop, Google Drive, iCloud Drive or a USB cable, not WhatsApp, Messages or a screenshot, because those recompress the image.
3. Upload on Wi-Fi.
4. In the crop step, keep the full 4:5 frame (don't zoom or pinch).

## Editing and re-rendering

All posts are in one file, `src/posts.html`. Companion art is in `assets/*.svg` and is inserted where the file says `{{owl}}`, `{{mochi}}`, `{{inky}}` or `{{packy}}`. To rebuild the images (needs Node, Playwright and ffmpeg), run this from the repo root:

```bash
node marketing/instagram/first-post/render.js
```

Before posting, check that the link in your Instagram bio points to studyboardapp.com, since three of the posts say "Link in bio".
