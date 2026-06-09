-- Phase 9: Tier-based product interest columns on contacts
-- Run once in Supabase SQL Editor. Safe to re-run.

begin;

-- New tier-specific product interest arrays + focus tier
alter table contacts
  add column if not exists interest_products_tier_1 text[],
  add column if not exists interest_products_tier_2 text[],
  add column if not exists interest_products_tier_3 text[],
  add column if not exists focus_tier               integer;

-- Reference table (optional — source of truth lives in JS constants)
create table if not exists product_tiers (
  id           uuid primary key default gen_random_uuid(),
  tier         integer      not null,
  product_name varchar      not null,
  emoji        varchar,
  description  text,
  category     varchar
);

-- Seed tier products (idempotent via delete + re-insert)
delete from product_tiers;

insert into product_tiers (tier, product_name, emoji, category) values
-- Tier 1: Revenue Now
(1, 'GOs',         '1️⃣', 'Tier 1 — Revenue Now'),
(1, 'I-RECs',      '1️⃣', 'Tier 1 — Revenue Now'),
(1, 'Biomethane',  '1️⃣', 'Tier 1 — Revenue Now'),
(1, 'PPAs',        '1️⃣', 'Tier 1 — Revenue Now'),
(1, 'Carbon',      '1️⃣', 'Tier 1 — Revenue Now'),

-- Tier 2: Strategic Infrastructure
(2, 'Registry Services',    '2️⃣', 'Tier 2 — Strategic Infrastructure'),
(2, 'Certification',        '2️⃣', 'Tier 2 — Strategic Infrastructure'),
(2, 'Market Data',          '2️⃣', 'Tier 2 — Strategic Infrastructure'),
(2, 'Platform Partnerships','2️⃣', 'Tier 2 — Strategic Infrastructure'),

-- Tier 3: Corporate Demand
(3, 'EAC Procurement',         '3️⃣', 'Tier 3 — Corporate Demand'),
(3, 'Renewable PPAs',          '3️⃣', 'Tier 3 — Corporate Demand'),
(3, 'Sustainability Reporting','3️⃣', 'Tier 3 — Corporate Demand'),
(3, 'Scope 2 Compliance',      '3️⃣', 'Tier 3 — Corporate Demand');

commit;
