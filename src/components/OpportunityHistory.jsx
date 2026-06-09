import { OPPORTUNITY_RESULTS } from '../utils/relationshipProfile';

const monthFormatter = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: '2-digit' });

function formatMonth(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return monthFormatter.format(date).replace('/', '-');
}

// Lists every opportunity OROS has had with a contact, newest first, showing
// the stage reached, product/volume, and a derived Won / Lost / Pending result.
export default function OpportunityHistory({ opportunities = [], loading = false }) {
  if (loading) {
    return <p className="text-sm text-slate-400">Loading opportunity history…</p>;
  }

  if (opportunities.length === 0) {
    return <p className="text-sm text-slate-400">No opportunities with this contact yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {opportunities.map((opportunity) => {
        const result = OPPORTUNITY_RESULTS[opportunity.result] || OPPORTUNITY_RESULTS.pending;
        return (
          <li
            key={opportunity.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-slate-800">{formatMonth(opportunity.date)}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{opportunity.stageLabel}</span>
              {opportunity.product && <span className="text-sm text-slate-600">{opportunity.product}</span>}
              {opportunity.volume && <span className="text-sm text-slate-500">{Number(opportunity.volume).toLocaleString()} units</span>}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${result.colors}`}>{result.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
