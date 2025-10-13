import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    accessible?: boolean;
    accessibilityRole?: string;
    accessibilityLabel?: string;
  }
  interface TouchableOpacityProps {
    activeOpacity?: number;
  }
  
  interface TextInputProps {
    multiline?: boolean;
    numberOfLines?: number;
    textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center';
  }

  interface TextProps {
    numberOfLines?: number;
    ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  }

  interface ActivityIndicatorProps {
    size?: 'small' | 'large' | number;
    color?: string;
    style?: any;
  }
}
