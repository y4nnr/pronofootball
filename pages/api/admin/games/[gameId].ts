import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role.toLowerCase() !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { gameId } = req.query;
  if (!gameId || typeof gameId !== 'string') {
    return res.status(400).json({ error: 'Invalid game ID' });
  }

  if (req.method === 'PUT') {
    const { homeTeamId, awayTeamId, date, homeScore, awayScore } = req.body;
    if (!homeTeamId || !awayTeamId || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
      const updatedGame = await prisma.game.update({
        where: { id: gameId },
        data: {
          homeTeamId,
          awayTeamId,
          date: new Date(date),
          homeScore: homeScore !== undefined ? homeScore : null,
          awayScore: awayScore !== undefined ? awayScore : null,
        },
      });
      return res.status(200).json(updatedGame);
    } catch (error) {
      console.error('Error updating game:', error);
      return res.status(500).json({ error: 'Failed to update game' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.game.delete({ where: { id: gameId } });
      return res.status(200).json({ message: 'Game deleted' });
    } catch (error) {
      console.error('Error deleting game:', error);
      return res.status(500).json({ error: 'Failed to delete game' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 