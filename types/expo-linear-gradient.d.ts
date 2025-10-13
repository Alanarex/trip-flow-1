declare module 'expo-linear-gradient' {
  import { ComponentType, ReactNode } from 'react';
    import { ViewStyle } from 'react-native';

  export interface LinearGradientProps {
    colors: string[];
    locations?: number[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    style?: ViewStyle | ViewStyle[];
    children?: ReactNode;
  }

  export const LinearGradient: ComponentType<LinearGradientProps>;
}
