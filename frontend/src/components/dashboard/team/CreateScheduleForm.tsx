import { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { Schedule, TeamMember } from '../../../types/dashboard.types';

interface CreateScheduleFormProps {
  members: TeamMember[];
  onClose: () => void;
  onCreate: (formData: Partial<Schedule>) => void;
}

export const CreateScheduleForm = ({ members, onClose, onCreate }: CreateScheduleFormProps) => {
  const { t } = useLanguage();
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleType, setScheduleType] = useState<Schedule['schedule_type']>('shift');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ user_id: userId, title, description, schedule_type: scheduleType, start_time: startTime, end_time: endTime });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-8 w-full max-w-[95vw] sm:max-w-2xl mx-4 sm:mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{t('teamDashboard.addScheduleEntry')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('teamDashboard.teamMemberRequired')}</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
            >
              <option value="">{t('common.selectMember')}</option>
              {members.map((member: TeamMember) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('common.titleRequired')}</label>
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
              rows={2}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('common.type')}</label>
            <select
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value as Schedule['schedule_type'])}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
            >
              <option value="shift">{t('scheduleType.shift')}</option>
              <option value="meeting">{t('scheduleType.meeting')}</option>
              <option value="project">{t('scheduleType.project')}</option>
              <option value="deadline">{t('scheduleType.deadline')}</option>
              <option value="other">{t('scheduleType.other')}</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('common.startTimeRequired')}</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('common.endTimeRequired')}</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium">{t('common.cancel')}</button>
            <button type="submit" className="flex-1 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium">{t('teamDashboard.addSchedule')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
