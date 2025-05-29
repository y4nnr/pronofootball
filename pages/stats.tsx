import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { useTranslation } from '../hooks/useTranslation';
import Navbar from '../components/Navbar';
import { ChartBarIcon, TrophyIcon, FireIcon, CalendarIcon, UserGroupIcon, StarIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import { useRouter } from 'next/router';

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

export default function Stats({ currentUser }: { currentUser: any }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfilePictures, setUserProfilePictures] = useState<UserProfilePicture>({});
  const [currentUserStats, setCurrentUserStats] = useState<CurrentUserStats | null>(null);
  const [lastGamesPerformance, setLastGamesPerformance] = useState<LastGamePerformance[]>([]);
  const [performanceLoading, setPerformanceLoading] = useState(true);

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
              ? parseFloat((userInLeaderboard.stats.totalPoints / userInLeaderboard.stats.totalPredictions).toFixed(2))
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

  // Generate random colors for avatars
  const getAvatarColor = (index: number) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
      'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
    ];
    return colors[index % colors.length];
  };

  // Function to get user profile picture or generate avatar
  const getUserAvatar = (name: string, index: number) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              {t('stats.title')}
            </h1>
          </div>
          <p className="text-gray-800">
            {t('stats.subtitle')}
          </p>
        </div>

        {/* Real Data Notice */}
        {!loading && leaderboardData && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-8">
            <p className="text-green-600 text-sm">
              <strong>{t('note')}:</strong> {t('stats.streakNotice')}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              {t('stats.loadingRealData')}
            </div>
            <p className="text-blue-700">
              {t('stats.fetchingStatistics')}
            </p>
          </div>
        )}

        {/* Personal Stats Section */}
        {currentUserStats && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <StarIcon className="h-6 w-6 text-yellow-500 mr-2" />
              {t('stats.personalStats')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
              {/* All-time Ranking */}
              <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrophyIcon className="h-8 w-8 text-yellow-500" />
                  <span className="text-2xl font-bold text-gray-900">#{currentUserStats.ranking}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{t('stats.allTimeRanking')}</h3>
                <p className="text-sm text-gray-600">{t('stats.outOfUsers', { count: leaderboardData?.totalUsers || 0 })}</p>
              </div>

              {/* Total Points All Time */}
              <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
                <div className="flex items-center justify-between mb-4">
                  <StarIcon className="h-8 w-8 text-blue-500" />
                  <span className="text-2xl font-bold text-gray-900">{currentUserStats.totalPoints}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{t('stats.pointsAllTime')}</h3>
                <p className="text-sm text-gray-600">{t('stats.totalPointsEarned')}</p>
              </div>

              {/* Average Points per Game */}
              <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
                <div className="flex items-center justify-between mb-4">
                  <ChartBarIcon className="h-8 w-8 text-green-500" />
                  <span className="text-2xl font-bold text-gray-900">{currentUserStats.averagePoints.toFixed(3)}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{t('stats.avgPointsGame')}</h3>
                <p className="text-sm text-gray-600">{t('stats.basedOnGames', { count: currentUserStats.totalPredictions })}</p>
              </div>

              {/* Longest Streak with Points */}
              <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
                <div className="flex items-center justify-between mb-4">
                  <FireIcon className="h-8 w-8 text-red-500" />
                  <span className="text-2xl font-bold text-gray-900">{currentUserStats.longestStreak}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{t('stats.longestStreakPoints')}</h3>
                <p className="text-sm text-gray-600">{t('stats.gamesWithPoints')}</p>
              </div>

              {/* Longest Exact Score Streak */}
              <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
                <div className="flex items-center justify-between mb-4">
                  <StarIcon className="h-8 w-8 text-purple-500" />
                  <span className="text-2xl font-bold text-gray-900">{currentUserStats.exactScoreStreak}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{t('stats.longestExactScoreStreak')}</h3>
                <p className="text-sm text-gray-600">{t('stats.exactScorePredictions')}</p>
              </div>

              {/* Competitions Won */}
              <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrophyIcon className="h-8 w-8 text-green-500" />
                  <span className="text-2xl font-bold text-gray-900">{currentUserStats.wins}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{t('stats.competitionsWon')}</h3>
                <p className="text-sm text-gray-600">{t('stats.totalVictories')}</p>
              </div>
            </div>

            {/* Last 10 Games Performance */}
            <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <CalendarIcon className="h-5 w-5 text-blue-500 mr-2" />
                {t('stats.lastGamesPerformance')}
              </h3>
              
              {performanceLoading ? (
                <div className="animate-pulse h-32 bg-gray-200 rounded"></div>
              ) : lastGamesPerformance.length > 0 ? (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-3">
                    <span>{t('stats.oldest')}</span>
                    <span>{t('stats.mostRecent')}</span>
                  </div>
                  
                  <div className="flex space-x-2 mb-4">
                    {lastGamesPerformance.slice().reverse().map((game, index) => (
                      <div
                        key={game.gameId}
                        className={`flex-1 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                          game.result === 'exact' ? 'bg-green-500' :
                          game.result === 'correct' ? 'bg-blue-500' :
                          'bg-red-500'
                        }`}
                        title={`${game.homeTeam} vs ${game.awayTeam} - ${game.actualScore} (predicted: ${game.predictedScore}) - ${game.points} points`}
                      >
                        {game.points}
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-xs text-gray-500 text-center">
                    {t('stats.scoreExplanation')}
                  </div>
                  
                  {/* Detailed breakdown */}
                  <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                    {lastGamesPerformance.map((game) => (
                      <div key={game.gameId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            game.result === 'exact' ? 'bg-green-500' :
                            game.result === 'correct' ? 'bg-blue-500' :
                            'bg-red-500'
                          }`}></div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {game.homeTeam} vs {game.awayTeam}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(game.date).toLocaleDateString()} • {game.competition}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {game.actualScore} ({game.predictedScore})
                          </div>
                          <div className="text-xs text-gray-500">
                            {game.points} {game.points === 1 ? 'point' : 'points'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">{t('stats.noDataAvailable')}</div>
              )}
            </div>
          </div>
        )}

        {/* Leaderboards Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <UserGroupIcon className="h-6 w-6 text-blue-500 mr-2" />
            {t('stats.globalLeaderboards')}
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Players by Points */}
            <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{t('stats.topPlayersAllTime')}</h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">{t('loading')}...</p>
                  </div>
                ) : leaderboardData?.topPlayersByPoints ? (
                  leaderboardData.topPlayersByPoints.slice(0, 10).map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </span>
                        <img 
                          src={getUserAvatar(player.name, index)} 
                          alt={player.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <span className="font-medium text-gray-900">{player.name}</span>
                          <p className="text-xs text-gray-500">{player.stats.totalPredictions} {t('stats.games')}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">{player.stats.totalPoints} {t('stats.points').toLowerCase()}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">{t('stats.noDataAvailable')}</div>
                )}
              </div>
            </div>

            {/* Top Players by Average */}
            <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{t('stats.bestAverage')}</h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">{t('loading')}...</p>
                  </div>
                ) : leaderboardData?.topPlayersByAverage ? (
                  leaderboardData.topPlayersByAverage.slice(0, 10).map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </span>
                        <img 
                          src={getUserAvatar(player.name, index)} 
                          alt={player.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <span className="font-medium text-gray-900">{player.name}</span>
                          <p className="text-xs text-gray-500">{player.stats.totalPredictions} {t('stats.games')}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">{player.averagePoints?.toFixed(3) || '0.000'}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">{t('stats.noDataAvailable')}</div>
                )}
              </div>
            </div>

            {/* Longest Streaks with Points All Time */}
            <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <FireIcon className="h-5 w-5 text-red-500 mr-2" />
                {t('stats.longestStreaksPointsAllTime')}
              </h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">{t('loading')}...</p>
                  </div>
                ) : pointsStreaks.length > 0 ? (
                  pointsStreaks.map((player, index) => (
                    <div key={player.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </span>
                        <img 
                          src={getUserAvatar(player.name, index)} 
                          alt={player.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <span className="font-medium text-gray-900">{player.name}</span>
                          {player.startDate && player.endDate ? (
                            <p className="text-xs text-gray-500">
                              {new Date(player.startDate).toLocaleDateString()} - {new Date(player.endDate).toLocaleDateString()}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500">Euro 2016</p>
                          )}
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">{player.streak} {t('stats.games')}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">{t('stats.noCompetitionWinners')}</div>
                )}
              </div>
            </div>

            {/* Longest Exact Score Streaks All Time */}
            <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <StarIcon className="h-5 w-5 text-purple-500 mr-2" />
                {t('stats.longestExactScoreStreaksAllTime')}
              </h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">{t('loading')}...</p>
                  </div>
                ) : exactScoreStreaks.length > 0 ? (
                  exactScoreStreaks.map((player, index) => (
                    <div key={player.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </span>
                        <img 
                          src={getUserAvatar(player.name, index)} 
                          alt={player.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <span className="font-medium text-gray-900">{player.name}</span>
                          {player.startDate && player.endDate ? (
                            <p className="text-xs text-gray-500">
                              {new Date(player.startDate).toLocaleDateString()} - {new Date(player.endDate).toLocaleDateString()}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500">Euro 2016</p>
                          )}
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">{player.streak} {t('stats.games')}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">{t('stats.noDataAvailable')}</div>
                )}
              </div>
            </div>

            {/* Most Competitions Won */}
            <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6 lg:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <TrophyIcon className="h-5 w-5 text-green-500 mr-2" />
                {t('stats.mostCompetitionsWon')}
              </h3>
              
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">{t('loading')}...</p>
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
                      <div key={winCount} className="border-l-4 border-green-500 pl-4 py-3 bg-green-50 rounded-r-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                              groupIndex === 0 ? 'bg-yellow-500 text-white' :
                              groupIndex === 1 ? 'bg-gray-400 text-white' :
                              groupIndex === 2 ? 'bg-orange-500 text-white' :
                              'bg-blue-500 text-white'
                            }`}>
                              {groupIndex + 1}
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                              {winCount} {winCount === 1 ? t('stats.win') : t('stats.wins')}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                          {groupedByWins[winCount].map((player) => (
                            <div key={player.name} className="flex items-center space-x-2 bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                              <img 
                                src={getUserAvatar(player.name, 0)} 
                                alt={player.name}
                                className="w-8 h-8 rounded-full border-2 border-green-300"
                              />
                              <div>
                                <div className="font-medium text-gray-900 text-sm">{player.name}</div>
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
                <div className="text-center py-4 text-gray-500">{t('stats.noCompetitionWinners')}</div>
              )}
            </div>
          </div>
        </div>

        {/* Palmarès Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <TrophyIcon className="h-6 w-6 text-yellow-500 mr-2" />
            {t('stats.palmares')}
          </h2>
          
          <div className="bg-white rounded-xl shadow-md border border-gray-300 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <CalendarIcon className="h-5 w-5 text-yellow-600 mr-2" />
                {t('stats.competitionHistoryChampions')}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{t('stats.completeRecordCompetitions')}</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('stats.competition')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('stats.period')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('stats.winner')}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('stats.points')}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('stats.avgPointsGame')}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('stats.participants')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">{t('loading')}...</p>
                      </td>
                    </tr>
                  ) : leaderboardData?.competitions && leaderboardData.competitions.length > 0 ? (
                    leaderboardData.competitions
                      .filter(competition => competition.status === 'FINISHED')
                      .map((competition, index) => {
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
                                  <div className="text-sm text-gray-500">
                                    {competition.name.includes('Euro') ? t('stats.europeanChampionship') : 
                                     competition.name.includes('World Cup') ? t('stats.fifaWorldCup') : 
                                     competition.name.includes('Champions League') ? t('stats.uefaChampionsLeague') :
                                     t('stats.footballCompetition')}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
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
                              <div className="text-sm text-gray-500">
                                {Math.ceil((new Date(competition.endDate).getTime() - new Date(competition.startDate).getTime()) / (1000 * 60 * 60 * 24))} {t('stats.days')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {competition.winner ? (
                                <div className="flex items-center">
                                  <img 
                                    src={getUserAvatar(competition.winner.name, index)} 
                                    alt={competition.winner.name}
                                    className="w-8 h-8 rounded-full mr-3 border-2 border-yellow-400"
                                  />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 flex items-center">
                                      {competition.winner.name}
                                      <TrophyIcon className="h-4 w-4 text-yellow-500 ml-2" />
                                    </div>
                                    <div className="text-sm text-gray-500">{t('stats.champion')}</div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">{t('stats.noWinnerSet')}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {competition.winner ? (
                                <div className="text-lg font-bold text-yellow-600">
                                  {competition.winnerPoints}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">-</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {competition.winner && competition.gameCount > 0 ? (
                                <div className="text-sm font-medium text-gray-900">
                                  {(competition.winnerPoints / competition.gameCount).toFixed(2)}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">-</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="text-sm font-medium text-gray-900">{competition.participantCount}</div>
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        {t('stats.noCompetitionHistory')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Competition Summary Stats */}
            {!loading && leaderboardData && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {leaderboardData.competitions?.filter(comp => comp.status === 'FINISHED').length || 0}
                    </div>
                    <div className="text-sm text-gray-600">{t('stats.completedCompetitions')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {leaderboardData.topPlayersByPoints.reduce((sum, player) => sum + player.stats.totalPoints, 0)}
                    </div>
                    <div className="text-sm text-gray-600">{t('stats.totalPointsScored')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {leaderboardData.topPlayersByPoints.reduce((sum, player) => sum + player.stats.totalPredictions, 0)}
                    </div>
                    <div className="text-sm text-gray-600">{t('stats.totalPredictions')}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
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