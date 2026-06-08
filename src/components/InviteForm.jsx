import React from 'react';
import { toast } from '../utils/toast';

export default function InviteForm({ team, onRegenerate, isAdmin, mutating }) {
  const inviteCode = team?.invite_code || '';

  const handleCopy = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast.success('Invite code copied to clipboard');
    } catch {
      toast.error('Unable to copy invite code');
    }
  };

  const handleRegenerate = async () => {
    if (!window.confirm('Generate a new invite code? The old code will stop working.')) return;
    try {
      await onRegenerate();
      toast.success('New invite code generated');
    } catch (err) {
      toast.error(err.message || 'Failed to generate a new invite code');
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Invite Members</h2>
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">
          Share this invite code with teammates. They can enter it on the "Join Team" screen to join {team?.name || 'your team'}.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <code className="rounded-xl bg-slate-100 px-4 py-3 text-lg font-semibold tracking-widest text-slate-900">
            {inviteCode || '—'}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!inviteCode}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Copy code
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={mutating}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate new code
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
