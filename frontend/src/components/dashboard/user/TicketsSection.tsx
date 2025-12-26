import { useState, useEffect } from 'react';
import { Plus, MessageSquare, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getApiUrl } from '../../../config/config';

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

interface TicketsSectionProps {
  onCreateTicket: () => void;
  onSelectTicket: (ticketId: string) => void;
}

export const TicketsSection = ({ onCreateTicket, onSelectTicket }: TicketsSectionProps) => {
  const { t } = useLanguage();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchTickets = async () => {
      try {
        const response = await fetch(getApiUrl('api/tickets/my'), {
          credentials: 'include',
        });
        const data = await response.json();
        if (isMounted && data.tickets) {
          setTickets(data.tickets);
        }
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-500/20 text-gray-400';
      case 'medium': return 'bg-blue-500/20 text-blue-400';
      case 'high': return 'bg-yellow-500/20 text-yellow-400';
      case 'urgent': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/20 text-blue-400';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400';
      case 'resolved': return 'bg-green-500/20 text-green-400';
      case 'closed': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">{t('userDashboard.myTickets')}</h2>
        <button
          onClick={onCreateTicket}
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
        >
          <Plus size={20} />
          {t('userDashboard.newTicket')}
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-12 text-center">
          <AlertCircle className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400 mb-4">{t('userDashboard.noTicketsYet')}</p>
          <button
            onClick={onCreateTicket}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            {t('userDashboard.createFirstTicket')}
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6 hover:border-zinc-800 transition-colors cursor-pointer"
              onClick={() => onSelectTicket(ticket.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-500 text-sm font-mono">#{ticket.id.slice(0, 8)}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{ticket.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2">{ticket.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{t('common.created')} {new Date(ticket.created_at).toLocaleDateString()}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTicket(ticket.id);
                  }}
                  className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                >
                  <MessageSquare size={16} />
                  {t('common.viewDetails')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
