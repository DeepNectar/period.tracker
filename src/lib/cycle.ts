import { differenceInCalendarDays, addDays } from 'date-fns';

export interface Entry {
  id: string;
  startDate: string; // yyyy-MM-dd
  endDate: string | null; // null = ongoing
  intensity: 'spotting' | 'light' | 'medium' | 'heavy';
  notes?: string | null;
}

export interface SymptomLog {
  id: string;
  date: string; // yyyy-MM-dd
  cramps: number; // 0-3
  bloating: boolean;
  headache: boolean;
  breastTenderness: boolean;
  fatigue: number; // 0-5
  acne: boolean;
  libido: 'low' | 'normal' | 'high' | null;
  mood: string[];
  sleepQuality: number | null; // 1-5
  waterIntake: number | null; // 0-20 glasses
  exercise: string;
  sexualActivity: boolean;
  contraception: string;
  notes: string | null;
  periodStart: boolean;
  periodEnd: boolean;
}

export interface Settings {
  avgCycleLength: number; // days, default 28
  lutealLength: number; // days, default 14
  dailyReminderOn: boolean;
  dailyReminderTime: string;
  periodAlertOn: boolean;
  fertileWindowOn: boolean;
  appLockEnabled: boolean;
}

export type CycleState = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';

export interface Stats {
  avgInterval: number;
  personalValue: number;
  lastStart: string | null;
  currentDay: number | null;
  state: CycleState;
  predictedEventDate: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  daysUntilEvent: number | null;
  daysUntilNextState: number | null;
  intervals: number[];
}

export const STATE_META: Record<CycleState, { label: string; tip: string; colorClass: string; emoji: string }> = {
  menstrual: {
    label: 'Menstrual Phase',
    tip: 'Rest and nourish your body. Gentle movement and warmth can help.',
    colorClass: 'bg-rose-100 text-rose-900 border-rose-300',
    emoji: '🌹',
  },
  follicular: {
    label: 'Follicular Phase',
    tip: 'Energy is rising. Great time for new projects and socializing.',
    colorClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    emoji: '🌱',
  },
  ovulatory: {
    label: 'Ovulatory Phase',
    tip: 'Peak energy and confidence. Fertility is highest.',
    colorClass: 'bg-violet-100 text-violet-900 border-violet-300',
    emoji: '🌸',
  },
  luteal: {
    label: 'Luteal Phase',
    tip: 'PMS symptoms may appear. Prioritize self-care and rest.',
    colorClass: 'bg-amber-100 text-amber-900 border-amber-300',
    emoji: '🍂',
  },
  unknown: {
    label: 'No Data Yet',
    tip: 'Log your first period to start tracking your cycle.',
    colorClass: 'bg-gray-100 text-gray-700 border-gray-300',
    emoji: '🌷',
  },
};

export const INTENSITY_COLORS: Record<string, string> = {
  spotting: '#fbd5e0',
  light: '#f7a8c4',
  medium: '#e0455f',
  heavy: '#9f1239',
};

export const INTENSITY_LABELS: Record<string, string> = {
  spotting: 'Spotting',
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
};

export const ICON_MAP: Record<string, string> = {
  spotting: '💧',
  light: '🩸',
  medium: '🌺',
  heavy: '🔴',
};

export function computeStats(entries: Entry[], settings: Settings, today: string): Stats {
  const todayDate = new Date(today + 'T00:00:00');
  const sorted = [...entries]
    .filter(e => e.startDate)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const starts = sorted.map(e => e.startDate);
  const intervals: number[] = [];

  for (let i = 1; i < starts.length; i++) {
    const d1 = new Date(starts[i - 1] + 'T00:00:00');
    const d2 = new Date(starts[i] + 'T00:00:00');
    const diff = differenceInCalendarDays(d2, d1);
    if (diff >= 15 && diff <= 60) {
      intervals.push(diff);
    }
  }

  const avgInterval = intervals.length > 0
    ? intervals.reduce((a, b) => a + b, 0) / intervals.length
    : settings.avgCycleLength;

  const lastStart = starts.length > 0 ? starts[starts.length - 1] : null;
  const currentDay = lastStart ? differenceInCalendarDays(todayDate, new Date(lastStart + 'T00:00:00')) + 1 : null;

  let state: CycleState = 'unknown';
  let daysUntilNextState: number | null = null;

  if (currentDay !== null) {
    if (currentDay <= 5) {
      state = 'menstrual';
      daysUntilNextState = 5 - currentDay + 1;
    } else if (currentDay < avgInterval - settings.lutealLength - 3) {
      state = 'follicular';
      daysUntilNextState = (avgInterval - settings.lutealLength - 3) - currentDay;
    } else if (currentDay <= avgInterval - settings.lutealLength + 2) {
      state = 'ovulatory';
      daysUntilNextState = (avgInterval - settings.lutealLength + 2) - currentDay;
    } else {
      state = 'luteal';
      daysUntilNextState = avgInterval - currentDay;
    }
  }

  const predictedEventDate = lastStart
    ? addDays(new Date(lastStart + 'T00:00:00'), Math.round(avgInterval)).toISOString().slice(0, 10)
    : null;

  const windowStart = predictedEventDate
    ? addDays(new Date(predictedEventDate + 'T00:00:00'), -5).toISOString().slice(0, 10)
    : null;
  const windowEnd = predictedEventDate
    ? addDays(new Date(predictedEventDate + 'T00:00:00'), 1).toISOString().slice(0, 10)
    : null;

  const daysUntilEvent = predictedEventDate
    ? differenceInCalendarDays(new Date(predictedEventDate + 'T00:00:00'), todayDate)
    : null;

  return {
    avgInterval: Math.round(avgInterval * 10) / 10,
    personalValue: settings.avgCycleLength,
    lastStart,
    currentDay,
    state,
    predictedEventDate,
    windowStart,
    windowEnd,
    daysUntilEvent,
    daysUntilNextState,
    intervals,
  };
}

export function cycleLengthStats(intervals: number[]) {
  if (intervals.length === 0) return { avg: 0, min: 0, max: 0, sd: 0 };
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const min = Math.min(...intervals);
  const max = Math.max(...intervals);
  const variance = intervals.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / intervals.length;
  const sd = Math.sqrt(variance);
  return {
    avg: Math.round(avg * 10) / 10,
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
    sd: Math.round(sd * 10) / 10,
  };
}
