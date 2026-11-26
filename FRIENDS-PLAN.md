# Friends, "Studying Now" and Study Together (plan, not built)

This plan looks at what reviewers and users praise about Gizmo's friend features, keeps only those parts, and fits them into Studyboard's existing groups, rooms, live quiz, usernames, blocks and push reminders.
**Step 1 (Friends) is built.** Steps 2 to 4 are not.

| Part | Where |
|---|---|
| Server | `supabase-friends.sql`, checked by `supabase-friends-selftest.sql` (48 checks, rolls back) |
| App | `src/js/81-friends.js`, `src/css/81-friends.css` |
| Tests | `tests/friends.test.js` (unit), `tests/friends.e2e.js` (browser) |

What changed from the plan below:

- **The first-time prompt is a card on Groups, not an onboarding step.** The welcome setup runs before anyone has an account, often offline, and a friend link needs an account. The card says "Studying With Someone?", shows only while you have no friends or requests, and has a Not Now button.
- **The friend list isn't a separate tab.** A Friends button sits in the Groups header with a count of requests waiting for you, and there is a Friends row in Settings > Account.
- **Blocking uses the existing `group_blocks` table,** so one block covers both groups and friends.
- **Reporting a friend isn't built.** `group_reports` needs a group, so reporting still happens from a group someone shares with you.

## 1. What Gizmo is praised for (and only that)

| Gizmo feature | How it works in Gizmo | What people praise | Source |
|---|---|---|---|
| **Finding a study buddy during onboarding** | Onboarding suggests people to follow. You can also follow someone by @username or from their profile. | A reviewer met a "study buddy" during sign-up and said studying felt "a lot less isolating". They called the social side "a pleasant surprise". | techpoint.africa/guide/gizmo-ai-review |
| **Gizmo Live** (studying together live) | You start a game from a deck. Friends join with a code, a link or a QR code, or by tapping "Let's play!" on a direct invite. Everyone answers the same question at once, a leaderboard shows between questions, and "Explain" is offered afterwards. | This is the strongest praise from real users. An App Store reviewer wrote: "I LOVE the feature… makes studying fun and simple." Headway also calls it out. | App Store listing; help.gizmo.ai |
| **Shared decks** | You share a deck by link. | A reviewer said their group got "one shared space" instead of emailing files back and forth. | techpoint.africa |
| **Streaks and seeing friends study** | Streaks, plus a friends list where a green dot shows "online now". When a friend comes online you get an alert with **Challenge** and **Wave** buttons. | The praise is general: streaks "help students who struggle to keep a study habit", and one reviewer mentioned a "great use of streaks". I found no praise aimed at the online dots themselves. | makeheadway.com; App Store |

**Left out because nobody praised them, or because they go against Studyboard's rules** (01-study-rewards.js: no speed scoring, nothing bought, no pressure):

- **Leagues and XP:** global leagues, XP bets on other players, and extra XP for answering faster.
- **Streak tools you can buy:** streak freezes and repairs.
- **Contact uploads:** uploading your phone contacts to find friends.
- **"Recently online" status:** Gizmo's orange dot for friends who were online recently.

The research found very little praise in total. Most of it comes from review and affiliate sites, and the one clear quote from a real user is about Gizmo Live. That's why this plan puts **studying together** first and keeps presence modest.

## 2. What Studyboard already has to build on

| Need | Already there |
|---|---|
| Identity | `study_profiles` with a display name, `@username` (filtered, unique) and the 13+ birthday check (`supabase-usernames.sql`, `96-usernames.js`) |
| Live presence in a session | `study_rooms` / `study_room_people` with `room_ping` heartbeats and plan limits (`supabase-rooms.sql`) |
| Playing a quiz together live | Host-driven live quiz over a private Realtime channel `sbquiz:<group>` (`80-groups.js` ~4410), with no speed scoring |
| Shared decks | `shared_decks` / `share_deck` / `get_shared_deck` |
| Safety | `group_blocks`, `group_reports`, `group_suspended`, rate limits (`sbr_rate_ok`) |
| Notifications | `push_subscriptions` plus the reminder queue (`supabase-reminders.sql`) |
| Study activity events | `fire("focus", {type: "start" / "pause" / "stop"})` in `01-focus.js`, and card and quiz events in `01-study-rewards.js` |
| Invite landing page | `invite.html` |

