import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, ImageBackground, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSession } from '../auth';
import { getDb } from '../lib/db';

type Trip = {
    id: string;
    title: string;
    start_date: string | null;
    end_date: string | null;
    cover_uri: string | null;
    updated_at?: string | null;
};

export default function TripsIndex() {
    const session = useSession();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);

    // Fetch trips whenever we visit this screen
    useEffect(() => {
        let cancelled = false;

        const loadTrips = async () => {
            if (!session.user) return;

            try {
                setLoading(true);
                const db = getDb();
                let rows: Trip[] = [];
                try {
                    rows = await db.getAllAsync<Trip>(
                        `SELECT id, title, start_date, end_date, cover_uri, updated_at, created_at
               FROM trips
               WHERE user_id = ?
               ORDER BY COALESCE(updated_at, created_at) DESC`,
                        [session.user.id]
                    );
                } catch (e: any) {
                    const msg = String(e?.message ?? e ?? '');
                    if (msg.includes('no such column: updated_at')) {
                        console.warn('updated_at missing; falling back to created_at ordering');
                        rows = await db.getAllAsync<Trip>(
                            `SELECT id, title, start_date, end_date, cover_uri
                   FROM trips
                   WHERE user_id = ?
                   ORDER BY created_at DESC`,
                            [session.user.id]
                        );
                    } else {
                        throw e;
                    }
                }

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

    const formatDate = (iso?: string | null) => {
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return iso;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    const dateRangeText = (startDate: string | null, endDate: string | null) => {
        if (!startDate && !endDate) return 'No dates set';
        const start = formatDate(startDate);
        const end = formatDate(endDate);
        if (start && end) return `from ${start} to ${end}`;
        if (start) return `from ${start}`;
        if (end) return `until ${end}`;
        return 'No dates set';
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

    const userName = useMemo(() => {
        const u = session.user as any;
        return (u && (u.first_name || 'Traveler')) as string;
    }, [session.user]);

    const { width } = Dimensions.get('window');
    const cardHeight = 180;
    const gutter = 12;
    const twoColWidth = (width - 16 * 2 - gutter) / 2; // padding 16 on container

    const TripCard = ({ item, index }: { item: Trip; index: number }) => {
        const isHero = index === 0;
        const cardStyle = [
            styles.tripCard,
            { height: cardHeight, width: isHero ? width - 32 : twoColWidth },
        ];

        const Content = (
            <LinearGradient
                colors={["rgba(60,60,60,0.80)", "rgba(60,60,60,0)"]}
                start={{ x: 0.5, y: 1 }}
                end={{ x: 0.5, y: 0 }}
                style={styles.textContainer}
            >
                <Text style={styles.tripTitle}>{item.title}</Text>
                <Text style={styles.tripDates}>{dateRangeText(item.start_date, item.end_date)}</Text>
            </LinearGradient>
        );

        if (item.cover_uri) {
            return (
                <TouchableOpacity onPress={() => navigateToTrip(item.id)} activeOpacity={0.85} style={cardStyle}>
                    <ImageBackground source={{ uri: item.cover_uri }} style={styles.bg} imageStyle={styles.bgImage}>
                        {Content}
                    </ImageBackground>
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity onPress={() => navigateToTrip(item.id)} activeOpacity={0.85} style={cardStyle}>
                <LinearGradient
                    colors={["#005f73", "#bb3e03"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.bg, styles.bgImage]}
                />
                {Content}
            </TouchableOpacity>
        );
    };

    // Build a render list that keeps first item full width, rest two per row
    const renderRows = useMemo(() => {
        if (!trips || trips.length === 0) return [] as Trip[];
        return trips;
    }, [trips]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Welcome {userName}</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1e88e5" />
                    <Text style={styles.loadingText}>Loading your trips...</Text>
                </View>
            ) : trips.length === 0 ? (
                <View style={[styles.emptyList, { alignItems: 'center' }]}>
                    <Text style={styles.emptyText}>No trips yet.</Text>
                    <TouchableOpacity style={[styles.ctaWide]} onPress={navigateToNewTrip}>
                        <Text style={styles.ctaWideText}>Start a new adventure</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{ paddingBottom: 16 }}>
                    <TouchableOpacity style={[styles.ctaWide, { marginBottom: 16 }]} onPress={navigateToNewTrip}>
                        <Text style={styles.ctaWideText}>Start a new adventure</Text>
                    </TouchableOpacity>

                    {/* First card full width */}
                    {renderRows[0] && (
                        <TripCard item={renderRows[0]} index={0} />
                    )}

                    {/* Rest two per row */}
                    <View style={styles.grid}
                    >
                        {renderRows.slice(1).map((t, idx) => (
                            <View key={t.id} style={{ width: twoColWidth, marginRight: ((idx % 2) === 0) ? gutter : 0, marginTop: gutter }}>
                                <TripCard item={t} index={idx + 1} />
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Bottom bar */}
            {menuOpen && (
                <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} />
            )}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    accessible accessibilityRole="button" accessibilityLabel="Home"
                    style={styles.homeButton}
                    onPress={() => router.replace('/trips')}
                >
                    <Ionicons name="home-outline" size={24} color="#1e88e5" />
                </TouchableOpacity>

                <View style={{ flex: 1 }} />

                <View style={{ position: 'relative' }}>
                    <TouchableOpacity
                        accessible accessibilityRole="button" accessibilityLabel="Profile"
                        style={styles.profileCircle}
                        onPress={() => setMenuOpen((v) => !v)}
                        activeOpacity={0.9}
                    >
                        <Ionicons name="person-outline" size={22} color="#1e88e5" />
                    </TouchableOpacity>
                    {menuOpen && (
                        <View style={styles.menuContainer}>
                            <TouchableOpacity style={styles.menuItem} onPress={session.signOut}>
                                <MaterialIcons name="logout" size={18} color="#e53935" />
                                <Text style={styles.menuItemText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
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
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111',
    },
    ctaWide: {
        backgroundColor: '#1e88e5',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaWideText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    // removed logout button from header
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
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tripCard: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
    },
    bg: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    bgImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    overlay: {
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    tripTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    tripDates: {
        color: '#f0f0f0',
        fontSize: 12,
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1.5,
    },
    textContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 10,
        paddingVertical: 8,
        paddingTop: 40,
        minHeight: 80,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
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
    bottomBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        flexDirection: 'row',
        alignItems: 'center',
    },
    homeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    homeLabel: {
        color: '#1e88e5',
        fontWeight: '600',
    },
    profileCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
    },
    menuContainer: {
        position: 'absolute',
        right: 0,
        bottom: 48,
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 6,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
        borderWidth: 1,
        borderColor: '#eee',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    menuItemText: {
        color: '#e53935',
        marginLeft: 8,
        fontWeight: '600',
    },
    backdrop: {
        position: 'absolute',
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },
});
