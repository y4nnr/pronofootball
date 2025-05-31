import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { useTranslation } from '../hooks/useTranslation';
import { useEffect, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ChartBarIcon,
  TrophyIcon,
  FireIcon,
  UserGroupIcon,
  StarIcon,
  CheckCircleIcon,
  UserIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

interface UserStats {
  totalPredictions: number;
  totalPoints: number;
  accuracy: number;
  wins: number;
  longestStreak: number;
  exactScoreStreak: number;
  longestStreakStart?: string;
  longestStreakEnd?: string;
  exactStreakStart?: string;
  exactStreakEnd?: string;
}

interface LeaderboardUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  stats: UserStats;
  createdAt: string;
  averagePoints?: number;
}

interface LeaderboardData {
  topPlayersByPoints: LeaderboardUser[];
  topPlayersByAverage: LeaderboardUser[];
  totalUsers: number;
  competitions: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    winner: {
      id: string;
      name: string;
    } | null;
    winnerPoints: number;
    participantCount: number;
    gameCount: number;
    logo?: string;
  }>;
}

interface UserProfilePicture {
  [key: string]: string;
}

interface CurrentUserStats {
  totalPoints: number;
  totalPredictions: number;
  accuracy: number;
  longestStreak: number;
  exactScoreStreak: number;
  wins: number;
  ranking: number;
  averagePoints: number;
}

interface LastGamePerformance {
  gameId: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  competition: string;
  actualScore: string;
  predictedScore: string;
  points: number;
  result: 'exact' | 'correct' | 'wrong';
}

