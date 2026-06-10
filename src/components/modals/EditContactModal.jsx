import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from '../../utils/toast';
import RelationshipScoreStar from '../RelationshipScoreStar';
import { CONTACT_TYPES } from '../../utils/relationshipStages';
import { MARKET_OPTIONS, VOLUME_OPTIONS } from '../../utils/relationshipProfile';
import { TIER_PRODUCTS } from '../../constants/products';

const COMM_OPTIONS = [
  { value: 'email', label: '✉️ Email' },
  { value: 'whatsapp', label: '💬 WhatsApp' },
  { value: 'telegram', label: '📱 Telegram' },
  { value: 'linkedin', label: '🔗 LinkedIn' },
];

const MultiCheckGroup = ({ label, options, selected, onChange }) => {
  const toggle = (v) => onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(({ value, label: optLabel }) => (
          <button
            key={value}
            type="button"
            onClick={() => toggle(value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              selected.includes(value)
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
            }`}
          >
            {optLabel}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function EditContactModal({ contact, onClose, onSaved }) {
  const [companies, setCompanies] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    job_title: '', company_id: '', country: '',
    notes: '', tags: '',
    contact_type: '',
    source: '',
    priority: '',
    region: '',
    next_touch_date: '',
    stage: '',
    relationship_score: 0,
    preferred_communication: '',
    personal_notes: '',
    products_interested: [],
    preferred_markets: [],
    preferred_volume: '',
    interest_products_tier_1: [],
    interest_products_tier_2: [],
    interest_products_tier_3: [],
    focus_tier: '',
  });

  useEffect(() => {
    if (contact) {
      setForm({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        job_title: contact.job_title || '',
        company_id: contact.company_id || '',
        country: contact.country || '',
        notes: contact.notes || '',
        tags: Array.isArray(contact.tags) ? contact.tags.join(', ') : contact.tags || '',
        contact_type: contact.contact_type || '',
        source: contact.source || '',
        priority: contact.priority || '',
        region: contact.region || '',
        next_touch_date: contact.next_touch_date ? contact.next_touch_date.slice(0, 10) : '',
        stage: contact.stage || '',
        relationship_score: contact.relationship_score || 0,
        preferred_communication: contact.preferred_communication || '',
        personal_notes: contact.personal_notes || '',
        products_interested: Array.isArray(contact.products_interested) ? contact.products_interested : [],
        preferred_markets: Array.isArray(contact.preferred_markets) ? contact.preferred_markets : [],
        preferred_volume: contact.preferred_volume || '',
        interest_products_tier_1: Array.isArray(contact.interest_products_tier_1) ? contact.interest_products_tier_1 : [],
        interest_products_tier_2: Array.isArray(contact.interest_products_tier_2) ? contact.interest_products_tier_2 : [],
        interest_products_tier_3: Array.isArray(contact.interest_products_tier_3) ? contact.interest_products_tier_3 : [],
        focus_tier: contact.focus_tier ?? '',
      });
    }
  }, [contact]);

  useEffect(() => {
    supabase.from('companies').select('id,name').order('name').then(({ data }) => setCompanies(data || []));
  }, []);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const setDirect = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name.trim()) { toast.error('First name is required'); return; }
    setSaving(true);
    try {
      // Only include optional columns when they have a value — prevents 400
      // errors if the DB migration hasn't been run yet for newer columns.
      const withValue = (obj) =>
        Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== '' && v !== undefined));

      // Only send tier columns if the DB already has them (phase9 migration guard)
      const hasTierColumns = contact.interest_products_tier_1 !== undefined;

      const allTierProducts = [
        ...form.interest_products_tier_1,
        ...form.interest_products_tier_2,
        ...form.interest_products_tier_3,
      ];

      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        job_title: form.job_title.trim() || null,
        company_id: form.company_id || null,
        country: form.country.trim() || null,
        notes: form.notes.trim() || null,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        relationship_score: form.relationship_score || null,
        preferred_communication: form.preferred_communication || null,
        personal_notes: form.personal_notes.trim() || null,
        preferred_markets: form.preferred_markets,
        preferred_volume: form.preferred_volume || null,
        ...(hasTierColumns ? {
          interest_products_tier_1: form.interest_products_tier_1,
          interest_products_tier_2: form.interest_products_tier_2,
          interest_products_tier_3: form.interest_products_tier_3,
          focus_tier: form.focus_tier ? Number(form.focus_tier) : null,
          products_interested: allTierProducts,
        } : {}),
        ...withValue({
          contact_type: form.contact_type || null,
          source: form.source || null,
          priority: form.priority || null,
          region: form.region.trim() || null,
          next_touch_date: form.next_touch_date || null,
          stage: form.stage || null,
        }),
      };
      const { data, error } = await supabase.from('contacts').update(payload).eq('id', contact.id).select().single();
      if (error) throw error;
      toast.success('Contact updated');
      onSaved && onSaved(data);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to update contact');
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { key: 'basic', label: 'Basic Info' },
    { key: 'profile', label: 'Profile' },
    { key: 'notes', label: 'Notes & Tags' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold">Edit Contact</h2>
            <p className="text-sm text-slate-500">
              {[contact?.first_name, contact?.last_name].filter(Boolean).join(' ') || 'Contact'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 gap-1 border-b border-slate-200 px-6 pt-3">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-t-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            {activeTab === 'basic' && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1.5 text-sm font-medium text-slate-700">
                    First name <span className="text-rose-500">*</span>
                    <input value={form.first_name} onChange={set('first_name')}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="First name" />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-slate-700">
                    Last name
                    <input value={form.last_name} onChange={set('last_name')}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="Last name" />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-slate-700">
                    Email
                    <input value={form.email} onChange={set('email')} type="email"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="Email address" />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-slate-700">
                    Phone
                    <input value={form.phone} onChange={set('phone')} type="tel"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="Phone number" />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-slate-700">
                    Job title
                    <input value={form.job_title} onChange={set('job_title')}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="Job title" />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-slate-700">
                    Country
                    <input value={form.country} onChange={set('country')}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="Country" />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-slate-700">
                    Contact type
                    <select value={form.contact_type} onChange={set('contact_type')}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none">
                      <option value="">No type</option>
                      {CONTACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-slate-700">
                    Source
                    <select value={form.source} onChange={set('source')}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none">
                      <option value="">Unknown</option>
                      {['RECS2025','LinkedIn','Referral','Conference / Event','Cold Outreach','Existing Client','Partner / Broker','Website','Other'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-slate-700">
                    Priority
                    <select value={form.priority} onChange={set('priority')}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none">
                      <option value="">No priority</option>
                      {['A+','A','B','C'].map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-slate-700">
                    Stage
                    <select value={form.stage} onChange={set('stage')}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none">
                      <option value="">No stage</option>
                      {['Relationship','Discovery','Structuring','Execution','Refresh'].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-slate-700">
                    Region
                    <input value={form.region} onChange={set('region')}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="e.g. APAC, EMEA, Americas" />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-slate-700">
                    Next touch date
                    <input value={form.next_touch_date} onChange={set('next_touch_date')} type="date"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none" />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-slate-700 md:col-span-2">
                    Company
                    <select value={form.company_id} onChange={set('company_id')}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none">
                      <option value="">No company</option>
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                </div>
              </>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-slate-700">Relationship score</p>
                  <RelationshipScoreStar
                    score={form.relationship_score}
                    onChange={(v) => setDirect('relationship_score', v)}
                    size="lg"
                  />
                </div>

                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                  Preferred communication
                  <select value={form.preferred_communication} onChange={set('preferred_communication')}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none">
                    <option value="">No preference</option>
                    {COMM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>

                {/* Tier-based product selection */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Products Interested</p>
                  <div className="space-y-2">
                    {Object.entries(TIER_PRODUCTS).map(([tierNum, tier]) => {
                      const n = Number(tierNum);
                      const fieldKey = `interest_products_tier_${n}`;
                      const selected = form[fieldKey] || [];
                      const toggle = (product) => {
                        const next = selected.includes(product)
                          ? selected.filter((p) => p !== product)
                          : [...selected, product];
                        setDirect(fieldKey, next);
                      };
                      return (
                        <div key={n} className={`rounded-2xl border p-3 ${tier.colors.bg} ${tier.colors.border}`}>
                          <p className={`mb-2 text-xs font-semibold ${tier.colors.text}`}>
                            {tier.emoji} {tier.title}
                            <span className="ml-1.5 font-normal text-slate-400">— {tier.focus}</span>
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {tier.products.map((product) => {
                              const active = selected.includes(product);
                              return (
                                <button
                                  key={product}
                                  type="button"
                                  onClick={() => toggle(product)}
                                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
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
                      );
                    })}
                  </div>
                </div>

                {/* Focus Tier */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Focus Tier</p>
                  <p className="mb-2 text-xs text-slate-400">Which tier gets the most attention for this contact?</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {Object.entries(TIER_PRODUCTS).map(([tierNum, tier]) => {
                      const n = Number(tierNum);
                      const active = String(form.focus_tier) === String(n);
                      return (
                        <label
                          key={n}
                          className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                            active
                              ? `${tier.colors.bg} ${tier.colors.border} ${tier.colors.text}`
                              : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name="focus_tier"
                            value={n}
                            checked={active}
                            onChange={() => setDirect('focus_tier', n)}
                            className="h-4 w-4"
                          />
                          {tier.emoji} Tier {n}
                        </label>
                      );
                    })}
                    <label className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                      !form.focus_tier ? 'border-slate-400 bg-slate-100 text-slate-700' : 'border-slate-300 bg-white text-slate-400 hover:border-slate-400'
                    }`}>
                      <input
                        type="radio"
                        name="focus_tier"
                        value=""
                        checked={!form.focus_tier}
                        onChange={() => setDirect('focus_tier', '')}
                        className="h-4 w-4"
                      />
                      None
                    </label>
                  </div>
                </div>

                <MultiCheckGroup
                  label="Preferred markets"
                  options={MARKET_OPTIONS}
                  selected={form.preferred_markets}
                  onChange={(v) => setDirect('preferred_markets', v)}
                />

                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                  Preferred volume
                  <select value={form.preferred_volume} onChange={set('preferred_volume')}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none">
                    <option value="">No preference</option>
                    {VOLUME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                  Tags <span className="font-normal text-slate-400">(comma separated)</span>
                  <input value={form.tags} onChange={set('tags')}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. key-account, trading-desk" />
                </label>
                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                  CRM Notes
                  <textarea value={form.notes} onChange={set('notes')} rows={4}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="General notes visible to your team" />
                </label>
                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                  Personal notes <span className="font-normal text-slate-400">(private)</span>
                  <textarea value={form.personal_notes} onChange={set('personal_notes')} rows={4}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Private notes — not shared with your team" />
                </label>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex shrink-0 justify-between gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={() => {
                const tabs = TABS.map((t) => t.key);
                const idx = tabs.indexOf(activeTab);
                if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
              }}
              className={`rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 ${
                activeTab === TABS[TABS.length - 1].key ? 'invisible' : ''
              }`}
            >
              Next →
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
