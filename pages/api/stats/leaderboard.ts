import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Add interfaces for User, Bet, Competition
interface Bet {
  points: number;
  game: {
    status: string;
    date: Date | string;
    competition: {
      id: string;
      name: string;
      status: string;
      logo: string | null;
    };
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  bets: Bet[];
  stats?: any;
  createdAt: Date;
}

interface Competition {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: string;
  winner?: { id: string };
  logo?: string;
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
      users.map(async (user: User) => {
        let stats = user.stats;
        
        // If no stats record exists, calculate from bets
        if (!stats) {
          const finishedBets = user.bets.filter(bet => bet.game.status === 'FINISHED');
          console.log(`Leaderboard - User ${user.name} bets:`, finishedBets.map(bet => ({
            gameId: bet.game.id,
            status: bet.game.status,
            points: bet.points
          })));

          const totalBets = finishedBets.length;
          const totalPoints = finishedBets.reduce((sum, bet) => sum + bet.points, 0);
          const accuracy = totalBets > 0 ? (totalPoints / (totalBets * 3)) * 100 : 0;
          
          // Calculate actual competition wins (not games with points) - only completed competitions
          const competitionWins = competitions.filter((comp: any) => comp.winner?.id === user.id && comp.status === 'COMPLETED').length;
          
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
          const competitionWins = competitions.filter((comp: any) => comp.winner?.id === user.id && comp.status === 'COMPLETED').length;
          
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
          ? parseFloat((user.stats.totalPoints / user.stats.totalPredictions).toFixed(3))
          : 0
      }))
      .sort((a, b) => b.averagePoints - a.averagePoints)
      .slice(0, 10);

    // Get total user count (excluding admins)
    const totalUsers = usersWithCalculatedStats.length;

    // Add competitions data for Palmarès section with winner's points
    const competitionsData = await Promise.all(
      competitions.map(async (comp: any) => {
        let winnerPoints = 0;
        
        if (comp.winner) {
          // Get winner's bets for this specific competition
          const winnerBets = await prisma.bet.findMany({
            where: {
              userId: comp.winner.id,
              game: {
                competitionId: comp.id
              }
            }
          });
          
          winnerPoints = winnerBets.reduce((sum: number, bet: any) => sum + bet.points, 0);
        }
        
        // Get the actual number of participants for this competition
        const participantCount = await prisma.competitionUser.count({
          where: {
            competitionId: comp.id
          }
        });
        
        // Get the total number of games for this competition
        const gameCount = await prisma.game.count({
          where: {
            competitionId: comp.id
          }
        });
        
        return {
          id: comp.id,
          name: comp.name,
          startDate: comp.startDate,
          endDate: comp.endDate,
          status: comp.status,
          winner: comp.winner,
          winnerPoints,
          participantCount,
          gameCount,
          logo: comp.logo
        };
      })
    );

    // Sort competitions by start date - most recent first (newest at top, oldest at bottom)
    const sortedCompetitions = competitionsData.sort((a, b) => {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

    res.status(200).json({
      topPlayersByPoints,
      topPlayersByAverage,
      totalUsers,
      competitions: sortedCompetitions
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 