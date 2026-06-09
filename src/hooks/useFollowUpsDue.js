import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTeam } from './useTeam';

// A follow-up is overdue when a discovery-stage relationship has had no contact
// in 7+ days (or has never been contacted at all).
function sevenDaysAgo() {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

export function useFollowUpsDue() {
  const { currentTeam } = useTeam();
  const teamId = currentTeam?.id || null;

  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFollowUps = useCallback(async () => {
    if (!teamId) {
      setDeals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const cutoff = sevenDaysAgo();
      const { data, error: err } = await supabase
        .from('relationships')
        .select('*, contact:contacts!primary_contact_id(id,first_name,last_name), company:companies(id,name)')
        .eq('team_id', teamId)
        .eq('stage', 'discovery')
        .or(`last_contact_date.is.null,last_contact_date.lte.${cutoff}`)
        .order('last_contact_date', { ascending: true, nullsFirst: true });
      if (err) throw err;
      setDeals(data || []);
    } catch (err) {
      console.error('useFollowUpsDue fetch error', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  return { deals, count: deals.length, loading, error, refresh: fetchFollowUps };
}
