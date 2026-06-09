import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTeam } from './useTeam';
import { useDealMutations } from './useDealMutations';

// Thin wrapper: createEvent delegates to useDealMutations.createActivity (already
// handles team_id / created_by injection); updateEvent makes a direct patch.
export function useCalendarEvent() {
  const { currentTeam } = useTeam();
  const teamId = currentTeam?.id || null;
  const { createActivity, loading: createLoading, error: createError } = useDealMutations();

  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  const createEvent = createActivity;

  const updateEvent = useCallback(
    async (activityId, payload) => {
      setUpdateLoading(true);
      setUpdateError(null);
      try {
        const query = supabase.from('activities').update(payload).eq('id', activityId);
        if (teamId) query.eq('team_id', teamId);
        const { data, error: err } = await query.select().single();
        if (err) throw err;
        return data;
      } catch (err) {
        setUpdateError(err);
        throw err;
      } finally {
        setUpdateLoading(false);
      }
    },
    [teamId]
  );

  return {
    createEvent,
    updateEvent,
    loading: createLoading || updateLoading,
    error: createError || updateError,
  };
}