export default function Stats({ currentUser }: { currentUser: LeaderboardUser }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfilePictures, setUserProfilePictures] = useState<UserProfilePicture>({});
  const [currentUserStats, setCurrentUserStats] = useState<CurrentUserStats | null>(null);
  const [lastGamesPerformance, setLastGamesPerformance] = useState<LastGamePerformance[]>([]);
  const [, setPerformanceLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardData();
    fetchUserProfilePictures();
    fetchLastGamesPerformance();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      const response = await fetch('/api/stats/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboardData(data);
        
        console.log('Current user:', currentUser);
        console.log('Leaderboard data:', data);
        
        // Calculate current user stats
        if (currentUser && data.topPlayersByPoints) {
          const userInLeaderboard = data.topPlayersByPoints.find((user: LeaderboardUser) => user.id === currentUser.id);
          console.log('User found in leaderboard:', userInLeaderboard);
          
          if (userInLeaderboard) {
            const ranking = data.topPlayersByPoints.findIndex((user: LeaderboardUser) => user.id === currentUser.id) + 1;
            const averagePoints = userInLeaderboard.stats.totalPredictions > 0 
              ? userInLeaderboard.stats.totalPoints / userInLeaderboard.stats.totalPredictions
              : 0;
            
            setCurrentUserStats({
              totalPoints: userInLeaderboard.stats.totalPoints,
              totalPredictions: userInLeaderboard.stats.totalPredictions,
              accuracy: userInLeaderboard.stats.accuracy,
              longestStreak: userInLeaderboard.stats.longestStreak,
              exactScoreStreak: userInLeaderboard.stats.exactScoreStreak,
              wins: userInLeaderboard.stats.wins,
              ranking,
              averagePoints
            });
          } else {
            // If user not found in leaderboard (e.g., admin user), fetch their stats directly
            console.log('User not found in leaderboard, fetching individual stats...');
            fetchCurrentUserStats();
          }
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUserStats = async () => {
    try {
      const response = await fetch('/api/stats/current-user');
      if (response.ok) {
        const data = await response.json();
        console.log('Individual user stats:', data);
        setCurrentUserStats(data);
      }
    } catch (error) {
      console.error('Error fetching current user stats:', error);
    }
  };

  const fetchUserProfilePictures = async () => {
    try {
      const response = await fetch('/api/users/profile-pictures');
      if (response.ok) {
        const data = await response.json();
        setUserProfilePictures(data);
      }
    } catch (error) {
      console.error('Error fetching user profile pictures:', error);
    }
  };

  const fetchLastGamesPerformance = async () => {
    try {
      const response = await fetch('/api/stats/user-performance');
      if (response.ok) {
        const data = await response.json();
        setLastGamesPerformance(data.lastGamesPerformance);
      }
    } catch (error) {
      console.error('Error fetching last games performance:', error);
    } finally {
      setPerformanceLoading(false);
    }
  };

  // Function to get user profile picture or generate avatar
  const getUserAvatar = (name: string) => {
    // Try to get real profile picture first
    const profilePicture = userProfilePictures[name];
    if (profilePicture) {
      return profilePicture;
    }
    
    // Fallback to generated avatar
    const userId = name.toLowerCase();
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  };

  // Create streak leaderboards from existing data
  const getStreakLeaderboards = () => {
    if (!leaderboardData) return { pointsStreaks: [], exactScoreStreaks: [] };
    
    const pointsStreaks = [...leaderboardData.topPlayersByPoints]
      .sort((a, b) => b.stats.longestStreak - a.stats.longestStreak)
      .slice(0, 25)
      .map(user => ({
        name: user.name,
        streak: user.stats.longestStreak,
        avatar: user.avatar,
        startDate: user.stats.longestStreakStart,
        endDate: user.stats.longestStreakEnd
      }));

    const exactScoreStreaks = [...leaderboardData.topPlayersByPoints]
      .sort((a, b) => b.stats.exactScoreStreak - a.stats.exactScoreStreak)
      .slice(0, 25)
      .map(user => ({
        name: user.name,
        streak: user.stats.exactScoreStreak,
        avatar: user.avatar,
        startDate: user.stats.exactStreakStart,
        endDate: user.stats.exactStreakEnd
      }));

    return { pointsStreaks, exactScoreStreaks };
  };

  // Get competitions won leaderboard
  const getCompetitionsWonLeaderboard = () => {
    if (!leaderboardData) return [];
    
    return [...leaderboardData.topPlayersByPoints]
      .sort((a, b) => b.stats.wins - a.stats.wins)
      .filter(user => user.stats.wins > 0)
      .slice(0, 10)
      .map(user => {
        // Get the actual competitions this user won
        const wonCompetitions = leaderboardData.competitions
          .filter(comp => comp.winner?.id === user.id)
          .map(comp => comp.name);
        
        return {
          name: user.name,
          competitions: user.stats.wins,
          avatar: user.avatar,
          wonCompetitions: wonCompetitions.join(', ') || 'Unknown competitions'
        };
      });
  };

  const { pointsStreaks, exactScoreStreaks } = getStreakLeaderboards();
  const competitionsWonLeaderboard = getCompetitionsWonLeaderboard();

  function truncateTo3Decimals(num: number | string) {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    return (Math.trunc(n * 1000) / 1000).toFixed(3);
  }

  return (
    <div className="bg-[#f3f4f6] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-4 bg-primary-600 rounded-full shadow-lg mr-2 flex items-center justify-center">
              <ChartBarIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              {t('stats.title')}
            </h1>
          </div>
          <p className="text-gray-800">
            {t('stats.subtitle')}
          </p>
        </div>

        {/* Remarque Banner - much more visible */}
        {!loading && leaderboardData && (
          <div className="bg-accent-100 border border-accent-400 text-gray-800 rounded-lg p-4 mb-8 shadow">
            <p className="text-base">
              <strong>{t('note')}:</strong> {t('stats.streakNotice')}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-primary-100 border border-primary-400 rounded-lg p-6 text-center mb-8 shadow">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-700 text-white text-sm font-medium mb-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t('stats.loadingRealData')}
            </div>
            <p className="text-primary-900">
              {t('stats.fetchingStatistics')}
            </p>
          </div>
        )}

        {/* Vos Statistiques Personnelles */}
        <section className="bg-white rounded-2xl shadow-modern border border-neutral-200/50 p-6 mb-8">
          <div className="flex items-center mb-6">
            <span className="p-3 bg-primary-600 rounded-full shadow-lg mr-3 flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-white" />
            </span>
            <h2 className="text-xl font-bold text-neutral-900">{t('stats.personalStats')}</h2>
          </div>
          {currentUserStats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {/* All-time Ranking */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all">
                <div className="flex items-center mb-2">
                  <span className='p-3 bg-accent-500 rounded-full shadow-lg mr-2 flex items-center justify-center'>
                    <TrophyIcon className="h-6 w-6 text-white" />
                  </span>
                  <span className="text-3xl text-gray-800">#{currentUserStats.ranking}</span>
                </div>
                <div className="text-base text-gray-800">{t('stats.allTimeRanking')}</div>
                <div className="text-xs text-gray-500">{t('stats.outOfUsers', { count: leaderboardData?.totalUsers || 0 })}</div>
              </div>
              {/* Total Points All Time */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all">
                <div className="flex items-center mb-2">
                  <span className='p-3 bg-accent-500 rounded-full shadow-lg mr-2 flex items-center justify-center'>
                    <StarIcon className="h-6 w-6 text-white" />
                  </span>
                  <span className="text-3xl text-gray-800">{currentUserStats.totalPoints}</span>
                </div>
                <div className="text-base text-gray-800">Points</div>
                <div className="text-xs text-gray-500">{t('stats.totalPointsEarned')}</div>
              </div>
              {/* Average Points per Game */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all">
                <div className="flex items-center mb-2">
                  <span className='p-3 bg-accent-500 rounded-full shadow-lg mr-2 flex items-center justify-center'>
                    <ChartBarIcon className="h-6 w-6 text-white" />
                  </span>
                  <span className="text-3xl text-gray-800">{Number(currentUserStats.averagePoints).toFixed(3)}</span>
                </div>
                <div className="text-base text-gray-800">{t('stats.avgPointsGame')}</div>
                <div className="text-xs text-gray-500">{t('stats.basedOnGames', { count: currentUserStats.totalPredictions })}</div>
              </div>
              {/* Longest Streak with Points */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all">
                <div className="flex items-center mb-2">
                  <span className='p-3 bg-accent-500 rounded-full shadow-lg mr-2 flex items-center justify-center'>
                    <FireIcon className="h-6 w-6 text-white" />
                  </span>
                  <span className="text-3xl text-gray-800">{currentUserStats.longestStreak}</span>
                </div>
                <div className="text-base text-gray-800">{t('stats.longestStreakPoints')}</div>
                <div className="text-xs text-gray-500">{t('stats.gamesWithPoints')}</div>
              </div>
              {/* Longest Exact Score Streak */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all">
                <div className="flex items-center mb-2">
                  <span className='p-3 bg-accent-500 rounded-full shadow-lg mr-2 flex items-center justify-center'>
                    <CheckCircleIcon className="h-6 w-6 text-white" />
                  </span>
                  <span className="text-3xl text-gray-800">{currentUserStats.exactScoreStreak}</span>
                </div>
                <div className="text-base text-gray-800">Plus Longue Série (Score Exact)</div>
                <div className="text-xs text-gray-500">{t('stats.exactScorePredictions')}</div>
              </div>
              {/* Competitions Won */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all">
                <div className="flex items-center mb-2">
                  <span className='p-3 bg-accent-500 rounded-full shadow-lg mr-2 flex items-center justify-center'>
                    <TrophyIcon className="h-6 w-6 text-white" />
                  </span>
                  <span className="text-3xl text-gray-800">{currentUserStats.wins}</span>
                </div>
                <div className="text-base text-gray-800">{t('stats.competitionsWon')}</div>
                <div className="text-xs text-gray-500">{t('stats.totalVictories')}</div>
              </div>
            </div>
          )}

          {/* Performance des 10 Derniers Matchs */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all">
            <div className="flex items-center mb-2">
              <span className='p-3 bg-accent-500 rounded-full shadow-lg mr-2 flex items-center justify-center'>
                <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
              </span>
              <div className="flex flex-col flex-1">
                {/* Labels above the row of numbers, aligned with the numbers */}
                <div className="flex justify-between text-xs text-neutral-500 mb-1">
                  <span className="flex items-center">← {t('stats.oldest')}</span>
                  <span className="flex items-center">{t('stats.mostRecent')} →</span>
                </div>
                <div className="flex space-x-2">
                  {Array.from({ length: 10 }).map((_, index) => {
                    const game = lastGamesPerformance[index];
                    return game ? (
                      <div
                        key={game.gameId}
                        className={`flex-1 h-12 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-modern ${
                          game.result === 'exact' ? 'bg-gradient-to-br from-accent-500 to-accent-600' :
                          game.result === 'correct' ? 'bg-gradient-to-br from-primary-500 to-primary-600' :
                          'bg-gradient-to-br from-warm-500 to-warm-600'
                        }`}
                        title={`${game.homeTeam} vs ${game.awayTeam} - ${game.actualScore} (predicted: ${game.predictedScore}) - ${game.points} points`}
                      >
                        {game.points}
                      </div>
                    ) : (
                      <div
                        key={`empty-${index}`}
                        className="flex-1 h-12 w-10 rounded-xl flex items-center justify-center text-gray-400 font-bold text-sm shadow-modern border-2 border-dashed border-gray-300 bg-white"
                        title="No data"
                      >
                        ?
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="text-base text-gray-800 mt-2">{t('stats.lastGamesPerformance')}</div>
            <div className="text-xs text-gray-500">Points gagnés</div>
          </div>
        </section>

        {/* Statistiques Globales */}
        <section className="bg-white rounded-2xl shadow-2xl p-6 mb-8 border border-gray-200">
          <div className="flex items-center mb-6">
            <span className="p-3 bg-primary-600 rounded-full shadow-lg mr-3 flex items-center justify-center">
              <UserGroupIcon className="h-6 w-6 text-white" />
            </span>
            <h2 className="text-xl font-bold text-neutral-900">Statistiques Globales</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Meilleurs Marqueurs */}
            <div className="bg-[#f9fafb] border border-gray-300 rounded-xl p-6 shadow-xl flex flex-col justify-between">
              <h3 className="text-gray-900 mb-4 flex items-center">
                {t('stats.topPlayersAllTime')}
              </h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-sm text-neutral-500 mt-2">{t('loading')}...</p>
                  </div>
                ) : leaderboardData?.topPlayersByPoints ? (
                  leaderboardData.topPlayersByPoints.slice(0, 10).map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200/50">
                      <div className="flex items-center space-x-3">
                        <span className={`text-lg font-medium mr-2 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-500' : 'text-gray-700'}`}>{index + 1}.</span>
                        <img 
                          src={getUserAvatar(player.name)} 
                          alt={player.name}
                          className="w-8 h-8 rounded-full object-cover border border-neutral-200"
                        />
                        <div>
                          <span className="font-medium text-neutral-900">{player.name}</span>
                          <p className="text-xs text-neutral-500">{player.stats.totalPredictions} {t('stats.games')}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-neutral-900">{player.stats.totalPoints} {t('stats.points').toLowerCase()}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-neutral-500">{t('stats.noDataAvailable')}</div>
                )}
              </div>
            </div>

            {/* Meilleure Moyenne */}
            <div className="bg-[#f9fafb] border border-gray-300 rounded-xl p-6 shadow-xl flex flex-col justify-between">
              <h3 className="text-gray-900 mb-4 flex items-center">
                {t('stats.bestAverage')}
              </h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-sm text-neutral-500 mt-2">{t('loading')}...</p>
                  </div>
                ) : leaderboardData?.topPlayersByAverage ? (
                  leaderboardData.topPlayersByAverage.slice(0, 10).map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200/50">
                      <div className="flex items-center space-x-3">
                        <span className={`text-lg font-medium mr-2 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-500' : 'text-gray-700'}`}>{index + 1}.</span>
                        <img 
                          src={getUserAvatar(player.name)} 
                          alt={player.name}
                          className="w-8 h-8 rounded-full object-cover border border-neutral-200"
                        />
                        <div>
                          <span className="font-medium text-neutral-900">{player.name}</span>
                          <p className="text-xs text-neutral-500">{player.stats.totalPredictions} {t('stats.games')}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-neutral-900">{truncateTo3Decimals(player.averagePoints ?? 0)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-neutral-500">{t('stats.noDataAvailable')}</div>
                )}
              </div>
            </div>

            {/* Longest Streaks with Points All Time */}
            <div className="bg-[#f9fafb] border border-gray-300 rounded-xl p-6 shadow-xl flex flex-col justify-between">
              <h3 className="text-gray-900 mb-4 flex items-center">
                {t('stats.longestStreaksPointsAllTime')}
              </h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-sm text-neutral-500 mt-2">{t('loading')}...</p>
                  </div>
                ) : pointsStreaks.length > 0 ? (
                  pointsStreaks.map((player, index) => (
                    <div key={player.name} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200/50">
                      <div className="flex items-center space-x-3">
                        <span className={`text-lg font-medium mr-2 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-500' : 'text-gray-700'}`}>{index + 1}.</span>
                        <img 
                          src={getUserAvatar(player.name)} 
                          alt={player.name}
                          className="w-8 h-8 rounded-full object-cover border border-neutral-200"
                        />
                        <div>
                          <span className="font-medium text-neutral-900">{player.name}</span>
                          {player.startDate && player.endDate ? (
                            <p className="text-xs text-neutral-500">
                              {new Date(player.startDate).toLocaleDateString()} - {new Date(player.endDate).toLocaleDateString()}
                            </p>
                          ) : (
                            <p className="text-xs text-neutral-500">Euro 2016</p>
                          )}
                        </div>
                      </div>
                      <span className="font-semibold text-neutral-900">{player.streak} {t('stats.games')}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-neutral-500">{t('stats.noCompetitionWinners')}</div>
                )}
              </div>
            </div>

            {/* Exact Score Streaks */}
            <div className="bg-[#f9fafb] border border-gray-300 rounded-xl p-6 shadow-xl flex flex-col justify-between">
              <h3 className="text-gray-900 mb-4 flex items-center">
                {t('stats.longestExactScoreStreaksAllTime')}
              </h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-sm text-neutral-500 mt-2">{t('loading')}...</p>
                  </div>
                ) : exactScoreStreaks.length > 0 ? (
                  exactScoreStreaks.map((player, index) => (
                    <div key={player.name} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200/50">
                      <div className="flex items-center space-x-3">
                        <span className={`text-lg font-medium mr-2 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-500' : 'text-gray-700'}`}>{index + 1}.</span>
                        <img 
                          src={getUserAvatar(player.name)} 
                          alt={player.name}
                          className="w-8 h-8 rounded-full object-cover border border-neutral-200"
                        />
                        <div>
                          <span className="font-medium text-neutral-900">{player.name}</span>
                          {player.startDate && player.endDate ? (
                            <p className="text-xs text-neutral-500">
                              {new Date(player.startDate).toLocaleDateString()} - {new Date(player.endDate).toLocaleDateString()}
                            </p>
                          ) : (
                            <p className="text-xs text-neutral-500">Euro 2016</p>
                          )}
                        </div>
                      </div>
                      <span className="font-semibold text-neutral-900">{player.streak} {t('stats.games')}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-neutral-500">{t('stats.noDataAvailable')}</div>
                )}
              </div>
            </div>

            {/* Most Competitions Won */}
            <div className="bg-[#f9fafb] border border-gray-300 rounded-xl p-6 shadow-xl flex flex-col justify-between lg:col-span-2">
              <h3 className="text-gray-900 mb-2 flex items-center text-lg">
                {t('stats.mostCompetitionsWon')}
              </h3>
              <p className="text-gray-600 mb-4 text-sm">Joueurs ayant remporté le plus de compétitions</p>
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-sm text-neutral-500 mt-2">{t('loading')}...</p>
                </div>
              ) : competitionsWonLeaderboard.length > 0 ? (
                <div className="space-y-4">
                  {/* Group players by win count */}
                  {(() => {
                    const groupedByWins = competitionsWonLeaderboard.reduce((acc, player) => {
                      if (!acc[player.competitions]) {
                        acc[player.competitions] = [];
                      }
                      acc[player.competitions].push(player);
                      return acc;
                    }, {} as Record<number, typeof competitionsWonLeaderboard>);
                    // Sort by win count (descending)
                    const sortedWinCounts = Object.keys(groupedByWins)
                      .map(Number)
                      .sort((a, b) => b - a);
                    return sortedWinCounts.map((winCount, groupIndex) => (
                      <div key={winCount} className={`pl-4 py-3 rounded-xl mb-2 flex flex-col border-l-8 ${
                        groupIndex === 0 ? 'border-yellow-400 bg-yellow-50' :
                        groupIndex === 1 ? 'border-gray-400 bg-gray-50' :
                        groupIndex === 2 ? 'border-orange-400 bg-orange-50' :
                        'border-blue-400 bg-blue-50'
                      }`}>
                        <div className="flex items-center mb-3">
                          <span className={`text-lg font-medium mr-2 ${groupIndex === 0 ? 'text-yellow-500' : groupIndex === 1 ? 'text-gray-400' : groupIndex === 2 ? 'text-orange-500' : 'text-gray-700'}`}>{winCount}</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {groupedByWins[winCount].map((player) => (
                            <div key={player.name} className="flex items-center space-x-2 bg-white rounded-lg p-3 shadow border border-gray-200">
                              <img 
                                src={getUserAvatar(player.name)} 
                                alt={player.name}
                                className="w-8 h-8 rounded-full border-2 border-yellow-400"
                              />
                              <div>
                                <div className="font-bold text-gray-900 text-sm">{player.name}</div>
                                <div className="text-xs text-gray-500 max-w-48 truncate" title={player.wonCompetitions}>
                                  {player.wonCompetitions}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="text-center py-4 text-neutral-500">{t('stats.noCompetitionWinners')}</div>
              )}
            </div>
          </div>
        </section>

        {/* Palmarès Section */}
        <section className="bg-white rounded-2xl shadow-modern border border-neutral-200/50 p-6 mb-8">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-primary-600 rounded-full shadow-lg mr-3 flex items-center justify-center">
              <TrophyIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900">Competition History</h2>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      {t('stats.competition')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      {t('stats.period')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      {t('stats.winner')}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      {t('stats.points')}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      {t('stats.avgPointsGame')}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      {t('stats.participants')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
                        <p className="text-sm text-neutral-500 mt-2">{t('loading')}...</p>
                      </td>
                    </tr>
                  ) : leaderboardData?.competitions && leaderboardData.competitions.length > 0 ? (
                    leaderboardData.competitions
                      .filter(competition => competition.status === 'COMPLETED')
                      .map((competition) => {
                        return (
                          <tr 
                            key={competition.id} 
                            className="hover:bg-yellow-50 transition-colors cursor-pointer"
                            onClick={() => router.push(`/competitions/${competition.id}`)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {competition.logo ? (
                                    <img 
                                      src={competition.logo} 
                                      alt={`${competition.name} logo`}
                                      className="h-10 w-10 object-contain"
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center">
                                      <span className="text-white font-bold text-sm">
                                        {competition.name.substring(0, 2).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <Link 
                                    href={`/competitions/${competition.id}`}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                                  >
                                    {competition.name}
                                  </Link>
                                  <div className="text-sm text-neutral-500">
                                    {competition.name.includes('Euro') ? t('stats.europeanChampionship') : 
                                     competition.name.includes('World Cup') ? t('stats.fifaWorldCup') : 
                                     competition.name.includes('Champions League') ? t('stats.uefaChampionsLeague') :
                                     t('stats.footballCompetition')}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-neutral-900">
                                {new Date(competition.startDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })} - {new Date(competition.endDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </div>
                              <div className="text-sm text-neutral-500">
                                {Math.ceil((new Date(competition.endDate).getTime() - new Date(competition.startDate).getTime()) / (1000 * 60 * 60 * 24))} {t('stats.days')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {competition.winner ? (
                                <div className="flex items-center">
                                  <img 
                                    src={getUserAvatar(competition.winner.name)} 
                                    alt={competition.winner.name}
                                    className="w-8 h-8 rounded-full mr-3 border-2 border-yellow-400"
                                  />
                                  <div>
                                    <div className="text-sm font-medium text-neutral-900 flex items-center">
                                      {competition.winner.name}
                                    </div>
                                    <div className="text-sm text-neutral-500">{t('stats.champion')}</div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-neutral-500">{t('stats.noWinnerSet')}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {competition.winner ? (
                                <div className="text-lg font-bold text-yellow-600">
                                  {competition.winnerPoints}
                                </div>
                              ) : (
                                <div className="text-sm text-neutral-500">-</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {competition.winner && competition.gameCount > 0 ? (
                                <div className="text-sm font-medium text-neutral-900">
                                  {(competition.winnerPoints / competition.gameCount).toFixed(2)}
                                </div>
                              ) : (
                                <div className="text-sm text-neutral-500">-</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="text-sm font-medium text-neutral-900">{competition.participantCount}</div>
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                        {t('stats.noCompetitionHistory')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Competition Summary Stats */}
            {!loading && leaderboardData && (
              <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {leaderboardData.competitions?.filter(comp => comp.status === 'COMPLETED').length || 0}
                    </div>
                    <div className="text-sm text-neutral-600">{t('stats.completedCompetitions')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {leaderboardData.topPlayersByPoints.reduce((sum, player) => sum + player.stats.totalPoints, 0)}
                    </div>
                    <div className="text-sm text-neutral-600">{t('stats.totalPointsScored')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary-600">
                      {leaderboardData.topPlayersByPoints.reduce((sum, player) => sum + player.stats.totalPredictions, 0)}
                    </div>
                    <div className="text-sm text-neutral-600">{t('stats.totalPredictions')}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: {
      ...(await serverSideTranslations(context.locale || 'en', ['common'])),
      currentUser: session.user,
    },
  };
}; 