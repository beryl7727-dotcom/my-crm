import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useDealMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createDeal = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('deals').insert(payload).select().single();
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDeal = useCallback(async (dealId, payload) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('deals').update(payload).eq('id', dealId).select().single();
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const moveDeal = useCallback(async (dealId, stage) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { stage, updated_at: new Date().toISOString() };
      const { data, error } = await supabase.from('deals').update(payload).eq('id', dealId).select().single();
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createActivity = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('activities').insert(payload).select().single();
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createDeal,
    updateDeal,
    moveDeal,
    createActivity,
    loading,
    error,
  };
}
