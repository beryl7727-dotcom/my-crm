import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from '../../utils/toast';

export default function EditContactModal({ contact, onClose, onSaved }) {
  const [companies, setCompanies] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: '',
    company_id: '',
    notes: '',
    tags: '',
  });

  useEffect(() => {
    if (contact) {
      setForm({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        job_title: contact.job_title || '',
        company_id: contact.company_id || '',
        notes: contact.notes || '',
        tags: Array.isArray(contact.tags) ? contact.tags.join(', ') : contact.tags || '',
      });
    }
  }, [contact]);

  useEffect(() => {
    supabase
      .from('companies')
      .select('id,name')
      .order('name', { ascending: true })
      .then(({ data }) => setCompanies(data || []));
  }, []);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name.trim()) {
      toast.error('First name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        job_title: form.job_title.trim() || null,
        company_id: form.company_id || null,
        notes: form.notes.trim() || null,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const { data, error } = await supabase
        .from('contacts')
        .update(payload)
        .eq('id', contact.id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Contact updated');
      onSaved && onSaved(data);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to update contact');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Edit Contact</h2>
            <p className="text-sm text-slate-500">Update contact information.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              First name <span className="text-rose-500">*</span>
              <input
                value={form.first_name}
                onChange={set('first_name')}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="First name"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Last name
              <input
                value={form.last_name}
                onChange={set('last_name')}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Last name"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Email
              <input
                value={form.email}
                onChange={set('email')}
                type="email"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Email address"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Phone
              <input
                value={form.phone}
                onChange={set('phone')}
                type="tel"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Phone number"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Job title
              <input
                value={form.job_title}
                onChange={set('job_title')}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Job title"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Company
              <select
                value={form.company_id}
                onChange={set('company_id')}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">No company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1.5 text-sm font-medium text-slate-700">
            Tags
            <input
              value={form.tags}
              onChange={set('tags')}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Separate tags with commas"
            />
          </label>

          <label className="block space-y-1.5 text-sm font-medium text-slate-700">
            Notes
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={4}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Notes about this contact"
            />
          </label>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
