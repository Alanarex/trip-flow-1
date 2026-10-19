import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

/** User object type */
export type User = { id: string; email: string; first_name?: string | null; last_name?: string | null } | null;

/** Session context type */
export type SessionContextType = {
    /** Current authenticated user or null */
    user: User;
    /** Whether session boot (SecureStore read) finished */
    booted: boolean;
    /** Sign in with a user object (persists to SecureStore) */
    signIn: (u: NonNullable<User>) => Promise<void>;
    /** Sign out and remove persisted session */
    signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);
const SESSION_KEY = 'tripflow_session';

/**
 * SessionProvider
 *
 * - Loads session from SecureStore on mount (booted flag)
 * - Persists session on signIn
 * - Deletes session on signOut and redirects to login
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>(null);
    const [booted, setBooted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        (async () => {
            try {
                const raw = await SecureStore.getItemAsync(SESSION_KEY);
                if (raw) setUser(JSON.parse(raw));
            } finally {
                setBooted(true);
            }
        })();
    }, []);

    /**
     * signIn
     * Persist the user object to SecureStore and update context state.
     *
     * @param u - non-null user object
     */
    const signIn = useCallback(async (u: NonNullable<User>) => {
        await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(u));
        setUser(u);
    }, []);

    /**
     * signOut
     * Remove persisted session, clear context and redirect to login route.
     */
    const signOut = useCallback(async () => {
        await SecureStore.deleteItemAsync(SESSION_KEY);
        setUser(null);
        router.replace('/auth/login'); // change to '/(auth)/login' if you use a route group
    }, [router]);

    return (
        <SessionContext.Provider value={{ user, booted, signIn, signOut }}>
            {children}
        </SessionContext.Provider>
    );
}

/**
 * useSession hook for consumers
 * Must be called inside SessionProvider.
 */
export function useSession() {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error('useSession must be used within SessionProvider');
    return ctx;
}