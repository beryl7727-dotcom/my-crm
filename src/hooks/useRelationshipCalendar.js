import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTeam } from './useTeam';

// Fetches activities (with contact) whose activity_date falls within [startDate, endDate] inclusive.
// startDate and endDate are 'YYYY-MM-DD' strings.
export function useRelationshipCalendar({ startDate, endDate }) {
  const { currentTeam } = useTeam();
  const teamId = currentTeam?.id || null;

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivities = useCallback(async () => {
    if (!teamId || !startDate || !endDate) {
      setActivities([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Use exclusive upper bound (next day at midnight) to capture the full endDate.
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const endExclusive = nextDay.toISOString().slice(0, 10);

      const { data, error: err } = await supabase
        .from('activities')
        .select('*, contact:contacts!contact_id(id, first_name, last_name)')
        .eq('team_id', teamId)
        .gte('activity_date', `${startDate}T00:00:00`)
        .lt('activity_date', `${endExclusive}T00:00:00`)
        .order('activity_date', { ascending: true });
      if (err) throw err;
      setActivities(data || []);
    } catch (err) {
      console.error('useRelationshipCalendar fetch error', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [teamId, startDate, endDate]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return { activities, loading, error, refresh: fetchActivities };
}
