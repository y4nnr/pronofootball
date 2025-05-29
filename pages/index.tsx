import { useState, useEffect } from 'react';
import { useSession, signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from '../hooks/useTranslation';
import Navbar from '../components/Navbar';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation('common');
  const [isLoading, setIsLoading] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        emailOrUsername,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials');
      } else {
        // Get the session to check for password change requirement
        const session = await getSession();
        if ((session?.user as any)?.needsPasswordChange) {
          router.push('/change-password');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="text-xl text-white animate-pulse">{t('dashboard.loading')}</div>
      </div>
    );
  }

  // Don't show anything while redirecting logged-in users
  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero text-white relative overflow-hidden">
      {/* Navbar */}
      <Navbar />
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute top-0 left-0 w-72 h-72 bg-accent-400/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
      
      {/* Main content with top padding for navbar */}
      <div className="container mx-auto px-4 py-16 relative z-10 pt-32">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 animate-fade-in">
            <span className="gradient-text-home">{t('welcome')}</span>
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-primary-100 animate-slide-in max-w-3xl mx-auto leading-relaxed">
            {t('homepage.subtitle')}
          </p>
          
          {/* Login Form - shown directly for non-logged-in users */}
          <div className="max-w-md mx-auto mb-20 animate-fade-in">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="glass-dark rounded-2xl p-8 shadow-modern-lg border border-white/20">
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {t('signIn')}
                  </h2>
                  <p className="text-primary-200">{t('homepage.loginSubtitle')}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="emailOrUsername" className="block text-sm font-medium text-neutral-200 mb-2">
                      {t('username')}
                    </label>
                    <input
                      id="emailOrUsername"
                      name="emailOrUsername"
                      type="text"
                      autoComplete="username"
                      required
                      className="appearance-none relative block w-full px-4 py-3 border border-white/20 placeholder-neutral-400 text-white bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 sm:text-sm backdrop-blur-md"
                      placeholder={t('username')}
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-neutral-200 mb-2">
                      {t('password')}
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="appearance-none relative block w-full px-4 py-3 border border-white/20 placeholder-neutral-400 text-white bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 sm:text-sm backdrop-blur-md"
                      placeholder={t('password')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl text-red-200 text-sm text-center">
                    {error}
                  </div>
                )}

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200 shadow-modern hover:shadow-modern-lg hover:scale-[1.02]"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        {t('signingIn')}
                      </div>
                    ) : (
                      t('signInButton')
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
          
          {/* Feature highlights */}
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="glass-dark rounded-2xl p-6 animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="w-12 h-12 bg-accent-500 rounded-xl mb-4 flex items-center justify-center">
                <span className="text-2xl">⚽</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('homepage.features.predictions.title')}</h3>
              <p className="text-primary-200">{t('homepage.features.predictions.description')}</p>
            </div>
            
            <div className="glass-dark rounded-2xl p-6 animate-fade-in" style={{animationDelay: '0.4s'}}>
              <div className="w-12 h-12 bg-warm-500 rounded-xl mb-4 flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('homepage.features.competitions.title')}</h3>
              <p className="text-primary-200">{t('homepage.features.competitions.description')}</p>
            </div>
            
            <div className="glass-dark rounded-2xl p-6 animate-fade-in" style={{animationDelay: '0.6s'}}>
              <div className="w-12 h-12 bg-primary-500 rounded-xl mb-4 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('homepage.features.statistics.title')}</h3>
              <p className="text-primary-200">{t('homepage.features.statistics.description')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
