import React, { useState } from 'react';
import { useTeam } from '../hooks/useTeam';
import useDealPipeline from '../hooks/useDealPipeline';
import StatCard from '../components/StatCard';
import KanbanBoard from '../components/KanbanBoard';
import NewDealModal from '../components/modals/NewDealModal';
import { formatCurrency } from '../utils/formatters';

export default function Dashboard() {
  const { currentTeam, loading: teamLoading } = useTeam();
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showNewDeal, setShowNewDeal] = useState(false);

  const teamId = currentTeam?.id || null;
  const { stages, stageLabels, dealsByStage, totals, loading, moveDeal, refresh } = useDealPipeline(teamId);

  const handleOpenDeal = (deal) => setSelectedDeal(deal);
  const handleCloseDeal = () => setSelectedDeal(null);

  const handleNewDeal = async () => {
    setShowNewDeal(false);
    await refresh();
  };

  if (teamLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <header className="mb-6">
        <div className="flex gap-4 flex-wrap">
          <StatCard title="Total Contacts" value={totals.totalContacts} />
          <StatCard title="Active Relationships" value={totals.activeRelationships} />
          <StatCard title="Potential Value" value={formatCurrency(totals.potentialValue)} />
          <StatCard title="Executed This Month" value={formatCurrency(totals.executedThisMonth)} />
        </div>
        <div className="mt-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Relationship Pipeline</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewDeal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + New Relationship
            </button>
            <button
              onClick={() => refresh()}
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main>
        <KanbanBoard
          stages={stages}
          stageLabels={stageLabels}
          dealsByStage={dealsByStage}
          onMove={moveDeal}
          onOpenDeal={handleOpenDeal}
        />
      </main>

      {/* Relationship detail panel */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black/40 flex justify-end">
          <div className="w-full md:w-1/3 bg-white p-6 overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{selectedDeal.title}</h3>
              <button onClick={handleCloseDeal} className="text-gray-500">Close</button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600">Value: {selectedDeal.value ? formatCurrency(selectedDeal.value) : '—'}</p>
              <p className="text-sm text-gray-600">Company: {selectedDeal.company?.name || '—'}</p>
              <p className="text-sm text-gray-600">Contact: {selectedDeal.contact ? `${selectedDeal.contact.first_name} ${selectedDeal.contact.last_name}` : '—'}</p>
              <p className="text-sm text-gray-600">Stage: {stageLabels[selectedDeal.stage] || selectedDeal.stage}</p>
              <p className="text-sm text-gray-600">Description: {selectedDeal.description || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {showNewDeal && (
        <NewDealModal
          onClose={() => setShowNewDeal(false)}
          onCreated={handleNewDeal}
        />
      )}
    </div>
  );
}
