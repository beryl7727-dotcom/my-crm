import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTeam } from './useTeam';

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

// Fetches structuring-stage relationships created this month and groups them by
// company, returning the top 5 by deal count together with each company's deals.
export function usePriorityCompanies() {
  const { currentTeam } = useTeam();
  const teamId = currentTeam?.id || null;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRows = useCallback(async () => {
    if (!teamId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('relationships')
        .select('id, title, value, details, contact:contacts!primary_contact_id(id,first_name,last_name), company:companies(id,name)')
        .eq('team_id', teamId)
        .eq('stage', 'structuring')
        .gte('created_at', startOfCurrentMonth())
        .not('company_id', 'is', null);
      if (err) throw err;
      setRows(data || []);
    } catch (err) {
      console.error('usePriorityCompanies fetch error', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const companies = useMemo(() => {
    const map = new Map();
    for (const deal of rows) {
      const company = deal.company;
      if (!company?.id) continue;
      if (!map.has(company.id)) {
        map.set(company.id, { id: company.id, name: company.name, deals: [] });
      }
      map.get(company.id).deals.push(deal);
    }
    return Array.from(map.values())
      .sort((a, b) => b.deals.length - a.deals.length)
      .slice(0, 5);
  }, [rows]);

  return { companies, loading, error, refresh: fetchRows };
}
