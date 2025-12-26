import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { Schedule, TeamMember } from '../../../types/dashboard.types';
import { CreateScheduleForm } from './CreateScheduleForm';
import { getApiUrl } from '../../../config/config';

interface TeamScheduleSectionProps {
  onRefresh?: () => void;
}

export const TeamScheduleSection = ({ onRefresh }: TeamScheduleSectionProps) => {
  const { t } = useLanguage();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    fetchSchedules();
    fetchMembers();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await fetch(getApiUrl('api/schedules'), {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.schedules) setSchedules(data.schedules);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const createSchedule = async (formData: Partial<Schedule>) => {
    try {
      await fetch(getApiUrl('api/schedules'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      fetchSchedules();
      if (onRefresh) onRefresh();
      setShowCreateForm(false);
    } catch {
      // Ignore
    }
  };

  if (loading) return <div className="text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">{t('teamDashboard.workSchedule')}</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
        >
          <Plus size={20} /> {t('teamDashboard.addSchedule')}
        </button>
      </div>

      <div className="grid gap-4">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-semibold">{schedule.user_name}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                    {schedule.schedule_type}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{schedule.title}</h3>
                {schedule.description && <p className="text-gray-400 text-sm mb-2">{schedule.description}</p>}
                <div className="text-sm text-gray-500">
                  {new Date(schedule.start_time).toLocaleString()} - {new Date(schedule.end_time).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreateForm && (
        <CreateScheduleForm
          members={members}
          onClose={() => setShowCreateForm(false)}
          onCreate={createSchedule}
        />
      )}
    </div>
  );
};
