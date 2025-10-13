import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  const [text, setText] = useState(initialValues?.text || '');
  const [stepId, setStepId] = useState(initialValues?.step_id || null);
  const [imageUri, setImageUri] = useState<string | null>(initialValues?.image_uri || null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    
    if (!text.trim()) {
      errors.text = 'Journal entry text is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImagePicker = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'You need to grant permission to access your photos');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };
  
  const handleTakePhoto = async () => {
    try {
      // Request camera permission
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'You need to grant permission to access your camera');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
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
        image_uri: imageUri,
        audio_uri: null // Audio will be implemented later
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
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Add Photo</Text>
        <View style={styles.mediaButtons}>
          <TouchableOpacity 
            style={styles.mediaButton} 
            onPress={handleImagePicker}
          >
            <Feather name="image" size={20} color="#1e88e5" />
            <Text style={styles.mediaButtonText}>Choose from gallery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.mediaButton} 
            onPress={handleTakePhoto}
          >
            <Feather name="camera" size={20} color="#1e88e5" />
            <Text style={styles.mediaButtonText}>Take a photo</Text>
          </TouchableOpacity>
        </View>
        
        {imageUri && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <TouchableOpacity 
              style={styles.removeImageButton} 
              onPress={handleRemoveImage}
            >
              <Feather name="x-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Feather name="info" size={20} color="#1e88e5" />
        <Text style={styles.infoText}>
          Audio recordings will be available in a future update.
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
  imagePreviewContainer: {
    position: 'relative',
    marginTop: 16,
    alignSelf: 'center',
    width: '100%',
    maxHeight: 300,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imagePreview: {
    width: '100%',
    height: 250,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 4,
  },
});
