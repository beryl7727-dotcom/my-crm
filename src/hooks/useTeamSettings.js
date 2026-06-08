import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useTeam } from './useTeam';

const decorateMembers = (rows, team) =>
  (rows || []).map((row) => ({
    ...row,
    display_name: row.full_name || row.email || 'Unknown member',
    role: team?.created_by && team.created_by === row.id ? 'admin' : 'member',
  }));

const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export function useTeamSettings() {
  const { user } = useAuth();
  const { currentTeam, refreshTeam } = useTeam();
  const teamId = currentTeam?.id || null;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mutating, setMutating] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!teamId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const membersRes = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

      if (membersRes.error) throw membersRes.error;
      setMembers(decorateMembers(membersRes.data, currentTeam));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [teamId, currentTeam]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refresh = useCallback(() => fetchAll(), [fetchAll]);

  const updateTeamName = useCallback(
    async (name) => {
      const trimmed = (name || '').trim();
      if (!trimmed) throw new Error('Team name is required');
      setMutating(true);
      try {
        const { error } = await supabase.from('teams').update({ name: trimmed }).eq('id', teamId);
        if (error) throw error;
        await refreshTeam(user?.id);
      } finally {
        setMutating(false);
      }
    },
    [teamId, refreshTeam, user]
  );

  const regenerateInviteCode = useCallback(async () => {
    if (!teamId) throw new Error('No team selected');
    setMutating(true);
    try {
      const nextCode = generateInviteCode();
      const { error } = await supabase.from('teams').update({ invite_code: nextCode }).eq('id', teamId);
      if (error) throw error;
      await refreshTeam(user?.id);
      return nextCode;
    } finally {
      setMutating(false);
    }
  }, [teamId, refreshTeam, user]);

  const removeMember = useCallback(async (userId) => {
    setMutating(true);
    try {
      const { error } = await supabase.from('profiles').update({ team_id: null }).eq('id', userId);
      if (error) throw error;
      setMembers((current) => current.filter((member) => member.id !== userId));
    } finally {
      setMutating(false);
    }
  }, []);

  const isAdmin = useMemo(() => {
    if (!user?.id || !currentTeam) return false;
    return currentTeam.created_by === user.id;
  }, [user, currentTeam]);

  return {
    team: currentTeam,
    members,
    loading,
    error,
    mutating,
    isAdmin,
    currentUserId: user?.id || null,
    refresh,
    updateTeamName,
    regenerateInviteCode,
    removeMember,
  };
}
