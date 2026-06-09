import React from 'react';
import { CONTACT_TYPE_META } from '../utils/relationshipProfile';

const CONTACT_TYPES = ['Trader', 'Corporate Buyer', 'Registry', 'Government', 'Media', 'Project Developer', 'Exchange'];

const PRODUCTS = [
  { value: 'i-rec', label: 'I-REC' },
  { value: 'go', label: 'GO' },
  { value: 'rec', label: 'REC' },
  { value: 'carbon', label: 'Carbon' },
];

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
  const toggle = (value) => {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]
    );
  };
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(({ value, label: optLabel, icon, color }) => {
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

export default function ContactFilters({
  filters,
  setFilters,
  companies = [],
  teamMembers = [],
  tags = [],
  activeFilterCount = 0,
  onReset,
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

      {/* Products / Market Interest */}
      <MultiCheck
        label="Market Interest (Products)"
        options={PRODUCTS}
        selected={filters.products}
        onChange={(v) => f('products', v)}
      />

      {/* Markets */}
      <MultiCheck
        label="Preferred Markets"
        options={MARKETS}
        selected={filters.markets}
        onChange={(v) => f('markets', v)}
      />

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
