import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../hooks/useTeam';
import useDealPipeline from '../hooks/useDealPipeline';
import { useFollowUpsDue } from '../hooks/useFollowUpsDue';
import { useStructuringDeals } from '../hooks/useStructuringDeals';
import { usePriorityCompanies } from '../hooks/usePriorityCompanies';
import { useExecutedThisMonth } from '../hooks/useExecutedThisMonth';
import StatCard from '../components/StatCard';
import TierDistributionCard from '../components/TierDistributionCard';
import KanbanBoard from '../components/KanbanBoard';
import PriorityCompanies from '../components/PriorityCompanies';
import FollowUpsList from '../components/FollowUpsList';
import StructuringDealsList from '../components/StructuringDealsList';
import NewDealModal from '../components/modals/NewDealModal';
import MessageComposer from '../components/modals/MessageComposer';
import { useTemplates } from '../hooks/useTemplates';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentTeam, loading: teamLoading } = useTeam();
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [quickMessage, setQuickMessage] = useState(null);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [showStructuring, setShowStructuring] = useState(false);

  const teamId = currentTeam?.id || null;
  const { stages, stageLabels, dealsByStage, loading: pipelineLoading, moveDeal, refresh } = useDealPipeline(teamId);
  const { deals: followUpDeals, count: followUpCount, loading: followUpsLoading } = useFollowUpsDue();
  const { deals: structuringDeals, count: structuringCount, loading: structuringLoading } = useStructuringDeals();
  const { companies, loading: companiesLoading } = usePriorityCompanies();
  const { count: executedCount, totalValue: executedValue, loading: executedLoading } = useExecutedThisMonth();
  const { templates } = useTemplates();

  const handleOpenDeal = (deal) => navigate(`/relationships/${deal.id}`);
  const handleQuickMessage = ({ contact, deal, channel }) => setQuickMessage({ contact, deal, channel });

  const handleNewDeal = async () => {
    setShowNewDeal(false);
    await refresh();
  };

  const kpisLoading = followUpsLoading || structuringLoading || executedLoading;

  if (teamLoading || pipelineLoading) {
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
      <header className="mb-6 space-y-4">
        {/* Row 1 — KPI stat cards */}
        <div className="flex flex-wrap gap-4">
          <StatCard
            title="Follow-Ups Due This Month"
            value={kpisLoading ? '…' : String(followUpCount)}
            subtitle="Discovery-stage, 7+ days overdue"
            color="orange"
            onClick={() => setShowFollowUps(true)}
          />
          <StatCard
            title="Deals in Structuring"
            value={kpisLoading ? '…' : String(structuringCount)}
            subtitle="Commercial terms being formed"
            color="purple"
            onClick={() => setShowStructuring(true)}
          />
          <StatCard
            title="Executed This Month"
            value={kpisLoading ? '…' : executedValue}
            subtitle={`${executedCount} ${executedCount === 1 ? 'relationship' : 'relationships'} executed`}
            color="green"
          />
          <TierDistributionCard />
        </div>

        {/* Row 2 — Priority companies */}
        {!companiesLoading && (
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-500">Priority Companies (Structuring)</p>
            <PriorityCompanies
              companies={companies}
              onCompanyClick={() => setShowStructuring(true)}
            />
          </div>
        )}

        <div className="flex justify-between items-center">
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
          onQuickMessage={handleQuickMessage}
        />
      </main>

      {showFollowUps && (
        <FollowUpsList deals={followUpDeals} onClose={() => setShowFollowUps(false)} />
      )}

      {showStructuring && (
        <StructuringDealsList deals={structuringDeals} onClose={() => setShowStructuring(false)} />
      )}

      {showNewDeal && (
        <NewDealModal
          onClose={() => setShowNewDeal(false)}
          onCreated={handleNewDeal}
        />
      )}

      {quickMessage && (
        <MessageComposer
          contacts={quickMessage.contact ? [quickMessage.contact] : []}
          templates={templates}
          deal={quickMessage.deal}
          initialContact={quickMessage.contact}
          initialChannel={quickMessage.channel}
          onClose={() => setQuickMessage(null)}
          onSent={() => setQuickMessage(null)}
        />
      )}
    </div>
  );
}
