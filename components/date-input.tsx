import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

interface DateInputProps {
  label?: string;
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  placeholder?: string;
  required?: boolean;
}

/**
 * A component for manual date input in dd/mm/yyyy format
 */
export default function DateInput({ 
  label = 'Date', 
  value, 
  onChange, 
  placeholder = 'dd/mm/yyyy',
  required = false 
}: DateInputProps) {
  const [error, setError] = useState<string | null>(null);

  // Format validation for dd/mm/yyyy
  const validateDate = (text: string): boolean => {
    if (!text.trim()) {
      setError(required ? 'Date is required' : null);
      return !required;
    }

    // Check format with regex
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/;
    if (!dateRegex.test(text)) {
      setError('Please use format: dd/mm/yyyy');
      return false;
    }

    // Parse the date to check validity
    const [day, month, year] = text.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Check if the date is valid (e.g., not 31/02/2023)
    if (
      date.getFullYear() !== year || 
      date.getMonth() !== month - 1 || 
      date.getDate() !== day
    ) {
      setError('Invalid date');
      return false;
    }

    setError(null);
    return true;
  };

  const handleChange = (text: string) => {
    // Auto-format as user types
    // Remove any non-digit characters
    let cleaned = text.replace(/\D/g, '');
    
    // Format with slashes
    let formatted = '';
    if (cleaned.length > 0) {
      // Add the day
      formatted = cleaned.substring(0, Math.min(2, cleaned.length));
      
      // Add the month
      if (cleaned.length > 2) {
        formatted += '/' + cleaned.substring(2, Math.min(4, cleaned.length));
      }
      
      // Add the year
      if (cleaned.length > 4) {
        formatted += '/' + cleaned.substring(4, Math.min(8, cleaned.length));
      }
    }
    
    // If the user deleted content but we still have a formatted value
    if (text.length < value.length && formatted.endsWith('/')) {
      formatted = formatted.slice(0, -1);
    }
    
    const isValid = cleaned.length === 0 || (cleaned.length === 8 && validateDate(formatted));
    onChange(formatted, isValid);
  };

  // Function to convert dd/mm/yyyy to yyyy-mm-dd for database storage
  const toISOFormat = (dateString: string): string | null => {
    if (!dateString || !validateDate(dateString)) return null;
    
    const [day, month, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
  };

  // Function to convert from yyyy-mm-dd to dd/mm/yyyy for display
  const fromISOFormat = (isoString: string): string => {
    if (!isoString) return '';
    
    try {
      const date = new Date(isoString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return '';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}{required ? '*' : ''}
      </Text>
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null
        ]}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor="#999"
        keyboardType="number-pad"
        maxLength={10} // dd/mm/yyyy = 10 characters
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

// Expose utility functions
export const dateUtils = {
  toISOFormat: (dateString: string): string | null => {
    if (!dateString) return null;
    
    // Check format with regex
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/;
    if (!dateRegex.test(dateString)) return null;
    
    const [day, month, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
  },
  
  fromISOFormat: (isoString: string): string => {
    if (!isoString) return '';
    
    try {
      const date = new Date(isoString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return '';
    }
  },
  
  formatForDisplay: (dateString: string | null): string => {
    if (!dateString) return 'No date set';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  }
};

const styles = StyleSheet.create({
  container: {
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
  inputError: {
    borderColor: '#e53935',
  },
  errorText: {
    color: '#e53935',
    fontSize: 14,
    marginTop: 4,
  }
});
