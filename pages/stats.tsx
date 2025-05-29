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
      'bg-warm-400', 'bg-primary-500', 'bg-accent-400', 'bg-cream-400',
      'bg-neutral-400', 'bg-warm-500', 'bg-primary-400', 'bg-accent-500'
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-primary-500 rounded-xl shadow-modern">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text-stats">
              {t('stats.title')}
            </h1>
          </div>
          <p className="subtitle-text">
            {t('stats.subtitle')}
          </p>
        </div>

        {/* Real Data Notice */}
        {!loading && leaderboardData && (
          <div className="bg-gradient-to-br from-accent-50 to-accent-100 border border-accent-200/50 rounded-2xl p-6 text-center mb-8 shadow-modern">
            <p className="text-accent-700 text-sm">
              <strong>{t('note')}:</strong> {t('stats.streakNotice')}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200/50 rounded-2xl p-6 text-center mb-8 shadow-modern">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-500/20 text-primary-800 text-sm font-medium mb-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
              {t('stats.loadingRealData')}
            </div>
            <p className="text-primary-700">
              {t('stats.fetchingStatistics')}
            </p>
          </div>
        )}

        {/* Personal Stats Section */}
        {currentUserStats && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center">
              <div className="p-2 bg-warm-500 rounded-xl shadow-modern mr-3">
                <StarIcon className="h-5 w-5 text-white" />
              </div>
              {t('stats.personalStats')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
              {/* All-time Ranking */}
              <div className="bg-gradient-to-br from-warm-50 to-warm-100 rounded-2xl shadow-modern border border-warm-200/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrophyIcon className="h-8 w-8 text-warm-600" />
                  <span className="text-2xl font-bold text-warm-900">#{currentUserStats.ranking}</span>
                </div>
                <h3 className="font-semibold text-warm-900">{t('stats.allTimeRanking')}</h3>
                <p className="text-sm text-warm-700">{t('stats.outOfUsers', { count: leaderboardData?.totalUsers || 0 })}</p>
              </div>

              {/* Total Points All Time */}
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl shadow-modern border border-primary-200/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <StarIcon className="h-8 w-8 text-primary-600" />
                  <span className="text-2xl font-bold text-primary-900">{currentUserStats.totalPoints}</span>
                </div>
                <h3 className="font-semibold text-primary-900">{t('stats.pointsAllTime')}</h3>
                <p className="text-sm text-primary-700">{t('stats.totalPointsEarned')}</p>
              </div>

              {/* Average Points per Game */}
              <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-2xl shadow-modern border border-accent-200/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <ChartBarIcon className="h-8 w-8 text-accent-600" />
                  <span className="text-2xl font-bold text-accent-900">{currentUserStats.averagePoints.toFixed(3)}</span>
                </div>
                <h3 className="font-semibold text-accent-900">{t('stats.avgPointsGame')}</h3>
                <p className="text-sm text-accent-700">{t('stats.basedOnGames', { count: currentUserStats.totalPredictions })}</p>
              </div>

              {/* Longest Streak with Points */}
              <div className="bg-gradient-to-br from-warm-50 to-warm-100 rounded-2xl shadow-modern border border-warm-200/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <FireIcon className="h-8 w-8 text-warm-600" />
                  <span className="text-2xl font-bold text-warm-900">{currentUserStats.longestStreak}</span>
                </div>
                <h3 className="font-semibold text-warm-900">{t('stats.longestStreakPoints')}</h3>
                <p className="text-sm text-warm-700">{t('stats.gamesWithPoints')}</p>
              </div>

              {/* Longest Exact Score Streak */}
              <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-2xl shadow-modern border border-accent-200/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <StarIcon className="h-8 w-8 text-accent-600" />
                  <span className="text-2xl font-bold text-accent-900">{currentUserStats.exactScoreStreak}</span>
                </div>
                <h3 className="font-semibold text-accent-900">{t('stats.longestExactScoreStreak')}</h3>
                <p className="text-sm text-accent-700">{t('stats.exactScorePredictions')}</p>
              </div>

              {/* Competitions Won */}
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl shadow-modern border border-primary-200/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrophyIcon className="h-8 w-8 text-primary-600" />
                  <span className="text-2xl font-bold text-primary-900">{currentUserStats.wins}</span>
                </div>
                <h3 className="font-semibold text-primary-900">{t('stats.competitionsWon')}</h3>
                <p className="text-sm text-primary-700">{t('stats.totalVictories')}</p>
              </div>
            </div>

            {/* Last 10 Games Performance */}
            <div className="bg-white rounded-2xl shadow-modern border border-neutral-200/50 p-6">
              <h3 className="font-semibold text-neutral-900 mb-4 flex items-center">
                <div className="p-1.5 bg-primary-500 rounded-lg mr-2">
                  <CalendarIcon className="h-4 w-4 text-white" />
                </div>
                {t('stats.lastGamesPerformance')}
              </h3>
              
              {performanceLoading ? (
                <div className="animate-pulse h-32 bg-neutral-200 rounded-xl"></div>
              ) : lastGamesPerformance.length > 0 ? (
                <div>
                  <div className="flex justify-between text-xs text-neutral-500 mb-3">
                    <span>{t('stats.oldest')}</span>
                    <span>{t('stats.mostRecent')}</span>
                  </div>
                  
                  <div className="flex space-x-2 mb-4">
                    {lastGamesPerformance.slice().reverse().map((game, index) => (
                      <div
                        key={game.gameId}
                        className={`flex-1 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-modern ${
                          game.result === 'exact' ? 'bg-gradient-to-br from-accent-500 to-accent-600' :
                          game.result === 'correct' ? 'bg-gradient-to-br from-primary-500 to-primary-600' :
                          'bg-gradient-to-br from-warm-500 to-warm-600'
                        }`}
                        title={`${game.homeTeam} vs ${game.awayTeam} - ${game.actualScore} (predicted: ${game.predictedScore}) - ${game.points} points`}
                      >
                        {game.points}
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-xs text-neutral-500 text-center">
                    {t('stats.scoreExplanation')}
                  </div>
                  
                  {/* Detailed breakdown */}
                  <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                    {lastGamesPerformance.map((game) => (
                      <div key={game.gameId} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200/50">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            game.result === 'exact' ? 'bg-accent-500' :
                            game.result === 'correct' ? 'bg-primary-500' :
                            'bg-warm-500'
                          }`}></div>
                          <div>
                            <div className="text-sm font-medium text-neutral-900">
                              {game.homeTeam} vs {game.awayTeam}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {new Date(game.date).toLocaleDateString()} • {game.competition}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-neutral-900">
                            {game.actualScore} ({game.predictedScore})
                          </div>
                          <div className="text-xs text-neutral-500">
                            {game.points} {game.points === 1 ? 'point' : 'points'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-neutral-500">{t('stats.noDataAvailable')}</div>
              )}
            </div>
          </div>
        )}

        {/* Leaderboards Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center">
            <div className="p-2 bg-primary-500 rounded-xl shadow-modern mr-3">
              <UserGroupIcon className="h-5 w-5 text-white" />
            </div>
            {t('stats.globalLeaderboards')}
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Players by Points */}
            <div className="bg-white rounded-2xl shadow-modern border border-neutral-200/50 p-6">
              <h3 className="font-semibold text-neutral-900 mb-4">{t('stats.topPlayersAllTime')}</h3>
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
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          index === 0 ? 'bg-gradient-to-br from-warm-100 to-warm-200 text-warm-800' :
                          index === 1 ? 'bg-gradient-to-br from-neutral-200 to-neutral-300 text-neutral-800' :
                          index === 2 ? 'bg-gradient-to-br from-accent-100 to-accent-200 text-accent-800' :
                          'bg-gradient-to-br from-primary-100 to-primary-200 text-primary-800'
                        }`}>
                          {index + 1}
                        </span>
                        <img 
                          src={getUserAvatar(player.name, index)} 
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

            {/* Top Players by Average */}
            <div className="bg-white rounded-2xl shadow-modern border border-neutral-200/50 p-6">
              <h3 className="font-semibold text-neutral-900 mb-4">{t('stats.bestAverage')}</h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600 mx-auto"></div>
                    <p className="text-sm text-neutral-500 mt-2">{t('loading')}...</p>
                  </div>
                ) : leaderboardData?.topPlayersByAverage ? (
                  leaderboardData.topPlayersByAverage.slice(0, 10).map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200/50">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          index === 0 ? 'bg-gradient-to-br from-warm-100 to-warm-200 text-warm-800' :
                          index === 1 ? 'bg-gradient-to-br from-neutral-200 to-neutral-300 text-neutral-800' :
                          index === 2 ? 'bg-gradient-to-br from-accent-100 to-accent-200 text-accent-800' :
                          'bg-gradient-to-br from-primary-100 to-primary-200 text-primary-800'
                        }`}>
                          {index + 1}
                        </span>
                        <img 
                          src={getUserAvatar(player.name, index)} 
                          alt={player.name}
                          className="w-8 h-8 rounded-full object-cover border border-neutral-200"
                        />
                        <div>
                          <span className="font-medium text-neutral-900">{player.name}</span>
                          <p className="text-xs text-neutral-500">{player.stats.totalPredictions} {t('stats.games')}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-neutral-900">{player.averagePoints?.toFixed(3) || '0.000'}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-neutral-500">{t('stats.noDataAvailable')}</div>
                )}
              </div>
            </div>

            {/* Longest Streaks with Points All Time */}
            <div className="bg-white rounded-2xl shadow-modern border border-neutral-200/50 p-6">
              <h3 className="font-semibold text-neutral-900 mb-4 flex items-center">
                <div className="p-1.5 bg-warm-500 rounded-lg mr-2">
                  <FireIcon className="h-4 w-4 text-white" />
                </div>
                {t('stats.longestStreaksPointsAllTime')}
              </h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-warm-600 mx-auto"></div>
                    <p className="text-sm text-neutral-500 mt-2">{t('loading')}...</p>
                  </div>
                ) : pointsStreaks.length > 0 ? (
                  pointsStreaks.map((player, index) => (
                    <div key={player.name} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200/50">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          index === 0 ? 'bg-gradient-to-br from-warm-100 to-warm-200 text-warm-800' :
                          index === 1 ? 'bg-gradient-to-br from-neutral-200 to-neutral-300 text-neutral-800' :
                          index === 2 ? 'bg-gradient-to-br from-accent-100 to-accent-200 text-accent-800' :
                          'bg-gradient-to-br from-primary-100 to-primary-200 text-primary-800'
                        }`}>
                          {index + 1}
                        </span>
                        <img 
                          src={getUserAvatar(player.name, index)} 
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

            {/* Longest Exact Score Streaks All Time */}
            <div className="bg-white rounded-2xl shadow-modern border border-neutral-200/50 p-6">
              <h3 className="font-semibold text-neutral-900 mb-4 flex items-center">
                <div className="p-1.5 bg-accent-500 rounded-lg mr-2">
                  <StarIcon className="h-4 w-4 text-white" />
                </div>
                {t('stats.longestExactScoreStreaksAllTime')}
              </h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600 mx-auto"></div>
                    <p className="text-sm text-neutral-500 mt-2">{t('loading')}...</p>
                  </div>
                ) : exactScoreStreaks.length > 0 ? (
                  exactScoreStreaks.map((player, index) => (
                    <div key={player.name} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200/50">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          index === 0 ? 'bg-gradient-to-br from-warm-100 to-warm-200 text-warm-800' :
                          index === 1 ? 'bg-gradient-to-br from-neutral-200 to-neutral-300 text-neutral-800' :
                          index === 2 ? 'bg-gradient-to-br from-accent-100 to-accent-200 text-accent-800' :
                          'bg-gradient-to-br from-primary-100 to-primary-200 text-primary-800'
                        }`}>
                          {index + 1}
                        </span>
                        <img 
                          src={getUserAvatar(player.name, index)} 
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
            <div className="bg-white rounded-2xl shadow-modern border border-neutral-200/50 p-6 lg:col-span-2">
              <h3 className="font-semibold text-neutral-900 mb-4 flex items-center">
                <div className="p-1.5 bg-accent-500 rounded-lg mr-2">
                  <TrophyIcon className="h-4 w-4 text-white" />
                </div>
                {t('stats.mostCompetitionsWon')}
              </h3>
              
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600 mx-auto"></div>
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
                      <div key={winCount} className="border-l-4 border-accent-500 pl-4 py-3 bg-accent-50 rounded-r-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                              groupIndex === 0 ? 'bg-yellow-500 text-white' :
                              groupIndex === 1 ? 'bg-gray-400 text-white' :
                              groupIndex === 2 ? 'bg-orange-500 text-white' :
                              'bg-warm-500 text-white'
                            }`}>
                              {groupIndex + 1}
                            </span>
                            <span className="text-lg font-bold text-neutral-900">
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
                                className="w-8 h-8 rounded-full border-2 border-accent-300"
                              />
                              <div>
                                <div className="font-medium text-neutral-900 text-sm">{player.name}</div>
                                <div className="text-xs text-neutral-500 max-w-48 truncate" title={player.wonCompetitions}>
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
        </div>

        {/* Palmarès Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center">
            <div className="p-2 bg-accent-500 rounded-xl shadow-modern mr-3">
              <TrophyIcon className="h-5 w-5 text-white" />
            </div>
            {t('stats.palmares')}
          </h2>
          
          <div className="bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                <CalendarIcon className="h-5 w-5 text-yellow-600 mr-2" />
                {t('stats.competitionHistoryChampions')}
              </h3>
              <p className="text-sm text-neutral-600 mt-1">{t('stats.completeRecordCompetitions')}</p>
            </div>
            
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
                                    src={getUserAvatar(competition.winner.name, index)} 
                                    alt={competition.winner.name}
                                    className="w-8 h-8 rounded-full mr-3 border-2 border-yellow-400"
                                  />
                                  <div>
                                    <div className="text-sm font-medium text-neutral-900 flex items-center">
                                      {competition.winner.name}
                                      <TrophyIcon className="h-4 w-4 text-yellow-500 ml-2" />
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
                      {leaderboardData.competitions?.filter(comp => comp.status === 'FINISHED').length || 0}
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