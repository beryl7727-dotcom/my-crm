export const STAGES = ['relationship', 'discovery', 'structuring', 'execution', 'refresh'];

export const STAGE_LABELS = {
  relationship: '🔵 Relationship',
  discovery: '🟡 Discovery',
  structuring: '🟣 Structuring',
  execution: '⚡ Execution',
  refresh: '⚪ Refresh',
};

export const STAGE_DESCRIPTIONS = {
  relationship: 'Create meaningful contact',
  discovery: 'Understand needs (not yet commercial)',
  structuring: 'Commercial terms forming',
  execution: 'Trade executed',
  refresh: 'Reactivate relationship',
};

// Tailwind class groups per stage, used for column headers, badges and stage dots.
export const STAGE_COLORS = {
  relationship: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', solid: 'bg-blue-600 text-white' },
  discovery: { dot: 'bg-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300', solid: 'bg-yellow-500 text-white' },
  structuring: { dot: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300', solid: 'bg-purple-600 text-white' },
  execution: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', solid: 'bg-amber-500 text-white' },
  refresh: { dot: 'bg-slate-400', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', solid: 'bg-slate-500 text-white' },
};

export const PRE_EXECUTION_STAGES = ['relationship', 'discovery', 'structuring'];

export const CONTACT_TYPES = [
  'Trader',
  'Corporate Buyer',
  'Registry',
  'Government',
  'Media',
  'Project Developer',
  'Exchange',
  'Originator',
];

export const NEXT_ACTION_TYPES = ['Email', 'WhatsApp', 'Call', 'Meeting'];

export const NEXT_ACTION_ICONS = {
  Email: '✉️',
  WhatsApp: '💬',
  Call: '📞',
  Meeting: '🤝',
};

export const RECURRING_INTERVALS = [30, 60, 90, 180];
