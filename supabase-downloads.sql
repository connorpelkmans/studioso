-- Public bucket for the desktop installers the website links to (Windows .exe, Mac .dmg).
-- Run once in Supabase > SQL Editor. Anyone can download from a public bucket; only the service role (the GitHub workflow) can upload.
insert into storage.buckets (id, name, public, file_size_limit)
values ('downloads', 'downloads', true, 524288000)
on conflict (id) do update set public = true, file_size_limit = 524288000;
-- No storage.objects policies are added on purpose: with none, the anon and authenticated roles cannot write or list.
