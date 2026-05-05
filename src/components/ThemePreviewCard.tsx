import type { Theme } from '../themes';

interface ThemePreviewCardProps {
  theme: Theme;
  isDark: boolean;
  selected: boolean;
  onSelect: () => void;
}

// Miniature preview: tiny toolbar bar, sidebar block, two panel rectangles
// — all painted with the actual theme's CSS values for visual fidelity.
export function ThemePreviewCard({ theme, isDark, selected, onSelect }: ThemePreviewCardProps) {
  const v = isDark ? theme.ui.dark : theme.ui.light;
  const canvas = v['--bg-canvas'] ?? '#FFFFFF';
  const sidebar = v['--bg-sidebar'] ?? '#F0F0F0';
  const panel = v['--bg-panel'] ?? '#FFFFFF';
  const panelHead = v['--bg-panel-header'] ?? '#F0F0F0';
  const accent = v['--accent'] ?? '#000000';
  const border = v['--border-default'] ?? 'rgba(0,0,0,0.1)';
  const radius = v['--radius-panel'] ?? '8px';

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${theme.label} theme`}
      aria-pressed={selected}
      className={`group relative cursor-pointer overflow-hidden rounded-control border transition-transform duration-fast ease-out hover:scale-[1.02] ${
        selected ? 'border-accent' : 'border-edge'
      }`}
      style={{
        width: 132,
        height: 96,
        background: canvas,
        ...(selected ? { boxShadow: `0 0 0 2px var(--accent-ring)` } : {}),
      }}
    >
      <div className="absolute inset-0 flex flex-col">
        {/* fake toolbar */}
        <div
          className="flex items-center gap-1 px-2"
          style={{ height: 12, background: panelHead, borderBottom: `1px solid ${border}` }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 999, background: accent }} />
        </div>
        <div className="flex flex-1">
          {/* fake sidebar */}
          <div style={{ width: 28, background: sidebar, borderRight: `1px solid ${border}` }} />
          {/* canvas area with two stacked panel rects */}
          <div className="relative flex-1">
            <div
              className="absolute"
              style={{
                top: 8,
                left: 6,
                width: 56,
                height: 30,
                background: panel,
                borderRadius: parseInt(radius) >= 12 ? 4 : 2,
                border: `1px solid ${border}`,
              }}
            />
            <div
              className="absolute"
              style={{
                top: 28,
                left: 36,
                width: 50,
                height: 28,
                background: panel,
                borderRadius: parseInt(radius) >= 12 ? 4 : 2,
                border: `1px solid ${border}`,
              }}
            />
          </div>
        </div>
      </div>
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 px-2 py-1 text-left font-ui text-[10px] font-semibold"
        style={{
          color: v['--text-primary'],
          background: `linear-gradient(to top, ${canvas} 60%, transparent)`,
        }}
      >
        {theme.label}
      </div>
    </button>
  );
}
