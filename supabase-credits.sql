-- Studyboard Credits: buy credits on the website (Stripe), spend them to keep shop items for good.
-- Safe to run again. Run after supabase-plans.sql. Then run supabase-credits-selftest.sql (it must end with
-- "CREDITS SELF-TEST PASSED"). See CREDITS-GUIDE.md.
--
-- The server decides everything that costs money:
--   * how many credits a pack gives and which Stripe price sells it (studyboard_credit_packs)
--   * what each kind of item costs (studyboard_credit_item_prices)
--   * the balance (studyboard_credit_balances), changed only by the functions below, every change logged in
--     studyboard_credit_ledger with a unique ref so a repeated webhook or a double tap can't count twice
-- People can only READ their own balance, ledger and items. Spending goes through studyboard_buy_item().

/* ---------- Catalog ---------- */
create table if not exists public.studyboard_credit_packs (
  pack_id text primary key check (pack_id ~ '^[a-z0-9_]{1,40}$'),
  credits integer not null check (credits > 0 and credits <= 100000),
  price_cents integer not null check (price_cents > 0),
  currency text not null default 'usd',
  stripe_price_id text unique check (stripe_price_id is null or stripe_price_id ~ '^price_[A-Za-z0-9]+$'),
  label text,
  badge text,
  sort integer not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
create table if not exists public.studyboard_credit_item_prices (
  kind text primary key check (kind in ('skin', 'sticker', 'card', 'pin')),
  credits integer not null check (credits > 0 and credits <= 100000),
  updated_at timestamptz not null default now()
);

-- Prices: a Theme Collection 300 ($3), a sticker pack 100 ($1), a flashcard style 100 ($1), a pin 50 ($0.50).
-- Only inserted when missing, so changes you make later in the SQL Editor are kept.
insert into public.studyboard_credit_item_prices (kind, credits) values ('skin', 300), ('sticker', 100), ('card', 100), ('pin', 50)
on conflict (kind) do nothing;
-- Live Stripe prices (product "Studyboard Credits", prod_VdRSF2ExXrjwfx)
insert into public.studyboard_credit_packs (pack_id, credits, price_cents, stripe_price_id, label, badge, sort) values
  ('credits_100', 100, 99, 'price_1UcAZKFT8I9EapuBLOohFJvw', '100 Credits', null, 1),
  ('credits_300', 300, 299, 'price_1UcAZNFT8I9EapuBiN4qzG5b', '300 Credits', null, 2),
  ('credits_600', 600, 499, 'price_1UcAZPFT8I9EapuBOW9petbt', '600 Credits', '20% Bonus', 3),
  ('credits_1300', 1300, 999, 'price_1UcAZRFT8I9EapuBSieDVJKC', '1,300 Credits', 'Best Value', 4)
on conflict (pack_id) do nothing;

/* ---------- Per account ---------- */
create table if not exists public.studyboard_credit_balances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.studyboard_credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null,
  balance_after integer not null,
  reason text not null,
  ref text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists studyboard_credit_ledger_user on public.studyboard_credit_ledger (user_id, created_at desc);
create table if not exists public.studyboard_owned_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('skin', 'sticker', 'card', 'pin')),
  item_id text not null check (item_id ~ '^[A-Za-z0-9_-]{1,64}$'),
  credits integer not null default 0,
  source text not null default 'credits',
  created_at timestamptz not null default now(),
  primary key (user_id, kind, item_id)
);
-- One row per paid Stripe Checkout, so a refund or dispute finds the credits it gave
create table if not exists public.studyboard_credit_orders (
  checkout_session text primary key,
  user_id uuid references auth.users(id) on delete set null,
  pack_id text not null,
  credits integer not null,
  payment_intent text unique,
  amount_cents integer,
  currency text,
  status text not null default 'paid' check (status in ('paid', 'reversed')),
  created_at timestamptz not null default now(),
  reversed_at timestamptz
);

alter table public.studyboard_credit_packs enable row level security;
alter table public.studyboard_credit_item_prices enable row level security;
alter table public.studyboard_credit_balances enable row level security;
alter table public.studyboard_credit_ledger enable row level security;
alter table public.studyboard_owned_items enable row level security;
alter table public.studyboard_credit_orders enable row level security;

