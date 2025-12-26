import { useState, useEffect } from 'react';
import { Plus, Users, Edit, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import type { TeamMember } from '../../../types/dashboard.types';
import { CreateMemberForm } from './CreateMemberForm';
import { EditMemberForm } from './EditMemberForm';
import { getApiUrl } from '../../../config/config';

export const TeamClientsSection = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [clients, setClients] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingClient, setEditingClient] = useState<TeamMember | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      const response = await fetch(getApiUrl('api/members'), {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.members) {

        const userMembers = data.members.filter((m: TeamMember) => m.role === 'user');
        setClients(userMembers);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDeleteClient = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || client.role !== 'user') {
      return;
    }

    try {
      const response = await fetch(getApiUrl(`api/members/${clientId}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setClients(clients.filter(c => c.id !== clientId));
        setDeleteConfirm(null);
      }
    } catch {
      // Ignore
    }
  };

  if (loading) return <div className="text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">{t('teamDashboard.clients')}</h2>
        {user?.role === 'management' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
          >
            <Plus size={20} />
            {t('teamDashboard.addClient')}
          </button>
        )}
      </div>

      {clients.length === 0 ? (
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-12 text-center">
          <Users className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400">{t('teamDashboard.noClients')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div key={client.id} className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
              {client.profile_picture ? (
                <img
                  src={client.profile_picture}
                  alt={client.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700 mb-3"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-white font-semibold text-xl mb-3">
                  {client.name[0]}
                </div>
              )}
              <h3 className="text-lg font-semibold text-white mb-1">{client.name}</h3>
              <p className="text-gray-400 text-sm mb-2">@{client.nickname}</p>
              <p className="text-gray-500 text-sm mb-3">{client.email}</p>
              <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-500/20 text-gray-400">
                  {t('services.client')}
                </span>
                <div className="flex-1"></div>
                {user?.role === 'management' && (
                  <>
                    <button
                      onClick={() => {
                        setEditingClient(client);
                        setShowEditForm(true);
                      }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(client.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateForm && (
        <CreateMemberForm
          role="user"
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            fetchClients();
            setShowCreateForm(false);
          }}
        />
      )}

      {showEditForm && editingClient && (
        <EditMemberForm
          member={editingClient}
          onClose={() => {
            setShowEditForm(false);
            setEditingClient(null);
          }}
          onSuccess={() => {
            fetchClients();
            setShowEditForm(false);
            setEditingClient(null);
          }}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">{t('teamDashboard.confirmDelete')}</h3>
            <p className="text-gray-400 mb-6">{t('teamDashboard.confirmDeleteMessage')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleDeleteClient(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
