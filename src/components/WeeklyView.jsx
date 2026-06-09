import ActivityEvent from './ActivityEvent';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getWeekDays(date) {
  const d = new Date(date);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow; // shift to Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day;
  });
}

// Seven-column Mon–Sun grid. Each column shows activity event pills for that day.
// Clicking a day header drills down to the daily view.
export default function WeeklyView({ activities, currentDate, onEventClick, onDayClick }) {
  const today = new Date();
  const weekDays = getWeekDays(currentDate);

  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-2">
      {weekDays.map((day, idx) => {
        const dayActivities = activities.filter(
          (a) => a.activity_date && isSameDay(new Date(a.activity_date), day)
        );
        const isToday = isSameDay(day, today);

        return (
          <div key={idx} className="flex flex-col gap-1 min-w-0">
            <button
              type="button"
              onClick={() => onDayClick && onDayClick(day)}
              className={`rounded-xl px-1 py-2 text-center transition ${
                isToday ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <p className="text-xs font-medium">{DAY_LABELS[idx]}</p>
              <p className="text-lg font-bold">{day.getDate()}</p>
              {dayActivities.length > 0 && (
                <p className={`text-xs ${isToday ? 'text-blue-100' : 'text-slate-400'}`}>
                  {dayActivities.length}
                </p>
              )}
            </button>

            <div className="space-y-1 overflow-hidden">
              {dayActivities.slice(0, 3).map((a) => (
                <ActivityEvent key={a.id} activity={a} onClick={onEventClick} compact />
              ))}
              {dayActivities.length > 3 && (
                <button
                  type="button"
                  onClick={() => onDayClick && onDayClick(day)}
                  className="pl-1 text-xs text-slate-400 hover:text-slate-600"
                >
                  +{dayActivities.length - 3} more
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
