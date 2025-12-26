import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getApiUrl } from '../../../config/config';
import { sanitizeText, sanitizeRichContent } from '../../../utils/sanitize';
import type { NewsItem } from '../../../types/dashboard.types';
import { CreateNewsForm } from './CreateNewsForm';

interface TeamNewsSectionProps {
  onRefresh?: () => void;
}

export const TeamNewsSection = ({ onRefresh }: TeamNewsSectionProps) => {
  const { t } = useLanguage();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch(getApiUrl('api/news'), {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.news) setNews(data.news);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const createNews = async (formData: Partial<NewsItem>) => {
    try {
      await fetch(getApiUrl('api/news'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      fetchNews();
      if (onRefresh) onRefresh();
      setShowCreateForm(false);
    } catch {
      // Ignore
    }
  };

  if (loading) return <div className="text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">{t('teamDashboard.news')}</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
        >
          <Plus size={20} /> {t('teamDashboard.addNews')}
        </button>
      </div>

      <div className="grid gap-4">
        {news.map((item) => (
          <div key={item.id} className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                {item.is_pinned && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400 mb-2 inline-block">{t('common.pinned')}</span>
                )}
                <h3 className="text-xl font-semibold text-white mb-2">{sanitizeText(item.title)}</h3>
                <div className="text-gray-400 mb-3" dangerouslySetInnerHTML={{ __html: sanitizeRichContent(item.content) }} />
                <div className="text-sm text-gray-500">
                  {t('common.by')} {item.author_name} • {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreateForm && (
        <CreateNewsForm
          onClose={() => setShowCreateForm(false)}
          onCreate={createNews}
        />
      )}
    </div>
  );
};
