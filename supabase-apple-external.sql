-- Studyboard: reporting website sales to Apple for the EU "External Purchases or Offers" link
-- (App Store, EU storefronts, terms in force from October 1, 2026). Run once in the Supabase SQL Editor after
-- supabase-plans.sql. Safe to run again.
--
-- The iPhone app sends Apple's reporting tokens for the signed-in account (supabase-functions/apple-external, POST /tokens).
-- A website subscription paid within 7 days of tapping the website option in the app is tied to one of that account's active
-- tokens; its first payment and every renewal become line items, which the daily report job sends to Apple. Tokens that
-- never led to a sale are reported too, once they expire, as Apple requires.
-- Only the service role reaches these tables (row-level security on, no policies).

create table if not exists public.studyboard_apple_tokens (
  external_purchase_id text primary key,
  -- kept, without the account, if the account is deleted: Apple still has to receive the report
  user_id uuid references auth.users (id) on delete set null,
  token_type text not null check (token_type in ('ACQUISITION', 'SERVICES', 'IN_APP', 'LINK_OUT', 'CORE_TECHNOLOGY')),
  created_at timestamptz not null,
  expires_at timestamptz,
  received_at timestamptz not null default now(),
  -- what was reported to Apple about the token itself: null (not yet), NO_LINE_ITEM, DUPLICATE_TOKEN, or LINE_ITEM (has sales)
  report_status text check (report_status in ('LINE_ITEM', 'NO_LINE_ITEM', 'DUPLICATE_TOKEN', 'UNRECOGNIZED_TOKEN')),
  reported_at timestamptz,
  report_request_id uuid
);
create index if not exists studyboard_apple_tokens_user on public.studyboard_apple_tokens (user_id, created_at desc);

