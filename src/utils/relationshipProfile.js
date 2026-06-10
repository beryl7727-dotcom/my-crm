// Maps the existing CONTACT_TYPES labels (relationshipStages.js) to the icons
// and color treatments called for in the relationship profile spec.
export const CONTACT_TYPE_META = {
  Trader: { icon: '🤝', colors: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' } },
  'Corporate Buyer': { icon: '🏭', colors: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' } },
  Registry: { icon: '⚖️', colors: { dot: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' } },
  Government: { icon: '🏛️', colors: { dot: 'bg-slate-500', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' } },
  Media: { icon: '📰', colors: { dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' } },
  'Project Developer': { icon: '🌱', colors: { dot: 'bg-lime-500', bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' } },
  Exchange: { icon: '📊', colors: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' } },
  Originator: { icon: '⚡', colors: { dot: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' } },
};

export const RELATIONSHIP_SCORE_MEANINGS = {
  1: 'Cold contact — no prior interaction',
  2: 'Initial contact made — early discussion',
  3: 'Warm relationship — active discussions',
  4: 'Hot opportunity — advanced discussions',
  5: 'Proven counterparty — multiple successful trades',
};

import { ALL_PRODUCTS } from '../constants/products';

export const PRODUCT_OPTIONS = ALL_PRODUCTS.map((p) => ({ value: p, label: p }));

export const MARKET_OPTIONS = [
  { value: 'apac', label: 'APAC' },
  { value: 'emea', label: 'EMEA' },
  { value: 'americas', label: 'Americas' },
  { value: 'global', label: 'Global' },
];

export const VOLUME_OPTIONS = [
  { value: 'small', label: 'Small (1,000–10,000 units)' },
  { value: 'medium', label: 'Medium (10,000–100,000 units)' },
  { value: 'large', label: 'Large (100,000+ units)' },
];

export const PRODUCT_LABELS = Object.fromEntries(PRODUCT_OPTIONS.map((opt) => [opt.value, opt.label]));
// Also export the flat list directly for components that just need product names
export { ALL_PRODUCTS } from '../constants/products';
export const MARKET_LABELS = Object.fromEntries(MARKET_OPTIONS.map((opt) => [opt.value, opt.label]));
export const VOLUME_LABELS = Object.fromEntries(VOLUME_OPTIONS.map((opt) => [opt.value, opt.label]));

export const OPPORTUNITY_RESULTS = {
  won: { label: 'Won', colors: 'bg-emerald-100 text-emerald-700' },
  lost: { label: 'Lost', colors: 'bg-rose-100 text-rose-700' },
  pending: { label: 'Pending', colors: 'bg-amber-100 text-amber-700' },
};

// Derives a Won / Lost / Pending result for an opportunity from its stage.
// 'execution' and 'refresh' are only reachable once a trade has gone through,
// so they read as Won; everything earlier in the pipeline is still Pending.
// A relationship can be explicitly marked lost via details.outcome = 'lost'.
export function deriveOpportunityResult(relationship) {
  if (relationship?.details?.outcome === 'lost') return 'lost';
  if (relationship?.stage === 'execution' || relationship?.stage === 'refresh') return 'won';
  return 'pending';
}
