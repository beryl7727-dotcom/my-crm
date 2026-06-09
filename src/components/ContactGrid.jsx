import React from 'react';
import ContactAvatar from './ContactAvatar';

const STAGE_STYLES = {
  relationship: 'bg-blue-100 text-blue-700',
  discovery: 'bg-amber-100 text-amber-700',
  structuring: 'bg-purple-100 text-purple-700',
  execution: 'bg-emerald-100 text-emerald-700',
  refresh: 'bg-slate-100 text-slate-600',
};

const STAGE_LABELS = {
  relationship: 'Relationship',
  discovery: 'Discovery',
  structuring: 'Structuring',
  execution: 'Execution',
  refresh: 'Refresh',
};

const formatDate = (value) => {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
};

export default function ContactGrid({ contacts, onContactClick, selectedIds, onToggleSelect, searchQuery = '' }) {
  const selectedSet = new Set(selectedIds || []);

  const highlight = (text) => {
    if (!searchQuery || !text) return text || null;
    const idx = String(text).toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + searchQuery.length);
    const after = text.slice(idx + searchQuery.length);
    return (
      <>
        {before}
        <mark className="rounded bg-yellow-200 px-0.5">{match}</mark>
        {after}
      </>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {contacts.map((contact) => {
        const selected = selectedSet.has(contact.id);
        const stageStyle = STAGE_STYLES[contact.primary_stage] || '';
        const stageLabel = STAGE_LABELS[contact.primary_stage] || '';

        return (
          <div
            key={contact.id}
            onClick={() => onContactClick(contact)}
            className={`group relative rounded-3xl border bg-white p-5 transition cursor-pointer hover:shadow-lg ${
              selected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-400'
            }`}
          >
            {/* Select toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(contact.id);
              }}
              className={`absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold transition ${
                selected
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-400 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              {selected ? '✓' : '+'}
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 pr-8">
              <ContactAvatar name={contact.full_name} className="h-12 w-12 shrink-0 text-sm" />
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 truncate leading-tight">
                  {highlight(contact.full_name)}
                </h3>
                <p className="text-sm text-slate-500 truncate">
                  {highlight(contact.company_name) || 'No company'}
                </p>
              </div>
            </div>

            {/* Contact info */}
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              {contact.job_title && (
                <p className="truncate text-slate-500">{contact.job_title}</p>
              )}
              {contact.email && (
                <p className="truncate">{highlight(contact.email)}</p>
              )}
              {contact.phone && (
                <p className="truncate text-slate-500">{highlight(contact.phone)}</p>
              )}
            </div>

            {/* Relationships row */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                contact.relationship_count > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {contact.relationship_count} {contact.relationship_count === 1 ? 'relationship' : 'relationships'}
              </span>
              {contact.primary_stage && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stageStyle}`}>
                  {stageLabel}
                </span>
              )}
            </div>

            {/* Last contact */}
            {contact.last_relationship_date && (
              <p className="mt-2 text-xs text-slate-400">
                Last contact: {formatDate(contact.last_relationship_date)}
              </p>
            )}

            {/* Tags */}
            {contact.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {contact.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
                  >
                    {tag}
                  </span>
                ))}
                {contact.tags.length > 4 && (
                  <span className="text-xs text-slate-400">+{contact.tags.length - 4}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
