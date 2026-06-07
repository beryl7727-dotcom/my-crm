import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { toast } from '../../utils/toast';
import { useDealMutations } from '../../hooks/useDealMutations';
import { validateDealRequired } from '../../utils/dealValidation';

export default function NewDealModal({ onClose, onCreated, initialContactId = null }) {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      title: '',
      company_id: '',
      contact_id: initialContactId || '',
      amount: '',
      stage: 'prospect',
      probability: 0,
      expected_close_date: '',
      description: '',
    }
  });

  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const { createDeal, loading } = useDealMutations();

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: comps, error: compErr }, { data: conts, error: contErr }] = await Promise.all([
          supabase.from('companies').select('id,name').order('name', { ascending: true }),
          supabase.from('contacts').select('id,first_name,last_name').order('first_name', { ascending: true })
        ]);
        if (compErr) throw compErr;
        if (contErr) throw contErr;
        setCompanies(comps || []);
        setContacts((conts || []).map(c => ({ ...c, full_name: [c.first_name, c.last_name].filter(Boolean).join(' ').trim() })));
      } catch (err) {
        console.error('Failed to load lists', err);
        toast.error('Unable to load companies or contacts');
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (initialContactId) setValue('contact_id', initialContactId);
  }, [initialContactId, setValue]);

  const onSubmit = async (values) => {
    try {
      const errMsg = validateDealRequired(values);
      if (errMsg) {
        toast.error(errMsg);
        return;
      }

      const payload = {
        title: values.title,
        company_id: values.company_id || null,
        contact_id: values.contact_id || null,
        amount: values.amount ? Number(values.amount) : null,
        stage: values.stage || 'prospect',
        probability: Number(values.probability) || 0,
        expected_close_date: values.expected_close_date || null,
        description: values.description || null,
      };

      const data = await createDeal(payload);
      toast.success('Deal created');
      onCreated && onCreated(data);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to create deal');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">New Deal</h2>
            <p className="text-sm text-slate-500">Create a new deal in the pipeline.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">Close</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Title
              <input {...register('title', { required: true })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              {errors.title && <div className="text-rose-600 text-sm">Title is required</div>}
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Company
              <select {...register('company_id', { required: true })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                <option value="">Select company</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.company_id && <div className="text-rose-600 text-sm">Company is required</div>}
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Primary contact
              <select {...register('contact_id', { required: true })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                <option value="">Select contact</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.full_name || c.id}</option>)}
              </select>
              {errors.contact_id && <div className="text-rose-600 text-sm">Primary contact is required</div>}
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Value
              <input {...register('amount')} type="number" step="0.01" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Stage
              <select {...register('stage')} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                <option value="prospect">Prospect</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="closed_won">Closed Won</option>
                <option value="closed_lost">Closed Lost</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Probability ({/* display */})
              <input {...register('probability')} type="range" min="0" max="100" className="w-full" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Expected close date
              <input {...register('expected_close_date')} type="date" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Description
              <textarea {...register('description')} rows={4} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm">Cancel</button>
            <button type="submit" disabled={isSubmitting || loading} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{isSubmitting || loading ? 'Saving...' : 'Save deal'}</button>
          </div>
        </form>
      </div>
    </div>
  );

  }

