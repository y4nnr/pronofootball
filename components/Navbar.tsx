import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from './LanguageSwitcher';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { HomeIcon, PencilSquareIcon, ChartBarIcon, CalendarIcon, UserGroupIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const { data: session } = useSession();
  const { t } = useTranslation('common');
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

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

  // Nav item with tooltip
  const NavItem = ({ item }: { item: typeof filteredNavigation[0] }) => {
    const isActive = router.pathname.startsWith(item.href);
  return (
      <Link
        key={item.href}
        href={item.href}
        className={`group flex flex-col items-center justify-center p-2 rounded-full transition-all duration-200 relative hover:bg-white/10 ${
          isActive ? 'bg-white/10 text-white shadow-md' : 'text-gray-300 hover:text-white'
        }`}
        style={{ width: 44, height: 44 }}
      >
        <span className="text-xl group-hover:scale-125 transition-transform drop-shadow-sm">{item.icon}</span>
        {/* Tooltip */}
        <span className="absolute left-1/2 -translate-x-1/2 top-12 z-20 opacity-0 group-hover:opacity-100 pointer-events-none bg-black text-white text-xs rounded px-2 py-1 shadow-lg transition-all whitespace-nowrap">
          {item.name}
        </span>
      </Link>
    );
  };

  // Mobile menu
  const MobileMenu = () => (
    <div className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center transition-all ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="bg-zinc-900/95 rounded-2xl shadow-xl p-8 flex flex-col space-y-6 w-72">
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
          Close
        </button>
                  </div>
                </div>
  );

  return (
    <nav className="fixed top-0 left-0 w-full bg-black/80 backdrop-blur-lg shadow-2xl border-b border-zinc-900 z-50" style={{ minHeight: 64 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: User Profile + Separator + Navigation */}
          <div className="flex items-center space-x-4">
            {/* User Profile Picture */}
            {session?.user && (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(v => !v)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 shadow border border-zinc-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  aria-label="Open profile menu"
                >
                  <Image
                    src={profilePictureUrl || session.user.image || 'https://i.pravatar.cc/150'}
                    alt={session.user.name || 'User'}
                    width={36}
                    height={36}
                    className="rounded-full border border-zinc-700 object-cover shadow-sm"
                  />
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
              <div className="h-8 w-px bg-zinc-700"></div>
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
            
            {/* Icon-only Navigation (desktop only) */}
            <div className="flex space-x-2 md:space-x-4 hidden md:flex">
              {filteredNavigation.map(item => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* Right: Language Flags */}
          <div className="flex items-center gap-4">
            {/* Language Switcher with Rectangular SVG Flags */}
            <div className="flex items-center space-x-2">
              <button onClick={() => router.push(router.pathname, router.asPath, { locale: 'en' })} title="English">
                <img src="https://flagcdn.com/gb.svg" alt="English" style={{ width: 28, height: 20, borderRadius: 3, boxShadow: '0 1px 2px #0002' }} />
              </button>
              <button onClick={() => router.push(router.pathname, router.asPath, { locale: 'fr' })} title="Français">
                <img src="https://flagcdn.com/fr.svg" alt="Français" style={{ width: 28, height: 20, borderRadius: 3, boxShadow: '0 1px 2px #0002' }} />
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