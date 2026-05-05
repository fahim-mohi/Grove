import type { Theme } from './types';
import { claudeTheme } from './claude';

// Custom theme — defaults to a clone of claude. The actual values used at
// runtime are read from settings.customTheme via the ThemeProvider, which
// merges any user overrides on top of these defaults.
export const customTheme: Theme = {
  ...claudeTheme,
  id: 'custom',
  label: 'Custom',
};