There is no one-to-one relationship between people yet. Everything social belongs to a group. So the one genuinely new piece is a **friend link between two people**. Everything else should reuse what's above.

## 3. The design

### 3.1 Friends: mutual, not follow

Gizmo uses follows, where anyone can follow a public profile. Studyboard is for students aged 13 and up, so a friendship should be a **request that the other person accepts**.

- **How you add a friend:**
  - Type their **exact @username**. There is no search, autocomplete or browsing, so nobody can list student accounts.
  - Or open their **friend link** (`invite.html?f=<code>`). The same link can be shown as a QR code for people sitting at the same table.
- **What a request shows:** only the requester's display name, @username and face. It expires after 30 days.
- **Limits:** up to 20 pending requests sent per day and 300 friends in total, enforced on the server.
- **Blocking:** reuse `group_blocks`. Blocking someone removes the friendship and stops any further requests from them. A suspension (`group_suspended`) turns friend features off too.
- **Onboarding** (the praised moment): at the end of `40-onboarding.js`, add the step **"Studying with someone? Send them your friend link."** This uses the share sheet only and never reads contacts. People can skip it, and it appears once.

### 3.2 "Studying Now": not "online"

Show what friends are actually doing, not just that the app is open. This is more useful ("I can join them") and shares less.

- **What you show:**
  - A status appears **only while you're studying**: a focus timer is running, you're reviewing cards, or you're in a room.
  - It reads, for example: *"Sam · Focusing on Biology · 25 min left"*. The course is included only if Sam allows it.
  - It clears itself (`until` passes) and there is **no "last seen"**.
- **Who sees it:** friends only.
  - The first time you add a friend, you're asked once: *"Let friends see when you're studying?"*, with the options **Yes** and **Just me**.
  - You can change this any time under Settings > Account > Profile.
- **Wave:** a quiet hello to a friend who is studying ("Sam waved 👋"). You can send one wave per friend per day, nobody is expected to reply, and waves respect quiet hours.
- **"Tell me when Sam starts studying":** this alert is **off by default** and is turned on per friend. Gizmo sends it for every friend automatically. Here it is opt-in so it never becomes noise.

### 3.3 Study Together: the part Gizmo is praised for

From a friend's "Studying Now" card or from their row in your friends list:

- **Join:** you enter the session they're already in.
- **Invite to Study:** pick a length and a goal. They get a push and an in-app card with **Join** and **Not now**.
- **Quiz Each Other:** pick a deck. This reuses the existing live quiz.
  - It keeps what people love about Gizmo Live: answering at the same moment, the reveal, the round summary, Mochi's explanation and "Another round".
  - It does **not** award extra points for speed, take bets, or charge XP.

**How it's built (the clean part):** a set of friends who study together gets a hidden **"together" space**. This is a `study_groups` row with `kind = 'together'`. It's created on the first invite between those people and reused after that.

- **What this reuses for free:**
  - rooms: heartbeats, limits, "already running" checks
  - live quiz: the Realtime channel and its security checks
  - chat, blocks, reports and suspensions
  - row-level security, through `sbg_is_member`
- **What has to change:**
  - Add `'together'` to `study_groups_kind_check`.
  - Hide `kind = 'together'` from the Groups list and the group caps.
  - Only friends can be added to it.
  - Without this approach, rooms would need a second, group-less permission model. With it, no new security path is needed.

### 3.4 Small extras (optional, later)

- **Send to Friend** on a deck uses `share_deck` and delivers the code as an in-app card instead of a link to paste.
- **"Days studied together"** on a friend's card counts days when you both reached your daily goal.
  - It is only ever a positive count. There are no freezes, no "streak lost" messages and no nagging.
  - This brings over what people liked about streaks without the pressure.

