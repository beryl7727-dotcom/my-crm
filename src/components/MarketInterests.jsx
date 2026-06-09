import { MARKET_LABELS, MARKET_OPTIONS, VOLUME_LABELS, VOLUME_OPTIONS } from '../utils/relationshipProfile';
import { TIER_PRODUCTS } from '../constants/products';

function Chip({ children }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{children}</span>;
}

function TierChip({ product, tier }) {
  const meta = TIER_PRODUCTS[tier];
  if (!meta) return <Chip>{product}</Chip>;
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${meta.colors.badge}`}>
      {meta.emoji} {product}
    </span>
  );
}

function ReadOnlyView({ products, markets, volume }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Products</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {products.length > 0
            ? products.map((p) => {
                // find which tier this product belongs to
                const tier = Object.entries(TIER_PRODUCTS).find(([, t]) => t.products.includes(p))?.[0];
                return <TierChip key={p} product={p} tier={Number(tier)} />;
              })
            : <p className="text-sm text-slate-400">Not specified</p>}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Preferred Markets</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {markets.length > 0
            ? markets.map((v) => <Chip key={v}>{MARKET_LABELS[v] || v}</Chip>)
            : <p className="text-sm text-slate-400">Not specified</p>}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Preferred Volume</p>
        <p className="mt-1.5 text-sm text-slate-700">{volume ? VOLUME_LABELS[volume] || volume : 'Not specified'}</p>
      </div>
    </div>
  );
}

export default function MarketInterests({
  products = [],
  markets = [],
  volume = null,
  onChangeProducts,
  onChangeMarkets,
  onChangeVolume,
  readOnly = false,
}) {
  if (readOnly) {
    return <ReadOnlyView products={products} markets={markets} volume={volume} />;
  }

  const toggle = (list, value, onChange) => {
    const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
    onChange(next);
  };

  return (
    <div className="space-y-5">
      {/* Products grouped by tier */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-3">Products</p>
        <div className="space-y-3">
          {Object.entries(TIER_PRODUCTS).map(([tierNum, tier]) => (
            <div key={tierNum} className={`rounded-2xl border p-3 ${tier.colors.bg} ${tier.colors.border}`}>
              <p className={`mb-2 text-xs font-semibold ${tier.colors.text}`}>
                {tier.emoji} {tier.title}
                <span className="ml-1.5 font-normal text-slate-400">— {tier.focus}</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tier.products.map((product) => {
                  const active = products.includes(product);
                  return (
                    <button
                      key={product}
                      type="button"
                      onClick={() => toggle(products, product, onChangeProducts)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        active
                          ? `${tier.colors.activeBg} border-transparent text-white`
                          : `border-slate-300 bg-white ${tier.colors.text} hover:border-slate-400`
                      }`}
                    >
                      {product}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preferred Markets */}
      <div>
        <p className="text-sm font-medium text-slate-700">Preferred Markets</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {MARKET_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                markets.includes(option.value)
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              <input
                type="checkbox"
                checked={markets.includes(option.value)}
                onChange={() => toggle(markets, option.value, onChangeMarkets)}
                className="hidden"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {/* Preferred Volume */}
      <div>
        <p className="text-sm font-medium text-slate-700">Preferred Volume</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {VOLUME_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                volume === option.value
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              <input
                type="radio"
                name="preferred_volume"
                checked={volume === option.value}
                onChange={() => onChangeVolume(option.value)}
                className="h-4 w-4 accent-blue-600"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
