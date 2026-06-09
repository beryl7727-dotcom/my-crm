import { useMemo } from 'react';
import { TIER_PRODUCTS, PRODUCT_TIER } from '../constants/products';

export const TIER_COLORS = { 1: '#10B981', 2: '#3B82F6', 3: '#F97316' };

const isWon = (stage) => stage === 'execution' || stage === 'refresh';

function buildTierRevenue(deals) {
  const acc = { 1: { deals: 0, revenue: 0, won: 0 }, 2: { deals: 0, revenue: 0, won: 0 }, 3: { deals: 0, revenue: 0, won: 0 } };

  deals.forEach((deal) => {
    const product = deal.details?.product;
    if (!product) return;
    const tier = PRODUCT_TIER[product];
    if (!tier) return;
    acc[tier].deals += 1;
    acc[tier].revenue += Number(deal.value) || 0;
    if (isWon(deal.stage)) acc[tier].won += 1;
  });

  const totalRevenue = Object.values(acc).reduce((s, t) => s + t.revenue, 0);

  return Object.entries(TIER_PRODUCTS).map(([tierNum, meta]) => {
    const n = Number(tierNum);
    const t = acc[n];
    return {
      tier: n,
      emoji: meta.emoji,
      title: meta.title,
      focus: meta.focus,
      deals: t.deals,
      revenue: t.revenue,
      won: t.won,
      winRate: t.deals > 0 ? (t.won / t.deals) * 100 : 0,
      pct: totalRevenue > 0 ? (t.revenue / totalRevenue) * 100 : 0,
      color: TIER_COLORS[n],
    };
  });
}

function buildContactsByTier(contacts) {
  const counts = { 1: 0, 2: 0, 3: 0 };
  let noTier = 0;

  contacts.forEach((c) => {
    const t = c.focus_tier;
    if (t && counts[t] !== undefined) counts[t] += 1;
    else noTier += 1;
  });

  const total = contacts.length;
  const pieData = Object.entries(TIER_PRODUCTS).map(([tierNum, meta]) => {
    const n = Number(tierNum);
    return {
      tier: n,
      emoji: meta.emoji,
      title: meta.title,
      count: counts[n],
      pct: total > 0 ? (counts[n] / total) * 100 : 0,
      color: TIER_COLORS[n],
      name: `${meta.emoji} ${meta.title}`,
      value: counts[n],
    };
  });

  return { pieData, noTier, total };
}

function buildProductPerformance(deals) {
  const map = {};

  deals.forEach((deal) => {
    const product = deal.details?.product;
    if (!product) return;
    const tier = PRODUCT_TIER[product];
    if (!tier) return;
    if (!map[product]) map[product] = { product, tier, deals: 0, revenue: 0, won: 0 };
    map[product].deals += 1;
    map[product].revenue += Number(deal.value) || 0;
    if (isWon(deal.stage)) map[product].won += 1;
  });

  return Object.values(map).map((p) => ({
    ...p,
    winRate: p.deals > 0 ? (p.won / p.deals) * 100 : 0,
    avgDealSize: p.deals > 0 ? p.revenue / p.deals : 0,
  }));
}

export function useTierReports(deals = [], contacts = []) {
  const tierRevenue = useMemo(() => buildTierRevenue(deals), [deals]);
  const contactsByTier = useMemo(() => buildContactsByTier(contacts), [contacts]);
  const productPerformance = useMemo(() => buildProductPerformance(deals), [deals]);
  const hasData = useMemo(() => deals.some((d) => d.details?.product), [deals]);
  const hasTierContacts = useMemo(() => contacts.some((c) => c.focus_tier), [contacts]);

  return { tierRevenue, contactsByTier, productPerformance, hasData, hasTierContacts };
}
