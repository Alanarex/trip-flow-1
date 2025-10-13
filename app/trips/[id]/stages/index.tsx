import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSession } from '../../../auth';
import { getDb } from '../../../lib/db';

type Stage = {
  id: string;
  name: string;
  date: string | null;
  description: string | null;
};

export default function StagesList() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();
  const [tripName, setTripName] = useState('');
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadStages = async () => {
      if (!id || !user?.id) return;
      
      try {
        setLoading(true);
        const db = getDb();
        
        // Get trip name
        const trip = await db.getFirstAsync<{title: string}>(
          'SELECT title FROM trips WHERE id = ? AND user_id = ?',
          [id, user.id]
        );
        
        if (trip && !cancelled) {
          setTripName(trip.title);
        }
        
        // Get all stages for this trip
        const stagesData = await db.getAllAsync<Stage>(
          `SELECT id, name, date, description 
           FROM steps 
           WHERE trip_id = ? 
           ORDER BY date ASC, name ASC`,
          [id]
        );
        
        if (!cancelled) {
          setStages(stagesData || []);
        }
      } catch (error) {
        console.error('Failed to load stages:', error);
        if (!cancelled) {
          Alert.alert('Error', 'Failed to load trip stages');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStages();
    return () => { cancelled = true; };
  }, [id, user?.id]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No date set';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1e88e5" />
        <Text style={styles.loadingText}>Loading stages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
        <Text style={styles.backLinkText}>← Back to Trip Details</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Stages</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push(`/trips/${id}/stages/new`)}
        >
          <Text style={styles.addButtonText}>+ Add Stage</Text>
        </TouchableOpacity>
      </View>

      {stages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No stages yet. Add your first destination!</Text>
        </View>
      ) : (
        <FlatList
          data={stages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.stageCard}
              onPress={() => router.push(`/trips/${id}/stages/${item.id}`)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.stageName}>{item.name}</Text>
                <Text style={styles.stageDate}>{formatDate(item.date)}</Text>
                {item.description && (
                  <Text 
                    style={styles.stageDescription}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.description}
                  </Text>
                )}
              </View>
              <Text style={styles.stageArrow}>›</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={stages.length === 0 ? { flex: 1 } : null}
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
  centerContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backLink: {
    marginBottom: 16,
  },
  backLinkText: {
    fontSize: 16,
    color: '#1e88e5',
  },
  title: {
    fontSize: 22,
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
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  stageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  stageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  stageDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  stageDescription: {
    fontSize: 14,
    color: '#666',
  },
  stageArrow: {
    fontSize: 24,
    color: '#999',
    marginLeft: 8,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
});
