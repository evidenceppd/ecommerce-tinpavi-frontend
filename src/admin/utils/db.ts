import { openDB, type IDBPDatabase } from 'idb';

interface AuthStore {
  admin_token: string;
  admin_refresh_token: string;
  admin_usuario: string;
  customer_profile: string;
  customer_token: string;
  customer_refresh_token: string;
}

type AuthKey = keyof AuthStore;

const DB_NAME = 'tinpavi';
const DB_VERSION = 1;
const STORE_AUTH = 'auth';

let _db: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (!_db) {
    _db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_AUTH)) {
          db.createObjectStore(STORE_AUTH);
        }
      },
    });
  }
  return _db;
}

export const authDB = {
  async get(key: AuthKey): Promise<string | null> {
    const db = await getDB();
    const value = await db.get(STORE_AUTH, key);
    return (value as string | undefined) ?? null;
  },
  async set(key: AuthKey, value: string): Promise<void> {
    const db = await getDB();
    await db.put(STORE_AUTH, value, key);
  },
  async del(key: AuthKey): Promise<void> {
    const db = await getDB();
    await db.delete(STORE_AUTH, key);
  },
  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear(STORE_AUTH);
  },
};
