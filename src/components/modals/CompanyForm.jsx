import React, { useEffect, useState } from 'react';
import { toast } from '../../utils/toast';

const INDUSTRIES = [
  'Energy', 'Finance', 'Technology', 'Government', 'Media',
  'Manufacturing', 'Agriculture', 'Trading', 'Consulting', 'Other',
];

export default function CompanyForm({ company, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', industry: '', country: '', website: '', notes: '',
  });

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || '',
        industry: company.industry || '',
        country: company.country || '',
        website: company.website || '',
        notes: company.notes || '',
      });
    }
  }, [company]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        industry: form.industry || null,
        country: form.country.trim() || null,
        website: form.website.trim() || null,
        notes: form.notes.trim() || null,
      });
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save company');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{company ? 'Edit Company' : 'New Company'}</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5 text-sm font-medium text-slate-700">
            Company name <span className="text-rose-500">*</span>
            <input value={form.name} onChange={set('name')} required
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Company name" />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Industry
              <select value={form.industry} onChange={set('industry')}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none">
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Country
              <input value={form.country} onChange={set('country')}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Country" />
            </label>
          </div>

          <label className="block space-y-1.5 text-sm font-medium text-slate-700">
            Website
            <input value={form.website} onChange={set('website')} type="text"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="https://example.com" />
          </label>

          <label className="block space-y-1.5 text-sm font-medium text-slate-700">
            Notes
            <textarea value={form.notes} onChange={set('notes')} rows={3}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Notes about this company" />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving || !form.name.trim()}
              className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Saving…' : company ? 'Save changes' : 'Create company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
