import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useTeam } from '../../hooks/useTeam';
import { toast } from '../../utils/toast';

export default function CreateTeam() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshTeam } = useTeam();
  const [mode, setMode] = useState('create');
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!teamName.trim()) {
      newErrors.teamName = 'Team name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!user || !user.id) {
      setErrors({ form: 'User not authenticated. Please sign in again.' });
      toast.error('User not authenticated. Please sign in again.');
      navigate('/auth/login');
      return;
    }

    try {
      console.log('Creating team...');
      setIsLoading(true);
      setErrors({});

      const randomCode = generateRandomCode();

      // Insert team with created_by = current user's ID
      // This MUST match the RLS policy: created_by = auth.uid()
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamName.trim(),
          created_by: user.id, // CRITICAL: RLS policy requires this to match auth.uid()
          invite_code: randomCode,
        })
        .select();

      if (error) {
        console.error('Team creation error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Team creation failed - no data returned');
      }

      const newTeam = data[0];
      console.log('Team created:', newTeam);

      // Upsert user's profile to link to this team (creates profile if missing)
      const { data: upsertData, error: upsertError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, team_id: newTeam.id }, { onConflict: 'id' })
        .select();

      if (upsertError) {
        console.error('Profile upsert error:', upsertError);
        throw upsertError;
      }

      console.log('Profile upsert result:', upsertData);

      console.log('Profile updated');
      toast.success(`Team "${teamName}" created successfully!`);
      console.log('Calling refreshTeam with user id...', user.id);
      if (!refreshTeam) {
        throw new Error('refreshTeam is not available from useTeam()');
      }
      await refreshTeam(user.id);
      console.log('refreshTeam completed');
      console.log('Navigating to dashboard...');
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while creating the team';
      setErrors({ form: errorMessage });
      toast.error(errorMessage);
      console.error('CreateTeam error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!inviteCode.trim()) {
      newErrors.inviteCode = 'Invite code is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!user || !user.id) {
      setErrors({ form: 'User not authenticated. Please sign in again.' });
      toast.error('User not authenticated. Please sign in again.');
      navigate('/auth/login');
      return;
    }

    try {
      setIsLoading(true);
      setErrors({});

      // Find team by invite code
      const { data: teams, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('invite_code', inviteCode.trim().toUpperCase());

      if (teamError) {
        console.error('Team lookup error:', teamError);
        throw teamError;
      }

      if (!teams || teams.length === 0) {
        throw new Error('Invalid invite code');
      }

      const team = teams[0];

      // Upsert user's profile to link to this team (creates profile if missing)
      const { data: upsertData2, error: upsertError2 } = await supabase
        .from('profiles')
        .upsert({ id: user.id, team_id: team.id }, { onConflict: 'id' })
        .select();

      if (upsertError2) {
        console.error('Profile upsert error:', upsertError2);
        throw upsertError2;
      }

      console.log('Profile upsert result (join):', upsertData2);
      toast.success('Successfully joined team!');
      if (!refreshTeam) throw new Error('refreshTeam is not available from useTeam()');
      await refreshTeam(user.id);
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while joining the team';
      setErrors({ form: errorMessage });
      toast.error(errorMessage);
      console.error('JoinTeam error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Set Up Your Team</h1>
        <p className="text-gray-600 mb-6">
          {mode === 'create'
            ? 'Create a new team to get started'
            : 'Join an existing team with an invite code'}
        </p>

        {errors.form && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {errors.form}
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setMode('create');
              setErrors({});
              setInviteCode('');
            }}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              mode === 'create'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Create Team
          </button>
          <button
            onClick={() => {
              setMode('join');
              setErrors({});
              setTeamName('');
            }}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              mode === 'join'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Join Team
          </button>
        </div>

        {mode === 'create' ? (
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Name
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.teamName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="My Sales Team"
                disabled={isLoading}
              />
              {errors.teamName && (
                <p className="text-red-500 text-sm mt-1">{errors.teamName}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Team...' : 'Create Team'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinTeam} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.inviteCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ABC12345"
                maxLength="8"
                disabled={isLoading}
              />
              {errors.inviteCode && (
                <p className="text-red-500 text-sm mt-1">{errors.inviteCode}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">Ask your team admin for the code</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Joining Team...' : 'Join Team'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}