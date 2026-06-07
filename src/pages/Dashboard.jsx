import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTeam } from '../hooks/useTeam';
import useDealPipeline from '../hooks/useDealPipeline';
import StatCard from '../components/StatCard';
import KanbanBoard from '../components/KanbanBoard';
import { toast } from '../utils/toast';

export default function Dashboard() {
  const { user } = useAuth();
  const { currentTeam, loading: teamLoading } = useTeam();
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showNewDeal, setShowNewDeal] = useState(false);

  const teamId = currentTeam?.id || null;
  const { stages, dealsByStage, totals, loading, moveDeal, refresh } = useDealPipeline(teamId);

  const handleOpenDeal = (deal) => setSelectedDeal(deal);
  const handleCloseDeal = () => setSelectedDeal(null);

  const handleNewDeal = async (payload) => {
    try {
      setShowNewDeal(false);
      await refresh(payload); // refresh will re-fetch; also passed payload is ignored by hook but kept for API parity
      toast.success('Deal created');
    } catch (err) {
      toast.error(err.message || 'Failed to create deal');
    }
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
          <StatCard title="Open Deals" value={totals.openDeals} />
          <StatCard title="Pipeline Value" value={totals.pipelineValue} />
          <StatCard title="This Month Closed" value={totals.thisMonthClosed} />
        </div>
        <div className="mt-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Pipeline</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewDeal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + New Deal
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
          dealsByStage={dealsByStage}
          onMove={moveDeal}
          onOpenDeal={handleOpenDeal}
        />
      </main>

      {/* Deal detail panel */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black/40 flex justify-end">
          <div className="w-full md:w-1/3 bg-white p-6 overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{selectedDeal.title}</h3>
              <button onClick={handleCloseDeal} className="text-gray-500">Close</button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600">Amount: {selectedDeal.amount ? `$${selectedDeal.amount}` : '—'}</p>
              <p className="text-sm text-gray-600">Company: {selectedDeal.company?.name || '—'}</p>
              <p className="text-sm text-gray-600">Contact: {selectedDeal.contact ? `${selectedDeal.contact.first_name} ${selectedDeal.contact.last_name}` : '—'}</p>
              <p className="text-sm text-gray-600">Stage: {selectedDeal.stage}</p>
              <p className="text-sm text-gray-600">Notes: {selectedDeal.notes || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {/* New Deal modal (simple) */}
      {showNewDeal && (
        <NewDealModal
          onClose={() => setShowNewDeal(false)}
          teamId={teamId}
          onCreated={handleNewDeal}
        />
      )}
    </div>
  );
}

function NewDealModal({ onClose, teamId, onCreated }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState('Prospect');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data, error } = await (await import('../lib/supabase')).supabase
        .from('deals')
        .insert({ title: title.trim(), amount: Number(amount) || 0, stage, team_id: teamId })
        .select();
      if (error) throw error;
      onCreated && onCreated(data?.[0]);
    } catch (err) {
      toast.error(err.message || 'Failed to create deal');
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-md w-full max-w-md">
        <h3 className="text-lg font-semibold mb-3">New Deal</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="w-full px-3 py-2 border rounded" placeholder="Deal title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="w-full px-3 py-2 border rounded" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <select value={stage} onChange={(e) => setStage(e.target.value)} className="w-full px-3 py-2 border rounded">
            <option>Prospect</option>
            <option>Qualified</option>
            <option>Proposal</option>
            <option>Closed</option>
          </select>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={loading} className="px-3 py-2 rounded bg-blue-600 text-white">{loading ? 'Saving...' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
