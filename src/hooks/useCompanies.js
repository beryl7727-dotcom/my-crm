import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTeam } from './useTeam';

export function useCompanies() {
  const { currentTeam } = useTeam();
  const teamId = currentTeam?.id || null;

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch companies with their contact count
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });
      if (companiesError) throw companiesError;

      if (!companiesData?.length) {
        setCompanies([]);
        return;
      }

      const companyIds = companiesData.map((c) => c.id);

      // Contact counts per company (team-scoped if teamId available)
      const contactQuery = supabase
        .from('contacts')
        .select('company_id, id, updated_at')
        .in('company_id', companyIds);
      if (teamId) contactQuery.eq('team_id', teamId);

      // Active relationships (structuring stage) per company
      const relQuery = supabase
        .from('relationships')
        .select('company_id, id, stage, value, updated_at')
        .in('company_id', companyIds);
      if (teamId) relQuery.eq('team_id', teamId);

      const [contactsRes, relsRes] = await Promise.all([contactQuery, relQuery]);
      if (contactsRes.error) throw contactsRes.error;
      if (relsRes.error) throw relsRes.error;

      const contactsMap = {};
      (contactsRes.data || []).forEach((c) => {
        if (!contactsMap[c.company_id]) contactsMap[c.company_id] = [];
        contactsMap[c.company_id].push(c);
      });

      const relsMap = {};
      (relsRes.data || []).forEach((r) => {
        if (!relsMap[r.company_id]) relsMap[r.company_id] = [];
        relsMap[r.company_id].push(r);
      });

      const enriched = companiesData.map((company) => {
        const contacts = contactsMap[company.id] || [];
        const rels = relsMap[company.id] || [];
        const activeRels = rels.filter((r) => r.stage === 'structuring');
        const totalRevenue = rels
          .filter((r) => r.stage === 'execution' || r.stage === 'refresh')
          .reduce((sum, r) => sum + (Number(r.value) || 0), 0);
        const allDates = [
          ...contacts.map((c) => c.updated_at),
          ...rels.map((r) => r.updated_at),
        ]
          .filter(Boolean)
          .sort()
          .reverse();

        return {
          ...company,
          contact_count: contacts.length,
          active_rel_count: activeRels.length,
          total_revenue: totalRevenue,
          last_activity: allDates[0] || null,
        };
      });

      setCompanies(enriched);
    } catch (err) {
      console.error('useCompanies error', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const refresh = useCallback(() => fetchCompanies(), [fetchCompanies]);

  const createCompany = useCallback(async (payload) => {
    const { data, error } = await supabase.from('companies').insert(payload).select().single();
    if (error) throw error;
    await fetchCompanies();
    return data;
  }, [fetchCompanies]);

  const updateCompany = useCallback(async (id, payload) => {
    const { data, error } = await supabase.from('companies').update(payload).eq('id', id).select().single();
    if (error) throw error;
    setCompanies((cur) => cur.map((c) => (c.id === id ? { ...c, ...data } : c)));
    return data;
  }, []);

  const deleteCompany = useCallback(async (id) => {
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) throw error;
    setCompanies((cur) => cur.filter((c) => c.id !== id));
  }, []);

  const importCompanies = useCallback(async (rows) => {
    // Fetch existing company names to detect duplicates
    const { data: existing, error: existErr } = await supabase
      .from('companies')
      .select('name');
    if (existErr) throw existErr;

    const existingNames = new Set(
      (existing || []).map((c) => c.name.toLowerCase().trim())
    );

    const toInsert = [];
    let skipped = 0;

    rows.forEach((row) => {
      const name = (row.name || '').trim();
      if (!name) return;
      if (existingNames.has(name.toLowerCase())) {
        skipped++;
        return;
      }
      existingNames.add(name.toLowerCase()); // prevent duplicates within the CSV itself
      toInsert.push({
        name,
        industry: row.industry || null,
        country: row.country || null,
        website: row.website || null,
        notes: row.notes || null,
      });
    });

    if (toInsert.length > 0) {
      const { error: insertErr } = await supabase.from('companies').insert(toInsert);
      if (insertErr) throw insertErr;
    }

    await fetchCompanies();
    return { imported: toInsert.length, skipped };
  }, [fetchCompanies]);

  return {
    companies,
    loading,
    error,
    refresh,
    createCompany,
    updateCompany,
    deleteCompany,
    importCompanies,
  };
}
