import { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { BlogPost } from '../../../types/dashboard.types';

interface CreateBlogPostFormProps {
  onClose: () => void;
  onCreate: (formData: Partial<BlogPost>) => void;
}

export const CreateBlogPostForm = ({ onClose, onCreate }: CreateBlogPostFormProps) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [status, setStatus] = useState<BlogPost['status']>('draft');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ title, content, excerpt, status });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-8 w-full max-w-[95vw] sm:max-w-4xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{t('blog.createPost')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('blog.title')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('blog.excerpt')}</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              placeholder={t('blog.excerptPlaceholder')}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('blog.contentRequired')}</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={12}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700 resize-none font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('blog.status')}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BlogPost['status'])}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
            >
              <option value="draft">{t('blog.statuses.draft')}</option>
              <option value="published">{t('blog.statuses.published')}</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium">{t('blog.cancel')}</button>
            <button type="submit" className="flex-1 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium">{t('blog.createPostButton')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