drop policy if exists "credit packs read" on public.studyboard_credit_packs;
create policy "credit packs read" on public.studyboard_credit_packs for select to anon, authenticated using (active);
drop policy if exists "credit prices read" on public.studyboard_credit_item_prices;
create policy "credit prices read" on public.studyboard_credit_item_prices for select to anon, authenticated using (true);
drop policy if exists "credit balance own" on public.studyboard_credit_balances;
create policy "credit balance own" on public.studyboard_credit_balances for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "credit ledger own" on public.studyboard_credit_ledger;
create policy "credit ledger own" on public.studyboard_credit_ledger for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "owned items own" on public.studyboard_owned_items;
create policy "owned items own" on public.studyboard_owned_items for select to authenticated using (user_id = (select auth.uid()));
-- Orders: no policy, so only the service role and the SQL Editor see them

-- Read only for everyone signed in; every write goes through the functions below
revoke all on public.studyboard_credit_packs, public.studyboard_credit_item_prices, public.studyboard_credit_balances,
  public.studyboard_credit_ledger, public.studyboard_owned_items, public.studyboard_credit_orders from public, anon, authenticated;
grant select on public.studyboard_credit_packs, public.studyboard_credit_item_prices to anon, authenticated;
grant select on public.studyboard_credit_balances, public.studyboard_credit_ledger, public.studyboard_owned_items to authenticated;

-- The switch: buying items and credits is off until you turn it on (see CREDITS-GUIDE.md, Launch)
insert into public.studyboard_config (key, value) values ('item_purchases', 'false') on conflict (key) do nothing;

/* ---------- Internal helpers (never callable by people) ---------- */
-- Refuses signed-in people and the public key; the SQL Editor and the service role pass
create or replace function public.credits_owner_only() returns void
language plpgsql stable set search_path = '' as $$
declare c text := nullif(current_setting('request.jwt.claims', true), '');
begin
  if c is not null and coalesce((c::jsonb) ->> 'role', '') not in ('service_role', 'supabase_admin') then
    raise exception 'not allowed' using errcode = '42501';
  end if;
end $$;

-- Adds delta to a balance and logs it once per ref. Returns the new balance, or null if this ref was already applied.
create or replace function public.credits_move(p_uid uuid, p_delta integer, p_reason text, p_ref text) returns integer
language plpgsql volatile security definer set search_path = '' as $$
declare b integer;
begin
  if exists (select 1 from public.studyboard_credit_ledger l where l.ref = p_ref) then return null; end if;
  insert into public.studyboard_credit_balances as cb (user_id, balance, updated_at) values (p_uid, p_delta, now())
  on conflict (user_id) do update set balance = cb.balance + p_delta, updated_at = now()
  returning balance into b;
  insert into public.studyboard_credit_ledger (user_id, delta, balance_after, reason, ref) values (p_uid, p_delta, b, left(p_reason, 200), left(p_ref, 300));
  return b;
end $$;

-- After credits are taken back (a refund or dispute) and the balance is below zero, the newest items bought with
-- credits are returned, newest first, until the balance is zero or more. Items you gave as gifts are never touched.
create or replace function public.credits_settle(p_uid uuid, p_ref text) returns integer
language plpgsql volatile security definer set search_path = '' as $$
declare b integer; it record; n integer := 0;
begin
  select balance into b from public.studyboard_credit_balances where user_id = p_uid for update;
  if b is null or b >= 0 then return 0; end if;
  for it in select * from public.studyboard_owned_items o where o.user_id = p_uid and o.source = 'credits' and o.credits > 0 order by o.created_at desc, o.item_id loop
    exit when b >= 0;
    delete from public.studyboard_owned_items o where o.user_id = it.user_id and o.kind = it.kind and o.item_id = it.item_id;
    b := coalesce(public.credits_move(p_uid, it.credits, 'returned ' || it.kind || ':' || it.item_id, p_ref || ':return:' || it.kind || ':' || it.item_id), b + it.credits);
    n := n + 1;
  end loop;
  return n;
end $$;

/* ---------- For the app ---------- */
-- Everything the app needs in one call: on/off, balance, items, packs and prices
create or replace function public.studyboard_credits_me() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare me uuid := auth.uid(); on_ boolean;
begin
  select coalesce((value)::text = 'true', false) into on_ from public.studyboard_config where key = 'item_purchases';
  return jsonb_build_object(
    'on', coalesce(on_, false),
    'balance', coalesce((select balance from public.studyboard_credit_balances where user_id = me), 0),
    'owned', coalesce((select jsonb_agg(jsonb_build_array(o.kind, o.item_id) order by o.created_at) from public.studyboard_owned_items o where o.user_id = me), '[]'::jsonb),
    'prices', coalesce((select jsonb_object_agg(p.kind, p.credits) from public.studyboard_credit_item_prices p), '{}'::jsonb),
    'packs', coalesce((select jsonb_agg(jsonb_build_object('id', k.pack_id, 'credits', k.credits, 'cents', k.price_cents, 'currency', k.currency, 'label', k.label, 'badge', k.badge) order by k.sort, k.credits)
      from public.studyboard_credit_packs k where k.active and k.stripe_price_id is not null), '[]'::jsonb)
  );
