-- Customers list for Generate. Run this once in Supabase: SQL Editor, New query, paste, Run.
-- Safe to run more than once. Each person only ever sees their own customers; the owner sees none.

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
