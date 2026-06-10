import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTeam } from './useTeam';
import { useAuth } from './useAuth';

export const PRESET_REASONS = [
  'In contact already',
  'Conflict of interest',
  'No longer interested',
  'Left company',
  'Unresponsive',
];

export function useDoNotContactReasons() {
  const { currentTeam } = useTeam();
  const { user } = useAuth();
  const [customReasons, setCustomReasons] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReasons = useCallback(async () => {
    const teamId = currentTeam?.id;
    if (!teamId) return;
    setLoading(true);
    const { data } = await supabase
      .from('do_not_contact_reasons')
      .select('id, reason, is_custom, created_at')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });
    setCustomReasons(data || []);
    setLoading(false);
  }, [currentTeam?.id]);

  useEffect(() => { fetchReasons(); }, [fetchReasons]);

  const createReason = useCallback(async (reason) => {
    const teamId = currentTeam?.id;
    if (!teamId || !reason?.trim()) return null;
    const { data, error } = await supabase
      .from('do_not_contact_reasons')
      .insert({ reason: reason.trim(), team_id: teamId, created_by: user?.id, is_custom: true })
      .select()
      .single();
    if (error) throw error;
    setCustomReasons((prev) => [...prev, data]);
    return data;
  }, [currentTeam?.id, user?.id]);

  const deleteReason = useCallback(async (id) => {
    await supabase.from('do_not_contact_reasons').delete().eq('id', id);
    setCustomReasons((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // All reasons to show in the modal: presets first, then custom
  const allReasons = [
    ...PRESET_REASONS.map((r) => ({ id: r, reason: r, is_custom: false })),
    ...customReasons,
  ];

  return { allReasons, customReasons, loading, createReason, deleteReason, refresh: fetchReasons };
}
