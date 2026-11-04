import localforage from 'localforage';

const store = localforage.createInstance({
  name: 'bloom-tracker',
  storeName: 'health_data',
});

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    return store.getItem<T>(key);
  },
  async set<T>(key: string, value: T): Promise<T> {
    return store.setItem<T>(key, value);
  },
  async remove(key: string): Promise<void> {
    return store.removeItem(key);
  },
  async clear(): Promise<void> {
    return store.clear();
  },
  async keys(): Promise<string[]> {
    return store.keys();
  },
};

export const PIN_KEY = 'bloom:pin';
export const AUTH_KEY = 'bloom:auth';
export const SETTINGS_KEY = 'bloom:settings';
export const ENTRIES_KEY = 'bloom:entries';
export const LOGS_KEY = 'bloom:logs';
export const CHECKINS_KEY = 'bloom:checkins';
