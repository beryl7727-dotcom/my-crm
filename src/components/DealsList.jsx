import React from 'react';
import { STAGE_LABELS } from '../utils/relationshipStages';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function DealsList({ deals, onDealClick }) {
  if (!deals || deals.length === 0) {
    return <p className="text-sm text-slate-600">No relationships found for this contact.</p>;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200">
      <div className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr] gap-4 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <span>Relationship</span>
        <span>Value</span>
        <span>Stage</span>
        <span>Close</span>
        <span>Updated</span>
      </div>
      <div className="divide-y divide-slate-200 bg-white">
        {deals.map((deal) => (
          <button
            key={deal.id}
            type="button"
            onClick={() => onDealClick(deal)}
            className="grid w-full grid-cols-[3fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-4 text-left hover:bg-slate-50 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr]"
          >
            <div>
              <p className="font-semibold text-slate-900">{deal.title || 'Untitled relationship'}</p>
              <p className="text-sm text-slate-500">{deal.company?.name || ''}</p>
            </div>
            <div className="text-slate-700">${Number(deal.value || 0).toLocaleString()}</div>
            <div className="text-slate-700">{STAGE_LABELS[deal.stage] || deal.stage || 'N/A'}</div>
            <div className="text-slate-700">{formatDate(deal.expected_close_date)}</div>
            <div className="text-slate-500">{formatDate(deal.updated_at)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
