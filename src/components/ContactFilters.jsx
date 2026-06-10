import React, { useState } from 'react';
import { CONTACT_TYPE_META } from '../utils/relationshipProfile';
import { TIER_PRODUCTS } from '../constants/products';
import { CONTACT_TYPES } from '../constants/contactTypes';

const MARKETS = [
  { value: 'apac', label: 'APAC' },
  { value: 'emea', label: 'EMEA' },
  { value: 'americas', label: 'Americas' },
  { value: 'global', label: 'Global' },
];

const STATUSES = [
  { value: 'new', label: 'New', color: 'text-blue-700' },
  { value: 'active', label: 'Active', color: 'text-emerald-700' },
  { value: 'no_recent', label: 'No Recent Contact', color: 'text-amber-700' },
  { value: 'dormant', label: 'Dormant', color: 'text-slate-500' },
];

const MultiCheck = ({ label, options, selected, onChange }) => {
  const toggle = (value) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(({ value, label: optLabel, icon }) => {
          const active = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              {icon && <span>{icon}</span>}
              {optLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ScoreFilter = ({ selected, onChange }) => {
  const toggle = (v) => onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Relationship Score</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => toggle(n)}
            className={`flex h-9 w-9 items-center justify-center rounded-full border text-base transition ${
              selected.includes(n)
                ? 'border-amber-400 bg-amber-400 text-white'
                : 'border-slate-200 bg-white text-slate-300 hover:border-amber-300 hover:text-amber-400'
            }`}
            title={`${n} star${n > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
};

// Tier-organized product filter with collapsible sections
const TierProductFilter = ({ selectedProducts, selectedTiers, onChangeProducts, onChangeTiers }) => {
  const [openTiers, setOpenTiers] = useState({ 1: true, 2: false, 3: false });

  const toggleTier = (tierNum) =>
    setOpenTiers((prev) => ({ ...prev, [tierNum]: !prev[tierNum] }));

  const toggleProduct = (product) =>
    onChangeProducts(
      selectedProducts.includes(product)
        ? selectedProducts.filter((p) => p !== product)
        : [...selectedProducts, product]
    );

  const toggleFocusTier = (tierNum) =>
    onChangeTiers(
      selectedTiers.includes(tierNum)
        ? selectedTiers.filter((t) => t !== tierNum)
        : [...selectedTiers, tierNum]
    );

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Products & Tier Focus</p>

      {/* Tier focus quick-filter */}
      <div className="flex gap-2">
        {Object.entries(TIER_PRODUCTS).map(([tierNum, tier]) => {
          const n = Number(tierNum);
          const active = selectedTiers.includes(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => toggleFocusTier(n)}
              title={`${tier.title} — ${tier.focus}`}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? `${tier.colors.activeBg} border-transparent text-white`
                  : `border-slate-200 bg-white ${tier.colors.text} hover:border-slate-300`
              }`}
            >
              {tier.emoji} {tier.title}
            </button>
          );
        })}
      </div>

      {/* Products per tier (collapsible) */}
      <div className="space-y-2">
        {Object.entries(TIER_PRODUCTS).map(([tierNum, tier]) => {
          const n = Number(tierNum);
          const open = openTiers[n];
          const tierSelectedCount = tier.products.filter((p) => selectedProducts.includes(p)).length;

          return (
            <div key={n} className={`rounded-2xl border overflow-hidden ${tier.colors.border}`}>
              <button
                type="button"
                onClick={() => toggleTier(n)}
                className={`flex w-full items-center justify-between px-3 py-2 text-xs font-semibold ${tier.colors.bg} ${tier.colors.text}`}
              >
                <span>{tier.emoji} {tier.title}</span>
                <span className="flex items-center gap-2">
                  {tierSelectedCount > 0 && (
                    <span className={`rounded-full px-2 py-0.5 text-xs ${tier.colors.badge}`}>
                      {tierSelectedCount}
                    </span>
                  )}
                  <span className="text-slate-400">{open ? '▲' : '▼'}</span>
                </span>
              </button>

              {open && (
                <div className="flex flex-wrap gap-1.5 bg-white px-3 py-2">
                  {tier.products.map((product) => {
                    const active = selectedProducts.includes(product);
                    return (
                      <button
                        key={product}
                        type="button"
                        onClick={() => toggleProduct(product)}
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                          active
                            ? `${tier.colors.activeBg} border-transparent text-white`
                            : `border-slate-200 bg-white text-slate-600 hover:border-slate-300`
                        }`}
                      >
                        {product}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DNC_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'contact', label: 'Contact' },
  { value: 'dnc', label: 'Do Not Contact' },
];

export default function ContactFilters({
  filters,
  setFilters,
  companies = [],
  teamMembers = [],
  tags = [],
  activeFilterCount = 0,
  onReset,
  dncReasons = [],
}) {
  const f = (field, value) => setFilters((cur) => ({ ...cur, [field]: value }));

  const contactTypeOptions = CONTACT_TYPES.map((t) => ({
    value: t,
    label: t,
    icon: CONTACT_TYPE_META[t]?.icon,
  }));

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-5">
      {/* Contact Type */}
      <MultiCheck
        label="Contact Type"
        options={contactTypeOptions}
        selected={filters.contactTypes}
        onChange={(v) => f('contactTypes', v)}
      />

      {/* Score */}
      <ScoreFilter selected={filters.scores} onChange={(v) => f('scores', v)} />

      {/* Tier + Products */}
      <TierProductFilter
        selectedProducts={filters.products}
        selectedTiers={filters.tiers || []}
        onChangeProducts={(v) => f('products', v)}
        onChangeTiers={(v) => f('tiers', v)}
      />

      {/* Markets */}
      <MultiCheck
        label="Preferred Markets"
        options={MARKETS}
        selected={filters.markets}
        onChange={(v) => f('markets', v)}
      />

      {/* Contact Status (DNC) */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Contact Status</p>
        <div className="flex gap-2">
          {DNC_OPTIONS.map(({ value, label }) => {
            const active = (filters.dncStatus || 'all') === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => f('dncStatus', value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? value === 'dnc'
                      ? 'border-rose-500 bg-rose-600 text-white'
                      : 'border-blue-500 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {value === 'dnc' ? '🚫 ' : value === 'contact' ? '✓ ' : ''}{label}
              </button>
            );
          })}
        </div>
        {(filters.dncStatus === 'dnc') && dncReasons.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {dncReasons.map(({ id, reason }) => {
              const active = (filters.dncReasons || []).includes(reason);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    const cur = filters.dncReasons || [];
                    f('dncReasons', active ? cur.filter((r) => r !== reason) : [...cur, reason]);
                  }}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                    active
                      ? 'border-rose-400 bg-rose-100 text-rose-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50'
                  }`}
                >
                  {reason}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Status */}
      <MultiCheck
        label="Status"
        options={STATUSES}
        selected={filters.statuses}
        onChange={(v) => f('statuses', v)}
      />

      {/* Company, Tag, Created By, Has Relationships */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Company</p>
          <select
            value={filters.companyId}
            onChange={(e) => f('companyId', e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">All companies</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Tag</p>
          <select
            value={filters.tag}
            onChange={(e) => f('tag', e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">All tags</option>
            {tags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Relationships</p>
          <select
            value={filters.hasRelationships}
            onChange={(e) => f('hasRelationships', e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All contacts</option>
            <option value="with">Has relationships</option>
            <option value="without">No relationships</option>
          </select>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Created by</p>
          <select
            value={filters.createdBy}
            onChange={(e) => f('createdBy', e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">All team members</option>
            {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.email}</option>)}
          </select>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Clear all {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
}
