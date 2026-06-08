import React, { useState } from 'react';
import { toast } from '../utils/toast';

export default function TeamInfo({ team, memberCount, isAdmin, onUpdateName, mutating }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team?.name || '');

  const startEditing = () => {
    setName(team?.name || '');
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await onUpdateName(name);
      toast.success('Team name updated');
      setEditing(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update team name');
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(team?.id || '');
      toast.success('Team ID copied to clipboard');
    } catch {
      toast.error('Unable to copy team ID');
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Team Info</h2>
      <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <div>
          <p className="text-sm text-slate-500">Team name</p>
          {editing ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={mutating}
                className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-3">
              <p className="text-lg font-semibold text-slate-900">{team?.name || '—'}</p>
              {isAdmin && (
                <button type="button" onClick={startEditing} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                  Edit
                </button>
              )}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-slate-500">Team ID</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700">{team?.id || '—'}</code>
            <button type="button" onClick={handleCopyId} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
              Copy
            </button>
          </div>
        </div>

        <div>
          <p className="text-sm text-slate-500">Created</p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {team?.created_at ? new Date(team.created_at).toLocaleDateString() : '—'}
          </p>
        </div>

        <div>
          <p className="text-sm text-slate-500">Member count</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{memberCount}</p>
        </div>
      </div>
    </section>
  );
}
