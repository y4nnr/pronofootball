import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession({ req });
    if (!session || !session.user || (session.user as any).role?.toLowerCase() !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { betId } = req.query;

    if (!betId || typeof betId !== 'string') {
      return res.status(400).json({ error: 'Bet ID is required' });
    }

    if (req.method === 'PUT') {
      // Update bet
      const { score1, score2 } = req.body;

      if (typeof score1 !== 'number' || typeof score2 !== 'number') {
        return res.status(400).json({ error: 'Valid scores are required' });
      }

      if (score1 < 0 || score2 < 0) {
        return res.status(400).json({ error: 'Scores cannot be negative' });
      }

      // Check if bet exists
      const existingBet = await prisma.bet.findUnique({
        where: { id: betId },
        include: {
          game: true,
        },
      });

      if (!existingBet) {
        return res.status(404).json({ error: 'Bet not found' });
      }

      // Update the bet
      const updatedBet = await prisma.bet.update({
        where: { id: betId },
        data: {
          score1: score1,
          score2: score2,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Recalculate points if the game is finished
      if (existingBet.game.status === 'FINISHED' && 
          existingBet.game.homeScore !== null && 
          existingBet.game.awayScore !== null) {
        
        let points = 0;
        
        // Exact score = 3 points
        if (score1 === existingBet.game.homeScore && score2 === existingBet.game.awayScore) {
          points = 3;
        }
        // Correct result (win/draw/loss) = 1 point
        else {
          const actualResult = existingBet.game.homeScore > existingBet.game.awayScore ? 'home' :
                              existingBet.game.homeScore < existingBet.game.awayScore ? 'away' : 'draw';
          const predictedResult = score1 > score2 ? 'home' :
                                 score1 < score2 ? 'away' : 'draw';
          
          if (actualResult === predictedResult) {
            points = 1;
          }
        }

        // Update points
        await prisma.bet.update({
          where: { id: betId },
          data: { points },
        });
      }

      return res.status(200).json({ message: 'Bet updated successfully', bet: updatedBet });

    } else if (req.method === 'DELETE') {
      // Delete bet
      const existingBet = await prisma.bet.findUnique({
        where: { id: betId },
      });

      if (!existingBet) {
        return res.status(404).json({ error: 'Bet not found' });
      }

      await prisma.bet.delete({
        where: { id: betId },
      });

      return res.status(200).json({ message: 'Bet deleted successfully' });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error in bet management:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 