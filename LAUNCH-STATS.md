# Launch Tools: Stats, the Update Switch, Invite Rewards and What's New

All of this lives in `supabase-launch.sql` (the database) and `src/js/99-launch.js` (the app). The stats page is `website/stats/`.

## Setup (once)

1. In the Supabase **SQL Editor**, run `supabase-launch.sql`, then run `supabase-lean.sql` again. That adds the new tables to Delete My Account.
2. Turn on **pg_cron** (Database > Extensions) if it isn't on, and run `supabase-launch.sql` again. Without it, the stats page still saves the missing days whenever you open it. The note that an account was active would then wait until that page view to be deleted, not be deleted every night.
3. Let your email see the stats:
   ```sql
   insert into public.studyboard_config (key, value) values ('stats_viewers', '["you@example.com"]')
     on conflict (key) do update set value = excluded.value, updated_at = now();
   ```
4. Sign in on the website's **Account** page with that email, then open **studyboardapp.com/website/stats/**. The page isn't linked anywhere and search engines are told to skip it, and the database refuses anyone not on the list.

## What the stats page shows

| Number | Where it comes from |
|---|---|
| Accounts active | Accounts that checked in that day, or saved anything |
| Devices without an account | The daily check-in: once a day per device, counted, nothing about the device kept |
| New accounts | Accounts made that day |
| Coming back (1, 7, 30 days) | Of each day's new accounts, how many were active again 1, 7 and 30 days later |
| Decks studied, quizzes taken | Decks with a card reviewed that day; quizzes finished that day |
| Joined a group or added a deck, joined from an invite | Group joins, shared decks added, new accounts from an invite link |

Days are UTC. Each night at 00:20 the job saves yesterday's totals and deletes the "active today" notes. The stats are totals only, and nothing is kept per person.

**Devices without an account are devices, not people.** Someone using the website and the phone app counts twice, and clearing browser data counts as a new device the next day. Treat the number as a trend, not a head count. The count isn't protected against someone calling the check-in on purpose to inflate it. It can't touch anyone's data; at worst a day's number reads high.

## The update switch

The rule is in `app_flags`, key `version_policy`. Every app reads it within 6 hours, and on its next opening.

```sql
-- versions older than 1.15.9 stop syncing and ask to update (their changes stay on the device and sync after updating)
update public.app_flags set value = '{"min": "1.15.9", "message": "1.15.8 can lose changes made offline."}', updated_at = now() where key = 'version_policy';
-- only these exact versions
update public.app_flags set value = '{"bad": ["1.15.8"]}', updated_at = now() where key = 'version_policy';
-- a gentle, dismissible "An update is ready" (syncing carries on)
update public.app_flags set value = '{"nudge": "1.16.0"}', updated_at = now() where key = 'version_policy';
-- off: every version syncs
update public.app_flags set value = '{}', updated_at = now() where key = 'version_policy';
```

On the website the button reloads the page to the newest version. The phone apps open the App Store or Google Play, the Microsoft Store app opens its Store page, and the downloaded desktop app opens the website's download section. Before pausing a version, make sure the fixed version is already live in that store.

## Invite rewards

- Everyone gets a link (menu: **Invite Friends, Get Pro Free**). Group invite and shared deck links carry the same code once it's been fetched.
- A friend counts when they make a **new** account from the link (the account must be made within 14 days of opening it), confirm their email, and **come back on another day**. A throwaway email domain (`studyboard_trial_blocked_domains`) doesn't count, and neither does your own link.
- Every 3 friends who count add **a month of Pro's features**: the same as a "month" promo code, so no Studyboard AI and the free plan's storage. The limit is 6 months in any 365 days. The rule is `studyboard_ref_rule()`.
- A month already in progress is extended, not replaced.

### Stopping people from inviting themselves

A join is recorded but **never counts** when:

| Trick | How it's caught |
|---|---|
| Your own address in disguise (`maya+2@gmail.com`, `m.aya@gmail.com`, `googlemail.com`) | Addresses are compared without dots (Gmail), +tags and case |
| Any address with a +tag, or a second account for an address that already has one | Same comparison |
| A new account made on your phone or laptop | Your devices are remembered (scrambled) when you open Invite Friends, and checked against the Devices list |
| Several "friends" made on one device | Two joins from the same device only count once |
| Empty accounts that never get used | A friend must make 3 or more tasks, courses, decks, notes or events, confirm their email and come back on another day, all within 30 days |
| Throwaway email services | `studyboard_trial_blocked_domains` |

What's left (someone with several real email addresses, several devices or private windows, filling each account with 3 things and coming back the next day) is a lot of work for a month of themes. The 6-months-a-year cap limits what anyone can get, and the reward includes no AI and no storage, so the most an abuser can cost you is themes.

To check and act:

```sql
-- inviters worth a look: most held joins first (alias, same_device)
select * from public.studyboard_ref_review(30);
-- take back the invite months from someone who gamed it (their promo end date moves back; promo codes are untouched)
select public.studyboard_ref_revoke('someone@example.com');
```

For more protection against scripted sign-ups, turn on **CAPTCHA protection** in Supabase (Authentication > Attack Protection). The app's sign-in form would then need a CAPTCHA widget added; ask for it if you see automated sign-ups.

```sql
-- who invited the most (for thanking people; there's no public leaderboard)
select r.referrer, u.email, count(*) joined, count(*) filter (where r.qualified_at is not null) counted
from public.studyboard_referrals r join auth.users u on u.id = r.referrer group by 1, 2 order by 3 desc limit 20;
```

## What's New

When you release, add an entry for the new version at the top of `NOTES` in `src/js/99-launch.js`: 2 or 3 lines of `[title, one sentence, optional {label, act}]`. Everyone who used the previous version sees it once, when nothing else is on screen. Brand-new students never see it. Closing it is one of the good moments for the rating prompt.

## Tested

- `tests/launch.e2e.js`: the check-in, the update switch, invite links, Invite Friends and What's New, on desktop and phone.
- The SQL was run on PostgreSQL 16 with these checks:
  - invites are claimed and refused correctly;
  - the reward is given after the third friend comes back;
  - the totals are right;
  - the stats page refuses anyone not on the list;
  - the nightly job deletes the activity notes;
  - Delete My Account removes everything.
