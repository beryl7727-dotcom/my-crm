import React from 'react';
import ContactAvatar from './ContactAvatar';

export default function ContactGrid({ contacts, onContactClick, selectedIds, onToggleSelect }) {
  const selectedSet = new Set(selectedIds || []);

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          onClick={() => onContactClick(contact)}
          className="group relative rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-blue-500 hover:shadow-lg"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(contact.id);
            }}
            className="absolute right-4 top-4 h-8 w-8 rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-blue-500 hover:text-blue-700"
          >
            {selectedSet.has(contact.id) ? '✓' : '+'}
          </button>
          <div className="flex items-center gap-4">
            <ContactAvatar name={contact.full_name} className="h-14 w-14 text-base" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{contact.full_name}</h3>
              <p className="text-sm text-slate-500">{contact.company_name || 'No company'}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>{contact.title || 'No title'}</p>
            <p>{contact.email || 'No email'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
