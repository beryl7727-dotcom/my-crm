import { getActivityMeta } from '../utils/activityMeta';

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDOW = firstDay.getDay(); // 0 = Sun
  const offset = startDOW === 0 ? 6 : startDOW - 1; // Convert to Monday-first

  const cells = [];
  for (let i = 0; i < offset; i++) {
    cells.push({ date: new Date(year, month, 1 - offset + i), isCurrentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  const remainder = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remainder; i++) {
    cells.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }
  return cells;
}

// Month grid (Mon–Sun columns). Each cell shows the day number and up to 4 colored
// dot indicators for that day's activities. Click a cell to drill to daily view.
export default function MonthlyView({ activities, year, month, onDayClick }) {
  const today = new Date();
  const cells = buildMonthGrid(year, month);

  return (
    <div>
      <div className="mb-1 grid grid-cols-7">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px rounded-2xl overflow-hidden bg-slate-200">
        {cells.map(({ date, isCurrentMonth }, idx) => {
          const dayActivities = activities.filter(
            (a) => a.activity_date && isSameDay(new Date(a.activity_date), date)
          );
          const isToday = isSameDay(date, today);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onDayClick && onDayClick(date)}
              className={`flex min-h-[64px] flex-col items-start gap-0.5 bg-white p-1.5 transition hover:bg-slate-50 ${
                !isCurrentMonth ? 'opacity-35' : ''
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                  isToday ? 'bg-blue-600 text-white' : 'text-slate-700'
                }`}
              >
                {date.getDate()}
              </span>
              {dayActivities.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {dayActivities.slice(0, 4).map((a) => {
                    const meta = getActivityMeta(a);
                    return (
                      <span key={a.id} className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                    );
                  })}
                  {dayActivities.length > 4 && (
                    <span className="text-slate-300 text-xs leading-none">+</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
