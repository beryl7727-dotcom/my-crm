-- Phase 7: Add priority, region, next_touch_date, stage to contacts
begin;

alter table contacts
  add column if not exists priority       varchar,
  add column if not exists region         varchar,
  add column if not exists next_touch_date timestamp with time zone,
  add column if not exists stage          varchar;

-- contact_type and source may already exist from phase 6 migrations;
-- safe to re-run as IF NOT EXISTS
alter table contacts
  add column if not exists contact_type varchar,
  add column if not exists source       varchar;

create index if not exists idx_contacts_priority on contacts(priority);
create index if not exists idx_contacts_stage    on contacts(stage);
create index if not exists idx_contacts_region   on contacts(region);

commit;
