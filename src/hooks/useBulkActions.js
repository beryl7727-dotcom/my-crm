import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useBulkActions({ refresh } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      refresh && (await refresh());
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const addTag = useCallback(
    (ids, tag) =>
      run(async () => {
        // Fetch current tags for selected contacts
        const { data, error: fetchErr } = await supabase
          .from('contacts')
          .select('id,tags')
          .in('id', ids);
        if (fetchErr) throw fetchErr;

        await Promise.all(
          (data || []).map((contact) => {
            const next = Array.from(new Set([...(contact.tags || []), tag.trim()]));
            return supabase.from('contacts').update({ tags: next }).eq('id', contact.id);
          })
        );
      }),
    [run]
  );

  const setScore = useCallback(
    (ids, score) =>
      run(async () => {
        const { error: err } = await supabase
          .from('contacts')
          .update({ relationship_score: score })
          .in('id', ids);
        if (err) throw err;
      }),
    [run]
  );

  const deleteMany = useCallback(
    (ids) =>
      run(async () => {
        const { error: err } = await supabase.from('contacts').delete().in('id', ids);
        if (err) throw err;
      }),
    [run]
  );

  const assignToCompany = useCallback(
    (ids, companyId) =>
      run(async () => {
        const { error: err } = await supabase
          .from('contacts')
          .update({ company_id: companyId })
          .in('id', ids);
        if (err) throw err;
      }),
    [run]
  );

  return { addTag, setScore, deleteMany, assignToCompany, loading, error };
}
