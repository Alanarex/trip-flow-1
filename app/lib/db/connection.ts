import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

/**
 * Return a singleton SQLite database instance.
 * Uses synchronous open to ensure availability at runtime.
 */
export function getDb(): SQLite.SQLiteDatabase {
  // TEMP: use a new DB file name to force a fresh schema on next launch
  // Remember to revert to 'tripflow-dev.db' after the first successful boot
  if (!_db) _db = SQLite.openDatabaseSync('tripflow-dev-v3.db');
  return _db;
}

/**
 * Run a function inside an exclusive transaction.
 * The callback receives the raw SQLiteDatabase instance.
 */
export async function tx(run: (db: SQLite.SQLiteDatabase) => Promise<void> | void) {
  const db = getDb();
  // withExclusiveTransactionAsync is provided by Expo SQLite polyfill
  await db.withExclusiveTransactionAsync(async () => {
    await run(db);
  });
}

/**
 * Run a query and return the first row or undefined.
 */
export async function getSingle<T = any>(sql: string, args: any[] = []) {
  const db = getDb();
  const row = await db.getFirstAsync<T>(sql, args);
  return row ?? undefined;
}

// Convenience helper to return all rows for a query
export async function getAll<T = any>(sql: string, args: any[] = []) {
  const db = getDb();
  const rows = await db.getAllAsync<T>(sql, args);
  return rows ?? [];
}