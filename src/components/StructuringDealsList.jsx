import { useNavigate } from 'react-router-dom';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatVolume(volume) {
  if (!volume) return null;
  const n = Number(volume);
  if (!Number.isFinite(n)) return String(volume);
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return n.toLocaleString();
}

// Modal listing structuring-stage relationships created this month.
// Shows: contact, product, volume, expected close date.
export default function StructuringDealsList({ deals = [], onClose }) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Deals in Structuring</h2>
            <p className="text-sm text-slate-500">Structuring-stage relationships created this month</p>
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
          <p className="py-8 text-center text-sm text-slate-400">No structuring deals this month yet.</p>
        ) : (
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
            {deals.map((deal) => {
              const contact = deal.contact;
              const fullName = contact
                ? [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim()
                : 'Unknown contact';
              const product = deal.details?.product || null;
              const volume = deal.details?.volume || null;
              return (
                <li
                  key={deal.id}
                  onClick={() => { navigate(`/relationships/${deal.id}`); onClose(); }}
                  className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3 hover:border-purple-300 hover:bg-purple-50 transition"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{fullName}</p>
                    <p className="truncate text-sm text-slate-500">
                      {deal.company?.name || 'No company'}
                      {product && ` · ${product}`}
                      {volume && ` · ${formatVolume(volume)} units`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-slate-500">
                    {deal.expected_close_date ? (
                      <>
                        <p className="font-medium text-slate-700">Close by</p>
                        <p>{formatDate(deal.expected_close_date)}</p>
                      </>
                    ) : (
                      <p>No close date</p>
                    )}
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
