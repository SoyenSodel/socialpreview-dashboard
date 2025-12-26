import { useState, useEffect } from 'react';
import { CheckSquare, Hourglass, Users, AlertCircle, Calendar, TrendingUp, Activity, Briefcase, DollarSign, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getApiUrl } from '../../../config/config';
import { sanitizeText, sanitizeRichContent } from '../../../utils/sanitize';

import type { DashboardStats, Task, CalendarEvent, NewsItem, Service } from '../../../types/dashboard.types';

interface TeamOverviewSectionProps {
  stats: DashboardStats | null;
}

export const TeamOverviewSection = ({ stats }: TeamOverviewSectionProps) => {
  const { t } = useLanguage();
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [recentNews, setRecentNews] = useState<NewsItem[]>([]);
  const [servicesStats, setServicesStats] = useState<{ activeServices: number; completedServices: number; totalValue: number; totalServices: number } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRecentData = async () => {
      try {
        const tasksRes = await fetch(getApiUrl('api/tasks'), {
          credentials: 'include',
        });
        const tasksData = await tasksRes.json();
        if (isMounted && tasksData.tasks) {
          setRecentTasks(tasksData.tasks.slice(0, 5));
        }

        const eventsRes = await fetch(getApiUrl('api/calendar'), {
          credentials: 'include',
        });
        const eventsData = await eventsRes.json();
        if (isMounted && eventsData.events) {
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset to start of day

          const upcoming = eventsData.events
            .filter((e: CalendarEvent) => {
              const eventDate = new Date(e.start_date);
              eventDate.setHours(0, 0, 0, 0); // Reset to start of day
              return eventDate >= today;
            })
            .sort((a: CalendarEvent, b: CalendarEvent) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
            .slice(0, 3);
          setUpcomingEvents(upcoming);
        }

        const newsRes = await fetch(getApiUrl('api/news'), {
          credentials: 'include',
        });
        const newsData = await newsRes.json();
        if (isMounted && newsData.news) {
          setRecentNews(newsData.news.slice(0, 3));
        }

        const servicesRes = await fetch(getApiUrl('api/services/all'), {
          credentials: 'include',
        });
        const servicesData = await servicesRes.json();
        if (isMounted && servicesData.services) {
          const services: Service[] = servicesData.services;
          const activeServices = services.filter((s) => s.status === 'active').length;
          const completedServices = services.filter((s) => s.status === 'inactive').length;
          const totalValue = services.reduce((sum, s) => sum + (s.price || 0), 0);
          setServicesStats({ activeServices, completedServices, totalValue, totalServices: services.length });
        }
      } catch {
        // Ignore
      }
    };

    fetchRecentData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!stats) return <div className="text-gray-400">{t('common.loading')}</div>;

  const urgentTasks = recentTasks.filter(t => t.priority === 'urgent' && t.status !== 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">{t('teamDashboard.overview')}</h2>
        <div className="text-sm text-gray-400">
          {new Date().toLocaleDateString('cs-CZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      { }
      <div className="space-y-3">
        { }
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckSquare className="text-blue-500" size={16} />
              <span className="text-xs text-gray-400">{t('teamDashboard.activeTasks')}</span>
            </div>
            <span className="text-2xl font-bold text-white">{stats.in_progress_tasks + stats.pending_tasks}</span>
          </div>
          <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="text-red-500" size={16} />
              <span className="text-xs text-gray-400">{t('teamDashboard.urgent')}</span>
            </div>
            <span className="text-2xl font-bold text-white">{urgentTasks.length}</span>
          </div>
          <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="text-purple-500" size={16} />
              <span className="text-xs text-gray-400">{t('teamDashboard.team')}</span>
            </div>
            <span className="text-2xl font-bold text-white">{stats.team_members}</span>
          </div>
        </div>

        { }
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Hourglass className="text-orange-500" size={16} />
              <span className="text-xs text-gray-400">{t('teamDashboard.absences')}</span>
            </div>
            <span className="text-2xl font-bold text-white">{stats.active_absences}</span>
          </div>
          <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="text-green-500" size={16} />
              <span className="text-xs text-gray-400">{t('services.stats.activeServices')}</span>
            </div>
            <span className="text-2xl font-bold text-white">{servicesStats?.activeServices || 0}</span>
          </div>
          <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="text-blue-400" size={16} />
              <span className="text-xs text-gray-400">{t('services.stats.completedServices')}</span>
            </div>
            <span className="text-2xl font-bold text-white">{servicesStats?.completedServices || 0}</span>
          </div>
          <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="text-emerald-500" size={16} />
              <span className="text-xs text-gray-400">{t('services.stats.totalValue')}</span>
            </div>
            <span className="text-2xl font-bold text-white">${servicesStats?.totalValue.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        { }
        <div className="space-y-6">
          { }
          <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="text-red-500" size={20} />
              <h3 className="text-lg font-semibold text-white">{t('teamDashboard.urgentTasks')}</h3>
              {urgentTasks.length > 0 && (
                <span className="ml-auto bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full">
                  {urgentTasks.length}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {urgentTasks.length === 0 ? (
                <p className="text-sm text-gray-500">{t('teamDashboard.noUrgentTasks')}</p>
              ) : (
                urgentTasks.map((task: Task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 bg-zinc-900/50 rounded-lg hover:bg-zinc-900 transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{task.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{t('teamDashboard.assignedToLabel')} {task.assigned_users?.map(u => u.name).join(', ') || 'Unassigned'}</p>
                    </div>
                    {task.due_date && (
                      <span className="text-xs text-red-400 whitespace-nowrap">
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          { }
          <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="text-green-500" size={20} />
              <h3 className="text-lg font-semibold text-white">{t('teamDashboard.recentTasks')}</h3>
            </div>
            <div className="space-y-2">
              {recentTasks.length === 0 ? (
                <p className="text-sm text-gray-500">{t('teamDashboard.noRecentTasks')}</p>
              ) : (
                recentTasks.slice(0, 5).map((task: Task) => (
                  <div key={task.id} className="flex items-center gap-3 py-2 border-b border-zinc-800 last:border-0">
                    <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' :
                      task.status === 'in_progress' ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.assigned_users?.map(u => u.name).join(', ') || 'Unassigned'}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                      task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                      }`}>
                      {task.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        { }
        <div className="space-y-6">
          { }
          <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="text-indigo-500" size={20} />
              <h3 className="text-lg font-semibold text-white">{t('teamDashboard.upcomingEvents')}</h3>
            </div>
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-gray-500">{t('teamDashboard.noUpcomingEvents')}</p>
              ) : (
                upcomingEvents.map((event: CalendarEvent) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 bg-zinc-900/50 rounded-lg hover:bg-zinc-900 transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{event.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{event.description}</p>
                    </div>
                    <span className="text-xs text-indigo-400 whitespace-nowrap">
                      {new Date(event.start_date).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          { }
          <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-cyan-500" size={20} />
              <h3 className="text-lg font-semibold text-white">{t('teamDashboard.recentNews')}</h3>
            </div>
            <div className="space-y-3">
              {recentNews.length === 0 ? (
                <p className="text-sm text-gray-500">{t('teamDashboard.noRecentNews')}</p>
              ) : (
                recentNews.map((news: NewsItem) => (
                  <div key={news.id} className="p-3 bg-zinc-900/50 rounded-lg hover:bg-zinc-900 transition-colors">
                    {news.pinned && (
                      <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded mb-2 inline-block">
                        {t('teamDashboard.pinned')}
                      </span>
                    )}
                    <p className="text-sm font-medium text-white">{sanitizeText(news.title)}</p>
                    <div className="text-xs text-gray-400 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: sanitizeRichContent(news.content) }} />
                    <p className="text-xs text-gray-600 mt-2">{new Date(news.created_at).toLocaleDateString()}</p>
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
