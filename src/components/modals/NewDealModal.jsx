import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { toast } from '../../utils/toast';
import { useDealMutations } from '../../hooks/useDealMutations';
import { validateDealRequired, dealRules } from '../../utils/dealValidation';
import { STAGES, STAGE_LABELS, CONTACT_TYPES, NEXT_ACTION_TYPES } from '../../utils/relationshipStages';

export default function NewDealModal({ onClose, onCreated, initialContactId = null }) {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      title: '',
      company_id: '',
      primary_contact_id: initialContactId || '',
      value: '',
      stage: 'relationship',
      probability: 0,
      expected_close_date: '',
      description: '',
      contact_type: '',
      relationship_score: '',
      last_contact_date: '',
      next_action_type: '',
      next_contact_date: '',
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
    if (initialContactId) setValue('primary_contact_id', initialContactId);
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
        primary_contact_id: values.primary_contact_id || null,
        value: values.value ? Number(values.value) : null,
        stage: values.stage || 'relationship',
        probability: Number(values.probability) || 0,
        expected_close_date: values.expected_close_date || null,
        description: values.description || null,
        contact_type: values.contact_type || null,
        relationship_score: values.relationship_score ? Number(values.relationship_score) : null,
        last_contact_date: values.last_contact_date || null,
        next_action_type: values.next_action_type || null,
        next_contact_date: values.next_contact_date || null,
      };

      const data = await createDeal(payload);
      toast.success('Relationship created');
      onCreated && onCreated(data);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to create relationship');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">New Relationship</h2>
            <p className="text-sm text-slate-500">Add a new relationship to the pipeline.</p>
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
              <select {...register('primary_contact_id', { required: true })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                <option value="">Select contact</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.full_name || c.id}</option>)}
              </select>
              {errors.primary_contact_id && <div className="text-rose-600 text-sm">Primary contact is required</div>}
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Value
              <input {...register('value')} type="number" step="0.01" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Stage
              <select {...register('stage')} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>{STAGE_LABELS[stage]}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Probability ({/* display */})
              <input {...register('probability')} type="range" min="0" max="100" className="w-full" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Contact type
              <select {...register('contact_type')} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                <option value="">Select type</option>
                {CONTACT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Relationship score
              <select {...register('relationship_score', dealRules.relationship_score)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                <option value="">No score</option>
                <option value="1">★☆☆☆☆ (1)</option>
                <option value="2">★★☆☆☆ (2)</option>
                <option value="3">★★★☆☆ (3)</option>
                <option value="4">★★★★☆ (4)</option>
                <option value="5">★★★★★ (5)</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Last contact date
              <input {...register('last_contact_date')} type="date" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Next action
              <select {...register('next_action_type')} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                <option value="">Select action</option>
                {NEXT_ACTION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Next contact date
              <input {...register('next_contact_date')} type="date" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Expected close date
              <input {...register('expected_close_date')} type="date" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
            </label>
          </div>

          <label className="block space-y-2 text-sm font-medium text-slate-700">
            Description
            <textarea {...register('description')} rows={4} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          </label>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm">Cancel</button>
            <button type="submit" disabled={isSubmitting || loading} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{isSubmitting || loading ? 'Saving...' : 'Save relationship'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

