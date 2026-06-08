-- Phase 1: Relationship Pipeline
-- Converts the sales "deals" pipeline into a relationship-based pipeline for OROS.
-- Run this once in the Supabase SQL editor (or `supabase db push`).

begin;

-- 1. Rename the deals table -> relationships.
-- RENAME preserves the table's OID, indexes, foreign keys (e.g. activities.deal_id)
-- and RLS policies, so no other tables or policies need to change.
alter table deals rename to relationships;

-- 2. Add the new relationship-tracking fields.
alter table relationships
  add column if not exists relationship_score smallint
    check (relationship_score is null or relationship_score between 1 and 5),
  add column if not exists contact_type text
    check (contact_type is null or contact_type in (
      'Trader', 'Corporate Buyer', 'Registry', 'Government',
      'Media', 'Project Developer', 'Exchange'
    )),
  add column if not exists last_contact_date date,
  add column if not exists next_contact_date date,
  add column if not exists next_action_type text
    check (next_action_type is null or next_action_type in ('Email', 'WhatsApp', 'Call', 'Meeting')),
  add column if not exists stage_color text,
  -- Flexible bag for the stage-specific fields that vary by pipeline stage
  -- (volume, geography, product, timing, interest, vintage, price, supplier,
  -- trade_value, buyer, recurring, refresh_interval_days, ...).
  add column if not exists details jsonb not null default '{}'::jsonb;

-- 3. Replace the old sales-stage check constraint (if any) with the new pipeline stages.
do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'relationships'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%stage%'
  loop
    execute format('alter table relationships drop constraint %I', con.conname);
  end loop;
end $$;

alter table relationships
  add constraint relationships_stage_check
  check (stage in ('relationship', 'discovery', 'structuring', 'execution', 'refresh'));

-- 4. Remap existing rows from the old sales stages to the new relationship stages.
update relationships set stage = case stage
  when 'prospect'    then 'relationship'
  when 'qualified'   then 'discovery'
  when 'proposal'    then 'structuring'
  when 'closed_won'  then 'execution'
  when 'closed_lost' then 'refresh'
  else stage
end;

-- 5. Backfill stage_color for existing rows.
update relationships set stage_color = case stage
  when 'relationship' then 'blue'
  when 'discovery'    then 'yellow'
  when 'structuring'  then 'purple'
  when 'execution'    then 'gold'
  when 'refresh'      then 'grey'
  else stage_color
end;

-- 6. Keep stage_color in sync with stage automatically going forward.
create or replace function relationships_set_stage_color()
returns trigger as $$
begin
  new.stage_color := case new.stage
    when 'relationship' then 'blue'
    when 'discovery'    then 'yellow'
    when 'structuring'  then 'purple'
    when 'execution'    then 'gold'
    when 'refresh'      then 'grey'
    else new.stage_color
  end;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_relationships_stage_color on relationships;
create trigger trg_relationships_stage_color
  before insert or update of stage on relationships
  for each row execute function relationships_set_stage_color();

commit;
