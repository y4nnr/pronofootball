import { useRouter } from 'next/router';
import { useTranslation } from '../hooks/useTranslation';

const LanguageSwitcher = () => {
  const router = useRouter();
  const { locale, locales, asPath } = router;
  const { t } = useTranslation('common');

  const handleLanguageChange = (newLocale: string) => {
    router.push(asPath, asPath, { locale: newLocale });
  };

  return (
    <div className="flex items-center space-x-2">
      {locales?.map((lng) => (
        <button
          key={lng}
          onClick={() => handleLanguageChange(lng)}
          className={`px-2 py-1 rounded ${
            lng === locale
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
          disabled={lng === locale}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher; 