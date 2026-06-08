import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '../../utils/toast';
import { useDealMutations } from '../../hooks/useDealMutations';
import { activityRules } from '../../utils/dealValidation';

const ACTIVITY_TYPES = ['call', 'email', 'note', 'meeting'];

export default function LogActivityModal({ contactId = null, dealId = null, onClose, onLogged }) {
  const { createActivity, loading } = useDealMutations();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      activity_type: 'call',
      title: '',
      description: '',
      activity_date: new Date().toISOString().slice(0, 10),
    },
  });

  const selectedType = watch('activity_type');

  useEffect(() => {
    if (contactId) setValue('contact_id', contactId);
  }, [contactId, setValue]);

  const onSubmit = async (values) => {
    try {
      if (!values.title || !values.activity_type) {
        toast.error('Title and activity type are required');
        return;
      }

      const payload = {
        contact_id: contactId || null,
        deal_id: dealId || null,
        activity_type: values.activity_type,
        title: values.title.trim(),
        description: values.description?.trim() || null,
        activity_date: values.activity_date ? new Date(values.activity_date).toISOString() : new Date().toISOString(),
      };

      const data = await createActivity(payload);
      toast.success('Activity logged');
      onLogged && onLogged(data);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to log activity');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Log Activity</h2>
            <p className="text-sm text-slate-500">Record a call, email, meeting or note.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium text-slate-700">Type</label>
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_TYPES.map((type) => (
                  <label
                    key={type}
                    className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition ${
                      selectedType === type
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      value={type}
                      {...register('activity_type', activityRules.activity_type)}
                      className="hidden"
                    />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </label>
                ))}
              </div>
              {errors.activity_type && <p className="text-sm text-rose-600">{errors.activity_type.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Title</label>
              <input
                {...register('title', activityRules.title)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Discussed timeline"
              />
              {errors.title && <p className="text-sm text-rose-600">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Date</label>
              <input
                type="date"
                {...register('activity_date', activityRules.activity_date)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              />
              {errors.activity_date && <p className="text-sm text-rose-600">{errors.activity_date.message}</p>}
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
              {isSubmitting || loading ? 'Saving...' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
