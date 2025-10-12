import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSession } from '../auth';
import { getDb } from '../lib/db';

type Trip = {
    id: string;
    title: string;
    start_date: string | null;
    end_date: string | null;
    cover_uri: string | null;
};

export default function TripsIndex() {
    const session = useSession();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Fetch trips whenever we visit this screen
    useEffect(() => {
        let cancelled = false;

        const loadTrips = async () => {
            if (!session.user) return;

            try {
                setLoading(true);
                const db = getDb();
                const rows = await db.getAllAsync<Trip>(
                    `SELECT id, title, start_date, end_date, cover_uri
           FROM trips
           WHERE user_id = ?
           ORDER BY created_at DESC`,
                    [session.user.id]
                );

                if (!cancelled) {
                    setTrips(rows);
                }
            } catch (error) {
                console.error('Failed to load trips:', error);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadTrips();

        return () => {
            cancelled = true;
        };
    }, [session.user?.id]);

    const formatDateRange = (startDate: string | null, endDate: string | null) => {
        if (!startDate && !endDate) return 'No dates set';
        if (startDate && !endDate) return `From ${startDate}`;
        if (!startDate && endDate) return `Until ${endDate}`;
        return `${startDate} → ${endDate}`;
    };

    const navigateToTrip = (tripId: string) => {
        router.push({
            pathname: "/trips/[id]",
            params: { id: tripId }
        });
    };

    const navigateToNewTrip = () => {
        router.push('/trips/new');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Trips</Text>
                <TouchableOpacity style={styles.addButton} onPress={navigateToNewTrip}>
                    <Text style={styles.addButtonText}>+ New Trip</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1e88e5" />
                    <Text style={styles.loadingText}>Loading your trips...</Text>
                </View>
            ) : (
                <FlatList<Trip>
                    data={trips}
                    keyExtractor={(item: Trip) => item.id}
                    renderItem={({ item }: { item: Trip }) => (
                        <TouchableOpacity
                            style={styles.tripCard}
                            onPress={() => navigateToTrip(item.id)}
                        >
                            <View style={styles.tripContent}>
                                <Text style={styles.tripTitle}>{item.title}</Text>
                                <Text style={styles.tripDates}>
                                    {formatDateRange(item.start_date, item.end_date)}
                                </Text>
                            </View>
                            <View style={styles.arrowContainer}>
                                <Text style={styles.arrow}>›</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No trips yet.</Text>
                            <Text style={styles.emptySubtext}>
                                Create your first trip to get started!
                            </Text>
                            <TouchableOpacity style={styles.createButton} onPress={navigateToNewTrip}>
                                <Text style={styles.createButtonText}>Create Trip</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    contentContainerStyle={trips.length === 0 ? styles.emptyList : undefined}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111',
    },
    addButton: {
        backgroundColor: '#1e88e5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
        fontSize: 16,
    },
    tripCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tripContent: {
        flex: 1,
    },
    tripTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111',
        marginBottom: 4,
    },
    tripDates: {
        color: '#666',
        fontSize: 14,
    },
    arrowContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrow: {
        fontSize: 24,
        color: '#999',
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    createButton: {
        backgroundColor: '#1e88e5',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 6,
    },
    createButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});
