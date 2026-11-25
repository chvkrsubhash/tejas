import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AIConfig, Folder, Presentation } from '../types/presentation';

interface TejasDB extends DBSchema {
  presentations: {
    key: string;
    value: Presentation;
    indexes: { 'by-updated': string };
  };
  folders: {
    key: string;
    value: Folder;
  };
  settings: {
    key: string;
    value: unknown;
  };
  pendingSync: {
    key: string;
    value: { id: string; presentationId: string; updatedAt: string };
  };
}

let dbPromise: Promise<IDBPDatabase<TejasDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<TejasDB>('tejas-presentation-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('presentations')) {
          const store = db.createObjectStore('presentations', { keyPath: 'id' });
          store.createIndex('by-updated', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('folders')) {
          db.createObjectStore('folders', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('pendingSync')) {
          db.createObjectStore('pendingSync', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function idbGetPresentations(): Promise<Presentation[]> {
  const db = await getDB();
  const list = await db.getAll('presentations');
  return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function idbGetPresentation(id: string): Promise<Presentation | undefined> {
  const db = await getDB();
  return db.get('presentations', id);
}

export async function idbSavePresentation(pres: Presentation): Promise<void> {
  const db = await getDB();
  await db.put('presentations', pres);
}

export async function idbDeletePresentation(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('presentations', id);
}

export async function idbGetFolders(): Promise<Folder[]> {
  const db = await getDB();
  return db.getAll('folders');
}

export async function idbSaveFolder(folder: Folder): Promise<void> {
  const db = await getDB();
  await db.put('folders', folder);
}

export async function idbQueueSync(presentationId: string): Promise<void> {
  const db = await getDB();
  await db.put('pendingSync', {
    id: presentationId,
    presentationId,
    updatedAt: new Date().toISOString(),
  });
}

export async function idbClearSync(presentationId: string): Promise<void> {
  const db = await getDB();
  await db.delete('pendingSync', presentationId);
}

export async function idbGetPendingSyncIds(): Promise<string[]> {
  const db = await getDB();
  const items = await db.getAll('pendingSync');
  return items.map((i) => i.presentationId);
}

export async function idbGetSetting<T>(key: string, fallback: T): Promise<T> {
  const db = await getDB();
  const val = await db.get('settings', key);
  return (val as T) ?? fallback;
}

export async function idbSaveSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put('settings', value, key);
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  enabled: true,
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  apiKey: '',
  ollamaUrl: 'http://localhost:11434',
  dailyLimit: 100,
  dailyUsed: 0,
  maxTokens: 2048,
};

