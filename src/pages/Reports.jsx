import React from 'react';
import { useTeam } from '../hooks/useTeam';
import useReports from '../hooks/useReports';
import PipelineHealth from '../components/PipelineHealth';
import TeamLeaderboard from '../components/TeamLeaderboard';
import ContactTrends from '../components/ContactTrends';
import { toast } from '../utils/toast';

const downloadCsv = (filename, csvContent) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export default function Reports() {
  const { currentTeam, loading: teamLoading } = useTeam();
  const teamId = currentTeam?.id || null;

  const {
    loading,
    error,
    lastUpdated,
    refresh,
    pipelineByStage,
    pipelineTrend,
    metrics,
    leaderboard,
    selectedMemberId,
    selectedMember,
    setSelectedMemberId,
    contactTrends,
    exportPipelineCsv,
    exportContactsCsv,
  } = useReports(teamId);

  const handleExportPipeline = () => {
    downloadCsv('pipeline.csv', exportPipelineCsv());
    toast.success('Pipeline exported');
  };

  const handleExportContacts = () => {
    downloadCsv('contacts.csv', exportContactsCsv());
    toast.success('Contacts exported');
  };

  if (teamLoading || (loading && !lastUpdated)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin">
          <div className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-700">
        <h2 className="text-xl font-semibold">Unable to load reports</h2>
        <p>{error.message || String(error)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Reports</h1>
          <p className="mt-2 text-sm text-slate-500">
            Pipeline, team, and contact insights for {currentTeam?.name || 'your team'}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-400">Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
          )}
          <button
            type="button"
            onClick={refresh}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <PipelineHealth
        pipelineByStage={pipelineByStage}
        pipelineTrend={pipelineTrend}
        metrics={metrics}
        focusLabel={selectedMember?.name}
      />

      <TeamLeaderboard
        members={leaderboard}
        selectedMemberId={selectedMemberId}
        onSelectMember={setSelectedMemberId}
      />

      <ContactTrends trends={contactTrends} />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Export</h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportPipeline}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Export pipeline to CSV
          </button>
          <button
            type="button"
            onClick={handleExportContacts}
            className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Export contacts to CSV
          </button>
        </div>
      </section>
    </div>
  );
}
