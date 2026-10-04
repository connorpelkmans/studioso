# Sync conflict policy

Principle: **never silently lose what someone typed.** When two devices change the same thing, the app merges the changes; if it cannot, it keeps both versions and says so.

Code: the pure merge rules are the `SYNC-MERGE-START/END` block in `index.html` (`SyncMerge`); the sync glue is in `sbBackend` (`upsert`, `remove`) and `syncAdopt`; the server side is `supabase-sync-conflicts.sql`. Tests: `tests/sync-merge.test.js` (rules), `tests/sync-two-device.e2e.js` (two browsers, 15 scenarios).

## How a conflict is detected

Every row in `items` carries `rev` (goes up by one on every change; 0 = written before the SQL was installed), `updated_by` (device id) and `edited_at` (when the person made the edit, with their clock corrected to the server's). A device remembers the version of each item it last saw from the server (the **base**) and its `rev`. When it saves, it asks the server to write only if the row is still at that `rev` (`studyboard_item_put`, compare-and-set). If it is not, nothing is written; the server returns its current version and the device does a three-way merge of **base / mine / theirs**, then saves the result against the new `rev`. Deleting works the same way (`studyboard_item_delete`). Timestamps alone are never used to decide whether something changed.

Without the SQL file the app falls back to the old write, but reads the row first when the change waited offline, when another device changed it meanwhile, and for settings. That is not atomic: two saves in the same second can still overwrite each other.

## Merge rules (`SyncMerge.mergeItem`)

| Situation | Result |
|---|---|
| Only one side changed since the base | Take that side. |
| Both changed, different fields | Take both (field by field, including inside `settings`, card fields, checklist items). |
| Note text (also task/event notes, card front/back) changed on both | Line-level three-way merge (diff3). Different lines: merged. Both added lines at the same spot: both kept in order. One side deleted a line the other edited: the edit wins. **Same lines edited: both kept**, divided by `--- Your edit on this device ---`, `--- Conflicting edit from your other device (Oct 12, 3:41 PM) ---`, `--- End of conflicting edit ---`; the item gets `conflict`, a toast, a badge on the note and an entry under Settings > Account and Sync > Sync Issues (Keep mine / Keep theirs / Keep both). |
| Any other field changed on both | The later edit wins: this device's edit time (corrected for clock skew) against the other version's `edited_at`. Within 5 minutes (`SKEW_GUARD`) the device that is merging last wins; if this device's edit time is unknown the server's version wins. The loser is recorded in the item's `syncLog` (and as a "Sync:" line in a task's activity). |
| Task `status` | `done` is sticky: done beats todo/doing on the other side. A one-sided reopen is just a one-sided change, so it wins. |
| Arrays of records with an `id` (cards, checklist, quizzes) | Merged by id: the union; a record removed on one side is removed only if the other side did not touch it; a reorder on one side is kept. |
| Arrays of plain values (e.g. `dependsOn`) | Additions from both sides kept; removals honoured. |
| Adds on both sides | Both kept. Ids are `Date.now()` in base 36 plus 6 random base-36 characters, so two devices cannot produce the same id by accident. |
| Deleted on one side, edited on the other | **The edit wins and the item is restored.** A hard delete (row removed) never beats an edit made elsewhere. A soft deletion (`deleted`/`trashed`/`deletedAt`/`trashedAt`, as the trash feature writes) wins only if it is more than 24 hours (`DELETE_MARGIN`) newer than the edit; the content stays in the tombstone. |
| Data format version (`schema`) | Only goes up. An older app never "migrates" an account that a newer app has already saved, and never writes the version down. |
| Fields this app version does not know | Always kept. |

## History and caps

Notes keep a hidden `hist` ring of the last 5 versions that a merge or resolve replaced (12,000 characters each). Other kinds keep `syncLog` (last 12 losers, 200 characters each). A task's activity list stays capped at 30.

## Staleness and clocks

* A device always pulls before it pushes at start-up, and every push is a compare-and-set with a merge, so a device that was offline for weeks cannot replace newer data with old data; only the items it edited are sent, never a whole-state upload.
* Unsent changes stay on screen and in the outbox (`studioso:outbox`) across restarts and are never replaced by a pull; their bases are kept in IndexedDB (`pb:<user>`), falling back to the on-device copy of the server's version if that is lost.
* `updated_at` is stamped by the server (`lean.sql`). Each device estimates the offset of its own clock from the server's (`studyboard_clock()`) and uses it only to compare edit times, never to order saves.

## Known limits

* Overlapping edits inside one long line are kept as two whole lines, not merged by word.
* Without `supabase-sync-conflicts.sql` the protection is best-effort (see above).
* Realtime does not replay events a device missed while offline; it catches up with a delta pull when it comes back.