## 4. Data and API (new `supabase-friends.sql`)

```sql
create table public.friendships (
  a uuid not null references auth.users(id) on delete cascade,   -- a < b, one row per pair
  b uuid not null references auth.users(id) on delete cascade,
  requested_by uuid not null,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (a, b), check (a < b)
);
create table public.friend_codes (user_id uuid primary key, code text unique not null, made_at timestamptz default now());
create table public.study_status (                      -- one row per person, only while studying
  user_id uuid primary key references auth.users(id) on delete cascade,
  what text not null check (what in ('focus','cards','room')),
  course text check (char_length(course) <= 60),
  room_id uuid, until timestamptz not null, updated_at timestamptz not null default now()
);
create table public.friend_prefs (                      -- per friend: alert me, show course
  user_id uuid, friend_id uuid, alert_start boolean default false, primary key (user_id, friend_id)
);
```

- **Functions** (all `security definer`, rate-limited with `sbr_rate_ok`, blocked pairs checked in each one):
  - `request_friend(p_username)`, `request_friend_by_code(p_code)`, `answer_friend(p_user, p_accept)`, `remove_friend(p_user)`, `my_friends()`, `my_friend_link()`
  - `set_study_status(p_what, p_course, p_minutes)` and `clear_study_status()`
  - `friends_studying()`: returns only accepted, unblocked friends who have sharing on and whose `until > now()`
  - `wave(p_user)`, `invite_to_study(p_users uuid[], p_minutes, p_goal)`: finds or creates the together space, starts or joins its room and queues a push
- **Row-level security:** nobody reads these tables directly. All reads go through the functions above, the same pattern as `study_rooms`.
- **Realtime:** a private broadcast `sbfriends:<user>` carries live "started or stopped studying" updates. A refresh every 60 seconds covers anyone it misses.

## 5. App side

- **New module `src/js/81-friends.js`:**
  - A **Friends** sheet, opened from the top of Groups and from More on phones (`97-groups-nudge.js`). It has three parts: Studying Now, Friends and Requests.
  - A **Studying Now** strip on Today, shown only when at least one friend is studying. With no friends, nothing appears.
  - Pure rules sit between `/*FRIENDS-START*/ … /*FRIENDS-END*/` (status text, when to show the strip, wave limits), so they can be unit-tested like `NUDGE-START`.
- **Hooks:**
  - `01-focus.js`: `fire("focus")` events call `set_study_status` / `clear_study_status`.
  - Card review start and end call them too.
  - Joining a room sets the status to `room` with `room_id`, so friends can tap **Join**.
- **Offline or signed out:** the friend features are hidden and nothing else changes. Studyboard keeps working with no account.
- **Translations:** add every new string to `locales/`.

## 6. Build order

1. **Friends** (built): §3.1, §4 tables and functions, the Friends sheet, the friend link and QR code, blocks, the first-time card. This is useful on its own because of Send to Friend.
2. **Study Together** (§3.3): the together space, Invite to Study and Quiz Each Other. This is where most of the value is, based on the praise.
3. **Studying Now** (§3.2): status, waves and the opt-in start alert.
4. Optional: Days Studied Together.

## 7. Tests and checks before shipping

- **Unit tests:** the pure rules (status text, expiry, wave limit, pair ordering `a < b`).
- **Two-browser end-to-end tests:**
  - request, accept, remove, block
  - a status appears for the friend and disappears when the timer stops
  - an invite, then Join, lands both people in the same room
- **SQL self-test:**
  - Someone who isn't a friend can't read your status.
  - A blocked user can't send a request, a wave or an invite.
  - A username lookup can't be used to tell which accounts exist (an unknown name and a name that refuses requests get the same reply).
- **Privacy page and App Store privacy label:** say that study status is shared only with friends who are allowed to see it, and that contacts are never read.
