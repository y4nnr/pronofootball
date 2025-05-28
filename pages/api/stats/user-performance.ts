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

    // NO PERFORMANCE DATA FROM HISTORICAL COMPETITIONS
    // Return empty data until the first real competition is played with this app
    // Historical competitions (Euro 2016, World Cup 2018) are excluded
    const lastGamesPerformance: any[] = [];

    res.status(200).json({ lastGamesPerformance });

  } catch (error) {
    console.error('Error fetching user performance:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 