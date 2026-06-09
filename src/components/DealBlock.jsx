import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function getDaysUntil(dateValue) {
  if (!dateValue) return null;
  const close = new Date(dateValue);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  close.setHours(0, 0, 0, 0);
  return Math.ceil((close - today) / (1000 * 60 * 60 * 24));
}

function getUrgency(days) {
  if (days === null) {
    return { wrapper: 'bg-purple-50 border-purple-200', text: 'text-slate-900', badge: null, pulse: false };
  }
  if (days <= 0) {
    return { wrapper: 'bg-red-100 border-red-400', text: 'text-red-900', badge: { cls: 'bg-red-600 text-white', label: 'Today!' }, pulse: true };
  }
  if (days <= 3) {
    return { wrapper: 'bg-red-50 border-red-300', text: 'text-red-800', badge: { cls: 'bg-red-500 text-white', label: `${days}d left` }, pulse: false };
  }
  if (days <= 7) {
    return { wrapper: 'bg-orange-50 border-orange-300', text: 'text-orange-800', badge: { cls: 'bg-orange-400 text-white', label: `${days}d left` }, pulse: false };
  }
  return { wrapper: 'bg-green-50 border-green-300', text: 'text-green-800', badge: { cls: 'bg-green-600 text-white', label: `${days}d` }, pulse: false };
}

function formatDate(value) {
  if (!value) return 'No date';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatVolume(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n === 0) return null;
  return `${n.toLocaleString()} units`;
}

// Individual deal card for the Deal Calendar. Urgency color changes based on days
// until expected_close_date. Inline date picker lets the trader reschedule the deal.
export default function DealBlock({ deal, onReschedule }) {
  const navigate = useNavigate();
  const [editingDate, setEditingDate] = useState(false);
  const [dateValue, setDateValue] = useState(deal.expected_close_date ? deal.expected_close_date.slice(0, 10) : '');
  const [saving, setSaving] = useState(false);

  const days = getDaysUntil(deal.expected_close_date);
  const urgency = getUrgency(days);

  const contact = deal.contact;
  const fullName = contact
    ? [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim()
    : 'Unknown contact';
  const product = deal.details?.product || null;
  const volume = deal.details?.volume ? formatVolume(deal.details.volume) : null;

  const handleBodyClick = () => {
    if (!editingDate) navigate(`/relationships/${deal.id}`);
  };

  const handleSaveDate = async (e) => {
    e.stopPropagation();
    if (!onReschedule) return;
    setSaving(true);
    try {
      await onReschedule(deal.id, dateValue || null);
      setEditingDate(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`rounded-2xl border p-3 transition hover:shadow-md ${urgency.wrapper} ${urgency.pulse ? 'animate-pulse' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={handleBodyClick} className="min-w-0 flex-1 text-left">
          <p className={`truncate text-sm font-semibold ${urgency.text}`}>{fullName}</p>
          {product && <p className="mt-0.5 truncate text-xs text-slate-600">{product}</p>}
          {volume && <p className="text-xs text-slate-500">{volume}</p>}
        </button>
        {urgency.badge && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${urgency.badge.cls}`}>
            {urgency.badge.label}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        {editingDate ? (
          <div className="flex flex-1 items-center gap-1.5">
            <input
              type="date"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 rounded-xl border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSaveDate}
              disabled={saving}
              className="rounded-full bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? '…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setEditingDate(false); }}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <span className="text-xs text-slate-500">Close: {formatDate(deal.expected_close_date)}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setEditingDate(true); }}
              title="Reschedule"
              className="text-xs text-slate-400 hover:text-blue-600 transition"
            >
              ✏️
            </button>
          </>
        )}
      </div>
    </div>
  );
}
