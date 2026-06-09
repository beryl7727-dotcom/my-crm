import { useCallback, useState } from 'react';
import { useDealMutations } from './useDealMutations';
import { CHANNEL_META } from '../utils/messageTemplates';

// Builds a deep link to hand off to the contact's preferred app where one
// exists (mailto / WhatsApp web). Channels without a reliable deep link
// (Telegram, LinkedIn) fall back to copying the message to the clipboard.
const buildChannelLink = (channel, contact, message) => {
  switch (channel) {
    case 'email': {
      const email = contact?.email;
      return email ? `mailto:${email}?body=${encodeURIComponent(message)}` : null;
    }
    case 'whatsapp': {
      const digits = (contact?.phone || '').replace(/[^\d+]/g, '').replace(/^\+/, '');
      return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null;
    }
    default:
      return null;
  }
};

export function useSendMessage() {
  const { createActivity } = useDealMutations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(
    async ({ contact, deal = null, channel, message, template = null }) => {
      setLoading(true);
      setError(null);
      try {
        const meta = CHANNEL_META[channel];
        const contactName = [contact?.first_name, contact?.last_name].filter(Boolean).join(' ').trim() || 'this contact';

        const link = buildChannelLink(channel, contact, message);
        let handoff = 'logged';
        if (link) {
          window.open(link, '_blank', 'noopener,noreferrer');
          handoff = 'opened';
        } else if (navigator.clipboard?.writeText) {
          try {
            await navigator.clipboard.writeText(message);
            handoff = 'copied';
          } catch {
            handoff = 'logged';
          }
        }

        const activity = await createActivity({
          contact_id: contact?.id || null,
          deal_id: deal?.id || null,
          activity_type: 'message',
          title: `${meta?.activityTitle || 'Sent message'} to ${contactName}`,
          description: message,
          activity_date: new Date().toISOString(),
          message_channel: channel,
          template_id: template?.id || null,
        });

        return { activity, contactName, handoff };
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [createActivity]
  );

  return { sendMessage, loading, error };
}
