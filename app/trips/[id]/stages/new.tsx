import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Button, Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateInput, { dateUtils } from '../../../../components/date-input';
import LocationPicker from '../../../../components/location-picker';
import { useSession } from '../../../auth';
import { tx, uuid } from '../../../lib/db';

export default function NewStage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);

  const createStage = async () => {
    if (!id || !user?.id) {
      Alert.alert('Error', 'Trip ID is missing or user not authenticated');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter a name for the stage');
      return;
    }

    // Convert the dd/mm/yyyy format to yyyy-mm-dd for database
    const isoDate = dateInput ? dateUtils.toISOFormat(dateInput) : null;

    if (dateInput && !isoDate) {
      Alert.alert('Validation', 'Please enter a valid date in the format dd/mm/yyyy');
      return;
    }

    try {
      const stageId = uuid();
      
      await tx(async (database) => {
        await database.runAsync(
          `INSERT INTO steps (id, trip_id, name, date, description, lat, lng)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            stageId, 
            id, 
            name.trim(), 
            isoDate, 
            description.trim() || null,
            location?.lat || null,
            location?.lng || null
          ]
        );
      });

      // Navigate back to stages list
      router.replace(`/trips/${id}/stages`);
    } catch (error) {
      console.error('Failed to create stage:', error);
      Alert.alert('Error', 'Failed to create stage. Please try again.');
    }
  };

  return (
    <TouchableOpacity
      style={{ flex: 1 }}
      activeOpacity={1}
      onPress={() => {
        Keyboard.dismiss();
      }}
    >
      <ScrollView style={styles.container}>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Add New Stage</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Name*</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Eiffel Tower"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="What will you do here?"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        <DateInput 
          label="Date"
          value={dateInput}
          onChange={(value, isValid) => {
            setDateInput(value);
            setIsDateValid(isValid);
          }}
          placeholder="dd/mm/yyyy"
        />
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Location</Text>
          <LocationPicker 
            onLocationSelected={(locationInfo) => {
              setLocation({
                name: locationInfo.name,
                lat: locationInfo.lat,
                lng: locationInfo.lng
              });
              
              // If name is not yet set and a location was selected, 
              // use the location name as the default stage name
              if (!name && locationInfo.name) {
                setName(locationInfo.name);
              }
            }}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button title="Create Stage" onPress={createStage} />
        </View>
      </ScrollView>
    </TouchableOpacity>
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
    color: '#111',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    color: '#111',
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
});
