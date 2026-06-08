import React from 'react';
import { toast } from '../utils/toast';

export default function MembersList({ members, currentUserId, isAdmin, onRemove, mutating }) {
  const handleRemove = async (member) => {
    if (member.id === currentUserId) {
      toast.error("You can't remove yourself from the team");
      return;
    }
    if (!window.confirm(`Remove ${member.display_name} from the team?`)) return;
    try {
      await onRemove(member.id);
      toast.success(`${member.display_name} removed from the team`);
    } catch (err) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Team Members</h2>
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Joined</th>
              {isAdmin && <th className="px-4 py-3 text-left">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {members.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 4 : 3} className="px-4 py-6 text-center text-slate-400">
                  No team members found
                </td>
              </tr>
            )}
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{member.display_name}</p>
                      {member.full_name && <p className="text-xs text-slate-500">{member.email}</p>}
                    </div>
                    {member.id === currentUserId && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">You</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 capitalize text-slate-700">{member.role}</td>
                <td className="px-4 py-4 text-slate-700">
                  {member.created_at ? new Date(member.created_at).toLocaleDateString() : '—'}
                </td>
                {isAdmin && (
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => handleRemove(member)}
                      disabled={mutating || member.id === currentUserId}
                      className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
