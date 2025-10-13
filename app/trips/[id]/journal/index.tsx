import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSession } from '../../../auth';

// This is a placeholder implementation for the journal feature
// In the next development phase, this will be expanded with actual functionality

type JournalEntry = {
  id: string;
  title: string;
  content: string | null;
  created_at: string;
  trip_id: string;
  stage_id: string | null;
};

export default function JournalEntries() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In Phase 4, this will be replaced with actual database queries
    // For now, just simulate loading and show a placeholder
    
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [id, user?.id]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
        <Text style={styles.backLinkText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Trip Journal</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e88e5" />
          <Text style={styles.loadingText}>Loading journal entries...</Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <View style={styles.featureBanner}>
            <Text style={styles.featureTitle}>Coming in Phase 4</Text>
            <Text style={styles.featureDescription}>
              The Trip Journal feature will allow you to:
            </Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>• Create journal entries for your trip</Text>
              <Text style={styles.featureItem}>• Add photos to your entries</Text>
              <Text style={styles.featureItem}>• Record audio memories</Text>
              <Text style={styles.featureItem}>• Link entries to specific stages</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.placeholderButton}
            onPress={() => Alert.alert("Coming Soon", "This feature will be available in Phase 4 of development!")}
          >
            <Text style={styles.placeholderButtonText}>Create Sample Entry</Text>
          </TouchableOpacity>
        </View>
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
  backLink: {
    marginBottom: 16,
  },
  backLinkText: {
    fontSize: 16,
    color: '#1e88e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBanner: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  featureList: {
    marginLeft: 8,
  },
  featureItem: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
  },
  placeholderButton: {
    backgroundColor: '#1e88e5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  placeholderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
