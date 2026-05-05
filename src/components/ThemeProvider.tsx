import { useEffect, type ReactNode } from 'react';
import { useSettingsStore } from '../store/settings';
import { getTheme } from '../themes';
import { setActiveXtermTheme } from '../themes/registry';
import type { ThemeVars } from '../themes/types';

interface ThemeProviderProps {
  children: ReactNode;
}

// Resolves the active dark/light mode by merging settings with system pref.
function useEffectiveDark(): boolean {
  const darkMode = useSettingsStore((s) => s.darkMode);
  // We can't usefully cache prefers-color-scheme outside an effect, so the
  // hook below subscribes to it. The returned value here is the best-known
  // current state.
  if (darkMode === 'dark') return true;
  if (darkMode === 'light') return false;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

function applyVars(vars: ThemeVars): void {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const themePreset = useSettingsStore((s) => s.themePreset);
  const darkMode = useSettingsStore((s) => s.darkMode);
  const customTheme = useSettingsStore((s) => s.customTheme);
  const isDark = useEffectiveDark();

  // Apply UI vars + xterm theme whenever inputs change.
  useEffect(() => {
    const theme = getTheme(themePreset);
    let uiVars: ThemeVars;
    let xtermTheme = isDark ? theme.xterm.dark : theme.xterm.light;

    if (themePreset === 'custom' && customTheme) {
      // Layer user overrides over the claude defaults already in customTheme.
      const baseUi = isDark ? theme.ui.dark : theme.ui.light;
      const overrides = isDark ? customTheme.dark : customTheme.light;
      uiVars = { ...baseUi, ...overrides };
    } else {
      uiVars = isDark ? theme.ui.dark : theme.ui.light;
    }

    applyVars(uiVars);

    // Mirror dark state on <html> so prefers-color-scheme-aware CSS
    // libraries can pick it up. Tailwind's darkMode:'class' isn't used by
    // our component code (we use CSS vars), but downstream packages may.
    document.documentElement.classList.toggle('dark', isDark);

    // Update the active xterm theme — registry will apply to every live
    // terminal AND to any registered after this point.
    setActiveXtermTheme(xtermTheme);
  }, [themePreset, isDark, customTheme]);

  // Track system theme changes when in 'system' mode so the effect above re-runs.
  useEffect(() => {
    if (darkMode !== 'system') return;
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    function onChange(): void {
      // Triggering a settings update isn't necessary — useEffectiveDark
      // recomputes and the parent effect re-runs. Force a re-render by
      // bumping a no-op piece of state via the store. Here we just toggle
      // and revert darkMode to itself which causes subscribers to re-run.
      // (zustand fires subscribers when set is called even with same value
      // if reference identity differs.)
      useSettingsStore.setState({ darkMode: 'system' });
    }
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [darkMode]);

  return <>{children}</>;
}
