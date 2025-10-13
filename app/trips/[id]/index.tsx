import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TripMap from '../../../components/trip-map';
import { useSession } from '../../auth';
import { getDb, tx } from '../../lib/db';

type TripDetails = {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  cover_uri: string | null;
};

export default function TripDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true); // Map is visible by default
  const router = useRouter();
  const { user } = useSession();

  useEffect(() => {
    let cancelled = false;

    const loadTrip = async () => {
      if (!id || !user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const db = getDb();
        const tripData = await db.getFirstAsync<TripDetails>(
          `SELECT id, title, start_date, end_date, cover_uri
           FROM trips
           WHERE id = ? AND user_id = ?
           LIMIT 1`,
          [id, user.id]
        );

        if (!cancelled) {
          if (tripData) {
            setTrip(tripData);
          } else {
            setError('Trip not found');
          }
        }
      } catch (error) {
        console.error('Failed to load trip:', error);
        if (!cancelled) {
          setError('Failed to load trip details');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTrip();

    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) return 'No dates set';
    if (startDate && !endDate) return `From ${startDate}`;
    if (!startDate && endDate) return `Until ${endDate}`;
    return `${startDate} → ${endDate}`;
  };

  const deleteTrip = () => {
    if (!id || !user?.id || !trip) return;
    
    Alert.alert(
      "Delete Trip",
      "Are you sure you want to delete this trip? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await tx(async (database) => {
                // Delete associated data first (steps, journal entries, checklists, etc.)
                await database.runAsync('DELETE FROM steps WHERE trip_id = ?', [id]);
                await database.runAsync('DELETE FROM journals WHERE trip_id = ?', [id]);
                
                // Delete checklists and their items
                const checklists = await database.getAllAsync<{id: string}>(
                  'SELECT id FROM checklists WHERE trip_id = ?',
                  [id]
                );
                
                for (const checklist of checklists) {
                  await database.runAsync('DELETE FROM checklist_items WHERE checklist_id = ?', [checklist.id]);
                }
                
                await database.runAsync('DELETE FROM checklists WHERE trip_id = ?', [id]);
                
                // Finally delete the trip itself
                await database.runAsync('DELETE FROM trips WHERE id = ? AND user_id = ?', [id, user.id]);
              });
              
              // Navigate back to trips list
              router.replace('/trips');
            } catch (error) {
              console.error('Failed to delete trip:', error);
              Alert.alert('Error', 'Failed to delete trip. Please try again.');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1e88e5" />
        <Text style={styles.loadingText}>Loading trip details...</Text>
      </View>
    );
  }

  if (error || !trip) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Trip not found'}</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.replace('/trips')}
        >
          <Text style={styles.backButtonText}>Return to Trips List</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
        <Text style={styles.backLinkText}>← Back to Trips</Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>{trip.title}</Text>
      <Text style={styles.dates}>{formatDateRange(trip.start_date, trip.end_date)}</Text>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => router.push(`/trips/${id}/edit`)}
        >
          <Text style={styles.actionButtonText}>Edit Trip</Text>
        </TouchableOpacity>
      </View>
      
      {/* Map is now always shown if available */}
      {id && (
        <View style={styles.mapWrapper}>
          <TripMap 
            tripId={id} 
            onStagePress={(stageId) => router.push(`/trips/${id}/stages/${stageId}`)}
          />
        </View>
      )}
      
      <View style={styles.sectionsContainer}>
        <TouchableOpacity 
          style={styles.sectionCard}
          onPress={() => {
            router.push(`/trips/${id}/stages`);
          }}
        >
          <Text style={styles.sectionTitle}>Trip Stages</Text>
          <Text style={styles.sectionDescription}>Manage the places you'll visit</Text>
          <Text style={styles.sectionArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.sectionCard}
          onPress={() => router.push(`/trips/${id}/journal`)}
        >
          <Text style={styles.sectionTitle}>Journal</Text>
          <Text style={styles.sectionDescription}>Add notes and memories</Text>
          <Text style={styles.sectionArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.sectionCard}
          onPress={() => {
            // For now, just show an alert since checklist screen doesn't exist yet
            Alert.alert('Info', 'Checklist functionality will be implemented in Phase 4');
          }}
        >
          <Text style={styles.sectionTitle}>Checklists</Text>
          <Text style={styles.sectionDescription}>Prepare for your journey</Text>
          <Text style={styles.sectionArrow}>›</Text>
        </TouchableOpacity>
      </View>
      
            
      <View style={styles.dangerZone}>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={deleteTrip}
        >
          <Text style={styles.deleteButtonText}>Delete Trip</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backLink: {
    marginBottom: 16,
  },
  backLinkText: {
    fontSize: 16,
    color: '#1e88e5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111',
  },
  dates: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#1e88e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionsContainer: {
    marginBottom: 24,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    flex: 1,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    flex: 2,
  },
  sectionArrow: {
    fontSize: 24,
    color: '#999',
    marginLeft: 8,
  },
  dangerZone: {
    marginTop: 32,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    borderRadius: 8,
    backgroundColor: '#ffebee',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c62828',
    marginBottom: 12,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  errorText: {
    color: '#c62828',
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#1e88e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  mapWrapper: {
    marginTop: 16,
    marginBottom: 16,
    height: 350,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  deleteButton: {
    backgroundColor: '#c62828',
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
