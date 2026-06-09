import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTeam } from './useTeam';

export function useRelationshipsForContact(contactId) {
  const { currentTeam } = useTeam();
  const teamId = currentTeam?.id || null;

  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRelationships = useCallback(async () => {
    if (!contactId) {
      setRelationships([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('relationships')
        .select('*, company:companies(id,name)')
        .eq('primary_contact_id', contactId)
        .order('updated_at', { ascending: false });

      if (teamId) query = query.eq('team_id', teamId);

      const { data, error: err } = await query;
      if (err) throw err;
      setRelationships(data || []);
    } catch (err) {
      console.error('useRelationshipsForContact error', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [contactId, teamId]);

  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  return {
    relationships,
    loading,
    error,
    refresh: fetchRelationships,
  };
}
