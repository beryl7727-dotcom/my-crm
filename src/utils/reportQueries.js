import { supabase } from '../lib/supabase';

export async function fetchTeamDeals(teamId) {
  const { data, error } = await supabase
    .from('relationships')
    .select(
      'id, title, value, stage, probability, created_by, created_at, updated_at, contact:contacts(first_name,last_name), company:companies(name)'
    )
    .eq('team_id', teamId);
  if (error) throw error;
  return data || [];
}

export async function fetchTeamMembers(teamId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('team_id', teamId)
    .order('email', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchContactsForReports() {
  const { data, error } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email, created_at, company:companies(name), activities(id)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

const escapeCsvValue = (value) => {
  const text = value == null ? '' : String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const toCsv = (headers, rows) =>
  [headers, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\r\n');

export function buildPipelineCsv(deals) {
  const headers = ['Title', 'Company', 'Contact', 'Value', 'Stage', 'Probability', 'Created'];
  const rows = (deals || []).map((deal) => [
    deal.title || '',
    deal.company?.name || '',
    deal.contact ? `${deal.contact.first_name || ''} ${deal.contact.last_name || ''}`.trim() : '',
    deal.value ?? '',
    deal.stage || '',
    deal.probability ?? '',
    deal.created_at || '',
  ]);
  return toCsv(headers, rows);
}

export function buildContactsCsv(contacts) {
  const headers = ['Name', 'Email', 'Company', 'Created', 'Activities'];
  const rows = (contacts || []).map((contact) => [
    contact.full_name || '',
    contact.email || '',
    contact.company_name || '',
    contact.created_at || '',
    contact.activity_count ?? 0,
  ]);
  return toCsv(headers, rows);
}
