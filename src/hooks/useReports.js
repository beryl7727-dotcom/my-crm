import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchTeamDeals,
  fetchTeamMembers,
  fetchContactsForReports,
  buildPipelineCsv,
  buildContactsCsv,
} from '../utils/reportQueries';
import { STAGES, STAGE_LABELS, PRE_EXECUTION_STAGES } from '../utils/relationshipStages';

const CACHE_TTL_MS = 30000;
// Module-level cache so switching pages within the TTL window skips a re-fetch.
const cache = new Map();

const STAGE_ORDER = STAGES;

const stageLabel = (stage) => {
  if (!stage) return 'Unknown';
  return STAGE_LABELS[stage] || stage.charAt(0).toUpperCase() + stage.slice(1);
};

const isPreExecution = (stage) => PRE_EXECUTION_STAGES.includes(stage);
const isExecutedOrBeyond = (stage) => stage === 'execution' || stage === 'refresh';

const sameMonth = (dateValue, reference) => {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
};

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

function buildPipelineByStage(deals) {
  const map = new Map();
  deals.forEach((deal) => {
    const stage = deal.stage || 'unknown';
    if (!map.has(stage)) {
      map.set(stage, { stage, label: stageLabel(stage), value: 0, count: 0 });
    }
    const entry = map.get(stage);
    entry.value += Number(deal.value) || 0;
    entry.count += 1;
  });

  const ordered = STAGE_ORDER.filter((stage) => map.has(stage)).map((stage) => map.get(stage));
  const extras = Array.from(map.values()).filter((entry) => !STAGE_ORDER.includes(entry.stage));
  return [...ordered, ...extras];
}

function buildPipelineTrend(deals, days = 7) {
  const today = startOfDay(new Date());
  const buckets = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    buckets.push({ time: day.getTime(), label: day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), value: 0 });
  }

  deals.forEach((deal) => {
    if (!deal.created_at) return;
    const createdDay = startOfDay(new Date(deal.created_at)).getTime();
    const bucket = buckets.find((item) => item.time === createdDay);
    if (bucket) bucket.value += Number(deal.value) || 0;
  });

  return buckets.map(({ label, value }) => ({ label, value }));
}

function computeMetrics(deals) {
  const activeDeals = deals.filter((deal) => isPreExecution(deal.stage));
  const activePipelineValue = activeDeals.reduce((acc, deal) => acc + (Number(deal.value) || 0), 0);

  const executedCount = deals.filter((deal) => isExecutedOrBeyond(deal.stage)).length;
  const executionRate = deals.length > 0 ? (executedCount / deals.length) * 100 : 0;

  const dealsWithValue = deals.filter((deal) => Number(deal.value) > 0);
  const averageDealSize = dealsWithValue.length
    ? dealsWithValue.reduce((acc, deal) => acc + Number(deal.value), 0) / dealsWithValue.length
    : 0;

  const dealsByStage = buildPipelineByStage(deals).map(({ stage, label, count }) => ({ stage, label, count }));

  return { activePipelineValue, executionRate, averageDealSize, dealsByStage };
}

function buildLeaderboard(deals, members) {
  const now = new Date();
  const map = new Map();

  members.forEach((member) => {
    map.set(member.id, {
      id: member.id,
      name: member.full_name || member.email || 'Unknown',
      dealCount: 0,
      totalValue: 0,
      executedThisMonth: 0,
    });
  });

  deals.forEach((deal) => {
    const ownerId = deal.created_by;
    if (!ownerId) return;
    if (!map.has(ownerId)) {
      map.set(ownerId, { id: ownerId, name: 'Unknown', dealCount: 0, totalValue: 0, executedThisMonth: 0 });
    }
    const entry = map.get(ownerId);
    entry.dealCount += 1;
    entry.totalValue += Number(deal.value) || 0;
    if (deal.stage === 'execution' && sameMonth(deal.updated_at, now)) {
      entry.executedThisMonth += Number(deal.value) || 0;
    }
  });

  return Array.from(map.values());
}

