import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import DateInput, { dateUtils } from '../../../components/date-input';
import { useSession } from '../../auth';
import { getDb, tx } from '../../lib/db';

type TripDetails = {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  cover_uri: string | null;
};

export default function EditTrip() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();

  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    let cancelled = false;

    const loadTrip = async () => {
      if (!id || !user?.id) return;
      
      try {
        setLoading(true);
        
        const db = getDb();
        const tripData = await db.getFirstAsync<TripDetails>(
          `SELECT id, title, start_date, end_date, cover_uri
           FROM trips
           WHERE id = ? AND user_id = ?
           LIMIT 1`,
          [id, user.id]
        );

        if (!cancelled) {
          if (tripData) {
            setTitle(tripData.title);
            
            // Convert ISO format to dd/mm/yyyy if dates exist
            if (tripData.start_date) {
              setStartDateInput(dateUtils.fromISOFormat(tripData.start_date));
            }
            
            if (tripData.end_date) {
              setEndDateInput(dateUtils.fromISOFormat(tripData.end_date));
            }
          } else {
            Alert.alert('Error', 'Trip not found');
            router.back();
          }
        }
      } catch (error) {
        console.error('Failed to load trip details:', error);
        if (!cancelled) {
          Alert.alert('Error', 'Failed to load trip details');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTrip();
    return () => { cancelled = true; };
  }, [id, user?.id]);

  const handleCloseAll = () => {
    // Close keyboard
    Keyboard.dismiss();
  };

  const updateTrip = async () => {
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

      // Ensure start date is before or equal to end date if both are provided
      if (startIsoDate && endIsoDate) {
        const startDate = new Date(startIsoDate);
        const endDate = new Date(endIsoDate);
        if (startDate > endDate) {
          setStatus({ type: 'error', msg: 'Start date must be before or equal to end date' });
          return;
        }
      }

      if (!user || !id) {
        setStatus({ type: 'error', msg: 'Authentication error. Please log in again.' });
        return;
      }

      await tx(async (database) => {
        await database.runAsync(
          `UPDATE trips 
           SET title = ?, start_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ? AND user_id = ?`,
          [title.trim(), startIsoDate, endIsoDate, id, user.id]
        );
      });

      setStatus({ type: 'ok', msg: 'Trip updated successfully!' });
      
      // Navigate back to trip details after short delay
      setTimeout(() => {
        router.replace(`/trips/${id}`);
      }, 1000);
    } catch (error) {
      console.error('Failed to update trip:', error);
      setStatus({ type: 'error', msg: 'Failed to update trip. Please try again.' });
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleCloseAll}>
      <ScrollView style={styles.container}>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Edit Trip</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Trip Title*</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Summer Vacation in Europe"
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

        {status.type && (
          <View
            style={[
              styles.statusContainer,
              status.type === 'error' ? styles.errorContainer : styles.successContainer,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                status.type === 'error' ? styles.errorText : styles.successText,
              ]}
            >
              {status.msg}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            !title || !isStartDateValid || !isEndDateValid ? styles.buttonDisabled : null,
          ]}
          onPress={updateTrip}
          disabled={!title || !isStartDateValid || !isEndDateValid}
        >
          <Text style={styles.buttonText}>Update Trip</Text>
        </TouchableOpacity>
      </ScrollView>
    </TouchableWithoutFeedback>
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
    color: '#333',
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
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1e88e5',
    padding: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: '#b0bec5',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ef5350',
  },
  successContainer: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#66bb6a',
  },
  statusText: {
    fontSize: 14,
  },
  errorText: {
    color: '#d32f2f',
  },
  successText: {
    color: '#388e3c',
  },
});
