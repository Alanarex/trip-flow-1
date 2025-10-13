import { getAll, getSingle, tx } from '../../lib/db';
import { uuid } from '../../lib/db/utils';

// Types for checklists
export type Checklist = {
  id: string;
  trip_id: string;
  title: string;
};

export type ChecklistInput = {
  trip_id: string;
  title: string;
};

// Types for checklist items
export type ChecklistItem = {
  id: string;
  checklist_id: string;
  label: string;
  done: boolean;
  ord: number; // For ordering items
};

export type ChecklistItemInput = {
  checklist_id: string;
  label: string;
  done?: boolean;
  ord?: number;
};

/**
 * Get all checklists for a trip
 */
export async function getChecklistsByTrip(tripId: string): Promise<Checklist[]> {
  return await getAll<Checklist>(
    `SELECT c.id, c.trip_id, c.title
     FROM checklists c
     WHERE c.trip_id = ?
     ORDER BY c.title`,
    [tripId]
  );
}

/**
 * Get a single checklist by ID
 */
export async function getChecklist(id: string): Promise<Checklist | undefined> {
  return await getSingle<Checklist>(
    `SELECT c.id, c.trip_id, c.title
     FROM checklists c
     WHERE c.id = ?
     LIMIT 1`,
    [id]
  );
}

/**
 * Get all items for a checklist
 */
export async function getChecklistItems(checklistId: string): Promise<ChecklistItem[]> {
  return await getAll<ChecklistItem>(
    `SELECT i.id, i.checklist_id, i.label, i.done, i.ord
     FROM checklist_items i
     WHERE i.checklist_id = ?
     ORDER BY i.ord, i.label`,
    [checklistId]
  );
}

/**
 * Create a new checklist
 */
export async function createChecklist(input: ChecklistInput): Promise<string> {
  const id = uuid();
  
  await tx(async (db) => {
    await db.runAsync(
      `INSERT INTO checklists (id, trip_id, title)
       VALUES (?, ?, ?)`,
      [id, input.trip_id, input.title]
    );
  });
  
  return id;
}

/**
 * Update an existing checklist
 */
export async function updateChecklist(id: string, title: string): Promise<boolean> {
  let updated = false;
  
  await tx(async (db) => {
    const result = await db.runAsync(
      `UPDATE checklists SET title = ? WHERE id = ?`,
      [title, id]
    );
    
    updated = result.changes > 0;
  });
  
  return updated;
}

/**
 * Delete a checklist and all its items
 */
export async function deleteChecklist(id: string): Promise<boolean> {
  let deleted = false;
  
  await tx(async (db) => {
    // Delete all checklist items first
    await db.runAsync(
      'DELETE FROM checklist_items WHERE checklist_id = ?',
      [id]
    );
    
    // Then delete the checklist itself
    const result = await db.runAsync(
      'DELETE FROM checklists WHERE id = ?',
      [id]
    );
    
    deleted = result.changes > 0;
  });
  
  return deleted;
}

/**
 * Create a new checklist item
 */
export async function createChecklistItem(input: ChecklistItemInput): Promise<string> {
  const id = uuid();
  
  await tx(async (db) => {
    // Get the highest ord value currently in the checklist
    const maxOrd = await getSingle<{ max_ord: number }>(
      `SELECT MAX(ord) as max_ord FROM checklist_items WHERE checklist_id = ?`,
      [input.checklist_id]
    );
    
    // Set the new item's ord to be one higher than the current max
    const ord = input.ord ?? ((maxOrd?.max_ord || 0) + 1);
    
    await db.runAsync(
      `INSERT INTO checklist_items (id, checklist_id, label, done, ord)
       VALUES (?, ?, ?, ?, ?)`,
      [id, input.checklist_id, input.label, input.done ? 1 : 0, ord]
    );
  });
  
  return id;
}

/**
 * Update a checklist item
 */
export async function updateChecklistItem(
  id: string, 
  updates: { label?: string; done?: boolean; ord?: number }
): Promise<boolean> {
  let updated = false;
  
  await tx(async (db) => {
    const sets: string[] = [];
    const values: any[] = [];
    
    if (updates.label !== undefined) {
      sets.push('label = ?');
      values.push(updates.label);
    }
    
    if (updates.done !== undefined) {
      sets.push('done = ?');
      values.push(updates.done ? 1 : 0);
    }
    
    if (updates.ord !== undefined) {
      sets.push('ord = ?');
      values.push(updates.ord);
    }
    
    if (sets.length === 0) return;
    
    values.push(id);
    
    const result = await db.runAsync(
      `UPDATE checklist_items SET ${sets.join(', ')} WHERE id = ?`,
      values
    );
    
    updated = result.changes > 0;
  });
  
  return updated;
}

/**
 * Delete a checklist item
 */
export async function deleteChecklistItem(id: string): Promise<boolean> {
  let deleted = false;
  
  await tx(async (db) => {
    const result = await db.runAsync(
      'DELETE FROM checklist_items WHERE id = ?',
      [id]
    );
    
    deleted = result.changes > 0;
  });
  
  return deleted;
}

/**
 * Toggle the done status of a checklist item
 */
export async function toggleChecklistItem(id: string): Promise<boolean> {
  let updated = false;
  
  await tx(async (db) => {
    const result = await db.runAsync(
      'UPDATE checklist_items SET done = NOT done WHERE id = ?',
      [id]
    );
    
    updated = result.changes > 0;
  });
  
  return updated;
}

/**
 * Create a template checklist for common travel items
 */
export async function createTemplateChecklist(tripId: string, templateName: string): Promise<string> {
  const templates: Record<string, string[]> = {
    'Essentials': [
      'Passport/ID',
      'Credit/debit cards',
      'Cash/local currency',
      'Phone and charger',
      'Power adapter',
      'Travel insurance documents',
      'Accommodation details',
      'Transportation tickets'
    ],
    'Clothing': [
      'Underwear',
      'Socks',
      'T-shirts/tops',
      'Pants/shorts',
      'Sleepwear',
      'Jacket/sweater',
      'Rain gear',
      'Comfortable walking shoes',
      'Formal shoes (if needed)',
      'Swimwear'
    ],
    'Toiletries': [
      'Toothbrush and toothpaste',
      'Shampoo/conditioner',
      'Soap/body wash',
      'Deodorant',
      'Hairbrush/comb',
      'Sunscreen',
      'Insect repellent',
      'Medications',
      'First aid supplies',
      'Hand sanitizer'
    ],
    'Tech': [
      'Camera',
      'Memory cards',
      'Laptop/tablet',
      'E-reader',
      'Headphones',
      'Power bank',
      'Adapters and cables',
      'Portable Wi-Fi'
    ]
  };
  
  // Check if the requested template exists
  if (!templates[templateName]) {
    throw new Error(`Template "${templateName}" not found`);
  }
  
  // Create the checklist
  const checklistId = await createChecklist({
    trip_id: tripId,
    title: templateName
  });
  
  // Add all the template items
  const items = templates[templateName];
  for (let i = 0; i < items.length; i++) {
    await createChecklistItem({
      checklist_id: checklistId,
      label: items[i],
      done: false,
      ord: i + 1
    });
  }
  
  return checklistId;
}
