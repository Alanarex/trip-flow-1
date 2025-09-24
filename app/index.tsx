// app/index.tsx
import React, { useEffect, useState } from 'react';
import { Button, FlatList, Pressable, Text, View } from 'react-native';
import { useSession } from './auth';
import { getDb } from './lib/db';

type Trip = {
    id: string;
    title: string;
    start_date: string | null;
    end_date: string | null;
};

export default function Trips() {
    const session = useSession();
    const [trips, setTrips] = useState<Trip[]>([]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!session.user) return;
            const db = getDb();
            const rows = await db.getAllAsync<Trip>(
                `SELECT id, title, start_date, end_date
           FROM trips
          WHERE user_id = ?
       ORDER BY created_at DESC`,
                [session.user.id]
            );

            if (!cancelled) setTrips(rows);
        })();

        return () => {
            cancelled = true;
        };
    }, [session.user?.id]);

    return (
        <View style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
            <Text style={{ fontSize: 22, marginBottom: 6, color: '#111' }}>My Trips</Text>

            <View
                style={{
                    backgroundColor: '#e6ffe6',
                    borderColor: '#2e7d32',
                    borderWidth: 1,
                    padding: 10,
                    borderRadius: 6,
                    marginBottom: 12,
                }}
            >
                <Text style={{ color: '#2e7d32', marginBottom: 4 }}>Session OK</Text>
                <Text style={{ color: '#1b5e20' }}>
                    User: {session.user?.email} | ID: {session.user?.id}
                </Text>
            </View>

            <FlatList
                data={trips}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <Pressable
                        style={{
                            padding: 12,
                            borderWidth: 1,
                            borderColor: '#ddd',
                            marginBottom: 8,
                            borderRadius: 6,
                            backgroundColor: '#fff',
                        }}
                    >
                        <Text style={{ fontWeight: '600', color: '#111' }}>{item.title}</Text>
                        <Text style={{ color: '#333' }}>
                            {item.start_date} → {item.end_date}
                        </Text>
                    </Pressable>
                )}
                ListEmptyComponent={<Text style={{ color: '#333' }}>No trips yet.</Text>}
            />

            <View style={{ marginTop: 16 }}>
                <Button title="Logout" onPress={() => session.signOut()} />
            </View>
        </View>
    );
}
