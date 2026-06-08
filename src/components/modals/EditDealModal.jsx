import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { toast } from '../../utils/toast';
import { useDealMutations } from '../../hooks/useDealMutations';
import { dealRules } from '../../utils/dealValidation';
import { STAGES, STAGE_LABELS, STAGE_COLORS, CONTACT_TYPES, NEXT_ACTION_TYPES } from '../../utils/relationshipStages';

export default function EditDealModal({ deal, onClose, onUpdated }) {
  const { updateDeal, loading } = useDealMutations();
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [companyQuery, setCompanyQuery] = useState('');
  const [contactQuery, setContactQuery] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: deal?.title || '',
      company_id: deal?.company_id || '',
      primary_contact_id: deal?.primary_contact_id || '',
      value: deal?.value ?? '',
      stage: deal?.stage || 'relationship',
      probability: deal?.probability ?? 0,
      expected_close_date: deal?.expected_close_date ? deal.expected_close_date.split('T')[0] : '',
      description: deal?.description || '',
      contact_type: deal?.contact_type || '',
      relationship_score: deal?.relationship_score ?? '',
      last_contact_date: deal?.last_contact_date ? deal.last_contact_date.split('T')[0] : '',
      next_action_type: deal?.next_action_type || '',
      next_contact_date: deal?.next_contact_date ? deal.next_contact_date.split('T')[0] : '',
    },
  });

  const selectedStage = watch('stage');

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [companiesRes, contactsRes] = await Promise.all([
          supabase.from('companies').select('id,name').order('name', { ascending: true }),
          supabase.from('contacts').select('id,first_name,last_name').order('first_name', { ascending: true }),
        ]);
        if (companiesRes.error) throw companiesRes.error;
        if (contactsRes.error) throw contactsRes.error;
        setCompanies(companiesRes.data || []);
        setContacts(contactsRes.data || []);
      } catch (err) {
        console.error('Failed to load deal options', err);
        toast.error('Unable to load company or contact options');
      }
    };
    fetchOptions();
  }, []);

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => company.name.toLowerCase().includes(companyQuery.toLowerCase()));
  }, [companies, companyQuery]);

  const filteredContacts = useMemo(() => {
    return contacts.filter((item) =>
      `${item.first_name || ''} ${item.last_name || ''}`.toLowerCase().includes(contactQuery.toLowerCase())
    );
  }, [contacts, contactQuery]);

  const onSubmit = async (values) => {
    try {
      if (!values.title || !values.company_id || !values.primary_contact_id) {
        throw new Error('Please complete all required fields.');
      }

      const updated = await updateDeal(deal.id, {
        title: values.title.trim(),
        company_id: values.company_id,
        primary_contact_id: values.primary_contact_id,
        value: values.value === '' ? null : Number(values.value),
        stage: values.stage,
        probability: Number(values.probability) || 0,
        expected_close_date: values.expected_close_date || null,
        description: values.description?.trim() || null,
        contact_type: values.contact_type || null,
        relationship_score: values.relationship_score === '' ? null : Number(values.relationship_score),
        last_contact_date: values.last_contact_date || null,
        next_action_type: values.next_action_type || null,
        next_contact_date: values.next_contact_date || null,
      });

      toast.success('Relationship updated');
      onUpdated && onUpdated(updated);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to update relationship');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Edit Relationship</h2>
            <p className="text-sm text-slate-500">Update the relationship details and stage.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            Close
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {STAGES.map((stage) => {
            const colors = STAGE_COLORS[stage];
            return (
              <button
                key={stage}
                type="button"
                onClick={() => setValue('stage', stage)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedStage === stage ? colors.solid : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {STAGE_LABELS[stage]}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Title</label>
              <input
                {...register('title', dealRules.title)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              />
              {errors.title && <p className="text-sm text-rose-600">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Stage</label>
              <select
                {...register('stage')}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {STAGE_LABELS[stage]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium text-slate-700">Company</label>
              <input
                type="search"
                value={companyQuery}
                onChange={(e) => setCompanyQuery(e.target.value)}
                placeholder="Search companies"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              />
              <select
                {...register('company_id', dealRules.company_id)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select a company</option>
                {filteredCompanies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {errors.company_id && <p className="text-sm text-rose-600">{errors.company_id.message}</p>}
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium text-slate-700">Primary Contact</label>
              <input
                type="search"
                value={contactQuery}
                onChange={(e) => setContactQuery(e.target.value)}
                placeholder="Search contacts"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              />
              <select
                {...register('primary_contact_id', dealRules.primary_contact_id)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select a primary contact</option>
                {filteredContacts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {`${item.first_name || ''} ${item.last_name || ''}`.trim()}
                  </option>
                ))}
              </select>
              {errors.primary_contact_id && (
                <p className="text-sm text-rose-600">{errors.primary_contact_id.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Value</label>
              <input
                type="number"
                step="0.01"
                {...register('value', dealRules.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Probability</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  {...register('probability', dealRules.probability)}
                  className="w-full"
                />
                <span className="w-12 text-right text-sm text-slate-600">{watch('probability')}%</span>
              </div>
              {errors.probability && <p className="text-sm text-rose-600">{errors.probability.message}</p>}
            </div>
            {(selectedStage === 'structuring' || selectedStage === 'execution') && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Expected Close Date</label>
                <input
                  type="date"
                  {...register('expected_close_date')}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Contact type</label>
              <select
                {...register('contact_type')}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select type</option>
                {CONTACT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Relationship score</label>
              <select
                {...register('relationship_score', dealRules.relationship_score)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">No score</option>
                <option value="1">★☆☆☆☆ (1)</option>
                <option value="2">★★☆☆☆ (2)</option>
                <option value="3">★★★☆☆ (3)</option>
                <option value="4">★★★★☆ (4)</option>
                <option value="5">★★★★★ (5)</option>
              </select>
              {errors.relationship_score && <p className="text-sm text-rose-600">{errors.relationship_score.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Last contact date</label>
              <input
                type="date"
                {...register('last_contact_date')}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Next action</label>
              <select
                {...register('next_action_type')}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select action</option>
                {NEXT_ACTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Next contact date</label>
              <input
                type="date"
                {...register('next_contact_date')}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="lg:col-span-2 space-y-2">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

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
              disabled={isSubmitting || loading}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting || loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
