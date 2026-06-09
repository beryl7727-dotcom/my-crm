import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const splitName = (fullName) => {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    first_name: parts[0] || '',
    last_name: parts.slice(1).join(' ') || '',
  };
};

const formatContact = (contact) => {
  const tags = Array.isArray(contact.tags)
    ? contact.tags
    : contact.tags
    ? String(contact.tags).split(',').map((tag) => tag.trim()).filter(Boolean)
    : [];

  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim();

  return {
    ...contact,
    full_name: fullName || contact.name || 'Unnamed contact',
    company_name: contact.company?.name || contact.company || '',
    deal_count: Array.isArray(contact.relationships) ? contact.relationships.length : 0,
    activity_count: Array.isArray(contact.activities) ? contact.activities.length : 0,
    tags,
    last_activity: contact.last_activity || contact.updated_at || contact.created_at || null,
  };
};

const sortContacts = (contacts, sortBy, sortOrder) => {
  const sorted = [...contacts];
  sorted.sort((a, b) => {
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
          .select('*, company:companies(id,name), relationships(id), activities(id)')
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
      };

      const { data, error } = await supabase.from('contacts').insert(payload).select();
      if (error) throw error;

      await fetchContacts();
      return data?.[0] || null;
    },
    [fetchContacts]
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
          (contact.company_name || '').toLowerCase().includes(query);

        if (!matchesSearch) return false;
        if (filters.companyId && String(contact.company_id) !== String(filters.companyId)) return false;
        if (filters.tag && !contact.tags.includes(filters.tag)) return false;
        if (filters.createdBy && String(contact.created_by) !== String(filters.createdBy)) return false;

        return true;
      }),
      filters.sortBy,
      filters.sortOrder
    );
  }, [displayContacts, filters, searchQuery]);

  const exportCsv = useCallback((contactsToExport) => {
    const escapeValue = (value) => {
      const text = value == null ? '' : String(value);
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const headers = ['Name', 'Company', 'Title', 'Email', 'Phone', 'Tags', 'Last Activity', 'Relationships', 'Activities', 'Created By'];
    const rows = contactsToExport.map((contact) => [
      contact.full_name,
      contact.company_name,
      contact.job_title || '',
      contact.email || '',
      contact.phone || '',
      contact.tags.join(', '),
      contact.last_activity || '',
      contact.deal_count,
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
    setSearchQuery,
    setViewMode,
    setShowFilters,
    setFilters,
    refresh,
    updateContact,
    createContact,
    exportCsv,
  };
}
