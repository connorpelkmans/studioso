# Copyright takedowns

What to do when someone says Studyboard is showing their copyrighted work: a formal notice to the copyright agent
(dmca@studyboardapp.com), or a report marked **Copies someone else's work (copyright)** in the app.
Everything here runs in the Supabase **SQL Editor**. The functions are in `supabase-takedowns.sql`, and only you can run them.

This is a practical checklist, not legal advice. When a notice is unusual (a threat to sue, a court order, a notice
about something Studyboard itself made), ask a lawyer before acting.

## 1. See what's waiting

```sql
select * from public.studyboard_copyright_reports();
```

This lists copyright reports from the app that haven't been dealt with yet: shared links and public pages (`source = link`,
`ref` = the share code) and study groups (`source = group`; `what = board` is a group whiteboard, `item` is something
shared in a group, and `ref` is its id). Formal notices arrive by email at dmca@studyboardapp.com.

## 2. Check that a formal notice is complete

A notice by email counts only if it has all of these (the Terms list them under **Copyright complaints**):

1. A physical or electronic signature (a typed full name is enough)
2. What work they own
3. Where the copy is in Studyboard: a link, a share code, or the group and whiteboard name
4. Their name, postal address, phone number and email
5. A statement that they believe in good faith the use isn't allowed by the owner, its agent or the law
6. A statement that the notice is accurate and, under penalty of perjury, that they own the work or may act for the owner

If something is missing, reply asking for it. You don't have to act on an incomplete notice, but reply promptly.

A report from the app isn't a formal notice. Still look at it, and take the content down if it clearly copies someone's
work, such as textbook pages, slides or test questions.

## 3. Take it down quickly (the same day if you can)

Find what the notice points to:

- **A link or a public page** (studyboardapp.com/flashcards/…-abcd1234, or a code like ABCD-1234): the code is the last
  part of the address, written `ABCD-1234`.
- **A group whiteboard**: the report's `ref` is the board's id. Without a report, find it by name:
  `select id, name, group_id from public.group_boards where name ilike '%cell%';`
- **Something shared in a group** (a deck, quiz, file or link): the report's `ref` is the item's id. Without a report:
  `select id, kind, title, group_id from public.group_items where title ilike '%chapter 5%';`

Then run the matching function. The second value is your note: who complained, when, and about what.

```sql
-- a deck, note, quiz or whiteboard link, and its public page
select public.studyboard_takedown_share('ABCD-1234', 'Notice from Publisher X, received 2026-11-20, figure 3.2');

-- every picture on a live group whiteboard
select public.studyboard_takedown_board('board id here', 'Notice from Publisher X, received 2026-11-20');
-- or only one picture (its id is in the board's history: select id, ch from public.group_board_ops where board_id = '…')
select public.studyboard_takedown_board('board id here', 'Notice from Publisher X', 'picture id here');

-- a deck, quiz, file or link shared in a study group
select public.studyboard_takedown_group_item('item id here', 'Notice from Publisher X, received 2026-11-20');
```

What each one does:

| Function | For everyone else | For the person who shared it |
| --- | --- | --- |
| `studyboard_takedown_share` | The link stops working. The public page, search results and Course Library listing go. | They still see their own copy. |
| `studyboard_takedown_board` | The pictures disappear from the board for every member (at once for anyone with it open, otherwise the next time it syncs) and from the board's history. The thumbnail is redrawn without them. Drawing and text stay. | Same as everyone. |
| `studyboard_takedown_group_item` | The item disappears from the group. A file uploaded to the group can no longer be opened by members. | An uploaded file stays in their own storage folder. |

Each takedown is a **strike** against whoever shared it. The result says how many they have. At **3 strikes** that haven't
been reversed, the person is automatically blocked from sharing publicly and from study groups (the repeat-infringer rule
in the Terms). The rest of their Studyboard keeps working.

Copies people already added to their own Flashcards stay theirs: the Terms say unpublishing doesn't remove copies others
saved. If a notice specifically asks, tell the person who sent it that this is the case.

## 4. Tell both sides

**To the person who sent the notice:**

> Thank you for your notice. We've removed the material you identified from Studyboard ([link or description]).

**To the person who shared it** (their email is in the result; `select * from public.studyboard_takedowns('their@email');`
lists everything about them):

> We removed "[title]" from Studyboard after receiving a copyright notice saying it copies someone else's work.
> [Name of the complainant, if they're a company or a publisher] says they own [the work].
>
> This counts as a strike on your account. After 3 strikes, you can no longer share publicly or use study groups.
>
> If you believe it was removed by mistake, or that you have the right to share it, you can send a counter-notice to
> dmca@studyboardapp.com. The Terms of Service (Copyright complaints, "If we removed something you shared") list what it must
> include. We send counter-notices, with your contact details, to the person who complained.

## 5. A counter-notice

A counter-notice counts only if it has all of these:

1. A physical or electronic signature
2. What was removed and where it was
3. A statement, under penalty of perjury, that they believe in good faith it was removed by mistake or misidentification
4. Their name, postal address and phone number
5. A statement that they consent to the jurisdiction of the federal district court for their address (or, outside the
   United States, any judicial district where Studyboard may be found), and will accept service of legal papers from the
   person who complained

When it's complete:

1. Forward it to the person who sent the original notice, and tell them you'll put the material back in 10 business days
   unless they tell you they've started a court case to stop it.
2. Wait **10 to 14 business days** after you received the counter-notice.
3. If they haven't told you about a court case, put it back:

```sql
select * from public.studyboard_takedowns('their@email');   -- find the takedown id
select public.studyboard_restore_takedown('takedown id here', 'Counter-notice received 2026-11-25, no court case by 2026-12-10');
```

This puts back a link, a public page or a group item, and removes the strike. Pictures taken off a whiteboard can't be put
back: tell the member they may add the picture again. If they were blocked at 3 strikes and are now under 3, lift it with
`select public.studyboard_unsuspend_from_groups('their@email');`

## 6. Keep records

`copyright_takedowns` keeps every takedown with your note, who shared it and when it was restored. Also keep the notice
and counter-notice emails in the dmca@studyboardapp.com inbox. Don't delete either.

## Also remember

- The copyright agent's registration with the U.S. Copyright Office must be renewed every 3 years. Update the Terms
  (`website/terms.html` and `src/js/99-release.js`, kept in step) if the address, phone or email changes.
- Several reports from different people about the same link hide it automatically until you review it (`report_share`).
  Review those too: restore it with `update public.shared_decks set hidden = false where code = 'ABCD-1234';` (or
  `shared_items`) if nothing was wrong.
