import { create } from 'zustand';
import { format } from 'date-fns';
import type { Entry, SymptomLog, Settings } from '../lib/cycle';
import { storage, ENTRIES_KEY, LOGS_KEY, SETTINGS_KEY, AUTH_KEY, PIN_KEY } from '../lib/storage';
import { processLogLifecycle, isLogEmpty, rebuildSpans } from '../lib/data';
import { v4 as uuid } from 'uuid';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  entries: Entry[];
  logs: SymptomLog[];
  settings: Settings;
  localMode: boolean;

  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];
  isAppLocked: boolean;
  pinHash: string | null;

  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;

  saveLog: (log: Partial<SymptomLog>) => Promise<void>;
  deleteLog: (date: string) => Promise<void>;
  updateEntry: (entry: Entry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  toggleLocalMode: () => Promise<void>;

  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  removePin: () => void;
  unlock: () => void;
  lock: () => void;

  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  importData: (data: any) => Promise<{ entries: number; symptoms: number }>;
  deleteAccount: () => Promise<void>;
}

const defaultSettings: Settings = {
  avgCycleLength: 28,
  lutealLength: 14,
  dailyReminderOn: true,
  dailyReminderTime: '20:00',
  periodAlertOn: true,
  fertileWindowOn: true,
  appLockEnabled: false,
};

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'bloom_salt_v1');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  entries: [],
  logs: [],
  settings: defaultSettings,
  localMode: true,
  toasts: [],
  isAppLocked: false,
  pinHash: null,

  init: async () => {
    try {
      const auth = await storage.get<User & { passwordHash: string }>(AUTH_KEY);
      const pinHash = localStorage.getItem(PIN_KEY);
      const settings = await storage.get<Settings>(SETTINGS_KEY);
      const entries = await storage.get<Entry[]>(ENTRIES_KEY);
      const logs = await storage.get<SymptomLog[]>(LOGS_KEY);
      const localMode = localStorage.getItem('bloom:localMode') !== 'false';

      if (auth) {
        set({
          user: { id: auth.id, email: auth.email, name: auth.name },
          isAuthenticated: true,
          settings: settings || defaultSettings,
          entries: entries || [],
          logs: logs || [],
          localMode,
          pinHash,
          isAppLocked: pinHash ? true : false,
        });
      }
    } catch (e) {
      console.error('Init error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const auth = await storage.get<User & { passwordHash: string }>(AUTH_KEY);
    if (!auth) return false;
    if (auth.email !== email) return false;
    const hash = await hashPassword(password);
    if (hash !== auth.passwordHash) return false;
    set({
      user: { id: auth.id, email: auth.email, name: auth.name },
      isAuthenticated: true,
    });
    return true;
  },

  signup: async (email: string, password: string, name?: string) => {
    const existing = await storage.get<any>(AUTH_KEY);
    if (existing && existing.email === email) return false;
    const passwordHash = await hashPassword(password);
    const user = { id: uuid(), email, name, passwordHash };
    await storage.set(AUTH_KEY, user);
    set({
      user: { id: user.id, email: user.email, name: user.name },
      isAuthenticated: true,
    });
    return true;
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, entries: [], logs: [] });
  },

  saveLog: async (logData: Partial<SymptomLog>) => {
    const { logs, entries, localMode } = get();
    const date = logData.date || format(new Date(), 'yyyy-MM-dd');

    if (isLogEmpty(logData)) {
      const newLogs = logs.filter(l => l.date !== date);
      const newEntries = rebuildSpans(newLogs);
      set({ logs: newLogs, entries: newEntries });
      if (localMode) {
        await storage.set(LOGS_KEY, newLogs);
        await storage.set(ENTRIES_KEY, newEntries);
      }
      return;
    }

    const existingIdx = logs.findIndex(l => l.date === date);
    const log: SymptomLog = {
      id: existingIdx >= 0 ? logs[existingIdx].id : uuid(),
      date,
      cramps: logData.cramps || 0,
      bloating: logData.bloating || false,
      headache: logData.headache || false,
      breastTenderness: logData.breastTenderness || false,
      fatigue: logData.fatigue || 0,
      acne: logData.acne || false,
      libido: logData.libido || null,
      mood: logData.mood || [],
      sleepQuality: logData.sleepQuality || null,
      waterIntake: logData.waterIntake || null,
      exercise: logData.exercise || '',
      sexualActivity: logData.sexualActivity || false,
      contraception: logData.contraception || '',
      notes: logData.notes || null,
      periodStart: logData.periodStart || false,
      periodEnd: logData.periodEnd || false,
    };

    let newLogs: SymptomLog[];
    if (existingIdx >= 0) {
      newLogs = [...logs];
      newLogs[existingIdx] = log;
    } else {
      newLogs = [...logs, log].sort((a, b) => a.date.localeCompare(b.date));
    }

    let newEntries = processLogLifecycle(
      entries,
      date,
      log.periodStart,
      log.periodEnd,
      'medium'
    );

    set({ logs: newLogs, entries: newEntries });
    if (localMode) {
      await storage.set(LOGS_KEY, newLogs);
      await storage.set(ENTRIES_KEY, newEntries);
    }
  },

  deleteLog: async (date: string) => {
    const { logs, entries, localMode } = get();
    const newLogs = logs.filter(l => l.date !== date);
    const newEntries = rebuildSpans(newLogs);
    set({ logs: newLogs, entries: newEntries });
    if (localMode) {
      await storage.set(LOGS_KEY, newLogs);
      await storage.set(ENTRIES_KEY, newEntries);
    }
  },

  updateEntry: async (entry: Entry) => {
    const { entries, localMode } = get();
    const newEntries = entries.map(e => e.id === entry.id ? entry : e);
    set({ entries: newEntries });
    if (localMode) {
      await storage.set(ENTRIES_KEY, newEntries);
    }
  },

  deleteEntry: async (id: string) => {
    const { entries, localMode } = get();
    const newEntries = entries.filter(e => e.id !== id);
    set({ entries: newEntries });
    if (localMode) {
      await storage.set(ENTRIES_KEY, newEntries);
    }
  },

  updateSettings: async (newSettings: Partial<Settings>) => {
    const { settings, localMode } = get();
    const updated = { ...settings, ...newSettings };
    set({ settings: updated });
    if (localMode) {
      await storage.set(SETTINGS_KEY, updated);
    }
  },

  toggleLocalMode: async () => {
    const { localMode } = get();
    const newMode = !localMode;
    localStorage.setItem('bloom:localMode', String(newMode));
    set({ localMode: newMode });
  },

  setPin: async (pin: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + 'bloom_pin_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    localStorage.setItem(PIN_KEY, hash);
    const { settings } = get();
    set({ pinHash: hash, settings: { ...settings, appLockEnabled: true } });
  },

  verifyPin: async (pin: string) => {
    const { pinHash } = get();
    if (!pinHash) return false;
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + 'bloom_pin_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    return hash === pinHash;
  },

  removePin: () => {
    localStorage.removeItem(PIN_KEY);
    const { settings } = get();
    set({ pinHash: null, isAppLocked: false, settings: { ...settings, appLockEnabled: false } });
  },

  unlock: () => set({ isAppLocked: false }),
  lock: () => {
    const { pinHash } = get();
    if (pinHash) set({ isAppLocked: true });
  },

  addToast: (message, type = 'info') => {
    const id = uuid();
    set(state => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 2500);
  },

  removeToast: (id: string) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  },

  importData: async (data: any) => {
    const { entries, logs, localMode } = get();
    let importedEntries = 0;
    let importedSymptoms = 0;

    if (data.entries && Array.isArray(data.entries)) {
      for (const e of data.entries) {
        if (!e.startDate) continue;
        const exists = entries.find(ex => ex.startDate === e.startDate);
        if (!exists) {
          entries.push({
            id: uuid(),
            startDate: e.startDate,
            endDate: e.endDate || null,
            intensity: e.intensity || 'medium',
            notes: e.notes || null,
          });
          importedEntries++;
        }
      }
    }

    if (data.symptoms && Array.isArray(data.symptoms)) {
      for (const s of data.symptoms) {
        if (!s.date) continue;
        const existsIdx = logs.findIndex(l => l.date === s.date);
        const log: SymptomLog = {
          id: existsIdx >= 0 ? logs[existsIdx].id : uuid(),
          date: s.date,
          cramps: s.cramps || 0,
          bloating: s.bloating || false,
          headache: s.headache || false,
          breastTenderness: s.breastTenderness || false,
          fatigue: s.fatigue || 0,
          acne: s.acne || false,
          libido: s.libido || null,
          mood: s.mood || [],
          sleepQuality: s.sleepQuality || null,
          waterIntake: s.waterIntake || null,
          exercise: s.exercise || '',
          sexualActivity: s.sexualActivity || false,
          contraception: s.contraception || '',
          notes: s.notes || null,
          periodStart: s.periodStart || false,
          periodEnd: s.periodEnd || false,
        };
        if (existsIdx >= 0) {
          logs[existsIdx] = log;
        } else {
          logs.push(log);
          importedSymptoms++;
        }
      }
    }

    const sortedEntries = entries.sort((a, b) => a.startDate.localeCompare(b.startDate));
    const sortedLogs = logs.sort((a, b) => a.date.localeCompare(b.date));

    set({ entries: sortedEntries, logs: sortedLogs });
    if (localMode) {
      await storage.set(ENTRIES_KEY, sortedEntries);
      await storage.set(LOGS_KEY, sortedLogs);
    }

    if (data.settings) {
      await get().updateSettings(data.settings);
    }

    return { entries: importedEntries, symptoms: importedSymptoms };
  },

  deleteAccount: async () => {
    await storage.clear();
    localStorage.removeItem(PIN_KEY);
    localStorage.removeItem('bloom:localMode');
    set({
      user: null,
      isAuthenticated: false,
      entries: [],
      logs: [],
      settings: defaultSettings,
      pinHash: null,
      isAppLocked: false,
    });
  },
}));
