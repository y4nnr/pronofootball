import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'POST':
      return handlePost(req, res, session);
    case 'PUT':
      return handlePut(req, res, session);
    default:
      res.setHeader('Allow', ['POST', 'PUT']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const { gameId, score1, score2 } = req.body;

    if (!gameId || score1 === undefined || score2 === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if game exists and is upcoming
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { date: true, status: true }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'UPCOMING') {
      return res.status(400).json({ error: 'Cannot place bet on non-upcoming game' });
    }

    if (new Date(game.date) <= new Date()) {
      return res.status(400).json({ error: 'Cannot place bet on past or current game' });
    }

    // Check if user already has a bet for this game
    const existingBet = await prisma.bet.findFirst({
      where: {
        gameId,
        userId: session.user.id
      }
    });

    let bet;
    if (existingBet) {
      // Update existing bet
      bet = await prisma.bet.update({
        where: { id: existingBet.id },
        data: {
          score1,
          score2
        }
      });
    } else {
      // Create new bet
      bet = await prisma.bet.create({
        data: {
          gameId,
          userId: session.user.id,
          score1,
          score2
        }
      });
    }

    return res.status(200).json(bet);
  } catch (error) {
    console.error('Error handling bet:', error);
    return res.status(500).json({ error: 'Failed to save bet' });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const { gameId, score1, score2 } = req.body;

    if (!gameId || score1 === undefined || score2 === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if game exists and is upcoming
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { date: true, status: true }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'UPCOMING') {
      return res.status(400).json({ error: 'Cannot update bet on non-upcoming game' });
    }

    if (new Date(game.date) <= new Date()) {
      return res.status(400).json({ error: 'Cannot update bet on past or current game' });
    }

    // Find and update the bet
    const bet = await prisma.bet.findFirst({
      where: {
        gameId,
        userId: session.user.id
      }
    });

    if (!bet) {
      return res.status(404).json({ error: 'Bet not found' });
    }

    const updatedBet = await prisma.bet.update({
      where: { id: bet.id },
      data: {
        score1,
        score2
      }
    });

    return res.status(200).json(updatedBet);
  } catch (error) {
    console.error('Error updating bet:', error);
    return res.status(500).json({ error: 'Failed to update bet' });
  }
} 