import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from '../utils/toast';
import { useBulkActions } from '../hooks/useBulkActions';

export default function BulkActionsBar({ selectedIds, allContacts, companies = [], onClear, onRefresh }) {
  const [showScorePicker, setShowScorePicker] = useState(false);
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);
  const { addTag, setScore, deleteMany, assignToCompany, loading } = useBulkActions({ refresh: onRefresh });

  const count = selectedIds.length;
  if (count === 0) return null;

  const handleAddTag = async () => {
    const tag = window.prompt('Tag to add to selected contacts');
    if (!tag?.trim()) return;
    try {
      await addTag(selectedIds, tag.trim());
      toast.success(`Tag "${tag.trim()}" added to ${count} contact(s)`);
      onClear();
    } catch {
      toast.error('Failed to add tag');
    }
  };

  const handleSetScore = async (score) => {
    try {
      await setScore(selectedIds, score);
      toast.success(`Score set to ${score}★ for ${count} contact(s)`);
      setShowScorePicker(false);
      onClear();
    } catch {
      toast.error('Failed to set score');
    }
  };

  const handleAssignCompany = async (companyId) => {
    try {
      await assignToCompany(selectedIds, companyId);
      toast.success(`${count} contact(s) assigned to company`);
      setShowCompanyPicker(false);
      onClear();
    } catch {
      toast.error('Failed to assign company');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Permanently delete ${count} contact(s)? This cannot be undone.`)) return;
    try {
      await deleteMany(selectedIds);
      toast.success(`Deleted ${count} contact(s)`);
      onClear();
    } catch {
      toast.error('Failed to delete contacts');
    }
  };

  return (
    <div className="relative rounded-3xl border border-blue-200 bg-blue-50 px-5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-semibold text-blue-800 text-sm">
          {count} contact{count !== 1 ? 's' : ''} selected
        </span>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleAddTag}
            disabled={loading}
            className="rounded-full border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            + Add Tag
          </button>

          {/* Score picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowScorePicker((v) => !v); setShowCompanyPicker(false); }}
              disabled={loading}
              className="rounded-full border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              Set Score ★
            </button>
            {showScorePicker && (
              <div className="absolute left-0 top-full mt-1 z-20 flex gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSetScore(s)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-amber-400 hover:bg-amber-50 text-lg"
                    title={`${s} star${s > 1 ? 's' : ''}`}
                  >
                    {s}★
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Company picker */}
          {companies.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowCompanyPicker((v) => !v); setShowScorePicker(false); }}
                disabled={loading}
                className="rounded-full border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
              >
                Assign Company
              </button>
              {showCompanyPicker && (
                <div className="absolute left-0 top-full mt-1 z-20 max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg py-1">
                  {companies.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleAssignCompany(c.id)}
                      className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
          >
            Delete
          </button>

          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
