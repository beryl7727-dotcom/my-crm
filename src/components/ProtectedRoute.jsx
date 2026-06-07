import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTeam } from '../hooks/useTeam';

export default function ProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { currentTeam, loading: teamLoading } = useTeam();

  if (authLoading || teamLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" />;
  }

  if (!currentTeam) {
    return <Navigate to="/auth/create-team" />;
  }

  return children;
}
