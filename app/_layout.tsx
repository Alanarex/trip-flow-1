import { Slot, usePathname, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import 'react-native-get-random-values';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { SessionProvider, useSession } from './auth';
import { getDb, migrateAndSeed } from './lib/db';

const LOGIN_ROUTE = '/auth/login';
// Toggle this to activate/deactivate running migrations on every cold start
const RUN_MIGRATIONS_ON_BOOT = true;

function AuthGate() {
  const [dbReady, setDbReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, booted, signOut } = useSession();

  useEffect(() => {
    if (RUN_MIGRATIONS_ON_BOOT) {
      migrateAndSeed().then(() => setDbReady(true)).catch(console.error);
    } else {
      // Skip migrations and allow app to boot immediately
      setDbReady(true);
    }
  }, []);

  useEffect(() => {
    if (!dbReady || !booted) return;

    // If there's a stored user but DB is fresh (after reset), invalidate stale session
    if (user) {
      (async () => {
        try {
          const db = getDb();
          const row = await db.getFirstAsync<{ id: string }>(`SELECT id FROM users WHERE id = ? LIMIT 1`, [user.id]);
          if (!row) {
            await signOut(); // will route to /auth/login inside signOut
          }
        } catch {
          // ignore DB probing errors
        }
      })();
    }

    const onLoginScreen =
      pathname === LOGIN_ROUTE ||
      pathname?.startsWith('/auth/') ||      // handles /auth/login
      pathname?.startsWith('/(auth)/');      // handles /(auth)/login

    if (!user && !onLoginScreen) {
      router.replace(LOGIN_ROUTE);
      return;
    }

    if (user && onLoginScreen) {
      router.replace('/');
      return;
    }
  }, [dbReady, booted, user, pathname, router, signOut]);

  if (!dbReady || !booted) return null;
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Slot />
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <AuthGate />
      </SessionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});
