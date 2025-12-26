import { useState, useEffect } from 'react';
import { Briefcase, DollarSign, Calendar, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getApiUrl } from '../../../config/config';
import type { Service, ServiceStats } from '../../../types/dashboard.types';

export const UserServicesSection = () => {
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [statistics, setStatistics] = useState<ServiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('active');

  useEffect(() => {
    fetchServices();
    fetchStatistics();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch(getApiUrl('api/services/my'), {
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

  const fetchStatistics = async () => {
    try {
      const response = await fetch(getApiUrl('api/services/statistics'), {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.statistics) setStatistics(data.statistics);
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

  const filteredServices = services.filter(s =>
    activeTab === 'all' ? true : s.status === activeTab
  );

  if (loading) return <div className="text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      { }
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">{t('services.myServices')}</h2>
        <p className="text-gray-400">{t('services.viewDetails')}</p>
      </div>

      { }
      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Briefcase className="text-green-500" size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400">{t('services.stats.activeServices')}</p>
                <p className="text-2xl font-bold text-white">{statistics.active_services}</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <CheckCircle className="text-blue-500" size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400">{t('services.stats.completedServices')}</p>
                <p className="text-2xl font-bold text-white">{statistics.completed_services}</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <DollarSign className="text-purple-500" size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400">{t('services.stats.totalValue')}</p>
                <p className="text-2xl font-bold text-white">${statistics.total_value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      { }
      <div className="flex flex-wrap gap-2 border-b border-zinc-800">
        {['all', 'active', 'completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors ${activeTab === tab
              ? 'text-white border-b-2 border-white'
              : 'text-gray-400 hover:text-gray-300'
              }`}
          >
            {tab === 'all' ? t('teamDashboard.all') : getStatusLabel(tab)}
          </button>
        ))}
      </div>

      { }
      <div className="space-y-4">
        {filteredServices.length === 0 ? (
          <div className="text-center py-12 bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg">
            <Briefcase className="mx-auto mb-4 text-gray-600" size={48} />
            <p className="text-gray-400 text-lg mb-2">
              {activeTab === 'active' ? t('services.noActiveServices') : t('services.noServices')}
            </p>
          </div>
        ) : (
          filteredServices.map((service) => (
            <div key={service.id} className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6 hover:border-zinc-800 transition-colors">
              { }
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{service.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(service.status)}`}>
                      {getStatusLabel(service.status)}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-3">{service.description}</p>
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-sm">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Briefcase size={16} />
                      {getTypeLabel(service.service_type)}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <DollarSign size={16} />
                      ${service.price.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Calendar size={16} />
                      {new Date(service.start_date).toLocaleDateString()}
                      {service.end_date && ` - ${new Date(service.end_date).toLocaleDateString()}`}
                    </span>
                  </div>
                </div>
              </div>

              { }
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-400">
                    <TrendingUp size={16} />
                    {t('services.progress')}
                  </span>
                  <span className="text-white font-semibold">{service.progress}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${service.progress}%` }}
                  />
                </div>
              </div>

              { }
              {service.notes && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium text-gray-400">{t('services.notes')}: </span>
                    {service.notes}
                  </p>
                </div>
              )}

              { }
              {service.status === 'active' && service.end_date && (
                <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-2 text-sm text-gray-500">
                  <Clock size={14} />
                  <span>
                    {t('services.endDate')}: {new Date(service.end_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
