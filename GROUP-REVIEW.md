# Group Review (planned, switched off)

Group review would let a study group see each other's highlights and comments on the same PDF.
**It is off.** Only the groundwork is in the app (`src/js/99-pdf-tools.js`, between `/*REVIEW-START*/` and `/*REVIEW-END*/`), and `REVIEW_ON` is `false`.
With it off, nothing is shared, nothing is sent, and there's no button for it.

## Before switching it on

1. **Legal.** Get your copyright protection in place, then add a line to the Terms about shared markup. For example:
   "Group review shares only your highlights and comments. Each member needs their own copy of the PDF, and you may share only what you have the right to share."
2. **Database.** Run the SQL below in Supabase, then add a database store that uses the same `list / put / remove / watch` interface as `reviewMemoryStore()`.
3. **The interface.** Add a "Share My Marks With…" option to the reader, then show other members' marks in their own colours, each with the member's name.
4. **Switch it on.** Set `REVIEW_ON = true`, then add end-to-end tests that use two browsers.

## How it protects you and your students

- **The PDF is never shared.** Only the markup is shared: where each highlight sits, its colour, the comment and its replies.
  Each member opens **their own copy**. Copies are matched by a SHA-256 of the file's bytes (`reviewKey`), so marks only appear for someone who already has that exact file.
  Studyboard never hands a file to anyone who doesn't already have it.
- **Quotes are kept short.** A shared mark can carry at most 200 characters of the words it marks, so a list of marks shows what each one is about.
  The page's own text is never sent.
- **Every mark is checked** (`reviewNorm`): known kinds only, positions between 0 and 1, and capped lengths.
  The server must run the same checks; the SQL below does this with `check` constraints.
- **Permissions** (`reviewCan`):
  - Every group member can add marks and reply.
  - You can change your own marks.
  - You, and the group's owner, can remove a mark.
  - Row-level security enforces the same rules on the server.
- **Removals sync.** A removed mark is kept as a tombstone (`del: true`), so the removal reaches every device.
  When two edits clash, the newer one wins (`reviewMerge`).

## Data model

A shared mark (`reviewNorm` output):

| Field | Meaning |
|---|---|
| `id` | the mark's id (6 to 64 characters) |
| `fk` | SHA-256 of the PDF's bytes (64 hex characters) |
| `gid` | the study group |
| `uid`, `name` | who made it |
| `k` | `hl`, `ul`, `so`, `note` or `ink` |
| `p` | page number |
| `r` | rectangles as page fractions, `[[x, y, w, h], …]` (notes: one point) |
| `d` | ink strokes, encoded (ink only) |
| `t` | up to 200 characters of the marked words |
| `cm` | comment (up to 2000 characters) |
| `c` | colour name |
| `re` | the id of the mark this replies to |
| `upd`, `at` | last changed and created times (ms) |
| `del` | a tombstone: removed |

## Draft SQL (do not run yet)

```sql
-- One row per shared mark. The PDF itself is never stored here.
create table public.review_marks (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{6,64}$'),
  file_key text not null check (file_key ~ '^[a-f0-9]{64}$'),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default '' check (char_length(author_name) <= 60),
  kind text not null check (kind in ('hl','ul','so','note','ink')),
  page int not null check (page between 1 and 99999),
  body jsonb not null check (pg_column_size(body) < 32000), -- r, d, t, cm, c, re
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index review_marks_file on public.review_marks (group_id, file_key);
alter table public.review_marks enable row level security;

-- Members of the group can read the group's marks (sbg_is_member / sbg_is_owner come from supabase-groups.sql)
create policy review_read on public.review_marks for select using (public.sbg_is_member(group_id));
-- Members add marks as themselves
create policy review_add on public.review_marks for insert with check (user_id = auth.uid() and public.sbg_is_member(group_id));
-- You change your own; the group's owner can mark any as removed
create policy review_edit on public.review_marks for update
  using (public.sbg_is_member(group_id) and (user_id = auth.uid() or public.sbg_is_owner(group_id)));
-- Removal is an update to deleted = true (a tombstone), so there's no delete policy.
-- (Still to add: a trigger so an owner's update can only set deleted = true on someone else's mark.)
```

It builds on the tables and helpers in `supabase-groups.sql` (`study_groups`, `group_members`, `sbg_is_member`, `sbg_is_owner`).

## Live updates

The database store would subscribe to Supabase Realtime on `review_marks` filtered by `group_id`.
On each change it calls `reviewMerge(local, incoming)` and repaints the page's marks.
While offline, marks are queued on the device and sent when the connection returns. Merging makes it safe to send them twice.
