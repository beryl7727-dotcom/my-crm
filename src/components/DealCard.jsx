import React from 'react';

export default function DealCard({ deal, onOpen }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', deal.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onOpen && onOpen(deal)}
      className="bg-white border border-gray-200 hover:border-blue-300 p-3 rounded-md cursor-pointer shadow-sm hover:shadow-md transition"
    >
      <div className="flex justify-between items-start gap-2">
        <div>
          <h5 className="font-semibold text-sm">{deal.title}</h5>
          <p className="text-xs text-gray-500">{deal.company?.name || deal.company_name || '—'}</p>
        </div>
        <div className="text-sm font-medium text-gray-700">{formatAmount(deal.amount)}</div>
      </div>
      <div className="mt-2 text-xs text-gray-500">{deal.contact ? `${deal.contact.first_name} ${deal.contact.last_name}` : (deal.contact_name || 'No contact')}</div>
    </div>
  );
}

function formatAmount(a) {
  const n = Number(a) || 0;
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  if (n === 0) return '—';
  return `$${n}`;
}
