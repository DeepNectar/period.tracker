import { startOfDay } from 'date-fns';
import { v4 as uuid } from 'uuid';
import type { Entry, SymptomLog } from './cycle';

export interface UpsertEntryParams {
  id?: string;
  startDate: string;
  endDate?: string | null;
  intensity: 'spotting' | 'light' | 'medium' | 'heavy';
  notes?: string | null;
}

export function validateDate(dateStr: string): Date {
  const d = startOfDay(new Date(dateStr + 'T00:00:00'));
  if (isNaN(d.getTime())) throw new Error('Invalid date');
  return d;
}

export function upsertEntry(entries: Entry[], params: UpsertEntryParams): Entry[] {
  const startDate = params.startDate;
  const endDate = params.endDate ?? null;

  if (endDate) {
    const s = validateDate(startDate);
    const e = validateDate(endDate);
    if (e < s) throw new Error('End date cannot be before start date');
  }

  const result = [...entries];

  if (params.id) {
    const idx = result.findIndex(e => e.id === params.id);
    if (idx >= 0) {
      result[idx] = { ...result[idx], ...params, endDate };
      return result;
    }
  }

  const existingIdx = result.findIndex(e => e.startDate === startDate);
  if (existingIdx >= 0) {
    result[existingIdx] = { ...result[existingIdx], ...params, endDate };
    return result;
  }

  result.push({
    id: uuid(),
    startDate,
    endDate,
    intensity: params.intensity,
    notes: params.notes ?? null,
  });

  return result.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function processLogLifecycle(
  entries: Entry[],
  date: string,
  periodStart: boolean,
  periodEnd: boolean,
  intensity: 'spotting' | 'light' | 'medium' | 'heavy'
): Entry[] {
  let result = [...entries];

  if (periodStart) {
    const exists = result.find(e => e.startDate === date);
    if (!exists) {
      result = upsertEntry(result, {
        startDate: date,
        endDate: null,
        intensity: intensity === 'spotting' ? 'spotting' : intensity,
      });
    }
  } else {
    if (!periodEnd) {
      result = result.filter(e => e.startDate !== date);
    }
  }

  if (periodEnd) {
    const openEntry = result
      .filter(e => e.endDate === null && e.startDate <= date)
      .sort((a, b) => b.startDate.localeCompare(a.startDate))[0];

    if (openEntry) {
      result = result.map(e =>
        e.id === openEntry.id ? { ...e, endDate: date } : e
      );
    } else {
      result = upsertEntry(result, {
        startDate: date,
        endDate: date,
        intensity: intensity === 'spotting' ? 'light' : intensity,
      });
    }
  } else {
    const endingEntry = result.find(e => e.endDate === date);
    if (endingEntry) {
      result = result.map(e =>
        e.id === endingEntry.id ? { ...e, endDate: null } : e
      );
    }
  }

  return result.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function isLogEmpty(log: Partial<SymptomLog>): boolean {
  return (
    !log.cramps &&
    !log.bloating &&
    !log.headache &&
    !log.breastTenderness &&
    !log.fatigue &&
    !log.acne &&
    !log.libido &&
    (!log.mood || log.mood.length === 0) &&
    !log.sleepQuality &&
    !log.waterIntake &&
    !log.exercise &&
    !log.sexualActivity &&
    !log.contraception &&
    !log.notes &&
    !log.periodStart &&
    !log.periodEnd
  );
}

export function rebuildSpans(logs: SymptomLog[]): Entry[] {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const entries: Entry[] = [];
  let currentStart: string | null = null;

  for (const log of sorted) {
    if (log.periodStart) {
      currentStart = log.date;
    }
    if (log.periodEnd && currentStart) {
      entries.push({
        id: uuid(),
        startDate: currentStart,
        endDate: log.date,
        intensity: 'medium',
        notes: null,
      });
      currentStart = null;
    }
  }

  if (currentStart) {
    entries.push({
      id: uuid(),
      startDate: currentStart,
      endDate: null,
      intensity: 'medium',
      notes: null,
    });
  }

  return entries.sort((a, b) => a.startDate.localeCompare(b.startDate));
}
