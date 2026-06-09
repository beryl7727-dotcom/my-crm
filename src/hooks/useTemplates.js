import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTeam } from './useTeam';
import { useAuth } from './useAuth';
import { extractVariables } from '../utils/messageTemplates';

export function useTemplates() {
  const { currentTeam } = useTeam();
  const { user } = useAuth();
  const teamId = currentTeam?.id || null;

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTemplates = useCallback(async () => {
    if (!teamId) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('team_id', teamId)
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('useTemplates fetch error', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = useCallback(
    async ({ name, category, body, is_favorite = false }) => {
      if (!teamId) throw new Error('No team selected');
      const payload = {
        team_id: teamId,
        created_by: user?.id || null,
        name: name.trim(),
        category,
        body,
        variables_used: extractVariables(body),
        is_favorite,
      };
      const { data, error } = await supabase.from('templates').insert(payload).select().single();
      if (error) throw new Error(error.message || 'Failed to create template');
      setTemplates((current) => [...current, data]);
      return data;
    },
    [teamId, user]
  );

  const updateTemplate = useCallback(async (id, { name, category, body, is_favorite }) => {
    const payload = {};
    if (name !== undefined) payload.name = name.trim();
    if (category !== undefined) payload.category = category;
    if (body !== undefined) {
      payload.body = body;
      payload.variables_used = extractVariables(body);
    }
    if (is_favorite !== undefined) payload.is_favorite = is_favorite;

    const { data, error } = await supabase.from('templates').update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message || 'Failed to update template');
    setTemplates((current) => current.map((tpl) => (tpl.id === id ? data : tpl)));
    return data;
  }, []);

  const deleteTemplate = useCallback(async (id) => {
    const { error } = await supabase.from('templates').delete().eq('id', id);
    if (error) throw new Error(error.message || 'Failed to delete template');
    setTemplates((current) => current.filter((tpl) => tpl.id !== id));
  }, []);

  const toggleFavorite = useCallback(
    async (id) => {
      const target = templates.find((tpl) => tpl.id === id);
      if (!target) return;
      return updateTemplate(id, { is_favorite: !target.is_favorite });
    },
    [templates, updateTemplate]
  );

  const loadStarterTemplates = useCallback(
    async (starters) => {
      if (!teamId) throw new Error('No team selected');
      const payload = starters.map((tpl) => ({
        team_id: teamId,
        created_by: user?.id || null,
        name: tpl.name,
        category: tpl.category,
        body: tpl.body,
        variables_used: extractVariables(tpl.body),
        is_favorite: false,
      }));
      const { data, error } = await supabase.from('templates').insert(payload).select();
      if (error) throw new Error(error.message || 'Failed to load starter templates');
      setTemplates((current) => [...current, ...(data || [])]);
      return data;
    },
    [teamId, user]
  );

  return {
    templates,
    loading,
    error,
    refresh: fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleFavorite,
    loadStarterTemplates,
  };
}
