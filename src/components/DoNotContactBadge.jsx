import React, { useState } from 'react';

export default function DoNotContactBadge({ reason, date, onClear, loading }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const formattedDate = date
    ? new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={onClear}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200 disabled:opacity-60"
        title="Click to remove Do Not Contact"
      >
        🚫 DNC{reason ? ` — ${reason}` : ''}
      </button>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xl text-xs text-slate-700">
          <div className="font-semibold text-rose-700">Do Not Contact</div>
          {reason && <div className="mt-0.5">Reason: {reason}</div>}
          {formattedDate && <div className="text-slate-400">Since: {formattedDate}</div>}
          <div className="mt-1 text-slate-400 italic">Click to remove</div>
          {/* tooltip arrow */}
          <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-slate-200 bg-white" />
        </div>
      )}
    </div>
  );
}
