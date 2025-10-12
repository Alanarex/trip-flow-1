/**
 * Augmentation for react-native types
 * This file adds any missing types or adjusts incorrect types in react-native
 */

// This declaration merges with the existing react-native module
declare module 'react-native' {
  import { ComponentType, ReactNode } from 'react';

  export interface StyleSheetStatic {
    create<T extends StyleSheet<T>>(styles: T): T;
  }
  
  export interface StyleSheet<T> {
    [key: string]: any;
  }
  
  export const StyleSheet: StyleSheetStatic;

  export interface TextProps {
    style?: any;
    children?: ReactNode;
    onPress?: () => void;
  }
  
  export const Text: ComponentType<TextProps>;

  export interface ViewProps {
    style?: any;
    children?: ReactNode;
  }
  
  export const View: ComponentType<ViewProps>;

  export interface ButtonProps {
    title: string;
    onPress?: () => void;
    color?: string;
  }
  
  export const Button: ComponentType<ButtonProps>;

  /** Alert API */
  export interface AlertButton {
    text?: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }

  export interface AlertStatic {
    alert(title: string, message?: string, buttons?: AlertButton[], options?: any): void;
  }

  export const Alert: AlertStatic;

  export interface ScrollViewProps extends ViewProps {
    contentContainerStyle?: any;
  }
  
  export const ScrollView: ComponentType<ScrollViewProps>;

  export interface ActivityIndicatorProps {
    size?: 'small' | 'large' | number;
    color?: string;
  }

  export const ActivityIndicator: ComponentType<ActivityIndicatorProps>;

  export interface FlatListProps<ItemT = any> {
    data?: ItemT[] | null;
    renderItem?: ({ item, index }: { item: ItemT; index: number }) => ReactNode;
    keyExtractor?: (item: ItemT, index: number) => string;
  ListEmptyComponent?: ComponentType<any> | ReactNode | null;
    contentContainerStyle?: any;
  }

  export function FlatList<T = any>(props: FlatListProps<T>): JSX.Element;

  export interface TextInputProps {
    style?: any;
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    placeholderTextColor?: string;
  }
  
  export const TextInput: ComponentType<TextInputProps>;

  export interface TouchableOpacityProps extends ViewProps {
    onPress?: () => void;
  }
  
  export const TouchableOpacity: ComponentType<TouchableOpacityProps>;
  
  // Add any other missing components as needed
}
