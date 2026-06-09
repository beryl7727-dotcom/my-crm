import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { toast } from '../../utils/toast';
import { useDealMutations } from '../../hooks/useDealMutations';
import { validateDealRequired, dealRules } from '../../utils/dealValidation';
import { STAGES, STAGE_LABELS, CONTACT_TYPES, NEXT_ACTION_TYPES } from '../../utils/relationshipStages';

const PRODUCTS = ['I-REC', 'GO', 'REC', 'Carbon'];

function ReadOnlyField({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

export default function NewDealModal({ onClose, onCreated, initialContactId = null, initialContact = null }) {
  const contact = initialContact;
  const contactName = contact?.full_name ||
    [contact?.first_name, contact?.last_name].filter(Boolean).join(' ') || '';

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      title: contactName || '',
      company_id: contact?.company_id || '',
      primary_contact_id: contact?.id || initialContactId || '',
      value: '',
      stage: 'relationship',
      probability: 0,
      expected_close_date: '',
      description: '',
      contact_type: contact?.contact_type || '',
      relationship_score: contact?.relationship_score || '',
      last_contact_date: '',
      next_action_type: '',
      next_contact_date: '',
      product: '',
      supplier: '',
      buyer: '',
    },
  });

  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const { createDeal, loading } = useDealMutations();
  const watchedStage = watch('stage');

  useEffect(() => {
    if (contact) return;
    const load = async () => {
      try {
        const [{ data: comps, error: compErr }, { data: conts, error: contErr }] = await Promise.all([
          supabase.from('companies').select('id,name').order('name', { ascending: true }),
          supabase.from('contacts').select('id,first_name,last_name').order('first_name', { ascending: true }),
        ]);
        if (compErr) throw compErr;
        if (contErr) throw contErr;
        setCompanies(comps || []);
        setContacts(
          (conts || []).map((c) => ({
            ...c,
            full_name: [c.first_name, c.last_name].filter(Boolean).join(' ').trim(),
          }))
        );
      } catch (err) {
        toast.error('Unable to load companies or contacts');
      }
    };
    load();
  }, [contact]);

  useEffect(() => {
    if (initialContactId && !contact) setValue('primary_contact_id', initialContactId);
  }, [initialContactId, contact, setValue]);

  const onSubmit = async (values) => {
    try {
      if (!contact) {
        const errMsg = validateDealRequired(values);
        if (errMsg) { toast.error(errMsg); return; }
      }

      const details = {
        ...(values.product && { product: values.product }),
        ...(values.supplier && { supplier: values.supplier }),
        ...(values.buyer && { buyer: values.buyer }),
      };

      const payload = {
        title: contact ? (contactName || 'Unnamed') : values.title,
        company_id: contact ? (contact.company_id || null) : (values.company_id || null),
        primary_contact_id: contact ? contact.id : (values.primary_contact_id || null),
        value: values.value ? Number(values.value) : null,
        stage: values.stage || 'relationship',
        probability: Number(values.probability) || 0,
        expected_close_date: values.expected_close_date || null,
        description: values.description || null,
        contact_type: contact ? (contact.contact_type || null) : (values.contact_type || null),
        relationship_score: values.relationship_score ? Number(values.relationship_score) : null,
        last_contact_date: values.last_contact_date || null,
        next_action_type: values.next_action_type || null,
        next_contact_date: values.next_contact_date || null,
        ...(Object.keys(details).length > 0 && { details }),
      };

      const data = await createDeal(payload);
      toast.success('Relationship created');
      onCreated && onCreated(data);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create relationship');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 rounded-t-3xl bg-white px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                {contact ? `New Relationship` : 'New Relationship'}
              </h2>
              <p className="text-sm text-slate-500">
                {contact
                  ? `Add ${contactName} to the pipeline`
                  : 'Add a new relationship to the pipeline.'}
              </p>
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Read-only contact card when pre-filled from contacts list */}
          {contact && (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Contact</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <ReadOnlyField label="Name" value={contactName} />
                <ReadOnlyField label="Email" value={contact.email} />
                <ReadOnlyField label="Phone" value={contact.phone} />
                <ReadOnlyField label="Company" value={contact.company_name || contact.company?.name} />
                <ReadOnlyField label="Type" value={contact.contact_type} />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Standalone form (no pre-filled contact): show title, company, contact pickers */}
            {!contact && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Title
                    <input
                      {...register('title', { required: true })}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                    />
                    {errors.title && <div className="text-rose-600 text-sm">Title is required</div>}
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Company
                    <select
                      {...register('company_id', { required: true })}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                    >
                      <option value="">Select company</option>
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errors.company_id && <div className="text-rose-600 text-sm">Company is required</div>}
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Primary contact
                    <select
                      {...register('primary_contact_id', { required: true })}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                    >
                      <option value="">Select contact</option>
                      {contacts.map((c) => <option key={c.id} value={c.id}>{c.full_name || c.id}</option>)}
                    </select>
                    {errors.primary_contact_id && <div className="text-rose-600 text-sm">Primary contact is required</div>}
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Contact type
                    <select
                      {...register('contact_type')}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                    >
                      <option value="">Select type</option>
                      {CONTACT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </label>
                </div>
              </>
            )}

            {/* Relationship details section label */}
            {contact && (
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Relationship Details
              </p>
            )}

            {/* Stage + Product */}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Stage
                <select {...register('stage')} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                Product
                <select {...register('product')} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                  <option value="">Select product</option>
                  {PRODUCTS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
            </div>

            {/* Volume + Expected close */}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Volume
                <input
                  {...register('value')}
                  type="number"
                  step="0.01"
                  placeholder="e.g. 50000"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Expected close date
                <input
                  {...register('expected_close_date')}
                  type="date"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />
              </label>
            </div>

            {/* Supplier + Buyer — structuring stage only */}
            {watchedStage === 'structuring' && (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Supplier
                  <input {...register('supplier')} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Buyer
                  <input {...register('buyer')} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                </label>
              </div>
            )}

            {/* Extra fields only in the standalone (no pre-filled) form */}
            {!contact && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Relationship score
                    <select
                      {...register('relationship_score', dealRules.relationship_score)}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                    >
                      <option value="">No score</option>
                      <option value="1">★☆☆☆☆ (1)</option>
                      <option value="2">★★☆☆☆ (2)</option>
                      <option value="3">★★★☆☆ (3)</option>
                      <option value="4">★★★★☆ (4)</option>
                      <option value="5">★★★★★ (5)</option>
                    </select>
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
                    Last contact date
                    <input {...register('last_contact_date')} type="date" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Next contact date
                    <input {...register('next_contact_date')} type="date" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                  </label>
                </div>
              </>
            )}

            <label className="block space-y-2 text-sm font-medium text-slate-700">
              Notes
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Any notes about this relationship..."
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting || loading ? 'Saving…' : 'Save relationship'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
