import React, { createContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentTeam, setCurrentTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // fetchTeam accepts an optional userId so callers can force a refresh for a specific user
  const fetchTeam = useCallback(async (userId) => {
    console.log('TeamContext.fetchTeam called', { userId });
    // resolve uid: prefer explicit userId, then context user, then auth.getUser()
    let uid = userId || user?.id;

    console.log('Initial uid (from params/context):', uid);

    if (!uid) {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        uid = authUser?.id;
      } catch (e) {
        console.warn('Could not get auth user from supabase.auth.getUser()', e);
      }
    }

    console.log('Resolved uid:', uid);

    if (!uid) {
      setCurrentTeam(null);
      setLoading(false);
      return null;
    }

    let fetchedTeam = null;
    try {
      setLoading(true);
      setError(null);

      // Get user's profile and team_id
      const { data: profile, error: profileError, status, statusText } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', uid)
        .maybeSingle();

      console.log('Profile query result:', { profile, profileError, status, statusText });

      if (profileError) {
        console.error('Profile fetch error', { profileError, status, statusText });
        throw profileError;
      }

      if (profile && profile.team_id) {
        // Get team details
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('id', profile.team_id)
          .maybeSingle();

        console.log('Team query result:', { team, teamError });

        if (teamError) throw teamError;
        fetchedTeam = team || null;
        console.log('About to set currentTeam to:', fetchedTeam);
        setCurrentTeam(fetchedTeam);
        return fetchedTeam;
      }

      console.log('No team_id on profile, clearing currentTeam');
      setCurrentTeam(null);
      return null;
    } catch (err) {
      setError(err?.message || String(err));
      setCurrentTeam(null);
      return null;
    } finally {
      setLoading(false);
      console.log('fetchTeam done. currentTeam should now be:', fetchedTeam);
    }
  }, [user]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const refreshTeam = fetchTeam;

  return (
    <TeamContext.Provider value={{ currentTeam, loading, error, refreshTeam }}>
      {children}
    </TeamContext.Provider>
  );
};