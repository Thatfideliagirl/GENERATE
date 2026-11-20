-- Generate: everything new since the first setup, plus making you the owner.
-- Paste all of this into Supabase, SQL Editor, New query, and press Run. Safe to run more than once.
-- Before running: create your account in Supabase, Authentication, Users, Add user (tick Auto Confirm).


-- The customers table, in case supabase/customers.sql has not been run yet.
create table if not exists public.customers (
  user_id     uuid not null references auth.users (id) on delete cascade,
  id          text not null,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, id)
);
alter table public.customers enable row level security;
drop policy if exists "customers own" on public.customers;
create policy "customers own" on public.customers
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke all on public.customers from anon;
grant select, insert, update, delete on public.customers to authenticated;

create or replace function public.admin_activity()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    return null;
  end if;
  return json_build_object(
    'documents',        (select count(*) from public.documents),
    'invoices',         (select count(*) from public.documents where type = 'invoice'),
    'receipts',         (select count(*) from public.documents where type = 'receipt'),
    'contracts',        (select count(*) from public.documents where type = 'contract'),
    'customers',        (select count(*) from public.customers),
    'active_week',      (select count(distinct user_id) from public.documents where updated_at > now() - interval '7 days'),
    'made_week',        (select count(*) from public.documents where created_at > now() - interval '7 days'),
    'with_documents',   (select count(distinct user_id) from public.documents)
  );
end;
$$;

revoke execute on function public.admin_activity() from public, anon;
grant execute on function public.admin_activity() to authenticated;

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

-- Make fideliajoseph111@gmail.com the owner of Generate.
insert into public.app_admins (user_id)
  select id from auth.users where lower(email) = 'fideliajoseph111@gmail.com'
  on conflict do nothing;
