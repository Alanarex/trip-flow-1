import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChecklistItem, deleteChecklistItem, toggleChecklistItem, updateChecklistItem } from './repo';

type ChecklistItemProps = {
  item: ChecklistItem;
  onUpdate: () => Promise<void>;
};

export default function ChecklistItemComponent({ item, onUpdate }: ChecklistItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(item.label);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = async () => {
    try {
      await toggleChecklistItem(item.id);
      await onUpdate();
    } catch (error) {
      console.error('Failed to toggle checklist item:', error);
      Alert.alert('Error', 'Failed to update checklist item');
    }
  };

  const handleSave = async () => {
    if (!label.trim()) {
      Alert.alert('Error', 'Item text cannot be empty');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateChecklistItem(item.id, { label });
      setIsEditing(false);
      await onUpdate();
    } catch (error) {
      console.error('Failed to update checklist item:', error);
      Alert.alert('Error', 'Failed to update checklist item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChecklistItem(item.id);
              await onUpdate();
            } catch (error) {
              console.error('Failed to delete checklist item:', error);
              Alert.alert('Error', 'Failed to delete checklist item');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
          />
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setIsEditing(false)}
              disabled={isSubmitting}
            >
              <Feather name="x" size={18} color="#757575" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              <Feather name="check" size={18} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.itemContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={handleToggle}
          >
            {item.done ? (
              <Feather name="check-square" size={20} color="#4CAF50" />
            ) : (
              <Feather name="square" size={20} color="#757575" />
            )}
          </TouchableOpacity>
          
          <Text
            style={[
              styles.label,
              item.done && styles.labelCompleted
            ]}
          >
            {item.label}
          </Text>
          
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setIsEditing(true)}
            >
              <Feather name="edit-2" size={16} color="#1e88e5" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleDelete}
            >
              <Feather name="trash-2" size={16} color="#FF5252" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  checkbox: {
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  labelCompleted: {
    textDecorationLine: 'line-through',
    color: '#9E9E9E',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#1e88e5',
    paddingBottom: 4,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
