## Studyboard Credits and Studyboard Plus

Two ways to pay that sit beside Studyboard Pro:

- **Studyboard Credits:** buy credits once, then keep shop items for good, with or without Pro.
- **Studyboard Plus:** $2.99 a month for every Pro theme and feature except the built-in Studyboard AI. AI with the student's own key still works.

Both are **switched off** until you turn them on (see "Launch" below). While they're off, nothing changes for anyone.

### What Credits Buy

| Item | Credits | About |
|---|---|---|
| Theme Collection | 300 | $3. The theme, its companions, its sticker pack, its pins and its flashcard style |
| Sticker pack | 100 | $1 |
| Flashcard style | 100 | $1 |
| Pin | 50 | $0.50 |
| Note shape | 100 | $1 |

| Concept map style | 100 | $1. A subject map style (a theme's own map style comes with its Collection). Needs `supabase-credits-bundle.sql` |
| Build Your Look | 300 | $3. A Theme Collection plus up to 5 more flashcard styles, pins or map styles picked in the Style Shop's Build Your Look (needs `supabase-credits-bundle.sql`) |

Only Pro items can be bought; free items and companion accessories can't. A companion opens its Theme Collection. A pin, sticker pack or flashcard style that belongs to a collection also points to the whole collection.

### Credit Packs (Stripe product "Studyboard Credits", `prod_VdRSF2ExXrjwfx`, live)

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
- **Switching:** the Stripe customer portal now allows switching between Pro Monthly, Semester, Yearly and Plus, prorated. Switching to Pro turns Studyboard AI on at the next webhook; switching to Plus turns it off.
- **In the app:** a quieter "Don't Need Studyboard AI?" box under the Pro prices, so Pro stays the main choice. The renewal terms include Plus's price, and the comparison table gains a Studyboard AI row. Plus is sold on the website checkout only, not in the App Store or Google Play.
- **Why it makes sense:** Studyboard AI can cost up to $0.5625 a week per Pro student (about $2.25 a month). After Stripe fees, Pro at $4.99 nets about $4.55 before AI, so a heavy AI user leaves about $2.30. Plus nets about $2.61 with no AI cost. A student who switches from Pro to Plus costs little. The bigger risk is choice overload on the paywall, which is why Plus is a secondary box rather than a fourth price card. Watch `studyboard_upgrade_stats` (see "Upgrade Tracking" in PRO-PLANS-GUIDE.md) after launch.

### Done Already

- Stripe (live): the Credits product and 4 prices, the Plus product and price. The webhook endpoint now also sends `checkout.session.async_payment_succeeded`. The customer portal allows plan switching.
- Supabase (live): `supabase-credits.sql` applied and self-tested. `ai_included` added, with the updated `studyboard_apply_billing`, which was checked with a rolled-back test. `stripe_prices`, `plus_plan` (off) and `prices.plusMonthly` are set.

### Still To Do (Owner)

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
