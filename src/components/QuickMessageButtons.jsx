import { CHANNELS, CHANNEL_META } from '../utils/messageTemplates';

export default function QuickMessageButtons({ contact, deal = null, onSelectChannel, className = '' }) {
  if (!contact) return null;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {CHANNELS.map((channel) => {
        const meta = CHANNEL_META[channel];
        return (
          <button
            key={channel}
            type="button"
            title={`${meta.label} ${[contact.first_name, contact.last_name].filter(Boolean).join(' ')}`.trim()}
            onClick={(event) => {
              event.stopPropagation();
              onSelectChannel({ contact, deal, channel });
            }}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-sm transition hover:scale-110 ${meta.colors.bg} ${meta.colors.text}`}
          >
            {meta.icon}
          </button>
        );
      })}
    </div>
  );
}
