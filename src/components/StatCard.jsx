const COLOR_VARIANTS = {
  orange: {
    wrapper: 'bg-orange-50 border-orange-200 border-l-4 border-l-orange-400',
    value: 'text-orange-600',
  },
  purple: {
    wrapper: 'bg-purple-50 border-purple-200 border-l-4 border-l-purple-400',
    value: 'text-purple-600',
  },
  green: {
    wrapper: 'bg-green-50 border-green-200 border-l-4 border-l-green-400',
    value: 'text-green-600',
  },
  default: {
    wrapper: 'bg-white border-gray-200',
    value: 'text-slate-900',
  },
};

export default function StatCard({ title, value, subtitle, color, onClick }) {
  const variant = COLOR_VARIANTS[color] || COLOR_VARIANTS.default;
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`border px-4 py-3 rounded-md w-64 text-left transition ${variant.wrapper} ${
        onClick ? 'cursor-pointer hover:shadow-md active:scale-95' : ''
      }`}
    >
      <div className="text-sm text-gray-500">{title}</div>
      <div className={`text-2xl font-bold mt-1 ${variant.value}`}>{formatValue(value)}</div>
      {subtitle && <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div>}
    </Tag>
  );
}

function formatValue(v) {
  if (v == null) return '—';
  if (typeof v === 'number') {
    if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `$${Math.round(v / 1000)}K`;
    return `$${v}`;
  }
  return v;
}
