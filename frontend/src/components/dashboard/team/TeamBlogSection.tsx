import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { BlogPost } from '../../../types/dashboard.types';
import { CreateBlogPostForm } from './CreateBlogPostForm';
import { getApiUrl } from '../../../config/config';
import { sanitizeText } from '../../../utils/sanitize';

interface TeamBlogSectionProps {
  onRefresh?: () => void;
}

export const TeamBlogSection = ({ onRefresh }: TeamBlogSectionProps) => {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch(getApiUrl('api/blog'), {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.posts) setPosts(data.posts);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (formData: Partial<BlogPost>) => {
    try {
      await fetch(getApiUrl('api/blog'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      fetchPosts();
      if (onRefresh) onRefresh();
      setShowCreateForm(false);
    } catch {
      // Ignore
    }
  };

  const deletePost = async (postId: string) => {
    try {
      await fetch(getApiUrl(`api/blog/${postId}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      fetchPosts();
      if (onRefresh) onRefresh();
    } catch {
      // Ignore
    }
  };

  if (loading) return <div className="text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">{t('teamDashboard.blog')}</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
        >
          <Plus size={20} /> {t('teamDashboard.newPost')}
        </button>
      </div>

      <div className="grid gap-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${post.status === 'published' ? 'bg-green-500/20 text-green-400' :
                    post.status === 'draft' ? 'bg-gray-500/20 text-gray-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                    {t(`teamDashboard.${post.status}`)}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{sanitizeText(post.title)}</h3>
                {post.excerpt && <p className="text-gray-400 text-sm mb-3">{sanitizeText(post.excerpt)}</p>}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{t('common.by')} {sanitizeText(post.author_name)}</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  {post.published_at && <span>{t('teamDashboard.publishedOn')} {new Date(post.published_at).toLocaleDateString()}</span>}
                </div>
              </div>
              <button
                onClick={() => deletePost(post.id)}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreateForm && (
        <CreateBlogPostForm
          onClose={() => setShowCreateForm(false)}
          onCreate={createPost}
        />
      )}
    </div>
  );
};
