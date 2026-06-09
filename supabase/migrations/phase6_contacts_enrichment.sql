-- Phase 6: Contacts Enrichment
-- Adds profile fields directly to contacts so the Contacts page can filter
-- and display contact_type, relationship_score, products, markets, etc.
-- without always joining through the relationships table.

begin;

alter table contacts
  add column if not exists contact_type text
    check (contact_type is null or contact_type in (
      'Trader', 'Corporate Buyer', 'Registry', 'Government',
      'Media', 'Project Developer', 'Exchange'
    )),
  add column if not exists relationship_score smallint
    check (relationship_score is null or relationship_score between 1 and 5),
  add column if not exists preferred_communication text
    check (preferred_communication is null or preferred_communication in (
      'email', 'whatsapp', 'telegram', 'linkedin'
    )),
  add column if not exists personal_notes text,
  add column if not exists products_interested text[] not null default '{}',
  add column if not exists preferred_markets  text[] not null default '{}',
  add column if not exists preferred_volume text
    check (preferred_volume is null or preferred_volume in ('small', 'medium', 'large')),
  add column if not exists last_activity_date timestamptz,
  add column if not exists segment_tags text[] not null default '{}';

-- Value constraints matching relationships table
alter table contacts
  add constraint if not exists contacts_products_interested_check
    check (products_interested <@ array['i-rec', 'go', 'rec', 'carbon']::text[]),
  add constraint if not exists contacts_preferred_markets_check
    check (preferred_markets <@ array['apac', 'emea', 'americas', 'global']::text[]);

-- Search + filter performance indexes
create index if not exists idx_contacts_team_id        on contacts(team_id);
create index if not exists idx_contacts_company_id     on contacts(company_id);
create index if not exists idx_contacts_email          on contacts(email);
create index if not exists idx_contacts_phone          on contacts(phone);
create index if not exists idx_contacts_contact_type   on contacts(contact_type);
create index if not exists idx_contacts_rel_score      on contacts(relationship_score);
create index if not exists idx_contacts_last_activity  on contacts(last_activity_date);

commit;
