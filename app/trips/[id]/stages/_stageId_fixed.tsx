import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LocationPicker from '../../../../components/location-picker';
import { useSession } from '../../../auth';
import { getDb, tx } from '../../../lib/db';

type StageDetails = {
  id: string;
  name: string;
  date: string | null;
  description: string | null;
  lat: number | null;
  lng: number | null;
};

export default function StageDetails() {
  const { id, stageId } = useLocalSearchParams<{ id: string; stageId: string }>();
  const router = useRouter();
  const { user } = useSession();

  const [stage, setStage] = useState<StageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  
  // Edit form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ name: string; lat: number; lng: number } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadStage = async () => {
      if (!id || !stageId || !user?.id) return;
      
      try {
        setLoading(true);
        
        const db = getDb();
        const stageData = await db.getFirstAsync<StageDetails>(
          `SELECT id, name, date, description, lat, lng
           FROM steps
           WHERE id = ? AND trip_id = ?
           LIMIT 1`,
          [stageId, id]
        );

        if (!cancelled) {
          if (stageData) {
            setStage(stageData);
            
            // Initialize edit form state
            setName(stageData.name);
            setDescription(stageData.description || '');
            
            // Initialize location if available
            if (stageData.lat !== null && stageData.lng !== null) {
              setLocation({
                name: stageData.name,
                lat: stageData.lat,
                lng: stageData.lng
              });
            }
          } else {
            Alert.alert('Error', 'Stage not found');
            router.back();
          }
        }
      } catch (error) {
        console.error('Failed to load stage details:', error);
        if (!cancelled) {
          Alert.alert('Error', 'Failed to load stage details');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStage();
    return () => { cancelled = true; };
  }, [id, stageId, user?.id]);

  // Format display date for viewing (used for existing dates in database)
  const formatDisplayDate = (dateStr: string | null): string => {
    if (!dateStr) return 'No date set';
    
    try {
      const parsed = new Date(dateStr);
      return parsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const updateStage = async () => {
    if (!id || !stageId || !user?.id) {
      Alert.alert('Error', 'Missing required IDs');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter a name for the stage');
      return;
    }

    try {
      await tx(async (database) => {
        await database.runAsync(
          `UPDATE steps
           SET name = ?, date = ?, description = ?, lat = ?, lng = ?
           WHERE id = ? AND trip_id = ?`,
          [
            name.trim(), 
            null, // No date for now
            description.trim() || null,
            location ? location.lat : null,
            location ? location.lng : null,
            stageId, 
            id
          ]
        );
      });

      // Update local state
      if (stage) {
        const updatedStage = {
          ...stage,
          name: name.trim(),
          date: null, // No date for now
          description: description.trim() || null,
          lat: location?.lat || null,
          lng: location?.lng || null
        };
        setStage(updatedStage);
      }

      setEditMode(false);
      Alert.alert('Success', 'Stage updated successfully');
    } catch (error) {
      console.error('Failed to update stage:', error);
      Alert.alert('Error', 'Failed to update stage. Please try again.');
    }
  };

  const deleteStage = () => {
    if (!id || !stageId || !user?.id || !stage) return;
    
    Alert.alert(
      "Delete Stage",
      `Are you sure you want to delete "${stage.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await tx(async (database) => {
                await database.runAsync('DELETE FROM steps WHERE id = ? AND trip_id = ?', [stageId, id]);
              });
              
              // Navigate back to stages list
              router.replace(`/trips/${id}/stages`);
            } catch (error) {
              console.error('Failed to delete stage:', error);
              Alert.alert('Error', 'Failed to delete stage. Please try again.');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1e88e5" />
        <Text style={styles.loadingText}>Loading stage details...</Text>
      </View>
    );
  }

  if (!stage) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Stage not found</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.replace(`/trips/${id}/stages`)}
        >
          <Text style={styles.backButtonText}>Return to Stages List</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

        {editMode ? (
          // EDIT MODE
          <>
            <Text style={styles.title}>Edit Stage</Text>

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

            {/* Date picker removed */}

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
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Location</Text>
              <LocationPicker 
                initialLocation={location || undefined}
                onLocationSelected={(locationInfo) => {
                  setLocation({
                    name: locationInfo.name,
                    lat: locationInfo.lat,
                    lng: locationInfo.lng
                  });
                }}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  // Reset form and exit edit mode
                  setName(stage.name);
                  setDescription(stage.description || '');
                  setEditMode(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={updateStage}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // VIEW MODE
          <>
            <Text style={styles.title}>{stage.name}</Text>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDisplayDate(stage.date)}</Text>
            </View>
            
            {stage.description && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{stage.description}</Text>
              </View>
            )}
            
            {(stage.lat && stage.lng) ? (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>
                  {stage.lat.toFixed(6)}, {stage.lng.toFixed(6)}
                </Text>
                <TouchableOpacity 
                  style={styles.mapButton}
                  onPress={() => {
                    // This will be implemented in Phase 3
                    Alert.alert('Info', 'Map view will be implemented in Phase 3');
                  }}
                >
                  <Text style={styles.mapButtonText}>View on Map</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>No location set</Text>
                <TouchableOpacity 
                  style={styles.mapButton}
                  onPress={() => {
                    // This will be implemented in Phase 3
                    Alert.alert('Info', 'Adding locations will be implemented in Phase 3');
                  }}
                >
                  <Text style={styles.mapButtonText}>Add Location</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.editButton]}
                onPress={() => setEditMode(true)}
              >
                <Text style={styles.editButtonText}>Edit Stage</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.dangerZone}>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={deleteStage}
              >
                <Text style={styles.deleteButtonText}>Delete Stage</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
  centerContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 16,
    color: '#111',
  },
  detailSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#111',
  },
  mapButton: {
    backgroundColor: '#e1f5fe',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginTop: 8,
  },
  mapButtonText: {
    color: '#0288d1',
    fontSize: 14,
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
  actionButtons: {
    marginTop: 24,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#1e88e5',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4caf50',
    flex: 3,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 2,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  dangerZone: {
    marginTop: 32,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    borderRadius: 8,
    backgroundColor: '#ffebee',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c62828',
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: '#c62828',
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  errorText: {
    color: '#c62828',
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#1e88e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  }
});
