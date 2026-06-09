export const TEMPLATE_CATEGORIES = ['First Contact', 'Follow-Up', 'Reactivation'];

export const CHANNELS = ['email', 'whatsapp', 'telegram', 'linkedin'];

export const CHANNEL_META = {
  email: {
    label: 'Email',
    icon: '📧',
    sendLabel: 'Send Email',
    activityTitle: 'Sent Email',
    colors: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', solid: 'bg-blue-600 text-white' },
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: '📱',
    sendLabel: 'Send WhatsApp',
    activityTitle: 'Sent WhatsApp',
    colors: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', solid: 'bg-emerald-600 text-white' },
  },
  telegram: {
    label: 'Telegram',
    icon: '✈️',
    sendLabel: 'Send Telegram',
    activityTitle: 'Sent Telegram message',
    colors: { dot: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300', solid: 'bg-purple-600 text-white' },
  },
  linkedin: {
    label: 'LinkedIn',
    icon: '🔗',
    sendLabel: 'Send LinkedIn message',
    activityTitle: 'Sent LinkedIn message',
    colors: { dot: 'bg-slate-700', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', solid: 'bg-slate-800 text-white' },
  },
};

export const TEMPLATE_VARIABLES = [
  { token: 'First Name', description: "Contact's first name" },
  { token: 'Company', description: "Contact's company" },
  { token: 'Last Trade', description: 'Date of the last executed trade' },
  { token: 'Product', description: 'Most recent / preferred product' },
  { token: 'Custom', description: 'Manual field — fill in by hand before sending' },
];

const formatVariableDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

// Builds the {{Variable Name}} -> value map for a contact, optionally enriched
// with details from the relationship the message is being sent from.
export function buildTemplateContext(contact, relationship) {
  const company = contact?.company_name || contact?.company?.name || '';
  const executed = relationship?.stage === 'execution' || relationship?.stage === 'refresh';

  return {
    'First Name': contact?.first_name || '',
    Company: company,
    'Last Trade': executed ? formatVariableDate(relationship?.last_contact_date || relationship?.updated_at) : '',
    Product: relationship?.details?.product || (executed ? relationship?.title : '') || '',
  };
}

const VARIABLE_PATTERN = /\{\{\s*([^{}]+?)\s*\}\}/g;

// Replaces {{Variable Name}} tokens with values from context. {{Custom}} is
// always left as an editable placeholder since it's filled in by hand.
export function fillTemplate(body, context = {}) {
  if (!body) return '';
  return body.replace(VARIABLE_PATTERN, (match, name) => {
    if (name === 'Custom') return '[Custom]';
    const value = context[name];
    return value ? value : match;
  });
}

// Extracts the variable names referenced by a template body, e.g. ['First Name', 'Company'].
export function extractVariables(body) {
  if (!body) return [];
  const found = new Set();
  let match;
  VARIABLE_PATTERN.lastIndex = 0;
  while ((match = VARIABLE_PATTERN.exec(body))) {
    found.add(match[1].trim());
  }
  return Array.from(found);
}

export const STARTER_TEMPLATES = [
  {
    name: 'RECS attendee',
    category: 'First Contact',
    body: 'Hi {{First Name}}\nGreat meeting you at RECS.\nWanted to stay in touch regarding I-REC opportunities in APAC.\nWould welcome a short catch-up if useful.\nBest regards\nAjan',
  },
  {
    name: 'Trader introduction',
    category: 'First Contact',
    body: "Hi {{First Name}}\nI head up trading at our desk and wanted to introduce myself. We're active in {{Product}} and always keen to connect with traders at {{Company}}.\nOpen to a short call this week?\nBest regards\nAjan",
  },
  {
    name: 'Certificate desk introduction',
    category: 'First Contact',
    body: "Hi {{First Name}}\nIntroducing myself from the certificate desk — we work closely with teams like {{Company}} on REC and I-REC flows.\nHappy to share what we're seeing in the market if that's useful.\nBest regards\nAjan",
  },
  {
    name: 'LinkedIn connection',
    category: 'First Contact',
    body: "Hi {{First Name}}, I'd love to connect — we're both active in the energy certificate space and I think there could be good synergies between {{Company}} and our desk. Looking forward to staying in touch.",
  },
  {
    name: 'Checking timing',
    category: 'Follow-Up',
    body: 'Hi {{First Name}}\nJust checking in on timing for the {{Product}} discussion we had — is this still something {{Company}} is looking to move on soon?\nHappy to pick things back up whenever suits.\nBest regards\nAjan',
  },
  {
    name: 'Market update (price movement)',
    category: 'Follow-Up',
    body: "Hi {{First Name}}\nWanted to flag some recent movement in {{Product}} pricing that could be relevant to {{Company}}. Let me know if you'd like a quick rundown of where things stand.\nBest regards\nAjan",
  },
  {
    name: 'Volume inquiry',
    category: 'Follow-Up',
    body: "Hi {{First Name}}\nFollowing up to see whether {{Company}}'s volume requirements for {{Product}} have firmed up. Happy to put together some indicative terms if helpful.\nBest regards\nAjan",
  },
  {
    name: 'Recurring trade check-in',
    category: 'Follow-Up',
    body: 'Hi {{First Name}}\nIt looks like our last trade together was around {{Last Trade}} — wanted to check whether {{Company}} is ready for the next round on {{Product}}.\nBest regards\nAjan',
  },
  {
    name: "It's been a while",
    category: 'Reactivation',
    body: "Hi {{First Name}}\nIt's been a while since we last spoke — our last trade was {{Last Trade}}. Would be great to reconnect and hear how things are going at {{Company}}.\nBest regards\nAjan",
  },
  {
    name: 'New product launch',
    category: 'Reactivation',
    body: "Hi {{First Name}}\nWe've just launched a new {{Product}} offering and I immediately thought of {{Company}}. Worth a quick conversation to see if it's a fit?\nBest regards\nAjan",
  },
  {
    name: 'Market opportunity',
    category: 'Reactivation',
    body: "Hi {{First Name}}\nSpotted an opportunity in {{Product}} that looks like a good match for {{Company}}'s usual flows. Keen to share details if you have ten minutes this week.\nBest regards\nAjan",
  },
  {
    name: 'Catching up',
    category: 'Reactivation',
    body: 'Hi {{First Name}}\nNo agenda — just wanted to catch up and hear how things are going at {{Company}}. Let me know if you have time for a coffee or a call soon.\nBest regards\nAjan',
  },
];
