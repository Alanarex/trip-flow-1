import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { getDb } from '../app/lib/db';

type MapStage = {
  id: string;
  name: string;
  date: string | null;
  lat: number;
  lng: number;
  description: string | null;
};

type TripMapProps = {
  tripId: string;
  onClose?: () => void;
  onStagePress?: (stageId: string) => void;
};

const TripMap = ({ tripId, onClose, onStagePress }: TripMapProps) => {
  const [stages, setStages] = useState<MapStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<MapStage | null>(null);
  const mapRef = useRef<MapView>(null);
  const router = useRouter();

  // Load stages for this trip
  useEffect(() => {
    let cancelled = false;

    const loadStages = async () => {
      try {
        setLoading(true);
        const db = getDb();
        
        // Get all stages with coordinates for this trip
        const stagesData = await db.getAllAsync<MapStage>(
          `SELECT id, name, date, lat, lng, description 
           FROM steps 
           WHERE trip_id = ? AND lat IS NOT NULL AND lng IS NOT NULL
           ORDER BY date ASC, name ASC`,
          [tripId]
        );
        
        if (!cancelled) {
          setStages(stagesData || []);
          
          // Fit map to show all markers if there are stages with coordinates
          if (stagesData && stagesData.length > 0) {
            setTimeout(() => {
              fitMapToMarkers(stagesData);
            }, 1000); // Delay to ensure map is ready
          }
        }
      } catch (error) {
        console.error('Failed to load stages for map:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStages();
    return () => { cancelled = true; };
  }, [tripId]);

  // Format date display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };

  // Fit map to show all markers
  const fitMapToMarkers = (markers: MapStage[]) => {
    if (!mapRef.current || markers.length === 0) return;

    const coordinates = markers.map(marker => ({
      latitude: marker.lat,
      longitude: marker.lng,
    }));

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  };

  // Handle marker press
  const handleMarkerPress = (stage: MapStage) => {
    setSelectedStage(stage);
  };

  // Navigate to stage details
  const handleStageDetailsPress = (stageId: string) => {
    if (onStagePress) {
      onStagePress(stageId);
    } else {
      router.push(`/trips/${tripId}/stages/${stageId}`);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 48.8566, // Default to Paris
          longitude: 2.3522,
          latitudeDelta: 5,
          longitudeDelta: 5,
        }}
      >
        {stages.map(stage => (
          <Marker
            key={stage.id}
            coordinate={{
              latitude: stage.lat,
              longitude: stage.lng,
            }}
            title={stage.name}
            description={stage.description || ''}
            onPress={() => handleMarkerPress(stage)}
          >
            <Callout
              tooltip
              onPress={() => handleStageDetailsPress(stage.id)}
            >
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{stage.name}</Text>
                {stage.date && (
                  <Text style={styles.calloutDate}>{formatDate(stage.date)}</Text>
                )}
                {stage.description && (
                  <Text style={styles.calloutDescription} numberOfLines={2} ellipsizeMode="tail">
                    {stage.description}
                  </Text>
                )}
                <Text style={styles.calloutDetails}>Tap for details</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      
      {stages.length === 0 && !loading && (
        <View style={styles.noStagesContainer}>
          <Text style={styles.noStagesText}>No stages with locations to display.</Text>
          <Text style={styles.noStagesSubtext}>Add locations to your stages to see them on the map.</Text>
        </View>
      )}

      {onClose && (
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={onClose}
        >
          <Text style={styles.closeButtonText}>Close Map</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 350,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  calloutContainer: {
    width: 200,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  calloutDate: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  calloutDetails: {
    color: '#1e88e5',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  noStagesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 20,
  },
  noStagesText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  noStagesSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  }
});

export default TripMap;
