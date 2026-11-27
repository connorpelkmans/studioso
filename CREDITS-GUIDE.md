## Studyboard Bucks, Studyboard Credits and Studyboard Plus

Studyboard has two currencies, and they never mix:

| | Studyboard Bucks | Studyboard Credits |
|---|---|---|
| Looks like | A green bill with the Studyboard logo raised on it, drawn like the coin (`build-resources/bucks-art/render-bucks.py` makes `bucks-bill.webp` and `bucks-stack.webp`) | A gold coin (`build-resources/credits-art/credits-coin-256.png`) |
| How you get them | Bought with money on the website (Stripe) | Earned by studying |
| What they buy | Style Shop items: Theme Collections, sticker packs, flashcard styles, pins, note shapes, map styles | Companion accessories in the Wardrobe |
| Where they live | Supabase (`studyboard_credit_*` tables) | The student's own synced settings (`state.settings.sc`) |
| Code | `src/js/97-credits.js` | `src/js/98-0study-credits.js`, used by `src/js/98-companion.js` |

**Naming:** the server still calls Bucks "credits" (tables, `studyboard_credits_me`, packs like `credits_300`, the Stripe product). Only students see the word Bucks. Renaming the server side would mean migrating live payment tables for no gain.

Beside them sits **Studyboard Plus:** $2.99 a month for every Pro theme and feature except the built-in Studyboard AI. AI with the student's own key still works.

Bucks and Plus are **switched off** until you turn them on (see "Launch" below). While they're off, nothing changes for anyone. Studyboard Credits are always on.

## Studyboard Credits (earned, for accessories)

Students earn credits for real work, scaled to how hard it is (about one credit per minute of real effort):

| Work | Credits | Why |
|---|---|---|
| Focus time | 1 per 2 minutes, at most 3 hours a day | The easiest: just keeping the timer going. The cap stops a timer left running from farming credits |
| Flashcards | 1 per card gone through, at most 150 a day | However the card was rated: a card marked Again that comes back in the same session counts once. The cap stops tapping through cards just for credits |
| Practice quizzes | 1 per right answer, +5 for passing (70%+ of 3 or more questions), +5 more for a perfect score; up to 3 tries of the same quiz a day | Longer quizzes earn more; a failed try still counts its right answers |
| Tasks | Exam 40, Project 30, Quiz 20, Assignment or Lab 12, Reading or Study 6, Other 4; a step of a broken-down task 3 | By size. At most 8 tasks a day count, so splitting work into tiny tasks doesn't pay |
| Presentations | 3 per slide finished inside its time, +20 when the whole talk is on target, +30 more the first time; 2 runs a day per presentation | A slide is on time within 17% or 3 seconds of its share; the whole talk within 10 seconds over its goal and at least 75% of it |

**Prices by rarity** (`PRICE` in `98-companion.js`): Common 100, Uncommon 200, Rare 300, Exotic 500, Legendary 1,000. The Festive Beanie (Rare) is only sold Dec 1 to Jan 6.

**How long things take:** a steady study day (a 25-minute focus session, 20 flashcards, one passed 10-question quiz, an assignment and a reading) earns about 65 credits, plus about 25 more from chests on average. That's a Common in about a day, an Uncommon in about 3 days, a Rare in half a week, an Exotic in about a week and a Legendary in about two weeks.

**While studying:** a gold "+N credits" chip shows what the session has earned so far, and nothing else: under the focus timer's dial, in a flashcard session's and a quiz's header, and beside a presentation run's clock. The end screen says what earned what (the minutes focused, the flashcards studied, the answers right and "For passing", the slides on time and "For finishing the whole talk on target"). Tasks show theirs when they're done.

