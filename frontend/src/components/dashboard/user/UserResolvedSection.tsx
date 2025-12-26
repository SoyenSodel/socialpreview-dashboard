import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { Ticket } from '../../../types/dashboard.types';
import { getApiUrl } from '../../../config/config';

export const UserResolvedSection = () => {
  const { t } = useLanguage();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResolvedTickets = async () => {
      try {
        const response = await fetch(getApiUrl('api/tickets/my'), {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.tickets) {
          setTickets(data.tickets.filter((t: Ticket) => t.status === 'resolved' || t.status === 'closed'));
        }
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    };
    fetchResolvedTickets();
  }, []);

  if (loading) return <div className="text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">{t('userDashboard.resolved')}</h2>
      {tickets.length === 0 ? (
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-12 text-center">
          <CheckCircle2 className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400">{t('userDashboard.noResolvedTickets')}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-500 text-sm font-mono">#{ticket.id.slice(0, 8)}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
                      {ticket.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{ticket.title}</h3>
                  <p className="text-gray-400 text-sm">{ticket.description}</p>
                </div>
              </div>
              {ticket.resolved_at && (
                <p className="text-sm text-gray-500">Resolved {new Date(ticket.resolved_at).toLocaleDateString()}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
