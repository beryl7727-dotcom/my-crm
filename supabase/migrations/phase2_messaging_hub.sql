-- Phase 2: Messaging Hub with Templates
-- Adds a team-scoped template library and links sent messages back to
-- the activity timeline via message_channel / template_id on activities.
-- Run this once in the Supabase SQL editor (or `supabase db push`).

begin;

-- 1. Template library, scoped per team like every other CRM table.
create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  category text not null check (category in ('First Contact', 'Follow-Up', 'Reactivation')),
  body text not null default '',
  variables_used text[] not null default '{}',
  is_favorite boolean not null default false,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists templates_team_id_idx on templates (team_id);
create index if not exists templates_category_idx on templates (team_id, category);

alter table templates enable row level security;

drop policy if exists "Team members can view templates" on templates;
create policy "Team members can view templates"
  on templates for select
  using (team_id in (select team_id from profiles where id = auth.uid()));

drop policy if exists "Team members can create templates" on templates;
create policy "Team members can create templates"
  on templates for insert
  with check (team_id in (select team_id from profiles where id = auth.uid()));

drop policy if exists "Team members can update templates" on templates;
create policy "Team members can update templates"
  on templates for update
  using (team_id in (select team_id from profiles where id = auth.uid()))
  with check (team_id in (select team_id from profiles where id = auth.uid()));

drop policy if exists "Team members can delete templates" on templates;
create policy "Team members can delete templates"
  on templates for delete
  using (team_id in (select team_id from profiles where id = auth.uid()));

-- Keep updated_at current on every edit.
create or replace function templates_set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_templates_updated_at on templates;
create trigger trg_templates_updated_at
  before update on templates
  for each row execute function templates_set_updated_at();

-- 2. Let activities record which channel a message went out on and which
-- template (if any) was used, so the Sent History can be derived from the
-- existing activity timeline rather than a parallel log.
do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'activities'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%activity_type%'
  loop
    execute format('alter table activities drop constraint %I', con.conname);
  end loop;
end $$;

alter table activities
  add constraint activities_activity_type_check
  check (activity_type in ('call', 'email', 'note', 'meeting', 'message'));

alter table activities
  add column if not exists message_channel text
    check (message_channel is null or message_channel in ('email', 'whatsapp', 'telegram', 'linkedin')),
  add column if not exists template_id uuid references templates(id) on delete set null;

create index if not exists activities_template_id_idx on activities (template_id);

commit;
