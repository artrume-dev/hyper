import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { teamService } from '@/services/api/team.service';
import type { TeamWithRole } from '@/types/team';

export default function MyTeamsPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMyTeams();
  }, []);

  const loadMyTeams = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await teamService.getMyTeams();
      setTeams(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading teams...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Teams</h1>
          <Link
            to="/teams/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Team
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {teams.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No teams yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first team to start collaborating
            </p>
            <Link
              to="/teams/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Team
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Link
                key={team.id}
                to={`/teams/${team.slug}`}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {team.name}
                  </h3>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {team.role}
                  </span>
                </div>
                
                {team.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {team.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    {team.memberCount} members
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                    {team.type}
                  </span>
                </div>

                {team.city && (
                  <p className="text-xs text-gray-500 mt-2">📍 {team.city}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
