
import { STAGE_COLORS, STAGE_LABELS, NEXT_ACTION_ICONS } from '../utils/relationshipStages';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysSince(dateValue) {
  if (!dateValue) return null;
  const then = new Date(dateValue);
  if (Number.isNaN(then.getTime())) return null;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.floor((Date.now() - then.getTime()) / msPerDay));
}

function formatCurrency(amount) {
  const n = Number(amount);
  if (!n || isNaN(n)) return '$0';
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return '$' + Math.round(n / 1000) + 'K';
  return '$' + n;
}

function ScoreStars({ score }) {
  const filled = Math.max(0, Math.min(5, Number(score) || 0));
  if (!filled) return <span className="text-xs text-slate-400">No score</span>;
  const filledStars = '★'.repeat(filled);
  const emptyStars = '★'.repeat(5 - filled);
  return (
    <span className="text-sm leading-none tracking-tight" title={'Relationship score: ' + filled + '/5'}>
      <span className="text-amber-400">{filledStars}</span>
      <span className="text-slate-300">{emptyStars}</span>
    </span>
  );
}

import { DEFAULT_CARD_FIELDS } from '../utils/cardFields';
export { DEFAULT_CARD_FIELDS };

export default function DealCard({ deal, onOpen, visibleFields = DEFAULT_CARD_FIELDS }) {
  const show = (key) => visibleFields[key] !== false;

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', deal.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const colors = STAGE_COLORS[deal.stage] || STAGE_COLORS.relationship;
  const contactName = deal.contact
    ? ((deal.contact.first_name || '') + ' ' + (deal.contact.last_name || '')).trim()
    : deal.contact_name || 'No contact';
  const companyName = (deal.company && deal.company.name) || deal.company_name || null;
  const days = getDaysSince(deal.last_contact_date);
  const nextAction = deal.next_action_type;

  const rows = [
    show('lastContact') && { label: 'Last contact', value: formatDate(deal.last_contact_date) },
    show('daysSince') && { label: 'Days since contact', value: days == null ? '—' : days + 'd' },
    show('nextAction') && {
      label: 'Next action',
      value: nextAction ? ((NEXT_ACTION_ICONS[nextAction] || '') + ' ' + nextAction) : '—',
    },
    show('value') && { label: 'Value', value: formatCurrency(deal.value) },
  ].filter(Boolean);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onOpen && onOpen(deal)}
      className="bg-white border border-gray-200 hover:border-blue-300 p-3 rounded-md cursor-pointer shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-2">
        <h5 className="font-semibold text-sm text-slate-900">{contactName || 'No contact'}</h5>
        <span
          className={'mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ' + colors.dot}
          title={STAGE_LABELS[deal.stage] || deal.stage}
        />
      </div>

      {show('company') && companyName && (
        <p className="mt-0.5 text-xs text-slate-500 truncate">{companyName}</p>
      )}

      {show('score') && (
        <div className="mt-1">
          <ScoreStars score={deal.relationship_score} />
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-2 space-y-1 text-xs text-slate-500">
          {rows.map(function(r) {
            return (
              <div key={r.label} className="flex items-center justify-between gap-2">
                <span>{r.label}</span>
                <span className="font-medium text-slate-700">{r.value}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
