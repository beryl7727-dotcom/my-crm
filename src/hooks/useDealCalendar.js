import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTeam } from './useTeam';

function getQuarterRange(quarter, year) {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1).toISOString();
  const end = new Date(year, startMonth + 3, 0, 23, 59, 59).toISOString();
  return { start, end };
}

// Fetches structuring-stage deals whose expected_close_date falls within the
// given quarter.  Reuses the same relationships table used by Phase 3B hooks.
export function useDealCalendar({ quarter, year }) {
  const { currentTeam } = useTeam();
  const teamId = currentTeam?.id || null;

  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDeals = useCallback(async () => {
    if (!teamId) {
      setDeals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { start, end } = getQuarterRange(quarter, year);
      const { data, error: err } = await supabase
        .from('relationships')
        .select('*, contact:contacts!primary_contact_id(id,first_name,last_name), company:companies(id,name)')
        .eq('team_id', teamId)
        .eq('stage', 'structuring')
        .gte('expected_close_date', start)
        .lte('expected_close_date', end)
        .order('expected_close_date', { ascending: true });
      if (err) throw err;
      setDeals(data || []);
    } catch (err) {
      console.error('useDealCalendar fetch error', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [teamId, quarter, year]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  return { deals, loading, error, refresh: fetchDeals };
}
