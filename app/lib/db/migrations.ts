import { getSingle, tx } from '.';
import { hash, uuid } from './utils';

// --- Helpers ---------------------------------------------------------------

async function getTableColumns(db: any, table: 'users' | 'trips' | 'steps' | 'journals' | 'checklists' | 'checklist_items') {
  // PRAGMA table_info returns empty set if the table does not exist
  const rows = await db.getAllAsync(`PRAGMA table_info(${table});`);
  return Array.isArray(rows) ? rows : [];
}

async function hasColumn(db: any, table: Parameters<typeof getTableColumns>[1], column: string) {
  const cols = await getTableColumns(db, table as any);
  return cols.some((c: any) => c?.name === column);
}

async function ensureTables(db: any) {
  // Create all tables with the latest shape; IF NOT EXISTS keeps it idempotent.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      cover_uri TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS steps (
      id TEXT PRIMARY KEY NOT NULL,
      trip_id TEXT NOT NULL,
      name TEXT NOT NULL,
      lat REAL, lng REAL,
      date TEXT, description TEXT
    );
    CREATE TABLE IF NOT EXISTS journals (
      id TEXT PRIMARY KEY NOT NULL,
      trip_id TEXT NOT NULL,
      step_id TEXT,
      text TEXT NOT NULL,
      title TEXT,
      image_uri TEXT,
      audio_uri TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS checklists (
      id TEXT PRIMARY KEY NOT NULL,
      trip_id TEXT NOT NULL,
      title TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT PRIMARY KEY NOT NULL,
      checklist_id TEXT NOT NULL,
      label TEXT NOT NULL,
      done INTEGER DEFAULT 0,
      ord INTEGER DEFAULT 0
    );
  `);
}

async function ensureUsersColumns(db: any) {
  // Ensure password_hash exists; if only legacy 'password' exists, add and backfill
  const hasPwHash = await hasColumn(db, 'users', 'password_hash');
  const hasLegacyPw = await hasColumn(db, 'users', 'password');
  if (!hasPwHash) {
    await db.execAsync(`ALTER TABLE users ADD COLUMN password_hash TEXT;`);
    if (hasLegacyPw) {
      await db.execAsync(`UPDATE users SET password_hash = password WHERE password_hash IS NULL AND password IS NOT NULL;`);
    }
  }

  // If legacy 'password' column exists (likely NOT NULL), rebuild table to drop it
  if (hasLegacyPw) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users_new (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO users_new (id, email, password_hash, first_name, last_name, created_at)
      SELECT id, email, COALESCE(password_hash, password), first_name, last_name, created_at FROM users;
      DROP TABLE users;
      ALTER TABLE users_new RENAME TO users;
    `);
  }
  if (!(await hasColumn(db, 'users', 'first_name'))) {
    await db.execAsync(`ALTER TABLE users ADD COLUMN first_name TEXT;`);
  }
  if (!(await hasColumn(db, 'users', 'last_name'))) {
    await db.execAsync(`ALTER TABLE users ADD COLUMN last_name TEXT;`);
  }
}

async function ensureTripsColumns(db: any) {
  if (!(await hasColumn(db, 'trips', 'updated_at'))) {
    // NOTE: SQLite does not allow non-constant defaults in ALTER TABLE ADD COLUMN.
    // Add column without default, then backfill via UPDATE.
    await db.execAsync(`ALTER TABLE trips ADD COLUMN updated_at TEXT;`);
  }
  // Backfill updated_at where null/missing values
  await db.execAsync(`UPDATE trips SET updated_at = COALESCE(updated_at, created_at);`);
}

async function ensureJournalsColumns(db: any) {
  if (!(await hasColumn(db, 'journals', 'title'))) {
    await db.execAsync(`ALTER TABLE journals ADD COLUMN title TEXT;`);
  }
  if (!(await hasColumn(db, 'journals', 'image_uri'))) {
    await db.execAsync(`ALTER TABLE journals ADD COLUMN image_uri TEXT;`);
  }
  if (!(await hasColumn(db, 'journals', 'audio_uri'))) {
    await db.execAsync(`ALTER TABLE journals ADD COLUMN audio_uri TEXT;`);
  }
}

/**
 * Create schema if missing and seed demo data when users table is empty.
 */
export async function migrateAndSeed() {
  // Create/upgrade schema idempotently
  await tx(async (db) => {
    await ensureTables(db);
    await ensureJournalsColumns(db);
    await ensureUsersColumns(db);
    await ensureTripsColumns(db);
  });

  // Seed demo data if empty
  const userCount = await getSingle<{ c: number }>(`SELECT COUNT(*) as c FROM users`);
  if (!userCount || userCount.c === 0) {
    await seed();
  }
}

async function seed() {
  const userId = uuid();
  const parisId = uuid();
  const alpsId = uuid();

  await tx(async (db) => {
    // demo user: demo@tripflow.app / 123456
    await db.runAsync(`INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)`, [
      userId,
      'demo@tripflow.app',
      hash('123456'),
      'Demo',
      'User',
    ]);

    await db.runAsync(
      `INSERT INTO trips (id, user_id, title, start_date, end_date, cover_uri)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [parisId, userId, 'Paris Weekend', '2025-10-01', '2025-10-03', null]
    );

    await db.runAsync(
      `INSERT INTO trips (id, user_id, title, start_date, end_date, cover_uri)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [alpsId, userId, 'Alps Hiking', '2025-11-10', '2025-11-17', null]
    );

    await db.runAsync(
      `INSERT INTO steps (id, trip_id, name, lat, lng, date, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuid(), parisId, 'Eiffel Tower', 48.8584, 2.2945, '2025-10-01', 'Quick visit']
    );

    await db.runAsync(
      `INSERT INTO steps (id, trip_id, name, lat, lng, date, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuid(), parisId, 'Louvre', 48.8606, 2.3376, '2025-10-02', 'Museum day']
    );
  });
}