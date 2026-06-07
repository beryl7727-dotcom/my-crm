import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '../../utils/toast';
import { useDealMutations } from '../../hooks/useDealMutations';
import { supabase } from '../../lib/supabase';

export default function LogActivityModal({ contactId = null, onClose, onLogged }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, setValue } = useForm({
    defaultValues: {
      type: 'call',
      title: '',
      description: '',
      date_time: new Date().toISOString().split('T')[0],
      duration: '',
      contact_id: contactId || '',
    }
  });

  const { createActivity } = useDealMutations();
  const type = watch('type');

  useEffect(() => {
    if (contactId) setValue('contact_id', contactId);
  }, [contactId, setValue]);

  const onSubmit = async (values) => {
    try {
      if (!values.title || !values.contact_id) {
        toast.error('Title and contact are required');
        return;
      }

      const payload = {
        contact_id: values.contact_id,
        type: values.type,
        title: values.title,
        note: values.description || null,
        date_time: values.date_time ? new Date(values.date_time).toISOString() : new Date().toISOString(),
        duration: (values.type === 'call' || values.type === 'meeting') ? (values.duration ? Number(values.duration) : null) : null,
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
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Log Activity</h2>
            <p className="text-sm text-slate-500">Record a call, email, meeting or note.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">Close</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Type
              <select {...register('type')} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="note">Note</option>
                <option value="meeting">Meeting</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Title
              <input {...register('title', { required: true })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              {errors.title && <div className="text-rose-600 text-sm">Title is required</div>}
            </label>
          </div>

          <div>
            <label className="space-y-2 text-sm font-medium text-slate-700">Description
              <textarea {...register('description')} rows={4} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Date
              <input {...register('date_time')} type="date" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
            </label>

            {(type === 'call' || type === 'meeting') && (
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Duration (minutes)
                <input {...register('duration')} type="number" min="0" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{isSubmitting ? 'Saving...' : 'Save activity'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '../../utils/toast';
import { useDealMutations } from '../../hooks/useDealMutations';
import { activityRules, validateActivityDuration } from '../../utils/dealValidation';

const ACTIVITY_TYPES = ['call', 'email', 'note', 'meeting'];

export default function LogActivityModal({ contactId, onClose, onSuccess }) {
  const { createActivity } = useDealMutations();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      type: 'call',
      title: '',
      description: '',
      date_time: new Date().toISOString().slice(0, 10),
      duration: '',
    },
  });

  const selectedType = watch('type');

  const onSubmit = async (values) => {
    try {
      if (!values.title || !values.type) {
        throw new Error('Please complete all required fields.');
      }
      const duration = ['call', 'meeting'].includes(values.type)
        ? Number(values.duration) || 0
        : null;

      if (['call', 'meeting'].includes(values.type) && !duration) {
        throw new Error('Duration is required for call or meeting.');
      }

      const created = await createActivity({
        contact_id: contactId,
        type: values.type,
        title: values.title.trim(),
        description: values.description?.trim() || null,
        date_time: values.date_time,
        duration,
      });

      toast.success('Activity logged successfully');
      onSuccess && onSuccess(created);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save activity');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Log Activity</h2>
            <p className="text-sm text-slate-500">Add a new activity for this contact.</p>
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
                      watch('type') === type
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      value={type}
                      {...register('type', activityRules.type)}
                      className="hidden"
                    />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </label>
                ))}
              </div>
              {errors.type && <p className="text-sm text-rose-600">{errors.type.message}</p>}
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
                {...register('date_time', activityRules.date_time)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              />
              {errors.date_time && <p className="text-sm text-rose-600">{errors.date_time.message}</p>}
            </div>

            {['call', 'meeting'].includes(selectedType) && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Duration (minutes)</label>
                <input
                  type="number"
                  {...register('duration', {
                    validate: (value) => validateActivityDuration(selectedType, value),
                  })}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="30"
                />
                {errors.duration && <p className="text-sm text-rose-600">{errors.duration.message}</p>}
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
              {isSubmitting ? 'Saving...' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
