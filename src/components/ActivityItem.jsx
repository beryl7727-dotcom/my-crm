import React from 'react';
import { CHANNEL_META } from '../utils/messageTemplates';

const iconMap = {
  call: '📞',
  email: '✉️',
  note: '📝',
  meeting: '📅',
  message: '💬',
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function ActivityItem({ activity }) {
  const icon = (activity.message_channel && CHANNEL_META[activity.message_channel]?.icon) || iconMap[activity.activity_type] || '🔔';
  const createdBy = activity.created_by?.name || activity.created_by || 'Unknown';

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-lg shadow-sm">
          {icon}
        </div>
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-slate-900">{activity.title || 'Untitled activity'}</p>
          <p className="text-slate-500">{formatDateTime(activity.activity_date || activity.created_at)}</p>
        </div>
      </div>
      <div className="mt-3 text-sm text-slate-700">
        <p>{activity.description || 'No details provided.'}</p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-white px-2 py-1">{activity.activity_type || 'activity'}</span>
        <span>By {createdBy}</span>
      </div>
    </div>
  );
}
