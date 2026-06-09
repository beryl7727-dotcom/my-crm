import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { toast } from '../../utils/toast';
import { useTeam } from '../../hooks/useTeam';
import { useAuth } from '../../hooks/useAuth';
import { CONTACT_TYPES } from '../../utils/relationshipStages';

const SOURCE_OPTIONS = ['RECS2025','LinkedIn','Referral','Conference / Event','Cold Outreach','Existing Client','Partner / Broker','Website','Other'];

export default function NewContactModal({ onClose, onCreated }) {
  const { currentTeam } = useTeam();
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [companyQuery, setCompanyQuery] = useState('');
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      company_id: '',
      company_name: '',
      job_title: '',
      contact_type: '',
      source: '',
      priority: '',
      region: '',
      next_touch_date: '',
      stage: '',
      notes: '',
      tags: '',
    },
  });

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const { data, error } = await supabase.from('companies').select('id,name').order('name', { ascending: true });
        if (error) throw error;
        setCompanies(data || []);
      } catch (err) {
        console.error('Failed to load companies', err);
        toast.error('Unable to load company list.');
      }
    };
    loadCompanies();
  }, []);

  const filteredCompanies = useMemo(() => {
    if (!companyQuery) return companies;
    return companies.filter((company) =>
      company.name.toLowerCase().includes(companyQuery.toLowerCase())
    );
  }, [companies, companyQuery]);

  const onSubmit = async (values) => {
    if (!values.full_name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!values.email.trim() && !values.phone.trim()) {
      toast.error('Either email or phone is required');
      return;
    }

    const payload = {
      full_name: values.full_name.trim(),
      email: values.email.trim() || null,
      phone: values.phone.trim() || null,
      company_id: values.company_id || null,
      company_name: values.company_name.trim() || null,
      job_title: values.job_title.trim() || null,
      notes: values.notes.trim() || null,
      tags: values.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      let companyId = payload.company_id;
      if (!companyId && payload.company_name) {
        const companyName = payload.company_name;
        const { data: existing, error: existingError } = await supabase
          .from('companies')
          .select('id')
          .eq('name', companyName)
          .limit(1)
          .maybeSingle();
        if (existingError) throw existingError;
        if (existing?.id) {
          companyId = existing.id;
        } else {
          const { data: createdCompany, error: createError } = await supabase
            .from('companies')
            .insert({ name: companyName, team_id: currentTeam?.id || null })
            .select()
            .single();
          if (createError) throw createError;
          companyId = createdCompany.id;
        }
      }

      const nameParts = payload.full_name.split(/\s+/).filter(Boolean);
      const [first_name, ...rest] = nameParts;
      const last_name = rest.join(' ');

      const withValue = (obj) =>
        Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== '' && v !== undefined));

      const { data, error } = await supabase
        .from('contacts')
        .insert({
          first_name: first_name || null,
          last_name: last_name || null,
          email: payload.email,
          phone: payload.phone,
          job_title: payload.job_title,
          company_id: companyId || null,
          notes: payload.notes,
          tags: payload.tags,
          team_id: currentTeam?.id || null,
          created_by: user?.id || null,
          ...withValue({
            contact_type: values.contact_type || null,
            source: values.source || null,
            priority: values.priority || null,
            region: values.region || null,
            next_touch_date: values.next_touch_date || null,
            stage: values.stage || null,
          }),
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Contact created');
      onCreated && onCreated(data);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to create contact');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">New Contact</h2>
            <p className="text-sm text-slate-500">Add a contact to the CRM.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Name
              <input
                {...register('full_name')}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Full name"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Email
              <input
                {...register('email')}
                type="email"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Email address"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Phone
              <input
                {...register('phone')}
                type="tel"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Phone number"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Title
              <input
                {...register('job_title')}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Job title"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Contact type
              <select
                {...register('contact_type')}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">No type</option>
                {CONTACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Source
              <select
                {...register('source')}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Unknown</option>
                {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Priority
              <select
                {...register('priority')}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">No priority</option>
                {['A+','A','B','C'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Stage
              <select
                {...register('stage')}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">No stage</option>
                {['Relationship','Discovery','Structuring','Execution','Refresh'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Region
              <input
                {...register('region')}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="e.g. APAC, EMEA, Americas"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Next touch date
              <input
                {...register('next_touch_date')}
                type="date"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Company
              <select
                {...register('company_id')}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              New company (optional)
              <input
                {...register('company_name')}
                value={companyQuery}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setCompanyQuery(nextValue);
                  setValue('company_name', nextValue);
                }}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Create a company"
              />
            </label>
          </div>

          <div className="space-y-2 text-sm font-medium text-slate-700">
            <label>Notes</label>
            <textarea
              {...register('notes')}
              rows={4}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Notes about this contact"
            />
          </div>

          <div className="space-y-2 text-sm font-medium text-slate-700">
            <label>Tags</label>
            <input
              {...register('tags')}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Separate tags with commas"
            />
          </div>

          {(errors.full_name || errors.email || errors.phone) && (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errors.full_name && <div>{errors.full_name.message}</div>}
              {errors.email && <div>{errors.email.message}</div>}
              {errors.phone && <div>{errors.phone.message}</div>}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Save contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
