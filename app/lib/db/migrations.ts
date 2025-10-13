import { getSingle, tx } from '.';
import { hash, uuid } from './utils';

/**
 * Create schema if missing and seed demo data when users table is empty.
 */
export async function migrateAndSeed() {
  // create schema
  await tx(async (db) => {
    // Try to add new columns to journals table if they don't exist
    try {
      await db.execAsync(`
        ALTER TABLE journals ADD COLUMN title TEXT;
        ALTER TABLE journals ADD COLUMN image_uri TEXT;
        ALTER TABLE journals ADD COLUMN audio_uri TEXT;
      `);
      console.log('Added new columns to journals table');
    } catch (e) {
      // Columns might already exist or table might not exist yet
      console.log('Could not add columns to journals table, might already exist');
    }
    
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

    // Try to add name columns to users if they don't exist yet (older DBs)
    try {
      await db.execAsync(`ALTER TABLE users ADD COLUMN first_name TEXT;`);
      await db.execAsync(`ALTER TABLE users ADD COLUMN last_name TEXT;`);
    } catch (e) {
      // Columns may already exist
    }

    // Try to add updated_at to trips if it doesn't exist yet (older DBs)
    try {
      await db.execAsync(`ALTER TABLE trips ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;`);
      // Backfill updated_at from created_at where null
      await db.execAsync(`UPDATE trips SET updated_at = COALESCE(updated_at, created_at);`);
    } catch (e) {
      // Column might already exist
      // console.log('updated_at may already exist on trips');
    }
  });

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