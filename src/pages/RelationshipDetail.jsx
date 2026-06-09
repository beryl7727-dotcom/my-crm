import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRelationshipDetail } from '../hooks/useRelationshipDetail';
import { useOpportunityHistory } from '../hooks/useOpportunityHistory';
import ContactTypeIcon from '../components/ContactTypeIcon';
import RelationshipScoreStar from '../components/RelationshipScoreStar';
import ProfileTab from '../components/ProfileTab';
import RelationshipTab from '../components/RelationshipTab';
import OpportunityHistory from '../components/OpportunityHistory';
import { STAGE_COLORS, STAGE_LABELS } from '../utils/relationshipStages';

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'relationship', label: 'Relationship' },
  { key: 'history', label: 'Opportunity History' },
];

export default function RelationshipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const { relationship, loading, error, updateRelationship, updateScore } = useRelationshipDetail(id);
  const { opportunities, loading: historyLoading } = useOpportunityHistory(relationship?.contact?.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-700">
        <h2 className="text-xl font-semibold mb-2">Unable to load relationship</h2>
        <p>{error.message || String(error)}</p>
      </div>
    );
  }

  if (!relationship) {
    return (
      <div className="p-6 text-gray-700">
        <h2 className="text-xl font-semibold">Relationship not found</h2>
      </div>
    );
  }

  const contact = relationship.contact;
  const fullName = [contact?.first_name, contact?.last_name].filter(Boolean).join(' ').trim() || 'Unnamed contact';
  const stageColors = STAGE_COLORS[relationship.stage] || STAGE_COLORS.relationship;

  return (
    <div className="p-6">
      <button onClick={() => navigate(-1)} className="mb-4 text-sm font-medium text-slate-500 hover:text-slate-700">
        ← Back to pipeline
      </button>

      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <ContactTypeIcon type={relationship.contact_type} size="lg" />
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{fullName}</h1>
              <p className="text-sm text-slate-500">
                {[contact?.job_title, relationship.company?.name].filter(Boolean).join(' · ') || 'No title or company on file'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <RelationshipScoreStar score={relationship.relationship_score} readOnly size="lg" />
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stageColors.bg} ${stageColors.text}`}>
              {STAGE_LABELS[relationship.stage] || relationship.stage}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-t-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === 'profile' && (
            <ProfileTab relationship={relationship} onUpdateScore={updateScore} onUpdateRelationship={updateRelationship} />
          )}
          {activeTab === 'relationship' && (
            <RelationshipTab relationship={relationship} onUpdateScore={updateScore} onUpdateRelationship={updateRelationship} />
          )}
          {activeTab === 'history' && <OpportunityHistory opportunities={opportunities} loading={historyLoading} />}
        </div>
      </div>
    </div>
  );
}
