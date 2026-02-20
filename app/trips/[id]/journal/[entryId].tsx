import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSession } from '../../../auth';
import JournalEntryForm from '../../journal/JournalEntryForm';
import { JournalEntry, JournalEntryInput, deleteJournalEntry, getJournalEntry, updateJournalEntry } from '../../journal/repo';

export default function JournalEntryDetail() {
  const { id, entryId } = useLocalSearchParams<{ id: string; entryId: string }>();
  const router = useRouter();
  const { user } = useSession();

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id || !entryId || !user?.id) return;
    loadEntry();
  }, [id, entryId, user?.id]);

  const loadEntry = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const journalEntry = await getJournalEntry(entryId);
      
      if (journalEntry) {
        setEntry(journalEntry);
      } else {
        setError('Journal entry not found');
      }
    } catch (error) {
      console.error('Failed to load journal entry:', error);
      setError('Failed to load journal entry');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updatedEntry: JournalEntryInput) => {
    if (!entryId || !user?.id) return;
    
    try {
      setSubmitting(true);
      const success = await updateJournalEntry(entryId, updatedEntry);
      
      if (success) {
        await loadEntry();
        setIsEditing(false);
        Alert.alert('Success', 'Journal entry updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update journal entry');
      }
    } catch (error) {
      console.error('Failed to update journal entry:', error);
      Alert.alert('Error', 'Failed to update journal entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!entry) return;
    
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
              const success = await deleteJournalEntry(entry.id);
              
              if (success) {
                router.back();
                Alert.alert('Success', 'Journal entry deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete journal entry');
              }
            } catch (error) {
              console.error('Failed to delete journal entry:', error);
              Alert.alert('Error', 'Failed to delete journal entry');
            }
          }
        }
      ]
    );
  };

  // Format the date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
        <Text style={styles.backLinkText}>← Back to Journal</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e88e5" />
          <Text style={styles.loadingText}>Loading journal entry...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#FF5252" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadEntry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : isEditing && entry ? (
        <JournalEntryForm
          initialValues={{
            trip_id: entry.trip_id,
            step_id: entry.step_id,
            title: entry.title,
            text: entry.text,
            image_uri: entry.image_uri,
            audio_uri: entry.audio_uri
          }}
          tripId={id as string}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
          isLoading={submitting}
        />
      ) : entry ? (
        <ScrollView style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{entry.title || 'Untitled Entry'}</Text>
            <Text style={styles.date}>{formatDate(entry.created_at)}</Text>
          </View>
          
          {entry.image_uri && (
            <View style={styles.imageContainer}>
              {/* Will be implemented in future phases */}
              <View style={styles.imagePlaceholder}>
                <Feather name="image" size={32} color="#ccc" />
                <Text style={styles.placeholderText}>Image will be displayed here</Text>
              </View>
            </View>
          )}
          
          <Text style={styles.text}>{entry.text}</Text>
          
          {entry.audio_uri && (
            <View style={styles.audioContainer}>
              {/* Will be implemented in future phases */}
              <View style={styles.audioPlaceholder}>
                <Feather name="mic" size={24} color="#2196F3" />
                <Text style={styles.audioText}>Audio recording available</Text>
              </View>
            </View>
          )}
          
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.button, styles.editButton]} 
              onPress={() => setIsEditing(true)}
            >
              <Feather name="edit" size={18} color="#fff" />
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.deleteButton]} 
              onPress={handleDelete}
            >
              <Feather name="trash-2" size={18} color="#fff" />
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : null}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
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
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#757575',
  },
  imageContainer: {
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    color: '#999',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 24,
  },
  audioContainer: {
    marginBottom: 24,
  },
  audioPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  audioText: {
    marginLeft: 8,
    color: '#2196F3',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginRight: 12,
  },
  editButton: {
    backgroundColor: '#1e88e5',
  },
  deleteButton: {
    backgroundColor: '#FF5252',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
});
