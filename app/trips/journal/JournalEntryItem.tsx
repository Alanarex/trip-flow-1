import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { JournalEntry } from './repo';

type JournalEntryItemProps = {
  entry: JournalEntry;
  onPress: (entry: JournalEntry) => void;
  onDelete?: (entry: JournalEntry) => void;
};

export default function JournalEntryItem({ entry, onPress, onDelete }: JournalEntryItemProps) {
  // Format the date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get the first sentence or truncate text for preview
  const getPreview = (text: string) => {
    const firstSentenceMatch = text.match(/^(.+?)[.!?](\s|$)/);
    if (firstSentenceMatch) {
      return firstSentenceMatch[0].trim();
    }
    return text.length > 100 ? `${text.substring(0, 100)}...` : text;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(entry)}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{entry.title || 'Untitled Entry'}</Text>
          <Text style={styles.date}>{formatDate(entry.created_at)}</Text>
        </View>
        
        <Text style={styles.preview} numberOfLines={2}>
          {getPreview(entry.text)}
        </Text>
        
        <View style={styles.footer}>
          {entry.step_id && (
            <View style={styles.indicator}>
              <Feather name="map-pin" size={14} color="#FF9800" />
              <Text style={styles.indicatorText}>Location</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Image placeholder removed for now */}
      
      {onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(entry)}
        >
          <Feather name="trash-2" size={16} color="#FF5252" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  date: {
    fontSize: 12,
    color: '#757575',
  },
  preview: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  indicatorText: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 4,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
});
