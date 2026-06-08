import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { STAGES, STAGE_LABELS, PRE_EXECUTION_STAGES } from '../utils/relationshipStages';

const isPreExecution = (stage) => PRE_EXECUTION_STAGES.includes(stage);

export default function useDealPipeline(teamId) {
  const [deals, setDeals] = useState([]);
  const [contactCount, setContactCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDeals = useCallback(async () => {
    if (!teamId) {
      setDeals([]);
      setContactCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [dealsRes, contactsRes] = await Promise.all([
        supabase
          .from('relationships')
          .select('*, contact:contacts!primary_contact_id(id,first_name,last_name), company:companies(id,name)')
          .eq('team_id', teamId)
          .order('created_at', { ascending: false }),
        supabase
          .from('contacts')
          .select('id', { count: 'exact', head: true })
          .eq('team_id', teamId),
      ]);
      if (dealsRes.error) throw dealsRes.error;
      if (contactsRes.error) throw contactsRes.error;
      setDeals(dealsRes.data || []);
      setContactCount(contactsRes.count || 0);
    } catch (err) {
      console.error('fetchDeals error', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const dealsByStage = useMemo(() => {
    const map = {};
    STAGES.forEach((s) => (map[s] = []));
    deals.forEach((d) => {
      const s = d.stage || 'relationship';
      if (!map[s]) map[s] = [];
      map[s].push(d);
    });
    return map;
  }, [deals]);

  const totals = useMemo(() => {
    const activeRelationships = deals.length;
    const potentialValue = deals
      .filter((d) => isPreExecution(d.stage))
      .reduce((acc, d) => acc + (Number(d.value) || 0), 0);
    const now = new Date();
    const executedThisMonth = deals
      .filter((d) => d.stage === 'execution')
      .filter((d) => {
        const executedOn = new Date(d.updated_at || d.created_at || 0);
        return executedOn.getMonth() === now.getMonth() && executedOn.getFullYear() === now.getFullYear();
      })
      .reduce((acc, d) => acc + (Number(d.value) || 0), 0);

    return { totalContacts: contactCount, activeRelationships, potentialValue, executedThisMonth };
  }, [deals, contactCount]);

  const refresh = useCallback(async () => {
    await fetchDeals();
  }, [fetchDeals]);

  const moveDeal = useCallback(
    async (dealId, newStage) => {
      // optimistic update
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)));
      try {
        const { error } = await supabase.from('relationships').update({ stage: newStage }).eq('id', dealId);
        if (error) throw error;
      } catch (err) {
        console.error('moveDeal error', err);
        setError(err);
        // revert
        fetchDeals();
      }
    },
    [fetchDeals]
  );

  return { stages: STAGES, stageLabels: STAGE_LABELS, dealsByStage, totals, loading, error, refresh, moveDeal };
}
