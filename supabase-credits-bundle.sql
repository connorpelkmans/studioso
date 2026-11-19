-- Studyboard Credits, part 2. Safe to run again. Run after supabase-credits.sql.
--   1. Concept map styles for sale: 100 credits each (kind 'cm', the subject styles; a theme's own map style comes with it).
--   2. Build Your Look bundles: a theme (with its Theme Collection: its companions, sticker pack, pins and flashcard
--      style) plus up to 5 more pieces (flashcard styles, pins, concept map styles; note shapes are sold on their own), for the price of one
--      Theme Collection.
--
-- The server decides the price (studyboard_credit_item_prices, kind 'skin'). The app only says which theme and pieces.
-- Companions aren't listed: a theme's own companions come with its Collection, and no other companion can be added.
--
-- Refunds: the theme is recorded at the full price, so a reversed credits payment takes the theme back first
-- (credits_settle). The extra pieces are recorded at 0 credits with source 'bundle' and stay.

/* ---------- Concept map styles ---------- */
alter table public.studyboard_credit_item_prices drop constraint if exists studyboard_credit_item_prices_kind_check;
alter table public.studyboard_credit_item_prices add constraint studyboard_credit_item_prices_kind_check check (kind in ('skin', 'sticker', 'card', 'pin', 'note', 'cm'));
alter table public.studyboard_owned_items drop constraint if exists studyboard_owned_items_kind_check;
alter table public.studyboard_owned_items add constraint studyboard_owned_items_kind_check check (kind in ('skin', 'sticker', 'card', 'pin', 'note', 'cm'));
-- Only inserted when missing, so a price you change later in the SQL Editor is kept
insert into public.studyboard_credit_item_prices (kind, credits) values ('cm', 100) on conflict (kind) do nothing;

/* ---------- Build Your Look bundles ---------- */
create or replace function public.studyboard_buy_bundle(p_theme text, p_items jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare me uuid := auth.uid(); cost integer; b integer; on_ boolean; it jsonb; k text; i text; ref text;
begin
  if me is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then return jsonb_build_object('error', 'sign_in'); end if;
  select coalesce((value)::text = 'true', false) into on_ from public.studyboard_config where key = 'item_purchases';
  if not coalesce(on_, false) then return jsonb_build_object('error', 'off'); end if;
  if p_theme is null or p_theme !~ '^[A-Za-z0-9_-]{1,64}$' then return jsonb_build_object('error', 'bad_item'); end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 5 then return jsonb_build_object('error', 'bad_item'); end if;
  for it in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(it) <> 'array' then return jsonb_build_object('error', 'bad_item'); end if;
    k := it ->> 0; i := it ->> 1;
    if k is null or k not in ('card', 'pin', 'cm') or i is null or i !~ '^[A-Za-z0-9_-]{1,64}$' then return jsonb_build_object('error', 'bad_item'); end if;
  end loop;
  select credits into cost from public.studyboard_credit_item_prices where kind = 'skin';
  if cost is null then return jsonb_build_object('error', 'bad_item'); end if;
  if not public.studyboard_plan_rate_hit('buy-item:' || me::text, 60, 3600) then return jsonb_build_object('error', 'slow_down'); end if;
  -- One purchase at a time per account
  insert into public.studyboard_credit_balances (user_id, balance) values (me, 0) on conflict (user_id) do nothing;
  select balance into b from public.studyboard_credit_balances where user_id = me for update;
  -- A bundle is built around a theme the student doesn't have yet; with the theme already theirs, the app sells the pieces one by one
  if exists (select 1 from public.studyboard_owned_items o where o.user_id = me and o.kind = 'skin' and o.item_id = p_theme) then
    return jsonb_build_object('error', 'own_theme', 'balance', b);
  end if;
  if b < cost then return jsonb_build_object('error', 'not_enough', 'balance', b, 'cost', cost); end if;
  ref := 'bundle:' || me::text || ':' || p_theme || ':' || extract(epoch from clock_timestamp())::text;
  insert into public.studyboard_owned_items (user_id, kind, item_id, credits, source) values (me, 'skin', p_theme, cost, 'credits') on conflict do nothing;
  insert into public.studyboard_owned_items (user_id, kind, item_id, credits, source)
    select me, e.value ->> 0, e.value ->> 1, 0, 'bundle' from jsonb_array_elements(p_items) e
    on conflict do nothing;
  b := public.credits_move(me, -cost, 'bought look ' || p_theme, ref);
  return jsonb_build_object('ok', true, 'balance', b, 'cost', cost);
end $$;

revoke all on function public.studyboard_buy_bundle(text, jsonb) from public, anon;
grant execute on function public.studyboard_buy_bundle(text, jsonb) to authenticated;
