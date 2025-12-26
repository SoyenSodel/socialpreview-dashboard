import { useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getApiUrl } from '../../../config/config';

interface CreateTicketFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateTicketForm = ({ onClose, onSuccess }: CreateTicketFormProps) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(getApiUrl('api/tickets'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          priority,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || t('error.failedToCreateTicket'));
      }
    } catch {
      setError(t('error.networkErrorRetry'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-8 w-full max-w-[95vw] sm:max-w-2xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{t('userDashboard.createNewTicket')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              {t('common.titleRequired')}
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-zinc-700 transition-colors"
              placeholder={t('ticket.titlePlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              {t('common.descriptionRequired')}
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-zinc-700 transition-colors resize-none"
              placeholder={t('ticket.descriptionPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-2">
              {t('common.priority')}
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700 transition-colors"
            >
              <option value="low">{t('priority.lowDescription')}</option>
              <option value="medium">{t('priority.mediumDescription')}</option>
              <option value="high">{t('priority.highDescription')}</option>
              <option value="urgent">{t('priority.urgentDescription')}</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.creating') : t('userDashboard.createTicket')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
