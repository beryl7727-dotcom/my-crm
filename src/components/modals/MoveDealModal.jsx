import React, { useState } from 'react';
import { toast } from '../../utils/toast';
import { useDealMutations } from '../../hooks/useDealMutations';

const STAGES = ['Prospect', 'Qualified', 'Proposal', 'Closed'];

export default function MoveDealModal({ deal, onClose, onSuccess }) {
  const { moveDeal } = useDealMutations();
  const [selectedStage, setSelectedStage] = useState(deal?.stage || 'Prospect');
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsSaving(true);
      const updated = await moveDeal(deal.id, selectedStage);
      toast.success(`Deal moved to ${selectedStage}`);
      onSuccess && onSuccess(updated);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to move deal');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Move Deal</h2>
            <p className="text-sm text-slate-500">Select the new stage for this deal.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            Close
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => setSelectedStage(stage)}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                selectedStage === stage
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              {stage}
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Moving...' : `Move to ${selectedStage}`}
          </button>
        </div>
      </div>
    </div>
  );
}
