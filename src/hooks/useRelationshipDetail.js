import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTeam } from './useTeam';
import { useDealMutations } from './useDealMutations';

export function useRelationshipDetail(relationshipId) {
  const { currentTeam } = useTeam();
  const teamId = currentTeam?.id || null;
  const { updateDeal, createActivity } = useDealMutations();

  const [relationship, setRelationship] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!relationshipId || !teamId) {
      setRelationship(null);
      setActivities([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const relRes = await supabase
        .from('relationships')
        .select('*, contact:contacts!primary_contact_id(*), company:companies(id,name)')
        .eq('id', relationshipId)
        .eq('team_id', teamId)
        .maybeSingle();
      if (relRes.error) throw relRes.error;
      const rel = relRes.data || null;
      setRelationship(rel);

      if (rel?.contact?.id) {
        const [activitiesRes, siblingRes] = await Promise.all([
          supabase
            .from('activities')
            .select('*')
            .eq('deal_id', relationshipId)
            .eq('team_id', teamId)
            .order('activity_date', { ascending: false }),
          supabase
            .from('relationships')
            .select('id, stage, updated_at')
            .eq('primary_contact_id', rel.contact.id)
            .eq('team_id', teamId)
            .in('stage', ['execution', 'refresh']),
        ]);
        if (activitiesRes.error) throw activitiesRes.error;
        if (siblingRes.error) throw siblingRes.error;

        setActivities(activitiesRes.data || []);

        const lastMeeting = (activitiesRes.data || [])
          .filter((a) => a.activity_type === 'meeting')
          .reduce((latest, a) => {
            const date = a.activity_date || a.created_at;
            return !latest || new Date(date) > new Date(latest) ? date : latest;
          }, null);

        const lastTrade = (siblingRes.data || []).reduce((latest, r) => {
          const date = r.updated_at;
          return !latest || new Date(date) > new Date(latest) ? date : latest;
        }, null);

        setRelationship((current) => (current ? { ...current, computed_last_meeting_date: lastMeeting, computed_last_trade_date: lastTrade } : current));
      } else {
        setActivities([]);
      }
    } catch (err) {
      console.error('useRelationshipDetail fetch error', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [relationshipId, teamId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const refresh = useCallback(async () => {
    await fetchDetail();
  }, [fetchDetail]);

  const updateRelationship = useCallback(
    async (payload) => {
      const data = await updateDeal(relationshipId, payload);
      setRelationship((current) => (current ? { ...current, ...data } : data));
      return data;
    },
    [relationshipId, updateDeal]
  );

  const updateScore = useCallback(
    async (nextScore) => {
      const previousScore = relationship?.relationship_score ?? null;
      if (previousScore === nextScore) return relationship;

      const data = await updateRelationship({ relationship_score: nextScore || null });

      const contactName = relationship?.contact
        ? [relationship.contact.first_name, relationship.contact.last_name].filter(Boolean).join(' ').trim()
        : 'this contact';
      await createActivity({
        contact_id: relationship?.contact?.id || null,
        deal_id: relationshipId,
        activity_type: 'note',
        title: `Relationship score updated from ${previousScore ?? '—'} to ${nextScore || '—'}`,
        description: `${contactName}'s relationship score changed from ${previousScore ?? 'no score'} to ${nextScore || 'no score'}.`,
        activity_date: new Date().toISOString(),
      });

      return data;
    },
    [relationship, relationshipId, updateRelationship, createActivity]
  );

  return {
    relationship,
    activities,
    loading,
    error,
    refresh,
    updateRelationship,
    updateScore,
  };
}
