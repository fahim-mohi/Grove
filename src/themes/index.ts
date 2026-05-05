import type { ThemePreset } from '../store/types';
import { claudeTheme } from './claude';
import { groveDarkTheme } from './grove-dark';
import { paperTheme } from './paper';
import { terminalBlackTheme } from './terminal-black';
import { linearTheme } from './linear';
import { chatgptTheme } from './chatgpt';
import { geminiTheme } from './gemini';
import { customTheme } from './custom';
import type { Theme } from './types';

export const themes: Record<ThemePreset, Theme> = {
  claude: claudeTheme,
  'grove-dark': groveDarkTheme,
  paper: paperTheme,
  'terminal-black': terminalBlackTheme,
  linear: linearTheme,
  chatgpt: chatgptTheme,
  gemini: geminiTheme,
  custom: customTheme,
};

// Display order — Grove-native presets first (per UI spec §13), bonus
// product-tribute themes (chatgpt / gemini) at the end, custom always last.
export const themeOrder: ThemePreset[] = [
  'claude',
  'grove-dark',
  'paper',
  'terminal-black',
  'linear',
  'chatgpt',
  'gemini',
  'custom',
];

export function getTheme(preset: ThemePreset): Theme {
  return themes[preset];
}

export type { Theme } from './types';
