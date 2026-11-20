-- Emails from free signing on the Generate website. Run once in Supabase: SQL Editor, New query, paste, Run. Safe to run again.
-- Visitors (signed in or not) can only ADD an email. Only the owner (app_admins) can read the list. Nobody can change or delete through the app.

create table if not exists public.sign_leads (
  id          bigint generated always as identity primary key,
  email       text not null check (char_length(email) between 3 and 200 and position('@' in email) > 1),
  source      text not null default 'free_sign' check (char_length(source) <= 40),
  created_at  timestamptz not null default now()
);

alter table public.sign_leads enable row level security;

drop policy if exists "anyone can leave an email" on public.sign_leads;
create policy "anyone can leave an email" on public.sign_leads
  for insert to anon, authenticated
  with check (true);

drop policy if exists "owner reads emails" on public.sign_leads;
create policy "owner reads emails" on public.sign_leads
  for select to authenticated
  using (public.is_admin());

revoke all on public.sign_leads from anon, authenticated;
grant insert (email, source) on public.sign_leads to anon, authenticated;
grant select on public.sign_leads to authenticated;
