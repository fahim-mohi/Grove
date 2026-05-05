import { useEffect, useRef, useState } from 'react';

// Grove session-accent palette per UI design spec §3.
// Warm but distinct hues — picked to harmonize with the Grove Warm
// canvas without competing with the orange brand accent.
export const SWATCHES = [
  '#D97745', // orange (matches brand accent)
  '#C98A2E', // amber
  '#8A9A5B', // olive
  '#6F8F72', // sage
  '#5E7FA3', // blue
  '#7A6DAE', // violet
  '#B86B75', // rose
  '#6F7378', // slate
] as const;

const HEX_RE = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  onClose?: () => void;
  // When true, picker dismisses itself on click outside / Esc.
  dismissable?: boolean;
}

export function ColorPicker({
  value,
  onChange,
  onClose,
  dismissable = true,
}: ColorPickerProps) {
  const [hex, setHex] = useState(value);
  const [hexValid, setHexValid] = useState(true);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Sync internal hex when value changes externally.
  useEffect(() => {
    setHex(value);
    setHexValid(true);
  }, [value]);

  // Click-outside + Esc dismiss.
  useEffect(() => {
    if (!dismissable) return;
    function onPointer(e: MouseEvent): void {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
    }
    // Defer attach so the click that opened the picker doesn't immediately close it.
    const t = window.setTimeout(() => {
      window.addEventListener('mousedown', onPointer);
      window.addEventListener('keydown', onKey);
    }, 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [dismissable, onClose]);

  function handleSwatch(color: string): void {
    onChange(color);
  }

  function handleHexChange(next: string): void {
    setHex(next);
    if (HEX_RE.test(next)) {
      setHexValid(true);
      // Normalize 3-char hex to 6-char before commit
      const normalized = next.length === 4
        ? `#${next[1]}${next[1]}${next[2]}${next[2]}${next[3]}${next[3]}`
        : next;
      onChange(normalized.toUpperCase());
    } else {
      setHexValid(false);
    }
  }

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label="Choose color"
      className="w-[224px] rounded-control border border-edge bg-modal p-3 shadow-modal"
    >
      <div className="mb-3 flex gap-1.5">
        {SWATCHES.map((swatch) => {
          const selected = swatch.toUpperCase() === value.toUpperCase();
          return (
            <button
              key={swatch}
              type="button"
              onClick={() => handleSwatch(swatch)}
              aria-label={`Color ${swatch}`}
              aria-pressed={selected}
              className="cursor-pointer transition-transform duration-fast ease-out hover:scale-110"
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                backgroundColor: swatch,
                border: `2px solid ${selected ? 'var(--text-primary)' : 'transparent'}`,
                boxShadow: selected
                  ? `0 0 0 1px ${swatch}40`
                  : undefined,
              }}
            />
          );
        })}
      </div>
      <label className="flex items-center gap-2">
        <span className="font-ui text-[11px] font-medium text-text-secondary">Hex</span>
        <input
          type="text"
          value={hex}
          onChange={(e) => handleHexChange(e.target.value)}
          spellCheck={false}
          autoCapitalize="none"
          autoComplete="off"
          className={`flex-1 rounded-control border bg-input px-2 py-1 font-terminal text-xs text-text-primary ${
            hexValid ? 'border-edge' : 'border-danger'
          }`}
          maxLength={7}
        />
      </label>
    </div>
  );
}
