import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContacts } from '../hooks/useContacts';
import ContactGrid from '../components/ContactGrid';
import ContactTable from '../components/ContactTable';
import NewContactModal from '../components/modals/NewContactModal';

export default function Contacts() {
  const [showNewContact, setShowNewContact] = useState(false);
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
    refresh,
    updateContact,
    createContact,
    exportCsv,
  } = useContacts();

  const navigate = useNavigate();

  const tags = useMemo(() => {
    const tagSet = new Set();
    allContacts.forEach((contact) => {
      (contact.tags || []).forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [allContacts]);

  const selectedCount = selectedIds.length;

  const toggleSelect = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === contacts.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(contacts.map((contact) => contact.id));
  };

  const handleCreateSuccess = (newContact) => {
    setShowNewContact(false);
    if (newContact?.id) {
      navigate(`/contacts/${newContact.id}`);
    }
  };

  const handleExport = () => {
    const contactsToExport = selectedCount > 0 ? allContacts.filter((contact) => selectedIds.includes(contact.id)) : contacts;
    const csv = exportCsv(contactsToExport);
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
    if (!tag) return;

    await Promise.all(
      selectedIds.map(async (id) => {
        const contact = allContacts.find((item) => item.id === id);
        if (!contact) return null;
        const nextTags = Array.from(new Set([...(contact.tags || []), tag.trim()]));
        return updateContact(id, { tags: nextTags });
      })
    );
    setSelectedIds([]);
    refresh();
  };

  const filterBy = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({ companyId: '', tag: '', createdBy: '', sortBy: 'name', sortOrder: 'asc' });
    setSearchQuery('');
  };

  if (loading) {
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
        <h2 className="text-xl font-semibold">Unable to load contacts</h2>
        <p>{error.message || String(error)}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Contacts</h1>
          <p className="mt-2 text-sm text-slate-500">Search, filter, and manage your contact list.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowNewContact(true)}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + New Contact
          </button>
          <button
            onClick={() => setShowFilters((current) => !current)}
            className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {showFilters ? 'Hide filters' : 'Show filters'}
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto]">
        <label className="relative block">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">🔍</span>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search name, email, company"
            className="w-full rounded-3xl border border-slate-300 bg-white px-12 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </label>

        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            onClick={() => setViewMode('table')}
          >
            Table
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="grid gap-4 lg:grid-cols-4">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Company
              <select
                value={filters.companyId}
                onChange={(event) => filterBy('companyId', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">All companies</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Tag
              <select
                value={filters.tag}
                onChange={(event) => filterBy('tag', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">All tags</option>
                {tags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Created by
              <select
                value={filters.createdBy}
                onChange={(event) => filterBy('createdBy', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">All team members</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Sort
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  value={filters.sortBy}
                  onChange={(event) => filterBy('sortBy', event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="name">Name</option>
                  <option value="last_activity">Last activity</option>
                  <option value="created_at">Created date</option>
                </select>
                <select
                  value={filters.sortOrder}
                  onChange={(event) => filterBy('sortOrder', event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Reset filters
            </button>
          </div>
        </div>
      )}

      {selectedCount > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between rounded-3xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-800">
          <span>{selectedCount} contact(s) selected</span>
          <div className="flex flex-wrap gap-2">
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
          </div>
        </div>
      )}

      {contacts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-600">
          <p className="text-lg font-semibold">No contacts found</p>
          <p className="mt-2 text-sm">Try adjusting filters or add a new contact.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <ContactGrid
          contacts={contacts}
          onContactClick={(contact) => navigate(`/contacts/${contact.id}`)}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
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
        />
      )}

      {showNewContact && (
        <NewContactModal
          onClose={() => setShowNewContact(false)}
          onCreated={handleCreateSuccess}
        />
      )}
    </div>
  );
}
