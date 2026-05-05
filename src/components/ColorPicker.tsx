import { useEffect, useRef, useState } from 'react';

// 12 default swatches (DESIGN.md §6.5). Picked for distinct hue + decent
// contrast in both light and dark modes.
export const SWATCHES = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#EAB308',
  '#84CC16',
  '#22C55E',
  '#14B8A6',
  '#06B6D4',
  '#3B82F6',
  '#6366F1',
  '#A855F7',
  '#EC4899',
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
      <div className="mb-3 grid grid-cols-6 gap-1.5">
        {SWATCHES.map((swatch) => {
          const selected = swatch.toUpperCase() === value.toUpperCase();
          return (
            <button
              key={swatch}
              type="button"
              onClick={() => handleSwatch(swatch)}
              aria-label={`Color ${swatch}`}
              aria-pressed={selected}
              className={`h-6 w-6 cursor-pointer rounded-control transition-transform duration-fast ease-out hover:scale-110 ${
                selected ? 'ring-2 ring-offset-2' : ''
              }`}
              style={{
                backgroundColor: swatch,
                ...(selected
                  ? {
                      boxShadow: `0 0 0 2px var(--bg-modal), 0 0 0 4px var(--accent-ring)`,
                    }
                  : {}),
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
