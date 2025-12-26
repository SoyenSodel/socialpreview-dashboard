import { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { NewsItem } from '../../../types/dashboard.types';

interface CreateNewsFormProps {
  onClose: () => void;
  onCreate: (formData: Partial<NewsItem>) => void;
}

export const CreateNewsForm = ({ onClose, onCreate }: CreateNewsFormProps) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onCreate({ title, content, is_pinned: isPinned });
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-8 w-full max-w-[95vw] sm:max-w-4xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{t('teamDashboard.addNews')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('common.titleRequired')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
              placeholder={t('common.titleRequired')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('common.descriptionRequired')}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={12}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700 resize-none"
              placeholder={t('common.descriptionRequired')}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${isPinned
                    ? 'bg-white border-white'
                    : 'bg-zinc-900 border-zinc-800'
                  }`}>
                  <svg
                    className={`w-3 h-3 text-zinc-950 transition-opacity duration-200 ${isPinned ? 'opacity-100' : 'opacity-0'
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span className="ml-3 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                {t('common.pinned')}
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium"
              disabled={isLoading}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? t('common.creating') : t('teamDashboard.addNews')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
