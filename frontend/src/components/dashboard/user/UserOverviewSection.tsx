import { useState, useEffect } from 'react';
import { Ticket as TicketIcon, Hourglass, CheckCircle2, AlertCircle, Activity, Briefcase, DollarSign } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { Ticket, Service, ServiceStats } from '../../../types/dashboard.types';
import { getApiUrl } from '../../../config/config';

type UserSection = 'overview' | 'tickets' | 'resolved' | 'settings';

interface UserStats {
  open: number;
  inProgress: number;
  resolved: number;
}

interface UserOverviewSectionProps {
  stats: UserStats;
  onNavigate: (section: UserSection) => void;
}

export const UserOverviewSection = ({ stats, onNavigate }: UserOverviewSectionProps) => {
  const { t } = useLanguage();
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [urgentTickets, setUrgentTickets] = useState<Ticket[]>([]);
  const [servicesStats, setServicesStats] = useState<ServiceStats | null>(null);
  const [activeServices, setActiveServices] = useState<Service[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchTickets = async () => {
      try {
        const response = await fetch(getApiUrl('api/tickets/my'), {
          credentials: 'include',
        });
        const data = await response.json();

        if (isMounted && data.tickets) {
          setRecentTickets(data.tickets.slice(0, 5));
          const urgent = data.tickets.filter((t: Ticket) =>
            (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'resolved'
          ).slice(0, 5);
          setUrgentTickets(urgent);
        }
      } catch {
        // Ignore
      }
    };

    const fetchServicesStats = async () => {
      try {

        const statsResponse = await fetch(getApiUrl('api/services/statistics'), {
          credentials: 'include',
        });
        const statsData = await statsResponse.json();
        if (isMounted && statsData.statistics) {
          setServicesStats(statsData.statistics);
        }

        const servicesResponse = await fetch(getApiUrl('api/services/my'), {
          credentials: 'include',
        });
        const servicesData = await servicesResponse.json();
        if (isMounted && servicesData.services) {

          const active = servicesData.services.filter((s: Service) => s.status === 'active').slice(0, 3);
          setActiveServices(active);
        }
      } catch {
        // Ignore
      }
    };

    fetchTickets();
    fetchServicesStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">{t('userDashboard.overview')}</h2>
        <div className="text-sm text-gray-400">
          {new Date().toLocaleDateString('cs-CZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      { }
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div onClick={() => onNavigate('tickets')} className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-4 cursor-pointer hover:border-zinc-800 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <TicketIcon className="text-blue-500" size={16} />
            <span className="text-xs text-gray-400">{t('userDashboard.openTickets')}</span>
          </div>
          <span className="text-2xl font-bold text-white">{stats.open}</span>
        </div>
        <div onClick={() => onNavigate('tickets')} className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-4 cursor-pointer hover:border-zinc-800 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <Hourglass className="text-orange-500" size={16} />
            <span className="text-xs text-gray-400">{t('userDashboard.inProgress')}</span>
          </div>
          <span className="text-2xl font-bold text-white">{stats.inProgress}</span>
        </div>
        <div onClick={() => onNavigate('resolved')} className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-4 cursor-pointer hover:border-zinc-800 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="text-green-500" size={16} />
            <span className="text-xs text-gray-400">{t('userDashboard.resolvedTickets')}</span>
          </div>
          <span className="text-2xl font-bold text-white">{stats.resolved}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        { }
        <div className="space-y-6">
          { }
          <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="text-red-500" size={20} />
              <h3 className="text-lg font-semibold text-white">{t('userDashboard.priorityTickets') || 'Priority Tickets'}</h3>
              {urgentTickets.length > 0 && (
                <span className="ml-auto bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full">
                  {urgentTickets.length}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {urgentTickets.length === 0 ? (
                <p className="text-sm text-gray-500">{t('userDashboard.noPriorityTickets') || 'No urgent tickets'}</p>
              ) : (
                urgentTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-start gap-3 p-3 bg-zinc-900/50 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer" onClick={() => onNavigate('tickets')}>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{ticket.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{ticket.description.substring(0, 60)}...</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          { }
          <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="text-green-500" size={20} />
              <h3 className="text-lg font-semibold text-white">{t('services.myServices')}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">{t('services.stats.activeServices')}</p>
                <p className="text-2xl font-bold text-white">{servicesStats?.active_services || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">{t('services.stats.completedServices')}</p>
                <p className="text-2xl font-bold text-white">{servicesStats?.completed_services || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">{t('services.stats.totalValue')}</p>
                <p className="text-2xl font-bold text-white">${servicesStats?.total_value?.toLocaleString() || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">{t('services.stats.activeValue')}</p>
                <p className="text-2xl font-bold text-white">${servicesStats?.active_value?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

        </div>

        { }
        <div className="space-y-6">
          { }
          <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="text-cyan-500" size={20} />
              <h3 className="text-lg font-semibold text-white">{t('userDashboard.recentActivity') || 'Recent Activity'}</h3>
            </div>
            <div className="space-y-2">
              {recentTickets.length === 0 ? (
                <p className="text-sm text-gray-500">{t('userDashboard.noRecentActivity') || 'No recent tickets'}</p>
              ) : (
                recentTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center gap-3 py-2 border-b border-zinc-800 last:border-0 cursor-pointer hover:bg-zinc-900/30 px-2 -mx-2 rounded transition-colors" onClick={() => onNavigate('tickets')}>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(ticket.status)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{ticket.title}</p>
                      <p className="text-xs text-gray-500">{ticket.status}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          { }
          <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="text-emerald-500" size={20} />
              <h3 className="text-lg font-semibold text-white">{t('services.activeServices')}</h3>
            </div>
            <div className="space-y-3">
              {activeServices.length === 0 ? (
                <p className="text-sm text-gray-500">{t('services.noActiveServices')}</p>
              ) : (
                activeServices.map((service) => (
                  <div key={service.id} className="p-3 bg-zinc-900/50 rounded-lg hover:bg-zinc-900 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-white">{service.name}</p>
                      <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                        {service.progress}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{service.description.substring(0, 80)}...</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">${service.price?.toLocaleString()}</span>
                      <div className="w-20 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${service.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
