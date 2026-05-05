import { useMemo, useState } from 'react';
import { useSettingsStore } from '../../store/settings';
import { themes } from '../../themes';

// Variables exposed in the editor, grouped by section. Skipping shadows/
// fonts/density for V1 — they're either taste-niche (shadows) or covered
// by the Appearance tab (fonts).
const SECTIONS: Array<{ title: string; vars: Array<{ key: string; label: string }> }> = [
  {
    title: 'Surfaces',
    vars: [
      { key: '--bg-canvas', label: 'Canvas' },
      { key: '--bg-panel', label: 'Panel' },
      { key: '--bg-panel-header', label: 'Panel header' },
      { key: '--bg-sidebar', label: 'Sidebar' },
      { key: '--bg-toolbar', label: 'Toolbar' },
      { key: '--bg-modal', label: 'Modal' },
      { key: '--bg-input', label: 'Input' },
    ],
  },
  {
    title: 'Borders',
    vars: [
      { key: '--border-default', label: 'Default' },
      { key: '--border-strong', label: 'Strong' },
    ],
  },
  {
    title: 'Text',
    vars: [
      { key: '--text-primary', label: 'Primary' },
      { key: '--text-secondary', label: 'Secondary' },
      { key: '--text-muted', label: 'Muted' },
    ],
  },
  {
    title: 'Accent',
    vars: [
      { key: '--accent', label: 'Accent' },
      { key: '--accent-hover', label: 'Accent hover' },
      { key: '--accent-pressed', label: 'Accent pressed' },
    ],
  },
];

// Convert CSS color (hex or rgba) to a 6-char hex for use with the
// native <input type=color> picker. rgba() values get their alpha dropped
// and we fall back to black if parsing fails.
function toHex(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('#')) {
    if (trimmed.length === 7) return trimmed;
    if (trimmed.length === 4) {
      const r = trimmed[1]!;
      const g = trimmed[2]!;
      const b = trimmed[3]!;
      return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
    }
  }
  const m = trimmed.match(/rgba?\(([^)]+)\)/i);
  if (m && m[1]) {
    const parts = m[1].split(',').map((p) => parseFloat(p.trim()));
    const [r = 0, g = 0, b = 0] = parts;
    return `#${[r, g, b]
      .map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()}`;
  }
  return '#000000';
}

