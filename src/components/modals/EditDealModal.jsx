import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { toast } from '../../utils/toast';
import { useDealMutations } from '../../hooks/useDealMutations';
import { validateDealRequired } from '../../utils/dealValidation';

export default function EditDealModal({ deal, onClose, onUpdated }) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      title: deal?.title || '',
      company_id: deal?.company_id || '',
      contact_id: deal?.contact_id || '',
      amount: deal?.amount || '',
      stage: deal?.stage || 'prospect',
      probability: deal?.probability || 0,
      expected_close_date: deal?.expected_close_date ? deal.expected_close_date.split('T')[0] : '',
      description: deal?.description || '',
    }
  });

  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const { updateDeal, moveDeal, loading } = useDealMutations();

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

  const stage = watch('stage');

  const handleMove = async (nextStage) => {
    try {
      await moveDeal(deal.id, nextStage);
      setValue('stage', nextStage);
      toast.success(`Moved to ${nextStage}`);
      onUpdated && onUpdated({ ...deal, stage: nextStage });
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to move deal');
    }
  };

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

      const updated = await updateDeal(deal.id, payload);
      toast.success('Deal updated');
      onUpdated && onUpdated(updated);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to update deal');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Edit Deal</h2>
            <p className="text-sm text-slate-500">Update deal details.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">Close</button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {['prospect','qualified','proposal','closed_won','closed_lost'].map(s => (
            <button key={s} onClick={() => handleMove(s)} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-200">
              {s === 'closed_won' ? 'Closed Won' : s === 'closed_lost' ? 'Closed Lost' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Title
              <input {...register('title', { required: true })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" defaultValue={deal.title} />
              {errors.title && <div className="text-rose-600 text-sm">Title is required</div>}
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Company
              <select {...register('company_id', { required: true })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" defaultValue={deal.company_id}>
                <option value="">Select company</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.company_id && <div className="text-rose-600 text-sm">Company is required</div>}
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Primary contact
              <select {...register('contact_id', { required: true })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" defaultValue={deal.contact_id}>
                <option value="">Select contact</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.full_name || c.id}</option>)}
              </select>
              {errors.contact_id && <div className="text-rose-600 text-sm">Primary contact is required</div>}
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Value
              <input {...register('amount')} type="number" step="0.01" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" defaultValue={deal.amount || ''} />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Stage
              <select {...register('stage')} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" defaultValue={deal.stage}>
                <option value="prospect">Prospect</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="closed_won">Closed Won</option>
                <option value="closed_lost">Closed Lost</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Probability
              <input {...register('probability')} type="range" min="0" max="100" className="w-full" defaultValue={deal.probability || 0} />
            </label>
          </div>

          {(stage === 'closed_won' || stage === 'closed_lost') && (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Close date
                <input {...register('expected_close_date')} type="date" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" defaultValue={deal.expected_close_date ? deal.expected_close_date.split('T')[0] : ''} />
              </label>
            </div>
          )}

          <div>
            <label className="space-y-2 text-sm font-medium text-slate-700">Description
              <textarea {...register('description')} rows={4} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" defaultValue={deal.description || ''} />
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm">Cancel</button>
            <button type="submit" disabled={isSubmitting || loading} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{isSubmitting || loading ? 'Saving...' : 'Save changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '../../utils/toast';
import { useDealMutations } from '../../hooks/useDealMutations';
import { dealRules } from '../../utils/dealValidation';
import { supabase } from '../../lib/supabase';

const STAGES = ['Prospect', 'Qualified', 'Proposal', 'Closed'];

export default function EditDealModal({ deal, onClose, onSuccess }) {
  const { updateDeal } = useDealMutations();
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
      title: deal.title || '',
      company_id: deal.company_id || '',
      primary_contact_id: deal.primary_contact_id || deal.contact_id || '',
      amount: deal.amount || '',
      stage: deal.stage || 'Prospect',
      probability: deal.probability || 50,
      expected_close_date: deal.expected_close_date || deal.expected_close_date || '',
      description: deal.description || '',
    },
  });

  const selectedStage = watch('stage');

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const companiesRes = await supabase.from('companies').select('id,name').order('name', { ascending: true });
        const contactsRes = await supabase.from('contacts').select('id,first_name,last_name').order('first_name', { ascending: true });
        setCompanies(companiesRes.data || []);
        setContacts(contactsRes.data || []);
      } catch (err) {
        console.error('Failed to load deal options', err);
        toast.error('Unable to load company or contact options');
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    setValue('stage', deal.stage || 'Prospect');
  }, [deal.stage, setValue]);

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) =>
      company.name.toLowerCase().includes(companyQuery.toLowerCase())
    );
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
        amount: Number(values.amount) || 0,
        stage: values.stage,
        probability: Number(values.probability) || 0,
        expected_close_date: values.expected_close_date || null,
        description: values.description?.trim() || null,
      });

      toast.success('Deal updated successfully');
      onSuccess && onSuccess(updated);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to update deal');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Edit Deal</h2>
            <p className="text-sm text-slate-500">Update the deal details and stage.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            Close
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => setValue('stage', stage)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedStage === stage
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Move to {stage}
            </button>
          ))}
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
                    {stage}
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
                {...register('amount', dealRules.amount)}
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
            {selectedStage.toLowerCase() === 'closed' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Close Date</label>
                <input
                  type="date"
                  {...register('expected_close_date')}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}
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
              disabled={isSubmitting}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
