import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback, memo, useMemo } from "react";
import Image from 'next/image';
import { useTranslation } from '../hooks/useTranslation';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { useLanguage } from '../contexts/LanguageContext';
import { HomeIcon } from '@heroicons/react/24/outline';

type UserStats = {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  rank: number;
  totalUsers: number;
};

interface Competition {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  imageUrl: string;
}

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string;
};

const StatsSection = memo(({ stats, t }: { stats: UserStats | null; t: (key: string) => string }) => (
  <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
    <h2 className="text-xl font-semibold mb-4 text-gray-900">{t('dashboard.stats.title')}</h2>
    {stats ? (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">{t('dashboard.stats.totalPredictions')}</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalPredictions}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">{t('dashboard.stats.accuracy')}</p>
          <p className="text-2xl font-bold text-gray-900">{stats.accuracy.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">{t('dashboard.stats.currentStreak')}</p>
          <p className="text-2xl font-bold text-gray-900">{stats.currentStreak}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">{t('dashboard.stats.rank')}</p>
          <p className="text-2xl font-bold text-gray-900">#{stats.rank}</p>
        </div>
      </div>
    ) : (
      <p className="text-gray-500">{t('dashboard.stats.noStats')}</p>
    )}
  </div>
));

StatsSection.displayName = 'StatsSection';

const CompetitionsSection = memo(({ competitions, t }: { competitions: Competition[]; t: (key: string) => string }) => (
  <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
    <h2 className="text-xl font-semibold mb-4 text-gray-900">{t('dashboard.competitions.title')}</h2>
    {competitions && competitions.length > 0 ? (
      <div className="space-y-4">
        {competitions.map((competition) => (
          <div key={competition.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
            <h3 className="font-medium text-gray-900">{competition.name}</h3>
            <p className="text-sm text-gray-600">{competition.description}</p>
            <div className="mt-2 text-sm text-gray-500">
              <p>{t('dashboard.competitions.start')}: {new Date(competition.startDate).toLocaleDateString()}</p>
              <p>{t('dashboard.competitions.end')}: {new Date(competition.endDate).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-gray-500">{t('dashboard.competitions.noCompetitions')}</p>
    )}
  </div>
));

CompetitionsSection.displayName = 'CompetitionsSection';

const NewsItem = memo(({ item, t, locale }: { item: NewsItem; t: (key: string) => string; locale: string }) => {
  // Pre-compute all values that depend on translations and locale
  const { title, content, formattedDate } = useMemo(() => {
    const translationKey = item.id === '1' ? 'welcome' : 
      item.id === '2' ? 'euro2024' :
      item.id === '3' ? 'newFeature' :
      item.id === '4' ? 'maintenance' : 'welcome';

    return {
      title: t(`dashboard.news.${translationKey}.title`),
      content: t(`dashboard.news.${translationKey}.content`),
      formattedDate: new Date(item.date).toLocaleDateString(locale || 'en', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
  }, [item.id, item.date, t, locale]);

  // Determine if we should show the actual image or the SVG placeholder
  const showActualImage = item.imageUrl && item.imageUrl !== '';

  return (
    <div className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-medium overflow-hidden">
          {showActualImage ? (
            <Image
              src={item.imageUrl}
              alt={title}
              width={48}
              height={48}
              className="rounded-full"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="24" fill="#F3F4F6"/>
              <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#6B7280">News</text>
            </svg>
          )}
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{content}</p>
          <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
        </div>
      </div>
    </div>
  );
});

NewsItem.displayName = 'NewsItem';

const NewsSection = memo(({ news, t, locale }: { news: NewsItem[]; t: (key: string) => string; locale: string }) => {
  // Pre-compute all static content
  const { title, noNewsText } = useMemo(() => ({
    title: t('dashboard.news.title'),
    noNewsText: t('dashboard.news.noNews')
  }), [t]);

  // Pre-compute the news items list with stable keys
  const newsItems = useMemo(() => 
    news.map((item) => (
      <NewsItem 
        key={`news-${item.id}`} 
        item={item} 
        t={t} 
        locale={locale} 
      />
    )),
    [news, t, locale] // Dependencies for recomputing newsItems
  );

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6 lg:col-span-2">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">{title}</h2>
      {news && news.length > 0 ? (
        <div className="space-y-4">
          {newsItems}
        </div>
      ) : (
        <p className="text-gray-500">{noNewsText}</p>
      )}
    </div>
  );
});

NewsSection.displayName = 'NewsSection';

const WelcomeHeader = memo(({ session, t }: { session: any; t: (key: string) => string }) => {
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  // Fetch user profile picture separately
  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/user/profile-picture')
        .then(res => res.json())
        .then(data => {
          if (data.profilePictureUrl) {
            setProfilePictureUrl(data.profilePictureUrl);
          }
        })
        .catch(err => console.error('Failed to fetch profile picture:', err));
    }
  }, [session?.user?.id]);

  return (
    <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-800 rounded-2xl shadow-lg p-8 mb-8 flex items-center space-x-6">
      <Image
        src={profilePictureUrl || (session.user as SessionUser).image || "https://i.pravatar.cc/150"}
        alt="Profile"
        className="h-20 w-20 rounded-full border-4 border-white shadow"
        width={80}
        height={80}
      />
      <div>
        <h1 className="text-3xl font-extrabold text-white mb-1">
          {t('dashboard.welcome')}, <span className="text-indigo-200">{session.user?.name}!</span>
        </h1>
        <p className="text-lg text-indigo-100">{t('dashboard.overview')}</p>
      </div>
    </div>
  );
});

WelcomeHeader.displayName = 'WelcomeHeader';

const AdminSection = memo(({ t }: { t: (key: string) => string }) => (
  <div className="bg-white rounded-lg shadow p-6 mb-6 border-2 border-blue-500">
    <div className="flex items-center mb-6">
      <svg className="h-8 w-8 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <h2 className="text-2xl font-bold text-blue-900">{t('dashboard.admin.title')}</h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Link
        href="/admin/competitions"
        className="flex items-center p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
      >
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="font-medium text-blue-900">{t('dashboard.admin.manageCompetitions')}</h3>
          </div>
          <p className="text-sm text-blue-700">{t('dashboard.admin.manageCompetitionsDesc')}</p>
        </div>
      </Link>
      <Link
        href="/admin/users"
        className="flex items-center p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
      >
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <svg className="h-6 w-6 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="font-medium text-purple-900">{t('dashboard.admin.manageUsers')}</h3>
          </div>
          <p className="text-sm text-purple-700">{t('dashboard.admin.manageUsersDesc')}</p>
        </div>
      </Link>
      <Link
        href="/admin/teams"
        className="flex items-center p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
      >
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <svg className="h-6 w-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="font-medium text-green-900">{t('dashboard.admin.manageTeams')}</h3>
          </div>
          <p className="text-sm text-green-700">{t('dashboard.admin.manageTeamsDesc')}</p>
        </div>
      </Link>
    </div>
  </div>
));

AdminSection.displayName = 'AdminSection';

const NavigationLinks = memo(({ userRole, ongoingCompetition }: { userRole: string; ongoingCompetition: Competition | null }) => {
  const { t } = useTranslation('common');

  const links = useMemo(() => {
    let commonLinks = [
      { href: '/competitions', label: t('dashboard.nav.competitions') },
      { href: '/stats', label: t('dashboard.nav.stats') },
      { href: '/profile', label: t('dashboard.nav.profile') }
    ];

    // Add ongoing competition link if exists and user is not admin
    if (ongoingCompetition && userRole !== 'admin') {
      commonLinks = [
        { href: `/competitions/${ongoingCompetition.id}`, label: `${t('dashboard.nav.ongoingCompetition')} - ${ongoingCompetition.name}` },
        ...commonLinks
      ];
    }

    if (userRole === 'admin') {
      // Remove the games link if it exists (for safety, in case it was there)
      return [
        ...commonLinks.filter(link => link.href !== '/admin/games'),
        { href: '/admin/config', label: t('dashboard.nav.adminConfig') }
      ];
    }

    return commonLinks;
  }, [userRole, ongoingCompetition, t]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">{t('dashboard.nav.title')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-300"
          >
            <span className="text-gray-900">{link.label}</span>
            <svg
              className="ml-2 h-5 w-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
});

NavigationLinks.displayName = 'NavigationLinks';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, locale } = useTranslation('common');
  const { language } = useLanguage();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [ongoingCompetition, setOngoingCompetition] = useState<Competition | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const translations = {
    fr: {
      title: 'Tableau de Bord',
      loading: 'Chargement...',
      error: 'Erreur',
      live: 'EN DIRECT',
      yourPrediction: 'Votre Pronostic',
      allPredictions: 'Tous les Pronostics',
      otherPredictions: 'Autres Pronostics'
    },
    en: {
      title: 'Dashboard',
      loading: 'Loading...',
      error: 'Error',
      live: 'LIVE',
      yourPrediction: 'Your Prediction',
      allPredictions: 'All Predictions',
      otherPredictions: 'Other Predictions'
    }
  };

  const fetchDashboardData = useCallback(async () => {
    console.log('fetchDashboardData called');
    try {
      const response = await fetch('/api/user/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const data = await response.json();

      // Only update state if data has changed to prevent unnecessary re-renders
      setStats(prevStats => JSON.stringify(prevStats) !== JSON.stringify(data.stats) ? data.stats : prevStats);
      const fetchedCompetitions = data.competitions || [];
      setCompetitions(prevCompetitions => JSON.stringify(prevCompetitions) !== JSON.stringify(fetchedCompetitions) ? fetchedCompetitions : prevCompetitions);

      // Find the first active competition
      const activeComp = fetchedCompetitions.find((comp: Competition) => comp.status === 'Active');
      setOngoingCompetition(activeComp || null);

      setNews(prevNews => JSON.stringify(prevNews) !== JSON.stringify(data.news || []) ? data.news || [] : prevNews);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
      console.log('fetchDashboardData finished');
    }
  }, []);

  useEffect(() => {
    console.log('Dashboard status changed:', status);
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    console.log('Dashboard: status or fetchDashboardData changed', { status, fetchDashboardData });
    if (status === 'authenticated') {
      console.log('Dashboard: Fetching dashboard data...');
      fetchDashboardData();
    }
  }, [status, fetchDashboardData]);

  // Memoize section props
  const statsSectionProps = useMemo(() => ({
    stats,
    t
  }), [stats, t]);

  const competitionsSectionProps = useMemo(() => ({
    competitions,
    t
  }), [competitions, t]);

  const newsSectionProps = useMemo(() => ({
    news,
    t,
    locale: locale || 'en'
  }), [news, t, locale]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">{translations[language].loading}</div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{translations[language].error}</div>;
  }

  if (!session) {
    return null;
  }

  // Explicitly check for admin role
  const userRole = (session.user as SessionUser).role;
  const isAdmin = userRole?.toLowerCase() === 'admin';

  // Debug information
  console.log('Session:', {
    user: session.user,
    role: userRole,
    isAdmin: isAdmin,
    isAdminLower: userRole?.toLowerCase() === 'admin'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <WelcomeHeader session={session} t={t} />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <HomeIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              {t('dashboard.title')}
            </h1>
          </div>
          <p className="text-gray-600">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {isAdmin && (
          <>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 font-medium">
                {t('dashboard.admin.welcome')} - Role: {userRole}
              </p>
            </div>
            <AdminSection t={t} />
          </>
        )}
        <NavigationLinks userRole={userRole} ongoingCompetition={ongoingCompetition} />
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <StatsSection {...statsSectionProps} />
          <CompetitionsSection {...competitionsSectionProps} />
          <NewsSection {...newsSectionProps} />
        </div>
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const safeLocale = locale || 'en';
  return {
    props: {
      ...(await import(`../public/locales/${safeLocale}/common.json`)).default,
    },
  };
}; 