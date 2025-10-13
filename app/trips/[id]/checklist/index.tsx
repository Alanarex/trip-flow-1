import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSession } from '../../../auth';
import {
    Checklist,
    createChecklist,
    createTemplateChecklist,
    getChecklistsByTrip
} from '../../checklist/repo';

export default function ChecklistsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();
  
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id || !user?.id) return;
    loadChecklists();
  }, [id, user?.id]);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const lists = await getChecklistsByTrip(id as string);
      setChecklists(lists);
    } catch (error) {
      console.error('Failed to load checklists:', error);
      setError('Failed to load checklists');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChecklist = async () => {
    if (!id || !user?.id || !newTitle.trim()) return;
    
    try {
      setSubmitting(true);
      await createChecklist({
        trip_id: id as string,
        title: newTitle.trim()
      });
      await loadChecklists();
      setShowNewForm(false);
      setNewTitle('');
    } catch (error) {
      console.error('Failed to create checklist:', error);
      Alert.alert('Error', 'Failed to create checklist');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTemplate = (templateName: string) => {
    if (!id || !user?.id) return;
    
    Alert.alert(
      'Create Template',
      `Create a "${templateName}" checklist template with predefined items?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            try {
              setLoading(true);
              await createTemplateChecklist(id as string, templateName);
              await loadChecklists();
              Alert.alert('Success', `${templateName} checklist created`);
            } catch (error) {
              console.error('Failed to create template:', error);
              Alert.alert('Error', 'Failed to create template checklist');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderNewChecklistForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Create New Checklist</Text>
      <TextInput
        style={styles.input}
        value={newTitle}
        onChangeText={setNewTitle}
        placeholder="Checklist title..."
      />
      <View style={styles.formActions}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => {
            setShowNewForm(false);
            setNewTitle('');
          }}
          disabled={submitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.createButton, !newTitle.trim() && styles.disabledButton]}
          onPress={handleCreateChecklist}
          disabled={!newTitle.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderChecklistItem = ({ item }: { item: Checklist }) => (
    <TouchableOpacity 
      style={styles.checklistItem}
      onPress={() => router.push(`/trips/${id}/checklist/${item.id}`)}
    >
      <View style={styles.checklistItemContent}>
        <Feather name="check-square" size={24} color="#1e88e5" />
        <Text style={styles.checklistItemTitle}>{item.title}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#757575" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Trip Checklists</Text>
      </View>

      {showNewForm ? (
        renderNewChecklistForm()
      ) : (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowNewForm(true)}
        >
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.addButtonText}>New Checklist</Text>
        </TouchableOpacity>
      )}

      <View style={styles.templatesContainer}>
        <Text style={styles.templatesTitle}>Templates</Text>
        <View style={styles.templates}>
          <TouchableOpacity 
            style={styles.templateButton}
            onPress={() => handleCreateTemplate('Essentials')}
          >
            <Text style={styles.templateButtonText}>Essentials</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.templateButton}
            onPress={() => handleCreateTemplate('Clothing')}
          >
            <Text style={styles.templateButtonText}>Clothing</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.templateButton}
            onPress={() => handleCreateTemplate('Toiletries')}
          >
            <Text style={styles.templateButtonText}>Toiletries</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.templateButton}
            onPress={() => handleCreateTemplate('Tech')}
          >
            <Text style={styles.templateButtonText}>Tech</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1e88e5" />
          <Text style={styles.loadingText}>Loading checklists...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Feather name="alert-circle" size={48} color="#FF5252" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadChecklists}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : checklists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="clipboard" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Checklists</Text>
          <Text style={styles.emptyText}>
            Create a checklist to keep track of items for your trip
          </Text>
        </View>
      ) : (
        <FlatList
          data={checklists}
          keyExtractor={(item) => item.id}
          renderItem={renderChecklistItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backLink: {
    marginRight: 16,
  },
  backLinkText: {
    color: '#1e88e5',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e88e5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  templatesContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  templatesTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    color: '#333',
  },
  templates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  templateButton: {
    backgroundColor: '#e3f2fd',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    margin: 4,
  },
  templateButtonText: {
    color: '#1e88e5',
    fontWeight: '500',
  },
  formContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#757575',
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#1e88e5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.6,
  },
  checklistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  checklistItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checklistItemTitle: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#757575',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FF5252',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1e88e5',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '500',
    color: '#757575',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
});
