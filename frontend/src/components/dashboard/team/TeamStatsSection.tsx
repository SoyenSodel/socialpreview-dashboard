import { useState, useEffect } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getApiUrl } from '../../../config/config';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, CheckCircle, Clock, AlertCircle, Users, FileText, Calendar, Ticket, Briefcase } from 'lucide-react';

import type { DashboardStats, Service } from '../../../types/dashboard.types';
// ...
interface TeamStatsSectionProps {
  stats: DashboardStats | null;
  onRefresh: () => void;
}

export const TeamStatsSection = ({ stats, onRefresh }: TeamStatsSectionProps) => {
  const { t } = useLanguage();
  const [servicesStats, setServicesStats] = useState<{ activeServices: number; completedServices: number; totalValue: number; activeValue: number; totalServices: number } | null>(null);

  useEffect(() => {
    fetchServicesStats();
  }, []);

  const fetchServicesStats = async () => {
    try {
      const response = await fetch(getApiUrl('api/services/all'), {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.services) {
        const services: Service[] = data.services;
        const activeServices = services.filter((s) => s.status === 'active').length;
        const completedServices = services.filter((s) => s.status === 'inactive').length; // Assuming 'inactive' roughly maps to completed/archived interest
        const totalValue = services.reduce((sum, s) => sum + (s.price || 0), 0);
        const activeValue = services.filter((s) => s.status === 'active').reduce((sum, s) => sum + (s.price || 0), 0);
        setServicesStats({ activeServices, completedServices, totalValue, activeValue, totalServices: services.length });
      }
    } catch {
      // Ignore
    }
  };

  if (!stats) return <div className="text-gray-400">Loading...</div>;

  const taskStatusData = [
    { name: t('statistics.completed_chart'), value: stats.completed_tasks, color: '#22c55e' },
    { name: t('statistics.inProgress_chart'), value: stats.in_progress_tasks, color: '#3b82f6' },
    { name: t('statistics.pending_chart'), value: stats.pending_tasks, color: '#eab308' },
  ].filter(item => item.value > 0);

  const taskPriorityData = [
    { name: t('statistics.urgent'), value: stats.urgent_tasks, color: '#ef4444' },
    { name: t('statistics.high'), value: stats.high_tasks, color: '#f97316' },
    { name: t('statistics.medium'), value: stats.medium_tasks, color: '#eab308' },
    { name: t('statistics.low'), value: stats.low_tasks, color: '#6b7280' },
  ];

  const completionRate = stats.total_tasks > 0 ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0;

  return (
    <div className="space-y-6">
      { }
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">{t('teamDashboard.stats')}</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium flex items-center gap-2"
        >
          <Activity size={18} />
          {t('statistics.refresh')}
        </button>
      </div>

      { }
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="text-green-500" size={24} />
            <span className="text-xs text-gray-500">{completionRate}%</span>
          </div>
          <h3 className="text-sm font-medium text-gray-400 mb-1">{t('statistics.completedTasks')}</h3>
          <p className="text-3xl font-bold text-white">{stats.completed_tasks}</p>
          <p className="text-xs text-gray-500 mt-1">{t('statistics.ofTotal')} {stats.total_tasks} {t('statistics.totalTasks')}</p>
        </div>

        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="text-blue-500" size={24} />
            <Activity className="text-blue-400" size={16} />
          </div>
          <h3 className="text-sm font-medium text-gray-400 mb-1">{t('statistics.inProgressTasks')}</h3>
          <p className="text-3xl font-bold text-white">{stats.in_progress_tasks}</p>
          <p className="text-xs text-gray-500 mt-1">{t('statistics.activeTasks')}</p>
        </div>

        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="text-yellow-500" size={24} />
            <span className="text-xs text-gray-500">{stats.urgent_tasks} {t('statistics.urgentCount')}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-400 mb-1">{t('statistics.pendingTasks')}</h3>
          <p className="text-3xl font-bold text-white">{stats.pending_tasks}</p>
          <p className="text-xs text-gray-500 mt-1">{t('statistics.awaitingAction')}</p>
        </div>

        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-purple-500" size={24} />
            <span className="text-xs text-gray-500">{stats.team_members} {t('statistics.teamCount')}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-400 mb-1">{t('statistics.totalMembers')}</h3>
          <p className="text-3xl font-bold text-white">{stats.total_members}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.clients} {t('statistics.clientsCount')}</p>
        </div>
      </div>

      { }
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FileText className="text-cyan-500" size={20} />
            <div className="flex-1">
              <p className="text-xs text-gray-400">{t('statistics.blogPosts')}</p>
              <p className="text-xl font-bold text-white">{stats.total_blog_posts}</p>
              <p className="text-xs text-gray-500">{stats.published_posts} {t('statistics.published')}</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Calendar className="text-indigo-500" size={20} />
            <div className="flex-1">
              <p className="text-xs text-gray-400">{t('statistics.events')}</p>
              <p className="text-xl font-bold text-white">{stats.total_events}</p>
              <p className="text-xs text-gray-500">{stats.upcoming_events} {t('statistics.upcoming')}</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Ticket className="text-pink-500" size={20} />
            <div className="flex-1">
              <p className="text-xs text-gray-400">{t('statistics.tickets')}</p>
              <p className="text-xl font-bold text-white">{stats.total_tickets}</p>
              <p className="text-xs text-gray-500">{stats.open_tickets} {t('statistics.open')}</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-orange-500" size={20} />
            <div className="flex-1">
              <p className="text-xs text-gray-400">{t('statistics.activeAbsences')}</p>
              <p className="text-xl font-bold text-white">{stats.active_absences}</p>
              <p className="text-xs text-gray-500">{t('statistics.teamMembersAway')}</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Briefcase className="text-green-500" size={20} />
            <div className="flex-1">
              <p className="text-xs text-gray-400">{t('services.title')}</p>
              <p className="text-xl font-bold text-white">{servicesStats?.activeServices || 0}</p>
              <p className="text-xs text-gray-500">${servicesStats?.totalValue?.toLocaleString() || 0} {t('services.stats.total')}</p>
            </div>
          </div>
        </div>
      </div>

      { }
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="text-green-500" size={24} />
            <div className="flex-1">
              <p className="text-sm text-gray-400">{t('statistics.efficiencyScore')}</p>
              <p className="text-2xl font-bold text-white">{completionRate}%</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">{t('statistics.basedOnCompletion')}</p>
        </div>

        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="text-blue-500" size={24} />
            <div className="flex-1">
              <p className="text-sm text-gray-400">{t('statistics.activeWorkload')}</p>
              <p className="text-2xl font-bold text-white">{stats.in_progress_tasks + stats.pending_tasks}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">{t('statistics.tasksBeingWorked')}</p>
        </div>

        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-purple-500" size={24} />
            <div className="flex-1">
              <p className="text-sm text-gray-400">{t('statistics.teamCapacity')}</p>
              <p className="text-2xl font-bold text-white">{stats.team_members}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">{stats.active_absences} {t('statistics.membersAbsent')}</p>
        </div>
      </div>

      { }
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        { }
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">{t('statistics.taskStatusDistribution')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskStatusData}
                cx="50%"
                cy="50%"
                labelLine={{
                  stroke: '#71717a',
                  strokeWidth: 1,
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label={(props: any) => {
                  const { name, percent, x, y } = props;
                  return (
                    <text
                      x={x}
                      y={y}
                      fill="#fff"
                      textAnchor={x > 200 ? 'start' : 'end'}
                      dominantBaseline="central"
                      className="text-sm font-medium"
                    >
                      {`${name}: ${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
                outerRadius={90}
                innerRadius={30}
                paddingAngle={2}
                fill="#8884d8"
                dataKey="value"
              >
                {taskStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#18181b" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
                labelStyle={{ color: '#fafafa', fontWeight: 600 }}
                itemStyle={{ color: '#a1a1aa' }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ color: '#fff', fontSize: '14px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        { }
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">{t('statistics.taskPriorityBreakdown')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taskPriorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
                labelStyle={{ color: '#fafafa', fontWeight: 600 }}
                itemStyle={{ color: '#a1a1aa' }}
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)', stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 }}
              />
              <Bar
                dataKey="value"
                fill="#8884d8"
                activeBar={false}
              >
                {taskPriorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        { }
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">{t('statistics.taskCompletionLast7Days')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.daily_completion}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="day" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
                labelStyle={{ color: '#fafafa', fontWeight: 600 }}
                itemStyle={{ color: '#a1a1aa' }}
              />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        { }
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">{t('statistics.taskCreationLast7Days')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.daily_creation}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="day" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
                labelStyle={{ color: '#fafafa', fontWeight: 600 }}
                itemStyle={{ color: '#a1a1aa' }}
              />
              <Legend />
              <Line type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      { }
      <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">{t('statistics.overallCompletionRate')}</h3>
          <div className="flex items-center gap-2">
            {completionRate >= 70 ? (
              <TrendingUp className="text-green-500" size={24} />
            ) : (
              <TrendingDown className="text-red-500" size={24} />
            )}
            <span className="text-2xl font-bold text-white">{completionRate}%</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-6 bg-zinc-900 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${completionRate >= 70 ? 'bg-green-500' : completionRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
        <div className="mt-3 flex justify-between text-sm text-gray-500">
          <span>{stats.completed_tasks} {t('statistics.completed')}</span>
          <span>{stats.total_tasks} {t('statistics.totalTasksCount')}</span>
        </div>
      </div>
    </div>
  );
};
