import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTeam } from './useTeam';
import { STAGE_LABELS } from '../utils/relationshipStages';
import { deriveOpportunityResult } from '../utils/relationshipProfile';

// Fetches every relationship/opportunity OROS has had with a given contact,
// newest first, with a derived Won / Lost / Pending result for display.
export function useOpportunityHistory(contactId) {
  const { currentTeam } = useTeam();
  const teamId = currentTeam?.id || null;

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    if (!contactId || !teamId) {
      setOpportunities([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('relationships')
        .select('*')
        .eq('primary_contact_id', contactId)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOpportunities(data || []);
    } catch (err) {
      console.error('useOpportunityHistory fetch error', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [contactId, teamId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const items = useMemo(
    () =>
      opportunities.map((opportunity) => ({
        id: opportunity.id,
        date: opportunity.created_at,
        stage: opportunity.stage,
        stageLabel: STAGE_LABELS[opportunity.stage] || opportunity.stage,
        product: opportunity.details?.product || opportunity.title || null,
        volume: opportunity.details?.volume || null,
        result: deriveOpportunityResult(opportunity),
      })),
    [opportunities]
  );

  return {
    opportunities: items,
    loading,
    error,
    refresh: fetchHistory,
  };
}
