import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTeam } from '../hooks/useTeam';
import { CHANNELS, CHANNEL_META } from '../utils/messageTemplates';
import { formatDateTime } from '../utils/formatters';

export default function SentHistory({ templates = [] }) {
  const { currentTeam } = useTeam();
  const teamId = currentTeam?.id || null;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [contactFilter, setContactFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchHistory() {
      if (!teamId) {
        setMessages([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*, contact:contacts(id, first_name, last_name, company:companies(name)), template:templates(id, name)')
          .eq('team_id', teamId)
          .not('message_channel', 'is', null)
          .order('activity_date', { ascending: false });
        if (error) throw error;
        if (!cancelled) setMessages(data || []);
      } catch (err) {
        console.error('SentHistory fetch error', err);
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  const contactOptions = useMemo(() => {
    const map = new Map();
    messages.forEach((msg) => {
      if (!msg.contact) return;
      const name = [msg.contact.first_name, msg.contact.last_name].filter(Boolean).join(' ').trim();
      if (name && !map.has(msg.contact.id)) map.set(msg.contact.id, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [messages]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    return messages.filter((msg) => {
      if (channelFilter !== 'all' && msg.message_channel !== channelFilter) return false;
      if (templateFilter !== 'all' && String(msg.template_id || '') !== templateFilter) return false;
      if (contactFilter && String(msg.contact_id || '') !== contactFilter) return false;

      const sentAt = msg.activity_date ? new Date(msg.activity_date) : null;
      if (start && (!sentAt || sentAt < start)) return false;
      if (end && (!sentAt || sentAt > end)) return false;

      if (term) {
        const haystack = `${msg.title || ''} ${msg.description || ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [messages, query, channelFilter, templateFilter, contactFilter, startDate, endDate]);

  const clearFilters = () => {
    setQuery('');
    setChannelFilter('all');
    setTemplateFilter('all');
    setContactFilter('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Sent History</h2>
        <p className="mt-1 text-sm text-slate-500">Every templated message sent through the Messaging Hub, logged as an activity.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by content..."
          className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none lg:col-span-2"
        />
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All channels</option>
          {CHANNELS.map((value) => (
            <option key={value} value={value}>
              {CHANNEL_META[value].icon} {CHANNEL_META[value].label}
            </option>
          ))}
        </select>
        <select
          value={contactFilter}
          onChange={(e) => setContactFilter(e.target.value)}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All contacts</option>
          {contactOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <select
          value={templateFilter}
          onChange={(e) => setTemplateFilter(e.target.value)}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All templates</option>
          {templates.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {tpl.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          <span className="text-slate-400">–</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          {filtered.length} message{filtered.length === 1 ? '' : 's'}
        </span>
        <button type="button" onClick={clearFilters} className="font-medium text-blue-600 hover:text-blue-700">
          Clear filters
        </button>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading sent history...</p>}
      {error && <p className="text-sm text-rose-600">Failed to load sent history.</p>}

      {!loading && filtered.length === 0 && (
        <p className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No messages found for these filters.
        </p>
      )}

      <div className="space-y-3">
        {filtered.map((msg) => {
          const meta = CHANNEL_META[msg.message_channel] || {};
          const contactName = msg.contact
            ? [msg.contact.first_name, msg.contact.last_name].filter(Boolean).join(' ').trim()
            : 'Unknown contact';
          const companyName = msg.contact?.company?.name;
          return (
            <div key={msg.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.colors?.bg} ${meta.colors?.text}`}>
                    {meta.icon} {meta.label || msg.message_channel}
                  </span>
                  <span className="text-sm font-medium text-slate-800">
                    To {contactName}
                    {companyName && <span className="text-slate-400"> · {companyName}</span>}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{formatDateTime(msg.activity_date)}</span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{msg.description || msg.title}</p>
              {msg.template?.name && (
                <p className="mt-2 text-xs font-medium text-slate-400">Template: {msg.template.name}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
