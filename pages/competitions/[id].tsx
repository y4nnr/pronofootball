import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { useTranslation } from '../../hooks/useTranslation';
import Navbar from '../../components/Navbar';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { prisma } from '../../lib/prisma';
import { TrophyIcon, CalendarIcon, UsersIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState } from 'react';

interface CompetitionUser {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  competitionId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    profilePictureUrl: string | null;
  };
}

interface Bet {
  id: string;
  points: number;
  userId: string;
  gameId: string;
}

interface Game {
  id: string;
  date: string;
  status: string;
  homeScore?: number | null;
  awayScore?: number | null;
  homeTeam: {
    id: string;
    name: string;
    logo?: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    logo?: string | null;
  };
  bets: Array<{
    id: string;
    userId: string;
    score1: number | null;
    score2: number | null;
    user: {
      id: string;
      name: string;
      profilePictureUrl?: string | null;
    };
  }>;
}

interface CompetitionStats {
  userId: string;
  userName: string;
  profilePictureUrl?: string;
  totalPoints: number;
  totalPredictions: number;
  accuracy: number;
  exactScores: number;
  correctWinners: number;
  position: number;
}

interface CompetitionDetailsProps {
  competition: {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    status: string;
    winner?: {
      id: string;
      name: string;
    };
    lastPlace?: {
      id: string;
      name: string;
    };
    users: CompetitionUser[];
    _count: {
      games: number;
      users: number;
    };
    logo?: string;
  };
  competitionStats: CompetitionStats[];
  games: Game[];
}

// Deterministic date formatting to avoid hydration errors
function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

