import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getApiUrl } from '../../../config/config';
import { sanitizeText, sanitizeRichContent } from '../../../utils/sanitize';

import type { Ticket, TicketComment } from '../../../types/dashboard.types';

interface UserTicketDetailModalProps {
  ticketId: string;
  onClose: () => void;
}

export const UserTicketDetailModal = ({ ticketId, onClose }: UserTicketDetailModalProps) => {
  const { t } = useLanguage();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const conversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const ticketResponse = await fetch(getApiUrl(`api/tickets/${ticketId}`), {
          credentials: 'include',
        });
        const ticketData = await ticketResponse.json();
        if (isMounted && ticketData.ticket) setTicket(ticketData.ticket);

        const commentsResponse = await fetch(getApiUrl(`api/tickets/${ticketId}/comments`), {
          credentials: 'include',
        });
        const commentsData = await commentsResponse.json();
        if (isMounted && commentsData.comments) setComments(commentsData.comments);
      } catch {
        // Ignore
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [ticketId]);

  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [comments]);

  const fetchComments = async () => {
    try {
      const response = await fetch(getApiUrl(`api/tickets/${ticketId}/comments`), {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.comments) setComments(data.comments);
    } catch {
      // Ignore
    }
  };

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || ticket?.status === 'resolved') return;

    setSending(true);
    try {
      await fetch(getApiUrl(`api/tickets/${ticketId}/comments`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ comment: newComment }),
      });
      setNewComment('');
      fetchComments();
    } catch {
      // Ignore
    } finally {
      setSending(false);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const isResolved = ticket?.status === 'resolved';

  if (!ticket) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
          <p className="text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl w-full max-w-[95vw] sm:max-w-4xl mx-4 sm:mx-auto max-h-[90vh] flex flex-col">
        { }
        <div className="p-6 border-b border-zinc-900">
          <div className="flex items-start justify-between mb-4">
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
              <h2 className="text-2xl font-bold text-white mb-2">{sanitizeText(ticket.title)}</h2>
              <p className="text-gray-400 mb-3" dangerouslySetInnerHTML={{ __html: sanitizeRichContent(ticket.description) }}></p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{t('ticket.status')}: {ticket.status.replace('_', ' ')}</span>
                <span>{new Date(ticket.created_at).toLocaleString()}</span>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        { }
        <div ref={conversationRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">{t('ticket.conversation')}</h3>

          {loading ? (
            <div className="text-gray-400">{t('common.loading')}</div>
          ) : comments.length === 0 ? (
            <div className="text-gray-400 text-center py-8">{t('ticket.noComments')}</div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-zinc-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-white">{sanitizeText(comment.user_name)}</span>
                  <span className="text-gray-500 text-sm">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-300" dangerouslySetInnerHTML={{ __html: sanitizeRichContent(comment.comment) }}></p>
              </div>
            ))
          )}
        </div>

        { }
        <div className="p-6 border-t border-zinc-900">
          {isResolved ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
              <p className="text-yellow-400">{t('ticket.resolvedCannotReply')}</p>
            </div>
          ) : (
            <form onSubmit={sendComment} className="space-y-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('ticket.writeReply')}
                rows={3}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700 resize-none"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={sending || !newComment.trim()}
                  className="flex-1 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? t('common.loading') : t('ticket.sendReply')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
