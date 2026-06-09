import { useMemo } from 'react';

const DAY = 1000 * 60 * 60 * 24;

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  return (Date.now() - new Date(dateStr).getTime()) / DAY;
}

function isThisMonth(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export const AUTO_SEGMENTS = [
  {
    key: 'new',
    label: 'New Contacts',
    description: 'Created this month',
    color: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
  {
    key: 'active',
    label: 'Active',
    description: 'Last contact < 30 days',
    color: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  {
    key: 'warm',
    label: 'Warm',
    description: 'Relationship score 3–4',
    color: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  {
    key: 'hot',
    label: 'Hot',
    description: 'Relationship score 5',
    color: 'bg-rose-100 text-rose-700',
    dot: 'bg-rose-500',
  },
  {
    key: 'cold',
    label: 'Cold',
    description: 'No contact > 60 days',
    color: 'bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
  },
  {
    key: 'dormant',
    label: 'Dormant',
    description: 'No contact > 90 days',
    color: 'bg-slate-200 text-slate-500',
    dot: 'bg-slate-300',
  },
  {
    key: 'repeat_traders',
    label: 'Repeat Traders',
    description: '2+ executed relationships',
    color: 'bg-purple-100 text-purple-700',
    dot: 'bg-purple-500',
  },
];

function matchesSegment(contact, segmentKey) {
  const lastContact = contact.last_activity_date || contact.last_activity || contact.updated_at;
  const days = daysSince(lastContact);
  const score = contact.relationship_score || 0;
  const execCount = (contact.relationships || []).filter(
    (r) => r.stage === 'execution' || r.stage === 'refresh'
  ).length;

  switch (segmentKey) {
    case 'new':
      return isThisMonth(contact.created_at);
    case 'active':
      return days <= 30;
    case 'warm':
      return score >= 3 && score <= 4;
    case 'hot':
      return score === 5;
    case 'cold':
      return days > 60 && days <= 90;
    case 'dormant':
      return days > 90;
    case 'repeat_traders':
      return execCount >= 2;
    default:
      return false;
  }
}

export function useSegments(contacts = []) {
  const segments = useMemo(() => {
    return AUTO_SEGMENTS.map((seg) => {
      const matching = contacts.filter((c) => matchesSegment(c, seg.key));
      return { ...seg, count: matching.length, contacts: matching };
    });
  }, [contacts]);

  const getSegmentFilter = (segmentKey) => {
    return (contact) => matchesSegment(contact, segmentKey);
  };

  return { segments, getSegmentFilter };
}
