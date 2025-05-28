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

    // Get current user with their stats and bets
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        stats: true,
        bets: {
          include: {
            game: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate stats from bets if no UserStats record exists
    let stats = user.stats;
    
    if (!stats) {
      const totalBets = user.bets.length;
      const totalPoints = user.bets.reduce((sum: number, bet: any) => sum + bet.points, 0);
      const accuracy = totalBets > 0 ? (totalPoints / (totalBets * 3)) * 100 : 0;
      const wins = user.bets.filter((bet: any) => bet.points > 0).length;
      
      // Calculate longest streak
      let longestStreak = 0;
      let currentStreak = 0;
      const sortedBets = user.bets
        .filter((bet: any) => bet.game.status === 'FINISHED')
        .sort((a: any, b: any) => new Date(a.game.date).getTime() - new Date(b.game.date).getTime());
      
      for (const bet of sortedBets) {
        if (bet.points > 0) {
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }

      // Calculate exact score streak
      let exactScoreStreak = 0;
      let currentExactStreak = 0;
      for (const bet of sortedBets) {
        if (bet.points === 3) {
          currentExactStreak++;
          exactScoreStreak = Math.max(exactScoreStreak, currentExactStreak);
        } else {
          currentExactStreak = 0;
        }
      }

      stats = {
        totalPredictions: totalBets,
        totalPoints,
        accuracy: Math.round(accuracy * 100) / 100,
        wins,
        longestStreak,
        exactScoreStreak
      };
    }

    // Get user's ranking among all users (including admins for this calculation)
    const allUsers = await prisma.user.findMany({
      include: {
        bets: true
      }
    });

    const userRankings = allUsers
      .map((u: any) => ({
        id: u.id,
        totalPoints: u.bets.reduce((sum: number, bet: any) => sum + bet.points, 0)
      }))
      .sort((a: any, b: any) => b.totalPoints - a.totalPoints);

    const ranking = userRankings.findIndex((u: any) => u.id === user.id) + 1;
    const averagePoints = stats.totalPredictions > 0 
      ? Math.round((stats.totalPoints / stats.totalPredictions) * 100) / 100
      : 0;

    const currentUserStats = {
      totalPoints: stats.totalPoints,
      totalPredictions: stats.totalPredictions,
      accuracy: stats.accuracy,
      longestStreak: stats.longestStreak,
      exactScoreStreak: stats.exactScoreStreak,
      wins: stats.wins,
      ranking,
      averagePoints
    };

    res.status(200).json(currentUserStats);

  } catch (error) {
    console.error('Error fetching current user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 