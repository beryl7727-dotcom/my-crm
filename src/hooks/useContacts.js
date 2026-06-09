import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTeam } from './useTeam';
import { useAuth } from './useAuth';

const splitName = (fullName) => {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  return { first_name: parts[0] || '', last_name: parts.slice(1).join(' ') || '' };
};

const DAY = 1000 * 60 * 60 * 24;
const daysSince = (dateStr) => (dateStr ? (Date.now() - new Date(dateStr).getTime()) / DAY : Infinity);

const STAGE_PRIORITY = { structuring: 0, execution: 1, discovery: 2, refresh: 3, relationship: 4 };

const computeStatus = (contact) => {
  const lastContact = contact.last_activity_date || contact.last_activity || contact.updated_at;
  const days = daysSince(lastContact);
  const created = new Date(contact.created_at);
  const now = new Date();
  if (created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()) return 'new';
  if (days <= 30) return 'active';
  if (days > 90) return 'dormant';
  return 'no_recent';
};

const formatContact = (contact) => {
  const tags = Array.isArray(contact.tags)
    ? contact.tags
    : contact.tags
    ? String(contact.tags).split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim();
  const rels = Array.isArray(contact.relationships) ? contact.relationships : [];
  const relationship_count = rels.length;

  const sortedRels = [...rels].sort(
    (a, b) => (STAGE_PRIORITY[a.stage] ?? 9) - (STAGE_PRIORITY[b.stage] ?? 9)
  );
  const primary_stage = sortedRels[0]?.stage || null;

  const lastContactDates = rels.map((r) => r.last_contact_date).filter(Boolean).sort().reverse();

  const enriched = {
    ...contact,
    full_name: fullName || contact.name || 'Unnamed contact',
    company_name: contact.company?.name || contact.company || '',
    relationship_count,
    deal_count: relationship_count,
    activity_count: Array.isArray(contact.activities) ? contact.activities.length : 0,
    primary_stage,
    last_relationship_date: lastContactDates[0] || null,
    tags,
    last_activity: contact.last_activity || contact.last_activity_date || contact.updated_at || contact.created_at || null,
  };
  enriched.status = computeStatus(enriched);
  return enriched;
};

const sortContacts = (contacts, sortBy, sortOrder) => {
  const sorted = [...contacts];
  sorted.sort((a, b) => {
    if (sortBy === 'relationship_count') {
      const diff = (a.relationship_count || 0) - (b.relationship_count || 0);
      return sortOrder === 'asc' ? diff : -diff;
    }
    if (sortBy === 'relationship_score') {
      const diff = (a.relationship_score || 0) - (b.relationship_score || 0);
      return sortOrder === 'asc' ? diff : -diff;
    }
    if (sortBy === 'last_activity') {
      const aDate = a.last_activity ? new Date(a.last_activity).getTime() : 0;
      const bDate = b.last_activity ? new Date(b.last_activity).getTime() : 0;
      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    }
    if (sortBy === 'created_at') {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    }
    if (sortBy === 'company') {
      const aC = (a.company_name || '').toLowerCase();
      const bC = (b.company_name || '').toLowerCase();
      return sortOrder === 'asc' ? aC.localeCompare(bC) : bC.localeCompare(aC);
    }
    // default: name
    const aName = (a.full_name || '').toLowerCase();
    const bName = (b.full_name || '').toLowerCase();
    return sortOrder === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
  });
  return sorted;
};

const INITIAL_FILTERS = {
  contactTypes: [],
  scores: [],
  products: [],
  markets: [],
  statuses: [],
  companyId: '',
  tag: '',
  createdBy: '',
  hasRelationships: 'all',
  sortBy: 'name',
  sortOrder: 'asc',
};