function buildContactTrends(contacts) {
  const now = new Date();
  const monthContacts = contacts.filter((contact) => sameMonth(contact.created_at, now));

  const weekCount = Math.floor((now.getDate() - 1) / 7) + 1;
  const byWeek = Array.from({ length: weekCount }, (_, index) => ({ label: `Week ${index + 1}`, count: 0 }));
  monthContacts.forEach((contact) => {
    const date = new Date(contact.created_at);
    const weekIndex = Math.min(Math.floor((date.getDate() - 1) / 7), weekCount - 1);
    byWeek[weekIndex].count += 1;
  });

  const mostActive = [...contacts]
    .filter((contact) => contact.activity_count > 0)
    .sort((a, b) => b.activity_count - a.activity_count)
    .slice(0, 5);

  return { newThisMonth: monthContacts.length, byWeek, mostActive };
}

const normalizeContact = (contact) => ({
  ...contact,
  full_name: [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim() || 'Unnamed contact',
  company_name: contact.company?.name || '',
  activity_count: Array.isArray(contact.activities) ? contact.activities.length : 0,
});

export default function useReports(teamId) {
  const [deals, setDeals] = useState([]);
  const [members, setMembers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const fetchAll = useCallback(
    async ({ force = false } = {}) => {
      if (!teamId) {
        setDeals([]);
        setMembers([]);
        setContacts([]);
        setLoading(false);
        return;
      }

      const cached = cache.get(teamId);
      const now = Date.now();
      if (!force && cached && now - cached.timestamp < CACHE_TTL_MS) {
        setDeals(cached.deals);
        setMembers(cached.members);
        setContacts(cached.contacts);
        setLastUpdated(cached.timestamp);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const [dealsData, membersData, contactsData] = await Promise.all([
          fetchTeamDeals(teamId),
          fetchTeamMembers(teamId),
          fetchContactsForReports(),
        ]);
        const timestamp = Date.now();
        cache.set(teamId, { deals: dealsData, members: membersData, contacts: contactsData, timestamp });
        setDeals(dealsData);
        setMembers(membersData);
        setContacts(contactsData);
        setLastUpdated(timestamp);
      } catch (err) {
        console.error('useReports fetch error', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [teamId]
  );

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => fetchAll(), CACHE_TTL_MS);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const refresh = useCallback(() => fetchAll({ force: true }), [fetchAll]);

  const normalizedContacts = useMemo(() => contacts.map(normalizeContact), [contacts]);

  const leaderboard = useMemo(() => buildLeaderboard(deals, members), [deals, members]);

  const selectedMember = useMemo(
    () => leaderboard.find((member) => member.id === selectedMemberId) || null,
    [leaderboard, selectedMemberId]
  );

  const scopedDeals = useMemo(
    () => (selectedMemberId ? deals.filter((deal) => deal.created_by === selectedMemberId) : deals),
    [deals, selectedMemberId]
  );

  const pipelineByStage = useMemo(() => buildPipelineByStage(scopedDeals), [scopedDeals]);
  const pipelineTrend = useMemo(() => buildPipelineTrend(scopedDeals), [scopedDeals]);
  const metrics = useMemo(() => computeMetrics(scopedDeals), [scopedDeals]);

  const contactTrends = useMemo(() => buildContactTrends(normalizedContacts), [normalizedContacts]);

  const exportPipelineCsv = useCallback(() => buildPipelineCsv(deals), [deals]);
  const exportContactsCsv = useCallback(() => buildContactsCsv(normalizedContacts), [normalizedContacts]);

  return {
    loading,
    error,
    lastUpdated,
    refresh,
    pipelineByStage,
    pipelineTrend,
    metrics,
    leaderboard,
    selectedMemberId,
    selectedMember,
    setSelectedMemberId,
    contactTrends,
    exportPipelineCsv,
    exportContactsCsv,
  };
}
