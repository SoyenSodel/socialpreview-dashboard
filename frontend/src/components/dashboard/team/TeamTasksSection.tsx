import { useState, useEffect } from 'react';
import { CheckSquare, Plus, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { Task, TeamMember } from '../../../types/dashboard.types';
import { useAuth } from '../../../contexts/AuthContext';
import { CreateTaskForm } from './CreateTaskForm';
import { getApiUrl } from '../../../config/config';

interface TeamTasksSectionProps {
  onRefresh?: () => void;
}

export const TeamTasksSection = ({ onRefresh }: TeamTasksSectionProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    fetchTasks();
    fetchMembers();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(getApiUrl('api/tasks'), {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.tasks) setTasks(data.tasks);
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

  const createTask = async (formData: Partial<Task>) => {
    try {
      await fetch(getApiUrl('api/tasks'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      fetchTasks();
      if (onRefresh) onRefresh();
      setShowCreateForm(false);
    } catch {
      // Ignore
    }
  };

  const markTaskComplete = async (taskId: string) => {
    try {
      await fetch(getApiUrl(`api/tasks/${taskId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'completed' }),
      });
      fetchTasks();
      if (onRefresh) onRefresh();
    } catch {
      // Ignore
    }
  };

  if (loading) return <div className="text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">{t('teamDashboard.tasks')}</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
        >
          <Plus size={20} />
          {t('teamDashboard.newTask')}
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-12 text-center">
          <CheckSquare className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400 mb-4">{t('teamDashboard.noTasks')}</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            {t('teamDashboard.createFirstTask')}
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.status === 'pending' ? 'bg-gray-500/20 text-gray-400' :
                      task.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                        task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
                      }`}>
                      {t(`teamDashboard.${task.status === 'in_progress' ? 'inProgress' : task.status}`)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.priority === 'low' ? 'bg-gray-500/20 text-gray-400' :
                      task.priority === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                        task.priority === 'high' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                      }`}>
                      {t(`priority.${task.priority}`)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{task.title}</h3>
                  <p className="text-gray-400 text-sm mb-2">{task.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      {t('teamDashboard.assignedTo')}:{' '}
                      {task.assigned_users && task.assigned_users.length > 0
                        ? task.assigned_users.map((u: { name: string }) => u.name).join(', ')
                        : t('common.noMembers')
                      }
                    </span>
                    <span>{t('teamDashboard.createdBy')}: {task.created_by_name}</span>
                    {task.due_date && <span>{t('teamDashboard.due')}: {new Date(task.due_date).toLocaleDateString()}</span>}
                  </div>
                </div>
                {task.status !== 'completed' && task.status !== 'cancelled' &&
                  task.assigned_users && task.assigned_users.some((u: { id: string }) => u.id === user?.id) && (
                    <button
                      onClick={() => markTaskComplete(task.id)}
                      className="ml-4 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
                    >
                      <CheckCircle2 size={18} />
                      {t('teamDashboard.markComplete')}
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateForm && (
        <CreateTaskForm
          members={members}
          onClose={() => setShowCreateForm(false)}
          onCreate={createTask}
        />
      )}
    </div>
  );
};
