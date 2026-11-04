import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { computeStats } from '../lib/cycle';
import { format } from 'date-fns';
import { Bell, BellOff, Clock, Flower } from 'lucide-react';

export default function Notifications() {
  const settings = useAppStore(s => s.settings);
  const updateSettings = useAppStore(s => s.updateSettings);
  const entries = useAppStore(s => s.entries);
  const addToast = useAppStore(s => s.addToast);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const today = format(new Date(), 'yyyy-MM-dd');
  const stats = computeStats(entries, settings, today);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        addToast('Notifications enabled!', 'success');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Notifications</h1>

      {/* Permission Status */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          {permission === 'granted' ? (
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-emerald-600" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <BellOff className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Browser Notifications</h3>
            <p className="text-xs text-gray-500">
              {permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Blocked' : 'Not configured'}
            </p>
          </div>
        </div>

        {permission !== 'granted' && (
          <button
            onClick={requestPermission}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-medium py-2.5 rounded-xl transition-colors"
          >
            Enable Notifications
          </button>
        )}
      </div>

      {/* Reminder Settings */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-rose-500" />
          Daily Reminder
        </h3>

        <label className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Enable daily reminder</span>
          <input
            type="checkbox"
            checked={settings.dailyReminderOn}
            onChange={e => updateSettings({ dailyReminderOn: e.target.checked })}
            className="w-5 h-5 rounded text-rose-500"
          />
        </label>

        {settings.dailyReminderOn && (
          <div>
            <label className="block text-sm text-gray-600 mb-1">Reminder Time</label>
            <input
              type="time"
              value={settings.dailyReminderTime}
              onChange={e => updateSettings({ dailyReminderTime: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
        )}
      </div>

      {/* Alert Settings */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Alert Types</h3>

        <label className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-700">Upcoming Period Alert</span>
            <p className="text-xs text-gray-400">Alert when your period is approaching</p>
          </div>
          <input
            type="checkbox"
            checked={settings.periodAlertOn}
            onChange={e => updateSettings({ periodAlertOn: e.target.checked })}
            className="w-5 h-5 rounded text-rose-500"
          />
        </label>

        <label className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-700 flex items-center gap-1">
              <Flower className="w-3 h-3" />
              Fertile Window Highlight
            </span>
            <p className="text-xs text-gray-400">Highlight fertile days on calendar</p>
          </div>
          <input
            type="checkbox"
            checked={settings.fertileWindowOn}
            onChange={e => updateSettings({ fertileWindowOn: e.target.checked })}
            className="w-5 h-5 rounded text-rose-500"
          />
        </label>
      </div>

      {/* Upcoming Period */}
      {stats.predictedEventDate && (
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-5 border border-rose-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">🩸 Next Predicted Period</h3>
          <p className="text-sm text-gray-700">
            {stats.windowStart && stats.windowEnd ? (
              <>
                Expected window: <span className="font-medium">{stats.windowStart}</span> → <span className="font-medium">{stats.windowEnd}</span>
              </>
            ) : (
              'Not enough data to predict'
            )}
          </p>
          {stats.daysUntilEvent !== null && (
            <p className="text-xs text-gray-500 mt-1">
              {stats.daysUntilEvent > 0 ? `${stats.daysUntilEvent} days away` : 'Due today or overdue!'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
