import React, { useState } from 'react';

export default function DoNotContactTag({ contactId, onClear, loading }) {
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => onClear(contactId)}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        disabled={loading}
        className="flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
      >
        🚫 DNC
      </button>

      {showTip && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 w-52 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg text-xs text-slate-600">
          <p className="font-semibold text-slate-800 mb-1">Do Not Contact</p>
          <p>This contact has been marked as Do Not Contact.</p>
          <p className="mt-1 text-slate-400">Click to undo.</p>
          <div className="absolute left-1/2 top-full -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-slate-200 bg-white" />
        </div>
      )}
    </div>
  );
}
