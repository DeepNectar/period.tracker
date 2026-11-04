import { useMemo } from 'react';
import { format } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import { computeStats, STATE_META, INTENSITY_COLORS, INTENSITY_LABELS } from '../lib/cycle';
import { Flower2, TrendingUp, Calendar, Sparkles, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const entries = useAppStore(s => s.entries);
  const logs = useAppStore(s => s.logs);
  const settings = useAppStore(s => s.settings);
  const today = format(new Date(), 'yyyy-MM-dd');

  const stats = useMemo(() => computeStats(entries, settings, today), [entries, settings, today]);
  const stateMeta = STATE_META[stats.state];

  const todayLog = logs.find(l => l.date === today);
  const recentLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const progressPercent = stats.currentDay && stats.avgInterval
    ? Math.max(0, Math.min(100, (stats.currentDay / stats.avgInterval) * 100))
    : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* State Banner */}
      <div className={`rounded-2xl p-6 border ${stateMeta.colorClass}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{stateMeta.emoji}</span>
          <div>
            <h2 className="text-xl font-bold">{stateMeta.label}</h2>
            {stats.currentDay && (
              <p className="text-sm opacity-80">Cycle Day {stats.currentDay}</p>
            )}
          </div>
        </div>
        <p className="text-sm opacity-90">{stateMeta.tip}</p>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs opacity-70 mb-1">
            <span>Cycle Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/60 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-rose-500 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium text-gray-500">Next Period</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.daysUntilEvent !== null ? (stats.daysUntilEvent > 0 ? `${stats.daysUntilEvent}d` : 'Today') : '—'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-purple-500 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium text-gray-500">Avg Cycle</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.avgInterval > 0 ? `${stats.avgInterval}d` : '—'}
          </p>
        </div>
      </div>

      {/* Today's Status */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Today</h3>
          <span className="text-xs text-gray-400">{format(new Date(), 'EEEE, MMM d')}</span>
        </div>
        {todayLog ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                <Flower2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {todayLog.cramps > 0 ? `Cramps: ${todayLog.cramps}/3` : 'No cramps'}
                  {todayLog.fatigue > 0 && ` • Fatigue: ${todayLog.fatigue}/5`}
                </p>
                <p className="text-xs text-gray-500">
                  {todayLog.periodStart ? '🩸 Period started' : todayLog.periodEnd ? 'Period ended' : 'Tracking'}
                </p>
              </div>
            </div>
            {todayLog.mood.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {todayLog.mood.map((m: string) => (
                  <span key={m} className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-xs">
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400 text-sm">No log for today</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 mt-2 text-rose-500 text-sm font-medium hover:text-rose-600"
            >
              Tap + to log <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* Recent Logs */}
      {recentLogs.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Recent</h3>
            <Link to="/calendar" className="text-xs text-rose-500 hover:text-rose-600 font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className={`w-3 h-3 rounded-full ${
                  log.cramps >= 2 ? 'bg-rose-500' :
                  log.cramps >= 1 ? 'bg-rose-300' : 'bg-emerald-400'
                }`} />
                <span className="text-sm text-gray-600 flex-1">
                  {format(new Date(log.date + 'T00:00:00'), 'MMM d')}
                </span>
                <span className="text-xs text-gray-400">
                  {log.periodStart ? '🩸 Start' : log.periodEnd ? 'End' : log.cramps > 0 ? `${log.cramps}/3 cramps` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {logs.length === 0 && entries.length === 0 && (
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-8 text-center border border-rose-100">
          <span className="text-5xl mb-4 block">🌸</span>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Welcome to Bloom</h3>
          <p className="text-sm text-gray-600 mb-4">
            Track your cycle, symptoms, and get personalized insights — all privately on your device.
          </p>
          <p className="text-xs text-gray-400">
            <Sparkles className="w-3 h-3 inline mr-1" />
            Your data never leaves this device
          </p>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-3">
        <Link to="/insights" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
          <TrendingUp className="w-5 h-5 text-rose-500 mx-auto mb-1" />
          <span className="text-xs font-medium text-gray-700">Insights</span>
        </Link>
        <Link to="/calendar" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
          <Calendar className="w-5 h-5 text-purple-500 mx-auto mb-1" />
          <span className="text-xs font-medium text-gray-700">Calendar</span>
        </Link>
        <Link to="/settings" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
          <Sparkles className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <span className="text-xs font-medium text-gray-700">Settings</span>
        </Link>
      </div>
    </div>
  );
}
