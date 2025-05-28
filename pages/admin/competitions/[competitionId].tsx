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
  logo?: string;
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
  
  // Competition editing state
  const [showEditCompetitionModal, setShowEditCompetitionModal] = useState(false);
  const [editCompetitionData, setEditCompetitionData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    logo: '',
  });
  const [isUpdatingCompetition, setIsUpdatingCompetition] = useState(false);
  const [competitionError, setCompetitionError] = useState<string | null>(null);

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

  // Competition editing functions
  const handleEditCompetition = () => {
    if (!competition) return;
    
    setEditCompetitionData({
      name: competition.name,
      description: competition.description || '',
      startDate: competition.startDate.slice(0, 10), // Convert to YYYY-MM-DD format
      endDate: competition.endDate.slice(0, 10),
      logo: competition.logo || '',
    });
    setShowEditCompetitionModal(true);
    setCompetitionError(null);
  };

  const handleCompetitionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditCompetitionData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompetitionError(null);
    
    if (!editCompetitionData.name || !editCompetitionData.startDate || !editCompetitionData.endDate) {
      setCompetitionError('Please fill in all required fields.');
      return;
    }

    setIsUpdatingCompetition(true);
    try {
      const response = await fetch(`/api/admin/competitions/${competitionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCompetitionData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update competition');
      }

      const updatedCompetition = await response.json();
      setCompetition(updatedCompetition);
      setShowEditCompetitionModal(false);
    } catch (error) {
      setCompetitionError(error instanceof Error ? error.message : 'Failed to update competition');
    } finally {
      setIsUpdatingCompetition(false);
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
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {competition.logo && (
              <img 
                src={competition.logo} 
                alt={`${competition.name} logo`}
                className="h-12 w-12 object-contain"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-100 md:text-gray-900" style={{color: 'var(--competition-title-color, #fff)'}}>{competition.name}</h2>
              {competition.description && (
                <p className="text-gray-600 mt-1">{competition.description}</p>
              )}
            </div>
          </div>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-2"
            onClick={handleEditCompetition}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit Competition</span>
          </button>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Start Date:</span>
              <p className="text-gray-900">{new Date(competition.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">End Date:</span>
              <p className="text-gray-900">{new Date(competition.endDate).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <span className={`inline-block px-2 py-1 text-xs rounded-full ml-2 ${
                competition.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                competition.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {competition.status}
              </span>
            </div>
          </div>
        </div>
      </div>
      
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
        
        {/* Edit Competition Modal */}
        {showEditCompetitionModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Edit Competition</h2>
              {competitionError && <div className="text-red-500 mb-4">{competitionError}</div>}
              
              <form onSubmit={handleUpdateCompetition} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Competition Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={editCompetitionData.name}
                    onChange={handleCompetitionInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={editCompetitionData.description}
                    onChange={handleCompetitionInputChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      name="startDate"
                      value={editCompetitionData.startDate}
                      onChange={handleCompetitionInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                    <input
                      type="date"
                      name="endDate"
                      value={editCompetitionData.endDate}
                      onChange={handleCompetitionInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                  <input
                    type="url"
                    name="logo"
                    value={editCompetitionData.logo}
                    onChange={handleCompetitionInputChange}
                    placeholder="https://example.com/logo.svg"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                  />
                  {editCompetitionData.logo && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">Preview:</p>
                      <img 
                        src={editCompetitionData.logo} 
                        alt="Logo preview"
                        className="h-12 w-12 object-contain border border-gray-200 rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    onClick={() => setShowEditCompetitionModal(false)}
                    disabled={isUpdatingCompetition}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    disabled={isUpdatingCompetition}
                  >
                    {isUpdatingCompetition ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  );
} 