import { MARKET_LABELS, MARKET_OPTIONS, PRODUCT_LABELS, PRODUCT_OPTIONS, VOLUME_LABELS, VOLUME_OPTIONS } from '../utils/relationshipProfile';

function Chip({ children }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{children}</span>;
}

function ReadOnlyView({ products, markets, volume }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Products</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {products.length > 0 ? products.map((value) => <Chip key={value}>{PRODUCT_LABELS[value] || value}</Chip>) : <p className="text-sm text-slate-400">Not specified</p>}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Preferred Markets</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {markets.length > 0 ? markets.map((value) => <Chip key={value}>{MARKET_LABELS[value] || value}</Chip>) : <p className="text-sm text-slate-400">Not specified</p>}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Preferred Volume</p>
        <p className="mt-1.5 text-sm text-slate-700">{volume ? VOLUME_LABELS[volume] || volume : 'Not specified'}</p>
      </div>
    </div>
  );
}

// Edits the products / preferred markets (multi-select checkboxes) and the
// preferred volume (single-select radio) for a relationship's market interests.
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
      <div>
        <p className="text-sm font-medium text-slate-700">Products</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRODUCT_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                products.includes(option.value)
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              <input
                type="checkbox"
                checked={products.includes(option.value)}
                onChange={() => toggle(products, option.value, onChangeProducts)}
                className="hidden"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

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

      <div>
        <p className="text-sm font-medium text-slate-700">Preferred Volume</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {VOLUME_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                volume === option.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
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
