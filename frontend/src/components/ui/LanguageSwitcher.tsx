import { useLanguage } from '../../contexts/LanguageContext';

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-900 rounded-lg p-1 backdrop-blur-xl">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
          language === 'en'
            ? 'bg-white text-black'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('cs')}
        className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
          language === 'cs'
            ? 'bg-white text-black'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        CZ
      </button>
    </div>
  );
};
