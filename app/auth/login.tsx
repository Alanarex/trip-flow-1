import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, Pressable, Text, TextInput, View } from 'react-native';
import { loginLocal, useSession } from '.';

export default function Login() {
  const [email, setEmail] = useState('demo@tripflow.app');
  const [password, setPassword] = useState('123456');
  const [status, setStatus] = useState<{ type: 'ok' | 'error' | null; msg: string }>({ type: null, msg: '' });

  const router = useRouter();
  const { booted, signIn } = useSession();

  if (!booted) return null;

  async function onLogin() {
    setStatus({ type: null, msg: '' });
    try {
      const u = await loginLocal(email.trim(), password);
      await signIn(u);
      setStatus({ type: 'ok', msg: 'Login successful.' });
      setTimeout(() => router.replace('/'), 300);
    } catch (e: any) {
      setStatus({ type: 'error', msg: e?.message ?? 'Login failed' });
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 16, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 16, color: '#111' }}>Login (local)</Text>

      {status.type ? (
        <View
          style={{
            backgroundColor: status.type === 'ok' ? '#e6ffe6' : '#ffe6e6',
            borderColor: status.type === 'ok' ? '#2e7d32' : '#c62828',
            borderWidth: 1,
            padding: 10,
            marginBottom: 12,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: status.type === 'ok' ? '#2e7d32' : '#c62828' }}>{status.msg}</Text>
        </View>
      ) : null}

      <TextInput
        placeholder="Email"
        placeholderTextColor="#777"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          backgroundColor: '#fff',
          color: '#111',
          padding: 10,
          marginBottom: 10,
          borderRadius: 6,
        }}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#777"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          backgroundColor: '#fff',
          color: '#111',
          padding: 10,
          marginBottom: 12,
          borderRadius: 6,
        }}
      />
      <Button title="Login" onPress={onLogin} />

      <Text style={{ marginTop: 10, color: '#555' }}>demo@tripflow.app / 123456</Text>

      <Pressable onPress={() => router.push('/auth/signup')} style={{ marginTop: 14 }}>
        <Text style={{ color: '#1e88e5' }}>Don't have an account? Sign up</Text>
      </Pressable>
    </View>
  );
}