**Chests:** finishing a piece of work sometimes turns up a chest: each flashcard gone through (once a session) has a 2.5% chance, each right quiz answer 4%, each presentation slide practiced 4% (once a run), each finished focus session 25%. At most 4 a day. A chest is Common 70% of the time (grey rim, 5 to 20 credits), Rare 22% (blue, 20 to 50), Exotic 6.5% (purple, 50 to 100) and Legendary 1.5% (yellow, 100 to 200). It's found quietly (a small note at the top, and a little chest beside the credits chip) and opened at the session's end, one by one, just before the credits screen, where each gets its own line. Chests left from a session closed early open the next time the app is calm. A steady study day (20 cards, about 8 right answers, a focus session) finds about one chest a day: a Common about every 1.3 days, a Rare every 4 days, an Exotic every 2 weeks and a Legendary about every 2 months (about every 3 weeks for someone studying hard every day). Chests add about 25 credits a day on average. Browser tests find chests only with `localStorage["studyboard:chest-test"]` set (to 1, or a rarity).

**Reward screens:** each piece of work ends on a screen that awards its credits (`reward()` in `98-0study-credits.js`, styles in `98-study-credits.css`): a focus session, a flashcard session (over Session Done), a quiz (deck or AI practice quiz), and a presentation run each get a full screen. It counts the coins up in a shower of falling coins, lists what earned what line by line, raises the balance, and fills a bar toward the cheapest accessory not owned yet, with Get It once it's affordable. A finished task gets a smaller card that goes away by itself. The first screen a student ever sees also says what their earlier studying earned. Browser tests see these screens only with `localStorage["studyboard:rewards-test"] = "1"`.

