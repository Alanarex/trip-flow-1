import { Slot, usePathname, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import 'react-native-get-random-values';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { SessionProvider, useSession } from './auth';
import { migrateAndSeed } from './lib/db';

const LOGIN_ROUTE = '/auth/login';

function AuthGate() {
  const [dbReady, setDbReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, booted } = useSession();

  useEffect(() => {
    migrateAndSeed().then(() => setDbReady(true)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!dbReady || !booted) return;

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
  }, [dbReady, booted, user, pathname, router]);

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
