-- Studyboard: Sign in with Apple's refresh tokens, so deleting an account can revoke it with Apple (App Store Review
-- Guideline 5.1.1(v)). Kept by supabase-functions/delete-account (POST /apple-token) after an Apple sign-in in the iPhone app,
-- and used and removed when the account is deleted. Run once in the Supabase SQL Editor; safe to run again.
-- Only the service role reaches it (row-level security on, no policies).
create table if not exists public.studyboard_apple_signin (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token text not null,
  client_id text not null,
  updated_at timestamptz not null default now()
);
alter table public.studyboard_apple_signin enable row level security;
revoke all on public.studyboard_apple_signin from anon, authenticated;
