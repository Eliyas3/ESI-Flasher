import { FlashHistoryItem } from '../types/history';
import { PublishedFirmware } from '../types/firmware';

const DB_NAME = 'esi_flasher_db';
const DB_VERSION = 1;
const STORE_HISTORY = 'flash_history';
const STORE_FIRMWARES = 'published_firmwares';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db: IDBDatabase = event.target.result;
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FIRMWARES)) {
        db.createObjectStore(STORE_FIRMWARES, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveHistoryItem(item: FlashHistoryItem): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_HISTORY, 'readwrite');
    const store = tx.objectStore(STORE_HISTORY);
    store.put(item);
  } catch (e) {
    console.warn('Failed to save to IndexedDB, fallback to localStorage', e);
    const existing = getLocalHistory();
    existing.unshift(item);
    localStorage.setItem('esi_history_fallback', JSON.stringify(existing.slice(0, 50)));
  }
}

export async function getAllHistory(): Promise<FlashHistoryItem[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_HISTORY, 'readonly');
      const store = tx.objectStore(STORE_HISTORY);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = req.result as FlashHistoryItem[];
        items.sort((a, b) => b.timestamp - a.timestamp);
        resolve(items);
      };
      req.onerror = () => resolve(getLocalHistory());
    });
  } catch {
    return getLocalHistory();
  }
}

export async function clearAllHistory(): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_HISTORY, 'readwrite');
    tx.objectStore(STORE_HISTORY).clear();
    localStorage.removeItem('esi_history_fallback');
  } catch {}
}

function getLocalHistory(): FlashHistoryItem[] {
  try {
    const data = localStorage.getItem('esi_history_fallback');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function savePublishedFirmware(fw: PublishedFirmware): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_FIRMWARES, 'readwrite');
    tx.objectStore(STORE_FIRMWARES).put(fw);
  } catch (e) {
    console.warn('Failed to save firmware to DB', e);
  }
}

export async function getPublishedFirmwares(): Promise<PublishedFirmware[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_FIRMWARES, 'readonly');
      const store = tx.objectStore(STORE_FIRMWARES);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}
