import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { useTranslation } from '../../hooks/useTranslation';
import Navbar from '../../components/Navbar';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { prisma } from '../../lib/prisma';
import { TrophyIcon, CalendarIcon, UsersIcon, ChartBarIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface CompetitionUser {
  id: string;
  user: {
    id: string;
    name: string;
    profilePictureUrl?: string;
  };
}

interface Bet {
  id: string;
  points: number;
  userId: string;
  gameId: string;
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
}

export default function CompetitionDetails({ competition, competitionStats }: CompetitionDetailsProps) {
  const { t } = useTranslation('common');
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/competitions" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            {t('common.back')} to Competitions
          </Link>
        </div>

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
              <TrophyIcon className="h-8 w-8 text-yellow-500" />
            )}
            <h1 className="text-3xl font-bold text-gray-900">
              {competition.name}
            </h1>
          </div>
          <p className="text-gray-600">
            {competition.description}
          </p>
        </div>

        {/* Competition Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Period */}
          <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <CalendarIcon className="h-8 w-8 text-blue-500" />
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Period</span>
            </div>
            <div className="text-sm text-gray-900">
              <p className="font-medium">{formatDate(competition.startDate)}</p>
              <p className="text-gray-500">to</p>
              <p className="font-medium">{formatDate(competition.endDate)}</p>
            </div>
          </div>

          {/* Participants */}
          <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <UsersIcon className="h-8 w-8 text-green-500" />
              <span className="text-2xl font-bold text-gray-900">{competition._count.users}</span>
            </div>
            <h3 className="font-semibold text-gray-900">Participants</h3>
            <p className="text-sm text-gray-600">Players joined</p>
          </div>

          {/* Games */}
          <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <ChartBarIcon className="h-8 w-8 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900">{competition._count.games}</span>
            </div>
            <h3 className="font-semibold text-gray-900">Matches</h3>
            <p className="text-sm text-gray-600">Total games</p>
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                competition.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {competition.status === 'completed' ? '✅ Completed' : competition.status}
              </div>
            </div>
            <h3 className="font-semibold text-gray-900">Status</h3>
            <p className="text-sm text-gray-600">Competition state</p>
          </div>
        </div>

        {/* Winner & Last Place */}
        {(competition.winner || competition.lastPlace) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Winner */}
            {competition.winner && (
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      🏆
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-yellow-800">Champion</h3>
                    <p className="text-2xl font-bold text-yellow-900">{competition.winner.name}</p>
                    <p className="text-sm text-yellow-700">Competition Winner</p>
                  </div>
                </div>
              </div>
            )}

            {/* Last Place */}
            {competition.lastPlace && (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      🍽️
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-800">Dinner Host</h3>
                    <p className="text-2xl font-bold text-red-900">{competition.lastPlace.name}</p>
                    <p className="text-sm text-red-700">Owes everyone dinner!</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Final Ranking */}
        <div className="bg-white rounded-xl shadow-md border border-gray-300 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <TrophyIcon className="h-6 w-6 text-yellow-500 mr-2" />
              Final Ranking
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Games</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Average</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Exact Scores</th>
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
                          {player.position === 1 && <div className="text-xs text-yellow-600 font-medium">Champion</div>}
                          {player.position === competitionStats.length && <div className="text-xs text-red-600 font-medium">Dinner Host</div>}
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
                      <div className="text-sm text-gray-900">{player.accuracy.toFixed(1)}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">{player.exactScores}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Competition Summary */}
        <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="h-6 w-6 text-blue-500 mr-2" />
            Competition Summary
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {competitionStats.reduce((sum, player) => sum + player.totalPoints, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Points Scored</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {competitionStats.reduce((sum, player) => sum + player.exactScores, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Exact Scores</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {competitionStats.length > 0 ? 
                  (competitionStats.reduce((sum, player) => sum + player.accuracy, 0) / competitionStats.length).toFixed(1) : 0
                }%
              </div>
              <div className="text-sm text-gray-600">Average Accuracy</div>
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
    // Fetch competition details
    const competition = await prisma.competition.findUnique({
      where: { id: id as string },
      include: {
        winner: {
          select: { id: true, name: true }
        },
        lastPlace: {
          select: { id: true, name: true }
        },
        users: {
          include: {
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

    // Get competition stats for all participants
    const competitionStats = await Promise.all(
      competition.users.map(async (competitionUser: any) => {
        const user = competitionUser.user;
        
        // Get user's bets for this competition
        const userBets = await prisma.bet.findMany({
          where: {
            userId: user.id,
            game: {
              competitionId: competition.id
            }
          }
        });

        const totalPoints = userBets.reduce((sum: number, bet: Bet) => sum + bet.points, 0);
        const totalPredictions = userBets.length;
        const exactScores = userBets.filter((bet: Bet) => bet.points === 3).length;
        const correctWinners = userBets.filter((bet: Bet) => bet.points === 1).length;
        const accuracy = totalPredictions > 0 ? ((exactScores + correctWinners) / totalPredictions) * 100 : 0;

        return {
          userId: user.id,
          userName: user.name,
          profilePictureUrl: user.profilePictureUrl,
          totalPoints,
          totalPredictions,
          accuracy,
          exactScores,
          correctWinners,
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
      },
    };
  } catch (error) {
    console.error('Error fetching competition details:', error);
    return {
      notFound: true,
    };
  }
}; 