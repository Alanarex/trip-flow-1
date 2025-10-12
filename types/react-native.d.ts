/**
 * Minimal augmentation for react-native types used by this project.
 * Keeps things deliberately simple (uses `any` for style types) to avoid
 * tight coupling with upstream type packages while fixing editor errors.
 */

declare module 'react-native' {
    import { ComponentType, ReactNode } from 'react';

    // Use loose types for styles to avoid importing upstream style types here.
    export type ViewStyle = any;
    export type TextStyle = any;
    export type ImageStyle = any;

    export const StyleSheet: {
        create: <T extends { [key: string]: any }>(styles: T) => T;
    };

    export interface TextProps {
        style?: TextStyle | TextStyle[];
        children?: ReactNode;
        onPress?: () => void;
    }
    export const Text: ComponentType<TextProps>;

    export interface ViewProps {
        style?: ViewStyle | ViewStyle[];
        children?: ReactNode;
    }
    export const View: ComponentType<ViewProps>;

    export interface ButtonProps {
        title: string;
        onPress?: () => void;
        color?: string;
    }
    export const Button: ComponentType<ButtonProps>;

    // Alert API
    export interface AlertButton {
        text?: string;
        onPress?: () => void;
        style?: 'default' | 'cancel' | 'destructive';
    }
    export interface AlertStatic {
        alert(title: string, message?: string, buttons?: AlertButton[] | undefined, options?: any): void;
    }
    export const Alert: AlertStatic;

    export interface ScrollViewProps extends ViewProps {
        contentContainerStyle?: ViewStyle | ViewStyle[];
        // allow controlling keyboard behavior from ScrollView
        keyboardShouldPersistTaps?: 'never' | 'always' | 'handled' | undefined;
    }
    export const ScrollView: ComponentType<ScrollViewProps>;

    export interface TouchableWithoutFeedbackProps {
        onPress?: () => void;
        children?: ReactNode;
    }
    export const TouchableWithoutFeedback: ComponentType<TouchableWithoutFeedbackProps>;

    export interface KeyboardStatic {
        dismiss: () => void;
    }
    export const Keyboard: KeyboardStatic;

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
        style?: TextStyle | TextStyle[];
        value?: string;
        onChangeText?: (text: string) => void;
    onFocus?: () => void;
        placeholder?: string;
        placeholderTextColor?: string;
    }
    export const TextInput: ComponentType<TextInputProps>;

    export interface TouchableOpacityProps extends ViewProps {
        onPress?: () => void;
    }
    export const TouchableOpacity: ComponentType<TouchableOpacityProps>;

    // Minimal Platform typing used by the app
    export const Platform: {
        OS: 'ios' | 'android' | string;
        select?: <T>(obj: { ios?: T; android?: T; default?: T }) => T | undefined;
    };

    // add other minimal declarations as needed
}
