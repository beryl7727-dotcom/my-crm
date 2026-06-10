import React, { useState } from 'react';
import { useDoNotContactReasons } from '../hooks/useDoNotContactReasons';
import { toast } from '../utils/toast';

const MAX_CUSTOM_LEN = 30;

export default function DoNotContactModal({ contact, onClose, onSave }) {
  const contactName = contact?.full_name ||
    [contact?.first_name, contact?.last_name].filter(Boolean).join(' ') || 'this contact';

  const { allReasons, createReason } = useDoNotContactReasons();

  const [selected, setSelected] = useState('');
  const [customText, setCustomText] = useState('');
  const [saveCustom, setSaveCustom] = useState(true);
  const [saving, setSaving] = useState(false);

  const isCustom = selected === '__custom__';
  const finalReason = isCustom ? customText.trim() : selected;
  const canSave = finalReason.length > 0;

  const handleSave = async () => {
    if (!canSave) { toast.error('Please select or enter a reason'); return; }
    setSaving(true);
    try {
      if (isCustom && saveCustom) {
        await createReason(customText.trim());
      }
      await onSave(finalReason);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">Mark as Do Not Contact</h2>
          <p className="mt-0.5 text-sm text-slate-500">Select a reason for not contacting <strong>{contactName}</strong></p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-2">
          {allReasons.map(({ id, reason, is_custom }) => (
            <label
              key={id}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                selected === reason
                  ? 'border-rose-400 bg-rose-50'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="dnc_reason"
                value={reason}
                checked={selected === reason}
                onChange={() => setSelected(reason)}
                className="h-4 w-4 accent-rose-600"
              />
              <span className={`text-sm ${is_custom ? 'italic text-blue-700' : 'text-slate-700'}`}>
                {reason}
                {is_custom && <span className="ml-1.5 text-xs font-normal text-slate-400">custom</span>}
              </span>
            </label>
          ))}

          {/* Custom / Other option */}
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
              isCustom ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              name="dnc_reason"
              value="__custom__"
              checked={isCustom}
              onChange={() => setSelected('__custom__')}
              className="h-4 w-4 accent-rose-600"
            />
            <span className="text-sm text-slate-700">Other / Custom reason</span>
          </label>

          {/* Custom text input */}
          {isCustom && (
            <div className="ml-7 space-y-2 pt-1">
              <div className="relative">
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value.slice(0, MAX_CUSTOM_LEN))}
                  placeholder="Enter reason…"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-rose-400 focus:outline-none"
                  autoFocus
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  {customText.length}/{MAX_CUSTOM_LEN}
                </span>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={saveCustom}
                  onChange={(e) => setSaveCustom(e.target.checked)}
                  className="h-4 w-4 rounded accent-blue-600"
                />
                Save this reason for future use
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className="rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save as Do Not Contact'}
          </button>
        </div>
      </div>
    </div>
  );
}
