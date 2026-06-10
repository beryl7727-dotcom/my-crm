export const TIER_PRODUCTS = {
  1: {
    emoji: '1️⃣',
    title: 'Revenue Now',
    focus: '70% attention',
    colors: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      activeBg: 'bg-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700',
    },
    products: ['GOs', 'I-RECs', 'Biomethane', 'PPAs', 'Carbon'],
  },
  2: {
    emoji: '2️⃣',
    title: 'Strategic Infrastructure',
    focus: 'Platform/Service Partners',
    colors: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      activeBg: 'bg-blue-600',
      badge: 'bg-blue-100 text-blue-700',
    },
    products: ['Registry Services', 'Certification', 'Market Data', 'Platform Partnerships'],
  },
  3: {
    emoji: '3️⃣',
    title: 'Corporate Demand',
    focus: 'Slower cycles, large volumes',
    colors: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      activeBg: 'bg-orange-500',
      badge: 'bg-orange-100 text-orange-700',
    },
    products: ['EAC Procurement', 'Renewable PPAs', 'Sustainability Reporting', 'Scope 2 Compliance'],
  },
};

// Hex colours per tier (used in charts and inline styles)
export const TIER_COLORS = { 1: '#10B981', 2: '#3B82F6', 3: '#F97316' };

// Flat list of all products across tiers (for dropdowns etc.)
export const ALL_PRODUCTS = Object.values(TIER_PRODUCTS).flatMap((t) => t.products);

// product name → tier number (e.g. 'GOs' → 1)
export const PRODUCT_TIER = {};
Object.entries(TIER_PRODUCTS).forEach(([tier, { products }]) => {
  products.forEach((p) => { PRODUCT_TIER[p] = Number(tier); });
});

// tier number → meta shorthand
export const tierMeta = (tier) => TIER_PRODUCTS[tier] || null;
