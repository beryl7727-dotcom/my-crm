import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTeam } from './useTeam';
import { useAuth } from './useAuth';

export function usePushToPipeline() {
  const { currentTeam } = useTeam();
  const { user } = useAuth();
  const [processing, setProcessing] = useState({});

  const setFlag = (id, val) => setProcessing((p) => ({ ...p, [id]: val }));

  const pushToPipeline = useCallback(
    async (contact, onUpdate) => {
      setFlag(contact.id, true);
      try {
        // Create a relationship at the first stage for this contact
        const { error: relErr } = await supabase.from('relationships').insert({
          name: contact.full_name || [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unnamed',
          primary_contact_id: contact.id,
          company_id: contact.company_id || null,
          stage: 'relationship',
          team_id: currentTeam?.id || null,
          created_by: user?.id || null,
        });
        if (relErr) throw relErr;

        // Mark contact as pushed
        await onUpdate(contact.id, { ready_for_pipeline: true, do_not_contact: false });
      } finally {
        setFlag(contact.id, false);
      }
    },
    [currentTeam, user]
  );

  const markDoNotContact = useCallback(async (contactId, onUpdate) => {
    setFlag(contactId, true);
    try {
      await onUpdate(contactId, { do_not_contact: true, ready_for_pipeline: false });
    } finally {
      setFlag(contactId, false);
    }
  }, []);

  const clearDoNotContact = useCallback(async (contactId, onUpdate) => {
    setFlag(contactId, true);
    try {
      await onUpdate(contactId, { do_not_contact: false });
    } finally {
      setFlag(contactId, false);
    }
  }, []);

  return { pushToPipeline, markDoNotContact, clearDoNotContact, processing };
}
