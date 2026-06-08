import React, { useMemo, useState } from 'react';
import { formatCurrency } from '../utils/formatters';

function SortableHeader({ label, field, indicator, onClick }) {
  return (
    <th className="px-4 py-3 text-left">
      <button
        type="button"
        onClick={() => onClick(field)}
        className="flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900"
      >
        {label} <span className="text-xs">{indicator}</span>
      </button>
    </th>
  );
}

export default function TeamLeaderboard({ members, selectedMemberId, onSelectMember }) {
  const [sortBy, setSortBy] = useState('totalValue');
  const [sortOrder, setSortOrder] = useState('desc');

  const sortedMembers = useMemo(() => {
    const list = [...(members || [])];
    list.sort((a, b) => {
      let result;
      if (sortBy === 'name') {
        result = (a.name || '').localeCompare(b.name || '');
      } else {
        result = (a[sortBy] || 0) - (b[sortBy] || 0);
      }
      return sortOrder === 'asc' ? result : -result;
    });
    return list;
  }, [members, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder(field === 'name' ? 'asc' : 'desc');
    }
  };

  const sortIndicator = (field) => (sortBy === field ? (sortOrder === 'asc' ? '▲' : '▼') : '');

  const handleRowClick = (member) => {
    onSelectMember(selectedMemberId === member.id ? null : member.id);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Team Performance</h2>
          <p className="mt-1 text-sm text-slate-500">Click a team member to filter pipeline metrics to their relationships.</p>
        </div>
        {selectedMemberId && (
          <button
            type="button"
            onClick={() => onSelectMember(null)}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <SortableHeader label="Name" field="name" indicator={sortIndicator('name')} onClick={toggleSort} />
              <SortableHeader label="Relationships" field="dealCount" indicator={sortIndicator('dealCount')} onClick={toggleSort} />
              <SortableHeader label="Total value" field="totalValue" indicator={sortIndicator('totalValue')} onClick={toggleSort} />
              <th className="px-4 py-3 text-left">Executed this month</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {sortedMembers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No team members found
                </td>
              </tr>
            )}
            {sortedMembers.map((member) => {
              const isSelected = selectedMemberId === member.id;
              return (
                <tr
                  key={member.id}
                  onClick={() => handleRowClick(member)}
                  className={`cursor-pointer transition hover:bg-slate-50 ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-4 py-4 font-semibold text-slate-900">{member.name}</td>
                  <td className="px-4 py-4 text-slate-700">{member.dealCount}</td>
                  <td className="px-4 py-4 text-slate-700">{formatCurrency(member.totalValue)}</td>
                  <td className="px-4 py-4 text-slate-700">{formatCurrency(member.executedThisMonth)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
