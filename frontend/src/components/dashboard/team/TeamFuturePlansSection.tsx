import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { Plan } from '../../../types/dashboard.types';
import { CreateFuturePlanForm } from './CreateFuturePlanForm';
import { getApiUrl } from '../../../config/config';

export const TeamFuturePlansSection = () => {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(getApiUrl('api/plans'), {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.plans) setPlans(data.plans);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (formData: Partial<Plan>) => {
    try {
      await fetch(getApiUrl('api/plans'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      fetchPlans();
      setShowCreateForm(false);
    } catch {
      // Ignore
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      await fetch(getApiUrl(`api/plans/${planId}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      fetchPlans();
    } catch {
      // Ignore
    }
  };

  if (loading) return <div className="text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">{t('teamDashboard.futurePlans')}</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
        >
          <Plus size={20} /> {t('teamDashboard.addPlan')}
        </button>
      </div>

      <div className="grid gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${plan.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                    plan.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      plan.priority === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                    }`}>
                    {plan.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${plan.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    plan.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                      plan.status === 'planned' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                    }`}>
                    {plan.status.replace('_', ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                    {plan.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{plan.title}</h3>
                <p className="text-gray-400 text-sm mb-3">{plan.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{t('common.by')} {plan.created_by_name}</span>
                  {plan.target_date && <span>{t('common.target')}: {new Date(plan.target_date).toLocaleDateString()}</span>}
                </div>
              </div>
              <button
                onClick={() => deletePlan(plan.id)}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreateForm && (
        <CreateFuturePlanForm
          onClose={() => setShowCreateForm(false)}
          onCreate={createPlan}
        />
      )}
    </div>
  );
};
