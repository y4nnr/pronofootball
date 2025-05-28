import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all non-admin users with their stats
    const users = await prisma.user.findMany({
      where: {
        role: {
          not: 'admin'
        }
      },
      include: {
        stats: true,
        bets: {
          include: {
            game: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Calculate stats for users who don't have UserStats records yet
    const usersWithCalculatedStats = await Promise.all(
      users.map(async (user: any) => {
        let stats = user.stats;
        
        // If no stats record exists, calculate from bets
        if (!stats) {
          const totalBets = user.bets.length;
          const totalPoints = user.bets.reduce((sum: number, bet: any) => sum + bet.points, 0);
          const accuracy = totalBets > 0 ? (totalPoints / (totalBets * 3)) * 100 : 0;
          const wins = user.bets.filter((bet: any) => bet.points > 0).length;
          
          // Calculate longest streak with dates
          let longestStreak = 0;
          let currentStreak = 0;
          let longestStreakStart: Date | null = null;
          let longestStreakEnd: Date | null = null;
          let currentStreakStart: Date | null = null;
          
          const sortedBets = user.bets
            .filter((bet: any) => bet.game.status === 'FINISHED')
            .sort((a: any, b: any) => new Date(a.game.date).getTime() - new Date(b.game.date).getTime());
          
          for (const bet of sortedBets) {
            if (bet.points > 0) {
              if (currentStreak === 0) {
                currentStreakStart = bet.game.date;
              }
              currentStreak++;
              
              if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
                longestStreakStart = currentStreakStart;
                longestStreakEnd = bet.game.date;
              }
            } else {
              currentStreak = 0;
              currentStreakStart = null;
            }
          }

          // Calculate exact score streak with dates
          let exactScoreStreak = 0;
          let currentExactStreak = 0;
          let exactStreakStart: Date | null = null;
          let exactStreakEnd: Date | null = null;
          let currentExactStreakStart: Date | null = null;
          
          for (const bet of sortedBets) {
            if (bet.points === 3) {
              if (currentExactStreak === 0) {
                currentExactStreakStart = bet.game.date;
              }
              currentExactStreak++;
              
              if (currentExactStreak > exactScoreStreak) {
                exactScoreStreak = currentExactStreak;
                exactStreakStart = currentExactStreakStart;
                exactStreakEnd = bet.game.date;
              }
            } else {
              currentExactStreak = 0;
              currentExactStreakStart = null;
            }
          }

          stats = {
            totalPredictions: totalBets,
            totalPoints,
            accuracy: Math.round(accuracy * 100) / 100,
            wins,
            longestStreak,
            exactScoreStreak,
            longestStreakStart,
            longestStreakEnd,
            exactStreakStart,
            exactStreakEnd
          };
        } else {
          // For existing stats, calculate streak dates from bets
          const sortedBets = user.bets
            .filter((bet: any) => bet.game.status === 'FINISHED')
            .sort((a: any, b: any) => new Date(a.game.date).getTime() - new Date(b.game.date).getTime());
          
          // Find longest streak dates
          let longestStreak = 0;
          let currentStreak = 0;
          let longestStreakStart: Date | null = null;
          let longestStreakEnd: Date | null = null;
          let currentStreakStart: Date | null = null;
          
          for (const bet of sortedBets) {
            if (bet.points > 0) {
              if (currentStreak === 0) {
                currentStreakStart = bet.game.date;
              }
              currentStreak++;
              
              if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
                longestStreakStart = currentStreakStart;
                longestStreakEnd = bet.game.date;
              }
            } else {
              currentStreak = 0;
              currentStreakStart = null;
            }
          }

          // Find exact score streak dates
          let exactScoreStreak = 0;
          let currentExactStreak = 0;
          let exactStreakStart: Date | null = null;
          let exactStreakEnd: Date | null = null;
          let currentExactStreakStart: Date | null = null;
          
          for (const bet of sortedBets) {
            if (bet.points === 3) {
              if (currentExactStreak === 0) {
                currentExactStreakStart = bet.game.date;
              }
              currentExactStreak++;
              
              if (currentExactStreak > exactScoreStreak) {
                exactScoreStreak = currentExactStreak;
                exactStreakStart = currentExactStreakStart;
                exactStreakEnd = bet.game.date;
              }
            } else {
              currentExactStreak = 0;
              currentExactStreakStart = null;
            }
          }

          stats = {
            ...stats,
            longestStreakStart,
            longestStreakEnd,
            exactStreakStart,
            exactStreakEnd
          };
        }

        // Generate avatar initials
        const nameParts = user.name.split(' ');
        const avatar = nameParts.length > 1 
          ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
          : user.name.substring(0, 2).toUpperCase();

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar,
          stats,
          createdAt: user.createdAt
        };
      })
    );

    // Sort by total points for leaderboard
    const topPlayersByPoints = usersWithCalculatedStats
      .filter(user => user.stats.totalPredictions > 0)
      .sort((a, b) => b.stats.totalPoints - a.stats.totalPoints)
      .slice(0, 10);

    // Sort by average points (minimum 5 games)
    const topPlayersByAverage = usersWithCalculatedStats
      .filter(user => user.stats.totalPredictions >= 5)
      .map(user => ({
        ...user,
        averagePoints: user.stats.totalPredictions > 0 
          ? Math.round((user.stats.totalPoints / user.stats.totalPredictions) * 100) / 100
          : 0
      }))
      .sort((a, b) => b.averagePoints - a.averagePoints)
      .slice(0, 10);

    // Get total user count (excluding admins)
    const totalUsers = usersWithCalculatedStats.length;

    res.status(200).json({
      topPlayersByPoints,
      topPlayersByAverage,
      totalUsers
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 