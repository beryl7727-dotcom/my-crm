import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTeam } from './useTeam';
import { useAuth } from './useAuth';

export function useDealMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentTeam } = useTeam();
  const { user } = useAuth();
  const teamId = currentTeam?.id;

  const addTeamId = (payload) => {
    if (!teamId) return payload;
    return payload.team_id ? payload : { ...payload, team_id: teamId };
  };

  const addCreatedBy = (payload) => {
    if (!user?.id) return payload;
    return payload.created_by ? payload : { ...payload, created_by: user.id };
  };

  const createDeal = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const requestPayload = addCreatedBy(addTeamId(payload));
      console.debug('createDeal payload:', requestPayload);
      const { data, error } = await supabase.from('relationships').insert(requestPayload).select().single();
      if (error) {
        console.error('Supabase createDeal error:', error, 'payload:', requestPayload);
        const errMsg = error.message || JSON.stringify(error);
        throw new Error(errMsg);
      }
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [teamId, user]);

  const updateDeal = useCallback(async (dealId, payload) => {
    setLoading(true);
    setError(null);
    try {
      const requestPayload = addTeamId(payload);
      const query = supabase.from('relationships').update(requestPayload).eq('id', dealId);
      if (teamId) query.eq('team_id', teamId);
      const { data, error } = await query.select().single();
      if (error) {
        console.error('Supabase updateDeal error:', error, 'dealId:', dealId, 'payload:', requestPayload);
        const errMsg = error.message || JSON.stringify(error);
        throw new Error(errMsg);
      }
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  const moveDeal = useCallback(async (dealId, stage) => {
    setLoading(true);
    setError(null);
    try {
      const payload = addTeamId({ stage, updated_at: new Date().toISOString() });
      const query = supabase.from('relationships').update(payload).eq('id', dealId);
      if (teamId) query.eq('team_id', teamId);
      const { data, error } = await query.select().single();
      if (error) {
        console.error('Supabase moveDeal error:', error, 'dealId:', dealId, 'payload:', payload);
        const errMsg = error.message || JSON.stringify(error);
        throw new Error(errMsg);
      }
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  const createActivity = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const requestPayload = addCreatedBy(addTeamId(payload));
      const { data, error } = await supabase.from('activities').insert(requestPayload).select().single();
      if (error) {
        console.error('Supabase createActivity error:', error, 'payload:', requestPayload);
        const errMsg = error.message || JSON.stringify(error);
        throw new Error(errMsg);
      }
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [teamId, user]);

  return {
    createDeal,
    updateDeal,
    moveDeal,
    createActivity,
    loading,
    error,
  };
}
