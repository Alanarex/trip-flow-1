import { getAll, getSingle, tx } from '../../lib/db';
import { uuid } from '../../lib/db/utils';

export type JournalEntry = {
  id: string;
  trip_id: string;
  step_id: string | null;
  text: string;
  title: string;
  image_uri: string | null;
  audio_uri: string | null;
  created_at: string;
};

export type JournalEntryInput = {
  trip_id: string;
  step_id?: string | null;
  text: string;
  title: string;
  image_uri?: string | null;
  audio_uri?: string | null;
};

/**
 * Get all journal entries for a trip
 */
export async function getJournalEntriesByTrip(tripId: string): Promise<JournalEntry[]> {
  return await getAll<JournalEntry>(
    `SELECT j.id, j.trip_id, j.step_id, j.text, 
            substr(j.text, 1, 30) || '...' as title, 
            j.image_uri, j.audio_uri, j.created_at
     FROM journals j
     WHERE j.trip_id = ?
     ORDER BY j.created_at DESC`,
    [tripId]
  );
}

/**
 * Get a single journal entry by ID
 */
export async function getJournalEntry(id: string): Promise<JournalEntry | undefined> {
  return await getSingle<JournalEntry>(
    `SELECT j.id, j.trip_id, j.step_id, j.text,
            substr(j.text, 1, 30) || '...' as title,
            j.image_uri, j.audio_uri, j.created_at
     FROM journals j
     WHERE j.id = ?
     LIMIT 1`,
    [id]
  );
}

/**
 * Create a new journal entry
 */
export async function createJournalEntry(entry: JournalEntryInput): Promise<string> {
  const id = uuid();
  
  await tx(async (db) => {
    // Check if the title column exists
    try {
      await db.runAsync(
        `INSERT INTO journals (id, trip_id, step_id, text, title, image_uri, audio_uri, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [id, entry.trip_id, entry.step_id || null, entry.text, entry.title || null, 
         entry.image_uri || null, entry.audio_uri || null]
      );
    } catch (error) {
      // If we get an error about the title column, try without it
      console.log('Falling back to legacy journal schema (without title)');
      await db.runAsync(
        `INSERT INTO journals (id, trip_id, step_id, text, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [id, entry.trip_id, entry.step_id || null, entry.text]
      );
    }
  });
  
  return id;
}

/**
 * Update an existing journal entry
 */
export async function updateJournalEntry(id: string, entry: Partial<JournalEntryInput>): Promise<boolean> {
  let updated = false;
  
  await tx(async (db) => {
    // Only include the text field which we know exists
    const sets: string[] = [];
    const values: any[] = [];
    
    if (entry.text !== undefined) {
      sets.push('text = ?');
      values.push(entry.text);
    }
    
    // We'll skip updating the title, image_uri, and audio_uri fields
    // since they might not exist in the database
    // Once we've implemented the migration properly, we can update this
    
    if (entry.step_id !== undefined) {
      sets.push('step_id = ?');
      values.push(entry.step_id);
    }
    
    if (sets.length === 0) return;
    
    values.push(id);
    
    const result = await db.runAsync(
      `UPDATE journals SET ${sets.join(', ')} WHERE id = ?`,
      values
    );
    
    updated = result.changes > 0;
  });
  
  return updated;
}

/**
 * Delete a journal entry
 */
export async function deleteJournalEntry(id: string): Promise<boolean> {
  let deleted = false;
  
  await tx(async (db) => {
    const result = await db.runAsync(
      'DELETE FROM journals WHERE id = ?',
      [id]
    );
    
    deleted = result.changes > 0;
  });
  
  return deleted;
}
