import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '../../../hooks/useTranslation';
import Link from 'next/link';

interface Competition {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  games: Game[];
}

interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
}

interface Team {
  id: string;
  name: string;
  shortName: string | null;
  logo?: string;
}

export default function CompetitionDetail() {
  const router = useRouter();
  const { competitionId } = router.query;
  const { status } = useSession();
  const { t } = useTranslation('common');
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [newGame, setNewGame] = useState({
    homeTeamId: '',
    awayTeamId: '',
    date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [editGame, setEditGame] = useState<Game | null>(null);
  const [showEditGameModal, setShowEditGameModal] = useState(false);

  const fetchCompetitionDetails = useCallback(async () => {
    if (!competitionId || status !== 'authenticated') return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/competitions/${competitionId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError(t('admin.competitions.notFound'));
        } else {
          throw new Error('Failed to fetch competition details');
        }
      } else {
        const data = await response.json();
        setCompetition(data);
      }
    } catch (err) {
      console.error('Error fetching competition details:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [competitionId, status, t]);

  const fetchTeams = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/teams');
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      const data = await response.json();
      setTeams(data);
      console.log('Fetched teams:', data);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  }, []);

  // useEffect(() => {
  //   if (status !== 'loading' && (!session || session.user.role.toLowerCase() !== 'admin')) {
  //     router.push('/');
  //   }
  // }, [session, status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCompetitionDetails();
      fetchTeams();
    }
  }, [status, fetchCompetitionDetails, fetchTeams]);

  const handleCreateGame = async () => {
    setFormError(null);
    
    if (!newGame.homeTeamId || !newGame.awayTeamId || !newGame.date) {
      setFormError(t('admin.games.error.missingFields'));
      return;
    }

    if (newGame.homeTeamId === newGame.awayTeamId) {
      setFormError(t('admin.games.error.sameTeams'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          competitionId,
          team1: newGame.homeTeamId,
          team2: newGame.awayTeamId,
          date: newGame.date,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create game');
      }

      // Reset form and close modal
      setNewGame({ homeTeamId: '', awayTeamId: '', date: '' });
      setShowNewGameModal(false);
      // Refresh competition details to show new game
      fetchCompetitionDetails();
    } catch (error) {
      console.error('Error creating game:', error);
      setFormError(error instanceof Error ? error.message : t('admin.games.error.createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Log when the modal state changes
  useEffect(() => {
    console.log('showNewGameModal state changed:', showNewGameModal);
    if (showNewGameModal) {
      console.log('Teams available when modal opened:', teams);
    }
  }, [showNewGameModal, teams]);

  const handleEditGame = (game: Game) => {
    setEditGame(game);
    setShowEditGameModal(true);
    setFormError(null);
  };

  const handleUpdateGame = async () => {
    if (!editGame) return;
    setFormError(null);
    if (!editGame.homeTeam?.id || !editGame.awayTeam?.id || !editGame.date) {
      setFormError('Please fill in all fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/games/${editGame.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeamId: editGame.homeTeam.id,
          awayTeamId: editGame.awayTeam.id,
          date: editGame.date,
          homeScore: editGame.homeScore,
          awayScore: editGame.awayScore,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update game');
      }
      setShowEditGameModal(false);
      setEditGame(null);
      fetchCompetitionDetails();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to update game');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/games/${gameId}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete game');
      }
      fetchCompetitionDetails();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to delete game');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
          {error === t('admin.competitions.notFound') && (
            <div className="mt-4">
              <Link href="/admin/competitions">
                <span className="text-blue-600 hover:underline cursor-pointer">{t('admin.competitions.viewAll')}</span>
              </Link>
            </div>
          )}
          {error !== t('admin.competitions.notFound') && (
             <button
              onClick={() => fetchCompetitionDetails()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {t('Retry')}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!competition) {
    return null; // Should not happen if no error and not loading
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-6 text-gray-100 md:text-gray-900" style={{color: 'var(--competition-title-color, #fff)'}}>{competition.name}</h2>
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => setShowNewGameModal(true)}
      >
        Add Game
      </button>
      {competition.games.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          No games yet for this competition.
        </div>
      )}
      {competition.games.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-900">
                <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">Date & Time</th>
                <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">Match</th>
                <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">Status</th>
                <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody>
              {competition.games
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(game => (
                  <tr key={game.id}>
                    <td className="border px-4 py-2 text-gray-800">{new Date(game.date).toLocaleString()}</td>
                    <td className="border px-4 py-2 text-gray-800">
                      {game.homeTeam?.logo && (
                        <img src={game.homeTeam.logo} alt={game.homeTeam.name + ' logo'} width="24" height="24" className="inline-block mr-2 align-middle object-cover" />
                      )}
                      {game.homeTeam?.name}
                      <span className="mx-2 font-semibold">{typeof game.homeScore === 'number' ? game.homeScore : '-'}</span>
                      <span className="font-semibold">-</span>
                      <span className="mx-2 font-semibold">{typeof game.awayScore === 'number' ? game.awayScore : '-'}</span>
                      {game.awayTeam?.logo && (
                        <img src={game.awayTeam.logo} alt={game.awayTeam.name + ' logo'} width="24" height="24" className="inline-block ml-2 align-middle object-cover" />
                      )}
                      {game.awayTeam?.name}
                    </td>
                    <td className="border px-4 py-2 text-gray-800">{game.status}</td>
                    <td className="border px-4 py-2">
                      <button
                        className="mr-2 px-2 py-1 bg-yellow-400 text-white rounded"
                        onClick={() => handleEditGame(game)}
                      >
                        Edit
                      </button>
          <button
                        className="px-2 py-1 bg-red-600 text-white rounded"
                        onClick={() => handleDeleteGame(game.id)}
                      >
                        Delete
          </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
        {showNewGameModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Add Game</h2>
            {formError && <div className="text-red-500 mb-2">{formError}</div>}
            <div className="mb-4">
              <label className="block mb-1">Home Team</label>
                            <select
                className="w-full border rounded px-2 py-1"
                              value={newGame.homeTeamId}
                onChange={e => setNewGame({ ...newGame, homeTeamId: e.target.value })}
                            >
                <option value="">Select team</option>
                              {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                              ))}
                            </select>
                          </div>
            <div className="mb-4">
              <label className="block mb-1">Away Team</label>
                            <select
                className="w-full border rounded px-2 py-1"
                              value={newGame.awayTeamId}
                onChange={e => setNewGame({ ...newGame, awayTeamId: e.target.value })}
                            >
                <option value="">Select team</option>
                              {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                              ))}
                            </select>
                          </div>
            <div className="mb-4">
              <label className="block mb-1">Date & Time</label>
                            <input
                              type="datetime-local"
                className="w-full border rounded px-2 py-1"
                              value={newGame.date}
                onChange={e => setNewGame({ ...newGame, date: e.target.value })}
                            />
                          </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setShowNewGameModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={handleCreateGame}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create"}
              </button>
                        </div>
                      </div>
                    </div>
      )}
      {showNewTeamModal && (
        <div style={{ position: 'fixed', top: 100, left: 100, background: 'white', zIndex: 9999, padding: 20 }}>
          Modal Open
          <button onClick={() => setShowNewTeamModal(false)}>Close</button>
        </div>
      )}
      {showEditGameModal && editGame && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Edit Game</h2>
            {formError && <div className="text-red-500 mb-2">{formError}</div>}
            <div className="mb-4">
              <label className="block mb-1">Home Team</label>
              <select
                className="w-full border rounded px-2 py-1 text-gray-800"
                value={editGame.homeTeam?.id || ''}
                onChange={e => setEditGame({ ...editGame, homeTeam: { ...editGame.homeTeam, id: e.target.value } })}
              >
                <option value="">Select team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1">Away Team</label>
              <select
                className="w-full border rounded px-2 py-1 text-gray-800"
                value={editGame.awayTeam?.id || ''}
                onChange={e => setEditGame({ ...editGame, awayTeam: { ...editGame.awayTeam, id: e.target.value } })}
              >
                <option value="">Select team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1">Date & Time</label>
              <input
                type="datetime-local"
                className="w-full border rounded px-2 py-1 text-gray-800"
                value={editGame.date.slice(0, 16)}
                onChange={e => setEditGame({ ...editGame, date: e.target.value })}
              />
            </div>
            <div className="mb-4 flex gap-4">
              <div className="flex-1">
                <label className="block mb-1">Home Score</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1 text-gray-800"
                  value={editGame.homeScore ?? ''}
                  onChange={e => setEditGame({ ...editGame, homeScore: e.target.value === '' ? null : Number(e.target.value) })}
                  min="0"
                />
              </div>
              <div className="flex-1">
                <label className="block mb-1">Away Score</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1 text-gray-800"
                  value={editGame.awayScore ?? ''}
                  onChange={e => setEditGame({ ...editGame, awayScore: e.target.value === '' ? null : Number(e.target.value) })}
                  min="0"
                />
                  </div>
                </div>
            <div className="flex justify-end gap-2">
                  <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setShowEditGameModal(false)}
                  >
                Cancel
                  </button>
                  <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={handleUpdateGame}
                    disabled={isSubmitting}
                  >
                {isSubmitting ? "Saving..." : "Save"}
                  </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
} 