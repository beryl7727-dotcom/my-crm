import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTeam } from '../hooks/useTeam';
import { TIER_PRODUCTS, TIER_COLORS } from '../constants/products';

// Fetches focus_tier counts directly — lightweight query, no heavy hook needed.
export default function TierDistributionCard() {
  const navigate = useNavigate();
  const { currentTeam } = useTeam();
  const [counts, setCounts] = useState(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const teamId = currentTeam?.id;
    if (!teamId) return;
    supabase
      .from('contacts')
      .select('focus_tier')
      .eq('team_id', teamId)
      .then(({ data }) => {
        if (!data) return;
        const c = { 1: 0, 2: 0, 3: 0 };
        data.forEach((row) => { if (row.focus_tier) c[row.focus_tier] = (c[row.focus_tier] || 0) + 1; });
        setCounts(c);
        setTotal(data.length);
      });
  }, [currentTeam?.id]);

  const tiers = Object.entries(TIER_PRODUCTS);
  const assignedCount = counts ? Object.values(counts).reduce((s, n) => s + n, 0) : 0;

  return (
    <div
      className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition hover:shadow-md active:scale-95 w-64"
      onClick={() => navigate('/contacts')}
      title="Click to view contacts"
    >
      <p className="text-sm font-semibold text-slate-500">Tier Distribution</p>
      <p className="mt-0.5 text-xs text-slate-400">{total} contacts total</p>

      <div className="mt-3 space-y-2">
        {tiers.map(([tierNum, meta]) => {
          const n = Number(tierNum);
          const count = counts?.[n] ?? 0;
          const pct = assignedCount > 0 ? (count / assignedCount) * 100 : 0;
          const color = TIER_COLORS[n];
          return (
            <div key={n}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium" style={{ color }}>
                  {meta.emoji} {meta.title}
                </span>
                <span className="font-bold text-slate-800">{counts === null ? '…' : count}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {counts !== null && assignedCount < total && (
        <p className="mt-2 text-xs text-slate-400">{total - assignedCount} unassigned</p>
      )}
    </div>
  );
}
