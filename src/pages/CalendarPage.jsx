import { useState } from 'react';
import RelationshipCalendar from '../components/RelationshipCalendar';
import DealCalendar from '../components/DealCalendar';

const TABS = [
  {
    key: 'relationships',
    icon: '📅',
    label: 'Relationships',
    subtitle: 'Calls, meetings, emails & follow-ups',
  },
  {
    key: 'deals',
    icon: '🟣',
    label: 'Deals',
    subtitle: 'Structuring pipeline — quarterly view',
  },
];

export default function CalendarPage() {
  const [activeTab, setActiveTab] = useState('relationships');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Calendar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Relationship activity schedule and deal pipeline timeline in one place.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-2xl px-5 py-3 text-left transition ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-md'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <p className="text-sm font-semibold">
              {tab.icon} {tab.label}
            </p>
            <p className={`mt-0.5 text-xs ${activeTab === tab.key ? 'text-blue-100' : 'text-slate-500'}`}>
              {tab.subtitle}
            </p>
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        {activeTab === 'relationships' ? <RelationshipCalendar /> : <DealCalendar />}
      </div>
    </div>
  );
}
