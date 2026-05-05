import type { ThemePreset } from '../store/types';
import { claudeTheme } from './claude';
import { chatgptTheme } from './chatgpt';
import { geminiTheme } from './gemini';
import { linearTheme } from './linear';
import { customTheme } from './custom';
import type { Theme } from './types';

export const themes: Record<ThemePreset, Theme> = {
  claude: claudeTheme,
  chatgpt: chatgptTheme,
  gemini: geminiTheme,
  linear: linearTheme,
  custom: customTheme,
};

export const themeOrder: ThemePreset[] = ['claude', 'chatgpt', 'gemini', 'linear', 'custom'];

export function getTheme(preset: ThemePreset): Theme {
  return themes[preset];
}

export type { Theme } from './types';
