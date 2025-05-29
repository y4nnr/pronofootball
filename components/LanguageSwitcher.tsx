import { useRouter } from 'next/router';
import { useTranslation } from '../hooks/useTranslation';

const LanguageSwitcher = () => {
  const router = useRouter();
  const { locale, locales, asPath } = router;
  const { t } = useTranslation('common');

  const handleLanguageChange = (newLocale: string) => {
    router.push(asPath, asPath, { locale: newLocale });
  };

  const getFlag = (lng: string) => {
    const flags: { [key: string]: string } = {
      'en': '🇬🇧',
      'fr': '🇫🇷'
    };
    return flags[lng] || '🌐';
  };

  return (
    <div className="hidden md:flex items-center space-x-1">
      {locales?.map((lng) => (
        <button
          key={lng}
          onClick={() => handleLanguageChange(lng)}
          className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 min-w-[70px] ${
            lng === locale
              ? 'bg-primary-500/20 text-white shadow-modern ring-1 ring-primary-400/30'
              : 'text-neutral-300 hover:text-white hover:bg-white/10'
          }`}
          disabled={lng === locale}
          title={lng === 'en' ? 'English' : 'Français'}
        >
          <div className="mb-1 text-lg">
            {getFlag(lng)}
          </div>
          <span className="text-xs font-medium">
            {lng.toUpperCase()}
          </span>
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher; 