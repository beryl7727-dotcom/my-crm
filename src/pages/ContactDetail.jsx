import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import ContactHeader from '../components/ContactHeader';
import NewDealModal from '../components/modals/NewDealModal';
import EditDealModal from '../components/modals/EditDealModal';
import EditContactModal from '../components/modals/EditContactModal';
import LogActivityModal from '../components/modals/LogActivityModal';
import DealsList from '../components/DealsList';
import ActivityTimeline from '../components/ActivityTimeline';
import { useContactDetail } from '../hooks/useContactDetail';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function ContactDetail() {
  const { id } = useParams();
  const contactId = id;
  const [activeTab, setActiveTab] = useState('relationships');
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [showLogActivity, setShowLogActivity] = useState(false);
  const [showEditContact, setShowEditContact] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [activityFilter, setActivityFilter] = useState('all');
  const [notesEditing, setNotesEditing] = useState(false);
  const [notesValue, setNotesValue] = useState('');

  const {
    contact,
    deals,
    activities,
    loading,
    error,
    refresh,
    updateContactNotes,
    updateContactTags,
  } = useContactDetail(contactId);

  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    if (activityFilter === 'all') return activities;
    return activities.filter((activity) => activity.activity_type === activityFilter);
  }, [activities, activityFilter]);

  const stats = useMemo(() => {
    const dealCount = deals?.length || 0;
    const totalValue = deals?.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0) || 0;
    const lastActivity = activities?.[0]?.activity_date || activities?.[0]?.created_at || null;
    return { dealCount, totalValue, lastActivity };
  }, [deals, activities]);

  const tags = contact?.tags || [];

  const handleSaveNotes = async () => {
    await updateContactNotes(notesValue);
    setNotesEditing(false);
  };

  const handleToggleTag = async (tag) => {
    const nextTags = tags.includes(tag)
      ? tags.filter((item) => item !== tag)
      : [...tags, tag];
    await updateContactTags(nextTags);
  };

  const handleAddTag = async () => {
    const newTag = window.prompt('Add a new tag');
    if (!newTag) return;
    await updateContactTags([...new Set([...(tags || []), newTag.trim()])]);
  };

  const handleNewDeal = () => {
    setShowNewDeal(true);
  };

  const handleCreateSuccess = () => {
    setShowNewDeal(false);
    refresh();
  };

  const handleLogActivity = () => {
    setShowLogActivity(true);
  };

  const handleActivityLogged = () => {
    setShowLogActivity(false);
    refresh();
  };

  const handleDealUpdated = () => {
    setSelectedDeal(null);
    refresh();
  };

  const handleEdit = () => setShowEditContact(true);

  const handleArchive = () => {
    console.log('Archive contact', contactId);
  };

  useEffect(() => {
    if (contact?.notes != null) {
      setNotesValue(contact.notes);
    }
  }, [contact?.notes]);

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
        <h2 className="text-xl font-semibold mb-2">Unable to load contact</h2>
        <p>{error.message || String(error)}</p>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-6 text-gray-700">
        <h2 className="text-xl font-semibold">Contact not found</h2>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid gap-6 xl:grid-cols-[70%_30%]">
        <div className="space-y-6">
          <ContactHeader
            contact={contact}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onNewDeal={handleNewDeal}
            onLogActivity={handleLogActivity}
            onEdit={handleEdit}
            onArchive={handleArchive}
          />

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            {activeTab === 'relationships' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold">Relationships</h3>
                  <button
                    onClick={handleNewDeal}
                    className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    + New Relationship
                  </button>
                </div>
                <DealsList deals={deals} onDealClick={(deal) => setSelectedDeal(deal)} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    {['all', 'call', 'email', 'note', 'meeting'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setActivityFilter(type)}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                          activityFilter === type
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleLogActivity}
                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    + Log Activity
                  </button>
                </div>
                <ActivityTimeline activities={filteredActivities} />
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Relationships</p>
                <p className="mt-1 text-2xl font-semibold">{stats.dealCount}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Value</p>
                <p className="mt-1 text-2xl font-semibold">${stats.totalValue.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Last Activity</p>
                <p className="mt-1 text-lg font-medium">{formatDate(stats.lastActivity)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Notes</h3>
              <button
                onClick={() => setNotesEditing((current) => !current)}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                {notesEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
            <div>
              {notesEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    className="h-36 w-full rounded-2xl border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveNotes}
                    className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Save Notes
                  </button>
                </div>
              ) : (
                <p className="min-h-[9rem] whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {contact.notes || 'No notes yet. Click edit to add notes.'}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tags</h3>
              <button
                onClick={handleAddTag}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                + Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(tags || []).map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleToggleTag(tag)}
                  className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm text-slate-700 transition hover:bg-slate-200"
                >
                  {tag}
                </button>
              ))}
              {tags.length === 0 && <p className="text-sm text-slate-500">No tags yet.</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-semibold mb-4">History</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">Created</p>
                <p>{formatDate(contact.created_at)}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Last modified</p>
                <p>{formatDate(contact.updated_at)}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Created by</p>
                <p>{contact.created_by || 'Unknown'}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
      {showNewDeal && (
        <NewDealModal onClose={() => setShowNewDeal(false)} onCreated={handleCreateSuccess} initialContactId={contactId} />
      )}
      {showLogActivity && (
        <LogActivityModal contactId={contactId} onClose={() => setShowLogActivity(false)} onLogged={handleActivityLogged} />
      )}
      {selectedDeal && (
        <EditDealModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} onUpdated={handleDealUpdated} />
      )}
      {showEditContact && contact && (
        <EditContactModal
          contact={contact}
          onClose={() => setShowEditContact(false)}
          onSaved={() => { setShowEditContact(false); refresh(); }}
        />
      )}
    </div>
  );
}
