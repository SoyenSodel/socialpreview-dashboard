import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { CalendarEvent } from '../../../types/dashboard.types';
import { CreateCalendarEventForm } from './CreateCalendarEventForm';
import { getApiUrl } from '../../../config/config';

export const TeamCalendarSection = () => {
  const { t } = useLanguage();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch(getApiUrl('api/calendar'), {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.events) setEvents(data.events);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (formData: Partial<CalendarEvent>) => {
    try {
      await fetch(getApiUrl('api/calendar'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      fetchEvents();
      setShowCreateForm(false);
    } catch {
      // Ignore
    }
  };

  if (loading) return <div className="text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">{t('teamDashboard.calendar')}</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
        >
          <Plus size={20} /> {t('teamDashboard.addEvent')}
        </button>
      </div>

      <div className="grid gap-4">
        {events.map((event) => (
          <div key={event.id} className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${event.event_type === 'meeting' ? 'bg-blue-500/20 text-blue-400' :
                    event.event_type === 'deadline' ? 'bg-red-500/20 text-red-400' :
                      event.event_type === 'milestone' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                    }`}>
                    {t(`teamDashboard.${event.event_type}`)}
                  </span>
                  {event.all_day && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                      {t('teamDashboard.allDay')}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{event.title}</h3>
                {event.description && <p className="text-gray-400 text-sm mb-2">{event.description}</p>}
                <div className="text-sm text-gray-500">
                  {new Date(event.start_date).toLocaleDateString()}
                  {event.end_date && ` - ${new Date(event.end_date).toLocaleDateString()}`}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreateForm && (
        <CreateCalendarEventForm
          onClose={() => setShowCreateForm(false)}
          onCreate={createEvent}
        />
      )}
    </div>
  );
};
