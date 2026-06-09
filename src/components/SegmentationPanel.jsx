import React from 'react';
import { useSegments } from '../hooks/useSegments';

export default function SegmentationPanel({ allContacts, activeSegmentKey, onSelectSegment }) {
  const { segments } = useSegments(allContacts);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Auto Segments</h3>
        {activeSegmentKey && (
          <button
            type="button"
            onClick={() => onSelectSegment(null)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        {segments.map((seg) => {
          const isActive = activeSegmentKey === seg.key;
          return (
            <button
              key={seg.key}
              type="button"
              onClick={() => onSelectSegment(isActive ? null : seg.key)}
              className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-white' : seg.dot}`} />
                <div>
                  <p className={`font-medium leading-tight ${isActive ? 'text-white' : 'text-slate-800'}`}>
                    {seg.label}
                  </p>
                  <p className={`text-xs leading-tight ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                    {seg.description}
                  </p>
                </div>
              </div>
              <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                isActive ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {seg.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
