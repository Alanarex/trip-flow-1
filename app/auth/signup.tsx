import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, Pressable, Text, TextInput, View } from 'react-native';
import { createUser } from './repo/local';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [status, setStatus] = useState<{ type: 'ok' | 'error' | null; msg: string }>({ type: null, msg: '' });

    const router = useRouter();

    // validation helpers
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*\d).{8,}$/; // at least 8 chars and at least one digit

    async function onSignUp() {
        setStatus({ type: null, msg: '' });
        try {
            const normalized = email.trim();

            if (!normalized) throw new Error('Email is required');
            if (!emailRegex.test(normalized)) throw new Error('Invalid email format');

            if (!password) throw new Error('Password is required');
            if (!passwordRegex.test(password)) throw new Error('Password must be at least 8 characters and include at least one number');

            if (password !== confirm) throw new Error('Passwords do not match');

            await createUser(normalized, password);
            setStatus({ type: 'ok', msg: 'Account created — please login.' });
            setTimeout(() => router.replace('/auth/login'), 400);
        } catch (e: any) {
            setStatus({ type: 'error', msg: e?.message ?? 'Failed to create account' });
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#fff', padding: 16, justifyContent: 'center' }}>
            <Text style={{ fontSize: 24, marginBottom: 16, color: '#111' }}>Create account</Text>

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
                    marginBottom: 10,
                    borderRadius: 6,
                }}
            />
            <TextInput
                placeholder="Confirm password"
                placeholderTextColor="#777"
                value={confirm}
                onChangeText={setConfirm}
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

            <Button title="Create account" onPress={onSignUp} />

            <Pressable onPress={() => router.replace('/auth/login')} style={{ marginTop: 14 }}>
                <Text style={{ color: '#1e88e5' }}>Already have an account? Log in</Text>
            </Pressable>
        </View>
    );
}