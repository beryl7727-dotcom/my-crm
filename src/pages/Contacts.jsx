import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContacts } from '../hooks/useContacts';
import ContactGrid from '../components/ContactGrid';
import ContactTable from '../components/ContactTable';
import NewContactModal from '../components/modals/NewContactModal';
import ImportContactsModal from '../components/modals/ImportContactsModal';
import { toast } from '../utils/toast';

const STAGE_LABELS = {
  relationship: 'Relationship',
  discovery: 'Discovery',
  structuring: 'Structuring',
  execution: 'Execution',
  refresh: 'Refresh',
};

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'created_at', label: 'Date added' },
  { value: 'last_activity', label: 'Last activity' },
  { value: 'relationship_count', label: 'Relationships' },
];

export default function Contacts() {
  const [showNewContact, setShowNewContact] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

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
    refresh,
    updateContact,
    deleteContact,
    deleteManyContacts,
    importContacts,
    exportCsv,
  } = useContacts();

  const navigate = useNavigate();

  const tags = useMemo(() => {
    const tagSet = new Set();
    allContacts.forEach((c) => (c.tags || []).forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [allContacts]);

  const selectedCount = selectedIds.length;

  const toggleSelect = (id) =>
    setSelectedIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const toggleSelectAll = () => {
    if (selectedIds.length === contacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contacts.map((c) => c.id));
    }
  };

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
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contacts.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkTag = async () => {
    const tag = window.prompt('Add tag to selected contacts');
    if (!tag?.trim()) return;
    try {
      await Promise.all(
        selectedIds.map((id) => {
          const contact = allContacts.find((c) => c.id === id);
          if (!contact) return null;
          const nextTags = Array.from(new Set([...(contact.tags || []), tag.trim()]));
          return updateContact(id, { tags: nextTags });
        })
      );
      toast.success(`Tag "${tag.trim()}" added to ${selectedCount} contact(s)`);
      setSelectedIds([]);
    } catch {
      toast.error('Failed to add tag');
    }
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Permanently delete ${selectedCount} contact(s)? This cannot be undone.`
      )
    )
      return;
    try {
      await deleteManyContacts(selectedIds);
      toast.success(`Deleted ${selectedCount} contact(s)`);
      setSelectedIds([]);
    } catch {
      toast.error('Failed to delete contacts');
    }
  };

  const filterBy = (field, value) => setFilters((cur) => ({ ...cur, [field]: value }));

  const resetFilters = () => {
    setFilters({
      companyId: '',
      tag: '',
      createdBy: '',
      stage: '',
      hasRelationships: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
    });
    setSearchQuery('');
  };

  // Active filter chips for quick removal
  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.companyId) {
      const company = companies.find((c) => String(c.id) === String(filters.companyId));
      chips.push({ label: `Company: ${company?.name || filters.companyId}`, clear: () => filterBy('companyId', '') });
    }
    if (filters.tag) {
      chips.push({ label: `Tag: ${filters.tag}`, clear: () => filterBy('tag', '') });
    }
    if (filters.createdBy) {
      const member = teamMembers.find((m) => String(m.id) === String(filters.createdBy));
      chips.push({ label: `By: ${member?.email || filters.createdBy}`, clear: () => filterBy('createdBy', '') });
    }
    if (filters.stage) {
      chips.push({ label: `Stage: ${STAGE_LABELS[filters.stage] || filters.stage}`, clear: () => filterBy('stage', '') });
    }
    if (filters.hasRelationships === 'with') {
      chips.push({ label: 'Has relationships', clear: () => filterBy('hasRelationships', 'all') });
    }
    if (filters.hasRelationships === 'without') {
      chips.push({ label: 'No relationships', clear: () => filterBy('hasRelationships', 'all') });
    }
    return chips;
  }, [filters, companies, teamMembers]);

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

  return (
    <div className="p-6 space-y-5">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Contacts</h1>
          <p className="mt-1 text-sm text-slate-500">
            {contacts.length} of {allContacts.length} contacts
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            🔍
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, email, phone, company…"
            className="w-full rounded-3xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={filters.sortBy}
            onChange={(e) => filterBy('sortBy', e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => filterBy('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
        <div className="flex shrink-0 rounded-2xl border border-slate-300 bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-4 py-2.5 text-sm font-semibold transition ${
              viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2.5 text-sm font-semibold transition ${
              viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Grid
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Company
              <select
                value={filters.companyId}
                onChange={(e) => filterBy('companyId', e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">All companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Tag
              <select
                value={filters.tag}
                onChange={(e) => filterBy('tag', e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">All tags</option>
                {tags.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Pipeline stage
              <select
                value={filters.stage}
                onChange={(e) => filterBy('stage', e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Any stage</option>
                {Object.entries(STAGE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Relationships
              <select
                value={filters.hasRelationships}
                onChange={(e) => filterBy('hasRelationships', e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All contacts</option>
                <option value="with">Has relationships</option>
                <option value="without">No relationships</option>
              </select>
            </label>

            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Created by
              <select
                value={filters.createdBy}
                onChange={(e) => filterBy('createdBy', e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">All team members</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.email}</option>
                ))}
              </select>
            </label>
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.clear}
              className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200 transition"
            >
              {chip.label}
              <span className="text-blue-500">✕</span>
            </button>
          ))}
        </div>
      )}

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between rounded-3xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm">
          <span className="font-semibold text-blue-800">
            {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            <button
              type="button"
              onClick={handleBulkTag}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add tag
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Export selected
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {contacts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-lg font-semibold text-slate-700">No contacts found</p>
          <p className="mt-2 text-sm text-slate-500">
            {searchQuery || activeFilterCount > 0
              ? 'Try adjusting your search or filters.'
              : 'Add your first contact to get started.'}
          </p>
          {searchQuery || activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Clear filters
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
        <ContactGrid
          contacts={contacts}
          onContactClick={(contact) => navigate(`/contacts/${contact.id}`)}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          searchQuery={searchQuery}
        />
      ) : (
        <ContactTable
          contacts={contacts}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          allSelected={selectedIds.length === contacts.length && contacts.length > 0}
          onRowClick={(contact) => navigate(`/contacts/${contact.id}`)}
          onUpdateContact={updateContact}
          searchQuery={searchQuery}
        />
      )}

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
