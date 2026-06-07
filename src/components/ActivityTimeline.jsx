import React from 'react';
import ActivityItem from './ActivityItem';

export default function ActivityTimeline({ activities }) {
  if (!activities || activities.length === 0) {
    return <p className="text-sm text-slate-600">No activity logged for this contact.</p>;
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
