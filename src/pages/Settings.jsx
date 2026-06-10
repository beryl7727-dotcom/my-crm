import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTeamSettings } from '../hooks/useTeamSettings';
import TeamInfo from '../components/TeamInfo';
import InviteForm from '../components/InviteForm';
import MembersList from '../components/MembersList';
import ManageDoNotContactReasons from '../components/ManageDoNotContactReasons';

const DEFAULT_PREFERENCES = {
  darkMode: false,
  defaultView: 'pipeline',
  notifyOnActivity: true,
  dailyDigest: false,
};

function usePreferences(userId) {
  const storageKey = userId ? `crm:preferences:${userId}` : null;
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = window.localStorage.getItem(storageKey);
      setPreferences(stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES);
    } catch {
      setPreferences(DEFAULT_PREFERENCES);
    }
  }, [storageKey]);

  const updatePreference = (key, value) => {
    setPreferences((current) => {
      const next = { ...current, [key]: value };
      if (storageKey) {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // Ignore storage write failures (e.g. private browsing).
        }
      }
      return next;
    });
  };

  return [preferences, updatePreference];
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3">
      <span>
        <span className="block text-sm font-medium text-slate-900">{label}</span>
        <span className="block text-xs text-slate-500">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />
    </label>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const {
    team,
    members,
    loading,
    error,
    mutating,
    isAdmin,
    currentUserId,
    updateTeamName,
    regenerateInviteCode,
    removeMember,
  } = useTeamSettings();

  const [preferences, updatePreference] = usePreferences(user?.id);

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
        <h2 className="text-xl font-semibold">Unable to load settings</h2>
        <p>{error.message || String(error)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 p-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-2 text-sm text-slate-500">Manage your team, invite members, and adjust preferences.</p>
      </div>

      <TeamInfo team={team} memberCount={members.length} isAdmin={isAdmin} onUpdateName={updateTeamName} mutating={mutating} />

      <InviteForm team={team} onRegenerate={regenerateInviteCode} isAdmin={isAdmin} mutating={mutating} />

      <MembersList members={members} currentUserId={currentUserId} isAdmin={isAdmin} onRemove={removeMember} mutating={mutating} />

      <ManageDoNotContactReasons />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Preferences</h2>
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
          <ToggleRow
            label="Dark mode"
            description="Switch the interface to a dark color scheme."
            checked={preferences.darkMode}
            onChange={(value) => updatePreference('darkMode', value)}
          />
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Default view
            <select
              value={preferences.defaultView}
              onChange={(event) => updatePreference('defaultView', event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="pipeline">Pipeline</option>
              <option value="contacts">Contacts</option>
            </select>
          </label>
          <ToggleRow
            label="Email on activity"
            description="Get an email whenever activity is logged on your deals."
            checked={preferences.notifyOnActivity}
            onChange={(value) => updatePreference('notifyOnActivity', value)}
          />
          <ToggleRow
            label="Daily digest"
            description="Receive a daily summary of pipeline changes."
            checked={preferences.dailyDigest}
            onChange={(value) => updatePreference('dailyDigest', value)}
          />
        </div>
      </section>
    </div>
  );
}
