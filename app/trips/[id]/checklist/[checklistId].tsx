import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSession } from '../../../auth';
import ChecklistItemComponent from '../../checklist/ChecklistItem';
import {
    Checklist,
    ChecklistItem,
    createChecklistItem,
    deleteChecklist,
    getChecklist,
    getChecklistItems,
    updateChecklist
} from '../../checklist/repo';

export default function ChecklistScreen() {
  const { id, checklistId } = useLocalSearchParams<{ id: string; checklistId: string }>();
  const router = useRouter();
  const { user } = useSession();

  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState('');

  useEffect(() => {
    if (!id || !checklistId || !user?.id) return;
    loadChecklist();
  }, [id, checklistId, user?.id]);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      setError(null);

      const checklistData = await getChecklist(checklistId);
      if (!checklistData) {
        setError('Checklist not found');
        return;
      }

      setChecklist(checklistData);
      setTitleText(checklistData.title);

      const checklistItems = await getChecklistItems(checklistId);
      setItems(checklistItems);
    } catch (error) {
      console.error('Failed to load checklist:', error);
      setError('Failed to load checklist');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemText.trim() || !checklistId) return;

    try {
      await createChecklistItem({
        checklist_id: checklistId,
        label: newItemText.trim(),
        done: false,
      });
      await loadChecklist();
      setNewItemText('');
    } catch (error) {
      console.error('Failed to add checklist item:', error);
      Alert.alert('Error', 'Failed to add checklist item');
    }
  };

  const handleTitleUpdate = async () => {
    if (!titleText.trim() || !checklistId) return;

    try {
      await updateChecklist(checklistId, titleText.trim());
      await loadChecklist();
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Failed to update checklist title:', error);
      Alert.alert('Error', 'Failed to update checklist title');
    }
  };

  const handleDeleteChecklist = () => {
    Alert.alert(
      'Delete Checklist',
      'Are you sure you want to delete this entire checklist? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChecklist(checklistId);
              router.back();
            } catch (error) {
              console.error('Failed to delete checklist:', error);
              Alert.alert('Error', 'Failed to delete checklist');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1e88e5" />
        <Text style={styles.loadingText}>Loading checklist...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Feather name="alert-circle" size={48} color="#FF5252" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadChecklist}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const completedItems = items.filter(item => item.done).length;
  const progress = items.length > 0 ? (completedItems / items.length) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color="#1e88e5" />
        </TouchableOpacity>
        
        {isEditingTitle ? (
          <View style={styles.titleEditContainer}>
            <TextInput
              style={styles.titleInput}
              value={titleText}
              onChangeText={setTitleText}
            />
            <TouchableOpacity onPress={handleTitleUpdate}>
              <Feather name="check" size={20} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{checklist?.title}</Text>
            <TouchableOpacity onPress={() => setIsEditingTitle(true)}>
              <Feather name="edit-2" size={16} color="#757575" />
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteChecklist}>
          <Feather name="trash-2" size={20} color="#FF5252" />
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {completedItems} of {items.length} completed ({Math.round(progress)}%)
        </Text>
      </View>

      <View style={styles.addItemContainer}>
        <TextInput
          style={styles.addItemInput}
          value={newItemText}
          onChangeText={setNewItemText}
          placeholder="Add new item..."
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="check-square" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No items in this checklist yet</Text>
          <Text style={styles.emptySubText}>
            Add items using the field above or use a template
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChecklistItemComponent item={item} onUpdate={loadChecklist} />
          )}
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
    paddingRight: 12,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  titleEditContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#1e88e5',
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'right',
  },
  addItemContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginRight: 12,
  },
  addButton: {
    backgroundColor: '#1e88e5',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
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
  backButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#1e88e5',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '500',
    color: '#757575',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },
});
