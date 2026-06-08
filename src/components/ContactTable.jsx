import React, { useMemo, useState } from 'react';
import ContactAvatar from './ContactAvatar';

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
        />
        <button onClick={onSave} className="text-blue-600 hover:text-blue-800" type="button">
          Save
        </button>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-700" type="button">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between gap-2">
      <span>{value || '—'}</span>
      <button
        type="button"
        onClick={onStartEdit}
        className="invisible rounded-full p-1 text-slate-400 transition group-hover:visible hover:bg-slate-100 hover:text-slate-600"
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

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <th className="px-4 py-3 text-left">
              <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} />
            </th>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Company</th>
            <th className="px-4 py-3 text-left">Title</th>
            <th className="px-4 py-3 text-left">Email</th>
            <th className="px-4 py-3 text-left">Phone</th>
            <th className="px-4 py-3 text-left">Tags</th>
            <th className="px-4 py-3 text-left">Last activity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {contacts.map((contact) => {
            const isEditingRow = editingState.id === contact.id;
            return (
              <tr
                key={contact.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => onRowClick(contact)}
              >
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedSet.has(contact.id)}
                    onChange={() => onToggleSelect(contact.id)}
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <ContactAvatar name={contact.full_name} />
                    <div>
                      <div className="font-semibold text-slate-900">{contact.full_name}</div>
                      <div className="text-xs text-slate-500">{contact.email || 'No email'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-700">{contact.company_name || '—'}</td>
                <td className="px-4 py-4 text-slate-700" onClick={(e) => e.stopPropagation()}>
                  <EditableCell
                    value={contact.job_title || '—'}
                    isEditing={isEditingRow && editingState.field === 'job_title'}
                    onStartEdit={() => startEditing(contact, 'job_title')}
                    onChange={setEditingValue}
                    onSave={saveEditing}
                    onCancel={stopEditing}
                  />
                </td>
                <td className="px-4 py-4 text-slate-700">{contact.email || '—'}</td>
                <td className="px-4 py-4 text-slate-700" onClick={(e) => e.stopPropagation()}>
                  <EditableCell
                    value={contact.phone || '—'}
                    isEditing={isEditingRow && editingState.field === 'phone'}
                    onStartEdit={() => startEditing(contact, 'phone')}
                    onChange={setEditingValue}
                    onSave={saveEditing}
                    onCancel={stopEditing}
                  />
                </td>
                <td className="px-4 py-4 text-slate-700" onClick={(e) => e.stopPropagation()}>
                  <EditableCell
                    value={(contact.tags || []).join(', ') || '—'}
                    isEditing={isEditingRow && editingState.field === 'tags'}
                    onStartEdit={() => startEditing(contact, 'tags')}
                    onChange={setEditingValue}
                    onSave={saveEditing}
                    onCancel={stopEditing}
                  />
                </td>
                <td className="px-4 py-4 text-slate-700">{contact.last_activity ? new Date(contact.last_activity).toLocaleDateString() : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
