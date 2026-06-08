import React from 'react';

export default function StatCard({ title, value }) {
  return (
    <div className="bg-white border border-gray-200 px-4 py-3 rounded-md w-64">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold mt-1">{formatValue(value)}</div>
    </div>
  );
}

function formatValue(v) {
  if (v == null) return '—';
  if (typeof v === 'number') {
    if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `$${Math.round(v / 1000)}K`;
    return `$${v}`;
  }
  return v;
}
