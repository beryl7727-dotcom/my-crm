import { useNavigate } from 'react-router-dom';

// Row of up to 5 company cards for companies with the most structuring deals this month.
// Each card shows the company name and deal count, and clicking it navigates to the
// contacts page filtered by that company (or shows company deals inline if no nav).
export default function PriorityCompanies({ companies = [], onCompanyClick }) {
  const navigate = useNavigate();

  if (companies.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
        No companies with structuring deals this month.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {companies.map((company) => (
        <button
          key={company.id}
          type="button"
          onClick={() => onCompanyClick ? onCompanyClick(company) : navigate(`/contacts?company=${company.id}`)}
          className="flex flex-col items-start gap-1.5 rounded-2xl border border-purple-200 bg-purple-50 p-4 text-left transition hover:border-purple-400 hover:bg-purple-100"
        >
          <p className="line-clamp-2 font-semibold text-slate-900 text-sm leading-snug">{company.name}</p>
          <span className="rounded-full bg-purple-600 px-2.5 py-0.5 text-xs font-bold text-white">
            {company.deals.length} {company.deals.length === 1 ? 'deal' : 'deals'}
          </span>
          <p className="text-xs text-purple-600">in structuring</p>
        </button>
      ))}
    </div>
  );
}
