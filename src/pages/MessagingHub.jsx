import { useMemo, useState } from 'react';
import { useContacts } from '../hooks/useContacts';
import { useTemplates } from '../hooks/useTemplates';
import { toast } from '../utils/toast';
import TemplateLibrary from '../components/TemplateLibrary';
import SentHistory from '../components/SentHistory';
import QuickMessageButtons from '../components/QuickMessageButtons';
import TemplateForm from '../components/modals/TemplateForm';
import MessageComposer from '../components/modals/MessageComposer';
import { STARTER_TEMPLATES } from '../utils/messageTemplates';

const TABS = [
  { key: 'contacts', label: 'Contacts' },
  { key: 'templates', label: 'Templates' },
  { key: 'history', label: 'Sent History' },
];

function ContactsTab({ contacts, loading, onSelectChannel, onCompose }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return contacts;
    return contacts.filter(
      (contact) =>
        (contact.full_name || '').toLowerCase().includes(term) ||
        (contact.company_name || '').toLowerCase().includes(term) ||
        (contact.email || '').toLowerCase().includes(term)
    );
  }, [contacts, query]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Contacts</h2>
          <p className="mt-1 text-sm text-slate-500">Pick a relationship and send a templated message in one click.</p>
        </div>
        <button
          type="button"
          onClick={() => onCompose(null)}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Compose message
        </button>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search contacts by name, company or email..."
        className="w-full max-w-md rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
      />

      {loading && <p className="text-sm text-slate-500">Loading contacts...</p>}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        {filtered.map((contact) => (
          <div key={contact.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 last:border-b-0">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{contact.full_name}</p>
              <p className="truncate text-xs text-slate-500">
                {[contact.company_name, contact.email].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onCompose(contact)}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Compose
              </button>
              <QuickMessageButtons contact={contact} onSelectChannel={onSelectChannel} />
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-slate-500">No contacts match your search.</p>
        )}
      </div>
    </section>
  );
}

export default function MessagingHub() {
  const [activeTab, setActiveTab] = useState('contacts');
  const { allContacts, loading: contactsLoading } = useContacts();
  const {
    templates,
    loading: templatesLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleFavorite,
    loadStarterTemplates,
  } = useTemplates();

  const [templateForm, setTemplateForm] = useState(null); // { template } | { template: null } | null
  const [composerRequest, setComposerRequest] = useState(null); // { contact, channel, template } | null

  const handleQuickChannel = ({ contact, channel }) => setComposerRequest({ contact, channel, template: null });
  const handleCompose = (contact) => setComposerRequest({ contact, channel: null, template: null });
  const handleUseTemplate = (template) => setComposerRequest({ contact: null, channel: null, template });

  const handleDeleteTemplate = async (template) => {
    if (!window.confirm(`Delete template "${template.name}"? This can't be undone.`)) return;
    try {
      await deleteTemplate(template.id);
      toast.success('Template deleted');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to delete template');
    }
  };

  const handleLoadStarters = async () => {
    try {
      await loadStarterTemplates(STARTER_TEMPLATES);
      toast.success('Starter templates added');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to load starter templates');
    }
  };

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Messaging Hub</h1>
        <p className="mt-1 text-sm text-slate-500">Send templated messages to relationships across email, WhatsApp, Telegram and LinkedIn — every send is logged automatically.</p>

        <nav className="mt-5 flex gap-1 border-b border-slate-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`-mb-px rounded-t-xl border-b-2 px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {activeTab === 'contacts' && (
          <ContactsTab
            contacts={allContacts}
            loading={contactsLoading}
            onSelectChannel={handleQuickChannel}
            onCompose={handleCompose}
          />
        )}

        {activeTab === 'templates' && (
          <TemplateLibrary
            templates={templates}
            loading={templatesLoading}
            onCreate={() => setTemplateForm({ template: null })}
            onEdit={(template) => setTemplateForm({ template })}
            onDelete={handleDeleteTemplate}
            onToggleFavorite={toggleFavorite}
            onUse={handleUseTemplate}
            onLoadStarters={handleLoadStarters}
          />
        )}

        {activeTab === 'history' && <SentHistory templates={templates} />}
      </main>

      {templateForm && (
        <TemplateForm
          template={templateForm.template}
          onClose={() => setTemplateForm(null)}
          createTemplate={createTemplate}
          updateTemplate={updateTemplate}
        />
      )}

      {composerRequest && (
        <MessageComposer
          contacts={allContacts}
          templates={templates}
          initialContact={composerRequest.contact}
          initialChannel={composerRequest.channel}
          initialTemplate={composerRequest.template}
          onClose={() => setComposerRequest(null)}
          onSent={() => setComposerRequest(null)}
        />
      )}
    </div>
  );
}
