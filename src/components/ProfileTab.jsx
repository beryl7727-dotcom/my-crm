import { useEffect, useState } from 'react';
import RelationshipScoreStar from './RelationshipScoreStar';
import ContactTypeIcon from './ContactTypeIcon';
import { CONTACT_TYPES } from '../utils/relationshipStages';
import { CHANNELS, CHANNEL_META } from '../utils/messageTemplates';

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value || '—'}</p>
    </div>
  );
}

// Profile tab: read-only contact details, the editable contact score, and an
// editable preferences block (contact type, preferred communication, notes).
export default function ProfileTab({ relationship, onUpdateScore, onUpdateRelationship }) {
  const contact = relationship?.contact;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ contact_type: '', preferred_communication: '', personal_notes: '' });

  useEffect(() => {
    if (!relationship) return;
    setForm({
      contact_type: relationship.contact_type || '',
      preferred_communication: relationship.preferred_communication || '',
      personal_notes: relationship.personal_notes || '',
    });
  }, [relationship]);

  const fullName = [contact?.first_name, contact?.last_name].filter(Boolean).join(' ').trim() || 'Unnamed contact';

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateRelationship({
        contact_type: form.contact_type || null,
        preferred_communication: form.preferred_communication || null,
        personal_notes: form.personal_notes || null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      contact_type: relationship?.contact_type || '',
      preferred_communication: relationship?.preferred_communication || '',
      personal_notes: relationship?.personal_notes || '',
    });
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <ReadOnlyField label="Name" value={fullName} />
        <ReadOnlyField label="Title" value={contact?.job_title} />
        <ReadOnlyField label="Company" value={relationship?.company?.name} />
        <ReadOnlyField label="Country" value={contact?.country} />
      </div>

      <div className="rounded-2xl border border-slate-200 p-4">
        <p className="text-sm font-medium text-slate-700">Contact Score</p>
        <p className="text-xs text-slate-500">Same score used as the relationship's overall rating.</p>
        <div className="mt-3">
          <RelationshipScoreStar score={relationship?.relationship_score} onChange={onUpdateScore} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Preferences &amp; Notes</h3>
          <button
            type="button"
            onClick={() => (editing ? handleCancel() : setEditing(true))}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Contact Type</label>
              <select
                value={form.contact_type}
                onChange={(e) => setForm((current) => ({ ...current, contact_type: e.target.value }))}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select a type</option>
                {CONTACT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Preferred Communication</label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((channel) => {
                  const meta = CHANNEL_META[channel];
                  const active = form.preferred_communication === channel;
                  return (
                    <label
                      key={channel}
                      className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        active ? `${meta.colors.border} ${meta.colors.solid}` : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="preferred_communication"
                        checked={active}
                        onChange={() => setForm((current) => ({ ...current, preferred_communication: channel }))}
                        className="hidden"
                      />
                      {meta.icon} {meta.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Personal Notes</label>
              <textarea
                value={form.personal_notes}
                onChange={(e) => setForm((current) => ({ ...current, personal_notes: e.target.value }))}
                className="h-32 w-full rounded-2xl border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Personal notes about this contact..."
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Contact Type:</span>
              {relationship?.contact_type ? (
                <ContactTypeIcon type={relationship.contact_type} size="sm" showLabel />
              ) : (
                <span className="text-sm text-slate-400">Not set</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Preferred Communication:</span>
              {relationship?.preferred_communication ? (
                <span className="text-sm text-slate-700">
                  {CHANNEL_META[relationship.preferred_communication]?.icon} {CHANNEL_META[relationship.preferred_communication]?.label}
                </span>
              ) : (
                <span className="text-sm text-slate-400">Not set</span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Personal Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{relationship?.personal_notes || 'No notes yet.'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
