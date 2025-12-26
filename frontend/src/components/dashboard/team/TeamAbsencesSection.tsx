import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { Absence } from '../../../types/dashboard.types';
import { CreateAbsenceForm } from './CreateAbsenceForm';
import { getApiUrl } from '../../../config/config';

interface TeamAbsencesSectionProps {
  onRefresh?: () => void;
}

export const TeamAbsencesSection = ({ onRefresh }: TeamAbsencesSectionProps) => {
  const { t } = useLanguage();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchAbsences();
  }, []);

  const fetchAbsences = async () => {
    try {
      const response = await fetch(getApiUrl('api/absences'), {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.absences) setAbsences(data.absences);
    } catch {
      // Ignore errors
    } finally {
      setLoading(false);
    }
  };

  const createAbsence = async (formData: Partial<Absence>) => {
    try {
      await fetch(getApiUrl('api/absences'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      fetchAbsences();
      if (onRefresh) onRefresh();
      setShowCreateForm(false);
    } catch {
      // Ignore errors
    }
  };

  if (loading) return <div className="text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">{t('teamDashboard.absences')}</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
        >
          <Plus size={20} />
          {t('teamDashboard.reportAbsence')}
        </button>
      </div>

      <div className="grid gap-4">
        {absences.map((absence) => (
          <div key={absence.id} className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-semibold">{absence.user_name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${absence.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    absence.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                    {absence.status === 'pending' ? t('absenceStatus.pending') :
                      absence.status === 'approved' ? t('absenceStatus.inProgress') :
                        t('absenceStatus.ended')}
                  </span>
                </div>
                <p className="text-gray-400 mb-2">{absence.reason}</p>
                <div className="text-sm text-gray-500">
                  {new Date(absence.start_date).toLocaleDateString()} - {new Date(absence.end_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreateForm && (
        <CreateAbsenceForm
          onClose={() => setShowCreateForm(false)}
          onCreate={createAbsence}
        />
      )}
    </div>
  );
};
