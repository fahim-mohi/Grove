import { useEffect, useState } from 'react';
import { useSettingsStore } from '../../store/settings';
import { themeOrder, themes } from '../../themes';
import { ThemePreviewCard } from '../ThemePreviewCard';

const UI_FONTS = [
  { value: 'system-ui', label: 'System' },
  { value: 'Inter', label: 'Inter' },
  { value: 'IBM Plex Sans', label: 'IBM Plex Sans' },
  { value: 'DM Sans', label: 'DM Sans' },
  { value: 'Söhne', label: 'Söhne (if installed)' },
  { value: 'Geist', label: 'Geist' },
  { value: 'Space Grotesk', label: 'Space Grotesk' },
  { value: 'Google Sans', label: 'Google Sans (if installed)' },
];

const TERMINAL_FONTS = [
  { value: 'JetBrains Mono', label: 'JetBrains Mono' },
  { value: 'Fira Code', label: 'Fira Code' },
  { value: 'IBM Plex Mono', label: 'IBM Plex Mono' },
  { value: 'SF Mono', label: 'SF Mono' },
  { value: 'Geist Mono', label: 'Geist Mono' },
  { value: 'Hack', label: 'Hack' },
];

function useEffectiveDark(): boolean {
  const darkMode = useSettingsStore((s) => s.darkMode);
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false,
  );
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (): void => setSystemDark(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  if (darkMode === 'dark') return true;
  if (darkMode === 'light') return false;
  return systemDark;
}

export function AppearanceTab() {
  const themePreset = useSettingsStore((s) => s.themePreset);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const darkMode = useSettingsStore((s) => s.darkMode);
  const setDarkMode = useSettingsStore((s) => s.setDarkMode);
  const isDark = useEffectiveDark();

  const terminalFont = useSettingsStore((s) => s.terminalFont);
  const setTerminalFont = useSettingsStore((s) => s.setTerminalFont);
  const terminalFontSize = useSettingsStore((s) => s.terminalFontSize);
  const setTerminalFontSize = useSettingsStore((s) => s.setTerminalFontSize);
  const cursorStyle = useSettingsStore((s) => s.cursorStyle);
  const setCursorStyle = useSettingsStore((s) => s.setCursorStyle);
  const cursorBlink = useSettingsStore((s) => s.cursorBlink);
  const setCursorBlink = useSettingsStore((s) => s.setCursorBlink);

  return (
    <div className="flex flex-col gap-6 py-1">
      <Section title="Theme">
        <div className="grid grid-cols-3 gap-3">
          {themeOrder.map((id) => (
            <ThemePreviewCard
              key={id}
              theme={themes[id]}
              isDark={isDark}
              selected={themePreset === id}
              onSelect={() => setTheme(id)}
            />
          ))}
        </div>
      </Section>

      <Section title="Dark mode">
        <Segmented
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'Follow system' },
          ]}
          value={darkMode}
          onChange={(v) => setDarkMode(v as typeof darkMode)}
        />
      </Section>

      <Section title="Terminal font">
        <div className="flex flex-wrap items-end gap-3">
          <Select label="Font family" value={terminalFont} onChange={setTerminalFont} options={TERMINAL_FONTS} />
          <NumberStepper
            label="Size"
            value={terminalFontSize}
            min={10}
            max={18}
            onChange={setTerminalFontSize}
            unit="px"
          />
        </div>
      </Section>

      <Section title="Cursor">
        <div className="flex flex-wrap items-center gap-4">
          <Segmented
            options={[
              { value: 'block', label: 'Block' },
              { value: 'underline', label: 'Underline' },
              { value: 'bar', label: 'Bar' },
            ]}
            value={cursorStyle}
            onChange={(v) => setCursorStyle(v as typeof cursorStyle)}
          />
          <Toggle label="Blink" checked={cursorBlink} onChange={setCursorBlink} />
        </div>
      </Section>

      <Section title="UI font (preview only — phase 11)">
        <div className="flex flex-col gap-1">
          <span className="font-ui text-[11px] text-text-muted">
            UI font picker ships in the polish pass. The terminal font
            picker above already drives every active xterm.
          </span>
          <Select label="" value="" disabled options={UI_FONTS} onChange={() => {}} />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-ui text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Select<T extends string>({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      {label && <span className="font-ui text-[12px] font-medium text-text-secondary">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        disabled={disabled}
        className="rounded-control border border-edge bg-input px-3 py-1.5 font-ui text-[13px] text-text-primary outline-none focus-visible:border-accent disabled:opacity-50"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberStepper({
  label,
  value,
  min,
  max,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-ui text-[12px] font-medium text-text-secondary">{label}</span>
      <div className="flex items-center gap-1 rounded-control border border-edge bg-input">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="cursor-pointer px-2 font-ui text-text-secondary hover:text-text-primary"
          aria-label="Decrease"
        >
          −
        </button>
        <span className="min-w-[36px] text-center font-terminal text-[13px] text-text-primary">
          {value}
          {unit ? ` ${unit}` : ''}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="cursor-pointer px-2 font-ui text-text-secondary hover:text-text-primary"
          aria-label="Increase"
        >
          +
        </button>
      </div>
    </label>
  );
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" className="inline-flex rounded-control border border-edge bg-input p-0.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`cursor-pointer rounded-control px-3 py-1 font-ui text-[12px] font-medium transition-colors duration-fast ease-out ${
              active ? 'bg-panel text-text-primary shadow-panel-resting' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex flex-shrink-0 rounded-pill transition-colors duration-fast ease-out ${
          checked ? 'bg-accent' : 'bg-edge'
        }`}
        style={{ width: 32, height: 18 }}
      >
        <span
          aria-hidden
          className="absolute top-0.5 left-0.5 rounded-pill bg-white shadow transition-transform duration-fast ease-out"
          style={{ width: 14, height: 14, transform: checked ? 'translateX(14px)' : 'translateX(0)' }}
        />
      </button>
      <span className="font-ui text-[13px] text-text-primary">{label}</span>
    </label>
  );
}
