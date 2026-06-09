-- Phase 6b: Add source field to contacts
begin;

alter table contacts
  add column if not exists source text
    check (source is null or source in (
      'LinkedIn', 'Referral', 'Conference / Event', 'Cold Outreach',
      'Existing Client', 'Partner / Broker', 'Website', 'Other'
    ));

create index if not exists idx_contacts_source on contacts(source);

commit;
