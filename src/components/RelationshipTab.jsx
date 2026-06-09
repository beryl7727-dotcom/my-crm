import RelationshipScoreStar from './RelationshipScoreStar';
import MarketInterests from './MarketInterests';
import { CHANNEL_META } from '../utils/messageTemplates';
import { formatDateTime } from '../utils/formatters';

// Relationship tab: editable score, auto-filled meeting/trade dates,
// preferred communication, and editable market interests.
export default function RelationshipTab({ relationship, onUpdateScore, onUpdateRelationship }) {
  const lastMeeting = relationship?.computed_last_meeting_date || relationship?.last_meeting_date || null;
  const lastTrade = relationship?.computed_last_trade_date || relationship?.last_trade_date || null;
  const channel = relationship?.preferred_communication ? CHANNEL_META[relationship.preferred_communication] : null;

  const handleProductsChange = (next) => onUpdateRelationship({ products_interested: next });
  const handleMarketsChange = (next) => onUpdateRelationship({ preferred_markets: next });
  const handleVolumeChange = (next) => onUpdateRelationship({ preferred_volume: next });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-sm font-medium text-slate-700">Relationship Score</p>
          <div className="mt-2">
            <RelationshipScoreStar score={relationship?.relationship_score} onChange={onUpdateScore} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-sm font-medium text-slate-700">Preferred Communication</p>
          <p className="mt-2 text-sm text-slate-700">
            {channel ? (
              <span>
                {channel.icon} {channel.label}
              </span>
            ) : (
              <span className="text-slate-400">Not set</span>
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Last Meeting</p>
          <p className="mt-1 text-sm font-medium text-slate-800">{lastMeeting ? formatDateTime(lastMeeting) : 'No meetings logged yet'}</p>
          <p className="mt-0.5 text-xs text-slate-400">Auto-filled from logged meeting activities</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Last Trade</p>
          <p className="mt-1 text-sm font-medium text-slate-800">{lastTrade ? formatDateTime(lastTrade) : 'No trades executed yet'}</p>
          <p className="mt-0.5 text-xs text-slate-400">Auto-filled from execution-stage relationships</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700">Market Interests</h3>
        <div className="mt-3">
          <MarketInterests
            products={relationship?.products_interested || []}
            markets={relationship?.preferred_markets || []}
            volume={relationship?.preferred_volume || null}
            onChangeProducts={handleProductsChange}
            onChangeMarkets={handleMarketsChange}
            onChangeVolume={handleVolumeChange}
          />
        </div>
      </div>
    </div>
  );
}
