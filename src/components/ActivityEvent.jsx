import { getActivityMeta } from '../utils/activityMeta';

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  // Skip midnight — signals no specific time, not 12 am.
  if (date.getHours() === 0 && date.getMinutes() === 0) return '';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

// Rendered in two modes:
//   compact=false (default) — full card used in DailyView
//   compact=true — small pill used in WeeklyView cells
export default function ActivityEvent({ activity, onClick, compact = false }) {
  const meta = getActivityMeta(activity);
  const contact = activity.contact;
  const contactName = contact
    ? [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim()
    : null;
  const time = formatTime(activity.activity_date);

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onClick && onClick(activity)}
        title={activity.title}
        className={`inline-flex w-full items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition hover:opacity-80 truncate ${meta.bg} ${meta.text} ${meta.border}`}
      >
        <span className="shrink-0">{meta.icon}</span>
        <span className="truncate">{activity.title || 'Activity'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick && onClick(activity)}
      className={`flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition hover:opacity-80 ${meta.bg} ${meta.border}`}
    >
      <span className="shrink-0 text-lg leading-none">{meta.icon}</span>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${meta.text}`}>{activity.title || 'Activity'}</p>
        {contactName && <p className="truncate text-xs text-slate-500 mt-0.5">{contactName}</p>}
        {time && <p className="text-xs text-slate-400 mt-0.5">{time}</p>}
      </div>
    </button>
  );
}
