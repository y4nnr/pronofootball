import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import { User, UserStats as PrismaUserStats, Competition as PrismaCompetition } from "@prisma/client";

interface UserStats {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  rank: number;
  totalUsers: number;
}

interface Competition {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string;
}

interface NewsItem {
  id: number;
  type: 'achievement' | 'streak' | 'competition' | 'general';
  title: string;
  content: string;
  timestamp: string;
}

interface DashboardData {
  stats: UserStats;
  competitions: Competition[];
  news: NewsItem[];
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
    // Get user stats
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        stats: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user's rank
    const allUsers = await prisma.user.findMany({
      include: {
        stats: true,
      },
    });

    const userRank = allUsers
      .sort((a: UserWithStats, b: UserWithStats) => 
        (b.stats?.totalPoints || 0) - (a.stats?.totalPoints || 0)
      )
      .findIndex((u: UserWithStats) => u.id === user.id) + 1;

    const stats: UserStats = {
      totalPredictions: user.stats?.totalPredictions || 0,
      correctPredictions: Math.round((user.stats?.accuracy || 0) * (user.stats?.totalPredictions || 0) / 100),
      accuracy: user.stats?.accuracy || 0,
      currentStreak: user.stats?.longestStreak || 0,
      bestStreak: user.stats?.longestStreak || 0,
      rank: userRank,
      totalUsers: allUsers.length,
    };

    // Get active competitions
    const competitions = await prisma.competition.findMany({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: 'UPCOMING' },
        ],
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    // Generate news items
    const news: NewsItem[] = [
      {
        id: 1,
        type: 'achievement',
        title: 'Welcome to PronoFootball!',
        content: 'Start making predictions and compete with other users.',
        timestamp: new Date().toISOString(),
      },
      {
        id: 2,
        type: 'competition',
        title: 'Euro 2024 Competition',
        content: 'The Euro 2024 competition is now open for predictions.',
        timestamp: new Date().toISOString(),
      },
    ];

    return res.status(200).json({
      stats,
      competitions: competitions.map((competition: PrismaCompetition) => ({
        ...competition,
        startDate: competition.startDate.toISOString(),
        endDate: competition.endDate.toISOString(),
      })),
      news,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 