import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTeam } from './useTeam';

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export function useStructuringDeals() {
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
      const { data, error: err } = await supabase
        .from('relationships')
        .select('*, contact:contacts!primary_contact_id(id,first_name,last_name), company:companies(id,name)')
        .eq('team_id', teamId)
        .eq('stage', 'structuring')
        .gte('created_at', startOfCurrentMonth())
        .order('created_at', { ascending: false });
      if (err) throw err;
      setDeals(data || []);
    } catch (err) {
      console.error('useStructuringDeals fetch error', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  return { deals, count: deals.length, loading, error, refresh: fetchDeals };
}
