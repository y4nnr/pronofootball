import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from './LanguageSwitcher';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { HomeIcon, PencilSquareIcon, ChartBarIcon, CalendarIcon, UserGroupIcon, ShieldCheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const { data: session } = useSession();
  const { t } = useTranslation('common');
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Handle client-side mounting
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = session?.user?.role?.toLowerCase() === 'admin';
  
  // Debug logging
  useEffect(() => {
    console.log('Session:', session);
    console.log('Is Admin:', isAdmin);
  }, [session, isAdmin]);

  const navigationItems = [
    { name: t('dashboard.nav.home'), href: '/dashboard', icon: <HomeIcon className="h-6 w-6" />, showFor: ['user', 'admin'] },
    { name: t('dashboard.nav.competitions'), href: '/competitions', icon: <PencilSquareIcon className="h-6 w-6" />, showFor: ['user', 'admin'] },
    { name: t('dashboard.nav.stats'), href: '/stats', icon: <ChartBarIcon className="h-6 w-6" />, showFor: ['user', 'admin'] },
    // Admin only
    { name: t('admin.competitions.title'), href: '/admin/competitions', icon: <CalendarIcon className="h-6 w-6" />, showFor: ['admin'] },
    { name: t('dashboard.admin.manageTeams'), href: '/admin/teams', icon: <ShieldCheckIcon className="h-6 w-6" />, showFor: ['admin'] },
    { name: t('dashboard.admin.manageUsers'), href: '/admin/users', icon: <UserGroupIcon className="h-6 w-6" />, showFor: ['admin'] },
  ];

  const filteredNavigation = navigationItems.filter(item => item.showFor.includes(isAdmin ? 'admin' : 'user'));

  // Debug logging
  useEffect(() => {
    console.log('Filtered Navigation:', filteredNavigation);
  }, [filteredNavigation]);

  // Check if we can show a back button (only on client side to prevent hydration mismatch)
  const canGoBack = isClient && router.pathname !== '/dashboard' && window.history.length > 1;

  // Back button handler
  const handleGoBack = () => {
    if (canGoBack) {
      router.back();
    }
  };

  // Nav item with text label below icon
  const NavItem = ({ item }: { item: typeof filteredNavigation[0] }) => {
    const isActive = router.pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`group flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 min-w-[80px] ${
          isActive ? 'bg-white/10 text-white shadow-md' : 'text-gray-300 hover:text-white hover:bg-white/5'
        }`}
      >
        <div className="mb-2">{item.icon}</div>
        <span className="text-xs font-medium leading-tight text-center max-w-[80px] line-clamp-2">
          {item.name}
        </span>
      </Link>
    );
  };

  // Back button component
  const BackButton = () => (
    <button
      onClick={handleGoBack}
      className={`group flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 min-w-[80px] ${
        canGoBack ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 cursor-not-allowed'
      }`}
      disabled={!canGoBack}
    >
      <div className="mb-2">
        <ArrowLeftIcon className="h-6 w-6" />
      </div>
      <span className="text-xs font-medium leading-tight text-center">
        {t('back')}
      </span>
    </button>
  );

  // Mobile menu
  const MobileMenu = () => (
    <div className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center transition-all ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="bg-zinc-900/95 rounded-2xl shadow-xl p-8 flex flex-col space-y-6 w-72">
        {canGoBack && (
          <button
            onClick={() => { handleGoBack(); setMobileMenuOpen(false); }}
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-lg font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <ArrowLeftIcon className="h-6 w-6" />
            <span>{t('back')}</span>
          </button>
        )}
        {filteredNavigation.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-lg font-medium transition-all duration-200 ${
              router.pathname.startsWith(item.href)
                ? 'bg-white/10 text-white shadow-md' : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="text-2xl">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="mt-4 px-4 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );

  return (
    <nav className="fixed top-0 left-0 w-full bg-black/80 backdrop-blur-lg shadow-2xl border-b border-zinc-900 z-50" style={{ minHeight: 96 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 py-2">
          {/* Left: User Profile + Separator + Back Button + Navigation */}
          <div className="flex items-center space-x-4">
            {/* User Profile Picture with Name */}
            {session?.user && (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(v => !v)}
                  className="flex flex-col items-center justify-center group hover:bg-white/5 p-3 rounded-lg transition-all duration-200 min-w-[80px]"
                  aria-label="Open profile menu"
                >
                  <div className="mb-2">
                    <Image
                      src={profilePictureUrl || session.user.image || 'https://i.pravatar.cc/150'}
                      alt={session.user.name || 'User'}
                      width={36}
                      height={36}
                      className="rounded-full border border-zinc-700 object-cover shadow-sm"
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-300 group-hover:text-white leading-tight text-center max-w-[80px] line-clamp-1">
                    {session.user.name}
                  </span>
                </button>
                {/* Profile dropdown */}
                {profileOpen && (
                  <div className="absolute left-0 mt-2 w-44 bg-zinc-900/95 rounded-xl shadow-lg border border-zinc-800 py-2 z-50 animate-fade-in">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-gray-200 hover:bg-white/10 rounded-md transition"
                      onClick={() => setProfileOpen(false)}
                    >
                      <span className="inline-block mr-2">👤</span> {t('dashboard.nav.profile')}
                    </Link>
                    <button
                      onClick={() => { setProfileOpen(false); signOut({ callbackUrl: '/login' }); }}
                      className="block w-full text-left px-4 py-2 text-gray-200 hover:bg-white/10 rounded-md transition"
                    >
                      <span className="inline-block mr-2">🚪</span> {t('dashboard.logout')}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Separator */}
            {session?.user && (
              <div className="h-16 w-px bg-zinc-700"></div>
            )}
            
            {/* Mobile hamburger menu */}
            <button
              className="md:hidden p-2 rounded-full hover:bg-white/10 transition"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Back Button + Navigation with text labels (desktop only) */}
            <div className="flex space-x-1 md:space-x-2 hidden md:flex">
              <BackButton />
              {filteredNavigation.map(item => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* Right: Language Flags with Labels */}
          <div className="flex items-center gap-4">
            {/* Language Switcher with Flags and Labels */}
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => router.push(router.pathname, router.asPath, { locale: 'en' })} 
                className="flex flex-col items-center group hover:bg-white/5 p-3 rounded-lg transition-all duration-200 min-w-[60px]"
                title="English"
              >
                <div className="mb-2">
                  <img src="https://flagcdn.com/gb.svg" alt="English" style={{ width: 28, height: 20, borderRadius: 3, boxShadow: '0 1px 2px #0002' }} />
                </div>
                <span className="text-xs font-medium text-gray-300 group-hover:text-white">EN</span>
              </button>
              <button 
                onClick={() => router.push(router.pathname, router.asPath, { locale: 'fr' })} 
                className="flex flex-col items-center group hover:bg-white/5 p-3 rounded-lg transition-all duration-200 min-w-[60px]"
                title="Français"
              >
                <div className="mb-2">
                  <img src="https://flagcdn.com/fr.svg" alt="Français" style={{ width: 28, height: 20, borderRadius: 3, boxShadow: '0 1px 2px #0002' }} />
                </div>
                <span className="text-xs font-medium text-gray-300 group-hover:text-white">FR</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile menu overlay */}
      <MobileMenu />
    </nav>
  );
} 