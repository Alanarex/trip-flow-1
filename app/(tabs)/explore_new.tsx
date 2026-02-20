import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
      </View>

      <View style={styles.comingSoonContainer}>
        <Ionicons name="map" size={80} color="#1e88e5" style={styles.icon} />
        <Text style={styles.comingSoonText}>Coming Soon!</Text>
        <Text style={styles.description}>
          This section will allow you to explore popular destinations,
          get travel inspiration, and discover new places to visit.
        </Text>
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Planned Features:</Text>
          <View style={styles.featureItem}>
            <Ionicons name="search" size={24} color="#666" />
            <Text style={styles.featureText}>Discover popular destinations</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="compass" size={24} color="#666" />
            <Text style={styles.featureText}>Find local attractions</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="heart" size={24} color="#666" />
            <Text style={styles.featureText}>Save places to your wishlist</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="trending-up" size={24} color="#666" />
            <Text style={styles.featureText}>View trending locations</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    marginBottom: 20,
  },
  comingSoonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  featuresContainer: {
    width: '100%',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginTop: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});
