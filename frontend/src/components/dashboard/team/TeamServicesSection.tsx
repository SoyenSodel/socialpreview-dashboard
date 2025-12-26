import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, DollarSign, Calendar } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getApiUrl } from '../../../config/config';
import type { Service } from '../../../types/dashboard.types';
import { CreateServiceForm } from './CreateServiceForm';

interface TeamServicesSectionProps {
  onRefresh?: () => void;
}

export const TeamServicesSection = ({ onRefresh }: TeamServicesSectionProps) => {
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch(getApiUrl('api/services/all'), {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.services) setServices(data.services);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateService = async (formData: Partial<Service>) => {
    try {
      const url = editingService
        ? getApiUrl(`api/services/${editingService.id}`)
        : getApiUrl('api/services');
      const method = editingService ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      fetchServices();
      if (onRefresh) onRefresh();
      setShowCreateForm(false);
      setEditingService(null);
    } catch {
      // Ignore
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm(t('services.confirmDelete'))) return;

    try {
      await fetch(getApiUrl(`api/services/${serviceId}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      fetchServices();
      if (onRefresh) onRefresh();
    } catch {
      // Ignore
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      web_development: t('services.types.webDevelopment'),
      social_media: t('services.types.socialMedia'),
      digital_identity: t('services.types.digitalIdentity'),
      social_content: t('services.types.socialContent'),
    };
    return typeMap[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      active: t('services.statuses.active'),
      completed: t('services.statuses.completed'),
      paused: t('services.statuses.paused'),
      cancelled: t('services.statuses.cancelled'),
    };
    return statusMap[status] || status;
  };

  const filteredServices = filterStatus === 'all'
    ? services
    : services.filter(s => s.status === filterStatus);

  if (loading) return <div className="text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">{t('services.allServices')}</h2>
        <button
          onClick={() => {
            setEditingService(null);
            setShowCreateForm(true);
          }}
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
        >
          <Plus size={20} />
          {t('services.addService')}
        </button>
      </div>

      { }
      <div className="flex flex-wrap gap-2 border-b border-zinc-800">
        {['all', 'active', 'completed', 'paused', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 font-medium transition-colors ${filterStatus === status
              ? 'text-white border-b-2 border-white'
              : 'text-gray-400 hover:text-gray-300'
              }`}
          >
            {status === 'all' ? t('teamDashboard.all') : getStatusLabel(status)}
          </button>
        ))}
      </div>

      { }
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredServices.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            {t('services.noServices')}
          </div>
        ) : (
          filteredServices.map((service) => (
            <div key={service.id} className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6 hover:border-zinc-800 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(service.status)}`}>
                      {getStatusLabel(service.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{service.description}</p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <DollarSign size={14} />
                      ${service.price.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(service.start_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingService(service);
                      setShowCreateForm(true);
                    }}
                    className="p-2 text-gray-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => deleteService(service.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{t('services.client')}:</span>
                  <span className="text-white font-medium">{service.user_name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{t('services.serviceType')}:</span>
                  <span className="text-white">{getTypeLabel(service.service_type)}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{t('services.progress')}:</span>
                    <span className="text-white font-medium">{service.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${service.progress}%` }}
                    />
                  </div>
                </div>
                {service.notes && (
                  <div className="text-xs text-gray-500 mt-2">
                    <span className="font-medium">{t('services.notes')}: </span>
                    {service.notes}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {(showCreateForm || editingService) && (
        <CreateServiceForm
          onClose={() => {
            setShowCreateForm(false);
            setEditingService(null);
          }}
          onCreate={createOrUpdateService}
          service={editingService || undefined}
        />
      )}
    </div>
  );
};
