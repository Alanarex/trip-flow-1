import { getDb, hash, tx, uuid, verifyPassword } from '../../lib/db';

/**
 * Row shape returned from users table.
 */
type UserRow = {
    id: string;
    email: string;
    password_hash: string;
    first_name?: string | null;
    last_name?: string | null;
};

/**
 * Local exported user/session shape used by loginLocal and SessionProvider.signIn.
 */
export type UserSession = { id: string; email: string; first_name?: string | null; last_name?: string | null };

/**
 * Find a user row by email.
 *
 * @param email - email to lookup
 * @returns the user row or null when not found
 * @throws when DB isn't available
 */
export async function findUserByEmail(email: string): Promise<UserRow | null> {
    const db = getDb();
    if (!db) {
        throw new Error('Database not available');
    }

    const row = await db.getFirstAsync<UserRow>(
        `SELECT id, email, password_hash, first_name, last_name FROM users WHERE email = ? LIMIT 1`,
        [email]
    );

    return row ?? null;
}

/**
 * Create a new local user.
 * - normalizes email (trim + toLowerCase)
 * - prevents duplicate accounts (throws Error)
 * - returns the created UserSession { id, email }
 */
export async function createUser(email: string, password: string, firstName?: string, lastName?: string): Promise<UserSession> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) throw new Error('Email is required');

    // server-side validation must match client rules
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*\d).{8,}$/; // at least 8 chars and at least one digit

    if (!emailRegex.test(normalized)) throw new Error('Invalid email format');
    if (!passwordRegex.test(password)) throw new Error('Password must be at least 8 characters and include at least one number');

    const existing = await findUserByEmail(normalized);
    if (existing) throw new Error('An account with that email already exists');

    const id = uuid();
    const password_hash = hash(password);

    await tx(async (db) => {
        await db.runAsync(`INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)`, [
            id,
            normalized,
            password_hash,
            firstName ?? null,
            lastName ?? null,
        ]);
    });

    return { id, email: normalized, first_name: firstName ?? null, last_name: lastName ?? null };
}

/**
 * Authenticate locally with email + password.
 *
 * Verifies the password against the stored hash and returns a minimal
 * user session object on success.
 *
 * @param email - user's email
 * @param password - plain-text password
 * @returns { id, email } on success
 * @throws when account not found or password invalid
 */
export async function loginLocal(email: string, password: string): Promise<UserSession> {
    const user = await findUserByEmail(email.trim().toLowerCase());
    if (!user) throw new Error('No account found');

    if (!verifyPassword(password, user.password_hash)) {
        throw new Error('Invalid password (stored hash does not match computed hash).');
    }
    return { id: user.id, email: user.email, first_name: user.first_name ?? null, last_name: user.last_name ?? null };
}