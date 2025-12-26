import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import { CreateMemberForm } from './CreateMemberForm';
import { EditMemberForm } from './EditMemberForm';
import type { TeamMember } from '../../../types/dashboard.types';
import { getApiUrl } from '../../../config/config';

export const TeamMembersSection = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      const response = await fetch(getApiUrl('api/members'), {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.members) {

        const teamMembers = data.members.filter((m: TeamMember) => m.role === 'team' || m.role === 'management');
        setMembers(teamMembers);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleDeleteMember = async (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member || (member.role !== 'team' && member.role !== 'management')) {
      return;
    }

    try {
      const response = await fetch(getApiUrl(`api/members/${memberId}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setMembers(members.filter(m => m.id !== memberId));
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
        <h2 className="text-3xl font-bold text-white">{t('teamDashboard.members')}</h2>
        {user?.role === 'management' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
          >
            <Plus size={20} />
            {t('teamDashboard.addMember')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <div key={member.id} className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
            {member.profile_picture ? (
              <img
                src={member.profile_picture}
                alt={member.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700 mb-3"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-white font-semibold text-xl mb-3">
                {member.name[0]}
              </div>
            )}
            <h3 className="text-lg font-semibold text-white mb-1">{member.name}</h3>
            <p className="text-gray-400 text-sm mb-2">@{member.nickname}</p>
            <p className="text-gray-500 text-sm mb-3">{member.email}</p>
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
              <span className={`px-2 py-1 rounded text-xs font-medium ${member.role === 'management' ? 'bg-purple-500/20 text-purple-400' :
                member.role === 'team' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                {member.role}
              </span>
              <div className="flex-1"></div>
              {user?.role === 'management' && (
                <>
                  <button
                    onClick={() => {
                      setEditingMember(member);
                      setShowEditForm(true);
                    }}
                    className="p-2 text-gray-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(member.id)}
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

      {showCreateForm && (
        <CreateMemberForm
          role="team"
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            fetchMembers();
            setShowCreateForm(false);
          }}
        />
      )}

      {showEditForm && editingMember && (
        <EditMemberForm
          member={editingMember}
          onClose={() => {
            setShowEditForm(false);
            setEditingMember(null);
          }}
          onSuccess={() => {
            fetchMembers();
            setShowEditForm(false);
            setEditingMember(null);
          }}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">{t('common.confirmDelete')}</h3>
            <p className="text-gray-400 mb-6">{t('common.deleteConfirmMessage')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleDeleteMember(deleteConfirm)}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
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
