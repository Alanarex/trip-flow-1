/**
 * Type declarations for theme.ts
 */

// This adds type information for our theme constants
declare module '@/constants/theme' {
  export type ColorSchemeName = 'light' | 'dark';
  
  export interface ThemeColors {
    text: string;
    background: string;
    tint: string;
    icon: string;
    tabIconDefault: string;
    tabIconSelected: string;
  }
  
  export interface ColorScheme {
    light: ThemeColors;
    dark: ThemeColors;
  }
  
  export const Colors: ColorScheme;
}
