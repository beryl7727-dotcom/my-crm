
import { STAGE_COLORS, STAGE_LABELS, NEXT_ACTION_ICONS } from '../utils/relationshipStages';
import { CONTACT_TYPE_META } from '../utils/relationshipProfile';
import QuickMessageButtons from './QuickMessageButtons';
import ContactTypeIcon from './ContactTypeIcon';
import RelationshipScoreStar from './RelationshipScoreStar';

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

import { DEFAULT_CARD_FIELDS } from '../utils/cardFields';
import { PRODUCT_TIER, TIER_PRODUCTS } from '../constants/products';
export { DEFAULT_CARD_FIELDS };

export default function DealCard({ deal, onOpen, onQuickMessage, visibleFields = DEFAULT_CARD_FIELDS }) {
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
  const product = deal.details?.product || null;
  const productTierNum = product ? PRODUCT_TIER[product] : null;
  const productTierMeta = productTierNum ? TIER_PRODUCTS[productTierNum] : null;
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

  const typeMeta = CONTACT_TYPE_META[deal.contact_type];
  const tintClasses = typeMeta ? `${typeMeta.colors.bg} ${typeMeta.colors.border}` : 'bg-white border-gray-200';

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onOpen && onOpen(deal)}
      className={`${tintClasses} hover:border-blue-300 p-3 rounded-md cursor-pointer shadow-sm hover:shadow-md transition border`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <ContactTypeIcon type={deal.contact_type} size="sm" />
          <h5 className="truncate font-semibold text-sm text-slate-900">{contactName || 'No contact'}</h5>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {productTierMeta && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${productTierMeta.colors.badge}`}
              title={`${productTierMeta.emoji} ${productTierMeta.title}: ${product}`}
            >
              {productTierMeta.emoji}
            </span>
          )}
          <span
            className={'mt-0.5 h-2.5 w-2.5 rounded-full ' + colors.dot}
            title={STAGE_LABELS[deal.stage] || deal.stage}
          />
        </div>
      </div>
      {product && (
        <p className={`mt-0.5 text-xs font-medium ${productTierMeta ? productTierMeta.colors.text : 'text-slate-500'}`}>
          {product}
        </p>
      )}

      {show('company') && companyName && (
        <p className="mt-0.5 text-xs text-slate-500 truncate">{companyName}</p>
      )}

      {show('score') && (
        <div className="mt-1">
          <RelationshipScoreStar score={deal.relationship_score} readOnly size="sm" />
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

      {deal.contact && onQuickMessage && (
        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
          <span className="text-xs text-slate-400">Quick message</span>
          <QuickMessageButtons
            contact={deal.contact}
            deal={deal}
            onSelectChannel={onQuickMessage}
          />
        </div>
      )}
    </div>
  );
}
