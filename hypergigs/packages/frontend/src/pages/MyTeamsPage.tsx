import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teamService } from '@/services/api/team.service';
import type { TeamWithRole } from '@/types/team';

export default function MyTeamsPage() {
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
      <div className="flex items-center justify-center py-12">
        <div className="text-lg">Loading teams...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Teams</h1>
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
          <h3 className="text-lg font-medium mb-2">
            No teams yet
          </h3>
          <p className="text-muted-foreground mb-4">
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
              className="bg-card rounded-lg border shadow hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {team.name}
                </h3>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {team.role}
                </span>
              </div>

              {team.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {team.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-muted-foreground">
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
                <span className="px-2 py-1 text-xs rounded-full bg-muted">
                  {team.type}
                </span>
              </div>

              {team.city && (
                <p className="text-xs text-muted-foreground mt-2">📍 {team.city}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
