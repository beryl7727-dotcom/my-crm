import ActivityEvent from './ActivityEvent';

function getTimeBucket(dateValue) {
  if (!dateValue) return 'morning';
  const date = new Date(dateValue);
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

const BUCKETS = [
  { key: 'morning',   label: 'Morning',   range: 'Before 12 pm' },
  { key: 'afternoon', label: 'Afternoon', range: '12 pm – 5 pm' },
  { key: 'evening',   label: 'Evening',   range: 'After 5 pm' },
];

// Lists activities for a single day, grouped into morning / afternoon / evening.
export default function DailyView({ activities, onEventClick }) {
  if (activities.length === 0) {
    return (
      <div className="py-14 text-center">
        <p className="mb-2 text-3xl">📅</p>
        <p className="text-slate-500 font-medium">No activities scheduled for this day.</p>
        <p className="mt-1 text-sm text-slate-400">Use "+ Log Activity" to add one.</p>
      </div>
    );
  }

  const byBucket = { morning: [], afternoon: [], evening: [] };
  activities.forEach((a) => {
    byBucket[getTimeBucket(a.activity_date)].push(a);
  });

  return (
    <div className="space-y-6">
      {BUCKETS.map(({ key, label, range }) => {
        const items = byBucket[key];
        if (items.length === 0) return null;
        return (
          <div key={key}>
            <div className="mb-2 flex items-baseline gap-2">
              <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
              <span className="text-xs text-slate-400">{range}</span>
            </div>
            <div className="space-y-2">
              {items.map((activity) => (
                <ActivityEvent key={activity.id} activity={activity} onClick={onEventClick} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
