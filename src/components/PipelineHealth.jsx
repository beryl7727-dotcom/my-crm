import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { formatCurrency, formatPercent } from '../utils/formatters';

function MetricCard({ title, value, hint }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function PipelineHealth({ pipelineByStage, pipelineTrend, metrics, focusLabel }) {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Pipeline Health</h2>
        {focusLabel && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Filtered to {focusLabel}
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Active pipeline value" value={formatCurrency(metrics.activePipelineValue)} hint="Relationships not yet executed" />
        <MetricCard title="Execution rate" value={formatPercent(metrics.executionRate)} hint="Reached execution or refresh" />
        <MetricCard title="Average relationship size" value={formatCurrency(metrics.averageDealSize)} hint="Across relationships with a value" />
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Relationships by stage</p>
          <ul className="mt-2 space-y-1 text-sm">
            {metrics.dealsByStage.length === 0 && <li className="text-slate-400">No relationships yet</li>}
            {metrics.dealsByStage.map((item) => (
              <li key={item.stage} className="flex items-center justify-between text-slate-700">
                <span>{item.label}</span>
                <span className="font-semibold text-slate-900">{item.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-700">Relationship value by stage</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipelineByStage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#475569' }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12, fill: '#475569' }} width={80} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="value" name="Relationship value" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {pipelineTrend.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-700">New relationship value — last 7 days</h3>
          <div className="mt-4 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pipelineTrend}>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}
