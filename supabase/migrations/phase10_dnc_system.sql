-- Phase 10: DNC system + Originator contact type
-- Run once in Supabase SQL Editor. Safe to re-run.

begin;

-- Add DNC reason/date to contacts (do_not_contact boolean already exists from phase6c)
alter table contacts
  add column if not exists do_not_contact_reason  varchar,
  add column if not exists do_not_contact_date    timestamptz;

-- Drop old product/market constraints on relationships (new tier products don't match)
alter table relationships
  drop constraint if exists relationships_products_interested_check,
  drop constraint if exists relationships_preferred_markets_check;

-- Custom DNC reasons per team
create table if not exists do_not_contact_reasons (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references teams(id) on delete cascade,
  reason     varchar not null,
  is_custom  boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique (team_id, reason)
);

alter table do_not_contact_reasons enable row level security;

drop policy if exists "view team dnc reasons"   on do_not_contact_reasons;
drop policy if exists "create team dnc reasons" on do_not_contact_reasons;
drop policy if exists "delete own dnc reasons"  on do_not_contact_reasons;

create policy "view team dnc reasons"
  on do_not_contact_reasons for select
  using (team_id in (select team_id from profiles where id = auth.uid()));

create policy "create team dnc reasons"
  on do_not_contact_reasons for insert
  with check (team_id in (select team_id from profiles where id = auth.uid()));

create policy "delete own dnc reasons"
  on do_not_contact_reasons for delete
  using (team_id in (select team_id from profiles where id = auth.uid()));

commit;