end $$;

-- Spend credits on one item. The price comes from the server; the app only says which item.
create or replace function public.studyboard_buy_item(p_kind text, p_item text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare me uuid := auth.uid(); cost integer; b integer; on_ boolean;
begin
  if me is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then return jsonb_build_object('error', 'sign_in'); end if;
  select coalesce((value)::text = 'true', false) into on_ from public.studyboard_config where key = 'item_purchases';
  if not coalesce(on_, false) then return jsonb_build_object('error', 'off'); end if;
  if p_kind is null or p_item is null or p_item !~ '^[A-Za-z0-9_-]{1,64}$' then return jsonb_build_object('error', 'bad_item'); end if;
  select credits into cost from public.studyboard_credit_item_prices where kind = p_kind;
  if cost is null then return jsonb_build_object('error', 'bad_item'); end if;
  if not public.studyboard_plan_rate_hit('buy-item:' || me::text, 60, 3600) then return jsonb_build_object('error', 'slow_down'); end if;
  -- One purchase at a time per account
  insert into public.studyboard_credit_balances (user_id, balance) values (me, 0) on conflict (user_id) do nothing;
  select balance into b from public.studyboard_credit_balances where user_id = me for update;
  if exists (select 1 from public.studyboard_owned_items o where o.user_id = me and o.kind = p_kind and o.item_id = p_item) then
    return jsonb_build_object('ok', true, 'already', true, 'balance', b);
  end if;
  if b < cost then return jsonb_build_object('error', 'not_enough', 'balance', b, 'cost', cost); end if;
  insert into public.studyboard_owned_items (user_id, kind, item_id, credits, source) values (me, p_kind, p_item, cost, 'credits');
  b := public.credits_move(me, -cost, 'bought ' || p_kind || ':' || p_item, 'buy:' || me::text || ':' || p_kind || ':' || p_item || ':' || extract(epoch from clock_timestamp())::text);
  return jsonb_build_object('ok', true, 'balance', b, 'cost', cost);
end $$;

/* ---------- For billing-webhook (service role only) ---------- */
-- A paid credits checkout. p: {session, uid, pack, payment_intent, amount, currency, price}
create or replace function public.studyboard_credits_order(p jsonb) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare k record; uid uuid; sess text := p ->> 'session';
begin
  perform public.credits_owner_only();
  if sess is null or sess !~ '^cs_[A-Za-z0-9_]+$' then return 'bad session'; end if;
  if exists (select 1 from public.studyboard_credit_orders o where o.checkout_session = sess) then return 'duplicate'; end if;
  begin uid := (p ->> 'uid')::uuid; exception when others then return 'bad uid'; end;
  if uid is null or not exists (select 1 from auth.users u where u.id = uid) then return 'no such user'; end if;
  select * into k from public.studyboard_credit_packs c where c.pack_id = p ->> 'pack';
  if not found then return 'unknown pack'; end if;
  -- The price paid must be this pack's Stripe price (the metadata alone is never trusted for the amount)
  if k.stripe_price_id is null or k.stripe_price_id is distinct from (p ->> 'price') then return 'price mismatch'; end if;
  insert into public.studyboard_credit_orders (checkout_session, user_id, pack_id, credits, payment_intent, amount_cents, currency)
  values (sess, uid, k.pack_id, k.credits, nullif(p ->> 'payment_intent', ''), nullif(p ->> 'amount', '')::integer, nullif(p ->> 'currency', ''));
  perform public.credits_move(uid, k.credits, 'bought ' || k.pack_id, 'order:' || sess);
  return 'granted';
end $$;

-- A refund or a dispute on a credits payment takes the credits back (and, if they were spent, the newest items).
-- Returns 'not_credits' when the payment wasn't a credits order, so the webhook treats it as a Pro payment instead.
create or replace function public.studyboard_credits_reverse(p_payment_intent text, p_ref text) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare o record; n integer;
begin
  perform public.credits_owner_only();
  select * into o from public.studyboard_credit_orders where payment_intent = p_payment_intent for update;
  if not found then return 'not_credits'; end if;
  if o.status = 'reversed' then return 'already reversed'; end if;
  update public.studyboard_credit_orders set status = 'reversed', reversed_at = now() where checkout_session = o.checkout_session;
  if o.user_id is null then return 'reversed (account deleted)'; end if;
  perform public.credits_move(o.user_id, -o.credits, 'taken back ' || o.pack_id, 'reverse:' || o.checkout_session || ':' || left(p_ref, 120));
  n := public.credits_settle(o.user_id, 'reverse:' || o.checkout_session);
  return 'reversed' || case when n > 0 then ', ' || n || ' item(s) returned' else '' end;
end $$;

-- A dispute decided in your favour gives the credits back (not the returned items: those can be bought again)
create or replace function public.studyboard_credits_restore(p_payment_intent text, p_ref text) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare o record;
begin
  perform public.credits_owner_only();
  select * into o from public.studyboard_credit_orders where payment_intent = p_payment_intent for update;
  if not found then return 'not_credits'; end if;
  if o.status <> 'reversed' then return 'not reversed'; end if;
  update public.studyboard_credit_orders set status = 'paid', reversed_at = null where checkout_session = o.checkout_session;
  if o.user_id is null then return 'restored (account deleted)'; end if;
  perform public.credits_move(o.user_id, o.credits, 'given back ' || o.pack_id, 'restore:' || o.checkout_session || ':' || left(p_ref, 120));
  return 'restored';
end $$;

/* ---------- For you (SQL Editor only) ---------- */
-- select public.studyboard_grant_credits('friend@example.com', 300, 'contest prize');   (a negative amount takes credits away)
create or replace function public.studyboard_grant_credits(p_email text, p_amount integer, p_note text default null) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid; b integer;
begin
  perform public.credits_owner_only();
  if p_amount is null or p_amount = 0 or abs(p_amount) > 100000 then return 'Give an amount between -100000 and 100000 (not 0)'; end if;
  select u.id into uid from auth.users u where lower(u.email) = lower(trim(p_email));
  if not found then return 'No account has that email'; end if;
  b := public.credits_move(uid, p_amount, 'gift: ' || coalesce(left(p_note, 150), ''), 'gift:' || uid::text || ':' || extract(epoch from clock_timestamp())::text);
  return trim(p_email) || ' now has ' || b || ' credits';
end $$;
-- select public.studyboard_give_item('friend@example.com', 'skin', 'japan');   (free, logged as a gift, never returned by a refund)
create or replace function public.studyboard_give_item(p_email text, p_kind text, p_item text) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid;
begin
  perform public.credits_owner_only();
  select u.id into uid from auth.users u where lower(u.email) = lower(trim(p_email));
  if not found then return 'No account has that email'; end if;
  insert into public.studyboard_owned_items (user_id, kind, item_id, credits, source) values (uid, p_kind, p_item, 0, 'gift') on conflict do nothing;
  return trim(p_email) || ' now owns ' || p_kind || ':' || p_item;
end $$;

-- Who can run what
revoke all on function public.credits_owner_only() from public, anon, authenticated;
revoke all on function public.credits_move(uuid, integer, text, text) from public, anon, authenticated;
revoke all on function public.credits_settle(uuid, text) from public, anon, authenticated;
revoke all on function public.studyboard_credits_order(jsonb) from public, anon, authenticated;
revoke all on function public.studyboard_credits_reverse(text, text) from public, anon, authenticated;
revoke all on function public.studyboard_credits_restore(text, text) from public, anon, authenticated;
revoke all on function public.studyboard_grant_credits(text, integer, text) from public, anon, authenticated;
revoke all on function public.studyboard_give_item(text, text, text) from public, anon, authenticated;
revoke all on function public.studyboard_credits_me() from public, anon;
revoke all on function public.studyboard_buy_item(text, text) from public, anon;
grant execute on function public.studyboard_credits_me() to authenticated;
grant execute on function public.studyboard_buy_item(text, text) to authenticated;
grant execute on function public.credits_owner_only(), public.credits_move(uuid, integer, text, text), public.credits_settle(uuid, text),
  public.studyboard_credits_order(jsonb), public.studyboard_credits_reverse(text, text), public.studyboard_credits_restore(text, text) to service_role;
