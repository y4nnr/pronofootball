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

    // Get all competitions to identify real ones and their winners
    const competitions = await prisma.competition.findMany({
      include: {
        winner: true
      }
    });

    // Get all non-admin users with their stats and bets
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
            game: {
              include: {
                competition: true
              }
            }
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
          
          // Calculate actual competition wins (not games with points)
          const competitionWins = competitions.filter((comp: any) => comp.winner?.id === user.id).length;
          
          // NO STREAK CALCULATION FROM HISTORICAL DATA
          // All streaks should be 0 until the first real competition starts
          const longestStreak = 0;
          const exactScoreStreak = 0;
          const longestStreakStart: Date | null = null;
          const longestStreakEnd: Date | null = null;
          const exactStreakStart: Date | null = null;
          const exactStreakEnd: Date | null = null;
          
          stats = {
            totalPredictions: totalBets,
            totalPoints,
            accuracy: Math.round(accuracy * 100) / 100,
            wins: competitionWins, // Fixed: actual competition wins, not games with points
            longestStreak,
            exactScoreStreak,
            longestStreakStart,
            longestStreakEnd,
            exactStreakStart,
            exactStreakEnd
          };
        } else {
          // For existing stats, recalculate competition wins and reset streaks to 0
          const competitionWins = competitions.filter((comp: any) => comp.winner?.id === user.id).length;
          
          // NO STREAK CALCULATION FROM HISTORICAL DATA
          // All streaks should be 0 until the first real competition starts
          const longestStreak = 0;
          const exactScoreStreak = 0;
          const longestStreakStart: Date | null = null;
          const longestStreakEnd: Date | null = null;
          const exactStreakStart: Date | null = null;
          const exactStreakEnd: Date | null = null;

          stats = {
            ...stats,
            wins: competitionWins, // Fixed: actual competition wins
            longestStreak,
            exactScoreStreak,
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

    // Add competitions data for Palmarès section
    const competitionsData = competitions.map((comp: any) => ({
      id: comp.id,
      name: comp.name,
      startDate: comp.startDate,
      endDate: comp.endDate,
      status: comp.status,
      winner: comp.winner,
      logo: comp.logo
    }));

    res.status(200).json({
      topPlayersByPoints,
      topPlayersByAverage,
      totalUsers,
      competitions: competitionsData
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 