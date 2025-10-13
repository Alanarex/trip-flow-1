import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import DateInput, { dateUtils } from '../../components/date-input';
import { useSession } from '../auth';
import { getDb, tx, uuid } from '../lib/db';

export default function NewTrip() {
  const [title, setTitle] = useState('');
  
  // Date input states
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [isStartDateValid, setIsStartDateValid] = useState(true);
  const [isEndDateValid, setIsEndDateValid] = useState(true);
  
  const [status, setStatus] = useState<{ type: 'ok' | 'error' | null; msg: string }>({
    type: null,
    msg: '',
  });
  
  const router = useRouter();
  const { user } = useSession();

  const handleCloseAll = () => {
    // Close keyboard
    Keyboard.dismiss();
  };

  const createTrip = async () => {
    try {
      // Validate inputs
      if (!title.trim()) {
        setStatus({ type: 'error', msg: 'Please enter a title for your trip' });
        return;
      }

      // Convert the dd/mm/yyyy format to yyyy-mm-dd for database
      const startIsoDate = startDateInput ? dateUtils.toISOFormat(startDateInput) : null;
      const endIsoDate = endDateInput ? dateUtils.toISOFormat(endDateInput) : null;

      if (startDateInput && !startIsoDate) {
        setStatus({ type: 'error', msg: 'Please enter a valid start date in the format dd/mm/yyyy' });
        return;
      }

      if (endDateInput && !endIsoDate) {
        setStatus({ type: 'error', msg: 'Please enter a valid end date in the format dd/mm/yyyy' });
        return;
      }

      // Check if end date is after start date
      if (startIsoDate && endIsoDate && new Date(startIsoDate) > new Date(endIsoDate)) {
        setStatus({ type: 'error', msg: 'End date must be after start date' });
        return;
      }

      const tripId = uuid();
      const db = getDb();
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      await tx(async (database) => {
        await database.runAsync(
          `INSERT INTO trips (id, user_id, title, start_date, end_date, created_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [tripId, user.id, title.trim(), startIsoDate, endIsoDate]
        );
      });

      setStatus({ type: 'ok', msg: 'Trip created successfully!' });
      setTimeout(() => router.replace('/'), 500);
    } catch (error: unknown) {
      let errorMessage = 'Failed to create trip';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setStatus({ type: 'error', msg: errorMessage });
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleCloseAll}>
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>Create New Trip</Text>
      
      {status.type && (
        <View
          style={[
            styles.statusContainer,
            status.type === 'ok' ? styles.successContainer : styles.errorContainer,
          ]}
        >
          <Text
            style={status.type === 'ok' ? styles.successText : styles.errorText}
          >
            {status.msg}
          </Text>
        </View>
      )}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Trip Title*</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Summer Vacation in Italy"
          placeholderTextColor="#999"
        />
      </View>

      <DateInput 
        label="Start Date"
        value={startDateInput}
        onChange={(value, isValid) => {
          setStartDateInput(value);
          setIsStartDateValid(isValid);
        }}
        placeholder="dd/mm/yyyy"
      />

      <DateInput 
        label="End Date"
        value={endDateInput}
        onChange={(value, isValid) => {
          setEndDateInput(value);
          setIsEndDateValid(isValid);
        }}
        placeholder="dd/mm/yyyy"
      />

      <View style={styles.buttonContainer}>
        <Button title="Create Trip" onPress={createTrip} />
      </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
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

  buttonContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  statusContainer: {
    padding: 12,
    marginBottom: 16,
    borderRadius: 6,
    borderWidth: 1,
  },
  successContainer: {
    backgroundColor: '#e6ffe6',
    borderColor: '#2e7d32',
  },
  errorContainer: {
    backgroundColor: '#ffe6e6',
    borderColor: '#c62828',
  },
  successText: {
    color: '#2e7d32',
  },
  errorText: {
    color: '#c62828',
  },

});
