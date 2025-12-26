import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getApiUrl } from '../../../config/config';

import type { TeamMember } from '../../../types/dashboard.types';

interface EditMemberFormProps {
  member: TeamMember;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditMemberForm = ({ member, onClose, onSuccess }: EditMemberFormProps) => {
  const { t } = useLanguage();
  const [name, setName] = useState(member.name);
  const [nickname, setNickname] = useState(member.nickname);
  const [email, setEmail] = useState(member.email);
  const [role, setRole] = useState<'team' | 'user' | 'admin' | 'management'>(member.role);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: Partial<TeamMember> & { password?: string } = { name, nickname, email, role };
      if (password) {
        payload.password = password;
      }

      const response = await fetch(getApiUrl(`api/members/${member.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to update member');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 w-full max-w-[95vw] sm:max-w-2xl mx-4 sm:mx-auto my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-white">{t('teamDashboard.editMember')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('common.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('common.nickname')}</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              minLength={3}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('common.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('common.role')}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'team' | 'user')}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
            >
              <option value="user">{t('role.userClient')}</option>
              <option value="team">{t('role.teamEmployee')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('teamDashboard.changePassword')} ({t('teamDashboard.optional')})
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('teamDashboard.leaveEmptyToKeep')}
                minLength={8}
                className="w-full px-4 py-3 pr-12 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium">{t('common.cancel')}</button>
            <button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50">{loading ? t('common.updating') : t('teamDashboard.updateMember')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
