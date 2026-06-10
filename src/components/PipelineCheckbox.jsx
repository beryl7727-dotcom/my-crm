import React from 'react';
import DoNotContactBadge from './DoNotContactBadge';

// Stateless — parent (ContactsList) owns the hook and passes handlers down.
export default function PipelineCheckbox({ contact, busy, onPush, onDnc, onClearDnc }) {
  if (contact.do_not_contact) {
    return (
      <DoNotContactBadge
        reason={contact.do_not_contact_reason}
        date={contact.do_not_contact_date}
        onClear={() => onClearDnc(contact.id)}
        loading={busy}
      />
    );
  }

  return (
    <input
      type="checkbox"
      checked={!!contact.ready_for_pipeline}
      onChange={(e) => e.target.checked ? onPush(contact) : onDnc(contact.id)}
      disabled={busy}
      onClick={(e) => e.stopPropagation()}
      className="h-4 w-4 cursor-pointer rounded border-slate-400 accent-blue-600 disabled:opacity-60"
      title={contact.ready_for_pipeline ? 'In pipeline — uncheck to mark Do Not Contact' : 'Push to pipeline'}
    />
  );
}
