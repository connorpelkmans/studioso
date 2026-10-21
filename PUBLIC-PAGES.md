# Public Flashcards and Quizzes (studyboardapp.com/flashcards and /quizzes)

Students can **publish** a shared deck or quiz. It then gets its own public page that anyone can open and search engines can list, like a Quizlet set page. The pages are built on the server (the website's Cloudflare Worker), so Google sees every card and question in the page itself.

## What's live once it's deployed

| Address | What it is | Indexed by Google? |
|---|---|---|
| `/flashcards` and `/quizzes` | Search box, popular courses, newest sets, pages 2, 3... | Yes |
| `/flashcards/course/biol-201` | Every published set for one course code ("BIOL 201 Flashcards and Study Sets") | Yes, and these are the pages most likely to rank first |
| `/flashcards/cell-biology-basics-abcd1234` | One set: all terms and definitions, a Study Flashcards mode, Add to Studyboard | Yes |
| `/quizzes/cell-quiz-abcd1234` | One quiz: every question, the answers behind Show answer, Take the Quiz in Studyboard | Yes |
| `/flashcards?q=...` | Search results | No (search engines prefer that internal search pages stay out) |
| `/sitemap-public.xml` | Every published page, rebuilt on request (cached for an hour) | Listed in `robots.txt` |

Every page has:
- a unique title, such as "Cell Biology Basics (BIOL 201) Flashcards | Studyboard"
- a description made from the first terms
- a canonical address; renamed sets redirect to their new address
- breadcrumbs, and links to related sets from the same course
- Google's structured data for flashcards (schema.org `Quiz` with `Flashcard` questions) and for practice questions (`Multiple choice`, `Checkbox`, `Short answer`), which is the format Quizlet uses

Pages are cached at Cloudflare's edge for an hour, so most visits never reach Supabase.

In the app:
- A deck's or quiz's Share sheet has **Publish to Studyboard Flashcards** (or **Quizzes**). It asks first, then shows the public address.
- Flashcards and Quizzes have an **Explore** button that opens the public pages.
- Limits: at least 4 cards or 3 questions, and up to 100 published per account. People suspended from groups can't publish.
- A page shows the *shared copy*, so **Update Shared Copy** also updates the public page within the hour.

## What you need to do

1. **Supabase:** run `supabase-sharing.sql` again (SQL Editor > New query > paste > Run), then `supabase-lean.sql`. It adds publishing, the search index and the public read functions. It is safe to run again.
2. **Deploy the website as usual.** The new routes are in `wrangler.jsonc` (`run_worker_first`), and the public key the pages read with is in `vars`. Nothing secret is added.
3. **Check it:** open `https://studyboardapp.com/flashcards`. Publish one of your own decks with 4+ cards, then open its page and `https://studyboardapp.com/sitemap-public.xml`.
4. **Google Search Console** (https://search.google.com/search-console):
   - Add the property `studyboardapp.com` as a **Domain** property, and verify it with the DNS TXT record Google gives you. Add the record in Cloudflare DNS.
   - Under **Sitemaps**, submit `https://studyboardapp.com/sitemap-public.xml` and `https://studyboardapp.com/sitemap.xml`.
   - Use **URL Inspection** on `/flashcards`, one course page and one set page, then **Request indexing**.
   - Check **Enhancements** after a week or two. Google lists the flashcard and practice-question markup there if it accepts it.
5. **Bing Webmaster Tools** (https://www.bing.com/webmasters): **Import from Google Search Console**. This also covers DuckDuckGo and Yahoo, which use Bing.
6. **Test the markup:** paste a set page's address into https://search.google.com/test/rich-results.

## How to get to "alongside Quizlet"

Search engines rank pages that many people find useful, and Quizlet has millions of sets and years of links. A new site wins on **specific course pages first** ("BIOL 1001 uOttawa flashcards", "CHEM 210 midterm review"), then broader topics. In order of impact:

1. **Content.** Get real sets published for real course codes, starting with your own courses and your school's busiest first-year courses. Twenty good sets for one course beat one set for twenty courses: the course page becomes the best answer for that course code. Ask friends, group members and TAs to publish their decks.
2. **Links.** Share course pages (not the home page) where students already are: course Discords, subreddits (`r/<school>`), student society sites and club newsletters. Each link from a real site helps every page under it.
3. **Make publishing the default habit.** After someone shares a deck, suggest Publish. Students who find a set on Google land in Studyboard, make their own, and publish too.
4. **Freshness and quality.** Updated sets keep their `lastmod` current in the sitemap. Thin sets (fewer than 4 cards) are never published. Reported sets hide themselves after 3 reports (`share_reports`; see the header of `supabase-sharing.sql` for how to review them).
5. **Patience.** New domains usually take 1–3 months to rank for anything competitive. Watch Search Console's **Performance** report for which queries already show your pages, and publish more for those courses.

## Things to decide or watch

- **Copyright and cheating:** students may paste sets copied from Quizlet or from textbooks, or post answers to graded work. The report reasons include "Answers to a graded test or assignment". Add a short copyright (DMCA) contact to the Terms page and remove what's reported.
- **Display names are public** on published pages. The Publish question says so.
- **Cost:** pages are cached for an hour, and search results for five minutes. At launch this costs almost nothing in Supabase. See the estimate in the conversation that added this: about 11 KB per deck, and the free plan's 5 GB of egress covers hundreds of thousands of page views.
- **Later, if it takes off:** social preview images per set (Open Graph images), school pages ("University of Waterloo flashcards") and a "Similar sets" model.
