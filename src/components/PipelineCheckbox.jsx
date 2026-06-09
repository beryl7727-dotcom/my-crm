import React from 'react';
import { toast } from '../utils/toast';
import { usePushToPipeline } from '../hooks/usePushToPipeline';
import DoNotContactTag from './DoNotContactTag';

export default function PipelineCheckbox({ contact, onUpdate }) {
  const { pushToPipeline, markDoNotContact, clearDoNotContact, processing } = usePushToPipeline();
  const busy = processing[contact.id];

  const handleChange = async (e) => {
    e.stopPropagation();
    if (contact.do_not_contact) return; // tag handles its own click
    if (e.target.checked) {
      try {
        await pushToPipeline(contact, onUpdate);
        toast.success(`${contact.full_name} pushed to pipeline`);
      } catch (err) {
        toast.error(err.message || 'Failed to push to pipeline');
      }
    } else {
      try {
        await markDoNotContact(contact.id, onUpdate);
        toast.error(`${contact.full_name} marked as Do Not Contact`);
      } catch (err) {
        toast.error(err.message || 'Failed to update contact');
      }
    }
  };

  const handleClearDnc = async (contactId) => {
    try {
      await clearDoNotContact(contactId, onUpdate);
      toast.success('Do Not Contact removed');
    } catch (err) {
      toast.error(err.message || 'Failed to update contact');
    }
  };

  if (contact.do_not_contact) {
    return <DoNotContactTag contactId={contact.id} onClear={handleClearDnc} loading={busy} />;
  }

  return (
    <input
      type="checkbox"
      checked={!!contact.ready_for_pipeline}
      onChange={handleChange}
      disabled={busy}
      onClick={(e) => e.stopPropagation()}
      className="h-4 w-4 cursor-pointer rounded border-slate-400 accent-blue-600 disabled:opacity-60"
      title={contact.ready_for_pipeline ? 'In pipeline — uncheck to mark Do Not Contact' : 'Push to pipeline'}
    />
  );
}
