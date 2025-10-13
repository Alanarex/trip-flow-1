import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSession } from '../../../auth';
import JournalEntryForm from '../../journal/JournalEntryForm';
import JournalEntryItem from '../../journal/JournalEntryItem';
import { JournalEntry, JournalEntryInput, createJournalEntry, deleteJournalEntry, getJournalEntriesByTrip } from '../../journal/repo';

export default function JournalEntries() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();
  
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id || !user?.id) return;
    loadEntries();
  }, [id, user?.id]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const journalEntries = await getJournalEntriesByTrip(id as string);
      setEntries(journalEntries);
    } catch (error) {
      console.error('Failed to load journal entries:', error);
      setError('Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async (entry: JournalEntryInput) => {
    if (!id || !user?.id) return;
    
    try {
      setSubmitting(true);
      await createJournalEntry(entry);
      await loadEntries();
      setShowForm(false);
      Alert.alert('Success', 'Journal entry saved successfully');
    } catch (error) {
      console.error('Failed to create journal entry:', error);
      Alert.alert('Error', 'Failed to save journal entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePressEntry = (entry: JournalEntry) => {
    // In Phase 4, this will navigate to a detail view
    // For now, just show an alert
    Alert.alert(
      entry.title || 'Untitled Entry',
      entry.text,
      [{ text: 'Close', style: 'cancel' }]
    );
  };

  const handleDeleteEntry = (entry: JournalEntry) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteJournalEntry(entry.id);
              await loadEntries();
              Alert.alert('Success', 'Journal entry deleted successfully');
            } catch (error) {
              console.error('Failed to delete journal entry:', error);
              Alert.alert('Error', 'Failed to delete journal entry');
            }
          }
        }
      ]
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Feather name="book-open" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Journal Entries Yet</Text>
      <Text style={styles.emptyText}>
        Start documenting your trip by adding your first journal entry.
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => setShowForm(true)}
      >
        <Text style={styles.emptyButtonText}>Create First Entry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Trip Journal</Text>
      </View>

      {showForm ? (
        <JournalEntryForm
          tripId={id as string}
          onSubmit={handleCreateEntry}
          onCancel={() => setShowForm(false)}
          isLoading={submitting}
        />
      ) : (
        <>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1e88e5" />
              <Text style={styles.loadingText}>Loading journal entries...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={48} color="#FF5252" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadEntries}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <FlatList
                data={entries}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <JournalEntryItem 
                    entry={item}
                    onPress={handlePressEntry}
                    onDelete={handleDeleteEntry}
                  />
                )}
                ListEmptyComponent={renderEmptyList}
                contentContainerStyle={entries.length === 0 ? { flex: 1 } : { padding: 16 }}
              />
              
              {entries.length > 0 && (
                <TouchableOpacity
                  style={styles.fab}
                  onPress={() => setShowForm(true)}
                >
                  <Feather name="plus" size={24} color="#fff" />
                </TouchableOpacity>
              )}
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backLink: {
    marginBottom: 8,
  },
  backLinkText: {
    fontSize: 16,
    color: '#1e88e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#757575',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#1e88e5',
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#1e88e5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1e88e5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
