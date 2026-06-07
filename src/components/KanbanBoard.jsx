import React from 'react';
import DealCard from './DealCard';

export default function KanbanBoard({ stages = [], dealsByStage = {}, onMove, onOpenDeal }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stages.map((stage) => {
        const deals = dealsByStage[stage] || [];
        const totalValue = deals.reduce((s, d) => s + (Number(d.amount) || 0), 0);
        return (
          <div
            key={stage}
            onDragOver={(e) => e.preventDefault()}
            onDrop={async (e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData('text/plain');
              if (id && onMove) onMove(id, stage);
            }}
            className="bg-gray-50 p-3 rounded-md min-h-[200px]"
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold">{stage}</h4>
              <div className="text-sm text-gray-600">{deals.length} • {formatCurrency(totalValue)}</div>
            </div>

            <div className="space-y-2">
              {deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} onOpen={() => onOpenDeal && onOpenDeal(deal)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatCurrency(amount) {
  if (!amount) return '$0';
  const n = Number(amount);
  if (isNaN(n)) return '$0';
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}
