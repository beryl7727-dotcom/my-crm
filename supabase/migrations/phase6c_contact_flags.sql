-- Phase 6C: Add pipeline and do-not-contact flags to contacts
begin;

alter table contacts
  add column if not exists do_not_contact    boolean default false,
  add column if not exists ready_for_pipeline boolean default false;

create index if not exists idx_contacts_do_not_contact     on contacts(do_not_contact);
create index if not exists idx_contacts_ready_for_pipeline on contacts(ready_for_pipeline);

commit;
