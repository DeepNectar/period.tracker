import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import { INTENSITY_COLORS } from '../lib/cycle';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LogModal from '../components/LogModal';

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const logs = useAppStore(s => s.logs);
  const entries = useAppStore(s => s.entries);
  const settings = useAppStore(s => s.settings);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const startPadding = getDay(days[0]);

  const getLogForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return logs.find(l => l.date === dateStr);
  };

  const getEntryForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return entries.find(e => {
      const end = e.endDate || e.startDate;
      return dateStr >= e.startDate && dateStr <= end;
    });
  };

  const isInFertileWindow = (date: Date) => {
    if (!settings.fertileWindowOn) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    // Simple fertile window: around ovulation (cycle day ~14 for 28-day cycle)
    const entry = entries.find(e => {
      const end = e.endDate || e.startDate;
      return dateStr >= e.startDate && dateStr <= end;
    });
    if (!entry) return false;
    const cycleDay = Math.floor((new Date(dateStr + 'T00:00:00').getTime() - new Date(entry.startDate + 'T00:00:00').getTime()) / 86400000) + 1;
    const ovulationDay = settings.avgCycleLength - settings.lutealLength;
    return cycleDay >= ovulationDay - 2 && cycleDay <= ovulationDay + 1;
  };

  const getDayColor = (date: Date) => {
    const entry = getEntryForDate(date);
    if (entry) {
      return INTENSITY_COLORS[entry.intensity] || '';
    }
    return '';
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Padding */}
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}

        {/* Days */}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const color = getDayColor(day);
          const today = isToday(day);
          const inFertile = isInFertileWindow(day);

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative transition-all hover:scale-105
                ${today ? 'ring-2 ring-rose-400 ring-offset-1' : ''}
                ${inFertile ? 'bg-violet-50' : ''}
              `}
            >
              <span className={`text-xs font-medium ${today ? 'text-rose-600' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </span>
              {color && (
                <div
                  className="w-2 h-2 rounded-full mt-0.5"
                  style={{ backgroundColor: color }}
                />
              )}
              {inFertile && !color && (
                <span className="text-[8px] text-violet-400">•</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: INTENSITY_COLORS.spotting }} />
          <span className="text-xs text-gray-500">Spotting</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: INTENSITY_COLORS.light }} />
          <span className="text-xs text-gray-500">Light</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: INTENSITY_COLORS.medium }} />
          <span className="text-xs text-gray-500">Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: INTENSITY_COLORS.heavy }} />
          <span className="text-xs text-gray-500">Heavy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-violet-200" />
          <span className="text-xs text-gray-500">Fertile</span>
        </div>
      </div>

      {/* Period spans info */}
      {entries.length > 0 && (
        <div className="mt-6 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Periods</h3>
          <div className="space-y-2">
            {entries.slice(-5).reverse().map(entry => (
              <div key={entry.id} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: INTENSITY_COLORS[entry.intensity] }} />
                <span className="text-gray-700">
                  {entry.startDate} → {entry.endDate || 'ongoing'}
                </span>
                <span className="text-xs text-gray-400 ml-auto">{entry.intensity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log Modal */}
      {selectedDate && (
        <LogModal
          date={selectedDate}
          existingLog={logs.find(l => l.date === selectedDate)}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
