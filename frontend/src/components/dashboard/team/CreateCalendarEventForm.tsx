import { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { CalendarEvent } from '../../../types/dashboard.types';

interface CreateCalendarEventFormProps {
  onClose: () => void;
  onCreate: (formData: Partial<CalendarEvent>) => void;
}

export const CreateCalendarEventForm = ({ onClose, onCreate }: CreateCalendarEventFormProps) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<CalendarEvent['event_type']>('meeting');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allDay, setAllDay] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      title,
      description,
      event_type: eventType,
      start_date: startDate,
      end_date: endDate || undefined,
      all_day: allDay,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-8 w-full max-w-[95vw] sm:max-w-2xl mx-4 sm:mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{t('calendar.addEvent')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('calendar.title')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('calendar.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('calendar.eventType')}</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as CalendarEvent['event_type'])}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
            >
              <option value="meeting">{t('calendar.eventTypes.meeting')}</option>
              <option value="deadline">{t('calendar.eventTypes.deadline')}</option>
              <option value="milestone">{t('calendar.eventTypes.milestone')}</option>
              <option value="reminder">{t('calendar.eventTypes.reminder')}</option>
              <option value="other">{t('calendar.eventTypes.other')}</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('calendar.startDate')}</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('calendar.endDate')}</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="w-4 h-4 rounded bg-zinc-900 border-zinc-800"
            />
            <label htmlFor="allDay" className="text-sm text-gray-300">{t('calendar.allDayEvent')}</label>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium">{t('calendar.cancel')}</button>
            <button type="submit" className="flex-1 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium">{t('calendar.addEventButton')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
