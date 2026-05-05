import type { ITheme } from '@xterm/xterm';
import type { ThemePreset } from '../store/types';

export type ThemeVars = Record<string, string>;

export interface Theme {
  id: ThemePreset;
  // Display name shown in the theme switcher
  label: string;
  ui: {
    light: ThemeVars;
    dark: ThemeVars;
  };
  xterm: {
    light: ITheme;
    dark: ITheme;
  };
}
