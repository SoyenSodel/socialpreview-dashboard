import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { DashboardLayout, useMobileMenu } from './DashboardLayout';
import { getApiUrl } from '../../config/config';
import { LayoutDashboard, Ticket as TicketIcon, CheckCircle2, Settings, Briefcase } from 'lucide-react';
import type { Ticket } from '../../types/dashboard.types';
import { TicketsSection } from './user/TicketsSection';
import { CreateTicketForm } from './user/CreateTicketForm';
import { UserTicketDetailModal } from './user/UserTicketDetailModal';
import { UserOverviewSection } from './user/UserOverviewSection';
import { UserResolvedSection } from './user/UserResolvedSection';
import { UserSettingsSection } from './user/UserSettingsSection';
import { UserServicesSection } from './user/UserServicesSection';

type UserSection = 'overview' | 'tickets' | 'services' | 'resolved' | 'settings';


/**
 * Customer/User facing dashboard.
 * Provides access to ticket management, services, and personal settings.
 */
const UserDashboardContent = () => {
  const [activeSection, setActiveSection] = useState<UserSection>('overview');
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [ticketStats, setTicketStats] = useState({ open: 0, inProgress: 0, resolved: 0 });
  const { t } = useLanguage();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();

  const menuItems: { id: UserSection; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: t('userDashboard.overview'), icon: <LayoutDashboard size={20} /> },
    { id: 'tickets', label: t('userDashboard.myTickets'), icon: <TicketIcon size={20} /> },
    { id: 'services', label: t('userDashboard.services'), icon: <Briefcase size={20} /> },
    { id: 'resolved', label: t('userDashboard.resolved'), icon: <CheckCircle2 size={20} /> },
    { id: 'settings', label: t('userDashboard.settings'), icon: <Settings size={20} /> },
  ];

  useEffect(() => {
    fetchTicketStats();
  }, []);

  /**
   * Loads ticket statistics for the user.
   * Filters tickets by status to calculate counts.
   */
  const fetchTicketStats = async () => {
    try {
      const response = await fetch(getApiUrl('api/tickets/my'), {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch ticket stats');

      const data = await response.json();
      if (data.tickets) {
        const stats = {
          open: data.tickets.filter((t: Ticket) => t.status === 'open').length,
          inProgress: data.tickets.filter((t: Ticket) => t.status === 'in_progress').length,
          resolved: data.tickets.filter((t: Ticket) => t.status === 'resolved').length,
        };
        setTicketStats(stats);
      }
    } catch (error) {
      console.error('Failed to load user ticket statistics:', error);
    }
  };

  const handleSectionChange = (section: UserSection) => {
    setActiveSection(section);
    setIsMobileMenuOpen(false); // Close mobile menu after selection
  };

  return (
    <>
      <div className="flex" style={{ height: 'calc(100dvh - 73px)' }}>
        { }
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        { }
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

        { }
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {activeSection === 'overview' && <UserOverviewSection stats={ticketStats} onNavigate={setActiveSection} />}
            {activeSection === 'tickets' && <TicketsSection onCreateTicket={() => setShowCreateTicket(true)} onSelectTicket={setSelectedTicket} />}
            {activeSection === 'services' && <UserServicesSection />}
            {activeSection === 'resolved' && <UserResolvedSection />}
            {activeSection === 'settings' && <UserSettingsSection />}
          </div>
        </main>
      </div>

      {showCreateTicket && (
        <CreateTicketForm
          onClose={() => setShowCreateTicket(false)}
          onSuccess={() => {
            fetchTicketStats();
            setActiveSection('tickets');
          }}
        />
      )}

      {selectedTicket && (
        <UserTicketDetailModal
          ticketId={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </>
  );
};

export const UserDashboard = () => {
  return (
    <DashboardLayout>
      <UserDashboardContent />
    </DashboardLayout>
  );
};
