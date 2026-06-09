import React, { useMemo, useState } from 'react';
import { useContacts } from '../hooks/useContacts';
import { useSegments } from '../hooks/useSegments';
import ContactsList from '../components/ContactsList';
import ContactsGrid from '../components/ContactsGrid';
import ContactFilters from '../components/ContactFilters';
import BulkActionsBar from '../components/BulkActionsBar';
import SegmentationPanel from '../components/SegmentationPanel';
import NewContactModal from '../components/modals/NewContactModal';
import ImportContactsModal from '../components/modals/ImportContactsModal';
import { useNavigate } from 'react-router-dom';
import { toast } from '../utils/toast';

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'company', label: 'Company (A–Z)' },
  { value: 'last_activity', label: 'Last Contact' },
  { value: 'relationship_score', label: 'Score (high–low)' },
  { value: 'relationship_count', label: 'Relationships' },
  { value: 'created_at', label: 'Date added' },
];

export default function Contacts() {
  const navigate = useNavigate();
  const [showNewContact, setShowNewContact] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showSegments, setShowSegments] = useState(false);

  const {
    contacts,
    allContacts,
    companies,
    teamMembers,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    activeFilterCount,
    activeSegment,
    setActiveSegment,
    resetFilters,
    refresh,
    updateContact,
    deleteManyContacts,
    importContacts,
    exportCsv,
  } = useContacts();

  const { segments, getSegmentFilter } = useSegments(allContacts);

  const tags = useMemo(() => {
    const s = new Set();
    allContacts.forEach((c) => (c.tags || []).forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [allContacts]);

  const selectedCount = selectedIds.length;

  const toggleSelect = (id) =>
    setSelectedIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === contacts.length ? [] : contacts.map((c) => c.id));

  const handleCreateSuccess = (newContact) => {
    setShowNewContact(false);
    if (newContact?.id) navigate(`/contacts/${newContact.id}`);
  };

  const handleExport = () => {
    const toExport =
      selectedCount > 0 ? allContacts.filter((c) => selectedIds.includes(c.id)) : contacts;
    const csv = exportCsv(toExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `contacts-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectSegment = (segKey) => {
    if (!segKey) {
      setActiveSegment(null);
    } else {
      setActiveSegment(() => getSegmentFilter(segKey));
      setActiveSegment({ key: segKey, fn: getSegmentFilter(segKey) });
    }
  };

  // Active filter chips for quick removal
  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.contactTypes.length)
      chips.push({ label: `Type: ${filters.contactTypes.join(', ')}`, clear: () => setFilters((f) => ({ ...f, contactTypes: [] })) });
    if (filters.scores.length)
      chips.push({ label: `Score: ${filters.scores.join(', ')}★`, clear: () => setFilters((f) => ({ ...f, scores: [] })) });
    if (filters.products.length)
      chips.push({ label: `Products: ${filters.products.join(', ')}`, clear: () => setFilters((f) => ({ ...f, products: [] })) });
    if (filters.markets.length)
      chips.push({ label: `Markets: ${filters.markets.join(', ')}`, clear: () => setFilters((f) => ({ ...f, markets: [] })) });
    if (filters.statuses.length)
      chips.push({ label: `Status: ${filters.statuses.join(', ')}`, clear: () => setFilters((f) => ({ ...f, statuses: [] })) });
    if (filters.companyId) {
      const co = companies.find((c) => String(c.id) === String(filters.companyId));
      chips.push({ label: `Company: ${co?.name || filters.companyId}`, clear: () => setFilters((f) => ({ ...f, companyId: '' })) });
    }
    if (filters.tag)
      chips.push({ label: `Tag: ${filters.tag}`, clear: () => setFilters((f) => ({ ...f, tag: '' })) });
    if (filters.hasRelationships !== 'all')
      chips.push({ label: filters.hasRelationships === 'with' ? 'Has relationships' : 'No relationships', clear: () => setFilters((f) => ({ ...f, hasRelationships: 'all' })) });
    return chips;
  }, [filters, companies]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-700">
        <h2 className="text-xl font-semibold">Unable to load contacts</h2>
        <p>{error.message || String(error)}</p>
      </div>
    );
  }

  const activeSegKey = activeSegment?.key || null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar — Segments */}
      {showSegments && (
        <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white p-4 xl:block">
          <SegmentationPanel
            allContacts={allContacts}
            activeSegmentKey={activeSegKey}
            onSelectSegment={(key) => {
              if (!key) { setActiveSegment(null); return; }
              setActiveSegment({ key, fn: getSegmentFilter(key) });
            }}
          />
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Contacts</h1>
            <p className="mt-1 text-sm text-slate-500">
              {contacts.length} of {allContacts.length} contacts
              {activeSegKey && (
                <span className="ml-2 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                  {activeSegKey}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowSegments((v) => !v)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                showSegments ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Segments
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Import CSV
            </button>
            <button
              onClick={handleExport}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Export
            </button>
            <button
              onClick={() => setShowNewContact(true)}
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + New Contact
            </button>
          </div>
        </div>

        {/* Segments (mobile — below header) */}
        {showSegments && (
          <div className="xl:hidden">
            <SegmentationPanel
              allContacts={allContacts}
              activeSegmentKey={activeSegKey}
              onSelectSegment={(key) => {
                if (!key) { setActiveSegment(null); return; }
                setActiveSegment({ key, fn: getSegmentFilter(key) });
              }}
            />
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">🔍</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, phone, company…"
              className="w-full rounded-3xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-700"
              >✕</button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
              className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              type="button"
              onClick={() => setFilters((f) => ({ ...f, sortOrder: f.sortOrder === 'asc' ? 'desc' : 'asc' }))}
              className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {filters.sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* Filter toggle */}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`shrink-0 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
              showFilters || activeFilterCount > 0
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>

          {/* View toggle */}
          <div className="flex shrink-0 overflow-hidden rounded-2xl border border-slate-300 bg-white">
            {['table', 'grid'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2.5 text-sm font-semibold capitalize transition ${
                  viewMode === mode ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {mode === 'table' ? 'List' : 'Grid'}
              </button>
            ))}
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <ContactFilters
            filters={filters}
            setFilters={setFilters}
            companies={companies}
            teamMembers={teamMembers}
            tags={tags}
            activeFilterCount={activeFilterCount}
            onReset={resetFilters}
          />
        )}

        {/* Active filter chips */}
        {(activeChips.length > 0 || activeSegKey) && (
          <div className="flex flex-wrap gap-2">
            {activeSegKey && (
              <button
                type="button"
                onClick={() => setActiveSegment(null)}
                className="flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-200"
              >
                Segment: {activeSegKey} <span className="text-purple-400">✕</span>
              </button>
            )}
            {activeChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.clear}
                className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200"
              >
                {chip.label} <span className="text-blue-400">✕</span>
              </button>
            ))}
          </div>
        )}

        {/* Bulk actions */}
        <BulkActionsBar
          selectedIds={selectedIds}
          allContacts={allContacts}
          companies={companies}
          onClear={() => setSelectedIds([])}
          onRefresh={refresh}
        />

        {/* Content */}
        {contacts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-lg font-semibold text-slate-700">No contacts found</p>
            <p className="mt-2 text-sm text-slate-500">
              {searchQuery || activeFilterCount > 0 || activeSegKey
                ? 'Try adjusting your search or filters.'
                : 'Add your first contact to get started.'}
            </p>
            {searchQuery || activeFilterCount > 0 || activeSegKey ? (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Clear all filters
              </button>
            ) : (
              <button
                onClick={() => setShowNewContact(true)}
                className="mt-4 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                + New Contact
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <ContactsGrid
            contacts={contacts}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            searchQuery={searchQuery}
          />
        ) : (
          <ContactsList
            contacts={contacts}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            allSelected={selectedIds.length === contacts.length && contacts.length > 0}
            searchQuery={searchQuery}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSort={(col, order) => setFilters((f) => ({ ...f, sortBy: col, sortOrder: order }))}
            onUpdateContact={updateContact}
          />
        )}
      </div>

      {showNewContact && (
        <NewContactModal
          onClose={() => setShowNewContact(false)}
          onCreated={handleCreateSuccess}
        />
      )}
      {showImport && (
        <ImportContactsModal
          onClose={() => setShowImport(false)}
          onImport={importContacts}
        />
      )}
    </div>
  );
}