export default function CompetitionDetails({ competition, competitionStats, games }: CompetitionDetailsProps) {
  const { t } = useTranslation('common');
  const [showAllGames, setShowAllGames] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 2: return 'bg-gray-100 text-gray-800 border-gray-200';
      case 3: return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPositionIcon = (position: number) => {
    if (position === 1) return '🏆';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `#${position}`;
  };

  const getUserAvatar = (userName: string, profilePictureUrl?: string) => {
    if (profilePictureUrl) {
      return profilePictureUrl;
    }
    // Fallback to generated avatar if no profile picture
    const userId = userName.toLowerCase();
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  };

  // Mapping from competition names to translation keys
  const descriptionKeyMap: Record<string, string> = {
    "UEFA Champions League 24/25": "uefaChampionsLeague",
    "World Cup 2026": "worldCup2026",
    // Add more competitions as needed
  };
  const descriptionKey = descriptionKeyMap[competition.name] || null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            {competition.logo ? (
              <img 
                src={competition.logo} 
                alt={`${competition.name} logo`}
                className="h-12 w-12 object-contain"
              />
            ) : (
              <div className="h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center">
                <TrophyIcon className="h-8 w-8 text-white" />
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900">
              {competition.name}
            </h1>
          </div>
          <p className="text-gray-600">
            {descriptionKey ? t(`competitionDescriptions.${descriptionKey}`) : competition.description}
          </p>
        </div>

        {/* Competition Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Period */}
          <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6 flex flex-col justify-between">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-primary-600 rounded-full shadow-lg flex items-center justify-center h-12 w-12">
                <CalendarIcon className="h-8 w-8 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('competition.period')}</span>
            </div>
            <div className="text-sm text-gray-900">
              <p className="font-medium">{formatDate(competition.startDate)}</p>
              <p className="text-gray-500">{t('competition.to')}</p>
              <p className="font-medium">{formatDate(competition.endDate)}</p>
            </div>
          </div>

          {/* Participants */}
          <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6 flex flex-col justify-between">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-primary-600 rounded-full shadow-lg flex items-center justify-center h-12 w-12">
                <UsersIcon className="h-8 w-8 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{competition._count.users}</span>
            </div>
            <h3 className="font-semibold text-gray-900">{t('competition.participants')}</h3>
            <p className="text-sm text-gray-600">{t('competition.playersJoined')}</p>
          </div>

          {/* Games */}
          <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6 flex flex-col justify-between">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-primary-600 rounded-full shadow-lg flex items-center justify-center h-12 w-12">
                <ChartBarIcon className="h-8 w-8 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{competition._count.games}</span>
            </div>
            <h3 className="font-semibold text-gray-900">{t('competition.matches')}</h3>
            <p className="text-sm text-gray-600">{t('competition.totalGames')}</p>
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6 flex flex-col justify-between">
            <div className="flex items-center space-x-3 mb-4 justify-center">
              <span className="inline-block w-3 h-3 rounded-full bg-primary-600"></span>
              <span className="text-base font-bold text-blue-700 uppercase tracking-wider">{competition.status}</span>
            </div>
            <h3 className="font-semibold text-gray-900">{t('competition.status')}</h3>
            <p className="text-sm text-gray-600">{t('competition.competitionState')}</p>
          </div>
        </div>

        {/* Games Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-300 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <div className="p-2 bg-primary-600 rounded-full shadow-lg mr-2 flex items-center justify-center">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              {showAllGames ? t('competition.allCompetitionGames') : t('competition.gamesAvailableForBetting')}
            </h2>
            <button
              onClick={() => setShowAllGames(!showAllGames)}
              className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors duration-200"
            >
              {showAllGames ? t('competition.showBettingGames') : t('competition.showAllGames')}
            </button>
          </div>
          <div className="p-6">
            {(() => {
              const filteredGames = showAllGames ? games : games.filter(g => g.status === 'UPCOMING');
              // Sort by date descending (most recent first)
              const sortedGames = [...filteredGames].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              return sortedGames && sortedGames.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedGames.map((game) => {
                    const isOpen = game.status === 'UPCOMING';
                    const cardContent = (
                      <div className={`bg-neutral-50 border border-neutral-200 rounded-2xl shadow flex flex-col items-stretch transition ${isOpen ? 'hover:shadow-lg hover:border-primary-400 cursor-pointer' : ''} p-5 gap-3`}
                        >
                          {/* Date & Status */}
                          <div className="flex items-center w-full justify-between pb-3 border-b border-neutral-200">
                            <span className="text-xs text-neutral-500">
                              {formatDateTime(game.date)}
                            </span>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ml-2 ${
                              game.status === 'FINISHED' ? 'bg-green-100 text-green-800' :
                              game.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {game.status}
                            </span>
                          </div>
                          {/* Teams & Score */}
                          <div className="flex items-center w-full justify-between py-3 border-b border-neutral-200">
                            {/* Home Team */}
                            <div className="flex items-center min-w-0 w-2/5 justify-end pr-2">
                              {game.homeTeam.logo ? (
                                <img src={game.homeTeam.logo} alt={game.homeTeam.name} className="w-8 h-8 rounded-full ml-2 object-cover border border-gray-200" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 ml-2 flex items-center justify-center text-xs text-gray-500">{game.homeTeam.name.substring(0,2)}</div>
                              )}
                              <span className="text-gray-900 font-medium text-sm text-right truncate max-w-[90px]">{game.homeTeam.name}</span>
                            </div>
                            {/* Score */}
                            <div className="flex-1 flex justify-center">
                              <span className="text-lg font-bold text-gray-900">
                                {game.status === 'FINISHED' && typeof game.homeScore === 'number' && typeof game.awayScore === 'number'
                                  ? `${game.homeScore} - ${game.awayScore}`
                                  : '-'}
                              </span>
                            </div>
                            {/* Away Team */}
                            <div className="flex items-center min-w-0 w-2/5 pl-2">
                              {game.awayTeam.logo ? (
                                <img src={game.awayTeam.logo} alt={game.awayTeam.name} className="w-8 h-8 rounded-full mr-2 object-cover border border-gray-200" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex items-center justify-center text-xs text-gray-500">{game.awayTeam.name.substring(0,2)}</div>
                              )}
                              <span className="text-gray-900 font-medium text-sm text-left truncate max-w-[90px]">{game.awayTeam.name}</span>
                            </div>
                          </div>
                          {/* Bets List */}
                          {game.bets && game.bets.length > 0 && game.status !== 'UPCOMING' && (
                            <div className="w-full pt-3">
                              <div className="text-[11px] text-neutral-500 font-semibold mb-1 ml-1 tracking-wide uppercase">{t('game.placedBets')}</div>
                              <ul className="divide-y divide-neutral-100">
                                {game.bets.map((bet) => (
                                  <li key={bet.id} className="flex items-center py-1 first:pt-0 last:pb-0">
                                    <img
                                      src={bet.user.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(bet.user.name.toLowerCase())}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                                      alt={bet.user.name}
                                      className="w-6 h-6 rounded-full border border-gray-200 object-cover mr-2"
                                      title={bet.user.name}
                                    />
                                    <span className="text-xs text-gray-700 mr-2 truncate max-w-[80px]">{bet.user.name}</span>
                                    {bet.score1 !== null && bet.score2 !== null && (
                                      <span className="text-xs font-mono text-gray-900 bg-gray-100 rounded px-2 py-0.5 ml-auto">{bet.score1} - {bet.score2}</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                    );
                    return isOpen ? (
                      <Link href={`/betting/${game.id}`} key={game.id} className="block">
                        {cardContent}
                      </Link>
                    ) : (
                      <div key={game.id}>{cardContent}</div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">{t('competition.noActiveGamesFound')}</div>
              );
            })()}
          </div>
        </div>

        {/* Winner & Last Place */}
        {competition.status === 'COMPLETED' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Winner */}
            <div className={`bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6 ${!competition.winner ? 'opacity-60' : ''}`}>
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    🏆
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-yellow-800">{t('competition.champion')}</h3>
                  <p className="text-2xl font-bold text-yellow-900">{competition.winner ? competition.winner.name : '—'}</p>
                  <p className="text-sm text-yellow-700">{competition.winner ? t('competition.competitionWinner') : t('competition.noWinnerSet')}</p>
                </div>
              </div>
            </div>
            {/* Last Place */}
            <div className={`bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-6 ${!competition.lastPlace ? 'opacity-60' : ''}`}>
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    🍽️
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-800">{t('competition.dinnerHost')}</h3>
                  <p className="text-2xl font-bold text-red-900">{competition.lastPlace ? competition.lastPlace.name : '—'}</p>
                  <p className="text-sm text-red-700">{competition.lastPlace ? t('competition.owesEveryoneDinner') : t('competition.noWinnerSet')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Final Ranking or Current Ranking */}
        {competition.status === 'COMPLETED' ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-300 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-primary-600 rounded-full shadow-lg mr-2 flex items-center justify-center">
                  <TrophyIcon className="h-6 w-6 text-white" />
                </div>
                {t('competition.finalRanking')}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('competition.position')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('competition.player')}</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('competition.points')}</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('competition.games')}</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('competition.average')}</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('competition.exactScores')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {competitionStats.map((player, index) => (
                    <tr key={player.userId} className={`hover:bg-gray-50 ${index < 3 ? 'bg-gradient-to-r from-gray-50 to-white' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold text-sm ${getPositionColor(player.position)}`}>
                          {getPositionIcon(player.position)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img 
                            src={getUserAvatar(player.userName, player.profilePictureUrl)} 
                            alt={player.userName}
                            className="w-10 h-10 rounded-full mr-3 object-cover border-2 border-gray-200"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{player.userName}</div>
                            {player.position === 1 && <div className="text-xs text-yellow-600 font-medium">{t('competition.champion')}</div>}
                            {player.position === competitionStats.length && <div className="text-xs text-red-600 font-medium">{t('competition.dinnerHost')}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-lg font-bold text-gray-900">{player.totalPoints}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">{player.totalPredictions}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          {player.totalPredictions > 0 ? (player.totalPoints / player.totalPredictions).toFixed(2) : '0.00'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">0</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md border border-gray-300 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-primary-600 rounded-full shadow-lg mr-2 flex items-center justify-center">
                  <TrophyIcon className="h-6 w-6 text-white" />
                </div>
                Classement en cours
              </h2>
            </div>
            <div className="overflow-x-auto">
              {competitionStats && competitionStats.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {competitionStats.map((player, index) => (
                      <tr key={player.userId} className={`hover:bg-gray-50 ${index < 3 ? 'bg-gradient-to-r from-gray-50 to-white' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold text-sm ${getPositionColor(player.position)}`}>
                            {getPositionIcon(player.position)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img 
                              src={getUserAvatar(player.userName, player.profilePictureUrl)} 
                              alt={player.userName}
                              className="w-10 h-10 rounded-full mr-3 object-cover border-2 border-gray-200"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{player.userName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-lg font-bold text-gray-900">{player.totalPoints}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-gray-500">Classement en cours...</div>
              )}
            </div>
          </div>
        )}

        {/* Competition Summary */}
        <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="h-6 w-6 text-primary-600 mr-2" />
            {t('competition.competitionSummary')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {competitionStats.reduce((sum, player) => sum + player.totalPoints, 0)}
              </div>
              <div className="text-sm text-gray-600">{t('competition.totalPoints')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                0
              </div>
              <div className="text-sm text-gray-600">{t('competition.totalExactScores')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  const { id } = context.params!;

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    // Fetch competition details with minimal required fields
    const competition = await prisma.competition.findUnique({
      where: { id: id as string },
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
        status: true,
        logo: true,
        winner: {
          select: { id: true, name: true }
        },
        lastPlace: {
          select: { id: true, name: true }
        },
        users: {
          select: {
            user: {
              select: { id: true, name: true, profilePictureUrl: true }
            }
          }
        },
        _count: {
          select: { games: true, users: true }
        }
      }
    });

    if (!competition) {
      return {
        notFound: true,
      };
    }

    // Fetch games with pagination and minimal required fields
    const games = await prisma.game.findMany({
      where: { competitionId: competition.id },
      select: {
        id: true,
        date: true,
        status: true,
        homeScore: true,
        awayScore: true,
        homeTeam: {
          select: { id: true, name: true, logo: true }
        },
        awayTeam: {
          select: { id: true, name: true, logo: true }
        },
        bets: {
          select: {
            id: true,
            userId: true,
            score1: true,
            score2: true,
            user: {
              select: { id: true, name: true, profilePictureUrl: true }
            }
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 50 // Limit to last 50 games
    });

    // Get competition stats for all participants with minimal fields
    const competitionStats = await Promise.all(
      competition.users.map(async (competitionUser) => {
        const user = competitionUser.user;
        
        const userBets = await prisma.bet.findMany({
          where: {
            userId: user.id,
            game: {
              competitionId: competition.id
            }
          },
          select: {
            points: true
          }
        });

        const totalPoints = userBets.reduce((sum, bet) => sum + bet.points, 0);
        const totalPredictions = userBets.length;

        return {
          userId: user.id,
          userName: user.name,
          profilePictureUrl: user.profilePictureUrl,
          totalPoints,
          totalPredictions,
          position: 0 // Will be set after sorting
        };
      })
    );

    // Sort by points and assign positions
    competitionStats.sort((a, b) => b.totalPoints - a.totalPoints);
    competitionStats.forEach((player, index) => {
      player.position = index + 1;
    });

    return {
      props: {
        ...(await serverSideTranslations(context.locale || 'en', ['common'])),
        competition: JSON.parse(JSON.stringify(competition)),
        competitionStats: JSON.parse(JSON.stringify(competitionStats)),
        games: JSON.parse(JSON.stringify(games)),
      },
    };
  } catch (error) {
    console.error('Error fetching competition details:', error);
    return {
      notFound: true,
    };
  }
}; 