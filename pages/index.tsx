import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTranslation } from '../hooks/useTranslation';

export default function Home() {
  const { data: session } = useSession();
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-6">{t('welcome')}</h1>
          <p className="text-xl mb-8">{t('homepage.subtitle')}</p>
          {session ? (
            <Link
              href="/dashboard"
              className="bg-white text-blue-900 px-8 py-3 rounded-full font-semibold hover:bg-blue-100 transition-colors"
            >
              {t('goToDashboard')}
            </Link>
          ) : (
            <Link
              href="/login"
              className="bg-white text-blue-900 px-8 py-3 rounded-full font-semibold hover:bg-blue-100 transition-colors"
            >
              {t('getStarted')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
