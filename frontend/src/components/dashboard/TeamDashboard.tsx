import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { DashboardStats } from '../../types/dashboard.types';
import { DashboardLayout, useMobileMenu } from './DashboardLayout';
import { getApiUrl } from '../../config/config';
import { TeamTicketsSection } from './team/TeamTicketsSection';
import { TeamOverviewSection } from './team/TeamOverviewSection';
import { TeamTasksSection } from './team/TeamTasksSection';
import { TeamAbsencesSection } from './team/TeamAbsencesSection';
import { TeamNewsSection } from './team/TeamNewsSection';
import { TeamFuturePlansSection } from './team/TeamFuturePlansSection';
import { TeamScheduleSection } from './team/TeamScheduleSection';
import { TeamMembersSection } from './team/TeamMembersSection';
import { TeamClientsSection } from './team/TeamClientsSection';
import { TeamBlogSection } from './team/TeamBlogSection';
import { TeamCalendarSection } from './team/TeamCalendarSection';
import { TeamStatsSection } from './team/TeamStatsSection';
import { TeamSettingsSection } from './team/TeamSettingsSection';
import { TeamServicesSection } from './team/TeamServicesSection';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Megaphone,
  Clock,
  Users,
  FileText,
  CalendarDays,
  TrendingUp,
  Settings,
  Ticket,
  Target,
  Briefcase,
} from 'lucide-react';

type TeamSection = 'overview' | 'tasks' | 'absences' | 'news' | 'plans' | 'schedule' | 'members' | 'clients' | 'services' | 'tickets' | 'blog' | 'calendar' | 'stats' | 'settings';

/**
 * Main dashboard view for Team and Management roles.
 * Manages state for different administrative sections.
 */
const TeamDashboardContent = () => {
  const [activeSection, setActiveSection] = useState<TeamSection>('overview');
  const [statistics, setStatistics] = useState<DashboardStats | null>(null);
  const { t } = useLanguage();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();

  useEffect(() => {
    fetchStatistics();
  }, []);

  /**
   * Loads aggregate statistics for the dashboard widgets.
   */
  const fetchStatistics = async () => {
    try {
      const response = await fetch(getApiUrl('api/statistics'), {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch statistics');

      const data = await response.json();
      if (data.statistics) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Dashboard statistics load failed:', error);
    }
  };

  const menuItems: { id: TeamSection; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: t('teamDashboard.overview'), icon: <LayoutDashboard size={20} /> },
    { id: 'tasks', label: t('teamDashboard.tasks'), icon: <CheckSquare size={20} /> },
    { id: 'absences', label: t('teamDashboard.absences'), icon: <Calendar size={20} /> },
    { id: 'news', label: t('teamDashboard.news'), icon: <Megaphone size={20} /> },
    { id: 'plans', label: t('teamDashboard.futurePlans'), icon: <Target size={20} /> },
    { id: 'schedule', label: t('teamDashboard.schedule'), icon: <Clock size={20} /> },
    { id: 'members', label: t('teamDashboard.members'), icon: <Users size={20} /> },
    { id: 'clients', label: t('teamDashboard.clients'), icon: <Users size={20} /> },
    { id: 'services', label: t('teamDashboard.services'), icon: <Briefcase size={20} /> },
    { id: 'tickets', label: t('teamDashboard.tickets'), icon: <Ticket size={20} /> },
    { id: 'blog', label: t('teamDashboard.blog'), icon: <FileText size={20} /> },
    { id: 'calendar', label: t('teamDashboard.calendar'), icon: <CalendarDays size={20} /> },
    { id: 'stats', label: t('teamDashboard.stats'), icon: <TrendingUp size={20} /> },
    { id: 'settings', label: t('teamDashboard.settings'), icon: <Settings size={20} /> },
  ];

  const handleSectionChange = (section: TeamSection) => {
    setActiveSection(section);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex" style={{ height: 'calc(100dvh - 73px)' }}>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static left-0 z-30
          w-64 border-r border-zinc-900 bg-zinc-950/95 backdrop-blur-xl overflow-y-auto
          transform transition-transform duration-300 ease-in-out lg:transform-none
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ top: '73px', bottom: 0, height: 'calc(100dvh - 73px)' }}
      >
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeSection === item.id
                ? 'bg-white text-black font-medium'
                : 'text-gray-400 hover:text-white hover:bg-zinc-900'
                }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          {activeSection === 'overview' && <TeamOverviewSection stats={statistics} />}
          {activeSection === 'tasks' && <TeamTasksSection onRefresh={fetchStatistics} />}
          {activeSection === 'absences' && <TeamAbsencesSection onRefresh={fetchStatistics} />}
          {activeSection === 'news' && <TeamNewsSection onRefresh={fetchStatistics} />}
          {activeSection === 'plans' && <TeamFuturePlansSection />}
          {activeSection === 'schedule' && <TeamScheduleSection onRefresh={fetchStatistics} />}
          {activeSection === 'members' && <TeamMembersSection />}
          {activeSection === 'clients' && <TeamClientsSection />}
          {activeSection === 'services' && <TeamServicesSection onRefresh={fetchStatistics} />}
          {activeSection === 'tickets' && <TeamTicketsSection />}
          {activeSection === 'blog' && <TeamBlogSection onRefresh={fetchStatistics} />}
          {activeSection === 'calendar' && <TeamCalendarSection />}
          {activeSection === 'stats' && <TeamStatsSection stats={statistics} onRefresh={fetchStatistics} />}
          {activeSection === 'settings' && <TeamSettingsSection />}
        </div>
      </main>
    </div>
  );
};

export const TeamDashboard = () => {
  return (
    <DashboardLayout>
      <TeamDashboardContent />
    </DashboardLayout>
  );
};
