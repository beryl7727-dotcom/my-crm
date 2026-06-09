const QUARTERS = [
  { q: 1, label: 'Q1', months: 'Jan–Mar' },
  { q: 2, label: 'Q2', months: 'Apr–Jun' },
  { q: 3, label: 'Q3', months: 'Jul–Sep' },
  { q: 4, label: 'Q4', months: 'Oct–Dec' },
];

function getCurrentQuarter() {
  return Math.ceil((new Date().getMonth() + 1) / 3);
}

export default function QuarterSelector({ quarter, year, onQuarterChange, onYearChange }) {
  const currentYear = new Date().getFullYear();
  const currentQ = getCurrentQuarter();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onYearChange(year - 1)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition"
        >
          ◀
        </button>
        <span className="w-12 text-center text-lg font-semibold text-slate-800">{year}</span>
        <button
          type="button"
          onClick={() => onYearChange(year + 1)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition"
        >
          ▶
        </button>
      </div>

      <div className="flex rounded-xl border border-slate-200 overflow-hidden">
        {QUARTERS.map(({ q, label, months }) => {
          const isActive = quarter === q;
          const isCurrent = q === currentQ && year === currentYear;
          return (
            <button
              key={q}
              type="button"
              onClick={() => onQuarterChange(q)}
              title={months}
              className={`relative px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'bg-purple-600 text-white shadow-inner'
                  : isCurrent
                  ? 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
              {isCurrent && !isActive && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-purple-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
