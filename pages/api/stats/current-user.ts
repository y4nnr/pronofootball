import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define Bet interface for type safety
interface Bet {
  points: number;
  game: {
    status: string;
    date: Date | string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  bets: Bet[];
  stats?: any;
}

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

    let calculatedStats;
    
    if (!user.stats) {
      const finishedBets = user.bets.filter(bet => bet.game.status === 'FINISHED');
      const totalBets = finishedBets.length;
      const totalPoints = finishedBets.reduce((sum: number, bet: Bet) => sum + bet.points, 0);
      const accuracy = totalBets > 0 ? (totalPoints / (totalBets * 3)) * 100 : 0;
      
      // Calculate actual competition wins (consistent with leaderboard API) - only completed competitions
      const competitions = await prisma.competition.findMany({
        where: { 
          winnerId: user.id,
          status: 'COMPLETED'
        }
      });
      const wins = competitions.length;
      
      // Calculate longest streak
      let longestStreak = 0;
      let currentStreak = 0;
      const sortedBets = finishedBets
        .sort((a: Bet, b: Bet) => new Date(a.game.date).getTime() - new Date(b.game.date).getTime());
      
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

      calculatedStats = {
        totalPredictions: totalBets,
        totalPoints,
        accuracy: Math.round(accuracy * 100) / 100,
        wins,
        longestStreak,
        exactScoreStreak
      };
    } else {
      calculatedStats = {
        totalPredictions: user.stats.totalPredictions,
        totalPoints: user.stats.totalPoints,
        accuracy: user.stats.accuracy,
        wins: user.stats.wins,
        longestStreak: user.stats.longestStreak,
        exactScoreStreak: user.stats.exactScoreStreak
      };
    }

    // Get user's ranking among all users (including admins for this calculation)
    const allUsers = await prisma.user.findMany({
      include: {
        bets: true
      }
    });

    const userRankings = allUsers
      .map((u) => ({
        id: u.id,
        totalPoints: u.bets.reduce((sum: number, bet: { points: number }) => sum + bet.points, 0)
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    const ranking = userRankings.findIndex((u) => u.id === user.id) + 1;
    const averagePoints = calculatedStats.totalPredictions > 0 
      ? parseFloat((calculatedStats.totalPoints / calculatedStats.totalPredictions).toFixed(2))
      : 0;

    const currentUserStats = {
      totalPoints: calculatedStats.totalPoints,
      totalPredictions: calculatedStats.totalPredictions,
      accuracy: calculatedStats.accuracy,
      longestStreak: calculatedStats.longestStreak,
      exactScoreStreak: calculatedStats.exactScoreStreak,
      wins: calculatedStats.wins,
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
