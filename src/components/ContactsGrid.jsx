import React from 'react';
import { useNavigate } from 'react-router-dom';
import ContactAvatar from './ContactAvatar';
import ContactTypeIcon from './ContactTypeIcon';
import RelationshipScoreStar from './RelationshipScoreStar';

const STAGE_STYLES = {
  relationship: 'bg-blue-100 text-blue-700',
  discovery: 'bg-amber-100 text-amber-700',
  structuring: 'bg-purple-100 text-purple-700',
  execution: 'bg-emerald-100 text-emerald-700',
  refresh: 'bg-slate-100 text-slate-600',
};
const STAGE_LABELS = {
  relationship: 'Relationship', discovery: 'Discovery',
  structuring: 'Structuring', execution: 'Execution', refresh: 'Refresh',
};

const fmt = (d) => d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : null;

function highlight(text, query) {
  if (!query || !text) return text || null;
  const str = String(text);
  const idx = str.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return str;
  return (
    <>
      {str.slice(0, idx)}
      <mark className="rounded bg-yellow-200 px-0.5">{str.slice(idx, idx + query.length)}</mark>
      {str.slice(idx + query.length)}
    </>
  );
}

export default function ContactsGrid({ contacts, selectedIds, onToggleSelect, searchQuery = '' }) {
  const navigate = useNavigate();
  const selectedSet = new Set(selectedIds || []);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {contacts.map((contact) => {
        const selected = selectedSet.has(contact.id);

        return (
          <div
            key={contact.id}
            onClick={() => navigate(`/contacts/${contact.id}`)}
            className={`group relative rounded-3xl border bg-white p-5 transition cursor-pointer hover:shadow-lg ${
              selected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            {/* Select toggle */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleSelect(contact.id); }}
              className={`absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold transition ${
                selected
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-400 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              {selected ? '✓' : '+'}
            </button>

            {/* Header */}
            <div className="flex items-start gap-3 pr-10">
              <ContactAvatar name={contact.full_name} className="h-12 w-12 shrink-0 text-sm" />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-900 truncate leading-tight">
                  {highlight(contact.full_name, searchQuery)}
                </h3>
                <p className="text-sm text-slate-500 truncate">
                  {highlight(contact.company_name, searchQuery) || 'No company'}
                </p>
              </div>
            </div>

            {/* Type + Score */}
            <div className="mt-3 flex items-center justify-between">
              <ContactTypeIcon type={contact.contact_type} size="sm" showLabel />
              <RelationshipScoreStar score={contact.relationship_score || 0} readOnly size="sm" />
            </div>

            {/* Contact info */}
            <div className="mt-2 space-y-0.5 text-xs text-slate-500">
              {contact.email && <p className="truncate">{highlight(contact.email, searchQuery)}</p>}
              {contact.phone && <p className="truncate">{highlight(contact.phone, searchQuery)}</p>}
            </div>

            {/* Relationships + stage */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                contact.relationship_count > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {contact.relationship_count} {contact.relationship_count === 1 ? 'relationship' : 'relationships'}
              </span>
              {contact.primary_stage && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_STYLES[contact.primary_stage] || ''}`}>
                  {STAGE_LABELS[contact.primary_stage]}
                </span>
              )}
            </div>

            {/* Last contact */}
            {(contact.last_relationship_date || contact.last_activity) && (
              <p className="mt-1.5 text-xs text-slate-400">
                Last contact: {fmt(contact.last_relationship_date || contact.last_activity)}
              </p>
            )}

            {/* Tags */}
            {contact.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {contact.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{tag}</span>
                ))}
                {contact.tags.length > 3 && <span className="text-xs text-slate-400">+{contact.tags.length - 3}</span>}
              </div>
            )}

            {/* Quick actions (visible on hover) */}
            <div className="mt-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 text-base"
                  title="Email"
                >✉️</a>
              )}
              {contact.phone && (
                <>
                  <a
                    href={`tel:${contact.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 text-base"
                    title="Call"
                  >📞</a>
                  <a
                    href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-green-600 text-base"
                    title="WhatsApp"
                  >💬</a>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
