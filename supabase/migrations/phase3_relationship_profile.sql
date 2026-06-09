-- Phase 3: Relationship Score & Contact Types
-- Extends relationships with profile/preference fields and adds a country to contacts.
-- relationship_score and contact_type already exist (added in phase1_relationship_pipeline.sql).

begin;

alter table relationships
  add column if not exists preferred_communication text
    check (preferred_communication is null or preferred_communication in ('email', 'whatsapp', 'telegram', 'linkedin')),
  add column if not exists personal_notes text,
  add column if not exists products_interested text[] not null default '{}',
  add column if not exists preferred_markets text[] not null default '{}',
  add column if not exists preferred_volume text
    check (preferred_volume is null or preferred_volume in ('small', 'medium', 'large')),
  add column if not exists last_meeting_date timestamptz,
  add column if not exists last_trade_date timestamptz;

-- Constrain products_interested / preferred_markets to known values.
alter table relationships
  add constraint relationships_products_interested_check
    check (products_interested <@ array['i-rec', 'go', 'rec', 'carbon']::text[]),
  add constraint relationships_preferred_markets_check
    check (preferred_markets <@ array['apac', 'emea', 'americas', 'global']::text[]);

-- Country is a contact-level attribute needed by the Profile tab.
alter table contacts
  add column if not exists country text;

commit;
