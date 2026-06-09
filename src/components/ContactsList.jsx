import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../utils/toast';
import ContactAvatar from './ContactAvatar';
import ContactTypeIcon from './ContactTypeIcon';
import RelationshipScoreStar from './RelationshipScoreStar';
import PipelineCheckbox from './PipelineCheckbox';
import { usePushToPipeline } from '../hooks/usePushToPipeline';
import NewDealModal from './modals/NewDealModal';

const STAGE_STYLES = {
  relationship: 'bg-blue-100 text-blue-700',
  discovery: 'bg-amber-100 text-amber-700',
  structuring: 'bg-purple-100 text-purple-700',
  execution: 'bg-emerald-100 text-emerald-700',
  refresh: 'bg-slate-100 text-slate-600',
};
const STAGE_LABELS = {
  relationship: 'Relationship', discovery: 'Discovery',
  structuring: 'Structuring', execution: 'Execution', refresh: 'Refresh',
};

const STATUS_STYLES = {
  new: 'bg-blue-100 text-blue-700',
  active: 'bg-emerald-100 text-emerald-700',
  no_recent: 'bg-amber-100 text-amber-700',
  dormant: 'bg-slate-100 text-slate-500',
};
const STATUS_LABELS = { new: 'New', active: 'Active', no_recent: 'No Recent', dormant: 'Dormant' };

const fmt = (d) => d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : null;

const SORT_COLS = {
  name: 'name',
  company: 'company',
  last_activity: 'last_activity',
  relationship_score: 'relationship_score',
};

const SortHeader = ({ label, col, sortBy, sortOrder, onSort }) => {
  const active = sortBy === col;
  return (
    <th
      className="cursor-pointer select-none px-4 py-3 text-left whitespace-nowrap hover:text-slate-900"
      onClick={() => onSort(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        <span className={`text-xs ${active ? 'text-blue-500' : 'text-slate-300'}`}>
          {active ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </span>
    </th>
  );
};

function highlight(text, query) {
  if (!query || !text) return text || '—';
  const str = String(text);
  const idx = str.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return str;
  return (
    <>
      {str.slice(0, idx)}
      <mark className="rounded bg-yellow-200 px-0.5">{str.slice(idx, idx + query.length)}</mark>
      {str.slice(idx + query.length)}
    </>
  );
}

export default function ContactsList({
  contacts,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
  searchQuery = '',
  sortBy,
  sortOrder,
  onSort,
  onUpdateContact,
}) {
  const navigate = useNavigate();
  const selectedSet = useMemo(() => new Set(selectedIds || []), [selectedIds]);
  const [hoveredId, setHoveredId] = useState(null);
  const [pipelineContact, setPipelineContact] = useState(null);
  const { markDoNotContact, clearDoNotContact, processing } = usePushToPipeline();

  // Open the relationship form pre-filled with this contact
  const handlePush = (contact) => {
    setPipelineContact(contact);
  };

  // Called after NewDealModal successfully saves the relationship
  const handlePipelineCreated = async () => {
    if (!pipelineContact) return;
    try {
      await onUpdateContact(pipelineContact.id, { ready_for_pipeline: true, do_not_contact: false });
      toast.success(`${pipelineContact.full_name} pushed to pipeline`);
    } catch (err) {
      toast.error(err.message || 'Failed to update contact');
    } finally {
      setPipelineContact(null);
    }
  };

  const handleDnc = async (contactId) => {
    const contact = contacts.find((c) => c.id === contactId);
    try {
      await markDoNotContact(contactId, onUpdateContact);
      toast.error(`${contact?.full_name || 'Contact'} marked as Do Not Contact`);
    } catch (err) {
      toast.error(err.message || 'Failed to update contact');
    }
  };

  const handleClearDnc = async (contactId) => {
    try {
      await clearDoNotContact(contactId, onUpdateContact);
      toast.success('Do Not Contact removed');
    } catch (err) {
      toast.error(err.message || 'Failed to update contact');
    }
  };

  const handleSort = (col) => {
    if (onSort) onSort(col, sortBy === col && sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="w-10 px-4 py-3 text-left">
              <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} className="rounded" />
            </th>
            <SortHeader label="Name" col="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-left">Score</th>
            <SortHeader label="Company" col="company" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
            <th className="px-4 py-3 text-left">Email / Phone</th>
            <SortHeader label="Last Contact" col="last_activity" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
            <th className="px-4 py-3 text-left">Relationships</th>
            <th className="px-4 py-3 text-left" title="Check to push to pipeline; uncheck to mark Do Not Contact">Pipeline</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {contacts.map((contact) => {
            const selected = selectedSet.has(contact.id);
            const hovered = hoveredId === contact.id;

            return (
              <tr
                key={contact.id}
                className={`cursor-pointer transition hover:bg-slate-50 ${selected ? 'bg-blue-50' : ''}`}
                onClick={() => navigate(`/contacts/${contact.id}`)}
                onMouseEnter={() => setHoveredId(contact.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggleSelect(contact.id)}
                    className="rounded"
                  />
                </td>

                <td className="px-4 py-3 min-w-[180px]">
                  <div className="flex items-center gap-3">
                    <ContactAvatar name={contact.full_name} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">
                          {highlight(contact.full_name, searchQuery)}
                        </span>
                        {contact.do_not_contact && (
                          <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                            🚫 DNC
                          </span>
                        )}
                      </div>
                      {contact.job_title && (
                        <div className="text-xs text-slate-400 truncate">{contact.job_title}</div>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <ContactTypeIcon type={contact.contact_type} size="sm" showLabel />
                </td>

                <td className="px-4 py-3">
                  <RelationshipScoreStar score={contact.relationship_score || 0} readOnly size="sm" />
                </td>

                <td className="px-4 py-3 text-slate-700 max-w-[140px] truncate">
                  {highlight(contact.company_name, searchQuery) || <span className="text-slate-400">—</span>}
                </td>

                <td className="px-4 py-3">
                  <div className="text-slate-700 truncate max-w-[160px]">
                    {highlight(contact.email, searchQuery) || <span className="text-slate-400">—</span>}
                  </div>
                  {contact.phone && (
                    <div className="text-xs text-slate-400 truncate">
                      {highlight(contact.phone, searchQuery)}
                    </div>
                  )}
                </td>

                <td className="px-4 py-3 text-xs text-slate-600">
                  {fmt(contact.last_relationship_date || contact.last_activity) || <span className="text-slate-400">—</span>}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{contact.relationship_count}</span>
                    {contact.primary_stage && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_STYLES[contact.primary_stage] || ''}`}>
                        {STAGE_LABELS[contact.primary_stage]}
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <PipelineCheckbox
                    contact={contact}
                    busy={!!processing[contact.id]}
                    onPush={handlePush}
                    onDnc={handleDnc}
                    onClearDnc={handleClearDnc}
                  />
                </td>

                <td className="px-4 py-3">
                  {contact.status && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[contact.status] || ''}`}>
                      {STATUS_LABELS[contact.status] || contact.status}
                    </span>
                  )}
                </td>

                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className={`flex items-center gap-1 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                        title="Email"
                      >
                        ✉️
                      </a>
                    )}
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600"
                        title="Call"
                      >
                        📞
                      </a>
                    )}
                    {contact.phone && (
                      <a
                        href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-green-600"
                        title="WhatsApp"
                      >
                        💬
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {pipelineContact && (
        <NewDealModal
          initialContact={pipelineContact}
          onClose={() => setPipelineContact(null)}
          onCreated={handlePipelineCreated}
        />
      )}
    </div>
  );
}
