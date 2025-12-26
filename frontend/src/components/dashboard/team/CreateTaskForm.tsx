import { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

import type { TeamMember, Task } from '../../../types/dashboard.types';

interface CreateTaskFormProps {
  members: TeamMember[];
  onClose: () => void;
  onCreate: (formData: Omit<Task, 'id' | 'created_at' | 'created_by' | 'status'>) => void;
}

export const CreateTaskForm = ({ members, onClose, onCreate }: CreateTaskFormProps) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedMembers, setAssignedMembers] = useState<string[]>([]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleMember = (memberId: string) => {
    setAssignedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (assignedMembers.length === 0) {
      alert(t('common.selectAtLeastOneMember'));
      return;
    }
    onCreate({ title, description, assigned_to: assignedMembers, priority, due_date: dueDate || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-8 w-full max-w-[95vw] sm:max-w-2xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">{t('teamDashboard.createNewTask')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('common.name')} *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('common.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700 resize-none"
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('common.assignedTo')} *</label>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700 text-left flex items-center justify-between"
            >
              <span className="text-sm">
                {assignedMembers.length === 0
                  ? t('common.selectMember')
                  : `${assignedMembers.length} ${assignedMembers.length === 1 ? t('common.memberSelected') : t('common.membersSelected')}`
                }
              </span>
              <svg className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {members.length === 0 ? (
                  <p className="text-gray-500 text-sm p-4">{t('common.noMembers')}</p>
                ) : (
                  <div className="p-2">
                    {members.map((member: TeamMember) => (
                      <label
                        key={member.id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 cursor-pointer transition-colors group"
                      >
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={assignedMembers.includes(member.id)}
                            onChange={() => toggleMember(member.id)}
                            className="sr-only peer"
                          />
                          <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${assignedMembers.includes(member.id)
                            ? 'bg-white border-white'
                            : 'bg-zinc-950 border-zinc-800 group-hover:border-zinc-700'
                            }`}>
                            <svg
                              className={`w-3 h-3 text-zinc-950 transition-opacity duration-200 ${assignedMembers.includes(member.id) ? 'opacity-100' : 'opacity-0'
                                }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <span className="text-white text-sm group-hover:text-gray-300 transition-colors">{member.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('common.priority')}</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
              >
                <option value="low">{t('priority.low')}</option>
                <option value="medium">{t('priority.medium')}</option>
                <option value="high">{t('priority.high')}</option>
                <option value="urgent">{t('priority.urgent')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('common.dueDate')}</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              {t('teamDashboard.createTask')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
