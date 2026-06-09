import { useEffect, useMemo, useState } from 'react';
import { toast } from '../../utils/toast';
import { useSendMessage } from '../../hooks/useSendMessage';
import { CHANNELS, CHANNEL_META, buildTemplateContext, fillTemplate } from '../../utils/messageTemplates';

const contactLabel = (contact) => {
  if (!contact) return '';
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim() || contact.full_name;
  return contact.company_name ? `${name} · ${contact.company_name}` : name;
};

export default function MessageComposer({
  contacts = [],
  templates = [],
  deal = null,
  initialContact = null,
  initialChannel = null,
  initialTemplate = null,
  onClose,
  onSent,
}) {
  const { sendMessage, loading } = useSendMessage();

  const [contactQuery, setContactQuery] = useState(initialContact ? contactLabel(initialContact) : '');
  const [contact, setContact] = useState(initialContact);
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [channel, setChannel] = useState(initialChannel || CHANNELS[0]);
  const [templateId, setTemplateId] = useState(initialTemplate?.id || '');
  const [message, setMessage] = useState('');

  const selectedTemplate = useMemo(
    () => templates.find((tpl) => tpl.id === templateId) || null,
    [templates, templateId]
  );

  const context = useMemo(() => buildTemplateContext(contact, deal), [contact, deal]);

  // Keep the editable message in sync whenever the template or the contact
  // (whose details fill the template's variables) changes.
  useEffect(() => {
    if (selectedTemplate) {
      setMessage(fillTemplate(selectedTemplate.body, context));
    }
  }, [selectedTemplate, context]);

  const filteredContacts = useMemo(() => {
    const term = contactQuery.trim().toLowerCase();
    if (!term) return contacts.slice(0, 8);
    return contacts
      .filter((c) => contactLabel(c).toLowerCase().includes(term) || (c.email || '').toLowerCase().includes(term))
      .slice(0, 8);
  }, [contacts, contactQuery]);

  const meta = CHANNEL_META[channel];
  const contactName = contact ? [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim() || 'this contact' : '';

  const handleSelectContact = (selected) => {
    setContact(selected);
    setContactQuery(contactLabel(selected));
    setShowContactOptions(false);
  };

  const handleSend = async () => {
    if (!contact) {
      toast.error('Select a contact to message');
      return;
    }
    if (!message.trim()) {
      toast.error('Write a message before sending');
      return;
    }
    try {
      const { handoff } = await sendMessage({ contact, deal, channel, message, template: selectedTemplate });
      if (handoff === 'opened') {
        toast.success(`${meta.label} opened — message sent and logged`);
      } else if (handoff === 'copied') {
        toast.success('Message copied to clipboard and logged as an activity');
      } else {
        toast.success('Message sent');
      }
      onSent && onSent();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to send message');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">New Message</h2>
            <p className="text-sm text-slate-500">Compose, preview and send — it'll be logged as an activity automatically.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            Close
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="relative space-y-2">
              <label className="text-sm font-medium text-slate-700">1. Contact</label>
              <input
                value={contactQuery}
                onChange={(e) => {
                  setContactQuery(e.target.value);
                  setContact(null);
                  setShowContactOptions(true);
                }}
                onFocus={() => setShowContactOptions(true)}
                placeholder="Type a name to search relationships..."
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              />
              {showContactOptions && filteredContacts.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
                  {filteredContacts.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectContact(c)}
                      className="block w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                    >
                      <span className="font-medium text-slate-800">{[c.first_name, c.last_name].filter(Boolean).join(' ') || c.full_name}</span>
                      {c.company_name && <span className="ml-2 text-slate-400">{c.company_name}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">2. Channel</label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((value) => {
                  const channelMeta = CHANNEL_META[value];
                  const active = channel === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setChannel(value)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        active ? channelMeta.colors.solid + ' border-transparent' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {channelMeta.icon} {channelMeta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">3. Template</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Start blank</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.category} · {tpl.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">4. Edit message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Write your message..."
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">5. Preview</label>
            <div className={`h-full rounded-3xl border p-5 ${meta.colors.bg} ${meta.colors.border}`}>
              <div className="mb-3 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${meta.colors.dot}`} />
                <span className={`text-sm font-semibold ${meta.colors.text}`}>
                  {meta.icon} {meta.label} {contact ? `to ${contactName}` : ''}
                </span>
              </div>
              <p className="whitespace-pre-line text-sm text-slate-700">{message || 'Your message preview will appear here...'}</p>
              {!contact && <p className="mt-4 text-xs text-slate-400">Select a contact to personalize and send.</p>}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={loading}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${meta.colors.solid}`}
          >
            {loading ? 'Sending...' : `${meta.sendLabel}`}
          </button>
        </div>
      </div>
    </div>
  );
}
