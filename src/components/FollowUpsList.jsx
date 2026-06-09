import { useNavigate } from 'react-router-dom';

function getDaysSince(dateValue) {
  if (!dateValue) return null;
  const then = new Date(dateValue);
  if (Number.isNaN(then.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - then.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatDate(value) {
  if (!value) return 'Never';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Modal listing discovery-stage relationships whose last contact was 7+ days ago.
// Clicking "Send Follow-Up" navigates to the messaging hub.
// Clicking the row navigates to the relationship detail page.
export default function FollowUpsList({ deals = [], onClose }) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Follow-Ups Due</h2>
            <p className="text-sm text-slate-500">Discovery-stage contacts with no activity for 7+ days</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {deals.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">All follow-ups are on track — nothing overdue.</p>
        ) : (
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
            {deals.map((deal) => {
              const contact = deal.contact;
              const fullName = contact
                ? [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim()
                : 'Unknown contact';
              const days = getDaysSince(deal.last_contact_date);
              return (
                <li
                  key={deal.id}
                  onClick={() => { navigate(`/relationships/${deal.id}`); onClose(); }}
                  className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3 hover:border-orange-300 hover:bg-orange-50 transition"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{fullName}</p>
                    <p className="truncate text-sm text-slate-500">
                      {deal.company?.name || 'No company'} · Last contact: {formatDate(deal.last_contact_date)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {days != null && (
                      <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                        {days}d overdue
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); navigate('/messaging'); onClose(); }}
                      className="rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-600"
                    >
                      Send Follow-Up
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
