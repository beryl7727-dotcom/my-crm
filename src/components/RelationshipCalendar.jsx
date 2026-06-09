import { useMemo, useState } from 'react';
import { useRelationshipCalendar } from '../hooks/useRelationshipCalendar';
import { getActivityMeta } from '../utils/activityMeta';
import DailyView from './DailyView';
import WeeklyView from './WeeklyView';
import MonthlyView from './MonthlyView';
import LogActivityModal from './modals/LogActivityModal';

const VIEWS = ['daily', 'weekly', 'monthly'];

// ─── date helpers ─────────────────────────────────────────────────────────────

function toISO(date) {
  return date.toISOString().slice(0, 10);
}

function getDateRange(view, date) {
  const d = new Date(date);
  if (view === 'daily') {
    const s = toISO(d);
    return { startDate: s, endDate: s };
  }
  if (view === 'weekly') {
    const dow = d.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    const mon = new Date(d);
    mon.setDate(d.getDate() + diff);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { startDate: toISO(mon), endDate: toISO(sun) };
  }
  // monthly
  const y = d.getFullYear();
  const m = d.getMonth();
  return {
    startDate: toISO(new Date(y, m, 1)),
    endDate: toISO(new Date(y, m + 1, 0)),
  };
}

function formatLabel(view, date) {
  const d = new Date(date);
  if (view === 'daily') {
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
  if (view === 'weekly') {
    const dow = d.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    const mon = new Date(d);
    mon.setDate(d.getDate() + diff);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const fmt = (dt) => dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${fmt(mon)} – ${fmt(sun)}, ${sun.getFullYear()}`;
  }
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function shiftDate(view, date, direction) {
  const d = new Date(date);
  if (view === 'daily') d.setDate(d.getDate() + direction);
  else if (view === 'weekly') d.setDate(d.getDate() + direction * 7);
  else d.setMonth(d.getMonth() + direction);
  return d;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function RelationshipCalendar() {
  const [view, setView] = useState('weekly');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showLogActivity, setShowLogActivity] = useState(false);

  const { startDate, endDate } = useMemo(
    () => getDateRange(view, currentDate),
    [view, currentDate]
  );

  const { activities, loading, refresh } = useRelationshipCalendar({ startDate, endDate });

  const handleDayClick = (day) => {
    setCurrentDate(day);
    setView('daily');
  };

  const selectedMeta = selectedActivity ? getActivityMeta(selectedActivity) : null;

  return (
    <div className="space-y-4">
      {/* ── header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentDate(shiftDate(view, currentDate, -1))}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition"
          >
            ◀
          </button>
          <span className="min-w-[200px] text-center text-sm font-semibold text-slate-700">
            {formatLabel(view, currentDate)}
          </span>
          <button
            type="button"
            onClick={() => setCurrentDate(shiftDate(view, currentDate, 1))}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition"
          >
            ▶
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            className="rounded-xl border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-xl border border-slate-200">
            {VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  view === v ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowLogActivity(true)}
            className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
          >
            + Log Activity
          </button>
        </div>
      </div>

      {/* ── selected activity detail panel ── */}
      {selectedActivity && selectedMeta && (
        <div className={`rounded-2xl border p-4 ${selectedMeta.bg} ${selectedMeta.border}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="text-xl">{selectedMeta.icon}</span>
              <div>
                <p className={`font-semibold ${selectedMeta.text}`}>{selectedActivity.title}</p>
                <p className="text-xs text-slate-500 capitalize mt-0.5">
                  {selectedActivity.activity_type}
                  {selectedActivity.contact && (
                    <> · {[selectedActivity.contact.first_name, selectedActivity.contact.last_name].filter(Boolean).join(' ')}</>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedActivity(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          {selectedActivity.description && (
            <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{selectedActivity.description}</p>
          )}
        </div>
      )}

      {/* ── calendar body ── */}
      {loading ? (
        <div className="py-10 text-center text-sm text-slate-400">Loading activities…</div>
      ) : view === 'daily' ? (
        <DailyView activities={activities} onEventClick={setSelectedActivity} />
      ) : view === 'weekly' ? (
        <WeeklyView
          activities={activities}
          currentDate={currentDate}
          onEventClick={setSelectedActivity}
          onDayClick={handleDayClick}
        />
      ) : (
        <MonthlyView
          activities={activities}
          year={currentDate.getFullYear()}
          month={currentDate.getMonth()}
          onDayClick={handleDayClick}
        />
      )}

      {showLogActivity && (
        <LogActivityModal
          onClose={() => setShowLogActivity(false)}
          onLogged={() => { setShowLogActivity(false); refresh(); }}
        />
      )}
    </div>
  );
}