**How it's counted:** card reviews are counted by day as they're rated (`sc.cd`, saved every 15 cards and at the session's end; reviews from before are counted once, `sc.cbase`). Focus minutes and finished tasks (with their `doneAt`) are worked out from what's already saved, so they sync with everything else and work done before credits existed counts too. Quizzes and presentation runs are written down as they end (`sc.ev`, older than 45 days folded into `sc.evOld`), because decks keep only their last 20 quiz results; quizzes from before are counted once (`sc.qbase`). Each kind keeps its highest total (`sc.hw`, saved at most once a minute), so deleting an old deck or task never takes credits back. Unticking and re-ticking a task doesn't earn twice. Purchases are `sc.own` (`{accessory: price}`), and the balance is earned minus spent, never below zero.

**Moving from earned accessories:** accessories unlocked the old way (`comp.earned`) stay owned. Accessories are no longer Pro: anyone can buy any of them with credits. Patterns and custom colours are still Pro.

**In the app:** a "+12 Credits" coin pops in at the top right after new work (it waits until a flashcard session or presentation run ends). The Wardrobe shows the balance, each accessory's price (gold when affordable), a buy sheet with the companion trying it on, and How to Earn Credits with each kind's total. The end of a flashcard session shows the credits it earned and the next accessory to save for. The first time, a pop says how many credits the student's past work already earned.

**Changing a rate or price:** rates are at the top of `98-0study-credits.js`, prices in `PRICE` in `98-companion.js`. A rate change applies to past work too, because totals are recalculated.

## Studyboard Bucks (paid, for the Style Shop)

### What Bucks Buy

| Item | Bucks | About |
|---|---|---|
| Theme Collection | 300 | $3. The theme, its companions, its sticker pack, its pins and its flashcard style |
| Sticker pack | 100 | $1 |
| Flashcard style | 100 | $1 |
| Pin | 50 | $0.50 |
| Note shape | 100 | $1 |

| Concept map style | 100 | $1. A subject map style (a theme's own map style comes with its Collection). Needs `supabase-credits-bundle.sql` |
| Build Your Look | 300 | $3. A Theme Collection plus up to 5 more flashcard styles, pins or map styles picked in the Style Shop's Build Your Look (needs `supabase-credits-bundle.sql`) |

Only Pro items can be bought with Bucks. Free items can't, and companion accessories are bought with earned Studyboard Credits instead. A companion opens its Theme Collection. A pin, sticker pack or flashcard style that belongs to a collection also points to the whole collection.

### Bucks Packs (Stripe product "Studyboard Credits", `prod_VdRSF2ExXrjwfx`, live; rename it to "Studyboard Bucks" in Stripe)

| Pack | Price | Stripe price id | Lookup key |
|---|---|---|---|
| `credits_100` | $0.99 | `price_1UcAZKFT8I9EapuBLOohFJvw` | `studyboard_credits_100` |
| `credits_300` | $2.99 | `price_1UcAZNFT8I9EapuBiN4qzG5b` | `studyboard_credits_300` |
| `credits_600` | $4.99 (20% bonus) | `price_1UcAZPFT8I9EapuBOW9petbt` | `studyboard_credits_600` |
| `credits_1300` | $9.99 (best value) | `price_1UcAZRFT8I9EapuBSieDVJKC` | `studyboard_credits_1300` |

The price ids live in Supabase, in `studyboard_credit_packs`, not in secrets. The checkout reads the price from that table. The webhook gives credits only when Stripe says that exact price was paid.

**Pricing note:** Stripe takes about 30¢ + 2.9% of each card payment, so the $0.99 pack keeps about 66¢ (a third goes in fees), against about 94¢ per dollar on the $9.99 pack. Some options:
- Keep the $0.99 pack as a low-commitment first purchase.
- Retire it: `update public.studyboard_credit_packs set active = false where pack_id = 'credits_100';`
- Replace it with 200 credits for $1.99: make the price in Stripe, then insert a row.

### How It Works

```
 App: Style Shop, tap a locked item ──> buy sheet (97-credits.js)
   │   enough credits: rpc studyboard_buy_item(kind, id)  ──> the server checks the price and balance, keeps the item
   │   not enough:     Get Credits ──> create-checkout {pack} ──> Stripe Checkout (one-time payment)
   │                                                                │
   │                                         billing-webhook <──────┘ checkout.session.completed / async_payment_succeeded
   │                                              │ the price paid is read back from Stripe
   │                                              v
   │                                  studyboard_credits_order()  (once per checkout; adds the pack's credits)
   v
 rpc studyboard_credits_me()  ──> balance, owned items, prices, packs (owns() in 01-style-shop.js says yes on every device)
```

- **Tables** (`supabase-credits.sql`): `studyboard_credit_packs`, `studyboard_credit_item_prices`, `studyboard_credit_balances`, `studyboard_credit_ledger` (every change, each with a unique ref so nothing counts twice), `studyboard_owned_items`, `studyboard_credit_orders`. People can only read their own rows. Every write goes through the functions.
- **Refunds and disputes:** a refunded or disputed credit payment takes its credits back. If they were already spent, the newest items bought with credits are returned until the balance is back at zero. A won dispute gives the credits back. Credit refunds never touch Pro. Before this change, any refund on a customer ended their Pro. Items you give as gifts are never taken back.
- **Store apps:** the App Store and Google Play require their own payment system for digital items. So the iPhone and Android apps (outside the US storefront website route) show the balance and let people spend credits, but don't sell them. Selling credits in the stores would need consumable products in RevenueCat; that isn't built.
- **Self-test:** `supabase-credits-selftest.sql` (31 attack and accounting checks, rolled back). It must end with `CREDITS SELF-TEST PASSED`.

### Studyboard Plus

- Stripe product "Studyboard Plus" (`prod_VdRcblnoJabC2S`), $2.99 a month: `price_1UcAj5FT8I9EapuBtMTrsiyn`. The id is in `studyboard_config.stripe_prices.plus_monthly` (or set the `STRIPE_PRICE_PLUS` secret, which wins).
- **The server decides:** `billing-webhook` sends `ai: false` when the subscription's price is a Plus price. `studyboard_apply_billing` stores it in `studyboard_entitlements.ai_included`. Every other plan gets `true`. The app can't change it.
- **Everything except Studyboard AI is Pro:** themes, storage, devices, groups and tools. The Studyboard AI server (`cloudflare/ai-pro`, `tierOf`) says no to `ai_included = false`, so Plus students use their own key, like free students.
- **Switching:** the Stripe customer portal now allows switching between Pro Monthly, Quarterly, Yearly and Plus, prorated. Switching to Pro turns Studyboard AI on at the next webhook; switching to Plus turns it off.
- **In the app:** a quieter "Don't Need Studyboard AI?" box under the Pro prices, so Pro stays the main choice. The renewal terms include Plus's price, and the comparison table gains a Studyboard AI row. Plus is sold on the website checkout only, not in the App Store or Google Play.
- **Why it makes sense:** Studyboard AI can cost up to $0.5625 a week per Pro student (about $2.25 a month). After Stripe fees, Pro at $4.99 nets about $4.55 before AI, so a heavy AI user leaves about $2.30. Plus nets about $2.61 with no AI cost. A student who switches from Pro to Plus costs little. The bigger risk is choice overload on the paywall, which is why Plus is a secondary box rather than a fourth price card. Watch `studyboard_upgrade_stats` (see "Upgrade Tracking" in PRO-PLANS-GUIDE.md) after launch.

### Done Already

- Stripe (live): the Credits product and 4 prices, the Plus product and price. The webhook endpoint now also sends `checkout.session.async_payment_succeeded`. The customer portal allows plan switching.
- Supabase (live): `supabase-credits.sql` applied and self-tested. `ai_included` added, with the updated `studyboard_apply_billing`, which was checked with a rolled-back test. `stripe_prices`, `plus_plan` (off) and `prices.plusMonthly` are set.

### Still To Do (Owner)

- **For the Bucks rename:** run `supabase-bucks.sql` (renames the pack labels), rename the Stripe product "Studyboard Credits" to "Studyboard Bucks" (Dashboard, Product catalog) so the checkout page and receipts match, and redeploy `create-checkout` (its payment description now says Bucks).

0. **Turn on map styles and Build Your Look bundles:** run `supabase-credits-bundle.sql` in the SQL Editor (after `supabase-credits.sql`). It lets concept map styles be sold (kind `cm`, 100 credits) and adds `studyboard_buy_bundle(theme, items)`: the theme with its Collection plus up to 5 flashcard styles, pins or map styles (note shapes are sold on their own), for the Collection price. Until it's run, the app says bundles aren't available yet and still sells the Collection and each piece.
1. **Deploy the two functions** (from the repository root, Supabase CLI signed in):
   ```bash
   npx supabase functions deploy create-checkout billing-webhook --project-ref pivcmrqcjseycjkbocmc
   ```
   Keep **Verify JWT** ON for `create-checkout` and OFF for `billing-webhook` (`supabase/config.toml` already says so).
2. **Deploy the Studyboard AI server** so Plus doesn't get Studyboard AI (from `cloudflare/ai-pro`):
   ```bash
   npx wrangler deploy
   ```
   Do this **before** turning Plus on.
3. **Run `supabase-lean.sql` again** in the SQL Editor (account deletion now clears credit balances and items by name, and keeps paid orders without the account).
4. **Ship the app and website** (this branch: `index.html` + `bundle/`, and `website/`).
5. **Test with a real card**, then refund it:
   - Buy the 100-credit pack and check that the balance shows up.
   - Keep a pin.
   - Refund the payment in Stripe: the credits come back off and the pin is returned.
   - For Plus: subscribe, check `ai_included = false` and that Studyboard AI is off, then switch to Pro in Manage Plan and check it comes back.

### Launch

```sql
-- Credits
update public.studyboard_config set value = 'true' where key = 'item_purchases';
-- Studyboard Plus
update public.studyboard_config set value = 'true' where key = 'plus_plan';
```
Set either back to `false` to hide it again. Credits and items people already have stay theirs.

### Owner Tools (SQL Editor only)

```sql
select public.studyboard_grant_credits('friend@example.com', 300, 'contest prize');  -- negative takes credits away
select public.studyboard_give_item('friend@example.com', 'skin', 'winter');          -- a free collection, kept for good
select * from public.studyboard_credit_ledger order by created_at desc limit 50;     -- every change
select * from public.studyboard_credit_orders order by created_at desc limit 50;     -- every paid pack
-- Change a price (applies to the next purchase):
update public.studyboard_credit_item_prices set credits = 250, updated_at = now() where kind = 'skin';
-- A new pack: make a one-time price on the "Studyboard Credits" product in Stripe, then:
insert into public.studyboard_credit_packs (pack_id, credits, price_cents, stripe_price_id, label, sort) values ('credits_2800', 2800, 1999, 'price_...', '2,800 Credits', 5);
```
