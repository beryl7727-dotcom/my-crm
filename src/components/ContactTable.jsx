import React, { useMemo, useState } from 'react';
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

const EditableCell = ({ value, isEditing, onStartEdit, onChange, onSave, onCancel, type = 'text' }) => {
  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          type={type}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave();
            if (e.key === 'Escape') onCancel();
          }}
        />
        <button onClick={onSave} className="shrink-0 text-blue-600 hover:text-blue-800 text-xs font-semibold" type="button">
          Save
        </button>
        <button onClick={onCancel} className="shrink-0 text-slate-400 hover:text-slate-600 text-xs" type="button">
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between gap-1">
      <span className="truncate">{value || <span className="text-slate-400">—</span>}</span>
      <button
        type="button"
        onClick={onStartEdit}
        className="invisible shrink-0 rounded p-0.5 text-slate-400 transition group-hover:visible hover:bg-slate-100 hover:text-slate-600"
        title="Edit"
      >
        ✎
      </button>
    </div>
  );
};

export default function ContactTable({
  contacts,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
  onRowClick,
  onUpdateContact,
  searchQuery = '',
}) {
  const [editingState, setEditingState] = useState({ id: null, field: null });
  const [editingValue, setEditingValue] = useState('');

  const selectedSet = useMemo(() => new Set(selectedIds || []), [selectedIds]);

  const startEditing = (contact, field) => {
    const value = field === 'tags' ? (contact.tags || []).join(', ') : contact[field] || '';
    setEditingState({ id: contact.id, field });
    setEditingValue(value);
  };

  const stopEditing = () => setEditingState({ id: null, field: null });

  const saveEditing = async () => {
    if (!editingState.id || !editingState.field) return;
    const payload = {};
    if (editingState.field === 'tags') {
      payload.tags = editingValue
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    } else {
      payload[editingState.field] = editingValue || null;
    }
    await onUpdateContact(editingState.id, payload);
    stopEditing();
  };

  const highlight = (text) => {
    if (!searchQuery || !text) return text || '—';
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
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="rounded border-slate-300"
              />
            </th>
            <th className="px-4 py-3 text-left min-w-[180px]">Name</th>
            <th className="px-4 py-3 text-left">Company</th>
            <th className="px-4 py-3 text-left min-w-[120px]">Title</th>
            <th className="px-4 py-3 text-left min-w-[120px]">Phone</th>
            <th className="px-4 py-3 text-left min-w-[140px]">Tags</th>
            <th className="px-4 py-3 text-left min-w-[120px]">Relationships</th>
            <th className="px-4 py-3 text-left min-w-[110px]">Last Contact</th>
            <th className="px-4 py-3 text-left min-w-[110px]">Last Activity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {contacts.map((contact) => {
            const isEditingRow = editingState.id === contact.id;
            const stageStyle = STAGE_STYLES[contact.primary_stage] || '';
            const stageLabel = STAGE_LABELS[contact.primary_stage] || '';

            return (
              <tr
                key={contact.id}
                className={`cursor-pointer transition hover:bg-slate-50 ${
                  selectedSet.has(contact.id) ? 'bg-blue-50' : ''
                }`}
                onClick={() => onRowClick(contact)}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedSet.has(contact.id)}
                    onChange={() => onToggleSelect(contact.id)}
                    className="rounded border-slate-300"
                  />
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <ContactAvatar name={contact.full_name} />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        {highlight(contact.full_name)}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {highlight(contact.email) || 'No email'}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3 text-slate-700 max-w-[160px] truncate">
                  {highlight(contact.company_name) || <span className="text-slate-400">—</span>}
                </td>

                <td className="px-4 py-3 text-slate-700" onClick={(e) => e.stopPropagation()}>
                  <EditableCell
                    value={contact.job_title}
                    isEditing={isEditingRow && editingState.field === 'job_title'}
                    onStartEdit={() => startEditing(contact, 'job_title')}
                    onChange={setEditingValue}
                    onSave={saveEditing}
                    onCancel={stopEditing}
                  />
                </td>

                <td className="px-4 py-3 text-slate-700" onClick={(e) => e.stopPropagation()}>
                  <EditableCell
                    value={contact.phone}
                    isEditing={isEditingRow && editingState.field === 'phone'}
                    onStartEdit={() => startEditing(contact, 'phone')}
                    onChange={setEditingValue}
                    onSave={saveEditing}
                    onCancel={stopEditing}
                    type="tel"
                  />
                </td>

                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  {isEditingRow && editingState.field === 'tags' ? (
                    <EditableCell
                      value={editingValue}
                      isEditing
                      onStartEdit={() => startEditing(contact, 'tags')}
                      onChange={setEditingValue}
                      onSave={saveEditing}
                      onCancel={stopEditing}
                    />
                  ) : (
                    <div
                      className="group flex flex-wrap items-center gap-1 cursor-text"
                      onClick={() => startEditing(contact, 'tags')}
                    >
                      {contact.tags.length > 0 ? (
                        contact.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs group-hover:text-blue-500">+ add tag</span>
                      )}
                      {contact.tags.length > 3 && (
                        <span className="text-xs text-slate-400">+{contact.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{contact.relationship_count}</span>
                    {contact.primary_stage && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${stageStyle}`}>
                        {stageLabel}
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3 text-slate-600 text-xs">
                  {formatDate(contact.last_relationship_date) || <span className="text-slate-400">—</span>}
                </td>

                <td className="px-4 py-3 text-slate-600 text-xs">
                  {formatDate(contact.last_activity) || <span className="text-slate-400">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
