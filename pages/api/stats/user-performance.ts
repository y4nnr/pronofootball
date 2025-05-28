import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface BetWithGame {
  game: {
    id: string;
    date: Date;
    homeScore: number | null;
    awayScore: number | null;
    homeTeam: {
      name: string;
      logo: string | null;
    };
    awayTeam: {
      name: string;
      logo: string | null;
    };
    competition: {
      name: string;
    };
  };
  score1: number;
  score2: number;
  points: number;
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

    // Get user's last 10 finished games with bets
    const userBets = await prisma.bet.findMany({
      where: {
        userId: session.user.id,
        game: {
          status: 'FINISHED',
          homeScore: { not: null },
          awayScore: { not: null }
        }
      },
      include: {
        game: {
          include: {
            homeTeam: {
              select: { name: true, logo: true }
            },
            awayTeam: {
              select: { name: true, logo: true }
            },
            competition: {
              select: { name: true }
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

    // Format the response
    const lastGamesPerformance = userBets.map((bet: BetWithGame) => ({
      gameId: bet.game.id,
      date: bet.game.date,
      homeTeam: bet.game.homeTeam.name,
      awayTeam: bet.game.awayTeam.name,
      homeTeamLogo: bet.game.homeTeam.logo,
      awayTeamLogo: bet.game.awayTeam.logo,
      competition: bet.game.competition.name,
      actualScore: `${bet.game.homeScore}-${bet.game.awayScore}`,
      predictedScore: `${bet.score1}-${bet.score2}`,
      points: bet.points,
      result: bet.points === 3 ? 'exact' : bet.points === 1 ? 'correct' : 'wrong'
    }));

    res.status(200).json({ lastGamesPerformance });

  } catch (error) {
    console.error('Error fetching user performance:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 