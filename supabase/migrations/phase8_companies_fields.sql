-- Phase 8: Add standard fields to companies table
begin;

alter table companies
  add column if not exists industry varchar,
  add column if not exists country  varchar,
  add column if not exists website  varchar,
  add column if not exists notes    text;

commit;
