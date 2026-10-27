-- Generate: database set up for Supabase.
-- Run this whole file once in the Supabase SQL Editor (SQL Editor, New query, paste, Run).
-- It is safe to run again: it only creates what is missing.
--
-- What it builds
--   profiles           who signed up (name, business, type, trade, email, date). The owner can read this.
--   business_settings  each person's private business details: logo, signature, bank details, look. Only that person.
--   documents          each person's invoices, receipts and contracts. Only that person.
--   saved_templates    contract templates a person saved. Only that person.
--   app_admins         the owner accounts. Nobody can read or change this from the app.
--
-- The privacy promise, in one line: the owner can read profiles and nothing else.

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  full_name      text not null default '',
  business_name  text not null default '',
  business_type  text not null default '',
  trade          text not null default '',
  email          text not null default '',
  created_at     timestamptz not null default now()
);

create table if not exists public.business_settings (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  -- The whole business profile the app uses: details, logo, signature, bank, tax, look, social links.
  data        jsonb not null default '{}'::jsonb,
  -- Last number used for each kind of document, for example {"invoice": 12, "receipt": 3, "contract": 1}.
  seq         jsonb not null default '{"invoice":0,"receipt":0,"contract":0}'::jsonb,
  updated_at  timestamptz not null default now()
);

create table if not exists public.documents (
  user_id     uuid not null references auth.users (id) on delete cascade,
  id          text not null,
  type        text not null check (type in ('invoice', 'receipt', 'contract')),
  number      text not null default '',
  status      text not null default 'draft',
  -- The whole document as the app saves it.
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.saved_templates (
  user_id     uuid not null references auth.users (id) on delete cascade,
  id          text not null,
  title       text not null,
  body        text not null default '',
  created_at  timestamptz not null default now(),
  primary key (user_id, id)
);

-- The owner accounts. Add yourself with the statement at the bottom of this file, after you have signed up.
create table if not exists public.app_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create index if not exists documents_user_updated_idx on public.documents (user_id, updated_at desc);
create index if not exists documents_user_type_idx    on public.documents (user_id, type);
create index if not exists profiles_created_idx       on public.profiles (created_at desc);

-- ---------------------------------------------------------------------------
-- 2. Helpers
-- ---------------------------------------------------------------------------

-- True when the person signed in is an owner. It runs with extra rights so app_admins can stay locked.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.app_admins where user_id = (select auth.uid()));
$$;

-- Keeps updated_at honest.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists documents_touch on public.documents;
create trigger documents_touch before update on public.documents
  for each row execute function public.touch_updated_at();

drop trigger if exists business_settings_touch on public.business_settings;
create trigger business_settings_touch before update on public.business_settings
  for each row execute function public.touch_updated_at();

-- When someone signs up, make their row in profiles. The app sends these fields with the sign up:
-- full_name, business_name, business_type, trade.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, business_name, business_type, trade, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'business_name', ''),
    coalesce(new.raw_user_meta_data ->> 'business_type', ''),
    coalesce(new.raw_user_meta_data ->> 'trade', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. Row level security: who can see what
-- ---------------------------------------------------------------------------

alter table public.profiles          enable row level security;
alter table public.business_settings enable row level security;
alter table public.documents         enable row level security;
alter table public.saved_templates   enable row level security;
alter table public.app_admins        enable row level security;
-- app_admins has no policy on purpose. Only the SQL Editor can change it.

-- profiles: you see your own row. The owner sees every row. Nobody else does.
drop policy if exists "profiles read own or owner" on public.profiles;
create policy "profiles read own or owner" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- business_settings, documents, saved_templates: only the person they belong to. The owner has no policy here, so the owner sees nothing.
drop policy if exists "settings own" on public.business_settings;
create policy "settings own" on public.business_settings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "documents own" on public.documents;
create policy "documents own" on public.documents
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "templates own" on public.saved_templates;
create policy "templates own" on public.saved_templates
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 4. Rights for the two kinds of visitor
-- ---------------------------------------------------------------------------

-- Visitors who are not signed in get nothing.
revoke all on public.profiles, public.business_settings, public.documents, public.saved_templates, public.app_admins from anon;
-- Signed in people use only the tables they need. app_admins is closed to them.
revoke all on public.app_admins from authenticated;
grant select, update on public.profiles          to authenticated;
grant select, insert, update, delete on public.business_settings to authenticated;
grant select, insert, update, delete on public.documents         to authenticated;
grant select, insert, update, delete on public.saved_templates   to authenticated;
-- Nobody can call is_admin or the sign up trigger function directly from outside, except is_admin for signed in people.
revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Make yourself the owner. Do this AFTER you have signed up on the site once.
--    Change the email to yours, select the line and run it on its own.
-- ---------------------------------------------------------------------------
-- insert into public.app_admins (user_id)
--   select id from auth.users where email = 'adewoyeemmanuel77@gmail.com'
--   on conflict do nothing;
