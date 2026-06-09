-- RUN THIS ONCE in Supabase SQL Editor.
-- Adds all Phase 6 + 7 columns to the contacts table.
-- Safe to re-run (uses IF NOT EXISTS throughout).

begin;

alter table contacts
  add column if not exists contact_type    varchar,
  add column if not exists source          varchar,
  add column if not exists priority        varchar,
  add column if not exists region          varchar,
  add column if not exists next_touch_date timestamp with time zone,
  add column if not exists stage           varchar,
  add column if not exists country         varchar,
  add column if not exists relationship_score integer,
  add column if not exists preferred_communication varchar,
  add column if not exists personal_notes  text,
  add column if not exists products_interested text[],
  add column if not exists preferred_markets   text[],
  add column if not exists preferred_volume    varchar,
  add column if not exists last_activity_date  timestamp with time zone,
  add column if not exists segment_tags        text[],
  add column if not exists do_not_contact      boolean default false,
  add column if not exists ready_for_pipeline  boolean default false;

create index if not exists idx_contacts_contact_type on contacts(contact_type);
create index if not exists idx_contacts_source       on contacts(source);
create index if not exists idx_contacts_priority     on contacts(priority);
create index if not exists idx_contacts_stage        on contacts(stage);
create index if not exists idx_contacts_region       on contacts(region);

commit;
