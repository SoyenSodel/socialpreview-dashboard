import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getApiUrl } from '../../../config/config';
import type { Service, TeamMember } from '../../../types/dashboard.types';

interface CreateServiceFormProps {
  onClose: () => void;
  onCreate: (formData: Partial<Service>) => void;
  service?: Service;
}

export const CreateServiceForm = ({ onClose, onCreate, service }: CreateServiceFormProps) => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    user_id: service?.user_id || '',
    name: service?.name || '',
    description: service?.description || '',
    service_type: service?.service_type || 'web_development',
    price: service?.price || 0,
    status: service?.status || 'active',
    start_date: service?.start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    end_date: service?.end_date?.split('T')[0] || '',
    progress: service?.progress || 0,
    notes: service?.notes || '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(getApiUrl('api/members'), {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.members) {

        const clients = data.members.filter((m: TeamMember) => m.role === 'user');
        setUsers(clients);
      }
    } catch {
      // Ignore errors when fetching users
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onCreate(formData);
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'progress' ? Number(value) : value
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-8 w-full max-w-[95vw] sm:max-w-2xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {service ? t('services.editService') : t('services.createService')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          { }
          {!service && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('services.client')} *
              </label>
              <select
                name="user_id"
                value={formData.user_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
              >
                <option value="">{t('services.selectClient')}</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          { }
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('services.serviceName')} *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
              placeholder={t('placeholders.serviceName')}
            />
          </div>

          { }
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('services.serviceDescription')} *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700 resize-none"
              placeholder={t('placeholders.serviceDescription')}
            />
          </div>

          { }
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('services.serviceType')} *
              </label>
              <select
                name="service_type"
                value={formData.service_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
              >
                <option value="web_development">{t('services.types.webDevelopment')}</option>
                <option value="social_media">{t('services.types.socialMedia')}</option>
                <option value="digital_identity">{t('services.types.digitalIdentity')}</option>
                <option value="social_content">{t('services.types.socialContent')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('services.price')} ($) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          { }
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('services.status')} *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
              >
                <option value="active">{t('services.statuses.active')}</option>
                <option value="completed">{t('services.statuses.completed')}</option>
                <option value="paused">{t('services.statuses.paused')}</option>
                <option value="cancelled">{t('services.statuses.cancelled')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('services.progress')} (%)
              </label>
              <input
                type="number"
                name="progress"
                value={formData.progress}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          { }
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('services.startDate')} *
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('services.endDate')}
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          { }
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('services.notes')}
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700 resize-none"
              placeholder={t('placeholders.serviceNotes')}
            />
          </div>

          { }
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
            >
              {loading
                ? (service ? t('services.updating') : t('services.creating'))
                : (service ? t('services.editService') : t('services.createService'))
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