export function useContacts() {
  const { currentTeam } = useTeam();
  const { user } = useAuth();
  const teamId = currentTeam?.id || null;

  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [showFilters, setShowFilters] = useState(false);
  const [activeSegment, setActiveSegment] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [contactsRes, companiesRes, membersRes] = await Promise.all([
        supabase
          .from('contacts')
          .select(
            `*, company:companies(id,name),
             relationships!primary_contact_id(id,stage,last_contact_date,contact_type),
             activities(id)`
          )
          .order('updated_at', { ascending: false }),
        supabase.from('companies').select('id,name').order('name', { ascending: true }),
        supabase.from('profiles').select('id,email').order('email', { ascending: true }),
      ]);

      if (contactsRes.error) throw contactsRes.error;
      if (companiesRes.error) throw companiesRes.error;
      if (membersRes.error) throw membersRes.error;

      setContacts((contactsRes.data || []).map(formatContact));
      setCompanies(companiesRes.data || []);
      setTeamMembers(membersRes.data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const refresh = useCallback(() => fetchContacts(), [fetchContacts]);

  const updateContact = useCallback(async (contactId, payload) => {
    const { data, error } = await supabase.from('contacts').update(payload).eq('id', contactId).select();
    if (error) throw error;
    if (data?.[0]) {
      setContacts((cur) =>
        cur.map((item) => (item.id === contactId ? formatContact({ ...item, ...data[0] }) : item))
      );
      return data[0];
    }
    return null;
  }, []);

  const deleteContact = useCallback(async (contactId) => {
    const { error } = await supabase.from('contacts').delete().eq('id', contactId);
    if (error) throw error;
    setContacts((cur) => cur.filter((item) => item.id !== contactId));
  }, []);

  const deleteManyContacts = useCallback(async (contactIds) => {
    const { error } = await supabase.from('contacts').delete().in('id', contactIds);
    if (error) throw error;
    setContacts((cur) => cur.filter((item) => !contactIds.includes(item.id)));
  }, []);

  const createContact = useCallback(
    async (values) => {
      let companyId = values.company_id;
      if (!companyId && values.company_name) {
        const cv = values.company_name.trim();
        if (cv) {
          const { data: existing } = await supabase.from('companies').select('id').eq('name', cv).maybeSingle();
          if (existing?.id) {
            companyId = existing.id;
          } else {
            const { data: created } = await supabase.from('companies').insert({ name: cv, team_id: teamId }).select().single();
            companyId = created?.id;
          }
        }
      }
      const { first_name, last_name } = splitName(values.full_name || values.name);
      const payload = {
        first_name, last_name,
        email: values.email || null,
        phone: values.phone || null,
        job_title: values.job_title || null,
        notes: values.notes || null,
        company_id: companyId || null,
        tags: values.tags || null,
        team_id: teamId || null,
        created_by: user?.id || null,
      };
      const { data, error } = await supabase.from('contacts').insert(payload).select();
      if (error) throw error;
      await fetchContacts();
      return data?.[0] || null;
    },
    [fetchContacts, teamId, user]
  );

  const importContacts = useCallback(
    async (rows) => {
      const withValue = (obj) =>
        Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== '' && v !== undefined));

      const payloads = rows.map((row) => {
        const { first_name, last_name } = splitName(row.full_name || row.name || '');
        return {
          first_name: first_name || null,
          last_name: last_name || null,
          email: row.email || null,
          phone: row.phone || null,
          job_title: row.job_title || null,
          tags: row.tags ? row.tags.split(',').map((t) => t.trim()).filter(Boolean) : null,
          team_id: teamId || null,
          created_by: user?.id || null,
          ...withValue({
            contact_type: row.contact_type || null,
            source: row.source || null,
            priority: row.priority || null,
            region: row.region || null,
            next_touch_date: row.next_touch_date || null,
            stage: row.stage || null,
          }),
        };
      });
      const { data, error } = await supabase.from('contacts').insert(payloads).select();
      if (error) throw error;
      await fetchContacts();
      return data || [];
    },
    [fetchContacts, teamId, user]
  );

  const displayContacts = useMemo(() => {
    return contacts.map((contact) => {
      const creator = teamMembers.find((m) => m.id === contact.created_by);
      return { ...contact, created_by_name: creator?.email || contact.created_by || 'Unknown' };
    });
  }, [contacts, teamMembers]);

  const filteredContacts = useMemo(() => {
    const query = (searchQuery || '').toLowerCase().trim();

    return sortContacts(
      displayContacts.filter((contact) => {
        // text search
        const matchesSearch =
          query === '' ||
          (contact.full_name || '').toLowerCase().includes(query) ||
          (contact.email || '').toLowerCase().includes(query) ||
          (contact.phone || '').toLowerCase().includes(query) ||
          (contact.company_name || '').toLowerCase().includes(query);
        if (!matchesSearch) return false;

        // active segment filter
        if (activeSegment) {
          // activeSegment is a function (predicate)
          if (!activeSegment(contact)) return false;
        }

        // multi-select filters
        if (filters.contactTypes.length > 0 && !filters.contactTypes.includes(contact.contact_type)) return false;
        if (filters.scores.length > 0 && !filters.scores.includes(contact.relationship_score)) return false;
        if (filters.products.length > 0) {
          const cp = contact.products_interested || [];
          if (!filters.products.some((p) => cp.includes(p))) return false;
        }
        if (filters.markets.length > 0) {
          const cm = contact.preferred_markets || [];
          if (!filters.markets.some((m) => cm.includes(m))) return false;
        }
        if (filters.statuses.length > 0 && !filters.statuses.includes(contact.status)) return false;

        // single-select filters
        if (filters.companyId && String(contact.company_id) !== String(filters.companyId)) return false;
        if (filters.tag && !contact.tags.includes(filters.tag)) return false;
        if (filters.createdBy && String(contact.created_by) !== String(filters.createdBy)) return false;
        if (filters.hasRelationships === 'with' && contact.relationship_count === 0) return false;
        if (filters.hasRelationships === 'without' && contact.relationship_count > 0) return false;

        return true;
      }),
      filters.sortBy,
      filters.sortOrder
    );
  }, [displayContacts, filters, searchQuery, activeSegment]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.contactTypes.length) count++;
    if (filters.scores.length) count++;
    if (filters.products.length) count++;
    if (filters.markets.length) count++;
    if (filters.statuses.length) count++;
    if (filters.companyId) count++;
    if (filters.tag) count++;
    if (filters.createdBy) count++;
    if (filters.hasRelationships !== 'all') count++;
    return count;
  }, [filters]);

  const exportCsv = useCallback((contactsToExport) => {
    const esc = (v) => {
      const t = v == null ? '' : String(v);
      return t.includes(',') || t.includes('"') || t.includes('\n') ? `"${t.replace(/"/g, '""')}"` : t;
    };
    const headers = ['Name','Company','Title','Email','Phone','Contact Type','Score','Tags','Products','Markets','Relationships','Stage','Last Contact','Activities','Status','Created By'];
    const rows = contactsToExport.map((c) => [
      c.full_name, c.company_name, c.job_title || '', c.email || '', c.phone || '',
      c.contact_type || '', c.relationship_score || '', c.tags.join('; '),
      (c.products_interested || []).join('; '), (c.preferred_markets || []).join('; '),
      c.relationship_count, c.primary_stage || '', c.last_relationship_date || '',
      c.activity_count, c.status || '', c.created_by_name,
    ]);
    return [headers, ...rows].map((row) => row.map(esc).join(',')).join('\r\n');
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setSearchQuery('');
    setActiveSegment(null);
  }, []);

  return {
    contacts: filteredContacts,
    allContacts: displayContacts,
    companies,
    teamMembers,
    loading,
    error,
    searchQuery,
    viewMode,
    showFilters,
    filters,
    activeFilterCount,
    activeSegment,
    setSearchQuery,
    setViewMode,
    setShowFilters,
    setFilters,
    setActiveSegment,
    resetFilters,
    refresh,
    updateContact,
    deleteContact,
    deleteManyContacts,
    createContact,
    importContacts,
    exportCsv,
  };
}
