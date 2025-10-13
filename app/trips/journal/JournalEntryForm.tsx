import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { JournalEntryInput } from './repo';

type JournalEntryFormProps = {
  initialValues?: Partial<JournalEntryInput>;
  tripId: string;
  onSubmit: (entry: JournalEntryInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
};

export default function JournalEntryForm({
  initialValues,
  tripId,
  onSubmit,
  onCancel,
  isLoading = false
}: JournalEntryFormProps) {
  // For now, we'll only use text since we've had schema issues
  const [text, setText] = useState(initialValues?.text || '');
  const [stepId, setStepId] = useState(initialValues?.step_id || null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    
    if (!text.trim()) {
      errors.text = 'Journal entry text is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    try {
      await onSubmit({
        trip_id: tripId,
        // Use an auto-generated title from the text
        title: text.trim().substring(0, 30) + (text.length > 30 ? '...' : ''),
        text: text.trim(),
        step_id: stepId,
        // These features will be implemented later
        image_uri: null,
        audio_uri: null
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save journal entry');
      console.error('Failed to save journal entry:', error);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.formGroup}>
        <Text style={styles.label}>Entry Text</Text>
        <TextInput
          style={[styles.input, styles.textArea, validationErrors.text ? styles.errorInput : null]}
          value={text}
          onChangeText={setText}
          placeholder="Write your journal entry here..."
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        {validationErrors.text && (
          <Text style={styles.errorText}>{validationErrors.text}</Text>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Feather name="info" size={20} color="#1e88e5" />
        <Text style={styles.infoText}>
          Photos and audio recordings will be available in a future update.
        </Text>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]} 
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.submitButton, isLoading ? styles.disabledButton : null]} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <Text style={styles.submitButtonText}>Saving...</Text>
          ) : (
            <Text style={styles.submitButtonText}>Save Entry</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 120,
    maxHeight: 200,
  },
  errorInput: {
    borderColor: '#FF5252',
  },
  errorText: {
    color: '#FF5252',
    marginTop: 4,
    fontSize: 12,
  },
  mediaButtons: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 12,
  },
  mediaButtonActive: {
    backgroundColor: '#ffebee',
    borderColor: '#ffcdd2',
  },
  mediaButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1e88e5',
  },
  mediaButtonTextActive: {
    color: '#FF5252',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#1e88e5',
    marginLeft: 12,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#757575',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  infoText: {
    color: '#333',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