-- The last time each account tapped the website option in the app (Apple's commission covers sales within 7 days of a tap)
create table if not exists public.studyboard_apple_taps (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_tap_at timestamptz not null,
  storefront text
);

-- A website subscription tied to a token (its renewals are reported against the same token)
create table if not exists public.studyboard_apple_subscriptions (
  stripe_subscription_id text primary key,
  external_purchase_id text not null references public.studyboard_apple_tokens (external_purchase_id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  first_line_item_id text not null,
  tax_country text not null,
  created_at timestamptz not null default now()
);

-- Each payment to report (Apple's SubscriptionBuyLineItem, ready to send)
create table if not exists public.studyboard_apple_line_items (
  line_item_id text primary key,
  external_purchase_id text not null references public.studyboard_apple_tokens (external_purchase_id) on delete cascade,
  payload jsonb not null,
  request_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  last_error text
);
create index if not exists studyboard_apple_line_items_pending on public.studyboard_apple_line_items (created_at) where sent_at is null;

alter table public.studyboard_apple_tokens alter column user_id drop not null;
alter table public.studyboard_apple_subscriptions alter column user_id drop not null;
alter table public.studyboard_apple_tokens enable row level security;
alter table public.studyboard_apple_taps enable row level security;
alter table public.studyboard_apple_subscriptions enable row level security;
alter table public.studyboard_apple_line_items enable row level security;
revoke all on public.studyboard_apple_tokens, public.studyboard_apple_taps, public.studyboard_apple_subscriptions, public.studyboard_apple_line_items from anon, authenticated;

-- Tokens from the app (already decoded and checked by the function). A token is never moved to another account.
create or replace function public.studyboard_apple_add_tokens(p_uid uuid, p_tokens jsonb, p_tap boolean, p_storefront text)
returns integer language plpgsql security definer set search_path = public as $$
declare t jsonb; n integer := 0;
begin
  for t in select * from jsonb_array_elements(coalesce(p_tokens, '[]'::jsonb)) loop
    insert into studyboard_apple_tokens (external_purchase_id, user_id, token_type, created_at, expires_at)
    values (t->>'id', p_uid, t->>'type', to_timestamp((t->>'created')::bigint / 1000.0),
            case when t ? 'expires' then to_timestamp((t->>'expires')::bigint / 1000.0) end)
    on conflict (external_purchase_id) do nothing;
    n := n + 1;
  end loop;
  if p_tap then
    insert into studyboard_apple_taps (user_id, last_tap_at, storefront) values (p_uid, now(), nullif(left(p_storefront, 3), ''))
    on conflict (user_id) do update set last_tap_at = excluded.last_tap_at, storefront = coalesce(excluded.storefront, studyboard_apple_taps.storefront);
  end if;
  return n;
end $$;
revoke all on function public.studyboard_apple_add_tokens(uuid, jsonb, boolean, text) from public, anon, authenticated;

-- A paid website invoice (from billing-webhook). Queues an Apple line item when the subscription is tied to a token, or when
-- this is its first payment and the account tapped the website option in the app within the 7 days before it. Returns the
-- line item id, or null when there's nothing to report. Repeats of the same invoice do nothing.
create or replace function public.studyboard_apple_queue_invoice(p jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid; v_sub text := p->>'subscription'; v_inv text := p->>'invoice';
  v_paid timestamptz := to_timestamp((p->>'paid_at')::bigint / 1000.0);
  v_link studyboard_apple_subscriptions%rowtype; v_epid text; v_tax text; v_event text; v_first text;
begin
  if v_sub is null or v_inv is null then return null; end if;
  if exists (select 1 from studyboard_apple_line_items where line_item_id = v_inv) then return null; end if;
  select user_id into v_uid from studyboard_billing_customers where stripe_customer_id = p->>'customer';
  if v_uid is null then return null; end if;

  select * into v_link from studyboard_apple_subscriptions where stripe_subscription_id = v_sub;
  if found then
    v_epid := v_link.external_purchase_id; v_tax := v_link.tax_country; v_event := 'RENEWAL'; v_first := v_link.first_line_item_id;
  else
    if coalesce(p->>'reason', '') <> 'subscription_create' then return null; end if;
    if not exists (select 1 from studyboard_apple_taps where user_id = v_uid and last_tap_at <= v_paid and last_tap_at > v_paid - interval '7 days') then return null; end if;
    -- one token only: the acquisition one if it's active then, else the services one
    select external_purchase_id into v_epid from studyboard_apple_tokens
      where user_id = v_uid and token_type in ('ACQUISITION', 'SERVICES', 'LINK_OUT') and created_at <= v_paid and (expires_at is null or expires_at > v_paid)
      order by (token_type = 'ACQUISITION') desc, created_at desc limit 1;
    if v_epid is null then return null; end if;
    v_tax := coalesce(nullif(p->>'tax_country', ''), (select storefront from studyboard_apple_taps where user_id = v_uid));
    if v_tax is null then return null; end if;
    v_event := 'SUBSCRIPTION_START'; v_first := v_inv;
    insert into studyboard_apple_subscriptions (stripe_subscription_id, external_purchase_id, user_id, first_line_item_id, tax_country)
      values (v_sub, v_epid, v_uid, v_inv, v_tax) on conflict do nothing;
  end if;

  insert into studyboard_apple_line_items (line_item_id, external_purchase_id, payload)
  values (v_inv, v_epid, jsonb_strip_nulls(jsonb_build_object(
    'lineItemId', v_inv,
    'referenceLineItemId', case when v_event = 'RENEWAL' then v_first end,
    'creationDate', (p->>'paid_at')::bigint,
    'subscriptionEvent', v_event,
    'subscriptionStartDate', (p->>'period_start')::bigint,
    'subscriptionEndDate', (p->>'period_end')::bigint,
    'subscriptionDaysOfPaidService', greatest(1, round(((p->>'period_end')::bigint - (p->>'period_start')::bigint) / 86400000.0)::int),
    'pricingCurrency', upper(p->>'currency'),
    'reportingCurrency', upper(p->>'currency'),
    'amountTaxExclusive', (p->>'amount_ex')::bigint,
    'amountTaxInclusive', (p->>'amount_in')::bigint,
    'netAmountTaxExclusive', (p->>'amount_ex')::bigint,
    'taxAmount', (p->>'tax')::bigint,
    'taxCountry', v_tax,
    'productIdentifier', 'studyboard_pro_' || coalesce(nullif(p->>'plan', ''), 'monthly'),
    'quantity', 1,
    'eventType', 'BUY',
    'productType', 'SUBSCRIPTION'
  )))
  on conflict (line_item_id) do nothing;
  update studyboard_apple_tokens set report_status = 'LINE_ITEM' where external_purchase_id = v_epid and report_status is null;
  return v_inv;
end $$;
revoke all on function public.studyboard_apple_queue_invoice(jsonb) from public, anon, authenticated;