function relativeLuminance(hex: string): number {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return 0;
  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;
  const linear = (c: number): number => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrast(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

type Mode = 'light' | 'dark';

export function ThemeEditorTab() {
  const themePreset = useSettingsStore((s) => s.themePreset);
  const customTheme = useSettingsStore((s) => s.customTheme);
  const setCustomTheme = useSettingsStore((s) => s.setCustomTheme);
  const [mode, setMode] = useState<Mode>('light');
  const [importError, setImportError] = useState<string | null>(null);

  // Resolve current values: start from claude defaults, layer customTheme overrides.
  const baseLight = useMemo(() => themes.claude.ui.light, []);
  const baseDark = useMemo(() => themes.claude.ui.dark, []);

  const currentVars: Record<string, string> = useMemo(() => {
    const base = mode === 'light' ? baseLight : baseDark;
    const overrides = customTheme ? (mode === 'light' ? customTheme.light : customTheme.dark) : {};
    return { ...base, ...overrides };
  }, [mode, customTheme, baseLight, baseDark]);

  if (themePreset !== 'custom') {
    return (
      <div className="py-2">
        <p className="font-ui text-[13px] text-text-secondary">
          Switch the theme preset to <strong>Custom</strong> in the Appearance tab to
          enable the editor.
        </p>
      </div>
    );
  }

  function setVar(key: string, value: string): void {
    const next = customTheme
      ? { ...customTheme }
      : { name: 'My Theme', light: {} as Record<string, string>, dark: {} as Record<string, string> };
    if (mode === 'light') next.light = { ...next.light, [key]: value };
    else next.dark = { ...next.dark, [key]: value };
    setCustomTheme(next);
  }

  function resetToClaude(): void {
    setCustomTheme({ name: 'My Theme', light: {}, dark: {} });
  }

  function exportJson(): void {
    const data = JSON.stringify(
      {
        version: 1,
        name: customTheme?.name ?? 'My Theme',
        light: customTheme?.light ?? {},
        dark: customTheme?.dark ?? {},
      },
      null,
      2,
    );
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(customTheme?.name ?? 'theme').replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = (): void => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (): void => {
        try {
          const parsed = JSON.parse(String(reader.result));
          if (typeof parsed !== 'object' || !parsed) throw new Error('not an object');
          setCustomTheme({
            name: typeof parsed.name === 'string' ? parsed.name : 'Imported Theme',
            light: parsed.light ?? {},
            dark: parsed.dark ?? {},
          });
          setImportError(null);
        } catch (err) {
          setImportError(`Could not import theme JSON — ${(err as Error).message}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // Quick contrast check on the most-load-bearing pair.
  const textOnPanel = contrast(toHex(currentVars['--text-primary'] ?? '#000'), toHex(currentVars['--bg-panel'] ?? '#FFF'));

  return (
    <div className="flex flex-col gap-4 py-1">
      <div className="flex items-center justify-between">
        <h3 className="font-ui text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Theme editor
        </h3>
        <div className="flex items-center gap-1 rounded-control border border-edge bg-input p-0.5">
          {(['light', 'dark'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`cursor-pointer rounded-control px-3 py-0.5 font-ui text-[12px] capitalize transition-colors duration-fast ease-out ${
                mode === m ? 'bg-panel text-text-primary shadow-panel-resting' : 'text-text-secondary'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Live preview — mini canvas */}
      <div
        className="overflow-hidden rounded-panel border border-edge"
        style={{
          height: 96,
          background: currentVars['--bg-canvas'],
          borderColor: currentVars['--border-default'],
        }}
      >
        <div className="flex h-full">
          <div
            style={{
              width: 32,
              background: currentVars['--bg-sidebar'],
              borderRight: `1px solid ${currentVars['--border-default']}`,
            }}
          />
          <div className="relative flex-1 p-2">
            <div
              style={{
                background: currentVars['--bg-panel'],
                border: `1px solid ${currentVars['--border-default']}`,
                borderRadius: 6,
                padding: 4,
              }}
            >
              <div
                style={{
                  width: '70%',
                  height: 4,
                  background: currentVars['--text-primary'],
                  opacity: 0.85,
                  borderRadius: 2,
                  marginBottom: 3,
                }}
              />
              <div
                style={{
                  width: '50%',
                  height: 3,
                  background: currentVars['--accent'],
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {importError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-control border px-3 py-2 font-ui text-[12px]"
          style={{
            background: 'rgba(220, 38, 38, 0.10)',
            borderColor: 'rgba(220, 38, 38, 0.50)',
            color: 'var(--danger)',
          }}
        >
          <span className="flex-1">{importError}</span>
          <button
            type="button"
            onClick={() => setImportError(null)}
            aria-label="Dismiss"
            className="cursor-pointer text-text-muted hover:text-text-primary"
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
              <path d="M6 6L18 18M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}

      {textOnPanel < 4.5 && (
        <div
          className="rounded-control border px-3 py-2 font-ui text-[12px]"
          style={{ background: 'var(--accent-soft)', borderColor: 'var(--warning)', color: 'var(--warning)' }}
        >
          Text-primary on panel-background contrast is {textOnPanel.toFixed(2)}:1, below the WCAG AA
          threshold of 4.5:1.
        </div>
      )}

      {SECTIONS.map((section) => (
        <div key={section.title} className="flex flex-col gap-2">
          <h4 className="font-ui text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            {section.title}
          </h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {section.vars.map((v) => {
              const value = currentVars[v.key] ?? '';
              const hex = toHex(value);
              return (
                <label key={v.key} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={hex}
                    onChange={(e) => setVar(v.key, e.target.value.toUpperCase())}
                    className="cursor-pointer border-none bg-transparent"
                    style={{ width: 22, height: 22, padding: 0 }}
                    aria-label={v.label}
                  />
                  <span className="flex-1 truncate font-ui text-[12px] text-text-primary">{v.label}</span>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setVar(v.key, e.target.value)}
                    spellCheck={false}
                    className="w-[112px] rounded-control border border-edge bg-input px-2 py-0.5 font-terminal text-[10px] text-text-primary outline-none"
                  />
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-edge pt-3">
        <button
          type="button"
          onClick={resetToClaude}
          className="cursor-pointer rounded-control border border-edge bg-modal px-3 py-1.5 font-ui text-[12px] font-medium text-text-primary transition-colors duration-fast ease-out hover:bg-sidebarHover"
        >
          Reset to Claude defaults
        </button>
        <button
          type="button"
          onClick={exportJson}
          className="cursor-pointer rounded-control border border-edge bg-modal px-3 py-1.5 font-ui text-[12px] font-medium text-text-primary transition-colors duration-fast ease-out hover:bg-sidebarHover"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={importJson}
          className="cursor-pointer rounded-control border border-edge bg-modal px-3 py-1.5 font-ui text-[12px] font-medium text-text-primary transition-colors duration-fast ease-out hover:bg-sidebarHover"
        >
          Import JSON
        </button>
      </div>
    </div>
  );
}
