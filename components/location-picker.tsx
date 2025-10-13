import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

type SearchResult = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

type LocationInfo = {
  name: string;
  address?: string;
  lat: number;
  lng: number;
};

type LocationPickerProps = {
  initialLocation?: LocationInfo;
  onLocationSelected: (location: LocationInfo) => void;
};

// Simulated search function for demo purposes
// In a real app, you would use a real geocoding service like Google Places API
const simulateSearch = async (query: string): Promise<SearchResult[]> => {
  // For demo purposes, return some fake results based on the query
  await new Promise(resolve => setTimeout(resolve, 500)); // Fake delay
  
  if (!query || query.trim() === '') {
    return [];
  }
  
  const query_lower = query.toLowerCase();
  
  // Demo locations - replace with real API call
  const demoLocations = [
    { id: '1', name: 'Eiffel Tower', address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France', lat: 48.8584, lng: 2.2945 },
    { id: '2', name: 'Louvre Museum', address: 'Rue de Rivoli, 75001 Paris, France', lat: 48.8606, lng: 2.3376 },
    { id: '3', name: 'Notre-Dame Cathedral', address: '6 Parvis Notre-Dame - Pl. Jean-Paul II, 75004 Paris, France', lat: 48.8530, lng: 2.3499 },
    { id: '4', name: 'Empire State Building', address: '20 W 34th St, New York, NY 10001, USA', lat: 40.7484, lng: -73.9857 },
    { id: '5', name: 'Central Park', address: 'New York, NY, USA', lat: 40.7812, lng: -73.9665 },
    { id: '6', name: 'Tokyo Tower', address: '4-chome-2-8 Shibakoen, Minato City, Tokyo 105-0011, Japan', lat: 35.6586, lng: 139.7454 },
    { id: '7', name: 'Colosseum', address: 'Piazza del Colosseo, 1, 00184 Roma RM, Italy', lat: 41.8902, lng: 12.4922 },
    { id: '8', name: 'Taj Mahal', address: 'Agra, Uttar Pradesh, India', lat: 27.1751, lng: 78.0421 },
    { id: '9', name: 'Great Wall of China', address: 'Huairou District, Beijing, China', lat: 40.4319, lng: 116.5704 },
    { id: '10', name: 'Sydney Opera House', address: 'Bennelong Point, Sydney NSW 2000, Australia', lat: 33.8568, lng: 151.2153 },
  ];
  
  return demoLocations.filter(
    location => 
      location.name.toLowerCase().includes(query_lower) || 
      location.address.toLowerCase().includes(query_lower)
  ).slice(0, 5); // Limit to 5 results for simplicity
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLocation,
  onLocationSelected,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(
    initialLocation || null
  );
  const [loading, setLoading] = useState(false);

  // Perform search when query changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim() === '') {
        setSearchResults([]);
        return;
      }

      try {
        setLoading(true);
        const results = await simulateSearch(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching locations:', error);
        Alert.alert('Error', 'Failed to search locations. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 500); // Debounce search by 500ms

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectLocation = (location: SearchResult) => {
    const locationInfo: LocationInfo = {
      name: location.name,
      address: location.address,
      lat: location.lat,
      lng: location.lng,
    };
    
    setSelectedLocation(locationInfo);
    setSearchQuery('');
    setSearchResults([]);
    onLocationSelected(locationInfo);
  };

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    
    // In a real app, you would use reverse geocoding to get address
    // For simplicity, we'll just use coordinates as the name
    const locationInfo: LocationInfo = {
      name: `Selected Location (${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)})`,
      lat: coordinate.latitude,
      lng: coordinate.longitude,
    };
    
    setSelectedLocation(locationInfo);
    onLocationSelected(locationInfo);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a location..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {loading && <ActivityIndicator style={styles.loadingIndicator} size="small" color="#1e88e5" />}
      </View>

      {searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleSelectLocation(item)}
              >
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultAddress}>{item.address}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <Text style={styles.mapLabel}>Select location on map or search above</Text>
      
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: selectedLocation?.lat || 48.8566, // Default to Paris
          longitude: selectedLocation?.lng || 2.3522,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={handleMapPress}
      >
        {selectedLocation && (
          <Marker
            coordinate={{
              latitude: selectedLocation.lat,
              longitude: selectedLocation.lng,
            }}
            title={selectedLocation.name}
          />
        )}
      </MapView>

      {selectedLocation && (
        <View style={styles.selectedLocation}>
          <Text style={styles.selectedLocationTitle}>Selected Location</Text>
          <Text style={styles.selectedLocationName}>{selectedLocation.name}</Text>
          {selectedLocation.address && (
            <Text style={styles.selectedLocationAddress}>
              {selectedLocation.address}
            </Text>
          )}
          <Text style={styles.selectedLocationCoords}>
            {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
  },
  loadingIndicator: {
    position: 'absolute',
    right: 12,
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 16,
    maxHeight: 200,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  resultAddress: {
    fontSize: 14,
    color: '#666',
  },
  mapLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  map: {
    width: '100%',
    height: 250,
    borderRadius: 8,
  },
  selectedLocation: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  selectedLocationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1565c0',
    marginBottom: 4,
  },
  selectedLocationName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  selectedLocationAddress: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  selectedLocationCoords: {
    fontSize: 12,
    color: '#777',
  },
});

export default LocationPicker;
