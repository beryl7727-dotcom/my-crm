import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useTeam } from '../hooks/useTeam';

const STAGES = ['Prospect', 'Qualified', 'Proposal', 'Closed'];

export default function useDealPipeline(teamId) {
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
    try {
      // Select deals with related contact and company
      const { data, error } = await supabase
        .from('deals')
        .select('*, contacts(first_name,last_name), companies(name)')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // normalize names
      const normalized = (data || []).map((d) => ({
        ...d,
        contact: d.contacts || d.contact || null,
        company: d.companies || d.company || null,
      }));
      setDeals(normalized);
    } catch (err) {
      console.error('fetchDeals error', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchDeals();
    // optional: realtime subscription
    // const channel = supabase.channel('public:deals')
    //   .on('postgres_changes', { event: '*', schema: 'public', table: 'deals', filter: `team_id=eq.${teamId}` }, payload => {
    //     fetchDeals();
    //   })
    //   .subscribe();
    // return () => { channel.unsubscribe(); };
  }, [fetchDeals]);

  const dealsByStage = useMemo(() => {
    const map = {};
    STAGES.forEach((s) => (map[s] = []));
    deals.forEach((d) => {
      const s = d.stage || 'Prospect';
      if (!map[s]) map[s] = [];
      map[s].push(d);
    });
    return map;
  }, [deals]);

  const totals = useMemo(() => {
    const totalContacts = deals.reduce((acc, d) => acc + (d.contact ? 1 : 0), 0);
    const openDeals = deals.filter((d) => (d.stage || 'Prospect') !== 'Closed').length;
    const pipelineValue = deals.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
    const now = new Date();
    const thisMonthClosed = deals
      .filter((d) => (d.stage || '') === 'Closed')
      .filter((d) => {
        const created = new Date(d.closed_at || d.updated_at || d.created_at || 0);
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      })
      .reduce((acc, d) => acc + (Number(d.amount) || 0), 0);

    return { totalContacts, openDeals, pipelineValue, thisMonthClosed };
  }, [deals]);

  const refresh = useCallback(async () => {
    await fetchDeals();
  }, [fetchDeals]);

  const moveDeal = useCallback(
    async (dealId, newStage) => {
      // optimistic update
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)));
      try {
        const { error } = await supabase.from('deals').update({ stage: newStage }).eq('id', dealId);
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

  return { stages: STAGES, dealsByStage, totals, loading, error, refresh, moveDeal };
}
