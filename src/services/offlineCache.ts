import { handleMockApiRequest } from './mockApi';

const databaseName = 'berzowanley-library-offline';
const storeName = 'api-cache';
const databaseVersion = 1;
let databasePromise: Promise<IDBDatabase> | null = null;

const setOfflineFallback = (active: boolean) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('library:offline-fallback', { detail: active }));
  }
};

const openDatabase = (): Promise<IDBDatabase> => {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open offline cache.'));
  });
  return databasePromise;
};

const getCached = async <T>(key: string): Promise<T | undefined> => {
  try {
    const database = await openDatabase();
    return await new Promise<T | undefined>((resolve, reject) => {
      const request = database.transaction(storeName, 'readonly').objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error ?? new Error('Could not read offline cache.'));
    });
  } catch (error) {
    console.error('Could not read the library offline cache.', error);
    return undefined;
  }
};

const saveCached = async <T>(key: string, value: T): Promise<void> => {
  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(storeName, 'readwrite').objectStore(storeName).put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error('Could not update offline cache.'));
    });
  } catch (error) {
    console.error('Could not update the library offline cache.', error);
  }
};

const isNetworkFailure = (error: unknown) => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  if (error instanceof TypeError) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /failed to fetch|fetch failed|network error|offline|connection refused|timed? out/i.test(message);
};

export async function readWithOfflineFallback<T>(
  cacheKey: string,
  readOnline: () => Promise<T>,
  mockPath?: string,
): Promise<T> {
  try {
    const data = await readOnline();
    await saveCached(cacheKey, data);
    setOfflineFallback(false);
    return data;
  } catch (error) {
    if (!isNetworkFailure(error)) throw error;

    setOfflineFallback(true);
    const cached = await getCached<T>(cacheKey);
    if (cached !== undefined) return cached;

    if (!mockPath) throw error;

    const response = await handleMockApiRequest(mockPath);
    if (!response.ok) {
      throw new Error(`Offline fallback failed with status ${response.status}.`);
    }
    return response.json() as Promise<T>;
  }
}

export function requireNetworkForMutation() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('This change needs an internet connection. Please reconnect and try again.');
  }
}
