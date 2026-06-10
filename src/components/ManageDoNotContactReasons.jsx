import React, { useState } from 'react';
import { useDoNotContactReasons, PRESET_REASONS } from '../hooks/useDoNotContactReasons';

const MAX_LEN = 30;

export default function ManageDoNotContactReasons() {
  const { customReasons, loading, createReason, deleteReason } = useDoNotContactReasons();
  const [newReason, setNewReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    const trimmed = newReason.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_LEN) { setError(`Max ${MAX_LEN} characters`); return; }
    const isDupe = [
      ...PRESET_REASONS,
      ...customReasons.map((r) => r.reason),
    ].some((r) => r.toLowerCase() === trimmed.toLowerCase());
    if (isDupe) { setError('Reason already exists'); return; }

    setSaving(true);
    setError('');
    try {
      await createReason(trimmed);
      setNewReason('');
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Do Not Contact Reasons</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage the reasons shown when marking a contact as Do Not Contact. Preset reasons cannot be deleted.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white divide-y divide-slate-100">
        {/* Preset reasons (read-only) */}
        {PRESET_REASONS.map((reason) => (
          <div key={reason} className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-slate-700">{reason}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">Preset</span>
          </div>
        ))}

        {/* Custom reasons (deletable) */}
        {customReasons.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-5 py-3">
            <span className="text-sm italic text-blue-700">{r.reason}</span>
            <button
              type="button"
              onClick={() => deleteReason(r.id)}
              className="rounded-full p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              title="Delete reason"
            >
              ✕
            </button>
          </div>
        ))}

        {loading && (
          <div className="px-5 py-3 text-sm text-slate-400">Loading…</div>
        )}
      </div>

      {/* Add new reason */}
      <div className="flex items-start gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={newReason}
            onChange={(e) => { setNewReason(e.target.value.slice(0, MAX_LEN)); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add a custom reason…"
            className={`w-full rounded-2xl border px-4 py-2.5 text-sm focus:outline-none ${
              error ? 'border-rose-400 focus:border-rose-400' : 'border-slate-300 focus:border-blue-500'
            }`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            {newReason.length}/{MAX_LEN}
          </span>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newReason.trim() || saving}
          className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add'}
        </button>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </section>
  );
}
