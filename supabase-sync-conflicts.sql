-- Studyboard: Sync Conflicts (two devices edit the same thing, nothing gets overwritten)
-- Run this once in Supabase: SQL Editor > New query > paste everything > Run. It is safe to run again.
-- Run it after your main setup SQL (and after lean.sql and plans.sql if you use them). Not required: without it, Studyboard still syncs
-- (the app notices and falls back), it just can't stop two devices that save at the same moment from overwriting each other.
--
-- What it does:
--  * Every synced row gets a revision number (rev) that goes up by one on every change, and the id of the device that wrote it (updated_by).
--  * studyboard_item_put / studyboard_item_delete save or delete only if the device's copy was based on the row's current revision
--    (compare-and-set). If the row moved on, nothing is written and the server's current version is returned, so the device can merge the two
--    versions (the merge rules live in the app: see SYNC-POLICY.md) and try again. A device that was offline for weeks cannot undo newer work.
--  * A trigger also bumps rev for older app versions that still write rows directly, so their changes are never invisible to newer devices.
--  * updated_at stays the server's own clock (set by lean.sql's trigger), so a device with the wrong date can't win by lying.
-- Row Level Security is unchanged: people only ever touch their own rows (user_id = auth.uid()). The functions run as the caller (not security
-- definer), so RLS and the per-plan data limit triggers (plans_items_quota) apply to them exactly as to a direct write. No access for anon.

alter table public.items add column if not exists rev integer not null default 0;     -- 0 = a row from before this file was run
alter table public.items add column if not exists updated_by text;
alter table public.items add column if not exists edited_at timestamptz;      -- when the person made the edit (their clock corrected to the server's), not when it reached the server

-- Keeps rev honest whoever writes: a new row starts at 1; a changed row goes up by at least one; rev never goes backwards.
create or replace function public.studyboard_rev_bump() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if coalesce(new.rev, 0) < 1 then new.rev := 1; end if;
  elsif new.rev is null or new.rev <= old.rev then
    new.rev := case when new.data is distinct from old.data then old.rev + 1 else old.rev end;
  end if;
  return new;
end $$;
drop trigger if exists sync_items_rev on public.items;
create trigger sync_items_rev before insert or update on public.items
  for each row execute function public.studyboard_rev_bump();

-- The server's clock, so a device can work out how far off its own clock is (see "Clock skew" in SYNC-POLICY.md).
create or replace function public.studyboard_clock() returns timestamptz
language sql stable set search_path = public as $$ select now() $$;

-- Save one item if the device's copy is current. Returns {ok:true, rev, now} or, when the row has changed, {ok:false, conflict:true, rev, data, updated_at, edited_at, now}.
-- p_edited_at is when the person made the edit (never later than now), so a change that sat offline for a week is not mistaken for a new one.
drop function if exists public.studyboard_item_put(text, text, jsonb, integer, text);
create or replace function public.studyboard_item_put(p_kind text, p_id text, p_data jsonb, p_base_rev integer default 0, p_device text default null, p_edited_at timestamptz default null) returns jsonb
language plpgsql set search_path = public as $$
declare
  u uuid := auth.uid();
  r public.items%rowtype;
  nr integer;
  base integer := greatest(coalesce(p_base_rev, 0), 0);
  ed timestamptz := least(coalesce(p_edited_at, now()), now());
begin
  if u is null then raise exception 'Not signed in' using errcode = '28000'; end if;
  if p_kind is null or p_id is null or p_data is null then raise exception 'kind, id and data are required' using errcode = '22023'; end if;
  select * into r from public.items where user_id = u and kind = p_kind and id = p_id for update;
  if not found then
    begin
      -- gone from the server (deleted on another device) or new: the device's edit is kept, so a stale delete never beats an edit
      insert into public.items (user_id, kind, id, data, rev, updated_by, edited_at) values (u, p_kind, p_id, p_data, base + 1, left(p_device, 64), ed) returning rev into nr;
      return jsonb_build_object('ok', true, 'rev', nr, 'created', true, 'restored', base > 0, 'now', now());
    exception when unique_violation then
      select * into r from public.items where user_id = u and kind = p_kind and id = p_id for update;   -- another device inserted it a moment ago
    end;
  end if;
  if r.rev = base then
    update public.items set data = p_data, rev = r.rev + 1, updated_by = left(p_device, 64), edited_at = ed
      where user_id = u and kind = p_kind and id = p_id returning rev into nr;
    return jsonb_build_object('ok', true, 'rev', nr, 'now', now());
  end if;
  if r.data = p_data then   -- the same content is already there: nothing to merge
    return jsonb_build_object('ok', true, 'rev', r.rev, 'same', true, 'now', now());
  end if;
  return jsonb_build_object('ok', false, 'conflict', true, 'rev', r.rev, 'data', r.data, 'updated_at', r.updated_at, 'edited_at', coalesce(r.edited_at, r.updated_at), 'updated_by', r.updated_by, 'now', now());
end $$;

-- Delete one item only if the device's copy is current. If it was changed elsewhere meanwhile, nothing is deleted and the current row is returned.
create or replace function public.studyboard_item_delete(p_kind text, p_id text, p_base_rev integer default 0) returns jsonb
language plpgsql set search_path = public as $$
declare
  u uuid := auth.uid();
  r public.items%rowtype;
begin
  if u is null then raise exception 'Not signed in' using errcode = '28000'; end if;
  select * into r from public.items where user_id = u and kind = p_kind and id = p_id for update;
  if not found then return jsonb_build_object('ok', true, 'gone', true, 'now', now()); end if;
  if r.rev = greatest(coalesce(p_base_rev, 0), 0) then
    delete from public.items where user_id = u and kind = p_kind and id = p_id;
    return jsonb_build_object('ok', true, 'now', now());
  end if;
  return jsonb_build_object('ok', false, 'conflict', true, 'rev', r.rev, 'data', r.data, 'updated_at', r.updated_at, 'edited_at', coalesce(r.edited_at, r.updated_at), 'now', now());
end $$;

revoke all on function public.studyboard_clock() from public, anon;
revoke all on function public.studyboard_item_put(text, text, jsonb, integer, text, timestamptz) from public, anon;
revoke all on function public.studyboard_item_delete(text, text, integer) from public, anon;
grant execute on function public.studyboard_clock() to authenticated;
grant execute on function public.studyboard_item_put(text, text, jsonb, integer, text, timestamptz) to authenticated;
grant execute on function public.studyboard_item_delete(text, text, integer) to authenticated;
