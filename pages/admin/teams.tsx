import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '../../hooks/useTranslation';
import Link from 'next/link';
import { ChartBarIcon } from '@heroicons/react/24/outline';

interface Team {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
  category: 'NATIONAL' | 'CLUB';
}

interface Bet {
  id: string;
  userId: string;
  gameId: string;
  score1: number;
  score2: number;
  points: number;
}

interface Game {
  id: string;
  date: string;
  status: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number;
  awayScore?: number;
  bets: Bet[];
}

const DEFAULT_LOGO = 'https://via.placeholder.com/40x40?text=Logo';

export default function TeamsAdmin() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useTranslation('common');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editTeamId, setEditTeamId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [logo, setLogo] = useState('');
  const [category, setCategory] = useState<'NATIONAL' | 'CLUB'>('NATIONAL');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/teams');
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data = await response.json();
      setTeams(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTeams();
    }
  }, [status, fetchTeams]);

  useEffect(() => {
    if (status !== 'loading' && (!session || session.user.role.toLowerCase() !== 'admin')) {
      router.push('/');
    }
  }, [session, status, router]);

  const openAddModal = () => {
    setModalMode('add');
    setEditTeamId(null);
    setName('');
    setShortName('');
    setLogo('');
    setCategory('NATIONAL');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (team: Team) => {
    setModalMode('edit');
    setEditTeamId(team.id);
    setName(team.name);
    setShortName(team.shortName || '');
    setLogo(team.logo || '');
    setCategory(team.category);
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    if (!name) {
      setError('Team name is required');
      return;
    }
    setLoading(true);
    if (modalMode === 'add') {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, shortName, logo, category }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create team');
        setLoading(false);
        return;
      }
    } else if (modalMode === 'edit' && editTeamId) {
      const res = await fetch(`/api/admin/teams?id=${editTeamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, shortName, logo, category }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to update team');
        setLoading(false);
        return;
      }
    }
    setShowModal(false);
    setLoading(false);
    setName('');
    setShortName('');
    setLogo('');
    setCategory('NATIONAL');
    setEditTeamId(null);
    fetchTeams();
  };

  const openDeleteModal = (teamId: string) => {
    setDeleteTeamId(teamId);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTeamId) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/admin/teams?id=${deleteTeamId}`, {
      method: 'DELETE',
    });
    setDeleteLoading(false);
    setShowDeleteConfirm(false);
    setDeleteTeamId(null);
    fetchTeams();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#18181b] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('dashboard.loading')}</p>
          </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#18181b] flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={fetchTeams}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {t('Retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#18181b]">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition"
          >
            New Team
          </button>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          {teams.length === 0 ? (
            <p className="text-gray-500">No teams found.</p>
          ) : (
            <div className="space-y-8">
              {/* National Teams Section */}
              {teams.filter(team => team.category === 'NATIONAL').length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2">🏆</span>
                    National Teams ({teams.filter(team => team.category === 'NATIONAL').length})
                  </h2>
                  <ul className="space-y-2">
                    {teams
                      .filter(team => team.category === 'NATIONAL')
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((team) => (
                        <li key={team.id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between hover:bg-gray-50 transition">
                          <div className="flex items-center space-x-3">
                            <img
                              src={team.logo || DEFAULT_LOGO}
                              alt={team.name + ' logo'}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200 bg-white"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (target.src !== DEFAULT_LOGO) {
                                  target.src = DEFAULT_LOGO;
                                }
                              }}
                            />
                            <div>
                              <span className="text-lg text-gray-800 font-medium">{team.name}</span>
                              {team.shortName && <span className="ml-2 text-sm text-gray-500">({team.shortName})</span>}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditModal(team)}
                              className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => openDeleteModal(team.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Club Teams Section */}
              {teams.filter(team => team.category === 'CLUB').length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2">⚽</span>
                    Club Teams ({teams.filter(team => team.category === 'CLUB').length})
                  </h2>
                  <ul className="space-y-2">
                    {teams
                      .filter(team => team.category === 'CLUB')
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((team) => (
                        <li key={team.id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between hover:bg-gray-50 transition">
                          <div className="flex items-center space-x-3">
                            <img
                              src={team.logo || DEFAULT_LOGO}
                              alt={team.name + ' logo'}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200 bg-white"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (target.src !== DEFAULT_LOGO) {
                                  target.src = DEFAULT_LOGO;
                                }
                              }}
                            />
                            <div>
                              <span className="text-lg text-gray-800 font-medium">{team.name}</span>
                              {team.shortName && <span className="ml-2 text-sm text-gray-500">({team.shortName})</span>}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditModal(team)}
                              className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => openDeleteModal(team.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative animate-fade-in">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">{modalMode === 'add' ? 'Add Team' : 'Edit Team'}</h2>
                        <div className="space-y-4">
                          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team Name<span className="text-red-500">*</span></label>
                            <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="e.g. Paris Saint-Germain"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={loading}
                            />
                          </div>
                          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
                            <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="e.g. PSG"
                    value={shortName}
                    onChange={e => setShortName(e.target.value)}
                    disabled={loading}
                            />
                          </div>
                          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                            <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="e.g. https://upload.wikimedia.org/wikipedia/en/3/3b/Paris_Saint-Germain_F.C..svg"
                    value={logo}
                    onChange={e => setLogo(e.target.value)}
                    disabled={loading}
                            />
                          </div>
                          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    value={category}
                    onChange={e => setCategory(e.target.value as 'NATIONAL' | 'CLUB')}
                    disabled={loading}
                            >
                              <option value="NATIONAL">NATIONAL</option>
                              <option value="CLUB">CLUB</option>
                            </select>
                          </div>
                {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
                        </div>
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (modalMode === 'add' ? 'Creating...' : 'Saving...') : (modalMode === 'add' ? 'Create' : 'Save')}
                </button>
                      </div>
                    </div>
                  </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 relative animate-fade-in">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Delete Team</h2>
              <p className="mb-4 text-gray-700">Are you sure you want to delete this team? This action cannot be undone.</p>
              <div className="flex justify-end space-x-2">
                  <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                  disabled={deleteLoading}
                  >
                  Cancel
                  </button>
                  <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md shadow hover:bg-red-700 transition disabled:opacity-50"
                  disabled={deleteLoading}
                  >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                  </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 