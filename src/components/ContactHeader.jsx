import React from 'react';

const initialsFromName = (name) => {
  if (!name) return 'C';
  return name
    .split(' ')
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2);
};

export default function ContactHeader({ contact, activeTab, onTabChange, onNewDeal, onLogActivity, onEdit, onArchive }) {
  const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-5">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-200 text-3xl font-semibold text-slate-700">
            {contact.avatar_url ? <img src={contact.avatar_url} alt={fullName} className="h-24 w-24 rounded-3xl object-cover" /> : initialsFromName(fullName)}
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-slate-500">Contact</p>
              <h1 className="text-3xl font-semibold text-slate-900">{fullName || contact.company || 'Unnamed Contact'}</h1>
            </div>
            <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              {contact.title && <p>{contact.title}</p>}
              {contact.company && <p>{contact.company}</p>}
              {contact.email && <p>{contact.email}</p>}
              {contact.phone && <p>{contact.phone}</p>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onNewDeal}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + New Deal
          </button>
          <button
            type="button"
            onClick={onLogActivity}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Log Activity
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onArchive}
            className="rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200"
          >
            Archive
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-200 pt-5">
        {['deals', 'activity'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {tab === 'deals' ? 'Deals' : 'Activity'}
          </button>
        ))}
      </div>
    </div>
  );
}
