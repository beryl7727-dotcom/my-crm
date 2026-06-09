import { useState } from 'react';
import { useDealCalendar } from '../hooks/useDealCalendar';
import { useDealMutations } from '../hooks/useDealMutations';
import QuarterSelector from './QuarterSelector';
import DealBlock from './DealBlock';
import LogActivityModal from './modals/LogActivityModal';

const QUARTER_MONTHS = [
  ['January', 'February', 'March'],
  ['April', 'May', 'June'],
  ['July', 'August', 'September'],
  ['October', 'November', 'December'],
];

function getCurrentQuarter() {
  return Math.ceil((new Date().getMonth() + 1) / 3);
}

export default function DealCalendar() {
  const [quarter, setQuarter] = useState(getCurrentQuarter);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [logDeal, setLogDeal] = useState(null);

  const { deals, loading, refresh } = useDealCalendar({ quarter, year });
  const { updateDeal } = useDealMutations();

  const handleReschedule = async (dealId, newDate) => {
    await updateDeal(dealId, { expected_close_date: newDate || null });
    refresh();
  };

  const months = QUARTER_MONTHS[quarter - 1];
  const quarterStartMonth = (quarter - 1) * 3;

  const dealsByMonth = months.map((monthName, idx) => {
    const monthIndex = quarterStartMonth + idx;
    const monthDeals = deals.filter((d) => {
      if (!d.expected_close_date) return false;
      const date = new Date(d.expected_close_date);
      return date.getFullYear() === year && date.getMonth() === monthIndex;
    });
    return { monthName, monthIndex, deals: monthDeals };
  });

  return (
    <div className="space-y-6">
      <QuarterSelector
        quarter={quarter}
        year={year}
        onQuarterChange={setQuarter}
        onYearChange={setYear}
      />

      {loading ? (
        <div className="py-10 text-center text-sm text-slate-400">Loading deals…</div>
      ) : deals.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 py-14 text-center">
          <p className="mb-2 text-3xl">🟣</p>
          <p className="font-medium text-slate-600">No structuring deals closing in Q{quarter} {year}</p>
          <p className="mt-1 text-sm text-slate-400">
            Set an expected close date on a structuring-stage deal to see it here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {dealsByMonth.map(({ monthName, deals: monthDeals }) => (
            <div key={monthName} className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-purple-800">{monthName}</h3>
                <span className="rounded-full bg-purple-200 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                  {monthDeals.length} {monthDeals.length === 1 ? 'deal' : 'deals'}
                </span>
              </div>
              {monthDeals.length === 0 ? (
                <p className="text-sm text-purple-300">No deals closing this month</p>
              ) : (
                <div className="space-y-2">
                  {monthDeals.map((deal) => (
                    <DealBlock key={deal.id} deal={deal} onReschedule={handleReschedule} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {logDeal && (
        <LogActivityModal
          dealId={logDeal.id}
          onClose={() => setLogDeal(null)}
          onLogged={() => setLogDeal(null)}
        />
      )}
    </div>
  );
}
