import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanies } from '../hooks/useCompanies';
import CompanyForm from '../components/modals/CompanyForm';
import ImportCompaniesModal from '../components/modals/ImportCompaniesModal';
import { toast } from '../utils/toast';

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : '—';

const fmtCurrency = (v) =>
  v ? `$${Number(v).toLocaleString()}` : '—';

export default function CompanyManagement() {
  const navigate = useNavigate();
  const { companies, loading, error, createCompany, updateCompany, deleteCompany, importCompanies, refresh } = useCompanies();

  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = companies.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (payload) => {
    if (editingCompany) {
      await updateCompany(editingCompany.id, payload);
      toast.success('Company updated');
    } else {
      await createCompany(payload);
      toast.success('Company created');
    }
    setEditingCompany(null);
    setShowForm(false);
  };

  const handleDelete = async (company) => {
    if (!window.confirm(`Delete "${company.name}"? This cannot be undone.`)) return;
    try {
      await deleteCompany(company.id);
      toast.success('Company deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete company');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-700">
        <h2 className="text-xl font-semibold">Unable to load companies</h2>
        <p>{error.message || String(error)}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Companies</h1>
          <p className="mt-1 text-sm text-slate-500">{companies.length} companies</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Import CSV
          </button>
          <button
            onClick={() => { setEditingCompany(null); setShowForm(true); }}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + New Company
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies…"
          className="w-full rounded-3xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-700"
          >✕</button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-lg font-semibold text-slate-700">No companies found</p>
          <p className="mt-2 text-sm text-slate-500">
            {search ? 'Try a different search.' : 'Add your first company to get started.'}
          </p>
          {!search && (
            <button
              onClick={() => { setEditingCompany(null); setShowForm(true); }}
              className="mt-4 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + New Company
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Company</th>
                <th className="px-5 py-3 text-left">Industry</th>
                <th className="px-5 py-3 text-right">Contacts</th>
                <th className="px-5 py-3 text-right">Active Deals</th>
                <th className="px-5 py-3 text-right">Total Revenue</th>
                <th className="px-5 py-3 text-left">Last Activity</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filtered.map((company) => (
                <tr key={company.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{company.name}</p>
                      {company.country && <p className="text-xs text-slate-400">{company.country}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{company.industry || '—'}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => navigate(`/contacts?company=${company.id}`)}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      {company.contact_count}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className={`font-semibold ${company.active_rel_count > 0 ? 'text-purple-700' : 'text-slate-400'}`}>
                      {company.active_rel_count}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-slate-700">
                    {fmtCurrency(company.total_revenue)}
                  </td>
                  <td className="px-5 py-4 text-slate-600 text-xs">{fmt(company.last_activity)}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditingCompany(company); setShowForm(true); }}
                        className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(company)}
                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <CompanyForm
          company={editingCompany}
          onClose={() => { setShowForm(false); setEditingCompany(null); }}
          onSave={handleSave}
        />
      )}

      {showImport && (
        <ImportCompaniesModal
          onClose={() => setShowImport(false)}
          onImport={importCompanies}
        />
      )}
    </div>
  );
}
