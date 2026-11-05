-- Owner dashboard numbers for Generate. Run once in Supabase: SQL Editor, New query, paste, Run. Safe to run again.
-- It only ever returns COUNTS. It never returns anyone's documents, customers, names or amounts.
-- Only an owner (someone in app_admins) gets numbers back; everyone else gets nothing.

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
