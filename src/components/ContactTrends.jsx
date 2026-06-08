import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function ContactTrends({ trends }) {
  const { newThisMonth, byWeek, mostActive } = trends;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Contact Trends</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">New contacts this month</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{newThisMonth}</p>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} width={32} />
                <Tooltip />
                <Bar dataKey="count" name="New contacts" fill="#16a34a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Most active contacts</p>
          <ul className="mt-4 space-y-3">
            {mostActive.length === 0 && <li className="text-sm text-slate-400">No activity logged yet.</li>}
            {mostActive.map((contact) => (
              <li key={contact.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-900">{contact.full_name}</p>
                  <p className="text-xs text-slate-500">{contact.company_name || 'No company'}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                  {contact.activity_count} {contact.activity_count === 1 ? 'activity' : 'activities'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
