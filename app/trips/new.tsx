import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { useSession } from '../auth';
import { getDb, tx, uuid } from '../lib/db';

export default function NewTrip() {
  const [title, setTitle] = useState('');
  
  // Date picker states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // Formatted date strings for display and database
  const [startDateString, setStartDateString] = useState('');
  const [endDateString, setEndDateString] = useState('');
  
  const [status, setStatus] = useState<{ type: 'ok' | 'error' | null; msg: string }>({
    type: null,
    msg: '',
  });
  
  const router = useRouter();
  const { user } = useSession();

  // Date setter functions (simplified for now)
  const setStartDateWithFormat = (selectedDate: Date) => {
    setStartDate(selectedDate);
    // Format date as YYYY-MM-DD for database
    const formattedDate = formatDate(selectedDate);
    setStartDateString(formattedDate);
  };

  const setEndDateWithFormat = (selectedDate: Date) => {
    setEndDate(selectedDate);
    // Format date as YYYY-MM-DD for database
    const formattedDate = formatDate(selectedDate);
    setEndDateString(formattedDate);
  };

  // Format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format date for display
  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const createTrip = async () => {
    try {
      // Validate inputs
      if (!title.trim()) {
        setStatus({ type: 'error', msg: 'Please enter a title for your trip' });
        return;
      }

      if (startDate && endDate && startDate > endDate) {
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
          [tripId, user.id, title.trim(), startDateString || null, endDateString || null]
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
    <ScrollView style={styles.container}>
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

      <View style={styles.formGroup}>
        <Text style={styles.label}>Start Date</Text>
        <TouchableOpacity 
          style={styles.datePickerButton} 
          onPress={() => {
            // For now just show a simple date selector (will be improved later)
            const today = new Date();
            setStartDateWithFormat(today);
            Alert.alert('Notice', 'Date picker functionality will be fixed in the next update. Using current date for now.');
          }}
        >
          <Text style={styles.dateText}>
            {startDate ? formatDisplayDate(startDate) : 'Select start date'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>End Date</Text>
        <TouchableOpacity 
          style={styles.datePickerButton} 
          onPress={() => {
            // For now just show a simple date selector (will be improved later)
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            setEndDateWithFormat(tomorrow);
            Alert.alert('Notice', "Date picker functionality will be fixed in the next update. Using tomorrow's date for now.");
          }}
        >
          <Text style={styles.dateText}>
            {endDate ? formatDisplayDate(endDate) : 'Select end date'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Create Trip" onPress={createTrip} />
      </View>
    </ScrollView>
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
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
  },
  dateText: {
    fontSize: 16,
    color: '#111',
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
