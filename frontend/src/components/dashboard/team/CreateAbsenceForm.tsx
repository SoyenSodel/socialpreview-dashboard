import { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { Absence } from '../../../types/dashboard.types';

interface CreateAbsenceFormProps {
  onClose: () => void;
  onCreate: (formData: Partial<Absence>) => void;
}

export const CreateAbsenceForm = ({ onClose, onCreate }: CreateAbsenceFormProps) => {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ reason, description, start_date: startDate, end_date: endDate });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-8 w-full max-w-[95vw] sm:max-w-2xl mx-4 sm:mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">{t('teamDashboard.reportAbsence')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('absence.reasonRequired')}</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder={t('absence.reasonPlaceholder')}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('common.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700 resize-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('common.startDateRequired')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('common.endDateRequired')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium">{t('common.cancel')}</button>
            <button type="submit" className="flex-1 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium">{t('common.report')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
