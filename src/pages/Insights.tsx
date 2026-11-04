import { useMemo } from 'react';
import { format, differenceInCalendarDays } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import { cycleLengthStats, computeStats } from '../lib/cycle';
import { downloadCSV, exportJSON, exportPDF } from '../lib/exportData';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { Download, FileText, BarChart3, TrendingUp } from 'lucide-react';

export default function Insights() {
  const entries = useAppStore(s => s.entries);
  const logs = useAppStore(s => s.logs);
  const settings = useAppStore(s => s.settings);
  const today = format(new Date(), 'yyyy-MM-dd');

  const stats = useMemo(() => computeStats(entries, settings, today), [entries, settings, today]);

  const intervalData = useMemo(() => {
    return stats.intervals.slice(-12).map((length: number, i: number) => ({
      name: `Cycle ${i + 1}`,
      length,
    }));
  }, [stats.intervals]);

  const intervalStats = useMemo(() => cycleLengthStats(stats.intervals), [stats.intervals]);

  const crampsData = useMemo(() => {
    return logs
      .filter(l => l.cramps > 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)
      .map(l => ({
        date: format(new Date(l.date + 'T00:00:00'), 'MMM d'),
        cramps: l.cramps,
      }));
  }, [logs]);

  const fatigueData = useMemo(() => {
    return logs
      .filter(l => l.fatigue > 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)
      .map(l => ({
        date: format(new Date(l.date + 'T00:00:00'), 'MMM d'),
        fatigue: l.fatigue,
      }));
  }, [logs]);

  const heatmapData = useMemo(() => {
    const dayScores: Record<number, number[]> = {};

    logs.forEach(log => {
      const entry = entries.find(e => {
        const end = e.endDate || e.startDate;
        return log.date >= e.startDate && log.date <= end;
      });
      if (!entry) return;

      const cycleDay = differenceInCalendarDays(
        new Date(log.date + 'T00:00:00'),
        new Date(entry.startDate + 'T00:00:00')
      ) + 1;

      if (cycleDay < 1 || cycleDay > 91) return;

      const score = (log.cramps || 0) +
        (log.headache ? 1 : 0) +
        (log.bloating ? 1 : 0) +
        (log.fatigue > 0 ? 1 : 0) +
        (log.acne ? 1 : 0) +
        ((log.mood?.length || 0) > 3 ? 1 : 0);

      if (!dayScores[cycleDay]) dayScores[cycleDay] = [];
      dayScores[cycleDay].push(score);
    });

    return Object.entries(dayScores).map(([day, scores]) => ({
      day: parseInt(day),
      score: scores.reduce((a, b) => a + b, 0) / scores.length,
      count: scores.length,
    })).filter(d => d.count >= 1).slice(0, 30);
  }, [logs, entries]);

  const hasData = logs.length > 0 || entries.length > 0;

  if (!hasData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="text-center py-16">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">No Data Yet</h2>
          <p className="text-sm text-gray-500">
            Start logging your cycle to see insights and trends.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Insights</h1>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCSV(entries, logs)}
            disabled={!hasData}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="Export CSV"
          >
            <Download className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => exportPDF(entries, logs)}
            disabled={!hasData}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="Export PDF"
          >
            <FileText className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => exportJSON(entries, logs, settings)}
            disabled={!hasData}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="Export JSON"
          >
            <FileText className="w-4 h-4 text-rose-500" />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">Avg Cycle</p>
          <p className="text-xl font-bold text-gray-900">{intervalStats.avg}d</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">Shortest</p>
          <p className="text-xl font-bold text-gray-900">{intervalStats.min}d</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">Longest</p>
          <p className="text-xl font-bold text-gray-900">{intervalStats.max}d</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">Variation</p>
          <p className="text-xl font-bold text-gray-900">±{intervalStats.sd}</p>
        </div>
      </div>

      {/* Interval Chart */}
      {intervalData.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rose-500" />
            Cycle Lengths
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={intervalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="length"
                stroke="#e11d48"
                strokeWidth={2}
                dot={{ fill: '#e11d48', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cramps Trend */}
      {crampsData.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Cramps (last 30 days)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={crampsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis domain={[0, 3]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="cramps" radius={[4, 4, 0, 0]}>
                {crampsData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.cramps >= 2 ? '#e11d48' : entry.cramps >= 1 ? '#fb7185' : '#fda4af'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Fatigue Trend */}
      {fatigueData.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Fatigue Level</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={fatigueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="fatigue"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Symptom Heatmap */}
      {heatmapData.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Symptom Intensity by Cycle Day</h3>
          <div className="flex flex-wrap gap-1">
            {heatmapData.map(d => (
              <div
                key={d.day}
                className="w-8 h-8 rounded flex items-center justify-center text-xs font-medium"
                style={{
                  backgroundColor: d.score > 3 ? '#fecdd3' : d.score > 1.5 ? '#fef3c7' : '#dcfce7',
                  color: d.score > 3 ? '#9f1239' : d.score > 1.5 ? '#92400e' : '#166534',
                }}
                title={`Day ${d.day}: score ${d.score.toFixed(1)} (${d.count} samples)`}
              >
                {d.day}
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-100" /> Low
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-100" /> Medium
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-rose-100" /> High
            </span>
          </div>
        </div>
      )}

      {/* Auto Insights */}
      {logs.length >= 3 && (
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-5 border border-rose-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">💡 Auto Insights</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            {(() => {
              const crampsByDay: Record<number, number[]> = {};
              logs.forEach(log => {
                const entry = entries.find(e => {
                  const end = e.endDate || e.startDate;
                  return log.date >= e.startDate && log.date <= end;
                });
                if (!entry || log.cramps === 0) return;
                const cd = differenceInCalendarDays(
                  new Date(log.date + 'T00:00:00'),
                  new Date(entry.startDate + 'T00:00:00')
                ) + 1;
                if (!crampsByDay[cd]) crampsByDay[cd] = [];
                crampsByDay[cd].push(log.cramps);
              });
              const peakDay = Object.entries(crampsByDay)
                .filter(([_, v]) => v.length >= 2)
                .sort((a, b) => {
                  const avgA = a[1].reduce((s, v) => s + v, 0) / a[1].length;
                  const avgB = b[1].reduce((s, v) => s + v, 0) / b[1].length;
                  return avgB - avgA;
                })[0];
              if (peakDay) {
                return <li>• Cramps peak around Day {peakDay[0]} of your cycle</li>;
              }
              return null;
            })()}
            {logs.filter(l => l.headache).length > 0 && (
              <li>• Headaches logged on {logs.filter(l => l.headache).length} days</li>
            )}
            {logs.filter(l => l.bloating).length > 0 && (
              <li>• Bloating reported on {logs.filter(l => l.bloating).length} days</li>
            )}
            <li>• Total logs: {logs.length} days tracked</li>
          </ul>
        </div>
      )}
    </div>
  );
}
