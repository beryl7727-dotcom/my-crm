import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTeam } from './useTeam';
import { useAuth } from './useAuth';

const splitName = (fullName) => {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    first_name: parts[0] || '',
    last_name: parts.slice(1).join(' ') || '',
  };
};

const STAGE_PRIORITY = {
  structuring: 0,
  execution: 1,
  discovery: 2,
  refresh: 3,
  relationship: 4,
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
  const primary_contact_type = sortedRels[0]?.contact_type || null;

  const lastContactDates = rels
    .map((r) => r.last_contact_date)
    .filter(Boolean)
    .sort()
    .reverse();

  return {
    ...contact,
    full_name: fullName || contact.name || 'Unnamed contact',
    company_name: contact.company?.name || contact.company || '',
    relationship_count,
    deal_count: relationship_count,
    activity_count: Array.isArray(contact.activities) ? contact.activities.length : 0,
    primary_stage,
    primary_contact_type,
    last_relationship_date: lastContactDates[0] || null,
    tags,
    last_activity: contact.last_activity || contact.updated_at || contact.created_at || null,
  };
};

const sortContacts = (contacts, sortBy, sortOrder) => {
  const sorted = [...contacts];
  sorted.sort((a, b) => {
    if (sortBy === 'relationship_count') {
      const diff = (a.relationship_count || 0) - (b.relationship_count || 0);
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
    const aName = (a.full_name || '').toLowerCase();
    const bName = (b.full_name || '').toLowerCase();
    if (aName < bName) return sortOrder === 'asc' ? -1 : 1;
    if (aName > bName) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
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
  const [filters, setFilters] = useState({
    companyId: '',
    tag: '',
    createdBy: '',
    stage: '',
    hasRelationships: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [contactsRes, companiesRes, membersRes] = await Promise.all([
        supabase
          .from('contacts')
          .select(
            '*, company:companies(id,name), relationships!primary_contact_id(id,stage,last_contact_date,contact_type), activities(id)'
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

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const refresh = useCallback(async () => {
    await fetchContacts();
  }, [fetchContacts]);

  const updateContact = useCallback(async (contactId, payload) => {
    const { data, error } = await supabase.from('contacts').update(payload).eq('id', contactId).select();
    if (error) throw error;
    if (data?.[0]) {
      setContacts((current) =>
        current.map((item) => (item.id === contactId ? formatContact({ ...item, ...data[0] }) : item))
      );
      return data[0];
    }
    return null;
  }, []);

  const deleteContact = useCallback(async (contactId) => {
    const { error } = await supabase.from('contacts').delete().eq('id', contactId);
    if (error) throw error;
    setContacts((current) => current.filter((item) => item.id !== contactId));
  }, []);

  const deleteManyContacts = useCallback(async (contactIds) => {
    const { error } = await supabase.from('contacts').delete().in('id', contactIds);
    if (error) throw error;
    setContacts((current) => current.filter((item) => !contactIds.includes(item.id)));
  }, []);

  const createContact = useCallback(
    async (values) => {
      let companyId = values.company_id;

      if (!companyId && values.company_name) {
        const companyValue = values.company_name.trim();
        if (companyValue) {
          const { data: existing, error: existingError } = await supabase
            .from('companies')
            .select('id')
            .eq('name', companyValue)
            .limit(1)
            .maybeSingle();
          if (existingError) throw existingError;
          if (existing?.id) {
            companyId = existing.id;
          } else {
            const { data: createdCompany, error: createCompanyError } = await supabase
              .from('companies')
              .insert({ name: companyValue })
              .select()
              .single();
            if (createCompanyError) throw createCompanyError;
            companyId = createdCompany.id;
          }
        }
      }

      const { first_name, last_name } = splitName(values.full_name || values.name);
      const payload = {
        first_name,
        last_name,
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
      const payloads = rows.map((row) => {
        const { first_name, last_name } = splitName(row.full_name || row.name || '');
        return {
          first_name: first_name || null,
          last_name: last_name || null,
          email: row.email || null,
          phone: row.phone || null,
          job_title: row.job_title || null,
          tags: row.tags
            ? row.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : null,
          team_id: teamId || null,
          created_by: user?.id || null,
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
      const creator = teamMembers.find((member) => member.id === contact.created_by);
      return {
        ...contact,
        created_by_name: creator?.email || contact.created_by || 'Unknown',
      };
    });
  }, [contacts, teamMembers]);

  const filteredContacts = useMemo(() => {
    const query = (searchQuery || '').toLowerCase().trim();

    return sortContacts(
      displayContacts.filter((contact) => {
        const matchesSearch =
          query === '' ||
          (contact.full_name || '').toLowerCase().includes(query) ||
          (contact.email || '').toLowerCase().includes(query) ||
          (contact.phone || '').toLowerCase().includes(query) ||
          (contact.company_name || '').toLowerCase().includes(query);

        if (!matchesSearch) return false;
        if (filters.companyId && String(contact.company_id) !== String(filters.companyId)) return false;
        if (filters.tag && !contact.tags.includes(filters.tag)) return false;
        if (filters.createdBy && String(contact.created_by) !== String(filters.createdBy)) return false;
        if (filters.stage) {
          const hasStage = (contact.relationships || []).some((r) => r.stage === filters.stage);
          if (!hasStage) return false;
        }
        if (filters.hasRelationships === 'with' && contact.relationship_count === 0) return false;
        if (filters.hasRelationships === 'without' && contact.relationship_count > 0) return false;

        return true;
      }),
      filters.sortBy,
      filters.sortOrder
    );
  }, [displayContacts, filters, searchQuery]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.companyId) count++;
    if (filters.tag) count++;
    if (filters.createdBy) count++;
    if (filters.stage) count++;
    if (filters.hasRelationships !== 'all') count++;
    return count;
  }, [filters]);

  const exportCsv = useCallback((contactsToExport) => {
    const escapeValue = (value) => {
      const text = value == null ? '' : String(value);
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const headers = [
      'Name', 'Company', 'Title', 'Email', 'Phone', 'Tags',
      'Relationships', 'Stage', 'Last Contact', 'Activities', 'Created By',
    ];
    const rows = contactsToExport.map((contact) => [
      contact.full_name,
      contact.company_name,
      contact.job_title || '',
      contact.email || '',
      contact.phone || '',
      contact.tags.join(', '),
      contact.relationship_count,
      contact.primary_stage || '',
      contact.last_relationship_date || '',
      contact.activity_count,
      contact.created_by_name,
    ]);

    return [headers, ...rows].map((row) => row.map(escapeValue).join(',')).join('\r\n');
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
    setSearchQuery,
    setViewMode,
    setShowFilters,
    setFilters,
    refresh,
    updateContact,
    deleteContact,
    deleteManyContacts,
    createContact,
    importContacts,
    exportCsv,
  };
}
