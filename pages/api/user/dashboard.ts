import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import { User, UserStats as PrismaUserStats, Competition as PrismaCompetition } from "@prisma/client";

interface UserStats {
  totalPredictions: number;
  totalPoints: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  rank: number;
  totalUsers: number;
  averagePointsPerGame: number;
  competitionsWon: number;
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
  runningTotal: number;
}

interface Competition {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string;
  logo?: string | null;
  userRanking?: number;
  totalParticipants?: number;
  userPoints?: number;
  remainingGames?: number;
}

interface DashboardData {
  stats: UserStats;
  competitions: Competition[];
  lastGamesPerformance: LastGamePerformance[];
}

type UserWithStats = User & {
  stats: PrismaUserStats | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardData | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Get user with all bets for live calculation
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Calculate stats from actual bets (live calculation like stats page)
    const totalBets = user.bets.length;
    const totalPoints = user.bets.reduce((sum, bet) => sum + bet.points, 0);
    const accuracy = totalBets > 0 ? (totalPoints / (totalBets * 3)) * 100 : 0;
    
    // Calculate actual competition wins - only finished competitions
    const competitions = await prisma.competition.findMany({
      where: { 
        winnerId: user.id,
        status: 'FINISHED'
      }
    });
    const competitionsWon = competitions.length;

    // Get user's all-time ranking among all users
    const allUsers = await prisma.user.findMany({
      include: {
        bets: true
      }
    });

    const userRankings = allUsers
      .map((u) => ({
        id: u.id,
        totalPoints: u.bets.reduce((sum, bet) => sum + bet.points, 0)
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    const userRank = userRankings.findIndex((u) => u.id === user.id) + 1;

    // Calculate average points per game
    const averagePointsPerGame = totalBets > 0 
      ? parseFloat((totalPoints / totalBets).toFixed(3))
      : 0;

    const stats: UserStats = {
      totalPredictions: totalBets,
      totalPoints: totalPoints,
      accuracy: Math.round(accuracy * 100) / 100,
      currentStreak: user.stats?.longestStreak || 0,
      bestStreak: user.stats?.longestStreak || 0,
      rank: userRank,
      totalUsers: allUsers.length,
      averagePointsPerGame,
      competitionsWon: competitionsWon,
    };

    // Get last 10 games performance - DISABLE for now until real betting starts
    // Set impossible future date to exclude ALL existing data
    const cutoffDate = new Date('2030-01-01'); // Impossible future date - no data should match
    console.log('Dashboard API - Cutoff date:', cutoffDate);
    
    const lastGamesPerformance = await prisma.bet.findMany({
      where: {
        userId: user.id,
        game: {
          status: 'FINISHED'
        },
        // Only include bets created after the cutoff date (real user bets only)
        createdAt: { gte: cutoffDate }
      },
      include: {
        game: {
          include: {
            homeTeam: {
              select: {
                name: true,
                logo: true
              }
            },
            awayTeam: {
              select: {
                name: true,
                logo: true
              }
            },
            competition: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        game: {
          date: 'desc'
        }
      },
      take: 10
    });

    console.log('Dashboard API - Found games:', lastGamesPerformance.length);
    console.log('Dashboard API - Games data:', lastGamesPerformance.map(bet => ({
      gameId: bet.game.id,
      createdAt: bet.createdAt,
      points: bet.points
    })));

    // Process games and calculate running totals
    const gamesForRunningTotal = lastGamesPerformance.map(bet => {
      const game = bet.game;
      const actualScore = `${game.homeScore}-${game.awayScore}`;
      const predictedScore = `${bet.score1}-${bet.score2}`;
      
      let result: 'exact' | 'correct' | 'wrong' = 'wrong';
      let gamePoints = 0;
      
      if (bet.score1 === game.homeScore && bet.score2 === game.awayScore) {
        result = 'exact';
        gamePoints = 3;
      } else if (
        game.homeScore !== null && game.awayScore !== null && (
          (bet.score1 > bet.score2 && game.homeScore > game.awayScore) ||
          (bet.score1 < bet.score2 && game.homeScore < game.awayScore) ||
          (bet.score1 === bet.score2 && game.homeScore === game.awayScore)
        )
      ) {
        result = 'correct';
        gamePoints = 1;
      }
      
      return {
        gameId: game.id,
        date: game.date.toISOString(),
        homeTeam: game.homeTeam.name,
        awayTeam: game.awayTeam.name,
        homeTeamLogo: game.homeTeam.logo,
        awayTeamLogo: game.awayTeam.logo,
        competition: game.competition.name,
        actualScore,
        predictedScore,
        points: gamePoints,
        result,
        runningTotal: 0,
        gameDate: game.date
      };
    }).reverse(); // Reverse to calculate running total from oldest to newest

    // Calculate running totals from oldest to newest
    gamesForRunningTotal.forEach((game, index) => {
      if (index === 0) {
        game.runningTotal = game.points;
      } else {
        game.runningTotal = gamesForRunningTotal[index - 1].runningTotal + game.points;
      }
    });

    // Reverse back to show newest first and remove the temporary gameDate field
    const formattedLastGames: LastGamePerformance[] = gamesForRunningTotal
      .reverse()
      .map(({ gameDate, ...game }) => game);

    // Get active competitions with user ranking
    const activeCompetitions = await prisma.competition.findMany({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: 'active' },
          { status: 'UPCOMING' },
        ],
      },
      include: {
        users: {
          include: {
            user: {
              include: {
                bets: {
                  where: {
                    game: {
                      competitionId: { in: [] } // We'll fix this below
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    const competitionsWithRanking: Competition[] = await Promise.all(
      activeCompetitions.map(async (competition) => {
        // Get all users in this competition with their bets for this specific competition
        const competitionUsersWithBets = await Promise.all(
          competition.users.map(async (cu) => {
            const userBetsForCompetition = await prisma.bet.findMany({
              where: {
                userId: cu.user.id,
                game: {
                  competitionId: competition.id
                }
              }
            });
            
            const competitionPoints = userBetsForCompetition.reduce((sum, bet) => sum + bet.points, 0);
            
            return {
              ...cu.user,
              competitionPoints
            };
          })
        );
        
        // Calculate user's ranking in this competition
        const userInCompetition = competitionUsersWithBets.find(u => u.id === user.id);
        let userRanking: number | undefined;
        let userPoints: number | undefined;
        
        if (userInCompetition) {
          const sortedUsers = competitionUsersWithBets.sort((a, b) => 
            b.competitionPoints - a.competitionPoints
          );
          userRanking = sortedUsers.findIndex(u => u.id === user.id) + 1;
          userPoints = userInCompetition.competitionPoints;
        }

        // Calculate remaining games in this competition
        const remainingGames = await prisma.game.count({
          where: {
            competitionId: competition.id,
            status: 'UPCOMING'
          }
        });

        return {
          id: competition.id,
          name: competition.name,
          description: competition.description,
          startDate: competition.startDate.toISOString(),
          endDate: competition.endDate.toISOString(),
          status: competition.status,
          logo: competition.logo,
          userRanking,
          totalParticipants: competition.users.length,
          userPoints,
          remainingGames,
        };
      })
    );

    return res.status(200).json({
      stats,
      competitions: competitionsWithRanking,
      lastGamesPerformance: formattedLastGames,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 