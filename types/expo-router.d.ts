/**
 * Type definitions for expo-router
 */

declare module 'expo-router' {
  import { ComponentType, ReactNode } from 'react';
  
  export interface RouterProps {
    replace: (href: string) => void;
    push: (href: string | { pathname: string; params: Record<string, string> }) => void;
    back: () => void;
  }
  
  export function useRouter(): RouterProps;
  
  export function usePathname(): string | null;
  
  export function useLocalSearchParams<T extends Record<string, string>>(): T;
  
  export const Slot: ComponentType<{ children?: ReactNode }>;
  
  export const Redirect: ComponentType<{ href: string }>;
  
  export const Tabs: {
    Screen: ComponentType<{
      name: string;
      options?: {
        title?: string;
        tabBarIcon?: (props: { color: string }) => ReactNode;
      };
    }>;
  } & ComponentType<{
    screenOptions?: {
      tabBarActiveTintColor?: string;
      headerShown?: boolean;
      tabBarButton?: ComponentType<any>;
    };
    children?: ReactNode;
  }>;
}
