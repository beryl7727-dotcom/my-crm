import { useEffect, useRef, useState } from 'react';
import DealCard from './DealCard';
import { DEFAULT_CARD_FIELDS } from '../utils/cardFields';
import { STAGE_LABELS as DEFAULT_LABELS, STAGE_COLORS } from '../utils/relationshipStages';

const STORAGE_KEY = 'crm_card_fields';

const FIELD_OPTIONS = [
  { key: 'company',     label: 'Company' },
  { key: 'score',       label: 'Relationship score' },
  { key: 'lastContact', label: 'Last contact date' },
  { key: 'daysSince',   label: 'Days since contact' },
  { key: 'nextAction',  label: 'Next action' },
  { key: 'value',       label: 'Deal value' },
];

function loadFields() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return Object.assign({}, DEFAULT_CARD_FIELDS, JSON.parse(raw));
  } catch { /* ignore */ }
  return Object.assign({}, DEFAULT_CARD_FIELDS);
}

function CardFieldSettings({ fields, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(function() {
    if (!open) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return function() { document.removeEventListener('mousedown', handler); };
  }, [open]);

  function toggle(key) {
    const next = Object.assign({}, fields, { [key]: !fields[key] });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    onChange(next);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={function() { setOpen(function(v) { return !v; }); }}
        title="Customise card fields"
        className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
        Fields
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
          <p className="px-4 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Show on card</p>
          {FIELD_OPTIONS.map(function(opt) {
            return (
              <label key={opt.key} className="flex cursor-pointer items-center gap-3 px-4 py-1.5 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={!!fields[opt.key]}
                  onChange={function() { toggle(opt.key); }}
                  className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatCurrency(amount) {
  if (!amount) return '$0';
  const n = Number(amount);
  if (isNaN(n)) return '$0';
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return '$' + Math.round(n / 1000) + 'K';
  return '$' + n;
}

export default function KanbanBoard({ stages = [], stageLabels = DEFAULT_LABELS, dealsByStage = {}, onMove, onOpenDeal }) {

  const [visibleFields, setVisibleFields] = useState(loadFields);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <CardFieldSettings fields={visibleFields} onChange={setVisibleFields} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stages.map(function(stage) {
          const deals = dealsByStage[stage] || [];
          const totalValue = deals.reduce(function(s, d) { return s + (Number(d.value) || 0); }, 0);
          const colors = STAGE_COLORS[stage] || STAGE_COLORS.relationship;
          return (
            <div
              key={stage}
              onDragOver={function(e) { e.preventDefault(); }}
              onDrop={function(e) {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain');
                if (id && onMove) onMove(id, stage);
              }}
              className="bg-gray-50 p-3 rounded-md min-h-[200px]"
            >
              <div className={'flex flex-col gap-1 mb-3 rounded-lg px-3 py-2 ' + colors.bg}>
                <h4 className={'font-semibold text-sm ' + colors.text}>{stageLabels[stage] || stage}</h4>
                <div className={'text-xs ' + colors.text}>
                  {deals.length} {deals.length === 1 ? 'relationship' : 'relationships'} &bull; {formatCurrency(totalValue)} potential
                </div>
              </div>

              <div className="space-y-2">
                {deals.map(function(deal) {
                  return (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onOpen={function() { if (onOpenDeal) onOpenDeal(deal); }}
                      visibleFields={visibleFields}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
