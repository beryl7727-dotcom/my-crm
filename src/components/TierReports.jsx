import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { useTierReports, TIER_COLORS } from '../hooks/useTierReports';
import { TIER_PRODUCTS } from '../constants/products';
import { formatCurrency } from '../utils/formatters';

const fmt = (n) => `${Math.round(n)}%`;

function TierStatRow({ emoji, title, deals, revenue, winRate, pct, color }) {
  return (
    <tr className="border-t border-slate-100">
      <td className="py-2.5 pr-4 text-sm">
        <span className="font-semibold" style={{ color }}>{emoji}</span>
        <span className="ml-2 text-slate-700">{title}</span>
      </td>
      <td className="py-2.5 pr-4 text-right text-sm font-medium text-slate-800">{deals}</td>
      <td className="py-2.5 pr-4 text-right text-sm font-medium text-slate-800">{formatCurrency(revenue)}</td>
      <td className="py-2.5 pr-4 text-right text-sm font-medium text-slate-800">{fmt(winRate)}</td>
      <td className="py-2.5 text-right text-sm font-medium text-slate-800">{fmt(pct)}</td>
    </tr>
  );
}

function ProductRow({ product, tier, deals, revenue, winRate, avgDealSize }) {
  const meta = TIER_PRODUCTS[tier];
  const color = TIER_COLORS[tier];
  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50">
      <td className="py-2 pr-4 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <span className="text-xs" style={{ color }}>{meta?.emoji}</span>
          <span className="text-slate-700">{product}</span>
        </span>
      </td>
      <td className="py-2 pr-4 text-right text-sm text-slate-600">{deals}</td>
      <td className="py-2 pr-4 text-right text-sm text-slate-600">{formatCurrency(revenue)}</td>
      <td className="py-2 pr-4 text-right text-sm text-slate-600">{fmt(winRate)}</td>
      <td className="py-2 text-right text-sm text-slate-600">{formatCurrency(avgDealSize)}</td>
    </tr>
  );
}

const TIER_PIE_LABEL = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="600">
      {`${Math.round(percent * 100)}%`}
    </text>
  );
};

export default function TierReports({ deals, contacts }) {
  const { tierRevenue, contactsByTier, productPerformance, hasData, hasTierContacts } = useTierReports(deals, contacts);

  const barData = tierRevenue.map((t) => ({
    name: `${t.emoji} ${t.title}`,
    Revenue: t.revenue,
    Deals: t.deals,
    fill: t.color,
  }));

  // Group product performance by tier
  const byTier = {};
  productPerformance.forEach((p) => {
    if (!byTier[p.tier]) byTier[p.tier] = [];
    byTier[p.tier].push(p);
  });

  return (
    <section className="space-y-8">
      <h2 className="text-xl font-semibold text-slate-900">Tier Analytics</h2>

      {/* ── Revenue by Tier ─────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-5">
        <h3 className="text-base font-semibold text-slate-800">Revenue by Tier</h3>

        {!hasData ? (
          <p className="text-sm text-slate-400">
            No tier data yet. Assign products when creating relationships to see this report.
          </p>
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11, fill: '#475569' }} width={80} />
                  <Tooltip formatter={(value, name) => name === 'Revenue' ? formatCurrency(value) : value} />
                  <Bar dataKey="Revenue" radius={[8, 8, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="pb-2 pr-4 text-left">Tier</th>
                    <th className="pb-2 pr-4 text-right">Deals</th>
                    <th className="pb-2 pr-4 text-right">Revenue</th>
                    <th className="pb-2 pr-4 text-right">Win Rate</th>
                    <th className="pb-2 text-right">Revenue %</th>
                  </tr>
                </thead>
                <tbody>
                  {tierRevenue.map((t) => (
                    <TierStatRow key={t.tier} {...t} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Contacts by Tier ────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">Contact Focus Distribution</h3>
          <span className="text-xs text-slate-400">{contactsByTier.total} total contacts</span>
        </div>

        {!hasTierContacts ? (
          <p className="text-sm text-slate-400">
            No focus tiers assigned yet. Set a Focus Tier in each contact's Profile tab.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="h-52 w-full max-w-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contactsByTier.pieData.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    dataKey="value"
                    labelLine={false}
                    label={TIER_PIE_LABEL}
                  >
                    {contactsByTier.pieData.map((entry) => (
                      <Cell key={entry.tier} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} contacts`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 space-y-2">
              {contactsByTier.pieData.map((t) => (
                <div key={t.tier} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="text-sm font-medium text-slate-700">{t.emoji} {t.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-slate-900">{t.count}</span>
                    <span className="text-xs text-slate-400">{fmt(t.pct)}</span>
                  </div>
                </div>
              ))}
              {contactsByTier.noTier > 0 && (
                <p className="px-2 text-xs text-slate-400">+ {contactsByTier.noTier} with no tier assigned</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Product Performance by Tier ─────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-6">
        <h3 className="text-base font-semibold text-slate-800">Product Performance by Tier</h3>

        {!hasData ? (
          <p className="text-sm text-slate-400">No product data yet.</p>
        ) : (
          Object.entries(TIER_PRODUCTS).map(([tierNum, meta]) => {
            const n = Number(tierNum);
            const rows = (byTier[n] || []).sort((a, b) => b.revenue - a.revenue);
            const color = TIER_COLORS[n];

            return (
              <div key={n}>
                <div
                  className="mb-3 flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold"
                  style={{ backgroundColor: `${color}18`, color }}
                >
                  {meta.emoji} {meta.title}
                  <span className="ml-1 font-normal text-slate-500">— {meta.focus}</span>
                </div>

                {rows.length === 0 ? (
                  <p className="px-3 text-xs text-slate-400">No deals with {meta.title} products yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px]">
                      <thead>
                        <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          <th className="pb-1.5 pr-4 text-left">Product</th>
                          <th className="pb-1.5 pr-4 text-right">Deals</th>
                          <th className="pb-1.5 pr-4 text-right">Revenue</th>
                          <th className="pb-1.5 pr-4 text-right">Win Rate</th>
                          <th className="pb-1.5 text-right">Avg Deal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((p) => <ProductRow key={p.product} {...p} />)}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
