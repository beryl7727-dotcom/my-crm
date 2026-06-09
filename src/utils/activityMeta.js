// Color/icon metadata for calendar activity events, exported separately so
// non-component files (MonthlyView, RelationshipCalendar) can import them
// without triggering react-refresh/only-export-components in ActivityEvent.jsx.

export const ACTIVITY_META = {
  call:    { icon: '📞', bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-400' },
  meeting: { icon: '🤝', bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-400' },
  email:   { icon: '📧', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-400' },
  note:    { icon: '📝', bg: 'bg-slate-100',  text: 'text-slate-600',  border: 'border-slate-200',  dot: 'bg-slate-300' },
  message: { icon: '💬', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-400' },
};

const CHANNEL_OVERRIDES = {
  whatsapp: { icon: '📱', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-400' },
  telegram: { icon: '✈️', bg: 'bg-teal-100',   text: 'text-teal-700',   border: 'border-teal-200',   dot: 'bg-teal-400' },
  email:    { icon: '📧', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-400' },
  linkedin: { icon: '💼', bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-400' },
};

export function getActivityMeta(activity) {
  if (activity?.message_channel && CHANNEL_OVERRIDES[activity.message_channel]) {
    return CHANNEL_OVERRIDES[activity.message_channel];
  }
  return ACTIVITY_META[activity?.activity_type] || ACTIVITY_META.note;
}
