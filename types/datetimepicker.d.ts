/**
 * Type declarations for @react-native-community/datetimepicker
 * This is a temporary workaround until the actual package works properly with bundling
 */

declare module '@react-native-community/datetimepicker' {
  import { ComponentType } from 'react';
  
  export interface DateTimePickerProps {
    testID?: string;
    value: Date;
    mode?: 'date' | 'time' | 'datetime' | 'countdown';
    display?: 'default' | 'spinner' | 'calendar' | 'clock';
    onChange?: (event: any, date?: Date) => void;
    minimumDate?: Date;
    maximumDate?: Date;
  }
  
  const DateTimePicker: ComponentType<DateTimePickerProps>;
  
  export default DateTimePicker;
}
