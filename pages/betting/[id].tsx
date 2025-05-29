import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { prisma } from '@lib/prisma';
import { useTranslation } from '../../hooks/useTranslation';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

interface Game {
  id: string;
  date: string;
  status: string;
  homeTeam: {
    id: string;
    name: string;
    logo?: string;
  };
  awayTeam: {
    id: string;
    name: string;
    logo?: string;
  };
  competition: {
    id: string;
    name: string;
  };
}

interface BettingPageProps {
  game: Game;
}

export default function BettingPage({ game }: BettingPageProps) {
  const { t } = useTranslation('common');
  const { data: session, status } = useSession();
  const router = useRouter();
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existingBet, setExistingBet] = useState<{ score1: number; score2: number } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchExistingBet = async () => {
      try {
        const response = await fetch(`/api/bets/${game.id}`);
        const data = await response.json();
        if (response.ok && data) {
          setExistingBet(data);
          setHomeScore(data.score1.toString());
          setAwayScore(data.score2.toString());
        }
      } catch (err) {
        console.error('Error fetching existing bet:', err);
      }
    };

    if (status === 'authenticated') {
      fetchExistingBet();
    }
  }, [game.id, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/bets', {
        method: existingBet ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          score1: parseInt(homeScore),
          score2: parseInt(awayScore)
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      router.push(`/competitions/${game.competition.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('betting.failedToPlaceBet'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {t('betting.placeYourBet')}
              </h1>
              <p className="text-gray-500">
                {game.competition.name} - {new Date(game.date).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                {game.homeTeam.logo && (
                  <img
                    src={game.homeTeam.logo}
                    alt={game.homeTeam.name}
                    className="w-12 h-12 object-contain"
                  />
                )}
                <span className="text-lg font-medium">{game.homeTeam.name}</span>
              </div>
              <div className="text-gray-500">{t('betting.vs')}</div>
              <div className="flex items-center space-x-4">
                <span className="text-lg font-medium">{game.awayTeam.name}</span>
                {game.awayTeam.logo && (
                  <img
                    src={game.awayTeam.logo}
                    alt={game.awayTeam.name}
                    className="w-12 h-12 object-contain"
                  />
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between space-x-4">
                <div className="flex-1">
                  <label htmlFor="homeScore" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('betting.homeScore', { team: game.homeTeam.name })}
                  </label>
                  <input
                    type="number"
                    id="homeScore"
                    min="0"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="awayScore" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('betting.awayScore', { team: game.awayTeam.name })}
                  </label>
                  <input
                    type="number"
                    id="awayScore"
                    min="0"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.push(`/competitions/${game.competition.id}`)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t('betting.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? 
                    (existingBet ? t('betting.updatingBet') : t('betting.placingBet')) : 
                    (existingBet ? t('betting.updateBet') : t('betting.placeBet'))
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const gameId = context.params?.id as string;

  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        },
        competition: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!game) {
      return {
        notFound: true
      };
    }

    // Check if betting is allowed for this game
    if (game.status !== 'UPCOMING') {
      return {
        redirect: {
          destination: '/competitions',
          permanent: false,
        },
      };
    }

    return {
      props: {
        game: JSON.parse(JSON.stringify(game)),
        ...(await serverSideTranslations(context.locale || 'en', ['common']))
      }
    };
  } catch (error) {
    console.error('Error fetching game:', error);
    return {
      notFound: true
    };
  }
}; 