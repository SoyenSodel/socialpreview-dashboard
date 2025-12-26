import { useState, useEffect } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { TeamTicketDetailModal } from './TeamTicketDetailModal';
import type { Ticket } from '../../../types/dashboard.types';
import { getApiUrl } from '../../../config/config';

export const TeamTicketsSection = () => {
  const { t } = useLanguage();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTickets = async () => {
      try {
        const response = await fetch(getApiUrl('api/tickets/all'), {
          credentials: 'include',
        });
        const data = await response.json();
        if (isMounted && data.tickets) setTickets(data.tickets);
      } catch {
        // Ignore
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTickets();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch(getApiUrl('api/tickets/all'), {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.tickets) setTickets(data.tickets);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = statusFilter === 'all'
    ? tickets
    : tickets.filter(ticket => ticket.status === statusFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/20 text-blue-400';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400';
      case 'resolved': return 'bg-green-500/20 text-green-400';
      case 'closed': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) return <div className="text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">{t('ticket.allTickets')}</h2>
          <p className="text-gray-400 mt-1">{filteredTickets.length} {t('teamDashboard.ticketsCount')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors font-medium ${statusFilter === 'all'
              ? 'bg-white text-black'
              : 'bg-zinc-900 text-gray-400 hover:text-white'
              }`}
          >
            {t('teamDashboard.all')}
          </button>
          <button
            onClick={() => setStatusFilter('open')}
            className={`px-4 py-2 rounded-lg transition-colors font-medium ${statusFilter === 'open'
              ? 'bg-blue-500 text-white'
              : 'bg-zinc-900 text-gray-400 hover:text-white'
              }`}
          >
            {t('teamDashboard.open')}
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-4 py-2 rounded-lg transition-colors font-medium ${statusFilter === 'in_progress'
              ? 'bg-yellow-500 text-white'
              : 'bg-zinc-900 text-gray-400 hover:text-white'
              }`}
          >
            {t('teamDashboard.inProgress')}
          </button>
          <button
            onClick={() => setStatusFilter('resolved')}
            className={`px-4 py-2 rounded-lg transition-colors font-medium ${statusFilter === 'resolved'
              ? 'bg-green-500 text-white'
              : 'bg-zinc-900 text-gray-400 hover:text-white'
              }`}
          >
            {t('teamDashboard.resolved')}
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredTickets.map((ticket) => (
          <div
            key={ticket.id}
            onClick={() => setSelectedTicket(ticket)}
            className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6 hover:border-zinc-700 cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500 text-sm font-mono">#{ticket.id.slice(0, 8)}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {t(`ticketStatus.${ticket.status === 'in_progress' ? 'inProgress' : ticket.status}`)}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                    {t(`priority.${ticket.priority}`)}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{ticket.title}</h3>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{ticket.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{t('ticket.from')} {ticket.user_name}</span>
                  <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedTicket && (
        <TeamTicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={fetchTickets}
        />
      )}
    </div>
  );
};
