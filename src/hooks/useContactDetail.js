import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTeam } from './useTeam';

export function useContactDetail(contactId) {
  const [contact, setContact] = useState(null);
  const [deals, setDeals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sortDeals = (items) => {
    return [...items].sort((a, b) => {
      return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
    });
  };

  const sortActivities = (items) => {
    return [...items].sort((a, b) => {
      const aDate = new Date(a.activity_date || a.created_at || 0);
      const bDate = new Date(b.activity_date || b.created_at || 0);
      return bDate - aDate;
    });
  };

  const { currentTeam } = useTeam();
  const teamId = currentTeam?.id;

  const fetchContactDetail = useCallback(async () => {
    if (!contactId || !teamId) {
      setContact(null);
      setDeals([]);
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [contactRes, dealsRes, activitiesRes] = await Promise.all([
        supabase.from('contacts').select('*').eq('id', contactId).eq('team_id', teamId).maybeSingle(),
        supabase.from('relationships').select('*').eq('primary_contact_id', contactId).eq('team_id', teamId),
        supabase.from('activities').select('*').eq('contact_id', contactId).eq('team_id', teamId),
      ]);

      if (contactRes.error) throw contactRes.error;
      if (dealsRes.error) throw dealsRes.error;
      if (activitiesRes.error) throw activitiesRes.error;

      setContact(contactRes.data || null);
      setDeals(sortDeals(dealsRes.data || []));
      setActivities(sortActivities(activitiesRes.data || []));
    } catch (err) {
      console.error('useContactDetail error', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchContactDetail();
  }, [fetchContactDetail]);

  const refresh = useCallback(async () => {
    await fetchContactDetail();
  }, [fetchContactDetail]);

  const updateContactNotes = useCallback(
    async (notes) => {
      if (!contactId) return;
      const { data, error } = await supabase.from('contacts').update({ notes }).eq('id', contactId).select();
      if (error) throw error;
      setContact((current) => ({ ...current, notes }));
      return data;
    },
    [contactId]
  );

  const updateContactTags = useCallback(
    async (tags) => {
      if (!contactId) return;
      const { data, error } = await supabase.from('contacts').update({ tags }).eq('id', contactId).select();
      if (error) throw error;
      setContact((current) => ({ ...current, tags }));
      return data;
    },
    [contactId]
  );

  return {
    contact,
    deals,
    activities,
    loading,
    error,
    refresh,
    updateContactNotes,
    updateContactTags,
  };
}
